"use strict";
/**
 * SW5e Character Viewer — Unified Open-Primitive Effect Engine (Step 0C)
 * Implements docs/effect-primitives.md:
 *   - Single collector `collectCharacterEffects(profile, session)` across all character sources
 *   - Automatic expansion of `innateActiveEffect` powers without concentration or point cost
 *   - Generic subsystem resolvers consumed by rules.js, conditions.js, casting.js, and skills.js
 *   - Backward-compatible with legacy v37 catalog fields during Chunks 1-10 migration
 */

function evaluateEffectWhen(when, profile, session, ctx = {}) {
  if (!when || typeof when !== "object") return true;
  const totalLvl = Number(profile?.level || 1);
  const gateLvl = ctx.classLevel !== undefined ? Number(ctx.classLevel) : totalLvl;
  if (when.minLevel !== undefined && gateLvl < when.minLevel) return false;
  if (when.maxLevel !== undefined && gateLvl > when.maxLevel) return false;
  if (when.totalMinLevel !== undefined && totalLvl < when.totalMinLevel) return false;
  if (when.className) {
    const hasMatch = typeof hasClass === "function"
      ? hasClass(profile, when.className)
      : normalizeName(profile?.className) === normalizeName(when.className);
    if (!hasMatch) return false;
  }
  if (when.minClassLevel !== undefined) {
    const targetCls = when.className || ctx.className || "";
    const clsLvl = targetCls && typeof classLevelOf === "function"
      ? classLevelOf(profile, targetCls)
      : (ctx.classLevel !== undefined ? Number(ctx.classLevel) : totalLvl);
    if (clsLvl < when.minClassLevel) return false;
  }
  if (when.activeEffect) {
    const canonOf = n => (typeof lightsaberFormRule === "function" && lightsaberFormRule(n)?.name) || n;
    const target = normalizeName(canonOf(when.activeEffect));
    const active = (session?.effects || []).some(e =>
      normalizeName(canonOf(e.name)) === target &&
      (!when.activeEffectTarget || (e.targetScope || "self") === when.activeEffectTarget)
    );
    if (!active) return false;
  }
  if (when.notActiveEffect) {
    const canonOf = n => (typeof lightsaberFormRule === "function" && lightsaberFormRule(n)?.name) || n;
    const target = normalizeName(canonOf(when.notActiveEffect));
    const active = (session?.effects || []).some(e => normalizeName(canonOf(e.name)) === target);
    if (active) return false;
  }
  if (when.state === "raging" && !session?.rage) return false;
  if (when.state === "concentrating" && !session?.concentration) return false;
  if (when.forceAffinity && normalizeName(session?.forceAffinity) !== normalizeName(when.forceAffinity)) return false;
  if (Array.isArray(when.notConditions) && when.notConditions.length && session) {
    const activeConds = new Set((session.effects || []).map(e => normalizeName(e.name)));
    const hasControlPain = activeConds.has("control pain");
    const immuneToExh = activeConds.has("immune to exhaustion");
    const isZeroHpUnconscious = Number(session.hp) === 0 && !hasControlPain;
    const isExhDead = !immuneToExh && (Number(session.exhaustion) || 0) >= 6;
    const isDeathFailDead = !hasControlPain && (Number(session.death?.failures) || 0) >= 3;
    const isUnconscious = activeConds.has("unconscious") || isZeroHpUnconscious;
    const isDead = activeConds.has("dead") || isExhDead || isDeathFailDead;
    const hasIncap = activeConds.has("incapacitated") || activeConds.has("paralyzed") || activeConds.has("petrified") || activeConds.has("stunned") || isUnconscious || isDead;
    for (const nc of when.notConditions) {
      const k = normalizeName(nc);
      if (activeConds.has(k)) return false;
      if (k === "unconscious" && isUnconscious) return false;
      if (k === "dead" && isDead) return false;
      if (k === "prone" && isUnconscious) return false;
      if (k === "incapacitated" && hasIncap) return false;
      if ((k === "blinded" || k === "deafened") && (isUnconscious || isDead)) return false;
    }
  }
  if (when.equipped === true && ctx.equipped === false) return false;
  if (when.carried === true && ctx.carried !== true) return false;
  if (when.wieldingProficientWeaponGroup && session && typeof wieldingProficientWeaponGroup === "function") {
    if (!wieldingProficientWeaponGroup(profile, session, when.wieldingProficientWeaponGroup, { noRecurse: true, collectedEffects: ctx.collectedEffects })) return false;
  }
  const choiceList = [];
  if (ctx.choice) choiceList.push(String(ctx.choice));
  if (Array.isArray(ctx.choices)) for (const ch of ctx.choices) if (ch) choiceList.push(String(ch));
  if (when.hasChoice === true && choiceList.length === 0) return false;
  if (when.choice) {
    const want = normalizeName(when.choice);
    if (!choiceList.some(c => normalizeName(c) === want)) return false;
  }
  if (when.choicePrefix) {
    const want = String(when.choicePrefix).toLowerCase();
    if (!choiceList.some(c => c.toLowerCase().startsWith(want))) return false;
  }
  return true;
}

function _substituteChoice(val, choiceStr) {
  if (typeof val === "string") {
    if (!val.includes("$choice")) return val;
    if (choiceStr) return val.replace(/\$choice/g, choiceStr);
    return val.replace(/\s*\(\$choice\)/g, "").replace(/\$choice/g, "chosen");
  }
  if (Array.isArray(val)) return val.map(v => _substituteChoice(v, choiceStr));
  if (val && typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = _substituteChoice(v, choiceStr);
    return out;
  }
  return val;
}

function _pushEffects(out, effects, source, profile, session, ctx = {}) {
  if (!Array.isArray(effects) || !effects.length) return;
  const choiceList = [];
  if (ctx.choice) choiceList.push(String(ctx.choice));
  if (Array.isArray(ctx.choices)) for (const ch of ctx.choices) if (ch) choiceList.push(String(ch));
  for (const eff of effects) {
    if (!eff || !eff.type) continue;
    if (!evaluateEffectWhen(eff.when, profile, session, ctx)) continue;
    if (eff.when?.choicePrefix && choiceList.length) {
      const pref = String(eff.when.choicePrefix).toLowerCase();
      const matched = choiceList.filter(c => c.toLowerCase().startsWith(pref));
      if (matched.length && JSON.stringify(eff).includes("$choice")) {
        for (const m of matched) {
          const stripped = m.slice(eff.when.choicePrefix.length).trim();
          if (!stripped) continue;
          out.push({ ..._substituteChoice(eff, stripped), source });
        }
        continue;
      }
    }
    if (eff.forEachChoice && choiceList.length) {
      const seenChoices = new Set();
      for (const ch of choiceList) {
        const chKey = normalizeName(ch);
        if (!chKey || seenChoices.has(chKey)) continue;
        seenChoices.add(chKey);
        const resolved = _substituteChoice(eff, ch);
        if (resolved.kind === "skillOrTool") {
          const isSkill = typeof skills !== "undefined" && Object.keys(skills).some(sk => normalizeName(sk) === chKey);
          resolved.kind = isSkill ? "skill" : "tool";
        }
        if (resolved.type === "defense" && typeof resolved.damageType === "string") {
          resolved.damageType = resolved.damageType.toLowerCase();
        }
        out.push({ ...resolved, source });
      }
      continue;
    }
    const resolved = _substituteChoice(eff, ctx.choice ? String(ctx.choice) : "");
    if (resolved.kind === "skillOrTool" && ctx.choice) {
      const chKey = normalizeName(ctx.choice);
      const isSkill = typeof skills !== "undefined" && Object.keys(skills).some(sk => normalizeName(sk) === chKey);
      resolved.kind = isSkill ? "skill" : "tool";
    }
    out.push({ ...resolved, source });
  }
}

let _renderEffectCache = null;
function withEffectCache(fn) {
  if (_renderEffectCache) return fn();
  _renderEffectCache = new Map();
  try { return fn(); }
  finally { _renderEffectCache = null; }
}
function _cachedFor(key, profile, session, compute) {
  if (!_renderEffectCache) return compute();
  let byP = _renderEffectCache.get(key);
  if (!byP) { byP = new Map(); _renderEffectCache.set(key, byP); }
  const pk = profile || null;
  let byS = byP.get(pk);
  if (!byS) { byS = new Map(); byP.set(pk, byS); }
  const sk = session || null;
  if (byS.has(sk)) return byS.get(sk);
  const val = compute();
  byS.set(sk, val);
  return val;
}
function _debounceFn(fn, waitMs = 120) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn.apply(this, args); }, waitMs);
  };
}
let _classOptionByNorm = null;
function _findClassOptionFast(optName) {
  if (typeof SW5E_CLASS_OPTIONS === "undefined") return null;
  if (!_classOptionByNorm) {
    _classOptionByNorm = new Map();
    for (const o of SW5E_CLASS_OPTIONS) _classOptionByNorm.set(normalizeName(o.name), o);
  }
  return _classOptionByNorm.get(normalizeName(optName)) || null;
}

function collectCharacterEffects(profile, session = null) {
  return _cachedFor("collect", profile, session, () => _collectCharacterEffectsUncached(profile, session));
}
function _collectCharacterEffectsUncached(profile, session = null) {
  const out = [];
  if (!profile) return out;

  const _flattenChoiceMap = map => {
    const res = [];
    if (!map || typeof map !== "object") return res;
    for (const [key, val] of Object.entries(map)) {
      const items = Array.isArray(val) ? val : (val ? [val] : []);
      for (const item of items) {
        const s = String(item || "").trim();
        if (!s) continue;
        res.push(s);
        if (key && !s.toLowerCase().startsWith(String(key).toLowerCase() + ":")) {
          res.push(key + ": " + s);
        }
      }
    }
    return res;
  };

  // 1. Species
  if (typeof speciesRecord === "function") {
    const sp = speciesRecord(profile.species);
    if (sp?.effects) {
      const spMapChoices = _flattenChoiceMap(session?.speciesTraitChoices);
      const spChoice = session?.speciesChoice || profile?.speciesChoice || spMapChoices[0] || "";
      _pushEffects(out, sp.effects, { kind: "species", name: sp.name, detail: spChoice ? `Species (${spChoice})` : "Species" }, profile, session, { choice: spChoice, choices: spMapChoices });
    }
  }

  // 2. Background
  if (typeof backgroundRecord === "function") {
    const bg = backgroundRecord(profile.background);
    if (bg?.effects) {
      const bgMapChoices = _flattenChoiceMap(session?.backgroundChoices);
      const bgChoice = bgMapChoices[0] || "";
      _pushEffects(out, bg.effects, { kind: "background", name: bg.name, detail: "Background" }, profile, session, { choice: bgChoice, choices: bgMapChoices });
    }
  }

  // 3. Class & Archetype (supports multiclass: gates each class/archetype against its own class level)
  const clsEntries = typeof characterClasses === "function"
    ? characterClasses(profile, session)
    : (profile.className && typeof classRecord === "function"
      ? [{
          name: profile.className,
          levels: Number(profile.level) || 1,
          archetype: session?.approach || profile.approach || "",
          isStarting: true,
          record: classRecord(profile.className),
          archetypeRecord: typeof archetypeRecord === "function" ? archetypeRecord(session?.approach || profile.approach, profile.className) : null
        }]
      : []);
  const clsChoice = session?.classChoice || profile?.classChoice || "";
  const clsChoices = Array.isArray(session?.classChoices) ? session.classChoices : (Array.isArray(profile?.classChoices) ? profile.classChoices : []);
  const archFeatureChoices = _flattenChoiceMap(session?.archetypeFeatureChoices);
  const baseArchChoices = Array.isArray(session?.archetypeChoices) ? session.archetypeChoices : (Array.isArray(profile?.archetypeChoices) ? profile.archetypeChoices : []);
  const archChoices = [...baseArchChoices, ...archFeatureChoices];
  const archChoice = session?.archetypeChoice || profile?.archetypeChoice || archFeatureChoices[0] || "";
  let hasUnarmoredDefense = false;
  for (const entry of clsEntries) {
    const cls = entry.record;
    const classCtx = { className: entry.name, classLevel: entry.levels, isStartingClass: entry.isStarting };
    if (cls?.effects) {
      // SW5e Ch. 6: If you already have Unarmored Defense from an earlier class, you cannot gain it again from another class.
      const clsEffs = hasUnarmoredDefense
        ? cls.effects.filter(ef => !(ef?.type === "acFormula" && ef?.requiresUnarmored))
        : cls.effects;
      const beforeLen = out.length;
      _pushEffects(
        out,
        clsEffs,
        { kind: "class", name: cls.name, detail: clsChoice ? `Class (${clsChoice})` : "Class" },
        profile,
        session,
        { ...classCtx, choice: clsChoice, choices: clsChoices }
      );
      if (!hasUnarmoredDefense && out.slice(beforeLen).some(ef => ef?.type === "acFormula" && ef?.requiresUnarmored)) {
        hasUnarmoredDefense = true;
      }
    }
    const arch = entry.archetypeRecord;
    if (arch?.effects) {
      _pushEffects(
        out,
        arch.effects,
        { kind: "archetype", name: arch.name, className: entry.name, detail: archChoice ? `Archetype (${archChoice})` : "Archetype" },
        profile,
        session,
        { ...classCtx, choice: archChoice, choices: archChoices }
      );
    }
  }

  // 4. Feats (preserves per-instance index for repeatable feats)
  const featList = Array.isArray(session?.feats) ? session.feats : (profile.selectedFeats || []);
  for (let i = 0; i < featList.length; i++) {
    const f = featList[i];
    const fname = typeof f === "string" ? f : f?.name;
    if (!fname || typeof featRule !== "function") continue;
    const rule = featRule(fname);
    if (rule?.effects) {
      const fMulti = (typeof f === "object" && Array.isArray(f?.multiChoice)) ? f.multiChoice.filter(Boolean) : [];
      const hasNonAbilityChoice = Boolean(rule?.extraChoiceSpec || rule?.choiceSpec);
      const fChoice = (typeof f === "object" && f) ? (f.choice || (fMulti.length === 1 ? fMulti[0] : (fMulti.length > 1 ? fMulti.join(", ") : "")) || (hasNonAbilityChoice ? "" : (f.abilityChoice || ""))) : "";
      const fChoices = (typeof f === "object" && Array.isArray(f?.powersChoice)) ? f.powersChoice : [];
      _pushEffects(
        out,
        rule.effects,
        { kind: "feat", name: rule.name, detail: fChoice ? `Feat (${fChoice})` : "Feat", instanceIndex: i, abilityChoice: f?.abilityChoice || "", choice: fChoice, multiChoice: fMulti },
        profile,
        session,
        { choice: fChoice, choices: fChoices }
      );
    }
  }

  // 5. Class Options & Improvements
  if (typeof SW5E_CLASS_OPTIONS !== "undefined" && Array.isArray(session?.classOptions)) {
    const _seenClassOptNames = new Set();
    for (const optName of session.classOptions) {
      const opt = _findClassOptionFast(optName);
      const normOpt = normalizeName(opt?.name || optName);
      if (_seenClassOptNames.has(normOpt)) continue;
      _seenClassOptNames.add(normOpt);
      const rawOptChoice = session?.classOptionChoices?.[opt?.name || optName] ?? session?.classOptionChoices?.[optName];
      let optChoices = Array.isArray(rawOptChoice) ? rawOptChoice.filter(Boolean).map(String) : (rawOptChoice ? [String(rawOptChoice)] : []);
      if (!optChoices.length && opt?.choiceSpec?.kind === "damageTypes" && Array.isArray(profile?.dewback) && profile.dewback.length) {
        optChoices = profile.dewback.filter(Boolean).map(String);
      }
      const optChoice = optChoices[0] || "";
      const optSrc = { kind: "classOption", name: opt?.name || optName, detail: optChoice ? `Class Option (${optChoice})` : "Class Option" };
      if (opt?.effects) {
        _pushEffects(out, opt.effects, optSrc, profile, session, { choice: optChoice, choices: optChoices });
      }
    }
  }
  if (typeof SW5E_CLASS_IMPROVEMENTS !== "undefined") {
    const ciTargets = new Map();
    const ciParents = new Map();
    const addCiTarget = (rawKey, parentSrc = null) => {
      if (!rawKey) return;
      const nk = normalizeName(rawKey);
      const rec = SW5E_CLASS_IMPROVEMENTS.find(ci => normalizeName(ci.className) === nk || normalizeName(ci.label) === nk);
      if (rec) {
        const key = normalizeName(rec.className);
        ciTargets.set(key, rec);
        if (parentSrc && !ciParents.has(key)) ciParents.set(key, parentSrc);
      }
    };
    if (session?.classImprovementEnabled && profile?.className) addCiTarget(profile.className);
    if (Array.isArray(profile?.classImprovements)) profile.classImprovements.forEach(k => addCiTarget(k));
    if (Array.isArray(session?.classImprovements)) session.classImprovements.forEach(k => addCiTarget(k));
    for (const f of featList) {
      const fRule = typeof featRule === "function" ? featRule(typeof f === "string" ? f : f?.name) : null;
      if (fRule?.extraChoiceSpec?.kind === "classImprovement") {
        const picks = [
          ...(Array.isArray(f?.multiChoice) ? f.multiChoice : []),
          ...(f?.choice ? [f.choice] : [])
        ].filter(Boolean);
        const parentFeat = { kind: "feat", name: fRule.name };
        picks.forEach(k => addCiTarget(k, parentFeat));
      }
    }
    for (const [ciKey, ciRec] of ciTargets.entries()) {
      const ciPrereqMet = typeof checkImprovementPrerequisite === "function"
        ? checkImprovementPrerequisite(profile, session, ciRec).met
        : (profile?.level || 1) >= 3;
      if (ciPrereqMet && ciRec?.effects) {
        const ciParent = ciParents.get(ciKey) || (ciRec.className ? { kind: "class", name: ciRec.className } : null);
        _pushEffects(out, ciRec.effects, { kind: "classImprovement", name: ciRec.label || `${ciRec.className} Improvement`, detail: "Class Improvement", ...(ciParent ? { parent: ciParent } : {}) }, profile, session);
      }
    }
  }
  // 5b. Multiclass / Splashclass Improvements & Weapon Focus / Supremacy
  const mcNames = new Set([
    ...(Array.isArray(profile?.multiclassImprovements) ? profile.multiclassImprovements : []),
    ...(Array.isArray(session?.multiclassImprovements) ? session.multiclassImprovements : [])
  ]);
  const scNames = new Set([
    ...(Array.isArray(profile?.splashclassImprovements) ? profile.splashclassImprovements : []),
    ...(Array.isArray(session?.splashclassImprovements) ? session.splashclassImprovements : [])
  ]);
  const wfNames = new Set([
    ...(Array.isArray(profile?.weaponFocuses) ? profile.weaponFocuses : []),
    ...(Array.isArray(session?.weaponFocuses) ? session.weaponFocuses : [])
  ]);
  const wsNames = new Set([
    ...(Array.isArray(profile?.weaponSupremacies) ? profile.weaponSupremacies : []),
    ...(Array.isArray(session?.weaponSupremacies) ? session.weaponSupremacies : [])
  ]);
  const mcParents = new Map();
  const scParents = new Map();
  const wfParents = new Map();
  const wsParents = new Map();
  const combatOptParents = new Map();
  for (const f of featList) {
    const fn = normalizeName(typeof f === "string" ? f : f?.name);
    const ch = (typeof f === "object" && f) ? (f.choice || "") : "";
    const mChoices = (typeof f === "object" && Array.isArray(f?.multiChoice)) ? f.multiChoice.filter(Boolean) : [];
    const fRule = typeof featRule === "function" ? featRule(fn) : null;
    const fExtraKind = fRule?.extraChoiceSpec?.kind || "";
    const fck = typeof featChoiceKind === "function" ? featChoiceKind(fRule) : "";
    const pFeat = fRule ? { kind: "feat", name: fRule.name } : null;
    if (fExtraKind === "multiclassImprovements") {
      const picks = mChoices.length ? mChoices : (ch ? [ch] : []);
      picks.forEach(c => { mcNames.add(c); if (pFeat) mcParents.set(normalizeName(c), pFeat); });
    } else if (ch) {
      if (fck === "class") { scNames.add(ch); if (pFeat) scParents.set(normalizeName(ch), pFeat); }
      else if (fck === "weaponFocus") { wfNames.add(ch); if (pFeat) wfParents.set(normalizeName(ch), pFeat); }
      else if (fck === "weaponSupremacy") { wsNames.add(ch); if (pFeat) wsParents.set(normalizeName(ch), pFeat); }
      else if (["fightingStyle", "fightingMastery", "lightsaberForm", "maneuver"].includes(fck) && pFeat) {
        combatOptParents.set(fck + ":" + normalizeName(ch), pFeat);
      }
    }
    if (pFeat && mChoices.length && ["fightingStyle", "fightingMastery", "lightsaberForm", "maneuver"].includes(fck)) {
      mChoices.forEach(c => combatOptParents.set(fck + ":" + normalizeName(c), pFeat));
    }
  }
  if (typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined") {
    for (const nm of mcNames) {
      const rec = SW5E_MULTICLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === normalizeName(nm));
      const mcPrereqMet = !rec || typeof checkImprovementPrerequisite !== "function"
        ? true
        : checkImprovementPrerequisite(profile, session, rec, { collectedEffects: out }).met;
      const mcParent = mcParents.get(normalizeName(nm)) || mcParents.get(normalizeName(rec?.className || "")) || null;
      if (mcPrereqMet && rec?.effects) _pushEffects(out, rec.effects, { kind: "multiclassImprovement", name: `${rec.className || rec.name} Multiclass Improvement`, detail: "Multiclass Improvement", ...(mcParent ? { parent: mcParent } : {}) }, profile, session);
    }
  }
  if (typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined") {
    for (const nm of scNames) {
      const rec = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === normalizeName(nm));
      const scPrereqMet = !rec || typeof checkImprovementPrerequisite !== "function"
        ? true
        : checkImprovementPrerequisite(profile, session, rec, { collectedEffects: out }).met;
      const scParent = scParents.get(normalizeName(nm)) || scParents.get(normalizeName(rec?.className || "")) || null;
      if (scPrereqMet && rec?.effects) _pushEffects(out, rec.effects, { kind: "splashclassImprovement", name: `${rec.className || rec.name} Splashclass Improvement`, detail: "Splashclass Improvement", ...(scParent ? { parent: scParent } : {}) }, profile, session);
    }
  }
  if (typeof SW5E_WEAPON_FOCUSES !== "undefined") {
    for (const nm of wfNames) {
      const rec = typeof weaponFocusRule === "function"
        ? weaponFocusRule(nm, { allowBare: true })
        : SW5E_WEAPON_FOCUSES.find(x => normalizeName(x.name) === normalizeName(nm));
      const wfParent = wfParents.get(normalizeName(nm)) || wfParents.get(normalizeName(rec?.name || "")) || wfParents.get(normalizeName(rec?.group || "")) || null;
      if (rec?.effects) _pushEffects(out, rec.effects, { kind: "weaponFocus", name: rec.name, detail: "Weapon Focus", ...(wfParent ? { parent: wfParent } : {}) }, profile, session, { collectedEffects: out });
    }
  }
  if (typeof SW5E_WEAPON_SUPREMACIES !== "undefined") {
    for (const nm of wsNames) {
      const rec = typeof weaponSupremacyRule === "function"
        ? weaponSupremacyRule(nm, { allowBare: true })
        : SW5E_WEAPON_SUPREMACIES.find(x => normalizeName(x.name) === normalizeName(nm));
      const wsParent = wsParents.get(normalizeName(nm)) || wsParents.get(normalizeName(rec?.name || "")) || wsParents.get(normalizeName(rec?.group || "")) || null;
      if (rec?.effects) _pushEffects(out, rec.effects, { kind: "weaponSupremacy", name: rec.name, detail: "Weapon Supremacy", ...(wsParent ? { parent: wsParent } : {}) }, profile, session, { collectedEffects: out });
    }
  }

  // 6. Combat Options (Fighting Styles, Masteries, Lightsaber Forms, Maneuvers)
  if (typeof ownedCombatOptions === "function") {
    const co = ownedCombatOptions(profile, session);
    for (const [kind, list] of [
      ["fightingStyle", co?.styles || []],
      ["fightingMastery", co?.masteries || []],
      ["lightsaberForm", co?.forms || []],
      ["maneuver", (Array.isArray(session?.maneuvers) ? session.maneuvers : (profile?.maneuvers || [])).map(n => typeof maneuverRule === "function" ? maneuverRule(n) : null).filter(Boolean)]
    ]) {
      for (const item of list) {
        if (item?.effects) {
          const coParent = combatOptParents.get(kind + ":" + normalizeName(item.name)) || null;
          _pushEffects(out, item.effects, { kind, name: item.name, detail: kind, ...(coParent ? { parent: coParent } : {}) }, profile, session);
        }
      }
    }
  }

  // 7. Equipped Items & Weapon/Armor Properties
  if (Array.isArray(session?.equipped) && typeof itemRule === "function") {
    for (const eq of session.equipped) {
      if (eq.stored) continue;
      const { rule: r } = activeWeaponRule(eq);
      if (!r) continue;
      const itemSrc = { kind: "equipment", name: eq.name, itemId: eq.id, detail: r.category || "Equipment" };
      if (eq.equipped && r.effects) _pushEffects(out, r.effects, itemSrc, profile, session, { equipped: true, carried: true, item: eq, rule: r });
      const lookupProp = (list, name) => {
        if (!list) return null;
        if (Array.isArray(list)) return list.find(x => normalizeName(x.name) === normalizeName(name)) || null;
        return list[name] || null;
      };
      const weaponProperties = r.category === "Weapon" ? weaponPropertyProfile(r.properties) : null;
      for (const rawProp of r.properties || []) {
        const { parenthetical: parenVal, number: paramVal, name: pName } = parsePropertySpec(rawProp);
        const isArmorOrShield = r.category === "Armor" || r.armor === "Shield";
        const propRec = isArmorOrShield
          ? (lookupProp(typeof SW5E_ARMOR_PROPERTIES !== "undefined" ? SW5E_ARMOR_PROPERTIES : null, pName)
             || lookupProp(typeof SW5E_WEAPON_PROPERTIES !== "undefined" ? SW5E_WEAPON_PROPERTIES : null, pName))
          : (lookupProp(typeof SW5E_WEAPON_PROPERTIES !== "undefined" ? SW5E_WEAPON_PROPERTIES : null, pName)
             || lookupProp(typeof SW5E_ARMOR_PROPERTIES !== "undefined" ? SW5E_ARMOR_PROPERTIES : null, pName));
        const effects = eq.equipped ? propRec?.effects : propRec?.effects?.filter(effect => effect.when?.carried);
        if (effects?.length) {
          const pNorm = normalizeName(pName);
          const isIlluminationProp = propRec.effects?.some(e => e.type === "weaponRule" && e.kind === "illumination");
          if (isIlluminationProp && weaponProperties?.light?.suppress) continue;
          // Bulky on Medium armor is suppressed by structured ignoreBulkyMediumArmor or unlocked Medium armorExpertProgressive mastery
          if (isArmorOrShield && pNorm === "bulky" && r.armor === "Medium") {
            let suppressBulky = out.some(ef => ef.type === "combatTrait" && ef.kind === "ignoreBulkyMediumArmor");
            if (!suppressBulky) {
              const progCount = out.filter(ef => ef.type === "combatTrait" && ef.kind === "armorExpertProgressive").length;
              if (progCount > 0) {
                const baseProfs = new Set();
                const clsArmorList = typeof characterClasses === "function"
                  ? characterClasses(profile, session).flatMap(en => en.isStarting ? (en.record?.armorProficiencies || []) : (en.record?.multiclassProficiencies || []))
                  : (typeof classRecord === "function" ? (classRecord(profile?.className)?.armorProficiencies || []) : []);
                for (const ap of [...clsArmorList, ...(profile?.armorProficiencies || [])]) {
                  if (/all armor/i.test(ap)) { baseProfs.add("Light"); baseProfs.add("Medium"); baseProfs.add("Heavy"); }
                  else if (/light/i.test(ap)) baseProfs.add("Light");
                  else if (/medium/i.test(ap)) baseProfs.add("Medium");
                  else if (/heavy/i.test(ap)) baseProfs.add("Heavy");
                }
                for (const ef of out) {
                  if (ef.type === "proficiency" && ef.kind === "armor" && ef.target) {
                    if (/all/i.test(ef.target)) { baseProfs.add("Light"); baseProfs.add("Medium"); baseProfs.add("Heavy"); }
                    else if (/light/i.test(ef.target)) baseProfs.add("Light");
                    else if (/medium/i.test(ef.target)) baseProfs.add("Medium");
                    else if (/heavy/i.test(ef.target)) baseProfs.add("Heavy");
                  }
                }
                for (let pi = 0; pi < progCount; pi++) {
                  const hadLight = baseProfs.has("Light");
                  const hadMed = baseProfs.has("Medium");
                  if (!hadLight) baseProfs.add("Light");
                  if (hadLight) {
                    if (!hadMed) baseProfs.add("Medium");
                    else suppressBulky = true;
                  }
                }
              }
            }
            if (suppressBulky) continue;
          }
          // Structured armor-only vs shield-only gating from catalog metadata
          if (isArmorOrShield && propRec.appliesTo === "armor" && r.armor === "Shield") continue;
          if (isArmorOrShield && propRec.appliesTo === "shield" && r.armor !== "Shield") continue;
          const effParam = (paramVal !== null && Number.isFinite(paramVal))
            ? paramVal
            : (propRec.defaultParam !== undefined ? propRec.defaultParam : paramVal);
          const effParen = parenVal || propRec.defaultParen || "";
          const propSrc = { kind: "property", propertyKind: isArmorOrShield ? "armorProperty" : "weaponProperty", name: propRec.name, detail: eq.name + " (" + rawProp + ")", rawProperty: rawProp, itemName: eq.name, itemId: eq.id, parent: { kind: "equipment", name: eq.name, itemId: eq.id } };
          const propCtx = { equipped: Boolean(eq.equipped), carried: true, item: eq, rule: r, rawProperty: rawProp };
          if (isArmorOrShield && propRec.suitEffects) {
            const suitList = parenVal ? parenVal.split(/[,;/]+/).map(s => s.trim()).filter(Boolean) : [];
            const impEffs = [];
            for (const suitRaw of suitList) {
              const sn = normalizeName(suitRaw);
              for (const [suitKey, suitArr] of Object.entries(propRec.suitEffects)) {
                if (sn.includes(suitKey)) {
                  for (const se of suitArr) impEffs.push({ ...se });
                  break;
                }
              }
            }
            const noteText = suitList.length
              ? `Includes ${effParam} environmental suit function(s) (${suitList.join(", ")}) plus 4 hours oxygen capacity.`
              : `Includes ${effParam} GM-chosen environmental suit function(s) plus 4 hours oxygen capacity.`;
            impEffs.push({ type: "contextualNote", surface: "defenses", title: "Impermeable Environmental Suit", text: noteText });
            _pushEffects(out, impEffs, propSrc, profile, session, propCtx);
          } else {
            const resolvedEffects = effects
              .map(effect => resolvePropertyTokens(effect, effParam, effParen));
            if (isArmorOrShield && pNorm === "lambent" && eq.lambentActive) {
              resolvedEffects.push(
                { type: "conditionalCheckMod", skills: ["Stealth"], mode: "disadvantage", condition: "relying on sight while shield light is active" },
                { type: "contextualNote", surface: "defenses", title: "Lambent Light Active", text: "Sheds bright light in a 5-foot radius and dim light for an additional 5 feet." }
              );
            }
            _pushEffects(out, resolvedEffects, propSrc, profile, session, propCtx);
          }
        }
      }
    }
  }

  // 8. Active Effects (manual/cast ongoing powers)
  const expandedPowers = new Set();
  if (Array.isArray(session?.effects) && typeof powerRule === "function") {
    for (const e of session.effects) {
      const p = powerRule(e.name);
      const rawEffs = Array.isArray(p?.activeEffects) ? p.activeEffects : (Array.isArray(p?.effects) ? p.effects : null);
      if (rawEffs) {
        const isStandby = Boolean((e.perTurnCharges || p?.effects?.charges?.perTurn) && e.surgeActive === false);
        const pEffs = isStandby
          ? rawEffs.filter(x => x && (x.type === "actionGrant" || x.type === "resourcePool"))
          : rawEffs;
        expandedPowers.add(normalizeName(p.name));
        _pushEffects(
          out,
          pEffs,
          { kind: "activePower", name: p.name, detail: e.choice ? `Active power (${e.choice})` : "Active power" },
          profile,
          session,
          { choice: e.choice || "", choices: Array.isArray(e.choices) ? e.choices : [] }
        );
      }
    }
  }

  // 9. Optional runtime test/character extra effects (supports A/B testing & custom features)
  if (Array.isArray(profile.extraEffects)) {
    _pushEffects(out, profile.extraEffects, { kind: "custom", name: "Custom Effect", detail: "Custom" }, profile, session);
  }
  if (Array.isArray(session?.extraEffects)) {
    _pushEffects(out, session.extraEffects, { kind: "custom", name: "Session Effect", detail: "Custom" }, profile, session);
  }

  // 10. Pass 2: Expand `innateActiveEffect` powers automatically (without concentration or points)
  const innateEffects = out.filter(e => e.type === "innateActiveEffect" && e.power);
  if (innateEffects.length && typeof powerRule === "function") {
    for (const ie of innateEffects) {
      const key = normalizeName(ie.power);
      if (!key || expandedPowers.has(key)) continue;
      expandedPowers.add(key);
      const p = powerRule(ie.power);
      const pEffs = Array.isArray(p?.activeEffects) ? p.activeEffects : (Array.isArray(p?.effects) ? p.effects : null);
      if (pEffs) {
        _pushEffects(
          out,
          pEffs,
          { kind: "innatePower", name: p.name, detail: `Innate (${ie.source?.name || "Trait"})`, ...(ie.source ? { parent: ie.source } : {}) },
          profile,
          session
        );
      }
    }
  }

  return out;
}

function resolveInnateActiveEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const seen = new Set();
  const list = [];
  for (const e of all) {
    if (e.type !== "innateActiveEffect" || !e.power) continue;
    const key = normalizeName(e.power);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      name: e.power,
      innate: true,
      permanent: e.permanent !== false, noConcentration: Boolean(e.noConcentration),
      concentration: false,
      source: e.source
    });
  }
  return list;
}

function resolveGrantedPowers(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const byName = new Map();
  const force = [];
  const tech = [];
  const nonCountingSet = new Set();

  for (const e of all) {
    if (e.type !== "grantPower" || !e.power) continue;
    const key = normalizeName(e.power);
    if (!key) continue;
    const rule = typeof powerRule === "function" ? powerRule(e.power) : null;
    const pType = e.powerType
      ? (String(e.powerType).toLowerCase() === "tech" ? "Tech" : "Force")
      : (rule?.type || "Force");
    const countsAgainstKnown = e.countsAgainstKnown === true;
    if (!countsAgainstKnown) nonCountingSet.add(key);

    if (!byName.has(key)) {
      const entry = {
        name: rule?.name || e.power,
        type: pType,
        countsAgainstKnown,
        castingAbility: e.castingAbility || "",
        atWill: Boolean(e.atWill),
        freeCasts: e.freeCasts || 0,
        recharge: e.recharge || "",
        sources: [e.source]
      };
      byName.set(key, entry);
      if (pType === "Tech") tech.push(entry);
      else force.push(entry);
    } else {
      const existing = byName.get(key);
      if (!countsAgainstKnown) existing.countsAgainstKnown = false;
      if (e.atWill) existing.atWill = true;
      existing.sources.push(e.source);
    }
  }

  return { force, tech, all: [...force, ...tech], nonCountingSet, byName };
}

function resolveAbilityEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const bonuses = {};
  const floors = {};
  const caps = {};
  let scholarRancorAb = "";
  const _schOverride = all.find(e => e.type === "combatTrait" && e.kind === "scholarAbilityOverride" && e.ability);
  if (_schOverride) {
    const normAb = normalizeName(_schOverride.ability);
    if (normAb === "wisdom") scholarRancorAb = "Wisdom";
    else if (normAb === "charisma") scholarRancorAb = "Charisma";
  }
  const mapAb = (e, ab) => (scholarRancorAb && ab === "Intelligence" && e.source?.kind === "class" && normalizeName(e.source?.name) === "scholar")
    ? scholarRancorAb : ab;
  for (const e of all) {
    if (e.type === "abilityBonus" && e.ability && Number.isFinite(e.value)) {
      const ab = mapAb(e, e.ability);
      bonuses[ab] = (bonuses[ab] || 0) + e.value;
    } else if (e.type === "abilityFloor" && e.ability && Number.isFinite(e.floor)) {
      const ab = mapAb(e, e.ability);
      floors[ab] = Math.max(floors[ab] || 0, e.floor);
    } else if (e.type === "abilityCapRaise" && Number.isFinite(e.cap)) {
      const targets = e.ability === "all" ? abilities : [mapAb(e, e.ability)];
      for (const ab of targets) {
        caps[ab] = Math.max(caps[ab] || 20, e.cap);
      }
    }
  }
  return { bonuses, floors, caps };
}

function resolveSkillEffects(profile, session, skillName, defaultAbility, conditions = null) {
  const all = collectCharacterEffects(profile, session);
  const scores = effectiveScores(profile, session);
  const modOf = ab => (conditions && typeof effectiveModifier === "function")
    ? effectiveModifier(profile, session, ab, conditions)
    : modifier(scores[ab]);

  let effectiveAbility = defaultAbility;
  let overrideSource = "";
  let bestMod = modOf(defaultAbility);
  let forced = false;

  const advantage = [];
  const disadvantage = [];
  const conditional = [];
  const localConditional = [];
  let bonus = 0;
  let passiveBonus = 0;
  let rollFloor = 0;
  let rollFloorSource = "";
  let totalFloor = 0;
  let totalFloorSource = "";
  let profRank = 0;
  let halfProficiency = false;

  const _ignoreObtrusive = all.some(x => x.type === "combatTrait" && x.kind === "ignoreObtrusiveShield");
  for (const e of all) {
    const srcLabel = e.source?.name || "Effect";
    if (_ignoreObtrusive && e.suppressibleBy === "ignoreObtrusiveShield") continue;
    if (e.type === "skillAbilityOverride" && normalizeName(e.skill) === normalizeName(skillName) && e.ability) {
      const targetAb = e.ability === "$caAbility"
        ? (typeof scholarCriticalAnalysisAbility === "function" ? scholarCriticalAnalysisAbility(profile, session) : "Intelligence")
        : e.ability;
      const altMod = modOf(targetAb);
      if (e.mode === "replace") {
        effectiveAbility = targetAb;
        overrideSource = srcLabel;
        bestMod = altMod;
        forced = true;
      } else if (!forced && altMod > bestMod) {
        effectiveAbility = targetAb;
        overrideSource = srcLabel;
        bestMod = altMod;
      }
    } else if (e.type === "conditionalCheckMod") {
      const matchesSkill = e.skills === "all" || (Array.isArray(e.skills) && e.skills.some(s => normalizeName(s) === normalizeName(skillName)));
      const matchesAb = !e.skills && e.ability && normalizeName(e.ability) === normalizeName(defaultAbility);
      if (!matchesSkill && !matchesAb) continue;
      if (!e.condition) {
        if (e.mode === "advantage") advantage.push(srcLabel);
        else if (e.mode === "disadvantage") disadvantage.push(srcLabel);
        else if (e.mode === "bonus") {
          if (Number.isFinite(e.value)) bonus += e.value;
          else if (e.bonusFormula === "halfForceMod") bonus += Math.max(1, Math.floor(Math.max(modOf("Wisdom"), modOf("Charisma")) / 2));
          else if (e.bonusFormula === "wisChaMod") bonus += Math.max(1, modOf("Wisdom"), modOf("Charisma"));
        }
      } else {
        let bonusVal = e.value || 0;
        if (e.mode === "bonus" && (e.valueFormula === "halfForceMod" || e.bonusFormula === "halfForceMod")) {
          bonusVal = Math.max(1, Math.floor(Math.max(modOf("Wisdom"), modOf("Charisma")) / 2));
        } else if (e.mode === "bonus" && (e.valueFormula === "wisChaMod" || e.bonusFormula === "wisChaMod")) {
          bonusVal = Math.max(1, modOf("Wisdom"), modOf("Charisma"));
        }
        let dieVal = (e.mode === "die" && e.value) ? String(e.value) : "";
        let condText = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(String(e.condition), profile, session) : String(e.condition);
        if (dieVal.includes("{supDie}") || condText.includes("{supDie}")) {
          const lvl = profile?.level || 1;
          const step = typeof classLevelStep === "function" ? (classLevelStep(profile) || {}) : {};
          const archStep = typeof archetypeLevelStep === "function" ? (archetypeLevelStep(profile, session) || {}) : {};
          const archSup = typeof archetypeMechanics === "function" ? (archetypeMechanics(profile, session)?.superiority || null) : null;
          let grantDie = "";
          for (const ef of all) {
            if (ef.type === "combatOptionGrant" && typeof ef.dieScaling === "string" && ef.dieScaling.includes("/")) {
              let picked = "d4";
              for (const seg of ef.dieScaling.split("/")) {
                const [tok, atL] = seg.split("@");
                if (!atL || lvl >= Number(atL)) picked = tok.trim();
              }
              grantDie = picked;
            }
          }
          const scaled = lvl >= 17 ? "d12" : lvl >= 13 ? "d10" : lvl >= 9 ? "d8" : lvl >= 5 ? "d6" : "d4";
          let sDie = step["Superiority Dice Size"] || archStep["Superiority Dice Size"] || grantDie || scaled;
          if (archSup?.dieStepUp && lvl >= (archSup.dieStepUpLevel || 3)) {
            const steps = ["d4", "d6", "d8", "d10", "d12"];
            const si = steps.indexOf(sDie);
            if (si >= 0 && si < steps.length - 1) sDie = steps[si + 1];
          }
          dieVal = dieVal.replaceAll("{supDie}", sDie);
          condText = condText.replaceAll("{supDie}", sDie);
        }
        const prefix = e.mode === "advantage" ? "Advantage"
          : e.mode === "disadvantage" ? "Disadvantage"
          : e.mode === "expertise" ? "Expertise"
          : e.mode === "noDisadvantage" ? "No disadvantage"
          : e.mode === "bonus" ? signed(bonusVal)
          : (dieVal ? `+${dieVal}` : "Modifier");
        const _isBroadSkill = isBroadSkillEffect(e);
        if (!mergePropertyModifier(conditional, prefix + ": " + condText, e, all)) {
          const msg = prefix + ": " + condText + " (" + srcLabel + ")";
          conditional.push(msg);
          if (!_isBroadSkill) localConditional.push(msg);
        } else if (!_isBroadSkill) {
          mergePropertyModifier(localConditional, prefix + ": " + condText, e, all);
        }
      }
    } else if (e.type === "proficiency" && e.kind === "skill") {
      if (e.when?.ability && normalizeName(e.when.ability) !== normalizeName(defaultAbility)) continue;
      if (e.target === "all" || normalizeName(e.target) === normalizeName(skillName)) {
        if (e.rank === 0.5) halfProficiency = true;
        else if (Number.isFinite(e.rank)) profRank = Math.max(profRank, e.rank);
      }
    } else if (e.type === "rollFloor" && (e.scope === "skill" || e.scope === "d20")) {
      if (e.ability && normalizeName(e.ability) !== normalizeName(defaultAbility)) continue;
      if (Array.isArray(e.skills) && e.skills.length && !e.skills.some(sk => normalizeName(sk) === normalizeName(skillName))) continue;
      if (Number.isFinite(e.minRoll) && !e.condition) {
        if (!e.filter || normalizeName(e.filter) === normalizeName(skillName)) {
          const profOk = !e.requiresProficiency || (typeof effectiveTraining === "function" ? (effectiveTraining(profile, session)?.[skillName] >= 1) : true);
          if (profOk && e.minRoll > rollFloor) {
            rollFloor = e.minRoll;
            rollFloorSource = (e.source?.kind === "class" && e.requiresProficiency) ? "Reliable Talent" : srcLabel;
          }
        }
      } else if (e.condition) {
        const condTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.condition, profile, session) : e.condition;
        const msg = `${condTxt} (${srcLabel})`;
        conditional.push(msg);
        if (!isBroadSkillEffect(e)) localConditional.push(msg);
      }
    } else if (e.type === "rollFloor" && normalizeName(e.scope) === "strength check" && normalizeName(defaultAbility) === "strength") {
      const floorVal = normalizeName(e.minRoll) === "strength score" ? Number(scores.Strength || 10) : Number(e.minRoll);
      if (Number.isFinite(floorVal) && floorVal > totalFloor) {
        totalFloor = floorVal;
        totalFloorSource = srcLabel === "Berserker" ? "Indomitable Might" : srcLabel;
      }
    } else if (e.type === "rerollRule" && (e.scope === "skill" || e.scope === "d20")) {
      const abMatches = !Array.isArray(e.abilities) || !e.abilities.length
        || e.abilities.some(a => normalizeName(a) === normalizeName(defaultAbility) || normalizeName(a) === normalizeName(effectiveAbility));
      const skMatches = !Array.isArray(e.skills) || !e.skills.length
        || e.skills.some(s => normalizeName(s) === normalizeName(skillName));
      if (abMatches && skMatches) {
        const parts = [e.trigger, e.condition].filter(Boolean).join(": ");
        const msg = `${srcLabel}: ${parts || "reroll ability check"}`;
        conditional.push(msg);
        if (!isBroadSkillEffect(e)) localConditional.push(msg);
      }
    } else if (e.type === "passiveMod" && normalizeName(e.skill) === normalizeName(skillName) && Number.isFinite(e.bonus)) {
      passiveBonus += e.bonus;
    } else if (e.type === "contextualNote" && e.surface === "skills") {
      if (Array.isArray(e.skills) && e.skills.length && e.skills.some(s => normalizeName(s) === normalizeName(skillName))) {
        const txt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.text, profile, session) : e.text;
        const sameTitle = e.title && normalizeName(e.title) === normalizeName(srcLabel);
        const msg = sameTitle ? `${e.title}: ${txt}` : `${e.title ? e.title + ": " : ""}${txt} (${srcLabel})`;
        conditional.push(msg);
        if (!isBroadSkillEffect(e)) localConditional.push(msg);
      }
    }
  }

  return {
    effectiveAbility,
    overrideSource,
    bonus,
    advantage,
    disadvantage,
    conditional,
    localConditional,
    rollFloor,
    rollFloorSource,
    totalFloor,
    totalFloorSource,
    passiveBonus,
    profRank,
    halfProficiency
  };
}

function mergePropertyModifier(conditional, text, effect, all, suffix = "") {
  if (!effect.groupPropertySources || effect.source?.kind !== "property" || !effect.source.itemName) return false;
  const names = all.filter(other => other.type === effect.type && other.source?.kind === "property" &&
    other.source.name === effect.source.name && other.mode === effect.mode && other.condition === effect.condition &&
    other.value === effect.value).map(other => other.source.itemName).filter(Boolean);
  const message = text + " (" + [...new Set(names)].join(", ") + " · " + effect.source.name + ")" + suffix;
  if (!conditional.includes(message)) conditional.push(message);
  return true;
}

function resolveSaveEffects(profile, session, ability) {
  const all = collectCharacterEffects(profile, session);
  let bonus = 0;
  const advantage = [];
  const disadvantage = [];
  const conditional = [];
  const localConditional = [];
  let rollFloor = 0;
  let rollFloorSource = "";
  let concentrationAdv = false;
  let concentrationBonus = 0;
  let halfPositiveMod = false;

  for (const e of all) {
    const srcLabel = e.source?.name || "Effect";
    if (e.type === "saveMod") {
      const matches = e.abilities === "all" || (Array.isArray(e.abilities) && e.abilities.some(a => normalizeName(a) === normalizeName(ability) || normalizeName(a) === "all"));
      if (!matches) continue;
      if (e.shieldAcBonus) {
        const sh = typeof equippedRule === "function" ? equippedRule(session, "shield") : null;
        const cSt = typeof conditionState === "function" ? conditionState(session, profile) : null;
        if (sh && !(cSt && cSt.incapacitated)) {
          const msg = `${srcLabel}: +${Number(sh.ac) || 0} shield bonus to ${ability} saves vs powers and harmful effects.`;
          conditional.push(msg);
          localConditional.push(msg);
        }
        continue;
      }
      if (!e.condition) {
        if (e.mode === "advantage") advantage.push(srcLabel);
        else if (e.mode === "disadvantage") disadvantage.push(srcLabel);
        else if (e.mode === "bonus" && Number.isFinite(e.value)) bonus += e.value;
        else if (e.mode === "abilityAdd" && e.ability) {
          const scSave = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile?.scores || {});
          const rawAbMod = typeof modifier === "function" ? modifier(scSave[e.ability] || 10) : Math.floor(((scSave[e.ability] || 10) - 10) / 2);
          const minV = Number.isFinite(e.minValue) ? e.minValue : 0;
          const addV = Math.max(minV, rawAbMod);
          if (addV !== 0) bonus += addV;
        }
      } else {
        const diePrefix = (e.mode === "die" && e.value)
          ? ("+" + (typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(String(e.value), profile, session) : String(e.value)))
          : "";
        if (e.mode === "halfPositiveMod") {
          halfPositiveMod = true;
          const msg = `Half positive ${ability} modifier (rounded down) on ${ability} saves (${srcLabel}).`;
          conditional.push(msg);
          localConditional.push(msg);
          continue;
        }
        const prefix = e.mode === "advantage" ? "Advantage"
          : e.mode === "disadvantage" ? "Disadvantage"
          : e.mode === "swap" ? "Substitute"
          : (diePrefix || (Number.isFinite(e.value) ? signed(e.value) : "Modifier"));
        const chosenType = session?.combatOptionChoices?.[srcLabel]?.[0] || "chosen-type";
        let condTxt = String(e.condition || "").replaceAll("{choice}", chosenType);
        if (typeof interpolateRuleTokens === "function") condTxt = interpolateRuleTokens(condTxt, profile, session);
        const hasParen = /\([^)]+\)\s*$/.test(condTxt);
        const _isBroadSave = isBroadSaveEffect(e);
        if (!mergePropertyModifier(conditional, prefix + " on " + ability + " saves: " + condTxt, e, all, ".")) {
          const msg = prefix + " on " + ability + " saves: " + condTxt + (hasParen ? "" : " (" + srcLabel + ")") + ".";
          conditional.push(msg);
          if (!_isBroadSave) localConditional.push(msg);
        } else if (!_isBroadSave) {
          mergePropertyModifier(localConditional, prefix + " on " + ability + " saves: " + condTxt, e, all, ".");
        }
      }
    } else if (e.type === "concentrationMod" && normalizeName(ability) === "constitution") {
      if (e.advantage) {
        concentrationAdv = true;
        const msg = `Advantage on Constitution saves to maintain concentration (${srcLabel}).`;
        conditional.push(msg);
        localConditional.push(msg);
      }
      if (Number.isFinite(e.bonus)) concentrationBonus += e.bonus;
      if (e.note) {
        const noteTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.note, profile, session) : e.note;
        const msg = `${noteTxt} (${srcLabel}).`;
        conditional.push(msg);
        localConditional.push(msg);
      }
    } else if (e.type === "contextualNote" && e.surface === "saves") {
      if (Array.isArray(e.abilities) && !e.abilities.some(a => normalizeName(a) === normalizeName(ability))) continue;
      const rawTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.text, profile, session) : e.text;
      const cleanTxt = String(rawTxt || "").replace(/\.+\s*$/, "");
      const titleHasSrc = Boolean(e.title && normalizeName(e.title).startsWith(normalizeName(srcLabel)));
      const msg = titleHasSrc ? `${e.title}: ${cleanTxt}.` : `${e.title ? e.title + ": " : ""}${cleanTxt} (${srcLabel}).`;
      conditional.push(msg);
      if (!isBroadSaveEffect(e)) localConditional.push(msg);
    } else if (e.type === "rollFloor" && (e.scope === "save" || e.scope === "d20") && Number.isFinite(e.minRoll) && e.minRoll > 0) {
      if (Array.isArray(e.abilities) && e.abilities.length && !e.abilities.some(a => normalizeName(a) === normalizeName(ability))) continue;
      if (!e.condition) {
        if (e.minRoll > rollFloor) {
          rollFloor = e.minRoll;
          rollFloorSource = srcLabel;
        }
      } else {
        const condTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.condition, profile, session) : e.condition;
        const msg = `Treat d20 rolls below ${e.minRoll} as ${e.minRoll} on ${condTxt} (${srcLabel}).`;
        conditional.push(msg);
        if (!isBroadSaveEffect(e)) localConditional.push(msg);
      }
    } else if (e.type === "rerollRule" && (e.scope === "save" || e.scope === "d20")) {
      if (Array.isArray(e.abilities) && e.abilities.length && !e.abilities.some(a => normalizeName(a) === normalizeName(ability))) continue;
      const lbl = (e.source?.kind === "class" && normalizeName(srcLabel) === "monk") ? "Diamond Soul" : srcLabel;
      const parts = [e.trigger, e.condition].filter(Boolean).join(": ");
      const msg = `${lbl}: ${parts || "reroll failed saving throw"}.`;
      conditional.push(msg);
      if (!isBroadSaveEffect(e)) localConditional.push(msg);
    }
  }

  return { bonus, advantage, disadvantage, conditional, localConditional, rollFloor, rollFloorSource, concentrationAdv, concentrationBonus, halfPositiveMod };
}

function resolveDefenseEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const resistances = [];
  const immunities = [];
  const vulnerabilities = [];
  const damageReductions = [];
  const conditionImmunities = [];
  const senses = [];
  const speeds = [];
  const acFormulas = [];
  const acBonuses = [];
  const combatTraits = [];
  const biologyRules = [];
  let carryMultiplier = 1;
  const weightMultipliers = [];

  for (const e of all) {
    const srcLabel = e.source?.name || "Effect";
    if (e.type === "defense" && e.damageType) {
      const defCond = (e.condition && typeof interpolateRuleTokens === "function") ? interpolateRuleTokens(e.condition, profile, session) : (e.condition || "");
      if (e.kind === "resistance") resistances.push({ damageType: e.damageType, condition: defCond, source: srcLabel, sourceObj: e.source || null });
      else if (e.kind === "immunity") immunities.push({ damageType: e.damageType, condition: defCond, source: srcLabel, sourceObj: e.source || null });
      else if (e.kind === "vulnerability") vulnerabilities.push({ damageType: e.damageType, condition: defCond, source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "damageReduction") {
      damageReductions.push({ ...e, source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "conditionImmunity" && e.condition) {
      conditionImmunities.push({ condition: e.condition, mode: e.mode || "immune", source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "sense" && e.kind) {
      senses.push({ kind: e.kind, range: e.range || 0, rangePerProf: e.rangePerProf || 0, extendRange: e.extendRange || 0, extend: Boolean(e.extend), note: e.note || "", source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "speed") {
      speeds.push({ ...e, source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "acFormula") {
      acFormulas.push({ ...e, source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "acBonus" && (Number.isFinite(e.value) || e.formula === "halfForceMod" || e.valueFromEffect)) {
      let val = e.value;
      if (!Number.isFinite(val) && e.valueFromEffect && session) {
        const effKey = normalizeName(e.valueFromEffect);
        const match = (session.effects || []).find(ef => normalizeName(ef.name) === effKey);
        if (match && !acBonuses.some(ab => ab._effectKey === effKey)) {
          val = Math.max(1, Number(match.value) || 1);
          acBonuses.push({ value: val, condition: e.condition || "", source: e.label || srcLabel, sourceObj: e.source || null, _effectKey: effKey });
        }
        continue;
      }
      if (!Number.isFinite(val) && e.formula === "halfForceMod" && typeof effectiveScores === "function" && typeof modifier === "function") {
        const sc = effectiveScores(profile, session);
        val = Math.max(1, Math.floor(Math.max(modifier(sc.Wisdom), modifier(sc.Charisma)) / 2));
      }
      if (Number.isFinite(val)) acBonuses.push({ value: val, condition: e.condition || "", source: e.label || srcLabel, sourceObj: e.source || null });
    } else if (e.type === "combatTrait") {
      combatTraits.push({ ...e, source: srcLabel, sourceObj: e.source || null });
    } else if (e.type === "biologyRule") {
      biologyRules.push({ ...e, source: srcLabel });
    } else if (e.type === "sizeMod" && Number.isFinite(e.carryMultiplier)) {
      if (e.carryMultiplier === 2) carryMultiplier = carryMultiplier >= 2 ? 3 : 2;
      else carryMultiplier *= e.carryMultiplier;
    } else if (e.type === "weightMultiplier" && Number.isFinite(e.multiplier)) {
      weightMultipliers.push({ target: e.target || "selfItem", multiplier: e.multiplier, itemName: e.source?.itemName || "", source: srcLabel });
    }
  }

  const hasTinyTerror = combatTraits.some(ct => ct.kind === "tinyTerror");
  const removesUndersized = combatTraits.some(ct => ct.kind === "removeUndersized");
  const removesTechImpaired = combatTraits.some(ct => ct.kind === "removeTechImpaired");
  let filteredCombatTraits = hasTinyTerror
    ? combatTraits.filter(ct => ct.kind !== "pintsized" && ct.kind !== "puny")
    : [...combatTraits];
  if (hasTinyTerror && !removesUndersized && !filteredCombatTraits.some(ct => ct.kind === "undersized")) {
    filteredCombatTraits.push({
      type: "combatTrait",
      kind: "undersized",
      note: "Undersized: no heavy shields or non-light two-handed martial weapons; versatile martial weapons require two hands",
      source: "Tiny Terror"
    });
  }
  if (removesUndersized) {
    filteredCombatTraits = filteredCombatTraits.filter(ct => ct.kind !== "undersized");
  }
  const filteredBiologyRules = removesTechImpaired
    ? biologyRules.filter(br => br.kind !== "techImpaired")
    : biologyRules;
  return {
    resistances, immunities, vulnerabilities, damageReductions, conditionImmunities,
    senses, speeds, acFormulas, acBonuses, combatTraits: filteredCombatTraits, biologyRules: filteredBiologyRules,
    carryMultiplier, weightMultipliers
  };
}

function resolveResourceEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const pools = [];
  const multiclassScales = [];
  const actionGrants = [];
  const actionUpgrades = [];
  const pointPoolMods = [];
  for (const e of all) {
    if (e.type === "resourcePool") pools.push(e);
    else if (e.type === "multiclassScale") multiclassScales.push(e);
    else if (e.type === "actionGrant") actionGrants.push(e);
    else if (e.type === "actionUpgrade") actionUpgrades.push(e);
    else if (e.type === "pointPoolMod") pointPoolMods.push(e);
  }
  return { pools, multiclassScales, actionGrants, actionUpgrades, pointPoolMods };
}

// ============================================================================
// Step 0B Full Resolver Coverage & Surface / Primitive Registry
// ============================================================================

const VALID_CONTEXTUAL_SURFACES = Object.freeze([
  "skills", "saves", "attacks",
  "combat.action", "combat.bonus", "combat.reaction", "combat.special",
  "defenses", "rests", "casting"
]);

const SUPPORTED_PRIMITIVE_TYPES = Object.freeze([
  // A. Power & Casting
  "grantPower", "innateActiveEffect", "castingMod", "castingModifier", "pointPoolMod", "concentrationMod", "castingRestriction",
  // B. Ability, Skill, Save & Passive
  "abilityBonus", "abilityFloor", "abilityCapRaise", "proficiency", "skillAbilityOverride",
  "conditionalCheckMod", "saveMod", "rollFloor", "rerollRule", "passiveMod",
  // C. Defense, HP, Movement, Sense & Body
  "acFormula", "acBonus", "hpMod", "zeroHpStopper", "speed", "sense", "defense", "damageReduction",
  "conditionImmunity", "combatTrait", "sizeMod", "weightMultiplier", "biologyRule",
  // D. Combat, Weapon, Armor & Action
  "initiativeMod", "attackDamageMod", "critMod", "weaponRule", "actionGrant", "actionUpgrade",
  // E. Resources, Progression & Companions
  "resourcePool", "multiclassScale", "combatOptionGrant", "attunementMod", "companionGrant",
  // F. Contextual Surface
  "contextualNote"
]);

function resolveZeroHpStoppers(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const rawStoppers = all.filter(e => e.type === "zeroHpStopper");
  if (!rawStoppers.length) return { all: [], ready: [], readyAuto: [], readyPrompt: [] };
  const hasScores = Boolean(profile && profile.scores);
  const resList = (session && hasScores && typeof characterResources === "function") ? characterResources(profile, session) : [];
  const resById = new Map(resList.map(r => [r.id, r]));
  const cast = (session && hasScores && typeof castingStats === "function") ? castingStats(profile, session) : null;
  const spent = session?.spent || {};
  const effs = Array.isArray(session?.effects) ? session.effects : [];
  const out = [];
  const seen = new Set();

  for (const e of all) {
    if (e.type !== "zeroHpStopper") continue;
    const srcName = e.source?.name || e.name || "Feature";
    const name = e.name || srcName;
    const key = normalizeName(name) + "|" + (e.resourceId || "") + "|" + (e.consumeEffect || "") + "|" + (e.pointPool || "");
    if (seen.has(key)) continue;
    seen.add(key);

    let ready = true;
    let remaining = null;
    let maxUses = null;
    let availablePoints = null;
    let currentSaveDC = null;

    if (e.resourceId) {
      const r = resById.get(e.resourceId);
      maxUses = r ? Math.max(0, Number(r.max) || 0) : 1;
      const used = Math.max(0, Number(spent[e.resourceId]) || 0);
      remaining = Math.max(0, maxUses - used);
      ready = remaining > 0;
    } else if (e.consumeEffect) {
      ready = effs.some(ef => normalizeName(ef.name) === normalizeName(e.consumeEffect));
    } else if (e.pointPool) {
      if (e.pointPool === "force") {
        const maxP = Math.max(0, Number(cast?.forceMax) || 0);
        availablePoints = Math.max(0, maxP - (Number(spent.forcePoints) || 0));
      } else if (e.pointPool === "tech") {
        const maxP = Math.max(0, Number(cast?.techMax) || 0);
        availablePoints = Math.max(0, maxP - (Number(spent.techPoints) || 0));
      } else if (e.pointPool === "focus") {
        const fpRes = resById.get("focus") || resById.get("focusPoints");
        const monkLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Monk") : (normalizeName(profile?.className) === "monk" ? (Number(profile?.level) || 0) : 0);
        const maxP = fpRes ? Math.max(0, Number(fpRes.max) || 0) : (monkLvl >= 2 ? monkLvl : 0);
        const usedP = fpRes ? (Number(spent[fpRes.id]) || 0) : (Number(spent.focus) || 0);
        availablePoints = Math.max(0, maxP - usedP);
      } else {
        availablePoints = 0;
      }
      const need = e.pointCost === "all" ? 1 : Math.max(1, Number(e.pointCost) || 1);
      ready = availablePoints >= need;
    }

    if (e.saveDCBase) {
      const uses = e.saveCountKey ? (Number(spent[e.saveCountKey]) || 0) : 0;
      currentSaveDC = Number(e.saveDCBase) + uses * (Number(e.saveDCIncrement) || 5);
    }

    const mode = e.mode === "prompt" ? "prompt" : "auto";
    const priority = Number.isFinite(Number(e.priority))
      ? Number(e.priority)
      : (e.consumeEffect && mode === "auto" ? 10 : mode === "auto" ? 20 : 30);

    const note = typeof interpolateRuleTokens === "function"
      ? interpolateRuleTokens(e.note || "", profile, session)
      : (e.note || "");

    out.push({
      name,
      mode,
      priority,
      ready,
      resourceId: e.resourceId || "",
      consumeEffect: e.consumeEffect || "",
      pointPool: e.pointPool || "",
      pointCost: e.pointCost ?? null,
      saveAbility: e.saveAbility || "",
      saveDCBase: e.saveDCBase || null,
      saveDCIncrement: e.saveDCIncrement || 5,
      saveCountKey: e.saveCountKey || "",
      currentSaveDC,
      allowMassiveDamage: Boolean(e.allowMassiveDamage),
      remaining,
      maxUses,
      availablePoints,
      note,
      source: srcName
    });
  }

  out.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const ready = out.filter(s => s.ready);
  return {
    all: out,
    ready,
    readyAuto: ready.filter(s => s.mode === "auto"),
    readyPrompt: ready.filter(s => s.mode === "prompt")
  };
}

function resolveContextualNotes(profile, session = null, surface = "") {
  const all = collectCharacterEffects(profile, session);
  const want = String(surface || "").trim();
  const out = [];
  const seen = new Set();
  for (const e of all) {
    if (e.type !== "contextualNote") continue;
    if (want && e.surface !== want) continue;
    const srcLabel = e.source?.name || "Effect";
    const key = `${e.surface}|${e.title || ""}|${e.text || ""}|${srcLabel}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const evalText = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.text || "", profile, session) : (e.text || "");
    out.push({
      surface: e.surface,
      title: e.title || srcLabel,
      text: evalText,
      rawText: e.text || "",
      skills: e.skills || null,
      castingScope: e.castingScope || null,
      restKind: e.restKind || "",
      source: srcLabel,
      sourceKind: e.source?.kind || "",
      cadence: e.cadence || "",
      rechargeMin: e.rechargeMin || 0,
      durationSpec: e.durationSpec || null
    });
  }
  return out;
}

const _ABILITY_SKILL_COUNTS = { strength: 1, dexterity: 3, constitution: 0, intelligence: 5, wisdom: 5, charisma: 4 };

function isBroadSaveEffect(e) {
  if (!e || typeof e !== "object") return false;
  if (e.abilities === "all") return true;
  if (Array.isArray(e.abilities) && e.abilities.length) {
    return e.abilities.some(a => normalizeName(a) === "all") || e.abilities.length >= 3;
  }
  return !e.abilities;
}

function isBroadSkillEffect(e) {
  if (!e || typeof e !== "object") return false;
  if (e.skills === "all") return true;
  if (Array.isArray(e.skills) && e.skills.length) {
    return e.skills.some(s => normalizeName(s) === "all") || e.skills.length >= 3;
  }
  if (e.filter) return false;
  if (e.ability) return (_ABILITY_SKILL_COUNTS[normalizeName(e.ability)] || 0) >= 3;
  if (Array.isArray(e.abilities) && e.abilities.length) {
    const cnt = e.abilities.reduce((sum, a) => sum + (_ABILITY_SKILL_COUNTS[normalizeName(a)] || 0), 0);
    return cnt >= 3;
  }
  return true;
}

function isStandalonePassiveRollFloorNote(cn, allEffects) {
  if (!cn || !Array.isArray(allEffects) || !allEffects.length) return false;
  const srcName = normalizeName(cn.source || cn.sourceObj?.name || "");
  const srcKind = normalizeName(cn.sourceKind || cn.sourceObj?.kind || "");
  if (!srcName) return false;
  const sameSource = allEffects.filter(ef =>
    normalizeName(ef.source?.name || "") === srcName &&
    (!srcKind || normalizeName(ef.source?.kind || "") === srcKind)
  );
  const hasUncondSupFloor = sameSource.some(ef => ef.type === "rollFloor" && ef.scope === "superiorityDie" && !ef.condition);
  if (hasUncondSupFloor && (cn.surface === "combat.special" || cn.surface === "attacks")) {
    const hasActionable = sameSource.some(ef => ef.type === "actionGrant" || ef.type === "combatTrait" || ef.type === "attackDamageMod" || ef.type === "critMod");
    if (!hasActionable) return true;
  }
  const hasUncondSkillFloor = sameSource.some(ef => ef.type === "rollFloor" && ef.scope === "skill" && !ef.condition && Number.isFinite(ef.minRoll));
  if (hasUncondSkillFloor && cn.surface === "skills" && (!Array.isArray(cn.skills) || !cn.skills.length) && !cn.restKind) {
    return true;
  }
  return false;
}

function _compactSituationalPillLabel(prefix, condText, scopeTag = "") {
  let clean = String(condText || "").trim()
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/^(?:against|vs\.?|to avoid being|to avoid|avoiding|on|when|made to|related to)\s+/i, "")
    .replace(/\.+$/, "")
    .trim();
  if (clean.length > 28) {
    const cut = clean.slice(0, 28);
    const sp = cut.lastIndexOf(" ");
    clean = (sp > 14 ? cut.slice(0, sp) : cut).replace(/[,;:\s]+$/, "") + "…";
  }
  const core = clean ? (prefix + (prefix.endsWith(":") ? " " : " vs ") + clean) : prefix;
  return scopeTag ? (core + " (" + scopeTag + ")") : core;
}

function _pushMergedSituational(list, item) {
  const key = (item.tone || "neutral") + "|" + normalizeName(item.appliesTo) + "|" + normalizeName(item.detail);
  const existing = list.find(x => x._key === key);
  if (existing) {
    for (const s of (item.sources || [])) {
      if (!existing.sources.some(es => normalizeName(es.name) === normalizeName(s.name))) {
        existing.sources.push(s);
      }
    }
    return;
  }
  list.push({ ...item, _key: key });
}

function resolveBroadSaveModifiers(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const out = [];
  const narrowRibbonRe = /addiction|substance|\baging\b|death saving throws|unenhanced exhaustion|extreme (?:cold|heat)/i;
  for (const e of all) {
    const srcLabel = e.source?.name || "Effect";
    const srcObj = e.source ? { name: srcLabel, kind: e.source.kind || "", detail: e.source.detail || "", itemName: e.source.itemName || "" } : { name: srcLabel, kind: "" };
    const effectiveSrc = (e.source?.kind === "property" && e.source.itemName)
      ? { name: e.source.name, kind: "property", itemName: e.source.itemName }
      : srcObj;
    if (e.type === "saveMod" && e.condition && e.mode !== "halfPositiveMod" && !e.shieldAcBonus && isBroadSaveEffect(e)) {
      const chosenType = session?.combatOptionChoices?.[srcLabel]?.[0] || "chosen-type";
      let condTxt = String(e.condition || "").replaceAll("{choice}", chosenType);
      if (typeof interpolateRuleTokens === "function") condTxt = interpolateRuleTokens(condTxt, profile, session);
      if (narrowRibbonRe.test(condTxt)) continue;
      const appliesTo = (e.abilities === "all" || (Array.isArray(e.abilities) && e.abilities.some(a => normalizeName(a) === "all")))
        ? "All saving throws"
        : (Array.isArray(e.abilities) ? (e.abilities.map(a => a.slice(0, 3).toUpperCase()).join(", ") + " saving throws") : "All saving throws");
      const scopeTag = appliesTo === "All saving throws" ? "" : (Array.isArray(e.abilities) ? e.abilities.map(a => a.slice(0, 3).toUpperCase()).join("/") : "");
      const tone = e.mode === "advantage" ? "adv" : e.mode === "disadvantage" ? "disadv" : "neutral";
      const diePrefix = (e.mode === "die" && e.value)
        ? ("+" + (typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(String(e.value), profile, session) : String(e.value)))
        : "";
      let abAddPrefix = "";
      if (e.mode === "abilityAdd" && e.ability) {
        const scS = (profile && typeof effectiveScores === "function") ? effectiveScores(profile, session) : (profile?.scores || {});
        const rawM = typeof modifier === "function" ? modifier(scS[e.ability] || 10) : Math.floor(((scS[e.ability] || 10) - 10) / 2);
        const addV = Math.max(Number.isFinite(e.minValue) ? e.minValue : 0, rawM);
        abAddPrefix = signed(addV);
      }
      const shortPrefix = e.mode === "advantage" ? "Adv"
        : e.mode === "disadvantage" ? "Disadv"
        : e.mode === "swap" ? "Swap:"
        : (abAddPrefix || diePrefix || (Number.isFinite(e.value) ? signed(e.value) : "Mod:"));
      const fullPrefix = e.mode === "advantage" ? "Advantage"
        : e.mode === "disadvantage" ? "Disadvantage"
        : e.mode === "swap" ? "Substitute ability"
        : (abAddPrefix ? (abAddPrefix + " (" + e.ability + ")") : (diePrefix || (Number.isFinite(e.value) ? signed(e.value) : "Modifier")));
      _pushMergedSituational(out, {
        id: "save:" + out.length,
        label: _compactSituationalPillLabel(shortPrefix, condTxt, scopeTag),
        tone,
        appliesTo,
        detail: fullPrefix + " — " + condTxt.replace(/\.+$/, "") + ".",
        sources: [effectiveSrc]
      });
    } else if (e.type === "rollFloor" && (e.scope === "save" || e.scope === "d20") && e.condition && Number.isFinite(e.minRoll) && e.minRoll > 0 && isBroadSaveEffect(e)) {
      const condTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.condition, profile, session) : String(e.condition);
      const appliesTo = Array.isArray(e.abilities) && e.abilities.length ? (e.abilities.map(a => a.slice(0, 3).toUpperCase()).join(", ") + " saving throws") : "All saving throws";
      _pushMergedSituational(out, {
        id: "save:" + out.length,
        label: _compactSituationalPillLabel("Min " + e.minRoll, condTxt),
        tone: "neutral",
        appliesTo,
        detail: "Treat d20 rolls below " + e.minRoll + " as " + e.minRoll + " on " + condTxt.replace(/\.+$/, "") + ".",
        sources: [effectiveSrc]
      });
    } else if (e.type === "rerollRule" && (e.scope === "save" || e.scope === "d20") && isBroadSaveEffect(e)) {
      const lbl = (e.source?.kind === "class" && normalizeName(srcLabel) === "monk") ? "Diamond Soul" : srcLabel;
      const parts = [e.trigger, e.condition].filter(Boolean).join(": ");
      const appliesTo = Array.isArray(e.abilities) && e.abilities.length ? (e.abilities.map(a => a.slice(0, 3).toUpperCase()).join(", ") + " saving throws") : "All saving throws";
      _pushMergedSituational(out, {
        id: "save:" + out.length,
        label: "Reroll: " + lbl,
        tone: "adv",
        appliesTo,
        detail: (parts || "Reroll failed saving throw").replace(/\.+$/, "") + ".",
        sources: [{ name: lbl, kind: e.source?.kind || "" }]
      });
    } else if (e.type === "contextualNote" && e.surface === "saves" && isBroadSaveEffect(e)) {
      if (out.some(x => x.sources.some(s => normalizeName(s.name) === normalizeName(srcLabel) || (e.title && normalizeName(s.name) === normalizeName(e.title))))) continue;
      const rawTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.text, profile, session) : String(e.text || "");
      const cleanTxt = rawTxt.replace(/\.+\s*$/, "");
      if (!cleanTxt || narrowRibbonRe.test(cleanTxt)) continue;
      const appliesTo = Array.isArray(e.abilities) && e.abilities.length ? (e.abilities.map(a => a.slice(0, 3).toUpperCase()).join(", ") + " saving throws") : "All saving throws";
      _pushMergedSituational(out, {
        id: "save:" + out.length,
        label: e.title || srcLabel,
        tone: "neutral",
        appliesTo,
        detail: cleanTxt + ".",
        sources: [{ name: e.title || srcLabel, kind: e.source?.kind || "" }]
      });
    }
  }
  const sp = typeof speciesRecord === "function" ? speciesRecord(profile?.species) : null;
  if (sp?.ionLightningSaveDisadv && !out.some(x => /ion or lightning/i.test(x.detail))) {
    _pushMergedSituational(out, {
      id: "save:" + out.length,
      label: "Disadv vs ion or lightning",
      tone: "disadv",
      appliesTo: "All saving throws",
      detail: "Disadvantage on saving throws against effects dealing ion or lightning damage.",
      sources: [{ name: sp.name || profile?.species || "Species", kind: "species" }]
    });
  }
  if ((session?.effects || []).some(e => normalizeName(e.name) === "daring escape")) {
    _pushMergedSituational(out, {
      id: "save:" + out.length,
      label: "Adv vs grapple/restrain/slow",
      tone: "adv",
      appliesTo: "All saving throws",
      detail: "Advantage on saving throws to break grapple, restrain, or slow.",
      sources: [{ name: "Daring Escape", kind: "effect" }]
    });
  }
  return out.map(({ _key, ...rest }) => rest);
}

function resolveBroadSkillModifiers(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const out = [];
  const c = (session && typeof conditionState === "function") ? conditionState(session, profile) : {};
  const effMods = (profile && session && typeof activeEffectModifiers === "function") ? activeEffectModifiers(profile, session) : {};
  const sc = (profile && typeof effectiveScores === "function") ? effectiveScores(profile, session) : (profile?.scores || {});
  const modOf = ab => typeof modifier === "function" ? modifier(sc[ab] || 10) : Math.floor(((sc[ab] || 10) - 10) / 2);

  for (const e of all) {
    const srcLabel = e.source?.name || "Effect";
    const effectiveSrc = (e.source?.kind === "property" && e.source.itemName)
      ? { name: e.source.name, kind: "property", itemName: e.source.itemName }
      : { name: srcLabel, kind: e.source?.kind || "" };
    if (e.type === "conditionalCheckMod" && e.condition && isBroadSkillEffect(e)) {
      let bonusVal = e.value || 0;
      if (e.mode === "bonus" && (e.valueFormula === "halfForceMod" || e.bonusFormula === "halfForceMod")) {
        bonusVal = Math.max(1, Math.floor(Math.max(modOf("Wisdom"), modOf("Charisma")) / 2));
      } else if (e.mode === "bonus" && (e.valueFormula === "wisChaMod" || e.bonusFormula === "wisChaMod")) {
        bonusVal = Math.max(1, modOf("Wisdom"), modOf("Charisma"));
      }
      let condTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(String(e.condition), profile, session) : String(e.condition);
      const appliesTo = (e.skills === "all" || (Array.isArray(e.skills) && e.skills.some(s => normalizeName(s) === "all")))
        ? "All skill checks"
        : (Array.isArray(e.skills) && e.skills.length)
          ? (e.skills.join(", ") + " (" + e.skills.length + " skills)")
          : (e.ability ? (e.ability + " checks (" + (_ABILITY_SKILL_COUNTS[normalizeName(e.ability)] || 0) + " skills)") : "All skill checks");
      const scopeTag = (!e.skills && e.ability) ? e.ability.slice(0, 3).toUpperCase() : "";
      const tone = (e.mode === "advantage" || e.mode === "expertise" || e.mode === "noDisadvantage") ? "adv"
        : e.mode === "disadvantage" ? "disadv" : "neutral";
      const shortPrefix = e.mode === "advantage" ? "Adv"
        : e.mode === "disadvantage" ? "Disadv"
        : e.mode === "expertise" ? "Exp:"
        : e.mode === "noDisadvantage" ? "No disadv:"
        : e.mode === "bonus" ? signed(bonusVal)
        : (e.mode === "die" && e.value ? ("+" + String(e.value)) : "Mod:");
      const fullPrefix = e.mode === "advantage" ? "Advantage"
        : e.mode === "disadvantage" ? "Disadvantage"
        : e.mode === "expertise" ? "Expertise"
        : e.mode === "noDisadvantage" ? "No disadvantage"
        : e.mode === "bonus" ? signed(bonusVal)
        : (e.mode === "die" && e.value ? ("+" + String(e.value)) : "Modifier");
      _pushMergedSituational(out, {
        id: "skill:" + out.length,
        label: _compactSituationalPillLabel(shortPrefix, condTxt, scopeTag),
        tone,
        appliesTo,
        detail: fullPrefix + " — " + condTxt.replace(/\.+$/, "") + ".",
        sources: [effectiveSrc]
      });
    } else if (e.type === "rollFloor" && (e.scope === "skill" || e.scope === "d20") && e.condition && isBroadSkillEffect(e)) {
      const condTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.condition, profile, session) : String(e.condition);
      const appliesTo = e.ability
        ? (e.ability + " checks (" + (_ABILITY_SKILL_COUNTS[normalizeName(e.ability)] || 0) + " skills)")
        : "All skill checks";
      const scopeTag = e.ability ? e.ability.slice(0, 3).toUpperCase() : "";
      _pushMergedSituational(out, {
        id: "skill:" + out.length,
        label: _compactSituationalPillLabel("Min roll:", condTxt, scopeTag),
        tone: "neutral",
        appliesTo,
        detail: condTxt.replace(/\.+$/, "") + ".",
        sources: [effectiveSrc]
      });
    } else if (e.type === "rerollRule" && (e.scope === "skill" || e.scope === "d20") && isBroadSkillEffect(e)) {
      const parts = [e.trigger, e.condition].filter(Boolean).join(": ");
      const appliesTo = Array.isArray(e.abilities) && e.abilities.length
        ? (e.abilities.join(", ") + " checks")
        : "All skill checks";
      _pushMergedSituational(out, {
        id: "skill:" + out.length,
        label: "Reroll: " + srcLabel,
        tone: "adv",
        appliesTo,
        detail: (parts || "Reroll ability check").replace(/\.+$/, "") + ".",
        sources: [effectiveSrc]
      });
    }
  }
  if (c.sightBlocked) {
    _pushMergedSituational(out, {
      id: "skill:" + out.length,
      label: "Sight checks fail",
      tone: "disadv",
      appliesTo: "All sight-based checks",
      detail: "Checks requiring sight automatically fail.",
      sources: [{ name: "Blinded", kind: "condition" }]
    });
  }
  if (c.deafened) {
    _pushMergedSituational(out, {
      id: "skill:" + out.length,
      label: "Hearing checks fail",
      tone: "disadv",
      appliesTo: "All hearing-based checks",
      detail: "Checks requiring hearing automatically fail.",
      sources: [{ name: "Deafened", kind: "condition" }]
    });
  }
  if ((session?.effects || []).some(e => normalizeName(e.name) === "daring escape")) {
    _pushMergedSituational(out, {
      id: "skill:" + out.length,
      label: "Adv vs grapple/restrain/slow",
      tone: "adv",
      appliesTo: "All skill checks",
      detail: "Advantage on checks to break grapple, restrain, or slow.",
      sources: [{ name: "Daring Escape", kind: "effect" }]
    });
  }
  if (effMods.flexibleAdv) {
    _pushMergedSituational(out, {
      id: "skill:" + out.length,
      label: "Adv vs grapple/restraint",
      tone: "adv",
      appliesTo: "All skill checks",
      detail: "Advantage on checks to escape grapple or restraint.",
      sources: [{ name: "Mutate/Augment: Flexible", kind: "effect" }]
    });
  }
  return out.map(({ _key, ...rest }) => rest);
}

function resolveGeneralSkillNotes(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  return resolveContextualNotes(profile, session, "skills")
    .filter(n => (!Array.isArray(n.skills) || !n.skills.length) && !isStandalonePassiveRollFloorNote(n, all));
}

function resolveHpEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const lvl = profile?.level || 1;
  let perLevel = 0;
  let flat = 0;
  let hitDieMin = 0;
  const hitDieAbilityOverrides = [];
  for (const e of all) {
    if (e.type === "hpMod" && Array.isArray(e.hitDieAbilityOverride)) {
      for (const ab of e.hitDieAbilityOverride) if (ab && !hitDieAbilityOverrides.includes(ab)) hitDieAbilityOverrides.push(ab);
    }
  }
  const tempHPFormulas = [];
  const healingMods = [];
  let deathSaveBonus = 0;
  const deathSaveSources = [];
  const deathSaveSourceObjs = [];
  const sources = [];
  for (const e of all) {
    if (e.type !== "hpMod") continue;
    const src = e.source?.name || "Effect";
    const kind = e.source?.kind || "";
    if (Number.isFinite(e.perLevel)) {
      perLevel += e.perLevel;
      sources.push({ kind, name: src, perLevel: e.perLevel, sourceObj: e.source || null });
    }
    if (Number.isFinite(e.flat)) {
      flat += e.flat;
      sources.push({ kind, name: src, flat: e.flat, sourceObj: e.source || null });
    }
    if (Number.isFinite(e.hitDieMin)) {
      hitDieMin = Math.max(hitDieMin, e.hitDieMin);
    } else if (typeof e.hitDieMin === "string" && /2\s*\*\s*CON_mod/i.test(e.hitDieMin)) {
      const scores = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile?.scores || {});
      let conM = typeof modifier === "function" ? modifier(scores.Constitution || 10) : Math.floor(((scores.Constitution || 10) - 10) / 2);
      for (const ab of hitDieAbilityOverrides) {
        const alt = typeof modifier === "function" ? modifier(scores[ab] || 10) : Math.floor(((scores[ab] || 10) - 10) / 2);
        if (alt > conM) conM = alt;
      }
      hitDieMin = Math.max(hitDieMin, Math.max(2, 2 * conM));
    }
    if (e.tempHPFormula) tempHPFormulas.push({ formula: e.tempHPFormula, trigger: e.trigger || "", condition: e.condition || "", source: src });
    if (e.healingMod) {
      let computedMin = 0;
      if (/(?:floor\(level\/2\)|half your level)/i.test(String(e.healingMod)) && /(?:con_mod|constitution modifier)/i.test(String(e.healingMod))) {
        const scH = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile?.scores || {});
        const conMH = typeof modifier === "function" ? modifier(scH.Constitution || 10) : Math.floor(((scH.Constitution || 10) - 10) / 2);
        computedMin = Math.max(1, Math.floor(lvl / 2) + conMH);
      }
      healingMods.push({ mod: e.healingMod, computedMin, source: src, sourceObj: e.source || null });
    }
    if (e.deathSaveAbility) {
      const scD = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile?.scores || {});
      const abVal = scD[e.deathSaveAbility] || 10;
      const abMod = typeof modifier === "function" ? modifier(abVal) : Math.floor((abVal - 10) / 2);
      deathSaveBonus += abMod;
      deathSaveSources.push(src);
      deathSaveSourceObjs.push(e.source || { name: src });
    }
  }
  const enhancedHealingMin = healingMods.reduce((m, h) => Math.max(m, h.computedMin || 0), 0);
  return { perLevel, flat, totalBonus: perLevel * lvl + flat, hitDieMin, hitDieAbilityOverrides, tempHPFormulas, healingMods, enhancedHealingMin, deathSaveBonus, deathSaveSources, deathSaveSourceObjs, sources };
}

function resolveInitiativeEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  let bonus = 0;
  let advantage = false;
  const advantageSources = [];
  let proficiency = false;
  const abilityAdds = [];
  const abilityOverrides = [];
  const dice = [];
  const notes = [];
  const sources = [];
  for (const e of all) {
    if (e.type !== "initiativeMod") continue;
    const src = e.source?.name || "Effect";
    if (Number.isFinite(e.bonus)) {
      bonus += e.bonus;
      sources.push(`${src} (${signed(e.bonus)})`);
    }
    if (e.advantage) {
      advantage = true;
      const advLbl = (e.source?.kind === "class" && normalizeName(src) === "berserker") ? "Feral Impulse" : src;
      advantageSources.push(advLbl);
      sources.push(`${advLbl} (Advantage)`);
    }
    if (e.proficiency) {
      proficiency = true;
      sources.push(`${src} (Proficiency)`);
    }
    if (e.abilityAdd) {
      abilityAdds.push({ ability: e.abilityAdd, source: src });
      sources.push(`${src} (+${e.abilityAdd})`);
    }
    if (e.abilityOverride) {
      abilityOverrides.push({ ability: e.abilityOverride, mode: e.mode || "highest", source: src });
      sources.push(`${src} (${e.abilityOverride})`);
    }
    if (e.die) {
      dice.push(`${e.die} (${src})`);
      sources.push(`${src} (${e.die})`);
    }
    if (e.note) {
      const noteTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(e.note, profile, session) : e.note;
      notes.push(`${noteTxt} (${src})`);
    }
  }
  return { bonus, advantage, advantageSources, proficiency, abilityAdds, abilityOverrides, dice, notes, sources };
}

function resolveCombatEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const weaponRules = [];
  const attackDamageMods = [];
  const critMods = [];
  const rerollRules = [];
  const combatOptionGrants = [];
  const companionGrants = [];
  for (const e of all) {
    const src = e.source?.name || "Effect";
    if (e.type === "weaponRule") weaponRules.push({ ...e, sourceName: src });
    else if (e.type === "attackDamageMod") attackDamageMods.push({ ...e, sourceName: src });
    else if (e.type === "critMod") critMods.push({ ...e, sourceName: src });
    else if (e.type === "rerollRule") rerollRules.push({ ...e, sourceName: src });
    else if (e.type === "combatOptionGrant") combatOptionGrants.push({ ...e, sourceName: src });
    else if (e.type === "companionGrant") companionGrants.push({ ...e, sourceName: src });
  }
  return { weaponRules, attackDamageMods, critMods, rerollRules, combatOptionGrants, companionGrants };
}

function resolveCastingEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  let forceDCBonus = 0;
  let forceAttackBonus = 0;
  let techDCBonus = 0;
  let techAttackBonus = 0;
  let forceMaxBonus = 0;
  let techMaxBonus = 0;
  let focusMaxBonus = 0;
  const castingUnlocks = [];
  let forceAbilityOverride = "";
  const forceAbilityReplaces = {};
  let techAbilityOverride = "";
  let maxConcurrentConcentration = 1;
  let dualConcentrationNote = "";
  let dualConcentrationSource = "";
  const dualConcentrationTriggers = [];
  const itemDCMods = [];
  const restrictions = [];
  const castingModifiers = [];
  const notes = resolveContextualNotes(profile, session, "casting");

  for (const e of all) {
    const src = e.source?.name || "Effect";
    if (e.type === "castingMod") {
      const pt = String(e.powerType || "").toLowerCase();
      if (pt === "item") {
        itemDCMods.push({ ...e, sourceName: src });
      } else {
        if (e.unlocksCasting) {
          castingUnlocks.push({ ...e, powerType: pt || "force", sourceName: src });
        }
        if (!pt || pt === "force" || pt === "all") {
          if (Number.isFinite(e.dcBonus)) forceDCBonus += e.dcBonus;
          if (Number.isFinite(e.attackBonus)) forceAttackBonus += e.attackBonus;
          if (e.abilityOverride) {
            if (e.replaces && ["Wisdom", "Charisma"].includes(e.replaces)) {
              forceAbilityReplaces[e.replaces] = e.abilityOverride;
            } else {
              forceAbilityOverride = e.abilityOverride;
            }
          }
        }
        if (!pt || pt === "tech" || pt === "all") {
          if (Number.isFinite(e.dcBonus)) techDCBonus += e.dcBonus;
          if (Number.isFinite(e.attackBonus)) techAttackBonus += e.attackBonus;
          if (e.abilityOverride) techAbilityOverride = e.abilityOverride;
        }
      }
    } else if (e.type === "castingModifier") {
      const evalText = (typeof e.text === "string" && typeof interpolateRuleTokens === "function")
        ? interpolateRuleTokens(e.text, profile, session)
        : e.text;
      castingModifiers.push({ ...e, text: evalText, sourceName: src });
    } else if (e.type === "pointPoolMod") {
      const pool = String(e.pool || "").toLowerCase();
      if (Number.isFinite(e.maxBonus)) {
        if (pool === "force") forceMaxBonus += e.maxBonus;
        else if (pool === "tech") techMaxBonus += e.maxBonus;
        else if (pool === "focus") focusMaxBonus += e.maxBonus;
      } else if (pool === "focus" && e.maxBonus === "halfForceModMin1") {
        const sc = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile?.scores || {});
        const wM = typeof modifier === "function" ? modifier(sc.Wisdom ?? 10) : 0;
        const cM = typeof modifier === "function" ? modifier(sc.Charisma ?? 10) : 0;
        focusMaxBonus += Math.max(1, Math.floor(Math.max(wM, cM) / 2));
      }
    } else if (e.type === "concentrationMod" && Number.isFinite(e.maxConcurrent)) {
      maxConcurrentConcentration = Math.max(maxConcurrentConcentration, e.maxConcurrent);
      if (e.maxConcurrent >= 2) {
        if (e.note && !dualConcentrationNote) dualConcentrationNote = e.note;
        if (!dualConcentrationSource) dualConcentrationSource = src;
        if (Array.isArray(e.turnTriggers)) {
          for (const tr of e.turnTriggers) {
            if (tr && tr.note) dualConcentrationTriggers.push({ ...tr, source: src, fromDualConcentration: true });
          }
        }
      }
    } else if (e.type === "castingRestriction") {
      restrictions.push({ kind: e.kind || "restriction", permanent: Boolean(e.permanent), note: e.note || e.kind || "", source: src });
    }
  }
  const removesForceInsensitive = all.some(e => e.type === "combatTrait" && e.kind === "removeForceInsensitive");
  const removesTechImpaired = all.some(e => e.type === "combatTrait" && e.kind === "removeTechImpaired");
  const filteredRestrictions = restrictions.filter(r => {
    if (removesForceInsensitive && r.kind === "forceInsensitive" && !r.permanent) return false;
    if (removesTechImpaired && r.kind === "techInsensitive" && !r.permanent) return false;
    return true;
  });
  return {
    forceDCBonus, forceAttackBonus, techDCBonus, techAttackBonus,
    forceMaxBonus, techMaxBonus, focusMaxBonus, castingUnlocks,
    forceAbilityOverride, forceAbilityReplaces, techAbilityOverride, maxConcurrentConcentration,
    dualConcentrationNote, dualConcentrationSource, dualConcentrationTriggers,
    itemDCMods, restrictions: filteredRestrictions, castingModifiers, notes
  };
}

function resolveAttunementEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  let slotDelta = 0;
  let modSlotDelta = 0;
  const sources = [];
  for (const e of all) {
    if (e.type !== "attunementMod") continue;
    const src = e.source?.name || "Effect";
    if (Number.isFinite(e.slotDelta)) {
      slotDelta += e.slotDelta;
      sources.push(`${src} (${signed(e.slotDelta)} attunement)`);
    }
    if (Number.isFinite(e.modSlotDelta)) {
      modSlotDelta += e.modSlotDelta;
      sources.push(`${src} (${signed(e.modSlotDelta)} mod slots)`);
    }
  }
  return { slotDelta, modSlotDelta, sources };
}

function resolveProficiencyEffects(profile, session = null) {
  const all = collectCharacterEffects(profile, session);
  const out = { skills: [], saves: [], weapons: [], armors: [], tools: [], languages: [] };
  const map = { skill: "skills", save: "saves", weapon: "weapons", armor: "armors", tool: "tools", language: "languages" };
  for (const e of all) {
    if (e.type !== "proficiency" || !e.target) continue;
    const bucket = map[String(e.kind || "").toLowerCase()];
    if (!bucket) continue;
    out[bucket].push({ target: e.target, rank: e.rank ?? 1, upgradeToExpertise: Boolean(e.upgradeToExpertise), source: e.source?.name || "Effect" });
  }
  return out;
}
