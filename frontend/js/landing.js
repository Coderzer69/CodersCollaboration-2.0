(function(){
  var L=[
   ['a','<span class="c">// two people, one file</span>'],
   ['o','<span class="k">function</span> <span class="f">greet</span>(name) {'],
   ['a','  <span class="k">return</span> <span class="s">`Hello, ${name}!`</span>;'],
   ['o','}'],
   ['a','<span class="f">greet</span>(<span class="s">"world"</span>);']
  ];
  var box=document.getElementById('code'),rows=[];
  L.forEach(function(l,i){
    var d=document.createElement('div');d.className='ln';
    d.innerHTML='<b>'+(i+1)+'</b><span class="t"></span><span class="caret '+l[0]+'" data-n="'+(l[0]==='a'?'aman':'ornella')+'"></span>';
    box.appendChild(d);
    var plain=l[1].replace(/<[^>]+>/g,'');
    rows.push({el:d.querySelector('.t'),caret:d.querySelector('.caret'),html:l[1],n:plain.length});
  });
  function partial(html,n){ // reveal n visible chars while keeping tags valid
    var out='',vis=0,i=0;
    while(i<html.length&&vis<n){
      if(html[i]==='<'){var j=html.indexOf('>',i);out+=html.slice(i,j+1);i=j+1}
      else{out+=html[i];i++;vis++}
    }
    var open=(out.match(/<span/g)||[]).length-(out.match(/<\/span>/g)||[]).length;
    while(open-->0)out+='</span>';
    return out;
  }
  function showAll(){rows.forEach(function(r){r.el.innerHTML=r.html});var c=rows[rows.length-1].caret;c.classList.add('on')}
  var fa=document.getElementById('fa'),fo=document.getElementById('fo');
  var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce||!window.gsap){showAll();fa.style.display=fo.style.display='none';return}
  var ed=document.getElementById('ed');
  function pos(r,fx,fy){var b=r.getBoundingClientRect(),h=document.querySelector('.hero').getBoundingClientRect();return{x:b.left-h.left+b.width*fx,y:b.top-h.top+b.height*fy}}
  var W=innerWidth,Hh=document.querySelector('.hero').offsetHeight;
  gsap.set(fa,{x:-80,y:Hh*.45,opacity:0});gsap.set(fo,{x:W+40,y:Hh*.9,opacity:0});
  var tl=gsap.timeline({delay:.4});
  var e1=pos(ed,.18,.35),e2=pos(ed,.82,.7);
  tl.to(fa,{opacity:1,duration:.3},0).to(fo,{opacity:1,duration:.3},0)
    .to(fa,{x:e1.x,y:e1.y,duration:1.6,ease:'power3.inOut'},0)
    .to(fo,{x:e2.x,y:e2.y,duration:1.6,ease:'power3.inOut'},0)
    .to([fa,fo],{opacity:0,duration:.4},'+=.25');
  var t=tl.duration()-.5;
  rows.forEach(function(r,i){
    var o={p:0},dur=Math.max(.5,r.n*.045);
    tl.call(function(){rows.forEach(function(x){x.caret.classList.remove('on')});r.caret.classList.add('on')},null,t);
    tl.to(o,{p:r.n,duration:dur,ease:'none',onUpdate:function(){r.el.innerHTML=partial(r.html,Math.round(o.p))}},t);
    t+=dur+.25;
  });
})();
