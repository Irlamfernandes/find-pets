import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { BiometricSettingsCard } from '../BiometricSettingsCard';
import {
  useBiometricSettings,
  BIOMETRIC_STATUS,
} from '../../hooks/useBiometricSettings';

jest.mock('../../hooks/useBiometricSettings', () => ({
  BIOMETRIC_STATUS: {
    LOADING: 'loading',
    UNAVAILABLE: 'unavailable',
    AVAILABLE: 'available',
    ACTIVE: 'active',
    TAKEN: 'taken',
  },
  useBiometricSettings: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('BiometricSettingsCard', () => {
  const settings = {
    status: BIOMETRIC_STATUS.AVAILABLE,
    owner: null,
    verifyPassword: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useBiometricSettings.mockReturnValue(settings);
  });

  const confirmPassword = async (utils, password = 'senha123') => {
    fireEvent.press(utils.getByTestId('button-activate-biometrics'));
    fireEvent.changeText(utils.getByTestId('input-current-password'), password);
    await act(async () => {
      fireEvent.press(utils.getByText('Confirmar'));
    });
  };

  it('deve mostrar o texto de cada situação', () => {
    const utils = render(<BiometricSettingsCard />);
    expect(
      utils.getByText(
        'Entre mais rápido usando a digital ou o rosto cadastrado neste celular.'
      )
    ).toBeTruthy();

    useBiometricSettings.mockReturnValue({
      ...settings,
      status: BIOMETRIC_STATUS.TAKEN,
      owner: 'irlam@gmail.com',
    });
    utils.rerender(<BiometricSettingsCard />);
    expect(
      utils.getByText(
        'A biometria deste celular já está em uso pela conta ir***@gmail.com. Só uma conta por celular pode usar a biometria.'
      )
    ).toBeTruthy();
    // Bloqueada para esta conta: sem botões
    expect(utils.queryByTestId('button-activate-biometrics')).toBeNull();
    expect(utils.queryByTestId('button-deactivate-biometrics')).toBeNull();

    useBiometricSettings.mockReturnValue({
      ...settings,
      status: BIOMETRIC_STATUS.UNAVAILABLE,
    });
    utils.rerender(<BiometricSettingsCard />);
    expect(
      utils.getByText(
        'Este celular não tem digital ou rosto cadastrado nas configurações.'
      )
    ).toBeTruthy();

    useBiometricSettings.mockReturnValue({
      ...settings,
      status: BIOMETRIC_STATUS.LOADING,
    });
    utils.rerender(<BiometricSettingsCard />);
    expect(utils.getByText('Verificando...')).toBeTruthy();
  });

  it('deve pedir a senha com o aviso e ativar a biometria', async () => {
    settings.verifyPassword.mockResolvedValueOnce(true);
    settings.activate.mockResolvedValueOnce('activated');
    const utils = render(<BiometricSettingsCard />);

    fireEvent.press(utils.getByTestId('button-activate-biometrics'));
    expect(
      utils.getByText(
        'Atenção: qualquer digital ou rosto cadastrado neste celular poderá entrar nesta conta. Digite sua senha para continuar.'
      )
    ).toBeTruthy();
    fireEvent.changeText(utils.getByTestId('input-current-password'), 'abc');
    await act(async () => {
      fireEvent.press(utils.getByText('Confirmar'));
    });

    expect(settings.verifyPassword).toHaveBeenCalledWith('abc');
    expect(settings.activate).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Biometria ativada',
      'Da próxima vez, você poderá entrar com a biometria.'
    );
  });

  it('deve validar a senha antes de ativar', async () => {
    const utils = render(<BiometricSettingsCard />);

    await confirmPassword(utils, '   ');
    expect(utils.getByText('Digite sua senha atual.')).toBeTruthy();

    settings.verifyPassword.mockResolvedValueOnce(false);
    fireEvent.changeText(utils.getByTestId('input-current-password'), 'x');
    await act(async () => {
      fireEvent.press(utils.getByText('Confirmar'));
    });
    expect(utils.getByText('Senha incorreta. Tente novamente.')).toBeTruthy();
    expect(settings.activate).not.toHaveBeenCalled();

    fireEvent.press(utils.getByText('Cancelar'));
    expect(utils.queryByText('Senha incorreta. Tente novamente.')).toBeNull();
  });

  it('deve avisar quando a biometria não for confirmada ou for cancelada', async () => {
    settings.verifyPassword.mockResolvedValue(true);
    settings.activate.mockResolvedValueOnce('failed');
    const utils = render(<BiometricSettingsCard />);

    await confirmPassword(utils);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Biometria não confirmada',
      'Não foi possível confirmar a biometria. Tente novamente.'
    );

    Alert.alert.mockClear();
    settings.activate.mockResolvedValueOnce('cancelled');
    await confirmPassword(utils);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('deve avisar quando não for possível ativar', async () => {
    settings.verifyPassword.mockResolvedValueOnce(true);
    settings.activate.mockRejectedValueOnce(
      new Error('A biometria deste aparelho já está em uso.')
    );
    const utils = render(<BiometricSettingsCard />);

    await confirmPassword(utils);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível concluir',
      'A biometria deste aparelho já está em uso.'
    );
  });

  it('deve pedir a senha para desativar e avisar sobre falhas', async () => {
    useBiometricSettings.mockReturnValue({
      ...settings,
      status: BIOMETRIC_STATUS.ACTIVE,
    });
    settings.verifyPassword.mockResolvedValue(true);
    const utils = render(<BiometricSettingsCard />);
    expect(utils.getByText('Ativada nesta conta.')).toBeTruthy();

    const deactivateWithPassword = async (password) => {
      fireEvent.press(utils.getByTestId('button-deactivate-biometrics'));
      expect(
        utils.getByText(
          'Digite sua senha para desativar a biometria desta conta.'
        )
      ).toBeTruthy();
      fireEvent.changeText(
        utils.getByTestId('input-current-password'),
        password
      );
      await act(async () => {
        fireEvent.press(utils.getByText('Confirmar'));
      });
    };

    // Senha errada: não desativa
    settings.verifyPassword.mockResolvedValueOnce(false);
    await deactivateWithPassword('errada');
    expect(settings.deactivate).not.toHaveBeenCalled();
    fireEvent.press(utils.getByText('Cancelar'));

    settings.deactivate.mockResolvedValueOnce();
    await deactivateWithPassword('senha123');
    expect(settings.verifyPassword).toHaveBeenLastCalledWith('senha123');
    expect(settings.deactivate).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Biometria desativada',
      'Esta conta passará a entrar só com a senha. Outra conta deste celular poderá ativar a biometria.'
    );

    settings.deactivate.mockRejectedValueOnce(new Error('falhou'));
    await deactivateWithPassword('senha123');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Não foi possível concluir',
      'falhou'
    );
  });
});
