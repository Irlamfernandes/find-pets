import React from 'react';
import PropTypes from 'prop-types';
import { AuthForm } from '../components/AuthForm';

export function AuthRegisterScreen({ handleRegister, ...formProps }) {
  return (
    <AuthForm
      {...formProps}
      title="Cadastro"
      subtitle="Crie seus dados de acesso"
      submitLabel="Criar conta"
      onSubmit={handleRegister}
    />
  );
}

AuthRegisterScreen.propTypes = {
  usuario: PropTypes.string.isRequired,
  setUsuario: PropTypes.func.isRequired,
  senha: PropTypes.string.isRequired,
  setSenha: PropTypes.func.isRequired,
  errorMessage: PropTypes.string,
  handleRegister: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};
