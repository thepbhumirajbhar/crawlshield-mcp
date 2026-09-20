"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlWorker = exports.crawlQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const rateLimiter_1 = require("../services/rateLimiter");
const bloomFilter_1 = require("../services/bloomFilter");
const scraper_1 = require("../services/scraper");
const url_1 = require("url");
exports.crawlQueue = new bullmq_1.Queue('crawl-queue', { connection: redis_1.redisConnection });
exports.crawlWorker = new bullmq_1.Worker('crawl-queue', async (job) => {
    const { url, maxDepth, currentDepth = 1 } = job.data;
    let domain = '';
    try {
        domain = new url_1.URL(url).hostname;
    }
    catch (e) {
        return { status: 'INVALID_URL', url };
    }
    // Step 1: Visited Deduplication Check
    if (await (0, bloomFilter_1.isUrlVisited)(url)) {
        return { status: 'SKIPPED_VISITED', url };
    }
    // Step 2: Per-Domain Rate Limiter Check
    if (!(await (0, rateLimiter_1.isDomainAllowed)(domain))) {
        await exports.crawlQueue.add('crawl-job', job.data, { delay: 1000 });
        return { status: 'REQUEUED_RATE_LIMITED', url };
    }
    console.error(`[Worker Thread Processing] Depth (${currentDepth}/${maxDepth}): ${url}`);
    const result = await (0, scraper_1.scrapePage)(url);
    // Step 3: Recursive Enqueueing of child links
    if (currentDepth < maxDepth) {
        const childJobs = result.links.slice(0, 8).map((link) => ({
            name: 'crawl-job',
            data: { url: link, maxDepth, currentDepth: currentDepth + 1 },
        }));
        if (childJobs.length > 0) {
            await exports.crawlQueue.addBulk(childJobs); // Batch enqueueing to avoid locks
        }
    }
    return {
        status: 'SUCCESS',
        url,
        title: result.title,
        linksFound: result.links.length,
        isSPA: result.isSPA,
    };
}, { connection: redis_1.redisConnection, concurrency: 5 });
