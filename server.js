"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMcpServer = startMcpServer;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const crawlQueue_1 = require("../queue/crawlQueue");
const server = new index_js_1.Server({ name: 'crawlshield-mcp-server', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (req) => {
    if (req.params.name === 'crawl_page') {
        const { url, maxDepth = 2 } = req.params.arguments;
        await crawlQueue_1.crawlQueue.add('crawl-job', { url, maxDepth, currentDepth: 1 });
        return { content: [{ type: 'text', text: `✅ Enqueued crawl job for ${url}` }] };
    }
    if (req.params.name === 'get_queue_stats') {
        const waiting = await crawlQueue_1.crawlQueue.getWaitingCount();
        const active = await crawlQueue_1.crawlQueue.getActiveCount();
        const completed = await crawlQueue_1.crawlQueue.getCompletedCount();
        const failed = await crawlQueue_1.crawlQueue.getFailedCount();
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
async function startMcpServer() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('🤖 Anthropic MCP Server running over Stdio protocol');
}
if (require.main === module) {
    startMcpServer();
}
