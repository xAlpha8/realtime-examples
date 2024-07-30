import logging
import asyncio
import json
import shutil
import tempfile
import uuid
import aiohttp
from fastapi import FastAPI, File, Form, Response, UploadFile, Request
import os
from fastapi.responses import StreamingResponse
import time
import realtime
from realtime.server import RealtimeServer

import cv2
import supervision as sv
import base64
from io import BytesIO
from PIL import Image


BOUNDING_BOX_ANNOTATOR = sv.BoxAnnotator(thickness=2)
LABEL_ANNOTATOR = sv.LabelAnnotator(
    text_thickness=2, text_scale=1, text_color=sv.Color.BLACK
)
cur_dir = os.path.dirname(os.path.abspath(__file__))


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
    url = "https://infer.roboflow.com/yolo_world/infer?api_key=7RMjEFRGeoDQdYfT3Dfe"
    payload = {
        "id": "text",
        "image": {"type": "base64", "value": frame_to_data_url(image)},
        "text": classes,
        "api_key": "7RMjEFRGeoDQdYfT3Dfe",
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


async def image_generator(video, classes):
    video = video if video else "none"
    cap = cv2.VideoCapture(video)
    if not cap.isOpened():
        raise ValueError("Error opening video file")

    # Get the FPS of the video
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_duration = 1 / fps  # Duration of each frame in seconds
    start_time = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_area = frame.shape[0] * frame.shape[1]
        try:
            results = await fetch_data(frame, classes)
            print("results", results)
            if not start_time:
                start_time = time.time()
            detections = sv.Detections.from_inference(results).with_nms(threshold=0.1)
            # detections = detections[(detections.area / frame_area) < 0.10]
            annotated_image = frame.copy()
            labels = [
                f"{classes[class_id]} {confidence:0.3f}"
                for class_id, confidence in zip(
                    detections.class_id, detections.confidence
                )
            ]
            annotated_image = BOUNDING_BOX_ANNOTATOR.annotate(
                annotated_image, detections
            )
            annotated_image = LABEL_ANNOTATOR.annotate(
                annotated_image, detections, labels
            )
            ret, buffer = cv2.imencode(".jpg", annotated_image)
            if ret:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
                )
            else:
                break
        except Exception as e:
            print("Exception in image_generator", e)
        current_time = time.time()
        elapsed_time = current_time - start_time
        frame_count = int(elapsed_time / frame_duration)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_count)

    cap.release()


def iterfile(file_path):
    try:
        with open(file_path, mode="rb") as file_like:
            while chunk := file_like.read(4096):
                yield chunk
    except Exception as e:
        print(f"Failed to read file: {e}")


streams = {}  # Dictionary to store active streams


@realtime.App()
class VideoSurveillanceApp:
    @realtime.web_endpoint(method="POST", path="/submit")
    async def run(file: UploadFile = File(None), prompt: str = Form(...)):
        stream_id = str(uuid.uuid4())  # Generate a unique stream ID
        directory = f"{cur_dir}/data"
        filename = file.filename
        file_path = os.path.join(directory, filename)

        # Ensure the directory exists
        os.makedirs(directory, exist_ok=True)
        try:
            try:
                with open(file_path, "wb") as f:
                    contents = file.file.read()
                    f.write(contents)
            except Exception:
                return {"message": "There was an error uploading the file"}
            finally:
                file.file.close()

        except Exception as e:
            return {"message": f"There was an error processing the file {e}"}

        streams[stream_id] = (file_path, prompt.split(","))
        return {"stream_id": stream_id}

    @realtime.web_endpoint(method="GET", path="/stream/{stream_id}")
    async def serve_stream(stream_id: str):
        print("serve_stream", stream_id, (streams[stream_id][0], streams[stream_id][1]))
        headers = {"Content-Type": "multipart/x-mixed-replace; boundary=frame"}
        return StreamingResponse(
            image_generator(streams[stream_id][0], streams[stream_id][1]),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers,
        )


if __name__ == "__main__":
    v = VideoSurveillanceApp()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(v.run())
    loop.run_until_complete(v.serve_stream())
    asyncio.run(RealtimeServer().start())
