import { McpServer } from '@modelcontextprotocol/server'
import { z } from 'zod'
import type { ZentaoClient } from './client/zentao.js'
import { registerBugTools } from './tools/bug.js'

export function createServer(client: ZentaoClient) {
	const server = new McpServer({
		name: 'zentao-mcp',
		version: '0.0.1',
	})

	server.registerTool(
		'zentao_ping',
		{
			description: '检查禅道 MCP Server 是否正常工作',
			inputSchema: z.object({
				message: z.string().default('Hello, MCP!'),
			}),
		},
		async ({message}) => {
			return {
				content: [{
					type: 'text',
					text: `ZenTao MCP Server: ${message}`,
				}]
			}
		}
	)

	// 注册禅道 Bug 工具
	registerBugTools(server, client);

	return server;
}