import React from 'react';
import { useSuitcase } from '../context/SuitcaseContext';

const OutfitToggle = () => {
  const { activeOutfit, setActiveOutfit } = useSuitcase();
  
  const outfits = ['ÉL', 'ELLA'];

  return (
    <div className="outfit-toggle-container">
      <div className="outfit-toggle-track">
        {outfits.map(outfit => (
          <button
            key={outfit}
            className={`outfit-btn ${activeOutfit === outfit ? 'active' : ''}`}
            onClick={() => setActiveOutfit(outfit)}
          >
            {outfit}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OutfitToggle;
