/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.2.3 public/models/64f1a714fe61576b46f27ca2.glb -o src/components/Avatar.jsx -k -r public
*/
import { CameraControls, ContactShadows, Environment } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import React, { Suspense, useRef } from "react";
import { Dots } from "./Dots";
import { useFacialExpression } from "./useFacialExpression";
import { useLipSync } from "./useLipSync";
import { useProcessMessages } from "./useProcessMessages";
import { useAvatarAnimation } from "./useAvatarAnimation";

/**
 * Avatar component renders a 3D avatar model with animations, facial expressions, and lip sync.
 *
 * @param {Object} props - The component props.
 * @param {Array} props.messages - Array of message objects for controlling animations, facial expressions, and lip sync.
 * @param {Function} props.removeFirstMessage - Function to remove the first message after processing.
 * @param {boolean} props.isLoading - Boolean indicating if the model is still loading.
 * @param {...Object} rest - Additional props to be spread to the root group element.
 * @returns {JSX.Element} The rendered Avatar component.
 */
export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF(
    "/models/64f1a714fe61576b46f27ca2.glb"
  );
  const {
    messages,
    removeFirstMessage,
    isLoading,
    newAudioStartTime,
    ...rest
  } = props;

  const { speaking, setLipSync } = useLipSync({ scene, newAudioStartTime });
  const { group, cameraControls, setAnimation } = useAvatarAnimation();
  const { setFacialExpression } = useFacialExpression({ scene, nodes });

  useProcessMessages({
    messages,
    newAudioStartTime,
    removeFirstMessage,
    speaking,
    setAnimation,
    setFacialExpression,
    setLipSync,
  });

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      {/* Wrapping Dots into Suspense to prevent Blink when Troika/Font is loaded */}
      <Suspense>
        <Dots loading={isLoading} position-y={1.75} position-x={-0.02} />
      </Suspense>
      <group {...rest} dispose={null} ref={group}>
        <primitive object={nodes.Hips} />
        <skinnedMesh
          name="Wolf3D_Body"
          geometry={nodes.Wolf3D_Body.geometry}
          material={materials.Wolf3D_Body}
          skeleton={nodes.Wolf3D_Body.skeleton}
        />
        <skinnedMesh
          name="Wolf3D_Outfit_Bottom"
          geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
          material={materials.Wolf3D_Outfit_Bottom}
          skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
        />
        <skinnedMesh
          name="Wolf3D_Outfit_Footwear"
          geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
          material={materials.Wolf3D_Outfit_Footwear}
          skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
        />
        <skinnedMesh
          name="Wolf3D_Outfit_Top"
          geometry={nodes.Wolf3D_Outfit_Top.geometry}
          material={materials.Wolf3D_Outfit_Top}
          skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
        />
        <skinnedMesh
          name="Wolf3D_Hair"
          geometry={nodes.Wolf3D_Hair.geometry}
          material={materials.Wolf3D_Hair}
          skeleton={nodes.Wolf3D_Hair.skeleton}
        />
        <skinnedMesh
          name="EyeLeft"
          geometry={nodes.EyeLeft.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeLeft.skeleton}
          morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
        />
        <skinnedMesh
          name="EyeRight"
          geometry={nodes.EyeRight.geometry}
          material={materials.Wolf3D_Eye}
          skeleton={nodes.EyeRight.skeleton}
          morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
          morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
        />
        <skinnedMesh
          name="Wolf3D_Head"
          geometry={nodes.Wolf3D_Head.geometry}
          material={materials.Wolf3D_Skin}
          skeleton={nodes.Wolf3D_Head.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
        />
        <skinnedMesh
          name="Wolf3D_Teeth"
          geometry={nodes.Wolf3D_Teeth.geometry}
          material={materials.Wolf3D_Teeth}
          skeleton={nodes.Wolf3D_Teeth.skeleton}
          morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
          morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
        />
      </group>
      <ContactShadows opacity={0.7} />
    </>
  );
}

// Preload GLTF models to improve performance
useGLTF.preload("/models/64f1a714fe61576b46f27ca2.glb");
useGLTF.preload("/models/animations.glb");
