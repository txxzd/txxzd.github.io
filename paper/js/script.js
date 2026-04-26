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
     COMMAND PALETTE
  ============================================================= */
  const palette = document.getElementById('palette');
  const paletteInput = document.getElementById('palette-input');
  const paletteList = document.getElementById('palette-list');
  const paletteOpenBtn = document.getElementById('palette-open');

  const PALETTE_ITEMS = [
    { id: 'go-home',     icon: '⬡',   name: 'go to home',          hint: '1',     action: () => switchView('home') },
    { id: 'go-work',     icon: '⏣',   name: 'go to work log',      hint: '2',     action: () => switchView('work') },
    { id: 'go-projects', icon: '◈',   name: 'go to projects',      hint: '3',     action: () => switchView('projects') },
    { id: 'email',       icon: '✉',   name: 'send email',          hint: '↗',    action: () => { location.href = 'mailto:delayatimothy@gmail.com'; } },
    { id: 'github',      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="display:block"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',   name: 'open github',         hint: '↗',    action: () => window.open('https://github.com/txxzd', '_blank') },
    { id: 'linkedin',    icon: 'in',  name: 'open linkedin',       hint: '↗',    action: () => window.open('https://linkedin.com/in/timothydelaya', '_blank') },
    { id: 'source',      icon: '</>', name: 'view portfolio source', hint: '↗',  action: () => window.open('https://github.com/txxzd/txxzd.github.io', '_blank') },
    { id: 'theme-main',  icon: '◆',   name: 'switch theme: terminal (default)', hint: 'theme', action: () => { location.href = '../'; } },
  ];

  let paletteActive = 0;

  function renderPalette(filter) {
    if (!paletteList) return [];
    const q = (filter || '').toLowerCase().trim();
    const items = PALETTE_ITEMS.filter(it => !q || it.name.toLowerCase().includes(q));
    paletteList.innerHTML = items.map((it, i) => (
      '<li class="palette__item ' + (i === paletteActive ? 'is-active' : '') + '" data-id="' + it.id + '">' +
        '<span class="palette__item-icon">' + it.icon + '</span>' +
        '<span class="palette__item-name">' + it.name + '</span>' +
        '<span class="palette__item-hint">' + it.hint + '</span>' +
      '</li>'
    )).join('');
    paletteList.querySelectorAll('.palette__item').forEach((el, i) => {
      el.addEventListener('click', () => runPaletteItem(items[i]));
      el.addEventListener('mouseenter', () => {
        paletteActive = i;
        paletteList.querySelectorAll('.palette__item').forEach((x, j) => x.classList.toggle('is-active', j === i));
      });
    });
    return items;
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
      const items = renderPalette(paletteInput.value);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        paletteActive = (paletteActive + 1) % items.length;
        renderPalette(paletteInput.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        paletteActive = (paletteActive - 1 + items.length) % items.length;
        renderPalette(paletteInput.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runPaletteItem(items[paletteActive]);
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
