export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId: string;
}

export function resolveFirebaseClientConfig(
  env: Record<string, string | undefined> | undefined,
  defaultConfig: FirebaseClientConfig
): FirebaseClientConfig {
  if (!env || env.VITE_DEPLOYMENT_ENV !== 'staging') {
    return defaultConfig;
  }

  const stagingConfig: FirebaseClientConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    firestoreDatabaseId: env.VITE_FIRESTORE_DATABASE_ID || ''
  };
  const requiredEnvValues: Array<[string, string]> = [
    ['VITE_FIREBASE_API_KEY', stagingConfig.apiKey],
    ['VITE_FIREBASE_AUTH_DOMAIN', stagingConfig.authDomain],
    ['VITE_FIREBASE_PROJECT_ID', stagingConfig.projectId],
    ['VITE_FIREBASE_STORAGE_BUCKET', stagingConfig.storageBucket],
    ['VITE_FIREBASE_MESSAGING_SENDER_ID', stagingConfig.messagingSenderId],
    ['VITE_FIREBASE_APP_ID', stagingConfig.appId],
    ['VITE_FIRESTORE_DATABASE_ID', stagingConfig.firestoreDatabaseId]
  ];
  const missing = requiredEnvValues.filter(([, value]) => !value.trim()).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Firebase staging config belum lengkap: ${missing.join(', ')}`);
  }

  return stagingConfig;
}
