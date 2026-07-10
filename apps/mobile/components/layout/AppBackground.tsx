import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../lib/theme';

const { width: W, height: H } = Dimensions.get('window');

export function AppBackground({ children }: { children: React.ReactNode }) {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const auroraAOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.7] });
  const auroraBOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.55] });
  const auroraAY = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const auroraBX = breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#F4F6FB', '#EEF2FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.auroraA, { opacity: auroraAOpacity, transform: [{ translateY: auroraAY }] }]}>
        <LinearGradient colors={[...theme.colors.gradientAuroraA]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.auroraFill} />
      </Animated.View>

      <Animated.View style={[styles.auroraB, { opacity: auroraBOpacity, transform: [{ translateX: auroraBX }] }]}>
        <LinearGradient colors={[...theme.colors.gradientAuroraB]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.auroraFill} />
      </Animated.View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background, overflow: 'hidden' },
  auroraA: {
    position: 'absolute',
    top: -H * 0.08,
    left: -W * 0.15,
    width: W * 1.1,
    height: H * 0.45,
    borderRadius: W,
  },
  auroraB: {
    position: 'absolute',
    bottom: -H * 0.05,
    right: -W * 0.2,
    width: W * 1.0,
    height: H * 0.4,
    borderRadius: W,
  },
  auroraFill: { flex: 1, borderRadius: W },
  content: { flex: 1 },
});
