import { randomInt } from "node:crypto";
import { mkdir, readFile, open } from "node:fs/promises";
import { dirname } from "node:path";

export const MAX_CONTENT_LENGTH = 5000;

export class PublishError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "PublishError";
    this.status = status;
  }
}

export function validateContent(content) {
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new PublishError("碎碎念正文不能为空。");
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new PublishError("碎碎念最多 5000 个字符。");
  }
  return content; // Preserve user text exactly, including whitespace and newlines.
}

export function createMomentStore(filePath) {
  let queue = Promise.resolve();

  async function readAll() {
    let raw;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line));
  }

  function serializePublic(item) {
    return {
      id: item.id,
      link: item.link,
      date: item.date,
      mediaId: null,
      content: item.content,
    };
  }

  async function list(limit = 100) {
    const items = await readAll();
    return items.slice(-Math.max(1, Math.min(limit, 500))).reverse().map(serializePublic);
  }

  async function publish(content, idempotencyKey) {
    const exact = validateContent(content);
    const job = queue.catch(() => {}).then(async () => {
      const items = await readAll();
      if (idempotencyKey) {
        const existing = items.find((item) => item.idempotencyKey === idempotencyKey);
        if (existing) {
          if (existing.content !== exact) {
            throw new PublishError("Idempotency-Key 已用于不同的正文。", 409);
          }
          return { moment: serializePublic(existing), replayed: true };
        }
      }

      let id;
      do {
        id = Date.now() * 1000 + randomInt(1000);
      } while (items.some((item) => item.id === id));

      const item = {
        id,
        link: "/moments#moment-" + id,
        date: new Date().toISOString(),
        content: exact,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      };

      await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
      const handle = await open(filePath, "a", 0o600);
      try {
        await handle.writeFile(JSON.stringify(item) + "\n", "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      return { moment: serializePublic(item), replayed: false };
    });
    queue = job.then(() => {}, () => {});
    return job;
  }

  return { publish, list };
}
