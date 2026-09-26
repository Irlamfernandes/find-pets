import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { SafeTouchable } from '../components/SafeTouchable';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';
import { palette } from '../theme/colors';
import { useAppAlert } from '../components/AppAlert';
import PasswordPromptModal from '../components/PasswordPromptModal';
import { BiometricSettingsCard } from '../components/BiometricSettingsCard';
import { UserAvatar } from '../components/UserAvatar';
import { OptionsSheet } from '../components/OptionsSheet';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { photoService } from '../services/photoService';
import { profilePhotoStorage } from '../services/profilePhotoStorage';
import { FormScrollView, FormTextInput } from '../components/FormScrollView';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { useBackHandler } from '../hooks/useBackHandler';
import { dismissKeyboardAnd } from '../utils/keyboard';
import { useSingleFlight } from '../hooks/useSingleFlight';
import {
  formatPhone,
  onlyDigits,
  withCountryCode,
  PHONE_MIN_DIGITS,
} from '../utils/phoneMask';

export default function ProfileScreen({ onBack, onOpenReport, onLogout }) {
  const showAlert = useAppAlert();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const whatsappRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  // A barra inferior some com o teclado aberto para não cobrir os campos
  const isKeyboardVisible = useKeyboardVisible();
  useBackHandler(dismissKeyboardAnd(onBack));
  const [photoUri, setPhotoUri] = useState(null);
  const [isPhotoOptionsVisible, setIsPhotoOptionsVisible] = useState(false);
  const [isPhotoViewerVisible, setIsPhotoViewerVisible] = useState(false);
  const [savedProfile, setSavedProfile] = useState({
    name: '',
    whatsapp: '',
    photoUri: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordPromptVisible, setIsPasswordPromptVisible] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await onboardingService.getUserProfile();
      if (profile) {
        const loadedProfile = {
          name: profile.name || '',
          whatsapp: formatPhone(withCountryCode(profile.whatsapp)),
          photoUri: profile.photoUri || null,
        };
        setSavedProfile(loadedProfile);
        setName(loadedProfile.name);
        setWhatsapp(loadedProfile.whatsapp);
        setPhotoUri(loadedProfile.photoUri);
      }
    } catch {
      showAlert({
        type: 'danger',
        title: 'Perfil indisponível',
        message: 'Não foi possível carregar seus dados agora.',
      });
    }
  };

  // Busca as credenciais do usuário logado na sessão atual
  const getCurrentCredentials = async () => {
    const session = await sessionService.getSession();
    return sessionService.getCredentials(session?.usuario);
  };

  const openPasswordPrompt = () => {
    setPasswordError('');
    setIsPasswordPromptVisible(true);
  };

  const closePasswordPrompt = () => {
    setPasswordError('');
    setIsPasswordPromptVisible(false);
  };

  const handleConfirmPassword = async (currentPassword) => {
    if (!currentPassword.trim()) {
      setPasswordError('Digite sua senha atual.');
      return false;
    }

    setIsVerifyingPassword(true);
    try {
      const creds = await getCurrentCredentials();
      const isPasswordValid = await sessionService.verifyPassword(
        currentPassword,
        creds?.passwordHash
      );

      if (!isPasswordValid) {
        setPasswordError('Senha incorreta. Tente novamente.');
        return false;
      }

      closePasswordPrompt();
      setIsEditing(true);
      return true;
    } catch {
      setPasswordError('Não foi possível verificar a senha agora.');
      return false;
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const choosePhoto = async (source) => {
    try {
      const { uri, denied } = await photoService.pickProfilePhoto(source);
      if (denied) {
        showAlert({
          type: 'warning',
          title: 'Permissão necessária',
          message:
            source === 'camera'
              ? 'Permita o acesso à câmera para tirar sua foto.'
              : 'Permita o acesso às fotos para escolher sua foto.',
        });
        return;
      }
      if (uri) setPhotoUri(uri);
    } catch {
      showAlert({
        type: 'danger',
        title: 'Não foi possível trocar a foto',
        message: 'Tente novamente em alguns instantes.',
      });
    }
  };

  const photoOptions = [
    {
      label: 'Tirar foto',
      icon: 'camera-outline',
      onPress: () => choosePhoto('camera'),
    },
    {
      label: 'Escolher da galeria',
      icon: 'images-outline',
      onPress: () => choosePhoto('gallery'),
    },
    ...(photoUri
      ? [
          {
            label: 'Remover foto',
            icon: 'trash-outline',
            destructive: true,
            onPress: () => setPhotoUri(null),
          },
        ]
      : []),
  ];

  const handleCancelEditing = () => {
    setName(savedProfile.name);
    setWhatsapp(savedProfile.whatsapp);
    setPhotoUri(savedProfile.photoUri);
    setNewPassword('');
    setConfirmPassword('');
    setIsNewPasswordVisible(false);
    setIsEditing(false);
  };

  const handleSaveChanges = async () => {
    if (!name.trim() || !whatsapp.trim()) {
      showAlert({
        type: 'warning',
        title: 'Confira seus dados',
        message: 'Nome e WhatsApp precisam ser preenchidos.',
      });
      return;
    }

    const cleanedPhone = onlyDigits(whatsapp);
    if (cleanedPhone.length < PHONE_MIN_DIGITS) {
      showAlert({
        type: 'warning',
        title: 'WhatsApp inválido',
        message: 'Informe um número válido com código do país e DDD.',
      });
      return;
    }

    // Mesma regra do aviso na tela: espaços nas pontas são ignorados
    if (newPassword.trim() && newPassword.trim() !== confirmPassword.trim()) {
      showAlert({
        type: 'warning',
        title: 'Senhas diferentes',
        message: 'A confirmação precisa ser igual à nova senha.',
      });
      return;
    }

    try {
      // Copia a foto nova para a pasta permanente do app antes de salvar
      const storedPhotoUri = await profilePhotoStorage.persist(photoUri);

      // Salva o perfil atualizado utilizando o onboardingService
      await onboardingService.saveUserProfile({
        name: name.trim(),
        whatsapp: cleanedPhone,
        ...(storedPhotoUri ? { photoUri: storedPhotoUri } : {}),
      });
      if (savedProfile.photoUri !== storedPhotoUri) {
        profilePhotoStorage.remove(savedProfile.photoUri);
      }

      // Se o utilizador preencheu uma nova senha, atualiza as credenciais seguras
      if (newPassword.trim()) {
        const creds = await getCurrentCredentials();
        if (creds?.usuario) {
          await sessionService.saveCredentials(
            creds.usuario,
            newPassword.trim(),
            creds.hasBiometrics
          );
        }
      }

      showAlert({
        type: 'success',
        title: 'Perfil atualizado',
        message: 'Suas informações foram salvas com sucesso.',
      });
      setSavedProfile({
        name: name.trim(),
        whatsapp,
        photoUri: storedPhotoUri,
      });
      setPhotoUri(storedPhotoUri);
      setNewPassword('');
      setConfirmPassword('');
      setIsNewPasswordVisible(false);
      setIsEditing(false);
      if (onBack) onBack();
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível salvar',
        message: `Tente novamente. ${error.message}`,
      });
    }
  };

  // Ao apagar a nova senha, a confirmação some e é limpa junto
  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    if (!text) setConfirmPassword('');
  };

  // Só acusa diferença depois que a pessoa começou a confirmar
  const passwordsMismatch =
    confirmPassword.length > 0 && confirmPassword.trim() !== newPassword.trim();

  // Botão e tecla "concluir" compartilham a mesma trava
  const saveChanges = useSingleFlight(dismissKeyboardAnd(handleSaveChanges));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <SafeTouchable
          accessibilityLabel="Voltar"
          onPress={dismissKeyboardAnd(onBack)}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </SafeTouchable>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </View>
        {onLogout ? (
          <SafeTouchable
            onPress={dismissKeyboardAnd(onLogout)}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Sair</Text>
          </SafeTouchable>
        ) : null}
      </View>

      <FormScrollView style={styles.flex} contentContainerStyle={styles.form}>
        <View style={styles.avatarSection}>
          <UserAvatar
            uri={photoUri}
            size={112}
            accessibilityLabel="Ver foto do perfil em tela cheia"
            onPress={
              photoUri
                ? dismissKeyboardAnd(() => setIsPhotoViewerVisible(true))
                : undefined
            }
          />
          {isEditing ? (
            <SafeTouchable
              testID="button-change-photo"
              accessibilityLabel="Alterar foto do perfil"
              style={styles.changePhotoButton}
              onPress={dismissKeyboardAnd(() => setIsPhotoOptionsVisible(true))}
            >
              <Ionicons name="camera" size={18} color={palette.white} />
            </SafeTouchable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meus dados</Text>
          {isEditing ? null : (
            <SafeTouchable
              testID="button-edit-profile"
              accessibilityLabel="Editar perfil"
              style={styles.editButton}
              onPress={dismissKeyboardAnd(openPasswordPrompt)}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={palette.primary}
              />
            </SafeTouchable>
          )}
        </View>

        <Text style={styles.label}>Nome</Text>
        <FormTextInput
          style={[styles.input, !isEditing && styles.inputLocked]}
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          editable={isEditing}
          selectionColor={palette.primary}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => whatsappRef.current?.focus()}
        />

        <Text style={styles.label}>WhatsApp</Text>
        <FormTextInput
          ref={whatsappRef}
          style={[styles.input, !isEditing && styles.inputLocked]}
          value={whatsapp}
          onChangeText={(text) => setWhatsapp(formatPhone(text))}
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
            <Text style={styles.label}>Nova Senha (Opcional)</Text>
            <View style={styles.passwordContainer}>
              <FormTextInput
                ref={newPasswordRef}
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                placeholder="Digite uma nova senha se desejar alterar"
                secureTextEntry={!isNewPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={palette.primary}
                returnKeyType={newPassword ? 'next' : 'done'}
                submitBehavior={newPassword ? 'submit' : 'blurAndSubmit'}
                onSubmitEditing={
                  newPassword
                    ? () => confirmPasswordRef.current?.focus()
                    : saveChanges
                }
              />
              <SafeTouchable
                testID="button-toggle-password-visibility"
                accessibilityLabel={
                  isNewPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'
                }
                style={styles.passwordToggle}
                onPress={() => setIsNewPasswordVisible((visible) => !visible)}
              >
                <Ionicons
                  name={
                    isNewPasswordVisible ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={22}
                  color={palette.textMuted}
                />
              </SafeTouchable>
            </View>

            {newPassword ? (
              <>
                <Text style={styles.label}>Confirmar nova senha</Text>
                <FormTextInput
                  ref={confirmPasswordRef}
                  style={[styles.input, passwordsMismatch && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Digite a nova senha novamente"
                  secureTextEntry={!isNewPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={palette.primary}
                  returnKeyType="done"
                  onSubmitEditing={saveChanges}
                />
                {passwordsMismatch ? (
                  <Text style={styles.fieldError}>As senhas não conferem.</Text>
                ) : null}
              </>
            ) : null}

            <SafeTouchable style={styles.saveButton} onPress={saveChanges}>
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            </SafeTouchable>

            <SafeTouchable
              style={styles.cancelButton}
              onPress={dismissKeyboardAnd(handleCancelEditing)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </SafeTouchable>
          </>
        ) : (
          <Text style={styles.lockedHint}>
            Toque no lápis para editar. Sua senha atual será solicitada.
          </Text>
        )}

        <BiometricSettingsCard />
      </FormScrollView>

      <OptionsSheet
        visible={isPhotoOptionsVisible}
        title="Foto do perfil"
        options={photoOptions}
        onClose={() => setIsPhotoOptionsVisible(false)}
      />

      <PhotoViewerModal
        images={isPhotoViewerVisible && photoUri ? [photoUri] : []}
        onClose={() => setIsPhotoViewerVisible(false)}
      />

      <PasswordPromptModal
        visible={isPasswordPromptVisible}
        title="Editar perfil"
        message="Digite sua senha atual para liberar a edição dos dados."
        errorMessage={passwordError}
        isVerifying={isVerifyingPassword}
        onCancel={closePasswordPrompt}
        onConfirm={handleConfirmPassword}
      />

      {isKeyboardVisible ? null : (
        <View style={styles.bottomBar}>
          <SafeTouchable style={styles.tabButton} onPress={onBack}>
            <Ionicons name="paw-outline" size={22} color={palette.textMuted} />
            <Text style={styles.tabButtonText}>Pets perdidos</Text>
          </SafeTouchable>

          <SafeTouchable
            style={styles.tabButton}
            onPress={onOpenReport || onBack}
          >
            <Ionicons
              name="megaphone-outline"
              size={22}
              color={palette.textMuted}
            />
            <Text style={styles.tabButtonText} numberOfLines={2}>
              Registrar desaparecimento
            </Text>
          </SafeTouchable>

          <SafeTouchable style={[styles.tabButton, styles.tabButtonActive]}>
            <Ionicons name="person-outline" size={22} color={palette.primary} />
            <Text style={styles.tabButtonText}>Perfil</Text>
          </SafeTouchable>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardBorder,
  },
  backButton: { padding: 4 },
  backButtonText: { fontSize: 20, color: palette.primary, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  logoutButtonText: { color: palette.text, fontWeight: 'bold', fontSize: 12 },
  form: {
    padding: 16,
    paddingBottom: 120,
  },
  avatarSection: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.surface,
  },
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: palette.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  saveButton: {
    backgroundColor: palette.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: palette.text,
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: { borderColor: palette.error },
  fieldError: { color: palette.error, fontSize: 13, marginTop: 6 },
  inputLocked: {
    backgroundColor: palette.background,
    color: palette.textMuted,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.cardBorder,
  },
  cancelButtonText: { color: palette.text, fontSize: 16, fontWeight: 'bold' },
  lockedHint: {
    marginTop: 16,
    fontSize: 13,
    color: palette.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: palette.primarySoft,
  },
  tabButtonText: {
    color: palette.text,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
});
