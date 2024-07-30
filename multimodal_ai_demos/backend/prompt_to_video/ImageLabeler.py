import asyncio
from collections import deque
import cv2
import numpy as np
from typing import List, Tuple

from realtime.plugins.base_plugin import Plugin
from realtime.utils.images import (
    convert_yuv420_to_pil,
    image_hamming_distance,
)
from realtime.streams import VideoStream
import os
import cv2
import numpy as np
import supervision as sv
import torch
from tqdm import tqdm
from inference.models import YOLOWorld
from typing import List
import aiohttp
import json

from efficient_sam import load, inference_with_boxes

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
EFFICIENT_SAM_MODEL = load(device=DEVICE)
YOLO_WORLD_MODEL = YOLOWorld(model_id="yolo_world/l")

BOUNDING_BOX_ANNOTATOR = sv.BoundingBoxAnnotator()
MASK_ANNOTATOR = sv.MaskAnnotator()
LABEL_ANNOTATOR = sv.LabelAnnotator()

from io import BytesIO
from PIL import Image
import base64

def process_categories(categories: str) -> List[str]:
    return [category.strip() for category in categories.split(',')]

def frame_to_data_url(frame):
    # Convert the frame (numpy array) to a PIL Image
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    # Save the image to a bytes buffer
    buffered = BytesIO()
    image.save(buffered, format="JPEG", quality=90)

    # Encode the bytes to base64
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

    # Create the data URL
    # data_url = f"data:image/jpeg;base64,{img_str}"

    return img_str

async def fetch_data(image, classes):
    url = "http://64.181.234.250:9001/yolo_world/infer?api_key=UdE7KhC1MuHuHOIKxjtO"
    payload = {
        "id": "text",
        "image": {"type": "base64", "value": frame_to_data_url(image)},
        "text": classes,
        "api_key": "UdE7KhC1MuHuHOIKxjtO",
        "yolo_world_version_id": "l",
        "confidence": 0.06,
    }
    headers = {"Content-Type": "application/json", "apiKey": "7RMjEFRGeoDQdYfT3Dfe"}

    async with aiohttp.ClientSession() as session:
        async with session.post(
            url, headers=headers, data=json.dumps(payload)
        ) as response:
            data = await response.json()
            return data

def annotate_image(
    input_image: np.ndarray,
    detections: sv.Detections,
    categories: List[str],
    with_confidence: bool = False,
) -> np.ndarray:
    labels = [
        (
            f"{categories[class_id]}: {confidence:.3f}"
            if with_confidence
            else f"{categories[class_id]}"
        )
        for class_id, confidence in
        zip(detections.class_id, detections.confidence)
    ]
    output_image = MASK_ANNOTATOR.annotate(input_image, detections)
    output_image = BOUNDING_BOX_ANNOTATOR.annotate(output_image, detections)
    output_image = LABEL_ANNOTATOR.annotate(output_image, detections, labels=labels)
    return output_image




class ImageLabeler(Plugin):
    def __init__(self, with_segmentation = False, with_confidence = False, with_class_agnostic_nms = False):
        super().__init__()
        self.output_queue = VideoStream()
        self._generating = False
        self.with_segmentation = with_segmentation
        self.with_confidence = with_confidence
        self.with_class_agnostic_nms = with_class_agnostic_nms
        self.categories : str = ""
    
    def yuv420_to_rgb(self, yuv_image: np.ndarray, width: int, height: int) -> np.ndarray:
        yuv_image = yuv_image.reshape((height * 3 // 2, width))
        return cv2.cvtColor(yuv_image, cv2.COLOR_YUV2RGB_I420)

    def rgb_to_yuv420(self, rgb_image: np.ndarray) -> np.ndarray:
        yuv_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2YUV_I420)
        return yuv_image.reshape(-1)

    def process_image(
        self,
        input_image,
        image_size: Tuple[int, int],
        confidence_threshold: float = 0.3,
        iou_threshold: float = 0.5
    ) -> np.ndarray:
        width, height = image_size
        rgb_image = self.yuv420_to_rgb(input_image, width, height)

        categories = process_categories(self.categories)
        YOLO_WORLD_MODEL.set_classes(categories)
        results = YOLO_WORLD_MODEL.infer(rgb_image, confidence=confidence_threshold)
        detections = sv.Detections.from_inference(results)
        detections = detections.with_nms(
            class_agnostic=self.with_class_agnostic_nms,
            threshold=iou_threshold
        )
        if self.with_segmentation:
            detections.mask = inference_with_boxes(
                image=rgb_image,
                xyxy=detections.xyxy,
                model=EFFICIENT_SAM_MODEL,
                device=DEVICE
            )
        output_image = annotate_image(
            input_image=rgb_image,
            detections=detections,
            categories=categories,
            with_confidence=self.with_confidence
        )
        
        return self.rgb_to_yuv420(output_image)

    async def process_video(self):
        i = 1
        while True:
            category_input = await self.labeler_text_input_queue.get()
            while self.labeler_text_input_queue.qsize() > 0:
                category_input = self.labeler_text_input_queue.get_nowait()
            if len(category_input) > 0:
                self.categories = category_input

            image = await self.image_input_queue.get()
            while self.image_input_queue.qsize() > 0:
                image = self.image_input_queue.get_nowait()

            if (len(self.categories) <= 0):
                continue

            im = self.processImage(image)
            await self.output_queue.put((im, i))
            i += 1

    async def close(self):
        for task in self._tasks:
            task.cancel()

    async def _interrupt(self):
        while True:
            user_speaking = await self.interrupt_queue.get()
            if self._generating and user_speaking:
                self._task.cancel()
                while not self.output_queue.empty():
                    self.output_queue.get_nowait()
                print("Done cancelling LLM")
                self._generating = False
                self._tasks = [asyncio.create_task(self.process_video())]

    async def set_interrupt(self, interrupt_queue: asyncio.Queue):
        self.interrupt_queue = interrupt_queue
        self._interrupt_task = asyncio.create_task(self._interrupt())

    async def run(self, labeler_text_input_queue: asyncio.Queue, image_input_queue: asyncio.Queue) -> asyncio.Queue:
        self.image_input_queue = image_input_queue
        self.labeler_text_input_queue = labeler_text_input_queue
        self._tasks = [asyncio.create_task(self.process_video())]
        return self.output_queue
