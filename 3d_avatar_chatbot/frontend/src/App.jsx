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
import { Mic } from "./components/Mic";

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
    active,
    setActive,
  } = useConversation();

  if (!isChrome && !isSafari) {
    return <BrowserNotSupported />;
  }

  return (
    <div className="w-screen h-screen m-0 overflow-hidden flex flex-col justify-center items-center gap-4">
      {status === "connecting" && <ConnectionStatusOverlay />}
      <Loader />
      <div className="flex-col flex justify-center items-center">
        <div className="w-80 h-[300px] bg-white rounded-3xl shadow-lg overflow-hidden">
          <Canvas
            style={{ width: "100%", height: "100%", pointerEvents: "none" }}
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
            <Mic
              isActive={active}
              setIsActive={setActive}
              isProcessingAudio={processing}
            />
            <MessageInput
              inputRef={ref}
              sendMessage={sendMessage}
              isProcessingAudio={processing}
            />
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
