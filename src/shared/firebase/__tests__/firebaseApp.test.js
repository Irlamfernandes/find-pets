import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { auth, database } from '../firebaseApp';

describe('firebaseApp', () => {
  it('deve iniciar o projeto com as variáveis do .env e guardar o login', () => {
    const app = initializeApp.mock.results[0].value;

    expect(Object.keys(app.config)).toEqual([
      'apiKey',
      'authDomain',
      'databaseURL',
      'projectId',
      'appId',
    ]);
    expect(getReactNativePersistence).toHaveBeenCalledWith(AsyncStorage);
    expect(initializeAuth).toHaveBeenCalledWith(app, {
      persistence: { storage: AsyncStorage },
    });
    expect(auth).toBe(initializeAuth.mock.results[0].value);
    expect(database).toBe(getDatabase.mock.results[0].value);
  });
});
