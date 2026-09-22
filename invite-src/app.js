(function(){
"use strict";

/* ===================================================================
   CONFIG — the one place to edit.
   photos: Susmita, Ashish, the two of them — in deck order.
   `src` takes a data URI, or on GitHub Pages simply a file name
   sitting next to index.html (e.g. "susmita.jpg").
   =================================================================== */
var CONFIG = {
  photos: [
    { src: null },   // Susmita
    { src: null },   // Ashish
    { src: null }    // Susmita & Ashish
  ],
  shareUrl: "https://ash-z.github.io/myapp/",
  // RSVP backend: the Web app URL of the Google Apps Script in
  // invite-src/rsvp/Code.gs (ends in /exec). null = RSVPs not open yet.
  rsvp: { endpoint: null },
  shareText: "Sai Susmita weds Ashish — Thursday, 29 October 2026, Visakhapatnam."
};

var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
var T = window.THREE;
var root = document.documentElement;
function $(s){ return document.querySelector(s); }
function $$(s){ return [].slice.call(document.querySelectorAll(s)); }
function css(n){ return getComputedStyle(root).getPropertyValue(n).trim(); }
function clamp(v,a,b){ return v < a ? a : v > b ? b : v; }
function buzz(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }

/* =============== PALETTE =============== */
(function palette(){
  var bI = $('#palIvory'), bJ = $('#palJewel');
  function themeMeta(){
    var m = document.querySelector('meta[name="theme-color"]');
    if(!m){ m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = css('--bg');
  }
  function apply(mode, remember){
    root.setAttribute('data-theme', mode === 'jewel' ? 'dark' : 'light');
    bI.setAttribute('aria-pressed', String(mode !== 'jewel'));
    bJ.setAttribute('aria-pressed', String(mode === 'jewel'));
    if(remember){ try{ localStorage.setItem('sa-pal', mode); }catch(e){} }
    themeMeta();
  }
  var start = null;
  try{ start = localStorage.getItem('sa-pal'); }catch(e){}
  if(!start) start = matchMedia('(prefers-color-scheme: dark)').matches ? 'jewel' : 'ivory';
  apply(start, false);
  bI.addEventListener('click', function(){ apply('ivory', true); buzz(6); });
  bJ.addEventListener('click', function(){ apply('jewel', true); buzz(6); });
})();

/* ===================================================================
   FX — one overlay canvas for akshintalu and marigold petals.
   Runs only while something is in the air.
   =================================================================== */
var fx = (function(){
  var cv = $('#fx'), noop = function(){};
  if(!cv || !cv.getContext) return { shower:noop, burst:noop };
  var g = cv.getContext('2d'), P = [], raf = 0, W = 0, H = 0, last = 0;
  var GRAIN = ['#E9B52C','#F2C94C','#DFA01E','#F4E3B5','#C8452F'];
  var PETAL = ['#F2A413','#E8821A','#F6C23B','#D9531E'];
  function size(){
    var d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    g.setTransform(d,0,0,d,0,0);
  }
  addEventListener('resize', size); size();

  function add(x, y, vx, vy, kind){
    if(P.length > 700) return;
    var petal = kind === 'petal';
    P.push({
      x:x, y:y, vx:vx, vy:vy, kind:kind,
      r:Math.random()*6.283, vr:(Math.random()-0.5)*(petal ? 5 : 12),
      w: petal ? 5.5 + Math.random()*4 : 2.3 + Math.random()*1.3,
      h: petal ? 2.8 + Math.random()*1.8 : 1 + Math.random()*0.5,
      c: petal ? PETAL[Math.random()*4|0] : GRAIN[Math.random()*5|0],
      sw: Math.random()*6.283
    });
  }
  function step(t){
    var dt = Math.min(0.033, (t - last)/1000 || 0.016); last = t;
    g.clearRect(0,0,W,H);
    for(var i = P.length - 1; i >= 0; i--){
      var p = P[i];
      if(p.kind === 'petal'){
        p.vy = Math.min(p.vy + 240*dt, 130);
        p.vx *= Math.pow(0.95, dt*60);
        p.sw += dt*3.2;
        p.x += Math.sin(p.sw)*34*dt;
      } else {
        p.vy = Math.min(p.vy + 640*dt, 520);
        p.vx *= Math.pow(0.985, dt*60);
      }
      p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.vr*dt;
      if(p.y > H + 30){ P.splice(i,1); continue; }
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.fillStyle = p.c; g.beginPath(); g.ellipse(0,0,p.w,p.h,0,0,6.283); g.fill();
      g.restore();
    }
    if(P.length) raf = requestAnimationFrame(step);
    else { raf = 0; g.clearRect(0,0,W,H); }
  }
  function kick(){ if(!raf){ last = performance.now(); raf = requestAnimationFrame(step); } }

  return {
    shower: function(n){
      if(reduced) return;
      for(var i = 0; i < n; i++){
        add(Math.random()*W, -20 - Math.random()*H*0.6, (Math.random()-0.5)*50,
            60 + Math.random()*200, Math.random() < 0.14 ? 'petal' : 'grain');
      }
      kick();
    },
    burst: function(x, y, n, kind){
      if(reduced) return;
      for(var i = 0; i < n; i++){
        var a = -Math.PI/2 + (Math.random()-0.5)*1.6;
        var k = kind === 'mix' ? (Math.random() < 0.3 ? 'petal' : 'grain') : kind;
        var s = (k === 'petal' ? 170 : 300) + Math.random()*240;
        add(x, y, Math.cos(a)*s, Math.sin(a)*s, k);
      }
      kick();
    }
  };
})();

/* ===================================================================
   TILT — tickets (and the photo deck, gently) lean with the phone.
   Desktop follows the mouse instead. iOS asks permission on a tap.
   =================================================================== */
var tiltTargets = $$('[data-tilt], #deck'), tiltAsked = false, tiltPending = false;
function setTilt(el, x, y){
  el.style.setProperty('--rx', (x*9).toFixed(2));
  el.style.setProperty('--ry', (-y*7).toFixed(2));
  el.style.setProperty('--fx', x.toFixed(3));
  el.style.setProperty('--fy', y.toFixed(3));
}
function onOrient(e){
  if(e.gamma == null || e.beta == null) return;
  var x = clamp(e.gamma/22, -1, 1), y = clamp((e.beta - 45)/22, -1, 1);
  if(tiltPending) return;
  tiltPending = true;
  requestAnimationFrame(function(){
    tiltPending = false;
    tiltTargets.forEach(function(t){ setTilt(t, x, y); });
  });
}
function enableTilt(){
  if(tiltAsked || reduced) return;
  tiltAsked = true;
  var D = window.DeviceOrientationEvent;
  if(!D) return;
  try{
    if(typeof D.requestPermission === 'function'){
      D.requestPermission().then(function(s){ if(s === 'granted') addEventListener('deviceorientation', onOrient); }).catch(function(){});
    } else addEventListener('deviceorientation', onOrient);
  }catch(e){}
}
(function tilt(){
  if(reduced) return;
  $$('[data-tilt]').forEach(function(t){
    t.addEventListener('pointermove', function(e){
      if(e.pointerType === 'touch') return;
      var r = t.getBoundingClientRect();
      setTilt(t, ((e.clientX - r.left)/r.width - 0.5)*2, ((e.clientY - r.top)/r.height - 0.5)*2);
    });
    t.addEventListener('pointerleave', function(){ setTilt(t, 0, 0); });
  });
  var D = window.DeviceOrientationEvent;
  if(D && typeof D.requestPermission === 'function') addEventListener('click', enableTilt, { once:true });
  else enableTilt();
})();

/* ===================================================================
   OPENING — a kolam seal, then the invitation slides away to the sea.
   =================================================================== */
function buildSeal(host){
  if(!host) return [];
  var NS = 'http://www.w3.org/2000/svg';
  var s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 200 200');
  s.setAttribute('aria-hidden', 'true');
  host.insertBefore(s, host.firstChild);
  var cx = 100, cy = 100, drawn = [];
  function el(tag, a, stroke, w, draw){
    var n = document.createElementNS(NS, tag);
    for(var k in a) n.setAttribute(k, a[k]);
    n.style.fill = 'none'; n.style.stroke = stroke; n.style.strokeWidth = w;
    n.style.strokeLinecap = 'round'; n.style.strokeLinejoin = 'round';
    s.appendChild(n);
    if(draw) drawn.push(n);
    return n;
  }
  function petal(ang, r0, r1, wid, stroke, w){
    var mr = (r0 + r1)/2;
    var sx = cx + r0*Math.cos(ang), sy = cy + r0*Math.sin(ang);
    var tx = cx + r1*Math.cos(ang), ty = cy + r1*Math.sin(ang);
    var c1x = cx + mr*Math.cos(ang + wid), c1y = cy + mr*Math.sin(ang + wid);
    var c2x = cx + mr*Math.cos(ang - wid), c2y = cy + mr*Math.sin(ang - wid);
    el('path', { d:'M'+sx.toFixed(1)+' '+sy.toFixed(1)+' Q'+c1x.toFixed(1)+' '+c1y.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1)+
                   ' Q'+c2x.toFixed(1)+' '+c2y.toFixed(1)+' '+sx.toFixed(1)+' '+sy.toFixed(1) }, stroke, w, true);
  }
  el('circle', { cx:cx, cy:cy, r:58 }, 'var(--gold)', 0.9, true);
  el('circle', { cx:cx, cy:cy, r:52 }, 'var(--gold)', 0.5, true);
  for(var i = 0; i < 24; i++) petal(i/24*Math.PI*2, 60, 92, 0.1, 'var(--gold)', 1.1);
  for(var j = 0; j < 8; j++)  petal((j + 0.5)/8*Math.PI*2, 60, 78, 0.16, '#6A9A6E', 1);
  for(var k2 = 0; k2 < 36; k2++){
    var a = k2/36*Math.PI*2;
    var d = document.createElementNS(NS, 'circle');
    d.setAttribute('cx', (cx + 97*Math.cos(a)).toFixed(1));
    d.setAttribute('cy', (cy + 97*Math.sin(a)).toFixed(1));
    d.setAttribute('r', k2 % 3 === 0 ? 2 : 1.2);
    d.style.fill = k2 % 3 === 0 ? 'var(--accent)' : 'var(--gold)';
    s.appendChild(d);
  }
  return drawn;
}

(function opening(){
  var sp = $('#splash'), btn = $('#openBtn'), seal = $('#seal');
  var app = $('#app'), tabs = $('#tabs'), pal = $('#pal');
  var drawn = buildSeal(seal);
  if(!root.classList.contains('locked')){ if(sp) sp.hidden = true; return; }

  [app, tabs, pal].forEach(function(e){ if(e) e.inert = true; });

  if(!reduced){
    drawn.forEach(function(p, i){
      var len = 0; try{ len = p.getTotalLength(); }catch(e){}
      if(!len) return;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.3,.8,.3,1) ' + (0.2 + i*0.035) + 's';
    });
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      drawn.forEach(function(p){ p.style.strokeDashoffset = 0; });
    }); });
  }

  var done = false;
  function finish(){
    root.classList.remove('locked');
    root.classList.add('opened');
    sp.hidden = true;
  }
  function open(){
    if(done) return; done = true;
    buzz(12); enableTilt();
    root.classList.add('ui');
    [app, tabs, pal].forEach(function(e){ if(e) e.inert = false; });
    try{ sessionStorage.setItem('sa-opened', '1'); }catch(e){}
    if(reduced){ finish(); return; }
    sp.classList.add('opening');
    setTimeout(function(){ sp.classList.add('gone'); }, 360);
    setTimeout(finish, 1400);
  }
  btn.addEventListener('click', open);
  seal.addEventListener('click', open);
})();

/* ===================================================================
   TAB BAR + SCREEN TRANSITIONS
   A tap blooms the next screen open from the tab itself; its content
   then drifts in piece by piece. Browsers without view transitions
   get a quick veil instead; reduced motion jumps straight there.
   =================================================================== */
function replay(screen){
  var items = [].slice.call(screen.querySelectorAll('.reveal'));
  items.forEach(function(n, i){ n.classList.remove('in'); n.style.setProperty('--rd', (0.28 + i*0.09).toFixed(2) + 's'); });
  void screen.offsetWidth;
  requestAnimationFrame(function(){ items.forEach(function(n){ n.classList.add('in'); }); });
  setTimeout(function(){ items.forEach(function(n){ n.style.removeProperty('--rd'); }); }, 1800);
}
function jumpTo(t){
  var prev = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY);
  root.style.scrollBehavior = prev;
}
function goTo(t, from){
  if(!t) return;
  if(reduced){ jumpTo(t); return; }
  var r = from ? from.getBoundingClientRect() : null;
  var x = r ? r.left + r.width/2 : innerWidth/2;
  var y = r ? r.top + r.height/2 : innerHeight - 50;
  if(document.startViewTransition){
    root.style.setProperty('--vx', x + 'px');
    root.style.setProperty('--vy', y + 'px');
    root.style.setProperty('--vr', (Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 110) + 'px');
    try{
      document.startViewTransition(function(){ jumpTo(t); replay(t); });
    }catch(e){ jumpTo(t); replay(t); }
    fx.burst(x, y - 10, 14, 'petal');
    return;
  }
  var veil = $('#veil');
  if(!veil){ jumpTo(t); replay(t); return; }
  veil.classList.add('on');
  setTimeout(function(){ jumpTo(t); replay(t); veil.classList.remove('on'); }, 230);
}

(function tabbar(){
  var links = $$('.tabs a');
  links.forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      goTo(document.getElementById(a.hash.slice(1)), a);
      try{ history.replaceState(null, '', a.hash); }catch(err){}
      buzz(6);
    });
  });
  if(!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      links.forEach(function(a){ a.setAttribute('aria-current', String(a.hash === '#' + e.target.id)); });
    });
  }, { rootMargin:'-48% 0px -48% 0px' });
  $$('.screen').forEach(function(s){ io.observe(s); });
})();

/* =============== EVENTS — swipe between the two tickets =============== */
(function eventTickets(){
  var strip = $('#tickets'), seg = $('#seg');
  if(!strip || !seg) return;
  var tabs = [].slice.call(seg.querySelectorAll('button'));
  var cards = [].slice.call(strip.querySelectorAll('.ticket'));
  var current = 0;
  function mark(i){
    if(i === current) return;
    current = i;
    seg.style.setProperty('--seg', i);
    tabs.forEach(function(b, k){ b.setAttribute('aria-selected', String(k === i)); });
  }
  function show(i){
    var c = cards[i];
    strip.scrollTo({ left: c.offsetLeft - (strip.clientWidth - c.clientWidth)/2, behavior: reduced ? 'auto' : 'smooth' });
    mark(i); buzz(6);
  }
  tabs.forEach(function(b, i){ b.addEventListener('click', function(){ show(i); }); });
  var pend = false;
  strip.addEventListener('scroll', function(){
    if(pend) return; pend = true;
    requestAnimationFrame(function(){
      pend = false;
      var mid = strip.scrollLeft + strip.clientWidth/2, best = 0, dist = 1e9;
      cards.forEach(function(c, i){
        var d = Math.abs(c.offsetLeft + c.clientWidth/2 - mid);
        if(d < dist){ dist = d; best = i; }
      });
      mark(best);
    });
  }, { passive:true });
})();

/* ===================================================================
   THE DECK — swipe, tap, or arrow-key through the photographs.
   Her card lands with a burst of marigold; his arrives quietly.
   =================================================================== */
(function deckCards(){
  var deck = $('#deck');
  if(!deck) return;
  var cards = [].slice.call(deck.querySelectorAll('.card'));
  var dots  = $$('#dots .dot'), cue = $('#swipeCue');

  cards.forEach(function(c, i){
    var p = CONFIG.photos[i];
    if(!p || !p.src) return;
    var face = c.querySelector('.card-face'), img = new Image();
    img.alt = ''; img.decoding = 'async'; img.src = p.src;
    face.insertBefore(img, face.firstChild);
    ['.ph', '.soon'].forEach(function(s){ var n = face.querySelector(s); if(n) n.remove(); });
  });

  var order = cards.map(function(c, i){ return i; });
  var TILT = [-1.5, 4.5, -5];
  var SPRING = 'transform .6s cubic-bezier(.2,.85,.25,1.12)';
  function pose(pos){ return 'translate3d(0,' + (pos*14) + 'px,0) scale(' + (1 - pos*0.055) + ') rotate(' + TILT[pos] + 'deg)'; }
  function layout(anim){
    order.forEach(function(ci, pos){
      var c = cards[ci];
      c.style.zIndex = String(10 - pos);
      c.style.transition = anim && !reduced ? SPRING : 'none';
      c.style.transform = pose(pos);
      c.classList.toggle('top', pos === 0);
      c.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
    });
    dots.forEach(function(d, i){ d.setAttribute('aria-pressed', String(order[0] === i)); });
  }
  layout(false);

  var used = false;
  function markUsed(){ if(!used){ used = true; if(cue) cue.style.opacity = '0'; } }
  function arrive(){
    var c = cards[order[0]], inn = c.querySelector('.card-in'), mood = c.dataset.mood;
    inn.classList.remove('pop', 'settle'); void inn.offsetWidth;
    if(reduced) return;
    inn.classList.add(mood === 'him' ? 'settle' : 'pop');
    if(mood !== 'him'){
      var r = c.getBoundingClientRect();
      fx.burst(r.left + r.width/2, r.top + r.height*0.3, mood === 'her' ? 28 : 16, 'petal');
    }
  }
  function next(dir){
    markUsed(); buzz(8);
    var c = cards[order[0]];
    if(reduced){ order.push(order.shift()); layout(false); arrive(); return; }
    c.style.transition = 'transform .34s cubic-bezier(.3,.5,.4,1)';
    c.style.transform = 'translate3d(' + (dir*135) + '%,-4%,0) rotate(' + (dir*22) + 'deg)';
    setTimeout(function(){ order.push(order.shift()); c.style.zIndex = '0'; layout(true); arrive(); }, 320);
  }
  function prev(){ markUsed(); order.unshift(order.pop()); layout(true); arrive(); buzz(6); }
  function go(i){
    markUsed();
    if(order[0] === i) return;
    while(order[0] !== i) order.push(order.shift());
    layout(true); arrive(); buzz(6);
  }
  dots.forEach(function(d, i){ d.addEventListener('click', function(){ go(i); }); });
  deck.addEventListener('keydown', function(e){
    if(e.key === 'ArrowRight'){ e.preventDefault(); next(1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); prev(); }
  });

  var drag = null;
  deck.addEventListener('pointerdown', function(e){
    var c = cards[order[0]];
    if(!c.contains(e.target)) return;
    drag = { x:e.clientX, y:e.clientY, t:performance.now(), dx:0, dy:0, id:e.pointerId, c:c };
    c.style.transition = 'none';
  });
  deck.addEventListener('pointermove', function(e){
    if(!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
    if(!drag.cap && Math.abs(drag.dx) > 6){ drag.cap = true; try{ deck.setPointerCapture(e.pointerId); }catch(err){} }
    drag.c.style.transform = 'translate3d(' + drag.dx + 'px,' + (drag.dy*0.25) + 'px,0) rotate(' + (TILT[0] + drag.dx*0.06) + 'deg)';
  });
  function end(e){
    if(!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    if(e.type === 'pointercancel'){ layout(true); return; }
    var v = d.dx / Math.max(1, performance.now() - d.t);
    if(Math.abs(d.dx) < 6 && Math.abs(d.dy) < 6){ next(1); return; }
    if(Math.abs(d.dx) > 80 || Math.abs(v) > 0.5) next(d.dx > 0 ? 1 : -1);
    else layout(true);
  }
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);

  // teach the gesture once: the top card leans out and back
  if(!reduced && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      if(!es[0].isIntersecting) return;
      io.disconnect();
      setTimeout(function(){
        if(used || drag) return;
        var c = cards[order[0]];
        c.style.transition = 'transform .45s cubic-bezier(.3,.7,.4,1)';
        c.style.transform = 'translate3d(34px,0,0) rotate(4deg)';
        setTimeout(function(){ if(!used && !drag) layout(true); }, 480);
      }, 1100);
    }, { threshold:0.6 });
    io.observe(deck);
  }
})();

/* =============== COUNTDOWNS (each ticket keeps its own) =============== */
(function countdowns(){
  var els = $$('[data-countdown]').map(function(el){ return { el:el, t:new Date(el.dataset.countdown).getTime() }; });
  if(!els.length) return;
  function pad(n){ return n < 10 ? '0' + n : '' + n; }
  function tick(){
    var now = Date.now();
    els.forEach(function(o){
      var el = o.el, diff = o.t - now;
      if(diff <= 0){
        if(!el.dataset.done){ el.dataset.done = '1'; el.classList.remove('short'); el.innerHTML = '<span class="past">' + el.dataset.past + '</span>'; }
        return;
      }
      var s = Math.floor(diff/1000), d = Math.floor(s/86400);
      if(el.dataset.mode === 'full'){
        el.querySelector('[data-u="d"]').textContent = d;
        el.querySelector('[data-u="h"]').textContent = pad(Math.floor(s%86400/3600));
        el.querySelector('[data-u="m"]').textContent = pad(Math.floor(s%3600/60));
        el.querySelector('[data-u="s"]').textContent = pad(s%60);
      } else {
        el.textContent = d === 0 ? 'Today' : 'In ' + d + (d === 1 ? ' day' : ' days');
      }
    });
  }
  tick(); setInterval(tick, 1000);
})();

/* ===================================================================
   RSVP — one full name, then a separate answer for the wedding and the
   reception, each with its own party size. Responses land in the
   couple's Google Sheet; the page shows a guest list per event (first
   name + initial only — the sheet's script shortens them, so full names
   never leave it). Each phone keeps a token, so answering again updates
   the same row instead of adding a new one.
   =================================================================== */
(function rsvp(){
  var form = $('#rsvpForm'); if(!form) return;
  var endpoint = CONFIG.rsvp && CONFIG.rsvp.endpoint;
  var nameI = $('#rsvpName'), hp = $('#rsvpHp'), send = $('#rsvpSend'), msg = $('#rsvpMsg');
  var done = $('#rsvpDone'), dTitle = $('#doneTitle'), dList = $('#doneList'), dSub = $('#doneSub');
  var coming = $('#coming'), seg = $('#comingSeg'), cntW = $('#cntW'), cntR = $('#cntR');
  var cN = $('#comingN'), cL = $('#comingL'), list = $('#comingList');
  var KEY = 'sa-rsvp2', SUMKEY = 'sa-rsvp2-sum';
  var EVENTS = [
    { key:'wedding',   label:'Wedding',   when:'Thu 29 Oct · Visakhapatnam' },
    { key:'reception', label:'Reception', when:'Sun 1 Nov · Hyderabad' }
  ];
  var mine = null, summary = null, showing = 'wedding';

  function load(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
  function token(){
    try{ if(crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
    return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }
  function first(n){ return String(n).trim().split(/\s+/)[0]; }
  function say(t, soft){ msg.textContent = t || ''; msg.classList.toggle('soft', !!soft); }

  // one controller per event block: yes/no + its own party size
  var blocks = {};
  EVENTS.forEach(function(ev){
    var box = document.getElementById('ev-' + ev.key);
    var radios = [].slice.call(box.querySelectorAll('input[type="radio"]'));
    var partyRow = box.querySelector('.ev-party'), out = box.querySelector('output');
    var btns = [].slice.call(partyRow.querySelectorAll('button'));
    var b = { box:box, party:1 };
    b.answer = function(){ var r = radios.filter(function(x){ return x.checked; })[0]; return r ? r.value === 'yes' : null; };
    b.setParty = function(n){
      b.party = Math.max(1, Math.min(10, n)); out.textContent = b.party;
      btns[0].disabled = b.party <= 1; btns[1].disabled = b.party >= 10;
    };
    b.sync = function(){ partyRow.hidden = b.answer() !== true; box.classList.remove('missing'); };
    b.set = function(ans, party){
      radios.forEach(function(x){ x.checked = ans === null ? false : x.value === (ans ? 'yes' : 'no'); });
      b.setParty(party || 1); b.sync();
    };
    radios.forEach(function(x){ x.addEventListener('change', function(){ b.sync(); buzz(5); }); });
    btns.forEach(function(x){ x.addEventListener('click', function(){ b.setParty(b.party + (+x.dataset.d)); buzz(5); }); });
    b.set(null, 1);
    blocks[ev.key] = b;
  });

  // guest lists, one per event
  function renderList(){
    if(!summary || !summary.ok || !summary.wedding){ coming.hidden = true; return; }
    var W = summary.wedding, R = summary.reception;
    coming.hidden = !(W.people > 0 || R.people > 0);
    cntW.textContent = W.people; cntR.textContent = R.people;
    var side = summary[showing];
    cN.textContent = side.people;
    cL.textContent = (side.people === 1 ? 'guest is coming to the ' : 'guests are coming to the ') + showing;
    list.textContent = '';
    side.guests.forEach(function(g, i){
      var li = document.createElement('li');
      li.style.setProperty('--i', Math.min(i, 30));
      li.appendChild(document.createElement('i'));
      li.appendChild(document.createTextNode(g.name));
      if(g.party > 1){ var sm = document.createElement('small'); sm.textContent = '+' + (g.party - 1); li.appendChild(sm); }
      if(mine && mine[showing] && mine[showing].coming && g.name === mine.short) li.classList.add('you');
      list.appendChild(li);
    });
  }
  var segBtns = [].slice.call(seg.querySelectorAll('button'));
  segBtns.forEach(function(btn, i){
    btn.addEventListener('click', function(){
      showing = EVENTS[i].key;
      seg.style.setProperty('--seg', i);
      segBtns.forEach(function(x, k){ x.setAttribute('aria-selected', String(k === i)); });
      renderList(); buzz(5);
    });
  });

  function showDone(r, fresh){
    form.hidden = true; done.hidden = false;
    dTitle.textContent = 'Thank you, ' + first(r.name);
    dList.textContent = '';
    var any = false;
    EVENTS.forEach(function(ev){
      var a = r[ev.key], li = document.createElement('li'), bEl = document.createElement('b'),
          sm = document.createElement('small'), sp = document.createElement('span');
      bEl.textContent = ev.label; sm.textContent = ev.when; bEl.appendChild(sm);
      if(a.coming){ any = true; sp.textContent = a.party > 1 ? 'Attending · ' + a.party + ' of you' : 'Attending'; }
      else { li.className = 'no'; sp.textContent = 'Can’t make it'; }
      li.appendChild(bEl); li.appendChild(sp); dList.appendChild(li);
    });
    dSub.hidden = any;
    dSub.textContent = any ? '' : 'We’ve noted that you can’t make it.';
    done.classList.toggle('lit', any);
    if(fresh && any && !reduced){
      var bx = done.getBoundingClientRect();
      fx.burst(bx.left + bx.width/2, bx.top + 30, 30, 'petal');
      buzz([10, 60, 10]);
    }
  }
  function showForm(r){
    done.hidden = true; form.hidden = false;
    nameI.value = r ? r.name : '';
    EVENTS.forEach(function(ev){
      var a = r && r[ev.key];
      blocks[ev.key].set(a ? a.coming : null, a && a.party ? a.party : 1);
    });
    nameI.removeAttribute('aria-invalid'); say('');
  }

  function post(body){
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function(){ if(ctl) ctl.abort(); }, 15000);
    return fetch(endpoint, { method:'POST', body:JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function(res){ return res.json(); })
      .finally(function(){ clearTimeout(timer); });
  }
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var name = nameI.value.replace(/\s+/g, ' ').trim();
    if(name.length < 2 || name.split(' ').length < 2){
      nameI.setAttribute('aria-invalid', 'true'); nameI.focus();
      say('Please add your full name — first and last.'); return;
    }
    nameI.removeAttribute('aria-invalid');
    var missing = EVENTS.filter(function(ev){ return blocks[ev.key].answer() === null; });
    if(missing.length){
      missing.forEach(function(ev){ blocks[ev.key].box.classList.add('missing'); });
      say(missing.length === 2 ? 'Let us know for the wedding and the reception.' : 'Let us know for the ' + missing[0].key + ' too.');
      return;
    }
    if(!endpoint){ say('RSVPs open very soon — please check back.', true); return; }

    var tok = (mine && mine.token) || token();
    var body = { token:tok, name:name, website:hp.value };
    EVENTS.forEach(function(ev){
      var b = blocks[ev.key], yes = b.answer() === true;
      body[ev.key] = { coming:yes, party: yes ? b.party : 0 };
    });
    send.setAttribute('aria-busy', 'true'); say('Sending…', true);
    post(body).then(function(sum){
      send.removeAttribute('aria-busy');
      if(!sum || !sum.ok){ say(sum && sum.error === 'answer both' ? 'Let us know for the wedding and the reception.' : 'That didn’t go through — please try again.'); return; }
      mine = { token:tok, name:name, wedding:body.wedding, reception:body.reception, short:sum.you || '' };
      summary = sum;
      save(KEY, mine); save(SUMKEY, sum);
      say(''); showDone(mine, true); renderList();
    }).catch(function(){
      send.removeAttribute('aria-busy');
      say('Couldn’t reach the RSVP list — check your connection and try again.');
    });
  });
  $('#rsvpEdit').addEventListener('click', function(){ showForm(mine); nameI.focus(); });
  $('#rsvpAnother').addEventListener('click', function(){ mine = null; try{ localStorage.removeItem(KEY); }catch(e){} showForm(null); nameI.focus(); });

  mine = load(KEY);
  if(mine && mine.name && mine.wedding && mine.reception) showDone(mine, false); else mine = null;
  summary = load(SUMKEY); renderList();
  if(endpoint){
    setTimeout(function(){
      fetch(endpoint).then(function(r){ return r.json(); })
        .then(function(sum){ if(sum && sum.ok && sum.wedding){ summary = sum; save(SUMKEY, sum); renderList(); } })
        .catch(function(){});
    }, 1200);
  }
})();

/* ===================================================================
   BLESSINGS — shower akshintalu on the couple; tap to throw a handful.
   =================================================================== */
(function blessings(){
  var btn = $('#shower'), share = $('#share'), note = $('#showerNote'), scr = $('#blessings');
  var n = 0, ft = 0;
  try{ n = parseInt(localStorage.getItem('sa-akshi') || '0', 10) || 0; }catch(e){}
  function say(){ if(note) note.textContent = n ? 'Akshintalu showered · ' + n : ''; }
  function flash(t){ if(!note) return; note.textContent = t; clearTimeout(ft); ft = setTimeout(say, 3400); }
  say();

  if(btn) btn.addEventListener('click', function(){
    n++; try{ localStorage.setItem('sa-akshi', String(n)); }catch(e){}
    fx.shower(240); buzz([8, 50, 8]);
    if(reduced) flash('Your blessings are on their way'); else say();
  });
  if(scr) scr.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('a,button')) return;
    fx.burst(e.clientX, e.clientY, 30, 'mix'); buzz(5);
  });

  function copy(){
    var url = CONFIG.shareUrl;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){ flash('Link copied'); }, function(){ flash(url); });
    } else flash(url);
  }
  if(share) share.addEventListener('click', function(){
    buzz(6);
    var data = { title:'Sai Susmita weds Ashish', text:CONFIG.shareText, url:CONFIG.shareUrl };
    if(navigator.share){
      navigator.share(data).catch(function(err){ if(!err || err.name !== 'AbortError') copy(); });
    } else copy();
  });
})();

/* ===================================================================
   THE BAY — Visakhapatnam at dusk. Tap the water below the horizon to
   send out a ripple and leave a lamp on it.
   =================================================================== */
(function bay(){
  var cv   = document.getElementById('bay');
  var hero = document.querySelector('.hero');
  var hint = document.getElementById('hint');
  if(!cv || !T){ if(hint) hint.hidden = true; return; }

  var renderer;
  try{
    renderer = new T.WebGLRenderer({ canvas:cv, antialias:true, alpha:false, powerPreference:'high-performance' });
  }catch(e){ if(hint) hint.hidden = true; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x1B0D14, 1);
  if(T.LinearSRGBColorSpace) renderer.outputColorSpace = T.LinearSRGBColorSpace;

  var scene  = new T.Scene();
  var camera = new T.PerspectiveCamera(46, 1, 1, 2400);
  camera.position.set(0, 7.5, 34);
  var clock = new T.Clock();
  var SUN_X = 24, MAX_RIP = 6;

  /* sky */
  var sky = new T.Mesh(
    new T.SphereGeometry(1100, 32, 24),
    new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, depthTest: false,
      uniforms: { uSunX:{ value:SUN_X } },
      vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "varying vec3 vP; uniform float uSunX;",
        "void main(){",
        "  vec3 d = normalize(vP);",
        "  float h = clamp(d.y * 1.35 + 0.16, -0.2, 1.0);",
        "  vec3 c = mix(vec3(0.886,0.435,0.180), vec3(0.616,0.212,0.137), smoothstep(0.02,0.22,h));",
        "  c = mix(c, vec3(0.290,0.071,0.098), smoothstep(0.18,0.46,h));",
        "  c = mix(c, vec3(0.098,0.027,0.055), smoothstep(0.44,0.95,h));",
        "  c = mix(vec3(0.976,0.749,0.373), c, smoothstep(-0.06,0.06,h));",
        "  vec3 sd = normalize(vec3(uSunX, 2.0, -120.0));",
        "  c += vec3(1.0,0.72,0.34) * pow(max(dot(d,sd),0.0), 26.0) * 0.75;",
        "  c += vec3(1.0,0.60,0.26) * pow(max(dot(d,sd),0.0),  4.0) * 0.16;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}"
      ].join("\n")
    })
  );
  sky.renderOrder = -1;
  scene.add(sky);

  /* water */
  var ripples = [];
  for(var i = 0; i < MAX_RIP; i++) ripples.push(new T.Vector3(0, 0, -9999));
  var wu = { uTime:{ value:0 }, uSunX:{ value:SUN_X }, uRip:{ value:ripples } };

  var WAVE = [
    "float waveH(vec2 p, float t){",
    "  float h = 0.0;",
    "  h += sin(p.x*0.082 + t*0.85) * 1.05;",
    "  h += sin(p.y*0.104 - t*1.02) * 0.80;",
    "  h += sin((p.x*0.55 + p.y*0.46)*0.126 + t*1.55) * 0.40;",
    "  h += sin((p.x*0.33 - p.y*0.61)*0.205 - t*2.05) * 0.20;",
    "  h += sin((p.x*0.90 + p.y*0.20)*0.360 + t*2.80) * 0.075;",
    "  return h;",
    "}"
  ].join("\n");

  var SEG = (innerWidth < 760 || (devicePixelRatio||1) > 2.5) ? 150 : 250;
  var water = new T.Mesh(
    new T.PlaneGeometry(640, 640, SEG, SEG),
    new T.ShaderMaterial({
      uniforms: wu,
      vertexShader: [
        "#define MAX_RIP " + MAX_RIP,
        "uniform float uTime; uniform vec3 uRip[MAX_RIP];",
        "varying vec3 vW; varying float vH; varying vec3 vN;",
        WAVE,
        "float ripH(vec2 p){",
        "  float h = 0.0;",
        "  for(int i = 0; i < MAX_RIP; i++){",
        "    float age = uTime - uRip[i].z;",
        "    if(age > 0.0 && age < 6.0){",
        "      float d = distance(p, uRip[i].xy);",
        "      float f = age * 13.0;",
        "      h += sin((d - f) * 0.55) * exp(-abs(d - f) * 0.12) * exp(-age * 0.55) * exp(-d * 0.009) * 1.6;",
        "    }",
        "  }",
        "  return h;",
        "}",
        "void main(){",
        "  vec2 p = position.xy;",
        "  float h = waveH(p, uTime) + ripH(p);",
        "  float e = 1.4;",
        "  float hx = (waveH(p+vec2(e,0.0),uTime)+ripH(p+vec2(e,0.0))) - (waveH(p-vec2(e,0.0),uTime)+ripH(p-vec2(e,0.0)));",
        "  float hy = (waveH(p+vec2(0.0,e),uTime)+ripH(p+vec2(0.0,e))) - (waveH(p-vec2(0.0,e),uTime)+ripH(p-vec2(0.0,e)));",
        "  vN = normalize(vec3(-hx, -hy, 2.0*e));",
        "  vH = h;",
        "  vec4 wp = modelMatrix * vec4(p.x, p.y, h, 1.0);",
        "  vW = wp.xyz;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uSunX;",
        "varying vec3 vW; varying float vH; varying vec3 vN;",
        "void main(){",
        "  vec3 n = normalize(vN);",
        "  float dist = clamp((length(vW - cameraPosition) - 18.0) / 300.0, 0.0, 1.0);",
        "  vec3 col = mix(vec3(0.090,0.028,0.050), vec3(0.302,0.086,0.078), smoothstep(0.0,0.45,dist));",
        "  col = mix(col, vec3(0.706,0.302,0.125), smoothstep(0.40,0.92,dist));",
        "  float lane = exp(-abs(vW.x - uSunX) * 0.016);",
        "  float spec = pow(max(n.z,0.0), 24.0);",
        "  col += vec3(1.0,0.78,0.40) * (pow(max(vH,0.0),1.4)*0.26 + spec*0.55) * lane * (0.35 + dist);",
        "  col += vec3(1.0,0.72,0.36) * smoothstep(0.75,1.9,vH) * 0.10;",
        "  col = mix(col, vec3(0.960,0.700,0.330), smoothstep(0.72,1.0,dist));",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n")
    })
  );
  water.rotation.x = -Math.PI/2;
  scene.add(water);

  function waveH(x, y, t){
    return Math.sin(x*0.082 + t*0.85)*1.05
         + Math.sin(y*0.104 - t*1.02)*0.80
         + Math.sin((x*0.55 + y*0.46)*0.126 + t*1.55)*0.40
         + Math.sin((x*0.33 - y*0.61)*0.205 - t*2.05)*0.20
         + Math.sin((x*0.90 + y*0.20)*0.360 + t*2.80)*0.075;
  }

  /* lamps */
  function glow(){
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var rg = g.createRadialGradient(64,64,0,64,64,64);
    rg.addColorStop(0,'rgba(255,246,214,1)');
    rg.addColorStop(0.28,'rgba(255,186,88,0.85)');
    rg.addColorStop(1,'rgba(255,180,90,0)');
    g.fillStyle = rg; g.fillRect(0,0,128,128);
    return new T.CanvasTexture(c);
  }
  var flame = glow(), lamps = [];
  function addLamp(x, z, seeded){
    if(lamps.length >= 24){
      var old = lamps.shift();
      scene.remove(old.s); old.s.material.dispose();
    }
    var s = new T.Sprite(new T.SpriteMaterial({
      map:flame, transparent:true, blending:T.AdditiveBlending,
      depthWrite:false, opacity: seeded ? 0.9 : 0
    }));
    var sc = 2.6 + Math.random()*1.5;
    s.scale.set(sc, sc, 1);
    s.position.set(x, 0, z);
    scene.add(s);
    lamps.push({ s:s, x:x, z:z, ph:Math.random()*6.28, fade: seeded?1:0, sc:sc });
  }
  for(var L = 0; L < 14; L++) addLamp((Math.random()-0.5)*260, -30 - Math.random()*230, true);

  /* interaction */
  var ptr = { x:0, y:0, tx:0, ty:0 }, ripIdx = 0, used = false;
  var ray = new T.Raycaster(), plane = new T.Plane(new T.Vector3(0,1,0), 0);
  var hitv = new T.Vector3(), ndc = new T.Vector2();

  hero.addEventListener('pointermove', function(e){
    var r = cv.getBoundingClientRect();
    ptr.tx = ((e.clientX - r.left)/r.width)  * 2 - 1;
    ptr.ty = ((e.clientY - r.top)/r.height) * 2 - 1;
  }, { passive:true });
  hero.addEventListener('pointerleave', function(){ ptr.tx = ptr.ty = 0; }, { passive:true });
  hero.addEventListener('pointerdown', function(e){
    if(e.target.closest && e.target.closest('a,button')) return;
    var r = cv.getBoundingClientRect();
    ndc.x =  ((e.clientX - r.left)/r.width)  * 2 - 1;
    ndc.y = -((e.clientY - r.top)/r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    if(!ray.ray.intersectPlane(plane, hitv)) return;
    if(hitv.z > 14 || hitv.z < -300) return;
    addLamp(hitv.x, hitv.z, false);
    ripples[ripIdx].set(hitv.x, -hitv.z, wu.uTime.value);
    ripIdx = (ripIdx + 1) % MAX_RIP;
    if(!used){ used = true; if(hint) hint.style.opacity = '0'; }
  });

  function resize(){
    var w = cv.clientWidth || hero.clientWidth, h = cv.clientHeight || hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    camera.fov = w < 620 ? 60 : 46;
    camera.updateProjectionMatrix();
  }
  var rt; addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(resize, 150); });
  resize();

  function render(){
    var t = clock.getElapsedTime();
    wu.uTime.value = t;
    ptr.x += (ptr.tx - ptr.x) * 0.045;
    ptr.y += (ptr.ty - ptr.y) * 0.045;
    camera.position.x = Math.sin(t*0.055)*2.2 + ptr.x*4.0;
    camera.position.y = 7.6 + Math.sin(t*0.09)*0.5 - ptr.y*1.6;
    camera.lookAt(ptr.x*3.0, 6.2 - ptr.y*1.4, -140);
    for(var i = 0; i < lamps.length; i++){
      var P2 = lamps[i];
      var lx = P2.x + Math.sin(t*0.16 + P2.ph)*3.0;
      P2.s.position.set(lx, waveH(lx, -P2.z, t) + P2.sc*0.32, P2.z);
      if(P2.fade < 1) P2.fade = Math.min(1, P2.fade + 0.02);
      P2.s.material.opacity = P2.fade * (0.72 + 0.28*Math.sin(t*6.2 + P2.ph*3.0));
    }
    renderer.render(scene, camera);
  }

  var running = true, raf = 0;
  function loop(){ if(!running) return; render(); raf = requestAnimationFrame(loop); }
  if(reduced){ render(); if(hint) hint.hidden = true; }
  else{
    loop();
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        var vis = es[0].isIntersecting;
        if(vis && !running){ running = true; loop(); }
        else if(!vis && running){ running = false; cancelAnimationFrame(raf); }
      }, { threshold:0 }).observe(cv);
    }
  }
})();


/* =============== REVEALS — staggered within each screen =============== */
(function reveals(){
  var items = $$('.reveal');
  items.forEach(function(n){
    var s = n.closest('.screen'), sib = s ? [].slice.call(s.querySelectorAll('.reveal')) : [n];
    n.dataset.ri = sib.indexOf(n);
  });
  function all(){ items.forEach(function(n){ n.classList.add('in'); }); }
  if(reduced || !('IntersectionObserver' in window)){ all(); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(!e.isIntersecting) return;
      var n = e.target;
      n.style.setProperty('--rd', (Math.min(+n.dataset.ri || 0, 5) * 0.09).toFixed(2) + 's');
      n.classList.add('in');
      io.unobserve(n);
      setTimeout(function(){ n.style.removeProperty('--rd'); }, 1600);
    });
  }, { rootMargin:'0px 0px -6% 0px', threshold:0.06 });
  items.forEach(function(n){ io.observe(n); });
  setTimeout(all, 4000);
})();

})();
