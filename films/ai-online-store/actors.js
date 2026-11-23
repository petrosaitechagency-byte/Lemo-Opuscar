// Characters and live cards: flat cut-paper planes whose canvas is redrawn only when the (quantized) pose changes.
import * as THREE from 'three';
import * as A from './art.js';
import { cv } from './paper.js';
import { texOf } from './book.js';
import { blobShadow } from './cutmesh.js';

function dynPlane(c, h, ax, ay, side) {
  const t = texOf(c), w = h * c.width / c.height;
  const g = new THREE.PlaneGeometry(w, h); g.translate(w / 2 - ax * w, ay * h - h / 2, 0);
  const m = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, roughness: .85, side });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5, side: THREE.DoubleSide });
  return { mesh, t };
}
function backPlane(front, col = '#efe8da') {   // plain paper back with the same silhouette
  const m = new THREE.MeshStandardMaterial({ map: front.t, alphaTest: .5, alphaToCoverage: true, roughness: .92, side: THREE.BackSide });
  const bc = new THREE.Color(col);
  m.onBeforeCompile = s => { s.uniforms.backCol = { value: bc }; s.fragmentShader = 'uniform vec3 backCol;\n' + s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = backCol;'); };
  m.customProgramCacheKey = () => 'paperback';
  const b = new THREE.Mesh(front.mesh.geometry, m); b.receiveShadow = true; return b;
}
const keyOf = (p, q = 40) => JSON.stringify(p, (k, v) => typeof v === 'number' ? Math.round(v * q) / q : v);

export function makeMira(H = .06) {
  const c = cv(A.MIRA_W, A.MIRA_H); A.drawMira(c.getContext('2d'), {});
  const ay = A.MIRA_FOOT / A.MIRA_H;   // anchor at the feet (ay = canvas y of the anchor ÷ height, from the top)
  const F = dynPlane(c, H, .5, ay, THREE.FrontSide); F.mesh.castShadow = true;
  const root = new THREE.Group(), body = new THREE.Group(); body.add(F.mesh, backPlane(F)); root.add(body);
  const shadow = blobShadow(H * .3, .45);
  let key = '';
  return {
    root, body, shadow, H,
    pose(p) { const k = keyOf(p); if (k === key) return; key = k; A.drawMira(c.getContext('2d'), p); F.t.needsUpdate = true; },
    // head top (bubble anchor) and face centre in world space, for the camera and overlays
    head(v = new THREE.Vector3(), sit = false) { return v.set(0, H * (sit ? .86 : .93), 0).applyMatrix4(body.matrixWorld); },
  };
}
export function makeCat(H = .0175) {
  const c = cv(A.CAT_W, A.CAT_H); A.drawCat(c.getContext('2d'), {});
  const F = dynPlane(c, H, .5, 378 / A.CAT_H, THREE.FrontSide); F.mesh.castShadow = true;
  const root = new THREE.Group(); root.add(F.mesh, backPlane(F));
  let key = '';
  return { root, pose(p) { const k = keyOf(p, 10); if (k === key) return; key = k; A.drawCat(c.getContext('2d'), p); F.t.needsUpdate = true; } };
}
export function makeTag(W = .024) {
  const c = cv(A.TAG_W, A.TAG_H); A.drawTag(c.getContext('2d'), { n: 0 });
  const H = W * A.TAG_H / A.TAG_W, F = dynPlane(c, H, .5, 380 / A.TAG_H, THREE.FrontSide); F.mesh.castShadow = true;
  const root = new THREE.Group(); root.add(F.mesh, backPlane(F));
  let key = '';
  return { root, W, H, draw(p) { const k = keyOf(p, 1); if (k === key) return; key = k; A.drawTag(c.getContext('2d'), p); F.t.needsUpdate = true; } };
}
export function makeClay(H = .0085) {
  const c = cv(A.CLAY_W, A.CLAY_H); A.drawClay(c.getContext('2d'), 0, 0);
  const F = dynPlane(c, H, .5, 470 / A.CLAY_H, THREE.FrontSide); F.mesh.castShadow = true;
  const root = new THREE.Group(); root.add(F.mesh, backPlane(F));
  let key = '';
  return { root, draw(k, spin) { const kk = keyOf([k, spin % 1], 24); if (kk === key) return; key = kk; A.drawClay(c.getContext('2d'), k, spin); F.t.needsUpdate = true; } };
}
export function makeBelt(W = .084) {
  const c = cv(A.BELT_W, A.BELT_H); A.drawBelt(c.getContext('2d'), 0);
  const H = W * A.BELT_H / A.BELT_W, F = dynPlane(c, H, .5, 1, THREE.FrontSide);
  const root = new THREE.Group(); root.add(F.mesh);
  let key = '';
  return { root, draw(ph) { const k = Math.round(ph * 30) / 30; if (k === key) return; key = k; A.drawBelt(c.getContext('2d'), ph); F.t.needsUpdate = true; } };
}
