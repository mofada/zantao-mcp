import { createClient } from '../helpers/mock-client.js'
import { afterEach, test, mock } from 'node:test'
import assert from 'node:assert/strict'

afterEach(() => {
	mock.restoreAll()
})

test('getAttachment：正确下载 PNG 附件', async () => {
	// PNG 标准文件签名
	const pngBuffer = Buffer.from(
		'89504e470d0a1a0a',
		'hex',
	)

	const fetchMock = mock.method(
		globalThis,
		'fetch',
		async () => new Response(pngBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'image/png',
				'Content-Length': String(pngBuffer.length),
			},
		}),
	)

	const client = createClient()
	const result = await client.getAttachment('13424')

	// 验证下载内容
	assert.deepEqual(result, pngBuffer)

	// 验证请求 URL
	assert.equal(
		fetchMock.mock.calls[0]?.arguments[0],
		'http://localhost:8080/zentao/file-download-13424.html',
	)
})


test('getAttachment：拒绝 HTML 登录页面', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(
			'<html><body>Login</body></html>',
			{
				status: 200,
				headers: {
					'Content-Type': 'text/html',
				},
			},
		),
	)

	await assert.rejects(
		() => createClient().getAttachment('13424'),
		/返回了页面或 JSON/,
	)
})

test('getAttachment：拒绝非法附件 ID', async () => {
	await assert.rejects(
		() => createClient().getAttachment('../123'),
		/附件 ID/,
	)

	await assert.rejects(
		() => createClient().getAttachment('abc'),
		/附件 ID/,
	)
})


test('getAttachment：拒绝超过 10MB 的附件', async () => {
	mock.method(
		globalThis,
		'fetch',
		async () => new Response(
			new Uint8Array(8),
			{
				status: 200,
				headers: {
					'Content-Type': 'image/png',
					'Content-Length': String(11 * 1024 * 1024),
				},
			},
		),
	)

	await assert.rejects(
		() => createClient().getAttachment('13424'),
		/超过 10MB 限制/,
	)
})


test('getAttachment：流式下载超过限制时终止读取', async () => {
	let cancelled = false

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			// 第一块 6MB
			controller.enqueue(new Uint8Array(6 * 1024 * 1024))

			// 第二块 5MB，总计 11MB
			controller.enqueue(new Uint8Array(5 * 1024 * 1024))
		},

		cancel() {
			cancelled = true
		},
	})

	mock.method(
		globalThis,
		'fetch',
		async () => new Response(stream, {
			status: 200,
			headers: {
				'Content-Type': 'image/png',
			},
		}),
	)

	await assert.rejects(
		() => createClient().getAttachment('13424'),
		/超过 10MB 限制/,
	)

	assert.equal(cancelled, true)
})


test('getAttachment：下载过程中断时抛出错误', async () => {
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new Uint8Array([1, 2, 3]))

			controller.error(new Error('connection reset'))
		},
	})

	mock.method(
		globalThis,
		'fetch',
		async () => new Response(stream, {
			status: 200,
			headers: {
				'Content-Type': 'image/png',
			},
		}),
	)

	await assert.rejects(
		() => createClient().getAttachment('13424'),
		/connection reset/,
	)
})