import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { ChipSelector } from '../ChipSelector';

const options = ['Pequeno', 'Médio', 'Grande'];

const findSelected = (node) => {
  let current = node;
  while (current.props.accessibilityState?.selected === undefined) {
    current = current.parent;
  }
  return current.props.accessibilityState.selected;
};

describe('ChipSelector', () => {
  it('deve marcar a opção escolhida e fechar o teclado ao tocar', () => {
    const onChange = jest.fn();
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    const { getByText } = render(
      <ChipSelector options={options} value="Médio" onChange={onChange} />
    );

    expect(findSelected(getByText('Médio'))).toBe(true);
    expect(findSelected(getByText('Grande'))).toBe(false);

    fireEvent.press(getByText('Grande'));
    expect(onChange).toHaveBeenCalledWith('Grande');
    expect(dismissSpy).toHaveBeenCalledTimes(1);
    dismissSpy.mockRestore();
  });

  it('deve desmarcar ao tocar de novo, exceto em campo obrigatório', () => {
    const onChange = jest.fn();
    const { getByText, rerender } = render(
      <ChipSelector options={options} value="Médio" onChange={onChange} />
    );

    fireEvent.press(getByText('Médio'));
    expect(onChange).toHaveBeenLastCalledWith('');

    rerender(
      <ChipSelector
        options={options}
        value="Médio"
        onChange={onChange}
        required
      />
    );
    fireEvent.press(getByText('Médio'));
    expect(onChange).toHaveBeenLastCalledWith('Médio');
  });
});
