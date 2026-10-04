/* PROPATISS — animations modernes, JS pur (~3 Ko), aucune dépendance */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var doc = document, root = doc.documentElement;

  /* 1. Barre de progression + header compact au scroll */
  var bar = doc.createElement('div');
  bar.className = 'rose-progress';
  doc.body.appendChild(bar);
  var header = doc.querySelector('.pp-header'), ticking = false;
  function onScroll() {
    var max = root.scrollHeight - root.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (reduce) return; // le reste = animations décoratives

  /* 2. Pétales flottants (8 éléments, GPU only) */
  var wrap = doc.createElement('div');
  wrap.className = 'rose-petals';
  wrap.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < 8; i++) {
    var p = doc.createElement('span');
    p.className = 'rose-petal';
    p.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;' +
      '--s:' + (10 + Math.random() * 14).toFixed(0) + 'px;' +
      '--x:' + (Math.random() * 160 - 80).toFixed(0) + 'px;' +
      '--d:' + (14 + Math.random() * 12).toFixed(1) + 's;' +
      '--delay:-' + (Math.random() * 20).toFixed(1) + 's';
    wrap.appendChild(p);
  }
  doc.body.insertBefore(wrap, doc.body.firstChild);

  /* 3. Apparition au scroll (avec effet cascade) */
  var SEL = '.pp-section-title, .pp-prod-card, .pp-info-card, .pp-side-card, .pp-form-container,' +
            ' .pp-faq-card, .pp-feature-item, .pp-highlight-strip, .customers .p-4,' +
            ' section .row > [class*="col-"] > .d-flex.p-4, section .row > [class*="col-"] > .p-4';
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function register(scope) {
    var nodes = (scope || doc).querySelectorAll(SEL);
    for (var n = 0; n < nodes.length; n++) {
      var el = nodes[n];
      if (el.__rose || el.closest('.carousel')) continue;
      el.__rose = true;
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--stagger', Math.min(idx, 6) * 90 + 'ms');
      el.classList.add('rose-reveal');
      if (io) io.observe(el); else el.classList.add('is-visible');
    }
  }
  register();

  // Le catalogue est rendu en JS : on anime aussi les cartes ajoutées après coup
  if ('MutationObserver' in window) {
    var queued = false;
    new MutationObserver(function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () { queued = false; register(); });
    }).observe(doc.body, { childList: true, subtree: true });
  }

  /* 4. Effet ondulation sur les boutons */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.pp-btn-submit, .pp-nav-cta, .btn');
    if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    var d = doc.createElement('span');
    d.className = 'rose-ripple';
    d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) +
      'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.style.overflow = 'hidden';
    b.appendChild(d);
    setTimeout(function () { d.remove(); }, 700);
  });

  /* 5. Inclinaison 3D douce des cartes produits (souris uniquement) */
  if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    doc.addEventListener('mousemove', function (e) {
      var c = e.target.closest && e.target.closest('.pp-prod-card');
      if (!c) return;
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      c.classList.add('rose-tilt');
      c.style.transform = 'perspective(800px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' +
        (x * 8).toFixed(2) + 'deg) translateY(-8px)';
    }, { passive: true });
    doc.addEventListener('mouseout', function (e) {
      var c = e.target.closest && e.target.closest('.pp-prod-card');
      if (c && !c.contains(e.relatedTarget)) c.style.transform = '';
    });
  }
})();
