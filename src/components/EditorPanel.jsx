import React, { useState } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import GallerySlots from './GallerySlots';
import ColorSwatchPicker from './ColorSwatchPicker';
import PatternPicker from './PatternPicker';
import { X, ChevronDown, ChevronUp, Trash2, Plus, Check } from 'lucide-react';

const zoneTranslations = {
  head: 'Cabeza y Rostro',
  torso: 'Torso superior',
  hands: 'Manos y Brazos',
  legs: 'Piernas y Cadera',
  feet: 'Pies y Calzado'
};

const defaultOptions = {
  size: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
  type: ['Estándar', 'Premium', 'Casual'],
  cut: ['Slim Fit', 'Regular/Recto', 'Baggy/Oversize', 'Skinny']
};

const OptionsSelector = ({ label, options, selectedValue, onSelect, onAdd, onRemove, readOnly }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVal, setNewVal] = useState('');
  const [deletingVal, setDeletingVal] = useState(null);

  const handleAdd = () => {
    if(newVal.trim()) {
      onAdd(newVal.trim());
      setNewVal('');
      setIsAdding(false);
    }
  }

  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="options-grid">
        {options.map(opt => (
          <div key={opt} className={`option-square-wrapper ${selectedValue === opt ? 'selected' : ''}`}>
             <button 
                type="button"
                className="option-square"
                onClick={() => !readOnly && onSelect(opt)}
                disabled={readOnly}
                style={{ cursor: readOnly ? 'default' : 'pointer' }}
             >
               {opt}
             </button>
             {selectedValue === opt && !readOnly && (
               <button type="button" className="del-mini-btn" onClick={(e) => { e.stopPropagation(); setDeletingVal(opt); }}><X size={10}/></button>
             )}
          </div>
        ))}
        {!isAdding && !readOnly && (
          <button type="button" className="option-square add-new-square" onClick={() => setIsAdding(true)}>
             <Plus size={14} />
          </button>
        )}
      </div>
      {isAdding && (
        <div className="inline-add-form">
          <input type="text" value={newVal} onChange={e => setNewVal(e.target.value)} placeholder="Nueva opción" className="styled-input mini"/>
          <button type="button" onClick={handleAdd} className="confirm-btn mini"><Check size={14}/></button>
          <button type="button" onClick={() => setIsAdding(false)} className="cancel-btn mini"><X size={14}/></button>
        </div>
      )}
      {deletingVal && (
        <div className="inline-delete-form">
          <span>¿Borrar "{deletingVal}"?</span>
          <button type="button" onClick={() => { onRemove(deletingVal); setDeletingVal(null); }} className="confirm-btn mini alert"><Check size={14} /></button>
          <button type="button" onClick={() => setDeletingVal(null)} className="cancel-btn mini"><X size={14}/></button>
        </div>
      )}
    </div>
  )
}

const AccordionItem = ({ itemConfig, isOpen, onClick, onDelete, viewingFriend }) => {
  const { activeZoneData, updateItemData, addItemOption, removeItemOption } = useSuitcase();
  const itemState = activeZoneData[itemConfig.id];

  if (!itemState) return null; // Failsafe

  const sizes = itemConfig.sizeOpts || defaultOptions.size;
  const types = itemConfig.typeOpts || defaultOptions.type;
  const cuts = itemConfig.cutOpts || defaultOptions.cut;

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <button className="accordion-header" onClick={onClick}>
        <span>{itemConfig.label}</span>
        <div className="accordion-actions">
          {!viewingFriend && (
            <Trash2 
              size={16} 
              className="delete-icon" 
              onClick={(e) => { e.stopPropagation(); onDelete(itemConfig.id); }} 
            />
          )}
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {isOpen && (
        <div className="accordion-content" style={{ pointerEvents: viewingFriend ? 'none' : 'auto' }}>
          {itemConfig.attrs.includes('size') && (
            <OptionsSelector 
              label="Talla" 
              options={sizes} 
              selectedValue={itemState.size} 
              onSelect={(val) => updateItemData(itemConfig.id, 'size', val === itemState.size ? '' : val)} 
              onAdd={(val) => addItemOption(itemConfig.id, 'sizeOpts', val)} 
              onRemove={(val) => removeItemOption(itemConfig.id, 'sizeOpts', sizes, val)} 
              readOnly={!!viewingFriend}
            />
          )}

          {itemConfig.attrs.includes('type') && (
            <OptionsSelector 
              label="Tipo" 
              options={types} 
              selectedValue={itemState.type} 
              onSelect={(val) => updateItemData(itemConfig.id, 'type', val === itemState.type ? '' : val)} 
              onAdd={(val) => addItemOption(itemConfig.id, 'typeOpts', val)} 
              onRemove={(val) => removeItemOption(itemConfig.id, 'typeOpts', types, val)} 
              readOnly={!!viewingFriend}
            />
          )}

          {itemConfig.attrs.includes('cut') && (
            <OptionsSelector 
              label="Corte / Fit" 
              options={cuts} 
              selectedValue={itemState.cut} 
              onSelect={(val) => updateItemData(itemConfig.id, 'cut', val === itemState.cut ? '' : val)} 
              onAdd={(val) => addItemOption(itemConfig.id, 'cutOpts', val)} 
              onRemove={(val) => removeItemOption(itemConfig.id, 'cutOpts', cuts, val)} 
              readOnly={!!viewingFriend}
            />
          )}

          {itemConfig.attrs.includes('brands') && (
            <div className="input-group">
              <label>Marca / Fabricante</label>
              <input 
                type="text" 
                placeholder="Ej. Zara, H&M..." 
                value={itemState.brands || ''}
                onChange={(e) => updateItemData(itemConfig.id, 'brands', e.target.value)}
                className="styled-input"
                readOnly={!!viewingFriend}
              />
            </div>
          )}

          {itemConfig.attrs.includes('colors') && (
            <div className="input-group">
              <label>Colores Preferidos</label>
              <ColorSwatchPicker itemId={itemConfig.id} />
            </div>
          )}

          {itemConfig.attrs.includes('patterns') && (
            <div className="input-group">
              <label>Patrones Textil/Diseño</label>
              <PatternPicker itemId={itemConfig.id} />
            </div>
          )}

          {itemConfig.attrs.includes('gallery') && (
            <div className="gallery-section">
              <label>Fotos de Referencia</label>
              <GallerySlots itemId={itemConfig.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PRESET_ATTRS = [
  { id: 'size', label: 'Talla' },
  { id: 'type', label: 'Tipo' },
  { id: 'cut', label: 'Corte/Fit' },
  { id: 'brands', label: 'Marca/Fabricante' },
  { id: 'colors', label: 'Colores Preferidos' },
  { id: 'patterns', label: 'Patrones/Diseño' },
  { id: 'gallery', label: 'Fotos de Referencia' }
];

const EditorPanel = () => {
  const { activeOutfit, activeZone, setActiveZone, activeZoneSchema, addCustomItem, deleteCustomItem, viewingFriend } = useSuitcase();
  const [openAccordion, setOpenAccordion] = useState(null);
  
  // Custom item creator state
  const [isCreating, setIsCreating] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedAttrs, setSelectedAttrs] = useState(['brands', 'colors', 'gallery']);

  if (!activeZone) return null;

  const currentSchema = activeZoneSchema || [];

  const handleToggleAttr = (attrId) => {
    setSelectedAttrs(prev => 
      prev.includes(attrId) ? prev.filter(x => x !== attrId) : [...prev, attrId]
    );
  };

  const handleCreateNew = () => {
    if (!newItemName.trim()) return;
    const baseId = newItemName.trim().toLowerCase().replace(/\s+/g, '-');
    const newId = `${baseId}-${Date.now().toString().slice(-4)}`;
    
    addCustomItem({
      id: newId,
      label: newItemName.trim(),
      attrs: selectedAttrs
    });
    
    setNewItemName('');
    setIsCreating(false);
    setOpenAccordion(newId);
  };

  return (
    <div className="editor-panel glassmorphism advanced-scroll">
      <div className="editor-header">
        <h2 className="editor-title">{zoneTranslations[activeZone]}</h2>
        <button 
          className="close-btn" 
          onClick={() => setActiveZone(null)}
          aria-label="Cerrar Panel"
          title="Ver Maniquí Completo"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      <div className="custom-item-creator">
        {!viewingFriend && (
          !isCreating ? (
            <button className="add-new-btn" onClick={() => setIsCreating(true)}>
              <Plus size={16} /> Agregar Nueva Prenda
            </button>
          ) : (
            <div className="creation-form">
              <input 
                type="text" 
                className="styled-input" 
                placeholder="Nombre de prenda (Ej: Bufanda)"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                autoFocus
              />
              <p className="creation-subtitle">Selecciona los campos requeridos:</p>
              <div className="attr-checkboxes">
                {PRESET_ATTRS.map(attr => (
                  <label key={attr.id} className="attr-label">
                    <input 
                      type="checkbox" 
                      checked={selectedAttrs.includes(attr.id)}
                      onChange={() => handleToggleAttr(attr.id)}
                    />
                    {attr.label}
                  </label>
                ))}
              </div>
              <div className="creation-actions">
                <button className="cancel-btn" onClick={() => setIsCreating(false)}>Cancelar</button>
                <button className="confirm-btn" onClick={handleCreateNew} disabled={!newItemName.trim()}>
                  <Check size={16} /> Agregar
                </button>
              </div>
            </div>
          )
        )}
      </div>
      
      <div className="accordion-list">
        {currentSchema.map(itemConf => (
          <AccordionItem 
            key={itemConf.id} 
            itemConfig={itemConf} 
            isOpen={openAccordion === itemConf.id}
            onClick={() => setOpenAccordion(openAccordion === itemConf.id ? null : itemConf.id)} 
            onDelete={deleteCustomItem}
            viewingFriend={viewingFriend}
          />
        ))}
        {currentSchema.length === 0 && <p style={{opacity: 0.5}}>No hay categorías definidas aún.</p>}
      </div>
    </div>
  );
};

export default EditorPanel;
