/* ---- start-up, input and the game loop ---- */
Words.el = $("words");

try {
  applyTheme(localStorage.getItem("ts_theme") || "Ember");
  if (localStorage.getItem("ts_music") === "off") Sound.musicOn = false;
  if (localStorage.getItem("ts_sfx") === "off") Sound.sfxOn = false;
  if (localStorage.getItem("ts_countdown") === "off") Prefs.countdown = false;
} catch (e) { applyTheme("Ember"); }

function save(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

function goMenu() {
  if (G) G.mode = "menu";
  UI.hideSettings(); UI.endCount();
  UI.showMenu();
}

function startGame() {
  UI.hideSettings(); UI.endCount();
  newGame("fire");
}

document.addEventListener("keydown", (e) => {
  Sound.init();
  if (UI.themesOpen()) {
    if (e.key === "Escape") { UI.closeThemes(); e.preventDefault(); }
    return;
  }
  const mode = G ? G.mode : "menu";
  if (mode === "menu" || mode === "over") {
    if (e.key === "Enter") { e.preventDefault(); startGame(); }
    return;
  }
  if (mode === "pick") {
    const p = UI.pickOpts[+e.key - 1];
    if (p) choosePower(p.id);
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    if (mode === "play" || mode === "countdown") UI.openSettings(); else UI.closeSettings();
    return;
  }
  if (mode !== "play" || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  e.preventDefault();
  $("words").classList.add("typing");
  clearTimeout(UI.typingT);
  UI.typingT = setTimeout(() => $("words").classList.remove("typing"), 600);
  typeChar(e.key.toLowerCase());
});

document.addEventListener("click", (e) => {
  Sound.init();
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.act === "start") startGame();
  else if (b.dataset.act === "menu") goMenu();
  else if (b.dataset.power) choosePower(b.dataset.power);
  else if (b.dataset.theme) { applyTheme(b.dataset.theme); UI.renderThemes(); UI.renderSettings(); }
  b.blur();
});

$("gear").onclick = () => { if (G && G.mode === "settings") UI.closeSettings(); else UI.openSettings(); };
$("optBack").onclick = () => UI.closeSettings();
$("optMenu").onclick = () => goMenu();
$("optTheme").onclick = () => UI.openThemes();
$("optMusic").onclick = () => { Sound.setMusic(!Sound.musicOn); save("ts_music", Sound.musicOn ? "on" : "off"); UI.renderSettings(); };
$("optSfx").onclick = () => { Sound.setSfx(!Sound.sfxOn); save("ts_sfx", Sound.sfxOn ? "on" : "off"); UI.renderSettings(); };
$("optCountdown").onclick = () => { Prefs.countdown = !Prefs.countdown; save("ts_countdown", Prefs.countdown ? "on" : "off"); UI.renderSettings(); };
$("themeClose").onclick = () => UI.closeThemes();
$("themeModal").onclick = (e) => { if (e.target.id === "themeModal") UI.closeThemes(); };
$("themeSearch").oninput = () => UI.renderThemes();

// hover text on the results charts
$("overlay").addEventListener("mousemove", (e) => {
  const tip = $("tip"); if (!tip) return;
  const hit = e.target.closest(".hit");
  if (!hit) { tip.classList.add("hidden"); return; }
  tip.textContent = hit.dataset.tip;
  tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY - 30 + "px";
  tip.classList.remove("hidden");
});

// pause when the window loses focus
window.addEventListener("blur", () => { if (G && G.mode === "play") UI.openSettings(); });
window.addEventListener("resize", () => {
  resize();
  if (UI.settingsOpen() && G && G.mode === "settings") Object.assign($("settings").style, UI.centerRect());
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (G && G.mode === "play") update(dt);
  else if (G && G.mode === "countdown") updateCountdown(dt);
  Music.paused = !!G && (G.mode === "settings" || G.mode === "closing");
  Music.intensity = G && G.mode === "play" ? (G.level >= G.wiz.ult.level || G.zone ? 2 : 1) : 0;
  draw();
  UI.hud();
  requestAnimationFrame(loop);
}

resize();
Words.reset();
UI.showMenu();
UI.renderSettings();
requestAnimationFrame(loop);
