import React, { useRef, useState, useEffect } from 'react';
import { useSuitcase } from '../context/SuitcaseContext';
import { convertToWebP } from '../utils/imageOptimizer';
import { supabase } from '../lib/supabaseClient';
import { Plus, X, Upload, ZoomIn } from 'lucide-react';

const GallerySlots = ({ itemId }) => {
  const { activeZoneData, addImageToItem, removeImageFromItem, viewingFriend } = useSuitcase();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const isReadOnly = !!viewingFriend;
  const itemData = activeZoneData[itemId];
  const images = itemData?.gallery || [];

  // Cerrar preview con Escape
  useEffect(() => {
    if (!previewUrl) return;
    const handleKey = (e) => { if (e.key === 'Escape') setPreviewUrl(null); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewUrl]);

  const handleBoxClick = () => {
    if (isReadOnly || images.length >= 3) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || isReadOnly) return;

    try {
      const { blob } = await convertToWebP(file, 0.85);
      const { data: { user } } = await supabase.auth.getUser();
      const ownerId = user?.id || 'unknown';
      const fileName = `${ownerId}/${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from('saizu-gallery')
        .upload(fileName, blob, { contentType: 'image/webp' });

      if (uploadError) throw uploadError;

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

  const getImgSrc = (imgData) => {
    if (!imgData) return '';
    if (typeof imgData === 'string') return imgData;
    return imgData.url || '';
  };

  return (
    <>
      {/* Modal de preview fullscreen */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
            backdropFilter: 'blur(8px)'
          }}
        >
          <img
            src={previewUrl}
            alt="Preview"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: '12px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              cursor: 'default',
              objectFit: 'contain'
            }}
          />
          <button
            onClick={() => setPreviewUrl(null)}
            style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: '50%', width: '40px', height: '40px',
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      <div className="gallery-container">
        <div className="gallery-grid">
          {images.map((imgData, idx) => {
            const src = getImgSrc(imgData);
            const ownerHint = viewingFriend ? `friend:${viewingFriend.id}` : 'self';
            console.log(`[GallerySlots] ${ownerHint} | itemId=${itemId} | idx=${idx} | src=${src}`);
            return (
              <div key={idx} className="gallery-slot filled" style={{ position: 'relative' }}>
                <img
                  src={src}
                  alt={`Referencia ${idx + 1}`}
                  onClick={() => setPreviewUrl(src)}
                  style={{ cursor: 'zoom-in', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                />
                {/* Ícono zoom — siempre visible, propio y amigo */}
                <button
                  onClick={() => setPreviewUrl(src)}
                  style={{
                    position: 'absolute', bottom: '4px', left: '4px',
                    background: 'rgba(0,0,0,0.55)', border: 'none',
                    borderRadius: '4px', padding: '3px 5px',
                    color: '#fff', cursor: 'pointer', lineHeight: 0
                  }}
                >
                  <ZoomIn size={12} />
                </button>
                {/* Borrado solo en modo propio */}
                {!isReadOnly && (
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); removeImageFromItem(itemId, idx); }}
                    style={{ position: 'absolute', top: '4px', right: '4px' }}
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
    </>
  );
};

export default GallerySlots;
