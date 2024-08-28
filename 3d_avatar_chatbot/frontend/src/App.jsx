import { Loader } from "@react-three/drei";
import React, { useState } from "react";
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

  const { options, setters, values, dump } = useConfig(DEFAULT_CONFIG);
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
    processing,
  } = useConversation();

  if (!isChrome && !isSafari) {
    return <BrowserNotSupported />;
  }

  return (
    <div className="w-screen h-screen m-0 overflow-hidden flex flex-col justify-center items-center">
      {status === "connecting" && <ConnectionStatusOverlay />}
      <Loader />
      <div className="flex-col flex justify-center items-center">
        <div className="w-80 h-[300px] bg-white rounded-3xl shadow-lg overflow-hidden">
          <Canvas
              style={{ width: '100%', height: '100%', pointerEvents: "none" }}
              shadows
              camera={{ position: [0, 0, 1], fov: 30 }}
          >
            <group position={[-0.05, -0.05, 0]}>
            <Avatar
              messages={messages}
              removeFirstMessage={removeFirstMessage}
              newAudioStartTime={newAudioStartTime}
              isProcessingAudio={processing}
              scale={2}
              position={[0, -1.7, 0]}
            />
            </group>
          </Canvas>
        </div>
      {status === "connected" && (
        <>
      <button
        onClick={start}
        className="w-16 h-16 bg-pink-500 hover:bg-pink-600 rounded-full shadow-lg flex items-center justify-center transition-colors duration-300 mt-4"
        aria-label="Start recording"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
      <MessageInput inputRef={ref} sendMessage={sendMessage} />
      </>
      )}
      </div>

      {status !== "connected" && (
      <div className="flex justify-center items-center">
        <InputForm
          audioOptions={audioOptions}
          audioInput={audioInput}
          setAudioInput={setAudioInput}
          functionUrl={functionUrl}
          setFunctionUrl={setFunctionUrl}
          onClickRun={() => start(functionUrl)}
        />
      </div>
      )}
    </div>
  );
}

export default App;
