import React from "react";

/**
 * Component to display a connection status overlay.
 *
 * @returns {JSX.Element} The rendered overlay.
 */
export function ConnectionStatusOverlay() {
  return (
    <div className="fixed top-0 left-0 inset-0 bg-black bg-opacity-50 z-[9999]">
      <div className="flex flex-col items-center h-screen">
        <l-square
          size="160"
          stroke="5"
          stroke-length="0.25"
          bg-opacity="0.1"
          speed="2"
          color="#ddd"
        ></l-square>
        <div className="text-white text-3xl m-5">Connecting</div>
      </div>
    </div>
  );
}
