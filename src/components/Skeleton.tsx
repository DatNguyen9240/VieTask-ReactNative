import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8 }: SkeletonProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: theme.colors.surfaceSecondary },
        animStyle,
      ]}
    />
  );
}

/** Full card skeleton for task list loading state */
export function TaskCardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, borderColor: theme.colors.borderLight, borderWidth: 1 }]}>
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={styles.content}>
        <Skeleton width="70%" height={18} />
        <View style={{ height: 8 }} />
        <Skeleton width="40%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 16, marginBottom: 12, alignItems: 'center' },
  content: { flex: 1, marginLeft: 14 },
});
