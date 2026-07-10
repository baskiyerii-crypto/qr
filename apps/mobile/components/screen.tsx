import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { theme } from '../lib/theme';
import { Card, IconBubble } from './ui';
import { Icon, IconName } from './Icon';
import { AppTopBar } from './layout/AppTopBar';

export const screen = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 20, lineHeight: 22 },
  section: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginTop: 28, marginBottom: 12 },
  back: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  muted: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 48, fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 12,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' as const },
  row: { marginBottom: 10 },
  msg: { color: theme.colors.success, marginBottom: 12, fontWeight: '600', fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
});

export function BackLink({ label = 'Geri' }: { label?: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={backStyles.wrap} activeOpacity={0.7}>
      <Icon name="chevron-back" size={20} color={theme.colors.primary} />
      <Text style={screen.back}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={headerStyles.wrap}>
      <Text style={screen.title}>{title}</Text>
      {subtitle ? <Text style={screen.subtitle}>{subtitle}</Text> : null}
      {right ? <View style={headerStyles.right}>{right}</View> : null}
    </View>
  );
}

type HubItem = { title: string; subtitle?: string; href: Href; icon?: IconName };

export function HubMenu({ items }: { items: HubItem[] }) {
  const router = useRouter();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <TouchableOpacity key={String(item.href)} onPress={() => router.push(item.href)} activeOpacity={0.75}>
          <Card style={hubStyles.card}>
            <View style={hubStyles.row}>
              {item.icon ? <IconBubble name={item.icon} size={42} /> : null}
              <View style={hubStyles.text}>
                <Text style={hubStyles.title}>{item.title}</Text>
                {item.subtitle ? <Text style={hubStyles.subtitle}>{item.subtitle}</Text> : null}
              </View>
              <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ListCard({ title, subtitle, meta, onPress }: { title: string; subtitle?: string; meta?: string; onPress?: () => void }) {
  const body = (
    <Card style={listStyles.card}>
      <View style={listStyles.row}>
        <View style={{ flex: 1 }}>
          <Text style={listStyles.title}>{title}</Text>
          {subtitle ? <Text style={listStyles.subtitle}>{subtitle}</Text> : null}
          {meta ? <Text style={listStyles.meta}>{meta}</Text> : null}
        </View>
        <Icon name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </View>
    </Card>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.75}>{body}</TouchableOpacity> : body;
}

export function ScreenScroll({
  children,
  refreshing,
  onRefresh,
  title,
  showTopBar = true,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  title?: string;
  showTopBar?: boolean;
}) {
  return (
    <View style={screen.container}>
      {showTopBar ? <AppTopBar title={title} /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={screen.content}
        showsVerticalScrollIndicator={false}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} /> : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function FormInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput style={screen.input} placeholderTextColor={theme.colors.textMuted} {...props} />;
}

export function Loading({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <View style={stateStyles.center}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text style={stateStyles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: { icon?: IconName; title: string; subtitle?: string }) {
  return (
    <View style={stateStyles.empty}>
      <IconBubble name={icon} size={56} tone="default" />
      <Text style={stateStyles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={stateStyles.emptySub}>{subtitle}</Text> : null}
    </View>
  );
}

const backStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, alignSelf: 'flex-start' },
});

const headerStyles = StyleSheet.create({
  wrap: { marginBottom: 20 },
  right: { position: 'absolute', right: 0, top: 4 },
});

const hubStyles = StyleSheet.create({
  card: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  text: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
});

const listStyles = StyleSheet.create({
  card: { marginBottom: 8, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 4 },
});

const stateStyles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 12 },
  text: { color: theme.colors.textMuted, fontSize: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 56, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  emptySub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});
