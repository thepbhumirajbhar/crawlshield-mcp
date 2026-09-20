import { redisConnection } from '../config/redis';

/**
 * Visited URL Deduplication Service
 * Uses Redis Set / Bloom Filter to check if a URL was already crawled in sub-1ms.
 */
export async function isUrlVisited(url: string): Promise<boolean> {
  // sadd returns 1 if added (new item), 0 if already existed (visited item)
  const added = await redisConnection.sadd('crawled_urls_set', url);
  return added === 0;
}

export async function resetVisitedStore(): Promise<void> {
  await redisConnection.del('crawled_urls_set');
}
