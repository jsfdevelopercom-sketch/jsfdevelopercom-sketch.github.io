#!/usr/bin/env node
'use strict';
// Exercises the real host CSS/JS on two loopback origins. The child is only
// a static surface; actual clinical embedding is also checked in backend CI.
const {spawn}=require('node:child_process');
const http=require('node:http'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,m)=>{if(!ok)throw Error(m)};
(async()=>{
 const browser=process.argv[2];assert(browser,'Pass Chrome executable');
 const out='target/host-layout';await fs.mkdir(out,{recursive:true});
 const listen=server=>new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port)));
 const childServer=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end('<!doctype html><meta name="viewport" content="width=device-width"><style>html,body{margin:0;background:#121d28;color:#fff}</style><p>Isolated host layout surface</p>')});
 const childOrigin=await listen(childServer);
 const source=(await fs.readFile('index.html','utf8')).replaceAll('https://web-production-09bf5.up.railway.app',childOrigin);
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(source)});
 const base=await listen(server);
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'sd-layout-'));
 const child=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 let socket,log='';child.stderr.on('data',x=>{log=(log+x).slice(-3000)});
 const receipt=[];
 try{
  let port;for(let i=0;i<150;i++){try{port=Number((await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);break}catch{await pause(100)}}
  assert(port,'Chrome did not start: '+log);
  const page=(await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json())).find(p=>p.type==='page');
  socket=new WebSocket(page.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
  let id=0;const pending=new Map(),contexts=new Map();
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.executionContextCreated'&&m.params.context.auxData?.isDefault)contexts.set(m.params.context.auxData.frameId,m.params.context.id);if(m.method==='Runtime.executionContextsCleared')contexts.clear();const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const k=++id;pending.set(k,{resolve,reject});socket.send(JSON.stringify({id:k,method,params}))});
  const evaluate=async(expression,contextId)=>{const r=await call('Runtime.evaluate',{expression,contextId,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails,'Browser evaluation: '+JSON.stringify(r.exceptionDetails));return r.result.value};
  await call('Page.enable');await call('Runtime.enable');
  const viewport=async(w,h)=>{await call('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});await pause(200)};
  const navigate=async(url)=>{await call('Page.navigate',{url});for(let i=0;i<100;i++){await pause(100);if(await evaluate('document.readyState==="complete"'))break}await pause(600)};
  const shot=async(name)=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(out,name+'.png'),Buffer.from(r.data,'base64'))};
  const geometry=async(expression,context)=>evaluate(`(()=>{const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}};return {width:innerWidth,height:innerHeight,scroll:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),${expression}}})()`,context);

  await call('Network.enable');await call('Network.setBlockedURLs',{urls:['https://*']});
  await viewport(369,906);await navigate(base);
  await evaluate('document.querySelector("#age").value="57";AI_DOC_UNLOCKED=true;document.querySelector("#mainTabAiDoc").click()');await pause(600);
  for(const [w,h] of [[320,568],[369,906],[390,844],[844,390],[1280,820],[1920,1080]]){
   await viewport(w,h);await pause(300);
   const g=await geometry('header:rect(".masthead"),frame:rect("#panelAiDoc iframe"),tab:rect("#mainTabAiDoc")');
   assert(g.header.h<=46,'Host masthead oversized '+JSON.stringify(g));assert(await evaluate('getComputedStyle(document.querySelector(".tiny-footer")).display==="none"'),'Host footer consumes clinical viewport');
   assert(Math.abs(g.frame.w-w)<=1&&Math.abs(g.frame.b-h)<=2,'Host does not fill remaining viewport '+JSON.stringify(g));
   receipt.push({viewport:[w,h],...g});await shot('host-'+w+'x'+h);
  }
  await evaluate('setMainTab("help")');assert(await evaluate('getComputedStyle(document.querySelector("#panelHelp")).display!=="none"'),'Help tab failed');
  await evaluate('setMainTab("form")');assert(await evaluate('document.querySelector("#age").value==="57"'),'Tab switch lost calculator draft');
  assert(await evaluate('ptsNa(140)===0 && ptsNa(180)===4 && ptsK(4)===0 && ptsK(7)===4'),'Calculator scoring smoke failed');
  await viewport(369,906);await evaluate('setMainTab("aidoc")');await pause(300);
  await evaluate('Object.defineProperty(visualViewport,"height",{configurable:true,get:()=>446});visualViewport.dispatchEvent(new Event("resize"))');await pause(300);
  const k=await geometry('frame:rect("#panelAiDoc iframe"),overlay:document.body.classList.contains("aidoc-keyboard-overlay")');
  assert(k.overlay&&Math.abs(k.frame.h-446)<=2,'Host keyboard overlay clipped');receipt.push({view:'keyboard',...k});
  await fs.writeFile(path.join(out,'host-layout.json'),JSON.stringify({status:'PASS',checks:receipt},null,2)+'\n');
  console.log(JSON.stringify({status:'PASS',viewports:receipt.length,calculatorDraft:'preserved',calculatorScoring:'PASS'}));
 }finally{socket?.close();child.kill('SIGTERM');await pause(300);if(child.exitCode===null)child.kill('SIGKILL');await fs.rm(profile,{recursive:true,force:true});server.close();childServer.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
