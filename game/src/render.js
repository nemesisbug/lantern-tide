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

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const scale = { x: 1, y: 1 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = 1280;
    canvas.height = 720;
    scale.x = rect.width / 1280;
    scale.y = rect.height / 720;
  }

  function drawSea(palette, time, storm) {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, palette.deep);
    gradient.addColorStop(1, palette.sea);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.strokeStyle = 'rgba(160, 200, 225, 0.10)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i += 1) {
      const baseY = 40 + i * 50;
      ctx.beginPath();
      for (let x = 0; x <= VIEW.width; x += 32) {
        const y = baseY + Math.sin(x * 0.012 + time * 0.7 + i * 1.7) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
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

  function drawIsland(palette, time) {
    ctx.fillStyle = palette.island;
    ctx.beginPath();
    ctx.ellipse(LIGHTHOUSE.x, LIGHTHOUSE.y + 26, ISLAND_RADIUS + 14, ISLAND_RADIUS * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
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
    }
    ctx.globalAlpha = 1;
  }

  function drawLighthouse(palette, beam) {
    const { x, y } = LIGHTHOUSE;
    ctx.fillStyle = '#e8e2d2';
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 30);
    ctx.lineTo(x - 10, y - 34);
    ctx.lineTo(x + 10, y - 34);
    ctx.lineTo(x + 16, y + 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a33327';
    ctx.fillRect(x - 13, y + 8, 26, 10);
    ctx.fillRect(x - 11, y - 16, 22, 9);
    ctx.fillStyle = '#22201c';
    ctx.fillRect(x - 13, y - 48, 26, 15);
    const glow = ctx.createRadialGradient(x, y - 40, 2, x, y - 40, 34);
    glow.addColorStop(0, palette.lamp);
    glow.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y - 40, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = beam.on ? '#fff3c4' : '#5c5648';
    ctx.beginPath();
    ctx.arc(x, y - 40, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBeam(beam, palette) {
    if (!beam.on) return;
    const { x, y } = LIGHTHOUSE;
    const range = beam.effectiveRange();
    const half = beam.width / 2;
    const gradient = ctx.createRadialGradient(x, y, 20, x, y, range);
    gradient.addColorStop(0, 'rgba(255, 225, 150, 0.55)');
    gradient.addColorStop(0.6, 'rgba(255, 215, 130, 0.22)');
    gradient.addColorStop(1, 'rgba(255, 215, 130, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, beam.angle - half, beam.angle + half);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 235, 180, 0.35)';
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

  function drawRocks(rocks) {
    for (const rock of rocks) {
      ctx.fillStyle = '#232d33';
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#31414a';
      ctx.beginPath();
      ctx.arc(rock.x - rock.radius * 0.25, rock.y - rock.radius * 0.3, rock.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 220, 230, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rock.x, rock.y, rock.radius, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
    }
  }

  function drawShip(ship, palette, time) {
    if (ship.state === 'rescued' || ship.state === 'wrecked' || ship.state === 'lost') return;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.heading);
    // Wake.
    ctx.strokeStyle = 'rgba(180, 210, 230, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-ship.size, 0);
    ctx.lineTo(-ship.size - 16, -4);
    ctx.moveTo(-ship.size, 0);
    ctx.lineTo(-ship.size - 16, 4);
    ctx.stroke();
    // Hull.
    ctx.fillStyle = ship.guided ? '#7a5a34' : '#4a3b2c';
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size * 0.7, -ship.size * 0.55);
    ctx.lineTo(-ship.size, 0);
    ctx.lineTo(-ship.size * 0.7, ship.size * 0.55);
    ctx.closePath();
    ctx.fill();
    // Sail.
    ctx.fillStyle = ship.guided ? '#f2e8c8' : '#b9b09a';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-ship.size * 0.4, -ship.size * 1.3);
    ctx.lineTo(-ship.size * 0.4, -2);
    ctx.closePath();
    ctx.fill();
    // Lantern.
    const flicker = 0.75 + 0.25 * Math.sin(time * 4 + ship.phase);
    ctx.globalAlpha = flicker;
    ctx.fillStyle = palette.lamp;
    ctx.beginPath();
    ctx.arc(ship.size * 0.4, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    if (ship.guided) {
      ctx.strokeStyle = 'rgba(255, 225, 150, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y);
      ctx.lineTo(HARBOUR.x, HARBOUR.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawWraith(wraith, time) {
    const alpha = wraith.clinging ? 0.85 : 0.55;
    ctx.fillStyle = `rgba(200, 215, 235, ${alpha})`;
    ctx.beginPath();
    const wobble = Math.sin(time * 2 + wraith.wobble) * 3;
    ctx.ellipse(wraith.x, wraith.y + wobble, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();
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
    drawRocks(state.rocks);
    drawIsland(palette, state.time);
    drawBeam(beam, palette);
    for (const ship of state.ships) drawShip(ship, palette, state.time);
    for (const wraith of state.wraiths) drawWraith(wraith, state.time);
    drawFogBanks(state, palette);
    drawLighthouse(palette, beam);
    drawParticles(state);
    drawFogVeil(state, palette);
    ctx.restore();
  }

  return { draw, resize };
}
