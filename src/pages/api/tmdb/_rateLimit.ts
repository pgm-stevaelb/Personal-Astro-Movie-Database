const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

type RateState = {
  count: number;
  reset: number;
};

const store = new Map<string, RateState>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.reset < now) {
    const next = { count: 1, reset: now + WINDOW_MS };
    store.set(key, next);
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      reset: next.reset,
      limit: MAX_REQUESTS
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      reset: current.reset,
      limit: MAX_REQUESTS
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count,
    reset: current.reset,
    limit: MAX_REQUESTS
  };
}
