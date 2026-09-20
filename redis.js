"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redisConnection = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ queues
    enableReadyCheck: false,
});
exports.redisConnection.on('connect', () => console.error('🟢 Connected to Redis Engine'));
exports.redisConnection.on('error', (err) => console.error('🔴 Redis Connection Error:', err.message));
