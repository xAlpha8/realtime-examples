import { Loader } from "@react-three/drei";
import React, { useState, useEffect } from "react";
import { useConfig } from "@adaptai/realtime-react";
import { isSafari, isChrome } from "react-device-detect";
import { DEFAULT_CONFIG } from "./constants/config";
import { InputForm } from "./components/Input";
import { BrowserNotSupported } from "./components/BrowserNotSupported";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./components/Avatar/Avatar";
import { MessageInput } from "./components/MessageInput";
import { useConversation } from "./hooks/connection";
import { ConnectionStatusOverlay } from "./components/ConnectionStatusOverlay";

/**
 * Main application component.
 *
 * @returns {JSX.Element} The rendered application.
 */
function App() {
  const [config, setConfig] = useState(null);

  const { options, setters, values } = useConfig(DEFAULT_CONFIG);
  const { audioOptions } = options;
  const { setAudioInput, setFunctionUrl } = setters;
  const { audioInput, functionUrl } = values;
  const {
    messages,
    ref,
    removeFirstMessage,
    sendMessage,
    start,
    status,
    newAudioStartTime,
  } = useConversation();

  // useEffect(() => {
  //   console.log("Starting connection");
  //   start(functionUrl);
  // }, []);

  if (!isChrome && !isSafari) {
    return <BrowserNotSupported />;
  }

  return (
    <div className="h-screen w-screen m-0 bg-[#000000] overflow-hidden flex">
      {/* Left Side: 3D Canvas and Chat */}
      <div className="flex-1 flex flex-col">
        {status === "connecting" && <ConnectionStatusOverlay />}
        {status !== "connected" && (
          <InputForm
            audioOptions={audioOptions}
            audioInput={audioInput}
            setAudioInput={setAudioInput}
            functionUrl={functionUrl}
            setFunctionUrl={setFunctionUrl}
            onClickRun={() => start(functionUrl)}
          />
        )}
        <Loader />
        <div className="flex-1">
          {/* {status === "connected" && (
            <MessageInput inputRef={ref} sendMessage={sendMessage} />
          )} */}
          <Canvas
            style={{ pointerEvents: "none" }}
            shadows
            camera={{ position: [0, 0, 1], fov: 60 }}
          >
            <Avatar
              messages={messages}
              removeFirstMessage={removeFirstMessage}
              newAudioStartTime={newAudioStartTime}
            />
          </Canvas>
        </div>
      </div>

      {/* Right Side: Iframe */}
      <div className="flex-1">
        <iframe
          src="https://viewer.hal51.ai/"
          className="w-full h-full"
          title="HAL51 AI Viewer"
        />
      </div>
    </div>
  );
}

export default App;
