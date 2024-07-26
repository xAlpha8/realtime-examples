import { createContext, useState, useRef } from "react";

const ChatContext = createContext(null);

const ChatProvider = ({ children, connection }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const newAudioStartTime = useRef(null);

  return (
    <ChatContext.Provider
      value={{
        loading,
        cameraZoomed,
        setCameraZoomed,
        messages,
        setMessages,
        newAudioStartTime,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatProvider };
