import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { crawlQueue } from '../queue/crawlQueue';

const server = new Server(
  { name: 'crawlshield-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'crawl_page',
      description: 'Trigger distributed crawling job for any website URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL to crawl' },
          maxDepth: { type: 'number', description: 'Crawl recursion depth (1-5)' },
        },
        required: ['url'],
      },
    },
    {
      name: 'get_queue_stats',
      description: 'Get real-time Redis queue and worker telemetry metrics',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === 'crawl_page') {
    const { url, maxDepth = 2 } = req.params.arguments as { url: string; maxDepth?: number };
    await crawlQueue.add('crawl-job', { url, maxDepth, currentDepth: 1 });
    return { content: [{ type: 'text', text: `✅ Enqueued crawl job for ${url}` }] };
  }

  if (req.params.name === 'get_queue_stats') {
    const waiting = await crawlQueue.getWaitingCount();
    const active = await crawlQueue.getActiveCount();
    const completed = await crawlQueue.getCompletedCount();
    const failed = await crawlQueue.getFailedCount();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ waiting, active, completed, failed }, null, 2),
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${req.params.name}`);
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🤖 Anthropic MCP Server running over Stdio protocol');
}

if (require.main === module) {
  startMcpServer();
}
