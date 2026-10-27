(function(){
var $=function(s){return document.querySelector(s)};
/* ===== BACKEND HOOKS – replace the bodies, keep the signatures ===== */
var API={
  createRoom:function(){return new Promise(function(r){setTimeout(function(){r({id:Math.random().toString(36).slice(2,12)})},300)})}, // POST /api/rooms -> {id}
  onChange:function(room,files){setSync('syncing…');clearTimeout(API._t);API._t=setTimeout(function(){setSync('synced')},400)}, // socket.emit('code-change',{room,files})
  onRemote:function(cb){/* socket.on('code-change',function(files){cb(files)}) */}
};
/* ================================================================== */
var files={html:'<h1>Hello, team!</h1>',css:'h1{font-family:sans-serif;color:#9a62b8}',js:"console.log('Welcome to CodersCollaboration!');"};
var defs=[['html','HTML','index.html'],['css','CSS','style.css'],['js','JS','script.js'],['console','Console'],['output','Output']];
var on={js:1,console:1},room='',main=$('#main'),tabs=$('#tabs'),log,out,cin;
function setSync(t){$('#sync').textContent=t}
defs.forEach(function(d,i){
  var b=document.createElement('button');b.dataset.k=d[0];b.innerHTML='<span>'+(i+1)+'</span>'+d[1];b.onclick=function(){toggle(d[0])};tabs.appendChild(b);
  var p=document.createElement('section');p.className='pane';p.dataset.k=d[0];
  if(files[d[0]]!==undefined){
    p.innerHTML='<div class="ph"><span><b>'+d[1]+'</b>'+d[2]+'</span><span class="n">1 ln</span></div><div class="ed"><div class="gut">1</div><textarea spellcheck="false" aria-label="'+d[2]+'"></textarea></div>';
    var ta=p.querySelector('textarea'),g=p.querySelector('.gut'),n=p.querySelector('.n');ta.value=files[d[0]];
    var upd=function(){var c=ta.value.split('\n').length;g.textContent=Array.from({length:c},function(_,j){return j+1}).join('\n');n.textContent=c+' ln'};
    ta.oninput=function(){files[d[0]]=ta.value;upd();API.onChange(room,files)};
    ta.onscroll=function(){g.scrollTop=ta.scrollTop};
    ta.onkeydown=function(e){if(e.key==='Tab'){e.preventDefault();document.execCommand('insertText',false,'  ')}};upd();
  }else if(d[0]==='console'){
    p.innerHTML='<div class="ph"><span>❯_ console <span id="cn">0</span></span><button id="cc">clear</button></div><div id="log"><div class="h">// Press Run or Ctrl + Enter.\n// Logs from your code land here.</div></div><input id="cin" placeholder="Type JS and press Enter to run it…" autocomplete="off">';
  }else{p.innerHTML='<div class="ph"><span>▶ output</span></div><iframe id="out" title="Output" sandbox="allow-scripts"></iframe>'}
  main.appendChild(p);
});
log=$('#log');out=$('#out');cin=$('#cin');var cnt=0;
function add(l,t){if(!cnt)log.innerHTML='';cnt++;$('#cn').textContent=cnt;var d=document.createElement('div');d.className=l;d.textContent=t;log.appendChild(d);log.scrollTop=1e9}
$('#cc').onclick=function(){cnt=0;$('#cn').textContent=0;log.innerHTML=''};
window.addEventListener('message',function(e){if(e.source===out.contentWindow&&e.data&&e.data.__c)add(e.data.l,e.data.a)});
cin.onkeydown=function(e){if(e.key==='Enter'&&cin.value.trim()){add('h','› '+cin.value);out.contentWindow.postMessage({__ev:cin.value},'*');cin.value=''}};
var shim='<script>(function(){function s(l,a){parent.postMessage({__c:1,l:l,a:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}["log","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k[0]==="l"?"":k[0],arguments)}});onerror=function(m){s("e",[m])};onmessage=function(e){if(e.data&&e.data.__ev){try{var r=(0,eval)(e.data.__ev);if(r!==undefined)s("",[r])}catch(x){s("e",[x.message])}}}})()<\/script>';
function run(){setSync('running…');out.srcdoc='<!doctype html><html><head><style>'+files.css+'</style>'+shim+'</head><body>'+files.html+'<script>'+files.js+'<\/script></body></html>';setTimeout(function(){setSync('synced')},300)}
$('#run').onclick=run;
function render(){var k=defs.map(function(d){return d[0]}).filter(function(x){return on[x]});
  document.querySelectorAll('.pane').forEach(function(p){p.style.display=on[p.dataset.k]?'flex':'none'});
  tabs.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',!!on[b.dataset.k])});
  main.style.gridTemplateColumns='repeat('+Math.max(k.length,1)+',minmax(0,1fr))';$('#pc').textContent=k.length+' pane'+(k.length===1?'':'s')}
function toggle(k){if(on[k]){if(Object.keys(on).length>1)delete on[k]}else on[k]=1;render()}
render();
addEventListener('keydown',function(e){if($('#app').style.display!=='flex')return;
  if(e.altKey&&/^Digit[1-5]$/.test(e.code)){e.preventDefault();toggle(defs[+e.code.slice(5)-1][0])}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}});
$('#theme').onclick=function(){$('#app').classList.toggle('light')};
$('#room').onclick=function(){var u=location.origin+'/code/'+room;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).catch(function(){}).then(function(){$('#cp').textContent='✓ copied';setTimeout(function(){$('#cp').textContent='⧉'},1400)})};
$('#exp').onclick=function(){var h='<!doctype html><html><head><meta charset="utf-8"><style>'+files.css+'</style></head><body>'+files.html+'<script>'+files.js+'<\/script></body></html>';var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));a.download='coderscollab-'+room+'.html';a.click()};
$('#home').onclick=function(){$('#app').style.display='none';document.body.style.overflow=''};
/* ===== START SESSION ANIMATION ===== */
var busy=false;
function open(){$('#rid').textContent='/code/'+room;$('#app').style.display='flex';document.body.style.overflow='hidden';render();run()}
function start(e){e.preventDefault();if(busy)return;busy=true;
  var ov=$('#ov'),x=e.clientX||innerWidth/2,y=e.clientY||innerHeight/2,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  API.createRoom().then(function(r){room=r.id;
    if(reduce||!window.gsap){open();busy=false;return}
    var idEl=$('#ovid'),bar=$('#ovb'),W=innerWidth,H=innerHeight,o={n:0},s='/code/'+room;idEl.textContent='';
    gsap.set(ov,{display:'grid',yPercent:0,clipPath:'circle(0% at '+x+'px '+y+'px)'});gsap.set(ov.firstChild,{opacity:0,scale:.9});gsap.set(bar,{width:0});
    gsap.set('#t1',{x:-120,y:H*.25,opacity:0});gsap.set('#t2',{x:W+60,y:H*.7,opacity:0});
    var tl=gsap.timeline({onComplete:function(){ov.style.display='none';busy=false}});
    tl.to(ov,{clipPath:'circle(150% at '+x+'px '+y+'px)',duration:.8,ease:'power3.in'})
      .to(ov.firstChild,{opacity:1,scale:1,duration:.4,ease:'back.out(2)'},'-=.1')
      .to('#t1',{opacity:1,x:W*.22,y:H*.32,duration:.9,ease:'power3.out'},'<')
      .to('#t2',{opacity:1,x:W*.66,y:H*.6,duration:.9,ease:'power3.out'},'<')
      .to(o,{n:s.length,duration:.7,ease:'none',onUpdate:function(){idEl.textContent=s.slice(0,Math.round(o.n))}},'<.1')
      .to(bar,{width:'100%',duration:.7,ease:'power1.inOut'},'<')
      .to(['#t1','#t2'],{x:W*.5-40,y:H*.5,duration:.55,ease:'power2.inOut'},'+=.1')
      .call(function(){open();gsap.from('#top,.pane,#sb',{y:30,opacity:0,duration:.6,stagger:.07,ease:'power3.out',delay:.35})})
      .to(ov,{yPercent:-100,duration:.75,ease:'power3.inOut'},'+=.05');
  });
}
document.querySelectorAll('a[href="https://coderscollaboration.onrender.com/"]').forEach(function(a){a.addEventListener('click',start)});
})();
