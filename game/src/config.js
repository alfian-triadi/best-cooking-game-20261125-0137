// Shared constants for Sizzle & Serve: the kitchen layout, the recipes, the
// ingredients and the shift rules. One file, one job: every number the world
// and the renderer agree on lives here.
export const STEP = 1 / 60;
export const VIEW = { width: 1280, height: 720 };
export const SHIFT_SECONDS = 150;
export const BEST_KEY = 'sizzle-and-serve-best';
export const ORDER_PATIENCE = 50;
export const ORDER_SPAWN_EVERY = 14;
export const MAX_ORDERS = 3;

// The floor the chef walks on. Counters and stations sit above it; the chef
// approaches each station from its approach point.
export const FLOOR = { x: 36, y: 300, width: 1208, height: 388 };
export const CHEF_SPEED = 280;
export const CHEF_RADIUS = 22;
export const INTERACT_RANGE = 115;

// Stations: id, kind, label, centre, approach point the chef walks to.
export const STATIONS = [
  { id: 'bin-bun', kind: 'bin', gives: 'bun', label: 'Buns', x: 150, y: 232, ax: 150, ay: 318 },
  { id: 'bin-lettuce', kind: 'bin', gives: 'lettuce', label: 'Lettuce', x: 300, y: 232, ax: 300, ay: 318 },
  { id: 'bin-tomato', kind: 'bin', gives: 'tomato', label: 'Tomato', x: 450, y: 232, ax: 450, ay: 318 },
  { id: 'bin-cheese', kind: 'bin', gives: 'cheese', label: 'Cheese', x: 600, y: 232, ax: 600, ay: 318 },
  { id: 'bin-patty', kind: 'bin', gives: 'patty_raw', label: 'Patty', x: 750, y: 232, ax: 750, ay: 318 },
  { id: 'board', kind: 'board', label: 'Chopping Board', x: 200, y: 440, ax: 200, ay: 528 },
  { id: 'grill', kind: 'grill', label: 'Grill', x: 480, y: 440, ax: 480, ay: 528 },
  { id: 'assembly', kind: 'assembly', label: 'Assembly Plate', x: 780, y: 440, ax: 780, ay: 528 },
  { id: 'serve', kind: 'serve', label: 'Serve Window', x: 1060, y: 440, ax: 1060, ay: 528 },
  { id: 'trash', kind: 'trash', label: 'Trash', x: 1180, y: 640, ax: 1180, ay: 640 },
];

// Ingredients: what the bins hand out, what the board and grill make of them,
// and what the plate accepts. `prepared` is the form a recipe wants.
export const ITEMS = {
  bun: { name: 'Bun', prepared: true },
  lettuce: { name: 'Lettuce', prepared: false, chopsTo: 'lettuce_chopped' },
  lettuce_chopped: { name: 'Lettuce', prepared: true },
  tomato: { name: 'Tomato', prepared: false, chopsTo: 'tomato_chopped' },
  tomato_chopped: { name: 'Tomato', prepared: true },
  cheese: { name: 'Cheese', prepared: true },
  patty_raw: { name: 'Raw Patty', prepared: false, grillsTo: 'patty' },
  patty: { name: 'Patty', prepared: true },
  patty_burnt: { name: 'Burnt Patty', prepared: false },
};

// Recipes: the dishes the order board asks for. `items` are prepared forms.
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce_chopped'], coins: 18 },
  { id: 'cheese', name: 'Cheese Burger', items: ['bun', 'patty', 'cheese', 'lettuce_chopped'], coins: 24 },
  { id: 'garden', name: 'Garden Bowl', items: ['lettuce_chopped', 'tomato_chopped', 'cheese'], coins: 20 },
];

export const CHOP_SECONDS = 1.6;
export const GRILL_SECONDS = 4;
export const BURN_AFTER_SECONDS = 6;
