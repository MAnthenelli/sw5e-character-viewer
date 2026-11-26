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
function weaponFocusRule(name, opts = null) {
  const k = normalizeName(name);
  if (!k) return null;
  const direct = weaponFocusRules.get(k);
  if (direct) return direct;
  if (opts?.allowBare) {
    const stripped = k.replace(/\s+weapon\s+focus$/i, "").replace(/\s+focus$/i, "").replace(/\s+weapon$/i, "").trim();
    return weaponFocusRules.get(stripped + " focus") || weaponFocusRules.get(stripped + " weapon focus") || null;
  }
  return null;
}
const SW5E_SOURCEBOOK_NAMES = {
  phb: "Player's Handbook",
  ec: "Expanded Content",
  wh: "Wretched Hives",
  snv: "Scum and Villainy",
  sotg: "Starships of the Galaxy"
};
function formatSourceBook(src) {
  const raw = String(src || "").trim();
  if (!raw) return "";
  return SW5E_SOURCEBOOK_NAMES[raw.toLowerCase()] || raw;
}
function featChoiceKind(rule) {
  if (!rule) return "";
  if (rule.mechanics?.choiceKind) return rule.mechanics.choiceKind;
  if (rule.choiceSpec && (rule.choiceSpec.count || 1) <= 1) return rule.choiceSpec.kind || "";
  return "";
}
function ownedWeaponFocusGroups(profile, session) {
  const groups = new Set();
  const addName = nm => {
    const rec = weaponFocusRule(nm, { allowBare: true });
    if (rec?.group) groups.add(rec.group);
  };
  for (const f of session?.feats || []) {
    const fRule = typeof featRule === "function" ? featRule(typeof f === "string" ? f : f?.name) : null;
    if (featChoiceKind(fRule) === "weaponFocus" && f?.choice) addName(f.choice);
  }
  for (const nm of Array.isArray(profile?.weaponFocuses) ? profile.weaponFocuses : []) addName(nm);
  for (const nm of Array.isArray(session?.weaponFocuses) ? session.weaponFocuses : []) addName(nm);
  return groups;
}
function _matchesWeaponProfToken(token, rule) {
  const t = normalizeName(token);
  if (!t || !rule) return false;
  const cls = normalizeName(rule.classification || "");
  const nm = normalizeName(rule.name || "");
  if (t === nm || t === cls) return true;
  if (t === "all weapons") return true;
  if (t === "simple weapons" || t === "all simple weapons") return cls.startsWith("simple");
  if (t === "martial weapons" || t === "all martial weapons") return cls.startsWith("martial");
  if (t === "all blasters" || t === "blasters") return cls.includes("blaster");
  if (t === "simple blasters") return cls === "simpleblaster";
  if (t === "martial blasters") return cls === "martialblaster";
  if (t === "all vibroweapons" || t === "vibroweapons") return cls.includes("vibroweapon");
  if (t === "simple vibroweapons") return cls === "simplevibroweapon";
  if (t === "martial vibroweapons") return cls === "martialvibroweapon";
  if (t === "all lightweapons" || t === "lightweapons") return cls.includes("lightweapon");
  if (t === "simple lightweapons") return cls === "simplelightweapon";
  if (t === "martial lightweapons") return cls === "martiallightweapon";
  return false;
}
function wieldingProficientWeaponGroup(profile, session, groupName, opts = null) {
  const want = normalizeName(groupName);
  if (!want || !session) return false;
  const equippedWeapons = (session.equipped || []).filter(item => {
    if (!item || !item.equipped) return false;
    const rule = itemRule(item.name, item);
    return rule && rule.category === "Weapon";
  });
  if (!equippedWeapons.length) return false;
  const nonRecursiveProf = rule => {
    const clsRec = typeof classRecord === "function" ? classRecord(profile?.className) : null;
    const tokens = [
      ...(Array.isArray(clsRec?.weaponProficiencies) ? clsRec.weaponProficiencies : []),
      ...(Array.isArray(profile?.customProficiencies) ? profile.customProficiencies : []),
      ...(Array.isArray(session?.customProficiencies) ? session.customProficiencies : [])
    ];
    for (const eff of (Array.isArray(opts?.collectedEffects) ? opts.collectedEffects : [])) {
      if (eff?.type === "proficiency" && eff.kind === "weapon" && eff.target) tokens.push(eff.target);
    }
    return tokens.some(tok => _matchesWeaponProfToken(tok, rule));
  };
  for (const item of equippedWeapons) {
    const { rule, modalModeName } = activeWeaponRule(item);
    const grp = weaponClassOf(modalModeName || item.name);
    if (normalizeName(grp) !== want) continue;
    const prof = opts?.noRecurse
      ? nonRecursiveProf(rule)
      : (typeof isWeaponProficient === "function" ? isWeaponProficient(profile, session, rule) : nonRecursiveProf(rule));
    if (prof) return true;
  }
  return false;
}
function weaponSupremacyRule(name, opts = null) {
  const k = normalizeName(name);
  if (!k) return null;
  const direct = weaponSupremacyRules.get(k);
  if (direct) return direct;
  if (opts?.allowBare) {
    const stripped = k.replace(/\s+weapon\s+supremacy$/i, "").replace(/\s+supremacy$/i, "").replace(/\s+weapon$/i, "").trim();
    return weaponSupremacyRules.get(stripped + " supremacy") || weaponSupremacyRules.get(stripped + " weapon supremacy") || null;
  }
  return null;
}
function ownedWeaponSupremacyGroups(profile, session) {
  const groups = new Set();
  const addName = nm => {
    const rec = weaponSupremacyRule(nm, { allowBare: true });
    if (rec?.group) groups.add(rec.group);
  };
  for (const f of session?.feats || []) {
    const fRule = typeof featRule === "function" ? featRule(typeof f === "string" ? f : f?.name) : null;
    if (featChoiceKind(fRule) === "weaponSupremacy" && f?.choice) addName(f.choice);
  }
  for (const nm of Array.isArray(profile?.weaponSupremacies) ? profile.weaponSupremacies : []) addName(nm);
  for (const nm of Array.isArray(session?.weaponSupremacies) ? session.weaponSupremacies : []) addName(nm);
  return groups;
}
const weaponClassOf = name => (typeof SW5E_WEAPON_CLASS_MAP !== "undefined" ? SW5E_WEAPON_CLASS_MAP[normalizeName(name)] : "") || "";
function parseModalModes(properties) {
  return weaponPropertyProfile(properties).modalModes;
}

const modifier = score => Math.floor((score - 10) / 2);
const signed = value => { const n = Number(value) || 0; return n < 0 ? "−" + Math.abs(n) : "+" + n; };
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
function fightingStyleRule(name, opts = null) {
  const k = normalizeName(name);
  if (!k) return null;
  const direct = fightingStyleRules.get(k);
  if (direct) return direct;
  if (opts?.allowBare) {
    const stripped = k.replace(/\s+fighting\s+style$/i, "").replace(/\s+style$/i, "").trim();
    return fightingStyleRules.get(stripped + " style") || null;
  }
  return null;
}
function fightingMasteryRule(name, opts = null) {
  const k = normalizeName(name);
  if (!k) return null;
  const direct = fightingMasteryRules.get(k);
  if (direct) return direct;
  if (opts?.allowBare) {
    const stripped = k.replace(/\s+fighting\s+mastery$/i, "").replace(/\s+mastery$/i, "").trim();
    return fightingMasteryRules.get(stripped + " mastery") || null;
  }
  return null;
}
function lightsaberFormRule(name) {
  const k = normalizeName(name);
  if (!k) return null;
  const direct = lightsaberFormRules.get(k);
  if (direct) return direct;
  const stripped = k.replace(/^form\s+[ivx]+\s*[:\-–]\s*/i, "").replace(/\s+lightsaber\s+form$/i, "").trim();
  return lightsaberFormRules.get(stripped) || lightsaberFormRules.get(stripped + " form") || null;
}
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

function sw5eMinRollThreshold(die) {
  const sides = Number(String(die || "").replace(/^1?d/i, ""));
  return (typeof SW5E_MIN_ROLL_THRESHOLD !== "undefined" && SW5E_MIN_ROLL_THRESHOLD[sides]) || 0;
}

function formatDiceWithMin(diceCount, dieSize, minPerDie) {
  const count = Math.floor(Number(diceCount) || 0);
  const sides = Number(String(dieSize || "").replace(/^1?d/i, "")) || 0;
  const floor = Math.floor(Number(minPerDie) || 0);
  if (count <= 0 || sides <= 0) return "";
  const base = count + "d" + sides;
  if (floor <= 0) return base;
  return count === 1 ? (base + " (min " + floor + ")") : (base + " (min " + floor + "/die)");
}

function formatDieWithMin(dieSize, minPerDie) {
  const sides = Number(String(dieSize || "").replace(/^1?d/i, "")) || 0;
  const floor = Math.floor(Number(minPerDie) || 0);
  if (sides <= 0) return String(dieSize || "");
  return floor > 0 ? ("d" + sides + " (min " + floor + ")") : ("d" + sides);
}

let _inScholarCaAbility = false;
function scholarCriticalAnalysisAbility(profile, session) {
  let override = null;
  if (!_inScholarCaAbility && typeof resolveDefenseEffects === "function") {
    _inScholarCaAbility = true;
    try {
      const dEff = resolveDefenseEffects(profile, session);
      override = (dEff?.combatTraits || []).find(ct => ct.kind === "scholarAbilityOverride") || null;
    } finally {
      _inScholarCaAbility = false;
    }
  }
  if (!override) return "Intelligence";
  const norm = normalizeName(override.ability);
  if (norm === "wisdom") return "Wisdom";
  if (norm === "charisma") return "Charisma";
  const sc = effectiveScores(profile, session);
  const wisM = modifier(sc.Wisdom), chaM = modifier(sc.Charisma), intM = modifier(sc.Intelligence);
  if (wisM >= chaM && wisM >= intM) return "Wisdom";
  if (chaM >= wisM && chaM >= intM) return "Charisma";
  return "Intelligence";
}

function generalManeuverOverrides(profile, session) {
  if (typeof resolveDefenseEffects !== "function") return [];
  const dEff = resolveDefenseEffects(profile, session);
  return (dEff?.combatTraits || [])
    .filter(ct => ct.kind === "generalManeuverOverride" && ct.target && ct.target !== "chosen")
    .map(ct => ct.target);
}

let _inMonkFocusAbility = false;
function monkFocusAbility(profile, session, baseClassOnly = true) {
  const sc = effectiveScores(profile, session);
  let override = null;
  if (!_inMonkFocusAbility && typeof resolveDefenseEffects === "function") {
    _inMonkFocusAbility = true;
    try {
      const dEff = resolveDefenseEffects(profile, session);
      override = (dEff?.combatTraits || []).find(ct => ct.kind === "focusAbilityOverride" && (!ct.baseClassOnly || baseClassOnly)) || null;
    } finally {
      _inMonkFocusAbility = false;
    }
  }
  if (override?.ability) {
    const norm = normalizeName(override.ability);
    if (norm === "strength") return "Strength";
    if (norm === "constitution") return "Constitution";
    if (norm === "intelligence") return "Intelligence";
  }
  return modifier(sc.Wisdom) >= modifier(sc.Charisma) ? "Wisdom" : "Charisma";
}

function interpolateRuleTokens(str, profile, session) {
  const raw = String(str || "");
  if (!raw.includes("{")) return raw;
  const s = raw.replace(/(\d+)\s*×\s*(\d+)/g, "$1\uE000$2");
  const lvl = Number(profile?.level || 1);
  const prof = Number(profile?.proficiency || 2);
  const sc = effectiveScores(profile, session);
  const strM = modifier(sc.Strength);
  const dexM = modifier(sc.Dexterity);
  const conM = modifier(sc.Constitution);
  const intM = modifier(sc.Intelligence);
  const wisM = modifier(sc.Wisdom);
  const chaM = modifier(sc.Charisma);
  const wisChaM = Math.max(1, wisM, chaM);
  const caAb = scholarCriticalAnalysisAbility(profile, session);
  const caMod = Math.max(1, modifier(sc[caAb]));
  const focusAb = s.includes("{focusDC}") ? monkFocusAbility(profile, session, true) : (wisM >= chaM ? "Wisdom" : "Charisma");
  const focusDC = 8 + prof + modifier(sc[focusAb]);
  const step = classLevelStep(profile) || {};
  const monkLvlTok = classLevelOf(profile, "Monk");
  const monkStepTok = monkLvlTok > 0 ? classLevelStepFor(profile, "Monk") : step;
  const guardLvlTok = classLevelOf(profile, "Guardian");
  const guardStepTok = guardLvlTok > 0 ? classLevelStepFor(profile, "Guardian") : step;
  const scoutLvlTok = classLevelOf(profile, "Scout");
  const scoutStepTok = scoutLvlTok > 0 ? classLevelStepFor(profile, "Scout") : step;
  const engLvlTok = classLevelOf(profile, "Engineer");
  const figLvlTok = classLevelOf(profile, "Fighter");
  const opLvlTok = classLevelOf(profile, "Operative");
  const schLvlTok = classLevelOf(profile, "Scholar");
  const sentLvlTok = classLevelOf(profile, "Sentinel");
  const sentStepTok = sentLvlTok > 0 ? classLevelStepFor(profile, "Sentinel") : step;
  const maDie = monkStepTok["Martial Arts"] || "1d4";
  const auraRadius = guardStepTok["Aura Radius"] || "5 ft.";
  const routineRadius = scoutStepTok["Routine Radius"] || "5 ft.";
  const needsSupTok = /\{(?:supDie|supQty|supMinRoll|maneuverDC|physicalManeuverDC|mentalManeuverDC|generalManeuverDC)\}/.test(s);
  const supTokInfo = (needsSupTok && typeof superiorityStats === "function" && session) ? superiorityStats(profile, session) : null;
  const supDie = (supTokInfo && supTokInfo.size) || step["Superiority Dice Size"] || (lvl >= 17 ? "d12" : lvl >= 13 ? "d10" : lvl >= 9 ? "d8" : lvl >= 5 ? "d6" : "d4");
  const supMinRoll = sw5eMinRollThreshold(supDie) || 2;
  const physManMod = Math.max(strM, dexM, conM);
  const mentManMod = Math.max(intM, wisM, chaM);
  const genManMod = Math.max(physManMod, mentManMod);
  const modTerm = m => m > 0 ? (" + " + m) : (m < 0 ? (" \u2212 " + Math.abs(m)) : "");
  const forceModVal = Math.max(wisM, chaM);
  const encouragingAllies = lvl >= 17 ? 6 : lvl >= 13 ? 5 : lvl >= 9 ? 4 : lvl >= 5 ? 3 : 2;
  const rageDmgVal = Number((typeof effectiveRageStats === "function" ? effectiveRageStats(profile, session).rageDamage : profile?.rageDamage) || parseNumericStat(step["Rage Damage"]) || 2);
  const forceRecVal = typeof consularForceRecoveryAmount === "function"
    ? consularForceRecoveryAmount(profile, session, Math.max(wisM, chaM))
    : Math.max(1, Math.floor(lvl / 2) + Math.max(wisM, chaM));
  const paLvlTok = engLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Engineer", "Potent Aptitude") : (engLvlTok || lvl);
  const paStepTok = engLvlTok > 0 && paLvlTok > 0 ? (classRecord("Engineer")?.levelChanges?.[String(Math.min(20, paLvlTok))] || step) : step;
  const potentAptitudeDie = paStepTok["Potent Aptitude"] || step["Potent Aptitude"] || (paLvlTok >= 17 ? "d12" : paLvlTok >= 13 ? "d10" : paLvlTok >= 9 ? "d8" : paLvlTok >= 5 ? "d6" : "d4");
  const potentAptitudeUses = 2 + [5, 9, 13, 17].filter(req => paLvlTok >= req).length;
  const infuseBonus = (engLvlTok || lvl) >= 15 ? 3 : (engLvlTok || lvl) >= 10 ? 2 : 1;
  const actionSurgeUses = (figLvlTok || lvl) >= 17 ? "2 uses" : "1 use";
  const indomitableUses = (figLvlTok || lvl) >= 17 ? "3 uses" : (figLvlTok || lvl) >= 13 ? "2 uses" : "1 use";
  const cfLvlTok = guardLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Guardian", "Channel the Force") : (guardLvlTok || lvl);
  const cfUsesNum = 2 + [5, 9, 13, 17].filter(req => cfLvlTok >= req).length;
  const channelForceUses = cfUsesNum + " uses";
  const fsLvlTok = guardLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Guardian", "Focused Strikes") : (guardLvlTok || lvl);
  const fsStepTok = guardLvlTok > 0 && fsLvlTok > 0 ? (classRecord("Guardian")?.levelChanges?.[String(Math.min(20, fsLvlTok))] || step) : step;
  const focusedStrikesMax = fsStepTok["Focused Strikes"] || step["Focused Strikes"] || (fsLvlTok >= 17 ? "6d8" : fsLvlTok >= 13 ? "5d8" : fsLvlTok >= 9 ? "4d8" : fsLvlTok >= 5 ? "3d8" : "2d8");
  const aurasKnownCount = guardStepTok["Auras Known"] || ((guardLvlTok || lvl) >= 18 ? "3" : (guardLvlTok || lvl) >= 10 ? "2" : "1");
  const dexPlusLevelSigned = signed(dexM + (monkLvlTok || lvl));
  const slowFallReduction = String((monkLvlTok || lvl) * 5);
  const saLvlTok = opLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Operative", "Sneak Attack") : (opLvlTok || lvl);
  const saStepTok = opLvlTok > 0 && saLvlTok > 0 ? (classRecord("Operative")?.levelChanges?.[String(Math.min(20, saLvlTok))] || step) : step;
  const sneakAttackDice = saStepTok["Sneak Attack"] || step["Sneak Attack"] || (Math.ceil(saLvlTok / 2) + "d6");
  const supQtyTok = (supTokInfo && supTokInfo.qty) || parseNumericStat(step["Superiority Dice Quantity"]) || (lvl >= 19 ? 12 : lvl >= 17 ? 11 : lvl >= 15 ? 10 : lvl >= 13 ? 9 : lvl >= 11 ? 8 : lvl >= 9 ? 7 : lvl >= 7 ? 6 : lvl >= 5 ? 5 : lvl >= 3 ? 4 : 3);
  const sageAdviceReset = (schLvlTok || lvl) >= 13 ? "short or long rest" : "long rest";
  const calmAndCollectedUses = (schLvlTok || lvl) >= 17 ? "6 uses" : "5 uses";
  const rqLvlTok = scoutLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Scout", "Ranger's Quarry") : (scoutLvlTok || lvl);
  const rqStepTok = scoutLvlTok > 0 && rqLvlTok > 0 ? (classRecord("Scout")?.levelChanges?.[String(Math.min(20, rqLvlTok))] || step) : step;
  const rawQuarryDie = rqStepTok["Ranger's Quarry"] || step["Ranger's Quarry"] || (rqLvlTok >= 17 ? "d12" : rqLvlTok >= 13 ? "d10" : rqLvlTok >= 9 ? "d8" : rqLvlTok >= 5 ? "d6" : "d4");
  const quarryDie = /^d/i.test(String(rawQuarryDie)) ? ("1" + rawQuarryDie) : String(rawQuarryDie);
  const quarryDuration = rqLvlTok >= 17 ? "24 hours" : rqLvlTok >= 9 ? "8 hours" : "1 hour";
  const routinesKnownCount = scoutStepTok["Routines Known"] && scoutStepTok["Routines Known"] !== "—" ? scoutStepTok["Routines Known"] : ((scoutLvlTok || lvl) >= 15 ? "3" : (scoutLvlTok || lvl) >= 7 ? "2" : "1");
  const kcLvlTok = sentLvlTok > 0 && typeof multiclassScaledLevel === "function"
    ? multiclassScaledLevel(profile, session, "Sentinel", "Kinetic Combat") : (sentLvlTok || lvl);
  const kcStepTok = sentLvlTok > 0 && kcLvlTok > 0 ? (classRecord("Sentinel")?.levelChanges?.[String(Math.min(20, kcLvlTok))] || step) : step;
  const kineticCombatDie = kcStepTok["Kinetic Combat"] && kcStepTok["Kinetic Combat"] !== "—" ? kcStepTok["Kinetic Combat"] : (kcLvlTok >= 17 ? "d12" : kcLvlTok >= 13 ? "d10" : kcLvlTok >= 9 ? "d8" : kcLvlTok >= 5 ? "d6" : "d4");
  const kineticCombatMax = String(parseNumericStat(String(kineticCombatDie).replace(/^1?d/i, "")) || 4);
  const idealsKnownCount = sentStepTok["Ideals Known"] && sentStepTok["Ideals Known"] !== "—" ? sentStepTok["Ideals Known"] : ((sentLvlTok || lvl) >= 11 ? "4" : (sentLvlTok || lvl) >= 6 ? "3" : "2");
  const idealManifestsMax = sentStepTok["Ideal Manifests"] && sentStepTok["Ideal Manifests"] !== "—" ? sentStepTok["Ideal Manifests"] : ((sentLvlTok || lvl) >= 17 ? "4" : (sentLvlTok || lvl) >= 9 ? "3" : "2");
  const versatileCountVal = 2 + [5, 9, 13, 17].filter(req => lvl >= req).length;
  const halfLevelPlusWisChaModVal = Math.max(1, Math.floor(lvl / 2) + wisChaM);
  const twoXWisChaScoreVal = 2 * Math.max(Number(sc.Wisdom) || 10, Number(sc.Charisma) || 10);
  const highJumpWisChaVal = Math.max(0, 3 + 2 * Math.max(wisM, chaM));
  const rawModsMap = { wisChaMod: forceModVal, intMod: intM, wisMod: wisM, chaMod: chaM, strMod: strM, dexMod: dexM, conMod: conM };
  const maneuverDCVal = supTokInfo ? (supTokInfo.generalDC || (8 + prof + genManMod)) : (8 + prof + genManMod);
  const physManeuverDCVal = supTokInfo ? supTokInfo.physicalDC : (8 + prof + physManMod);
  const mentManeuverDCVal = supTokInfo ? supTokInfo.mentalDC : (8 + prof + mentManMod);
  const genManeuverDCVal = supTokInfo ? supTokInfo.generalDC : (8 + prof + genManMod);
  const castInfo = ((s.includes("{forceDC}") || s.includes("{techDC}") || s.includes("{halfMaxTechPowerLevel}")) && typeof castingStats === "function") ? castingStats(profile, session) : null;
  const forceDCVal = castInfo?.forceDC || (8 + prof + forceModVal);
  const techDCVal = castInfo?.techDC || (8 + prof + intM);
  const halfMaxTechLvlVal = castInfo?.maxTechLevel >= 1 ? ("Level " + Math.max(1, Math.round(castInfo.maxTechLevel / 2))) : "½ Max Power Level";
  const walkVal = (s.includes("{halfWalk}") && typeof speedBreakdown === "function" && session) ? (speedBreakdown(profile, session).live || 30) : (speciesRecord(profile?.species)?.speed || 30);
  const halfWalkVal = Math.floor(walkVal / 10) * 5;
  const invBonusVal = s.includes("{investigationBonus}") ? (() => {
    const tr = typeof effectiveTraining === "function" ? effectiveTraining(profile, session) : {};
    const rank = tr.Investigation || 0;
    const skEff = typeof resolveSkillEffects === "function" ? resolveSkillEffects(profile, session, "Investigation", "Intelligence") : { effectiveAbility: "Intelligence", bonus: 0 };
    const abMod = modifier(sc[skEff.effectiveAbility || "Intelligence"]);
    const man = Number(session?.statModifiers?.["skill:Investigation"]) || 0;
    return signed(abMod + Math.floor(rank * prof) + (skEff.bonus || 0) + man);
  })() : "";
  return s
    .replace(/8\s*\+\s*\{(?:prof|proficiency)\}\s*\+\s*\{(wisChaMod|intMod|wisMod|chaMod|strMod|dexMod|conMod)\}/g, (_, k) => String(8 + prof + rawModsMap[k]))
    .replaceAll("{prof}", String(prof))
    .replaceAll("{proficiency}", String(prof))
    .replaceAll("{2xProf}", String(2 * prof))
    .replaceAll("{5xProf}", String(5 * prof))
    .replaceAll("{oneHalfProf}", String(Math.floor(prof * 1.5)))
    .replaceAll("{halfProf}", String(Math.max(1, Math.floor(prof / 2))))
    .replaceAll("{halfProfUp}", String(Math.max(1, Math.ceil(prof / 2))))
    .replaceAll("{level}", String(lvl))
    .replaceAll("{scoutLevel}", String((typeof classLevelOf === "function" ? classLevelOf(profile, "Scout") : 0) || lvl))
    .replaceAll("{5xLevel}", String(5 * lvl))
    .replaceAll("{halfLevel}", String(Math.max(1, Math.floor(lvl / 2))))
    .replaceAll("{ceilHalfLevel}", String(Math.max(1, Math.ceil(lvl / 2))))
    .replaceAll("{levelPlusCon}", String(Math.max(1, lvl + conM)))
    .replaceAll("{levelPlusCha}", String(Math.max(1, lvl + chaM)))
    .replaceAll("{strMod}", String(Math.max(1, strM)))
    .replaceAll("{strModFloor0}", String(Math.max(0, strM)))
    .replaceAll("{halfStrConMod}", String(Math.max(1, Math.floor(Math.max(strM, conM) / 2))))
    .replaceAll("{halfStrMod}", String(Math.max(1, Math.floor(strM / 2))))
    .replaceAll("{halfDexMod}", String(Math.max(1, Math.floor(dexM / 2))))
    .replaceAll("{halfConMod}", String(Math.max(1, Math.floor(conM / 2))))
    .replaceAll("{halfIntMod}", String(Math.max(1, Math.floor(intM / 2))))
    .replaceAll("{halfWisMod}", String(Math.max(1, Math.floor(wisM / 2))))
    .replaceAll("{halfChaMod}", String(Math.max(1, Math.floor(chaM / 2))))
    .replaceAll("{dexMod}", String(dexM))
    .replaceAll("{conMod}", String(conM))
    .replaceAll("{conModSigned}", signed(conM))
    .replaceAll("{conModMin1}", String(Math.max(1, conM)))
    .replaceAll("{intMod}", String(intM))
    .replaceAll("{intModMin1}", String(Math.max(1, intM)))
    .replaceAll("{intModFloor0}", String(Math.max(0, intM)))
    .replaceAll("{halfIntModFloor0}", String(Math.max(0, Math.floor(intM / 2))))
    .replaceAll("{wisMod}", String(Math.max(1, wisM)))
    .replaceAll("{wisModMin1}", String(Math.max(1, wisM)))
    .replaceAll("{wisModFloor0}", String(Math.max(0, wisM)))
    .replaceAll("{chaMod}", String(Math.max(1, chaM)))
    .replaceAll("{chaModMin1}", String(Math.max(1, chaM)))
    .replaceAll("{dcSTR}", String(8 + prof + strM))
    .replaceAll("{dcDEX}", String(8 + prof + dexM))
    .replaceAll("{dcCON}", String(8 + prof + conM))
    .replaceAll("{dcINT}", String(8 + prof + intM))
    .replaceAll("{intScorePlusProf}", String((Number(sc.Intelligence) || 10) + prof))
    .replaceAll("{dcWIS}", String(8 + prof + wisM))
    .replaceAll("{dcCHA}", String(8 + prof + chaM))
    .replaceAll("{weaponAttackDC}", "DC 8 + weapon attack bonus")
    .replaceAll("{weaponAbilityMod}", "governing ability modifier")
    .replaceAll("{weaponHalfReload}", "half reload ammo (minimum 2)")
    .replaceAll("{maneuverDC}", String(maneuverDCVal))
    .replaceAll("{physicalManeuverDC}", String(physManeuverDCVal))
    .replaceAll("{mentalManeuverDC}", String(mentManeuverDCVal))
    .replaceAll("{generalManeuverDC}", String(genManeuverDCVal))
    .replaceAll("{forceDC}", String(forceDCVal))
    .replaceAll("{techDC}", String(techDCVal))
    .replaceAll("{halfMaxTechPowerLevel}", halfMaxTechLvlVal)
    .replaceAll("{wisChaMod}", String(wisChaM))
    .replaceAll("{forceModTerm}", modTerm(forceModVal))
    .replaceAll("{forceMod}", String(forceModVal))
    .replaceAll("{forceModMin1}", String(Math.max(1, forceModVal)))
    .replaceAll("{halfForceMod}", String(Math.max(1, Math.floor(forceModVal / 2))))
    .replaceAll("{focusAttack}", signed(prof + forceModVal))
    .replaceAll("{focusModSigned}", forceModVal ? signed(forceModVal) : "")
    .replaceAll("{caAbility}", String(caAb))
    .replaceAll("{caMod}", String(caMod))
    .replaceAll("{halfCaMod}", String(Math.max(1, Math.floor(caMod / 2))))
    .replaceAll("{versatileCount}", String(versatileCountVal))
    .replaceAll("{halfLevelPlusWisChaMod}", String(halfLevelPlusWisChaModVal))
    .replaceAll("{2xWisChaScore}", String(twoXWisChaScoreVal))
    .replaceAll("{highJumpWisCha}", String(highJumpWisChaVal))
    .replaceAll("{sneakAttackDice}", String(sneakAttackDice))
    .replaceAll("{supQty}", String(supQtyTok))
    .replaceAll("{sageAdviceReset}", sageAdviceReset)
    .replaceAll("{calmAndCollectedUses}", calmAndCollectedUses)
    .replaceAll("{focusDC}", String(focusDC))
    .replaceAll("{maDie}", String(maDie))
    .replaceAll("{martialArtsDie}", String(maDie))
    .replaceAll("{auraRadius}", String(auraRadius))
    .replaceAll("{routineRadius}", String(routineRadius))
    .replaceAll("{supDie}", (!s.includes("{supMinRoll}") && !/minimum roll threshold/i.test(s) && supTokInfo?.minRollThreshold > 0) ? formatDieWithMin(supDie, supTokInfo.minRollThreshold) : String(supDie))
    .replaceAll("{supMinRoll}", String(supMinRoll))
    .replaceAll("{physicalManeuverModSigned}", signed(physManMod))
    .replaceAll("{mentalManeuverModSigned}", signed(mentManMod))
    .replaceAll("{generalManeuverModSigned}", signed(genManMod))
    .replaceAll("{physicalManeuverModTerm}", modTerm(physManMod))
    .replaceAll("{mentalManeuverModTerm}", modTerm(mentManMod))
    .replaceAll("{generalManeuverModTerm}", modTerm(genManMod))
    .replaceAll("{physicalManeuverModMin0}", String(Math.max(0, physManMod)))
    .replaceAll("{mentalManeuverModMin0}", String(Math.max(0, mentManMod)))
    .replaceAll("{generalManeuverModMin0}", String(Math.max(0, genManMod)))
    .replaceAll("{physicalManeuverMod}", String(physManMod))
    .replaceAll("{mentalManeuverMod}", String(mentManMod))
    .replaceAll("{generalManeuverMod}", String(genManMod))
    .replaceAll("{encouragingSpeechAllies}", String(encouragingAllies))
    .replaceAll("{rageDamage}", String(rageDmgVal))
    .replaceAll("{forceRecoveryAmount}", String(forceRecVal))
    .replaceAll("{potentAptitudeDie}", String(potentAptitudeDie))
    .replaceAll("{potentAptitudeUses}", String(potentAptitudeUses))
    .replaceAll("{infuseBonus}", String(infuseBonus))
    .replaceAll("{actionSurgeUses}", actionSurgeUses)
    .replaceAll("{indomitableUses}", indomitableUses)
    .replaceAll("{channelForceUses}", channelForceUses)
    .replaceAll("{focusedStrikesMax}", String(focusedStrikesMax))
    .replaceAll("{aurasKnownCount}", String(aurasKnownCount))
    .replaceAll("{dexPlusLevelSigned}", dexPlusLevelSigned)
    .replaceAll("{slowFallReduction}", slowFallReduction)
    .replaceAll("{quarryDie}", String(quarryDie))
    .replaceAll("{quarryDuration}", quarryDuration)
    .replaceAll("{routinesKnownCount}", String(routinesKnownCount))
    .replaceAll("{kineticCombatDie}", String(kineticCombatDie))
    .replaceAll("{kineticCombatMax}", kineticCombatMax)
    .replaceAll("{idealsKnownCount}", String(idealsKnownCount))
    .replaceAll("{idealManifestsMax}", String(idealManifestsMax))
    .replaceAll("{halfWalk}", String(halfWalkVal))
    .replaceAll("{investigationBonus}", invBonusVal)
    .replace(/(\d+)\s*×\s*(\d+)/g, (_, a, b) => String(Number(a) * Number(b)))
    .replaceAll("\uE000", "×");
}
function parsePropertySpec(value) {
  const raw = String(value || "").trim();
  const parenthetical = raw.match(/\(([^)]+)\)/)?.[1]?.trim() || "";
  const rawName = raw.replace(/\s*\([^)]*\)/g, "").trim();
  const number = rawName.match(/\s+(\d+)\s*$/);
  return { parenthetical, number: number ? Number(number[1]) : null, name: rawName.replace(/\s+\d+\s*$/, "") };
}

function resolvePropertyTokens(value, number, parenthetical) {
  if (value === "$param") return number;
  if (value === "$paren") return parenthetical;
  if (typeof value === "string") return value.replaceAll("$param", number ?? "").replaceAll("$paren", parenthetical);
  if (Array.isArray(value)) return value.map(entry => resolvePropertyTokens(entry, number, parenthetical));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolvePropertyTokens(entry, number, parenthetical)]));
  }
  return value;
}

function weaponPropertyProfile(properties) {
  const effects = (properties || []).flatMap(value => {
    const spec = parsePropertySpec(value);
    const record = weaponPropertyRules.get(normalizeName(spec.name));
    return (record?.effects || []).map(effect => ({
      ...resolvePropertyTokens(effect, spec.number, spec.parenthetical), property: record.name
    }));
  });
  const typed = effects.filter(effect => effect.type === "weaponRule");
  const pick = kind => typed.find(effect => effect.kind === kind)?.params;
  const restriction = pick("fireModeRestriction");
  const modes = typed.filter(effect => effect.kind === "fireMode" && (!restriction || restriction.modes.includes(effect.params.mode)));
  const double = pick("doubleWeapon");
  const offhand = double?.offhandDamage.match(/^(\d+)d(\d+)(?:\s+(.+))?$/i);
  const light = pick("lightOverride");
  const illuminationBase = pick("illumination");
  const abilityChoices = typed.filter(effect => effect.kind === "abilityChoice").map(effect => effect.params);
  const modalRaw = pick("modal")?.modes || "";
  const modalModes = modalRaw
    ? modalRaw.split(/,|\band\b/i)
        .map(s => s.trim().replace(/^tech-staff$/i, "techstaff").replace(/^double-saber$/i, "doublesaber"))
        .filter(Boolean)
    : [];
  const ammunition = pick("ammunition") || null;
  const thrown = pick("thrown") || null;
  const specialParams = pick("special") || null;
  const rangeCandidates = [
    pick("range")?.range,
    ammunition?.range,
    thrown?.range,
    specialParams?.range,
    ...(properties || []).map(value => parsePropertySpec(value).parenthetical)
  ].filter(Boolean);
  const range = rangeCandidates.find(value => /^(?:range\s+)?\d+(?:\s*\/\s*\d+)?$/i.test(value));
  const rangeMatch = range?.match(/^(?:range\s+)?(\d+)(?:\s*\/\s*(\d+))?$/i);
  const rangeSpec = rangeMatch
    ? (rangeMatch[2]
        ? { normal: Number(rangeMatch[1]), long: Number(rangeMatch[2]), text: rangeMatch[1] + "/" + rangeMatch[2] }
        : { normal: Number(rangeMatch[1]), long: null, text: rangeMatch[1] })
    : null;
  const reachBonus = typed
    .filter(effect => effect.kind === "reach" && Number.isFinite(effect.params?.bonusFeet))
    .reduce((sum, effect) => sum + effect.params.bonusFeet, 0);
  const keen = effects
    .filter(effect => effect.type === "critMod" && Number.isFinite(effect.critRangeDelta))
    .reduce((sum, effect) => sum + effect.critRangeDelta, 0);
  const strengthReq = typed.find(effect => effect.kind === "abilityReq" && effect.params.ability === "Strength")?.params || null;
  const smartRaw = pick("smartStats")?.values || "";
  const smartParts = smartRaw.match(/^(\d+)\s*\/\s*\+?(\d+)$/);
  const smart = smartParts ? { dexScore: Number(smartParts[1]), proficiencyBonus: Number(smartParts[2]) } : null;
  const switchRaw = pick("switch")?.alternateDamage || "";
  const switchParts = switchRaw.match(/^(\d+)d(\d+)\s+(.+)$/i);
  const switchTypes = switchParts ? switchParts[3].split("/").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
  const switchSpec = switchParts && switchTypes.length
    ? { dice: Number(switchParts[1]), die: Number(switchParts[2]), types: switchTypes, type: switchTypes[0] }
    : null;
  const versatileRaw = pick("versatile")?.twoHandedDamage || "";
  const versatileParts = versatileRaw.match(/^(\d+)d(\d+)$/i);
  const versatile = versatileParts ? { dice: Number(versatileParts[1]), die: Number(versatileParts[2]) } : null;
  const vicious = effects
    .filter(effect => effect.type === "attackDamageMod" && Number.isFinite(Number(effect.viciousBonusOnMaxDie)) && effect.viciousBonusOnMaxDie !== "")
    .reduce((sum, effect) => sum + Number(effect.viciousBonusOnMaxDie), 0);
  return {
    modes, restriction, range, rangeSpec, ammunition, modalModes, reachBonus, keen,
    heavy: typed.some(effect => effect.kind === "heavy"),
    lightWeapon: Boolean(pick("light")),
    interlocking: pick("interlocking") || null,
    finesse: abilityChoices.find(params => params.mode !== "mighty")?.abilities || null,
    mighty: abilityChoices.find(params => params.mode === "mighty")?.abilities || null,
    dexterityMin: typed.find(effect => effect.kind === "abilityReq" && effect.params.ability === "Dexterity")?.params.minScore,
    strengthMin: strengthReq?.minScore,
    strengthBlocksFireModes: strengthReq?.blocksFireModes || [],
    fixed: pick("fixedGrip"),
    doubleProp: double ? (offhand ? { dice: Number(offhand[1]), die: Number(offhand[2]), type: offhand[3]?.toLowerCase() } : {}) : null,
    light,
    illumination: illuminationBase && !light?.suppress ? light || illuminationBase : null,
    conversion: typed.find(effect => effect.kind === "saveConversion"),
    outcomes: typed.filter(effect => effect.kind === "hitOutcome"),
    reload: pick("reload")?.shots,
    returning: Boolean(pick("returning")),
    silent: Boolean(pick("silent")),
    smart,
    special: Boolean(specialParams),
    specialRange: specialParams?.range || "",
    specialized: pick("specialized")?.bypassesProperty || "",
    switchSpec,
    thrown,
    twoHanded: Boolean(pick("twoHanded")),
    versatile,
    vicious,
    defensive: effects.find(effect => effect.tradeoff?.kind === "defensive"),
    reckless: effects.find(effect => effect.tradeoff?.kind === "reckless"),
    dire: effects.find(effect => effect.tradeoff?.kind === "dire"),
    piercing: effects.find(effect => effect.tradeoff?.kind === "piercing"),
    brutal: effects.filter(effect => effect.type === "critMod" && Number.isFinite(effect.brutalDice))
  };
}

function armorPropertyProfile(properties) {
  let anchor = false;
  let interlocking = 0;
  let lambent = false;
  let imbalanced = false;
  let versatile = 0;
  let versatileProp = "";
  let strengthMin = 0;
  let absorptive = 0;
  let spikedProp = "";
  let chargingMax = 0;
  let obtrusive = false;
  const defenseSummaries = [];
  for (const raw of (properties || [])) {
    const spec = parsePropertySpec(raw);
    const rule = typeof propertyRule === "function" ? propertyRule(spec.name, "Armor") : null;
    if (!rule) continue;
    const key = normalizeName(rule.name);
    const param = Number.isFinite(spec.number) ? spec.number : (Number.isFinite(rule.defaultParam) ? rule.defaultParam : null);
    const paren = spec.parenthetical || rule.defaultParen || "";
    const effs = (rule.effects || []).map(effect => resolvePropertyTokens(effect, param, paren));
    if (rule.defenseSummary) defenseSummaries.push(String(raw));
    if (key === "anchor") anchor = true;
    if (key === "interlocking") interlocking = Math.max(interlocking, Number(param) || 1);
    if (key === "lambent") lambent = true;
    if (key === "imbalanced") imbalanced = true;
    if (key === "spiked" && !spikedProp) spikedProp = String(raw);
    if (key === "obtrusive") obtrusive = true;
    if (key === "versatile" && !versatileProp) versatileProp = String(raw);
    for (const e of effs) {
      if (e.type === "acBonus" && key === "versatile") {
        versatile = Math.max(versatile, Number(e.value) || Number(param) || 1);
      } else if (e.type === "weaponRule" && e.kind === "abilityReq" && e.params?.ability === "Strength") {
        const req = Number(e.params?.minScore) || Number(param) || 0;
        if (req > strengthMin) strengthMin = req;
      } else if (e.type === "damageReduction" && key === "absorptive") {
        absorptive += Number(e.amount) || Number(param) || 1;
      } else if (e.type === "resourcePool" && e.id === "armor_charging") {
        chargingMax += Number(e.max) || Number(param) || 1;
      }
    }
  }
  return {
    anchor, interlocking, lambent, imbalanced, versatile, versatileProp,
    strengthMin, absorptive, spikedProp, chargingMax, obtrusive,
    defenseSummaries
  };
}

function activeWeaponRule(item) {
  const base = itemRule(item.name, item);
  if (!base) return {};
  const modalModes = parseModalModes(base.properties);
  const index = modalModes.length ? Math.max(0, Number(item.modalIndex) || 0) % modalModes.length : -1;
  const modalModeName = modalModes[index] || "";
  const mode = modalModeName ? itemRule(modalModeName) : null;
  const active = mode ? { ...mode, name: base.name,
    properties: [...(mode.properties || []), ...(base.properties || []).filter(property => normalizeName(parsePropertySpec(property).name) === "modal")],
    effects: [...(base.effects || []), ...(mode.effects || [])]
  } : base;
  return { rule: active, modalModes, modalModeName };
}

function weaponDefenseEntry(session, item, properties) {
  const cap = properties.defensive?.tradeoff.maxPenalty;
  if (!(cap > 0) || !item.equipped || item.id == null) return null;
  return (session?.effects || []).find(entry => entry.weaponDefense?.itemId === item.id &&
    Number.isInteger(entry.weaponDefense.amount) && entry.weaponDefense.amount > 0 && entry.weaponDefense.amount <= cap) || null;
}

function weaponRecklessEntry(session, item, properties) {
  const cap = properties.reckless?.tradeoff.maxPenalty;
  if (!(cap > 0) || !item.equipped || item.id == null) return null;
  return (session?.effects || []).find(entry => entry.weaponReckless?.itemId === item.id &&
    Number.isInteger(entry.weaponReckless.amount) && entry.weaponReckless.amount > 0 && entry.weaponReckless.amount <= cap) || null;
}

function startWeaponTurn(session) {
  delete session.weaponAttackStarted;
  session.effects = (session.effects || []).filter(entry => !entry.weaponDefense && !entry.weaponReckless);
}

function recordWeaponAttack(session, item, defensive, amount = 0, phase = "ownTurn", reckless = null, recklessAmount = 0) {
  if (phase !== "ownTurn") return;
  if (!session.weaponAttackStarted && item?.equipped && item.id != null && Number.isInteger(amount) &&
      amount > 0 && amount <= (defensive?.tradeoff.maxPenalty || 0)) {
    session.effects.push({
      id: newID(), name: item.name + " Defensive",
      weaponDefense: { itemId: item.id, amount }, durationSpec: defensive.durationSpec,
      note: "+" + amount + " AC and −" + amount + " to attack and damage with this weapon until the start of your next turn"
    });
  }
  if (!session.weaponAttackStarted && item?.equipped && item.id != null && Number.isInteger(recklessAmount) &&
      recklessAmount > 0 && recklessAmount <= (reckless?.tradeoff.maxPenalty || 0)) {
    session.effects.push({
      id: newID(), name: item.name + " Reckless",
      weaponReckless: { itemId: item.id, amount: recklessAmount }, durationSpec: reckless.durationSpec,
      note: "−" + recklessAmount + " AC and +" + recklessAmount + " to attack and damage with this weapon until the start of your next turn"
    });
  }
  session.weaponAttackStarted = true;
}

function weaponLoadedShots(item, capacity, mode = "") {
  if (!Number.isInteger(capacity) || capacity < 1) return null;
  const loaded = item.weaponLoad?.[mode];
  return Number.isInteger(loaded) ? Math.max(0, Math.min(capacity, loaded)) : capacity;
}

function setWeaponLoadedShots(item, mode, value) {
  item.weaponLoad = { ...item.weaponLoad, [mode]: value };
}

function weaponAttackOptions(stats) {
  const properties = stats.weaponProperties;
  const options = properties?.restriction ? [] : [{ key: "standard", label: "Attack", ammoCost: stats.ranged ? 1 : 0 }];
  if (stats.ranged) {
    const blockedModes = stats.strShort ? (properties?.strengthBlocksFireModes || []) : [];
    for (const mode of properties?.modes || []) {
      const params = mode.params;
      if (blockedModes.includes(params.mode)) continue;
      options.push({ ...params, key: params.mode, label: mode.property, saveDC: params.saveAbility ? 8 + stats.toHit : null });
    }
  }
  const conversion = stats.melee && properties?.conversion;
  if (conversion) {
    const params = conversion.params;
    options.push({ ...params, key: "conversion", label: conversion.property, ammoCost: 0,
      saveDC: Number.isFinite(params.dcCap) ? Math.min(8 + stats.toHit, params.dcCap) : null,
      durationSpec: conversion.durationSpec });
  }
  return options;
}

function weaponConcentrationDC(outcome, damageTaken) {
  if (outcome?.trigger !== "concentrationSave" || !Number.isFinite(damageTaken) || damageTaken <= 0) return null;
  return Math.max(outcome.dcFloor, Math.floor(damageTaken * outcome.damageMultiplier));
}

function propertyRule(propString, category = "") {
  const raw = String(propString || "").trim();
  if (!raw || raw === "—") return null;
  const isArmor = category === "Armor" || category === "Shield";
  const primary = isArmor ? armorPropertyRules : weaponPropertyRules;
  const secondary = isArmor ? weaponPropertyRules : armorPropertyRules;
  const base = normalizeName(parsePropertySpec(raw).name);
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

function characterClasses(profile, session = null) {
  if (!profile) return [];
  const rawList = Array.isArray(profile.classes) && profile.classes.length
    ? profile.classes
    : (profile.className ? [{ name: profile.className, levels: Number(profile.level) || 1, archetype: profile.approach || "", isStarting: true }] : []);
  const out = [];
  const approachesMap = session?.approaches && typeof session.approaches === "object" ? session.approaches : null;
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!item || !item.name) continue;
    const rec = typeof classRecord === "function" ? classRecord(item.name) : null;
    const name = rec?.name || item.name;
    const levels = Math.max(1, Number(item.levels ?? item.level) || 1);
    const isStarting = item.isStarting !== undefined ? Boolean(item.isStarting) : (i === 0);
    let archName = "";
    if (approachesMap) {
      const matchedKey = Object.keys(approachesMap).find(k => normalizeName(k) === normalizeName(name));
      if (matchedKey && approachesMap[matchedKey]) archName = approachesMap[matchedKey];
    }
    if (!archName && isStarting && session?.approach) archName = session.approach;
    if (!archName && item.archetype) archName = typeof item.archetype === "string" ? item.archetype : (item.archetype?.name || "");
    if (!archName && isStarting && profile.approach) archName = profile.approach;
    const archRec = archName && typeof archetypeRecord === "function" ? archetypeRecord(archName, name) : null;
    out.push({
      name,
      levels,
      hitDie: item.hitDie || rec?.hitDie || 8,
      archetype: archRec?.name || archName || "",
      archetypeFlavor: item.archetypeFlavor || rec?.archetypeFlavorName || "Archetype",
      isStarting,
      record: rec,
      archetypeRecord: archRec
    });
  }
  return out;
}
function hasClass(profile, targetClass) {
  return classLevelOf(profile, targetClass) > 0;
}
function formatClassSummary(profile, session = null) {
  const entries = characterClasses(profile, session);
  if (!entries.length) return profile?.className || "";
  if (entries.length === 1) return entries[0].name;
  return entries.map(c => c.name + " " + c.levels).join(" / ");
}
function archetypeFeatureRule(archetypeName, className, featureHeading) {
  if (!archetypeName || !featureHeading) return "";
  return parsedArchetypeFeatures(archetypeName, className || "").get(normalizeName(featureHeading)) || "";
}
function hitDiceMaxByDie(profile) {
  const entries = characterClasses(profile, null);
  const map = new Map();
  for (const c of entries) {
    const die = Number(c.hitDie || c.record?.hitDie || 8) || 8;
    map.set(die, (map.get(die) || 0) + (Number(c.levels) || 0));
  }
  if (!map.size && profile?.level) {
    const die = Number(profile.hitDie) || 8;
    map.set(die, Math.max(1, Number(profile.level) || 1));
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([die, max]) => ({ die, key: "d" + die, max }));
}
function hitDiceState(profile, session = null) {
  const maxPools = hitDiceMaxByDie(profile);
  const totalMax = maxPools.reduce((s, p) => s + p.max, 0);
  const rawByDie = session?.hitDiceByDie && typeof session.hitDiceByDie === "object" ? session.hitDiceByDie : null;
  const hasRawKeys = rawByDie && maxPools.some(p => Number.isFinite(Number(rawByDie[p.key])));
  const pools = [];
  if (maxPools.length === 1) {
    const p = maxPools[0];
    const cur = hasRawKeys
      ? clamp(Math.floor(Number(rawByDie[p.key])), 0, p.max)
      : clamp(Number.isFinite(Number(session?.hitDice)) ? Math.floor(Number(session.hitDice)) : p.max, 0, p.max);
    pools.push({ die: p.die, key: p.key, current: cur, max: p.max });
  } else if (hasRawKeys) {
    for (const p of maxPools) {
      const val = Number.isFinite(Number(rawByDie[p.key])) ? Math.floor(Number(rawByDie[p.key])) : p.max;
      pools.push({ die: p.die, key: p.key, current: clamp(val, 0, p.max), max: p.max });
    }
  } else {
    let budget = Number.isFinite(Number(session?.hitDice)) ? clamp(Math.floor(Number(session.hitDice)), 0, totalMax) : totalMax;
    for (const p of maxPools) {
      const take = Math.min(p.max, budget);
      pools.push({ die: p.die, key: p.key, current: take, max: p.max });
      budget = Math.max(0, budget - take);
    }
  }
  const totalCurrent = pools.reduce((s, p) => s + p.current, 0);
  return { pools, totalCurrent, totalMax, isMultiDie: pools.length > 1 };
}
function syncHitDiceTotal(session, profile) {
  if (!session) return 0;
  const st = hitDiceState(profile, session);
  session.hitDiceByDie = {};
  for (const p of st.pools) session.hitDiceByDie[p.key] = p.current;
  session.hitDice = st.totalCurrent;
  return st.totalCurrent;
}
function spendAnyHitDie(session, profile, preferredKey = "") {
  if (!session) return null;
  const st = hitDiceState(profile, session);
  if (!session.hitDiceByDie || typeof session.hitDiceByDie !== "object") session.hitDiceByDie = {};
  for (const p of st.pools) session.hitDiceByDie[p.key] = p.current;
  let chosen = preferredKey ? st.pools.find(p => p.key === preferredKey && p.current > 0) : null;
  if (!chosen) {
    // Default for non-healing costs: spend smallest available die first to preserve larger healing dice.
    const reversed = [...st.pools].reverse();
    chosen = reversed.find(p => p.current > 0) || null;
  }
  if (!chosen) return null;
  session.hitDiceByDie[chosen.key] = Math.max(0, chosen.current - 1);
  syncHitDiceTotal(session, profile);
  return chosen.key;
}
function recoverHitDice(session, profile, count = 1) {
  if (!session || count <= 0) return 0;
  const st = hitDiceState(profile, session);
  if (!session.hitDiceByDie || typeof session.hitDiceByDie !== "object") session.hitDiceByDie = {};
  for (const p of st.pools) session.hitDiceByDie[p.key] = p.current;
  let remaining = Math.max(0, Math.floor(count));
  let gained = 0;
  // Recover largest spent die sizes first (d12 -> d10 -> d8 -> d6).
  for (const p of st.pools) {
    if (remaining <= 0) break;
    const missing = Math.max(0, p.max - p.current);
    if (!missing) continue;
    const add = Math.min(missing, remaining);
    session.hitDiceByDie[p.key] = p.current + add;
    remaining -= add;
    gained += add;
  }
  syncHitDiceTotal(session, profile);
  return gained;
}
function _readArchetypeTableRow(arch, lvl) {
  const raw = arch?.leveledTable?.[String(lvl || 1)];
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out = {};
    for (const item of raw) if (item && item.key) out[item.key] = item.value;
    return out;
  }
  return raw;
}
function classLevelStepFor(profile, className) {
  const cls = classRecord(className);
  const lvl = classLevelOf(profile, className);
  if (!cls || lvl <= 0) return {};
  return cls.levelChanges?.[String(Math.min(20, lvl))] || {};
}
function archetypeLevelStepFor(profile, session, className) {
  const entry = characterClasses(profile, session).find(c => normalizeName(c.name) === normalizeName(className));
  if (!entry || !entry.archetypeRecord) return {};
  return _readArchetypeTableRow(entry.archetypeRecord, entry.levels);
}
function classLevelStep(profile) {
  const entries = characterClasses(profile, null);
  const primary = entries[0];
  if (!primary?.record) return {};
  return primary.record.levelChanges?.[String(Math.min(20, primary.levels))] || {};
}
function archetypeLevelStep(profile, session) {
  const entries = characterClasses(profile, session);
  const primary = entries[0];
  if (!primary?.archetypeRecord) return {};
  return _readArchetypeTableRow(primary.archetypeRecord, primary.levels);
}
function archetypeMechanics(profile, session) {
  const entries = characterClasses(profile, session);
  return entries[0]?.archetypeRecord?.mechanics || null;
}
function archetypePassiveSummary(profile, session) {
  const entries = characterClasses(profile, session);
  const out = {
    speeds: {}, walkBonus: 0, resistances: [], immunities: [], senses: [],
    slowedStep: null, acBonus: 0, acSources: [], unarmoredBase: 0, unarmoredBaseSource: "",
    hpPerLevel: 0, critRangeBonus: 0, initBonus: null, initAdv: false,
    saveProfs: [], saveBonuses: {}, armorProfs: [], weaponProfs: [],
    weaponNotes: [], extraAttack: false, castingDCBonus: 0, castingAttackBonus: 0
  };
  const effects = session?.effects || [];
  const hasEff = name => effects.some(e => normalizeName(e.name) === normalizeName(name));
  for (const entry of entries) {
    const mech = entry.archetypeRecord?.mechanics || null;
    if (!mech?.passives) continue;
    const lvl = entry.levels;
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
      out.unarmoredBaseSource = p.name || entry.archetype || (session?.approach || "Archetype");
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
  if (!ownedCombatOptions._busy && typeof _cachedFor === "function") {
    return _cachedFor("ownedCO", profile, session, () => _ownedCombatOptionsUncached(profile, session));
  }
  return _ownedCombatOptionsUncached(profile, session);
}
function _ownedCombatOptionsUncached(profile, session) {
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
  if (!ownedCombatOptions._busy && typeof resolveCombatEffects === "function") {
    ownedCombatOptions._busy = true;
    try {
      for (const cg of resolveCombatEffects(profile, session).combatOptionGrants || []) {
        const opt = String(cg.option || "").trim();
        if (!opt) continue;
        if (cg.kind === "fightingStyle") addStyle(opt);
        else if (cg.kind === "fightingMastery") addMastery(opt);
        else if (cg.kind === "lightsaberForm") addForm(opt);
      }
    } finally {
      ownedCombatOptions._busy = false;
    }
  }
  return {
    styles: [...styles.values()],
    masteries: [...masteries.values()],
    forms: [...forms.values()]
  };
}

function hasDualWieldMasteryEligible(profile, session) {
  if (!session) return false;
  const sh = equippedRule(session, "shield");
  const blockingPhysicalShield = Boolean(sh && !/generator/i.test(sh.name || ""));
  if (blockingPhysicalShield) return false;
  const traits = characterTraits(profile, session);
  const weapons = (session.equipped || []).filter(item => item.equipped && itemRule(item.name, item)?.category === "Weapon");
  const twfCandidates = weapons.filter(w => {
    const st = weaponStats(profile, w, false, session);
    return st && !st.doubleProp && (st.light || (traits.twfIgnoreLight && !st.twoHanded));
  });
  const totalTwfCount = twfCandidates.reduce((n, w) => n + Math.max(1, (w.detached ? 2 : (w.quantity || 1))), 0);
  return totalTwfCount >= 2;
}

function hasDuelistMasteryEligible(profile, session) {
  if (!session) return false;
  const weapons = (session.equipped || []).filter(item => item.equipped && itemRule(item.name, item)?.category === "Weapon");
  const totalCount = weapons.reduce((n, w) => n + Math.max(1, (w.detached ? 2 : (w.quantity || 1))), 0);
  if (totalCount !== 1 || weapons.length !== 1) return false;
  const st = weaponStats(profile, weapons[0], false, session);
  return Boolean(st && st.proficient && !st.twoHanded && !st.useTwoHands);
}

function hasVersatileStyleEligible(profile, session) {
  if (!session) return false;
  return (session.equipped || []).some(item => {
    if (!item.equipped) return false;
    const wr = itemRule(item.name, item);
    if (wr?.category !== "Weapon") return false;
    const st = weaponStats(profile, item, false, session);
    return Boolean(st && st.proficient && st.melee && st.versatile);
  });
}

function hasSplashclassImprovement(profile, session, clsName) {
  const target = normalizeName(clsName);
  if (!target) return false;
  const names = new Set([
    ...(Array.isArray(profile?.splashclassImprovements) ? profile.splashclassImprovements : []),
    ...(Array.isArray(session?.splashclassImprovements) ? session.splashclassImprovements : []),
    ...((session?.feats || []).filter(f => featChoiceKind(featRule(typeof f === "string" ? f : f?.name)) === "class" && f?.choice).map(f => f.choice))
  ].map(normalizeName));
  if (!names.has(target)) return false;
  if (typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined") {
    const rec = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === target);
    if (rec && typeof checkImprovementPrerequisite === "function" && !checkImprovementPrerequisite(profile, session, rec).met) return false;
  }
  return true;
}

function pruneStaleEffects(profile, session) {
  if (!session || !Array.isArray(session.effects)) return;
  const opts = ownedCombatOptions(profile, session);
  const ownedForms = new Set(opts.forms.map(f => normalizeName(f.name)));
  const ownedStyles = new Set(opts.styles.map(s => normalizeName(s.name)));
  const ownedMasteries = new Set(opts.masteries.map(m => normalizeName(m.name)));
  const arm = equippedRule(session, "armor");
  const sh = equippedRule(session, "shield");
  const shHasImbalanced = Boolean(sh && typeof armorPropertyProfile === "function" && armorPropertyProfile(sh.properties).imbalanced);
  const spName = normalizeName(profile?.species);
  const activeGrants = typeof resolveResourceEffects === "function"
    ? (resolveResourceEffects(profile || {}, session).actionGrants || [])
    : [];

  session.effects = session.effects.filter(entry => {
    if (entry.weaponDefense) {
      const item = (session.equipped || []).find(gear => gear.id === entry.weaponDefense.itemId);
      return item && Boolean(weaponDefenseEntry({ effects: [entry] }, item, weaponPropertyProfile(activeWeaponRule(item).rule?.properties)));
    }
    if (entry.weaponReckless) {
      const item = (session.equipped || []).find(gear => gear.id === entry.weaponReckless.itemId);
      return item && Boolean(weaponRecklessEntry({ effects: [entry] }, item, weaponPropertyProfile(activeWeaponRule(item).rule?.properties)));
    }
    return true;
  });
  // Clear weapon/shield stance flags on unequipped gear
  for (const item of session.equipped || []) {
    if (!item.equipped) {
      if (item.anchored) item.anchored = false;
      if (item.interlocked) item.interlocked = false;
      if (item.lambentActive) item.lambentActive = false;
      if (equipmentGroup(itemRule(item.name, item)) === "shield" && item.twoHanded) item.twoHanded = false;
    }
  }

  // Prune dual concentration slot & triggers if maxConcurrentConcentration dropped below 2 or < 2 active concentrations
  if (session.concentration2) {
    const maxConcNow = (typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session).maxConcurrentConcentration : 1) || 1;
    if (maxConcNow < 2) {
      const dropKey = normalizeName(session.concentration2);
      session.concentration2 = "";
      session.effects = session.effects.filter(e => !(e.fromConcentration && normalizeName(e.name) === dropKey));
    }
  }
  const activeConcCount = [session.concentration, session.concentration2].filter(Boolean).length;
  if (activeConcCount < 2) {
    for (const ef of session.effects) {
      if (Array.isArray(ef.turnTriggers) && ef.turnTriggers.some(t => t && t.fromDualConcentration)) {
        ef.turnTriggers = ef.turnTriggers.filter(t => !(t && t.fromDualConcentration));
      }
    }
  }

  // Prune Splashclass Rage if feat removed, heavy armor equipped, or unconscious/dead
  if (session.rage?.source === "Splashclass") {
    const condSet = new Set(session.effects.map(e => normalizeName(e.name)));
    if (!hasSplashclassImprovement(profile, session, "Berserker") || (arm && arm.armor === "Heavy") || condSet.has("unconscious") || condSet.has("dead")) {
      session.rage = null;
    }
  }

  // Prune effects whose source option/gear is no longer owned or valid (multiple owned Lightsaber Forms may be active simultaneously)
  const kept = [];
  for (let i = session.effects.length - 1; i >= 0; i--) {
    const e = session.effects[i];
    const key = normalizeName(e.name);
    const lf = lightsaberFormRule(e.name);
    if (lf) {
      if (!ownedForms.has(normalizeName(lf.name)) || lf.durationSpec?.anchor === "instant") continue;
    } else if (
      [...(typeof SW5E_WEAPON_FOCUSES !== "undefined" ? SW5E_WEAPON_FOCUSES : []), ...(typeof SW5E_WEAPON_SUPREMACIES !== "undefined" ? SW5E_WEAPON_SUPREMACIES : [])]
        .some(rec => (rec.effects || []).some(ef => ef.type === "actionGrant" && normalizeName(ef.toggleEffect?.name) === key)) &&
      !activeGrants.some(g => normalizeName(g?.toggleEffect?.name) === key)
    ) {
      continue;
    } else if (key === "blindfighting: doubled" && !ownedStyles.has("blindfighting style")) {
      continue;
    } else if (key === "equilibrium mark" && (!ownedStyles.has("equilibrium style") || Boolean(sh) || (arm && arm.armor !== "Light"))) {
      continue;
    } else if (key === "defense mark" && (!ownedStyles.has("defense style") || !arm || (arm.armor !== "Medium" && arm.armor !== "Heavy") || !(() => {
      const tr = characterTraits(profile, session);
      if (tr.armorProficiencies.has(arm.armor)) return true;
      if (typeof resolveProficiencyEffects === "function") {
        return resolveProficiencyEffects(profile, session).armors.some(ap => {
          const t = String(ap.target || "").toLowerCase();
          return t.includes("all") || t.includes(arm.armor.toLowerCase());
        });
      }
      return false;
    })())) {
      continue;
    } else if (key === "secured: light shield" && (!ownedStyles.has("secured style") || Boolean(sh) || !hasEquippedFixedWeapon(session))) {
      continue;
    } else if (key === "dual wield ac" && (!ownedMasteries.has("dual wield mastery") || !hasDualWieldMasteryEligible(profile, session))) {
      continue;
    } else if (key === "defensive stance" && !ownedMasteries.has("sentinel mastery")) {
      continue;
    } else if (key === "duelist mastery (+prof ac)" && (!ownedMasteries.has("duelist mastery") || !hasDuelistMasteryEligible(profile, session))) {
      continue;
    } else if (key === "secured mastery (+prof ac)" && (!ownedMasteries.has("secured mastery") || !hasEquippedFixedWeapon(session))) {
      continue;
    } else if (key === "defensive ball" && (spName !== "colicoid" || Boolean(sh))) {
      continue;
    } else if (e.source?.kind === "classImprovement" && !activeGrants.some(g => g?.source?.kind === "classImprovement" && (normalizeName(g.name) === key || normalizeName(g.toggleEffect?.name) === key || normalizeName(g.source?.name) === normalizeName(e.source?.name)))) {
      continue;
    } else if (!e.source && typeof SW5E_CLASS_IMPROVEMENTS !== "undefined" && SW5E_CLASS_IMPROVEMENTS.some(ci => (ci.effects || []).some(ef => ef.type === "actionGrant" && normalizeName(ef.toggleEffect?.name) === key)) && !activeGrants.some(g => g?.source?.kind === "classImprovement" && normalizeName(g.toggleEffect?.name) === key)) {
      continue;
    } else if (key === "empty body" && (normalizeName(profile?.className) !== "monk" || (profile?.level || 1) < 18)) {
      continue;
    } else if (key === "critical analysis" && normalizeName(profile?.className) !== "scholar" && !hasSplashclassImprovement(profile, session, "Scholar")) {
      continue;
    } else if ((key === "ranger's quarry" || key === "ranger’s quarry") && normalizeName(profile?.className) !== "scout" && !hasSplashclassImprovement(profile, session, "Scout")) {
      continue;
    } else if (key === "imbalanced shield" && !shHasImbalanced) {
      continue;
    } else if (e.fromActionGrant && e.source && (e.source.kind || e.source.name)) {
      const sKind = normalizeName(e.source.kind);
      const sName = normalizeName(e.source.name);
      const sItemId = e.source.itemId || "";
      const stillGranted = activeGrants.some(g => {
        const gKind = normalizeName(g?.source?.kind);
        const gName = normalizeName(g?.source?.name);
        if (sKind && gKind !== sKind) return false;
        if (sName && gName !== sName) return false;
        if (sItemId && g?.source?.itemId && g.source.itemId !== sItemId) return false;
        return true;
      });
      if (!stillGranted) continue;
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
  const scores = effectiveScores(profile, session);
  const lvl = profile?.level || 1;
  const entries = characterClasses(profile, session);

  let baseQty = 0;
  let baseKnownCap = 0;
  let baseSupClassesLevel = 0;
  let maxScaledSupLevel = 0;
  let supSourceCount = 0;
  let singleTableSize = "";
  let anyDieStepUp = false;

  for (const entry of entries) {
    const cls = entry.record;
    const arch = entry.archetypeRecord;
    const cLvl = entry.levels;
    const cNorm = normalizeName(entry.name);
    const isFighterCls = cNorm === "fighter";
    const isScholarCls = cNorm === "scholar";
    const mcSupLvl = isFighterCls ? multiclassScaledLevel(profile, session, "Fighter", "Superiority Dice")
      : isScholarCls ? multiclassScaledLevel(profile, session, "Scholar", "Maneuvers & Superiority Dice") : cLvl;
    const cStep = cls?.levelChanges?.[String(Math.min(20, cLvl))] || {};
    const mcStep = (isFighterCls || isScholarCls) && mcSupLvl > 0
      ? (cls?.levelChanges?.[String(Math.min(20, mcSupLvl))] || cStep)
      : cStep;
    const archStep = arch ? _readArchetypeTableRow(arch, cLvl) : {};
    const archSup = arch?.mechanics?.superiority || null;

    const stepQty = parseNumericStat(mcStep["Superiority Dice Quantity"]);
    const archTableQty = parseNumericStat(archStep["Superiority Dice Quantity"]);
    let archBonusQty = 0;
    if (archSup?.bonusDice) {
      for (const [k, v] of Object.entries(archSup.bonusDice)) if (cLvl >= Number(k)) archBonusQty = v;
    }
    let archReplaceQty = 0;
    if (archSup?.replaceDice) {
      for (const [k, v] of Object.entries(archSup.replaceDice)) if (cLvl >= Number(k)) archReplaceQty = v;
    }
    const entryQty = archReplaceQty > 0 ? archReplaceQty : ((archSup?.replaceBase && archTableQty > 0) ? archTableQty : (stepQty + archTableQty + archBonusQty));

    const stepKnown = parseNumericStat((isScholarCls ? mcStep : cStep)["Maneuvers Known"]);
    const archTableKnown = parseNumericStat(archStep["Maneuvers Known"]);
    let archBonusKnown = 0;
    if (archSup?.bonusManeuvers) {
      for (const [k, v] of Object.entries(archSup.bonusManeuvers)) if (cLvl >= Number(k)) archBonusKnown = v;
    }
    let archReplaceKnown = 0;
    if (archSup?.replaceManeuvers) {
      for (const [k, v] of Object.entries(archSup.replaceManeuvers)) if (cLvl >= Number(k)) archReplaceKnown = v;
    }
    const entryKnown = archReplaceKnown > 0 ? archReplaceKnown : ((archSup?.replaceBase && archTableKnown > 0) ? archTableKnown : (stepKnown + archTableKnown + archBonusKnown));

    if (entryQty > 0 || entryKnown > 0 || archSup) {
      baseQty += entryQty;
      baseKnownCap += entryKnown;
      supSourceCount++;
      // SW5e Ch. 6: Add levels in each superiority class together for die size (without double-counting multiclassScale levels)
      baseSupClassesLevel += cLvl;
      if ((isFighterCls || isScholarCls) && mcSupLvl > maxScaledSupLevel) maxScaledSupLevel = mcSupLvl;
      const tblSize = mcStep["Superiority Dice Size"] || cStep["Superiority Dice Size"] || archStep["Superiority Dice Size"] || "";
      if (tblSize && tblSize !== "—") singleTableSize = tblSize;
      if (archSup?.dieStepUp && cLvl >= (archSup.dieStepUpLevel || 3)) anyDieStepUp = true;
    }
  }

  let styleBonus = 0;
  let masteryBonus = 0;
  let extraManeuverBase = 0;
  let extraManeuverUpgradeGrants = [];
  let grantScaledDie = "";
  let splashFighterD4Max = 0;
  if (typeof resolveCombatEffects === "function") {
    const cGrants = resolveCombatEffects(profile, session).combatOptionGrants || [];
    for (const cg of cGrants) {
      if (Number.isFinite(cg.ifAlreadyHaveDice)) {
        extraManeuverUpgradeGrants.push(cg);
      } else {
        if (Number.isFinite(cg.superiorityDice)) styleBonus += cg.superiorityDice;
        else if (cg.superiorityDice === "proficiency" && cg.die === "d4") splashFighterD4Max = Math.max(splashFighterD4Max, profile?.proficiency || 2);
        if (cg.kind === "maneuver" && Number.isFinite(cg.count)) extraManeuverBase += cg.count;
      }
      if (typeof cg.dieScaling === "string" && cg.dieScaling.includes("/")) {
        let picked = "d4";
        for (const seg of cg.dieScaling.split("/")) {
          const [dieTok, atLvl] = seg.split("@");
          if (!atLvl || lvl >= Number(atLvl)) picked = dieTok.trim();
        }
        grantScaledDie = picked;
      }
    }
    for (const cg of extraManeuverUpgradeGrants) {
      masteryBonus += (baseQty + styleBonus) > 0 ? cg.ifAlreadyHaveDice : (Number.isFinite(cg.superiorityDice) ? cg.superiorityDice : 1);
    }
  }
  const hasMastery = extraManeuverUpgradeGrants.length > 0;
  const qty = baseQty + styleBonus + masteryBonus;
  const dieSteps = ["d4", "d6", "d8", "d10", "d12"];
  const combinedSupLevel = Math.min(lvl, Math.max(baseSupClassesLevel, maxScaledSupLevel));
  const dieLevel = combinedSupLevel > 0 ? combinedSupLevel : lvl;
  const scaledSize = dieLevel >= 17 ? "d12" : dieLevel >= 13 ? "d10" : dieLevel >= 9 ? "d8" : dieLevel >= 5 ? "d6" : "d4";
  let rawSize = supSourceCount > 1 ? scaledSize : (singleTableSize || grantScaledDie || scaledSize);
  if (anyDieStepUp) {
    const idx = dieSteps.indexOf(rawSize);
    if (idx >= 0 && idx < dieSteps.length - 1) rawSize = dieSteps[idx + 1];
  }
  const size = qty > 0 ? rawSize : "";
  const used = session?.superiorityUsed || 0;
  const remaining = Math.max(0, qty - used);

  const rawModOf = ab => modifier(scores[ab]);
  const physicalMod = Math.max(rawModOf("Strength"), rawModOf("Dexterity"), rawModOf("Constitution"));
  const mentalMod = Math.max(rawModOf("Intelligence"), rawModOf("Wisdom"), rawModOf("Charisma"));
  const generalMod = Math.max(physicalMod, mentalMod);
  const prof = profile?.proficiency || 2;
  const physicalDC = 8 + prof + physicalMod;
  const mentalDC = 8 + prof + mentalMod;
  const generalDC = 8 + prof + generalMod;
  const masteryManeuvers = extraManeuverUpgradeGrants.reduce((sum, cg) => sum + ((baseKnownCap + extraManeuverBase) > 0 ? (cg.ifAlreadyHaveCount || 3) : (cg.count || 1)), 0);
  const knownCap = baseKnownCap + extraManeuverBase + masteryManeuvers;

  const perfectManeuver = typeof collectCharacterEffects === "function"
    ? collectCharacterEffects(profile, session).some(e => e.type === "rollFloor" && e.scope === "superiorityDie")
    : false;
  const minRollThreshold = perfectManeuver && size ? sw5eMinRollThreshold(size) : 0;
  const splashFighterDC = 8 + prof + Math.max(rawModOf("Strength"), rawModOf("Dexterity"));
  return {
    qty, size, used, remaining, knownCap,
    freeD4Max: hasMastery ? prof : 0,
    splashFighterD4Max,
    minRollThreshold,
    splashFighterDC,
    physicalMod, mentalMod, generalMod,
    physicalDC, mentalDC, generalDC,
    dcFor: type => (qty === 0 && splashFighterD4Max > 0) ? splashFighterDC : (type === "Physical" ? physicalDC : type === "Mental" ? mentalDC : generalDC)
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
  // Feat speeds, slowedStep, resistances, immunities, and senses are driven by unified effects[].
  // Style/mastery blindsight extensions are resolved via unified sense(extend:true) effects in defenseProfile().
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
  const scoutSenseBlocked = (session?.effects || []).some(e => ["blinded", "deafened", "unconscious", "dead"].includes(normalizeName(e.name)));
  if (clsName === "scout" && lvl >= 18 && !scoutSenseBlocked && !senses.includes("Sense Invisible 30 ft")) senses.push("Sense Invisible 30 ft");

  // Berserker Instincts & Scout Routines (fly/climb/swim/crawl speed, blindsight, slowedStep) are driven via unified effects[].
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
  if (eff.allSaveAdv) parts.push("Advantage on all saves");
  if (eff.wisSaveAdv) parts.push("Advantage on Wisdom saves");
  if (eff.incomingAdvantage) parts.push("Incoming advantage");
  if (eff.incomingDisadvantage) parts.push("Incoming disadvantage");
  if (eff.ignoreExhaustion) parts.push("Ignore exhaustion");
  if (eff.initiativeForceMod) parts.push("Force mod Initiative");
  if (eff.initiativeAdv) parts.push("Advantage on Initiative");
  if (eff.initiativeDice) parts.push(eff.initiativeDice + " Initiative");
  if (eff.senses?.length) parts.push(eff.senses.join(", "));
  return parts.join(" · ");
}
function activeEffectModifiers(profile, session) {
  if (typeof _cachedFor === "function") return _cachedFor("activeEffectModifiers", profile, session, () => _activeEffectModifiersUncached(profile, session));
  return _activeEffectModifiersUncached(profile, session);
}
function _activeEffectModifiersUncached(profile, session) {
  const innateList = typeof resolveInnateActiveEffects === "function" ? resolveInnateActiveEffects(profile, session) : [];
  const combinedRaw = [...(session?.effects || [])];
  for (const ie of innateList) {
    if (!combinedRaw.some(e => normalizeName(e.name) === normalizeName(ie.name))) {
      combinedRaw.push(ie);
    }
  }
  const entries = combinedRaw.map(e => ({name: normalizeName(e.name), raw: e}));
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
  const defTraitsNow = typeof resolveDefenseEffects === "function" ? (resolveDefenseEffects(profile, session).combatTraits || []) : [];
  const coverStepUp = defTraitsNow.some(ct => ct.kind === "coverStepUp");
  if (has("Three-quarters cover")) applyCover(5, "Three-quarters cover (+5)");
  else if (has("Half cover")) applyCover(coverStepUp ? 5 : 3, coverStepUp ? "Half cover → Three-quarters (+5 · Cover Strategist)" : "Half cover (+3)");
  else if (has("One-quarter cover")) applyCover(coverStepUp ? 3 : 2, coverStepUp ? "One-quarter → Half (+3 · Cover Strategist)" : "One-quarter cover (+2)");
  if (has("Empty Body")) {
    if (!resistances.includes("all (except force)")) resistances.push("all (except force)");
  }
  let auraHatredBonus = 0;
  let sharpshooterBonus = 0;
  const auraPresEntry = entries.find(e => e.name === "aura of presence")?.raw;
  if (auraPresEntry) {
    const wMod = Math.max(0, Number(auraPresEntry.value) || 0);
    if (wMod > 0) {
      allSaveBonus += wMod;
      rollModifiers.push("Aura of Presence (" + signed(wMod) + " saves)");
    }
  }
  const auraHatredEntry = entries.find(e => e.name === "aura of hatred")?.raw;
  if (auraHatredEntry) {
    const cMod = Math.max(1, auraHatredEntry.value || 1);
    auraHatredBonus = cMod;
    tacticalNotes.push("Aura of Hatred: +" + cMod + " to first melee weapon damage roll each round");
  }
  const auraVigorEntry = entries.find(e => e.name === "aura of vigor (guardian)")?.raw;
  if (auraVigorEntry) {
    tacticalNotes.push("Aura of Vigor (Guardian): gain +" + Math.max(1, auraVigorEntry.value || 1) + " temporary HP at start of turn");
  }
  if (has("Aura of Warding")) {
    tacticalNotes.push("Aura of Warding: resistance to damage from force powers");
  }
  // Scout Routines (Warden's, Maven's, Sharpshooter's, etc.) are driven via unified effects[] + when.activeEffectTarget.
  const paEntry = entries.find(e => e.name === "potent aptitude")?.raw;
  if (paEntry) {
    rollModifiers.push("Potent Aptitude (+" + (paEntry.value || 1) + " die)");
  }
  const caAllyEntry = entries.find(e => e.name === "critical analysis (ally)")?.raw;
  if (caAllyEntry) {
    rollModifiers.push("Critical Analysis (end no action: +" + Math.max(1, caAllyEntry.value || 1) + " to 1 attack/check/save)");
  }
  let oaDisadvantage = false;
  // Opportunity attack disadvantage (e.g. Loth-cat's Instinct) is driven via combatTrait oaDisadvantage.
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
  if (has("Wrestle and Drag")) {
    tacticalNotes.push("Wrestle and Drag: drag grappled creature at full speed until end of turn");
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
  let enhancementInjectionBonus = 0;
  if (has("Enhancement Injection") && (session?.temp || 0) > 0) {
    const v = valueOf("Enhancement Injection") || 1;
    strConSaveBonus += v;
    enhancementInjectionBonus = v;
    rollModifiers.push("Enhancement Injection (" + signed(v) + " Strength/Constitution checks & saves)");
  }
  if (has("Equilibrium Mark")) {
    const eqBonus = Math.max(1, Math.floor(modifier(scores.Dexterity) / 2));
    acBonus += eqBonus;
    dexSaveBonus += eqBonus;
    acSources.push("Equilibrium Mark (" + signed(eqBonus) + " vs marked)");
    rollModifiers.push("Equilibrium Mark (" + signed(eqBonus) + " Dexterity saves vs marked)");
  }
  if (has("Defense Mark")) {
    const defRed = Math.max(1, Math.floor(Math.max(modifier(scores.Strength), modifier(scores.Constitution)) / 2));
    tacticalNotes.push("Defense Mark: reduce damage from marked target by " + defRed + " (min 1 reduction, floor 1 damage)");
  }
  if (has("Secured: Light Shield") && !equippedRule(session, "shield")) {
    acBonus += 1;
    acSources.push("Secured: Light Shield (+1)");
  }
  if (has("Dual Wield AC")) {
    const v = valueOf("Dual Wield AC") || 1;
    acBonus += v;
    acSources.push("Dual Wield Mastery (" + signed(v) + ")");
  }
  if (has("Defensive Ball") && !equippedRule(session, "shield")) {
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
  if (enhancementInjectionBonus) addSkillBonus("Athletics", enhancementInjectionBonus);
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
    rollModifiers.push("One with the Force (" + signed(v) + " Constitution concentration save)");
  }
  if (has("Targeted Strike")) {
    const v = valueOf("Targeted Strike") || 1;
    attackDamageBonus += v;
    rollModifiers.push("Targeted Strike (" + signed(v) + " attack & damage)");
  }
  for (const [mName, mSkill] of [
    ["Assist", "Medicine"], ["Conceal", "Stealth"], ["Deceive", "Deception"], ["Empathize", "Insight"],
    ["Flex", "Athletics"], ["Flourish", "Sleight of Hand"], ["Handle Animal", "Animal Handling"],
    ["Investigate", "Investigation"], ["Naturalize", "Nature"], ["Perceive", "Perception"],
    ["Perform", "Performance"], ["Persuade", "Persuasion"], ["Pilot", "Piloting"],
    ["Program", "Technology"], ["Study", "Lore"], ["Survive", "Survival"],
    ["Threaten", "Intimidation"], ["Tumble", "Acrobatics"]
  ]) {
    if (has(mName)) { const v = valueOf(mName) || 1; addSkillBonus(mSkill, v); rollModifiers.push(mName + " (+" + v + " " + mSkill + ")"); }
  }
  if (has("Assess the Situation")) { const v = valueOf("Assess the Situation") || 1; addSkillBonus("Perception", v); addSkillBonus("Investigation", v); rollModifiers.push("Assess the Situation (+" + v + " Perception/Investigation)"); }
  if (has("Wild Senses")) { const v = valueOf("Wild Senses") || 1; addSkillBonus("Perception", v); addSkillBonus("Survival", v); rollModifiers.push("Wild Senses (+" + v + " Perception/Survival)"); }
  if (bodyOverBother) rollModifiers.push("Body Over Bother (Strength/Dexterity/Constitution saves use best physical modifier)");
  if (mindOverMatter) rollModifiers.push("Mind Over Matter (Intelligence/Wisdom/Charisma saves use best mental modifier)");

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

      const ae = Array.isArray(p.activeEffects) ? p.activeEffects : [];
      if (eff.acBonus && !ae.some(x => x.type === "acBonus" && !x.condition && Number.isFinite(x.value))) {
        acBonus += eff.acBonus;
        acSources.push(p.name + " (" + signed(eff.acBonus) + ")");
      }
      if (eff.unarmoredACBonus && !ae.some(x => x.type === "acBonus" && Number.isFinite(x.value))) {
        unarmoredACBonus += eff.unarmoredACBonus;
        unarmoredACBonusSource = p.name + " (+" + eff.unarmoredACBonus + " melee / +" + (eff.unarmoredACBonus + 1) + " ranged)";
      }
      if (eff.acBase && eff.acBase > unarmoredBase) {
        unarmoredBase = eff.acBase;
        unarmoredBaseSource = p.name + " (" + eff.acBase + " + DEX)";
      }
      if (eff.speedBonus && !ae.some(x => x.type === "speed" && (!x.mode || x.mode === "walk") && Number.isFinite(x.bonus))) {
        speedBonus += eff.speedBonus;
        speedSources.push(p.name + " (+" + eff.speedBonus + " ft)");
      }
      if (eff.speedMultiplier && !ae.some(x => x.type === "speed" && (!x.mode || x.mode === "walk") && Number.isFinite(x.multiplier))) {
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
      if (eff.allSaveBonus && !ae.some(x => x.type === "saveMod" && x.abilities === "all" && Number.isFinite(x.value))) allSaveBonus += eff.allSaveBonus;
      if (eff.maxHPBase) {
        if (!ae.some(x => x.type === "hpMod" && Number.isFinite(x.flat))) maxHPBonus += eff.maxHPBase + Math.max(0, castLvl - (eff.baseLevel || 1)) * (eff.maxHPPerUpcast || 0);
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
      if (eff.stealthBonus && !ae.some(x => x.type === "conditionalCheckMod" && Array.isArray(x.skills) && x.skills.includes("Stealth") && Number.isFinite(x.value))) {
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
      if (eff.initiativeForceMod && !ae.some(x => x.type === "initiativeMod" && x.abilityOverride)) initiativeForceMod = true;
      if (eff.initiativeAdv) initiativeAdv = true;
      if (eff.initiativeDice && !ae.some(x => x.type === "initiativeMod" && x.die)) initiativeDice.push(eff.initiativeDice + " (" + p.name + ")");

      // Weapon attack & damage bonuses (including upcast steps for Force Weapon & Enhance Weapon)
      if (eff.upcastWeaponBonus) {
        let stepBonus = 1;
        for (const [lvlReq, val] of eff.upcastWeaponBonus.steps || []) {
          if (castLvl >= lvlReq) stepBonus = val;
        }
        if (!ae.some(x => x.type === "attackDamageMod" && Number.isFinite(x.attackBonus))) weaponAttackBonus += stepBonus;
        if (eff.weaponDamageBonus && !ae.some(x => x.type === "attackDamageMod" && Number.isFinite(x.damageBonus))) weaponDamageBonus += stepBonus;
        if (normalizeName(p.name) === "enhance weapon") {
          weaponDamageDice.push("+" + stepBonus + "d4" + (choice ? " " + choice.toLowerCase() : "") + " (" + p.name + ")");
        }
      } else {
        if (eff.weaponAttackBonus && !ae.some(x => x.type === "attackDamageMod" && Number.isFinite(x.attackBonus))) weaponAttackBonus += eff.weaponAttackBonus;
        if (eff.weaponDamageBonus && !ae.some(x => x.type === "attackDamageMod" && Number.isFinite(x.damageBonus))) weaponDamageBonus += eff.weaponDamageBonus;
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
          if (!ae.some(x => x.type === "sizeMod" && Number.isFinite(x.carryMultiplier))) carryingMultiplier = Math.max(carryingMultiplier, 2);
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
  for (const activeForm of activeLightsaberForms(session)) {
    const fm = activeForm.mechanics;
    if (!fm) continue;
    if (fm.summary) {
      tacticalNotes.push(activeForm.name + ": " + interpolateRuleTokens(fm.summary, profile, session));
    }
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
    critRangeBonus, nimanForceMelee,
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
  // Unified proficiency(kind:"save") effects (including upgradeToExpertise) are merged into traits.savingThrowRanks.
  const adaptBonus = (saveRank === 0 && (session?.effects || []).some(e => normalizeName(e.name) === "adaptability routine" && (e.targetScope || "self") === "self" && e.choice === ability)) ? Math.floor(profile.proficiency / 2) : 0;
  let baseMod = effectiveModifier(profile, session, ability, cond);
  let substitutedFrom = "";

  const _genManList = typeof generalManeuverOverrides === "function" ? generalManeuverOverrides(profile, session) : [];
  if (mods.bodyOverBother && ["Strength", "Dexterity", "Constitution"].includes(ability)) {
    const isBobGeneral = _genManList.some(v => normalizeName(v) === "body over bother");
    const bobPool = isBobGeneral ? abilities : ["Strength", "Dexterity", "Constitution"];
    const best = bobPool.reduce((acc, ab) => {
      const m = effectiveModifier(profile, session, ab, cond);
      return m > acc.mod ? {ab, mod: m} : acc;
    }, {ab: ability, mod: baseMod});
    if (best.mod > baseMod) {
      baseMod = best.mod;
      substitutedFrom = best.ab + " (Body Over Bother)";
    }
  }
  if (mods.mindOverMatter && ["Intelligence", "Wisdom", "Charisma"].includes(ability)) {
    const isMomGeneral = _genManList.some(v => normalizeName(v) === "mind over matter");
    const momPool = isMomGeneral ? abilities : ["Intelligence", "Wisdom", "Charisma"];
    const best = momPool.reduce((acc, ab) => {
      const m = effectiveModifier(profile, session, ab, cond);
      return m > acc.mod ? {ab, mod: m} : acc;
    }, {ab: ability, mod: baseMod});
    if (best.mod > baseMod) {
      baseMod = best.mod;
      substitutedFrom = best.ab + " (Mind Over Matter)";
    }
  }

  const saveEff = typeof resolveSaveEffects === "function" ? resolveSaveEffects(profile, session, ability) : null;
  // Structured halfPositiveMod (e.g. Rigid armor) & Muscled Menace (max +3 Dexterity bonus to Dexterity saves)
  let rigidNote = "";
  if (ability === "Dexterity" && baseMod > 0 && !substitutedFrom) {
    const hasDexCap3 = typeof resolveDefenseEffects === "function" &&
      resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "dexCap3");
    if (hasDexCap3 && baseMod > 3) {
      baseMod = 3;
      rigidNote = "Muscled Menace (max +3 Dexterity)";
    }
    if (saveEff?.halfPositiveMod) {
      baseMod = Math.floor(baseMod / 2);
      rigidNote = rigidNote ? (rigidNote + "; Rigid armor (½ Dexterity)") : "Rigid armor (½ Dexterity)";
    }
  }
  const anchorDexSaveBonus = (ability === "Dexterity" && session && typeof armorStats === "function")
    ? (armorStats(profile, session).anchorCoverAC || 0) : 0;
  const effectBonus =
    (ability === "Dexterity" ? ((mods.dexSaveBonus || 0) + anchorDexSaveBonus) : 0) +
    ((ability === "Strength" || ability === "Constitution") ? (mods.strConSaveBonus || 0) : 0) +
    (ability === "Constitution" ? (mods.conSaveBonus || 0) : 0) +
    (mods.allSaveBonus || 0) +
    (saveEff?.bonus || 0);
  const manualMod = Number(session?.statModifiers?.["save:" + ability]) || 0;
  return {
    total: baseMod + saveRank * profile.proficiency + adaptBonus + effectBonus + manualMod,
    baseMod,
    saveRank,
    effectBonus,
    manualMod,
    substitutedFrom: substitutedFrom || rigidNote
  };
}

function characterTraits(profile, session) {
  if (typeof _cachedFor === "function") return _cachedFor("characterTraits", profile, session, () => _characterTraitsUncached(profile, session));
  return _characterTraitsUncached(profile, session);
}
function _characterTraitsUncached(profile, session) {
  const clsEntries = characterClasses(profile, session);
  const startingEntry = clsEntries[0] || null;
  const cls = startingEntry?.record || classRecord(profile?.className);
  const sp = speciesRecord(profile?.species);
  const speciesTraits = new Set((profile?.speciesTraits || sp?.traits?.map(t => t.name) || []).map(normalizeName));
  const isBerserker = hasClass(profile, "Berserker");
  const isMonk = hasClass(profile, "Monk");
  const isSentinel = hasClass(profile, "Sentinel");
  const isConsular = hasClass(profile, "Consular");
  const isFighter = hasClass(profile, "Fighter");
  const isGuardian = hasClass(profile, "Guardian");
  const isOperative = hasClass(profile, "Operative");
  const isScholar = hasClass(profile, "Scholar");
  const isScout = hasClass(profile, "Scout");
  const isEngineer = hasClass(profile, "Engineer");

  const armorProficiencies = new Set();
  const _addArmorToken = entry => {
    const low = String(entry || "").toLowerCase();
    if (low.includes("all armor")) {
      armorProficiencies.add("Light");
      armorProficiencies.add("Medium");
      armorProficiencies.add("Heavy");
      armorProficiencies.add("Shield");
    } else {
      if (low.includes("light armor") || low === "light") { armorProficiencies.add("Light"); armorProficiencies.add("Shield"); }
      if (low.includes("medium armor") || low === "medium") { armorProficiencies.add("Medium"); armorProficiencies.add("Shield"); }
      if (low.includes("heavy armor") || low === "heavy") { armorProficiencies.add("Heavy"); armorProficiencies.add("Shield"); }
      if (low.includes("shield")) armorProficiencies.add("Shield");
    }
  };
  for (const cEntry of clsEntries) {
    const list = cEntry.isStarting ? (cEntry.record?.armorProficiencies || []) : (cEntry.record?.multiclassProficiencies || []);
    for (const tok of list) _addArmorToken(tok);
  }
  // Armor Expert progressive mastery is applied after all base armor proficiencies (class, species, options, archetype) are collected.

  const weaponProficiencies = new Set();
  const weaponChecks = [];
  const _addWeaponList = rawList => {
    const rawWepText = (rawList || []).join(", ").toLowerCase();
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
      weaponChecks.push(r => r.classification === "MartialVibroweapon" && Boolean(weaponPropertyProfile(r.properties).finesse));
    }
    if (rawWepText.includes("martial lightweapons with the finesse property")) {
      weaponChecks.push(r => r.classification === "MartialLightweapon" && Boolean(weaponPropertyProfile(r.properties).finesse));
    }
    if (rawWepText.includes("martial vibroweapons that lack the dexterity")) {
      weaponChecks.push(r => {
        const wp = weaponPropertyProfile(r.properties);
        return r.classification === "MartialVibroweapon" && !wp.dexterityMin && !wp.heavy && !wp.special && !wp.twoHanded;
      });
    }
    if (rawWepText.includes("martial blasters that lack the auto")) {
      weaponChecks.push(r => { const wp = weaponPropertyProfile(r.properties); return r.classification === "MartialBlaster" && !wp.restriction && !wp.special && !wp.strengthMin && !wp.twoHanded; });
    }
    if (rawWepText.includes("techblade")) {
      weaponProficiencies.add("techblade");
      weaponChecks.push(r => normalizeName(r.name).includes("techblade"));
    }
  };
  for (const cEntry of clsEntries) {
    const list = cEntry.isStarting ? (cEntry.record?.weaponProficiencies || []) : (cEntry.record?.multiclassProficiencies || []);
    _addWeaponList(list);
  }
  for (const w of sp?.weaponProficiencies || []) weaponProficiencies.add(normalizeName(w));
  for (const a of sp?.armorProficiencies || []) armorProficiencies.add(a);
  for (const cp of profile?.customProficiencies || []) {
    const low = normalizeName(cp);
    if (low) {
      weaponProficiencies.add(low);
      weaponChecks.push(r => _matchesWeaponProfToken(cp, r));
    }
  }

  const step = classLevelStep(profile);
  const monkStep = isMonk ? classLevelStepFor(profile, "Monk") : {};
  const scores = effectiveScores(profile, session);
  const monkUnarmoredAbility = isMonk ? monkFocusAbility(profile, session, true) : "Wisdom";
  // SW5e Ch. 6: If you already have Unarmored Defense from an earlier class, you cannot gain it again from another class.
  let unarmoredDefense = "";
  let unarmoredDefenseClass = "";
  for (const cEntry of clsEntries) {
    const cn = normalizeName(cEntry.name);
    if (cn === "berserker") { unarmoredDefense = "Constitution"; unarmoredDefenseClass = "berserker"; break; }
    if (cn === "monk") { unarmoredDefense = monkUnarmoredAbility; unarmoredDefenseClass = "monk"; break; }
  }
  const unarmoredMovement = isMonk ? parseNumericStat(monkStep["Unarmored Movement"]) : 0;
  const _mcStepFor = (cName, feat) => {
    const ml = multiclassScaledLevel(profile, session, cName, feat);
    return ml > 0 ? (classRecord(cName)?.levelChanges?.[String(Math.min(20, ml))] || {}) : {};
  };
  const maStep = isMonk ? _mcStepFor("Monk", "Martial Arts") : {};
  const saStep = isOperative ? _mcStepFor("Operative", "Sneak Attack") : {};
  const rqStep = isScout ? _mcStepFor("Scout", "Ranger's Quarry") : {};
  const martialArtsDie = isMonk ? parseNumericStat(String(maStep["Martial Arts"] || "").replace(/^1d/i, "")) : 0;
  const sneakAttack = saStep["Sneak Attack"] || "";
  const rangersQuarry = rqStep["Ranger's Quarry"] || "";

  // SW5e Ch. 6: Only the starting class grants saving throw proficiencies.
  const savingThrowRanks = new Map();
  for (const ab of cls?.savingThrows || []) savingThrowRanks.set(ab, 1);
  if (isMonk && classLevelOf(profile, "Monk") >= 14) {
    for (const ab of abilities) savingThrowRanks.set(ab, Math.max(1, savingThrowRanks.get(ab) || 0));
  }
  let featSpeedBonus = 0;
  const featSpeedSources = [];
  let armorExpertLightSpeed = false;
  let armorExpertMedMastery = false;
  let armorExpertHeavyCritImmune = false;
  let carryingMultiplier = 1;
  let passiveBonus = 0;
  let castingDCBonus = 0;
  let castingAttackBonus = 0;
  let corrodedIgnore = 0;
  let initiativeProf = false;

  // Armor Expert progressive tiers computed below after class options & archetype armor proficiencies.
  const opts = ownedCombatOptions(profile, session);
  if (isOperative && classLevelOf(profile, "Operative") >= 15) {
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
    if (m.unarmedDieStep) classOptUnarmedStep += m.unarmedDieStep;
    if (m.unarmedFinesse) classOptUnarmedFinesse = true;
    if (m.unarmedCritBonus) classOptUnarmedCrit += m.unarmedCritBonus;
    if (m.monkArmorAllowed) monkArmorAllowed = true;
    if (m.monkUsesForceMod) monkUsesForceMod = true;
    if (m.focusMaxHalfForceMod) focusMaxHalfForceMod = true;
    if (m.unlocksLightsaberForms) classOptUnlocksForms = true;
  }
  const pEffTraits = typeof resolveProficiencyEffects === "function" ? resolveProficiencyEffects(profile, session) : null;
  if (pEffTraits) {
    for (const ap of pEffTraits.armors || []) {
      const low = String(ap.target || "").toLowerCase();
      if (low.includes("all")) { armorProficiencies.add("Light"); armorProficiencies.add("Medium"); armorProficiencies.add("Heavy"); armorProficiencies.add("Shield"); }
      if (low.includes("light")) armorProficiencies.add("Light");
      if (low.includes("medium")) armorProficiencies.add("Medium");
      if (low.includes("heavy")) armorProficiencies.add("Heavy");
      if (low.includes("shield")) armorProficiencies.add("Shield");
    }
    for (const wp of pEffTraits.weapons || []) {
      const t = String(wp.target || "").trim();
      if (!t) continue;
      weaponProficiencies.add(t);
      weaponProficiencies.add(normalizeName(t));
    }
  }
  const cEffTraits = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
  const dEffTraits = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
  if (dEffTraits?.combatTraits?.some(ct => ct.kind === "monkArmorAllowed")) monkArmorAllowed = true;
  if (cEffTraits?.weaponRules?.some(wr => wr.kind === "monkUsesForceMod")) monkUsesForceMod = true;
  if (cEffTraits?.weaponRules?.some(wr => wr.kind === "unarmedFinesse")) classOptUnarmedFinesse = true;
  const effUnarmedCritMods = (cEffTraits?.critMods || []).filter(cm => cm.scope === "unarmed" && Number.isFinite(cm.rangeBonus));
  for (const cm of effUnarmedCritMods) classOptUnarmedCrit += cm.rangeBonus;
  const superiorityBonus = (cEffTraits?.combatOptionGrants || []).reduce((s, cg) => s + (Number.isFinite(cg.superiorityDice) ? cg.superiorityDice : 0), 0);
  const unarmedDieStep = (cEffTraits?.weaponRules || []).filter(wr => wr.kind === "unarmedDieStepUp").reduce((s, wr) => s + Number(wr.params?.steps || 1), 0) + classOptUnarmedStep;
  const twfAddAbilityMod = Boolean(cEffTraits?.attackDamageMods?.some(am => am.scope === "twf" && am.addAbilityMod));
  const dwfAddAbilityModToHit = Boolean(cEffTraits?.attackDamageMods?.some(am => am.scope === "dwf" && am.addAbilityModToHit));
  const twfIgnoreLight = Boolean(cEffTraits?.weaponRules?.some(wr => wr.kind === "twfIgnoreLight" || wr.params?.twfIgnoreLight));
  const dwfIgnoreLight = Boolean(cEffTraits?.weaponRules?.some(wr => wr.kind === "dwfIgnoreLight" || wr.params?.dwfIgnoreLight));
  const ignoreObtrusiveShield = Boolean(dEffTraits?.combatTraits?.some(ct => ct.kind === "ignoreObtrusiveShield"));
  const reduceStrengthReqStep = (cEffTraits?.weaponRules || []).filter(wr => wr.kind === "reduceStrengthReqStep").reduce((s, wr) => s + Number(wr.params?.steps || 1), 0);
  const shieldBonusToDexSaves = Boolean(typeof collectCharacterEffects === "function" && collectCharacterEffects(profile, session).some(e => e.type === "saveMod" && e.shieldAcBonus));
  const effMedHeavyDR = (dEffTraits?.damageReductions || []).some(dr => String(dr.amount || "").toUpperCase() === "PB" && Array.isArray(dr.armorTiers) && dr.armorTiers.includes("Medium") && dr.armorTiers.includes("Heavy"));
  const medHeavyArmorDmgReduction = effMedHeavyDR ? (profile?.proficiency || 2) : 0;
  const noCloseRangedDisadv = Boolean(dEffTraits?.combatTraits?.some(ct => ct.kind === "noCloseRangedDisadv"));
  const noLongRangeDisadv = Boolean(dEffTraits?.combatTraits?.some(ct => ct.kind === "noLongRangeDisadv"));
  const noThrownLongRangeDisadv = Boolean(dEffTraits?.combatTraits?.some(ct => ct.kind === "noThrownLongRangeDisadv"));
  const minDamageThresholds = new Set();
  for (const am of cEffTraits?.attackDamageMods || []) {
    if (!am.minDamageThreshold) continue;
    if (am.scope === "twoHandedMelee") minDamageThresholds.add("twoHandedMelee");
    if (am.scope === "closeBlaster" || am.scope === "blaster30ft") minDamageThresholds.add("blaster30ft");
  }
  const powerAttacks = new Set();
  for (const am of cEffTraits?.attackDamageMods || []) {
    if (!am.tradeoff) continue;
    if (am.scope === "twoHandedMelee") powerAttacks.add("twoHandedMelee");
    if (am.scope === "rangedBlasterOver30" || am.scope === "blasterOver30ft") powerAttacks.add("blasterOver30ft");
    if (am.scope === "doubleWeapon") powerAttacks.add("doubleWeapon");
    if (am.scope === "versatileWeapon") powerAttacks.add("versatileWeapon");
    if (am.scope === "dualMelee") powerAttacks.add("dualMelee");
  }
  const coverReductions = new Set();
  for (const ct of dEffTraits?.combatTraits || []) {
    if (ct.kind !== "coverReduction" || ct.weaponGroup) continue;
    if (ct.range === ">30 ft" || ct.range === "<=30 ft") coverReductions.add(ct.range);
  }
  const catMap = {
    "simple vibroweapons": "SimpleVibroweapon", "martial vibroweapons": "MartialVibroweapon",
    "simple blasters": "SimpleBlaster", "martial blasters": "MartialBlaster",
    "simple lightweapons": "SimpleLightweapon", "martial lightweapons": "MartialLightweapon"
  };
  for (const feat of session?.feats || []) {
    const picks = [
      ...(Array.isArray(feat.multiChoice) ? feat.multiChoice : []),
      ...(feat.choice ? [feat.choice] : [])
    ];
    for (const pk of picks) {
      if (!pk) continue;
      const lowChoice = normalizeName(pk);
      if (catMap[lowChoice]) weaponProficiencies.add(catMap[lowChoice]);
      else if (itemRule(pk)?.category === "Weapon") weaponProficiencies.add(lowChoice);
    }
  }
  const archP = archetypePassiveSummary(profile, session);
  for (const ap of archP.armorProfs) armorProficiencies.add(ap);
  const armorExpertTraits = (dEffTraits?.combatTraits || []).filter(ct => ct.kind === "armorExpertProgressive");
  const armorExpertSource = armorExpertTraits[0]?.source || "Heavy Armor Mastery";
  for (let aeIdx = 0; aeIdx < armorExpertTraits.length; aeIdx++) {
    const hadLight = armorProficiencies.has("Light");
    const hadMed = armorProficiencies.has("Medium");
    const hadHeavy = armorProficiencies.has("Heavy");
    if (!hadLight) armorProficiencies.add("Light");
    else armorExpertLightSpeed = true;
    if (hadLight) {
      if (!hadMed) armorProficiencies.add("Medium");
      else armorExpertMedMastery = true;
    }
    if (hadMed) {
      if (!hadHeavy) armorProficiencies.add("Heavy");
      else armorExpertHeavyCritImmune = true;
    }
  }
  for (const wp of archP.weaponProfs) weaponProficiencies.add(wp);
  let weaponExpertBlasterAdv = false;
  let weaponExpertLightAdv = false;
  let weaponExpertVibroAdv = false;
  const weaponExpertRules = (cEffTraits?.weaponRules || []).filter(wr => wr.kind === "weaponExpertCategory").slice(0, 2);
  for (const weRule of weaponExpertRules) {
    const cats = Array.isArray(weRule.categories) ? weRule.categories : ["Blaster", "Lightweapon", "Vibroweapon"];
    if (cats.includes("Blaster")) {
      const hadBlasters = weaponProficiencies.has("SimpleBlaster") && weaponProficiencies.has("MartialBlaster");
      if (hadBlasters) weaponExpertBlasterAdv = true;
      else { weaponProficiencies.add("SimpleBlaster"); weaponProficiencies.add("MartialBlaster"); }
    }
    if (cats.includes("Lightweapon")) {
      const hadLights = weaponProficiencies.has("SimpleLightweapon") && weaponProficiencies.has("MartialLightweapon");
      if (hadLights) weaponExpertLightAdv = true;
      else { weaponProficiencies.add("SimpleLightweapon"); weaponProficiencies.add("MartialLightweapon"); }
    }
    if (cats.includes("Vibroweapon")) {
      const hadVibros = weaponProficiencies.has("SimpleVibroweapon") && weaponProficiencies.has("MartialVibroweapon");
      if (hadVibros) weaponExpertVibroAdv = true;
      else { weaponProficiencies.add("SimpleVibroweapon"); weaponProficiencies.add("MartialVibroweapon"); }
    }
  }
  for (const sp of archP.saveProfs) savingThrowRanks.set(sp, Math.max(savingThrowRanks.get(sp) || 0, 1));
  for (const picks of Object.values(session?.speciesTraitChoices || {})) {
    for (const p of (Array.isArray(picks) ? picks : [])) {
      const it = typeof itemRule === "function" ? itemRule(p) : null;
      if (it?.category === "Weapon") weaponProficiencies.add(normalizeName(p));
    }
  }
  if (typeof resolveProficiencyEffects === "function") {
    const profEffAll = resolveProficiencyEffects(profile, session);
    for (const wp of profEffAll.weapons) {
      if (wp.target) weaponProficiencies.add(normalizeName(wp.target));
    }
    for (const sp of profEffAll.saves) {
      const targets = sp.target === "all" ? abilities : abilities.filter(ab => normalizeName(ab) === normalizeName(sp.target));
      for (const ab of targets) {
        const cur = savingThrowRanks.get(ab) || 0;
        if (sp.upgradeToExpertise && cur >= 1) savingThrowRanks.set(ab, 2);
        else savingThrowRanks.set(ab, Math.max(cur, Number.isFinite(sp.rank) ? sp.rank : 1));
      }
    }
  }
  if (dEffTraits?.combatTraits) {
    for (const ct of dEffTraits.combatTraits) {
      if (ct.kind === "corrodedIgnore") corrodedIgnore += Number(ct.value) || 1;
    }
  }
  if (typeof resolveSkillEffects === "function") {
    const pPerc = resolveSkillEffects(profile, session, "Perception", "Wisdom").passiveBonus || 0;
    const pInv = resolveSkillEffects(profile, session, "Investigation", "Intelligence").passiveBonus || 0;
    passiveBonus = Math.max(pPerc, pInv);
  }
  if (archP.castingDCBonus) castingDCBonus += archP.castingDCBonus;
  if (archP.castingAttackBonus) castingAttackBonus += archP.castingAttackBonus;
  const savingThrows = new Set([...savingThrowRanks.entries()].filter(([, r]) => r > 0).map(([ab]) => ab));

  return {
    isBerserker, isMonk, isSentinel, isConsular, isFighter, isGuardian, isOperative, isScholar, isScout, isEngineer,
    savageAttacks: speciesTraits.has("savage attacks"),
    gamorreanToughness: speciesTraits.has("gamorrean toughness"),
    dangerSense: isBerserker && classLevelOf(profile, "Berserker") >= 3,
    unarmoredDefense,
    unarmoredDefenseAllowsShield: unarmoredDefenseClass === "berserker",
    unarmoredMovement,
    martialArtsDie,
    sneakAttack,
    rangersQuarry,
    maniacalRage: isBerserker && normalizeName(clsEntries.find(e => normalizeName(e.name) === "berserker")?.archetype || session?.approach) === "frenzied approach" && Boolean(session?.rage),
    weaponProficiencies,
    weaponChecks,
    armorProficiencies,
    savingThrows,
    savingThrowRanks,
    featSpeedBonus,
    featSpeedSources,
    armorExpertLightSpeed,
    armorExpertMedMastery,
    armorExpertHeavyCritImmune,
    armorExpertSource,
    weaponExpertBlasterAdv,
    weaponExpertLightAdv,
    weaponExpertVibroAdv,
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
    alert: initiativeProf || classOptInitProf || Boolean(typeof collectCharacterEffects === "function" && collectCharacterEffects(profile, session).some(e => e.type === "initiativeMod" && e.proficiency)),
    classOptSpeedBonus, classOptUnarmedFinesse, classOptUnarmedCrit, monkArmorAllowed, monkUsesForceMod, focusMaxHalfForceMod, classOptCarryingDouble, classOptUnlocksForms,
    observant: passiveBonus > 0,
    brawny: Boolean(dEffTraits && dEffTraits.carryMultiplier >= 2),
    durable: Boolean(typeof resolveHpEffects === "function" && resolveHpEffects(profile, session).hitDieMin > 0),
    fanatic: Boolean(typeof collectCharacterEffects === "function" && collectCharacterEffects(profile, session).some(e => e.type === "hpMod" && e.trigger === "creatureDropsTo0"))
  };
}

function effectiveScores(profile, session) {
  if (typeof _cachedFor === "function") return _cachedFor("effectiveScores", profile, session, () => _effectiveScoresUncached(profile, session));
  return _effectiveScoresUncached(profile, session);
}
function _effectiveScoresUncached(profile, session) {
  const base = profile.baseScores || profile.scores;
  const overrides = profile.scoreOverrides || {};
  const result = {};
  for (const ability of abilities) {
    if (overrides[ability] !== null && overrides[ability] !== undefined) {
      result[ability] = overrides[ability];
      continue;
    }
    let score = base[ability];
    const abEff = typeof resolveAbilityEffects === "function" ? resolveAbilityEffects(profile, session) : {bonuses: {}, floors: {}, caps: {}};
    const cap = abEff.caps[ability] || 20;
    for (const feat of session?.feats || []) {
      const rule = featRule(feat.name);
      const hasAbilityBonusEff = Array.isArray(rule?.effects) && rule.effects.some(e => e.type === "abilityBonus");
      if (hasAbilityBonusEff) continue;
      const chosen = feat.abilityChoice || (rule?.attributes?.length === 1 ? rule.attributes[0] : "");
      if (chosen === ability && score < cap) score = Math.min(cap, score + 1);
    }
    if (abEff.bonuses[ability]) score = Math.min(cap, score + abEff.bonuses[ability]);
    if (abEff.floors[ability] && score < abEff.floors[ability]) score = abEff.floors[ability];
    const manualAdj = (Number(session?.statModifiers?.["ability:" + ability]) || 0) + (Number(session?.abilityAdjustments?.[ability]) || 0);
    if (manualAdj) score = clamp(score + manualAdj, 1, 30);
    result[ability] = score;
  }
  // Armor Powered X & Agile X are handled via unified effect-engine abilityFloor
  return result;
}

function effectiveTraining(profile, session) {
  if (typeof _cachedFor === "function") return _cachedFor("effectiveTraining", profile, session, () => _effectiveTrainingUncached(profile, session));
  return _effectiveTrainingUncached(profile, session);
}
function _effectiveTrainingUncached(profile, session) {
  const base = profile.baseTraining || profile.training;
  const result = {...base};
  for (const feat of session?.feats || []) {
    const fr = featRule(feat.name);
    const sk = fr?.mechanics?.skillGrant;
    const hasUnifiedSkillProf = Array.isArray(fr?.effects) && fr.effects.some(e => e.type === "proficiency" && e.kind === "skill" && e.target === sk);
    if (sk && !hasUnifiedSkillProf && profile.explicitTraining?.[sk] === undefined) {
      result[sk] = Math.min(2, (result[sk] || 0) + 1);
    }
    for (const picked of feat.multiChoice || []) {
      if (skills[picked]) result[picked] = Math.max(result[picked] || 0, 1);
    }
  }
  for (const [optName, choices] of Object.entries(session?.classOptionChoices || {})) {
    const optRec = typeof classOptionRule === "function" ? classOptionRule(optName) : null;
    const ck = optRec?.choiceSpec?.kind || "";
    if (ck === "proficientSkills" || ck === "proficientSkillsOrTools") continue;
    const owned = Array.isArray(session?.classOptions) && session.classOptions.some(x => normalizeName(x) === normalizeName(optRec?.name || optName));
    if (optRec && !owned) continue;
    for (const picked of (Array.isArray(choices) ? choices : [])) {
      if (skills[picked]) result[picked] = Math.max(result[picked] || 0, 1);
    }
  }
  for (const choices of Object.values(session?.speciesTraitChoices || {})) {
    for (const picked of (Array.isArray(choices) ? choices : [])) {
      if (skills[picked]) result[picked] = Math.max(result[picked] || 0, 1);
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
  if (typeof collectCharacterEffects === "function") {
    for (const e of collectCharacterEffects(profile, session)) {
      if (e.type === "proficiency" && e.kind === "skill" && e.target && skills[e.target] && Number.isFinite(e.rank) && e.rank >= 1) {
        if (e.upgradeToExpertise && (result[e.target] || 0) >= 1) {
          result[e.target] = 2;
        } else {
          result[e.target] = Math.max(result[e.target] || 0, Math.min(2, e.rank));
        }
      }
    }
  }
  for (const [sk, rank] of Object.entries(session?.skillOverrides || {})) {
    if (skills[sk] && Number.isInteger(rank) && rank >= 0 && rank <= 2) {
      result[sk] = rank;
    }
  }
  return result;
}

function speciesHpBonus(profile, session) {
  const sp = speciesRecord(profile?.species);
  return sp?.hpPerLevel ? profile.level * sp.hpPerLevel : 0;
}

function featHpBonus(profile, session) {
  if (typeof resolveHpEffects !== "function") return 0;
  const hpEff = resolveHpEffects(profile, session);
  const featSources = (hpEff.sources || []).filter(s => s.kind === "feat" && Number.isFinite(s.perLevel));
  if (!featSources.length) return 0;
  let total = 0;
  for (const s of featSources) {
    const bonus = s.perLevel * (profile?.level || 1);
    const wasImportedWithFeat = (profile?.selectedFeats || []).some(f => normalizeName(f.name) === normalizeName(s.name));
    if (wasImportedWithFeat && (profile?.extraHpBonus || 0) >= bonus) continue;
    total += bonus;
  }
  return total;
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
  let effectHp = 0;
  if (typeof resolveHpEffects === "function") {
    const hpEff = resolveHpEffects(profile, session);
    for (const s of hpEff.sources) {
      if (s.kind === "species" && speciesHp > 0) continue;
      if (s.kind === "feat" && Number.isFinite(s.perLevel)) continue;
      if (s.kind === "archetype" && archHp > 0) continue;
      if (Number.isFinite(s.perLevel)) effectHp += s.perLevel * (profile.level || 1);
      if (Number.isFinite(s.flat)) effectHp += s.flat;
    }
  }
  return Math.max(1, profile.hpDice + conHp + speciesHp + featHp + extraBonus + effHp + archHp + effectHp);
}

function defenseProfile(profile, session = null) {
  if (typeof _cachedFor === "function") return _cachedFor("defenseProfile", profile, session, () => _defenseProfileUncached(profile, session));
  return _defenseProfileUncached(profile, session);
}
function _defenseProfileUncached(profile, session = null) {
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
  const extraNotes = [...effMods.tacticalNotes];
  if (session) {
    const tr = characterTraits(profile, session);
    const arm = armorStats(profile, session);
    if (tr.medHeavyArmorDmgReduction && arm.armor && (arm.armor.armor === "Medium" || arm.armor.armor === "Heavy") && !arm.nonproficient) {
      extraNotes.push("Defense Mastery: reduce weapon damage by " + tr.medHeavyArmorDmgReduction + " (min 1)");
    }
    if (tr.shieldBonusToDexSaves && arm.shield && !(c && c.incapacitated)) {
      extraNotes.push("Shield Mastery: +" + (Number(arm.shield.ac) || 0) + " to Dexterity saves vs powers and harmful effects");
    }
    if (arm.shield && typeof resolveCombatEffects === "function" && resolveCombatEffects(profile, session).weaponRules.some(wr => wr.kind === "improvisedShield")) {
      const shProps = /heavy/i.test(arm.shield.name || arm.shield.armor || "") ? "Heavy" : "Light, Fixed";
      extraNotes.push("Shield Style: proficient as improvised weapon (" + shProps + ")");
    }
    for (const eq of [arm.armor, arm.shield].filter(Boolean)) {
      for (const prop of armorPropertyProfile(eq.properties).defenseSummaries) {
        extraNotes.push(eq.name + ": " + prop);
      }
    }
  }
  const removedSet = new Set((effMods.removedResistances || []).map(r => r.toLowerCase()));
  const spDef = speciesRecord(profile?.species);
  const vulnerabilities = [...new Set(spDef?.vulnerabilities || [])];
  const defEff = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
  const conditionalResistances = [];
  const conditionalImmunities = [];
  const conditionalVulnerabilities = [];
  if (defEff) {
    for (const r of defEff.resistances) {
      if (!r.condition) resistances.push(r.damageType);
      else {
        conditionalResistances.push(`${r.damageType} (${r.condition})`);
        extraNotes.push(`Resistance to ${r.damageType} ${r.condition} (${r.source})`);
      }
    }
    for (const im of defEff.immunities) {
      if (!im.condition) immunities.push(im.damageType);
      else {
        conditionalImmunities.push(`${im.damageType} (${im.condition})`);
        extraNotes.push(`Immunity to ${im.damageType} ${im.condition} (${im.source})`);
      }
    }
    for (const v of defEff.vulnerabilities) {
      if (!v.condition) vulnerabilities.push(v.damageType);
      else {
        conditionalVulnerabilities.push(`${v.damageType} (${v.condition})`);
        extraNotes.push(`Vulnerability to ${v.damageType} ${v.condition} (${v.source})`);
      }
    }
    const _baseSenses = defEff.senses.filter(sn => !sn.extend);
    const _extendSenses = defEff.senses.filter(sn => sn.extend);
    for (const sn of _baseSenses) {
      if (sn.kind === "enhancedDarkvision") {
        const lbl = "See in enhanced darkness";
        if (!senses.includes(lbl)) senses.push(lbl);
        continue;
      }
      const kindTitle = sn.kind.charAt(0).toUpperCase() + sn.kind.slice(1);
      const rng = sn.rangePerProf ? (sn.rangePerProf * (profile?.proficiency || 2)) : (sn.range || 0);
      const re = new RegExp("^" + kindTitle + "(?:\\s+(\\d+)\\s*ft)?$", "i");
      const idx = senses.findIndex(x => re.test(x));
      if (idx >= 0) {
        if (rng > 0) {
          const cur = Number(senses[idx].match(re)?.[1] || 0);
          if (rng > cur) senses[idx] = kindTitle + " " + rng + " ft";
        }
      } else {
        senses.push(kindTitle + (rng ? " " + rng + " ft" : ""));
      }
    }
    for (const sn of _extendSenses) {
      const kindTitle = sn.kind.charAt(0).toUpperCase() + sn.kind.slice(1);
      const rng = sn.rangePerProf ? (sn.rangePerProf * (profile?.proficiency || 2)) : (sn.range || 0);
      if (rng <= 0) continue;
      const re = new RegExp("^" + kindTitle + "\\s+(\\d+)\\s*ft$", "i");
      const idx = senses.findIndex(x => re.test(x));
      if (idx >= 0) {
        const cur = Number(senses[idx].match(re)[1]) || 0;
        const addRng = sn.extendRange || rng;
        senses[idx] = kindTitle + " " + (cur + addRng) + " ft";
      } else {
        senses.push(kindTitle + " " + rng + " ft");
      }
    }
    if (effMods.blindfightingDoubled) {
      senses = senses.map(s => {
        const m = s.match(/^Blindsight\s+(\d+)\s*ft$/i);
        return m ? ("Blindsight " + (Number(m[1]) * 2) + " ft") : s;
      });
    }
    for (const ct of defEff.combatTraits) {
      if (ct.note) extraNotes.push(`${ct.note} (${ct.source})`);
    }
    for (const dr of defEff.damageReductions) {
      if (dr.source === "Defense Mastery") continue;
      const amtVal = String(dr.amount || "").toUpperCase() === "PB" ? (profile?.proficiency || 2) : dr.amount;
      const drLabel = (dr.damageTypes && dr.damageTypes.length === 1 && dr.damageTypes[0] === "weapon") ? "weapon damage" : (dr.damageTypes || ["damage"]).join("/");
      extraNotes.push(`Reduce ${drLabel} by ${amtVal} (min ${dr.minDamage ?? 0}) (${dr.source})`);
    }
  }
  if (typeof resolveContextualNotes === "function") {
    for (const cn of resolveContextualNotes(profile, session, "defenses")) {
      const sameDefTitle = cn.title && (normalizeName(cn.title) === normalizeName(cn.source) || normalizeName(cn.title).startsWith(normalizeName(cn.source) + " ("));
      extraNotes.push(sameDefTitle ? `${cn.title}: ${cn.text}` : `${cn.title}: ${cn.text} (${cn.source})`);
    }
  }
  if (typeof resolveCastingEffects === "function") {
    for (const cr of resolveCastingEffects(profile, session).restrictions) {
      if (cr.note) extraNotes.push(`${cr.note} (${cr.source})`);
    }
  }
  const conditionImmunities = [];
  if (defEff) {
    for (const ci of defEff.conditionImmunities || []) {
      conditionImmunities.push(ci.condition);
      extraNotes.push(`${ci.mode === "advantage" ? "Advantage vs" : "Immune to"} ${ci.condition} (${ci.source})`);
    }
    for (const br of defEff.biologyRules || []) {
      if (br.note) extraNotes.push(`${br.note} (${br.source})`);
    }
  }
  if (typeof resolveAttunementEffects === "function") {
    for (const src of resolveAttunementEffects(profile, session).sources) {
      extraNotes.push(`Attunement: ${src}`);
    }
  }
  if (typeof resolveCombatEffects === "function") {
    for (const comp of resolveCombatEffects(profile, session).companionGrants) {
      const cNote = comp.scalingNote ? interpolateRuleTokens(comp.scalingNote, profile, session) : "";
      extraNotes.push(`Companion (${comp.kind || "ally"}): ${comp.name || comp.sourceName}${cNote ? " — " + cNote : ""}`);
    }
  }
  if (typeof resolveResourceEffects === "function") {
    const resEff = resolveResourceEffects(profile, session);
    for (const au of resEff.actionUpgrades || []) {
      if (au.source?.kind === "weaponSupremacy") continue;
      extraNotes.push(`Action Upgrade: ${au.targetAction} → ${au.newZone} (${au.source?.name || "Effect"})`);
    }
    for (const ms of resEff.multiclassScales || []) {
      extraNotes.push(`Multiclass Scaling: ${ms.targetClass} ${ms.targetFeature} (${ms.source?.name || "Effect"})`);
    }
  }
  const immSet = new Set(immunities.map(x => String(x).toLowerCase()));
  return {
    resistances: [...new Set(resistances)].filter(r => !removedSet.has(String(r).toLowerCase()) && !immSet.has(String(r).toLowerCase())),
    vulnerabilities: [...new Set(vulnerabilities)],
    immunities: [...new Set(immunities)],
    conditionalResistances: [...new Set(conditionalResistances)],
    conditionalImmunities: [...new Set(conditionalImmunities)],
    conditionalVulnerabilities: [...new Set(conditionalVulnerabilities)],
    conditionImmunities: [...new Set(conditionImmunities)],
    senses,
    rollModifiers: effMods.rollModifiers,
    tacticalNotes: (() => {
      const out = [], seen = new Set();
      for (const n of extraNotes) {
        const core = normalizeName(String(n || "").replace(/\s*\([^()]*\)\s*$/, ""));
        if (!core || seen.has(core)) continue;
        seen.add(core);
        out.push(n);
      }
      return out;
    })()
  };
}

function classFeaturesForClass(className, classLevel) {
  const cls = classRecord(className);
  if (!cls?.levelChanges) return [];
  const cap = Math.max(1, Math.min(20, Number(classLevel) || 1));
  const list = [];
  const seen = new Set();
  for (let lvl = 1; lvl <= cap; lvl++) {
    const raw = cls.levelChanges[String(lvl)]?.Features || "";
    for (const part of raw.split(",")) {
      const cleaned = part.replace(/\s*\([^)]*\)\s*$/, "").trim();
      if (!cleaned || /^[\d\uFFFD—–-]+$/.test(cleaned)) continue;
      const key = normalizeName(cleaned);
      if (seen.has(key)) continue;
      seen.add(key);
      const text = classRule(cls.name, cleaned);
      list.push({name: cleaned, level: lvl, text, className: cls.name});
    }
  }
  return list;
}
function classFeaturesWithLevels(profile) {
  if (!profile?.className) return [];
  const clsLvl = classLevelOf(profile, profile.className) || profile?.level || 1;
  return classFeaturesForClass(profile.className, clsLvl);
}

function characterProficiencies(profile, session = null) {
  if (typeof _cachedFor === "function") return _cachedFor("characterProficiencies", profile, session, () => _characterProficienciesUncached(profile, session));
  return _characterProficienciesUncached(profile, session);
}
function _characterProficienciesUncached(profile, session = null) {
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

  for (const cEntry of characterClasses(profile, session)) {
    const cRec = cEntry.record;
    if (!cRec) continue;
    if (cEntry.isStarting) {
      for (const a of (cRec.armorProficiencies || [])) pushUnique(armor, a, cRec.name);
      for (const w of (cRec.weaponProficiencies || [])) pushUnique(weapons, w, cRec.name);
      if (Array.isArray(cRec.toolProficiencies)) {
        for (const t of cRec.toolProficiencies) pushUnique(tools, t, cRec.name);
      } else if (typeof cRec.toolProficiencies === "string" && cRec.toolProficiencies.trim()) {
        pushUnique(tools, cRec.toolProficiencies, cRec.name);
      }
    } else {
      const mcSrc = cRec.name + " (multiclass)";
      for (const p of (cRec.multiclassProficiencies || [])) {
        const low = String(p || "").toLowerCase();
        if (/armor|shield/.test(low)) pushUnique(armor, p, mcSrc);
        else if (/blaster|vibro|lightweapon|techblade|weapon/.test(low)) pushUnique(weapons, p, mcSrc);
        else pushUnique(tools, p, mcSrc);
      }
    }
  }

  if (sp) {
    for (const a of (sp.armorProficiencies || [])) pushUnique(armor, a + (/armor|shield/i.test(a) ? "" : " armor"), sp.name);
    for (const w of (sp.weaponProficiencies || [])) pushUnique(weapons, w, sp.name);
    if (sp.languagesText) pushUnique(languages, sp.languagesText, sp.name);
  }

  if (bg) {
    const bgChoices = session?.backgroundChoices || {};
    const chosenBgTools = Object.entries(bgChoices).filter(([k]) => k.startsWith("tool:")).flatMap(([, v]) => Array.isArray(v) ? v : []);
    const chosenBgLangs = Object.entries(bgChoices).filter(([k]) => k.startsWith("lang:")).flatMap(([, v]) => Array.isArray(v) ? v : []);
    if (chosenBgTools.length) {
      chosenBgTools.forEach(t => pushUnique(tools, t, bg.name + " background"));
    } else if (bg.toolProficiencies) {
      pushUnique(tools, bg.toolProficiencies, bg.name + " background");
    }
    if (chosenBgLangs.length) {
      chosenBgLangs.forEach(l => pushUnique(languages, l, bg.name + " background"));
    } else if (bg.languages) {
      pushUnique(languages, bg.languages, bg.name + " background");
    }
  }

  for (const cp of (profile?.customProficiencies || [])) {
    const low = cp.toLowerCase();
    if (/armor|shield/.test(low)) pushUnique(armor, cp, "Character export");
    else if (/blaster|vibro|light|saber|sword|pistol|rifle|axe|spear|whip|weapon/.test(low)) pushUnique(weapons, cp, "Character export");
    else pushUnique(tools, cp, "Character export");
  }

  for (const feat of (session?.feats || [])) {
    const fName = feat.name || "";
    const fn = normalizeName(fName);
    const fRule = typeof featRule === "function" ? featRule(fName) : null;
    const fck = featChoiceKind(fRule);
    if (feat.choice && (fck === "weaponCategory" || fck === "weapon")) {
      pushUnique(weapons, feat.choice, fName + " feat");
    }
    if (fRule?.choiceSpec?.kind === "exoticWeapons") {
      const exPicks = feat.multiChoice?.length ? feat.multiChoice : (feat.choice ? [feat.choice] : []);
      if (exPicks.length) exPicks.forEach(w => pushUnique(weapons, w, fName + " feat"));
      else pushUnique(weapons, "Three exotic weapons (choose)", fName + " feat");
    }
    const weCatEff = (fRule?.effects || []).find(e => e.type === "weaponRule" && e.kind === "weaponExpertCategory");
    if (weCatEff) {
      const cats = Array.isArray(weCatEff.categories) ? weCatEff.categories : ["Blaster", "Lightweapon", "Vibroweapon"];
      if (cats.includes("Blaster")) pushUnique(weapons, "All blasters", fName + " feat");
      if (cats.includes("Lightweapon")) pushUnique(weapons, "All lightweapons", fName + " feat");
      if (cats.includes("Vibroweapon")) pushUnique(weapons, "All vibroweapons", fName + " feat");
    }
    const chosenToolsOrLangs = (feat.multiChoice?.length ? feat.multiChoice : (feat.choice ? [feat.choice] : []));
    const pushToolOrUpgrade = (tName) => {
      const normT = normalizeName(tName);
      const existing = tools.find(entry => normalizeName(entry.name.replace(/\s*\(Expertise\)$/i, "")) === normT);
      if (existing) {
        if (!/\(Expertise\)$/i.test(existing.name)) existing.name += " (Expertise)";
        if (!(existing.source || "").includes(fName + " feat")) {
          existing.source = existing.source ? (existing.source + ", " + fName + " feat") : (fName + " feat");
        }
      } else {
        pushUnique(tools, tName, fName + " feat");
      }
    };
    const fExtra = typeof extraFeatChoiceSpec === "function" ? extraFeatChoiceSpec(fRule, profile, session) : (fRule?.extraChoiceSpec || null);
    const hasToolProfEff = (fRule?.effects || []).some(e => e.type === "proficiency" && e.kind === "tool");
    if (fExtra && ["artisanImplements", "specialistKit", "gamingSet", "musicalInstrument"].includes(fExtra.kind)) {
      if (chosenToolsOrLangs.length) {
        if (!hasToolProfEff) chosenToolsOrLangs.forEach(t => fExtra.allowOwnedUpgrade ? pushToolOrUpgrade(t) : pushUnique(tools, t, fName + " feat"));
      } else {
        const placeholderByKind = {
          artisanImplements: "One artisan's implements (choose)",
          specialistKit: "One specialist's kit (choose)",
          gamingSet: "One gaming set (choose)",
          musicalInstrument: "One musical instrument (choose)"
        };
        pushUnique(tools, placeholderByKind[fExtra.kind] || ("One " + (fExtra.label || "tool").toLowerCase() + " (choose)"), fName + " feat");
      }
    } else if (fExtra?.kind === "skillsOrTools") {
      for (const p of chosenToolsOrLangs) {
        if (!skills[p]) pushUnique(tools, p, fName + " feat");
      }
    } else if (fExtra?.kind === "languages") {
      if (chosenToolsOrLangs.length) chosenToolsOrLangs.forEach(l => pushUnique(languages, l, fName + " feat"));
      else pushUnique(languages, (fExtra.count === 3 ? "Three languages" : ((fExtra.count || 1) + " language(s)")) + " (choose)", fName + " feat");
    }
  }

  // Customization choices (skills handled in effectiveTraining; tools, weapons, languages here)
  for (const [optName, picks] of Object.entries(session?.classOptionChoices || {})) {
    const spec = typeof classOptionGrantSpec === "function" ? classOptionGrantSpec(optName) : null;
    for (const p of (Array.isArray(picks) ? picks : [])) {
      if (!p || skills[p]) continue;
      if (spec?.kind === "languages") pushUnique(languages, p, optName);
      else if (spec?.kind === "lightBlastersOrVibro" || spec?.kind === "allWeapons" || spec?.kind === "blastersOrVibro") pushUnique(weapons, p, optName);
      else if (spec?.kind === "skillsOrTools" || spec?.kind === "allTools") pushUnique(tools, p, optName);
    }
  }

  // Species trait choices (skills handled in effectiveTraining; languages, tools, weapons, instruments, kits here)
  for (const [traitName, picks] of Object.entries(session?.speciesTraitChoices || {})) {
    for (const p of (Array.isArray(picks) ? picks : [])) {
      if (!p || skills[p]) continue;
      if (/^languages$/i.test(traitName)) {
        pushUnique(languages, p, (profile?.species || "Species") + " · " + traitName);
        continue;
      }
      const it = typeof itemRule === "function" ? itemRule(p) : null;
      if (it?.category === "Weapon") pushUnique(weapons, p, (profile?.species || "Species") + " · " + traitName);
      else pushUnique(tools, p, (profile?.species || "Species") + " · " + traitName);
    }
  }


  const baseLangs = (sp?.languagesText || "").toLowerCase();
  for (const lang of (profile?.customLanguages || [])) {
    if (lang && !baseLangs.includes(lang.toLowerCase())) {
      pushUnique(languages, lang, "Character export");
    }
  }

  if (typeof resolveProficiencyEffects === "function") {
    const pe = resolveProficiencyEffects(profile, session);
    for (const ap of pe.armors) pushUnique(armor, ap.target, ap.source || "Feature");
    for (const wp of pe.weapons) pushUnique(weapons, wp.target, wp.source || "Feature");
    for (const tp of pe.tools) {
      if (tp.upgradeToExpertise) {
        const normT = normalizeName(tp.target);
        const existing = tools.find(entry => normalizeName(entry.name.replace(/\s*\(Expertise\)$/i, "")) === normT);
        if (existing) {
          if (!/\(Expertise\)$/i.test(existing.name)) existing.name += " (Expertise)";
          if (tp.source && !(existing.source || "").includes(tp.source)) {
            existing.source = existing.source ? (existing.source + ", " + tp.source) : tp.source;
          }
        } else {
          pushUnique(tools, tp.target, tp.source || "Feature");
        }
      } else {
        pushUnique(tools, tp.target, tp.source || "Feature");
      }
    }
    for (const lp of pe.languages) pushUnique(languages, lp.target, lp.source || "Feature");
  }

  return {armor, weapons, tools, languages};
}

function characterLanguages(profile, session = null) {
  const sp = speciesRecord(profile?.species);
  const parts = [];
  if (sp?.languagesText) parts.push(sp.languagesText);
  for (const [k, picks] of Object.entries(session?.backgroundChoices || {})) {
    if (!k.startsWith("lang:")) continue;
    for (const l of (Array.isArray(picks) ? picks : [])) {
      if (l && !parts.some(p => p.toLowerCase().includes(l.toLowerCase()))) parts.push(l);
    }
  }
  for (const l of (Array.isArray(session?.speciesTraitChoices?.Languages) ? session.speciesTraitChoices.Languages : [])) {
    if (l && !parts.some(p => p.toLowerCase().includes(l.toLowerCase()))) parts.push(l);
  }
  const baseLower = (sp?.languagesText || "").toLowerCase();
  for (const lang of (profile?.customLanguages || [])) {
    if (lang && !baseLower.includes(lang.toLowerCase())) parts.push(lang);
  }
  for (const feat of (session?.feats || [])) {
    const fRule = typeof featRule === "function" ? featRule(feat?.name) : null;
    const fExtra = typeof extraFeatChoiceSpec === "function" ? extraFeatChoiceSpec(fRule, profile, session) : (fRule?.extraChoiceSpec || null);
    if (fExtra?.kind !== "languages") continue;
    const picks = Array.isArray(feat.multiChoice) && feat.multiChoice.length ? feat.multiChoice : (feat.choice ? [feat.choice] : []);
    for (const l of picks) {
      if (l && !parts.some(p => p.toLowerCase().includes(l.toLowerCase()))) parts.push(l);
    }
  }
  if (typeof resolveProficiencyEffects === "function") {
    const seenL = new Set(parts.map(p => p.toLowerCase()));
    for (const lp of resolveProficiencyEffects(profile, session).languages) {
      if (lp.target && !baseLower.includes(lp.target.toLowerCase()) && !seenL.has(lp.target.toLowerCase())) {
        seenL.add(lp.target.toLowerCase());
        parts.push(lp.target);
      }
    }
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
  const defCarry = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
  let mult = traits.carryingMultiplier || 1;
  const defCarryMult = (defCarry && defCarry.carryMultiplier && defCarry.carryMultiplier !== 1) ? defCarry.carryMultiplier : 1;
  const effCarry = session ? (activeEffectModifiers(profile, session).carryingMultiplier || 1) : 1;
  const effSize = session?.sizeOverride || sp?.size || "Medium";
  const sizeMult = effSize === "Tiny" ? 0.5 : effSize === "Large" ? 2 : effSize === "Huge" ? 4 : effSize === "Gargantuan" ? 8 : 1;
  let totalMult = mult * sizeMult;
  if (defCarryMult === 2 && totalMult === 2) totalMult = 3;
  else totalMult *= defCarryMult;
  if (effCarry > 1) totalMult *= effCarry;
  const encumberedAt = Math.floor(scores.Strength * 5 * totalMult);
  const heavilyEncumberedAt = Math.floor(scores.Strength * 10 * totalMult);
  const capacity = Math.floor(scores.Strength * 15 * totalMult);
  const maxLoad = capacity * 2;
  const mode = session?.encumbranceMode === "standard" ? "standard" : "variant";
  const carried = (session?.equipped || []).reduce((sum, item) => {
    if (item.stored) return sum;
    const rule = itemRule(item.name, item);
    let weight = Number(rule?.weight) || 0;
    let selfItemMultApplied = false;
    if (rule?.properties && typeof propertyRule === "function") {
      const catHint = rule.armor === "Shield" ? "Shield" : rule.category;
      for (const p of rule.properties) {
        const pr = propertyRule(p, catHint);
        for (const ef of pr?.effects || []) {
          if (ef.type === "weightMultiplier" && ef.target === "selfItem" && Number.isFinite(ef.multiplier)) {
            weight *= ef.multiplier;
            selfItemMultApplied = true;
          }
        }
      }
    }
    if (defCarry) {
      for (const wm of defCarry.weightMultipliers) {
        if (wm.target === "selfItem" && selfItemMultApplied) continue;
        const match = wm.target === "all"
          || (wm.target === "selfItem" && normalizeName(wm.itemName) === normalizeName(item.name))
          || (wm.target === "armor" && rule?.category === "Armor")
          || (wm.target === "shield" && rule?.armor === "Shield");
        if (match) weight *= wm.multiplier;
      }
    }
    return sum + weight * (item.quantity || 1);
  }, 0);
  const rounded = Math.round(carried * 10) / 10;
  const overloaded = rounded > maxLoad;
  const overCapacity = !overloaded && rounded > capacity;
  const heavilyEncumbered = mode === "variant" && !overloaded && !overCapacity && rounded > heavilyEncumberedAt;
  const encumbered = mode === "variant"
    ? (!overloaded && !overCapacity && !heavilyEncumbered && rounded > encumberedAt)
    : overCapacity;
  return {
    mode,
    carried: rounded,
    encumberedAt,
    heavilyEncumberedAt,
    capacity,
    maxLoad,
    encumbered,
    heavilyEncumbered,
    overCapacity,
    overloaded,
    hasDisadvantage: overloaded || overCapacity || heavilyEncumbered
  };
}

function isWeaponProficient(profile, session, rule) {
  if (!rule) return false;
  const {weaponProficiencies, weaponChecks} = characterTraits(profile, session);
  if (weaponProficiencies.has(rule.classification) || weaponProficiencies.has(normalizeName(rule.name))) return true;
  return weaponChecks.some(fn => fn(rule));
}

function monkMartialArtsActive(profile, session, traits = null) {
  const t = traits || characterTraits(profile, session);
  if (!t.isMonk) return false;
  const eqArm = session ? equippedRule(session, "armor") : null;
  const eqSh = session ? equippedRule(session, "shield") : null;
  if (eqSh) return false;
  if (eqArm && !(t.monkArmorAllowed && (eqArm.armor === "Light" || eqArm.armor === "Medium"))) return false;
  return true;
}

function weaponStats(profile, item, raging, session = null) {
  if (item === "unarmed") {
    const scores = effectiveScores(profile, session);
    const traits = characterTraits(profile, session);
    const maActive = monkMartialArtsActive(profile, session, traits);
    const c = session ? conditionState(session, profile) : null;
    const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);
    const sp = speciesRecord(profile?.species);
    const spUnarmed = sp?.unarmed || null;
    const unarmedFinesse = Boolean(maActive || traits.classOptUnarmedFinesse || spUnarmed?.finesse);
    const useDex = unarmedFinesse && modOf("Dexterity") > modOf("Strength") && !raging;
    let ability = useDex ? "Dexterity" : "Strength";
    if (traits.monkUsesForceMod) { const bestF = modOf("Wisdom") >= modOf("Charisma") ? "Wisdom" : "Charisma"; if (modOf(bestF) > modOf(ability)) ability = bestF; }
    const uDefTraits = (session && typeof resolveDefenseEffects === "function") ? resolveDefenseEffects(profile, session).combatTraits : [];
    const uHasPuny = uDefTraits.some(ct => ct.kind === "puny");
    const uHasFragile = uDefTraits.some(ct => ct.kind === "fragile");
    let abMod = modOf(ability);
    let rawAbMod = modifier(scores[ability]);
    const uPunyCapped = Boolean(uHasPuny && ability === "Strength" && rawAbMod > 3);
    const uFragileCapped = Boolean(!uPunyCapped && uHasFragile && ability === "Strength" && rawAbMod > 3);
    if (uPunyCapped || uFragileCapped) {
      rawAbMod = 3;
      if (abMod > 3) abMod = 3;
    }
    const uCombatEff = (session && typeof resolveCombatEffects === "function") ? resolveCombatEffects(profile, session) : null;
    const uReachRule = (uCombatEff?.weaponRules || []).find(wr => wr.kind === "reach" && wr.params?.bonusFeet);
    const tweak = profile.unarmedTweak || {};
    const stepDie = (base, steps) => {
      const ladder = [0, 4, 6, 8];
      let idx = ladder.indexOf(base);
      if (idx < 0) return base;
      return ladder[Math.min(ladder.length - 1, idx + steps)];
    };
    const uCEffPre = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
    let gauntDice = 0, gauntDie = 0;
    for (const wr of (uCEffPre?.weaponRules || [])) {
      if (wr.kind === "unarmedDie" && wr.params?.die) {
        const gm = String(wr.params.die).match(/(\d+)d(\d+)/i);
        if (gm) {
          const gd = Number(gm[1]), gs = Number(gm[2]);
          if (gd * gs > gauntDice * gauntDie) { gauntDice = gd; gauntDie = gs; }
        }
      }
    }
    const otherBaseDie = Math.max(tweak.dieSize || 0, maActive ? (traits.martialArtsDie || 0) : 0, spUnarmed?.die || 0);
    const useGauntlet = gauntDie > 0 && (gauntDice * gauntDie) >= otherBaseDie;
    const baseDie = Math.max(otherBaseDie, gauntDie);
    const effModsU = session ? activeEffectModifiers(profile, session) : {};
    const totalUnarmedSteps = (traits.unarmedDieStep || 0) + (effModsU.unarmedDieStep || 0);
    const sonicFists = (session?.effects || []).some(e => normalizeName(e.name) === "sonic fists");
    const die = Math.max(sonicFists ? 10 : 0, totalUnarmedSteps ? Math.max(baseDie, stepDie(baseDie, totalUnarmedSteps)) : baseDie);
    const dice = die ? (useGauntlet && !sonicFists && die === gauntDie ? gauntDice : 1) : 0;
    const uAbShort = (ability || "Strength").slice(0, 3).toUpperCase();
    // Guard against SW5e 0.7.6 website builder workaround where players manually added +(DEX - STR)
    // to unarmed tweaks because the builder lacked native finesse unarmed support.
    const finesseDelta = useDex ? (modOf("Dexterity") - modOf("Strength")) : 0;
    const isFinesseWorkaround = Boolean(useDex && finesseDelta > 0 && tweak.toHitBonus === finesseDelta);
    const effTweakHit = isFinesseWorkaround ? 0 : (tweak.toHitBonus || 0);
    const effTweakDmg = (isFinesseWorkaround && (tweak.damageBonus === finesseDelta || tweak.damageBonus === modOf("Dexterity"))) ? 0 : (tweak.damageBonus || 0);
    const uAtkBreak = tweak.toHitOverride != null
      ? [{ label: "Override", value: tweak.toHitOverride }]
      : [
          { label: uAbShort, value: abMod },
          { label: "Prof", value: profile.proficiency },
          ...(effTweakHit ? [{ label: "Unarmed Bonus", value: effTweakHit }] : []),
          ...(effModsU.unarmedBonus ? [{ label: "Unarmed Feature", value: effModsU.unarmedBonus }] : [])
        ];
    const uRage = (raging && ability === "Strength") ? (session?.rage?.source === "Splashclass" ? 2 : effectiveRageStats(profile, session).rageDamage) : 0;
    const uDmgBreak = [
      ...(rawAbMod ? [{ label: uAbShort, value: rawAbMod }] : []),
      ...(uRage ? [{ label: "Rage", value: uRage }] : []),
      ...(effTweakDmg ? [{ label: "Unarmed Bonus", value: effTweakDmg }] : []),
      ...(effModsU.unarmedBonus ? [{ label: "Unarmed Feature", value: effModsU.unarmedBonus }] : []),
      ...(effModsU.attackDamageBonus ? [{ label: "Active Effects", value: effModsU.attackDamageBonus }] : [])
    ];
    let toHit = tweak.toHitOverride ?? (abMod + profile.proficiency + effTweakHit + (effModsU.unarmedBonus || 0));
    const dmgBonus = rawAbMod + uRage + effTweakDmg + (effModsU.unarmedBonus || 0) + (effModsU.attackDamageBonus || 0);
    const uCEff = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
    const hasEnhancedUnarmed = Boolean(uCEff?.weaponRules?.some(wr => wr.kind === "enhancedStrikes"));
    return {
      name: "Unarmed strike",
      toHit,
      dice, die,
      flat: dice ? 0 : Math.max(1, 1 + dmgBonus),
      bonus: dice ? dmgBonus : 1 + dmgBonus,
      attackBreakdown: uAtkBreak,
      damageBreakdown: uDmgBreak,
      override: tweak.damageOverride || null,
      type: sonicFists ? "sonic" : "kinetic",
      melee: true, ranged: false, finesse: unarmedFinesse, versatile: null, twoHanded: false,
      light: false, thrown: false, reach: false, reload: "", proficient: true,
      disadvantage: false, ability, notes: [
        ...(hasEnhancedUnarmed ? ["Enhanced Strikes (counts as enhanced)"] : []),
        ...(traits.classOptUnarmedCrit ? ["Crit " + Math.max(16, 20 - traits.classOptUnarmedCrit) + "–20 (" + ((uCEff?.critMods || []).filter(cm => cm.scope === "unarmed" && cm.sourceName).map(cm => cm.sourceName).join(", ") || "Unarmed Critical") + ")"] : []),
        ...(uPunyCapped ? ["Puny (Strength bonus capped at +3)"] : []),
        ...(uFragileCapped ? ["Fragile (Strength bonus capped at +3)"] : []),
        ...(uReachRule ? [uReachRule.sourceName + ": +" + uReachRule.params.bonusFeet + " ft reach" + (uReachRule.params.onYourTurnOnly ? " on your turn" : "")] : []),
        ...(traits.isBerserker && (profile.level || 1) >= 9 ? ["Brutal Critical (+" + ((profile.level || 1) >= 17 ? 3 : (profile.level || 1) >= 13 ? 2 : 1) + " crit " + ((profile.level || 1) >= 13 ? "dice" : "die") + ")"] : [])
      ]
    };
  }
  const { rule, modalModes, modalModeName } = activeWeaponRule(item);
  if (!rule || rule.category !== "Weapon") return null;
  const isSpecialWeapon = !rule.dice || !rule.die;
  const props = rule.properties || [];
  const weaponProperties = weaponPropertyProfile(props);
  const hasFireMode = mode => weaponProperties.modes.some(entry => entry.params.mode === mode);
  const hasSaveFireMode = hasFireMode("burst") || hasFireMode("rapid");
  const isBlaster = /Blaster/i.test(rule.classification || "");
  const cEffWep = (session && typeof resolveCombatEffects === "function") ? resolveCombatEffects(profile, session) : null;
  const finesseGrantRule = (cEffWep?.weaponRules || []).find(wr => {
    if (wr.kind !== "finesseGrant") return false;
    const excludes = wr.params?.excludeProperties || [];
    return !excludes.some(ex => props.some(p => normalizeName(p) === normalizeName(ex) || p.toLowerCase().startsWith(String(ex).toLowerCase())));
  });
  const finesse = Boolean(weaponProperties.finesse || finesseGrantRule);
  const versatile = weaponProperties.versatile;
  const thrown = Boolean(weaponProperties.thrown);
  const light = weaponProperties.lightWeapon;
  const interlocking = Boolean(weaponProperties.interlocking);
  const detached = Boolean(interlocking && item.detached);
  const doubleProp = detached ? null : weaponProperties.doubleProp;
  const reach = weaponProperties.reachBonus > 0;
  const twoHanded = weaponProperties.twoHanded;
  const hasOversized = Boolean(session && typeof resolveDefenseEffects === "function" &&
    resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "oversized"));
  const oversizedHeavy = Boolean(hasOversized && /(Lightweapon|Vibroweapon)/i.test(rule.classification || "") && !weaponProperties.dexterityMin && !light);
  const heavy = weaponProperties.heavy || oversizedHeavy;
  const reload = weaponProperties.reload ? ("Reload " + weaponProperties.reload) : "";
  const ammoProp = weaponProperties.ammunition
    ? (weaponProperties.ammunition.ammoType + (weaponProperties.rangeSpec ? " (range " + weaponProperties.rangeSpec.text + ")" : ""))
    : (weaponProperties.specialRange ? ("special (" + weaponProperties.specialRange + ")") : "");
  const shield = session ? equippedRule(session, "shield") : null;
  const hasPhysicalShield = Boolean(shield && !/generator/i.test(shield.name));
  const hasStrProp = Boolean(weaponProperties.strengthMin);
  const canGripTwoHands = Boolean((versatile || doubleProp || (hasStrProp && !twoHanded)) && !hasPhysicalShield);
  const useTwoHands = Boolean(canGripTwoHands && (doubleProp ? (item.twoHanded !== false) : Boolean(item.twoHanded)));
  const thrownMode = Boolean(thrown && item.thrownMode);
  const ranged = isBlaster || thrownMode;
  const melee = !ranged;
  const scores = effectiveScores(profile, session);
  const c = session ? conditionState(session, profile) : null;
  const modOf = ab => c ? effectiveModifier(profile, session, ab, c) : modifier(scores[ab]);
  const traits = characterTraits(profile, session);
  const effMods = session ? activeEffectModifiers(profile, session) : {critRangeBonus: 0, nimanForceMelee: false};
  const isMighty = Boolean(weaponProperties.mighty);
  const isMonkWeapon = Boolean(
    monkMartialArtsActive(profile, session, traits) && /Vibroweapon/i.test(rule.classification || "") &&
    isWeaponProficient(profile, session, rule) &&
    !weaponProperties.heavy && !twoHanded && !weaponProperties.special && !weaponProperties.dexterityMin
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
  const wCombatEffEarly = (session && typeof resolveCombatEffects === "function") ? resolveCombatEffects(profile, session) : null;
  const hasNimanRule = Boolean(wCombatEffEarly?.weaponRules?.some(wr => wr.kind === "nimanForceMelee"));
  if (melee && (hasNimanRule || effMods.nimanForceMelee || effMods.meleeUsesForceMod || (isMonkWeapon && traits.monkUsesForceMod)) && !item.useAbility) {
    const wisM = modOf("Wisdom");
    const chaM = modOf("Charisma");
    const bestForceAb = wisM >= chaM ? "Wisdom" : "Charisma";
    if (modOf(bestForceAb) > modOf(ability)) {
      ability = bestForceAb;
      nimanApplied = true;
    }
  }
  const hasSplashScholarCA = Boolean(session && hasSplashclassImprovement(profile, session, "Scholar"));
  const hasCA = Boolean((traits.isScholar || hasSplashScholarCA) && (finesse || isBlaster) && (session?.effects || []).some(e => normalizeName(e.name) === "critical analysis"));
  if (hasCA && !item.useAbility) {
    const caAb = traits.isScholar ? scholarCriticalAnalysisAbility(profile, session) : "Intelligence";
    if (modOf(caAb) > modOf(ability)) {
      ability = caAb;
      criticalAnalysisApplied = true;
    }
  }
  const wDefTraits = (session && typeof resolveDefenseEffects === "function") ? resolveDefenseEffects(profile, session).combatTraits : [];
  const hasPuny = wDefTraits.some(ct => ct.kind === "puny");
  const hasFragile = wDefTraits.some(ct => ct.kind === "fragile");
  const hasUndersized = wDefTraits.some(ct => ct.kind === "undersized");
  const hasPintsized = wDefTraits.some(ct => ct.kind === "pintsized");
  let abilityMod = modOf(ability);
  let damageAbilityMod = modifier(scores[ability]);
  const punyCapped = Boolean(hasPuny && ability === "Strength" && damageAbilityMod > 3);
  const fragileCapped = Boolean(!punyCapped && hasFragile && ability === "Strength" && damageAbilityMod > 3);
  if (punyCapped || fragileCapped) {
    damageAbilityMod = 3;
    if (abilityMod > 3) abilityMod = 3;
  }
  const isMartialWep = /^Martial/i.test(rule.classification || "");
  const undersizedBlocked = Boolean(hasUndersized && isMartialWep && twoHanded && !light);
  const undersizedVers2H = Boolean(hasUndersized && isMartialWep && versatile);
  const pintsizedBlocked = Boolean(hasPintsized && (twoHanded || versatile));
  const pintsized2H = Boolean(hasPintsized && !twoHanded && !versatile && !light);
  const proficient = isWeaponProficient(profile, session, rule);
  // Smart (DEX/+prof): uses weapon's own Dexterity score & proficiency bonus instead of wielder's
  const smart = weaponProperties.smart;
  let effectiveProf = proficient ? profile.proficiency : 0;
  if (smart) {
    abilityMod = modifier(smart.dexScore);
    damageAbilityMod = abilityMod;
    effectiveProf = proficient ? smart.proficiencyBonus : 0;
  }
  const dexReq = weaponProperties.dexterityMin;
  const baseStrReq = weaponProperties.strengthMin || 0;
  const dexShort = Boolean(dexReq && scores.Dexterity < dexReq);
  let effectiveStrReq = baseStrReq;
  let strSteps = traits.reduceStrengthReqStep || 0;
  // Muscled Menace (Oversized): blaster Strength requirement reduced by 1 step (ignore 11)
  if (hasOversized && isBlaster) strSteps += 1;
  // SW5e Strength property: non-two-handed weapon wielded in two hands drops Strength req by 1 step
  if (!twoHanded && useTwoHands) strSteps += 1;
  for (let s = 0; s < strSteps && effectiveStrReq > 0; s++) {
    effectiveStrReq = effectiveStrReq <= 11 ? 0 : effectiveStrReq - 2;
  }
  const strShort = Boolean(effectiveStrReq && scores.Strength < effectiveStrReq);
  // Switch (XdY type[s]): toggleable/cyclable alternate damage dice & type
  const switchSpec = weaponProperties.switchSpec;
  const switchActiveType = !switchSpec ? ""
    : (typeof item.switchMode === "string" && switchSpec.types.includes(item.switchMode.toLowerCase()))
      ? item.switchMode.toLowerCase()
      : (item.switchMode ? switchSpec.types[0] : "");
  const switchActive = Boolean(switchActiveType);
  const dice = switchActive ? switchSpec.dice : (versatile && useTwoHands ? versatile.dice : rule.dice);
  let die = switchActive ? switchSpec.die : (versatile && useTwoHands ? versatile.die : rule.die);
  if (isMonkWeapon && !switchActive && traits.martialArtsDie && dice === 1 && traits.martialArtsDie > die) {
    die = traits.martialArtsDie;
  }
  const damageType = weaponProperties.conversion?.params.damageType ||
    (switchActive ? switchActiveType : (rule.damage || "kinetic").toLowerCase());
  const defensiveAmount = weaponDefenseEntry(session, item, weaponProperties)?.weaponDefense.amount || 0;
  const recklessAmount = weaponRecklessEntry(session, item, weaponProperties)?.weaponReckless.amount || 0;
  const heavyDmgBonus = (heavy && ability === "Strength") ? Math.max(1, Math.floor(damageAbilityMod / 2)) : 0;
  const stanceHit = recklessAmount - defensiveAmount;
  const stanceDmg = recklessAmount - defensiveAmount;
  const rageBonus = (raging && melee && ability === "Strength") ? effectiveRageStats(profile, session).rageDamage : 0;
  const wepGroup = weaponClassOf(modalModeName || item.name);
  const ownedFocusGroups = ownedWeaponFocusGroups(profile, session);
  const ownedSupGroups = ownedWeaponSupremacyGroups(profile, session);
  const hasFocus = Boolean(proficient && wepGroup && ownedFocusGroups.has(wepGroup));
  const hasSupremacy = Boolean(proficient && wepGroup && ownedSupGroups.has(wepGroup));

  const _abShort = (ability || "Strength").slice(0, 3).toUpperCase();
  const attackBreakdown = item.toHitOverride != null
    ? [
        { label: "Override", value: item.toHitOverride },
        ...(recklessAmount ? [{ label: "Reckless", value: recklessAmount }] : []),
        ...(defensiveAmount ? [{ label: "Defensive", value: -defensiveAmount }] : [])
      ]
    : [
        { label: smart ? "Smart (" + _abShort + ")" : _abShort, value: abilityMod },
        ...(effectiveProf ? [{ label: smart ? "Smart Prof" : "Prof", value: effectiveProf }] : []),
        ...(item.attackBonus ? [{ label: "Item Bonus", value: item.attackBonus }] : []),
        ...(recklessAmount ? [{ label: "Reckless", value: recklessAmount }] : []),
        ...(defensiveAmount ? [{ label: "Defensive", value: -defensiveAmount }] : []),
        ...(effMods.weaponAttackBonus ? [{ label: "Active Effects", value: effMods.weaponAttackBonus }] : [])
      ];
  const damageBreakdown = [
    ...(damageAbilityMod ? [{ label: smart ? "Smart (" + _abShort + ")" : _abShort, value: damageAbilityMod }] : []),
    ...(rule.flat ? [{ label: "Base", value: rule.flat }] : []),
    ...(item.damageBonus ? [{ label: "Item Bonus", value: item.damageBonus }] : []),
    ...(rageBonus ? [{ label: "Rage", value: rageBonus }] : []),
    ...(heavyDmgBonus ? [{ label: "Heavy", value: heavyDmgBonus }] : []),
    ...(recklessAmount ? [{ label: "Reckless", value: recklessAmount }] : []),
    ...(defensiveAmount ? [{ label: "Defensive", value: -defensiveAmount }] : []),
    ...(effMods.attackDamageBonus ? [{ label: "Active Effects", value: effMods.attackDamageBonus }] : []),
    ...(effMods.weaponDamageBonus ? [{ label: "Weapon Effects", value: effMods.weaponDamageBonus }] : [])
  ];
  let toHit = item.toHitOverride != null ? item.toHitOverride + stanceHit : (abilityMod + effectiveProf + (item.attackBonus || 0) + stanceHit + (effMods.weaponAttackBonus || 0));
  const prof = profile.proficiency || 2;
  const notes = [];
  if (!proficient) notes.push("Not proficient");
  if (punyCapped) notes.push("Puny (Strength bonus capped at +3)");
  if (fragileCapped) notes.push("Fragile (Strength bonus capped at +3)");
  if (undersizedBlocked) notes.push("Undersized: cannot use non-light two-handed martial weapons");
  if (undersizedVers2H) notes.push("Undersized: must wield in two hands");
  if (pintsizedBlocked) notes.push("Pintsized: cannot wield two-handed or versatile weapons");
  if (pintsized2H) notes.push("Pintsized: must wield in two hands");
  if (nimanApplied) notes.push("Niman (" + ability + ")");
  if (criticalAnalysisApplied) notes.push("Critical Analysis (" + ability + ")");
  if (traits.sneakAttack && (finesse || !melee)) notes.push("Sneak Attack +" + traits.sneakAttack);
  const keenBonus = weaponProperties.keen;
  const totalCritBonus = (effMods.critRangeBonus || 0) + keenBonus;
  if (totalCritBonus > 0) notes.push("Crit " + Math.max(16, 20 - totalCritBonus) + "–20");
  if (heavyDmgBonus > 0) notes.push("Heavy (+" + heavyDmgBonus + " Strength damage)");
  if (isMighty) notes.push("Mighty (Strength or Dexterity)");
  let critDice = 0;
  for (const effect of weaponProperties.brutal) {
    critDice += effect.brutalDice;
    notes.push(effect.property + ": +" + effect.brutalDice + (effect.brutalDice === 1 ? " crit die" : " crit dice"));
  }
  if (weaponProperties.vicious > 0) notes.push("Vicious +" + weaponProperties.vicious + " on max die");
  if (smart) notes.push("Smart (" + smart.dexScore + "/+" + smart.proficiencyBonus + ")");
  if (switchSpec) notes.push("Switch (" + switchSpec.dice + "d" + switchSpec.die + " " + switchSpec.types.join("/") + ")");
  if (weaponProperties.returning) notes.push("Returning (returns to hand after thrown attack)");
  if (weaponProperties.silent) notes.push("Silent (Dexterity (Stealth) vs. Wisdom (Perception) to stay hidden on ranged attack)");
  if (weaponProperties.specialized) notes.push("Specialized (" + weaponProperties.specialized + ")");
  if (thrown) notes.push("Thrown" + (weaponProperties.rangeSpec ? " (range " + weaponProperties.rangeSpec.text + ")" : ""));
  if (dexShort) notes.push("Dexterity " + dexReq + " unmet");
  if (strShort) {
    notes.push("Strength " + effectiveStrReq + " unmet");
    if (weaponProperties.modes.some(m => weaponProperties.strengthBlocksFireModes.includes(m.params.mode))) {
      notes.push("Burst/Penetrating/Rapid unavailable (Strength requirement unmet)");
    }
  }
  const groupReachByLabel = new Map();
  for (const wr of (cEffWep?.weaponRules || [])) {
    if (wr.kind !== "reach" || !wr.weaponGroup || !proficient || !wr.params?.bonusFeet) continue;
    if (normalizeName(wr.weaponGroup) !== normalizeName(wepGroup || "")) continue;
    const lbl = wr.params.label || wr.sourceName || "Reach";
    groupReachByLabel.set(lbl, Math.max(groupReachByLabel.get(lbl) || 0, Number(wr.params.bonusFeet) || 0));
  }
  let groupReachBonus = 0;
  const groupReachTags = [];
  for (const [lbl, ft] of groupReachByLabel.entries()) {
    groupReachBonus += ft;
    groupReachTags.push(lbl + " +" + ft + " ft");
  }
  const totalReachFt = 5 + weaponProperties.reachBonus + groupReachBonus;
  if (groupReachBonus > 0) notes.push("Reach " + totalReachFt + " ft (" + groupReachTags.join(", ") + ")");
  else if (reach) notes.push("Reach " + totalReachFt + " ft");
  if (reload) notes.push(reload);
  if (ammoProp) notes.push(ammoProp);
  const _minRollMap = { 4: 2, 6: 2, 8: 3, 10: 4, 12: 5, 20: 8 };
  const _dieFloor = _minRollMap[die] || 0;
  const _preGroupDmg = (cEffWep?.attackDamageMods || []).reduce((sum, am) => {
    if (!am.weaponGroup || !proficient || normalizeName(am.weaponGroup) !== normalizeName(wepGroup || "")) return sum;
    if (am.condition || am.oncePerRound || am.oncePerTurn) return sum;
    return sum + (Number.isFinite(am.damageBonus) ? am.damageBonus : 0);
  }, 0);
  const _wepDmgFlat = damageAbilityMod + (rule.flat || 0) + (item.damageBonus || 0) + rageBonus + heavyDmgBonus + _preGroupDmg + stanceDmg + (effMods.attackDamageBonus || 0) + (effMods.weaponDamageBonus || 0);
  const _minTotal = _dieFloor && dice ? (_dieFloor * dice + _wepDmgFlat) : 0;
  let minRollPerDie = 0;
  let minRollTotal = 0;
  let minRollSource = "";
  let minRollCondition = "";
  const isTwoHandedMelee = melee && twoHanded && /Vibroweapon|Lightweapon/i.test(rule.classification || "");
  if (proficient && isTwoHandedMelee && traits.minDamageThresholds.has("twoHandedMelee")) {
    if (_dieFloor > minRollPerDie) {
      minRollPerDie = _dieFloor;
      minRollTotal = _minTotal;
      minRollSource = "Great Weapon Style";
      minRollCondition = "";
    }
    notes.push(_dieFloor
      ? ("Great Weapon Style: min " + _dieFloor + " per d" + die + " (min " + _minTotal + " total)")
      : "Minimum roll threshold (Great Weapon Style)");
  }
  if (proficient && isTwoHandedMelee && traits.powerAttacks.has("twoHandedMelee")) {
    notes.push("Power: −" + prof + " attack / +" + (2 * prof) + " damage");
  }
  if ((ranged || thrownMode) && traits.noCloseRangedDisadv) notes.push("No 5-ft disadvantage");
  if (ranged || thrownMode) {
    if (traits.noLongRangeDisadv) notes.push("No long-range disadvantage");
    const groupCoverRanges = new Set();
    if (proficient && wepGroup) {
      for (const ct of wDefTraits) {
        if (ct.kind === "coverReduction" && ct.weaponGroup && normalizeName(ct.weaponGroup) === normalizeName(wepGroup) && (ct.range === "<=30 ft" || ct.range === ">30 ft")) {
          groupCoverRanges.add(ct.range);
        }
      }
    }
    if (traits.coverReductions.has("<=30 ft") || groupCoverRanges.has("<=30 ft")) notes.push("≤30 ft cover −1");
    if (traits.coverReductions.has(">30 ft") || groupCoverRanges.has(">30 ft")) notes.push(">30 ft cover −1");
  }
  if (isBlaster) {
    if (traits.minDamageThresholds.has("blaster30ft")) {
      if (_dieFloor > 0 && !minRollPerDie) {
        minRollPerDie = _dieFloor;
        minRollTotal = _minTotal;
        minRollSource = "Snapshot Style";
        minRollCondition = "≤30 ft";
      }
      notes.push(_dieFloor
        ? ("Snapshot Style (≤30 ft): min " + _dieFloor + " per d" + die + " (min " + _minTotal + " total)")
        : "≤30 ft: minimum roll threshold (Snapshot Style)");
    }
    if (raging && normalizeName(session?.approach) === "ballistic approach" && (profile.level || 1) >= 3) {
      if (_dieFloor >= minRollPerDie && _dieFloor > 0) {
        minRollPerDie = _dieFloor;
        minRollTotal = _minTotal;
        minRollSource = "Ballistic Approach";
        minRollCondition = "";
      }
      notes.push(_dieFloor
        ? ("Explosive (Rage): min " + _dieFloor + " per d" + die + " (min " + _minTotal + " total)")
        : "Explosive (Rage): minimum roll threshold");
    }
    if (proficient && traits.powerAttacks.has("blasterOver30ft")) {
      notes.push(">30 ft −" + prof + " attack / +" + (2 * prof) + " damage");
    }
  }
  if (normalizeName(rule.name) === "wrist launcher" && session) {
    const _hasCanMax1 = Boolean(cEffWep?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "canister" && Array.isArray(cm.maxDamageOnSaveRoll)));
    const _hasExpMax1 = Boolean(cEffWep?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "explosive" && Array.isArray(cm.maxDamageOnSaveRoll)));
    if (_hasCanMax1) notes.push("Area Style: canisters natural 1 save = max damage");
    if (_hasExpMax1) notes.push("Explosives Style: missiles natural 1 save = max damage");
    const _hasCanTrade = Boolean(cEffWep?.attackDamageMods?.some(am => am.scope === "canister" && am.tradeoff));
    if (_hasCanTrade) {
      const _canDcInt = 8 + prof + modifier(scores.Intelligence);
      notes.push("Area Mastery: canister DC " + _canDcInt + " (if higher)");
      notes.push("Area Mastery: canisters cover −1 step (ignore 1/4)");
      notes.push("Area Mastery: canisters −" + prof + " DC for +" + prof + " damage");
    }
  }
  if (thrownMode && traits.noThrownLongRangeDisadv && !notes.includes("No long-range disadvantage")) notes.push("No long-range disadvantage");
  if ((thrownMode || thrown) && typeof resolveDefenseEffects === "function" && resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "thrownFreeDrawAndStep")) {
    notes.push("Throwing Style: free draw & 5 ft step without opportunity attacks on thrown attack");
  }
  if (proficient && doubleProp && traits.powerAttacks.has("doubleWeapon")) {
    notes.push("Power: −" + prof + " attack / +" + (useTwoHands || twoHanded ? Math.floor(prof * 1.5) : prof) + " damage");
    notes.push("Twin-Blade Mastery: max damage die grants +1 to next attack");
  }
  if (proficient && melee && !twoHanded && !useTwoHands && traits.powerAttacks.has("dualMelee")) {
    notes.push("Dual-wield power: −" + prof + " attack / +" + prof + " damage");
  }
  if (hasFocus) notes.push(wepGroup + " Focus (+1 damage)");
  if (hasSupremacy) notes.push(wepGroup + " Supremacy (+1 hit)");
  const hasIgnoreTwoHanded = Boolean(proficient && (cEffWep?.weaponRules || []).some(wr => wr.kind === "ignoreTwoHanded"));
  if (twoHanded && hasIgnoreTwoHanded) notes.push("Titan's Power: ignore two-handed");
  const missDmgMod = melee ? (cEffWep?.attackDamageMods || []).find(am => am.scope === "meleeWeapon" && am.onMiss) : null;
  if (missDmgMod) {
    const missAb = missDmgMod.onMiss;
    const missVal = Math.max(0, modifier(scores[missAb] || 10));
    notes.push((missDmgMod.sourceName || "Miss damage") + ": miss deals " + missVal + " " + damageType + " damage");
  }
  const isLightWep = /Lightweapon/i.test(rule.classification || "");
  const isVibroWep = /Vibroweapon/i.test(rule.classification || "");
  if ((isBlaster && traits.weaponExpertBlasterAdv) || (isLightWep && traits.weaponExpertLightAdv) || (isVibroWep && traits.weaponExpertVibroAdv)) {
    notes.push("Weapon Expert: 1/turn advantage on damage roll");
  }
  if (modalModeName) notes.push("Mode: " + modalModeName);
  for (const wd of effMods.weaponDamageDice || []) notes.push(wd);
  if (melee && effMods.auraHatredBonus > 0) notes.push("+" + effMods.auraHatredBonus + " (Aura of Hatred, 1st hit/rd)");
  if (effMods.sharpshooterBonus > 0) notes.push("+" + effMods.sharpshooterBonus + " hit (Sharpshooter's Routine, 1st/turn)");
  const quarryEffectOn = (session?.effects || []).some(e => normalizeName(e.name) === "ranger's quarry" || normalizeName(e.name) === "ranger’s quarry");
  if (traits.rangersQuarry && quarryEffectOn) {
    notes.push("+1" + traits.rangersQuarry + " (Ranger’s Quarry, once per turn)");
  } else if (quarryEffectOn && session && hasSplashclassImprovement(profile, session, "Scout")) {
    notes.push("+1d4 (Splashclass Ranger’s Quarry, once per turn)");
  }
  if (traits.isScout && (profile.level || 1) >= 20) {
    const fsIntMod = modifier(effectiveScores(profile, session).Intelligence);
    notes.push("Foe Slayer (" + signed(fsIntMod) + " hit or damage, once per turn)");
  }
  for (const wn of archetypePassiveSummary(profile, session).weaponNotes || []) notes.push(wn);
  const hasUnifiedSpeciesCrit = Boolean(session && typeof resolveCombatEffects === "function" &&
    resolveCombatEffects(profile, session).critMods.some(cm => cm.source?.kind === "species" && cm.brutalDice));
  if (melee && traits.savageAttacks && !hasUnifiedSpeciesCrit) notes.push("Savage Attacks (+1 crit die)");
  if (detached) notes.push("Detached (2 weapons)");
  let effWepDmgBonus = 0;
  let meleeDisadv = false;
  let critMin = Math.max(16, 20 - totalCritBonus);
  const matchesWeaponSource = e => {
    const srcItem = e.source?.kind === "property" ? e.source.itemName : (e.source?.kind === "equipment" ? e.source.name : "");
    if (e.source?.itemId != null && item.id != null) return e.source.itemId === item.id;
    return !srcItem || normalizeName(srcItem) === normalizeName(item.name);
  };
  if (typeof resolveCombatEffects === "function") {
    const cEff = resolveCombatEffects(profile, session);
    const _skipGenericAmScopes = new Set(["explosive", "poison", "canister", "power", "twohandedmelee", "blasterover30ft", "rangedblasterover30", "doubleweapon", "versatileweapon", "dualmelee", "burstrapid"]);
    for (const am of cEff.attackDamageMods) {
      if (!matchesWeaponSource(am)) continue;
      const sc = String(am.scope || "").toLowerCase();
      if (sc === "burstrapid") {
        const hasBurst = hasFireMode("burst");
        const hasRapid = hasFireMode("rapid");
        if (hasBurst || hasRapid) {
          if (hasBurst) notes.push("Gunning Mastery: burst −" + prof + " DC for +" + prof + " damage");
          if (hasRapid) notes.push("Gunning Mastery: rapid −" + prof + " DC for +" + (2 * prof) + " damage");
          notes.push("Gunning Mastery: pass burst/rapid save deals " + Math.max(0, damageAbilityMod) + " damage");
        }
        continue;
      }
      if (_skipGenericAmScopes.has(sc)) continue;
      if ((sc === "melee" && !melee) || (sc === "ranged" && !ranged)) continue;
      if (am.ability && normalizeName(am.ability) !== normalizeName(ability)) continue;
      if (am.weaponGroup && (!proficient || normalizeName(am.weaponGroup) !== normalizeName(wepGroup || ""))) continue;
      if (!am.condition && !am.oncePerRound && !am.oncePerTurn && Number.isFinite(am.attackBonus) && am.attackBonus !== 0) {
        toHit += am.attackBonus;
        if (item.toHitOverride == null) attackBreakdown.push({ label: am.sourceName || "Feature", value: am.attackBonus, source: am.source || (am.sourceName ? { name: am.sourceName } : null) });
      }
      if (!am.condition && !am.oncePerRound && !am.oncePerTurn && Number.isFinite(am.damageBonus) && am.damageBonus !== 0) {
        effWepDmgBonus += am.damageBonus;
        damageBreakdown.push({ label: am.sourceName || "Feature", value: am.damageBonus, source: am.source || (am.sourceName ? { name: am.sourceName } : null) });
      }
      if ((am.oncePerRound || am.oncePerTurn) && am.note) {
        const evalAtkNum = am.attackBonus != null
          ? Number(typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(String(am.attackBonus), profile, session) : am.attackBonus)
          : null;
        if (evalAtkNum === null || !Number.isFinite(evalAtkNum) || evalAtkNum > 0) {
          const noteTxt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(am.note, profile, session) : am.note;
          if (!notes.includes(noteTxt)) notes.push(noteTxt);
        }
      }
      if (am.addAbilityMod) {
        if (sc !== "twf" || (!twoHanded && !useTwoHands && (light || traits.twfIgnoreLight))) {
          notes.push(`${am.sourceName}: add ability modifier to Two-Weapon Fighting off-hand damage`);
        }
      }
      if (am.addAbilityModToHit) {
        if (sc !== "dwf" || Boolean(doubleProp)) {
          notes.push(`${am.sourceName}: add ability modifier to Double-Weapon Fighting bonus attack roll`);
        }
      }
      const _fmtVal = v => {
        if (v == null) return "";
        if (typeof v === "string" || typeof v === "number") return String(v);
        if (typeof v === "object") {
          const parts = [];
          const evalPB = expr => {
            if (typeof expr === "number" && Number.isFinite(expr)) return Math.abs(expr);
            const s = String(expr || "").trim();
            if (/^PB$/i.test(s)) return prof;
            const m = s.match(/^([\d.]+)\s*\*\s*PB$/i);
            if (m) return Math.floor(Number(m[1]) * prof);
            const n = Number(s);
            return Number.isFinite(n) ? Math.abs(n) : s;
          };
          if (v.attackPenalty) parts.push("−" + evalPB(v.attackPenalty) + " attack");
          else if (v.attack) parts.push(String(v.attack) + " attack");
          if (v.damageBonus) parts.push("+" + evalPB(v.damageBonus) + " damage");
          else if (v.damage) parts.push(String(v.damage) + " damage");
          if (v.summary || v.text || v.label) parts.push(String(v.summary || v.text || v.label));
          return parts.join(" / ");
        }
        return "";
      };
      if (am.extraDamageFormula) notes.push(`${am.sourceName}: +${_fmtVal(am.extraDamageFormula)} damage`);
      if (am.viciousBonusOnMaxDie !== undefined && am.source?.kind !== "property") notes.push(`${am.sourceName}: +${am.viciousBonusOnMaxDie} on max damage die`);
      if (am.extraDice) { const ed = _fmtVal(am.extraDice); if (ed) notes.push(`${am.label || am.sourceName}: +${ed}`); }
      if (am.tradeoff && !(am.source?.kind === "property" && am.tradeoff.trigger)) {
        const tr = _fmtVal(am.tradeoff);
        if (tr) notes.push(am.sourceName + ": " + tr);
      }
      if (am.condition) { const cd = _fmtVal(am.condition); if (cd) notes.push(`${am.sourceName}: ${cd}`); }
    }
    for (const wr of cEff.weaponRules) {
      if (wr.kind === "enhancedStrikes" || wr.kind === "naturalWeapon" || wr.kind === "unarmedDie") continue;
      if (!matchesWeaponSource(wr)) continue;
      if (wr.weaponGroup && normalizeName(wr.weaponGroup) !== normalizeName(wepGroup || "")) continue;
      if (wr.kind === "reach" && wr.params?.bonusFeet) {
        if (wr.weaponGroup) continue;
        if (melee) notes.push(`${wr.sourceName}: +${wr.params.bonusFeet} ft reach${wr.params.onYourTurnOnly ? " on your turn" : ""}`);
        continue;
      }
      if (wr.kind === "meleeDisadvantage") {
        if (melee) {
          meleeDisadv = true;
          notes.push(`${wr.sourceName}: ${wr.params?.name || "Melee attacks have disadvantage"}`);
        }
        continue;
      }
      if (wr.kind === "shiiChoPush") {
        notes.push("Shii-Cho: push 5 ft (Strength DC " + (8 + toHit) + ")");
        continue;
      }
      if (wr.kind === "djemSoStrBonus" && ability === "Strength") {
        const hf = Math.max(1, Math.floor(Math.max(modOf("Wisdom"), modOf("Charisma")) / 2));
        notes.push("Djem So: +" + hf + " to one Strength attack");
        continue;
      }
      if (wr.kind === "oneHanded" && proficient) {
        const baseStrNum = baseStrReq;
        const stepUp = Number(wr.params?.strengthStepUp || 1);
        const maxStr = Number(wr.params?.maxStrength || 21);
        const oneHandStr = baseStrNum ? Math.min(maxStr, baseStrNum + 2 * stepUp) : Number(wr.params?.strengthBase || 11);
        const unmet1H = scores.Strength < oneHandStr;
        notes.push(`${wr.sourceName}: 1H wield (Strength ${oneHandStr}${unmet1H ? " unmet" : ""}, normal range only)`);
        continue;
      }
      if (!wr.params?.name) continue;
      const label = wr.params.name;
      notes.push(`${wr.sourceName}: ${label}`);
    }
    for (const cm of cEff.critMods) {
      if (!matchesWeaponSource(cm)) continue;
      const csc = String(cm.scope || "").toLowerCase();
      if ((csc === "melee" && !melee) || (csc === "ranged" && !ranged)) continue;
      if (csc === "melee_dex" && !(melee && ability === "Dexterity")) continue;
      if (csc === "unarmed" && !/unarmed/i.test(item.name || "")) continue;
      if (csc === "burstrapid" && !hasSaveFireMode) continue;
      if (csc === "power" || csc === "canister" || csc === "explosive" || csc === "poison") continue;
      if (cm.weaponGroup && (!proficient || normalizeName(cm.weaponGroup) !== normalizeName(wepGroup || ""))) continue;
      if (Number.isFinite(cm.critMin) && cm.critMin < critMin) critMin = Math.max(16, cm.critMin);
      const delta = Number(cm.critRangeDelta);
      if (Number.isFinite(delta) && delta > 0 && cm.source?.kind !== "property") {
        critMin = Math.max(16, critMin - delta);
      }
      if (cm.source?.kind !== "property" && Number.isFinite(cm.brutalDice)) {
        critDice += cm.brutalDice;
        const label = cm.source?.kind === "class" && normalizeName(cm.sourceName) === "berserker" ? "Brutal Critical" : cm.sourceName;
        notes.push(label + ": +" + cm.brutalDice + (cm.brutalDice === 1 ? " crit die" : " crit dice"));
      }
      if (cm.doubleAbilityMod) notes.push(`${cm.sourceName}: double ability modifier on crit`);
      if (Array.isArray(cm.maxDamageOnSaveRoll)) {
        const hasOtherMaxOn1 = cEff.critMods.some(other => {
          if (other === cm || !Array.isArray(other.maxDamageOnSaveRoll) || !other.maxDamageOnSaveRoll.includes(1)) return false;
          if (!matchesWeaponSource(other)) return false;
          const osc = String(other.scope || "").toLowerCase();
          if (osc === "power" || osc === "canister" || osc === "explosive" || osc === "poison") return false;
          if ((osc === "melee" && !melee) || (osc === "ranged" && !ranged)) return false;
          if (osc === "burstrapid" && !hasSaveFireMode) return false;
          if (other.weaponGroup && (!proficient || normalizeName(other.weaponGroup) !== normalizeName(wepGroup || ""))) return false;
          return true;
        });
        const rolls = (hasOtherMaxOn1 && Array.isArray(cm.stackMaxDamageOnSaveRoll)) ? cm.stackMaxDamageOnSaveRoll : cm.maxDamageOnSaveRoll;
        notes.push(`${cm.sourceName}: max damage on natural ${rolls.join(" or ")} save`);
      }
      if (cm.burstLineOption && hasFireMode("burst")) {
        notes.push(`${cm.sourceName}: burst may spray a 20×5 ft line`);
      }
      if (cm.rapidDoubleOneSet && hasFireMode("rapid")) {
        notes.push(`${cm.sourceName}: rapid may double one damage die set`);
      }
    }
    if (critMin < 20) {
      const critIdx = notes.findIndex(n => /^Crit\s+\d+/.test(n));
      if (critIdx >= 0) notes[critIdx] = "Crit " + critMin + "–20";
      else notes.push("Crit " + critMin + "–20");
    }
    for (const rr of cEff.rerollRules) {
      if (rr.scope === "melee" && !melee) continue;
      if (rr.scope === "ranged" && !ranged) continue;
      if (!rr.scope || rr.scope === "attack" || rr.scope === "melee" || rr.scope === "ranged" || rr.scope === "d20") {
        if (Array.isArray(rr.abilities) && rr.abilities.length && !rr.abilities.some(a => normalizeName(a) === normalizeName(ability))) continue;
        notes.push(`${rr.sourceName}: reroll ${rr.trigger || "1s"}${rr.condition ? " (" + rr.condition + ")" : ""}`);
      }
    }
  }
  if (traits.powerAttacks.has("versatileWeapon")) {
    if (melee && (twoHanded || useTwoHands)) {
      notes.push("Versatile Mastery: hit forces Strength save DC " + (8 + toHit) + " (push 5 ft & step in)");
    } else if (melee && !twoHanded && !useTwoHands && !(session && equippedRule(session, "shield"))) {
      notes.push("Versatile Mastery: 1/turn pull target's shield (empty off-hand)");
    }
    if (proficient && versatile) {
      notes.push("Power: −" + prof + " attack / +" + (useTwoHands ? Math.floor(prof * 1.5) : prof) + " damage");
    }
  }
  return {
    name: item.name,
    toHit,
    dice, die,
    type: damageType,
    bonus: damageAbilityMod + (rule.flat || 0) + (item.damageBonus || 0) + rageBonus + heavyDmgBonus + stanceDmg + (effMods.attackDamageBonus || 0) + (effMods.weaponDamageBonus || 0) + effWepDmgBonus,
    modalModes, modalModeName, interlocking, detached, canGripTwoHands, hasFocus, hasSupremacy, wepGroup,
    switchSpec, switchActive, switchActiveType, strShort, defensiveAmount, recklessAmount, canChooseStrDex, heavyDmgBonus,
    weaponProperties, critDice,
    abilityMod,
    override: item.damageOverride || (isSpecialWeapon ? "Special" : null),
    melee, ranged, finesse, versatile, useTwoHands, twoHanded, light, thrown, thrownMode,
    reach, reload, doubleProp, proficient, ability,
    heavy,
    disadvantage: dexShort || strShort || meleeDisadv || undersizedBlocked || pintsizedBlocked,
    critMin,
    minRollPerDie,
    minRollTotal,
    minRollSource,
    minRollCondition,
    attackBreakdown,
    damageBreakdown,
    notes
  };
}

function damageNotation(stats) {
  if (stats.override) return String(stats.override);
  if (!stats.dice || !stats.die) return Math.max(1, stats.bonus) + " " + stats.type;
  const diceStr = (stats.minRollPerDie > 0 && !stats.minRollCondition)
    ? formatDiceWithMin(stats.dice, stats.die, stats.minRollPerDie)
    : (stats.dice + "d" + stats.die);
  return diceStr + (stats.bonus ? signed(stats.bonus) : "") + " " + stats.type;
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
  if (typeof _cachedFor === "function") return _cachedFor("armorStats", profile, session, () => _armorStatsUncached(profile, session));
  return _armorStatsUncached(profile, session);
}
function _armorStatsUncached(profile, session) {
  const armor = equippedRule(session, "armor");
  const shield = equippedRule(session, "shield");
  const scores = effectiveScores(profile, session);
  const sp = speciesRecord(profile?.species);
  const traits = characterTraits(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const rawDex = modifier(scores.Dexterity);
  const hasDexCap3 = typeof resolveDefenseEffects === "function" &&
    resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "dexCap3");
  const maxDexCap = Math.min(
    sp?.maxDexAC !== undefined ? sp.maxDexAC : Infinity,
    hasDexCap3 ? 3 : Infinity
  );
  const dex = Number.isFinite(maxDexCap) ? Math.min(rawDex, maxDexCap) : rawDex;
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
  const rawLimit = Number(armor?.ac?.match(/max (\d+)/i)?.[1] || Infinity);
  const limit = (armor?.armor === "Medium" && traits.armorExpertMedMastery && scores.Dexterity >= 16 && rawLimit === 2) ? 3 : rawLimit;
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
  const hasSpeciesACPrim = (sp?.effects || []).some(e => e.type === "acBonus" && !e.when && !e.condition);
  const speciesACBonus = hasSpeciesACPrim ? 0 : (sp?.acBonus || 0);
  const isLightShield = Boolean(shield && (/light/i.test(shield.name) || Number(shield.ac) === 1));
  const wieldingHeavyWeapon = (session?.equipped || []).some(item => {
    if (!item.equipped) return false;
    const { rule: wr } = activeWeaponRule(item);
    return wr?.category === "Weapon" && weaponPropertyProfile(wr.properties).heavy;
  });
  const armorProf = armorPropertyProfile(armor?.properties);
  const shieldProf = armorPropertyProfile(shield?.properties);
  const shieldItem = (session?.equipped || []).find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
  const shieldHasAnchor = shieldProf.anchor;
  const shieldAnchored = Boolean(shieldHasAnchor && shieldItem?.anchored);
  const shieldHasInterlocking = shieldProf.interlocking > 0;
  const shieldInterlockingVal = shieldProf.interlocking;
  const shieldInterlocked = Boolean(shieldHasInterlocking && shieldItem?.interlocked && !shieldAnchored);
  const interlockingAC = shieldInterlocked ? shieldInterlockingVal : 0;
  const shieldHasLambent = shieldProf.lambent;
  const shieldLambentActive = Boolean(shieldHasLambent && shieldItem?.lambentActive);
  const shieldHasImbalanced = shieldProf.imbalanced;
  const shieldImbalancedActive = Boolean(shieldHasImbalanced && (session?.effects || []).some(e => normalizeName(e.name) === "imbalanced shield"));
  const shieldVersProp = shieldProf.versatileProp;
  const shieldVersBonus = (shieldProf.versatile > 0 && shieldItem?.twoHanded && !shieldAnchored) ? shieldProf.versatile : 0;
  const anchorCoverAC = shieldAnchored ? (Number(shield?.ac) >= 3 ? 5 : Number(shield?.ac) >= 2 ? 3 : 2) : 0;
  const defACPre = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
  const _armTraits = defACPre?.combatTraits || [];
  const _hasUndersizedArm = _armTraits.some(ct => ct.kind === "undersized");
  const _hasPintsizedArm = _armTraits.some(ct => ct.kind === "pintsized");
  const _preShieldTier = !shield ? "" : ((Number(shield.ac) >= 3 || /heavy/i.test(shield.name)) ? "Heavy" : (Number(shield.ac) === 2 || /medium/i.test(shield.name)) ? "Medium" : "Light");
  const shieldSizeBlocked = Boolean(
    (_hasPintsizedArm && (_preShieldTier === "Medium" || _preShieldTier === "Heavy")) ||
    (_hasUndersizedArm && _preShieldTier === "Heavy")
  );
  const shieldSizeBlockedReason = !shieldSizeBlocked ? "" : (_hasPintsizedArm ? "Pintsized: cannot use medium or heavy shields" : "Undersized: cannot use heavy shields");
  const lightShieldSuppressed = Boolean(isLightShield && wieldingHeavyWeapon);
  const shieldBonus = (lightShieldSuppressed || shieldAnchored || shieldSizeBlocked || shieldImbalancedActive) ? 0 : ((Number(shield?.ac) || 0) + shieldVersBonus);
  const strengthShort = (rule, prof) => {
    if (!rule) return false;
    if (sp?.ignoreHeavyArmorStr && rule?.armor === "Heavy") return false;
    const minStr = prof ? prof.strengthMin : armorPropertyProfile(rule?.properties).strengthMin;
    return minStr > 0 && scores.Strength < minStr;
  };
  const shieldTier = !shield ? "" : ((Number(shield.ac) >= 3 || /heavy/i.test(shield.name)) ? "Heavy" : (Number(shield.ac) === 2 || /medium/i.test(shield.name)) ? "Medium" : "Light");
  const effArmProfs = new Set();
  if (typeof resolveProficiencyEffects === "function") {
    for (const ap of resolveProficiencyEffects(profile, session).armors) {
      const t = String(ap.target || "").toLowerCase();
      if (t.includes("all")) { effArmProfs.add("Light"); effArmProfs.add("Medium"); effArmProfs.add("Heavy"); effArmProfs.add("Shield"); }
      if (t.includes("light")) effArmProfs.add("Light");
      if (t.includes("medium")) effArmProfs.add("Medium");
      if (t.includes("heavy")) effArmProfs.add("Heavy");
      if (t.includes("shield")) effArmProfs.add("Shield");
    }
  }
  const nonproficient = Boolean(
    shieldSizeBlocked ||
    (armor && !traits.armorProficiencies.has(armor.armor) && !effArmProfs.has(armor.armor)) ||
    (shield && !traits.armorProficiencies.has(shieldTier) && !effArmProfs.has(shieldTier) && !effArmProfs.has("Shield"))
  );
  // Weapon Defensive (+X AC) & Reckless (-X AC) active stances
  let weaponStanceAC = 0;
  const stanceSources = [];
  for (const eq of (session?.equipped || []).filter(i => i.equipped)) {
    const { rule: wr } = activeWeaponRule(eq);
    if (wr?.category !== "Weapon") continue;
    const wProps = wr.properties || [];
    const defense = weaponDefenseEntry(session, eq, weaponPropertyProfile(wProps));
    if (defense) {
      const amount = defense.weaponDefense.amount;
      weaponStanceAC += amount;
      stanceSources.push(eq.name + " Defensive (+" + amount + ")");
    }
    const reckless = weaponRecklessEntry(session, eq, weaponPropertyProfile(wProps));
    if (reckless) {
      const amount = reckless.weaponReckless.amount;
      weaponStanceAC -= amount;
      stanceSources.push(eq.name + " Reckless (−" + amount + ")");
    }
  }
  const strSpeedPenalty = (strengthShort(armor, armorProf) || (!shieldAnchored && strengthShort(shield, shieldProf))) ? 10 : 0;
  const absorptive = armorProf.absorptive + shieldProf.absorptive;
  const spikedProp = shieldProf.spikedProp;
  const chargingMax = armorProf.chargingMax + shieldProf.chargingMax;
  const battlemindAC = (!armor && !shield && effMods.unarmoredACBonus) ? effMods.unarmoredACBonus : 0;
  const extraACSources = [...effMods.acSources, ...stanceSources];
  if (battlemindAC) extraACSources.push(effMods.unarmoredACBonusSource);
  if (anchorCoverAC) extraACSources.push("Anchor cover (+" + anchorCoverAC + ")");
  if (interlockingAC) extraACSources.push("Interlocking (+" + interlockingAC + ")");
  const defAC = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
  let primitiveACBonus = 0;
  if (defAC) {
    for (const ab of defAC.acBonuses) {
      if (!ab.condition) {
        primitiveACBonus += ab.value;
        extraACSources.push(`${ab.source} (${signed(ab.value)})`);
      }
    }
    for (const af of defAC.acFormulas) {
      if (Array.isArray(af.armorTiers) && af.armorTiers.length) {
        if (!armor || !af.armorTiers.includes(armor.armor) || !/Dex modifier/i.test(armor.ac || "")) continue;
        const altMods = (af.abilities || []).map(abName => modifier(scores[abName])).filter(Number.isFinite);
        if (!altMods.length) continue;
        const bestAlt = Math.min(Math.max(...altMods), limit);
        if (bestAlt > armorDex) {
          armorDex = bestAlt;
          extraACSources.push(`${af.label || af.source} (${(af.abilities || []).join("/")})`);
        }
        continue;
      }
      if (af.requiresUnarmored && armor && !(af.allowLightArmor && armor.armor === "Light")) continue;
      if (af.allowShield === false && shield) continue;
      let val = Number(af.base) || 10;
      for (const abName of af.abilities || []) {
        let m = modifier(scores[abName]);
        if (abName === "Dexterity" && Number.isFinite(af.maxDex)) m = Math.min(m, af.maxDex);
        val += m;
      }
      if (val > base + armorDex) {
        base = val;
        armorDex = 0;
        unarmoredLabel = af.label || af.source;
      }
    }
  }
  const manualACMod = Number(session?.statModifiers?.ac) || 0;
  if (manualACMod) extraACSources.push("Manual modifier (" + signed(manualACMod) + ")");
  let computed = (profile.acOverride ?? (base + armorDex + shieldBonus + speciesACBonus + (profile.acBonus || 0))) + effMods.acBonus + battlemindAC + weaponStanceAC + anchorCoverAC + interlockingAC + primitiveACBonus + manualACMod;
  if (effMods.minAC && computed < effMods.minAC) {
    computed = effMods.minAC;
    extraACSources.push(effMods.minACSource + " (min " + effMods.minAC + ")");
  }
  return {
    value: computed,
    armor, shield,
    unarmoredLabel,
    effectBonus: effMods.acBonus + weaponStanceAC,
    formulaParts: {
      base,
      armorDex,
      dex,
      dexLimit: limit,
      allowUnarmored,
      unarmoredAbility: allowUnarmored ? traits.unarmoredDefense : "",
      unarmoredExtra,
      shieldBonus,
      speciesACBonus,
      exportBonus: profile.acBonus || 0,
      acOverride: profile.acOverride,
      allEffectBonus: effMods.acBonus + battlemindAC + weaponStanceAC + anchorCoverAC + interlockingAC + primitiveACBonus,
      manualACMod,
      minAC: effMods.minAC || 0,
      minACSource: effMods.minACSource || ""
    },
    effectSources: extraACSources,
    speedPenalty: strSpeedPenalty,
    absorptive,
    lightShieldSuppressed, shieldSizeBlocked, shieldSizeBlockedReason, shieldHasAnchor, shieldAnchored, anchorCoverAC, shieldHasInterlocking, shieldInterlockingVal, shieldInterlocked, interlockingAC, shieldHasLambent, shieldLambentActive, shieldHasImbalanced, shieldImbalancedActive, shieldVersProp, shieldVersBonus, chargingMax,
    spikedProp,
    heavy: armor?.armor === "Heavy",
    nonproficient,
    stealth: Boolean(armor?.properties?.some(property => property.toLowerCase() === "bulky") && !(armor?.armor === "Medium" && traits.armorExpertMedMastery))
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
  const featSources = [...traits.featSpeedSources, ...(armorExpertBonus ? [(traits.armorExpertSource || "Armor Mastery") + " (+5 ft in light armor)"] : [])];
  const archWalkBonus = archetypePassiveSummary(profile, session).walkBonus || 0;
  const spdEff = typeof resolveDefenseEffects === "function" ? (resolveDefenseEffects(profile, session).speeds || []) : [];
  let effWalkBonus = 0;
  let effWalkBase = base;
  let effWalkMult = 1;
  const effAltModes = {};
  let effSlowedStep = passive.slowedStep;
  let standFromProneFeet = null;
  for (const se of spdEff) {
    if (Number.isFinite(se.slowedStep) && se.slowedStep > 0 && (!effSlowedStep || se.slowedStep < effSlowedStep)) {
      effSlowedStep = se.slowedStep;
    }
    if (Number.isFinite(se.standFromProneFeet) && se.standFromProneFeet > 0 && (!standFromProneFeet || se.standFromProneFeet < standFromProneFeet)) {
      standFromProneFeet = se.standFromProneFeet;
    }
    const mode = String(se.mode || "walk").toLowerCase();
    if (mode === "walk") {
      if (Number.isFinite(se.base)) effWalkBase = Math.max(effWalkBase, se.base);
      if (Number.isFinite(se.bonus)) effWalkBonus += se.bonus;
      if (Number.isFinite(se.multiplier) && se.multiplier >= 0) effWalkMult *= se.multiplier;
    } else if (["climb", "swim", "fly", "burrow", "crawl"].includes(mode)) {
      if (se.equalsWalk || se.base === "walk") effAltModes[mode] = "walk";
      else if (Number.isFinite(se.base)) effAltModes[mode] = Math.max(effAltModes[mode] || 0, se.base);
    }
  }
  const manualSpeedMod = Number(session?.statModifiers?.speed) || 0;
  const rawBase = Math.max(0, effWalkBase + unarmoredBonus + featBonus + (traits.classOptSpeedBonus || 0) + archWalkBonus + effMods.speedBonus + effWalkBonus + manualSpeedMod - armor.speedPenalty);
  const scaled = Math.floor(rawBase * effMods.speedMultiplier * effWalkMult);
  const carry = carryingStats(profile, session);
  const speedZeroedByEffect = effWalkMult === 0;
  let live = conditions ? movementSpeed(scaled, conditions, effSlowedStep) : scaled;
  if (speedZeroedByEffect || carry.overloaded) live = 0;
  else if (carry.overCapacity) live = Math.min(live, 5);
  else if (carry.heavilyEncumbered) live = Math.max(0, live - 20);
  else if (carry.encumbered) live = Math.max(0, live - 10);

  const mergedModes = {...passive.speeds, ...effAltModes, ...effMods.altSpeeds};
  const modes = {};
  const flyHalved = Boolean(sp?.speeds?.flyArmorHalved && armor.armor && (armor.armor.armor === "Medium" || armor.armor.armor === "Heavy"));
  for (const key of ["climb", "swim", "fly", "burrow", "crawl"]) {
    if (mergedModes[key] === "walk") modes[key] = live;
    else if (typeof mergedModes[key] === "number" && mergedModes[key] > 0) {
      const mScaled = Math.floor(mergedModes[key] * effMods.speedMultiplier);
      modes[key] = conditions ? movementSpeed(mScaled, conditions, effSlowedStep) : mScaled;
    }
    if (key === "fly" && flyHalved && modes.fly) {
      modes.fly = Math.floor(modes.fly / 2);
    }
    if (key === "fly" && effMods.flySpeedZero) {
      modes.fly = 0;
    }
    if (speedZeroedByEffect) {
      modes[key] = 0;
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
    manualMod: manualSpeedMod,
    slowedStep: effSlowedStep,
    standFromProneFeet,
    encumbered: carry.encumbered,
    heavilyEncumbered: carry.heavilyEncumbered,
    overCapacity: carry.overCapacity,
    overloaded: carry.overloaded,
    carry,
    modes,
    notes: [
      ...(effMods.tacticalNotes || []),
      ...((typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session).speeds : []).flatMap(sp => {
        const out = [];
        if (Number.isFinite(sp.jumpMultiplier) && sp.jumpMultiplier > 1) out.push(`${sp.source}: ×${sp.jumpMultiplier} jump distance`);
        if (sp.ignoreDifficultTerrain) out.push(`${sp.source}: ignore difficult terrain`);
        if (sp.note) out.push(`${sp.source}: ${sp.note}`);
        return out;
      }))
    ],
    live
  };
}

function baseMovementSpeed(profile, session) {
  return speedBreakdown(profile, session, null).live;
}

function hasEquippedFixedWeapon(session) {
  return (session?.equipped || []).some(item => {
    if (!item.equipped) return false;
    const { rule } = activeWeaponRule(item);
    return rule?.category === "Weapon" && Boolean(weaponPropertyProfile(rule.properties).fixed);
  });
}

function weaponHasFreeHand(session, releasingWeapon = null) {
  const shield = (session?.equipped || []).find(gear => gear.equipped && equipmentGroup(itemRule(gear.name, gear)) === "shield");
  let occupied = shield && !shield.anchored && !/generator/i.test(shield.name) ? (shield.twoHanded ? 2 : 1) : 0;
  for (const gear of session?.equipped || []) {
    if (!gear.equipped) continue;
    const { rule: active } = activeWeaponRule(gear);
    if (active?.category !== "Weapon") continue;
    const properties = weaponPropertyProfile(active.properties);
    if (properties.fixed?.occupiesHands === 0) continue;
    const twoHands = properties.twoHanded || gear.twoHanded === true ||
      (properties.doubleProp && !(gear.detached && properties.interlocking) && gear.twoHanded !== false && occupied === 0);
    occupied += twoHands && gear !== releasingWeapon ? 2 : 1;
    if (occupied >= 2) return false;
  }
  return true;
}

function canUseWeapon(session, item, profile = null) {
  const shield = equippedRule(session, "shield");
  const { rule: baseRule } = activeWeaponRule(item);
  const properties = baseRule?.properties || [];
  const wp = weaponPropertyProfile(properties);
  if (wp.fixed?.requiresFreeHand && !weaponHasFreeHand(session)) return false;
  if (!shield || /generator/i.test(shield.name)) return true;
  const hasIgnoreTwoHanded = Boolean(
    profile && typeof resolveCombatEffects === "function" &&
    resolveCombatEffects(profile, session).weaponRules.some(wr => wr.kind === "ignoreTwoHanded") &&
    baseRule && isWeaponProficient(profile, session, baseRule)
  );
  if (wp.twoHanded && !hasIgnoreTwoHanded) return false;
  if (profile && characterTraits(profile, session).ignoreObtrusiveShield) return true;
  return !armorPropertyProfile(shield.properties).obtrusive ||
    wp.lightWeapon;
}

function castingStats(profile, session) {
  if (typeof _cachedFor === "function") return _cachedFor("castingStats", profile, session, () => _castingStatsUncached(profile, session));
  return _castingStatsUncached(profile, session);
}
function _castingStatsUncached(profile, session) {
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
  // Techie Repair Droid is granted via unified grantPower effect in catalogs/feats.js.
  const granted = typeof resolveGrantedPowers === "function"
    ? resolveGrantedPowers(profile, session)
    : {force: [], tech: [], all: [], nonCountingSet: new Set(), byName: new Map()};
  for (const gp of granted.force) {
    if (!forcePowers.some(n => normalizeName(n) === normalizeName(gp.name))) forcePowers.push(gp.name);
  }
  for (const gp of granted.tech) {
    if (!techPowers.some(n => normalizeName(n) === normalizeName(gp.name))) techPowers.push(gp.name);
  }
  const nonCountingSet = new Set(granted.nonCountingSet || []);
  for (const ft of (session?.feats || [])) {
    if (ft && typeof ft === "object" && Array.isArray(ft.powersChoice)) {
      for (const pn of ft.powersChoice) {
        const nk = normalizeName(pn);
        if (nk) nonCountingSet.add(nk);
      }
    }
  }
  for (const cf of (profile?.customFeatures || [])) {
    const txt = String(cf?.content || "");
    if (!/(?:does not|doesn['’]t)s+counts+against/i.test(txt)) continue;
    const lowerTxt = txt.toLowerCase();
    for (const pn of [...forcePowers, ...techPowers]) {
      const pLower = String(pn || "").toLowerCase();
      if (pLower.length >= 3 && lowerTxt.includes(pLower)) nonCountingSet.add(normalizeName(pn));
    }
  }
  const forceKnownUsed = forcePowers.filter(n => !nonCountingSet.has(normalizeName(n))).length;
  const techKnownUsed = techPowers.filter(n => !nonCountingSet.has(normalizeName(n))).length;
  const forceBonusKnown = Math.max(0, forcePowers.length - forceKnownUsed);
  const techBonusKnown = Math.max(0, techPowers.length - techKnownUsed);

  let hasForceFeat = false;
  let hasTechFeat = false;
  let featMaxForceLevel = 0;
  let featMaxTechLevel = 0;
  const charLvlForFeats = Number(profile?.level || 1);
  for (const ft of (session?.feats || [])) {
    const fRule = typeof featRule === "function" ? featRule(typeof ft === "string" ? ft : ft?.name) : null;
    if (!fRule) continue;
    const cs = fRule.choiceSpec;
    const fKind = cs?.kind || fRule.mechanics?.choiceKind || "";
    const slots = Array.isArray(cs?.leveledSlots)
      ? cs.leveledSlots
      : (Array.isArray(fRule.mechanics?.leveledLevels)
        ? fRule.mechanics.leveledLevels
        : (fRule.mechanics?.leveledLevel ? [{ level: fRule.mechanics.leveledLevel, minLevel: 1 }] : []));
    if (fKind === "forcePowers" || fRule.mechanics?.unlocksForce) {
      hasForceFeat = true;
      for (const sl of slots) {
        if (charLvlForFeats >= (sl.minLevel || 1)) featMaxForceLevel = Math.max(featMaxForceLevel, Number(sl.level) || 0);
      }
    }
    if (fKind === "techPowers" || fRule.mechanics?.unlocksTech) {
      hasTechFeat = true;
      for (const sl of slots) {
        if (charLvlForFeats >= (sl.minLevel || 1)) featMaxTechLevel = Math.max(featMaxTechLevel, Number(sl.level) || 0);
      }
    }
  }
  const castEff = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : null;
  const forceUnlocks = (castEff?.castingUnlocks || []).filter(u => u.powerType === "force");
  const clsEntries = characterClasses(profile, session);
  const forceContributors = [];
  const techContributors = [];
  let hasHybridTechOnForce = false;
  let hasHybridForceOnTech = false;
  let hybridTechMaxLvl = 0;
  let hybridForceMaxLvl = 0;

  for (const entry of clsEntries) {
    const eCls = entry.record;
    const eArch = entry.archetypeRecord;
    const eLvl = entry.levels;
    const eStep = eCls?.levelChanges?.[String(Math.min(20, eLvl))] || {};
    const eArchStep = eArch ? _readArchetypeTableRow(eArch, eLvl) : {};
    const eArchCast = eArch?.mechanics?.casting || null;
    const eOverride = Boolean(eArchCast?.overrideTable);
    const eBaseMax = parseNumericStat(eStep["Max Power Level"]);
    const eArchMax = parseNumericStat(eArchStep["Max Power Level"]);
    const eClsPotMax = parseNumericStat(eCls?.levelChanges?.["20"]?.["Max Power Level"]) || Math.round((Number(eCls?.casterRatio) || 0) * 9);
    const eArchPotMax = parseNumericStat(eArch?.leveledTable?.["20"]?.["Max Power Level"]) || (eArch?.casterType && eArch.casterType !== "None" ? 4 : 0);

    // Hybrid casting archetypes (usesBasePoints: true, e.g., Way of Technology, Artificer Engineering, Aqinos Form, Inquisitor Technique, Path of Synthesis)
    if (eArchCast?.usesBasePoints) {
      if (eArchCast.type === "Tech") {
        hasHybridTechOnForce = true;
        hybridTechMaxLvl = Math.max(hybridTechMaxLvl, eBaseMax);
      } else if (eArchCast.type === "Force") {
        hasHybridForceOnTech = true;
        hybridForceMaxLvl = Math.max(hybridForceMaxLvl, eBaseMax);
      }
    }

    // Force casting contribution for this class/archetype
    const eIsBaseForce = eCls?.casterType === "Force";
    const eIsArchForce = !eArchCast?.usesBasePoints && (eArch?.casterType === "Force" || eArchCast?.type === "Force" || Boolean(eArchStep["Force Points"]));
    if (eIsBaseForce || eIsArchForce) {
      const pts = parseNumericStat((eOverride && eArchStep["Force Points"] !== undefined) ? eArchStep["Force Points"] : (eIsBaseForce ? eStep["Force Points"] : eArchStep["Force Points"]));
      const known = parseNumericStat((eOverride && eArchStep["Force Powers Known"] !== undefined) ? eArchStep["Force Powers Known"] : (eIsBaseForce ? eStep["Force Powers Known"] : eArchStep["Force Powers Known"]));
      const maxL = (eOverride && eArchMax > 0) ? eArchMax : (eIsBaseForce ? eBaseMax : eArchMax);
      const potMax = (eOverride && eArchPotMax > 0) ? eArchPotMax : (eIsBaseForce ? eClsPotMax : (eArchPotMax || 4));
      if (pts > 0 || known > 0 || maxL > 0) {
        forceContributors.push({ className: entry.name, levels: eLvl, points: pts, known, maxLvl: maxL, potentialMaxLvl: potMax || 4 });
      }
    }

    // Tech casting contribution for this class/archetype
    const eIsBaseTech = eCls?.casterType === "Tech";
    const eIsArchTech = !eArchCast?.usesBasePoints && (eArch?.casterType === "Tech" || eArchCast?.type === "Tech" || Boolean(eArchStep["Tech Points"]));
    if (eIsBaseTech || eIsArchTech) {
      const pts = parseNumericStat((eOverride && eArchStep["Tech Points"] !== undefined) ? eArchStep["Tech Points"] : (eIsBaseTech ? eStep["Tech Points"] : eArchStep["Tech Points"]));
      const known = parseNumericStat((eOverride && eArchStep["Tech Powers Known"] !== undefined) ? eArchStep["Tech Powers Known"] : (eIsBaseTech ? eStep["Tech Powers Known"] : eArchStep["Tech Powers Known"]));
      const maxL = (eOverride && eArchMax > 0) ? eArchMax : (eIsBaseTech ? eBaseMax : eArchMax);
      const potMax = (eOverride && eArchPotMax > 0) ? eArchPotMax : (eIsBaseTech ? eClsPotMax : (eArchPotMax || 4));
      if (pts > 0 || known > 0 || maxL > 0) {
        techContributors.push({ className: entry.name, levels: eLvl, points: pts, known, maxLvl: maxL, potentialMaxLvl: potMax || 4 });
      }
    }
  }

  const isForceClass = forceContributors.length > 0 || hasHybridForceOnTech;
  const isTechClass = techContributors.length > 0 || hasHybridTechOnForce;

  const forceBase = forceContributors.reduce((s, c) => s + c.points, 0);
  const techBase = techContributors.reduce((s, c) => s + c.points, 0);

  let unlockedForceKnown = 0;
  let unlockedForceMaxLvl = 0;
  for (const fu of forceUnlocks) {
    const baseK = Number.isFinite(Number(fu.baseKnown)) ? Number(fu.baseKnown) : 0;
    const schedK = Array.isArray(fu.knownSchedule) ? fu.knownSchedule.filter(req => (profile?.level || 1) >= req).length : 0;
    unlockedForceKnown = Math.max(unlockedForceKnown, baseK + schedK);
    if (fu.maxLevelSchedule && typeof fu.maxLevelSchedule === "object") {
      for (const [reqLvl, maxL] of Object.entries(fu.maxLevelSchedule)) {
        if ((profile?.level || 1) >= Number(reqLvl)) unlockedForceMaxLvl = Math.max(unlockedForceMaxLvl, Number(maxL) || 0);
      }
    }
  }
  const baseForceKnownCap = forceContributors.reduce((s, c) => s + c.known, 0);
  const forceKnownCap = Math.max(baseForceKnownCap, unlockedForceKnown);
  const techKnownCap = techContributors.reduce((s, c) => s + c.known, 0);
  const rawModOf = ab => modifier(scores[ab]);
  const wisMod = rawModOf("Wisdom");
  const chaMod = rawModOf("Charisma");
  const intMod = rawModOf("Intelligence");
  const fRep = castEff?.forceAbilityReplaces || {};
  let lightAbility = "Wisdom";
  let lightMod = wisMod;
  const lightOvAb = fRep.Wisdom || castEff?.forceAbilityOverride || "";
  if (lightOvAb && scores[lightOvAb] !== undefined) {
    const ovMod = rawModOf(lightOvAb);
    if (ovMod > lightMod) { lightMod = ovMod; lightAbility = lightOvAb; }
  }
  let darkAbility = "Charisma";
  let darkMod = chaMod;
  const darkOvAb = fRep.Charisma || castEff?.forceAbilityOverride || "";
  if (darkOvAb && scores[darkOvAb] !== undefined) {
    const ovMod = rawModOf(darkOvAb);
    if (ovMod > darkMod) { darkMod = ovMod; darkAbility = darkOvAb; }
  }
  const forceAbility = lightMod >= darkMod ? lightAbility : darkAbility;
  const forceMod = Math.max(lightMod, darkMod);
  const lightAtkMod = modOf(lightAbility);
  const darkAtkMod = modOf(darkAbility);
  const forceAtkMod = modOf(forceAbility);

  let techAbility = "Intelligence";
  let techMod = intMod;
  if (castEff?.techAbilityOverride && scores[castEff.techAbilityOverride] !== undefined) {
    const ovMod = rawModOf(castEff.techAbilityOverride);
    if (ovMod > techMod) { techMod = ovMod; techAbility = castEff.techAbilityOverride; }
  }
  const techAtkMod = modOf(techAbility);

  // SW5e Ch. 6: Sum Force/Tech points across classes, adding the casting ability modifier only once.
  const isBendu = classLevelOf(profile, "Consular") >= 3 && normalizeName(session?.forceAffinity) === "bendu";
  const forceMax = forceBase > 0 ? Math.max(1, forceBase + (isBendu ? (lightMod + darkMod) : forceMod)) : 0;
  const techMax = techBase > 0 ? Math.max(1, techBase + techMod) : 0;

  // SW5e Ch. 6 Multiclass Max Power Level:
  // Single casting class -> use that class's table Max Power Level.
  // >= 2 casting classes -> floor(sum(levels * (potentialMaxPowerLevel / 9))) -> table (1-2:1, 3-4:2, ..., 17-20:9).
  const _multiclassMaxPower = contributors => {
    if (!contributors.length) return { casterLevel: 0, maxLevel: 0 };
    if (contributors.length === 1) {
      return {
        casterLevel: Math.floor(contributors[0].levels * (contributors[0].potentialMaxLvl / 9) + 1e-9),
        maxLevel: contributors[0].maxLvl
      };
    }
    const effCL = Math.floor(contributors.reduce((s, c) => s + c.levels * (c.potentialMaxLvl / 9), 0) + 1e-9);
    const maxL = effCL <= 0 ? 0 : Math.min(9, Math.ceil(effCL / 2));
    return { casterLevel: effCL, maxLevel: maxL };
  };
  const forceMC = _multiclassMaxPower(forceContributors);
  const techMC = _multiclassMaxPower(techContributors);
  const baseMaxForceLevel = Math.max(forceMC.maxLevel, hybridForceMaxLvl);
  const maxForceLevel = Math.max(baseMaxForceLevel, unlockedForceMaxLvl, featMaxForceLevel);
  const baseMaxTechLevel = Math.max(techMC.maxLevel, hybridTechMaxLvl);
  const maxTechLevel = Math.max(baseMaxTechLevel, featMaxTechLevel);
  let mcExtraForce = 0;
  let mcExtraTech = 0;
  if (typeof resolveResourceEffects === "function") {
    const clsList = Array.isArray(profile?.classes) && profile.classes.length ? profile.classes : [{ name: profile?.className || "", levels: profile?.level || 1 }];
    for (const ms of resolveResourceEffects(profile, session).multiclassScales || []) {
      const otherLvls = clsList.filter(cl => normalizeName(cl.name) !== normalizeName(ms.targetClass)).reduce((s, cl) => s + Number(cl.levels || cl.level || 0), 0);
      if (Number.isFinite(ms.extraForcePointsPerLevel) && ms.extraForcePointsPerLevel > 0) {
        mcExtraForce += otherLvls * ms.extraForcePointsPerLevel;
      }
      if (Number.isFinite(ms.extraTechPointsPerTwoLevels) && ms.extraTechPointsPerTwoLevels > 0) {
        mcExtraTech += Math.floor(otherLvls / 2) * ms.extraTechPointsPerTwoLevels;
      }
    }
  }
  const effForceMax = forceMax + (castEff?.forceMaxBonus || 0) + mcExtraForce;
  const effTechMax = techMax + (castEff?.techMaxBonus || 0) + mcExtraTech;
  const baseDCBonus = characterTraits(profile, session).castingDCBonus || 0;
  const baseAtkBonus = characterTraits(profile, session).castingAttackBonus || 0;

  const fDCBonus = baseDCBonus + (castEff?.forceDCBonus || 0);
  const fAtkBonus = baseAtkBonus + (castEff?.forceAttackBonus || 0);
  const tDCBonus = baseDCBonus + (castEff?.techDCBonus || 0);
  const tAtkBonus = baseAtkBonus + (castEff?.techAttackBonus || 0);
  return {
    hasForce: forcePowers.length > 0 || effForceMax > 0 || hasForceFeat || forceUnlocks.length > 0,
    hasTech: techPowers.length > 0 || effTechMax > 0 || hasTechFeat,
    forceUsesFocusPoints: Boolean(forceUnlocks.some(u => u.usesFocusPoints) && !isForceClass),
    forcePowers,
    techPowers,
    forceGranted: granted.force,
    techGranted: granted.tech,
    forceKnownCap,
    techKnownCap,
    forceKnownUsed,
    techKnownUsed,
    forceBonusKnown,
    techBonusKnown,
    nonCountingPowerSet: nonCountingSet,
    techUsesForcePoints: Boolean(hasHybridTechOnForce && effForceMax > 0),
    forceUsesTechPoints: Boolean(hasHybridForceOnTech && effTechMax > 0),
    effectiveForceCasterLevel: forceMC.casterLevel,
    effectiveTechCasterLevel: techMC.casterLevel,
    forceKnownByClass: forceContributors.map(c => ({ className: c.className, levels: c.levels, knownCap: c.known, maxLevel: c.maxLvl })),
    techKnownByClass: techContributors.map(c => ({ className: c.className, levels: c.levels, knownCap: c.known, maxLevel: c.maxLvl })),
    forceMax: effForceMax,
    techMax: effTechMax,
    forceRemaining: Math.max(0, effForceMax - (session?.forceUsed || 0)),
    techRemaining: Math.max(0, effTechMax - (session?.techUsed || 0)),
    tempForce: Math.max(0, session?.tempForce || 0),
    tempTech: Math.max(0, session?.tempTech || 0),
    forceTotalRemaining: Math.max(0, effForceMax - (session?.forceUsed || 0)) + Math.max(0, session?.tempForce || 0),
    techTotalRemaining: Math.max(0, effTechMax - (session?.techUsed || 0)) + Math.max(0, session?.tempTech || 0),
    maxForceLevel,
    maxTechLevel,
    forceAbility,
    techAbility,
    forceMod,
    forceDC: 8 + profile.proficiency + forceMod + fDCBonus,
    forceAttack: profile.proficiency + forceAtkMod + fAtkBonus,
    techDC: 8 + profile.proficiency + techMod + tDCBonus,
    techAttack: profile.proficiency + techAtkMod + tAtkBonus,
    lightDC: 8 + profile.proficiency + lightMod + fDCBonus,
    lightAttack: profile.proficiency + lightAtkMod + fAtkBonus,
    lightAbility,
    darkDC: 8 + profile.proficiency + darkMod + fDCBonus,
    darkAttack: profile.proficiency + darkAtkMod + fAtkBonus,
    darkAbility,
    itemDCs: (castEff?.itemDCMods || []).map(m => ({
      source: m.sourceName,
      formula: m.dcFormula || "",
      dc: m.dcFormula ? (8 + profile.proficiency + modifier(scores.Intelligence || 10)) : null,
      note: m.note || ""
    })),
    castingRestrictions: castEff ? castEff.restrictions : [],
    castingNotes: castEff ? castEff.notes : []
  };
}

function highLevelCastingMinLevel(profile, session, casting = null) {
  // SW5e Ch. 6: High-Level Casting uses the rules for the casting class in which you have the most levels.
  const entries = characterClasses(profile, session);
  let best = null;
  for (const entry of entries) {
    const eCls = entry.record;
    const eArch = entry.archetypeRecord;
    const eArchCast = eArch?.mechanics?.casting || null;
    const eOverride = Boolean(eArchCast?.overrideTable);
    const eClsPot = parseNumericStat(eCls?.levelChanges?.["20"]?.["Max Power Level"]) || Math.round((Number(eCls?.casterRatio) || 0) * 9);
    const eArchPot = parseNumericStat(eArch?.leveledTable?.["20"]?.["Max Power Level"]) || (eArch?.casterType && eArch.casterType !== "None" ? 4 : 0);
    const hasBaseCast = eCls?.casterType === "Force" || eCls?.casterType === "Tech";
    const hasArchCast = !eArchCast?.usesBasePoints && (eArch?.casterType === "Force" || eArch?.casterType === "Tech" || eArchCast?.type === "Force" || eArchCast?.type === "Tech");
    if (!hasBaseCast && !hasArchCast) continue;
    const potMax = (eOverride && eArchPot > 0) ? eArchPot : (hasBaseCast ? eClsPot : (eArchPot || 4));
    if (!best || entry.levels > best.levels || (entry.levels === best.levels && potMax > best.potMax)) {
      best = { levels: entry.levels, potMax };
    }
  }
  if (best) {
    if (best.potMax >= 9) return 6;
    if (best.potMax >= 7) return 5;
    if (best.potMax >= 4) return 4;
  }
  const cast = casting || castingStats(profile, session);
  if (Math.max(cast?.maxForceLevel || 0, cast?.maxTechLevel || 0) >= 4) return 4;
  return 6;
}

function characterResources(profile, session) {
  const list = [];
  const _baseResKey = s => normalizeName(String(s || "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s*\([^)]*\)/g, ""));
  const _seenIds = new Set();
  const _seenLabels = new Set();
  const _seenBase = new Set();
  const _seenSources = new Set();
  const registerResource = (item, sourceName = "", opts = {}) => {
    if (!item || !item.id) return false;
    const nLbl = normalizeName(item.label || "");
    const bLbl = _baseResKey(item.label || "");
    const nSrc = normalizeName(sourceName || "");
    if (_seenIds.has(item.id) || (nLbl && _seenLabels.has(nLbl))) return false;
    if (!opts.allowSameSource && bLbl && _seenBase.has(bLbl)) return false;
    if (!opts.allowSameSource && nSrc && _seenSources.has(nSrc)) return false;
    if (!opts.allowSameSource && nLbl && [..._seenSources].some(sn => sn && nLbl.includes(sn))) return false;
    if (opts.allowSameSource && ((bLbl && _seenBase.has(bLbl)) || (nSrc && (_seenBase.has(nSrc) || _seenSources.has(nSrc))) || (nLbl && [..._seenSources].some(sn => sn && nLbl.includes(sn))))) return false;
    _seenIds.add(item.id);
    if (nLbl) _seenLabels.add(nLbl);
    if (!opts.allowSameSource) {
      if (bLbl) _seenBase.add(bLbl);
      if (nSrc) _seenSources.add(nSrc);
    }
    list.push(item);
    return true;
  };
  const step = classLevelStep(profile);
  const scores = effectiveScores(profile, session);
  const traits = characterTraits(profile, session);
  const casting = castingStats(profile, session);

  const effRageMax = effectiveRageStats(profile, session).rageMax;
  if (effRageMax && effRageMax < 99) {
    list.push({
      id: "rage",
      label: "Rage",
      value: Math.max(0, effRageMax - (session.spent.rage || 0)),
      max: effRageMax,
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
  const hlcMin = highLevelCastingMinLevel(profile, session, casting);
  if (hlcMin > 0 && maxPowerLevel >= hlcMin) {
    for (let lvl = hlcMin; lvl <= Math.min(9, maxPowerLevel); lvl++) {
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
  const consularLvl = classLevelOf(profile, "Consular");
  if (consularLvl > 0) {
    list.push({
      id: "forceRecovery",
      label: "Force Recovery",
      value: Math.max(0, 1 - (session.spent.forceRecovery || 0)),
      max: 1,
      resetOn: "long"
    });
    if (consularLvl >= 2) {
      const shieldMax = 2 + [5, 9, 13, 17].filter(req => consularLvl >= req).length;
      list.push({
        id: "forceShield",
        label: "Force Shield",
        value: Math.max(0, shieldMax - (session.spent.forceShield || 0)),
        max: shieldMax,
        resetOn: "long"
      });
    }
    if (consularLvl >= 20 && session.signaturePower) {
      list.push({
        id: "signaturePower",
        label: "Signature Power (" + session.signaturePower + ")",
        value: Math.max(0, 1 - (session.spent.signaturePower || 0)),
        max: 1,
        resetOn: "short"
      });
    }
  }
  if (traits.isGuardian) {
    const cfLvl = multiclassScaledLevel(profile, session, "Guardian", "Channel the Force");
    const cfMax = 2 + [5, 9, 13, 17].filter(req => cfLvl >= req).length;
    list.push({
      id: "channelForce",
      label: "Channel the Force",
      value: Math.max(0, cfMax - (session.spent.channelForce || 0)),
      max: cfMax,
      resetOn: "short"
    });
  }
  const fighterLvl = classLevelOf(profile, "Fighter");
  if (fighterLvl > 0) {
    list.push({
      id: "secondWind",
      label: "Second Wind",
      value: Math.max(0, 1 - (session.spent.secondWind || 0)),
      max: 1,
      resetOn: "short"
    });
    if (fighterLvl >= 2) {
      const surgeMax = fighterLvl >= 17 ? 2 : 1;
      list.push({
        id: "actionSurge",
        label: "Action Surge",
        value: Math.max(0, surgeMax - (session.spent.actionSurge || 0)),
        max: surgeMax,
        resetOn: "short"
      });
    }
    if (fighterLvl >= 9) {
      const indMax = fighterLvl >= 17 ? 3 : fighterLvl >= 13 ? 2 : 1;
      list.push({
        id: "indomitable",
        label: "Indomitable",
        value: Math.max(0, indMax - (session.spent.indomitable || 0)),
        max: indMax,
        resetOn: "long"
      });
    }
  }
  const scholarLvl = classLevelOf(profile, "Scholar");
  if (scholarLvl >= 2) {
    list.push({
      id: "sageAdvice",
      label: "Sage Advice",
      value: Math.max(0, 1 - (session.spent.sageAdvice || 0)),
      max: 1,
      resetOn: scholarLvl >= 13 ? "short" : "long"
    });
  }
  const sup = superiorityStats(profile, session);
  if (sup.qty > 0) {
    list.push({
      id: "superiority",
      label: "Superiority Dice" + (sup.size ? " · " + (sup.minRollThreshold > 0 ? formatDieWithMin(sup.size, sup.minRollThreshold) : sup.size) : ""),
      value: sup.remaining,
      max: sup.qty,
      resetOn: "short"
    });
  }
  if (sup.freeD4Max > 0) {
    const chosenFreeD4 = session.combatOptionChoices?.["Superiority Mastery: Free d4 Maneuver"]?.[0] || "";
    list.push({
      id: "superiorityMasteryD4",
      label: chosenFreeD4 ? ("Superiority Mastery (d4 · " + chosenFreeD4 + ")") : "Superiority Mastery (d4)",
      value: Math.max(0, sup.freeD4Max - (session.spent.superiorityMasteryD4 || 0)),
      max: sup.freeD4Max,
      resetOn: "long"
    });
  }
  if (traits.isEngineer || step["Potent Aptitude"]) {
    const paLvl = traits.isEngineer ? multiclassScaledLevel(profile, session, "Engineer", "Potent Aptitude") : (profile.level || 1);
    const paStep = traits.isEngineer && paLvl > 0 ? (classRecord("Engineer")?.levelChanges?.[String(Math.min(20, paLvl))] || step) : step;
    const paMax = 2 + [5, 9, 13, 17].filter(req => paLvl >= req).length;
    list.push({
      id: "potentAptitude",
      label: "Potent Aptitude (" + (paStep["Potent Aptitude"] || step["Potent Aptitude"] || "d4") + ")",
      value: Math.max(0, paMax - (session.spent.potentAptitude || 0)),
      max: paMax,
      resetOn: "short"
    });
  }
  const operativeLvl = classLevelOf(profile, "Operative");
  if (operativeLvl >= 3) {
    list.push({
      id: "badFeeling",
      label: "Bad Feeling",
      value: Math.max(0, 1 - (session.spent.badFeeling || 0)),
      max: 1,
      resetOn: "long"
    });
  }
  if (operativeLvl >= 20) {
    list.push({
      id: "strokeOfLuck",
      label: "Stroke of Luck",
      value: Math.max(0, 1 - (session.spent.strokeOfLuck || 0)),
      max: 1,
      resetOn: "short"
    });
  }
  if (scholarLvl >= 14) {
    const ccMax = scholarLvl >= 17 ? 6 : 5;
    list.push({
      id: "calmAndCollected",
      label: "Calm and Collected",
      value: Math.max(0, ccMax - (session.spent.calmAndCollected || 0)),
      max: ccMax,
      resetOn: "long"
    });
  }
  // Class Improvement resource pools are emitted via SW5E_CLASS_IMPROVEMENTS resourcePool effects
  const monkResStep = classLevelStepFor(profile, "Monk");
  const baseFocusMax = parseNumericStat(monkResStep["Focus Points"]);
  const focusPoolModBonus = typeof resolveCastingEffects === "function" ? (resolveCastingEffects(profile, session).focusMaxBonus || 0) : 0;
  const focusExtra = baseFocusMax > 0
    ? (focusPoolModBonus > 0 ? focusPoolModBonus : (traits.focusMaxHalfForceMod ? Math.max(1, Math.floor(Math.max(modifier(scores.Wisdom), modifier(scores.Charisma)) / 2)) : 0))
    : 0;
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
  const sentinelResStep = classLevelStepFor(profile, "Sentinel");
  const idealMax = parseNumericStat(sentinelResStep["Ideal Manifests"]);
  if (traits.isSentinel && idealMax > 0) {
    list.push({
      id: "idealManifests",
      label: "Ideal Manifests",
      value: Math.max(0, idealMax - (session.spent.idealManifests || 0)),
      max: idealMax,
      resetOn: "long"
    });
  }
  // Techie Repair Droid free cast is tracked via unified grantPower (gpFree:repair droid).
  const seenFeatRes = new Set();
  for (const ft of (session?.feats || [])) {
    const rec = featRule(ft.name);
    const ca = rec?.combatAction;
    if (!ca?.uses) continue;
    if ((rec?.effects || []).filter(e => e.type === "resourcePool").length >= 2) continue;
    const featKey = normalizeName(rec.name);
    if (seenFeatRes.has(featKey)) continue;
    seenFeatRes.add(featKey);
    const key = "featAct:" + featKey;
    list.push({
      id: key,
      label: rec.name + " (Feat)",
      value: Math.max(0, ca.uses - (session.spent[key] || 0)),
      max: ca.uses,
      resetOn: ca.resetOn || "short"
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
  // Charging pool is registered via effect-engine resourcePool (id: armor_charging)
  const _gpFreeNormNames = new Set(
    typeof resolveGrantedPowers === "function"
      ? resolveGrantedPowers(profile, session).all.filter(g => g.freeCasts > 0).map(g => normalizeName(g.name))
      : []
  );
  const archMech = archetypeMechanics(profile, session);
  const archLabel = archetypeRecord(session?.approach, profile?.className)?.name || session?.approach || "Archetype";
  for (const act of (archMech?.actions || [])) {
    if (act.minLevel && (profile?.level || 1) < act.minLevel) continue;
    const maxU = archetypeActionMaxUses(act, profile, session);
    if (maxU <= 0) continue;
    const actNorm = normalizeName(act.name + " " + (act.summary || ""));
    if ([..._gpFreeNormNames].some(pn => pn && actNorm.includes(pn))) continue;
    const key = "archAct:" + normalizeName(act.name);
    list.push({
      id: key,
      label: act.resourceLabel || act.name,
      value: Math.max(0, maxU - (session.spent[key] || 0)),
      max: maxU,
      resetOn: act.resetOn || "long"
    });
  }
  // Index all legacy resources into the canonical registry before effect & primitive registration
  for (const r of list) {
    _seenIds.add(r.id);
    const nLbl = normalizeName(r.label || "");
    const bLbl = _baseResKey(r.label || "");
    if (nLbl) _seenLabels.add(nLbl);
    if (bLbl) _seenBase.add(bLbl);
  }
  // Structurally promote resources created by active powers & effects into the Resources panel
  for (const eff of (session?.effects || [])) {
    if (eff && Number(eff.chargesMax) > 0) {
      const rawCh = String(eff.chargeLabel || "").trim();
      const isDupLabel = !rawCh || normalizeName(rawCh) === normalizeName(eff.name) || normalizeName(eff.name).includes(normalizeName(rawCh));
      const chLabel = isDupLabel ? "" : (" · " + rawCh);
      registerResource({
        id: "effCharge:" + eff.id,
        label: eff.name + chLabel,
        value: clamp(Number(eff.charges) || 0, 0, Number(eff.chargesMax)),
        max: Number(eff.chargesMax),
        resetOn: "effect",
        effectId: eff.id,
        perTurnCharges: Boolean(eff.perTurnCharges)
      }, eff.name);
    }
  }
  const hdNow = hitDiceState(profile, session);
  if (hdNow.isMultiDie) {
    for (const pool of hdNow.pools) {
      registerResource({
        id: "hitDice:" + pool.key,
        label: "Hit Dice · " + pool.key,
        value: pool.current,
        max: pool.max,
        resetOn: "long-half",
        isHitDiePool: true
      }, "hitDice:" + pool.key, { allowSameSource: true });
    }
  } else {
    registerResource({
      id: "hitDice",
      label: "Hit Dice · d" + (hdNow.pools[0]?.die || profile.hitDie || 8),
      value: hdNow.totalCurrent,
      max: hdNow.totalMax || profile.level,
      resetOn: "long-half"
    });
  }
  if (typeof resolveGrantedPowers === "function") {
    for (const gp of resolveGrantedPowers(profile, session).all) {
      if (!(gp.freeCasts > 0)) continue;
      const gpId = "gpFree:" + normalizeName(gp.name);
      registerResource({
        id: gpId,
        label: gp.name + " (Free Cast)",
        value: Math.max(0, gp.freeCasts - (session?.spent?.[gpId] || 0)),
        max: gp.freeCasts,
        resetOn: gp.recharge || "long"
      }, gp.sourceName || gp.name, { allowSameSource: true });
    }
  }
  if (typeof resolveResourceEffects === "function") {
    for (const pool of resolveResourceEffects(profile, session).pools) {
      const pid = pool.id || ("eff_" + normalizeName(pool.name || "pool"));
      const lbl = pool.name || pool.source?.name || "Feature";
      const evaluatedMax = evaluateResourceMax(pool.max, profile, scores, casting, pool.min);
      let maxVal = Number.isFinite(evaluatedMax) ? evaluatedMax : 1;
      if (maxVal <= 0) continue;
      registerResource({
        id: pid,
        label: lbl,
        value: Math.max(0, maxVal - (session?.spent?.[pid] !== undefined ? session.spent[pid] : (pid === "power_surge" ? Math.max(0, maxVal - 1) : (pid === "armor_charging" || pool.recharge === "trigger" ? maxVal : 0)))),
        max: maxVal,
        note: pool.rechargeNote || "",
        resetOn: pool.recharge || "long"
      }, pool.source?.name || "", { allowSameSource: true });
    }
  }
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

function skillProvenanceSources(profile, session, skillName, rank) {
  if (!rank) return [];
  const items = [];
  const bg = backgroundRecord(profile?.background);
  if (bg && (bg.skills || []).some(s => normalizeName(s) === normalizeName(skillName))) {
    items.push({ label: bg.name + " (Background)", source: { kind: "background", name: bg.name } });
  }
  const cls = classRecord(profile?.className);
  if (cls) {
    const list = cls.skillChoicesList || [];
    if (list.some(s => normalizeName(s) === "any") || list.some(s => normalizeName(s) === normalizeName(skillName))) {
      items.push({ label: cls.name + " (Class)", source: { kind: "class", name: cls.name } });
    }
  }
  const sp = speciesRecord(profile?.species);
  if (sp && (sp.skills || []).some(s => normalizeName(s) === "any" || normalizeName(s) === normalizeName(skillName))) {
    items.push({ label: sp.name + " (Species)", source: { kind: "species", name: sp.name } });
  }
  const arch = archetypeRecord(session?.approach, profile?.className);
  if (arch && textGrantsSkill(arch.rules, skillName)) {
    items.push({ label: arch.name + " (Archetype)", source: { kind: "archetype", name: arch.name, className: profile?.className || "" } });
  }
  for (const feat of session?.feats || []) {
    const rule = featRule(feat.name);
    const hasSkillEffect = (rule?.effects || []).some(ef => ef.type === "proficiency" && ef.kind === "skill" && (normalizeName(ef.target) === normalizeName(skillName) || normalizeName(ef.target) === "$choice" && normalizeName(feat.choice) === normalizeName(skillName)));
    if (hasSkillEffect || (rule?.mechanics?.skillGrant && normalizeName(rule.mechanics.skillGrant) === normalizeName(skillName))) {
      items.push({ label: (rule?.name || feat.name) + " (Feat)", source: { kind: "feat", name: rule?.name || feat.name } });
    }
  }
  return items;
}

/* Universal SW5e Prerequisite Enforcement Engine */
function checkClassOptionPrerequisite(profile, session, opt) {
  const raw = String(opt?.prerequisite || "").trim();
  const minLvl = Number.isFinite(Number(opt?.minLevel)) && Number(opt.minLevel) > 0 ? Number(opt.minLevel) : 0;
  const reasons = [];
  const levelMatch = raw.match(/(\d+)(?:st|nd|rd|th)\s+level/i);
  const reqLvl = minLvl || (levelMatch ? Number(levelMatch[1]) : 0);
  const optOwnerLvl = (opt?.className && classLevelOf(profile, opt.className) > 0)
    ? classLevelOf(profile, opt.className)
    : (profile?.level || 1);
  if (reqLvl > 0 && optOwnerLvl < reqLvl) {
    reasons.push("Requires Level " + reqLvl);
  }
  if (raw) {
    const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
    for (const part of parts) {
      if (/^\d+(?:st|nd|rd|th)\s+level$/i.test(part)) continue;
      const owned = (session?.classOptions || []).some(n => normalizeName(n) === normalizeName(part));
      if (!owned) reasons.push("Requires " + part);
    }
  }
  const grantsForce = Boolean(
    opt?.choiceSpec?.kind === "forcePowers" ||
    (opt?.effects || []).some(e => e.type === "grantPower" && normalizeName(e.powerType) === "force")
  );
  const grantsTech = Boolean(
    opt?.choiceSpec?.kind === "techPowerLevel1" ||
    opt?.choiceSpec?.kind === "techPowers" ||
    (opt?.effects || []).some(e => e.type === "grantPower" && normalizeName(e.powerType) === "tech")
  );
  if (grantsForce || grantsTech) {
    const castEff = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : { restrictions: [] };
    const permForceIns = (castEff.restrictions || []).find(r => r.kind === "forceInsensitive");
    const permTechIns = (castEff.restrictions || []).find(r => r.kind === "techInsensitive");
    if (grantsForce && permForceIns) {
      reasons.push("Blocked by " + (permForceIns.source || "Force-Insensitive") + " (Force-Insensitive)");
    }
    if (grantsTech && permTechIns) {
      reasons.push("Blocked by " + (permTechIns.source || "Tech-Insensitive") + " (Tech-Insensitive)");
    }
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
    const lightStrat = typeof resolveDefenseEffects === "function" && (resolveDefenseEffects(profile, session).combatTraits || []).some(ct => ct.kind === "unlocksLightsaberForms");
    const isForceInsensitive = Boolean((casting.castingRestrictions || []).some(r => r.kind === "forceInsensitive"));
    if ((!casting.hasForce || isForceInsensitive) && !(lightStrat && /formfighting/i.test(entry?.name || ""))) {
      reasons.push(isForceInsensitive ? "Blocked by Force-Insensitive" : "Requires forcecasting");
    }
  } else if (/^The ability to cast tech powers$/i.test(raw)) {
    const isTechInsensitive = Boolean((casting.castingRestrictions || []).some(r => r.kind === "techInsensitive"));
    if (!casting.hasTech || isTechInsensitive) reasons.push(isTechInsensitive ? "Blocked by Tech-Impaired" : "Requires techcasting");
  } else if (/\bmaneuver$/i.test(raw)) {
    let reqName = raw.replace(/\s+maneuver$/i, "").trim();
    if (normalizeName(reqName) === normalizeName(entry?.name)) {
      reqName = reqName.replace(/\s*\((?:Improved|Greater)\)$/i, "").trim();
    }
    const hasManeuver = (session?.maneuvers || []).some(m => normalizeName(m) === normalizeName(reqName));
    if (!hasManeuver) reasons.push("Requires " + reqName);
  } else if (/^Companion$/i.test(raw)) {
    const hasComp = hasFeat(session, "Companion Keeper")
      || /companion|astrotech|beastmaster|turret/i.test(session?.approach || "")
      || (typeof resolveCombatEffects === "function" && resolveCombatEffects(profile, session).companionGrants.length > 0);
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
  const defEff = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : { biologyRules: [], combatTraits: [] };
  const castEff = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : { restrictions: [] };
  const isSpeciesDroid = Boolean(sp?.traits?.some(t => t.name === "Type" && /droid/i.test(t.description)) || /^droid/i.test(profile?.species || ""));
  const hasDroidBiology = (defEff.biologyRules || []).some(b => b.kind === "droid");
  const isDroid = isSpeciesDroid || hasDroidBiology;
  const noCybernetics = (defEff.combatTraits || []).some(ct => ct.kind === "noCybernetics");
  const isForceInsensitive = (castEff.restrictions || []).some(r => r.kind === "forceInsensitive");
  const hasPermForceInsensitive = (castEff.restrictions || []).some(r => r.kind === "forceInsensitive" && r.permanent);
  const isTechInsensitive = (castEff.restrictions || []).some(r => r.kind === "techInsensitive");
  const hasPermTechInsensitive = (castEff.restrictions || []).some(r => r.kind === "techInsensitive" && r.permanent);
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
      if (/^Type humanoid$/i.test(part)) {
        if (isSpeciesDroid) reasons.push("Requires humanoid species");
        continue;
      }
      if (/^Type beast or humanoid$/i.test(part)) {
        if (isSpeciesDroid) reasons.push("Requires beast or humanoid species");
        continue;
      }
      const castLvlM = part.match(/^The ability to cast (\d+)(?:st|nd|rd|th)-level (force|tech) powers$/i);
      if (castLvlM) {
        const reqLvl = Number(castLvlM[1]);
        const kind = castLvlM[2].toLowerCase();
        if (kind === "force" && isForceInsensitive) reasons.push("Blocked by Force-Insensitive");
        else if (kind === "tech" && isTechInsensitive) reasons.push("Blocked by Tech-Insensitive");
        else {
          const maxLvl = kind === "tech" ? casting.maxTechLevel : casting.maxForceLevel;
          if (maxLvl < reqLvl) reasons.push("Requires Level " + reqLvl + " " + kind + "casting");
        }
        continue;
      }
      if (/^the ability to cast force or tech powers$/i.test(part)) {
        const okForce = casting.hasForce && !isForceInsensitive;
        const okTech = casting.hasTech && !isTechInsensitive;
        if (!okForce && !okTech) reasons.push("Requires forcecasting or techcasting");
        continue;
      }
      if (/^The ability to cast force powers$/i.test(part)) {
        if (isForceInsensitive) reasons.push("Blocked by Force-Insensitive");
        else if (!casting.hasForce) reasons.push("Requires forcecasting");
        continue;
      }
      if (/^The ability to cast tech powers$/i.test(part)) {
        if (isTechInsensitive) reasons.push("Blocked by Tech-Insensitive");
        else if (!casting.hasTech) reasons.push("Requires techcasting");
        continue;
      }
      const featM = part.match(/^(.+)\s+feat$/i);
      if (featM) {
        if (!hasFeat(session, featM[1].trim())) reasons.push("Requires " + featM[1].trim() + " feat");
        continue;
      }
    }
  }
  const grantsForce = Boolean(
    feat?.mechanics?.unlocksForce ||
    feat?.choiceSpec?.kind === "forcePowers" ||
    (feat?.effects || []).some(e => e.type === "grantPower" && e.powerType === "force")
  );
  const grantsTech = Boolean(
    feat?.mechanics?.unlocksTech ||
    feat?.choiceSpec?.kind === "techPowers" ||
    (feat?.effects || []).some(e => e.type === "grantPower" && e.powerType === "tech")
  );
  if (grantsForce && hasPermForceInsensitive) {
    const src = (castEff.restrictions || []).find(r => r.kind === "forceInsensitive" && r.permanent)?.source || "Force-Insensitive";
    reasons.push("Blocked by " + src + " (Force-Insensitive)");
  }
  if (grantsTech && hasPermTechInsensitive) {
    const src = (castEff.restrictions || []).find(r => r.kind === "techInsensitive" && r.permanent)?.source || "Tech-Insensitive";
    reasons.push("Blocked by " + src + " (Tech-Insensitive)");
  }
  if (feat?.requiresTargetKind === "cybernetics" && noCybernetics) {
    const src = (defEff.combatTraits || []).find(ct => ct.kind === "noCybernetics")?.source || "trait";
    reasons.push("Blocked by " + src + " (not a valid target for cybernetic augmentations)");
  }
  return {met: reasons.length === 0, reason: reasons.join(" · ")};
}

function attunementStats(profile, session = null) {
  const eff = typeof resolveAttunementEffects === "function"
    ? resolveAttunementEffects(profile, session)
    : { slotDelta: 0, modSlotDelta: 0, sources: [] };
  const base = 3;
  return {
    max: Math.max(0, base + (eff.slotDelta || 0)),
    modSlotDelta: eff.modSlotDelta || 0,
    sources: eff.sources || []
  };
}

function classLevelOf(profile, targetClass) {
  const classes = Array.isArray(profile?.classes) && profile.classes.length
    ? profile.classes
    : [{ name: profile?.className || "", levels: profile?.level || 1 }];
  const targetNorm = normalizeName(targetClass);
  return classes.filter(c => normalizeName(c.name) === targetNorm).reduce((s, c) => s + Number(c.levels || c.level || 0), 0);
}

function effectiveRageStats(profile, session) {
  const isBerserker = normalizeName(profile?.className) === "berserker" || classLevelOf(profile, "Berserker") > 0;
  if (!isBerserker) return { rageMax: profile?.rageMax || 0, rageDamage: profile?.rageDamage || 0 };
  const rLvl = multiclassScaledLevel(profile, session, "Berserker", "Rages");
  const dLvl = multiclassScaledLevel(profile, session, "Berserker", "Rage Damage");
  const bCls = classRecord("Berserker");
  const rStep = bCls?.levelChanges?.[String(Math.min(20, Math.max(1, rLvl)))] || {};
  const dStep = bCls?.levelChanges?.[String(Math.min(20, Math.max(1, dLvl)))] || {};
  const rageRaw = rStep["Rages"];
  const computedMax = rageRaw !== undefined
    ? (String(rageRaw).toLowerCase() === "unlimited" ? 99 : parseNumericStat(rageRaw))
    : (profile?.rageMax || 0);
  const computedDmg = dStep["Rage Damage"] !== undefined
    ? parseNumericStat(dStep["Rage Damage"])
    : (profile?.rageDamage || 0);
  return {
    rageMax: computedMax || profile?.rageMax || 0,
    rageDamage: computedDmg || profile?.rageDamage || 0
  };
}

function consularForceRecoveryAmount(profile, session, modOverride = null) {
  const mod = modOverride !== null ? modOverride : (() => {
    const scores = effectiveScores(profile, session);
    return Math.max(modifier(scores.Wisdom), modifier(scores.Charisma));
  })();
  const classes = Array.isArray(profile?.classes) && profile.classes.length
    ? profile.classes
    : [{ name: profile?.className || "", levels: profile?.level || 1 }];
  let consularLvl = 0;
  let otherLvl = 0;
  for (const cl of classes) {
    const lv = Number(cl.levels || cl.level || 0);
    if (normalizeName(cl.name) === "consular") consularLvl += lv;
    else otherLvl += lv;
  }
  if (!consularLvl) consularLvl = profile?.level || 1;
  const hasMc = typeof resolveResourceEffects === "function" && (resolveResourceEffects(profile, session).multiclassScales || []).some(
    ms => normalizeName(ms.targetClass) === "consular" && normalizeName(ms.targetFeature) === "force recovery"
  );
  return Math.max(1, Math.floor(consularLvl / 2) + (hasMc ? Math.floor(otherLvl / 2) : 0) + mod);
}

function multiclassScaledLevel(profile, session, targetClass, targetFeature = "") {
  const classes = Array.isArray(profile?.classes) && profile.classes.length
    ? profile.classes
    : [{ name: profile?.className || "", levels: profile?.level || 1 }];
  const targetNorm = normalizeName(targetClass);
  const featNorm = normalizeName(targetFeature);
  let baseLvl = 0;
  let otherLvl = 0;
  for (const cl of classes) {
    const lv = Number(cl.levels || cl.level || 0);
    if (normalizeName(cl.name) === targetNorm) baseLvl += lv;
    else otherLvl += lv;
  }
  let bonus = 0;
  if (typeof resolveResourceEffects === "function") {
    for (const ms of resolveResourceEffects(profile, session).multiclassScales || []) {
      if (normalizeName(ms.targetClass) !== targetNorm) continue;
      if (featNorm && ms.targetFeature && normalizeName(ms.targetFeature) !== featNorm) continue;
      const ratio = Number(ms.ratio);
      if (Number.isFinite(ratio) && ratio > 0) {
        bonus = Math.max(bonus, Math.floor(otherLvl * ratio));
      }
    }
  }
  return baseLvl + bonus;
}

function evaluateResourceMax(formula, profile, scores, casting, minFloor = 1) {
  if (typeof formula === "number" && Number.isFinite(formula)) return formula;
  const num = Number(formula);
  if (formula !== "" && formula !== null && formula !== undefined && Number.isFinite(num)) return num;
  const raw = String(formula || "").trim();
  if (!raw) return NaN;
  const s = raw.toLowerCase();
  if (s.includes("$param")) return 1; // parameterized item property (resolved at equip time)
  const pb = profile?.proficiency || 2;
  const lvl = profile?.level || 1;
  const sc = scores || (profile ? effectiveScores(profile, null) : { Strength: 10, Dexterity: 10, Constitution: 10, Intelligence: 10, Wisdom: 10, Charisma: 10 });
  const cast = casting || { techAbility: "Intelligence", forceAbility: "Wisdom" };
  const modMap = {
    str: modifier(sc.Strength), strength: modifier(sc.Strength),
    dex: modifier(sc.Dexterity), dexterity: modifier(sc.Dexterity),
    con: modifier(sc.Constitution), constitution: modifier(sc.Constitution),
    int: modifier(sc.Intelligence), intelligence: modifier(sc.Intelligence),
    wis: modifier(sc.Wisdom), wisdom: modifier(sc.Wisdom),
    cha: modifier(sc.Charisma), charisma: modifier(sc.Charisma),
    tech: modifier(sc[cast.techAbility || "Intelligence"]),
    force: modifier(sc[cast.forceAbility || "Wisdom"]),
    wisorcha: Math.max(modifier(sc.Wisdom), modifier(sc.Charisma), cast.hasForce && cast.forceAbility ? modifier(sc[cast.forceAbility]) : -Infinity),
    pb, proficiency: pb, level: lvl
  };
  const termVal = tok => {
    const t = tok.trim().replace(/_/g, " ");
    if (/^\d+$/.test(t)) return Number(t);
    if (/^ceil\((?:pb|proficiency)\/2\)$/.test(t)) return Math.ceil(pb / 2);
    if (/^(?:half|floor\((?:pb|proficiency)\/2\)|(?:pb|proficiency)\/2)$/.test(t)) return Math.floor(pb / 2);
    const mm = t.match(/^(str|strength|dex|dexterity|con|constitution|int|intelligence|wis|wisdom|cha|charisma|tech|force|wisorcha|pb|proficiency|level)(?:\s*mod)?$/);
    if (mm && mm[1] in modMap) return modMap[mm[1]];
    return NaN;
  };
  const tern = s.match(/^level\s*>=\s*(\d+)\s*\?\s*(\d+)\s*:\s*(\d+)$/);
  if (tern) return lvl >= Number(tern[1]) ? Number(tern[2]) : Number(tern[3]);
  const maxCall = s.match(/^max\(\s*(\d+)\s*,\s*(.+?)\s*\)$/);
  if (maxCall) {
    const inner = termVal(maxCall[2]);
    return Number.isFinite(inner) ? Math.max(Number(maxCall[1]), inner) : NaN;
  }
  const parts = s.split("+").map(termVal);
  if (!parts.every(Number.isFinite)) return NaN;
  const sum = parts.reduce((a, b) => a + b, 0);
  return Math.max(Number.isFinite(minFloor) ? minFloor : 1, sum);
}

function checkImprovementPrerequisite(profile, session, record, opts = null) {
  const prereq = String(record?.prerequisite || "").trim();
  if (!prereq || /^none$/i.test(prereq)) return { met: true, missing: [] };
  const classes = Array.isArray(profile?.classes) && profile.classes.length
    ? profile.classes
    : [{ name: profile?.className || "", levels: profile?.level || 1 }];
  const classLevelOf = clsName => {
    const target = normalizeName(clsName);
    return classes.filter(c => normalizeName(c.name) === target).reduce((s, c) => s + Number(c.levels || c.level || 0), 0);
  };
  const missing = [];
  const clauses = prereq.split(/,\s*(?:and\s+)?/i).map(x => x.trim()).filter(Boolean);
  for (const cl of clauses) {
    let m;
    if ((m = cl.match(/^at least (\d+) levels? in ([a-z]+)$/i))) {
      const need = Number(m[1]), cls = m[2];
      if (classLevelOf(cls) < need) missing.push(`Requires ${need}+ levels in ${cls}`);
    } else if ((m = cl.match(/^no levels? in ([a-z]+)$/i))) {
      const cls = m[1];
      if (classLevelOf(cls) > 0) missing.push(`Cannot have levels in ${cls}`);
    } else if (/ability to cast force powers/i.test(cl)) {
      let hasF = false;
      if (opts && Array.isArray(opts.collectedEffects)) {
        const effs = opts.collectedEffects;
        const removedFI = effs.some(e => e.type === "combatTrait" && e.kind === "removeForceInsensitive");
        const isFI = !removedFI && effs.some(e => e.type === "castingRestriction" && e.kind === "forceInsensitive");
        if (!isFI) {
          const arch = archetypeRecord(session?.approach, profile?.className);
          const fClasses = new Set(["consular", "guardian", "sentinel"]);
          const featList = Array.isArray(session?.feats) ? session.feats : (profile?.feats || []);
          hasF = Boolean(
            classes.some(c => fClasses.has(normalizeName(c.name)))
            || (arch && (/force/i.test(String(arch.casterType || "")) || /force/i.test(String(arch.castingType || "")) || Boolean(arch.levelChanges && Object.values(arch.levelChanges).some(st => st && st["Force Powers Known"]))))
            || (profile?.forcePowers?.length)
            || (profile?.customForcePowers?.length)
            || (Array.isArray(session?.powers) && session.powers.some(n => (powerRule(n)?.type || "Force") === "Force"))
            || effs.some(e => e.type === "grantPower" && normalizeName(e.powerType) === "force")
            || featList.some(f => { const fr = featRule(typeof f === "string" ? f : f?.name); return Boolean(fr?.choiceSpec?.kind === "forcePowers" || fr?.mechanics?.unlocksForce); })
          );
        }
      } else {
        hasF = Boolean(castingStats(profile, session).hasForce);
      }
      if (!hasF) missing.push("Requires ability to cast force powers");
    } else if (/ability to cast tech powers/i.test(cl)) {
      if (!castingStats(profile, session).hasTech) missing.push("Requires ability to cast tech powers");
    } else if ((m = cl.match(/^(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)\s+or\s+higher$/i))) {
      const ab = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
      const sc = effectiveScores(profile, session)[ab] || 10;
      if (sc < Number(m[2])) missing.push(`Requires ${ab} ${m[2]}+`);
    } else {
      missing.push(`Unparsed prerequisite: ${cl}`);
    }
  }
  return { met: missing.length === 0, missing };
}

function featBudgetStats(profile, session = null) {
  const hasClass = Boolean(profile?.className);
  const hasBg = Boolean(profile?.background);
  const hasBudget = hasClass || hasBg;
  const backgroundExpected = hasBg ? 1 : 0;
  let asiSlotsTotal = 0;
  const asiSlotsByClass = [];
  if (hasClass && typeof classRecord === "function") {
    for (const cEntry of characterClasses(profile, session)) {
      const cls = cEntry.record;
      const cLvl = Math.max(1, Number(cEntry.levels) || 1);
      let clsSlots = 0;
      if (cls?.levelChanges) {
        for (let i = 1; i <= cLvl; i++) {
          if (/Ability Score Improvement/i.test(String(cls.levelChanges[String(i)]?.Features || ""))) {
            clsSlots++;
          }
        }
      }
      asiSlotsTotal += clsSlots;
      if (clsSlots > 0) asiSlotsByClass.push({ className: cEntry.name, levels: cLvl, slots: clsSlots });
    }
  }
  const asiPicksCount = Math.max(0, Number(profile?.asiPicksCount) || 0);
  const advancementExpected = Math.max(0, asiSlotsTotal - asiPicksCount);
  const expected = backgroundExpected + advancementExpected;
  const feats = Array.isArray(session?.feats) ? session.feats : [];
  const bonusCount = feats.filter(f => normalizeName(f?.source) === "custom feat").length;
  const counted = Math.max(0, feats.length - bonusCount);
  return {
    hasBudget,
    counted,
    expected,
    bonusCount,
    totalOwned: feats.length,
    backgroundExpected,
    advancementExpected,
    asiSlotsTotal,
    asiSlotsByClass,
    asiPicksCount,
    delta: counted - expected
  };
}
