import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { onboardingService } from '../services/onboarding';
import { sessionService } from '../services/session';

export default function ProfileScreen({ onBack }) {
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
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim() || !whatsapp.trim()) {
      Alert.alert('Atenção', 'Nome e WhatsApp não podem estar vazios.');
      return;
    }

    const cleanedPhone = whatsapp.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      Alert.alert('Atenção', 'Insira um número de WhatsApp válido com DDD.');
      return;
    }

    try {
      // Salva o perfil atualizado utilizando o onboardingService
      await onboardingService.saveUserProfile({ name: name.trim(), whatsapp: cleanedPhone });

      // Se o utilizador preencheu uma nova senha, atualiza as credenciais seguras
      if (newPassword.trim()) {
        const creds = await sessionService.getCredentials();
        if (creds && creds.usuario) {
          await sessionService.saveCredentials(creds.usuario, newPassword.trim(), creds.hasBiometrics);
        }
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      if (onBack) onBack();
    } catch (error) {
      Alert.alert('Erro', `Não foi possível salvar as alterações: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="Seu WhatsApp"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Nova Senha (Opcional)</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Digite uma nova senha se desejar alterar"
          secureTextEntry
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

ProfileScreen.propTypes = {
  onBack: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: { padding: 4 },
  backButtonText: { fontSize: 16, color: '#007AFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});