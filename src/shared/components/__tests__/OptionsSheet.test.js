import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OptionsSheet } from '../OptionsSheet';

describe('OptionsSheet', () => {
  it('deve executar a opção escolhida, fechar e permitir cancelar', () => {
    const onClose = jest.fn();
    const takePhoto = jest.fn();
    const removePhoto = jest.fn();
    const { getByText, getByTestId } = render(
      <OptionsSheet
        visible
        title="Foto do perfil"
        onClose={onClose}
        options={[
          { label: 'Tirar foto', icon: 'camera-outline', onPress: takePhoto },
          {
            label: 'Remover foto',
            icon: 'trash-outline',
            destructive: true,
            onPress: removePhoto,
          },
        ]}
      />
    );

    expect(getByText('Foto do perfil')).toBeTruthy();
    fireEvent.press(getByText('Tirar foto'));
    fireEvent.press(getByText('Remover foto'));
    expect(takePhoto).toHaveBeenCalledTimes(1);
    expect(removePhoto).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Cancelar'));
    fireEvent.press(getByTestId('options-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(4);
  });
});
