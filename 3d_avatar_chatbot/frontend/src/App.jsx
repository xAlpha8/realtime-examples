import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./components/Avatar";
import { useState, useRef, useEffect, useContext } from "react";
import { useConfig, useRealtime } from "@adaptai/realtime-react";
import { RtAudio } from "@adaptai/realtime-react";
import { ChatContext } from "./context";
import "ldrs/square";
import { ChatProvider } from "./context";
import { isChrome, isSafari } from "react-device-detect";

function RealtimeComponent({ config, setConnection }) {
  const { isConnected, connection } = useRealtime(config);
  const { setMessages, newAudioStartTime } = useContext(ChatContext);
  const deltaCount = useRef(0);

  useEffect(() => {
    connection.connect();
    setConnection(connection);
    return () => {
      connection.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (evt) => {
      const msg = JSON.parse(evt.data);
      console.log(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
        }),
        "   onMessage",
        msg
      );
      setMessages((prevMessages) => [...prevMessages, message]);
    };
    if (isConnected) {
      connection.on("message", onMessage);
      connection.onAudioPacketReceived((timestamp, prevTimestamp, source) => {
        if (prevTimestamp) {
          const delta = timestamp - prevTimestamp;
          // console.log("delta", delta, newAudioStartTime.current, prevTimestamp);
          if (!newAudioStartTime.current && delta > 200) {
            console.log("new audio started", timestamp, prevTimestamp);
            newAudioStartTime.current = timestamp / 1000;
          } else if (newAudioStartTime.current && delta == 0) {
            deltaCount.current += 1;
            if (deltaCount.current > 10) {
              console.log("new audio ended", timestamp, prevTimestamp);
              newAudioStartTime.current = null;
              deltaCount.current = 0;
            }
          }
        } else {
          console.log("new audio initiated", timestamp, prevTimestamp);
          newAudioStartTime.current = timestamp / 1000;
        }
      });
    }
  }, [isConnected]);

  return (
    <>
      {!isConnected && (
        <div className="fixed top-0 left-0 inset-0 bg-black bg-opacity-50 z-[9999]">
          <div className="flex flex-col items-center h-screen">
            <l-square
              size="160"
              stroke="5"
              stroke-length="0.25"
              bg-opacity="0.1"
              speed="2"
              color="#ddd"
            ></l-square>
            <div className="text-white text-3xl m-5">Connecting</div>
          </div>
        </div>
      )}
      <div>
        <RtAudio rtConnection={connection} />
      </div>
    </>
  );
}

function App() {
  const [config, setConfig] = useState(null);
  const [connection, setConnection] = useState(null);
  const configDefault = {
    functionUrl:
      "https://infra.getadapt.ai/run/68deae870da28f99a8562dcb962b9383",
    offerUrl: "http://0.0.0.0:8080/offer",
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
  const { audioOptions } = options;
  const { setAudioInput, setFunctionUrl } = setters;
  const { audioInput, functionUrl } = values;
  const input = useRef();
  const sendMessage = () => {
    const text = input.current.value;
    if (text) {
      console.log(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          fractionalSecondDigits: 3,
        }),
        "  sending message",
        text
      );
      connection.send(text);
      input.current.value = "";
    }
  };

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
  };

  if (!isChrome && !isSafari) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          backgroundColor: "#000",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: "3rem", textAlign: "center" }}>
          This application only supports Chrome and Safari.
        </h1>
      </div>
    );
  }

  return (
    <>
      <div className="h-screen w-screen m-0 bg-[#faaca8] bg-gradient-to-r from-[#faaca8] to-[#ddd6f3] overflow-hidden">
        <ChatProvider>
          <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold">Audio Options:</h2>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
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
                <h2 className="text-lg font-bold">Function URL:</h2>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={functionUrl}
                  onChange={(e) => setFunctionUrl(e.target.value)}
                  placeholder="Enter Function URL"
                />
              </div>
              <div>
                <button
                  className="bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md"
                  onClick={dumpConfigAndRun}
                >
                  Run
                </button>
              </div>
            </div>
            <div>
              {config && (
                <RealtimeComponent
                  config={config}
                  setConnection={setConnection}
                />
              )}
            </div>
          </div>{" "}
          <Loader />
          {connection && (
            <div className="fixed left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
                <input
                  className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
                  placeholder="Type a message..."
                  ref={input}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  className={`bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md`}
                >
                  Send
                </button>
              </div>
            </div>
          )}
          <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
            <Avatar />
          </Canvas>
        </ChatProvider>
      </div>
    </>
  );
}

export default App;
