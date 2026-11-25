// The kitchen's state and rules: the chef, the stations, the orders, the
// plate and the shift timer. No drawing here; the renderer reads `state`.
import {
  BURN_AFTER_SECONDS, CHEF_RADIUS, CHEF_SPEED, CHOP_SECONDS, FLOOR,
  GRILL_SECONDS, INTERACT_RANGE, ITEMS, MAX_ORDERS, ORDER_PATIENCE,
  ORDER_SPAWN_EVERY, RECIPES, SHIFT_SECONDS, STATIONS,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_CHOP = 2;
export const EVENT_READY = 4;
export const EVENT_SERVE = 8;
export const EVENT_ERROR = 16;
export const EVENT_EXPIRE = 32;
export const EVENT_OVER = 64;

function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, index) => item === sortedB[index]);
}

export function createWorld(random) {
  const state = {
    chef: { x: 640, y: 600, carrying: null, facing: 1 },
    board: { item: null, progress: 0 },
    grill: { item: null, progress: 0 },
    plate: [],
    orders: [],
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnIn: 2,
    nextOrderId: 1,
    flash: '',
    flashUntil: 0,
    over: false,
  };

  function spawnOrder() {
    const recipe = random.pick(RECIPES);
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience: ORDER_PATIENCE,
      maxPatience: ORDER_PATIENCE,
    });
    state.nextOrderId += 1;
  }

  function setFlash(message) {
    state.flash = message;
    state.flashUntil = state.elapsed + 1.6;
  }

  function nearestStation() {
    let best = null;
    let bestDistance = INTERACT_RANGE;
    for (const station of STATIONS) {
      const dx = station.x - state.chef.x;
      const dy = station.y - state.chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station;
      }
    }
    return best;
  }

  // One interaction at the station under the chef. Returns event flags.
  function interact() {
    const station = nearestStation();
    if (!station) return EVENT_NONE;
    const chef = state.chef;

    if (station.kind === 'bin') {
      if (chef.carrying) { setFlash('Hands full!'); return EVENT_ERROR; }
      chef.carrying = station.gives;
      return EVENT_PICKUP;
    }
    if (station.kind === 'trash') {
      if (chef.carrying) { chef.carrying = null; return EVENT_PICKUP; }
      if (state.plate.length > 0) { state.plate = []; setFlash('Plate cleared'); return EVENT_PICKUP; }
      return EVENT_NONE;
    }
    if (station.kind === 'board') {
      if (state.board.item && state.board.progress >= CHOP_SECONDS) {
        if (chef.carrying) { setFlash('Hands full!'); return EVENT_ERROR; }
        chef.carrying = ITEMS[state.board.item].chopsTo;
        state.board.item = null;
        state.board.progress = 0;
        return EVENT_PICKUP;
      }
      if (!state.board.item && chef.carrying && ITEMS[chef.carrying].chopsTo) {
        state.board.item = chef.carrying;
        state.board.progress = 0;
        chef.carrying = null;
        return EVENT_CHOP;
      }
      if (!state.board.item && chef.carrying) { setFlash('That does not need chopping'); return EVENT_ERROR; }
      return EVENT_NONE;
    }
    if (station.kind === 'grill') {
      if (state.grill.item) {
        if (state.grill.progress < GRILL_SECONDS) { setFlash('Still cooking…'); return EVENT_NONE; }
        if (chef.carrying) { setFlash('Hands full!'); return EVENT_ERROR; }
        chef.carrying = state.grill.progress >= GRILL_SECONDS + BURN_AFTER_SECONDS ? 'patty_burnt' : 'patty';
        state.grill.item = null;
        state.grill.progress = 0;
        return EVENT_PICKUP;
      }
      if (chef.carrying === 'patty_raw') {
        state.grill.item = 'patty_raw';
        state.grill.progress = 0;
        chef.carrying = null;
        return EVENT_CHOP;
      }
      if (chef.carrying) { setFlash('Only raw patties go on the grill'); return EVENT_ERROR; }
      return EVENT_NONE;
    }
    if (station.kind === 'assembly') {
      if (chef.carrying) {
        if (!ITEMS[chef.carrying].prepared) { setFlash('Prepare it first!'); return EVENT_ERROR; }
        if (state.plate.length >= 5) { setFlash('Plate is full'); return EVENT_ERROR; }
        state.plate.push(chef.carrying);
        chef.carrying = null;
        return EVENT_PICKUP;
      }
      if (state.plate.length > 0) {
        chef.carrying = state.plate.pop();
        return EVENT_PICKUP;
      }
      return EVENT_NONE;
    }
    if (station.kind === 'serve') {
      if (state.plate.length === 0) { setFlash('Nothing on the plate'); return EVENT_ERROR; }
      const order = state.orders.find((candidate) => sameItems(candidate.recipe.items, state.plate));
      if (!order) { setFlash('No order matches this plate'); return EVENT_ERROR; }
      state.orders = state.orders.filter((candidate) => candidate.id !== order.id);
      const bonus = Math.round((order.patience / order.maxPatience) * 6);
      const earned = order.recipe.coins + bonus + state.combo * 2;
      state.coins += earned;
      state.served += 1;
      state.combo += 1;
      state.plate = [];
      setFlash(`Served! +${earned} coins`);
      return EVENT_SERVE;
    }
    return EVENT_NONE;
  }

  function reset() {
    state.chef.x = 640;
    state.chef.y = 600;
    state.chef.carrying = null;
    state.board.item = null;
    state.board.progress = 0;
    state.grill.item = null;
    state.grill.progress = 0;
    state.plate = [];
    state.orders = [];
    state.coins = 0;
    state.served = 0;
    state.missed = 0;
    state.combo = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.spawnIn = 2;
    state.nextOrderId = 1;
    state.flash = '';
    state.flashUntil = 0;
    state.over = false;
  }

  // Advance the world one fixed step. `input` is { mx, my, interact, idle }:
  // mx/my is the movement direction, interact is an edge trigger, and idle
  // freezes the chef (title screen background) without touching the timer.
  function step(dt, input) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    const chef = state.chef;

    if (!input.idle) {
      const length = Math.hypot(input.mx, input.my);
      if (length > 0) {
        chef.x += (input.mx / length) * CHEF_SPEED * dt;
        chef.y += (input.my / length) * CHEF_SPEED * dt;
        if (input.mx !== 0) chef.facing = input.mx > 0 ? 1 : -1;
      }
      chef.x = Math.min(FLOOR.x + FLOOR.width - CHEF_RADIUS, Math.max(FLOOR.x + CHEF_RADIUS, chef.x));
      chef.y = Math.min(FLOOR.y + FLOOR.height - CHEF_RADIUS, Math.max(FLOOR.y + CHEF_RADIUS, chef.y));
      if (input.interact) events |= interact();
    }

    // Chopping and grilling finish on their own clocks.
    if (state.board.item && state.board.progress < CHOP_SECONDS) {
      const was = state.board.progress;
      state.board.progress = Math.min(CHOP_SECONDS, state.board.progress + dt);
      if (was < CHOP_SECONDS && state.board.progress >= CHOP_SECONDS) events |= EVENT_READY;
    }
    if (state.grill.item) {
      const was = state.grill.progress;
      state.grill.progress += dt;
      if (was < GRILL_SECONDS && state.grill.progress >= GRILL_SECONDS) events |= EVENT_READY;
    }

    if (!input.idle) {
      state.elapsed += dt;
      state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) {
        if (state.orders.length < MAX_ORDERS) spawnOrder();
        state.spawnIn = ORDER_SPAWN_EVERY;
      }
      for (const order of state.orders) order.patience -= dt;
      const expired = state.orders.filter((order) => order.patience <= 0);
      if (expired.length > 0) {
        state.orders = state.orders.filter((order) => order.patience > 0);
        state.missed += expired.length;
        state.combo = 0;
        setFlash('An order walked out!');
        events |= EVENT_EXPIRE;
      }
      if (state.timeLeft <= 0) {
        state.over = true;
        events |= EVENT_OVER;
      }
    }
    return events;
  }

  return { state, step, reset, stationById };
}
