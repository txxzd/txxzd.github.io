/* =============================================================
   STATE
============================================================= */
const VIEWS = ["home", "work", "projects"];
const FILES = {
  home: "~/about.md",
  work: "~/experience/log",
  projects: "~/projects/",
};
const STATUS_MODES = {
  home:     ["NORMAL",  "var(--cyan)"],
  work:     ["VISUAL",  "var(--mauve)"],
  projects: ["INSERT",  "var(--green)"],
};

let currentView = "home";

/* =============================================================
   NEOFETCH ASCII — paint into the logo pre on load
============================================================= */
(function paintAscii() {
  const el = document.getElementById("neo-logo");
  if (!el) return;
  const art = window.NEOFETCH_ASCII;
  el.textContent = art && art.length
    ? art
    : "   ╱╲\n  ╱  ╲\n ╱ ▲▲ ╲\n╱  ╲╱  ╲\n╲  ╱╲  ╱\n ╲ ▼▼ ╱\n  ╲  ╱\n   ╲╱";
})();

/* =============================================================
   BOOT — handled inline in index.html so it always runs,
   even if module loading fails. Here we only kick off the
   typewriter once the boot overlay has been dismissed.
============================================================= */
const bootEl = document.getElementById("boot");

function whenBootDone(cb) {
  let fired = false;
  const fire = () => { if (!fired) { fired = true; cb(); } };
  if (!bootEl) return fire();
  if (bootEl.classList.contains("is-done")) return fire();
  const obs = new MutationObserver(() => {
    if (bootEl.classList.contains("is-done")) {
      obs.disconnect();
      setTimeout(fire, 250);
    }
  });
  obs.observe(bootEl, { attributes: true, attributeFilter: ["class"] });
  // safety net in case observer never fires
  setTimeout(fire, 6000);
}

whenBootDone(() => startTypewriter());

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
   VIEW SWITCHING
============================================================= */
const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
const statusFile = document.getElementById("status-file");
const statusMode = document.getElementById("status-mode");

function setView(name) {
  if (!VIEWS.includes(name) || name === currentView) return;
  currentView = name;
  views.forEach((v) => v.classList.toggle("view--active", v.id === `view-${name}`));
  tabs.forEach((t) => t.classList.toggle("tab--active", t.dataset.view === name));
  if (statusFile) statusFile.textContent = FILES[name];
  if (statusMode) {
    const [text, color] = STATUS_MODES[name];
    statusMode.textContent = text;
    statusMode.style.background = color;
  }
  history.replaceState(null, "", `#${name}`);
}

tabs.forEach((t) => {
  t.addEventListener("click", (e) => {
    e.preventDefault();
    setView(t.dataset.view);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.metaKey || e.ctrlKey) return;
  if (e.key === "1") setView("home");
  else if (e.key === "2") setView("work");
  else if (e.key === "3") setView("projects");
  else if (e.key === "ArrowRight") {
    const i = VIEWS.indexOf(currentView);
    setView(VIEWS[(i + 1) % VIEWS.length]);
  } else if (e.key === "ArrowLeft") {
    const i = VIEWS.indexOf(currentView);
    setView(VIEWS[(i - 1 + VIEWS.length) % VIEWS.length]);
  }
});

const initial = (location.hash || "").replace("#", "");
if (VIEWS.includes(initial)) setView(initial);

/* =============================================================
   PROJECTS — collapsible
============================================================= */
document.querySelectorAll(".project__row").forEach((row) => {
  row.addEventListener("click", () => {
    const card = row.closest(".project");
    const open = card.dataset.expanded === "true";
    card.dataset.expanded = String(!open);
    row.setAttribute("aria-expanded", String(!open));
    const chev = row.querySelector(".project__chev");
    if (chev) chev.textContent = !open ? "▾" : "▸";
  });
});

/* =============================================================
   COMMAND PALETTE
============================================================= */
const palette = document.getElementById("palette");
const paletteInput = document.getElementById("palette-input");
const paletteList = document.getElementById("palette-list");
const paletteOpen = document.getElementById("palette-open");

const PALETTE_ITEMS = [
  { id: "go-home",     icon: "⬡", name: "go to home",         hint: "1",   action: () => setView("home") },
  { id: "go-work",     icon: "⏣", name: "go to work log",     hint: "2",   action: () => setView("work") },
  { id: "go-projects", icon: "◈", name: "go to projects",     hint: "3",   action: () => setView("projects") },
  { id: "email",       icon: "✉", name: "send email",          hint: "↗", action: () => location.href = "mailto:delayatimothy@gmail.com" },
  { id: "github",      icon: ICONS.github,                                                                   name: "open github",         hint: "↗", action: () => window.open("https://github.com/txxzd", "_blank") },
  { id: "linkedin",    icon: "in", name: "open linkedin",      hint: "↗", action: () => window.open("https://linkedin.com/in/timothydelaya", "_blank") },
  { id: "source",      icon: "</>", name: "view portfolio source", hint: "↗", action: () => window.open("https://github.com/txxzd/txxzd.github.io", "_blank") },
  { id: "theme-paper", icon: "◇", name: "switch theme: paper", hint: "theme", action: () => { location.href = "paper/"; } },
];

let paletteActive = 0;
let paletteItems = [];

function renderPalette(filter = "") {
  const q = filter.toLowerCase().trim();
  paletteItems = PALETTE_ITEMS.filter((it) => !q || it.name.toLowerCase().includes(q));
  paletteList.innerHTML = paletteItems
    .map((it, i) => `
      <li class="palette__item ${i === paletteActive ? "is-active" : ""}" data-id="${it.id}">
        <span class="c-cyan">${it.icon}</span>
        <span class="palette__item-name">${it.name}</span>
        <span class="palette__item-hint">${it.hint}</span>
      </li>`)
    .join("");
  paletteList.querySelectorAll(".palette__item").forEach((el, i) => {
    el.addEventListener("click", () => runPaletteItem(paletteItems[i]));
    el.addEventListener("mouseenter", () => {
      paletteList.querySelector(".palette__item.is-active")?.classList.remove("is-active");
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

/* =============================================================
   THREE.JS — wireframe icosahedron with edge glow
   (loaded as a global via <script> tag; falls back if missing)
============================================================= */
const canvas = document.getElementById("three-canvas");
const host = document.getElementById("three-host");
const fpsEl = document.getElementById("three-fps");

function renderFallback() {
  if (!host) return;
  host.innerHTML = '<pre style="margin:0;padding:24px;color:var(--fg-soft);font-size:11px;line-height:1.4">' +
    '       △        \n' +
    '      ╱ ╲       \n' +
    '     ╱   ╲      \n' +
    '    ╱  ◆  ╲     \n' +
    '   ╱       ╲    \n' +
    '  ╱_________╲   \n' +
    '  ╲    ◆    ╱   \n' +
    '   ╲       ╱    \n' +
    '    ╲     ╱     \n' +
    '     ╲   ╱      \n' +
    '      ╲ ╱       \n' +
    '       ▽        \n' +
    '</pre>';
  if (fpsEl) fpsEl.textContent = "offline";
}

(function initThree() {
  if (!canvas || !host) return;
  const THREE = window.THREE;
  if (!THREE) {
    // try again briefly in case the script is still loading
    if ((initThree.tries = (initThree.tries || 0) + 1) < 30) {
      return setTimeout(initThree, 100);
    }
    return renderFallback();
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    console.warn("WebGL init failed", e);
    return renderFallback();
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  const group = new THREE.Group();
  scene.add(group);

  // outer wireframe icosahedron
  const ico = new THREE.IcosahedronGeometry(1.6, 1);
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(ico),
    new THREE.LineBasicMaterial({ color: 0x7fdbca, transparent: true, opacity: 0.55 })
  );
  group.add(wire);

  // inner pulsing solid (low opacity)
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.0, 0),
    new THREE.MeshBasicMaterial({
      color: 0xc4a7e7,
      transparent: true,
      opacity: 0.08,
      wireframe: false,
    })
  );
  group.add(inner);

  // inner wireframe
  const innerWire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.0, 0)),
    new THREE.LineBasicMaterial({ color: 0xf5a3c7, transparent: true, opacity: 0.7 })
  );
  group.add(innerWire);

  // particles drifting around it
  const particleCount = 80;
  const particleGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 2.4 + Math.random() * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeom,
    new THREE.PointsMaterial({ color: 0xf6c177, size: 0.04, transparent: true, opacity: 0.7 })
  );
  scene.add(particles);

  // CSS forces canvas display to 100% of host (`width: 100% !important`),
  // so we ONLY need to update the drawing buffer. setSize(_, _, false)
  // skips touching inline styles, avoiding any conflict with the CSS.
  let hostRect = host.getBoundingClientRect();
  {
    const w = Math.round(hostRect.width), h = Math.round(hostRect.height);
    if (w >= 2 && h >= 2) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }
  const ro = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    const w = Math.round(width), h = Math.round(height);
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    hostRect = host.getBoundingClientRect();
  });
  ro.observe(host);

  // mouse parallax
  let mx = 0, my = 0;
  let tx = 0, ty = 0;
  host.addEventListener("mousemove", (e) => {
    tx = ((e.clientX - hostRect.left) / hostRect.width - 0.5) * 0.8;
    ty = ((e.clientY - hostRect.top) / hostRect.height - 0.5) * 0.8;
  });
  host.addEventListener("mouseleave", () => { tx = 0; ty = 0; });

  let last = performance.now();
  let frames = 0;
  let fpsLast = last;
  function animate(t) {
    requestAnimationFrame(animate);
    const dt = (t - last) / 1000;
    last = t;

    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;

    group.rotation.x += dt * 0.18 + my * 0.02;
    group.rotation.y += dt * 0.24 + mx * 0.02;
    innerWire.rotation.x -= dt * 0.4;
    innerWire.rotation.z -= dt * 0.3;

    const pulse = 1 + Math.sin(t * 0.002) * 0.04;
    inner.scale.setScalar(pulse);

    particles.rotation.y += dt * 0.05;
    particles.rotation.x += dt * 0.02;

    renderer.render(scene, camera);

    frames++;
    if (t - fpsLast >= 500) {
      const fps = Math.round((frames * 1000) / (t - fpsLast));
      if (fpsEl) fpsEl.textContent = String(fps);
      frames = 0;
      fpsLast = t;
    }
  }
  requestAnimationFrame(animate);
})();

/* =============================================================
   HERO NAME — set per-char stagger index, append the trailing
   caret, and flip body.boot-done so the CSS animation starts.
   If any of this JS fails, the safety animation in CSS still
   fires at 5s so the name never stays hidden.
============================================================= */
(function heroNameInit() {
  const root = document.getElementById("hero-name");
  if (!root) return;
  const chars = root.querySelectorAll(".hero__char, .hero__space");
  chars.forEach((el, i) => el.style.setProperty("--n", i));

  const lastRow = root.querySelector('[data-row="last"]') || root.querySelector(".hero__row--last");
  if (lastRow && !lastRow.querySelector(".hero__caret-end")) {
    const caret = document.createElement("span");
    caret.className = "hero__caret-end";
    lastRow.appendChild(caret);
  }

  // Add boot-done class to <body> as soon as boot dismisses, which triggers
  // the CSS typewriter. Uses the existing whenBootDone helper.
  whenBootDone(() => document.body.classList.add("boot-done"));
})();
