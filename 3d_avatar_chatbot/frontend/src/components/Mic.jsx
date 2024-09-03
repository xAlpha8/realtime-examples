import React from "react";

/**
 * Mic component for audio recording control
 * @param {Object} props - Component props
 * @param {boolean} props.isActive - Whether the mic is active
 * @param {function} props.setIsActive - Function to toggle mic active state
 * @param {boolean} props.isProcessingAudio - Whether audio is being processed
 */
export function Mic({ isActive = true, setIsActive, isProcessingAudio }) {
  return (
    // Position the mic at the bottom center
    <div className="fixed bottom-40 left-1/4 transform -translate-x-1/2">
      <button
        onClick={() => setIsActive(!isActive)}
        disabled={isProcessingAudio}
        className={`p-4 rounded-full ${
          isActive
            ? "bg-pink-500 hover:bg-pink-600"
            : "bg-gray-400 hover:bg-gray-600"
        }`}
        aria-label="Toggle recording"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          // Increase the size of the icon
          className="h-12 w-12 text-white"
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
