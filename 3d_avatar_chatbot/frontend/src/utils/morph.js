import * as THREE from "three";

/**
 * Linearly interpolates the morph target influence for a given target on all skinned meshes within the scene.
 *
 * @param {THREE.Scene} scene - The Three.js scene containing the skinned meshes.
 * @param {string} target - The name of the morph target to interpolate.
 * @param {number} value - The target value to interpolate towards.
 * @param {number} [speed=0.1] - The interpolation speed, where 0 is no change and 1 is instant change.
 */
export function lerpMorphTarget(scene, target, value, speed = 0.1) {
  scene.traverse((child) => {
    // Ensure the object is a skinned mesh with morph targets
    if (!child.isSkinnedMesh || !child.morphTargetDictionary) return;

    // Get the index of the specified morph target
    const index = child.morphTargetDictionary[target];

    // If the morph target exists, interpolate its influence value
    if (index !== undefined) {
      const currentInfluence = child.morphTargetInfluences[index];

      // Ensure the current influence value is valid before interpolating
      if (currentInfluence !== undefined) {
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          currentInfluence,
          value,
          speed
        );
      }
    }
  });
}
