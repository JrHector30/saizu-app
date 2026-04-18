import React, { Suspense, useRef, useEffect, useState, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, CameraControls } from '@react-three/drei';
import { useSuitcase } from '../context/SuitcaseContext';
import AvatarModel, { ModelErrorBoundary } from './AvatarModel';

// Manages the "GTA style" camera tweening based on current zone
const CameraAnimator = memo(({ activeZone }) => {
  const controlsRef = useRef();

  useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;

    switch (activeZone) {
      case 'head':   ctrl.setLookAt(0, 1.9, 1.5,  0, 1.9,  0, true); break;
      case 'torso':  ctrl.setLookAt(0, 0.6, 2.8,  0, 0.6,  0, true); break;
      case 'hands':  ctrl.setLookAt(-1.0, 0.2, 2, -0.6, 0.2, 0, true); break;
      case 'legs':   ctrl.setLookAt(0, -0.5, 3,   0, -0.5, 0, true); break;
      case 'feet':   ctrl.setLookAt(0, -1.3, 2,   0, -1.3, 0, true); break;
      default:       ctrl.setLookAt(0, 0.4, 6,    0, 0.4,  0, true); break;
    }
  }, [activeZone]);

  return <CameraControls ref={controlsRef} makeDefault minDistance={1} maxDistance={10} />;
});

const RenderMannequin = () => {
  const { activeOutfit, activeZone, setActiveZone, viewingFriend } = useSuitcase();

  // 'always' cuando la pestaña es visible, 'never' cuando está en background
  // Esto detiene el requestAnimationFrame que R3F gestiona internamente → GPU = 0
  const [frameloop, setFrameloop] = useState('always');

  useEffect(() => {
    const handleVisibilityChange = () => {
      setFrameloop(document.hidden ? 'never' : 'always');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup: sin este return habría un memory leak
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // Solo se registra una vez al montar

  const isFemale = activeOutfit === 'ELLA';
  const modelUrl = isFemale ? '/models/mujer/scene.gltf' : '/models/hombre/scene.gltf';

  return (
    <div className="render-container" style={{ pointerEvents: 'auto' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 40 }}
        frameloop={frameloop}
        onPointerMissed={() => setActiveZone(null)}
        gl={{ powerPreference: 'low-power' }} // Reduce presión GPU
      >
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow position={[2, 5, 2]} intensity={1} shadow-mapSize={[1024, 1024]} />

        <CameraAnimator activeZone={activeZone} />

        <Suspense fallback={null}>
          <ModelErrorBoundary key={modelUrl} url={modelUrl}>
            <AvatarModel url={modelUrl} isHologram={!!viewingFriend} />
          </ModelErrorBoundary>
        </Suspense>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2} far={2} />
      </Canvas>

      {!activeZone && (
        <div className="hotspots-layer" style={{ pointerEvents: 'none' }}>
          <div className="hotspot" style={{ top: '5%',  left: '40%', width: '20%', height: '15%', pointerEvents: 'auto' }} onClick={() => setActiveZone('head')} />
          <div className="hotspot" style={{ top: '20%', left: '35%', width: '30%', height: '30%', pointerEvents: 'auto' }} onClick={() => setActiveZone('torso')} />
          <div className="hotspot" style={{ top: '22%', left: '25%', width: '10%', height: '30%', pointerEvents: 'auto' }} onClick={() => setActiveZone('hands')} />
          <div className="hotspot" style={{ top: '22%', left: '65%', width: '10%', height: '30%', pointerEvents: 'auto' }} onClick={() => setActiveZone('hands')} />
          <div className="hotspot" style={{ top: '50%', left: '35%', width: '30%', height: '35%', pointerEvents: 'auto' }} onClick={() => setActiveZone('legs')} />
          <div className="hotspot" style={{ top: '85%', left: '35%', width: '30%', height: '15%', pointerEvents: 'auto' }} onClick={() => setActiveZone('feet')} />
        </div>
      )}
    </div>
  );
};

// React.memo: evita re-renders cuando cambian estados del formulario (tallas, colores, etc.)
// Solo re-renderiza si activeOutfit, activeZone o viewingFriend cambian
export default memo(RenderMannequin);
