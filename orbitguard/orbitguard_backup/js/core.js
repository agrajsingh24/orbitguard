const $=id=>document.getElementById(id),cv=$('cv'),ctx=cv.getContext('2d'),sm=document.createElement('canvas');sm.width=160;sm.height=120;const sx=sm.getContext('2d',{willReadFrequently:true});
const vid=document.createElement('video');vid.muted=true;vid.playsInline=true;
const simC=document.createElement('canvas');simC.width=640;simC.height=480;const sc=simC.getContext('2d');
const ZONES={R:{x:.3,y:.05,w:.4,h:.5,c:'#38bdf8',n:'RACK'},A:{x:.02,y:.58,w:.28,h:.4,c:'#34d399',n:'TRAY A'},B:{x:.7,y:.58,w:.28,h:.4,c:'#fbbf24',n:'TRAY B'}};
const STEPS=[{ev:'init',n:'Load: red & yellow boxes seated in rack'},{ev:'red:pick',n:'Pick up the RED box'},{ev:'red:place:A',n:'Place RED box in Tray A'},{ev:'yellow:pick',n:'Pick up the YELLOW box'},{ev:'yellow:place:B',n:'Place YELLOW box in Tray B'},{ev:'verify',n:'Verify: both boxes stable, workspace clear'}];
let mode=null,rot=0,muted=false,running=false,t0=0,cur=0,st=[],events=[],simId=0,calMode=null,rec=null,chunks=[],ws=null,fps=0,fc=0,fT=performance.now(),banT=0;
const mk=()=>({vis:false,cx:.5,cy:.5,px:.5,py:.5,anchor:null,still:0,away:0,n:0,seen:false});const OB={red:mk(),yellow:mk()};
const hd=(a,b)=>{const d=Math.abs(a-b);return Math.min(d,360-d)};
function hsv(r,g,b){r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0;if(d){h=M==r?((g-b)/d)%6:M==g?(b-r)/d+2:(r-g)/d+4;h*=60;if(h<0)h+=360}return[h,M?d/M:0,M]}
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',3500)}
function say(t){if(muted||!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);speechSynthesis.speak(u)}
const el=()=>+((performance.now()-t0)/1000).toFixed(2);
function log(type,msg){const e={ts:new Date().toISOString(),elapsed_s:running?el():0,type,message:msg};events.push(e);const d=document.createElement('div');d.className=type;d.textContent=`[${e.ts.slice(11,19)}] ${msg}`;$('log').appendChild(d);$('log').scrollTop=1e9;if(ws&&ws.readyState==1)try{ws.send(JSON.stringify(e))}catch(_){}}
function alertUser(msg){log('alert',msg);const b=$('banner');b.textContent='⚠ '+msg;b.style.display='block';clearTimeout(banT);banT=setTimeout(()=>b.style.display='none',5000)}
function renderSteps(){$('steps').innerHTML=STEPS.map((s,i)=>{const x=st[i]||{status:'pending'};const c=x.status=='done'?'done':x.status=='skipped'?'skipped':x.status=='late'?'late':'';const ic={done:'✓',skipped:'✕',late:'!',pending:i+1}[x.status]||i+1;return`<li class="${c} ${running&&i==cur?'active':''}"><span class="ic">${ic}</span><div>${s.n}<small>${x.time!=null?x.status.toUpperCase()+' @ '+x.time+'s':running&&i==cur?'AWAITING…':'pending'}</small></div></li>`}).join('');
$('nxt').textContent=!running?'Start a session':cur>=STEPS.length?'Experiment complete ✔':STEPS[cur].n}
function handle(k){if(!running)return;const i=STEPS.findIndex(s=>s.ev==k);
if(i<0){alertUser(`Unexpected action: ${k.replace(/:/g,' ')} — not part of protocol`);say('Warning. Unexpected action.');return}
if(i==cur){st[i]={status:'done',time:el()};log('ok',`Step ${i+1} DONE: ${STEPS[i].n}`);cur++;const nx=cur<STEPS.length?`Next: ${STEPS[cur].n}`:'Experiment complete.';say(`Step ${i+1} confirmed. ${nx}`);if(cur>=STEPS.length)log('ok','SEQUENCE COMPLETE')}
else if(i>cur){const sk=[];for(let j=cur;j<i;j++){st[j]={status:'skipped',time:el()};sk.push(j+1)}alertUser(`Step ${sk.join(', ')} skipped! Detected step ${i+1} instead`);say(`Alert. Step ${sk.join(' and ')} skipped.`);st[i]={status:'done',time:el()};log('ok',`Step ${i+1} done (after skip)`);cur=i+1}
else{alertUser(`Out of sequence: "${STEPS[i].n}" repeated after step ${cur}`);say('Alert. Out of sequence action.');if(st[i]&&st[i].status=='skipped')st[i]={status:'late',time:el()}}
renderSteps()}
function zoneOf(x,y){for(const k in ZONES){const z=ZONES[k];if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h)return k}return null}
function track(name,S,dt){const o=OB[name];o.n=S.n;o.vis=S.n>=22;o.px=o.cx;o.py=o.cy;
if(o.vis){o.cx+=(S.x/S.n/160-o.cx)*.5;o.cy+=(S.y/S.n/120-o.cy)*.5}
const sp=o.vis?Math.hypot(o.cx-o.px,o.cy-o.py)/dt:9,z=o.vis?zoneOf(o.cx,o.cy):null,mv=!o.vis||sp>.15;o.zone=z;
if(o.anchor&&(mv||z!==o.anchor)){o.still=0;o.away+=dt}else if(!mv){o.still+=dt;o.away=0}else{o.still=0}
if(o.anchor&&o.away>.6){log('info',`${name.toUpperCase()} box picked (hand–object interaction)`);o.prev=o.anchor;o.anchor=null;handle(name+':pick')}
if(!o.anchor&&o.vis&&o.still>=1&&z){o.anchor=z;if(o.seen){log('info',`${name.toUpperCase()} box placed in zone ${z}`);handle(`${name}:place:${z}`)}o.seen=true}}
function detect(dt){const d=sx.getImageData(0,0,160,120).data,S={red:{n:0,x:0,y:0},yellow:{n:0,x:0,y:0}};
for(let i=0,p=0;i<d.length;i+=4,p++){const c=Net.classify(d[i],d[i+1],d[i+2]);if(c){const q=c==1?S.red:S.yellow;q.n++;q.x+=p%160;q.y+=(p/160)|0}}
track('red',S.red,dt);track('yellow',S.yellow,dt);
if(running&&!st[0]&&OB.red.anchor=='R'&&OB.yellow.anchor=='R'&&cur==0)handle('init');
if(running&&cur<STEPS.length&&STEPS[cur].ev=='verify'&&OB.red.anchor=='A'&&OB.yellow.anchor=='B'&&OB.red.still>2&&OB.yellow.still>2)handle('verify')}
function overlay(){ctx.font='bold 12px system-ui';for(const k in ZONES){const z=ZONES[k];ctx.strokeStyle=z.c;ctx.setLineDash([6,4]);ctx.lineWidth=2;ctx.strokeRect(z.x*640,z.y*480,z.w*640,z.h*480);ctx.fillStyle=z.c;ctx.fillText(z.n,z.x*640+6,z.y*480+16)}ctx.setLineDash([]);
for(const k in OB){const o=OB[k];if(!o.vis)continue;const c=k=='red'?'#f43f5e':'#fbbf24',x=o.cx*640,y=o.cy*480;ctx.strokeStyle=c;ctx.lineWidth=3;ctx.strokeRect(x-42,y-42,84,84);ctx.fillStyle=c;ctx.fillText(`${k.toUpperCase()} · ${o.zone||'—'} · ${o.anchor?'STABLE':'MOVING'}`,x-42,y-48)}
ctx.fillStyle='#fff';ctx.fillText(new Date().toISOString().slice(0,19).replace('T',' ')+' UTC',8,472)}
$('chips').innerHTML='';
function chips(){$('chips').innerHTML=['red','yellow'].map(k=>{const o=OB[k];return`<span class="chip">${k.toUpperCase()}: ${o.vis?'tracked':'not visible'} · zone ${o.anchor||o.zone||'—'} · ${o.anchor?'stable':'in motion'}</span>`}).join('')+`<span class="chip">Next: ${running&&cur<STEPS.length?STEPS[cur].n:'—'}</span>`}
