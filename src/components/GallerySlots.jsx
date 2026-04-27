import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSuitcase } from '../context/SuitcaseContext';
import { convertToWebP } from '../utils/imageOptimizer';
import { supabase } from '../lib/supabaseClient';
import { Plus, X, Upload, ZoomIn } from 'lucide-react';

// Modal renderizado en document.body via Portal — siempre centrado en pantalla completa
const ImageModal = ({ src, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.9)',
          cursor: 'default',
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '44px', height: '44px',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}
      >
        <X size={20} />
      </button>
    </div>,
    document.body
  );
};

const GallerySlots = ({ itemId }) => {
  const { activeZoneData, addImageToItem, removeImageFromItem, viewingFriend } = useSuitcase();
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
      // Usamos el default de quality=0.75 del imageOptimizer
      const { blob } = await convertToWebP(file);
      
      console.log(`🖼️ [Optimización de Imagen]`);
      console.log(`- Original: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`- Optimizado: ${(blob.size / 1024).toFixed(2)} KB`);
      console.log(`- Reducción: ${(((file.size - blob.size) / file.size) * 100).toFixed(1)}%`);

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
      console.error('Error uploading image:', err);
      alert('No se pudo subir la imagen.');
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
      {/* Portal: se monta en document.body, fuera de cualquier panel */}
      {previewUrl && <ImageModal src={previewUrl} onClose={() => setPreviewUrl(null)} />}

      <div className="gallery-container">
        <div className="gallery-grid">
          {images.map((imgData, idx) => {
            const src = getImgSrc(imgData);
            const ownerHint = viewingFriend ? `friend:${viewingFriend.id}` : 'self';
            console.log(`[GallerySlots] ${ownerHint} | itemId=${itemId} | idx=${idx} | src=${src}`);
            return (
              <div key={idx} className="gallery-slot filled" style={{ position: 'relative' }}>
                {/* Imagen — siempre clickeable para zoom */}
                <img
                  src={src}
                  alt={`Referencia ${idx + 1}`}
                  onClick={() => setPreviewUrl(src)}
                  style={{ cursor: 'zoom-in', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                />

                {/* Botón zoom — SIEMPRE visible, modo propio y modo amigo */}
                <button
                  onClick={() => setPreviewUrl(src)}
                  title="Ver en grande"
                  style={{
                    position: 'absolute', bottom: '4px', left: '4px',
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    color: '#fff',
                    cursor: 'pointer',
                    lineHeight: 0,
                    pointerEvents: 'auto', // garantizado
                  }}
                >
                  <ZoomIn size={12} />
                </button>

                {/* Botón borrar — SOLO en modo propio */}
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

          {/* Slots vacíos — solo interactivos en modo propio */}
          {Array.from({ length: 3 - images.length }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="gallery-slot empty"
              onClick={(!isReadOnly && idx === 0) ? handleBoxClick : undefined}
              style={{ cursor: (!isReadOnly && idx === 0) ? 'pointer' : 'default' }}
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
