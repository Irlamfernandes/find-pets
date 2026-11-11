import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FeedGuideCard, FEED_GUIDE_STEPS } from '../FeedGuideCard';

describe('FeedGuideCard', () => {
  it('deve exibir todos os passos e dispensar ao tocar em Entendi', async () => {
    const onDismiss = jest.fn();
    const { getByText } = await render(<FeedGuideCard onDismiss={onDismiss} />);

    expect(getByText('Como funciona o FindPets')).toBeTruthy();
    FEED_GUIDE_STEPS.forEach((step) => {
      expect(getByText(step.title)).toBeTruthy();
      expect(getByText(step.text)).toBeTruthy();
    });

    await fireEvent.press(getByText('Entendi'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
