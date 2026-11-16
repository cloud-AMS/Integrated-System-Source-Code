import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Crypto from 'expo-crypto';
import { Camera } from 'lucide-react-native';
import { hitungJarakKm, verifikasiGeofence, type PayloadClock, type ResponsClock } from '@ams/core';
import { Badge, Button, Card, EmptyState } from '../../src/components/ui';
import { useAbsensiHariIni, useClock, useGeoLokasi } from '../../src/hooks/useAttendance';
import { ApiError, TOKEN_KEY } from '../../src/lib/api';
import { API_BASE_URL } from '../../src/lib/config';
import { ambilItem, simpanItem } from '../../src/lib/storage';
import { warna } from '../../src/theme/tokens';

const DEVICE_KEY = 'ams_device_id';
const FOTO_MAKS_BYTE = 5 * 1024 * 1024;

interface Titik {
  lat: number;
  lon: number;
  akurasiMeter: number;
  mock: boolean;
}

export default function Absen() {
  const insets = useSafeAreaInsets();
  const hariIni = useAbsensiHariIni();
  const geo = useGeoLokasi();
  const { masuk, keluar } = useClock();
  const [titik, setTitik] = useState<Titik | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [kamera, setKamera] = useState(false);
  const [izinKamera, mintaIzinKamera] = useCameraPermissions();
  const [hasil, setHasil] = useState<ResponsClock | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [tokenFoto, setTokenFoto] = useState<string | null>(null);
  const kameraRef = useRef<CameraView>(null);

  useEffect(() => {
    (async () => {
      let id = await ambilItem(DEVICE_KEY);
      if (!id) {
        id = Crypto.randomUUID();
        await simpanItem(DEVICE_KEY, id);
      }
      setDeviceId(id);
      setTokenFoto(await ambilItem(TOKEN_KEY));
    })();
  }, []);

  const ambilLokasi = useCallback(async () => {
    setGalat(null);
    try {
      const izin = await Location.requestForegroundPermissionsAsync();
      if (izin.status !== 'granted') {
        setGalat('Izin lokasi ditolak. Aktifkan GPS untuk absensi.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setTitik({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        akurasiMeter: Math.round(pos.coords.accuracy ?? 0),
        mock: pos.mocked ?? false
      });
    } catch {
      setGalat('Gagal mengambil lokasi. Pastikan GPS aktif dan izin diberikan.');
    }
  }, []);

  // Pratinjau sisi klien; keputusan final tetap di server (blueprint §7.2).
  const pratinjauGeofence = useMemo(() => {
    if (!titik || !geo.data?.lokasi.length) return null;
    let terbaik: { nama: string; jarak: number; dalam: boolean } | null = null;
    for (const l of geo.data.lokasi) {
      const jarak = hitungJarakKm(titik.lat, titik.lon, l.lat, l.lon) * 1000;
      if (!terbaik || jarak < terbaik.jarak) {
        terbaik = {
          nama: l.nama,
          jarak,
          dalam: verifikasiGeofence(jarak / 1000, l.radiusMeter).dalamPagar
        };
      }
    }
    return terbaik;
  }, [titik, geo.data]);

  const ambilSelfie = async () => {
    if (!izinKamera?.granted) {
      const izin = await mintaIzinKamera();
      if (!izin.granted) {
        setGalat('Izin kamera ditolak.');
        return;
      }
    }
    setKamera(true);
  };

  const jepret = async () => {
    const cam = kameraRef.current;
    if (!cam) return;
    try {
      const fotoHasil = await cam.takePictureAsync({ base64: true, quality: 0.6 });
      if (!fotoHasil?.base64) {
        setGalat('Kamera tidak menghasilkan foto.');
        return;
      }
      const dataUrl = `data:image/jpeg;base64,${fotoHasil.base64}`;
      if (dataUrl.length * 0.75 > FOTO_MAKS_BYTE) {
        setGalat('Foto terlalu besar (batas 5 MB).');
        return;
      }
      setFoto(dataUrl);
      setKamera(false);
    } catch {
      setGalat('Gagal mengambil foto.');
    }
  };

  const kirim = (jenis: 'in' | 'out') => {
    if (!titik) {
      setGalat('Ambil lokasi GPS terlebih dahulu.');
      return;
    }
    if (!foto) {
      setGalat('Ambil selfie sebagai bukti absensi.');
      return;
    }
    if (!deviceId) return;
    setGalat(null);
    setHasil(null);
    const payload: PayloadClock = {
      lat: titik.lat,
      lon: titik.lon,
      akurasiMeter: titik.akurasiMeter,
      foto,
      deviceId,
      idempotencyKey: Crypto.randomUUID(),
      mockLocation: titik.mock
    };
    const mutasi = jenis === 'in' ? masuk : keluar;
    mutasi.mutate(payload, {
      onSuccess: (data) => {
        setHasil(data);
        setFoto(null);
      },
      onError: (e) => setGalat(e instanceof ApiError ? e.message : 'Gagal mengirim absensi.')
    });
  };

  const rec = hariIni.data?.record ?? null;
  const sedangKirim = masuk.isPending || keluar.isPending;

  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="gap-4 p-4 pb-8">
      <Card
        judul="Absensi Geofencing"
        keterangan="Server memverifikasi lokasi, akurasi ≤ 50 m, dan waktu resmi."
      >
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              {titik ? (
                <>
                  <Text className="font-mono text-xs text-slate-900">
                    {titik.lat.toFixed(5)}, {titik.lon.toFixed(5)}
                  </Text>
                  <Text className="text-2xs text-slate-500">
                    Akurasi ±{titik.akurasiMeter} m{titik.mock ? ' • TERDETEKSI MOCK' : ''}
                  </Text>
                </>
              ) : (
                <Text className="text-xs text-slate-500">Lokasi belum diambil.</Text>
              )}
            </View>
            <Button judul="GPS" variant="sekunder" onPress={ambilLokasi} />
          </View>

          {pratinjauGeofence && (
            <Badge tone={pratinjauGeofence.dalam ? 'emerald' : 'rose'}>
              {pratinjauGeofence.dalam ? 'Dalam pagar' : 'Luar pagar'} •{' '}
              {Math.round(pratinjauGeofence.jarak)} m dari {pratinjauGeofence.nama}
            </Badge>
          )}
          {titik?.mock && <Badge tone="rose">Lokasi tiruan akan ditolak server</Badge>}

          <View className="flex-row items-center gap-3">
            {foto ? (
              <Image source={{ uri: foto }} className="h-16 w-16 rounded-lg border border-slate-200" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100">
                <Camera color={warna.muted} size={20} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-700">Selfie bukti</Text>
              <Text className="text-2xs text-slate-500">Wajib; terikat waktu dan lokasi server.</Text>
            </View>
            <Button judul="Selfie" variant="sekunder" onPress={ambilSelfie} />
          </View>

          {galat && <Text className="text-xs font-semibold text-rose-600">{galat}</Text>}

          {rec && rec.jamMasuk && !rec.jamKeluar ? (
            <Button
              judul={`Clock Out (masuk ${rec.jamMasuk})`}
              onPress={() => kirim('out')}
              loading={keluar.isPending}
              disabled={sedangKirim}
            />
          ) : rec?.jamKeluar ? (
            <EmptyState
              judul="Absen lengkap hari ini"
              pesan={`Masuk ${rec.jamMasuk} • Keluar ${rec.jamKeluar} • ${rec.status}`}
            />
          ) : (
            <Button
              judul="Clock In"
              onPress={() => kirim('in')}
              loading={masuk.isPending}
              disabled={sedangKirim}
            />
          )}
        </View>
      </Card>

      {hasil && (
        <Card
          judul="Hasil Absensi"
          keterangan={`Jam server: ${hasil.record.jamMasuk}${hasil.record.jamKeluar ? ` – ${hasil.record.jamKeluar}` : ''}`}
        >
          <View className="gap-2">
            <Badge tone={hasil.record.status === 'Hadir' ? 'emerald' : 'amber'}>
              {hasil.record.status}
            </Badge>
            <Text className="text-xs text-slate-700">{hasil.geofence.label}</Text>
            <Text className="text-2xs text-slate-500">
              Lokasi: {hasil.record.lokasi} • {hasil.record.geofence?.jarakMeter ?? 0} m dari titik pusat
            </Text>
            {(hasil.record.fotoMasukUrl || hasil.record.fotoKeluarUrl) && tokenFoto && (
              <Image
                source={{
                  uri: `${API_BASE_URL}${hasil.record.fotoKeluarUrl ?? hasil.record.fotoMasukUrl}`,
                  headers: { Authorization: `Bearer ${tokenFoto}` }
                }}
                className="h-40 w-full rounded-xl border border-slate-200"
                resizeMode="cover"
              />
            )}
            {hasil.sudahAda && <Badge tone="blue">Idempoten — rekaman sudah ada</Badge>}
          </View>
        </Card>
      )}

      <Modal visible={kamera} animationType="slide" onRequestClose={() => setKamera(false)}>
        <View className="flex-1 bg-slate-900">
          {kamera && <CameraView ref={kameraRef} facing="front" className="flex-1" />}
          <View
            className="flex-row items-center justify-center gap-4 bg-slate-900 px-6 pt-6"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <Button judul="Batal" variant="sekunder" onPress={() => setKamera(false)} />
            <Button judul="Jepret" onPress={jepret} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}