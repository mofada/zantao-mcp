import {test} from 'node:test'
import assert from 'node:assert/strict'
import {
	createMockZentaoServer,
	MOCK_COOKIE,
} from '../helpers/mock-zentao-server.js'
import {createMcpClient} from '../helpers/mcp-client.js'
import {Client} from '@modelcontextprotocol/client'


/**
 * 测试 1：工具发现
 *
 * 验证：
 * - MCP 初始化成功
 * - tools/list 正常
 * - 四个工具已正确注册
 */
test('MCP：能够发现所有已注册的工具', async (t) => {
	const client = await createMcpClient()

	t.after(async () => {
		await client.close()
	})

	const {tools} = await client.listTools()
	const names = tools.map(tool => tool.name)

	assert.ok(names.includes('zentao_ping'))
	assert.ok(names.includes('zentao_list_my_bugs'))
	assert.ok(names.includes('zentao_get_bug'))
	assert.ok(names.includes('zentao_get_attachment'))
})

/**
 * 测试 2：Ping 工具调用
 *
 * 验证：
 * - tools/call 正常
 * - Server 能够找到 Handler
 * - MCP Result 正常返回
 */
test('MCP：能够调用 zentao_ping', async (t) => {
	const client = await createMcpClient()

	t.after(async () => {
		await client.close()
	})

	const result = await client.callTool({
		name: 'zentao_ping',
		arguments: {
			message: 'hello',
		},
	})

	assert.notEqual(result.isError, true)

	assert.ok(
		result.content.some(item => item.type === 'text'),
	)
})

/**
 * 测试 3：完整业务调用链
 *
 * MCP Client
 *    ↓ stdio / JSON-RPC
 * MCP Server
 *    ↓ HTTP
 * Mock 禅道
 *    ↓ JSON
 * MCP Server
 *    ↓ MCP Result
 * MCP Client
 */
test('MCP：能够通过 HTTP 获取我的 Bug 列表', async (t) => {
	// 1. 启动本地 Mock HTTP Server
	const mockServer = await createMockZentaoServer()

	// 2. 统一清理资源：
	//    先关闭 MCP Client，再关闭 HTTP Server。
	let client: Client | undefined

	t.after(async () => {
		try {
			await client?.close()
		} finally {
			await mockServer.close()
		}
	})

	// 3. 启动真正的 MCP Server 子进程
	client = await createMcpClient(mockServer.baseUrl)

	// 4. 调用 MCP 工具
	const result = await client.callTool({
		name: 'zentao_list_my_bugs',
		arguments: {},
	})

	assert.notEqual(result.isError, true)

	// 5. 验证禅道 HTTP 请求路径
	assert.equal(
		mockServer.receivedPath,
		'/zentao/my-bug.json',
	)

	// 6. 验证请求携带 Cookie
	assert.equal(
		mockServer.receivedCookie,
		MOCK_COOKIE,
	)

	// 7. 获取 MCP 文本结果
	const content = result.content.find(
		item => item.type === 'text',
	)

	assert.ok(content, 'MCP 工具未返回文本内容')
	assert.equal(content.type, 'text')

	// 8. 解析工具返回的 JSON
	const output = JSON.parse(content.text)

	// 9. 验证业务数据
	assert.equal(output.bugs.length, 1)
	assert.equal(output.bugs[0].id, '1001')
	assert.equal(
		output.bugs[0].title,
		'模拟 Bug：保存失败',
	)
})
