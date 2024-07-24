import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { useState, useEffect, useContext } from "react";
import { useRealtime } from "@adaptai/realtime-react";
import { RtAudio } from "@adaptai/realtime-react";
import { ChatContext } from "./context";
import "ldrs/square";
import { ChatProvider } from "./context";
import { isChrome, isSafari } from "react-device-detect";
import { ConnectionConfigPanel } from "./components/ConnectionConfigPanel";
import { Toaster } from "react-hot-toast"
import { ToastManager } from "./components/ToastManager";

function RealtimeComponent({ config, setConnection }) {
  const { isConnected, connection } = useRealtime(config);
  const { setMessages } = useContext(ChatContext);

  const chat = async (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

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
      console.log("onMessage", msg);
      chat(msg);
    };
    if (isConnected) {
      connection.on("message", onMessage);
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
  const [connection, setConnection] = useState(null);
  const [config, setConfig] = useState(null)

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

  const handleRun = (configObj) => {
    setConfig(configObj) 
  }

  return (
    <>
      <ToastManager />
      <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
        <div className="space-y-{!connection && 4">
          {!connection && <ConnectionConfigPanel handleRun={handleRun} />}
        </div>
        <div>
          {config && (
            <RealtimeComponent config={config} setConnection={setConnection} />
          )}
        </div>
      </div>{" "}
      <Loader />
      {/* {connection && <UI connection={connection} />} */}
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Experience />
      </Canvas>
    </>
  );
}

function Avatar() {
  return (
    <div className="h-screen w-screen m-0 bg-transparent overflow-hidden">
    <div><Toaster/></div>
      <ChatProvider>
        <App />
      </ChatProvider>
    </div>
  );
}

export default Avatar;
