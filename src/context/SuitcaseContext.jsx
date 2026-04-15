import React, { createContext, useContext, useState, useEffect } from 'react';
import { WARDROBE_SCHEMA, COLOR_PALETTE, PATTERNS } from '../utils/wardrobeData';

const SuitcaseContext = createContext();

export const useSuitcase = () => useContext(SuitcaseContext);

// Generates the deep default state for an outfit based on a provided schema
const generateOutfitState = (schema) => {
  const outfitState = { head: {}, torso: {}, hands: {}, legs: {}, feet: {} };
  Object.keys(schema).forEach(zone => {
    schema[zone].forEach(item => {
      outfitState[zone][item.id] = {
        size: '', type: '', cut: '', brands: '', colors: [], patterns: [], gallery: []
      };
    });
  });
  return outfitState;
};

// Deep copy of the initial schema so we can mutate it freely
const deepCloneSchema = (schemaObj) => JSON.parse(JSON.stringify(schemaObj));

export const SuitcaseProvider = ({ children }) => {
  const [activeOutfit, setActiveOutfit] = useState('ÉL');
  const [activeZone, setActiveZone] = useState(null); // null means "home"
  
  // Mutable schema state to allow adding/removing schemas for items
  const [inventorySchema, setInventorySchema] = useState({
    'ÉL': deepCloneSchema(WARDROBE_SCHEMA['ÉL']),
    'ELLA': deepCloneSchema(WARDROBE_SCHEMA['ELLA'])
  });

  // State for user-defined selections
  const [outfitsData, setOutfitsData] = useState({
    'ÉL': generateOutfitState(WARDROBE_SCHEMA['ÉL']),
    'ELLA': generateOutfitState(WARDROBE_SCHEMA['ELLA']),
  });

  // Shared Global Options State
  const [globalColors, setGlobalColors] = useState(COLOR_PALETTE);
  const [globalPatterns, setGlobalPatterns] = useState(PATTERNS);

  const getActiveZoneData = () => {
    if (!activeZone) return null;
    return outfitsData[activeOutfit][activeZone];
  };

  const getActiveZoneSchema = () => {
    if (!activeZone) return null;
    return inventorySchema[activeOutfit][activeZone];
  };

  // Field updater for selections
  const updateItemData = (itemId, field, value) => {
    if (!activeZone) return;
    setOutfitsData(prev => ({
      ...prev,
      [activeOutfit]: {
        ...prev[activeOutfit],
        [activeZone]: {
          ...prev[activeOutfit][activeZone],
          [itemId]: {
            ...prev[activeOutfit][activeZone][itemId],
            [field]: value
          }
        }
      }
    }));
  };

  // CRUD: Add a newly crafted custom item
  const addCustomItem = (newItemSchema) => {
    if (!activeZone) return;
    
    // 1. Add to schema definition
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeOutfit] = { ...cloned[activeOutfit] };
      cloned[activeOutfit][activeZone] = [...cloned[activeOutfit][activeZone], newItemSchema];
      return cloned;
    });

    // 2. Add to actual data state
    setOutfitsData(prev => ({
      ...prev,
      [activeOutfit]: {
        ...prev[activeOutfit],
        [activeZone]: {
          ...prev[activeOutfit][activeZone],
          [newItemSchema.id]: { size: '', type: '', cut: '', brands: '', colors: [], patterns: [], gallery: [] }
        }
      }
    }));
  };

  // CRUD: Delete an item completely
  const deleteCustomItem = (itemId) => {
    if (!activeZone) return;
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeOutfit] = { ...cloned[activeOutfit] };
      cloned[activeOutfit][activeZone] = cloned[activeOutfit][activeZone].filter(item => item.id !== itemId);
      return cloned;
    });

    setOutfitsData(prev => {
      const cloned = { ...prev };
      cloned[activeOutfit] = { ...cloned[activeOutfit] };
      cloned[activeOutfit][activeZone] = { ...cloned[activeOutfit][activeZone] };
      delete cloned[activeOutfit][activeZone][itemId];
      return cloned;
    });
  };

  // Dynamic Options: Add a new option (size, type, cut) to an item's schema
  const addItemOption = (itemId, optField, newValue) => {
    if (!activeZone) return;
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeOutfit] = { ...cloned[activeOutfit] };
      cloned[activeOutfit][activeZone] = cloned[activeOutfit][activeZone].map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item };
          if (!updatedItem[optField]) updatedItem[optField] = [];
          
          // Avoid duplicates
          if (!updatedItem[optField].includes(newValue)) {
            updatedItem[optField] = [...updatedItem[optField], newValue];
          }
          return updatedItem;
        }
        return item;
      });
      return cloned;
    });
    
    // Auto-select the newly added option
    // By convention optField -> 'sizeOpts' updates 'size'
    const dataFieldMap = { 'sizeOpts': 'size', 'typeOpts': 'type', 'cutOpts': 'cut' };
    if (dataFieldMap[optField]) {
      updateItemData(itemId, dataFieldMap[optField], newValue);
    }
  };

  const removeItemOption = (itemId, optField, currentOptionsArray, valueToRemove) => {
    if (!activeZone) return;
    
    const newArray = currentOptionsArray.filter(v => v !== valueToRemove);
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeOutfit] = { ...cloned[activeOutfit] };
      cloned[activeOutfit][activeZone] = cloned[activeOutfit][activeZone].map(item => {
        if (item.id === itemId) {
          return { ...item, [optField]: newArray };
        }
        return item;
      });
      return cloned;
    });
    
    // Clear the selection if it was the deleted value
    const dataFieldMap = { 'sizeOpts': 'size', 'typeOpts': 'type', 'cutOpts': 'cut' };
    if (dataFieldMap[optField]) {
      const field = dataFieldMap[optField];
      if (outfitsData[activeOutfit][activeZone][itemId][field] === valueToRemove) {
        updateItemData(itemId, field, '');
      }
    }
  };

  // Global Option Adding
  const addGlobalColor = (name, hex) => {
    const defaultColorId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setGlobalColors(prev => [...prev, { id: defaultColorId, hex, label: name }]);
  };

  const addGlobalPattern = (patternName) => {
    if (!globalPatterns.includes(patternName)) {
      setGlobalPatterns(prev => [...prev, patternName]);
    }
  };

  const addImageToItem = (itemId, imageData) => {
    if (!activeZone) return;
    const currentImages = outfitsData[activeOutfit][activeZone][itemId]?.gallery || [];
    if (currentImages.length >= 3) return;
    updateItemData(itemId, 'gallery', [...currentImages, imageData]);
  };

  const removeImageFromItem = (itemId, index) => {
    if (!activeZone) return;
    const currentImages = [...(outfitsData[activeOutfit][activeZone][itemId]?.gallery || [])];
    currentImages.splice(index, 1);
    updateItemData(itemId, 'gallery', currentImages);
  };

  const toggleMultiSelect = (itemId, field, selectionId) => {
    if (!activeZone || !outfitsData[activeOutfit][activeZone][itemId]) return;
    const currentArray = outfitsData[activeOutfit][activeZone][itemId][field] || [];
    
    if (currentArray.includes(selectionId)) {
      updateItemData(itemId, field, currentArray.filter(i => i !== selectionId));
    } else {
      updateItemData(itemId, field, [...currentArray, selectionId]);
    }
  };

  return (
    <SuitcaseContext.Provider
      value={{
        activeOutfit,
        setActiveOutfit,
        activeZone,
        setActiveZone,
        activeZoneData: getActiveZoneData(),
        activeZoneSchema: getActiveZoneSchema(),
        globalColors,
        globalPatterns,
        updateItemData,
        addImageToItem,
        removeImageFromItem,
        toggleMultiSelect,
        addCustomItem,
        deleteCustomItem,
        addItemOption,
        removeItemOption,
        addGlobalColor,
        addGlobalPattern
      }}
    >
      {children}
    </SuitcaseContext.Provider>
  );
};
