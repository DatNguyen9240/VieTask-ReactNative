import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { TaskCard, FAB } from '../components';
import { SwipeableTaskCard } from '../components/SwipeableTaskCard';
import { ConfirmModal } from '../components/ConfirmModal';
import { useTaskStore } from '../store/taskStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tasks = useTaskStore((s) => s.tasks);
  const removeTask = useTaskStore((s) => s.removeTask);
  const clearTasks = useTaskStore((s) => s.clearTasks);
  const [refreshing, setRefreshing] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });

  // Categorize tasks
  const { clarifyTasks, pendingTasks, completedTasks } = useMemo(() => ({
    clarifyTasks: tasks.filter(t => !t.completed && t.need_clarification),
    pendingTasks: tasks.filter(t => !t.completed && !t.need_clarification),
    completedTasks: tasks.filter(t => t.completed),
  }), [tasks]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      removeTask(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const confirmClearAll = () => {
    clearTasks();
    setShowClearAll(false);
  };

  const renderTaskList = (taskList: typeof tasks, startIndex: number) =>
    taskList.map((task, i) => (
      <SwipeableTaskCard
        key={task.id}
        onDelete={() => handleDelete(task.id, task.title)}
        onAddMore={() => navigation.navigate('AddTask', { prefillTime: task.datetime_local })}
      >
        <TaskCard
          title={task.completed ? `✓ ${task.title}` : task.title}
          time={task.datetime_local}
          action={task.action}
          actionLabel={task.action_label}
          actionIcon={task.action_icon}
          clarifyQuestion={task.clarifying_question}
          index={startIndex + i}
          onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
        />
      </SwipeableTaskCard>
    ));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }]}>
            {today}
          </Text>
          <Text style={[theme.typography.h1, { color: theme.colors.text, marginTop: 4 }]}>
            {"Xin chào! 👋"}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>V</Text>
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.md }]}>
          <Text style={[theme.typography.h2, { color: theme.colors.primary }]}>{pendingTasks.length}</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Chờ làm</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.successLight, borderRadius: theme.radius.md }]}>
          <Text style={[theme.typography.h2, { color: theme.colors.success }]}>{completedTasks.length}</Text>
          <Text style={[theme.typography.caption, { color: theme.colors.success }]}>Hoàn thành</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.accentLight, borderRadius: theme.radius.md }]}>
          <Text style={[theme.typography.h2, { color: theme.colors.accent }]}>
            {clarifyTasks.length}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.accent }]}>Cần xác nhận</Text>
        </View>
      </Animated.View>

      {/* Task List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.hintRow}>
          <Text style={[theme.typography.label, { color: theme.colors.textTertiary }]}>
            Vuốt ← xóa · Vuốt → hẹn thêm
          </Text>
          {tasks.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowClearAll(true)}
              style={[styles.clearAllBtn, { backgroundColor: theme.colors.dangerLight, borderRadius: theme.radius.md }]}
            >
              <Text style={{ color: theme.colors.danger, fontSize: 12, fontWeight: '600' }}>🗑 Xóa hết</Text>
            </TouchableOpacity>
          )}
        </View>

        {tasks.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.empty}>
            <Text style={{ fontSize: 48 }}>{"📝"}</Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
              {"Chưa có việc nào!\nNhấn + để thêm việc mới"}
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* Section: Cần xác nhận */}
            {clarifyTasks.length > 0 && (
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <View style={[styles.sectionHeader, { borderLeftColor: theme.colors.accent }]}>
                  <Text style={[styles.sectionEmoji]}>⚠️</Text>
                  <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
                    CẦN XÁC NHẬN ({clarifyTasks.length})
                  </Text>
                </View>
                {renderTaskList(clarifyTasks, 0)}
              </Animated.View>
            )}

            {/* Section: Chờ làm */}
            {pendingTasks.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <View style={[styles.sectionHeader, { borderLeftColor: theme.colors.primary }]}>
                  <Text style={[styles.sectionEmoji]}>📋</Text>
                  <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
                    CHỜ LÀM ({pendingTasks.length})
                  </Text>
                </View>
                {renderTaskList(pendingTasks, clarifyTasks.length)}
              </Animated.View>
            )}

            {/* Section: Hoàn thành */}
            {completedTasks.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                <View style={[styles.sectionHeader, { borderLeftColor: theme.colors.success }]}>
                  <Text style={[styles.sectionEmoji]}>✅</Text>
                  <Text style={[theme.typography.label, { color: theme.colors.success }]}>
                    HOÀN THÀNH ({completedTasks.length})
                  </Text>
                </View>
                {renderTaskList(completedTasks, clarifyTasks.length + pendingTasks.length)}
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <FAB
        icon={<Text style={{ color: 'white', fontSize: 28, fontWeight: '300' }}>+</Text>}
        onPress={() => navigation.navigate('AddTask')}
      />

      {/* Delete Single Task Confirmation */}
      <ConfirmModal
        visible={!!deleteTarget}
        icon="🗑️"
        title="Xóa việc này?"
        message={deleteTarget ? `"${deleteTarget.title}" sẽ bị xóa vĩnh viễn.` : ''}
        confirmText="Xóa"
        cancelText="Giữ lại"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Clear All Confirmation */}
      <ConfirmModal
        visible={showClearAll}
        icon="⚠️"
        title="Xóa tất cả?"
        message={`Tất cả ${tasks.length} việc sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmText="Xóa hết"
        cancelText="Hủy"
        onConfirm={confirmClearAll}
        onCancel={() => setShowClearAll(false)}
      />
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  clearAllBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, alignItems: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 10, paddingLeft: 10, borderLeftWidth: 3 },
  sectionEmoji: { fontSize: 14 },
});
