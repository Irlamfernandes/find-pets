import AsyncStorage from '@react-native-async-storage/async-storage';
import { guideService } from '../guideService';
import { STORAGE_KEYS } from '../../constants/storageKeys';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('guideService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('deve informar que o aviso ainda não foi visto', async () => {
    await expect(guideService.hasSeenFeedGuide('ana@test.com')).resolves.toBe(
      false
    );
  });

  it('deve marcar o aviso como visto apenas para o usuário informado', async () => {
    await guideService.markFeedGuideSeen('ana@test.com');
    await guideService.markFeedGuideSeen('bia@test.com');

    await expect(guideService.hasSeenFeedGuide('ana@test.com')).resolves.toBe(
      true
    );
    await expect(guideService.hasSeenFeedGuide('caio@test.com')).resolves.toBe(
      false
    );
    expect(
      JSON.parse(await AsyncStorage.getItem(STORAGE_KEYS.FEED_GUIDE_SEEN))
    ).toEqual({ 'ana@test.com': true, 'bia@test.com': true });
  });
});
