import * as THREE from "three";

export function lerpMorphTarget(scene, target, value, speed = 0.1) {
  scene.traverse((child) => {
    if (child.isSkinnedMesh && child?.morphTargetDictionary) {
      const index = child?.morphTargetDictionary[target];
      if (
        index === undefined ||
        child.morphTargetInfluences[index] === undefined
      ) {
        return;
      }
      child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
        child.morphTargetInfluences[index],
        value,
        speed
      );
    }
  });
}
