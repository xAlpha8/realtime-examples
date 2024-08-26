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
    <div className="p-6">
      {/* <div className="space-y-6 p-6 bg-gradient-to-r from-[#faaca8] to-[#ddd6f3] rounded-lg shadow-lg"> */}
        {/* Form Section */}
        {/* <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          Audio Options
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Audio Options
            </h2>
            <select
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
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

          Function URL
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Function URL
            </h2>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 transition"
              value={functionUrl}
              onChange={(e) => setFunctionUrl(e.target.value)}
              placeholder="Enter Function URL"
            />
          </div>
        </div> */}

        {/* Run Button */}
        {/* <div> */}
          <button
            className="w-full bg-pink-500 hover:bg-pink-600 text-white p-3 font-semibold uppercase rounded-md shadow-md transition"
            onClick={onClickRun}
          >
            Connect
          </button>
        {/* </div> */}
      {/* </div> */}
    </div>
  );
}
