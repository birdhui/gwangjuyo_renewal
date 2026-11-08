/*
 * 광주요 리뉴얼 — 푸터 꽃잎 파티클
 * oryzo.ai 푸터의 원두 파티클(Particles 클래스)을 그대로 옮기고, 원두를 청화 파스텔 블루 꽃잎(js/footer-petal.js)으로 바꿨다.
 *  - 좌상단 → 우하단 대각선 경로 + 나선(spiral) 궤도를 따라 천천히 흐른다 (PATH_* 값은 oryzo 원본 비율)
 *  - 마우스 주변 꽃잎을 부드럽게 밀어내고(MOUSE_PUSH_ACCEL) 마우스 움직임을 바람처럼 받아 함께 흩날린다
 *  - oryzo 원두와 같은 조명: 주변광 없이 마우스 위치의 점광원 하나. 감쇠 1/(30d²+0.01), 알파도 감쇠를 따른다
 *    → 마우스에서 먼 꽃잎은 어둠 속에 잠기고, 마우스를 움직이면 그 주변 꽃잎이 밀려나며 환하게 떠오른다
 *
 * 실제 꽃잎이 떨어지는 방식 (낙엽·종이 낙하 실험: Belmonte 외 1998, Andersen·Pesavento·Wang 2005)
 *  - flutter: 넓은 면이 공기를 받으며 진자처럼 좌우로 흔들리고, 흔들림 끝에서 살짝 떠올랐다가 반대로 미끄러진다
 *  - tumble: 좁고 무거운 꽃잎은 길이 방향으로 재주넘듯 돈다 (자동회전)
 *  - 얇은 꽃잎은 공기 저항으로 휘고, 가장자리에 물결이 흐른다 → footer-petal.js 버텍스 셰이더 (같은 위상)
 *
 * 후처리: 깊이별 5개 층으로 나눠 그리고, 초점 밖 층은 흐리게(피사계 심도) → 앞뒤 꽃잎은 크게 번지고 가운데 층만 또렷하다.
 * 마지막에 초점 꽃잎의 은은한 빛 번짐, 비네팅, 필름 그레인을 더한다.
 */
import * as THREE from 'three';
import { createRenderer } from './shared-gl.js';
import { createPetalGeometry, createPetalMaterial, randomPetalShape } from './footer-petal.js';

const root = document.getElementById('site-end');
if (root) init(root);

function init(root) {
  const canvas = root.querySelector('.gjf-canvas');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = matchMedia('(max-width: 767px)').matches || matchMedia('(pointer: coarse)').matches;

  /* ---------- oryzo 상수 (꽃잎용으로 일부 조정) ---------- */
  const PARTICLE_COUNT = isMobile ? 120 : 220;
  const PARTICLE_RADIUS = 0.016;
  const VELOCITY_DAMPING_RATE = 1;               // oryzo 1
  const MOUSE_PLANE_Z = -0.3;
  const MOUSE_RADIUS = 0.1;                      // oryzo .1
  const MOUSE_PUSH_ACCEL = 0.9;                  // 밀어내는 가속 (단위/초²)
  const MOUSE_CARRY = 0.45;                      // 바람(마우스 속도)에 실려 가는 비율
  const MOUSE_WIND_MAX = 1.6;                    // 마우스 속도 상한 (빠른 휘두름도 폭발하지 않게)
  const MAX_PETAL_SPEED = 0.42;                  // 꽃잎 최고 속도 (경로 흐름 0.1의 약 4배)
  const PATH_CURVE_FREQUENCY = 8;
  const PATH_CURVE_AMPLITUDE = 0.05;
  const PATH_CURVE_PHASE_SPEED = 0.25;
  const PATH_DRIFT_SPEED = 0.1;                  // oryzo .1
  const PATH_DRIFT_RATE = 2;
  const PATH_ATTRACTION_RATE = 0.5;
  const PATH_SPIRAL_FREQUENCY = 8;
  const PATH_RADIUS = 0.07;
  const CONTACT_DIST = PARTICLE_RADIUS * 2 * 0.7;
  const CONTACT_DIST_SQ = CONTACT_DIST * CONTACT_DIST;
  const PETAL_SIZE = 0.04;
  const FOCUS_DIST = 0.8;                        // 카메라 → 꽃잎 흐름 평면

  /* 깊이 층: 카메라에서 먼 층부터. blur = 1440px 화면 기준 흐림 반경(px) */
  const LAYERS = [
    { dz: [-0.5, -0.32], share: 0.27, blur: 15 },
    { dz: [-0.28, -0.13], share: 0.3, blur: 6.5 },
    { dz: [-0.035, 0.035], share: 0.25, blur: 0 },
    { dz: [0.12, 0.2], share: 0.12, blur: 13 },
    { dz: [0.25, 0.34], share: 0.06, blur: 30 },
  ];

  /* ---------- three 기본 ---------- */
  const renderer = createRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 10);
  camera.position.set(0, 0, 0.5);
  camera.lookAt(0, 0, MOUSE_PLANE_Z);

  const pathStart = new THREE.Vector3(-0.5, 0.25, MOUSE_PLANE_Z);
  const pathEnd = new THREE.Vector3(0.5, -0.25, MOUSE_PLANE_Z);
  let pathTime = 0;
  const mouse = new THREE.Vector3(10, 10, MOUSE_PLANE_Z);
  const mousePrev = mouse.clone();
  const mouseNdc = new THREE.Vector2(0.45, 0.2);
  const easedNdc = mouseNdc.clone();
  let hovering = false;
  const lightPosition = new THREE.Vector3();
  let lightStrength = 1;                         // oryzo: 세기 변화 없음, 항상 마우스 위치의 점광원

  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const vel = new Float32Array(PARTICLE_COUNT * 3);
  const pathRadius = new Float32Array(PARTICLE_COUNT);
  const pathPhase = new Float32Array(PARTICLE_COUNT);
  const pathSpiralFreqFactor = new Float32Array(PARTICLE_COUNT);
  const depthOffset = new Float32Array(PARTICLE_COUNT);
  const layerOf = new Uint8Array(PARTICLE_COUNT);
  const quat = new Float32Array(PARTICLE_COUNT * 4);      // 공기 흐름을 마주하는 기본 자세 (부드럽게 따라감)
  const tiltDir = new Float32Array(PARTICLE_COUNT * 3);   // 꽃잎마다 다른 기본 기울기
  const scale = new Float32Array(PARTICLE_COUNT);
  const seedV = new Float32Array(PARTICLE_COUNT * 4);     // 색조, 위상, 굽힘, 펄럭임
  const shape = new Float32Array(PARTICLE_COUNT * 11);    // 꽃잎 모양 (randomPetalShape)
  // 낙하 운동
  const omega = new Float32Array(PARTICLE_COUNT);         // 흔들림 각속도 (rad/s)
  const swayAmp = new Float32Array(PARTICLE_COUNT);       // 좌우 흔들림 폭 (월드)
  const rockAmp = new Float32Array(PARTICLE_COUNT);       // 흔들림 기울기 (rad)
  const tumbleRate = new Float32Array(PARTICLE_COUNT);    // 재주넘기 회전 속도 (0이면 flutter)
  const tumbleAngle = new Float32Array(PARTICLE_COUNT);
  const yaw = new Float32Array(PARTICLE_COUNT), yawRate = new Float32Array(PARTICLE_COUNT);
  const boost = new Float32Array(PARTICLE_COUNT);         // 마우스에 밀려 더 세게 흩날림 (서서히 잦아듦)

  const _v0 = new THREE.Vector3(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _pos = new THREE.Vector3(), _vel = new THREE.Vector3();
  const mouseVelS = new THREE.Vector3();               // 부드럽게 거른 마우스 속도(단위/초) = 공기 흐름
  const _push = new THREE.Vector3(), _quat = new THREE.Quaternion(), _target = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  const _mat = new THREE.Matrix4(), _segment = new THREE.Vector3(), _tangent = new THREE.Vector3();
  const _perpU = new THREE.Vector3(), _perpV = new THREE.Vector3(), _scaleV = new THREE.Vector3();
  const _worldUp = new THREE.Vector3(0, 0, 1), _worldUpAlt = new THREE.Vector3(0, 1, 0);
  const _toCam = new THREE.Vector3(0, 0, 1), _lat = new THREE.Vector3(), _n = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3();

  function updatePathBasis() {
    _segment.subVectors(pathEnd, pathStart);
    const len = _segment.length() || 1e-6;
    _tangent.copy(_segment).divideScalar(len);
    _perpU.crossVectors(_tangent, _worldUp);
    if (_perpU.lengthSq() < 1e-6) _perpU.crossVectors(_tangent, _worldUpAlt);
    _perpU.normalize();
    _perpV.crossVectors(_tangent, _perpU).normalize();
    return len;
  }
  function evalPathTarget(t, len, radius, phase, freq, dz) {
    const a = PATH_CURVE_FREQUENCY * t * len + pathTime * PATH_CURVE_PHASE_SPEED;
    _v0.copy(pathStart).addScaledVector(_segment, t);
    _v0.addScaledVector(_perpU, PATH_CURVE_AMPLITUDE * Math.sin(a));
    _v0.addScaledVector(_perpV, PATH_CURVE_AMPLITUDE * Math.cos(a));
    const s = PATH_SPIRAL_FREQUENCY * freq * t * len + phase;
    _v0.addScaledVector(_perpU, radius * Math.cos(s));
    _v0.addScaledVector(_perpV, radius * Math.sin(s) * (dz === 0 ? 1 : 0.4));
    _v0.z += dz;
  }
  /* 공기 흐름(-속도)을 마주하되 카메라 쪽으로 기운 기본 자세: 꽃잎 법선(z)이 흐름을 받고, 폭(x)은 좌우 흔들림 방향 */
  function baseOrientation(i) {
    _vel.fromArray(vel, i * 3);
    const sp = _vel.length();
    _v0.copy(sp > 1e-4 ? _vel.divideScalar(sp) : _tangent);
    _lat.set(-_v0.y, _v0.x, 0); if (_lat.lengthSq() < 1e-6) _lat.set(1, 0, 0); _lat.normalize();
    _n.copy(_v0).multiplyScalar(-0.5).addScaledVector(_toCam, 0.85).add(_v1.fromArray(tiltDir, i * 3)).normalize();
    _x.copy(_lat).addScaledVector(_n, -_lat.dot(_n)).normalize();
    _y.crossVectors(_n, _x);
    _mat.makeBasis(_x, _y, _n);
    return _target.setFromRotationMatrix(_mat);
  }

  /* 화면 비율에 맞춰 경로를 화면 대각선(좌상단 → 우하단)에 맞춤 */
  let viewW = 1, viewH = 1, sizeK = 1;
  function fitPath() {
    const dist = camera.position.z - MOUSE_PLANE_Z;
    viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    viewW = viewH * camera.aspect;
    const portrait = camera.aspect < 1;
    pathStart.set(-viewW * 0.62, viewH * (portrait ? 0.44 : 0.38), MOUSE_PLANE_Z);
    pathEnd.set(viewW * 0.62, -viewH * (portrait ? 0.44 : 0.38), MOUSE_PLANE_Z);
    sizeK = Math.min(1, Math.max(0.45, viewW / 0.98 * 1.6));
  }

  /* ---------- 꽃잎: 깊이 층마다 InstancedMesh 하나 ---------- */
  const { material, uniforms } = createPetalMaterial(lightPosition, FOCUS_DIST);
  uniforms.u_blurRange.value = 0.9;            // 층 흐림이 피사계 심도를 맡고, 셰이더는 가장자리만 살짝 부드럽게
  uniforms.u_sat.value = 1.3;                  // 실제 꽃잎처럼 흰빛이 도는 청화 파스텔
  const counts = LAYERS.map((l) => Math.round(l.share * PARTICLE_COUNT));
  counts[2] += PARTICLE_COUNT - counts.reduce((a, b) => a + b, 0);
  const layers = LAYERS.map((l, li) => {
    const g = createPetalGeometry(counts[li]);
    const mesh = new THREE.InstancedMesh(g.geometry, material, counts[li]);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { ...l, ...g, mesh, idx: [], depth: new Float32Array(counts[li]), rt: null };
  });

  function seed() {
    const len = updatePathBasis();
    let c = 0;
    layers.forEach((L, li) => {
      for (let k = 0; k < counts[li]; k++, c++) {
        L.idx.push(c);
        layerOf[c] = li;
        depthOffset[c] = L.dz[0] + Math.random() * (L.dz[1] - L.dz[0]);
        pathRadius[c] = (li === 2 ? 2 : 3) * Math.random() * PATH_RADIUS;
        pathPhase[c] = Math.PI * 2 * Math.random();
        pathSpiralFreqFactor[c] = 2 * Math.random();
        evalPathTarget(Math.random(), len, pathRadius[c], pathPhase[c], pathSpiralFreqFactor[c], depthOffset[c]);
        _v0.toArray(pos, c * 3);
        const sp = PATH_DRIFT_SPEED * (1 + depthOffset[c] * 0.6);
        vel[c * 3] = _tangent.x * sp; vel[c * 3 + 1] = _tangent.y * sp; vel[c * 3 + 2] = _tangent.z * sp;
        _v1.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).multiplyScalar(0.55).toArray(tiltDir, c * 3);
        baseOrientation(c).toArray(quat, c * 4);
        scale[c] = PETAL_SIZE * (0.55 + Math.random() ** 1.6 * 0.9);
        const sh = randomPetalShape();
        // 낙하 방식: 넓은 꽃잎은 대부분 flutter, 좁은 꽃잎은 tumble 이 잦다
        const narrow = sh[0] < 0.3;
        const tumble = Math.random() < (narrow ? 0.45 : 0.14);
        omega[c] = 1.0 + Math.random() * 1.3;                 // 천천히, 유연하게
        swayAmp[c] = scale[c] * (0.25 + Math.random() * 0.45);
        rockAmp[c] = tumble ? 0.25 : 0.4 + Math.random() * 0.45;
        tumbleRate[c] = tumble ? (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 2.2) : 0;
        tumbleAngle[c] = Math.random() * Math.PI * 2;
        yaw[c] = Math.random() * Math.PI * 2;
        yawRate[c] = (Math.random() - 0.5) * 0.5;
        shape.set(sh, c * 11);
        seedV[c * 4] = Math.random();
        seedV[c * 4 + 1] = Math.random() * Math.PI * 2;
        seedV[c * 4 + 2] = 0.1 + Math.random() * 0.14;        // 굽힘: 꽃잎이 흔들릴 때 몸 전체가 휘도록
        seedV[c * 4 + 3] = 0.07 + Math.random() * 0.12;
      }
    });
  }

  /* ---------- 후처리: 층 흐림 + 합성 ---------- */
  const quadGeo = new THREE.BufferGeometry();
  quadGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadVS = 'varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const blurMat = new THREE.ShaderMaterial({
    uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
    vertexShader: quadVS,
    fragmentShader: /* glsl */`
      uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
      void main(){                                   // 미리 곱한 알파 상태 그대로 가우시안 (가장자리 번짐이 어둡게 끼지 않음)
        vec4 c = texture2D(tSrc, vUv) * 0.1335;
        for (int i = 1; i <= 8; i++) {
          float f = float(i);
          float w = exp(-f * f / 18.0) * 0.1335;
          c += (texture2D(tSrc, vUv + uDir * f) + texture2D(tSrc, vUv - uDir * f)) * w;
        }
        gl_FragColor = c;
      }`,
    depthTest: false, depthWrite: false, blending: THREE.NoBlending,
  });
  const compMat = new THREE.ShaderMaterial({
    uniforms: {
      t0: { value: null }, t1: { value: null }, t2: { value: null }, t3: { value: null }, t4: { value: null }, tGlow: { value: null },
      uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uLight: { value: new THREE.Vector2(0.7, 0.6) }, uLightK: { value: 0.5 },
    },
    vertexShader: quadVS,
    fragmentShader: /* glsl */`
      uniform sampler2D t0, t1, t2, t3, t4, tGlow; uniform float uTime, uLightK; uniform vec2 uRes, uLight; varying vec2 vUv;
      vec4 over(vec4 top, vec4 under){ return top + under * (1.0 - top.a); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec4 c = texture2D(t0, vUv);
        c = over(texture2D(t1, vUv), c);
        c = over(texture2D(t2, vUv), c);
        c = over(texture2D(t3, vUv), c);
        c = over(texture2D(t4, vUv), c);
        vec4 g = texture2D(tGlow, vUv);
        c.rgb += g.rgb * 0.08;                                       // 빛 받은 꽃잎 주변의 아주 옅은 번짐
        float n = hash(vUv * uRes + fract(uTime * 7.13) * 91.7) - 0.5;
        c.rgb += n * 0.012 * c.a;                                    // oryzo 블루노이즈 디더 대용
        gl_FragColor = c;
      }`,
    depthTest: false, depthWrite: false, blending: THREE.NoBlending, transparent: false,
  });
  const quad = new THREE.Mesh(quadGeo, blurMat);
  quad.frustumCulled = false;
  const postScene = new THREE.Scene(); postScene.add(quad);
  let rtW = 1, rtH = 1, blurScale = 1;
  const rtOpts = { type: THREE.HalfFloatType, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  let tmpRT = null, glowRT = null, glowTmp = null;
  function makeTargets() {
    const sz = renderer.getDrawingBufferSize(new THREE.Vector2());
    rtW = Math.max(1, sz.x); rtH = Math.max(1, sz.y);
    const hw = Math.max(1, Math.round(rtW / 2)), hh = Math.max(1, Math.round(rtH / 2));
    layers.forEach((L) => {
      L.rt?.dispose(); L.rtB?.dispose();
      L.rt = L.blur > 0 ? new THREE.WebGLRenderTarget(hw, hh, rtOpts) : new THREE.WebGLRenderTarget(rtW, rtH, { ...rtOpts, samples: 4 });
      L.rtB = L.blur > 0 ? new THREE.WebGLRenderTarget(hw, hh, rtOpts) : null;
    });
    const qw = Math.max(1, Math.round(rtW / 4)), qh = Math.max(1, Math.round(rtH / 4));
    glowRT?.dispose(); glowTmp?.dispose(); tmpRT?.dispose();
    glowRT = new THREE.WebGLRenderTarget(qw, qh, rtOpts); glowTmp = new THREE.WebGLRenderTarget(qw, qh, rtOpts);
    blurScale = (rtW / renderer.getPixelRatio()) / 1440;
  }
  function blurInto(src, tmp, dst, radiusPx, w, h) {         // radiusPx: CSS px
    const step = Math.max(0.5, radiusPx * renderer.getPixelRatio() * (w / rtW) / 8);
    quad.material = blurMat;
    blurMat.uniforms.tSrc.value = src.texture; blurMat.uniforms.uDir.value.set(step / w, 0);
    renderer.setRenderTarget(tmp); renderer.render(postScene, postCam);
    blurMat.uniforms.tSrc.value = tmp.texture; blurMat.uniforms.uDir.value.set(0, step / h);
    renderer.setRenderTarget(dst); renderer.render(postScene, postCam);
  }
  function renderFrame() {
    layers.forEach((L) => { L.mesh.visible = false; });
    layers.forEach((L) => {
      L.mesh.visible = true;
      renderer.setRenderTarget(L.rt); renderer.clear(true, true, false);
      renderer.render(scene, camera);
      L.mesh.visible = false;
      if (L.blur > 0) {
        const w = L.rt.width, h = L.rt.height;
        blurInto(L.rt, L.rtB, L.rt, L.blur * blurScale * 0.55, w, h);
        blurInto(L.rt, L.rtB, L.rt, L.blur * blurScale * 0.85, w, h);   // 두 번 → 둥글고 부드러운 번짐
      }
    });
    const focus = layers[2];
    quad.material = blurMat;
    blurMat.uniforms.tSrc.value = focus.rt.texture; blurMat.uniforms.uDir.value.set(1.6 / glowRT.width, 0);
    renderer.setRenderTarget(glowTmp); renderer.render(postScene, postCam);
    blurMat.uniforms.tSrc.value = glowTmp.texture; blurMat.uniforms.uDir.value.set(0, 1.6 / glowRT.height);
    renderer.setRenderTarget(glowRT); renderer.render(postScene, postCam);
    const u = compMat.uniforms;
    u.t0.value = layers[0].rt.texture; u.t1.value = layers[1].rt.texture; u.t2.value = layers[2].rt.texture;
    u.t3.value = layers[3].rt.texture; u.t4.value = layers[4].rt.texture; u.tGlow.value = glowRT.texture;
    u.uRes.value.set(rtW, rtH);
    u.uLight.value.set(easedNdc.x * 0.5 + 0.5, easedNdc.y * 0.5 + 0.5);
    u.uLightK.value = Math.min(1, (lightStrength - 0.3) / 0.9);
    u.uTime.value = uniforms.u_time.value;
    quad.material = compMat;
    renderer.setRenderTarget(null); renderer.clear(true, true, false);
    renderer.render(postScene, postCam);
  }

  /* ---------- 시뮬레이션: oryzo Particles.update ---------- */
  function step(dt) {
    _v0.set(easedNdc.x, easedNdc.y, 0.5).unproject(camera).sub(camera.position).normalize();
    _v0.multiplyScalar((MOUSE_PLANE_Z - camera.position.z) / _v0.z);
    mouse.copy(camera.position).add(_v0);
    // 마우스 이동을 '바람'으로: 프레임마다 튀는 이동량 대신, 걸러진 속도(최대값 제한)로 주변 공기를 민다
    _push.copy(mouse).sub(mousePrev).divideScalar(Math.max(dt, 1e-3));
    if (_push.length() > MOUSE_WIND_MAX) _push.setLength(MOUSE_WIND_MAX);
    mouseVelS.lerp(_push, 1 - Math.exp(-dt * 6));
    mousePrev.copy(mouse);
    const windSpeed = mouseVelS.length();
    lightPosition.copy(mouse); lightPosition.z += 0.1;
    pathTime += dt;

    const len = updatePathBasis();
    const segLenSq = _segment.lengthSq() || 1e-12;
    const attract = 1 - Math.exp(-dt * PATH_ATTRACTION_RATE);
    const drift = 1 - Math.exp(-dt * PATH_DRIFT_RATE);
    const damp = Math.exp(-dt * VELOCITY_DAMPING_RATE);
    const reach = MOUSE_RADIUS * 1.7 + PARTICLE_RADIUS;            // 넓고 완만한 영향 범위
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const o = i * 3;
      _pos.fromArray(pos, o); _vel.fromArray(vel, o);
      const t = _segment.dot(_v1.copy(_pos).sub(pathStart)) / segLenSq;
      evalPathTarget(t, len, pathRadius[i], pathPhase[i], pathSpiralFreqFactor[i], depthOffset[i]);
      _v1.subVectors(_pos, _v0);
      _vel.addScaledVector(_v1, -attract);
      const sp = PATH_DRIFT_SPEED * (1 + depthOffset[i] * 0.6);
      const along = _vel.dot(_tangent);
      _vel.addScaledVector(_tangent, (sp - along) * drift);
      _vel.multiplyScalar(damp);
      _pos.addScaledVector(_vel, dt);
      const tt = _segment.dot(_v1.copy(_pos).sub(pathStart)) / segLenSq;
      if (tt > 1) { evalPathTarget(0, len, pathRadius[i], pathPhase[i], pathSpiralFreqFactor[i], depthOffset[i]); _pos.copy(_v0); }
      else if (tt < 0) { evalPathTarget(1, len, pathRadius[i], pathPhase[i], pathSpiralFreqFactor[i], depthOffset[i]); _pos.copy(_v0); }
      _v0.subVectors(_pos, mouse); _v0.z *= 0.35;                 // 층(깊이)이 달라도 마우스 반경에 들면 밀려남
      const dist = _v0.length();
      let bTarget = 0;
      if (dist < reach && dist > 0.001) {                         // oryzo: 호버 여부와 상관없이 항상
        const f = 1 - dist / reach, w = f * f * (3 - 2 * f);      // 가장자리에서 0 → 중심으로 부드럽게
        _v0.divideScalar(dist);
        _vel.addScaledVector(_v0, MOUSE_PUSH_ACCEL * w * dt);     // 밀어냄은 '가속'으로 (한 프레임에 튀지 않게)
        _v1.copy(mouseVelS).multiplyScalar(MOUSE_CARRY);          // 바람에 실려 같은 방향으로 천천히 끌려감
        _vel.lerp(_v1, 1 - Math.exp(-dt * 2.2 * w));
        bTarget = w * Math.min(1, windSpeed / 0.9);
      }
      const vs = _vel.length();
      if (vs > MAX_PETAL_SPEED) _vel.multiplyScalar(MAX_PETAL_SPEED / vs);
      // 흩날림 세기: 바람을 받으면 서서히 올라가고, 바람이 없으면 천천히 잦아듦
      boost[i] += (bTarget - boost[i]) * (1 - Math.exp(-dt * (bTarget > boost[i] ? 2.4 : 0.7)));
      // 재주넘기 / 흔들림 각도 진행 (바람을 받으면 조금 더 빨리)
      tumbleAngle[i] += (tumbleRate[i] + Math.sign(tumbleRate[i] || 1) * boost[i] * 2.4) * dt;
      if (tumbleRate[i] === 0) {                                  // 원래 재주넘지 않는 꽃잎은 바람이 잦아들면 제자세로 천천히 돌아옴
        let a = tumbleAngle[i] % (Math.PI * 2); if (a > Math.PI) a -= Math.PI * 2; else if (a < -Math.PI) a += Math.PI * 2;
        tumbleAngle[i] = a * Math.exp(-dt * 1.2 * (1 - boost[i]));
      }
      yaw[i] += (yawRate[i] + boost[i] * 0.45) * dt;
      _pos.toArray(pos, o); _vel.toArray(vel, o);
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {           // 서로 겹치지 않게 (oryzo contact)
      const a = i * 3; _pos.fromArray(pos, a);
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (layerOf[j] !== layerOf[i]) continue;
        const b = j * 3;
        const dx = pos[b] - _pos.x, dy = pos[b + 1] - _pos.y, dz = pos[b + 2] - _pos.z;
        const dsq = dx * dx + dy * dy + dz * dz;
        if (dsq >= CONTACT_DIST_SQ || dsq < 1e-12) continue;
        const dd = Math.sqrt(dsq), k = (CONTACT_DIST - dd) * 0.5 / dd;
        _pos.x -= dx * k; _pos.y -= dy * k; _pos.z -= dz * k;
        pos[b] += dx * k; pos[b + 1] += dy * k; pos[b + 2] += dz * k;
        _pos.toArray(pos, a);
      }
    }
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const q = i * 4;
      baseOrientation(i);
      _quat.fromArray(quat, q).slerp(_target, 1 - Math.exp(-dt * 4.5)).toArray(quat, q);   // 원두(28)보다 느리게: 꽃잎은 바람 방향으로 천천히 돌아섬
    }
  }

  /* 매 프레임: 낙하 운동(흔들림·재주넘기)을 자세와 위치에 얹고, 층마다 먼 것부터 정렬해 기록 */
  function writeInstances() {
    const time = uniforms.u_time.value;
    layers.forEach((L) => {
      const n = L.idx.length;
      for (let k = 0; k < n; k++) {
        const i = L.idx[k];
        const dx = pos[i * 3] - camera.position.x, dy = pos[i * 3 + 1] - camera.position.y, dz = pos[i * 3 + 2] - camera.position.z;
        L.depth[k] = dx * dx + dy * dy + dz * dz;
      }
      const ord = [...L.idx.keys()].sort((a, b) => L.depth[b] - L.depth[a]);
      const as = L.aSeed.array, ash = L.aShape.array, af = L.aForm.array, ae = L.aExtra.array;
      for (let n2 = 0; n2 < n; n2++) {
        const i = L.idx[ord[n2]];
        const th = time * omega[i] + seedV[i * 4 + 1];
        const amp = 1 + boost[i] * 0.8;
        // 기본 자세 (공기 흐름을 마주함)
        _quat.fromArray(quat, i * 4);
        _x.set(1, 0, 0).applyQuaternion(_quat);           // 좌우 흔들림 방향 (꽃잎 폭)
        _n.set(0, 0, 1).applyQuaternion(_quat);           // 꽃잎 법선
        _y.crossVectors(_n, _x);                          // 흔들림 회전축
        // flutter: 진자처럼 좌우로 흔들리며 기울고, 흔들림 끝에서 살짝 떠오른다
        _pos.fromArray(pos, i * 3);
        _pos.addScaledVector(_x, swayAmp[i] * amp * Math.sin(th));
        _pos.y -= swayAmp[i] * 0.3 * amp * Math.cos(2 * th);
        _q2.setFromAxisAngle(_y, rockAmp[i] * Math.min(1.4, amp) * Math.sin(th));
        // tumble: 폭 방향 축으로 재주넘기
        _q2.multiply(_target.setFromAxisAngle(_x, tumbleAngle[i]));
        _q2.multiply(_quat);
        _q2.multiply(_target.setFromAxisAngle(_v2.set(0, 0, 1), yaw[i]));   // 꽃잎 자체의 천천한 회전
        _scaleV.setScalar(scale[i] * sizeK);
        _mat.compose(_pos, _q2, _scaleV);
        L.mesh.setMatrixAt(n2, _mat);
        const o = n2 * 4, s10 = i * 11;
        as[o] = seedV[i * 4]; as[o + 1] = seedV[i * 4 + 1]; as[o + 2] = seedV[i * 4 + 2] * amp; as[o + 3] = seedV[i * 4 + 3] * amp;
        ash[o] = shape[s10]; ash[o + 1] = shape[s10 + 1]; ash[o + 2] = shape[s10 + 2]; ash[o + 3] = shape[s10 + 3];
        af[o] = shape[s10 + 4]; af[o + 1] = shape[s10 + 5]; af[o + 2] = shape[s10 + 6]; af[o + 3] = shape[s10 + 7];
        ae[o] = shape[s10 + 8]; ae[o + 1] = shape[s10 + 9]; ae[o + 2] = omega[i]; ae[o + 3] = shape[s10 + 10];
      }
      L.mesh.instanceMatrix.needsUpdate = true;
      L.aSeed.needsUpdate = L.aShape.needsUpdate = L.aForm.needsUpdate = L.aExtra.needsUpdate = true;
    });
  }

  /* ---------- 입력 ---------- */
  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    mouseNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    root.style.setProperty('--gjf-mx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
    root.style.setProperty('--gjf-my', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    hovering = true;
  }
  root.addEventListener('pointermove', setPointer, { passive: true });
  root.addEventListener('pointerdown', setPointer, { passive: true });
  root.addEventListener('pointerleave', () => { hovering = false; });

  /* ---------- 크기 / 루프 ---------- */
  function resize() {
    const w = root.clientWidth, h = root.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    fitPath();
    makeTargets();
  }
  let visible = false, raf = 0, last = 0, seeded = false;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    easedNdc.lerp(mouseNdc, 1 - Math.exp(-dt * 6));
    uniforms.u_lightStrength.value = lightStrength;
    uniforms.u_time.value += dt;
    step(dt);
    writeInstances();
    renderFrame();
    if (visible && !reduceMotion.matches) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (!seeded) return;
    if (reduceMotion.matches) { for (let i = 0; i < 90; i++) step(1 / 30); writeInstances(); renderFrame(); return; }
    if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { rootMargin: '200px 0px' }).observe(root);
  new ResizeObserver(() => { resize(); if (seeded && (!visible || reduceMotion.matches)) { writeInstances(); renderFrame(); } }).observe(root);
  reduceMotion.addEventListener('change', start);

  /* ---------- 시작 ---------- */
  resize();
  seed(); seeded = true;
  for (let i = 0; i < 30; i++) step(1 / 60);
  start();

  /* ---------- 푸터 UI: 글자 넘김, 주소 복사, 소식 받기 ---------- */
  // 글자 넘김은 메뉴와 같은 것(script.js window.kjyRollText, style.css .nav-char)
  root.querySelectorAll('.gjf-flip').forEach((el) => window.kjyRollText?.(el, el.closest('a, button') || el));
  const copy = root.querySelector('.gjf-copy');
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); } catch (e) { /* 클립보드 거부 시 무시 */ }
    copy.classList.remove('is-copied'); void copy.offsetWidth; copy.classList.add('is-copied');
    setTimeout(() => copy.classList.remove('is-copied'), 50);
  });
  const form = root.querySelector('.gjf-form');
  const input = root.querySelector('#gjf-email');
  const msg = root.querySelector('.gjf-msg');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
    input.setAttribute('aria-invalid', String(!ok));
    msg.className = `gjf-msg ${ok ? 'is-success' : 'is-error'}`;
    msg.textContent = ok ? '소식 받기 신청이 접수되었어요. (시안 화면이라 실제로 발송되지 않아요)' : '이메일 주소를 다시 확인해 주세요.';
    if (ok) input.value = '';
  });
}
