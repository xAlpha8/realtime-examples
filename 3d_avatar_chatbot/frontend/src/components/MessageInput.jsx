import React from "react";

/**
 * Component for message input and send button.
 *
 * @param {Object} props - The component properties.
 * @param {React.RefObject} props.inputRef - Ref object for the input field.
 * @param {Function} props.sendMessage - Function to send the message.
 * @returns {JSX.Element} The rendered input and button.
 */
export function MessageInput({ inputRef, sendMessage, isProcessingAudio }) {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
        <input
          className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
          placeholder="Type a message..."
          ref={inputRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          disabled={isProcessingAudio}
        />
        <button
          onClick={sendMessage}
          className="bg-pink-500 hover:bg-pink-600 text-white p-4 px-10 font-semibold uppercase rounded-md"
          disabled={isProcessingAudio}
        >
          Send
        </button>
      </div>
    </div>
  );
}
