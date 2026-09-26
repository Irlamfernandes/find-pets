import { useEffect, useReducer } from 'react';
import { profileService } from '../services/profileService';
import { saveProfileChanges } from '../services/saveProfileChanges';
import {
  INITIAL_PROFILE_STATE,
  profileReducer,
  profileRules,
  hasPasswordMismatch,
} from '../profileForm';
import { validate } from '../../../shared/utils/validation';
import { useAppAlert } from '../../../shared/components/AppAlert';
import { useLatestCallback } from '../../../shared/hooks/useLatestCallback';

// Carrega, edita e salva o perfil da conta conectada
export function useProfileEditor({ onSaved }) {
  const showAlert = useAppAlert();
  const [state, dispatch] = useReducer(profileReducer, INITIAL_PROFILE_STATE);

  const load = useLatestCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      if (profile) dispatch({ type: 'loaded', profile });
    } catch {
      showAlert({
        type: 'danger',
        title: 'Perfil indisponível',
        message: 'Não foi possível carregar seus dados agora.',
      });
    }
  });

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const invalid = validate(state.values, profileRules);
    if (invalid) {
      showAlert(invalid);
      return;
    }

    try {
      const photoUri = await saveProfileChanges(
        state.values,
        state.saved.photoUri
      );
      dispatch({ type: 'saved', photoUri });
      showAlert({
        type: 'success',
        title: 'Perfil atualizado',
        message: 'Suas informações foram salvas com sucesso.',
      });
      onSaved?.();
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível salvar',
        message: `Tente novamente. ${error.message}`,
      });
    }
  };

  return {
    values: state.values,
    isEditing: state.isEditing,
    isPasswordVisible: state.isPasswordVisible,
    passwordsMismatch: hasPasswordMismatch(state.values),
    setField: (field, value) =>
      dispatch({ type: 'fieldChanged', field, value }),
    startEditing: () => dispatch({ type: 'editingStarted' }),
    cancelEditing: () => dispatch({ type: 'editingCancelled' }),
    togglePasswordVisibility: () =>
      dispatch({ type: 'passwordVisibilityToggled' }),
    save,
  };
}
