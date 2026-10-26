/* Release changes are optional menu actions, never overlays or forced reloads. */
(() => {
'use strict';
const release=document.querySelector('meta[name="silicondoctor-ui-release"]')?.content;
const frame=document.querySelector('#panelAiDoc iframe'),origin='https://p01--web-preview--mc8f4fqj6c2m.code.run';
let childStatus=null,notice,checking=false,target='';
const hiddenKey='silicondoctor.host.update-dismissed';
function announce(){if(target&&document.body.classList.contains('aidoc-active'))frame?.contentWindow?.postMessage({type:'SILICONDOCTOR_HOST_UPDATE_V1',release:target},origin);}
function apply(){
 const text=notice?.querySelector('span');
 if(document.body.classList.contains('aidoc-active')&&(!childStatus||Date.now()-childStatus.time>8000||childStatus.busy||childStatus.unsaved)){
  if(text)text.textContent='Finish the current operation and save edits before updating. ';return false;
 }
 // #codeflow# Only the explicit Update action arrives here. The child saves
 // its resumable draft before asking the host to refresh. A matching manifest
 // and HTML release prevents the previous endless update/reload cycle.
 notice?.remove();notice=null;
 const url=new URL(location.href);url.searchParams.set('ui',target);url.searchParams.set('updated',Date.now());location.replace(url.href);return true;
}
addEventListener('message',event=>{
 if(event.source!==frame?.contentWindow||event.origin!==origin)return;
 if(event.data?.type==='SILICONDOCTOR_UI_STATUS_V1'){
  childStatus={busy:event.data.busy===true,unsaved:event.data.unsavedEdits===true,time:Date.now()};announce();
 }else if(event.data?.type==='SILICONDOCTOR_HOST_APPLY_UPDATE_V1')apply();
});
async function check(){
 if(checking||document.hidden)return;checking=true;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetch('/ui-release.json?check='+Date.now(),{cache:'no-store',signal:controller.signal});
  if(!response.ok)return;const data=await response.json();
  if(!data.release||data.release===release){notice?.remove();notice=null;target='';return;}
  target=data.release;announce();
  let dismissed=false;try{dismissed=sessionStorage.getItem(hiddenKey)===target;}catch{}
  if(notice||dismissed)return;
  const menu=document.querySelector('.host-tools>div');if(!menu)return;
  notice=document.createElement('section');notice.id='website-release-notice';notice.className='ui-update-notice';notice.setAttribute('aria-label','Website update');
  const text=document.createElement('span');text.textContent='Website update available. ';
  const button=document.createElement('button');button.type='button';button.textContent='Update';button.onclick=apply;
  const later=document.createElement('button');later.type='button';later.textContent='Later';later.onclick=()=>{try{sessionStorage.setItem(hiddenKey,target);}catch{}notice?.remove();notice=null;};
  notice.append(text,button,later);menu.append(notice);
 }catch{/* A release check must never interrupt clinical work. */}finally{clearTimeout(timer);checking=false;}
}
addEventListener('pageshow',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
setInterval(check,60000);void check();
})();
