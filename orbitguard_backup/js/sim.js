/* ---------- simulator (synthetic dataset generator / demo) ---------- */
const sim={red:{x:.42,y:.3},yel:{x:.58,y:.3},hand:null,cur:null};
function tween(key,x,y,d){return new Promise(r=>{sim.cur={key,x0:key=='none'?0:sim[key].x,y0:key=='none'?0:sim[key].y,x,y,d,t:0,r}})}
function simUpdate(dt){const c=sim.cur;if(!c)return;c.t+=dt;let f=Math.min(1,c.t/c.d);f=f*f*(3-2*f);if(c.key!='none'){const o=sim[c.key];o.x=c.x0+(c.x-c.x0)*f;o.y=c.y0+(c.y-c.y0)*f;sim.hand=c.t<c.d?{x:o.x,y:o.y}:null}if(c.t>=c.d){sim.hand=null;sim.cur=null;c.r()}}
function simDraw(){sc.fillStyle='#262e40';sc.fillRect(0,0,640,480);sc.strokeStyle='#33405c';for(let i=0;i<640;i+=40){sc.beginPath();sc.moveTo(i,0);sc.lineTo(i,480);sc.stroke()}
[[sim.red,'#e0202a'],[sim.yel,'#f2c40f']].forEach(([o,c])=>{sc.fillStyle=c;sc.fillRect(o.x*640-35,o.y*480-35,70,70)});
if(sim.hand){sc.fillStyle='#c68a63';sc.beginPath();sc.arc(sim.hand.x*640+30,sim.hand.y*480+30,24,0,7);sc.fill()}}
async function runSim(kind){const id=++simId;stopCam();Object.assign(sim.red,{x:.42,y:.3});Object.assign(sim.yel,{x:.58,y:.3});sim.cur=null;sim.hand=null;mode='sim';setCam('SIMULATOR');resetObs();startSession();
await tween('none',0,0,3);if(id!=simId)return;
const ord=kind=='good'?[['red',.15,.78],['yel',.85,.78]]:[['yel',.85,.78],['red',.15,.78]];
for(const[k,x,y]of ord){await tween(k,x,y,1.5);if(id!=simId)return;await tween('none',0,0,2.5);if(id!=simId)return}
await tween('none',0,0,2);if(id==simId&&running)toast('Demo finished — export the log')}
function resetObs(){for(const k in OB)Object.assign(OB[k],mk())}
