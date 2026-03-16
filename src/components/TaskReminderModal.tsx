import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Modal, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
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
      if (task.completed || task.reminded) {
        console.log('[Reminder] Skip (completed/reminded):', task.title, { completed: task.completed, reminded: task.reminded });
        continue;
      }

      const taskTime = new Date(task.datetime_local.replace(' ', 'T')).getTime();
      const delay = taskTime - now;
      console.log('[Reminder] Task:', task.title, '| time:', task.datetime_local, '| delay:', Math.round(delay / 1000), 's');

      if (delay <= 0 && delay > -10 * 60 * 1000) {
        console.log('[Reminder] ✅ TRIGGERING:', task.title);
        setActiveReminder(task);
        return;
      }

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

  // Auto-dismiss: stay until 1 minute after task time, then hide
  useEffect(() => {
    if (!activeReminder) return;
    const taskTime = new Date(activeReminder.datetime_local.replace(' ', 'T')).getTime();
    const dismissAt = taskTime + 60_000; // task time + 1 minute
    const remaining = Math.max(5_000, dismissAt - Date.now()); // minimum 5s
    const autoDismiss = setTimeout(() => {
      handleDismiss();
    }, remaining);
    return () => clearTimeout(autoDismiss);
  }, [activeReminder]);

  const handleComplete = async () => {
    console.log('[Reminder] ✓ XONG TAPPED');
    if (!activeReminder) { console.log('[Reminder] No active reminder!'); return; }
    const task = activeReminder;
    console.log('[Reminder] Task:', task.title, 'action:', task.action, 'app:', task.app_name, 'url:', task.action_url);
    setActiveReminder(null);
    completeTask(task.id);

    const timeParts = task.datetime_local.match(/(\d{2}):(\d{2})$/);
    const hour = timeParts ? Number(timeParts[1]) : undefined;
    const minute = timeParts ? Number(timeParts[2]) : undefined;

    console.log('[Reminder] Executing action:', task.action, task.app_name, task.action_url);
    try {
      const result = await executeTaskAction({
        action: task.action,
        title: task.title,
        app_name: task.app_name,
        action_url: task.action_url,
        android_package: task.android_package,
        hour,
        minute,
      });
      console.log('[Reminder] Action result:', result);
    } catch (e) {
      console.error('[Reminder] Action error:', e);
      const msg = e instanceof Error ? e.message : String(e);
      if (Platform.OS === 'web') {
        alert('Lỗi: ' + msg);
      } else {
        Alert.alert('Lỗi', msg);
      }
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
  const timeMatch = activeReminder.datetime_local.match(/(\d{2}:\d{2})$/);
  const timeStr = timeMatch ? timeMatch[1] : '';

  return (
    <Modal transparent animationType="none" visible={!!activeReminder} onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={[
            styles.banner,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderLeftColor: theme.colors.primary,
            },
            theme.shadows.md,
          ]}
        >
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
              {activeReminder.title}
            </Text>
            <Text style={[styles.time, { color: theme.colors.primary }]}>
              ⏰ {timeStr}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleComplete}
              style={({ pressed }) => [
                styles.doneBtn,
                {
                  backgroundColor: pressed ? theme.colors.primaryLight : theme.colors.primary,
                  borderRadius: theme.radius.sm,
                },
              ]}
            >
              <Text style={styles.doneBtnText}>✓ Xong</Text>
            </Pressable>
            <Pressable onPress={handleDismiss} hitSlop={10} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.colors.textTertiary }]}>✕</Text>
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingHorizontal: 12,
  },
  banner: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    borderLeftWidth: 4,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: '600',
  },
});
