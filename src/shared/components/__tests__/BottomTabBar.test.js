import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomTabBar } from '../BottomTabBar';

describe('BottomTabBar', () => {
  it('deve mostrar a aba ativa e navegar pelas outras', () => {
    const onNavigate = { report: jest.fn(), profile: jest.fn() };
    const { getByTestId, getByText } = render(
      <BottomTabBar active="feed" onNavigate={onNavigate} />
    );

    expect(getByTestId('tab-feed').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
    fireEvent.press(getByText('Registrar desaparecimento'));
    fireEvent.press(getByText('Perfil'));

    expect(onNavigate.report).toHaveBeenCalledTimes(1);
    expect(onNavigate.profile).toHaveBeenCalledTimes(1);
  });

  it('deve esconder as abas sem destino e ignorar toque na ativa', () => {
    const onNavigate = { feed: jest.fn() };
    const { queryByText, getByText } = render(
      <BottomTabBar active="profile" onNavigate={onNavigate} />
    );

    expect(queryByText('Registrar desaparecimento')).toBeNull();
    fireEvent.press(getByText('Perfil'));
    fireEvent.press(getByText('Pets perdidos'));

    expect(onNavigate.feed).toHaveBeenCalledTimes(1);
  });
});
