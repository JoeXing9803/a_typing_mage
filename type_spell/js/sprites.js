/* ---- pixel-art sprites drawn from text maps: one character = one pixel, "." = transparent ---- */
const PAL = {
  k: "#1a1220", w: "#ffffff",
  g: "#2f8f3a", G: "#5fd35a", L: "#b6f59a",             // slime
  y: "#9a7a12", Y: "#f2cf2f", Z: "#fff09a", r: "#e8451e", // bat
  o: "#8a4a14", O: "#e8862a", P: "#ffc078",             // golem
  d: "#7a1420", D: "#e0383a", E: "#ff8a7a", h: "#f3e6c8", // demon
  1: "#fff6c2", 2: "#ffd23f", 3: "#ff8c1a", 4: "#e8451e", 5: "#8a1e12", // fire
};

const SPRITE_MAPS = {
  slime: [[
    "....kkkk....",
    "..kkLGGGkk..",
    ".kLGGGGGGGk.",
    ".kGGkGGkGGk.",
    "kGGGkGGkGGGk",
    "kGGGGGGGGGGk",
    "kgGGGGGGGGgk",
    "kggGGGGGGggk",
    ".kggggggggk.",
    "..kkkkkkkk..",
  ], [
    "............",
    "....kkkk....",
    "..kkLGGGkk..",
    ".kLGkGGkGGk.",
    "kGGGkGGkGGGk",
    "kGGGGGGGGGGk",
    "kgGGGGGGGGgk",
    "kgggGGGGgggk",
    "kggggggggggk",
    ".kkkkkkkkkk.",
  ]],
  bat: [[
    "k............k",
    "kk..........kk",
    "kYk..kkkk..kYk",
    "kYYkkYYYYkkYYk",
    ".kYYYrYYrYYYk.",
    "..kYYYYYYYYk..",
    "...kkYZZYkk...",
    ".....kkkk.....",
  ], [
    "..............",
    ".....kkkk.....",
    "....kYYYYk....",
    ".kkkYrYYrYkkk.",
    "kYYYYYYYYYYYYk",
    "kYyYkYZZYkYyYk",
    "kyk.kkYYkk.kyk",
    "kk....kk....kk",
  ]],
  golem: [[
    "...kkkkkk...",
    "..kOOPPOOk..",
    ".kOOOOOOOOk.",
    ".kOkkOOkkOk.",
    ".kOk2OOk2Ok.",
    "kkOOOOOOOOkk",
    "kOkOooooOkOk",
    "kOkOOOOOOkOk",
    "kokOOooOOkok",
    ".kkOOOOOOkk.",
    "..kOOkkOOk..",
    "..kkk..kkk..",
  ], [
    "...kkkkkk...",
    "..kOOPPOOk..",
    ".kOOOOOOOOk.",
    ".kOkkOOkkOk.",
    ".kOk2OOk2Ok.",
    "kkOOOOOOOOkk",
    "kOkOooooOkOk",
    "kOkOOOOOOkOk",
    "kokOOooOOkok",
    ".kkOOOOOOkk.",
    ".kOOk..kOOk.",
    ".kkk....kkk.",
  ]],
  demon: [[
    "h..........h",
    "hh..kkkk..hh",
    ".hkkDDDDkkh.",
    "..kDDDDDDk..",
    ".kDD2DD2DDk.",
    ".kDDDDDDDDk.",
    ".kDDkkkkDDk.",
    "kEkDDDDDDkEk",
    "kDkDDddDDkDk",
    ".k.kDDDDk.k.",
    "...kDkkDk...",
    "...kDk.kDk..",
    "..kkk..kkk..",
  ], [
    "h..........h",
    "hh..kkkk..hh",
    ".hkkDDDDkkh.",
    "..kDDDDDDk..",
    ".kDD2DD2DDk.",
    ".kDDDDDDDDk.",
    ".kDDkkkkDDk.",
    "kEkDDDDDDkEk",
    "kDkDDddDDkDk",
    ".k.kDDDDk.k.",
    "...kDkkDk...",
    "..kDk..kDk..",
    "..kkk..kkk..",
  ]],
  smallFire: [[
    "..33..",
    ".3223.",
    "321123",
    "321123",
    ".3223.",
    "..44..",
  ]],
};

function makeSprite(rows) {
  const c = document.createElement("canvas");
  c.width = rows[0].length; c.height = rows.length;
  const x = c.getContext("2d");
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (PAL[ch]) { x.fillStyle = PAL[ch]; x.fillRect(i, j, 1, 1); }
  }));
  return c;
}

/* solid white copy of a sprite, used for the hit flash */
function whiteOf(src) {
  const c = document.createElement("canvas");
  c.width = src.width; c.height = src.height;
  const x = c.getContext("2d");
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = "#fff";
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

const SPR = {};
for (const [name, frames] of Object.entries(SPRITE_MAPS)) {
  SPR[name] = frames.map(makeSprite);
  SPR[name + "White"] = SPR[name].map(whiteOf);
}

/* image sprites from the assets folder */
const IMG = {};
function loadImage(key, src) {
  const im = new Image();
  im.onload = () => { IMG[key] = im; IMG[key + "White"] = whiteOf(im); };
  im.src = src;
}
loadImage("wizard", WIZARDS.fire.sprite);
loadImage("bigFire", "assets/fireball_16x16.png");
