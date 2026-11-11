import { renderHook, act } from '@testing-library/react-native';
import { usePasswordPrompt } from '../usePasswordPrompt';
import { accountService } from '../../services/accountService';
import { sessionService } from '../../services/sessionService';

jest.mock('../../services/accountService');
jest.mock('../../services/sessionService');

describe('usePasswordPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderPrompt = async (options) =>
    await renderHook(() =>
      usePasswordPrompt({ onConfirmed: jest.fn(), ...options })
    );

  const confirm = async (result, password) => {
    let confirmed;
    await act(async () => {
      confirmed = await result.current.promptProps.onConfirm(password);
    });
    return confirmed;
  };

  it('deve começar fechado e abrir com o pedido informado', async () => {
    const { result } = await renderPrompt();
    expect(result.current.promptProps.visible).toBe(false);
    expect(result.current.payload).toBeNull();

    await act(() => result.current.open('activate'));

    expect(result.current.promptProps.visible).toBe(true);
    expect(result.current.payload).toBe('activate');
  });

  it('deve conferir a senha da conta conectada e executar a ação', async () => {
    sessionService.getCurrentUser.mockResolvedValue('ana@x.com');
    accountService.checkPassword.mockResolvedValue(true);
    const onConfirmed = jest.fn();
    const { result } = await renderPrompt({ onConfirmed });
    await act(() => result.current.open('activate'));

    await expect(confirm(result, 'certa')).resolves.toBe(true);

    expect(accountService.checkPassword).toHaveBeenCalledWith(
      'ana@x.com',
      'certa'
    );
    expect(onConfirmed).toHaveBeenCalledWith('activate', 'certa');
    expect(result.current.promptProps.visible).toBe(false);
    expect(result.current.payload).toBe('activate');
  });

  it('deve usar a verificação informada com o pedido', async () => {
    const verify = jest.fn().mockResolvedValue(true);
    const { result } = await renderPrompt({ verify });
    await act(() => result.current.open('bia@x.com'));

    await confirm(result, 'senha');

    expect(verify).toHaveBeenCalledWith('senha', 'bia@x.com');
    expect(accountService.checkPassword).not.toHaveBeenCalled();
  });

  it.each([
    ['vazia', '  ', () => {}, 'Digite sua senha.'],
    [
      'incorreta',
      'errada',
      (verify) => verify.mockResolvedValue(false),
      'Senha incorreta. Tente novamente.',
    ],
    [
      'impossível de verificar',
      'senha',
      (verify) => verify.mockRejectedValue(new Error('x')),
      'Não foi possível verificar a senha agora.',
    ],
  ])(
    'deve manter aberto e explicar quando a senha estiver %s',
    async (_, password, setup, message) => {
      const verify = jest.fn();
      setup(verify);
      const onConfirmed = jest.fn();
      const { result } = await renderPrompt({ verify, onConfirmed });
      await act(() => result.current.open());

      await expect(confirm(result, password)).resolves.toBe(false);

      expect(result.current.promptProps.errorMessage).toBe(message);
      expect(result.current.promptProps.visible).toBe(true);
      expect(result.current.promptProps.isVerifying).toBe(false);
      expect(onConfirmed).not.toHaveBeenCalled();
    }
  );

  it('deve limpar o erro ao cancelar e ao abrir de novo', async () => {
    const { result } = await renderPrompt();
    await act(() => result.current.open());
    await confirm(result, '');

    await act(() => result.current.promptProps.onCancel());
    expect(result.current.promptProps.visible).toBe(false);
    expect(result.current.promptProps.errorMessage).toBe('');

    await confirm(result, '');
    await act(() => result.current.open());
    expect(result.current.promptProps.errorMessage).toBe('');
  });
});
