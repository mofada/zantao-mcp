
import * as cheerio from 'cheerio'

export interface ParsedBugContent {
	text: string
	images: string[]
}

export function parseBugHtml(html: string): ParsedBugContent {
	if (!html.trim()) {
		return { text: '', images: [] }
	}

	const images: string[] = []

	// 1. 先将换行格式统一
	const normalized = html
		.replace(/\r\n?/g, '\n')
		// 孤立的 </p> 在你的实际数据中充当段落分隔符
		.replace(/<\/p\s*>/gi, '\n')
		.replace(/<br\s*\/?>/gi, '\n')

	// 2. 使用 Cheerio 解析剩余 HTML
	const $ = cheerio.load(normalized)

	// 3. 提取图片
	$('img[src]').each((_, element) => {
		const src = $(element).attr('src')?.trim()
		if (src) images.push(src)
	})

	// 4. 删除无关元素
	$('script, style, noscript').remove()

	// 5. 其他块级元素补充换行
	$('p, div, li, h1, h2, h3, h4, h5, h6').each((_, element) => {
		$(element).append('\n')
	})

	// 6. 提取文本并清理空白字符
	const text = $.root()
		.text()
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim()

	return {
		text,
		images: [...new Set(images)],
	}
}
