import axios from 'axios';
import * as cheerio from 'cheerio';
import { chromium, Browser } from 'playwright';

let globalBrowser: Browser | null = null;

async function getBrowserInstance(): Promise<Browser> {
  if (!globalBrowser) {
    globalBrowser = await chromium.launch({ headless: true });
  }
  return globalBrowser;
}

export interface ScrapeResult {
  title: string;
  links: string[];
  isSPA: boolean;
  contentLength: number;
}

/**
 * Hybrid Scraping Engine:
 * 1. Tries fast static HTML fetch (5ms).
 * 2. Auto-escalates to Playwright if empty React/Vue SPA shell is detected.
 */
export async function scrapePage(url: string): Promise<ScrapeResult> {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CrawlShield/1.0',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 5000,
    });
    const html = res.data;

    // React/Vue SPA Shell Detection
    if (typeof html === 'string' && (html.includes('<div id="root"></div>') || html.includes('<div id="app"></div>'))) {
      console.error(`⚡ React/Vue SPA detected on ${url}! Escalating to Playwright...`);
      return await scrapeWithPlaywright(url);
    }

    const $ = cheerio.load(html);
    const title = $('title').text().trim() || url;
    const links: string[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    return { title, links, isSPA: false, contentLength: html.length };
  } catch (error: any) {
    console.error(`Static scrape failed for ${url}: ${error.message}. Fallback to Playwright...`);
    return await scrapeWithPlaywright(url);
  }
}

async function scrapeWithPlaywright(url: string): Promise<ScrapeResult> {
  const browser = await getBrowserInstance();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const title = await page.title();
    const links = await page.$$eval('a[href]', (elements) =>
      elements
        .map((el) => el.getAttribute('href'))
        .filter((h): h is string => !!h && h.startsWith('http'))
    );
    const content = await page.content();

    return { title, links, isSPA: true, contentLength: content.length };
  } finally {
    await context.close();
  }
}
