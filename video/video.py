import time
import av
import cv2
import numpy as np

time_since_start = 0.0
start_time = time.time()

container = av.open("./videoplayback.mp4", mode="r")
video_time_base = container.streams.video[0].time_base
framerate = container.streams.video[0].average_rate
frame_duration = 1 / framerate


def show_frame(frame):
    img = cv2.cvtColor(np.array(frame.to_image()), cv2.COLOR_RGB2BGR)
    cv2.imshow("Video Frame", img)
    cv2.waitKey(1)  # Wait for 1ms to update the window


pts = 0
while True:
    time_since_start = time.time() - start_time
    offset = round(time_since_start / video_time_base)
    pts = 0
    while pts < offset:
        video_frame = next(container.decode(container.streams.video[0]))
        pts = video_frame.pts
    print(video_time_base, offset, video_frame)
    show_frame(video_frame)
    time.sleep(float(frame_duration))
