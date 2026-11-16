import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store SDK 58 tidak punya implementasi web; preview web pakai
// localStorage, native tetap Keychain/Keystore sesuai blueprint §11.
export function ambilItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return Promise.resolve(localStorage.getItem(key));
  return SecureStore.getItemAsync(key);
}

export function simpanItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
}

export function hapusItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
}