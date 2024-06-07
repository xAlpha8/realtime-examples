import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO)

import realtime
from realtime.plugins.eleven_labs_tts import ElevenLabsTTS
from realtime.plugins.audio_convertor import AudioConverter
from realtime.streams import AudioStream


@realtime.App()
class SpeechSynthesis:
    async def setup(self):
        self.tts = ElevenLabsTTS(
            api_key=os.environ.get("ELEVEN_LABS_API_KEY"), stream=False
        )
        self.ac = AudioConverter()

    @realtime.streaming_endpoint()
    async def run(self, audio_input_queue: AudioStream):
        tq = asyncio.Queue()
        eq = await self.tts.run(tq)
        aq = await self.ac.run(eq)

        async def a():
            await audio_input_queue.get()
            await tq.put("World War 1, also known as")
            await tq.put("the Great was was a global conflict that")
            await tq.put(
                "lasted from 1914 to 1918 World War 1, also known as the Great War,"
            )

        asyncio.create_task(a())

        # async def a():
        #     while True:
        #         # await audio_input_queue.get()
        #         audio_frame = await self.player.audio.recv()
        #         # print(audio_frame, aq.qsize())
        #         await aq.put(audio_frame)
        # asyncio.create_task(a())

        return aq

    async def teardown(self):
        pass
