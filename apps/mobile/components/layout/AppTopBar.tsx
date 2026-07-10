import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOptionalDrawer } from './DrawerContext';
import { Icon } from '../Icon';
import { theme } from '../../lib/theme';

export function AppTopBar({ title, showBack, onBack }: { title?: string; showBack?: boolean; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const drawer = useOptionalDrawer();

  if (!drawer && !showBack) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={styles.menuBtn} onPress={showBack ? onBack : drawer?.toggleDrawer} activeOpacity={0.8}>
        <Icon name={showBack ? 'chevron-back' : 'menu-outline'} size={22} color={theme.colors.text} />
      </TouchableOpacity>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      ) : (
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>QR Personel</Text>
        </View>
      )}
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.sm,
  },
  title: { flex: 1, fontSize: 18, fontWeight: '600', color: theme.colors.text, letterSpacing: -0.3 },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
  brand: { fontSize: 17, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.3 },
  spacer: { width: 42 },
});
