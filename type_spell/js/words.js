/* ---- word list and the 3-line words panel ---- */
const WORD_LIST = (
  "the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us " +
  "magic spell fire flame book staff tower storm light shadow dragon castle forest river stone gold silver crystal power focus quick brave calm swift bright dark ancient rune scroll potion charm wand cloak night star moon sun wind rain snow ember spark blaze frost ocean mountain valley shield sword arrow battle guard hero quest journey secret hidden wonder dream wizard " +
  "box next six fix mix wax tax fox fly sky key try why yes yet young yellow yard zone zero size lazy crazy fuzzy maze prize dozen extra exit expert pixel oxygen frozen sixty energy mystery yearly yield zest zigzag breeze glaze haze" +
  " house water place small large every great world still never again under while where right think point found sound might close light thought between always together several without another example important"
).split(" ").filter(Boolean);

const Words = {
  el: null,
  lines: [],       // 3 lines; each { chars: [...], errors }
  pos: 0,          // caret position in lines[0]
  cols: 48,        // characters that fit on one line
  last: "",

  measure() {
    if (!this.el) return;
    const probe = document.createElement("span");
    probe.textContent = "abcdefghij".repeat(4);
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    this.el.appendChild(probe);
    const charW = probe.getBoundingClientRect().width / 40 || 14;
    probe.remove();
    const cs = getComputedStyle(this.el);
    const inner = this.el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    this.cols = Math.max(16, Math.floor(inner / charW) - 1);
  },

  reset() {
    this.lines = [this.makeLine(), this.makeLine(), this.makeLine()];
    this.pos = 0;
    this.render();
  },

  makeLine() {
    const chars = [];
    const rune = typeof runeChance === "function" ? runeChance() : 0;
    let len = 0;
    for (;;) {
      let w;
      do { w = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]; } while (w === this.last);
      if (len && len + w.length + 1 > this.cols) break;
      this.last = w;
      const word = { text: w, errors: 0 };
      [...w].forEach((ch, i) => chars.push({ ch, word, last: i === w.length - 1, rune: Math.random() < rune, done: false, err: false }));
      chars.push({ ch: " ", space: true, done: false, err: false });
      len += w.length + 1;
    }
    return { chars, errors: 0 };
  },

  cur() { return this.lines[0].chars[this.pos]; },

  /* moves the caret forward; returns the finished line when the first line is done */
  advance() {
    this.pos++;
    if (this.pos < this.lines[0].chars.length) return null;
    const done = this.lines.shift();
    this.lines.push(this.makeLine());
    this.pos = 0;
    return done;
  },

  render() {
    if (!this.el) return;
    this.el.innerHTML = this.lines.map((line, li) => `<div class="line">${line.chars.map((c, i) => {
      let cls = "c";
      if (c.done) cls += c.err ? " fix" : " ok";
      else if (c.err) cls += " bad";
      else if (c.rune) cls += " rune";
      if (li === 0 && i === this.pos) cls += " cur";
      return `<span class="${cls}">${c.space ? "&nbsp;" : c.ch}</span>`;
    }).join("")}</div>`).join("");
  },
};
