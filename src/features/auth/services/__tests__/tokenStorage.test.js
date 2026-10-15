import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../tokenStorage';
import { STORAGE_KEYS } from '../../../../shared/constants/storageKeys';

describe('tokenStorage', () => {
  beforeEach(() => SecureStore.__backend.reset());

  it('deve guardar um token por conta, no armazenamento criptografado', async () => {
    await tokenStorage.save('Ana@x.com', 'token-ana');
    await tokenStorage.save('bia@x.com', 'token-bia');

    await expect(tokenStorage.get('ana@x.com')).resolves.toBe('token-ana');
    await expect(tokenStorage.get('bia@x.com')).resolves.toBe('token-bia');
    expect(SecureStore.__backend.data.has(STORAGE_KEYS.API_TOKENS)).toBe(true);
  });

  it('deve remover só o token da conta indicada', async () => {
    await tokenStorage.save('ana@x.com', 'token-ana');
    await tokenStorage.save('bia@x.com', 'token-bia');

    await tokenStorage.remove('ana@x.com');

    await expect(tokenStorage.get('ana@x.com')).resolves.toBeNull();
    await expect(tokenStorage.get('bia@x.com')).resolves.toBe('token-bia');
  });
});
