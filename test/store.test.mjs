import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMomentStore,PublishError} from '../src/store.mjs';
test('publish preserves exact text, idempotency, list, and limits',async()=>{const dir=await mkdtemp(join(tmpdir(),'moment-test-'));try{const store=createMomentStore(join(dir,'data.jsonl'));const content='  想法\n第二行  ';const a=await store.publish(content,'key1');assert.equal(a.moment.content,content);const b=await store.publish(content,'key1');assert.equal(b.replayed,true);assert.equal(a.moment.id,b.moment.id);await assert.rejects(store.publish('other','key1'),e=>e instanceof PublishError && e.status===409);await Promise.all(Array.from({length:10},(_,i)=>store.publish('entry '+i)));assert.equal((await store.list()).length,11);await assert.rejects(store.publish(' '),PublishError);await assert.rejects(store.publish('x'.repeat(5001)),PublishError);}finally{await rm(dir,{recursive:true,force:true});}});
