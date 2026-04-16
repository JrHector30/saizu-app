import React, { useState } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const Onboarding = () => {
    const { setActiveOutfit, setIsSpinning } = useSuitcase();
    const { session, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleHover = (outfit) => {
        setActiveOutfit(outfit);
        setIsSpinning(true);
    };

    const handleLeave = () => {
        setIsSpinning(false);
    };

    const selectProfile = async (outfit) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('user_profiles').insert({
                owner_id: session.user.id,
                outfit_mode: outfit,
                profile_name: 'Armario Principal'
            });

            if (error) throw error;
            
            await refreshProfile(); // The App.jsx will automatically unmount this layout
        } catch (err) {
            console.error("Error creating profile:", err);
            alert("Hubo un problema al crear tu perfil.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="onboarding-overlay">
                <h1 className="onboarding-loading">Configurando tu espacio...</h1>
            </div>
        );
    }

    return (
        <div className="onboarding-overlay glass-wall">
            <div 
                className="onboarding-half left-half"
                onMouseEnter={() => handleHover('ÉL')}
                onMouseLeave={handleLeave}
                onClick={() => selectProfile('ÉL')}
            >
                <div className="onboarding-btn">彼 (ÉL)</div>
            </div>
            
            <div 
                className="onboarding-half right-half"
                onMouseEnter={() => handleHover('ELLA')}
                onMouseLeave={handleLeave}
                onClick={() => selectProfile('ELLA')}
            >
                <div className="onboarding-btn">彼女 (ELLA)</div>
            </div>
        </div>
    );
};

export default Onboarding;
