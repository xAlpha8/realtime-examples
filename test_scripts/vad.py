import asyncio
import time
import logging

logging.basicConfig(level=logging.DEBUG)


from aiortc.contrib.media import MediaPlayer

import realtime
from realtime.plugins import SileroVAD


@realtime.App()
class SpeechSynthesis:
    def __init__(self):
        self.player = MediaPlayer(
            "/Users/janakagrawal/Documents/GitHub/realtime-client/examples/vad/ding1.wav",
            loop=False,
        )

    @realtime.streaming_endpoint(audio_input=True, video_input=True)
    async def video_transform(self, audio_input_queue, video_input_queue):
        aq = asyncio.Queue()
        vq = asyncio.Queue()

        # vad = SileroVAD()
        # oq = await vad.arun(audio_input_queue)
        start = time.time()

        async def a():
            while True:
                # print(await audio_input_queue.get(), time.time() - start)
                await audio_input_queue.get()
                try:
                    audio_frame = await self.player.audio.recv()
                    # print("audio frame", audio_frame)
                except:
                    print("error")
                    # self.player = MediaPlayer(
                    #     "/Users/janakagrawal/Documents/GitHub/realtime-client/examples/vad/ding1.wav"
                    # )
                    self.player.__container.seek(0)
                await aq.put(audio_frame)

        asyncio.create_task(a())

        async def b():
            while True:
                f = await video_input_queue.get()
                await vq.put(f)

        asyncio.create_task(b())

        return aq, vq
