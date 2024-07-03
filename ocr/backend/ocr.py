import asyncio
import colorsys
import logging
import os
from typing import Tuple

import realtime
from realtime.utils.cloneable_queue import CloneableQueue
from realtime.streams import AudioStream, VideoStream, Stream, TextStream
from PIL import Image, ImageDraw, ImageColor
from enum import Enum
from realtime.utils.images import convert_yuv420_to_pil
import numpy as np
import av
from io import BytesIO

from google.cloud import vision
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(level=logging.INFO)

"""
Wrapping your class with @realtime.App() will tell the realtime server which functions to run.
"""
HSV_tuples = [(x * 1.0 / 10.0, 1.0, 1.0) for x in range(1)]
RGB_tuples = list(
    map(lambda x: tuple(int(y * 255) for y in colorsys.hsv_to_rgb(*x)), HSV_tuples)
)


class FeatureType(Enum):
    PAGE = 1
    BLOCK = 2
    PARA = 3
    WORD = 4
    SYMBOL = 5


def draw_boxes(image, bounds, color):
    """Draws a border around the image using the hints in the vector list.

    Args:
        image: the input image object.
        bounds: list of coordinates for the boxes.
        color: the color of the box.

    Returns:
        An image with colored bounds added.
    """
    image = image.convert("RGBA")
    new = Image.new("RGBA", image.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(new, "RGBA")

    for i, bound in enumerate(bounds):
        draw.polygon(
            [
                bound[1].vertices[0].x,
                bound[1].vertices[0].y,
                bound[1].vertices[1].x,
                bound[1].vertices[1].y,
                bound[1].vertices[2].x,
                bound[1].vertices[2].y,
                bound[1].vertices[3].x,
                bound[1].vertices[3].y,
            ],
            outline=RGB_tuples[i % len(RGB_tuples)],  # Use full color for outline
            fill=RGB_tuples[i % len(RGB_tuples)]
            + (64,),  # Use 50% transparent color for fill
        )
        # draw.rectangle(
        #     [
        #         (bound.vertices[0].x, bound.vertices[0].y),
        #         (bound.vertices[2].x, bound.vertices[2].y),
        #     ],
        #     outline=color,  # Use full color for outline
        #     fill=color + (64,),  # Use 50% transparent color for fill
        # )
    out = Image.alpha_composite(image, new)
    return out


async def get_document_bounds(pil_image, feature, client, executor):
    """Finds the document bounds given an image and feature type.

    Args:
        image_file: path to the image file.
        feature: feature type to detect.

    Returns:
        List of coordinates for the corresponding feature type.
    """

    bounds = []

    buffer = BytesIO()
    pil_image.save(buffer, format="JPEG")
    content = buffer.getvalue()

    image = vision.Image(content=content)

    response = await asyncio.get_event_loop().run_in_executor(
        executor,
        client.document_text_detection,  # the synchronous function
        image,  # the function argument
    )
    document = response.full_text_annotation

    # Collect specified feature bounds by enumerating all document features
    for page in document.pages:
        for block in page.blocks:
            for paragraph in block.paragraphs:
                if paragraph.confidence < 0.5:
                    continue
                p = ""
                for word in paragraph.words:
                    for symbol in word.symbols:
                        if feature == FeatureType.SYMBOL:
                            bounds.append(symbol.bounding_box)
                        p += symbol.text

                    if feature == FeatureType.WORD:
                        bounds.append(word.bounding_box)

                if feature == FeatureType.PARA:
                    bounds.append((p, paragraph.bounding_box))

            if feature == FeatureType.BLOCK:
                bounds.append(block.bounding_box)

    bounds.sort(
        key=lambda b: (
            b[0],
            min(
                b[1].vertices[0].x,
                b[1].vertices[1].x,
                b[1].vertices[2].x,
                b[1].vertices[3].x,
            ),
            min(
                b[1].vertices[0].y,
                b[1].vertices[1].y,
                b[1].vertices[2].y,
                b[1].vertices[3].y,
            ),
        )
    )
    # The list `bounds` contains the coordinates of the bounding boxes.
    return bounds


async def render_doc_text(pil_image, client, executor):
    """Outlines document features (blocks, paragraphs and words) given an image.

    Args:
        filein: path to the input image.
        fileout: path to the output image.
    """
    # bounds = get_document_bounds(filein, FeatureType.BLOCK)
    # draw_boxes(image, bounds, "blue")
    bounds = await get_document_bounds(pil_image, FeatureType.PARA, client, executor)
    image = draw_boxes(pil_image, bounds, "red")
    # bounds = get_document_bounds(filein, FeatureType.WORD)
    # draw_boxes(image, bounds, "yellow")

    rgb_image = image.convert("RGB")
    # rgb_image.save(fileout, "JPEG")
    return rgb_image


@realtime.App()
class ReplayBot:
    async def setup(self):
        self.client = vision.ImageAnnotatorClient(
            client_options={"api_key": os.getenv("GOOGLE_VISION_KEY")}
        )
        self.executor = ThreadPoolExecutor(max_workers=1)

    @realtime.streaming_endpoint()
    async def run(self, video_input_stream: VideoStream):
        output_stream = VideoStream()

        async def process_frame():
            frame_count = 0
            # if not os.path.exists("./data"):
            #     os.makedirs("./data")
            frame_pts = 0
            while True:
                frame = await video_input_stream.get()
                frame_pts += frame.pts
                while video_input_stream.qsize() > 0:
                    frame = video_input_stream.get_nowait()
                    frame_pts += frame.pts
                pil_image = convert_yuv420_to_pil(frame)
                # pil_image.save(f"./data/test_{frame_count}.jpeg")
                rgb_image = await render_doc_text(
                    pil_image,
                    self.client,
                    self.executor,
                )
                array = np.array(rgb_image)  # shape (height, width, 3)

                # Create PyAV VideoFrame from NumPy array
                video_frame = av.VideoFrame.from_ndarray(array, format="rgb24")
                video_frame.pts = frame_pts
                video_frame.time_base = frame.time_base
                await output_stream.put(video_frame)
                frame_count += 1

        asyncio.create_task(process_frame())

        return output_stream

    async def teardown(self):
        pass


if __name__ == "__main__":
    asyncio.run(ReplayBot().run())
