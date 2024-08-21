import {
  IMediaRecorder,
  MediaRecorder,
  register,
} from "extendable-media-recorder";
import { connect } from "extendable-media-recorder-wav-encoder";
import React, { useRef, useState } from "react";
import { blobToBase64, stringify, retryableConnect } from "../utils/utils";
import { isSafari, isChrome } from "react-device-detect";
import { Buffer } from "buffer";

export const useConversation = () => {
  const [audioContext, setAudioContext] = React.useState<AudioContext>();
  const [audioQueue, setAudioQueue] = React.useState<(Buffer | string)[]>([]);
  // const [payload, setPayload] =
  //   React.useState<Payload>({name: "a",text:"b"});
  const [processing, setProcessing] = React.useState(false);
  const [recorder, setRecorder] = React.useState<IMediaRecorder>();
  const [socket, setSocket] = React.useState<WebSocket>();
  const [status, setStatus] = React.useState<string>("idle");
  const [error, setError] = React.useState<Error>();
  const [active, setActive] = React.useState(true);
  const [messages, setMessages] = useState([]); // State to store the list of messages
  const ref = useRef(null); // Reference to the input element for sending messages
  const newAudioStartTime = useRef(0);

  // get audio context and metadata about user audio
  React.useEffect(() => {
    const audioContext = new AudioContext();
    setAudioContext(audioContext);
  }, []);

  const recordingDataListener = ({ data }: { data: Blob }) => {
    blobToBase64(data).then((base64Encoded: string | null) => {
      if (!base64Encoded) return;
      const audioMessage = {
        type: "audio",
        data: base64Encoded,
      };
      socket!.readyState === WebSocket.OPEN &&
        socket!.send(stringify(audioMessage));
    });
  };

  const sendMessage = () => {
    if (!ref.current) {
      console.error(
        "[useMessage - sendMessage]",
        "Send message is called without setting ref to an input element."
      );
      return;
    }

    const text = ref.current.value;

    if (text) {
      console.log("Sending message", text);
      const payload = {
        type: "message",
        data: text,
      };

      socket!.send(stringify(payload));
      ref.current.value = ""; // Clear the input field
    }
  };

  // once the conversation is connected, stream the microphone audio into the socket
  React.useEffect(() => {
    if (!recorder || !socket) return;
    if (status === "connected") {
      if (active)
        recorder.addEventListener("dataavailable", recordingDataListener);
      else recorder.removeEventListener("dataavailable", recordingDataListener);
    }
  }, [recorder, socket, status, active]);

  // accept wav audio from webpage
  React.useEffect(() => {
    const registerWav = async () => {
      await register(await connect());
    };
    registerWav().catch(console.error);
  }, []);

  // play audio that is queued
  React.useEffect(() => {
    const playArrayBuffer = (arrayBuffer: ArrayBuffer) => {
      audioContext &&
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          // setCurrentSpeaker("agent");
          source.start(0);
          source.onended = () => {
            // if (audioQueue.length <= 0) {
            //   setCurrentSpeaker("user");
            // }
            setProcessing(false);
          };
        });
    };
    if (!processing && audioQueue.length > 0) {
      setProcessing(true);
      const audio = audioQueue.shift();
      if (typeof audio === "string" && audio === "audio_end") {
        newAudioStartTime.current = 0;
        setProcessing(false);
        return;
      } else if (audio instanceof Buffer && newAudioStartTime.current === 0) {
        newAudioStartTime.current = new Date().getTime() / 1000;
      }
      audio &&
        fetch(URL.createObjectURL(new Blob([audio])))
          .then((response) => response.arrayBuffer())
          .then(playArrayBuffer);
    }
  }, [audioQueue, processing]);

  const stopConversation = (error?: Error) => {
    setAudioQueue([]);
    if (error) {
      setError(error);
      setStatus("error");
    } else {
      setStatus("idle");
    }
    if (!recorder || !socket) return;
    recorder.stop();
    const stopMessage = {
      type: "websocket_stop",
    };
    socket.send(stringify(stopMessage));
    socket.close();
  };

  const startConversation = async (functionUrl: string) => {
    if (!audioContext) return;
    setStatus("connecting");
    // setPayload()
    if (!isSafari && !isChrome) {
      stopConversation(new Error("Unsupported browser"));
      return;
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    setError(undefined);
    let socket = null;
    if (functionUrl) {
      const resp = await fetch(functionUrl);
      const payload = await resp.json();
      const offerURL = payload.address.replace("https://", "wss://");
      console.log("Connecting with : ", offerURL);
      socket = await retryableConnect(offerURL, {}, 7);
    } else {
      socket = new WebSocket("ws://0.0.0.0:8080");
    }
    let error: Error | undefined;
    socket.onerror = (event) => {
      console.error(event);
      error = new Error("See console for error details");
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "audio") {
        setAudioQueue((prev) => [...prev, Buffer.from(message.data, "base64")]);
      } else if (message.type === "message") {
        const messageData = JSON.parse(message.data);
        console.log("Received message", messageData);
        setMessages((prev) => [...prev, messageData]);
      } else if (message.type === "audio_end") {
        setAudioQueue((prev) => [...prev, "audio_end"]);
      }
    };
    socket.onclose = () => {
      stopConversation(error);
    };
    socket.onopen = () => {
      setStatus("connected");
    };
    setSocket(socket);

    // wait for socket to be ready
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });

    let audioStream;
    try {
      const trackConstraints: MediaTrackConstraints = {
        echoCancellation: true,
      };
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: trackConstraints,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Allowlist this site at chrome://settings/content/microphone to talk to the bot."
        );
        error = new Error("Microphone access denied");
      }
      console.error(error);
      stopConversation(error as Error);
      return;
    }
    const micSettings = audioStream.getAudioTracks()[0].getSettings();
    console.log(micSettings);
    const inputAudioMetadata = {
      samplingRate: micSettings.sampleRate || audioContext.sampleRate,
      audioEncoding: "linear16",
    };

    // wait for socket to be ready
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        console.log("socket.readyState", socket.readyState);
        if (socket.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });

    socket!.send(
      stringify({
        type: "audio_metadata",
        sampleRate: inputAudioMetadata.samplingRate,
      })
    );

    console.log("Input audio metadata", inputAudioMetadata);
    console.log("Output audio metadata", audioContext.sampleRate);

    let recorderToUse = recorder;
    if (recorderToUse && recorderToUse.state === "paused") {
      recorderToUse.resume();
    } else if (!recorderToUse) {
      recorderToUse = new MediaRecorder(audioStream, {
        mimeType: "audio/wav",
      });
      setRecorder(recorderToUse);
    }

    let timeSlice;
    timeSlice = 10;

    if (recorderToUse.state === "recording") {
      // When the recorder is in the recording state, see:
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/state
      // which is not expected to call `start()` according to:
      // https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/start.
      return;
    }
    recorderToUse.start(timeSlice);
  };

  function removeFirstMessage() {
    setMessages((prev) => prev.slice(1));
  }

  return {
    status,
    start: startConversation,
    stop: stopConversation,
    error,
    active,
    setActive,
    messages, // Array of messages
    removeFirstMessage, // Function to remove the first message
    sendMessage, // Function to send a new message
    ref, // Reference to the input element
    newAudioStartTime,
  };
};
