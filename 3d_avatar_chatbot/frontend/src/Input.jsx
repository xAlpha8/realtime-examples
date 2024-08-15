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
          onClick={onClickRun}
        >
          Run
        </button>
      </div>
    </div>
  );
}
