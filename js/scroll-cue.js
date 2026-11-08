/* '스크롤하여 …' 안내 — 나타나고 사라지는 방식은 모든 안내가 이 하나를 쓴다.
   oryzo site-footer-scroll과 같은 식(비율 r 0~1 하나로 움직인다):
   · 글자: c = 글자 순서(0~1), opacity = fit(r, c·.3, .7 + c·.3)
     → 사라질 때 오른쪽 글자부터 왼쪽으로 차례로 흐려지고, 나타날 때 왼쪽 글자부터 차례로 또렷해진다
   · 점선 원: scale = .5 + .5·backOut(r), opacity = fit(r, 0, .5)
   · 화살표: opacity × r
   r이 0이면 숨긴다. */
(() => {
  'use strict';
  const fit = (v, a, b) => Math.max(0, Math.min(1, (v - a) / (b - a)));
  const backOut = t => { const s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; };

  window.kjyScrollCue = {
    // className: 안내마다 위치·색을 정하는 추가 클래스, parent: 붙일 곳
    create(label, className, parent) {
      const el = document.createElement('div');
      el.className = `eg-scroll ${className}`.trim();
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<span><i class="kjy-chev"></i><i class="kjy-chev kjy-g1"></i><i class="kjy-chev kjy-g2"></i></span>';
      const text = document.createElement('b');
      text.className = 'cue-text';
      const chars = [...label].map(ch => {
        const c = document.createElement('span');
        c.className = 'cue-ch';
        c.textContent = ch;
        text.appendChild(c);
        return c;
      });
      el.appendChild(text);
      parent.appendChild(el);
      el.kjyCue = { chars, r: -1 };
      return el;
    },
    set(el, ratio) {
      const r = Math.round(Math.max(0, Math.min(1, ratio)) * 1000) / 1000, state = el.kjyCue;
      if (state.r === r) return;
      state.r = r;
      el.style.visibility = r > 0 ? 'visible' : 'hidden';
      el.style.setProperty('--cue-r', r);
      el.style.setProperty('--cue-ring', (.5 + .5 * backOut(r)).toFixed(3));
      el.style.setProperty('--cue-ring-a', fit(r, 0, .5).toFixed(3));
      const last = Math.max(1, state.chars.length - 1);
      state.chars.forEach((c, i) => { c.style.opacity = fit(r, i / last * .3, .7 + i / last * .3).toFixed(3); });
    },
  };
})();
