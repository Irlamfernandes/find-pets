import React, { useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import PasswordPromptModal from '../../../shared/components/PasswordPromptModal';
import { BottomTabBar } from '../../../shared/components/BottomTabBar';
import { FormScrollView } from '../../../shared/components/FormScrollView';
import { useKeyboardVisible } from '../../../shared/hooks/useKeyboardVisible';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';
import { useSingleFlight } from '../../../shared/hooks/useSingleFlight';
import { dismissKeyboardAnd } from '../../../shared/utils/keyboard';
import { formStyles } from '../../../shared/theme/formStyles';
import { palette } from '../../../shared/theme/colors';
import { BiometricSettingsCard } from '../../auth/components/BiometricSettingsCard';
import { usePasswordPrompt } from '../../auth/hooks/usePasswordPrompt';
import { useProfileEditor } from '../hooks/useProfileEditor';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileDataFields } from '../components/ProfileDataFields';
import { ProfilePhotoSection } from '../components/ProfilePhotoSection';
import { PasswordChangeFields } from '../components/PasswordChangeFields';

export default function ProfileScreen({ onBack, onOpenReport, onLogout }) {
  const editor = useProfileEditor({ onSaved: onBack });
  const { values, isEditing } = editor;
  // A edição só é liberada depois de confirmar a senha atual
  const unlockPrompt = usePasswordPrompt({ onConfirmed: editor.startEditing });
  // A barra inferior some com o teclado aberto para não cobrir os campos
  const isKeyboardVisible = useKeyboardVisible();
  useBackHandler(dismissKeyboardAnd(onBack));
  const whatsappRef = useRef(null);
  const newPasswordRef = useRef(null);

  // Botão e tecla "concluir" compartilham a mesma trava
  const saveChanges = useSingleFlight(dismissKeyboardAnd(editor.save));

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader onBack={onBack} onLogout={onLogout} />

      <FormScrollView style={styles.flex} contentContainerStyle={styles.form}>
        <ProfilePhotoSection
          photoUri={values.photoUri}
          isEditing={isEditing}
          onChange={(uri) => editor.setField('photoUri', uri)}
        />

        <ProfileDataFields
          values={values}
          isEditing={isEditing}
          whatsappRef={whatsappRef}
          onChange={editor.setField}
          onRequestEdit={() => unlockPrompt.open()}
          onWhatsappSubmit={() => newPasswordRef.current?.focus()}
        />

        {isEditing ? (
          <>
            <PasswordChangeFields
              newPasswordRef={newPasswordRef}
              newPassword={values.newPassword}
              confirmPassword={values.confirmPassword}
              isVisible={editor.isPasswordVisible}
              mismatch={editor.passwordsMismatch}
              onChange={editor.setField}
              onToggleVisibility={editor.togglePasswordVisibility}
              onSubmit={saveChanges}
            />

            <SafeTouchable
              style={formStyles.primaryButton}
              onPress={saveChanges}
            >
              <Text style={formStyles.primaryButtonText}>
                Salvar Alterações
              </Text>
            </SafeTouchable>

            <SafeTouchable
              style={formStyles.secondaryButton}
              onPress={dismissKeyboardAnd(editor.cancelEditing)}
            >
              <Text style={formStyles.secondaryButtonText}>Cancelar</Text>
            </SafeTouchable>
          </>
        ) : (
          <Text style={styles.lockedHint}>
            Toque no lápis para editar. Sua senha atual será solicitada.
          </Text>
        )}

        <BiometricSettingsCard />
      </FormScrollView>

      <PasswordPromptModal
        title="Editar perfil"
        message="Digite sua senha atual para liberar a edição dos dados."
        {...unlockPrompt.promptProps}
      />

      {isKeyboardVisible ? null : (
        <BottomTabBar
          active="profile"
          onNavigate={{ feed: onBack, report: onOpenReport || onBack }}
        />
      )}
    </SafeAreaView>
  );
}

ProfileScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
  onOpenReport: PropTypes.func,
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  form: { padding: 16, paddingBottom: 120 },
  lockedHint: { marginTop: 16, fontSize: 13, color: palette.textMuted },
});
