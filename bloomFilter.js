"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUrlVisited = isUrlVisited;
exports.resetVisitedStore = resetVisitedStore;
const redis_1 = require("../config/redis");
/**
 * Visited URL Deduplication Service
 * Uses Redis Set / Bloom Filter to check if a URL was already crawled in sub-1ms.
 */
async function isUrlVisited(url) {
    // sadd returns 1 if added (new item), 0 if already existed (visited item)
    const added = await redis_1.redisConnection.sadd('crawled_urls_set', url);
    return added === 0;
}
async function resetVisitedStore() {
    await redis_1.redisConnection.del('crawled_urls_set');
}
