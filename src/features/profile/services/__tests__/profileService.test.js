import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService } from '../profileService';
import { sessionService } from '../../../auth/services/sessionService';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('../../../../testing/memoryStorage').createAsyncStorageMock()
);

const PROFILE = { name: 'Ana', whatsapp: '5511999999999' };

describe('profileService', () => {
  beforeEach(() => {
    AsyncStorage.__backend.reset();
    jest.clearAllMocks();
  });

  it('deve guardar o perfil de cada conta separadamente', async () => {
    await profileService.saveProfile(PROFILE, 'ana@x.com');
    await profileService.saveProfile({ ...PROFILE, name: 'Bia' }, 'bia@x.com');

    await expect(profileService.getProfile('ana@x.com')).resolves.toEqual(
      PROFILE
    );
    await expect(profileService.getProfile('bia@x.com')).resolves.toEqual({
      ...PROFILE,
      name: 'Bia',
    });
    await expect(profileService.getProfile('caio@x.com')).resolves.toBeNull();
  });

  it('deve usar a conta conectada quando a conta não for informada', async () => {
    await sessionService.saveSession({ usuario: 'ana@x.com' });

    await expect(profileService.saveProfile(PROFILE)).resolves.toEqual(PROFILE);
    await expect(profileService.getProfile()).resolves.toEqual(PROFILE);
    await expect(profileService.getProfile('ana@x.com')).resolves.toEqual(
      PROFILE
    );
  });

  it('deve exigir nome e WhatsApp', async () => {
    await expect(
      profileService.saveProfile({ name: 'Ana' }, 'ana@x.com')
    ).rejects.toThrow('Dados inválidos para salvamento do perfil.');
    await expect(profileService.saveProfile(null)).rejects.toThrow(
      'Dados inválidos para salvamento do perfil.'
    );
  });

  it('não deve salvar nem ler perfil sem conta conectada', async () => {
    await expect(profileService.saveProfile(PROFILE)).rejects.toThrow(
      'Erro ao salvar perfil: Nenhuma conta conectada.'
    );
    await expect(profileService.getProfile()).resolves.toBeNull();
  });

  it('deve informar a falha ao ler', async () => {
    AsyncStorage.getItem.mockRejectedValueOnce(new Error('indisponível'));

    await expect(profileService.getProfile('ana@x.com')).rejects.toThrow(
      'Erro ao buscar perfil: indisponível'
    );
  });
});
