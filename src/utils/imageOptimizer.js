/**
 * Utility for client-side image optimization to WebP.
 * It reads a File, draws it into a canvas, and outputs a WebP Blob or base64.
 */
export const convertToWebP = (file, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    // COMPATIBILIDAD HEIC: 
    // iPhones usan HEIC. En Safari/iOS modernos se leen/convierten internamente al subir en el input.
    // Para dar soporte perfecto en todos los navegadores requeriría 'heic2any', pero con 'image/*'
    // en GallerySlots nos aseguramos que entren y el navegador las ofrezca como JPG/PNG si las soporta.

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      // Asegurar que respete la orientación EXIF de fotos móviles (iPhone)
      img.style.imageOrientation = "from-image";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Ultra optimización para móviles
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({
                blob,
                url,
                width,
                height
              });
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
