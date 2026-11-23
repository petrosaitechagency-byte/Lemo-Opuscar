# One Pair of Hands

A 90-second vertical film (1080×1920, 30 fps, English) about how AI helps a small online store, made entirely in code in the
Lemo-Opuscar Paper Pop-up Book style: Mira makes mugs by hand and sells them online; at 2 a.m. she is buried in small jobs,
pulls a paper tab marked AI, and the pop-up book's tabs start pulling themselves (messages, listings, stock, orders) until the
shop runs on its own and she is back at her wheel. Closing card: Petros AI-Tech Agency.

- `TREATMENT.md`: structures considered, shot list, beat sheet, cue map, sound design, and what changed while producing.
- `timeline.js`: every time in the film; `main.js` the scene, camera and choreography; `art.js` all the paper drawings;
  `sets.js` the two spreads; `actors.js` live cards; `hud.js` subtitles, bubbles and the brand card.
- `score.py` the original score, `mix.py` the mix, `cuecheck.py` picture cues against the music grid.
- `build.sh` rebuilds everything (narration, checks, score, mix, picture, master, subtitles, poster).
- `CREDITS` lists every third-party asset and its licence; `LICENSE` covers the engine files adapted from the library.

Not in this repository: the client's logo file. Put `petros_lockup_dark.svg` (from the client's brand folder,
Logo Pack › Svg) in `brand/` before building. The rendered film is delivered separately.
