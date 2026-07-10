import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { homeRoute } from '../../lib/routes';
import { clearPlatformConfigCache } from '../../lib/platform-config';
import { Button, Card } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { AppBackground } from '../../components/layout/AppBackground';
import { theme } from '../../lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: Parameters<typeof setAuth>[0];
      }>('/auth/login', { email, password });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      clearPlatformConfigCache();
      const consent = await api.get<{ hasConsent: boolean }>('/kvkk/consent-status');
      if (!consent.hasConsent) router.replace('/kvkk');
      else router.replace(homeRoute(data.user.role) as never);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 20 }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <LinearGradient colors={[...theme.colors.gradientHero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBadge}>
            <Icon name="qr-code-outline" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.logo}>QR Personel</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.label}>E-posta</Text>
          <View style={styles.inputWrap}>
            <Icon name="mail-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="ornek@firma.com"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Şifre</Text>
          <View style={styles.inputWrap}>
            <Icon name="lock-closed-outline" size={18} color={theme.colors.textMuted} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
            />
            <Text onPress={() => setShowPassword((v) => !v)} style={styles.toggle}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.colors.textMuted} />
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Icon name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 24 }}>
            <Button title="Giriş Yap" onPress={handleLogin} loading={loading} size="lg" />
          </View>
        </Card>

        <Text style={styles.footer}>Personel şifrenizi şirket yöneticinizden alın.</Text>
      </KeyboardAvoidingView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadow.lg,
  },
  logo: { fontSize: 26, fontWeight: '700', color: theme.colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 6 },
  card: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceHover,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: theme.colors.text },
  toggle: { padding: 4 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: theme.colors.errorBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  error: { color: theme.colors.error, fontSize: 13, flex: 1, lineHeight: 18 },
  footer: { textAlign: 'center', color: theme.colors.textMuted, fontSize: 13, marginTop: 28 },
});
