import React, { useEffect } from "react";
import { ConnectionStatusOverlay } from "./ConnectionStatusOverlay";
import { useRealtime, RtAudio } from "@adaptai/realtime-react";

/**
 * A component that manages a real-time connection and displays an overlay
 * while connecting.
 *
 * @param {Object} props - The component properties.
 * @param {Object} props.config - Configuration object for the real-time connection.
 * @param {Function} props.setConnection - Callback to set the real-time connection.
 * @returns {JSX.Element} The rendered component.
 */
export function RealtimeComponent({ config, setConnection }) {
  const { isConnected, connection } = useRealtime(config);

  useEffect(() => {
    connection.connect();
    setConnection(connection);
  }, []);

  return (
    <>
      {!isConnected && <ConnectionStatusOverlay />}
      <div className="hidden">
        <RtAudio rtConnection={connection} />
      </div>
    </>
  );
}
