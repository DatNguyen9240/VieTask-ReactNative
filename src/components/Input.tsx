import React, { useState } from 'react';
import { View, TextInput, StyleSheet, type ViewStyle } from 'react-native';
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
          borderRadius: theme.radius.md,
          borderColor: focused ? theme.colors.primary : 'transparent',
          borderWidth: 2,
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
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  iconLeft: { marginRight: 12 },
  iconRight: { marginLeft: 12 },
});
