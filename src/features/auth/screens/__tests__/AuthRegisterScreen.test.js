import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform, TextInput, BackHandler } from 'react-native';
import { AuthRegisterScreen } from '../AuthRegisterScreen';

const pressHardwareBack = () => {
  const [, listener] = BackHandler.addEventListener.mock.calls.at(-1);
  return listener();
};

describe('AuthRegisterScreen Component', () => {
  const defaultProps = {
    usuario: '',
    setUsuario: jest.fn(),
    senha: '',
    setSenha: jest.fn(),
    errorMessage: '',
    handleRegister: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a tela de cadastro e interagir com os campos e botões', async () => {
    const { getByText, getByPlaceholderText } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );

    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByText('Crie seus dados de acesso')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    await fireEvent.changeText(inputUsuario, 'novo@email.com');
    await fireEvent.changeText(inputSenha, 'abcdef');

    expect(defaultProps.setUsuario).toHaveBeenCalledWith('novo@email.com');
    expect(defaultProps.setSenha).toHaveBeenCalledWith('abcdef');

    await fireEvent.press(getByText('Criar conta'));
    expect(defaultProps.handleRegister).toHaveBeenCalled();

    await fireEvent.press(getByText('Voltar'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('deve marcar e-mail e senha como obrigatórios', async () => {
    const { getByText, getAllByTestId } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );

    expect(getByText('E-mail *')).toBeTruthy();
    expect(getByText('Senha *')).toBeTruthy();
    expect(getAllByTestId('required-mark')).toHaveLength(2);
  });

  it('deve mostrar a senha ao tocar no olho', async () => {
    const { getByTestId, getByLabelText } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );

    expect(getByTestId('input-password').props.secureTextEntry).toBe(true);
    await fireEvent.press(getByLabelText('Mostrar senha'));
    expect(getByTestId('input-password').props.secureTextEntry).toBe(false);
  });

  it('deve exibir mensagem de erro quando errorMessage for fornecido no cadastro', async () => {
    const { getByText } = await render(
      <AuthRegisterScreen {...defaultProps} errorMessage="Preencha os campos" />
    );

    expect(getByText('Preencha os campos')).toBeTruthy();
  });

  it('deve executar o cadastro ao confirmar no teclado', async () => {
    const { getByPlaceholderText } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );

    await fireEvent(getByPlaceholderText('Senha'), 'submitEditing');

    expect(defaultProps.handleRegister).toHaveBeenCalledTimes(1);
  });

  it('não deve exibir mensagem de erro quando errorMessage estiver vazio no cadastro', async () => {
    const { queryByText } = await render(
      <AuthRegisterScreen {...defaultProps} errorMessage="" />
    );

    expect(queryByText('Preencha os campos')).toBeNull();
  });

  it('deve renderizar corretamente no ambiente Android', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { getByText } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );
    expect(getByText('Cadastro')).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('deve ir para o campo de senha ao confirmar o e-mail no teclado', async () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByPlaceholderText } = await render(
      <AuthRegisterScreen {...defaultProps} />
    );

    await fireEvent(getByPlaceholderText('E-mail'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(defaultProps.handleRegister).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('deve executar a seta de voltar ao usar o voltar do Android', async () => {
    jest.spyOn(BackHandler, 'addEventListener');
    await render(<AuthRegisterScreen {...defaultProps} />);

    expect(pressHardwareBack()).toBe(true);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });
});
