import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import UnlockScreen from '../UnlockScreen';
import { useUnlock } from '../../hooks/useUnlock';

jest.mock('../../hooks/useUnlock', () => ({
  useUnlock: jest.fn(),
}));

describe('UnlockScreen', () => {
  const onUnlocked = jest.fn();
  const onSwitchAccount = jest.fn();
  const hookValue = {
    canUseBiometrics: true,
    password: '',
    setPassword: jest.fn(),
    errorMessage: '',
    unlockWithBiometrics: jest.fn(),
    unlockWithPassword: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUnlock.mockReturnValue(hookValue);
  });

  const renderScreen = () =>
    render(
      <UnlockScreen
        usuario="dono@test.com"
        onUnlocked={onUnlocked}
        onSwitchAccount={onSwitchAccount}
      />
    );

  it('deve mostrar a conta e permitir entrar com biometria, senha ou trocar de conta', async () => {
    const { getByText, getByTestId } = renderScreen();

    expect(useUnlock).toHaveBeenCalledWith('dono@test.com', onUnlocked);
    expect(getByText('dono@test.com')).toBeTruthy();

    fireEvent.press(getByTestId('button-unlock-biometrics'));
    expect(hookValue.unlockWithBiometrics).toHaveBeenCalledTimes(1);

    fireEvent.changeText(getByTestId('input-unlock-password'), '123');
    expect(hookValue.setPassword).toHaveBeenCalledWith('123');

    await act(async () => {
      fireEvent.press(getByTestId('button-unlock-password'));
    });
    await act(async () => {
      fireEvent(getByTestId('input-unlock-password'), 'submitEditing');
    });
    expect(hookValue.unlockWithPassword).toHaveBeenCalledTimes(2);

    fireEvent.press(getByText('Trocar de conta'));
    expect(onSwitchAccount).toHaveBeenCalledTimes(1);
  });

  it('deve esconder a biometria para contas sem ela e mostrar erros', () => {
    useUnlock.mockReturnValue({
      ...hookValue,
      canUseBiometrics: false,
      errorMessage: 'Senha incorreta.',
    });
    const { queryByTestId, getByText } = renderScreen();

    expect(queryByTestId('button-unlock-biometrics')).toBeNull();
    expect(getByText('Senha incorreta.')).toBeTruthy();
  });
});
