import type {MyBugsResponse} from "./types.js";

export class ZentaoClient {
	private readonly baseUrl: string;


	constructor(baseUrl: string, private readonly cookie: string) {
		this.baseUrl = baseUrl.replace(/\/$/, '');
	}

	async getMyBugs(): Promise<MyBugsResponse> {
		const url = `${this.baseUrl}/my-bug.json`

		const response = await fetch(url, {
			headers: {
				Cookie: this.cookie,
				Accept: 'application/json'
			},
			redirect: 'manual'
		})

		if (!response.ok) {
			throw new Error(`请求失败：HTTP ${response.status}`)
		}

		// 禅道 11.5.1 虽然返回 text/html，
		// 但响应体实际上是 JSON
		const result = await response.json()

		// 检查禅道业务状态
		if (result.status !== 'success') {
			throw new Error('禅道接口返回失败')
		}

		// 解析内层 JSON
		const data = typeof result.data === 'string'
			? JSON.parse(result.data)
			: result.data;

		return data as MyBugsResponse;
	}
}