/* 광주요 — 히어로 소리잔이 그 자리에서 그대로 깨진다 (breakwheel.js의 조각 계산을 그대로 따른다) */
import*as THREE from"three";import{curT,rawT,clamp,fit,sm,ease,crackAt,CRACK,POP,FALL}from"./timeline.js?v=20261108-r73";
const KS=44,UMAX=1.08,ERP=1.5,UP=new THREE.Vector3(0,1,0),qI=new THREE.Quaternion;
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
const BODY=new THREE.Color().setRGB(.935,.915,.88);
const GLSL_NOISE=`
float bwH(int i, int j, int k, int s){ uint h = (uint(i) * 374761393u) ^ (uint(j) * 668265263u) ^ (uint(k) * 1440662683u) ^ (uint(s) * 1103515245u);
  h = (h ^ (h >> 13u)) * 1274126177u; h ^= h >> 16u; return float(h) / 4294967296.; }
float bwN(vec3 p, int s){ ivec3 i = ivec3(floor(p)); vec3 f = fract(p); f = f * f * (3. - 2. * f);
  float a = bwH(i.x, i.y, i.z, s), b = bwH(i.x + 1, i.y, i.z, s), c = bwH(i.x, i.y + 1, i.z, s), d = bwH(i.x + 1, i.y + 1, i.z, s);
  float e = bwH(i.x, i.y, i.z + 1, s), g = bwH(i.x + 1, i.y, i.z + 1, s), h = bwH(i.x, i.y + 1, i.z + 1, s), q = bwH(i.x + 1, i.y + 1, i.z + 1, s);
  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y), mix(mix(e, g, f.x), mix(h, q, f.x), f.y), f.z); }`;const noisyD=(x,y,z,n,d2)=>{const o=n*7.31;return Math.sqrt(d2)+(vn(x*9+o,y*9-o,z*9+o*.5,3)-.5)*.026+(vn(x*30-o,y*30+o,z*30,5)-.5)*.01};const GLSL_VORO=`
uniform vec3 uSeeds[${KS}];
float bwND(vec3 p, int n, float q){ float o = float(n) * 7.31; return sqrt(q) + (bwN(vec3(p.x * 9. + o, p.y * 9. - o, p.z * 9. + o * .5), 3) - .5) * .026 + (bwN(vec3(p.x * 30. - o, p.y * 30. + o, p.z * 30.), 5) - .5) * .01; }
int bwOwn; float bwEdge;
void bwVoro(vec3 p){
  float q0 = 1e9, q1 = 1e9, q2 = 1e9, q3 = 1e9; int n0 = 0, n1 = 0, n2 = 0, n3 = 0;
  for (int n = 0; n < ${KS}; n++) { vec3 d = uSeeds[n] - p; float q = dot(d, d);
    if (q < q3) { if (q < q2) { if (q < q1) { if (q < q0) { q3 = q2; n3 = n2; q2 = q1; n2 = n1; q1 = q0; n1 = n0; q0 = q; n0 = n; } else { q3 = q2; n3 = n2; q2 = q1; n2 = n1; q1 = q; n1 = n; } } else { q3 = q2; n3 = n2; q2 = q; n2 = n; } } else { q3 = q; n3 = n; } } }
  float d0 = bwND(p, n0, q0), d1 = bwND(p, n1, q1), d2 = bwND(p, n2, q2), d3 = bwND(p, n3, q3);
  float a = d0; int ia = n0; float b = 1e9;
  if (d1 < a) { b = a; a = d1; ia = n1; } else b = min(b, d1);
  if (d2 < a) { b = a; a = d2; ia = n2; } else b = min(b, d2);
  if (d3 < a) { b = a; a = d3; ia = n3; } else b = min(b, d3);
  bwOwn = ia; bwEdge = (b - a) * .5;
}
float bwErode(vec3 p, float edge){
  float nz = .62 * bwN(vec3(p.x * 6.5 + 3., p.y * 6.5, p.z * 6.5), 7) + .38 * bwN(vec3(p.x * 19., p.y * 19. + 5., p.z * 19.), 9);
  float e = clamp(.8 * clamp((nz - .5) * 2.3 + .5, 0., 1.) + .2, 0., 1.) * mix(.3, 1., smoothstep(0., .1, edge));
  return e + (bwN(p * 55., 13) - .5) * .16 + (bwN(p * 170., 17) - .5) * .07;
}`;const uDis=(f,u)=>Math.pow(fit(u,f.d0,f.d0+f.dd),ERP)*f.umax;const tq1=new THREE.Quaternion;function poseAt(f,u,pop,pos,q){const e1=sm(fit(u,0,.1)),E=ease(fit(u,.03,f.m1));pos.copy(f.c).addScaledVector(f.dir,f.popO*pop+f.o1*e1+f.o2*E).addScaledVector(UP,f.lift*E-f.drop*E*E);tq1.copy(qI).slerp(f.popQ,pop);q.copy(tq1).slerp(f.qr,sm(fit(u,.02,f.m1)))}const pM=new THREE.Matrix4,pP=new THREE.Vector3,pQ=new THREE.Quaternion,pS=new THREE.Vector3(1,1,1),pC=new THREE.Matrix4;function pieceMatrix(f,u,pop,out){poseAt(f,u,pop,pP,pQ);return out.compose(pP,pQ,pS).multiply(pC.makeTranslation(-f.c.x,-f.c.y,-f.c.z))}function cutMaterial(){const mat=new THREE.MeshStandardMaterial({color:BODY.clone(),roughness:.86,side:THREE.DoubleSide});const U={uDis:{value:0},uOpen:{value:0}};mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=sh.vertexShader.replace("void main() {","varying vec3 vLp;\nvoid main() {").replace("#include <begin_vertex>","#include <begin_vertex>\nvLp = position;");sh.fragmentShader=sh.fragmentShader.replace("void main() {",`uniform float uDis, uOpen; varying vec3 vLp;
${GLSL_NOISE}
float bwErode(vec3 p, float edge){
  float nz = .62 * bwN(vec3(p.x * 6.5 + 3., p.y * 6.5, p.z * 6.5), 7) + .38 * bwN(vec3(p.x * 19., p.y * 19. + 5., p.z * 19.), 9);
  float e = clamp(.8 * clamp((nz - .5) * 2.3 + .5, 0., 1.) + .2, 0., 1.) * mix(.3, 1., smoothstep(0., .1, edge));
  return e + (bwN(p * 55., 13) - .5) * .16 + (bwN(p * 170., 17) - .5) * .07;
}
void main() {
  if (uOpen < .01) discard;
  if (uDis > 0. && bwErode(vLp, 0.) < uDis) discard;`).replace("#include <color_fragment>",`#include <color_fragment>
  { float g1 = bwN(vLp * 260., 31), g2 = bwN(vLp * 90., 33); diffuseColor.rgb *= .9 + .1 * g1 + .06 * g2; }`)};mat.customProgramCacheKey=()=>"bw-cut";return{mat,U}}const bwCupShader=sh=>{sh.vertexShader=sh.vertexShader.replace("void main() {","varying vec3 vLp;\nvoid main() {").replace("#include <begin_vertex>","#include <begin_vertex>\nvLp = position;");sh.fragmentShader=sh.fragmentShader.replace("void main() {",`uniform int uOwn; uniform float uDis, uCrack, uCrackA; uniform vec3 uImp; varying vec3 vLp;
${GLSL_NOISE}
${GLSL_VORO}
void main() {
  bool need = uOwn >= 0 || uCrack > 0.;
  if (need) bwVoro(vLp); else { bwOwn = -1; bwEdge = 1.; }
  if (uOwn >= 0 && bwOwn != uOwn) discard;
  float er = uDis > 0. ? bwErode(vLp, bwEdge) : 9.;
  if (er < uDis) discard;
  float rim = (1. - smoothstep(uDis, uDis + .06, er)) * step(.001, uDis);`).replace("#include <color_fragment>",`#include <color_fragment>
  {
    float reach = length(vLp - uImp) * (.8 + .45 * bwN(vLp * 3.1, 23));
    float on = (1. - smoothstep(uCrack - .05, uCrack, reach)) * uCrackA;
    float fw = fwidth(bwEdge), w = max(.0022, fw * 1.15);
    float line = 1. - smoothstep(w * .45, w * 1.25, bwEdge);
    float halo = (1. - smoothstep(w * 1.25, w * 3.2, bwEdge)) * (1. - line);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16, .13, .11), line * on);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * .82, halo * on * .5);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.975, .97, .955), rim);
  }`).replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, .85, rim);").replace("#include <lights_physical_fragment>","#include <lights_physical_fragment>\n  material.clearcoat *= 1. - rim;")};

/* ===== 히어로 소리잔이 그 자리에서 그대로 깨진다 =====
   rewind에서 돌던 '히어로 장면'의 바로 그 소리잔(같은 재질·조명·그림자·카메라)이 금 가고, 벌어지고, 조각나 떨어진다.
   물레 화면은 이 동안 잔을 그리지 않고 먼지·물레·흙더미만 그린다 → 잔은 처음부터 끝까지 한 장면에서만 그려지므로 모습이 바뀌지 않는다.
   조각이 떨어질 때 물레 화면 카메라가 아래(물레)로 내려가는 움직임을 히어로 카메라에도 똑같이 옮겨, 조각과 먼지가 함께 움직인다.
   조각이 모두 사라진 뒤에는 히어로를 감춘다(배경색은 금이 가는 동안 물레 배경색으로 미리 맞춰 둠). */
const HB_END=FALL[0]+.97*(FALL[1]-FALL[0]);
const HB={s:null,last:0};window.__heroBreak=HB;
const sysOf=()=>window.__shatter;
// 물레 화면 쪽 기록: 카메라(깨지기 직전/지금), 잔 위치
const HC={cam0:new THREE.Matrix4(),camT:new THREE.Matrix4(),cupM:new THREE.Matrix4(),ok0:false,ok:false};
// 지금 잔을 히어로가 그리는지 — 히어로·물레·화면 전환이 모두 같은 기준(스크롤 위치·진행값)으로 판단
function hbUse(){
  const cl=document.getElementById("clay");
  return !!HB.s&&!reduced&&!!cl&&scrollY>=cl.offsetTop-.4*innerHeight&&rawT()<HB_END;
}
function hbBuild(){
  const sys=sysOf(),D=window.__kwangjuyoDebug;if(!D||!D.cup||!sys||!sys.ready||!sys.live||!sys.puff)return null;
  const nv=sys.glbGeo.attributes.position.count;let hm=null;
  D.cup.traverse(o=>{if(!hm&&o.isMesh&&o.geometry&&o.geometry.attributes.position&&o.geometry.attributes.position.count===nv)hm=o});
  if(!hm||!hm.parent)return null;
  let root=hm;while(root.parent)root=root.parent;
  const base=hm.material,prev=base.onBeforeCompile,pkey=base.customProgramCacheKey;
  // 히어로 잔의 재질을 그대로 복제(히어로 자체 셰이더 처리 포함) + 금·조각 셰이더만 덧붙임 → 금이 없을 때는 히어로 잔과 같은 픽셀
  const mk=own=>{const mat=base.clone();mat.side=THREE.DoubleSide;mat.transparent=false;
    const U={uSeeds:{value:sys.seeds},uOwn:{value:own},uDis:{value:0},uImp:{value:sys.IMP.clone()},uCrack:{value:0},uCrackA:{value:1}};
    mat.onBeforeCompile=function(sh,r){if(prev)prev.call(base,sh,r);Object.assign(sh.uniforms,U);bwCupShader(sh)};
    mat.customProgramCacheKey=()=>(pkey?String(pkey.call(base)):"")+"|hb-cup";return{mat,U}};
  const grp=new THREE.Group();grp.name="heroBreak";grp.matrixAutoUpdate=false;grp.visible=false;
  const w=mk(-1),whole=new THREE.Mesh(hm.geometry,w.mat);
  whole.castShadow=hm.castShadow;whole.receiveShadow=hm.receiveShadow;whole.frustumCulled=false;grp.add(whole);
  const P=[];
  for(const f of sys.live){
    if(!f.mesh||!f.cut)return null;
    const c=mk(f.n),mesh=new THREE.Mesh(f.mesh.geometry,c.mat);
    mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;mesh.visible=false;mesh.castShadow=hm.castShadow;mesh.receiveShadow=hm.receiveShadow;
    const ct=cutMaterial(),cut=new THREE.Mesh(f.cut.geometry,ct.mat);
    cut.matrixAutoUpdate=false;cut.frustumCulled=false;cut.visible=false;cut.castShadow=true;cut.receiveShadow=true;
    grp.add(mesh,cut);P.push({f,mesh,U:c.U,cut,CU:ct.U});
  }
  const puff=new THREE.Points(sys.puff.geometry,sys.puff.material.clone());puff.frustumCulled=false;puff.visible=false;grp.add(puff);
  hm.parent.add(grp);
  const s={hm,root,grp,whole,wU:w.U,P,puff,on:false,camSaved:null,camObj:null,warm:false};
  const ob=root.onBeforeRender,oa=root.onAfterRender;
  root.onBeforeRender=function(renderer,scene,camera){const r=ob?ob.apply(this,arguments):undefined;try{if(!s.warm)hbWarm(s,renderer,scene,camera);hbFrame(renderer,camera)}catch(e){if(!HB.err){HB.err=e;console.warn("[heroBreak]",e)}}return r};
  root.onAfterRender=function(){try{hbRestore()}catch(e){}return oa?oa.apply(this,arguments):undefined};
  return s;
}
// 깨지는 장면에 쓰는 셰이더를 미리 준비(처음 금이 갈 때 멈칫하지 않게)
function hbWarm(s,renderer,scene,camera){
  s.warm=true;if(!renderer||!renderer.compile)return;
  const hv=s.hm.visible;s.grp.visible=true;s.whole.visible=true;const p=s.P[0];if(p){p.mesh.visible=true;p.cut.visible=true}
  try{if(renderer.compileAsync)renderer.compileAsync(s.grp,camera,scene).catch(()=>{});else renderer.compile(s.grp,camera,scene)}catch(e){}
  s.grp.visible=false;if(p){p.mesh.visible=false;p.cut.visible=false}s.hm.visible=hv;
}
const hbM=new THREE.Matrix4(),hbQ=new THREE.Quaternion(),hbAx=new THREE.Vector3();
const hbA=new THREE.Matrix4(),hbB=new THREE.Matrix4(),hbC=new THREE.Matrix4();
function hbRestore(){
  const S=HB.s;if(!S||!S.camSaved)return;
  S.camObj.matrixWorld.copy(S.camSaved[0]);S.camObj.matrixWorldInverse.copy(S.camSaved[1]);S.camSaved=null;
}
function hbFrame(renderer,camera){
  const S=HB.s;if(!S)return;HB.last=performance.now();
  const T=curT();
  if(!hbUse()||T<=CRACK[0]){if(S.on){S.on=false;S.grp.visible=false;S.hm.visible=true}return}
  S.on=true;
  const cr=crackAt(T),pop=sm(fit(T,POP[0],POP[1])),u=fit(T,FALL[0],FALL[1]),split=pop>0||u>0;
  S.grp.matrix.copy(S.hm.matrix);
  const jolt=reduced?0:cr.jolt*(cr.k>=0&&cr.k<7?1:0);
  if(jolt>0){hbAx.set(Math.sin(cr.k*2.3),0,Math.cos(cr.k*1.7)).normalize();hbQ.setFromAxisAngle(hbAx,.012*jolt*(cr.k%2?1:-1));S.grp.matrix.multiply(hbM.makeRotationFromQuaternion(hbQ))}
  S.grp.visible=true;S.hm.visible=false;
  S.whole.visible=!split;S.wU.uCrack.value=cr.r*3.2;S.wU.uCrackA.value=1;
  for(const p of S.P){
    const f=p.f,d=uDis(f,u),vis=split&&d<UMAX-.01&&!(f.big&&u>.97);
    p.mesh.visible=p.cut.visible=vis;if(!vis)continue;
    pieceMatrix(f,u,pop,p.mesh.matrix);p.cut.matrix.copy(p.mesh.matrix);
    p.U.uDis.value=d;p.U.uCrack.value=cr.r*3.2;p.U.uCrackA.value=1-sm(fit(pop,.45,1));
    p.CU.uDis.value=d;p.CU.uOpen.value=pop;
  }
  // 작은 흙먼지(퍼프)도 같은 잔에서
  const pf=1-sm(fit(u,.86,.97)),PU=S.puff.material.uniforms;
  S.puff.visible=u>0&&pf>.001;
  if(S.puff.visible&&camera&&renderer){
    const zv=camera.view&&camera.view.enabled?camera.view.fullHeight/camera.view.height:1;
    PU.uT.value=u;PU.uOpacity.value=.05*pf;PU.uScale.value=renderer.domElement.height/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))*zv*(camera.zoom||1);
  }
  // 장면 행렬은 그리기 직전에 이미 계산되므로 여기서 바뀐 것을 바로 반영
  S.grp.updateMatrixWorld(true);
  // 조각이 떨어지는 동안: 물레 카메라가 움직인 만큼(잔 기준) 히어로 카메라도 똑같이 움직인다
  if(u>0&&camera&&HC.ok&&HC.ok0){
    // M: 물레 장면 → 히어로 장면(잔 기준으로 맞춤), Δ: 물레 카메라가 깨지기 직전부터 움직인 양
    hbA.copy(S.hm.matrixWorld).multiply(hbB.copy(HC.cupM).invert());
    hbC.copy(HC.camT).multiply(hbB.copy(HC.cam0).invert());
    hbB.copy(hbA).multiply(hbC).multiply(hbM.copy(hbA).invert());
    S.camObj=camera;S.camSaved=[camera.matrixWorld.clone(),camera.matrixWorldInverse.clone()];
    camera.matrixWorld.premultiply(hbB);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  }
}
// 물레 화면: 히어로가 잔을 그리는 동안은 자기 잔을 그리지 않고, 카메라·잔 위치만 기록
{
  const pb=THREE.Scene.prototype.onBeforeRender;
  THREE.Scene.prototype.onBeforeRender=function(renderer,scene,camera,rt){
    const out=pb.call(this,renderer,scene,camera,rt);
    if(renderer&&renderer.domElement&&renderer.domElement.id==="clay-gl"){try{
      const sys=sysOf();
      if(sys&&sys.cupG&&sys.cupG.parent){
        const u=fit(curT(),FALL[0],FALL[1]);
        camera.updateMatrixWorld();
        if(u<=0||!HC.ok0){HC.cam0.copy(camera.matrixWorld);HC.ok0=true}
        HC.camT.copy(camera.matrixWorld);HC.cupM.copy(sys.cupG.matrix);HC.ok=true;
        if(hbUse())sys.cupG.visible=false;
      }
    }catch(e){}}
    return out;
  };
}
(function hbDom(){
  if(reduced)return;
  const st=document.createElement("style");
  st.textContent="html.hb-on .hero-stage{opacity:1!important}"
    +"html.hb-on .hero-frame>:not(.hero-stage):not(.hero-rail),html.hb-on .hero-stage>:not(.hero-renderer),html.hb-on .hero-renderer>.hero-blob{visibility:hidden!important}"
    +"html.hb-on .hero-darkness{opacity:var(--hb-do,.985)!important;background:var(--hb-bg,#171411)!important}"
    +"html.hb-on .make-clay .make-stage{background-color:transparent!important}";
  document.head.appendChild(st);
  const R=document.documentElement;let was=false,lastB="";
  // 히어로 배경(#171411, 불투명도 .985)을 금이 가는 동안 물레 배경(#141110)으로 아주 천천히 맞춘다 → 히어로를 감출 때 배경이 튀지 않음
  const C0=[23,20,17],C1=[20,17,16];
  (function loop(){
    requestAnimationFrame(loop);
    if(!HB.s)HB.s=hbBuild();
    const on=hbUse();
    if(on!==was){
      // Update cup visibility before the DOM layer becomes visible on reverse scroll.
      hbFrame(null,null);
      was=on;R.classList.toggle("hb-on",on)
    }
    if(on){
      const b=sm(fit(curT(),CRACK[0],FALL[0])),c=C0.map((v,i)=>Math.round(v+(C1[i]-v)*b)).join(","),bk=c+"|"+b.toFixed(3);
      if(bk!==lastB){lastB=bk;R.style.setProperty("--hb-bg","rgb("+c+")");R.style.setProperty("--hb-do",(.985+.015*b).toFixed(4))}
    }
  })();
})();
