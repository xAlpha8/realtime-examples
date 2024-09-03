import React from "react";

export function Mic(props) {
  const { isActive = true, setIsActive, isProcessingAudio } = props;

  return (
    <div className="my-4">
      <button
        onClick={() => setIsActive(!isActive)}
        disabled={isProcessingAudio}
        className={
          "p-2 rounded-full " +
          (isActive
            ? "bg-pink-500 hover:bg-pink-600"
            : "bg-gray-400 hover:bg-gray-600")
        }
        aria-label="Start recording"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
          {!isActive && (
            <line x1="24" y1="0" x2="0" y2="24" stroke="#fff" strokeWidth={3} />
          )}
        </svg>
      </button>
    </div>
  );
}
