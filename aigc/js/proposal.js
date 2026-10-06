// 声纹 SOUNDPRINT · 方案页交互：导航状态 + 滚动显现
(function () {
  "use strict";

  var nav = document.getElementById("nav");

  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("in");
    });
  }

  var links = nav.querySelectorAll(".nav-links a");
  var sections = [];
  links.forEach(function (a) {
    var target = document.querySelector(a.getAttribute("href"));
    if (target) sections.push({ link: a, el: target });
  });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          sections.forEach(function (s) {
            s.link.classList.toggle("active", s.el === entry.target);
          });
        });
      },
      { rootMargin: "-38% 0px -55% 0px" }
    );
    sections.forEach(function (s) {
      spy.observe(s.el);
    });
  }
})();
