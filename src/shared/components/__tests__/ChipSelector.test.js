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
  it('deve marcar a opção escolhida e fechar o teclado ao tocar', async () => {
    const onChange = jest.fn();
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    const { getByText } = await render(
      <ChipSelector options={options} value="Médio" onChange={onChange} />
    );

    expect(findSelected(getByText('Médio'))).toBe(true);
    expect(findSelected(getByText('Grande'))).toBe(false);

    await fireEvent.press(getByText('Grande'));
    expect(onChange).toHaveBeenCalledWith('Grande');
    expect(dismissSpy).toHaveBeenCalledTimes(1);
    dismissSpy.mockRestore();
  });

  it('deve desmarcar ao tocar de novo, exceto em campo obrigatório', async () => {
    const onChange = jest.fn();
    const { getByText, rerender } = await render(
      <ChipSelector options={options} value="Médio" onChange={onChange} />
    );

    await fireEvent.press(getByText('Médio'));
    expect(onChange).toHaveBeenLastCalledWith('');

    await rerender(
      <ChipSelector
        options={options}
        value="Médio"
        onChange={onChange}
        required
      />
    );
    await fireEvent.press(getByText('Médio'));
    expect(onChange).toHaveBeenLastCalledWith('Médio');
  });
});
