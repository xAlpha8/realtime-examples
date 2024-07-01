import { useState, useEffect } from "react";
import { useConfig, useRealtime } from "@adaptai/realtime-react";
import { Config } from "@adaptai/realtime-react";
import { RtVideo, RtAudio, RtChat } from "@adaptai/realtime-react";
import { isChrome, isSafari } from "react-device-detect";
import forwardIcon from "./icons/noun-forward.svg";
import arrowIcon from "./icons/noun-pixel-arrow.svg";
import crossIcon from "./icons/noun-pixel-cross.svg";
import settingsIconDark from "./icons/noun-pixel-cog-dark.svg";
import { RtAudioVisualizer } from "@adaptai/realtime-react";

const RealtimeContainer = ({
  config,
  setConnection,
  setIsConnected,
}: {
  config: Config;
  setConnection: (connection: Connection) => void;
  setIsConnected: (isConnected: boolean) => void;
}) => {
  if (!config) {
    setConnection(null);
    setIsConnected(false);
    return;
  }
  console.log("config", config);
  const { connection, isConnected } = useRealtime(config);
  setConnection(connection);
  setIsConnected(isConnected);
};

function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const configDefault: Config = {
    functionUrl: "",
    offerUrl: "",
    isDataEnabled: true,
    dataParameters: { ordered: true },
    isVideoEnabled: true,
    videoInput: "",
    videoCodec: "default",
    videoResolution: "1280x720",
    videoTransform: "none",
    isScreenShareEnabled: false,
    isAudioEnabled: true,
    audioInput: "",
    audioCodec: "PCMU/8000",
    useStun: false,
  };

  const { options, setters, values, dump } = useConfig(configDefault);
  const { audioOptions, videoOptions, videoResolutionOptions } = options;
  const {
    setAudioInput,
    setVideoInput,
    setOfferUrl,
    setFunctionUrl,
    setVideoResolution,
    setIsScreenShareEnabled,
    setIsDataEnabled,
  } = setters;
  const {
    audioInput,
    videoInput,
    offerUrl,
    functionUrl,
    videoResolution,
    isDataEnabled,
    isScreenShareEnabled,
  } = values;
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const dumpConfigAndRun = () => {
    const configDump = dump();
    setConfig(configDump);
  };
  useEffect(() => {
    if (connection && !isConnected) {
      connection.connect();
    }
  }, [connection]);

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
      <div>
        {config && (
          <RealtimeContainer
            config={config}
            setConnection={setConnection}
            setIsConnected={setIsConnected}
          />
        )}
      </div>{" "}
      <div id="realtime-container" className="md:h-screen">
        {/* <!-- Modal --> */}
        <dialog className="nes-dialog" id="settings-modal">
          <form method="dialog">
            <div
              id="select-input-form-header"
              className="text-lg text-center mb-4"
            >
              <p>Select Inputs</p>
            </div>
            <div className="mb-4 text-sm">
              <div className="nes-field">
                <label htmlFor="fnurl_field">Function URL</label>
                <input
                  type="text"
                  value={functionUrl}
                  onChange={(e) => setFunctionUrl(e.target.value)}
                  placeholder="Enter Function URL"
                  className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="mb-4 text-sm">
              <div className="nes-field">
                <label htmlFor="offerurl_field">Offer URL</label>
                <input
                  type="text"
                  value={offerUrl}
                  onChange={(e) => setOfferUrl(e.target.value)}
                  placeholder="Enter Offer URL"
                  className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
            <div className="mb-4 text-sm">
              <label htmlFor="audio-select">Select Audio Input</label>
              <div className="nes-select">
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
            </div>
            <div className="mb-4 text-sm">
              <label htmlFor="video-select">Select Video Input</label>
              <div className="nes-select">
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
            </div>
            <div className="mb-4 text-sm">
              <label htmlFor="resolution-select">Select Video Resolution</label>
              <div className="nes-select">
                <select
                  id="resolution-select"
                  value={videoResolution}
                  onChange={(e) => setVideoResolution(e.target.value)}
                >
                  {videoResolutionOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label>
                <input
                  type="checkbox"
                  className="nes-checkbox"
                  id="use-datachannel"
                  checked={isScreenShareEnabled}
                  onChange={(e) => setIsScreenShareEnabled(e.target.checked)}
                />
                <span>Enable Screen Share</span>
              </label>
              {/* <label>
                <input type="checkbox" className="nes-checkbox" id="use-stun" />
                <span>Enable Stun</span>
              </label> */}
            </div>
            <menu className="dialog-menu flex flex-row gap-4">
              <button className="nes-btn">Close</button>
            </menu>
          </form>
        </dialog>

        {/* <!-- Header --> */}
        <div className="max-h-48 p-4 flex justify-between items-center">
          <div className="flex gap-1 items-center">
            <h1 className="text-xl font-bold">Realtime</h1>
            <img src={forwardIcon} className="h-8" alt="Realtime logo" />
          </div>
          <div className="flex gap-1 items-center">
            <button
              type="button"
              className="nes-btn is-warning p-0"
              id="settings-button"
              onClick={() => {
                document.getElementById("settings-modal").showModal();
              }}
            >
              <img src={settingsIconDark} className="h-8" alt="Open Settings" />
            </button>
            <button
              type="button"
              className="nes-btn is-primary p-0 sm:hidden"
              id="start-button-sm"
            >
              <img src={arrowIcon} className="h-8" alt="Start Program" />
            </button>
            <button
              type="button"
              className="nes-btn is-primary sm:inline-block hidden"
              id="start-button"
              onClick={dumpConfigAndRun}
            >
              Start
            </button>
            <button
              type="button"
              className="nes-btn is-error p-0 sm:hidden hidden"
              id="stop-button-sm"
            >
              <img src={crossIcon} className="h-8" alt="Stop Program" />
            </button>
            <button
              type="button"
              className="nes-btn is-error sm:inline-block hidden"
              id="stop-button"
            >
              Stop
            </button>
          </div>
        </div>

        {/* <!-- Main Content --> */}
        <div className="grid grid-cols-4 grid-rows-4 md:grid-rows-2 gap-4 md:h-5/6 mx-4 h-[48rem]">
          <div
            className="col-span-4 md:col-span-3 row-span-2 border border-solid  border-black rounded-md flex justify-center items-center overflow-hidden"
            id="video-container"
          >
            <div
              className="nes-text is-disabled media-container-label"
              hidden={isConnected}
            >
              Video
            </div>
            {config &&
              (isConnected ? (
                <RtVideo rtConnection={connection} />
              ) : (
                <>Connecting!</>
              ))}
          </div>

          {/* <!-- Top Right Section --> */}
          <div className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col">
            <div
              id="audio-container"
              className="h-full flex items-center justify-center"
            >
              <div
                className="nes-text is-disabled media-container-label"
                hidden={isConnected}
              >
                Audio
              </div>
              <div id="audio-visualizer-container" className="h-full">
                {config &&
                  (isConnected ? (
                    <>
                      <RtAudio rtConnection={connection} />
                      <RtAudioVisualizer
                        rtConnection={connection}
                        height={400}
                        width={200}
                      />
                    </>
                  ) : (
                    <>Connecting!</>
                  ))}
              </div>
            </div>
          </div>

          {/* <!-- Bottom Right Section --> */}
          <div className="col-span-4 md:col-span-1 row-span-1 border border-solid hover:border-dashed border-black rounded-md flex flex-col">
            <section
              id="chat-container"
              className="nes-container p-0 border-0 overflow-y-scroll h-full flex justify-center items-center"
            >
              <div
                className="nes-text is-disabled media-container-label"
                hidden={isConnected}
              >
                Chat
              </div>
              {config &&
                (isConnected ? (
                  <RtChat rtConnection={connection} />
                ) : (
                  <>Connecting!</>
                ))}
            </section>
          </div>
        </div>

        {/* <!-- Footer --> */}
        <div className="max-h-48 p-4 flex justify-center gap-4 items-center">
          <div>
            <p className="text-sm">$ realtime deploy</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
