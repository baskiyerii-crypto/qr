import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { LocationGate } from '../../components/LocationGate';
import { useRequireEmployeeLocation } from '../../lib/use-require-employee-location';
import { theme } from '../../lib/theme';

async function getDeviceId() {
  let id = await SecureStore.getItemAsync('deviceId');
  if (!id) {
    id = generateUUID();
    await SecureStore.setItemAsync('deviceId', id);
  }
  return id;
}

export default function QrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<{ type: string; time: string; branch?: string; pending?: boolean } | null>(null);
  const [error, setError] = useState('');
  const { required: locationRequired, loaded: configLoaded } = useRequireEmployeeLocation();

  const [nextType, setNextType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  useEffect(() => {
    api.get<Array<{ type: string }>>('/attendance/my').then((records) => {
      const last = records[0];
      setNextType(last?.type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN');
    }).catch(() => {});
  }, []);

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning) return;
    setScanning(false);
    setError('');

    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      let accuracy: number | undefined;

      if (locationRequired) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Konum izni gerekli');
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
        accuracy = loc.coords.accuracy ?? undefined;
      }

      const deviceId = await getDeviceId();
      const lastType = nextType;

      const record = await api.post<{
        type: string;
        serverTimestamp: string;
        branch?: { name: string };
        offBranchPending?: boolean;
      }>('/attendance/check', {
        qrToken: data,
        type: lastType,
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
      });
      if (!record.offBranchPending) {
        setNextType(record.type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN');
      }
      setTimeout(() => { setScanning(true); setResult(null); }, 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem başarısız');
      setTimeout(() => { setScanning(true); setError(''); }, 3000);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}><Icon name="camera-outline" size={30} color={theme.colors.primary} /></View>
        <Text style={styles.title}>Kamera İzni</Text>
        <Text style={styles.permSub}>QR okutabilmek için kamera erişimi gerekli.</Text>
        <Button title="İzin Ver" icon="camera-outline" onPress={requestPermission} />
      </View>
    );
  }

  if (!configLoaded) {
    return (
      <View style={styles.center}>
        <Text style={styles.permSub}>Yükleniyor…</Text>
      </View>
    );
  }

  const scanner = (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? handleScan : undefined}
      >
        <View style={styles.overlay}>
          <Text style={styles.hint}>
            {nextType === 'CHECK_IN' ? 'Giriş için QR okutun' : 'Çıkış için QR okutun'}
          </Text>
          {!locationRequired ? (
            <Text style={styles.locOff}>Konum zorunluluğu kapalı — yalnızca QR yeterli</Text>
          ) : null}
          <View style={styles.frame} />
        </View>
      </CameraView>

      {result && (
        <Card style={styles.result} elevated>
          {result.pending ? (
            <View style={styles.resultRow}>
              <Icon name="time-outline" size={20} color={theme.colors.warning} />
              <Text style={styles.pending}>Görev yeri dışı giriş — yönetici onayı bekleniyor</Text>
            </View>
          ) : (
            <View style={styles.resultRow}>
              <Icon name="checkmark-circle" size={22} color={theme.colors.success} />
              <Text style={styles.success}>{result.type === 'CHECK_IN' ? 'Giriş kaydedildi' : 'Çıkış kaydedildi'}</Text>
            </View>
          )}
          <Text style={styles.time}>{result.branch ? `${result.branch} · ` : ''}{result.time}</Text>
        </Card>
      )}
      {error ? (
        <View style={styles.error}>
          <Icon name="alert-circle-outline" size={18} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!locationRequired) {
    return scanner;
  }

  return <LocationGate required>{scanner}</LocationGate>;
}
