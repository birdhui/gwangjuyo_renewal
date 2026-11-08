/*
 * 광주요 리뉴얼 — 히어로 → 되감기(rewind) 전환 배경
 * oryzo.ai 의 배경 셰이더(getBgColor)를 그대로 옮김.
 *
 *   color = mix(color0, color1, pow(1 - d, 4))      // 선형(linear) 공간에서 섞음
 *   d     = length(gl_FragCoord.xy / 해상도 * vec2(1, 높이/너비))   // 좌측 하단 모서리에서의 거리(화면 너비 기준)
 *   color0 = #0f0804 (바탕) · color1 = #6d3916 (좌측 하단 웜 글로우)
 *
 * oryzo 는 그 뒤 후처리(톤 압축)를 거쳐 화면에 보이는 값이 대략  (20,18,17) + 0.35 × color  이 된다.
 * 실측: 바탕 #191512, 좌측 하단 모서리 #392618, 좌측 중간 #281b13 — 이 식으로 그대로 재현.
 *
 * 타이밍(oryzo 와 동일): 히어로가 0.5 화면 스크롤 안에 어두워지고(기존 --hero-focus 그대로),
 * 좌측 하단 글로우는 1.7 → 3.4 화면 사이에 서서히 올라온다 (oryzo: clearColorRatio 1 → 0).
 *
 * 레이어: 기존 .hero-darkness 안에 캨버스로 들어가므로, 어두워지는 정도(opacity)는 기존 연출을 그대로 따른다.
 */
(() => {
  'use strict';
  /* r2: 하나의 셰이더로 hero 어두운 막(.hero-darkness)과 rewind~갤러리 고정 배경을 모두 그린다(이전 CSS 그라데이션은 8비트 띠가 보였음).
     ORYZO getBgColor 와 같은 식 + 'Powered by AI'처럼 시리즈 구간에서 좌측 하단 글로우가 더 커지고 밝아짐(ORYZO는 bloom 후처리로 이 효과).
     디더: 삼각 분포 노이즈 ±1/255(기기 해상도로 그려 띠 없음). */
  const css = document.createElement('style');
  css.textContent = '.beauty-sticky>canvas.story-bg-canvas{z-index:0;pointer-events:none}.hero-darkness>.story-bg-canvas,.kjy-story-bg>canvas,.beauty-sticky>canvas.story-bg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '@media(prefers-reduced-motion:no-preference){.hero-darkness{opacity:var(--kjy-dark,var(--hero-focus,0))!important}}';
  document.head.appendChild(css);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const GLOW_START = 1.7, GLOW_END = 3.4;   // 화면 단위 (scrollY / innerHeight)
  const DARK_START = .30, DARK_END = .46;   // hero 카피가 거의 다 사라진 직후(마지막 글자 .415) 바로 어두워짐
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 u_res;uniform float u_glow;uniform float u_bloom;uniform float u_seed;uniform float u_wear;
const vec3 C0=vec3(15.,8.,4.)/255.;      // #0f0804
const vec3 C1=vec3(109.,57.,22.)/255.;   // #6d3916
const vec3 LIFT=vec3(19.7,18.2,16.6)/255.;
const float GAIN=.352;
vec3 toLin(vec3 c){return pow(c,vec3(2.2));}
vec3 toSrgb(vec3 c){return pow(max(c,0.),vec3(1./2.2));}
float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;                 // (0,0) = 좌측 하단
  uv*=vec2(1.,u_res.y/u_res.x);                  // 화면 너비 기준 원형
  float r=length(uv);
  float d=clamp(r/(1.+.55*u_bloom),0.,1.);       // 시리즈: 글로우 반경이 커짐
  float t=pow(1.-d,4.)*u_glow;
  vec3 lin=mix(toLin(C0),toLin(C1),t);
  float h=pow(clamp(1.-r/1.75,0.,1.),2.4)*u_bloom*u_glow;   // bloom처럼 넓고 부드러운 빛 번짐
  lin+=toLin(C1)*h*.55;
  vec3 c=LIFT+GAIN*(1.+.22*u_bloom)*toSrgb(lin);
  // oryzo 'it's wearable' 화면(후처리 포함)을 캡처 색에 맞춘 값: 좌측 하단 모서리에만 따뜻한 빛이 모이고 나머지는 어둡게
  vec3 linW=mix(toLin(C0),toLin(C1),pow(1.-clamp(r,0.,1.),4.)*u_glow)+toLin(C1)*.9*pow(clamp(1.-r/.3,0.,1.),1.5)*u_glow;
  vec3 cW=vec3(26.93,24.71,22.03)/255.+vec3(.5822,.6442,.804)*toSrgb(linW);
  c=mix(c,cW,u_wear);
  float n=hash(gl_FragCoord.xy+u_seed)+hash(gl_FragCoord.yx*1.37+u_seed+17.)-1.;   // 삼각 분포 디더
  gl_FragColor=vec4(c+n/255.,1.);
}`;
  // 장면 값(스크롤로 결정): glow = rewind에서 서서히, bloom = 시리즈(Powered by AI 대응)에서 커지고 밝아짐
  function params() {
    const y = scrollY / Math.max(1, innerHeight);
    const glow = reduce.matches ? 0 : smooth(GLOW_START, GLOW_END, y);
    const s = Math.min(1, Math.max(0, +window.__kwangjuyoSeriesProgress || 0));
    let bloom = reduce.matches ? 0 : smooth(0, .08, s) * (1 - smooth(.93, 1, s)), wear = 0;
    // 일상의 자리마다(풍경) 섹션: oryzo 'it's wearable' 섹션과 같은 기본 배경(추가 퍼짐 없음)
    const sc = document.getElementById('scenery');
    if (sc && !reduce.matches) {
      const r = sc.getBoundingClientRect(), vh = innerHeight;
      const k = smooth(vh * .9, vh * .1, r.top) * smooth(vh * .1, vh * 1.1, r.bottom);
      bloom = bloom * (1 - k); wear = k; // oryzo 'it's wearable'과 같은 배경(퍼짐 없이 좌측 하단 모서리에만 빛)
    }
    return [glow, bloom, wear];
  }
  const views = [];
  function mount(host) {
    if (host.querySelector('canvas.story-bg-canvas')) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'story-bg-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.prepend(canvas);
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) { canvas.remove(); return; }
    const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = { res: gl.getUniformLocation(prog, 'u_res'), glow: gl.getUniformLocation(prog, 'u_glow'), bloom: gl.getUniformLocation(prog, 'u_bloom'), seed: gl.getUniformLocation(prog, 'u_seed'), wear: gl.getUniformLocation(prog, 'u_wear') };
    const v = { canvas, gl, U, w: 0, h: 0, key: '' };
    canvas.addEventListener('webglcontextrestored', () => { v.key = ''; kick(); });
    views.push(v);
  }
  function drawView(v, glow, bloom, wear) {
    if (!v.canvas.isConnected) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(v.canvas.clientWidth * dpr), H = Math.round(v.canvas.clientHeight * dpr);
    if (!W || !H) return;
    const { gl, U } = v;
    if (W !== v.w || H !== v.h) { v.w = v.canvas.width = W; v.h = v.canvas.height = H; gl.viewport(0, 0, W, H); v.key = ''; }
    const key = glow.toFixed(4) + '|' + bloom.toFixed(4) + '|' + wear.toFixed(4) + '|' + W + 'x' + H;
    if (key === v.key) return;
    v.key = key;
    gl.uniform2f(U.res, W, H); gl.uniform1f(U.glow, glow); gl.uniform1f(U.bloom, bloom); gl.uniform1f(U.seed, 0); gl.uniform1f(U.wear, wear);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  let raf = 0, eg = null, eb = null, ew = null, lastDark = '';
  function frame() {
    raf = 0;
    const [g, b, w] = params();
    // 다른 스크롤 연출처럼 살짝 부드럽게 따라감
    eg = eg === null ? g : eg + (g - eg) * .18; if (Math.abs(g - eg) < .0005) eg = g;
    eb = eb === null ? b : eb + (b - eb) * .12; if (Math.abs(b - eb) < .0005) eb = b;
    ew = ew === null ? w : ew + (w - ew) * .12; if (Math.abs(w - ew) < .0005) ew = w;
    for (const v of views) drawView(v, eg, eb, ew);
    const dark = reduce.matches ? '' : smooth(DARK_START, DARK_END, scrollY / Math.max(1, innerHeight)).toFixed(4);
    if (dark !== lastDark) { lastDark = dark; if (dark) document.documentElement.style.setProperty('--kjy-dark', dark); else document.documentElement.style.removeProperty('--kjy-dark'); }
    if (eg !== g || eb !== b || ew !== w) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { for (const v of views) v.key = ''; kick(); });
  reduce.addEventListener('change', kick);
  setInterval(kick, 400);   // 시리즈 진행값은 스크롤 뒤 부드럽게 따라오므로 가끔 다시 확인
  window.__kjyBgMount = host => { mount(host); for (const v of views) v.key = ''; kick(); };
  // 가마 장면: 물레까지와 같은 배경 셰이더를 가마 화면 뒤에 깔고, 가마 그림은 '밝은 쪽 우선(lighten)'으로 겹쳐 어두운 바깥에 배경 그라데이션이 보이게 한다
  { const st = document.createElement('style');
    st.textContent = '#fire .make-stage>canvas.story-bg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;pointer-events:none}#fire .make-stage>#fire-gl{z-index:1;mix-blend-mode:lighten}';
    document.head.appendChild(st);
    const mf = () => { const fs = document.querySelector('#fire .make-stage'); if (fs) { mount(fs); kick(); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mf); else mf(); }

  // .hero-darkness 는 hero-scene.js(React)가 그린 뒤에 생긴다 → 생길 때까지 기다림
  const tryMount = () => { const host = document.querySelector('.hero-darkness'); if (host) { mount(host); kick(); return true; } return false; };
  if (!tryMount()) {
    const mo = new MutationObserver(() => { if (tryMount()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

/* ===== rewind 배경을 갤러리 끝까지 그대로 (ORYZO와 같이) =====
   ORYZO는 rewind 배경(어두운 바탕 + 좌측 하단 웜 글로우)이 이미지 갤러리 마지막에서 3D 공간으로 넘어가기 전까지 바뀌지 않는다.
   위 셰이더와 같은 식(글로우 최대)으로 만든 그라데이션을 화면 뒤에 고정해 두고,
   rewind ~ 갤러리 사이 섹션들의 개별 배경(단색·방사형 그라데이션)은 투명하게 해서 이 배경이 그대로 보이게 한다.
   (낮 장면처럼 일부러 밝아지는 연출 — 아름다움 섹션의 낮(아이보리)·소나무 — 은 그대로 둔다.) */
(() => {
  'use strict';
  const C0 = [15, 8, 4], C1 = [109, 57, 22], LIFT = [19.7, 18.2, 16.6], GAIN = .352;
  const lin = v => Math.pow(v / 255, 2.2), srgb = v => Math.pow(Math.max(v, 0), 1 / 2.2) * 255;
  const col = d => { const t = Math.pow(1 - d, 4); return C0.map((c, i) => Math.round(LIFT[i] + GAIN * srgb(lin(c) + (lin(C1[i]) - lin(c)) * t))); };
  window.__kjyStoryCol = col;
  const stops = []; for (let k = 0; k <= 24; k++) { const d = k / 24; stops.push(`rgb(${col(d).join(',')}) ${(d * 100).toFixed(2)}%`); }
  const css = document.createElement('style');
  css.textContent =
    `.kjy-story-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:rgb(${col(1).join(',')});visibility:hidden}`
    + 'html.kjy-story-on .kjy-story-bg{visibility:visible}'
    + 'html.kjy-story-on body,html.kjy-story-on body.story-phase{background:transparent!important}'
    + 'html.kjy-story-on :is(.sori-series,.scenery,.scenery-gallery,.beauty-sequence,.beauty-sticky,.beauty-night,.people-story,.review-story,.editorial-gallery,.mb-stage){background:transparent!important}'
    + 'html.kjy-story-on:not(.hb-on) .make-clay .make-stage{background-color:transparent!important}'
    + `html.kjy-story-on{background:rgb(${col(1).join(',')})}`;
  document.head.appendChild(css);
  const mountBg = () => { if (document.querySelector('.kjy-story-bg') || !document.body) return !!document.body; const el = document.createElement('div'); el.className = 'kjy-story-bg'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); if (window.__kjyBgMount) window.__kjyBgMount(el); return true; };
  // 보이는 구간: rewind 시작 ~ 갤러리 끝(갤러리 아래쪽이 화면 위로 지나갈 때까지)
  let on = null;
  function update() {
    if (!mountBg()) return;
    const rw = document.getElementById('rewind'), gal = document.getElementById('gallery');
    if (!rw) return;
    const end = gal ? gal.offsetTop + gal.offsetHeight : Infinity;
    const v = scrollY >= rw.offsetTop - innerHeight && scrollY < end;
    if (v !== on) { on = v; document.documentElement.classList.toggle('kjy-story-on', v); }
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  (function loop() { update(); setTimeout(loop, 500); })();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update); else update();
})();

/* ===== '쓰임으로 이어지는 아름다움' (ORYZO의 SUSTAINABILITY 장면처럼) =====
   - 화면 뒤 배경이 절대 비치지 않게: 이 섹션의 고정 화면은 rewind 배경과 같은 그라데이션을 불투명하게 깔다.
   - 구슬은 화면을 가득 채울 만큼 크게, 제목은 화면 너비의 70%(after-sound.js에서 맞춤).
   - 제목: 등장할 때 오른쪽→왼쪽으로 은은한 빛이 지나가고, 마우스 주변에 빛 윤곽, 낮으로 바뀌는 동안 윤곽만 남은 유리 같은 글자.
   - 아이보리 바탕 위에 히어로처럼 소나무 그림자가 바람에 흔들린다.
   - 아이보리 화면은 사라지지 않고 섹션째 위로 밀려 올라가 다음 섹션과의 경계가 보인다. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const col = window.__kjyStoryCol;
  const stops = []; if (col) for (let k = 0; k <= 24; k++) { const d = k / 24; stops.push(`rgb(${col(d).join(',')}) ${(d * 100).toFixed(2)}%`); }
  const grad = col ? `radial-gradient(circle 100vw at 0% 100%,${stops.join(',')})` : '#191512';
  const st = document.createElement('style');
  st.textContent =
    `html .beauty-sticky,html.kjy-story-on .beauty-sticky{background:${grad}!important}`
    + '.beauty-sticky::after{display:none!important}'
    + '.beauty-day{background:#ffedd7!important}'
    + '.beauty-marble{width:min(96svh,94vw)!important;top:50%!important;filter:drop-shadow(24px 30px 40px rgba(0,0,0,.55))!important}'
    + '.beauty-pine{display:none!important}'
    + '.kjy-pine-shadow{position:absolute;inset:-6% -4% auto auto;width:min(110vw,1700px);aspect-ratio:1300/700;pointer-events:none;z-index:1;opacity:calc(var(--day-opacity,0)*.2);background:#3b2a1c;'
    +   '-webkit-mask:url(img/hero-bg-pine-branch.webp) right top/100% 100% no-repeat;mask:url(img/hero-bg-pine-branch.webp) right top/100% 100% no-repeat;filter:blur(7px);transform-origin:96% 4%;animation:kjy-pine-sway 7.5s ease-in-out infinite}'
    + '@keyframes kjy-pine-sway{0%,100%{transform:rotate(0deg) translate3d(0,0,0)}22%{transform:rotate(.9deg) translate3d(-6px,3px,0)}48%{transform:rotate(-.5deg) translate3d(4px,-2px,0)}71%{transform:rotate(1.3deg) translate3d(-9px,5px,0)}}'
    + '@media (max-width:767px){.beauty-marble{width:94vw!important}.kjy-pine-shadow{width:200vw}}';
  document.head.appendChild(st);
  const mount = () => {
    const bs = document.querySelector('#beauty .beauty-sticky'); if (bs && window.__kjyBgMount) window.__kjyBgMount(bs);
    const day = document.querySelector('#beauty .beauty-day'); if (!day || document.querySelector('.kjy-pine-shadow')) return;
    const shadow = document.createElement('div'); shadow.className = 'kjy-pine-shadow'; shadow.setAttribute('aria-hidden', 'true'); day.after(shadow);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

/* ===== 아름다움 섹션부터 갤러리까지: 뒤에 남아 있는 히어로 화면(소리잔 3D 무대)을 숨긴다 =====
   이 구간의 섹션 배경은 투명(공통 rewind 배경을 보이게)인데, 그 뒤에 고정된 히어로 무대가 그대로 깔려 있어 비쳐 보였다.
   이 구간에서는 히어로 무대가 쓰이지 않으므로 아예 감춘다. */
(() => {
  'use strict';
  const st = document.createElement('style');
  st.textContent = 'html.kjy-hide-hero .hero-frame{visibility:hidden!important}';
  document.head.appendChild(st);
  let on = null;
  const tick = () => {
    const b = document.getElementById('beauty'), g = document.getElementById('gallery'); if (!b || !g) return;
    const ih = innerHeight, y = scrollY, v = y >= b.offsetTop - ih * .02 && y < g.offsetTop + g.offsetHeight + ih;
    if (v !== on) { on = v; document.documentElement.classList.toggle('kjy-hide-hero', v); }
  };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); setInterval(tick, 500); tick();
})();

/* ===== '한 잔을 곁에 둔 사람들의 이야기' ~ 푸터 =====
   - 이 섹션의 배경(가운데 위쪽이 은은하게 밝은 그라데이션)을 화면 뒤에 고정해, 리뷰·갤러리를 지나 푸터 전까지 하나로 이어지게 한다.
   - 푸터가 올라오는 만큼 밝은 부분을 서서히 줄여 푸터의 어두운 바탕(#0e0b09)과 자연스럽게 이어지게 한다.
   - 잔은 화면 전체 캨버스 가운데(크기는 rewind와 같게, after-sound.js), 글은 글자 단위로 나타나고 사라진다. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const st = document.createElement('style');
  st.textContent =
    '.kjy-people-bg{position:fixed;inset:0;z-index:-1;pointer-events:none;background:#0e0b09;visibility:hidden}'
    + '.kjy-people-bg::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 18%,#583426 0%,#3a2419 26%,#211611 52%,rgba(14,11,9,0) 82%);opacity:var(--kjy-people-glow,1)}'
    + 'html.kjy-people-on .kjy-people-bg{visibility:visible}'
    + 'html.kjy-people-on :is(.people-story,.review-story,.editorial-gallery,.editorial-sticky){background:transparent!important}'
    + '.people-cup-visual{left:0!important;top:0!important;width:100vw!important;height:100svh!important;transform:none!important}'
    + '.people-heading,.people-intro{opacity:1!important;filter:none!important;transform:translate3d(0,var(--people-title-y,0px),0)!important}'
    + '.people-intro{transform:translate3d(0,var(--people-intro-y,0px),0)!important}'
    + '.people-ch{display:inline-block;white-space:pre;opacity:0;will-change:opacity,filter,transform}';
  document.head.appendChild(st);
  const mount = () => { if (document.querySelector('.kjy-people-bg') || !document.body) return; const el = document.createElement('div'); el.className = 'kjy-people-bg'; el.setAttribute('aria-hidden', 'true'); const sb = document.querySelector('.kjy-story-bg'); if (sb) sb.after(el); else document.body.prepend(el); };
  let on = null, lastG = '';
  const tick = () => {
    mount();
    const pe = document.getElementById('people'), ft = document.getElementById('site-end'); if (!pe || !ft) return;
    const ih = innerHeight, y = scrollY;
    const v = y >= pe.offsetTop - ih && y < ft.offsetTop + ft.offsetHeight;
    if (v !== on) { on = v; document.documentElement.classList.toggle('kjy-people-on', v); }
    if (v) {
      const k = Math.min(1, Math.max(0, (y - (ft.offsetTop - ih)) / (ih * .85)));
      const g = (1 - k * k * (3 - 2 * k)).toFixed(3);
      if (g !== lastG) { lastG = g; document.documentElement.style.setProperty('--kjy-people-glow', g); }
    }
  };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); setInterval(tick, 500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
})();

/* ===== 사용자 리뷰: ORYZO 리뷰 목록과 같은 구성 =====
   머리줄: 왼쪽 제목 · 가운데 후기 수와 평균 별점 · 오른쪽 문구, 아래 점선.
   각 줄: 왼쪽 칸 위에서부터 별점 → 큰 인용문(강조 단어는 따뜻한 갈색) → 맨 아래 작성자, 오른쪽 끝에 사진, 줄 사이 점선.
   가운데는 비워 두어 회전하는 소리잔이 그 자리에 떠 있다. */
(() => {
  'use strict';
  const st = document.createElement('style');
  st.textContent = '@media (min-width:768px){'
    + '.review-story{padding:10svh 3.125vw 8svh!important}'
    + '.reviews-head{grid-template-columns:1fr auto 1fr!important;align-items:center!important;padding-bottom:2svh!important;font-size:clamp(12px,.9vw,17px)!important}'
    + '.reviews-head p{text-align:center;color:inherit!important;display:flex;gap:1.6em;align-items:center;white-space:nowrap}'
    + '.reviews-head p .kjy-rs{letter-spacing:.12em}'
    + '.review-card{height:auto!important;min-height:0!important;grid-template-columns:minmax(0,24%) 1fr 22.5vw!important;align-items:stretch!important;padding:2.4svh 0!important}'
    + '.review-copy{display:flex!important;flex-direction:column;align-self:stretch!important}'
    + '.review-rule{display:none!important}'
    + '.review-stars{order:1;font-size:clamp(13px,1vw,20px)!important;font-weight:600!important;letter-spacing:.12em!important;color:rgba(255,237,215,.62)}'
    + '.review-stars span{letter-spacing:0!important;font-size:.9em!important;margin-left:10px!important}'
    + '.review-card blockquote{order:2;margin:2.2svh 0 0!important;font-size:clamp(20px,1.95vw,40px)!important;font-weight:600!important;line-height:1.3!important;letter-spacing:-.02em!important}'
    + '.review-person{order:3;margin-top:auto;padding-top:3svh;font-size:clamp(11px,.85vw,16px)!important;font-weight:600!important;line-height:1.35!important;color:rgba(255,237,215,.78)}'
    + '.review-card em{color:#c26a3d!important}'
    + '.review-image{align-self:start!important;width:100%!important;height:auto!important;aspect-ratio:4/3;object-fit:cover}' /* oryzo 리뷰 사진: 화면 폭의 22.5%, 가로:세로 4:3 */
    + '}';
  document.head.appendChild(st);
  const fill = () => {
    const p = document.querySelector('.reviews-head .review-disclosure'); if (!p || p.dataset.kjy) return;
    const cards = [...document.querySelectorAll('.review-card')];
    const scores = cards.map(c => { const m = (c.querySelector('.review-stars span') || {}).textContent; const v = m && parseFloat(m.replace(/[^\d.\/]/g, '').split('/')[0]); return isFinite(v) ? v : null; }).filter(v => v !== null);
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 5;
    p.dataset.kjy = '1';
    p.innerHTML = `<span>광주요 공식몰 실구매 후기 [ ${cards.length} ]</span><span><span class="kjy-rs" aria-hidden="true">★★★★★</span> [ ${(Math.round(avg * 10) / 10).toString()}/5 ]</span>`;
    p.setAttribute('aria-label', `광주요 공식 온라인몰 소리잔 실구매 후기 ${cards.length}개, 평균 별점 ${avg.toFixed(1)}점`);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill); else fill();
})();
