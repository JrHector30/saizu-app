import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import { SuitcaseProvider, useSuitcase } from './context/SuitcaseContext';
import RenderMannequin from './components/RenderMannequin';
import EditorPanel from './components/EditorPanel';
import ProfilesSidebar from './components/ProfilesSidebar';

function MainInterface() {
  const { activeZone, activeProfileId, setActiveOutfit } = useSuitcase();
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
             <header className="app-header" style={{ position: 'absolute', width: '100%', pointerEvents: 'auto' }}>
               <h1 className="app-title">サイズ - Saizu</h1>
               <button 
                  onClick={() => supabase.auth.signOut()} 
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', pointerEvents: 'auto' }}
               >
                  Cerrar Sesión
               </button>
             </header>

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

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>;

  if (!session) {
    return <Login />;
  }

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
