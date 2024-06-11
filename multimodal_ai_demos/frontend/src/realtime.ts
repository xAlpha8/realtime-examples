import { ConfigSchema, Config, ChatMessageSchema } from "./types";
import AudioMotionAnalyzer from "audiomotion-analyzer";

function mergeConfig(config: Partial<Config>, other: Partial<Config>): Config {
  const merged = {
    ...config,
    ...other,
  };
  return ConfigSchema.parse(merged);
}

function createPeerConnection(useStun: boolean): RTCPeerConnection {
  var config: RTCConfiguration = {
    // @ts-ignore
    sdpSemantics: "unified-plan",
  };

  if (useStun) {
    config.iceServers = [{ urls: ["stun:stun.l.google.com:19302"] }];
  }

  var pc = new RTCPeerConnection(config);

  // register some listeners to help debugging
  pc.addEventListener(
    "icegatheringstatechange",
    () => {
      console.log(" -> " + pc.iceGatheringState);
    },
    false
  );
  console.log(pc.iceGatheringState);

  pc.addEventListener(
    "iceconnectionstatechange",
    () => {
      console.log(" -> " + pc.iceConnectionState);
    },
    false
  );
  console.log(pc.iceConnectionState);

  pc.addEventListener(
    "signalingstatechange",
    () => {
      console.log(" -> " + pc.signalingState);
    },
    false
  );
  console.log(pc.signalingState);

  return pc;
}

type SetupInputDeviceSelectParams = {
  audioSelect: HTMLSelectElement;
  videoSelect: HTMLSelectElement;
  onDeviceSelect: (device: MediaDeviceInfo) => void;
};

async function setupInputDeviceSelect({
  audioSelect,
  videoSelect,
  onDeviceSelect,
}: SetupInputDeviceSelectParams): Promise<MediaDeviceInfo[][]> {
  const screenShareDevice = {
    deviceId: "share-screen",
    kind: "videoinput" as MediaDeviceKind,
    label: "Share Screen",
    groupId: "",
  };

  const populateSelect = (
    select: HTMLSelectElement,
    devices: MediaDeviceInfo[]
  ) => {
    let counter = 1;
    devices.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || "Device #" + counter;
      select.appendChild(option);
      counter += 1;
    });
  };
  // populate choices
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const audioInputDevices = devices.filter(
          (device, idx) => device.kind == "audioinput"
        );
        const videoInputDevices = devices
          .filter((device, idx) => device.kind == "videoinput")
          .concat([
            // add screen share device to video inputs
            {
              ...screenShareDevice,
              toJSON: () => JSON.stringify(screenShareDevice),
            },
          ]);

        audioSelect.onchange = () =>
          onDeviceSelect(
            audioInputDevices.find(
              (device) => device.deviceId === audioSelect.value
            ) || ({ deviceId: "", kind: "audioinput" } as MediaDeviceInfo)
          );
        videoSelect.onchange = () =>
          onDeviceSelect(
            videoInputDevices.find(
              (device) => device.deviceId === videoSelect.value
            ) || ({ deviceId: "", kind: "audioinput" } as MediaDeviceInfo)
          );

        populateSelect(audioSelect, audioInputDevices);
        populateSelect(videoSelect, videoInputDevices);
        console.log(devices);
        resolve([audioInputDevices, videoInputDevices]);
      })
      .catch((e) => {
        alert(e);
        reject(e);
      });
  });
}

async function delay (delayInms: number) {
  return new Promise(resolve => setTimeout(resolve, delayInms));
};

async function retryableFetch(url: string | URL, params: RequestInit, attempts: number) {
  let mult = 1
  for (let i = 0; i < attempts; ++i) {
    try {
      let res = await fetch(url, params)
      return res
    } catch (err) {
      await delay(mult * 1000)
      mult *= 2
      if (i == attempts - 1) {
        throw err
      }
    }
  }
}

async function negotiate(pc: RTCPeerConnection, config: Config) {
  return pc
    .createOffer()
    .then((offer) => {
      return pc.setLocalDescription(offer);
    })
    .then(() => {
      // wait for ICE gathering to complete
      return new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
        } else {
          function checkState() {
            if (pc.iceGatheringState === "complete") {
              pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          }
          pc.addEventListener("icegatheringstatechange", checkState);
        }
      });
    })
    .then(async () => {
      if (config.functionUrl && config.functionUrl.length > 0) {
        const resp = await fetch(config.functionUrl)
        const payload = await resp.json()
        console.log("Connecting with : ", payload.address)
        return payload.address + "/offer"
      }
      else if (config.offerUrl && config.offerUrl.length > 0) {
        console.log("running offerURL")
        return config.offerUrl
      }
      else {
        throw Error("Either offerURL or functionURL must be set")
      }
    })
    .then((offerUrl) => {
      var offer = pc.localDescription;
      var codec;

      if (!offer || !offerUrl) return;

      codec = config.audioCodec;
      if (codec !== "default") {
        // @ts-ignore
        offer.sdp = sdpFilterCodec("audio", codec, offer.sdp);
      }

      codec = config.videoCodec;
      if (codec !== "default") {
        // @ts-ignore
        offer.sdp = sdpFilterCodec("video", codec, offer.sdp);
      }

      console.log(offer.sdp);
      return retryableFetch(offerUrl, {
        body: JSON.stringify({
          sdp: offer.sdp,
          type: offer.type,
          video_transform: config.videoTransform,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      }, 5)
    })
    .then((response) => {
      return response?.json();
    })
    .then((answer) => {
      console.log(answer.sdp);
      return pc.setRemoteDescription(answer);
    })
    .catch((e) => {
      alert(e);
    });
}

function start(
  config: Config | null
): { peerConnection: RTCPeerConnection, dataChannel: RTCDataChannel | null } {
  if (!config) throw Error("Config is not initialized");

  var pc = createPeerConnection(config.useStun);
  var dc = null;

  if (config.isDataEnabled) {
    console.log("Setting up data channel. isDataEnabled?", config.isDataEnabled)
    var parameters = config.dataParameters;

    dc = pc.createDataChannel("chat", parameters);
    dc.addEventListener("close", () => {
      console.log("[dc]- close\n");
    });
    dc.addEventListener("open", () => {
      console.log("[dc]- open\n");
      // dc.send(message);
    });
    dc.addEventListener("message", (evt) => {
      console.log(`[dc] < ${evt.data} \n`);
    });
  }

  // Build media constraints.
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: false,
  };
  let screenShareConstraints: MediaTrackConstraints | null = null

  if (config.isAudioEnabled) {
    const audioConstraints: boolean | MediaTrackConstraints = {};

    const device = config.audioInput;
    if (device) {
      audioConstraints.deviceId = { exact: device };
    }

    constraints.audio = Object.keys(audioConstraints).length
      ? audioConstraints
      : true;
  }

  if (config.isVideoEnabled) {
    const videoConstraints: boolean | MediaTrackConstraints = {};

    const device = config.videoInput;
    if (device) {
      videoConstraints.deviceId = { exact: device };
    }

    const resolution = config.videoResolution;
    if (resolution) {
      const dimensions = resolution.split("x");
      videoConstraints.width = parseInt(dimensions[0], 0);
      videoConstraints.height = parseInt(dimensions[1], 0);
    }

    constraints.video = Object.keys(videoConstraints).length
      ? videoConstraints
      : true;
  }

  if (config.isScreenShareEnabled) {
    screenShareConstraints = {}
    const resolution = config.videoResolution
    if (resolution) {
      const dimensions = resolution.split("x");
      screenShareConstraints.width = parseInt(dimensions[0], 0);
      screenShareConstraints.height = parseInt(dimensions[1], 0);
    }
    screenShareConstraints.frameRate = { max: 5 }
  }

  // Acquire media and start negociation.

  if (constraints.audio || constraints.video || config.isScreenShareEnabled) {
    const addTracks = [];
    console.log("constraints", constraints);
    console.log("screen share", config.isScreenShareEnabled);
    if(constraints.audio || constraints.video) {
      addTracks.push(
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });
        })
      );
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    if (config.isScreenShareEnabled) {
      addTracks.push(
        navigator.mediaDevices
          .getDisplayMedia({
            video: screenShareConstraints!,
          })
          .then((stream) => {
            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });
          })
      );
    }

    Promise.all(addTracks)
      .then(() => negotiate(pc, config))
      .catch((err) => alert("Could not acquire media" + err));
  } else {
    negotiate(pc, config);
  }

  // document.getElementById('stop').style.display = 'inline-block';
  return { peerConnection: pc, dataChannel: dc };
}

function stop(pc: RTCPeerConnection, dc: RTCDataChannel | null) {
  // document.getElementById('stop').style.display = 'none';

  // close data channel
  if (dc) {
    dc.close();
  }

  // close transceivers
  if (pc.getTransceivers) {
    pc.getTransceivers().forEach((transceiver) => {
      if (transceiver.stop) {
        transceiver.stop();
      }
    });
  }

  // close local audio / video
  pc.getSenders().forEach((sender) => {
    if (sender.track) {
      sender.track.stop();
    }
  });

  // close peer connection
  setTimeout(() => {
    pc.close();
  }, 500);
}

function sdpFilterCodec(kind: string, codec: string, realSdp: string) {
  var allowed = [];
  var rtxRegex = new RegExp("a=fmtp:(\\d+) apt=(\\d+)\r$");
  var codecRegex = new RegExp("a=rtpmap:([0-9]+) " + escapeRegExp(codec));
  var videoRegex = new RegExp("(m=" + kind + " .*?)( ([0-9]+))*\\s*$");

  var lines = realSdp.split("\n");

  var isKind = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("m=" + kind + " ")) {
      isKind = true;
    } else if (lines[i].startsWith("m=")) {
      isKind = false;
    }

    if (isKind) {
      var match = lines[i].match(codecRegex);
      if (match) {
        allowed.push(parseInt(match[1]));
      }

      match = lines[i].match(rtxRegex);
      if (match && allowed.includes(parseInt(match[2]))) {
        allowed.push(parseInt(match[1]));
      }
    }
  }

  var skipRegex = "a=(fmtp|rtcp-fb|rtpmap):([0-9]+)";
  var sdp = "";

  isKind = false;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("m=" + kind + " ")) {
      isKind = true;
    } else if (lines[i].startsWith("m=")) {
      isKind = false;
    }

    if (isKind) {
      var skipMatch = lines[i].match(skipRegex);
      if (skipMatch && !allowed.includes(parseInt(skipMatch[2]))) {
        continue;
      } else if (lines[i].match(videoRegex)) {
        sdp += lines[i].replace(videoRegex, "$1 " + allowed.join(" ")) + "\n";
      } else {
        sdp += lines[i] + "\n";
      }
    } else {
      sdp += lines[i] + "\n";
    }
  }

  return sdp;
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function createChatMessageElem(message: string) {
  const messageObj = ChatMessageSchema.parse(JSON.parse(message));
  const dir = messageObj.role == "assistant" ? "right" : "left";
  const color =
    messageObj.role == "assistant" ? "text-green-400" : "text-amber-400";
  return `
    <section class="message -${dir} text-${dir}">
        <div class="nes-balloon from-${dir}">
        <p class="${color}">${messageObj.content}</p>
        </div>
    </section>`;
}

const setupRealtime = async (
  rtElem: HTMLDivElement | null,
  config: Partial<Config>
) => {
  console.log("backend-url", import.meta.env.VITE_BACKEND_URL)
  if (!rtElem) {
    return null;
  }
  let audioChoice: MediaDeviceInfo | null = null;
  let videoChoice: MediaDeviceInfo | null = null;
  const useStunEl = rtElem.querySelector<HTMLInputElement>("#use-stun");
  const useDatachannelEl =
    rtElem.querySelector<HTMLInputElement>("#use-datachannel");
  let fConfig: Config | null = null;
  const audioSelectElem =
    rtElem.querySelector<HTMLSelectElement>("#audio-select");
  const videoSelectElem =
    rtElem.querySelector<HTMLSelectElement>("#video-select");
  const resolutionSelectElem =
    rtElem.querySelector<HTMLSelectElement>("#resolution-select");
  const functionUrlElem = rtElem.querySelector<HTMLInputElement>("#fnurl_field");

  const onSelectMediaDevice = (device: MediaDeviceInfo) => {
    if (device.kind == "audioinput") {
      audioChoice = device;
      fConfig = mergeConfig(fConfig || config, {
        isAudioEnabled: device.deviceId === "" ? false : true,
        audioInput: device.deviceId,
      });
    } else if (device.kind == "videoinput") {
      videoChoice = device;
      fConfig = mergeConfig(fConfig || config, {
        isVideoEnabled: (device.deviceId == "" || device.deviceId == "share-screen") ? false : true,
        videoInput: device.deviceId,
        isScreenShareEnabled: device.deviceId == "share-screen" ? true : false,
      });
    }
  };

  const [audioInputs, videoInputs] = await setupInputDeviceSelect({
    onDeviceSelect: onSelectMediaDevice,
    videoSelect: videoSelectElem!,
    audioSelect: audioSelectElem!,
  });

  const audioElem = rtElem.querySelector<HTMLAudioElement>("#audio");
  const videoElem = rtElem.querySelector<HTMLVideoElement>("#video");
  const audioVisualizerContainer = rtElem.querySelector<HTMLDivElement>(
    "#audio-visualizer-container"
  );

  const startButton = rtElem.querySelector<HTMLButtonElement>("#start-button");
  const startButtonSm =
    rtElem.querySelector<HTMLButtonElement>("#start-button-sm");
  const stopButton = rtElem.querySelector<HTMLButtonElement>("#stop-button");
  const stopButtonSm =
    rtElem.querySelector<HTMLButtonElement>("#stop-button-sm");
  const chatMessages = rtElem.querySelector<HTMLDivElement>("#chat-messages");
  const chatContainer = rtElem.querySelector<HTMLDivElement>("#chat-container");

  const settingsButton =
    rtElem.querySelector<HTMLButtonElement>("#settings-button");
  const settingsModal =
    rtElem.querySelector<HTMLDialogElement>("#settings-modal");

  let peerConnection: RTCPeerConnection | null = null;
  let dataChannel: RTCDataChannel | null = null;

  const startRealtime = () => {
    if (fConfig == null) return;

    fConfig = mergeConfig(fConfig, {
      functionUrl: functionUrlElem?.value || "",
      useStun: useStunEl?.checked,
      isDataEnabled: useDatachannelEl?.checked,
      videoResolution: resolutionSelectElem?.value || "256x256"
    });

    ({ peerConnection, dataChannel } = start(fConfig));

    // connect audio / video
    const audioMotion = new AudioMotionAnalyzer(audioVisualizerContainer!, {
      gradient: "rainbow",
      showScaleY: false,
      showScaleX: false,
    });

    peerConnection.addEventListener("track", (evt: RTCTrackEvent) => {
      // remove all labels
      rtElem
        .querySelectorAll(".media-container-label")
        .forEach((elem) => elem.classList.add("hidden"));
      if (videoElem && evt.track.kind == "video") {
        videoElem.srcObject = evt.streams[0];
        videoElem.style.display = "block";
      } else if (audioElem && evt.track.kind == "audio") {
        const audioStream = audioMotion.audioCtx.createMediaStreamSource(
          evt.streams[0]
        );
        audioMotion.connectInput(audioStream);
        audioMotion.volume = 0;
        audioElem.srcObject = evt.streams[0];
        // audioElem.style.display = 'block'
      }
      startButtonSm?.classList.add("hidden");
      startButton?.classList.add("hidden");
      if (window.innerWidth < 640) {
        stopButtonSm?.classList.remove("hidden");
      } else {
        stopButton?.classList.remove("hidden");
      }
    });
    if (dataChannel) {
      dataChannel.addEventListener("message", (evt) => {
        let chatEl = createChatMessageElem(evt.data);
        if (chatMessages && chatContainer) {
          console.log("chatEl", chatEl);
          console.log("innerHTML", chatMessages.innerHTML);
          chatMessages.innerHTML += chatEl;
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    }
  };

  const stopRealtime = () => {
    if (peerConnection != null) {
      stop(peerConnection, dataChannel);
    }
    stopButton?.classList.add("hidden");
    stopButtonSm?.classList.add("hidden");
    if (window.innerWidth < 640) {
      startButtonSm?.classList.remove("hidden");
    } else {
      startButton?.classList.remove("hidden");
    }
  };

  startButton?.addEventListener("click", startRealtime);
  startButtonSm?.addEventListener("click", startRealtime);
  stopButton?.addEventListener("click", stopRealtime);
  stopButtonSm?.addEventListener("click", stopRealtime);
  settingsButton?.addEventListener("click", () => settingsModal?.showModal());
};

export { setupRealtime };
