#!/usr/bin/env node
import { postMoment } from "../src/client.mjs";

async function main() {
  const [command, ...parts] = process.argv.slice(2);
  if (command !== "send" || parts.length === 0) {
    console.error('用法: moment send "今天的想法"  或  printf "内容" | moment send -');
    process.exitCode = 2;
    return;
  }
  let content;
  if (parts.length === 1 && parts[0] === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    content = Buffer.concat(chunks).toString("utf8");
  } else {
    content = parts.join(" ");
  }
  if (!content.trim()) {
    console.error("碎碎念正文不能为空。");
    process.exitCode = 2;
    return;
  }
  const result = await postMoment(content);
  console.log("碎碎念发布成功: " + result.url);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
