/* ---- sound effects and music, all generated in code with the Web Audio API ---- */
const Sound = {
  ctx: null, sfxBus: null, musicBus: null, noiseBuf: null,
  sfxOn: true, musicOn: true,

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    const master = c.createGain(); master.gain.value = 0.8; master.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.connect(master);
    this.musicBus = c.createGain(); this.musicBus.connect(master);
    this.setSfx(this.sfxOn); this.setMusic(this.musicOn);
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Music.start();
  },

  setSfx(on) { this.sfxOn = on; if (this.sfxBus) this.sfxBus.gain.value = on ? 1 : 0; },
  setMusic(on) { this.musicOn = on; if (this.musicBus) this.musicBus.gain.value = on ? 0.55 : 0; },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  /* one oscillator note; o.t = start time, o.to = slide target, o.bus = output */
  tone(freq, dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = o.t ?? c.currentTime;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || "square";
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
    const v = o.vol ?? 0.15;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(o.bus || this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  noise(dur, o = {}) {
    const c = this.ctx; if (!c) return;
    const t = o.t ?? c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.filter || "lowpass";
    f.frequency.setValueAtTime(o.freq || 2000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = c.createGain(), v = o.vol ?? 0.1;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(o.bus || this.sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },

  play(name) {
    const c = this.ctx; if (!c || !this.sfxOn) return;
    const t = c.currentTime, lv = G ? G.level : 1, m = (n) => this.midi(n);
    switch (name) {
      case "key":    this.tone(900 + lv * 70, 0.03, { vol: 0.035, type: "square" }); break;
      case "space":  this.tone(500 + lv * 40, 0.04, { vol: 0.03, type: "triangle" }); break;
      case "typo":   this.tone(150, 0.14, { type: "sawtooth", vol: 0.12, to: 90 }); break;
      case "shot":   this.tone(700, 0.08, { vol: 0.04, to: 260 }); this.noise(0.06, { freq: 3000, vol: 0.03 }); break;
      case "big":    this.tone(320, 0.28, { type: "sawtooth", vol: 0.09, to: 110 }); this.noise(0.25, { freq: 1200, to: 300, vol: 0.08 }); break;
      case "hit":    this.noise(0.05, { freq: 1800, vol: 0.07 }); break;
      case "die":    this.tone(520, 0.18, { vol: 0.07, to: 70 }); this.noise(0.12, { freq: 900, vol: 0.06 }); break;
      case "hurt":   this.tone(220, 0.32, { type: "sawtooth", vol: 0.16, to: 55 }); this.noise(0.25, { freq: 600, vol: 0.14 }); break;
      case "block":  this.tone(1100, 0.12, { type: "triangle", vol: 0.12, to: 1500 }); break;
      case "levelUp": [0, 4, 7].forEach((s, i) => this.tone(m(72 + lv + s), 0.12, { t: t + i * 0.05, vol: 0.06, type: "square" })); break;
      case "levelDown": [7, 0].forEach((s, i) => this.tone(m(60 + s), 0.14, { t: t + i * 0.07, vol: 0.07, type: "triangle" })); break;
      case "ult":    this.noise(1.0, { freq: 200, to: 4000, vol: 0.16 }); this.tone(70, 1.0, { type: "sine", vol: 0.25, to: 40 }); break;
      case "wave":   [72, 76, 79, 84].forEach((n, i) => this.tone(m(n), 0.18, { t: t + i * 0.1, vol: 0.08 })); break;
      case "tick":   this.tone(m(76), 0.1, { type: "triangle", vol: 0.08 }); break;
      case "go":     this.tone(m(88), 0.25, { type: "triangle", vol: 0.1 }); this.tone(m(83), 0.25, { vol: 0.04 }); break;
      case "pick":   [79, 86].forEach((n, i) => this.tone(m(n), 0.12, { t: t + i * 0.07, vol: 0.07, type: "triangle" })); break;
      case "rune":   [88, 93].forEach((n, i) => this.tone(m(n), 0.12, { t: t + i * 0.05, vol: 0.05, type: "triangle" })); break;
      case "heal":   [72, 76, 79].forEach((n, i) => this.tone(m(n), 0.16, { t: t + i * 0.08, vol: 0.07, type: "triangle" })); break;
      case "power":  [84, 91].forEach((n, i) => this.tone(m(n), 0.1, { t: t + i * 0.05, vol: 0.05 })); break;
      case "over":   [67, 63, 60, 55].forEach((n, i) => this.tone(m(n), 0.35, { t: t + i * 0.22, vol: 0.09, type: "triangle" })); break;
    }
  },
};

/* A short chiptune loop: Am - F - C - G. Layers get added as the fight heats up. */
const Music = {
  bpm: 116, step: 0, next: 0, timer: null, intensity: 0, paused: false,
  chords: [[45, 57, 60, 64], [41, 53, 57, 60], [48, 55, 60, 64], [43, 55, 59, 62]],
  lead: [
    69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 72, 0, 69, 0, 0, 0,
    65, 0, 0, 69, 0, 0, 72, 0, 71, 0, 69, 0, 65, 0, 0, 0,
    67, 0, 0, 72, 0, 0, 76, 0, 79, 0, 76, 0, 72, 0, 0, 0,
    74, 0, 0, 71, 0, 0, 67, 0, 69, 0, 71, 0, 74, 0, 0, 0,
  ],

  start() {
    if (this.timer || !Sound.ctx) return;
    this.next = Sound.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  },

  tick() {
    const c = Sound.ctx, stepLen = 60 / this.bpm / 4;
    while (this.next < c.currentTime + 0.15) {
      this.playStep(this.step, this.next);
      this.next += stepLen;
      this.step = (this.step + 1) % 64;
    }
  },

  playStep(s, t) {
    if (!Sound.musicOn || this.paused) return;
    const bus = Sound.musicBus, chord = this.chords[Math.floor(s / 16)], i = s % 16, m = (n) => Sound.midi(n);
    if (i % 4 === 0) Sound.tone(m(chord[0]), 0.22, { t, type: "triangle", vol: 0.16, bus });
    Sound.tone(m(chord[1 + (i % 3)] + (i % 8 >= 4 ? 12 : 0)), 0.09, { t, vol: 0.018, bus });
    if (this.intensity >= 1) {
      if (this.lead[s]) Sound.tone(m(this.lead[s]), 0.26, { t, vol: 0.045, bus });
      if (i === 0 || i === 8) Sound.tone(130, 0.12, { t, type: "sine", vol: 0.22, to: 45, bus });
    }
    if (this.intensity >= 2 && i % 2 === 0) Sound.noise(0.03, { t, filter: "highpass", freq: 7000, vol: 0.035, bus });
  },
};
