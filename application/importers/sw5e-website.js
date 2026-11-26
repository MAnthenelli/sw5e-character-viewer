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
  const rawFeatures = Array.isArray(raw.customFeatures)
    ? raw.customFeatures.filter(x => typeof x?.name === "string" && typeof x?.content === "string")
    : [];
  const findFeature = name => rawFeatures.find(entry => normalizeName(entry.name) === normalizeName(name));

  const parsedClasses = raw.classes.map((entry, idx) => {
    const rec = classRecord(entry?.name);
    if (!rec) {
      throw new Error("Unknown SW5e class: " + (entry?.name || "(none)") + ".");
    }
    const lvls = entry?.levels;
    if (!Number.isInteger(lvls) || lvls < 1 || lvls > 20) {
      throw new Error("Character level must be between 1 and 20.");
    }
    const explicitArch = typeof entry?.archetype === "string" && entry.archetype.trim()
      ? (archetypeRecord(entry.archetype, rec.name)?.name || entry.archetype.trim())
      : (typeof entry?.archetype?.name === "string" && entry.archetype.name.trim()
        ? (archetypeRecord(entry.archetype.name, rec.name)?.name || entry.archetype.name.trim())
        : "");
    const detectedArch = explicitArch || detectArchetype(rec.name, entry, rawFeatures);
    return {
      raw: entry,
      cls: rec,
      name: rec.name,
      levels: lvls,
      hitDie: rec.hitDie,
      archetypeFlavor: rec.archetypeFlavorName || "Archetype",
      explicitArchetype: explicitArch,
      detectedArchetype: detectedArch,
      isStarting: idx === 0
    };
  });

  const level = parsedClasses.reduce((sum, pc) => sum + pc.levels, 0);
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error("Character level must be between 1 and 20.");
  }
  const baseEntry = parsedClasses[0];
  const baseClass = baseEntry.raw;
  const cls = baseEntry.cls;
  const sp = speciesRecord(raw.species?.name);
  if (!sp) {
    throw new Error("Unknown SW5e species: " + (raw.species?.name || "(none)") + ".");
  }

  const allAsiEntries = parsedClasses.flatMap(pc =>
    (Array.isArray(pc.raw.abilityScoreImprovements) ? pc.raw.abilityScoreImprovements : [])
      .map(entry => ({ entry, className: pc.name }))
  );
  const selectedFeats = [
    [raw.background?.feat, raw.background?.name || "Background"],
    ...(allAsiEntries.filter(x => x.entry?.type === "Feat").map(x => [x.entry, x.className + " advancement"])),
    ...((raw.customFeats || []).map(entry => [entry, "Custom feat"]))
  ].filter(([entry]) => typeof entry?.name === "string" && entry.name.trim()).map(([entry, source], idx) => {
    const rule = featRule(entry.name);
    const explicitAb = entry.abilityChoice
      || (Array.isArray(entry.abilitiesIncreased) && abilities.includes(entry.abilitiesIncreased[0]?.name) ? entry.abilitiesIncreased[0].name : "");
    return {
      instanceId: "feat-" + idx,
      name: entry.name.trim(),
      source,
      rules: entry.content || "",
      abilityChoice: explicitAb || (rule?.attributes?.length === 1 ? rule.attributes[0] : ""),
      choice: entry.choice || entry.choiceName || entry.selectedOption || ""
    };
  });

  // Numeric Ability Score Improvements from class advancement across all classes
  const asiBonuses = {};
  let asiPicksCount = 0;
  for (const { entry } of allAsiEntries) {
    if (entry?.type === "Ability Score Improvement") {
      asiPicksCount++;
    }
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

  const suggestedApproaches = {};
  for (const pc of parsedClasses) {
    if (pc.detectedArchetype) suggestedApproaches[pc.name] = pc.detectedArchetype;
  }
  const suggestedApproach = baseEntry.detectedArchetype || "";
  const berserkerEntry = parsedClasses.find(pc => normalizeName(pc.name) === "berserker") || null;
  const isBerserker = Boolean(berserkerEntry);
  const berserkerLevel = berserkerEntry ? berserkerEntry.levels : 0;
  const dewbackText = isBerserker ? (findFeature("Dewback's Instinct")?.content.toLowerCase() || "") : "";
  const dewback = [...new Set((dewbackText.match(/[a-z]+/g) || []).filter(name => name !== "true" && damageTypes.includes(name)))];
  const hasLeap = isBerserker && Boolean(findFeature("Fyrnock's Instinct"));

  const step = cls.levelChanges[String(baseEntry.levels)] || {};
  const berserkerStep = berserkerEntry ? (berserkerEntry.cls.levelChanges[String(berserkerLevel)] || {}) : {};
  const hpBonus = finiteOr(raw.tweaks?.hitPoints?.maximum?.bonus);
  const hpOverride = finiteOrNull(raw.tweaks?.hitPoints?.maximum?.override);
  // SW5e Ch. 6: 1st-level max HP applies only to starting class; secondary classes use post-1st-level HP for every level.
  const hpDice = parsedClasses.reduce((total, pc, idx) => {
    if (idx === 0) {
      return total + pc.cls.firstHP + Array.from({length: pc.levels - 1}, (_, i) =>
        finiteOr(pc.raw.hitPoints?.[i], pc.cls.averageHP)).reduce((sum, value) => sum + value, 0);
    }
    return total + Array.from({length: pc.levels}, (_, i) =>
      finiteOr(pc.raw.hitPoints?.[i], pc.cls.averageHP)).reduce((sum, value) => sum + value, 0);
  }, 0);
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
    damageBonus: finiteOr(entry.tweaks?.damage?.bonus),
    damageOverride: entry.tweaks?.damage?.override ?? null,
    attackBonus: finiteOr(entry.tweaks?.toHit?.bonus ?? entry.tweaks?.attack?.bonus),
    toHitOverride: finiteOrNull(entry.tweaks?.toHit?.override ?? entry.tweaks?.attack?.override),
    customRule: {
      name: entry.name.trim(),
      category: entry.equipmentCategory || "Gear",
      cost: finiteOr(entry.cost),
      weight: finiteOr(entry.weight),
      properties: Array.isArray(entry.properties) ? entry.properties.filter(x => typeof x === "string") : [],
      description: entry.description || ""
    }
  }));
  const allEquipment = [...ownEquipment, ...customEquipment];

  const baseTraining = {};
  const explicitTraining = {};
  const skillTweaks = {};
  for (const [name, ability] of Object.entries(skills)) {
    const node = raw.tweaks?.abilityScores?.[ability]?.skills?.[name];
    const rank = node?.proficiency;
    if (rank !== undefined) explicitTraining[name] = rank;
    baseTraining[name] = rank === "Expertise" ? 2 : rank === "Proficient" ? 1 : 0;
    const bonus = finiteOr(node?.bonus, 0);
    const override = finiteOrNull(node?.override);
    if (bonus !== 0 || override !== null) skillTweaks[name] = { bonus, override };
  }
  const saveTweaks = {};
  for (const ability of abilities) {
    const st = raw.tweaks?.abilityScores?.[ability]?.savingThrow;
    if (!st || typeof st !== "object") continue;
    const bonus = finiteOr(st.bonus, 0);
    const override = finiteOrNull(st.override);
    const proficiency = st.proficiency ?? null;
    if (bonus !== 0 || override !== null || proficiency) saveTweaks[ability] = { proficiency, bonus, override };
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

  // SW5e Ch. 6: Extra Attack does not stack across classes; take the highest single-class attack count.
  const attacks = parsedClasses.reduce((best, pc) => {
    if (pc.name === "Fighter") {
      const fAtk = pc.levels >= 20 ? 4 : pc.levels >= 11 ? 3 : pc.levels >= 5 ? 2 : 1;
      return Math.max(best, fAtk);
    }
    const hasEA = Object.entries(pc.cls.levelChanges)
      .some(([lvl, s]) => Number(lvl) <= pc.levels && /Extra Attack/i.test(s.Features || ""));
    return Math.max(best, hasEA ? 2 : 1);
  }, 1);

  const rageRaw = berserkerStep.Rages;
  const rageMax = isBerserker ? (String(rageRaw).toLowerCase() === "unlimited" ? 99 : parseNumericStat(rageRaw)) : 0;
  const rageDamage = isBerserker ? parseNumericStat(berserkerStep["Rage Damage"]) : 0;

  const cleanList = arr => Array.isArray(arr) ? arr.filter(x => typeof x === "string" && x.trim()).map(x => x.trim()) : [];
  const collectClassProp = prop => parsedClasses.flatMap(pc => [...cleanList(pc.raw[prop]), ...cleanList(pc.raw.archetype?.[prop])]);
  const forcePowers = [...new Set(collectClassProp("forcePowers"))];
  const techPowers = [...new Set(collectClassProp("techPowers"))];
  const customForcePowers = cleanList(raw.customForcePowers);
  const customTechPowers = cleanList(raw.customTechPowers);
  const rawManeuverNames = [...cleanList(raw.maneuvers), ...cleanList(raw.customManeuvers), ...collectClassProp("maneuvers"), ...rawFeatures.map(f => maneuverRule(f.name)?.name).filter(Boolean)];
  const maneuvers = [];
  const seenManeuvers = new Set();
  for (const mn of rawManeuverNames) {
    const canon = maneuverRule(mn)?.name || mn;
    const key = normalizeName(canon);
    if (!key || seenManeuvers.has(key)) continue;
    seenManeuvers.add(key);
    maneuvers.push(canon);
  }

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
    classes: parsedClasses.map(pc => ({
      name: pc.name,
      levels: pc.levels,
      archetype: pc.explicitArchetype || "",
      hitDie: pc.hitDie,
      archetypeFlavor: pc.archetypeFlavor,
      isStarting: pc.isStarting
    })),
    archetypeFlavor: cls.archetypeFlavorName || "Archetype",
    baseScores,
    scoreOverrides,
    asiPicksCount,
    scores: baseScores,
    baseTraining,
    explicitTraining,
    skillTweaks,
    saveTweaks,
    settings: {
      isEnforcingForcePrerequisites: raw.settings?.isEnforcingForcePrerequisites !== false,
      isFixedHitPoints: Boolean(raw.settings?.isFixedHitPoints),
      abilityScoreMethod: typeof raw.settings?.abilityScoreMethod === "string" ? raw.settings.abilityScoreMethod : ""
    },
    training: baseTraining,
    proficiency: 2 + Math.floor((level - 1) / 4),
    attacks,
    rageMax,
    rageDamage,
    leapMax: hasLeap ? 2 + [5, 9, 13, 17].filter(required => berserkerLevel >= required).length : 0,
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
    const isFrenzied = normalizeName(berserkerEntry?.raw?.archetype?.name || berserkerEntry?.detectedArchetype || "") === "frenzied approach";
    for (const [key, pattern] of noteResources) {
      if (key === "leap" && !hasLeap) continue;
      if (key === "frenzy" && !isFrenzied) continue;
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
    hitDiceByDie: (() => {
      const totals = {};
      for (const pc of parsedClasses) {
        const key = "d" + pc.hitDie;
        totals[key] = (totals[key] || 0) + pc.levels;
      }
      const rem = {};
      for (const [dieKey, maxDice] of Object.entries(totals)) {
        rem[dieKey] = clamp(maxDice - nonnegative(current.hitDiceUsed?.[dieKey]), 0, maxDice);
      }
      return rem;
    })(),
    hitDice: (() => {
      const totals = {};
      for (const pc of parsedClasses) {
        const key = "d" + pc.hitDie;
        totals[key] = (totals[key] || 0) + pc.levels;
      }
      let sum = 0;
      for (const [dieKey, maxDice] of Object.entries(totals)) {
        sum += clamp(maxDice - nonnegative(current.hitDiceUsed?.[dieKey]), 0, maxDice);
      }
      return sum;
    })(),
    equipped: allEquipment,
    feats: [...selectedFeats],
    powers: [...new Set([...forcePowers, ...customForcePowers, ...techPowers, ...customTechPowers])],
    maneuvers: [...new Set(maneuvers)],
    fightingStyles: [...new Set([...rawFeatures.map(f => {
      const nm = String(f.name || "").replace(/\s*[:(\-–]\s*(force|tech)-?casting\)?$/i, "").trim();
      return fightingStyleRule(nm)?.name;
    }), ...[...cleanList(raw.fightingStyles), ...collectClassProp("fightingStyles")].map(n => {
      const nm = String(n || "").replace(/\s*[:(\-–]\s*(force|tech)-?casting\)?$/i, "").trim();
      return fightingStyleRule(nm, { allowBare: true })?.name;
    })].filter(Boolean))],
    fightingMasteries: [...new Set([...rawFeatures.map(f => fightingMasteryRule(f.name)?.name), ...[...cleanList(raw.fightingMasteries), ...collectClassProp("fightingMasteries")].map(n => fightingMasteryRule(n, { allowBare: true })?.name)].filter(Boolean))],
    lightsaberForms: [...new Set([...rawFeatures.map(f => f.name), ...cleanList(raw.lightsaberForms), ...collectClassProp("lightsaberForms")].map(n => lightsaberFormRule(n)?.name).filter(Boolean))],
    weaponFocuses: [...new Set([...rawFeatures.map(f => weaponFocusRule(f.name)?.name), ...[...cleanList(raw.weaponFocuses), ...collectClassProp("weaponFocuses")].map(n => weaponFocusRule(n, { allowBare: true })?.name)].filter(Boolean))],
    weaponSupremacies: [...new Set([...rawFeatures.map(f => weaponSupremacyRule(f.name)?.name), ...[...cleanList(raw.weaponSupremacies), ...collectClassProp("weaponSupremacies")].map(n => weaponSupremacyRule(n, { allowBare: true })?.name)].filter(Boolean))],
    classOptions: (() => {
      const out = [];
      const seenNonRep = new Set();
      for (const f of rawFeatures) {
        const rule = typeof classOptionRule === "function" ? classOptionRule(f.name) : null;
        if (!rule) continue;
        const k = normalizeName(rule.name);
        if (rule.repeatable || !seenNonRep.has(k)) {
          out.push(rule.name);
          if (!rule.repeatable) seenNonRep.add(k);
        }
      }
      return out;
    })(),
    classOptionChoices: dewback.length ? { "Dewback's Instinct": [...dewback] } : {},
    combatOptionChoices: (() => {
      const out = {};
      const allStyleEntries = [...rawFeatures.map(f => f.name), ...cleanList(raw.fightingStyles), ...collectClassProp("fightingStyles")];
      for (const rawName of allStyleEntries) {
        const m = String(rawName || "").match(/^disruption(?:\s+fighting)?(?:\s+style)?\s*[:(\-–]\s*(force|tech)-?casting\)?$/i);
        if (m) out["Disruption Style"] = [m[1].toLowerCase() === "tech" ? "Tech-casting" : "Force-casting"];
      }
      return out;
    })(),
    forceAffinity: (() => {
      for (const f of rawFeatures) {
        const m = String(f.name || "").match(/force\s*affinity\s*[:\-–]?\s*(ashla|bendu|bogan)/i) ||
          String(f.name || "").match(/^(ashla|bendu|bogan)$/i);
        if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      }
      return "";
    })(),
    classImprovementEnabled: parsedClasses.some(pc => pc.levels >= 3) && (selectedFeats.some(f => normalizeName(f.name) === "class improvement") || Boolean(raw.classImprovementEnabled)),
    multiclassImprovements: (() => {
      const validMc = new Map((typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined" ? SW5E_MULTICLASS_IMPROVEMENTS : []).map(x => [normalizeName(x.className), x.className]));
      const rawMc = [
        ...(Array.isArray(raw.multiclassImprovements) ? raw.multiclassImprovements : []),
        ...(Array.isArray(raw.multiclassImprovement) ? raw.multiclassImprovement : [])
      ];
      const out = [];
      for (const item of rawMc) {
        const canon = validMc.get(normalizeName(typeof item === "string" ? item : item?.name || item?.className));
        if (canon && !out.includes(canon)) out.push(canon);
      }
      return out;
    })(),
    spent,
    approach: baseEntry.explicitArchetype || "",
    approaches: parsedClasses.reduce((acc, pc) => {
      if (pc.explicitArchetype) acc[pc.name] = pc.explicitArchetype;
      return acc;
    }, {}),
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
  if (typeof reconcileCharacterChoices === "function") reconcileCharacterChoices(profile, session);
  const maxHP = hitPointMaximum(profile, session);
  session.hp = clamp(maxHP - nonnegative(current.hitPointsLost), 0, maxHP);
  profile.hpMax = maxHP;
  return {character: {profile, session}, suggestedApproach, suggestedApproaches, suggestions, suggestedTempSource};
}

function confirmWebsiteImport(draft, choices = {}) {
  const character = structuredClone(draft.character);
  const {profile, session} = character;
  if (!session.approaches || typeof session.approaches !== "object") session.approaches = {};
  if (choices.approach) {
    if (draft.suggestedApproach) session.approach = draft.suggestedApproach;
    if (draft.suggestedApproaches && typeof draft.suggestedApproaches === "object") {
      for (const [clsName, archName] of Object.entries(draft.suggestedApproaches)) {
        if (archName) {
          session.approaches[clsName] = archName;
          const entry = (profile.classes || []).find(c => normalizeName(c.name) === normalizeName(clsName));
          if (entry && !entry.archetype) entry.archetype = archName;
        }
      }
    }
  }
  for (const [key, val] of Object.entries(choices || {})) {
    if (key.startsWith("approach:") && val) {
      const clsName = key.slice("approach:".length);
      const archName = draft.suggestedApproaches?.[clsName];
      if (archName) {
        session.approaches[clsName] = archName;
        if (normalizeName(clsName) === normalizeName(profile.className)) session.approach = archName;
      }
    }
  }
  if (typeof choices.tempSource === "string") session.tempSource = choices.tempSource.trim();
  for (const key of Object.keys(draft.suggestions || {})) {
    if (choices[key] && (key !== "frenzy" || session.approach)) {
      session.spent[key] = draft.suggestions[key];
    }
  }
  if (profile.rageMax) session.spent.rage = clamp(session.spent.rage || 0, 0, profile.rageMax);
  if (profile.leapMax) session.spent.leap = clamp(session.spent.leap || 0, 0, profile.leapMax);
  if (typeof reconcileCharacterChoices === "function") reconcileCharacterChoices(profile, session);
  return character;
}
