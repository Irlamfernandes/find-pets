import { profileService } from './profileService';
import { changeAccountPassword } from '../../auth/services/passwordService';
import { sessionService } from '../../auth/services/sessionService';
import { profilePhotoStorage } from '../../../shared/services/photoStorage';
import { toProfileData, wantsNewPassword } from '../profileForm';

async function changePasswordIfRequested(values) {
  if (!wantsNewPassword(values)) return;
  const usuario = await sessionService.getCurrentUser();
  await changeAccountPassword(usuario, values.newPassword);
}

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
