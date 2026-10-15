import { profileService } from './profileService';
import { changeAccountPassword } from '../../auth/services/passwordService';
import { sessionService } from '../../auth/services/sessionService';
import { profilePhotoStorage } from '../../../shared/services/photoStorage';
import { toProfileData, wantsNewPassword } from '../profileForm';

// Troca a senha primeiro: ela precisa de internet e, se falhar, nada do
// perfil é alterado
async function changePasswordIfRequested(values) {
  if (!wantsNewPassword(values)) return;
  const usuario = await sessionService.getCurrentUser();
  await changeAccountPassword(usuario, values.newPassword);
}

// Salva as alterações do perfil: troca a senha, se informada, copia a foto
// nova para a pasta permanente, grava o perfil e apaga a foto antiga.
// Devolve o endereço da foto gravada (ou null).
export async function saveProfileChanges(values, previousPhotoUri) {
  await changePasswordIfRequested(values);

  const photoUri = await profilePhotoStorage.persist(values.photoUri);
  await profileService.saveProfile({
    ...toProfileData(values),
    ...(photoUri ? { photoUri } : {}),
  });
  if (previousPhotoUri !== photoUri) {
    profilePhotoStorage.remove(previousPhotoUri);
  }
  return photoUri;
}
