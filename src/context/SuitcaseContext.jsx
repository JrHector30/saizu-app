import React, { createContext, useContext, useState, useEffect } from 'react';
import { COLOR_PALETTE, PATTERNS } from '../utils/wardrobeData';
import { supabase } from '../lib/supabaseClient';

const SuitcaseContext = createContext();

export const useSuitcase = () => useContext(SuitcaseContext);

// Generates an absolutely empty schema layout
const getEmptyOutfitState = () => ({ head: {}, torso: {}, hands: {}, legs: {}, feet: {} });
const getEmptyInventorySchema = () => ({ head: [], torso: [], hands: [], legs: [], feet: [] });

export const SuitcaseProvider = ({ children }) => {
  const [activeOutfit, setActiveOutfit] = useState('ÉL'); // Managed by App/Onboarding mapped to user_profiles
  const [activeZone, setActiveZone] = useState(null); // null means "home"
  
  // NEW DYNAMIC PROFILES
  const [profilesList, setProfilesList] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  
  const [isSpinning, setIsSpinning] = useState(false);
  
  // They start completely empty
  const [inventorySchema, setInventorySchema] = useState(getEmptyInventorySchema());
  const [outfitsData, setOutfitsData] = useState(getEmptyOutfitState());

  // Shared Global Options State
  const [globalColors, setGlobalColors] = useState(COLOR_PALETTE);
  const [globalPatterns, setGlobalPatterns] = useState(PATTERNS);

  const getActiveZoneData = () => {
    if (!activeZone) return null;
    return outfitsData[activeZone];
  };

  const getActiveZoneSchema = () => {
    if (!activeZone) return null;
    return inventorySchema[activeZone];
  };

  // Field updater for selections
  const updateItemData = (itemId, field, value) => {
    if (!activeZone) return;
    setOutfitsData(prev => ({
      ...prev,
      [activeZone]: {
        ...prev[activeZone],
        [itemId]: {
          ...prev[activeZone][itemId],
          [field]: value
        }
      }
    }));
  };

  // CRUD: Add a newly crafted custom item
  const addCustomItem = (newItemSchema) => {
    if (!activeZone) return;
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeZone] = [...cloned[activeZone], newItemSchema];
      return cloned;
    });

    setOutfitsData(prev => ({
      ...prev,
      [activeZone]: {
        ...prev[activeZone],
        [newItemSchema.id]: { size: '', type: '', cut: '', brands: '', colors: [], patterns: [], gallery: [] }
      }
    }));
  };

  // CRUD: Delete an item completely
  const deleteCustomItem = (itemId) => {
    if (!activeZone) return;
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeZone] = cloned[activeZone].filter(item => item.id !== itemId);
      return cloned;
    });

    setOutfitsData(prev => {
      const cloned = { ...prev };
      cloned[activeZone] = { ...cloned[activeZone] };
      delete cloned[activeZone][itemId];
      return cloned;
    });
  };

  // Dynamic Options: Add a new option
  const addItemOption = (itemId, optField, newValue) => {
    if (!activeZone) return;
    
    setInventorySchema(prev => {
      const cloned = { ...prev };
      cloned[activeZone] = cloned[activeZone].map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item };
          if (!updatedItem[optField]) updatedItem[optField] = [];
          if (!updatedItem[optField].includes(newValue)) {
            updatedItem[optField] = [...updatedItem[optField], newValue];
          }
          return updatedItem;
        }
        return item;
      });
      return cloned;
    });
    
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
      cloned[activeZone] = cloned[activeZone].map(item => {
        if (item.id === itemId) return { ...item, [optField]: newArray };
        return item;
      });
      return cloned;
    });
    const dataFieldMap = { 'sizeOpts': 'size', 'typeOpts': 'type', 'cutOpts': 'cut' };
    if (dataFieldMap[optField]) {
      const field = dataFieldMap[optField];
      if (outfitsData[activeZone][itemId][field] === valueToRemove) {
        updateItemData(itemId, field, '');
      }
    }
  };

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
    const currentImages = outfitsData[activeZone][itemId]?.gallery || [];
    if (currentImages.length >= 3) return;
    updateItemData(itemId, 'gallery', [...currentImages, imageData]);
  };

  const removeImageFromItem = (itemId, index) => {
    if (!activeZone) return;
    const currentImages = [...(outfitsData[activeZone][itemId]?.gallery || [])];
    currentImages.splice(index, 1);
    updateItemData(itemId, 'gallery', currentImages);
  };

  const toggleMultiSelect = (itemId, field, selectionId) => {
    if (!activeZone || !outfitsData[activeZone][itemId]) return;
    const currentArray = outfitsData[activeZone][itemId][field] || [];
    if (currentArray.includes(selectionId)) {
      updateItemData(itemId, field, currentArray.filter(i => i !== selectionId));
    } else {
      updateItemData(itemId, field, [...currentArray, selectionId]);
    }
  };

  // --- NUEVA LÓGICA DE PERFILES ---
  const loadProfilesList = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    try {
      const { data, error } = await supabase.from('outfit_profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setProfilesList(data || []);
      // Auto-select first if none is active and there's data
      if (data && data.length > 0 && !activeProfileId) {
        setActiveProfileId(data[0].id);
      } else if (data && data.length === 0) {
        // If they literally have zero profiles, clear active
        setActiveProfileId(null);
      }
    } catch (e) {
      console.error("Error fetching profiles:", e);
    }
  };

  const createNewProfile = async (profileName, iconName = 'Package') => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    try {
      const { data, error } = await supabase.from('outfit_profiles').insert({
        owner_id: user.user.id,
        profile_name: profileName,
        icon: iconName
      }).select().single();
      
      if (error) throw error;
      setProfilesList(prev => [...prev, data]);
      setActiveProfileId(data.id);
    } catch (e) {
      console.error("Error creating profile:", e);
      alert("No se pudo crear el perfil.");
    }
  };

  const deleteProfile = async (profileId) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este perfil? Esto borrará todas las prendas dentro.")) return;
    try {
      const { error } = await supabase.from('outfit_profiles').delete().eq('id', profileId);
      if (error) throw error;
      
      setProfilesList(prev => prev.filter(p => p.id !== profileId));
      if (activeProfileId === profileId) {
        setActiveProfileId(null); 
      }
    } catch (e) {
      console.error("Error deleting profile:", e);
    }
  };

  const loadActiveProfileData = async () => {
    setInventorySchema(getEmptyInventorySchema());
    setOutfitsData(getEmptyOutfitState());

    if (!activeProfileId) return;

    // Animación del maniquí girando al cambiar perfil
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1500);

    try {
      const { data, error } = await supabase.from('sizes_data').select('*').eq('profile_id', activeProfileId);
      if (error) throw error;

      if (data && data.length > 0) {
         let newSchema = getEmptyInventorySchema();
         let newData = getEmptyOutfitState();
         
         data.forEach(row => {
            const z = row.zone;
            if (!newSchema[z]) return;

            // Reconstruimos el custom item en base a lo guardado
            const reconstructedItem = {
               id: row.item_id,
               label: row.extra_details?.label || 'Prenda',
               icon: row.extra_details?.icon || '🛍️',
               sizeOpts: row.extra_details?.sizeOpts || [],
               typeOpts: row.extra_details?.typeOpts || [],
               cutOpts: row.extra_details?.cutOpts || []
            };
            newSchema[z].push(reconstructedItem);

            // Reconstruimos la state data
            newData[z][row.item_id] = {
               size: row.size_value || '',
               brands: row.brand || '',
               cut: row.extra_details?.cut || '',
               type: row.extra_details?.type || '',
               colors: row.extra_details?.colors || [],
               patterns: row.extra_details?.patterns || [],
               gallery: row.image_urls || []
            };
         });
         setInventorySchema(newSchema);
         setOutfitsData(newData);
      }
    } catch (err) {
      console.error("Error cargando prendas del perfil: ", err);
    }
  };

  // Re-fetch automatically when active profile changes OR initial load
  useEffect(() => {
    loadActiveProfileData();
  }, [activeProfileId]); // eslint-disable-line

  useEffect(() => {
    loadProfilesList();
  }, []);

  const saveProfileToSupabase = async () => {
    if (!activeProfileId) return alert("Selecciona un Perfil primero.");
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const userId = user.user.id;
      const rows = [];

      Object.keys(outfitsData).forEach(zone => {
         Object.keys(outfitsData[zone]).forEach(itemId => {
            const item = outfitsData[zone][itemId];
            const schemaDef = inventorySchema[zone].find(x => x.id === itemId);
            if (item.size || item.brands || item.colors.length > 0 || item.gallery.length > 0) {
               rows.push({
                  owner_id: userId,
                  profile_id: activeProfileId, // Vinculo esencial
                  zone: zone,
                  item_id: itemId,
                  size_value: item.size,
                  brand: item.brands,
                  image_urls: item.gallery,
                  extra_details: { 
                    cut: item.cut, 
                    type: item.type, 
                    colors: item.colors, 
                    patterns: item.patterns,
                    label: schemaDef?.label || 'Prenda',
                    icon: schemaDef?.icon || '🛍️',
                    sizeOpts: schemaDef?.sizeOpts || [],
                    typeOpts: schemaDef?.typeOpts || [],
                    cutOpts: schemaDef?.cutOpts || []
                  }
               });
            }
         });
      });

      // Limpia todo este profile antes de insertar (simulando upsert completo por delete-insert)
      await supabase.from('sizes_data').delete().eq('profile_id', activeProfileId);

      if (rows.length > 0) {
        const { error } = await supabase.from('sizes_data').insert(rows);
        if (error) throw error;
      }
      
      alert(`¡Perfil guardado con éxito!`);

    } catch (err) {
      console.error("Error guardando en Supabase: ", err);
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
        isSpinning,
        setIsSpinning,
        updateItemData,
        addImageToItem,
        removeImageFromItem,
        toggleMultiSelect,
        addCustomItem,
        deleteCustomItem,
        addItemOption,
        removeItemOption,
        addGlobalColor,
        addGlobalPattern,
        saveProfileToSupabase,
        // Profiles Exposes
        profilesList,
        activeProfileId,
        setActiveProfileId,
        createNewProfile,
        deleteProfile 
      }}
    >
      {children}
    </SuitcaseContext.Provider>
  );
};
