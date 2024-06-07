import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { useState, useRef, useEffect, useContext } from "react";
import { useConfig, WebRTCConnectionManager } from "@adaptai/realtime-react";
import { RtVideo, RtAudio, RtChat } from "@adaptai/realtime-react";
import { ChatContext } from "./context";

function RealtimeComponent({ config }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { setMessages } = useContext(ChatContext)

  const chat = async (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }

  useEffect(() => {
    WebRTCConnectionManager.setConfig(config);
    const onStateChange = (state) => {
      if (state == "connected") {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    };
    const conn = WebRTCConnectionManager.get();
    conn.connect();
    conn.on("statechange", onStateChange);

    return () => {
      conn.off("statechange", onStateChange);
      conn.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (evt) => {
      const msg = JSON.parse(evt.data);
      console.log("onMessage", msg);
      chat(msg);
    }
    if (isConnected) {
      const conn = WebRTCConnectionManager.get()
      const tracks = conn.tracks
      tracks.forEach((track) => {
        if (videoRef.current && track.kind == "video") {
          videoRef.current.srcObject = track.stream
        } else if (audioRef.current && track.kind == "audio") {
          audioRef.current.srcObject = track.stream
        }
      })
      conn.on("message", onMessage)
    }
    return () => {
      if (videoRef.current) {
          videoRef.current.srcObject = null
      }
      if (audioRef.current) {
          audioRef.current.srcObject = null
      }
    }
  }, [isConnected])

  return (
    <div>
      <RtAudio ref={audioRef} />
    </div>
  );
}

function App() {
  const [config, setConfig] = useState(null);
  const configDefault = {
    functionUrl: "",
    offerUrl: `http://localhost:8080/offer`,
    isDataEnabled: true,
    dataParameters: { ordered: true },
    isVideoEnabled: false,
    videoInput: "",
    videoCodec: "default",
    videoResolution: "256x256",
    videoTransform: "none",
    isScreenShareEnabled: false,
    isAudioEnabled: true,
    audioInput: "",
    audioCodec: "PCMU/8000",
    useStun: false,
  };

  const { options, setters, values, dump } = useConfig(configDefault);
  const { audioOptions, videoOptions } = options;
  const { setAudioInput, setVideoInput, setOfferUrl } = setters;
  const { audioInput, videoInput, offerUrl } = values;

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
  };

  return (
    <>
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
        <>
          <div>
            <div>
              <h2>Audio Options:</h2>
              <select
                value={audioInput}
                onChange={(e) => setAudioInput(e.target.value)}
              >
                {audioOptions.map((option, index) => (
                  <option key={index} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <h2>Offer URL:</h2>
              <input
                type="text"
                value={offerUrl}
                onChange={(e) => setOfferUrl(e.target.value)}
                placeholder="Enter Offer URL"
              />
            </div>
            <div>
              <button className={`bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md opacity-30`} onClick={dumpConfigAndRun}>Run</button>
            </div>
          </div>
          <div>{config && <RealtimeComponent config={config} />}</div>
      </>
      </div>
      <Loader />
      <UI />
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Experience />
      </Canvas>
    </>
  );
}

export default App;
