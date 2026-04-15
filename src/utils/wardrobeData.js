// Minimalist Color Palette (Hex)
export const COLOR_PALETTE = [
  { id: 'white', hex: '#FFFFFF', label: 'Blanco' },
  { id: 'black', hex: '#111827', label: 'Negro' },
  { id: 'gray', hex: '#9CA3AF', label: 'Gris' },
  { id: 'navy', hex: '#1E3A8A', label: 'Azul Marino' },
  { id: 'blue', hex: '#3B82F6', label: 'Azul Claro' },
  { id: 'red', hex: '#EF4444', label: 'Rojo' },
  { id: 'burgundy', hex: '#7F1D1D', label: 'Vino' },
  { id: 'beige', hex: '#D4D4D8', label: 'Beige' },
  { id: 'brown', hex: '#92400E', label: 'Marrón' },
  { id: 'green', hex: '#10B981', label: 'Verde' },
  { id: 'olive', hex: '#4D7C0F', label: 'Olivo' },
  { id: 'yellow', hex: '#F59E0B', label: 'Amarillo' },
  { id: 'pink', hex: '#EC4899', label: 'Rosa' },
  { id: 'purple', hex: '#8B5CF6', label: 'Morado' },
];

export const PATTERNS = ['Sólido', 'Líneas', 'Cuadros', 'Ondas', 'Fuego', 'Floral', 'Animal Print'];
export const CUTS = ['Slim Fit', 'Regular/Recto', 'Baggy/Oversize', 'Skinny'];
export const WATCH_TYPES = ['Clásico', 'Deportivo', 'Smartwatch', 'Correa de Cuero', 'Acero'];
export const HEAD_TYPES = ['Gorra Clásica', 'Sombrero', 'Beanie/Chullo', 'Visera'];

export const SIZES = {
  letters: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
  eu34_45: Array.from({ length: 12 }, (_, i) => String(34 + i)),
  rings: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14'], 
  // Ring US sizes typically go from 5 to 14
};

// Item configuration schema
// The 'attributes' array governs what inputs show up inside the accordion.
// Supported: 'size' (needs options array), 'brands' (text), 'colors' (multi-hex), 'patterns' (multi-select), 'cut', 'type', 'gallery'.
export const WARDROBE_SCHEMA = {
  'ÉL': {
    head: [
      { id: 'gorra', label: 'Gorra/Sombrero', attrs: ['size', 'type', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters, typeOpts: HEAD_TYPES },
      { id: 'lentes', label: 'Lentes', attrs: ['brands', 'colors', 'gallery'] }
    ],
    torso: [
      { id: 'polo', label: 'Polo/T-Shirt', attrs: ['size', 'cut', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'camisa', label: 'Camisa', attrs: ['size', 'cut', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'saco', label: 'Saco/Blazer', attrs: ['size', 'cut', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'corbata', label: 'Corbata', attrs: ['colors', 'patterns', 'gallery'] }
    ],
    hands: [
      { id: 'reloj', label: 'Reloj', attrs: ['type', 'brands', 'colors', 'gallery'], typeOpts: WATCH_TYPES },
      { id: 'pulsera', label: 'Pulseras', attrs: ['type', 'colors', 'gallery'], typeOpts: ['Cuero', 'Metal', 'Tejida', 'Piedras'] },
      { id: 'perfume', label: 'Perfume', attrs: ['brands', 'type', 'gallery'], typeOpts: ['Cítrico', 'Maderoso', 'Dulce', 'Acuático'] }
    ],
    legs: [
      { id: 'pantalon', label: 'Pantalones', attrs: ['size', 'cut', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'short', label: 'Shorts', attrs: ['size', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters },
      { id: 'bermuda', label: 'Bermudas', attrs: ['size', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters },
      { id: 'boxer', label: 'Boxers', attrs: ['size', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters }
    ],
    feet: [
      { id: 'zapatillas', label: 'Zapatillas', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45 },
      { id: 'zapatos', label: 'Zapatos de Vestir', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45 },
      { id: 'medias', label: 'Medias', attrs: ['size', 'type', 'colors', 'patterns', 'gallery'], sizeOpts: ['Cortas', 'Tobilleras', 'Largas'], typeOpts: ['Deportivas', 'Vestir'] }
    ]
  },
  'ELLA': {
    head: [
      { id: 'sombrero', label: 'Sombrero/Gorra', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters },
      { id: 'lentes', label: 'Lentes de Sol', attrs: ['brands', 'colors', 'gallery'] },
      { id: 'aretes', label: 'Aretes/Pendientes', attrs: ['type', 'brands', 'colors', 'gallery'], typeOpts: ['Largos', 'Argollas', 'Pequeños'] }
    ],
    torso: [
      { id: 'blusa', label: 'Blusa/Top', attrs: ['size', 'cut', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'vestido', label: 'Vestido', attrs: ['size', 'type', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters, typeOpts: ['Corto', 'Midi', 'Largo', 'Gala'] },
      { id: 'chaqueta', label: 'Chaqueta/Abrigo', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters },
      { id: 'bra', label: 'Lencería (Top)', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: ['32A', '32B', '32C', '34A', '34B', '34C', '34D', '36A', '36B', '36C', '36D', '38B'] }
    ],
    hands: [
      { id: 'anillo', label: 'Anillos', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.rings },
      { id: 'pulsera', label: 'Pulseras', attrs: ['brands', 'colors', 'gallery'] },
      { id: 'collar', label: 'Collares/Cadenas', attrs: ['type', 'brands', 'colors', 'gallery'], typeOpts: ['Gargantilla', 'Largo', 'Con Dije'] },
      { id: 'reloj', label: 'Reloj', attrs: ['brands', 'colors', 'gallery'] },
      { id: 'perfume', label: 'Perfume', attrs: ['brands', 'type', 'gallery'], typeOpts: ['Floral', 'Dulce', 'Cítrico', 'Amaderado'] },
      { id: 'cartera', label: 'Cartera/Bolso', attrs: ['type', 'brands', 'colors', 'gallery'], typeOpts: ['Mano', 'Cruzado', 'Mochila', 'Tote'] }
    ],
    legs: [
      { id: 'pantalon', label: 'Pantalones/Jeans', attrs: ['size', 'cut', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters, cutOpts: CUTS },
      { id: 'falda', label: 'Faldas', attrs: ['size', 'type', 'brands', 'colors', 'patterns', 'gallery'], sizeOpts: SIZES.letters, typeOpts: ['Corta', 'Midi', 'Larga', 'Plisada'] },
      { id: 'short', label: 'Shorts', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters },
      { id: 'panty', label: 'Lencería (Bottom)', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.letters }
    ],
    feet: [
      { id: 'zapatillas', label: 'Zapatillas', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45 },
      { id: 'tacones', label: 'Tacones', attrs: ['size', 'type', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45, typeOpts: ['Altos', 'Plataforma', 'Cuña', 'Bajos'] },
      { id: 'sandalias', label: 'Sandalias/Flats', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45 },
      { id: 'botas', label: 'Botas', attrs: ['size', 'brands', 'colors', 'gallery'], sizeOpts: SIZES.eu34_45 },
      { id: 'medias', label: 'Medias/Pantys', attrs: ['size', 'colors', 'gallery'], sizeOpts: SIZES.letters }
    ]
  }
};
