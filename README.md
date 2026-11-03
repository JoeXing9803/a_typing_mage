# Spellfire: a typing mage

> **New:** the next game, **Type Spell**, is in [`type_spell/`](type_spell/README.md). Spellfire below is the earlier prototype.

A browser typing game. Enemies march along a winding path toward your mage, and you stop them by typing fire spells. Type fast and cleanly to build a combo, unlock rarer spells, and multiply your score.

## How to play

1. Open `index.html` in a web browser. There's nothing to install or build.
2. Click **Start**.
3. Type the spell name shown at the bottom of the screen before the blue timer bar runs out.

- **Combo:** each spell you type without a typo adds 1 to your combo. A typo resets it to zero. If the timer runs out, the combo resets and you get a new spell.
- **Spell rarity:** higher combos unlock rarer, stronger spells: common, uncommon, rare, epic, and legendary. The next spell is previewed beside the current one.
- **Score:** each kill is worth the enemy's points × your combo.
- **Health:** you have 5 hearts. Each enemy that reaches your mage costs one.

## Enemies

| Color  | Health | Points |
|--------|--------|--------|
| Green  | 10     | 5      |
| Yellow | 20     | 10     |
| Orange | 40     | 20     |
| Red    | 60     | 30     |

There are 10 waves, each tougher than the last. After wave 10 the game goes endless: every enemy gets more health each wave and they spawn faster.

## Wave rewards

After each wave you choose one of three boosts, such as healing, double score, typo shields, guaranteed rare spells, or permanent damage bonuses.

Your best score is saved in the browser.

## Files

- `index.html`: page layout
- `style.css`: styling, including light and dark themes
- `script.js`: game logic, spells, waves, and rendering

To change difficulty, edit the tunables near the top of `script.js`: `TRAV` sets how fast enemies cross the path, and `SP_BASE`, `SP_STEP`, and `SP_MIN` control how often they spawn.
