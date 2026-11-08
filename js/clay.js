import { createBeats } from './beats.js';

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const CUP = {"pts":[[0.0238,0.0276],[0.0565,0.0276],[0.0953,0.0276],[0.1377,0.0276],[0.181,0.0276],[0.2227,0.0276],[0.26,0.0276],[0.2951,0.0275],[0.3312,0.0272],[0.3668,0.0269],[0.4008,0.0266],[0.4318,0.0266],[0.4586,0.0269],[0.48,0.0276],[0.495,0.0287],[0.5044,0.03],[0.5095,0.0315],[0.5118,0.0334],[0.5126,0.0356],[0.5132,0.0383],[0.515,0.0414],[0.5175,0.0449],[0.5192,0.0486],[0.5203,0.0528],[0.5208,0.0573],[0.5209,0.0625],[0.5206,0.0682],[0.52,0.0747],[0.5192,0.0816],[0.5182,0.0885],[0.5168,0.0958],[0.5149,0.1041],[0.5124,0.1136],[0.5092,0.1248],[0.505,0.138],[0.4998,0.1532],[0.4936,0.17],[0.4865,0.1883],[0.479,0.2081],[0.471,0.2294],[0.463,0.252],[0.455,0.276],[0.4469,0.3015],[0.4383,0.3288],[0.4295,0.3575],[0.4205,0.3874],[0.4117,0.4185],[0.4031,0.4504],[0.395,0.483],[0.3871,0.5175],[0.3791,0.5546],[0.3713,0.593],[0.3638,0.6316],[0.3568,0.6691],[0.3505,0.7043],[0.345,0.736],[0.3403,0.7644],[0.3362,0.7907],[0.3328,0.8151],[0.3299,0.8377],[0.3277,0.8587],[0.326,0.8784],[0.325,0.897],[0.3241,0.9142],[0.3232,0.9297],[0.3227,0.9437],[0.3232,0.9564],[0.3251,0.9681],[0.3288,0.9789],[0.335,0.989],[0.3439,0.9979],[0.3552,1.0053],[0.3685,1.0116],[0.3831,1.0173],[0.3986,1.0228],[0.4144,1.0285],[0.43,1.035],[0.4457,1.0419],[0.4622,1.0487],[0.4792,1.0556],[0.4966,1.0627],[0.5143,1.0701],[0.5321,1.0781],[0.55,1.0868],[0.5683,1.0959],[0.5871,1.1053],[0.6063,1.1151],[0.6255,1.1254],[0.6444,1.1365],[0.6627,1.1485],[0.68,1.1615],[0.6965,1.1756],[0.7126,1.1908],[0.7281,1.2068],[0.7431,1.2235],[0.7576,1.2408],[0.7715,1.2585],[0.785,1.2765],[0.798,1.2948],[0.8105,1.3136],[0.8225,1.3328],[0.8339,1.3525],[0.8448,1.3727],[0.8552,1.3934],[0.865,1.4145],[0.8742,1.4362],[0.883,1.4585],[0.8911,1.4813],[0.8987,1.5045],[0.9058,1.528],[0.9122,1.5517],[0.918,1.5755],[0.9232,1.5996],[0.9277,1.6241],[0.9317,1.6489],[0.9351,1.6739],[0.9379,1.6988],[0.9402,1.7236],[0.942,1.748],[0.9431,1.7727],[0.9434,1.7979],[0.9432,1.8232],[0.9425,1.848],[0.9416,1.8719],[0.9407,1.8943],[0.94,1.9147],[0.9394,1.9334],[0.9387,1.9506],[0.9379,1.9666],[0.9371,1.9812],[0.9361,1.9947],[0.9351,2.007],[0.934,2.0182],[0.9328,2.0281],[0.9316,2.0365],[0.9303,2.0436],[0.9289,2.0496],[0.9274,2.055],[0.9258,2.0598],[0.924,2.0642],[0.922,2.0683],[0.9198,2.0717],[0.9175,2.0745],[0.9151,2.0767],[0.9127,2.0784],[0.9103,2.0796],[0.908,2.0803],[0.9057,2.0806],[0.9034,2.0801],[0.9011,2.0792],[0.8989,2.0778],[0.8967,2.0761],[0.8948,2.0743],[0.893,2.0723],[0.8914,2.0709],[0.89,2.0702],[0.8887,2.0694],[0.8876,2.068],[0.8866,2.0652],[0.8857,2.0604],[0.885,2.0528],[0.8846,2.0421],[0.8844,2.0289],[0.8845,2.0137],[0.8846,1.997],[0.8847,1.9794],[0.8845,1.9614],[0.884,1.9435],[0.8833,1.9253],[0.8827,1.9063],[0.8819,1.8867],[0.8808,1.8666],[0.8794,1.8462],[0.8775,1.8258],[0.875,1.8055],[0.872,1.7852],[0.8686,1.7647],[0.8647,1.744],[0.8604,1.7233],[0.8555,1.7026],[0.8501,1.682],[0.844,1.6617],[0.8373,1.6414],[0.8299,1.6209],[0.822,1.6004],[0.8136,1.5802],[0.8046,1.5605],[0.795,1.5416],[0.785,1.5237],[0.7744,1.507],[0.7632,1.4912],[0.7514,1.4761],[0.7392,1.4616],[0.7265,1.4476],[0.7134,1.4338],[0.7,1.4203],[0.6862,1.4067],[0.672,1.3932],[0.6574,1.38],[0.6424,1.3672],[0.627,1.3552],[0.6112,1.3441],[0.595,1.334],[0.5782,1.3252],[0.5609,1.3174],[0.5431,1.3106],[0.525,1.3044],[0.5067,1.2987],[0.4883,1.2933],[0.47,1.288],[0.452,1.2828],[0.4341,1.278],[0.4162,1.2736],[0.3981,1.2695],[0.3795,1.2657],[0.3602,1.2623],[0.34,1.2593],[0.3189,1.2566],[0.2971,1.2544],[0.2746,1.2525],[0.2515,1.251],[0.228,1.2497],[0.2042,1.2486],[0.18,1.2478],[0.1538,1.2471],[0.1248,1.2469],[0.0948,1.2469],[0.0656,1.2471],[0.0389,1.2474],[0.0164,1.2476]],"a":22,"b":147};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fit = (v, a, b) => clamp((v - a) / (b - a));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sm = t => t * t * (3 - 2 * t);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (() => { let x = 1234567; return () => ((x = (x * 16807) % 2147483647) / 2147483647); })();

// ---------- profiles: axis-bottom → outer foot → outer wall → rim → inner wall → floor ----------
const NA = 40, NB = 250, NC = 170, N = NA + NB + NC;
const V = (x, y) => new THREE.Vector2(x, y);
const spline = (pts, n) => new THREE.SplineCurve(pts.map(p => V(p[0], p[1]))).getSpacedPoints(n - 1);
function poly(pts, n) {
  const v = pts.map(p => V(p[0], p[1])); const L = [0];
  for (let i = 1; i < v.length; i++) L.push(L[i - 1] + v[i].distanceTo(v[i - 1]));
  const out = [], T = L[L.length - 1]; let k = 0;
  for (let i = 0; i < n; i++) { const d = T * i / (n - 1); while (k < v.length - 2 && L[k + 1] < d) k++; const t = (d - L[k]) / ((L[k + 1] - L[k]) || 1); out.push(v[k].clone().lerp(v[k + 1], t)); }
  return out;
}
const join = (a, b, c) => { const out = new Float32Array(N * 2); [...a, ...b, ...c].forEach((p, i) => { out[i * 2] = p.x; out[i * 2 + 1] = p.y; }); return out; };
const stage = (A, B, C) => join(poly(A, NA), spline(B, NB), spline(C, NC));
const cp = [[0, CUP.pts[0][1]], ...CUP.pts, [0, CUP.pts[CUP.pts.length - 1][1]]];
const ia = CUP.a + 1, ib = CUP.b + 1;
const STAGES = [
  stage([[0, 0], [.98, 0]], [[.98, 0], [1.03, .2], [.95, .52], [.72, .84], [.44, 1.0]], [[.44, 1.0], [.2, 1.05], [0, 1.06]]),
  stage([[0, 0], [.74, 0]], [[.74, 0], [.745, .4], [.74, 1.0], [.72, 1.28], [.62, 1.36]], [[.62, 1.36], [.3, 1.38], [0, 1.385]]),
  stage([[0, 0], [.8, 0]], [[.8, 0], [.81, .5], [.8, 1.15], [.76, 1.3], [.66, 1.33]], [[.66, 1.33], [.56, 1.26], [.52, .9], [.42, .62], [0, .58]]),
  stage([[0, 0], [.64, 0]], [[.64, 0], [.6, .35], [.52, .9], [.6, 1.5], [.66, 1.92], [.63, 2.04]], [[.63, 2.04], [.57, 1.98], [.52, 1.6], [.4, 1.3], [0, 1.25]]),
  join(poly(cp.slice(0, ia + 1), NA), poly(cp.slice(ia, ib + 1), NB), poly(cp.slice(ib), NC)),
];
// how far up the form each point sits (0 base … 1 rim): changes travel upward, the way hands pass
const HN = STAGES.map(P => { let m = 0; for (let i = 0; i < N; i++) m = Math.max(m, P[i * 2 + 1]); const h = new Float32Array(N); for (let i = 0; i < N; i++) h[i] = P[i * 2 + 1] / m; return h; });
const SPREAD = [.35, .55, .75, .6];   // per transition: how staggered bottom→top the change is

// ---------- renderer / scene ----------
const canvas = document.getElementById('clay-gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const sceneDpr = () => Math.min(devicePixelRatio || 1, innerWidth >= 2560 ? 1 : 1.5);
renderer.setPixelRatio(sceneDpr());
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
scene.environmentIntensity = .42;
const camera = new THREE.PerspectiveCamera(28, 1, .1, 100);
const key = new THREE.DirectionalLight(0xffe2bf, 3.0); key.position.set(-4.5, 6.5, 4.2);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -.0004; key.shadow.normalBias = .02;
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
scene.add(key);
const rimL = new THREE.DirectionalLight(0xd8cbbb, 1.4); rimL.position.set(4, 3, -5); scene.add(rimL);
const fillL = new THREE.PointLight(0xffd2a8, 7, 12, 2); fillL.position.set(3, 1.6, 3.5); scene.add(fillL);
const spec = new THREE.PointLight(0xffffff, 1.1, 10, 2); spec.position.set(-1.2, 2.8, 3.0); scene.add(spec);   // the wet highlight

// ---------- wet slip textures (u = around, v = along the profile) ----------
function blur(h, s, n) { for (let p = 0; p < n; p++) { const t = h.slice(); for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { let a = 0; for (let d = -2; d <= 2; d++) a += t[y * s + (x + d + s) % s] * (d === 0 ? 2 : 1) + (d ? 0 : 0); a += t[((y + 1) % s) * s + x] * .5 + t[((y - 1 + s) % s) * s + x] * .5; h[y * s + x] = a / 7; } } }
function slipMaps(s, streaks, swirl) {
  const h = new Float32Array(s * s);
  for (let i = 0; i < h.length; i++) h[i] = rnd() * .15;
  // smeared slip: long strokes running around the form, of uneven thickness
  for (let k = 0; k < streaks; k++) {
    const y0 = rnd() * s, len = s * (.2 + rnd() * .8), x0 = rnd() * s, w = 3 + rnd() * 10, amp = .2 + rnd() * .8, drift = (rnd() - .5) * 14;
    for (let d = 0; d < len; d++) { const x = Math.floor(x0 + d) % s, t = d / len, env = Math.sin(Math.PI * t); const yc = y0 + drift * t;
      for (let o = -w * 2; o <= w * 2; o++) { const y = Math.floor(yc + o + s) % s; h[y * s + x] += amp * env * Math.exp(-(o * o) / (w * w)); } }
  }
  blur(h, s, 2);
  let mn = 1e9, mx = -1e9; for (const v of h) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  for (let i = 0; i < h.length; i++) h[i] = (h[i] - mn) / (mx - mn);
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = s; return c; };
  const cn = mk(), cr = mk(), cc = mk(); const gn = cn.getContext('2d'), gr = cr.getContext('2d'), gc = cc.getContext('2d');
  const n = gn.createImageData(s, s), r = gr.createImageData(s, s), c = gc.createImageData(s, s);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const i = y * s + x, dx = h[y * s + (x + 1) % s] - h[y * s + (x - 1 + s) % s], dy = h[((y + 1) % s) * s + x] - h[((y - 1 + s) % s) * s + x];
    const nx = -dx * 3.2, ny = -dy * 3.2, l = Math.hypot(nx, ny, 1), q = i * 4;
    n.data[q] = (nx / l * .5 + .5) * 255; n.data[q + 1] = (ny / l * .5 + .5) * 255; n.data[q + 2] = (1 / l * .5 + .5) * 255; n.data[q + 3] = 255;
    // ridges of fresh slip are glossy, the troughs a little duller
    const g = 255 * clamp(.86 - h[i] * .3 + rnd() * .05); r.data[q] = r.data[q + 1] = r.data[q + 2] = g; r.data[q + 3] = 255;
    const v = 255 * (.9 + h[i] * .1); c.data[q] = v; c.data[q + 1] = v * .985; c.data[q + 2] = v * .965; c.data[q + 3] = 255;
  }
  gn.putImageData(n, 0, 0); gr.putImageData(r, 0, 0); gc.putImageData(c, 0, 0);
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { normal: tex(cn), rough: tex(cr), color: tex(cc, true) };
}
const CLAYMAP = slipMaps(512, 150);
[CLAYMAP.normal, CLAYMAP.rough, CLAYMAP.color].forEach(t => t.repeat.set(2, 2.2));   // 둘레 방향 반복은 정수여야 한 바퀴 끝(u=1)과 시작(u=0)이 이어진다(1.5면 세로 경계선이 생김)
const WET = new THREE.Color('#9d937f'), DRY = new THREE.Color('#e3ddd3'), GLAZE = new THREE.Color('#f3f1ec');
const clayMat = new THREE.MeshPhysicalMaterial({
  color: WET.clone(), map: CLAYMAP.color, roughness: 1, roughnessMap: CLAYMAP.rough, normalMap: CLAYMAP.normal, normalScale: new THREE.Vector2(.55, .55),
  clearcoat: .2, clearcoatRoughness: .45, sheen: .3, sheenColor: new THREE.Color('#fff4e6'), sheenRoughness: .5, side: THREE.DoubleSide });

// ---------- the clay: lathe rebuilt from the blended profile ----------
const M = 168;
const geo = new THREE.BufferGeometry();
const pos = new Float32Array(N * (M + 1) * 3), nor = new Float32Array(N * (M + 1) * 3), uv = new Float32Array(N * (M + 1) * 2);
const idx = [];
for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const a = i * (M + 1) + j, b = a + M + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
for (let i = 0; i < N; i++) for (let j = 0; j <= M; j++) { const k = (i * (M + 1) + j) * 2; uv[k] = j / M; uv[k + 1] = i / (N - 1); }
geo.setIndex(idx);
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
const clay = new THREE.Mesh(geo, clayMat); clay.castShadow = clay.receiveShadow = true;
clay.position.y = -.014;   // the foot sits down in the slip bed
const spinner = new THREE.Group(); spinner.add(clay); scene.add(spinner);
const COS = [], SIN = []; for (let j = 0; j <= M; j++) { const t = j / M * Math.PI * 2; COS.push(Math.cos(t)); SIN.push(Math.sin(t)); }
const prof = new Float32Array(N * 2), pr = new Float32Array(N), py = new Float32Array(N);

// ---------- 되감기의 역행: 유약이 벗겨지고, 마른 흙에 금이 가고, 조각으로 부서져 물레 위 흙더미가 되었다가 흙덩이로 ----------
const RAW = new THREE.Color('#b8a184');            // 굽기 전, 마른 흙빛
const NS = 96, seeds = [];                          // 금(균열)과 조각은 같은 보로노이 칸을 쓴다
const crackU = { uCrack: { value: 0 }, uSeeds: { value: Array.from({ length: NS }, () => new THREE.Vector3()) } };
clayMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, crackU);
  sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec3 vObjP;\nvoid main() {').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjP = position;');
  sh.fragmentShader = sh.fragmentShader.replace('void main() {', `varying vec3 vObjP; uniform float uCrack; uniform vec3 uSeeds[${NS}];
float kjyH(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
void main() {`).replace('#include <map_fragment>', `#include <map_fragment>
  if (uCrack > 0.001) {
    float f1 = 1e9, f2 = 1e9; int i1 = 0, i2 = 0;
    for (int i = 0; i < ${NS}; i++) { float d = distance(vObjP, uSeeds[i]); if (d < f1) { f2 = f1; i2 = i1; f1 = d; i1 = i; } else if (d < f2) { f2 = d; i2 = i; } }
    float edge = (f2 - f1) * .5;
    float grow = step(kjyH(float(min(i1, i2) * 97 + max(i1, i2))), uCrack * 1.25);
    float w = .002 + .011 * uCrack;
    float cr = (1. - smoothstep(w * .35, w, edge)) * grow;
    diffuseColor.rgb *= 1. - .82 * cr;
  }`);
};
clayMat.customProgramCacheKey = () => 'kjy-crack';
// ---------- 가루 → 덩이: 같은 흙 메시 하나가 가루 더미 모양에서 덩이 모양으로 옮겨 간다 ----------
// uPow 1 = 물레 위 가루 더미, 0 = clay.js의 흙덩이. breakwheel.js가 매 프레임 값을 넣는다.
const MORPH = { uPow: { value: 0 }, uPM: { value: 1 }, uLR: { value: 1 }, uY0: { value: 0 } };
window.__morph = MORPH;
const MORPH_GLSL = `
uniform float uPow, uPM, uLR, uY0;
float mh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mvn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(mh2(i), mh2(i + vec2(1., 0.)), f.x), mix(mh2(i + vec2(0., 1.)), mh2(i + vec2(1., 1.)), f.x), f.y); }
float heapH(vec2 xz){
  float m = max(uPM, 1e-4), R = 1.03 * pow(m, .42), Hh = pow(m, .6), th = atan(xz.y, xz.x);
  float x = length(xz) / (R * (1. + .06 * sin(th * 3. + 1.3) + .04 * sin(th * 5. - .4)));
  float base = x < 1. ? pow(1. - pow(x, 2.1), .95) : 0.;
  float n = (mvn2(xz * 7.) - .5) * .05 + (mvn2(xz * 23.) - .5) * .016 + (mvn2(xz * 61.) - .5) * .005;
  float hp = Hh * base + n * min(1., Hh * 4.) * smoothstep(1.08, .55, x);
  // 뭉치는 동안: 작은 알갱이 덩어리들이 엉겨 솟았다가 하나로 가라앉는다
  float cl = smoothstep(.5, .8, mvn2(xz * 5.5 + 3.1) * .65 + mvn2(xz * 13.) * .35) * 4. * uPow * (1. - uPow) * .035 * smoothstep(1., .3, x);
  return max(0., hp + cl);
}
vec2 heapQ(vec3 p){ float r = length(p.xz), Rp = 1.03 * pow(max(uPM, 1e-4), .42); return r > 1e-5 ? p.xz / r * (r / max(uLR, 1e-3)) * Rp : vec2(0.); }
bool heapBase(vec3 p){ return p.y < uY0 + .003; }
vec3 heapP(vec3 p){ vec2 q = heapQ(p); return vec3(q.x, uY0 + (heapBase(p) ? 0. : heapH(q)), q.y); }
`;
function morphVertex(sh, withNormal) {
  Object.assign(sh.uniforms, MORPH);
  sh.vertexShader = sh.vertexShader.replace('void main() {', `varying vec3 vHeapP;${MORPH_GLSL}\nvoid main() {`);
  if (withNormal) sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
  if (uPow > 0.) {
    vec3 nH = vec3(0., -1., 0.);
    if (!heapBase(position)) { vec2 q = heapQ(position); float e = .01;
      float hx = (heapH(q + vec2(e, 0.)) - heapH(q - vec2(e, 0.))) / (2. * e), hz = (heapH(q + vec2(0., e)) - heapH(q - vec2(0., e))) / (2. * e);
      nH = normalize(vec3(-hx, 1., -hz)); }
    objectNormal = normalize(mix(objectNormal, nH, uPow));
  }`);
  sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
  vHeapP = position;
  if (uPow > 0.) { vec3 hpP = heapP(position); transformed = mix(transformed, hpP, uPow); vHeapP = hpP; }`);
}
{
  const prevOBC = clayMat.onBeforeCompile;
  clayMat.onBeforeCompile = sh => {
    prevOBC(sh);
    morphVertex(sh, true);
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec3 vHeapP; uniform float uPow;\nfloat mq3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nvoid main() {')
      .replace('#include <color_fragment>', `#include <color_fragment>
  if (uPow > 0.) {
    // 가루: 거친 흰 알갱이. 뭉칠수록 알갱이가 지워지고 흙덩이의 결이 드러난다
    float gq = mq3(floor(vHeapP * 420.)), gq2 = mq3(floor(vHeapP * 140.) + 3.);
    vec3 pw = vec3(.935, .925, .9) * (.86 + .14 * gq + .07 * gq2);
    diffuseColor.rgb = mix(diffuseColor.rgb, pw, uPow);
  }`)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = normalize(mix(normal, nonPerturbedNormal, uPow));');
  };
}
const clayDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
clayDepth.onBeforeCompile = sh => morphVertex(sh, false);
clay.customDepthMaterial = clayDepth;

const shardGroup = new THREE.Group(); spinner.add(shardGroup); shardGroup.visible = false;
const shardMat = new THREE.MeshStandardMaterial({ color: RAW.clone(), map: CLAYMAP.color, roughness: 1, normalMap: CLAYMAP.normal, normalScale: new THREE.Vector2(.5, .5), side: THREE.DoubleSide });
const shardMats = [1, .86, .74].map(v => { const m = shardMat.clone(); m.color.multiplyScalar(v); return m; });
let shards = null, dust = null;
function makeShards() {
  // 흙 표면 위 임의의 점들을 칸의 씨앗으로
  const P = geo.attributes.position.array, nv = P.length / 3;
  const rs = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let k = 0; k < NS; k++) { const v = Math.floor(rs() * nv) * 3; seeds[k] = new THREE.Vector3(P[v], P[v + 1], P[v + 2]); crackU.uSeeds.value[k].copy(seeds[k]); }
  const I = geo.index.array, bins = Array.from({ length: NS }, () => []);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, d = I[t + 2] * 3;
    const cx = (P[a] + P[b] + P[d]) / 3, cy = (P[a + 1] + P[b + 1] + P[d + 1]) / 3, cz = (P[a + 2] + P[b + 2] + P[d + 2]) / 3;
    let best = 0, bd = 1e9; for (let k = 0; k < NS; k++) { const s = seeds[k], q = (s.x - cx) ** 2 + (s.y - cy) ** 2 + (s.z - cz) ** 2; if (q < bd) { bd = q; best = k; } }
    bins[best].push(I[t], I[t + 1], I[t + 2]);
  }
  const N0 = geo.attributes.normal.array, UV = geo.attributes.uv.array;
  shards = [];
  bins.forEach((tri, k) => {
    if (tri.length < 9) return;
    const c = new THREE.Vector3(); tri.forEach(i => { c.x += P[i * 3]; c.y += P[i * 3 + 1]; c.z += P[i * 3 + 2]; }); c.divideScalar(tri.length);
    const pa = new Float32Array(tri.length * 3), na = new Float32Array(tri.length * 3), ua = new Float32Array(tri.length * 2);
    tri.forEach((i, n) => { pa[n * 3] = P[i * 3] - c.x; pa[n * 3 + 1] = P[i * 3 + 1] - c.y; pa[n * 3 + 2] = P[i * 3 + 2] - c.z; na[n * 3] = N0[i * 3]; na[n * 3 + 1] = N0[i * 3 + 1]; na[n * 3 + 2] = N0[i * 3 + 2]; ua[n * 2] = UV[i * 2]; ua[n * 2 + 1] = UV[i * 2 + 1]; });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pa, 3)); g.setAttribute('normal', new THREE.BufferAttribute(na, 3)); g.setAttribute('uv', new THREE.BufferAttribute(ua, 2));
    const m = new THREE.Mesh(g, shardMats[k % 3]); m.castShadow = m.receiveShadow = true; shardGroup.add(m);
    const ang = Math.atan2(c.z, c.x) + (rs() - .5) * .9, rr = Math.min(1.45, Math.pow(rs(), .7) * 1.35 + .05);
    const rest = new THREE.Vector3(Math.cos(ang) * rr, Math.max(.06, .62 * (1 - (rr / 1.5) ** 1.6)) * (.7 + rs() * .45), Math.sin(ang) * rr);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rs() - .5) * 5, (rs() - .5) * 5, (rs() - .5) * 5));
    const out = new THREE.Vector3(c.x, 0, c.z).normalize();
    shards.push({ m, c, rest, q, out, dl: (1 - c.y / 2.1) * .22 + rs() * .12, pop: .15 + rs() * .3 });
  });
  // 흙먼지: 표면에서 일어나 퍼졌다가 천천히 가라앉는다
  const DN = 1600, dp = new Float32Array(DN * 3), d0 = new Float32Array(DN * 3), dv = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) {
    const v = Math.floor(rs() * nv) * 3; d0[i * 3] = P[v]; d0[i * 3 + 1] = P[v + 1]; d0[i * 3 + 2] = P[v + 2];
    const o = Math.hypot(P[v], P[v + 2]) || 1, sp = .25 + rs() * rs() * 1.6;
    dv[i * 3] = P[v] / o * sp + (rs() - .5) * .5; dv[i * 3 + 1] = rs() * 1.2 - .1; dv[i * 3 + 2] = P[v + 2] / o * sp + (rs() - .5) * .5;
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g2 = cv.getContext('2d'); const gr = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 64, 64);
  const dm = new THREE.PointsMaterial({ color: new THREE.Color('#9a7a5c'), size: .045, map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, opacity: 0 });
  dust = { pts: new THREE.Points(dg, dm), dp, d0, dv, DN, seed: Array.from({ length: DN }, () => rs()) };
  dust.pts.frustumCulled = false; shardGroup.parent.add(dust.pts);
}
const qI = new THREE.Quaternion(), qT = new THREE.Quaternion();
function shatterPose(s, m) {   // s: 부서짐 0→1, m: 흙덩이로 모임 0→1
  const sy = clay.scale.y || 1; shardGroup.position.copy(clay.position); shardGroup.scale.copy(clay.scale).divideScalar(sy);
  for (const S of shards) {
    const u = clamp((s - S.dl) / .62), e = 1 - (1 - u) ** 2;
    const p = S.m.position;
    p.x = S.c.x + (S.rest.x - S.c.x) * e + S.out.x * S.pop * Math.sin(Math.PI * Math.min(1, u * 1.2));
    p.z = S.c.z + (S.rest.z - S.c.z) * e + S.out.z * S.pop * Math.sin(Math.PI * Math.min(1, u * 1.2));
    p.y = S.c.y + (S.rest.y - S.c.y) * u * u + .22 * u * (1 - u);
    S.m.quaternion.copy(qI).slerp(S.q, e);
    if (m > 0) { const k = sm(m); p.x *= 1 - .7 * k; p.z *= 1 - .7 * k; p.y = p.y * (1 - k) + .25 * k; S.m.scale.setScalar(1 - .9 * k); } else S.m.scale.setScalar(1);
  }
  const D = dust; dust.pts.position.copy(clay.position); dust.pts.scale.copy(clay.scale).divideScalar(sy);
  const dt = s * 1.25;
  for (let i = 0; i < D.DN; i++) {
    const tt = Math.max(0, dt - D.seed[i] * .25), q = i * 3;
    D.dp[q] = D.d0[q] + D.dv[q] * tt * .9; D.dp[q + 2] = D.d0[q + 2] + D.dv[q + 2] * tt * .9;
    D.dp[q + 1] = Math.max(.02, D.d0[q + 1] + D.dv[q + 1] * tt * .7 - .9 * tt * tt);
  }
  D.pts.geometry.attributes.position.needsUpdate = true;
  D.pts.material.opacity = .85 * sm(fit(s, 0, .12)) * (1 - sm(fit(s, .55, 1))) * (1 - m);
}
// 클릭하면 바로 부서진다
let burstT = -1;
const hintEl = document.querySelector('#clay .clay-hint');
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

function build(s, wob, ridge, finger, fy, asym, slurry) {
  const k = Math.min(3, Math.floor(s)), f = s - k, A = STAGES[k], B = STAGES[k + 1], H = HN[k + 1], sp = SPREAD[k];
  for (let i = 0; i < N; i++) {
    const l = ease(clamp(f * (1 + sp) - sp * H[i]));         // lower clay moves first
    prof[i * 2] = A[i * 2] + (B[i * 2] - A[i * 2]) * l; prof[i * 2 + 1] = A[i * 2 + 1] + (B[i * 2 + 1] - A[i * 2 + 1]) * l;
  }
  for (let i = 0; i < N; i++) {
    let r = prof[i * 2]; const y = prof[i * 2 + 1];
    if (i >= NA && r > .05) {
      const w = sm(fit(y, .06, .25)), mod = .55 + .45 * Math.sin(y * 3.1 + .6);
      r += ridge * w * mod * (Math.sin(y * 47 + Math.sin(y * 9) * 1.4) * .75 + Math.sin(y * 19 + 1.7) * .4);
      // the fingertips: a soft groove where the hands are pulling right now
      const g = finger * Math.exp(-(((y - fy) / .085) ** 2)) * w; r -= i < NA + NB ? g : g * .5;
      // wet slurry gathers in a soft, uneven foot where the clay meets the wheel
      if (i < NA + NB) r += slurry * (.11 * Math.exp(-y / .045) + .025 * Math.exp(-y / .14));
    }
    pr[i] = r; py[i] = y;
  }
  for (let i = 0; i < N; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(N - 1, i + 1);
    let tr = pr[i1] - pr[i0], ty = py[i1] - py[i0]; const l = Math.hypot(tr, ty) || 1; tr /= l; ty /= l;
    const nr = ty, ny = -tr, lift = clamp(pr[i] / .3), yy = py[i], hi = yy / 2.1;
    for (let j = 0; j <= M; j++) {
      const th = j / M * Math.PI * 2;
      const bump = wob * (Math.sin(th * 3 + yy * 4.1) * .5 + Math.sin(th * 5 - yy * 6.3 + 1.1) * .28 + Math.sin(th * 2 + 2.3) * .6) * lift
        + asym * hi * hi * (Math.sin(th * 2 + yy * 1.3) * .7 + Math.sin(th * 3 + .8) * .3);   // a living, not-quite-true rim
      const r = Math.max(0, pr[i] + bump), q = (i * (M + 1) + j) * 3;
      pos[q] = r * COS[j] + wob * .9 * lift; pos[q + 1] = yy; pos[q + 2] = r * SIN[j];
      nor[q] = nr * COS[j]; nor[q + 1] = ny; nor[q + 2] = nr * SIN[j];
    }
  }
  geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true;
  geo.computeBoundingSphere();
}
build(4, 0, 0, 0, 0, 0, 0); makeShards();   // 조각·균열 칸은 완성된 잔 모양에서 한 번 만들어 둔다

// ---------- the wheel, buried in slip ----------
function sideTexture(c0, c1, rim) {   // c0: 아래 / c1: 위. 가는 가로 홈과 윗모서리의 은은한 하이라이트
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 128, 0, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(0, 0, 1024, 128);
  for (let y = 4; y < 128; y += 5 + Math.random() * 7) { g.fillStyle = `rgba(${Math.random() < .5 ? '240,240,238' : '90,90,88'},${.04 + Math.random() * .08})`; g.fillRect(0, y, 1024, .8 + Math.random() * 1.2); }
  if (rim) { const hl = g.createLinearGradient(0, 0, 0, 20); hl.addColorStop(0, 'rgba(255,255,252,.34)'); hl.addColorStop(1, 'rgba(255,255,252,0)'); g.fillStyle = hl; g.fillRect(0, 0, 1024, 20); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
const wheelHead = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, .14, 128, 1, true), new THREE.MeshStandardMaterial({ map: sideTexture('#a6a5a2', '#b3b2af', true), color: 0xffffff, roughness: .62, metalness: .05, side: THREE.DoubleSide }));
wheelHead.position.y = -.07; spinner.add(wheelHead);
// slip bed: a disc whose height carries spiral throwing marks and a collar of slurry round the clay
const SR = 64, ST = 192, sPos = [], sUv = [], sIdx = [];
for (let a = 0; a <= SR; a++) for (let b = 0; b <= ST; b++) {
  const r = 2.28 * Math.pow(a / SR, .85), th = b / ST * Math.PI * 2;
  const spiral = Math.sin(r * 15 - th * 1 + Math.sin(th * 3 + r * 2) * .6) * .006 + Math.sin(r * 37 + th * 2) * .0025;
  const collar = .07 * Math.exp(-(((r - 1.12) / .26) ** 2)) * (.75 + .25 * Math.sin(th * 4 + r * 6)) + .035 * Math.exp(-(((r - 1.65) / .3) ** 2)) * (.6 + .4 * Math.sin(th * 3 - 1));
  const edge = sm(fit(r, 2.28, 2.0));
  const y = (.012 + spiral + collar) * edge;
  sPos.push(r * Math.cos(th), y, r * Math.sin(th)); sUv.push(.5 + r * Math.cos(th) / 4.6, .5 + r * Math.sin(th) / 4.6);
}
for (let a = 0; a < SR; a++) for (let b = 0; b < ST; b++) { const p = a * (ST + 1) + b, q = p + ST + 1; sIdx.push(p, p + 1, q, q, p + 1, q + 1); }
const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3)); sGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sUv, 2)); sGeo.setIndex(sIdx); sGeo.computeVertexNormals();
function plateTexture(sz) {
  const cv = document.createElement('canvas'); cv.width = cv.height = sz; const g = cv.getContext('2d'), R = sz / 2, k = R / 2.3;
  g.fillStyle = '#a9a8a5'; g.fillRect(0, 0, sz, sz);
  g.save(); g.beginPath(); g.arc(R, R, 2.3 * k, 0, 6.2832); g.clip();
  const gr = g.createRadialGradient(R, R, 0, R, R, 2.3 * k); gr.addColorStop(0, '#b6b5b2'); gr.addColorStop(.6, '#aaa9a6'); gr.addColorStop(1, '#999895'); g.fillStyle = gr; g.fillRect(0, 0, sz, sz);
  // 선반 가공 홈: 가는 동심원, 밝기 들쭉날쭉
  for (let r = 3; r < 2.3 * k; r += .9 + rnd() * 2) { const lt = rnd() < .45; g.strokeStyle = `rgba(${lt ? '238,238,236' : '84,84,82'},${.05 + rnd() * .16})`; g.lineWidth = .4 + rnd() * 1.2; g.beginPath(); g.arc(R, R, r, 0, 6.2832); g.stroke(); }
  g.lineCap = 'round';
  // 마른 슬립: 점토 둘레는 두껍게 번지고 바깥은 호 모양 얼룩으로 드물게
  const slip = (a) => `rgba(${172 + rnd() * 14 | 0},${164 + rnd() * 14 | 0},${152 + rnd() * 14 | 0},${a * .5})`;
  for (let n = 0; n < 420; n++) {
    const near = rnd() < .45, r = near ? (.55 + rnd() * .9) * k : (.4 + rnd() * 1.85) * k, a0 = rnd() * 6.2832, len = .1 + rnd() * rnd() * 2.2, w = near ? 2 + rnd() * 12 : 1 + rnd() * rnd() * 9;
    g.strokeStyle = slip(.1 + rnd() * .4); g.lineWidth = w; g.beginPath(); g.arc(R, R, r, a0, a0 + len); g.stroke();
  }
  // 손가락으로 쓸어낸 소용돌이
  for (let n = 0; n < 7; n++) { const a0 = rnd() * 6.2832, r0 = (.7 + rnd() * 1.2) * k; g.strokeStyle = slip(.45); g.lineWidth = 4 + rnd() * 6; g.beginPath(); for (let t = 0; t <= 1; t += .05) { const aa = a0 + t * 1.1, rr = r0 + Math.sin(t * 6) * 5 + t * 14; g.lineTo(R + Math.cos(aa) * rr, R + Math.sin(aa) * rr); } g.stroke(); }
  // 크게 번진 부드러운 슬립 얼룩과 거뭇한 때
  for (let n = 0; n < 46; n++) { const a0 = rnd() * 6.2832, r = Math.sqrt(rnd()) * 2.1 * k, rad = (.08 + rnd() * .35) * k, dk = rnd() < .3; const gg = g.createRadialGradient(R + Math.cos(a0) * r, R + Math.sin(a0) * r, 0, R + Math.cos(a0) * r, R + Math.sin(a0) * r, rad); gg.addColorStop(0, dk ? 'rgba(104,102,98,.16)' : slip(.3)); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(0, 0, sz, sz); }
  // 얼룩 점
  for (let n = 0; n < 500; n++) { const a0 = rnd() * 6.2832, r = Math.sqrt(rnd()) * 2.25 * k; g.fillStyle = rnd() < .6 ? slip(.08 + rnd() * .3) : `rgba(96,95,92,${.05 + rnd() * .12})`; g.beginPath(); g.ellipse(R + Math.cos(a0) * r, R + Math.sin(a0) * r, .6 + rnd() * 3.5, .5 + rnd() * 2, a0 + 1.57, 0, 6.2832); g.fill(); }
  g.restore();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const BED = slipMaps(512, 170); [BED.normal, BED.rough, BED.color].forEach(t => t.repeat.set(2, 1.5));
const bedMat = new THREE.MeshStandardMaterial({ map: plateTexture(1024), color: 0xffffff, roughness: .62, metalness: .05 });
const bed = new THREE.Mesh(sGeo, bedMat); bed.receiveShadow = true; spinner.add(bed);
const panPts = [[0, -.5], [2.5, -.5], [2.52, -.3], [2.6, -.2], [2.68, -.2], [2.72, -.3], [2.74, -.34], [3.1, -.08], [3.2, -.05], [3.26, -.07], [3.2, -.14], [2.86, -.96], [0, -.96]];
const base = new THREE.Mesh(new THREE.LatheGeometry(panPts.map(([x, y]) => new THREE.Vector2(x, y)), 160), new THREE.MeshStandardMaterial({ color: 0x2c211a, roughness: .78, metalness: .25, side: THREE.DoubleSide }));
scene.add(base);
const wheelMats = [wheelHead.material, bedMat, base.material];
function wheelShow(w) {
  for (const m of wheelMats) { const tr = w < .999; if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; } m.opacity = w; m.depthWrite = w > .5; }
  wheelHead.visible = bed.visible = base.visible = w > .002;
}

// ---------- slip droplets ----------
const DN = 220, dPos = new Float32Array(DN * 3), dVel = new Float32Array(DN * 3), dLife = new Float32Array(DN);
const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,250,240,1)'); r.addColorStop(.4, 'rgba(230,220,205,.6)'); r.addColorStop(1, 'rgba(230,220,205,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const drops = new THREE.Points(dGeo, new THREE.PointsMaterial({ size: .04, map: dot, transparent: true, depthWrite: false, opacity: .6, color: 0xd8cdbd }));
scene.add(drops); for (let i = 0; i < DN; i++) dPos[i * 3 + 1] = -99;
let dNext = 0;
function emit(n, y, rad, ang) {
  for (let k = 0; k < n; k++) {
    const i = dNext = (dNext + 1) % DN, a = ang + rnd() * Math.PI * 2;
    dPos[i * 3] = Math.cos(a) * rad; dPos[i * 3 + 1] = y + (rnd() - .5) * .1; dPos[i * 3 + 2] = Math.sin(a) * rad;
    const sp = 1 + rnd() * 1.2;
    dVel[i * 3] = -Math.sin(a) * sp + Math.cos(a) * .4; dVel[i * 3 + 1] = .2 + rnd() * .6; dVel[i * 3 + 2] = Math.cos(a) * sp + Math.sin(a) * .4;
    dLife[i] = .4 + rnd() * .4;
  }
}

// ---------- 앞 장면 잔과 화면 맞춤 ----------
const H4 = 2.08, R4 = .94, TILT = -.08;   // 소리잔 높이·반지름, 앞 장면 잔의 마지막 기울기
let fitD = H4 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * .345), fitY = H4 / 2, fitX = 0, heroRect = null;
const fitBox = new THREE.Box3(), fitV = new THREE.Vector3();
function placeCam(X, Y, D, E, Az) {
  camera.position.set(X + Math.sin(Az) * D * Math.cos(E), Y + D * Math.sin(E), Math.cos(Az) * D * Math.cos(E));
  camera.lookAt(X, Y, 0); camera.updateMatrixWorld(true);
}
// 잔의 실제 실루엣: 완성형 단면(바깥 벽)의 점들을 앞·뒤·좌·우로 돌려 화면에 투영한 사각형
const OUTER = []; { const P = STAGES[4]; for (let i = NA; i < NA + NB; i += 3) OUTER.push([P[i * 2], P[i * 2 + 1]]); }
function clayRect() {
  clay.updateMatrixWorld(true);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [r, y] of OUTER) for (let q = 0; q < 4; q++) {
    fitV.set(q === 0 ? r : q === 1 ? -r : 0, y, q === 2 ? r : q === 3 ? -r : 0).applyMatrix4(clay.matrixWorld).project(camera);
    x0 = Math.min(x0, fitV.x); x1 = Math.max(x1, fitV.x); y0 = Math.min(y0, fitV.y); y1 = Math.max(y1, fitV.y);
  }
  const w = innerWidth, h = innerHeight;
  return { cx: (x0 + x1) / 4 * w + w / 2, cy: h / 2 - (y0 + y1) / 4 * h, h: (y1 - y0) / 2 * h, w: (x1 - x0) / 2 * w };
}
// 앞 장면(히어로 3D) 소리잔이 되감기 직전에 서는 자리: 히어로는 잔을 화면 높이 기준으로 맞추므로
// 실루엣도 화면 높이에 비례한다(1280×720에서 잰 값: 높이 265px, 폭 213px, 중심 y 352px).
// 히어로가 잰 실제 실루엣(window.__kwangjuyoCupSil)을 쓰고, 없을 때만 위 비율을 쓴다.
let silHold = null;
const heroSil = () => {
  const S = window.__kwangjuyoCupSil;
  // 히어로 잔의 회전이 다 끝나 멈춘 상태에서만 받는다(돌고 있는 중간 크기를 붙잡지 않도록)
  if (S && S.h > 8 && (window.__kwangjuyoHeroTurnNow ?? 1) > .995) silHold = { ...S };
  return silHold || { cx: innerWidth / 2, cy: innerHeight * .489, h: innerHeight * .368, w: innerHeight * .296 };
};
const heroQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT), orientQ = new THREE.Quaternion(), spinQ = new THREE.Quaternion(), IDQ = new THREE.Quaternion(), YAX = new THREE.Vector3(0, 1, 0);
// 앞 장면 잔의 카메라 기준 자세를 이 카메라에 그대로 옮긴다(앞으로 살짝 기운 각도 포함)
const poseLikeHero = () => spinner.quaternion.copy(camera.quaternion).multiply(heroQ);
let fitK = 1;   // 앞 장면 잔과 폭을 맞추는 가로 배율(되감기가 진행되며 1로 돌아간다)
function solveFit() {
  const T = heroSil(); clay.scale.set(fitK, 1, fitK);
  for (let k = 0; k < 4; k++) {
    placeCam(fitX, fitY, fitD, .1, 0); poseLikeHero();
    let r = clayRect(); fitD = clamp(fitD * r.h / T.h, 3, 60);
    placeCam(fitX, fitY, fitD, .1, 0); poseLikeHero();
    r = clayRect(); const wpp = 2 * fitD * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight;
    fitY -= (r.cy - T.cy) * wpp; fitX += (r.cx - T.cx) * wpp;
    fitK = clamp(fitK * T.w / r.w, .7, 1.3); clay.scale.set(fitK, 1, fitK);
  }
}

// ---------- scroll → intent; the hands follow at their own pace ----------
const section = document.getElementById('clay');
const beatsUpdate = createBeats(document.querySelector('#clay .make-stage'), 'clay');
let target = 0, p = 0;
const hudEl = document.querySelector('#clay .rewind-hud'), hudBar = hudEl && hudEl.querySelector('.rewind-hud-bar>span');
function hud(r) {
  if (!hudEl) return;
  const o = r < 0 ? 0 : sm(fit(r, 0, .12)) * (1 - sm(fit(r, .85, 1)));
  hudEl.style.opacity = o.toFixed(3);
  if (hudBar) hudBar.style.transform = `scaleX(${(1 - Math.max(0, r)).toFixed(4)})`;
}
const LEAD = .75; // 앞 섹션이 끝나기 전, 흙이 서서히 나타나는 구간(화면 높이 기준)
const readScroll = () => { const r = section.getBoundingClientRect(), lead = innerHeight * LEAD; target = clamp((-r.top + lead) / (r.height - innerHeight + lead)); };
addEventListener('scroll', readScroll, { passive: true });
// 0 … P0: 앞 장면의 소리잔과 겹쳐지는 동안 완성된 잔 그대로 멈춰 있다.
// P0 … P1: 되감기 — 유약이 벗겨지고, 마른 흙이 다시 젖고, 형태가 풀려 흙덩이로 돌아간다.
// P1 … 1 : 다시 앞으로 — 흙덩이에서 잔이 만들어진다.
const P0 = .08, P1 = .34, LS = .8, rp = q => P1 + q * (LS - P1);   // LS 뒤는 완성된 잔이 물레에서 떠올라 가마로 가는 구간
const KEYS = [[.06, .2], [.26, .42], [.47, .65], [.7, .86]].map(([a, b]) => [rp(a), rp(b)]);
const stageOf = q => KEYS.reduce((s, [a, b]) => s + fit(q, a, b), 0);
function resize() { const w = innerWidth, h = innerHeight; renderer.setPixelRatio(sceneDpr()); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize(); readScroll();

const clock = new THREE.Clock();
let spin = 0, sCur = 0, sVel = 0, act = 0, passT = 0, built = '', dryCur = 0;
let live = false, running = false;
function frame() {
  const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
  p += (target - p) * (1 - Math.pow(.002, dt));
  // a spring with a speed limit: the form never snaps to the scroll; it is worked toward it,
  // easing in, keeping on a moment after you stop, and never faster than hands could go
  const sT = stageOf(p);
  const intro = p < P1, rew = fit(p, P0, P1);
  if (intro) {
    // 되감기: 스크롤에 바로 붙어서 빠르게 풀린다(뒤로 감는 테이프처럼)
    const s2 = rew < .6 ? 4 : 0;   // 잔은 부서지는 동안 조각 뒤로 숨고, 흙덩이로 바뀐다
    sVel = 0; sCur = s2;
  } else if (reduced) { sCur = sT; sVel = 0; } else {
    const k = 16, c = 2 * Math.sqrt(k) * 1.05;   // 스크롤에 더 가깝게 따라온다
    sVel += (k * (sT - sCur) - c * sVel) * dt;
    const lim = sVel > 0 ? 2.4 : 3; sVel = clamp(sVel, -lim, lim);
    sCur = clamp(sCur + sVel * dt, 0, 4);
  }
  // how busy the hands are (drives finger groove, droplets, wheel push)
  act += ((intro ? 0 : clamp(Math.abs(sVel) / .3)) - act) * (1 - Math.pow(.02, dt));
  passT += dt * (.35 + .5 * act);
  const wob = .085 * (1 - sm(fit(sCur, 0, .9)));
  const ridge = .0056 * sm(fit(sCur, 1.3, 2.5)) * (1 - .88 * sm(fit(sCur, 3.0, 3.95))) + .0005 * (1 - dryCur);
  const pulling = sm(fit(sCur, 1.6, 2.1)) * (1 - sm(fit(sCur, 3.7, 3.98)));
  const finger = reduced ? 0 : .022 * act * pulling;
  const topY = prof[(NA + NB - 1) * 2 + 1] || 1;
  const fy = (passT % 1) * topY * 1.05;                       // each pass climbs from the foot to the rim
  const asym = reduced ? 0 : (.004 + .006 * act) * (1 - dryCur) * sm(fit(sCur, 1, 2));
  const glz = intro ? 1 - sm(fit(rew, .02, .2)) : 0;   // 유약: 되감기 첫머리에 벗겨진다
  const slurry = (1 - .85 * sm(fit(sCur, 3.55, 3.98))) * (1 - glz);
  const sig = [sCur, wob, ridge, finger, fy, asym, slurry].map(v => v.toFixed(4)).join();
  if (sig !== built) { build(sCur, wob, ridge, finger, fy, asym, slurry); built = sig; }

  // drying follows the scroll too, but slowly, like air does
  if (intro) dryCur = 1 - sm(fit(rew, .78, .98));        // 흙덩이가 되고서야 다시 젖는다
  else { const dryT = sm(fit(p, rp(.87), rp(.98))) * (sCur > 3.9 ? 1 : 0); dryCur += (dryT - dryCur) * (1 - Math.pow(.25, dt)); }
  clayMat.color.copy(WET).lerp(DRY, dryCur);
  // 역행 단계: 초벌(흰) → 마른 흙빛 → 금 → 부서짐 → 흙더미 → 흙덩이
  let shat = 0, gather = 0, crack = 0;
  if (intro) {
    if (rew < .12 && burstT >= 0) burstT = -1;
    const burst = burstT >= 0 ? sm(clamp((t - burstT) / 1.5)) : 0;
    crack = Math.max(sm(fit(rew, .22, .4)), burstT >= 0 ? 1 : 0);
    shat = Math.max(sm(fit(rew, .42, .68)), burst);
    gather = sm(fit(rew, .7, .84));
    clayMat.color.lerp(RAW, sm(fit(rew, .12, .3)) * dryCur);
    if ((crack > .001 || shat > .001) && !shards && sCur === 4) makeShards();   // (보통은 미리 데우기에서 이미 만들어 둔다)
  }
  crackU.uCrack.value = intro && rew < .6 ? crack : 0;
  if (shards) {
    const on = intro && shat > .001 && gather < .999;
    shardGroup.visible = on; dust.pts.visible = on;
    if (on) shatterPose(shat, gather);
  }
  clay.visible = !(intro && shat > .02 && (rew < .6 || gather < .02));
  if (hintEl) hintEl.style.opacity = (intro && burstT < 0 ? sm(fit(rew, .14, .22)) * (1 - sm(fit(rew, .36, .42))) : 0).toFixed(3);
  clayMat.clearcoat = .2 * (1 - dryCur); clayMat.clearcoatRoughness = .45 + .3 * dryCur;
  clayMat.normalScale.setScalar(.55 - .4 * dryCur);
  clayMat.roughness = 1;
  clayMat.sheen = .3 + .4 * dryCur;
  if (glz > 0) {
    clayMat.color.lerp(GLAZE, glz); clayMat.roughness += (.16 - clayMat.roughness) * glz;
    clayMat.clearcoat += (1 - clayMat.clearcoat) * glz; clayMat.clearcoatRoughness += (.03 - clayMat.clearcoatRoughness) * glz;
    clayMat.normalScale.multiplyScalar(1 - .9 * glz); clayMat.sheen *= 1 - glz;
  }
  const lift = intro ? 0 : sm(fit(p, .82, .99)) * sm(fit(sCur, 3.85, 4));
  wheelShow(intro ? sm(fit(rew, .04, .4)) : 1 - sm(fit(lift, .2, .7)));

  // the wheel: steady while working, pushed by busy hands, coasting to rest as it dries
  // 되감는 동안 물레는 거꾸로, 빠르게 돈다
  const omega = reduced ? 0 : intro ? -11 * sm(fit(rew, .02, .25)) * (1 - .75 * sm(fit(rew, .8, 1))) - 2.7 * sm(fit(rew, .8, 1))
    : (2.7 + 1.8 * act) * (1 - sm(fit(dryCur, .1, .9)));
  spin += omega * dt; spinner.rotation.y = spin;
  if (!reduced && !intro && pulling + (1 - sm(fit(sCur, 0, 1))) * .5 > .05 && act > .15) {
    const ii = clamp(Math.round((fy / topY) * (NB - 1)), 0, NB - 1) + NA;
    const n = Math.floor(act * 3 * (rnd() < .5 ? 1 : 0));
    if (n) emit(n, prof[ii * 2 + 1], prof[ii * 2] + .02, spin);
  }
  for (let i = 0; i < DN; i++) { if (dLife[i] <= 0) { dPos[i * 3 + 1] = -99; continue; } dLife[i] -= dt; dVel[i * 3 + 1] -= 6 * dt; dPos[i * 3] += dVel[i * 3] * dt; dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt; dPos[i * 3 + 2] += dVel[i * 3 + 2] * dt; if (dPos[i * 3 + 1] < 0) dLife[i] = 0; }
  dGeo.attributes.position.needsUpdate = true;

  // camera: low and close on the lump, easing up and back as the cup grows, with a slow drift
  const grow = sm(fit(sCur, 2, 4)), narrow = innerWidth / innerHeight < .9 ? 1.45 : 1;
  const ty = .55 + .5 * grow, dist = (13.2 + 2.6 * grow) * narrow, el = .24 + .06 * grow, az = -.12 + Math.sin(t * .11) * .05;
  // 되감기 첫 장면은 앞 장면 3D 소리잔과 화면에서 같은 크기·같은 자리에 선다.
  // 히어로가 알려주는 잔의 화면 사각형(window.__kwangjuyoCupRect)에 맞춰 카메라 거리와 높이를 푼다.
  const cb = intro ? sm(fit(rew, .2, 1)) : 1;
  const hv = window.__kwangjuyoCupView; if (intro && hv) heroQ.set(hv[0], hv[1], hv[2], hv[3]);
  { const k = 1 + (fitK - 1) * (1 - (intro ? sm(fit(rew, .15, .6)) : 1)); clay.scale.set(k, 1, k); }
  if (intro) { solveFit(); const k = 1 + (fitK - 1) * (1 - sm(fit(rew, .15, .6))); clay.scale.set(k, 1, k); if (rew >= .6) clay.scale.multiplyScalar(.35 + .65 * sm(fit(rew, .7, .86))); }
  const D = fitD + (dist - fitD) * cb, E = .1 + (el - .1) * cb, Y = fitY + (ty - .05 - fitY) * cb, X = fitX * (1 - cb), Az = az * cb;
  // 마우스를 따라 잔이 아주 살짝 돌아보는 움직임(히어로·시리즈와 같은 값). 되감기·깨짐 동안과 가마로 내려앉을 때는 끈다.
  const SWc = window.__kjySway, swg = !intro && !reduced && SWc ? 1 - sm(fit(lift, .55, .9)) : 0;
  placeCam(X, Y, D, E + (swg ? SWc.y * .03 * swg : 0), Az - (swg ? SWc.x * .07 * swg : 0));
  // 자세: 되감기 첫머리는 앞 장면 잔과 같은 각도, 물레가 드러나며 곧게 선다. 그 위에 물레 회전.
  if (intro) orientQ.copy(camera.quaternion).multiply(heroQ).slerp(IDQ, cb); else orientQ.identity();
  spinner.quaternion.copy(orientQ).multiply(spinQ.setFromAxisAngle(YAX, spin));
  // 떠오름: 완성된 잔이 물레를 떠나 위로 올랐다가, 가마 속 잔의 화면 자리와 크기로 작아지며 내려앉는다
  if (!intro) {
    if (lift > .0005 && window.__fireCup) {
      camera.updateMatrixWorld(); const tp = (y) => { const v = new THREE.Vector3(0, y, 0).project(camera); return [(v.x * .5 + .5) * innerWidth, (.5 - v.y * .5) * innerHeight]; };
      clay.scale.set(1, 1, 1); clay.position.set(0, 0, 0);
      const b0 = tp(0), t0 = tp(topY), h0 = Math.abs(b0[1] - t0[1]) || 1, cx0 = (b0[0] + t0[0]) / 2, cy0 = (b0[1] + t0[1]) / 2, F = window.__fireCup;
      const e = sm(fit(lift, .04, .75)), s = 1 + (.873 * F.h / h0 - 1) * e;
      // 떠오름 → 살짝 기울어 둥둥 → 내려와 굽 한쪽이 먼저 닿고 → 그 자리를 축으로 천천히 바로 선다
      const hov = .045 * innerHeight * sm(fit(lift, .06, .4)) * (1 - sm(fit(lift, .6, .83)));
      const bob = -Math.sin(t * 1.4) * .006 * innerHeight * sm(fit(lift, .15, .45)) * (1 - sm(fit(lift, .55, .75)));
      const tilt = .17 * sm(fit(lift, .08, .42)) * (1 - sm(fit(lift, .83, .99)));
      const wx = cx0 + (F.x - cx0) * e, wy = cy0 + (F.y - cy0) * e - hov - bob;
      const ppu = innerHeight / (2 * camera.position.distanceTo(new THREE.Vector3(0, topY / 2, 0)) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      const rt = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const fwd = camera.getWorldDirection(new THREE.Vector3());
      const off = rt.clone().multiplyScalar((wx - cx0) / ppu).add(up.clone().multiplyScalar(-(wy - cy0) / ppu));
      const C0 = new THREE.Vector3(0, topY / 2, 0), Pw = C0.clone().add(off).addScaledVector(C0, -s);
      let footR = 0; for (let i = 0; i < prof.length / 2; i++) if (prof[i * 2 + 1] < topY * .04) footR = Math.max(footR, prof[i * 2]);
      const tq = new THREE.Quaternion().setFromAxisAngle(fwd.clone().addScaledVector(rt, .35).normalize(), tilt);
      const Fw = new THREE.Vector3(rt.x, 0, rt.z).normalize().multiplyScalar(-footR * s);   // 왼쪽 굽 가장자리를 축으로
      Pw.add(Fw).sub(Fw.clone().applyQuaternion(tq));
      const sInv = spinner.quaternion.clone().invert();
      clay.quaternion.copy(sInv).multiply(tq).multiply(spinner.quaternion);
      clay.scale.set(s, s, s); clay.position.copy(Pw.applyQuaternion(sInv)); clayMat.color.multiplyScalar(1 - .32 * e);
    } else if (clay.position.lengthSq()) { clay.position.set(0, 0, 0); clay.scale.set(1, 1, 1); clay.quaternion.identity(); }
  }
  if (lift > .85 && Math.abs(lift - (window.__clayDone || 0)) > .002) requestAnimationFrame(() => dispatchEvent(new Event('scroll')));
  window.__clayDone = lift;   // 불 장면은 이 값이 1에 가까워진 뒤에야 겹쳐 들어온다
  hud(intro && !reduced ? rew : -1);

  beatsUpdate(p);
  renderer.render(scene, camera);
  if (live) requestAnimationFrame(frame); else running = false;
}
canvas.addEventListener('pointerdown', ev => {
  if (!(p < P1) || burstT >= 0 || fit(p, P0, P1) > .42) return;
  const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (ray.intersectObject(clay, false).length) { if (!shards) makeShards(); burstT = clock.elapsedTime; }
});
canvas.addEventListener('pointermove', ev => {
  if (!(p < P1)) { canvas.style.cursor = ''; return; }
  const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  canvas.style.cursor = burstT < 0 && fit(p, P0, P1) < .42 && ray.intersectObject(clay, false).length ? 'pointer' : '';
});
// 미리 데우기: 셰이더 컴파일과 첫 그리기를 로드 시점에 끝내 둔다(전환 순간 끊김 방지)
const warm = () => { if (running) return; try { sCur = 4; build(4, 0, 0, 0, 0, 0, 0); if (!shards) makeShards(); built = ''; wheelShow(1); renderer.compile(scene, camera); renderer.render(scene, camera); wheelShow(.5); renderer.compile(scene, camera); renderer.render(scene, camera); wheelShow(0); sCur = 0; } catch (e) { } };
(window.requestIdleCallback || (f => setTimeout(f, 300)))(warm);
window.__clayGL = { renderer, scene, camera };   // 깨짐·물레 장면(breakwheel.js)이 자기 셰이더를 미리 준비할 때 쓴다
new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live && !running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }, { rootMargin: '100% 0px 100% 0px' }).observe(section);
window.__clayDbg = () => ({ cs: clay.scale.toArray(), sg: shardGroup.scale.toArray(), vis: shardGroup.visible, n: shards && shards.length, p });
window.__clay = { settle: () => { p = target; sCur = p < P1 ? 4 * (1 - sm(fit(fit(p, P0, P1), .22, 1))) : stageOf(p); sVel = 0; dryCur = sm(fit(p, .87, .98)) * (sCur > 3.9 ? 1 : 0); }, busy: v => { act = v; }, state: () => ({ sCur, act, dryCur }) };
