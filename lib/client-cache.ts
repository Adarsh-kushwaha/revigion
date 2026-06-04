const DEFAULT_TTL_MS = 30 * 60 * 1000;

interface Entry<T> {
  data: T;
  fetchedAt: number;
}

export function isHardReload(): boolean {
  if (typeof performance === 'undefined') return false;
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === 'reload';
}

export function readCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.fetchedAt > ttlMs) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const entry: Entry<T> = { data, fetchedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // quota or disabled — ignore
  }
}

export function clearCache(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const cacheKeys = {
  dashboard: (userId: string) => `revigion:dashboard:v1:${userId}`,
  home: (userId: string) => `revigion:home:v1:${userId}`,
  subject: (userId: string, id: string) => `revigion:subject:v1:${userId}:${id}`,
  question: (userId: string, qid: string) => `revigion:question:v1:${userId}:${qid}`,
};

export function invalidateAll(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('revigion:')) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
