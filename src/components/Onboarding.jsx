import React, { useState, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import AvatarModel, { ModelErrorBoundary } from './AvatarModel';

const ModelBackground = ({ url, isHovered }) => {
    return (
        <div className="onboarding-canvas-container">
            <Canvas shadows camera={{ position: [0, 0.5, 7.5], fov: 45 }}>
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <directionalLight castShadow position={[2, 5, 2]} intensity={1} shadow-mapSize={[1024, 1024]} />
                
                <Suspense fallback={null}>
                    <ModelErrorBoundary url={url}>
                        <AvatarModel url={url} isHovered={isHovered} />
                    </ModelErrorBoundary>
                </Suspense>

                <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={5} blur={2} far={2} />
            </Canvas>
        </div>
    );
};

const Onboarding = () => {
    const { session, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Independent hover states for each panel
    const [hoverHe, setHoverHe] = useState(false);
    const [hoverShe, setHoverShe] = useState(false);

    const selectProfile = async (outfit) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('user_profiles').insert({
                owner_id: session.user.id,
                outfit_mode: outfit,
                profile_name: 'Armario Principal'
            });

            if (error) throw error;
            
            await refreshProfile(); 
        } catch (err) {
            console.error("Error creating profile:", err);
            alert("Hubo un problema al crear tu perfil.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="onboarding-wrapper">
                <h1 className="onboarding-loading">Configurando tu espacio...</h1>
            </div>
        );
    }

    return (
        <div className="onboarding-wrapper">
            <div 
                className={`onboarding-panel panel-left ${hoverHe ? 'hovered' : ''}`}
                onMouseEnter={() => setHoverHe(true)}
                onMouseLeave={() => setHoverHe(false)}
                onClick={() => selectProfile('ÉL')}
            >
                <ModelBackground url="/models/hombre/scene.gltf" isHovered={hoverHe} />
                <div className="glass-btn">彼 (ÉL)</div>
            </div>
            
            <div 
                className={`onboarding-panel panel-right ${hoverShe ? 'hovered' : ''}`}
                onMouseEnter={() => setHoverShe(true)}
                onMouseLeave={() => setHoverShe(false)}
                onClick={() => selectProfile('ELLA')}
            >
                <ModelBackground url="/models/mujer/scene.gltf" isHovered={hoverShe} />
                <div className="glass-btn">彼女 (ELLA)</div>
            </div>
        </div>
    );
};

export default Onboarding;
