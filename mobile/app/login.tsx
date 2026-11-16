import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Button, Card, Field, Input } from '../src/components/ui';
import { useAuth } from '../src/lib/auth';
import { ApiError } from '../src/lib/api';
import { BRAND } from '../src/theme/tokens';

export default function Login() {
  const insets = useSafeAreaInsets();
  const { masuk } = useAuth();
  const [username, setUsername] = useState('');
  const [sandi, setSandi] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const kirim = async () => {
    if (!username.trim() || !sandi) {
      setGalat('Nama pengguna dan kata sandi wajib diisi.');
      return;
    }
    setLoading(true);
    setGalat(null);
    try {
      await masuk(username.trim(), sandi);
    } catch (e) {
      setGalat(e instanceof ApiError ? e.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50"
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerClassName="flex-grow items-center justify-center px-5"
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-6 items-center gap-2">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-500">
            <Text className="text-lg font-bold text-white">AMS</Text>
          </View>
          <Text className="text-xl font-bold text-slate-900">{BRAND.nama}</Text>
          <Text className="text-center text-xs text-slate-500">
            {BRAND.perusahaan} • CDAKB & ISO 13485
          </Text>
        </View>

        <Card className="w-full max-w-sm">
          <View className="gap-3">
            <Field label="Nama Pengguna">
              <Input
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="mis. budi.santoso"
              />
            </Field>
            <Field label="Kata Sandi">
              <Input value={sandi} onChangeText={setSandi} secureTextEntry placeholder="••••••••" />
            </Field>
            {galat && <Text className="text-xs font-semibold text-rose-600">{galat}</Text>}
            <Button judul="Masuk" onPress={kirim} loading={loading} />
          </View>
        </Card>

        <Text className="mt-6 text-2xs text-slate-500">versi {BRAND.versi}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}