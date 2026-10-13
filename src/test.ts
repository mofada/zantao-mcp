import {ZentaoClient} from "./client/zentao.js";

const baseUrl = process.env.ZENTAO_URL
const cookie = process.env.ZENTAO_COOKIE

if (!baseUrl || !cookie) {
	throw new Error('缺少 ZENTAO_URL 或 ZENTAO_COOKIE 配置')
}

const client = new ZentaoClient(baseUrl, cookie)

try {
	const data = await client.getMyBugs()

	console.log('Bug 总数：', data.pager.recTotal)

	console.table(
		data.bugs.map((bug) => ({
			id: bug.id,
			title: bug.title,
			status: bug.status,
			priority: bug.pri
		}))
	)
} catch (error) {
	console.error('请求失败：', error)
}