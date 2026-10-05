# OrbitGuard — AI HAR for On-board BAS Experiments (ISRO PS 26174)
Offline edge assistant that watches a fixed payload camera, validates an experiment sequence, speaks next-step guidance and alerts for skipped / out-of-order steps, writes a timestamped JSON log, records video locally and streams it to an IP.

## Run (no internet, no install)
Open `index.html` in Chrome/Edge, or run `run.bat` / `./run.sh` (serves on http://localhost:8000). Click **Demo ✓ / ✗** to test without a camera, or **Start Camera**.

## Structure
- `index.html`, `css/style.css` — mission-control UI
- `js/core.js` experiment steps, event/sequence engine, box tracker, overlay · `js/model.js` AI inference · `js/sim.js` synthetic scene generator · `js/io.js` camera, session, recording, IP stream, log export · `js/main.js` frame loop
- `model/colornet.js|json` — trained ColorNet (4-12-3 MLP, **0.8 KB**, 98.7% val. accuracy)
- `train/train_colornet.py` — synthetic dataset generation + training (`pip install scikit-learn numpy`)
- `server/receiver.py` — ground station receiver for the IP stream

## Pipeline
Camera → ColorNet per-pixel classification (red / yellow / background) → centroid tracking → pick / place events by rack-anchored zones (R, A, B) → sequence state machine → voice + UI + log.
Experiment steps are defined in `STEPS` in `js/core.js`.

## Using the IP stream
Run `server/receiver.py` on the target machine, enter `ws://<ip>:8765`, click Connect IP, then Record.
