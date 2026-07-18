import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Vibration, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { AttendanceType } from '@qr/shared';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { LocationGate } from '../../components/LocationGate';
import { useRequireEmployeeLocation } from '../../lib/use-require-employee-location';
import { theme } from '../../lib/theme';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function getDeviceId() {
  let id = await SecureStore.getItemAsync('deviceId');
  if (!id) {
    id = generateUUID();
    await SecureStore.setItemAsync('deviceId', id);
  }
  return id;
}

type CompanySettings = {
  attendanceMode: 'QR' | 'LOCATION';
  mealBreakEnabled: boolean;
  mealBreakLimitMinutes: number;
};

type AttendanceResult = {
  type: string;
  time: string;
  branch?: string;
  pending?: boolean;
  message?: string;
};

function typeLabel(type: string) {
  if (type === 'CHECK_IN') return 'Giriş kaydedildi';
  if (type === 'CHECK_OUT') return 'Çıkış kaydedildi';
  if (type === 'MEAL_START') return 'Yemeğe çıktınız';
  if (type === 'MEAL_END') return 'Yemekten döndünüz';
  return 'Kayıt alındı';
}

function nextClockType(last?: string): 'CHECK_IN' | 'CHECK_OUT' {
  if (!last || last === 'CHECK_OUT') return 'CHECK_IN';
  if (last === 'MEAL_START') return 'CHECK_OUT'; // blocked server-side until meal end
  return 'CHECK_OUT';
}

export default function QrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState('');
  const { required: locationRequired, loaded: configLoaded } = useRequireEmployeeLocation();
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [lastType, setLastType] = useState<string | undefined>();

  const refreshState = useCallback(async () => {
    try {
      const [records, me] = await Promise.all([
        api.get<Array<{ type: string }>>('/attendance/my'),
        api.get<CompanySettings>('/companies/me'),
      ]);
      setLastType(records[0]?.type);
      setCompany({
        attendanceMode: me.attendanceMode ?? 'QR',
        mealBreakEnabled: me.mealBreakEnabled !== false,
        mealBreakLimitMinutes: me.mealBreakLimitMinutes ?? 60,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const submit = async (type: AttendanceType, qrToken?: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    setScanning(false);

    try {
      const needsLocation =
        type === AttendanceType.CHECK_IN ||
        type === AttendanceType.CHECK_OUT;

      let latitude: number | undefined;
      let longitude: number | undefined;
      let accuracy: number | undefined;

      if (needsLocation && (locationRequired || company?.attendanceMode === 'LOCATION')) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Konum izni gerekli');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
        accuracy = loc.coords.accuracy ?? undefined;
      }

      const deviceId = await getDeviceId();
      const record = await api.post<{
        type: string;
        serverTimestamp: string;
        branch?: { name: string };
        offBranchPending?: boolean;
        message?: string;
      }>('/attendance/check', {
        ...(qrToken ? { qrToken } : {}),
        type,
        ...(latitude != null && longitude != null ? { latitude, longitude, accuracy } : {}),
        deviceId,
        clientTimestamp: new Date().toISOString(),
      });

      Vibration.vibrate(100);
      setResult({
        type: record.type,
        time: new Date(record.serverTimestamp).toLocaleTimeString('tr-TR'),
        branch: record.branch?.name,
        pending: record.offBranchPending,
        message: record.message,
      });
      if (!record.offBranchPending) {
        setLastType(record.type);
      }
      setTimeout(() => {
        setResult(null);
        setScanning(true);
        setBusy(false);
      }, 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
      setTimeout(() => {
        setError('');
        setScanning(true);
        setBusy(false);
      }, 3000);
    }
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning || busy) return;
    const clock = nextClockType(lastType);
    await submit(clock === 'CHECK_IN' ? AttendanceType.CHECK_IN : AttendanceType.CHECK_OUT, data);
  };

  const canMealStart =
    company?.mealBreakEnabled &&
    (lastType === 'CHECK_IN' || lastType === 'MEAL_END');
  const canMealEnd = company?.mealBreakEnabled && lastType === 'MEAL_START';
  const canClockIn = !lastType || lastType === 'CHECK_OUT';
  const canClockOut = lastType === 'CHECK_IN' || lastType === 'MEAL_END';
  const isLocationMode = company?.attendanceMode === 'LOCATION';
  const clockHint = nextClockType(lastType) === 'CHECK_IN' ? 'Giriş' : 'Çıkış';

  const mealButtons = company?.mealBreakEnabled ? (
    <View style={styles.mealRow}>
      <View style={{ flex: 1 }}>
        <Button
          title="Yemeğe çık"
          icon="restaurant-outline"
          variant="secondary"
          disabled={!canMealStart || busy}
          onPress={() => submit(AttendanceType.MEAL_START)}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Button
          title="Yemekten dön"
          icon="walk-outline"
          variant="secondary"
          disabled={!canMealEnd || busy}
          onPress={() => submit(AttendanceType.MEAL_END)}
        />
      </View>
    </View>
  ) : null;

  const resultCard = (absolute: boolean) =>
    result ? (
      <Card style={absolute ? styles.resultAbs : styles.resultInline} elevated>
        {result.pending ? (
          <View style={styles.resultRow}>
            <Icon name="time-outline" size={20} color={theme.colors.warning} />
            <Text style={styles.pending}>Görev yeri dışı — yönetici onayı bekleniyor</Text>
          </View>
        ) : (
          <View style={styles.resultRow}>
            <Icon name="checkmark-circle" size={22} color={theme.colors.success} />
            <Text style={styles.success}>{typeLabel(result.type)}</Text>
          </View>
        )}
        <Text style={styles.time}>
          {result.branch ? `${result.branch} · ` : ''}
          {result.time}
        </Text>
        {result.message ? <Text style={styles.msg}>{result.message}</Text> : null}
      </Card>
    ) : null;

  const errorBanner = (absolute: boolean) =>
    error ? (
      <View style={absolute ? styles.errorAbs : styles.errorInline}>
        <Icon name="alert-circle-outline" size={18} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    ) : null;

  if (!configLoaded || !company) {
    return (
      <View style={styles.center}>
        <Text style={styles.permSub}>Yükleniyor…</Text>
      </View>
    );
  }

  // ── LOCATION mode: button hub, no camera ──
  if (isLocationMode) {
    const hub = (
      <ScrollView contentContainerStyle={styles.hub}>
        <Text style={styles.hubTitle}>Devam</Text>
        <Text style={styles.hubSub}>
          Şube alanında konumla {clockHint.toLowerCase()} yapın
          {company.mealBreakEnabled ? ' · Yemek için QR gerekmez' : ''}
        </Text>

        <Button
          title={canClockIn ? 'Giriş yap' : canClockOut ? 'Çıkış yap' : 'Giriş / çıkış'}
          icon={canClockIn ? 'log-in-outline' : 'log-out-outline'}
          disabled={(!canClockIn && !canClockOut) || busy || lastType === 'MEAL_START'}
          onPress={() =>
            submit(
              canClockIn ? AttendanceType.CHECK_IN : AttendanceType.CHECK_OUT,
            )
          }
        />
        {lastType === 'MEAL_START' ? (
          <Text style={styles.warn}>Önce yemekten dönün, sonra çıkış yapabilirsiniz.</Text>
        ) : null}

        {mealButtons}
        {resultCard(false)}
        {errorBanner(false)}
      </ScrollView>
    );
    return <LocationGate required>{hub}</LocationGate>;
  }

  // ── QR mode ──
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <Icon name="camera-outline" size={30} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Kamera İzni</Text>
        <Text style={styles.permSub}>QR okutabilmek için kamera erişimi gerekli.</Text>
        <Button title="İzin Ver" icon="camera-outline" onPress={requestPermission} />
        {mealButtons}
      </View>
    );
  }

  const scanner = (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning && !busy ? handleScan : undefined}
      >
        <View style={styles.overlay}>
          <Text style={styles.hint}>
            {nextClockType(lastType) === 'CHECK_IN' ? 'Giriş için QR okutun' : 'Çıkış için QR okutun'}
          </Text>
          {!locationRequired ? (
            <Text style={styles.locOff}>Konum zorunluluğu kapalı — yalnızca QR yeterli</Text>
          ) : null}
          <View style={styles.frame} />
        </View>
      </CameraView>

      <View style={styles.bottomPanel}>{mealButtons}</View>
      {resultCard(true)}
      {errorBanner(true)}
    </View>
  );

  if (!locationRequired) return scanner;
  return <LocationGate required>{scanner}</LocationGate>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  hint: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  locOff: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 12, textAlign: 'center' },
  frame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: theme.colors.background,
  },
  permIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  permSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' },
  resultAbs: { position: 'absolute', left: 16, right: 16, bottom: 100, gap: 6 },
  resultInline: { gap: 6, marginTop: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  success: { fontSize: 16, fontWeight: '600', color: theme.colors.success, flex: 1 },
  pending: { fontSize: 14, fontWeight: '600', color: theme.colors.warning, flex: 1 },
  time: { fontSize: 13, color: theme.colors.textMuted },
  msg: { fontSize: 12, color: theme.colors.warning, marginTop: 4 },
  errorAbs: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.errorBg,
    padding: 12,
    borderRadius: 12,
  },
  errorInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.errorBg,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorText: { color: theme.colors.error, flex: 1, fontSize: 13 },
  mealRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
  },
  hub: {
    flexGrow: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  hubTitle: { fontSize: 28, fontWeight: '700', color: theme.colors.text, textAlign: 'center' },
  hubSub: { fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginBottom: 8 },
  warn: { fontSize: 13, color: theme.colors.warning, textAlign: 'center' },
});
