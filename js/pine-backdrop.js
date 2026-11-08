/* 소나무·달 공간(히어로 배경)을 바람에 흔들리게 그리는 캔버스.
   히어로(hero-scene.js 안의 배경 셰이더)와 같은 세 장(바탕·벽 그림자·가지)과 같은 식을 쓴다:
   · 하나의 느린 바람(w) — 큰 너울 위에 작은 돌풍
   · 벽의 소나무 그림자: 바람을 따라 밀리고 낮은 주파수로 일렁인다(hero-bg-pine-shade.png: R = 그림자 비율, G = 벽)
   · 가지: 줄기가 화면을 벗어나는 점을 축으로 흔들리고, 끝으로 갈수록 더 휘며 솔잎이 떨린다
   hero-scene.js는 묶음 빌드라 이 파일을 불러 쓰지 못한다 — 셰이더를 바꿀 때는 두 곳을 같이 고친다. */
const VS = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }';
const FS = `precision highp float;
varying vec2 vUv; uniform sampler2D plate; uniform sampler2D shade; uniform sampler2D branch; uniform float t;
const vec2 IMG = vec2(2000., 1125.);
const vec4 BR = vec4(700., 0., 1300., 700.);
const vec2 ANCHOR = vec2(2010., 90.);
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x-s*v.y, s*v.x+c*v.y); }
void main(){
  float w = sin(t*.42)*.6 + sin(t*.97+1.7)*.28 + sin(t*1.83+.4)*.12;
  vec2 px = vUv*IMG;
  vec2 flutter = vec2(n(px/260.+vec2(t*.18,0.)), n(px/260.+vec2(5.2,t*.15))) - .5;
  vec2 sOff = vec2(w*9., w*3.5) + flutter*5.;
  vec4 sh = texture2D(shade, (px - sOff)/IMG);
  float ratio = texture2D(shade, vUv).g > .01 ? sh.r : 1.;
  float wall = texture2D(shade, vUv).g;
  vec3 col = texture2D(plate, vUv).rgb * mix(1., ratio, wall);
  vec2 d = px - ANCHOR;
  float reach = clamp(length(d)/1250., 0., 1.);
  float ang = -w*.0055*(.35+.65*reach) - .0012*sin(t*2.3+reach*5.);
  vec2 src = ANCHOR + rot(d, -ang);
  src += (vec2(n(src/90.+t*.6), n(src/90.-t*.5+3.)) - .5) * 1.4 * reach;
  vec2 buv = (src - BR.xy)/BR.zw;
  if (buv.x > 0. && buv.x < 1. && buv.y > 0. && buv.y < 1.) {
    vec4 b = texture2D(branch, buv);
    col = mix(col, b.rgb, b.a);
  }
  gl_FragColor = vec4(col, 1.);
}`;
const IMAGES = ['img/hero-bg-pine-plate.jpg', 'img/hero-bg-pine-shade.png', 'img/hero-bg-pine-branch.webp'];

// canvas를 받아 { ready(), draw(cssW, cssH, seconds) }를 돌려준다. 세 장이 다 올라오기 전에는 그리지 않는다(ready() = false).
export function createPineBackdrop(canvas) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return { ready: () => false, draw() {} };
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 't');
  ['plate', 'shade', 'branch'].forEach((name, i) => gl.uniform1i(gl.getUniformLocation(prog, name), i));
  let loaded = 0, w = 0, h = 0;
  IMAGES.forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      loaded += 1;
    };
    img.src = src;
  });
  return {
    ready: () => loaded === IMAGES.length,
    // 히어로와 같은 해상도 규칙(기기 배율 최대 1.25)
    draw(cssW, cssH, seconds) {
      if (loaded < IMAGES.length) return;
      const k = Math.min(devicePixelRatio || 1, 1.25), W = Math.round(cssW * k), H = Math.round(cssH * k);
      if (W !== w || H !== h) { w = canvas.width = W; h = canvas.height = H; gl.viewport(0, 0, W, H); }
      gl.uniform1f(uT, seconds);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
