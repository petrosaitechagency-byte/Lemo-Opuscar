// timeline.js → timeline.json (for score.py and mix.py), plus the subtitle cues from hud.js
import fs from 'fs';
import * as T from './timeline.js';
const dur = JSON.parse(fs.readFileSync(new URL('./voices/dur.json', import.meta.url)));
const out = {}; for (const [k, v] of Object.entries(T)) if (typeof v !== 'function') out[k] = v;
out.VO_DUR = dur;
fs.writeFileSync(new URL('./timeline.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('timeline.json:', Object.keys(out).length, 'entries');
