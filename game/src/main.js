// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|rush (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_ERROR, EVENT_EXPIRE, EVENT_OVER, EVENT_PICKUP, EVENT_READY, EVENT_SERVE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { playSound, SOUND_ERROR, SOUND_EXPIRE, SOUND_PICKUP, SOUND_READY, SOUND_SERVE } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve orders before customers walk out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      saveBest(best);
    }
    announce(`Shift over. ${world.state.coins} coins, ${world.state.served} dishes served. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function handleEvents(events) {
    if (events & EVENT_PICKUP) playSound(SOUND_PICKUP);
    if (events & EVENT_READY) playSound(SOUND_READY);
    if (events & EVENT_SERVE) playSound(SOUND_SERVE);
    if (events & EVENT_ERROR) playSound(SOUND_ERROR);
    if (events & EVENT_EXPIRE) playSound(SOUND_EXPIRE);
    if (events & EVENT_OVER) endGame();
  }

  function step() {
    handleActions();
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { mx: 0, my: 0, interact: false, idle: true });
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const direction = input.direction(world.state);
    const events = world.step(STEP, {
      mx: direction.mx,
      my: direction.my,
      interact: input.takeInteract(),
      idle: false,
    });
    handleEvents(events);
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
    }
    renderer.draw(world.state, screen, best);
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('pointerdown', () => {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) input.confirm();
  });
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
