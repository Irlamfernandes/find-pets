import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PasswordPromptModal from '../PasswordPromptModal';

describe('PasswordPromptModal', () => {
  it('deve exibir título e mensagem padrão', async () => {
    const { getByText, queryByText } = await render(
      <PasswordPromptModal visible onCancel={jest.fn()} onConfirm={jest.fn()} />
    );

    expect(getByText('Confirme sua senha')).toBeTruthy();
    expect(getByText('Digite sua senha atual para continuar.')).toBeTruthy();
    expect(queryByText('Senha incorreta')).toBeNull();
  });

  it('deve mostrar a senha digitada ao tocar no olho', async () => {
    const { getByTestId, getByLabelText } = await render(
      <PasswordPromptModal visible onCancel={jest.fn()} onConfirm={jest.fn()} />
    );

    expect(getByTestId('input-current-password').props.secureTextEntry).toBe(
      true
    );
    await fireEvent.press(getByLabelText('Mostrar senha'));
    expect(getByTestId('input-current-password').props.secureTextEntry).toBe(
      false
    );
  });

  it('deve enviar a senha digitada e limpar o campo quando confirmada', async () => {
    const onConfirm = jest.fn().mockResolvedValue(true);
    const { getByTestId, getByText } = await render(
      <PasswordPromptModal visible onCancel={jest.fn()} onConfirm={onConfirm} />
    );

    await fireEvent.changeText(
      getByTestId('input-current-password'),
      'senha123'
    );
    await fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('senha123');
      expect(getByTestId('input-current-password').props.value).toBe('');
    });
  });

  it('deve manter a senha digitada quando a confirmação falhar', async () => {
    const onConfirm = jest.fn().mockResolvedValue(false);
    const { getByTestId, getByText } = await render(
      <PasswordPromptModal
        visible
        errorMessage="Senha incorreta"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />
    );

    await fireEvent.changeText(getByTestId('input-current-password'), 'errada');
    await fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('errada');
    });
    expect(getByTestId('input-current-password').props.value).toBe('errada');
    expect(getByText('Senha incorreta')).toBeTruthy();
  });

  it('deve limpar a senha e chamar onCancel ao cancelar', async () => {
    const onCancel = jest.fn();
    const { getByTestId, getByText } = await render(
      <PasswordPromptModal visible onCancel={onCancel} onConfirm={jest.fn()} />
    );

    await fireEvent.changeText(
      getByTestId('input-current-password'),
      'senha123'
    );
    await fireEvent.press(getByText('Cancelar'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(getByTestId('input-current-password').props.value).toBe('');
  });
});
