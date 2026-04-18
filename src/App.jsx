import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import { SuitcaseProvider, useSuitcase } from './context/SuitcaseContext';
import RenderMannequin from './components/RenderMannequin';
import EditorPanel from './components/EditorPanel';
import ProfilesSidebar from './components/ProfilesSidebar';
import UserMenu from './components/UserMenu';

function MainInterface() {
  const { activeZone, activeProfileId, setActiveOutfit, viewingFriend, setViewingFriend } = useSuitcase();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setActiveOutfit(profile.outfit_mode);
    }
  }, [profile, setActiveOutfit]);

  return (
    <div className="main-wrapper">
      <RenderMannequin />

      { !profile ? (
        <Onboarding />
      ) : (
        <div className="ui-layer" style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
          
          <ProfilesSidebar />

          {/* Center Space where the Avatar is (transparent) */}
          <div style={{ flex: 1, position: 'relative', pointerEvents: 'none' }}>
             <header className="app-header" style={{ position: 'absolute', width: '100%', pointerEvents: 'none' }}>
               <h1 className="app-title">サイズ - Saizu</h1>
               <div style={{ pointerEvents: 'auto' }}>
                 <UserMenu />
               </div>
             </header>

             {/* Botón flotante para regresar si estoy viendo a un amigo */}
             {viewingFriend && (
               <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'auto' }}>
                 <button 
                   onClick={() => setViewingFriend(null)}
                   style={{
                     background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.8rem 1.5rem',
                     borderRadius: '30px', color: '#fff', cursor: 'pointer',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontWeight: 'bold'
                   }}
                 >
                   Volver a mi Armario
                 </button>
               </div>
             )}

             {/* Right Editor Panel */}
             <div className={`editor-wrapper ${activeZone ? 'slide-in' : 'slide-out'}`} style={{ pointerEvents: activeZone ? 'auto' : 'none' }}>
               {activeZone && <EditorPanel />}
             </div>
          </div>

        </div>
      )}
    </div>
  );
}

function AppContent() {
  const { session, loading } = useAuth();

  // Solo mostrar "Cargando..." en el arranque inicial (session todavía no se conoce)
  if (loading && session === undefined) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        Cargando...
      </div>
    );
  }

  // Sin sesión confirmada: mostrar Login
  if (!session) {
    return <Login />;
  }

  // Si hay sesión (aunque loading sea true brevemente por re-verificación), mantener la app montada
  return (
    <SuitcaseProvider>
      <MainInterface />
    </SuitcaseProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
