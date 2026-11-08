// '쓰임으로 이어지는 아름다움' 빛 — oryzo 'sustainability' 제목 효과를 그대로 옮긴 것
//
// oryzo(hoisted.CRsATKbF.js)의 SustainabilityText와 같은 계산:
//   · 빛의 띠: l = .5 + 2·pr, d = (1 - pr)(1 + l) - x - l (x = 화면 가로 위치 0~1)
//     -l < d < 0 구간에서 smoothstep(-l, 0, d) — 왼쪽 앞머리가 가장 밝고 오른쪽으로 아주 길게 옅어진다.
//     pr이 0→1(2초)로 가는 동안 띠가 오른쪽 밖에서 들어와 왼쪽 밖으로 빠져나가며 점점 넓어진다.
//   · 글자 면: (띠 × 0.2 + 전체가 잠깐 밝아짐 smoothstep(0,.4,pr)·smoothstep(1,.4,pr) × 0.2) → 블룸으로만 빛난다
//   · 글자 윤곽선: max(띠 × smoothstep(0,.2,pr), 마우스 자취) — 윤곽마다 밝은 구간이 둘레를 따라 흘러간다
//     (t = 시간·0.2/둘레 - 윤곽 위치, smoothstep(0,.05,t)·smoothstep(.8,.5,t)) — 윤곽선은 그대로 더해지고 블룸에도 들어간다
//   · 마우스(호버): oryzo ScreenPaint — 마우스가 움직인 선분을 따라 (한 프레임 이동 거리, 최대 100px) 반지름의 붓으로 칠하고
//     z는 프레임마다 ×0.985, w는 ×0.75로 옅어진다(최소 0.004씩). 윤곽선 밝기 = smoothstep(.2, .5, (z + w) / 2)
//   · 블룸: 렌더 해상도(min(1.5, devicePixelRatio))의 1/2부터 1/32까지 5단계, 단계마다 반지름 3+2i 픽셀로 이어서 흐림,
//     가중치 amount·(D+(1.2-2D)·radius)/2^(4-i) × selectiveStrength (sustainability 장면: amount 2.5, radius .25, selective 1.5)
import GLYPHS from './beauty-glyphs.js?v=20261108-r53';

const LEVELS = 5, BLOOM_AMOUNT = 2.5, BLOOM_RADIUS = .25, SELECTIVE = 1.5;
const LEVEL_BLUR = Array.from({ length: LEVELS }, (_, i) => 3 + 2 * i);
const LEVEL_WEIGHT = Array.from({ length: LEVELS }, (_, i) => {
  const D = (LEVELS - i) / LEVELS;
  return BLOOM_AMOUNT * (D + (1.2 - D * 2) * BLOOM_RADIUS) / 2 ** (LEVELS - i - 1) * SELECTIVE;
});
const STOPS = 48;            // 띠 그라디언트 표본 수(+ 앞머리 2개)
const LINE_WIDTH = .0025;    // 윤곽선 굵기(글자 줄 너비 대비) — oryzo 윤곽 리본 ±0.002의 실제 밝기 폭
const DASH = [.6, .4];       // 윤곽 둘레 대비 밝은 구간 / 어두운 구간
const DASH_LEAD = .65;       // 밝은 구간 끝이 t = .65에 오도록
const PAINT = { scale: .25, maxRadius: 100, keep1: .985, keep2: .75, minStep: .004 }; // oryzo ScreenPaint(화면의 1/4 해상도)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const canvas2d = () => { const c = document.createElement('canvas'); return { c, ctx: c.getContext('2d') }; };
const clear = ({ c, ctx }) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); };

// oryzo 빛의 띠(앞머리에서 1, 뒤로 갈수록 0)
const band = (x, pr) => {
  const l = .5 + 2 * pr, d = (1 - pr) * (1 + l) - x - l;
  return d < 0 && d > -l ? smoothstep(-l, 0, d) : 0;
};

// 마우스 자취(oryzo ScreenPaint의 칠하기·옅어지기, 화면 좌표 px)
function createPaint() {
  let w = 0, h = 0, z = null, v = null, image = null, live = false;
  const view = canvas2d();
  let from = null, to = null;
  return {
    view: view.c,
    get live() { return live; },
    resize(width, height) {
      w = Math.max(1, Math.ceil(width * PAINT.scale)); h = Math.max(1, Math.ceil(height * PAINT.scale));
      z = new Float32Array(w * h); v = new Float32Array(w * h);
      view.c.width = w; view.c.height = h; image = view.ctx.createImageData(w, h);
      live = false;
    },
    move(x, y) { to = { x: x * PAINT.scale, y: y * PAINT.scale }; },
    step(dt) {
      if (!z) return;
      const f = dt * 60, k1 = PAINT.keep1 ** f, k2 = PAINT.keep2 ** f, minStep = PAINT.minStep * f;
      let any = false;
      for (let i = 0; i < z.length; i++) {
        if (z[i] > 0) { z[i] = Math.max(0, Math.min(z[i] * k1, z[i] - minStep)); any = any || z[i] > 0; }
        if (v[i] > 0) { v[i] = Math.max(0, Math.min(v[i] * k2, v[i] - minStep)); any = any || v[i] > 0; }
      }
      // 이번 프레임에 움직인 선분을 따라 칠한다(반지름 = 이동 거리, 최대 100px)
      if (to && from) {
        const dist = Math.hypot(to.x - from.x, to.y - from.y) / PAINT.scale;
        const r = Math.min(dist, PAINT.maxRadius) * PAINT.scale;
        if (r > .5) {
          const x0 = Math.max(0, Math.floor(Math.min(from.x, to.x) - r)), x1 = Math.min(w - 1, Math.ceil(Math.max(from.x, to.x) + r));
          const y0 = Math.max(0, Math.floor(Math.min(from.y, to.y) - r)), y1 = Math.min(h - 1, Math.ceil(Math.max(from.y, to.y) + r));
          const bx = to.x - from.x, by = to.y - from.y, bb = bx * bx + by * by || 1;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            const px = x + .5 - from.x, py = y + .5 - from.y, t = clamp((px * bx + py * by) / bb);
            const d = 1 - smoothstep(-.01, r, Math.hypot(px - bx * t, py - by * t));
            if (d <= 0) continue;
            const i = y * w + x;
            z[i] = Math.min(1, z[i] + d); v[i] = Math.min(1, v[i] + d); any = true;
          }
        }
      }
      from = to;
      live = any;
      if (!live) return;
      // 윤곽선 밝기 = smoothstep(.2, .5, (z + w) / 2) → 알파 이미지
      const px = image.data;
      for (let i = 0, j = 3; i < z.length; i++, j += 4) px[j] = 255 * smoothstep(.2, .5, (z[i] + v[i]) / 2);
      view.ctx.putImageData(image, 0, 0);
    },
  };
}

export function createTitleLight(title, chars) {
  // 빛 층(캔버스 하나, 글자 위에 더해진다). oryzo처럼 렌더 해상도의 1/2에서 그린다:
  // 윤곽선 모양(shape) × 밝기(weight: 띠·마우스 자취) = 윤곽선(lines) → 글자 면과 합쳐 블룸 원본(src) → 5단계 흐림 → 블룸 + 윤곽선(out)
  const out = canvas2d();
  out.c.className = 'beauty-title-pulse';
  out.c.setAttribute('aria-hidden', 'true');
  const shape = canvas2d(), weight = canvas2d(), lines = canvas2d(), src = canvas2d(), levels = Array.from({ length: LEVELS }, canvas2d);
  const paint = createPaint();
  title.appendChild(out.c);

  const glyphs = chars.map(c => {
    const outline = GLYPHS.glyphs[c.textContent] || [];
    return {
      x: 0, y: 0,
      fill: new Path2D(outline.map(o => o.d).join('')),
      contours: outline.map(o => ({ units: o.p, perim: 1, offset: 0, shape: new Path2D(o.d) })),
    };
  });

  let frame = { w: 1, h: 1, dy: 0, res: 1, scale: 1, line: 1, color: '255,237,215' }, on = false, last = 0;

  // 글자 크기·위치가 바뀌면(처음, 화면 크기 변경, 글꼴 로드) 다시 맞춘다
  const measure = () => {
    // 층 = 제목을 가운데 둔 화면 크기 틀(제목이 화면 가운데 고정될 때 화면과 겹친다). 가로 좌표 = 화면 x
    const tr = title.getBoundingClientRect();
    const w = document.documentElement.clientWidth, h = window.innerHeight;
    const top = tr.height / 2 - h / 2, dy = -tr.top - top; // 화면 y → 층 y
    Object.assign(out.c.style, { left: `${-tr.left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` });
    // 기준선: 글자 줄 안에 크기 0인 inline-block을 넣어 그 아래 끝을 잰다
    const mark = document.createElement('span');
    mark.style.cssText = 'display:inline-block;width:0;height:0';
    chars[0].parentElement.appendChild(mark);
    const baseline = mark.getBoundingClientRect().bottom + dy;
    mark.remove();
    const scale = (parseFloat(getComputedStyle(title).fontSize) || 60) / GLYPHS.upm;
    const rects = chars.map(c => c.getBoundingClientRect());
    const lineWidth = Math.max(1, rects.at(-1).right - rects[0].left);
    glyphs.forEach((g, i) => {
      g.x = rects[i].left; g.y = baseline;
      g.contours.forEach(c => { c.perim = c.units * scale / lineWidth; }); // oryzo 둘레 단위 = 글자 줄 너비
    });
    // 블룸 해상도: oryzo 렌더 배율의 1/2에서 시작해 단계마다 1/2
    const res = Math.min(1.5, window.devicePixelRatio || 1) / 2;
    for (const { c } of [out, shape, weight, lines, src]) { c.width = Math.ceil(w * res); c.height = Math.ceil(h * res); }
    levels.forEach((lv, i) => { lv.c.width = Math.ceil(src.c.width / 2 ** i); lv.c.height = Math.ceil(src.c.height / 2 ** i); });
    paint.resize(w, h);
    const rgb = getComputedStyle(out.c).color.match(/[\d.]+/g) || [255, 237, 215];
    frame = { w, h, dy, res, scale, line: lineWidth * LINE_WIDTH, color: rgb.slice(0, 3).join(',') };
  };

  const setOn = value => {
    if (on === value) return;
    on = value;
    out.c.classList.toggle('is-on', on);
  };

  // 화면 가로 비율 xs에 맞춘 그라디언트. 지금 ctx 좌표 = (화면 x - ox) / k
  const gradient = (ctx, k, ox, xs, alphas) => {
    const g = ctx.createLinearGradient((0 - ox) / k, 0, (frame.w - ox) / k, 0);
    xs.forEach((x, i) => g.addColorStop(x, `rgba(${frame.color},${alphas[i]})`));
    return g;
  };

  // 글자마다 글꼴 단위 좌표계로 그린다
  const eachGlyph = (ctx, paintGlyph) => {
    const k = frame.res * frame.scale;
    for (const g of glyphs) { ctx.setTransform(k, 0, 0, k, frame.res * g.x, frame.res * g.y); paintGlyph(g); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const draw = (xs, fillA, bandA, shownA) => {
    const W = src.c.width, H = src.c.height;
    // 윤곽선 모양: 둘레의 60%만 밝고, 그 구간이 윤곽을 따라 흐른다
    clear(shape);
    eachGlyph(shape.ctx, g => {
      const ctx = shape.ctx;
      ctx.strokeStyle = `rgb(${frame.color})`;
      ctx.lineWidth = frame.line / frame.scale;
      for (const c of g.contours) {
        ctx.setLineDash([DASH[0] * c.units, DASH[1] * c.units]);
        ctx.lineDashOffset = c.offset * c.units;
        ctx.stroke(c.shape);
      }
    });
    // 윤곽선 밝기 = max(띠, 마우스 자취) × 글자가 드러난 곳
    clear(weight);
    const wc = weight.ctx;
    wc.fillStyle = gradient(wc, 1 / frame.res, 0, xs, bandA);
    wc.fillRect(0, 0, W, H);
    if (paint.live) {
      wc.globalCompositeOperation = 'lighten';
      wc.drawImage(paint.view, 0, 0, W, H);
    }
    wc.globalCompositeOperation = 'destination-in';
    wc.fillStyle = gradient(wc, 1 / frame.res, 0, xs, shownA);
    wc.fillRect(0, 0, W, H);
    wc.globalCompositeOperation = 'source-over';
    clear(lines);
    lines.ctx.drawImage(shape.c, 0, 0);
    lines.ctx.globalCompositeOperation = 'destination-in';
    lines.ctx.drawImage(weight.c, 0, 0);
    lines.ctx.globalCompositeOperation = 'source-over';
    // 블룸 원본 = 글자 면 + 윤곽선
    clear(src);
    eachGlyph(src.ctx, g => {
      src.ctx.fillStyle = gradient(src.ctx, frame.scale, g.x, xs, fillA);
      src.ctx.fill(g.fill, 'evenodd');
    });
    src.ctx.drawImage(lines.c, 0, 0);
    // 단계마다 1/2로 줄이며 이어서 흐린다(oryzo: 3+2i 픽셀)
    let prev = src.c;
    levels.forEach((lv, i) => {
      clear(lv);
      lv.ctx.filter = `blur(${LEVEL_BLUR[i]}px)`;
      lv.ctx.drawImage(prev, 0, 0, lv.c.width, lv.c.height);
      prev = lv.c;
    });
    // 결과 = 블룸(단계별 가중 합) + 윤곽선
    const o = out.ctx;
    clear(out);
    o.globalCompositeOperation = 'lighter';
    levels.forEach((lv, i) => {
      for (let w = LEVEL_WEIGHT[i]; w > 0; w -= 1) { o.globalAlpha = Math.min(1, w); o.drawImage(lv.c, 0, 0, W, H); }
    });
    o.globalAlpha = 1;
    o.drawImage(lines.c, 0, 0);
  };

  // 마우스 위치(화면 좌표)
  const pointer = (x, y) => paint.move(x, y + frame.dy);

  // pr: oryzo pulseRatio(0~1), night: 어두운 배경일 때 1, wipeX/soft: 구슬이 지나가 글자가 드러난 경계(화면 x, px)
  // 돌려주는 값: 다음 프레임도 그려야 하면 true(빛이 지나가는 중이거나 마우스 자취가 남아 있음)
  const render = (pr, night, wipeX, soft) => {
    const now = performance.now(), dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
    last = now;
    paint.step(dt);
    const pulsing = pr > 0 && pr < 1;
    if (night <= 0 || !(pulsing || paint.live)) { setOn(false); last = 0; return paint.live; }
    setOn(true);
    const flash = pulsing ? smoothstep(0, .4, pr) * smoothstep(1, .4, pr) : 0;
    const lineStart = smoothstep(0, .2, pr);
    const l = .5 + 2 * pr, lead = (1 - pr) * (1 + l) - l; // 띠 앞머리(화면 비율)
    const xs = Array.from({ length: STOPS }, (_, i) => i / (STOPS - 1));
    xs.push(...(pulsing && lead > 0 && lead < 1 ? [lead - .0005, lead] : [0, 0]));
    xs.sort((a, b) => a - b);
    const shown = xs.map(x => smoothstep(wipeX - soft, wipeX + soft, x * frame.w) * night);
    const bandX = xs.map(x => (pulsing ? band(x, pr) : 0));
    const fillA = xs.map((x, i) => ((bandX[i] * .2 + flash * .2) * shown[i]).toFixed(4));
    const bandA = bandX.map(b => (b * lineStart).toFixed(4));
    const shownA = shown.map(s => s.toFixed(4));
    // 윤곽마다 밝은 구간이 둘레를 따라 흐른다(oryzo: t = 시간·0.2/둘레 - 윤곽 위치)
    const time = now / 1000;
    for (const g of glyphs) for (const c of g.contours) c.offset = (((DASH_LEAD - time * .2 / c.perim) % 1) + 1) % 1;
    draw(xs, fillA, bandA, shownA);
    return true;
  };

  return { measure, render, pointer };
}
