import React from 'react';
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
        <header className="app-header">
          <h1 className="app-title">サイズ - Saizu</h1>
          <OutfitToggle />
        </header>

        {/* Editor Panel only visible when a zone is active */}
        <div className={`editor-wrapper ${activeZone ? 'slide-in' : 'slide-out'}`}>
          {activeZone && <EditorPanel />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <SuitcaseProvider>
      <MainInterface />
    </SuitcaseProvider>
  );
}

export default App;
