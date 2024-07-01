import { useState, useEffect } from "react";
import { useConfig, useRealtime } from "@adaptai/realtime-react";
import { Config } from "@adaptai/realtime-react";
import { RtVideo, RtAudio, RtChat } from "@adaptai/realtime-react";
import { isChrome, isSafari } from 'react-device-detect';

function RealtimeContainer({ config }: { config: Config }) {
  const { connection, isConnected } = useRealtime(config);
  useEffect(() => {
    connection.connect()
  }, [])
  return (
    <div >
      {isConnected ? (
        <div className="flex items-center justify-center space-y-4">
          <RtVideo rtConnection={connection} />
        </div>
      ) : (
        <>Connecting!</>
      )}
    </div>
  );
}

function App() {
  const [isRealtimeDisabled, setIsRealtimeDisabled] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const configDefault: Config = {
    functionUrl: "https://infra.getadapt.ai/run/9db00fa3dfa522de4c31dd70fad48605",
    offerUrl: "",
    isDataEnabled: true,
    dataParameters: { ordered: true },
    isVideoEnabled: true,
    videoInput: "",
    videoCodec: "default",
    videoResolution: "2048x2048",
    videoTransform: "none",
    isScreenShareEnabled: false,
    isAudioEnabled: false,
    audioInput: "",
    audioCodec: "PCMU/8000",
    useStun: false,
  };

  const { options, setters, values, dump } = useConfig(configDefault);
  const { audioOptions, videoOptions } = options;
  const { setAudioInput, setVideoInput, setOfferUrl, setFunctionUrl } = setters;
  const { audioInput, videoInput, offerUrl, functionUrl } = values;

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
    setIsRealtimeDisabled(false);
  };

  if (!isChrome && !isSafari) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#000', color: '#fff' }}>
        <h1 style={{ fontSize: '3rem', textAlign: 'center' }}>This application only supports Chrome and Safari.</h1>
      </div>
    );
  }

  return (
    <>
      {isRealtimeDisabled ? (
        <div className="max-w-screen-xl mx-auto p-8 text-center bg-gray-100">
          <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Video Options:</h2>
            <select
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {videoOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Offer URL:</h2>
            <input
              type="text"
              value={offerUrl}
              onChange={(e) => setOfferUrl(e.target.value)}
              placeholder="Enter Offer URL"
              className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold">Function URL:</h2>
            <input
              type="text"
              value={functionUrl}
              onChange={(e) => setFunctionUrl(e.target.value)}
              placeholder="Enter Function URL"
              className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <button onClick={dumpConfigAndRun} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Run</button>
          </div>
        </div>
      ) : (
        <div>{config && <RealtimeContainer config={config} />}</div>
      )}
    </>
  );
}

export default App;
