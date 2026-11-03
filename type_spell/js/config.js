/* ---- tunables: change numbers here to rebalance the game ---- */
const CFG = {
  maxHealth: 10,
  maxHealthCap: 20,            // Mending Verse can't raise max health past this
  focusPerLevel: [10, 15, 20, 30, 50, 70, 100, 150, 200],   // focus needed to go from Lv 1→2, 2→3, ... 9→10
  focusMultipliers: [1, 2, 3, 4, 5, 8, 12, 16, 28, 40],
  focusMaxExtra: 100,          // after reaching Lv 10, this much more focus fills the bar to MAX
  focusDecayBase: 0.5,         // focus lost per second at Focus Lv 1
  focusDecayPerLevel: 0.3,     // extra focus lost per second for each level above 1
  typoFocusLoss: 10,           // focus points lost on each typo
  resetFocusEachWave: true,    // focus starts at 0 every wave (Warm Up changes that)
  waveSize: (w) => 8 + 4 * w,                          // enemies in wave w (wave 1: 12, wave 5: 28)
  spawnGap: (w) => Math.max(0.4, 1.3 - 0.06 * w),       // seconds between spawns
  enemyHpScale: (w) => 1 + 0.1 * (w - 1),               // +10% health per wave: 10 hp in wave 1 → 11 in wave 2
  rarityWeights: { common: 60, rare: 30, epic: 10 },    // chance of each rarity in a pick
  powerMaxLevel: 5,
  maxTypoGuards: 3,
};

/* Total focus where each level starts: Lv 1 = 0, Lv 2 = 10, Lv 3 = 25, Lv 4 = 45, ... Lv 10 = 645 */
const FOCUS_START = CFG.focusPerLevel.reduce((a, n) => [...a, a[a.length - 1] + n], [0]);
const FOCUS_CAP = FOCUS_START[9] + CFG.focusMaxExtra;

/* Enemies. speed is in art pixels per second; "from" is the first wave they appear in. */
const ENEMY_TYPES = {
  slime: { name: "Slime", hp: 6,  speed: 9,   damage: 1, points: 5,  from: 1, weight: 10, color: "#5fd35a" },
  bat:   { name: "Bat",   hp: 4,  speed: 15,  damage: 1, points: 8,  from: 2, weight: 6,  color: "#f2cf2f" },
  golem: { name: "Golem", hp: 22, speed: 5.5, damage: 2, points: 20, from: 3, weight: 4,  color: "#e8862a" },
  demon: { name: "Demon", hp: 40, speed: 7,   damage: 2, points: 35, from: 5, weight: 3,  color: "#e0383a" },
};

/* Wizards. Ranges are a share of the battlefield height. More wizards (ice, water, earth) go here later. */
const WIZARDS = {
  fire: {
    name: "Fire Wizard",
    sprite: "assets/fire_wizard_32x32.png",
    normal: { name: "Fireballs",     level: 1, every: 8,  unit: "letters", count: 5, damage: 2, range: Infinity,
              text: "Every 8 letters, throw 5 small fireballs at the closest enemies." },
    skill:  { name: "Big Fireballs", level: 4, every: 5,  unit: "words",   count: 3, damage: 7, range: 0.8,
              text: "Every 5 words, throw 3 big fireballs at the closest enemies in range." },
    ult:    { name: "Fire Zone",     level: 6, every: 20, unit: "words",   duration: 20, dps: 2, radius: 0.9, wide: 1.7,   // zone height = radius × field height; width = that × wide
              text: "Every 20 words, a fire zone burns enemies around you for 20s. Cast it again while it burns: +20s and it turns into purple hellfire (double damage)." },
  },
};
