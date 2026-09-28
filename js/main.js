/* Kod Dede Grill — interactions */
(() => {
  'use strict';

  const d = document;
  const html = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = html.classList.contains('reduce-motion');
  const mqDesk = matchMedia('(min-width: 900px)');
  const mqNav = matchMedia('(min-width: 1080px)');

  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let sy = window.scrollY;

  /* ------------------------------------------------------------ Loader */
  const loader = $('.loader');
  const t0 = performance.now();
  function finishLoad() {
    if (html.classList.contains('is-loaded')) return;
    html.classList.add('is-loaded');
    if (loader) loader.classList.add('is-done');
    try { sessionStorage.setItem('kd-seen', '1'); } catch (e) {}
  }
  if (!loader || html.classList.contains('skip-loader')) {
    requestAnimationFrame(() => requestAnimationFrame(finishLoad));
  } else {
    const go = () => setTimeout(finishLoad, Math.max(0, 1500 - (performance.now() - t0)));
    if (d.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    setTimeout(finishLoad, 3200);
  }

  /* ------------------------------------------------------------ Split headings */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span');
            w.className = 'w';
            const inner = d.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  }
  $$('[data-split]').forEach(splitWords);

  /* ------------------------------------------------------------ Reveal on scroll */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  $$('[data-reveal], [data-split]').forEach((el) => revealIO.observe(el));

  /* ------------------------------------------------------------ Counters */
  const counters = $$('[data-count]');
  if (!reduce) {
    counters.forEach((el) => { el.textContent = '0'; });
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target;
        const target = +el.dataset.count;
        const start = performance.now();
        const dur = 1900;
        const step = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  /* ------------------------------------------------------------ Navigation */
  const nav = $('#nav');
  const burger = $('.burger');
  const menu = $('#menu');
  function setMenu(open) {
    html.classList.toggle('menu-open', open);
    html.classList.toggle('no-scroll', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
  }
  burger.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  d.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && html.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
  });
  mqNav.addEventListener('change', () => { if (mqNav.matches) setMenu(false); });

  const navLinks = $$('.nav-links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id === 'setnja' ? 'prostor' : e.target.id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['pocetna', 'o-nama', 'jela', 'jelovnik', 'galerija', 'prostor', 'setnja', 'dojmovi', 'kontakt']
    .forEach((id) => { const s = d.getElementById(id); if (s) sectionIO.observe(s); });

  /* ------------------------------------------------------------ Open / closed status (Europe/Zagreb) */
  function zagrebMinutes() {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Zagreb', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const h = +parts.find((p) => p.type === 'hour').value;
      const m = +parts.find((p) => p.type === 'minute').value;
      return h * 60 + m;
    } catch (e) {
      const n = new Date();
      return n.getHours() * 60 + n.getMinutes();
    }
  }
  function updateStatus() {
    const mins = zagrebMinutes();
    const open = mins >= 600 && mins < 1380;
    const soon = open && mins >= 1320;
    const text = open
      ? (soon ? 'Otvoreno još malo · do 23 h' : 'Otvoreno sada · do 23 h')
      : 'Zatvoreno · otvaramo u 10 h';
    $$('[data-status-text]').forEach((el) => { el.textContent = text; });
    $$('[data-status-dot]').forEach((el) => {
      el.classList.toggle('is-open', open);
      el.classList.toggle('is-closed', !open);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ------------------------------------------------------------ Hero slideshow */
  const slides = $$('.hero-slide');
  let slideIdx = 0;
  if (slides.length > 1 && !reduce) {
    setInterval(() => {
      if (d.hidden) return;
      slides[slideIdx].classList.remove('is-active');
      slideIdx = (slideIdx + 1) % slides.length;
      slides[slideIdx].classList.add('is-active');
    }, 6500);
  }

  /* ------------------------------------------------------------ Embers */
  const hero = $('.hero');
  const heroContent = $('.hero-content');
  const canvas = $('.embers');
  let heroVisible = true;
  (function embers() {
    if (!canvas || reduce) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sprite = d.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,236,190,1)');
    g.addColorStop(0.18, 'rgba(255,170,70,.95)');
    g.addColorStop(0.45, 'rgba(255,100,25,.35)');
    g.addColorStop(1, 'rgba(255,60,0,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    let w = 0, h = 0, parts = [], raf = 0, last = 0, running = false;
    const spawn = (initial) => ({
      x: Math.random() * w,
      y: initial ? h * (0.35 + Math.random() * 0.65) : h + 12,
      vy: -(0.35 + Math.random() * 1.1),
      vx: (Math.random() - 0.5) * 0.35,
      r: 0.8 + Math.random() * 2.4,
      life: 0,
      max: 220 + Math.random() * 360,
      ph: Math.random() * 6.28,
      fl: 0.03 + Math.random() * 0.06
    });
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / 15000, 30, 95));
      while (parts.length < n) parts.push(spawn(true));
      parts.length = n;
    }
    function tick(now) {
      const k = last ? clamp((now - last) / 16.67, 0.5, 3) : 1;
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.life += k;
        p.ph += p.fl * k;
        p.x += (p.vx + Math.sin(p.ph) * 0.4) * k;
        p.y += p.vy * k;
        const t = p.life / p.max;
        if (t >= 1 || p.y < -20) { parts[i] = spawn(false); continue; }
        const a = Math.sin(Math.PI * t) * (0.6 + 0.4 * Math.sin(p.ph * 2.3));
        const size = p.r * 7 * (1 - t * 0.55);
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(tick); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      if (heroVisible && !d.hidden) start(); else stop();
    }).observe(hero);
    d.addEventListener('visibilitychange', () => { if (d.hidden) stop(); else if (heroVisible) start(); });
  })();

  /* ------------------------------------------------------------ Marquee bands */
  const band = $('.band');
  const bands = $$('.band-track').map((el) => ({ el, dir: +el.dataset.dir || -1, x: 0, w: 0 }));
  let bandVisible = false;
  function measureBands() { bands.forEach((b) => { b.w = b.el.firstElementChild.offsetWidth; if (b.dir > 0) b.x = -b.w; }); }
  if (band) new IntersectionObserver(([e]) => { bandVisible = e.isIntersecting; }).observe(band);

  /* ------------------------------------------------------------ Barrel quote words */
  const quoteP = $('[data-words]');
  let qWords = [];
  if (quoteP) {
    const words = quoteP.textContent.trim().split(/\s+/);
    quoteP.textContent = '';
    words.forEach((word, i) => {
      const gold = word.startsWith('*');
      const s = d.createElement('span');
      s.className = 'qw' + (gold ? ' gold' : '');
      s.textContent = gold ? word.slice(1) : word;
      quoteP.appendChild(s);
      if (i < words.length - 1) quoteP.appendChild(d.createTextNode(' '));
    });
    qWords = $$('.qw', quoteP);
  }
  const barrelDisc = $('.barrel-img .disc');
  let qLit = -1;

  /* ------------------------------------------------------------ Parallax, badge */
  const parallax = $$('[data-parallax]').map((el) => ({ el, box: el.parentElement, k: +el.dataset.parallax }));
  const ring = $('.badge .ring');
  const bgWord = $('.dishes-bgword');

  /* ------------------------------------------------------------ Dishes: pinned horizontal / swipe */
  const dishesSec = $('#jela');
  const pin = $('.dishes-pin');
  const track = $('.dishes-track');
  const dishes = $$('.dish');
  const plates = dishes.map((el) => $('.dish-plate img', el));
  const wide = dishes.map((el) => el.classList.contains('dish--wide'));
  const progress = $('.dishes-progress');
  const countEl = $('.dishes-count b');
  const SPEED = 1.45;
  let pinOn = false, pinTop = 0, travel = 0, centers = [], lastIdx = -1;

  function layoutDishes() {
    pinOn = mqDesk.matches && !reduce;
    dishesSec.classList.toggle('has-pin', pinOn);
    track.style.transform = '';
    if (pinOn) {
      travel = Math.max(0, track.scrollWidth - vw);
      pin.style.height = Math.round(travel / SPEED + vh) + 'px';
      pinTop = pin.getBoundingClientRect().top + window.scrollY;
    } else {
      pin.style.height = '';
    }
    centers = dishes.map((el) => el.offsetLeft + el.offsetWidth / 2);
  }

  function paintDishes(shift, p) {
    let best = 0, bestD = Infinity;
    const mid = vw / 2;
    for (let i = 0; i < dishes.length; i++) {
      const dx = (centers[i] - shift - mid) / vw;
      const ad = Math.abs(dx);
      if (ad < bestD) { bestD = ad; best = i; }
      if (ad > 1.4) continue;
      const rot = reduce ? 0 : dx * (pinOn ? 70 : 40) * (wide[i] ? 0.3 : 1);
      const sc = 1 - Math.min(ad, 1) * 0.12;
      plates[i].style.setProperty('--rot', rot.toFixed(2) + 'deg');
      plates[i].style.setProperty('--sc', sc.toFixed(3));
    }
    progress.style.setProperty('--p', Math.max(p, 0.04).toFixed(4));
    if (best !== lastIdx) {
      lastIdx = best;
      countEl.textContent = String(best + 1).padStart(2, '0');
    }
  }

  let trackTick = false;
  track.addEventListener('scroll', () => {
    if (pinOn || trackTick) return;
    trackTick = true;
    requestAnimationFrame(() => {
      trackTick = false;
      const max = track.scrollWidth - track.clientWidth;
      paintDishes(track.scrollLeft, max > 0 ? track.scrollLeft / max : 0);
    });
  }, { passive: true });

  /* ------------------------------------------------------------ Dock */
  const dock = $('.dock');

  /* ------------------------------------------------------------ Main frame loop */
  let lastSy = sy;
  let velocity = 0;
  let lastT = 0;
  let navHidden = false;
  let scrollDirty = true;

  function onScrollUpdate() {
    // nav
    const delta = sy - lastSy;
    nav.classList.toggle('is-scrolled', sy > 40);
    if (!html.classList.contains('menu-open')) {
      if (sy > 260 && delta > 6 && !navHidden) { navHidden = true; nav.classList.add('is-hidden'); }
      else if ((delta < -6 || sy < 260) && navHidden) { navHidden = false; nav.classList.remove('is-hidden'); }
    }
    // dock
    if (dock) dock.classList.toggle('is-visible', sy > vh * 0.75);

    // hero content drift
    if (!reduce && sy < vh * 1.1 && heroContent) {
      const p = sy / vh;
      heroContent.style.transform = `translate3d(0, ${(sy * 0.28).toFixed(1)}px, 0)`;
      heroContent.style.opacity = String(clamp(1 - p * 1.25, 0, 1));
    }

    // parallax images
    if (!reduce) {
      for (const it of parallax) {
        const r = it.box.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        const c = (r.top + r.height / 2 - vh / 2);
        it.el.style.transform = `translate3d(0, ${(-c * it.k - r.height * 0.09).toFixed(1)}px, 0)`;
      }
      if (ring) {
        const r = ring.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) ring.style.transform = `rotate(${(sy * 0.12) % 360}deg)`;
      }
    }

    // barrel + quote
    if (quoteP) {
      const r = quoteP.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) {
        const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.38), 0, 1);
        const n = reduce ? qWords.length : Math.round(p * qWords.length * 1.08);
        if (n !== qLit) {
          qLit = n;
          qWords.forEach((w, i) => w.classList.toggle('lit', i < n));
        }
        if (barrelDisc && !reduce) barrelDisc.style.transform = `rotate(${((r.top - vh / 2) * -0.14).toFixed(2)}deg)`;
      }
    }

    // dishes pin
    if (pinOn) {
      const len = pin.offsetHeight - vh;
      const p = clamp((sy - pinTop) / len, 0, 1);
      const shift = p * travel;
      track.style.transform = `translate3d(${(-shift).toFixed(1)}px, 0, 0)`;
      if (bgWord) bgWord.style.transform = `translate3d(${(-shift * 0.35).toFixed(1)}px, -50%, 0)`;
      paintDishes(shift, p);
    }
    lastSy = sy;
  }

  function frame(now) {
    const dt = lastT ? Math.min(now - lastT, 50) : 16.67;
    lastT = now;
    const cur = window.scrollY;
    const dv = cur - sy;
    velocity += (dv - velocity) * 0.18;
    if (cur !== sy || scrollDirty) {
      sy = cur;
      scrollDirty = false;
      onScrollUpdate();
    }
    if (bandVisible && !reduce) {
      const boost = 1 + Math.min(Math.abs(velocity) * 0.22, 7);
      const k = dt / 16.67;
      for (const b of bands) {
        if (!b.w) continue;
        b.x += b.dir * 0.55 * boost * k;
        if (b.x <= -b.w) b.x += b.w;
        if (b.x > 0) b.x -= b.w;
        b.el.style.transform = `translate3d(${b.x.toFixed(2)}px, 0, 0)`;
      }
    }
    requestAnimationFrame(frame);
  }

  function onResize() {
    const nw = window.innerWidth;
    const nh = window.innerHeight;
    const widthChanged = nw !== vw;
    vw = nw;
    // iOS toolbar show/hide only changes height — avoid re-pinning on every small change
    if (widthChanged || Math.abs(nh - vh) > 120 || pinOn) vh = nh;
    measureBands();
    layoutDishes();
    positionInd();
    scrollDirty = true;
    if (!pinOn) {
      const max = track.scrollWidth - track.clientWidth;
      paintDishes(track.scrollLeft, max > 0 ? track.scrollLeft / max : 0);
    }
  }
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(onResize, 120); });
  window.addEventListener('load', onResize);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(onResize);

  /* ------------------------------------------------------------ Menu tabs */
  const tabs = $$('.tab');
  const tabsBox = $('.tabs');
  const ind = $('.tabs-ind');
  $$('.panel').forEach((p) => $$('.m-item', p).forEach((it, i) => it.style.setProperty('--i', i)));
  function positionInd() {
    const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    if (!t || !ind) return;
    ind.style.width = t.offsetWidth + 'px';
    ind.style.transform = `translateX(${t.offsetLeft}px)`;
  }
  function selectTab(t, focus) {
    tabs.forEach((x) => {
      const on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      const panel = d.getElementById(x.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) {
        panel.classList.remove('is-anim');
        void panel.offsetWidth;
        panel.classList.add('is-anim');
      }
    });
    positionInd();
    const left = t.offsetLeft - (tabsBox.clientWidth - t.offsetWidth) / 2;
    tabsBox.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
    if (focus) t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(n, true);
    });
  });

  /* ------------------------------------------------------------ Gallery */
  const gGrid = $('.g-grid');
  const gItems = $$('.g-item');
  const gFilters = $$('.gallery .filter');
  const moreWrap = $('.g-more');
  const LIMIT = vw < 700 ? 10 : 12;
  let gCat = 'sve';
  let gExpanded = false;
  function applyGallery(animate) {
    let shown = 0;
    gItems.forEach((it) => {
      const match = gCat === 'sve' || it.dataset.cat === gCat;
      const vis = match && (gExpanded || shown < LIMIT);
      if (match) shown++;
      it.classList.toggle('is-hidden', !vis);
    });
    moreWrap.hidden = gExpanded || shown <= LIMIT;
    if (animate) {
      gGrid.classList.remove('is-switching');
      void gGrid.offsetWidth;
      gGrid.classList.add('is-switching');
      gItems.forEach((it) => it.classList.add('is-in'));
    }
  }
  gFilters.forEach((b) => b.addEventListener('click', () => {
    gFilters.forEach((x) => {
      const on = x === b;
      x.classList.toggle('is-active', on);
      x.setAttribute('aria-pressed', String(on));
    });
    gCat = b.dataset.filter;
    gExpanded = false;
    applyGallery(true);
  }));
  $('button', moreWrap).addEventListener('click', () => { gExpanded = true; applyGallery(false); });
  applyGallery(false);

  /* ------------------------------------------------------------ Lightbox */
  const lb = $('.lightbox');
  const lbImg = $('.lb-img', lb);
  const lbCap = $('.lb-cap', lb);
  const lbCount = $('.lb-count', lb);
  let lbList = [];
  let lbIdx = 0;
  let lbReturn = null;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const a = lbList[lbIdx];
    const thumb = $('img', a);
    lbImg.classList.remove('is-ready');
    const src = a.getAttribute('href');
    const img = new Image();
    img.onload = () => {
      if (lbList[lbIdx] !== a) return;
      lbImg.src = src;
      lbImg.alt = thumb.alt;
      requestAnimationFrame(() => lbImg.classList.add('is-ready'));
    };
    img.src = src;
    lbCap.textContent = thumb.alt;
    lbCount.textContent = `${lbIdx + 1} / ${lbList.length}`;
    const next = lbList[(lbIdx + 1) % lbList.length];
    if (next) { const pre = new Image(); pre.src = next.getAttribute('href'); }
  }
  function lbOpen(a) {
    lbList = gItems
      .filter((it) => gCat === 'sve' || it.dataset.cat === gCat)
      .map((it) => $('a', it));
    lbReturn = a;
    lb.hidden = false;
    html.classList.add('no-scroll');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lbShow(lbList.indexOf(a));
    $('.lb-close', lb).focus();
  }
  function lbClose() {
    lb.classList.remove('is-open');
    html.classList.remove('no-scroll');
    setTimeout(() => { lb.hidden = true; lbImg.classList.remove('is-ready'); }, 400);
    if (lbReturn) lbReturn.focus({ preventScroll: true });
  }
  gGrid.addEventListener('click', (e) => {
    const a = e.target.closest('.g-item a');
    if (!a) return;
    e.preventDefault();
    lbOpen(a);
  });
  $('.lb-close', lb).addEventListener('click', lbClose);
  $('.lb-prev', lb).addEventListener('click', () => lbShow(lbIdx - 1));
  $('.lb-next', lb).addEventListener('click', () => lbShow(lbIdx + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb-stage')) lbClose(); });
  d.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
    else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
    else if (e.key === 'Tab') {
      const f = $$('button', lb);
      const first = f[0], lastB = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); lastB.focus(); }
      else if (!e.shiftKey && d.activeElement === lastB) { e.preventDefault(); first.focus(); }
    }
  });
  let tx = 0, ty = 0;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lbIdx + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) lbClose();
  }, { passive: true });

  /* ------------------------------------------------------------ 360 tour */
  const tour = $('#setnja');
  const tourFrame = $('.tour-frame');
  const tourChips = $$('.tour-chip');
  let tourIframe = null;
  function tourSrc() { return (tourChips.find((c) => c.classList.contains('is-active')) || tourChips[0]).dataset.src; }
  function tourStart() {
    if (!tourIframe) {
      tourIframe = d.createElement('iframe');
      tourIframe.title = '360° virtualna šetnja restoranom Kod Dede';
      tourIframe.allowFullscreen = true;
      tourIframe.setAttribute('allow', 'fullscreen; accelerometer; gyroscope');
      tourIframe.referrerPolicy = 'no-referrer-when-downgrade';
      tourFrame.appendChild(tourIframe);
    }
    tourIframe.src = tourSrc();
    tour.classList.add('is-live');
  }
  $('.tour-play').addEventListener('click', tourStart);
  tourChips.forEach((c) => c.addEventListener('click', () => {
    tourChips.forEach((x) => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    tourStart();
  }));

  /* ------------------------------------------------------------ Reviews carousel */
  const rTrack = $('.rev-track');
  const rCards = $$('.rev', rTrack);
  const rBar = $('.rev-bar');
  let rPaused = false;
  let rInView = false;
  function rStep() {
    const c = rCards[0];
    return c ? c.offsetWidth + parseFloat(getComputedStyle(rTrack).columnGap || '16') : 300;
  }
  function rMove(dir) {
    const max = rTrack.scrollWidth - rTrack.clientWidth;
    if (dir > 0 && rTrack.scrollLeft >= max - 4) rTrack.scrollTo({ left: 0, behavior: 'smooth' });
    else if (dir < 0 && rTrack.scrollLeft <= 4) rTrack.scrollTo({ left: max, behavior: 'smooth' });
    else rTrack.scrollBy({ left: dir * rStep(), behavior: 'smooth' });
  }
  $$('[data-rev]').forEach((b) => b.addEventListener('click', () => { rMove(+b.dataset.rev); rPaused = true; }));
  rTrack.addEventListener('scroll', () => {
    const max = rTrack.scrollWidth - rTrack.clientWidth;
    const vis = rTrack.clientWidth / rTrack.scrollWidth;
    const p = max > 0 ? vis + (1 - vis) * (rTrack.scrollLeft / max) : 1;
    rBar.style.setProperty('--p', p.toFixed(3));
  }, { passive: true });
  ['pointerdown', 'touchstart', 'mouseenter', 'focusin'].forEach((ev) => rTrack.addEventListener(ev, () => { rPaused = true; }, { passive: true }));
  rTrack.addEventListener('mouseleave', () => { rPaused = false; });
  new IntersectionObserver(([e]) => { rInView = e.isIntersecting; }, { threshold: 0.4 }).observe(rTrack);
  if (!reduce) setInterval(() => { if (rInView && !rPaused && !d.hidden) rMove(1); }, 5500);
  rTrack.dispatchEvent(new Event('scroll'));

  /* ------------------------------------------------------------ Misc */
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  measureBands();
  layoutDishes();
  positionInd();
  paintDishes(0, 0);
  requestAnimationFrame(frame);
})();
