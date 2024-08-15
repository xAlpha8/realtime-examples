import React from "react";

/**
 * A form component for configuring audio input options and function URL.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Array<{ value: string, label: string }>} props.audioOptions - List of audio options to select from.
 * @param {string} props.audioInput - The currently selected audio input value.
 * @param {function} props.setAudioInput - Function to update the selected audio input value.
 * @param {string} props.functionUrl - The current function URL.
 * @param {function} props.setFunctionUrl - Function to update the function URL.
 * @param {function} props.onClickRun - Callback function to execute when the "Run" button is clicked.
 * @returns {JSX.Element} The rendered input form component.
 */
export function InputForm(props) {
  const {
    audioOptions,
    audioInput,
    setAudioInput,
    functionUrl,
    setFunctionUrl,
    onClickRun,
  } = props;

  return (
    <div className="space-y-4">
      {/* Audio Options Section */}
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

      {/* Function URL Input Section */}
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

      {/* Run Button Section */}
      <div>
        <button
          className="bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md"
          onClick={onClickRun}
        >
          Run
        </button>
      </div>
    </div>
  );
}
