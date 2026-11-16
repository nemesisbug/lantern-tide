// Lantern Tide — tuning constants shared by the simulation and the renderer.
// Nights get harder: more ships, more rocks, thicker fog, faster wraiths.
// Night 5 adds the storm.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'lantern-tide-best';

export const LIGHTHOUSE = { x: 640, y: 340 };
export const ISLAND_RADIUS = 92;
export const HARBOUR = { x: 640, y: 428, radius: 46 };

export const NIGHTS = [
  { ships: 6, rocks: 4, fogBanks: 1, wraiths: 2, wraithSpeed: 14, fog: 0.16, storm: false },
  { ships: 8, rocks: 6, fogBanks: 2, wraiths: 3, wraithSpeed: 17, fog: 0.22, storm: false },
  { ships: 10, rocks: 8, fogBanks: 2, wraiths: 4, wraithSpeed: 20, fog: 0.28, storm: false },
  { ships: 12, rocks: 10, fogBanks: 3, wraiths: 5, wraithSpeed: 23, fog: 0.34, storm: false },
  { ships: 14, rocks: 11, fogBanks: 3, wraiths: 6, wraithSpeed: 27, fog: 0.4, storm: true },
];

export const OIL = {
  tank: 100,
  drainPerSecond: 2.2,
  pulseCost: 9,
  refillOffPerSecond: 8,
  refillBetweenPerSecond: 40,
};

export const SCORE = {
  rescueBase: 100,
  rescuePerNight: 50,
  glowPerRescue: 12,
  wreckPenalty: 40,
};

export const UPGRADES = [
  { id: 'wide', name: 'Wide Beam', desc: 'Beam cone +35% wider. Sweep more sea at once.' },
  { id: 'cheap', name: 'Cheap Pulse', desc: 'Pulse costs half the oil. Banish wraiths freely.' },
  { id: 'tank', name: 'Bigger Tank', desc: 'Lamp oil capacity +40. Shine longer each night.' },
  { id: 'swift', name: 'Swift Guiding', desc: 'Guided ships sail 35% faster to the harbour.' },
];

export const BEAM = {
  width: 0.42,
  range: 560,
  pulseRadius: 220,
  pulseExpandPerSecond: 620,
};

export const SHIP = {
  driftSpeed: 26,
  guidedSpeed: 64,
  radius: 13,
  spawnInterval: 4.5,
};

export const WRAITH = {
  radius: 16,
  clingDistance: 74,
  dimPerWraith: 0.16,
  spawnInterval: 9,
};

export const ROCKS = { minDistanceFromHarbour: 190, radiusMin: 16, radiusMax: 34 };

// Per-night palettes: sea, deep sea, fog, island, lamp, accent, plus the
// night-sky gradient (sky -> skyTop), moonlight and star tint. The world is
// cold indigo/teal; the lamp's amber is the single warm accent.
export const PALETTES = [
  { sea: '#0e3049', deep: '#081c2c', fog: '#9db8c8', island: '#1d2f28', lamp: '#ffd97a', accent: '#7fd4ff', sky: '#12324a', skyTop: '#050b16', moon: '#e8f1f8', star: '#cfe4f2' },
  { sea: '#0d2c44', deep: '#071a29', fog: '#a7bdd0', island: '#1b2c26', lamp: '#ffd97a', accent: '#7fd4ff', sky: '#112c44', skyTop: '#040a14', moon: '#e8f1f8', star: '#cfe4f2' },
  { sea: '#0c2a42', deep: '#071826', fog: '#b0c2d4', island: '#192a24', lamp: '#ffcf5e', accent: '#8fd8ff', sky: '#102a42', skyTop: '#040912', moon: '#e2edf5', star: '#c6ddef' },
  { sea: '#0c283f', deep: '#061624', fog: '#bccbdd', island: '#182822', lamp: '#ffc94a', accent: '#9fdcff', sky: '#0f283f', skyTop: '#03080f', moon: '#dde9f2', star: '#bdd6ec' },
  { sea: '#10233c', deep: '#071224', fog: '#c3cfdd', island: '#1a2624', lamp: '#ffbf3d', accent: '#b0e2ff', sky: '#0e2438', skyTop: '#03070e', moon: '#d8e5ef', star: '#b4cfe8' },
];
export const DAWN = { sea: '#3d6b7c', deep: '#22414f', fog: '#ecd9a8', island: '#33482f', lamp: '#ffe9a8', accent: '#ffd97a', sky: '#e8b96a', skyTop: '#7a5a8a', moon: '#fff3c4', star: '#ffe9a8' };
