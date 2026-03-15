import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Button } from '../components';
import { useTaskStore } from '../store/taskStore';

export function TaskDetailScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const tasks = useTaskStore((s) => s.tasks);
  const removeTask = useTaskStore((s) => s.removeTask);
  const completeTask = useTaskStore((s) => s.completeTask);

  const { taskId } = route.params as { taskId: string };
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Không tìm thấy việc này</Text>
      </View>
    );
  }

  const actionIcon = task.action_icon ?? '🔔';
  const actionLabel = task.action_label ?? task.action;

  const handleDelete = () => {
    Alert.alert('Xóa việc', `Bạn có chắc muốn xóa "${task.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { await removeTask(task.id); navigation.goBack(); } },
    ]);
  };

  const handleComplete = () => {
    completeTask(task.id);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl }, theme.shadows.md]}>
        {/* Icon */}
        <View style={[styles.iconBg, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.lg }]}>
          <Text style={{ fontSize: 40 }}>{actionIcon}</Text>
        </View>

        {/* Title */}
        <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 20 }]}>
          {task.title}
        </Text>

        {/* Status */}
        {task.completed && (
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.successLight, borderRadius: theme.radius.sm }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.success, fontWeight: '600' }]}>
              {"✓ Đã hoàn thành"}
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.details}>
          <DetailRow label="Thời gian" value={task.datetime_local} theme={theme} />
          <DetailRow label="Loại" value={actionLabel} theme={theme} />
          <DetailRow label="Lặp lại" value={task.repeat === 'none' ? 'Không' : task.repeat} theme={theme} />
          {task.app_name && <DetailRow label="App" value={task.app_name} theme={theme} />}
          {task.clarifying_question ? (
            <View style={[styles.clarify, { backgroundColor: theme.colors.warningLight, borderRadius: theme.radius.md }]}>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.warning }]}>
                {"⚠️ " + task.clarifying_question}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
        {!task.completed && (
          <Button title={"Hoàn thành ✓"} onPress={handleComplete} style={{ flex: 1, marginBottom: 10 }} />
        )}
        <Button title="Xóa việc" variant="danger" onPress={handleDelete} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

function DetailRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.row}>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[theme.typography.body, { color: theme.colors.text, fontWeight: '500' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: { padding: 28, alignItems: 'center' },
  iconBg: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6 },
  details: { width: '100%', marginTop: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  clarify: { padding: 14, marginTop: 16 },
  actions: { marginTop: 24 },
});
