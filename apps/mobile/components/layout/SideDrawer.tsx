import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../stores/auth';
import { useDrawer } from './DrawerContext';
import { getMenuSections } from '../../lib/menu';
import { Icon } from '../Icon';
import { Avatar } from '../ui';
import { theme } from '../../lib/theme';
import { useNotifications } from '../../lib/queries';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.84, 320);

function normalizeRoute(route: string) {
  return route.replace(/\([^)]*\)/g, '').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function SideDrawer() {
  const { open, closeDrawer } = useDrawer();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: open ? 0 : -DRAWER_WIDTH, useNativeDriver: true, damping: 24, stiffness: 240 }),
      Animated.timing(backdrop, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [open, translateX, backdrop]);

  const sections = getMenuSections(user?.role);
  const { unread: unreadNotifications } = useNotifications();

  const navigate = (href: Href) => {
    closeDrawer();
    setTimeout(() => router.push(href), 100);
  };

  const isActive = (href: string) => {
    const current = normalizeRoute(pathname);
    const target = normalizeRoute(String(href));
    if (target === '/') return current === '/';
    return current === target || current.startsWith(`${target}/`);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]} pointerEvents={open ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: DRAWER_WIDTH, paddingTop: insets.top + 12, transform: [{ translateX }] }]}>
        <View style={styles.profile}>
          <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} size={48} />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.profileRole}>{roleLabel(user?.role)}</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={12}>
            <Icon name="close-outline" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.items.map((item) => {
                const active = isActive(String(item.href));
                return (
                  <TouchableOpacity
                    key={String(item.href)}
                    style={[styles.menuItem, active && styles.menuItemActive]}
                    onPress={() => navigate(item.href)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuIcon, active && styles.menuIconActive]}>
                      <Icon name={item.icon} size={19} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
                    {item.href === '/(tabs)/notifications' && unreadNotifications > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.buildTag}>Tema {theme.build}</Text>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              closeDrawer();
              await logout();
              router.replace('/(auth)/login');
            }}
          >
            <Icon name="log-out-outline" size={20} color={theme.colors.error} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    EMPLOYEE: 'Personel',
    COMPANY_ADMIN: 'Şirket Yöneticisi',
    HR_MANAGER: 'İK Yöneticisi',
    REGIONAL_MANAGER: 'Bölge Müdürü',
    BRANCH_MANAGER: 'Şube Müdürü',
    RESELLER: 'Bayi',
    MARKETER: 'Pazarlamacı',
    SUPER_ADMIN: 'Platform Admin',
  };
  return map[role ?? ''] ?? role ?? '';
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.overlay },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.drawerBg,
    borderRightWidth: 1,
    borderRightColor: theme.colors.drawerBorder,
    ...theme.shadow.lg,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  profileRole: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.borderLight,
  },
  menuScroll: { paddingVertical: 16, paddingHorizontal: 12 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: theme.colors.textMuted,
    marginBottom: 6,
    marginLeft: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    marginBottom: 2,
  },
  menuItemActive: { backgroundColor: theme.colors.drawerActive },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.borderLight,
  },
  menuIconActive: { backgroundColor: theme.colors.primaryLight },
  menuLabel: { fontSize: 15, fontWeight: '500', color: theme.colors.textSecondary, flex: 1 },
  menuLabelActive: { color: theme.colors.primary, fontWeight: '600' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  footer: { borderTopWidth: 1, borderTopColor: theme.colors.borderLight, paddingHorizontal: 20, paddingTop: 14 },
  buildTag: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 8, marginLeft: 4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  logoutText: { fontSize: 15, fontWeight: '600', color: theme.colors.error },
});
