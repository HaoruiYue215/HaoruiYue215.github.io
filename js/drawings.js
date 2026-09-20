/* =========================================================
   drawings.js
   Animated architectural plates: clip reveal, stroke draw,
   plotter scan, and mouse parallax / tilt.
========================================================= */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function measureStrokes(svg) {
    if (!svg) return;
    svg.querySelectorAll('.trace-group > *').forEach((el, i) => {
      el.style.animationDelay = `${0.12 + i * 0.08}s`;
    });
  }

  function lerp(a, b, n) {
    return a + (b - a) * n;
  }

  function bindParallax(el, strength) {
    if (!el || reduceMotion) return;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;

    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * strength.x;
      my = (e.clientY / window.innerHeight - 0.5) * strength.y;
    }, { passive: true });

    function tick() {
      tx = lerp(tx, mx, 0.06);
      ty = lerp(ty, my, 0.06);
      const tilt = strength.tilt || 0;
      el.style.transform = tilt
        ? `translate3d(${tx}px, ${ty}px, 0) rotateX(${-ty * tilt}deg) rotateY(${tx * tilt}deg)`
        : `translate3d(${tx}px, ${ty}px, 0)`;
      requestAnimationFrame(tick);
    }
    tick();
  }

  window.playHeroDrawing = function playHeroDrawing() {
    const root = document.getElementById('heroDrawing');
    if (root) root.classList.add('is-on');
  };

  window.initDrawings = function initDrawings() {
    const heroSvg = document.querySelector('#heroDrawing .hero-drawing-trace');
    const aboutSvg = document.querySelector('#aboutDrawing .about-drawing-trace');
    measureStrokes(heroSvg);
    measureStrokes(aboutSvg);

    bindParallax(document.getElementById('heroParallax'), { x: 28, y: 18, tilt: 0 });
    const aboutStage = document.getElementById('aboutParallax');
    if (aboutStage) {
      aboutStage.style.perspective = '900px';
      bindParallax(aboutStage, { x: 10, y: 8, tilt: 0.08 });
    }

    const about = document.getElementById('aboutDrawing');
    if (about && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: '.about-visual',
        start: 'top 75%',
        once: true,
        onEnter: () => about.classList.add('is-on'),
      });
    } else if (about) {
      about.classList.add('is-on');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initDrawings);
  } else {
    window.initDrawings();
  }
})();
