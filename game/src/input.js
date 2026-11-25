// Keyboard and mouse input. WASD or arrows move the chef, E or Space
// interacts, P pauses, Enter confirms. A mouse click sets a walk target (the
// chef walks there) and a click on a station the chef already stands at
// interacts, so the game plays with mouse alone too.
import { STATIONS } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const KEY_DIRS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createInput(canvas) {
  const pressed = new Set();
  let actions = 0;
  let interactQueued = false;
  let clickTarget = null;
  let canvasRect = null;

  function refreshRect() {
    canvasRect = canvas.getBoundingClientRect();
  }

  function onKeyDown(event) {
    if (event.code === 'Enter' || event.code === 'Space') {
      actions |= ACTION_CONFIRM;
      if (event.code === 'Space') interactQueued = true;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyE') {
      interactQueued = true;
    }
    pressed.add(event.code);
    if (event.code.startsWith('Arrow')) event.preventDefault();
  }

  function onKeyUp(event) {
    pressed.delete(event.code);
  }

  function onPointerDown(event) {
    refreshRect();
    const scaleX = 1280 / canvasRect.width;
    const scaleY = 720 / canvasRect.height;
    const x = (event.clientX - canvasRect.left) * scaleX;
    const y = (event.clientY - canvasRect.top) * scaleY;
    let nearStation = null;
    for (const station of STATIONS) {
      if (Math.hypot(station.x - x, station.y - y) < 70) { nearStation = station; break; }
    }
    if (nearStation) {
      clickTarget = { x: nearStation.ax, y: nearStation.ay, station: nearStation };
    } else {
      clickTarget = { x, y, station: null };
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  // The movement direction for this frame: keys win over a click target.
  function direction(state) {
    let mx = 0;
    let my = 0;
    for (const code of pressed) {
      const dir = KEY_DIRS[code];
      if (dir) { mx += dir[0]; my += dir[1]; }
    }
    if (mx !== 0 || my !== 0) {
      clickTarget = null;
      return { mx, my };
    }
    if (clickTarget) {
      const dx = clickTarget.x - state.chef.x;
      const dy = clickTarget.y - state.chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 12) {
        const station = clickTarget.station;
        clickTarget = null;
        if (station) interactQueued = true;
        return { mx: 0, my: 0 };
      }
      return { mx: dx / distance, my: dy / distance };
    }
    return { mx: 0, my: 0 };
  }

  function takeActions() {
    const value = actions;
    actions = 0;
    return value;
  }

  function takeInteract() {
    const value = interactQueued;
    interactQueued = false;
    return value;
  }

  function confirm() {
    actions |= ACTION_CONFIRM;
  }

  return { direction, takeActions, takeInteract, confirm };
}
