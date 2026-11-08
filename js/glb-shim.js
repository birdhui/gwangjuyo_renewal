/* 히어로 장면 번들(hero-scene.js)은 three를 자체 포함하고, 나머지 장면은 CDN three를 쓴다(서로 다른 canvas·렌더러라 충돌 없음).
   three가 이 조합을 볼 때마다 남기는 "Multiple instances" 경고만 걸러 콘솔을 깨끗하게 둔다. 다른 경고는 그대로 나온다. */
(function(){const w=console.warn;console.warn=function(m){if(typeof m==="string"&&m.indexOf("Multiple instances of Three.js")>=0)return;return w.apply(console,arguments)}})();
(function(){var st=document.createElement('style');st.textContent='@media(min-width:1441px){html{--f:calc(1 + (max(var(--k),1.3333) - 1.3333)*.375)}html .site-nav a{font-size:calc(clamp(11px,.83vw,24px)*var(--f))!important}html .hero-topline{font-size:calc(clamp(11px,1.25vw,28px)*var(--f))!important}html .hero-rail,html .hero-rail span{font-size:clamp(20px,calc(.9375vw - 4px),32px)!important}html .hero-focus-copy>p{font-size:clamp(24px,1.666667vw,64px)!important}html .hero-rail{justify-content:space-between!important;align-items:center!important;gap:0!important;padding-block:calc(20px*var(--k))!important}@media(min-width:2400px) and (max-width:2999px){html .hero-rail{justify-content:center!important;gap:32px!important;padding-inline:0!important}}}html .hero-focus-copy>p{max-width:none!important}html .hero-focus-left h2{line-height:1.24!important}html .hero-focus-copy>p{line-height:1.4!important}html .make-fire .make-stage{opacity:calc(var(--fire-o,0)*var(--fire-k,1))}@media (prefers-reduced-motion:no-preference){html .make-clay{height:2515svh}}html .clay-hint,html #clay .rewind-hud{display:none!important}html .site-nav a{font-weight:600}html .hero-topline{font-weight:600}@media(min-width:1441px) and (max-width:2559px){html .site-nav a{font-weight:600}html .hero-topline{font-size:calc(clamp(11px,1.25vw,28px)*var(--f))!important}html .hero-rail,html .hero-rail span{font-size:16px!important}html .hero-rail{gap:56px!important}}@media(min-width:768px) and (max-width:1199px){html .hero-focus-copy{grid-template-columns:minmax(0,1fr) minmax(0,30vw) minmax(0,1fr);align-items:center;padding:0 6%;gap:0}html .hero-focus-spacer{display:block}html .hero-focus-left h2{font-size:clamp(24px,2.9vw,38px)}html .hero-focus-copy>p{font-size:clamp(14px,1.6vw,21px);max-width:none}}';(document.head||document.documentElement).appendChild(st)})();
(function(){var st=document.createElement('style');st.textContent='.wc-floor{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse 44% 15% at 50% 79%,#3a312b 0%,transparent 100%)}.wc{position:absolute;inset:0;z-index:3;display:flex;align-items:center;pointer-events:none;visibility:hidden;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}.wc-a{justify-content:flex-end;padding-right:max(16px,4.2vw,env(safe-area-inset-right,0px))}.wc-b{justify-content:flex-start;padding-left:max(16px,5vw,env(safe-area-inset-left,0px))}.wc-box{display:flex;flex-direction:column;align-items:flex-start;max-width:clamp(320px,30vw,1180px);color:#fff;mix-blend-mode:difference}.wc-h{margin:0 0 clamp(14px,1.67vw,64px);font-weight:900;font-size:64px;line-height:.98;letter-spacing:-.05em;text-wrap:balance}.wc-h .wc-anim{display:flex;align-items:baseline;white-space:nowrap}.wc-h .wc-anim+.wc-anim{margin-top:.06em}.wc-sub{margin:0 0 clamp(12px,1.25vw,48px);font-weight:400;font-size:clamp(24px,1.458333333vw,56px);letter-spacing:-.025em;line-height:1.4}.wc-sub .wc-line{display:block;white-space:nowrap}@media(max-width:1599px){.wc-h{font-size:48px}.wc-sub{font-size:24px}}.wc-rule{width:clamp(80px,11.7vw,448px);height:clamp(2px,.105vw,4px);background:#fff;opacity:.8;margin:0 0 clamp(14px,1.67vw,64px)}.wc-p{margin:0;font-weight:300;font-size:clamp(14px,1.04vw,40px);line-height:1.68;letter-spacing:-.012em;opacity:.9;word-break:keep-all}.wc-anim{will-change:transform,opacity,filter;transform-origin:0 50%}@media(max-width:767px){.wc-h{font-size:32px}.wc-sub{font-size:16px}.wc{align-items:flex-end;padding-bottom:calc(9svh + env(safe-area-inset-bottom,0px))}.wc-a,.wc-b{justify-content:center}.wc-box{max-width:100%;align-items:center;text-align:center}.wc-h .wc-anim{justify-content:center}}@media(prefers-reduced-motion:no-preference){html #clay-gl{pointer-events:none}html .make-clay .make-stage{background:#141110}html .make-fire{height:140svh}html .make-fire .make-stage{display:none}}';(document.head||document.documentElement).appendChild(st)})();
(function(){var r=document.documentElement,k=function(){r.style.setProperty('--k',Math.min(2.6667,Math.max(1,innerWidth/1440)).toFixed(4))};k();addEventListener('resize',k,{passive:true})})();
(function(){var of=window.fetch.bind(window),loaded={};
function load(n){return loaded[n]||(loaded[n]=new Promise(function(res,rej){var s=document.createElement('script');s.src='js/models-'+n+'.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);}));}
window.fetch=function(input,init){var u=typeof input==='string'?input:(input&&input.url)||String(input);var m=u.match(/assets\/models\/([\w-]+)\.glb(?:\?|$)/);
if(!m)return of(input,init);
return load(m[1]).then(function(){var n=m[1],c=window.__glbC||(window.__glbC={});if(!c[n]){var b=atob(window.__glb[n]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);c[n]=a;delete window.__glb[n]}return new Response(c[n].slice(),{status:200,headers:{'Content-Type':'model/gltf-binary'}});});};})();
(function(){function go(){if(document.readyState!=='interactive'&&document.readyState!=='complete')return;document.removeEventListener('readystatechange',go);var m=document.getElementById('marble'),s=document.getElementById('scenery');if(m&&s&&s.parentNode)s.parentNode.insertBefore(m,s.nextSibling);if(m){var st=m.querySelector('.mb-stage');if(st){var keep=function(){var r=m.getBoundingClientRect(),L=innerHeight*.9,q=(-r.top+L)/(r.height-innerHeight+L);if(r.top>=innerHeight||r.bottom<=0){if(st.style.opacity!=='0')st.style.opacity='0';if(st.classList.contains('is-on'))st.classList.remove('is-on')}else if(q>.8){if(st.style.opacity!=='1')st.style.opacity='1';if(!st.classList.contains('is-on'))st.classList.add('is-on')}};new MutationObserver(keep).observe(st,{attributes:true,attributeFilter:['style','class']});addEventListener('scroll',keep,{passive:true})}}var fc=document.querySelector('.hero-focus-copy');if(fc){fc.setAttribute('aria-label','하나의 곡선에 쌓여온 시간');var L=['하나의 곡선에,','쌓여온 시간.'],R=['보기 좋은 형태를 넘어,','손에 닿는 감각과 쓰임까지.','한 잔의 균형을 찾아온 시간.'];var ls=fc.querySelectorAll('.hero-focus-left .focus-line>span'),rs=fc.querySelectorAll(':scope>p>.focus-line');for(var i=0;i<ls.length&&i<2;i++)ls[i].textContent=L[i];for(var i=0;i<rs.length;i++){if(i<3)rs[i].firstElementChild.textContent=R[i];else rs[i].parentNode.removeChild(rs[i])}}if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var ms=document.querySelector('#clay .make-stage'),cv=document.getElementById('clay-gl');if(ms&&cv){ms.insertAdjacentHTML('afterbegin','<div class="wc-floor" aria-hidden="true"></div>');cv.insertAdjacentHTML('afterend','<div class="wc wc-a"><div class="wc-box"><h2 class="wc-h"><span class="wc-anim">오래 남을 것의 시작.</span></h2><p class="wc-sub wc-anim">매일의 쓰임을 먼저 생각하는<br>광주요의 방식.</p></div></div><div class="wc wc-b"><div class="wc-box"><h2 class="wc-h"><span class="wc-anim">좋은 것은,</span><span class="wc-anim">작은 차이에서.</span></h2><p class="wc-sub wc-anim">눈에 띄지 않는 부분까지<br>세심하게 다듬습니다.</p></div></div>')}var d=function(){var e=document.createElement('script');e.type='module';e.src='js/director.js?v=20261108-r40';e.onload=function(){var h=document.createElement('script');h.type='module';h.src='js/herobreak.js?v=20261108-r40';document.head.appendChild(h)};document.head.appendChild(e)};if(window.gsap)d();else{var g=document.createElement('script');g.src='https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';g.onload=d;g.onerror=d;document.head.appendChild(g)}}}document.addEventListener('readystatechange',go);go()})();
(function(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;var R=document.documentElement,busy=false;function upd(){if(busy)return;var s=document.getElementById('sori-series'),h=document.getElementById('hero');if(!s||!h)return;busy=true;var ih=innerHeight,t=Math.max(0,Math.min(1,(scrollY-(s.offsetTop-.8*ih))/(.7*ih)));t=t*t*(3-2*t);var k=(1-t).toFixed(4);if(R.style.getPropertyValue('--fire-k')!==k)R.style.setProperty('--fire-k',k);var fo=parseFloat(R.style.getPropertyValue('--fire-o'))||0,co=parseFloat(R.style.getPropertyValue('--clay-o'))||0,so=1-Math.min(1,co+fo*(1-t));var cl=document.getElementById('clay');if((+window.__clayGone||0)>0&&cl&&scrollY>=cl.offsetTop)so=Math.min(so,t);so=so.toFixed(4);/* 물레가 암전되는 동안·가마가 나오기 전엔 히어로 잔을 다시 비추지 않는다(시리즈에 다가갈 때만) */if(h.style.getPropertyValue('--story-stage-opacity')!==so)h.style.setProperty('--story-stage-opacity',so);busy=false}function go(){var h=document.getElementById('hero');if(!h)return false;var mo=new MutationObserver(upd);mo.observe(R,{attributes:true,attributeFilter:['style']});mo.observe(h,{attributes:true,attributeFilter:['style']});addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);upd();return true}if(!go())document.addEventListener('DOMContentLoaded',go)})();
(function(){var st=document.createElement('style');st.textContent='::selection{background:#8FA9C4;text-shadow:none}::-moz-selection{background:#8FA9C4;text-shadow:none}';(document.head||document.documentElement).appendChild(st)})();
(function(){var st=document.createElement('style');st.textContent='html{scrollbar-width:none;-ms-overflow-style:none}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0}';(document.head||document.documentElement).appendChild(st)})();

/* ===== 시리즈 배경: 기존 무지개 테두리 발광 제거 + 비정형 블롭 ===== */
(function(){
  // 1) 3D 장면 마지막 패스의 가장자리 발광·물결 왜곡 제거(셰이더 문자열 치환) — 소리잔·손은 왜곡하지 않음
  try{
    const fix=s=>{
      if(typeof s!=="string"||s.indexOf("u_pulseCenter")<0||s.indexOf("glowColor")<0)return s;
      return s
        .replace("color += u_amount * glowColor * glow;","")
        .replace("color += wave * (d * 0.25 + d2 * 0.25 + glowColor * 0.05);","")
        .replace("float glowLuma = dot(glowColor, vec3(0.2126, 0.7152, 0.0722)) * glow * u_amount;","float glowLuma = 0.0;")
        .replace("base.a + glowLuma + wave * (d + d2 * 0.5 + 0.05)","base.a")
        .replace("v_uv + waveDir * smoothstep(0.0, 0.4, wd) * wave * -0.005","v_uv");
    };
    for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){
      if(!C)continue;const o=C.prototype.shaderSource;
      C.prototype.shaderSource=function(sh,src){return o.call(this,sh,fix(src))};
    }
  }catch(e){}
  // 2) 배경은 기존 블랙 브라운 단색, 블롭은 3D canvas 뒤 별도 레이어
  const st=document.createElement("style");
  st.textContent=".hero-darkness{background:#171411!important}.hero-blob{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;display:block;visibility:hidden}";
  document.head.appendChild(st);
  // 3) 블롭
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  // 시리즈별 [웜 · 중앙 · 쿨] — 구조는 같고 분위기만 달라짐
  const PAL=[
    [hex("#DCA36E"),hex("#8C827F"),hex("#8FA9C4")],   // 샴페인 앰버 · 웜 그레이 · 포슬린 블루
    [hex("#C99068"),hex("#86818A"),hex("#829BB2")],   // 킬른 앰버 · 청화 블루
    [hex("#D6AE7C"),hex("#878A80"),hex("#9BAE9F")]    // 청자빛 세이지
  ];
  const STARTS=[4.8,7.4,10,12.6,15.2,17.8];   // 소리잔 전환 시작(시리즈 진행 ×21)
  const MIDS=[5.3,7.9,10.5,13.1,15.7,18.3];   // 텍스처가 바뀌는 지점
  const TWEEN=1250;
  const VS="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS=`precision highp float;
uniform vec2 uRes,uCtr,uGeo;uniform float uT,uPx,uOp,uPulse,uSweep;uniform vec3 uW,uM,uC;
float hh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float wrap(float x){return atan(sin(x),cos(x));}
float lobe(float a,float c,float k){return pow(.5+.5*cos(a-c),k);}
float glob(float a,float c,float w){float d=wrap(a-c)/w;return exp(-d*d);}
vec2 toUV(vec2 P){
  vec2 v=(P-uCtr)/uGeo.x;v.x/=uGeo.y;
  return v-vec2(.010*sin(uT*.21),.008*cos(uT*.17));
}
float R(float a){
  float t=uT;
  float b=a+.05*sin(t*.09);
  float w=.2778+.0052*cos(b)-.0094*sin(b)-.0013*cos(2.*b)-.0209*sin(2.*b)-.0054*cos(3.*b)-.0042*sin(3.*b)+.0175*cos(4.*b)-.0059*sin(4.*b)+.0016*cos(5.*b)+.0029*sin(5.*b);
  w+=.009*sin(2.*a+t*.29+1.3*sin(t*.07))+.007*sin(3.*a-t*.21+2.)+.004*sin(5.*a+t*.43+.7)+.002*sin(7.*a-t*.37+1.1);
  return w*(1.+.03*sin(6.2831853*t/12.+.7*sin(a+.4)));
}
float F(vec2 P){vec2 v=toUV(P);return length(v)-R(atan(v.y,v.x));}
void main(){
  float t=uT,px=uPx,S=uGeo.x/900.;
  vec2 P=gl_FragCoord.xy;
  vec2 v=toUV(P);
  float r=length(v),a=atan(v.y,v.x);
  float rad=R(a),f=r-rad;
  float g=clamp(length(vec2(F(P+vec2(1.,0.))-f,F(P+vec2(0.,1.))-f)),.4/uGeo.x,1.3/uGeo.x);
  float dp=f/g;
  float dp2=(r-rad*(1.+.012*sin(3.*a+t*.37+1.)+.008*sin(6.*a-t*.29)))/g;
  // 빛나는 구간(천천히 이동)
  float ph=sin(t*.11),ph2=sin(t*.083+1.);
  float hUL=glob(a,2.2+.2*ph,.45)*1.2;
  float hBL=glob(a,-2.18-.15*ph2,.32)*1.1;
  float hLR=glob(a,-.95+.2*ph2,.30)*1.3;
  float hR=glob(a,.1-.2*ph,.5)*.08;
  float hT=glob(a,1.6+.2*ph2,.25)*.15;
  float trav=0.;
  float sweep=0.;
  float Hs=hUL+hBL+hLR+hR+hT;
  float flick=1.;
  float H=(.04+Hs*flick+trav+sweep)*1.;
  // 색
  float Hgl=(.04+(hUL+hLR+.35*hBL+hR+hT)*flick+trav+.4*sweep)*1.;
  float Hg=Hgl*Hgl/(Hgl+.25);
  float warm=smoothstep(-.5,.6,cos(a-2.45+.25*sin(t*.12)));
  vec3 ec=mix(uC,uW,warm);
  ec=max(mix(vec3(dot(ec,vec3(.299,.587,.114))),ec,mix(1.4,1.,warm)),0.);
  ec=mix(ec,uM,.25*(1.-abs(2.*warm-1.)));
  vec3 hot=mix(ec,vec3(1.,.98,.95),.55*clamp(H-.5,0.,1.));
  float dn=clamp(-f/rad,0.,1.);
  float inside=smoothstep(1.,-1.,dp);
  float din=max(max(-dp,-f*uGeo.x*.9),0.),dout=max(dp,0.);
  float cw=max(1.6*S,.9*px);
  float core=exp(-pow(dp/cw,2.));
  float gMid=exp(-abs(dp)/(7.*S));
  float core2=exp(-pow(dp2/(cw*.8),2.));
  float gIn=exp(-din/(mix(42.,65.,warm)*S))*inside*(1.-smoothstep(.35,.8,dn));
  float gOutN=exp(-dout/(13.*S))*(1.-inside);
  float gOutF=exp(-dout/(50.*S))*(1.-inside);
  float halo=exp(-dout/(160.*S))*(1.-inside);
  // 내부: 왼쪽 위 앰버 → 웜 그레이 → 오른쪽 아래 블루, 형태와 함께 흐름
  vec2 q=v/.278;
  float sd=dot(q,vec2(-.92,.36))*.85+.16*sin(q.x*1.7+q.y*1.1+t*.21)+.12*sin(q.y*2.3-q.x*.8-t*.16);
  sd=clamp(sd,-1.,1.);
  vec3 ic=sd>0.?mix(uM,uW,sd*.8):mix(uM,uC,min(1.,-sd*1.5));
  float plate=mix(.22,.66,.5+.5*sd)*(1.-.5*(1.-smoothstep(0.,.3,dn))*(1.-warm));
  vec3 c=ic*plate*inside
    +mix(ec,vec3(1.,.985,.95),clamp(H*.75,0.,.85))*core*(.05+1.8*H)
    +hot*gMid*.45*Hg
    +hot*core2*(.015+.30*H)
    +mix(ec,vec3(.95,.93,.9),.22*warm)*gIn*2.0*Hg*(1.+.3*(1.-warm))
    +hot*gOutN*.55*Hg*(1.25-.4*warm)
    +ec*gOutF*.30*Hg*(1.3-.6*warm)
    +mix(uM,uW,.6)*halo*1.05*(.10+.90*lobe(a,3.0,4.))*(.35+.65*min(Hs,1.));
  float m=max(max(c.r,c.g),c.b);c*=(1.-exp(-m*1.4))/max(m,1e-4);
  float al=clamp(max(max(c.r,c.g),c.b)*uOp,0.,1.);
  vec3 o=min(c*uOp,vec3(al));
  o+=(hh(P)-.5)/255.*step(.002,al);
  gl_FragColor=vec4(o,al);
}`;
  let cv=null,gl=null,U={},op=0,t0=performance.now();
  let idx=-1,zone=-1,cs=-1e9,ps=-1e9;
  let from=PAL[0].map(c=>c.slice()),to=PAL[0],cur=PAL[0].map(c=>c.slice());
  function init(){
    const hc=document.querySelector(".hero-renderer .hero-canvas");if(!hc)return false;
    cv=document.createElement("canvas");cv.className="hero-blob";cv.setAttribute("aria-hidden","true");
    hc.parentElement.insertBefore(cv,hc);
    gl=cv.getContext("webgl",{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:"low-power"});
    if(!gl){cv.remove();cv=null;return true}
    const sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);return s};
    const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){cv.remove();cv=null;gl=null;return true}
    gl.useProgram(pr);
    const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    for(const n of["uRes","uCtr","uGeo","uT","uPx","uOp","uPulse","uSweep","uW","uM","uC"])U[n]=gl.getUniformLocation(pr,n);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);
    return true;
  }
  const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  const mixv=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
  let dpr=1,W=0,H=0,dead=false;
  function size(){
    dpr=Math.min(window.devicePixelRatio||1,1.5);
    const w=Math.round(cv.clientWidth*dpr),h=Math.round(cv.clientHeight*dpr);
    if(w!==W||h!==H){W=cv.width=w;H=cv.height=h;gl.viewport(0,0,w,h)}
  }
  function frame(now){
    if(dead)return;
    requestAnimationFrame(frame);
    if(!cv||!cv.isConnected){
      cv=null;gl=null;U={};W=H=0;if(!init())return;if(!cv||!gl){dead=true;return}
    }
    const s=(window.__kwangjuyoSeriesProgress||0)*21;
    const target=sm(0,.6,s)*(1-sm(19.5,20.5,s));
    op+=(target-op)*.12;
    if(op<.004){cv.style.visibility="hidden";return}
    cv.style.visibility="visible";
    // 전환 시작 → 윤곽 빛이 살짝 강해졌다가 서서히 안정
    let z=0;for(const m of STARTS)if(s>m)z++;
    if(z!==zone){if(zone>=0)ps=now;zone=z}
    const pd=(now-ps)/1000,pulse=sm(0,.35,pd)*(1-sm(.6,2.4,pd));
    // 텍스처 전환 지점 → 약 1.25초 색 보간
    let k=0;for(const m of MIDS)if(s>m)k++;
    if(k!==idx){
      if(idx>=0){from=cur.map(c=>c.slice());cs=now;if(now-ps>2400)ps=now}
      idx=k;to=PAL[k%PAL.length];
    }
    const qq=Math.min(1,(now-cs)/TWEEN),e=qq*qq*(3-2*qq);
    cur=[0,1,2].map(i=>mixv(from[i],to[i],e));
    size();
    const st=sm(.8,1.6,W/H)*.45+1.25,u=Math.min(H,.85*W/(.62*st));
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.uRes,W,H);gl.uniform2f(U.uCtr,W*.485,H*.455);gl.uniform2f(U.uGeo,u,st);
    gl.uniform1f(U.uT,reduced?3:(now-t0)/1000);gl.uniform1f(U.uPx,dpr);gl.uniform1f(U.uOp,op);
    gl.uniform1f(U.uPulse,0.);gl.uniform1f(U.uSweep,Math.min(1,pd/1.8));
    gl.uniform3fv(U.uW,cur[0]);gl.uniform3fv(U.uM,cur[1]);gl.uniform3fv(U.uC,cur[2]);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  requestAnimationFrame(frame);
})();

/* ===== 레일 = 스크롤바 =====
   레일 자체를 body 최상단 층으로 옮겨 뒤 장면 canvas에 가려지지 않게 한다.
   레일 기둥과 겹치는 투명한 스크롤바 영역에서 입력을 받는다.
   - 레일(손잡이)을 잡고 끌면: 잡은 지점을 유지한 채 따라 움직임
   - 레일 위/아래 빈 곳을 누르면: 그 지점으로 레일이 이동(손잡이 가운데가 포인터로) 후 그대로 끌기 가능
   - 휠은 그대로 페이지 스크롤 */
(function(){
  if(window.__railDrag)return;window.__railDrag=1;
  const RAIL_H=200;          // script.js가 레일 위치 계산에 쓰는 높이(이동 가능 범위 = 화면 높이 - 200)
  const MIN_W=24;            // 레일이 가늘어져도 잡기 쉬운 최소 폭
  const st=document.createElement("style");
  st.textContent=".rail-scroll{position:fixed;top:0;right:0;height:100vh;width:"+MIN_W+"px;z-index:2147483000;background:transparent;touch-action:none;user-select:none;-webkit-user-select:none;cursor:pointer;display:none}"
    +".rail-scroll.on{display:block}.rail-scroll.over-thumb{cursor:grab}.rail-scroll.dragging{cursor:grabbing}"
    +"html.rail-dragging,html.rail-dragging *{user-select:none!important;-webkit-user-select:none!important;cursor:grabbing!important}"
    +"@media(max-width:767px){.rail-scroll{display:none!important}}";
  document.head.appendChild(st);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let bar=null,drag=null;
  const rail=()=>document.querySelector(".hero-rail");
  const span=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const room=()=>Math.max(1,innerHeight-RAIL_H);
  // script.js와 같은 식의 레일 위치(--rail-top)
  const railTop=()=>clamp(scrollY/span(),0,1)*room();
  function scrollToRailTop(top){
    window.scrollTo({top:Math.round(clamp(top/room(),0,1)*span()),behavior:"instant"});
  }
  function visible(r){
    if(!r||innerWidth<768)return false;
    const cs=getComputedStyle(r);
    if(cs.display==="none"||cs.visibility==="hidden"||+cs.opacity<.05)return false;
    const b=r.getBoundingClientRect();return b.width>0&&b.height>0;
  }
  function ensure(){
    const r=rail();
    if(r&&r.parentElement!==document.body)document.body.appendChild(r);
    if(!bar||!bar.isConnected){
      bar=document.createElement("div");bar.className="rail-scroll";bar.setAttribute("aria-hidden","true");
      document.body.appendChild(bar);bind(bar);
    }
    const on=visible(r);
    bar.classList.toggle("on",on||!!drag);
    if(on){
      const b=r.getBoundingClientRect();
      const w=Math.max(MIN_W,Math.ceil(innerWidth-b.left));
      if(bar.style.width!==w+"px")bar.style.width=w+"px";
    }
  }
  function bind(el){
    el.addEventListener("pointerdown",e=>{
      if(e.button!==undefined&&e.button!==0)return;
      const r=rail();if(!r||innerWidth<768)return;
      // 손잡이 위치는 화면 표시값(갱신이 한 박자 늦을 수 있음)이 아니라 현재 스크롤로 직접 계산
      const top=railTop(),h=r.getBoundingClientRect().height||RAIL_H;
      const onThumb=e.clientY>=top&&e.clientY<=top+h;
      // 손잡이를 잡았으면 잡은 지점 유지, 트랙을 눌렀으면 손잡이 가운데를 포인터로
      drag={off:onThumb?e.clientY-top:h/2};
      try{el.setPointerCapture(e.pointerId)}catch(_){}
      el.classList.add("dragging");document.documentElement.classList.add("rail-dragging");r.classList.add("is-drag");
      if(!onThumb)scrollToRailTop(e.clientY-drag.off);
      e.preventDefault();e.stopPropagation();
    });
    el.addEventListener("pointermove",e=>{
      if(drag){scrollToRailTop(e.clientY-drag.off);e.preventDefault();return}
      const r=rail();if(!r)return;const top=railTop(),h=r.getBoundingClientRect().height||RAIL_H;
      el.classList.toggle("over-thumb",e.clientY>=top&&e.clientY<=top+h);
    });
    const end=e=>{
      if(!drag)return;drag=null;
      el.classList.remove("dragging");document.documentElement.classList.remove("rail-dragging");
      const r=rail();if(r)r.classList.remove("is-drag");
      try{el.releasePointerCapture(e.pointerId)}catch(_){}
    };
    el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);el.addEventListener("lostpointercapture",end);
    el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation()});
  }
  function tick(){try{ensure()}catch(_){}requestAnimationFrame(tick)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",tick);else tick();
})();

/* ===== 소리잔은 하나 =====
   - rewind 구간에서 잔이 다가오는 확대는 히어로 '카메라'로 한다(setViewOffset: 잔의 중심을 기준으로 화면의 일부를 크게 보여줌).
     예전처럼 히어로 화면 요소를 CSS로 키우면, 히어로 엔진이 스크롤 때마다 화면 크기를 다시 재면서 확대된 크기를 진짜 크기로 착각해
     화면을 한 번 더 키운다 → 잔이 오른쪽 아래로 밀리고 커지며, 그때마다 화면을 다시 만들어 버벅인다. 그래서 CSS 확대는 쓰지 않는다.
   - 깨지는 장면은 히어로 잔의 화면 위치·크기(__kwangjuyoCupSil)와 회전(__kwangjuyoCupView)을 그대로 받아 같은 잔을 이어 그린다.
     히어로가 가려진 동안(물레 장면 쪽)에는 rewind 끝에서 잔이 완전히 멈췄을 때의 자세를 기억해 두었다가 준다. */
(function(){
  if(window.__heroZoom)return;window.__heroZoom=1;
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  // 히어로가 잔·카메라 객체를 알려주게 한다(히어로 코드에 원래 있는 디버그 통로: 주소에 cupdebug가 있으면 window.__kwangjuyoDebug에 넣어 준다)
  const ot=RegExp.prototype.test;
  RegExp.prototype.test=function(s){if(this.source==="[?&]cupdebug\\b"&&s===location.search)return true;return ot.call(this,s)};
  const MAX=.18;let S=1;
  const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  const heroHidden=()=>{const c=document.getElementById("clay");return !!c&&scrollY>=c.offsetTop-.4*innerHeight};
  let rest=null,calm=0,prevKey="",vkey="";
  let rawSil=window.__kwangjuyoCupSil||null;
  try{Object.defineProperty(window,"__kwangjuyoCupSil",{configurable:true,
    set(v){rawSil=v},
    get(){return rest&&heroHidden()?rest.sil:rawSil}});}catch(e){}
  let viewGet=null,mineV=null;
  function wrapView(){
    const d=Object.getOwnPropertyDescriptor(window,"__kwangjuyoCupView");
    if(!d||(d.get&&d.get===mineV)||!d.configurable)return;
    let store=d.get?null:d.value;
    const g=d.get?d.get:()=>store,s=d.get?d.set:v=>{store=v};
    viewGet=g;
    mineV=function(){return rest&&heroHidden()?rest.view.slice():g.call(window)};
    try{Object.defineProperty(window,"__kwangjuyoCupView",{configurable:true,get:mineV,set(v){if(s)s.call(window,v)}})}catch(e){}
  }
  // 잔 중심(확대 전 화면 좌표) 계산용 — 히어로 객체의 행렬 숫자만 읽는다
  const mul=(m,x,y,z)=>{const e=m.elements,w=e[3]*x+e[7]*y+e[11]*z+e[15];return[(e[0]*x+e[4]*y+e[8]*z+e[12])/w,(e[1]*x+e[5]*y+e[9]*z+e[13])/w,(e[2]*x+e[6]*y+e[10]*z+e[14])/w]};
  let meshRef=null,ctrL=null;
  function cupCenterPx(D){
    const cam=D.camera,size=D.size;if(!cam||!size||!(size.width>0))return null;
    if(!meshRef||!meshRef.parent){meshRef=null;D.cup.traverse(o=>{if(!meshRef&&o.isMesh&&o.geometry&&o.geometry.attributes.position)meshRef=o});if(!meshRef)return null;
      const g=meshRef.geometry;if(!g.boundingBox)g.computeBoundingBox();const b=g.boundingBox;ctrL=[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2,(b.min.z+b.max.z)/2]}
    meshRef.updateWorldMatrix(true,false);cam.updateMatrixWorld();
    const w=mul(meshRef.matrixWorld,ctrL[0],ctrL[1],ctrL[2]),c=mul(cam.matrixWorldInverse,w[0],w[1],w[2]);
    // 확대(뷰 오프셋) 없는 원래 투영으로 화면 위치
    const top=cam.near*Math.tan(cam.fov*Math.PI/360)/(cam.zoom||1),h=2*top,wd=cam.aspect*h,n=cam.near;
    const ndcX=(2*n/wd)*c[0]/(-c[2]),ndcY=(2*n/h)*c[1]/(-c[2]);
    return[(ndcX+1)/2*size.width,(1-ndcY)/2*size.height,size.width,size.height];
  }
  function tick(){
    requestAnimationFrame(tick);
    wrapView();
    const el=document.querySelector(".hero-renderer .hero-canvas");
    if(el&&(el.style.scale||el.style.translate)){el.style.scale="";el.style.translate="";el.style.transformOrigin=""}
    const k=innerWidth+"x"+innerHeight;if(k!==vkey){vkey=k;rest=null;calm=0}
    const D=window.__kwangjuyoDebug;const cam=D&&D.camera;
    const fire=document.getElementById("fire");
    const SMv=window.__kjySmooth&&window.__kjySmooth.__kwangjuyoHeroFocus;
    const f=typeof SMv==="number"?SMv:(+window.__kwangjuyoHeroFocus||0);
    const inRewind=!fire||scrollY<fire.offsetTop;
    const cur=inRewind?sm(0,1,f)*MAX:0;
    if(!cam){S=1;return}
    if(cur<.0004){S=1;if(cam.view&&cam.view.enabled)cam.clearViewOffset();return}
    const p=cupCenterPx(D);if(!p)return;
    S=1+cur;
    const [X,Y,W,H]=p;
    cam.setViewOffset(W,H,X-X/S,Y-Y/S,W/S,H/S);
    // rewind 끝 자세 기억
    const sil=rawSil;
    if(sil&&sil.h>8&&!heroHidden()&&(window.__kwangjuyoHeroTurnNow??0)>.9999&&f>.9999&&!(window.__kwangjuyoSeriesProgress>0)&&S===1+MAX){
      const v=viewGet?viewGet.call(window):window.__kwangjuyoCupView;
      const key=[sil.cx,sil.cy,sil.w,sil.h].map(n=>n.toFixed(1)).join()+"|"+(v?v.map(n=>n.toFixed(4)).join():"");
      calm=key===prevKey?calm+1:0;prevKey=key;
      if(calm>=8&&v)rest={sil:{cx:sil.cx,cy:sil.cy,w:sil.w,h:sil.h},view:v.slice()};
    }
  }
  requestAnimationFrame(tick);
})();

/* 물레 카피: 수평선 제거, 기존 모션 제거 → rewind처럼 한 글자씩 블러 페이드 */
(function(){
  const st=document.createElement("style");
  st.textContent=".wc-rule{display:none!important}.wc-anim{will-change:auto!important;transform:none!important;filter:none!important}.wc-line{display:inline}.wc-h .wc-anim .wc-line{display:block;white-space:nowrap}.wc-w{display:inline-block;white-space:nowrap}.wc-ch{display:inline-block;opacity:0;will-change:opacity,filter}";
  document.head.appendChild(st);
})();

/* ===== 히어로 소리잔 = 스크롤 위치로만 결정 =====
   히어로 장면은 회전(turn)·확대(focus)를 시간 보간(damp)으로 따라가서, 같은 스크롤 위치여도 내릴 때·올릴 때 잔의 자세가 달랐다.
   히어로가 읽는 목표값을 '보간을 거쳐도 목표에 바로 도달하는 값'으로 보정해 넘긴다(역보간).
   director.js가 같은 이름의 속성을 다시 정의해도 그 위에 다시 감싼다. 다른 코드가 읽을 때는 원래 값 그대로. */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const isHero=()=>{try{return new Error().stack.indexOf("hero-scene")>=0}catch(e){return false}};
  const rawVals={};
  const SM=window.__kjySmooth||(window.__kjySmooth={});
  function lead(name,rate,fromTurnNow,lo=0,hi=1,smoothK=0){
    let mine=null,x=null,last=0,lastV=0,ts=null;
    function install(){
      const d=Object.getOwnPropertyDescriptor(window,name);
      if(d&&d.get&&d.get===mine)return;
      if(d&&!d.configurable)return;
      let store=d&&!d.get?d.value:undefined;
      const ig=d&&d.get?d.get:()=>store,is=d&&d.get?d.set:v=>{store=v};
      mine=function(){
        const raw=ig.call(window);
        if(!isHero())return raw;
        let T=Math.min(hi,Math.max(lo,raw==null?lo:+raw||0));const n=performance.now();
        if(x!==null&&n-last<3)return lastV;
        const dt=Math.min(.05,Math.max(0,(n-last)/1000));last=n;
        // smoothK>0: 스크롤 목표를 시간에 따라 부드럽게 따라간 값(ts)을 히어로가 정확히 그리도록 한다(ORYZO처럼 부드럽게 커지고 돈다).
        // 멈추면 ts는 스크롤 위치의 값으로 정확히 수렴 → 같은 위치면 같은 자세.
        if(smoothK>0){ts=ts===null?T:ts+(T-ts)*(1-Math.exp(-smoothK*dt));if(Math.abs(T-ts)<1e-5)ts=T;T=ts;SM[name]=ts}
        if(fromTurnNow){const tn=window.__kwangjuyoHeroTurnNow;if(typeof tn==="number")x=tn}
        const a=1-Math.exp(-rate*dt);
        if(x===null||a<1e-4){x=T;lastV=T;return T}
        const v=Math.min(hi,Math.max(lo,x+(T-x)/a));
        x=x+(v-x)*a;lastV=v;return v;
      };
      try{Object.defineProperty(window,name,{configurable:true,get:mine,set(v){rawVals[name]=v;if(is)is.call(window,v)}})}catch(e){}
    }
    install();(function w(){install();requestAnimationFrame(w)})();
  }
  // 역보간 속도는 히어로 코드의 보간 속도(damp: focus 12, turn 10, series·scenery 11)와 정확히 같아야 한다.
  // 다르면(예전 4·5.5) 히어로가 목표를 넘어갔다 돌아오기를 매 프레임 반복해, 스크롤을 멈춰도 잔이 혼자 떨렸다.
  lead("__kwangjuyoHeroTurn",10,true,0,1,4.5);
  lead("__kwangjuyoHeroFocus",12,false,0,1,4.5);
  // 시리즈·풍경 진행값도 같은 방식: 아래 섹션에 갔다가 돌아올 때 히어로가 그 자세를 끌고 오지 않게
  lead("__kwangjuyoSeriesProgress",11,false);
  lead("__kwangjuyoSceneryVh",11,false,-1,14);
  lead("__kwangjuyoSceneryR",11,false,-1,14);
  // 마우스 시차(패럴랙스): rewind로 들어가면(focus>0) 끈다 → 소리잔은 스크롤로만 움직이고, 마우스 위치 때문에 자리가 바뀌지 않는다
  try{
    let rawP=window.__kwangjuyoPointer||{x:0,y:0};
    Object.defineProperty(window,"__kwangjuyoPointer",{configurable:true,
      set(v){rawP=v||{x:0,y:0}},
      get(){
        if(!isHero())return rawP;
        const f=Math.min(1,Math.max(0,+rawVals.__kwangjuyoHeroFocus||0)),t=Math.min(1,f/.15),k=1-t*t*(3-2*t);
        return k>=1?rawP:{x:rawP.x*k,y:rawP.y*k};
      }});
  }catch(e){}
  // 히어로는 화면에 걸친 섹션(히어로·rewind·시리즈·풍경)이 있을 때만 그린다. 아래에서 올라올 때 보이는 순간에 자리를 잡느라 움직이지 않도록,
  // 히어로가 쓰는 감지 범위를 화면 위아래로 1.5화면씩 넓혀 미리 그리기 시작하게 한다(보이기 전에 이미 같은 자세).
  // 깨지는 구간 표식: 물레 섹션 시작부터 12.2화면(금 → 벌어짐 → 조각이 모두 떨어질 때까지)
  let spanEl=null;
  function placeSpan(){const c=document.getElementById("clay");if(!c||!spanEl)return;const t=c.offsetTop+"px",h=Math.round(12.2*innerHeight)+"px";if(spanEl.style.top!==t)spanEl.style.top=t;if(spanEl.style.height!==h)spanEl.style.height=h}
  function breakSpan(){if(spanEl)return spanEl;if(!document.body||!document.getElementById("clay"))return null;spanEl=document.createElement("div");spanEl.id="hb-span";spanEl.setAttribute("aria-hidden","true");spanEl.style.cssText="position:absolute;left:0;top:0;width:1px;height:1px;pointer-events:none;visibility:hidden";document.body.appendChild(spanEl);placeSpan();addEventListener("resize",placeSpan);(function k(){placeSpan();setTimeout(k,1000)})();return spanEl}
  try{
    const OIO=window.IntersectionObserver;
    if(OIO&&!OIO.__heroWide){
      const W=function(cb,opts){let o=opts||{},hero=false;try{if(!o.rootMargin&&new Error().stack.indexOf("hero-scene")>=0){hero=true;o=Object.assign({},o,{root:o.root||document,rootMargin:"150% 0px 150% 0px"})}}catch(e){}const io=new OIO(cb,o);
        // 소리잔이 깨지는 구간(물레 섹션 앞부분)에서도 히어로가 계속 그려지도록 그 구간을 덮는 보이지 않는 표식도 함께 지켜본다
        if(hero){const ob=io.observe.bind(io);let added=false;io.observe=function(t){ob(t);if(!added){const s=breakSpan();if(s){added=true;ob(s)}}}}
        return io};
      W.prototype=OIO.prototype;W.__heroWide=1;window.IntersectionObserver=W;
    }
  }catch(e){}
  // 물레가 끝났는지(__clayGone)가 바뀌면 화면 전환 상태를 다시 계산하게 한다(레일 클릭 등으로 크게 점프해 돌아와도 물레 장면이 꺼진 채 남지 않게)
  let gone=window.__clayGone;
  (function g(){const v=window.__clayGone;if(v!==gone){gone=v;try{window.dispatchEvent(new Event("scroll"))}catch(e){}}requestAnimationFrame(g)})();
})();

/* ===== 히어로 소리잔: 멈춰 있을 땐 다시 그리지 않는다 =====
   히어로(소리잔) 화면은 매 프레임 그림자 지도(2048)와 잔을 새로 그린다. 스크롤을 멈춘 rewind에서는 카메라·잔·빛이 그대로라
   같은 그림을 계속 다시 그리는 셈 → GPU가 쉬지 못해 다른 화면까지 느려진다.
   카메라·보이는 물체·빛·재질 값이 앞 프레임과 같으면(연속 3프레임) 그리기를 건너뛴다. canvas는 마지막 그림을 그대로 보여 준다.
   시리즈 구간(손·텍스처 공개 효과 등 다른 값이 움직이는 곳)에서는 건너뛰지 않고, 안전하게 1초마다 한 번은 새로 그린다. */
(function(){
  if(window.__heroIdle)return;window.__heroIdle=1;
  const Q=1e5;let H=0;
  const add=v=>{H=Math.imul(H^Math.round((+v||0)*Q),16777619)>>>0};
  const addM=m=>{const e=m.elements;for(let i=0;i<16;i++)add(e[i])};
  function sig(scene,cam,r){
    H=2166136261;
    addM(cam.matrixWorld);addM(cam.projectionMatrix);
    add(r.domElement.width);add(r.domElement.height);add(scene.environmentIntensity);
    scene.traverseVisible(o=>{
      addM(o.matrixWorld);
      if(o.isLight){add(o.intensity);if(o.color){add(o.color.r);add(o.color.g);add(o.color.b)}if(o.groundColor){add(o.groundColor.r);add(o.groundColor.g);add(o.groundColor.b)}add(o.castShadow?1:0)}
      if(o.isMesh){
        const ms=Array.isArray(o.material)?o.material:[o.material];
        for(const m of ms){if(!m)continue;add(m.opacity);add(m.visible?1:0);const d=m.userData&&m.userData.dissolve;if(d){add(d.uDissolve.value);add(d.uDissolveMode.value)}}
        const mi=o.morphTargetInfluences;if(mi)for(let i=0;i<mi.length;i++)add(mi[i]);
      }
    });
    return H;
  }
  let scene=null,wrapped=null;
  function wrap(r){
    if(r.__kjyIdle)return;r.__kjyIdle=1;
    const orig=r.render;let last=-1,same=0,drawn=0;
    r.render=function(s,c){
      // 건너뛰기는 히어로·rewind 구간에서만. 소리잔이 깨지는 동안(html.hb-on)은 herobreak.js가 그리기 직전에
      // 카메라(물레 카메라를 따라 위로)·금·조각·가루를 바꾸므로 비교값에 잡히지 않는다 → 매 프레임 반드시 그린다.
      const cl=document.getElementById("clay");
      if(s!==scene||r.getRenderTarget()!==null||+window.__kwangjuyoSeriesProgress>0||document.documentElement.classList.contains("hb-on")||(window.__heroBreak&&window.__heroBreak.s&&window.__heroBreak.s.on)||(cl&&scrollY>=cl.offsetTop-.6*innerHeight)){same=0;last=-1;return orig.call(this,s,c)}
      // 건너뛰면 three가 render 안에서 하던 행렬 갱신도 빠지므로, 비교 전에 직접 갱신한다
      let k;try{if(s.matrixWorldAutoUpdate!==false)s.updateMatrixWorld();if(c.parent===null&&c.matrixWorldAutoUpdate!==false)c.updateMatrixWorld();k=sig(s,c,r)}catch(e){return orig.call(this,s,c)}
      if(k===last)same++;else{same=0;last=k}
      const now=performance.now();
      if(same>=3&&now-drawn<1000)return;
      drawn=now;return orig.call(this,s,c);
    };
  }
  (function hook(){
    const D=window.__kwangjuyoDebug;
    if(D&&D.cup){
      let sc=D.cup;while(sc.parent)sc=sc.parent;
      if(sc.isScene&&sc!==scene){
        scene=sc;const prev=sc.onBeforeRender;
        sc.onBeforeRender=function(r){if(r&&r.render&&!r.__kjyIdle)wrap(r);return prev&&prev.apply(this,arguments)};
      }
    }
    requestAnimationFrame(hook);
  })();
})();

/* ===== 깨지는 소리잔은 스크롤을 따라 위로 올라가며 사라진다 =====
   금이 간 잔이 벌어진 뒤 조각이 흩어지기 시작하는 순간(timeline.js FALL 시작, T=1.9)부터 히어로 잔 canvas를 스크롤한 만큼 그대로 위로 올린다.
   → 조각은 페이지와 함께 위로 빠져나가고, 물레 화면의 가루는 아래로 떨어지며 물레 섹션으로 넘어간다.
   (배경 막은 그대로 두고 잔이 그려진 canvas만 옮긴다. 다시 올라가면 0으로 돌아온다.)
   위치 계산은 timeline.js와 같은 식: s = scrollY/화면높이 − sideEnd, sideEnd = (물레 섹션 위치 − 0.3화면)/화면높이, T = 0.95 + s/3.5 */
(function(){
  return; // 꺼 둠: 잔 canvas만 따로 올리면 물레 화면의 가루와 벌어진다. 대신 breakwheel.js의 카메라 하강을 FALL 시작부터 스크롤에 맞춰 일으켜 잔·조각·가루가 함께 올라가게 했다.
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const S_POP=(1.9-.95)*3.5;   // 조각이 흩어지기 시작하는 순간(FALL 시작, T=1.9)
  let el=null,lastT="";
  (function loop(){
    requestAnimationFrame(loop);
    if(!el||!el.isConnected)el=document.querySelector(".hero-renderer .hero-canvas");
    if(!el)return;
    let px=0;
    const c=document.getElementById("clay");
    if(c&&document.documentElement.classList.contains("hb-on")){
      const ih=innerHeight,s=scrollY/ih-(c.offsetTop-.3*ih)/ih;
      px=Math.max(0,(s-S_POP)*ih);
    }
    const t=px>.5?"translate3d(0,"+(-px).toFixed(1)+"px,0)":"";
    if(t!==lastT){lastT=t;el.style.transform=t}
  })();
})();

/* ===== rewind 조명: 원래 조명보다 살짝만 진하게 (사용자 요청으로 강도를 크게 낮춤) =====
   rewind로 들어가면(히어로 focus) 주광(그림자를 만드는 방향광)을 더 세게, 더 옆에서 비추고
   채움빛(반구광·주변광·보조 방향광·환경광)은 낮춘다 → 잔이 돌 때 빛을 받는 면과 그늘진 면이 또렷하게 갈린다.
   히어로 코드가 매 프레임 정한 값 위에 그리기 직전에만 곱하고, 그린 뒤 원래 값으로 되돌린다(값이 쌓이지 않음).
   시리즈 구간으로 넘어가면 원래 조명으로 돌아간다. */
(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  const SIDE=[-1,.42,.2];{const l=Math.hypot(...SIDE);SIDE[0]/=l;SIDE[1]/=l;SIDE[2]/=l}
  let scene=null,lights=[],tick=0;const saved=[];let envSaved=null;
  function weight(){
    const S=window.__kjySmooth||{},f=typeof S.__kwangjuyoHeroFocus==="number"?S.__kwangjuyoHeroFocus:(+window.__kwangjuyoHeroFocus||0);
    return sm(.2,.6,f)*(1-sm(0,.06,+window.__kwangjuyoSeriesProgress||0));
  }
  function before(){
    if((tick++&63)===0||!lights.length){lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o)})}
    const k=weight();saved.length=0;envSaved=null;if(k<.002)return;
    for(const L of lights){
      if(!L.visible)continue;
      saved.push([L,L.intensity,L.position.x,L.position.y,L.position.z]);
      if(L.isDirectionalLight&&L.castShadow&&L.shadow&&L.shadow.mapSize.x>=2048){
        L.intensity*=1+.2*k;
        const t=L.target;t.updateMatrixWorld();const te=t.matrixWorld.elements,tx=te[12],ty=te[13],tz=te[14];
        let dx=L.position.x-tx,dy=L.position.y-ty,dz=L.position.z-tz;const len=Math.hypot(dx,dy,dz)||1;
        dx=dx/len+(SIDE[0]-dx/len)*.3*k;dy=dy/len+(SIDE[1]-dy/len)*.3*k;dz=dz/len+(SIDE[2]-dz/len)*.3*k;
        const l2=Math.hypot(dx,dy,dz)||1;L.position.set(tx+dx/l2*len,ty+dy/l2*len,tz+dz/l2*len);L.updateMatrixWorld();
      }else if(L.isHemisphereLight)L.intensity*=1-.2*k;
      else if(L.isAmbientLight)L.intensity*=1-.25*k;
      else if(L.isDirectionalLight)L.intensity*=1-.15*k;
    }
    if(typeof scene.environmentIntensity==="number"){envSaved=scene.environmentIntensity;scene.environmentIntensity*=1-.2*k}
  }
  function after(){
    for(const [L,i,x,y,z] of saved){L.intensity=i;if(L.position.x!==x||L.position.y!==y||L.position.z!==z){L.position.set(x,y,z);L.updateMatrixWorld()}}
    saved.length=0;if(envSaved!==null){scene.environmentIntensity=envSaved;envSaved=null}
  }
  (function hook(){
    const D=window.__kwangjuyoDebug;
    if(D&&D.cup){
      let sc=D.cup;while(sc.parent)sc=sc.parent;
      if(sc.isScene&&sc!==scene&&!sc.__kjyLight){
        scene=sc;sc.__kjyLight=1;lights=[];
        const pb=sc.onBeforeRender,pa=sc.onAfterRender;
        sc.onBeforeRender=function(){const r=pb?pb.apply(this,arguments):undefined;try{before()}catch(e){}return r};
        sc.onAfterRender=function(){try{after()}catch(e){}return pa?pa.apply(this,arguments):undefined};
      }
    }
    requestAnimationFrame(hook);
  })();
})();

/* ===== 스크롤 아이콘: 꺾쇠가 가운데에서 아래로 내려가며 살짝 잔상을 남긴다 (ORYZO와 같이) =====
   같은 꺾쇠 두 개를 조금씩 늦게, 더 옅게 따라오게 해서 내려갈 때 위쪽에 잔상이 보이게 한다. */
(function(){
  const st=document.createElement("style");
  st.textContent="html body .hero-scroll>span i,html body .s3d-scroll>span i{grid-area:1/1;display:block;width:36%;height:22%;background:currentColor;clip-path:polygon(0 23.4%,12.7% 0,49.8% 53.2%,86.9% 0,99.6% 23.4%,49.8% 94.9%);animation:kjy-chev-lo 1.75s linear infinite}"
    /* oryzo 스크롤 아이콘과 같은 움직임(사이트 코드 그대로): 화살표 두 개, 1.75초마다 처음 1초 동안 expoInOut으로
       아래 화살표는 0.5em 내려가며 사라지고, 0.5em 위에 있던 화살표가 내려오며 그 자리를 채운다 */
    +"html body .hero-scroll>span i.kjy-g1,html body .s3d-scroll>span i.kjy-g1{animation-name:kjy-chev-hi}"
    +"html body .hero-scroll>span i.kjy-g2,html body .s3d-scroll>span i.kjy-g2{display:none}"
    +"@keyframes kjy-chev-lo{0.00%{translate:0 0.00px;opacity:1.000}2.38%{translate:0 0.01px;opacity:0.999}4.76%{translate:0 0.01px;opacity:0.998}7.14%{translate:0 0.02px;opacity:0.997}9.52%{translate:0 0.03px;opacity:0.995}11.90%{translate:0 0.06px;opacity:0.991}14.29%{translate:0 0.10px;opacity:0.984}16.67%{translate:0 0.18px;opacity:0.972}19.05%{translate:0 0.32px;opacity:0.950}21.43%{translate:0 0.57px;opacity:0.912}23.81%{translate:0 1.01px;opacity:0.843}26.19%{translate:0 1.80px;opacity:0.719}28.57%{translate:0 3.20px;opacity:0.500}30.95%{translate:0 4.60px;opacity:0.281}33.33%{translate:0 5.39px;opacity:0.157}35.71%{translate:0 5.83px;opacity:0.088}38.10%{translate:0 6.08px;opacity:0.050}40.48%{translate:0 6.22px;opacity:0.028}42.86%{translate:0 6.30px;opacity:0.016}45.24%{translate:0 6.34px;opacity:0.009}47.62%{translate:0 6.37px;opacity:0.005}50.00%{translate:0 6.38px;opacity:0.003}52.38%{translate:0 6.39px;opacity:0.002}54.76%{translate:0 6.39px;opacity:0.001}57.14%{translate:0 6.40px;opacity:0.000}100.00%{translate:0 6.40px;opacity:0.000}}"
    +"@keyframes kjy-chev-hi{0.00%{translate:0 -6.40px;opacity:0.000}2.38%{translate:0 -6.39px;opacity:0.001}4.76%{translate:0 -6.39px;opacity:0.002}7.14%{translate:0 -6.38px;opacity:0.003}9.52%{translate:0 -6.37px;opacity:0.005}11.90%{translate:0 -6.34px;opacity:0.009}14.29%{translate:0 -6.30px;opacity:0.016}16.67%{translate:0 -6.22px;opacity:0.028}19.05%{translate:0 -6.08px;opacity:0.050}21.43%{translate:0 -5.83px;opacity:0.088}23.81%{translate:0 -5.39px;opacity:0.157}26.19%{translate:0 -4.60px;opacity:0.281}28.57%{translate:0 -3.20px;opacity:0.500}30.95%{translate:0 -1.80px;opacity:0.719}33.33%{translate:0 -1.01px;opacity:0.843}35.71%{translate:0 -0.57px;opacity:0.912}38.10%{translate:0 -0.32px;opacity:0.950}40.48%{translate:0 -0.18px;opacity:0.972}42.86%{translate:0 -0.10px;opacity:0.984}45.24%{translate:0 -0.06px;opacity:0.991}47.62%{translate:0 -0.03px;opacity:0.995}50.00%{translate:0 -0.02px;opacity:0.997}52.38%{translate:0 -0.01px;opacity:0.998}54.76%{translate:0 -0.01px;opacity:0.999}57.14%{translate:0 0.00px;opacity:1.000}100.00%{translate:0 0.00px;opacity:1.000}}"
    +"@media(prefers-reduced-motion:reduce){html body .hero-scroll>span i,html body .s3d-scroll>span i{animation:none}.kjy-g1,.kjy-g2{display:none!important}}";
  document.head.appendChild(st);
  function add(){document.querySelectorAll(".hero-scroll>span").forEach(sp=>{if(sp.querySelector(".kjy-g1"))return;["kjy-g1","kjy-g2"].forEach(c=>{const i=document.createElement("i");i.className=c;sp.appendChild(i)})})}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",add);else add();
})();

/* ===== '일상의 자리마다' 첫 흐름을 천천히 (script.js의 kjySceneryR와 짝) =====
   손·점선 상자·포장·큰 글자·포장 벗겨짐까지(처음 5.5화면)를 1.6배 길게 → 섹션도 그만큼(3.3화면) 길게.
   + 메뉴로 건너뛰거나 빠르게 내려왔을 때 히어로 글이 남아 다른 화면 위에 겹치지 않게, 히어로를 지나면 숨긴다. */
(function(){
  const st=document.createElement("style");
  st.textContent="@media (prefers-reduced-motion:no-preference){html .scenery{height:2150svh}}"
    +"html.kjy-past-hero :is(.hero-copy,.hero-topline,.hero-card,.hero-scroll){visibility:hidden!important}";
  document.head.appendChild(st);
  let on=null;const tick=()=>{const v=scrollY>innerHeight*1.3;if(v!==on){on=v;document.documentElement.classList.toggle("kjy-past-hero",v)}};
  addEventListener("scroll",tick,{passive:true});addEventListener("resize",tick);tick();
})();

/* ===== 마지막 이미지 갤러리 (ORYZO와 같이) =====
   - 화면에 보이는 사진들이 왼쪽 사진부터 차례로, 왼쪽→오른쪽으로 펼쳐지듯 나타난다(들어오는 스크롤에 맞춰).
   - 사진에 마우스를 올려도 확대되지 않는다.
   - 첫 사진의 제목은 가운데, 조금 아래로. 소리잔 뒤로 살짝 가려진다(잔만 오려 낸 같은 사진을 제목 위에 겹침).
   - 옆으로 넘어갈 때 제목은 사진보다 조금 느리게 움직인다.
   - 사진 높이를 조금 줄였다(80 → 72svh, 너비도 같은 비율로). */
(function(){
  const st=document.createElement("style");
  st.textContent="@media (min-width:768px){"
    +".editorial-item{height:72svh!important}"
    +".editorial-item.is-landscape{width:64.8vw!important}.editorial-item.is-portrait{width:26.1vw!important}.editorial-item:first-child{width:56.25vw!important}"
    +"}"
    +".editorial-item img{transform:scale(var(--kjy-rv-scale,1))!important;transition:none!important}"
    +".editorial-item:hover img{transform:scale(var(--kjy-rv-scale,1))!important}"
    +".editorial-item{clip-path:inset(0 calc(var(--kjy-rv-hide,0)*100%) 0 0)}"
    +".editorial-item figcaption{left:0!important;right:0!important;top:auto!important;bottom:63.5%;max-width:none!important;text-align:center;z-index:1!important;white-space:nowrap;transform:translate3d(calc(var(--gallery-x,0px)*-.3),0,0);will-change:transform}"
    +".editorial-item .kjy-cup-cut{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;pointer-events:none}"
    +"@media (prefers-reduced-motion:reduce){.editorial-item{clip-path:none}.editorial-item figcaption{transform:none}}";
  document.head.appendChild(st);
  function setup(){
    const g=document.getElementById("gallery");if(!g)return;
    const items=[...g.querySelectorAll(".editorial-item")];
    const first=items[0];
    // 같은 사진을 한 장 더 겹치고 소리잔 윤곽(사진 기준 좌표)만 남긴다 → 제목이 잔 뒤로 들어간다
    if(first&&!first.querySelector(".kjy-cup-cut")){
      const src=first.querySelector("img");const c=document.createElement("img");c.className="kjy-cup-cut";c.src=src.currentSrc||src.src;c.alt="";c.setAttribute("aria-hidden","true");c.decoding="async";first.appendChild(c);
      const P=[0.3932,0.3645,0.3949,0.3562,0.3997,0.3481,0.4076,0.3406,0.4183,0.3338,0.4315,0.3279,0.4468,0.3231,0.4637,0.3196,0.4817,0.3174,0.5003,0.3167,0.5189,0.3174,0.5369,0.3196,0.5538,0.3231,0.5691,0.3279,0.5823,0.3338,0.593,0.3406,0.6009,0.3481,0.6057,0.3562,0.6074,0.3645,0.6077,0.3645,0.6083,0.3879,0.6071,0.4145,0.6017,0.4463,0.5933,0.4782,0.5825,0.508,0.5694,0.5367,0.5574,0.5579,0.549,0.5739,0.5478,0.5951,0.552,0.6589,0.558,0.7014,0.5646,0.7311,0.5676,0.7439,0.5622,0.7535,0.5383,0.7588,0.5006,0.7609,0.4605,0.7588,0.4378,0.7535,0.433,0.7439,0.4366,0.7311,0.4432,0.7014,0.4492,0.6589,0.4533,0.5951,0.4528,0.5739,0.4444,0.5579,0.4318,0.5367,0.4187,0.508,0.4079,0.4782,0.3995,0.4463,0.3941,0.4145,0.3929,0.3879,0.3935,0.3645],IW=1672,IH=941;
      const fit=()=>{const w=first.clientWidth,h=first.clientHeight;if(!w||!h)return;const sc=Math.max(w/IW,h/IH),dx=(w-IW*sc)/2,dy=(h-IH*sc)/2;let pts=[];for(let i=0;i<P.length;i+=2)pts.push((dx+P[i]*IW*sc).toFixed(1)+"px "+(dy+P[i+1]*IH*sc).toFixed(1)+"px");c.style.clipPath="polygon("+pts.join(",")+")"};
      fit();addEventListener("resize",fit);if(window.ResizeObserver)new ResizeObserver(fit).observe(first);
    }
    if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    const sm=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t)};
    let last="";
    (function loop(){
      requestAnimationFrame(loop);
      const top=g.getBoundingClientRect().top,ih=innerHeight;
      if(top>ih*1.05||top<-ih*.5&&last==="done")return;
      const e=1-top/ih;           // 0: 갤러리 위가 화면 아래 끝, 1: 화면 위 끝
      const key=e.toFixed(4);if(key===last)return;last=e>=1.6?"done":key;
      items.forEach((it,i)=>{
        const k=Math.min(i,3),r=sm((e-.05-k*.13)/.55);
        it.style.setProperty("--kjy-rv-hide",(1-r).toFixed(4));
        it.style.setProperty("--kjy-rv-scale",(1+.08*(1-r)).toFixed(4));
      });
    })();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup();
})();
