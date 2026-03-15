/**
 * Notification service — platform-specific.
 * Metro resolves: .web.ts for web, .native.ts for iOS/Android.
 * This base file is used by TypeScript for type checking.
 */

export async function requestPermissions(): Promise<boolean> { return false; }

export async function scheduleTaskNotification(
  taskTitle: string, datetimeLocal: string, actionLabel: string, actionIcon: string,
): Promise<string | null> { return null; }

export async function cancelNotification(notificationId: string): Promise<void> {}
export async function cancelAllNotifications(): Promise<void> {}
