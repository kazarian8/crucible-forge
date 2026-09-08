const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function load(file, mocks={}) {const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>mocks[n]??require(n),Buffer,AbortSignal,process,fetch:(...args)=>global.fetch(...args)});return exports;}
const lib=load('lib/star/mastering-report.ts');
const signal=(values)=>({length:values.length,numberOfChannels:1,sampleRate:48000,duration:values.length/48000,getChannelData:()=>Float32Array.from(values)});
function report(){return {version:1,title:'Track <script>alert(1)</script>',beforeHash:'a'.repeat(64),afterHash:'b'.repeat(64),before:lib.measureSignal(signal([0,.5,-.5,1])),after:lib.measureSignal(signal([0,.25,-.25,.5]))};}
test('all-sample measurements identify peak, RMS, silence and near-full-scale samples',()=>{const r=report().before;assert.equal(r.peakDb,0);assert.equal(r.clippingCount,1);assert.equal(r.silencePercent,25);assert.ok(Math.abs(r.rmsDb-20*Math.log10(Math.sqrt(.375)))<1e-9);});
test('halving amplitude reduces peak and RMS by 6.02 dB without claiming improvement',()=>{const r=report();assert.ok(Math.abs(r.after.peakDb-r.before.peakDb+6.0206)<.0001);assert.ok(Math.abs(r.after.crestDb-r.before.crestDb)<1e-9);assert.ok(lib.explainMastering(r)[0].includes('fell'));});
test('silence remains finite and malformed reports are rejected',()=>{assert.ok(Number.isFinite(lib.measureSignal(signal([0,0])).rmsDb));assert.equal(lib.validReport(report()),true);const r=report();r.after.wave[0]=NaN;assert.equal(lib.validReport(r),false);assert.equal(lib.validReport(null),false);});
test('email escapes user filenames',()=>{assert.ok(!lib.reportEmailHtml(report()).includes('<script>'));assert.ok(lib.reportEmailHtml(report()).includes('&lt;script&gt;'));});
const png=Buffer.from([137,80,78,71,13,10,26,10]).toString('base64');
const originalFetch=global.fetch;
function route(access){return load('app/api/star/mastering-report/route.ts',{'next/server':{NextResponse:{json:(body,options)=>({body,status:options.status})}},'../../../../lib/auth/provider-access':{authorizePaidProvider:async()=>access},'../../../../lib/star/mastering-report':lib});}
const access={user:{id:'uploader',email:'uploader@example.com',email_confirmed_at:'2026-09-08'}};
function req(extra={}){return new Request('https://example.com/api/star/mastering-report',{method:'POST',body:JSON.stringify({uploaderId:'uploader',report:report(),beforeImage:png,afterImage:png,...extra})});}
test('email always uses verified uploader and includes both attachments',async()=>{process.env.RESEND_API_KEY='test';process.env.CRUCIBLE_REPORT_EMAIL_FROM='reports@example.com';let sent;global.fetch=async(url,options)=>{sent=JSON.parse(options.body);return {ok:true,json:async()=>({id:'message-123'})};};try{const result=await route(access).POST(req({to:'attacker@example.com'}));assert.equal(result.status,200);assert.equal(sent.to[0],'uploader@example.com');assert.equal(sent.attachments.length,2);assert.equal(result.body.status,'accepted');}finally{global.fetch=originalFetch;}});
test('account switch and authentication failure cannot send email',async()=>{const mismatch=await route(access).POST(req({uploaderId:'different-account'}));assert.equal(mismatch.status,403);const blocked=await route({response:{status:401}}).POST(req());assert.equal(blocked.status,401);});
test('provider rejection is never reported as successful delivery',async()=>{global.fetch=async()=>({ok:false,json:async()=>({error:'bad sender'})});try{assert.equal((await route(access).POST(req())).status,502);}finally{global.fetch=originalFetch;}});
test('missing sender configuration reports a real blocker',async()=>{delete process.env.CRUCIBLE_REPORT_EMAIL_FROM;assert.equal((await route(access).POST(req())).status,503);});
