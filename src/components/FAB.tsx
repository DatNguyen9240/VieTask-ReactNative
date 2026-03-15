import React from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';

interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function FAB({ icon, onPress, style }: FABProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9, { damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      activeOpacity={0.85}
      style={[
        styles.fab,
        { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full },
        theme.shadows.lg,
        animStyle,
        style,
      ]}
    >
      {icon}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
