import type {ZentaoClient} from '../client/zentao.js'
import {McpServer} from "@modelcontextprotocol/server";
import {z} from "zod";
import {detectImageMime} from "../util/file.js";
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
			description: '根据禅道 Bug ID 获取详情，包括标题、状态、优先级和重现步骤。适用于用户要求分析某个具体 Bug 的场景。',
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

				// 1. 解析 HTML，提取纯文本和图片
				const parsedSteps = parseBugHtml(bug.steps ?? '')

				const attachments = Object.values(bug.files ?? {}).map(file => ({
					id: file.id,
					name: file.title,
					extension: file.extension,
					size: Number(file.size),
				}))

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify({
								id: bug.id,
								title: bug.title,
								status: bug.status,
								priority: bug.pri,
								severity: bug.severity,
								assignedTo: bug.assignedTo,
								steps: parsedSteps,
								attachments,
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
								: '获取 Bug 详情失败',
						},
					],
				}
			}
		}
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