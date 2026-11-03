/* ---- powers (from the design doc). They work for every wizard: they only talk to the
   wizard's normal attack, skill and ultimate, never to fire-specific effects.
   Hooks get (level, state, ...) where state is this power's own saved data for the run. ---- */
const s_ = (n) => (n > 1 ? "s" : "");

const POWERS = [
  { id: "quickcast", name: "Quickcast", rarity: "common",
    text: (lv) => `Type 3 words in 8 seconds with no typo to cast ${lv} free normal attack${s_(lv)}.`,
    onWord(lv, s, word, clean) {
      s.t = (s.t || []).filter((t) => G.time - t <= 8);
      if (!clean) { s.t = []; return; }
      s.t.push(G.time);
      if (s.t.length >= 3) {
        s.t = [];
        powerNote("Quickcast");
        for (let i = 0; i < lv; i++) later(i * 0.15, () => cast("normal"));
      }
    },
    onTypo(lv, s) { s.t = []; } },

  { id: "runespark", name: "Rune Spark", rarity: "common",
    text: (lv) => `${1 + 2 * lv}% of letters glow. Type a glowing letter for +5 focus.`,
    onLetter(lv, s, c) {
      if (!c.rune) return;
      addFocus(5); Sound.play("rune"); popupWizard("+5 focus", "#9fe8ff");
    } },

  { id: "warmup", name: "Warm Up", rarity: "common",
    text: (lv) => `Start every wave with ${10 * lv} focus.`,
    onWaveStart(lv) { setFocus(Math.max(G.focus, 10 * lv)); } },

  { id: "guardian", name: "Guardian Shield", rarity: "common",
    text: (lv) => `Start every wave with ${lv} shield${s_(lv)}. Each shield blocks 1 damage.`,
    onWaveStart(lv) { G.shields = Math.max(G.shields, lv); } },

  { id: "longincant", name: "Long Incantation", rarity: "rare",
    text: (lv) => `Finish a word longer than 5 letters with no typo to cast your skill (+${30 * lv}% damage).`,
    onWord(lv, s, word, clean) {
      if (clean && word.text.length > 5) { powerNote("Long Incantation"); cast("skill", 0.3 * lv); }
    } },

  { id: "calmward", name: "Calm Ward", rarity: "rare",
    need: (lv) => Math.max(6, 15 - 3 * (lv - 1)),
    text(lv) { return `At Focus Lv 3+, every ${this.need(lv)} kills give you a typo guard that cancels one typo (max ${CFG.maxTypoGuards}).`; },
    status(lv, s) { return `${s.k || 0} / ${this.need(lv)} kills`; },
    onKill(lv, s) {
      if (G.level < 3) return;
      s.k = (s.k || 0) + 1;
      if (s.k >= this.need(lv)) {
        s.k = 0;
        if (G.typoGuards < CFG.maxTypoGuards) { G.typoGuards++; popupWizard("Typo guard", "#9fe8ff"); }
      }
    } },

  { id: "arcane", name: "Arcane Letters", rarity: "rare",
    text: (lv) => `Each x, y or z you type charges 1 energy. At 5 energy, cast your skill ${lv} time${s_(lv)}.`,
    status: (lv, s) => `Energy ${s.e || 0} / 5`,
    onLetter(lv, s, c) {
      if (!"xyz".includes(c.ch)) return;
      s.e = (s.e || 0) + 1;
      if (s.e >= 5) {
        s.e = 0; powerNote("Arcane Letters");
        for (let i = 0; i < lv; i++) later(i * 0.25, () => cast("skill"));
      }
    } },

  { id: "mending", name: "Mending Verse", rarity: "rare",
    text: (lv) => `At Focus Lv 3+, every 5 words with no typo heal ${lv} health. At full health you get +${lv} max health instead (up to ${CFG.maxHealthCap}).`,
    status: (lv, s) => `${s.n || 0} / 5 clean words`,
    onWord(lv, s, word, clean) {
      if (!clean) { s.n = 0; return; }
      if (G.level < 3) return;
      s.n = (s.n || 0) + 1;
      if (s.n < 5) return;
      s.n = 0;
      if (G.hp < G.maxHp) heal(lv);
      else if (G.maxHp < CFG.maxHealthCap) { G.maxHp = Math.min(CFG.maxHealthCap, G.maxHp + lv); popupWizard(`+${lv} max health`, "#7dff9a"); Sound.play("heal"); }
    },
    onTypo(lv, s) { s.n = 0; } },

  { id: "perfectline", name: "Perfect Line", rarity: "rare",
    text: (lv) => `Finish a whole line with no typo for +${5 + 5 * lv} focus.`,
    onLine(lv, s, clean) {
      if (clean) { addFocus(5 + 5 * lv); popupWizard(`Perfect line +${5 + 5 * lv}`, "#9fe8ff"); Sound.play("rune"); }
    } },

  { id: "rhythm", name: "Rhythm of Breath", rarity: "epic",
    text: (lv) => `Every space you type gives +${lv} focus.`,
    onSpace(lv) { addFocus(lv); } },

  { id: "recital", name: "Grand Recital", rarity: "epic",
    text: (lv) => `Every 10 words longer than 5 letters cast your ultimate (+${30 * lv}% damage).`,
    status: (lv, s) => `${s.n || 0} / 10 long words`,
    onWord(lv, s, word) {
      if (word.text.length <= 5) return;
      s.n = (s.n || 0) + 1;
      if (s.n >= 10) { s.n = 0; powerNote("Grand Recital"); fireUlt(0.3 * lv); }
    } },

  { id: "flow", name: "Flow State", rarity: "epic",
    text: (lv) => `At Focus Lv 6+, every letter gives +${0.5 * lv} extra focus.`,
    onLetter(lv) { if (G.level >= 6) addFocus(0.5 * lv); } },

  { id: "undying", name: "Undying Will", rarity: "epic",
    text: (lv) => `When you fall, come back with half health and cast your ultimate. Works ${lv} time${s_(lv)} per game.`,
    status: () => `${G.revives} left`,
    onGain() { G.revives++; } },

  { id: "echo", name: "Echo Cast", rarity: "epic",
    text: (lv) => `Your ultimate also casts your skill ${lv + 1} times.`,
    onUlt(lv) { for (let i = 0; i < lv + 1; i++) later(0.4 + i * 0.35, () => cast("skill")); } },
];
const POWER_BY_ID = Object.fromEntries(POWERS.map((p) => [p.id, p]));

/* call a hook on every power the player owns */
function powerHook(name, ...args) {
  if (!G) return;
  for (const [id, lv] of Object.entries(G.powers)) {
    const p = POWER_BY_ID[id];
    if (p[name]) p[name](lv, G.ps[id] || (G.ps[id] = {}), ...args);
  }
}

/* chance that a new letter is a rune (Rune Spark) */
function runeChance() {
  const lv = G && G.powers.runespark;
  return lv ? (1 + 2 * lv) / 100 : 0;
}

/* three choices: commons only at the start, weighted rarities after that */
function rollPowers(firstPick) {
  const can = (p) => (G.powers[p.id] || 0) < CFG.powerMaxLevel;
  const out = [];
  for (let n = 0; n < 3; n++) {
    let rarity = "common";
    if (!firstPick) {
      const w = CFG.rarityWeights, total = w.common + w.rare + w.epic;
      let r = Math.random() * total;
      rarity = r < w.common ? "common" : r < w.common + w.rare ? "rare" : "epic";
    }
    let pool = POWERS.filter((p) => can(p) && !out.includes(p) && p.rarity === rarity);
    if (!pool.length) pool = POWERS.filter((p) => can(p) && !out.includes(p) && (!firstPick || p.rarity === "common"));
    if (!pool.length) break;
    out.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return out;
}
