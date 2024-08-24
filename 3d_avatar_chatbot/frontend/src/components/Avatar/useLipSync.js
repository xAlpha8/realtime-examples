import { useState, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { lerpMorphTarget } from "../../utils/morph";
import { MAP_RHUBARB_VISEME_ID_TO_AVATAR_MESH } from "../../constants/avatar";

/**
 * Custom hook to manage lip sync for an avatar based on audio cues.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {THREE.Scene} params.scene - The Three.js scene containing the avatar.
 * @param {React.MutableRefObject<number>} params.newAudioStartTime - Reference to the timestamp when audio started.
 */
export function useLipSync({ scene, newAudioStartTime }) {
  const [lipSync, setLipSync] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  useFrame(() => {
    const appliedMorphTargets = [];

    if (lipSync.length > 0 && newAudioStartTime.current) {
      setSpeaking(true);
      const currentAudioTime =
        new Date().getTime() / 1000 - newAudioStartTime.current;

      if (currentAudioTime >= 0) {
        lipSync.forEach((mouthCue) => {
          if (
            currentAudioTime >= mouthCue.start &&
            currentAudioTime < mouthCue.end
          ) {
            const target = MAP_RHUBARB_VISEME_ID_TO_AVATAR_MESH[mouthCue.value];
            if (target) {
              appliedMorphTargets.push(target);
              lerpMorphTarget(scene, target, 1, 0.2);
            }
          }
        });

        if (appliedMorphTargets.length === 0) setSpeaking(false);
      }
    } else if (speaking) {
      setSpeaking(false);
    }

    // Reset morph targets that are not currently being applied
    Object.values(MAP_MESSAGE_CUES_TO_AVATAR_MESH).forEach((value) => {
      if (!appliedMorphTargets.includes(value)) {
        lerpMorphTarget(scene, value, 0, 0.1);
      }
    });
  });

  return {
    speaking,
    lipSync,
    setLipSync,
  };
}
