import { redisConnection } from '../config/redis';

/**
 * Per-Domain Adaptive Politeness Rate Limiter
 * Enforces politeness delays per specific domain to prevent IP blocks.
 */
export async function isDomainAllowed(domain: string, limitPerSec = 1): Promise<boolean> {
  const key = `ratelimit:${domain}`;
  const current = await redisConnection.incr(key);

  if (current === 1) {
    await redisConnection.expire(key, 1); // 1-second politeness window
    return true;
  }

  return current <= limitPerSec;
}
