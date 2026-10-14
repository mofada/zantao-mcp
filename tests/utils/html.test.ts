
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBugHtml } from '../../src/utils/html.js'

test('parseBugHtml：解析标准 HTML', () => {
	const html = `
    <p>【步骤】</p>
    <p>1. 登录系统</p>
    <p>2. 修改尽调基准日</p>
    <p>【结果】保存失败</p>
  `

	const result = parseBugHtml(html)

	assert.match(result.text, /【步骤】/)
	assert.match(result.text, /1\. 登录系统/)
	assert.match(result.text, /2\. 修改尽调基准日/)
	assert.match(result.text, /【结果】保存失败/)
	assert.deepEqual(result.images, [])
})

test('parseBugHtml：兼容残缺的禅道 HTML', () => {
	const html = `
    [步骤]
    </p>
    账号：demo_user // demo_password // 测试人员
    </p>
    数据：测试企业</span></span>
    </p>
    [结果]
    </p>
    [期望]
  `

	const result = parseBugHtml(html)

	assert.match(result.text, /\[步骤\]/)
	assert.match(result.text, /账号：demo_user/)
	assert.match(result.text, /数据：测试企业/)
	assert.match(result.text, /\[结果\]/)
	assert.match(result.text, /\[期望\]/)
})

test('parseBugHtml：提取图片并去重', () => {
	const html = `
    <p>复现步骤</p>
    <img src="/zentao/file-read-100.png">
    <img src="/zentao/file-read-100.png">
    <img src="/zentao/file-read-101.png">
  `

	const result = parseBugHtml(html)

	assert.deepEqual(result.images, [
		'/zentao/file-read-100.png',
		'/zentao/file-read-101.png',
	])
})

test('parseBugHtml：空内容返回空结果', () => {
	assert.deepEqual(parseBugHtml(''), {
		text: '',
		images: [],
	})
})
