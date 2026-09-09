import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AuthRegisterScreen } from '../AuthRegisterScreen';

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

    const inputUsuario = getByPlaceholderText('Usuário');
    const inputSenha = getByPlaceholderText('Senha');

    fireEvent.changeText(inputUsuario, 'novo@email.com');
    fireEvent.changeText(inputSenha, 'abcdef');

    expect(defaultProps.setUsuario).toHaveBeenCalledWith('novo@email.com');
    expect(defaultProps.setSenha).toHaveBeenCalledWith('abcdef');

    fireEvent.press(getByText('Salvar e Cadastrar Biometria'));
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

  it('não deve exibir mensagem de erro quando errorMessage estiver vazio no cadastro', () => {
    const { queryByText } = render(
      <AuthRegisterScreen {...defaultProps} errorMessage="" />
    );

    expect(queryByText('Preencha os campos')).toBeNull();
  });
});
