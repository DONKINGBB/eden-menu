export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number; // Base price or single price
  prices?: { [size: string]: number }; // For multi-size items
  image: string;
  category: string;
  customizable?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: MenuCategory[] = [
  { id: 'ensaladas', name: 'Ensaladas', icon: '🥗' },
  { id: 'jugos', name: 'Jugos y Smoothies', icon: '🍹' },
  { id: 'infusiones', name: 'Infusiones', icon: '🍵' },
  { id: 'burritos-sandwiches', name: 'Wraps y Sándwiches', icon: '🌯' },
  { id: 'bowls', name: 'Bowls y Cocteles', icon: '🥣' },
  { id: 'embotellada', name: 'Embotellados', icon: '🥤' }
];

export const SALAD_OPTIONS = {
  proteins: [
    { id: 'pechuga-asada', name: 'Pechuga Asada' },
    { id: 'pechuga-empanizada', name: 'Pechuga Empanizada' },
    { id: 'atun', name: 'Atún' },
    { id: 'huevo-duro', name: 'Huevo Duro' }
  ],
  toppings: [
    { id: 'mango', name: 'Mango' },
    { id: 'uva', name: 'Uva' },
    { id: 'crutones', name: 'Crutones' },
    { id: 'fresa', name: 'Fresa' },
    { id: 'frambuesa', name: 'Frambuesa' },
    { id: 'platano', name: 'Plátano' },
    { id: 'blueberry', name: 'Blueberry' },
    { id: 'tomate-cherry', name: 'Tomate Cherry' },
    { id: 'queso-panela', name: 'Queso Panela' },
    { id: 'vegetales-hervidos', name: 'Brócoli y Zanahoria Hervida' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'pina', name: 'Piña' },
    { id: 'kiwi', name: 'Kiwi' }
  ],
  seedsAndNuts: [
    { id: 'almendra', name: 'Almendra' },
    { id: 'pasas', name: 'Pasas' },
    { id: 'nuez', name: 'Nuez' },
    { id: 'coco-rayado', name: 'Coco Rayado' },
    { id: 'arandano', name: 'Arándano' },
    { id: 'semillas-girasol', name: 'Semillas de Girasol' },
    { id: 'granola', name: 'Granola' },
    { id: 'chia', name: 'Chía' }
  ],
  dressings: [
    { id: 'mostaza-miel', name: 'Mostaza Miel' },
    { id: 'cilantro', name: 'Cilantro' },
    { id: 'chipotle', name: 'Chipotle' },
    { id: 'miel', name: 'Miel' },
    { id: 'bbq', name: 'BBQ' },
    { id: 'ranch', name: 'Ranch' },
    { id: 'mango-habanero', name: 'Mango Habanero' }
  ],
  extras: [
    { id: 'extra-topping', name: 'Topping Extra', price: 15 },
    { id: 'extra-protein', name: 'Proteína Extra', price: 30 },
    { id: 'extra-seed', name: 'Semillas/Frutos Secos Extra', price: 15 }
  ]
};

export const MENU_ITEMS: MenuItem[] = [
  // --- ENSALADAS ---
  {
    id: 'ensalada-chica',
    name: 'Ensalada Chica',
    description: '1 proteína, base lechuga, 4 toppings, 1 semilla, 1 fruto seco y aderezo a elegir.',
    price: 95,
    image: '/images/salad_bowl.png',
    category: 'ensaladas',
    customizable: true
  },
  {
    id: 'ensalada-grande',
    name: 'Ensalada Grande',
    description: '2 proteínas, base lechuga, 6 toppings, 2 semillas, 2 frutos secos y aderezo a elegir.',
    price: 150,
    image: '/images/salad_bowl.png',
    category: 'ensaladas',
    customizable: true
  },

  // --- JUGOS ---
  {
    id: 'jugos-clasicos',
    name: 'Jugos Naturales',
    description: 'Mandarina, Naranja, Sandía, Verde, Pepino o Limonada.',
    price: 70,
    prices: { 'Chico': 70, 'Grande': 80 },
    image: '/images/cold_pressed_juice.png',
    category: 'jugos',
    customizable: true
  },
  {
    id: 'jugo-mixto',
    name: 'Jugo Mixto',
    description: 'Jugo personalizado de 2 frutas a elegir.',
    price: 80,
    prices: { 'Chico': 80, 'Grande': 90 },
    image: '/images/cold_pressed_juice.png',
    category: 'jugos',
    customizable: true
  },
  {
    id: 'smoothies-deluxe',
    name: 'Smoothies Deluxe',
    description: 'Aguacate, Zanahoria, Mandarina, Piña, Carambola o Kiwi.',
    price: 80,
    prices: { 'Chico': 80, 'Grande': 90 },
    image: '/images/fruit_smoothie.png',
    category: 'jugos',
    customizable: true
  },
  {
    id: 'smoothies-clasicos',
    name: 'Smoothies Clásicos',
    description: 'Mango, Sandía, Naranja, Plátano o Fresa.',
    price: 70,
    prices: { 'Chico': 70, 'Grande': 80 },
    image: '/images/fruit_smoothie.png',
    category: 'jugos',
    customizable: true
  },

  // --- INFUSIONES ---
  {
    id: 'infusiones-premium',
    name: 'Infusión Premium',
    description: 'Negro-Durazno, Frutos rojos, Matcha-Sencha, Hierbabuena-Menta, Manzana-Canela, Manzanilla-Aloe Vera.',
    price: 55,
    prices: { 'Chico': 55, 'Grande': 65 },
    image: '/images/cold_pressed_juice.png', // Fallback to glass or we can styled it beautifully
    category: 'infusiones',
    customizable: true
  },

  // --- WRAPS Y SANDWICHES ---
  {
    id: 'burrito-pollo',
    name: 'Burrito de Pollo',
    description: 'Envuelto en tortilla gigante con lechuga, aguacate, zanahoria rayada, pepino rayado, frijoles, col y aderezo chipotle.',
    price: 75,
    image: '/images/chicken_wrap.png',
    category: 'burritos-sandwiches'
  },
  {
    id: 'sandwich-pollo',
    name: 'Sándwich / Torta de Pollo',
    description: 'Preparado con pollo jugoso, lechuga y verduras frescas en pan artesanal.',
    price: 75,
    image: '/images/chicken_wrap.png',
    category: 'burritos-sandwiches'
  },
  {
    id: 'sandwich-pavo',
    name: 'Sándwich / Torta de Jamón de Pavo',
    description: 'Jamón de pavo premium con aderezo, queso y vegetales frescos.',
    price: 65,
    image: '/images/chicken_wrap.png',
    category: 'burritos-sandwiches'
  },
  {
    id: 'rollito-pollo',
    name: 'Rollitos Vietnamitas de Pollo',
    description: 'Rollos de papel de arroz rellenos de pollo, lechuga, fideos de arroz y vegetales crocantes.',
    price: 95,
    image: '/images/chicken_wrap.png',
    category: 'burritos-sandwiches'
  },
  {
    id: 'rollito-tsurimi',
    name: 'Rollitos Vietnamitas de Tsurimi',
    description: 'Fresco tsurimi con finos vegetales envoltura en hoja de arroz.',
    price: 90,
    image: '/images/chicken_wrap.png',
    category: 'burritos-sandwiches'
  },

  // --- BOWLS ---
  {
    id: 'bowl-avena',
    name: 'Bowl de Avena',
    description: 'Avena cremosa acompañada de 2 frutas y 2 semillas a elegir.',
    price: 60,
    image: '/images/salad_bowl.png',
    category: 'bowls',
    customizable: true
  },
  {
    id: 'bowl-yogurt',
    name: 'Bowl de Yogurt',
    description: 'Yogurt natural acompañado de 2 frutas y 2 semillas a elegir.',
    price: 55,
    image: '/images/salad_bowl.png',
    category: 'bowls',
    customizable: true
  },
  {
    id: 'coctel-fruta',
    name: 'Cóctel de Frutas',
    description: 'Mezcla fresca de frutas de temporada con un toque de miel.',
    price: 65,
    image: '/images/salad_bowl.png',
    category: 'bowls'
  },

  // --- EMBOTELLADOS ---
  {
    id: 'agua-botella',
    name: 'Botella de Agua 600ml',
    price: 20,
    image: '/images/cold_pressed_juice.png',
    category: 'embotellada'
  },
  {
    id: 'electrolit',
    name: 'Electrolit',
    price: 25,
    image: '/images/cold_pressed_juice.png',
    category: 'embotellada'
  },
  {
    id: 'refresco-cero',
    name: 'Refresco Cero Azúcar',
    price: 25,
    image: '/images/cold_pressed_juice.png',
    category: 'embotellada'
  }
];
