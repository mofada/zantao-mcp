/**
 * 禅道 Bug 基本信息
 */
export interface ZentaoBug {
	id: string
	title: string
	status: string
	pri: string
	severity: string
	type: string
	assignedTo: string
	openedBy: string
	openedDate: string
}

/**
 * 禅道分页信息
 */
export interface ZentaoPager {
	recTotal: number
	recPerPage: number
	pageTotal: number
	pageID: number
}

/**
 * 我的 Bug 列表响应数据
 */
export interface MyBugsResponse {
	title: string
	bugs: ZentaoBug[]
	type: string
	pager: ZentaoPager
}

/**
 * 禅道 Bug 附件元数据
 */
export interface ZentaoAttachment {
	id: string
	pathname: string
	title: string
	extension: string
	size: string
	objectType: string
	objectID: string
	webPath: string
	realPath: string
}

/**
 * Bug 详情
 */
export interface ZentaoBugDetail {
	id: string
	title: string
	status: string
	pri: string
	severity: string
	steps?: string
	assignedTo?: string
	openedBy?: string

	// 附件 ID → 附件元数据
	files?: Record<string, ZentaoAttachment>
}

export interface BugDetailResponse {
	bug: ZentaoBugDetail
}

