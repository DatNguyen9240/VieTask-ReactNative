import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface TaskCardProps {
  title: string;
  time: string;
  action: string;
  actionLabel?: string;
  actionIcon?: string;
  clarifyQuestion?: string | null;
  onPress?: () => void;
  index?: number;
  style?: ViewStyle;
}

export function TaskCard({ title, time, action, actionLabel, actionIcon, clarifyQuestion, onPress, index = 0, style }: TaskCardProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.borderLight,
          borderWidth: 1,
        },
        theme.shadows.sm,
        style,
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }]}>
        <Text style={styles.icon}>{actionIcon ?? '🔔'}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '600' }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.meta}>
          <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '500' }]}>
            {time}
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.sm }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              {actionLabel ?? action}
            </Text>
          </View>
        </View>
        {clarifyQuestion && (
          <View style={[styles.clarify, { backgroundColor: theme.colors.warningLight, borderRadius: theme.radius.sm }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.warning }]}>
              ⚠️ {clarifyQuestion}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', padding: 16, marginBottom: 12 },
  iconContainer: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
  clarify: { marginTop: 8, padding: 8 },
});
