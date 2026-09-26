import {
  createPhotoStorage,
  profilePhotoStorage,
  postPhotoStorage,
} from '../photoStorage';

const mockFiles = [];

jest.mock('expo-file-system', () => {
  class MockFile {
    constructor(base, name) {
      this.uri = name ? `${base.uri}${name}` : base;
      this.exists = !this.uri.includes('missing');
      this.copy = jest.fn().mockResolvedValue(undefined);
      this.delete = jest.fn(() => {
        if (this.uri.includes('locked')) throw new Error('bloqueado');
      });
      mockFiles.push(this);
    }
  }
  return {
    File: MockFile,
    Paths: { document: { uri: 'file:///docs/' } },
  };
});

describe('photoStorage', () => {
  const storage = createPhotoStorage('test-photo-');

  beforeEach(() => {
    mockFiles.length = 0;
    jest.spyOn(Date, 'now').mockReturnValue(123);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve copiar a foto do cache para a pasta de documentos', async () => {
    const uri = await storage.persist('file:///cache/picker.jpg');

    expect(uri).toMatch(/^file:\/\/\/docs\/test-photo-123-\d+\.jpg$/);
    const [destination, source] = mockFiles;
    expect(source.uri).toBe('file:///cache/picker.jpg');
    expect(source.copy).toHaveBeenCalledWith(destination);
  });

  it('deve gerar nomes diferentes ao salvar várias fotos ao mesmo tempo', async () => {
    const uris = await storage.persistAll([
      'file:///cache/a.jpg',
      'file:///docs/test-photo-1-1.jpg',
      'file:///cache/b.jpg',
    ]);

    expect(uris[1]).toBe('file:///docs/test-photo-1-1.jpg');
    expect(uris[0]).not.toBe(uris[2]);
    expect(uris[0]).toMatch(/test-photo-123-/);
  });

  it('não deve copiar uma foto já salva nem valores vazios', async () => {
    await expect(
      storage.persist('file:///docs/test-photo-1-1.jpg')
    ).resolves.toBe('file:///docs/test-photo-1-1.jpg');
    await expect(storage.persist(null)).resolves.toBeNull();
    expect(mockFiles).toHaveLength(0);
  });

  it('deve apagar apenas fotos salvas por este armazenamento e ignorar falhas', () => {
    storage.remove('file:///docs/test-photo-1.jpg');
    expect(mockFiles[0].delete).toHaveBeenCalledTimes(1);

    storage.remove('file:///docs/test-photo-missing.jpg');
    expect(mockFiles[1].delete).not.toHaveBeenCalled();

    expect(() =>
      storage.remove('file:///docs/test-photo-locked.jpg')
    ).not.toThrow();

    // Fotos de outros tipos ou fora da pasta não são tocadas
    storage.remove('file:///docs/profile-photo-1.jpg');
    storage.remove('file:///cache/picker.jpg');
    storage.remove(null);
    expect(mockFiles).toHaveLength(3);
  });

  it('deve apagar várias fotos de uma vez', () => {
    storage.removeAll([
      'file:///docs/test-photo-1.jpg',
      'file:///docs/test-photo-2.jpg',
    ]);

    expect(mockFiles).toHaveLength(2);
    mockFiles.forEach((file) => expect(file.delete).toHaveBeenCalled());
  });

  it('deve separar as fotos de perfil das fotos dos registros', async () => {
    await expect(
      profilePhotoStorage.persist('file:///cache/a.jpg')
    ).resolves.toMatch(/profile-photo-/);
    await expect(
      postPhotoStorage.persist('file:///cache/a.jpg')
    ).resolves.toMatch(/post-photo-/);
  });
});
