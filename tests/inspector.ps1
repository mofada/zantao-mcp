
# MCP Inspector 启动脚本
# 设置允许访问 Inspector 的本地来源
$env:ALLOWED_ORIGINS = "http://127.0.0.1,http://127.0.0.1:6274"

# 切换到项目根目录
Set-Location (Join-Path $PSScriptRoot "..")

# 启动 MCP Inspector，使用 pnpm dev 运行服务
pnpm dlx @modelcontextprotocol/inspector pnpm dev
