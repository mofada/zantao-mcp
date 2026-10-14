import type {BugDetailResponse, MyBugsResponse} from "./types.js";

export class ZentaoClient {
	private readonly baseUrl: string;


	constructor(baseUrl: string, private readonly cookie: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
	}

	async getMyBugs(): Promise<MyBugsResponse> {
		return this.request<MyBugsResponse>('my-bug.json')
	}

	/**
	 * 根据 Bug ID 获取详情
	 */
	async getBug(bugId: string): Promise<BugDetailResponse> {
		if (!/^[1-9]\d*$/.test(bugId)) {
			throw new Error('Bug ID 必须是正整数字符串')
		}

		return this.request<BugDetailResponse>(
			`bug-view-${bugId}.json`,
		)
	}


	async getAttachment(fileId: string): Promise<Buffer> {
		if (!/^[1-9]\d*$/.test(fileId)) {
			throw new Error('附件 ID 必须是正整数字符串')
		}

		const url = `${this.baseUrl}/file-download-${fileId}.html`
		const maxSize = 10 * 1024 * 1024

		const response = await fetch(url, {
			headers: {
				Cookie: this.cookie,
			},
			redirect: 'manual',
			signal: AbortSignal.timeout(15_000),
		})

		// 1. 单独处理重定向
		if (response.status >= 300 && response.status < 400) {
			throw new Error('禅道可能未登录或 Cookie 已失效')
		}

		// 2. 处理 HTTP 错误
		if (!response.ok) {
			throw new Error(`下载附件失败：HTTP ${response.status}`)
		}

		// 3. 检查响应类型
		const contentType = response.headers
			.get('content-type')
			?.toLowerCase() ?? ''

		if (
			contentType.includes('text/html') ||
			contentType.includes('application/json')
		) {
			throw new Error(
				'附件接口返回了页面或 JSON，而不是预期的文件',
			)
		}

		// 4. 检查 Content-Length
		const contentLength = response.headers.get('content-length')

		if (
			contentLength !== null &&
			Number(contentLength) > maxSize
		) {
			throw new Error('附件超过 10MB 限制')
		}

		// 5. 流式读取，限制实际下载大小
		if (!response.body) {
			throw new Error('附件响应没有文件内容')
		}

		const reader = response.body.getReader()
		const chunks: Uint8Array[] = []
		let totalSize = 0

		try {
			while (true) {
				const { done, value } = await reader.read()

				if (done) break

				totalSize += value.byteLength

				if (totalSize > maxSize) {
					await reader.cancel()
					throw new Error('附件超过 10MB 限制')
				}

				chunks.push(value)
			}
		} finally {
			reader.releaseLock()
		}

		const buffer = Buffer.concat(chunks)

		if (buffer.length === 0) {
			throw new Error('下载附件为空')
		}

		return buffer
	}


	/**
	 * 禅道通用请求方法
	 */
	private async request<T>(path: string): Promise<T> {
		// 1. 拼接请求地址
		const url = `${this.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

		let response: Response

		// 2. 发送 HTTP 请求
		try {
			response = await fetch(url, {
				method: 'GET',
				headers: {
					Cookie: this.cookie,
					Accept: 'application/json',
				},
				redirect: 'manual',
				signal: AbortSignal.timeout(15_000),
			})
		} catch (error) {
			if (
				error instanceof Error &&
				(error.name === 'TimeoutError' || error.name === 'AbortError')
			) {
				throw new Error('禅道请求超时，请检查服务器连接状态', {
					cause: error,
				})
			}

			throw new Error('禅道网络请求失败', {
				cause: error,
			})
		}

		// 3. 判断是否发生重定向
		if (response.status >= 300 && response.status < 400) {
			throw new Error(
				'禅道会话可能已失效，或接口发生重定向，请检查 ZENTAO_COOKIE 和请求地址',
			)
		}

		// 4. 检查 HTTP 状态
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error('禅道接口不存在或请求资源不存在（HTTP 404）')
			}

			if (response.status === 401 || response.status === 403) {
				throw new Error('禅道请求未授权或无访问权限，请检查 Cookie')
			}

			throw new Error(`禅道请求失败：HTTP ${response.status}`)
		}

		// 5. 获取原始响应内容
		// 旧版禅道可能以 text/html 返回 JSON，因此不能只依赖 Content-Type
		const rawText = await response.text()

		// 6. 解析外层 JSON
		let result: unknown

		try {
			result = JSON.parse(rawText)
		} catch {
			throw new Error(
				'禅道返回了非 JSON 内容，可能是登录页面或接口地址错误',
			)
		}

		// 7. 校验外层响应结构
		if (
			typeof result !== 'object' ||
			result === null ||
			!('status' in result) ||
			!('data' in result)
		) {
			throw new Error('禅道响应格式异常：缺少 status 或 data')
		}

		// 8. 检查禅道业务状态
		if (result.status !== 'success') {
			const message =
				'message' in result && typeof result.message === 'string'
					? result.message
					: '未知错误'

			throw new Error(`禅道接口返回失败：${message}`)
		}

		// 9. 解析 data 字段（可能是 JSON 字符串）
		let data: unknown

		try {
			data = typeof result.data === 'string'
				? JSON.parse(result.data)
				: result.data
		} catch {
			throw new Error('禅道响应格式异常：data 不是有效的 JSON')
		}

		// 10. 返回业务数据
		return data as T
	}
}