/* =========================================================
   BUNZO® — v2 · GSAP / ScrollTrigger / SplitText / Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DESK = () => innerWidth >= 900;
  const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  // pas de recalcul quand la barre d'adresse mobile apparaît/disparaît (évite les sauts)
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out' });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!RM && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    e.preventDefault(); closeNav(); setTimeout(() => scrollTo(id === '#anatomie' ? anatomyPoint() : id), 50);
  }));

  /* ---------- Ouvert / fermé (heure de Paris) ---------- */
  const H = { 1: [[690, 870], [1080, 1560]], 2: [[690, 870], [1080, 1560]], 3: [[690, 870], [1080, 1560]],
              4: [[690, 870], [1080, 1560]], 5: [[1080, 1560]], 6: [[690, 1560]], 0: [[690, 1560]] };
  const fmt = m => { m %= 1440; const h = Math.floor(m / 60), mn = m % 60; return h + 'h' + (mn ? String(mn).padStart(2, '0') : ''); };
  const now = () => {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), min: (+g('hour') % 24) * 60 + +g('minute') };
  };
  function paintStatus() {
    const { day, min } = now(), prev = (day + 6) % 7;
    const rs = [...H[day], ...H[prev].map(r => [r[0] - 1440, r[1] - 1440])];
    const cur = rs.find(r => min >= r[0] && min < r[1]);
    let long, short;
    if (cur) { long = 'Ouvert · jusqu’à ' + fmt(cur[1]); short = 'Ouvert'; }
    else {
      const nx = H[day].map(r => r[0]).find(s => s > min);
      long = nx != null ? 'Fermé · ouvre à ' + fmt(nx) : 'Fermé · ouvre demain ' + fmt(H[(day + 1) % 7][0][0]);
      short = nx != null ? 'Ouvre à ' + fmt(nx) : 'Fermé';
    }
    document.body.classList.toggle('is-open', !!cur);
    $$('[data-status]').forEach(e => e.textContent = long);
    $$('[data-status-short] span').forEach(e => e.textContent = short);
    $$('.hours tr').forEach(tr => tr.classList.toggle('today', +tr.dataset.d === day));
  }
  paintStatus(); setInterval(paintStatus, 60000);
  $('#yr').textContent = new Date().getFullYear();

  /* =========================================================
     HERO : géométrie du burger (assemblé / éclaté)
     Positions relevées sur la vue éclatée (base 827 px de haut)
  ========================================================= */
  const stack = $('#stack');
  const L = {
    top: $('.ly--top', stack), garnish: $('.ly--garnish', stack), p1: $('.ly--p1', stack),
    p2: $('.ly--p2', stack), bottom: $('.ly--bottom', stack)
  };
  const ORDER = ['top', 'garnish', 'p1', 'p2', 'bottom'];
  const EXPLODE = { top: -283, garnish: -180, p1: -56, p2: 114, bottom: 283 }; // en unités /827
  const ex = (k, f = 1.32) => () => EXPLODE[k] / 827 * stack.offsetHeight * f;

  /* ---------- Loader -> hero ---------- */
  const hero = $('#hero');
  const titleSpans = $$('.hero__title [data-anim]');
  gsap.set(titleSpans, { yPercent: 110 });
  gsap.set('.hero__foot, .hd', { autoAlpha: 0 });
  gsap.set(ORDER.map(k => L[k]), { y: () => -innerHeight * 1.1, autoAlpha: 0 });
  gsap.set('.stack__shadow', { scaleX: .3, autoAlpha: 0 });

  const imgsReady = Promise.all($$('img', stack).map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const minTime = new Promise(r => setTimeout(r, RM ? 0 : 900));

  // compteur de "préchauffe"
  const ld = { v: 0 };
  const ldTween = gsap.to(ld, {
    v: 200, duration: RM ? 0.01 : 1.1, ease: 'power2.inOut',
    onUpdate: () => { $('#ldNum').textContent = String(Math.round(ld.v)).padStart(3, '0'); gsap.set('#ldBar', { scaleX: ld.v / 200 }); }
  });
  gsap.from('.loader__logo', { yPercent: 30, autoAlpha: 0, duration: 1, ease: 'expo.out' });

  Promise.all([imgsReady, fontsReady, minTime, ldTween.then()]).then(introHero);

  function introHero() {
    const tl = gsap.timeline();
    tl.to('.loader__logo', { scale: .8, autoAlpha: 0, duration: .45, ease: 'power2.in' })
      .to('.loader__top, .loader__bot, .loader__bar', { autoAlpha: 0, duration: .3 }, '<')
      .to('#loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=.1')
      .set('#loader', { display: 'none' })
      .to(titleSpans, { yPercent: 0, duration: 1.2, stagger: .09, ease: 'expo.out' }, '-=.55');

    // le burger se monte couche par couche : chaque couche tombe, s'écrase, rebondit
    const seq = ['bottom', 'p2', 'p1', 'garnish', 'top'];
    seq.forEach((k, i) => {
      const at = .85 + i * .13;
      tl.to(L[k], { y: 0, autoAlpha: 1, duration: .55, ease: 'power3.in' }, at)
        .fromTo(L[k], { scaleY: .78, scaleX: 1.08, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: .7, ease: 'elastic.out(1,.45)' }, at + .55)
        .to(stack, { y: 6, duration: .08, yoyo: true, repeat: 1, ease: 'power1.out' }, at + .55);
    });
    tl.to('.stack__shadow', { scaleX: 1, autoAlpha: 1, duration: .9 }, 1.2)
      .to('.hd, .hero__foot', { autoAlpha: 1, duration: .8 }, 1.7)
      .add(afterIntro, 2.15);
    if (RM) tl.progress(1);
  }

  function afterIntro() {
    document.body.classList.remove('is-loading');
    if (lenis) lenis.start();
    buildScroll();
    $('#dock') && ScrollTrigger.create({
      trigger: '#manifeste', start: 'top 80%', endTrigger: '#ft', end: 'top 70%',
      onToggle: s => $('#dock').classList.toggle('is-on', s.isActive)
    });
  }

  /* =========================================================
     Animations au scroll
  ========================================================= */
  function buildScroll() {
    const mm = gsap.matchMedia();

    /* ---- header ---- */
    ScrollTrigger.create({ start: 40, onToggle: s => $('#hd').classList.toggle('is-scrolled', s.isActive) });

    /* ---- HERO épinglé : le burger s'éclate (anatomie) ---- */
    mm.add({ desk: '(min-width:900px)', mob: '(max-width:899px)', rm: '(prefers-reduced-motion: reduce)' }, ctx => {
      const { desk, rm } = ctx.conditions;
      if (rm) return;
      const tags = { top: $('.tag--top'), garnish: $('.tag--garnish'), p1: $('.tag--p1'), p2: $('.tag--p2'), bottom: $('.tag--bottom') };
      const sideRight = { top: true, garnish: false, p1: true, p2: false, bottom: true };

      let S = 1;
      const pinEl = $('.hero__pin');
      const pose = () => {
        const ph = pinEl.offsetHeight, pw = pinEl.offsetWidth;
        const sh = stack.offsetHeight, sw = stack.offsetWidth;
        const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 20;
        // hauteur éclatée ≈ 1,9 × hauteur du burger : on fait tenir dans l'écran (et en largeur sur mobile)
        S = Math.min(desk ? 1.15 : .7, (ph - (desk ? 140 : 150)) / (sh * 1.92), desk ? 9 : (pw * .5) / sw);
        const cy0 = ph - parseFloat(getComputedStyle(stack).bottom) - sh / 2;
        const cy = desk ? ph * .53 : (ph + 60) / 2;
        const x = desk ? 0 : -(pw / 2) + pad + (sw * S) / 2;
        return { x, y: cy - cy0, cy };
      };
      let P = pose();

      // étiquettes calées sur la pose éclatée (valeurs de layout, sans transform)
      function placeTags() {
        P = pose();
        const pw = pinEl.offsetWidth;
        const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad')) || 20;
        const cx = pw / 2 + P.x;
        const halfW = (stack.offsetWidth * S) / 2;
        ORDER.forEach(k => {
          const el = L[k], tag = tags[k];
          const right = desk ? sideRight[k] : true;
          tag.classList.toggle('tag--right', !right);
          const ly = el.offsetTop + el.offsetHeight * (k === 'top' ? .55 : .45) - stack.offsetHeight / 2;
          const yy = P.cy + (ly + ex(k)()) * S;
          if (right) {
            const left = desk ? cx + halfW * .82 : cx + halfW + 2;
            tag.style.left = left + 'px'; tag.style.right = 'auto';
            tag.style.maxWidth = (pw - left - pad) + 'px';
          } else { tag.style.right = (pw - (cx - halfW * .82)) + 'px'; tag.style.left = 'auto'; tag.style.maxWidth = 'none'; }
          tag.style.top = (yy - tag.offsetHeight / 2) + 'px';
        });
      }
      placeTags();

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: hero, start: 'top top', end: () => '+=' + innerHeight * (desk ? 1.7 : 1.5),
          pin: '.hero__pin', scrub: true, anticipatePin: 1, invalidateOnRefresh: true,
          onRefreshInit: () => gsap.set(stack, { x: 0, y: 0, scale: 1 }),
          onRefresh: placeTags
        }
      });
      tl.to('.hero__l1 [data-anim]', { yPercent: -110, duration: .5, ease: 'power2.in' }, 0)
        .to('.hero__l2 [data-anim]', { yPercent: -110, duration: .5, ease: 'power2.in' }, .05)
        .to('.hero__l3 [data-anim]', { yPercent: -110, duration: .5, ease: 'power2.in' }, .1)
        .to('.hero__foot', { autoAlpha: 0, duration: .3 }, 0)
        .to('.stack__shadow', { autoAlpha: 0, duration: .3 }, .1)
        .to(stack, { x: () => P.x, y: () => P.y, scale: () => S, duration: .9, ease: 'power2.inOut' }, .15)
      ORDER.forEach((k, i) => {
        tl.to(L[k], { y: ex(k), duration: .9, ease: 'power3.inOut' }, .3 + Math.abs(i - 2) * .04);
      });
      tl.fromTo('.anat__kicker', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .3 }, .85);
      ORDER.forEach((k, i) => {
        const t = tags[k];
        tl.fromTo(t, { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, 1 + i * .12)
          .fromTo($('i', t), { scaleX: 0 }, { scaleX: 1, duration: .3, ease: 'power2.out' }, 1 + i * .12)
          .fromTo($('p', t), { x: () => (t.classList.contains('tag--right') ? 16 : -16), autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: .3 }, 1.08 + i * .12);
      });
      // pause de lecture puis remontage
      tl.to({}, { duration: .5 })
        .to('.anat__kicker, .tag', { autoAlpha: 0, duration: .25 }, 2.3)
        .to(ORDER.map(k => L[k]), { y: 0, duration: .6, ease: 'power3.inOut', stagger: .03 }, 2.35)
        .to(stack, { x: 0, y: () => P.y * .35, scale: desk ? .9 : .82, duration: .6, ease: 'power2.inOut' }, 2.35);

      // parallaxe souris (desktop) sur les couches
      if (desk && FINE) {
        const qs = ORDER.map((k, i) => ({ x: gsap.quickTo(L[k], 'x', { duration: .8, ease: 'power3' }), f: (i - 2) * 6 }));
        const mv = e => { const nx = e.clientX / innerWidth - .5; qs.forEach(q => q.x(nx * q.f * 2)); };
        addEventListener('mousemove', mv);
        return () => removeEventListener('mousemove', mv);
      }
    });

    /* ---- titres splittés génériques ---- */
    $$('[data-split]').forEach(el => {
      gsap.from(el, { yPercent: 110, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.kicker').forEach(el => {
      if (el.closest('.hero') || el.closest('.sg')) return;
      gsap.from(el, { autoAlpha: 0, x: -14, duration: .9, scrollTrigger: { trigger: el, start: 'top 90%' } });
    });

    /* ---- MANIFESTE : les mots se remplissent au scroll ---- */
    const split = new SplitText('#mfTxt', { type: 'words', wordsClass: 'w' });
    gsap.to(split.words, {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: '#mfTxt', start: 'top 78%', end: 'bottom 45%', scrub: true }
    });
    $$('.pill').forEach(p => gsap.to(p, {
      scale: 1, ease: 'back.out(1.6)', duration: .8,
      scrollTrigger: { trigger: p, start: 'top 72%', toggleActions: 'play none none reverse' }
    }));
    $$('[data-count]').forEach(el => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' },
        onUpdate: () => el.textContent = o.v.toFixed(dec).replace('.', ',') });
    });

    /* ---- SIGNATURES : carrousel (flèches, doigt, trackpad, clavier) ---- */
    initSignatures();

    /* ---- GALERIE : parallaxe légère (ordinateur), simple apparition (mobile) ---- */
    mm.add('(min-width:900px)', () => {
      $$('.gl__col').forEach(c => gsap.to(c, {
        yPercent: parseFloat(c.dataset.speed) * 60, ease: 'none',
        scrollTrigger: { trigger: '.gl__cols', start: 'top bottom', end: 'bottom top', scrub: true }
      }));
    });
    $$('.ph').forEach(ph => gsap.from(ph, { autoAlpha: 0, y: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: ph, start: 'top 92%' } }));

    /* ---- AVIS : empilement en CSS (sticky), aucune animation au scroll ---- */
    gsap.from('.av__score b', { yPercent: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.av__score', start: 'top 85%' } });

    /* ---- VENIR ---- */
    gsap.to('.vn__img', { clipPath: 'inset(0 0 0% 0 round 20px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.vn__img', start: 'top 85%' } });
    gsap.from('.vn__street', { yPercent: 30, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.vn__street', start: 'top 88%' } });
    gsap.from('.hours tr', { autoAlpha: 0, x: -20, stagger: .05, duration: .8, scrollTrigger: { trigger: '.hours', start: 'top 85%' } });

    /* ---- FOOTER : le logo se ré-assemble ---- */
    const ft = gsap.timeline({ defaults: { duration: 1.1, ease: 'expo.out' }, scrollTrigger: { trigger: '#ftLogo', start: 'top 85%' } });
    ft.from('.f-top', { yPercent: -60, autoAlpha: 0 }, 0)
      .from('.f-bot', { yPercent: 60, autoAlpha: 0 }, .08)
      .from('.f-word', { yPercent: 30, autoAlpha: 0 }, .04)
      .from('.f-reg', { scale: 0, ease: 'back.out(2)', duration: .6 }, .5);
    gsap.from('.ft__order', { yPercent: 50, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ft__cta', start: 'top 85%' } });

    /* ---- Classiques : entrée ---- */
    initBuilder();

    ScrollTrigger.refresh();
  }
  function initSignatures() {
    const track = $('#sgTrack'), slides = $$('.sl', track), n = slides.length;
    const prev = $('#sgPrev'), next = $('#sgNext');
    gsap.set('.sl__img', { xPercent: -50, yPercent: -50 });
    let cur = 0;
    const idx = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const go = i => {
      i = Math.max(0, Math.min(n - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: RM ? 'auto' : 'smooth' });
    };
    function enter(i, dir) {
      const sl = slides[i];
      gsap.fromTo($('.sl__img', sl), { scale: .86, rotation: 8 * dir }, { scale: 1, rotation: 0, duration: 1, ease: 'expo.out', overwrite: 'auto' });
      gsap.fromTo($('.sl__info', sl).children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .05, ease: 'expo.out', overwrite: 'auto' });
      gsap.fromTo($('.sl__name', sl), { xPercent: 8 * dir }, { xPercent: 0, duration: 1.2, ease: 'expo.out', overwrite: 'auto' });
    }
    function update() {
      const p = track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth);
      gsap.set('#sgBar', { scaleX: (p * (n - 1) + 1) / n });
      const i = idx();
      prev.disabled = i <= 0; next.disabled = i >= n - 1;
      if (i !== cur) { const dir = i > cur ? 1 : -1; cur = i; $('#sgNum').textContent = '0' + (i + 1); if (!RM) enter(i, dir); }
    }
    prev.addEventListener('click', () => go(cur - 1));
    next.addEventListener('click', () => go(cur + 1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    addEventListener('resize', () => track.scrollTo({ left: cur * track.clientWidth }));
    update();
    // entrée de la première signature
    if (!RM) gsap.from('.sl:first-child .sl__img', { scale: .85, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.sg', start: 'top 70%' } });
  }
  function anatomyPoint() { return hero.offsetTop + innerHeight * 1.05; }

  /* =========================================================
     CLASSIQUES : M / L / XL avec les vraies couches photo
  ========================================================= */
  function initBuilder() {
    const build = $('#build');
    const B = { bottom: $('.ly--bottom', build), garnish: $('.ly--garnish', build), top: $('.ly--top', build) };
    const PSRC = ['img/l-patty2.webp', 'img/l-patty1.webp', 'img/l-patty2.webp'];
    const PW = [756, 751, 756], PX = [9, 14, 9];
    const patties = [];
    const SIZES = {
      M: { n: 1, tag: 'Pour les plus prudents.', solo: 9.5, menu: 11.9, pat: 'smashed patty' },
      L: { n: 2, tag: 'Pour un équilibre parfait.', solo: 10.9, menu: 13.5, pat: 'double smashed patty' },
      XL: { n: 3, tag: 'Pour les plus téméraires.', solo: 12, menu: 14.5, pat: 'triple smashed patty' }
    };
    let cur = null;
    const s = () => build.offsetWidth / 780;
    const H = () => build.offsetHeight;
    function geom(n) {
      const k = s(), bt = H() - 313 * k;
      const ys = []; for (let i = 0; i < n; i++) ys.push(bt - 74 * k - 77 * k * i);
      const g = (n ? ys[n - 1] : bt) - 90 * k;
      return { bottom: bt, patties: ys, garnish: g, top: g - 273 * k };
    }
    function sizeEls() {
      const k = s();
      gsap.set(B.bottom, { width: 675 * k, left: 49 * k });
      gsap.set(B.garnish, { width: 698 * k, left: 37 * k });
      gsap.set(B.top, { width: 697 * k, left: 44 * k });
      patties.forEach((p, i) => gsap.set(p, { width: PW[i] * k, left: PX[i] * k }));
    }
    function makePatty(i) {
      const im = new Image(); im.src = PSRC[i]; im.alt = ''; im.className = 'ly';
      im.style.zIndex = 2 + i; build.appendChild(im); patties.push(im);
      gsap.set(im, { width: PW[i] * s(), left: PX[i] * s(), y: -innerHeight * .6, autoAlpha: 0 });
      return im;
    }
    gsap.set('.seg__pill', { xPercent: 100 });
    gsap.set(B.bottom, { zIndex: 1 }); gsap.set(B.garnish, { zIndex: 10 }); gsap.set(B.top, { zIndex: 11 });

    const nums = { solo: { v: 10.9 }, menu: { v: 13.5 } };
    const eur = v => v.toFixed(2).replace('.', ',') + ' €';

    function setSize(key, first) {
      if (key === cur) return; cur = key;
      const S = SIZES[key];
      $$('.seg button').forEach((b, i) => {
        const on = b.dataset.size === key; b.setAttribute('aria-selected', on);
        if (on) gsap.to('.seg__pill', { xPercent: i * 100, duration: .7, ease: 'elastic.out(1,.7)' });
      });
      const removed = [];
      while (patties.length > S.n) removed.push(patties.pop());
      while (patties.length < S.n) makePatty(patties.length);
      const G = geom(S.n);
      const tl = gsap.timeline();
      removed.forEach(p => tl.to(p, { y: '-=' + innerHeight * .5, autoAlpha: 0, rotation: 12, duration: .5, ease: 'power3.in', onComplete: () => p.remove() }, 0));
      tl.to(B.bottom, { y: G.bottom, autoAlpha: 1, duration: first ? 0 : .6, ease: 'power3.out' }, 0);
      patties.forEach((p, i) => {
        const fresh = gsap.getProperty(p, 'autoAlpha') < 1;
        if (fresh) {
          tl.set(p, { y: G.top - 260 * s(), autoAlpha: 1, rotation: 0 }, .1)
            .to(p, { y: G.patties[i], duration: .5, ease: 'power3.in' }, .1 + i * .06)
            .fromTo(p, { scaleY: .8, scaleX: 1.08, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: .7, ease: 'elastic.out(1,.4)' }, .6 + i * .06);
        } else tl.to(p, { y: G.patties[i], rotation: 0, duration: .6, ease: 'power3.out' }, 0);
      });
      tl.to(B.garnish, { y: G.garnish, autoAlpha: 1, duration: .7, ease: 'back.out(1.4)' }, removed.length ? .25 : .05)
        .to(B.top, { y: G.top, autoAlpha: 1, duration: .8, ease: 'back.out(1.5)' }, removed.length ? .3 : .1);
      if (first) tl.progress(1);

      // textes
      const big = $('#szBig');
      gsap.timeline().to(big, { yPercent: -20, autoAlpha: 0, duration: .25, ease: 'power2.in' })
        .add(() => big.textContent = key).fromTo(big, { yPercent: 20, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: .6, ease: 'expo.out' });
      $('#szTag').textContent = S.tag; $('#szPat').textContent = S.pat;
      gsap.fromTo('#szTag', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .5 });
      gsap.to(nums.solo, { v: S.solo, duration: first ? 0 : .8, ease: 'power2.out', onUpdate: () => $('#szSolo').textContent = eur(nums.solo.v) });
      gsap.to(nums.menu, { v: S.menu, duration: first ? 0 : .8, ease: 'power2.out', onUpdate: () => $('#szMenu').textContent = eur(nums.menu.v) });
    }

    // état initial caché, puis montage à l'entrée dans la section
    gsap.set([B.bottom, B.garnish, B.top], { autoAlpha: 0, y: -innerHeight * .4 });
    sizeEls();
    let started = false;
    ScrollTrigger.create({
      trigger: '.sz__stage', start: 'top 75%', once: true,
      onEnter: () => {
        started = true; cur = null;
        const G0 = geom(2);
        makePatty(0); makePatty(1); cur = 'L';
        const tl = gsap.timeline();
        const seq = [[B.bottom, G0.bottom], [patties[0], G0.patties[0]], [patties[1], G0.patties[1]], [B.garnish, G0.garnish], [B.top, G0.top]];
        seq.forEach(([el, y], i) => {
          tl.set(el, { y: G0.top - 300 * s(), autoAlpha: 1 }, i * .14)
            .to(el, { y, duration: .5, ease: 'power3.in' }, i * .14)
            .fromTo(el, { scaleY: .8, scaleX: 1.07, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: .7, ease: 'elastic.out(1,.4)' }, i * .14 + .5);
        });
      }
    });
    $$('.seg button').forEach(b => b.addEventListener('click', () => { if (started) setSize(b.dataset.size); }));
    // swipe sur le burger
    let x0 = null; const st = $('.sz__stage'); const ord = ['M', 'L', 'XL'];
    st.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    st.addEventListener('touchend', e => {
      if (x0 == null || !started) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 40) return; const i = ord.indexOf(cur); const n = Math.max(0, Math.min(2, i + (dx < 0 ? 1 : -1)));
      if (n !== i) setSize(ord[n]);
    });
    addEventListener('resize', () => {
      sizeEls(); if (!started || !cur) return;
      const G = geom(SIZES[cur].n);
      gsap.set(B.bottom, { y: G.bottom }); gsap.set(B.garnish, { y: G.garnish }); gsap.set(B.top, { y: G.top });
      patties.forEach((p, i) => gsap.set(p, { y: G.patties[i] }));
    });
  }

  /* =========================================================
     CARTE : accordéon
  ========================================================= */
  $$('.acc__it').forEach(it => {
    const hd = $('.acc__hd', it), bd = $('.acc__bd', it);
    hd.addEventListener('click', () => {
      const open = !it.classList.contains('is-open');
      $$('.acc__it.is-open').forEach(o => { if (o !== it) toggle(o, false); });
      toggle(it, open);
    });
    function toggle(item, open) {
      const b = $('.acc__bd', item);
      item.classList.toggle('is-open', open); $('.acc__hd', item).setAttribute('aria-expanded', open);
      if (open) {
        gsap.fromTo(b, { height: 0 }, { height: 'auto', duration: .7, ease: 'expo.out', onComplete: () => ScrollTrigger.refresh() });
        gsap.from($$('li, .acc__note, .acc__fries', b), { y: 16, autoAlpha: 0, stagger: .035, duration: .6, delay: .1 });
      } else gsap.to(b, { height: 0, duration: .5, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() });
    }
  });

  /* =========================================================
     NAV plein écran
  ========================================================= */
  const nav = $('#nav'), menuBtn = $('#menuBtn');
  const navTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.inOut' } })
    .set(nav, { visibility: 'visible' })
    .fromTo('.nav__bg', { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .8 })
    .from('.nav__list b', { yPercent: 110, duration: .9, stagger: .05, ease: 'expo.out' }, .35)
    .from('.nav__list span', { autoAlpha: 0, duration: .4, stagger: .05 }, .5)
    .from('.nav__list li', { borderBottomColor: 'rgba(11,15,12,0)', duration: .6, stagger: .05 }, .4)
    .from('.nav__foot p', { autoAlpha: 0, y: 14, duration: .6, stagger: .08, ease: 'expo.out' }, .6)
    .from('.nav__burger', { yPercent: 60, rotation: 30, autoAlpha: 0, duration: 1, ease: 'expo.out' }, .5);
  let navOpen = false;
  function openNav() { navOpen = true; document.body.classList.add('nav-open'); menuBtn.setAttribute('aria-expanded', 'true'); nav.setAttribute('aria-hidden', 'false'); lenis && lenis.stop(); navTl.timeScale(1).play(); }
  function closeNav() { if (!navOpen) return; navOpen = false; document.body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); nav.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); navTl.timeScale(1.6).reverse(); }
  menuBtn.addEventListener('click', () => navOpen ? closeNav() : openNav());
  addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  /* =========================================================
     Curseur + boutons magnétiques (desktop)
  ========================================================= */
  if (FINE && !RM) {
    const cur = $('.cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); });
    $$('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add(el.dataset.cursor === 'hide' ? 'is-hide' : 'is-big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-big', 'is-hide'));
    });
    $$('[data-magnetic]').forEach(el => {
      const qx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' }), qy = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .3); qy((e.clientY - r.top - r.height / 2) * .3); });
      el.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* Mentions légales */
  const legal = $('#legal');
  $('#legalBtn').addEventListener('click', () => legal.showModal ? legal.showModal() : legal.setAttribute('open', ''));
  $('#legalClose').addEventListener('click', () => legal.close ? legal.close() : legal.removeAttribute('open'));
})();
