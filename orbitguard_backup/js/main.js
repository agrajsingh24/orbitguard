const W = 640;
const H = 480;
const FRAME_MIN_DT = 0.045;
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);

  const dt = (now - last) / 1000;
  if (dt < FRAME_MIN_DT) return;
  last = now;

  if (now - fT > 1000) {
    fps = fc;
    fc = 0;
    fT = now;
    $("pFps").textContent = fps + " FPS";
  }
  fc++;
  if (running) {
    $("pTim").textContent = new Date(el() * 1000).toISOString().slice(14, 19);
  }

  let src = null;
  if (mode === "sim") {
    simUpdate(dt);
    simDraw();
    src = simC;
  } else if (mode === "cam" && vid.readyState >= 2) {
    src = vid;
  }
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, W, H);

  if (!src) {
    ctx.fillStyle = "#7f8fae";
    ctx.font = "16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No feed — press “Start Camera” or run a Demo", W / 2, H / 2);
    return;
  }
ctx.save();
ctx.translate(W / 2, H / 2);
ctx.rotate((rot * Math.PI) / 180);

if (rot % 180) ctx.scale(0.75, 0.75);

ctx.drawImage(src, -W / 2, -H / 2, W, H);
ctx.restore();

sx.drawImage(cv, 0, 0, 160, 120);
detect(dt);
overlay();
chips();
ctx.save();

ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#00a6ff";
ctx.font = "bold 22px 'IBM Plex Sans', sans-serif";
ctx.fillText("LIVE PAYLOAD FEED", W / 2, H / 2 - 15);

ctx.fillStyle = "#ffffff";
ctx.font = "14px 'IBM Plex Sans', sans-serif";
ctx.fillText("RACK-ANCHORED ZONES", W / 2, H / 2 + 15);

ctx.restore();
sx.drawImage(cv, 0, 0, 160, 120);
}
$("sens").oninput = (e) => Net.build(e.target.value / 100);
renderSteps();
requestAnimationFrame(frame);