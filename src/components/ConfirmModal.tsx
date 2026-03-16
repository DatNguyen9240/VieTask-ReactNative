import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useTheme } from '../theme';

interface ConfirmModalProps {
  visible: boolean;
  icon?: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ConfirmModal({
  visible,
  icon = '🗑️',
  title,
  message,
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  confirmColor,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { theme } = useTheme();
  const dangerColor = confirmColor ?? theme.colors.danger;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
      >
        <Pressable style={styles.overlayPress} onPress={onCancel}>
          <Animated.View
            entering={ZoomIn.duration(200)}
            exiting={ZoomOut.duration(150)}
          >
            <Pressable
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.xl ?? 20,
                },
                theme.shadows.md,
              ]}
              onPress={() => {}} // prevent closing when tapping card
            >
              {/* Icon */}
              <View style={[styles.iconCircle, { backgroundColor: dangerColor + '15' }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              {/* Text */}
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: pressed ? theme.colors.border : theme.colors.surfaceSecondary,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>{cancelText}</Text>
                </Pressable>

                <View style={{ width: 12 }} />

                <Pressable
                  onPress={onConfirm}
                  style={({ pressed }) => [
                    styles.button,
                    {
                      backgroundColor: pressed ? dangerColor + 'CC' : dangerColor,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: '#fff', fontWeight: '700' }]}>{confirmText}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayPress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: 300,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
