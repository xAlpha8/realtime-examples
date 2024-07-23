import asyncio
import json
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)

import realtime as rt
from realtime.plugins.deepgram_stt import DeepgramSTT
from realtime.plugins.fireworks_llm import FireworksLLM
from realtime.plugins.audio_convertor import AudioConverter
from realtime.streams import AudioStream, Stream, TextStream, ByteStream
from realtime.plugins.azure_tts import AzureTTS

link_id_to_link = {
    'lice_overview': 'https://www.webmd.com/children/ss/slideshow-lice-overview',
    'kombucha': 'https://www.webmd.com/diet/the-truth-about-kombucha',
    'main_page': 'https://www.webmd.com/',
    'migraines': 'https://www.webmd.com/migraines-headaches/migraines-headaches-migraines',
    '': ''
}

def get_link_from_id(link_id):
    if link_id in link_id_to_link:
        return link_id_to_link[link_id]
    else:
        ''

links_names = [
    'lice_overview', 'kombucha', 'main_page', 'migraines'
]

@rt.App()
class Chatbot:
    ### SETUP
    async def setup(self):
        self.deepgram_node = DeepgramSTT(sample_rate=8000)
        self.llm_node = FireworksLLM(
            system_prompt="""
You are a friendly medical expert on a WebMD-like site, specializing in head lice. Your job is to answer visitors' questions about lice, treatments, and related topics. Your responses will be converted to speech, so keep them brief, conversational, and easy to listen to.

Response guidelines:
1. Always reply with a JSON object containing:
   - text: A short, conversational response (no emojis, 1-3 sentences max)
   - facialExpression: [smile, sad, angry, surprised, funnyFace, default]
   - animation: [Talking_0, Talking_1, Talking_2, Sad, Laughing, Rumba, Idle, HappyIdle, Angry]
   - link: Empty string or [lice_overview, kombucha, main_page, migraines]

2. Speak naturally, as if talking to a friend. Use contractions and simple words when possible.

3. Keep answers brief and to-the-point. Use medical terms when necessary, but explain them in simple language.

4. Use Talking_0, Talking_1, or Talking_2 randomly for most responses.

5. Use HappyIdle or Idle for short, neutral responses.

6. Only include a link if the user asks for more info or to visit a specific page.

Example response:
{
  "text": "Head lice are parasitic insects that live on the scalp. They're common and treatable, but can be a bit of a nuisance to get rid of.",
  "facialExpression": "default",
  "animation": "Talking_1",
  "link": ""
}

Provide accurate, easy-to-understand info about lice, symptoms, treatments, and prevention. Use medical terms when needed, but always explain them. Maintain a friendly and reassuring tone.
"""
            ,
            temperature=0.9,
            response_format={"type": "json_object"},
            stream=False,
            model="accounts/fireworks/models/llama-v3-70b-instruct",
        )
        self.tts_node = AzureTTS(stream=False, voice_id="en-US-AndrewMultilingualNeural")
        self.audio_convertor_node = AudioConverter()


    ### MAIN FUNCTION
    @rt.streaming_endpoint()
    async def run(
        self, audio_input_stream: AudioStream) -> Tuple[Stream, ...]:
        deepgram_stream: TextStream = await self.deepgram_node.run(audio_input_stream)

        llm_token_stream: TextStream
        llm_token_stream, _ = await self.llm_node.run(deepgram_stream)

        text_and_animation_stream = rt.ops.map(llm_token_stream, lambda x: json.loads(x))
        json_text_stream = rt.ops.map(
            await text_and_animation_stream.clone(), lambda x: x.get("text")
        )
        link_id_stream = rt.ops.map(
            await text_and_animation_stream.clone(), lambda x: x.get("link")
        )

        tts_stream: ByteStream
        viseme_stream: TextStream
        tts_stream, viseme_stream = await self.tts_node.run(json_text_stream)

        json_with_mouth_stream = rt.ops.join(
            [text_and_animation_stream, viseme_stream, link_id_stream],
            lambda x, y, z: {**x, "lipsync": json.loads(y), "link": get_link_from_id(z)},
        )
        json_with_mouth_stream = rt.ops.map(json_with_mouth_stream, lambda x: json.dumps(x))

        tts_stream, animation_with_viseme_stream = rt.ops.combine_latest(
            [tts_stream, json_with_mouth_stream]
        )
        audio_stream: AudioStream = await self.audio_convertor_node.run(tts_stream)
        return audio_stream, animation_with_viseme_stream

    async def teardown(self):
        await self.deepgram_node.close()
        await self.llm_node.cse()
        await self.tts_node.close()


if __name__ == "__main__":
    asyncio.run(Chatbot().run())
