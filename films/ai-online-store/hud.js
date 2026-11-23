// 2D overlay on the 1080×1920 frame: narration subtitles, speech bubbles (typed with blips), the brand card.
import { VO, VO_SPLIT, BUB, CARD, DUR } from './timeline.js';
import { clamp, seg, back, ss, eo, lerp } from './lib.js';

const INK = '#3a2a24';
export const W = 1080, H = 1920;
export const CPS = 30;   // bubble typing speed (characters per second)

export function wrap(x, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

// ---------- subtitle cues (also used for the .srt) ----------
export function voCues(dur) {
  const out = [];
  VO.forEach(([id, t0, text, o = {}], i) => {
    if (o.sub === false) return;
    const len = dur[id], next = VO[i + 1] ? VO[i + 1][1] : DUR;
    const end = Math.min(Math.max(t0 + len + .6, t0 + 1.8), next - .15);
    const parts = VO_SPLIT[id] || [[0, text]];
    parts.forEach(([dt, s], k) => {
      const a = t0 + dt, b = k + 1 < parts.length ? t0 + parts[k + 1][0] : end;
      out.push({ t0: a, t1: b, text: s, first: k === 0, last: k === parts.length - 1, id });
    });
  });
  return out;
}
const SUB_Y = 1392, SUB_FONT = '600 52px Fredoka', SUB_LH = 64, SUB_W = 920;
export function drawSubs(x, t, dur) {
  for (const c of voCues(dur)) {
    const a = Math.min(c.first ? seg(t, c.t0 - .15, c.t0 + .1) : +(t >= c.t0), c.last ? 1 - seg(t, c.t1, c.t1 + .25) : +(t < c.t1));
    if (a <= 0) continue;
    x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = SUB_FONT; x.lineJoin = 'round';
    const lines = wrap(x, c.text, SUB_W);
    let y = SUB_Y - (lines.length - 1) * SUB_LH / 2;
    for (const l of lines) {
      x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 18; x.lineWidth = 11; x.strokeStyle = 'rgba(58,36,24,.92)'; x.strokeText(l, W / 2, y);
      x.shadowBlur = 0; x.fillStyle = '#fff6e6'; x.fillText(l, W / 2, y); y += SUB_LH;
    }
    x.restore();
  }
}

// ---------- speech bubbles ----------
// anchors: { name: [sx, sy] } screen position of the speaker (top of the phone)
function bubbleBox(x, text, an, slot, side) {
  x.font = '600 50px Fredoka';
  const tw = Math.min(x.measureText(text).width, 760), bw = tw + 84, bh = 118;
  let bx = side > 0 ? an[0] + 40 - bw : an[0] - 40, by = an[1] - 150 - slot * (bh + 26);
  bx = clamp(bx, 36, W - 36 - bw); by = clamp(by, 120, H - 400);
  return { bx, by, bw, bh, tw };
}
export function bubbleLayout(t, anchors) {
  const out = [];
  const slots = {};
  for (const [who, t0, t1, text, voice, pass] of BUB) {
    if (t < t0 - .05 || t > t1 + .3) continue;
    const an = anchors[who.replace(/r$/, '')]; if (!an) continue;
    const key = who.replace(/r$/, ''), slot = slots[key] = (slots[key] ?? -1) + 1;
    out.push({ who, t0, t1, text, voice, pass, an, slot, side: voice === 'ai' ? 1 : -1 });
  }
  return out;
}
export function drawBubbles(x, t, anchors, measureOnly = false) {
  const boxes = [];
  for (const b of bubbleLayout(t, anchors)) {
    const kin = back(seg(t, b.t0, b.t0 + .22), 2.2), kout = 1 - ss(seg(t, b.t1, b.t1 + .25)), k = kin * kout;
    x.save();
    const { bx, by, bw, bh } = bubbleBox(x, b.text, b.an, b.slot, b.side);
    boxes.push({ text: b.text, x0: bx, y0: by, x1: bx + bw, y1: by + bh, pass: b.pass, t0: b.t0, k });
    if (measureOnly || k <= 0) { x.restore(); continue; }
    const n = Math.floor(clamp((t - b.t0 - .1) * CPS, 0, b.text.length));
    const tx = clamp(b.an[0], bx + 50, bx + bw - 50), pivotY = by + bh;
    x.translate(tx, pivotY); x.scale(k, k); x.translate(-tx, -pivotY);
    x.globalAlpha = clamp(kout * 1.5);
    const fill = b.voice === 'ai' ? '#eef8e8' : '#fffdf8';
    // soft shadow, tail, body
    x.fillStyle = 'rgba(30,18,10,.28)'; x.beginPath(); x.roundRect(bx + 8, by + 12, bw, bh, 40); x.fill();
    const tipX = lerp(tx, b.an[0], .6), tipY = b.slot === 0 ? Math.min(b.an[1] - 10, by + bh + 52) : by + bh + 22;
    x.beginPath(); x.roundRect(bx, by, bw, bh, 40); x.fillStyle = fill; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke();
    if (b.slot === 0) {
      x.beginPath(); x.moveTo(tx - 24, by + bh - 3); x.lineTo(tipX, tipY); x.lineTo(tx + 20, by + bh - 3); x.closePath(); x.fillStyle = fill; x.fill();
      x.beginPath(); x.moveTo(tx - 24, by + bh); x.lineTo(tipX, tipY); x.lineTo(tx + 20, by + bh); x.stroke();
    }
    if (b.voice === 'ai') {   // a small gold badge: the shop's assistant is answering
      x.beginPath(); x.arc(bx + bw - 6, by + 8, 26, 0, Math.PI * 2); x.fillStyle = '#f2c14e'; x.fill(); x.lineWidth = 5; x.stroke();
      x.font = '700 24px Fredoka'; x.fillStyle = INK; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AI', bx + bw - 6, by + 9);
    }
    x.font = '600 50px Fredoka'; x.fillStyle = '#241814'; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText(b.text.slice(0, n), bx + 42, by + bh / 2 + 2);
    x.restore();
  }
  return boxes;
}
export function blipTimes() {
  const ev = [];
  for (const [who, t0, t1, text, voice] of BUB) for (let i = 0; i < text.length; i++) if (/[A-Za-z!?']/.test(text[i]) && i % 2 === 0) ev.push({ t: t0 + .1 + i / CPS, type: 'blip', who: voice });
  return ev;
}

// ---------- brand card (flat, unlit: the brand guidelines allow no glow, gradient or shadow on the logo) ----------
const INDIGO = '#0B0F2A', SOFT = '#FAF6FF', PURPLE = '#6A00FF';
export const CARD_TEXT = { lockup: 'Petros Ai-Tech Agency', tag1: 'Innovate smarter.', tag2: 'Create beyond limits.', chip: 'AI AUTOMATION FOR SMALL BUSINESS' };
let logo = null;
export async function loadLogo(url) { logo = new Image(); logo.src = url; await logo.decode(); }
export function cardLayout() {
  const lw = 800, lh = lw * 513 / 1505;
  return { logo: [W / 2 - lw / 2, 610, lw, lh], tag: [1012, 1094], chip: [W / 2, 1270] };
}
export function drawCard(x, t) {
  if (t < CARD) return [];
  const L = cardLayout(), u = t - CARD;
  x.save();
  x.fillStyle = INDIGO; x.fillRect(0, 0, W, H);
  const a1 = ss(seg(u, 0, .45)), dy = (1 - eo(seg(u, 0, .6))) * 26;
  x.globalAlpha = a1; x.drawImage(logo, L.logo[0], L.logo[1] + dy, L.logo[2], L.logo[3]);
  const a2 = ss(seg(u, .55, 1.0));
  x.globalAlpha = a2; x.fillStyle = SOFT; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.font = '600 66px Sora';
  x.fillText(CARD_TEXT.tag1, W / 2, L.tag[0] + (1 - a2) * 14); x.fillText(CARD_TEXT.tag2, W / 2, L.tag[1] + (1 - a2) * 14);
  const a3 = ss(seg(u, 1.05, 1.5));
  x.globalAlpha = a3; x.font = '600 30px "DM Sans"';
  if ('letterSpacing' in x) x.letterSpacing = '4.8px';
  const cw = x.measureText(CARD_TEXT.chip).width + 84, ch = 72;
  x.fillStyle = PURPLE; x.beginPath(); x.roundRect(W / 2 - cw / 2, L.chip[1] - ch / 2, cw, ch, ch / 2); x.fill();
  x.fillStyle = SOFT; x.textBaseline = 'middle'; x.fillText(CARD_TEXT.chip, W / 2 + 2, L.chip[1] + 2);
  x.restore();
  const tb = 940;
  return [
    { id: 'card-logo', text: CARD_TEXT.lockup, x0: L.logo[0], y0: L.logo[1], x1: L.logo[0] + L.logo[2], y1: L.logo[1] + L.logo[3], vis: a1 > .5 },
    { id: 'card-tag', text: CARD_TEXT.tag1 + ' ' + CARD_TEXT.tag2, x0: W / 2 - tb / 2, y0: L.tag[0] - 60, x1: W / 2 + tb / 2, y1: L.tag[1] + 16, vis: a2 > .5 },
    { id: 'card-chip', text: CARD_TEXT.chip, x0: W / 2 - cw / 2, y0: L.chip[1] - ch / 2, x1: W / 2 + cw / 2, y1: L.chip[1] + ch / 2, vis: a3 > .5 },
  ];
}
