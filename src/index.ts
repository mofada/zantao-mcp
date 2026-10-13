import {serveStdio} from "@modelcontextprotocol/server/stdio";
import {createServer} from "./server.js";
import {ZentaoClient} from "./client/zentao.js";

const baseUrl = process.env.ZENTAO_URL
const cookie = process.env.ZENTAO_COOKIE

if (!baseUrl || !cookie) {
	throw new Error('缺少 ZENTAO_URL 或 ZENTAO_COOKIE 配置')
}

const client = new ZentaoClient(baseUrl, cookie)

void serveStdio(() => createServer(client));