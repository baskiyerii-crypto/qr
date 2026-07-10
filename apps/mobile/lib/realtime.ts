import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { invalidateAllQueries } from './query-client';
import { clearPlatformConfigCache } from './platform-config';

/** Uygulama arka plandan dönünce tüm verileri web gibi yenile */
export function useAppForegroundSync() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        clearPlatformConfigCache();
        invalidateAllQueries().catch(() => {});
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);
}
