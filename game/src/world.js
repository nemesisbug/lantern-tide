// The simulation for Lantern Tide: nights, ships, rocks, fog, wraiths,
// oil, scoring and upgrades. Advances in fixed steps, uses only the seeded
// generator, and exposes its state plainly for the renderer and the loop.
import {
  BEAM, HARBOUR, ISLAND_RADIUS, LIGHTHOUSE, NIGHTS, OIL, ROCKS,
  SCORE, SHIP, UPGRADES, VIEW, WRAITH,
} from './config.js';
import { createBeam } from './beam.js';

export const EVENT_RESCUE = 1;
export const EVENT_WRECK = 2;
export const EVENT_LOST = 4;
export const EVENT_NIGHT_END = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;
export const EVENT_PULSE = 64;

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function shipInFog(state, ship) {
  for (const bank of state.fogBanks) {
    if (distance(ship.x, ship.y, bank.x, bank.y) < bank.radius) return true;
  }
  return false;
}

export function createWorld(random) {
  const beam = createBeam();
  const state = {
    phase: 'play',
    night: 1,
    time: 0,
    oil: OIL.tank,
    maxOil: OIL.tank,
    pulseCostFactor: 1,
    guidedSpeedFactor: 1,
    score: 0,
    glow: 0,
    guided: 0,
    lost: 0,
    wrecks: 0,
    totalGuided: 0,
    totalLost: 0,
    totalWrecks: 0,
    nightsSurvived: 0,
    ships: [],
    rocks: [],
    fogBanks: [],
    wraiths: [],
    particles: [],
    floaters: [],
    spawnQueue: 0,
    spawnTimer: 0,
    wraithTimer: 0,
    emberTimer: 0,
    shake: 0,
    wind: 0,
    upgradeChoices: [],
    loseReason: '',
  };

  function addParticle(x, y, vx, vy, life, kind) {
    if (state.particles.length > 420) return;
    state.particles.push({ x, y, vx, vy, life, maxLife: life, kind });
  }

  function spray(x, y) {
    for (let i = 0; i < 26; i += 1) {
      const angle = random.range(0, Math.PI * 2);
      const speed = random.range(30, 160);
      addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, random.range(0.4, 0.9), 'spray');
    }
  }

  function embers() {
    addParticle(
      LIGHTHOUSE.x + random.range(-6, 6), LIGHTHOUSE.y - 46,
      random.range(-8, 8), random.range(-34, -14),
      random.range(0.8, 1.6), 'ember',
    );
  }

  function floater(x, y, text) {
    state.floaters.push({ x, y, text, life: 1.4 });
  }

  function placeRocks(count) {
    const rocks = [];
    let guard = 0;
    while (rocks.length < count && guard < 400) {
      guard += 1;
      const x = random.range(70, VIEW.width - 70);
      const y = random.range(70, VIEW.height - 70);
      if (distance(x, y, HARBOUR.x, HARBOUR.y) < ROCKS.minDistanceFromHarbour) continue;
      if (distance(x, y, LIGHTHOUSE.x, LIGHTHOUSE.y) < 175) continue;
      let clear = true;
      for (const rock of rocks) {
        if (distance(x, y, rock.x, rock.y) < rock.radius + 56) { clear = false; break; }
      }
      if (!clear) continue;
      rocks.push({ x, y, radius: random.range(ROCKS.radiusMin, ROCKS.radiusMax) });
    }
    return rocks;
  }

  function placeFogBanks(count) {
    const banks = [];
    for (let i = 0; i < count; i += 1) {
      banks.push({
        x: random.range(140, VIEW.width - 140),
        y: random.range(120, VIEW.height - 120),
        radius: random.range(70, 120),
        vx: random.range(-7, 7),
        vy: random.range(-5, 5),
      });
    }
    return banks;
  }

  function startNight(night) {
    const def = NIGHTS[night - 1];
    state.night = night;
    state.phase = 'play';
    state.wrecks = 0;
    state.ships = [];
    state.wraiths = [];
    state.rocks = placeRocks(def.rocks);
    state.fogBanks = placeFogBanks(def.fogBanks);
    state.spawnQueue = def.ships;
    state.spawnTimer = 1.2;
    state.wraithTimer = 7;
    beam.on = true;
    beam.width = BEAM.width;
    beam.angle = -Math.PI / 2;
  }

  function reset() {
    state.phase = 'play';
    state.night = 1;
    state.time = 0;
    state.oil = OIL.tank;
    state.maxOil = OIL.tank;
    state.pulseCostFactor = 1;
    state.guidedSpeedFactor = 1;
    state.score = 0;
    state.glow = 0;
    state.guided = 0;
    state.lost = 0;
    state.wrecks = 0;
    state.totalGuided = 0;
    state.totalLost = 0;
    state.totalWrecks = 0;
    state.nightsSurvived = 0;
    state.particles = [];
    state.floaters = [];
    state.shake = 0;
    state.loseReason = '';
    beam.on = true;
    startNight(1);
  }

  function spawnShip() {
    const edge = random.pick(['left', 'right', 'top']);
    let x = 0;
    let y = 0;
    if (edge === 'left') { x = -20; y = random.range(60, VIEW.height - 60); }
    if (edge === 'right') { x = VIEW.width + 20; y = random.range(60, VIEW.height - 60); }
    if (edge === 'top') { x = random.range(60, VIEW.width - 60); y = -20; }
    const heading = Math.atan2(LIGHTHOUSE.y - y, LIGHTHOUSE.x - x) + random.range(-0.35, 0.35);
    state.ships.push({
      x, y, heading,
      speed: SHIP.driftSpeed * random.range(0.85, 1.2),
      guided: false,
      state: 'drifting',
      phase: random.range(0, Math.PI * 2),
      size: random.range(11, 15),
    });
  }

  function spawnWraith() {
    const angle = random.range(0, Math.PI * 2);
    const radius = random.range(420, 560);
    state.wraiths.push({
      x: LIGHTHOUSE.x + Math.cos(angle) * radius,
      y: LIGHTHOUSE.y + Math.sin(angle) * radius,
      clinging: false,
      orbit: random.range(0, Math.PI * 2),
      wobble: random.range(0, Math.PI * 2),
    });
  }

  function rescueShip(ship) {
    ship.state = 'rescued';
    const points = SCORE.rescueBase + SCORE.rescuePerNight * state.night;
    state.score += points;
    state.glow += SCORE.glowPerRescue;
    state.guided += 1;
    state.totalGuided += 1;
    floater(ship.x, ship.y - 18, `+${points}`);
    for (let i = 0; i < 10; i += 1) {
      addParticle(ship.x, ship.y, random.range(-30, 30), random.range(-50, -10), random.range(0.5, 1), 'spark');
    }
  }

  function wreckShip(ship) {
    ship.state = 'wrecked';
    state.wrecks += 1;
    state.totalWrecks += 1;
    state.score = Math.max(0, state.score - SCORE.wreckPenalty);
    state.shake = 14;
    spray(ship.x, ship.y);
    floater(ship.x, ship.y - 18, 'WRECKED');
  }

  function pickUpgrades() {
    const pool = [...UPGRADES];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random.next() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.upgradeChoices = pool.slice(0, 3);
  }

  function applyUpgrade(id) {
    if (id === 'wide') beam.width *= 1.35;
    if (id === 'cheap') state.pulseCostFactor = 0.5;
    if (id === 'tank') {
      state.maxOil = Math.round(state.maxOil * 1.4);
      state.oil = state.maxOil;
    }
    if (id === 'swift') state.guidedSpeedFactor *= 1.35;
  }

  function nextNight() {
    state.nightsSurvived += 1;
    state.oil = state.maxOil;
    if (state.night >= NIGHTS.length) {
      state.phase = 'won';
      return EVENT_WIN;
    }
    pickUpgrades();
    state.phase = 'upgrade';
    return EVENT_NIGHT_END;
  }

  function lose(reason) {
    state.phase = 'lost';
    state.loseReason = reason;
    return EVENT_OVER;
  }

  function step(dt, controls) {
    let events = 0;
    state.time += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'ember' ? -12 : 40) * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
      const f = state.floaters[i];
      f.y -= 26 * dt;
      f.life -= dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
    if (state.phase === 'upgrade') {
      state.oil = Math.min(state.maxOil, state.oil + OIL.refillBetweenPerSecond * dt);
      return events;
    }
    if (state.phase !== 'play') return events;

    const def = NIGHTS[state.night - 1];
    state.wind = def.storm ? Math.sin(state.time * 0.5) * 34 : 0;

    if (controls) {
      if (typeof controls.aim === 'number') beam.aimAt(controls.aim);
      if (controls.rotate) beam.rotate(controls.rotate * 2.4 * dt);
      if (controls.beamToggle) beam.on = !beam.on;
      if (controls.pulse && !beam.pulse) {
        const cost = OIL.pulseCost * state.pulseCostFactor;
        if (state.oil >= cost) {
          state.oil -= cost;
          beam.firePulse();
          events |= EVENT_PULSE;
        }
      }
    }

    if (beam.on) {
      state.oil -= OIL.drainPerSecond * dt;
      if (state.oil <= 0) {
        state.oil = 0;
        beam.on = false;
        return events | lose('oil');
      }
    } else {
      state.oil = Math.min(state.maxOil, state.oil + OIL.refillOffPerSecond * dt);
    }

    state.emberTimer -= dt;
    if (state.emberTimer <= 0) {
      state.emberTimer = 0.12;
      embers();
    }

    if (state.spawnQueue > 0) {
      state.spawnTimer -= dt;
      if (state.spawnTimer <= 0) {
        state.spawnTimer = SHIP.spawnInterval * random.range(0.7, 1.3);
        state.spawnQueue -= 1;
        spawnShip();
      }
    }

    state.wraithTimer -= dt;
    if (state.wraithTimer <= 0 && state.wraiths.length < def.wraiths + 2) {
      state.wraithTimer = WRAITH.spawnInterval * random.range(0.8, 1.2);
      spawnWraith();
    }

    const banished = beam.update(dt, state.wraiths);
    if (banished.length) {
      banished.sort((a, b) => b - a);
      for (const index of banished) {
        const wraith = state.wraiths[index];
        for (let i = 0; i < 8; i += 1) {
          addParticle(wraith.x, wraith.y, random.range(-40, 40), random.range(-40, 40), random.range(0.3, 0.7), 'spark');
        }
        state.wraiths.splice(index, 1);
      }
    }

    let clinging = 0;
    for (const wraith of state.wraiths) {
      if (wraith.clinging) {
        wraith.orbit += dt * 0.8;
        wraith.x = LIGHTHOUSE.x + Math.cos(wraith.orbit) * (WRAITH.clingDistance - 12);
        wraith.y = LIGHTHOUSE.y + Math.sin(wraith.orbit) * (WRAITH.clingDistance - 12);
        clinging += 1;
        continue;
      }
      const dx = LIGHTHOUSE.x - wraith.x;
      const dy = LIGHTHOUSE.y - wraith.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = def.wraithSpeed * (1 + 0.1 * Math.sin(state.time + wraith.wobble));
      wraith.x += (dx / dist) * speed * dt;
      wraith.y += (dy / dist) * speed * dt;
      if (dist < WRAITH.clingDistance) wraith.clinging = true;
    }
    beam.clinging = clinging;

    for (const bank of state.fogBanks) {
      bank.x += bank.vx * dt;
      bank.y += bank.vy * dt;
      if (bank.x < -bank.radius) bank.x = VIEW.width + bank.radius;
      if (bank.x > VIEW.width + bank.radius) bank.x = -bank.radius;
      if (bank.y < -bank.radius) bank.y = VIEW.height + bank.radius;
      if (bank.y > VIEW.height + bank.radius) bank.y = -bank.radius;
    }

    let activeShips = 0;
    for (const ship of state.ships) {
      if (ship.state !== 'drifting' && ship.state !== 'guided') continue;
      activeShips += 1;
      const inFog = shipInFog(state, ship);
      const inBeam = !inFog && beam.pointInBeam(ship.x, ship.y);
      ship.guided = inBeam;
      if (inBeam) ship.state = 'guided';
      else if (ship.state === 'guided') ship.state = 'drifting';
      if (ship.state === 'guided') {
        const target = Math.atan2(HARBOUR.y - ship.y, HARBOUR.x - ship.x);
        let diff = target - ship.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ship.heading += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff));
        ship.speed = SHIP.guidedSpeed * state.guidedSpeedFactor;
      } else {
        ship.speed = SHIP.driftSpeed;
      }
      if (!inFog) {
        for (const rock of state.rocks) {
          const d = distance(ship.x, ship.y, rock.x, rock.y);
          if (d < 85 && d > 1) {
            const away = Math.atan2(ship.y - rock.y, ship.x - rock.x);
            let diff = away - ship.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            ship.heading += Math.max(-3 * dt, Math.min(3 * dt, diff));
          }
        }
      }
      ship.x += Math.cos(ship.heading) * ship.speed * dt + state.wind * dt;
      ship.y += Math.sin(ship.heading) * ship.speed * dt;
      if (distance(ship.x, ship.y, HARBOUR.x, HARBOUR.y) < HARBOUR.radius) {
        rescueShip(ship);
        events |= EVENT_RESCUE;
        continue;
      }
      let wrecked = false;
      for (const rock of state.rocks) {
        if (distance(ship.x, ship.y, rock.x, rock.y) < rock.radius + SHIP.radius * 0.6) {
          wreckShip(ship);
          events |= EVENT_WRECK;
          wrecked = true;
          break;
        }
      }
      if (wrecked) {
        if (state.wrecks >= 3) return events | lose('wrecks');
        continue;
      }
      if (ship.x < -50 || ship.x > VIEW.width + 50 || ship.y < -50 || ship.y > VIEW.height + 50) {
        ship.state = 'lost';
        state.lost += 1;
        state.totalLost += 1;
        events |= EVENT_LOST;
      }
    }

    if (state.spawnQueue === 0 && activeShips === 0) {
      return events | nextNight();
    }
    return events;
  }

  reset();
  return {
    state, beam, reset, startNight, step, applyUpgrade, pickUpgrades,
    resetWithSeed(seed) {
      random.reseed(seed);
      reset();
    },
  };
}
