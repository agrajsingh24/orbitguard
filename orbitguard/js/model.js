/* ColorNet inference: 4-12-3 MLP (trained in train/train_colornet.py). Evaluated once into a lookup table -> fast per-pixel classification. */
const Net=(()=>{const M=window.COLORNET,HQ=72,SQ=8,VQ=8,lut=new Uint8Array(HQ*SQ*VQ);
function fwd(h,s,v){const r=h*Math.PI/180,x=[Math.sin(r),Math.cos(r),s,v],hid=M.b1.map((b,j)=>{let a=b;for(let i=0;i<4;i++)a+=x[i]*M.W1[i][j];return a>0?a:0});
const o=M.b2.map((b,k)=>{let a=b;for(let j=0;j<hid.length;j++)a+=hid[j]*M.W2[j][k];return a}),mx=Math.max(...o),e=o.map(z=>Math.exp(z-mx)),t=e.reduce((a,b)=>a+b);return e.map(z=>z/t)}
function build(thr){for(let hq=0;hq<HQ;hq++)for(let sq=0;sq<SQ;sq++)for(let vq=0;vq<VQ;vq++){const p=fwd((hq+.5)*360/HQ,(sq+.5)/SQ,(vq+.5)/VQ);let c=p.indexOf(Math.max(...p));if(p[c]<thr)c=0;lut[(hq*SQ+sq)*VQ+vq]=c}}
build(.7);
return{build,info:M.name+' · '+(JSON.stringify(M).length/1024).toFixed(1)+' KB',classify(r,g,b){const q=hsv(r,g,b);return lut[(Math.min(HQ-1,q[0]/360*HQ|0)*SQ+Math.min(SQ-1,q[1]*SQ|0))*VQ+Math.min(VQ-1,q[2]*VQ|0)]}}})();
