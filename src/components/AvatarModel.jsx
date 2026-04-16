import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

export class ModelErrorBoundary extends React.Component {
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
            <div style={{ background: 'white', border: '2px solid red', padding: '10px', borderRadius: '8px', color: 'black', width: 'max-content', textAlign: 'center', pointerEvents: 'none' }}>
               Falta su archivo.<br/><small>Asegúrate de que exista:<br/><b>public{this.props.url}</b></small>
            </div>
          </Html>
        </group>
      );
    }
    return this.props.children;
  }
}

const AvatarModel = ({ url, isHovered = false }) => {
  const { scene } = useGLTF(url);
  const avatarRef = useRef();

  useEffect(() => {
    if (!scene) return;
    
    // Reset and Normalize scaling
    scene.scale.setScalar(1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    
    const scaleFactor = 3.8 / size.y;
    scene.scale.setScalar(scaleFactor);
    scene.updateMatrixWorld(true);

    const newBox = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    newBox.getCenter(center);
    
    scene.position.x -= center.x;
    scene.position.z -= center.z;
    scene.position.y += (-1.5 - newBox.min.y);
    
  }, [scene, url]);

  useFrame(() => {
    if (avatarRef.current) {
      // Reposo: gira muy lentamente (0.001)
      // Hover: acelera el giro (0.008)
      const targetSpeed = isHovered ? 0.008 : 0.001;
      avatarRef.current.rotation.y += targetSpeed;
    }
  });

  return <group ref={avatarRef}><primitive object={scene} /></group>;
};

export default AvatarModel;
