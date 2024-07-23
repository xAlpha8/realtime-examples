import { useConfig } from "@adaptai/realtime-react";

const ConnectionConfigPanel = ({ handleRun }) => {
  const configDefault = {
    functionUrl:
      "https://infra.getadapt.ai/run/dd0b40c2acb71ad19e0b62e865eaa1e9",
    offerUrl: "",
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

  const { options, setters, values, dump: dumpConfigObject } = useConfig(configDefault);
  const { audioOptions } = options;
  const { setAudioInput, setFunctionUrl } = setters;
  const { audioInput, functionUrl } = values;

  return (
    <div>
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
              onClick={() => handleRun(dumpConfigObject())}
            >
              Run
            </button>
          </div>
    </div>
  )
}

export { ConnectionConfigPanel }