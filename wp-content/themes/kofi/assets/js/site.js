(function(){
  'use strict';
  var d=document;

  /* menu mobilne */
  var burger=d.getElementById('burger'), menu=d.getElementById('menu');
  function zamknij(){menu.classList.remove('otwarte');d.body.classList.remove('menu-otw');burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Otwórz menu');}
  burger.addEventListener('click',function(){
    var o=menu.classList.toggle('otwarte');
    d.body.classList.toggle('menu-otw',o);
    burger.setAttribute('aria-expanded',o?'true':'false');
    burger.setAttribute('aria-label',o?'Zamknij menu':'Otwórz menu');
  });
  menu.addEventListener('click',function(e){if(e.target.closest('a'))zamknij();});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')zamknij();});

  /* aktywna pozycja menu = dokładnie bieżąca sekcja */
  var linki=[].slice.call(menu.querySelectorAll('a[href^="#"]'));
  var mapa={};linki.forEach(function(a){mapa[a.getAttribute('href').slice(1)]=a;});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(wpisy){
      wpisy.forEach(function(w){
        if(!w.isIntersecting)return;
        linki.forEach(function(a){a.classList.remove('akt');a.removeAttribute('aria-current');});
        var a=mapa[w.target.id]; if(a){a.classList.add('akt');a.setAttribute('aria-current','true');}
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    d.querySelectorAll('main section').forEach(function(s){io.observe(s);});

    /* pasek dolny na telefonie dopiero po minięciu przycisków z pierwszego ekranu */
    var mob=d.getElementById('mob'), ha=d.getElementById('heroAkcje');
    if(mob&&ha){
      new IntersectionObserver(function(w){
        var on=!w[0].isIntersecting && w[0].boundingClientRect.top<0;
        mob.classList.toggle('widac',on);mob.setAttribute('aria-hidden',on?'false':'true');
        [].forEach.call(mob.querySelectorAll('a'),function(a){a.tabIndex=on?0:-1;});
      }).observe(ha);
    }
  }

  /* przeciąganie myszą */
  function ciagnij(tor,poKoncu){
    var x0=0,s0=0,wcisk=false,ruch=0;
    tor.addEventListener('pointerdown',function(e){
      if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;
      wcisk=true;ruch=0;x0=e.clientX;s0=tor.scrollLeft;
    });
    window.addEventListener('pointermove',function(e){
      if(!wcisk)return;var dx=e.clientX-x0;ruch=Math.max(ruch,Math.abs(dx));
      if(ruch>4)tor.classList.add('ciag');
      tor.scrollLeft=s0-dx;
    });
    window.addEventListener('pointerup',function(){
      if(!wcisk)return;wcisk=false;tor.classList.remove('ciag');
      if(poKoncu&&ruch>4)poKoncu(s0);
    });
    tor.addEventListener('click',function(e){if(ruch>6){e.preventDefault();e.stopPropagation();}},true);
    tor.addEventListener('dragstart',function(e){e.preventDefault();});
  }

  /* karuzele zdjęć w kartach */
  d.querySelectorAll('[data-karuzela]').forEach(function(k){
    var tor=k.querySelector('.kar-tor'), n=tor.children.length, licz=k.querySelector('.kar-licz');
    if(n<2||!licz)return;
    function idx(){return Math.round(tor.scrollLeft/tor.clientWidth);}
    function idz(i){i=Math.max(0,Math.min(n-1,i));tor.scrollTo({left:i*tor.clientWidth,behavior:'smooth'});}
    var t;tor.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){licz.textContent=(idx()+1)+' / '+n;},60);},{passive:true});
    k.querySelector('.kar-l').addEventListener('click',function(){idz(idx()-1);});
    k.querySelector('.kar-p').addEventListener('click',function(){idz(idx()+1);});
    tor.tabIndex=0;tor.setAttribute('aria-label','Zdjęcia, '+n+' szt., przewijane w bok');
    tor.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();idz(idx()+1);}if(e.key==='ArrowLeft'){e.preventDefault();idz(idx()-1);}});
    tor.addEventListener('pointerdown',function(e){e.stopPropagation();});
    ciagnij(tor,function(s0){
      var w=tor.clientWidth, start=Math.round(s0/w), dx=tor.scrollLeft-s0;
      idz(Math.abs(dx)>w*0.15?start+(dx>0?1:-1):start);
    });
  });
  d.querySelectorAll('[data-przewijak]').forEach(function(t){ciagnij(t);});

  /* strzałki toru realizacji */
  d.querySelectorAll('.tor-b').forEach(function(b){
    b.addEventListener('click',function(){
      var t=d.getElementById(b.dataset.tor), el=t.firstElementChild;
      var krok=el?(el.getBoundingClientRect().width+18)*2:600;
      t.scrollBy({left:krok*Number(b.dataset.kier),behavior:'smooth'});
    });
  });

  /* formularz zapytania: wysyłka bez przeładowania (admin-ajax), czas wypełnienia dla ochrony przed robotami */
  var f=d.getElementById('form'), info=d.getElementById('formInfo');
  if(f){
    var t0=Date.now(), czas=f.querySelector('[name=czas]');
    f.addEventListener('submit',function(e){
      if(czas)czas.value=String(Date.now()-t0);
      e.preventDefault();
      var v=function(n){var el=f.querySelector('[name='+n+']');return el?el.value.trim():'';};
      [].forEach.call(f.querySelectorAll('.pole-blad'),function(x){x.classList.remove('pole-blad');});
      var blad='';
      if(!v('imie')&&!v('firma'))blad='Proszę podać imię i nazwisko albo nazwę firmy.';
      else if(!v('email')&&!v('tel'))blad='Proszę podać e-mail albo telefon, żebyśmy mogli odpowiedzieć.';
      else if(v('email')&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))){blad='Proszę sprawdzić adres e-mail.';f.querySelector('[name=email]').parentNode.classList.add('pole-blad');}
      else if(!f.querySelector('[name=zgoda]').checked)blad='Proszę zaznaczyć zgodę na kontakt w sprawie zapytania.';
      info.className='form-info';
      if(blad){info.textContent=blad;info.classList.add('blad');return;}
      if(f.hasAttribute('data-test')){info.textContent=f.getAttribute('data-test');info.classList.add('ok');return;}
      var btn=f.querySelector('button[type=submit]');btn.disabled=true;info.textContent='Wysyłanie...';
      var dane=new FormData(f);dane.append('ajax','1');
      fetch(f.getAttribute('action'),{method:'POST',body:dane,credentials:'same-origin'}).then(function(r){return r.json();}).then(function(o){
        info.textContent=o.msg;info.classList.add(o.ok?'ok':'blad');
        if(o.ok){f.reset();t0=Date.now();}
      }).catch(function(){
        info.textContent='Nie udało się wysłać. Proszę zadzwonić albo napisać e-mail.';info.classList.add('blad');
      }).then(function(){btn.disabled=false;});
    });
  }

  /* baner zgód cookies: wybór w przeglądarce na 12 miesięcy; mapa Google od razu, po odmowie zastępnik z linkiem do trasy */
  var KL='kofi-cookies', ROK=365*864e5, zg=null;
  try{zg=JSON.parse(localStorage.getItem(KL)||'null');}catch(e){zg=null;}
  if(zg&&(!zg.t||Date.now()-zg.t>ROK))zg=null;
  var ban=d.getElementById('cookies'), kat=d.getElementById('cookies-kat'), chMapy=d.getElementById('cookies-mapy');
  var mapaEl=d.querySelector('.mapa'), ifr=mapaEl?mapaEl.querySelector('iframe'):null, ifrSrc=ifr?ifr.src:'';
  function mapy(){
    if(!mapaEl||!ifr)return;
    var zgoda=!zg||zg.mapy, zast=mapaEl.querySelector('.mapa-zast');
    if(zgoda&&!mapaEl.querySelector('iframe')){if(zast)zast.remove();ifr.src=ifrSrc;mapaEl.appendChild(ifr);}
    if(!zgoda&&mapaEl.querySelector('iframe')){
      ifr.remove();
      var adr=mapaEl.getAttribute('data-adres')||'';
      var x=d.createElement('div');x.className='mapa-zast';
      x.innerHTML='<b></b><p>Mapa Google jest wyłączona zgodnie z wyborem cookies.</p><div class="mz-akcje"><a class="btn" target="_blank" rel="noopener">Wyznacz trasę</a><button type="button">Pokaż mapę</button></div>';
      x.querySelector('b').textContent=adr;
      x.querySelector('a').href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(adr);
      x.querySelector('button').addEventListener('click',function(){zapisz({mapy:true});});
      mapaEl.appendChild(x);
    }
  }
  function zapisz(v){zg={mapy:!!v.mapy,t:Date.now()};try{localStorage.setItem(KL,JSON.stringify(zg));}catch(e){}if(ban)ban.hidden=true;mapy();}
  function otworz(){if(!ban)return;ban.hidden=false;if(chMapy)chMapy.checked=!zg||zg.mapy;}
  if(ban){
    if(!zg)ban.hidden=false;
    ban.addEventListener('click',function(e){
      var b=e.target.closest('[data-cookies]');if(!b)return;
      var a=b.getAttribute('data-cookies');
      if(a==='tak')zapisz({mapy:true});
      else if(a==='nie')zapisz({mapy:false});
      else if(a==='ustawienia'){kat.hidden=false;b.hidden=true;ban.querySelector('[data-cookies=zapisz]').hidden=false;}
      else if(a==='zapisz')zapisz({mapy:chMapy.checked});
    });
    d.querySelectorAll('[data-cookies-otworz]').forEach(function(x){x.addEventListener('click',otworz);});
  }
  mapy();
})();
