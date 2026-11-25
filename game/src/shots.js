// The screenshot scenes behind ?shot=start|play|serve|rush. Each one plays
// the real rules forward from a fresh world, steered by a small autopilot
// that walks the chef between stations and waits for chopping and grilling,
// so the frame is what a short game really looks like and the same seed
// always gives the same frame.
import { CHOP_SECONDS, GRILL_SECONDS, STATIONS } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const STEP = 1 / 60;

function station(id) {
  return STATIONS.find((item) => item.id === id);
}

// The tasks that fetch one prepared ingredient and put it on the plate.
function tasksForItem(item) {
  if (item === 'bun') return [{ go: 'bin-bun' }, { go: 'assembly' }];
  if (item === 'cheese') return [{ go: 'bin-cheese' }, { go: 'assembly' }];
  if (item === 'patty') {
    return [
      { go: 'bin-patty' }, { go: 'grill' },
      { wait: (state) => state.grill.item && state.grill.progress >= GRILL_SECONDS },
      { go: 'grill' }, { go: 'assembly' },
    ];
  }
  if (item === 'lettuce_chopped') {
    return [
      { go: 'bin-lettuce' }, { go: 'board' },
      { wait: (state) => state.board.item && state.board.progress >= CHOP_SECONDS },
      { go: 'board' }, { go: 'assembly' },
    ];
  }
  if (item === 'tomato_chopped') {
    return [
      { go: 'bin-tomato' }, { go: 'board' },
      { wait: (state) => state.board.item && state.board.progress >= CHOP_SECONDS },
      { go: 'board' }, { go: 'assembly' },
    ];
  }
  return [];
}

function tasksForRecipe(items) {
  return items.flatMap((item) => tasksForItem(item));
}

// A driver walks a task list: {go} walks to a station and interacts on
// arrival, {wait} stands still until its condition holds.
function createDriver(getTasks) {
  let tasks = getTasks();
  let index = 0;
  let pauseLeft = 0;
  return {
    get done() {
      return tasks === null || index >= tasks.length;
    },
    refresh(nextTasks) {
      tasks = nextTasks;
      index = 0;
    },
    step(state) {
      if (pauseLeft > 0) {
        pauseLeft -= STEP;
        return { mx: 0, my: 0, interact: false, idle: false };
      }
      if (!tasks || index >= tasks.length) return { mx: 0, my: 0, interact: false, idle: false };
      const task = tasks[index];
      if (task.wait) {
        if (task.wait(state)) index += 1;
        return { mx: 0, my: 0, interact: false, idle: false };
      }
      if (task.pause) {
        pauseLeft = task.pause;
        index += 1;
        return { mx: 0, my: 0, interact: false, idle: false };
      }
      if (task.walk) {
        const target = station(task.walk);
        const dx = target.ax - state.chef.x;
        const dy = target.ay - state.chef.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 10) {
          index += 1;
          return { mx: 0, my: 0, interact: false, idle: false };
        }
        return { mx: dx / distance, my: dy / distance, interact: false, idle: false };
      }
      const target = station(task.go);
      const dx = target.ax - state.chef.x;
      const dy = target.ay - state.chef.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 10) {
        index += 1;
        return { mx: 0, my: 0, interact: true, idle: false };
      }
      return { mx: dx / distance, my: dy / distance, interact: false, idle: false };
    },
  };
}

function runFor(world, driver, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.state.over) break;
    world.step(STEP, driver.step(world.state));
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title screen over a quiet kitchen. play: a Classic Burger
 * mid-assembly on the plate. serve: a full plate matching the first order,
 * the chef waiting at the serve window. rush: deep in a busy shift, orders
 * piling up and the timer running down.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'rush') {
    for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, { mx: 0, my: 0, interact: false, idle: true });
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    const driver = createDriver(() => tasksForRecipe(['bun', 'patty', 'lettuce_chopped']));
    runFor(world, driver, 45);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // Wait for the first order, build exactly what it asks for, then walk
    // to the serve window and stop with the plate ready.
    const driver = createDriver(() => []);
    let built = false;
    for (let i = 0; i < 90 / STEP; i += 1) {
      if (world.state.over) break;
      if (!built && world.state.orders.length > 0) {
        driver.refresh([...tasksForRecipe(world.state.orders[0].recipe.items), { walk: 'serve' }]);
        built = true;
      }
      const input = driver.step(world.state);
      if (built && driver.done) break;
      world.step(STEP, input);
      if (built && driver.done) break;
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // rush: keep cooking and serving for most of a shift, then stop mid-task.
  const driver = createDriver(() => []);
  let servedTarget = 0;
  for (let i = 0; i < 78 / STEP; i += 1) {
    if (world.state.over) break;
    if (driver.done) {
      if (world.state.orders.length === 0) {
        world.step(STEP, { mx: 0, my: 0, interact: false, idle: false });
        continue;
      }
      const items = world.state.orders[0].recipe.items;
      driver.refresh([...tasksForRecipe(items), { go: 'serve' }]);
      servedTarget += 1;
    }
    world.step(STEP, driver.step(world.state));
  }
  void servedTarget;
  return { screen: SCREEN_PLAY, best: world.state.coins };
}
