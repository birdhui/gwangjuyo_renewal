/* 페이지 전체 휠 스크롤을 부드럽게: 휠을 굴리면 목표 위치만 옮기고, 화면은 그 목표를 관성 있게 따라간다
   (매 프레임 남은 거리의 1 - e^(-6·dt)만큼 — 내려갈 때와 올라올 때 같다).
   터치·키보드·스크롤바·메뉴 링크 이동은 브라우저 기본 동작 그대로 두고, 그런 이동이 시작되면 바로 손을 뗀다.
   안쪽에서 따로 스크롤되는 요소 위에서는 그 요소가 먼저 스크롤된다. */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const EASE = 6;
  let target = null, current = 0, raf = 0, last = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const maxY = () => document.documentElement.scrollHeight - innerHeight;
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; target = null; };
  const step = now => {
    const dt = Math.min(.1, Math.max(.001, (now - last) / 1000)); last = now;
    current += (target - current) * (1 - Math.exp(-EASE * dt));
    if (Math.abs(target - current) < .4) current = target;
    scrollTo({ top: current, behavior: 'instant' });
    if (current === target) { raf = 0; target = null; return; }
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
  addEventListener('wheel', e => {
    if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    if (getComputedStyle(document.body).overflowY === 'hidden') return; // 메뉴가 열려 페이지 스크롤이 잠긴 동안
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (scrollsInside(e.target, d)) return;
    e.preventDefault();
    if (target === null) current = scrollY;
    target = clamp((target ?? scrollY) + d, 0, maxY());
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  }, { passive: false });
  // 스크롤바를 끌거나 키보드·링크로 이동하면 바로 손을 뗀다
  addEventListener('scroll', () => { if (target !== null && Math.abs(scrollY - current) > 3) stop(); }, { passive: true });
  for (const type of ['keydown', 'pointerdown', 'touchstart']) addEventListener(type, () => { if (target !== null) stop(); }, { passive: true });
})();
