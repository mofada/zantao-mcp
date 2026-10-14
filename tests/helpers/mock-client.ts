
import { ZentaoClient } from '../../src/client/zentao.js'

/**
 * 创建用于单元测试的 ZentaoClient。
 * 使用虚构地址和 Cookie，不会主动访问真实禅道。
 */
export function createClient(): ZentaoClient {
	return new ZentaoClient(
		'http://localhost:8080/zentao/',
		'test-session=mock-cookie',
	)
}
