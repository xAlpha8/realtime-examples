import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../utils/logger";

export function useMessage(props) {
  const { connection } = props;

  const [messages, setMessages] = useState([]);
  const ref = useRef(null);

  function removeFirstMessage() {
    setMessages((prev) => prev.slice(1));
  }

  function sendMessage() {
    if (!ref.current) {
      console.error(
        "Send message is called without setting ref to an input element."
      );
      return;
    }

    const text = ref.current.value;

    if (text) {
      logger("[useMessage - sendMessage]", text);
      connection.send(text);
      ref.current.value = "";
    }
  }

  const onMessage = useCallback(
    (event) => {
      const msg = JSON.parse(event.data);
      setMessages((prev) => [...prev, msg]);
      logger("[useMessage - onMessage]", msg);
    },
    [setMessages]
  );

  useEffect(() => {
    if (!connection) {
      return;
    }

    connection.on("message", onMessage);

    return () => {
      if (connection) {
        connection.off("message", onMessage);
      }
    };
  }, [connection, onMessage]);

  return {
    messages,
    removeFirstMessage,
    sendMessage,
    ref,
  };
}
