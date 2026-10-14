import { createClient } from '../helpers/mock-client.js'
import { afterEach, test, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
	mock.restoreAll()
})

test('getBug: 正确解析禅道双层 JSON', async () => {
	// 模拟禅道内部的业务数据
	const bugData = {
		bug: {
			id: '8486',
			title: '测试 Bug',
			status: 'active',
			pri: '3',
		},
	}

	// 模拟禅道外层响应
	const apiResponse = {
		status: 'success',
		data: JSON.stringify(bugData),
	}

	const fetchMock = mock.method(
		globalThis,
		'fetch',
		async () => new Response(JSON.stringify(apiResponse), {
			status: 200,
			headers: {
				'Content-Type': 'text/html',
			},
		}),
	)

	const client = createClient();

	const result = await client.getBug('8486')

	// 验证业务数据
	assert.equal(result.bug.id, '8486')
	assert.equal(result.bug.title, '测试 Bug')
	assert.equal(result.bug.status, 'active')

	// 验证请求地址没有多余的 /
	assert.equal(
		fetchMock.mock.calls[0]?.arguments[0],
		'http://localhost:8080/zentao/bug-view-8486.json',
	)

	// 验证请求携带了 Cookie
	const options = fetchMock.mock.calls[0]?.arguments[1] as RequestInit

	assert.equal(
		(options.headers as Record<string, string>).Cookie,
		'test-session=mock-cookie',
	)
})

test('getMyBugs：HTTP 302 提示会话异常', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(null, {
			status: 302,
			headers: {
				Location: '/zentao/user-login.html',
			},
		}),
	)

	const client = createClient()

	await assert.rejects(
		() => client.getMyBugs(),
		/会话可能已失效|重定向/,
	)
})


test('getBug：HTTP 401/403/404 错误处理', async (t) => {
	const cases = [
		{ status: 401, expected: /未授权|无访问权限/ },
		{ status: 403, expected: /未授权|无访问权限/ },
		{ status: 404, expected: /HTTP 404/ },
		{ status: 500, expected: /HTTP 500/ },
	]

	for (const { status, expected } of cases) {
		await t.test(`HTTP ${status}`, async () => {
			const fetchMock = mock.method(
				globalThis,
				'fetch',
				async () => new Response(null, {status}),
			)

			try {
				await assert.rejects(
					() => createClient().getBug('8486'),
					expected,
				)
			} finally {
				fetchMock.mock.restore()
			}
		})
	}
})


test('getBug：接口返回非 JSON 内容', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response('<html>Login Page</html>', {
			status: 200,
			headers: {
				'Content-Type': 'text/html',
			},
		}),
	)

	await assert.rejects(
		() => createClient().getBug('8486'),
		/非 JSON 内容/,
	)
})

test('getBug：外层响应缺少必要字段', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(
			JSON.stringify({ foo: 'bar' }),
			{ status: 200 },
		),
	)

	await assert.rejects(
		() => createClient().getBug('8486'),
		/缺少 status 或 data/,
	)
})

test('getBug：禅道业务状态失败', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(
			JSON.stringify({
				status: 'fail',
				message: '没有权限查看该 Bug',
				data: null,
			}),
			{ status: 200 },
		),
	)

	await assert.rejects(
		() => createClient().getBug('8486'),
		/没有权限查看该 Bug/,
	)
})

test('getBug：data 不是合法 JSON', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(
			JSON.stringify({
				status: 'success',
				data: '{invalid-json}',
			}),
			{ status: 200 },
		),
	)

	await assert.rejects(
		() => createClient().getBug('8486'),
		/data 不是有效的 JSON/,
	)
})


test('getBug：网络请求失败', async () => {
	mock.method(globalThis, 'fetch', async () => {
		throw new TypeError('fetch failed')
	})

	await assert.rejects(
		() => createClient().getBug('8486'),
		/禅道网络请求失败/,
	)
})


test('getBug：请求超时', async () => {
	mock.method(globalThis, 'fetch', async () => {
		throw new DOMException(
			'The operation was aborted due to timeout',
			'TimeoutError',
		)
	})

	await assert.rejects(
		() => createClient().getBug('8486'),
		/请求超时/,
	)
})