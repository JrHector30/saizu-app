import React, { createContext, useContext, useState, useEffect } from 'react';
import { COLOR_PALETTE, PATTERNS } from '../utils/wardrobeData';
import { supabase } from '../lib/supabaseClient';

const SuitcaseContext = createContext();

export const useSuitcase = () => useContext(SuitcaseContext);

// Generates an absolutely empty schema layout
const getEmptyOutfitState = () => ({ head: {}, torso: {}, hands: {}, legs: {}, feet: {} });
const getEmptyInventorySchema = () => ({ head: [], torso: [], hands: [], legs: [], feet: [] });

export const SuitcaseProvider = ({ children }) => {
  const [activeOutfit, setActiveOutfit] = useState('ÉL');
  const [activeZone, setActiveZone] = useState(() => {
    const saved = localStorage.getItem('saizu_activeZone');
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });
  const [activeZoneData, setActiveZoneData] = useState([]); 
  
  // NEW DYNAMIC PROFILES
  const [profilesList, setProfilesList] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  
  // -- SAÍZU NETWORK --
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  
  const [isSpinning, setIsSpinning] = useState(false);
  
  // They start completely empty or from draft memory
  const [inventorySchema, setInventorySchema] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_inventorySchema');
      if (saved && saved !== 'null' && saved !== 'undefined') return JSON.parse(saved) || getEmptyInventorySchema();
    } catch(e){}
    return getEmptyInventorySchema();
  });
  const [outfitsData, setOutfitsData] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_outfitsData');
      if (saved && saved !== 'null' && saved !== 'undefined') return JSON.parse(saved) || getEmptyOutfitState();
    } catch(e){}
    return getEmptyOutfitState();
  });

  useEffect(() => {
    if (activeZone) localStorage.setItem('saizu_activeZone', activeZone);
    else localStorage.removeItem('saizu_activeZone');
  }, [activeZone]);

  useEffect(() => {
    if (!viewingFriend) {
      if (inventorySchema) localStorage.setItem('saizu_inventorySchema', JSON.stringify(inventorySchema));
      if (outfitsData) localStorage.setItem('saizu_outfitsData', JSON.stringify(outfitsData));
    }
  }, [inventorySchema, outfitsData, viewingFriend]);

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
  // targetId: si viene, usa ese owner_id; si no, usa el usuario logueado
  const loadProfilesList = async (targetId = null) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const targetOwnerId = targetId ?? user.user.id;

    try {
      const { data, error } = await supabase.from('outfit_profiles')
        .select('*')
        .eq('owner_id', targetOwnerId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setProfilesList(data || []);

      if (data && data.length > 0) {
        setActiveProfileId(data[0].id);
      } else {
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

            // Normalizar image_urls: puede venir como TEXT[] con strings JSON o con objetos
            const rawGallery = row.image_urls || [];
            const gallery = rawGallery.map(item => {
               // Caso 1: ya es objeto {url, path}
               if (item && typeof item === 'object' && item.url) return item;
               // Caso 2: string JSON stringificado
               if (typeof item === 'string') {
                  try {
                     const parsed = JSON.parse(item);
                     if (parsed?.url) return parsed;
                  } catch(_) {}
                  // Caso 3: string que ES la URL directa
                  if (item.startsWith('http')) return { url: item, path: '' };
                  // Caso 4: string que ES el path en el bucket
                  const { data: pub } = supabase.storage.from('saizu-gallery').getPublicUrl(item);
                  return { url: pub.publicUrl, path: item };
               }
               return null;
            }).filter(Boolean);

            newData[z][row.item_id] = {
               size: row.size_value || '',
               brands: row.brand || '',
               cut: row.extra_details?.cut || '',
               type: row.extra_details?.type || '',
               colors: row.extra_details?.colors || [],
               patterns: row.extra_details?.patterns || [],
               gallery
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
  }, [activeProfileId]);

  useEffect(() => {
    // Al cambiar el amigo visto (o volver a null): limpiar estado y recargar perfiles del nuevo target
    setInventorySchema(getEmptyInventorySchema());
    setOutfitsData(getEmptyOutfitState());
    setActiveProfileId(null);
    setProfilesList([]);
    const friendId = viewingFriend ? viewingFriend.id : null;
    loadProfilesList(friendId);
  }, [viewingFriend]);

  useEffect(() => {
    loadProfilesList(null); // Carga inicial: usuario propio
  }, []);

  // REALTIME SUBSCRIPTION ONLY
  useEffect(() => {
    if (!viewingFriend || !activeProfileId) return;

    const channel = supabase.channel(`public:sizes_data:profile_id=eq.${activeProfileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sizes_data', filter: `profile_id=eq.${activeProfileId}` }, payload => {
        console.log("Realtime DB Change Received:", payload);
        // Soft reload de la data
        loadActiveProfileData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewingFriend, activeProfileId]);

  const saveSingleItemToSupabase = async (zone, itemId) => {
    if (!activeProfileId) return false;
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;
      
      const userId = user.user.id;
      const item = outfitsData[zone][itemId];
      const schemaDef = inventorySchema[zone].find(x => x.id === itemId);

      const row = {
         owner_id: userId,
         profile_id: activeProfileId,
         zone: zone,
         item_id: itemId,
         size_value: item.size || null,
         brand: item.brands || null,
         image_urls: item.gallery || [],
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
      };

      // Limpia solo el item específico antes de recrear (Upsert sin PK)
      await supabase.from('sizes_data').delete()
        .eq('profile_id', activeProfileId)
        .eq('zone', zone)
        .eq('item_id', itemId);

      const { error } = await supabase.from('sizes_data').insert([row]);
      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error("Error guardando item en Supabase: ", err);
      return false;
    }
  };

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
        saveSingleItemToSupabase,
        viewingFriend,
        setViewingFriend,
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
