# Lantern Tide

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/nemesisbug/lantern-tide/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/nemesisbug/lantern-tide/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

You are the keeper of a lighthouse on a drifting island in a foggy night sea.
Guide lost ships home to the harbour through rocks and fog before dawn.

Entered on [make.fun](https://make.fun/?ref=w642jqgx&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) for the [Make the best game bounty](https://make.fun/bounty/best-game-01) · referral code `w642jqgx`.

## Look

Storm-lit harbour at 2 a.m.: a cold indigo/teal sea under a moon, one warm
amber lamp as the only warm light. Volumetric beam, drifting fog, bobbing
ships, glass HUD panels and a gold pill CTA — modern, not stiff. All motion
derives from world time, so screenshots stay deterministic.

## How to play

Serve the `game/` folder with any static file server and open
`game/index.html` in a desktop browser. The game plays fully offline — no
network requests, no downloads, just keyboard and mouse.

- **Aim the beam** with the mouse, or rotate it finely with the **arrow keys**
  / **A** and **D**. On touch screens, drag to aim and use the on-screen
  ◀ ▶ buttons to rotate, **PULSE** to pulse and **BEAM** to douse the lamp.
- **Click** or press **Space** to pulse the beam. A pulse banishes nearby
  fog-wraiths, but it costs lamp oil. Wraiths closing on the lamp flash a
  warning ring — and while any cling to the lamp, a red ring circles the
  island and the lamp's light dims, so pulse before the beam shortens.
- A ship caught in your beam is guided toward the harbour. A guided ship
  scores points and earns glow. A ship that strikes the rocks is wrecked;
  a ship that drifts off into the fog is lost. Night 1 teaches itself with
  one short hint at a time — aim, guide a ship, pulse, mind the oil.
- **Lose a night** if 3 ships wreck, or if the lamp oil runs out. The beam
  drains oil while it is on; oil refills slowly while the beam is off, and
  much faster between nights — so mind how long you keep the light burning.
  The beam sputters and the gauge flashes LOW OIL when the tank runs low.
- **Win** by surviving all 5 nights. Each night brings more ships, more
  rocks, thicker fog and faster fog-wraiths. Night 5 ends in a storm, and
  dawn brings the victory screen — sun, turning rays and rising sparks.
- **Between nights**, spend earned glow on one upgrade: a wider beam, a
  cheaper pulse, a bigger oil tank, or faster guiding.

## Controls

| Key | Action |
| --- | --- |
| Mouse move / touch drag | Aim the beam |
| Mouse click / Space / PULSE button | Pulse the beam (banishes wraiths) |
| ← → or A / D (or ◀ ▶ buttons) | Rotate the beam |
| B / BEAM button | Douse / light the beam (refills oil) |
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
