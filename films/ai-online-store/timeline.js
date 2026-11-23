// One Pair of Hands: the single source of truth for every time in the film (seconds).
// Picture (main.js), subtitles (hud.js), sound events (EV) and the score (score.py, via timeline.json) all read these numbers.
export const DUR = 90.0;
export const BPM = 96, BEAT = 60 / BPM, BAR = 4 * BEAT;          // 0.625 s beat, 2.5 s bar: the film is exactly 36 bars
export const bar = n => (n - 1) * BAR;                            // start of bar n (1-based)
export const beatOf = (n, b) => bar(n) + (b - 1) * BEAT;          // beat b (1-based) of bar n

// Narration: id, start, displayed text (the spoken spelling lives in tts/lines.json). `sub: false` = not burned in (the card shows it).
export const VO = [
  ['L01', 2.0, "It's two in the morning, and Mira's shop is wide awake."],
  ['L02', 6.2, 'She makes mugs by hand, and sells them online.'],
  ['L03', 10.3, 'Which means she also answers every message, writes every listing, counts every mug, and packs every order.'],
  ['L04', 17.8, 'One pair of hands. A hundred little jobs.'],
  ['L05', 25.0, 'So Mira handed the busywork to AI.'],
  ['L06', 30.6, 'Now, when someone asks if the blue mug is dishwasher-safe, the answer is already there. Day or night.'],
  ['L07', 38.9, 'She snaps a photo, adds a few words, and AI drafts the listing for her to check.'],
  ['L08', 46.2, 'It spots which mugs are selling fast, and reminds her to order more clay before she runs out.'],
  ['L09', 53.6, 'Each order sorts itself, labels print, and every customer knows where their parcel is.'],
  ['L10', 64.6, "AI doesn't make the mugs."],
  ['L11', 67.2, 'It gives Mira back the time to make them.'],
  ['L12', 73.5, "It's two in the morning. The shop is still open. And Mira is fast asleep."],
  ['L13', 84.3, 'Petros AI-Tech Agency. Innovate smarter. Create beyond limits.', { sub: false }],
];
// Long lines are shown in parts, cut at a pause between words (times relative to the line's start, from voices/words.json)
// (every part stays up at least 1.8 s)
export const VO_SPLIT = {
  L03: [[0, 'Which means she also answers every message,'], [2.55, 'writes every listing, counts every mug, and packs every order.']],
  L06: [[0, 'Now, when someone asks if the blue mug is dishwasher-safe,'], [3.45, 'the answer is already there. Day or night.']],
  L07: [[0, 'She snaps a photo, adds a few words,'], [2.5, 'and AI drafts the listing for her to check.']],
  L08: [[0, 'It spots which mugs are selling fast,'], [2.6, 'and reminds her to order more clay before she runs out.']],
  L09: [[0, 'Each order sorts itself, labels print,'], [2.55, 'and every customer knows where their parcel is.']],
  L12: [[0, "It's two in the morning. The shop is still open."], [2.9, 'And Mira is fast asleep.']],
};

// Speech bubbles in the paper world: [anchor, t0, t1, text, voice, pass]  (pass: not meant to be read in full: the opening pile-up)
export const BUB = [
  ['phone', 0.25, 8.6, 'Dishwasher safe?', 'cust', false],
  ['phone', 1.05, 8.6, 'Ship to Canada?', 'cust', false],
  ['phone', 1.8, 8.6, "Where's my order??", 'cust', false],
  ['phone2', 32.2, 37.4, 'Is the blue mug dishwasher-safe?', 'cust', false],
  ['phone2r', 34.25, 37.4, "Yes, it's dishwasher safe!", 'ai', false],
  ['phone2', 72.85, 76.6, 'Do you ship to Canada?', 'cust', false],
  ['phone2r', 73.95, 76.6, 'We sure do!', 'ai', false],
];

// Spread 0 (night kitchen) → spread 1 (workshop)
export const RISE = [-20, 27.45];                 // pop-up start per spread
export const FOLD = [26.0, 80.4];                 // fold-down start per spread
export const TURN = [26.35, 28.55];               // the leaf turns by itself
export const CLOSE = [81.4, 83.75];               // the backdrop board swings down; thump on the cut
export const CARD = 83.75;                        // the brand card (bar 34, beat 3)

export const PINGS = [0.25, 1.05, 1.8, 32.15, 72.8];
export const CARDS = [11.14, 12.94, 14.38, 15.74];          // chore cards land on the four verbs of L03
export const SLIPS = [19.25, 19.42, 19.55, 19.7, 19.82, 19.95, 20.1, 20.22];   // "a hundred little jobs"
export const SILENCE = [[21.25, 24.6], [66.25, 67.2]];
export const AI_TAB = { reach: 23.9, pull: 24.6 };           // Mira tugs the tab marked AI: the first sound after the silence
export const TABS = [bar(13), bar(16), bar(19), bar(22)];   // Messages, Listings, Stock, Orders slide out by themselves
export const TAB_NAMES = ['MESSAGES', 'LISTINGS', 'STOCK', 'ORDERS'];
export const FLASH = 39.85, TAG = [41.6, 43.0], STAMP = 43.95;
export const SLATS = 47.6, SLATS_BACK = 52.0, NOTE = 49.8;
export const BELT = 54.0, LABEL = 55.3, PARCELS = [56.2, 57.8];   // launches; more follow every 1.6 s until the night
export const INSERT = 2.1;                        // each tab close-up lasts long enough to read its word
export const PEAK = bar(25);
export const RACK = [67.4, 69.0];
export const NIGHT = [70.0, 72.4];

export const SHOT_CUTS = [0, 5.0, 10.0, 17.5, 23.9, 26.4, 30.0, 32.1, 37.5, 39.6, 45.0, 47.1, 52.5, 54.6, 60.0, 70.0, 72.5, 76.6, 80.0, 83.75];

// Cue list for the checker: every picture hit that should sit on the music grid
export const CUES = [
  ['cut 2', 5.0, 'bar 3'], ['cut 3', 10.0, 'bar 5'], ['cut 4', 17.5, 'bar 8'],
  ['music stops', SILENCE[0][0], 'bar 9 beat 3'],
  ['tab 1', TABS[0], 'bar 13'], ['tab 2', TABS[1], 'bar 16'], ['tab 3', TABS[2], 'bar 19'], ['tab 4', TABS[3], 'bar 22'],
  ['peak', PEAK, 'bar 25'], ['breath', SILENCE[1][0], 'bar 27 beat 3'], ['night', NIGHT[0], 'bar 29'], ['card', CARD, 'bar 34 beat 3'],
];
