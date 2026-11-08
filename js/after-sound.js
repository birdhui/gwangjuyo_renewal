import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const range = (v, from, to) => clamp((v - from) / (to - from));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const set = (element, name, value) => element.style.setProperty(name, value);

function init() {
  const beauty = document.getElementById('beauty');
  const people = document.getElementById('people');
  const reviews = document.getElementById('reviews');
  const gallery = document.getElementById('gallery');
  if (!beauty || !people || !reviews || !gallery) return;

  const marble = beauty.querySelector('.beauty-marble');
  const title = beauty.querySelector('.beauty-title');
  const cupVisual = people.querySelector('.people-cup-visual');
  const cupPoster = cupVisual.querySelector('.people-cup-poster');
  const canvas = cupVisual.querySelector('canvas');
  const heading = people.querySelector('.people-heading');
  const intro = people.querySelector('.people-intro');
  const reviewCards = [...reviews.querySelectorAll('.review-card')];
  const galleryTrack = gallery.querySelector('.editorial-grid');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The cup must stay above both the product introduction and the review list.
  // Keeping it inside the sticky section would clip it at that section's end.
  // 잔은 섹션 위 경계부터 갤러리 앞까지 이어지는 레일 안에서 position:sticky로 붙어 있다.
  // (예전처럼 고정 위치를 스크롤마다 스크립트로 옮기면 휠 한 칸마다 올라왔다 멈추는 끊김이 생겼다 → 브라우저 스크롤에 그대로 맡김)
  const cupRail = document.createElement('div');
  cupRail.className = 'kjy-cup-rail';
  document.body.appendChild(cupRail);
  cupRail.appendChild(cupVisual);
  let railKey = '';
  const placeRail = () => {
    const top = people.getBoundingClientRect().top + window.scrollY - (cupRail.offsetParent ? cupRail.offsetParent.getBoundingClientRect().top + window.scrollY : 0);
    const h = gallery.offsetTop - people.offsetTop + window.innerHeight;
    const key = `${Math.round(top)}|${Math.round(h)}`;
    if (key === railKey) return;
    railKey = key;
    cupRail.style.top = `${Math.round(top)}px`;
    cupRail.style.height = `${Math.round(h)}px`;
  };

  let targetScroll = window.scrollY;
  let shownScroll = targetScroll;
  let viewport = window.innerHeight;
  let pageWidth = window.innerWidth;
  let rollS = -1;
  let fitW = 0, fitTitle = null, spinT = 0, peopleLive = false;
  let pulse = 0, pulseWin = false; // oryzo sustainability 'pulseRatio': 글자가 거의 다 드러나면 시간(2초)으로 빛이 한 번에 번진다
  const litChars = []; let charGeo = null, charFont = 60, lightTitle = () => {}, ptrX = -9999, ptrY = -9999;
  // 사람들 섹션 글을 줄·글자 단위로 나눈다(제목 2줄 + 소개 2줄)
  const peopleLines = [];
  for (const el of [heading.querySelector('h2'), intro]) {
    const nodes = [...el.childNodes]; el.setAttribute('aria-label', el.textContent); let line = [];
    el.textContent = '';
    const flush = () => { if (line.length) peopleLines.push(line); line = []; };
    for (const nd of nodes) {
      if (nd.nodeName === 'BR') { flush(); el.appendChild(document.createElement('br')); continue; }
      for (const ch of nd.textContent) {
        if (ch === '\n') continue;
        const sp = document.createElement('span'); sp.className = 'people-ch'; sp.setAttribute('aria-hidden', 'true'); sp.textContent = ch;
        el.appendChild(sp); line.push(sp);
      }
    }
    flush();
  }
  let lastTime = performance.now();
  let raf = 0, swayLive = false;
  let pointerGlow = 0;
  let pointerTarget = 0;
  let cup = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let cupReady = false;
  let cupLoading = false;
  let lastRenderYaw = NaN;
  let lastRenderTilt = NaN;
  let galleryTravel = 0;

  function measureGallery() {
    if (reduced) return;
    galleryTravel = Math.max(0, galleryTrack.scrollWidth - pageWidth);
    set(gallery, '--gallery-height', `${Math.ceil(viewport + galleryTravel)}px`);
  }

  function sectionProgress(section, y) {
    return clamp((y - section.offsetTop) / Math.max(1, section.offsetHeight - viewport));
  }

  function resize3d() {
    if (!renderer || !camera) return;
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.max(1, Math.min(Math.min(3, Math.max(2, (devicePixelRatio || 1) * 1.5)), 4096 / Math.max(w, h, 1))));   // 시리즈 잔과 같은 슈퍼샘플링
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 화면 전체 캨버스에서 잔 높이가 rewind와 같은 크기(화면 높이의 약 40%)가 되게, 세로 화면에서는 너비도 넘치지 않게
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visH = Math.max(3.55 / .34, 3.3 / ((window.innerWidth < 768 ? .5 : .33) * camera.aspect)); // 잔 크기: 화면 높이의 약 34%
    const dist = visH / (2 * tan);
    camera.position.set(0, .35, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    lastRenderYaw = NaN;
  }

  function loadCup() {
    if (cupLoading || reduced || !window.WebGLRenderingContext) return;
    cupLoading = true;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.42;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
      camera.position.set(0, 2.1, 7.4);
      camera.lookAt(0, 0, 0);
      scene.add(new THREE.HemisphereLight(0xfff5e7, 0x55463c, 2.3));
      const key = new THREE.DirectionalLight(0xffefd9, 3.15);
      key.position.set(-3, 5, 5); scene.add(key);
      const rim = new THREE.DirectionalLight(0xa6bcd1, 1.1);
      rim.position.set(4, 3, -3); scene.add(rim);
      resize3d();
      new GLTFLoader().load('assets/models/sori-60th-doraji.glb', gltf => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const scale = 3.55 / Math.max(size.y, .001);
        model.position.copy(center.multiplyScalar(-1));
        cup = new THREE.Group();
        const scaled = new THREE.Group();
        scaled.scale.setScalar(scale);
        scaled.add(model);
        cup.add(scaled);
        scene.add(cup);
        cupReady = true;
        requestTick();
      }, undefined, error => {
        console.warn('소리잔 3D 모델을 읽지 못해 이미지로 표시합니다.', error);
        renderer?.dispose(); renderer = null;
      });
    } catch (error) {
      console.warn('3D 렌더러를 사용할 수 없어 소리잔 이미지로 표시합니다.', error);
      renderer?.dispose(); renderer = null;
    }
  }

  function draw(now) {
    raf = 0; swayLive = false;
    const dt = Math.min(.05, Math.max(.001, (now - lastTime) / 1000));
    lastTime = now;
    targetScroll = window.scrollY;
    const jump = Math.abs(targetScroll - shownScroll) > viewport * 3;
    shownScroll = reduced || jump ? targetScroll : mix(shownScroll, targetScroll, 1 - Math.exp(-8 * dt));
    pointerGlow = mix(pointerGlow, pointerTarget, 1 - Math.exp(-7 * dt));

    const by = beauty.offsetTop;
    const py = people.offsetTop;
    const ry = reviews.offsetTop;
    const gy = gallery.offsetTop;
    const nearBeauty = shownScroll > by - viewport && shownScroll < py + viewport;
    const nearPeople = shownScroll > py - viewport && shownScroll < ry + viewport;
    const nearReviews = shownScroll > ry - viewport && shownScroll < gy + viewport;
    const nearGallery = shownScroll > gy - viewport && shownScroll < gy + gallery.offsetHeight;

    if (nearBeauty) {
      if (!cupLoading && !reduced && shownScroll > py - viewport * 2.5) loadCup(); // 다음 섹션 경계가 보이기 전에 미리 준비
      if (fitW !== pageWidth && fitTitle) { fitTitle(); fitW = pageWidth; charGeo = null; }
      const p = sectionProgress(beauty, shownScroll);
      const introFade = smooth(range(p, .035, .14));
      const rollT = smooth(range(p, .12, .65));
      // 구슬은 스크롤을 한 번 더 부드럽게 따라가며 굴러간다(휠 한 칸씩 끊기지 않게)
      rollS = jump || reduced || rollS < 0 ? rollT : mix(rollS, rollT, 1 - Math.exp(-4.5 * dt));
      if (Math.abs(rollS - rollT) < .0002) rollS = rollT;
      const roll = rollS;
      const day = smooth(range(p, .66, .8));
      const outroFade = 1; // 아이보리 화면은 끝까지 그대로 두고, 섹션이 위로 밀려 올라가며 다음 섹션과 경계가 보이게 넘어간다
      // The rotated square's bounding box changes every frame; use its layout width.
      const width = marble.offsetWidth || pageWidth * .35;
      const distance = pageWidth + width * 1.25;
      const x = mix(pageWidth - width * .08, -width * 1.17, roll);
      const angle = -(distance * roll / Math.max(width / 2, 1)) * 180 / Math.PI;
      set(beauty, '--day-opacity', day.toFixed(4));
      set(beauty, '--night-opacity', (1 - day).toFixed(4));
      set(beauty, '--outro-opacity', '0');
      set(beauty, '--marble-opacity', (introFade * (1 - smooth(range(p, .62, .72)))).toFixed(4));
      set(beauty, '--marble-x', `${x.toFixed(1)}px`);
      set(beauty, '--marble-rotation', `${angle.toFixed(2)}deg`);
      set(beauty, '--glow-x', `${clamp((x + width / 2) / pageWidth) * 100}%`);
      set(title, '--title-opacity', (introFade * outroFade).toFixed(4));
      // The lit letters follow the marble's actual trailing edge, in both scroll directions.
      const titleRect = title.getBoundingClientRect();
      const wipe = clamp((x + width * 1.04 - titleRect.left) / Math.max(titleRect.width, 1), 0, 1.06) * 100; // 구슬 오른쪽 끝(지나간 뒤)부터 보인다
      set(title, '--wipe', `${wipe.toFixed(2)}%`);
      set(title, '--hover-light', pointerGlow.toFixed(3));
      // 오른쪽에서 왼쪽으로 은은하게 지나가는 빛(등장할 때), 낮으로 바뀌는 동안 윤곽만 남은 유리 같은 글자
      // 빛은 구슬이 지나간 바로 뒤를 따라간다(구슬보다 앞에서는 아무것도 보이지 않음)
      const sheen = clamp((125 - (wipe + 9)) / 150);
      set(title, '--sheen-x', `${(sheen * 100).toFixed(2)}%`);
      set(title, '--sheen-op', '0');
      set(title, '--glass', '0'); // 윤곽만 남는(엑스레이 같은) 단계는 쓰지 않는다
      // oryzo 'sustainability'처럼: 구슬이 지나가 글자가 드러난 뒤, 빛이 오른쪽에서 왼쪽으로 은은하게 들어와 글자가 차례로 빛난다.
      // 빛이 지나간 글자는 밝은 아이보리 + 은은한 번짐(블룸)으로 남고, 마우스 근처 글자는 윤곽에 빛이 맺히며 더 빛난다.
      // 빛 번짐 시작: 구슬이 거의 다 지나가 글자가 거의 다 보이면(스크롤 위치가 아니라) 시간으로 2초 동안 오른쪽→왼쪽으로 한 번에 번진다.
      // 다시 위로 올라가 글자가 가려지면 처음 상태로 돌아가 다음에 또 번진다.
      // wipe = 구슬 오른쪽 끝이 제목의 몇 %에 있는지(구슬이 왼쪽으로 지나갈수록 작아짐 → 0이면 글자가 다 보임)
      pulseWin = wipe <= 14;
      if (wipe >= 45) pulse = 0;
      else if (pulse > 0 || pulseWin) pulse = reduced ? 1 : Math.min(1, pulse + dt * .5);
      lightTitle(pulse, day);
      if (pulse > 0 && pulse < 1) requestTick();
      set(title, '--title-color', day > .55 ? '#211914' : '#ffedd7');
      beauty.classList.toggle('is-light', day > .55);
      // 머리글(로고·메뉴) 색은 다음 섹션의 위 경계가 머리글에 닿는 순간 바뀐다(oryzo처럼 섹션이 맞물릴 때)
      { const nav = document.querySelector('.site-nav'), nr = nav && nav.getBoundingClientRect(), hdr = nr && nr.height ? nr.top + nr.height / 2 : 32;
        document.body.classList.toggle('beauty-light', day > .55 && people.getBoundingClientRect().top > hdr); }
      // 제목 위·아래 작은 글: 빛이 번지기 시작하면 함께 서서히 나타난다
      { const tr = title.getBoundingClientRect(), fs = parseFloat(title.style.fontSize) || charFont, pad = fs * .6;
        const sr = beautySticky.getBoundingClientRect();
        set(beauty, '--bt-top', `${(tr.top - sr.top + pad).toFixed(1)}px`);
        set(beauty, '--bt-bot', `${(tr.bottom - sr.top - pad).toFixed(1)}px`);
        const a = reduced ? (pulse > 0 ? 1 : 0) : smooth(range(pulse, .05, .45));
        set(beauty, '--bt-cap', (a * introFade).toFixed(3)); }
    } else {
      document.body.classList.remove('beauty-light');
    }

    if (nearPeople || nearReviews) {
      if (!cupLoading && !reduced) loadCup();
      const p = sectionProgress(people, shownScroll);
      // oryzo(People all around the world love Oryzo)와 같은 타이밍:
      // 섹션 위 경계가 화면 아래에서 25% 올라온 순간부터 제목이 왼쪽 글자부터 차례로 나타나고,
      // 경계가 화면 위쪽 약 22% 지점에 왔을 때 제목이 다 보인다. 오른쪽 소개 글은 제목 뒤를 이어 섹션이 화면을 다 채울 때까지 나타난다.
      const enter = (shownScroll - (py - viewport)) / viewport; // 0: 경계가 화면 아래 끝, 1: 섹션이 화면을 가득 채움
      const lift = Math.min(0, .3 - p) * 1.15 * viewport;
      set(heading, '--people-title-y', `${lift.toFixed(1)}px`);
      set(intro, '--people-intro-y', `${lift.toFixed(1)}px`);
      const nL = peopleLines.length;
      const titleN = (peopleLines[0]?.length || 0) + (peopleLines[1]?.length || 0);
      const introN = Math.max(1, peopleLines.slice(2).reduce((n, l) => n + l.length, 0));
      let ti = 0, ii = 0;
      peopleLines.forEach((chars, k) => {
        const n = Math.max(1, chars.length - 1);
        chars.forEach((c, ci) => {
          const g = ci / n;
          let a;
          if (k < 2) { a = clamp((enter - (.25 + .28 * ti / Math.max(1, titleN - 1))) / .25); ti++; }
          else { a = clamp((enter - (.5 + .3 * ii / Math.max(1, introN - 1))) / .2); ii++; }
          const b = smooth(range(p, .66 + (nL - 1 - k) * .055 + (1 - g) * .05, .66 + (nL - 1 - k) * .055 + (1 - g) * .05 + .09));
          const o = a * (1 - b);
          c.style.opacity = o.toFixed(3);
          c.style.filter = b <= .001 ? 'none' : `blur(${(b * .25).toFixed(3)}em)`;
          c.style.transform = b <= .001 ? 'none' : `translate3d(0,${(-b * .2).toFixed(3)}em,0)`;
        });
      });
      // 잔: 섹션 경계가 보일 때부터 이미 섹션 화면의 정가운데에 놓여 섹션과 함께 올라오고,
      // 섹션이 화면을 가득 채운 뒤에는 화면 가운데에 머문 채 스크롤만큼만 회전한다(자동 회전 없음).
      placeRail(); // 잔은 레일 안 sticky: 섹션과 함께 올라오다 화면을 채우면 그 자리에 고정(스크립트로 위치를 옮기지 않음)
      const entering = enter > 0 ? 1 : 0;
      const leaving = pageWidth < 768
        ? 1 - smooth(range(shownScroll, ry - viewport * .85, ry - viewport * .10))
        : pageWidth < 1100
          ? 1 - smooth(range(shownScroll, ry - viewport * 1.35, ry - viewport * .85))
          : 1 - smooth(range(shownScroll, gy - viewport * .73, gy - viewport * .18));
      const opacity = entering * leaving;
      cupVisual.classList.toggle('is-visible', opacity > .002);
      cupVisual.style.opacity = opacity.toFixed(4);
      const q = Math.max(0, shownScroll - py) / viewport;
      const yaw = q * Math.PI * .9;
      const tilt = q * Math.PI * .45;
      if (cupReady && renderer && opacity > .002) {
        // 마우스에 따라 살짝 흔들림(공용 값, beauty 구간 제외)
        const SW = window.__kjySway, gate = window.__kjySwayGate ? window.__kjySwayGate() : 1;
        const swx = SW ? SW.x * gate : 0, swy = SW ? SW.y * gate : 0;
        const yawS = yaw + swx * .2, tiltS = tilt + swy * .09;
        swayLive = SW ? Math.abs(SW.tx * gate - swx) + Math.abs(SW.ty * gate - swy) > .002 : false;
        if (yawS !== lastRenderYaw || tiltS !== lastRenderTilt) {
          cup.rotation.set(tiltS, yawS, .22 * Math.sin(q * 1.3) - swx * .035);
          renderer.render(scene, camera);
          lastRenderYaw = yawS; lastRenderTilt = tiltS;
        }
        set(cupVisual, '--poster-opacity', '0');
        set(cupVisual, '--canvas-opacity', '1');
      } else {
        set(cupPoster, '--poster-rotate', '0deg');
      }
    } else {
      cupVisual.classList.remove('is-visible');
      cupVisual.style.opacity = '0';
    }
    if (!(nearPeople || nearReviews)) peopleLive = false;

    let reviewMoving = false;
    if (nearReviews) {
      reviewCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const rowCenter = rect.top + rect.height / 2;
        const distance = Math.abs(rowCenter - viewport * .5);
        const t = clamp(1 - distance / (viewport * .62));
        const goal = t * t * t * (t * (t * 6 - 15) + 10);
        const prev = card._rf == null ? goal : card._rf;
        const f = jump || reduced ? goal : mix(prev, goal, 1 - Math.exp(-5 * dt));
        card._rf = f;
        if (Math.abs(f - goal) > .001) reviewMoving = true;
        set(card, '--review-opacity', (.22 + .78 * f).toFixed(3));
        set(card, '--review-blur', '0px');
        set(card, '--review-y', `${((1 - f) * 14).toFixed(1)}px`);
        set(card, '--review-image-opacity', (.25 + .75 * f).toFixed(3));
        set(card, '--review-image-gray', (1 - f).toFixed(3));
        set(card, '--review-image-scale', (.78 + .22 * f).toFixed(4));
      });
    }

    if (nearGallery) {
      const progress = sectionProgress(gallery, shownScroll);
      set(galleryTrack, '--gallery-x', `${(-galleryTravel * progress).toFixed(1)}px`);
    }

    if (swayLive || reviewMoving || peopleLive || Math.abs(shownScroll - targetScroll) > .2 || (rollS >= 0 && Math.abs(rollS - smooth(range(sectionProgress(beauty, shownScroll), .12, .65))) > .0002) || Math.abs(pointerGlow - pointerTarget) > .01) requestTick();
  }

  function requestTick() { if (!raf) raf = requestAnimationFrame(draw); }
  window.addEventListener('pointermove', () => { if (cupVisual.classList.contains('is-visible')) requestTick(); }, { passive: true });
  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', () => {
    viewport = window.innerHeight; pageWidth = window.innerWidth;
    measureGallery(); resize3d(); requestTick();
  }, { passive: true });
  beauty.addEventListener('pointermove', event => {
    const r = title.getBoundingClientRect();
    const dx = (event.clientX - (r.left + r.width / 2)) / Math.max(r.width / 2, 1);
    const dy = (event.clientY - (r.top + r.height / 2)) / Math.max(r.height * 1.5, 1);
    pointerTarget = smooth(1 - clamp(Math.hypot(dx, dy) / 1.5));
    ptrX = event.clientX - r.left; ptrY = event.clientY - r.top;
    set(title, '--mx', `${(event.clientX - r.left).toFixed(1)}px`);
    set(title, '--my', `${(event.clientY - r.top).toFixed(1)}px`);
    requestTick();
  }, { passive: true });
  beauty.addEventListener('pointerleave', () => { pointerTarget = 0; requestTick(); });
  // 빛 윤곽(마우스)과 지나가는 빛(등장) 층을 제목 위에 덧붙인다
  {
    const text = title.querySelector('.beauty-title-lit').textContent;
    for (const cls of ['beauty-title-sheen', 'beauty-title-edge', 'beauty-title-ripple']) {
      if (title.querySelector('.' + cls)) continue;
      const sp = document.createElement('span'); sp.className = cls; sp.setAttribute('aria-hidden', 'true'); sp.textContent = text; title.appendChild(sp);
    }
  }
  // 잔물결 층을 아주 살짝 일렁이게 하는 필터(물 위 빛처럼)
  if (!document.getElementById('kjy-ripple-f')) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.setAttribute('aria-hidden', 'true'); svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="kjy-ripple-f" x="-10%" y="-30%" width="120%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.07" numOctaves="1" seed="3" result="n"><animate attributeName="baseFrequency" dur="3.2s" values="0.012 0.07;0.016 0.085;0.012 0.07" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>';
    document.body.appendChild(svg);
  }
  // 빛을 글자 하나하나에 주기 위해, 보이는 제목(lit)을 글자 단위로 나눈다(배치는 그대로: 일반 inline span)
  const litSpan = title.querySelector('.beauty-title-lit');
  title.setAttribute('aria-label', litSpan.textContent);
  litSpan.setAttribute('aria-hidden', 'true');
  {
    const text = litSpan.textContent; litSpan.textContent = '';
    for (const ch of text) { const sp = document.createElement('span'); sp.className = 'bt-ch'; sp.textContent = ch; litSpan.appendChild(sp); if (ch.trim()) litChars.push(sp); }
  }
  const beautySticky = beauty.querySelector('.beauty-sticky');
  if (!beautySticky.querySelector('.beauty-eyebrow')) {
    const top = document.createElement('p'); top.className = 'beauty-eyebrow'; top.textContent = '100% 수공업 공정 제작';
    const bot = document.createElement('p'); bot.className = 'beauty-caption'; bot.innerHTML = '정성껏 빚어낸 한 잔이<br>누군가의 식탁 위에 놓이고,<br>매일의 작은 순간을 함께합니다.';
    beautySticky.append(top, bot);
  }
  const measureChars = () => {
    const tr = title.getBoundingClientRect();
    charGeo = litChars.map(c => { const r = c.getBoundingClientRect(); return { cx: r.left + r.width / 2 - tr.left, cy: r.top + r.height / 2 - tr.top, f: 0 }; });
    const xs = charGeo.map(g => g.cx), lo = Math.min(...xs), hi = Math.max(...xs);
    charGeo.forEach(g => { g.f = (g.cx - lo) / Math.max(1, hi - lo); });
    charFont = parseFloat(getComputedStyle(title).fontSize) || 60;
  };
  lightTitle = (pr, day) => {
    if (!charGeo || charGeo.length !== litChars.length) measureChars();
    // oryzo SustainabilityText와 같은 식: l = .5 + 2·pr, d = (1-pr)(1+l) - x - l.
    // -l < d < 0 구간이 빛의 띠(왼쪽 앞머리에서 가장 밝고 오른쪽으로 꼬리가 옅어짐). pr 0→1에 띠가 오른쪽 밖에서 왼쪽 밖으로 지나간다.
    const l = .5 + pr * 2, A = (1 - pr) * (1 + l), lead = A - l;
    const flash = smooth(range(pr, 0, .4)) * smooth(range(pr, 1, .4)); // 번지는 동안 전체가 잠깐 은은하게 밝아짐
    const night = 1 - smooth(range(day, .2, .6));
    const R = charFont * 1.9;
    litChars.forEach((c, i) => {
      const g = charGeo[i], d = A - g.f - l;
      const band = d > -l && d < 0 ? smooth((d + l) / l) : 0;      // 빛의 띠(앞머리 쪽이 밝게)
      const lit = pr > 0 ? smooth(clamp((g.f - lead) / .16)) : 0;  // 앞머리가 지나간 글자는 밝은 채로 남는다
      const near = pointerGlow * smooth(1 - clamp(Math.hypot(ptrX - g.cx, ptrY - g.cy) / R)); // 마우스 근처
      const L = clamp(lit * .8 + band * .9 + flash * .22 + near * .55, 0, 1.4) * night;
      const base = 1 - (1 - (.74 + .26 * clamp(lit + band))) * night;
      c.style.setProperty('--b', base.toFixed(3));
      c.style.setProperty('--L', L.toFixed(3));
      c.style.setProperty('--n', (near * night).toFixed(3));
    });
    // 잔물결(윤슬) 층: 빛의 띠 자리에서만 글자 위로 아주 잔잔한 물결 빛이 지나간다
    set(title, '--rl', (lead * 100).toFixed(2));
    set(title, '--ra', (A * 100).toFixed(2));
    set(title, '--rp', (pr > 0 && pr < 1 ? smooth(range(pr, 0, .08)) * smooth(range(pr, 1, .75)) * night : 0).toFixed(3));
  };
  // 제목 글자 크기: 화면 너비의 70%를 차지하도록
  fitTitle = () => {
    if (reduced) return;
    title.style.fontSize = '100px';
    const w = title.querySelector('.beauty-title-muted').getBoundingClientRect().width || title.scrollWidth || 1;
    title.style.fontSize = `${(100 * pageWidth * .62 / w).toFixed(2)}px`; // 70% → 62%로 조금 줄임
  };
  fitTitle();
  window.addEventListener('resize', () => { fitW = 0; }, { passive: true });
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { fitW = 0; requestTick(); });
  measureGallery();
  requestTick();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
