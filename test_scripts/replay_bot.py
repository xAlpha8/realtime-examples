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
        self,
        text_input_queue: TextStream,
        video_input_queue: VideoStream,
        audio_input_queue: AudioStream,
    ) -> Tuple[Stream, ...]:
        return text_input_queue, video_input_queue, audio_input_queue

    async def teardown(self):
        pass


if __name__ == "__main__":
    while True:
        try:
            asyncio.run(ReplayBot().run(), debug=True)
        except Exception as e:
            print(e)
