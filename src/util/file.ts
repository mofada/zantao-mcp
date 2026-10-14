
export type SupportedImageMime =
	| 'image/png'
	| 'image/jpeg'

/**
 * 根据文件签名识别图片类型。
 * 不依赖文件名和 Content-Type。
 */
export function detectImageMime(
	buffer: Buffer,
): SupportedImageMime | null {
	const pngSignature = Buffer.from(
		'89504e470d0a1a0a',
		'hex',
	)

	if (
		buffer.length >= 8 &&
		buffer.subarray(0, 8).equals(pngSignature)
	) {
		return 'image/png'
	}

	if (
		buffer.length >= 3 &&
		buffer[0] === 0xff &&
		buffer[1] === 0xd8 &&
		buffer[2] === 0xff
	) {
		return 'image/jpeg'
	}

	return null
}
