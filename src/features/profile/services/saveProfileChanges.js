import { profileService } from './profileService';
import { accountService } from '../../auth/services/accountService';
import { sessionService } from '../../auth/services/sessionService';
import { profilePhotoStorage } from '../../../shared/services/photoStorage';
import { toProfileData } from '../profileForm';

// Salva as alterações do perfil: copia a foto nova para a pasta permanente,
// grava o perfil, apaga a foto antiga e troca a senha, se informada.
// Devolve o endereço da foto gravada (ou null).
export async function saveProfileChanges(values, previousPhotoUri) {
  const photoUri = await profilePhotoStorage.persist(values.photoUri);
  await profileService.saveProfile({
    ...toProfileData(values),
    ...(photoUri ? { photoUri } : {}),
  });
  if (previousPhotoUri !== photoUri) {
    profilePhotoStorage.remove(previousPhotoUri);
  }

  const newPassword = values.newPassword.trim();
  if (newPassword) {
    const usuario = await sessionService.getCurrentUser();
    await accountService.changePassword(usuario, newPassword);
  }
  return photoUri;
}
