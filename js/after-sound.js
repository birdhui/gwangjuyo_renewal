import * as THREE from 'three';
import { createRenderer } from './shared-gl.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTitleLight } from './beauty-light.js?v=20261108-r64';

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const range = (v, from, to) => clamp((v - from) / (to - from));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const set = (element, name, value) => element.style.setProperty(name, value);
const CUP_GALLERY_FADE = 1.1; // 갤러리가 화면을 덮은 뒤 잔이 사라지는 스크롤 길이(화면 높이 배수)

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
    const h = gallery.offsetTop - people.offsetTop + window.innerHeight * (window.innerWidth >= 1100 ? 1 + CUP_GALLERY_FADE : 1); // 갤러리 위에서 사라질 때까지 화면에 고정
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
  const litChars = []; let titleLight = null;
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
      renderer = createRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
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
      if (fitW !== pageWidth && fitTitle) { fitTitle(); fitW = pageWidth; titleLight.measure(); }
      const p = sectionProgress(beauty, shownScroll);
      const introFade = smooth(range(p, .035, .14));
      const rollT = smooth(range(p, .12, .65));
      // 구슬은 스크롤을 한 번 더 부드럽게 따라가며 굴러간다(휠 한 칸씩 끊기지 않게)
      rollS = jump || reduced || rollS < 0 ? rollT : mix(rollS, rollT, 1 - Math.exp(-4.5 * dt));
      if (Math.abs(rollS - rollT) < .0002) rollS = rollT;
      const roll = rollS;
      window.kjyScrollCue?.gate('beauty', smooth(range(roll, .02, .18))); // '스크롤하여 내려가기'는 구슬이 구르기 시작하면서 나타난다
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
      // oryzo 'sustainability'처럼: 구슬이 거의 다 지나가 글자가 거의 다 보이면(스크롤 위치가 아니라) 시간으로 2초 동안
      // 넓은 빛의 띠가 오른쪽에서 왼쪽으로 번지고, 글자 윤곽을 따라 빛이 흐른다(beauty-light.js).
      // 다시 위로 올라가 글자가 가려지면 처음 상태로 돌아가 다음에 또 번진다.
      // wipe = 구슬 오른쪽 끝이 제목의 몇 %에 있는지(구슬이 왼쪽으로 지나갈수록 작아짐 → 0이면 글자가 다 보임)
      pulseWin = wipe <= 14;
      if (wipe >= 45) pulse = 0;
      else if (pulse > 0 || pulseWin) pulse = reduced ? 1 : Math.min(1, pulse + dt * .5);
      const night = 1 - smooth(range(day, .2, .6));
      if (titleLight.render(pulse, night, titleRect.left + titleRect.width * wipe / 100, titleRect.width * .025)) requestTick();
      set(title, '--title-color', day > .55 ? '#211914' : '#ffedd7');
      beauty.classList.toggle('is-light', day > .55);
      // 머리글(로고·메뉴) 색은 다음 섹션의 위 경계가 머리글에 닿는 순간 바뀐다(oryzo처럼 섹션이 맞물릴 때)
      { const nav = document.querySelector('.site-nav'), nr = nav && nav.getBoundingClientRect(), hdr = nr && nr.height ? nr.top + nr.height / 2 : 32;
        document.body.classList.toggle('beauty-light', day > .55 && people.getBoundingClientRect().top > hdr); }
      // 제목 위·아래 작은 글: 빛이 번지기 시작하면 함께 서서히 나타난다
      { const a = reduced ? (pulse > 0 ? 1 : 0) : smooth(range(pulse, .05, .45));
        set(beauty, '--bt-cap', (a * introFade).toFixed(3)); }
    } else {
      document.body.classList.remove('beauty-light');
      window.kjyScrollCue?.gate('beauty', shownScroll < by ? 0 : 1);
    }

    const cupZone = nearPeople || nearReviews || (shownScroll > py && shownScroll < gy + viewport * (CUP_GALLERY_FADE + .2));
    if (cupZone) {
      if (!cupLoading && !reduced) loadCup();
      // oryzo(People all around the world love Oryzo)와 같은 타이밍:
      // 섹션 위 경계가 화면 아래에서 25% 올라온 순간부터 제목이 왼쪽 글자부터 차례로 나타나고,
      // 경계가 화면 위쪽 약 22% 지점에 왔을 때 제목이 다 보인다. 오른쪽 소개 글은 제목 뒤를 이어 섹션이 화면을 다 채울 때까지 나타난다.
      // 섹션이 화면을 채운 뒤에는(oryzo처럼) 제목·소개 글이 섹션과 함께 그대로 위로 스크롤되어 사라지고, 리뷰 목록이 바로 이어진다.
      const enter = (shownScroll - (py - viewport)) / viewport; // 0: 경계가 화면 아래 끝, 1: 섹션이 화면을 가득 채움
      const titleN = (peopleLines[0]?.length || 0) + (peopleLines[1]?.length || 0);
      const introN = Math.max(1, peopleLines.slice(2).reduce((n, l) => n + l.length, 0));
      let ti = 0, ii = 0;
      peopleLines.forEach((chars, k) => {
        chars.forEach(c => {
          let a;
          if (k < 2) { a = clamp((enter - (.25 + .28 * ti / Math.max(1, titleN - 1))) / .25); ti++; }
          else { a = clamp((enter - (.5 + .3 * ii / Math.max(1, introN - 1))) / .2); ii++; }
          c.style.opacity = a.toFixed(3);
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
          : 1 - smooth(range(shownScroll, gy + viewport * .05, gy + viewport * CUP_GALLERY_FADE)); // 갤러리가 화면을 덮어 잔이 가려진 뒤, 갤러리를 넘기며 서서히 사라진다
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
    if (!cupZone) peopleLive = false;

    let reviewMoving = false;
    if (nearReviews) {
      // oryzo TestimoniesTableItem과 같은 방식:
      // i = 행 가운데가 화면 아래 끝에서 몇 화면 올라왔는지(0: 화면 아래 끝, .5: 화면 가운데)
      // r = fit(i, .15, .45) → 내려갈수록 커지기만 하고(지나간 뒤에도 그대로 큰 상태), 다시 올려야만 작아진다.
      // 행 전체는 화면 위쪽으로 올라가며(i .55 → .85) 흐려진다. 사진 크기 변화는 transform이라 위아래 행에 영향이 없다.
      reviewCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const i = (viewport - (rect.top + rect.height / 2)) / viewport;
        const goal = smooth(range(i, .15, .45));
        const prev = card._rf == null ? goal : card._rf;
        const f = jump || reduced ? goal : mix(prev, goal, 1 - Math.exp(-8 * dt));
        card._rf = f;
        if (Math.abs(f - goal) > .001) reviewMoving = true;
        const rowFade = 1 - .8 * range(i, .55, .85);
        set(card, '--review-row-opacity', rowFade.toFixed(3));
        set(card, '--review-opacity', (.2 + .8 * f).toFixed(3));
        set(card, '--review-blur', '0px');
        set(card, '--review-y', '0px');
        set(card, '--review-image-opacity', (.2 + .8 * f).toFixed(3));
        set(card, '--review-image-gray', (1 - f).toFixed(3));
        set(card, '--review-image-scale', (.8 + .2 * f).toFixed(4));
      });
    }

    if (nearGallery) {
      const progress = sectionProgress(gallery, shownScroll);
      set(galleryTrack, '--gallery-x', `${(-galleryTravel * progress).toFixed(1)}px`);
    }

    if (swayLive || reviewMoving || peopleLive || Math.abs(shownScroll - targetScroll) > .2 || (rollS >= 0 && Math.abs(rollS - smooth(range(sectionProgress(beauty, shownScroll), .12, .65))) > .0002)) requestTick();
  }

  function requestTick() { if (!raf) raf = requestAnimationFrame(draw); }
  window.addEventListener('pointermove', () => { if (cupVisual.classList.contains('is-visible')) requestTick(); }, { passive: true });
  window.addEventListener('scroll', requestTick, { passive: true });

  window.addEventListener('resize', () => {
    viewport = window.innerHeight; pageWidth = window.innerWidth;
    measureGallery(); resize3d(); requestTick();
  }, { passive: true });
  // 마우스(호버): oryzo처럼 마우스가 지나간 자취를 따라 글자 윤곽선에 빛이 흐른다(beauty-light.js)
  beauty.addEventListener('pointermove', event => { titleLight.pointer(event.clientX, event.clientY); requestTick(); }, { passive: true });
  // 빛을 글자 하나하나에 주기 위해, 보이는 제목(lit)을 글자 단위로 나눈다(배치는 그대로: 일반 inline span)
  const litSpan = title.querySelector('.beauty-title-lit');
  title.setAttribute('aria-label', litSpan.textContent);
  litSpan.setAttribute('aria-hidden', 'true');
  {
    const text = litSpan.textContent; litSpan.textContent = '';
    for (const ch of text) { const sp = document.createElement('span'); sp.className = 'bt-ch'; sp.textContent = ch; litSpan.appendChild(sp); if (ch.trim()) litChars.push(sp); }
  }
  titleLight = createTitleLight(title, litChars);
  const beautySticky = beauty.querySelector('.beauty-sticky');
  if (!beautySticky.querySelector('.beauty-eyebrow')) {
    const top = document.createElement('p'); top.className = 'beauty-eyebrow'; top.textContent = '100% 수공업 공정 제작';
    const bot = document.createElement('p'); bot.className = 'beauty-caption'; bot.innerHTML = '정성껏 빚어낸 한 잔이<br>누군가의 식탁 위에 놓이고,<br>매일의 작은 순간을 함께합니다.';
    beautySticky.append(top, bot);
  }
  // 제목 글자 크기: 화면 너비의 62%를 차지하도록. 그 뒤 '100% 수공업 공정 제작'을 제목 글자 왼쪽 끝·바로 위에 맞춘다
  const titleText = title.querySelector('.beauty-title-muted');
  fitTitle = () => {
    if (!reduced) {
      title.style.fontSize = '100px';
      const w = titleText.getBoundingClientRect().width || title.scrollWidth || 1;
      title.style.fontSize = `${(100 * pageWidth * .62 / w).toFixed(2)}px`;
    }
    const box = beautySticky.getBoundingClientRect(), text = titleText.getBoundingClientRect();
    beautySticky.style.setProperty('--bt-x', `${(text.left - box.left).toFixed(1)}px`);
    beautySticky.style.setProperty('--bt-y', `${(text.top - box.top).toFixed(1)}px`);
  };
  fitTitle();
  window.addEventListener('resize', () => { fitW = 0; }, { passive: true });
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { fitW = 0; requestTick(); });
  measureGallery();
  requestTick();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
