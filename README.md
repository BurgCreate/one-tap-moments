# One Tap Moments / 一键碎碎念

开源的个人碎碎念：**iPhone 快捷指令 + AI/MCP 一句话发布 + 命令行 + Web 时间轴**。从 LMN516 现有碎碎念发布语义提炼，独立运行，不含私有记录和主站配置。

## 安装

Node.js 20+：

```sh
git clone https://github.com/BurgCreate/one-tap-moments.git
cd one-tap-moments
npm install
cp .env.example .env
openssl rand -hex 32
```

把生成的密钥写入 .env 的 MOMENTS_API_TOKEN，然后：

```sh
set -a; . ./.env; set +a
npm start
```

在浏览器访问 http://127.0.0.1:8787/moments 。命令行快速发送：

```sh
node bin/moment.mjs send "今天的想法"
printf '原样的\n多行文字' | node bin/moment.mjs send -
```

## iPhone 一键发送

看 [Apple 快捷指令配置](docs/APPLE-SHORTCUT.md)。打开快捷指令后听写正文，一次 POST 直接发布。支持 Siri、主屏幕、背面轻点。

## ChatGPT / Claude / MCP 一句话发布

使用兼容 MCP stdio 的客户端，配置 node 启动本仓库的 mcp/stdio.mjs。环境变量：MOMENTS_API_TOKEN、MOMENTS_API_URL。示例见 [MCP 配置](docs/MCP.md)。指令：**发碎碎念：今天想记下一件事**。工具名 moment_publish，正文原样传送，不转成文章或草稿。只有服务端确认才报告成功。

## API

POST /api/v1/moments。Header: Authorization: Bearer TOKEN, Content-Type: application/json。JSON body: {"content":"正文"}。可选 Idempotency-Key，避免相同请求重试重复发布；重试同一键但内容不同返回 409。成功为 201，重放为 200，返回 moment 对象和 replayed 标志。

GET /moments 为公开时间轴，GET /health 为健康检查。文本限制 5000 字符，每个来源 IP 每分钟最多 20 次发布。纯本地 JSONL 单进程存储，默认仅监听 localhost，不依赖云数据库、Railway 或 Vercel。

## 安全与边界

**碎碎念默认对网页访客公开。** 切勿发布个人秘密。远程使用必须自己部署 HTTPS 反向代理并配置 TLS/额外限流。不要把 .env、真实 Token、个人日记或私有 LMN516 数据公开。Apple 快捷指令包含敏感 token，禁止直接分享含密钥的快捷指令。单进程适合轻量自托管，不支持多节点并发写入。当前只支持文字，不包含 LMN516 原版图片、推送及后台管理功能。

测试：npm test。License: MIT。
