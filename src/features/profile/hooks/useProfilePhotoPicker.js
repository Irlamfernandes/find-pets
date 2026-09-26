import { photoService } from '../../../shared/services/photoService';
import { useAppAlert } from '../../../shared/components/AppAlert';

const DENIED_MESSAGES = {
  camera: 'Permita o acesso à câmera para tirar sua foto.',
  gallery: 'Permita o acesso às fotos para escolher sua foto.',
};

// Opções do menu de foto; "Remover" só aparece quando há foto
export function getPhotoOptions({ hasPhoto, onChoose, onRemove }) {
  const options = [
    {
      label: 'Tirar foto',
      icon: 'camera-outline',
      onPress: () => onChoose('camera'),
    },
    {
      label: 'Escolher da galeria',
      icon: 'images-outline',
      onPress: () => onChoose('gallery'),
    },
  ];
  if (!hasPhoto) return options;
  return [
    ...options,
    {
      label: 'Remover foto',
      icon: 'trash-outline',
      destructive: true,
      onPress: onRemove,
    },
  ];
}

// Abre a câmera ou a galeria e entrega a foto escolhida a `onPicked`
export function useProfilePhotoPicker(onPicked) {
  const showAlert = useAppAlert();

  return async (source) => {
    try {
      const { uri, denied } = await photoService.pickProfilePhoto(source);
      if (denied) {
        showAlert({
          type: 'warning',
          title: 'Permissão necessária',
          message: DENIED_MESSAGES[source],
        });
        return;
      }
      if (uri) onPicked(uri);
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível trocar a foto',
        message: 'Tente novamente em alguns instantes.',
      });
    }
  };
}
