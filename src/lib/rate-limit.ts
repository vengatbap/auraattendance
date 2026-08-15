const tracker = new Map<string, { timestamps: number[] }>();

/**
 * Sliding window rate limiter
 * @param key Unique tracking identifier (e.g. `ip:endpoint`, `employeeId:endpoint`)
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 * @returns boolean True if request is allowed, false if rate limited
 */
export function isAllowed(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record) {
    tracker.set(key, { timestamps: [now] });
    return true;
  }

  // Filter timestamps to only keep ones within the active window
  const activeTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (activeTimestamps.length >= limit) {
    // Exceeded limit within window
    return false;
  }

  activeTimestamps.push(now);
  tracker.set(key, { timestamps: activeTimestamps });
  return true;
}
