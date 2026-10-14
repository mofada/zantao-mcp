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

	private async request<T>(path: string): Promise<T> {
		const url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;

		console.error('[ZentaoClient] Request URL:', url)

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Cookie: this.cookie,
				Accept: 'application/json'
			},
			redirect: 'manual'
		})

		if (!response.ok) {
			throw new Error(`请求失败：HTTP ${response.status}`)
		}

		const result = await response.json()

		if (result.status !== 'success') {
			throw new Error(`禅道接口返回失败：${result.message ?? '未知错误'}`)
		}

		return (
			typeof result.data === 'string'
				? JSON.parse(result.data)
				: result.data
		) as T
	}
}