/**
 * VieTask backend API service.
 * Connects to the NotificationApp backend for parsing Vietnamese text.
 */

// Đọc từ .env: EXPO_PUBLIC_API_URL
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://vietask-production.up.railway.app';

export interface ParsedTask {
  title: string;
  datetime_local: string;
  remind_before_minutes: number;
  repeat: string;
  confidence: number;
  need_clarification: boolean;
  clarifying_question: string | null;
  suggestions?: string[] | null;
  action: 'notify' | 'alarm' | 'open_app' | 'call';
  action_label: string;
  action_icon: string;
  action_url?: string | null;
  app_name: string | null;
}

export interface ParseResult {
  tasks: ParsedTask[];
  error?: string;
}

/** Parse Vietnamese text into structured tasks */
export async function parseText(text: string, tz = 'Asia/Ho_Chi_Minh', contacts?: Record<string, string>): Promise<ParseResult> {
  const nowLocal = new Date().toLocaleString('sv-SE', { timeZone: tz }).slice(0, 16).replace('T', ' ');

  const doFetch = () => fetch(`${API_URL}/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, nowLocal, tz, contacts }),
    signal: AbortSignal.timeout(15_000),
  });

  let res: Response;
  try {
    res = await doFetch();
  } catch (e) {
    // Retry once on network/timeout error
    try {
      res = await doFetch();
    } catch (retryErr) {
      const err = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
      if (err.name === 'TimeoutError') {
        throw new Error('Server phản hồi quá lâu. Kiểm tra kết nối mạng.');
      }
      throw new Error('Không thể kết nối server. Kiểm tra kết nối mạng.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Server error ${res.status}`);
  }

  return res.json();
}

/** Health check */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get the current API URL */
export function getApiUrl() { return API_URL; }
