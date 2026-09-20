import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../config/redis';
import { isDomainAllowed } from '../services/rateLimiter';
import { isUrlVisited } from '../services/bloomFilter';
import { scrapePage } from '../services/scraper';
import { URL } from 'url';

export const crawlQueue = new Queue('crawl-queue', { connection: redisConnection });

export const crawlWorker = new Worker(
  'crawl-queue',
  async (job) => {
    const { url, maxDepth, currentDepth = 1 } = job.data;
    let domain = '';

    try {
      domain = new URL(url).hostname;
    } catch (e) {
      return { status: 'INVALID_URL', url };
    }

    // Step 1: Visited Deduplication Check
    if (await isUrlVisited(url)) {
      return { status: 'SKIPPED_VISITED', url };
    }

    // Step 2: Per-Domain Rate Limiter Check
    if (!(await isDomainAllowed(domain))) {
      await crawlQueue.add('crawl-job', job.data, { delay: 1000 });
      return { status: 'REQUEUED_RATE_LIMITED', url };
    }

    console.error(`[Worker Thread Processing] Depth (${currentDepth}/${maxDepth}): ${url}`);
    const result = await scrapePage(url);

    // Step 3: Recursive Enqueueing of child links
    if (currentDepth < maxDepth) {
      const childJobs = result.links.slice(0, 8).map((link) => ({
        name: 'crawl-job',
        data: { url: link, maxDepth, currentDepth: currentDepth + 1 },
      }));

      if (childJobs.length > 0) {
        await crawlQueue.addBulk(childJobs); // Batch enqueueing to avoid locks
      }
    }

    return {
      status: 'SUCCESS',
      url,
      title: result.title,
      linksFound: result.links.length,
      isSPA: result.isSPA,
    };
  },
  { connection: redisConnection, concurrency: 5 }
);
