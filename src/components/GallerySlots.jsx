import React, { useRef } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { convertToWebP } from '../utils/imageOptimizer';
import { supabase } from '../lib/supabaseClient';
import { Plus, X, Upload } from 'lucide-react';

const GallerySlots = ({ itemId }) => {
  const { activeZoneData, addImageToItem, removeImageFromItem } = useSuitcase();
  const fileInputRef = useRef(null);

  const images = activeZoneData[itemId].gallery || [];

  const handleBoxClick = () => {
    if (images.length >= 3) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
       // 1. Client-side local optimization a WebP
       const { blob } = await convertToWebP(file, 0.85); 
       
       // 2. Generar Timestamp único
       const timestamp = Date.now();
       const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.webp`;
       
       // 3. Subir a Supabase
       const { error: uploadError } = await supabase.storage
         .from('saizu-gallery')
         .upload(fileName, blob, { contentType: 'image/webp' });

       if (uploadError) throw uploadError;

       // 4. Extraer URL Pública y guardarla al estado
       const { data: publicUrlData } = supabase.storage
         .from('saizu-gallery')
         .getPublicUrl(fileName);

       addImageToItem(itemId, { url: publicUrlData.publicUrl, path: fileName });
    } catch (err) {
      console.error("Error optimizing/uploading image:", err);
      alert("No se pudo procesar y subir la imagen. Intenta con otro archivo o verifica tu Auth.");
    }

    e.target.value = null;
  };

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {images.map((imgData, idx) => (
          <div key={idx} className="gallery-slot filled">
            <img src={imgData.url} alt={`Referencia ${idx + 1}`} />
            <button 
              className="delete-btn" 
              onClick={(e) => { e.stopPropagation(); removeImageFromItem(itemId, idx); }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        ))}

        {Array.from({ length: 3 - images.length }).map((_, idx) => (
          <div 
            key={`empty-${idx}`} 
            className="gallery-slot empty"
            onClick={idx === 0 ? handleBoxClick : undefined}
          >
            {idx === 0 ? <Plus size={20} color="#666" /> : <Upload size={20} color="#ccc" />}
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
};

export default GallerySlots;
