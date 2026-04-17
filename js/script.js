(function () {
  'use strict';

  // DOM references
  const navLinks = document.querySelectorAll('.nav__link');
  const views = document.querySelectorAll('.view');
  const brand = document.querySelector('.brand');
  const toggle = document.querySelector('.nav-toggle');
  const topbar = document.querySelector('.topbar');

  const viewOrder = ['home', 'experience', 'projects'];
  let currentView = 'home';
  let isTransitioning = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---- View switching ----

  function switchView(viewId) {
    if (viewId === currentView || isTransitioning) return;
    isTransitioning = true;

    // Scan-line sweep effect
    if (!prefersReducedMotion.matches) {
      const sweep = document.createElement('div');
      sweep.className = 'scanline-sweep';
      document.body.appendChild(sweep);
      sweep.addEventListener('animationend', function () {
        sweep.remove();
      });
    }

    // Deactivate current view
    const activeView = document.querySelector('.view--active');
    if (activeView) {
      activeView.classList.remove('view--active');
    }

    // Update nav active states
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.view === viewId);
    });

    // Activate new view after brief delay for cross-fade
    var delay = prefersReducedMotion.matches ? 0 : 100;
    setTimeout(function () {
      var newView = document.getElementById('view-' + viewId);
      if (newView) {
        // Reset scroll position for scrollable views
        var scrollable = newView.querySelector('.view__inner--scrollable');
        if (scrollable) {
          scrollable.scrollTop = 0;
        }
        newView.classList.add('view--active');
      }
      currentView = viewId;
      updateHash(viewId);
    }, delay);

    // Unlock transitions
    var lockDuration = prefersReducedMotion.matches ? 50 : 500;
    setTimeout(function () {
      isTransitioning = false;
    }, lockDuration);
  }

  // ---- Hash routing ----

  function updateHash(viewId) {
    history.pushState(null, '', viewId === 'home' ? '#' : '#' + viewId);
  }

  window.addEventListener('popstate', function () {
    var hash = location.hash.slice(1) || 'home';
    if (viewOrder.indexOf(hash) !== -1) {
      switchView(hash);
    }
  });

  // ---- Event listeners ----

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchView(link.dataset.view);
      // Close mobile nav if open
      topbar.classList.remove('nav-open');
    });
  });

  if (brand) {
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      switchView('home');
      topbar.classList.remove('nav-open');
    });
  }

  var cta = document.querySelector('.nav__cta');
  if (cta) {
    cta.addEventListener('click', function () {
      topbar.classList.remove('nav-open');
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      topbar.classList.toggle('nav-open');
    });
  }

  // ---- Keyboard navigation ----

  document.addEventListener('keydown', function (e) {
    // Don't capture if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      var idx = viewOrder.indexOf(currentView);
      var next = viewOrder[(idx + 1) % viewOrder.length];
      switchView(next);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      var idx = viewOrder.indexOf(currentView);
      var prev = viewOrder[(idx - 1 + viewOrder.length) % viewOrder.length];
      switchView(prev);
    }
  });

  // ---- Typing animation on initial load ----

  function runInitialTyping() {
    var h1 = document.querySelector('#view-home .hero__title');
    if (!h1) return;

    var fullText = h1.textContent;
    h1.textContent = '';
    h1.classList.add('hero__title--typing');

    var i = 0;
    var speed = 80;

    function type() {
      if (i < fullText.length) {
        h1.textContent += fullText.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        // Typing done — keep caret blinking briefly, then remove
        setTimeout(function () {
          h1.classList.remove('hero__title--typing');
          h1.classList.add('hero__title--done');
        }, 1200);
      }
    }

    setTimeout(type, 500);
  }

  if (!prefersReducedMotion.matches) {
    runInitialTyping();
  }

  // ---- Handle initial hash on page load ----

  var initialHash = location.hash.slice(1);
  if (initialHash && viewOrder.indexOf(initialHash) !== -1 && initialHash !== 'home') {
    // Switch to the hash view without animation
    var activeView = document.querySelector('.view--active');
    if (activeView) activeView.classList.remove('view--active');
    var target = document.getElementById('view-' + initialHash);
    if (target) target.classList.add('view--active');
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.dataset.view === initialHash);
    });
    currentView = initialHash;
  }

})();
