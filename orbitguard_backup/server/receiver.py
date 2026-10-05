"""Ground-station receiver for the IP stream. pip install websockets ; python server/receiver.py
Saves incoming video chunks to received_video.webm and prints JSON events."""
import asyncio, websockets
async def h(ws):
    print('client connected')
    with open('received_video.webm','ab') as f:
        async for m in ws:
            if isinstance(m,bytes): f.write(m)
            else: print(m)
async def main():
    async with websockets.serve(h,'0.0.0.0',8765): print('listening ws://0.0.0.0:8765'); await asyncio.Future()
asyncio.run(main())
