import socketio
import base64
import json
import os
# Create a Socket.IO client
sio = socketio.Client()
IMAGE_NUM = 0
# Event handler for receiving the JSON object
@sio.on('response')
def on_response(data):
    # print('Received JSON object from server:', data)
    # Save the JSON object to a file
    with open('response_data.json', 'w') as json_file:
        json.dump(data, json_file, indent=4)
    print('JSON data saved as response_data.json')
    # If the response contains a base64-encoded image, save it to a file
    if 'image_data' in data:
        image_data = base64.b64decode(data['image_data'][0]['image'])
        image_path = 'received_image.jpg'
        with open(image_path, 'wb') as f:
            f.write(image_data)
        print(f'Image saved as {image_path}')

# Connect to the server
sio.connect('http://localhost:5000')
# Send audio data to the server (as an example, we're using a small audio file)
with open('data/deep/aud5.wav', 'rb') as f:
    audio_bytes = f.read()
# Emit the audio data to the server
sio.emit('audio_event', {'audio_data': base64.b64encode(audio_bytes).decode('utf-8'), 'id': "aud5"})
import time
time.sleep(10)
sio.emit('audio_event', {'audio_data': base64.b64encode(audio_bytes).decode('utf-8'), 'id': "aud5"})
# Wait for a response from the server
sio.wait()
