import React from 'react';
import { Alert, Button, Modal } from 'react-native';
import PropTypes from 'prop-types';
import { render, fireEvent } from '@testing-library/react-native';
import { AppAlertProvider, nativeAlert, useAppAlert } from '../AppAlert';

jest.spyOn(Alert, 'alert');

function AlertTrigger({ type, cancelText, confirmText }) {
  const showAlert = useAppAlert();
  return (
    <Button
      testID="open-alert"
      title="Abrir"
      onPress={() =>
        showAlert({
          type,
          title: 'Título',
          message: 'Descrição',
          cancelText,
          confirmText,
        })
      }
    />
  );
}

function ConfirmTrigger({ onConfirmed }) {
  const showAlert = useAppAlert();
  return (
    <Button
      testID="open-alert"
      title="Abrir"
      onPress={() =>
        showAlert({
          title: 'Confirmar',
          message: 'Continuar?',
          confirmText: 'Sim',
          onConfirm: onConfirmed,
        })
      }
    />
  );
}

describe('AppAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar tipos visuais e confirmar', () => {
    const types = ['info', 'success', 'warning', 'danger'];

    types.forEach((type) => {
      const { getByTestId, getByText, unmount } = render(
        <AppAlertProvider>
          <AlertTrigger type={type} />
        </AppAlertProvider>
      );

      fireEvent.press(getByTestId('open-alert'));
      expect(getByText('Título')).toBeTruthy();
      expect(getByText('Descrição')).toBeTruthy();
      fireEvent.press(getByText('Entendi'));
      unmount();
    });
  });

  it('deve cancelar e fechar pelo evento do sistema', () => {
    const { getByTestId, getByText, UNSAFE_getByType } = render(
      <AppAlertProvider>
        <AlertTrigger type="warning" cancelText="Cancelar" />
      </AppAlertProvider>
    );

    fireEvent(UNSAFE_getByType(Modal), 'requestClose');
    fireEvent.press(getByTestId('open-alert'));
    fireEvent.press(getByText('Cancelar'));
    fireEvent.press(getByTestId('open-alert'));
    fireEvent(UNSAFE_getByType(Modal), 'requestClose');
    expect(getByText('Abrir')).toBeTruthy();
  });

  it('deve executar a ação de confirmação', () => {
    const onConfirmed = jest.fn();
    const { getByTestId, getByText } = render(
      <AppAlertProvider>
        <ConfirmTrigger onConfirmed={onConfirmed} />
      </AppAlertProvider>
    );

    fireEvent.press(getByTestId('open-alert'));
    fireEvent.press(getByText('Sim'));
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it('deve usar fallback nativo sem provider', () => {
    const onConfirmed = jest.fn();
    nativeAlert({
      title: 'Aviso',
      message: 'Mensagem',
      confirmText: 'OK',
      onConfirm: onConfirmed,
    });

    const buttons = Alert.alert.mock.calls[0][2];
    buttons[0].onPress();
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it('deve manter mensagem simples no alerta nativo', () => {
    nativeAlert({ title: 'Aviso', message: 'Mensagem' });
    expect(Alert.alert).toHaveBeenCalledWith('Aviso', 'Mensagem');
  });

  it('deve cancelar no fallback nativo', () => {
    nativeAlert({
      title: 'Aviso',
      message: 'Mensagem',
      cancelText: 'Cancelar',
    });

    const buttons = Alert.alert.mock.calls[0][2];
    buttons[0].onPress();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Aviso',
      'Mensagem',
      expect.any(Array)
    );
  });
});

AlertTrigger.propTypes = {
  type: PropTypes.string,
  cancelText: PropTypes.string,
  confirmText: PropTypes.string,
};

ConfirmTrigger.propTypes = {
  onConfirmed: PropTypes.func.isRequired,
};
