import asyncio
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)

import realtime
from realtime.streams import VideoStream, Stream, TextStream
from ImageLabeler import ImageLabeler



@realtime.App()
class VideoObjectLabeler:
    async def setup(self):
        self.labeler_node = ImageLabeler()

    @realtime.streaming_endpoint()
    async def run(
        self, chat_stream: TextStream, video_input_stream: VideoStream
    ) -> Tuple[Stream, ...]:
        labeled_video_stream: VideoStream = await self.labeler_node.run(video_input_stream, chat_stream)
        return labeled_video_stream

    async def teardown(self):
        await self.labeler_node.close()


if __name__ == "__main__":
    asyncio.run(VideoObjectLabeler().run())
