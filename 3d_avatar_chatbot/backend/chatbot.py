import asyncio
import json
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)

import realtime
from realtime.plugins.deepgram_stt import DeepgramSTT
from realtime.plugins.fireworks_llm import FireworksLLM
from realtime.plugins.audio_convertor import AudioConverter
from realtime.streams import AudioStream, Stream, TextStream, ByteStream
from realtime.ops.combine_latest import combine_latest
from realtime.ops.map import map
from realtime.ops.join import join
from realtime.plugins.azure_tts import AzureTTS


@realtime.App()
class Chatbot:
    ### SETUP
    async def setup(self):
        self.deepgram_node = DeepgramSTT(sample_rate=8000)
        self.llm_node = FireworksLLM(
            system_prompt="You are a medical expert.\
            Answer questions about head lice, it's treatment and answer questions based on what the user asks. \
            Reply without being verbose. \
            You will always reply with a JSON object.\
            Each message has a text, facialExpression, and animation property.\
            The text property is a short response to the user (no emoji).\
            The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.\
            The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.",
            temperature=0.9,
            response_format={"type": "json_object"},
            stream=False,
            model="accounts/fireworks/models/llama-v3-70b-instruct",
        )
        self.tts_node = AzureTTS(stream=False)
        self.audio_convertor_node = AudioConverter()


    ### MAIN FUNCTION
    @realtime.streaming_endpoint()
    async def run(
        self, audio_input_stream: AudioStream) -> Tuple[Stream, ...]:
        deepgram_stream: TextStream = await self.deepgram_node.run(audio_input_stream)

        llm_token_stream: TextStream
        llm_token_stream, _ = await self.llm_node.run(deepgram_stream)

        text_and_animation_stream = map(llm_token_stream, lambda x: json.loads(x))
        json_text_stream = map(
            await text_and_animation_stream.clone(), lambda x: x.get("text")
        )

        tts_stream: ByteStream
        viseme_stream: TextStream
        tts_stream, viseme_stream = await self.tts_node.run(json_text_stream)

        json_with_mouth_stream = join(
            [text_and_animation_stream, viseme_stream],
            lambda x, y: {**x, "lipsync": json.loads(y)},
        )
        json_with_mouth_stream = map(json_with_mouth_stream, lambda x: json.dumps(x))

        tts_stream, animation_with_viseme_stream = combine_latest(
            [tts_stream, json_with_mouth_stream]
        )
        audio_stream: AudioStream = await self.audio_convertor_node.run(tts_stream)
        return audio_stream, animation_with_viseme_stream

    async def teardown(self):
        await self.deepgram_node.close()
        await self.llm_node.close()
        await self.tts_node.close()


if __name__ == "__main__":
    asyncio.run(Chatbot().run())
