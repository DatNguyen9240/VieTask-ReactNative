import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useTaskStore, type StoredTask } from '../store/taskStore';
import { executeTaskAction } from '../services/taskActions';

export function TaskReminderModal() {
  const { theme } = useTheme();
  const tasks = useTaskStore((s) => s.tasks);
  const completeTask = useTaskStore((s) => s.completeTask);
  const markReminded = useTaskStore((s) => s.markReminded);
  const [activeReminder, setActiveReminder] = useState<StoredTask | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    const now = Date.now();
    let nearest: StoredTask | null = null;
    let nearestDelay = Infinity;

    console.log('[Reminder] Checking', tasks.length, 'tasks...');

    for (const task of tasks) {
      // Skip completed or already reminded
      if (task.completed || task.reminded) {
        console.log('[Reminder] Skip (completed/reminded):', task.title, { completed: task.completed, reminded: task.reminded });
        continue;
      }

      const taskTime = new Date(task.datetime_local.replace(' ', 'T')).getTime();
      const delay = taskTime - now;
      console.log('[Reminder] Task:', task.title, '| time:', task.datetime_local, '| delay:', Math.round(delay / 1000), 's');

      // Due now or recently (within 10 min) → show immediately
      if (delay <= 0 && delay > -10 * 60 * 1000) {
        console.log('[Reminder] ✅ TRIGGERING:', task.title);
        setActiveReminder(task);
        return;
      }

      // Future task — find the nearest one
      if (delay > 0 && delay < nearestDelay) {
        nearestDelay = delay;
        nearest = task;
      }
    }

    if (nearest) {
      console.log('[Reminder] ⏰ Scheduling:', nearest.title, 'in', Math.round(nearestDelay / 1000), 's');
      const t = nearest;
      timerRef.current = setTimeout(() => {
        console.log('[Reminder] ⏰ Timer fired for:', t.title);
        setActiveReminder(t);
      }, nearestDelay);
    } else {
      console.log('[Reminder] No pending tasks');
    }
  }, [tasks]);

  useEffect(() => {
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [scheduleNext]);

  const handleComplete = async () => {
    if (!activeReminder) return;
    const task = activeReminder;
    setActiveReminder(null);
    completeTask(task.id);

    // Parse hour/minute from datetime_local
    const timeParts = task.datetime_local.match(/(\d{2}):(\d{2})$/);
    const hour = timeParts ? Number(timeParts[1]) : undefined;
    const minute = timeParts ? Number(timeParts[2]) : undefined;

    // Execute the task action (alarm, open app, call)
    const result = await executeTaskAction(task.action, task.title, task.app_name ?? null, task.action_url, hour, minute);
    if (Platform.OS === 'web') {
      console.log('[Action]', result);
    } else {
      Alert.alert('Thực hiện', result);
    }
  };

  const handleDismiss = () => {
    if (!activeReminder) return;
    const id = activeReminder.id;
    setActiveReminder(null);
    markReminded(id);
  };

  if (!activeReminder) return null;

  const icon = activeReminder.action_icon ?? '🔔';
  const label = activeReminder.action_label ?? activeReminder.action;

  return (
    <Modal transparent animationType="fade" visible={!!activeReminder} onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(400).springify()}
          style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl }, theme.shadows.lg]}
        >
          <View style={[styles.iconBg, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.lg }]}>
            <Text style={{ fontSize: 36 }}>{icon}</Text>
          </View>

          <View style={[styles.badge, { backgroundColor: theme.colors.primaryLight, borderRadius: theme.radius.sm }]}>
            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
              {label}
            </Text>
          </View>

          <Text style={[theme.typography.h2, { color: theme.colors.text, textAlign: 'center', marginTop: 12 }]}>
            {activeReminder.title}
          </Text>

          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            {activeReminder.datetime_local}
          </Text>

          <View style={styles.actions}>
            {/* Dismiss */}
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: pressed ? theme.colors.dangerLight : theme.colors.surfaceSecondary,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{"✕"}</Text>
              <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                Để sau
              </Text>
            </Pressable>

            {/* Complete */}
            <Pressable
              onPress={handleComplete}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: pressed ? theme.colors.successLight : theme.colors.primary,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Text style={{ fontSize: 22, color: 'white' }}>{"✓"}</Text>
              <Text style={[theme.typography.bodySmall, { color: 'white', marginTop: 4 }]}>
                Hoàn thành
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 80 : 120,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 28,
    alignItems: 'center',
  },
  iconBg: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 24,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
