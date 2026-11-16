import { Platform } from 'react-native';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;

const basis = process.env.EXPO_PUBLIC_API_URL ?? extra?.apiBaseUrl ?? 'http://localhost:3000';

// Emulator Android tidak melihat loopback host sebagai "localhost"; 10.0.2.2 adalah
// alias resminya. Perangkat fisik tetap perlu EXPO_PUBLIC_API_URL berisi IP LAN/host.
export const API_BASE_URL =
  Platform.OS === 'android'
    ? basis.replace('//localhost:', '//10.0.2.2:').replace('//127.0.0.1:', '//10.0.2.2:')
    : basis;