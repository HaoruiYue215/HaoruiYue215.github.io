/* =========================================================
   main.js
   Loader, custom cursor, nav, scroll reveals, marquee-safe,
   stat counters, blueprint draw-in.
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- LOADER ---------------- */
  const loader = document.getElementById('loader');
  const loaderNum = document.getElementById('loaderNum');
  let count = 0;
  const counter = setInterval(() => {
    count += Math.ceil(Math.random() * 9) + 3;
    if (count >= 100) {
      count = 100;
      clearInterval(counter);
      finishLoad();
    }
    loaderNum.textContent = count;
  }, 70);

  function finishLoad() {
    setTimeout(() => {
      loader.classList.add('hide');
      playHeroIntro();
      document.body.style.cursor = 'none';
    }, 300);
  }
  // Safety net in case interval logic stalls
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!loader.classList.contains('hide')) {
        clearInterval(counter);
        finishLoad();
      }
    }, 3500);
  });

  /* ---------------- HERO INTRO ---------------- */
  function playHeroIntro() {
    gsap.to('.reveal-char', {
      y: 0, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.1,
    });
    gsap.to('.hero-tag', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.5 });
    gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.75 });
    gsap.to('.hero-sub-en', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.9 });
  }

  /* ---------------- CUSTOM CURSOR ---------------- */
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  function raf() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(raf);
  }
  raf();

  document.querySelectorAll('a, button, .skill-col, .project-card').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('big'));
    el.addEventListener('mouseleave', () => ring.classList.remove('big'));
  });

  /* ---------------- NAV / MOBILE MENU ---------------- */
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  /* ---------------- SCROLL REVEALS ---------------- */
  gsap.utils.toArray('.reveal-up').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* Blueprint SVG draw-in on scroll */
  const bpGroup = document.querySelector('.bp-group');
  if (bpGroup) {
    ScrollTrigger.create({
      trigger: '.about-visual',
      start: 'top 75%',
      onEnter: () => bpGroup.classList.add('in-view'),
    });
  }

  /* Timeline items stagger line-draw (top border reveal) */
  gsap.utils.toArray('.tl-item').forEach((item, i) => {
    gsap.fromTo(item, { opacity: 0, y: 50 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 85%' },
    });
  });

  /* ---------------- STAT COUNTERS ---------------- */
  document.querySelectorAll('.stat-num').forEach((el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to({ val: 0 }, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = this.targets()[0].val.toFixed(decimals);
          },
        });
      },
    });
  });

  /* ---------------- SECTION NUMBER / TITLE FADE ---------------- */
  gsap.utils.toArray('.section-head').forEach((head) => {
    gsap.from(head, {
      opacity: 0, y: 24, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: head, start: 'top 85%' },
    });
  });
});
