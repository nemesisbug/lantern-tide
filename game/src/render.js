// All canvas drawing for Lantern Tide: sea, island, lighthouse, beam, ships,
// rocks, fog, wraiths, particles, rain and the dawn. Every animated element
// derives from the world's time, so a fixed simulated time always draws the
// same frame.
import { DAWN, HARBOUR, ISLAND_RADIUS, LIGHTHOUSE, PALETTES, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

function hash(index, salt) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

// Reduced motion: damp the ambient bob/shake, keep the game readable.
const REDUCED = typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOTION = REDUCED ? 0.3 : 1;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = { x: 1, y: 1 };

  function resize() {
    // The backing store must match the element's size: a fixed 1280x720
    // backing with a rect-sized scale squashes the world into the top-left
    // of the bitmap on any viewport that is not exactly 16:9 (notably the
    // phones the touch controls are for). Size the backing from the rect
    // (capped at 2x for hidpi) so the world always fills the canvas.
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(2, Math.round(rect.width * dpr));
    canvas.height = Math.max(2, Math.round(rect.height * dpr));
    scale.x = canvas.width / 1280;
    scale.y = canvas.height / 720;
  }

  function drawSea(palette, time, storm) {
    // The sea is a radial wash: lighter where the lamp's world is, dark at
    // the edges — a vignette that gives the flat navy depth without a sky.
    const wash = ctx.createRadialGradient(
      LIGHTHOUSE.x, LIGHTHOUSE.y, 60, LIGHTHOUSE.x, LIGHTHOUSE.y, 760,
    );
    wash.addColorStop(0, palette.sea);
    wash.addColorStop(0.55, palette.sea);
    wash.addColorStop(1, palette.deep);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Moonlight path: a broad soft band of shimmering light running down
    // from the moon in the top-right corner, broken into drifting glints.
    ctx.save();
    ctx.translate(LIGHTHOUSE.x, LIGHTHOUSE.y);
    ctx.rotate(-0.62);
    const path = ctx.createLinearGradient(-260, 0, 260, 0);
    path.addColorStop(0, 'rgba(190, 215, 235, 0)');
    path.addColorStop(0.5, 'rgba(190, 215, 235, 0.10)');
    path.addColorStop(1, 'rgba(190, 215, 235, 0)');
    ctx.fillStyle = path;
    ctx.fillRect(-900, -46, 1800, 92);
    ctx.restore();
    for (let i = 0; i < 26; i += 1) {
      const px = ((hash(i, 41) * 1500 - 180 + time * 14) % 1500) - 180;
      const py = 96 + hash(i, 43) * 520;
      const twinkle = 0.10 + 0.10 * Math.sin(time * 1.4 + i * 2.4);
      ctx.fillStyle = `rgba(205, 228, 244, ${twinkle})`;
      ctx.fillRect(px, py, 26 + hash(i, 47) * 30, 2);
    }
    // Swell: long slow rollers, then short ripples on top, then crest glints.
    ctx.strokeStyle = 'rgba(160, 200, 225, 0.12)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i += 1) {
      const baseY = 60 + i * 88;
      ctx.beginPath();
      for (let x = 0; x <= VIEW.width; x += 32) {
        const y = baseY + Math.sin(x * 0.008 + time * 0.5 * MOTION + i * 1.7) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(170, 205, 230, 0.06)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 16; i += 1) {
      const baseY = 30 + i * 44;
      ctx.beginPath();
      for (let x = 0; x <= VIEW.width; x += 32) {
        const y = baseY + Math.sin(x * 0.02 + time * 1.1 * MOTION + i * 2.3) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 18; i += 1) {
      const gx = hash(i, 53) * VIEW.width;
      const gy = 50 + hash(i, 59) * 620;
      const glint = 0.10 + 0.10 * Math.sin(time * 1.8 + i * 1.9);
      ctx.fillStyle = `rgba(220, 238, 250, ${glint})`;
      ctx.beginPath();
      ctx.ellipse(gx, gy, 9, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (storm) {
      ctx.strokeStyle = 'rgba(190, 215, 235, 0.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 90; i += 1) {
        const x = (hash(i, 3) * VIEW.width + time * 260) % VIEW.width;
        const y = (hash(i, 7) * VIEW.height + time * 700) % VIEW.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 8, y + 22);
        ctx.stroke();
      }
    }
  }

  function drawMoon(palette, dim = 1) {
    const x = 1090;
    const y = 104;
    ctx.save();
    ctx.globalAlpha = dim;
    const halo = ctx.createRadialGradient(x, y, 4, x, y, 96);
    halo.addColorStop(0, 'rgba(220, 235, 248, 0.30)');
    halo.addColorStop(1, 'rgba(220, 235, 248, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 96, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.moon;
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160, 180, 200, 0.18)';
    ctx.beginPath();
    ctx.arc(x - 9, y - 6, 4.5, 0, Math.PI * 2);
    ctx.arc(x + 10, y + 9, 3, 0, Math.PI * 2);
    ctx.arc(x + 3, y - 13, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFogDrift(state, palette) {
    // Two huge soft fog sheets drifting slowly across the sea, behind the
    // ships — the air itself moves, not just the fog banks.
    for (let i = 0; i < 2; i += 1) {
      const span = VIEW.width + 600;
      const x = ((hash(i, 61) * span + state.time * (7 + i * 4) * MOTION) % span) - 300;
      const y = i === 0 ? 150 : 580;
      const radius = i === 0 ? 300 : 340;
      const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
      gradient.addColorStop(0, palette.fog);
      gradient.addColorStop(1, 'rgba(160, 180, 195, 0)');
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawIsland(palette, time) {
    // Island: a radial wash — warm where the lamp spills, dark moss at the
    // waterline — ringed by a breathing foam line.
    const wash = ctx.createRadialGradient(
      LIGHTHOUSE.x, LIGHTHOUSE.y - 10, 10, LIGHTHOUSE.x, LIGHTHOUSE.y + 26, ISLAND_RADIUS + 30,
    );
    wash.addColorStop(0, '#2c463a');
    wash.addColorStop(0.6, palette.island);
    wash.addColorStop(1, '#101d19');
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.ellipse(LIGHTHOUSE.x, LIGHTHOUSE.y + 26, ISLAND_RADIUS + 14, ISLAND_RADIUS * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    const foam = 0.14 + 0.08 * Math.sin(time * 1.2 * MOTION);
    ctx.strokeStyle = `rgba(205, 228, 240, ${foam})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(LIGHTHOUSE.x, LIGHTHOUSE.y + 26, ISLAND_RADIUS + 18, ISLAND_RADIUS * 0.72 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190, 220, 200, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(LIGHTHOUSE.x, LIGHTHOUSE.y + 26, ISLAND_RADIUS + 14, ISLAND_RADIUS * 0.72, 0, 0.15, Math.PI - 0.15);
    ctx.stroke();
    // Harbour: a small lit jetty at the bottom of the island.
    ctx.fillStyle = '#2c2417';
    ctx.fillRect(HARBOUR.x - 34, HARBOUR.y - 8, 68, 16);
    ctx.fillStyle = palette.lamp;
    for (let i = -1; i <= 1; i += 1) {
      const flicker = 0.7 + 0.3 * Math.sin(time * 3 + i * 2.1);
      ctx.globalAlpha = flicker;
      ctx.beginPath();
      ctx.arc(HARBOUR.x + i * 22, HARBOUR.y - 10, 3, 0, Math.PI * 2);
      ctx.fill();
      // Lamp reflections: short warm streaks shimmering in the water below.
      ctx.globalAlpha = flicker * 0.28;
      ctx.fillRect(HARBOUR.x + i * 22 - 1.5, HARBOUR.y + 10, 3, 18 + 6 * Math.sin(time * 2 + i));
    }
    ctx.globalAlpha = 1;
  }

  function drawLighthouse(palette, beam) {
    const { x, y } = LIGHTHOUSE;
    // Warm light spill on the island under the lamp.
    const spill = ctx.createRadialGradient(x, y + 6, 4, x, y + 6, 74);
    spill.addColorStop(0, 'rgba(255, 217, 122, 0.28)');
    spill.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = spill;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 74, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tower: a warm-lit face fading into shadow, red bands with depth.
    const tower = ctx.createLinearGradient(x - 16, 0, x + 16, 0);
    tower.addColorStop(0, '#f5efdd');
    tower.addColorStop(0.55, '#e8e2d2');
    tower.addColorStop(1, '#b3a888');
    ctx.fillStyle = tower;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 30);
    ctx.lineTo(x - 10, y - 34);
    ctx.lineTo(x + 10, y - 34);
    ctx.lineTo(x + 16, y + 30);
    ctx.closePath();
    ctx.fill();
    const band = ctx.createLinearGradient(x - 13, 0, x + 13, 0);
    band.addColorStop(0, '#c0452f');
    band.addColorStop(1, '#8e2a1c');
    ctx.fillStyle = band;
    ctx.fillRect(x - 13, y + 8, 26, 10);
    ctx.fillRect(x - 11, y - 16, 22, 9);
    // Gallery: dark cap with railing ticks.
    ctx.fillStyle = '#22201c';
    ctx.fillRect(x - 13, y - 48, 26, 15);
    ctx.fillStyle = 'rgba(232, 226, 210, 0.7)';
    for (let i = -2; i <= 2; i += 1) ctx.fillRect(x + i * 5 - 0.75, y - 52, 1.5, 4);
    // Lamp: a big additive halo, then the hot core.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(x, y - 40, 2, x, y - 40, 62);
    glow.addColorStop(0, 'rgba(255, 226, 150, 0.85)');
    glow.addColorStop(0.45, 'rgba(255, 210, 110, 0.30)');
    glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 40, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = beam.on ? '#fff3c4' : '#5c5648';
    ctx.beginPath();
    ctx.arc(x, y - 40, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = beam.on ? 'rgba(255, 243, 196, 0.9)' : 'rgba(92, 86, 72, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y - 40, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeam(beam, palette, state) {
    if (!beam.on) return;
    const { x, y } = LIGHTHOUSE;
    const range = beam.effectiveRange();
    // The beam breathes: its cone widens a touch and relaxes, so the light
    // feels alive rather than a painted triangle.
    const breathe = 1 + 0.03 * Math.sin(state.time * 0.8 * MOTION);
    const half = (beam.width / 2) * breathe;
    // The lamp sputters as the oil runs low: a visible warning, not just a number.
    const flicker = state && state.oil < 25 ? 0.7 + 0.3 * Math.sin(state.time * 13) : 1;
    // Volumetric light: three nested cones drawn additively, so the beam
    // blooms over the dark sea instead of sitting on it like a flat wedge.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const layers = [
      { spread: 1.5, alpha: 0.14 },
      { spread: 1.15, alpha: 0.26 },
      { spread: 0.8, alpha: 0.42 },
    ];
    for (const layer of layers) {
      const gradient = ctx.createRadialGradient(x, y, 20, x, y, range);
      gradient.addColorStop(0, `rgba(255, 228, 160, ${layer.alpha * flicker})`);
      gradient.addColorStop(0.6, `rgba(255, 215, 130, ${layer.alpha * 0.55 * flicker})`);
      gradient.addColorStop(1, 'rgba(255, 215, 130, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, range, beam.angle - half * layer.spread, beam.angle + half * layer.spread);
      ctx.closePath();
      ctx.fill();
    }
    // Hot core: a bright spine down the middle of the beam.
    const core = ctx.createRadialGradient(x, y, 10, x, y, range * 0.9);
    core.addColorStop(0, `rgba(255, 246, 210, ${0.62 * flicker})`);
    core.addColorStop(1, 'rgba(255, 246, 210, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range * 0.9, beam.angle - half * 0.28, beam.angle + half * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 235, 180, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(beam.angle - half) * range, y + Math.sin(beam.angle - half) * range);
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(beam.angle + half) * range, y + Math.sin(beam.angle + half) * range);
    ctx.stroke();
    if (beam.pulse) {
      ctx.strokeStyle = `rgba(255, 240, 190, ${Math.max(0, 1 - beam.pulse.radius / 240)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, beam.pulse.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawRocks(rocks, time) {
    for (const rock of rocks) {
      ctx.fillStyle = '#1b252c';
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#31414a';
      ctx.beginPath();
      ctx.arc(rock.x - rock.radius * 0.25, rock.y - rock.radius * 0.3, rock.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      // Moonlit top edge: a pale arc on the side facing the moon.
      ctx.strokeStyle = 'rgba(205, 228, 244, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
      // Foam: a breathing ring where the rock meets the water.
      const foam = 0.10 + 0.07 * Math.sin(time * 1.6 * MOTION + rock.x * 0.05);
      ctx.strokeStyle = `rgba(215, 235, 245, ${foam})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawShip(ship, palette, time) {
    if (ship.state === 'rescued' || ship.state === 'wrecked' || ship.state === 'lost') return;
    // Bob and heel on the swell: the ships ride the water now.
    const bob = Math.sin(time * 1.3 * MOTION + ship.phase) * 2;
    const heel = Math.sin(time * 0.9 * MOTION + ship.phase) * 0.03;
    ctx.save();
    ctx.translate(ship.x, ship.y + bob);
    ctx.rotate(ship.heading + heel);
    // Wake: a fading trail of three arcs astern.
    for (let i = 1; i <= 3; i += 1) {
      ctx.strokeStyle = `rgba(180, 210, 230, ${0.30 - i * 0.08})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-ship.size - i * 7, 0);
      ctx.lineTo(-ship.size - i * 7 - 9, -4 - i);
      ctx.moveTo(-ship.size - i * 7, 0);
      ctx.lineTo(-ship.size - i * 7 - 9, 4 + i);
      ctx.stroke();
    }
    // Hull: a warm gradient, brighter when the beam has caught her.
    const hull = ctx.createLinearGradient(0, -ship.size * 0.55, 0, ship.size * 0.55);
    if (ship.guided) {
      hull.addColorStop(0, '#8a653c');
      hull.addColorStop(1, '#5c4023');
    } else {
      hull.addColorStop(0, '#5a4836');
      hull.addColorStop(1, '#33261a');
    }
    ctx.fillStyle = hull;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size * 0.7, -ship.size * 0.55);
    ctx.lineTo(-ship.size, 0);
    ctx.lineTo(-ship.size * 0.7, ship.size * 0.55);
    ctx.closePath();
    ctx.fill();
    // Sail: cream when guided, grey when adrift, with a warm edge.
    const sail = ctx.createLinearGradient(0, -ship.size * 1.3, 0, 0);
    if (ship.guided) {
      sail.addColorStop(0, '#fdf3d0');
      sail.addColorStop(1, '#e8d5a0');
    } else {
      sail.addColorStop(0, '#cfc6ae');
      sail.addColorStop(1, '#9a917c');
    }
    ctx.fillStyle = sail;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-ship.size * 0.4, -ship.size * 1.3);
    ctx.lineTo(-ship.size * 0.4, -2);
    ctx.closePath();
    ctx.fill();
    // Lantern: a small warm glow at the bow.
    const flicker = 0.75 + 0.25 * Math.sin(time * 4 + ship.phase);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const lampGlow = ctx.createRadialGradient(ship.size * 0.4, 0, 0.5, ship.size * 0.4, 0, 10);
    lampGlow.addColorStop(0, `rgba(255, 217, 122, ${0.8 * flicker})`);
    lampGlow.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = lampGlow;
    ctx.beginPath();
    ctx.arc(ship.size * 0.4, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = flicker;
    ctx.fillStyle = palette.lamp;
    ctx.beginPath();
    ctx.arc(ship.size * 0.4, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (ship.guided) {
      // The way home: a dashed gold thread that marches toward the harbour.
      ctx.strokeStyle = 'rgba(255, 225, 150, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = -time * 30;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + bob);
      ctx.lineTo(HARBOUR.x, HARBOUR.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawWraith(wraith, time) {
    const distToLamp = Math.hypot(wraith.x - LIGHTHOUSE.x, wraith.y - LIGHTHOUSE.y);
    const closing = distToLamp < 240;
    // Telegraph: a wraith closing on the lamp flashes a warning ring, so the
    // player sees the threat before it clings and dims the beam.
    if (closing || wraith.clinging) {
      const pulse = 0.45 + 0.35 * Math.sin(time * 6);
      ctx.strokeStyle = wraith.clinging
        ? `rgba(255, 110, 80, ${pulse})`
        : `rgba(255, 200, 90, ${pulse * 0.8})`;
      ctx.lineWidth = wraith.clinging ? 3 : 2;
      ctx.beginPath();
      ctx.arc(wraith.x, wraith.y, 24 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    const alpha = wraith.clinging ? 0.9 : closing ? 0.75 : 0.55;
    const wobble = Math.sin(time * 2 + wraith.wobble) * 3 * MOTION;
    // Smoky body: three stacked translucent ellipses, then glowing eyes.
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = `rgba(200, 215, 235, ${alpha * (0.16 + i * 0.10)})`;
      ctx.beginPath();
      ctx.ellipse(
        wraith.x + (i - 1) * 3, wraith.y + wobble + i * 2,
        13 - i * 2.5, 18 - i * 2.5, 0, 0, Math.PI * 2,
      );
      ctx.fill();
    }
    // Wisp tail trailing behind the drift.
    ctx.strokeStyle = `rgba(200, 215, 235, ${alpha * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wraith.x, wraith.y + 14 + wobble);
    ctx.quadraticCurveTo(
      wraith.x + 8, wraith.y + 26 + wobble,
      wraith.x - 4, wraith.y + 34 + wobble,
    );
    ctx.stroke();
    const eye = wraith.clinging ? 'rgba(255, 90, 60, 0.95)' : 'rgba(255, 205, 110, 0.95)';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const side of [-4, 4]) {
      const glow = ctx.createRadialGradient(wraith.x + side, wraith.y - 3 + wobble, 0.5, wraith.x + side, wraith.y - 3 + wobble, 7);
      glow.addColorStop(0, eye);
      glow.addColorStop(1, 'rgba(255, 180, 90, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(wraith.x + side, wraith.y - 3 + wobble, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = `rgba(20, 26, 40, ${alpha})`;
    ctx.beginPath();
    ctx.arc(wraith.x - 4, wraith.y - 3 + wobble, 2.4, 0, Math.PI * 2);
    ctx.arc(wraith.x + 4, wraith.y - 3 + wobble, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFogBanks(state, palette) {
    for (const bank of state.fogBanks) {
      const gradient = ctx.createRadialGradient(bank.x, bank.y, 4, bank.x, bank.y, bank.radius);
      gradient.addColorStop(0, palette.fog);
      gradient.addColorStop(1, 'rgba(160, 180, 195, 0)');
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bank.x, bank.y, bank.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      const life = Math.max(0, p.life / p.maxLife);
      if (p.kind === 'ember') {
        ctx.fillStyle = `rgba(255, 190, 90, ${life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'spray') {
        ctx.fillStyle = `rgba(190, 220, 240, ${life * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255, 240, 190, ${life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawFogVeil(state, palette) {
    ctx.fillStyle = palette.fog;
    ctx.globalAlpha = 0.05 + state.night * 0.008;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.globalAlpha = 1;
  }

  function drawDawn(time) {
    // Dawn payoff: the sun clears the horizon and golden rays turn slowly
    // over the harbour, with sparks rising. Everything derives from the
    // world's time, so the victory screenshot stays deterministic.
    const sunX = VIEW.width * 0.8;
    const sunY = 108;
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 190);
    glow.addColorStop(0, 'rgba(255, 236, 170, 0.9)');
    glow.addColorStop(0.4, 'rgba(255, 210, 110, 0.35)');
    glow.addColorStop(1, 'rgba(255, 210, 110, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 190, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffedb0';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.16)';
    ctx.lineWidth = 7;
    for (let i = 0; i < 12; i += 1) {
      const angle = time * 0.06 + (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * 52, sunY + Math.sin(angle) * 52);
      ctx.lineTo(sunX + Math.cos(angle) * 175, sunY + Math.sin(angle) * 175);
      ctx.stroke();
    }
    // Golden light lying on the water under the rising sun.
    for (let i = 0; i < 8; i += 1) {
      const streakY = 300 + i * 42;
      const shimmer = 0.10 + 0.06 * Math.sin(time * 1.2 + i * 1.7);
      ctx.fillStyle = `rgba(255, 214, 130, ${shimmer})`;
      ctx.fillRect(sunX - 260 + i * 18, streakY, 320 - i * 22, 3);
    }
    for (let i = 0; i < 42; i += 1) {
      const x = hash(i, 11) * VIEW.width;
      const rise = (time * 22 + hash(i, 23) * 300) % 420;
      const y = VIEW.height - 40 - rise;
      const life = 1 - rise / 420;
      ctx.fillStyle = `rgba(255, 225, 140, ${life * 0.85})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw(state, beam, screen) {
    resize();
    const palette = screen === SCREEN_VICTORY ? DAWN : PALETTES[state.night - 1];
    const storm = state.night === 5 && screen !== SCREEN_VICTORY && screen !== SCREEN_TITLE;
    ctx.save();
    ctx.setTransform(scale.x, 0, 0, scale.y, 0, 0);
    if (state.shake > 0) {
      const magnitude = state.shake;
      const dx = Math.sin(state.time * 91.7) * magnitude * 0.5;
      const dy = Math.cos(state.time * 113.3) * magnitude * 0.5;
      ctx.translate(dx, dy);
    }
    drawSea(palette, state.time, storm);
    // Night 5 is a storm: the moon hides behind the clouds.
    if (screen !== SCREEN_VICTORY) drawMoon(palette, state.night === 5 ? 0.3 : 1);
    drawFogDrift(state, palette);
    drawRocks(state.rocks, state.time);
    drawIsland(palette, state.time);
    drawBeam(beam, palette, state);
    for (const ship of state.ships) drawShip(ship, palette, state.time);
    for (const wraith of state.wraiths) drawWraith(wraith, state.time);
    drawFogBanks(state, palette);
    drawLighthouse(palette, beam);
    // The lamp is being smothered: a pulsing ring around the island, so the
    // dimming beam is never a mystery.
    if (beam.clinging > 0 && screen === SCREEN_PLAY) {
      const pulse = 0.35 + 0.25 * Math.sin(state.time * 6);
      ctx.strokeStyle = `rgba(255, 110, 80, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(LIGHTHOUSE.x, LIGHTHOUSE.y, ISLAND_RADIUS + 42, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (screen === SCREEN_VICTORY) drawDawn(state.time);
    drawParticles(state);
    drawFogVeil(state, palette);
    ctx.restore();
  }

  return { draw, resize };
}
