/* 페이지 전체 휠 스크롤을 부드럽게: 휠을 굴리면 목표 위치만 옮기고, 화면은 그 목표를 관성 있게 따라간다
   (매 프레임 남은 거리의 1 - e^(-6·dt)만큼 — 내려갈 때와 올라올 때 같다).
   메뉴 이동(window.kjySmoothScroll.to)은 oryzo scrollManager.scrollTo처럼 1 - e^(-12·dt)로 빠르게 따라간다.
   멀리 갈 때는 목표 3화면 앞까지 바로 옮긴 뒤 따라간다 — 사이의 무거운 3D 장면을 하나하나 그리며 끊기지 않게
   (oryzo도 첫 몇 프레임에 남은 거리의 대부분을 한 번에 지나가므로 보이는 움직임은 같다).
   터치·키보드·스크롤바 이동은 브라우저 기본 동작 그대로 두고, 그런 이동이 시작되면 바로 손을 뗀다.
   안쪽에서 따로 스크롤되는 요소 위에서는 그 요소가 먼저 스크롤된다. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const WHEEL_EASE = 6, JUMP_EASE = 12, JUMP_NEAR = 3; // JUMP_NEAR: 화면 높이 배수
  let target = null, current = 0, raf = 0, last = 0, ease = WHEEL_EASE, onDone = null;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const finish = () => { const f = onDone; onDone = null; if (f) f(); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; target = null; finish(); };
  const start = y => {
    target = y;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  };
  const step = now => {
    const dt = Math.min(.1, Math.max(.001, (now - last) / 1000)); last = now;
    current += (target - current) * (1 - Math.exp(-ease * dt));
    if (Math.abs(target - current) < .4) current = target;
    scrollTo({ top: current, behavior: 'instant' });
    if (current === target) { raf = 0; target = null; finish(); return; }
    raf = requestAnimationFrame(step);
  };
  // 휠 방향으로 아직 스크롤할 수 있는 안쪽 요소가 있으면 그 요소에 맡긴다
  const scrollsInside = (el, dy) => {
    for (; el instanceof Element && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1 || !/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
      if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
    }
    return false;
  };
  const onWheel = e => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    if (getComputedStyle(document.body).overflowY === 'hidden') return; // 메뉴가 열려 페이지 스크롤이 잠긴 동안
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (scrollsInside(e.target, d)) return;
    e.preventDefault();
    if (target === null) current = scrollY;
    ease = WHEEL_EASE;
    finish();
    start(clamp((target ?? scrollY) + d, 0, maxY()));
  };
  addEventListener('wheel', onWheel, { passive: false });
  // 기기가 느려 화면이 계속 버벅이면(kjy-hand.js가 알림) 브라우저 기본 스크롤로: 기본 스크롤은 메인 스레드가 바빠도 움직인다
  addEventListener('kjy:slow', () => removeEventListener('wheel', onWheel, { passive: false }), { once: true });
  // 메뉴 이동: 목표 위치(px)로 빠르고 부드럽게. done: 도착하거나 다른 입력으로 멈추면 한 번 불린다
  window.kjySmoothScroll = {
    to(y, done) {
      finish();
      onDone = done || null;
      const goal = clamp(y, 0, maxY()), near = innerHeight * JUMP_NEAR;
      current = target === null ? scrollY : current;
      if (Math.abs(goal - current) > near) { current = goal - Math.sign(goal - current) * near; scrollTo({ top: current, behavior: 'instant' }); }
      ease = JUMP_EASE;
      start(goal);
    },
  };
  // 스크롤바를 끌거나 키보드·링크로 이동하면 바로 손을 뗀다
  addEventListener('scroll', () => { if (target !== null && Math.abs(scrollY - current) > 3) stop(); }, { passive: true });
  for (const type of ['keydown', 'pointerdown', 'touchstart']) addEventListener(type, () => { if (target !== null) stop(); }, { passive: true });
})();
