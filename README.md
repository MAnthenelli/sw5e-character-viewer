# SW5e Character Viewer

An offline-first vanilla HTML/CSS/JS PWA combat sheet for Star Wars 5e (`0.7.6` website builder JSON exports). Runs directly from disk (`index.html`) or over HTTP with service-worker caching, storing one character and 30 Undo entries locally in browser storage.

## Open and play

1. Extract the ZIP and open **index.html** in a modern browser (or serve over HTTP for offline PWA caching).
2. Click **Import character** and select any SW5e website builder `.json` export (sample fixtures are included in `tests/fixtures/`).
3. Use **Actions** for live weapon attack/damage calculations (including SW5e Double-Weapon Fighting, Two-Weapon Fighting, `Heavy`, `Mighty`, `Smart`, `Switch`, `Modal`, `Interlocking`, `Defensive`/`Reckless`/`Dire`/`Piercing` stances, `Burst`/`Rapid` DCs, Weapon Focus/Supremacy, and `Guard`), Force/Tech power casting with Light/Dark/Universal alignment DCs and Temporary Force/Tech Points, Maneuvers (with Save DCs and Superiority Die scaling), Fighting Styles/Masteries, and Lightsaber Forms.
4. Use **+ Effect** to apply any SW5e Appendix A condition, 3-tier SW5e cover (`+2`/`+3`/`+5`), ongoing Force/Tech power (including choice-based powers and enemy debuffs), maneuver buff/debuff, damage resistance, or condition immunity.
5. Use **Manage character** to inspect equipment with clickable Weapon/Armor property definitions, manage Force/Tech powers, feats, and combat options, or take a **Short rest** / **Long rest**.

## Tests & catalog rebuild

- **Unit tests:** `node tests/unit.cjs` (49 tests covering imports, SW5e PHB core rules, combat options, species, backgrounds, weapon/armor properties, and all 465 powers).
- **Rebuild catalogs from source archive:** `python3 tools/build-catalogs.py /path/to/sw5e_source_complete.zip`
