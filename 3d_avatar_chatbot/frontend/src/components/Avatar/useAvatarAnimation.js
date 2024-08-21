import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useState, useRef } from "react";

/**
 * Custom hook to manage avatar animations using react-three/drei's useAnimations and useGLTF.
 *
 **/
export function useAvatarAnimation() {
  // Load the animations from the GLTF model
  const { animations } = useGLTF("/models/vinay-animations.glb");

  // Create a ref for the group that will hold the animated object
  const group = useRef();
  const cameraControls = useRef();

  // Use the animations with the group reference
  const { actions, mixer } = useAnimations(animations, group);

  // Set the initial animation to "Idle" if it exists, otherwise use the first animation in the list
  const [animation, setAnimation] = useState(
    () => animations.find((a) => a.name === "Idle")?.name || animations[0]?.name
  );

  // Handle animation changes
  useEffect(() => {
    if (!actions[animation]) return;

    try {
      actions[animation]
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
        .play();
    } catch (error) {
      console.error(`Failed to play animation "${animation}":`, error);
    }

    return () => {
      try {
        actions[animation]?.fadeOut(0.5);
      } catch (error) {
        console.error(`Failed to fade out animation "${animation}":`, error);
      }
    };
  }, [animation, actions, mixer]);

  useEffect(() => {
    cameraControls.current.setLookAt(0, 1.5, 1.5, 0, 1.5, 0);
  }, []);

  return {
    group,
    cameraControls,
    setAnimation,
  };
}
