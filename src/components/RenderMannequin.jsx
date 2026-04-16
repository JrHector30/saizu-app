import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, ContactShadows, CameraControls, Html } from '@react-three/drei';
import { useSuitcase } from '../context/SuitcaseContext';

// Simple Error Boundary so it doesn't crash the React tree if the model file is missing
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 3, 1]} />
            <meshStandardMaterial color="gray" wireframe />
          </mesh>
          <Html center position={[0, 1.5, 0]}>
            <div style={{ background: 'white', border: '2px solid red', padding: '10px', borderRadius: '8px', color: 'black', width: 'max-content', textAlign: 'center' }}>
               Falta su archivo.<br/><small>Debes pegar sus propios 3 archivos en:<br/><b>public{this.props.url}</b></small>
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}

import * as THREE from 'three';

import { useFrame } from '@react-three/fiber';

// The Avatar Model automatically measures and scales ANY gltf to perfectly fit the UI layout (6.5 meters tall)
const AvatarModel = ({ url }) => {
  // This will throw if the URL is invalid/404, which is caught by ModelErrorBoundary
  const { scene } = useGLTF(url);
  const avatarRef = useRef();
  const { isSpinning } = useSuitcase();

  useEffect(() => {
    if (!scene) return;
    
    // 1. Reseteamos la posición por si el modelo quedó en caché de memoria (useGLTF optimization)
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    // 2. Calculamos sus dimensiones reales provenientes del modelado 3D
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    // 3. Forzamos a que tenga exactamente 3.8 metros de altura (para que encuadre en el zoom predeterminado y con los hotspots HTML)
    const scaleFactor = 3.8 / size.y;
    scene.scale.setScalar(scaleFactor);
    scene.updateMatrixWorld(true);

    // 4. Recalculamos para encontrar su nuevo centro y piso ya escalado
    const newBox = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    newBox.getCenter(center);
    
    // 5. Alineamos todo: lo centramos sobre el origen en X y Z, y empujamos sus pies exactamente a Y = -1.5 (suelo virtual del UI)
    scene.position.x -= center.x;
    scene.position.z -= center.z;
    scene.position.y += (-1.5 - newBox.min.y);
    
  }, [scene, url]);

  useFrame(() => {
    if (avatarRef.current) {
      if (isSpinning) {
        avatarRef.current.rotation.y += 0.005; // Girar lentamente forma horaria
      } else if (avatarRef.current.rotation.y > 0.01 || avatarRef.current.rotation.y < -0.01) {
        // Volver al frente progresivamente cuando dejen de hacer hover
        avatarRef.current.rotation.y = THREE.MathUtils.lerp(avatarRef.current.rotation.y, 0, 0.05);
      }
    }
  });

  return <group ref={avatarRef}><primitive object={scene} /></group>;
};

// Manages the "GTA style" camera tweening based on current zone
const CameraAnimator = ({ activeZone }) => {
  const controlsRef = useRef();

  useEffect(() => {
    if (!controlsRef.current) return;
    const ctrl = controlsRef.current;
    
    // Al haber escalado, reajustamos los punteros de la cámara
    switch (activeZone) {
      case 'head':
        ctrl.setLookAt(0, 1.9, 1.5, 0, 1.9, 0, true);
        break;
      case 'torso':
        ctrl.setLookAt(0, 0.6, 2.8, 0, 0.6, 0, true);
        break;
      case 'hands':
        ctrl.setLookAt(-1.0, 0.2, 2, -0.6, 0.2, 0, true);
        break;
      case 'legs':
        ctrl.setLookAt(0, -0.5, 3, 0, -0.5, 0, true);
        break;
      case 'feet':
        ctrl.setLookAt(0, -1.3, 2, 0, -1.3, 0, true);
        break;
      default:
        // Full body home view
        ctrl.setLookAt(0, 0.4, 6, 0, 0.4, 0, true);
        break;
    }
  }, [activeZone]);

  return <CameraControls ref={controlsRef} makeDefault minDistance={1} maxDistance={10} />;
};

const RenderMannequin = () => {
  const { activeOutfit, activeZone, setActiveZone } = useSuitcase();

  const isFemale = activeOutfit === 'ELLA';
  // Obtenemos el modelo correcto. El algoritmo AvatarModel escalará a todos equitativamente
  const modelUrl = isFemale ? '/models/mujer/scene.gltf' : '/models/hombre/scene.gltf';

  return (
    <div className="render-container" style={{ pointerEvents: 'auto' }}>
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 40 }} onPointerMissed={() => setActiveZone(null)}>
        <Environment preset="city" />
        <ambientLight intensity={0.5} />
        <directionalLight castShadow position={[2, 5, 2]} intensity={1} shadow-mapSize={[1024, 1024]} />
        
        <CameraAnimator activeZone={activeZone} />
        
        <Suspense fallback={null}>
          <ModelErrorBoundary key={modelUrl} url={modelUrl}>
             <AvatarModel url={modelUrl} />
          </ModelErrorBoundary>
        </Suspense>

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2} far={2} />
      </Canvas>

      {/* Legacy HTML Hotspots for clicking if the model doesn't have meshes attached yet. 
          Will overlay on top of canvas. */}
      {!activeZone && (
        <div className="hotspots-layer" style={{ pointerEvents: 'none' }}>
           {/* Enable pointer events only on the hotspots themselves */}
           <div className="hotspot" style={{ top: '5%', left: '40%', width: '20%', height: '15%', pointerEvents: 'auto' }} onClick={() => setActiveZone('head')} />
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

export default RenderMannequin;
