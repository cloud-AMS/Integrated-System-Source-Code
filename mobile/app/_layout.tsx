import '../global.css';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold
} from '@expo-google-fonts/quicksand';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider, useAuth } from '../src/lib/auth';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
});

function GerbangAuth() {
  const { sesi, memuat } = useAuth();

  if (memuat) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#00aaff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!sesi}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!sesi}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold
  });

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GerbangAuth />
      </AuthProvider>
    </QueryClientProvider>
  );
}