/* 소리잔 시리즈의 손 — 구매한 실사 손 에셋(AXIS Female Arms, Rigify)을 리깅·메시 수정 없이
   Blender에서 컨트롤러 회전만으로 포즈를 잡아 내보낸 것(assets/hand/kjy-hand.glb).
   클립: 0s 편 손(다가갈 때) → 1s 잔을 쥔 손(참고 사진 포즈) → 2s 손가락을 살짝 편 손(호버).

   - 히어로 3D 장면(hero-scene.js) 안 같은 공간에 넣어 잔과 손이 서로 정확히 가린다.
   - 손은 화면 아래에서 올라와 잔을 쥐고, 시리즈가 끝나면 손을 펴며 다시 아래로 사라진다.
   - 자세(oryzo Powered by AI): 엄지와 검지로 잔 굽을 집고 중지·약지·소지는 손바닥 쪽으로 접는다.
     처음엔 손가락이 살짝 접힌 채 올라와 스크롤할수록 잡는다. 손목 아래 팔은 서서히 투명해진다.
   - 손가락 호버: 가리킨 손가락만 살짝 펴졌다 돌아온다.
   - 시리즈 잔 전환: 점묘(디더) 대신 순서가 정해진 교차 페이드 → 계단·점 무늬 없이 부드럽게.
   기존 번들은 고치지 않고, 번들이 알려주는 잔·카메라 객체(window.__kwangjuyoDebug)만 쓴다. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Q = new URLSearchParams(location.search);
const num = (k, d) => { const v = parseFloat(Q.get(k)); return Number.isFinite(v) ? v : d; };
const clamp01 = v => Math.min(1, Math.max(0, v));
const sm = (a, b, x) => { x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); };
const damp = (x, y, l, dt) => x + (y - x) * (1 - Math.exp(-l * dt));

/* ====================== 1. 시리즈 잔 교차 페이드 ======================
   번들은 잔마다 uDissolve(0~1)를 주고, 프래그먼트에서 노이즈로 픽셀을 버려(discard) 전환한다 → 점묘·계단.
   여기서는 discard를 없애고 알파로 바꾼 뒤, 두 잔이 겹치는 동안
     · 앞 순서 잔(L): 불투명 유지 → 뒤 절반에서만 서서히 사라짐 (α = min(1, 2·wL))
     · 뒤 순서 잔(U): L 위에 항상 덮이며 앞 절반에서 서서히 나타남 (α = min(1, 2·wU))
   U가 항상 위에 오도록 L의 깊이를 살짝 뒤로 민다(겹친 두 표면이 서로 파고드는 경계선 = 계단현상 제거).
   각 잔은 자기 깊이를 먼저 그려(프리패스) 반투명일 때도 안쪽 면이 비치지 않는다. */
(function patchDissolveShader() {
  const fix = s => {
    if (typeof s !== 'string' || s.indexOf('kjyNoise') < 0) return s;
    s = s.replace(/float kjyNoise = fract\([\s\S]*?\n\s*else \{[^\n]*\n/, '');
    return s.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n  gl_FragColor.a *= uDissolve;');
  };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue; const o = C.prototype.shaderSource;
    C.prototype.shaderSource = function (sh, src) { return o.call(this, sh, fix(src)); };
  }
})();
const PUSH = num('cpush', 0.0012);   // 앞 순서 잔을 뒤로 미는 양(NDC 깊이)
const cups = [];                       // {mat, mesh, raw, alpha, ro, push:{value}, order, prepass, prof}
const pushVS = (sh, pushU) => {
  sh.uniforms.kjyPush = pushU;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float kjyPush;')
    .replace('#include <project_vertex>', '#include <project_vertex>\n  gl_Position.z += kjyPush * gl_Position.w;');
};
const cupRec = new WeakMap();          // material → rec (userData에 넣으면 번들의 material.clone()이 JSON 복사하다 순환 참조 오류)
let mainCupMesh = null;
function hookCups(scene) {
  scene.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.dissolve || o.name === 'kjy-cup-prepass') return;
    const mat = o.material;
    if (cupRec.has(mat)) return;
    // 실제 잔 6개만: 본 잔 메시 + 'Sori glaze' 시리즈 잔 (번들이 복제한 보조 메시는 건드리지 않음)
    if (o !== mainCupMesh && !/Sori glaze/i.test(mat.name || '')) return;
    const u = mat.userData.dissolve.uDissolve;
    const rec = { mat, mesh: o, raw: typeof u.value === 'number' ? u.value : 1, alpha: 1, ro: 10, push: { value: 0 }, order: cups.length, prof: null, prepass: null };
    cupRec.set(mat, rec); cups.push(rec);
    Object.defineProperty(u, 'value', { configurable: true, set(v) { rec.raw = v; }, get() { return rec.alpha; } });
    Object.defineProperty(o, 'renderOrder', { configurable: true, get() { return rec.ro; }, set() {} });
    const prevOBC = mat.onBeforeCompile;
    mat.onBeforeCompile = function (sh, r) { if (prevOBC) prevOBC.call(this, sh, r); pushVS(sh, rec.push); };
    const k = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : null;
    mat.customProgramCacheKey = () => (k ? k() : '') + '|kjy-xfade2';
    mat.transparent = true; mat.depthWrite = true; mat.depthFunc = THREE.LessEqualDepth;
    mat.needsUpdate = true; warm.compiled.delete(mat);   // 셰이더가 바뀌었으니 다시 미리 컴파일
    // 깊이 프리패스(색은 안 그림): 반투명 구간에서 잔 안쪽 면이 비치지 않게
    const pm = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true });
    pm.onBeforeCompile = sh => pushVS(sh, rec.push);
    pm.customProgramCacheKey = () => 'kjy-cup-prepass';
    const pre = new THREE.Mesh(o.geometry, pm); pre.name = 'kjy-cup-prepass'; pre.frustumCulled = false;
    pre.visible = false; o.add(pre); rec.prepass = pre;
  });
}
function updateCups() {
  const act = cups.filter(c => c.mesh.visible !== false && c.raw > 0.001);
  for (const c of cups) { c.alpha = clamp01(c.raw); c.push.value = 0; c.ro = 10; if (c.prepass) c.prepass.visible = false; }
  if (act.length < 2) { for (const c of act) if (c.prepass) { c.prepass.visible = c.alpha < 0.999; c.prepass.renderOrder = 9.5; } return; }
  act.sort((a, b) => b.raw - a.raw); const two = act.slice(0, 2).sort((a, b) => a.order - b.order);
  const [L, Up] = two, s = L.raw + Up.raw || 1;
  L.alpha = Math.min(1, 2 * L.raw / s); Up.alpha = Math.min(1, 2 * Up.raw / s);
  L.push.value = PUSH; L.ro = 10; Up.ro = 12;
  for (const c of two) if (c.prepass) { c.prepass.visible = c.alpha < 0.999; c.prepass.renderOrder = c.ro - 0.5; }
  for (const c of act.slice(2)) c.alpha = 0;
}

/* ====================== 1-b. 3D 캔버스 안티앨리어싱(슈퍼샘플링) ======================
   번들은 dpr를 1~1.25로 제한해 1배 화면에서 잔 외곽이 계단처럼 보인다.
   → 내부 해상도를 2배(고해상도 화면은 기기 배율 그대로, 최대 2)로 그리고 브라우저가 줄여 표시 = 외곽이 매끈해짐.
   번들이 창 크기 변경 때 배율을 되돌리면 다음 프레임에 다시 맞춘다. 긴 변은 4096px을 넘지 않게. */
const SSAA = { renderer: null };
const warm = { pending: false, next: 0, compiled: new WeakSet() };   // 1-d. 미리 올리기·미리 컴파일 상태
function aaTarget(r) {
  const dpr = window.devicePixelRatio || 1;
  let t = Q.has('ssaa') ? num('ssaa', 2) : Math.min(3, Math.max(2, dpr));   // 1배 화면은 2배로 그려 줄여 보이고(계단 없음), 고해상도 화면은 기기 배율 그대로(이미 촘촘해 더 키우면 GPU만 무거워져 스크롤이 끊김)
  const el = r.domElement, w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
  t = Math.min(t, 4096 / Math.max(1, w, h));
  return Math.max(1, t);
}
(function aaLoop() {
  const r = SSAA.renderer;
  if (r) {
    const t = aaTarget(r);
    if (Math.abs(r.getPixelRatio() - t) > 0.01) r.setPixelRatio(t);
    if (!window.__kjyAA) { const gl = r.getContext(); window.__kjyAA = { msaa: gl.getContextAttributes().antialias, samples: gl.getParameter(gl.SAMPLES) }; }
    window.__kjyAA.ratio = r.getPixelRatio();
  }
  requestAnimationFrame(aaLoop);
})();
// 손 모델(수 MB)을 다 받기 전부터 히어로 잔이 매끈하게 보이도록, 장면이 생기자마자 렌더러를 잡는다.
(function aaHook() {
  const d = window.__kwangjuyoDebug;
  if (!d || !d.cup) return requestAnimationFrame(aaHook);
  let sc = d.cup; while (sc.parent) sc = sc.parent;
  const prev = sc.onBeforeRender;
  let n = 0;
  sc.onBeforeRender = function (renderer, scene, camera) { if (prev) prev.apply(this, arguments); SSAA.renderer = renderer; if ((n++ % 20) === 0) footShade(sc); warmScene(renderer, sc, camera); };
})();
/* ====================== 1-d. 미리 올리기·미리 컴파일 ======================
   텍스처는 처음 그려지는 순간 GPU로 올라가고, 재질 셰이더는 처음 보이는 순간 컴파일된다
   → 시리즈 섹션에 들어서 손·시리즈 잔이 처음 보일 때 화면이 크게 멈췄다(손 텍스처만 수백 ms).
   브라우저가 쉬는 틈마다 아직 안 올라간 텍스처를 한 장씩 올리고(initTexture),
   텍스처가 다 올라가면 숨은 물체까지 잠깐 보이게 해 아직 컴파일되지 않은 셰이더를 비동기로 컴파일한다(compileAsync). */
const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap', 'sheenColorMap', 'sheenRoughnessMap', 'transmissionMap', 'thicknessMap', 'specularIntensityMap', 'specularColorMap', 'bumpMap'];

function warmScene(renderer, scene, camera) {
  if (warm.pending || performance.now() < warm.next) return;
  warm.pending = true;
  (window.requestIdleCallback || (f => setTimeout(f, 120)))(() => {
    warm.pending = false;
    const props = renderer.properties;
    let tex = null, raw = false;
    scene.traverse(o => {
      if (!o.material) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!warm.compiled.has(m)) raw = true;
        for (const k of TEX_KEYS) { const t = m[k], im = t && t.isTexture && t.image; if (!tex && im && (im.width || im.videoWidth) && !props.get(t).__webglInit) tex = t; }
      }
    });
    if (tex) { renderer.initTexture(tex); return; }                       // 한 번에 한 장(멈춤이 길어지지 않게)
    if (raw) {
      const hidden = []; scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
      try { renderer.compileAsync(scene, camera); } catch (e) { }
      for (const o of hidden) o.visible = false;
      scene.traverse(o => { if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) warm.compiled.add(m); });
    }
    warm.next = performance.now() + 1500;                               // 새로 불러온 텍스처·재질이 생기면 다시 확인
  }, { timeout: 1500 });
}
/* 잔 굽 바닥 테두리: 굽 아랫면의 둥근 모서리가 주변 빛을 받아 바닥 경계에 회색 선처럼 그려졌다.
   실제 도자기처럼 탁자에 닿는 굽 맨 아래(잔 높이의 약 2%)를 서서히 어둡게(접촉 음영) 해서 선이 보이지 않게 한다. */
const footDone = new WeakSet();
/* 굽 아래 둥근 테두리의 법선이 메시 분할 때문에 들쭉날쭉(-0.3 ~ -0.55)해서, 빛을 받는 띠가 바닥 경계에 밝은 선처럼 그려졌다.
   굽 맨 아래(잔 높이 3% 안) 법선을 몸통 쪽(바깥 수평 방향)으로 부드럽게 이어 주면 몸통과 같은 빛으로 이어져 선이 사라진다. */
function footShade(scene) {
  scene.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.dissolve || o.name === 'kjy-cup-prepass') return;
    const g = o.geometry; if (footDone.has(g)) return; footDone.add(g);
    const P = g.attributes.position, N = g.attributes.normal; if (!P || !N) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox, y0 = bb.min.y, h = Math.max(1e-6, bb.max.y - y0), cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
    const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < P.count; i++) {
      const f = (P.getY(i) - y0) / h; if (f > .03) continue;
      let nx = N.getX(i), ny = N.getY(i), nz = N.getZ(i);
      if (ny < -.9) continue;                       // 바닥 면(아래를 보는 면)은 그대로
      const rx = P.getX(i) - cx, rz = P.getZ(i) - cz, rl = Math.hypot(rx, rz) || 1;
      const tx = rx / rl, ty = -.12, tz = rz / rl;  // 몸통처럼 바깥을 보는 법선
      const w = .9 * (1 - sstep(.012, .03, f));
      nx += (tx - nx) * w; ny += (ty - ny) * w; nz += (tz - nz) * w;
      const l = Math.hypot(nx, ny, nz) || 1; N.setXYZ(i, nx / l, ny / l, nz / l);
    }
    N.needsUpdate = true;
  });
}

/* ====================== 1-c. 공용 마우스 흔들림 값 ======================
   소리잔이 보이는 모든 3D 장면(히어로 캔버스·구슬 소리 장면·사람들 이야기 잔)이 같은 값을 읽는다.
   x, y: -1~1, 부드럽게 따라감. 각 장면은 자기 구간에서만 곱해 쓴다. */
(function () {
  if (window.__kjySway) return;
  const S = window.__kjySway = { x: 0, y: 0, tx: 0, ty: 0 };
  if (reduced) return;
  addEventListener('pointermove', e => { S.tx = e.clientX / innerWidth * 2 - 1; S.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  document.addEventListener('pointerleave', () => { S.tx = 0; S.ty = 0; });
  let t = performance.now();
  (function loop(now) { const dt = Math.min(0.05, Math.max(0.001, ((now || performance.now()) - t) / 1000)); t = now || performance.now();
    S.x = damp(S.x, S.tx, 3.2, dt); S.y = damp(S.y, S.ty, 3.2, dt); requestAnimationFrame(loop); })();
})();
// 풍경 갤러리에서 포장이 풀리고 큰 '소리' 타이포가 떠오르는 표지(cover) 구간에서는 흔들지 않음
window.__kjySwayGate = function () {
  const c = document.querySelector('#scenery .scenery-slide.is-cover');
  if (c) {
    const r = c.getBoundingClientRect();
    if (r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) {
      let o = 1; for (let e = c; e && e !== document.body; e = e.parentElement) { const st = getComputedStyle(e); if (st.visibility === 'hidden' || st.display === 'none') { o = 0; break; } o *= +st.opacity; }
      if (o > 0.04) return 0;
    }
  }
  return 1;
};

/* ====================== 2. 손 ====================== */
// Blender에서 맞춘 기준: 본 잔(도라지 60주년) 높이 0.115m일 때 잔 굽 바닥 중심 = Blender (-0.2631,-0.0316,1.8853) → glTF (x, z, -y)
const CUP_H = num('cuph', 0.115);
const FINGERS = ['thumb', 'f_index', 'f_middle', 'f_ring', 'f_pinky'];
const CURL0 = num('hcurl0', 0.35);   // 처음 올라올 때 손가락이 접혀 있는 정도(0 편 손 ~ 1 쥔 손)    // 손가락 진행값 τ: 0 편 손, 1 쥔 손, 2 호버(살짝 편 손)

function waitFor(test, ms = 60000) {
  return new Promise((res, rej) => { const t0 = performance.now(); (function f() { const v = test(); if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('timeout')); requestAnimationFrame(f); })(); });
}

(async () => {
  if (reduced) return;
  const series = document.getElementById('sori-series');
  if (!series) return;
  const D = await waitFor(() => { const d = window.__kwangjuyoDebug; return d && d.cup && d.camera ? d : null; }).catch(() => null);
  if (!D) return;
  let scene = D.cup; while (scene.parent) scene = scene.parent;

  const gltf = await new GLTFLoader().loadAsync('assets/hand/kjy-hand.glb?v=20261108-grip2');
  const root = gltf.scene;
  let mesh = null; root.traverse(o => { if (!mesh && o.isSkinnedMesh) mesh = o; });
  if (!mesh) return;

  // ----- 피부 재질: 에셋의 Blender 재질(Principled · 서브서피스 1.0 · 반경 1.2/0.6/0.4 · Specular 0.6) 재현 -----
  //  · 텍스처는 원본 해상도(오른팔이 쓰는 아틀라스 왼쪽 절반만 잘라냄, 축소 없음): Diffuse 4K, Roughness 4K, Normal 8K
  //  · Blender Cycles로 쥔 자세에서 구운 AO + 두께(빛 투과) 맵
  //  · 서브서피스 근사: 감싸는 확산광 + 얇은 곳(손가락)의 붉은 투과광
  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, normalScale: new THREE.Vector2(1, -1), roughness: 1, metalness: 0,
    ior: 1.4, specularIntensity: 1.15, specularColor: new THREE.Color(1, 1, 1),
    envMapIntensity: num('henv', 0.85), aoMapIntensity: 1
  });
  const SSS = {
    kjyThick: { value: null }, kjyUseThick: { value: 0 },
    kjyWrap: { value: num('hwrap', 0.45) }, kjyWrapColor: { value: new THREE.Color(0.55, 0.19, 0.11) },
    kjyTransColor: { value: new THREE.Color(1.0, 0.32, 0.18) }, kjyTransScale: { value: num('htrans', 0.8) },
    kjyTransPow: { value: 3.0 }, kjyTransDistort: { value: 0.25 }, kjyCavity: { value: num('hcav', 0.55) },
    // 팔 사라짐: 손목(뷰 좌표)에서 팔꿈치 쪽으로 kjyArmFade.x~y만큼 가면 투명 → 잘린 팔 끝이 어디서도 보이지 않는다(oryzo처럼 손목 아래가 어둠에 녹음)
    kjyWrist: { value: new THREE.Vector3() }, kjyArmDir: { value: new THREE.Vector3(0, -1, 0) }, kjyArmFade: { value: new THREE.Vector2(1e3, 2e3) }
  };
  skin.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, SSS);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D kjyThick; uniform float kjyUseThick, kjyWrap, kjyTransScale, kjyTransPow, kjyTransDistort, kjyCavity;
uniform vec3 kjyWrapColor, kjyTransColor, kjyWrist, kjyArmDir; uniform vec2 kjyArmFade;
float kjyThin = 0.0; float kjyAO = 1.0;
vec3 kjySSS( IncidentLight L, vec3 N, vec3 V, vec3 diff ) {
  float ndl = dot( N, L.direction );
  float wrap = max( 0.0, ( ndl + kjyWrap ) / ( 1.0 + kjyWrap ) ) - max( 0.0, ndl );
  vec3 H = normalize( L.direction + N * kjyTransDistort );
  float t = pow( saturate( dot( V, -H ) ), kjyTransPow ) * kjyTransScale * kjyThin;
  return L.color * diff * ( wrap * kjyWrapColor + t * kjyTransColor ) * mix( 1.0, kjyAO, 0.6 );
}`)
      .replace('#include <lights_fragment_begin>', `
#ifdef USE_AOMAP
  kjyAO = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
  if ( kjyUseThick > 0.5 ) kjyThin = 1.0 - texture2D( kjyThick, vAoMapUv ).b;
#endif
` + THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );')
        .join('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );\n\t\treflectedLight.directDiffuse += kjySSS( directLight, geometryNormal, geometryViewDir, material.diffuseColor );'))
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
  gl_FragColor.a *= 1.0 - smoothstep( kjyArmFade.x, kjyArmFade.y, dot( - vViewPosition - kjyWrist, kjyArmDir ) );`)
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
  reflectedLight.directDiffuse *= mix( 1.0, kjyAO, kjyCavity );
  reflectedLight.directSpecular *= mix( 1.0, kjyAO, kjyCavity );`);
  };
  skin.customProgramCacheKey = () => 'kjy-skin-3';
  if (mesh.material) mesh.material.dispose();
  mesh.material = skin;
  // 실시간 그림자맵은 손가락 그림자를 흐릿하게 번지게 해 끈다 → Blender에서 구운 AO 사용
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
  // 유리 배경(투명 패스)이 손을 덮지 않도록 손도 투명 패스 맨 뒤(잔 다음)에 그린다. 불투명도 1, 깊이 기록.
  skin.transparent = true; skin.depthWrite = true; mesh.renderOrder = 20;

  const TL = new THREE.TextureLoader(), TV = '?v=20261108-hq2';
  const prep = (t, srgb, aniso = 4) => { t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.repeat.set(2, 1); t.anisotropy = aniso; t.needsUpdate = true; return t; };
  TL.loadAsync('assets/hand/tex/diffuse-lo.webp' + TV).then(t => { if (!skin.userData.hiMap) { skin.map = prep(t, true); skin.needsUpdate = true; } }).catch(() => {});
  let hiResStarted = false;
  function loadHiRes(renderer) {
    if (hiResStarted) return; hiResStarted = true;
    const cap = renderer.capabilities;
    const aniso = Math.min(8, cap.getMaxAnisotropy());
    const get = (u, srgb) => TL.loadAsync(u + TV).then(t => prep(t, srgb, aniso)).catch(() => null);
    Promise.all([get('assets/hand/tex/diffuse.webp', true), get('assets/hand/tex/normal-4k.webp', false), get('assets/hand/tex/orm.webp', false)]).then(([d, n, o]) => {
      if (d) { skin.map = d; skin.userData.hiMap = true; }
      if (n) skin.normalMap = n;
      if (o) { skin.roughnessMap = o; skin.aoMap = o; SSS.kjyThick.value = o; SSS.kjyUseThick.value = 1; }
      skin.needsUpdate = true; warm.compiled.delete(skin);   // 맵이 붙어 셰이더가 바뀜 → 다시 미리 컴파일
      window.__kjyHandTex = { diffuse: !!d, normal: n && n.image ? [n.image.width, n.image.height] : null, orm: !!o };
    });
  }

  const hand = new THREE.Group(); hand.name = 'kjy-real-hand'; hand.add(root); hand.visible = false;
  scene.add(hand);

  // ----- 애니메이션: 손가락마다 따로 시간(τ)을 줄 수 있게 클립을 나눈다 -----
  const clip = gltf.animations[0];
  const mixer = new THREE.AnimationMixer(root);
  const isFinger = (name, f) => name.indexOf('DEF-' + f) === 0;
  const restClip = new THREE.AnimationClip('rest', clip.duration, clip.tracks.filter(t => !FINGERS.some(f => isFinger(t.name, f))));
  const restAct = mixer.clipAction(restClip); restAct.play(); restAct.paused = true; restAct.time = 1;
  const fAct = {};
  for (const f of FINGERS) {
    const c = new THREE.AnimationClip('f_' + f, clip.duration, clip.tracks.filter(t => isFinger(t.name, f)));
    const a = mixer.clipAction(c); a.play(); a.paused = true; a.time = 0; fAct[f] = a;
  }
  const bone = n => root.getObjectByName(n);
  const wristBone = bone('DEF-handR'), elbowBone = bone('DEF-forearmR'), _w = new THREE.Vector3(), _el = new THREE.Vector3();
  const ARM_FADE = [num('hfade0', 0.1), num('hfade1', 0.38)];   // 아래팔 길이 비율: 손목에서 이만큼 가면 사라지기 시작 → 다 사라짐
  const fb = {}; for (const f of FINGERS) fb[f] = [bone(`DEF-${f}01R`), bone(`DEF-${f}02R`), bone(`DEF-${f}03R`)];

  // ----- 자세: oryzo(Powered by AI)처럼 엄지와 검지로 집고, 중지·약지·소지는 손바닥 쪽으로 주먹처럼 접는다 -----
  //  리깅은 그대로: 편 손(클립 0s)에서 마디마다 로컬 X축으로 접는다(접는 방향은 클립의 쥔 손 1s에서 얻음). 접는 각도는 여기서 정한다.
  //  curl 0 = 편 손, 1 = 잡은 손.
  const CURL_DEG = {
    thumb: [num('ht1', -25), num('ht2', -10), num('ht3', 0)],   // 엄지는 펴서 잔 굽 옆으로 세운다
    f_index: [num('hi1', 52), num('hi2', 68), num('hi3', 32)],
    f_middle: [78, 96, 58], f_ring: [84, 98, 58], f_pinky: [90, 96, 52]
  };
  const q0 = {}, axes = {}, dq = new THREE.Quaternion(), qa = new THREE.Quaternion();
  restAct.time = 1; for (const f of FINGERS) fAct[f].time = 0; mixer.update(0);
  for (const f of FINGERS) q0[f] = fb[f].map(b => b.quaternion.clone());
  for (const f of FINGERS) fAct[f].time = 1; mixer.update(0);
  for (const f of FINGERS) axes[f] = fb[f].map((b, j) => {
    qa.copy(q0[f][j]).invert().multiply(b.quaternion);
    const sn = Math.sqrt(Math.max(0, 1 - qa.w * qa.w));
    // 굽힘 축 = 마디의 로컬 X(Rigify 손가락 뼈의 굽힘 축) — 비틀림·옆으로 벌어짐 없이 손바닥 쪽으로만 접힌다. 방향(부호)만 클립에서 얻는다.
    const ax = sn > 1e-4 ? qa.x / sn * (qa.w < 0 ? -1 : 1) : 1;
    return new THREE.Vector3(ax < 0 ? -1 : 1, 0, 0);
  });
  for (const f of FINGERS) fAct[f].stop();   // 이후 손가락은 poseFingers만 움직인다(팔·손목은 클립의 쥔 자세 그대로)
  const curl = {}; for (const f of FINGERS) curl[f] = 0;
  const st = { d: 0.4, init: false };   // d: 손이 잔 축을 따라 아래로 내려간 양(손 모델 미터)
  function poseFingers() {
    for (const f of FINGERS) fb[f].forEach((b, j) => {
      b.quaternion.copy(q0[f][j]).multiply(dq.setFromAxisAngle(axes[f][j], THREE.MathUtils.degToRad(CURL_DEG[f][j]) * curl[f]));
    });
  }
  // 잔이 놓이는 자리(손 모델 좌표): 다 잡은 자세에서 엄지 끝과 검지 가운데 마디 사이. 손은 이 점이 잔 굽 바닥 중심에 오도록 놓인다.
  const ANCHOR = new THREE.Vector3();
  {
    const tip = new THREE.Vector3(), yAx = new THREE.Vector3(), inv = new THREE.Matrix4(), [, t2, t3] = fb.thumb;
    for (const f of FINGERS) curl[f] = 1; poseFingers(); root.updateMatrixWorld(true); inv.copy(root.matrixWorld).invert();
    yAx.setFromMatrixColumn(t3.matrixWorld, 1).normalize();
    tip.setFromMatrixPosition(t3.matrixWorld).addScaledVector(yAx, new THREE.Vector3().setFromMatrixPosition(t3.matrixWorld).distanceTo(new THREE.Vector3().setFromMatrixPosition(t2.matrixWorld)) * 0.85);
    ANCHOR.setFromMatrixPosition(fb.f_index[1].matrixWorld).add(tip).multiplyScalar(0.5).applyMatrix4(inv);
    ANCHOR.add(new THREE.Vector3(num('hax', 0), num('hay', -0.025), num('haz', 0.03)));   // 손을 2.5cm 올리고 3cm 앞으로: 굽 아랫부분이 엄지·검지 사이에 끼고 손가락 뒤로 들어간다
    for (const f of FINGERS) curl[f] = 0;
  }
  // 본 잔(손이 붙잡는 잔)
  let mainMesh = null, mainBox = null;
  function findMain() {
    if (mainMesh && mainMesh.parent) return mainMesh;
    mainMesh = null; D.cup.traverse(o => { if (!mainMesh && o.isMesh && o.geometry && o.geometry.attributes.position && o.name !== 'kjy-cup-prepass') mainMesh = o; });
    if (mainMesh) { mainCupMesh = mainMesh; const g = mainMesh.geometry; if (!g.boundingBox) g.computeBoundingBox(); mainBox = g.boundingBox; }
    return mainMesh;
  }
  // ----- 포인터 → 손가락 호버 -----
  const hover = {}, hoverT = {}; for (const f of FINGERS) { hover[f] = 0; hoverT[f] = 0; }
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let pointer = null, pointerDirty = false;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', e => { pointer = { x: e.clientX, y: e.clientY }; pointerDirty = true; }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer = null; pointerDirty = true; });
  }
  const P = new THREE.Vector3(), PA = new THREE.Vector3(), PB = new THREE.Vector3(), PC = new THREE.Vector3(), AB = new THREE.Vector3(), AP = new THREE.Vector3(), TT = new THREE.Vector3();
  const segDist = (p, a, b) => { AB.subVectors(b, a); AP.subVectors(p, a); const l = AB.lengthSq(); const t = l > 0 ? clamp01(AP.dot(AB) / l) : 0; return TT.copy(a).addScaledVector(AB, t).distanceTo(p); };
  let lastRenderer = null;
  function pickFinger(s, renderer) {
    lastRenderer = renderer;
    for (const f of FINGERS) hoverT[f] = 0;
    if (!pointer || !hand.visible) return;
    const cv = renderer.domElement; const r = cv.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return;
    ndc.set(((pointer.x - r.left) / r.width) * 2 - 1, -((pointer.y - r.top) / r.height) * 2 + 1);
    if (Math.abs(ndc.x) > 1 || Math.abs(ndc.y) > 1) return;
    ray.setFromCamera(ndc, D.camera);
    const hit = ray.intersectObject(mesh, false)[0]; if (!hit) return;
    P.copy(hit.point);
    let best = null, bd = 0.022 * s;
    for (const f of FINGERS) {
      const [b1, b2, b3] = fb[f];
      b1.getWorldPosition(PA); b2.getWorldPosition(PB); b3.getWorldPosition(PC);
      let dd = Math.min(segDist(P, PA, PB), segDist(P, PB, PC));
      const tip = PC.clone().addScaledVector(PC.clone().sub(PB), 0.85); dd = Math.min(dd, segDist(P, PC, tip));
      if (dd < bd) { bd = dd; best = f; }
    }
    if (best) hoverT[best] = 1;
  }

  // ----- 옛 손(번들의 만화풍 손) 숨기기 -----
  let oldHidden = false;
  function hideOldHand() {
    if (oldHidden) return;
    scene.traverse(o => {
      if (oldHidden || !o.isMesh || o === mesh) return;
      const key = o.material && o.material.customProgramCacheKey ? String(o.material.customProgramCacheKey()) : '';
      if (key.indexOf('kjy-hand-fade') >= 0 || (o.morphTargetDictionary && 'grip_union' in o.morphTargetDictionary)) {
        let p = o; for (let i = 0; i < 2 && p.parent && p.parent.type !== 'Scene'; i++) p = p.parent;
        p.visible = false; o.visible = false; oldHidden = true;
      }
    });
  }

  // ----- 마우스에 따라 잔이 살짝 기울고 움직임(시리즈 구간에서만; 잔을 쥔 손도 함께) -----
  // 번들이 잔 그룹을 매 프레임 다시 쓰는지 알 수 없으므로, 지난 프레임에 더한 만큼만 되돌린 뒤 새로 더한다.
  const sway = { nx: 0, ny: 0, x: 0, y: 0, grp: null, lastQ: new THREE.Quaternion(), lastP: new THREE.Vector3(), dq: new THREE.Quaternion(), dp: new THREE.Vector3(), has: false };
  addEventListener('pointermove', e => { sway.nx = e.clientX / innerWidth * 2 - 1; sway.ny = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  const SW_ROT = THREE.MathUtils.degToRad(num('swrot', 4.5)), SW_MOV = num('swmov', 0.012);
  function swayGroup() {
    if (sway.grp && sway.grp.parent) return sway.grp;
    // 모든 잔(본 잔 + 시리즈)을 함께 담는 가장 가까운 공통 부모
    const ms = cups.map(c => c.mesh).filter(m => m && m.parent); if (mainMesh) ms.unshift(mainMesh);
    if (!ms.length) return null;
    const chain = o => { const a = []; for (let p = o.parent; p; p = p.parent) a.push(p); return a; };
    let common = chain(ms[0]);
    for (const m of ms.slice(1)) { const c = new Set(chain(m)); common = common.filter(x => c.has(x)); }
    const g = common.find(x => x.parent) || null;   // 장면 자체는 제외
    if (g !== sway.grp) sway.has = false;
    sway.grp = g; return g;
  }
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _piv = new THREE.Vector3(), _v = new THREE.Vector3(), _inv = new THREE.Quaternion();
  let swayGate = 0;
  function applySway(active, dt, camera, gain = 1) {
    const g = swayGroup(); if (!g || !findMain()) return;
    const k = active ? 1 : 0;
    const SW = window.__kjySway || { x: 0, y: 0 }; sway.x = SW.x * k * gain; sway.y = SW.y * k * gain;
    // 이전 프레임에 더한 변화 되돌리기(번들이 그 사이 값을 새로 썼다면 그대로 둠)
    if (sway.has && g.quaternion.equals(sway.lastQ) && g.position.equals(sway.lastP)) {
      _inv.copy(sway.dq).invert(); g.quaternion.premultiply(_inv); g.position.sub(sway.dp);
    }
    // 피벗 = 본 잔 중심(그룹 부모 좌표)
    mainMesh.geometry.boundingBox.getCenter(_piv); mainMesh.updateWorldMatrix(true, false); _piv.applyMatrix4(mainMesh.matrixWorld);
    if (g.parent) { g.parent.updateWorldMatrix(true, false); g.parent.worldToLocal(_piv); }
    _e.set(sway.y * SW_ROT * 0.6, sway.x * SW_ROT, -sway.x * SW_ROT * 0.35, 'YXZ'); _q.setFromEuler(_e);
    // 위치: (p - piv)를 회전 + 살짝 이동
    _v.copy(g.position).sub(_piv).applyQuaternion(_q).add(_piv);
    const mv = SW_MOV * (mainBox ? (mainBox.max.y - mainBox.min.y) * mainMesh.matrixWorld.getMaxScaleOnAxis() : 1);
    sway.dp.copy(_v).sub(g.position).add(new THREE.Vector3(sway.x * mv, -sway.y * mv * 0.6, 0));
    sway.dq.copy(_q);
    g.quaternion.premultiply(_q); g.position.add(sway.dp);
    sway.lastQ.copy(g.quaternion); sway.lastP.copy(g.position); sway.has = true;
    g.updateMatrixWorld(true);
  }

  // ----- 매 프레임(렌더 직전) -----
  let seriesS = 0, last = performance.now(), inited = false, lastRender = -1;
  const camPos = new THREE.Vector3(), cbase = new THREE.Vector3(), axis = new THREE.Vector3(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), off = new THREE.Vector3(), fwd = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), zNow = new THREE.Vector3(), cr = new THREE.Vector3();
  const prevOnBefore = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, sc, camera) {
    if (prevOnBefore) prevOnBefore.apply(this, arguments);
    const now = performance.now(); if (now === lastRender) return; lastRender = now;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000)); last = now;
    SSAA.renderer = renderer;
    hideOldHand(); findMain(); hookCups(scene); updateCups(); loadHiRes(renderer);

    const rawS = clamp01(+window.__kwangjuyoSeriesProgress || 0);
    const scR = Math.max(0, +window.__kwangjuyoSceneryR || 0);
    if (!inited || Math.abs(rawS - seriesS) > 0.6) { seriesS = rawS; inited = true; } else seriesS = damp(seriesS, rawS, 11, dt);
    const b = seriesS * 21 + Math.min(1.5, scR) * 2.2;   // 박자(0~21+)
    {
      const vh = innerHeight, hero = document.getElementById('hero'), clay = document.getElementById('clay');
      let g = 1;
      if (hero) { const hb = hero.getBoundingClientRect().bottom; g *= sm(vh * 0.55, vh * 0.15, hb); }       // 히어로 안에서는 번들 자체 흔들림
      if (clay) { const ct = clay.getBoundingClientRect().top; g *= sm(vh * 0.4, vh * 1.4, ct); }          // 물레에서 깨지기 직전엔 멈춤(조각 위치와 어긋나지 않게)
      g *= window.__kjySwayGate();
      swayGate = damp(swayGate, g, 4, dt);
      applySway(!reduced && swayGate > 0.001, dt, camera, swayGate);
    }
    const rise = sm(1.6, 3.4, b);                          // 아래에서 올라옴
    const close = sm(2.7, 4.0, b) - sm(19.0, 20.0, b);     // 쥠 → (시리즈 끝) 폄
    const sink = sm(19.6, 20.9, b);                        // 아래로 사라짐(잔이 풍경 상자 크기로 줄기 전에 끝남 → 작아진 손·팔이 보이지 않게)
    const show = rise > 0.001 && sink < 0.999;
    hand.visible = show;
    if (!show) { st.init = false; return; }
    if (!findMain()) { hand.visible = false; return; }

    // 본 잔 기준: 굽 바닥 중심, 잔 축(위 방향), 크기
    mainMesh.updateWorldMatrix(true, false);
    const cx = (mainBox.min.x + mainBox.max.x) / 2, cz = (mainBox.min.z + mainBox.max.z) / 2;
    cbase.set(cx, mainBox.min.y, cz).applyMatrix4(mainMesh.matrixWorld);
    axis.set(cx, mainBox.max.y, cz).applyMatrix4(mainMesh.matrixWorld).sub(cbase);
    const s = axis.length() / CUP_H; axis.normalize();
    // 손 방향: 모델 +Y → 잔 축, 모델 +Z(손바닥 앞, Blender 정면) → 카메라 쪽
    q.setFromUnitVectors(Y, axis);
    camera.getWorldPosition(camPos);
    fwd.copy(camPos).sub(cbase); fwd.addScaledVector(axis, -fwd.dot(axis)).normalize();
    zNow.set(0, 0, 1).applyQuaternion(q);
    const ang = Math.atan2(cr.crossVectors(zNow, fwd).dot(axis), zNow.dot(fwd));
    q2.setFromAxisAngle(axis, ang + THREE.MathUtils.degToRad(num('hyaw', 200))); q.premultiply(q2);   // 손등 쪽에서 본 모습(oryzo): 엄지는 왼쪽, 검지는 오른쪽 위에서 감싼다
    hand.quaternion.copy(q); hand.scale.setScalar(s);

    // 등장/퇴장 목표 높이(손 로컬 미터): 화면 아래 밖까지
    const dist = camPos.distanceTo(cbase);
    const vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dropW = vh * 0.62 + 0.16 * s;
    const Dt = (Math.max((1 - rise) * (1 - rise), sink * sink) * dropW) / s;

    // 손가락: 처음엔 살짝 접힌 채(CURL0) 올라와 스크롤할수록 잡는다. 호버한 손가락은 살짝 펴진다(잡은 뒤에만).
    if (pointerDirty || pointer) { pointerDirty = false; pickFinger(s, renderer); }
    const gripped = clamp01((close - 0.9) / 0.1);
    for (const f of FINGERS) {
      const t = hoverT[f] * gripped; hover[f] = damp(hover[f], t, t > hover[f] ? 6 : 3, dt);
      const goal = CURL0 + (1 - CURL0) * clamp01(close) - 0.45 * hover[f];
      curl[f] = st.init ? damp(curl[f], goal, 10, dt) : goal;
    }
    st.d = Dt; st.init = true;
    restAct.time = 1; mixer.update(0); poseFingers();

    off.copy(ANCHOR).multiplyScalar(s).applyQuaternion(q);
    hand.position.copy(cbase).sub(off).addScaledVector(axis, -st.d * s);
    hand.updateMatrixWorld(true);
    if (wristBone && elbowBone) {
      wristBone.getWorldPosition(_w); elbowBone.getWorldPosition(_el);
      const lf = _w.distanceTo(_el);
      SSS.kjyArmDir.value.subVectors(_el, _w).normalize().transformDirection(camera.matrixWorldInverse);
      SSS.kjyWrist.value.copy(_w).applyMatrix4(camera.matrixWorldInverse);
      SSS.kjyArmFade.value.set(lf * ARM_FADE[0], lf * ARM_FADE[1]);
    }
    let mn = 1; for (const f of FINGERS) mn = Math.min(mn, curl[f]);
    skin.aoMapIntensity = 0.35 + 0.65 * clamp01(mn);
  };
  window.__kjyHand = {
    hand, mesh, mixer, st, hover, curl, cups, get s() { return hand.scale.x; },
    pick(x, y) { pointer = { x, y }; pickFinger(hand.scale.x, lastRenderer || { domElement: document.querySelector('canvas') }); return { hoverT: { ...hoverT } }; }
  };
})();
