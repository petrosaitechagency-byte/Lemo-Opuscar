# Every listed picture hit (timeline.js CUES) against the music grid it should land on. Target: 0 ms.
import json, os, re, sys
TL = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'timeline.json')))
BEAT = 60 / TL['BPM']; BAR = 4 * BEAT
worst = 0
for name, t, where in TL['CUES']:
    m = re.match(r'bar (\d+)(?: beat (\d+))?', where); bar, beat = int(m.group(1)), int(m.group(2) or 1)
    grid = (bar - 1) * BAR + (beat - 1) * BEAT; off = (t - grid) * 1000; worst = max(worst, abs(off))
    print(f'{"OK " if abs(off) < 1 else "OFF"} {name:12s} picture {t:7.3f}s  grid {grid:7.3f}s ({where})  {off:+.1f} ms')
print('worst', round(worst, 1), 'ms'); sys.exit(0 if worst < 1 else 1)
