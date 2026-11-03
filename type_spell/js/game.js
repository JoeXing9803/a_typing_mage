/* ---- core game: state, typing, focus, attacks, enemies, waves ---- */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);

let G = null;                              // the current run
const F = { W: 200, H: 120, scale: 3 };    // battlefield size in art pixels
let best = 0;
try { best = +localStorage.getItem("ts_best") || 0; } catch (e) {}

function wizPos() { return { x: Math.round(F.W / 2), y: F.H - 18 }; }
function staffTip() { const p = wizPos(); return { x: p.x + 10, y: p.y - 14 }; }

function newGame(wizardId = "fire") {
  G = {
    mode: "pick", wiz: WIZARDS[wizardId], wave: 0, score: 0, combo: 0, time: 0, kills: 0,
    hp: CFG.maxHealth, maxHp: CFG.maxHealth, shields: 0, typoGuards: 0, revives: 0,
    focus: 0, level: 1,
    count: { letters: 0, skill: 0, ult: 0 },
    ready: [],                             // attacks waiting for a target
    enemies: [], shots: [], parts: [], pops: [], timers: [], zone: null,
    queue: [], spawnT: 0, clearT: 0,
    powers: {}, ps: {},
    keyTimes: [], hitT: 0, shake: 0,
    stats: [], ws: null,                   // per-wave results for the final screen; ws = current wave
  };
  Words.reset();
  offerPick(true);
}

/* ---- focus: G.focus is the running total; each level needs its own amount on top (see FOCUS_START) ---- */
function levelOf(f) {
  let l = 1;
  FOCUS_START.forEach((t, i) => { if (f >= t) l = i + 1; });
  return l;
}
function mult() { return CFG.focusMultipliers[G.level - 1]; }
function setFocus(v, quiet) {
  G.focus = Math.max(0, Math.min(FOCUS_CAP, v));
  const l = levelOf(G.focus);
  if (l > G.level && !quiet) { Sound.play("levelUp"); levelBurst(); }
  G.level = l;
}
function addFocus(n) { setFocus(G.focus + n); }

/* ---- typing ---- */
function typeChar(ch) {
  const c = Words.cur();
  if (!c) return;
  if (ch !== c.ch) {
    G.ws.typos++;
    c.err = true;
    if (c.word) c.word.errors++;
    Words.lines[0].errors++;
    typo();
    Words.render();
    return;
  }
  c.done = true;
  G.ws.chars++;
  G.keyTimes.push(G.time);
  if (c.space) spaceTyped(); else letterTyped(c);
  const line = Words.advance();
  if (line) lineDone(line);
  Words.render();
}

function letterTyped(c) {
  Sound.play("key");
  addFocus(1);
  powerHook("onLetter", c);
  const n = G.wiz.normal;
  if (++G.count.letters >= n.every) { G.count.letters = 0; cast("normal"); }
  if (c.last) wordDone(c.word);
}

function spaceTyped() {
  Sound.play("space");
  powerHook("onSpace");
}

function wordDone(word) {
  const clean = word.errors === 0, w = G.wiz;
  if (clean) G.combo++;
  // words only count toward an attack while focus is high enough; the count is kept if focus drops
  if (G.level >= w.skill.level && ++G.count.skill >= w.skill.every) { G.count.skill = 0; cast("skill"); }
  if (G.level >= w.ult.level && ++G.count.ult >= w.ult.every) { G.count.ult = 0; fireUlt(0); }
  powerHook("onWord", word, clean);
}

function lineDone(line) { powerHook("onLine", line.errors === 0); }

function typo() {
  if (G.typoGuards > 0) {
    G.typoGuards--; Sound.play("block"); popupWizard("Guarded!", "#9fe8ff");
    return;
  }
  G.combo = 0;
  const before = G.level;
  setFocus(G.focus - CFG.typoFocusLoss, true);
  Sound.play("typo");
  if (G.level < before) Sound.play("levelDown");
  powerHook("onTypo");
  UI.shakeWords();
}

/* ---- attacks ---- */
function enemiesByDistance(range = Infinity) {
  const p = wizPos();
  return G.enemies
    .filter((e) => !e.dead && e.y > -4)
    .map((e) => [e, Math.hypot(e.x - p.x, e.y - p.y)])
    .filter(([, d]) => d <= range)
    .sort((a, b) => a[1] - b[1])
    .map(([e]) => e);
}

/* cast an attack now, or hold it until there is a target */
function cast(kind, bonus = 0, hold = true) {
  const a = G.wiz[kind];
  const range = a.range === Infinity ? Infinity : a.range * F.H;
  const targets = enemiesByDistance(range).slice(0, a.count);
  if (!targets.length) {
    if (hold && G.ready.length < 6) G.ready.push({ kind, bonus });
    return false;
  }
  const t = staffTip();
  for (let i = 0; i < a.count; i++) {
    const ang = -Math.PI / 2 + (i - (a.count - 1) / 2) * 0.45;
    const sp = kind === "skill" ? 60 : 90;
    G.shots.push({
      kind, x: t.x, y: t.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      target: targets[i % targets.length], dmg: a.damage * mult() * (1 + bonus), delay: i * 0.05,
    });
  }
  Sound.play(kind === "skill" ? "big" : "shot");
  return true;
}

/* the ultimate's zone is an ellipse around the wizard, wider than it is tall */
function zoneSize() {
  const u = G.wiz.ult, ry = u.radius * F.H;
  return { rx: Math.min(ry * u.wide, F.W * 0.6), ry };
}

function fireUlt(bonus) {
  const u = G.wiz.ult;
  if (G.zone) { G.zone.t += u.duration; G.zone.hell = true; G.zone.bonus = Math.max(G.zone.bonus, bonus); }
  else G.zone = { t: u.duration, hell: false, bonus };
  Sound.play("ult");
  G.shake = 0.5;
  const p = wizPos();
  burst(p.x, p.y, 60, G.zone.hell ? HELL : FIRE, 70);
  powerHook("onUlt");
}

/* ---- enemies ---- */
function buildWave(w) {
  const types = Object.entries(ENEMY_TYPES).filter(([, t]) => t.from <= w);
  const total = types.reduce((s, [, t]) => s + t.weight, 0);
  const q = [];
  for (let i = 0; i < CFG.waveSize(w); i++) {
    let r = Math.random() * total;
    for (const [id, t] of types) { r -= t.weight; if (r < 0) { q.push(id); break; } }
  }
  return q;
}

function spawnEnemy(id) {
  const t = ENEMY_TYPES[id], hp = Math.round(t.hp * CFG.enemyHpScale(G.wave));
  G.enemies.push({ id, t, x: rand(12, F.W - 12), y: -8, hp, max: hp, speed: t.speed * rand(0.9, 1.1), anim: Math.random() * 2, flash: 0, wob: Math.random() * 6 });
}

function damage(e, amt) {
  if (e.dead) return;
  e.hp -= amt; e.flash = 0.1;
  popup(e.x, e.y - 8, Math.round(amt), "#fff");
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true;
  G.kills++; G.ws.kills++;
  G.score += e.t.points * G.level;
  burst(e.x, e.y, 18, [e.t.color, "#fff", "#1a1220"], 45);
  Sound.play("die");
  powerHook("onKill", e);
}

function hurtWizard(n) {
  while (n > 0 && G.shields > 0) { G.shields--; n--; Sound.play("block"); popupWizard("Blocked", "#9fe8ff"); }
  if (n <= 0) return;
  G.hp -= n; G.ws.hpLost += n; G.hitT = 0.4; G.shake = 0.3;
  Sound.play("hurt");
  UI.hurt();
  if (G.hp <= 0) die();
}

function heal(n) {
  G.hp = Math.min(G.maxHp, G.hp + n);
  popupWizard(`+${n} health`, "#7dff9a"); Sound.play("heal");
}

function die() {
  if (G.revives > 0) {
    G.revives--;
    G.hp = Math.ceil(G.maxHp / 2);
    powerNote("Undying Will");
    fireUlt(0);
    return;
  }
  G.mode = "over";
  if (G.score > best) { best = G.score; try { localStorage.setItem("ts_best", best); } catch (e) {} }
  Sound.play("over");
  UI.showOver();
}

/* ---- waves and power picks ---- */
function offerPick(first) {
  G.mode = "pick";
  UI.showPick(rollPowers(first), first);
}

function choosePower(id) {
  if (!G || G.mode !== "pick" || !POWER_BY_ID[id]) return;
  G.powers[id] = (G.powers[id] || 0) + 1;
  const p = POWER_BY_ID[id];
  if (p.onGain) p.onGain(G.powers[id], G.ps[id] || (G.ps[id] = {}));
  Sound.play("pick");
  startWave();
}

function startWave() {
  G.wave++;
  G.ws = { wave: G.wave, chars: 0, typos: 0, time: 0, kills: 0, hpLost: 0 };
  G.stats.push(G.ws);
  G.queue = buildWave(G.wave);
  G.spawnT = 1.2; G.clearT = 0;
  G.enemies = []; G.shots = []; G.ready = []; G.zone = null;
  if (CFG.resetFocusEachWave) setFocus(0, true);
  powerHook("onWaveStart");
  UI.hideOverlay();
  Words.render();
  beginPlay("Wave " + G.wave);
}

/* resume play, after a 3-second "get ready" countdown if it's switched on */
function beginPlay(label = "") {
  if (!Prefs.countdown) { G.mode = "play"; if (label) UI.banner(label); return; }
  G.mode = "countdown"; G.cd = 3; G.cdLabel = label; G.cdShown = 0;
}

function updateCountdown(dt) {
  G.cd -= dt;
  if (G.cd <= 0) { G.mode = "play"; UI.banner("Go!"); Sound.play("go"); return; }
  const n = Math.ceil(G.cd);
  if (n !== G.cdShown) { G.cdShown = n; Sound.play("tick"); }
  UI.showCount(n, G.cdLabel);
}

/* ---- effects ---- */
const FIRE = ["#fff6c2", "#ffd23f", "#ff8c1a", "#e8451e"];
const HELL = ["#f3d9ff", "#c77dff", "#9a3fd6", "#5a189a"];
function burst(x, y, n, colors, speed, life = 0.6) {
  for (let i = 0; i < n && G.parts.length < 900; i++) {
    const a = Math.random() * Math.PI * 2, v = Math.random() * speed;
    G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * rand(0.5, 1), max: life, c: colors[i % colors.length], g: 20 });
  }
}
function levelBurst() {
  const p = wizPos();
  burst(p.x, p.y - 4, 20, ["#9fe8ff", "#ffffff", "#3a6cff"], 40);
}
function popup(x, y, text, color) { G.pops.push({ x, y, text: String(text), color, t: 0.9 }); }
function popupWizard(text, color) { const p = wizPos(); popup(p.x, p.y - 26, text, color); }
function powerNote(name) { popupWizard(name + "!", "#ffd23f"); Sound.play("power"); }
function later(delay, fn) { G.timers.push({ t: delay, fn }); }

/* ---- main update ---- */
function update(dt) {
  G.time += dt;
  G.ws.time += dt;
  const w = G.wiz, me = wizPos();

  // focus drains over time
  setFocus(G.focus - (CFG.focusDecayBase + CFG.focusDecayPerLevel * (G.level - 1)) * dt, true);

  // delayed actions (power chains)
  for (const t of G.timers) { t.t -= dt; if (t.t <= 0) { t.done = true; t.fn(); } }
  G.timers = G.timers.filter((t) => !t.done);

  // spawning
  if (G.queue.length) {
    G.spawnT -= dt;
    if (G.spawnT <= 0) { spawnEnemy(G.queue.pop()); G.spawnT = CFG.spawnGap(G.wave); }
  }

  // held attacks fire as soon as there's a target
  if (G.ready.length && enemiesByDistance().length) {
    G.ready = G.ready.filter((r) => !cast(r.kind, r.bonus, false));
  }

  // enemies walk toward the wizard
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.anim += dt; e.flash -= dt;
    const dx = me.x - e.x, dy = me.y - e.y, d = Math.hypot(dx, dy);
    if (d < 9) { e.dead = true; burst(e.x, e.y, 14, [e.t.color, "#1a1220"], 35); hurtWizard(e.t.damage); if (G.mode !== "play") return; continue; }
    e.x += (dx / d) * e.speed * dt + (e.id === "bat" ? Math.sin(G.time * 4 + e.wob) * 12 * dt : 0);
    e.y += (dy / d) * e.speed * dt;
  }

  // fire zone (ultimate)
  if (G.zone) {
    const z = G.zone, { rx, ry } = zoneSize();
    z.t -= dt;
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (((e.x - me.x) / rx) ** 2 + ((e.y - me.y) / ry) ** 2 > 1) { e.zt = undefined; continue; }
      e.zt = e.zt === undefined ? 1 : e.zt + dt;     // first tick happens on entering
      if (e.zt >= 1) { e.zt -= 1; damage(e, w.ult.dps * mult() * (z.hell ? 2 : 1) * (1 + z.bonus)); }
    }
    const pal = z.hell ? HELL : FIRE;
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2, k = Math.sqrt(Math.random());
      G.parts.push({ x: me.x + Math.cos(a) * rx * k, y: me.y + Math.sin(a) * ry * k, vx: 0, vy: -rand(8, 20), life: 0.6, max: 0.6, c: pal[i % 4], g: 0 });
    }
    if (z.t <= 0) G.zone = null;
  }

  // projectiles home in on their target
  for (const s of G.shots) {
    if (s.delay > 0) { s.delay -= dt; continue; }
    if (!s.target || s.target.dead) {
      s.target = enemiesByDistance()[0];
      if (!s.target) { s.dead = true; burst(s.x, s.y, 5, FIRE, 20); continue; }
    }
    const dx = s.target.x - s.x, dy = s.target.y - s.y, d = Math.hypot(dx, dy);
    if (d < 5) {
      s.dead = true;
      damage(s.target, s.dmg);
      burst(s.x, s.y, s.kind === "skill" ? 16 : 6, FIRE, s.kind === "skill" ? 45 : 25);
      Sound.play("hit");
      continue;
    }
    const sp = s.kind === "skill" ? 120 : 150, k = Math.min(1, dt * 7);
    s.vx += ((dx / d) * sp - s.vx) * k;
    s.vy += ((dy / d) * sp - s.vy) * k;
    s.x += s.vx * dt; s.y += s.vy * dt;
    if (Math.random() < 0.7) G.parts.push({ x: s.x, y: s.y, vx: rand(-6, 6), vy: rand(-6, 6), life: 0.3, max: 0.3, c: FIRE[Math.floor(Math.random() * 4)], g: 0 });
  }
  G.shots = G.shots.filter((s) => !s.dead);
  G.enemies = G.enemies.filter((e) => !e.dead);

  tickEffects(dt);
  G.hitT -= dt; G.shake = Math.max(0, G.shake - dt);

  // wave finished
  if (!G.queue.length && !G.enemies.length) {
    if (G.clearT === 0) { G.clearT = 1.6; Sound.play("wave"); UI.banner(`Wave ${G.wave} cleared`); }
    G.clearT -= dt;
    if (G.clearT <= 0) offerPick(false);
  }
}

/* words per minute (5 characters = 1 word) and typo percentage */
function wpmOf(chars, secs) { return secs > 0 ? chars / 5 / (secs / 60) : 0; }
function typoPct(chars, typos) { return chars + typos ? (typos / (chars + typos)) * 100 : 0; }
function runSummary() {
  const sum = (k) => G.stats.reduce((s, w) => s + w[k], 0);
  return { wpm: wpmOf(sum("chars"), sum("time")), typo: typoPct(sum("chars"), sum("typos")), kills: G.kills };
}

function tickEffects(dt) {
  for (const p of G.parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter((p) => p.life > 0);
  for (const p of G.pops) { p.t -= dt; p.y -= 14 * dt; }
  G.pops = G.pops.filter((p) => p.t > 0);
}
