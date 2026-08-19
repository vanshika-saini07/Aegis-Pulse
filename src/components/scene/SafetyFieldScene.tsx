import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

export type TetherStage = 0 | 1 | 2 | 3;

interface SafetyFieldSceneProps {
  progress?: number;
  stage?: TetherStage;
  className?: string;
  compact?: boolean;
}

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.1, -0.9, 0),
  new THREE.Vector3(-1.2, 0.35, 0.1),
  new THREE.Vector3(0.55, -0.25, -0.1),
  new THREE.Vector3(3.05, 0.95, 0),
]);

function JourneyBeacon({ progress, stage }: { progress: number; stage: TetherStage }) {
  const beacon = useRef<THREE.Group>(null);
  const ringOne = useRef<THREE.Mesh>(null);
  const ringTwo = useRef<THREE.Mesh>(null);
  const point = useMemo(() => curve.getPointAt(Math.min(0.72, 0.12 + progress * 0.6)), [progress]);

  useFrame(({ clock, pointer }) => {
    if (!beacon.current) return;
    const time = clock.getElapsedTime();
    beacon.current.position.lerp(point, 0.07);
    beacon.current.position.x += pointer.x * 0.08;
    beacon.current.position.y += pointer.y * 0.05 + Math.sin(time * 1.6) * 0.025;
    beacon.current.rotation.y = Math.sin(time * 0.5) * 0.12;
    if (ringOne.current) ringOne.current.rotation.z += 0.006;
    if (ringTwo.current) ringTwo.current.rotation.z -= 0.003;
  });

  const emergency = stage === 1;
  return (
    <group ref={beacon} position={point}>
      <mesh>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial color={emergency ? "#F05D4E" : "#F2B84B"} />
      </mesh>
      <mesh ref={ringOne} rotation={[0.9, 0.35, 0]}>
        <torusGeometry args={[0.4, 0.009, 8, 48]} />
        <meshBasicMaterial color="#F2B84B" transparent opacity={0.75} />
      </mesh>
      <mesh ref={ringTwo} rotation={[-0.75, 0.25, 0.3]}>
        <torusGeometry args={[0.57, 0.006, 8, 48]} />
        <meshBasicMaterial color="#8CC7A1" transparent opacity={stage > 1 ? 0.72 : 0.22} />
      </mesh>
      <pointLight color={emergency ? "#F05D4E" : "#F2B84B"} intensity={1.6} distance={3.2} />
    </group>
  );
}

function SignalTether({ stage }: { stage: TetherStage }) {
  const pulse = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const phase = (clock.getElapsedTime() * 0.13) % 1;
    pulse.current?.position.copy(curve.getPointAt(phase));
    if (material.current) material.current.opacity = stage > 1 ? 0.9 : 0.16;
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 80, 0.026, 8, false]} />
        <meshBasicMaterial ref={material} color={stage === 1 ? "#F05D4E" : "#F2B84B"} transparent opacity={0.45} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.075, 12, 12]} />
        <meshBasicMaterial color="#F1EFE6" />
      </mesh>
      {stage > 1 && (
        <mesh position={[3.05, 0.95, 0]}>
          <sphereGeometry args={[0.17, 20, 20]} />
          <meshBasicMaterial color="#8CC7A1" />
        </mesh>
      )}
    </group>
  );
}

function CheckpointNodes({ stage, compact }: { stage: TetherStage; compact: boolean }) {
  const nodes = compact ? [0.25, 0.52, 0.82] : [0.17, 0.34, 0.5, 0.67, 0.84];
  return (
    <group>
      {nodes.map((position, index) => {
        const point = curve.getPointAt(position);
        const uncertain = stage === 1 && index % 2 === 1;
        const protectedNode = stage > 1;
        return (
          <group key={position} position={point}>
            <mesh>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshBasicMaterial color={uncertain ? "#F05D4E" : protectedNode ? "#8CC7A1" : "#A7B4AA"} transparent opacity={uncertain ? 0.95 : 0.7} />
            </mesh>
            {protectedNode && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.14, 0.004, 6, 32]} />
                <meshBasicMaterial color="#8CC7A1" transparent opacity={0.52} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function SafetyField({ progress, stage, compact }: { progress: number; stage: TetherStage; compact: boolean }) {
  const field = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (!field.current) return;
    field.current.rotation.y = pointer.x * 0.1;
    field.current.rotation.x = pointer.y * 0.05;
    field.current.position.y = Math.sin(clock.getElapsedTime() * 0.35) * 0.05;
  });
  return (
    <group ref={field}>
      <JourneyBeacon progress={progress} stage={stage} />
      <SignalTether stage={stage} />
      <CheckpointNodes stage={stage} compact={compact} />
    </group>
  );
}

export function ScrollSceneController({ progress, stage, compact }: { progress: number; stage: TetherStage; compact: boolean }) {
  return <SafetyField progress={progress} stage={stage} compact={compact} />;
}

function StaticField({ stage }: { stage: TetherStage }) {
  return (
    <div className={`field-static field-static--stage-${stage}`} aria-hidden="true">
      <span className="field-static__line" />
      <span className="field-static__beacon" />
      <span className="field-static__checkpoint field-static__checkpoint--one" />
      <span className="field-static__checkpoint field-static__checkpoint--two" />
      <span className="field-static__anchor" />
    </div>
  );
}

export function SafetyFieldScene({ progress = 0, stage = 0, className = "", compact = false }: SafetyFieldSceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 700px)");
    const update = () => {
      setReducedMotion(motionQuery.matches);
      setMobile(mobileQuery.matches);
    };
    update();
    motionQuery.addEventListener("change", update);
    mobileQuery.addEventListener("change", update);
    return () => {
      motionQuery.removeEventListener("change", update);
      mobileQuery.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!container.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  if (reducedMotion) {
    return <StaticField stage={stage} />;
  }

  return (
    <div className={`safety-field-scene ${className}`} ref={container} aria-hidden="true">
      <Canvas
        dpr={[1, mobile ? 1 : 1.5]}
        frameloop={visible ? "always" : "demand"}
        camera={{ position: [0, 0, 7.4], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        fallback={<StaticField stage={stage} />}
      >
        <ambientLight intensity={0.35} />
        <ScrollSceneController progress={progress} stage={stage} compact={compact || mobile} />
      </Canvas>
    </div>
  );
}
