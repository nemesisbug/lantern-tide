# Lantern Tide

You are the keeper of a lighthouse on a drifting island in a foggy night sea.
Guide lost ships home to the harbour through rocks and fog before dawn.

## How to play

Serve the `game/` folder with any static file server and open
`game/index.html` in a desktop browser. The game plays fully offline — no
network requests, no downloads, just keyboard and mouse.

- **Aim the beam** with the mouse, or rotate it finely with the **arrow keys**
  / **A** and **D**.
- **Click** or press **Space** to pulse the beam. A pulse banishes nearby
  fog-wraiths, but it costs lamp oil.
- A ship caught in your beam is guided toward the harbour. A guided ship
  scores points and earns glow. A ship that strikes the rocks is wrecked;
  a ship that drifts off into the fog is lost.
- **Lose a night** if 3 ships wreck, or if the lamp oil runs out. The beam
  drains oil while it is on; oil refills slowly while the beam is off, and
  much faster between nights — so mind how long you keep the light burning.
- **Win** by surviving all 5 nights. Each night brings more ships, more
  rocks, thicker fog and faster fog-wraiths. Night 5 ends in a storm, and
  dawn brings the victory screen.
- **Between nights**, spend earned glow on one upgrade: a wider beam, a
  cheaper pulse, a bigger oil tank, or faster guiding.

## Controls

| Key | Action |
| --- | --- |
| Mouse move | Aim the beam |
| Mouse click / Space | Pulse the beam (banishes wraiths) |
| ← → or A / D | Rotate the beam |
| P or Esc | Pause / resume |
| M | Mute / unmute sound |
| R | Restart (from game over, victory or pause) |
| Enter / click | Start, confirm |
| 1 / 2 / 3 | Pick an upgrade between nights |

## Screens

Title (with best score) → play with HUD (night, ships guided/lost, oil
gauge, glow, score) → upgrade choice between nights → game over with stats
and restart, or victory at dawn with stats and play again. Best score is
kept in local storage.

Sound is synthesised live with WebAudio (beam hum, pulse chime, ship bell,
wreck thud, ambient waves, a small title motif) — no audio files.

## Deterministic screenshots

The game supports `?shot=<scene>&seed=<n>` for scenes `title`, `play`,
`storm` and `victory`: a seeded generator, a fixed simulated time and no
wall clock, with `window.__shotReady` set once the scene is drawn.
See `shots.json` for the four shots used for this entry.

## Entry

Built for the make.fun best-game-01 bounty. `main.ts` (Node 22, standard
library only) copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.
