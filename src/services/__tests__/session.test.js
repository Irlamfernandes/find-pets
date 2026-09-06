import { sessionService } from '../session';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('sessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve salvar a sessão com sucesso', async () => {
    AsyncStorage.setItem.mockResolvedValueOnce();

    const userData = { type: 'biometric', email: 'teste@test.com' };
    await expect(sessionService.saveSession(userData)).resolves.toBeUndefined();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@FindPets:session',
      JSON.stringify(userData)
    );
  });

  it('deve lançar erro ao falhar ao salvar a sessão', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

    const userData = { type: 'biometric' };
    await expect(sessionService.saveSession(userData)).rejects.toThrow(
      'Erro ao salvar a sessão.'
    );
  });

  it('deve retornar a sessão quando ela existir', async () => {
    const userData = { type: 'biometric', email: 'teste@test.com' };
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(userData));

    const result = await sessionService.getSession();
    expect(result).toEqual(userData);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@FindPets:session');
  });

  it('deve retornar null se não houver sessão salva', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const result = await sessionService.getSession();
    expect(result).toBeNull();
  });

  it('deve retornar null caso ocorra erro ao buscar a sessão', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage error'));

    const result = await sessionService.getSession();
    expect(result).toBeNull();
  });

  it('deve limpar a sessão e o perfil com sucesso (logout)', async () => {
    AsyncStorage.removeItem.mockResolvedValue();

    await expect(sessionService.clearSession()).resolves.toBeUndefined();
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(2);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@FindPets:session');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@FindPets:profile');
  });

  it('deve lançar erro ao falhar ao limpar a sessão', async () => {
    AsyncStorage.removeItem.mockRejectedValueOnce(new Error('Storage error'));

    await expect(sessionService.clearSession()).rejects.toThrow(
      'Erro ao encerrar a sessão.'
    );
  });
});
