import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Modal, TextInput, Keyboard } from 'react-native';
import { FoundPetModal, FOUND_RELATIONS } from '../FoundPetModal';

describe('FoundPetModal', () => {
  const now = new Date(2026, 8, 25, 18, 45);

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderModal = (props = {}) => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onCancel = jest.fn();
    const utils = render(
      <FoundPetModal
        visible
        onCancel={onCancel}
        onConfirm={onConfirm}
        {...props}
      />
    );
    return { ...utils, onConfirm, onCancel };
  };

  it('deve abrir com o nome vazio, a primeira opção e a data/hora atual', () => {
    const { getByTestId, getByText } = renderModal();

    expect(getByText('Pet encontrado!')).toBeTruthy();
    expect(getByTestId('input-receiver-name').props.value).toBe('');
    expect(getByTestId('input-found-date').props.value).toBe('25/09/2026');
    expect(getByTestId('input-found-time').props.value).toBe('18:45');
    let option = getByText(FOUND_RELATIONS[0]);
    while (option.props.accessibilityState?.selected === undefined) {
      option = option.parent;
    }
    expect(option.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });

  it('deve enviar os dados preenchidos do reencontro', async () => {
    const { getByTestId, getByText, onConfirm } = renderModal();

    fireEvent.changeText(getByTestId('input-receiver-name'), '  Ana Souza ');
    fireEvent.press(getByText('Abrigo / ONG'));
    fireEvent.changeText(getByTestId('input-found-date'), '24092026');
    fireEvent.changeText(getByTestId('input-found-time'), '0930');
    fireEvent.changeText(getByTestId('input-found-location'), ' Praça ');
    fireEvent.changeText(getByTestId('input-found-notes'), ' Tudo bem ');

    expect(getByTestId('input-found-date').props.value).toBe('24/09/2026');
    expect(getByTestId('input-found-time').props.value).toBe('09:30');

    await act(async () => {
      fireEvent.press(getByTestId('button-confirm-found'));
    });

    expect(onConfirm).toHaveBeenCalledWith({
      receiverName: 'Ana Souza',
      receiverRelation: 'Abrigo / ONG',
      foundAt: new Date(2026, 8, 24, 9, 30).toISOString(),
      foundZone: { offsetMinutes: -180, abbreviation: 'BRT' },
      foundLocation: 'Praça',
      notes: 'Tudo bem',
    });
  });

  it('deve validar nome, data inválida e data no futuro', async () => {
    const { getByTestId, getByText, onConfirm } = renderModal();

    await act(async () => {
      fireEvent.press(getByTestId('button-confirm-found'));
    });
    expect(getByText('Informe o nome de quem pegou o animal.')).toBeTruthy();

    fireEvent.changeText(getByTestId('input-receiver-name'), 'Ana');
    fireEvent.changeText(getByTestId('input-found-date'), '3102');
    await act(async () => {
      fireEvent.press(getByTestId('button-confirm-found'));
    });
    expect(
      getByText('Informe uma data (dd/mm/aaaa) e hora (HH:MM) válidas.')
    ).toBeTruthy();

    fireEvent.changeText(getByTestId('input-found-date'), '26092026');
    await act(async () => {
      fireEvent.press(getByTestId('button-confirm-found'));
    });
    expect(
      getByText('A data do reencontro não pode estar no futuro.')
    ).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('deve ignorar novos toques enquanto salva', async () => {
    let finishSave;
    const onConfirm = jest.fn(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        })
    );
    const { getByTestId } = render(
      <FoundPetModal visible onCancel={jest.fn()} onConfirm={onConfirm} />
    );

    fireEvent.changeText(getByTestId('input-receiver-name'), 'Ana');
    await act(async () => {
      fireEvent.press(getByTestId('button-confirm-found'));
    });
    await act(async () => {
      fireEvent(getByTestId('button-confirm-found'), 'press');
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishSave();
    });
  });

  it('deve restaurar o formulário ao reabrir e permitir cancelar', () => {
    const { getByTestId, getByText, onCancel, UNSAFE_getByType } =
      renderModal();

    fireEvent.changeText(getByTestId('input-receiver-name'), 'Ana');
    fireEvent(UNSAFE_getByType(Modal), 'show');
    expect(getByTestId('input-receiver-name').props.value).toBe('');

    fireEvent.press(getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deve avançar entre os campos pelo teclado', () => {
    const focusSpy = jest.spyOn(TextInput.prototype, 'focus');
    const { getByTestId } = renderModal();

    fireEvent(getByTestId('input-receiver-name'), 'submitEditing');
    fireEvent(getByTestId('input-found-date'), 'submitEditing');
    fireEvent(getByTestId('input-found-time'), 'submitEditing');
    fireEvent(getByTestId('input-found-location'), 'submitEditing');

    expect(focusSpy).toHaveBeenCalledTimes(4);
    focusSpy.mockRestore();
  });

  it('deve fechar o teclado ao escolher uma opção ou cancelar', () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    const { getByText, onCancel } = renderModal();

    fireEvent.press(getByText('Familiar'));
    fireEvent.press(getByText('Cancelar'));

    expect(dismissSpy).toHaveBeenCalledTimes(2);
    expect(onCancel).toHaveBeenCalledTimes(1);
    dismissSpy.mockRestore();
  });
});
