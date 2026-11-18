/* #codeflow# Static public addresses embed the existing clinical tool owner;
 * exact-origin/window checks permit navigation messages, never arbitrary frames. */
(()=>{'use strict';
 document.documentElement.lang='en';
 const origin='https://p01--web-preview--mc8f4fqj6c2m.code.run';
 const path=location.pathname.replace(/\/$/,'');
 if(!/^\/tools(?:\/[a-z0-9-]+)?$/.test(path))return;
 const frame=document.createElement('iframe');frame.src=origin+path;frame.title=document.title;
 document.getElementById('tool-page').append(frame);
 frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'SILICONDOCTOR_HOST_READY_V1'},origin));
 window.addEventListener('message',event=>{
  if(event.source!==frame.contentWindow||event.origin!==origin||event.data?.type!=='SILICONDOCTOR_TOOL_ROUTE_V1'||!/^\/tools(?:\/[a-z0-9-]+)?$/.test(event.data.path))return;
  history.replaceState(null,'',event.data.path);
 });
})();
