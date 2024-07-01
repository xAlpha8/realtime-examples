import { createContext, useState } from "react";

const ChatContext = createContext(null);

const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);

  return (
    <ChatContext.Provider
      value={{
      loading,
      cameraZoomed,
      setCameraZoomed,
      messages,
      setMessages
    }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatProvider };
