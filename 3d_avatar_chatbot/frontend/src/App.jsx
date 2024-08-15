import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./components/Avatar";
import { useState, useEffect } from "react";
import { useConfig, useRealtime } from "@adaptai/realtime-react";
import { RtAudio } from "@adaptai/realtime-react";
import "ldrs/square";
import { DEFAULT_CONFIG } from "./constants/config";
import { InputForm } from "./Input";
import { useMessage } from "./hooks/useMessage";

function RealtimeComponent({ config, setConnection }) {
  const { isConnected, connection } = useRealtime(config);

  useEffect(() => {
    connection.connect();
    setConnection(connection);
    return () => {
      connection.disconnect();
    };
  }, []);

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

  const { options, setters, values, dump } = useConfig(DEFAULT_CONFIG);
  const { audioOptions } = options;
  const { setAudioInput, setFunctionUrl } = setters;
  const { audioInput, functionUrl } = values;
  const { messages, removeFirstMessage, ref, sendMessage } = useMessage({
    connection,
  });

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
  };

  return (
    <>
      <div className="h-screen w-screen m-0 bg-[#faaca8] bg-gradient-to-r from-[#faaca8] to-[#ddd6f3] overflow-hidden">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
          <InputForm
            audioOptions={audioOptions}
            audioInput={audioInput}
            setAudioInput={setAudioInput}
            functionUrl={functionUrl}
            setFunctionUrl={setFunctionUrl}
            onClickRun={dumpConfigAndRun}
          />
          <div>
            {config && (
              <RealtimeComponent
                config={config}
                setConnection={setConnection}
              />
            )}
          </div>
        </div>
        <Loader />
        {connection && (
          <div className="fixed left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
              <input
                className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
                placeholder="Type a message..."
                ref={ref}
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
          <Avatar messages={messages} removeFirstMessage={removeFirstMessage} />
        </Canvas>
      </div>
    </>
  );
}

export default App;
