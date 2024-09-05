import {
  IMediaRecorder,
  MediaRecorder,
  register,
} from "extendable-media-recorder";
import { connect } from "extendable-media-recorder-wav-encoder";
import React, { useRef, useState, useEffect } from "react";
import { blobToBase64, stringify, retryableConnect } from "../utils/utils";
import { isSafari, isChrome } from "react-device-detect";
import { Buffer } from "buffer";

/**
 * Custom hook to manage conversation state and interactions in a chat application.
 * It handles audio and text messaging through WebSockets and manages the audio recording.
 */
export const useConversation = () => {
  // State to manage the audio context for processing audio data
  const [audioContext, setAudioContext] = React.useState<AudioContext>();
  // Queue to store audio data and control messages
  const [audioQueue, setAudioQueue] = React.useState<(Buffer | string)[]>([]);
  // Flag to indicate if audio is currently being processed
  const [processing, setProcessing] = React.useState(false);
  // MediaRecorder instance for recording audio
  const [recorder, setRecorder] = React.useState<IMediaRecorder>();
  // WebSocket instance for communication with the server
  const [socket, setSocket] = React.useState<WebSocket>();
  // Current status of the conversation (idle, connecting, connected, error)
  const [status, setStatus] = React.useState<string>("idle");
  // Error state to capture and display errors
  const [error, setError] = React.useState<Error>();
  // Flag to control the recording state
  const [active, setActive] = React.useState(true);
  // Array to store messages received from the server
  const [messages, setMessages] = useState([]);

  const index = useRef(0);
  const indexWebsocket = useRef(0);
  // Ref to the input element for typing messages
  const ref = useRef(null);
  // Timestamp for when new audio starts
  const newAudioStartTime = useRef(0);
  const [audioWorkletNode, setAudioWorkletNode] =
    useState<AudioWorkletNode | null>(null);

  // Initialize the audio context and AudioWorklet when the component mounts
  useEffect(() => {
    const initAudio = async () => {
      const context = new AudioContext({ sampleRate: 16000 });
      await context.audioWorklet.addModule("/audioProcessor.js");
      const workletNode = new AudioWorkletNode(context, "audio-processor");
      workletNode.connect(context.destination);

      workletNode.port.onmessage = (event) => {
        if (event.data === "agent_start_talking") {
          console.log("agent_start_talking");
          setProcessing(true);
          setActive(false);
          newAudioStartTime.current = new Date().getTime() / 1000;
          // Set a timeout to mark processing as complete after the audio duration
        } else if (event.data === "agent_stop_talking") {
          console.log("agent_stop_talking");
          setProcessing(false);
          newAudioStartTime.current = 0;
        }
      };

      setAudioContext(context);
      setAudioWorkletNode(workletNode);
    };
    try {
      initAudio();
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Initialize the audio context when the component mounts
  // React.useEffect(() => {
  //   const audioContext = new AudioContext();
  //   setAudioContext(audioContext);
  // }, []);

  // Listener for recording data available events
  const recordingDataListener = React.useCallback(
    ({ data }: { data: Blob }) => {
      blobToBase64(data).then((base64Encoded: string | null) => {
        if (!base64Encoded) return;
        const audioMessage = {
          type: "audio",
          data: base64Encoded,
        };

        // Send audio data to the server if the WebSocket is open
        socket!.readyState === WebSocket.OPEN &&
          socket!.send(stringify(audioMessage));
      });
    },
    [socket]
  );

  // Function to send a text message
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

      // Send the message payload to the server
      socket!.send(stringify(payload));
      ref.current.value = ""; // Clear the input field after sending
    }
  };

  // Effect to handle the recorder and socket connection status
  React.useEffect(() => {
    if (!recorder || !socket) return;
    if (status === "connected" && active && !processing) {
      try {
        recorder.resume();
      } catch (error) {
        console.error("Error resuming recorder", error);
      }
      recorder.addEventListener("dataavailable", recordingDataListener);
    }

    return () => {
      if (recorder) {
        try {
          recorder.pause();
        } catch (error) {
          console.error("Error pausing recorder", error);
        }
        recorder.removeEventListener("dataavailable", recordingDataListener);
      }
    };
  }, [recorder, socket, status, active, processing]);

  // Register WAV encoder for the media recorder
  React.useEffect(() => {
    const registerWav = async () => {
      await register(await connect());
    };
    registerWav().catch(console.error);
  }, []);

  // Effect to play queued audio
  React.useEffect(() => {
    const playArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
      audioWorkletNode?.port.postMessage({
        type: "arrayBuffer",
        buffer: arrayBuffer,
      });
    };
    if (audioQueue.length === 0) {
      return;
    }
    const audio = audioQueue[0];
    if (typeof audio === "string" && audio === "audio_end") {
      audioWorkletNode?.port.postMessage({
        type: "audio_end",
      });
      setAudioQueue((prev) => prev.slice(1));
      return;
    }
    console.log("Playing audio", index.current, audioQueue.length);
    index.current += 1;
    audio &&
      fetch(URL.createObjectURL(new Blob([audio])))
        .then((response) => response.arrayBuffer())
        .then(playArrayBuffer);
    setAudioQueue((prev) => prev.slice(1));
  }, [audioQueue]);

  // Function to stop the conversation
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

  // Function to start the conversation
  const startConversation = async (functionUrl: string) => {
    if (!audioContext) return;
    setStatus("connecting");
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
      try {
        const resp = await fetch(functionUrl);
        const payload = await resp.json();
        socket = await retryableConnect(payload.address, {}, 7);
      } catch (e) {
        console.error("Error connecting to socket", e);
        stopConversation(new Error("Error connecting to socket"));
        return;
      }
    } else {
      socket = new WebSocket("ws://0.0.0.0:8080");
    }
    let error: Error | undefined;
    socket.onerror = (event) => {
      console.error(event);
      error = new Error("See console for error details");
    };
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "audio") {
          console.log(
            "Received audio",
            indexWebsocket.current,
            message.index,
            message.data.length
          );
          indexWebsocket.current += 1;
          setAudioQueue((prev) => [
            ...prev,
            Buffer.from(message.data, "base64"),
          ]);
        } else if (message.type === "message") {
          const messageData = JSON.parse(message.data);
          if (messageData?.text) {
            console.log("Received text", messageData.text);
          }
          setMessages((prev) => [...prev, messageData]);
        } else if (message.type === "audio_end") {
          setAudioQueue((prev) => [...prev, "audio_end"]);
        }
      } catch (e) {
        console.error("Error parsing message", e);
      }
    };
    socket.onclose = () => {
      stopConversation(error);
    };
    setSocket(socket);

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
    setStatus("connected");

    socket!.send(
      stringify({
        type: "audio_metadata",
        inputSampleRate: inputAudioMetadata.samplingRate,
        outputSampleRate: audioContext.sampleRate,
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

  // Function to remove the first message from the queue
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
    processing,
  };
};
