import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../stores/auth';
import { getPlatformConfig } from './platform-config';

export function useRequireEmployeeLocation() {
  const { user, patchUser } = useAuth();
  const [required, setRequired] = useState<boolean | null>(
    typeof user?.requireEmployeeLocation === 'boolean' ? user.requireEmployeeLocation : null,
  );
  const [loaded, setLoaded] = useState(typeof user?.requireEmployeeLocation === 'boolean');

  const load = useCallback(async () => {
    try {
      const cfg = await getPlatformConfig(true);
      setRequired(cfg.requireEmployeeLocation);
      await patchUser({ requireEmployeeLocation: cfg.requireEmployeeLocation });
    } catch {
      setRequired(user?.requireEmployeeLocation === true);
    } finally {
      setLoaded(true);
    }
  }, [patchUser, user?.requireEmployeeLocation]);

  useFocusEffect(
    useCallback(() => {
      if (typeof user?.requireEmployeeLocation === 'boolean') {
        setRequired(user.requireEmployeeLocation);
        setLoaded(true);
      }
      load();
    }, [load, user?.requireEmployeeLocation]),
  );

  return { required: required === true, loaded, reload: load };
}
