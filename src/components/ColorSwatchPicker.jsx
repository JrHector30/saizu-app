import React, { useState } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { Check, Plus, X } from 'lucide-react';

const ColorSwatchPicker = ({ itemId }) => {
  const { activeZoneData, toggleMultiSelect, globalColors, addGlobalColor } = useSuitcase();
  const selectedColors = activeZoneData[itemId].colors || [];
  
  const [isAdding, setIsAdding] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  const handleConfirmAdd = () => {
    if (newColorName.trim()) {
      addGlobalColor(newColorName.trim(), newColorHex);
      setIsAdding(false);
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };

  return (
    <div>
      <div className="swatch-container">
        {globalColors.map(color => {
          const isSelected = selectedColors.includes(color.id);
          const isDark = color.id === 'white' ? false : true; 
          
          return (
            <button
              key={color.id}
              title={color.label}
              className={`color-swatch ${isSelected ? 'selected' : ''}`}
              style={{ backgroundColor: color.hex }}
              onClick={(e) => { e.preventDefault(); toggleMultiSelect(itemId, 'colors', color.id); }}
              type="button"
            >
              {isSelected && <Check size={14} color={isDark ? '#FFF' : '#000'} />}
            </button>
          );
        })}
        
        {!isAdding && (
          <button 
            type="button"
            title="Añadir color nuevo"
            className="color-swatch custom-color-btn"
            style={{ backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => { e.preventDefault(); setIsAdding(true); }}
          >
            <Plus size={14} color="#000" />
          </button>
        )}
      </div>

      {isAdding && (
        <div className="inline-add-form" style={{ marginTop: '10px' }}>
          <input 
            type="color" 
            value={newColorHex}
            onChange={e => setNewColorHex(e.target.value)}
            style={{ width: '32px', height: '32px', padding: '0', border: 'none', cursor: 'pointer', background: 'transparent' }}
          />
          <input 
            type="text" 
            value={newColorName}
            onChange={e => setNewColorName(e.target.value)} 
            placeholder="Nombre..." 
            className="styled-input mini"
          />
          <button type="button" onClick={handleConfirmAdd} className="confirm-btn mini"><Check size={14}/></button>
          <button type="button" onClick={() => setIsAdding(false)} className="cancel-btn mini"><X size={14}/></button>
        </div>
      )}
    </div>
  );
};

export default ColorSwatchPicker;
