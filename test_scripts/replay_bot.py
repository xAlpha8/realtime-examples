import asyncio
import logging
from typing import Tuple

import realtime
from realtime.utils.cloneable_queue import CloneableQueue
from realtime.streams import AudioStream, VideoStream, Stream, TextStream

logging.basicConfig(level=logging.INFO)

"""
Wrapping your class with @realtime.App() will tell the realtime server which functions to run.
"""


@realtime.App()
class ReplayBot:
    async def setup(self):
        pass

    @realtime.streaming_endpoint()
    async def run(
        self, audio_input_queue: AudioStream, video_input_queue: VideoStream
    ) -> Tuple[Stream, ...]:
        return (audio_input_queue, video_input_queue, None)

    async def teardown(self):
        pass
