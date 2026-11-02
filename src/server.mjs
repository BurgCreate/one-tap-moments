import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { createMomentStore, PublishError } from "./store.mjs";
const token = process.env.MOMENTS_API_TOKEN;
if (!token || token.length < 24) { console.error("Set MOMENTS_API_TOKEN (24+ random characters)"); process.exit(1); }
const store = createMomentStore(resolve(process.env.MOMENTS_DATA_FILE || "./data/moments.jsonl"));
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";
const limits = new Map();
function json(res, code, body) { res.writeHead(code, {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}); res.end(JSON.stringify(body)); }
function authorized(value) { const m = /^Bearer (.+)$/.exec(value || ""); if (!m) return false; const a = Buffer.from(m[1]), b = Buffer.from(token); return a.length === b.length && timingSafeEqual(a,b); }
function escape(s) { return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
const server = createServer(async (req,res) => {
 try {
  const path = new URL(req.url,"http://localhost").pathname;
  if (req.method === "GET" && path === "/health") return json(res,200,{ok:true});
  if (req.method === "GET" && ["/","/moments"].includes(path)) {
   const items = await store.list(200);
   const cards = items.map(m => '<article id="moment-'+m.id+'"><time>'+escape(m.date)+'</time><p>'+escape(m.content)+'</p></article>').join("");
   res.writeHead(200,{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'","X-Content-Type-Options":"nosniff"});
   return res.end('<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>碎碎念</title><style>body{font:16px/1.7 system-ui;max-width:680px;margin:3rem auto;padding:0 1rem}article{padding:1rem 0;border-bottom:1px solid #ddd}time{color:#777}p{white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>碎碎念</h1>'+cards+'</html>');
  }
  if (path !== "/api/v1/moments") return json(res,404,{ok:false,error:"Not found"});
  if (req.method !== "POST") return json(res,405,{ok:false,error:"Method not allowed"});
  if (!authorized(req.headers.authorization)) return json(res,401,{ok:false,error:"Unauthorized"});
  const ip = req.socket.remoteAddress || "unknown", now = Date.now();
  let limit = limits.get(ip); if (!limit || now > limit.until) limit={count:0,until:now+60000};
  limit.count++; limits.set(ip,limit);
  if (limit.count>20) return json(res,429,{ok:false,error:"Rate limit exceeded"});
  let raw="";
  for await (const chunk of req) { raw+=chunk; if (Buffer.byteLength(raw)>20000) throw new PublishError("Too large",413); }
  let body; try {body=JSON.parse(raw);} catch {throw new PublishError("JSON required");}
  const key=req.headers["idempotency-key"];
  if (key && (typeof key!=="string" || key.length>160)) throw new PublishError("Invalid Idempotency-Key");
  const result=await store.publish(body.content,key);
  return json(res,result.replayed?200:201,{ok:true,message:"碎碎念发布成功",...result});
 } catch (e) {if(e instanceof PublishError)return json(res,e.status,{ok:false,error:e.message}); console.error(e);return json(res,500,{ok:false,error:"Internal server error"});}
});
server.listen(port,host,()=>console.log("Listening on "+host+":"+port));
