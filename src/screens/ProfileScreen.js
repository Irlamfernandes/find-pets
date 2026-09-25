import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';
import { palette } from '../theme/colors';
import { useAppAlert } from '../components/AppAlert';

export default function ProfileScreen({ onBack, onOpenCamera, onLogout }) {
  const showAlert = useAppAlert();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await onboardingService.getUserProfile();
      if (profile) {
        setName(profile.name || '');
        setWhatsapp(profile.whatsapp || '');
      }
    } catch {
      showAlert({
        type: 'danger',
        title: 'Perfil indisponível',
        message: 'Não foi possível carregar seus dados agora.',
      });
    }
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

    const cleanedPhone = whatsapp.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      showAlert({
        type: 'warning',
        title: 'WhatsApp inválido',
        message: 'Informe um número válido com DDD para continuar.',
      });
      return;
    }

    try {
      // Salva o perfil atualizado utilizando o onboardingService
      await onboardingService.saveUserProfile({
        name: name.trim(),
        whatsapp: cleanedPhone,
      });

      // Se o utilizador preencheu uma nova senha, atualiza as credenciais seguras
      if (newPassword.trim()) {
        const creds = await sessionService.getCredentials();
        if (creds && creds.usuario) {
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
      if (onBack) onBack();
    } catch (error) {
      showAlert({
        type: 'danger',
        title: 'Não foi possível salvar',
        message: `Tente novamente. ${error.message}`,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image
            source={require('../../assets/adaptive-icon.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </View>
        {onLogout ? (
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          selectionColor={palette.primary}
          returnKeyType="next"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="Seu WhatsApp"
          keyboardType="phone-pad"
          selectionColor={palette.primary}
          returnKeyType="next"
        />

        <Text style={styles.label}>Nova Senha (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Digite uma nova senha se desejar alterar"
          secureTextEntry
          selectionColor={palette.primary}
          returnKeyType="done"
          onSubmitEditing={() => {
            Keyboard.dismiss();
            handleSaveChanges();
          }}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            Keyboard.dismiss();
            handleSaveChanges();
          }}
        >
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabButton} onPress={onBack}>
          <Ionicons name="home-outline" size={22} color={palette.textMuted} />
          <Text style={styles.tabButtonText}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={onOpenCamera || onBack}
        >
          <Ionicons name="camera-outline" size={22} color={palette.textMuted} />
          <Text style={styles.tabButtonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
          <Ionicons name="person-outline" size={22} color={palette.primary} />
          <Text style={styles.tabButtonText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

ProfileScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
  onOpenCamera: PropTypes.func,
  onLogout: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
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
  },
});
