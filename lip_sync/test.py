import asyncio
import websockets

import wave


def read_and_chunk_wav(file_path, chunk_duration_ms=1000):
    with wave.open(file_path, "rb") as wav:
        frame_rate = wav.getframerate()
        n_frames = wav.getnframes()
        frames_per_chunk = (frame_rate * chunk_duration_ms) // 1000
        chunks = []

        for _ in range(0, n_frames, frames_per_chunk):
            wav.setpos(_)
            chunks.append(wav.readframes(frames_per_chunk))
    return chunks


async def send_bytes_to_websocket(file_path):
    uri = "wss://lipsync.getadapt.ai:27434/ws?audio_channels=2&audio_sample_rate=44100&audio_sample_width=2"
    # Open a connection to the WebSocket server
    async with websockets.connect(uri) as websocket:
        # Open the file in binary read mode
        chunks = read_and_chunk_wav(file_path, chunk_duration_ms=1000)
        for chunk in chunks:
            print(len(chunk))
            await websocket.send(chunk)
            # Send the bytes to the server
            # Wait for the server to send a response
            response = await websocket.recv()
            print("Received from server:", response)


if __name__ == "__main__":
    file_path = "/Users/janakagrawal/Documents/GitHub/realtime-examples/lip_sync/visemenet_intro.wav"  # Specify the path to your input WAV file
    asyncio.run(send_bytes_to_websocket(file_path))
