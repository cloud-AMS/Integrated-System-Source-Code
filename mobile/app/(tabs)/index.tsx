import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Badge, Button, Card, EmptyState, StatCard, type Tone } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { useAbsensiHariIni, useRiwayatAbsensi } from '../../src/hooks/useAttendance';

const TONE_STATUS: Record<string, Tone> = {
  Hadir: 'emerald',
  Terlambat: 'amber',
  Izin: 'blue',
  Sakit: 'slate',
  Mangkir: 'rose'
};

export default function Beranda() {
  const { sesi } = useAuth();
  const hariIni = useAbsensiHariIni();
  const riwayat = useRiwayatAbsensi();
  const rec = hariIni.data?.record ?? null;
  const daftar = riwayat.data?.records ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="gap-4 p-4 pb-8">
      <View>
        <Text className="text-lg font-bold text-slate-900">Halo, {sesi?.user.fullName ?? 'Karyawan'}</Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Badge tone="blue">{sesi?.role.name ?? sesi?.user.roleName}</Badge>
          <Text className="text-xs text-slate-500">{sesi?.user.department}</Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <StatCard label="Jam Masuk" nilai={rec?.jamMasuk || '—'} tone="emerald" />
        <StatCard label="Jam Keluar" nilai={rec?.jamKeluar || '—'} tone="blue" />
      </View>

      <Card judul="Status Hari Ini" keterangan="Jam dan status resmi ditentukan server.">
        {rec ? (
          <Badge tone={TONE_STATUS[rec.status] ?? 'slate'}>
            {rec.status} • {rec.lokasi}
          </Badge>
        ) : (
          <EmptyState judul="Belum absen" pesan="Lakukan clock-in di tab Absen saat berada di area kantor." />
        )}
      </Card>

      <Card judul="Aksi Cepat">
        <Button
          judul={rec && rec.jamMasuk && !rec.jamKeluar ? 'Clock Out Sekarang' : 'Clock In Sekarang'}
          onPress={() => router.push('/(tabs)/absen')}
        />
      </Card>

      <Card judul="Notifikasi Terbaru">
        <EmptyState
          judul="Belum ada notifikasi"
          pesan="Inbox dan push berbasis role hadir pada fase berikutnya (roadmap blueprint §13)."
        />
      </Card>

      <Card judul="Riwayat Terakhir">
        {daftar.length > 0 ? (
          daftar.slice(0, 3).map((r) => (
            <View key={r.id} className="flex-row items-center justify-between border-b border-slate-100 py-2">
              <View>
                <Text className="text-xs font-semibold text-slate-900">{r.tanggal}</Text>
                <Text className="text-2xs text-slate-500">
                  {r.jamMasuk}
                  {r.jamKeluar ? ` – ${r.jamKeluar}` : ''} • {r.lokasi}
                </Text>
              </View>
              <Badge tone={TONE_STATUS[r.status] ?? 'slate'}>{r.status}</Badge>
            </View>
          ))
        ) : (
          <EmptyState judul="Belum ada riwayat" pesan="Riwayat absensi Anda akan tampil di sini." />
        )}
      </Card>
    </ScrollView>
  );
}