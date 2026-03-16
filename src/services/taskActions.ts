/**
 * Task action executor — performs actions based on task type.
 * BE provides action_url (deep link) and android_package for open_app.
 */

import { Platform, Linking } from 'react-native';

interface TaskAction {
  action: string;
  title: string;
  app_name?: string | null;
  action_url?: string | null;
  android_package?: string | null;
  hour?: number;
  minute?: number;
}

/**
 * Execute a task action. Returns a user-friendly status message.
 */
export async function executeTaskAction(task: TaskAction): Promise<string> {
  switch (task.action) {
    case 'alarm':  return setAlarm(task.title, task.hour, task.minute);
    case 'open_app': return openApp(task.app_name ?? null, task.action_url, task.android_package);
    case 'call':   return makeCall(task.title);
    default:       return '🔔 Đã nhắc nhở';
  }
}

// ── Alarm ──────────────────────────────────────────────

async function setAlarm(title: string, hour?: number, minute?: number): Promise<string> {
  if (Platform.OS === 'web') {
    return `⏰ Báo thức ${hour != null ? `${hour}:${String(minute ?? 0).padStart(2, '0')}` : ''} (cần app trên điện thoại)`;
  }

  // Android: native SET_ALARM intent
  if (Platform.OS === 'android') {
    try {
      const IL = await import('expo-intent-launcher').catch(() => null);
      if (IL) {
        await IL.startActivityAsync('android.intent.action.SET_ALARM', {
          extra: {
            'android.intent.extra.alarm.HOUR': hour ?? 0,
            'android.intent.extra.alarm.MINUTES': minute ?? 0,
            'android.intent.extra.alarm.MESSAGE': title,
            'android.intent.extra.alarm.SKIP_UI': false,
          },
        });
        return '⏰ Đã mở báo thức';
      }
    } catch (e) { console.warn('[TaskAction] Set alarm failed:', e); }
  }

  // iOS / fallback: open Clock app
  const clockUrl = Platform.OS === 'ios' ? 'clock-alarm://' : 'content://com.android.deskclock';
  if (await Linking.canOpenURL(clockUrl).catch(() => false)) {
    await Linking.openURL(clockUrl);
    return '⏰ Đã mở ứng dụng đồng hồ';
  }
  return '⏰ Báo thức đã được nhắc';
}

// ── Open App ───────────────────────────────────────────

async function openApp(
  appName: string | null,
  actionUrl: string | null | undefined,
  androidPkg?: string | null,
): Promise<string> {
  const label = appName || 'app';

  // Web: open URL in new tab
  if (Platform.OS === 'web') {
    const url = actionUrl || (appName ? `https://www.${appName.toLowerCase()}.com` : null);
    if (url) window.open(url, '_blank');
    return `📱 Đã mở ${label}`;
  }

  // 1. Deep link from BE (zalo://, fb://, youtube://...)
  if (actionUrl && !actionUrl.startsWith('http')) {
    try { await Linking.openURL(actionUrl); return `📱 Đã mở ${label}`; } catch {}
  }

  // 2. Android package intent (com.zing.zalo, com.facebook.katana...)
  if (Platform.OS === 'android' && androidPkg) {
    try {
      const IL = await import('expo-intent-launcher').catch(() => null);
      if (IL) {
        await IL.startActivityAsync('android.intent.action.MAIN', {
          packageName: androidPkg,
          category: 'android.intent.category.LAUNCHER',
        } as any);
        return `📱 Đã mở ${label}`;
      }
    } catch {}
  }

  // 3. Web URL fallback
  const webUrl = actionUrl?.startsWith('http') ? actionUrl : null;
  if (webUrl) {
    try { await Linking.openURL(webUrl); return `📱 Đã mở ${label} trên trình duyệt`; } catch {}
  }

  return `📱 Không tìm thấy app ${label}`;
}

// ── Phone Call ─────────────────────────────────────────

async function makeCall(title: string): Promise<string> {
  if (Platform.OS === 'web') return '📞 Gọi điện (cần app trên điện thoại)';

  const phoneMatch = title.match(/(\d[\d\s\-\.]{7,})/);
  if (phoneMatch) {
    const phone = phoneMatch[1]!.replace(/[\s\-\.]/g, '');
    if (await Linking.canOpenURL(`tel:${phone}`).catch(() => false)) {
      await Linking.openURL(`tel:${phone}`);
      return `📞 Đang gọi ${phone}`;
    }
  }
  return '📞 Nhắc gọi điện';
}
