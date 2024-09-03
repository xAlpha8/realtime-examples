import { useEffect } from "react";

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
  useEffect(() => {
    if (!isProcessingAudio) {
      setAnimation("Idle");
      setFacialExpression("default");
      return;
    }
    if (!Array.isArray(messages) || messages.length === 0) return;

    const message = messages[0];
    if (typeof message !== "object" || message === null) return;

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
  ]);
}
