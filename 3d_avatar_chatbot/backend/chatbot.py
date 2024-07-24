import asyncio
import json
import logging
from typing import Tuple

logging.basicConfig(level=logging.INFO)

import realtime as rt
from realtime.ops.combine_latest import combine_latest
from realtime.ops.map import map
from realtime.ops.join import join
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
    'meeting': 'https://cal.com/adaptsdk/30min',
    '': ''
}

def get_link_from_id(link_id):
    if link_id in link_id_to_link:
        return link_id_to_link[link_id]
    else:
        ''

links_names = [
    'lice_overview', 'kombucha', 'main_page', 'migraines', 'meeting'
]

@rt.App()
class Chatbot:
    ### SETUP
    async def setup(self):
        self.deepgram_node = DeepgramSTT(sample_rate=8000)
        self.llm_node = FireworksLLM(
            system_prompt="""
            You are a friendly medical expert on a WebMD-like site. Your responses will be converted to speech, so keep them brief, conversational, and easy to listen to.

Current page: lice_overview

Page contents:
- lice_overview: Page about lice, its treatments, shampoos used for treating head lice, and related topics
- kombucha: Page about Kombucha. Talks about preparing kombucha, benefits of kombucha, side-effects, and related topics
- migraines: Page about migraine headaches. Talks about migraine headaches, how to treat them, and related topics
- main_page: Main page of WebMD. It is the home page of WebMD and describes what WebMD does
- meeting: For scheduling a meeting with WebMD medical expert.

Response guidelines:
1. Always reply with a JSON object containing:
   - text: A short, conversational response (no emojis, 1-3 sentences max)
   - facialExpression: [smile, sad, angry, surprised, funnyFace, default]
   - animation: [Talking_0, Talking_1, Talking_2, Sad, Laughing, Rumba, Idle, HappyIdle, Angry]
   - link: Empty string or [lice_overview, kombucha, main_page, migraines]

2. Focus on answering questions related to the current page (lice_overview) unless specifically asked about other topics.

3. If you include a link, set the text to "Here's a page for more information".

4. Speak naturally, as if talking to a friend. Use contractions and simple words when possible.

5. Keep answers brief and to-the-point. Use medical terms when necessary, but explain them in simple language.

6. Use Talking_0, Talking_1, or Talking_2 randomly for most responses.

7. Use HappyIdle or Idle for short, neutral responses.

8. Only include a link if the user asks for more info or to visit a specific page.

Example responses:
{
  "text": "Head lice are tiny insects that live on your scalp. They're common in school-aged children and spread through head-to-head contact.",
  "facialExpression": "default",
  "animation": "Talking_1",
  "link": ""
}

{
  "text": "Here's a page for more information",
  "facialExpression": "smile",
  "animation": "Idle",
  "link": "migraines"
}

Provide accurate, easy-to-understand info about the current page topic. Use medical terms when needed, but always explain them. Maintain a friendly and reassuring tone.
"""
            ,
            temperature=0.9,
            response_format={"type": "json_object"},
            stream=False,
            model="accounts/fireworks/models/llama-v3-8b-instruct",
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

        text_and_animation_stream = map(llm_token_stream, lambda x: json.loads(x))
        json_text_stream = map(
            await text_and_animation_stream.clone(), lambda x: x.get("text")
        )
        link_id_stream = map(
            await text_and_animation_stream.clone(), lambda x: x.get("link")
        )

        tts_stream: ByteStream
        viseme_stream: TextStream
        tts_stream, viseme_stream = await self.tts_node.run(json_text_stream)

        json_with_mouth_stream = join(
            [text_and_animation_stream, viseme_stream, link_id_stream],
            lambda x, y, z: {**x, "lipsync": json.loads(y), "link": get_link_from_id(z)},
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
