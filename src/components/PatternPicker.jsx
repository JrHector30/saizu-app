import React, { useState } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { Plus, Check, X } from 'lucide-react';

const PatternPicker = ({ itemId }) => {
  const { activeZoneData, toggleMultiSelect, globalPatterns, addGlobalPattern } = useSuitcase();
  const selectedPatterns = activeZoneData[itemId].patterns || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState('');

  const handleAddNew = (e) => {
    e.preventDefault();
    if(newVal.trim()) {
      addGlobalPattern(newVal.trim());
      setNewVal('');
      setIsAdding(false);
    }
  };

  return (
    <div className="pattern-container">
      {globalPatterns.map(pattern => {
        const isSelected = selectedPatterns.includes(pattern);
        
        return (
          <button
            key={pattern}
            type="button"
            className={`pattern-pill ${isSelected ? 'selected' : ''}`}
            onClick={(e) => { e.preventDefault(); toggleMultiSelect(itemId, 'patterns', pattern); }}
          >
            {pattern}
          </button>
        );
      })}
      
      {!isAdding && (
        <button 
          type="button"
          className="pattern-pill add-new-btn"
          onClick={() => setIsAdding(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e5e7eb', color: '#000', borderStyle: 'dashed' }}
        >
          <Plus size={14} /> Nuevo
        </button>
      )}

      {isAdding && (
        <div className="inline-add-form" style={{ width: '100%', marginTop: '8px' }}>
          <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Nuevo patrón" className="styled-input mini"/>
          <button type="button" onClick={handleAddNew} className="confirm-btn mini"><Check size={14}/></button>
          <button type="button" onClick={() => setIsAdding(false)} className="cancel-btn mini"><X size={14}/></button>
        </div>
      )}
    </div>
  );
};

export default PatternPicker;
