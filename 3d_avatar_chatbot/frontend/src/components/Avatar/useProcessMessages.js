import { useEffect } from "react";

/**
 * Custom hook to process incoming messages and update the avatar's state accordingly.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {boolean} params.speaking - Whether avatar is already speaking.
 * @param {React.MutableRefObject<number>} params.newAudioStartTime - Reference to the timestamp when audio started.
 * @param {Function} params.setAnimation - Function to set the current animation for the avatar.
 * @param {Function} params.setFacialExpression - Function to set the current facial expression for the avatar.
 * @param {Function} params.setLipSync - Function to set the lip sync cues for the avatar.
 * @param {Function} params.removeFirstMessage - Function to remove the first message from the message queue.
 * @param {Array<Object>} params.messages - Array of messages to process.
 */
export function useProcessMessages({
  speaking,
  newAudioStartTime,
  setAnimation,
  setFacialExpression,
  setLipSync,
  removeFirstMessage,
  messages,
}) {
  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    const message = messages[0];
    if (typeof message !== "object" || message === null) return;

    if (message.animation && setAnimation) {
      setAnimation(message.animation);
    }

    if (message.facialExpression && setFacialExpression) {
      setFacialExpression(message.facialExpression);
    }

    if (message.mouthCues && setLipSync) {
      setLipSync(message.mouthCues);
    }

    newAudioStartTime.current = new Date().getTime() / 1000;
    removeFirstMessage();
  }, [
    messages,
    setAnimation,
    setFacialExpression,
    setLipSync,
    removeFirstMessage,
    newAudioStartTime,
  ]);

  useEffect(() => {
    if (!speaking) {
      setAnimation("Idle");
      setFacialExpression("default");
    }
  }, [speaking]);
}
