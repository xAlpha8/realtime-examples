import asyncio
import json
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)

import realtime
from realtime.plugins.eleven_labs_tts import ElevenLabsTTS
from realtime.plugins.token_aggregator import TokenAggregator
from realtime.plugins.deepgram_stt import DeepgramSTT
from realtime.plugins.fireworks_llm import FireworksLLM
from realtime.plugins.audio_convertor import AudioConverter
from realtime.streams import AudioStream, VideoStream, Stream, TextStream, ByteStream
from realtime.ops.combine_latest import combine_latest
from realtime.ops.map import map
from realtime.ops.unzip_array import unzip_array
from realtime.ops.join import join
from realtime.ops.merge import merge
from realtime.plugins.azure_tts import AzureTTS


@realtime.App()
class Chatbot:
    async def setup(self):
        self.deepgram_node = DeepgramSTT(sample_rate=8000)
        self.llm_node = FireworksLLM(
            system_prompt="You are a virtual assistant.\
            You will always reply with a JSON object.\
            Each message has a text, facialExpression, and animation property.\
            The text property is a short response to the user (no emoji).\
            The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.\
            The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.",
            temperature=0.9,
            response_format={"type": "json_object"},
            stream=False,
            model="accounts/fireworks/models/llama-v3-8b-instruct",
        )
        self.tts_node = AzureTTS(voice_id="en-US-EricNeural", stream=True)
        self.audio_convertor_node = AudioConverter()

    @realtime.streaming_endpoint()
    async def run(
        self, audio_input_stream: AudioStream, message_stream: TextStream
    ) -> Tuple[Stream, ...]:
        deepgram_stream: TextStream = await self.deepgram_node.run(audio_input_stream)

        deepgram_stream = merge([deepgram_stream, message_stream])

        llm_token_stream: TextStream
        chat_history_stream: TextStream
        llm_token_stream, chat_history_stream = await self.llm_node.run(deepgram_stream)

        json_text_stream = map(
            await llm_token_stream.clone(), lambda x: json.loads(x).get("text")
        )

        tts_stream: ByteStream
        viseme_stream: TextStream
        tts_stream, viseme_stream = await self.tts_node.run(json_text_stream)

        llm_with_viseme_stream = merge([llm_token_stream, viseme_stream])

        audio_stream: AudioStream = await self.audio_convertor_node.run(tts_stream)
        return audio_stream, llm_with_viseme_stream

    async def teardown(self):
        await self.deepgram_node.close()
        await self.llm_node.close()
        await self.tts_node.close()


if __name__ == "__main__":
    while True:
        try:
            asyncio.run(Chatbot().run())
        except Exception as e:
            print(e)
