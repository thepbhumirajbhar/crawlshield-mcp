"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDomainAllowed = isDomainAllowed;
const redis_1 = require("../config/redis");
/**
 * Per-Domain Adaptive Politeness Rate Limiter
 * Enforces politeness delays per specific domain to prevent IP blocks.
 */
async function isDomainAllowed(domain, limitPerSec = 1) {
    const key = `ratelimit:${domain}`;
    const current = await redis_1.redisConnection.incr(key);
    if (current === 1) {
        await redis_1.redisConnection.expire(key, 1); // 1-second politeness window
        return true;
    }
    return current <= limitPerSec;
}
