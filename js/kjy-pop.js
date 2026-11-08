/* 로딩 그림 등장(뾰잉)을 매끈하게 + 리뷰 강조색 */
(function(){
var st=document.createElement('style');
st.textContent=
/* 화면이 그려질 수 있게 된 뒤(.slg-go)에만 뾰잉을 시작한다. 그 전엔 보이지 않게 멈춰 둔다. */
'.sori-loader-graphic:not(.slg-go) .slg-all,.sori-loader-graphic:not(.slg-go) .slg-inner{animation-play-state:paused}'
+'.sori-loader-graphic:not(.slg-go) .slg-all{visibility:hidden}'
+'.sori-loader-graphic .slg-all,.sori-loader-graphic .slg-inner{backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:translateZ(0)}'
+'.sori-loader-graphic.slg-go .slg-all,.sori-loader-graphic.slg-go .slg-inner{animation-delay:.05s}'
+'@keyframes slg-pop{from{transform:translateZ(0) scale(.2)}to{transform:translateZ(0) scale(1)}}'
+'@media(prefers-reduced-motion:reduce){.sori-loader-graphic .slg-all{visibility:visible}}'
/* 리뷰 강조 단어 = 광주요 리뉴얼 포인트 컬러 */
+'html body .review-card em{color:#8fa9c4!important}'
/* 리뷰 문장 글자 크기 줄임: 데스크톱 1440px 기준 28px → 20px, 모바일 390px 기준 16px → 15px */
+'@media(min-width:768px){html body .review-card blockquote{font-size:clamp(16px,1.39vw,28px)!important}}'
+'@media(max-width:767px){html body .review-card blockquote{font-size:clamp(14px,3.8vw,18px)!important}}'
/* 아이보리 배경의 소나무 그림자는 하나만(겹쳐 보이던 두 번째 층 숨김) */
+'html body .kjy-pine-shadow.b{display:none!important}';
(document.head||document.documentElement).appendChild(st);
/* 3D 모델(.glb)은 로딩 그림의 등장이 끝난 뒤 읽는다(등장 중 메인 스레드가 막히지 않게).
   base64 풀기는 브라우저 기본 기능(data: URL)으로 빠르게. */
var base=window.fetch.bind(window),of=window.__kjyFetch0||base,loaded={},P={};
function load(n){return loaded[n]||(loaded[n]=new Promise(function(res,rej){var s=document.createElement('script');s.src='js/models-'+n+'.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)}))}
function dec(n){var c=window.__glbC||(window.__glbC={});if(c[n])return Promise.resolve(c[n]);if(P[n])return P[n];
  return P[n]=load(n).then(function(){if(c[n])return c[n];var s=window.__glb[n];
    return of('data:application/octet-stream;base64,'+s).then(function(r){return r.arrayBuffer()}).then(function(ab){return new Uint8Array(ab)},function(){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a})
    .then(function(a){c[n]=a;delete window.__glb[n];return a})})}
window.fetch=function(input,init){var u=typeof input==='string'?input:(input&&input.url)||String(input);var m=u.match(/assets\/models\/([\w-]+)\.glb(?:\?|$)/);
  if(!m)return base(input,init);var n=m[1];
  return Promise.resolve(window.__kjyPop).then(function(){return dec(n)}).then(function(a){return new Response(a.slice(),{status:200,headers:{'Content-Type':'model/gltf-binary'}})})};
})();
