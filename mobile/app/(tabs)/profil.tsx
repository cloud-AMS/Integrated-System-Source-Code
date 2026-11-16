import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, Button, Card, Field, Input } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { api, ApiError } from '../../src/lib/api';
import { BRAND } from '../../src/theme/tokens';

export default function Profil() {
  const { sesi, keluar } = useAuth();
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [pesan, setPesan] = useState<{ jenis: 'ok' | 'galat'; teks: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const ganti = async () => {
    if (!lama || !baru) {
      setPesan({ jenis: 'galat', teks: 'Kedua kolom sandi wajib diisi.' });
      return;
    }
    setLoading(true);
    setPesan(null);
    try {
      const r = await api.gantiSandi(lama, baru);
      setPesan({ jenis: 'ok', teks: r.pesan });
      setLama('');
      setBaru('');
    } catch (e) {
      setPesan({ jenis: 'galat', teks: e instanceof ApiError ? e.message : 'Gagal memperbarui sandi.' });
    } finally {
      setLoading(false);
    }
  };

  const u = sesi?.user;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="gap-4 p-4 pb-8">
      <Card judul="Akun">
        <View className="gap-2">
          <Text className="text-base font-bold text-slate-900">{u?.fullName}</Text>
          <Text className="text-xs text-slate-500">
            @{u?.username} • {u?.department}
          </Text>
          <View className="flex-row gap-2">
            <Badge tone="blue">{sesi?.role.name}</Badge>
            <Badge tone={u?.isActive ? 'emerald' : 'rose'}>{u?.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
          </View>
          <Text className="text-2xs text-slate-500">{u?.email}</Text>
        </View>
      </Card>

      <Card judul="Ganti Kata Sandi" keterangan="Diproses server (scrypt + audit trail).">
        <View className="gap-3">
          <Field label="Sandi Saat Ini">
            <Input value={lama} onChangeText={setLama} secureTextEntry />
          </Field>
          <Field label="Sandi Baru">
            <Input value={baru} onChangeText={setBaru} secureTextEntry />
          </Field>
          {pesan && (
            <Text className={`text-xs font-semibold ${pesan.jenis === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {pesan.teks}
            </Text>
          )}
          <Button judul="Perbarui Sandi" onPress={ganti} loading={loading} />
        </View>
      </Card>

      <Card judul="Tentang">
        <View className="gap-1">
          <Text className="text-xs font-semibold text-slate-900">
            {BRAND.nama} — versi {BRAND.versi}
          </Text>
          <Text className="text-xs text-slate-500">{BRAND.perusahaan}</Text>
          <Text className="text-2xs text-slate-500">{BRAND.footer}</Text>
          <Text className="text-2xs text-slate-400">coded by Langgo Bramandityo</Text>
        </View>
      </Card>

      <Button judul="Keluar" variant="bahaya" onPress={keluar} />
    </ScrollView>
  );
}