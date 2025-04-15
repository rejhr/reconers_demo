import React, { useRef } from "react";
import * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  useGLTF,
  AccumulativeShadows,
  RandomizedLight,
  Environment,
  OrbitControls,
  Center,
  Caustics,
  CubeCamera,
  MeshRefractionMaterial,
  useHelper,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { RGBELoader } from "three-stdlib";
import { useControls } from "leva";

//--------------------------------------
// 3D Canvas Render
//--------------------------------------
export default function Render() {
  return (
    <Canvas
      eventSource={document.getElementById("root")}
      eventPrefix="client"
      shadows
      dpr={[1, 2]}
      gl={{
        localClippingEnabled: true,
        preserveDrawingBuffer: true,
        alpha: true,
        depth: true,
      }}
      camera={{
        position: [5, 5, 5],
        fov: 25,
      }}
    >
      <color attach="background" args={["#e0e0e0"]} />
      <SceneLights />
      <group>
        <Center top>
          <Symbol />
        </Center>
        <AccumulativeShadows
          temporal
          frames={100}
          alphaTest={0.9}
          color={"#9edeff"}
          colorBlend={2}
          opacity={1}
          scale={20}
        >
          <RandomizedLight
            radius={10}
            ambient={0.5}
            intensity={Math.PI}
            position={[5, 5, -2.5]}
            bias={0.001}
          />
        </AccumulativeShadows>
      </group>
      <OrbitControls
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.05}
        makeDefault
      />
      <Environment
        files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr"
        backgroundBlurriness={1}
      />
      {/* 화사한 빛 효과 후처리 */}
      {/* <EffectComposer>
        <Bloom
          luminanceThreshold={4}
          luminanceSmoothing={0.1}
          intensity={0.7}
          levels={3}
          mipmapBlur
        />
      </EffectComposer> */}
    </Canvas>
  );
}

//--------------------------------------
// Lights
//--------------------------------------
function SceneLights() {
  const spotRef = useRef();
  const pointRef = useRef();
  const dirRef = useRef();

  // spotLight cone 표시
  useHelper(spotRef, THREE.SpotLightHelper, "cyan");

  // pointLight sphere 표시
  useHelper(pointRef, THREE.PointLightHelper, 1, "hotpink");

  // directionalLight direction 표시
  useHelper(dirRef, THREE.DirectionalLightHelper, 3, "yellow");

  return (
    <>
      <spotLight
        ref={spotRef}
        position={[5, 10, 5]}
        angle={0.3}
        intensity={10}
        penumbra={1}
        castShadow
      />
      <pointLight
        ref={pointRef}
        position={[5, 10, 4]}
        intensity={5}
        castShadow
      />
      <directionalLight
        ref={dirRef}
        position={[-10, 10, -10]}
        intensity={2}
        castShadow
      />
    </>
  );
}

//--------------------------------------
// Mesh
//--------------------------------------
export function Symbol({ props }) {
  const ref = useRef();

  // Mesh 공통 속성을 Compornent로 설정
  function SymbolGeometry({ side = "outside", children, ...props }) {
    // 3D 파일(.glb) 불러오기
    const { nodes } = useGLTF("/reconers_v5_split.glb");
    // glb 파일은 아래 두개 mesh를 가진 이중 구조(shell)입니다.
    // 'outside' 가장 바깥 mesh로 내부 요소 굴절 재질(MeshTrasmissionMaterial)을 적용
    // 'inside' 안쪽 mesh로 빛 굴절 및 반사 재질(MeshRefractionMaterial)을 적용
    // inside는 blender solidify를 활용해 Outside보다 약간 작은 내부 mesh를 생성하고 겉면을 Inside face로 설정했습니다.

    const geometry =
      // 이중 구조의 mesh를 geometry의 side = inside || outside로 구분
      side === "inside" ? nodes.inside.geometry : nodes.outside.geometry;

    // Three.js Mesh 설정
    return (
      <mesh
        geometry={geometry}
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
        rotation={[0, 0, 0]}
        // Mesh별 추가 속성 및 재질을 설정할 수 있도록 설정
        {...props}
      >
        {children}
      </mesh>
    );
  }

  // MeshRefractionMaterial의 빛 산란 효과를 위한 Texture hdr 불러오기
  const texture = useLoader(
    RGBELoader,
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr"
  );

  const config = useControls({
    meshPhysicalMaterial: false,
    transmissionSampler: true,
    backside: true,
    samples: { value: 10, min: 1, max: 32, step: 1 },
    resolution: { value: 2048, min: 256, max: 2048, step: 256 },
    transmission: { value: 0.8, min: 0, max: 1 },
    roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    thickness: { value: 0.5, min: 0, max: 10, step: 0.01 },
    ior: { value: 1.5, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 0.01, min: 0, max: 1 },
    anisotropy: { value: 0.1, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.3, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.0, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 1, min: 0, max: 1 },
    attenuationDistance: { value: 0.5, min: 0, max: 10, step: 0.01 },
    attenuationColor: "#ffffff",
    color: "#a9deff",
    darkerColor: "#11354b",
    brighterColor: "#ecf4ff",
  });

  return (
    // Render될 Mesh 설정
    <group dispose={null}>
      {/* 내부 MeshRefractionMaterial의 빛 산란 효과를 위한 CubeCamera */}
      <CubeCamera resolution={256} frames={1} envMap={texture}>
        {(texture) => (
          // 투명한 재질의 그림자 내부 빛 산란 효과를 위한 Caustics
          <Caustics
            toneMapped={false}
            color={config.Color}
            lightSource={[14, 30, -20]}
            worldRadius={0.18}
            ior={2}
            backfaceIor={1.5}
            intensity={0.1}
          >
            {/* 안쪽에서 빛을 굴절 및 반사하는 요소 */}
            <SymbolGeometry ref={ref} side="inside" renderOrder={0}>
              <MeshRefractionMaterial
                // transparent
                envMap={texture}
                emissive={"#ffffff"}
                emissiveIntensity={0.2}
                bounces={3}
                aberrationStrength={0.04}
                ior={2}
                fresnel={0.4}
                color={config.brighterColor}
              />
            </SymbolGeometry>

            {/* 바깥쪽을 감싸는 내부 요소 굴절 요소 */}
            <SymbolGeometry side="outside" castShadow>
              <MeshTransmissionMaterial {...config} />
            </SymbolGeometry>
          </Caustics>
        )}
      </CubeCamera>
      {/* <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial transparent opacity={1} />
      </mesh> */}
    </group>
  );
}
