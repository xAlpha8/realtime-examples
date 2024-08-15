import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FACIAL_EXPRESSIONS } from "../../constants/avatar";
import { lerpMorphTarget } from "../../utils/morph";

/**
 * A custom hook to manage facial expressions and eye animations for a 3D avatar.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {THREE.Scene} params.scene - The 3D scene containing the avatar.
 * @param {Object} params.nodes - The 3D model nodes, including morph targets.
 * @param {boolean} params.setupMode - A flag indicating whether the avatar is in setup mode.
 */
export function useFacialExpression({ scene, nodes, setupMode }) {
  const [facialExpression, setFacialExpression] = useState("");
  const [blink, setBlink] = useState(false);
  const [winkLeft, setWinkLeft] = useState(false);
  const [winkRight, setWinkRight] = useState(false);
  const blinkTimeoutRef = useRef(null);

  useFrame(() => {
    if (!setupMode && nodes?.EyeLeft?.morphTargetDictionary) {
      const mapping = FACIAL_EXPRESSIONS[facialExpression] || {};

      Object.keys(nodes.EyeLeft.morphTargetDictionary).forEach((key) => {
        if (key !== "eyeBlinkLeft" && key !== "eyeBlinkRight") {
          lerpMorphTarget(scene, key, mapping[key] || 0, 0.1);
        }
      });

      lerpMorphTarget(scene, "eyeBlinkLeft", blink || winkLeft ? 1 : 0, 0.5);
      lerpMorphTarget(scene, "eyeBlinkRight", blink || winkRight ? 1 : 0, 0.5);
    }
  });

  useEffect(() => {
    // Helper function to start the blinking process
    const startBlinking = () => {
      const blinkDuration = 200; // Duration of the blink
      const minBlinkDelay = 1000; // Minimum delay before the next blink
      const maxBlinkDelay = 5000; // Maximum delay before the next blink

      setBlink(true);
      blinkTimeoutRef.current = setTimeout(() => {
        setBlink(false);
        // Schedule the next blink after the current blink duration
        blinkTimeoutRef.current = setTimeout(
          startBlinking,
          THREE.MathUtils.randInt(minBlinkDelay, maxBlinkDelay)
        );
      }, blinkDuration);
    };

    // Start the blinking process
    startBlinking();

    // Cleanup function to clear timeouts when the component unmounts
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [setBlink]);

  return {
    setBlink,
    setWinkLeft,
    setWinkRight,
    setFacialExpression,
  };
}
