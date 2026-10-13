import type { ZentaoClient } from '../client/zentao.js'
import {McpServer} from "@modelcontextprotocol/server";
import {z} from "zod";

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
}