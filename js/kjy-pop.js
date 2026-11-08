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
+'@media(max-width:767px){html body .review-card blockquote{font-size:clamp(14px,3.8vw,18px)!important}}';
(document.head||document.documentElement).appendChild(st);
/* 3D 모델(.glb)은 바로 내려받되, 해석은 로딩 그림의 등장이 끝난 뒤에 한다(등장 중 메인 스레드가 막히지 않게).
   모델은 assets/models/의 바이너리 파일을 그대로 받는다(예전 base64 JS보다 25% 작고, 문자열 해석·풀기 작업이 없다).
   옛 만화풍 손(sori-hand-grip)은 실사 손(kjy-hand.js)으로 바뀌어 화면에 나오지 않으므로 빈 장면만 돌려준다(4.6MB를 받지 않음). */
var base=window.fetch.bind(window),P={};
function emptyGlb(){var j=new TextEncoder().encode('{"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[]}]}'),n=(j.length+3)&~3,b=new Uint8Array(20+n),v=new DataView(b.buffer);
  v.setUint32(0,0x46546C67,true);v.setUint32(4,2,true);v.setUint32(8,b.length,true);v.setUint32(12,n,true);v.setUint32(16,0x4E4F534A,true);b.fill(32,20);b.set(j,20);return b}
window.fetch=function(input,init){var u=typeof input==='string'?input:(input&&input.url)||String(input);var m=u.match(/assets\/models\/([\w-]+)\.glb(?:\?|$)/);
  if(!m)return base(input,init);
  var n=m[1];   // 같은 모델을 여러 장면(히어로·물레·구슬 소리)이 동시에 요청해도 한 번만 받는다
  // 내려받기는 바로 시작하고(네트워크는 메인 스레드를 막지 않음), 해석은 로딩 그림 등장이 끝난 뒤에 넘긴다
  if(!P[n])P[n]=Promise.all([n==='sori-hand-grip'?emptyGlb().buffer:base(input,init).then(function(r){if(!r.ok)throw new Error(r.status+' '+u);return r.arrayBuffer()}),window.__kjyPop]).then(function(a){return a[0]});
  return P[n].then(function(ab){return new Response(ab.slice(0),{status:200,headers:{'Content-Type':'model/gltf-binary'}})})};
})();
