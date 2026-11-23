# Mix for "One Pair of Hands": narration + original score + paper foley from the picture's events + ambience → out/mix.wav (48 kHz)
# Inputs: out/score.wav (score.py), voices/*.wav + voices/dur.json (tts), events.json (core/render/events.mjs), timeline.json.
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly, fftconvolve
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, LIB)
from core.audio.sfx import compress
SR = 48000
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); DUR = TL['DUR']; N = int(DUR * SR)
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
rng = np.random.default_rng(11)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(n): return rng.standard_normal(n)
def ex(t, a, r): return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
def norm(x, p=1.): m = np.abs(x).max(); return x * p / m if m > 0 else x
def S_(*xs):   # sum sounds of different lengths (zero-padded to the longest)
    L = max(len(x) for x in xs); return sum(np.pad(x, (0, L - len(x))) for x in xs)
def at(x, d): return np.pad(x, (int(d * SR), 0))   # delay a sound by d seconds
def st(x, pan=0.):
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)
def put(buf, t, x, g=1.):
    i = int(t * SR); j = min(len(buf), i + len(x))
    if j > i >= 0: buf[i:j] += x[:j - i] * g
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
IRn = int(1.2 * SR); IR = np.stack([noise(IRn), noise(IRn)], 1) * np.exp(-np.arange(IRn) / SR * 5)[:, None]
IR = np.stack([lp(IR[:, 0], 5000), lp(IR[:, 1], 5000)], 1); IR /= np.sqrt((IR ** 2).sum(0))
def verb(x2, wet=.2):
    y = np.stack([fftconvolve(x2[:, 0], IR[:, 0])[:len(x2)], fftconvolve(x2[:, 1], IR[:, 1])[:len(x2)]], 1)
    return x2 * (1 - wet) + y * wet

# ---------- the paper foley palette ----------
def bell(f, d=.6, bright=1.):
    t = tt(d); return sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (5 + k * 3)) / k ** (1.6 / bright) for k in (1, 2, 3, 4.2)) * ex(t, .002, d)
def crinkle(d, dens=180, lo=1800, hi=9000):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(int(dens * d)):
        i = rng.integers(0, max(1, n - 400)); L = int(rng.integers(40, 300)); x[i:i + L] += noise(L)[:len(x[i:i + L])] * np.exp(-np.arange(len(x[i:i + L])) / (L / 4)) * rng.uniform(.3, 1)
    return bp(x, lo, hi)
def tap(f=900, d=.12):
    t = tt(d); return bp(noise(len(t)), f * .6, min(f * 2.2, 20000)) * ex(t, .001, .018) + np.sin(2 * np.pi * f * .35 * t) * ex(t, .001, .03) * .6
def thump(f=70, d=.6):
    t = tt(d); return np.sin(2 * np.pi * f * t) * ex(t, .003, .11) + lp(noise(len(t)), 600) * ex(t, .002, .05) * .5
def swish(d, f0=500, f1=3500):
    t = tt(d); n = len(t); x = noise(n); y = np.zeros(n); B = 8
    for k in range(B):
        a, b = k * n // B, (k + 1) * n // B; fc = f0 + (f1 - f0) * (k + .5) / B
        y[a:b] = bp(x, fc * .6, min(fc * 1.6, 20000))[a:b]
    return y * np.sin(np.pi * t / t[-1]) ** 1.5
def popsnd(f=700):
    t = tt(.16); ph = np.cumsum(f * (1 - .55 * t / .16)) / SR
    return np.sin(2 * np.pi * ph) * ex(t, .001, .04) + bp(noise(len(t)), 1200, 5000) * ex(t, .004, .025) * .5
def blip(f, d=.055, tri=False):
    t = tt(d); ph = 2 * np.pi * f * t
    x = (2 / np.pi * np.arcsin(np.sin(ph))) if tri else (np.sign(np.sin(ph)) * .5 + np.sin(ph) * .5)
    return lp(x, 4500) * ex(t, .003, d * .5)
def creak(d=.6):
    t = tt(d); rate = 30 + 50 * (t / d); clk = (np.sin(2 * np.pi * np.cumsum(rate) / SR) > .97).astype(float)
    return bp(clk + noise(len(t)) * .04, 250, 900, 3) * np.sin(np.pi * t / d) ** .6
def clack():
    t = tt(.09); return bp(noise(len(t)), 900, 4000) * ex(t, .0008, .012) + np.sin(2 * np.pi * 380 * t) * ex(t, .001, .02) * .5


sfx = np.zeros((N, 2)); amb = np.zeros((N, 2))
G = dict(ping=.5, bubble=.35, blip=.55, card=.9, slip=.45, creak=.5, tabclick=1.0, foldall=.6, page=1.2, pop=.45, tab=.9, gear=.08, shutter=.8,
         write=.08, stamp=.9, slats=.8, note=.5, belt=.12, label=.5, launch=.45, ding=.3, wheel=.15, clay=.35, disc=.4, purr=.35, close=.9, thump=1.0, beltstart=.4)
for e in EV:
    t, ty = e['t'], e['type']; g = G.get(ty, .5)
    if ty == 'ping':
        x = S_(np.concatenate([bell(1318.5, .18, 1.4)[:int(.09 * SR)], bell(1975.5, .5, 1.4)]) * .5, crinkle(.08, 300) * .05)
        put(sfx, t, verb(st(x, .15), .25), g)
    elif ty == 'bubble': put(sfx, t, st(S_(popsnd(rng.uniform(900, 1300)) * .5, crinkle(.1, 200) * .08), .1), g)
    elif ty == 'blip':
        ai = e.get('who') == 'ai'; f = rng.choice([660, 740, 784, 880]) if ai else rng.choice([988, 1109, 1175, 1319])
        put(sfx, t, st(blip(f, .05, tri=ai), .2), g * (.8 if ai else 1))
    elif ty == 'card': put(sfx, t, verb(st(S_(thump(130, .3) * .6, tap(700) * .7, crinkle(.15, 260) * .3), .45), .15), g)
    elif ty == 'slip': put(sfx, t, st(S_(crinkle(.12, 300, 2500, 10000) * .5, tap(1400, .08) * .4), rng.uniform(.3, .6)), g)
    elif ty == 'creak': put(sfx, t, verb(st(norm(creak(.7), .4), .45), .25), g)
    elif ty == 'tabclick': put(sfx, t, st(S_(swish(.16, 1500, 5000) * .5, at(clack() * 1.4, .12)), -.15), g)
    elif ty == 'tab': put(sfx, t, st(S_(swish(.2, 1200, 5000) * .5, at(clack() * 1.2, .16)), 0), g)
    elif ty == 'foldall':
        for k in range(10): put(sfx, t + k * e['d'] / 10, st(crinkle(.09, 500, 2500, 10000) * ex(tt(.09), .002, .03), rng.uniform(-.4, .4)), g * .5)
    elif ty == 'page':
        d = e['d']; x = S_(swish(d, 400, 2600) * .4, crinkle(d, 60)[:len(tt(d))] * .15 * np.sin(np.pi * tt(d) / d)[:len(crinkle(d, 60))])
        put(sfx, t, verb(st(x, 0), .25), g); put(sfx, t, st(norm(creak(.8), .25), -.2), g * .5)
    elif ty == 'pop': put(sfx, t + rng.uniform(-.02, .02), st(S_(popsnd(rng.uniform(500, 1100)) * .5, crinkle(.12, 200) * .06), rng.uniform(-.5, .5)), g)
    elif ty == 'gear': put(sfx, t, st(tap(2200, .05) * .5, -.3), g)
    elif ty == 'shutter':
        put(sfx, t, st(clack() * 1.2, -.2), g); put(sfx, t + .07, st(clack() * .9, -.2), g)
        put(sfx, t + .02, st(bp(noise(int(.25 * SR)), 2000, 7000) * ex(tt(.25), .01, .06) * .3, -.2), g)
    elif ty == 'write':   # the pencil scratch starts once the word "drafts" has been said (it masked the word)
        t, d = t + .8, e['d'] - .8; tq = tt(d); sc = bp(noise(len(tq)), 4500, 9500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * tq + np.sin(2 * np.pi * 1.3 * tq) * 2)))   # high and soft: it plays under the word "drafts"
        put(sfx, t, st(sc * np.sin(np.pi * tq / d) ** .3, -.35), g)
    elif ty == 'stamp': put(sfx, t, verb(st(S_(thump(95, .4) * .9, tap(600, .1) * .8), -.3), .12), g)
    elif ty == 'slats':
        for k in range(3): put(sfx, t + k * .085, st(clack() * (1 - k * .15), -.3), g)
    elif ty == 'note':
        put(sfx, t + .25, st(bell(2637, .5, 1.6) * .4, -.25), g); put(sfx, t, st(crinkle(.3, 120, 2000, 8000) * .3, -.25), g)
    elif ty == 'belt':
        d = e['d']; tq = tt(d); r = lp(noise(len(tq)), 300) * .6 + bp(noise(len(tq)), 1500, 4000) * .15 * (np.sin(2 * np.pi * 9.6 * tq) > .7)
        put(sfx, t, st(r * np.minimum(1, tq / .4) * np.minimum(1, (d - tq) / .6), .45), g)
    elif ty == 'beltstart': put(sfx, t, st(S_(thump(110, .25) * .5, clack() * .6), .45), g)
    elif ty == 'label':
        tq = tt(.22); z = np.sign(np.sin(2 * np.pi * np.cumsum(900 + 500 * tq / .22) / SR)) * .3
        put(sfx, t, st(S_(bp(z, 600, 5000) * np.sin(np.pi * tq / .22), crinkle(.22, 200) * .1), .5), g)
    elif ty == 'launch':
        x = swish(.5, 600, 3000); put(sfx, t, np.stack([x * np.linspace(1.2, .5, len(x)), x * np.linspace(.5, 1.2, len(x))], 1) * .5, g)
    elif ty == 'ding': put(sfx, t, verb(st(bell(rng.choice([2093, 2349.3, 2637]), .5, 1.2) * .4, rng.uniform(-.3, .3)), .35), g)
    elif ty == 'wheel':
        d = e['d']; tq = tt(d)
        hum = np.sin(2 * np.pi * 50 * tq) * .5 + np.sin(2 * np.pi * 100 * tq) * .3 + np.sin(2 * np.pi * 150 * tq) * .12
        whirr = bp(noise(len(tq)), 300, 1200) * (1 + .3 * np.sin(2 * np.pi * 2.1 * tq)) * .25
        put(amb, t, st((hum + whirr) * np.minimum(1, tq / 1.2) * np.minimum(1, (d - tq) / .8), .3), g)
    elif ty == 'clay':
        tq = tt(.35); put(sfx, t, st(lp(noise(len(tq)), 900) * ex(tq, .03, .1) * .6, .3), g)
    elif ty == 'disc':
        d = e['d']; tq = tt(d); x = bp(noise(len(tq)), 200, 1500) * (.6 + .4 * np.sin(2 * np.pi * 6 * tq)) * np.sin(np.pi * tq / d) ** .5
        put(sfx, t, verb(st(x * .5, 0), .3), g)
    elif ty == 'crickets':
        d = e['d']; c = np.zeros(int(d * SR))
        for k in range(int(d * 2.2)):
            t0 = rng.uniform(0, d - .4); f = rng.uniform(4200, 4900)
            for j in range(rng.integers(3, 6)):
                tq = tt(.03); i = int((t0 + j * .045) * SR); seg = np.sin(2 * np.pi * f * tq) * np.sin(np.pi * tq / .03)
                c[i:i + len(seg)] += seg[:len(c[i:i + len(seg)])]
        env = np.minimum(1, tt(d) / 1.5) * np.minimum(1, (d - tt(d)) / 1.0)
        put(amb, t, st(c * env * .05, rng.uniform(-.4, .4)), 1)
    elif ty == 'purr':
        d = e['d']; tq = tt(d); x = lp(noise(len(tq)), 180) * (.5 + .5 * np.sin(2 * np.pi * 24 * tq)) * np.sin(np.pi * tq / d) ** .5
        put(amb, t, st(x * .6, -.4), g)
    elif ty == 'close':
        d = e['d']; tq = tt(d); x = swish(d, 200, 1400) * (tq / d) ** 1.5 * .6
        put(sfx, t, verb(st(x, 0), .3), g); put(sfx, t, st(norm(creak(1.0), .3), 0), g * .6)
    elif ty == 'thump':
        x = S_(thump(62, 1.2), lp(noise(len(tt(1.2))), 900) * ex(tt(1.2), .004, .12) * .5)
        put(sfx, t, verb(st(norm(x, .9), 0), .1), g)   # dry: its tail must not cover the sign-off

# ---------- ambience beds ----------
Tt = np.arange(N) / SR
def bed(lo, hi, lvl): return st(bp(noise(N), lo, hi) * lvl, 0)
room = st(lp(noise(N), 400) * .012, 0); room[Tt >= TL['CARD']] *= np.clip(1 - (Tt[Tt >= TL['CARD']] - TL['CARD']) / .5, 0, 1)[:, None]
amb += room
# the paper clock: ticks at night (louder in the first silence), none in the day
for k in range(int(DUR)):
    t = k + .5
    on = (t < TL['TURN'][0]) or (TL['NIGHT'][1] < t < TL['CARD'])
    if on: put(amb, t, st(tap(3000, .05) * (.12 if TL['SILENCE'][0][0] < t < TL['SILENCE'][0][1] else .05), -.5), 1)
# faint crickets through the night-kitchen window
cr = np.zeros(N)
for k in range(60):
    t0 = rng.uniform(0, TL['TURN'][0] - .5); f = rng.uniform(4300, 4800)
    for j in range(rng.integers(3, 6)):
        tq = tt(.03); i = int((t0 + j * .045) * SR); s2 = np.sin(2 * np.pi * f * tq) * np.sin(np.pi * tq / .03); cr[i:i + len(s2)] += s2[:len(cr[i:i + len(s2)])]
amb += st(cr * .018, .3)
# the workshop by day: soft street hush through the window and a few birds
day = (Tt > TL['TURN'][1] - .5) & (Tt < TL['NIGHT'][0] + .8)
hush = lp(noise(N), 700) * .02 * np.clip(np.minimum((Tt - (TL['TURN'][1] - .5)) / 1.5, (TL['NIGHT'][0] + .8 - Tt) / 1.5), 0, 1)
amb += st(hush, -.1)
for k in range(14):
    t0 = rng.uniform(TL['TURN'][1] + 1, TL['NIGHT'][0] - 2); f = rng.uniform(2800, 4200)
    for j in range(rng.integers(2, 4)):
        tq = tt(.09); ch = np.sin(2 * np.pi * np.cumsum(f * (1 + .25 * np.sin(np.pi * tq / .09))) / SR) * np.sin(np.pi * tq / .09) ** 2
        put(amb, t0 + j * .13, st(ch * .02, rng.uniform(-.6, .6)), 1)

# ---------- narration ----------
voice = np.zeros((N, 2))
for vid, t0, text, *rest in TL['VO']:
    x, sr = sf.read(os.path.join(HERE, 'voices', f'{vid}.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR: x = resample_poly(x, SR, sr)
    x = hp(x, 90); x = compress(x.astype(np.float64), thr=.2, ratio=3.0)
    put(voice, t0, st(x, 0), 1)
vr = voice[:, 0] ** 2 + voice[:, 1] ** 2
vrms = rms_db(voice[np.sqrt(vr) > 1e-4]) if (vr > 0).any() else -60
voice *= 10 ** ((-19 - vrms) / 20)                 # speech sits around −19 dBFS RMS
voice = verb(voice, .06)

# ---------- music, ducked under the voice ----------
music, msr = sf.read(os.path.join(HERE, 'out', 'score.wav'))
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
music = music[:N]
act = (np.abs(voice).max(1) > .01).astype(float)
from scipy.ndimage import uniform_filter1d
act = uniform_filter1d(uniform_filter1d(act, int(.3 * SR)), int(.3 * SR))   # smooth the speech envelope (≈ 300 ms attack/release)
music *= (1 - .6 * np.clip(act * 1.6, 0, 1))[:, None]   # about −8 dB under speech
mrms = rms_db(music[np.abs(music).max(1) > 1e-4])
music *= 10 ** ((-27 - mrms) / 20)                  # ducked passages land ≈ 10–12 dB under the voice

# ---------- sum, limit ----------
sfx = np.stack([sfx[:, 0], sfx[:, 1]], 1)
duck = (1 - .35 * np.clip(act * 1.6, 0, 1))[:, None]          # foley and beds step back under the words
mix = voice + music + sfx * .5 * duck + amb * .8 * duck
for c in range(2):
    m = mix[:, c]; over = np.abs(m) > .95; m[over] = np.sign(m[over]) * (.95 + np.tanh((np.abs(m[over]) - .95) * 5) * .04)
mix = mix / max(1e-9, np.abs(mix).max()) * .89
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix.wav', round(len(mix) / SR, 2), 's · voice', round(rms_db(voice[np.abs(voice).max(1) > .01]), 1), 'dB · music', round(rms_db(music[np.abs(music).max(1) > 1e-4]), 1),
      'dB · sfx peak', round(float(np.abs(sfx * .5).max()), 2), '· events', len(EV))
