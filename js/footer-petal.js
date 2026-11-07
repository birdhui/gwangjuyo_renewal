/*
 * 광주요 리뉴얼 — 푸터 꽃잎 (절차적 모델, v2)
 * 레퍼런스: 청화 파스텔 블루 꽃잎 시트 (Front / Back / Side / 3/4 / Curl / Variation / Rotation / 클로즈업).
 * 모델 파일(glb) 없이 셰이더에서 꽃잎을 만든다.
 *
 * 종이처럼 보이지 않게 한 것들
 *  - 법선을 면(dFdx)이 아니라 곡면 함수의 미분으로 구함 → 각진 면 없이 매끈하게 빛을 받는다
 *  - 곡면: 가로 오목함 + 끝이 뒤로 말림 + 가장자리가 살짝 젖혀짐 + 길이 방향 C/S자 휨 + 비틀림 + 느린 물결(공기 저항)
 *  - 재질: 벨벳처럼 넓게 감싸는 확산광(wrap), 얇은 곳(가장자리·끝)일수록 강한 투과광, 비단 같은 윤기(sheen), 부드러운 하이라이트
 *  - 결: 밑동에서 끝까지 외곽을 따라 휘어 뻗는 잎맥(굵은 맥 + 갈라지는 잔맥, 살짝 솟은 능선), 맥을 따라 흐르는 미세한 섬유결
 *  - 색: 밑동 크림(#F7F5EE) → 라일락 → 블루(#8FA0D7 ~ #B7C6E6), 구름처럼 번지는 흰 얼룩, 흰빛이 도는 얇은 가장자리
 */
import * as THREE from 'three';

export const GRID_U = 28;   // 가로(폭) 분할
export const GRID_V = 52;   // 세로(길이) 분할

/* 꽃잎 하나의 모양 파라미터: aShape = (반폭, 가장 넓은 지점, 밑동 오목함, 끝 둥글기), aForm = (오목함, 기본 곡률, 비틀림, 곡률 변화), aExtra = (비대칭, 외곽 물결, 팔랑임 각속도, 끝 말림) */
export function randomPetalShape(rand = Math.random) {
  const r = rand();
  let W, vm, pa, bt;
  if (r < 0.4) { W = 0.44 + rand() * 0.07; vm = 0.58 + rand() * 0.08; pa = 1.5 + rand() * 0.5; bt = 0.5 + rand() * 0.08; }       // 둥글고 넓은 꽃잎 (Front)
  else if (r < 0.66) { W = 0.34 + rand() * 0.07; vm = 0.6 + rand() * 0.1; pa = 1.4 + rand() * 0.5; bt = 0.6 + rand() * 0.2; }   // 달걀형
  else if (r < 0.86) { W = 0.24 + rand() * 0.07; vm = 0.56 + rand() * 0.12; pa = 1.2 + rand() * 0.4; bt = 0.75 + rand() * 0.3; } // 좁은 꽃잎
  else { W = 0.18 + rand() * 0.05; vm = 0.5 + rand() * 0.06; pa = 1.0 + rand() * 0.3; bt = 1.1 + rand() * 0.3; }               // 양끝이 뾰족한 꽃잎
  const asym = (rand() - 0.5) * 0.3;
  const ruffle = 0.012 + rand() * 0.028;
  const cup = 0.12 + rand() * 0.36;
  const curl = rand();
  const k0 = curl < 0.3 ? -0.2 + rand() * 0.6          // 거의 평평
    : curl < 0.75 ? 0.4 + rand() * 0.8                 // 부드러운 C자
    : 1.3 + rand() * 1.1;                              // 바나나처럼 말린 꽃잎 (Curl)
  const twist = rand() < 0.35 ? (rand() - 0.5) * 2.4 : (rand() - 0.5) * 0.5;
  const k1 = (rand() - 0.5) * 3.2;                     // 곡률이 길이를 따라 바뀜 → S자 (Side)
  const tipCurl = rand() < 0.6 ? 0.6 + rand() * 1.6 : rand() * 0.4;   // 끝이 뒤로 말림 (3/4 View, 클로즈업)
  return [W, vm, pa, bt, cup, k0, twist, k1, asym, ruffle, tipCurl];
}

export function createPetalGeometry(count) {
  const g = new THREE.InstancedBufferGeometry();
  const N = GRID_U * GRID_V;
  const grid = new Float32Array(N * 2);
  const position = new Float32Array(N * 3);            // 실제 위치는 버텍스 셰이더에서 계산 (바운딩용 더미)
  for (let j = 0; j < GRID_V; j++) for (let i = 0; i < GRID_U; i++) {
    const o = j * GRID_U + i;
    grid[o * 2] = i / (GRID_U - 1); grid[o * 2 + 1] = j / (GRID_V - 1);
    position[o * 3] = grid[o * 2] - 0.5; position[o * 3 + 1] = grid[o * 2 + 1] - 0.5;
  }
  g.setAttribute('position', new THREE.BufferAttribute(position, 3));
  g.setAttribute('grid', new THREE.BufferAttribute(grid, 2));
  const idx = [];
  for (let j = 0; j < GRID_V - 1; j++) for (let i = 0; i < GRID_U - 1; i++) {
    const a = j * GRID_U + i; idx.push(a, a + 1, a + GRID_U + 1, a, a + GRID_U + 1, a + GRID_U);
  }
  g.setIndex(idx);
  const mk = () => new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const aSeed = mk(), aShape = mk(), aForm = mk(), aExtra = mk();
  g.setAttribute('aSeed', aSeed); g.setAttribute('aShape', aShape); g.setAttribute('aForm', aForm); g.setAttribute('aExtra', aExtra);
  return { geometry: g, aSeed, aShape, aForm, aExtra };
}

const VERT = /* glsl */`
  attribute vec2 grid;
  attribute vec4 aSeed;    // x: 색조, y: 위상(노이즈 시드), z: 굽힘 진폭, w: 펄럭임 진폭
  attribute vec4 aShape;   // x: 반폭, y: 가장 넓은 지점, z: 밑동 오목함, w: 끝 둥글기
  attribute vec4 aForm;    // x: 오목함, y: 기본 곡률, z: 비틀림, w: 곡률 변화
  attribute vec4 aExtra;   // x: 좌우 비대칭, y: 외곽 물결, z: 팔랑임 각속도, w: 끝 말림
  uniform float u_time;
  varying vec2 vGrid; varying vec2 vFlat; varying float vW; varying vec3 vWorld; varying vec3 vNormal; varying float vDepth;
  varying vec2 vSeed; varying float vScale; varying vec4 vShapeW;

  float halfWidth(float v){
    float vm = aShape.y;                                               // 가장 넓은 지점
    float w;
    if (v < vm) { float r = v / vm; w = pow(1.0 - (1.0 - r) * (1.0 - r), aShape.z); }   // 오목하게 좁아지는 밑동
    else { float r = (v - vm) / (1.0 - vm); w = pow(max(1.0 - r * r, 0.0), aShape.w); } // 둥근(0.5) ~ 뾰족한(1+) 끝
    w *= aShape.x;
    w = max(w, 0.018 * (1.0 - smoothstep(0.0, 0.08, v)));             // 뭉툭한 밑동 끝
    w *= 1.0 + aExtra.y * sin(v * 23.0 + aSeed.y * 3.0) * v            // 잔물결 외곽
            + aExtra.y * 1.6 * sin(v * 6.5 + aSeed.y * 1.7) * v * v;   // 완만하게 굽이치는 외곽 (레퍼런스의 부드러운 굴곡)
    return w;
  }

  /* 꽃잎 곡면: (s: -1~1 가로, v: 0~1 길이) → 꽃잎 로컬 좌표 */
  vec3 petalPoint(float s, float v, float th0){
    float side = s < 0.0 ? 1.0 - aExtra.x : 1.0 + aExtra.x;
    float w = halfWidth(v) * side;
    float x = s * w;
    float cup = aForm.x;
    // 가로 단면: 오목함(밑동에서 자라남) + 가장자리가 살짝 뒤로 젖혀짐
    float z = cup * s * s * w * smoothstep(0.0, 0.45, v);
    z -= cup * 0.4 * pow(abs(s), 6.0) * w * v;
    // 느리게 흐르는 물결: 공기 저항에 얇은 막이 휘는 모습 (낮은 주파수, 끝으로 갈수록 큼)
    z += w * 0.18 * sin(s * 2.4 + v * 5.0 + aSeed.y * 2.0 - th0 * 0.9) * v * v;
    z += w * 0.07 * sin(s * 7.0 + v * 11.0 + aSeed.y) * v;
    // 흔들림과 같은 위상의 펄럭임 + 밑동→끝으로 흐르는 가장자리 물결
    z += cos(th0) * aSeed.w * x * abs(x) * 3.0;
    z += aSeed.w * s * s * w * sin(7.0 * v - th0 * 1.7) * 1.1;
    z += aSeed.w * 0.35 * w * sin(19.0 * s * w + 5.0 * v - th0 * 2.3) * smoothstep(0.55, 1.0, abs(s)) * v;
    x += aExtra.x * 0.35 * v * v;                                      // 끝이 한쪽으로 기움

    // 길이 방향: 곡률 κ(t) = k0 + k1(2t-1) + 끝 말림 을 호 길이로 적분 → 늘어나지 않는 C/S자 휨
    float k0 = aForm.y + cos(th0) * aSeed.z * 2.0 + sin(th0 * 0.6 + aSeed.y) * aSeed.z * 0.6;
    float k1 = aForm.w, k2 = aExtra.w;
    vec2 c = vec2(0.0);
    const int STEPS = 10;
    float dt = v / float(STEPS);
    for (int i = 0; i < STEPS; i++) {
      float t = (float(i) + 0.5) * dt;
      float tip = smoothstep(0.55, 1.0, t);
      float a = k0 * t + k1 * (t * t - t) + k2 * tip * tip * 0.5;
      c += vec2(cos(a), sin(a)) * dt;
    }
    float tipv = smoothstep(0.55, 1.0, v);
    float th = k0 * v + k1 * (v * v - v) + k2 * tipv * tipv * 0.5;
    vec2 n = vec2(-sin(th), cos(th));
    // 비틀림: 중심선을 축으로 단면 회전
    float ta = aForm.z * (v - 0.25);
    float xr = x * cos(ta) - z * sin(ta), zr = x * sin(ta) + z * cos(ta);
    return vec3(xr, c.x + n.x * zr - 0.45, c.y + n.y * zr);
  }

  void main(){
    float g = grid.y, s = grid.x * 2.0 - 1.0;
    float v = g * g * (3.0 - 2.0 * g);                                 // 밑동과 끝에 정점을 더 촘촘히
    float side = s < 0.0 ? 1.0 - aExtra.x : 1.0 + aExtra.x;
    float w = halfWidth(v) * side;
    vShapeW = vec4(aShape.x * side, aShape.yzw);
    vFlat = vec2(s * w, v); vW = w; vGrid = vec2(grid.x, v); vSeed = aSeed.xy;
    float th0 = u_time * max(aExtra.z, 0.5) + aSeed.y;                // 팔랑임 위상 (footer.js 의 흔들림과 같은 위상)

    vec3 p = petalPoint(s, v, th0);
    // 매끈한 법선: 곡면을 가로/세로로 아주 조금 움직여 접선을 구함
    float ds = 0.03, dv = 0.012;
    vec3 pS = petalPoint(min(s + ds, 1.0), v, th0) - petalPoint(max(s - ds, -1.0), v, th0);
    vec3 pV = petalPoint(s, min(v + dv, 1.0), th0) - petalPoint(s, max(v - dv, 0.0), th0);
    vec3 cr = cross(pS, pV);
    vec3 nrm = dot(cr, cr) > 1e-14 ? normalize(cr) : vec3(0.0, 0.0, 1.0);

    mat4 m = modelMatrix * instanceMatrix;
    vScale = length(m[0].xyz);
    vNormal = normalize(mat3(m) * nrm);
    vec4 wp = m * vec4(p, 1.0);
    vWorld = wp.xyz;
    vec4 mv = viewMatrix * wp; vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */`
  uniform vec3 u_lightPosition; uniform float u_lightStrength; uniform vec3 u_lightColor; uniform float u_focus; uniform float u_blurRange;
  uniform float u_ambient; uniform vec3 u_keyDir; uniform float u_key; uniform float u_sat;
  varying vec2 vGrid; varying vec2 vFlat; varying float vW; varying vec3 vWorld; varying vec3 vNormal; varying float vDepth;
  varying vec2 vSeed; varying float vScale; varying vec4 vShapeW;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
  float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s / 0.9375; }
  float ridge(float c, float sharp){                                   // 1 = 잎맥 중심 (너무 촘촘해지면 사라짐)
    float fw = fwidth(c);
    float l = pow(0.5 + 0.5 * cos(6.2832 * c), sharp);
    return l * (1.0 - smoothstep(0.15, 0.45, fw));
  }

  void main(){
    float v = vGrid.y, s = vGrid.x * 2.0 - 1.0;
    float seed = vSeed.y * 7.31 + vSeed.x * 3.1;
    vec2 P = vFlat;
    float blur = clamp(abs(vDepth - u_focus) / u_blurRange, 0.0, 1.0);

    // ---- 외곽: 가장자리까지의 거리(꽃잎 길이 단위) ----
    float ax = abs(P.x), W = max(abs(vShapeW.x), 1e-3), vm = vShapeW.y;
    float q = clamp(ax / W, 0.0, 1.0);
    float vTop = vm + sqrt(max(1.0 - pow(q, 1.0 / vShapeW.w), 0.0)) * (1.0 - vm);
    float vBot = (1.0 - sqrt(max(1.0 - pow(q, 1.0 / vShapeW.z), 0.0))) * vm;
    float dh = max(abs(vW) - ax, 0.0) + 0.03 * (1.0 - smoothstep(0.0, 0.1, v)) * (1.0 - abs(s));
    float dv = max(min(vTop - v, v - vBot), 0.0) + 0.002;
    float dEdge = dh * dv * inversesqrt(dh * dh + dv * dv + 1e-8);
    dEdge += (noise(P * vec2(40.0, 26.0) + seed) - 0.5) * 0.0015 * (1.0 - blur) * (1.0 - smoothstep(0.004, 0.02, fwidth(v)));   // 미세하게 고르지 않은 테두리 (작게 보일 땐 끔)
    float soft = 0.004 + fwidth(dEdge) * 1.8 + blur * blur * 0.07;
    float alpha = smoothstep(0.0, soft, dEdge);
    alpha *= smoothstep(0.0, 0.012 + fwidth(v) + blur * 0.05, v + 0.004);
    if (alpha < 0.01) discard;
    float rim = 1.0 - smoothstep(0.0, 0.06, dEdge);                   // 얇은 가장자리 띠
    float thin = max(rim, smoothstep(0.7, 1.0, v) * 0.6);             // 얇은 곳: 가장자리와 꽃잎 끝

    // ---- 잎맥: 외곽을 따라 휘어 뻗는 맥 (폭으로 정규화한 좌표 u) ----
    float u = P.x / max(abs(vW), 0.02);
    float warp = (noise(vec2(u * 2.0, v * 3.0) + seed) - 0.5) * 0.35;
    float mainV = ridge(u * 6.5 + warp, 9.0) * smoothstep(0.03, 0.12, v);
    float subV = ridge(u * 13.0 + warp * 1.6 + 0.5, 11.0) * smoothstep(0.3, 0.6, v);        // 중간부터 갈라지는 잔맥
    float fineV = ridge(u * 27.0 + warp * 2.2, 13.0) * smoothstep(0.5, 0.85, v) * 0.6;
    float vein = max(max(mainV, subV * 0.8), fineV) * (1.0 - rim * 0.7) * (1.0 - blur);
    // 섬유결: 맥 방향으로 길게 늘어진 아주 고운 결
    float fiber = noise(vec2(u * 90.0, v * 9.0) + seed) * 0.5 + noise(vec2(u * 180.0, v * 14.0) + seed * 2.0) * 0.5;
    fiber = (fiber - 0.5) * (1.0 - blur);

    // ---- 색 (sRGB) ----
    vec3 cream = vec3(0.969, 0.961, 0.933);   // #F7F5EE
    vec3 lilac = vec3(0.86, 0.80, 0.92);
    vec3 blueD = vec3(0.55, 0.615, 0.84);     // #8FA0D7 근처
    vec3 blueL = vec3(0.718, 0.776, 0.902);   // #B7C6E6
    vec3 white = vec3(0.955, 0.955, 0.975);
    float n1 = fbm(P * vec2(2.6, 2.0) + seed);
    float n2 = fbm(P * vec2(1.4, 1.1) + seed * 1.7 + 4.0);
    vec3 body = mix(blueD, blueL, smoothstep(0.36, 0.7, n1));
    body = mix(body, white, smoothstep(0.55, 0.9, n2) * (0.35 + vSeed.x * 0.25));             // 구름처럼 번지는 흰 얼룩
    body = mix(body, blueD * vec3(0.9, 0.92, 1.0), smoothstep(0.5, 0.85, 1.0 - n2) * 0.5);    // 짙은 청 얼룩
    vec3 col = mix(cream, lilac, smoothstep(0.03, 0.16, v) * (0.75 + vSeed.x * 0.5));
    col = mix(col, body, smoothstep(0.12, 0.45 + vSeed.x * 0.08, v));
    float streak = exp(-pow(P.x / (0.03 + 0.12 * v), 2.0)) * (1.0 - smoothstep(0.12, 0.65, v));
    col = mix(col, mix(white, lilac, 0.4), streak * 0.5);                                       // 가운데 밝은 줄기
    col = mix(col, white, thin * 0.55);                                                          // 흰빛 가장자리·끝
    float baseT = smoothstep(0.12, 0.42, v);
    col = mix(col, col * vec3(0.84, 0.86, 0.99), vein * 0.5 * baseT);                           // 청색 부분: 조금 짙은 맥
    col = mix(col, mix(white, lilac, 0.5), vein * 0.4 * (1.0 - baseT));                          // 밑동: 흰·라일락 맥
    col *= 1.0 + fiber * 0.045;
    col *= mix(vec3(1.0), vec3(1.03, 0.98, 1.04), vSeed.x);
    vec3 albedo = pow(col, vec3(2.2));
    albedo = max(mix(vec3(dot(albedo, vec3(0.2126, 0.7152, 0.0722))), albedo, u_sat), 0.0);

    // ---- 법선: 곡면 법선 + 살짝 솟은 잎맥 능선 ----
    vec3 N = dot(vNormal, vNormal) > 1e-12 ? normalize(vNormal) : vec3(0.0, 0.0, 1.0);
    vec3 V = normalize(cameraPosition - vWorld);
    if (dot(N, V) < 0.0) N = -N;
    vec3 Tv = dFdx(vWorld) * dFdx(P.x) + dFdy(vWorld) * dFdy(P.x);                             // 가로(폭) 방향 접선
    float veinSlope = clamp(dFdx(vein) * dFdx(P.x) + dFdy(vein) * dFdy(P.x), -1.0, 1.0);
    N = N - Tv * (veinSlope * 0.35 * (1.0 - blur) / max(length(Tv), 1e-6));
    N = normalize(N);

    // ---- 조명: oryzo 푸터 원두와 같은 방식 ----
    //  빛은 마우스 위치의 점광원 하나뿐(주변광 없음). attenuation = 1/(30d²+0.01).
    //  색 = albedo·diff·att + albedo·backLight·att·k + spec·att,  알파 = min(1, att)
    //  → 마우스에서 멀어진 꽃잎은 어둠 속으로 사라지고, 마우스가 다가오면 환하게 떠오른다.
    vec3 L = u_lightPosition - vWorld; float d = length(L); L /= d;
    vec3 H = normalize(L + V);
    float att = u_lightStrength / (30.0 * d * d + 0.01);
    float NdL = dot(N, L);
    float diff = max(0.0, NdL);
    float wrap = pow(clamp(NdL * 0.5 + 0.5, 0.0, 1.0), 1.6);                                   // 얇은 꽃잎: 빛이 조금 감싸 돈다
    float back = max(0.0, -NdL);
    float NdV = max(dot(N, V), 0.0);
    float sheen = pow(1.0 - NdV, 2.6);
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), 80.0 - 40.0 * vSeed.x);                      // oryzo: 80 - 40·brightness
    vec3 trans = pow(albedo, vec3(0.75)) * vec3(0.95, 0.97, 1.05) * (1.0 - vein * 0.35) * (0.55 + thin * 0.9);

    vec3 c = albedo * mix(diff, wrap, 0.6) * att * u_lightColor;                                 // oryzo: albedo·diff·attenuation
    c += trans * back * att * 0.35 * u_lightColor;                                               // oryzo 0.015 → 얇은 꽃잎이라 투과광을 더 살림
    c += (albedo * 0.8 + 0.2) * spec * att * 0.5;                                                // oryzo: (albedo·0.8+0.2)·spec·attenuation
    c += vec3(0.9, 0.92, 1.0) * sheen * att * 0.08 * (0.5 + thin);
    c = 1.0 - exp(-c * 1.05);                                                                    // 원두는 어두워 그대로 두지만, 파스텔 꽃잎은 커서 바로 밑에서 하얗게 타지 않게 부드럽게 눌러줌
    c = pow(c, vec3(1.0 / 2.2));
    alpha *= min(1.0, att) * (1.0 - rim * 0.18) * (1.0 - blur * 0.2);                            // oryzo: gl_FragColor.a = min(1, attenuation)
    gl_FragColor = vec4(c, alpha);
  }`;

export function createPetalMaterial(lightPosition, focus) {
  const uniforms = {
    u_time: { value: 0 },
    u_lightPosition: { value: lightPosition }, u_lightStrength: { value: 1 },
    u_lightColor: { value: new THREE.Color('#f7f3ff') },
    u_focus: { value: focus },
    u_blurRange: { value: 0.28 },
    u_ambient: { value: 0.09 },
    u_keyDir: { value: new THREE.Vector3(-0.45, 0.65, 0.6) },
    u_key: { value: 0.26 },
    u_sat: { value: 1.55 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
  });
  return { material, uniforms };
}
