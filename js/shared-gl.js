import * as THREE from 'three';

/* 장면들이 나눠 쓰는 WebGL 하나.
   물레·가마·구슬 소리·아름다움·푸터 장면은 각자 렌더러(=WebGL 문맥)를 만들던 것을, 화면 밖 OffscreenCanvas 하나에 붙은
   렌더러 하나로 그린다. 각 장면의 캔버스는 원래 자리(같은 CSS·마스크·겹침 순서)에 그대로 두고, 그 장면이 그린 결과만
   2D로 옮겨 받는다(GPU 안에서의 복사 한 번).
   장면마다 쓰던 렌더러 설정(크기·배율·톤 매핑·노출·색 공간·그림자·지우는 색·autoClear)은 그 장면 몫으로 따로 기억했다가
   그 장면이 그릴 때만 렌더러에 얹는다 → 장면 코드는 예전처럼 renderer.xxx를 그대로 쓴다.
   OffscreenCanvas WebGL을 못 쓰는 브라우저는 예전처럼 장면마다 자기 렌더러를 만든다. */

let shared, active = null, presentQueued = false;
function sharedRenderer() {
  if (shared === undefined) {
    try { shared = new THREE.WebGLRenderer({ canvas: new OffscreenCanvas(1, 1), antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }); }
    catch (e) { shared = null; }   // OffscreenCanvas WebGL을 못 쓰면 장면마다 자기 렌더러
  }
  return shared;
}

// 장면 하나의 렌더러 설정(예전 WebGLRenderer 매개변수·속성의 기본값과 같게 시작)
function viewState(display, alpha) {
  return {
    display, ctx: null,
    pr: 1, w: display.clientWidth || 300, h: display.clientHeight || 150,
    toneMapping: THREE.NoToneMapping, toneMappingExposure: 1, outputColorSpace: THREE.SRGBColorSpace,
    shadowMap: { enabled: false, type: THREE.PCFShadowMap, autoUpdate: true, needsUpdate: false },
    clearColor: new THREE.Color(0x000000), clearAlpha: alpha ? 0 : 1,
    autoClear: true, drew: false,
  };
}

// 이 장면 차례: 렌더러에 이 장면의 설정을 얹는다
function use(v) {
  const R = sharedRenderer();
  if (active !== v) {
    if (active) present();
    active = v;
    R.domElement = v.display;   // 장면 코드(breakwheel.js 등)가 renderer.domElement로 어느 장면인지 가린다
    R.setClearColor(v.clearColor, v.clearAlpha);
  }
  const W = Math.floor(v.w * v.pr), H = Math.floor(v.h * v.pr), off = R.getContext().canvas;
  if (off.width !== W || off.height !== H || R.getPixelRatio() !== v.pr) R.setDrawingBufferSize(v.w, v.h, v.pr);
  if (v.display.width !== W || v.display.height !== H) { v.display.width = W; v.display.height = H; }   // renderer.domElement.width/height를 쓰는 장면을 위해
  R.toneMapping = v.toneMapping; R.toneMappingExposure = v.toneMappingExposure; R.outputColorSpace = v.outputColorSpace;
  R.shadowMap.enabled = v.shadowMap.enabled; R.shadowMap.type = v.shadowMap.type; R.shadowMap.autoUpdate = v.shadowMap.autoUpdate;
  if (v.shadowMap.needsUpdate) { R.shadowMap.needsUpdate = true; v.shadowMap.needsUpdate = false; }
  R.autoClear = v.autoClear;
  return R;
}

// 그린 결과를 그 장면의 캔버스로 넘긴다(한 장면이 한 번의 콜백 안에서 여러 번 그려도 끝난 뒤 한 번만)
function present() {
  presentQueued = false;
  const v = active;
  if (!v || !v.drew) return;
  v.drew = false;
  if (!v.ctx) v.ctx = v.display.getContext('2d');
  v.ctx.globalCompositeOperation = 'copy';   // 이전 그림 위에 겹치지 않고 그대로 바꿔 넣기(캔버스 크기가 바뀌면 설정이 초기화되므로 매번)
  v.ctx.drawImage(sharedRenderer().getContext().canvas, 0, 0);
}
function drew(v) {
  if (sharedRenderer().getRenderTarget() !== null) return;   // 화면(기본 버퍼)에 그렸을 때만
  v.drew = true;
  if (!presentQueued) { presentQueued = true; queueMicrotask(present); }
}

/* 장면용 렌더러: new THREE.WebGLRenderer({ canvas, ... }) 대신 쓴다.
   반환값은 공용 렌더러를 감싼 것이라 render·compile·setSize 등 쓰던 메서드·속성을 그대로 쓸 수 있다. */
export function createRenderer(params) {
  const R = typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined' ? sharedRenderer() : null;
  if (!R) return new THREE.WebGLRenderer(params);
  const v = viewState(params.canvas, params.alpha === true);
  const own = {
    domElement: v.display,
    setPixelRatio(pr) { v.pr = pr; },
    getPixelRatio() { return v.pr; },
    setSize(w, h) { v.w = w; v.h = h; },
    getSize(target) { return target.set(v.w, v.h); },
    getDrawingBufferSize(target) { return target.set(v.w * v.pr, v.h * v.pr).floor(); },
    setClearColor(color, alpha) { v.clearColor.set(color); if (alpha !== undefined) v.clearAlpha = alpha; if (active === v) R.setClearColor(v.clearColor, v.clearAlpha); },
    getClearColor(target) { return target.copy(v.clearColor); },
    setClearAlpha(a) { v.clearAlpha = a; if (active === v) R.setClearAlpha(a); },
    getClearAlpha() { return v.clearAlpha; },
    render(scene, camera) { use(v).render(scene, camera); drew(v); },
    clear(c, d, s) { use(v).clear(c, d, s); drew(v); },
    setRenderTarget(t, f, m) { use(v).setRenderTarget(t, f, m); },
    compile(...a) { return use(v).compile(...a); },
    compileAsync(...a) { return use(v).compileAsync(...a); },
    initTexture(t) { use(v).initTexture(t); },
    dispose() { if (active === v) { present(); active = null; } },   // 공용 문맥은 남기고 이 장면 몫만 놓는다
    forceContextLoss() {},
  };
  const STATE = { toneMapping: 1, toneMappingExposure: 1, outputColorSpace: 1, autoClear: 1, shadowMap: 1 };
  return new Proxy(R, {
    get(target, key) {
      if (key in own) return own[key];
      if (key in STATE) return v[key];
      const val = Reflect.get(target, key);
      return typeof val === 'function' ? val.bind(target) : val;
    },
    set(target, key, value) {
      if (key in STATE) { v[key] = value; if (active === v && key !== 'shadowMap') target[key] = value; return true; }
      return Reflect.set(target, key, value);
    },
  });
}
