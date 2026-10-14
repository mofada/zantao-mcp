
import process from 'node:process'
import {Client} from '@modelcontextprotocol/client'
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio'
import {MOCK_COOKIE} from './mock-zentao-server.js'

/**
 * 通过 stdio 启动真实 MCP Server。
 */
export async function createMcpClient(
	baseUrl = 'http://127.0.0.1:8080/zentao',
): Promise<Client> {
	const client = new Client({
		name: 'zentao-test-client',
		version: '1.0.0',
	})

	const transport = new StdioClientTransport({
		command: process.execPath,
		args: ['--import', 'tsx', 'src/index.ts'],
		cwd: process.cwd(),
		env: {
			...process.env,
			ZENTAO_URL: baseUrl,
			ZENTAO_COOKIE: MOCK_COOKIE,
		},
	})

	try {
		await client.connect(transport)
		return client
	} catch (error) {
		await client.close().catch(() => {})
		throw error
	}
}
