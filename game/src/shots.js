// Deterministic screenshot scenes for ?shot=title|play|storm|victory.
// Each one plays the real rules forward from a fresh world for a fixed
// number of fixed steps, steered by a simple autopilot, so the frame is what
// a short game really looks like and the same seed always gives the same frame.
import { HARBOUR, LIGHTHOUSE, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';

const TITLE_SECONDS = 6;
const PLAY_SECONDS = 26;
const STORM_SECONDS = 24;
const MAX_NIGHT_SECONDS = 240;
const MAX_ATTEMPTS = 6;

/** The autopilot's controls for one step: aim at the most urgent ship. */
function autopilot(world) {
  const { state, beam } = world;
  const controls = { aim: null, rotate: 0, beamToggle: false, pulse: false };
  const lowOil = state.oil < 30;
  let target = null;
  let bestScore = Infinity;
  for (const ship of state.ships) {
    if (ship.state !== 'drifting' && ship.state !== 'guided') continue;
    let danger = 0;
    for (const rock of state.rocks) {
      if (Math.hypot(ship.x - rock.x, ship.y - rock.y) < 90) { danger = -10000; break; }
    }
    const distance = Math.hypot(ship.x - LIGHTHOUSE.x, ship.y - LIGHTHOUSE.y);
    const toHarbour = Math.hypot(ship.x - HARBOUR.x, ship.y - HARBOUR.y);
    // Low on oil: only chase ships nearly home or about to wreck.
    if (lowOil && danger === 0 && toHarbour > 260) continue;
    const score = danger + (lowOil ? toHarbour : distance);
    if (score < bestScore) {
      bestScore = score;
      target = ship;
    }
  }
  if (!target) {
    if (beam.on) controls.beamToggle = true;
    return controls;
  }
  controls.aim = Math.atan2(target.y - LIGHTHOUSE.y, target.x - LIGHTHOUSE.x);
  const distance = Math.hypot(target.x - LIGHTHOUSE.x, target.y - LIGHTHOUSE.y);
  const wantOn = distance < beam.effectiveRange() * 0.98;
  if (wantOn !== beam.on) controls.beamToggle = true;
  const clinging = state.wraiths.some((wraith) => wraith.clinging);
  const near = state.wraiths.some(
    (wraith) => Math.hypot(wraith.x - LIGHTHOUSE.x, wraith.y - LIGHTHOUSE.y) < 170,
  );
  if ((clinging || near) && state.oil > 40) controls.pulse = true;
  return controls;
}

/** Play one night with the autopilot until the phase changes or time runs out. */
function playNight(world, maxSeconds) {
  const steps = Math.floor(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, autopilot(world));
    if (events & EVENT_OVER) return 'lost';
    if (world.state.phase === 'upgrade' || world.state.phase === 'won') return world.state.phase;
  }
  return world.state.phase;
}

/** Play through nights until the given night is reached; retry a lost night. */
function playUntilNight(world, seed, targetNight) {
  for (let night = 1; night < targetNight; night += 1) {
    let won = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !won; attempt += 1) {
      if (attempt > 0) {
        world.resetWithSeed(seed + night * 1000 + attempt * 7919);
        for (let replay = 1; replay < night; replay += 1) {
          playNight(world, MAX_NIGHT_SECONDS);
          if (world.state.phase === 'upgrade') {
            world.applyUpgrade(world.state.upgradeChoices[0].id);
            world.startNight(replay + 1);
          }
        }
      }
      const result = playNight(world, MAX_NIGHT_SECONDS);
      if (result === 'upgrade' || result === 'won') {
        won = true;
        if (result === 'upgrade') {
          world.applyUpgrade(world.state.upgradeChoices[0].id);
          world.startNight(night + 1);
        }
      }
    }
    if (!won) return false;
  }
  return true;
}

/**
 * Set `world` to the named scene (title, play, storm or victory) and return
 * the screen to draw over it and the best score to show.
 */
export function stageShot(name, world, seed) {
  if (name === 'title') {
    world.resetWithSeed(seed);
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) {
      const sweep = -Math.PI / 2 + Math.sin((i * STEP) * 0.35) * 1.3;
      world.step(STEP, { aim: sweep, rotate: 0, beamToggle: false, pulse: false });
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'storm') {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      world.resetWithSeed(seed + attempt * 7919);
      if (!playUntilNight(world, seed + attempt * 7919, 5)) continue;
      playNight(world, STORM_SECONDS);
      if (world.state.phase === 'play') return { screen: SCREEN_PLAY, best: world.state.score };
    }
    world.resetWithSeed(seed);
    playNight(world, STORM_SECONDS);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'victory') {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      world.resetWithSeed(seed + attempt * 7919);
      if (playUntilNight(world, seed + attempt * 7919, 5)) {
        const result = playNight(world, MAX_NIGHT_SECONDS);
        if (result === 'won' || world.state.phase === 'won') {
          return { screen: SCREEN_VICTORY, best: world.state.score };
        }
      }
    }
    world.resetWithSeed(seed);
    playUntilNight(world, seed, 5);
    playNight(world, MAX_NIGHT_SECONDS);
    return { screen: world.state.phase === 'won' ? SCREEN_VICTORY : SCREEN_OVER, best: world.state.score };
  }
  // play: a busy mid-game frame from night 2.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    world.resetWithSeed(seed + attempt * 7919);
    if (!playUntilNight(world, seed + attempt * 7919, 2)) continue;
    playNight(world, 20);
    if (world.state.phase === 'play') return { screen: SCREEN_PLAY, best: world.state.score };
  }
  world.resetWithSeed(seed);
  playNight(world, PLAY_SECONDS);
  return { screen: SCREEN_PLAY, best: world.state.score };
}
