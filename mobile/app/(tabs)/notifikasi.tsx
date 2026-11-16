import { ScrollView, Text, View } from 'react-native';
import { Badge, Card, EmptyState } from '../../src/components/ui';

export default function Notifikasi() {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="gap-4 p-4 pb-8">
      <Card
        judul="Inbox Notifikasi"
        keterangan="Notifikasi pekerjaan dirutekan server sesuai role dan permission Anda."
        aksi={<Badge tone="blue">Realtime segera</Badge>}
      >
        <EmptyState
          judul="Belum ada notifikasi"
          pesan="Endpoint /api/notifications dan push FCM/APNs berada di roadmap fase 3 (blueprint §8 dan §13)."
        />
      </Card>
      <Card judul="Kanal Pengiriman">
        <View className="gap-2">
          <Text className="text-xs text-slate-700">• In-app realtime via WebSocket /api/sync/ws.</Text>
          <Text className="text-xs text-slate-700">• Push FCM (Android) / APNs (iOS) saat aplikasi di latar belakang.</Text>
          <Text className="text-xs text-slate-700">• Status read/unread tersinkron server agar konsisten antar perangkat.</Text>
        </View>
      </Card>
    </ScrollView>
  );
}