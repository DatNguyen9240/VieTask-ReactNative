import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, type ThemeMode } from '../theme';
import { Button } from '../components';
import { useTaskStore } from '../store/taskStore';
import { checkHealth, getApiUrl } from '../services/api';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'system', label: 'Theo hệ thống', icon: '📱' },
  { mode: 'light', label: 'Sáng', icon: '☀️' },
  { mode: 'dark', label: 'Tối', icon: '🌙' },
];

export function SettingsScreen() {
  const { theme, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const clearTasks = useTaskStore((s) => s.clearTasks);
  const taskCount = useTaskStore((s) => s.tasks.length);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setServerOk);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom, paddingTop: insets.top + 20 }]}>
      <Animated.View entering={FadeInDown.duration(400)}>
        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 16 }]}>GIAO DIỆN</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const isActive = mode === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setMode(opt.mode)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive ? theme.colors.primary + '18' : 'transparent',
                      borderColor: isActive ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                  <Text style={[
                    theme.typography.bodySmall,
                    {
                      color: isActive ? theme.colors.primary : theme.colors.text,
                      fontWeight: isActive ? '700' : '400',
                      marginTop: 4,
                    },
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Server Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 16 }]}>BACKEND</Text>
          <View style={styles.row}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>🔗  Server</Text>
            <View style={styles.statusDot}>
              <View style={[styles.dot, { backgroundColor: serverOk === null ? theme.colors.warning : serverOk ? theme.colors.success : theme.colors.danger }]} />
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>
                {serverOk === null ? 'Đang kiểm tra...' : serverOk ? 'Kết nối OK' : 'Mất kết nối'}
              </Text>
            </View>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[theme.typography.bodySmall, { color: theme.colors.textTertiary }]}>URL</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>{getApiUrl()}</Text>
          </View>
        </View>

        {/* Data */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 16 }]}>DỮ LIỆU</Text>
          <View style={styles.row}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>📋  Tổng số việc</Text>
            <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>{taskCount}</Text>
          </View>
          <Button title="Xóa tất cả" variant="danger" size="sm" onPress={() => clearTasks()} style={{ marginTop: 12 }} />
        </View>

        {/* About */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg }]}>
          <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 16 }]}>THÔNG TIN</Text>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[theme.typography.body, { color: theme.colors.text }]}>VieTask</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>v1.0.0</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 0 },
  section: { padding: 20, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
  },
});
