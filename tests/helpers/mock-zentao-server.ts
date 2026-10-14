
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

export const MOCK_COOKIE = 'test-session=mock-cookie'

/**
 * 模拟禅道旧版接口的双层 JSON 响应。
 */
export function zentaoResponse(data: unknown): string {
	return JSON.stringify({
		status: 'success',
		data: JSON.stringify(data),
	})
}

/**
 * 启动本地 Mock 禅道 HTTP Server。
 */
export async function createMockZentaoServer() {
	let receivedCookie: string | undefined
	let receivedPath: string | undefined

	const server = createServer((req, res) => {
		receivedCookie = req.headers.cookie
		receivedPath = req.url

		if (req.url === '/zentao/my-bug.json') {
			const data = {
				bugs: [{
					id: '1001',
					title: '模拟 Bug：保存失败',
					status: 'active',
					pri: '3',
					severity: '3',
				}],
				pager: {
					recTotal: 1,
					recPerPage: 20,
					pageID: 1,
				},
			}

			res.writeHead(200, {
				'Content-Type': 'text/html',
			})

			res.end(zentaoResponse(data))
			return
		}

		res.writeHead(404)
		res.end()
	})

	await new Promise<void>((resolve, reject) => {
		const onError = (error: Error) => {
			server.off('listening', onListening)
			reject(error)
		}

		const onListening = () => {
			server.off('error', onError)
			resolve()
		}

		server.once('error', onError)
		server.once('listening', onListening)
		server.listen(0, '127.0.0.1')
	})

	const { port } = server.address() as AddressInfo

	return {
		baseUrl: `http://127.0.0.1:${port}/zentao`,

		get receivedCookie() {
			return receivedCookie
		},

		get receivedPath() {
			return receivedPath
		},

		async close(): Promise<void> {
			await new Promise<void>((resolve, reject) => {
				server.close(error => {
					if (error) reject(error)
					else resolve()
				})
			})
		},
	}
}
