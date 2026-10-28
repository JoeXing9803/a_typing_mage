const $=id=>document.getElementById(id);
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const smp=(a,n)=>a.sort(()=>Math.random()-.5).slice(0,n);
const fx=(el,c)=>{el.classList.remove(c);void el.offsetWidth;el.classList.add(c)};
/* ---- tunables ---- */
const TRAV=26; /* seconds an enemy needs to cross the path: LOWER = FASTER */
const SP_BASE=1.4, SP_STEP=.12, SP_MIN=.3; /* seconds between spawns: LOWER = DENSER */
const HP=[10,20,40,60], PTS=[5,10,20,30], EC=["#3ecf5a","#f5d327","#ff8c1a","#f23b3b"];
const WV=[[10,1,0,0],[10,4,0,0],[15,8,0,0],[20,10,3,0],[20,15,6,0],[20,20,9,1],[10,25,15,5],[5,35,20,10],[0,40,30,15],[0,40,40,20],[0,0,50,50]];
const RN=["common","uncommon","rare","epic","legendary"];
const T=[[90,50,20,0],[10,30,25,20],[0,20,25,35],[0,0,20,30],[0,0,10,15]];
/* ---- spells ---- */
const fd=()=>10+(S.wild>0?6:0);
const al=()=>S.en.filter(e=>!e.dead).sort((a,b)=>b.p-a.p);
const hit=(a,n,c)=>a.forEach(e=>dmg(e,n+S.dm+(c?S.cb:0)));
const ig=a=>a.forEach(e=>{hit([e],5);if(!e.dead)e.burn=5});
const SP=[
{n:"Fireball",r:0,d:"10 damage to the first enemy on the path.",f:()=>hit(al().slice(0,1),10,1)},
{n:"Flame Lash",r:0,d:"10 damage to 3 random enemies.",f:()=>hit(smp(al(),3),10,1)},
{n:"Fire Burst",r:1,d:"15 damage to the first 5 enemies.",f:()=>hit(al().slice(0,5),15)},
{n:"Flame Strike",r:1,d:"10 damage to 5 random enemies.",f:()=>hit(smp(al(),5),10)},
{n:"Inferno",r:2,d:"20 damage to the first 8 enemies.",f:()=>hit(al().slice(0,8),20)},
{n:"Blaze",r:2,d:"Fire covers the whole path for 10s, 1 damage per second.",f:()=>{S.fire=S.fire.map(v=>Math.max(v,fd()))}},
{n:"Combustion",r:2,d:"15 damage to 2 random enemies. If one dies, 15 damage to the 2 enemies ahead and behind it.",f:()=>{const a=al(),t=smp([...a],2);hit(t,15);t.forEach(e=>{if(e.dead){const i=a.indexOf(e);[i-2,i-1,i+1,i+2].forEach(j=>{const o=a[j];if(o&&!o.dead)hit([o],15)})}})}},
{n:"Ignite",r:2,d:"5 damage and burning for 5s to a random enemy. It leaves a fire trail (10s, 1 damage per second).",f:()=>ig(smp(al(),1))},
{n:"Wildfire",r:3,d:"For 10s, the fire you create lasts 6s longer.",f:()=>{S.wild=10}},
{n:"Hellfire",r:3,d:"For 8s, all fire deals 3 extra damage per second.",f:()=>{S.hell=8}},
{n:"Scorching Ray",r:3,d:"5 damage and burning for 5s to 3 random enemies, each leaving a fire trail.",f:()=>ig(smp(al(),3))},
{n:"Incinerate",r:4,d:"Instantly kills 8 enemies, healthiest first.",f:()=>al().sort((a,b)=>b.hp-a.hp).slice(0,8).forEach(e=>dmg(e,9999))}
];
/* ---- wave rewards ---- */
const RW=[
{n:"Double Score",d:"Next wave: kills score ×2.",f:()=>{S.nx.s*=2}},
{n:"Heal 3",d:"Restore 3 health (max 5).",f:()=>{S.hp=Math.min(5,S.hp+3)}},
{n:"Epic Opener",d:"Your first spell next wave is epic.",f:()=>S.q.push("epic")},
{n:"Typo Shield",d:"Ignore your next 3 typos.",f:()=>{S.tc+=3}},
{n:"Rare Opener",d:"Your first 3 spells next wave are rare.",f:()=>S.q.push("rare","rare","rare")},
{n:"Common Might",d:"Common spells deal +10 damage for the rest of the run.",f:()=>{S.cb+=10}},
{n:"Gambler’s Clock",d:"Next wave: 1 second less per spell, but kills score ×3.",f:()=>{S.nx.s*=3;S.nx.t=1}},
{n:"Brittle Foes",d:"Enemies take +3 damage from your spells for the rest of the run.",f:()=>{S.dm+=3}}
];
/* ---- path & canvas ---- */
const WP=[[1.03,.74],[.8,.74],[.64,.28],[.45,.28],[.33,.72],[.2,.72],[.13,.5]],PT=[];
(()=>{const sg=[];let L=0;for(let i=1;i<WP.length;i++){const d=Math.hypot(WP[i][0]-WP[i-1][0],WP[i][1]-WP[i-1][1]);sg.push(d);L+=d}
for(let k=0;k<=200;k++){let d=k/200*L,i=0;while(i<sg.length-1&&d>sg[i]){d-=sg[i];i++}const f=d/sg[i];PT.push([WP[i][0]+(WP[i+1][0]-WP[i][0])*f,WP[i][1]+(WP[i+1][1]-WP[i][1])*f])}})();
const cvs=$("cv"),g=cvs.getContext("2d"),C={};let cw=1,ch=1;
function theme(){const s=getComputedStyle(document.documentElement);C.cv=s.getPropertyValue("--cv");C.path=s.getPropertyValue("--path")}
function resize(){const d=window.devicePixelRatio||1;cw=cvs.clientWidth;ch=cvs.clientHeight;cvs.width=cw*d;cvs.height=ch*d;g.setTransform(d,0,0,d,0,0);theme()}
addEventListener("resize",resize);matchMedia("(prefers-color-scheme:dark)").addEventListener("change",theme);
function pos(p){const v=Math.min(1,Math.max(0,p))*200,i=Math.min(199,Math.floor(v)),f=v-i;return[(PT[i][0]+(PT[i+1][0]-PT[i][0])*f)*cw,(PT[i][1]+(PT[i+1][1]-PT[i][1])*f)*ch]}
function draw(){
  g.fillStyle=C.cv;g.fillRect(0,0,cw,ch);
  g.lineCap="round";g.lineJoin="round";g.beginPath();PT.forEach((p,i)=>g[i?"lineTo":"moveTo"](p[0]*cw,p[1]*ch));g.strokeStyle=C.path;g.lineWidth=26;g.stroke();
  for(let i=0;i<100;i++){const f=S.fire[i];if(f>0){const a=pos(i/100),b=pos((i+1)/100);g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.strokeStyle=`rgba(255,${100+Math.random()*70|0},20,${Math.min(1,f/2)*.9})`;g.lineWidth=18;g.stroke()}}
  const px=.06*cw,py=.5*ch;g.fillStyle="#ff7a3a";g.beginPath();g.moveTo(px,py-18);g.lineTo(px-15,py+14);g.lineTo(px+15,py+14);g.fill();
  g.fillStyle="#888";g.font="12px sans-serif";g.textAlign="center";g.fillText("mage",px,py+30);
  for(const e of S.en){const q=pos(e.p);g.beginPath();g.arc(q[0],q[1],11,0,7);g.fillStyle=e.fl>0?"#fff":EC[e.t];g.fill();
    if(e.burn>0){g.strokeStyle="#ff5a1f";g.lineWidth=3;g.stroke()}
    if(e.hp<e.max){g.fillStyle="rgba(0,0,0,.55)";g.fillRect(q[0]-17,q[1]-28,34,7);g.fillStyle="#2fbf71";g.fillRect(q[0]-16,q[1]-27,32*Math.max(0,e.hp/e.max),5)}}
}
/* ---- game ---- */
let S={mode:"idle",en:[],fire:Array(100).fill(0),hp:5,wave:1,score:0,combo:0,tc:0,wild:0,hell:0,sp:SP[0],pos:0,tl:6,tmax:6},best=0;
try{best=+localStorage.getItem("sf_best")||0}catch(e){}
function ov(h){$("overlay").className="on";$("overlay").innerHTML=`<div class="box">${h}</div>`}
function title(){ov(`<h1>Spellfire</h1><p>Type the spell shown at the bottom before the blue line runs out. A clean spell adds 1 combo, a typo resets it to zero. Higher combos unlock rarer, stronger spells, and every kill scores points × combo.</p><p>Stop enemies before they reach your mage. You have 5 health, and each enemy that gets through takes 1.</p>${best?`<p>Best score: ${best}</p>`:""}<button class="go" data-go>Start</button>`)}
function newRun(){S={mode:"play",en:[],sl:[],fire:Array(100).fill(0),hp:5,wave:1,score:0,combo:0,tc:0,dm:0,cb:0,q:[],nx:{s:1,t:0},m:{s:1,t:0},wild:0,hell:0,sp:SP[0],pos:0,err:false,tl:6,tmax:6,sc:1,itv:3,hb:0};startWave()}
function startWave(){
  const w=S.wave,c=WV[Math.min(w-1,10)];
  S.sl=[];c.forEach((n,t)=>{for(let i=0;i<n;i++)S.sl.push(t)});smp(S.sl,S.sl.length);
  S.hb=w>10?2*(w-10):0;S.m=S.nx;S.nx={s:1,t:0};S.tmax=6-S.m.t;
  S.itv=Math.max(SP_MIN,SP_BASE-SP_STEP*w);S.sc=1;S.en=[];S.fire=Array(100).fill(0);S.wild=S.hell=0;S.mode="play";
  $("overlay").className="";nextWord();$("kb").focus();
}
function nextWord(){
  let r;
  if(S.q.length)r=RN.indexOf(S.q.shift());
  else{const c=S.combo,k=c<=3?0:c<=8?1:c<=15?2:3;let n=Math.random()*100;r=0;for(let i=0;i<5;i++){n-=T[i][k];if(n<0){r=i;break}}}
  const all=SP.filter(s=>s.r===r),pool=all.filter(s=>s!==S.sp);
  S.sp=rnd(pool.length?pool:all);S.pos=0;S.err=false;S.tl=S.tmax;drawWord();
}
function drawWord(){
  const s=S.sp,p=S.pos,q=x=>x.replace(/ /g,"\u00a0");
  $("tag").textContent=RN[s.r]+" spell";$("tag").style.color=`var(--r${s.r})`;$("word").style.color=`var(--r${s.r})`;
  $("word").innerHTML=[...s.n].map((ch,i)=>`<span class="${i<p?"d":i===p?"c":""}">${q(ch)}</span>`).join("");
  $("desc").textContent=s.d;
}
function onChar(c){
  if(S.mode!=="play")return;
  if(c===S.sp.n[S.pos].toLowerCase()){S.pos++;if(S.pos===S.sp.n.length)done();else drawWord()}
  else if(S.tc>0)S.tc--;
  else{S.combo=0;S.err=true;fx($("app"),"shake")}
}
function done(){if(!S.err)S.combo++;S.sp.f();nextWord()}
function dmg(e,n){if(e.dead)return;e.hp-=n;e.fl=.12;if(e.hp<=0)kill(e)}
function kill(e){if(e.dead)return;e.dead=true;S.score+=PTS[e.t]*Math.max(1,S.combo)*S.m.s}
function update(dt){
  S.sc-=dt;
  if(S.sl.length&&S.sc<=0){const t=S.sl.pop(),h=HP[t]+S.hb;S.en.push({t,hp:h,max:h,p:0,burn:0,fl:0});S.sc=S.itv}
  for(const e of S.en){
    if(e.dead)continue;e.p+=dt/TRAV;e.fl-=dt;
    const ci=Math.min(99,Math.floor(e.p*100));
    if(S.fire[ci]>0){e.hp-=(1+(S.hell>0?3:0))*dt;if(e.hp<=0){kill(e);continue}}
    if(e.burn>0){e.burn-=dt;const b=Math.max(0,ci-1);S.fire[b]=Math.max(S.fire[b],fd())}
    if(e.p>=1){e.dead=true;S.hp--;fx($("field"),"shake")}
  }
  S.fire=S.fire.map(v=>Math.max(0,v-dt));S.wild-=dt;S.hell-=dt;
  S.tl-=dt;if(S.tl<=0){S.combo=0;nextWord()}
  S.en=S.en.filter(e=>!e.dead);
  if(S.hp<=0)return die();
  if(!S.sl.length&&!S.en.length)reward();
}
function reward(){
  S.mode="reward";
  const p=[...RW].sort(()=>Math.random()-.5).slice(0,3);
  ov(`<h2>Wave ${S.wave} cleared</h2><p>Pick one boost for the road ahead.</p>${p.map(r=>`<button data-r="${RW.indexOf(r)}"><b>${r.n}</b><span>${r.d}</span></button>`).join("")}`);
}
function die(){
  S.mode="dead";
  if(S.score>best){best=S.score;try{localStorage.setItem("sf_best",best)}catch(e){}}
  ov(`<h2>The mage has fallen</h2><p>Wave ${S.wave} · Score ${S.score} · Best ${best}</p><button class="go" data-go>Try again</button>`);
}
function hud(){
  $("hp").textContent="Health "+"♥".repeat(Math.max(0,S.hp))+"♡".repeat(Math.max(0,5-S.hp));
  $("wave").textContent="Wave "+S.wave+(S.wave>10?" (endless)":"");
  $("score").textContent="Score "+S.score;
  $("combo").textContent=S.combo>0?S.combo+"x combo!":"";
  $("buffs").textContent=[S.wild>0&&"Wildfire "+Math.ceil(S.wild)+"s",S.hell>0&&"Hellfire "+Math.ceil(S.hell)+"s",S.tc>0&&"Typo shields "+S.tc].filter(Boolean).join(" · ");
  $("bar").style.width=Math.max(0,S.tl/S.tmax*100)+"%";
}
let last=performance.now();
function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(S.mode==="play")update(dt);draw();hud();requestAnimationFrame(loop)}
$("overlay").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-go"))newRun();
  else if(b.dataset.r){RW[+b.dataset.r].f();S.wave++;startWave()}
});
const kb=$("kb");
kb.addEventListener("input",()=>{for(const c of kb.value.toLowerCase())onChar(c);kb.value=""});
document.addEventListener("click",e=>{if(!e.target.closest("button"))kb.focus()});
document.addEventListener("keydown",e=>{if(document.activeElement!==kb&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.length===1)kb.focus()});
resize();drawWord();title();requestAnimationFrame(loop);
