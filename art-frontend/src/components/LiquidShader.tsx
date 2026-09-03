import { useRef } from 'react';
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * GLSL Liquid Shader — Real vertex + fragment distortion.
 * Dark teal → Gold gradient with sine-wave turbulence.
 */
export default function LiquidShader() {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const mat = mesh.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -1]} scale={[1.8, 1.2, 1]}>
      <planeGeometry args={[10, 6, 128, 128]} />
      <shaderMaterial
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            vUv = uv;
            vec3 pos = position;

            pos.z += sin(pos.x * 2.0 + uTime * 0.6) * 0.25;
            pos.z += cos(pos.y * 3.0 + uTime * 0.4) * 0.2;
            pos.z += sin(pos.x * 1.5 + pos.y * 2.0 + uTime * 0.3) * 0.12;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;

          void main() {
            float wave = sin(vUv.x * 12.0 + uTime * 0.8) * 0.08;
            float wave2 = cos(vUv.y * 8.0 + uTime * 0.5) * 0.06;

            vec3 darkTeal = vec3(0.02, 0.10, 0.12);
            vec3 deepTeal = vec3(0.0, 0.35, 0.35);
            vec3 gold     = vec3(0.85, 0.65, 0.15);
            vec3 amber    = vec3(0.95, 0.75, 0.20);

            float grad = vUv.x + wave + wave2;

            vec3 color;
            if (grad < 0.35) {
              color = mix(darkTeal, deepTeal, grad / 0.35);
            } else if (grad < 0.65) {
              color = mix(deepTeal, gold, (grad - 0.35) / 0.3);
            } else {
              color = mix(gold, amber, (grad - 0.65) / 0.35);
            }

            float shimmer = sin(vUv.x * 30.0 + uTime * 2.0) * sin(vUv.y * 20.0 + uTime) * 0.06;
            color += shimmer;

            float edgeFade = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, 1.0 - vUv.x)
                           * smoothstep(0.0, 0.15, vUv.y) * smoothstep(0.0, 0.15, 1.0 - vUv.y);

            gl_FragColor = vec4(color, 0.55 * edgeFade);
          }
        `}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
