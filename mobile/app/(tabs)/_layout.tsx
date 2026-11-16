import { Tabs } from 'expo-router';
import { Bell, Fingerprint, Home, UserRound } from 'lucide-react-native';
import { TopBar } from '../../src/components/TopBar';
import { warna } from '../../src/theme/tokens';

export default function LayoutTab() {
  return (
    <Tabs
      screenOptions={{
        header: () => <TopBar />,
        tabBarActiveTintColor: warna.aksen,
        tabBarInactiveTintColor: warna.muted,
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: warna.border },
        tabBarLabelStyle: { fontFamily: 'Quicksand_600SemiBold', fontSize: 11 }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Beranda', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="absen"
        options={{ title: 'Absen', tabBarIcon: ({ color, size }) => <Fingerprint color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="notifikasi"
        options={{ title: 'Notifikasi', tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ title: 'Profil', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
      />
    </Tabs>
  );
}