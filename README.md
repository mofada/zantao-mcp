# ZenTao MCP Server

基于 **TypeScript + Model Context Protocol（MCP）** 开发的禅道 MCP 服务，为 Codex 等支持 MCP 协议的 AI 编程工具提供禅道 Bug 查询能力。

项目主要面向私有化部署的旧版禅道，当前基于 **禅道 11.5.1** 进行开发和验证。

## ✨ 项目背景

在日常研发过程中，开发人员需要频繁打开禅道查看 Bug 列表、重现步骤、问题截图，再切换到 IDE 中定位代码。

本项目希望通过 MCP 协议，将禅道的缺陷管理能力接入 AI 编程工具，实现从 Bug 查询、问题分析到代码修复的辅助开发流程。

预期使用场景：

- 查询当前账号待处理的 Bug
- 根据 Bug ID 获取详细信息和重现步骤
- 读取 Bug 中关联的截图
- 结合本地项目源码分析问题原因
- 辅助生成修复方案和验证建议

目前优先实现只读能力，避免 AI 工具直接修改禅道业务数据。

## 🛠 技术栈

| 技术 | 用途 |
|---|---|
| Node.js 22+ | JavaScript 运行环境 |
| TypeScript | 类型安全与业务代码开发 |
| MCP TypeScript SDK | MCP 服务端开发 |
| Zod | MCP 工具参数校验 |
| pnpm | 依赖管理 |
| MCP Inspector | MCP 工具调试 |
| stdio | MCP Client 与 Server 之间的通信方式 |

## ✅ 功能进度

### 已实现

- [x] MCP Server 初始化
- [x] stdio 通信
- [x] `zentao_ping` 连通性测试工具
- [x] `ZentaoClient` HTTP 客户端
- [x] 禅道 Cookie 认证请求
- [x] 禅道旧版双层 JSON 响应解析
- [x] 当前账号被指派的 Bug 列表查询
- [x] `zentao_list_my_bugs` MCP 工具
- [x] MCP Inspector 调用验证
- [x] 通过依赖注入共享客户端实例

### 计划实现

- [ ] 根据 Bug ID 查询详细信息
- [ ] 解析 Bug 重现步骤中的富文本
- [ ] 获取 Bug 截图及附件
- [ ] 自动登录及 Session 续期
- [ ] Bug 列表分页查询
- [ ] Bug 状态和优先级筛选
- [ ] 响应数据校验与敏感信息脱敏
- [ ] Codex 集成验证
- [ ] 自动化测试

## 📁 项目结构

```text
zentao-mcp/
├── src/
│   ├── client/
│   │   ├── zentao.ts      # 禅道 HTTP 客户端
│   │   └── types.ts       # 禅道业务类型
│   ├── tools/
│   │   └── bug.ts         # Bug MCP 工具注册
│   ├── index.ts           # 应用入口、依赖初始化
│   ├── server.ts          # MCP Server 初始化
│   └── test.ts            # 禅道客户端调试
├── .env                   # 本地环境变量（不提交）
├── .env.example           # 环境变量示例
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── README.md
```

## 🚀 快速开始

### 1. 环境要求

- Node.js 22 或更高版本
- pnpm
- 可访问禅道服务器的网络环境
- 具有 Bug 查询权限的禅道账号

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`。

```dotenv
ZENTAO_URL=http://your-zentao-server/zentao
ZENTAO_COOKIE=
```

配置说明：

| 变量 | 说明 |
|---|---|
| `ZENTAO_URL` | 禅道服务根地址 |
| `ZENTAO_COOKIE` | 当前有效的禅道登录 Cookie |

**注意：** 当前版本暂时使用 Cookie 认证，Cookie 失效后需要更新。后续将实现自动登录和 Session 管理。

不要将 `.env`、真实 Cookie 或其他敏感凭据提交到 Git 仓库。

### 4. 启动 MCP Server

```bash
pnpm dev
```

项目使用 Node.js 的 `--env-file` 加载本地环境变量，并通过 `tsx` 执行 TypeScript 代码。

MCP Server 采用 stdio 通信，不需要监听 HTTP 端口。

启动后终端保持运行并等待客户端消息属于正常现象。

### 5. TypeScript 类型检查

```bash
pnpm typecheck
```

### 6. 测试禅道客户端

```bash
pnpm run test:client
```

该命令用于验证禅道 HTTP 请求、认证以及数据解析是否正常。

## 🔌 MCP 工具说明

### `zentao_ping`

检查 MCP Server 是否正常工作。

参数：

| 参数 | 类型 | 说明 |
|---|---|---|
| `message` | string | 测试消息，默认 `hello` |

示例：

```json
{
  "message": "你好"
}
```

返回示例：

```text
ZenTao MCP Server: 你好
```

### `zentao_list_my_bugs`

获取当前禅道登录账号被指派的 Bug 列表。

参数：无。

返回示例（模拟数据）：

```json
{
  "total": 2,
  "bugs": [
    {
      "id": "1001",
      "title": "示例：保存表单时提示数据不存在",
      "status": "active",
      "priority": "3",
      "severity": "3"
    },
    {
      "id": "1002",
      "title": "示例：编辑页面未正确显示标签页",
      "status": "active",
      "priority": "2",
      "severity": "3"
    }
  ]
}
```

当前工具读取默认列表视图，尚未实现自动分页，因此在 Bug 数量超过单页限制时，不能保证返回全部数据。

## 🧪 MCP Inspector 调试

运行：

```bash
pnpm dlx @modelcontextprotocol/inspector pnpm dev
```

在 Inspector 中选择 stdio 连接方式。

配置示例：

| 配置项 | 值 |
|---|---|
| Server ID | `zentao-mcp` |
| Transport | `stdio` |
| Command | `pnpm` |
| Arguments | `dev` |
| Working directory | 项目根目录 |

连接成功后，可以在 Tools 页面查看并调用：

- `zentao_ping`
- `zentao_list_my_bugs`

运行 Inspector 时应保留本地访问认证，不建议将调试服务暴露到公网。

## 🏗 架构设计

项目采用分层设计和依赖注入，减少 MCP 协议代码与禅道业务代码的耦合。

```text
MCP Client
    │
    │ JSON-RPC / stdio
    ▼
MCP Server
    │
    │ tools/call
    ▼
Tool Handler
    │
    │ 依赖注入
    ▼
ZentaoClient
    │
    │ HTTP / Cookie
    ▼
ZenTao 11.5.1
```

### 主要模块职责

**index.ts**

负责创建禅道客户端、注入依赖及启动 MCP Server。

**server.ts**

负责 MCP Server 初始化和工具注册。

**tools/bug.ts**

负责定义 Bug 工具名称、描述、参数 Schema，以及将业务数据转换成 MCP Tool Result。

**client/zentao.ts**

负责向禅道发送 HTTP 请求、携带认证信息、解析接口响应。

**client/types.ts**

定义禅道接口相关的 TypeScript 类型。

### 为什么使用依赖注入？

由程序入口统一创建 `ZentaoClient`，再传递给 MCP Server 和工具注册函数，避免每次工具调用时重复创建客户端。

这种设计有利于：

- 统一管理认证状态
- 在不同 MCP 工具间复用客户端
- 减少模块之间的直接依赖
- 后续引入 Mock Client 进行单元测试
- 支持 Session 自动续期

## 📡 禅道接口兼容性

当前项目主要适配禅道 11.5.1 的旧版 JSON 页面接口，例如：

```http
GET /zentao/my-bug.json
```

该版本接口的响应具有以下特点：

1. HTTP `Content-Type` 可能为 `text/html`，但响应体实际是 JSON。
2. 响应的 `data` 字段可能是 JSON 字符串，需要二次解析。
3. 默认列表接口具有分页限制。
4. 未登录时可能返回 HTML 登录页面。

因此，本项目按照实际响应内容进行解析，而不是只依赖 HTTP `Content-Type` 判断数据格式。

尚未验证其他禅道版本的兼容性。

## 🔒 安全说明

本项目主要用于授权的内部开发环境。

- 不应向未授权服务暴露企业内部 Bug 数据。
- 不应将登录 Cookie、Session、密码和 Token 提交到仓库。
- 不应在 MCP 工具结果中返回测试账号密码等敏感凭据。
- MCP 服务默认应优先提供只读工具。
- 在使用云端 AI 编程工具之前，应确认符合企业数据安全要求。

## 🗺 后续开发路线

**阶段一：基础 MCP 服务（已完成）**

实现 MCP Server、stdio 通信、Ping 工具和 Inspector 调试。

**阶段二：禅道 Bug 查询（进行中）**

实现列表查询、详情查询、分页和结构化数据返回。

**阶段三：富文本和附件**

提取重现步骤中的图片引用，并实现经过认证的图片下载与读取。

**阶段四：认证和工程化**

完善自动登录、会话续期、异常处理、数据脱敏、单元测试。

**阶段五：AI 编程工具集成**

在企业允许的数据处理范围内，接入 Codex，实现 Bug 查询、代码定位、修复方案生成和验证。

## 📄 License

暂未指定开源许可证。项目中的企业内部地址、账号、Bug 数据和业务信息不属于公开示例内容。