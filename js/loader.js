(() => {
  'use strict';
  // Sori loader. Timing follows ORYZO's preloader:
  //  enter  — the graphic grows from 20% with a back-out over 0.2→0.7 s; the
  //           guides, points and handles fade in over 0.5→1 s;
  //  load   — the water level follows real progress (3D assets + page) but
  //           rises no faster than once per MIN seconds;
  //  settle — the hero has drawn, every scene loaded behind it (hand, wheel,
  //           kiln, marbles, beauty, footer) has finished downloading, and
  //           frames have run smoothly for a while (no hitches left to see);
  //  leave  — then, over one second
  //           (start time i): the graphic fades (1 − i), the background wipes
  //           off on a soft diagonal from the lower left (mask = fit(i, 0, .5),
  //           edge 0.6, slope 0.2·aspect), the page sharpens from a blur
  //           (50 px at 1080 p, falling with i, stronger toward the lower left)
  //           and the hero chrome comes in from i = 0.5.
  const root = document.documentElement;
  const loader = document.getElementById('sori-loader');
  if (!loader) return;
  const graphic = loader.querySelector('.sori-loader-graphic');
  const bg = loader.querySelector('.sori-loader-bg');
  const veil = loader.querySelector('.sori-loader-veil');
  const fill = loader.querySelector('#water-fill');
  const back = loader.querySelector('#water-back');
  const edge = loader.querySelector('#water-edge');
  const waterG = loader.querySelector('.water');
  const fades = loader.querySelectorAll('.guides, .guide-points, .handles, .cup-outline');
  // water span in drawing units: left, right, bottom, top (drawn from the hero cup)
  const [WX0, WX1, WY0, WY1] = (loader.querySelector('.cup-graphic').dataset.water || '550 1126 749 206').split(' ').map(Number);
  const progressbar = document.getElementById('loading-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const skip = /[?&](snap|noloader)\b/.test(location.search);
  const MIN = 0.9;          // seconds for an empty → full cup at the fastest
  const LEAVE = 1.6;        // seconds: the outline travels onto the hero cup, then hands over
  const clamp = v => Math.max(0, Math.min(1, v));
  const fit = (v, a, b, c = 0, d = 1, ease) => { let t = clamp((v - a) / (b - a)); if (ease) t = ease(t); return c + t * (d - c); };
  const smooth = t => t * t * (3 - 2 * t);

  if (skip) { loader.remove(); return; }
  root.classList.add('is-loading', 'is-intro');
  // Always open on the hero: no restored scroll position, no #anchor jump.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* sandboxed */ }
  try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* sandboxed */ }
  const toTop = () => { if (window.scrollX || window.scrollY) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
  toTop();
  addEventListener('load', toTop, { once: true });
  addEventListener('pageshow', toTop);

  function wavePath(level, amplitude, phase) {
    const pts = [];
    const U = (WX1 - WX0) / 576;
    for (let x = WX0; x <= WX1 + 1e-6; x += 18 * U) pts.push([x, level + (Math.sin((x - WX0) / U * .012 + phase) * amplitude + Math.sin((x - WX0) / U * .023 - phase * .65) * amplitude * .24) * U]);
    let d = `M${pts[0][0]} ${pts[0][1].toFixed(2)}`;
    for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], n = pts[i + 1]; d += ` Q${p[0]} ${p[1].toFixed(2)} ${(p[0] + n[0]) / 2} ${((p[1] + n[1]) / 2).toFixed(2)}`; }
    const last = pts[pts.length - 1];
    return d + ` L${last[0]} ${last[1].toFixed(2)}`;
  }
  let announced = -1;
  function drawWater(level01, seconds) {
    const level = WY0 - level01 * (WY0 - WY1);
    const amplitude = reduced ? 0 : 11 * Math.sin(Math.PI * Math.min(.99, level01)) + 2;
    const phase = reduced ? 0 : seconds * 1.55;
    const surface = wavePath(level, amplitude, phase);
    fill.setAttribute('d', `${surface} L${WX1} ${WY0 + 40} L${WX0} ${WY0 + 40}Z`);
    edge.setAttribute('d', surface);
    back.setAttribute('d', `${wavePath(level - 4 * (WX1 - WX0) / 576, amplitude * .7, phase + 1.1)} L${WX1} ${WY0 + 40} L${WX0} ${WY0 + 40}Z`);
    const pct = Math.round(level01 * 100);
    if (pct !== announced) { progressbar.setAttribute('aria-valuenow', String(pct)); announced = pct; }
  }

  // Real progress: three.js loading manager (set by the hero bundle) and the
  // page itself; ready when the hero scene has drawn its first frames.
  let pageLoaded = document.readyState === 'complete';
  addEventListener('load', () => { pageLoaded = true; }, { once: true });
  const heroReady = () => document.getElementById('hero-stage')?.classList.contains('is-ready');
  const realProgress = () => {
    const three = window.__kwangjuyoLoad;
    const parts = [pageLoaded ? 1 : .5];
    if (three && three.total > 0) parts.push(three.loaded / three.total);
    return Math.min(...parts);
  };

  let start = 0, last = 0, shown = 0, leaveAt = null, introShown = false;
  // 등장(뾰잉)은 CSS 애니메이션(css/loader.css)이 맡는다: transform 애니메이션은 브라우저 합성 스레드에서 돌아서,
  // 3D 번들·모델을 읽느라 메인 스레드가 멈춰도 느려지거나 끊기지 않고 ORYZO와 같은 속도(0.5s / 0.7s)로 튀다.
  //   .slg-all   = 바깥 원(그림 전체): 0.2s 뒤 0.5s 동안 20% → 100% back-out
  //   .slg-inner = 안쪽 원(잔: 물·점선 윤곽·핸들): 0.2s 뒤 0.7s 동안 20% → 100% back-out (바깥 크기에 한 번 더 곱해짐)
  // 가이드 선·점은 바깥 원과 함께만 움직이도록 별도 SVG 층으로 분리한다.
  (function split() {
    const svg = graphic.querySelector('.cup-graphic');
    if (!svg || graphic.querySelector('.slg-all')) return;
    const all = document.createElement('div'); all.className = 'slg-all';
    const inner = document.createElement('div'); inner.className = 'slg-inner';
    const gsvg = svg.cloneNode(false); gsvg.removeAttribute('data-water'); gsvg.classList.add('slg-guides');
    svg.querySelectorAll('.guides, .guide-points').forEach(el => gsvg.appendChild(el));
    graphic.appendChild(all); inner.appendChild(svg); all.appendChild(inner); all.appendChild(gsvg);
  })();
  // 등장 시작은 '화면이 실제로 그려지기 시작한 뒤'로 미룬다: 첫 화면에서 메인 스레드가 3D 번들을 읽느라 막혀 있으면
  // CSS 애니메이션의 시계가 먼저 흘러가 버려 뾰잉이 중간부터 보이거나 건너뛴다(버벅임). 두 번의 프레임이 연달아
  // 나온 뒤(=그릴 수 있는 상태) 시작하면 처음부터 끝까지 합성 스레드에서 매끈하게 돈다.
  // 등장하는 동안에는 잔 그림(물결 경로) 안을 건드리지 않는다 → 매 프레임 다시 칠할 일이 없어 막혀도 끊기지 않는다.
  let popping = true;
  const popEl = graphic.querySelector('.slg-inner');
    // 시작 = 첫 화면이 실제로 그려진 다음 프레임(두 번의 rAF). 이때 시작한 transform 애니메이션은 합성 스레드로 넘어가
  // 그 뒤에 메인 스레드가 막혀도(버퍼링·3D 읽기) 끝까지 매끈하게 돈다.
  // 등장이 끝날 때까지 무거운 3D 모델 읽기는 기다리게 한다(window.__kjyPop, glb-shim.js가 기다림).
  let popRes; window.__kjyPop = new Promise(r => { popRes = r; });
  const popDone2 = () => { popping = false; if (popRes) { popRes(); popRes = null; } };
  if (popEl) popEl.addEventListener('animationend', popDone2, { once: true });
  if (reduced) { graphic.classList.add('slg-go'); popDone2(); }
  else requestAnimationFrame(() => requestAnimationFrame(() => { graphic.classList.add('slg-go'); setTimeout(popDone2, 1100); }));
  const SAFETY = 12;        // seconds: never hold the visitor longer than this
  // 다 받았고(__kjyNet: 받는 중인 요청 없음, 마지막으로 받은 지 QUIET초) 프레임이 SMOOTH초 동안 끊김 없이 이어지면 준비 끝.
  // 끊김 = 평소 프레임 간격의 2.2배이면서 HITCH초를 넘는 프레임(느린 기기는 평소 간격이 길어도 고르게만 돌면 준비로 본다)
  const QUIET = .5, SMOOTH = .6, HITCH = .05;
  const net = window.__kjyNet;
  let smoothFor = 0, usual = 1 / 60;
  function frame(now) {
    if (!start) start = last = now;
    const t = (now - start) / 1000;
    if (!loader.classList.contains('is-leaving')) toTop();
    const raw = (now - last) / 1000, dt = Math.min(.05, raw); last = now;
    const drawn = heroReady() && pageLoaded;
    const hitch = raw > Math.max(HITCH, usual * 2.2);
    usual += (Math.min(raw, usual * 3) - usual) * .1;   // 평소 간격을 천천히 따라간다(한 번의 큰 끊김엔 거의 흔들리지 않게)
    smoothFor = drawn && !hitch ? smoothFor + raw : 0;
    const quiet = !net || (net.pending() === 0 && now - net.last() > QUIET * 1000);
    const ready = (drawn && quiet && smoothFor > SMOOTH) || t > SAFETY || !window.WebGLRenderingContext;
    const target = ready ? 1 : Math.min(drawn ? .92 : .8, realProgress());
    // 물은 프레임마다 조금씩(한 프레임 최대 1/20초 분량) 차오른다: 화면이 버벅이는 동안엔 천천히 차서 끊긴 모습이 보이지 않는다
    if (!popping) shown = Math.max(shown, Math.min(target, shown + (t > SAFETY ? raw : dt) / MIN));   // 너무 오래 걸리면 실제 시간으로 마저 채운다
    if (!popping) drawWater(smooth(shown), t);

    // Enter.
    // ORYZO 로더: 바깥 원 = backOut(0.2→0.7s, 20%→100%), 안쪽 원 = 바깥 크기 × backOut(0.2→0.9s, 20%→100%).
    // 두 번의 back-out이 겹쳐 안쪽이 한 박자 늦게 '뾰잉' 하고 넘치게 커졌다가 부드럽게 제자리로 줄어든다.
    // 여기서는 바깥 = 그림 전체(가이드·점), 안쪽 = 잔(물·점선 윤곽·핸들).
    // ORYZO처럼 선(윤곽·가이드·핸들)은 처음부터 보이고, 크기만 CSS 애니메이션으로 튀다.
    if (!popping || !frame.fset) { frame.fset = 1; fades.forEach(el => { const v = String(el.classList.contains('guides') ? .68 : el.classList.contains('guide-points') ? .8 : 1); if (el.style.opacity !== v) el.style.opacity = v; }); }

    if (leaveAt === null && shown >= 1 && ready) { leaveAt = now + 280; }
    let i = 0;
    if (leaveAt !== null && now >= leaveAt) {
      if (!loader.classList.contains('is-leaving')) { toTop(); loader.classList.add('is-leaving'); root.classList.remove('is-loading'); if (net) net.stop(); }
      i = clamp((now - leaveAt) / 1000 / (reduced ? .4 : LEAVE));
      const freeze = /[?&]loaderfreeze=([\d.]+)/.exec(location.search); if (freeze) i = Math.min(.999, Number(freeze[1]));
    }
    // Hand-off (ORYZO): the drawing stays over the hero's 3D cup, the
    // background clears around it and the drawing dissolves into the real cup.
    // the water (the fill) clears first; the dotted outline stays and settles on the cup
    { const v = String(1 - fit(i, 0, .32)); if (waterG.style.opacity !== v) waterG.style.opacity = v; }
    fades.forEach(el => { if (i > 0 && !el.classList.contains('cup-outline')) el.style.opacity = String(Number(el.style.opacity) * (1 - fit(i, 0, .3))); });
    { const v = String(1 - fit(i, .55, .92)); if (graphic.style.opacity !== v) graphic.style.opacity = v; }

    // Diagonal wipe: x = y + aspect·0.2·x (uv from the lower left), revealed
    // where x < m·(l + s) − s, opaque where x > m·(l + s).
    if (i > 0) {
      const w = innerWidth, h = innerHeight, a = w / h * .2, l = 1 + a, s = .6;
      const m = fit(i, .12, .7);
      const angle = Math.atan2(a / w, 1 / h) * 180 / Math.PI;
      const e = m * (l + s);
      const pct = x => (x / l * 100).toFixed(2) + '%';
      const stops = [0, .25, .5, .75, 1].map(k => `rgba(0,0,0,${smooth(k).toFixed(3)}) ${pct(e - s + k * s)}`).join(',');
      const mask = `linear-gradient(${angle.toFixed(2)}deg, ${stops})`;
      bg.style.webkitMaskImage = bg.style.maskImage = mask;
      const blur = 50 * h / 1080 * (1 - fit(i, .1, .8));
      veil.style.setProperty('--loader-blur', `${blur.toFixed(2)}px`);
      const vmask = `linear-gradient(${angle.toFixed(2)}deg, #000 0%, rgba(0,0,0,.56) 25%, rgba(0,0,0,.25) 50%, rgba(0,0,0,.06) 75%, transparent 100%)`;
      veil.style.webkitMaskImage = veil.style.maskImage = vmask;
      if (!introShown && i >= .6) { introShown = true; root.classList.add('intro-run'); requestAnimationFrame(() => root.classList.remove('is-intro')); setTimeout(() => root.classList.remove('intro-run'), 1500); }
    }
    if (i >= 1) {
      if (!introShown) { root.classList.remove('is-intro'); }
      loader.remove();
      window.dispatchEvent(new CustomEvent('sori-loader-complete'));
      return;
    }
    requestAnimationFrame(frame);
  }
  drawWater(0, 0);
  requestAnimationFrame(frame);
})();
