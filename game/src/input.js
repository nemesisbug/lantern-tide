// Keyboard and mouse for Lantern Tide. The mouse aims the beam from the
// lighthouse; a click or Space pulses; B toggles the beam; arrows or A/D
// rotate it finely. Actions are edge-triggered: takeActions returns the
// actions that fired since the last call, then clears them.
import { LIGHTHOUSE } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_PULSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;
export const ACTION_TOGGLE_BEAM = 32;
export const ACTION_PICK_1 = 64;
export const ACTION_PICK_2 = 128;
export const ACTION_PICK_3 = 256;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_PULSE,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  b: ACTION_TOGGLE_BEAM,
  B: ACTION_TOGGLE_BEAM,
  1: ACTION_PICK_1,
  2: ACTION_PICK_2,
  3: ACTION_PICK_3,
};

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;
  let touchRotate = 0;
  let mouseX = LIGHTHOUSE.x;
  let mouseY = LIGHTHOUSE.y - 200;
  let mouseDown = false;
  let clickX = null;
  let clickY = null;
  let lastAim = Math.atan2(mouseY - LIGHTHOUSE.y, mouseX - LIGHTHOUSE.x);

  function angleFromMouse() {
    return Math.atan2(mouseY - LIGHTHOUSE.y, mouseX - LIGHTHOUSE.x);
  }

  function pointFromEvent(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    mouseY = ((event.clientY - rect.top) / rect.height) * 720;
  }

  canvas.addEventListener('mousemove', (event) => {
    pointFromEvent(event);
  });
  canvas.addEventListener('mousedown', (event) => {
    mouseDown = true;
    pointFromEvent(event);
    clickX = mouseX;
    clickY = mouseY;
    queued |= ACTION_PULSE;
  });
  // Touch: drag aims the beam, a tap pulses — the same verbs as the mouse.
  canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    window.__touchMode = true;
    document.body.classList.add('touch');
    const touch = event.changedTouches[0];
    mouseDown = true;
    pointFromEvent(touch);
    clickX = mouseX;
    clickY = mouseY;
    queued |= ACTION_PULSE;
  }, { passive: false });
  canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    window.__touchMode = true;
    document.body.classList.add('touch');
    pointFromEvent(event.changedTouches[0]);
  }, { passive: false });
  canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    mouseDown = false;
  }, { passive: false });
  window.addEventListener('mouseup', () => {
    mouseDown = false;
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) {
      held.add(event.key);
      return;
    }
    held.add(event.key);
    const action = KEY_ACTIONS[event.key];
    if (action) {
      queued |= action;
      if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    aimAngle() {
      return angleFromMouse();
    },
    // True once the player has actually aimed somewhere new: the onboarding
    // hint clears on the action, not on a timer.
    aimedSinceLastCheck() {
      const angle = angleFromMouse();
      const moved = Math.abs(angle - lastAim) > 0.05;
      lastAim = angle;
      return moved;
    },
    // Fine rotation held this frame: -1, 0 or 1.
    rotateDirection() {
      if (touchRotate !== 0) return touchRotate;
      const left = held.has('ArrowLeft') || held.has('a') || held.has('A');
      const right = held.has('ArrowRight') || held.has('d') || held.has('D');
      if (left && !right) return -1;
      if (right && !left) return 1;
      return 0;
    },
    // On-screen buttons (touch): hold to rotate, tap for an action.
    setTouchRotate(direction) {
      touchRotate = direction;
    },
    queueAction(action) {
      queued |= action;
    },
    mouseDown() {
      return mouseDown;
    },
    // The last click point (consumed by the caller), or null.
    takeClick() {
      if (clickX === null) return null;
      const point = { x: clickX, y: clickY };
      clickX = null;
      clickY = null;
      return point;
    },
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
  };
}
