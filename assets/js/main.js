/* =========================================================
   AKOMA SPECIALIST HOSPITAL — Interactions
   Healing Hands, Caring Heart
   ========================================================= */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. Split headings into words ---------- */
  function splitWords(el) {
    const frag = document.createDocumentFragment();
    let i = 0;
    const wrap = (node) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.style.setProperty('--i', i++);
      inner.append(node);
      outer.append(inner);
      return outer;
    };
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) frag.append(document.createTextNode(' '));
          else frag.append(wrap(document.createTextNode(t)));
        });
      } else if (n.nodeName === 'BR') {
        frag.append(n);
      } else {
        frag.append(wrap(n));
      }
    });
    el.innerHTML = '';
    el.append(frag);
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- 2. Scroll-fill text (core values) ---------- */
  const fillEls = $$('.fill-text');
  fillEls.forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    const accent = ['healthy', 'community'];
    el.innerHTML = words
      .map((w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        return `<span class="fw${accent.includes(clean) ? ' accent' : ''}">${w}</span>`;
      })
      .join(' ');
  });

  function updateFill() {
    fillEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
      const spans = el.querySelectorAll('.fw');
      const lit = reduceMotion ? spans.length : Math.round(p * spans.length);
      spans.forEach((s, idx) => s.classList.toggle('lit', idx < lit));
    });
  }

  /* ---------- 3. Reveal on scroll ---------- */
  function startReveals() {
    const targets = $$('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach((t) => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- 4. Counters ---------- */
  function startCounters() {
    const counters = $$('[data-count]');
    const run = (el) => {
      const end = parseInt(el.dataset.count, 10);
      if (reduceMotion) { el.textContent = end; return; }
      const dur = 1800;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- 5. Hero slider with progress bars ---------- */
  const slides  = $$('.hero-slide');
  const bars    = $$('.hb-progress button');
  const caption = $('#heroCaption');
  const SLIDE_MS = 5500;
  document.documentElement.style.setProperty('--slide', `${SLIDE_MS}ms`);
  let current = 0;
  let slideTimer;

  function setBars() {
    if (!bars.length) return;
    bars.forEach((b, i) => {
      b.classList.remove('active', 'done');
      b.setAttribute('aria-selected', i === current ? 'true' : 'false');
      if (i < current) b.classList.add('done');
    });
    void bars[current].querySelector('i').offsetWidth; // restart fill animation
    bars[current].classList.add('active');
  }

  function goTo(i) {
    if (!slides.length) return;
    slides[current].classList.remove('active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('active');
    if (caption) {
      caption.classList.add('swap');
      setTimeout(() => {
        caption.textContent = slides[current].dataset.caption;
        caption.classList.remove('swap');
      }, 350);
    }
    setBars();
  }

  function autoSlide() {
    clearInterval(slideTimer);
    if (!reduceMotion && slides.length > 1) {
      slideTimer = setInterval(() => goTo(current + 1), SLIDE_MS);
    }
  }

  bars.forEach((b, i) => b.addEventListener('click', () => { goTo(i); autoSlide(); }));

  // Pause the slider when the tab is hidden, resume when visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(slideTimer);
    else { setBars(); autoSlide(); }
  });

  /* ---------- 6. Preloader & start ---------- */
  let started = false;
  function onReady() {
    if (started) return;
    started = true;
    document.body.classList.add('is-loaded');
    setTimeout(() => {
      startReveals();
      startCounters();
      if (slides.length) { setBars(); autoSlide(); }
    }, reduceMotion ? 0 : 250);
  }
  window.addEventListener('load', () => setTimeout(onReady, reduceMotion ? 0 : 700));
  setTimeout(onReady, 3500); // safety fallback if some images load slowly

  /* ---------- 7. Header, progress bar & back-to-top ---------- */
  const header = $('#siteHeader');
  const bar    = $('.scroll-progress');
  const toTop  = $('#toTop');
  const ring   = $('#toTop .ring-fg');
  let ticking  = false;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (ring) ring.style.strokeDashoffset = 100 - p * 100;
    updateFill();
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateFill, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    );
  }

  /* ---------- 8. Active nav link ---------- */
  const navLinks = $$('.nav-links .nav-link');
  const sections = navLinks.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          navLinks.forEach((l) =>
            l.classList.toggle('active', l.getAttribute('href') === `#${e.target.id}`)
          );
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navIO.observe(s));
  }

  /* ---------- 9. Live BPM (synced to heartbeat speed) ---------- */
  const bpmEl = $('#bpm');
  if (bpmEl && !reduceMotion) {
    setInterval(() => {
      const bpm = 68 + Math.floor(Math.random() * 9); // 68–76 bpm
      bpmEl.textContent = bpm;
      document.documentElement.style.setProperty('--beat', `${(60 / bpm).toFixed(2)}s`);
    }, 2400);
  }

  /* ---------- 10. Hero mouse parallax ---------- */
  const hero = $('.hero');
  const depthEls = $$('.hero [data-depth]');
  if (hero && finePointer && !reduceMotion) {
    let raf = null;
    hero.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        depthEls.forEach((el) => {
          const d = parseFloat(el.dataset.depth);
          el.style.transform = `translate(${x * d}px, ${y * d}px)`;
        });
        raf = null;
      });
    });
    hero.addEventListener('mouseleave', () => depthEls.forEach((el) => (el.style.transform = '')));
  }

  /* ---------- 11. Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });
  }

  /* ---------- 12. Libraries (Bootstrap & Swiper) ---------- */
  window.addEventListener('DOMContentLoaded', () => {

    /* Close mobile menu when a link is clicked */
    const mobileNav = $('#mobileNav');
    if (mobileNav && window.bootstrap) {
      $$('#mobileNav a[href^="#"]').forEach((a) => {
        a.addEventListener('click', () => {
          const oc = bootstrap.Offcanvas.getInstance(mobileNav);
          if (oc) oc.hide();
        });
      });
    }

    /* Sliders */
    if (window.Swiper) {
      new Swiper('.team-swiper', {
        slidesPerView: 1.15,
        spaceBetween: 18,
        loop: true,
        speed: 900,
        grabCursor: true,
        autoplay: reduceMotion ? false : { delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination: { el: '.team-pagination', clickable: true },
        navigation: { nextEl: '.team-next', prevEl: '.team-prev' },
        breakpoints: {
          576:  { slidesPerView: 2 },
          992:  { slidesPerView: 3 },
          1200: { slidesPerView: 4, spaceBetween: 24 }
        },
        a11y: { enabled: true }
      });

      new Swiper('.testi-swiper', {
        slidesPerView: 1,
        spaceBetween: 22,
        loop: true,
        speed: 900,
        grabCursor: true,
        autoplay: reduceMotion ? false : { delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination: { el: '.testi-pagination', clickable: true },
        breakpoints: {
          768:  { slidesPerView: 2 },
          1200: { slidesPerView: 3, spaceBetween: 26 }
        },
        a11y: { enabled: true }
      });
    }

    /* Gallery lightbox */
    const items = $$('.gallery-item');
    const lbEl  = $('#lightbox');
    const lbImg = $('#lbImg');
    let lbIndex = 0;
    if (lbEl && lbImg && items.length && window.bootstrap) {
      const lb = new bootstrap.Modal(lbEl);
      const show = (i) => {
        lbIndex = (i + items.length) % items.length;
        const img = items[lbIndex].querySelector('img');
        lbImg.src = items[lbIndex].href;
        lbImg.alt = img ? img.alt : '';
      };
      items.forEach((it, i) =>
        it.addEventListener('click', (e) => { e.preventDefault(); show(i); lb.show(); })
      );
      $('.lb-prev').addEventListener('click', () => show(lbIndex - 1));
      $('.lb-next').addEventListener('click', () => show(lbIndex + 1));
      lbEl.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(lbIndex - 1);
        if (e.key === 'ArrowRight') show(lbIndex + 1);
      });
    }

    /* Video modal: load on open, stop on close */
    const vModal = $('#videoModal');
    const vFrame = $('#videoFrame');
    if (vModal && vFrame) {
      vModal.addEventListener('show.bs.modal', () => (vFrame.src = vFrame.dataset.src));
      vModal.addEventListener('hidden.bs.modal', () => (vFrame.src = ''));
    }

    /* Forms: validation + success toast */
    const toastEl = $('#formToast');
    const toastMsg = $('#toastMsg');
    const toast = toastEl && window.bootstrap ? new bootstrap.Toast(toastEl, { delay: 4500 }) : null;

    $$('form.js-validate').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          const firstInvalid = form.querySelector(':invalid');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        // TODO: connect to your backend / email service here (e.g. fetch() to Formspree or PHP mailer)

        if (toastMsg) {
          toastMsg.textContent = form.id === 'appointmentForm'
            ? 'Thank you! Your appointment request was received. We’ll confirm within 24 hours.'
            : 'You’re subscribed! Health tips from Akoma are on their way.';
        }
        if (toast) toast.show();
        form.reset();
        form.classList.remove('was-validated');
      });
    });
  });

  /* ---------- 13. Misc ---------- */
  const dateInput = $('#apDate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();