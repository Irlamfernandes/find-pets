import React from 'react';
import { Alert, Button } from 'react-native';
import PropTypes from 'prop-types';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AppAlertProvider, nativeAlert, useAppAlert } from '../AppAlert';

jest.spyOn(Alert, 'alert');

function AlertTrigger({ type, cancelText, confirmText }) {
  const showAlert = useAppAlert();
  return (
    <Button
      testID="open-alert"
      title="Abrir"
      onPress={() => {
        showAlert({
          type,
          title: 'Título',
          message: 'Descrição',
          cancelText,
          confirmText,
        });
      }}
    />
  );
}

function ConfirmTrigger({ onConfirmed }) {
  const showAlert = useAppAlert();
  return (
    <Button
      testID="open-alert"
      title="Abrir"
      onPress={() => {
        showAlert({
          title: 'Confirmar',
          message: 'Continuar?',
          confirmText: 'Sim',
          onConfirm: onConfirmed,
        });
      }}
    />
  );
}

describe('AppAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar tipos visuais e confirmar', async () => {
    const types = ['info', 'success', 'warning', 'danger'];

    for (const type of types) {
      const { getByTestId, getByText, unmount } = await render(
        <AppAlertProvider>
          <AlertTrigger type={type} />
        </AppAlertProvider>
      );

      await fireEvent.press(getByTestId('open-alert'));
      expect(getByText('Título')).toBeTruthy();
      expect(getByText('Descrição')).toBeTruthy();
      await fireEvent.press(getByText('Entendi'));
      await unmount();
    }
  });

  it('deve cancelar e fechar pelo evento do sistema', async () => {
    const { getByTestId, getByText, queryByTestId } = await render(
      <AppAlertProvider>
        <AlertTrigger type="warning" cancelText="Cancelar" />
      </AppAlertProvider>
    );

    expect(queryByTestId('app-alert')).toBeNull();
    await fireEvent.press(getByTestId('open-alert'));
    await fireEvent.press(getByText('Cancelar'));
    expect(queryByTestId('app-alert')).toBeNull();
    await fireEvent.press(getByTestId('open-alert'));
    await fireEvent(getByTestId('app-alert'), 'requestClose');
    expect(queryByTestId('app-alert')).toBeNull();
    expect(getByText('Abrir')).toBeTruthy();
  });

  it('deve executar a ação de confirmação', async () => {
    const onConfirmed = jest.fn();
    const { getByTestId, getByText } = await render(
      <AppAlertProvider>
        <ConfirmTrigger onConfirmed={onConfirmed} />
      </AppAlertProvider>
    );

    await fireEvent.press(getByTestId('open-alert'));
    await fireEvent.press(getByText('Sim'));
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

function CaptureAlert({ onReady }) {
  onReady(useAppAlert());
  return null;
}

CaptureAlert.propTypes = {
  onReady: PropTypes.func.isRequired,
};

describe('AppAlertProvider com vários avisos', () => {
  it('deve mostrar avisos seguidos um de cada vez, sem perder nenhum', async () => {
    let showAlert;
    const onConfirm = jest.fn();
    const { getByText, queryByText } = await render(
      <AppAlertProvider>
        <CaptureAlert
          onReady={(fn) => {
            showAlert = fn;
          }}
        />
      </AppAlertProvider>
    );

    let first;
    let second;
    await act(() => {
      first = showAlert({
        title: 'Confirmar Exclusão',
        message: 'a',
        confirmText: 'Excluir',
        onConfirm,
      });
      second = showAlert({ title: 'Segundo aviso', message: 'b' });
    });

    expect(getByText('Confirmar Exclusão')).toBeTruthy();
    expect(queryByText('Segundo aviso')).toBeNull();

    await fireEvent.press(getByText('Excluir'));
    await expect(first).resolves.toBe(true);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(getByText('Segundo aviso')).toBeTruthy();

    await fireEvent.press(getByText('Entendi'));
    await expect(second).resolves.toBe(true);
    expect(queryByText('Segundo aviso')).toBeNull();
  });
});
