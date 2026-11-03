# Type Spell

A typing battle game. Your wizard stands still while enemies walk down toward them, and you fight by typing the words in the book at the bottom. The design lives in the `type_spell` Google Doc.

## Run it

Open `index.html` in a browser. There's nothing to install or build.

## How it plays

- Every correct letter gives 1 focus. Focus has 10 levels and multiplies all damage, from ×1 up to ×40.
- Focus drains slowly over time, and every typo costs 10 focus.
- The Fire Wizard attacks on its own as you type:
  - **Fireballs** (Focus Lv 1+): every 8 letters.
  - **Big Fireballs** (Focus Lv 4+): every 5 words.
  - **Fire Zone** (Focus Lv 6+): every 20 words. Casting it again while it burns turns it into hellfire.
- You pick a common power at the start and another power after each wave. Picking one you already own levels it up.
- Press **Esc** to pause. The settings panel has music, sound effects, the theme picker, and a list of your powers.

## Files

| File | What's in it |
|---|---|
| `js/config.js` | All the numbers to tune: focus levels, decay, wave size, enemy stats, wizard attacks |
| `js/powers.js` | Every power and what it does |
| `js/game.js` | Game rules: typing, focus, attacks, enemies, waves |
| `js/render.js` | Drawing the battlefield (pixel art canvas) |
| `js/sprites.js` | Enemy and small-fireball pixel art, drawn from text maps |
| `js/audio.js` | Sound effects and music, generated in code |
| `js/ui.js` | HUD, menus, power picks, settings, themes |
| `js/words.js` | Word list and the 3-line words panel |
| `assets/` | Wizard and big-fireball sprites |
