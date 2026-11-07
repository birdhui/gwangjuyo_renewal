// 스크롤 진행도(0–1)에 맞춰 제목·부제·설명이 글자와 줄 단위로 들어오고 나가는 모션.
// ORYZO 시리즈 타이틀과 같은 방식: 글자별 stagger, 가로 이동, 미세한 블러, 설명은 줄 마스크 상승.
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const fit = (v, a, b) => clamp((v - a) / (b - a));
const expoOut = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function split(el) {
  const text = el.textContent.trim(); el.textContent = ''; el.setAttribute('aria-label', text);
  const out = [];
  for (const ch of text) {
    if (/\s/.test(ch)) { el.append(document.createTextNode(' ')); continue; }
    const s = document.createElement('span'); s.className = 'bc'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; el.append(s); out.push(s);
  }
  return out;
}

export function createBeats(root, key) {
  const beats = [...root.querySelectorAll('.beat')].map(el => ({
    el, from: +el.dataset.from, to: +el.dataset.to, last: el.hasAttribute('data-last'),
    no: el.querySelector('.beat-no'),
    title: split(el.querySelector('.beat-title')),
    tag: split(el.querySelector('.beat-tag')),
    lines: [...el.querySelectorAll('.beat-desc .dl>span')],
  }));
  return function update(p) {
    for (const b of beats) {
      const span = b.to - b.from;
      const a = reduced ? 1 : fit(p, b.from, b.from + span * .3);
      const out = key && window.__make ? fit(window.__make[key] || 0, 0, .55) : 0;
      const l = reduced ? 0 : Math.max(b.last ? 0 : fit(p, b.to - span * .22, b.to), b.last ? out : 0);
      const vis = p >= b.from - .001 && (b.last || p <= b.to + .001) && l < 1;
      b.el.style.visibility = vis ? 'visible' : 'hidden';
      if (!vis) continue;
      const n = Math.max(1, b.title.length - 1);
      b.title.forEach((c, i) => {
        const k = i / n, e = expoOut(fit(a, k * .3, k * .3 + .5));
        const o = e * (1 - fit(l, k * .2, k * .2 + .8));
        c.style.opacity = o.toFixed(3);
        c.style.transform = `translate3d(${((1 - e) * .28 - fit(l, k * .2, k * .2 + .8) * .28).toFixed(3)}ex,0,0)`;
        c.style.filter = innerWidth < 768 ? 'none' : `blur(${((1 - e) * .12).toFixed(3)}em)`;
      });
      const m = Math.max(1, b.tag.length - 1);
      b.tag.forEach((c, i) => {
        const k = i / m, e = expoOut(fit(a, .25 + k * .3, .25 + k * .3 + .5));
        c.style.opacity = (e * (1 - fit(l, k * .3, k * .3 + .6))).toFixed(3);
        c.style.transform = `translate3d(0,${((1 - e) * .9 - fit(l, k * .3, k * .3 + .6) * .6).toFixed(3)}em,0)`;
      });
      const q = Math.max(1, b.lines.length - 1);
      b.lines.forEach((s, i) => {
        const g = i / q, e = expoOut(fit(a, .5 + g * .16, .5 + g * .16 + .45)), x = fit(l, g * .2, g * .2 + .7);
        s.style.transform = `translate3d(0,${((1 - e) * 115 - x * 115).toFixed(2)}%,0)`;
        s.style.opacity = (e * (1 - x)).toFixed(3);
      });
      if (b.no) b.no.style.opacity = (fit(a, .1, .5) * (1 - fit(l, 0, .5))).toFixed(3);
    }
  };
}
