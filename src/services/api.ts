/**
 * VieTask backend API service.
 * Connects to the NotificationApp backend for parsing Vietnamese text.
 */

const API_URL = 'https://vietask-production.up.railway.app';
console.log('[API] Using URL:', API_URL);

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

/** Create an abort signal with timeout (Hermes doesn't support AbortSignal.timeout) */
function createTimeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/** Parse Vietnamese text into structured tasks */
export async function parseText(text: string, tz = 'Asia/Ho_Chi_Minh', contacts?: Record<string, string>): Promise<ParseResult> {
  const nowLocal = new Date().toLocaleString('sv-SE', { timeZone: tz }).slice(0, 16).replace('T', ' ');

  const doFetch = (timeoutMs = 45_000) => {
    const { signal, clear } = createTimeoutSignal(timeoutMs);
    return fetch(`${API_URL}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, nowLocal, tz, contacts }),
      signal,
    }).finally(clear);
  };

  let res: Response;
  try {
    res = await doFetch();
  } catch (e) {
    // Log the error for debugging on Android builds
    const firstErr = e instanceof Error ? e : new Error(String(e));
    console.warn(`[API] First attempt failed: ${firstErr.name}: ${firstErr.message} (URL: ${API_URL}/parse)`);
    // Wait before retry (helps with cold starts)
    await new Promise(r => setTimeout(r, 2000));
    // Retry once on network/timeout error
    try {
      res = await doFetch();
    } catch (retryErr) {
      const err = retryErr instanceof Error ? retryErr : new Error(String(retryErr));
      console.error(`[API] Retry also failed: ${err.name}: ${err.message}`);
      if (err.name === 'AbortError') {
        throw new Error('Server phản hồi quá lâu. Kiểm tra kết nối mạng.');
      }
      throw new Error(`Không thể kết nối server (${err.name}). Kiểm tra kết nối mạng.`);
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
    const { signal, clear } = createTimeoutSignal(5000);
    const res = await fetch(`${API_URL}/health`, { signal });
    clear();
    return res.ok;
  } catch {
    return false;
  }
}

/** Get the current API URL */
export function getApiUrl() { return API_URL; }
