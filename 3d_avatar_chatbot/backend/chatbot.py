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
from realtime.plugins.lip_sync import LipSync
from realtime.streams import AudioStream, VideoStream, Stream, TextStream, ByteStream
from realtime.ops.combine_latest import combine_latest
from realtime.ops.map import map
from realtime.ops.unzip_array import unzip_array
from realtime.ops.join import join


@realtime.App()
class Chatbot:
    async def setup(self):
        self.deepgram_node = DeepgramSTT(sample_rate=8000)
        self.llm_node = FireworksLLM(
            system_prompt="You are a virtual girlfriend.\
            You will always reply with a JSON array of messages. With a maximum of 1 message.\
            Each message has a text, facialExpression, and animation property.\
            The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.\
            The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.",
            temperature=0.9,
            response_format={"type": "json_object"},
            stream=False,
            model="accounts/fireworks/models/llama-v3-70b-instruct",
        )
        self.lip_sync_node = LipSync(
            rhubarb_path="/Users/janakagrawal/Documents/GitHub/realtime-examples/3d_avatar_chatbot/backend/rhubarb/rhubarb"
        )
        self.tts_node = ElevenLabsTTS(
            optimize_streaming_latency=3, voice_id="iF9Lv1Pii7eCFPy5XZlZ", stream=False
        )
        self.audio_convertor_node = AudioConverter()

    @realtime.streaming_endpoint()
    async def run(self, audio_input_stream: AudioStream) -> Tuple[Stream, ...]:
        deepgram_stream: TextStream = await self.deepgram_node.run(audio_input_stream)

        llm_token_stream: TextStream
        chat_history_stream: TextStream
        llm_token_stream, chat_history_stream = await self.llm_node.run(deepgram_stream)

        json_stream = map(llm_token_stream, lambda x: json.loads(x).get("messages", []))
        unzipped_json_stream = unzip_array(json_stream)
        json_text_stream = map(
            await unzipped_json_stream.clone(), lambda x: x.get("text")
        )

        tts_stream: ByteStream = await self.tts_node.run(json_text_stream)

        mouth_animation: TextStream = await self.lip_sync_node.run(
            await tts_stream.clone()
        )

        json_with_mouth_stream = join(
            [unzipped_json_stream, mouth_animation], lambda x, y: {**x, "lipsync": y}
        )

        tts_stream, json_with_mouth_stream = combine_latest(
            [tts_stream, json_with_mouth_stream]
        )
        audio_stream: AudioStream = await self.audio_convertor_node.run(tts_stream)
        json_with_mouth_stream = map(json_with_mouth_stream, lambda x: json.dumps(x))

        return audio_stream, json_with_mouth_stream

    async def teardown(self):
        await self.deepgram_node.close()
        await self.llm_node.close()
        await self.tts_node.close()
