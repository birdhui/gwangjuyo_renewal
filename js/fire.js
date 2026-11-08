import { createBeats } from './beats.js';

// The kiln was rendered offline in Blender Cycles, one light at a time, from this fixed camera:
// studio light (bisque and glazed), the burners, the hot chamber's own glow, and the ware's heat.
// Light adds linearly, so the page relights the photograph live by mixing those passes.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const SCREEN = {"b-10_base": [0.4585324823856354, 0.17827177047729492, 13.505341529846191], "b-10_top": [0.4583415389060974, 0.3486948013305664, 13.44344425201416], "b-11_base": [0.4522262215614319, 0.14694054424762726, 12.557284355163574], "b-11_top": [0.4519895911216736, 0.3301388621330261, 12.49538803100586], "b-12_base": [0.44489002227783203, 0.11049213260412216, 11.609228134155273], "b-12_top": [0.4445946216583252, 0.30853596329689026, 11.547330856323242], "b10_base": [0.7850977182388306, 0.17310279607772827, 13.339193344116211], "b10_top": [0.786426842212677, 0.3456343710422516, 13.27729606628418], "b11_base": [0.8036927580833435, 0.14095602929592133, 12.391136169433594], "b11_top": [0.8052173852920532, 0.3265930116176605, 12.329239845275879], "b12_base": [0.8253689408302307, 0.10348252207040787, 11.443079948425293], "b12_top": [0.8271384835243225, 0.3043793737888336, 11.381182670593262], "cup": [0.6242101192474365, 0.4150647819042206, 11.635396003723145]};
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fit = (v, a, b) => clamp((v - a) / (b - a));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sm = t => t * t * (3 - 2 * t);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function blackbody(K, out = new THREE.Color()) {
  const t = K / 100; let r, g, b;
  r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return out.setRGB(clamp(r / 255), clamp(g / 255), clamp(b / 255), THREE.SRGBColorSpace);
}

const canvas = document.getElementById('fire-gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
const sceneDpr = () => Math.min(devicePixelRatio || 1, innerWidth >= 2560 ? 1 : 1.5);
renderer.setPixelRatio(sceneDpr());
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const IMG_ASPECT = 16 / 9;

// ---------- the relit photograph ----------
const NAMES = ['studio', 'studio_glaze', 'fire', 'glow', 'ware'];
const loader = new THREE.TextureLoader();
const scales = await (await fetch('img/fire/scales.json')).json();
const tex = Object.fromEntries(await Promise.all(NAMES.map(n => new Promise(res => loader.load(`img/fire/${n}.webp`, t => { t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; res([n, t]); })))));
const U = {
  tS: { value: tex.studio }, tSG: { value: tex.studio_glaze }, tF: { value: tex.fire }, tG: { value: tex.glow }, tW: { value: tex.ware },
  sS: { value: scales.studio }, sSG: { value: scales.studio_glaze }, sF: { value: scales.fire }, sG: { value: scales.glow }, sW: { value: scales.ware },
  uKiln: { value: new THREE.Vector2(.645, .5) }, uSx: { value: 1 }, uOx: { value: 0 }, uZw: { value: 0 }, uMx: { value: new THREE.Vector2(.36, .62) }, kS: { value: 1 }, glaze: { value: 0 }, cF: { value: new THREE.Vector3() }, cG: { value: new THREE.Vector3() }, cW: { value: new THREE.Vector3() },
};
const photo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    varying vec2 vUv;
    uniform vec2 uKiln; uniform float uSx, uOx, uZw; uniform vec2 uMx;
    uniform sampler2D tS, tSG, tF, tG, tW; uniform float sS, sSG, sF, sG, sW, kS, glaze; uniform vec3 cF, cG, cW;
    vec3 dec(sampler2D t, float s){ vec3 v = pow(texture2D(t, vUv).rgb, vec3(2.2)); v = min(v, vec3(.996)); return s * v / (1. - v); }
    void main(){
      vec3 studio = mix(dec(tS, sS), dec(tSG, sSG), glaze) * kS;
      vec3 c = studio + dec(tF, sF) * cF + dec(tG, sG) * cG + dec(tW, sW) * cW;
      // 가마를 화면 한가운데에 작게 두고, 사진의 가장자리는 어둠으로 풀어 장면이 떠 있는 것처럼 보이게 한다
      vec2 dd = abs(vUv - uKiln);
      float m = (1. - smoothstep(.22, .345, dd.x)) * (1. - smoothstep(.34, .49, dd.y));
      // 크게 당겨졌을 때는 화면 가운데 폭만 남기고 양옆을 어둠으로 거둔다
      float nx = abs((vUv.x - .5) * 2. * uSx + uOx);
      m *= mix(1., 1. - smoothstep(uMx.x, uMx.y, nx), uZw);
      gl_FragColor = vec4(c, m);
    }`,
  transparent: true, depthTest: false, depthWrite: false,
}));
photo.renderOrder = -1;
// 배경: 위의 Rewind·흙 장면에서 이어지는 같은 어두운 갈색 바탕(왼쪽 아래의 따뜻한 번짐 포함). 사진은 이 위에 가장자리가 풀리며 놓인다.
const BG_GAIN = { value: 1.3 };
const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: { gain: BG_GAIN },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `
    varying vec2 vUv; uniform float gain;
    void main(){
      // body.story-phase 의 #181411 이 ACES 톤매핑을 거친 뒤에도 그대로 나오도록 미리 역산한 선형값
      gl_FragColor = vec4(vec3(.02356, .01948, .01662) * gain, 1.);
    }`,
  depthTest: false, depthWrite: false,
}));
bgMesh.renderOrder = -2; bgMesh.frustumCulled = false;
scene.add(bgMesh);
scene.add(photo);

// ---------- burner flames, placed where the burners are in the photograph ----------
const flameMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uHeat: { value: 0 }, uWarm: { value: 0 }, uSeed: { value: 0 }, uCol: { value: new THREE.Color() } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    varying vec2 vUv; uniform float uTime, uHeat, uWarm, uSeed; uniform vec3 uCol;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n(p); p *= 2.03; a *= .5; } return s; }
    void main(){
      vec2 p = vUv; float t = uTime;
      float f = fbm(vec2(p.x * 4. + uSeed, p.y * 2.6 - t * 2.6));
      float w = .5 - abs(p.x - .5 + (f - .5) * .35 * p.y);
      float shape = smoothstep(.0, .22, w) * smoothstep(1., .15, p.y + (f - .5) * .6) * smoothstep(0., .06, p.y);
      vec3 blue = vec3(.25, .45, 1.) * smoothstep(.25, .0, p.y) * smoothstep(.1, .3, w);
      vec3 gas = vec3(.28, .5, 1.) * (shape * .9 + pow(shape, 3.) * 1.4);
      vec3 c = (mix(gas, uCol * (shape * .5 + pow(shape, 3.) * .9), uWarm) + blue * .35) * uHeat;
      gl_FragColor = vec4(c, 1.);
    }`,
  blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
});
const BURNERS = [];
[-1, 1].forEach(sg => [0, 1, 2].forEach(k => {
  const b = SCREEN[`b${sg}${k}_base`], t = SCREEN[`b${sg}${k}_top`];
  const mat = flameMat.clone(); mat.uniforms = THREE.UniformsUtils.clone(flameMat.uniforms);
  const g = new THREE.PlaneGeometry(1, 1); g.translate(0, .5, 0);
  const m = new THREE.Mesh(g, mat); scene.add(m);
  BURNERS.push({ m, mat, b, t, order: [2, 5, 1, 4, 0, 3].indexOf(sg < 0 ? k : 3 + k), lit: false, flashT: -9, seed: Math.random() * 10 });
}));

// ---------- post ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .2, .5, .9); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uHeat: { value: 0 }, uFlash: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime, uHeat, uFlash; uniform vec2 uRes;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    void main(){
      vec2 q = vUv * vec2(uRes.x / uRes.y, 1.) * vec2(6., 3.5);
      float w = (n(q + vec2(0., -uTime * 1.6)) + .5 * n(q * 2.1 + vec2(3.1, -uTime * 2.7))) - .75;
      vec2 uv = vUv + vec2(w, w * .5) * .004 * uHeat;
      vec2 d = uv - .5; float r2 = dot(d, d);
      vec3 c = vec3(texture2D(tDiffuse, uv + d * r2 * .005).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d * r2 * .005).b);
      c += vec3(.55, .7, 1.) * uFlash * .05 * (1. - r2 * 2.);
      c *= 1. - r2 * 1.0;
      c += (h(vUv * uRes + fract(uTime) * 91.7) - .5) * .012;
      gl_FragColor = vec4(c, 1.);
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// cover the viewport with the 16:9 photograph; on narrow screens keep the kiln in view
let sx = 1, sy = 1, ox = 0, oy = 0, zt = 0;
function place() {
  // 가마(사진에서 가로 .49)를 화면 중앙에 두고 작게: 데스크톱은 화면 높이의 약 .6배, 좁은 화면은 가로에 맞춘다
  const a = innerWidth / innerHeight, wide = a >= IMG_ASPECT - 1e-3;
  const bx = wide ? 1 : IMG_ASPECT / a, by = wide ? a / IMG_ASPECT : 1;
  const Z = Math.min(.9, 1.7 / (.98 * bx));
  const sx0 = bx * Z, sy0 = by * Z, kc = U.uKiln.value, ih = innerHeight, iw = innerWidth;
  // 처음엔 가마를 크게 당겨서, 앞 장면에 떠 있는 잔이 거의 움직이지 않고 선반 위 그 자리에 놓이게 한다. 그다음 천천히 물러난다.
  const narrowV = iw < 768, Pf = [iw * .5, ih * .5], hF = (narrowV ? .311 : .364) * ih;   // 히어로·시리즈 소리잔과 같은 화면 크기
  const Kz = 1, ZK = 1;   // 가마는 원래 크기 그대로(확대하지 않음). 잔이 작아져 선반에 앉는다
  const cupV = [.624, .415 - .0185 / sy0];
  const ox0 = -(kc.x - .5) * 2 * sx0, oy0 = -(kc.y - .5) * 2 * sy0;
  const Ncn = [(cupV[0] - .5) * 2 * sx0 + ox0, (cupV[1] - .5) * 2 * sy0 + oy0], Nf = [(Pf[0] / iw - .5) * 2, (.5 - Pf[1] / ih) * 2];
  const w = Kz > 1 ? (ZK - 1) / (Kz - 1) : 0, Nc = [Ncn[0] + (Nf[0] - Ncn[0]) * w, Ncn[1] + (Nf[1] - Ncn[1]) * w];
  // 당겨졌을 때 가마 속 잔의 폭을 히어로 잔과 맞춘다
  sx = sx0 * ZK * (1 - .05 * w); sy = sy0 * ZK; ox = Nc[0] - (cupV[0] - .5) * 2 * sx; oy = Nc[1] - (cupV[1] - .5) * 2 * sy;
  photo.scale.set(sx, sy, 1); photo.position.set(ox, oy, 0);
  U.uSx.value = sx; U.uOx.value = ox; U.uZw.value = w; U.uMx.value.set(narrowV ? .8 : .36, narrowV ? 1.05 : .62);
  const toNDC = (u, v) => [(u - .5) * 2 * sx + ox, (v - .5) * 2 * sy + oy];
  { const kn = toNDC(kc.x, kc.y), st = document.querySelector('#fire .make-stage'); if (st) { st.style.setProperty('--kx', `${((kn[0] * .5 + .5) * iw).toFixed(1)}px`); st.style.setProperty('--ky', `${((.5 - kn[1] * .5) * ih).toFixed(1)}px`); } } // 가마 중심(화면 좌표): 등장 때 여기서부터 퍼지며 나타난다
  window.__fireCup = { x: (Nc[0] * .5 + .5) * iw, y: (.5 - Nc[1] * .5) * ih, h: .105 * sy0 * ih };
  BURNERS.forEach(B => { const [bx2, by2] = toNDC(B.b[0], B.b[1]), [tx, ty] = toNDC(B.t[0], B.t[1]); B.x = bx2; B.y = by2; B.h = ty - by2; B.w = .028 * sx; B.m.position.set(bx2, by2, 0); });
}
function resize() { const pr = sceneDpr(); renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); grade.uniforms.uRes.value.set(innerWidth * pr, innerHeight * pr); place(); }
addEventListener('resize', resize); resize();

// ---------- scroll → target temperature; the kiln answers with thermal inertia ----------
const section = document.getElementById('fire');
const beatsUpdate = createBeats(document.querySelector('#fire .make-stage'), 'fire');
let target = 0, p = 0;
const LEAD = -1.0; // 물레 암전과 가마 등장이 끝난 뒤(섹션 위 경계가 화면 위로 1화면 지난 뒤)부터 불이 붙기 시작한다
const readScroll = () => { const r = section.getBoundingClientRect(), lead = innerHeight * LEAD; target = clamp((-r.top + lead) / (r.height - innerHeight + lead)); };
addEventListener('scroll', readScroll, { passive: true }); readScroll();
const heatOf = q => sm(fit(q, .1, .5)) * (1 - sm(fit(q, .64, .92)));
const glazeOf = q => sm(fit(q, .4, .6));
const STILL = /[?&]still\b/.test(location.search);
const clock = new THREE.Clock();
let heat = 0, glaze = 0;
const col = new THREE.Color(), col2 = new THREE.Color(), blueish = new THREE.Color(.5, .66, 1), fc = new THREE.Color();
let live = false, running = false;
function frame() {
  const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
  p += (target - p) * (1 - Math.pow(.002, dt));
  { // 장면이 완전히 드러난 뒤에만 가마가 물러난다
    const wz = sm(fit(p, .1, .34)) * (1 - sm(fit(p, .8, .97))), fo = window.__fireO ?? 1, nz = fo > .97 || p > .5 ? wz : Math.min(zt, wz);
    if (Math.abs(nz - zt) > 1e-4) { zt = nz; place(); }
  }
  const hT = heatOf(p), tau = hT > heat ? 1.1 : 1.9;
  heat = reduced ? hT : heat + (hT - heat) * (1 - Math.exp(-dt / tau));
  const gT = glazeOf(p);
  glaze = reduced ? gT : (gT > glaze ? glaze + (gT - glaze) * (1 - Math.exp(-dt / 1.4)) : (gT < .02 && heat < .05 ? gT : glaze));
  const K = 900 + 1150 * heat; blackbody(K, col); blackbody(Math.max(800, K - 300), col2);
  const glow = Math.pow(heat, 2.2);
  const flick = 1 + (Math.sin(t * 7.3) * .5 + Math.sin(t * 13.1 + 1.3) * .3 + Math.sin(t * 2.1) * .4) * (.05 + .1 * sm(fit(heat, .1, .6)) * (1 - .5 * heat));

  // ignition: the burners catch one by one, each with a blue flash
  let flash = 0, lit = 0; const warmth = sm(fit(heat, .12, .45));
  BURNERS.forEach(B => {
    const th = .015 + B.order * .02, ign = sm(fit(heat, th, th + .03));
    if (!B.lit && ign > .5) { B.lit = true; B.flashT = t; } else if (B.lit && ign < .2) B.lit = false;
    const fl = Math.max(0, 1 - (t - B.flashT) * 2.2), f2 = fl * fl; flash = Math.max(flash, f2);
    const roar = 1 + (Math.sin(t * 9 + B.seed) * .5 + Math.sin(t * 17.3 + B.seed * 2) * .3 + Math.sin(t * 3.1 + B.seed) * .4) * (.12 + .18 * heat);
    B.mat.uniforms.uTime.value = t; B.mat.uniforms.uSeed.value = B.seed; B.mat.uniforms.uWarm.value = warmth; B.mat.uniforms.uCol.value.copy(col);
    B.mat.uniforms.uHeat.value = ign * (1 + f2 * 1.5) * (1 - .45 * sm(fit(heat, .75, 1)));
    B.m.scale.set(B.w * (1 + .6 * heat), B.h * ((.45 + 1.5 * sm(fit(heat, .05, .8))) * roar + f2 * .9), 1);
    lit += ign * roar + f2 * 3;
  });
  lit /= BURNERS.length;

  // the light mix
  const after = sm(fit(p, .78, .97));
  const cool = (1 - sm(fit(heat, .05, .4))) * (1 - .9 * sm(fit(p, .05, .115)) * (1 - after));
  U.kS.value = cool * (1 + .15 * after);
  U.glaze.value = glaze;
  fc.copy(blueish).lerp(col, warmth); const fI = lit * (.35 + 2.2 * glow) * flick;
  U.cF.value.set(fc.r * fI, fc.g * fI, fc.b * fI);
  const self = Math.pow(sm(fit(heat, .28, 1)), 1.5) * flick * .6;
  U.cG.value.set(col2.r * self, col2.g * self, col2.b * self);
  const wg = Math.pow(sm(fit(heat, .4, 1)), 1.8) * .55 * flick;
  U.cW.value.set(col.r * wg, col.g * wg, col.b * wg);
  renderer.toneMappingExposure = 1.0 - .5 * glow;
  BG_GAIN.value = 1.3 / renderer.toneMappingExposure;
  bloom.strength = .12 + .18 * glow; bloom.threshold = .92 - .04 * glow;
  grade.uniforms.uTime.value = t; grade.uniforms.uHeat.value = reduced ? 0 : .6 * sm(fit(heat, .3, 1)); grade.uniforms.uFlash.value = reduced ? 0 : flash;
  // a faint tremor as each burner catches (no zoom)
  const sh = reduced ? 0 : flash * .004; camera.position.set(Math.sin(t * 61) * sh, Math.sin(t * 47) * sh, 0);
  { const SW = window.__kjySway; if (SW && !reduced) { const tx = (SW.x * 9).toFixed(1), ty = (SW.y * 5).toFixed(1); const v = `translate3d(${tx}px,${ty}px,0) scale(1.02)`; if (canvas.style.transform !== v) canvas.style.transform = v; } } // 가마도 마우스를 따라 아주 살짝

  beatsUpdate(p);
  composer.render(dt);
  if (live && !STILL) requestAnimationFrame(frame); else running = false;
}
frame(); canvas.classList.add('ready');
new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live && !running && !STILL) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }, { rootMargin: '100% 0px 100% 0px' }).observe(section);
window.__fire = { step: n => { for (let i = 0; i < n; i++) frame(); }, settle: () => { p = target; heat = heatOf(p); glaze = glazeOf(p); }, state: () => ({ p, heat, glaze }) };
