// Beam geometry for Lantern Tide: the rotating cone of light, its reach,
// and the expanding pulse that banishes wraiths. Wraiths clinging to the
// lamp shorten the beam; the pulse clears them.
import { BEAM, LIGHTHOUSE, WRAITH } from './config.js';

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function createBeam() {
  const beam = {
    angle: -Math.PI / 2,
    on: true,
    width: BEAM.width,
    range: BEAM.range,
    pulse: null,
    clinging: 0,
    // Effective reach after wraith dimming (0..1 of full range).
    strength() {
      return Math.max(0.35, 1 - beam.clinging * WRAITH.dimPerWraith);
    },
    effectiveRange() {
      return beam.range * beam.strength();
    },
    aimAt(angle) {
      beam.angle = angle;
    },
    rotate(delta) {
      beam.angle += delta;
    },
    pointInBeam(x, y) {
      if (!beam.on) return false;
      const dx = x - LIGHTHOUSE.x;
      const dy = y - LIGHTHOUSE.y;
      const distance = Math.hypot(dx, dy);
      if (distance > beam.effectiveRange()) return false;
      if (distance < 30) return true;
      const angle = Math.atan2(dy, dx);
      return Math.abs(angleDifference(angle, beam.angle)) < beam.width / 2;
    },
    firePulse() {
      if (beam.pulse) return false;
      beam.pulse = { radius: 30 };
      return true;
    },
    // Returns the wraiths banished this step (their indices into the list).
    update(dt, wraiths) {
      const banished = [];
      if (beam.pulse) {
        beam.pulse.radius += BEAM.pulseExpandPerSecond * dt;
        for (let i = 0; i < wraiths.length; i += 1) {
          const wraith = wraiths[i];
          const distance = Math.hypot(wraith.x - LIGHTHOUSE.x, wraith.y - LIGHTHOUSE.y);
          if (distance < beam.pulse.radius) banished.push(i);
        }
        if (beam.pulse.radius >= BEAM.pulseRadius) beam.pulse = null;
      }
      return banished;
    },
  };
  return beam;
}
