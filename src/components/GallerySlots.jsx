import React, { useRef } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { convertToWebP } from '../utils/imageOptimizer';
import { supabase } from '../lib/supabaseClient';
import { Plus, X, Upload } from 'lucide-react';

const GallerySlots = ({ itemId }) => {
  const { activeZoneData, addImageToItem, removeImageFromItem, viewingFriend } = useSuitcase();
  const fileInputRef = useRef(null);

  const isReadOnly = !!viewingFriend;
  const itemData = activeZoneData[itemId];
  const images = itemData?.gallery || [];

  const handleBoxClick = () => {
    if (isReadOnly || images.length >= 3) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || isReadOnly) return;

    try {
      // 1. Optimizar a WebP en cliente
      const { blob } = await convertToWebP(file, 0.85);

      // 2. Path: owner_id/timestamp_random.webp para organización en el bucket
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id || 'unknown';
      const fileName = `${ownerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

      // 3. Subir a saizu-gallery
      const { error: uploadError } = await supabase.storage
        .from('saizu-gallery')
        .upload(fileName, blob, { contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      // 4. URL pública y guardar en estado
      const { data: publicUrlData } = supabase.storage
        .from('saizu-gallery')
        .getPublicUrl(fileName);

      addImageToItem(itemId, { url: publicUrlData.publicUrl, path: fileName });
    } catch (err) {
      console.error('Error optimizing/uploading image:', err);
      alert('No se pudo subir la imagen. Verifica tu conexión o permisos.');
    }

    e.target.value = null;
  };

  // Normaliza imagen: acepta {url: string} o string directo
  const getImgSrc = (imgData) => {
    if (!imgData) return '';
    if (typeof imgData === 'string') return imgData;
    return imgData.url || '';
  };

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {images.map((imgData, idx) => {
          const src = getImgSrc(imgData);
          console.log(`[GallerySlots] itemId=${itemId} idx=${idx} src=`, src, '| raw=', imgData);
          return (
          <div key={idx} className="gallery-slot filled">
            <img src={src} alt={`Referencia ${idx + 1}`} />
            {!isReadOnly && (
              <button
                className="delete-btn"
                onClick={(e) => { e.stopPropagation(); removeImageFromItem(itemId, idx); }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          );
        })}

        {/* Slots vacíos — solo clickeable si no es read-only */}
        {Array.from({ length: 3 - images.length }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className={`gallery-slot empty${isReadOnly ? '' : ' clickable'}`}
            onClick={(!isReadOnly && idx === 0) ? handleBoxClick : undefined}
            style={{ cursor: isReadOnly ? 'default' : (idx === 0 ? 'pointer' : 'default') }}
          >
            {isReadOnly
              ? <Upload size={20} color="#444" />
              : idx === 0 ? <Plus size={20} color="#666" /> : <Upload size={20} color="#ccc" />
            }
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
    </div>
  );
};

export default GallerySlots;
