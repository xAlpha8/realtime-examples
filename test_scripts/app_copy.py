import torch
from os.path import basename
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
import collections
import numpy as np
import torch
from scene import Scene
from tqdm import tqdm
from utils.general_utils import safe_state
from argparse import ArgumentParser
from arguments import ModelParams, PipelineParams, get_combined_args, ModelHiddenParams
from torch.utils.data import DataLoader
import asyncio
import base64
# This is our custom audio.py
import audio

import json
import cv2
import io
from flask import Flask, render_template
from flask_socketio import SocketIO, emit, send

SYNCNET_T = 5
SYNCNET_MEL_STEP_SIZE = 16

class AudDataset(object):
    def __init__(self, wavdata):
    def get_frame_id(self, frame):
        return int(basename(frame).split('.')[0])
    def get_window(self, start_id):
        return window_fnames
    def crop_audio_window(self, spec, start_frame):
        return spec[start_idx: end_idx, :]
    def __len__(self):
        return self.data_len
    def __getitem__(self, idx):
        return mel

# instead of doing per frame image encoding, its better to parallel proc it after one chunk
from multiprocessing import Pool
def img2base64(x):
    _, buffer = cv2.imencode('.jpg', x)
    image_data = base64.b64encode(buffer).decode('utf-8')
    return image_data

def multiTen2base64(x):
    with Pool(12) as p:
        img_64_data = p.map(img2base64, x)
    return img_64_data

def audio_proc(Scene, Args, Gaus, Pipeline):
    Args.batch_size = 1
    viewpoint_stack = Scene.getCustomCameras()
    viewpoint_stack_loader = DataLoader(viewpoint_stack, batch_size=Args.batch_size, 
                                        shuffle=False, num_workers=1, collate_fn=list)
    loader = iter(viewpoint_stack_loader)
    process_until = len(viewpoint_stack.dataset)
    imList = []
    iterations = process_until // Args.batch_size
    if process_until % Args.batch_size != 0:
        iterations += 1
    # print("process_until:",process_until," iterations:",iterations)
    #render image
    for idx in tqdm(range(iterations), desc="Rendering progress",total = iterations):
        try:
            viewpoint_cams = next(loader)
            output = render_from_batch(viewpoint_cams, Gaus, Pipeline.extract(Args),
                                    random_color= False, stage='fine',
                                    batch_size=Args.batch_size, visualize_attention=False, only_infer=True)
            output_arr = output['rendered_image_tensor'].detach().cpu().numpy() * 255 # (N|1, 3, H, W)
            output_arr = output_arr.clip(0, 255).astype(np.uint8)
            output_arr = output_arr.transpose(0, 2, 3, 1)
            imList.append(output_arr)
        except Exception as e:
            print(e)

    imList = np.concatenate(imList, 0)
    imList = multiTen2base64(imList)
    return imList

device = torch.device('cuda')
model = AudioEncoder()
ckpt = torch.load()
new_state_dict = collections.OrderedDict()
for key, value in ckpt.items():
    new_state_dict['audio_encoder.' + key] = value
model.load_state_dict(new_state_dict)
audio_model = model.to(device).eval()
aud_data_obj = AudDataset

# Set up command line argument parser
parser = ArgumentParser(description="Testing script parameters")
modelparams = ModelParams(parser, sentinel=True)
pipeline = PipelineParams(parser)
hyperparam = ModelHiddenParams(parser)
parser.add_argument("--iteration", default=-1, type=int)
parser.add_argument("--quiet", action="store_true")
parser.add_argument("--configs", type=str)
parser.add_argument("--batch", type=int, default=1)
parser.add_argument("--custom_aud", type=str, default='')
parser.add_argument("--smooth_camera", action="store_true")
args = get_combined_args(parser)
if args.configs:
    import mmcv
    from utils.params_utils import merge_hparams
    config = mmcv.Config.fromfile(args.configs)
    args = merge_hparams(args, config)
# Initialize system state (RNG)
safe_state(args.quiet)
args.only_infer = True
# print(args)

# init gaus
dataset = modelparams.extract(args)
gaus = GausModel(dataset.sh_degree, hyperparam.extract(args))
gaus.eval()

# create scene
# print("Scene creation")
scene = Scene(dataset, gaus, load_iteration=args.iteration, shuffle=False, 
                custom_aud=args.custom_aud, smooth_camera=args.smooth_camera)
# print("Scene creation done")
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)
#Serve a simple HTML file
@app.route('/')
def index():
    return render_template('index.html')

# Handle messages sent from client
# This comes from the client side
# for simplicity, this number can be floor(aud_len*25).
START_FRAME_IDX = 0
@socketio.on('audio_event')
def audio_handle_event(data):
    global START_FRAME_IDX
    print("Start frame index :", START_FRAME_IDX)
    audio_bytes_io = io.BytesIO((base64.b64decode(data['audio_data'])))
    audio_arr = audio.load_wav(audio_bytes_io, sr=16000)
    aud_dataset = aud_data_obj(audio_arr)
    aud_dataloader = DataLoader(aud_dataset, batch_size=1024, shuffle=False)
    outputs = []
    with torch.no_grad():
        for bel in aud_dataloader:
            bel = bel.to(device)
            out = audio_model(bel)
            outputs.append(out)
            # print("Done")
    outputs = torch.cat(outputs, dim=0)
    outputs = outputs.cpu()
    first_frame = outputs[0]
    last_frame = outputs[-1]
    outputs = torch.cat((first_frame.unsqueeze(0).repeat(2, 1), outputs, last_frame.unsqueeze(0).repeat(2, 1)), dim=0)
    outputs = outputs.unsqueeze(1).float().permute(0,2,1)
    # This makes the scene continue from provided index. else it restarts from frame 0
    scene.reinitCustomCameras(outputs, START_FRAME_IDX)

    imageList = audio_proc(scene, args, gaus, pipeline)
    START_FRAME_IDX += len(imageList)
    json_imgs = {"image_data": []}
    for img in imageList:
        json_imgs['image_data'].append({"id": data['id'], "image": img, "image_format": "jpeg"})
    emit('response', json_imgs)
    print("Start frame index :", START_FRAME_IDX)


if __name__ == '__main__':
    socketio.run(app, debug=False)