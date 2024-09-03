import { useEffect, useState } from "react";

/**
 * Custom hook to process incoming messages and update the avatar's state accordingly.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {boolean} params.speaking - Whether avatar is already speaking.
 * @param {Function} params.setAnimation - Function to set the current animation for the avatar.
 * @param {Function} params.setFacialExpression - Function to set the current facial expression for the avatar.
 * @param {Function} params.setLipSync - Function to set the lip sync cues for the avatar.
 * @param {Function} params.removeFirstMessage - Function to remove the first message from the message queue.
 * @param {Array<Object>} params.messages - Array of messages to process.
 */
export function useProcessMessages({
  speaking,
  setAnimation,
  setFacialExpression,
  setLipSync,
  removeFirstMessage,
  messages,
  isProcessingAudio,
}) {
  const [contextId, setContextId] = useState(null);

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;
    if (!isProcessingAudio) {
      console.log("Setting idle state");
      setAnimation("Idle");
      setFacialExpression("default");
      setContextId(null);
      return;
    }

    const message = messages[0];
    if (typeof message !== "object" || message === null) return;

    if (contextId && message.context_id !== contextId) {
      console.log("Skipping message");
      return;
    }
    if (!contextId) {
      console.log("Setting context id", message.context_id);
      setContextId(message.context_id);
    }
    if (message.animation && setAnimation) {
      console.log("Processing message", message);
      setAnimation(message.animation);
    }

    if (message.facialExpression && setFacialExpression) {
      setFacialExpression(message.facialExpression);
    }

    if (message.mouthCues && setLipSync) {
      setLipSync(message.mouthCues);
    }

    removeFirstMessage();
  }, [
    messages,
    setAnimation,
    setFacialExpression,
    setLipSync,
    removeFirstMessage,
    isProcessingAudio,
    contextId,
  ]);
}
