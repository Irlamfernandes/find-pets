import { useState } from 'react';
import { usePetPhotos, MAX_PHOTOS } from './usePetPhotos';
import { publishLostPost, updateLostPost } from '../services/lostPostPublisher';
import { rule, validate } from '../../../shared/utils/validation';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { useSingleFlight } from '../../../shared/hooks/useSingleFlight';

export { MAX_PHOTOS };

// Campos descritivos do pet, na ordem em que aparecem no formulário
const PET_FIELDS = [
  'petName',
  'species',
  'size',
  'sex',
  'color',
  'breed',
  'description',
];

const initialPetData = (post) =>
  Object.fromEntries(PET_FIELDS.map((field) => [field, post?.[field] || '']));

const trimPetData = (petData) =>
  Object.fromEntries(PET_FIELDS.map((field) => [field, petData[field].trim()]));

const reportRules = [
  rule(({ photos }) => photos.length > 0, {
    type: 'warning',
    title: 'Adicione uma foto',
    message: 'Inclua pelo menos uma foto do pet para ajudar a encontrá-lo.',
  }),
  rule(({ petData }) => Boolean(petData.species), {
    type: 'warning',
    title: 'Escolha a espécie',
    message: 'Informe se o pet é cachorro, gato ou outro animal.',
  }),
];

// O que muda entre criar um registro e editar um existente
const CREATE_MODE = {
  save: (_post, draft) => publishLostPost(draft),
  successAlert: {
    type: 'success',
    title: 'Desaparecimento registrado',
    message: 'O registro já aparece na lista de pets perdidos.',
  },
  errorTitle: 'Não foi possível registrar',
};

const EDIT_MODE = {
  save: updateLostPost,
  successAlert: {
    type: 'success',
    title: 'Registro atualizado',
    message: 'As alterações já aparecem na lista de pets perdidos.',
  },
  errorTitle: 'Não foi possível salvar',
};

// Cria um registro novo ou, com `initialPost`, edita um existente
export function useReportLostPet(onSaved, initialPost = null) {
  const showAlert = useAppAlert();
  const isEditing = Boolean(initialPost);
  const mode = isEditing ? EDIT_MODE : CREATE_MODE;
  const petPhotos = usePetPhotos(initialPost);
  const [petData, setPetData] = useState(() => initialPetData(initialPost));
  const [address, setAddress] = useState(initialPost?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  const setPetField = (field, value) => {
    setPetData((current) => ({ ...current, [field]: value }));
  };

  // Chamadas repetidas enquanto salva recebem o mesmo salvamento, em vez
  // de criar registros duplicados
  const submit = useSingleFlight(async () => {
    const invalid = validate(
      { photos: petPhotos.photos, petData },
      reportRules
    );
    if (invalid) {
      showAlert(invalid);
      return;
    }

    setIsSaving(true);
    try {
      await mode.save(initialPost, {
        photos: petPhotos.photos,
        petData: trimPetData(petData),
        address: address.trim(),
      });
      showAlert(mode.successAlert);
      onSaved?.();
    } catch {
      showAlert({
        type: 'danger',
        title: mode.errorTitle,
        message: 'Tente salvar o registro novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  });

  return {
    isEditing,
    ...petPhotos,
    petData,
    setPetField,
    address,
    setAddress,
    isSaving,
    submit,
  };
}
