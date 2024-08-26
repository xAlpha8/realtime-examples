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
  // Ref to the input element for typing messages
  const ref = useRef(null);
  // Timestamp for when new audio starts
  const newAudioStartTime = useRef(0);

  // Initialize the audio context when the component mounts
  React.useEffect(() => {
    const audioContext = new AudioContext();
    setAudioContext(audioContext);
  }, []);

  // Listener for recording data available events
  const recordingDataListener = ({ data }: { data: Blob }) => {
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
  };

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
    if (status === "connected") {
      if (active)
        recorder.addEventListener("dataavailable", recordingDataListener);
      else recorder.removeEventListener("dataavailable", recordingDataListener);
    }
  }, [recorder, socket, status, active]);

  // Register WAV encoder for the media recorder
  React.useEffect(() => {
    const registerWav = async () => {
      await register(await connect());
    };
    registerWav().catch(console.error);
  }, []);

  // Effect to play queued audio
  React.useEffect(() => {
    const playArrayBuffer = (arrayBuffer: ArrayBuffer) => {
      audioContext &&
        audioContext.decodeAudioData(arrayBuffer, (buffer) => {
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          source.onended = () => {
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
        console.log("Setting new audio start time to 0");
        return;
      } else if (audio instanceof Buffer && newAudioStartTime.current === 0) {
        newAudioStartTime.current = new Date().getTime() / 1000;
        console.log("New audio start time", newAudioStartTime.current);
      }
      audio &&
        fetch(URL.createObjectURL(new Blob([audio])))
          .then((response) => response.arrayBuffer())
          .then(playArrayBuffer);
    }
  }, [audioQueue, processing]);

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
