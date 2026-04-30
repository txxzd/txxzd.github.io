/* =============================================================
   STATE
============================================================= */
const VIEWS = ["home", "work", "projects"];
const FILES = {
  home:     "~/about.md",
  work:     "~/work.log",
  projects: "~/projects/",
};
const STATUS_MODES = {
  home:     ["HOME",     "var(--cyan)"],
  work:     ["WORK",     "var(--mauve)"],
  projects: ["PROJECTS", "var(--green)"],
};

let currentView = "home";

/* =============================================================
   TYPEWRITER (hero prompt)
============================================================= */
const promptCmds = [
  "cat about.md",
  "neofetch",
  "ls ~/projects",
  "git log --oneline experience/",
  "whoami",
];
const promptEl = document.getElementById("prompt-cmd");

function startTypewriter() {
  if (!promptEl) return;
  let cmdIdx = 0;
  let charIdx = 0;
  let deleting = false;

  const step = () => {
    const cmd = promptCmds[cmdIdx];
    if (!deleting) {
      charIdx++;
      promptEl.textContent = " " + cmd.slice(0, charIdx);
      if (charIdx >= cmd.length) {
        deleting = true;
        return setTimeout(step, 1800);
      }
      return setTimeout(step, 60 + Math.random() * 40);
    } else {
      charIdx--;
      promptEl.textContent = " " + cmd.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        cmdIdx = (cmdIdx + 1) % promptCmds.length;
        return setTimeout(step, 400);
      }
      return setTimeout(step, 30);
    }
  };
  step();
}

/* =============================================================
   SCROLL-BASED NAVIGATION
============================================================= */
const tabs = document.querySelectorAll(".tab");
const tabsContainer = document.querySelector(".tmux__tabs");
const statusFile = document.getElementById("status-file");
const statusMode = document.getElementById("status-mode");
const mainEl = document.querySelector(".main");

function syncUI(name) {
  tabs.forEach((t) => t.classList.toggle("tab--active", t.dataset.view === name));
  if (statusFile) statusFile.textContent = FILES[name];
  if (statusMode) {
    const [text, color] = STATUS_MODES[name];
    statusMode.textContent = text;
    statusMode.style.background = color;
  }
  const active = document.querySelector(`.tab[data-view="${name}"]`);
  if (active && tabsContainer) {
    tabsContainer.style.setProperty("--underline-x", active.offsetLeft + "px");
    tabsContainer.style.setProperty("--underline-w", active.offsetWidth + "px");
  }
}

function setActiveSection(name) {
  if (!VIEWS.includes(name) || name === currentView) return;
  currentView = name;
  syncUI(name);
  history.replaceState(null, "", `#${name}`);
}

let progScrolling = false;
let progScrollTimer = null;

function scrollToSection(name) {
  const el = document.getElementById(name);
  if (!el) return;
  progScrolling = true;
  el.scrollIntoView({ behavior: "smooth" });
}

tabs.forEach((t) => {
  t.addEventListener("click", (e) => {
    e.preventDefault();
    const name = t.dataset.view;
    scrollToSection(name);
    setActiveSection(name);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.metaKey || e.ctrlKey) return;
  if (e.key === "1") { scrollToSection("home");     setActiveSection("home"); }
  else if (e.key === "2") { scrollToSection("work");     setActiveSection("work"); }
  else if (e.key === "3") { scrollToSection("projects"); setActiveSection("projects"); }
  else if (e.key === "ArrowRight") {
    const next = VIEWS[(VIEWS.indexOf(currentView) + 1) % VIEWS.length];
    scrollToSection(next); setActiveSection(next);
  } else if (e.key === "ArrowLeft") {
    const prev = VIEWS[(VIEWS.indexOf(currentView) - 1 + VIEWS.length) % VIEWS.length];
    scrollToSection(prev); setActiveSection(prev);
  }
});

// Scroll-spy: suppressed during programmatic scrolls to prevent flickering
if (mainEl) {
  const sectionEls = Object.fromEntries(VIEWS.map(v => [v, document.getElementById(v)]));

  function updateScrollSpy() {
    const scrollTop = mainEl.scrollTop;
    if (scrollTop + mainEl.clientHeight >= mainEl.scrollHeight - 10) {
      setActiveSection(VIEWS[VIEWS.length - 1]);
      return;
    }
    const threshold = mainEl.clientHeight * 0.4;
    let active = VIEWS[0];
    for (const name of VIEWS) {
      const el = sectionEls[name];
      if (el && el.offsetTop <= scrollTop + threshold) active = name;
    }
    setActiveSection(active);
  }

  mainEl.addEventListener("scroll", () => {
    clearTimeout(progScrollTimer);
    if (progScrolling) {
      // wait for scroll to settle, then sync once
      progScrollTimer = setTimeout(() => {
        progScrolling = false;
        updateScrollSpy();
      }, 150);
      return;
    }
    updateScrollSpy();
  }, { passive: true });
}

// Initial state
const initial = (location.hash || "").replace("#", "");
if (VIEWS.includes(initial)) {
  setTimeout(() => scrollToSection(initial), 50);
  currentView = initial;
}
function syncUIQuiet(name) {
  if (!tabsContainer) return syncUI(name);
  tabsContainer.classList.add("no-anim");
  syncUI(name);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => tabsContainer.classList.remove("no-anim"))
  );
}
syncUIQuiet(currentView);
window.addEventListener("resize", () => syncUIQuiet(currentView));
startTypewriter();

/* =============================================================
   ENTRY REVEAL — fade-up each exp__entry and proj as it
   scrolls into view, with a per-item stagger delay.
============================================================= */
(function initReveal() {
  const items = document.querySelectorAll(".exp__entry, .proj");
  items.forEach((el) => {
    const sel = el.classList.contains("exp__entry") ? ".exp__entry" : ".proj";
    const siblings = el.parentElement.querySelectorAll(sel);
    el.style.setProperty("--i", Array.prototype.indexOf.call(siblings, el));
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { root: mainEl, rootMargin: "0px 0px -60px 0px", threshold: 0.08 });

  items.forEach((el) => observer.observe(el));
})();


/* =============================================================
   COMMAND PALETTE
============================================================= */
const palette = document.getElementById("palette");
const paletteInput = document.getElementById("palette-input");
const paletteList = document.getElementById("palette-list");
const paletteOpen = document.getElementById("palette-open");

const PALETTE_ITEMS = [
  { id: "go-home",     icon: "~", name: "go to home",         hint: "1",   action: () => { scrollToSection("home");     setActiveSection("home"); } },
  { id: "go-work",     icon: "~", name: "go to work log",     hint: "2",   action: () => { scrollToSection("work");     setActiveSection("work"); } },
  { id: "go-projects", icon: "~", name: "go to projects",     hint: "3",   action: () => { scrollToSection("projects"); setActiveSection("projects"); } },
  { id: "email",       icon: "✉", name: "send email",          hint: "↗", action: () => location.href = "mailto:delayatimothy@gmail.com" },
  { id: "github",      icon: ICONS.github,                                                                   name: "open github",         hint: "↗", action: () => window.open("https://github.com/txxzd", "_blank") },
  { id: "linkedin",    icon: "in", name: "open linkedin",      hint: "↗", action: () => window.open("https://linkedin.com/in/timothydelaya", "_blank") },
  { id: "source",      icon: "</>", name: "view portfolio source", hint: "↗", action: () => window.open("https://github.com/txxzd/txxzd.github.io", "_blank") },
  { id: "toggle-theme", icon: "◐", name: () => document.documentElement.dataset.theme === "cream" ? "switch to dark mode" : "switch to light mode", hint: "theme", action: toggleTheme },
];

let paletteActive = 0;
let paletteItems = [];

function renderPalette(filter = "") {
  const q = filter.toLowerCase().trim();
  paletteItems = PALETTE_ITEMS
    .map(it => ({ ...it, name: typeof it.name === "function" ? it.name() : it.name }))
    .filter((it) => !q || it.name.toLowerCase().includes(q));
  paletteList.innerHTML = paletteItems
    .map((it, i) => `
      <li class="palette__item ${i === paletteActive ? "is-active" : ""}" data-id="${it.id}">
        <span class="c-cyan">${it.icon}</span>
        <span class="palette__item-name">${it.name}</span>
        <span class="palette__item-hint">${it.hint}</span>
      </li>`)
    .join("");
  let prevActiveEl = null;
  paletteList.querySelectorAll(".palette__item").forEach((el, i) => {
    if (i === paletteActive) prevActiveEl = el;
    el.addEventListener("click", () => runPaletteItem(paletteItems[i]));
    el.addEventListener("mouseenter", () => {
      prevActiveEl?.classList.remove("is-active");
      prevActiveEl = el;
      paletteActive = i;
      el.classList.add("is-active");
    });
  });
}

function updatePaletteActive() {
  paletteList.querySelectorAll(".palette__item").forEach((el, i) => {
    el.classList.toggle("is-active", i === paletteActive);
  });
}

function runPaletteItem(it) {
  if (!it) return;
  closePalette();
  it.action();
}

function openPalette() {
  palette.classList.add("is-open");
  paletteActive = 0;
  renderPalette("");
  paletteInput.value = "";
  setTimeout(() => paletteInput.focus(), 30);
}
function closePalette() {
  palette.classList.remove("is-open");
}

paletteOpen.addEventListener("click", openPalette);

document.addEventListener("keydown", (e) => {
  const isMod = e.metaKey || e.ctrlKey;
  if (isMod && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (palette.classList.contains("is-open")) closePalette();
    else openPalette();
  } else if (e.key === "Escape" && palette.classList.contains("is-open")) {
    closePalette();
  }
});

paletteInput.addEventListener("input", () => {
  paletteActive = 0;
  renderPalette(paletteInput.value);
});

paletteInput.addEventListener("keydown", (e) => {
  if (!paletteItems.length) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    paletteActive = (paletteActive + 1) % paletteItems.length;
    updatePaletteActive();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    paletteActive = (paletteActive - 1 + paletteItems.length) % paletteItems.length;
    updatePaletteActive();
  } else if (e.key === "Enter") {
    e.preventDefault();
    runPaletteItem(paletteItems[paletteActive]);
  }
});

palette.addEventListener("click", (e) => {
  if (e.target === palette) closePalette();
});

/* =============================================================
   STATUS BAR CLOCK
============================================================= */
const timeEl = document.getElementById("status-time");
function tickClock() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  if (timeEl) timeEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
tickClock();
setInterval(tickClock, 1000);



(function heroNameInit() {
  const root = document.getElementById("hero-name");
  if (!root) return;
  const lastRow = root.querySelector('[data-row="last"]') || root.querySelector(".hero__row--last");
  if (lastRow && !lastRow.querySelector(".hero__caret-end")) {
    const caret = document.createElement("span");
    caret.className = "hero__caret-end";
    lastRow.appendChild(caret);
  }
  document.body.classList.add("boot-done");
})();

/* =============================================================
   TMUX SESSION TYPEWRITER — one-shot, ~400ms.
============================================================= */
(function tmuxSessionTypewriter() {
  const name = document.querySelector(".tmux__name");
  const sep  = document.querySelector(".tmux__sep");
  const host = document.querySelector(".tmux__host");
  if (!name || !sep || !host) return;
  sep.textContent = "·";
  const parts = [[name, "timothyzd"], [host, "portfolio"]];
  parts.forEach(([el]) => (el.textContent = ""));
  let p = 0;
  const typeNext = () => {
    if (p >= parts.length) return;
    const [el, text] = parts[p++];
    const caret = document.createElement("span");
    caret.className = "tmux__type-caret";
    caret.textContent = "▋";
    el.appendChild(caret);
    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        caret.remove();
        return typeNext();
      }
      caret.insertAdjacentText("beforebegin", text[i++]);
      setTimeout(tick, 21);
    };
    tick();
  };
  typeNext();
})();

/* =============================================================
   MAGNETIC HOVER — subtle pull toward cursor on key elements.
============================================================= */
(function magneticHover() {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch   = matchMedia("(hover: none)").matches;
  if (reduced || touch) return;
  const els = document.querySelectorAll(".hero__link, .proj, .exp__entry");
  els.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
      const my = ((e.clientY - r.top)  / r.height - 0.5) * 2;
      el.style.setProperty("--mx", (mx * 3) + "px");
      el.style.setProperty("--my", (my * 3) + "px");
    });
    el.addEventListener("mouseleave", () => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  });
})();

window.addEventListener("pageshow", (e) => { if (e.persisted) syncUI(currentView); });

/* =============================================================
   THEME
============================================================= */
(function() {
  const saved = localStorage.getItem("tzd-theme") || "default";
  if (saved !== "default") document.documentElement.setAttribute("data-theme", saved);
})();

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "cream" ? "default" : "cream";
  if (next === "default") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("tzd-theme", next);
  closePalette();
}
