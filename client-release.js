(() => {
'use strict';
const release=document.querySelector('meta[name="silicondoctor-ui-release"]')?.content;
const frame=document.querySelector('#panelAiDoc iframe');
let childStatus=null,banner,checking=false;
addEventListener('message',event=>{
  if(event.source!==frame?.contentWindow||event.origin!=='https://web-production-09bf5.up.railway.app'||event.data?.type!=='SILICONDOCTOR_UI_STATUS_V1')return;
  childStatus={busy:event.data.busy===true,unsaved:event.data.unsavedEdits===true,time:Date.now()};
});
async function check(){
  if(checking||document.hidden)return;checking=true;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try{
    const response=await fetch('/ui-release.json?check='+Date.now(),{cache:'no-store',signal:controller.signal});
    if(!response.ok)return;const data=await response.json();
    if(!data.release||data.release===release||banner)return;
    banner=document.createElement('div');banner.id='website-release-notice';banner.setAttribute('role','status');banner.style.cssText='position:fixed;top:4px;right:6px;z-index:99999;max-width:calc(100vw - 12px);padding:8px;border:1px solid #78b6a5;border-radius:7px;background:#183b31;color:white;font:12px system-ui';
    const text=document.createElement('span');text.textContent='Website update available. ';
    const button=document.createElement('button');button.type='button';button.textContent='Update';button.style.cssText='min-height:32px;background:#24594b;color:white;border:1px solid #78b6a5;border-radius:5px';
    button.onclick=()=>{
      if(document.body.classList.contains('aidoc-active')&&(!childStatus||Date.now()-childStatus.time>8000||childStatus.busy||childStatus.unsaved)){
        text.textContent='Finish the current operation and save edits before updating. ';return;
      }
      // Calculator data uses its existing autosave; APP_VERSION is unchanged.
      const url=new URL(location.href);url.searchParams.set('ui',Date.now());location.replace(url.href);
    };
    banner.append(text,button);document.body.append(banner);
  }catch{/* Release checks must never interfere with interviews or calculator work. */}finally{clearTimeout(timer);checking=false;}
}
addEventListener('pageshow',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
setInterval(check,60000);void check();
})();
