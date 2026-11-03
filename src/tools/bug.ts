import type {ZentaoClient} from '../client/zentao.js'
import {McpServer} from "@modelcontextprotocol/server";
import {z} from "zod";
import {detectImageMime} from "../utils/file.js";
import {parseBugHtml} from "../utils/html.js";

export function registerBugTools(server: McpServer, client: ZentaoClient) {
	server.registerTool(
		'zentao_list_my_bugs',
		{
			description: '获取当前禅道登录账号被指派的 Bug 列表，包括 Bug 编号、标题、状态和优先级。',
			inputSchema: z.object({}),
		},
		async () => {
			try {
				const data = await client.getMyBugs()

				const bugs = data.bugs.map(bug => ({
					id: bug.id,
					title: bug.title,
					status: bug.status,
					priority: bug.pri,
					severity: bug.severity,
				}))

				return {
					content: [
						{
							type: 'text' as const,
							text: JSON.stringify({
								total: data.pager.recTotal,
								bugs,
							}),
						},
					],
				}
			} catch (error) {
				return {
					isError: true,
					content: [
						{
							type: 'text' as const,
							text: error instanceof Error
								? error.message
								: '获取 Bug 列表失败',
						},
					],
				}
			}
		},
	)


	server.registerTool(
		'zentao_get_bug',
		{
			description:
				'根据禅道 Bug ID 获取标题、状态、优先级、严重程度、指派人、重现步骤、附件元数据及操作历史。操作历史包含操作者、动作、时间和纯文本评论，不包含字段变更明细。',
			inputSchema: z.object({
				bugId: z
					.string()
					.regex(/^[1-9]\d*$/, 'Bug ID 必须是正整数字符串')
					.describe('禅道 Bug ID，例如 8486'),
			}),
		},
		async ({bugId}) => {
			try {
				const data = await client.getBug(bugId)
				const bug = data.bug

				// 1. 解析重现步骤，提取纯文本和图片
				const steps = parseBugHtml(bug.steps ?? '')

				// 2. 提取附件
				const attachments = Object.values(bug.files ?? {}).map(file => ({
					id: file.id,
					name: file.title,
					extension: file.extension,
					size: Number(file.size),
				}))

				// 3. 提取操作历史
				const actions = Object.values(data.actions ?? {})
					.map(action => ({
						id: action.id,
						actor: action.actor,
						action: action.action,
						date: action.date,

						// 评论可能包含重要的接口响应、补充说明
						// 复用 HTML 解析逻辑，仅返回纯文本评论
						comment: parseBugHtml(action.comment ?? '').text,
					}))
					.sort((a, b) =>
						a.date.localeCompare(b.date) ||
						Number(a.id) - Number(b.id),
					)

				// 4. 组织 MCP 工具输出
				const result = {
					id: bug.id,
					title: bug.title,
					status: bug.status,
					priority: bug.pri,
					severity: bug.severity,
					assignedTo: bug.assignedTo,
					steps,
					attachments,
					actions,
				}

				return {
					content: [
						{
							type: 'text' as const,
							text: JSON.stringify(result),
						},
					],
				}
			} catch (error) {
				return {
					isError: true,
					content: [
						{
							type: 'text' as const,
							text: error instanceof Error
								? error.message
								: '获取 Bug 详情失败',
						},
					],
				}
			}
		},
	)

	server.registerTool(
		'zentao_get_attachment',
		{
			description:
				'根据禅道 Bug 附件 ID 获取图片内容。用于分析 Bug 截图，目前支持 PNG 和 JPEG。',
			inputSchema: z.object({
				fileId: z
					.string()
					.regex(/^[1-9]\d*$/)
					.describe('禅道附件 ID，例如 13424'),
			}),
		},
		async ({fileId}) => {
			const buffer = await client.getAttachment(fileId)
			const mimeType = detectImageMime(buffer)

			if (!mimeType) {
				return {
					isError: true,
					content: [{
						type: 'text' as const,
						text: '暂不支持该附件格式，仅支持 PNG 和 JPEG。',
					}],
				}
			}

			return {
				content: [{
					type: 'image' as const,
					data: buffer.toString('base64'),
					mimeType,
				}],
			}
		},
	)
}
