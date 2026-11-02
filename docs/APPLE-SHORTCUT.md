# Apple 快捷指令：语音一键发碎碎念

1. 自建服务使用 HTTPS 域名，并生成独立 MOMENTS_API_TOKEN。
2. iPhone 打开「快捷指令」，新建「碎碎念」。
3. 添加「听写文本」（也可以改成「询问输入」）。
4. 添加「获取 URL 内容」：URL 为 https://你的域名/api/v1/moments；方法 POST；请求标头 Authorization 为 Bearer 你的Token，Content-Type 为 application/json；正文选 JSON，字段 content 连接「听写文本」变量。
5. 添加「获取词典值」，取接口响应 ok；为 true 显示「碎碎念发布成功」通知，为 false 则显示 error。
6. iPhone 设置 → 辅助功能 → 触控 → 轻点背面 → 轻点两下或三下 → 选择「碎碎念」。也可以加入 Siri 或主屏幕。

安全：不要公开带真实 Token 的快捷指令。Token 泄露后应立即轮换。建议使用 iOS 私有快捷指令，不要分享运行中的凭据。
