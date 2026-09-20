"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scraper_1 = require("./services/scraper");
async function runTest() {
    console.log('🧪 Testing CrawlShield Hybrid Scraper Engine on https://example.com ...\n');
    const startTime = Date.now();
    const result = await (0, scraper_1.scrapePage)('https://example.com');
    const duration = Date.now() - startTime;
    console.log('✅ SCRAPE SUCCESSFUL!');
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`📄 Title: "${result.title}"`);
    console.log(`⚡ Is React/Vue SPA: ${result.isSPA}`);
    console.log(`🔗 Links Found (${result.links.length}):`, result.links);
    console.log(`📏 Content Size: ${result.contentLength} bytes\n`);
    process.exit(0);
}
runTest().catch((err) => {
    console.error('❌ Scrape Test Error:', err);
    process.exit(1);
});
