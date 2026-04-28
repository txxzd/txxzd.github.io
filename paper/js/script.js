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
  if (viewOrder.includes(initHash)) switchView(initHash);

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
     COMMAND PALETTE
  ============================================================= */
  const palette = document.getElementById('palette');
  const paletteInput = document.getElementById('palette-input');
  const paletteList = document.getElementById('palette-list');
  const paletteOpenBtn = document.getElementById('palette-open');

  const PALETTE_ITEMS = [
    { id: 'go-home',     icon: '~',   name: 'go to home',          hint: '1',     action: () => switchView('home') },
    { id: 'go-work',     icon: '~',   name: 'go to work log',      hint: '2',     action: () => switchView('work') },
    { id: 'go-projects', icon: '~',   name: 'go to projects',      hint: '3',     action: () => switchView('projects') },
    { id: 'email',       icon: '✉',   name: 'send email',          hint: '↗',    action: () => { location.href = 'mailto:delayatimothy@gmail.com'; } },
    { id: 'github',      icon: ICONS.github,                                                                       name: 'open github',         hint: '↗',    action: () => window.open('https://github.com/txxzd', '_blank') },
    { id: 'linkedin',    icon: 'in',  name: 'open linkedin',       hint: '↗',    action: () => window.open('https://linkedin.com/in/timothydelaya', '_blank') },
    { id: 'source',      icon: '</>', name: 'view portfolio source', hint: '↗',  action: () => window.open('https://github.com/txxzd/txxzd.github.io', '_blank') },
    { id: 'theme-main',  icon: '◆',   name: 'switch theme: terminal (default)', hint: 'theme', action: () => { location.href = '../'; } },
  ];

  let paletteActive = 0;
  let paletteItems = [];

  function renderPalette(filter) {
    if (!paletteList) return;
    const q = (filter || '').toLowerCase().trim();
    paletteItems = PALETTE_ITEMS.filter(it => !q || it.name.toLowerCase().includes(q));
    paletteList.innerHTML = paletteItems.map((it, i) => (
      '<li class="palette__item ' + (i === paletteActive ? 'is-active' : '') + '" data-id="' + it.id + '">' +
        '<span class="palette__item-icon">' + it.icon + '</span>' +
        '<span class="palette__item-name">' + it.name + '</span>' +
        '<span class="palette__item-hint">' + it.hint + '</span>' +
      '</li>'
    )).join('');
    paletteList.querySelectorAll('.palette__item').forEach((el, i) => {
      el.addEventListener('click', () => runPaletteItem(paletteItems[i]));
      el.addEventListener('mouseenter', () => {
        paletteList.querySelector('.palette__item.is-active')?.classList.remove('is-active');
        paletteActive = i;
        el.classList.add('is-active');
      });
    });
  }

  function updatePaletteActive() {
    if (!paletteList) return;
    paletteList.querySelectorAll('.palette__item').forEach((el, i) => {
      el.classList.toggle('is-active', i === paletteActive);
    });
  }

  function runPaletteItem(it) {
    if (!it) return;
    closePalette();
    it.action();
  }

  function openPalette() {
    if (!palette) return;
    palette.classList.add('is-open');
    paletteActive = 0;
    renderPalette('');
    if (paletteInput) {
      paletteInput.value = '';
      setTimeout(() => paletteInput.focus(), 30);
    }
  }
  function closePalette() {
    if (!palette) return;
    palette.classList.remove('is-open');
  }

  if (paletteOpenBtn) paletteOpenBtn.addEventListener('click', openPalette);

  document.addEventListener('keydown', (e) => {
    const isMod = e.metaKey || e.ctrlKey;
    if (isMod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (palette && palette.classList.contains('is-open')) closePalette();
      else openPalette();
    } else if (e.key === 'Escape' && palette && palette.classList.contains('is-open')) {
      closePalette();
    }
  });

  if (paletteInput) {
    paletteInput.addEventListener('input', () => {
      paletteActive = 0;
      renderPalette(paletteInput.value);
    });
    paletteInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        paletteActive = (paletteActive + 1) % paletteItems.length;
        updatePaletteActive();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        paletteActive = (paletteActive - 1 + paletteItems.length) % paletteItems.length;
        updatePaletteActive();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runPaletteItem(paletteItems[paletteActive]);
      }
    });
  }

  if (palette) {
    palette.addEventListener('click', (e) => {
      if (e.target === palette) closePalette();
    });
  }

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
