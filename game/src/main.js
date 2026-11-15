// Boot and the one loop for Lantern Tide: input is read every frame, the
// world advances in fixed 1/60 s steps, and the renderer paints what is
// there. The game moves between six screens: title, play, upgrade, paused,
// game over and victory.
//
// ?seed=N fixes the night's layout. ?shot=title|play|storm|victory (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_PULSE, EVENT_RESCUE, EVENT_WRECK, EVENT_WIN } from './world.js';
import {
  ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_PICK_1, ACTION_PICK_2, ACTION_PICK_3,
  ACTION_PULSE, ACTION_RESTART, ACTION_TOGGLE_BEAM, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import {
  SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY,
  createRenderer,
} from './render.js';
import { createHud, upgradeCardRects } from './hud.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const hud = createHud(canvas);
const audio = createAudio();

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
    // Storage can be off (private windows): the best then lasts this visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world, seed);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, world.beam, scene.screen);
    hud.draw(world.state, world.beam, scene.screen, scene.best, false);
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
  let titleSweep = 0;
  // Edge actions for the simulation, set once per frame and consumed by
  // the first fixed step of that frame.
  let pendingActions = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Night 1 of 5. Guide the ships home.');
  }

  function endGame(won) {
    screen = won ? SCREEN_VICTORY : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(
      won
        ? `Dawn breaks. Victory. Score ${world.state.score}. Best ${best}.`
        : `Game over. Score ${world.state.score}. Best ${best}.`,
    );
  }

  function pickUpgrade(index) {
    const choices = world.state.upgradeChoices;
    if (index < 0 || index >= choices.length) return;
    const choice = choices[index];
    world.applyUpgrade(choice.id);
    world.startNight(world.state.night + 1);
    screen = SCREEN_PLAY;
    announce(`Night ${world.state.night} of 5. Upgrade: ${choice.name}.`);
  }

  function handleClick(point) {
    if (!point || screen !== SCREEN_UPGRADE) return;
    const rects = upgradeCardRects();
    for (let i = 0; i < rects.length; i += 1) {
      const rect = rects[i];
      if (point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height) {
        pickUpgrade(i);
        return;
      }
    }
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE) {
      if (actions & (ACTION_CONFIRM | ACTION_PULSE)) {
        audio.unlock();
        startGame();
      }
      return;
    }
    if (screen === SCREEN_UPGRADE) {
      if (actions & ACTION_PICK_1) pickUpgrade(0);
      else if (actions & ACTION_PICK_2) pickUpgrade(1);
      else if (actions & ACTION_PICK_3) pickUpgrade(2);
      handleClick(input.takeClick());
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      } else if (actions & ACTION_RESTART) {
        startGame();
      }
      return;
    }
    if (screen === SCREEN_OVER || screen === SCREEN_VICTORY) {
      if (actions & (ACTION_RESTART | ACTION_CONFIRM | ACTION_PULSE)) startGame();
      return;
    }
    // SCREEN_PLAY
    if (actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & ACTION_RESTART) {
      startGame();
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      titleSweep += STEP;
      const sweep = -Math.PI / 2 + Math.sin(titleSweep * 0.35) * 1.3;
      world.step(STEP, { aim: sweep, rotate: 0, beamToggle: false, pulse: false });
      if (world.state.phase !== 'play') world.reset();
      audio.tickTitle(STEP);
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const controls = {
      aim: input.aimAngle(),
      rotate: input.rotateDirection(),
      beamToggle: (pendingActions & ACTION_TOGGLE_BEAM) !== 0,
      pulse: (pendingActions & ACTION_PULSE) !== 0,
    };
    pendingActions = 0;
    const events = world.step(STEP, controls);
    audio.setBeam(world.beam.on ? 1 : 0);
    if (events & EVENT_RESCUE) audio.bell();
    if (events & EVENT_WRECK) audio.wreck();
    if (events & EVENT_PULSE) audio.pulse();
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
    else if (world.state.phase === 'upgrade') {
      screen = SCREEN_UPGRADE;
      announce(`Night ${world.state.night} complete. Choose an upgrade.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = input.takeActions();
    handleActions(actions);
    pendingActions |= actions & (ACTION_PULSE | ACTION_TOGGLE_BEAM);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
      if (screen === SCREEN_UPGRADE) world.step(STEP, null);
    }
    renderer.draw(world.state, world.beam, screen);
    hud.draw(world.state, world.beam, screen, best, audio.isMuted());
  }

  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Tide. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
