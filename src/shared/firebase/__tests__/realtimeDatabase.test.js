import { get } from 'firebase/database';
import { readChangedSince, readValue, writeValue } from '../realtimeDatabase';
import { readFirebase, resetFirebase } from '../../../testing/firebaseMock';
import { OfflineError } from '../remoteCall';

describe('realtimeDatabase', () => {
  beforeEach(() => resetFirebase());

  it('deve gravar com a hora do servidor e ler de volta', async () => {
    await writeValue('posts/1', { petName: 'Rex', foundInfo: null });

    expect(readFirebase('posts/1')).toEqual({
      petName: 'Rex',
      serverUpdatedAt: 1,
    });
    await expect(readValue('posts/1')).resolves.toEqual({
      petName: 'Rex',
      serverUpdatedAt: 1,
    });
  });

  it('deve devolver null quando não há nada no caminho', async () => {
    await expect(readValue('profiles/ninguem')).resolves.toBeNull();
  });

  it('deve listar só o que mudou a partir da data, do mais antigo ao mais novo', async () => {
    await writeValue('posts/a', { id: 'a' });
    await writeValue('posts/b', { id: 'b' });
    await writeValue('posts/a', { id: 'a', petName: 'Rex' });

    await expect(readChangedSince('posts', 0)).resolves.toEqual([
      { id: 'b', serverUpdatedAt: 2 },
      { id: 'a', petName: 'Rex', serverUpdatedAt: 3 },
    ]);
    await expect(readChangedSince('posts', 3)).resolves.toEqual([
      { id: 'a', petName: 'Rex', serverUpdatedAt: 3 },
    ]);
    await expect(readChangedSince('vazio', 0)).resolves.toEqual([]);
  });

  it('deve avisar quando está sem conexão', async () => {
    get.mockRejectedValueOnce(new Error('Client is offline.'));

    await expect(readValue('posts/1')).rejects.toBeInstanceOf(OfflineError);
  });
});
