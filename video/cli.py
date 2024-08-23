import argparse
import asyncio
import logging
import math
from typing import Tuple
import cv2
import numpy as np

logging.basicConfig(level=logging.INFO)

from aiortc import (
    RTCIceCandidate,
    RTCPeerConnection,
    RTCSessionDescription,
    VideoStreamTrack,
)
from av import VideoFrame
import realtime
from realtime.streams import AudioStream, VideoStream, Stream, TextStream
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder
import av


def show_frame(frame):
    img = cv2.cvtColor(np.array(frame.to_image()), cv2.COLOR_RGB2BGR)
    cv2.imshow("Video Frame", img)
    cv2.waitKey(1)  # Wait for 1ms to update the window


@realtime.App()
class ReplayBot:
    async def setup(self):
        pass

    @realtime.streaming_endpoint()
    async def run(self, audio_input: AudioStream) -> Tuple[Stream, ...]:
        player = MediaPlayer("./videoplayback.mp4")
        container = av.open("./videoplayback.mp4", mode="r")
        video_time_base = container.streams.video[0].time_base
        framerate = container.streams.video[0].average_rate
        print(video_time_base, framerate)
        audio_stream = AudioStream()
        video_stream = VideoStream()

        async def sync(video_stream: VideoStream, audio_stream: AudioStream):
            await audio_input.get()
            video_frame = next(container.decode(container.streams.video[0]))
            while True:
                audio_frame = await player.audio.recv()
                time_since_start = audio_frame.time_base * audio_frame.pts
                offset = round(time_since_start / video_time_base)
                while video_frame.pts < offset:
                    video_frame = next(container.decode(container.streams.video[0]))
                print(
                    video_time_base,
                    audio_frame.time_base,
                    audio_frame.pts,
                    offset,
                    video_frame,
                )
                await audio_stream.put(audio_frame)
                await video_stream.put(video_frame)

        asyncio.create_task(sync(video_stream, audio_stream))
        return video_stream, audio_stream

    async def teardown(self):
        pass


if __name__ == "__main__":
    asyncio.run(ReplayBot().run())
