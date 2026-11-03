/* ---- drawing the battlefield: a low-resolution "art" canvas scaled up with sharp pixels,
   plus a full-resolution "fx" canvas on top for readable numbers ---- */
const art = $("art"), fx = $("fx");
let ag = art.getContext("2d"), xg = fx.getContext("2d");
let bgCache = null;

function resize() {
  const box = $("field"), cw = box.clientWidth, ch = box.clientHeight;
  F.scale = cw >= 640 && ch >= 300 ? 3 : 2;
  F.W = Math.max(80, Math.floor(cw / F.scale));
  F.H = Math.max(60, Math.floor(ch / F.scale));
  art.width = F.W; art.height = F.H;
  art.style.width = F.W * F.scale + "px"; art.style.height = F.H * F.scale + "px";
  const d = window.devicePixelRatio || 1;
  fx.width = F.W * F.scale * d; fx.height = F.H * F.scale * d;
  fx.style.width = art.style.width; fx.style.height = art.style.height;
  ag = art.getContext("2d"); ag.imageSmoothingEnabled = false;
  xg = fx.getContext("2d"); xg.setTransform(d, 0, 0, d, 0, 0);
  bgCache = null;
  Words.measure();
}

/* ground: theme colour with a few scattered darker and lighter pixels */
function background() {
  if (bgCache) return bgCache;
  const c = document.createElement("canvas");
  c.width = F.W; c.height = F.H;
  const x = c.getContext("2d");
  x.fillStyle = THEME.field; x.fillRect(0, 0, F.W, F.H);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < F.W * F.H * 0.02; i++) {
    x.fillStyle = rnd() < 0.6 ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.06)";
    x.fillRect(Math.floor(rnd() * F.W), Math.floor(rnd() * F.H), 1, 1);
  }
  return (bgCache = c);
}

function drawCentered(img, x, y) { ag.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height / 2)); }

function draw() {
  ag.setTransform(1, 0, 0, 1, 0, 0);
  ag.drawImage(background(), 0, 0);
  xg.clearRect(0, 0, fx.width, fx.height);
  if (!G) return;

  if (G.shake > 0) ag.translate(Math.round(rand(-1, 1) * 2), Math.round(rand(-1, 1) * 2));
  const me = wizPos();

  // fire zone
  if (G.zone) {
    const { rx, ry } = zoneSize(), hell = G.zone.hell;
    ag.globalAlpha = 0.16 + 0.04 * Math.sin(G.time * 6);
    ag.fillStyle = hell ? "#9a3fd6" : "#ff7a1a";
    ag.beginPath(); ag.ellipse(me.x, me.y, rx, ry, 0, 0, Math.PI * 2); ag.fill();
    ag.globalAlpha = 1;
    const pal = hell ? HELL : FIRE;
    for (let i = 0; i < 220; i++) {
      const a = (i / 220) * Math.PI * 2 + G.time * 0.3;
      const fl = Math.sin(G.time * 10 + i * 1.7) > 0.3 ? 1 : 0;
      ag.fillStyle = pal[(i + Math.floor(G.time * 8)) % 4];
      ag.fillRect(Math.round(me.x + Math.cos(a) * rx), Math.round(me.y + Math.sin(a) * ry) - fl, 1, 1 + fl);
    }
  }

  // enemies, back to front
  for (const e of [...G.enemies].sort((a, b) => a.y - b.y)) {
    const f = Math.floor(e.anim * (e.id === "bat" ? 8 : 3)) % 2;
    drawCentered((e.flash > 0 ? SPR[e.id + "White"] : SPR[e.id])[f], e.x, e.y);
    if (e.hp < e.max) {
      const w = 10, top = Math.round(e.y - SPR[e.id][0].height / 2 - 3), left = Math.round(e.x - w / 2);
      ag.fillStyle = "#1a1220"; ag.fillRect(left - 1, top - 1, w + 2, 3);
      ag.fillStyle = "#e0383a"; ag.fillRect(left, top, w, 1);
      ag.fillStyle = "#5fd35a"; ag.fillRect(left, top, Math.max(1, Math.round(w * e.hp / e.max)), 1);
    }
  }

  // wizard (blinks white when hit) and shields
  const wiz = IMG.wizard;
  if (wiz) {
    const flash = G.hitT > 0 && Math.floor(G.hitT * 20) % 2 === 0;
    ag.drawImage(flash ? IMG.wizardWhite : wiz, me.x - 16, F.H - 34);
  }
  if (G.shields > 0) {
    ag.globalAlpha = 0.5 + 0.15 * Math.sin(G.time * 4);
    ag.strokeStyle = "#9fe8ff";
    ag.beginPath(); ag.arc(me.x, me.y - 1, 15, 0, Math.PI * 2); ag.stroke();
    ag.globalAlpha = 1;
  }

  // projectiles
  for (const s of G.shots) {
    if (s.delay > 0) continue;
    if (s.kind === "skill" && IMG.bigFire) {
      ag.save();
      ag.translate(Math.round(s.x), Math.round(s.y));
      ag.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
      ag.drawImage(IMG.bigFire, -8, -8);
      ag.restore();
    } else drawCentered(SPR.smallFire[0], s.x, s.y);
  }

  // particles
  for (const p of G.parts) {
    ag.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
    ag.fillStyle = p.c;
    ag.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  ag.globalAlpha = 1;

  // floating numbers and labels, drawn sharp
  xg.font = "bold 13px ui-monospace, Consolas, monospace";
  xg.textAlign = "center";
  xg.lineWidth = 3; xg.strokeStyle = "rgba(0,0,0,.8)";
  for (const p of G.pops) {
    xg.globalAlpha = Math.min(1, p.t * 2);
    const x = p.x * F.scale, y = p.y * F.scale;
    xg.strokeText(p.text, x, y); xg.fillStyle = p.color; xg.fillText(p.text, x, y);
  }
  xg.globalAlpha = 1;
}
