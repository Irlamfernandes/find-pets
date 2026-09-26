import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionService } from '../sessionService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('../../../../testing/memoryStorage').createAsyncStorageMock()
);

describe('sessionService', () => {
  beforeEach(() => {
    AsyncStorage.__backend.reset();
    jest.clearAllMocks();
  });

  it('deve gravar, ler e encerrar a sessão', async () => {
    await expect(sessionService.getSession()).resolves.toBeNull();

    await sessionService.saveSession({ usuario: 'ana@x.com' });
    await expect(sessionService.getSession()).resolves.toEqual({
      usuario: 'ana@x.com',
    });
    await expect(sessionService.getCurrentUser()).resolves.toBe('ana@x.com');

    await sessionService.clearSession();
    await expect(sessionService.getCurrentUser()).resolves.toBeNull();
  });

  it('deve recusar dados de sessão vazios', async () => {
    await expect(sessionService.saveSession(null)).rejects.toThrow(
      'Dados de sessão inválidos.'
    );
  });

  it('deve informar as falhas do armazenamento', async () => {
    const failure = new Error('indisponível');
    AsyncStorage.setItem.mockRejectedValueOnce(failure);
    AsyncStorage.getItem.mockRejectedValueOnce(failure);
    AsyncStorage.removeItem.mockRejectedValueOnce(failure);

    await expect(sessionService.saveSession({ usuario: 'a' })).rejects.toThrow(
      'Erro ao persistir sessão: indisponível'
    );
    await expect(sessionService.getSession()).rejects.toThrow(
      'Erro ao buscar sessão ativa: indisponível'
    );
    await expect(sessionService.clearSession()).rejects.toThrow(
      'Erro ao encerrar a sessão: indisponível'
    );
  });
});
