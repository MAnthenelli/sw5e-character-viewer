// Kincaid-parity progressive cast chooser, separated Force/Tech Power lists, and Force/Tech Power Library.
const POWER_ROLES = ["Damage", "Control", "Utility", "Mobility", "Healing"];
const powerRoleIcons = {Damage: "✦", Control: "⊞", Utility: "◇", Mobility: "↗", Healing: "+"};
const powerCastContexts = {
  all: "Cast a power",
  Action: "Action powers",
  BonusAction: "Bonus action powers",
  Reaction: "Reaction powers",
  Special: "Special / Triggered powers"
};

const POWER_CHOICE_CONFIGS = {
  energyDamageType: {label: "Choose damage type", options: ["acid", "cold", "fire", "lightning", "sonic"]},
  disperseDamageType: {label: "Choose damage type", options: ["acid", "cold", "energy", "fire", "force", "ion", "kinetic", "lightning", "necrotic", "sonic"]},
  forceEnlightenment: {label: "Choose Force Enlightenment aspect", options: ["Strength (2× carry)", "Dexterity (no 20ft fall)", "Constitution (2d6 temporary HP)", "Intelligence", "Wisdom", "Charisma"]},
  enhanceDroid: {label: "Choose Enhance Droid aspect", options: ["Servomotor (Strength · 2× carry)", "Motivator (Dexterity · no 20ft fall)", "Power Core (Constitution · 2d6 temporary HP)", "Databanks (Intelligence)", "Sensors (Wisdom)", "Relations (Charisma)"]},
  alterSelf: {label: "Choose Alter Self form", options: ["Aquatic Adaptation (Swim)", "Natural Weapons (+1 & die step)", "Change Appearance"]},
  constructDroid: {label: "Choose Constructed Droid design", options: ["Probe (Fly 60 ft)", "Pyro (15-ft Flamethrower)", "Battle (1d12 Vibroweapon)"]},
  mutateAugment: {label: "Choose augmentations (select 1 or more)", multi: true, options: ["Hardened Flesh (Minimum AC 16)", "Tremorsense (30 ft)", "Burrow Speed", "Climb Speed", "Reach (+5 ft)", "Flexible (Advantage vs. Grapple/Restrain)"]},
  bestowCurse: {label: "Choose curse effect", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "Attack disadvantage vs caster", "Wisdom save or lose action", "+1d8 necrotic from caster"]},
  abilityCheckDisadv: {label: "Choose penalized ability", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]},
  blindOrDeafen: {label: "Choose condition", options: ["Blinded", "Deafened"]},
  skillExpertise: {label: "Choose proficient skill for Expertise", dynamicSkills: true},
  anySkill: {label: "Choose skill", allSkills: true},
  anyAbility: {label: "Choose saving throw ability", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]}
};

function powerChoiceConfig(choiceKind, profile = null, session = null) {
  const cfg = POWER_CHOICE_CONFIGS[choiceKind];
  if (!cfg) return null;
  const tr = (profile && typeof effectiveTraining === "function") ? effectiveTraining(profile, session) : {};
  if (cfg.allSkills) {
    const unprof = Object.keys(skills).filter(sk => (tr[sk] || 0) === 0).sort();
    return {label: cfg.label, multi: false, options: unprof.length ? unprof : Object.keys(skills).sort()};
  }
  if (cfg.dynamicSkills) {
    const eligible = Object.keys(skills).filter(sk => tr[sk] === 1).sort();
    const profSkills = Object.keys(skills).filter(sk => (tr[sk] || 0) >= 1).sort();
    return {label: cfg.label, multi: false, options: eligible.length ? eligible : (profSkills.length ? profSkills : Object.keys(skills).sort())};
  }
  return cfg;
}
const powerLibraryPageSize = 20;
let castDraft = null;
let powerLibraryType = "Force";
let powerLibraryPage = 0;
let powerLevelFilterVal = "";

function activePowerNames(profile, session = null) {
  const sess = session || (typeof app !== "undefined" ? app?.character?.session : null);
  const base = Array.isArray(sess?.powers)
    ? [...sess.powers]
    : [...new Set([
        ...(profile?.forcePowers || []),
        ...(profile?.customForcePowers || []),
        ...(profile?.techPowers || []),
        ...(profile?.customTechPowers || [])
      ])];
  if (typeof resolveGrantedPowers === "function") {
    const granted = resolveGrantedPowers(profile, sess);
    for (const gp of granted.all) {
      if (!base.some(n => normalizeName(n) === normalizeName(gp.name))) base.push(gp.name);
    }
  }
  return base;
}

function knownPowerRecords(profile, powerType = "", session = null) {
  const names = activePowerNames(profile, session);
  const seen = new Set();
  const records = [];
  for (const rawName of names) {
    const key = normalizeName(rawName);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const rule = powerRule(rawName);
    const rec = rule || {
      name: rawName,
      type: (profile?.techPowers || []).includes(rawName) || (profile?.customTechPowers || []).includes(rawName) ? "Tech" : "Force",
      level: 0,
      alignment: "",
      castingPeriod: "Action",
      castingPeriodText: "1 action",
      range: "",
      duration: "Instantaneous",
      concentration: false,
      ongoing: false,
      roles: ["Utility"],
      description: "Custom power from character export.",
      higherLevel: ""
    };
    if (powerType && rec.type !== powerType) continue;
    records.push(rec);
  }
  return records.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
}

function powerCastingNumbers(casting, power) {
  if (power?.type === "Tech") return {dc: casting.techDC, attack: casting.techAttack, ability: casting.techAbility};
  const al = String(power?.alignment || "").toLowerCase();
  if (al === "light") return {dc: casting.lightDC, attack: casting.lightAttack, ability: casting.lightAbility};
  if (al === "dark") return {dc: casting.darkDC, attack: casting.darkAttack, ability: casting.darkAbility};
  return {dc: casting.forceDC, attack: casting.forceAttack, ability: casting.forceAbility};
}

function powerPointCost(castLevel) {
  return castLevel <= 0 ? 0 : castLevel + 1;
}

function powerPoolType(power, casting) {
  if (power?.type === "Tech") return casting?.techUsesForcePoints ? "Force" : "Tech";
  return casting?.forceUsesTechPoints ? "Tech" : "Force";
}

function powerCastOptions(profile, session, power) {
  const casting = castingStats(profile, session);
  const poolType = powerPoolType(power, casting);
  const usesTechPool = poolType === "Tech";
  const remaining = usesTechPool ? casting.techTotalRemaining : casting.forceTotalRemaining;
  const poolMax = usesTechPool ? casting.techMax : casting.forceMax;
  const maxLevel = power.type === "Tech" ? casting.maxTechLevel : casting.maxForceLevel;
  const blockedByRage = Boolean(session?.rage) || (casting.castingRestrictions || []).some(r => r.kind === "noCastOrConcWhileRaging" || r.kind === "noCasting");
  const blockedByTechImpaired = Boolean(power.type === "Tech" && (casting.castingRestrictions || []).some(r => r.kind === "techInsensitive" || r.kind === "techImpaired"));
  const blockedByForceInsensitive = Boolean(power.type === "Force" && (casting.castingRestrictions || []).some(r => r.kind === "forceInsensitive"));
  const blockReason = blockedByForceInsensitive
    ? "Force-Insensitive: cannot cast force powers"
    : (blockedByTechImpaired ? "Tech-Impaired: cannot cast tech powers" : (blockedByRage ? "Cannot cast or concentrate on powers while raging" : ""));
  const castBlocked = blockedByRage || blockedByTechImpaired || blockedByForceInsensitive;
  if (power.level === 0) {
    return [{level: 0, cost: 0, disabled: castBlocked, reason: blockReason}];
  }
  const options = [];
  const consularLvlForSig = typeof classLevelOf === "function" ? classLevelOf(profile, "Consular") : (normalizeName(profile?.className) === "consular" ? (profile?.level || 1) : 0);
  if (power.type === "Force" && power.level === 3 && consularLvlForSig >= 20 && session?.signaturePower && normalizeName(session.signaturePower) === normalizeName(power.name)) {
    const sigLeft = Math.max(0, 1 - (session?.spent?.signaturePower || 0));
    const sigReason = blockReason || (sigLeft <= 0 ? "Signature Power already used (short or long rest)" : "");
    options.push({
      level: 3,
      cost: 0,
      freeCastId: "signaturePower",
      freeLeft: sigLeft,
      freeMax: 1,
      labelOverride: "Signature Power",
      disabled: Boolean(sigReason),
      reason: sigReason
    });
  }
  if (typeof resolveGrantedPowers === "function") {
    const gp = resolveGrantedPowers(profile, session).byName?.get(normalizeName(power.name));
    if (gp && gp.freeCasts > 0) {
      const freeId = "gpFree:" + normalizeName(power.name);
      const freeLeft = Math.max(0, gp.freeCasts - (session?.spent?.[freeId] || 0));
      options.push({
        level: power.level,
        cost: 0,
        freeCastId: freeId,
        freeLeft,
        freeMax: gp.freeCasts,
        disabled: castBlocked || freeLeft <= 0,
        reason: blockReason || (freeLeft <= 0 ? "Free cast already used (" + (gp.recharge === "short" ? "short rest" : "long rest") + ")" : "")
      });
    }
  }
  // Feat-granted 1/long rest leveled powers via structured choiceSpec.leveledSlots
  for (const ft of (session?.feats || [])) {
    const fRule = typeof featRule === "function" ? featRule(ft?.name) : null;
    if (!fRule || !Array.isArray(ft?.powersChoice) || !ft.powersChoice.length) continue;
    const cs = fRule.choiceSpec;
    const fMech = fRule.mechanics;
    const awCount = cs?.atWillCount || fMech?.atWillCount || 1;
    const rawSlots = Array.isArray(cs?.leveledSlots)
      ? cs.leveledSlots
      : (Array.isArray(fMech?.leveledLevels)
        ? fMech.leveledLevels
        : (fMech?.leveledPoolId ? [{ level: fMech.leveledLevel || 1, poolId: fMech.leveledPoolId }] : []));
    const lvlEntries = rawSlots.filter(le => (profile?.level || 1) >= (le.minLevel || 1));
    lvlEntries.forEach((le, li) => {
      const chosenName = ft.powersChoice[awCount + li];
      if (!chosenName || normalizeName(chosenName) !== normalizeName(power.name) || power.level !== le.level) return;
      if (options.some(o => o.freeCastId === le.poolId)) return;
      const freeLeft = Math.max(0, 1 - (session?.spent?.[le.poolId] || 0));
      const fReason = blockReason || (freeLeft <= 0 ? (fRule.name + " free cast already used (long rest)") : "");
      options.push({
        level: power.level,
        cost: 0,
        freeCastId: le.poolId,
        freeLeft,
        freeMax: 1,
        labelOverride: fRule.name + " (Free)",
        disabled: Boolean(fReason),
        reason: fReason
      });
    });
  }
  // Structured castingModifiers: freeBonusActionCast and channelHalfCost
  const castModEffs = (typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session).castingModifiers : []) || [];
  for (const cm of castModEffs) {
    if (cm.kind === "freeBonusActionCast") {
      const maxLvl = cm.maxLevelFormula === "proficiency" ? (profile?.proficiency || 2) : (Number(cm.maxLevel) || (profile?.proficiency || 2));
      if (power.castingPeriod === "BonusAction" && power.level >= 1 && power.level <= maxLvl && cm.resourceId && !options.some(o => o.freeCastId === cm.resourceId)) {
        const left = Math.max(0, 1 - (session?.spent?.[cm.resourceId] || 0));
        const reason = blockReason || (left <= 0 ? ((cm.sourceName || "Feature") + " free cast already used (long rest)") : "");
        options.push({
          level: power.level,
          cost: 0,
          freeCastId: cm.resourceId,
          freeLeft: left,
          freeMax: 1,
          labelOverride: cm.label || ((cm.sourceName || "Feature") + " (Free)"),
          disabled: Boolean(reason),
          reason
        });
      }
    } else if (cm.kind === "channelHalfCost" && poolMax > 0 && power.level >= (cm.minLevel || 1)) {
      if (cm.powerType && normalizeName(cm.powerType) !== normalizeName(power.type)) continue;
      const chosenList = Array.isArray(cm.source?.multiChoice) ? cm.source.multiChoice : [];
      if (!chosenList.some(n => normalizeName(n) === normalizeName(power.name))) continue;
      if (options.some(o => o.labelOverride && o.labelOverride.startsWith("Channel Level "))) continue;
      const chCost = Math.floor(powerPointCost(power.level) / 2);
      const hlcMinCh = typeof highLevelCastingMinLevel === "function" ? highLevelCastingMinLevel(profile, session) : 6;
      const hlcKey = (hlcMinCh > 0 && power.level >= hlcMinCh && power.level <= 9) ? "level" + power.level : "";
      const hlcUsed = Boolean(hlcKey && session.highLevelCasting?.[hlcKey]);
      const lackCh = chCost > remaining;
      const chReason = blockReason || (hlcUsed ? (power.level + "th-level slot already used (long rest)") :
        lackCh ? ("Needs " + chCost + " " + poolType + " points (" + remaining + " left)") : "");
      options.push({
        level: power.level,
        cost: chCost,
        costOverride: chCost,
        hlcKey,
        labelOverride: "Channel Level " + power.level + " (+" + power.level + " min)",
        disabled: Boolean(chReason),
        reason: chReason
      });
    }
  }
  const hlcMin = typeof highLevelCastingMinLevel === "function" ? highLevelCastingMinLevel(profile, session) : 6;
  const skipPaidForNonCaster = poolMax <= 0 && options.some(o => o.freeCastId);
  const top = Math.max(power.level, maxLevel || power.level);
  for (let lvl = power.level; !skipPaidForNonCaster && lvl <= top; lvl++) {
    const cost = powerPointCost(lvl);
    const hlcKey = (hlcMin > 0 && lvl >= hlcMin && lvl <= 9) ? "level" + lvl : "";
    const hlcUsed = Boolean(hlcKey && session.highLevelCasting?.[hlcKey]);
    const overMax = maxLevel > 0 && lvl > maxLevel;
    const lackPoints = poolMax > 0 && cost > remaining;
    const reason = blockReason || (overMax ? "Above maximum power level" :
      hlcUsed ? (lvl + "th-level slot already used (long rest)") :
      lackPoints ? "Needs " + cost + " " + poolType + " points (" + remaining + " left)" : "");
    options.push({level: lvl, cost, hlcKey, disabled: Boolean(reason), reason});
  }
  return options;
}

function showPowerInfo(power, opts = {}) {
  if (!power) return;
  const meta = [
    ["Kind", power.type + " Power"],
    ["Alignment", power.alignment || ""],
    ["Level", power.level ? "Level " + power.level + " (" + powerPointCost(power.level) + " points)" : "At-will"],
    ["Casting time", power.castingPeriodText],
    ["Range", power.range],
    ["Duration", (power.concentration ? "Concentration, " : "") + power.duration],
    ["Prerequisite", power.prerequisite],
    ["Sheet effects", summarizePowerEffects(power.effects)]
  ];
  const profile = typeof app !== "undefined" ? app?.character?.profile : null;
  const session = typeof app !== "undefined" ? app?.character?.session : null;
  if (typeof buildProvenanceChain === "function" && typeof renderSourceLinks === "function" && typeof document !== "undefined") {
    const chain = buildProvenanceChain({ kind: "power", name: power.name }, profile, session);
    if (chain.length) {
      meta.push(["Granted by", renderSourceLinks(chain, { separator: " › ", className: "ruleLinkChain", push: true, profile, session })]);
    }
  }
  const body = power.description + (power.higherLevel ? "\n\nAt Higher Levels: " + power.higherLevel : "");
  showInfo(power.name, meta, body, { push: opts?.push, navKey: "power:" + normalizeName(power.name) });
}

function spendForcePoints(next, amount) {
  const cost = Math.max(0, Number(amount) || 0);
  const fromTemp = Math.min(cost, next.tempForce || 0);
  next.tempForce = Math.max(0, (next.tempForce || 0) - fromTemp);
  next.forceUsed = (next.forceUsed || 0) + (cost - fromTemp);
}

function activeConcentrations(session) {
  if (!session) return [];
  return [session.concentration, session.concentration2].filter(Boolean);
}

function endConcentration(session, targetName = "") {
  if (!session) return;
  if (targetName) {
    const tKey = normalizeName(targetName);
    if (normalizeName(session.concentration) === tKey) {
      session.concentration = session.concentration2 || "";
      session.concentration2 = "";
    } else if (normalizeName(session.concentration2) === tKey) {
      session.concentration2 = "";
    }
    session.effects = (session.effects || []).filter(e => !(e.fromConcentration && normalizeName(e.name) === tKey));
    if (activeConcentrations(session).length < 2) {
      for (const ef of (session.effects || [])) {
        if (Array.isArray(ef.turnTriggers) && ef.turnTriggers.some(t => t && t.fromDualConcentration)) {
          ef.turnTriggers = ef.turnTriggers.filter(t => !(t && t.fromDualConcentration));
        }
      }
    }
    return;
  }
  const olds = activeConcentrations(session);
  session.concentration = "";
  session.concentration2 = "";
  if (!olds.length) return;
  const oldKeys = new Set(olds.map(normalizeName));
  session.effects = (session.effects || []).filter(e => !(e.fromConcentration && oldKeys.has(normalizeName(e.name))));
}

function buildPowerEffectEntry(power, castLevel, choice = "", choices = null, fromConcentration = false, profile = null, session = null) {
  const noteParts = [power.duration, power.concentration ? "Concentration" : ""].filter(Boolean);
  const extra = {
    id: newID(),
    note: noteParts.join(" · "),
    persistent: true,
    castLevel,
    fromConcentration: Boolean(fromConcentration && power.concentration),
    source: { kind: "power", name: power.name },
    ...(power.durationSpec ? { durationSpec: power.durationSpec } : (power.concentration ? { durationSpec: { anchor: "concentration" } } : {})),
    ...(Array.isArray(power.turnTriggers) && power.turnTriggers.length ? { turnTriggers: power.turnTriggers } : {})
  };
  if (choice) extra.choice = choice;
  if (Array.isArray(choices) && choices.length) extra.choices = [...choices];
  const ch = power.effects?.charges;
  if (ch) {
    const steps = (ch.upcastStart && castLevel >= ch.upcastStart)
      ? Math.floor((castLevel - ch.upcastStart) / (ch.upcastEvery || 1)) + 1 : 0;
    const bonus = ch.perTurn
      ? ((ch.upcastStart && castLevel >= ch.upcastStart) ? Math.floor((castLevel - 1) / (ch.upcastEvery || 2)) : 0)
      : steps * (ch.upcastAmount || 1);
    const total = ch.base + bonus;
    extra.chargesMax = total;
    extra.charges = ch.perTurn ? Math.max(0, total - 1) : total;
    extra.chargeLabel = ch.label || "Charges";
    extra.perTurnCharges = Boolean(ch.perTurn);
    if (ch.perTurn) extra.surgeActive = true;
  } else if (Array.isArray(power.activeEffects)) {
    const trigPool = power.activeEffects.find(e => e && e.type === "resourcePool" && e.recharge === "trigger");
    if (trigPool) {
      const scores = profile && typeof effectiveScores === "function" ? effectiveScores(profile, session) : null;
      const cast = profile && typeof castingStats === "function" ? castingStats(profile, session) : null;
      const rawMax = typeof evaluateResourceMax === "function"
        ? evaluateResourceMax(trigPool.max, profile, scores, cast, trigPool.min || 1)
        : Number(trigPool.max);
      const total = Number.isFinite(rawMax) && rawMax > 0 ? Math.max(trigPool.min || 1, rawMax) : (trigPool.min || 1);
      extra.chargesMax = total;
      extra.charges = total;
      const rawLbl = String(trigPool.name || "Charges").trim();
      const stripped = rawLbl.toLowerCase().startsWith(power.name.toLowerCase()) ? rawLbl.slice(power.name.length).trim() : rawLbl;
      extra.chargeLabel = stripped || rawLbl;
      extra.perTurnCharges = false;
    }
  }
  return conditionEntry(power.name, 1, false, extra);
}

function _fecAppliesToPower(appliesTo, p) {
  if (!p) return false;
  switch (appliesTo) {
    case "hasSave": return Boolean(p.combat?.hasSave);
    case "nonSelfRange": return Boolean(p.range && !p.combat?.isSelfRange);
    case "canExtend": return Boolean(p.combat?.canExtend);
    case "hasDamage": return Boolean(p.combat?.hasDamage || (p.roles || []).includes("Damage"));
    case "concentration": return Boolean(p.concentration);
    case "areaSave": return Boolean(p.combat?.hasSave && p.combat?.hasArea);
    case "actionCast": return p.castingPeriod === "Action";
    case "singleTarget": return Boolean(p.combat?.isSingleTarget);
    default: return true;
  }
}

function splashFecCapStats(profile, session) {
  if (!profile || typeof resolveResourceEffects !== "function") return { active: false, max: 0, spent: 0, remaining: 0 };
  const pool = (resolveResourceEffects(profile, session).pools || []).find(p => p.id === "splash_consular_fec");
  if (!pool) return { active: false, max: 0, spent: 0, remaining: 0 };
  const scores = typeof effectiveScores === "function" ? effectiveScores(profile, session) : (profile.scores || {});
  const max = typeof evaluateResourceMax === "function" ? evaluateResourceMax(pool.max, profile, scores, {}) : (profile.proficiency || 2);
  const spent = Math.max(0, Number(session?.spent?.splash_consular_fec) || 0);
  return { active: max > 0, max, spent, remaining: Math.max(0, max - spent) };
}

function applicableForceEmpoweredOptions(profile, session, power) {
  if (!power || power.type !== "Force") return [];
  if (typeof resolveCastingEffects !== "function") return [];
  const mods = (resolveCastingEffects(profile, session).castingModifiers || [])
    .filter(m => m.kind === "forceEmpoweredCasting");
  const out = [];
  const seen = new Set();
  for (const m of mods) {
    const name = m.label || m.sourceName || "";
    const key = normalizeName(name);
    if (!key || seen.has(key)) continue;
    if (!_fecAppliesToPower(m.appliesTo, power)) continue;
    seen.add(key);
    const costFn = m.fpCostFormula === "powerLevelMin1"
      ? (lvl => Math.max(1, lvl || 0))
      : (() => Number(m.fpCost) || 1);
    out.push({
      name,
      spec: {
        cost: costFn,
        fpCostFormula: m.fpCostFormula || "",
        stackable: Boolean(m.stackable),
        enablesBonusActionCast: Boolean(m.enablesBonusActionCast),
        durationSpec: m.durationSpec || null,
        note: m.text || ""
      },
      summary: m.text || ""
    });
  }
  return out;
}

function castPower(powerName, castLevel, trackEffect = false, choice = "", choices = null, extra = {}) {
  const {profile, session} = app.character;
  const power = knownPowerRecords(profile, "", session).find(p => normalizeName(p.name) === normalizeName(powerName)) || powerRule(powerName);
  if (!power) return;
  const fecCost = Math.max(0, Number(extra?.fecCost) || 0);
  const fecNames = Array.isArray(extra?.fecNames) ? extra.fecNames : [];
  const castingNow = castingStats(profile, session);
  const poolType = powerPoolType(power, castingNow);
  const isTech = poolType === "Tech";
  const freeCastId = extra?.freeCastId || "";
  const cost = (freeCastId ? 0 : (Number.isFinite(extra?.costOverride) ? extra.costOverride : powerPointCost(castLevel))) + fecCost;
  const choiceTag = Array.isArray(choices) && choices.length ? " · " + choices.join(", ") : (choice ? " · " + choice : "");
  const fecTag = fecNames.length ? " · " + fecNames.join(" + ") : "";
  const costSummary = freeCastId
    ? (cost > 0 ? "Free cast + " + cost + " " + poolType + " points" : "Free cast")
    : (cost + " " + poolType + " points");
  const label = "Cast " + power.name + (castLevel ? " (Level " + castLevel + " · " + costSummary + ")" : (cost ? " (At-will · " + costSummary + ")" : " (At-will)")) + fecTag + choiceTag;
  update(label, next => {
    if (freeCastId) {
      next.spent[freeCastId] = (next.spent[freeCastId] || 0) + 1;
    }
    if (cost > 0) {
      if (isTech) {
        const fromTemp = Math.min(cost, next.tempTech || 0);
        next.tempTech = Math.max(0, (next.tempTech || 0) - fromTemp);
        next.techUsed = (next.techUsed || 0) + (cost - fromTemp);
      } else {
        const fromTemp = Math.min(cost, next.tempForce || 0);
        next.tempForce = Math.max(0, (next.tempForce || 0) - fromTemp);
        next.forceUsed = (next.forceUsed || 0) + (cost - fromTemp);
      }
    }
    if (fecCost > 0 && !isTech) {
      const fecCapNow = splashFecCapStats(profile, next);
      if (fecCapNow.active) {
        if (!next.spent) next.spent = {};
        next.spent.splash_consular_fec = Math.min(fecCapNow.max, (next.spent.splash_consular_fec || 0) + fecCost);
      }
    }
    const hlcMinCast = typeof highLevelCastingMinLevel === "function" ? highLevelCastingMinLevel(profile, session) : 6;
    if (!freeCastId && hlcMinCast > 0 && castLevel >= hlcMinCast && castLevel <= 9) {
      if (!next.highLevelCasting) next.highLevelCasting = {level4: false, level5: false, level6: false, level7: false, level8: false, level9: false};
      next.highLevelCasting["level" + castLevel] = true;
    }
    if (power.concentration) {
      const castEffConc = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, next) : null;
      const maxConc = castEffConc?.maxConcurrentConcentration || 1;
      const curList = activeConcentrations(next);
      if (maxConc >= 2 && curList.length === 1 && normalizeName(curList[0]) !== normalizeName(power.name)) {
        next.concentration2 = power.name;
        const dualTrigs = Array.isArray(castEffConc?.dualConcentrationTriggers) ? castEffConc.dualConcentrationTriggers : [];
        if (dualTrigs.length) {
          for (const ef of (next.effects || [])) {
            if (ef.fromConcentration && normalizeName(ef.name) === normalizeName(curList[0])) {
              const existing = Array.isArray(ef.turnTriggers) ? ef.turnTriggers.filter(t => !(t && t.fromDualConcentration)) : [];
              ef.turnTriggers = [...existing, ...dualTrigs.map(t => ({ ...t }))];
            }
          }
        }
      } else if (maxConc >= 2 && curList.some(n => normalizeName(n) === normalizeName(power.name))) {
        // Refreshing an already concentrated power keeps the other slot intact
      } else {
        endConcentration(next);
        next.concentration = power.name;
      }
    }
    if (power.effects?.tempHPPerLevel && castLevel > 0) {
      const gained = power.effects.tempHPPerLevel * castLevel;
      if (gained > next.temp) {
        next.temp = gained;
        next.tempSource = power.name;
      }
    } else if (power.effects?.tempHPBase) {
      const gained = power.effects.tempHPBase + Math.max(0, castLevel - (power.effects.baseLevel || power.level || 1)) * (power.effects.tempHPPerUpcast || 0);
      if (gained > next.temp) {
        next.temp = gained;
        next.tempSource = power.name;
      }
    }
    if (trackEffect && power.ongoing) {
      const hasTriggerPool = Array.isArray(power.activeEffects) && power.activeEffects.some(e => e && e.type === "resourcePool" && e.recharge === "trigger");
      if (power.effects?.charges || hasTriggerPool || power.effects?.maxHPBase || power.effects?.choiceKind) {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(power.name));
      }
      next.effects.push(buildPowerEffectEntry(power, castLevel, choice, choices, Boolean(power.concentration), profile, next));
      if (power.effects?.maxHPBase) {
        const gain = power.effects.maxHPBase + Math.max(0, castLevel - (power.effects.baseLevel || 1)) * (power.effects.maxHPPerUpcast || 0);
        next.hp += gain;
      }
    }
    if (extra?.usePowerSurge && !isTech) {
      const surgeRes = characterResources(profile, next).find(r => r.id === "power_surge");
      if (surgeRes && surgeRes.value > 0) {
        const curSpent = next.spent.power_surge !== undefined ? next.spent.power_surge : Math.max(0, surgeRes.max - 1);
        next.spent.power_surge = Math.min(surgeRes.max, curSpent + 1);
      }
    }
    if (extra?.applyAshlaSelf && castLevel >= 1 && !isTech && power.alignment === "Light") {
      const prev = (next.effects || []).find(e => normalizeName(e.name) === "force affinity: ashla")?.value || 0;
      next.effects = (next.effects || []).filter(e => normalizeName(e.name) !== "force affinity: ashla");
      next.effects.push(conditionEntry("Force Affinity: Ashla", castLevel, false, {
        id: newID(),
        note: "+" + castLevel + " maximum & current HP (1 minute)",
        persistent: false,
        durationSpec: { anchor: "timed", value: 1, unit: "minute" },
        source: { kind: "classOption", name: "Force Affinity: Ashla" }
      }));
      const newMax = hitPointMaximum(profile, next);
      const delta = castLevel - prev;
      if (delta > 0) next.hp = Math.min(newMax, (next.hp || 0) + delta);
      else if ((next.hp || 0) > newMax) next.hp = newMax;
    }
  });
}
function addKnownPower(powerName) {
  update("Added power · " + powerName, (next, prof) => {
    if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
    if (!next.powers.some(n => normalizeName(n) === normalizeName(powerName))) {
      next.powers.push(powerName);
    }
  });
}

function removeKnownPower(powerName) {
  update("Removed power · " + powerName, (next, prof) => {
    if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
    next.powers = next.powers.filter(n => normalizeName(n) !== normalizeName(powerName));
  });
}

function openCastChooser(kind = "all", trigger = null, powerName = "") {
  const dialog = getElementById("castDialog");
  if (!dialog || dialog.open) return;
  castDraft = {
    trigger,
    kind,
    role: "",
    powerName,
    stage: powerName ? "options" : "roles"
  };
  renderCastChooser();
  dialog.showModal();
}

function filteredCastPowers(profile, kind, session = null) {
  const all = knownPowerRecords(profile, "", session);
  if (kind === "all") return all;
  if (kind === "Special") return all.filter(p => p.castingPeriod === "None" || p.castingPeriod === "Special");
  if (kind === "BonusAction" && typeof resolveCastingEffects === "function" && (resolveCastingEffects(profile, session).castingModifiers || []).some(m => m.enablesBonusActionCast)) {
    return all.filter(p => p.castingPeriod === "BonusAction" || (p.type === "Force" && p.castingPeriod === "Action"));
  }
  return all.filter(p => p.castingPeriod === kind);
}


const SW5E_MIN_ROLL_THRESHOLD = { 4: 2, 6: 2, 8: 3, 10: 4, 12: 5, 20: 8 };
const ABILITY_SHORT_MAP = { strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA" };

function matchesCastingScope(scope, power, rolls, castLevel) {
  if (!scope || typeof scope !== "object") return true;
  if (scope.hideInCastDialog) return false;
  const combat = power.combat || {};
  const pType = String(power.type || "").toLowerCase();
  const pAlign = String(power.alignment || "").toLowerCase();
  const effLvl = Number.isFinite(castLevel) ? castLevel : (power.level || 0);
  const baseLvl = power.level || 0;

  if (scope.powerType && String(scope.powerType).toLowerCase() !== "all") {
    if (pType !== String(scope.powerType).toLowerCase()) return false;
  }
  if (scope.alignment) {
    if (pAlign !== String(scope.alignment).toLowerCase()) return false;
  }
  if (scope.replacedAbility) {
    const rep = String(scope.replacedAbility).toLowerCase();
    if (pType !== "force") return false;
    if (rep === "wisdom" && pAlign === "dark") return false;
    if (rep === "charisma" && pAlign === "light") return false;
  }
  if (scope.minLevel !== undefined && Math.max(effLvl, baseLvl) < scope.minLevel) return false;
  if (scope.maxLevel !== undefined && baseLvl > scope.maxLevel) return false;
  if (scope.castingPeriod && power.castingPeriod !== scope.castingPeriod) return false;
  if (scope.canExtend && !combat.canExtend) return false;
  if (Array.isArray(scope.powerNames) && scope.powerNames.length) {
    const pNorm = normalizeName(power.name);
    if (!scope.powerNames.some(n => normalizeName(n) === pNorm)) return false;
  }
  const hasDmg = Boolean(combat.hasDamage || (power.roles || []).includes("Damage") || rolls.some(r => r.kind === "damage"));
  const hasHeal = Boolean(combat.hasHealing || (power.roles || []).includes("Healing") || rolls.some(r => r.kind === "healing"));
  if (scope.hasDamage && !hasDmg) return false;
  if (scope.hasHealing && !hasHeal) return false;
  if (scope.hasDamageOrHealing && !hasDmg && !hasHeal) return false;

  if (Array.isArray(scope.damageTypes) && scope.damageTypes.length) {
    const wantTypes = scope.damageTypes.map(t => String(t).toLowerCase());
    const rollTypes = rolls.map(r => (r.kind === "tempHP" ? "temphp" : String(r.damageType || "").toLowerCase()));
    if (!rollTypes.some(rt => wantTypes.includes(rt))) return false;
  }
  if (Array.isArray(scope.delivery) && scope.delivery.length) {
    const matchedDelivery = scope.delivery.some(d => {
      if (d === "save") return Boolean(combat.hasSave);
      if (d === "attack") return Boolean(combat.hasAttack);
      if (d === "ranged_attack") return Boolean(combat.hasAttack && combat.attackMode === "ranged");
      if (d === "melee_attack") return Boolean(combat.hasAttack && combat.attackMode === "melee");
      if (d === "weapon_attack") return combat.delivery === "weapon_attack";
      return false;
    });
    if (!matchedDelivery) return false;
  }
  if (Array.isArray(scope.saveAbilities) && scope.saveAbilities.length) {
    const sAb = String(combat.saveAbility || "").toLowerCase();
    if (!scope.saveAbilities.some(a => String(a).toLowerCase() === sAb)) return false;
  }
  return true;
}

function _scalePowerRoll(rawRoll, power, castLevel, charLvl, scores, pNums) {
  let diceCount = Number(rawRoll.diceCount) || 0;
  const baseDiceCount = diceCount;
  const dieSize = Number(rawRoll.dieSize) || 0;
  let flat = Number(rawRoll.flat) || 0;
  const baseFlat = flat;
  const sc = rawRoll.scaling || null;
  let hasScaling = false;

  if (sc) {
    if (sc.mode === "upcast" && dieSize > 0) {
      hasScaling = true;
      const baseL = sc.baseLevel || power.level || 1;
      const step = sc.stepLevels || 1;
      if (castLevel > baseL) {
        diceCount = baseDiceCount + Math.floor((castLevel - baseL) / step) * (sc.perStepDice || 1);
      }
    } else if (sc.mode === "upcast_flat") {
      hasScaling = true;
      const baseL = sc.baseLevel || power.level || 1;
      const step = sc.stepLevels || 1;
      if (castLevel > baseL) {
        flat = baseFlat + Math.floor((castLevel - baseL) / step) * (sc.perStepFlat || 0);
      }
    } else if (sc.mode === "upcast_tiers" && Array.isArray(sc.tiers)) {
      hasScaling = true;
      for (const [thr, cnt] of sc.tiers) {
        if (castLevel >= thr) diceCount = cnt;
      }
    } else if (sc.mode === "cantrip") {
      if (Array.isArray(sc.tiers)) {
        for (const [thr, cnt] of sc.tiers) {
          if (charLvl >= thr) diceCount = cnt;
        }
      } else if (sc.perTierAdd) {
        const steps = charLvl >= 17 ? 3 : charLvl >= 11 ? 2 : charLvl >= 5 ? 1 : 0;
        diceCount = baseDiceCount + steps * sc.perTierAdd;
      }
    }
  }

  let modAdd = 0;
  let modLabel = "";
  if (rawRoll.addCastingMod) {
    modAdd = modifier(scores[pNums.ability] || 10);
    modLabel = signed(modAdd) + " " + pNums.ability.slice(0, 3).toUpperCase();
  }

  return {
    kind: rawRoll.kind || "damage",
    diceCount,
    baseDiceCount,
    dieSize,
    flat,
    baseFlat,
    modAdd,
    modLabel,
    extraBonus: 0,
    extraLabels: [],
    damageType: rawRoll.damageType || "",
    label: rawRoll.label || "",
    hasScaling
  };
}

function formatPowerRollText(r, extraFlat = 0) {
  const parts = [];
  if (r.diceCount > 0 && r.dieSize > 0) {
    const diceStr = (r.minPerDie > 0 && typeof formatDiceWithMin === "function")
      ? formatDiceWithMin(r.diceCount, r.dieSize, r.minPerDie)
      : (r.diceCount + "d" + r.dieSize);
    parts.push(diceStr);
  }
  const totalFlat = (r.flat || 0) + (r.extraBonus || 0) + (extraFlat || 0);
  if (parts.length) {
    if (r.modLabel) parts.push(r.modLabel);
    if (totalFlat > 0) parts.push("+ " + totalFlat);
    else if (totalFlat < 0) parts.push("− " + Math.abs(totalFlat));
  } else {
    const combined = totalFlat + (r.modAdd || 0);
    if (combined !== 0) parts.push(String(combined));
    else if (r.label) return r.label;
  }
  const typeLabel = r.kind === "healing" ? "healing" : (r.kind === "tempHP" ? "temp HP" : (r.damageType === "weapon" ? "weapon damage" : (r.damageType === "chosen" ? "chosen damage" : r.damageType)));
  return (parts.join(" ") + (typeLabel ? " " + typeLabel : "")).trim();
}

function resolvePowerCombatStats(power, castLevel, casting, profile, session) {
  const combat = power.combat || {};
  const pNums = powerCastingNumbers(casting, power);
  const lvl = Number.isFinite(castLevel) ? castLevel : (power.level || 0);
  const charLvl = profile?.level || 1;
  const scores = effectiveScores(profile, session);
  const castEff = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : { castingModifiers: [], notes: [] };

  let delivery = "";
  let deliverySub = "";
  let deliveryLabel = "";
  if (combat.delivery === "save" && combat.saveAbility) {
    const abShort = ABILITY_SHORT_MAP[combat.saveAbility.toLowerCase()] || combat.saveAbility.slice(0, 3).toUpperCase();
    delivery = abShort + " Save DC " + pNums.dc;
    deliveryLabel = "Saving throw";
    if (combat.saveEffect === "half") deliverySub = "Half damage on success";
    else if (combat.saveEffect === "none") deliverySub = "No damage on success";
  } else if (combat.delivery === "attack" && combat.attackMode && combat.attackKind) {
    const mode = combat.attackMode.charAt(0).toUpperCase() + combat.attackMode.slice(1);
    const kindLbl = combat.attackKind === "tech" ? "Tech" : "Force";
    delivery = mode + " " + kindLbl + " Attack " + signed(pNums.attack);
    deliveryLabel = "Attack";
    const cPow = session && typeof conditionState === "function" ? conditionState(session, profile) : null;
    const atkAdv = [];
    const atkDisadv = [];
    if (cPow) {
      if (cPow.invisible) atkAdv.push("Invisible");
      if (cPow.exhaustion >= 3) atkDisadv.push("Exhaustion");
      if (cPow.blinded) atkDisadv.push("Blinded");
      if (cPow.poisoned) atkDisadv.push("Poisoned");
      if (cPow.frightened) atkDisadv.push("Frightened");
      if (cPow.restrained) atkDisadv.push("Restrained");
      if (cPow.prone && combat.attackMode === "melee") atkDisadv.push("Prone");
    }
    const modeNote = atkAdv.length && atkDisadv.length
      ? ("Normal (" + atkAdv.join(", ") + " vs " + atkDisadv.join(", ") + ")")
      : atkAdv.length
        ? ("Advantage (" + atkAdv.join(", ") + ")")
        : atkDisadv.length
          ? ("Disadvantage (" + atkDisadv.join(", ") + ")")
          : "";
    const proneRangedNote = (cPow?.prone && combat.attackMode === "ranged")
      ? ((typeof resolveDefenseEffects === "function" && resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "noProneCloseRangedDisadv"))
        ? ""
        : "Prone: disadvantage within 30 ft")
      : "";
    deliverySub = [
      pNums.ability + " (" + (power.type === "Force" ? (power.alignment || "Universal") : "Tech") + ")",
      modeNote,
      proneRangedNote
    ].filter(Boolean).join(" · ");
  } else if (combat.delivery === "weapon_attack" && combat.attackMode) {
    const mode = combat.attackMode.charAt(0).toUpperCase() + combat.attackMode.slice(1);
    delivery = mode + " Weapon Attack";
    deliveryLabel = "Attack";
    deliverySub = combat.saveAbility
      ? ("Weapon attack + " + (ABILITY_SHORT_MAP[combat.saveAbility.toLowerCase()] || combat.saveAbility.slice(0, 3).toUpperCase()) + " Save DC " + pNums.dc)
      : "Uses equipped weapon attack bonus";
  } else if (combat.delivery === "auto") {
    delivery = "Automatic Hit";
    deliveryLabel = "Delivery";
    deliverySub = "No attack roll or saving throw";
  }

  const rolls = (combat.rolls || [])
    .map(r => _scalePowerRoll(r, power, lvl, charLvl, scores, pNums))
    .filter(r => r.diceCount > 0 || r.flat > 0 || r.label);

  const hasScaling = rolls.some(r => r.hasScaling);

  // Evaluate structured castingModifiers from classes, archetypes, and feats
  let hasBogan = false;
  let hasAshla = false;
  let powerSurge = null;
  let powerAdept = null;
  let maxHealingDice = false;
  const activeModifierNotes = [];

  for (const mod of (castEff.castingModifiers || [])) {
    if (!matchesCastingScope(mod.castingScope, power, rolls, lvl)) continue;
    if (mod.kind === "minRollThreshold") {
      hasBogan = true;
    } else if (mod.kind === "ashlaBonusHP") {
      hasAshla = true;
    } else if (mod.kind === "powerSurge") {
      const surgeRes = characterResources(profile, session).find(r => r.id === (mod.resourceId || "power_surge"));
      const primaryDmgType = rolls.find(r => r.kind === "damage")?.damageType || "force";
      powerSurge = {
        bonus: Math.max(1, Math.floor(charLvl / 2)),
        left: surgeRes ? surgeRes.value : 0,
        max: surgeRes ? surgeRes.max : Math.max(1, modifier(scores[casting.forceAbility || "Wisdom"])),
        damageType: primaryDmgType,
        hasTutaminis: Boolean(mod.tutaminisMinLevel && charLvl >= mod.tutaminisMinLevel)
      };
    } else if (mod.kind === "dieFloor") {
      powerAdept = {
        label: mod.label || mod.sourceName || "Power Adept",
        minDieValue: mod.minDieValue || 2,
        ignoreResistance: Boolean(mod.ignoreResistance),
        text: mod.text || ""
      };
    } else if (mod.kind === "healingBonus") {
      const bonusVal = 2 + Math.max(1, lvl);
      for (const r of rolls) {
        if (r.kind === "healing") {
          r.extraBonus += bonusVal;
          r.extraLabels.push("+" + bonusVal + " " + (mod.label || mod.sourceName));
        }
      }
    } else if (mod.kind === "maxHealingDice") {
      maxHealingDice = true;
    } else if (mod.kind === "damageModBonus") {
      const bonusVal = mod.bonusFormula === "max(1, intMod)"
        ? Math.max(1, modifier(scores.Intelligence || 10))
        : Math.max(1, modifier(scores[pNums.ability] || 10));
      const firstDmg = rolls.find(r => r.kind === "damage");
      if (firstDmg) {
        firstDmg.extraBonus += bonusVal;
        firstDmg.extraLabels.push("+" + bonusVal + " " + (mod.label || mod.sourceName));
      }
    } else if (mod.kind === "maxDamageOnNat1Save" || mod.kind === "note") {
      const mTitle = mod.label || mod.sourceName;
      const mText = mod.text || "";
      if (!activeModifierNotes.some(x => x.title === mTitle && x.text === mText)) {
        activeModifierNotes.push({ title: mTitle, text: mText });
      }
    }
  }

  // Stamp per-roll minPerDie (Bogan Ch. 7 + Power Adept dieFloor) onto damage rolls
  for (const r of rolls) {
    if (r.kind !== "damage" || !(r.diceCount > 0 && r.dieSize > 0)) continue;
    let mpd = 0;
    if (hasBogan && SW5E_MIN_ROLL_THRESHOLD[r.dieSize]) mpd = Math.max(mpd, SW5E_MIN_ROLL_THRESHOLD[r.dieSize]);
    if (powerAdept && powerAdept.minDieValue > 0) mpd = Math.max(mpd, powerAdept.minDieValue);
    if (mpd > 0) r.minPerDie = mpd;
  }

  // Bogan Ch. 7 Minimum Roll Threshold calculation across all damage dice
  let boganMinPerDie = 0;
  let boganMinTotal = 0;
  let boganDetail = "";
  if (hasBogan) {
    const dmgRollsWithDice = rolls.filter(r => r.kind === "damage" && r.diceCount > 0 && SW5E_MIN_ROLL_THRESHOLD[r.dieSize]);
    if (dmgRollsWithDice.length === 1) {
      const r0 = dmgRollsWithDice[0];
      boganMinPerDie = SW5E_MIN_ROLL_THRESHOLD[r0.dieSize];
      boganMinTotal = boganMinPerDie * r0.diceCount + (r0.flat || 0) + (r0.extraBonus || 0);
      boganDetail = "Min " + boganMinPerDie + " per d" + r0.dieSize;
    } else if (dmgRollsWithDice.length > 1) {
      const parts = [];
      for (const r of dmgRollsWithDice) {
        const thr = SW5E_MIN_ROLL_THRESHOLD[r.dieSize];
        boganMinTotal += thr * r.diceCount + (r.flat || 0) + (r.extraBonus || 0);
        parts.push(thr + "/d" + r.dieSize);
      }
      boganMinPerDie = SW5E_MIN_ROLL_THRESHOLD[dmgRollsWithDice[0].dieSize];
      boganDetail = "Min " + [...new Set(parts)].join(", ");
    }
  }

  // Back-compat convenience fields for primary roll
  const primary = rolls[0] || null;
  return {
    pNums,
    delivery,
    deliveryLabel,
    deliverySub,
    rolls,
    diceCount: primary?.diceCount || 0,
    baseDiceCount: primary?.baseDiceCount || 0,
    dieSize: primary?.dieSize || 0,
    dmgType: primary?.damageType || "",
    isHealing: primary?.kind === "healing",
    flatMod: (primary?.flat || 0) + (primary?.modAdd || 0) + (primary?.extraBonus || 0),
    flatLabel: primary?.modLabel || "",
    hasScaling,
    hasBogan,
    boganMinPerDie,
    boganMinTotal,
    boganDetail,
    hasAshla,
    powerSurge,
    powerAdept,
    maxHealingDice,
    activeModifierNotes
  };
}

// Keep alias for any external caller
const parsePowerCombatStats = resolvePowerCombatStats;

function relevantCastingNotes(profile, session, power, stats, castLevel = null) {
  if (typeof resolveContextualNotes !== "function") return stats?.activeModifierNotes || [];
  const all = resolveContextualNotes(profile, session, "casting") || [];
  const rolls = stats?.rolls || [];
  const lvl = Number.isFinite(castLevel) ? castLevel : (power.level || 0);
  const out = [...(stats?.activeModifierNotes || [])];
  const seen = new Set(out.map(x => normalizeName(x.title)));
  for (const n of all) {
    if (n.castingScope?.signatureOnly && !(session?.signaturePower && normalizeName(session.signaturePower) === normalizeName(power.name))) continue;
    if (!matchesCastingScope(n.castingScope, power, rolls, lvl)) continue;
    const key = normalizeName(n.title);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function renderCastChooser() {
  const {profile, session} = app.character;
  const title = getElementById("castTitle");
  const body = getElementById("castBody");
  const back = getElementById("castBack");
  const {kind, role, powerName, stage} = castDraft;
  back.hidden = stage === "roles" || (stage === "options" && !role);
  title.textContent = stage === "options" ? powerName :
    stage === "list" ? role : (powerCastContexts[kind] || "Cast a power");
  body.replaceChildren();

  const records = filteredCastPowers(profile, kind, session);
  if (stage === "roles") {
    const grid = appendText(body, "div", "");
    grid.className = "castRoleGrid";
    for (const r of [...POWER_ROLES, "All powers"]) {
      const count = records.filter(p => r === "All powers" || (p.roles || []).includes(r)).length;
      const btn = collectionButton(grid, "", r + " (" + count + ")", "castRole", r);
      if (powerRoleIcons[r]) appendText(btn, "span", powerRoleIcons[r]).setAttribute("aria-hidden", "true");
      appendText(btn, "span", r);
      appendText(btn, "small", String(count));
      btn.disabled = !count;
    }
    if (!records.length) appendText(body, "p", "No powers match this timing.").className = "muted";
  } else if (stage === "list") {
    const list = appendText(body, "div", "");
    list.className = "castSpellList";
    const subset = records.filter(p => role === "All powers" || (p.roles || []).includes(role));
    let currentLvl = -1;
    for (const p of subset) {
      if (p.level !== currentLvl) {
        currentLvl = p.level;
        appendText(list, "h3", currentLvl ? "Level " + currentLvl + " (" + powerPointCost(currentLvl) + " points)" : "At-will");
      }
      const row = collectionButton(list, "", p.name, "castChoose", p.name);
      row.className = "castSpellRow";
      row.replaceChildren();
      appendText(row, "span", p.name);
      if (p.concentration) {
        const mark = appendText(row, "span", "C");
        mark.className = "spellProperty castMark";
        mark.title = "Concentration";
      }
      const qTag = (kind === "BonusAction" && p.castingPeriod === "Action" && p.type === "Force") ? "Quickened (+2) · " : "";
      appendText(row, "small", qTag + p.type);
    }
  } else {
    const power = knownPowerRecords(profile, "", session).find(p => normalizeName(p.name) === normalizeName(powerName)) || powerRule(powerName);
    if (!power) return;
    const casting = castingStats(profile, session);
    const metaLine = [
      power.type + (power.alignment ? " · " + power.alignment : ""),
      power.castingPeriodText,
      power.range,
      (power.concentration ? "Concentration, " : "") + power.duration
    ].filter(Boolean).join(" · ");
    appendText(body, "p", metaLine).className = "muted";
    const controlsTop = appendText(body, "div", "");
    controlsTop.className = "castControlsTop";

    if (power.concentration) {
      const castEffDlg = typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : null;
      const maxConc = castEffDlg?.maxConcurrentConcentration || 1;
      const curConcs = activeConcentrations(session);
      if (curConcs.length && !curConcs.some(n => normalizeName(n) === normalizeName(power.name))) {
        if (maxConc >= 2 && curConcs.length < maxConc) {
          const dualSrc = castEffDlg?.dualConcentrationSource || "Dual Concentration";
          const dualNote = castEffDlg?.dualConcentrationNote || "Maintain concentration on both powers simultaneously (spend your Action each round; end-of-turn Constitution saving throw DC 10 + complete rounds; damage Constitution saving throw DC max(10 + combined levels, half damage)).";
          appendText(body, "p", dualSrc + ": you will concentrate on " + curConcs[0] + " and " + power.name + " simultaneously. " + dualNote).className = "muted";
        } else {
          appendText(body, "p", "Casting this ends Concentration on " + curConcs.join(" and ") + ".").className = "importWarning";
        }
      }
    }

    let trackCheckbox = null;
    let selectedChoice = "";
    const selectedChoices = new Set();
    const choiceCfg = power.effects?.choiceKind ? powerChoiceConfig(power.effects.choiceKind, profile, session) : null;
    const castButtons = [];

    if (power.ongoing) {
      const wrap = appendText(body, "label", "");
      wrap.className = "row";
      trackCheckbox = document.createElement("input");
      trackCheckbox.type = "checkbox";
      trackCheckbox.id = "castTrackEffect";
      const isDebuff = Boolean(power.effects?.targetDebuff);
      trackCheckbox.checked = !isDebuff;
      wrap.append(trackCheckbox, document.createTextNode(isDebuff ? " Apply debuff to MY sheet (normally targets a foe)" : " Add to Active Effects"));
      body.append(wrap);
    }

    const disabledHint = appendText(body, "small", "");
    disabledHint.className = "castDisabledHint";
    disabledHint.hidden = true;

    // Contextual Force-Empowered Casting options (only owned & applicable to THIS power)
    const fecOptions = applicableForceEmpoweredOptions(profile, session, power);
    const selectedFec = new Set();
    const bonusCastOpt = kind === "BonusAction" && power.castingPeriod === "Action"
      ? fecOptions.find(o => o.spec.enablesBonusActionCast)
      : null;
    if (bonusCastOpt) selectedFec.add(bonusCastOpt.name);
    const extraFecCostForLevel = lvl => {
      let total = 0;
      for (const opt of fecOptions) {
        if (selectedFec.has(opt.name)) total += opt.spec.cost(lvl);
      }
      return total;
    };

    const fecCap = splashFecCapStats(profile, session);
    if (fecOptions.length) {
      const fecWrap = appendText(body, "div", ""); fecWrap.className = "castPreControl";
      fecWrap.style.marginTop = "10px";
      const fecCapLabel = fecCap.active ? (" · " + fecCap.remaining + "/" + fecCap.max + " Force points left") : "";
      appendText(fecWrap, "small", "Force-Empowered Casting (optional" + fecCapLabel + ")").className = "muted";
      const fecPills = appendText(fecWrap, "div", "");
      fecPills.className = "row wrap";
      fecPills.style.marginTop = "6px";
      const renderFecPills = () => {
        fecPills.replaceChildren();
        for (const opt of fecOptions) {
          const baseC = opt.spec.cost(power.level || 1);
          const costLbl = opt.spec.fpCostFormula === "powerLevelMin1" ? "+" + (power.level ? "level" : "1") + " FP" : "+" + baseC + " " + (baseC === 1 ? "point" : "points");
          const pill = appendText(fecPills, "button", opt.name + " (" + costLbl + ")");
          pill.type = "button";
          pill.className = "swPropChip";
          pill.setAttribute("aria-pressed", String(selectedFec.has(opt.name)));
          pill.addEventListener("click", () => {
            if (selectedFec.has(opt.name)) {
              selectedFec.delete(opt.name);
            } else {
              // SW5e rule: only 1 Force-Empowered Casting per cast, except stackable options (e.g. Improved Power)
              if (!opt.spec.stackable) {
                for (const existingName of [...selectedFec]) {
                  const exOpt = fecOptions.find(o => o.name === existingName);
                  if (!exOpt?.spec?.stackable) selectedFec.delete(existingName);
                }
              }
              selectedFec.add(opt.name);
            }
            renderFecPills();
            syncCastDisabled();
          });
        }
      };
      renderFecPills();
    }

    const baseStats = resolvePowerCombatStats(power, power.level || 0, casting, profile, session);
    const hasAshla = Boolean(baseStats.hasAshla);
    let ashlaTarget = "self";
    let usePowerSurge = false;

    const combatStrip = document.createElement("div");
    combatStrip.className = "castCombatStrip";
    controlsTop.prepend(combatStrip);

    const _populateCombatStrip = (container, stats, withSurge, isResolved = false) => {
      container.replaceChildren();
      const hasAny = Boolean(stats.delivery || stats.rolls.length || stats.hasBogan || stats.powerAdept || stats.maxHealingDice);
      container.hidden = !hasAny;
      if (!hasAny) return;
      if (stats.delivery) {
        const c = appendText(container, "div", "");
        c.className = "castCombatCell";
        appendText(c, "span", stats.deliveryLabel || "Delivery").className = "castCombatLabel";
        appendText(c, "span", stats.delivery).className = "castCombatVal";
        if (stats.deliverySub) appendText(c, "span", stats.deliverySub).className = "castCombatSub";
      }
      if (stats.rolls.length) {
        const c = appendText(container, "div", "");
        c.className = "castCombatCell";
        const firstKind = stats.rolls[0].kind;
        const lbl = firstKind === "healing" ? (isResolved ? "Healing roll" : "Healing")
          : firstKind === "tempHP" ? "Temporary HP"
          : (isResolved ? "Damage roll" : "Damage");
        appendText(c, "span", lbl).className = "castCombatLabel";
        const surgeBonus = (withSurge && stats.powerSurge) ? stats.powerSurge.bonus : 0;
        const rollTexts = stats.rolls.map((r, idx) => formatPowerRollText(r, idx === 0 && r.kind === "damage" ? surgeBonus : 0));
        appendText(c, "span", rollTexts.join(" + ")).className = "castCombatVal";
        const subParts = [];
        for (const r of stats.rolls) {
          if (r.label && r.diceCount > 0) subParts.push(r.label);
          for (const ex of (r.extraLabels || [])) subParts.push(ex);
        }
        if (withSurge && stats.powerSurge) {
          subParts.push(isResolved
            ? ("Power Surge applied (" + stats.powerSurge.left + "/" + stats.powerSurge.max + " left)")
            : ("Includes +" + stats.powerSurge.bonus + " Power Surge"));
        }
        if (!isResolved && stats.hasScaling && stats.diceCount === stats.baseDiceCount) subParts.push("Scales with cast level");
        if (stats.maxHealingDice && firstKind === "healing" && stats.rolls[0].diceCount > 0) {
          const r0 = stats.rolls[0];
          const maxTotal = r0.diceCount * r0.dieSize + (r0.flat || 0) + (r0.modAdd || 0) + (r0.extraBonus || 0);
          subParts.push("Supreme Healing: " + maxTotal + " HP (max dice)");
        }
        if (subParts.length) appendText(c, "span", subParts.join(" · ")).className = "castCombatSub";
      }
      if (stats.hasBogan) {
        const c = appendText(container, "div", "");
        c.className = "castCombatCell";
        appendText(c, "span", "Force Affinity: Bogan").className = "castCombatLabel";
        if (stats.boganMinPerDie) {
          const totalMin = stats.boganMinTotal + ((withSurge && stats.powerSurge) ? stats.powerSurge.bonus : 0);
          appendText(c, "span", stats.boganDetail || ("Min " + stats.boganMinPerDie + " per d" + stats.dieSize)).className = "castCombatVal";
          appendText(c, "span", "Minimum " + totalMin + " total (Ch. 7 threshold)").className = "castCombatSub";
        } else {
          appendText(c, "span", "Min roll threshold").className = "castCombatVal";
          appendText(c, "span", "2 (d4/d6) · 3 (d8) · 4 (d10) · 5 (d12)").className = "castCombatSub";
        }
      }
      if (stats.powerAdept) {
        const c = appendText(container, "div", "");
        c.className = "castCombatCell";
        appendText(c, "span", stats.powerAdept.label).className = "castCombatLabel";
        appendText(c, "span", "Treat 1s as " + stats.powerAdept.minDieValue + "s").className = "castCombatVal";
        if (stats.powerAdept.ignoreResistance) appendText(c, "span", "Ignores resistance").className = "castCombatSub";
      }
    };
    const renderCombatStrip = (stats, withSurge) => _populateCombatStrip(combatStrip, stats, withSurge, false);
    renderCombatStrip(baseStats, false);

    if (baseStats.powerSurge) {
      const ps = baseStats.powerSurge;
      const psWrap = appendText(body, "div", ""); psWrap.className = "castPreControl";
      psWrap.style.marginTop = "10px";
      appendText(psWrap, "small", "Way of Negation: Power Surge (once per turn)").className = "muted";
      const psRow = appendText(psWrap, "div", "");
      psRow.className = "row wrap";
      psRow.style.marginTop = "6px";
      const psBtn = appendText(psRow, "button", "Power Surge (+" + ps.bonus + " " + ps.damageType + " · " + ps.left + "/" + ps.max + " stored)");
      psBtn.type = "button";
      psBtn.className = "swPropChip";
      psBtn.disabled = ps.left <= 0;
      psBtn.setAttribute("aria-pressed", "false");
      if (ps.left <= 0) psBtn.title = "No Power Surges stored (gain surges by ending force powers or via Force Deflection / Force Shield)";
      psBtn.addEventListener("click", () => {
        usePowerSurge = !usePowerSurge;
        psBtn.setAttribute("aria-pressed", String(usePowerSurge));
        renderCombatStrip(baseStats, usePowerSurge);
      });
      if (ps.hasTutaminis) {
        appendText(psWrap, "small", "Tutaminis Mastery (L18): you can also spend 1 Power Surge to waive the Force Point cost of a Force-Empowered Casting option.").className = "muted";
      }
    }

    if (hasAshla) {
      const ashlaWrap = appendText(body, "div", ""); ashlaWrap.className = "castPreControl";
      ashlaWrap.style.marginTop = "10px";
      appendText(ashlaWrap, "small", "Force Affinity: Ashla (+power level maximum & current HP for 1 minute)").className = "muted";
      const aPills = appendText(ashlaWrap, "div", "");
      aPills.className = "row wrap";
      aPills.style.marginTop = "6px";
      for (const [val, lbl] of [["self", "Apply to myself"], ["ally", "Apply to target (ally)"]]) {
        const b = appendText(aPills, "button", lbl);
        b.type = "button";
        b.className = "swPropChip";
        b.setAttribute("aria-pressed", String(ashlaTarget === val));
        b.addEventListener("click", () => {
          ashlaTarget = val;
          for (const el of aPills.querySelectorAll("button")) el.setAttribute("aria-pressed", String(el === b));
        });
      }
    }

    const castMods = relevantCastingNotes(profile, session, power, baseStats);
    if (castMods.length) {
      const mBox = appendText(body, "div", "");
      mBox.className = "castModList";
      appendText(mBox, "span", "Active casting modifiers").className = "castModListTitle";
      for (const n of castMods) {
        const mRow = appendText(mBox, "div", "");
        mRow.className = "castModRow";
        appendText(mRow, "strong", n.title + ": ");
        mRow.append(document.createTextNode(n.text));
      }
    }

    const syncCastDisabled = () => {
      const needsChoice = Boolean(choiceCfg && trackCheckbox?.checked);
      const hasChoice = choiceCfg?.multi ? selectedChoices.size > 0 : Boolean(selectedChoice);
      const reasons = [];
      if (needsChoice && !hasChoice) reasons.push(choiceCfg.label + " to enable casting.");
      const poolType = powerPoolType(power, casting);
      const usesTechPool = poolType === "Tech";
      const remPoints = usesTechPool ? casting.techTotalRemaining : casting.forceTotalRemaining;
      const poolMax = usesTechPool ? casting.techMax : casting.forceMax;
      for (const {btn, opt} of castButtons) {
        const extraC = extraFecCostForLevel(opt.level);
        const totalCost = opt.cost + extraC;
        const lvlStats = baseStats.hasScaling ? resolvePowerCombatStats(power, opt.level, casting, profile, session) : null;
        const diceParts = (lvlStats?.rolls || [])
          .map(r => r.diceCount && r.dieSize
            ? ((r.minPerDie > 0 && typeof formatDiceWithMin === "function") ? formatDiceWithMin(r.diceCount, r.dieSize, r.minPerDie) : (r.diceCount + "d" + r.dieSize))
            : (r.flat > 0 ? String(r.flat + (r.extraBonus || 0)) : ""))
          .filter(Boolean);
        const diceSuffix = diceParts.length ? (" · " + diceParts.join("+")) : "";
        btn.textContent = opt.freeCastId
          ? ((opt.labelOverride || "Cast free") + " (" + opt.freeLeft + "/" + opt.freeMax + " left" + (extraC > 0 ? " · +" + extraC + " " + (extraC === 1 ? "point" : "points") : "") + diceSuffix + ")")
          : opt.level === 0
            ? (totalCost > 0 ? "Cast at-will (" + totalCost + " " + (totalCost === 1 ? "point" : "points") + ")" : "Cast at-will")
            : (opt.labelOverride || ("Cast Level " + opt.level)) + " (" + totalCost + " " + (totalCost === 1 ? "point" : "points") + diceSuffix + ")";
        const lackTotal = totalCost > 0 && poolMax > 0 && totalCost > remPoints;
        const lackFecCap = !usesTechPool && fecCap.active && extraC > fecCap.remaining;
        const reason = opt.reason || (lackFecCap ? "Exceeds Splashclass Force-Empowered Casting cap (" + fecCap.remaining + "/" + fecCap.max + " Force points left)" : (lackTotal ? "Needs " + totalCost + " " + poolType + " points (" + remPoints + " left)" : ""));
        btn.disabled = Boolean(reason) || (needsChoice && !hasChoice);
        if (reason) {
          btn.title = reason;
          if (!reasons.includes(reason)) reasons.push(reason);
        } else {
          btn.title = "";
        }
      }
      disabledHint.textContent = reasons.join(" · ");
      disabledHint.hidden = !reasons.length;
    };

    if (choiceCfg) {
      const cWrap = appendText(body, "div", "");
      cWrap.style.marginTop = "10px";
      appendText(cWrap, "small", choiceCfg.label).className = "muted";
      const pills = appendText(cWrap, "div", "");
      pills.className = "row wrap";
      pills.style.marginTop = "6px";
      for (const optVal of choiceCfg.options) {
        const pill = appendText(pills, "button", optVal);
        pill.type = "button";
        pill.className = "swPropChip";
        pill.setAttribute("aria-pressed", "false");
        pill.addEventListener("click", () => {
          if (choiceCfg.multi) {
            if (selectedChoices.has(optVal)) selectedChoices.delete(optVal);
            else selectedChoices.add(optVal);
            pill.setAttribute("aria-pressed", String(selectedChoices.has(optVal)));
          } else {
            selectedChoice = optVal;
            for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === optVal));
          }
          syncCastDisabled();
        });
      }
      if (trackCheckbox) trackCheckbox.addEventListener("change", syncCastDisabled);
    }

    const opts = powerCastOptions(profile, session, power);
    const row = appendText(controlsTop, "div", "");
    row.className = "row wrap";
    row.style.marginTop = "12px";

    const showResolvedCast = (opt, extraC, usedSurge, usedFec) => {
      const curChar = app.character;
      const postCasting = curChar ? castingStats(curChar.profile, curChar.session) : casting;
      const postStats = parsePowerCombatStats(power, opt.level, postCasting, curChar?.profile || profile, curChar?.session || session);
      const pType = powerPoolType(power, postCasting);
      const totalSpent = opt.freeCastId ? extraC : (opt.cost + extraC);
      const remStr = pType === "Tech"
        ? (postCasting.techRemaining + "/" + postCasting.techMax + " Tech Points left")
        : (postCasting.forceRemaining + "/" + postCasting.forceMax + " Force Points left");

      for (const el of body.querySelectorAll(".castPreControl")) el.hidden = true;
      controlsTop.replaceChildren();
      const banner = appendText(controlsTop, "div", "");
      banner.className = "castResolvedBanner";

      const head = appendText(banner, "div", "");
      head.className = "castResolvedHead";
      appendText(head, "span", "Cast " + power.name + (opt.level > 0 ? (" at Level " + opt.level) : " (At-Will)")).className = "castResolvedTitle";
      const costSummary = (totalSpent > 0 ? ("−" + totalSpent + " " + pType + " " + (totalSpent === 1 ? "point" : "points") + " · ") : "Free cast · ") + remStr;
      appendText(head, "span", costSummary).className = "castResolvedPool";

      const resStrip = appendText(banner, "div", "");
      resStrip.className = "castCombatStrip";
      resStrip.style.marginBottom = "0";
      _populateCombatStrip(resStrip, postStats, usedSurge, true);

      if (usedFec.length || power.concentration) {
        const notes = [];
        if (usedFec.length) notes.push("Force-Empowered: " + usedFec.join(", "));
        if (power.concentration) notes.push("Concentrating on " + power.name);
        appendText(banner, "small", notes.join(" · ")).className = "muted";
      }

      const actRow = appendText(banner, "div", "");
      actRow.className = "castResolvedActions";
      const undoBtn = appendText(actRow, "button", "Undo");
      undoBtn.type = "button";
      undoBtn.addEventListener("click", () => {
        if (typeof undo === "function") undo();
        renderCastChooser();
      });
      const againBtn = appendText(actRow, "button", "Cast again");
      againBtn.type = "button";
      againBtn.addEventListener("click", () => renderCastChooser());
      const doneBtn = appendText(actRow, "button", "Done");
      doneBtn.type = "button";
      doneBtn.className = "primaryBtn";
      doneBtn.addEventListener("click", () => getElementById("castDialog")?.close());
    };

    for (const opt of opts) {
      const label = opt.level === 0 ? "Cast at-will" : "Cast Level " + opt.level + " (" + opt.cost + " points)";
      const btn = appendText(row, "button", label);
      btn.type = "button";
      btn.disabled = opt.disabled;
      if (opt.reason) btn.title = opt.reason;
      castButtons.push({btn, opt});
      btn.addEventListener("click", () => {
        const track = Boolean(trackCheckbox?.checked);
        const extraC = extraFecCostForLevel(opt.level);
        const usedSurge = Boolean(usePowerSurge && baseStats.powerSurge && baseStats.powerSurge.left > 0);
        const usedFec = [...selectedFec];
        castPower(power.name, opt.level, track, selectedChoice, choiceCfg?.multi ? [...selectedChoices] : null, {
          fecNames: usedFec,
          fecCost: extraC,
          freeCastId: opt.freeCastId || "",
          costOverride: Number.isFinite(opt.costOverride) ? opt.costOverride : undefined,
          applyAshlaSelf: hasAshla && ashlaTarget === "self",
          usePowerSurge: usedSurge
        });
        showResolvedCast(opt, extraC, usedSurge, usedFec);
      });
    }
    syncCastDisabled();
    const pNums = powerCastingNumbers(casting, power);
    const activePoolType = powerPoolType(power, casting);
    const pool = activePoolType === "Tech"
      ? "Tech Points: " + casting.techRemaining + "/" + casting.techMax + (casting.tempTech ? " (+" + casting.tempTech + " temporary)" : "") + " · DC " + pNums.dc + " · " + signed(pNums.attack) + " to hit (" + pNums.ability + ")"
      : "Force Points: " + casting.forceRemaining + "/" + casting.forceMax + (casting.tempForce ? " (+" + casting.tempForce + " temporary)" : "") + " · " + (power.alignment || "Universal") + " DC " + pNums.dc + " · " + signed(pNums.attack) + " to hit (" + pNums.ability + ")";
    appendText(controlsTop, "small", pool).className = "muted";
    const effSummary = summarizePowerEffects(power.effects);
    if (effSummary) appendText(controlsTop, "small", "Sheet effects: " + effSummary).className = "muted";
    const desc = appendText(body, "div", "");
    desc.className = "infoRules castDescVisible";
    appendRules(desc, power.description + (power.higherLevel ? "\n\nAt Higher Levels: " + power.higherLevel : ""));
  }
}

function renderTypedPowerList(profile, session, powerType, listId, metaId, searchId) {
  const root = getElementById(listId);
  const meta = getElementById(metaId);
  if (!root) return;
  root.replaceChildren();
  const casting = castingStats(profile, session);
  const records = knownPowerRecords(profile, powerType, session);
  const query = (getElementById(searchId)?.value || "").trim().toLowerCase();
  const filtered = records.filter(p => !query || (p.name + " " + p.castingPeriodText + " " + p.duration + " " + (p.description || "")).toLowerCase().includes(query));

  if (meta) {
    if (powerType === "Force") {
      const byCls = Array.isArray(casting.forceKnownByClass) && casting.forceKnownByClass.length > 1
        ? (" (" + casting.forceKnownByClass.map(c => c.className + " " + c.levels + ": " + c.knownCap).join(", ") + ")")
        : "";
      const knownLabel = casting.forceKnownCap > 0
        ? (casting.forceKnownUsed + " / " + casting.forceKnownCap + " known" + (casting.forceBonusKnown > 0 ? " (+" + casting.forceBonusKnown + " bonus)" : "") + byCls)
        : (records.length + " known");
      const dcLabel = casting.lightDC !== casting.darkDC
        ? "Light DC " + casting.lightDC + " (" + signed(casting.lightAttack) + " " + casting.lightAbility + ") · Dark DC " + casting.darkDC + " (" + signed(casting.darkAttack) + " " + casting.darkAbility + ")"
        : "DC " + casting.forceDC + " (" + signed(casting.forceAttack) + " · " + casting.forceAbility + ")";
      meta.textContent = knownLabel + " · " + dcLabel +
        (casting.forceMax ? " · " + casting.forceRemaining + "/" + casting.forceMax + (casting.tempForce ? " (+" + casting.tempForce + " temporary)" : "") + " points" : "");
    } else {
      const byCls = Array.isArray(casting.techKnownByClass) && casting.techKnownByClass.length > 1
        ? (" (" + casting.techKnownByClass.map(c => c.className + " " + c.levels + ": " + c.knownCap).join(", ") + ")")
        : "";
      const knownLabel = casting.techKnownCap > 0
        ? (casting.techKnownUsed + " / " + casting.techKnownCap + " known" + (casting.techBonusKnown > 0 ? " (+" + casting.techBonusKnown + " bonus)" : "") + byCls)
        : (records.length + " known" + (casting.techBonusKnown > 0 ? " (" + casting.techBonusKnown + " bonus)" : ""));
      meta.textContent = knownLabel + " · DC " + casting.techDC + " (" + signed(casting.techAttack) + " · " + casting.techAbility + ")" +
        (casting.techMax ? " · " + casting.techRemaining + "/" + casting.techMax + " points" : (casting.techUsesForcePoints ? " · Uses Force Points" : ""));
    }
  }

  if (typeof resolveContextualNotes === "function") {
    const cNotes = resolveContextualNotes(profile, session, "casting");
    for (const cn of cNotes) {
      appendText(root, "p", `${cn.title}: ${cn.text} (${cn.source})`).className = "muted";
    }
  }

  if (!filtered.length) {
    appendText(root, "p", records.length ? "No matching " + powerType.toLowerCase() + " powers." : "No " + powerType.toLowerCase() + " powers known yet.").className = "muted";
    return;
  }

  const blocked = isIncapacitated(session);
  let currentLevel = -1;
  for (const p of filtered) {
    if (p.level !== currentLevel) {
      currentLevel = p.level;
      appendText(root, "h3", currentLevel ? "Level " + currentLevel + " (" + powerPointCost(currentLevel) + " points)" : "At-will");
    }
    const isBonusNonCounting = Boolean(casting.nonCountingPowerSet?.has(normalizeName(p.name)));
    const summary = [
      isBonusNonCounting ? "Bonus (doesn't count)" : "",
      p.castingPeriodText,
      p.range,
      (p.concentration ? "Concentration, " : "") + p.duration,
      summarizePowerEffects(p.effects)
    ].filter(Boolean).join(" · ");
    const controls = collectionRow(root, p.name, summary, () => showPowerInfo(p));
    const castBtn = ownedControl(controls, "Cast", p.name, event => openCastChooser("all", event.currentTarget, p.name));
    const isReactionPower = normalizeName(p.castingPeriod) === "reaction" || normalizeName(p.castingPeriodText).startsWith("1 reaction");
    const reactionBlocked = isReactionPower && typeof canReact === "function" && !canReact(session);
    castBtn.disabled = blocked || reactionBlocked;
    if (blocked) castBtn.title = "Unavailable while Incapacitated";
    else if (reactionBlocked) castBtn.title = conditionState(session, profile).shocked ? "Unavailable while Shocked" : "Unavailable while reactions are blocked";
    ownedControl(controls, "Remove", p.name, () => removeKnownPower(p.name));
  }
}

function renderPowerManager(profile, session) {
  const casting = castingStats(profile, session);
  const forceTab = getElementById("forcePowerTab");
  const techTab = getElementById("techPowerTab");
  if (forceTab) forceTab.hidden = !casting.hasForce;
  if (techTab) techTab.hidden = !casting.hasTech;

  const fc = getElementById("forcePowerTabCount");
  if (fc) fc.textContent = String(knownPowerRecords(profile, "Force", session).length);
  const tc = getElementById("techPowerTabCount");
  if (tc) tc.textContent = String(knownPowerRecords(profile, "Tech", session).length);

  renderTypedPowerList(profile, session, "Force", "knownForcePowerList", "forcePowerMeta", "knownForceSearch");
  renderTypedPowerList(profile, session, "Tech", "knownTechPowerList", "techPowerMeta", "knownTechSearch");
  if (getElementById("powerCatalog")?.open) renderPowerLibrary();
}

function _powerSearchText(p) {
  if (p._searchText === undefined) {
    p._searchText = (p.name + " " + (p.alignment || "") + " " + (p.castingPeriodText || "") + " " + (p.roles || []).join(" ") + " " + (p.description || "")).toLowerCase();
  }
  return p._searchText;
}

function renderPowerLibrary() {
  const run = () => _renderPowerLibraryInner();
  if (typeof withEffectCache === "function") return withEffectCache(run);
  return run();
}

function _renderPowerLibraryInner() {
  const list = getElementById("powerCatalogList");
  if (!list || typeof SW5E_POWERS === "undefined") return;
  const {profile, session} = app.character;
  const knownSet = new Set(activePowerNames(profile, session).map(normalizeName));
  const title = getElementById("powerCatalogTitle");
  if (title) title.textContent = powerLibraryType + " power library";
  const query = (getElementById("powerSearch")?.value || "").trim().toLowerCase();
  const levelFilter = powerLevelFilterVal;
  const timingFilter = getElementById("powerTimingFilter")?.value || "";
  const alignEl = getElementById("powerAlignFilter");
  if (alignEl) alignEl.hidden = powerLibraryType === "Tech";
  const alignFilter = powerLibraryType === "Tech" ? "" : (alignEl?.value || "");
  const roleFilter = getElementById("powerRoleFilter")?.value || "";
  const sortMode = getElementById("powerSort")?.value || "available";
  const availOnly = getElementById("powerAvailableOnly")?.getAttribute("aria-pressed") === "true";

  const matches = SW5E_POWERS.filter(p => {
    if (p.type !== powerLibraryType) return false;
    if (levelFilter !== "" && String(p.level) !== levelFilter) return false;
    if (timingFilter) {
      if (timingFilter === "Special") {
        if (["Action", "BonusAction", "Reaction"].includes(p.castingPeriod)) return false;
      } else if (p.castingPeriod !== timingFilter) return false;
    }
    if (alignFilter && p.alignment !== alignFilter) return false;
    if (roleFilter && !(p.roles || []).includes(roleFilter)) return false;
    if (!query) return true;
    return _powerSearchText(p).includes(query);
  }).map(p => {
    const owned = knownSet.has(normalizeName(p.name));
    const prereq = typeof checkPowerPrerequisite === "function"
      ? checkPowerPrerequisite(profile, session, p)
      : {met: true, reason: ""};
    return {p, owned, prereq};
  }).filter(item => !availOnly || item.owned || item.prereq.met);

  const byName = (a, b) => a.p.name.localeCompare(b.p.name);
  const byAvail = (a, b) => Number(b.owned || b.prereq.met) - Number(a.owned || a.prereq.met);
  matches.sort((a, b) => {
    if (sortMode === "level-asc") return a.p.level - b.p.level || byName(a, b);
    if (sortMode === "level-desc") return b.p.level - a.p.level || byName(a, b);
    if (sortMode === "name") return byName(a, b);
    if (sortMode === "name-desc") return byName(b, a);
    if (sortMode === "timing") return (a.p.castingPeriod || "").localeCompare(b.p.castingPeriod || "") || a.p.level - b.p.level || byName(a, b);
    if (sortMode === "alignment") return (a.p.alignment || "").localeCompare(b.p.alignment || "") || a.p.level - b.p.level || byName(a, b);
    if (sortMode === "owned") return Number(b.owned) - Number(a.owned) || a.p.level - b.p.level || byName(a, b);
    return byAvail(a, b) || a.p.level - b.p.level || byName(a, b);
  });

  const totalPages = Math.max(1, Math.ceil(matches.length / powerLibraryPageSize));
  powerLibraryPage = clamp(powerLibraryPage, 0, totalPages - 1);
  const start = powerLibraryPage * powerLibraryPageSize;
  const slice = matches.slice(start, start + powerLibraryPageSize);

  list.replaceChildren();
  if (!slice.length) appendText(list, "p", "No matching powers found.").className = "muted";

  let showedLockedHeader = false;
  for (const {p, owned, prereq} of slice) {
    if (sortMode === "available" && !owned && !prereq.met && !showedLockedHeader) {
      showedLockedHeader = true;
      appendText(list, "h3", "Prerequisites Not Met");
    }
    const summary = [
      !owned && !prereq.met ? prereq.reason : "",
      p.alignment,
      p.level ? "Level " + p.level + " (" + powerPointCost(p.level) + " pts)" : "At-will",
      p.castingPeriodText,
      (p.concentration ? "Concentration, " : "") + p.duration
    ].filter(Boolean).join(" · ");
    const actions = collectionRow(list, p.name, summary, () => showPowerInfo(p));
    const btn = ownedControl(actions, owned ? "Remove" : (!prereq.met ? "Locked" : "Add"), p.name, () => {
      if (owned) removeKnownPower(p.name);
      else if (prereq.met) addKnownPower(p.name);
    });
    if (!owned && !prereq.met) {
      btn.disabled = true;
      btn.title = prereq.reason;
    }
  }

  const status = getElementById("powerPageStatus");
  if (status) {
    status.textContent = matches.length
      ? "Showing " + (start + 1) + "–" + Math.min(matches.length, start + slice.length) + " of " + matches.length + " (page " + (powerLibraryPage + 1) + "/" + totalPages + ")"
      : "0 powers";
  }
  const nav = getElementById("powerPages");
  if (nav) {
    nav.hidden = totalPages <= 1;
    getElementById("previousPowerPage").disabled = powerLibraryPage <= 0;
    getElementById("nextPowerPage").disabled = powerLibraryPage >= totalPages - 1;
  }
}

function renderPowerLevelChips() {
  const wrap = getElementById("powerLevelChips");
  if (!wrap) return;
  wrap.replaceChildren();
  const opts = [["", "All"], ["0", "At-will"], ["1", "Level 1"], ["2", "Level 2"], ["3", "Level 3"], ["4", "Level 4"], ["5", "Level 5"], ["6", "Level 6"], ["7", "Level 7"], ["8", "Level 8"], ["9", "Level 9"]];
  for (const [val, label] of opts) {
    const btn = appendText(wrap, "button", label);
    btn.type = "button";
    btn.className = "pickerChip";
    btn.setAttribute("aria-pressed", String(powerLevelFilterVal === val));
    btn.addEventListener("click", () => {
      powerLevelFilterVal = val;
      powerLibraryPage = 0;
      renderPowerLevelChips();
      renderPowerLibrary();
    });
  }
}

function openPowerLibrary(type) {
  powerLibraryType = type;
  powerLibraryPage = 0;
  const search = getElementById("powerSearch");
  if (search) search.value = "";
  for (const id of ["powerTimingFilter", "powerAlignFilter", "powerRoleFilter"]) {
    const el = getElementById(id);
    if (el) el.value = "";
  }
  const sortEl = getElementById("powerSort");
  if (sortEl) sortEl.value = "available";
  const avEl = getElementById("powerAvailableOnly");
  if (avEl) avEl.setAttribute("aria-pressed", "false");
  powerLevelFilterVal = "";
  renderPowerLevelChips();
  renderPowerLibrary();
  getElementById("powerCatalog")?.showModal();
  search?.focus();
}

function wireCasting() {
  const dialog = getElementById("castDialog");
  if (dialog) {
    wireDialogDismissal(dialog, getElementById("castClose"));
    getElementById("castBack").addEventListener("click", () => {
      if (!castDraft) return;
      castDraft.stage = castDraft.stage === "options" ? "list" : "roles";
      renderCastChooser();
    });
    dialog.addEventListener("close", () => {
      const trigger = castDraft?.trigger;
      castDraft = null;
      trigger?.isConnected && trigger.focus({preventScroll: true});
    });
    dialog.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || button.disabled || !castDraft) return;
      if (button.dataset.castRole) {
        castDraft.role = button.dataset.castRole;
        castDraft.stage = "list";
        renderCastChooser();
      } else if (button.dataset.castChoose) {
        castDraft.powerName = button.dataset.castChoose;
        castDraft.stage = "options";
        renderCastChooser();
      }
    });
  }

  const libDialog = getElementById("powerCatalog");
  if (libDialog) {
    wireDialogDismissal(libDialog, getElementById("closePowerCatalog"));
    getElementById("openForcePowerCatalog")?.addEventListener("click", () => openPowerLibrary("Force"));
    getElementById("openTechPowerCatalog")?.addEventListener("click", () => openPowerLibrary("Tech"));
    renderPowerLevelChips();
    getElementById("powerAvailableOnly")?.addEventListener("click", ev => { const b = ev.currentTarget; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); powerLibraryPage = 0; renderPowerLibrary(); });
    const onPowerSearch = typeof _debounceFn === "function"
      ? _debounceFn(() => { powerLibraryPage = 0; renderPowerLibrary(); }, 120)
      : () => { powerLibraryPage = 0; renderPowerLibrary(); };
    getElementById("powerSearch")?.addEventListener("input", onPowerSearch);
    for (const id of ["powerTimingFilter", "powerAlignFilter", "powerRoleFilter", "powerSort"]) {
      getElementById(id)?.addEventListener("change", () => { powerLibraryPage = 0; renderPowerLibrary(); });
    }
    getElementById("previousPowerPage")?.addEventListener("click", () => { powerLibraryPage--; renderPowerLibrary(); });
    getElementById("nextPowerPage")?.addEventListener("click", () => { powerLibraryPage++; renderPowerLibrary(); });
  }

  for (const id of ["knownForceSearch", "knownTechSearch"]) {
    getElementById(id)?.addEventListener("input", () => renderPowerManager(app.character.profile, app.character.session));
  }
}
