// 구슬 — 소리잔 굽 속의 작은 구슬. 스크롤하면 잔 아래로 다가가고, 굽이 맑게 비치며 구슬이 드러난다.
// 마우스(손가락)를 움직이면 구슬이 굴러 굽 안쪽 벽에 부딪히며 맑게 울린다.
// 화면은 Blender Cycles 렌더: 다가가는 장면(dolly) 프레임, 클로즈업 불투명·반투명 판, 구슬 위치별 프레임(공동 영역만).
(() => {
  const section = document.getElementById('marble');
  if (!section) return;
  const stage = section.querySelector('.mb-stage'), cv = section.querySelector('.mb-canvas'), g = cv.getContext('2d');
  const copy1 = section.querySelector('.mb-copy1'), copy2 = section.querySelector('.mb-copy2'), hint = section.querySelector('.mb-hint');
  const arrows = section.querySelector('.mb-arrows'), soundBtn = section.querySelector('.mb-sound');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), fit = (v, a, b) => clamp((v - a) / (b - a)), sm = t => t * t * (3 - 2 * t);
  const BASE = 'img/marble/';
  let META = null, dolly = [], opaque = null, clear = null, sprite = null;
  const load = src => new Promise(res => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = BASE + src; });
  let loading = false;
  async function loadAll() {
    if (loading) return; loading = true;
    META = await (await fetch(BASE + 'meta.json')).json();
    [opaque, clear] = await Promise.all([load('opaque.webp'), load('clear.webp')]);
    dolly = await Promise.all(Array.from({ length: META.dolly }, (_, i) => load(`d_${String(i).padStart(2, '0')}.webp`)));
    sprite = await load('sprite.webp');
    draw(true);
  }
  new IntersectionObserver(([e]) => { if (e.isIntersecting) loadAll(); }, { rootMargin: '200% 0px 200% 0px' }).observe(section);

  // ---------- 배치: 데스크톱은 화면을 덮고, 세로 화면은 굽이 화면 폭의 86%가 되게 ----------
  let W = 0, H = 0, dpr = 1, S = 1, OX = 0, OY = 0;
  const IW = 1280, IH = 720, FOOT_W = .37;   // 렌더 판에서 굽 아랫단 폭(판 폭 대비)
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, innerWidth >= 2560 ? 1 : 1.5); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cover = Math.max(W / IW, H / IH), foot = .86 * W / (FOOT_W * IW);
    S = W / H < 1 ? Math.min(cover, foot) : cover;
    OX = (W - IW * S) / 2; OY = (H - IH * S) / 2 + (W / H < 1 ? -.04 * H : 0);
    draw(true);
  }
  addEventListener('resize', resize);

  // ---------- 스크롤 ----------
  let p = 0, target = 0;
  const LEAD = .9;
  const readScroll = () => { const r = section.getBoundingClientRect(), lead = innerHeight * LEAD; target = clamp((-r.top + lead) / (r.height - innerHeight + lead)); };
  addEventListener('scroll', readScroll, { passive: true });

  // ---------- 구슬 ----------
  let u = 0, v = 0, ut = 0, lastHit = 0, rollGain = 0;
  const pointer = e => { const x = (e.touches ? e.touches[0].clientX : e.clientX) / innerWidth; ut = clamp((x - .5) * 2 * 1.3, -1.25, 1.25); };
  addEventListener('pointermove', pointer, { passive: true });
  addEventListener('touchmove', pointer, { passive: true });

  // ---------- 소리 (WebAudio): 유리 구슬이 백자 굽 안쪽에 부딪히는 맑은 소리 + 구르는 소리 ----------
  let ac = null, master = null, rev = null, roll = null, on = false;
  function audio() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    // 짧은 잔향: 잔 속처럼 작은 공간
    rev = ac.createGain(); rev.gain.value = .35;
    const d1 = ac.createDelay(), d2 = ac.createDelay(), f1 = ac.createGain(), f2 = ac.createGain(), lp = ac.createBiquadFilter();
    d1.delayTime.value = .031; d2.delayTime.value = .047; f1.gain.value = .42; f2.gain.value = .38; lp.type = 'lowpass'; lp.frequency.value = 5200;
    rev.connect(d1); rev.connect(d2); d1.connect(f1); d2.connect(f2); f1.connect(lp); f2.connect(lp); lp.connect(d1); lp.connect(d2); lp.connect(master);
    // 구르는 소리: 낮게 깔린 마찰음
    const len = ac.sampleRate * 2, nb = ac.createBuffer(1, len, ac.sampleRate), ch = nb.getChannelData(0);
    let b = 0; for (let i = 0; i < len; i++) { b = (b + .02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = b * 3.5; }
    const src = ac.createBufferSource(); src.buffer = nb; src.loop = true;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 820; bp.Q.value = .9;
    roll = ac.createGain(); roll.gain.value = 0;
    src.connect(bp); bp.connect(roll); roll.connect(master); roll.connect(rev); src.start();
  }
  function clink(a) {
    if (!on || !ac || a < .02) return;
    const t = ac.currentTime, f0 = 1900 + Math.random() * 380, amp = Math.min(1, a) * .5;
    const out = ac.createGain(); out.gain.value = 1; out.connect(master); out.connect(rev);
    [[1, 1, .9], [2.32, .55, .5], [4.25, .32, .3], [6.63, .16, .18]].forEach(([r, gn, dec]) => {
      const o = ac.createOscillator(), e = ac.createGain(); o.type = 'sine'; o.frequency.value = f0 * r * (1 + (Math.random() - .5) * .01);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp * gn, t + .002); e.gain.exponentialRampToValueAtTime(.0001, t + dec * (.6 + a * .6));
      o.connect(e); e.connect(out); o.start(t); o.stop(t + dec * 1.3 + .05);
    });
    // 잔 몸통의 울림: 낮고 길게
    [[930, .16, 1.6], [1710, .09, 1.1]].forEach(([f, gn, dec]) => {
      const o = ac.createOscillator(), e = ac.createGain(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - .5) * .006);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp * gn, t + .004); e.gain.exponentialRampToValueAtTime(.0001, t + dec);
      o.connect(e); e.connect(out); o.start(t); o.stop(t + dec + .05);
    });
    // 딸깍: 아주 짧은 잡음
    const n = ac.createBufferSource(), nbuf = ac.createBuffer(1, ac.sampleRate * .02, ac.sampleRate), d = nbuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3500; const ng = ac.createGain(); ng.gain.value = amp * .5;
    n.buffer = nbuf; n.connect(hp); hp.connect(ng); ng.connect(out); n.start(t);
  }
  function setSound(next) {
    audio(); on = next; ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime); master.gain.linearRampToValueAtTime(on ? .9 : 0, ac.currentTime + .15);
    soundBtn.classList.toggle('is-on', on); soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    soundBtn.setAttribute('aria-label', on ? '소리 끄기' : '소리 켜기');
    if (on) clink(.5);
  }
  soundBtn.addEventListener('click', e => { e.stopPropagation(); setSound(!on); });
  stage.addEventListener('pointerdown', () => { if (!on && p > .6) setSound(true); });

  // ---------- 그리기 ----------
  const off = document.createElement('canvas'), og = off.getContext('2d');
  function plate(im, a = 1) { if (!im || a <= 0) return; g.globalAlpha = a; g.drawImage(im, OX, OY, IW * S, IH * S); g.globalAlpha = 1; }
  function crop(im, a) {
    if (!im || a <= 0 || !META) return;
    const [x0, x1, y0, y1] = META.border, cx = x0 * IW, cy = (1 - y1) * IH, cw = (x1 - x0) * IW, ch = (y1 - y0) * IH;
    if (off.width !== im.width || off.height !== im.height) { off.width = im.width; off.height = im.height; }
    og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, off.width, off.height); og.drawImage(im, 0, 0);
    // 가장자리를 부드럽게 풀어 판과 이어지게
    og.globalCompositeOperation = 'destination-in';
    const f = .08, gx = og.createLinearGradient(0, 0, off.width, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(f, '#000'); gx.addColorStop(1 - f, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    og.fillStyle = gx; og.fillRect(0, 0, off.width, off.height);
    const gy = og.createLinearGradient(0, 0, 0, off.height); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(f, '#000'); gy.addColorStop(1 - f, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    og.fillStyle = gy; og.fillRect(0, 0, off.width, off.height);
    g.globalAlpha = a; g.drawImage(off, OX + cx * S, OY + cy * S, cw * S, ch * S); g.globalAlpha = 1;
  }
  // 구슬: 사진 속 맑은 청록 유리구슬. 굴러간 만큼 돌고, 은은한 청록 빛과 바닥 그림자를 더한다.
  function marbleAt(a) {
    if (!sprite || !META) return;
    const D = .118 * IW * S, r = D / 2;                       // 렌더 판에서 구슬 지름(공동 폭 기준)
    const mx = OX + (META.center[0] + u * META.xrange) * IW * S, my = OY + META.center[1] * IH * S;
    const ang = u * .215 / .165;                                // 미끄러짐 없이 굴러간 각도
    g.save(); g.globalAlpha = a;
    // 바닥 그림자
    const sh = g.createRadialGradient(mx, my + r * .98, 0, mx, my + r * .98, r * 1.05);
    sh.addColorStop(0, 'rgba(0,18,16,.55)'); sh.addColorStop(1, 'rgba(0,18,16,0)');
    g.save(); g.translate(mx, my + r * .98); g.scale(1, .22); g.translate(-mx, -(my + r * .98)); g.fillStyle = sh; g.fillRect(mx - r * 1.2, my + r * .98 - r * 1.2, r * 2.4, r * 2.4); g.restore();
    // 영롱한 바깥 빛
    g.globalCompositeOperation = 'lighter';
    const gl = g.createRadialGradient(mx, my, r * .7, mx, my, r * 1.9); gl.addColorStop(0, 'rgba(70,230,210,.22)'); gl.addColorStop(1, 'rgba(70,230,210,0)');
    g.fillStyle = gl; g.fillRect(mx - r * 2, my - r * 2, r * 4, r * 4);
    g.globalCompositeOperation = 'source-over';
    g.translate(mx, my); g.rotate(ang); g.drawImage(sprite, -r, -r, D, D); g.rotate(-ang);
    // 빛은 돌지 않고 제자리: 창문 모양 하이라이트를 위쪽 왼쪽에 살짝
    g.globalCompositeOperation = 'lighter';
    const hl = g.createRadialGradient(-r * .42, -r * .5, 0, -r * .42, -r * .5, r * .5); hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(0, 0, r * .98, 0, 7); g.fill();
    g.restore();
  }
  let lastKey = '', bgGrad = null, bgKey = '';
  function draw(force) {
    const key = [p.toFixed(4), u.toFixed(4), W, H].join();
    if (!force && key === lastKey) return; lastKey = key;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#050403'; g.fillRect(0, 0, W, H);
    const dp = sm(fit(p, .04, .46)), reveal = sm(fit(p, .52, .64));
    if (dolly.length && dp < 1) {
      const fi = dp * (dolly.length - 1), i0 = Math.floor(fi), k = fi - i0;
      plate(dolly[i0]); if (k > .01 && dolly[i0 + 1]) plate(dolly[i0 + 1], k);
    } else if (!dolly.length && dp < 1 && opaque) {   // 다가가는 프레임이 없을 때: 판을 굽 중심으로 살짝 당긴다
      const z = .62 + .38 * dp, cx = OX + .5 * IW * S, cy = OY + .56 * IH * S;
      g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); plate(opaque); g.restore();
    } else plate(opaque);
    if (dp >= 1 && reveal > 0) { plate(clear, reveal); marbleAt(reveal); }
    // 위아래 가장자리는 어둠으로(세로 화면에서 판 밖)
    if (OY > 0) { const gr = g.createLinearGradient(0, OY, 0, OY + 60); gr.addColorStop(0, '#050403'); gr.addColorStop(1, 'rgba(5,4,3,0)'); g.fillStyle = gr; g.fillRect(0, OY, W, 60);
      const gb = g.createLinearGradient(0, OY + IH * S - 80, 0, OY + IH * S); gb.addColorStop(0, 'rgba(5,4,3,0)'); gb.addColorStop(1, '#050403'); g.fillStyle = gb; g.fillRect(0, OY + IH * S - 80, W, 80); }
    // rewind와 같은 배경: 검은 바탕 위에 rewind 배경을 '스크린'으로 겹치면 검은 곳은 rewind 배경이 되고 밝은 도자기는 그대로 남는다
    const col = window.__kjyStoryCol;
    if (col) {
      if (!bgGrad || bgKey !== W + 'x' + H) { bgKey = W + 'x' + H; bgGrad = g.createRadialGradient(0, H, 0, 0, H, W); for (let k = 0; k <= 24; k++) bgGrad.addColorStop(k / 24, `rgb(${col(k / 24).join(',')})`); }
      g.globalCompositeOperation = 'screen'; g.fillStyle = bgGrad; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    }
  }

  // ---------- 매 프레임 ----------
  let live = false, running = false, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    p += (target - p) * (reduced ? 1 : 1 - Math.pow(.003, dt));
    // Clear the fixed stage before Sori Series enters, including on reverse scroll.
    const o = sm(fit(p, 0, .05)) * (1 - sm(fit(p, .9, .99)));
    stage.style.opacity = o.toFixed(3); stage.classList.toggle('is-on', o > .001);
    const interactive = p > .62;
    // 구슬: 손을 따라가는 용수철, 굽 안쪽 벽(±1)에 부딪히면 튕기며 울린다
    const goal = interactive ? ut : 0;
    if (reduced) { u = clamp(goal, -1, 1); v = 0; } else {
      v += (16 * (goal - u) - 3.2 * v) * dt; u += v * dt;
      if (u > 1 || u < -1) { const hit = Math.abs(v); u = clamp(u, -1, 1); v = -v * .42; if (now - lastHit > 60) { clink(hit * .55); lastHit = now; } }
    }
    if (on && roll) { rollGain += (Math.min(.22, Math.abs(v) * .12) * (interactive ? 1 : 0) - rollGain) * (1 - Math.pow(.001, dt)); roll.gain.value = rollGain; }
    // 글
    copy1.style.opacity = (sm(fit(p, .12, .2)) * (1 - sm(fit(p, .38, .46)))).toFixed(3);
    copy1.style.transform = `translate3d(-50%, ${(12 * (1 - sm(fit(p, .12, .22)))).toFixed(1)}px, 0)`;
    copy2.style.opacity = sm(fit(p, .62, .7)).toFixed(3);
    copy2.style.transform = `translate3d(-50%, ${(12 * (1 - sm(fit(p, .62, .72)))).toFixed(1)}px, 0)`;
    const ho = sm(fit(p, .7, .78)); hint.style.opacity = ho.toFixed(3); soundBtn.style.opacity = ho.toFixed(3); soundBtn.style.pointerEvents = ho > .3 ? 'auto' : 'none';
    // 구슬 둘레 화살표(손을 대기 전까지)
    if (META) {
      const [cx, cy] = META.center, mx = OX + (cx + u * META.xrange) * IW * S, my = OY + cy * IH * S;
      arrows.style.transform = `translate3d(${mx.toFixed(1)}px, ${my.toFixed(1)}px, 0) scale(${(S * IW / 1280).toFixed(3)})`;
      arrows.style.opacity = (ho * (1 - clamp(Math.abs(ut) * 3))).toFixed(3);
    }
    draw(false);
    if (live) requestAnimationFrame(frame); else running = false;
  }
  new IntersectionObserver(([e]) => { live = e.isIntersecting; if (live && !running) { running = true; last = performance.now(); readScroll(); requestAnimationFrame(frame); } }, { rootMargin: '100% 0px 100% 0px' }).observe(section);
  resize(); readScroll();
  window.__marble = { settle: () => { p = target; }, state: () => ({ p, u }) };
})();
