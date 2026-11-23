const abilities = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
const skills = {
  Acrobatics: "Dexterity", "Animal Handling": "Wisdom", Athletics: "Strength",
  Deception: "Charisma", Insight: "Wisdom", Intimidation: "Charisma",
  Investigation: "Intelligence", Lore: "Intelligence", Medicine: "Wisdom", Nature: "Intelligence",
  Perception: "Wisdom", Performance: "Charisma", Persuasion: "Charisma", Piloting: "Intelligence",
  "Sleight of Hand": "Dexterity", Stealth: "Dexterity", Survival: "Wisdom", Technology: "Intelligence"
};
const damageTypes = ["acid", "cold", "energy", "fire", "force", "ion", "kinetic", "lightning", "necrotic", "poison", "psychic", "sonic", "true"];
const categoryLabels = {
  AlcoholicBeverage: "Alcoholic Beverage",
  DataRecordingAndStorage: "Data Recording & Storage",
  GamingSet: "Gaming Set",
  LifeSupport: "Life Support",
  MusicalInstrument: "Musical Instrument",
  WeaponOrArmorAccessory: "Weapon or Armor Accessory"
};
const formatCategory = raw => categoryLabels[raw] || raw || "";
const normalizeName = name => String(name || "").replaceAll("’", "'").trim().toLowerCase();
const byName = records => new Map((records || []).map(record => [normalizeName(record.name), record]));

const classCatalog = byName(typeof SW5E_CLASSES !== "undefined" ? SW5E_CLASSES : []);
const speciesCatalog = byName(typeof SW5E_SPECIES !== "undefined" ? SW5E_SPECIES : []);
const backgroundCatalog = byName(typeof SW5E_BACKGROUNDS !== "undefined" ? SW5E_BACKGROUNDS : []);
const equipmentRules = byName(typeof SW5E_EQUIPMENT !== "undefined" ? SW5E_EQUIPMENT : []);
const equipmentRulesCompact = new Map((typeof SW5E_EQUIPMENT !== "undefined" ? SW5E_EQUIPMENT : []).map(item => [normalizeName(item.name).replace(/[\s-]+/g, ""), item]));
const featRules = byName(typeof SW5E_FEATS !== "undefined" ? SW5E_FEATS : []);
const powerRules = byName(typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : []);
const maneuverRules = byName(typeof SW5E_MANEUVERS !== "undefined" ? SW5E_MANEUVERS : []);
const fightingStyleRules = byName(typeof SW5E_FIGHTING_STYLES !== "undefined" ? SW5E_FIGHTING_STYLES : []);
const fightingMasteryRules = byName(typeof SW5E_FIGHTING_MASTERIES !== "undefined" ? SW5E_FIGHTING_MASTERIES : []);
const lightsaberFormRules = byName(typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS : []);
const weaponPropertyRules = byName(typeof SW5E_WEAPON_PROPERTIES !== "undefined" ? SW5E_WEAPON_PROPERTIES : []);
const armorPropertyRules = byName(typeof SW5E_ARMOR_PROPERTIES !== "undefined" ? SW5E_ARMOR_PROPERTIES : []);
const weaponFocusRules = byName(typeof SW5E_WEAPON_FOCUSES !== "undefined" ? SW5E_WEAPON_FOCUSES : []);
const weaponSupremacyRules = byName(typeof SW5E_WEAPON_SUPREMACIES !== "undefined" ? SW5E_WEAPON_SUPREMACIES : []);
const weaponFocusRule = name => weaponFocusRules.get(normalizeName(name)) || null;
const weaponSupremacyRule = name => weaponSupremacyRules.get(normalizeName(name)) || null;
const weaponClassOf = name => (typeof SW5E_WEAPON_CLASS_MAP !== "undefined" ? SW5E_WEAPON_CLASS_MAP[normalizeName(name)] : "") || "";
function parseModalModes(properties) {
  const mp = (properties || []).find(p => /^modal\s*\(/i.test(p));
  if (!mp) return [];
  const inner = mp.match(/modal\s*\(([^)]+)\)/i)?.[1] || "";
  return inner.split(/,|\band\b/i).map(s => s.trim().replace(/^tech-staff$/i, "techstaff")).filter(Boolean);
}

const modifier = score => Math.floor((score - 10) / 2);
const signed = value => (value >= 0 ? "+" : "") + value;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const rollDie = sides => 1 + Math.floor(Math.random() * sides);

const classRecord = name => classCatalog.get(normalizeName(name)) || null;
const speciesRecord = name => speciesCatalog.get(normalizeName(name)) || null;
const backgroundRecord = name => backgroundCatalog.get(normalizeName(name)) || null;
const archetypeRecord = (name, className = "") => {
  if (!name || typeof SW5E_ARCHETYPES === "undefined") return null;
  const target = normalizeName(name);
  const clsTarget = normalizeName(className);
  return SW5E_ARCHETYPES.find(a => normalizeName(a.name) === target && (!clsTarget || normalizeName(a.className) === clsTarget)) ||
    SW5E_ARCHETYPES.find(a => normalizeName(a.name) === target) || null;
};
const itemRule = (name, item = null) => equipmentRules.get(normalizeName(name)) || equipmentRulesCompact.get(normalizeName(name).replace(/[\s-]+/g, "")) || item?.customRule || null;
const featRule = name => featRules.get(normalizeName(name)) || null;
const powerRule = name => powerRules.get(normalizeName(name)) || null;
const maneuverRule = name => maneuverRules.get(normalizeName(name)) || null;
const fightingStyleRule = name => fightingStyleRules.get(normalizeName(name)) || null;
const fightingMasteryRule = name => fightingMasteryRules.get(normalizeName(name)) || null;
const lightsaberFormRule = name => lightsaberFormRules.get(normalizeName(name)) || null;
const classOptionRule = name => (typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS : []).find(o => normalizeName(o.name) === normalizeName(name)) || null;
const classImprovementRule = className => (typeof SW5E_CLASS_IMPROVEMENTS !== "undefined" ? SW5E_CLASS_IMPROVEMENTS : []).find(ci => normalizeName(ci.className) === normalizeName(className)) || null;
const classPoolMeta = className => (typeof SW5E_CLASS_POOL_META !== "undefined" ? SW5E_CLASS_POOL_META[className] : null) || null;
function ownedClassOptions(profile, session) {
  const names = Array.isArray(session?.classOptions) ? session.classOptions : [];
  const seen = new Set();
  const out = [];
  for (const n of names) {
    const k = normalizeName(n);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const rule = classOptionRule(n);
    if (rule) out.push(rule);
  }
  return out;
}
const hasClassOption = (profile, session, name) => ownedClassOptions(profile, session).some(o => normalizeName(o.name) === normalizeName(name));
function propertyRule(propString, category = "") {
  const raw = String(propString || "").trim();
  if (!raw || raw === "—") return null;
  const isArmor = category === "Armor" || category === "Shield";
  const primary = isArmor ? armorPropertyRules : weaponPropertyRules;
  const secondary = isArmor ? weaponPropertyRules : armorPropertyRules;
  const base = normalizeName(raw.split("(")[0].replace(/\s+\d+\s*$/, "").trim());
  const firstWord = base.split(/\s+/)[0];
  return primary.get(base) || primary.get(firstWord) || secondary.get(base) || secondary.get(firstWord) || null;
}

const featureCache = new Map();
function readFeatures(text) {
  if (!text) return new Map();
  const records = new Map();
  const sections = String(text).replaceAll("\r", "").split(/^#{3,4} /m).slice(1);
  for (const section of sections) {
    const newline = section.indexOf("\n");
    if (newline < 0) continue;
    records.set(normalizeName(section.slice(0, newline).trim()), section.slice(newline + 1).trim());
  }
  return records;
}
function parsedClassFeatures(className) {
  const key = "class:" + normalizeName(className);
  if (!featureCache.has(key)) {
    const cls = classRecord(className);
    featureCache.set(key, readFeatures(cls?.rules || ""));
  }
  return featureCache.get(key);
}
function parsedArchetypeFeatures(archetypeName, className = "") {
  const key = "arch:" + normalizeName(className) + ":" + normalizeName(archetypeName);
  if (!featureCache.has(key)) {
    const arch = archetypeRecord(archetypeName, className);
    featureCache.set(key, readFeatures(arch?.rules || ""));
  }
  return featureCache.get(key);
}
function classRule(profileOrName, featureName) {
  if (featureName === undefined) {
    const clsName = (typeof app !== "undefined" && app?.character?.profile?.className) || "Berserker";
    return parsedClassFeatures(clsName).get(normalizeName(profileOrName)) || "";
  }
  const clsName = typeof profileOrName === "string" ? profileOrName : profileOrName?.className;
  return parsedClassFeatures(clsName).get(normalizeName(featureName)) || "";
}
function approachRule(profileOrName, sessionOrFeature, maybeFeature) {
  if (sessionOrFeature === undefined) {
    const prof = typeof app !== "undefined" ? app?.character?.profile : null;
    const sess = typeof app !== "undefined" ? app?.character?.session : null;
    return parsedArchetypeFeatures(sess?.approach || "", prof?.className || "").get(normalizeName(profileOrName)) || "";
  }
  if (maybeFeature === undefined) {
    return parsedArchetypeFeatures(profileOrName, "").get(normalizeName(sessionOrFeature)) || "";
  }
  return parsedArchetypeFeatures(sessionOrFeature?.approach || "", profileOrName?.className || "").get(normalizeName(maybeFeature)) || "";
}

function classLevelStep(profile) {
  const cls = classRecord(profile?.className);
  return cls?.levelChanges?.[String(profile?.level || 1)] || {};
}
function archetypeLevelStep(profile, session) {
  const arch = archetypeRecord(session?.approach, profile?.className);
  const raw = arch?.leveledTable?.[String(profile?.level || 1)];
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out = {};
    for (const item of raw) if (item && item.key) out[item.key] = item.value;
    return out;
  }
  return raw;
}
function archetypeMechanics(profile, session) {
  const arch = archetypeRecord(session?.approach, profile?.className);
  return arch?.mechanics || null;
}
function archetypePassiveSummary(profile, session) {
  const mech = archetypeMechanics(profile, session);
  const lvl = profile?.level || 1;
  const out = {
    speeds: {}, walkBonus: 0, resistances: [], immunities: [], senses: [],
    slowedStep: null, acBonus: 0, acSources: [], unarmoredBase: 0, unarmoredBaseSource: "",
    hpPerLevel: 0, critRangeBonus: 0, initBonus: null, initAdv: false,
    saveProfs: [], saveBonuses: {}, armorProfs: [], weaponProfs: [],
    weaponNotes: [], extraAttack: false, castingDCBonus: 0, castingAttackBonus: 0
  };
  if (!mech?.passives) return out;
  const effects = session?.effects || [];
  const hasEff = name => effects.some(e => normalizeName(e.name) === normalizeName(name));
  for (const p of mech.passives) {
    if (p.minLevel && lvl < p.minLevel) continue;
    if (p.requireRage && !session?.rage) continue;
    if (p.requireEffect && !hasEff(p.requireEffect)) continue;
    if (p.speeds) Object.assign(out.speeds, p.speeds);
    if (p.walkBonus) out.walkBonus += p.walkBonus;
    for (const r of p.resistances || []) if (!out.resistances.includes(r)) out.resistances.push(r);
    for (const im of p.immunities || []) if (!out.immunities.includes(im)) out.immunities.push(im);
    for (const im of p.condImmunities || []) if (!out.immunities.includes(im)) out.immunities.push(im);
    for (const s of p.senses || []) if (!out.senses.includes(s)) out.senses.push(s);
    if (p.darkvision) {
      const idx = out.senses.findIndex(x => /^Darkvision\s+\d+/i.test(x));
      if (idx < 0) out.senses.push("Darkvision " + p.darkvision + " ft");
    }
    if (p.slowedStep && (!out.slowedStep || p.slowedStep < out.slowedStep)) out.slowedStep = p.slowedStep;
    if (p.acBonus) { out.acBonus += p.acBonus; out.acSources.push((p.name || "Archetype") + " (+" + p.acBonus + ")"); }
    if (p.unarmoredBase && p.unarmoredBase > out.unarmoredBase) {
      out.unarmoredBase = p.unarmoredBase;
      out.unarmoredBaseSource = p.name || (session?.approach || "Archetype");
    }
    if (p.hpPerLevel) out.hpPerLevel += p.hpPerLevel;
    if (p.critRange && (20 - p.critRange) > out.critRangeBonus) out.critRangeBonus = 20 - p.critRange;
    if (p.initBonus) out.initBonus = p.initBonus;
    if (p.initAdv) out.initAdv = true;
    for (const sp of p.saveProfs || []) if (!out.saveProfs.includes(sp)) out.saveProfs.push(sp);
    if (p.saveBonuses) {
      for (const [k, v] of Object.entries(p.saveBonuses)) out.saveBonuses[k] = (out.saveBonuses[k] || 0) + v;
    }
    for (const ap of p.proficiencies?.armor || []) if (!out.armorProfs.includes(ap)) out.armorProfs.push(ap);
    for (const wp of p.proficiencies?.weapons || []) if (!out.weaponProfs.includes(wp)) out.weaponProfs.push(wp);
    if (p.weaponNote && !out.weaponNotes.includes(p.weaponNote)) out.weaponNotes.push(p.weaponNote);
    if (p.extraAttack) out.extraAttack = true;
    if (p.castingDCBonus) out.castingDCBonus += p.castingDCBonus;
    if (p.castingAttackBonus) out.castingAttackBonus += p.castingAttackBonus;
  }
  return out;
}
function archetypeActionMaxUses(act, profile, session) {
  if (!act || act.uses === undefined || act.uses === null) return 0;
  const lvl = profile?.level || 1;
  if (typeof act.uses === "number") return act.uses;
  if (typeof act.uses === "object") {
    let val = 0;
    for (const [k, v] of Object.entries(act.uses)) {
      if (lvl >= Number(k)) val = v;
    }
    return val;
  }
  const scores = effectiveScores(profile, session);
  const prof = profile?.proficiency || 2;
  if (act.uses === "PROF") return prof;
  if (act.uses === "HALF_PROF") return Math.max(1, Math.floor(prof / 2));
  if (act.uses === "WIS_CHA") return Math.max(1, modifier(scores.Wisdom), modifier(scores.Charisma));
  if (act.uses === "INT") return Math.max(1, modifier(scores.Intelligence));
  if (act.uses === "WIS") return Math.max(1, modifier(scores.Wisdom));
  if (act.uses === "CHA") return Math.max(1, modifier(scores.Charisma));
  if (act.uses === "STR") return Math.max(1, modifier(scores.Strength));
  if (act.uses === "DEX") return Math.max(1, modifier(scores.Dexterity));
  if (act.uses === "CON") return Math.max(1, modifier(scores.Constitution));
  return 0;
}
function classFeaturesUpToLevel(profile) {
  const cls = classRecord(profile?.className);
  if (!cls?.levelChanges) return [];
  const names = [];
  for (let lvl = 1; lvl <= (profile?.level || 1); lvl++) {
    const raw = cls.levelChanges[String(lvl)]?.Features || "";
    for (const part of raw.split(",")) {
      const cleaned = part.replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (!cleaned || /^[\d\uFFFD—–-]+$/.test(cleaned)) continue;
      if (!names.some(n => normalizeName(n) === normalizeName(cleaned))) names.push(cleaned);
    }
  }
  return names;
}

function hasFeat(session, name) {
  const target = normalizeName(name);
  return (session?.feats || []).some(feat => normalizeName(feat.name) === target);
}
function isRepeatableFeat(rule) {
  if (!rule) return false;
  return /multiple times|more than once/i.test(rule.rules || "");
}
function parseNumericStat(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const m = String(value || "").match(/-?\d+/);
  return m ? Number(m[0]) : 0;
}

const featSaveProfMap = {
  "blinding agility": "Dexterity",
  "cunning intellect": "Intelligence",
  "exalted awareness": "Wisdom",
  "overwhelming presence": "Charisma",
  "titan's power": "Strength",
  "unnatural resilience": "Constitution"
};

function parseTextPassiveEffects(text, onlyPassiveClause = true) {
  const result = {speeds: {}, resistances: [], immunities: [], senses: [], slowedStep: null, notes: []};
  if (!text) return result;
  // For features with an "Additionally, as a bonus action, you can manifest..." active clause, split passive vs active
  const passiveText = onlyPassiveClause ? String(text).split(/\n\s*Additionally,\s+as a bonus action/i)[0] : String(text);
  const low = passiveText.toLowerCase();

  for (const [rx, key] of [
    [/\b(?:climbing|climb)\s+speed\s+equal\s+to\s+(?:your|its)\s+walking\s+speed\b/i, "climb"],
    [/\b(?:swimming|swim)\s+speed\s+equal\s+to\s+(?:your|its)\s+walking\s+speed\b/i, "swim"],
    [/\b(?:flying|fly)\s+speed\s+equal\s+to\s+(?:your|its)\s+walking\s+speed\b/i, "fly"]
  ]) {
    if (rx.test(passiveText)) result.speeds[key] = "walk";
  }
  if (/swimming speed and a climbing speed equal to your walking speed/i.test(passiveText) ||
      /climbing speed and a swimming speed equal to your walking speed/i.test(passiveText)) {
    result.speeds.climb = "walk";
    result.speeds.swim = "walk";
  }
  for (const [mode, key] of [["climbing|climb", "climb"], ["swimming|swim", "swim"], ["flying|fly", "fly"], ["burrowing|burrow", "burrow"]]) {
    const m = passiveText.match(new RegExp("\\b(?:" + mode + ")\\s+speed\\s+of\\s+(\\d+)\\s*(?:feet|ft)", "i"));
    if (m) result.speeds[key] = Number(m[1]);
  }
  if (/each slowed level only reduces your speed by 5 feet/i.test(low)) {
    result.slowedStep = 5;
  }
  for (const cond of ["Blinded", "Charmed", "Deafened", "Diseased", "Frightened", "Paralyzed", "Petrified", "Poisoned", "Shocked", "Stunned"]) {
    if (new RegExp("immune to (?:the )?" + cond.toLowerCase(), "i").test(low)) {
      result.immunities.push(cond);
    }
  }
  if (/resistance to falling damage/i.test(low)) result.resistances.push("falling");
  for (const sense of ["Darkvision", "Blindsight", "Tremorsense", "Truesight"]) {
    const m = passiveText.match(new RegExp("\\b" + sense + "\\b[^.\\n]*?(\\d+)\\s*(?:feet|ft)", "i"));
    if (m) result.senses.push(sense + " " + m[1] + " ft");
  }
  if (/see normally in (?:enhanced )?darkness/i.test(low)) result.senses.push("See in enhanced darkness");
  if (/opportunity attacks against you are made with disadvantage/i.test(low)) result.notes.push("Opportunity attacks against you have disadvantage");
  return result;
}

function ownedCombatOptions(profile, session) {
  const styles = new Map();
  const masteries = new Map();
  const forms = new Map();
  const addStyle = name => {
    const r = fightingStyleRule(name);
    if (r) styles.set(normalizeName(r.name), r);
  };
  const addMastery = name => {
    const r = fightingMasteryRule(name);
    if (r) masteries.set(normalizeName(r.name), r);
  };
  const addForm = name => {
    const r = lightsaberFormRule(name);
    if (r) forms.set(normalizeName(r.name), r);
  };
  for (const s of session?.fightingStyles || []) addStyle(s);
  for (const m of session?.fightingMasteries || []) addMastery(m);
  for (const f of session?.lightsaberForms || []) addForm(f);
  for (const feat of session?.feats || []) {
    if (!feat.choice) continue;
    addStyle(feat.choice);
    addMastery(feat.choice);
    addForm(feat.choice);
  }
  for (const cf of profile?.customFeatures || []) {
    addStyle(cf.name);
    addMastery(cf.name);
    addForm(cf.name);
  }
  return {
    styles: [...styles.values()],
    masteries: [...masteries.values()],
    forms: [...forms.values()]
  };
}

function pruneStaleEffects(profile, session) {
  if (!session || !Array.isArray(session.effects)) return;
  const opts = ownedCombatOptions(profile, session);
  const ownedForms = new Set(opts.forms.map(f => normalizeName(f.name)));
  const ownedStyles = new Set(opts.styles.map(s => normalizeName(s.name)));
  const ownedMasteries = new Set(opts.masteries.map(m => normalizeName(m.name)));
  const arm = equippedRule(session, "armor");
  const sh = equippedRule(session, "shield");
  const spName = normalizeName(profile?.species);

  // Clear defensive/reckless stance flags on unequipped weapons
  for (const item of session.equipped || []) {
    if (!item.equipped) {
      if (item.defensiveActive) item.defensiveActive = false;
      if (item.recklessActive) item.recklessActive = false;
    }
  }

  // Prune effects whose source option/gear is no longer owned or valid (multiple owned Lightsaber Forms may be active simultaneously)
  const kept = [];
  for (let i = session.effects.length - 1; i >= 0; i--) {
    const e = session.effects[i];
    const key = normalizeName(e.name);
    const lf = lightsaberFormRule(e.name);
    if (lf) {
      if (!ownedForms.has(key)) continue;
    } else if (key === "blindfighting: doubled" && !ownedStyles.has("blindfighting style")) {
      continue;
    } else if (key === "equilibrium mark" && (!ownedStyles.has("equilibrium style") || Boolean(sh) || (arm && arm.armor !== "Light"))) {
      continue;
    } else if (key === "defense mark" && (!ownedStyles.has("defense style") || !arm || (arm.armor !== "Medium" && arm.armor !== "Heavy"))) {
      continue;
    } else if (key === "secured: light shield" && !ownedStyles.has("secured style")) {
      continue;
    } else if (key === "dual wield ac" && !ownedMasteries.has("dual wield mastery")) {
      continue;
    } else if (key === "defensive stance" && !ownedMasteries.has("sentinel mastery")) {
      continue;
    } else if (key === "duelist mastery (+prof ac)" && !ownedMasteries.has("duelist mastery")) {
      continue;
    } else if (key === "secured mastery (+prof ac)" && !ownedMasteries.has("secured mastery")) {
      continue;
    } else if (key === "defensive ball" && (spName !== "colicoid" || Boolean(sh))) {
      continue;
    } else if (key === "steady aim" && (normalizeName(profile?.className) !== "operative" || !session.classImprovementEnabled)) {
      continue;
    } else if (key === "empty body" && (normalizeName(profile?.className) !== "monk" || (profile?.level || 1) < 18)) {
      continue;
    }
    kept.push(e);
  }
  kept.reverse();
  session.effects = kept;
}

function activeLightsaberForms(session) {
  const seen = new Set();
  const list = [];
  for (const eff of session?.effects || []) {
    const rule = lightsaberFormRule(eff.name);
    if (rule && !seen.has(normalizeName(rule.name))) {
      seen.add(normalizeName(rule.name));
      list.push(rule);
    }
  }
  return list;
}

function superiorityStats(profile, session) {
  const step = classLevelStep(profile);
  const scores = effectiveScores(profile, session);
  const c = session ? conditionState(session, profile) : null;
  const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);
  const opts = ownedCombatOptions(profile, session);

  const archStep = archetypeLevelStep(profile, session);
  const archSup = archetypeMechanics(profile, session)?.superiority || null;
  const lvl = profile?.level || 1;
  const stepQty = parseNumericStat(step["Superiority Dice Quantity"]);
  const archTableQty = parseNumericStat(archStep["Superiority Dice Quantity"]);
  let archBonusQty = 0;
  if (archSup?.bonusDice) {
    for (const [k, v] of Object.entries(archSup.bonusDice)) if (lvl >= Number(k)) archBonusQty = v;
  }
  let archReplaceQty = 0;
  if (archSup?.replaceDice) {
    for (const [k, v] of Object.entries(archSup.replaceDice)) if (lvl >= Number(k)) archReplaceQty = v;
  }
  const baseQty = archReplaceQty > 0 ? archReplaceQty : ((archSup?.replaceBase && archTableQty > 0) ? archTableQty : (stepQty + archTableQty + archBonusQty));
  let styleBonus = 0;
  for (const st of opts.styles) {
    if (st.mechanics?.superiorityBonus) styleBonus += st.mechanics.superiorityBonus;
  }
  const hasMastery = opts.masteries.some(m => m.mechanics?.superiorityMasteryBonus);
  let masteryBonus = 0;
  if (hasMastery) {
    masteryBonus = (baseQty + styleBonus) > 0 ? 2 : 1;
  }
  const qty = baseQty + styleBonus + masteryBonus;
  const dieSteps = ["d4", "d6", "d8", "d10", "d12"];
  const scaledSize = lvl >= 17 ? "d12" : lvl >= 13 ? "d10" : lvl >= 9 ? "d8" : lvl >= 5 ? "d6" : "d4";
  let rawSize = step["Superiority Dice Size"] || archStep["Superiority Dice Size"] || scaledSize;
  if (archSup?.dieStepUp && lvl >= (archSup.dieStepUpLevel || 3)) {
    const idx = dieSteps.indexOf(rawSize);
    if (idx >= 0 && idx < dieSteps.length - 1) rawSize = dieSteps[idx + 1];
  }
  const size = qty > 0 ? rawSize : "";
  const used = session?.superiorityUsed || 0;
  const remaining = Math.max(0, qty - used);

  const physicalMod = Math.max(modOf("Strength"), modOf("Dexterity"), modOf("Constitution"));
  const mentalMod = Math.max(modOf("Intelligence"), modOf("Wisdom"), modOf("Charisma"));
  const generalMod = Math.max(physicalMod, mentalMod);
  const prof = profile?.proficiency || 2;
  const physicalDC = 8 + prof + physicalMod;
  const mentalDC = 8 + prof + mentalMod;
  const generalDC = 8 + prof + generalMod;

  const stepKnown = parseNumericStat(step["Maneuvers Known"]);
  const archTableKnown = parseNumericStat(archStep["Maneuvers Known"]);
  let archBonusKnown = 0;
  if (archSup?.bonusManeuvers) {
    for (const [k, v] of Object.entries(archSup.bonusManeuvers)) if (lvl >= Number(k)) archBonusKnown = v;
  }
  let archReplaceKnown = 0;
  if (archSup?.replaceManeuvers) {
    for (const [k, v] of Object.entries(archSup.replaceManeuvers)) if (lvl >= Number(k)) archReplaceKnown = v;
  }
  const baseKnownCap = archReplaceKnown > 0 ? archReplaceKnown : ((archSup?.replaceBase && archTableKnown > 0) ? archTableKnown : (stepKnown + archTableKnown + archBonusKnown));
  const styleManeuvers = opts.styles.reduce((sum, st) => sum + (st.mechanics?.maneuversGranted || 0), 0);
  const masteryManeuvers = hasMastery ? ((baseKnownCap + styleManeuvers) > 0 ? 3 : 1) : 0;
  const knownCap = baseKnownCap + styleManeuvers + masteryManeuvers;

  return {
    qty, size, used, remaining, knownCap,
    freeD4Max: hasMastery ? prof : 0,
    physicalMod, mentalMod, generalMod,
    physicalDC, mentalDC, generalDC,
    dcFor: type => type === "Physical" ? physicalDC : type === "Mental" ? mentalDC : generalDC
  };
}

function passiveFeatureProfile(profile, session) {
  const sp = speciesRecord(profile?.species);
  const speeds = {...(sp?.speeds || {})};
  const resistances = [...(sp?.resistances || [])];
  const immunities = [...(sp?.immunities || [])];
  const senses = [...(sp?.senses || [])];
  let slowedStep = null;

  for (const cf of profile?.customFeatures || []) {
    if (classOptionRule(cf.name)) continue;
    const parsed = parseTextPassiveEffects(cf.content, true);
    Object.assign(speeds, parsed.speeds);
    for (const r of parsed.resistances) if (!resistances.includes(r)) resistances.push(r);
    for (const im of parsed.immunities) if (!immunities.includes(im)) immunities.push(im);
    for (const s of parsed.senses) {
      if (s.startsWith("Darkvision ") && senses.some(x => x.startsWith("Darkvision ")) && /increases its range by 30 feet/i.test(cf.content || "")) {
        const idx = senses.findIndex(x => x.startsWith("Darkvision "));
        const cur = parseNumericStat(senses[idx]) || 60;
        senses[idx] = "Darkvision " + (cur + 30) + " ft";
      } else if (!senses.includes(s)) {
        senses.push(s);
      }
    }
    if (parsed.slowedStep !== null) slowedStep = parsed.slowedStep;

  }
  for (const feat of session?.feats || []) {
    const mech = featRule(feat.name)?.mechanics;
    if (!mech) continue;
    if (mech.climbSpeed) speeds.climb = mech.climbSpeed;
    if (mech.swimSpeed) speeds.swim = mech.swimSpeed;
    if (mech.slowedStep) slowedStep = mech.slowedStep;
    for (const r of mech.resistances || []) if (!resistances.includes(r)) resistances.push(r);
    for (const im of mech.immunities || []) if (!immunities.includes(im)) immunities.push(im);
    for (const s of mech.senses || []) if (!senses.includes(s)) senses.push(s);

  }
  const opts = ownedCombatOptions(profile, session);
  let blindsightAdd = 0;
  for (const st of opts.styles) {
    if (st.mechanics?.blindsightBonus) blindsightAdd += st.mechanics.blindsightBonus;
  }
  for (const ma of opts.masteries) {
    if (ma.mechanics?.blindsightPerProf) blindsightAdd += ma.mechanics.blindsightPerProf * (profile?.proficiency || 2);
  }
  if (blindsightAdd > 0) {
    const bsIdx = senses.findIndex(x => /^Blindsight\s+\d+/i.test(x));
    if (bsIdx >= 0) {
      const cur = parseNumericStat(senses[bsIdx]) || 0;
      senses[bsIdx] = "Blindsight " + (cur + blindsightAdd) + " ft";
    } else {
      senses.push("Blindsight " + blindsightAdd + " ft");
    }
  }
  const clsName = normalizeName(profile?.className);
  const lvl = profile?.level || 1;
  if (clsName === "guardian" && lvl >= 6) {
    for (const im of ["Poisoned", "Diseased"]) if (!immunities.includes(im)) immunities.push(im);
  }
  if (clsName === "monk" && lvl >= 13) {
    for (const im of ["Poisoned", "Diseased"]) if (!immunities.includes(im)) immunities.push(im);
    if (!resistances.includes("poison")) resistances.push("poison");
  }
  if (clsName === "operative" && lvl >= 14 && !senses.includes("Blindsense 10 ft")) senses.push("Blindsense 10 ft");
  if (clsName === "scout" && lvl >= 18 && !senses.includes("Sense Invisible 30 ft")) senses.push("Sense Invisible 30 ft");

  for (const co of ownedClassOptions(profile, session)) {
    const m = co.mechanics;
    if (!m) continue;
    if (m.climbSpeed) speeds.climb = m.climbSpeed;
    if (m.swimSpeed) speeds.swim = m.swimSpeed;
    if (m.rageFlySpeed && session?.rage) speeds.fly = m.rageFlySpeed;
    if (m.rageBlindsight && session?.rage && !senses.includes("Blindsight " + m.rageBlindsight + " ft")) {
      senses.push("Blindsight " + m.rageBlindsight + " ft");
    }
    if (m.darkvision) {
      const idx = senses.findIndex(x => x.startsWith("Darkvision "));
      if (idx >= 0 && m.darkvisionExtend) {
        const cur = parseNumericStat(senses[idx]) || 60;
        senses[idx] = "Darkvision " + (cur + m.darkvisionExtend) + " ft";
      } else if (idx < 0) {
        senses.push("Darkvision " + m.darkvision + " ft");
      }
    }
    for (const r of m.resistances || []) if (!resistances.includes(r)) resistances.push(r);
    if (m.slowedStep && (!slowedStep || m.slowedStep < slowedStep)) slowedStep = m.slowedStep;
    if (m.rageSlowedStep && session?.rage && (!slowedStep || m.rageSlowedStep < slowedStep)) slowedStep = m.rageSlowedStep;
  }
  if (((session?.effects || []).some(e => normalizeName(e.name) === "strider's routine") || (normalizeName(profile?.className) === "scout" && (profile?.level || 1) >= 3 && !(session?.effects || []).some(e => normalizeName(e.name) === "unconscious" || normalizeName(e.name) === "dead") && hasClassOption(profile, session, "Strider's Routine"))) && (!slowedStep || 5 < slowedStep)) slowedStep = 5;
  const archP = archetypePassiveSummary(profile, session);
  Object.assign(speeds, archP.speeds);
  for (const r of archP.resistances) if (!resistances.includes(r)) resistances.push(r);
  for (const im of archP.immunities) if (!immunities.includes(im)) immunities.push(im);
  for (const s of archP.senses) if (!senses.includes(s)) senses.push(s);
  if (archP.slowedStep && (!slowedStep || archP.slowedStep < slowedStep)) slowedStep = archP.slowedStep;
  return {speeds, resistances, immunities, senses, slowedStep};
}

function summarizePowerEffects(eff, choice = "") {
  if (!eff) return "";
  const parts = [];
  if (choice) parts.push(choice);
  if (eff.acBonus) parts.push(signed(eff.acBonus) + " AC");
  if (eff.unarmoredACBonus) parts.push("+" + eff.unarmoredACBonus + " unarmored AC");
  if (eff.acBase) parts.push("AC " + eff.acBase + "+DEX");
  if (eff.speedBonus) parts.push("+" + eff.speedBonus + " ft");
  if (eff.speedMultiplier === 2) parts.push("×2 speed");
  if (eff.speedMultiplier === 0.5) parts.push("×½ speed");
  if (eff.speedZero) parts.push("Speed 0");
  if (eff.flySpeedZero) parts.push("Fly speed 0");
  if (eff.climbSpeed) parts.push("Climb");
  if (eff.swimSpeed) parts.push("Swim");
  if (eff.flySpeed) parts.push("Fly " + (typeof eff.flySpeed === "number" ? eff.flySpeed + " ft" : ""));
  if (eff.burrowSpeed) parts.push("Burrow");
  if (eff.resistances?.length) parts.push("Resist " + eff.resistances.join(", "));
  if (eff.immunities?.length) parts.push("Immune " + eff.immunities.join(", "));
  if (eff.appliesConditions?.length) parts.push(eff.appliesConditions.join(", "));
  if (eff.slowedLevels) parts.push("Slowed +" + eff.slowedLevels);
  if (eff.noReactions) parts.push("No reactions");
  if (eff.noHealing) parts.push("Cannot regain HP");
  if (eff.stealthBonus) parts.push(signed(eff.stealthBonus) + " Stealth");
  if (eff.attackBonus) parts.push(eff.attackBonus + " attacks");
  if (eff.weaponAttackBonus) parts.push("+" + eff.weaponAttackBonus + " weapon hit");
  if (eff.weaponDamageDice) parts.push(eff.weaponDamageDice + " damage");
  if (eff.saveBonus) parts.push(eff.saveBonus + " saves");
  if (eff.checkBonus) parts.push(eff.checkBonus + " checks");
  if (eff.allSaveAdv) parts.push("Adv all saves");
  if (eff.wisSaveAdv) parts.push("Adv WIS saves");
  if (eff.incomingAdvantage) parts.push("Incoming adv");
  if (eff.incomingDisadvantage) parts.push("Incoming disadvantage");
  if (eff.ignoreExhaustion) parts.push("Ignore exhaustion");
  if (eff.initiativeForceMod) parts.push("Force mod Initiative");
  if (eff.initiativeAdv) parts.push("Adv Initiative");
  if (eff.initiativeDice) parts.push(eff.initiativeDice + " Initiative");
  if (eff.senses?.length) parts.push(eff.senses.join(", "));
  return parts.join(" · ");
}
function activeEffectModifiers(profile, session) {
  const entries = (session?.effects || []).map(e => ({name: normalizeName(e.name), raw: e}));
  const has = target => entries.some(e => e.name === normalizeName(target));
  const scores = effectiveScores(profile, session);

  let acBonus = 0;
  const acSources = [];
  let unarmoredBase = 0;
  let unarmoredBaseSource = "";
  let speedBonus = 0;
  let speedMultiplier = 1;
  const speedSources = [];
  const altSpeeds = {};
  const resistances = [];
  const immunities = [];
  const senses = [];
  const rollModifiers = [];
  const tacticalNotes = [];
  let dexSaveBonus = 0;
  let allSaveBonus = 0;
  let maxHPBonus = 0;
  let dexSaveAdv = false;
  let incomingDisadvantage = false;

  // 1. Standard combat states (SW5e 3-tier cover: One-quarter +2, Half +3, Three-quarters +5; only highest applies)
  let coverBonus = 0;
  let coverSource = "";
  const applyCover = (val, label) => { if (val > coverBonus) { coverBonus = val; coverSource = label; } };
  const coverStepUp = hasClassOption(profile, session, "Cover Strategist");
  if (has("Three-quarters cover")) applyCover(5, "Three-quarters cover (+5)");
  else if (has("Half cover")) applyCover(coverStepUp ? 5 : 3, coverStepUp ? "Half cover → Three-quarters (+5 · Cover Strategist)" : "Half cover (+3)");
  else if (has("One-quarter cover")) applyCover(coverStepUp ? 3 : 2, coverStepUp ? "One-quarter → Half (+3 · Cover Strategist)" : "One-quarter cover (+2)");
  if (has("Empty Body")) {
    if (!resistances.includes("all (except force)")) resistances.push("all (except force)");
  }
  const conscious = !has("Unconscious") && !has("Dead");
  const guardAuraOn = normalizeName(profile?.className) === "guardian" && (profile?.level || 1) >= 3 && conscious;
  const scoutRoutineOn = normalizeName(profile?.className) === "scout" && (profile?.level || 1) >= 3 && conscious;
  let auraHatredBonus = 0;
  let sharpshooterBonus = 0;
  const auraPresEntry = entries.find(e => e.name === "aura of presence")?.raw;
  if (auraPresEntry || (guardAuraOn && hasClassOption(profile, session, "Aura of Presence"))) {
    const wMod = auraPresEntry ? Math.max(1, auraPresEntry.value || 1) : Math.max(1, modifier(scores.Wisdom));
    allSaveBonus += wMod;
    rollModifiers.push("Aura of Presence (" + signed(wMod) + " saves)");
  }
  const auraHatredEntry = entries.find(e => e.name === "aura of hatred")?.raw;
  if (auraHatredEntry || (guardAuraOn && hasClassOption(profile, session, "Aura of Hatred"))) {
    const cMod = auraHatredEntry ? Math.max(1, auraHatredEntry.value || 1) : Math.max(1, modifier(scores.Charisma));
    auraHatredBonus = cMod;
    tacticalNotes.push("Aura of Hatred: +" + cMod + " to first melee weapon damage roll each round");
  }
  const auraVigorEntry = entries.find(e => e.name === "aura of vigor (guardian)")?.raw;
  if (auraVigorEntry) {
    tacticalNotes.push("Aura of Vigor (Guardian): gain +" + Math.max(1, auraVigorEntry.value || 1) + " temporary HP at start of turn");
  }
  if (has("Aura of Warding") || (guardAuraOn && hasClassOption(profile, session, "Aura of Warding"))) {
    tacticalNotes.push("Aura of Warding: resistance to damage from force powers");
  }
  if (guardAuraOn && hasClassOption(profile, session, "Aura of Conquest")) {
    tacticalNotes.push("Aura of Conquest: frightened creatures starting turn in aura gain 4 slowed levels and take " + Math.max(1, Math.floor((profile.level || 3) / 2)) + " psychic damage");
  }
  if (guardAuraOn && hasClassOption(profile, session, "Aura of Protection")) {
    tacticalNotes.push("Aura of Protection: reaction when an ally in aura takes damage to take that damage yourself");
  }
  if (has("Warden's Routine") || (scoutRoutineOn && hasClassOption(profile, session, "Warden's Routine"))) {
    altSpeeds.climb = "walk";
    altSpeeds.swim = "walk";
  }
  if (has("Maven's Routine") || (scoutRoutineOn && hasClassOption(profile, session, "Maven's Routine"))) {
    tacticalNotes.push("Maven's Routine: resistance to damage from tech powers");
  }
  const ssEntry = entries.find(e => e.name === "sharpshooter's routine")?.raw;
  if (ssEntry || (scoutRoutineOn && hasClassOption(profile, session, "Sharpshooter's Routine"))) {
    const sv = ssEntry ? Math.max(1, ssEntry.value || 1) : Math.max(1, modifier(scores.Intelligence));
    sharpshooterBonus = sv;
    rollModifiers.push("Sharpshooter's Routine (+" + sv + " first weapon attack/turn)");
  }
  const paEntry = entries.find(e => e.name === "potent aptitude")?.raw;
  if (paEntry) {
    rollModifiers.push("Potent Aptitude (+" + (paEntry.value || 1) + " die)");
  }
  const caAllyEntry = entries.find(e => e.name === "critical analysis (ally)")?.raw;
  if (caAllyEntry) {
    rollModifiers.push("Critical Analysis (end no action: +" + Math.max(1, caAllyEntry.value || 1) + " to 1 attack/check/save)");
  }
  if (has("Ideal of the Hunter")) {
    senses.push("Blindsight 10 ft (Ideal of the Hunter)");
  }
  let oaDisadvantage = false;
  if (has("Ideal of the Agile")) {
    oaDisadvantage = true;
    rollModifiers.push("Opportunity attacks against you have disadvantage (Ideal of the Agile)");
    tacticalNotes.push("Ideal of the Agile: opportunity attacks against you have disadvantage");
  }
  if (session.rage && typeof hasClassOption === "function" && hasClassOption(profile, session, "Loth-cat's Instinct")) {
    oaDisadvantage = true;
    rollModifiers.push("Opportunity attacks against you have disadvantage (Loth-cat's Instinct)");
  }
  if (has("Force Shield")) {
    const bonus = Math.max(1, modifier(scores.Wisdom), modifier(scores.Charisma));
    acBonus += bonus;
    acSources.push("Force Shield (" + signed(bonus) + ")");
  }
  const ashlaEntry = entries.find(e => e.name === "force affinity: ashla")?.raw;
  if (ashlaEntry) {
    const ashlaLvl = Math.max(1, ashlaEntry.value || 1);
    maxHPBonus += ashlaLvl;
    rollModifiers.push("Force Affinity: Ashla (+" + ashlaLvl + " Max HP)");
  }
  if (has("Force-Empowered Self: Deflection")) {
    const entry = entries.find(e => e.name === "force-empowered self: deflection")?.raw;
    const bonus = entry?.value || 2;
    acBonus += bonus;
    acSources.push("Deflection (" + signed(bonus) + ")");
  }
  if (has("Force-Empowered Self: Slow Time")) {
    const entry = entries.find(e => e.name === "force-empowered self: slow time")?.raw;
    const bonus = entry?.value || 10;
    speedBonus += bonus;
    speedSources.push("Slow Time (+" + bonus + " ft)");
  }
  if (has("Hidden")) incomingDisadvantage = true;
  let strConSaveBonus = 0;
  let bodyOverBother = has("Body Over Bother");
  let mindOverMatter = has("Mind Over Matter");
  let damageReduction = 0;
  let attackDamageBonus = 0;
  let blindfightingDoubled = has("Blindfighting: Doubled");

  const valueOf = target => entries.find(e => e.name === normalizeName(target))?.raw?.value || 0;
  if (has("Evasive Footwork")) {
    const v = valueOf("Evasive Footwork") || 1;
    acBonus += v;
    acSources.push("Evasive Footwork (" + signed(v) + ")");
  }
  if (has("Primal Endurance")) {
    const v = valueOf("Primal Endurance") || 1;
    acBonus += v;
    acSources.push("Primal Endurance (" + signed(v) + ")");
  }
  if (has("Steady the Nerves")) {
    const v = valueOf("Steady the Nerves") || 1;
    allSaveBonus += v;
    rollModifiers.push("Steady the Nerves (" + signed(v) + " saves)");
  }
  if (has("Precise Movements")) {
    const v = valueOf("Precise Movements") || 5;
    speedBonus += v;
    speedSources.push("Precise Movements (+" + v + " ft)");
  }
  if (has("Charge")) {
    const v = valueOf("Charge") || 5;
    speedBonus += v;
    speedSources.push("Charge (+" + v + " ft)");
  }
  if (has("Incite")) {
    const v = valueOf("Incite") || 1;
    attackDamageBonus += v;
    rollModifiers.push("Incite (" + signed(v) + " damage)");
  }
  if (has("Adrenaline Hit")) {
    const v = valueOf("Adrenaline Hit") || 1;
    damageReduction += v;
    tacticalNotes.push("Adrenaline Hit: reduce incoming damage by " + v);
  }
  if (has("Enhancement Injection") && (session?.temp || 0) > 0) {
    const v = valueOf("Enhancement Injection") || 1;
    strConSaveBonus += v;
    rollModifiers.push("Enhancement Injection (" + signed(v) + " STR/CON checks & saves)");
  }
  if (has("Equilibrium Mark")) {
    const eqBonus = Math.max(1, Math.floor(modifier(scores.Dexterity) / 2));
    acBonus += eqBonus;
    dexSaveBonus += eqBonus;
    acSources.push("Equilibrium Mark (" + signed(eqBonus) + " vs marked)");
  }
  if (has("Defense Mark")) {
    const defRed = Math.max(1, Math.floor(Math.max(modifier(scores.Strength), modifier(scores.Constitution)) / 2));
    tacticalNotes.push("Defense Mark: reduce damage from marked target by " + defRed + " (min 1)");
  }
  if (has("Secured: Light Shield")) {
    acBonus += 1;
    acSources.push("Secured: Light Shield (+1)");
  }
  if (has("Dual Wield AC")) {
    const v = valueOf("Dual Wield AC") || 1;
    acBonus += v;
    acSources.push("Dual Wield Mastery (" + signed(v) + ")");
  }
  if (has("Defensive Ball")) {
    const v = Math.max(1, Math.floor((profile?.proficiency || 2) / 2));
    acBonus += v;
    acSources.push("Defensive Ball (" + signed(v) + ")");
  }
  if (has("Duelist Mastery (+prof AC)")) {
    const v = profile?.proficiency || 2;
    acBonus += v;
    acSources.push("Duelist Mastery (" + signed(v) + " vs 1 melee hit)");
  }
  if (has("Secured Mastery (+prof AC)")) {
    const v = profile?.proficiency || 2;
    acBonus += v;
    acSources.push("Secured Mastery (" + signed(v) + " vs 1 hit)");
  }
  let initiativeFlatBonus = 0;
  const initiativeFlatSources = [];
  let conSaveBonus = 0;
  const skillBonuses = {};
  const addSkillBonus = (skName, val) => { skillBonuses[skName] = (skillBonuses[skName] || 0) + val; };
  let feintingAttackAdv = has("Feinting Attack");
  if (has("One Step Ahead")) {
    const v = valueOf("One Step Ahead") || 1;
    initiativeFlatBonus += v;
    initiativeFlatSources.push("One Step Ahead (" + signed(v) + ")");
    rollModifiers.push("One Step Ahead (" + signed(v) + " Initiative)");
  }
  if (has("Self-Preservation")) {
    const v = valueOf("Self-Preservation") || 1;
    allSaveBonus += v;
    rollModifiers.push("Self-Preservation (" + signed(v) + " save)");
  }
  if (has("Firewall")) {
    const v = valueOf("Firewall") || 1;
    allSaveBonus += v;
    rollModifiers.push("Firewall (" + signed(v) + " vs tech save)");
  }
  if (has("Heads Up")) {
    const v = valueOf("Heads Up") || 1;
    allSaveBonus += v;
    rollModifiers.push("Heads Up (" + signed(v) + " save)");
  }
  if (has("One with the Force")) {
    const v = valueOf("One with the Force") || 1;
    conSaveBonus += v;
    rollModifiers.push("One with the Force (" + signed(v) + " CON concentration save)");
  }
  if (has("Targeted Strike")) {
    const v = valueOf("Targeted Strike") || 1;
    attackDamageBonus += v;
    rollModifiers.push("Targeted Strike (" + signed(v) + " attack & damage)");
  }
  if (has("Conceal")) { const v = valueOf("Conceal") || 1; addSkillBonus("Stealth", v); rollModifiers.push("Conceal (+" + v + " Stealth)"); }
  if (has("Flex")) { const v = valueOf("Flex") || 1; addSkillBonus("Athletics", v); rollModifiers.push("Flex (+" + v + " Athletics)"); }
  if (has("Perceive")) { const v = valueOf("Perceive") || 1; addSkillBonus("Perception", v); rollModifiers.push("Perceive (+" + v + " Perception)"); }
  if (has("Tumble")) { const v = valueOf("Tumble") || 1; addSkillBonus("Acrobatics", v); rollModifiers.push("Tumble (+" + v + " Acrobatics)"); }
  if (has("Assess the Situation")) { const v = valueOf("Assess the Situation") || 1; addSkillBonus("Perception", v); addSkillBonus("Investigation", v); rollModifiers.push("Assess the Situation (+" + v + " Perception/Investigation)"); }
  if (has("Wild Senses")) { const v = valueOf("Wild Senses") || 1; addSkillBonus("Perception", v); addSkillBonus("Survival", v); rollModifiers.push("Wild Senses (+" + v + " Perception/Survival)"); }
  if (bodyOverBother) rollModifiers.push("Body Over Bother (STR/DEX/CON saves use best physical mod)");
  if (mindOverMatter) rollModifiers.push("Mind Over Matter (INT/WIS/CHA saves use best mental mod)");

  // 2. Data-driven ongoing powers from SW5E_POWERS (170 verbatim-verified ongoing powers)
  let unarmoredACBonus = 0;
  let unarmoredACBonusSource = "";
  let minAC = 0;
  let minACSource = "";
  const removedResistances = [];
  let stealthBonus = 0;
  let stealthAdv = false;
  let mindTrickDisadv = false;
  let allCheckAdv = false;
  let allSaveAdv = false;
  let wisSaveAdv = false;
  let strDexConSaveAdv = false;
  let dexSaveDisadv = false;
  let poisonSaveAdv = false;
  let flexibleAdv = false;
  const abilityCheckAdv = new Set();
  const abilityCheckDisadv = new Set();
  const abilitySaveDisadv = new Set();
  let allAttackAdv = false;
  let meleeWeaponAdv = false;
  let allAttackDisadv = false;
  let weaponAttackBonus = has("Targeted Strike") ? (valueOf("Targeted Strike") || 1) : 0;
  let weaponDamageBonus = 0;
  const weaponDamageDice = [];
  let meleeUsesForceMod = false;
  let strConSaveProf = false;
  let initiativeForceMod = false;
  let initiativeAdv = false;
  const initiativeDice = [];
  let flySpeedZero = false;
  let carryingMultiplier = 1;
  const skillExpertiseGrants = [];
  let unarmedDieStep = 0;
  let unarmedBonus = 0;

  for (const {raw} of entries) {
    const p = powerRule(raw.name);
    const eff = p?.effects;
    if (eff) {
      if (eff.charges?.perTurn && raw.surgeActive === false) continue;
      const castLvl = raw.castLevel || eff.baseLevel || p.level || 1;
      const choice = String(raw.choice || "").trim();
      const choices = Array.isArray(raw.choices) ? raw.choices : (choice ? [choice] : []);

      // Dynamic cover charges (Telekinetic Shield: SW5e 3+ piles = +5, 2 = +3, 1 = +2; non-stacking cover)
      if (eff.charges?.dynamicCover && (raw.charges ?? eff.charges.base) > 0) {
        const chCount = raw.charges ?? eff.charges.base;
        const covBonus = chCount >= 3 ? 5 : chCount === 2 ? 3 : 2;
        applyCover(covBonus, p.name + " (+" + covBonus + " · " + chCount + " piles)");
      }

      if (eff.acBonus) {
        acBonus += eff.acBonus;
        acSources.push(p.name + " (" + signed(eff.acBonus) + ")");
      }
      if (eff.unarmoredACBonus) {
        unarmoredACBonus += eff.unarmoredACBonus;
        unarmoredACBonusSource = p.name + " (+" + eff.unarmoredACBonus + " melee / +" + (eff.unarmoredACBonus + 1) + " ranged)";
      }
      if (eff.acBase && eff.acBase > unarmoredBase) {
        unarmoredBase = eff.acBase;
        unarmoredBaseSource = p.name + " (" + eff.acBase + " + DEX)";
      }
      if (eff.speedBonus) {
        speedBonus += eff.speedBonus;
        speedSources.push(p.name + " (+" + eff.speedBonus + " ft)");
      }
      if (eff.speedMultiplier) {
        speedMultiplier *= eff.speedMultiplier;
        speedSources.push(p.name + " (×" + (eff.speedMultiplier === 0.5 ? "½" : eff.speedMultiplier) + ")");
      }
      if (eff.flySpeedZero) flySpeedZero = true;
      if (eff.climbSpeed) altSpeeds.climb = eff.climbSpeed;
      if (eff.swimSpeed) altSpeeds.swim = eff.swimSpeed;
      if (eff.flySpeed) altSpeeds.fly = eff.flySpeed;
      if (eff.burrowSpeed) altSpeeds.burrow = eff.burrowSpeed;
      for (const r of eff.resistances || []) if (!resistances.includes(r)) resistances.push(r);
      for (const im of eff.immunities || []) if (!immunities.includes(im)) immunities.push(im);
      for (const s of eff.senses || []) if (!senses.includes(s)) senses.push(s);
      if (eff.dexSaveBonus) dexSaveBonus += eff.dexSaveBonus;
      if (eff.allSaveBonus) allSaveBonus += eff.allSaveBonus;
      if (eff.maxHPBase) {
        maxHPBonus += eff.maxHPBase + Math.max(0, castLvl - (eff.baseLevel || 1)) * (eff.maxHPPerUpcast || 0);
      }
      if (eff.dexSaveAdv) dexSaveAdv = true;
      if (eff.dexSaveDisadv) dexSaveDisadv = true;
      if (eff.allSaveAdv) allSaveAdv = true;
      if (eff.wisSaveAdv) wisSaveAdv = true;
      if (eff.poisonSaveAdv) poisonSaveAdv = true;
      if (eff.strDexConSaveAdvWhileTemp && (session?.temp || 0) > 0) strDexConSaveAdv = true;
      if (eff.saveBonusWhileTemp && (session?.temp || 0) > 0) {
        rollModifiers.push(p.name + " (" + eff.saveBonusWhileTemp + " saves while temporary HP lasts)");
      }
      if (eff.incomingDisadvantage) incomingDisadvantage = true;
      if (eff.stealthBonus) {
        stealthBonus += eff.stealthBonus;
        rollModifiers.push(p.name + " (+" + eff.stealthBonus + " Stealth)");
      }
      if (eff.stealthAdv) stealthAdv = true;
      if (normalizeName(p.name) === "mind trick") mindTrickDisadv = true;
      if (eff.allCheckAdv) allCheckAdv = true;
      if (eff.allAttackAdv) allAttackAdv = true;
      if (eff.meleeWeaponAdv) meleeWeaponAdv = true;
      if (eff.allAttackDisadv) allAttackDisadv = true;
      if (eff.meleeUsesForceMod) meleeUsesForceMod = true;
      if (eff.strConSaveProf) strConSaveProf = true;
      if (eff.initiativeForceMod) initiativeForceMod = true;
      if (eff.initiativeAdv) initiativeAdv = true;
      if (eff.initiativeDice) initiativeDice.push(eff.initiativeDice + " (" + p.name + ")");

      // Weapon attack & damage bonuses (including upcast steps for Force Weapon & Enhance Weapon)
      if (eff.upcastWeaponBonus) {
        let stepBonus = 1;
        for (const [lvlReq, val] of eff.upcastWeaponBonus.steps || []) {
          if (castLvl >= lvlReq) stepBonus = val;
        }
        weaponAttackBonus += stepBonus;
        if (eff.weaponDamageBonus) weaponDamageBonus += stepBonus;
        if (normalizeName(p.name) === "enhance weapon") {
          weaponDamageDice.push("+" + stepBonus + "d4" + (choice ? " " + choice.toLowerCase() : "") + " (" + p.name + ")");
        }
      } else {
        if (eff.weaponAttackBonus) weaponAttackBonus += eff.weaponAttackBonus;
        if (eff.weaponDamageBonus) weaponDamageBonus += eff.weaponDamageBonus;
      }
      if (eff.weaponDamageDice) {
        if (!(eff.charges && !eff.charges.perTurn && raw.charges === 0)) {
          weaponDamageDice.push(eff.weaponDamageDice + " (" + p.name + ")");
        }
      }

      // Choice-based power mechanics
      if (eff.choiceKind === "energyDamageType" || eff.choiceKind === "disperseDamageType") {
        const dt = choice.toLowerCase();
        if (dt) {
          if (normalizeName(p.name) === "elemental accelerant") {
            if (!removedResistances.includes(dt)) removedResistances.push(dt);
            tacticalNotes.push(p.name + ": loses " + dt + " resistance and takes +2d6 " + dt + " damage");
          } else if (normalizeName(p.name) !== "enhance weapon") {
            if (!resistances.includes(dt)) resistances.push(dt);
          }
        }
      } else if (eff.choiceKind === "forceEnlightenment" || eff.choiceKind === "enhanceDroid") {
        const cLow = choice.toLowerCase();
        if (cLow.includes("strength") || cLow.includes("servomotor")) {
          abilityCheckAdv.add("Strength");
          carryingMultiplier = Math.max(carryingMultiplier, 2);
        } else if (cLow.includes("dexterity") || cLow.includes("motivator")) {
          abilityCheckAdv.add("Dexterity");
          tacticalNotes.push(p.name + ": no falling damage from ≤20 ft while not incapacitated");
        } else if (cLow.includes("constitution") || cLow.includes("power core")) {
          abilityCheckAdv.add("Constitution");
        } else if (cLow.includes("intelligence") || cLow.includes("databanks")) {
          abilityCheckAdv.add("Intelligence");
        } else if (cLow.includes("wisdom") || cLow.includes("sensors")) {
          abilityCheckAdv.add("Wisdom");
        } else if (cLow.includes("charisma") || cLow.includes("relations")) {
          abilityCheckAdv.add("Charisma");
        }
      } else if (eff.choiceKind === "alterSelf") {
        const cLow = choice.toLowerCase();
        if (cLow.includes("aquatic")) altSpeeds.swim = "walk";
        else if (cLow.includes("natural weapons")) {
          unarmedDieStep += 1;
          unarmedBonus += 1;
        }
      } else if (eff.choiceKind === "mutateAugment") {
        for (const ch of choices) {
          const cLow = String(ch).toLowerCase();
          if (cLow.includes("hardened flesh")) {
            if (16 > minAC) { minAC = 16; minACSource = "Mutate/Augment (Hardened Flesh)"; }
          } else if (cLow.includes("tremorsense")) {
            if (!senses.includes("Tremorsense 30 ft")) senses.push("Tremorsense 30 ft");
          } else if (cLow.includes("burrow")) {
            altSpeeds.burrow = "walk";
          } else if (cLow.includes("climb")) {
            altSpeeds.climb = "walk";
          } else if (cLow.includes("reach")) {
            tacticalNotes.push("Mutate/Augment: +5 ft melee reach");
          } else if (cLow.includes("flexible")) {
            flexibleAdv = true;
          }
        }
      } else if (eff.choiceKind === "bestowCurse") {
        if (abilities.includes(choice)) {
          abilityCheckDisadv.add(choice);
          abilitySaveDisadv.add(choice);
        } else if (choice) {
          tacticalNotes.push(p.name + ": " + choice);
        }
      } else if (eff.choiceKind === "abilityCheckDisadv") {
        if (abilities.includes(choice)) abilityCheckDisadv.add(choice);
      } else if (eff.choiceKind === "skillExpertise") {
        if (choice && skills[choice]) skillExpertiseGrants.push(choice);
      }

      if (eff.attackBonus || eff.saveBonus || eff.checkBonus) {
        const bits = [
          eff.attackBonus ? eff.attackBonus + " attacks" : "",
          eff.saveBonus ? eff.saveBonus + " saves" : "",
          eff.checkBonus ? eff.checkBonus + " checks" : ""
        ].filter(Boolean).join(", ");
        rollModifiers.push(p.name + " (" + bits + ")");
      }
      for (const n of eff.notes || []) tacticalNotes.push(p.name + ": " + n);
      continue;
    }

    // 3. Active custom features (e.g. manifested Sentinel Ideals)
    const cf = (profile?.customFeatures || []).find(f => normalizeName(f.name) === normalizeName(raw.name));
    if (cf) {
      const activeClause = String(cf.content || "").split(/\n\s*Additionally,\s+as a bonus action/i)[1] || cf.content;
      const parsed = parseTextPassiveEffects(activeClause, false);
      Object.assign(altSpeeds, parsed.speeds);
      for (const s of parsed.senses) if (!senses.includes(s)) senses.push(s);
      for (const n of parsed.notes) tacticalNotes.push(cf.name + ": " + n);
    }
  }

  let critRangeBonus = 0;
  let nimanForceMelee = false;
  let soresuHalfDamage = false;
  let noCloseRangedDisadv = false;
  const halfForce = Math.max(1, Math.floor(Math.max(modifier(scores.Wisdom), modifier(scores.Charisma)) / 2));
  for (const activeForm of activeLightsaberForms(session)) {
    const fm = activeForm.mechanics;
    if (!fm) continue;
    if (fm.acHalfForceMod) {
      acBonus += halfForce;
      acSources.push(activeForm.name + " (" + signed(halfForce) + " vs 1 attack)");
      tacticalNotes.push(activeForm.name + ": +" + halfForce + " AC against one attack before end of next turn");
    } else if (fm.halfForceModStrBonus) {
      tacticalNotes.push(activeForm.name + ": +" + halfForce + " to one STR check or attack roll before end of next turn");
    } else if (fm.summary) {
      tacticalNotes.push(activeForm.name + ": " + fm.summary);
    }
    if (fm.critRangeBonus) critRangeBonus += fm.critRangeBonus;
    if (fm.meleeUsesForceMod) nimanForceMelee = true;
    if (fm.firstHitHalfWeaponDamage) soresuHalfDamage = true;
    if (fm.noCloseRangedDisadv) noCloseRangedDisadv = true;
  }

  if (coverBonus > 0) {
    acBonus += coverBonus;
    dexSaveBonus += coverBonus;
    acSources.push(coverSource);
  }
  const archP = archetypePassiveSummary(profile, session);
  if (archP.acBonus) { acBonus += archP.acBonus; acSources.push(...archP.acSources); }
  if (archP.unarmoredBase && archP.unarmoredBase > unarmoredBase) {
    unarmoredBase = archP.unarmoredBase;
    unarmoredBaseSource = archP.unarmoredBaseSource;
  }
  if (archP.initAdv) initiativeAdv = true;
  if (archP.initBonus) {
    const abMap = {INT: "Intelligence", WIS: "Wisdom", CHA: "Charisma", STR: "Strength", DEX: "Dexterity", CON: "Constitution"};
    const iv = archP.initBonus === "PROF" ? (profile?.proficiency || 2)
      : archP.initBonus === "HALF_PROF" ? Math.floor((profile?.proficiency || 2) / 2)
      : abMap[archP.initBonus] ? modifier(effectiveScores(profile, session)[abMap[archP.initBonus]])
      : Number(archP.initBonus) || 0;
    if (iv) {
      initiativeFlatBonus += iv;
      initiativeFlatSources.push((session?.approach || "Archetype") + " (" + signed(iv) + ")");
    }
  }
  if (archP.saveBonuses?.all) allSaveBonus += archP.saveBonuses.all;
  if (archP.critRangeBonus) critRangeBonus += archP.critRangeBonus;
  return {
    acBonus, acSources,
    unarmoredBase, unarmoredBaseSource,
    speedBonus, speedMultiplier, speedSources,
    altSpeeds, resistances, immunities, senses,
    rollModifiers, oaDisadvantage,
    tacticalNotes,
    dexSaveBonus, allSaveBonus, maxHPBonus, dexSaveAdv, incomingDisadvantage,
    critRangeBonus, nimanForceMelee, soresuHalfDamage, noCloseRangedDisadv,
    strConSaveBonus, bodyOverBother, mindOverMatter, damageReduction, attackDamageBonus, blindfightingDoubled,
    unarmoredACBonus, unarmoredACBonusSource, minAC, minACSource, removedResistances,
    stealthBonus, stealthAdv, mindTrickDisadv, allCheckAdv, allSaveAdv, wisSaveAdv, strDexConSaveAdv,
    dexSaveDisadv, poisonSaveAdv, flexibleAdv, abilityCheckAdv, abilityCheckDisadv, abilitySaveDisadv,
    allAttackAdv, meleeWeaponAdv, allAttackDisadv, weaponAttackBonus, weaponDamageBonus, weaponDamageDice,
    meleeUsesForceMod, strConSaveProf, initiativeForceMod, initiativeAdv, initiativeDice,
    flySpeedZero, carryingMultiplier, skillExpertiseGrants, unarmedDieStep, unarmedBonus,
    initiativeFlatBonus, initiativeFlatSources, conSaveBonus, skillBonuses, feintingAttackAdv,
    auraHatredBonus, sharpshooterBonus
  };
}

function savingThrowTotal(profile, session, ability, c = null, effMods = null) {
  const cond = c || conditionState(session, profile);
  const mods = effMods || activeEffectModifiers(profile, session);
  const traits = characterTraits(profile, session);
  let saveRank = traits.savingThrowRanks?.get(ability) || (traits.savingThrows.has(ability) ? 1 : 0);
  if (mods.strConSaveProf && (ability === "Strength" || ability === "Constitution")) saveRank = Math.max(saveRank, 1);
  const adaptBonus = (saveRank === 0 && (session?.effects || []).some(e => normalizeName(e.name) === "adaptability routine" && e.choice === ability)) ? Math.floor(profile.proficiency / 2) : 0;
  let baseMod = effectiveModifier(profile, session, ability, cond);
  let substitutedFrom = "";

  if (mods.bodyOverBother && ["Strength", "Dexterity", "Constitution"].includes(ability)) {
    const best = ["Strength", "Dexterity", "Constitution"].reduce((acc, ab) => {
      const m = effectiveModifier(profile, session, ab, cond);
      return m > acc.mod ? {ab, mod: m} : acc;
    }, {ab: ability, mod: baseMod});
    if (best.mod > baseMod) {
      baseMod = best.mod;
      substitutedFrom = best.ab + " (Body Over Bother)";
    }
  }
  if (mods.mindOverMatter && ["Intelligence", "Wisdom", "Charisma"].includes(ability)) {
    const best = ["Intelligence", "Wisdom", "Charisma"].reduce((acc, ab) => {
      const m = effectiveModifier(profile, session, ab, cond);
      return m > acc.mod ? {ab, mod: m} : acc;
    }, {ab: ability, mod: baseMod});
    if (best.mod > baseMod) {
      baseMod = best.mod;
      substitutedFrom = best.ab + " (Mind Over Matter)";
    }
  }

  // Rigid armor property: add half DEX mod (rounded down) instead of full DEX mod on DEX saves (negative DEX still full)
  let rigidNote = "";
  if (ability === "Dexterity" && baseMod > 0 && !substitutedFrom) {
    const eqArm = equippedRule(session, "armor");
    if (eqArm?.properties?.some(p => /^rigid$/i.test(p))) {
      baseMod = Math.floor(baseMod / 2);
      rigidNote = "Rigid armor (½ DEX)";
    }
  }
  const effectBonus =
    (ability === "Dexterity" ? (mods.dexSaveBonus || 0) : 0) +
    ((ability === "Strength" || ability === "Constitution") ? (mods.strConSaveBonus || 0) : 0) +
    (ability === "Constitution" ? (mods.conSaveBonus || 0) : 0) +
    (mods.allSaveBonus || 0);
  return {
    total: baseMod + saveRank * profile.proficiency + adaptBonus + effectBonus,
    baseMod,
    saveRank,
    effectBonus,
    substitutedFrom: substitutedFrom || rigidNote
  };
}

function characterTraits(profile, session) {
  const cls = classRecord(profile?.className);
  const sp = speciesRecord(profile?.species);
  const speciesTraits = new Set((profile?.speciesTraits || sp?.traits?.map(t => t.name) || []).map(normalizeName));
  const clsKey = normalizeName(profile?.className);
  const isBerserker = clsKey === "berserker";
  const isMonk = clsKey === "monk";
  const isSentinel = clsKey === "sentinel";
  const isConsular = clsKey === "consular";
  const isFighter = clsKey === "fighter";
  const isGuardian = clsKey === "guardian";
  const isOperative = clsKey === "operative";
  const isScholar = clsKey === "scholar";
  const isScout = clsKey === "scout";
  const isEngineer = clsKey === "engineer";

  const armorProficiencies = new Set();
  for (const entry of cls?.armorProficiencies || []) {
    const low = entry.toLowerCase();
    if (low.includes("all armor")) {
      armorProficiencies.add("Light");
      armorProficiencies.add("Medium");
      armorProficiencies.add("Heavy");
      armorProficiencies.add("Shield");
    } else {
      if (low.includes("light")) { armorProficiencies.add("Light"); armorProficiencies.add("Shield"); }
      if (low.includes("medium")) { armorProficiencies.add("Medium"); armorProficiencies.add("Shield"); }
      if (low.includes("heavy")) { armorProficiencies.add("Heavy"); armorProficiencies.add("Shield"); }
      if (low.includes("shield")) armorProficiencies.add("Shield");
    }
  }
  const hadLightArmorProf = armorProficiencies.has("Light");
  if (hasFeat(session, "Armor Expert") && !hadLightArmorProf) {
    armorProficiencies.add("Light");
  }

  const weaponProficiencies = new Set();
  const weaponChecks = [];
  const rawWepText = (cls?.weaponProficiencies || []).join(", ").toLowerCase();
  if (rawWepText.includes("all vibroweapons")) {
    weaponProficiencies.add("SimpleVibroweapon");
    weaponProficiencies.add("MartialVibroweapon");
  } else if (rawWepText.includes("simple vibroweapons")) {
    weaponProficiencies.add("SimpleVibroweapon");
  }
  if (rawWepText.includes("all blasters")) {
    weaponProficiencies.add("SimpleBlaster");
    weaponProficiencies.add("MartialBlaster");
  } else if (rawWepText.includes("simple blasters")) {
    weaponProficiencies.add("SimpleBlaster");
  }
  if (rawWepText.includes("all lightweapons")) {
    weaponProficiencies.add("SimpleLightweapon");
    weaponProficiencies.add("MartialLightweapon");
  } else if (rawWepText.includes("simple lightweapons")) {
    weaponProficiencies.add("SimpleLightweapon");
  }
  if (rawWepText.includes("martial vibroweapons with the finesse property")) {
    weaponChecks.push(r => r.classification === "MartialVibroweapon" && (r.properties || []).some(p => /^finesse$/i.test(p)));
  }
  if (rawWepText.includes("martial lightweapons with the finesse property")) {
    weaponChecks.push(r => r.classification === "MartialLightweapon" && (r.properties || []).some(p => /^finesse$/i.test(p)));
  }
  if (rawWepText.includes("martial vibroweapons that lack the dexterity")) {
    weaponChecks.push(r => r.classification === "MartialVibroweapon" && !(r.properties || []).some(p => /^(dexterity|heavy|special|two-handed)\b/i.test(p)));
  }
  if (rawWepText.includes("martial blasters that lack the auto")) {
    weaponChecks.push(r => r.classification === "MartialBlaster" && !(r.properties || []).some(p => /^(auto|special|strength|two-handed)\b/i.test(p)));
  }
  for (const w of sp?.weaponProficiencies || []) weaponProficiencies.add(normalizeName(w));
  for (const a of sp?.armorProficiencies || []) armorProficiencies.add(a);
  for (const cp of profile?.customProficiencies || []) {
    const low = normalizeName(cp);
    if (low) weaponProficiencies.add(low);
  }

  const step = classLevelStep(profile);
  const scores = effectiveScores(profile, session);
  const monkUnarmoredAbility = modifier(scores.Wisdom) >= modifier(scores.Charisma) ? "Wisdom" : "Charisma";
  const unarmoredDefense = isBerserker ? "Constitution" : isMonk ? monkUnarmoredAbility : "";
  const unarmoredMovement = isMonk ? parseNumericStat(step["Unarmored Movement"]) : 0;
  const martialArtsDie = isMonk ? parseNumericStat(String(step["Martial Arts"] || "").replace(/^1d/i, "")) : 0;
  const sneakAttack = step["Sneak Attack"] || "";
  const rangersQuarry = step["Ranger's Quarry"] || "";

  const savingThrowRanks = new Map();
  for (const ab of cls?.savingThrows || []) savingThrowRanks.set(ab, 1);
  if (isMonk && (profile?.level || 1) >= 14) {
    for (const ab of abilities) savingThrowRanks.set(ab, Math.max(1, savingThrowRanks.get(ab) || 0));
  }
  let featSpeedBonus = 0;
  const featSpeedSources = [];
  let armorExpertLightSpeed = false;
  let carryingMultiplier = 1;
  let passiveBonus = 0;
  let castingDCBonus = 0;
  let castingAttackBonus = 0;
  let corrodedIgnore = 0;
  let initiativeProf = false;
  let quickWitted = false;

  for (const feat of session?.feats || []) {
    const rule = featRule(feat.name);
    const mech = rule?.mechanics || {};
    if (mech.saveChoice && abilities.includes(feat.abilityChoice)) {
      savingThrowRanks.set(feat.abilityChoice, Math.max(1, savingThrowRanks.get(feat.abilityChoice) || 0));
    }
    if (mech.saveProf) {
      const cur = savingThrowRanks.get(mech.saveProf) || 0;
      savingThrowRanks.set(mech.saveProf, mech.saveUpgrade ? Math.min(2, cur + 1) : Math.max(1, cur));
    }
    if (mech.speedBonus) {
      featSpeedBonus += mech.speedBonus;
      featSpeedSources.push(feat.name + " (+" + mech.speedBonus + " ft)");
    }
    if (mech.armorExpertLightSpeed && hadLightArmorProf) armorExpertLightSpeed = true;
    if (mech.carryingMultiplier) carryingMultiplier = Math.max(carryingMultiplier, mech.carryingMultiplier);
    if (mech.passiveBonus) passiveBonus += mech.passiveBonus;
    if (mech.castingDCBonus) castingDCBonus += mech.castingDCBonus;
    if (mech.castingAttackBonus) castingAttackBonus += mech.castingAttackBonus;
    if (mech.corrodedIgnore) corrodedIgnore += mech.corrodedIgnore;
    if (mech.initiativeProf) initiativeProf = true;
    if (mech.initiativeAbility === "Intelligence") quickWitted = true;
  }
  const opts = ownedCombatOptions(profile, session);
  if (isMonk && (profile?.level || 1) >= 14) {
    for (const ab of abilities) {
      savingThrowRanks.set(ab, Math.max(savingThrowRanks.get(ab) || 0, 1));
    }
  }
  if (isOperative && (profile?.level || 1) >= 15) {
    savingThrowRanks.set("Wisdom", Math.max(savingThrowRanks.get("Wisdom") || 0, 1));
  }
  let classOptSpeedBonus = 0;
  let classOptUnarmedStep = 0;
  let classOptUnarmedFinesse = false;
  let classOptUnarmedCrit = 0;
  let monkArmorAllowed = false;
  let monkUsesForceMod = false;
  let focusMaxHalfForceMod = false;
  let classOptCarryingDouble = false;
  let classOptInitProf = false;
  let classOptUnlocksForms = false;
  for (const co of ownedClassOptions(profile, session)) {
    const m = co.mechanics;
    if (!m) continue;
    for (const ap of m.armorProf || []) armorProficiencies.add(ap);
    if (m.weaponProfCategory === "Lightweapon") {
      weaponProficiencies.add("SimpleLightweapon");
      weaponProficiencies.add("MartialLightweapon");
    }
    if (m.speedBonus) classOptSpeedBonus += m.speedBonus;
    if (m.unarmedDieStep) classOptUnarmedStep += m.unarmedDieStep;
    if (m.unarmedFinesse) classOptUnarmedFinesse = true;
    if (m.unarmedCritBonus) classOptUnarmedCrit += m.unarmedCritBonus;
    if (m.monkArmorAllowed) monkArmorAllowed = true;
    if (m.monkUsesForceMod) monkUsesForceMod = true;
    if (m.focusMaxHalfForceMod) focusMaxHalfForceMod = true;
    if (m.carryingDouble) classOptCarryingDouble = true;
    if (m.initiativeProf) classOptInitProf = true;
    if (m.unlocksLightsaberForms) classOptUnlocksForms = true;
  }
  const allOptMechs = [...opts.styles, ...opts.masteries].map(o => o.mechanics || {});
  const superiorityBonus = opts.styles.reduce((sum, st) => sum + (st.mechanics?.superiorityBonus || 0), 0);
  const unarmedDieStep = allOptMechs.reduce((sum, m) => sum + (m.unarmedDieStep || 0), 0) + classOptUnarmedStep;
  const twfAddAbilityMod = allOptMechs.some(m => m.twfAddAbilityMod);
  const dwfAddAbilityModToHit = allOptMechs.some(m => m.dwfAddAbilityModToHit);
  const twfIgnoreLight = allOptMechs.some(m => m.twfIgnoreLight);
  const dwfIgnoreLight = allOptMechs.some(m => m.dwfIgnoreLight);
  const ignoreObtrusiveShield = allOptMechs.some(m => m.ignoreObtrusiveShield);
  const reduceStrengthReqStep = allOptMechs.reduce((sum, m) => sum + (m.reduceStrengthReqStep || 0), 0);
  const shieldBonusToDexSaves = allOptMechs.some(m => m.shieldBonusToDexSaves);
  const medHeavyArmorDmgReduction = allOptMechs.some(m => m.medHeavyArmorDmgReduction === "prof") ? (profile?.proficiency || 2) : 0;
  const noCloseRangedDisadv = allOptMechs.some(m => m.noCloseRangedDisadv);
  const noLongRangeDisadv = allOptMechs.some(m => m.noLongRangeDisadv);
  const noThrownLongRangeDisadv = allOptMechs.some(m => m.noThrownLongRangeDisadv);
  const minDamageThresholds = new Set(allOptMechs.map(m => m.minDamageThreshold).filter(Boolean));
  const powerAttacks = new Set(allOptMechs.map(m => m.powerAttack).filter(Boolean));
  const coverReductions = new Set(allOptMechs.map(m => m.rangedCoverReduction).filter(Boolean));
  const catMap = {
    "simple vibroweapons": "SimpleVibroweapon", "martial vibroweapons": "MartialVibroweapon",
    "simple blasters": "SimpleBlaster", "martial blasters": "MartialBlaster",
    "simple lightweapons": "SimpleLightweapon", "martial lightweapons": "MartialLightweapon"
  };
  for (const feat of session?.feats || []) {
    if (!feat.choice) continue;

    const lowChoice = normalizeName(feat.choice);
    if (catMap[lowChoice]) weaponProficiencies.add(catMap[lowChoice]);
    else if (itemRule(feat.choice)?.category === "Weapon") weaponProficiencies.add(lowChoice);
  }
  const archP = archetypePassiveSummary(profile, session);
  for (const ap of archP.armorProfs) armorProficiencies.add(ap);
  for (const wp of archP.weaponProfs) weaponProficiencies.add(wp);
  for (const sp of archP.saveProfs) savingThrowRanks.set(sp, Math.max(savingThrowRanks.get(sp) || 0, 1));
  if (archP.castingDCBonus) castingDCBonus += archP.castingDCBonus;
  if (archP.castingAttackBonus) castingAttackBonus += archP.castingAttackBonus;
  const savingThrows = new Set([...savingThrowRanks.entries()].filter(([, r]) => r > 0).map(([ab]) => ab));

  return {
    isBerserker, isMonk, isSentinel, isConsular, isFighter, isGuardian, isOperative, isScholar, isScout, isEngineer,
    savageAttacks: speciesTraits.has("savage attacks"),
    gamorreanToughness: speciesTraits.has("gamorrean toughness"),
    dangerSense: isBerserker && (profile?.level || 1) >= 3,
    unarmoredDefense,
    unarmoredDefenseAllowsShield: isBerserker,
    unarmoredMovement,
    martialArtsDie,
    sneakAttack,
    rangersQuarry,
    maniacalRage: isBerserker && normalizeName(session?.approach) === "frenzied approach" && Boolean(session?.rage),
    weaponProficiencies,
    weaponChecks,
    armorProficiencies,
    savingThrows,
    savingThrowRanks,
    featSpeedBonus,
    featSpeedSources,
    armorExpertLightSpeed,
    carryingMultiplier,
    passiveBonus,
    castingDCBonus,
    castingAttackBonus,
    corrodedIgnore,
    superiorityBonus,
    unarmedDieStep,
    twfAddAbilityMod,
    dwfAddAbilityModToHit,
    twfIgnoreLight,
    dwfIgnoreLight,
    ignoreObtrusiveShield,
    reduceStrengthReqStep,
    shieldBonusToDexSaves,
    medHeavyArmorDmgReduction,
    noCloseRangedDisadv,
    noLongRangeDisadv,
    noThrownLongRangeDisadv,
    minDamageThresholds,
    powerAttacks,
    coverReductions,
    alert: initiativeProf || classOptInitProf || hasFeat(session, "Alert") || (session?.effects || []).some(e => normalizeName(e.name) === "responder's routine") || (isScout && (profile.level || 1) >= 3 && !(session?.effects || []).some(e => normalizeName(e.name) === "unconscious" || normalizeName(e.name) === "dead") && hasClassOption(profile, session, "Responder's Routine")),
    classOptSpeedBonus, classOptUnarmedFinesse, classOptUnarmedCrit, monkArmorAllowed, monkUsesForceMod, focusMaxHalfForceMod, classOptCarryingDouble, classOptUnlocksForms,
    quickWitted: quickWitted || hasFeat(session, "Quick-Witted"),
    observant: passiveBonus > 0 || hasFeat(session, "Observant"),
    brawny: hasFeat(session, "Brawny"),
    durable: hasFeat(session, "Durable"),
    fanatic: hasFeat(session, "Fanatic")
  };
}

function effectiveScores(profile, session) {
  const base = profile.baseScores || profile.scores;
  const overrides = profile.scoreOverrides || {};
  const result = {};
  for (const ability of abilities) {
    if (overrides[ability] !== null && overrides[ability] !== undefined) {
      result[ability] = overrides[ability];
      continue;
    }
    let score = base[ability];
    for (const feat of session?.feats || []) {
      const rule = featRule(feat.name);
      const chosen = feat.abilityChoice || (rule?.attributes?.length === 1 ? rule.attributes[0] : "");
      if (chosen === ability && score < 20) score = Math.min(20, score + 1);
    }
    result[ability] = score;
  }
  // Armor/Shield Agile X (min DEX score) and Powered X (min STR score)
  if (session?.equipped) {
    for (const eq of session.equipped) {
      if (!eq.equipped) continue;
      const r = itemRule(eq.name, eq);
      if (!r || (r.category !== "Armor" && r.armor !== "Shield")) continue;
      for (const p of r.properties || []) {
        if (/^agile\s+\d+$/i.test(p)) {
          const v = parseNumericStat(p);
          if (v > result.Dexterity) result.Dexterity = v;
        } else if (/^powered\s+\d+$/i.test(p)) {
          const v = parseNumericStat(p);
          if (v > result.Strength) result.Strength = v;
        }
      }
    }
  }
  return result;
}

function effectiveTraining(profile, session) {
  const base = profile.baseTraining || profile.training;
  const result = {...base};
  for (const feat of session?.feats || []) {
    const sk = featRule(feat.name)?.mechanics?.skillGrant;
    if (sk && profile.explicitTraining?.[sk] === undefined) {
      result[sk] = Math.min(2, (result[sk] || 0) + 1);
    }
  }
  if (session) {
    const effMods = activeEffectModifiers(profile, session);
    for (const sk of effMods.skillExpertiseGrants || []) {
      if ((result[sk] || 0) >= 1) result[sk] = 2;
    }
    for (const e of session.effects || []) {
      if (normalizeName(e.name) === "sage advice" && e.choice && skills[e.choice]) {
        result[e.choice] = Math.max(result[e.choice] || 0, 1);
      }
    }
  }
  return result;
}

function speciesHpBonus(profile, session) {
  const sp = speciesRecord(profile?.species);
  return sp?.hpPerLevel ? profile.level * sp.hpPerLevel : 0;
}

function featHpBonus(profile, session) {
  if (!hasFeat(session, "Durable")) return 0;
  const wasImportedWithDurable = (profile.selectedFeats || []).some(f => normalizeName(f.name) === "durable");
  if (wasImportedWithDurable && profile.extraHpBonus >= profile.level * 2) return 0;
  return profile.level * 2;
}

function baseMaxHP(profile, session) {
  if (profile.hpOverride !== null && profile.hpOverride !== undefined) return Math.max(1, profile.hpOverride);
  const scores = effectiveScores(profile, session);
  const conHp = profile.level * modifier(scores.Constitution);
  const speciesHp = speciesHpBonus(profile, session);
  const featHp = featHpBonus(profile, session);
  const extraBonus = profile.extraHpBonus ?? Math.max(0, (profile.hpBonus || 0) - speciesHp);
  const effHp = session ? (activeEffectModifiers(profile, session).maxHPBonus || 0) : 0;
  const archHp = session ? (archetypePassiveSummary(profile, session).hpPerLevel || 0) * (profile.level || 1) : 0;
  return Math.max(1, profile.hpDice + conHp + speciesHp + featHp + extraBonus + effHp + archHp);
}

function defenseProfile(profile, session = null) {
  const passive = passiveFeatureProfile(profile, session);
  const effMods = session ? activeEffectModifiers(profile, session) : {resistances: [], immunities: [], senses: [], rollModifiers: [], tacticalNotes: []};
  const c = session ? conditionState(session, profile) : null;
  const resistances = [
    ...(session?.rage ? ["kinetic", "energy", ...(profile.dewback || [])] : []),
    ...passive.resistances,
    ...effMods.resistances,
    ...(c?.resistances || [])
  ];
  const immunities = [
    ...passive.immunities,
    ...effMods.immunities,
    ...(c ? [...c.immunities] : [])
  ];
  let senses = [...new Set([...passive.senses, ...effMods.senses])];
  if (effMods.blindfightingDoubled) {
    senses = senses.map(s => {
      const m = s.match(/^Blindsight\s+(\d+)\s*ft$/i);
      return m ? ("Blindsight " + (Number(m[1]) * 2) + " ft") : s;
    });
  }
  const extraNotes = [...effMods.tacticalNotes];
  if (session) {
    const tr = characterTraits(profile, session);
    const arm = armorStats(profile, session);
    if (tr.medHeavyArmorDmgReduction && arm.armor && (arm.armor.armor === "Medium" || arm.armor.armor === "Heavy") && !arm.nonproficient) {
      extraNotes.push("Defense Mastery: reduce weapon damage by " + tr.medHeavyArmorDmgReduction + " (min 1)");
    }
    if (tr.shieldBonusToDexSaves && arm.shield && !arm.nonproficient) {
      extraNotes.push("Shield Mastery: +" + (Number(arm.shield.ac) || 0) + " to DEX saves vs powers/harmful effects");
    }
    for (const eq of [arm.armor, arm.shield].filter(Boolean)) {
      for (const prop of eq.properties || []) {
        if (/^(absorptive|insulated|avoidant|impermeable|reactive|regulated|reinforced|silent|spiked)\b/i.test(prop)) {
          extraNotes.push(eq.name + ": " + prop);
        }
      }
    }
  }
  const removedSet = new Set((effMods.removedResistances || []).map(r => r.toLowerCase()));
  const spDef = speciesRecord(profile?.species);
  const vulnerabilities = [...new Set(spDef?.vulnerabilities || [])];
  return {
    resistances: [...new Set(resistances)].filter(r => !removedSet.has(String(r).toLowerCase())),
    vulnerabilities,
    immunities: [...new Set(immunities)],
    senses,
    rollModifiers: effMods.rollModifiers,
    tacticalNotes: extraNotes
  };
}

function classFeaturesWithLevels(profile) {
  const cls = classRecord(profile?.className);
  if (!cls?.levelChanges) return [];
  const list = [];
  const seen = new Set();
  for (let lvl = 1; lvl <= (profile?.level || 1); lvl++) {
    const raw = cls.levelChanges[String(lvl)]?.Features || "";
    for (const part of raw.split(",")) {
      const cleaned = part.replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (!cleaned || /^[\d\uFFFD—–-]+$/.test(cleaned)) continue;
      const key = normalizeName(cleaned);
      if (seen.has(key)) continue;
      seen.add(key);
      const text = classRule(profile, cleaned);
      list.push({name: cleaned, level: lvl, text});
    }
  }
  return list;
}

function characterProficiencies(profile, session = null) {
  const cls = classRecord(profile?.className);
  const sp = speciesRecord(profile?.species);
  const bg = typeof backgroundRecord === "function" ? backgroundRecord(profile?.background) : null;
  const armor = [];
  const weapons = [];
  const tools = [];
  const languages = [];

  const pushUnique = (arr, name, source) => {
    const clean = String(name || "").trim();
    if (!clean || /^none$/i.test(clean)) return;
    const key = normalizeName(clean);
    const existing = arr.find(e => normalizeName(e.name) === key);
    if (existing) {
      if (source && !existing.source.includes(source)) existing.source += ", " + source;
    } else {
      arr.push({name: clean, source: source || ""});
    }
  };

  if (cls) {
    for (const a of (cls.armorProficiencies || [])) pushUnique(armor, a, cls.name);
    for (const w of (cls.weaponProficiencies || [])) pushUnique(weapons, w, cls.name);
    if (Array.isArray(cls.toolProficiencies)) {
      for (const t of cls.toolProficiencies) pushUnique(tools, t, cls.name);
    } else if (typeof cls.toolProficiencies === "string" && cls.toolProficiencies.trim()) {
      pushUnique(tools, cls.toolProficiencies, cls.name);
    }
  }

  if (sp) {
    for (const a of (sp.armorProficiencies || [])) pushUnique(armor, a + (/armor|shield/i.test(a) ? "" : " armor"), sp.name);
    for (const w of (sp.weaponProficiencies || [])) pushUnique(weapons, w, sp.name);
    if (sp.languagesText) pushUnique(languages, sp.languagesText, sp.name);
    for (const tr of (sp.traits || [])) {
      const m = (tr.description || "").match(/proficiency (?:with|in) ([^.]+?(?:kit|implements|tools|instrument|gaming set)[^.]*)/i);
      if (m) pushUnique(tools, m[1].trim(), sp.name + " (" + tr.name + ")");
    }
  }

  if (bg) {
    if (bg.toolProficiencies) pushUnique(tools, bg.toolProficiencies, bg.name + " background");
    if (bg.languages) pushUnique(languages, bg.languages, bg.name + " background");
  }

  for (const feat of (session?.feats || [])) {
    const fName = feat.name || "";
    const fn = normalizeName(fName);
    const fRule = typeof featRule === "function" ? featRule(fName) : null;
    if (feat.choice && fRule?.mechanics?.choiceKind === "weaponCategory") {
      pushUnique(weapons, feat.choice, fName + " feat");
    } else if (feat.choice && fRule?.mechanics?.choiceKind === "weapon") {
      pushUnique(weapons, feat.choice, fName + " feat");
    }
    if (fn === "lightly armored") pushUnique(armor, "Light armor", fName + " feat");
    if (fn === "moderately armored") pushUnique(armor, "Medium armor & Light shields", fName + " feat");
    if (fn === "heavily armored") pushUnique(armor, "Heavy armor", fName + " feat");
    if (fn === "weapon expert") pushUnique(weapons, "Four chosen weapons/categories", fName + " feat");
    if (fn === "crafter") pushUnique(tools, "One artisan's implements (or expertise)", fName + " feat");
    if (fn === "specialist") pushUnique(tools, "One specialist's kit (or expertise)", fName + " feat");
    if (fn === "competitor") pushUnique(tools, "One gaming set (or expertise)", fName + " feat");
    if (fn === "entertainer") pushUnique(tools, "One musical instrument (or expertise)", fName + " feat");
    if (fn === "linguist") pushUnique(languages, "Three languages of your choice", fName + " feat");
  }

  for (const cp of (profile?.customProficiencies || [])) {
    const low = cp.toLowerCase();
    if (/armor|shield/.test(low)) pushUnique(armor, cp, "Character export");
    else if (/blaster|vibro|light|saber|sword|pistol|rifle|axe|spear|whip|weapon/.test(low)) pushUnique(weapons, cp, "Character export");
    else pushUnique(tools, cp, "Character export");
  }

  const baseLangs = (sp?.languagesText || "").toLowerCase();
  for (const lang of (profile?.customLanguages || [])) {
    if (lang && !baseLangs.includes(lang.toLowerCase())) {
      pushUnique(languages, lang, "Character export");
    }
  }

  return {armor, weapons, tools, languages};
}

function characterLanguages(profile, session = null) {
  const sp = speciesRecord(profile?.species);
  const parts = [];
  if (sp?.languagesText) parts.push(sp.languagesText);
  const baseLower = (sp?.languagesText || "").toLowerCase();
  for (const lang of (profile?.customLanguages || [])) {
    if (lang && !baseLower.includes(lang.toLowerCase())) parts.push(lang);
  }
  return parts.join(", ");
}

function resistanceNames(profile, session = null) {
  return defenseProfile(profile, session).resistances;
}

function carryingStats(profile, session) {
  const scores = effectiveScores(profile, session);
  const traits = characterTraits(profile, session);
  const sp = speciesRecord(profile?.species);
  let mult = traits.carryingMultiplier || (traits.brawny ? 2 : 1);
  if (sp?.powerfulBuild) mult = mult >= 2 ? 3 : 2;
  if (traits.classOptCarryingDouble) mult = mult >= 2 ? 3 : 2;
  const effCarry = session ? (activeEffectModifiers(profile, session).carryingMultiplier || 1) : 1;
  if (effCarry > 1) mult *= effCarry;
  const sizeMult = sp?.size === "Tiny" ? 0.5 : sp?.size === "Large" ? 2 : sp?.size === "Huge" ? 4 : 1;
  const capacity = Math.floor(scores.Strength * 15 * mult * sizeMult);
  const carried = (session?.equipped || []).reduce((sum, item) => {
    const rule = itemRule(item.name, item);
    let weight = Number(rule?.weight) || 0;
    if ((rule?.category === "Armor" || rule?.armor === "Shield") && (rule?.properties || []).some(p => /^lightweight$/i.test(p))) {
      weight = weight / 2;
    }
    return sum + weight * (item.quantity || 1);
  }, 0);
  const rounded = Math.round(carried * 10) / 10;
  return {
    carried: rounded,
    capacity,
    maxLoad: capacity * 2,
    encumbered: rounded > capacity,
    overloaded: rounded > capacity * 2
  };
}

function isWeaponProficient(profile, session, rule) {
  if (!rule) return false;
  const {weaponProficiencies, weaponChecks} = characterTraits(profile, session);
  if (weaponProficiencies.has(rule.classification) || weaponProficiencies.has(normalizeName(rule.name))) return true;
  return weaponChecks.some(fn => fn(rule));
}

function parseVersatile(properties) {
  const match = (properties || []).map(p => p.match(/^versatile\s*\((\d+)d(\d+)\)$/i)).find(Boolean);
  return match ? {dice: Number(match[1]), die: Number(match[2])} : null;
}

function weaponStats(profile, item, raging, session = null) {
  if (item === "unarmed") {
    const scores = effectiveScores(profile, session);
    const traits = characterTraits(profile, session);
    const c = session ? conditionState(session, profile) : null;
    const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);
    const sp = speciesRecord(profile?.species);
    const spUnarmed = sp?.unarmed || null;
    const unarmedFinesse = Boolean(traits.isMonk || traits.classOptUnarmedFinesse || spUnarmed?.finesse);
    const useDex = unarmedFinesse && modOf("Dexterity") > modOf("Strength") && !raging;
    let ability = useDex ? "Dexterity" : "Strength";
    if (traits.monkUsesForceMod) { const bestF = modOf("Wisdom") >= modOf("Charisma") ? "Wisdom" : "Charisma"; if (modOf(bestF) > modOf(ability)) ability = bestF; }
    const abMod = modOf(ability);
    const tweak = profile.unarmedTweak || {};
    const stepDie = (base, steps) => {
      const ladder = [0, 4, 6, 8];
      let idx = ladder.indexOf(base);
      if (idx < 0) return base;
      return ladder[Math.min(ladder.length - 1, idx + steps)];
    };
    const eqArm = session ? equippedRule(session, "armor") : null;
    const gauntProp = (eqArm?.properties || []).find(p => /^gauntleted\b/i.test(p));
    const gauntMatch = gauntProp?.match(/(\d+)d(\d+)/i);
    const gauntDie = gauntMatch ? Number(gauntMatch[2]) : 0;
    const baseDie = Math.max(tweak.dieSize || 0, traits.martialArtsDie || 0, spUnarmed?.die || 0, gauntDie);
    const effModsU = session ? activeEffectModifiers(profile, session) : {};
    const totalUnarmedSteps = (traits.unarmedDieStep || 0) + (effModsU.unarmedDieStep || 0);
    const sonicFists = (session?.effects || []).some(e => normalizeName(e.name) === "sonic fists");
    const die = Math.max(sonicFists ? 10 : 0, totalUnarmedSteps ? Math.max(baseDie, stepDie(baseDie, totalUnarmedSteps)) : baseDie);
    const dice = die ? 1 : 0;
    const toHit = tweak.toHitOverride ?? (abMod + profile.proficiency + (tweak.toHitBonus || 0) + (effModsU.unarmedBonus || 0));
    const dmgBonus = abMod + (raging && ability === "Strength" ? (profile.rageDamage || 0) : 0) + (tweak.damageBonus || 0) + (effModsU.unarmedBonus || 0) + (effModsU.attackDamageBonus || 0);
    return {
      name: "Unarmed strike",
      toHit,
      dice, die,
      flat: dice ? 0 : Math.max(1, 1 + dmgBonus),
      bonus: dice ? dmgBonus : 1 + dmgBonus,
      override: tweak.damageOverride || null,
      type: sonicFists ? "sonic" : "kinetic",
      melee: true, ranged: false, finesse: false, versatile: null, twoHanded: false,
      light: false, thrown: false, reach: false, reload: "", proficient: true,
      disadvantage: false, ability, notes: traits.classOptUnarmedCrit ? ["Crit " + Math.max(16, 20 - traits.classOptUnarmedCrit) + "–20 (Vow of Precision)"] : []
    };
  }
  const baseRule = itemRule(item.name, item);
  if (!baseRule || baseRule.category !== "Weapon") return null;
  const modalModes = parseModalModes(baseRule.properties);
  const modalIndex = modalModes.length ? (Math.max(0, Number(item.modalIndex) || 0) % modalModes.length) : -1;
  const modalModeName = modalIndex >= 0 ? modalModes[modalIndex] : "";
  const rule = (modalModeName && itemRule(modalModeName)) ? {...itemRule(modalModeName), name: baseRule.name, properties: [...(itemRule(modalModeName).properties || []), ...(baseRule.properties || []).filter(p => /^modal\b/i.test(p))]} : baseRule;
  if (!rule) return null;
  const isSpecialWeapon = !rule.dice || !rule.die;
  const props = rule.properties || [];
  const hasProp = rx => props.some(p => rx.test(p));
  const isBlaster = /Blaster/i.test(rule.classification || "");
  const finesse = hasProp(/^finesse$/i);
  const versatile = parseVersatile(props);
  const thrown = hasProp(/^thrown\b/i);
  const light = hasProp(/^light$/i);
  const interlocking = hasProp(/^interlocking$/i);
  const detached = Boolean(interlocking && item.detached);
  const doubleProp = detached ? "" : (props.find(p => /^double\b/i.test(p)) || "");
  const reach = hasProp(/^reach$/i);
  const twoHanded = hasProp(/^two-handed$/i);
  const heavy = hasProp(/^heavy$/i);
  const reload = props.find(p => /^reload\b/i.test(p)) || "";
  const ammoProp = props.find(p => /^(power cell|slug cartridge|dart|arrow|bolt)/i.test(p)) || "";
  const shield = session ? equippedRule(session, "shield") : null;
  const hasPhysicalShield = Boolean(shield && !/generator/i.test(shield.name));
  const hasStrProp = props.some(p => /^strength \d+$/i.test(p));
  const canGripTwoHands = Boolean((versatile || (hasStrProp && !twoHanded)) && !hasPhysicalShield);
  const useTwoHands = Boolean(canGripTwoHands && item.twoHanded);
  const thrownMode = Boolean(thrown && item.thrownMode);
  const ranged = isBlaster || thrownMode;
  const melee = !ranged;
  const scores = effectiveScores(profile, session);
  const c = session ? conditionState(session, profile) : null;
  const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);
  const traits = characterTraits(profile, session);
  const effMods = session ? activeEffectModifiers(profile, session) : {critRangeBonus: 0, nimanForceMelee: false, noCloseRangedDisadv: false};
  const isMighty = hasProp(/^mighty$/i);
  const isMonkWeapon = Boolean(
    traits.isMonk && /Vibroweapon/i.test(rule.classification || "") &&
    isWeaponProficient(profile, session, rule) &&
    !hasProp(/^heavy$/i) && !hasProp(/^two-handed$/i) && !hasProp(/^special$/i) && !hasProp(/^dexterity\s+\d+$/i)
  );
  const canChooseStrDex = finesse || isMighty || isMonkWeapon;
  let ability = isBlaster ? "Dexterity" : "Strength";
  let nimanApplied = false;
  if (canChooseStrDex) {
    if (item.useAbility === "Dexterity") ability = "Dexterity";
    else if (item.useAbility === "Strength") ability = "Strength";
    else ability = (modOf("Dexterity") > modOf("Strength") && !raging) ? "Dexterity" : "Strength";
  }
  let criticalAnalysisApplied = false;
  if (melee && (effMods.nimanForceMelee || effMods.meleeUsesForceMod || (isMonkWeapon && traits.monkUsesForceMod)) && !item.useAbility) {
    const wisM = modOf("Wisdom");
    const chaM = modOf("Charisma");
    const bestForceAb = wisM >= chaM ? "Wisdom" : "Charisma";
    if (modOf(bestForceAb) > modOf(ability)) {
      ability = bestForceAb;
      nimanApplied = true;
    }
  }
  const hasCA = Boolean(traits.isScholar && (finesse || isBlaster) && (session?.effects || []).some(e => normalizeName(e.name) === "critical analysis"));
  if (hasCA && !item.useAbility) {
    let caAb = "Intelligence";
    if (hasClassOption(profile, session, "Rancor's Discipline")) {
      for (const ab of ["Wisdom", "Charisma"]) {
        if (modOf(ab) > modOf(caAb)) caAb = ab;
      }
    }
    if (modOf(caAb) > modOf(ability)) {
      ability = caAb;
      criticalAnalysisApplied = true;
    }
  }
  let abilityMod = modOf(ability);
  const proficient = isWeaponProficient(profile, session, rule);
  // Smart (DEX/+prof): uses weapon's own DEX score & proficiency bonus instead of wielder's
  const smartProp = props.find(p => /^smart\s*\(/i.test(p));
  const smartMatch = smartProp?.match(/smart\s*\(\s*(\d+)\s*\/\s*\+?(\d+)\s*\)/i);
  let effectiveProf = proficient ? profile.proficiency : 0;
  if (smartMatch) {
    abilityMod = modifier(Number(smartMatch[1]));
    effectiveProf = proficient ? Number(smartMatch[2]) : 0;
  }
  const dexReq = props.find(p => /^dexterity \d+$/i.test(p));
  const strReq = props.find(p => /^strength \d+$/i.test(p));
  const dexShort = Boolean(dexReq && scores.Dexterity < Number(dexReq.split(" ")[1]));
  let effectiveStrReq = strReq ? Number(strReq.split(" ")[1]) : 0;
  let strSteps = traits.reduceStrengthReqStep || 0;
  // SW5e Strength property: non-two-handed weapon wielded in two hands drops Strength req by 1 step
  if (!twoHanded && useTwoHands) strSteps += 1;
  for (let s = 0; s < strSteps && effectiveStrReq > 0; s++) {
    effectiveStrReq = effectiveStrReq <= 11 ? 0 : effectiveStrReq - 2;
  }
  const strShort = Boolean(effectiveStrReq && scores.Strength < effectiveStrReq);
  // Switch (XdY type): toggleable alternate damage dice & type
  const switchProp = props.find(p => /^switch\s*\(/i.test(p));
  const switchMatch = switchProp?.match(/switch\s*\(\s*(\d+)d(\d+)\s+([^)]+)\)/i);
  const switchSpec = switchMatch ? {dice: Number(switchMatch[1]), die: Number(switchMatch[2]), type: switchMatch[3].trim().toLowerCase()} : null;
  const switchActive = Boolean(switchSpec && item.switchMode);
  const dice = switchActive ? switchSpec.dice : (versatile && useTwoHands ? versatile.dice : rule.dice);
  let die = switchActive ? switchSpec.die : (versatile && useTwoHands ? versatile.die : rule.die);
  if (isMonkWeapon && !switchActive && traits.martialArtsDie && dice === 1 && traits.martialArtsDie > die) {
    die = traits.martialArtsDie;
  }
  const damageType = switchActive ? switchSpec.type : (rule.damage || "kinetic").toLowerCase();
  const defPropVal = props.find(p => /^defensive\b/i.test(p));
  const defensiveNum = defPropVal ? (parseNumericStat(defPropVal) || 1) : 0;
  const defensiveActive = Boolean(defensiveNum && item.defensiveActive);
  const reckPropVal = props.find(p => /^reckless\b/i.test(p));
  const recklessNum = reckPropVal ? (parseNumericStat(reckPropVal) || 1) : 0;
  const recklessActive = Boolean(recklessNum && item.recklessActive);
  const direPropVal = props.find(p => /^dire\b/i.test(p));
  const direNum = direPropVal ? (parseNumericStat(direPropVal) || 1) : 0;
  const direActive = Boolean(direNum && item.direActive);
  const piercePropVal = props.find(p => /^piercing\b/i.test(p));
  const piercingNum = piercePropVal ? (parseNumericStat(piercePropVal) || 1) : 0;
  const piercingActive = Boolean(piercingNum && item.piercingActive);
  const heavyDmgBonus = (heavy && ability === "Strength") ? Math.max(1, Math.floor(abilityMod / 2)) : 0;
  const stanceHit = (recklessActive ? recklessNum : 0) - (defensiveActive ? defensiveNum : 0) - (direActive ? direNum : 0) + (piercingActive ? piercingNum : 0);
  const stanceDmg = (recklessActive ? recklessNum : 0) - (defensiveActive ? defensiveNum : 0) + (direActive ? direNum : 0) - (piercingActive ? piercingNum : 0);
  const rageBonus = (raging && melee && ability === "Strength") ? (profile.rageDamage || 0) : 0;
  const wepGroup = weaponClassOf(modalModeName || item.name);
  const ownedFocusGroups = new Set((session?.feats || []).filter(f => normalizeName(f.name) === "weapon focused" && f.choice).map(f => weaponFocusRule(f.choice)?.group).filter(Boolean));
  const ownedSupGroups = new Set((session?.feats || []).filter(f => normalizeName(f.name) === "weapon supremacist" && f.choice).map(f => weaponSupremacyRule(f.choice)?.group).filter(Boolean));
  const hasFocus = Boolean(proficient && wepGroup && ownedFocusGroups.has(wepGroup));
  const hasSupremacy = Boolean(proficient && wepGroup && ownedSupGroups.has(wepGroup));
  const focusDmgBonus = hasFocus ? 1 : 0;
  const supHitBonus = hasSupremacy ? 1 : 0;
  const toHit = item.toHitOverride ?? (abilityMod + effectiveProf + (item.attackBonus || 0) + stanceHit + supHitBonus + (effMods.weaponAttackBonus || 0));
  const prof = profile.proficiency || 2;
  const notes = [];
  if (!proficient) notes.push("Not proficient");
  if (nimanApplied) notes.push("Niman (" + ability.slice(0, 3).toUpperCase() + ")");
  if (criticalAnalysisApplied) notes.push("Critical Analysis (" + ability.slice(0, 3).toUpperCase() + ")");
  const keenProp = props.find(p => /^keen\b/i.test(p));
  const keenBonus = keenProp ? (parseNumericStat(keenProp) || 1) : 0;
  const bladeSupCrit = (hasSupremacy && wepGroup === "Blade") ? 1 : 0;
  const totalCritBonus = (effMods.critRangeBonus || 0) + keenBonus + bladeSupCrit;
  if (totalCritBonus > 0) notes.push("Crit " + Math.max(16, 20 - totalCritBonus) + "–20");
  if (heavyDmgBonus > 0) notes.push("Heavy (+" + heavyDmgBonus + " Strength damage)");
  if (isMighty) notes.push("Mighty (STR/DEX)");
  const brutalProp = props.find(p => /^brutal\b/i.test(p));
  if (brutalProp) notes.push("Brutal +" + (parseNumericStat(brutalProp) || 1) + " crit die");
  const viciousProp = props.find(p => /^vicious\b/i.test(p));
  if (viciousProp) notes.push("Vicious +" + (parseNumericStat(viciousProp) || 1) + " on max die");
  const defProp = props.find(p => /^defensive\b/i.test(p));
  if (defProp) notes.push("Defensive +" + (parseNumericStat(defProp) || 1) + " AC");
  for (const rx of [/^burst\b/i, /^rapid\b/i, /^auto$/i, /^disarming$/i, /^piercing\b/i, /^shocking\b/i, /^disintegrate\b/i, /^dire\b/i, /^penetrating\b/i, /^disruptive$/i, /^biting\b/i, /^corruption\b/i, /^neuralizing\b/i, /^reckless\b/i, /^smart\b/i, /^switch\b/i, /^returning$/i]) {
    const found = props.find(p => rx.test(p));
    if (found) {
      if (/^(burst|rapid)\b/i.test(found)) notes.push(found + " (DC " + (8 + toHit) + " DEX)");
      else notes.push(found);
    }
  }
  if (dexShort) notes.push(dexReq + " unmet");
  if (strShort) notes.push("Strength " + effectiveStrReq + " unmet");
  if (reach) notes.push("Reach 10 ft");
  if (reload) notes.push(reload);
  if (ammoProp) notes.push(ammoProp);
  if (doubleProp) notes.push(doubleProp);
  const isTwoHandedMelee = melee && (twoHanded || useTwoHands) && /Vibroweapon|Lightweapon/i.test(rule.classification || "");
  if (proficient && isTwoHandedMelee && traits.minDamageThresholds.has("twoHandedMelee")) {
    notes.push("Minimum damage threshold");
  }
  if (proficient && isTwoHandedMelee && traits.powerAttacks.has("twoHandedMelee")) {
    notes.push("Power: −" + prof + " attack / +" + (2 * prof) + " damage");
  }
  if (isBlaster) {
    if (traits.noCloseRangedDisadv || effMods.noCloseRangedDisadv) notes.push("No 5-ft disadvantage");
    if (traits.noLongRangeDisadv) notes.push("No long-range disadvantage");
    if (traits.coverReductions.has("<=30 ft")) notes.push("≤30 ft cover −1");
    if (traits.coverReductions.has(">30 ft")) notes.push(">30 ft cover −1");
    if (traits.minDamageThresholds.has("blaster30ft")) notes.push("≤30 ft minimum damage threshold");
    if (proficient && traits.powerAttacks.has("blasterOver30ft")) {
      notes.push(">30 ft −" + prof + " attack / +" + (2 * prof) + " damage");
    }
  }
  if (thrownMode && traits.noThrownLongRangeDisadv) notes.push("No long-range disadvantage");
  if (proficient && doubleProp && traits.powerAttacks.has("doubleWeapon")) {
    notes.push("Power: −" + prof + " attack / +" + (useTwoHands || twoHanded ? Math.floor(prof * 1.5) : prof) + " damage");
  }
  if (hasFocus) notes.push(wepGroup + " Focus (+1 damage)");
  if (hasSupremacy) notes.push(wepGroup + " Supremacy (+1 hit)");
  if (hasSupremacy && wepGroup === "Rifle") notes.push("≤30 ft cover −1");
  if (modalModeName) notes.push("Mode: " + modalModeName);
  for (const wd of effMods.weaponDamageDice || []) notes.push(wd);
  if (melee && traits.isGuardian && (profile.level || 1) >= 11) notes.push("+1d8 (Improved Force-Empowered Strikes)");
  if (melee && effMods.auraHatredBonus > 0) notes.push("+" + effMods.auraHatredBonus + " (Aura of Hatred, 1st hit/rd)");
  if (effMods.sharpshooterBonus > 0) notes.push("+" + effMods.sharpshooterBonus + " hit (Sharpshooter's Routine, 1st/turn)");
  if (traits.rangersQuarry && (session?.effects || []).some(e => normalizeName(e.name) === "ranger's quarry" || normalizeName(e.name) === "ranger’s quarry")) {
    notes.push("+1" + traits.rangersQuarry + " (Ranger’s Quarry, 1/turn)");
  }
  for (const wn of archetypePassiveSummary(profile, session).weaponNotes || []) notes.push(wn);
  if (melee && traits.savageAttacks) notes.push("Savage Attacks (+1 crit die)");
  if (melee && traits.isBerserker && (profile.level || 1) >= 9) {
    const bcDice = (profile.level || 1) >= 17 ? 3 : (profile.level || 1) >= 13 ? 2 : 1;
    notes.push("Brutal Critical (+" + bcDice + " crit " + (bcDice === 1 ? "die" : "dice") + ")");
  }
  if (detached) notes.push("Detached (2 weapons)");
  if (proficient && versatile && traits.powerAttacks.has("versatileWeapon")) {
    notes.push("Power: −" + prof + " attack / +" + (useTwoHands ? Math.floor(prof * 1.5) : prof) + " damage");
  }
  return {
    name: item.name,
    toHit,
    dice, die,
    type: damageType,
    bonus: abilityMod + (rule.flat || 0) + (item.damageBonus || 0) + rageBonus + heavyDmgBonus + focusDmgBonus + stanceDmg + (effMods.attackDamageBonus || 0) + (effMods.weaponDamageBonus || 0),
    modalModes, modalModeName, interlocking, detached, canGripTwoHands, hasFocus, hasSupremacy, wepGroup,
    switchSpec, switchActive, defensiveNum, defensiveActive, recklessNum, recklessActive, direNum, direActive, piercingNum, piercingActive, canChooseStrDex, heavyDmgBonus,
    abilityMod,
    override: item.damageOverride || (isSpecialWeapon ? "Special" : null),
    melee, ranged, finesse, versatile, useTwoHands, twoHanded, light, thrown, thrownMode,
    reach, reload, doubleProp, proficient, ability,
    heavy,
    disadvantage: dexShort || strShort,
    notes
  };
}

function damageNotation(stats) {
  if (stats.override) return String(stats.override);
  if (!stats.dice || !stats.die) return Math.max(1, stats.bonus) + " " + stats.type;
  return stats.dice + "d" + stats.die + (stats.bonus ? signed(stats.bonus) : "") + " " + stats.type;
}

function equipmentGroup(rule) {
  if (rule?.armor === "Shield") return "shield";
  if (rule?.category === "Armor") return "armor";
  if (rule?.category === "Weapon") return "weapon";
  return "";
}

function equippedRule(session, group) {
  return (session?.equipped || []).filter(item => item.equipped).map(item => itemRule(item.name, item))
    .find(rule => equipmentGroup(rule) === group);
}

function armorStats(profile, session) {
  const armor = equippedRule(session, "armor");
  const shield = equippedRule(session, "shield");
  const scores = effectiveScores(profile, session);
  const sp = speciesRecord(profile?.species);
  const traits = characterTraits(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const rawDex = modifier(scores.Dexterity);
  const dex = sp?.maxDexAC !== undefined ? Math.min(rawDex, sp.maxDexAC) : rawDex;
  const allowUnarmored = Boolean(traits.unarmoredDefense && !armor && (traits.unarmoredDefenseAllowsShield || !shield));
  const unarmoredExtra = allowUnarmored ? modifier(scores[traits.unarmoredDefense]) : 0;

  let unarmoredAC = 10 + dex + unarmoredExtra;
  let unarmoredLabel = allowUnarmored ? "Unarmored Defense (10 + DEX + " + traits.unarmoredDefense.slice(0, 3).toUpperCase() + ")" : "Unarmored (10 + DEX)";
  const nat = sp?.naturalArmor;
  if (nat) {
    const natAC = nat.base + (nat.addDex ? dex : 0);
    if (!armor && (nat.noArmorBenefit || natAC > unarmoredAC)) {
      unarmoredAC = natAC;
      unarmoredLabel = sp.name + " Natural Armor (" + nat.base + (nat.addDex ? " + DEX" : "") + ")";
    }
  }
  if (!armor && effMods.unarmoredBase && (effMods.unarmoredBase + dex) > unarmoredAC) {
    unarmoredAC = effMods.unarmoredBase + dex;
    unarmoredLabel = effMods.unarmoredBaseSource;
  }

  let base = armor ? Number.parseInt(armor.ac, 10) || 10 : unarmoredAC;
  const limit = Number(armor?.ac?.match(/max (\d+)/i)?.[1] || Infinity);
  let armorDex = /Dex modifier/i.test(armor?.ac || "") ? Math.min(dex, limit) : 0;
  if (armor && nat) {
    const natAC = nat.base + (nat.addDex ? dex : 0);
    if (nat.noArmorBenefit) {
      base = natAC;
      armorDex = 0;
    } else if (nat.allowLightArmor && armor.armor === "Light" && natAC > (base + armorDex)) {
      base = natAC;
      armorDex = 0;
    }
  }
  const speciesACBonus = sp?.acBonus || 0;
  const isLightShield = Boolean(shield && (/light/i.test(shield.name) || Number(shield.ac) === 1));
  const wieldingHeavyWeapon = (session?.equipped || []).some(item => {
    if (!item.equipped) return false;
    const wr = itemRule(item.name, item);
    return wr?.category === "Weapon" && (wr.properties || []).some(p => /^heavy$/i.test(p));
  });
  const shieldItem = (session?.equipped || []).find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
  const shieldHasAnchor = Boolean(shield?.properties?.some(p => /^anchor$/i.test(p)));
  const shieldAnchored = Boolean(shieldHasAnchor && shieldItem?.anchored);
  const shieldVersProp = (shield?.properties || []).find(p => /^versatile\b/i.test(p));
  const shieldVersBonus = (shieldVersProp && shieldItem?.twoHanded && !shieldAnchored) ? (parseNumericStat(shieldVersProp) || 1) : 0;
  const anchorCoverAC = shieldAnchored ? (Number(shield?.ac) >= 3 ? 5 : Number(shield?.ac) >= 2 ? 3 : 2) : 0;
  const lightShieldSuppressed = Boolean(isLightShield && wieldingHeavyWeapon);
  const shieldBonus = (lightShieldSuppressed || shieldAnchored) ? 0 : ((Number(shield?.ac) || 0) + shieldVersBonus);
  const strengthShort = rule => {
    if (sp?.ignoreHeavyArmorStr && rule?.armor === "Heavy") return false;
    return rule?.properties?.some(property =>
      /^strength \d+$/i.test(property) && scores.Strength < Number(property.split(" ")[1]));
  };
  const shieldTier = !shield ? "" : ((Number(shield.ac) >= 3 || /heavy/i.test(shield.name)) ? "Heavy" : (Number(shield.ac) === 2 || /medium/i.test(shield.name)) ? "Medium" : "Light");
  const nonproficient = Boolean(
    (armor && !traits.armorProficiencies.has(armor.armor)) ||
    (shield && !traits.armorProficiencies.has(shieldTier))
  );
  // Weapon Defensive (+X AC) & Reckless (-X AC) active stances
  let weaponStanceAC = 0;
  const stanceSources = [];
  for (const eq of (session?.equipped || []).filter(i => i.equipped)) {
    const wr = itemRule(eq.name, eq);
    if (wr?.category !== "Weapon") continue;
    const wProps = wr.properties || [];
    if (eq.defensiveActive) {
      const dp = wProps.find(p => /^defensive\b/i.test(p));
      const v = dp ? (parseNumericStat(dp) || 1) : 0;
      if (v) { weaponStanceAC += v; stanceSources.push(eq.name + " Defensive (+" + v + ")"); }
    }
    if (eq.recklessActive) {
      const rp = wProps.find(p => /^reckless\b/i.test(p));
      const v = rp ? (parseNumericStat(rp) || 1) : 0;
      if (v) { weaponStanceAC -= v; stanceSources.push(eq.name + " Reckless (-" + v + ")"); }
    }
  }
  const hasArmorProp = rx => [armor, shield].filter(Boolean).some(eq => (eq.properties || []).some(p => rx.test(p)));
  const getArmorPropVal = rx => {
    let total = 0;
    for (const eq of [armor, shield].filter(Boolean)) {
      for (const p of eq.properties || []) {
        if (rx.test(p)) total += parseNumericStat(p) || 1;
      }
    }
    return total;
  };
  const cumbersomePenalty = hasArmorProp(/^cumbersome$/i) ? 5 : 0;
  const strSpeedPenalty = (strengthShort(armor) || strengthShort(shield)) ? 10 : 0;
  const absorptive = getArmorPropVal(/^absorptive\b/i);
  const insulated = getArmorPropVal(/^insulated\b/i);
  const silent = hasArmorProp(/^silent$/i);
  const concealing = hasArmorProp(/^concealing$/i);
  const obtrusiveShield = Boolean(shield?.properties?.some(p => /^obtrusive$/i.test(p)));
  const steadfast = hasArmorProp(/^steadfast$/i);
  const spikedProp = [armor, shield].filter(Boolean).flatMap(eq => eq.properties || []).find(p => /^spiked\b/i.test(p)) || "";
  const chargingMax = getArmorPropVal(/^charging\b/i);
  const battlemindAC = (!armor && !shield && effMods.unarmoredACBonus) ? effMods.unarmoredACBonus : 0;
  const extraACSources = [...effMods.acSources, ...stanceSources];
  if (battlemindAC) extraACSources.push(effMods.unarmoredACBonusSource);
  let computed = (profile.acOverride ?? (base + armorDex + shieldBonus + speciesACBonus + (profile.acBonus || 0))) + effMods.acBonus + battlemindAC + weaponStanceAC + anchorCoverAC;
  if (effMods.minAC && computed < effMods.minAC) {
    computed = effMods.minAC;
    extraACSources.push(effMods.minACSource + " (min " + effMods.minAC + ")");
  }
  return {
    value: computed,
    armor, shield,
    unarmoredLabel,
    effectBonus: effMods.acBonus + weaponStanceAC,
    effectSources: extraACSources,
    speedPenalty: strSpeedPenalty + cumbersomePenalty,
    cumbersomePenalty,
    absorptive,
    insulated,
    lightShieldSuppressed, shieldHasAnchor, shieldAnchored, anchorCoverAC, shieldVersProp, shieldVersBonus, chargingMax,
    silent,
    concealing,
    obtrusiveShield,
    steadfast,
    spikedProp,
    heavy: armor?.armor === "Heavy",
    nonproficient,
    stealth: Boolean(armor?.properties?.some(property => property.toLowerCase() === "bulky"))
  };
}

function speedBreakdown(profile, session, conditions = null) {
  const sp = speciesRecord(profile?.species);
  const base = sp?.speed || 30;
  const traits = characterTraits(profile, session);
  const armor = armorStats(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const passive = passiveFeatureProfile(profile, session);
  const unarmoredBonus = ((!armor.armor || (traits.monkArmorAllowed && (armor.armor.armor === "Light" || armor.armor.armor === "Medium"))) && !armor.shield) ? traits.unarmoredMovement : 0;
  const armorExpertBonus = (traits.armorExpertLightSpeed && armor.armor?.armor === "Light") ? 5 : 0;
  const featBonus = traits.featSpeedBonus + armorExpertBonus;
  const featSources = [...traits.featSpeedSources, ...(armorExpertBonus ? ["Armor Expert (+5 ft in light armor)"] : [])];
  const archWalkBonus = archetypePassiveSummary(profile, session).walkBonus || 0;
  const rawBase = Math.max(0, base + unarmoredBonus + featBonus + (traits.classOptSpeedBonus || 0) + archWalkBonus + effMods.speedBonus - armor.speedPenalty);
  const scaled = Math.floor(rawBase * effMods.speedMultiplier);
  const carry = carryingStats(profile, session);
  let live = conditions ? movementSpeed(scaled, conditions, passive.slowedStep) : scaled;
  if (carry.overloaded) live = 0;
  else if (carry.encumbered) live = Math.min(live, 5);

  const mergedModes = {...passive.speeds, ...effMods.altSpeeds};
  const modes = {};
  const flyHalved = Boolean(sp?.speeds?.flyArmorHalved && armor.armor && (armor.armor.armor === "Medium" || armor.armor.armor === "Heavy"));
  for (const key of ["climb", "swim", "fly", "burrow"]) {
    if (mergedModes[key] === "walk") modes[key] = live;
    else if (typeof mergedModes[key] === "number" && mergedModes[key] > 0) {
      const mScaled = Math.floor(mergedModes[key] * effMods.speedMultiplier);
      modes[key] = conditions ? movementSpeed(mScaled, conditions, passive.slowedStep) : mScaled;
    }
    if (key === "fly" && flyHalved && modes.fly) {
      modes.fly = Math.floor(modes.fly / 2);
    }
    if (key === "fly" && effMods.flySpeedZero) {
      modes.fly = 0;
    }
  }

  return {
    speciesBase: base,
    unarmoredBonus,
    featBonus,
    featSources,
    effectBonus: effMods.speedBonus,
    effectMultiplier: effMods.speedMultiplier,
    effectSources: effMods.speedSources,
    armorPenalty: armor.speedPenalty,
    slowedStep: passive.slowedStep,
    encumbered: carry.encumbered,
    overloaded: carry.overloaded,
    modes,
    notes: effMods.tacticalNotes,
    live
  };
}

function baseMovementSpeed(profile, session) {
  return speedBreakdown(profile, session, null).live;
}

function canUseWeapon(session, item, profile = null) {
  const shield = equippedRule(session, "shield");
  if (!shield || /generator/i.test(shield.name)) return true;
  const properties = itemRule(item.name, item)?.properties || [];
  if (properties.some(property => /two-handed/i.test(property))) return false;
  if (ownedCombatOptions(profile, session).styles.some(st => st.mechanics?.ignoreObtrusiveShield)) return true;
  return !shield.properties.some(property => /^obtrusive$/i.test(property)) ||
    properties.some(property => /^light$/i.test(property));
}

function castingStats(profile, session) {
  const cls = classRecord(profile?.className);
  const arch = archetypeRecord(session?.approach, profile?.className);
  const step = classLevelStep(profile);
  const archStep = archetypeLevelStep(profile, session);
  const scores = effectiveScores(profile, session);
  const c = session ? conditionState(session, profile) : null;
  const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);

  const allSessionPowers = Array.isArray(session?.powers) ? session.powers : null;
  const forcePowers = allSessionPowers
    ? allSessionPowers.filter(n => (powerRule(n)?.type || "Force") === "Force")
    : [...new Set([...(profile?.forcePowers || []), ...(profile?.customForcePowers || [])])];
  const techPowers = allSessionPowers
    ? allSessionPowers.filter(n => powerRule(n)?.type === "Tech")
    : [...new Set([...(profile?.techPowers || []), ...(profile?.customTechPowers || [])])];
  if (hasFeat(session, "Techie") && !techPowers.some(n => normalizeName(n) === "repair droid")) {
    techPowers.push("Repair Droid");
  }

  const hasForceFeat = (session?.feats || []).some(f => /force-sensitive/i.test(f.name));
  const hasTechFeat = (session?.feats || []).some(f => /tech dabbler/i.test(f.name));
  const archCast = arch?.mechanics?.casting || null;
  const isForceClass = cls?.casterType === "Force" || arch?.casterType === "Force" || archCast?.type === "Force" || Boolean(archStep["Force Points"]);
  const isTechClass = cls?.casterType === "Tech" || arch?.casterType === "Tech" || archCast?.type === "Tech" || Boolean(archStep["Tech Points"]);

  const archOverride = Boolean(archCast?.overrideTable);
  const forceBase = parseNumericStat((archOverride && archStep["Force Points"] !== undefined) ? archStep["Force Points"] : (step["Force Points"] ?? archStep["Force Points"]));
  const techBase = parseNumericStat((archOverride && archStep["Tech Points"] !== undefined) ? archStep["Tech Points"] : (step["Tech Points"] ?? archStep["Tech Points"]));
  const wisMod = modOf("Wisdom");
  const chaMod = modOf("Charisma");
  const intMod = modOf("Intelligence");
  const hasCunningForce = hasFeat(session, "Cunning Forcecaster");
  const spiritualFeat = (session?.feats || []).find(f => normalizeName(f.name) === "spiritual techcaster");
  let forceAbility = wisMod >= chaMod ? "Wisdom" : "Charisma";
  let forceMod = Math.max(wisMod, chaMod);
  if (hasCunningForce && intMod > forceMod) {
    forceAbility = "Intelligence";
    forceMod = intMod;
  }
  let techAbility = "Intelligence";
  let techMod = intMod;
  if (spiritualFeat) {
    const altAb = spiritualFeat.abilityChoice || (wisMod >= chaMod ? "Wisdom" : "Charisma");
    if (modOf(altAb) > techMod) {
      techAbility = altAb;
      techMod = modOf(altAb);
    }
  }

  const isBendu = normalizeName(profile?.className) === "consular" && (profile?.level || 1) >= 3 && normalizeName(session?.forceAffinity) === "bendu";
  const forceMax = isForceClass && forceBase ? Math.max(1, forceBase + (isBendu ? (wisMod + chaMod) : forceMod)) : 0;
  const techMax = isTechClass && techBase ? Math.max(1, techBase + techMod) : 0;

  const baseMaxLvl = parseNumericStat(step["Max Power Level"]);
  const archMaxLvl = parseNumericStat(archStep["Max Power Level"]);
  const maxLevelRaw = (archOverride && archMaxLvl > 0) ? archMaxLvl : (baseMaxLvl || archMaxLvl);
  const maxForceLevel = isForceClass ? (archCast?.type === "Force" && archCast?.usesBasePoints ? baseMaxLvl : (cls?.casterType === "Force" ? baseMaxLvl : (archMaxLvl || maxLevelRaw))) : 0;
  const maxTechLevel = isTechClass ? (archCast?.type === "Tech" && archCast?.usesBasePoints ? baseMaxLvl : (cls?.casterType === "Tech" ? (archOverride && archMaxLvl ? archMaxLvl : baseMaxLvl) : (archMaxLvl || maxLevelRaw))) : 0;

  return {
    hasForce: forcePowers.length > 0 || forceMax > 0 || hasForceFeat,
    hasTech: techPowers.length > 0 || techMax > 0 || hasTechFeat,
    forcePowers,
    techPowers,
    forceMax,
    techMax,
    forceRemaining: Math.max(0, forceMax - (session?.forceUsed || 0)),
    techRemaining: Math.max(0, techMax - (session?.techUsed || 0)),
    tempForce: Math.max(0, session?.tempForce || 0),
    tempTech: Math.max(0, session?.tempTech || 0),
    forceTotalRemaining: Math.max(0, forceMax - (session?.forceUsed || 0)) + Math.max(0, session?.tempForce || 0),
    techTotalRemaining: Math.max(0, techMax - (session?.techUsed || 0)) + Math.max(0, session?.tempTech || 0),
    maxForceLevel,
    maxTechLevel,
    forceAbility,
    techAbility,
    forceDC: 8 + profile.proficiency + forceMod + (characterTraits(profile, session).castingDCBonus || 0),
    forceAttack: profile.proficiency + forceMod + (characterTraits(profile, session).castingAttackBonus || 0),
    techDC: 8 + profile.proficiency + techMod + (characterTraits(profile, session).castingDCBonus || 0),
    techAttack: profile.proficiency + techMod + (characterTraits(profile, session).castingAttackBonus || 0),
    lightDC: 8 + profile.proficiency + (hasCunningForce && intMod > wisMod ? intMod : wisMod) + (characterTraits(profile, session).castingDCBonus || 0),
    lightAttack: profile.proficiency + (hasCunningForce && intMod > wisMod ? intMod : wisMod) + (characterTraits(profile, session).castingAttackBonus || 0),
    lightAbility: hasCunningForce && intMod > wisMod ? "Intelligence" : "Wisdom",
    darkDC: 8 + profile.proficiency + (hasCunningForce && intMod > chaMod ? intMod : chaMod) + (characterTraits(profile, session).castingDCBonus || 0),
    darkAttack: profile.proficiency + (hasCunningForce && intMod > chaMod ? intMod : chaMod) + (characterTraits(profile, session).castingAttackBonus || 0),
    darkAbility: hasCunningForce && intMod > chaMod ? "Intelligence" : "Charisma"
  };
}

function characterResources(profile, session) {
  const list = [];
  const step = classLevelStep(profile);
  const scores = effectiveScores(profile, session);
  const traits = characterTraits(profile, session);
  const casting = castingStats(profile, session);

  if (profile.rageMax) {
    list.push({
      id: "rage",
      label: "Rage",
      value: Math.max(0, profile.rageMax - (session.spent.rage || 0)),
      max: profile.rageMax,
      resetOn: "long"
    });
  }
  if (profile.leapMax) {
    list.push({
      id: "leap",
      label: "Fyrnock’s leap",
      value: Math.max(0, profile.leapMax - (session.spent.leap || 0)),
      max: profile.leapMax,
      resetOn: "long"
    });
  }
  if (casting.forceMax > 0) {
    list.push({
      id: "forcePoints",
      label: "Force Points",
      value: casting.forceRemaining,
      max: casting.forceMax,
      resetOn: "long"
    });
  }
  if (casting.techMax > 0) {
    list.push({
      id: "techPoints",
      label: "Tech Points",
      value: casting.techRemaining,
      max: casting.techMax,
      resetOn: "short"
    });
  }
  if (casting.hasForce) {
    list.push({
      id: "tempForce",
      label: "Temp Force Points",
      value: casting.tempForce,
      max: Math.max(10, casting.tempForce + 5),
      resetOn: "long"
    });
  }
  if (casting.hasTech) {
    list.push({
      id: "tempTech",
      label: "Temp Tech Points",
      value: casting.tempTech,
      max: Math.max(10, casting.tempTech + 5),
      resetOn: "long"
    });
  }
  const maxPowerLevel = Math.max(casting.maxForceLevel, casting.maxTechLevel);
  if (maxPowerLevel >= 6) {
    for (let lvl = 6; lvl <= Math.min(9, maxPowerLevel); lvl++) {
      const key = "level" + lvl;
      const used = Boolean(session.highLevelCasting?.[key]);
      list.push({
        id: "hlc:" + key,
        label: lvl + "th-level slot",
        value: used ? 0 : 1,
        max: 1,
        resetOn: "long"
      });
    }
  }
  if (traits.isConsular) {
    list.push({
      id: "forceRecovery",
      label: "Force Recovery",
      value: Math.max(0, 1 - (session.spent.forceRecovery || 0)),
      max: 1,
      resetOn: "long"
    });
    if (profile.level >= 2) {
      const shieldMax = 2 + [5, 9, 13, 17].filter(req => profile.level >= req).length;
      list.push({
        id: "forceShield",
        label: "Force Shield",
        value: Math.max(0, shieldMax - (session.spent.forceShield || 0)),
        max: shieldMax,
        resetOn: "long"
      });
    }
  }
  if (traits.isGuardian) {
    const cfMax = 2 + [5, 9, 13, 17].filter(req => (profile.level || 1) >= req).length;
    list.push({
      id: "channelForce",
      label: "Channel the Force",
      value: Math.max(0, cfMax - (session.spent.channelForce || 0)),
      max: cfMax,
      resetOn: "short"
    });
  }
  if (traits.isFighter) {
    list.push({
      id: "secondWind",
      label: "Second Wind",
      value: Math.max(0, 1 - (session.spent.secondWind || 0)),
      max: 1,
      resetOn: "short"
    });
    if (profile.level >= 2) {
      const surgeMax = profile.level >= 17 ? 2 : 1;
      list.push({
        id: "actionSurge",
        label: "Action Surge",
        value: Math.max(0, surgeMax - (session.spent.actionSurge || 0)),
        max: surgeMax,
        resetOn: "short"
      });
    }
    if (profile.level >= 9) {
      const indMax = profile.level >= 17 ? 3 : profile.level >= 13 ? 2 : 1;
      list.push({
        id: "indomitable",
        label: "Indomitable",
        value: Math.max(0, indMax - (session.spent.indomitable || 0)),
        max: indMax,
        resetOn: "long"
      });
    }
  }
  if (traits.isScholar && profile.level >= 2) {
    list.push({
      id: "sageAdvice",
      label: "Sage Advice",
      value: Math.max(0, 1 - (session.spent.sageAdvice || 0)),
      max: 1,
      resetOn: profile.level >= 13 ? "short" : "long"
    });
  }
  const sup = superiorityStats(profile, session);
  if (sup.qty > 0) {
    list.push({
      id: "superiority",
      label: "Superiority Dice" + (sup.size ? " · " + sup.size : ""),
      value: sup.remaining,
      max: sup.qty,
      resetOn: "short"
    });
  }
  if (sup.freeD4Max > 0) {
    list.push({
      id: "superiorityMasteryD4",
      label: "Superiority Mastery (d4)",
      value: Math.max(0, sup.freeD4Max - (session.spent.superiorityMasteryD4 || 0)),
      max: sup.freeD4Max,
      resetOn: "long"
    });
  }
  if (traits.isEngineer || step["Potent Aptitude"]) {
    const paMax = 2 + [5, 9, 13, 17].filter(req => (profile.level || 1) >= req).length;
    list.push({
      id: "potentAptitude",
      label: "Potent Aptitude (" + (step["Potent Aptitude"] || "d4") + ")",
      value: Math.max(0, paMax - (session.spent.potentAptitude || 0)),
      max: paMax,
      resetOn: "short"
    });
  }
  if (traits.isOperative && (profile.level || 1) >= 3) {
    list.push({
      id: "badFeeling",
      label: "Bad Feeling",
      value: Math.max(0, 1 - (session.spent.badFeeling || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (traits.isOperative && (profile.level || 1) >= 20) {
    list.push({
      id: "strokeOfLuck",
      label: "Stroke of Luck",
      value: Math.max(0, 1 - (session.spent.strokeOfLuck || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (traits.isScholar && (profile.level || 1) >= 14) {
    const ccMax = (profile.level || 1) >= 17 ? 6 : 5;
    list.push({
      id: "calmAndCollected",
      label: "Calm and Collected",
      value: Math.max(0, ccMax - (session.spent.calmAndCollected || 0)),
      max: ccMax,
      resetOn: "long"
    });
  }
  if (traits.isGuardian && session.classImprovementEnabled) {
    const hfMax = profile.proficiency || 2;
    list.push({
      id: "harnessForce",
      label: "Harness the Force",
      value: Math.max(0, hfMax - (session.spent.harnessForce || 0)),
      max: hfMax,
      resetOn: "long"
    });
  }
  const baseFocusMax = parseNumericStat(step["Focus Points"]);
  const focusExtra = (baseFocusMax > 0 && traits.focusMaxHalfForceMod) ? Math.max(1, Math.floor(Math.max(modifier(scores.Wisdom), modifier(scores.Charisma)) / 2)) : 0;
  const focusMax = baseFocusMax + focusExtra;
  if (focusMax > 0) {
    list.push({
      id: "focus",
      label: "Focus Points",
      value: Math.max(0, focusMax - (session.spent.focus || 0)),
      max: focusMax,
      resetOn: "short"
    });
  }
  const idealMax = parseNumericStat(step["Ideal Manifests"]);
  if (traits.isSentinel && idealMax > 0) {
    list.push({
      id: "idealManifests",
      label: "Ideal Manifests",
      value: Math.max(0, idealMax - (session.spent.idealManifests || 0)),
      max: idealMax,
      resetOn: "long"
    });
  }
  if (hasFeat(session, "Snappy Interjection")) {
    list.push({
      id: "snappyInterjection",
      label: "Snappy Interjection",
      value: Math.max(0, 1 - (session.spent.snappyInterjection || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (hasFeat(session, "Techie")) {
    list.push({
      id: "techieRepairDroid",
      label: "Repair Droid (Techie)",
      value: Math.max(0, 1 - (session.spent.techieRepairDroid || 0)),
      max: 1,
      resetOn: "long"
    });
  }
  for (const ft of (session?.feats || [])) {
    const rec = featRule(ft.name);
    const ca = rec?.combatAction;
    if (!ca?.uses) continue;
    const key = "featAct:" + normalizeName(rec.name);
    list.push({
      id: key,
      label: rec.name + " (Feat)",
      value: Math.max(0, ca.uses - (session.spent[key] || 0)),
      max: ca.uses,
      resetOn: ca.resetOn || "short"
    });
  }
  if (hasFeat(session, "Lucky")) {
    list.push({
      id: "luck",
      label: "Luck Points",
      value: Math.max(0, 3 - (session.spent.luck || 0)),
      max: 3,
      resetOn: "long"
    });
  }
  const spRec = speciesRecord(profile?.species);
  for (const ct of (spRec?.combatTraits || [])) {
    if (!ct.uses || (ct.minLevel && (profile.level || 1) < ct.minLevel)) continue;
    const key = "spTrait:" + normalizeName(ct.name);
    list.push({
      id: key,
      label: ct.name + " (" + spRec.name + ")",
      value: Math.max(0, ct.uses - (session.spent[key] || 0)),
      max: ct.uses,
      resetOn: ct.resetOn || "short"
    });
  }
  if (spRec?.specialAttack) {
    list.push({
      id: "speciesSpecial",
      label: spRec.specialAttack.name,
      value: Math.max(0, 1 - (session.spent.speciesSpecial || 0)),
      max: 1,
      resetOn: spRec.specialAttack.resetOn || "short"
    });
  }
  if (spRec?.furyOfTheSmall) {
    list.push({
      id: "furyOfTheSmall",
      label: "Fury of the Small",
      value: Math.max(0, 1 - (session.spent.furyOfTheSmall || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (spRec?.primitiveNerves) {
    list.push({
      id: "primitiveNerves",
      label: "Primitive Nerves",
      value: Math.max(0, 1 - (session.spent.primitiveNerves || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (spRec?.echaniArt) {
    const eaMax = Math.max(1, modifier(scores.Wisdom));
    list.push({
      id: "echaniArt",
      label: "Echani Art",
      value: Math.max(0, eaMax - (session.spent.echaniArt || 0)),
      max: eaMax,
      resetOn: "long"
    });
  }
  const armCh = armorStats(profile, session);
  if (armCh.chargingMax > 0) {
    list.push({
      id: "charging",
      label: "Charging (+damage next melee)",
      value: clamp(session.spent.charging || 0, 0, armCh.chargingMax),
      max: armCh.chargingMax,
      resetOn: "short"
    });
  }
  const archMech = archetypeMechanics(profile, session);
  const archLabel = archetypeRecord(session?.approach, profile?.className)?.name || session?.approach || "Archetype";
  for (const act of (archMech?.actions || [])) {
    if (act.minLevel && (profile?.level || 1) < act.minLevel) continue;
    const maxU = archetypeActionMaxUses(act, profile, session);
    if (maxU <= 0) continue;
    const key = "archAct:" + normalizeName(act.name);
    list.push({
      id: key,
      label: act.resourceLabel || act.name,
      value: Math.max(0, maxU - (session.spent[key] || 0)),
      max: maxU,
      resetOn: act.resetOn || "long"
    });
  }
  list.push({
    id: "hitDice",
    label: "Hit Dice · d" + profile.hitDie,
    value: session.hitDice,
    max: profile.level,
    resetOn: "long-half"
  });
  return list;
}

function extractSkillsFromText(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  return Object.keys(skills).filter(name => new RegExp("\\b" + name.toLowerCase().replace(/ /g, "\\s+") + "\\b").test(lower));
}

function textGrantsSkill(text, skillName) {
  if (!text) return false;
  const skillRx = new RegExp("\\b" + skillName.toLowerCase().replace(/ /g, "\\s+") + "\\b", "i");
  const sentences = String(text).split(/(?<=[.!?\n])\s+/);
  return sentences.some(sentence => /proficienc|expertise/i.test(sentence) && skillRx.test(sentence));
}

function skillProvenance(profile, session, skillName, rank) {
  if (!rank) return "";
  const grants = [];
  const bg = backgroundRecord(profile.background);
  if (bg && (bg.skills || []).some(s => normalizeName(s) === normalizeName(skillName))) {
    grants.push(bg.name + " (background)");
  }
  const cls = classRecord(profile.className);
  if (cls) {
    const list = cls.skillChoicesList || [];
    if (list.some(s => normalizeName(s) === "any") || list.some(s => normalizeName(s) === normalizeName(skillName))) {
      grants.push(cls.name + " (class)");
    }
  }
  const sp = speciesRecord(profile.species);
  if (sp && (sp.skills || []).some(s => normalizeName(s) === "any" || normalizeName(s) === normalizeName(skillName))) {
    grants.push(sp.name + " (species)");
  }
  const arch = archetypeRecord(session?.approach, profile.className);
  if (arch && textGrantsSkill(arch.rules, skillName)) {
    grants.push(arch.name + " (archetype)");
  }
  const featGrants = [];
  for (const feat of session?.feats || []) {
    const rule = featRule(feat.name);
    if (rule?.mechanics?.skillGrant && normalizeName(rule.mechanics.skillGrant) === normalizeName(skillName)) {
      featGrants.push(feat.name + " (feat)");
    }
  }
  if (rank === 2) {
    if (grants.length && featGrants.length) {
      return grants.join(" or ") + " + " + featGrants.join(", ") + " → Expertise";
    }
    const all = [...grants, ...featGrants];
    return all.length ? all.join(" + ") + " (Expertise)" : "Custom / manual Expertise";
  }
  const all = [...grants, ...featGrants];
  return all.length ? all.join(" or ") : "Custom / manual proficiency";
}

/* Universal SW5e Prerequisite Enforcement Engine */
function checkClassOptionPrerequisite(profile, session, opt) {
  const raw = String(opt?.prerequisite || "").trim();
  if (!raw) return {met: true, reason: ""};
  const reasons = [];
  const levelMatch = raw.match(/(\d+)(?:st|nd|rd|th)\s+level/i);
  if (levelMatch) {
    const reqLvl = Number(levelMatch[1]);
    if ((profile?.level || 1) < reqLvl) reasons.push("Requires Level " + reqLvl);
  }
  const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (/^\d+(?:st|nd|rd|th)\s+level$/i.test(part)) continue;
    const owned = (session?.classOptions || []).some(n => normalizeName(n) === normalizeName(part));
    if (!owned) reasons.push("Requires " + part);
  }
  return {met: reasons.length === 0, reason: reasons.join(" · ")};
}

function checkPowerPrerequisite(profile, session, power) {
  const reasons = [];
  const casting = castingStats(profile, session);
  if (power.level > 0) {
    const maxLvl = power.type === "Tech" ? casting.maxTechLevel : casting.maxForceLevel;
    if (maxLvl > 0 && power.level > maxLvl) {
      reasons.push("Requires Level " + power.level + " " + power.type.toLowerCase() + "casting");
    }
  }
  const raw = String(power?.prerequisite || "").trim();
  if (raw) {
    const known = new Set(activePowerNames(profile, session).map(normalizeName));
    if (!known.has(normalizeName(raw))) {
      reasons.push("Requires " + raw);
    }
  }
  return {met: reasons.length === 0, reason: reasons.join(" · ")};
}

function checkCombatOptionPrerequisite(profile, session, def, entry) {
  const raw = String(entry?.prerequisite || "").trim();
  if (!raw) return {met: true, reason: ""};
  const reasons = [];
  const casting = castingStats(profile, session);
  const training = effectiveTraining(profile, session);

  const profMatch = raw.match(/^Proficiency (?:in|with) (.+)$/i);
  if (profMatch) {
    const skillName = profMatch[1].trim();
    const matchedSkill = Object.keys(skills).find(s => normalizeName(s) === normalizeName(skillName));
    if (matchedSkill && !(training[matchedSkill] >= 1)) {
      reasons.push("Requires proficiency in " + matchedSkill);
    }
  } else if (/^The ability to cast force powers$/i.test(raw)) {
    const lightStrat = typeof hasClassOption === "function" && hasClassOption(profile, session, "Lightweapon Strategist");
    if (!casting.hasForce && !(lightStrat && /formfighting/i.test(entry?.name || ""))) reasons.push("Requires forcecasting");
  } else if (/^The ability to cast tech powers$/i.test(raw)) {
    if (!casting.hasTech) reasons.push("Requires techcasting");
  } else if (/\bmaneuver$/i.test(raw)) {
    const reqName = raw.replace(/\s+maneuver$/i, "").trim();
    const hasManeuver = (session?.maneuvers || []).some(m => normalizeName(m) === normalizeName(reqName));
    if (!hasManeuver) reasons.push("Requires " + reqName);
  } else if (/^Companion$/i.test(raw)) {
    const hasComp = hasFeat(session, "Companion Keeper") || /companion|astrotech|beastmaster|turret/i.test(session?.approach || "");
    if (!hasComp) reasons.push("Requires a Companion");
  }
  return {met: reasons.length === 0, reason: reasons.join(" · ")};
}

function checkFeatPrerequisite(profile, session, feat) {
  const raw = String(feat?.prerequisite || "").trim();
  if (!raw) return {met: true, reason: ""};
  const reasons = [];
  const scores = effectiveScores(profile, session);
  const casting = castingStats(profile, session);
  const sp = speciesRecord(profile?.species);
  const isDroid = Boolean(sp?.traits?.some(t => t.name === "Type" && /droid/i.test(t.description)) || /^droid/i.test(profile?.species || ""));
  const size = sp?.size || "Medium";

  // Split by semicolon or comma while keeping "or" lists intact
  const segments = raw.split(";").map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    // Check "Ability1, Ability2, ..., or AbilityN XX" pattern
    const orAbMatch = seg.match(/^((?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)(?:,\s*(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma))*(?:,?\s+or\s+(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)))\s+(\d+)$/i);
    if (orAbMatch) {
      const reqScore = Number(orAbMatch[2]);
      const abNames = orAbMatch[1].match(/Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma/gi) || [];
      const ok = abNames.some(ab => {
        const canonical = abilities.find(a => a.toLowerCase() === ab.toLowerCase());
        return canonical && (scores[canonical] || 0) >= reqScore;
      });
      if (!ok) reasons.push("Requires " + seg);
      continue;
    }

    for (const part of seg.split(",").map(p => p.trim()).filter(Boolean)) {
      const lvlM = part.match(/^(\d+)(?:st|nd|rd|th)\s+level$/i);
      if (lvlM) {
        const reqLvl = Number(lvlM[1]);
        if ((profile?.level || 1) < reqLvl) reasons.push("Requires Level " + reqLvl);
        continue;
      }
      const abM = part.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)$/i);
      if (abM) {
        const canonical = abilities.find(a => a.toLowerCase() === abM[1].toLowerCase());
        const reqScore = Number(abM[2]);
        if (canonical && (scores[canonical] || 0) < reqScore) reasons.push("Requires " + canonical + " " + reqScore);
        continue;
      }
      const sizeM = part.match(/^size\s+(Tiny|Small|Medium|Large|Huge)$/i);
      if (sizeM) {
        if (size.toLowerCase() !== sizeM[1].toLowerCase()) reasons.push("Requires size " + sizeM[1]);
        continue;
      }
      if (/^Type droid$/i.test(part)) {
        if (!isDroid) reasons.push("Requires droid species");
        continue;
      }
      if (/^Type humanoid$/i.test(part) || /^Type beast or humanoid$/i.test(part)) {
        if (isDroid) reasons.push("Requires humanoid species");
        continue;
      }
      const castLvlM = part.match(/^The ability to cast (\d+)(?:st|nd|rd|th)-level (force|tech) powers$/i);
      if (castLvlM) {
        const reqLvl = Number(castLvlM[1]);
        const kind = castLvlM[2].toLowerCase();
        const maxLvl = kind === "tech" ? casting.maxTechLevel : casting.maxForceLevel;
        if (maxLvl < reqLvl) reasons.push("Requires Level " + reqLvl + " " + kind + "casting");
        continue;
      }
      if (/^the ability to cast force or tech powers$/i.test(part)) {
        if (!casting.hasForce && !casting.hasTech) reasons.push("Requires forcecasting or techcasting");
        continue;
      }
      if (/^The ability to cast force powers$/i.test(part)) {
        if (!casting.hasForce) reasons.push("Requires forcecasting");
        continue;
      }
      if (/^The ability to cast tech powers$/i.test(part)) {
        if (!casting.hasTech) reasons.push("Requires techcasting");
        continue;
      }
      const featM = part.match(/^(.+)\s+feat$/i);
      if (featM) {
        if (!hasFeat(session, featM[1].trim())) reasons.push("Requires " + featM[1].trim() + " feat");
        continue;
      }
    }
  }
  return {met: reasons.length === 0, reason: reasons.join(" · ")};
}
