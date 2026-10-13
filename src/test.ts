import {ZentaoClient} from "./client/zentao.js";

const baseUrl = process.env.ZENTAO_URL
const cookie = process.env.ZENTAO_COOKIE

if (!baseUrl || !cookie) {
	throw new Error('缺少 ZENTAO_URL 或 ZENTAO_COOKIE 配置')
}

const client = new ZentaoClient(baseUrl, cookie)

try {
	const data = await client.getBug("8486")

	console.log('Bug ID：', data.bug.id)
	console.log('Bug 标题：', data.bug.title)
	console.log('Bug 状态：', data.bug.status)
	console.log('Bug 优先级：', data.bug.pri)
	console.log('重现步骤：', data.bug.steps ? '已获取' : '无')
} catch (error) {
	console.error('获取 Bug 失败：', error)
}