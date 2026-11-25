// Everything the player sees, painted on one canvas: the kitchen, the order
// board, the stations, the chef, the plate, the HUD and the screens. The
// world owns the state; this file only draws it.
import {
  CHOP_SECONDS, FLOOR, GRILL_SECONDS, INTERACT_RANGE, ITEMS, SHIFT_SECONDS, STATIONS, VIEW,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const WOOD = '#a4713b';
const WOOD_DARK = '#7d5227';
const TILE_A = '#e8cfa8';
const TILE_B = '#dfc193';
const WALL = '#f7ead2';
const INK = '#3a2a18';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// One ingredient, drawn from shapes at (x, y) with the given radius.
export function drawIngredient(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'bun') {
    ctx.fillStyle = '#e8a34c';
    ctx.beginPath();
    ctx.arc(0, -r * 0.15, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c97e2e';
    ctx.fillRect(-r, -r * 0.15, r * 2, r * 0.35);
    ctx.fillStyle = '#f7d9a0';
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.55, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.7, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'lettuce' || kind === 'lettuce_chopped') {
    ctx.fillStyle = '#57b25e';
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * r * 0.45, Math.sin(angle) * r * 0.45, r * 0.55, r * 0.38, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#8ed694';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    if (kind === 'lettuce_chopped') {
      ctx.strokeStyle = '#2f7d35';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
    }
  } else if (kind === 'tomato' || kind === 'tomato_chopped') {
    ctx.fillStyle = '#e04536';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f9e4d';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(-r * 0.35, -r * 0.5);
    ctx.lineTo(r * 0.35, -r * 0.5);
    ctx.closePath();
    ctx.fill();
    if (kind === 'tomato_chopped') {
      ctx.strokeStyle = '#a02c20';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.6);
      ctx.lineTo(r * 0.6, r * 0.6);
      ctx.moveTo(r * 0.6, -r * 0.6);
      ctx.lineTo(-r * 0.6, r * 0.6);
      ctx.stroke();
    }
  } else if (kind === 'cheese') {
    ctx.fillStyle = '#ffc93c';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(r, r * 0.7);
    ctx.lineTo(r, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a90c';
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.3, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.4, r * 0.1, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'patty_raw' || kind === 'patty' || kind === 'patty_burnt') {
    ctx.fillStyle = kind === 'patty_raw' ? '#d98a7a' : kind === 'patty' ? '#7a4a28' : '#2e2118';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    if (kind === 'patty') {
      ctx.strokeStyle = '#4a2c14';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.3);
      ctx.lineTo(r * 0.6, -r * 0.3);
      ctx.moveTo(-r * 0.6, r * 0.3);
      ctx.lineTo(r * 0.6, r * 0.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStationBase(ctx, station, highlight) {
  ctx.save();
  if (highlight) {
    ctx.fillStyle = 'rgba(255, 214, 90, 0.35)';
    ctx.beginPath();
    ctx.arc(station.x, station.y, 62, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBin(ctx, station, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#8a5a2b';
  roundRect(ctx, station.x - 52, station.y - 34, 104, 68, 10);
  ctx.fill();
  ctx.fillStyle = '#c98f4e';
  roundRect(ctx, station.x - 46, station.y - 28, 92, 56, 8);
  ctx.fill();
  drawIngredient(ctx, station.gives, station.x, station.y, 22);
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x, station.y + 52);
}

function drawBoard(ctx, station, state, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#6b4a2a';
  roundRect(ctx, station.x - 78, station.y - 44, 156, 88, 10);
  ctx.fill();
  ctx.fillStyle = '#e9c893';
  roundRect(ctx, station.x - 70, station.y - 36, 140, 72, 8);
  ctx.fill();
  if (state.board.item) {
    drawIngredient(ctx, state.board.item, station.x, station.y - 4, 24);
    const done = state.board.progress >= CHOP_SECONDS;
    ctx.fillStyle = done ? '#2f9e4d' : '#d98a1f';
    roundRect(ctx, station.x - 40, station.y + 24, 80, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, station.x - 40, station.y + 24, 80 * (state.board.progress / CHOP_SECONDS), 8, 4);
    ctx.fill();
    if (done) {
      ctx.fillStyle = '#2f7d35';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('READY', station.x, station.y + 48);
    }
  } else {
    ctx.fillStyle = '#9a7b52';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('chop here', station.x, station.y + 2);
  }
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x, station.y + 64);
}

function drawGrill(ctx, station, state, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#3d3d46';
  roundRect(ctx, station.x - 82, station.y - 46, 164, 92, 10);
  ctx.fill();
  ctx.fillStyle = '#232329';
  roundRect(ctx, station.x - 72, station.y - 36, 144, 72, 8);
  ctx.fill();
  ctx.strokeStyle = '#5a5a66';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(station.x + i * 26, station.y - 34);
    ctx.lineTo(station.x + i * 26, station.y + 34);
    ctx.stroke();
  }
  if (state.grill.item) {
    const cooked = state.grill.progress >= GRILL_SECONDS;
    const burnt = state.grill.progress >= GRILL_SECONDS + 6;
    drawIngredient(ctx, burnt ? 'patty_burnt' : cooked ? 'patty' : 'patty_raw', station.x, station.y, 26);
    ctx.fillStyle = cooked ? '#2f9e4d' : '#ff8c1a';
    roundRect(ctx, station.x - 40, station.y + 30, 80, 8, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, station.x - 40, station.y + 30, 80 * Math.min(1, state.grill.progress / GRILL_SECONDS), 8, 4);
    ctx.fill();
    if (burnt) {
      ctx.fillStyle = '#e04536';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BURNT!', station.x, station.y + 54);
    }
  }
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x, station.y + 66);
}

function drawAssembly(ctx, station, state, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#6b4a2a';
  roundRect(ctx, station.x - 82, station.y - 44, 164, 88, 10);
  ctx.fill();
  ctx.fillStyle = '#f2e6cf';
  roundRect(ctx, station.x - 74, station.y - 36, 148, 72, 8);
  ctx.fill();
  // The plate: a white dish with the stack of ingredients on it.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(station.x, station.y + 8, 58, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  const stack = state.plate;
  stack.forEach((item, index) => {
    drawIngredient(ctx, item, station.x, station.y - 6 - index * 13, 20);
  });
  if (stack.length === 0) {
    ctx.fillStyle = '#9a7b52';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('plate', station.x, station.y - 4);
  }
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x, station.y + 64);
}

function drawServe(ctx, station, state, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#8a2f2f';
  roundRect(ctx, station.x - 82, station.y - 46, 164, 92, 10);
  ctx.fill();
  ctx.fillStyle = '#f7ead2';
  roundRect(ctx, station.x - 74, station.y - 38, 148, 76, 8);
  ctx.fill();
  ctx.fillStyle = '#8a2f2f';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE', station.x, station.y - 8);
  ctx.fillStyle = INK;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('match an order', station.x, station.y + 16);
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(station.label, station.x, station.y + 66);
}

function drawTrash(ctx, station, highlight) {
  drawStationBase(ctx, station, highlight);
  ctx.fillStyle = '#4a5568';
  roundRect(ctx, station.x - 30, station.y - 30, 60, 60, 8);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(station.x - 18, station.y - 22);
  ctx.lineTo(station.x + 18, station.y - 22);
  ctx.moveTo(station.x - 14, station.y - 22);
  ctx.lineTo(station.x - 10, station.y + 20);
  ctx.moveTo(station.x + 14, station.y - 22);
  ctx.lineTo(station.x + 10, station.y + 20);
  ctx.moveTo(station.x, station.y - 22);
  ctx.lineTo(station.x, station.y + 20);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(station.label, station.x, station.y + 52);
}

function drawChef(ctx, chef) {
  ctx.save();
  ctx.translate(chef.x, chef.y);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body and apron.
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -18, -6, 36, 26, 10);
  ctx.fill();
  ctx.fillStyle = '#2f7fc1';
  roundRect(ctx, -18, 8, 36, 12, 6);
  ctx.fill();
  // Head and toque.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(0, -18, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-8, -30, 9, 0, Math.PI * 2);
  ctx.arc(0, -34, 10, 0, Math.PI * 2);
  ctx.arc(8, -30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-14, -30, 28, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.arc(chef.facing * 4 - 4, -18, 2, 0, Math.PI * 2);
  ctx.arc(chef.facing * 4 + 4, -18, 2, 0, Math.PI * 2);
  ctx.fill();
  // Carried ingredient rides above the toque.
  if (chef.carrying) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(0, -52, 20, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, chef.carrying, 0, -52, 15);
  }
  ctx.restore();
}

function drawOrderTicket(ctx, order, x, y) {
  const width = 300;
  const height = 96;
  const urgency = order.patience / order.maxPatience;
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x, y, width, height, 12);
  ctx.fill();
  ctx.strokeStyle = urgency < 0.33 ? '#e04536' : '#c9a86a';
  ctx.lineWidth = urgency < 0.33 ? 4 : 2;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(order.recipe.name, x + 14, y + 26);
  ctx.fillStyle = '#8a2f2f';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`+${order.recipe.coins}c`, x + width - 14, y + 26);
  order.recipe.items.forEach((item, index) => {
    drawIngredient(ctx, item, x + 34 + index * 46, y + 56, 16);
  });
  ctx.fillStyle = '#e8dcc0';
  roundRect(ctx, x + 14, y + height - 16, width - 28, 8, 4);
  ctx.fill();
  ctx.fillStyle = urgency < 0.33 ? '#e04536' : urgency < 0.66 ? '#e8a90c' : '#2f9e4d';
  roundRect(ctx, x + 14, y + height - 16, (width - 28) * urgency, 8, 4);
  ctx.fill();
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(0, 0, VIEW.width, 60);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SIZZLE & SERVE', 20, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🪙 ${state.coins}`, 420, 40);
  ctx.fillText(`Served ${state.served}  ·  Missed ${state.missed}`, 640, 40);
  if (state.combo >= 2) {
    ctx.fillStyle = '#ffb347';
    ctx.fillText(`Combo x${state.combo}`, 880, 40);
  }
  // Shift timer.
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = Math.floor(state.timeLeft % 60);
  const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
  ctx.fillStyle = state.timeLeft <= 20 ? '#ff6b5e' : '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`⏱ ${timerText}`, VIEW.width - 20, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(20, 52, VIEW.width - 40, 4);
  ctx.fillStyle = state.timeLeft <= 20 ? '#ff6b5e' : '#ffd76a';
  ctx.fillRect(20, 52, (VIEW.width - 40) * (state.timeLeft / SHIFT_SECONDS), 4);
}

function drawKitchen(ctx, state, highlightStationId) {
  // Wall and floor.
  ctx.fillStyle = WALL;
  ctx.fillRect(0, 60, VIEW.width, 240);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      ctx.fillStyle = (row + col) % 2 === 0 ? TILE_A : TILE_B;
      ctx.fillRect(FLOOR.x + col * 76, FLOOR.y + row * 98, 74, 96);
    }
  }
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(0, 292, VIEW.width, 8);

  // Order board.
  ctx.fillStyle = '#5a3d22';
  roundRect(ctx, 20, 68, VIEW.width - 40, 118, 12);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ORDER BOARD', 36, 88);
  if (state.orders.length === 0) {
    ctx.fillStyle = '#e8dcc0';
    ctx.font = '16px sans-serif';
    ctx.fillText('No orders yet — the lunch rush is coming…', 36, 140);
  }
  state.orders.forEach((order, index) => {
    drawOrderTicket(ctx, order, 36 + index * 316, 92);
  });

  // Top counter with the ingredient bins.
  ctx.fillStyle = WOOD_DARK;
  roundRect(ctx, 60, 196, 820, 84, 10);
  ctx.fill();
  ctx.fillStyle = WOOD;
  roundRect(ctx, 66, 200, 808, 72, 8);
  ctx.fill();
  for (const station of STATIONS) {
    const highlight = station.id === highlightStationId;
    if (station.kind === 'bin') drawBin(ctx, station, highlight);
    else if (station.kind === 'board') drawBoard(ctx, station, state, highlight);
    else if (station.kind === 'grill') drawGrill(ctx, station, state, highlight);
    else if (station.kind === 'assembly') drawAssembly(ctx, station, state, highlight);
    else if (station.kind === 'serve') drawServe(ctx, station, state, highlight);
    else if (station.kind === 'trash') drawTrash(ctx, station, highlight);
  }

  drawChef(ctx, state.chef);

  // Flash message.
  if (state.flash && state.elapsed < state.flashUntil) {
    ctx.fillStyle = 'rgba(58,42,24,0.9)';
    const width = ctx.measureText(state.flash).width + 36;
    roundRect(ctx, (VIEW.width - width) / 2, 648, width, 40, 20);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.flash, VIEW.width / 2, 675);
  }

  // Controls hint.
  ctx.fillStyle = 'rgba(232,220,192,0.75)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Move: WASD / arrows · Interact: E or click a station · Pause: P', 36, 712);
}

function drawOverlay(ctx, lines, title) {
  ctx.fillStyle = 'rgba(30,20,10,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 150, 600, 420, 18);
  ctx.fill();
  ctx.fillStyle = '#8a2f2f';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 230);
  ctx.fillStyle = INK;
  ctx.font = '19px sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, VIEW.width / 2, 290 + index * 32);
  });
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  function nearestStationId(state) {
    let best = null;
    let bestDistance = INTERACT_RANGE;
    for (const station of STATIONS) {
      const distance = Math.hypot(station.x - state.chef.x, station.y - state.chef.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = station.id;
      }
    }
    return best;
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    drawHud(ctx, state);
    drawKitchen(ctx, state, screen === SCREEN_PLAY ? nearestStationId(state) : null);
    if (screen === SCREEN_TITLE) {
      drawOverlay(ctx, [
        'Run the lunch rush: take orders from the board,',
        'chop, grill and stack each dish, then serve it',
        'before the customer walks out.',
        '',
        'Move: WASD / arrows or click · Interact: E or click',
        'Chop lettuce and tomato · Grill patties, don’t burn them',
        'Serve a plate that matches an order to earn coins.',
        '',
        'Press Enter or click to start the shift.',
        best > 0 ? `Best shift so far: ${best} coins` : 'First shift — make it a good one!',
      ], 'SIZZLE & SERVE');
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay(ctx, [
        'Paused. The stove stays hot, the orders wait.',
        '',
        'Press P or Enter to keep cooking.',
      ], 'PAUSED');
    } else if (screen === SCREEN_OVER) {
      drawOverlay(ctx, [
        `Coins earned: ${state.coins}`,
        `Dishes served: ${state.served}  ·  Orders lost: ${state.missed}`,
        `Best shift: ${Math.max(best, state.coins)} coins`,
        '',
        'Press Enter to cook another shift.',
      ], 'SHIFT OVER');
    }
  }

  return { draw };
}
