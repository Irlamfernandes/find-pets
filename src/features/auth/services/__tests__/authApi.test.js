import { signInWithEmailAndPassword } from 'firebase/auth';
import { authApi } from '../authApi';
import { firebaseAuth, resetFirebase } from '../../../../testing/firebaseMock';
import { OfflineError } from '../../../../shared/firebase/remoteCall';

describe('authApi', () => {
  beforeEach(() => resetFirebase());

  it('deve criar a conta, entrar e devolver o e-mail', async () => {
    await expect(authApi.register('Ana@x.com', 'senha123')).resolves.toBe(
      'ana@x.com'
    );
    await authApi.signOut();

    await expect(authApi.login('ana@x.com', 'senha123')).resolves.toBe(
      'ana@x.com'
    );
    expect(firebaseAuth.currentUser.email).toBe('ana@x.com');
  });

  it('deve informar a conta conectada só se for a do usuário', async () => {
    await authApi.register('ana@x.com', 'senha123');

    await expect(authApi.currentAccountOf(' ANA@x.com ')).resolves.toEqual({
      uid: 'uid-1',
      email: 'ana@x.com',
    });
    await expect(authApi.currentAccountOf('bia@x.com')).resolves.toBeNull();

    await authApi.signOut();
    await expect(authApi.currentAccountOf('ana@x.com')).resolves.toBeNull();
  });

  it('deve trocar a senha da conta conectada', async () => {
    await authApi.register('ana@x.com', 'senha123');

    await authApi.changePassword('nova-senha');
    await authApi.signOut();

    await expect(authApi.login('ana@x.com', 'nova-senha')).resolves.toBe(
      'ana@x.com'
    );
  });

  it('deve avisar quando está sem conexão', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(
      Object.assign(new Error('x'), { code: 'auth/network-request-failed' })
    );

    await expect(authApi.login('ana@x.com', 'senha123')).rejects.toBeInstanceOf(
      OfflineError
    );
  });
});
