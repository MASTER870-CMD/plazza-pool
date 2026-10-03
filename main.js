/* ==========================================================================
   PALAZZO POOLS — main.js
   Vanilla JS, no dependencies. Everything degrades gracefully if it fails:
   content is visible without JS, and the numbers in the HTML are the final values.
   ========================================================================== */
(() => {
  'use strict';

  /* ---- Configuration ---------------------------------------------------- */
  // Contact form delivery. Paste the endpoint from your form service
  // (e.g. a Formspree / Getform / Basin URL) to send submissions in the background.
  // Leave empty to open the visitor's email app with the request pre-filled.
  const FORM_ENDPOINT = '';
  const CONTACT_EMAIL = 'rudy@palazzo-pools.com';
  const PHONE_DISPLAY = '714-331-9575';

  /* ---- Helpers ---------------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ---- Footer year ------------------------------------------------------ */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Navigation: transparent -> ivory on scroll, hero parallax -------- */
  const nav = $('[data-nav]');
  const heroImg = $('.hero__img');
  const hero = $('.hero');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    // Very subtle parallax, desktop only, only while the hero is on screen.
    if (heroImg && hero && !reduceMotion && canHover && y < hero.offsetHeight) {
      heroImg.style.setProperty('--py', `${(y * 0.06).toFixed(1)}px`);
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---- Mobile menu ------------------------------------------------------ */
  const toggle = $('.nav__toggle');
  const menu = $('#menu');

  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) { menu.removeAttribute('inert'); } else { menu.setAttribute('inert', ''); }
    if (open) { const first = $('a', menu); if (first) setTimeout(() => first.focus({ preventScroll: true }), 120); }
  };

  if (toggle && menu) {
    menu.setAttribute('inert', '');
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 1180px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  /* ---- Scroll reveals --------------------------------------------------- */
  const revealEls = $$('.reveal, .mask');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        // After a mask reveal finishes, hand the image back to the hover transition.
        if (el.classList.contains('mask')) setTimeout(() => el.classList.add('is-done'), 1900);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in', 'is-done'));
  }

  /* ---- Safety net: never leave a photo block hidden --------------------- */
  // If the observer misses an element (some browsers, file:// previews, fast jumps to an anchor),
  // this sweep reveals anything that is actually inside the viewport.
  if (hasIO && !reduceMotion) {
    let pending = false;
    const sweep = () => {
      pending = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      $$('.reveal:not(.is-in), .mask:not(.is-in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh * 0.94 && r.right > 0 && r.left < vw) {
          el.classList.add('is-in');
          if (el.classList.contains('mask')) setTimeout(() => el.classList.add('is-done'), 1900);
        }
      });
    };
    const queue = () => { if (!pending) { pending = true; requestAnimationFrame(sweep); } };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('load', queue);
    queue();
  }

  /* ---- Image safety net: retry once with the other file-extension case --- */
  // The photo host can be case-sensitive (.JPG vs .jpg). If a photo fails, try the other spelling once.
  const flipCase = (src) => src.replace(/\.(jpe?g|png)(\?.*)?$/i, (m, ext, q) =>
    '.' + (ext === ext.toUpperCase() ? ext.toLowerCase() : ext.toUpperCase()) + (q || ''));
  $$('img').forEach((img) => {
    const retry = () => {
      if (img.dataset.retried) return;
      img.dataset.retried = '1';
      const cur = img.getAttribute('src') || '';
      const next = flipCase(cur);
      if (next !== cur) img.src = next;
    };
    img.addEventListener('error', retry);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) retry();
  });

  /* ---- Count-up numbers ------------------------------------------------- */
  const counters = $$('[data-count]');
  const runCount = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (!Number.isFinite(target)) return;
    const duration = 1700;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (hasIO && !reduceMotion && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---- Active nav link while scrolling ---------------------------------- */
  const navLinks = $$('.nav__links a, .menu__list a');
  const sectionIds = ['home', 'work', 'services', 'new-construction', 'about', 'service-area', 'contact'];
  if (hasIO && navLinks.length) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionIds.forEach((id) => { const s = document.getElementById(id); if (s) sio.observe(s); });
  }

  /* ---- Map pins reveal -------------------------------------------------- */
  const map = $('.map');
  if (map) {
    if (hasIO && !reduceMotion) {
      const mio = new IntersectionObserver((entries) => {
        entries.forEach((entry) => { if (entry.isIntersecting) { map.classList.add('is-in'); mio.disconnect(); } });
      }, { threshold: 0.3 });
      mio.observe(map);
    } else {
      map.classList.add('is-in');
    }
  }

  /* ---- Hide the sticky mobile bar once the contact section is on screen -- */
  const mbar = $('.mbar');
  const contact = $('#contact');
  if (mbar && contact && hasIO) {
    const bio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => mbar.classList.toggle('is-hidden', entry.isIntersecting));
    }, { threshold: 0.25 });
    bio.observe(contact);
  }

  /* ---- "Behind the build" strip arrows ---------------------------------- */
  const strip = $('.strip');
  if (strip) {
    const by = (dir) => strip.scrollBy({ left: dir * Math.round(strip.clientWidth * 0.8), behavior: reduceMotion ? 'auto' : 'smooth' });
    const prev = $('[data-strip-prev]');
    const next = $('[data-strip-next]');
    if (prev) prev.addEventListener('click', () => by(-1));
    if (next) next.addEventListener('click', () => by(1));
  }

  /* ---- Lightbox --------------------------------------------------------- */
  const lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    const lbImg = $('.lightbox__img', lb);
    const lbTitle = $('.lightbox__cap strong', lb);
    const lbNote = $('.lightbox__cap span', lb);
    const lbCount = $('.lightbox__count', lb);
    let group = [];
    let index = 0;
    let opener = null;

    const render = (animate) => {
      const trigger = group[index];
      const thumb = $('img', trigger);
      const swap = () => {
        lbImg.src = thumb.currentSrc || thumb.src;
        lbImg.alt = thumb.alt;
        lbTitle.textContent = trigger.dataset.label || '';
        lbNote.textContent = trigger.dataset.note || '';
        lbCount.textContent = `${index + 1} / ${group.length}`;
        lbImg.classList.remove('is-switching');
      };
      if (animate && !reduceMotion) {
        lbImg.classList.add('is-switching');
        setTimeout(swap, 180);
      } else {
        swap();
      }
      // Warm the cache for neighbouring images.
      [-1, 1].forEach((d) => {
        const n = group[(index + d + group.length) % group.length];
        const t = n && $('img', n);
        if (t) { const pre = new Image(); pre.src = t.src; }
      });
    };

    const open = (trigger) => {
      group = $$(`[data-lightbox="${trigger.dataset.lightbox}"]`);
      index = Math.max(0, group.indexOf(trigger));
      opener = trigger;
      render(false);
      lb.showModal();
      document.body.classList.add('lb-open');
    };
    const step = (dir) => { index = (index + dir + group.length) % group.length; render(true); };

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-lightbox]');
      if (trigger) { e.preventDefault(); open(trigger); }
    });
    $('[data-lb-prev]', lb).addEventListener('click', () => step(-1));
    $('[data-lb-next]', lb).addEventListener('click', () => step(1));
    $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
    lb.addEventListener('close', () => {
      document.body.classList.remove('lb-open');
      if (opener) opener.focus({ preventScroll: true });
    });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // Swipe on touch screens
    let touchX = null;
    lb.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      touchX = null;
    }, { passive: true });
  }

  /* ---- Contact form ----------------------------------------------------- */
  const form = $('#estimate-form');
  const status = $('#form-status');
  const setStatus = (msg, kind) => {
    status.textContent = msg;
    status.className = `form__status${kind ? ` is-${kind}` : ''}`;
  };

  if (form && status) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.elements.website && form.elements.website.value) return; // honeypot
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        message: form.elements.message.value.trim(),
      };
      const submit = $('button[type="submit"]', form);

      if (FORM_ENDPOINT) {
        submit.disabled = true;
        setStatus('Sending your request…', '');
        try {
          const res = await fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          form.reset();
          setStatus('Thank you for contacting us. We will get back to you as soon as possible.', 'ok');
        } catch (err) {
          setStatus(`We couldn’t send your request. Please call ${PHONE_DISPLAY} or email ${CONTACT_EMAIL}.`, 'err');
        } finally {
          submit.disabled = false;
        }
        return;
      }

      // No endpoint configured: hand the request to the visitor's email app.
      const subject = encodeURIComponent('Free estimate request');
      const body = encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\n\n${data.message}`
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus(`Your email app should open with your request ready to send. If it doesn’t, call ${PHONE_DISPLAY} or email ${CONTACT_EMAIL}.`, 'ok');
    });
  }
})();
