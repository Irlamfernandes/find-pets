import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Keyboard, BackHandler } from 'react-native';
import ReportLostPetScreen from '../ReportLostPetScreen';
import { useReportLostPet } from '../../hooks/useReportLostPet';

jest.mock('../../hooks/useReportLostPet', () => ({
  MAX_PHOTOS: 5,
  useReportLostPet: jest.fn(),
}));

const pressHardwareBack = () => {
  const [, listener] = BackHandler.addEventListener.mock.calls.at(-1);
  return listener();
};

describe('ReportLostPetScreen', () => {
  const onBack = jest.fn();
  const onSaved = jest.fn();
  const hookValue = {
    photos: [],
    description: '',
    setDescription: jest.fn(),
    address: '',
    setAddress: jest.fn(),
    isSaving: false,
    remainingPhotos: 5,
    pickFromGallery: jest.fn(),
    takePhoto: jest.fn(),
    removePhoto: jest.fn(),
    submit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useReportLostPet.mockReturnValue(hookValue);
  });

  it('deve renderizar o formulário e repassar onSaved ao hook', () => {
    const { getByText, getByTestId } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    expect(useReportLostPet).toHaveBeenCalledWith(onSaved);
    expect(getByText('Fotos do pet (0/5)')).toBeTruthy();
    expect(getByTestId('button-take-photo')).toBeTruthy();
    expect(getByTestId('button-pick-gallery')).toBeTruthy();
    expect(getByText('Endereço (opcional)')).toBeTruthy();
  });

  it('deve disparar as ações do formulário', () => {
    const { getByTestId } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    fireEvent.press(getByTestId('button-back'));
    fireEvent.press(getByTestId('button-take-photo'));
    fireEvent.press(getByTestId('button-pick-gallery'));
    fireEvent.changeText(getByTestId('input-description'), 'Cão marrom');
    fireEvent.changeText(getByTestId('input-address'), 'Rua A');
    fireEvent.press(getByTestId('button-submit-report'));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(hookValue.takePhoto).toHaveBeenCalledTimes(1);
    expect(hookValue.pickFromGallery).toHaveBeenCalledTimes(1);
    expect(hookValue.setDescription).toHaveBeenCalledWith('Cão marrom');
    expect(hookValue.setAddress).toHaveBeenCalledWith('Rua A');
    expect(hookValue.submit).toHaveBeenCalledTimes(1);
  });

  it('deve exibir e remover fotos e esconder os botões ao atingir o limite', () => {
    useReportLostPet.mockReturnValue({
      ...hookValue,
      photos: [{ uri: 'a.jpg' }, { uri: 'b.jpg' }],
      remainingPhotos: 0,
    });

    const { getAllByTestId, getByLabelText, queryByTestId, getByText } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    expect(getAllByTestId('report-photo')).toHaveLength(2);
    expect(getByText('Fotos do pet (2/5)')).toBeTruthy();
    expect(queryByTestId('button-take-photo')).toBeNull();

    fireEvent.press(getByLabelText('Remover foto 2'));
    expect(hookValue.removePhoto).toHaveBeenCalledWith('b.jpg');
  });

  it('deve mostrar carregamento e bloquear o botão enquanto salva', () => {
    useReportLostPet.mockReturnValue({ ...hookValue, isSaving: true });

    const { getByTestId, queryByText } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    expect(
      queryByText('Registrar desaparecimento', { exact: true })
    ).toBeTruthy();
    expect(
      getByTestId('button-submit-report').props.accessibilityState
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('deve fechar o teclado ao confirmar o endereço sem salvar', () => {
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    const { getByTestId } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    fireEvent(getByTestId('input-address'), 'submitEditing');

    expect(dismissSpy).toHaveBeenCalledTimes(1);
    expect(hookValue.submit).not.toHaveBeenCalled();
    dismissSpy.mockRestore();
  });

  it('deve fechar o teclado ao tocar nos botões', () => {
    useReportLostPet.mockReturnValue({
      ...hookValue,
      photos: [{ uri: 'a.jpg' }],
    });
    const dismissSpy = jest.spyOn(Keyboard, 'dismiss');
    const { getByTestId, getByLabelText } = render(
      <ReportLostPetScreen onBack={onBack} onSaved={onSaved} />
    );

    fireEvent.press(getByTestId('button-take-photo'));
    fireEvent.press(getByLabelText('Remover foto 1'));
    fireEvent.press(getByTestId('button-submit-report'));

    expect(dismissSpy).toHaveBeenCalledTimes(3);
    dismissSpy.mockRestore();
  });

  it('deve executar a seta de voltar ao usar o voltar do Android', () => {
    jest.spyOn(BackHandler, 'addEventListener');
    render(<ReportLostPetScreen onBack={onBack} onSaved={onSaved} />);

    expect(pressHardwareBack()).toBe(true);
    expect(onBack).toHaveBeenCalledTimes(1);
    BackHandler.addEventListener.mockRestore();
  });
});
