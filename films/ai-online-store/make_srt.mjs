// Narration cues (the same ones burned into the picture, plus the spoken sign-off on the card) → out/cues.json for core/render/srt.py
import fs from 'fs';
import { voCues } from './hud.js';
import { VO } from './timeline.js';
const dur = JSON.parse(fs.readFileSync(new URL('./voices/dur.json', import.meta.url)));
const cues = voCues(dur).map(c => ({ t0: +Math.max(0, c.t0 - .1).toFixed(3), t1: +c.t1.toFixed(3), text: c.text }));
for (const [id, t0, text, o = {}] of VO) if (o.sub === false) cues.push({ t0, t1: +(t0 + dur[id] + .4).toFixed(3), text });
cues.sort((a, b) => a.t0 - b.t0);
fs.mkdirSync(new URL('./out/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./out/cues.json', import.meta.url), JSON.stringify(cues, null, 1));
console.log('cues', cues.length);
