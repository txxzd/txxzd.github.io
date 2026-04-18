(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app = document.getElementById('app');

  /* =============================================================
     BOOT SEQUENCE
  ============================================================= */
  const bootEl = document.getElementById('boot');
  const bootLog = document.getElementById('boot-log');

  const bootLines = [
    { t: '[  OK  ]', msg: 'initializing shell …', d: 120 },
    { t: '[  OK  ]', msg: 'mount /home/timothy', d: 140 },
    { t: '[  OK  ]', msg: 'loading resume.manifest', d: 180 },
    { t: '[  OK  ]', msg: '3 experiences · 2 projects · 1 publication', d: 220 },
    { t: '[ INFO ]', msg: 'tty attached · 80x24', d: 180 },
    { t: '[ DONE ]', msg: 'welcome, guest — press any key', d: 260 }
  ];

  function typeBoot(i) {
    if (i >= bootLines.length) {
      setTimeout(endBoot, 420);
      return;
    }
    const { t, msg, d } = bootLines[i];
    bootLog.textContent += `${t} ${msg}\n`;
    setTimeout(() => typeBoot(i + 1), d);
  }

  function endBoot() {
    bootEl.classList.add('boot--done');
    app.classList.add('app--ready');
    setTimeout(() => bootEl.remove(), 700);
  }

  const bootPlayed = sessionStorage.getItem('tzd_boot_played');
  if (bootPlayed || prefersReducedMotion) {
    bootEl.remove();
    app.classList.add('app--ready');
  } else {
    sessionStorage.setItem('tzd_boot_played', '1');
    const skip = (e) => {
      if (e) e.preventDefault();
      endBoot();
      window.removeEventListener('keydown', skip);
      window.removeEventListener('click', skip);
    };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('click', skip, { once: true });
    setTimeout(() => typeBoot(0), 240);
  }

  /* =============================================================
     VIEW ROUTING
  ============================================================= */
  const viewOrder = ['home', 'work', 'projects'];
  const viewFiles = {
    home: '~/about.md',
    work: '~/work.log',
    projects: '~/projects/'
  };
  const pathFiles = {
    home: '~',
    work: '~/work',
    projects: '~/projects'
  };

  let currentView = 'home';
  const navLinks = document.querySelectorAll('.nav__link');
  const statusFile = document.getElementById('statusbar-file');
  const topbarPath = document.getElementById('topbar-path');

  function switchView(v) {
    if (v === currentView || !viewOrder.includes(v)) return;
    const current = document.querySelector('.view--active');
    const next = document.getElementById('view-' + v);
    if (!next) return;

    if (current) current.classList.remove('view--active');
    next.classList.add('view--active');

    const s = next.querySelector('.stage--scroll');
    if (s) s.scrollTop = 0;

    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === v));

    if (statusFile) statusFile.textContent = viewFiles[v];
    if (topbarPath) topbarPath.textContent = pathFiles[v];

    history.replaceState(null, '', '#' + v);
    currentView = v;
  }

  navLinks.forEach(l => {
    if (!l.dataset.view) return;
    l.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(l.dataset.view);
    });
  });

  const initHash = location.hash.replace('#', '');
  if (viewOrder.includes(initHash) && initHash !== 'home') {
    document.querySelector('.view--active')?.classList.remove('view--active');
    document.getElementById('view-' + initHash)?.classList.add('view--active');
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === initHash));
    if (statusFile) statusFile.textContent = viewFiles[initHash];
    if (topbarPath) topbarPath.textContent = pathFiles[initHash];
    currentView = initHash;
  }

  /* =============================================================
     KEYBOARD NAV
  ============================================================= */
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'ArrowRight' || e.key === 'l') {
      const i = viewOrder.indexOf(currentView);
      switchView(viewOrder[(i + 1) % viewOrder.length]);
    } else if (e.key === 'ArrowLeft' || e.key === 'h') {
      const i = viewOrder.indexOf(currentView);
      switchView(viewOrder[(i - 1 + viewOrder.length) % viewOrder.length]);
    } else if (e.key === '1') switchView('home');
    else if (e.key === '2') switchView('work');
    else if (e.key === '3') switchView('projects');
  });

  /* =============================================================
     PROJECT EXPAND/COLLAPSE
  ============================================================= */
  document.querySelectorAll('.project__row').forEach(btn => {
    btn.addEventListener('click', () => {
      const project = btn.closest('.project');
      const expanded = project.dataset.expanded === 'true';
      project.dataset.expanded = expanded ? 'false' : 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
  });

  /* =============================================================
     STATUSBAR CLOCK
  ============================================================= */
  const timeEl = document.getElementById('statusbar-time');
  function tick() {
    if (!timeEl) return;
    const d = new Date();
    timeEl.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick();
  setInterval(tick, 30000);

})();
