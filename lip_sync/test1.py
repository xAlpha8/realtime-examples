import asyncio
import aiohttp
import websockets

ELVENLABS_API_KEY = ""

q = asyncio.Queue()


async def stream_elevenlabs():
    uri = "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB/stream"  # Updated URI for Elevenlabs API
    headers = {
        "xi-api-key": ELVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {"text": "Hello, world!", "model_id": "eleven_turbo_v2"}
    querystring = {
        "output_format": "pcm_44100",
        "optimize_streaming_latency": 4,
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(
            uri, json=payload, headers=headers, params=querystring
        ) as response:
            if response.status != 200:
                print("tts error %s", await response.text())
                return
            async for chunk in response.content:
                if chunk:
                    q.put_nowait(chunk)


async def stream_lipsync():
    uri = "ws://127.0.0.1:8080/ws?audio_channels=1&audio_sample_rate=44100&audio_sample_width=2"
    # Open a connection to the WebSocket server
    async with websockets.connect(uri) as websocket:
        # For good viseme detection, we need to send at least 200ms of audio
        min_buffer_size = 0.2 * 44100 * 2 * 1
        buffer = b""
        while True:
            chunk = await q.get()
            buffer += chunk
            if len(buffer) < min_buffer_size:
                continue
            await websocket.send(buffer)
            buffer = b""
            # Send the bytes to the server
            # Wait for the server to send a response
            response = await websocket.recv()
            print("Received from server:", response)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    tasks = [
        loop.create_task(stream_elevenlabs()),
        loop.create_task(stream_lipsync()),
    ]
    loop.run_until_complete(asyncio.wait(tasks))
