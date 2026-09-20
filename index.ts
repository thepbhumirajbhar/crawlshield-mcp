import { startMcpServer } from './mcp/server';
import './queue/crawlQueue'; // Initialize Worker threads

console.error('⚡ Starting CrawlShield MCP System Architecture Engine...');

async function main() {
  await startMcpServer();
}

main().catch((err) => {
  console.error('🔴 Application Fatal Error:', err);
  process.exit(1);
});
