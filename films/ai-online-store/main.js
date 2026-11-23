// "One Pair of Hands": scene, choreography, camera, lights, sound events and render(t). All times come from timeline.js.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { clamp, lerp, seg, ss, eio, eo, ei, back, spring, TAU, mulberry, track } from './lib.js';
import * as A from './art.js';
import { C } from './art.js';
import { cv } from './paper.js';
import { makeBook, coverCanvases, texOf, BW, BD, PG } from './book.js';
import { pages, buildSets, updatePops, riseOf, setPagesCache } from './sets.js';
import { makeMira, makeCat, makeTag, makeClay, makeBelt } from './actors.js';
import { cutMesh, particles } from './cutmesh.js';
import { makePost } from './post.js';
import * as T from './timeline.js';
import * as HUD from './hud.js';

const W = HUD.W, H = HUD.H;
const NOSUBS = new URLSearchParams(location.search).has('nosubs');   // for the poster frame only
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), OX = ov.getContext('2d');
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(36, W / H, .004, 30);
const post = makePost(renderer, scene, cam, W, H);

// ---------- assets ----------
await Promise.all(['600 52px Fredoka', '700 40px Fredoka', '500 40px Fredoka', '40px "Lilita One"', 'italic 40px "IM Fell English"', '600 62px Sora', '600 27px "DM Sans"'].map(f => document.fonts.load(f, 'Aa')));
await HUD.loadLogo('brand/petros_lockup_dark.svg');
const DURS = await (await fetch('voices/dur.json')).json();
const hdr = await new RGBELoader().loadAsync('/core/assets/polyhaven/lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
// image-based light only on the real objects (the mug, the desk): on matte paper it costs a lot in software rendering and adds little
scene.background = hdr; scene.backgroundBlurriness = 0; scene.backgroundRotation.set(0, .9, 0);
const envTex = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
const tl = new THREE.TextureLoader();
const wt = n => { const t = tl.load(`/core/assets/polyhaven/walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 8; return t; };
const wdiff = wt('diff'); wdiff.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wdiff, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#c49f80', envMap: envTex, envMapIntensity: .5 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);

// ---------- the real mug on the desk (procedural stoneware, speckled glaze, raw foot) ----------
const realMug = (() => {
  const g = new THREE.Group(), R0 = .041, Hm = .094, th = .0042;
  const pts = [[0, 0], [R0 * .78, 0], [R0 * .9, .002], [R0 * .96, .008], [R0, .02], [R0 * 1.02, Hm * .55], [R0 * .99, Hm - .002], [R0 * .99 - th * .5, Hm], [R0 * .99 - th, Hm - .002], [R0 * .99 - th, Hm * .5], [R0 * .96 - th, .012], [R0 * .7, .008], [0, .008]].map(p => new THREE.Vector2(p[0], p[1]));
  const c = cv(1024, 512), x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#9cc9e8'); gr.addColorStop(.7, '#78b0d8'); gr.addColorStop(.86, '#6aa2cc'); gr.addColorStop(.9, '#c8946e'); gr.addColorStop(1, '#b88360');
  x.fillStyle = gr; x.fillRect(0, 0, 1024, 512);
  const R = mulberry(5); for (let i = 0; i < 2600; i++) { const py = R() * 440; x.fillStyle = R() < .8 ? `rgba(40,70,110,${.4 + R() * .5})` : `rgba(140,90,60,${.5})`; x.beginPath(); x.arc(R() * 1024, py, .6 + R() * 2.2, 0, TAU); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 40; i++) x.fillRect(0, 60 + i * 9 + R() * 4, 1024, 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping;
  // lathe v runs along the profile: flip the texture so the foot (end of the gradient) sits at the bottom
  tex.repeat.set(1, -1); tex.offset.set(0, 1);
  const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: .32, clearcoat: .7, clearcoatRoughness: .25, side: THREE.DoubleSide, envMap: envTex, envMapIntensity: .9 });
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat); body.castShadow = body.receiveShadow = true; g.add(body);
  const hcurve = new THREE.CatmullRomCurve3([new THREE.Vector3(R0 * .96, Hm * .78, 0), new THREE.Vector3(R0 + .024, Hm * .74, 0), new THREE.Vector3(R0 + .03, Hm * .5, 0), new THREE.Vector3(R0 + .022, Hm * .28, 0), new THREE.Vector3(R0 * .98, Hm * .24, 0)]);
  const hmat = new THREE.MeshPhysicalMaterial({ color: '#7fb3da', roughness: .3, clearcoat: .7, envMap: envTex, envMapIntensity: .9 });
  const handle = new THREE.Mesh(new THREE.TubeGeometry(hcurve, 40, .0052, 14), hmat); handle.castShadow = true; g.add(handle);
  g.position.set(.205, 0, .108); g.rotation.y = 2.5; scene.add(g); return g;
})();

// ---------- the book ----------
const book = makeBook(coverCanvases()); scene.add(book.root);
const P = pages(); setPagesCache(P);
const PT = {}; for (const k of ['sky0', 'ground0', 'sky1', 'ground1']) PT[k] = texOf(P[k]);
const SPREAD = [{ sky: PT.sky0, ground: PT.ground0 }, { sky: PT.sky1, ground: PT.ground1 }];
const { L: POPS, ex: EX } = buildSets(book);
const S = book.stage;

// characters and live cards
const mira = makeMira(); S.add(mira.root, mira.shadow);
const cat = makeCat(); S.add(cat.root);
const tag = makeTag(); tag.root.position.set(-.087, .02, .1495); S.add(tag.root);
const clay = makeClay(.0118); clay.root.position.set(.07, .0132, .2072); S.add(clay.root);
const belt = makeBelt(.084); belt.root.position.set(0, 0, 0); EX.beltG.add(belt.root);
// the chore tower: a group on the floor right of the table; cards stack inside it
const tower = new THREE.Group(); tower.position.set(.077, 0, .186); S.add(tower);
const STACK = [];   // {g, y, x, rz, t (landing time), kind}
{
  let y = 0; const R = mulberry(4);
  const push = (g, h, tland, kind) => { tower.add(g); STACK.push({ g, y, x: (R() - .5) * .006, rz: (R() - .5) * .14, t: tland, kind }); y += h; };
  // three slips already there, then the four chore cards on the verbs, then the flurry
  for (let i = 0; i < 3; i++) push(EX.slips[i], .0072, -1, 'slip');
  for (let i = 0; i < 4; i++) push(EX.chores[i], .0128, T.CARDS[i], 'card');
  for (let i = 3; i < 8; i++) push(EX.slips[i], .0062, T.SLIPS[i - 3] ?? T.SLIPS[7], 'slip');
}

// ---------- lights ----------
const spot = new THREE.SpotLight('#ffe2bd', 0, 3, .62, .6, 2);
spot.position.set(-.3, .44, .46); spot.target.position.set(.0, .05, .14);
spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.00008; spot.shadow.normalBias = .0005; spot.shadow.radius = 5; spot.shadow.camera.near = .1; spot.shadow.camera.far = 1.6;
scene.add(spot, spot.target);
const sun = new THREE.DirectionalLight('#fff3e0', 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0001; sun.shadow.normalBias = .0004; sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, { left: -.22, right: .22, top: .3, bottom: -.12, near: .1, far: 2 }); sun.position.set(-.3, .5, .8); sun.target.position.set(0, .06, .12); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#cfdcff', '#b48a66', 0); scene.add(hemi);
const lampPt = new THREE.PointLight('#ffc77a', 0, .22, 2); lampPt.position.set(.052, .046 + PG, .172); scene.add(lampPt);
const phoneGlow = new THREE.PointLight('#bfe4ff', 0, .08, 2); scene.add(phoneGlow);

// ---------- particles: paper puffs, the photo flash ----------
function spriteTex(fn, n = 128) { const c = cv(n, n), x = c.getContext('2d'); fn(x, n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const puffTex = spriteTex((x, n) => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, px = n / 2 + Math.cos(a) * n * .15, py = n / 2 + Math.sin(a) * n * .15, g = x.createRadialGradient(px, py, 0, px, py, n * .3); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); } });
const flashTex = spriteTex((x, n) => { const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,240,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); for (let i = 0; i < 8; i++) { x.save(); x.translate(n / 2, n / 2); x.rotate(i / 8 * TAU); x.fillStyle = 'rgba(255,255,255,.8)'; x.fillRect(-1.5, 0, 3, n * .48); x.restore(); } });
const quad = new THREE.PlaneGeometry(1, 1);
const camQ = new THREE.Quaternion();
const billboard = fn => (i, t) => { const p = fn(i, t); if (p) { const e = new THREE.Euler().setFromQuaternion(camQ); p.rx = e.x; p.ry = e.y; p.rz = e.z; } return p; };
const PS = [];
const puffMat = new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, color: '#fffaf0' });
const PUFFS = [];   // [t, x, y, z, size] in stage coordinates
const puffs = particles(quad, puffMat, 40 * 6, billboard((i, t) => {
  const P0 = PUFFS[(i / 6) | 0]; if (!P0) return null; const j = i % 6, k = (t - P0[0]) / .5; if (k < 0 || k > 1) return null;
  const a = j / 6 * TAU, r = .008 * P0[4] * eo(k);
  return { x: P0[1] + Math.cos(a) * r, y: P0[2] + .002 * P0[4] + Math.abs(Math.sin(a)) * r * .5, z: P0[3] + Math.sin(a) * r * .3, s: .008 * P0[4] * (.6 + k) * (1 - k * k) };
}));
S.add(puffs); PS.push(puffs);
const flash = new THREE.Mesh(quad, new THREE.MeshBasicMaterial({ map: flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(2, 2, 1.9) }));
flash.visible = false; S.add(flash);

// ---------- helpers ----------
const blinkAt = (t, o = 0) => { const p = (t + o) % 3.7; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; };
const mixArm = (a, b, k) => ({ e: [lerp(a.e[0], b.e[0], k), lerp(a.e[1], b.e[1], k)], h: [lerp(a.h[0], b.h[0], k), lerp(a.h[1], b.h[1], k)] });
const mir = a => ({ e: [-a.e[0], a.e[1]], h: [-a.h[0], a.h[1]] });
const ARM = {
  rest: { e: [-16, 182], h: [-20, 340] }, hipsF: { e: [-40, 170], h: [60, 300] }, phone: { e: [-70, 150], h: [70, -30] },
  stampUp: { e: [-120, 60], h: [-152, 104] }, stampDn: { e: [-120, 92], h: [-152, 160] }, cheer: { e: [-90, -60], h: [-110, -220] },
  headHand: { e: [-40, 228], h: [28, -150] }, onTable: { e: [-40, 210], h: [60, 228] }, palms: { e: [-50, 170], h: [60, 120] },
  reach: { e: [-160, 90], h: [-315, 100] }, tug: { e: [-150, 96], h: [-296, 104] }, wheel: { e: [-40, 150], h: [35, 260] }, lap: { e: [-20, 160], h: [70, 250] },
};
const walkArms = s => ({ L: { e: [-14 + 30 * s, 182], h: [-18 + 70 * s, 336] }, R: { e: [14 + 30 * s, 182], h: [18 + 70 * s, 336] } });
function walk(t, t0, t1, a, b) {
  const k = seg(t, t0, t1), x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k), dist = Math.hypot(b[0] - a[0], b[1] - a[1]) * k;
  return { x, z, ph: dist / .0075 * Math.PI, moving: t > t0 && t < t1 };
}
const recK = (rec, t) => rec ? riseOf(rec, t) : 1;
const foldRot = (rec, t) => { const k = recK(rec, t); return { k, rx: rec.dir * Math.PI / 2 * (1 - k) }; };

// ---------- Mira ----------
const TAB_X = i => -.0975 + i * .065;
function miraState(t) {
  const S0 = { vis: true, x: 0, y: 0, z: .152, face: 1, rec: EX.table0, p: { mode: 'sit', blink: blinkAt(t), eyes: 'open', brow: 'neutral', mouth: 'smile', look: [0, 0], tilt: 0, armL: ARM.headHand, armR: mir(ARM.onTable) } };
  const p = S0.p;
  if (t < T.FOLD[0] + 1.2) {   // ---- night kitchen ----
    p.eyes = 'tired'; p.brow = 'tired'; p.mouth = 'flat'; p.tilt = -.12; p.look = [.5, .3];
    for (const pg of T.PINGS.slice(0, 3)) { const k = seg(t, pg, pg + .25) * (1 - seg(t, pg + .8, pg + 1.1)); p.look = [lerp(p.look[0], .9, k), lerp(p.look[1], .5, k)]; }
    if (t > 9.6 && t < 17.5) {   // each card lands: she glances up at the tower
      p.look = [.9, -.2]; for (const c of T.CARDS) { const k = seg(t, c - .2, c) * (1 - seg(t, c + .5, c + .8)); if (k > 0) { p.eyes = 'open'; p.look = [1, -.8 * k]; } }
    }
    if (t >= 17.5 && t < 21.4) {   // "One pair of hands": lifts her head, looks at her open hands
      const k = eio(seg(t, 17.6, 18.2)); p.armL = mixArm(ARM.headHand, ARM.palms, k); p.armR = mixArm(mir(ARM.onTable), mir(ARM.palms), k);
      p.tilt = lerp(-.12, .05, k); p.look = [0, .9]; p.eyes = 'open'; p.mouth = t > 19.2 ? 'sigh' : 'flat';
      if (t > 19.3) { p.look = [.9, -.6]; p.eyes = 'wide'; p.brow = 'up'; p.mouth = 'o'; }   // the flurry of slips
    }
    if (t >= 21.4 && t < T.AI_TAB.reach) {   // the silence: hands down, the tower sways, then she looks at the tab
      const k = eio(seg(t, 21.4, 22.0)); p.armL = mixArm(ARM.palms, ARM.onTable, k); p.armR = mixArm(mir(ARM.palms), mir(ARM.onTable), k);
      p.tilt = 0; p.look = t < 22.7 ? [.9, -.5] : [-1, .3]; p.eyes = t < 22.7 ? 'open' : 'open'; p.brow = t < 22.7 ? 'tired' : 'firm'; p.mouth = t < 22.7 ? 'flat' : 'set';
    }
    if (t >= T.AI_TAB.reach) {   // reach, tug, watch the page start to move
      p.look = [-1, .3]; p.brow = 'firm'; p.mouth = 'set'; p.armR = mir(ARM.onTable);
      const kr = eio(seg(t, T.AI_TAB.reach, T.AI_TAB.pull - .1)), kt = back(seg(t, T.AI_TAB.pull, T.AI_TAB.pull + .25), 1.6);
      p.armL = mixArm(mixArm(ARM.onTable, ARM.reach, kr), ARM.tug, kt);
      S0.x = -.0012 * kt;
      if (t > T.AI_TAB.pull + .4) { p.mouth = 'smile'; p.brow = 'neutral'; p.look = [-.3, -.4]; }
      if (t > 25.8) { p.eyes = 'wide'; p.mouth = 'o'; p.look = [0, -1]; p.brow = 'up'; p.armL = mixArm(ARM.tug, ARM.onTable, ss(seg(t, 25.8, 26.2))); }
    }
    return S0;
  }
  // ---- the workshop ----
  const S1 = { vis: true, x: -.075, y: 0, z: .136, face: 1, rec: EX.table1, p: { mode: 'stand', blink: blinkAt(t, 1.1), eyes: 'open', brow: 'neutral', mouth: 'smile', look: [0, 0], tilt: 0, armL: ARM.rest, armR: mir(ARM.rest) } };
  const q = S1.p;
  if (t < T.TABS[0] + T.INSERT) { q.look = [.4, .4]; q.eyes = 'wide'; q.mouth = 'o'; }
  else if (t < T.TABS[1]) {   // messages
    q.look = [1, .6];
    if (t > 34.3) { const k = back(seg(t, 34.3, 34.7), 1.5) * (1 - ss(seg(t, 36.2, 36.8))); q.eyes = 'happy'; q.mouth = 'grin'; q.armL = mixArm(ARM.rest, ARM.cheer, k * .55); q.armR = mixArm(mir(ARM.rest), mir(ARM.cheer), k * .55); }
  }
  else if (t < T.TABS[2]) {   // listings: photo, watch the tag, stamp it
    const kp = eio(seg(t, T.FLASH - 1.1, T.FLASH - .5)) * (1 - eio(seg(t, T.FLASH + .5, T.FLASH + 1.0)));
    q.armL = mixArm(ARM.rest, ARM.phone, kp); q.armR = mixArm(mir(ARM.rest), mir(ARM.phone), kp); q.hold = kp > .55 ? 'phone' : null;
    q.look = kp > .5 ? [0, .4] : [-.8, .5];
    if (t > T.TAG[0] - .2 && t < T.STAMP - .6) { q.eyes = 'wide'; q.mouth = 'o'; q.look = [-.9, .5]; }
    const ku = eio(seg(t, T.STAMP - .55, T.STAMP - .25)), kd = back(seg(t, T.STAMP - .1, T.STAMP + .05), 1.2), kb = ss(seg(t, T.STAMP + .5, T.STAMP + .9));
    if (t > T.STAMP - .55) { q.armL = mixArm(mixArm(mixArm(ARM.rest, ARM.stampUp, ku), ARM.stampDn, kd), ARM.rest, kb); q.look = [-.9, .6]; q.eyes = t > T.STAMP ? 'happy' : 'open'; q.mouth = t > T.STAMP ? 'grin' : 'set'; }
  }
  else if (t < 57.9) { q.look = t < 52.5 ? [-.6, -.6] : [.6, -.2]; q.armL = ARM.hipsF; q.armR = mir(ARM.hipsF); q.mouth = 'smile'; }
  else if (t < T.PEAK) {   // a brisk, happy walk to the wheel
    const w = walk(t, 57.9, 59.9, [-.075, .136], [.07, .199]);
    S1.x = w.x; S1.z = w.z; q.walk = w.ph; q.stride = w.moving ? 1 : 0; S1.y = w.moving ? Math.abs(Math.sin(w.ph)) * .0009 : 0;
    const a = walkArms(Math.sin(w.ph) * (w.moving ? 1 : 0)); q.armL = a.L; q.armR = mir(a.R); q.eyes = 'happy'; q.mouth = 'smile'; S1.face = 1;
  }
  if (t >= T.PEAK && t < T.NIGHT[0]) {   // at the wheel
    S1.x = .07; S1.z = .1995; S1.y = 0; S1.rec = EX.wheel;
    q.mode = 'sit'; q.armL = ARM.wheel; q.armR = mir(ARM.wheel); q.look = [0, .8]; q.eyes = t > 66.6 ? 'happy' : 'open'; q.mouth = t > 64.4 ? 'smile' : 'smile'; q.tilt = Math.sin(t * 1.3) * .03;
  }
  if (t >= T.NIGHT[0]) {   // asleep in the armchair
    S1.x = -.078; S1.z = .2655; S1.y = .0043; S1.rec = EX.chairFront;
    q.mode = 'sit'; q.armL = ARM.lap; q.armR = mir(ARM.lap); q.eyes = 'closed'; q.mouth = 'sleep'; q.tilt = -.22 + Math.sin(t * 1.1) * .015; q.brow = 'neutral';
  }
  return S1;
}
function catState(t) {
  if (t < T.FOLD[0] + 1.2) return { x: -.058, y: .0222, z: .2155, rec: EX.catBox, br: Math.sin(t * 2.1), p: { ear: t > 0.25 && t < .6 ? 1 : 0 } };
  if (t < T.NIGHT[0]) return { x: -.078, y: .0185, z: .2665, rec: EX.chairFront, br: Math.sin(t * 2.1), p: { ear: 0 } };
  return { x: -.076, y: .0205, z: .2695, rec: EX.chairFront, br: Math.sin(t * 1.9), p: { ear: Math.abs(t - T.PINGS[4]) < .3 ? 1 : 0 } };
}

// ---------- mechanisms ----------
const beatsSince = (t, t0) => Math.max(0, (t - t0) / T.BEAT);
const stepEase = b => Math.floor(b) + eio(clamp((b - Math.floor(b)) / .45));   // a click, then rest
const LAUNCH = []; { let tt = T.PARCELS[0]; for (const p of T.PARCELS) LAUNCH.push(p); tt = T.PARCELS[1] + 1.6; while (tt < T.NIGHT[0] - .5) { LAUNCH.push(tt); tt += 1.6; } }
const PARCEL_DUR = 2.6;   // belt → printer → launch → into the window
function parcelState(j, t) {   // parcel j launches at LAUNCH[j]
  const tL = LAUNCH[j]; if (tL === undefined) return null; const t0 = tL - 1.6;
  if (t < t0 || t > tL + 1.0) return null;
  const xb0 = .036, xb1 = .1, yb = .026 + .0062, zb = .072;
  if (t < tL) { const k = seg(t, t0, t0 + 1.25); return { x: lerp(xb0, xb1, ss(k)), y: yb, z: zb, s: 1, rz: 0, labeled: t > t0 + 1.35 }; }
  const k = seg(t, tL, tL + .95), win = EX.glows[j % EX.glows.length].position;
  const x = lerp(xb1, win.x, k), z = lerp(zb, .006, ss(k)), y = lerp(yb, A.WIN.y0 + .03, k) + Math.sin(k * Math.PI) * .07;
  return { x, y, z, s: lerp(1, .45, k), rz: -k * 2.4, labeled: true, flying: true };
}

// ---------- camera: [t, pos xyz, target xyz, fov, aperture, focus (0 = target distance)] world coordinates ----------
const y_ = v => v + PG;
const SH = [
  [[0, .05, y_(.062), .25, .03, y_(.036), .161, 36, 2.4], [5.0, .044, y_(.056), .226, .03, y_(.035), .161, 36, 2.4]],
  [[5.0, .05, y_(.055), .27, .024, y_(.034), .16, 38, 2.4], [7.2, .02, y_(.1), .43, -.004, y_(.042), .165, 42, 2.6], [10.0, -.01, y_(.115), .47, -.014, y_(.04), .17, 44, 2.6]],
  [[10.0, .03, y_(.052), .47, .036, y_(.046), .17, 40, 2.6], [17.5, .04, y_(.056), .45, .038, y_(.05), .172, 40, 2.6]],
  [[17.5, .018, y_(.048), .31, .006, y_(.04), .152, 36, 2.4], [21.0, .006, y_(.045), .236, .002, y_(.041), .152, 36, 2.6], [23.9, .004, y_(.045), .226, .001, y_(.041), .152, 36, 2.6]],
  [[23.9, -.03, y_(.045), .27, -.008, y_(.032), .156, 36, 2.4], [26.4, -.028, y_(.046), .265, -.008, y_(.032), .156, 36, 2.4]],
  [[26.4, .0, y_(.28), .62, 0, y_(.09), .13, 38, 1.8], [30.0, .0, y_(.25), .6, 0, y_(.085), .14, 38, 1.8]],
  [[30.0, TAB_X(0) - .008, y_(.17), .47, TAB_X(0), y_(-.01), .372, 34, 2.4], [32.1, TAB_X(0) - .004, y_(.16), .465, TAB_X(0), y_(-.01), .372, 34, 2.4]],
  [[32.1, -.046, y_(.052), .238, -.058, y_(.037), .146, 48, 2.6], [37.5, -.042, y_(.051), .234, -.056, y_(.037), .146, 48, 2.6]],
  [[37.5, TAB_X(1) + .056, y_(.105), .54, TAB_X(1) - .002, y_(-.012), .362, 34, 2.4], [39.6, TAB_X(1) + .05, y_(.1), .532, TAB_X(1) - .002, y_(-.012), .362, 34, 2.4]],
  [[39.6, -.07, y_(.05), .244, -.079, y_(.034), .145, 48, 2.6], [45.0, -.084, y_(.05), .242, -.08, y_(.034), .145, 48, 2.6]],
  [[45.0, TAB_X(2) + .004, y_(.17), .46, TAB_X(2), y_(-.01), .37, 34, 2.4], [47.1, TAB_X(2) + .002, y_(.16), .455, TAB_X(2), y_(-.01), .37, 34, 2.4]],
  [[47.1, -.076, y_(.09), .25, -.08, y_(.1), .03, 36, 2.6], [50.0, -.075, y_(.128), .255, -.078, y_(.117), .03, 36, 2.6], [52.5, -.075, y_(.13), .25, -.078, y_(.117), .03, 36, 2.6]],
  [[52.5, TAB_X(3) - .056, y_(.105), .54, TAB_X(3) + .002, y_(-.012), .362, 34, 2.4], [54.6, TAB_X(3) - .05, y_(.1), .532, TAB_X(3) + .002, y_(-.012), .362, 34, 2.4]],
  [[54.6, .1, y_(.05), .27, .078, y_(.036), .07, 38, 2.4], [56.1, .097, y_(.052), .27, .076, y_(.038), .07, 38, 2.4], [57.2, .07, y_(.15), .37, .04, y_(.18), .03, 40, 2.2], [60.0, .066, y_(.15), .38, .038, y_(.18), .03, 40, 2.2]],
  [[60.0, .0, y_(.4), .52, 0, y_(.03), .15, 38, 1.6], [62.0, .01, y_(.3), .48, .02, y_(.03), .16, 38, 1.8], [64.2, .022, y_(.06), .3, .07, y_(.032), .2, 38, 2.2],
   [65.6, .018, y_(.04), .264, .082, y_(.03), .195, 38, 2.4, .084], [67.4, .018, y_(.038), .262, .085, y_(.03), .19, 38, 2.6, .084],
   [69.0, .018, y_(.038), .262, .1, y_(.032), .18, 38, 2.6, .242], [70.0, .018, y_(.038), .262, .1, y_(.032), .18, 38, 2.6, .242]],
  [[70.0, .026, y_(.2), .38, .026, y_(.222), .0, 44, 2.0], [72.5, .026, y_(.2), .37, .026, y_(.222), .0, 44, 2.0]],
  [[72.5, -.036, y_(.031), .224, -.046, y_(.028), .148, 36, 2.4], [76.6, -.04, y_(.03), .208, -.046, y_(.028), .148, 36, 2.4]],
  [[76.6, -.066, y_(.048), .35, -.076, y_(.04), .265, 36, 2.4], [80.0, -.058, y_(.09), .48, -.07, y_(.042), .258, 38, 2.4]],
  [[80.0, .0, y_(.014), .4, 0, y_(.12), .0, 40, 1.8, .36], [83.75, .0, y_(.012), .405, 0, y_(.075), .1, 40, 1.8, .37]],
];
const SHOTS = SH.map(keys => ({ t0: keys[0][0], t1: keys[keys.length - 1][0], f: track(keys.map(k => [k[0], [...k.slice(1, 9), k[9] || 0]])) }));
function camAt(t) {
  let s = SHOTS[0]; for (const S2 of SHOTS) if (t >= S2.t0) s = S2;
  const v = s.f(t);
  return { pos: new THREE.Vector3(v[0], v[1], v[2]), tgt: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6], aper: v[7], focus: v[8] };
}

// ---------- lighting timeline ----------
function lightsAt(t) {
  const day = seg(t, 27.0, 29.2) * (1 - seg(t, T.NIGHT[0], T.NIGHT[1]));
  const night1 = seg(t, T.NIGHT[0], T.NIGHT[1]);
  const tint = new THREE.Vector3(1, 1, 1).lerp(new THREE.Vector3(.6, .66, .92), night1);
  return {
    sunI: day * 2.4 + night1 * .18, sunCol: new THREE.Color('#fff3e0').lerp(new THREE.Color('#9fb2ff'), night1),
    lampI: 2.4 - day * 1.1 - night1 * .5, hemiI: .14 + day * .5 - night1 * .06, envI: .16 + day * .26 - night1 * .08,
    lampPt: t < T.FOLD[0] + .5 ? .02 : 0, warm: .14 - day * .06 + night1 * .08, exposure: 1.0, tint,
  };
}

// ---------- sound events (exported by events.mjs for mix.py) ----------
const EV = [];
for (const p of T.PINGS) EV.push({ t: p, type: 'ping' });
for (const b of T.BUB) EV.push({ t: b[1], type: 'bubble' });
for (const e of HUD.blipTimes()) EV.push(e);
for (const c of T.CARDS) EV.push({ t: c, type: 'card' });
for (const c of T.SLIPS) EV.push({ t: c, type: 'slip' });
for (const c of [21.55, 22.55, 23.4]) EV.push({ t: c, type: 'creak' });
EV.push({ t: T.AI_TAB.pull, type: 'tabclick' });
EV.push({ t: T.FOLD[0], type: 'foldall', d: .9 }, { t: T.TURN[0], type: 'page', d: T.TURN[1] - T.TURN[0] });
for (const r of POPS) if (r.spread === 1) EV.push({ t: T.RISE[1] + r.d + .12, type: 'pop' });
for (const tb of T.TABS) EV.push({ t: tb, type: 'tab' });
for (let b = 0; T.TABS[0] + b * T.BEAT < T.NIGHT[0]; b++) EV.push({ t: T.TABS[0] + b * T.BEAT, type: 'gear' });
EV.push({ t: T.FLASH, type: 'shutter' }, { t: T.TAG[0], type: 'write', d: T.TAG[1] - T.TAG[0] }, { t: T.STAMP, type: 'stamp' });
EV.push({ t: T.SLATS, type: 'slats' }, { t: T.SLATS_BACK, type: 'slats' }, { t: T.NOTE, type: 'note' });
EV.push({ t: T.BELT, type: 'belt', d: T.NIGHT[0] - T.BELT });
LAUNCH.forEach((tL, j) => { EV.push({ t: tL - .25, type: 'label' }, { t: tL, type: 'launch' }, { t: tL + .98, type: 'ding' }); });
EV.push({ t: 58.6, type: 'wheel', d: T.NIGHT[0] + .3 - 58.6 });
for (const c of [61.2, 63.6, 65.8]) EV.push({ t: c, type: 'clay' });
EV.push({ t: T.NIGHT[0], type: 'disc', d: T.NIGHT[1] - T.NIGHT[0] }, { t: 69.4, type: 'crickets', d: T.CLOSE[1] - 69.4 }, { t: 77.0, type: 'purr', d: 3.0 });
EV.push({ t: T.FOLD[1], type: 'foldall', d: 1.6 }, { t: T.CLOSE[0], type: 'close', d: T.CLOSE[1] - T.CLOSE[0] }, { t: T.CARD, type: 'thump' });
EV.push({ t: T.TABS[3] + .1, type: 'beltstart' });
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.DUR = T.DUR;

// ---------- screen projection + reading-time report ----------
const tmpV = new THREE.Vector3();
function toScreen(v) { const p = v.clone().project(cam); if (p.z > 1 || p.z < -1) return null; return [(p.x * .5 + .5) * W, (-p.y * .5 + .5) * H]; }
function boxOf(obj) {
  obj.updateWorldMatrix(true, true);
  const bb = new THREE.Box3().setFromObject(obj, true); if (bb.isEmpty()) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const xx of [bb.min.x, bb.max.x]) for (const yy of [bb.min.y, bb.max.y]) for (const zz of [bb.min.z, bb.max.z]) {
    const s = toScreen(new THREE.Vector3(xx, yy, zz)); if (!s) return null; x0 = Math.min(x0, s[0]); y0 = Math.min(y0, s[1]); x1 = Math.max(x1, s[0]); y1 = Math.max(y1, s[1]);
  }
  return { x0, y0, x1, y1 };
}
function visibleIn(obj) { let o = obj; while (o) { if (!o.visible) return false; o = o.parent; } return true; }
let LAST = { t: 0, texts: [] };
window.TEXTS = t => { if (LAST.t !== t) window.render(t, true); return LAST.texts; };   // measure mode: positions only, nothing drawn

// ---------- render ----------
let lastSpread = -1;
window.render = function (t, measure = false) {
  // book: spread textures and the page turn
  const spread = t >= T.TURN[0] + .1 ? 1 : 0, turning = t >= T.TURN[0] && t < T.TURN[1];
  book.groundMat.map = SPREAD[spread].ground; book.groundMat.needsUpdate = true;
  book.backMat.map = (turning || spread === 0) ? SPREAD[0].sky : SPREAD[1].sky; book.backMat.needsUpdate = true;
  if (turning) {
    book.leafFront.material.map = SPREAD[0].ground; book.leafBack.material.map = SPREAD[1].sky;
    book.leafFront.material.emissiveMap = book.leafFront.material.map; book.leafBack.material.emissiveMap = book.leafBack.material.map;
    book.leafFront.material.needsUpdate = book.leafBack.material.needsUpdate = true;
    book.setLeaf(eio(seg(t, T.TURN[0], T.TURN[1])));
  } else book.setLeaf(0);
  book.setOpen(Math.PI / 2 * (1 - eio(seg(t, T.CLOSE[0], T.CLOSE[1])) ** 1.3));
  updatePops(POPS, t);

  // ---- spread 0 extras: AI tab slide, the chore tower ----
  if (EX.aiTab.g.visible) EX.aiTab.m.position.x = -.0055 * back(seg(t, T.AI_TAB.pull, T.AI_TAB.pull + .22), 1.4);
  const k0 = riseOf(EX.table0, t);
  tower.visible = k0 > .002; tower.rotation.x = (1 - k0) * Math.PI / 2 * -1;
  let sway = 0;
  sway += Math.sin(seg(t, 19.3, 20.6) * Math.PI * 3) * .05 * (1 - seg(t, 19.3, 21.0));
  const tq = seg(t, 21.3, 24.4); sway += Math.sin(tq * Math.PI * 5) * .07 * Math.sin(tq * Math.PI) ;
  tower.rotation.z = sway;
  for (const c of STACK) {
    if (c.t > 0 && t < c.t - .3) { c.g.visible = false; continue; }
    c.g.visible = true;
    const k = c.t > 0 ? seg(t, c.t - .3, c.t) : 1, fall = (1 - ei(k)) * .07;
    const land = c.t > 0 ? Math.sin(seg(t, c.t, c.t + .18) * Math.PI) * .12 : 0;
    c.g.position.set(c.x, c.y + fall, (c.kind === 'card' ? .0006 : 0) + STACK.indexOf(c) * .0004);
    c.g.rotation.z = c.rz * (1 + (1 - k) * 2); c.g.scale.set(1 + land * .5, 1 - land, 1);
  }

  // ---- spread 1 extras ----
  const s1 = t > T.TURN[1] - .05 && t < T.CLOSE[1] + .1;
  EX.back1.visible = s1;
  if (s1) {
    const kb = back(seg(t, T.TURN[1] - .05, T.TURN[1] + .45), 1.6);
    EX.town.position.z = .0062 * kb; EX.panel.position.z = .0095; EX.clock1.scale.setScalar(Math.max(.001, kb));
    const sunArc = lerp(.28, -.28, seg(t, 30, T.NIGHT[0]));
    EX.disc.rotation.z = lerp(sunArc, -Math.PI, eio(seg(t, T.NIGHT[0], T.NIGHT[1])));
    // the workshop clock: a day flies by (9:00 → 18:00), then spins on to 2:14 at night
    const hrs = t < T.NIGHT[0] ? lerp(9, 18, seg(t, 30, T.NIGHT[0])) : lerp(18, 26 + 14 / 60, eio(seg(t, T.NIGHT[0], T.NIGHT[1])));
    EX.h1.rotation.z = -TAU * hrs / 12; EX.m1.rotation.z = -TAU * hrs;
    EX.glows.forEach((g, i) => {
      let on = 0; LAUNCH.forEach((tL, j) => { if (j % EX.glows.length === i) on = Math.max(on, seg(t, tL + .95, tL + 1.1)); });
      on = Math.max(on * (1 - seg(t, 69.5, 70.5)) * .8, seg(t, T.NIGHT[0] + .8, T.NIGHT[1]) * (i % 3 === 1 ? .35 : 1));
      g.userData.front.material.opacity = on; g.userData.front.material.emissiveIntensity = on * (1 + seg(t, T.NIGHT[0], T.NIGHT[1]) * 1.5); g.visible = on > .01;
    });
  }
  // pull-tabs
  EX.tabs.forEach((g, i) => { g.visible = t > T.RISE[1] + .4 && t < T.CLOSE[1] + .1; g.position.z = BD - .004 + .017 * back(seg(t, T.TABS[i], T.TABS[i] + .22), 1.5); });
  // messages: gear and envelopes
  const runM = t > T.TABS[0];
  EX.gearG.visible = t > T.RISE[1] + .6 && t < T.FOLD[1] + .5; EX.gear.rotation.z = -stepEase(beatsSince(t, T.TABS[0])) * TAU / 16;
  EX.gearG.rotation.x = EX.phone1.g.rotation.x;
  EX.envs.forEach((m, i) => {
    const b = beatsSince(t, T.TABS[0] + .3) - i, ph = ((b % 4) + 4) % 4;
    m.visible = runM && b >= 0 && t < T.FOLD[1] && ph < 1.2;
    if (m.visible) { const k = clamp(ph / 1.2); m.position.set(-.046 + Math.sin(i * 2.1) * .002, .024 + ss(k) * .016, .1468); m.scale.setScalar(1 - ss(seg(k, .75, 1)) * .8); m.rotation.z = Math.sin(i) * .2; }
  });
  // listings: tag + stamp
  tag.root.visible = t > T.RISE[1] + .5 && t < T.FOLD[1] + .6; tag.root.rotation.x = EX.mug1.g.rotation.x;
  const nTag = Math.round(clamp(seg(t, T.TAG[0], T.TAG[1])) * 27);
  if (!measure) tag.draw({ n: t < T.TAG[0] ? 0 : nTag });
  EX.stamp.visible = t > T.STAMP - .02 && t < T.FOLD[1] + .4;
  if (EX.stamp.visible) { const k = back(seg(t, T.STAMP, T.STAMP + .2), 2); EX.stamp.position.set(-.0772, .0232, .1503); EX.stamp.scale.setScalar(lerp(1.5, .78, k)); EX.stamp.rotation.z = -.25; }
  // stock: flap flips, note drops
  const fk = eio(seg(t, T.SLATS, T.SLATS + .38)) - eio(seg(t, T.SLATS_BACK, T.SLATS_BACK + .38));
  EX.flap.rotation.x = Math.PI * fk + Math.sin(seg(t, T.SLATS + .38, T.SLATS + .7) * Math.PI * 2) * .1 * (1 - seg(t, T.SLATS + .38, T.SLATS + .7));
  EX.note.visible = t > T.NOTE - .1 && t < T.FOLD[1] + .3;
  if (EX.note.visible) { const k = spring(t - T.NOTE, 6, .32); EX.note.position.set(-.066, lerp(.24, .112, clamp(k, 0, 1.2)), .04); EX.note.rotation.z = Math.sin((t - T.NOTE) * 3) * .05 * Math.exp(-(t - T.NOTE)); EX.noteThread.position.set(.017, .016, -.0005); }
  // orders: belt, parcels, labels
  belt.root.visible = t > T.RISE[1] + .6 && t < T.FOLD[1] + .4;
  if (!measure) belt.draw(t > T.BELT ? (t - T.BELT) * 1.6 : 0);
  EX.parcels.forEach((g, i) => { g.visible = false; });
  EX.labels.forEach(m => { m.visible = false; });
  let slot = 0;
  LAUNCH.forEach((tL, j) => {
    const st = parcelState(j, t); if (!st || slot >= EX.parcels.length) return;
    const g = EX.parcels[slot], lb = EX.labels[slot]; slot++;
    g.visible = true; g.position.set(st.x, st.y - .006, st.z + .002); g.scale.setScalar(st.s); g.rotation.z = st.rz;
    if (st.labeled || t > tL - .45) { lb.visible = true; const k = st.labeled ? 1 : seg(t, tL - .45, tL - .25); lb.position.set(st.x + (st.flying ? 0 : lerp(.012, 0, k)), st.y - .0002, st.z + .0035); lb.scale.setScalar(st.s * .9); lb.rotation.z = st.rz; }
  });
  // the wheel: clay rises and turns while Mira works it
  clay.root.visible = t > T.RISE[1] + .7 && t < T.FOLD[1] + .5; clay.root.rotation.x = EX.wheel.g.rotation.x;
  if (!measure) clay.draw(lerp(.15, 1, ss(seg(t, 60.5, 69.0))), t > T.PEAK ? t * 1.7 : 0);
  // ---- Mira ----
  const ms = miraState(t), fr = foldRot(ms.rec, t);
  mira.root.visible = ms.vis && fr.k > .002; mira.shadow.visible = false;
  if (mira.root.visible) {
    if (!measure) mira.pose(ms.p); mira.root.position.set(ms.x, ms.y, ms.z); mira.root.rotation.x = fr.rx; mira.body.scale.set(ms.face, 1, 1);
  }
  // ---- the cat ----
  const cs = catState(t), cf = foldRot(cs.rec, t);
  cat.root.visible = cf.k > .002; if (cat.root.visible) { if (!measure) cat.pose(cs.p); cat.root.position.set(cs.x, cs.y, cs.z); cat.root.rotation.x = cf.rx; cat.root.scale.set(1 - cs.br * .008, 1 + cs.br * .022, 1); }

  // ---- puffs and flash ----
  PUFFS.length = 0;
  for (const c of STACK) if (c.t > 0) PUFFS.push([c.t, tower.position.x + c.x, c.y + .002, tower.position.z + .004, c.kind === 'card' ? 1.2 : .7]);
  PUFFS.push([T.STAMP, -.0772, .0232, .152, .7]);
  flash.visible = t > T.FLASH && t < T.FLASH + .35;
  if (flash.visible) { const k = seg(t, T.FLASH, T.FLASH + .35); flash.position.set(-.075, .033, .142); flash.scale.setScalar(.03 * (.4 + k)); flash.material.opacity = 1 - k; flash.quaternion.copy(camQ); }

  // ---- lights ----
  const Lt = lightsAt(t);
  sun.intensity = Lt.sunI; sun.color.copy(Lt.sunCol); sun.castShadow = Lt.sunI > .5; sun.visible = Lt.sunI > .01;
  spot.intensity = Lt.lampI; hemi.intensity = Lt.hemiI; lampPt.intensity = Lt.lampPt; lampPt.visible = Lt.lampPt > 0;
  hemi.intensity = Lt.hemiI + Lt.envI * 2.2; scene.backgroundIntensity = .35 + Lt.envI * .6;
  renderer.toneMappingExposure = Lt.exposure;
  // the phone screens glow at night
  const ph = t < T.FOLD[0] ? EX.phone0 : EX.phone1;
  phoneGlow.position.set(ph.g.position.x, ph.g.position.y + .01 + PG, ph.g.position.z + .006);
  phoneGlow.intensity = (t < T.FOLD[0] ? .004 : (t > T.NIGHT[1] ? .003 : 0)) + T.PINGS.reduce((a, p) => a + Math.max(0, 1 - Math.abs(t - p - .1) / .25) * .006, 0); phoneGlow.visible = phoneGlow.intensity > 0;

  // ---- camera ----
  const Cm = camAt(t);
  cam.position.copy(Cm.pos); cam.fov = Cm.fov; cam.lookAt(Cm.tgt); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  camQ.copy(cam.quaternion);
  post.dof.focus = Cm.focus > .001 ? Cm.focus : Cm.pos.distanceTo(Cm.tgt); post.dof.aper = Cm.aper; post.dof.maxCoc = 14;
  if (t >= T.RACK[0] && t <= 70) post.dof.focus = lerp(.084, .242, eio(seg(t, T.RACK[0], T.RACK[1])));
  post.vig.uniforms.warm.value = Lt.warm; post.vig.uniforms.tint.value.copy(Lt.tint); post.vig.uniforms.fade.value = 1 - seg(t, T.CLOSE[1] - .35, T.CLOSE[1]) * .85;
  for (const p of PS) p.userData.update(t);
  scene.updateMatrixWorld(true);
  if (t < T.CARD && !measure) post.composer.render();

  // ---- 2D overlay ----
  OX.clearRect(0, 0, W, H);
  const texts = [];
  const an = {};
  const phoneTop = (rec, dx = 0) => toScreen(new THREE.Vector3(rec.g.position.x + dx, rec.g.position.y + .0168 + PG, rec.g.position.z));
  if (t < 9.95) an.phone = phoneTop(EX.phone0);
  if ((t >= 32.1 && t < 37.5) || (t >= 72.5 && t < 76.6)) an.phone2 = phoneTop(EX.phone1);   // bubbles live in the phone shots only
  if (t < T.CARD) {
    const bx = HUD.drawBubbles(OX, t, an, measure);
    for (const b of bx) if (b.k > .5) texts.push({ id: 'bub' + b.t0, text: b.text, x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1, ...(b.pass ? { pass: true } : {}) });
    if (!measure && !NOSUBS) HUD.drawSubs(OX, t, DURS);
  }
  for (const c of HUD.drawCard(OX, t)) if (c.vis) texts.push(c);
  // in-world words that the viewer reads: tab words, the flap sign, the note, the listing tag, the AI tab
  if (t < T.CARD) {
    const w3 = (id, text, obj, o = {}) => { if (!visibleIn(obj)) return; const b = boxOf(obj); if (!b) return; if (b.x1 - b.x0 < 40) return; texts.push({ id, text, ...b, ...o }); };
    const inWin = (a, b) => t >= a && t < b ? {} : { pass: true };   // read in its own shot; elsewhere it only passes by
    EX.tabs.forEach((g, i) => w3('tab' + i, T.TAB_NAMES[i], g, inWin(T.TABS[i], T.TABS[i] + T.INSERT)));
    if (EX.flap.parent.visible) { w3('flapTop', 'SPECKLED SKY', EX.flapTop, inWin(47.1, 52.5)); w3('flap', fk > .5 ? 'SELLING FAST' : 'STOCK OK', EX.flap, fk > .5 ? inWin(47.1, 52.5) : { pass: true }); }
    if (EX.note.visible) w3('note', 'Order more clay', EX.note.children[0], inWin(T.NOTE, 52.5));
    if (t >= T.TAG[0]) w3('tag', 'Speckled Sky Mug hand-thrown', tag.root, inWin(T.TAG[0], 45.0));
    w3('aitab', 'AI', EX.aiTab.g);
    if (EX.back1.visible) w3('sign', 'MIRA MAKES', EX.panel, { pass: true });
  }
  LAST = { t, texts };
  // fade in from black over the first frames? no: the film opens on the ping. A short fade out into the card is the board closing.
};
// a slice of the film for partial renders: ?t0=<s>&dur=<s> (t0 on the 1/60 s frame grid); events.mjs runs without it
{ const QS = new URLSearchParams(location.search), T0 = +(QS.get('t0') || 0), SL = QS.get('dur');
  if (T0 || SL) { const full = window.render; window.render = t => full(t + T0); window.DUR = SL ? +SL : T.DUR - T0; }
  // ?measure=1: render() only places things (for readcheck, which calls render(t) before TEXTS(t) at every step)
  if (QS.get('measure')) { const full = window.render; window.render = t => full(t, true); } }
window.DBG = { mira, book, cam, EX, tower, post, renderer, scene, cat, clay, belt, tag };
window.render(0);
window.READY = true;
