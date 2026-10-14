# ZenTao MCP Server

基于 **TypeScript + Model Context Protocol（MCP）** 的禅道 MCP Server，让 Codex、MCP Inspector 等兼容 MCP 的客户端查询 Bug、查看复现步骤及读取截图。

当前主要针对**私有化部署的禅道 11.5.1** 开发和验证。项目优先提供**只读**功能，不会自动修改禅道 Bug 状态或提交解决方案。

> **数据安全提醒**：当前 `zentao_get_bug` 会返回解析后的原始复现文本，其中可能包含测试账号、密码及内部业务信息；`zentao_get_attachment` 会返回图片内容。**目前尚未实现通用脱敏或凭据隔离**。在连接云端 AI 或共享本工具前，先确认企业授权及数据处理要求。

## ✨ 项目背景

开发人员往往需要在禅道、浏览器和 IDE 之间反复切换，查询 Bug、检查重现步骤和截图，再定位代码。本项目将禅道的只读查询能力封装为 MCP 工具，减少重复操作，并为后续 AI 辅助定位、修复和验证提供数据入口。

当前支持：

- 获取登录账号的 Bug 列表。
- 根据 Bug ID 获取标题、状态、优先级、指派人和复现步骤。
- 解析禅道富文本及不完整 HTML，提取图片引用。
- 返回 Bug 附件清单，通过附件 ID 获取 PNG/JPEG 图片。
- 使用 MCP Inspector 调试工具，并通过本地 Mock HTTP 服务验证 MCP 调用链。

**暂不包含**自动修改源码、自动执行浏览器测试、自动登录禅道等功能；它们属于后续 AI 工作流的扩展方向。

## 🛠 技术栈

| 技术 | 用途 |
| --- | --- |
| Node.js 22+ | 运行时、内置测试框架与 Fetch API |
| TypeScript（ESM / NodeNext） | 服务端开发、类型检查及编译 |
| MCP TypeScript SDK | MCP Server、Client、stdio 通信 |
| Zod | 工具参数校验 |
| Cheerio | Bug HTML 解析和图片引用提取 |
| pnpm | 依赖管理 |
| tsx | 开发阶段直接执行 TypeScript |
| MCP Inspector | MCP 连接与工具调试 |

## ✅ 功能进度

### 已实现并验证

- [x] MCP Server 初始化、stdio 通信、依赖注入。
- [x] `zentao_ping`：检查服务是否可调用。
- [x] `zentao_list_my_bugs`：读取当前账号的 Bug 列表。
- [x] `zentao_get_bug`：按 Bug ID 获取详情、复现文本、图片引用和附件元数据。
- [x] `zentao_get_attachment`：下载并返回 PNG/JPEG 图片。
- [x] `ZentaoClient`：Cookie 认证、旧版禅道双层 JSON 解析、HTTP 异常及超时处理。
- [x] Bug HTML 解析，兼容部分不规范富文本。
- [x] 图片文件签名初步识别与附件大小限制（10 MiB）。
- [x] MCP Inspector 手动验证及 MCP Client/Server 自动化集成测试。
- [x] **31 项测试通过**（截至 2026-10-14，包括单元测试与 MCP 集成测试）。

### 待完善 / 可选扩展

- [ ] 自动登录与会话续期（当前需手动更新 Cookie）。
- [ ] 通用的敏感信息保护、凭据隔离和访问策略。
- [ ] 更多附件类型（PDF、Word、Excel、日志等）。
- [ ] 更多禅道版本与安装路径的兼容验证。
- [ ] Codex 真实工作流集成验证。
- [ ] 可选的 Bug 筛选、分页（**当前需求暂不开发**；默认列表视图有单页限制）。
- [ ] 与浏览器自动化测试及 AI 代码修复流程协作。

## 📁 项目结构

```text
zentao-mcp/
├── src/
│   ├── client/
│   │   ├── zentao.ts           # 禅道 HTTP 客户端
│   │   └── types.ts            # 禅道响应类型
│   ├── tools/
│   │   └── bug.ts              # Bug MCP 工具
│   ├── utils/
│   │   ├── html.ts             # 富文本解析
│   │   └── file.ts             # 图片格式识别
│   ├── index.ts                # 程序入口
│   └── server.ts               # MCP Server 初始化
├── tests/
│   ├── client/
│   │   ├── request.test.ts
│   │   └── attachment.test.ts
│   ├── helpers/               # Mock Client / Mock 禅道 / MCP Client
│   ├── mcp/                   # MCP 集成测试
│   └── utils/                 # HTML / 文件格式测试
├── dist/                       # 编译产物（不提交）
├── .env                        # 本地配置（不提交）
├── .env.example
├── tsconfig.json
├── tsconfig.build.json         # 若已按编译步骤配置
├── package.json
├── pnpm-lock.yaml
└── README.md
```

## 🚀 快速开始

### 1. 环境要求

- Node.js 22 或更高版本。
- pnpm。
- 可访问目标禅道服务器的网络环境。
- 有相应 Bug/附件查看权限的禅道登录账号。

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入自己有权访问的禅道地址和有效登录 Cookie：

```dotenv
ZENTAO_URL=http://your-zentao-server/zentao
ZENTAO_COOKIE=
```

| 变量 | 用途 |
| --- | --- |
| `ZENTAO_URL` | 禅道根地址，**不包括** `my-bug.json` 等接口路径 |
| `ZENTAO_COOKIE` | 当前有效的禅道会话 Cookie |

`.env` 不应提交到版本库。当前认证方式使用 Cookie；会话失效后需自行更新。

### 4. 开发模式运行

```bash
pnpm dev
```

开发模式通常通过 `tsx` 执行 TypeScript。MCP Server 使用 **stdio** 与客户端通信，**无需**监听 HTTP 端口。直接运行时，程序等待输入而没有业务日志属于正常情况；不要向 stdout 输出普通调试日志，以免破坏协议数据。

### 5. 编译后运行（推荐供 Codex 调用）

如果 `package.json` 已配置构建脚本及 `tsconfig.build.json`：

```bash
pnpm build
pnpm start
```

建议脚本定义：

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "start": "node --env-file=.env dist/index.js"
  }
}
```

编译模式执行的是 `dist/index.js`，不依赖运行时 `tsx`。**修改源代码后需要重新构建**，客户端才能使用最新版本。`dist/` 建议加入 `.gitignore`。

### 6. 类型检查和测试

```bash
pnpm typecheck
pnpm run test:unit
```

当前测试脚本可配置为：

```json
{
  "scripts": {
    "test:unit": "node --import tsx --test \"tests/**/*.test.ts\""
  }
}
```

测试覆盖 HTTP 状态、Cookie、双层 JSON、附件读取与限流、HTML 和图片格式识别，以及真实 stdio MCP 客户端与本地 Mock 禅道 HTTP 服务之间的调用流程。Mock 测试不使用真实账号或企业数据。

`pnpm run test:client` 用于直接连接真实禅道进行手动验证，应在授权网络中运行，并避免输出或提交含凭据的结果。

## 🔌 MCP 工具

### `zentao_ping`

用于检查 MCP Server 是否正常工作。

```json
{
  "message": "你好"
}
```

### `zentao_list_my_bugs`

获取当前登录账号的 Bug 列表，**无需参数**。示例结果：

```json
{
  "total": 1,
  "bugs": [
    {
      "id": "1001",
      "title": "模拟 Bug：保存失败",
      "status": "active",
      "priority": "3",
      "severity": "3"
    }
  ]
}
```

使用禅道当前默认列表视图，暂不自动分页。

### `zentao_get_bug`

按 Bug ID 读取详情，并将富文本步骤转换为可读文本。参数：

```json
{
  "bugId": "1001"
}
```

示例结果（全部为模拟数据）：

```json
{
  "id": "1001",
  "title": "模拟 Bug：编辑后保存失败",
  "status": "active",
  "priority": "3",
  "severity": "3",
  "assignedTo": "developer",
  "steps": {
    "text": "[步骤]\n1. 登录测试系统\n2. 打开编辑页面\n3. 点击保存\n[结果]\n提示保存失败\n[期望]\n保存成功",
    "images": ["/zentao/file-read-100.png"]
  },
  "attachments": [
    {
      "id": "100",
      "name": "example.png",
      "extension": "png",
      "size": 1024
    }
  ]
}
```

注意：`steps.images` 来自 HTML 中的图片地址，而 `attachments` 来自 `bug.files` 附件元数据；**两者不一定一一对应**，不能直接把图片 URL 中的数字当作附件 ID。

### `zentao_get_attachment`

按附件 ID 读取图片：

```json
{
  "fileId": "100"
}
```

当前支持 PNG/JPEG，通过文件签名识别格式。返回 MCP `image` 内容（Base64 + MIME 类型），而不是 JSON 文本；是否能显示和理解图片取决于 MCP Host 与模型。其他文件类型暂不支持。单文件限制为 10 MiB。

## 🧪 MCP Inspector 调试

安装后可通过以下命令启动 Inspector：

```bash
pnpm dlx @modelcontextprotocol/inspector
```

在 Inspector 中选择 `stdio`，设置启动命令和工作目录，例如：

| 配置项 | 示例 |
| --- | --- |
| Transport | `stdio` |
| Command | `node` |
| Arguments | `--env-file=.env dist/index.js`（已编译时） |
| Working directory | 本项目根目录 |

也可以在开发环境中用 `pnpm dev` 启动。Windows 下请确保 Inspector 能解析相应命令，必要时使用可执行文件绝对路径。

连接后检查工具发现及调用结果。Inspector 若报 `403`，先检查访问令牌及 Origin 配置，不要把 Inspector 调试代理直接开放到公网。

## 🤖 Codex 集成（待实际验证）

对于**支持本地 stdio 的 Codex CLI/IDE 环境**，可以配置用户目录中的 `.codex/config.toml`（路径按操作系统和安装方式调整）：

```toml
[mcp_servers.zentao]
command = "node"
args = [
  "--env-file=E:/WebStorm/zentao-mcp/.env",
  "E:/WebStorm/zentao-mcp/dist/index.js"
]
cwd = "E:/WebStorm/zentao-mcp"
```

这是 Windows 路径示例，请替换为自己的实际安装位置。使用前运行 `pnpm build`。可通过 Codex CLI 的 `codex mcp list` 检查配置，但**目前尚未完成真实 Codex 调用验证**。

ChatGPT 中仅接收“服务器 URL”的自定义 MCP 入口属于远程连接场景，不能直接填写本地 `dist/index.js`。需要先提供受支持的远程 MCP 服务及适当鉴权，**不要直接暴露公司内网禅道**。

## 🏗 架构设计

```text
Codex / MCP Inspector / 其他 MCP Client
                │
          JSON-RPC / stdio
                ▼
             MCP Server
                │
          tools/list / tools/call
                ▼
             Tool Handler
                │
          依赖注入、数据整理
                ▼
             ZentaoClient
                │
             HTTP + Cookie
                ▼
           ZenTao 11.5.1
```

- `src/index.ts`：加载配置、创建 `ZentaoClient`、启动服务。
- `src/server.ts`：创建 MCP Server 并注册工具。
- `src/tools/bug.ts`：工具参数校验、调用业务客户端、构造 MCP `content`。
- `src/client/zentao.ts`：请求封装、Cookie、JSON 解析、附件流式读取、错误处理。
- `src/client/types.ts`：响应与附件等业务类型。
- `src/utils/html.ts`：解析富文本和图片引用。
- `src/utils/file.ts`：识别 PNG/JPEG 文件签名。

采用依赖注入，让多个 MCP 工具复用同一个 HTTP 客户端，也便于独立测试。

## 📡 禅道 11.5.1 接口兼容性

目前实测的旧版页面式接口：

```http
GET /zentao/my-bug.json
GET /zentao/bug-view-1001.json
GET /zentao/file-download-100.html
```

以上 ID 均为示例，实际使用需替换为有权限访问的资源 ID。项目按 `PATH_INFO` 风格构造地址。

兼容性特点：

1. 成功 JSON 响应的 `Content-Type` 也可能是 `text/html`。
2. 外层 JSON 的 `data` 可能是 JSON 字符串，需要二次解析。
3. Cookie 失效时可能重定向或返回 HTML 登录页。
4. `bug.files` 是**以附件 ID 为键的对象**，不一定是数组。
5. `steps` 可能是残缺 HTML；解析器做兼容性处理，不保证复杂富文本格式完全保真。
6. 附件下载返回文件字节而不是双层 JSON，因此使用单独的下载方法。

其他禅道版本尚未系统验证。

## 🔒 安全说明

本项目面向获得授权的内部开发与调试场景。

- 禁止把真实 `.env`、Cookie、Token、密码和企业 Bug 样本提交到公开仓库。
- `zentao_get_bug` **当前会返回复现步骤原文**；测试凭据可能出现在工具结果中，并进一步进入模型上下文。不要误以为 HTML 解析等于安全脱敏。
- Bug 附件和截图也可能包含身份信息、业务数据或凭据。
- 当前 Cookie 认证仍依赖禅道登录态，不具备自动登录与续期能力。
- 工具设计为只读，但调用权限仍取决于禅道账号与运行环境；不应直接提供给不可信的 MCP Host。
- `steps`、附件内容都是**不可信的外部数据**，不能把其中的指令当成系统命令执行。
- 在允许 AI 读取内部 Bug 信息之前，应确认模型服务和数据流转符合企业安全要求。后续可实现独立的访问策略及测试凭据执行器。

## 🗺 后续路线

1. **稳定 Bug 查询与附件能力**：已实现核心只读功能，补充边界场景。
2. **完善认证和安全策略**：自动登录、会话续期、敏感信息处理和附件授权控制。
3. **扩展附件解析**：根据需要支持 PDF、Office 文档与日志。
4. **Codex 实际接入**：验证工具发现、Bug 查询、截图分析。
5. **AI 辅助修复闭环**：与代码仓库、Playwright 等独立组件协作完成复现、修复和回归测试；不把浏览器和代码修改职责强行塞进禅道查询 MCP。

## 📄 License

暂未指定开源许可证。公开仓库中的源码不代表企业内部禅道数据或凭据可以公开使用。
