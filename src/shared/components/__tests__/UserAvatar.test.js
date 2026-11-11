import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserAvatar } from '../UserAvatar';

describe('UserAvatar', () => {
  it('deve exibir a foto redonda e responder ao toque', async () => {
    const onPress = jest.fn();
    const { getByTestId, getByLabelText } = await render(
      <UserAvatar
        uri="foto.jpg"
        size={50}
        onPress={onPress}
        accessibilityLabel="Abrir perfil"
      />
    );

    expect(getByTestId('user-avatar-image').props.style).toEqual({
      width: 50,
      height: 50,
      borderRadius: 25,
    });
    await fireEvent.press(getByLabelText('Abrir perfil'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('deve exibir o ícone padrão sem foto e sem toque', async () => {
    const { getByTestId, queryByTestId } = await render(<UserAvatar />);

    expect(getByTestId('user-avatar-placeholder')).toBeTruthy();
    expect(queryByTestId('user-avatar-image')).toBeNull();
  });
});
