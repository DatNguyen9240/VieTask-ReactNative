import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import { TaskCard, FAB, TaskCardSkeleton } from '../components';
import { SwipeableTaskCard } from '../components/SwipeableTaskCard';
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
  const [refreshing, setRefreshing] = React.useState(false);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleDelete = (id: string, title: string) => {
    if (Platform.OS === 'web') {
      if (confirm(`Xóa "${title}"?`)) removeTask(id);
    } else {
      Alert.alert('Xóa', `Xóa "${title}"?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => removeTask(id) },
      ]);
    }
  };

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
            {tasks.filter(t => t.need_clarification).length}
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
        <Text style={[theme.typography.label, { color: theme.colors.textTertiary, marginBottom: 12 }]}>
          DANH SÁCH VIỆC · Vuốt ← xóa · Vuốt → hẹn thêm
        </Text>

        {tasks.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.empty}>
            <Text style={{ fontSize: 48 }}>{"📝"}</Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
              {"Chưa có việc nào!\nNhấn + để thêm việc mới"}
            </Text>
          </Animated.View>
        ) : (
          tasks.map((task, i) => (
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
                index={i}
                onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              />
            </SwipeableTaskCard>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <FAB
        icon={<Text style={{ color: 'white', fontSize: 28, fontWeight: '300' }}>+</Text>}
        onPress={() => navigation.navigate('AddTask')}
      />
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, alignItems: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
});
