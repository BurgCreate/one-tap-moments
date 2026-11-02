import { randomUUID } from "node:crypto";

export function getEndpoint() {
  const endpoint = process.env.MOMENTS_API_URL || "http://127.0.0.1:8787/api/v1/moments";
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("MOMENTS_API_URL 必须是有效的 URL。");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    if (process.env.MOMENTS_ALLOW_HTTP !== "1" || url.protocol !== "http:") {
      throw new Error("远程发布必须使用 HTTPS（测试 HTTP 需显式设置 MOMENTS_ALLOW_HTTP=1）。");
    }
  }
  if (url.username || url.password) throw new Error("发布 URL 不能包含凭据。");
  return url;
}

export async function postMoment(content, idempotencyKey = randomUUID()) {
  const token = process.env.MOMENTS_API_TOKEN;
  if (!token) throw new Error("请设置 MOMENTS_API_TOKEN，勿将令牌写进代码。");
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ content }),
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    throw new Error("发布失败（HTTP " + response.status + "）：" + (payload.error || "服务未返回有效响应"));
  }
  return { ...payload, url: new URL(payload.moment.link, endpoint).toString() };
}
