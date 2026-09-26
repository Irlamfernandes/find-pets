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

  it('deve renderizar a tela de cadastro e interagir com os campos e botões', () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthRegisterScreen {...defaultProps} />
    );

    expect(getByText('Cadastro')).toBeTruthy();
    expect(getByText('Crie seus dados de acesso')).toBeTruthy();

    const inputUsuario = getByPlaceholderText('E-mail');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'novo@email.com');
    fireEvent.changeText(inputSenha, 'abcdef');

    expect(defaultProps.setUsuario).toHaveBeenCalledWith('novo@email.com');
    expect(defaultProps.setSenha).toHaveBeenCalledWith('abcdef');

    fireEvent.press(getByText('Criar conta'));
    expect(defaultProps.handleRegister).toHaveBeenCalled();

    fireEvent.press(getByText('Voltar'));
    expect(defaultProps.onBack).toHaveBeenCalled();
  });

  it('deve exibir mensagem de erro quando errorMessage for fornecido no cadastro', () => {
    const { getByText } = render(
      <AuthRegisterScreen {...defaultProps} errorMessage="Preencha os campos" />
    );

    expect(getByText('Preencha os campos')).toBeTruthy();
  });

  it('deve executar o cadastro ao confirmar no teclado', () => {
    const { getByPlaceholderText } = render(
      <AuthRegisterScreen {...defaultProps} />
    );

    fireEvent(getByPlaceholderText('Senha'), 'submitEditing');

    expect(defaultProps.handleRegister).toHaveBeenCalledTimes(1);
  });

  it('não deve exibir mensagem de erro quando errorMessage estiver vazio no cadastro', () => {
    const { queryByText } = render(
      <AuthRegisterScreen {...defaultProps} errorMessage="" />
    );

    expect(queryByText('Preencha os campos')).toBeNull();
  });

  it('deve renderizar corretamente no ambiente Android', () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { getByText } = render(<AuthRegisterScreen {...defaultProps} />);
    expect(getByText('Cadastro')).toBeTruthy();

    Platform.OS = originalOS;
  });

  it('deve ir para o campo de senha ao confirmar o e-mail no teclado', () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByPlaceholderText } = render(
      <AuthRegisterScreen {...defaultProps} />
    );

    fireEvent(getByPlaceholderText('E-mail'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(defaultProps.handleRegister).not.toHaveBeenCalled();
    focusSpy.mockRestore();
  });

  it('deve executar a seta de voltar ao usar o voltar do Android', () => {
    jest.spyOn(BackHandler, 'addEventListener');
    render(<AuthRegisterScreen {...defaultProps} />);

    expect(pressHardwareBack()).toBe(true);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });
});
