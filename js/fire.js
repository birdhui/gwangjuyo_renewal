import { createBeats } from './beats.js';

// 가마: 이천 수광리 오름가마 사진(img/kiln/plate.webp)을 바탕으로, 스크롤에 따라 불을 지펴 굽고 식힌다.
//  - 바탕은 불이 한창일 때의 사진 그대로. 불이 약할 때는 가마 안을 어둡게, 몸체는 달빛 정도로 낮추고,
//    불빛이 닿는 정도(mask.png B)만큼 불의 세기·일렁임을 따라 밝아진다.
//  - 가마 안 불길(mask.png G)은 위로 흐르는 잡음으로 살짝 밀려 그려지고, 혀처럼 솟는 밝기 변화가 더해져 일렁인다.
//  - 선반 위 소리잔 하나: 초벌 → 유약(시유) 잔으로 바뀌고, 가장 뜨거울 때는 잔 자체가 불빛처럼 달아오른다.
//  - 장작 불티: 가마 안에서 솟는 불티, 입구 밖으로 튀는 불티, 굴뚝 위로 날리는 불티(모두 화면 GPU 점, 상태 없이 시간으로 계산).
import * as THREE from 'three';
import { createRenderer } from './shared-gl.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fit = (v, a, b) => clamp((v - a) / (b - a));
const sm = t => t * t * (3 - 2 * t);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function blackbody(K, out = new THREE.Color()) {
  const t = K / 100; let r, g, b;
  r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return out.setRGB(clamp(r / 255), clamp(g / 255), clamp(b / 255), THREE.SRGBColorSpace);
}

// 사진 좌표(0~1, 아래가 0): 가마 입구 가운데, 선반 위 소리잔 자리(1672×941 사진 기준 px에서 환산)
const IMG = [1672, 941], IMG_ASPECT = IMG[0] / IMG[1];
const uvOf = (x, y) => [x / IMG[0], 1 - y / IMG[1]];
const MOUTH = uvOf(790, 600);
const CUP_PX = { cx: 818, bottom: 566, h: 84 };   // 윗 선반 가운데 고리(그을린 자국) 안에 굽이 앉는다
const CUP_W = CUP_PX.h * 263 / 300;
const CUP = [ (CUP_PX.cx - CUP_W / 2) / IMG[0], 1 - CUP_PX.bottom / IMG[1], CUP_W / IMG[0], CUP_PX.h / IMG[1] ];   // u0, v0, du, dv

const canvas = document.getElementById('fire-gl');
const renderer = createRenderer({ canvas, antialias: false });
const sceneDpr = () => Math.min(devicePixelRatio || 1, innerWidth >= 2560 ? 1 : 1.5);
renderer.setPixelRatio(sceneDpr());
renderer.toneMapping = THREE.NoToneMapping;   // 사진 색을 그대로(밝기만 불이 바꾼다)
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- 가마 사진 ----------
const loader = new THREE.TextureLoader();
const load = (u, srgb) => new Promise(res => loader.load(u, t => { t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = t.magFilter = THREE.LinearFilter; res(t); }));
const [tP, tM, tC, tCB] = await Promise.all([load('img/kiln/plate.webp', true), load('img/kiln/mask.png', false), load('img/kiln/cup.webp', true), load('img/kiln/cup-bisque.webp', true)]);
const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const NOISE = `
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * n(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;
const U = {
  tP: { value: tP }, tM: { value: tM }, tC: { value: tC }, tCB: { value: tCB },
  uT: { value: 0 }, uHeat: { value: 0 }, uFlick: { value: 1 }, uGlaze: { value: 0 }, uAfter: { value: 0 }, uAmb: { value: 1 },
  uFire: { value: new THREE.Color() }, uHot: { value: new THREE.Color() }, uCup: { value: new THREE.Vector4(...CUP) },
};
const photo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: QUAD_VS,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tP, tM, tC, tCB; uniform float uT, uHeat, uFlick, uGlaze, uAfter, uAmb; uniform vec3 uFire, uHot; uniform vec4 uCup;
    ${NOISE}
    void main(){
      vec3 M = texture2D(tM, vUv).rgb;                       // R 가마 안, G 불길, B 불빛이 닿는 정도
      vec3 c0 = texture2D(tP, vUv).rgb;
      // 가마 안: 불길을 위로 흐르는 잡음으로 살짝 밀어 그려 일렁이게, 혀처럼 솟는 밝기 변화를 더한다(잡음은 가마 안에서만 계산)
      vec3 inner = c0; float tongue = .5;
      if (M.r > .002) {
        vec2 q = vUv * vec2(30., 16.);
        vec2 w = vec2(fbm(q + vec2(0., -uT * 2.1)), fbm(q * 1.3 + vec2(5.2, -uT * 2.6))) - .5;
        inner = mix(c0, texture2D(tP, vUv + w * vec2(.005, .011) * M.r).rgb, smoothstep(.0, .35, M.g));
        tongue = fbm(vec2(vUv.x * 46., vUv.y * 18. - uT * 3.4));
      }
      float body = mix(1., .45 + 1.25 * tongue, smoothstep(.05, .5, M.g));
      vec3 tint = mix(vec3(1., .38, .2), vec3(1.), smoothstep(.2, .85, uHeat));   // 불이 약하면 검붉게, 세지면 사진 그대로의 불빛
      float heatI = uHeat * uFlick;
      vec3 grey = vec3(dot(c0, vec3(.2126, .7152, .0722))) * vec3(1., .9, .8);
      vec3 unlit = mix(mix(grey, c0, .4), vec3(.06, .022, .015), smoothstep(.0, .3, M.g));   // 불이 꺼진 가마 안: 사진의 불길 자리는 둘레 벽과 같은 그을린 벽돌빛으로
      // 불이 꺼진 뒤: 열린 입구로 든 빛이 잔 둘레의 선반을 부드럽게 비춘다
      vec2 pd = (vUv - uCup.xy - uCup.zw * vec2(.5, -.05)) / vec2(.1, .016);
      float pool = exp(-dot(pd, pd));
      vec3 interior = unlit * (.035 * uAmb + uAfter * (.05 + .6 * pool)) + inner * tint * heatI * body * (1. + .45 * uHeat * uHeat);
      // 바깥: 달빛 정도의 바탕에서, 불빛이 닿는 만큼 불의 세기·일렁임을 따라 사진 밝기로
      float L = M.b;
      vec3 cold = mix(grey, c0, .55) * mix(.42, .07, L) * uAmb;
      vec3 lit = c0 * mix(1., uFlick, L);
      vec3 outside = mix(cold, lit, clamp(uHeat * 1.2, 0., 1.)) + c0 * .2 * uAfter * L;
      vec3 col = mix(outside, interior, M.r);
      // 선반 위 소리잔: 초벌 → 유약 잔. 불빛을 받고, 뒤의 불길이 윤곽을 감싸며(역광), 가장 뜨거울 때는 잔 자체가 달아오른다
      vec2 cu = (vUv - uCup.xy) / uCup.zw;
      if (cu.x > 0. && cu.x < 1. && cu.y > 0. && cu.y < 1.) {
        vec4 cs = mix(texture2D(tCB, cu), texture2D(tC, cu), uGlaze);
        vec2 e = vec2(.03, .022);
        float around = .25 * (texture2D(tCB, cu + vec2(e.x, 0.)).a + texture2D(tCB, cu - vec2(e.x, 0.)).a + texture2D(tCB, cu + vec2(0., e.y)).a + texture2D(tCB, cu - vec2(0., e.y)).a);
        float rim = cs.a * clamp((1. - around) * 1.8, 0., 1.);
        float lum = dot(cs.rgb, vec3(.2126, .7152, .0722));
        vec3 light = uFire * heatI * 1.15 + vec3(1., .9, .78) * (.035 * uAmb + .62 * uAfter);
        vec3 cup = cs.rgb * light
                 + uFire * heatI * rim * (.15 + 1.1 * smoothstep(.0, .4, M.g) * body)   // 뒤에서 넘실대는 불길이 있는 자리만 윤곽이 달아오른다
                 + uHot * pow(smoothstep(.5, 1., uHeat), 2.) * (.75 - .2 * uGlaze) * (.25 + .75 * lum) * (.8 + .2 * tongue);
        col = mix(col, cup, cs.a);
      }
      gl_FragColor = vec4(col, 1.);
    }`,
  depthTest: false, depthWrite: false,
}));
scene.add(photo);

// ---------- 장작 불티 ----------
const SPARKS = 260;
const seeds = new Float32Array(SPARKS * 4); for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
const sg = new THREE.BufferGeometry();
sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
sg.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
const SU = { uT: U.uT, uHeat: U.uHeat, uXf: { value: new THREE.Vector4(1, 1, 0, 0) }, uPx: { value: 1 }, tM: U.tM };
const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({
  uniforms: SU,
  vertexShader: `
    attribute vec4 aSeed; uniform float uT, uHeat, uPx; uniform vec4 uXf;
    varying float vA, vAge, vIn; varying vec2 vP;
    void main(){
      float kind = aSeed.w;                                   // < .62 가마 안, < .82 입구 밖으로 튐, 나머지 굴뚝
      float life = kind < .62 ? mix(.9, 2.,  aSeed.x) : kind < .82 ? mix(.7, 1.4, aSeed.x) : mix(1.8, 3.6, aSeed.x);
      float age = fract(uT / life + aSeed.y);
      float cyc = floor(uT / life + aSeed.y);
      float r = fract(sin((cyc + 1.) * 91.7 + aSeed.z * 47.3) * 43758.5);     // 한 번 날 때마다 새 자리
      vec2 p;
      if (kind < .62) {                                       // 장작 위에서 솟아 가마 천장에 닿기 전 사그라짐
        p = vec2(.405 + .15 * r, .27 + .09 * fract(r * 7.3));
        p += vec2(sin(age * 7. + r * 30.) * .006 + (aSeed.x - .5) * .025 * age, age * (.07 + .09 * aSeed.z));
        vIn = 1.;
      } else if (kind < .82) {                                // 입구 앞으로 튀어 포물선을 그리며 떨어짐
        vec2 v0 = vec2((r - .5) * .16, .16 + .14 * aSeed.z);
        p = vec2(.43 + .1 * r, .27) + v0 * age + vec2(0., -.22 * age * age);
        vIn = 0.;
      } else {                                                // 굴뚝 위로 바람을 타고 날림
        p = vec2(.578 + .012 * (r - .5), .925) + vec2(.05 * age + sin(age * 5. + r * 20.) * .008, age * (.09 + .07 * aSeed.z));
        vIn = 0.;
      }
      // 불의 세기만큼만 날린다(약할 땐 몇 개, 한창일 땐 모두)
      float on = step(aSeed.x * .999, uHeat * (kind < .62 ? 1.15 : kind < .82 ? .7 : .9) - .05);
      vA = on * smoothstep(0., .06, age) * (1. - smoothstep(.55, 1., age)) * (.6 + .4 * sin(uT * 31. + aSeed.y * 60.));
      vAge = age; vP = p;
      gl_Position = vec4((p - .5) * 2. * uXf.xy + uXf.zw, 0., 1.);
      gl_PointSize = (1.4 + 3.2 * aSeed.z * aSeed.z * aSeed.z) * uPx * (1. - .45 * age);
    }`,
  fragmentShader: `
    uniform sampler2D tM; varying float vA, vAge, vIn; varying vec2 vP;
    void main(){
      vec2 d = gl_PointCoord - .5; float r = dot(d, d) * 4.;
      float a = vA * exp(-r * 3.) * mix(1., texture2D(tM, vP).r, vIn);   // 가마 안 불티는 아치 밖으로 나가지 않는다
      vec3 c = mix(vec3(1., .66, .3) * 2.4, vec3(1., .26, .05) * 1.2, smoothstep(.15, .85, vAge));
      gl_FragColor = vec4(c * a, 1.);
    }`,
  blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false,
}));
sparks.frustumCulled = false;
scene.add(sparks);

// ---------- post ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), .25, .55, .82); composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: QUAD_VS,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes;
    ${NOISE}
    void main(){
      // 가장자리를 살짝 어둡게 하고 필름 결을 얹는다(화면 자체는 일렁이지 않는다)
      vec2 d = vUv - .5; float r2 = dot(d, d);
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c *= 1. - r2 * .9;
      c += (h(vUv * uRes + fract(uTime) * 91.7) - .5) * .01;
      gl_FragColor = vec4(c, 1.);
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// ---------- 화면 배치: 사진이 화면을 덮고(cover), 좁은 화면은 가마 입구를 가운데로 ----------
function place() {
  const a = innerWidth / innerHeight, iw = innerWidth, ih = innerHeight;
  const Z = 1.03;   // 가장자리가 비지 않게 아주 살짝 크게(불이 붙어도 화면은 움직이지 않는다)
  let sx = a >= IMG_ASPECT ? 1 : IMG_ASPECT / a, sy = a >= IMG_ASPECT ? a / IMG_ASPECT : 1; sx *= Z; sy *= Z;
  const ox = clamp(-(MOUTH[0] - .5) * 2 * sx, 1 - sx, sx - 1), oy = clamp(-(MOUTH[1] - .5) * 2 * sy * .35, 1 - sy, sy - 1);
  photo.scale.set(sx, sy, 1); photo.position.set(ox, oy, 0);
  SU.uXf.value.set(sx, sy, ox, oy); SU.uPx.value = renderer.getPixelRatio() * Math.max(1, ih / 900);
  const toScreen = (u, v) => [((u - .5) * 2 * sx + ox) * .5 * iw + iw / 2, ih / 2 - ((v - .5) * 2 * sy + oy) * .5 * ih];
  { const [kx, ky] = toScreen(MOUTH[0], MOUTH[1]), st = document.querySelector('#fire .make-stage'); if (st) { st.style.setProperty('--kx', `${kx.toFixed(1)}px`); st.style.setProperty('--ky', `${ky.toFixed(1)}px`); } } // 등장 때 가마 입구에서부터 퍼지며 나타난다
  // 선반 위 소리잔의 화면 자리·높이: 시리즈의 3D 잔이 여기서부터 커진다(hero-scene.js)
  const [cx, cy] = toScreen(CUP[0] + CUP[2] / 2, CUP[1] + CUP[3] / 2);
  window.__fireCup = { x: cx, y: cy, h: CUP[3] * 2 * sy * .5 * ih };
}
function resize() { const pr = sceneDpr(); renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); grade.uniforms.uRes.value.set(innerWidth * pr, innerHeight * pr); place(); }
addEventListener('resize', resize); resize();

// ---------- 스크롤 → 목표 온도; 가마는 열의 관성으로 따라간다 ----------
const section = document.getElementById('fire');
const beatsUpdate = createBeats(document.querySelector('#fire .make-stage'), 'fire');
let target = 0, p = 0;
const LEAD = -1.0; // 물레 암전과 가마 등장이 끝난 뒤(섹션 위 경계가 화면 위로 1화면 지난 뒤)부터 불이 붙기 시작한다
const TAIL = +section.dataset.tail || 0;   // 굽기가 끝난 뒤 남는 화면 수: 가마가 사라지고 잔이 소나무 상자에 담기는 구간(glb-shim.js·hero-scene.js)
const readScroll = () => { const r = section.getBoundingClientRect(), lead = innerHeight * LEAD; target = clamp((-r.top + lead) / (r.height - innerHeight * (1 + TAIL) + lead)); };
addEventListener('scroll', readScroll, { passive: true }); readScroll();
const heatOf = q => sm(fit(q, .1, .5)) * (1 - sm(fit(q, .64, .92)));
const glazeOf = q => sm(fit(q, .4, .6));
const STILL = /[?&]still\b/.test(location.search);
// 가마 화면의 불투명도 = --fire-o × --fire-k × --fire-in (script.js·glb-shim.js가 html에 적는다, after-sound.css)
const rootStyle = document.documentElement.style, cssNum = (k, d) => { const v = parseFloat(rootStyle.getPropertyValue(k)); return Number.isFinite(v) ? v : d; };
const stageShown = () => STILL || cssNum('--fire-o', 0) * cssNum('--fire-k', 1) * cssNum('--fire-in', 0) > 0;
const clock = new THREE.Clock();
let heat = 0, glaze = 0;
let live = false, running = false, warmed = false;
function frame() {
  const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
  p += (target - p) * (1 - Math.pow(.002, dt));
  const hT = heatOf(p), tau = hT > heat ? 1.1 : 1.9;
  heat = reduced ? hT : heat + (hT - heat) * (1 - Math.exp(-dt / tau));
  const gT = glazeOf(p);
  glaze = reduced ? gT : (gT > glaze ? glaze + (gT - glaze) * (1 - Math.exp(-dt / 1.4)) : (gT < .02 && heat < .05 ? gT : glaze));
  // 장작불의 일렁임: 느린 너울 + 빠른 떨림, 불이 셀수록 크게
  const flick = reduced ? 1 : 1 + (Math.sin(t * 7.3) * .5 + Math.sin(t * 13.1 + 1.3) * .3 + Math.sin(t * 2.1) * .4 + Math.sin(t * 23.7 + 4.1) * .15) * (.05 + .1 * sm(fit(heat, .05, .6)));
  const K = 1000 + 1100 * heat;
  blackbody(K, U.uFire.value); blackbody(Math.max(900, K - 250), U.uHot.value);
  const after = sm(fit(p, .78, .97));
  U.uT.value = reduced ? 0 : t; U.uHeat.value = heat; U.uFlick.value = flick; U.uGlaze.value = glaze; U.uAfter.value = after;
  U.uAmb.value = 1 - .6 * sm(fit(heat, .05, .5));   // 불이 세지면 달빛 바탕은 불빛에 묻힌다
  const glow = Math.pow(heat, 2);
  bloom.strength = .18 + .42 * glow; bloom.threshold = .86 - .1 * glow;
  grade.uniforms.uTime.value = t;
  { const SW = window.__kjySway; if (SW && !reduced) { const tx = (SW.x * 9).toFixed(1), ty = (SW.y * 5).toFixed(1); const v = `translate3d(${tx}px,${ty}px,0) scale(1.02)`; if (canvas.style.transform !== v) canvas.style.transform = v; } } // 가마도 마우스를 따라 아주 살짝

  beatsUpdate(p);
  if (!warmed || stageShown()) { composer.render(dt); warmed = true; }   // 첫 프레임은 셰이더 준비를 위해 그리고, 그 뒤 가마 화면이 완전히 투명한 동안(등장 전·사라진 뒤)은 그리지 않는다
  if (live && !STILL) requestAnimationFrame(frame); else running = false;
}
frame(); canvas.classList.add('ready');
new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live && !running && !STILL) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }, { rootMargin: '100% 0px 100% 0px' }).observe(section);
window.__fire = { step: n => { for (let i = 0; i < n; i++) frame(); }, settle: () => { p = target; heat = heatOf(p); glaze = glazeOf(p); }, state: () => ({ p, heat, glaze }) };
