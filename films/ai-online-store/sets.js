// Two spreads: page art + pop-up pieces + the parts that mechanisms drive (returned in `ex`)
import * as THREE from 'three';
import * as A from './art.js';
import { C } from './art.js';
import { cv, paperFill, INK, sh, smoothOpen, GRAIN, rr } from './paper.js';
import { mulberry, clamp, lerp, seg, back, ss, TAU } from './lib.js';
import { BW, BD, texOf } from './book.js';
import { cutMesh, thread } from './cutmesh.js';
import { RISE, FOLD } from './timeline.js';

export const PW = 2048, PH = Math.round(2048 * BD / BW);
const gx = xm => (xm / BW + .5) * PW, gz = zm => zm / BD * PH, sy = ym => (1 - ym / BD) * PH;

function page(fn) { const c = cv(PW, PH), x = c.getContext('2d'); fn(x); x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PW, PH); x.restore(); return c; }
function mottle(x, seed, a = .06, n = 70) {
  const R = mulberry(seed);
  for (let i = 0; i < n; i++) { const px = R() * PW, py = R() * PH, r = 40 + R() * 220, g = x.createRadialGradient(px, py, 0, px, py, r); const d = R() < .5; g.addColorStop(0, d ? `rgba(60,40,40,${a * R()})` : `rgba(255,255,255,${a * 1.3 * R()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
}

export function pages() {
  const P = {};
  // ---- spread 0: night kitchen ----
  P.sky0 = page(x => {
    x.fillStyle = C.nWall; x.fillRect(0, 0, PW, PH); mottle(x, 2, .08);
    // wallpaper: lilac diamonds
    x.strokeStyle = C.nPat; x.lineWidth = 6;
    for (let i = -10; i < 30; i++) { x.beginPath(); x.moveTo(i * 160, 0); x.lineTo(i * 160 + PH * .6, PH); x.stroke(); x.beginPath(); x.moveTo(i * 160, 0); x.lineTo(i * 160 - PH * .6, PH); x.stroke(); }
    x.fillStyle = 'rgba(190,180,255,.18)'; for (let i = -10; i < 30; i++) for (let j = 0; j < 30; j++) { x.beginPath(); x.arc(i * 160 + (j % 2) * 80, j * 134, 9, 0, TAU); x.fill(); }
    // skirting board
    x.fillStyle = '#28305f'; x.fillRect(0, sy(.022), PW, PH); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, sy(.022), PW, 10);
    // window: night sky, stars, moon, a few far rooftops
    const wx0 = gx(-.055), wx1 = gx(.055), wy0 = sy(.285), wy1 = sy(.17);
    rr(x, wx0 - 36, wy0 - 36, wx1 - wx0 + 72, wy1 - wy0 + 72, 24); sh(x, '#8d86c9', 9);
    const g = x.createLinearGradient(0, wy0, 0, wy1); g.addColorStop(0, '#121840'); g.addColorStop(1, '#2d3a7c'); x.fillStyle = g; rr(x, wx0, wy0, wx1 - wx0, wy1 - wy0, 10); x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
    x.save(); rr(x, wx0, wy0, wx1 - wx0, wy1 - wy0, 10); x.clip();
    const R = mulberry(5); for (let i = 0; i < 70; i++) { x.beginPath(); x.arc(wx0 + R() * (wx1 - wx0), wy0 + R() * (wy1 - wy0) * .75, 2 + R() * 5, 0, TAU); x.fillStyle = `rgba(255,248,220,${.4 + R() * .6})`; x.fill(); }
    x.beginPath(); x.arc(wx0 + (wx1 - wx0) * .7, wy0 + (wy1 - wy0) * .3, 80, Math.PI * .3, Math.PI * 1.7); x.bezierCurveTo(wx0 + (wx1 - wx0) * .7 - 20, wy0 + (wy1 - wy0) * .3 - 60, wx0 + (wx1 - wx0) * .7 - 20, wy0 + (wy1 - wy0) * .3 + 60, wx0 + (wx1 - wx0) * .7 + 40, wy0 + (wy1 - wy0) * .3 + 68); x.closePath(); sh(x, C.moon, 8);
    x.fillStyle = '#0d1230'; let px = wx0 - 20; const R2 = mulberry(9);
    while (px < wx1) { const w = 120 + R2() * 90, h = 120 + R2() * 140; x.beginPath(); x.moveTo(px, wy1); x.lineTo(px, wy1 - h); x.lineTo(px + w / 2, wy1 - h - 60); x.lineTo(px + w, wy1 - h); x.lineTo(px + w, wy1); x.fill(); px += w; }
    x.restore();
    x.fillStyle = '#8d86c9'; x.fillRect((wx0 + wx1) / 2 - 10, wy0, 20, wy1 - wy0); x.fillRect(wx0, (wy0 + wy1) / 2 - 10, wx1 - wx0, 20);
    rr(x, wx0 - 60, wy1 + 30, wx1 - wx0 + 120, 46, 12); sh(x, '#8d86c9', 9);
    // a shelf with mugs on the wall (left)
    rr(x, gx(-.12), sy(.135), gx(-.05) - gx(-.12), 34, 8); sh(x, '#6a5aa6', 8);
    for (let k = 0; k < 3; k++) A.drawMug(x, gx(-.11 + k * .022) + 30, sy(.135) - 2, 90, 80, [C.mug, '#9cc28f', '#f2c14e'][k], [C.mugS, '#7aa56d', '#d49d2a'][k], { lw: 7, lw2: 4, seed: 40 + k });
  });
  P.ground0 = page(x => {
    x.fillStyle = C.nFloor; x.fillRect(0, 0, PW, PH);
    for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? C.nFloor2 : C.nFloor; x.fillRect(i * PW / 14, 0, PW / 14, PH); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(i * PW / 14, 0, 4, PH); }
    mottle(x, 4, .08);
    x.beginPath(); x.ellipse(gx(.01), gz(.17), gx(.1) - gx(0), gz(.075), 0, 0, TAU); x.fillStyle = C.nRug; x.fill(); x.lineWidth = 9; x.strokeStyle = INK; x.stroke();
    x.beginPath(); x.ellipse(gx(.01), gz(.17), gx(.08) - gx(0), gz(.058), 0, 0, TAU); x.lineWidth = 12; x.strokeStyle = C.nRugS; x.stroke();
  });
  // ---- spread 1: the workshop (the backdrop page is hidden behind the wall panel except during the turn) ----
  const wall = A.wallPanel(BW, BD);
  P.sky1 = page(x => {
    x.fillStyle = C.wall; x.fillRect(0, 0, PW, PH);
    x.fillStyle = '#9fdcf5'; x.fillRect(gx(A.WIN.x0) - 10, sy(A.WIN.y1) - 10, gx(A.WIN.x1) - gx(A.WIN.x0) + 20, sy(A.WIN.y0) - sy(A.WIN.y1) + 20);
    const pad = 30, sw = PW / (BW * A.PPM);   // wall panel canvas (incl. pad) → page pixels
    x.drawImage(wall.c, pad, pad, wall.c.width - 2 * pad, wall.c.height - 2 * pad, gx(-(BW - .008) / 2), sy(BD - .002), (BW - .008) * A.PPM * sw, (BD - .004) * A.PPM * sw);
  });
  P.ground1 = page(x => {
    x.fillStyle = C.tile; x.fillRect(0, 0, PW, PH);
    const T = 168, R = mulberry(12);
    for (let i = 0; i * T < PW; i++) for (let j = 0; j * T < PH; j++) { x.fillStyle = `rgba(${R() < .5 ? '255,230,200' : '120,60,30'},${.04 + R() * .08})`; x.fillRect(i * T + 3, j * T + 3, T - 6, T - 6); }
    x.strokeStyle = 'rgba(120,70,40,.55)'; x.lineWidth = 6;
    for (let i = 0; i * T < PW; i++) { x.beginPath(); x.moveTo(i * T, 0); x.lineTo(i * T, PH); x.stroke(); }
    for (let j = 0; j * T < PH; j++) { x.beginPath(); x.moveTo(0, j * T); x.lineTo(PW, j * T); x.stroke(); }
    mottle(x, 13, .07);
    x.fillStyle = 'rgba(201,140,102,.5)'; for (let i = 0; i < 60; i++) { x.beginPath(); x.arc(gx(.07) + (R() - .5) * 300, gz(.21) + (R() - .5) * 200, 4 + R() * 10, 0, TAU); x.fill(); }
    // woven rug under the armchair
    const rx = gx(-.075), rz = gz(.262), rw = gx(.05) - gx(0), rh = gz(.045);
    rr(x, rx - rw, rz - rh, rw * 2, rh * 2, 40); sh(x, '#e9d2a8', 9);
    x.save(); rr(x, rx - rw, rz - rh, rw * 2, rh * 2, 40); x.clip(); for (let i = 0; i < 12; i++) { x.fillStyle = i % 3 ? 'rgba(201,108,74,.35)' : 'rgba(93,154,140,.45)'; x.fillRect(rx - rw, rz - rh + i * rh / 6, rw * 2, rh / 14); } x.restore();
  });
  P.wall = wall;
  return P;
}

// ---------- pop-up pieces ----------
// a record per piece: rises around its bottom edge at RISE[spread] + d, folds at FOLD[spread] (front pieces first)
function popper(list, spread, parent, item, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const m = cutMesh(item, o); if (o.ry) m.rotation.y = o.ry;
  g.add(m); parent.add(g);
  const rec = { g, m, spread, d: o.d ?? z / BD * 1.1, dir: o.dir ?? (z > BD / 2 ? -1 : 1), sway: o.sway || 0, ph: o.ph ?? x * 40, pop: o.pop !== false, fold: o.fold ?? 0 };
  list.push(rec); return rec;
}
export function riseOf(r, t) {
  const t0 = RISE[r.spread] + r.d, tf = FOLD[r.spread] + r.fold + (BD - r.g.position.z) * (r.spread === 1 ? 4 : .8);
  const up = r.pop ? back(seg(t, t0, t0 + .55), 1.7) : (t >= t0 ? 1 : 0);
  const dn = 1 - ss(seg(t, tf, tf + .4));
  return Math.min(up, dn);
}
export function updatePops(L, t) {
  for (const r of L) {
    const k = riseOf(r, t);
    r.g.visible = k > .002;
    if (!r.g.visible) continue;
    r.g.rotation.x = r.dir * (Math.PI / 2) * (1 - k);
    if (r.sway) r.m.rotation.z = Math.sin(t * 1.6 + r.ph) * r.sway * k;
  }
}

// group helper (for pieces made of several cards that pop together)
function group(list, spread, parent, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const rec = { g, m: g, spread, d: o.d ?? z / BD * 1.1, dir: o.dir ?? (z > BD / 2 ? -1 : 1), sway: 0, ph: 0, pop: true, fold: o.fold ?? 0 };
  list.push(rec); return rec;
}
const add = (g, item, x, y, z, o = {}) => { const m = cutMesh(item, o); m.position.set(x, y, z); g.add(m); return m; };

export function buildSets(book) {
  const L = [], S = book.stage, K = book.sky, ex = {};

  // ===== spread 0: the night kitchen =====
  popper(L, 0, S, A.sideboard(), 0, 0, .018);
  { const r = group(L, 0, K, .086, .232, .004); add(r.g, A.wallClock({ rim: '#e0533f' }), 0, 0, 0);
    ex.h0 = add(r.g, A.clockHand(.009, .0026), 0, 0, .0008); ex.m0 = add(r.g, A.clockHand(.0125, .0018), 0, 0, .0012);
    // 2:14 → hour hand a little past two, minute hand at fourteen past
    ex.h0.rotation.z = -TAU * (2 + 14 / 60) / 12; ex.m0.rotation.z = -TAU * 14 / 60; }
  // table and what stands on it
  ex.table0 = popper(L, 0, S, A.table(.13, .02, { drawer: true }), .01, 0, .166);
  ex.lamp0 = popper(L, 0, S, A.lamp0(), .052, .02, .159, { dir: 1 });
  ex.phone0 = popper(L, 0, S, A.phone({ badge: 99, night: true }), .027, .02, .161, { dir: 1, s: .78 });
  ex.aiTab = popper(L, 0, S, A.aiTab(), -.019, .0196, .1612, { dir: 1 });
  ex.chair0 = popper(L, 0, S, A.chair(), 0, 0, .146);
  // the cat asleep in a box (left), the chore tower (right)
  ex.catBox = popper(L, 0, S, A.catBox(), -.062, 0, .218);
  // chore cards and slips: built here, placed by main.js (they drop in on the verbs)
  ex.chores = ['msg', 'tag', 'mug', 'box'].map((k, i) => { const g = new THREE.Group(); g.add(cutMesh(A.choreCard(k, 11 + i))); S.add(g); g.visible = false; return g; });
  ex.slips = [...Array(8)].map((_, i) => { const g = new THREE.Group(); g.add(cutMesh(A.slip(21 + i))); S.add(g); g.visible = false; return g; });

  // ===== spread 1: the workshop =====
  // backdrop layers: sky wheel → town → wall panel (with the window hole) → clock
  ex.back1 = new THREE.Group(); K.add(ex.back1); ex.back1.visible = false;
  ex.disc = cutMesh(A.skyDisc()); ex.disc.position.set(0, A.WIN.y0, .003); ex.back1.add(ex.disc);
  const townIt = A.town(); ex.town = cutMesh(townIt); ex.town.position.set(0, A.WIN.y0 - .0006, .0062); ex.back1.add(ex.town);
  ex.glows = townIt.wins.map(([wx, wy]) => { const m = cutMesh(A.windowGlow(), { shadow: false }); m.position.set(wx, A.WIN.y0 - .0006 + wy, .0066); m.userData.front.material = m.userData.front.material.clone(); m.userData.front.material.transparent = true; m.userData.front.material.emissive = new THREE.Color('#ffc861'); m.userData.front.material.emissiveIntensity = 0; m.userData.front.material.opacity = 0; ex.back1.add(m); return m; });
  ex.panel = cutMesh(pagesCache.wall); ex.panel.position.set(0, .002, .0095); ex.back1.add(ex.panel);
  ex.clock1 = new THREE.Group(); ex.clock1.position.set(.086, .2, .0112); ex.back1.add(ex.clock1);
  ex.clock1.add(cutMesh(A.wallClock({ rim: '#5d9a8c' })));
  ex.h1 = cutMesh(A.clockHand(.009, .0026)); ex.h1.position.z = .0008; ex.clock1.add(ex.h1);
  ex.m1 = cutMesh(A.clockHand(.0125, .0018)); ex.m1.position.z = .0012; ex.clock1.add(ex.m1);

  // shelf with mugs (left back) + split-flap sign + a reminder note on a string
  popper(L, 1, S, A.shelfUnit(), -.085, 0, .02);
  { const r = group(L, 1, S, -.085, .126, .034);
    add(r.g, A.flapFrame(), 0, 0, 0);
    ex.flapTop = add(r.g, A.flap('SPECKLED SKY', '#fbf2e2'), 0, .0035, .0012);
    const fl = new THREE.Group(); fl.position.set(0, -.0034, .0014); r.g.add(fl);
    const a = cutMesh(A.flap('STOCK OK', '#d8efd0')), b = cutMesh(A.flap('SELLING FAST', '#ffd7cf', '#8a2b1d')); b.rotation.x = Math.PI; b.position.z = -.0002;
    fl.add(a, b); ex.flap = fl; ex.flapA = a; ex.flapB = b; }
  ex.note = new THREE.Group(); S.add(ex.note); ex.note.add(cutMesh(A.note('Order more clay'))); ex.noteThread = thread(.12); ex.note.add(ex.noteThread); ex.note.visible = false;

  // packing table with conveyor belt, label printer, parcels
  popper(L, 1, S, A.packTable(), .075, 0, .074);
  ex.printer = popper(L, 1, S, A.printer(), .108, .026, .07, { dir: 1 });
  ex.beltG = new THREE.Group(); ex.beltG.position.set(.068, .026, .0705); S.add(ex.beltG);
  ex.parcels = [...Array(6)].map((_, i) => { const g = new THREE.Group(); g.add(cutMesh(A.parcel(31 + i))); S.add(g); g.visible = false; return g; });
  ex.labels = [...Array(6)].map(() => { const m = cutMesh(A.label()); S.add(m); m.visible = false; return m; });

  // work table: phone + gear + envelopes, hero mug + tag post
  ex.table1 = popper(L, 1, S, A.table(.092, .02, { drawer: false }), -.06, 0, .152);
  ex.phone1 = popper(L, 1, S, A.phone({ badge: 0 }), -.046, .02, .148, { dir: 1, s: .78 });
  ex.gear = cutMesh(A.gearWheel()); ex.gearG = new THREE.Group(); ex.gearG.position.set(-.0325, .0285, .1476); ex.gearG.add(ex.gear); S.add(ex.gearG);
  ex.envs = [...Array(4)].map(() => { const m = cutMesh(A.envelope()); S.add(m); m.visible = false; return m; });
  ex.mug1 = popper(L, 1, S, A.mugProp(.0105), -.064, .02, .1485, { dir: 1 });
  ex.stamp = cutMesh(A.stampCheck()); S.add(ex.stamp); ex.stamp.visible = false;

  // potter's wheel + stool (Mira sits between them)
  ex.stool = popper(L, 1, S, A.stool(), .07, 0, .193);
  ex.wheel = popper(L, 1, S, A.wheelUnit(), .07, 0, .206);
  // armchair: back card behind the sitter, front card in front
  ex.chairBack = popper(L, 1, S, A.armchair('back'), -.078, 0, .257, { fold: 1.2 });
  ex.chairFront = popper(L, 1, S, A.armchair('front'), -.078, 0, .274, { fold: 1.2 });

  // the four pull-tabs along the front page edge (lie flat, slide out towards the reader)
  const TC = [[C.red, C.redS], ['#5d9a8c', '#4a7f73'], [C.goldS, '#b8851d'], ['#6d72b8', '#555a9c']];
  ex.tabs = ['MESSAGES', 'LISTINGS', 'STOCK', 'ORDERS'].map((w, i) => {
    const m = cutMesh(A.pullTab(w, TC[i][0], TC[i][1])); const g = new THREE.Group(); g.add(m);
    m.rotation.x = -Math.PI / 2; g.position.set(-.0975 + i * .065, -.0012, BD - .004); S.add(g); g.visible = false; return g;
  });
  return { L, ex };
}
let pagesCache = {};
export function setPagesCache(P) { pagesCache = P; }
