/* Catálogo de la demo. Marcas y modelos inventados.
   Para usar una foto real agrega a la zapatilla:  image: 'img/archivo.jpg'
   (si no hay foto se dibuja la ilustración con los colores de "art"). */
window.BMM_SEED = {
  settings: {
    storeName: 'BMM',
    tagline: 'Zapatillas',
    whatsapp: '51999999999',
    promises: [
      'Delivery en Lima en 24 a 48 horas',
      'Paga con Yape, Plin o contra entrega',
      'Cambio de talla sin costo'
    ]
  },
  products: [
    {
      id: 'p01', name: 'Pista 90', brand: 'Kuntur', gender: 'Unisex',
      price: 389, salePrice: 329, featured: true, visible: true,
      description: 'Retro de running con mediasuela gruesa y capellada de malla. La que combina con todo.',
      sizes: { 36: 2, 37: 3, 38: 4, 39: 5, 40: 4, 41: 3, 42: 2, 43: 1, 44: 0 },
      art: { tile: '#FFD3BF', upper: '#FFFFFF', accent: '#F0532D', sole: '#17163B' }
    },
    {
      id: 'p02', name: 'Costa Low', brand: 'Salkan', gender: 'Mujer',
      price: 279, salePrice: null, featured: false, visible: true,
      description: 'Caña baja de cuero liso, liviana y fácil de limpiar.',
      sizes: { 36: 4, 37: 5, 38: 5, 39: 3, 40: 1, 41: 0, 42: 0, 43: 0, 44: 0 },
      art: { tile: '#CFE3FF', upper: '#FFFFFF', accent: '#2B3FF2', sole: '#FFFFFF' }
    },
    {
      id: 'p03', name: 'Trazo Court', brand: 'Vértice', gender: 'Hombre',
      price: 349, salePrice: null, featured: false, visible: true,
      description: 'Inspirada en las canchas de los 80. Suela de goma y puntera reforzada.',
      sizes: { 36: 0, 37: 0, 38: 1, 39: 3, 40: 5, 41: 5, 42: 4, 43: 2, 44: 1 },
      art: { tile: '#D7F0CB', upper: '#F7F4EA', accent: '#1F7A4D', sole: '#C98A3C' }
    },
    {
      id: 'p04', name: 'Nube Runner', brand: 'Orbe', gender: 'Mujer',
      price: 459, salePrice: 399, featured: false, visible: true,
      description: 'Amortiguación suave para caminar todo el día. Malla respirable.',
      sizes: { 36: 3, 37: 4, 38: 4, 39: 2, 40: 2, 41: 0, 42: 0, 43: 0, 44: 0 },
      art: { tile: '#F1D4F2', upper: '#FFFFFF', accent: '#B44BC4', sole: '#FFFFFF' }
    },
    {
      id: 'p05', name: 'Asfalto Mid', brand: 'Kuntur', gender: 'Hombre',
      price: 429, salePrice: null, featured: false, visible: true,
      description: 'Media caña en cuero negro con detalles en gris. Para el día a día.',
      sizes: { 36: 0, 37: 0, 38: 2, 39: 2, 40: 3, 41: 4, 42: 4, 43: 3, 44: 2 },
      art: { tile: '#23224F', upper: '#2E2D3D', accent: '#8C8FA8', sole: '#FFFFFF' }
    },
    {
      id: 'p06', name: 'Sol Classic', brand: 'Salkan', gender: 'Unisex',
      price: 259, salePrice: null, featured: false, visible: true,
      description: 'Lona resistente y suela vulcanizada. Un básico de todos los días.',
      sizes: { 36: 5, 37: 5, 38: 6, 39: 6, 40: 5, 41: 4, 42: 3, 43: 2, 44: 1 },
      art: { tile: '#FFE9A6', upper: '#FFC21A', accent: '#17163B', sole: '#FFFFFF' }
    },
    {
      id: 'p07', name: 'Brisa 2', brand: 'Orbe', gender: 'Mujer',
      price: 319, salePrice: 269, featured: false, visible: true,
      description: 'Ligera y flexible, con plantilla acolchada.',
      sizes: { 36: 2, 37: 2, 38: 3, 39: 1, 40: 0, 41: 0, 42: 0, 43: 0, 44: 0 },
      art: { tile: '#C9EEE9', upper: '#FFFFFF', accent: '#16A394', sole: '#E7E9F0' }
    },
    {
      id: 'p08', name: 'Rally XT', brand: 'Vértice', gender: 'Hombre',
      price: 499, salePrice: null, featured: false, visible: true,
      description: 'Suela con agarre para trocha y ciudad. Refuerzos laterales.',
      sizes: { 36: 0, 37: 0, 38: 0, 39: 2, 40: 3, 41: 3, 42: 3, 43: 2, 44: 2 },
      art: { tile: '#E3E5EC', upper: '#5B5F73', accent: '#F0532D', sole: '#17163B' }
    },
    {
      id: 'p09', name: 'Pista 90 Noche', brand: 'Kuntur', gender: 'Unisex',
      price: 389, salePrice: null, featured: false, visible: true,
      description: 'La Pista 90 en azul profundo con detalles amarillos.',
      sizes: { 36: 1, 37: 2, 38: 3, 39: 3, 40: 3, 41: 2, 42: 2, 43: 0, 44: 0 },
      art: { tile: '#D5D9FF', upper: '#2B3FF2', accent: '#FFC21A', sole: '#FFFFFF' }
    },
    {
      id: 'p10', name: 'Barrio Skate', brand: 'Salkan', gender: 'Unisex',
      price: 299, salePrice: null, featured: false, visible: true,
      description: 'Gamuza reforzada y suela plana para mejor contacto con la tabla.',
      sizes: { 36: 0, 37: 1, 38: 2, 39: 4, 40: 4, 41: 4, 42: 2, 43: 1, 44: 0 },
      art: { tile: '#F3DCC2', upper: '#8A4B2B', accent: '#F7F4EA', sole: '#F7F4EA' }
    },
    {
      id: 'p11', name: 'Aro Alto', brand: 'Vértice', gender: 'Hombre',
      price: 549, salePrice: 469, featured: false, visible: true,
      description: 'De básquet, con soporte en el tobillo y cámara de aire en el talón.',
      sizes: { 36: 0, 37: 0, 38: 0, 39: 1, 40: 2, 41: 3, 42: 3, 43: 3, 44: 2 },
      art: { tile: '#FFCFCF', upper: '#FFFFFF', accent: '#D7263D', sole: '#17163B' }
    },
    {
      id: 'p12', name: 'Lima Slip', brand: 'Orbe', gender: 'Mujer',
      price: 189, salePrice: null, featured: false, visible: true,
      description: 'Sin pasadores. Te la pones y sales.',
      sizes: { 36: 0, 37: 0, 38: 0, 39: 0, 40: 0, 41: 0, 42: 0, 43: 0, 44: 0 },
      art: { tile: '#E0E3EC', upper: '#F7F4EA', accent: '#17163B', sole: '#FFFFFF' }
    }
  ]
};
