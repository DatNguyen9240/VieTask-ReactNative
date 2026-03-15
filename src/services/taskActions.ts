/**
 * Task action executor — performs actions based on task type.
 * Uses action_url from BE when available.
 */

import { Platform, Linking, Alert } from 'react-native';

/**
 * Execute a task action (alarm, open_app, call, notify).
 * Returns a user-friendly message about what happened.
 */
export async function executeTaskAction(
  action: string,
  title: string,
  appName: string | null,
  actionUrl: string | null | undefined,
  hour?: number,
  minute?: number,
): Promise<string> {
  switch (action) {
    case 'alarm':
      return await setAlarm(title, hour, minute);
    case 'open_app':
      return await openApp(appName, actionUrl);
    case 'call':
      return await makeCall(title);
    default:
      return '🔔 Đã nhắc nhở';
  }
}

/** Set alarm via native intent (Android) or open Clock app (iOS) */
async function setAlarm(title: string, hour?: number, minute?: number): Promise<string> {
  if (Platform.OS === 'web') {
    return `⏰ Báo thức ${hour != null ? `${hour}:${String(minute ?? 0).padStart(2, '0')}` : ''} (cần app trên điện thoại)`;
  }

  if (Platform.OS === 'android') {
    try {
      // @ts-ignore — dynamic import for native-only module
      const IntentLauncher = await import('expo-intent-launcher').catch(() => null);
      if (IntentLauncher) {
        await IntentLauncher.startActivityAsync('android.intent.action.SET_ALARM', {
          extra: {
            'android.intent.extra.alarm.HOUR': hour ?? 0,
            'android.intent.extra.alarm.MINUTES': minute ?? 0,
            'android.intent.extra.alarm.MESSAGE': title,
            'android.intent.extra.alarm.SKIP_UI': false,
          },
        });
        return '⏰ Đã mở báo thức';
      }
    } catch (e) {
      console.warn('[TaskAction] Set alarm failed:', e);
    }
  }

  // iOS or fallback: try to open Clock app
  const clockUrl = Platform.OS === 'ios' ? 'clock-alarm://' : 'content://com.android.deskclock';
  const canOpen = await Linking.canOpenURL(clockUrl).catch(() => false);
  if (canOpen) {
    await Linking.openURL(clockUrl);
    return '⏰ Đã mở ứng dụng đồng hồ';
  }

  return '⏰ Báo thức đã được nhắc';
}

/** Open an app — uses action_url from AI when available */
async function openApp(appName: string | null, actionUrl: string | null | undefined): Promise<string> {
  const label = appName || 'app';

  // Use AI-provided URL if available
  const url = actionUrl || (appName ? `https://www.${appName.toLowerCase().replace(/\s+/g, '')}.com` : null);

  if (!url) return `📱 Không biết mở app nào`;

  if (Platform.OS === 'web') {
    window.open(url, '_blank');
    return `📱 Đã mở ${label}`;
  }

  // Native: try deep link first, fallback to web URL
  const cleanName = appName?.toLowerCase().replace(/\s+/g, '') ?? '';
  const deepLinks = [`${cleanName}://`, `com.${cleanName}://`];

  for (const link of deepLinks) {
    const canOpen = await Linking.canOpenURL(link).catch(() => false);
    if (canOpen) {
      await Linking.openURL(link);
      return `📱 Đã mở ${label}`;
    }
  }

  // Fallback: open web URL
  await Linking.openURL(url);
  return `📱 Đã mở ${label} trên trình duyệt`;
}

/** Initiate a phone call */
async function makeCall(title: string): Promise<string> {
  if (Platform.OS === 'web') {
    return `📞 Gọi điện (cần app trên điện thoại)`;
  }

  const phoneMatch = title.match(/(\d[\d\s\-\.]{7,})/);
  if (phoneMatch) {
    const phone = phoneMatch[1]!.replace(/[\s\-\.]/g, '');
    const canOpen = await Linking.canOpenURL(`tel:${phone}`).catch(() => false);
    if (canOpen) {
      await Linking.openURL(`tel:${phone}`);
      return `📞 Đang gọi ${phone}`;
    }
  }

  return '📞 Nhắc gọi điện';
}
