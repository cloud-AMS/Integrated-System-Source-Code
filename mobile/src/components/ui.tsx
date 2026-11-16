import { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

export type Tone = 'slate' | 'emerald' | 'blue' | 'amber' | 'rose';

const BADGE_WADAH: Record<Tone, string> = {
  slate: 'bg-slate-100 border-slate-200',
  emerald: 'bg-emerald-50 border-emerald-200',
  blue: 'bg-blue-50 border-blue-200',
  amber: 'bg-amber-100 border-amber-200',
  rose: 'bg-rose-100 border-rose-200'
};

const BADGE_TEKS: Record<Tone, string> = {
  slate: 'text-slate-700',
  emerald: 'text-emerald-800',
  blue: 'text-blue-800',
  amber: 'text-amber-800',
  rose: 'text-rose-800'
};

const STAT_TEKS: Record<Tone, string> = {
  slate: 'text-slate-900',
  emerald: 'text-emerald-700',
  blue: 'text-blue-700',
  amber: 'text-amber-700',
  rose: 'text-rose-700'
};

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <View className={`self-start flex-row items-center rounded border px-2 py-0.5 ${BADGE_WADAH[tone]}`}>
      <Text className={`text-2xs font-bold ${BADGE_TEKS[tone]}`}>{children}</Text>
    </View>
  );
}

export function Card({
  judul,
  keterangan,
  aksi,
  children,
  className = ''
}: {
  judul?: string;
  keterangan?: string;
  aksi?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
      style={{ elevation: 1, shadowColor: '#111111', shadowOpacity: 0.04, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
    >
      {(judul || aksi) && (
        <View className="mb-3 flex-row items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <View className="flex-1">
            {judul && <Text className="text-sm font-bold text-slate-900">{judul}</Text>}
            {keterangan && <Text className="mt-0.5 text-xs text-slate-500">{keterangan}</Text>}
          </View>
          {aksi}
        </View>
      )}
      {children}
    </View>
  );
}

export type VarianTombol = 'primer' | 'sekunder' | 'bahaya';

const GAYA_TOMBOL: Record<VarianTombol, string> = {
  primer: 'bg-emerald-600 rounded-xl',
  sekunder: 'border border-slate-300 rounded-lg bg-white',
  bahaya: 'bg-rose-600 rounded-xl'
};

const TEKS_TOMBOL: Record<VarianTombol, string> = {
  primer: 'text-white',
  sekunder: 'text-slate-700',
  bahaya: 'text-white'
};

export function Button({
  judul,
  onPress,
  variant = 'primer',
  disabled,
  loading,
  className = ''
}: {
  judul: string;
  onPress?: () => void;
  variant?: VarianTombol;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 px-4 py-3 ${GAYA_TOMBOL[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'sekunder' ? '#3d3d3d' : '#ffffff'} />
      ) : (
        <Text className={`text-sm font-semibold ${TEKS_TOMBOL[variant]}`}>{judul}</Text>
      )}
    </Pressable>
  );
}

export function StatCard({
  label,
  nilai,
  tone = 'slate'
}: {
  label: string;
  nilai: string;
  tone?: Tone;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
      <Text className="text-xs font-semibold text-slate-500">{label}</Text>
      <Text className={`mt-1 text-lg font-bold ${STAT_TEKS[tone]}`}>{nilai}</Text>
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold text-slate-700">{label}</Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps & { className?: string }) {
  const { className = '', ...sisa } = props;
  return (
    <TextInput
      placeholderTextColor="#7a7a7a"
      {...sisa}
      className={`rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 ${className}`}
    />
  );
}

export function EmptyState({ judul, pesan }: { judul: string; pesan: string }) {
  return (
    <View className="items-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
      <Text className="text-sm font-semibold text-slate-700">{judul}</Text>
      <Text className="text-center text-xs text-slate-500">{pesan}</Text>
    </View>
  );
}