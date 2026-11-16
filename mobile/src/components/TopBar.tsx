import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { BRAND } from '../theme/tokens';

export function TopBar() {
  const insets = useSafeAreaInsets();
  const { sesi } = useAuth();
  const inisial = (sesi?.user.fullName ?? '?')
    .split(' ')
    .map((k) => k[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      className="flex-row items-center gap-3 border-b border-slate-200 bg-white px-4 pb-3"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
        <Text className="text-xs font-bold text-white">AMS</Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-slate-900">{BRAND.nama}</Text>
        <Text className="text-2xs text-slate-500">{BRAND.sub}</Text>
      </View>
      <View className="h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
        <Text className="text-xs font-bold text-slate-700">{inisial}</Text>
      </View>
    </View>
  );
}