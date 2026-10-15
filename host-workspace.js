/* Presentation only. Existing calculator and Sheet functions own all clinical values and saves. */
(() => {
'use strict';
document.querySelector('.host-brand').addEventListener('click',event=>{event.preventDefault();document.getElementById('mainTabAiDoc').click();});
const steps=[...document.querySelectorAll('[data-calculator-step]')];
const stages=[...document.querySelectorAll('[data-calculator-stage]')];
let current=0;
function show(index,focus=false){
 current=Math.max(0,Math.min(stages.length-1,index));
 stages.forEach((stage,i)=>{stage.hidden=i!==current;});
 steps.forEach((button,i)=>{button.setAttribute('aria-current',i===current?'step':'false');});
 document.getElementById('calculatorBack').disabled=current===0;
 document.getElementById('calculatorNext').hidden=current===stages.length-1;
 document.getElementById('calculatorProgress').textContent=`Step ${current+1} of ${stages.length}`;
 if(focus){const legend=stages[current].querySelector('legend');legend.tabIndex=-1;legend.focus();}
}
steps.forEach((button,i)=>button.addEventListener('click',()=>show(i,true)));
document.getElementById('calculatorBack').addEventListener('click',()=>show(current-1,true));
document.getElementById('calculatorNext').addEventListener('click',()=>show(current+1,true));
for(const button of document.querySelectorAll('[data-maintab]'))button.addEventListener('click',()=>{
 document.querySelector('.host-tools').open=false;
 document.querySelectorAll('[data-maintab]').forEach(b=>b.setAttribute('aria-current',b===button?'page':'false'));
});
const panel=document.getElementById('devPanel');let returnFocus;
new MutationObserver(()=>{
 const open=panel.getAttribute('aria-hidden')==='false';
 document.getElementById('mainWorkspace').inert=open;
 document.querySelector('.masthead').inert=open;
 if(open){returnFocus=document.activeElement;panel.querySelector('button,input')?.focus();}
 else if(returnFocus?.isConnected){returnFocus.focus();returnFocus=null;}
}).observe(panel,{attributes:true,attributeFilter:['aria-hidden']});
panel.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const items=[...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href],textarea,select')].filter(e=>e.getClientRects().length);
 const first=items[0],last=items.at(-1);
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
});
for(const tab of document.querySelectorAll('.tab-bar .tab')){tab.setAttribute('role','tab');tab.setAttribute('aria-controls','tab-'+tab.dataset.tab);tab.setAttribute('aria-selected',String(tab.classList.contains('active')));tab.addEventListener('click',()=>document.querySelectorAll('.tab-bar .tab').forEach(t=>t.setAttribute('aria-selected',String(t===tab))));}
show(0);
})();
