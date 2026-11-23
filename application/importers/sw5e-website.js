// Website-specific names, presentation fields and compatibility decisions live here.
const supportedBuilder = "0.7.6";
const noteResources = [["rage", "rage"], ["frenzy", "frenzy"], ["leap", "(?:jump|leap)"]];
const finiteOr = (value, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const finiteOrNull = value => typeof value === "number" && Number.isFinite(value) ? value : null;
const nonnegative = value => Math.max(0, Math.floor(finiteOr(value)));

function detectArchetype(className, baseClass, rawFeatures) {
  if (typeof baseClass?.archetype === "string" && baseClass.archetype.trim()) {
    const exact = archetypeRecord(baseClass.archetype, className);
    return exact ? exact.name : baseClass.archetype.trim();
  }
  if (typeof baseClass?.archetype?.name === "string" && baseClass.archetype.name.trim()) {
    const exact = archetypeRecord(baseClass.archetype.name, className);
    return exact ? exact.name : baseClass.archetype.name.trim();
  }
  if (!rawFeatures.length || typeof SW5E_ARCHETYPES === "undefined") return "";
  const candidates = SW5E_ARCHETYPES.filter(a => normalizeName(a.className) === normalizeName(className));
  const featureNames = new Set(rawFeatures.map(f => normalizeName(f.name)));
  const featureTexts = rawFeatures.map(f => (f.name + " " + f.content).toLowerCase()).join("\n");

  let bestName = "";
  let bestScore = 0;
  for (const arch of candidates) {
    let score = 0;
    if (featureTexts.includes(arch.name.toLowerCase())) score += 4;
    for (const heading of arch.features || []) {
      const h = normalizeName(heading);
      if (h.length < 4) continue;
      if (featureNames.has(h)) score += 3;
      else if ([...featureNames].some(fn => fn.includes(h) || h.includes(fn))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestName = arch.name;
    }
  }
  return bestScore >= 3 ? bestName : "";
}

function readWebsiteExport(raw, filename) {
  if (!raw || raw.builderVersion !== supportedBuilder || typeof raw.name !== "string" || !raw.name.trim()) {
    throw new Error("Choose a character JSON export from SW5e website builder " + supportedBuilder + ".");
  }
  if (!Array.isArray(raw.classes) || raw.classes.length === 0) {
    throw new Error("The export is missing class information.");
  }
  if (raw.classes.length > 1) {
    throw new Error("Multiclass exports are not supported yet. Choose a single-class character export.");
  }
  const baseClass = raw.classes[0];
  const level = baseClass?.levels;
  const cls = classRecord(baseClass?.name);
  if (!cls) {
    throw new Error("Unknown SW5e class: " + (baseClass?.name || "(none)") + ".");
  }
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error("Character level must be between 1 and 20.");
  }
  const sp = speciesRecord(raw.species?.name);
  if (!sp) {
    throw new Error("Unknown SW5e species: " + (raw.species?.name || "(none)") + ".");
  }

  const asiList = Array.isArray(baseClass.abilityScoreImprovements) ? baseClass.abilityScoreImprovements : [];
  const selectedFeats = [
    [raw.background?.feat, raw.background?.name || "Background"],
    ...(asiList.filter(entry => entry?.type === "Feat").map(entry => [entry, cls.name + " advancement"])),
    ...((raw.customFeats || []).map(entry => [entry, "Custom feat"]))
  ].filter(([entry]) => typeof entry?.name === "string" && entry.name.trim()).map(([entry, source]) => {
    const rule = featRule(entry.name);
    return {
      name: entry.name.trim(),
      source,
      rules: entry.content || "",
      abilityChoice: rule?.attributes?.length === 1 ? rule.attributes[0] : ""
    };
  });

  // Numeric Ability Score Improvements from class advancement
  const asiBonuses = {};
  for (const entry of asiList) {
    if (entry?.type === "Ability Score Improvement" && Array.isArray(entry.abilitiesIncreased)) {
      for (const inc of entry.abilitiesIncreased) {
        if (abilities.includes(inc?.name)) {
          asiBonuses[inc.name] = (asiBonuses[inc.name] || 0) + finiteOr(inc.value);
        }
      }
    }
  }

  // Species ASI: fixed single-ability species bonuses + explicit player choices in species.abilityScoreImprovement
  const baseScores = {};
  const scoreOverrides = {};
  const optionIdx = nonnegative(raw.species?.abilityScoreImprovementSelectedOption);
  const speciesOption = sp.abilitiesIncreased?.[optionIdx] || sp.abilitiesIncreased?.[0] || [];
  const selectedIncreases = raw.species?.abilityScoreImprovement || {};

  for (const ability of abilities) {
    const base = raw.baseAbilityScores?.[ability];
    if (!Number.isInteger(base) || base < 1 || base > 30) {
      throw new Error("The export is missing a valid " + ability + " score.");
    }
    const fixedSpeciesDelta = speciesOption
      .filter(entry => Array.isArray(entry.abilities) && entry.abilities.length === 1 && entry.abilities[0] === ability)
      .reduce((total, entry) => total + finiteOr(entry.amount), 0);
    const chosenSpeciesDelta = finiteOr(selectedIncreases[ability], 0);
    const tweakNode = raw.tweaks?.abilityScores?.[ability];
    const scoreTweak = tweakNode?.score || tweakNode;
    const tweakBonus = finiteOr(scoreTweak?.bonus, 0);
    baseScores[ability] = base + fixedSpeciesDelta + chosenSpeciesDelta + (asiBonuses[ability] || 0) + tweakBonus;
    scoreOverrides[ability] = finiteOrNull(scoreTweak?.override);
  }

  const rawFeatures = Array.isArray(raw.customFeatures)
    ? raw.customFeatures.filter(x => typeof x?.name === "string" && typeof x?.content === "string")
    : [];
  const findFeature = name => rawFeatures.find(entry => normalizeName(entry.name) === normalizeName(name));

  const suggestedApproach = detectArchetype(cls.name, baseClass, rawFeatures);
  const isBerserker = normalizeName(cls.name) === "berserker";
  const dewbackText = isBerserker ? (findFeature("Dewback's Instinct")?.content.toLowerCase() || "") : "";
  const dewback = [...new Set((dewbackText.match(/[a-z]+/g) || []).filter(name => name !== "true" && damageTypes.includes(name)))];
  const hasLeap = isBerserker && Boolean(findFeature("Fyrnock's Instinct"));

  const step = cls.levelChanges[String(level)] || {};
  const hpBonus = finiteOr(raw.tweaks?.hitPoints?.maximum?.bonus);
  const hpOverride = finiteOrNull(raw.tweaks?.hitPoints?.maximum?.override);
  const hpDice = cls.firstHP + Array.from({length: level - 1}, (_, i) =>
    finiteOr(baseClass.hitPoints?.[i], cls.averageHP)).reduce((sum, value) => sum + value, 0);
  const speciesHp = sp?.hpPerLevel ? level * sp.hpPerLevel : 0;
  const extraHpBonus = hpBonus === speciesHp ? 0 : hpBonus;

  const ownEquipment = (raw.equipment || []).filter(entry => typeof entry?.name === "string" && entry.name.trim()).map((entry, index) => ({
    id: "import-" + index,
    name: entry.name.trim(),
    quantity: nonnegative(entry.quantity) || 1,
    equipped: entry.equipped === true,
    damageBonus: finiteOr(entry.tweaks?.damage?.bonus),
    damageOverride: entry.tweaks?.damage?.override ?? null,
    attackBonus: finiteOr(entry.tweaks?.toHit?.bonus ?? entry.tweaks?.attack?.bonus),
    toHitOverride: finiteOrNull(entry.tweaks?.toHit?.override ?? entry.tweaks?.attack?.override)
  }));

  const customEquipment = (raw.customEquipment || []).filter(entry => typeof entry?.name === "string" && entry.name.trim()).map((entry, index) => ({
    id: "custom-item-" + index,
    name: entry.name.trim(),
    quantity: nonnegative(entry.quantity) || 1,
    equipped: entry.equipped === true,
    damageBonus: 0,
    damageOverride: null,
    attackBonus: 0,
    toHitOverride: null,
    customRule: {
      name: entry.name.trim(),
      category: entry.equipmentCategory || "Gear",
      cost: finiteOr(entry.cost),
      weight: finiteOr(entry.weight),
      description: entry.description || ""
    }
  }));
  const allEquipment = [...ownEquipment, ...customEquipment];

  const baseTraining = {};
  const explicitTraining = {};
  for (const [name, ability] of Object.entries(skills)) {
    const rank = raw.tweaks?.abilityScores?.[ability]?.skills?.[name]?.proficiency;
    if (rank !== undefined) explicitTraining[name] = rank;
    baseTraining[name] = rank === "Expertise" ? 2 : rank === "Proficient" ? 1 : 0;
  }

  const characteristics = {};
  if (raw.characteristics && typeof raw.characteristics === "object") {
    for (const [k, v] of Object.entries(raw.characteristics)) {
      if (typeof v === "string" && v.trim()) characteristics[k] = v.trim();
    }
  }

  const bgRec = backgroundRecord(raw.background?.name);
  const backgroundFeature = bgRec?.featureName
    ? {name: bgRec.featureName, text: bgRec.featureText}
    : (raw.background?.feature ? {name: raw.background.feature, text: ""} : null);

  const acTweak = raw.tweaks?.armorClass;
  const initTweak = raw.tweaks?.initiative;
  const unarmedRaw = raw.tweaks?.unarmed;
  const unarmedTweak = unarmedRaw ? {
    dieSize: nonnegative(unarmedRaw.damageDice?.dieSize),
    toHitBonus: finiteOr(unarmedRaw.toHit?.bonus),
    toHitOverride: finiteOrNull(unarmedRaw.toHit?.override),
    damageBonus: finiteOr(unarmedRaw.damage?.bonus),
    damageOverride: unarmedRaw.damage?.override ?? null
  } : null;

  const extraAttackLevels = Object.entries(cls.levelChanges)
    .filter(([lvl, s]) => Number(lvl) <= level && /Extra Attack/i.test(s.Features || ""));
  const attacks = cls.name === "Fighter"
    ? (level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1)
    : (extraAttackLevels.length ? 2 : 1);

  const rageRaw = step.Rages;
  const rageMax = isBerserker ? (String(rageRaw).toLowerCase() === "unlimited" ? 99 : parseNumericStat(rageRaw)) : 0;
  const rageDamage = isBerserker ? parseNumericStat(step["Rage Damage"]) : 0;

  const forcePowers = Array.isArray(baseClass.forcePowers) ? baseClass.forcePowers.filter(p => typeof p === "string" && p.trim()) : [];
  const techPowers = Array.isArray(baseClass.techPowers) ? baseClass.techPowers.filter(p => typeof p === "string" && p.trim()) : [];
  const customForcePowers = Array.isArray(raw.customForcePowers) ? raw.customForcePowers.filter(p => typeof p === "string" && p.trim()) : [];
  const customTechPowers = Array.isArray(raw.customTechPowers) ? raw.customTechPowers.filter(p => typeof p === "string" && p.trim()) : [];
  const maneuvers = Array.isArray(baseClass.maneuvers) ? baseClass.maneuvers.filter(m => typeof m === "string" && m.trim()) : [];

  const profile = {
    id: String(raw.id || ""),
    name: raw.name.trim(),
    version: raw.builderVersion,
    filename,
    level,
    species: sp.name,
    speciesTraits: sp.traits.map(t => t.name),
    background: raw.background?.name || "",
    backgroundFeature,
    className: cls.name,
    archetypeFlavor: cls.archetypeFlavorName || "Archetype",
    baseScores,
    scoreOverrides,
    scores: baseScores,
    baseTraining,
    explicitTraining,
    training: baseTraining,
    proficiency: parseNumericStat(step["Proficiency Bonus"]) || (2 + Math.floor((level - 1) / 4)),
    attacks,
    rageMax,
    rageDamage,
    leapMax: hasLeap ? 2 + [5, 9, 13, 17].filter(required => level >= required).length : 0,
    dewback,
    hpDice,
    hpBonus,
    extraHpBonus,
    hpOverride,
    hitDie: cls.hitDie,
    acBonus: finiteOr(acTweak?.bonus),
    acOverride: finiteOrNull(acTweak?.override),
    initiativeBonus: finiteOr(initTweak?.bonus),
    initiativeOverride: finiteOrNull(initTweak?.override),
    unarmedTweak,
    forcePowers,
    techPowers,
    customForcePowers,
    customTechPowers,
    maneuvers,
    selectedFeats,
    customFeatures: rawFeatures,
    customProficiencies: Array.isArray(raw.customProficiencies) ? raw.customProficiencies.filter(x => typeof x === "string") : [],
    customLanguages: Array.isArray(raw.customLanguages) ? raw.customLanguages.filter(x => typeof x === "string") : [],
    experiencePoints: nonnegative(raw.experiencePoints),
    characteristics,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    warnings: allEquipment.filter(item => !itemRule(item.name, item)).map(item => "No catalog match for " + item.name + ".")
  };

  const current = raw.currentStats || {};
  const structured = current.featuresTimesUsed || {};
  const suggestions = {};
  const spent = {};
  if (isBerserker) {
    for (const [key, pattern] of noteResources) {
      const saved = Object.entries(structured).find(([name]) =>
        new RegExp("^(?:" + pattern + (key === "leap" ? "|fyrnock.*" : "") + ")$", "i").test(name));
      if (saved && typeof saved[1] === "number") spent[key] = nonnegative(saved[1]);
      else {
        spent[key] = 0;
        const note = profile.notes.match(new RegExp("^\\s*" + pattern + "\\s+used\\s+(\\d+)\\s+times?\\b", "im"));
        if (note && Number(note[1]) > 0) suggestions[key] = Number(note[1]);
      }
    }
  }

  const temp = nonnegative(current.temporaryHitPoints);
  const suggestedTempSource = temp > 0 && selectedFeats.some(f => normalizeName(f.name) === "fanatic") ? "Fanatic" : "";

  const hlc = current.highLevelCasting || {};
  const session = {
    hp: 0,
    temp,
    tempSource: suggestedTempSource,
    inspiration: Boolean(current.hasInspiration),
    credits: nonnegative(raw.credits),
    hitDice: clamp(level - nonnegative(current.hitDiceUsed?.["d" + profile.hitDie]), 0, level),
    equipped: allEquipment,
    feats: [...selectedFeats],
    powers: [...new Set([...forcePowers, ...customForcePowers, ...techPowers, ...customTechPowers])],
    maneuvers: [...new Set(maneuvers)],
    fightingStyles: [...new Set(rawFeatures.map(f => fightingStyleRule(f.name)?.name).filter(Boolean))],
    fightingMasteries: [...new Set(rawFeatures.map(f => fightingMasteryRule(f.name)?.name).filter(Boolean))],
    lightsaberForms: [...new Set(rawFeatures.map(f => lightsaberFormRule(f.name)?.name).filter(Boolean))],
    classOptions: [...new Set(rawFeatures.map(f => (typeof classOptionRule === "function" ? classOptionRule(f.name)?.name : null)).filter(Boolean))],
    forceAffinity: (() => {
      for (const f of rawFeatures) {
        const m = String(f.name || "").match(/force\s*affinity\s*[:\-–]?\s*(ashla|bendu|bogan)/i) ||
          String(f.name || "").match(/^(ashla|bendu|bogan)$/i);
        if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      }
      return "";
    })(),
    classImprovementEnabled: false,
    spent,
    approach: "",
    exhaustion: clamp(nonnegative(current.exhaustion), 0, 6),
    effects: (Array.isArray(current.conditions) ? current.conditions : []).flatMap((condition, index) => {
      const text = typeof condition === "string" ? condition : condition?.name;
      if (typeof text !== "string") return [];
      const match = text.match(/^([^ (]+)(?:\s*\((\d+)\)|\s+(\d+))?$/);
      const name = recognizedCondition(match?.[1]) || text;
      const value = nonnegative(condition?.value ?? condition?.level ?? Number(match?.[2] || match?.[3])) || 1;
      return [conditionEntry(name, value, Boolean(condition?.context), {id: "import-" + index, note: "", persistent: true})];
    }),
    consumableEffects: [],
    concentration: "",
    death: {
      successes: clamp(nonnegative(current.deathSaves?.successes), 0, 3),
      failures: clamp(nonnegative(current.deathSaves?.failures), 0, 3)
    },
    reckless: false,
    rage: null,
    forceUsed: nonnegative(current.forcePointsUsed),
    techUsed: nonnegative(current.techPointsUsed),
    superiorityUsed: nonnegative(current.superiorityDiceUsed),
    highLevelCasting: {
      level6: Boolean(hlc.level6),
      level7: Boolean(hlc.level7),
      level8: Boolean(hlc.level8),
      level9: Boolean(hlc.level9)
    }
  };
  const exhaustionEntries = session.effects.filter(effect => effect.name === "Exhaustion");
  session.exhaustion = Math.max(session.exhaustion, ...exhaustionEntries.map(effect => Math.min(6, effect.value)));
  session.effects = session.effects.filter(effect => effect.name !== "Exhaustion");
  const maxHP = hitPointMaximum(profile, session);
  session.hp = clamp(maxHP - nonnegative(current.hitPointsLost), 0, maxHP);
  profile.hpMax = maxHP;
  return {character: {profile, session}, suggestedApproach, suggestions, suggestedTempSource};
}

function confirmWebsiteImport(draft, choices = {}) {
  const character = structuredClone(draft.character);
  const {profile, session} = character;
  if (choices.approach && draft.suggestedApproach) session.approach = draft.suggestedApproach;
  if (typeof choices.tempSource === "string") session.tempSource = choices.tempSource.trim();
  for (const key of Object.keys(draft.suggestions || {})) {
    if (choices[key] && (key !== "frenzy" || session.approach)) {
      session.spent[key] = draft.suggestions[key];
    }
  }
  if (profile.rageMax) session.spent.rage = clamp(session.spent.rage || 0, 0, profile.rageMax);
  if (profile.leapMax) session.spent.leap = clamp(session.spent.leap || 0, 0, profile.leapMax);
  return character;
}
