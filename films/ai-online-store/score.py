# Original score for "One Pair of Hands" → out/score.wav (48 kHz stereo). 96 bpm, 4/4, 36 bars = 90.0 s.
# Night (bars 1–9) in D minor on music box, pizzicato and woodblock; silence; the page turn; then a groove in F major that adds
# one instrument per pull-tab (claves + pizz bass, ukulele, staccato clarinet, glockenspiel + brushes + shaker); the theme in
# major on clarinet at the peak; a held note for the breath; a music-box lullaby at night; a final chord on the card.
# Instruments: CC0 samples (VSCO 2 CE, VCSL, FreePats) through core/audio/sampler.py, music box modelled by core/audio/pluck.py.
import sys, os, json, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S, pluck as P
from core.audio.sfx import SR, add
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
BEAT = 60 / TL['BPM']; BAR = 4 * BEAT; DUR = TL['DUR']
def b(bar, beat=1.0): return (bar - 1) * BAR + (beat - 1) * BEAT
S.seed(7)
EV = []                                        # sampled notes: (t, inst, pitch, dur, vel, pan, gain)
def n(t, inst, pitch, d, vel, pan=0., gain=1.): EV.append((t, inst, pitch, d, vel, pan, gain))
MB = []                                        # music box notes (modelled): (t, pitch, vel, pan)
def mb(t, pitch, vel=.5, pan=.15): MB.append((t, pitch, vel, pan))

# ---------------- night kitchen, D minor (bars 1–9) ----------------
theme_minor = [  # (bar, beat, pitch, beats)
    (1, 2, 'A4', 1), (1, 3, 'D5', 1), (1, 4, 'F5', 1), (2, 1, 'E5', 2), (2, 3, 'D5', 1), (2, 4, 'C#5', 1),
    (3, 1, 'D5', 1), (3, 2, 'F5', 1), (3, 3, 'Bb5', 2), (4, 1, 'A5', 3),
    (5, 2, 'A4', 1), (5, 3, 'D5', 1), (5, 4, 'F5', 1), (6, 1, 'G5', 1), (6, 2, 'F5', 1), (6, 3, 'E5', 1), (6, 4, 'D5', 1),
    (7, 1, 'D5', 1), (7, 2, 'Bb4', 1), (7, 3, 'G4', 1), (7, 4, 'Bb4', 1), (8, 1, 'A4', 2), (8, 3, 'C#5', 1), (8, 4, 'E5', 1), (9, 1, 'D5', 2),
]
for bar, beat, p, d in theme_minor: mb(b(bar, beat), p, .42 if bar < 5 else .38)
# low clarinet pad from bar 3
for bar, p in [(3, 'F3'), (4, 'E3'), (5, 'F3'), (6, 'F3'), (7, 'G3'), (8, 'E3')]: n(b(bar), 'clarinet', p, BAR * .98, .32, -.2, .55)
n(b(9), 'clarinet', 'F3', BEAT * 2, .32, -.2, .55)
# pizzicato ostinato (bars 5–9), rising chord by chord, louder each bar; woodblock eighths from bar 7
NIGHT_CH = {5: ['D3', 'A3', 'D4', 'A3'], 6: ['D3', 'Bb3', 'D4', 'F4'], 7: ['G3', 'Bb3', 'D4', 'G4'], 8: ['A3', 'C#4', 'E4', 'A4'], 9: ['D3', 'A3', 'D4', 'F4']}
for bar, ch in NIGHT_CH.items():
    for k in range(8):
        t = b(bar) + k * BEAT / 2
        if t >= TL['SILENCE'][0][0] - .01: break
        n(t, 'violas_pizz' if k % 2 else 'cellos_pizz', ch[k % 4], BEAT / 2, .38 + (bar - 5) * .07, (-.25, .25)[k % 2], .8)
        if bar >= 7: n(t, 'woodblock', 'a' if k % 2 else 'b', None, .22 + (bar - 7) * .06, .35, .6)
# a soft bass note on each night bar
for bar, p in [(1, 'D2'), (3, 'Bb1'), (5, 'D2'), (6, 'Bb1'), (7, 'G1'), (8, 'A1'), (9, 'D2')]: n(b(bar), 'contrabass_pizz', p, BEAT * 2, .5, 0, .8)

# ---------------- the turn (bars 10–12) ----------------
F_SCALE = ['F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5']
for i, p in enumerate(F_SCALE): n(TL['TURN'][0] + .1 + i * .07, 'harp', p, 1.2, .42 + i * .012, -.3 + i * .04, .9)
for i, p in enumerate(['C6', 'D6', 'E6', 'F6', 'G6', 'A6', 'Bb6', 'C7']): n(b(12, 3) + i * BEAT / 4, 'glockenspiel', p, .5, .3 + i * .02, .3, .55)

# ---------------- the groove in F major (bars 13–28) ----------------
CH = {'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'C': ['C2', 'G2', 'E3', 'G3', 'C4'], 'Dm': ['D2', 'A2', 'D3', 'F3', 'A3'], 'Bb': ['Bb1', 'F2', 'D3', 'F3', 'Bb3']}
PROG = {13: 'F', 14: 'C', 15: 'Dm', 16: 'Bb', 17: 'F', 18: 'C', 19: 'Dm', 20: 'Bb', 21: 'F', 22: 'C', 23: 'Dm', 24: 'Bb', 25: 'F', 26: 'C', 27: 'Dm'}
UKE = {'F': ['A4', 'C5', 'F5'], 'C': ['G4', 'C5', 'E5'], 'Dm': ['A4', 'D5', 'F5'], 'Bb': ['Bb4', 'D5', 'F5']}
ARP = {'F': ['A4', 'C5', 'F5', 'C5'], 'C': ['G4', 'C5', 'E5', 'C5'], 'Dm': ['A4', 'D5', 'F5', 'D5'], 'Bb': ['Bb4', 'D5', 'F5', 'D5']}
GLK = {'F': ['A6', 'F6'], 'C': ['G6', 'E6'], 'Dm': ['A6', 'F6'], 'Bb': ['Bb6', 'F6']}
END = TL['SILENCE'][1][0]                       # the groove stops on beat 3 of bar 27 (the breath)
for bar, c in PROG.items():
    lay = 1 + (bar >= 16) + (bar >= 19) + (bar >= 22)        # one layer more per tab
    for k in range(8):                                        # claves: the mechanism's clicks on every eighth
        t = b(bar) + k * BEAT / 2
        if t >= END: break
        n(t, 'claves', None, None, .2 + (k % 2 == 0) * .08, .25, .5)
        if lay >= 3: n(t, 'clarinet_stac', ARP[c][k % 4], BEAT / 2 * .8, .3, -.25, .55)
        if lay >= 4: n(t, 'shaker', 'down' if k % 2 else 'up', None, .18, .4, .45)
    for beat in (1, 3):                                       # pizzicato bass: root, then fifth
        t = b(bar, beat)
        if t < END: n(t, 'contrabass_pizz', CH[c][0] if beat == 1 else CH[c][1], BEAT, .55, -.05, .9)
    for beat in (1.5, 2.5, 3.5, 4.5):                         # ukulele on the off-beats
        t = b(bar, beat)
        if lay >= 2 and t < END: n(t, 'ukulele', UKE[c][0], .3, .32, .2, .7); n(t + .012, 'ukulele', UKE[c][1], .3, .3, .2, .7); n(t + .024, 'ukulele', UKE[c][2], .3, .28, .2, .7)
    if lay >= 4:
        for beat in (2, 4):
            t = b(bar, beat)
            if t < END: n(t, 'snare2', 'taps', None, .25, -.1, .5)
        for i, beat in enumerate((1, 3)):
            t = b(bar, beat)
            if t < END: n(t, 'glockenspiel', GLK[c][i], .6, .26, .35, .5)
# the theme in major on legato clarinet at the peak (bars 25–27, until the breath)
for bar, beat, p, d in [(25, 2, 'C5', 1), (25, 3, 'F5', 1), (25, 4, 'A5', 1), (26, 1, 'G5', 2), (26, 3, 'F5', 1), (26, 4, 'E5', 1), (27, 1, 'F5', 2)]:
    n(b(bar, beat), 'clarinet', p, BEAT * d * .95, .42, -.15, .75)
# the breath: one held note under "It gives Mira back the time to make them", a soft harp chord on the line
n(END, 'clarinet', 'A4', 3.4, .16, -.1, .38)
for i, p in enumerate(['F3', 'C4', 'F4', 'A4']): n(TL['VO'][10][1] + i * .06, 'harp', p, 2.5, .3, .1, .7)
# the wheel's warm settle into night: bar 28 harp
for i, p in enumerate(['Bb2', 'F3', 'D4', 'F4']): n(b(28, 3) + i * .09, 'harp', p, 2.0, .28, 0, .6)

# ---------------- night again: the lullaby (bars 29–32) and the close (33–34) ----------------
theme_major = [(29, 2, 'C5', 1), (29, 3, 'F5', 1), (29, 4, 'A5', 1), (30, 1, 'G5', 2), (30, 3, 'F5', 1), (30, 4, 'E5', 1),
               (31, 1, 'D5', 1), (31, 2, 'F5', 1), (31, 3, 'Bb5', 2), (32, 1, 'A5', 3), (33, 2, 'C5', 1), (33, 3, 'F5', 1), (33, 4, 'A5', 1), (34, 1, 'G5', 2)]
for bar, beat, p, d in theme_major: mb(b(bar, beat), p, .4)
LUL = {29: ['F2', 'C3', 'A3', 'C4'], 30: ['D2', 'A2', 'F3', 'A3'], 31: ['Bb1', 'F2', 'D3', 'F3'], 32: ['C2', 'G2', 'E3', 'G3'], 33: ['F2', 'C3', 'A3', 'C4'], 34: ['Bb1', 'F2', 'D3', 'F3']}
for bar, ch in LUL.items():
    for i, p in enumerate(ch):
        t = b(bar) + i * BEAT
        if t < TL['CARD'] - .05: n(t, 'harp', p, 1.6, .3, -.15 + i * .1, .7)
for bar, p in [(29, 'F3'), (30, 'F3'), (31, 'F3'), (32, 'E3'), (33, 'F3')]: n(b(bar), 'clarinet', p, BAR * .97, .26, -.2, .45)

# ---------------- the card: a final F major chord, left to ring ----------------
C0 = TL['CARD']
for i, p in enumerate(['F2', 'C3', 'F3', 'A3', 'C4', 'F4', 'A4']): n(C0 + i * .025, 'harp', p, 4.5, .45, -.3 + i * .1, .9)
n(C0, 'contrabass_pizz', 'F1', 2, .5, 0, .8); n(C0, 'cellos_pizz', 'F2', 2, .45, -.1, .7)
n(C0 + .02, 'clarinet', 'A4', 3.0, .3, -.1, .6); n(C0 + .02, 'clarinet', 'C5', 3.0, .26, .1, .5)
n(C0, 'glockenspiel', 'F6', 2, .3, .3, .6); n(C0 + .2, 'glockenspiel', 'A6', 2, .24, .35, .5)
mb(b(35, 1), 'C6', .35); mb(b(35, 3), 'F6', .3); mb(b(36, 1), 'A5', .28)

# ---------------- render ----------------
mix = S.render(EV, dur=DUR, master=False)
for t, p, vel, pan in MB:
    x = P.pluck('music_box', p, None, vel)
    add(mix, x, t, .55, pan)
mix = S.room(mix, size=.38, mix=.2)
# the two silences are real silences: the music stops on the grid with a short fade
Tt = np.arange(len(mix)) / SR
a, z = TL['SILENCE'][0]
g = np.ones(len(mix)); m = (Tt >= a) & (Tt < z); g[m] = np.clip(1 - (Tt[m] - a) / .12, 0, 1)
mix *= g[:, None]
fade = np.clip((DUR - Tt) / .6, 0, 1); mix *= fade[:, None]
pk = np.abs(mix).max(); mix = mix / pk * .8
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'score.wav'), mix.astype(np.float32), SR)
print('score.wav', round(len(mix) / SR, 2), 's, notes', len(EV), '+ music box', len(MB))
names = sorted({e[1] for e in EV})
open(os.path.join(HERE, 'out', 'score_instruments.txt'), 'w').write('\n'.join(names + ['music_box (pluck.py, modelled)']) + '\n')
