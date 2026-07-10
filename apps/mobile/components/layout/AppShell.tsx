import { View, StyleSheet } from 'react-native';
import { DrawerProvider } from './DrawerContext';
import { SideDrawer } from './SideDrawer';
import { AppBackground } from './AppBackground';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <DrawerProvider>
      <AppBackground>
        <View style={styles.root}>
          {children}
          <SideDrawer />
        </View>
      </AppBackground>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
