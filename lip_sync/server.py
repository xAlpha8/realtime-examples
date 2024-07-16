import json
import os
import ssl
import time
import asyncio
import aiohttp
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import zipfile
import wave
import logging

current_file_path = os.path.abspath(__file__)
parent_directory = os.path.dirname(current_file_path)


viseme_id_to_mouth_shapes = {
    0: "X",
    1: "D",
    2: "D",
    3: "F",
    4: "C",
    5: "C",
    6: "B",
    7: "F",
    8: "E",
    9: "E",
    10: "F",
    11: "D",
    12: "C",
    13: "F",
    14: "C",
    15: "B",
    16: "F",
    17: "H",
    18: "G",
    19: "H",
    20: "H",
    21: "A",
}
mouth_shapes_to_viseme_id = {v: k for k, v in viseme_id_to_mouth_shapes.items()}


async def download_and_extract_zip(url, extract_to=parent_directory):
    """
    Downloads a ZIP file from a URL and extracts it to a specified folder.
    """
    print(f"Downloading ZIP file from {url}")
    zip_path = f"{parent_directory}/rhubarb_linux.zip"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                with open(zip_path, "wb") as f:
                    while True:
                        chunk = await response.content.read(1024)
                        if not chunk:
                            break
                        f.write(chunk)

    print(f"Extracting ZIP file to {extract_to}")
    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)

    rhubarb_executable_path = f"{extract_to}/rhubarb_linux/rhubarb"
    os.chmod(rhubarb_executable_path, 0o755)  # Set the executable permission

    os.remove(zip_path)  # Clean up the temporary zip file
    print("Download and extraction complete.")


app = FastAPI()

# Correctly adding CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await download_and_extract_zip(
        "https://rhubarb-linux.s3.us-west-1.amazonaws.com/rhubarb_linux.zip"
    )


def write_to_wav(
    byte_data,
    audio_channels,
    audio_sample_rate,
    audio_sample_width,
    file_name="output.wav",
):
    print("Writing to wav", file_name)
    with wave.open(file_name, "wb") as wav_file:
        wav_file.setnchannels(audio_channels)
        wav_file.setsampwidth(audio_sample_width)
        wav_file.setframerate(audio_sample_rate)
        wav_file.writeframes(byte_data)


async def run_rhubarb(
    byte_data, audio_channels, audio_sample_rate, audio_sample_width, total_duration
):
    start_time = time.time()
    write_to_wav(
        byte_data,
        audio_channels,
        audio_sample_rate,
        audio_sample_width,
        file_name=f"{parent_directory}/output.wav",
    )
    cmd = " ".join(
        [
            f"{parent_directory}/rhubarb_linux/rhubarb",
            "-f",
            "json",
            "-o",
            f"{parent_directory}/message_1.json",
            f"{parent_directory}/output.wav",
            "-r phonetic",
            "--threads 1",
        ],
    )
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    stdout, stderr = await proc.communicate()  # Read the output and error streams
    print(stdout.decode())
    print(stderr.decode())
    await proc.wait()
    data = json.load(open(f"{parent_directory}/message_1.json", "r"))
    for frame in data["mouthCues"]:
        frame["value"] = mouth_shapes_to_viseme_id[frame["value"]]
        frame["start"] += total_duration
        frame["end"] += total_duration
    print(f"Rhubarb took {time.time() - start_time} seconds to process the file")
    return data


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    audio_channels: int = 1,
    audio_sample_rate: int = 44100,
    audio_sample_width: int = 2,
):
    await websocket.accept()
    buffer = b""
    min_buffer_size = 0.1 * audio_sample_rate * audio_sample_width * audio_channels
    total_duration = 0.0
    while True:
        data = await websocket.receive_bytes()
        buffer += data
        try:
            result = await run_rhubarb(
                buffer,
                audio_channels,
                audio_sample_rate,
                audio_sample_width,
                total_duration,
            )
        except Exception as e:
            logging.error(e)
            await websocket.send_json({"error": str(e)})
            continue
        total_duration += result["metadata"]["duration"]
        await websocket.send_json(result)
        buffer = b""


@app.get("/connections")
async def read_root():
    return {"connections": [{"id": "123", "createdAt": "2024-02-20T12:00:00Z"}]}


if __name__ == "__main__":
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(
        os.environ["SSL_CERT_PATH"], keyfile=os.environ["SSL_KEY_PATH"]
    )
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.getenv("HTTP_PORT", 8080)),
        ssl_keyfile=os.environ["SSL_KEY_PATH"],
        ssl_certfile=os.environ["SSL_CERT_PATH"],
    )
