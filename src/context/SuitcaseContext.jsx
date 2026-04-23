import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { COLOR_PALETTE, PATTERNS } from '../utils/wardrobeData';
import { supabase } from '../lib/supabaseClient';

const SuitcaseContext = createContext();

export const useSuitcase = () => useContext(SuitcaseContext);

// Generates an absolutely empty schema layout
const getEmptyOutfitState = () => ({ head: {}, torso: {}, hands: {}, legs: {}, feet: {} });
const getEmptyInventorySchema = () => ({ head: [], torso: [], hands: [], legs: [], feet: [] });

// Opciones por defecto que coinciden con EditorPanel.jsx
const DEFAULT_SIZE_OPTS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DEFAULT_TYPE_OPTS = ['Est\u00e1ndar', 'Premium', 'Casual'];
const DEFAULT_CUT_OPTS = ['Slim Fit', 'Regular/Recto', 'Baggy/Oversize', 'Skinny'];

export const SuitcaseProvider = ({ children }) => {
  const [activeOutfit, setActiveOutfit] = useState(null);
  const [activeZone, setActiveZone] = useState(() => {
    const saved = localStorage.getItem('saizu_activeZone');
    return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
  });
  const [activeZoneData, setActiveZoneData] = useState([]);

  // NEW DYNAMIC PROFILES
  const [profilesList, setProfilesList] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_activeProfileId');
      return (saved && saved !== 'null' && saved !== 'undefined') ? saved : null;
    } catch (e) { return null; }
  });

  // -- SAÍZU NETWORK --
  const [viewingFriend, setViewingFriend] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_viewingFriend');
      if (saved && saved !== 'null' && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) { }
    return null;
  });
  const [friendsList, setFriendsList] = useState([]);

  // Guard: evita que el useEffect de viewingFriend arrase el estado en el primer render
  const isMounted = useRef(false);

  const [isSpinning, setIsSpinning] = useState(false);

  // They start completely empty or from draft memory
  const [inventorySchema, setInventorySchema] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_inventorySchema');
      if (saved && saved !== 'null' && saved !== 'undefined') return JSON.parse(saved) || getEmptyInventorySchema();
    } catch (e) { }
    return getEmptyInventorySchema();
  });
  const [outfitsData, setOutfitsData] = useState(() => {
    try {
      const saved = localStorage.getItem('saizu_outfitsData');
      if (saved && saved !== 'null' && saved !== 'undefined') return JSON.parse(saved) || getEmptyOutfitState();
    } catch (e) { }
    return getEmptyOutfitState();
  });

  useEffect(() => {
    if (activeZone) localStorage.setItem('saizu_activeZone', activeZone);
    else localStorage.removeItem('saizu_activeZone');
  }, [activeZone]);

  useEffect(() => {
    // Solo guardar activeProfileId cuando es el usuario propio (no amigo)
    if (!viewingFriend) {
      if (activeProfileId) localStorage.setItem('saizu_activeProfileId', activeProfileId);
      else localStorage.removeItem('saizu_activeProfileId');
    }
  }, [activeProfileId, viewingFriend]);

  useEffect(() => {
    // Persistir viewingFriend solo si tiene datos reales
    if (viewingFriend) {
      localStorage.setItem('saizu_viewingFriend', JSON.stringify(viewingFriend));
    } else {
      localStorage.removeItem('saizu_viewingFriend');
    }
  }, [viewingFriend]);

  useEffect(() => {
    if (!viewingFriend) {
      if (inventorySchema) localStorage.setItem('saizu_inventorySchema', JSON.stringify(inventorySchema));
      if (outfitsData) localStorage.setItem('saizu_outfitsData', JSON.stringify(outfitsData));
    }
  }, [inventorySchema, outfitsData, viewingFriend]);


  // Shared Global Options State
  // Estos estados son POR SESIÓN: los predefinidos vienen de wardrobeData,
  // los personalizados se reconstruyen al cargar cada perfil desde Supabase.
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
    setOutfitsData(prev => {
      const updated = {
        ...prev,
        [activeZone]: {
          ...prev[activeZone],
          [itemId]: {
            ...prev[activeZone][itemId],
            [field]: value
          }
        }
      };
      // Persistir draft por tecla (solo si hay perfil activo y es el usuario propio)
      if (activeProfileId && !viewingFriend) {
        try {
          const key = `saizu_draft_${activeProfileId}`;
          const existing = JSON.parse(localStorage.getItem(key) || '{}');
          if (!existing[activeZone]) existing[activeZone] = {};
          existing[activeZone][itemId] = {
            ...((existing[activeZone][itemId]) || {}),
            [field]: value
          };
          localStorage.setItem(key, JSON.stringify(existing));
        } catch (_) { }
      }
      return updated;
    });
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

  // CRUD: Delete an item completely (async: borra de Supabase y limpia draft)
  const deleteCustomItem = async (itemId) => {
    if (!activeZone || !activeProfileId) return;

    // 1. Borrar del estado local inmediatamente (UI responsiva)
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

    // 2. Borrar de Supabase para que no vuelva al recargar
    try {
      await supabase.from('sizes_data')
        .delete()
        .eq('profile_id', activeProfileId)
        .eq('zone', activeZone)
        .eq('item_id', itemId);

      // 3. Limpiar draft de localStorage si existía
      try {
        const key = `saizu_draft_${activeProfileId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        if (existing[activeZone]?.[itemId]) {
          delete existing[activeZone][itemId];
          if (Object.keys(existing[activeZone]).length === 0) delete existing[activeZone];
          if (Object.keys(existing).length === 0) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (_) { }
    } catch (err) {
      console.error('Error eliminando prenda de Supabase:', err);
    }
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
    const defaultColorId = `custom-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
    setGlobalColors(prev => {
      if (prev.find(c => c.id === defaultColorId)) return prev;
      return [...prev, { id: defaultColorId, hex, label: name }];
    });
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

    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1500);

    try {
      const { data, error } = await supabase.from('sizes_data').select('*').eq('profile_id', activeProfileId);
      if (error) throw error;

      // Leer draft buffer pendiente para este perfil
      let draftBuffer = {};
      try {
        const raw = localStorage.getItem(`saizu_draft_${activeProfileId}`);
        if (raw) draftBuffer = JSON.parse(raw) || {};
      } catch (_) { }

      if (data && data.length > 0) {
        let newSchema = getEmptyInventorySchema();
        let newData = getEmptyOutfitState();

        data.forEach(row => {
          const z = row.zone;
          if (!newSchema[z]) return;

          const reconstructedItem = {
            id: row.item_id,
            label: row.extra_details?.label || 'Prenda',
            icon: row.extra_details?.icon || '🛍️',
            sizeOpts: row.extra_details?.sizeOpts || [],
            typeOpts: row.extra_details?.typeOpts || [],
            cutOpts: row.extra_details?.cutOpts || [],
            // Restaurar attrs tal como el usuario los configuró
            attrs: row.extra_details?.attrs || undefined
          };
          newSchema[z].push(reconstructedItem);

          const rawGallery = row.image_urls || [];
          const gallery = rawGallery.map(item => {
            if (item && typeof item === 'object' && item.url) return item;
            if (typeof item === 'string') {
              try { const p = JSON.parse(item); if (p?.url) return p; } catch (_) { }
              if (item.startsWith('http')) return { url: item, path: '' };
              const { data: pub } = supabase.storage.from('saizu-gallery').getPublicUrl(item);
              return { url: pub.publicUrl, path: item };
            }
            return null;
          }).filter(Boolean);

          const fromDB = {
            size: row.size_value || '',
            brands: row.brand || '',
            cut: row.extra_details?.cut || '',
            type: row.extra_details?.type || '',
            colors: Array.isArray(row.extra_details?.colors) ? row.extra_details.colors : [],
            patterns: Array.isArray(row.extra_details?.patterns) ? row.extra_details.patterns : [],
            gallery
          };

          // Draft tiene prioridad sobre BD para el item específico
          const draft = draftBuffer[z]?.[row.item_id];
          newData[z][row.item_id] = draft ? { ...fromDB, ...draft } : fromDB;
        });

        // Reconstruir opciones personalizadas del perfil cargado (sin contaminar otros perfiles)
        const customPatterns = new Set();
        const customColorDefs = new Map(); // id -> { id, hex, label }

        data.forEach(row => {
          // Patrones personalizados
          (row.extra_details?.patterns || []).forEach(p => {
            if (!PATTERNS.includes(p)) customPatterns.add(p);
          });
          // Colores personalizados: leer customColorDefs guardado en extra_details
          (row.extra_details?.customColorDefs || []).forEach(c => {
            if (c?.id && c?.hex && !COLOR_PALETTE.find(cp => cp.id === c.id)) {
              customColorDefs.set(c.id, c);
            }
          });
        });

        setGlobalPatterns(
          customPatterns.size > 0 ? [...PATTERNS, ...Array.from(customPatterns)] : PATTERNS
        );
        setGlobalColors(
          customColorDefs.size > 0 ? [...COLOR_PALETTE, ...Array.from(customColorDefs.values())] : COLOR_PALETTE
        );

        setInventorySchema(newSchema);
        setOutfitsData(newData);
      }
    } catch (err) {
      console.error('Error cargando prendas del perfil: ', err);
    }
  };

  // Re-fetch automatically when active profile changes OR initial load
  useEffect(() => {
    loadActiveProfileData();
  }, [activeProfileId]);

  useEffect(() => {
    // En el mount inicial, esta lógica la maneja el useEffect([]) de abajo
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    // Al CAMBIAR el amigo (no en el primer render): limpiar y recargar
    setInventorySchema(getEmptyInventorySchema());
    setOutfitsData(getEmptyOutfitState());
    setActiveProfileId(null);
    setProfilesList([]);
    const friendId = viewingFriend ? viewingFriend.id : null;
    loadProfilesList(friendId);
  }, [viewingFriend]);

  useEffect(() => {
    // Carga inicial: si había un amigo guardado, cargar sus perfiles
    // Si no, cargar los perfiles propios respetando el activeProfileId guardado
    const savedFriend = viewingFriend;
    if (savedFriend?.id) {
      loadProfilesList(savedFriend.id);
    } else {
      loadProfilesList(null);
    }
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
          sizeOpts: (schemaDef?.sizeOpts?.length > 0) ? schemaDef.sizeOpts : DEFAULT_SIZE_OPTS,
          typeOpts: (schemaDef?.typeOpts?.length > 0) ? schemaDef.typeOpts : DEFAULT_TYPE_OPTS,
          cutOpts: (schemaDef?.cutOpts?.length > 0) ? schemaDef.cutOpts : DEFAULT_CUT_OPTS,
          attrs: schemaDef?.attrs || undefined
        }
      };

      // Limpia solo el item específico antes de recrear (Upsert sin PK)
      await supabase.from('sizes_data').delete()
        .eq('profile_id', activeProfileId)
        .eq('zone', zone)
        .eq('item_id', itemId);

      const { error } = await supabase.from('sizes_data').insert([row]);
      if (error) throw error;

      // Guardar exitoso: limpiar solo este item del draft buffer
      try {
        const key = `saizu_draft_${activeProfileId}`;
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        if (existing[zone]?.[itemId]) {
          delete existing[zone][itemId];
          if (Object.keys(existing[zone]).length === 0) delete existing[zone];
          if (Object.keys(existing).length === 0) localStorage.removeItem(key);
          else localStorage.setItem(key, JSON.stringify(existing));
        }
      } catch (_) { }

      return true;
    } catch (err) {
      console.error('Error guardando item en Supabase: ', err);
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
          const hasData = item.size || item.brands || item.cut || item.type ||
            (item.colors?.length > 0) || (item.patterns?.length > 0) ||
            (item.gallery?.length > 0);
          if (hasData) {
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
                sizeOpts: (schemaDef?.sizeOpts?.length > 0) ? schemaDef.sizeOpts : DEFAULT_SIZE_OPTS,
                typeOpts: (schemaDef?.typeOpts?.length > 0) ? schemaDef.typeOpts : DEFAULT_TYPE_OPTS,
                cutOpts: (schemaDef?.cutOpts?.length > 0) ? schemaDef.cutOpts : DEFAULT_CUT_OPTS,
                attrs: schemaDef?.attrs || undefined
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
