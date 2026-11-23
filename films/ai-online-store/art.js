// All paper-cut art for "One Pair of Hands": Mira, the cat, the night kitchen, the workshop and its mechanisms.
// Drawing conventions follow the style (STYLE.md §2): one dark-brown ink, thick outline + thin detail line, crescent shading,
// slightly wobbly shapes, white border + grey card edge + grain from paper.js finishCut().
import { mulberry, TAU, clamp, lerp } from './lib.js';
import { cv, finishCut, sh, blob, smoothClosed, smoothOpen, crescent, INK, rr } from './paper.js';

export const LW = 9, LW2 = 5;
const PPM = 5200;                      // pixels per metre for static props
export { PPM };

// ---------- palette ----------
export const C = {
  ink: INK, paper: '#fffdf7',
  // night kitchen
  nWall: '#33407e', nWall2: '#3c4b90', nPat: 'rgba(160,150,230,.22)', nFloor: '#5b3e57', nFloor2: '#4c334a', nRug: '#8577c4', nRugS: '#6d5fae',
  nSky: '#1a2250', moon: '#ffe39a', lamp: '#ffd27a', lampS: '#f0b44a',
  // workshop
  wall: '#f3dcc0', wallS: '#e7c7a3', tile: '#d98a5b', tileS: '#c4744a', wood: '#c08a55', woodS: '#9c6a3c', woodD: '#7e5230',
  sage: '#9cc28f', sageS: '#7aa56d', mug: '#7fb6dc', mugS: '#5a95c2', speck: '#2f5d86', clay: '#c98c66', clayS: '#a96e4c',
  red: '#e0533f', redS: '#b93c2c', gold: '#f2c14e', goldS: '#d49d2a', cream: '#fbf2e2', creamS: '#eadbc0',
  sky: '#8fd2f2', skyS: '#6fbbe3', card: '#f7efe0', box: '#d9a86c', boxS: '#bb8a50',
  // Mira
  skin: '#b07650', skinS: '#8e5a3b', hair: '#2b1c17', hairS: '#160d0a', shirt: '#82c6ea', shirtS: '#5ea6d1',
  apron: '#e9b745', apronS: '#c9962b', pants: '#33447a', pantsS: '#263361', shoe: '#7b4a2b', cheek: 'rgba(230,110,95,.38)', pencil: '#f2b632',
  // cat
  cat: '#f2a24c', catS: '#d6822f', catD: '#c0661f', catB: '#fbe5c4',
};

// static cut-out: canvas + world size (metres) + anchor (default bottom centre)
export function cut(wm, hm, draw, o = {}) {
  const ppm = o.ppm ?? PPM, pad = o.pad ?? 30, w = Math.ceil(wm * ppm) + pad * 2, h = Math.ceil(hm * ppm) + pad * 2;
  const c = cv(w, h), x = c.getContext('2d'); x.translate(pad, pad);
  draw(x, w - pad * 2, h - pad * 2, ppm);
  const out = o.raw ? c : finishCut(c, o.border ?? 14 * ppm / PPM, o);
  return { c: out, w: w / ppm, h: h / ppm, ax: o.ax ?? .5, ay: o.ay ?? 1 - pad / h, pad, ppm };
}

// wobbly rounded box path
function wbox(x, px, py, w, h, r, seed = 1, wob = 2.5) {
  const R = mulberry(seed), pts = [], n = 10;
  const corner = (cx, cy, a0) => { for (let i = 0; i <= 3; i++) { const a = a0 + i / 3 * Math.PI / 2; pts.push([cx + Math.cos(a) * r + (R() - .5) * wob, cy + Math.sin(a) * r + (R() - .5) * wob]); } };
  corner(px + w - r, py + r, -Math.PI / 2); corner(px + w - r, py + h - r, 0); corner(px + r, py + h - r, Math.PI / 2); corner(px + r, py + r, Math.PI);
  x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]); x.closePath();
}
function shadeBox(x, px, py, w, h, r, base, shade, seed = 1, dx = 14, dy = 10) {
  const p = () => wbox(x, px, py, w, h, r, seed);
  crescent(x, p, shade, dx, dy, base); p(); sh(x, null, LW);
}
function txt(x, s, px, py, font, col, align = 'center', base = 'middle') { x.font = font; x.fillStyle = col; x.textAlign = align; x.textBaseline = base; x.fillText(s, px, py); }
function speckles(x, px, py, w, h, n, col, seed, r0 = 2.5, r1 = 6) {
  const R = mulberry(seed); x.fillStyle = col;
  for (let i = 0; i < n; i++) { x.beginPath(); x.arc(px + R() * w, py + R() * h, r0 + R() * (r1 - r0), 0, TAU); x.fill(); }
}

// ---------- a mug (used on shelves, tables, in the story) ----------
export function drawMug(x, cx, by, w, h, col, shade, o = {}) {
  // body
  const body = () => { x.beginPath(); x.moveTo(cx - w / 2, by - h); x.bezierCurveTo(cx - w / 2 - w * .04, by - h * .3, cx - w * .44, by, cx - w * .34, by); x.lineTo(cx + w * .34, by); x.bezierCurveTo(cx + w * .44, by, cx + w / 2 + w * .04, by - h * .3, cx + w / 2, by - h); x.closePath(); };
  // handle
  x.beginPath(); x.ellipse(cx + w * .5, by - h * .52, w * .2, h * .26, 0, -Math.PI / 2, Math.PI / 2); x.lineWidth = Math.max(10, w * .13); x.strokeStyle = INK; x.stroke(); x.lineWidth = Math.max(5, w * .08); x.strokeStyle = col; x.stroke();
  crescent(x, body, shade, w * .12, 0, col); body(); sh(x, null, o.lw ?? LW);
  // raw clay foot
  x.save(); body(); x.clip(); x.fillStyle = o.foot ?? C.clay; x.fillRect(cx - w, by - h * .16, w * 2, h * .2); x.restore();
  x.beginPath(); x.moveTo(cx - w * .45, by - h * .16); x.lineTo(cx + w * .45, by - h * .16); x.lineWidth = LW2; x.strokeStyle = INK; x.stroke();
  if (o.speck !== false) { x.save(); body(); x.clip(); speckles(x, cx - w / 2, by - h, w, h * .8, Math.round(w * .5), o.speckCol ?? C.speck, o.seed ?? 3, 1.6, 4); x.restore(); }
  // rim
  x.beginPath(); x.ellipse(cx, by - h, w / 2, h * .09, 0, 0, TAU); sh(x, shade, o.lw2 ?? LW2);
}

// ======================= MIRA =======================
// Canvas 760 × 1400 px, feet at the bottom centre; 4.6 cm tall standing → about 30 400 px/m.
export const MIRA_W = 1100, MIRA_H = 1400, MIRA_FOOT = 1372, MIRA_CX = 550;
function limb(x, px, py, a, len, w, fill, end) {
  x.save(); x.translate(px, py); x.rotate(a);
  rr(x, -w / 2, -w * .3, w, len + w * .3, w / 2); sh(x, fill, LW2 + 1);
  x.restore();
  return [px - Math.sin(a) * len, py + Math.cos(a) * len];
}
// arm from shoulder to elbow to hand, given as canvas points: upper arm in the shirt colour, forearm and hand in skin
function seg2(x, a, b, w, fill) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ang = Math.atan2(dx, -dy) + Math.PI;
  x.save(); x.translate(a[0], a[1]); x.rotate(ang); rr(x, -w / 2, -w * .3, w, len + w * .3, w / 2); sh(x, fill, LW2 + 1); x.restore();
}
function arm(x, s, e, h) {
  seg2(x, s, e, 66, C.shirt); seg2(x, e, h, 54, C.skin);
  x.beginPath(); x.arc(h[0], h[1], 34, 0, TAU); sh(x, C.skin, LW2 + 1);
  return h;
}
function leg(x, hx, hy, a, len, lift = 0) {
  x.save(); x.translate(hx, hy); x.rotate(a);
  rr(x, -40, -10, 80, len - lift, 34); sh(x, C.pants, LW2 + 1);
  blob(x, 14, len - lift + 6, 58, 30, .03, 5); sh(x, C.shoe, LW2 + 1);
  x.restore();
}
function eye(x, ex, ey, p, side) {
  const { eyes = 'open', blink = 0, look = [0, 0] } = p;
  x.lineCap = 'round'; x.strokeStyle = INK;
  if (eyes === 'happy') { x.beginPath(); x.moveTo(ex - 26, ey + 8); x.quadraticCurveTo(ex, ey - 30, ex + 26, ey + 8); x.lineWidth = 10; x.stroke(); return; }
  if (eyes === 'closed' || blink > .85) { x.beginPath(); x.moveTo(ex - 26, ey); x.quadraticCurveTo(ex, ey + 16, ex + 26, ey); x.lineWidth = 9; x.stroke(); return; }
  const big = eyes === 'wide' ? 1.15 : 1, ry = 30 * big * (1 - blink * .9), rx = 19 * big, lx = ex + look[0] * 7, ly = ey + look[1] * 8;
  x.beginPath(); x.ellipse(lx, ly, rx, ry, 0, 0, TAU); x.fillStyle = INK; x.fill();
  if (ry > 12) { x.beginPath(); x.ellipse(lx - 6, ly - ry * .4, 7, 10, -.2, 0, TAU); x.fillStyle = '#fff'; x.fill(); }
  if (eyes === 'tired') {   // heavy lids
    x.save(); x.beginPath(); x.ellipse(lx, ly, rx + 4, ry + 4, 0, 0, TAU); x.clip(); x.fillStyle = C.skin; x.fillRect(lx - 40, ly - 50, 80, 46); x.restore();
    x.beginPath(); x.moveTo(lx - rx - 4, ly - 6); x.quadraticCurveTo(lx, ly - 2, lx + rx + 4, ly - 6); x.lineWidth = 7; x.stroke();
  }
}
function brows(x, cx, by, kind) {
  // kind: neutral | tired (inner ends up: worried-tired) | up (surprise) | firm (straight, set)
  x.lineCap = 'round'; x.strokeStyle = C.hair; x.lineWidth = 11;
  for (const s of [-1, 1]) {
    const ox = cx + s * 72, inner = ox - s * 26, outer = ox + s * 26;
    let yi = by, yo = by;
    if (kind === 'tired') { yi = by - 10; yo = by + 6; }
    else if (kind === 'up') { yi = by - 16; yo = by - 12; }
    else if (kind === 'firm') { yi = by + 2; yo = by - 2; }
    x.beginPath(); x.moveTo(inner, yi); x.quadraticCurveTo(ox, Math.min(yi, yo) - 8, outer, yo); x.stroke();
  }
}
function mouth(x, mx, my, kind) {
  x.lineCap = 'round'; x.strokeStyle = INK; x.lineJoin = 'round';
  if (kind === 'smile') { x.beginPath(); x.moveTo(mx - 30, my - 4); x.quadraticCurveTo(mx, my + 26, mx + 30, my - 4); x.lineWidth = 8; x.stroke(); }
  else if (kind === 'grin' || kind === 'open') {
    const h = kind === 'grin' ? 30 : 40;
    x.beginPath(); x.moveTo(mx - 36, my - 8); x.quadraticCurveTo(mx, my + h * 1.5, mx + 36, my - 8); x.closePath(); sh(x, '#7a2626', 7);
    x.save(); x.clip(); x.beginPath(); x.ellipse(mx, my + h * .85, 20, 13, 0, 0, TAU); x.fillStyle = '#e56b6b'; x.fill(); x.restore();
  }
  else if (kind === 'o') { x.beginPath(); x.ellipse(mx, my + 6, 12, 16, 0, 0, TAU); sh(x, '#7a2626', 6); }
  else if (kind === 'flat') { x.beginPath(); x.moveTo(mx - 22, my + 4); x.quadraticCurveTo(mx, my + 1, mx + 22, my + 6); x.lineWidth = 7; x.stroke(); }
  else if (kind === 'sigh') { x.beginPath(); x.moveTo(mx - 24, my + 8); x.quadraticCurveTo(mx - 8, my, mx + 4, my + 6); x.quadraticCurveTo(mx + 14, my + 11, mx + 24, my + 4); x.lineWidth = 7; x.stroke(); }
  else if (kind === 'set') { x.beginPath(); x.moveTo(mx - 24, my + 3); x.lineTo(mx + 24, my + 1); x.lineWidth = 8; x.stroke(); }
  else if (kind === 'sleep') { x.beginPath(); x.ellipse(mx, my + 6, 8, 10, 0, 0, TAU); sh(x, '#7a2626', 5); }
}
function miraHead(x, hx, hy, p) {
  const { tilt = 0, eyes = 'open', brow = 'neutral', mouthK = 'smile' } = p;
  x.save(); x.translate(hx, hy); x.rotate(tilt); x.translate(-hx, -hy);
  // bun + pencil (behind the head)
  x.save(); x.translate(hx + 10, hy - 250); x.rotate(-.5);
  rr(x, -12, -150, 24, 300, 10); sh(x, C.pencil, LW2); x.beginPath(); x.moveTo(-12, 150); x.lineTo(0, 196); x.lineTo(12, 150); x.closePath(); sh(x, '#efd2a2', LW2);
  x.restore();
  const bun = () => { blob(x, hx + 6, hy - 238, 92, 84, .05, 31); };
  crescent(x, bun, C.hairS, 18, 14, C.hair); bun(); sh(x, null, LW);
  // back hair (behind the face, to the jaw)
  const back = () => { blob(x, hx, hy + 6, 196, 214, .04, 32); };
  back(); sh(x, C.hair, LW);
  // face
  const face = () => { blob(x, hx, hy + 30, 158, 168, .025, 33); };
  crescent(x, face, C.skinS, 24, 18, C.skin); face(); sh(x, null, LW);
  // ears
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(hx + s * 158, hy + 48, 24, 34, 0, 0, TAU); sh(x, C.skin, LW2 + 1); }
  // fringe: swept hair over the forehead
  x.beginPath(); x.moveTo(hx - 190, hy + 30); x.bezierCurveTo(hx - 200, hy - 150, hx - 60, hy - 210, hx + 40, hy - 196);
  x.bezierCurveTo(hx + 150, hy - 186, hx + 206, hy - 110, hx + 192, hy + 20); x.bezierCurveTo(hx + 160, hy - 60, hx + 90, hy - 96, hx + 30, hy - 92);
  x.bezierCurveTo(hx - 40, hy - 88, hx - 120, hy - 70, hx - 150, hy - 10); x.closePath(); sh(x, C.hair, LW);
  x.beginPath(); x.moveTo(hx - 120, hy - 150); x.quadraticCurveTo(hx - 40, hy - 170, hx + 60, hy - 150); x.lineWidth = 5; x.strokeStyle = '#4a352c'; x.stroke();
  // features
  x.beginPath(); x.ellipse(hx - 100, hy + 92, 30, 18, 0, 0, TAU); x.ellipse(hx + 100, hy + 92, 30, 18, 0, 0, TAU); x.fillStyle = C.cheek; x.fill();
  brows(x, hx, hy - 36, brow);
  eye(x, hx - 66, hy + 30, p, -1); eye(x, hx + 66, hy + 30, p, 1);
  x.beginPath(); x.moveTo(hx + 6, hy + 66); x.quadraticCurveTo(hx + 18, hy + 86, hx + 2, hy + 94); x.lineWidth = 6; x.strokeStyle = C.skinS; x.lineCap = 'round'; x.stroke();
  mouth(x, hx + 2, hy + 132, mouthK);
  x.restore();
}
function miraTorso(x, cx, top, bottom, lean = 0) {
  const sw = 132;   // half shoulder width
  const shirt = () => { x.beginPath(); x.moveTo(cx - sw, top + 30); x.quadraticCurveTo(cx - sw - 6, top, cx - sw + 40, top - 6); x.lineTo(cx + sw - 40, top - 6); x.quadraticCurveTo(cx + sw + 6, top, cx + sw, top + 30);
    x.bezierCurveTo(cx + sw + 4, top + 160, cx + sw - 10, bottom - 60, cx + sw - 16, bottom); x.lineTo(cx - sw + 16, bottom); x.bezierCurveTo(cx - sw + 10, bottom - 60, cx - sw - 4, top + 160, cx - sw, top + 30); x.closePath(); };
  crescent(x, shirt, C.shirtS, 22, 0, C.shirt); shirt(); sh(x, null, LW);
  // collar
  x.beginPath(); x.moveTo(cx - 52, top - 4); x.lineTo(cx, top + 46); x.lineTo(cx + 52, top - 4); x.lineWidth = LW2; x.strokeStyle = INK; x.stroke();
  // apron (bib + skirt), clay smudges
  const apron = () => { x.beginPath(); x.moveTo(cx - 84, top + 70); x.lineTo(cx + 84, top + 70); x.lineTo(cx + 92, top + 200); x.bezierCurveTo(cx + 150, top + 230, cx + 150, bottom + 120, cx + 140, bottom + 160);
    x.lineTo(cx - 140, bottom + 160); x.bezierCurveTo(cx - 150, bottom + 120, cx - 150, top + 230, cx - 92, top + 200); x.closePath(); };
  crescent(x, apron, C.apronS, 20, 0, C.apron); apron(); sh(x, null, LW);
  x.beginPath(); x.moveTo(cx - 84, top + 70); x.lineTo(cx - 104, top - 2); x.moveTo(cx + 84, top + 70); x.lineTo(cx + 104, top - 2); x.lineWidth = 12; x.strokeStyle = C.apronS; x.stroke();
  rr(x, cx - 52, top + 250, 104, 70, 12); sh(x, C.apronS, LW2);   // pocket
  x.fillStyle = 'rgba(176,122,85,.55)'; for (const [a, b, r] of [[-60, 140, 16], [40, 330, 20], [70, 352, 9], [-30, 380, 12]]) { x.beginPath(); x.ellipse(cx + a, top + b, r * 1.4, r, .4, 0, TAU); x.fill(); }
}

// p: {mode:'stand'|'sit', walk, stride, armL:{e:[dx,dy],h:[dx,dy]}, armR:{…} (offsets from each shoulder, canvas px), tilt, eyes, brow, mouth, blink, look, hold:'phone'|null}
export const ARM_REST = { L: { e: [-16, 182], h: [-20, 340] }, R: { e: [16, 182], h: [20, 340] } };
export function drawMira(x, p = {}) {
  const { mode = 'stand', walk = 0, stride = 0, hold = null } = p;
  const armL = p.armL || ARM_REST.L, armR = p.armR || ARM_REST.R;
  x.clearRect(0, 0, MIRA_W, MIRA_H);
  const W = cv(MIRA_W, MIRA_H), a = W.getContext('2d');
  const cx = MIRA_CX, sit = mode === 'sit';
  const hipY = sit ? 1010 : 930, top = sit ? 640 : 560, headY = sit ? 410 : 330;
  if (sit) {
    for (const s of [-1, 1]) { a.save(); a.translate(cx + s * 62, hipY); rr(a, -46, -20, 92, 120, 38); sh(a, C.pants, LW2 + 1); a.restore(); leg(a, cx + s * 66, hipY + 90, s * .06, 250); }
  } else {
    const sw = Math.sin(walk) * stride;
    leg(a, cx - 56, hipY, sw * .42, 410, Math.max(0, -Math.sin(walk)) * stride * 26);
    leg(a, cx + 56, hipY, -sw * .42, 410, Math.max(0, Math.sin(walk)) * stride * 26);
  }
  miraTorso(a, cx, top, hipY - (sit ? 60 : 0));
  const sL = [cx - 128, top + 30], sR = [cx + 128, top + 30];
  const P = (s, o) => [s[0] + o[0], s[1] + o[1]];
  const hL = arm(a, sL, P(sL, armL.e), P(sL, armL.h)), hR = arm(a, sR, P(sR, armR.e), P(sR, armR.h));
  if (hold === 'phone') {  // phone between the two hands, held up to take a photo
    const px = (hL[0] + hR[0]) / 2, py = (hL[1] + hR[1]) / 2 - 30;
    rr(a, px - 62, py - 104, 124, 200, 18); sh(a, '#2b2f3a', LW2 + 1); rr(a, px - 48, py - 88, 96, 162, 8); sh(a, '#cfeaf7', 4);
    for (const h of [hL, hR]) { a.beginPath(); a.arc(h[0], h[1], 34, 0, TAU); sh(a, C.skin, LW2 + 1); }
  }
  miraHead(a, cx, headY, { tilt: p.tilt || 0, eyes: p.eyes || 'open', brow: p.brow || 'neutral', mouthK: p.mouth || 'smile', blink: p.blink || 0, look: p.look || [0, 0] });
  x.drawImage(finishCut(W, 18, { grainA: .6, fast: true }), 0, 0);
}

// ======================= THE CAT =======================
export const CAT_W = 620, CAT_H = 420;
export function drawCat(x, p = {}) {
  const { breathe = 0, ear = 0, tail = 0 } = p;
  x.clearRect(0, 0, CAT_W, CAT_H);
  const W = cv(CAT_W, CAT_H), a = W.getContext('2d');
  // tail curled around the front
  a.beginPath(); a.moveTo(470, 330); a.bezierCurveTo(560, 330, 570, 230 - tail * 30, 520, 200 - tail * 40); a.lineWidth = 54; a.strokeStyle = INK; a.lineCap = 'round'; a.stroke(); a.lineWidth = 40; a.strokeStyle = C.cat; a.stroke();
  // body loaf
  const body = () => { blob(a, 300, 270 - breathe * 6, 220, 120 + breathe * 6, .03, 51); };
  crescent(a, body, C.catS, 26, 20, C.cat); body(); sh(a, null, LW);
  a.strokeStyle = C.catD; a.lineWidth = 12; a.lineCap = 'round';
  for (const xx of [230, 300, 370]) { a.beginPath(); a.moveTo(xx, 160); a.quadraticCurveTo(xx + 14, 200, xx + 4, 236); a.stroke(); }
  // head resting on the paws (left side), eyes closed
  const head = () => { blob(a, 150, 250, 105, 92, .03, 52); };
  // ears
  for (const [ex, k] of [[92, 0], [196, 1]]) { a.save(); a.translate(ex, 182); a.rotate((k ? .25 : -.25) + (k ? ear * .25 : 0)); a.beginPath(); a.moveTo(-40, 20); a.lineTo(0, -62); a.lineTo(40, 20); a.closePath(); sh(a, C.cat, LW2 + 1); a.beginPath(); a.moveTo(-18, 10); a.lineTo(0, -34); a.lineTo(18, 10); a.closePath(); a.fillStyle = '#f5b7a3'; a.fill(); a.restore(); }
  crescent(a, head, C.catS, 18, 16, C.cat); head(); sh(a, null, LW);
  a.strokeStyle = INK; a.lineWidth = 8; a.lineCap = 'round';
  for (const ex of [112, 186]) { a.beginPath(); a.moveTo(ex - 20, 250); a.quadraticCurveTo(ex, 264, ex + 20, 250); a.stroke(); }
  a.beginPath(); a.moveTo(140, 282); a.lineTo(158, 282); a.lineTo(149, 292); a.closePath(); a.fillStyle = '#d9776a'; a.fill();
  a.lineWidth = 4; for (const s of [-1, 1]) for (const dy of [-6, 8]) { a.beginPath(); a.moveTo(149 + s * 30, 290 + dy * .3); a.lineTo(149 + s * 80, 284 + dy); a.stroke(); }
  // paws
  for (const px of [120, 200]) { a.beginPath(); a.ellipse(px, 352, 44, 26, 0, 0, TAU); sh(a, C.catB, LW2 + 1); }
  x.drawImage(finishCut(W, 16, { grainA: .6 }), 0, 0);
}

// ======================= PROPS: shared =======================
// Paper phone on a little stand (front view), high resolution for macro shots
export function phone(o = {}) {
  return cut(.0135, .021, (x, W, H, ppm) => {
    const bw = W * .78, bh = H * .82, bx = (W - bw) / 2, by = 0;
    // stand
    x.beginPath(); x.moveTo(W * .2, H); x.lineTo(W * .34, by + bh * .7); x.lineTo(W * .66, by + bh * .7); x.lineTo(W * .8, H); x.closePath(); sh(x, o.stand ?? '#c9b18f', LW);
    rr(x, bx, by, bw, bh, bw * .16); sh(x, '#2d3140', LW + 2);
    const sx = bx + bw * .09, sy = by + bh * .08, sw = bw * .82, shh = bh * .8;
    rr(x, sx, sy, sw, shh, bw * .08); sh(x, o.screen ?? '#eef7fb', LW2);
    // a tiny shop app: header, a mug thumbnail, message rows
    x.save(); rr(x, sx, sy, sw, shh, bw * .08); x.clip();
    x.fillStyle = o.night ? '#5a6fb8' : '#e0533f'; x.fillRect(sx, sy, sw, shh * .16);
    drawMug(x, sx + sw * .5, sy + shh * .46, sw * .34, shh * .2, C.mug, C.mugS, { lw: 7, lw2: 4, seed: 7 });
    for (let i = 0; i < 3; i++) { x.fillStyle = i ? 'rgba(60,60,80,.22)' : 'rgba(60,60,80,.35)'; rr(x, sx + sw * .1, sy + shh * (.58 + i * .12), sw * .8, shh * .07, 8); x.fill(); }
    x.restore();
    if (o.badge) { x.beginPath(); x.arc(bx + bw * .9, by + bh * .06, bw * .16, 0, TAU); sh(x, C.red, LW2); txt(x, String(o.badge), bx + bw * .9, by + bh * .065, `700 ${Math.round(bw * .2)}px Fredoka`, '#fff'); }
  }, { ppm: 26000, border: 26 });
}
// mug standing on a table, as a prop card
export function mugProp(h = .012, col = C.mug, shade = C.mugS, seed = 3, ppm = 12000) {
  return cut(h * 1.25, h * 1.02, (x, W, H) => drawMug(x, W * .44, H, W * .72, H * .98, col, shade, { seed }), { ppm, border: 16 * ppm / PPM * .6 });
}
// table (front view): top band + legs
export function table(wm, hm, o = {}) {
  return cut(wm, hm, (x, W, H) => {
    const t = H * .16;
    for (const lx of [W * .08, W * .86]) { const p = () => wbox(x, lx, t * .6, W * .06, H - t * .6, 10, lx | 0); crescent(x, p, C.woodS, 10, 0, o.col ?? C.wood); p(); sh(x, null, LW); }
    if (o.drawer) { shadeBox(x, W * .3, t * .9, W * .4, H * .16, 10, o.col ?? C.wood, o.shade ?? C.woodS, 4); x.beginPath(); x.arc(W * .5, t * .9 + H * .08, 10, 0, TAU); sh(x, C.gold, 4); }
    shadeBox(x, 0, 0, W, t, 12, o.col ?? C.wood, o.shade ?? C.woodS, 2, 16, 12);
    x.strokeStyle = 'rgba(80,50,30,.35)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(W * .05, t * (.35 + i * .2)); x.quadraticCurveTo(W * .5, t * (.25 + i * .22), W * .95, t * (.38 + i * .2)); x.stroke(); }
  });
}

// ======================= SPREAD 0: THE NIGHT KITCHEN =======================
export function sideboard() {
  return cut(.2, .06, (x, W, H) => {
    shadeBox(x, 0, H * .12, W, H * .88, 16, '#6a5aa6', '#54468e', 11);
    for (let i = 0; i < 3; i++) { shadeBox(x, W * (.05 + i * .31), H * .24, W * .28, H * .64, 12, '#7d6db8', '#6656a0', 12 + i); x.beginPath(); x.arc(W * (.19 + i * .31), H * .4, 9, 0, TAU); sh(x, C.gold, 4); }
    // kettle, jar, a plant
    const k = () => { x.beginPath(); x.ellipse(W * .2, H * .02, W * .07, H * .12, 0, 0, TAU); };
    crescent(x, k, '#c9c2d8', 12, 8, '#e9e4f0'); k(); sh(x, null, LW);
    rr(x, W * .55, -H * .14, W * .07, H * .26, 10); sh(x, '#ffd9a0', LW2 + 2);
    x.beginPath(); x.moveTo(W * .82, H * .12); x.lineTo(W * .78, -H * .06); x.lineTo(W * .9, -H * .06); x.lineTo(W * .86, H * .12); x.closePath(); sh(x, C.clay, LW2 + 1);
    for (const [ax, ay] of [[-.5, -.4], [0, -.48], [.5, -.38], [-.25, -.3], [.3, -.28]]) { x.beginPath(); x.ellipse(W * (.84 + ax * .06), H * (-.06 + ay * .4), 14, 30, ax, 0, TAU); sh(x, '#6fa86a', LW2); }
  }, { ay: .97 });
}
export function lamp0() {
  return cut(.022, .03, (x, W, H) => {
    x.beginPath(); x.moveTo(W * .5, H * .4); x.lineTo(W * .5, H * .95); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = '#8a6a4a'; x.stroke();
    x.beginPath(); x.ellipse(W * .5, H * .96, W * .3, H * .05, 0, 0, TAU); sh(x, '#8a6a4a', LW2);
    x.beginPath(); x.moveTo(W * .22, H * .42); x.lineTo(W * .32, H * .06); x.lineTo(W * .68, H * .06); x.lineTo(W * .78, H * .42); x.closePath(); sh(x, C.lamp, LW);
    x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.moveTo(W * .34, H * .38); x.lineTo(W * .4, H * .1); x.lineTo(W * .46, H * .1); x.lineTo(W * .42, H * .38); x.closePath(); x.fill();
  }, { ppm: 12000 });
}
export function laptopBack() {
  return cut(.03, .02, (x, W, H) => {
    rr(x, W * .06, 0, W * .88, H * .86, 18); sh(x, '#b9bfcc', LW);
    x.beginPath(); x.arc(W * .5, H * .43, H * .12, 0, TAU); x.fillStyle = 'rgba(255,255,255,.55)'; x.fill();
    rr(x, 0, H * .86, W, H * .14, 8); sh(x, '#9aa1b0', LW2 + 2);
  }, { ppm: 9000 });
}
export function aiTab() {
  // a paper lever standing up out of a slot in the tabletop: a pull-ring and the word AI
  return cut(.011, .016, (x, W, H, ppm) => {
    rr(x, W * .42, H * .32, W * .16, H * .68, 8); sh(x, C.cream, LW2 + 1);
    shadeBox(x, W * .05, H * .02, W * .9, H * .42, 26, C.gold, C.goldS, 21, 10, 8);
    txt(x, 'AI', W * .5, H * .25, `700 ${Math.round(H * .3)}px "Lilita One"`, INK);
    x.beginPath(); x.arc(W * .5, H * .62, W * .14, 0, TAU); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = C.red; x.stroke();
  }, { ppm: 16000 });
}
export function wallClock(o = {}) {   // face only; hands are separate cards (clockHand)
  return cut(.034, .034, (x, W, H) => {
    const r = W / 2; x.beginPath(); x.arc(r, r, r * .98, 0, TAU); sh(x, o.rim ?? C.red, LW);
    x.beginPath(); x.arc(r, r, r * .8, 0, TAU); sh(x, o.face ?? C.cream, LW2);
    x.strokeStyle = INK; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.lineWidth = i % 3 ? 5 : 10; x.beginPath(); x.moveTo(r + Math.cos(a) * r * .62, r + Math.sin(a) * r * .62); x.lineTo(r + Math.cos(a) * r * .74, r + Math.sin(a) * r * .74); x.stroke(); }
  }, { ay: .5 });
}
export function clockHand(len, w, col = INK) {
  return cut(w, len * 1.18, (x, W, H) => { x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W * .9, H * .82); x.lineTo(W / 2, H); x.lineTo(W * .1, H * .82); x.closePath(); x.fillStyle = col; x.fill(); }, { ppm: 9000, border: 0, ay: .85, grain: false });
}
// chore cards (each one job)
export function choreCard(kind, seed = 1) {
  const R = mulberry(seed);
  return cut(.026, .016, (x, W, H) => {
    x.save(); x.translate(W / 2, H / 2); x.rotate((R() - .5) * .08); x.translate(-W / 2, -H / 2);
    const cols = { msg: ['#fbf2e2', '#eadbc0'], tag: ['#ffe0a3', '#f0c56c'], mug: ['#dff0fb', '#bcdcf0'], box: ['#f3d2a5', '#ddb27a'] }[kind] ?? ['#fbf2e2', '#eadbc0'];
    shadeBox(x, 0, 0, W, H, 18, cols[0], cols[1], seed, 10, 8);
    const ix = W * .26, iy = H * .5, s = H * .55;
    if (kind === 'msg') { rr(x, ix - s * .55, iy - s * .38, s * 1.1, s * .76, 6); sh(x, '#fff', LW2); x.beginPath(); x.moveTo(ix - s * .55, iy - s * .38); x.lineTo(ix, iy + s * .05); x.lineTo(ix + s * .55, iy - s * .38); x.lineWidth = LW2; x.stroke(); }
    if (kind === 'tag') { x.beginPath(); x.moveTo(ix - s * .5, iy - s * .3); x.lineTo(ix + s * .3, iy - s * .3); x.lineTo(ix + s * .6, iy); x.lineTo(ix + s * .3, iy + s * .3); x.lineTo(ix - s * .5, iy + s * .3); x.closePath(); sh(x, C.red, LW2); x.beginPath(); x.arc(ix + s * .25, iy, s * .08, 0, TAU); sh(x, '#fff', 3); }
    if (kind === 'mug') drawMug(x, ix, iy + s * .45, s * .8, s * .9, C.mug, C.mugS, { lw: 6, lw2: 4 });
    if (kind === 'box') { shadeBox(x, ix - s * .5, iy - s * .4, s, s * .8, 6, C.box, C.boxS, 5, 6, 4); x.beginPath(); x.moveTo(ix - s * .5, iy - s * .1); x.lineTo(ix + s * .5, iy - s * .1); x.lineWidth = 4; x.stroke(); }
    x.strokeStyle = 'rgba(58,42,36,.55)'; x.lineWidth = 6; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(W * .52, H * (.3 + i * .2)); x.lineTo(W * (.86 - i * .1), H * (.3 + i * .2)); x.stroke(); }
    x.restore();
  }, { ppm: 9000 });
}
export function slip(seed) {   // a small to-do slip (receipt, sticky note)
  const R = mulberry(seed), cols = ['#fff6c7', '#ffd6e0', '#d9f0ff', '#fbf2e2', '#e2f5d6'], col = cols[seed % cols.length];
  return cut(.017, .011, (x, W, H) => {
    x.save(); x.translate(W / 2, H / 2); x.rotate((R() - .5) * .12); x.translate(-W / 2, -H / 2);
    wbox(x, 0, 0, W, H, 8, seed, 3); sh(x, col, LW2 + 1);
    x.strokeStyle = 'rgba(58,42,36,.5)'; x.lineWidth = 5; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(W * .14, H * (.28 + i * .22)); x.lineTo(W * (.8 - R() * .3), H * (.28 + i * .22)); x.stroke(); }
    x.restore();
  }, { ppm: 9000, border: 10 });
}
export function chair(col = '#7a5a9e', shade = '#634684') {   // a kitchen chair seen from the front, behind the sitter
  return cut(.03, .036, (x, W, H) => {
    for (const lx of [W * .1, W * .82]) { rr(x, lx, 0, W * .08, H, 8); sh(x, col, LW2 + 1); }
    shadeBox(x, W * .06, H * .02, W * .88, H * .16, 12, col, shade, 91, 8, 6);
    shadeBox(x, W * .04, H * .54, W * .92, H * .08, 8, col, shade, 92, 6, 4);
  });
}
export function catBox() {
  return cut(.05, .03, (x, W, H) => {
    shadeBox(x, 0, H * .3, W, H * .7, 10, C.box, C.boxS, 61, 14, 10);
    x.beginPath(); x.moveTo(0, H * .3); x.lineTo(-W * .08, H * .12); x.lineTo(W * .3, H * .12); x.lineTo(W * .34, H * .3); x.closePath(); sh(x, C.boxS, LW2 + 2);
    x.beginPath(); x.moveTo(W, H * .3); x.lineTo(W * 1.06, H * .14); x.lineTo(W * .7, H * .14); x.lineTo(W * .66, H * .3); x.closePath(); sh(x, C.boxS, LW2 + 2);
    rr(x, W * .34, H * .52, W * .32, H * .18, 6); sh(x, '#fff8ea', 4);
  }, { ay: .97 });
}

// ======================= SPREAD 1: THE WORKSHOP =======================
// the wall panel in front of the backdrop, with a window hole (the sky strip, sun, moon and town show through it)
export const WIN = { x0: -.05, x1: .05, y0: .175, y1: .275 };   // window opening in backdrop (sky) coordinates, metres
export function wallPanel(BW, BD) {
  const wm = BW - .008, hm = BD - .004;
  return cut(wm, hm, (x, W, H, ppm) => {
    const X = m => (m + wm / 2) * ppm, Y = m => (hm - m) * ppm;   // sky coords → canvas
    x.fillStyle = C.wall; x.fillRect(0, 0, W, H);
    const R = mulberry(71); for (let i = 0; i < 70; i++) { const px = R() * W, py = R() * H, r = 30 + R() * 140, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(${R() < .5 ? '190,130,90' : '255,255,255'},${.08 * R()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
    // skirting band
    x.fillStyle = C.wallS; x.fillRect(0, Y(.02), W, H);
    // window frame + sill
    const wx0 = X(WIN.x0), wx1 = X(WIN.x1), wy0 = Y(WIN.y1), wy1 = Y(WIN.y0), f = 34;
    rr(x, wx0 - f, wy0 - f, wx1 - wx0 + 2 * f, wy1 - wy0 + 2 * f, 22); sh(x, C.cream, LW);
    rr(x, wx0 - f - 22, wy1 + f - 6, wx1 - wx0 + 2 * f + 44, 40, 12); sh(x, C.creamS, LW);
    // the opening itself is cut out (transparent)
    x.save(); x.globalCompositeOperation = 'destination-out'; rr(x, wx0, wy0, wx1 - wx0, wy1 - wy0, 10); x.fill(); x.restore();
    rr(x, wx0, wy0, wx1 - wx0, wy1 - wy0, 10); x.lineWidth = LW; x.strokeStyle = INK; x.stroke();
    // mullions
    x.fillStyle = C.cream; x.fillRect((wx0 + wx1) / 2 - 9, wy0, 18, wy1 - wy0); x.fillRect(wx0, (wy0 + wy1) / 2 - 9, wx1 - wx0, 18);
    x.strokeStyle = INK; x.lineWidth = 4; x.strokeRect((wx0 + wx1) / 2 - 9, wy0, 18, wy1 - wy0); x.strokeRect(wx0, (wy0 + wy1) / 2 - 9, wx1 - wx0, 18);
    // a hanging plant and a framed print, for life
    x.strokeStyle = '#7b5a3a'; x.lineWidth = 4; x.beginPath(); x.moveTo(X(.088), Y(.3)); x.lineTo(X(.078), Y(.255)); x.moveTo(X(.088), Y(.3)); x.lineTo(X(.098), Y(.255)); x.stroke();
    x.beginPath(); x.ellipse(X(.088), Y(.25), 46, 30, 0, 0, Math.PI); sh(x, C.clay, LW2 + 1);
    for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(X(.088) + (i - 2.5) * 16, Y(.243) + 30 + (i % 2) * 22, 10, 30, (i - 2.5) * .2, 0, TAU); sh(x, C.sage, 4); }
    rr(x, X(-.112), Y(.29), 150, 110, 8); sh(x, C.cream, LW2 + 1); x.fillStyle = C.mug; x.beginPath(); x.ellipse(X(-.112) + 75, Y(.29) + 58, 34, 30, 0, 0, TAU); x.fill();
    // the shop's sign over the window
    rr(x, X(-.04), Y(.312) - 10, X(.04) - X(-.04), 70, 14); sh(x, C.red, LW2 + 2);
    txt(x, 'MIRA MAKES', X(0), Y(.312) + 26, `700 44px "Lilita One"`, '#fff');
  }, { border: 0, grain: true, grainA: .5 });
}
// the sky wheel (volvelle) behind the window: top half day with the sun, bottom half night with the moon; it turns half a
// revolution around the window's bottom centre, so the sun sets behind the rooftops and the moon comes up
export const DISC_R = .118;
export function skyDisc() {
  return cut(DISC_R * 2, DISC_R * 2, (x, W, H) => {
    const r = W / 2, cx = r, cy = r;
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
    let g = x.createLinearGradient(0, 0, 0, cy); g.addColorStop(0, '#79c6ee'); g.addColorStop(1, '#bfe8f7'); x.fillStyle = g; x.fillRect(0, 0, W, cy);
    g = x.createLinearGradient(0, cy, 0, H); g.addColorStop(0, '#2c3672'); g.addColorStop(1, '#141a40'); x.fillStyle = g; x.fillRect(0, cy, W, H - cy);
    // dusk bands at the two seams (left = evening side as it turns)
    for (const s of [-1, 1]) { const gg = x.createLinearGradient(cx + s * r, 0, cx + s * r * .55, 0); gg.addColorStop(0, s < 0 ? 'rgba(246,160,120,.85)' : 'rgba(250,200,150,.7)'); gg.addColorStop(1, 'rgba(246,160,120,0)'); x.fillStyle = gg; x.fillRect(Math.min(cx + s * r, cx + s * r * .55), 0, r * .45, H); }
    const R = mulberry(83);
    for (let i = 0; i < 90; i++) { const a = R() * Math.PI, d = r * (.25 + R() * .72); x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2 + R() * 5, 0, TAU); x.fillStyle = `rgba(255,248,220,${.4 + R() * .55})`; x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.75)'; for (const [ox, oy, sc] of [[-.45, -.55, 1], [.38, -.42, .8]]) for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(cx + ox * r + (k - 1.5) * 40 * sc, cy + oy * r - Math.sin(k / 3 * Math.PI) * 16 * sc, 34 * sc, 22 * sc, 0, 0, TAU); x.fill(); }
    x.restore();
    x.beginPath(); x.arc(cx, cy, r - 3, 0, TAU); x.lineWidth = LW; x.strokeStyle = INK; x.stroke();
    // sun (day half, upper middle) and moon (night half, mirrored)
    const sr = r * .17, sx = cx, sy = cy - r * .62;
    x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rad = i % 2 ? sr * 1.08 : sr * 1.36; x.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); } x.closePath(); sh(x, '#ffb84a', LW2);
    const d = () => { x.beginPath(); x.arc(sx, sy, sr * .9, 0, TAU); }; crescent(x, d, '#ffb02a', 10, 10, '#ffd84a'); d(); sh(x, null, LW);
    const mx = cx, my = cy + r * .62, mr = sr * 1.05;
    x.save(); x.translate(mx, my); x.rotate(Math.PI);
    x.beginPath(); x.arc(0, 0, mr, Math.PI * .3, Math.PI * 1.7, false); x.bezierCurveTo(-mr * .2, -mr * .8, -mr * .2, mr * .8, mr * .5, mr * .86); x.closePath(); sh(x, C.moon, LW);
    x.restore();
    x.beginPath(); x.arc(cx, cy, 16, 0, TAU); sh(x, '#b27a45', LW2);
  }, { border: 0, grain: true, grainA: .45, ay: .5 });
}
export function town() {   // rooftops of the customers' town, seen through the window; .wins = window centres in metres from the anchor
  const wm = .112, hm = .036, Wp = wm * PPM, Hp = hm * PPM, R = mulberry(91), cols = ['#e7a07a', '#9cc28f', '#f2c14e', '#b6a0d8', '#7fb6dc', '#e0533f'];
  const houses = []; let px = -10;
  while (px < Wp) { const w = 90 + R() * 70, h = Hp * (.45 + R() * .45); houses.push({ px, w, h, col: cols[(R() * cols.length) | 0], roof: 40 + R() * 30 }); px += w - 8; }
  const it = cut(wm, hm, (x, W, H) => {
    for (const o of houses) {
      x.beginPath(); x.moveTo(o.px, H); x.lineTo(o.px, H - o.h); x.lineTo(o.px + o.w / 2, H - o.h - o.roof); x.lineTo(o.px + o.w, H - o.h); x.lineTo(o.px + o.w, H); x.closePath(); sh(x, o.col, LW2 + 1);
      rr(x, o.px + o.w / 2 - 16, H - o.h + 30, 32, 36, 4); sh(x, '#5b4a6e', 4);
    }
  }, { border: 10 });
  it.wins = houses.filter(o => o.px + o.w / 2 > 20 && o.px + o.w / 2 < Wp - 20).map(o => [(o.px + o.w / 2) / PPM - wm / 2, (o.h - 48) / PPM]);
  return it;
}
export function shelfUnit() {
  return cut(.075, .115, (x, W, H) => {
    for (const px of [0, W - 26]) { rr(x, px, 0, 26, H, 6); sh(x, C.woodS, LW2 + 1); }
    for (let i = 0; i < 4; i++) { const py = H * (.06 + i * .3); shadeBox(x, -10, py, W + 20, 26, 6, C.wood, C.woodS, 41 + i, 6, 6); }
    const R = mulberry(43), cols = [[C.mug, C.mugS], ['#9cc28f', '#7aa56d'], ['#f2c14e', '#d49d2a'], ['#e7a07a', '#c97f5c'], [C.cream, C.creamS]];
    for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) {
      const c = i === 1 ? cols[0] : cols[(R() * cols.length) | 0], mw = W * .13, mh = H * .1;
      drawMug(x, W * (.15 + k * .22), H * (.06 + (i + 1) * .3) - 2, mw, mh, c[0], c[1], { lw: 7, lw2: 4, seed: i * 10 + k, speckCol: c[0] === C.mug ? C.speck : 'rgba(60,40,30,.35)' });
    }
  });
}
// split-flap sign: a frame; the slats are separate cards (flap)
export function flapFrame() {
  return cut(.05, .016, (x, W, H) => { shadeBox(x, 0, 0, W, H, 12, '#3b3a4f', '#2b2a3c', 51, 8, 6); }, { ppm: 12000, ay: .5 });
}
export function flap(text, col = '#fbf2e2', ink = INK) {
  return cut(.046, .0062, (x, W, H) => { rr(x, 0, 0, W, H, 8); x.fillStyle = col; x.fill(); txt(x, text, W / 2, H * .56, `${Math.round(H * .8)}px "Lilita One"`, ink); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, H * .48, W, 3); }, { ppm: 14000, border: 0, ay: .5, grain: false });
}
export function note(text) {   // a reminder note on a string
  return cut(.046, .018, (x, W, H) => {
    wbox(x, 0, 0, W, H, 10, 77, 3); sh(x, '#fff6c7', LW2 + 1);
    txt(x, text, W * .42, H * .54, `600 ${Math.round(H * .28)}px Fredoka`, INK);
    x.beginPath(); x.arc(W * .9, H * .5, H * .2, 0, TAU); sh(x, '#7ec47a', 4); x.beginPath(); x.moveTo(W * .9 - H * .09, H * .5); x.lineTo(W * .9 - H * .02, H * .59); x.lineTo(W * .9 + H * .1, H * .39); x.lineWidth = 6; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.stroke();
  }, { ppm: 14000, ay: 0 });
}
// listing tag: drawn into a live canvas (the text writes itself), see actors.js makeTag
export const TAG_W = 700, TAG_H = 420;
export function drawTag(x, p = {}) {
  const { n = 0, title = 'Speckled Sky Mug', line = 'hand-thrown', flip = 0 } = p;
  x.clearRect(0, 0, TAG_W, TAG_H);
  const W = cv(TAG_W, TAG_H), a = W.getContext('2d');
  a.beginPath(); a.moveTo(70, 40); a.lineTo(630, 40); a.lineTo(670, 210); a.lineTo(630, 380); a.lineTo(70, 380); a.lineTo(30, 210); a.closePath(); sh(a, '#fffaf0', LW);
  a.beginPath(); a.arc(90, 210, 22, 0, TAU); sh(a, C.cream, LW2);
  const s1 = title.slice(0, Math.min(title.length, n)), s2 = line.slice(0, Math.max(0, n - title.length));
  txt(a, s1, 140, 160, 'italic 74px "IM Fell English"', INK, 'left');
  txt(a, s2, 142, 262, '500 52px Fredoka', '#6b5446', 'left');
  if (n > 0 && n < title.length + line.length) { const tw = a.measureText(n <= title.length ? s1 : s2).width; a.fillStyle = C.red; a.fillRect((n <= title.length ? 140 : 142) + tw + (n <= title.length ? 8 : 6), n <= title.length ? 120 : 236, 6, n <= title.length ? 80 : 56); }
  x.drawImage(finishCut(W, 14, { grainA: .5 }), 0, 0);
}
export function stampCheck() {
  return cut(.012, .012, (x, W, H) => {
    x.beginPath(); x.arc(W / 2, H / 2, W * .46, 0, TAU); x.lineWidth = 14; x.strokeStyle = C.red; x.stroke();
    x.beginPath(); x.moveTo(W * .27, H * .52); x.lineTo(W * .44, H * .7); x.lineTo(W * .75, H * .3); x.lineWidth = 18; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
  }, { ppm: 14000, border: 0, ay: .5, grain: false });
}
export function tagPost() {
  return cut(.016, .028, (x, W, H) => {
    rr(x, W * .44, 0, W * .12, H, 6); sh(x, C.woodS, LW2); rr(x, W * .2, H * .9, W * .6, H * .1, 6); sh(x, C.wood, LW2);
    rr(x, W * .44, 0, W * .5, W * .1, 4); sh(x, C.woodS, LW2);
  }, { ppm: 9000 });
}
export function gearWheel(col = C.gold, shade = C.goldS) {
  return cut(.012, .012, (x, W, H) => {
    const cx = W / 2, cy = H / 2, r = W * .44;
    x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; x.lineTo(cx + Math.cos(a) * r * (i % 2 ? .78 : 1), cy + Math.sin(a) * r * (i % 2 ? .78 : 1)); } x.closePath(); sh(x, col, LW2 + 1);
    x.beginPath(); x.arc(cx, cy, r * .28, 0, TAU); sh(x, shade, LW2);
  }, { ppm: 12000, border: 8, ay: .5 });
}
export function envelope() {
  return cut(.008, .0055, (x, W, H) => { rr(x, 0, 0, W, H, 6); sh(x, '#fff', LW2 + 1); x.beginPath(); x.moveTo(0, 0); x.lineTo(W / 2, H * .55); x.lineTo(W, 0); x.lineWidth = LW2; x.strokeStyle = INK; x.stroke(); }, { ppm: 14000, border: 8, ay: .5 });
}
export function packTable() {
  return table(.09, .022, { col: '#b98c63', shade: '#97704b' });
}
export const BELT_W = 1300, BELT_H = 120;
export function drawBelt(x, ph) {
  x.clearRect(0, 0, BELT_W, BELT_H);
  rr(x, 6, 10, BELT_W - 12, BELT_H - 30, 40); x.fillStyle = '#4b4658'; x.fill(); x.lineWidth = LW; x.strokeStyle = INK; x.stroke();
  x.save(); rr(x, 6, 10, BELT_W - 12, BELT_H - 30, 40); x.clip();
  for (let i = -2; i < 26; i++) { const px = ((i * 60 + ph * 60) % (BELT_W + 120)) - 60; x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(px, 14, 22, BELT_H - 38); }
  x.restore();
  for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(70 + i * 193, BELT_H - 24, 18, 0, TAU); x.fillStyle = '#d4cbbd'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke(); }
}
export function parcel(seed = 1, w = .016, h = .012) {
  return cut(w, h, (x, W, H) => {
    shadeBox(x, 0, 0, W, H, 8, C.box, C.boxS, seed, 10, 6);
    x.fillStyle = 'rgba(255,255,255,.0)';
    x.beginPath(); x.moveTo(W * .5, 0); x.lineTo(W * .5, H); x.lineWidth = 14; x.strokeStyle = '#e8c98f'; x.stroke(); x.lineWidth = 4; x.strokeStyle = 'rgba(58,42,36,.4)'; x.stroke();
  }, { ppm: 12000, border: 10 });
}
export function label() {
  return cut(.009, .006, (x, W, H) => {
    rr(x, 0, 0, W, H, 6); sh(x, '#fff', LW2);
    x.fillStyle = INK; for (let i = 0; i < 9; i++) x.fillRect(W * .1 + i * W * .035, H * .55, W * (i % 3 ? .012 : .022), H * .3);
    x.fillStyle = 'rgba(58,42,36,.6)'; x.fillRect(W * .1, H * .18, W * .55, H * .1); x.fillRect(W * .1, H * .34, W * .4, H * .08);
  }, { ppm: 14000, border: 6, ay: .5 });
}
export function printer() {
  return cut(.022, .016, (x, W, H) => {
    shadeBox(x, 0, H * .15, W, H * .85, 14, '#e6e1d8', '#c9c2b4', 31, 10, 8);
    rr(x, W * .18, H * .02, W * .64, H * .26, 8); sh(x, '#bdb5a6', LW2);
    rr(x, W * .2, H * .62, W * .6, H * .08, 4); sh(x, '#3b3a4f', 4);
    x.beginPath(); x.arc(W * .82, H * .4, W * .05, 0, TAU); sh(x, '#7ec47a', 4);
  }, { ppm: 12000 });
}
export function wheelUnit() {   // the potter's wheel: splash pan + wheel head + legs (front view)
  return cut(.034, .02, (x, W, H) => {
    for (const lx of [W * .18, W * .76]) { rr(x, lx, H * .5, W * .06, H * .5, 6); sh(x, '#5e6270', LW2 + 1); }
    const pan = () => { x.beginPath(); x.moveTo(W * .04, H * .28); x.lineTo(W * .96, H * .28); x.bezierCurveTo(W * .96, H * .55, W * .86, H * .62, W * .7, H * .62); x.lineTo(W * .3, H * .62); x.bezierCurveTo(W * .14, H * .62, W * .04, H * .55, W * .04, H * .28); x.closePath(); };
    crescent(x, pan, '#6f7486', 14, 10, '#878ca0'); pan(); sh(x, null, LW);
    x.beginPath(); x.ellipse(W * .5, H * .28, W * .46, H * .07, 0, 0, TAU); sh(x, '#b3b6c4', LW2 + 1);
    x.beginPath(); x.ellipse(W * .5, H * .26, W * .26, H * .045, 0, 0, TAU); sh(x, '#9ea2b3', LW2);
    x.strokeStyle = 'rgba(176,122,85,.6)'; x.lineWidth = 8; x.beginPath(); x.ellipse(W * .5, H * .29, W * .36, H * .05, 0, .3, 2.6); x.stroke();
  }, { ppm: 9000 });
}
export const CLAY_W = 500, CLAY_H = 520;
export function drawClay(x, k = 0, spin = 0) {   // k 0→1: a lump becoming a mug shape; spin: rotating texture marks
  x.clearRect(0, 0, CLAY_W, CLAY_H);
  const W = cv(CLAY_W, CLAY_H), a = W.getContext('2d');
  const bw = lerp(190, 120, k), tw = lerp(120, 130, k), h = lerp(170, 330, k), by = 470, cx = 250;
  const p = () => { a.beginPath(); a.moveTo(cx - bw, by); a.bezierCurveTo(cx - bw - 10, by - h * .5, cx - tw, by - h * .8, cx - tw, by - h); a.lineTo(cx + tw, by - h); a.bezierCurveTo(cx + tw, by - h * .8, cx + bw + 10, by - h * .5, cx + bw, by); a.closePath(); };
  crescent(a, p, C.clayS, 22, 0, C.clay); p(); sh(a, null, LW);
  a.save(); p(); a.clip(); a.strokeStyle = 'rgba(120,70,45,.45)'; a.lineWidth = 6;
  for (let i = 0; i < 7; i++) { const yy = by - h * (.12 + i * .13), off = Math.sin(spin * 9 + i * 1.7) * 30; a.beginPath(); a.moveTo(cx - 200 + off, yy); a.quadraticCurveTo(cx + off * .3, yy + 10, cx + 200 + off, yy); a.stroke(); }
  a.restore();
  a.beginPath(); a.ellipse(cx, by - h, tw, 22 + k * 6, 0, 0, TAU); sh(a, k > .5 ? '#7e4a30' : C.clayS, LW2 + 1);
  x.drawImage(finishCut(W, 12, { grainA: .5 }), 0, 0);
}
export function stool() {
  return cut(.02, .0185, (x, W, H) => {
    for (const lx of [W * .18, W * .5, W * .76]) { x.beginPath(); x.moveTo(W / 2, H * .2); x.lineTo(lx, H); x.lineWidth = 16; x.strokeStyle = INK; x.stroke(); x.lineWidth = 8; x.strokeStyle = C.woodS; x.stroke(); }
    x.beginPath(); x.ellipse(W / 2, H * .16, W * .46, H * .12, 0, 0, TAU); sh(x, C.wood, LW);
  }, { ppm: 9000 });
}
export function armchair(part) {   // 'back' (behind the sitter) or 'front' (arms + seat cushion, in front of the sitter)
  const col = '#5d9a8c', shade = '#4a7f73';
  return cut(.07, .052, (x, W, H) => {
    if (part === 'back') {
      const b = () => { wbox(x, W * .1, 0, W * .8, H * .8, 60, 71, 4); }; crescent(x, b, shade, 18, 0, col); b(); sh(x, null, LW);
      x.strokeStyle = 'rgba(40,70,60,.4)'; x.lineWidth = 5; for (const bx of [.35, .5, .65]) { x.beginPath(); x.arc(W * bx, H * .35, 8, 0, TAU); x.stroke(); }
    } else {
      shadeBox(x, W * .14, H * .62, W * .72, H * .2, 26, '#6aa898', shade, 72, 10, 8);
      for (const s of [0, 1]) { const ax = s ? W * .78 : W * .02; const p = () => wbox(x, ax, H * .42, W * .2, H * .48, 34, 73 + s, 3); crescent(x, p, shade, s ? 10 : -10, 0, col); p(); sh(x, null, LW); }
      for (const lx of [W * .08, W * .86]) { rr(x, lx, H * .9, W * .06, H * .1, 6); sh(x, C.woodD, LW2); }
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 4; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(W * (.2 + i * .14), H * .66); x.lineTo(W * (.24 + i * .14), H * .78); x.stroke(); }
    }
  });
}
// the four pull-tabs along the page edge (lie flat; seen from above): arrow + job word
export function pullTab(word, col, shade) {
  return cut(.048, .03, (x, W, H) => {
    const p = () => { x.beginPath(); x.moveTo(W * .06, 0); x.lineTo(W * .94, 0); x.lineTo(W * .94, H * .66); x.quadraticCurveTo(W * .94, H * .98, W * .7, H * .98); x.lineTo(W * .3, H * .98); x.quadraticCurveTo(W * .06, H * .98, W * .06, H * .66); x.closePath(); };
    crescent(x, p, shade, 0, 12, col); p(); sh(x, null, LW);
    txt(x, word, W / 2, H * .42, `${Math.round(H * .28)}px "Lilita One"`, '#fff');
    x.beginPath(); x.moveTo(W * .42, H * .7); x.lineTo(W * .5, H * .86); x.lineTo(W * .58, H * .7); x.lineWidth = 9; x.strokeStyle = '#fff'; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
  }, { ppm: 9000, ay: 0 });
}
export function windowGlow() {   // a lit window in the town (a warm square)
  return cut(.0045, .005, (x, W, H) => { rr(x, 0, 0, W, H, 4); x.fillStyle = '#ffd97a'; x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(W * .2, H * .15, W * .25, H * .3); }, { ppm: 9000, border: 0, ay: .5, grain: false });
}
