import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ queues
  enableReadyCheck: false,
});

redisConnection.on('connect', () => console.error('🟢 Connected to Redis Engine'));
redisConnection.on('error', (err) => console.error('🔴 Redis Connection Error:', err.message));
