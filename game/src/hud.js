// The HUD and the overlay screens for Lantern Tide: title, pause, upgrade
// choice, game over and victory. Drawn on the same canvas after the world.
import { VIEW } from './config.js';

const TITLE_FONT = 'bold 64px Georgia, serif';
const HEADING_FONT = 'bold 40px Georgia, serif';
const BODY_FONT = '20px Georgia, serif';
const SMALL_FONT = '16px Georgia, serif';
const HUD_FONT = 'bold 19px Georgia, serif';

export function upgradeCardRects() {
  const width = 300;
  const height = 170;
  const gap = 36;
  const total = width * 3 + gap * 2;
  const startX = (VIEW.width - total) / 2;
  const y = 330;
  return [0, 1, 2].map((index) => ({
    x: startX + index * (width + gap),
    y,
    width,
    height,
  }));
}

export function createHud(canvas) {
  const ctx = canvas.getContext('2d');

  function panel(x, y, width, height, alpha) {
    ctx.fillStyle = `rgba(4, 12, 20, ${alpha})`;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(255, 217, 122, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
  }

  function centered(text, y, font, color) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, VIEW.width / 2, y);
  }

  function drawHud(state, beam, best, muted) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scaleX = canvas.width / VIEW.width;
    const scaleY = canvas.height / VIEW.height;
    ctx.scale(scaleX, scaleY);
    // Top bar.
    ctx.fillStyle = 'rgba(4, 12, 20, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, 46);
    ctx.font = HUD_FONT;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(`Night ${state.night} / 5`, 18, 30);
    ctx.fillStyle = '#bfe3ff';
    ctx.fillText(`Guided ${state.guided}   Lost ${state.lost}   Wrecks ${state.wrecks}/3`, 180, 30);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(`Score ${state.score}   Glow ${state.glow}`, VIEW.width - 180, 30);
    ctx.fillStyle = '#9db8c8';
    ctx.fillText(`Best ${best}${muted ? '   Muted' : ''}`, VIEW.width - 18, 30);
    // Oil gauge, bottom left.
    const gaugeX = 18;
    const gaugeY = VIEW.height - 44;
    const gaugeWidth = 260;
    ctx.fillStyle = 'rgba(4, 12, 20, 0.6)';
    ctx.fillRect(gaugeX - 8, gaugeY - 22, gaugeWidth + 16, 36);
    ctx.fillStyle = '#9db8c8';
    ctx.font = SMALL_FONT;
    ctx.textAlign = 'left';
    ctx.fillText(beam.on ? 'OIL — beam on (B to douse)' : 'OIL — beam off (B to light)', gaugeX, gaugeY - 6);
    const fraction = state.oil / state.maxOil;
    ctx.fillStyle = '#1a2c3a';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth, 12);
    ctx.fillStyle = fraction > 0.35 ? '#ffb84d' : '#e05252';
    ctx.fillRect(gaugeX, gaugeY, gaugeWidth * fraction, 12);
    ctx.strokeStyle = 'rgba(255, 233, 168, 0.6)';
    ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9db8c8';
    ctx.font = SMALL_FONT;
    ctx.fillText('Mouse aim · Click / Space pulse · P pause · M mute', VIEW.width - 18, VIEW.height - 22);
    ctx.restore();
  }

  function drawTitle(best) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('LANTERN TIDE', 190, TITLE_FONT, '#ffe9a8');
    centered('Keeper of the lighthouse — guide the lost ships home before dawn.', 235, BODY_FONT, '#cfe4f2');
    if (best > 0) centered(`Best score: ${best}`, 275, BODY_FONT, '#ffe9a8');
    centered('Aim the beam with the mouse. Ships caught in the light sail home.', 350, BODY_FONT, '#e8f2f8');
    centered('Click or Space pulses the beam and banishes fog-wraiths — it costs oil.', 382, BODY_FONT, '#e8f2f8');
    centered('Rocks wreck ships. Three wrecks in a night, or an empty lamp, ends the game.', 414, BODY_FONT, '#e8f2f8');
    centered('Survive all 5 nights. Spend glow on upgrades between nights.', 446, BODY_FONT, '#e8f2f8');
    centered('Click or press Enter to begin', 540, HEADING_FONT, '#ffd97a');
    centered('B toggles the beam · Arrows / A D rotate · P pause · M mute · R restart', 590, SMALL_FONT, '#9db8c8');
    ctx.restore();
  }

  function drawPause() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('Paused', 330, HEADING_FONT, '#ffe9a8');
    centered('Press P or Esc to keep the watch.', 390, BODY_FONT, '#e8f2f8');
    centered('Press R to start the night over.', 424, BODY_FONT, '#e8f2f8');
    ctx.restore();
  }

  function drawUpgrade(state) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered(`Night ${state.night} complete — dawn is nearer`, 190, HEADING_FONT, '#ffe9a8');
    centered(`Glow to spend: ${state.glow} — choose one upgrade`, 235, BODY_FONT, '#cfe4f2');
    const rects = upgradeCardRects();
    state.upgradeChoices.forEach((upgrade, index) => {
      const rect = rects[index];
      panel(rect.x, rect.y, rect.width, rect.height, 0.85);
      centered(`${index + 1}`, rect.y + 44, HEADING_FONT, '#ffd97a');
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9a8';
      ctx.fillText(upgrade.name, rect.x + rect.width / 2, rect.y + 84);
      ctx.font = SMALL_FONT;
      ctx.fillStyle = '#d7e6ef';
      const words = upgrade.desc.split(' ');
      let line = '';
      let lineY = rect.y + 112;
      for (const word of words) {
        if ((line + word).length > 26) {
          ctx.fillText(line, rect.x + rect.width / 2, lineY);
          line = '';
          lineY += 20;
        }
        line += `${word} `;
      }
      ctx.fillText(line, rect.x + rect.width / 2, lineY);
    });
    centered('Click a card or press 1, 2 or 3.', 560, BODY_FONT, '#e8f2f8');
    ctx.restore();
  }

  function drawStats(state, best) {
    const lines = [
      `Nights survived: ${state.nightsSurvived} / 5`,
      `Ships guided home: ${state.totalGuided}`,
      `Ships lost: ${state.totalLost}`,
      `Ships wrecked: ${state.totalWrecks}`,
      `Score: ${state.score}`,
      `Best: ${Math.max(best, state.score)}`,
    ];
    lines.forEach((line, index) => {
      centered(line, 350 + index * 32, BODY_FONT, '#e8f2f8');
    });
  }

  function drawOver(state, best) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 8, 14, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('The light has gone out', 200, HEADING_FONT, '#ff9a7a');
    centered(
      state.loseReason === 'oil'
        ? 'The lamp ran dry. The ships sail on into the dark.'
        : 'Three ships wrecked on the rocks this night.',
      245, BODY_FONT, '#e8f2f8',
    );
    drawStats(state, best);
    centered('Press R to try again', 590, HEADING_FONT, '#ffd97a');
    ctx.restore();
  }

  function drawVictory(state, best) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(30, 22, 8, 0.35)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('Dawn breaks over the harbour', 200, HEADING_FONT, '#ffe9a8');
    centered('Five nights kept. Every ship that could come home, came home.', 245, BODY_FONT, '#fdf6dd');
    drawStats(state, best);
    centered('Press R to play again', 590, HEADING_FONT, '#ffd97a');
    ctx.restore();
  }

  function draw(state, beam, screen, best, muted) {
    if (screen === 'title') drawTitle(best);
    else if (screen === 'paused') drawPause();
    else if (screen === 'upgrade') drawUpgrade(state);
    else if (screen === 'over') drawOver(state, best);
    else if (screen === 'victory') drawVictory(state, best);
    else drawHud(state, beam, best, muted);
  }

  return { draw };
}
