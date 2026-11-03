/* ---- HUD, overlays (menu / power pick / game over), settings panel and themes ---- */
const THEMES = [
  { name: "Ember",     c: { bg: "#120d0b", bar: "#1d1512", field: "#241a16", panel: "#1a1311", box: "#2a1f1a", text: "#f3e6d8", sub: "#8b7466", typed: "#f3e6d8", err: "#ff4d4d", caret: "#ff9a3c", accent: "#ff7a1a" } },
  { name: "Midnight",  c: { bg: "#08121c", bar: "#0d1b28", field: "#10202f", panel: "#0c1824", box: "#132838", text: "#d6e4f0", sub: "#3f6178", typed: "#cfe6f5", err: "#ff5b6b", caret: "#3ad0b0", accent: "#3ad0b0" } },
  { name: "Grove",     c: { bg: "#0e140d", bar: "#162014", field: "#1b2a18", panel: "#141d12", box: "#22321e", text: "#e3f0d6", sub: "#6f8a5f", typed: "#e3f0d6", err: "#ff6b5b", caret: "#a8e05f", accent: "#a8e05f" } },
  { name: "Tide",      c: { bg: "#0a1618", bar: "#0f2226", field: "#12303a", panel: "#0e1f24", box: "#173a44", text: "#dff5f7", sub: "#5b8d96", typed: "#dff5f7", err: "#ff6f7d", caret: "#5fd3e8", accent: "#5fd3e8" } },
  { name: "Dusk",      c: { bg: "#140e1c", bar: "#1e1529", field: "#251a33", panel: "#1a1324", box: "#2c2040", text: "#ece0fa", sub: "#7d6a96", typed: "#ece0fa", err: "#ff5d8f", caret: "#c77dff", accent: "#c77dff" } },
  { name: "Ash",       c: { bg: "#111111", bar: "#1b1b1b", field: "#222222", panel: "#181818", box: "#2a2a2a", text: "#e6e6e6", sub: "#6e6e6e", typed: "#e6e6e6", err: "#ff5555", caret: "#bbbbbb", accent: "#d0d0d0" } },
  { name: "Parchment", c: { bg: "#e9dfc8", bar: "#ddd0b3", field: "#cdbd98", panel: "#e2d6bb", box: "#f3ead6", text: "#3b2f22", sub: "#a08e73", typed: "#3b2f22", err: "#c0392b", caret: "#b5651d", accent: "#b5651d", fix: "#a87400" } },
  { name: "Sakura",    c: { bg: "#f6e6ea", bar: "#efd5dc", field: "#e8c4ce", panel: "#f2dde3", box: "#fdf2f5", text: "#4a2c36", sub: "#b88c99", typed: "#4a2c36", err: "#d6336c", caret: "#e05c8a", accent: "#e05c8a", fix: "#a87400" } },
  { name: "Frost",     c: { bg: "#e4eef5", bar: "#d3e2ec", field: "#c1d6e4", panel: "#dce8f0", box: "#f2f8fc", text: "#1f3446", sub: "#7f9bb0", typed: "#1f3446", err: "#d64545", caret: "#2f7fd6", accent: "#2f7fd6", fix: "#a87400" } },
  { name: "Sunset",    c: { bg: "#1a0f14", bar: "#26151d", field: "#331b24", panel: "#21131a", box: "#3a2029", text: "#ffe8d6", sub: "#a37a6e", typed: "#ffe8d6", err: "#ff4f6d", caret: "#ffb347", accent: "#ff8c5a" } },
];
let THEME = THEMES[0].c;
const Prefs = { countdown: true };   // 3-second "get ready" before play resumes

/* simple bar chart, one bar per wave. axis(v) labels the axis, tip(v) is the hover text */
function barChart(vals, axis, tip) {
  const W = 360, H = 170, L = 36, R = 8, T = 12, B = 24, n = Math.max(1, vals.length);
  const top = Math.max(1, ...vals), p = Math.pow(10, Math.floor(Math.log10(top)));
  const max = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((k) => k * p).find((m) => m >= top);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const band = (W - L - R) / n, bw = Math.min(28, band * 0.62), every = Math.ceil(n / 12);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  for (const g of [0, max / 2, max]) {
    s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}"/>`;
    s += `<text class="ax" x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${axis(g)}</text>`;
  }
  vals.forEach((v, i) => {
    const x = L + band * i + (band - bw) / 2, t = y(v), h = y(0) - t, r = Math.min(4, h, bw / 2);
    if (h > 0.5) s += `<path class="bar" d="M${x},${y(0)} V${t + r} Q${x},${t} ${x + r},${t} H${x + bw - r} Q${x + bw},${t} ${x + bw},${t + r} V${y(0)} Z"/>`;
    if (i % every === 0 || i === n - 1) s += `<text class="ax" x="${x + bw / 2}" y="${H - 7}" text-anchor="middle">${i + 1}</text>`;
    s += `<rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${H - T - B}" data-tip="Wave ${i + 1}: ${tip(v)}"/>`;
  });
  return s + `<text class="ax" x="${W - R}" y="${H - 7}" text-anchor="end" opacity=".7">wave</text></svg>`;
}

function applyTheme(name) {
  const t = THEMES.find((x) => x.name === name) || THEMES[0];
  THEME = t.c;
  // letters you got wrong and then fixed turn yellow (darker gold on light themes)
  for (const [k, v] of Object.entries({ fix: "#f5d327", ...t.c })) document.documentElement.style.setProperty("--" + k, v);
  bgCache = null;
  UI.theme = t.name;
  try { localStorage.setItem("ts_theme", t.name); } catch (e) {}
}

const UI = {
  theme: "Ember", pickOpts: [], last: {},

  /* only touch the DOM when a value changes */
  set(id, prop, val) {
    const key = id + prop;
    if (this.last[key] === val) return;
    this.last[key] = val;
    const el = $(id);
    if (prop === "text") el.textContent = val; else el.style[prop] = val;
  },

  hud() {
    if (!G) return;
    this.set("score", "text", "Score " + G.score);
    this.set("wave", "text", "Wave " + Math.max(1, G.wave));
    const span = Math.min(10, Math.max(3, G.time));
    const typed = G.keyTimes.filter((t) => t > G.time - span).length;
    this.set("wpm", "text", Math.round(typed / 5 / (span / 60)) + " wpm");

    const pct = Math.max(0, G.hp) / G.maxHp;
    this.set("hpfill", "width", pct * 100 + "%");
    this.set("hpfill", "background", pct > 0.5 ? "#32e05a" : pct > 0.2 ? "#f5d327" : "#d1203a");
    this.set("hptext", "text", `${Math.max(0, G.hp)} / ${G.maxHp}`);
    const g = [];
    if (G.shields) g.push(`Shield ×${G.shields}`);
    if (G.typoGuards) g.push(`Typo guard ×${G.typoGuards}`);
    if (G.zone) g.push(`${G.zone.hell ? "Hellfire" : "Fire zone"} ${Math.ceil(G.zone.t)}s`);
    this.set("guards", "text", g.join(" · "));

    // progress inside the current level: starts at 0 on each level-up. At Lv 10 it fills toward MAX and pulses there
    const L = G.level, start = FOCUS_START[L - 1], hi = (FOCUS_START[L] ?? FOCUS_CAP) - start;
    const f = Math.floor(G.focus - start), maxed = G.focus >= FOCUS_CAP - 0.5;
    const p = Math.max(0, Math.min(1, (G.focus - start) / hi));
    this.set("focusfill", "transform", `scaleX(${p.toFixed(4)})`);
    this.set("focusfill", "background", L >= 10 ? "#ffd23f" : L >= 7 ? "#ff7a1a" : L >= 4 ? "#9a5cff" : "#3a6cff");
    this.set("focuslabel", "text", `Focus Lv ${L}  ·  ×${mult()} damage  ·  ${maxed ? "MAX" : f + " / " + hi}`);
    if (this.last.maxed !== maxed) { this.last.maxed = maxed; $("focusbar").classList.toggle("max", maxed); }

    const combo = G.combo >= 2 ? `${G.combo} combo!!!` : "";
    if (this.last.combo !== combo) { $("combo").classList.remove("pop"); void $("combo").offsetWidth; if (combo) $("combo").classList.add("pop"); }
    this.set("combo", "text", combo);
  },

  banner(text) {
    const b = $("banner");
    b.classList.remove("count");
    b.textContent = text; b.classList.add("on");
    clearTimeout(this.bt);
    this.bt = setTimeout(() => b.classList.remove("on"), 1400);
  },

  shakeWords() { const w = $("words"); w.classList.remove("shake"); void w.offsetWidth; w.classList.add("shake"); },
  hurt() { const h = $("health"); h.classList.remove("hurt"); void h.offsetWidth; h.classList.add("hurt"); },

  overlay(html) { const o = $("overlay"); o.innerHTML = `<div class="panelbox">${html}</div>`; o.classList.remove("hidden"); },
  hideOverlay() { $("overlay").classList.add("hidden"); },

  showMenu() {
    const w = WIZARDS.fire;
    this.overlay(`
      <h1>Type Spell</h1>
      <p class="sub">Type to cast. Keep your focus. Don't let them reach you.</p>
      <div class="wizcard"><img src="${w.sprite}" alt=""><div><b>${w.name}</b>
        <span>${w.normal.name}: ${w.normal.text}</span>
        <span>${w.skill.name} (Focus Lv ${w.skill.level}+): ${w.skill.text}</span>
        <span>${w.ult.name} (Focus Lv ${w.ult.level}+): ${w.ult.text}</span></div></div>
      <ul class="howto">
        <li>Type the words in the book at the bottom. Every correct letter gives 1 focus.</li>
        <li>Higher focus makes every attack stronger, up to ×40. Focus drains slowly, and every typo costs ${CFG.typoFocusLoss} focus.</li>
        <li>After each wave, pick a power. Press <b>Esc</b> any time to pause.</li>
      </ul>
      <button class="go" data-act="start">Start  (Enter)</button>
      ${best ? `<span class="sub">Best score: ${best}</span>` : ""}`);
  },

  showPick(opts, first) {
    this.pickOpts = opts;
    this.overlay(`
      <h2>${first ? "Choose your first power" : `Wave ${G.wave} cleared! Choose a power`}</h2>
      <p class="sub">${first ? "Pick one common power to start with." : "Picking a power you already own levels it up."} Click a card or press 1, 2 or 3.</p>
      <div class="cards">${opts.map((p, i) => {
        const lv = (G.powers[p.id] || 0) + 1;
        return `<button class="card ${p.rarity}" data-power="${p.id}">
          <span class="key">${i + 1}</span>
          <span><span class="tag ${p.rarity}">${p.rarity}</span></span>
          <b>${p.name}</b>
          <span class="lv">${lv === 1 ? "New" : `Lv ${lv - 1} → ${lv}`}</span>
          <p>${p.text(lv)}</p></button>`;
      }).join("")}</div>`);
  },

  showOver() {
    const s = runSummary();
    const wpm = G.stats.map((w) => wpmOf(w.chars, w.time));
    const typos = G.stats.map((w) => typoPct(w.chars, w.typos));
    const tile = (label, value) => `<div class="tile"><span>${label}</span><b>${value}</b></div>`;
    this.overlay(`
      <h2>The wizard has fallen</h2>
      <div class="tiles">
        ${tile("Wave", G.wave)}${tile("Score", G.score)}${tile("Best", best)}
        ${tile("WPM", Math.round(s.wpm))}${tile("Typos", s.typo.toFixed(1) + "%")}${tile("Kills", s.kills)}
      </div>
      <div class="charts">
        <figure><figcaption>Speed per wave (WPM)</figcaption>${barChart(wpm, (v) => Math.round(v), (v) => Math.round(v) + " WPM")}</figure>
        <figure><figcaption>Typos per wave (%)</figcaption>${barChart(typos, (v) => Math.round(v) + "%", (v) => v.toFixed(1) + "% typos")}</figure>
      </div>
      <div id="tip" class="hidden"></div>
      <button class="go" data-act="start">Try again  (Enter)</button>
      <button class="go" data-act="menu">Main menu</button>`);
  },

  /* "get ready" countdown shown over the battlefield */
  showCount(n, label) {
    const b = $("banner"), html = `${label ? `<div class="cdlabel">${label}</div>` : ""}${n}`;
    clearTimeout(this.bt);
    if (b.innerHTML !== html) b.innerHTML = html;
    b.classList.add("on", "count");
  },
  endCount() { $("banner").classList.remove("on", "count"); },

  /* settings pause the game and grow out of the words panel into the middle of the screen */
  openSettings() {
    if (!G || (G.mode !== "play" && G.mode !== "countdown")) return;
    G.mode = "settings";
    this.endCount();
    this.renderSettings();
    const s = $("settings"), dim = $("dim");
    clearTimeout(this.st);
    s.style.transition = "none";
    Object.assign(s.style, this.wordsRect());
    s.classList.remove("hidden", "open");
    dim.classList.remove("hidden");
    void s.offsetWidth;
    s.style.transition = "";
    Object.assign(s.style, this.centerRect());
    s.classList.add("open");
    dim.classList.add("on");
    $("words").classList.add("away");
  },
  closeSettings() {
    if (!G || G.mode !== "settings") return;
    G.mode = "closing";
    const s = $("settings");
    s.classList.remove("open");
    Object.assign(s.style, this.wordsRect());
    $("dim").classList.remove("on");
    this.st = setTimeout(() => { this.hideSettings(); beginPlay(); }, 330);
  },
  hideSettings() {
    clearTimeout(this.st);
    $("settings").classList.add("hidden");
    $("settings").classList.remove("open");
    $("dim").classList.add("hidden");
    $("dim").classList.remove("on");
    $("words").classList.remove("away");
  },
  settingsOpen() { return !$("settings").classList.contains("hidden"); },
  rect(r) { return { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }; },
  wordsRect() {
    const a = $("app").getBoundingClientRect(), r = $("words").getBoundingClientRect();
    return this.rect({ left: r.left - a.left, top: r.top - a.top, width: r.width, height: r.height });
  },
  centerRect() {
    const a = $("app").getBoundingClientRect(), w = Math.min(a.width - 32, 980), h = Math.min(a.height - 32, 640);
    return this.rect({ left: (a.width - w) / 2, top: (a.height - h) / 2, width: w, height: h });
  },

  renderSettings() {
    $("optMusic").textContent = "Music: " + (Sound.musicOn ? "on" : "off");
    $("optSfx").textContent = "Sound effects: " + (Sound.sfxOn ? "on" : "off");
    $("optCountdown").textContent = "Ready countdown: " + (Prefs.countdown ? "on (3s)" : "off");
    $("optTheme").textContent = "Theme: " + this.theme;
    if (!G) return;
    const w = G.wiz, c = G.count;
    const ab = (a, prog) => `<div class="item"><b>${a.name}</b><span class="meta">Focus Lv ${a.level}+ · ${prog}</span><p>${a.text}</p></div>`;
    $("abilityList").innerHTML =
      ab(w.normal, `${c.letters} / ${w.normal.every} letters`) +
      ab(w.skill, `${c.skill} / ${w.skill.every} words`) +
      ab(w.ult, `${c.ult} / ${w.ult.every} words`);
    const owned = Object.entries(G.powers);
    $("powerList").innerHTML = owned.length ? owned.map(([id, lv]) => {
      const p = POWER_BY_ID[id], st = p.status ? " · " + p.status(lv, G.ps[id] || {}) : "";
      return `<div class="item"><span class="tag ${p.rarity}">${p.rarity}</span> <b>${p.name}</b><span class="meta">Lv ${lv}${st}</span><p>${p.text(lv)}</p></div>`;
    }).join("") : `<p class="empty">No powers yet.</p>`;
  },

  openThemes() {
    $("themeModal").classList.remove("hidden");
    $("themeSearch").value = "";
    this.renderThemes();
    $("themeSearch").focus();
  },
  closeThemes() { $("themeModal").classList.add("hidden"); },
  themesOpen() { return !$("themeModal").classList.contains("hidden"); },
  renderThemes() {
    const q = $("themeSearch").value.trim().toLowerCase();
    $("themeList").innerHTML = THEMES.filter((t) => t.name.toLowerCase().includes(q)).map((t) =>
      `<button class="theme ${t.name === this.theme ? "on" : ""}" data-theme="${t.name}" style="background:${t.c.box};color:${t.c.text}">
        <span>${t.name}</span><span class="dots"><i style="background:${t.c.field}"></i><i style="background:${t.c.accent}"></i><i style="background:${t.c.sub}"></i></span></button>`
    ).join("") || `<p class="empty">No theme found.</p>`;
  },
};
