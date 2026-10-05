
function setCam(t) {
  $("pCam").textContent = "CAMERA: " + t;
  $("pCam").className = "pill on";
}
function stopCam() {
  if (vid.srcObject) {
    vid.srcObject.getTracks().forEach((t) => t.stop());
    vid.srcObject = null;
  }
}
$("bCam").onclick = async () => {
  try {
    simId++;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (window.location.protocol === 'file:') {
        toast("Camera blocked on file:// — Run run.bat (http://localhost:8000) or use Demo");
      } else {
        toast("Camera API unavailable in this browser — use Demo mode");
      }
      return;
    }
    const s = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    });
    vid.srcObject = s;
    await vid.play();
    mode = "cam";
    resetObs();
    setCam("LIVE");
  } catch (e) {
    if (window.location.protocol === 'file:') {
      toast("Camera blocked on file:// — Run run.bat (http://localhost:8000) or use Demo");
    } else {
      toast("Camera unavailable (" + e.message + ") — use Demo mode");
    }
  }
};
$("bSimG").onclick = () => runSim("good");
$("bSimB").onclick = () => runSim("bad");
$("rot").onchange = (e) => {
  rot = +e.target.value;
  resetObs();
  toast("Feed re-aligned to rack frame");
};
function startSession() {
  events = [];
  $("log").innerHTML = "";
  st = [];
  cur = 0;
  running = true;
  t0 = performance.now();
  $("pSes").textContent = "SESSION: RUNNING";
  $("pSes").className = "pill on";
  log(
    "info",
    "Session started — experiment: Two-box sorting (red→Tray A, yellow→Tray B)",
  );
  say("Session started. " + STEPS[0].n);
  renderSteps();
}
function endSession() {
  if (!running) return;
  for (let i = cur; i < STEPS.length; i++)
    st[i] = { status: "skipped", time: el(), note: "not executed" };
  log(
    cur >= STEPS.length ? "ok" : "alert",
    cur >= STEPS.length
      ? "Session ended: all steps done"
      : "Session ended with incomplete steps",
  );
  running = false;
  $("pSes").textContent = "SESSION: ENDED";
  $("pSes").className = "pill";
  renderSteps();
  say("Session ended.");
  dl();
}
function dl() {
  const out = {
    experiment: "Two-box sorting",
    source: mode,
    ended: new Date().toISOString(),
    summary: {
      done: st.filter((s) => s.status == "done").length,
      skipped: st.filter((s) => s.status == "skipped").length,
      late: st.filter((s) => s.status == "late").length,
    },
    steps: STEPS.map((s, i) => ({
      id: i + 1,
      step: s.n,
      status: (st[i] || { status: "pending" }).status,
      elapsed_s: (st[i] || {}).time ?? null,
    })),
    events,
  };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(out, null, 1)], { type: "application/json" }),
  );
  a.download = "experiment_log_" + Date.now() + ".json";
  a.click();
}
console.log("bCam:", $("bCam"));
$('bSes').onclick=()=>{
  if(!mode) {
    toast('No feed active — starting Demo mode');
    runSim('good');
    return;
  }
  startSession();
};
$("bEnd").onclick = endSession;
$("bLog").onclick = dl;
$('bVoice').onclick=e=>{
  muted=!muted;
  e.target.textContent=muted?'🔇 Voice Off':'🔊 Voice On';
};
$("bRec").onclick = () => {
  if (rec && rec.state == "recording") {
    rec.stop();
    return;
  }
  try {
    const s = cv.captureStream(25);
    rec = new MediaRecorder(s, { mimeType: "video/webm" });
    chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) {
        chunks.push(e.data);
        if (ws && ws.readyState == 1) ws.send(e.data);
      }
    };
    rec.onstop = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      a.download = "experiment_video_" + Date.now() + ".webm";
      a.click();
      $("pRec").textContent = "REC: OFF";
      $("pRec").className = "pill";
      $("bRec").textContent = "⏺ Record";
    };
    rec.start(1000);
    $("pRec").textContent = "● REC";
    $("pRec").className = "pill rec";
    $("bRec").textContent = "⏹ Stop & Save";
  } catch (e) {
    toast("Recording unsupported: " + e.message);
  }
};
$("bNet").onclick = () => {
  if (ws) {
    ws.close();
    ws = null;
    $("pNet").textContent = "IP STREAM: OFF";
    $("pNet").className = "pill";
    $("bNet").textContent = "Connect IP";
    return;
  }
  try {
    ws = new WebSocket($("wsUrl").value);
    ws.onopen = () => {
      $("pNet").textContent = "IP STREAM: " + $("wsUrl").value;
      $("pNet").className = "pill on";
      $("bNet").textContent = "Disconnect";
      toast("Connected — start Record to stream video");
    };
    ws.onerror = () => toast("IP unreachable");
    ws.onclose = () => {
      $("pNet").textContent = "IP STREAM: OFF";
      $("pNet").className = "pill";
    };
  } catch (e) {
    toast("Bad address");
  }
};
