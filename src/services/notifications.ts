/**
 * Notification service — uses expo-notifications for local scheduled notifications.
 * Works in background when app is closed (system-level scheduling).
 * Includes action buttons: "Xong" and "Bỏ qua" on the notification bar.
 */

import { Platform } from 'react-native';

let Notifications: typeof import('expo-notifications') | null = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // Not available (Expo Go without native modules)
  }
}

// Category ID for task reminders
const TASK_CATEGORY = 'task-reminder';

/** Request notification permissions */
export async function requestPermissions(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Configure notification handler (call once at app startup) */
export function setupNotifications() {
  if (!Notifications) return;

  // How to handle notifications when app is in foreground
  // → suppress system alert (the in-app TaskReminderModal handles it instead)
  // → when app is in background/closed, system notification shows normally
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
  });

  // Android: create notification channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Nhắc việc',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  // Register notification category with action buttons
  Notifications.setNotificationCategoryAsync(TASK_CATEGORY, [
    {
      identifier: 'COMPLETE',
      buttonTitle: '✓ Xong',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'DISMISS',
      buttonTitle: 'Bỏ qua',
      options: { opensAppToForeground: false },
    },
  ]);
}

/**
 * Register a listener for notification action responses (button taps).
 * Returns a cleanup function. Call this once in App.tsx.
 */
export function addNotificationResponseListener(
  onComplete: (taskId: string) => void,
  onDismiss: (taskId: string) => void,
): () => void {
  if (!Notifications) return () => {};

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const taskId = response.notification.request.content.data?.taskId as string | undefined;
    const notifId = response.notification.request.identifier;

    console.log('[Notifications] Response:', actionId, 'taskId:', taskId);

    // Dismiss the notification from the tray
    Notifications.dismissNotificationAsync(notifId).catch(() => {});

    if (!taskId) return;

    if (actionId === 'COMPLETE') {
      onComplete(taskId);
    } else if (actionId === 'DISMISS') {
      onDismiss(taskId);
    }
    // Default tap (no action identifier) → app opens normally
  });

  return () => subscription.remove();
}

/** Schedule a local notification for a task */
export async function scheduleTaskNotification(
  taskTitle: string,
  datetimeLocal: string,
  actionLabel: string,
  actionIcon: string,
  taskId?: string,
): Promise<string | null> {
  if (!Notifications) return null;

  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('[Notifications] Permission denied');
      return null;
    }

    // Parse datetime
    const taskDate = new Date(datetimeLocal.replace(' ', 'T'));
    const now = new Date();

    // Don't schedule past notifications
    if (taskDate <= now) {
      console.log('[Notifications] Skipping past task:', taskTitle);
      return null;
    }

    const secondsUntil = Math.max(1, Math.floor((taskDate.getTime() - now.getTime()) / 1000));

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${actionIcon} ${taskTitle}`,
        body: `${actionLabel} · ${datetimeLocal.split(' ')[1] ?? ''}`,
        sound: 'default',
        categoryIdentifier: TASK_CATEGORY,
        data: { taskId, taskTitle, actionLabel },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
        channelId: 'task-reminders',
      },
    });

    console.log('[Notifications] Scheduled:', taskTitle, 'in', secondsUntil, 's, id:', id);
    return id;
  } catch (e) {
    console.warn('[Notifications] Failed to schedule:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Cancel a specific notification */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch { /* ignore */ }
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* ignore */ }
}
