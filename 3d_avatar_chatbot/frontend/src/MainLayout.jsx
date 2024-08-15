import React, { useEffect, useState } from "react";
import { RealtimeComponent } from "./RealtimeComponent";
import { Canvas } from "@react-three/fiber";
import { Avatar } from "./components/Avatar";
import { MessageInput } from "./MessageInput";
import { useMessage } from "./hooks/useMessage";

/**
 * Main layout component for the app.
 *
 * @param {Object} props - The component properties.
 * @param {Object} props.config - The current config for the RealtimeComponent.
 * @returns {JSX.Element} The rendered layout.
 */
export function MainLayout({ config }) {
  const [connection, setConnection] = useState(null);

  const { messages, ref, removeFirstMessage, sendMessage } = useMessage({
    connection,
  });

  return (
    <div className="flex-1">
      <RealtimeComponent config={config} setConnection={setConnection} />
      {connection && <MessageInput inputRef={ref} sendMessage={sendMessage} />}
      <Canvas shadows camera={{ position: [0, 0, 1], fov: 30 }}>
        <Avatar messages={messages} removeFirstMessage={removeFirstMessage} />
      </Canvas>
    </div>
  );
}
