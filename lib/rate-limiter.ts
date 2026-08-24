/**
 * In-Memory Sliding-Window Rate Limiter & Security Throttler
 * Protects critical auth endpoints (OTP requests, password resets, logins) against brute-force and spam.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks if an action from an identifier (IP address or email) is within allowed limits.
 * @param key Unique key e.g. `otp_reset:user@domain.com` or `login_fail:127.0.0.1`
 * @param maxRequests Maximum allowed requests in window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfterSeconds: 0 };
}

/**
 * Resets rate limit counter upon successful action (e.g. successful login)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
