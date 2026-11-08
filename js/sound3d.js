/* 광주요 — 갤러리 마지막 사진 → 3D 공간 → 소리잔 손잡이 속 구슬
   1) 갤러리 마지막 칸이 3D 공간을 보여 주는 창이 되고, 그 창이 화면 전체로 넓어진다.
   2) 송·달·탁자 공간(hero-bg-pine) 위에 백자 도라지문 소리잔(같은 3D 모델)이 놓여 있다.
   3) 제목·부제가 흐림에서 또렷하게 나타났다가 사라진다.
   4) 카메라가 잔의 손잡이(아랫부분)로 천천히 다가간다.
   5) 손잡이가 투명해지며 속에 든 구슬이 보이고, 마우스를 움직이기만 해도(클릭 없이) 구슬이 굴러 맑은 소리를 낸다.
   6) 서서히 암전. (예전 구슬 섹션 화면은 숨기고 그 스크롤 길이를 그대로 쓴다) */
import*as THREE from"three";
import{GLTFLoader}from"three/addons/loaders/GLTFLoader.js";
import{RoomEnvironment}from"three/addons/environments/RoomEnvironment.js";
import{createPineBackdrop}from"./pine-backdrop.js?v=20261108-r74";

const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(!reduced&&!window.__s3d){window.__s3d={};start()}

function start(){
const S=window.__s3d;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),fit=(v,a,b)=>clamp((v-a)/(b-a)),sm=t=>t*t*(3-2*t);
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,expoOut=t=>t>=1?1:1-Math.pow(2,-10*t),lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- 화면 요소 ---------- */
const css=`
.s3d{position:fixed;inset:0;z-index:35;visibility:hidden;pointer-events:none;overflow:hidden;background:#141110;contain:strict}
.s3d.is-live{visibility:visible}
.s3d-bg{position:absolute;inset:0;overflow:hidden}
.s3d-photo,.s3d-table{position:absolute;left:0;top:0;background-size:100% 100%;background-repeat:no-repeat;will-change:transform,filter,opacity;transform-origin:0 0}
.s3d-photo{background-image:url(img/hero-bg-pine.webp)}
.s3d-pine{display:block;width:100%;height:100%;visibility:hidden}.s3d-pine.is-on{visibility:visible}
.s3d-table{background-image:url(img/sound-table-top.jpg);opacity:0}
.s3d-shade{position:absolute;inset:0;background:radial-gradient(ellipse 70% 62% at 50% 56%,rgba(0,0,0,0) 0%,rgba(0,0,0,.55) 100%);opacity:0}
.s3d-gl{position:absolute;inset:0;width:100%;height:100%;display:block}
.s3d-copy,.s3d-copy2{position:absolute;left:0;right:0;top:calc(12svh + 20px);text-align:center;color:#f7f1e6;padding:0 16px;text-shadow:0 2px 24px rgba(30,20,10,.38)}
.s3d-eye{margin:0 0 .7em;font-weight:500;font-size:18px;letter-spacing:-.01em;line-height:1.3;word-break:keep-all}
.s3d-title{margin:0;font-weight:700;font-size:calc(68 * var(--s3d-su));line-height:1.12;letter-spacing:-.04em;word-break:keep-all}
.s3d-sub{margin:.75em 0 0;font-weight:400;font-size:16px;letter-spacing:-.02em;line-height:var(--hero-body-lh);word-break:keep-all}
.s3d{--s3d-su:min(calc(100vw * .9375 / 1800),calc(100svh * 1.25 / 1024))}.s3d-box{position:absolute;left:50%;top:44svh;transform:translateX(-50%);width:calc(244.3 * var(--s3d-su));height:calc(49.6 * var(--s3d-su));display:flex;align-items:center;justify-content:center;padding:0;border:0;background:linear-gradient(90deg,#f7f1e6 50%,transparent 0) 0 0/6px 1px repeat-x,linear-gradient(90deg,#f7f1e6 50%,transparent 0) 0 100%/6px 1px repeat-x,linear-gradient(0deg,#f7f1e6 50%,transparent 0) 0 0/1px 6px repeat-y,linear-gradient(0deg,#f7f1e6 50%,transparent 0) 100% 0/1px 6px repeat-y,rgba(20,16,12,.08);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#f7f1e6;font-size:14px;font-weight:400;line-height:1.1;text-align:center;letter-spacing:-.01em;opacity:0;box-sizing:border-box;white-space:nowrap}
.s3d-veil{position:absolute;inset:0;pointer-events:none;opacity:0;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);-webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 30%,rgba(0,0,0,.5) 42%,transparent 56%);mask-image:linear-gradient(to bottom,#000 0%,#000 30%,rgba(0,0,0,.5) 42%,transparent 56%)}
@media (max-width:767px){.s3d-title{font-size:clamp(30px,8.4vw,48px)}.s3d-eye,.s3d-sub{font-size:16px}.s3d-box{width:calc(14px * 15.27);height:calc(14px * 3.1)}}
.s3d-ch{display:inline-block;opacity:0;will-change:opacity,filter,transform;white-space:pre}
/* 구슬 안내(oryzo grip-instruction과 같은 구성): 양끝이 흐려지는 넓은 U자 점선 + 그 위를 오가는 구슬 + 아래에서 같이 움직이는 손 */
.s3d-hint{position:absolute;left:50%;bottom:calc(7svh + env(safe-area-inset-bottom,0px));width:clamp(220px,20vw,360px);transform:translateX(-50%);color:#efe9df;font-size:clamp(14px,1.05vw,20px);opacity:0;pointer-events:none}
.s3d-wheel{display:block;width:100%;height:auto;overflow:visible;-webkit-mask-image:linear-gradient(90deg,transparent,#000 50%,transparent);mask-image:linear-gradient(90deg,transparent,#000 50%,transparent)}
.s3d-wheel path{fill:none;stroke:currentColor;stroke-width:.25;stroke-dasharray:1 1;opacity:.6;animation:s3dDash 1s linear infinite}
.s3d-wheel circle{fill:currentColor}
.s3d-hand{display:block;width:2em;height:2.35em;margin:1.9em auto 0;opacity:.5}
@keyframes s3dDash{from{stroke-dashoffset:2}to{stroke-dashoffset:0}}
.s3d-sound{position:absolute;right:max(20px,4vw);bottom:calc(7svh + env(safe-area-inset-bottom,0px));width:44px;height:44px;border:0;background:none;color:#efe9df;padding:8px;cursor:pointer;opacity:0;pointer-events:none}
.s3d-sound svg{width:100%;height:100%;display:block}
.s3d-sound .s3d-w{display:none}.s3d-sound.is-on .s3d-w{display:block}.s3d-sound.is-on .s3d-x{display:none}
.s3d.is-play .s3d-sound{pointer-events:auto}
.s3d-black{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}
#marble .mb-stage{display:none!important}
/* 갤러리 마지막 칸 = 화보 표지(oryzo 'RISE' 표지 구성): 850×1100 기준 단위 --px */
.s3d-mag,.s3d-magtitle{position:absolute;left:0;top:0;pointer-events:none;font-family:Pretendard,sans-serif;letter-spacing:-.02em;color:#fde9ce;font-weight:300;transform-origin:50% 86%;will-change:transform,opacity}
.s3d-mag *,.s3d-magtitle *{will-change:transform,opacity}
.s3d-magtitle{text-shadow:0 .02em .18em rgba(70,38,14,.22)}
.s3d-mag{text-shadow:0 1px calc(var(--px)*12) rgba(60,32,12,.42)}
/* oryzo 'RISE'처럼: 표지 위쪽을 꽉 채우는 굵은 제목, 글자 윗부분은 표지 위 가장자리에서 잘린다 */
.s3d-magtitle{overflow:hidden}
.s3d-mt{position:absolute;left:calc(var(--px)*14);top:calc(var(--px)*-118);width:calc(var(--px)*822);display:flex;justify-content:space-between;font-weight:800;font-size:calc(var(--px)*462);line-height:1;letter-spacing:-.04em}
.s3d-mt span{display:block}
.s3d-mi{position:absolute;right:calc(var(--px)*41);top:calc(var(--px)*378);font-weight:700;font-size:calc(var(--px)*21);white-space:nowrap;letter-spacing:-.01em}
.s3d-mb{position:absolute;right:calc(var(--px)*41);top:calc(var(--px)*585);width:calc(var(--px)*143);height:calc(var(--px)*163);border:calc(var(--px)*2) solid #fde9ce;text-align:center;box-sizing:border-box}
.s3d-mbn{margin-top:calc(var(--px)*15);font-weight:600;font-size:calc(var(--px)*54);line-height:1}
.s3d-mbn i{font-style:normal;display:inline-block;height:1em;overflow:hidden;vertical-align:top}
.s3d-mbn i b{display:block;font-weight:inherit;height:1em;line-height:1em}
.s3d-mbt{margin-top:calc(var(--px)*12);font-size:calc(var(--px)*16);line-height:1.45}
.s3d-mm{position:absolute;left:calc(var(--px)*47);top:calc(var(--px)*650);white-space:nowrap}
.s3d-mm1{font-size:calc(var(--px)*28);line-height:1.2}
.s3d-mm2{margin:.1em 0 0;font-weight:700;font-size:calc(var(--px)*34);line-height:1.2;letter-spacing:-.02em}
.s3d-mm2::after{content:'';display:block;width:calc(var(--px)*39);height:calc(var(--px)*1.6);background:currentColor;margin:calc(var(--px)*18) 0 calc(var(--px)*15)}
.s3d-mmd span{display:block;font-size:calc(var(--px)*18);line-height:1.55}
.s3d-mn{position:absolute;left:calc(var(--px)*47);bottom:calc(var(--px)*53);width:calc(var(--px)*140);height:calc(var(--px)*140);border:calc(var(--px)*2) solid #fde9ce;border-radius:50%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:calc(var(--px)*3)}
.s3d-mn small{font-size:calc(var(--px)*20);transform:translateY(calc(var(--px)*-14))}
.s3d-mn strong{font-weight:500;font-size:calc(var(--px)*58);line-height:1}
.s3d-mc{position:absolute;right:calc(var(--px)*41);bottom:calc(var(--px)*55);text-align:right;white-space:nowrap}
.s3d-mct{font-weight:500;font-size:calc(var(--px)*24);line-height:1}
.s3d-mcd{margin:1.05em 0 2.1em;font-size:calc(var(--px)*15.5);line-height:1.55}
.s3d-mcd span{display:block}
.s3d-mbar{display:block;margin-left:auto;height:calc(var(--px)*40);width:calc(var(--px)*188);transform-origin:50% 100%}
/* 모바일: 표지가 작아 잔이 가운데 글을 가리므로, 잔에 가리는 큰 글·숫자 상자는 빼고 제목·호수·원·모서리 글·바코드만 둔다 */
@media (max-width:767px){.s3d-mb,.s3d-mm{display:none}}`;
const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);

const root=document.createElement("div");root.className="s3d";root.setAttribute("role","region");root.setAttribute("aria-label","소리잔의 맑은 소리");
root.innerHTML=`<div class="s3d-bg"><div class="s3d-photo"><canvas class="s3d-pine"></canvas></div><div class="s3d-table"></div><div class="s3d-shade"></div></div>
<div class="s3d-magtitle" aria-hidden="true"><div class="s3d-mt"><span>소</span><span>리</span></div></div>
<canvas class="s3d-gl" aria-hidden="true"></canvas>
<div class="s3d-mag" aria-hidden="true">
<div class="s3d-mi">2026 겨울호</div>
<div class="s3d-mb"><div class="s3d-mbn">2<i><b>0</b><b>1</b><b>2</b><b>3</b><b>4</b></i></div><div class="s3d-mbt">절기마다<br>깨어나는<br>백자의 쓰임</div></div>
<div class="s3d-mm"><div class="s3d-mm1">맑게 울리는</div><div class="s3d-mm2">한 잔의 품격</div><div class="s3d-mmd"><span>물을 채울수록</span><span>잔의 소리는 깊어진다</span></div></div>
<div class="s3d-mn"><small>제</small><strong>60</strong><small>호</small></div>
<div class="s3d-mc"><div class="s3d-mct">백자 도라지문 소리잔</div><div class="s3d-mcd"><span>광주요 60주년 기념 에디션,</span><span>생활 속에 머무는 소리잔 5선</span></div><svg class="s3d-mbar" viewBox="0 0 226 47" preserveAspectRatio="none"></svg></div>
</div>
<div class="s3d-veil"></div>
<div class="s3d-copy"><p class="s3d-eye s3d-e1">맑게 올리는 한 잔</p><h2 class="s3d-title s3d-t1">손끝에서 맑게 번지는 소리</h2><p class="s3d-sub s3d-s1">한 잔을 들어 올리는 순간, 소리잔의 맑은 울림이<br>일상에 은은하게 스며듭니다.</p></div>
<div class="s3d-box">소리잔</div>
<div class="s3d-copy2"><p class="s3d-eye s3d-e2">손끝에서 시작되는 울림</p><h2 class="s3d-title s3d-t2">소리잔의 맑은 소리</h2><p class="s3d-sub s3d-s2">잔의 굽 안에 머문 작은 울림을<br>구슬의 움직임으로 천천히 느껴보세요.</p></div>
<div class="s3d-hint" aria-hidden="true"><svg class="s3d-wheel" viewBox="0 0 100 15"><path d="M50 12.1C82 12.1 100 3.6 100 2.1"/><path d="M50 12.1C18 12.1 0 3.6 0 2.1"/><circle cx="50" cy="12.1" r=".8"/><circle class="s3d-wheel-dot" cx="50" cy="12.1" r="1.8"/></svg><svg class="s3d-hand" viewBox="0 0 34 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V5.5a2.5 2.5 0 0 1 5 0V18m0-4.5a2.5 2.5 0 0 1 5 0V19m0-3.5a2.5 2.5 0 0 1 5 0V20m0-2a2.5 2.5 0 0 1 5 0v8c0 6.5-4.5 11-10.5 11h-2c-4 0-6.6-2-8.6-5.4L4.2 26a2.4 2.4 0 0 1 3.9-2.7L12 27"/></svg></div>
<button class="s3d-sound" type="button" aria-pressed="false" aria-label="소리 켜기"><svg viewBox="0 0 28 24" aria-hidden="true"><path d="M3 9h4l6-5v16l-6-5H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path class="s3d-x" d="M18 9l6 6M24 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="s3d-w" d="M17.5 8.5a5 5 0 0 1 0 7M20.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
<div class="s3d-black"></div>`;
document.body.appendChild(root);
/* 화보 표지 요소 */
const magT=root.querySelector(".s3d-magtitle"),mag=root.querySelector(".s3d-mag");
{const svg=root.querySelector(".s3d-mbar");let x=0,d="";const w=[2,1,3,1,1,2,1,4,1,2,2,1,1,3,1,1,2,1,3,2,1,1,2,4,1,1,2,1,3,1,2,1,1,2,1,3,1,1,2,2,1,4,1,2,1,1,3,1,2,1];for(let i=0;i<w.length&&x<226;i++){const bw=w[i]*2.4;if(i%2===0)d+=`M${x.toFixed(1)} 0h${bw.toFixed(1)}v47h-${bw.toFixed(1)}z`;x+=bw}svg.innerHTML=`<path fill="#fde9ce" d="${d}"/>`}
const magTitleChars=[...magT.querySelectorAll(".s3d-mt span")];
const magItems=[".s3d-mi",".s3d-mb",".s3d-mm1",".s3d-mm2",".s3d-mmd span:nth-child(1)",".s3d-mmd span:nth-child(2)",".s3d-mn",".s3d-mct",".s3d-mcd span:nth-child(1)",".s3d-mcd span:nth-child(2)"].map(q=>mag.querySelector(q));
const magRoll=mag.querySelector(".s3d-mbn i"),magBar=mag.querySelector(".s3d-mbar");
const $=s=>root.querySelector(s);
const pineCanvas=$(".s3d-pine"),pine=createPineBackdrop(pineCanvas),photo=$(".s3d-photo"),table=$(".s3d-table"),shade=$(".s3d-shade"),canvas=$(".s3d-gl"),copy=$(".s3d-copy"),copy2=$(".s3d-copy2"),hint=$(".s3d-hint"),hintDot=$(".s3d-wheel-dot"),hintHand=$(".s3d-hand"),soundBtn=$(".s3d-sound"),black=$(".s3d-black");
// 글자 단위로 나누기(흐림 → 또렷 등장)
const split=el=>{const t=el.textContent;el.setAttribute("aria-label",t);el.textContent="";return[...t].map(c=>{const s=document.createElement("span");s.className="s3d-ch";s.textContent=c;s.setAttribute("aria-hidden","true");el.appendChild(s);return s})};
const box=$(".s3d-box"),veil=$(".s3d-veil");
const splitBr=el=>{const out=[];const nodes=[...el.childNodes];el.setAttribute("aria-label",el.textContent);el.textContent="";for(const n of nodes){if(n.nodeName==="BR"){el.appendChild(document.createElement("br"));continue}for(const c of n.textContent){const sp=document.createElement("span");sp.className="s3d-ch";sp.textContent=c;sp.setAttribute("aria-hidden","true");el.appendChild(sp);out.push(sp)}}return out};
const e1=splitBr($(".s3d-e1")),t1=splitBr($(".s3d-t1")),s1=splitBr($(".s3d-s1")),e2=splitBr($(".s3d-e2")),t2=splitBr($(".s3d-t2")),s2=splitBr($(".s3d-s2"));
const reveal=(chars,inT,outT,rise=.55)=>{const n=Math.max(1,chars.length-1);chars.forEach((c,i)=>{const g=i/n,a=expoOut(fit(inT,g*.35,g*.35+.65)),b=fit(outT,g*.25,g*.25+.75),o=a*(1-b);c.style.opacity=o.toFixed(3);c.style.transform=`translate3d(0,${((1-a)*rise-b*.2).toFixed(3)}em,0)`;c.style.filter=o>=.999?"none":`blur(${((1-a)*.32+b*.25).toFixed(3)}em)`})};

/* ---------- 3D ---------- */
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
{const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose()}
scene.environmentIntensity=.46;
// 조명: 히어로 장면과 같은 구성(같은 잔의 같은 모습)
const hemi=new THREE.HemisphereLight(0xffffff,0x6f6253,.45);scene.add(hemi);
scene.add(new THREE.AmbientLight(0xffffff,.13));
const dl=(c,i,p,sh)=>{const l=new THREE.DirectionalLight(c,i);l.position.set(...p);if(sh){l.castShadow=true;l.shadow.mapSize.set(2048,2048);l.shadow.bias=-.0004;l.shadow.normalBias=.02;l.shadow.radius=4;const s=l.shadow.camera;s.left=s.bottom=-3;s.right=s.top=3;s.near=1;s.far=30}scene.add(l);return l};
dl(0xfff2df,.81,[-6,13.9,-1.2]);dl(0xfff6eb,.075,[-3,3,6]);dl(0xffffff,.15,[2.4,6,9]);const key=dl(0xfff1e0,4.8,[-5.9,7.54,4.55]);
// 잔 그림자: 히어로처럼 바닥에서 왼쪽 뒤로 눕는다(오른쪽 앞에서 비추는 그림자 전용 빛 — 세기 0이라 잔 밝기는 그대로)
dl(0xffffff,0,[5.9,7.54,4.55],true);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.ShadowMaterial({color:0x2a1a0c,opacity:.32}));ground.rotation.x=-Math.PI/2;ground.position.y=.03;ground.receiveShadow=true;scene.add(ground);
const camera=new THREE.PerspectiveCamera(24.7,1,.05,80);

const cup=new THREE.Group();scene.add(cup);
let cupMat=null,glassMat=null,cavity=null,marble=null,ready=false;
const XU={uX:{value:0},uG:{value:0}};
const MR=.16,FLOOR=.085,RR=.25;           // 구슬 반지름, 손잡이 속 바닥 높이, 구를 수 있는 반경
const mPos=new THREE.Vector2(0,0),mVel=new THREE.Vector2(0,0),mTarget=new THREE.Vector2(0,0),mQ=new THREE.Quaternion();

new GLTFLoader().loadAsync("assets/models/sori-60th-doraji.glb").then(g=>{
  let mesh=null;g.scene.traverse(o=>{if(!mesh&&o.isMesh)mesh=o});if(!mesh)return;
  const geo=mesh.geometry;
  // 1) 잔(그대로의 재질) — 투시 단계에서 손잡이(높이 1 아래)만 서서히 투명
  cupMat=mesh.material.clone();cupMat.transparent=true;cupMat.side=THREE.DoubleSide;
  cupMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,XU);
    sh.vertexShader=sh.vertexShader.replace("void main() {","varying float vLy;\nvoid main() {").replace("#include <begin_vertex>","#include <begin_vertex>\nvLy = position.y;");
    sh.fragmentShader=sh.fragmentShader.replace("void main() {","uniform float uX, uG; varying float vLy;\nvoid main() {").replace("#include <dithering_fragment>","#include <dithering_fragment>\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(dot(gl_FragColor.rgb, vec3(.299,.587,.114))) * vec3(.97,.98,1.), uG);\n  gl_FragColor.a *= 1. - uX * (1. - smoothstep(.98, 1.08, vLy));")};
  cupMat.customProgramCacheKey=()=>"s3d-cup";
  const body=new THREE.Mesh(geo,cupMat);body.castShadow=true;body.receiveShadow=true;body.renderOrder=3;cup.add(body);
  // 2) 유리처럼 비치는 손잡이 껍질(가장자리만 밝게)
  glassMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.08,metalness:0,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.6});
  glassMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,XU);
    sh.vertexShader=sh.vertexShader.replace("void main() {","varying float vLy;\nvoid main() {").replace("#include <begin_vertex>","#include <begin_vertex>\nvLy = position.y;");
    sh.fragmentShader=sh.fragmentShader.replace("void main() {","uniform float uX; varying float vLy;\nvoid main() {").replace("#include <dithering_fragment>",`#include <dithering_fragment>
  float stem = 1. - smoothstep(.98, 1.08, vLy);
  float fr = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 2.2);
  gl_FragColor.rgb += vec3(.93, .97, 1.) * fr * 1.15;
  gl_FragColor.a = (.10 + .78 * fr) * uX * stem;`)};
  glassMat.customProgramCacheKey=()=>"s3d-glass";
  const shell=new THREE.Mesh(geo,glassMat);shell.renderOrder=4;cup.add(shell);
  // 3) 손잡이 속 빈 공간(안쪽이 은은하게 밝음)
  const prof=[];for(let i=0;i<=24;i++){const y=FLOOR+(i/24)*(.93-FLOOR);prof.push(new THREE.Vector2(Math.max(.05,stemR(y)-.045),y))}
  cavity=new THREE.Mesh(new THREE.LatheGeometry(prof,96),new THREE.MeshStandardMaterial({color:0xe8eef0,roughness:.6,emissive:0x8a979b,emissiveIntensity:.35,transparent:true,opacity:0,depthWrite:false,side:THREE.BackSide}));
  cavity.renderOrder=1;cup.add(cavity);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(stemR(FLOOR)-.045,96),new THREE.MeshStandardMaterial({color:0xf1f4f4,roughness:.35,emissive:0xa9b6ba,emissiveIntensity:.45,transparent:true,opacity:0,depthWrite:false}));
  floor.rotation.x=-Math.PI/2;floor.position.y=FLOOR+.002;floor.renderOrder=1;cup.add(floor);cavity.userData.floor=floor;
  // 4) 구슬: 예전 구슬 섹션에서 쓰던 베이킹된 구슬 이미지(img/marble/sprite.webp) 그대로.
  //    예전처럼 굴러간 만큼 이미지가 돌고, 청록 빛 번짐과 제자리 하이라이트를 더한다.
  marble=new THREE.Group();
  const tl=new THREE.TextureLoader(),mtex=tl.load("img/marble/sprite.webp");mtex.colorSpace=THREE.SRGBColorSpace;mtex.anisotropy=4;
  const radial=(stops,n=128)=>{const c=document.createElement("canvas");c.width=c.height=n;const x=c.getContext("2d"),gr=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);stops.forEach(([o,col])=>gr.addColorStop(o,col));x.fillStyle=gr;x.fillRect(0,0,n,n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:radial([[0,"rgba(70,230,210,.22)"],[.37,"rgba(70,230,210,.22)"],[1,"rgba(70,230,210,0)"]]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  glow.scale.set(MR*3.8,MR*3.8,1);glow.renderOrder=2.4;
  const ball=new THREE.Sprite(new THREE.SpriteMaterial({map:mtex,transparent:true,depthWrite:false,toneMapped:false}));
  ball.scale.set(MR*2,MR*2,1);ball.renderOrder=2.5;   // 잔 몸통(3)보다 먼저: 몸통이 깊이를 써서 가리지 않게
  const hl=new THREE.Sprite(new THREE.SpriteMaterial({map:radial([[0,"rgba(255,255,255,.28)"],[1,"rgba(255,255,255,0)"]]),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
  hl.scale.set(MR*1,MR*1,1);hl.center.set(.92,0);   // 구슬 중심에서 왼쪽 위(빛은 돌지 않고 제자리)
  hl.renderOrder=2.6;
  marble.add(glow,ball,hl);marble.userData.ball=ball;
  marble.visible=false;cup.add(marble);
  // 구슬 밑 그림자(바닥에 닿아 있는 느낌)
  {const c=document.createElement("canvas");c.width=c.height=128;const x=c.getContext("2d"),gr=x.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,"rgba(0,0,0,.55)");gr.addColorStop(.55,"rgba(0,0,0,.22)");gr.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=gr;x.fillRect(0,0,128,128);
   const sh=new THREE.Mesh(new THREE.PlaneGeometry(MR*2.6,MR*2.6),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,opacity:0}));sh.rotation.x=-Math.PI/2;sh.renderOrder=2;cup.add(sh);marble.userData.shadow=sh}
  // 잔 방향: 도라지 꽃이 정면(히어로 마지막 자세의 좌우 회전만 사용)
  let yaw=-.35;try{const v=window.__kwangjuyoCupView;if(v&&v.length===4){const e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion(v[0],v[1],v[2],v[3]),"YXZ");if(isFinite(e.y))yaw=e.y}}catch(e){}
  cup.rotation.y=yaw;
  S.yaw=yaw;ready=true;
  (window.requestIdleCallback||(f=>setTimeout(f,300)))(warm,{timeout:2000});
}).catch(e=>{S.err=e;console.warn("[sound3d]",e)});
/* 미리 데우기: 마지막 칸(표지)이 들어와 3D가 처음 그려지는 순간, 셰이더 컴파일·그림자 지도·텍스처 업로드·배경 사진 디코딩을
   그 자리에서 하느라 멈추지 않도록 로드 뒤 쉬는 시간에 한 번 끝내 둔다(화면에는 보이지 않는 상태에서). */
function warm(){
  S.warmImgs=["img/hero-bg-pine.webp","img/sound-table-top.jpg"].map(src=>{const i=new Image();i.src=src;i.decode().catch(()=>{});return i});
  const draw=()=>{if(root.classList.contains("is-live"))return;size();cup.updateMatrixWorld(true);placeCamera(0,0,1,0);marble.visible=true;renderer.render(scene,camera);marble.visible=false};
  marble.visible=true;const p=renderer.compileAsync?renderer.compileAsync(scene,camera):Promise.resolve(renderer.compile(scene,camera));marble.visible=false;
  p.then(draw,draw);
}
// 손잡이 바깥 반지름(모델 실측값: 높이 0.05→0.52, 0.95→0.323)
function stemR(y){const t=clamp((y-.05)/.9);return .521-(.521-.323)*(1-Math.pow(1-t,1.35))}

/* ---------- 소리(예전 구슬 섹션의 소리 그대로) ---------- */
let ac=null,master=null,rev=null,roll=null,want=true;
function audio(){
  if(ac)return;ac=new(window.AudioContext||window.webkitAudioContext)();
  master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
  rev=ac.createGain();rev.gain.value=.35;
  const d1=ac.createDelay(),d2=ac.createDelay(),f1=ac.createGain(),f2=ac.createGain(),lp=ac.createBiquadFilter();
  d1.delayTime.value=.031;d2.delayTime.value=.047;f1.gain.value=.42;f2.gain.value=.38;lp.type="lowpass";lp.frequency.value=5200;
  rev.connect(d1);rev.connect(d2);d1.connect(f1);d2.connect(f2);f1.connect(lp);f2.connect(lp);lp.connect(d1);lp.connect(d2);lp.connect(master);
  const len=ac.sampleRate*2,nb=ac.createBuffer(1,len,ac.sampleRate),ch=nb.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=(b+.02*(Math.random()*2-1))/1.02;ch[i]=b*3.5}
  const src=ac.createBufferSource();src.buffer=nb;src.loop=true;const bp=ac.createBiquadFilter();bp.type="bandpass";bp.frequency.value=820;bp.Q.value=.9;
  roll=ac.createGain();roll.gain.value=0;src.connect(bp);bp.connect(roll);roll.connect(master);roll.connect(rev);src.start();
}
const live=()=>!!ac&&ac.state==="running"&&want;
function clink(a){
  if(!live()||a<.02)return;
  const t=ac.currentTime,f0=1900+Math.random()*380,amp=Math.min(1,a)*.5,out=ac.createGain();out.gain.value=1;out.connect(master);out.connect(rev);
  [[1,1,.9],[2.32,.55,.5],[4.25,.32,.3],[6.63,.16,.18]].forEach(([r,gn,dec])=>{const o=ac.createOscillator(),e=ac.createGain();o.type="sine";o.frequency.value=f0*r*(1+(Math.random()-.5)*.01);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(amp*gn,t+.002);e.gain.exponentialRampToValueAtTime(.0001,t+dec*(.6+a*.6));o.connect(e);e.connect(out);o.start(t);o.stop(t+dec*1.3+.05)});
  [[930,.16,1.6],[1710,.09,1.1]].forEach(([f,gn,dec])=>{const o=ac.createOscillator(),e=ac.createGain();o.type="sine";o.frequency.value=f*(1+(Math.random()-.5)*.006);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(amp*gn,t+.004);e.gain.exponentialRampToValueAtTime(.0001,t+dec);o.connect(e);e.connect(out);o.start(t);o.stop(t+dec+.05)});
  const n=ac.createBufferSource(),nbuf=ac.createBuffer(1,ac.sampleRate*.02,ac.sampleRate),d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length)**3;
  const hp=ac.createBiquadFilter();hp.type="highpass";hp.frequency.value=3500;const ng=ac.createGain();ng.gain.value=amp*.5;n.buffer=nbuf;n.connect(hp);hp.connect(ng);ng.connect(out);n.start(t);
}
let lastSync="";
function syncSound(){
  const on=live(),key=on+"|"+playing;if(key===lastSync)return;lastSync=key;soundBtn.classList.toggle("is-on",on);soundBtn.setAttribute("aria-pressed",on?"true":"false");soundBtn.setAttribute("aria-label",on?"소리 끄기":"소리 켜기");
  if(master){master.gain.cancelScheduledValues(ac.currentTime);master.gain.linearRampToValueAtTime(on&&playing?.9:0,ac.currentTime+.15)}
}
// 브라우저는 사용자가 한 번이라도 누르거나(클릭·터치·키) 하기 전에는 소리를 막는다 → 페이지 어디서든 첫 입력 때 소리를 준비해 둔다
const unlock=()=>{try{audio();ac.resume().then(()=>{lastSync="";syncSound()})}catch(e){}};
["pointerdown","keydown","touchend"].forEach(t=>addEventListener(t,unlock,{capture:true,passive:true}));
soundBtn.addEventListener("click",e=>{e.stopPropagation();if(!ac||ac.state!=="running"){want=true;unlock()}else{want=!want;lastSync="";syncSound();if(want)clink(.5)}});

/* ---------- 마우스(클릭 없이 움직이기만) ---------- */
let px=.5,py=.5,moved=false;
addEventListener("pointermove",e=>{px=e.clientX/innerWidth;py=e.clientY/innerHeight;moved=true},{passive:true});
addEventListener("touchmove",e=>{const t=e.touches[0];if(t){px=t.clientX/innerWidth;py=t.clientY/innerHeight;moved=true}},{passive:true});

/* ---------- 장면 배치 ---------- */
const IMG_AR=3344/1882,BASE_U=.48,BASE_V=.782,CUP_W=.167;   // 사진 속 잔 자리(바닥 중심)와 폭(사진 폭 대비)
const T0=new THREE.Vector3(0,1.02,0),T1=new THREE.Vector3(0,.56,0),UPv=new THREE.Vector3(0,1,0);
const v3=new THREE.Vector3(),tgt=new THREE.Vector3();
let we=-99,weS=null,lastT=0,playing=false,W=0,H=0,dpr=1,tryAt=0;
function size(){
  const w=innerWidth,h=innerHeight,d=Math.round(Math.max(1,Math.min(Math.min(3,Math.max(2,(devicePixelRatio||1)*1.5)),4096/Math.max(w,h,1),window.__kjyResCap||3))*100)/100;/* 느린 기기는 kjy-hand.js의 해상도 상한을 따른다 *//* 시리즈 잔과 같은 슈퍼샘플링(잔 외곽 계단 방지) */
  if(w!==W||h!==H||d!==dpr){W=w;H=h;dpr=d;renderer.setPixelRatio(d);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
}
// 사진을 화면 가득(cover) 채웠을 때의 크기·위치
function coverRect(){const bw=Math.max(W,H*IMG_AR),bh=bw/IMG_AR;return{bw,bh,bx:(W-bw)/2,by:(H-bh)/2}}

function placeCamera(A,dx,zoom,E){
  // A: 0 = 떨어져서 보는 자리, 1 = 손잡이 앞까지 다가감
  // E: 0 = 사진 속 잔과 같은 자리·크기, 1 = 조금 더 위·멀리서 탁자 위 잔을 내려다보는 시선(ORYZO 첫 화면처럼), 잔은 화면 가운데
  const cr=coverRect(),wantW=CUP_W*cr.bw,tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  const dP=1.886*H/(2*tan*wantW),dE=dP*lerp(1,1.45,io(E)),d1=3.7;
  const d=dE*Math.pow(d1/dE,io(A)),pitch=THREE.MathUtils.degToRad(lerp(lerp(8.5,27,io(E)),1.5,io(A)));
  tgt.copy(T0).lerp(T1,io(A));
  camera.position.set(0,tgt.y+Math.sin(pitch)*d,Math.cos(pitch)*d);camera.lookAt(tgt);camera.zoom=zoom;camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();
  v3.set(0,.03,0).applyMatrix4(cup.matrixWorld).project(camera);
  const sx=(v3.x+1)/2*W,sy=(1-v3.y)/2*H;
  const x0=W/2,/* 화보 표지(갤러리 마지막 칸)에서도 잔이 칸의 가로 가운데에 오도록 — 사진은 잔 자리에 맞춰 함께 옮긴다 */y0=lerp(cr.by+BASE_V*cr.bh,H*(W<768?.8:.84),io(E));
  const wantX=lerp(x0,W/2,io(A))+dx,wantY=lerp(y0,H*.7,io(A));
  camera.setViewOffset(W,H,sx-wantX,sy-wantY,W,H);camera.updateProjectionMatrix();
  return{dE,d,cr,base:[wantX,wantY]};
}

/* 갤러리 왼쪽 썸네일(지나간 사진): 표지가 거의 다 들어오면(ORYZO: index > 마지막-0.75) 차례로 왼쪽으로 미끄러져 사라진다.
   ORYZO처럼 스크롤이 아닌 시간(약 1초)으로 진행, 되돌아가면 반대로. 썸네일 칸 위치는 script.js가 잡고, 여기서는 칸 속 사진만 옮긴다. */
let thumbHide=0,thumbLast=0;
const cubicInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function thumbs(now){
  requestAnimationFrame(thumbs);
  const dt=thumbLast?Math.min(.05,(now-thumbLast)/1000):1/60;thumbLast=now;
  const G=window.__kwangjuyoCover;if(!G)return;
  const want=G.offset<.75&&G.offset>-9?1:-1;
  const h=Math.min(1,Math.max(0,thumbHide+want*dt));
  if(h===thumbHide&&h===0&&!thumbs.dirty)return;
  thumbHide=h;thumbs.dirty=h>0;
  const imgs=[...document.querySelectorAll("#scenery .scenery-thumbs.is-left .scenery-thumb img")];const t=imgs.length;if(t<3)return;
  for(let i=0;i<t-1;i++){const x=i/(t-2),S=cubicInOut(fit(h,x*.2,.8+x*.2));imgs[i].style.transform=S>0?`translate3d(${(-S*innerWidth/2).toFixed(1)}px,0,0)`:"";}
}
requestAnimationFrame(thumbs);
let railV=-1;
function railVis(v){v=Math.round(v*1000)/1000;if(v===railV)return;railV=v;const R=document.documentElement;R.style.setProperty("--rail-vis",String(v));R.classList.toggle("rail-off",v<.05)}
function frame(now){
  requestAnimationFrame(frame);
  const sc=document.getElementById("scenery");if(!sc)return;
  const G=window.__kwangjuyoCover;
  const vh=innerHeight,centerR=G&&G.centerR||13.9;
  const raw=(scrollY-sc.offsetTop)/vh-centerR;
  const dt=lastT?Math.min(.05,(now-lastT)/1000):1/60;lastT=now;
  weS=weS===null||Math.abs(raw-weS)>3?raw:weS+(raw-weS)*(1-Math.exp(-4.2*dt));
  we=weS;
  const offset=G?G.offset:9,showSlide=offset<1.02;
  const on=showSlide&&raw>-2.6&&raw<11.4;   // 암전이 끝나면(아름다움 섹션 시작 전) 바로 비켜 준다
  /* '스크롤하여 내려가기'(script.js): 화보 표지 글이 밀려나며 사라질 때 함께 사라지고, 3D 장면을 지난 뒤에는 숨긴 채로 둔다(다시 나타나는 때는 구슬이 구르기 시작할 때, after-sound.js) */
  window.kjyScrollCue?.gate("s3d",on?1-fit(we,1.6,3.2):raw>0?0:1);
  root.classList.toggle("is-live",on);
  /* 오른쪽 레일(스크롤바): 마지막 칸이 3D 공간으로 화면 전체가 될 때 함께 서서히 사라지고, 암전이 끝나 다음 섹션으로 넘어갈 때 다시 나타난다 */
  railVis(on?1-io(fit(we,2.35,3.05))*(1-sm(fit(we,10.85,11.4))):1);
  if(!on){if(playing){playing=false;syncSound()}return}
  size();
  /* 1) 갤러리 칸 → 화면 전체 */
  const mobile=W<768,imgH=mobile?Math.min(H*.8,W*1.1):H*.8,imgW=imgH*.7727;
  const cx=W/2+offset*imgW,P=io(fit(raw,2.5,3.2)),mt=(W-imgW)/2;
  const L=Math.max(cx-imgW/2,mt)*(1-P),R=Math.max(W-cx-imgW/2,mt)*(1-P),T=(H-imgH)/2*(1-P);
  root.style.clipPath=`inset(${T.toFixed(1)}px ${Math.max(0,R).toFixed(1)}px ${T.toFixed(1)}px ${Math.max(0,L).toFixed(1)}px)`;
  const slideZoom=1+(G&&G.scale?G.scale-1:0)*(1-P),dx=(cx-W/2)*(1-P);
  /* 화보 표지: 마지막 칸이 가운데에 들어오면 표지 글이 차례로 나타나고(제목 → 호수 → 숫자 상자 → 큰 글 → 원 → 모서리 글 → 바코드),
     3D 공간으로 넓어질 때는 잔 아래를 중심으로 함께 커지며 흐려져 사라진다(제목은 잔 뒤에 있다가 가장 늦게) */
  {
    const px=imgW/850,left=cx-imgW/2,top=(H-imgH)/2,grow=1+.42*io(fit(we,2.45,3.6));
    for(const el of [magT,mag]){el.style.setProperty("--px",px.toFixed(4)+"px");el.style.width=imgW.toFixed(1)+"px";el.style.height=imgH.toFixed(1)+"px";el.style.transform=`translate3d(${left.toFixed(1)}px,${top.toFixed(1)}px,0) scale(${grow.toFixed(4)})`}
    const tin=fit(we,-.75,.15);
    /* 사라짐 = ORYZO 마지막 화보(WearableMagazine)와 같은 식.
       hide: 표지가 가운데 온 뒤 3.2화면 동안 0→1. 큰 제목은 글자마다 위로(차례로, cubic) 올라가 표지 위 가장자리에서 잘려 사라지고,
       왼쪽 글은 왼쪽으로·오른쪽 글은 오른쪽으로 줄마다 차례로 밀려나며 뒤 절반에서 흐려진다(뒤 절반 a=0.5~1 구간). */
    const hide=fit(we,0,3.2),ah=fit(hide,.5,1),D=.42*imgW,d40=D*40/260;
    const cubicIn=t=>t*t*t,backIn=t=>t*t*(2.70158*t-1.70158);
    magTitleChars.forEach((c,i)=>{const a=expoOut(fit(tin,i*.18,i*.18+.82));const id=magTitleChars.length>1?i/(magTitleChars.length-1):0;let hr=sm(fit(hide,id*.2,id*.2+.8));hr=hr*hr*hr;
      c.style.opacity=a.toFixed(3);c.style.transform=`translate3d(0,${((1-a)*.12-hr*1.3).toFixed(4)}em,0)`;c.style.filter=a>=.999?"none":`blur(${((1-a)*.06).toFixed(3)}em)`});
    const inn=fit(we,-.35,1.0),n=magItems.length;
    const exit=new Map();
    const lists=[[[".s3d-mm1",".s3d-mm2",".s3d-mmd span:nth-child(1)",".s3d-mmd span:nth-child(2)"],-1],[[".s3d-mct",".s3d-mcd span:nth-child(1)",".s3d-mcd span:nth-child(2)"],1]];
    for(const [qs,dir] of lists)qs.forEach((q,u)=>{const c=u/(qs.length-1),l=fit(ah,c*.2,.8+c*.2);exit.set(mag.querySelector(q),{x:dir*cubicIn(l)*D,o:1-fit(l,.5,1),s:1})});
    {const l=fit(ah,0,.75);exit.set(mag.querySelector(".s3d-mi"),{x:l*d40,o:1-fit(l,.5,1),s:1})}
    {const l=fit(ah,.1,.85);exit.set(mag.querySelector(".s3d-mb"),{x:l*d40,o:1-fit(l,.5,1),s:1})}
    {const l=fit(ah,0,.75);exit.set(mag.querySelector(".s3d-mn"),{x:0,o:1-fit(l,.5,1),s:1-.9*backIn(l)})}
    magItems.forEach((el,i)=>{const g=i/(n-1),a=expoOut(fit(inn,g*.55,g*.55+.45)),e=exit.get(el)||{x:0,o:1,s:1};el.style.opacity=(a*e.o).toFixed(3);el.style.transform=`translate3d(${e.x.toFixed(1)}px,${((1-a)*18*px).toFixed(1)}px,0)${e.s!==1?` scale(${e.s.toFixed(4)})`:""}`;el.style.filter=a>=.999?"none":`blur(${((1-a)*6).toFixed(1)}px)`});
    {const lr=fit(hide,.25,.75);magRoll.style.setProperty("--k","0");[...magRoll.children].forEach(b=>b.style.transform=`translate3d(0,${(-4*io(fit(inn,.15,.75))-3*cubicIn(lr)).toFixed(3)}em,0)`);
     magBar.style.transform=`scaleY(${(expoOut(fit(inn,.62,1))*(1-backIn(lr))).toFixed(3)})`}
    const vis=we<3.9;magT.style.visibility=mag.style.visibility=vis?"":"hidden";  // 보일 때는 부모(.s3d)를 따른다 — "visible"로 두면 장면이 꺼져도(.s3d 숨김) 표지 글이 hero 위에 남는다
  }
  /* 3) 위에서 내려다보는 시선(E) → 4) 손잡이로 다가감(A) → 5) 회색·흐림(G), 투시·구슬(X) → 6) 암전(B) */
  const E=fit(we,2.9,4.3),A=fit(we,5.3,7.7),GR=sm(fit(we,5.5,7.3)),X=sm(fit(we,7.2,7.9)),B=sm(fit(we,9.7,10.7));
  if(ready){
    {const SW=window.__kjySway,g=window.__kjySwayGate?window.__kjySwayGate():1;cup.rotation.y=S.yaw+(SW?SW.x*.16*g:0);cup.rotation.x=SW?SW.y*.03*g:0;cup.rotation.z=SW?-SW.x*.035*g:0;S.cupYaw=cup.rotation.y}  // 마우스에 따라 잔이 살짝 돌아봄(바닥 자리는 그대로라 사진 배치와 어긋나지 않음)
    cup.updateMatrixWorld(true);
    const cam=placeCamera(A,dx,slideZoom,E);
    const k=cam.dE/cam.d,cr=cam.cr,[bxN,byN]=cam.base;
    // 사진(송나무 장면): 사진 속 잔 자리를 기준으로 키우고 지금 잔 바닥 위치로 옮김
    const [bx0,by0]=[cr.bx+BASE_U*cr.bw,cr.by+BASE_V*cr.bh],sBg=Math.max((1+(k-1)*.42)*slideZoom,(bxN+2)/(bx0-cr.bx),(W-bxN+2)/(cr.bx+cr.bw-bx0));/* 잔을 가운데로 옮겨도 사진 가장자리가 비지 않게 */
    photo.style.width=cr.bw.toFixed(1)+"px";photo.style.height=cr.bh.toFixed(1)+"px";
    photo.style.transform=`translate3d(${(bxN-sBg*(bx0-cr.bx)).toFixed(1)}px,${(byN-sBg*(by0-cr.by)).toFixed(1)}px,0) scale(${sBg.toFixed(4)})`;
    // 탁자(위에서 본 사진): 화면을 넉넉히 덮고, 잔이 놓인 자리를 잔 바닥에 맞춤(가장자리가 비지 않게 범위 안으로)
    {const TAR=1672/941,TU=.56,TV=.6,m=1.18*(1+(k-1)*.35),tw=Math.max(W,H*TAR)*m,th=tw/TAR;
     let tx=bxN-TU*tw,ty=byN-TV*th;tx=Math.min(0,Math.max(W-tw,tx));ty=Math.min(0,Math.max(H-th,ty));
     table.style.width=tw.toFixed(1)+"px";table.style.height=th.toFixed(1)+"px";table.style.transform=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`}
    const blur=16*Math.pow(A,1.3),bright=1-.28*GR-.06*X;
    const fl=`blur(${blur.toFixed(1)}px) grayscale(${GR.toFixed(3)}) brightness(${bright.toFixed(3)})`;
    photo.style.opacity=(1-sm(E)).toFixed(3);
    // 배경 공간: 히어로와 같이 소나무가 바람에 흔들리고 벽 그림자가 일렁인다(사진이 보이는 동안만 그린다, 준비 전에는 정지 사진)
    if(E<1){pine.draw(cr.bw,cr.bh,now/1000);if(pine.ready()&&!pineCanvas.classList.contains("is-on"))pineCanvas.classList.add("is-on")}photo.style.filter=E>0||A>0?fl:"none";
    table.style.opacity=sm(fit(E,.15,.85)).toFixed(3);table.style.filter=A>0||GR>0?fl:"none";
    shade.style.opacity=(.35*sm(E)*(1-GR)+.4*GR).toFixed(3);
    veil.style.opacity=(GR*(1-B)).toFixed(3);
    ground.material.opacity=.32*(1-.6*X);
    XU.uX.value=X;XU.uG.value=GR;glassMat.opacity=X;cavity.material.opacity=.42*X;cavity.userData.floor.material.opacity=.55*X;
    key.intensity=4.8*(1-.35*X);
    marble.visible=X>.01;playing=X>.6&&B<.98;
    root.classList.toggle("is-play",playing);
    if(marble.visible)stepMarble(dt);
    marble.userData.shadow.material.opacity=X;marble.userData.shadow.position.set(marble.position.x,FLOOR+.004,marble.position.z);
    if(playing&&want&&(!ac||ac.state!=="running")&&navigator.userActivation&&navigator.userActivation.hasBeenActive&&now-tryAt>1000){tryAt=now;unlock()}
    renderer.render(scene,camera);
  }
  /* 첫 화면 글: 위에서 내려다보는 시선이 자리 잡을 때 차례로 또렷해지고, 다가가기 시작하면 흐려지며 위로 사라진다 */
  reveal(e1,fit(we,3.5,4.2),fit(we,5.3,5.85),.5);
  reveal(t1,fit(we,3.65,4.45),fit(we,5.35,5.95));
  reveal(s1,fit(we,3.85,4.6),fit(we,5.4,6.0),.4);
  const bx=sm(fit(we,4.2,4.7))*(1-sm(fit(we,5.3,5.75)));box.style.opacity=bx.toFixed(3);box.style.filter=bx>=.999?"none":`blur(${((1-bx)*6).toFixed(1)}px)`;
  /* 확대 화면 글 */
  reveal(e2,fit(we,7.4,8.0),fit(we,9.5,10.0),.5);
  reveal(t2,fit(we,7.5,8.2),fit(we,9.5,10.1));
  reveal(s2,fit(we,7.7,8.4),fit(we,9.55,10.1),.4);
  const h=sm(fit(we,7.9,8.4))*(1-sm(fit(we,9.4,9.9)));hint.style.opacity=h.toFixed(3);soundBtn.style.opacity=h.toFixed(3);if(h>0)swayHint(now);
  black.style.opacity=B.toFixed(3);
  syncSound();
}
let hintW=0;
addEventListener("resize",()=>{hintW=0});
function swayHint(now){
  if(!hintW)hintW=hint.offsetWidth;
  const a=now/1000*4,lift=(1-Math.cos(Math.abs(Math.cos(a)*.2)))*hintW*-.2;
  hintHand.style.transform=`translate3d(${(Math.cos(a)*hintW*.1).toFixed(2)}px,${lift.toFixed(2)}px,0) rotate(${(Math.cos(a)*4).toFixed(2)}deg)`;
  hintDot.setAttribute("transform",`translate(${(Math.cos(a+.1)*10).toFixed(3)} ${(lift*100/hintW).toFixed(3)})`);
}
let rollV=0;
function stepMarble(dt){
  // 목표: 마우스 위치(좌우 → 좌우, 위아래 → 앞뒤)
  // 화면 기준(좌우·앞뒤)을 잔의 회전만큼 되돌려 잔 안쪽 좌표로
  if(moved){const wx=(px-.5)*2*RR*1.25,wz=(py-.5)*2*RR*.9,f=-cup.rotation.y,c0=Math.cos(f),s0=Math.sin(f);mTarget.set(wx*c0+wz*s0,-wx*s0+wz*c0)}
  const k=38,c=5.2;
  mVel.x+=((mTarget.x-mPos.x)*k-mVel.x*c)*dt;mVel.y+=((mTarget.y-mPos.y)*k-mVel.y*c)*dt;
  mPos.x+=mVel.x*dt;mPos.y+=mVel.y*dt;
  const r=mPos.length();
  if(r>RR){const nx=mPos.x/r,ny=mPos.y/r,vn=mVel.x*nx+mVel.y*ny;mPos.set(nx*RR,ny*RR);if(vn>0){mVel.x-=1.45*vn*nx;mVel.y-=1.45*vn*ny;if(vn>.12)clink(Math.min(1,vn/1.1))}}
  marble.position.set(mPos.x,FLOOR+MR,mPos.y);
  const sp=mVel.length();
  // 화면에서 좌우로 굴러간 만큼 구슬 이미지가 돈다(예전 구슬 섹션과 같은 방식)
  {const y=cup.rotation.y,vx=mVel.x*Math.cos(y)+mVel.y*Math.sin(y);marble.userData.ball.material.rotation-=vx*dt/MR}
  rollV+=(Math.min(1,sp/.9)-rollV)*.2;
  if(roll&&live())roll.gain.setTargetAtTime(rollV*.5,ac.currentTime,.05);
}
requestAnimationFrame(frame);
S.debug={scene,camera,cup,get we(){return we},get ready(){return ready},renderer};
}
