import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../utils/logger";

/**
 * A custom hook to manage messaging logic within a WebSocket or similar connection.
 *
 * @param {Object} props - The properties for the hook.
 * @param {Object} props.connection - An instance of RealtimeConnection.
 * @returns {Object} - An object containing message management functions and state.
 */
export function useMessage(props) {
  const { connection } = props;

  const [messages, setMessages] = useState([]); // State to store the list of messages
  const ref = useRef(null); // Reference to the input element for sending messages

  /**
   * Removes the first message in the messages array.
   */
  function removeFirstMessage() {
    setMessages((prev) => prev.slice(1));
  }

  /**
   * Sends a message through the connection and clears the input field.
   * Logs an error if the ref is not set to an input element.
   */
  function sendMessage() {
    if (!ref.current) {
      logger(
        "[useMessage - sendMessage]",
        "Send message is called without setting ref to an input element."
      );
      return;
    }

    const text = ref.current.value;

    if (text) {
      logger("[useMessage - sendMessage]", text); // Log the message being sent
      connection.send(text); // Send the message through the connection
      ref.current.value = ""; // Clear the input field
    }
  }

  /**
   * Handles incoming messages by parsing the data and updating the messages state.
   */
  const onMessage = useCallback(
    (event) => {
      const msg = JSON.parse(event.data); // Parse the incoming message
      setMessages((prev) => [...prev, msg]); // Add the message to the messages array
      logger("[useMessage - onMessage]", msg); // Log the received message
    },
    [setMessages]
  );

  // Set up and clean up the connection's message listener
  useEffect(() => {
    if (!connection) {
      return;
    }

    connection.on("message", onMessage); // Attach the message listener

    return () => {
      if (connection) {
        connection.off("message", onMessage); // Detach the message listener on cleanup
      }
    };
  }, [connection, onMessage]);

  return {
    messages, // Array of messages
    removeFirstMessage, // Function to remove the first message
    sendMessage, // Function to send a new message
    ref, // Reference to the input element
  };
}
