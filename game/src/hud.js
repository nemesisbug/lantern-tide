// The HUD and the overlay screens for Lantern Tide: title, pause, upgrade
// choice, game over and victory. Drawn on the same canvas after the world.
import { VIEW } from './config.js';

const TITLE_FONT = 'bold 64px Georgia, serif';
const HEADING_FONT = 'bold 40px Georgia, serif';
const BODY_FONT = '20px Georgia, serif';
const SMALL_FONT = '16px Georgia, serif';
const HUD_FONT = 'bold 19px Georgia, serif';
const GOLD = '#ffd97a';
const GOLD_PALE = '#ffe9a8';
const INK = '#e8f2f8';
const MIST = '#cfe4f2';
const FAINT = '#9db8c8';

export function upgradeCardRects() {
  const width = 300;
  const height = 180;
  const gap = 36;
  const total = width * 3 + gap * 2;
  const startX = (VIEW.width - total) / 2;
  const y = 326;
  return [0, 1, 2].map((index) => ({
    x: startX + index * (width + gap),
    y,
    width,
    height,
  }));
}

export function createHud(canvas) {
  const ctx = canvas.getContext('2d');

  // One radius system: 12px for HUD pills, 16px for cards and panels.
  function rr(x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  // Glass panel: translucent dark fill, hairline gold border, soft shadow.
  function glass(x, y, width, height, radius, alpha = 0.72) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = `rgba(4, 12, 20, ${alpha})`;
    rr(x, y, width, height, radius);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 217, 122, 0.35)';
    ctx.lineWidth = 1.5;
    rr(x, y, width, height, radius);
    ctx.stroke();
  }

  // A thin gold rule that fades at both ends — the divider under headings.
  function goldRule(centerX, y, width) {
    const gradient = ctx.createLinearGradient(centerX - width / 2, y, centerX + width / 2, y);
    gradient.addColorStop(0, 'rgba(255, 217, 122, 0)');
    gradient.addColorStop(0.5, 'rgba(255, 217, 122, 0.85)');
    gradient.addColorStop(1, 'rgba(255, 217, 122, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(centerX - width / 2, y, width, 2);
  }

  // A CTA that reads as a button: gold pill, dark text, breathing glow.
  function ctaPill(text, y, font, time) {
    ctx.font = font;
    const width = ctx.measureText(text).width + 64;
    const x = (VIEW.width - width) / 2;
    const height = 56;
    const breathe = 0.55 + 0.20 * Math.sin(time * 2.4);
    ctx.save();
    ctx.shadowColor = `rgba(255, 217, 122, ${breathe})`;
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(255, 217, 122, 0.92)';
    rr(x, y, width, height, 28);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1a1408';
    ctx.textAlign = 'center';
    ctx.fillText(text, VIEW.width / 2, y + 37);
  }

  function centered(text, y, font, color) {
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(text, VIEW.width / 2, y);
  }

  function drawHud(state, beam, best, muted, extra) {
    const hints = (extra && extra.hints) || null;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const scaleX = canvas.width / VIEW.width;
    const scaleY = canvas.height / VIEW.height;
    ctx.scale(scaleX, scaleY);
    // Top bar: two floating glass pills instead of a hard full-width strip.
    ctx.font = HUD_FONT;
    const leftText = `Night ${state.night} / 5`;
    const leftSub = `Guided ${state.guided}   Lost ${state.lost}   Wrecks ${state.wrecks}/3`;
    ctx.font = '16px Georgia, serif';
    const leftWidth = 24 + ctx.measureText(leftText).width + 18
      + ctx.measureText(leftSub).width + 24;
    glass(16, 12, leftWidth, 40, 12, 0.66);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = HUD_FONT;
    ctx.fillStyle = GOLD_PALE;
    ctx.fillText(leftText, 40, 33);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = MIST;
    ctx.fillText(leftSub, 40 + ctx.measureText(leftText).width + 18, 33);
    const rightText = `Score ${state.score}   Glow ${state.glow}`;
    const rightSub = `Best ${best}${muted ? '   Muted' : ''}`;
    ctx.font = HUD_FONT;
    const rightWidth = 24 + ctx.measureText(rightText).width + 18
      + ctx.measureText(rightSub).width + 24;
    glass(VIEW.width - 16 - rightWidth, 12, rightWidth, 40, 12, 0.66);
    ctx.textAlign = 'right';
    ctx.fillStyle = GOLD_PALE;
    ctx.fillText(rightText, VIEW.width - 40 - ctx.measureText(rightSub).width - 18, 33);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = FAINT;
    ctx.fillText(rightSub, VIEW.width - 40, 33);
    ctx.textBaseline = 'alphabetic';
    // Wraith warning: the lamp is being smothered, and the fix is one pulse.
    if (beam.clinging > 0) {
      const blink = 0.65 + 0.35 * Math.sin(state.time * 6);
      ctx.font = 'bold 19px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255, 170, 110, ${blink})`;
      ctx.fillText('Wraiths cling to the lamp — Click / Space to pulse!', VIEW.width / 2, 76);
    }
    // First-night onboarding: one short lesson at a time, each clearing as
    // the player actually does it — the game teaches itself in a minute.
    if (hints && state.night === 1 && !hints.done) {
      const step = !hints.aimed
        ? 'Move the mouse to aim the beam — or drag on touch'
        : !hints.rescued
          ? 'Ships caught in the light sail home to the harbour'
          : !hints.pulsed
            ? 'Click / Space to pulse — banishes wraiths, costs oil'
            : 'Watch the oil — press B to douse the lamp and refill it';
      ctx.font = '20px Georgia, serif';
      const width = ctx.measureText(step).width + 48;
      const x = (VIEW.width - width) / 2;
      const y = VIEW.height - 96;
      glass(x, y, width, 40, 12, 0.78);
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD_PALE;
      ctx.fillText(step, VIEW.width / 2, y + 27);
    }
    // Oil gauge, bottom left.
    const gaugeX = 18;
    const gaugeY = VIEW.height - 44;
    const gaugeWidth = 260;
    glass(gaugeX - 10, gaugeY - 26, gaugeWidth + 20, 44, 12, 0.66);
    ctx.fillStyle = FAINT;
    ctx.font = SMALL_FONT;
    ctx.textAlign = 'left';
    ctx.fillText(beam.on ? 'OIL — beam on (B to douse)' : 'OIL — beam off (B to light)', gaugeX, gaugeY - 8);
    const fraction = state.oil / state.maxOil;
    rr(gaugeX, gaugeY, gaugeWidth, 12, 6);
    ctx.fillStyle = '#16242f';
    ctx.fill();
    const oilFill = ctx.createLinearGradient(gaugeX, 0, gaugeX + gaugeWidth, 0);
    if (fraction > 0.35) {
      oilFill.addColorStop(0, '#ffcf5e');
      oilFill.addColorStop(1, '#ffb84d');
    } else {
      oilFill.addColorStop(0, '#ff7a5c');
      oilFill.addColorStop(1, '#e05252');
    }
    if (fraction > 0.02) {
      ctx.fillStyle = oilFill;
      rr(gaugeX, gaugeY, Math.max(12, gaugeWidth * fraction), 12, 6);
      ctx.fill();
    }
    if (fraction <= 0.25) {
      const blink = 0.55 + 0.45 * Math.sin(state.time * 8);
      ctx.fillStyle = `rgba(255, 110, 90, ${blink})`;
      ctx.font = 'bold 19px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('LOW OIL!', gaugeX + gaugeWidth + 26, gaugeY + 11);
    }
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9db8c8';
    ctx.font = SMALL_FONT;
    ctx.fillText(
      window.__touchMode ? 'Drag to aim · Tap to pulse · P pause · M mute' : 'Mouse aim · Click / Space pulse · P pause · M mute',
      VIEW.width - 18, VIEW.height - 22,
    );
    ctx.restore();
  }

  function drawTitle(best, time) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.42)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    // Display title, tracked out, with a fading gold rule beneath it.
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '6px';
    ctx.fillStyle = GOLD_PALE;
    ctx.fillText('LANTERN TIDE', VIEW.width / 2, 178);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    goldRule(VIEW.width / 2, 200, 320);
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = MIST;
    ctx.fillText('Keeper of the lighthouse — guide the lost ships home before dawn.', VIEW.width / 2, 238);
    if (best > 0) {
      ctx.font = BODY_FONT;
      ctx.fillStyle = GOLD_PALE;
      ctx.fillText(`Best score: ${best}`, VIEW.width / 2, 276);
    }
    // The rules, in one glass panel instead of loose lines on the sea.
    const panelX = 300;
    const panelY = 312;
    const panelW = VIEW.width - 600;
    glass(panelX, panelY, panelW, 128, 16, 0.66);
    ctx.font = BODY_FONT;
    ctx.fillStyle = INK;
    ctx.fillText('Aim the beam with the mouse. Ships caught in the light sail home.', VIEW.width / 2, panelY + 34);
    ctx.fillText('Click or Space pulses the beam and banishes fog-wraiths — it costs oil.', VIEW.width / 2, panelY + 66);
    ctx.fillText('Rocks wreck ships. Three wrecks in a night, or an empty lamp, ends the game.', VIEW.width / 2, panelY + 98);
    ctx.font = BODY_FONT;
    ctx.fillStyle = MIST;
    ctx.fillText('Survive all 5 nights — spend glow on upgrades between nights.', VIEW.width / 2, 472);
    ctx.font = SMALL_FONT;
    ctx.fillStyle = FAINT;
    ctx.fillText('B toggles the beam · Arrows / A D rotate · P pause · M mute · R restart', VIEW.width / 2, 500);
    ctaPill(
      window.__touchMode ? 'Tap PULSE to begin' : 'Click or press Enter to begin',
      536, HEADING_FONT, time,
    );
    ctx.restore();
  }

  function drawPause() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    glass(VIEW.width / 2 - 260, 260, 520, 170, 16, 0.8);
    centered('Paused', 330, HEADING_FONT, GOLD_PALE);
    goldRule(VIEW.width / 2, 352, 180);
    centered('Press P or Esc to keep the watch.', 392, BODY_FONT, INK);
    centered('Press R to start the night over.', 424, BODY_FONT, FAINT);
    ctx.restore();
  }

  function drawUpgrade(state) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 10, 18, 0.55)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered(`Night ${state.night} complete — dawn is nearer`, 190, HEADING_FONT, GOLD_PALE);
    goldRule(VIEW.width / 2, 212, 260);
    centered(`Glow to spend: ${state.glow} — choose one upgrade`, 248, BODY_FONT, MIST);
    const rects = upgradeCardRects();
    state.upgradeChoices.forEach((upgrade, index) => {
      const rect = rects[index];
      // Card: gradient body, gold top accent, number in a ringed circle.
      const body = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
      body.addColorStop(0, 'rgba(12, 28, 42, 0.94)');
      body.addColorStop(1, 'rgba(6, 15, 25, 0.94)');
      ctx.fillStyle = body;
      rr(rect.x, rect.y, rect.width, rect.height, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 217, 122, 0.35)';
      ctx.lineWidth = 1.5;
      rr(rect.x, rect.y, rect.width, rect.height, 16);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      rr(rect.x + 16, rect.y, rect.width - 32, 3, 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rect.x + rect.width / 2, rect.y + 42, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = GOLD;
      ctx.fillText(`${index + 1}`, rect.x + rect.width / 2, rect.y + 50);
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillStyle = GOLD_PALE;
      ctx.fillText(upgrade.name, rect.x + rect.width / 2, rect.y + 96);
      ctx.font = SMALL_FONT;
      ctx.fillStyle = '#d7e6ef';
      const words = upgrade.desc.split(' ');
      let line = '';
      let lineY = rect.y + 124;
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
    centered('Click a card or press 1, 2 or 3.', 560, BODY_FONT, INK);
    ctx.restore();
  }

  function drawStats(state, best) {
    const rows = [
      ['Nights survived', `${state.nightsSurvived} / 5`],
      ['Ships guided home', `${state.totalGuided}`],
      ['Ships lost', `${state.totalLost}`],
      ['Ships wrecked', `${state.totalWrecks}`],
      ['Score', `${state.score}`],
      ['Best', `${Math.max(best, state.score)}`],
    ];
    const panelW = 460;
    const panelX = (VIEW.width - panelW) / 2;
    const panelY = 318;
    const panelH = 40 + rows.length * 32;
    glass(panelX, panelY, panelW, panelH, 16, 0.72);
    rows.forEach(([label, value], index) => {
      const y = panelY + 40 + index * 32;
      ctx.font = index >= 4 ? 'bold 20px Georgia, serif' : BODY_FONT;
      ctx.textAlign = 'left';
      ctx.fillStyle = index >= 4 ? GOLD_PALE : MIST;
      ctx.fillText(label, panelX + 28, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = index >= 4 ? GOLD : INK;
      ctx.fillText(value, panelX + panelW - 28, y);
    });
  }

  function drawNewBest(newBest) {
    if (!newBest) return;
    ctx.font = 'bold 22px Georgia, serif';
    const text = '★ NEW BEST! ★';
    const width = ctx.measureText(text).width + 44;
    const x = (VIEW.width - width) / 2;
    const y = 272;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 217, 122, 0.6)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(255, 217, 122, 0.94)';
    rr(x, y, width, 38, 19);
    ctx.fill();
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a1408';
    ctx.fillText(text, VIEW.width / 2, y + 27);
  }

  function drawOver(state, best, newBest, time) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(4, 8, 14, 0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('The light has gone out', 190, HEADING_FONT, '#ff9a7a');
    goldRule(VIEW.width / 2, 212, 240);
    centered(
      state.loseReason === 'oil'
        ? 'The lamp ran dry. The ships sail on into the dark.'
        : 'Three ships wrecked on the rocks this night.',
      248, BODY_FONT, INK,
    );
    drawNewBest(newBest);
    drawStats(state, best);
    ctaPill('Press R to try again', 590, 'bold 24px Georgia, serif', time);
    ctx.restore();
  }

  function drawVictory(state, best, newBest, time) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / VIEW.width, canvas.height / VIEW.height);
    ctx.fillStyle = 'rgba(30, 22, 8, 0.32)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    centered('Dawn breaks over the harbour', 190, HEADING_FONT, GOLD_PALE);
    goldRule(VIEW.width / 2, 212, 260);
    centered('Five nights kept. Every ship that could come home, came home.', 248, BODY_FONT, '#fdf6dd');
    drawNewBest(newBest);
    drawStats(state, best);
    ctaPill('Press R to play again', 590, 'bold 24px Georgia, serif', time);
    ctx.restore();
  }

  function draw(state, beam, screen, best, muted, extra = {}) {
    if (screen === 'title') drawTitle(best, state.time);
    else if (screen === 'paused') drawPause();
    else if (screen === 'upgrade') drawUpgrade(state);
    else if (screen === 'over') drawOver(state, best, extra.newBest, state.time);
    else if (screen === 'victory') drawVictory(state, best, extra.newBest, state.time);
    else drawHud(state, beam, best, muted, extra);
  }

  return { draw };
}
