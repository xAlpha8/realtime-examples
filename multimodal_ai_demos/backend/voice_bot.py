import asyncio
import logging
import os
from typing import Tuple

import realtime
from realtime.plugins.deepgram_stt import DeepgramSTT
from realtime.plugins.eleven_labs_tts import ElevenLabsTTS
from realtime.plugins.fireworks_llm import FireworksLLM
from realtime.plugins.silero_vad import SileroVAD
from realtime.plugins.token_aggregator import TokenAggregator
from realtime.streams import AudioStream, VideoStream, Stream, TextStream, ByteStream
from realtime.plugins.audio_convertor import AudioConverter

logging.basicConfig(level=logging.INFO)

"""
Wrapping your class with @realtime.App() will tell the realtime server which functions to run.
"""


@realtime.App()
class VoiceBot:
    async def setup(self):
        """
        This function will be called when the app starts.
        This function should be used to setup services, load models, etc.
        """
        # ------ Initialize the services ------
        self.deepgram_node = DeepgramSTT(
            api_key=os.environ.get("DEEPGRAM_API_KEY"), sample_rate=8000
        )
        self.llm_node = FireworksLLM(
            # api_key=os.environ.get("OPENAI_API_KEY"),
            system_prompt="You are a helpful assistant. Keep your answers very short.",
        )
        self.token_aggregator_node = TokenAggregator()
        self.tts_node = ElevenLabsTTS(api_key=os.environ.get("ELEVEN_LABS_API_KEY"))
        self.audio_convertor_node = AudioConverter()

        # Silero for voice activity detection to handle interrupts while bot is talking
        self.vad_node = SileroVAD()

    @realtime.streaming_endpoint()
    async def run(self, audio_input_queue: AudioStream) -> Tuple[Stream, ...]:
        """
        This function will handle the connection to the frontend. Whenever, a new connection request comes in, this function will be called (after setup finishes).
        The type hint (AudioStream/VideoStream/TextStream) is used to tell the realtime server which type of stream to expect.
        """
        # Clone the audio input queue. Every time something is put in the original queue, it is also put in the clone automatically.
        audio_input_queue_copy = await audio_input_queue.clone()

        # ------ Run the services ------

        # Each service takes one or more input queues and returns one or more output queues
        # These processes run in a separate thread/task, so won't block the main thread
        deepgram_stream: TextStream = await self.deepgram_node.run(audio_input_queue)
        vad_output_queue: TextStream = await self.vad_node.run(audio_input_queue_copy)
        llm_token_stream: TextStream
        chat_history_stream: TextStream
        llm_token_stream, chat_history_stream = await self.llm_node.run(deepgram_stream)
        token_aggregator_stream: TextStream = await self.token_aggregator_node.run(
            llm_token_stream
        )
        tts_stream: ByteStream = await self.tts_node.run(token_aggregator_stream)
        audio_stream: AudioStream = await self.audio_convertor_node.run(tts_stream)

        # Set the interrupts for the services
        # These are used to handle interrupts while the bot is talking
        await self.llm_node.set_interrupt(vad_output_queue)
        await self.token_aggregator_node.set_interrupt(await vad_output_queue.clone())
        await self.tts_node.set_interrupt(await vad_output_queue.clone())

        return (audio_stream, chat_history_stream)

    async def teardown(self):
        """
        This function will be called when the app stops or is shutdown unexpectedly.
        This function should be used to clean up resources, etc.
        """
        await self.deepgram_node.close()
        await self.llm_node.close()
        await self.token_aggregator_node.close()
        await self.tts_node.close()
        await self.vad_node.close()
        await self.audio_convertor_node.close()


if __name__ == "__main__":
    asyncio.run(VoiceBot().run())
