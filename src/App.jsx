import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { supabase } from './lib/supabaseClient';
import Login from './components/Login';
import { SuitcaseProvider, useSuitcase } from './context/SuitcaseContext';
import RenderMannequin from './components/RenderMannequin';
import EditorPanel from './components/EditorPanel';
import OutfitToggle from './components/OutfitToggle';

function MainInterface() {
  const { activeZone } = useSuitcase();

  return (
    <div className="main-wrapper">
      {/* 3D Render Background Layer */}
      <RenderMannequin />

      {/* Floating UI Layer */}
      <div className="ui-layer">
        <header className="app-header" style={{ position: 'relative' }}>
          <h1 className="app-title">サイズ - Saizu</h1>
          <OutfitToggle />
          <button 
             onClick={() => supabase.auth.signOut()} 
             style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}
          >
             Cerrar Sesión
          </button>
        </header>

        {/* Editor Panel only visible when a zone is active */}
        <div className={`editor-wrapper ${activeZone ? 'slide-in' : 'slide-out'}`}>
          {activeZone && <EditorPanel />}
        </div>
      </div>
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
