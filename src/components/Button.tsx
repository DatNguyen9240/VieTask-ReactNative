import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, icon, style }: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

  const bgColor = {
    primary: theme.colors.primary,
    secondary: theme.colors.surfaceSecondary,
    ghost: 'transparent',
    danger: theme.colors.danger,
  }[variant];

  const textColor = {
    primary: theme.colors.white,
    secondary: theme.colors.text,
    ghost: theme.colors.primary,
    danger: theme.colors.white,
  }[variant];

  const heights = { sm: 36, md: 48, lg: 56 };
  const paddH = { sm: 16, md: 20, lg: 24 };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          height: heights[size],
          paddingHorizontal: paddH[size],
          borderRadius: theme.radius.md,
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: variant === 'ghost' ? theme.colors.border : 'transparent',
        },
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[theme.typography.button, { color: textColor, marginLeft: icon ? 8 : 0 }]}>
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
