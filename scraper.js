"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapePage = scrapePage;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const playwright_1 = require("playwright");
let globalBrowser = null;
async function getBrowserInstance() {
    if (!globalBrowser) {
        globalBrowser = await playwright_1.chromium.launch({ headless: true });
    }
    return globalBrowser;
}
/**
 * Hybrid Scraping Engine:
 * 1. Tries fast static HTML fetch (5ms).
 * 2. Auto-escalates to Playwright if empty React/Vue SPA shell is detected.
 */
async function scrapePage(url) {
    try {
        const res = await axios_1.default.get(url, {
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
        const links = [];
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http')) {
                links.push(href);
            }
        });
        return { title, links, isSPA: false, contentLength: html.length };
    }
    catch (error) {
        console.error(`Static scrape failed for ${url}: ${error.message}. Fallback to Playwright...`);
        return await scrapeWithPlaywright(url);
    }
}
async function scrapeWithPlaywright(url) {
    const browser = await getBrowserInstance();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();
        const links = await page.$$eval('a[href]', (elements) => elements
            .map((el) => el.getAttribute('href'))
            .filter((h) => !!h && h.startsWith('http')));
        const content = await page.content();
        return { title, links, isSPA: true, contentLength: content.length };
    }
    finally {
        await context.close();
    }
}
