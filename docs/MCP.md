# MCP 快捷发布

在支持 stdio MCP 的客户端配置：

```json
{"mcpServers":{"one-tap-moments":{"command":"node","args":["/absolute/path/one-tap-moments/mcp/stdio.mjs"],"env":{"MOMENTS_API_URL":"https://your-domain.example/api/v1/moments","MOMENTS_API_TOKEN":"YOUR_PRIVATE_TOKEN"}}}}
```

用户说「发碎碎念：正文」时立即调用 moment_publish，并将正文不改写传入。不要经过草稿或文章流程，也不应在发布失败时报告成功。不同客户端的 MCP 配置位置不同；配置文件不要公开真实 Token。
