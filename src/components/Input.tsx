import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export function Input({ value, onChangeText, placeholder, multiline, leftIcon, rightIcon, style, autoFocus, onSubmitEditing }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.radius.lg,
          borderColor: focused ? theme.colors.primary : theme.colors.border,
          borderWidth: 1,
          minHeight: multiline ? 120 : 52,
        },
        style,
      ]}
    >
      {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        multiline={multiline}
        autoFocus={autoFocus}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          theme.typography.body,
          styles.input,
          {
            color: theme.colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
          },
        ]}
      />
      {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  iconLeft: { marginRight: 12 },
  iconRight: { marginLeft: 10 },
});
