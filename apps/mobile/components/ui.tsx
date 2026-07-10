import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../lib/theme';
import { Icon, IconName } from './Icon';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon }: ButtonProps) {
  const disabledStyle = (disabled || loading) && styles.btnDisabled;

  const inner = loading ? (
    <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? theme.colors.primary : '#fff'} />
  ) : (
    <View style={styles.btnInner}>
      {icon ? <Icon name={icon} size={18} color={variant === 'secondary' || variant === 'ghost' ? theme.colors.primary : '#fff'} /> : null}
      <Text style={[styles.btnText, variant === 'secondary' || variant === 'ghost' ? styles.btnTextDark : styles.btnTextLight]}>{title}</Text>
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.88} style={disabledStyle}>
        <LinearGradient colors={[...theme.colors.gradientButton]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.btn, size === 'lg' && styles.btnLg]}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle =
    variant === 'danger'
      ? { bg: theme.colors.error, text: '#fff', border: theme.colors.error }
      : variant === 'ghost'
        ? { bg: 'transparent', text: theme.colors.textSecondary, border: 'transparent' }
        : { bg: theme.colors.surface, text: theme.colors.text, border: theme.colors.border };

  return (
    <TouchableOpacity
      style={[styles.btn, size === 'lg' && styles.btnLg, { backgroundColor: variantStyle.bg, borderColor: variantStyle.border, borderWidth: variant === 'ghost' ? 0 : 1 }, disabledStyle]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color={variantStyle.text} /> : (
        <View style={styles.btnInner}>
          {icon ? <Icon name={icon} size={18} color={variantStyle.text} /> : null}
          <Text style={[styles.btnText, { color: variantStyle.text }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export function Card({ children, style, elevated }: { children: React.ReactNode; style?: object; elevated?: boolean }) {
  return <View style={[styles.card, elevated && theme.shadow.md, style]}>{children}</View>;
}

type ChipTone = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

const chipTones: Record<ChipTone, { bg: string; fg: string }> = {
  default: { bg: theme.colors.borderLight, fg: theme.colors.textSecondary },
  primary: { bg: theme.colors.primaryLight, fg: theme.colors.primary },
  success: { bg: theme.colors.successBg, fg: theme.colors.success },
  warning: { bg: theme.colors.warningBg, fg: theme.colors.warning },
  error: { bg: theme.colors.errorBg, fg: theme.colors.error },
  info: { bg: theme.colors.infoBg, fg: theme.colors.info },
};

export function Chip({ label, tone = 'default', dot }: { label: string; tone?: ChipTone; dot?: boolean }) {
  const c = chipTones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      {dot ? <View style={[styles.chipDot, { backgroundColor: c.fg }]} /> : null}
      <Text style={[styles.chipText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

const iconBubbleTones: Record<ChipTone, { bg: string; fg: string }> = {
  default: { bg: theme.colors.borderLight, fg: theme.colors.textSecondary },
  primary: { bg: theme.colors.primaryLight, fg: theme.colors.primary },
  success: { bg: theme.colors.successBg, fg: theme.colors.success },
  warning: { bg: theme.colors.warningBg, fg: theme.colors.warning },
  error: { bg: theme.colors.errorBg, fg: theme.colors.error },
  info: { bg: theme.colors.infoBg, fg: theme.colors.info },
};

export function IconBubble({ name, tone = 'primary', size = 44 }: { name: IconName; tone?: ChipTone; size?: number }) {
  const c = iconBubbleTones[tone];
  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: c.bg }]}>
      <Icon name={name} size={size * 0.44} color={c.fg} />
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initials =
    (name ?? '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export function StatCard({ label, value, icon, tone = 'primary' }: { label: string; value: string | number; icon?: IconName; tone?: ChipTone }) {
  return (
    <Card style={styles.stat} elevated>
      {icon ? <IconBubble name={icon} tone={tone} size={38} /> : null}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 50, borderRadius: theme.radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, overflow: 'hidden' },
  btnLg: { minHeight: 54 },
  btnDisabled: { opacity: 0.5 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { fontSize: 15, fontWeight: '600' },
  btnTextLight: { color: '#fff' },
  btnTextDark: { color: theme.colors.text },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadow.sm,
  },
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.full },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
  avatarText: { color: '#fff', fontWeight: '700' },
  stat: { flex: 1, gap: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500', color: theme.colors.textMuted },
});
