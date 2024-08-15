import React, { useState } from "react";
import { useConfig } from "@adaptai/realtime-react";
import { DEFAULT_CONFIG } from "./constants/config";
import { MainLayout } from "./MainLayout";
import { InputForm } from "./Input";

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

  return (
    <div className="h-screen w-screen m-0 bg-[#faaca8] bg-gradient-to-r from-[#faaca8] to-[#ddd6f3] overflow-hidden flex flex-col">
      <InputForm
        audioOptions={audioOptions}
        audioInput={audioInput}
        setAudioInput={setAudioInput}
        functionUrl={functionUrl}
        setFunctionUrl={setFunctionUrl}
        onClickRun={() => setConfig(dump())}
      />
      {config && <MainLayout config={config} />}
    </div>
  );
}

export default App;
