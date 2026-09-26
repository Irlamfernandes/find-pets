import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../../../shared/components/SafeTouchable';
import PasswordPromptModal from '../../../shared/components/PasswordPromptModal';
import { BottomTabBar } from '../../../shared/components/BottomTabBar';
import {
  FormScrollView,
  FormTextInput,
} from '../../../shared/components/FormScrollView';
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
  const fieldStyle = [formStyles.input, !isEditing && formStyles.inputLocked];

  return (
    <SafeAreaView style={styles.container}>
      <ProfileHeader onBack={onBack} onLogout={onLogout} />

      <FormScrollView style={styles.flex} contentContainerStyle={styles.form}>
        <ProfilePhotoSection
          photoUri={values.photoUri}
          isEditing={isEditing}
          onChange={(uri) => editor.setField('photoUri', uri)}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus dados</Text>
          {isEditing ? null : (
            <SafeTouchable
              testID="button-edit-profile"
              accessibilityLabel="Editar perfil"
              style={styles.editButton}
              onPress={dismissKeyboardAnd(() => unlockPrompt.open())}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={palette.primary}
              />
            </SafeTouchable>
          )}
        </View>

        <Text style={formStyles.label}>Nome</Text>
        <FormTextInput
          style={fieldStyle}
          value={values.name}
          onChangeText={(text) => editor.setField('name', text)}
          placeholder="Seu nome"
          editable={isEditing}
          selectionColor={palette.primary}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => whatsappRef.current?.focus()}
        />

        <Text style={formStyles.label}>WhatsApp</Text>
        <FormTextInput
          ref={whatsappRef}
          style={fieldStyle}
          value={values.whatsapp}
          onChangeText={(text) => editor.setField('whatsapp', text)}
          placeholder="Seu WhatsApp"
          editable={isEditing}
          keyboardType="phone-pad"
          maxLength={19}
          selectionColor={palette.primary}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: palette.text },
  editButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: palette.primarySoft,
  },
  lockedHint: { marginTop: 16, fontSize: 13, color: palette.textMuted },
});
