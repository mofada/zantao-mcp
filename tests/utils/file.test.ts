import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectImageMime } from '../../src/utils/file.js'

test('detectImageMime：识别 PNG 图片', () => {
	const buffer = Buffer.from(
		'89504e470d0a1a0a00000000',
		'hex',
	)

	assert.equal(detectImageMime(buffer), 'image/png')
})

test('detectImageMime：识别 JPEG 图片', () => {
	const buffer = Buffer.from(
		'ffd8ffe000104a464946',
		'hex',
	)

	assert.equal(detectImageMime(buffer), 'image/jpeg')
})

test('detectImageMime：不支持 PDF 文件', () => {
	const buffer = Buffer.from('%PDF-1.7')

	assert.equal(detectImageMime(buffer), null)
})

test('detectImageMime：拒绝 HTML 登录页面', () => {
	const buffer = Buffer.from('<html>Login</html>')

	assert.equal(detectImageMime(buffer), null)
})

test('detectImageMime：空文件与不完整文件头', () => {
	assert.equal(detectImageMime(Buffer.alloc(0)), null)
	assert.equal(detectImageMime(Buffer.from([0x89, 0x50])), null)
	assert.equal(detectImageMime(Buffer.from([0xff, 0xd8])), null)
})
