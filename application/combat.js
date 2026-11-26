const resourceLabels = {
  rage: "Rage",
  leap: "Fyrnock’s leap",
  forcePoints: "Force Points",
  techPoints: "Tech Points",
  tempForce: "Temporary Force Points",
  tempTech: "Temporary Tech Points",
  forceRecovery: "Force Recovery",
  forceShield: "Force Shield",
  channelForce: "Channel the Force",
  secondWind: "Second Wind",
  actionSurge: "Action Surge",
  indomitable: "Indomitable",
  sageAdvice: "Sage Advice",
  superiority: "Superiority Dice",
  superiorityMasteryD4: "Superiority Mastery (d4)",
  speciesSpecial: "Species special attack",
  furyOfTheSmall: "Fury of the Small",
  primitiveNerves: "Primitive Nerves",
  echaniArt: "Echani Art",
  charging: "Charging",
  focus: "Focus Points",
  potentAptitude: "Potent Aptitude",
  idealManifests: "Ideal Manifests",
  luck: "Luck Points",
  hitDice: "Hit Dice",
  successes: "Death save successes",
  failures: "Death save failures"
};

const isIncapacitated = (session, profile = null) => conditionState(session, profile).incapacitated;
const canAct = (session, profile = null) => !isIncapacitated(session, profile);
const canReact = (session, profile = null) => !isIncapacitated(session, profile) && !conditionState(session, profile).noReactions;

function attackMode(session, stats, phase, prof = typeof app !== "undefined" ? app?.character?.profile : null) {
  const c = conditionState(session, prof);
  const effMods = prof ? activeEffectModifiers(prof, session) : {};
  const advSources = [];
  if (c.invisible) advSources.push("Invisible");
  if (phase !== "reaction" && session.reckless && stats.melee && stats.ability === "Strength") advSources.push("Reckless Attack");
  if (effMods.allAttackAdv) advSources.push("Active power");
  if (stats.melee && effMods.meleeWeaponAdv) advSources.push("Rage (Force)");
  if (effMods.feintingAttackAdv) advSources.push("Feinting Attack");
  if (prof && typeof resolveCombatEffects === "function") {
    for (const ct of resolveCombatEffects(prof, session).combatTraits || []) {
      if (ct.kind === "nextAttackAdvantage") advSources.push(ct.source || "Next attack advantage");
    }
  }
  const disSources = [
    stats.disadvantage && "Weapon requirement",
    c.exhaustion >= 3 && "Exhaustion",
    c.blinded && "Blinded",
    c.poisoned && "Poisoned",
    c.frightened && "Frightened",
    c.prone && stats.melee && "Prone",
    c.restrained && "Restrained",
    effMods.allAttackDisadv && "Active power",
    stats.armorPenalty && "Armor proficiency",
    (() => {
      if (!prof || typeof carryingStats !== "function" || !["Strength", "Dexterity", "Constitution"].includes(stats.ability || "Strength")) return "";
      const carry = carryingStats(prof, session);
      return carry.hasDisadvantage ? (carry.overloaded ? "Overloaded" : carry.overCapacity ? "Over carrying capacity" : "Heavily encumbered") : "";
    })()
  ].filter(Boolean);
  return {
    advantage: advSources.join(", "),
    disadvantage: disSources.join(", ")
  };
}

function endRage(session) {
  if (session.rage?.exhaustionDue) session.exhaustion = Math.min(6, session.exhaustion + 1);
  session.rage = null;
}

function startRage(frenzied) {
  const {profile, session} = app.character;
  const effRageMax = typeof effectiveRageStats === "function" ? effectiveRageStats(profile, session).rageMax : (profile.rageMax || 0);
  const unlimitedRage = effRageMax >= 99;
  if (session.rage || (!unlimitedRage && (session.spent.rage || 0) >= effRageMax) || !canAct(session) || armorStats(profile, session).heavy) return;
  update(frenzied ? "Entered Frenzy" : "Entered Rage", next => {
    if (!unlimitedRage) next.spent.rage = (next.spent.rage || 0) + 1;
    if (typeof endConcentration === "function") endConcentration(next);
    else next.concentration = "";
    next.rage = {frenzy: frenzied, exhaustionDue: frenzied && (next.spent.frenzy || 0) > 0};
    if (frenzied) next.spent.frenzy = (next.spent.frenzy || 0) + 1;
  });
}

function useLeap() {
  const {profile, session} = app.character;
  if (!session.rage || (session.spent.leap || 0) >= profile.leapMax || !canAct(session)) return;
  update("Used Fyrnock’s leap", (next, prof) => {
    const scores = effectiveScores(prof, next);
    next.spent.leap = (next.spent.leap || 0) + 1;
    notice = "Fyrnock’s leap · Up to 30 ft · " + Math.max(0, modifier(scores.Strength)) + " kinetic within 5 ft";
  });
}

function formatReactionKindTag(reactionKind) {
  if (reactionKind === "standard") return "(Reaction)";
  if (reactionKind === "special") return "(Special Reaction)";
  if (reactionKind === "legendary") return "(Legendary Action)";
  if (reactionKind === "lair") return "(Lair Action)";
  return "";
}

function formatReactionKindTiming(reactionKind) {
  if (reactionKind === "standard") return "Reaction";
  if (reactionKind === "special") return "Special reaction";
  if (reactionKind === "legendary") return "Legendary action";
  if (reactionKind === "lair") return "Lair action";
  return "";
}

function formatCadenceLabel(cadence, rechargeMin) {
  const rMin = Number(rechargeMin);
  if (cadence === "recharge" || (Number.isInteger(rMin) && rMin >= 2 && rMin <= 6)) {
    if (Number.isInteger(rMin) && rMin >= 2 && rMin <= 6) {
      return rMin === 6 ? "Recharge 6" : ("Recharge " + rMin + "–6");
    }
    return "Recharge";
  }
  if (cadence === "oncePerTurn") return "Once per turn";
  if (cadence === "oncePerRound") return "Once per round";
  if (cadence === "oncePerShortRest") return "Once per short rest";
  if (cadence === "oncePerLongRest") return "Once per long rest";
  if (cadence === "perDay") return "Once per day";
  return "";
}

function appendCadenceIfMissing(summary, cadenceText) {
  if (!cadenceText) return summary || "";
  const s = String(summary || "");
  const lc = s.toLowerCase();
  const cl = cadenceText.toLowerCase();
  if (lc.includes(cl) || (cl === "once per turn" && /\b1\/turn\b/i.test(s)) || (cl === "once per round" && /\b1\/round\b/i.test(s))) {
    return s;
  }
  return s ? (s + " · " + cadenceText) : cadenceText;
}

function appendReactionKindToTitle(title, reactionKind, forceStandard = false) {
  const t = String(title || "");
  if (!reactionKind) return t;
  if (reactionKind === "standard" && !forceStandard) return t;
  const tag = formatReactionKindTag(reactionKind);
  if (!tag) return t;
  if (/((?:Special )?Reaction)|((?:Legendary|Lair) Action)/i.test(t)) return t;
  return t + " " + tag;
}

function findActionGrantMeta(rule, preferredZone = "") {
  const grants = Array.isArray(rule?.effects) ? rule.effects.filter(e => e && e.type === "actionGrant") : [];
  const picked = (preferredZone ? grants.find(g => g.zone === preferredZone) : null) || grants[0] || null;
  return {
    cadence: rule?.cadence || picked?.cadence || "",
    reactionKind: rule?.reactionKind || picked?.reactionKind || "",
    rechargeMin: rule?.rechargeMin !== undefined ? rule.rechargeMin : picked?.rechargeMin
  };
}

function toggleNamedEffect(effectName, noteText = "", extra = {}) {
  const active = (app.character.session.effects || []).some(e => normalizeName(e.name) === normalizeName(effectName));
  update((active ? "Ended " : "Activated ") + effectName, next => {
    if (active) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(effectName));
    } else {
      next.effects.push(conditionEntry(effectName, 1, false, {id: newID(), note: noteText, persistent: false, ...extra}));
    }
  });
}

function actionUpgradeNotes(profile, session, targetNames) {
  if (typeof resolveResourceEffects !== "function") return [];
  const want = new Set((targetNames || []).map(normalizeName));
  return (resolveResourceEffects(profile, session).actionUpgrades || [])
    .filter(u => want.has(normalizeName(u.targetAction)) && u.summary)
    .map(u => u.summary);
}

function openDeflectionDialog(trigger) {
  const {profile, session} = app.character;
  const casting = castingStats(profile, session);
  const step = classLevelStep(profile);
  const kcLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Sentinel", "Kinetic Combat") : (profile.level || 1);
  const kcStep = kcLvl > 0 ? (classRecord("Sentinel")?.levelChanges?.[String(Math.min(20, kcLvl))] || step) : step;
  const dieText = kcStep["Kinetic Combat"] || step["Kinetic Combat"] || "1d4";
  const dieSides = parseNumericStat(dieText.replace(/^1?d/i, "")) || 4;
  if (casting.forceTotalRemaining < 1) return;
  const {dialog, form, body, note, confirm} = createModalFrame("Force-Empowered Self: Deflection", trigger);
  confirm.textContent = "Spend 1 Force Point";
  note("No action required (when targeted by an attack): spend 1 Force Point and roll your Kinetic Combat die (" + dieText + ") to add to your AC.");
  const isSentinel20 = classLevelOf(profile, "Sentinel") >= 20;
  if (isSentinel20) note("Center of the Force (once per turn): you can choose the maximum value (" + dieSides + ") instead of rolling.");
  for (const up of actionUpgradeNotes(profile, session, ["Force-Empowered Self", "Force-Empowered Self: Deflection"])) note("Upgrade: " + up);
  const curAC = armorStats(profile, session).value;
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides,
    unit: "AC",
    label: "Kinetic Combat die (" + dieText + ")",
    impactPreview: (raw, total) => total ? ("AC " + curAC + " → " + (curAC + total) + " · FP " + casting.forceTotalRemaining + " → " + (casting.forceTotalRemaining - 1)) : ("Current AC " + curAC + " · Costs 1 FP"),
    onChange: (raw, total) => { confirm.textContent = total ? ("Apply +" + total + " AC (1 FP)") : "Spend 1 Force Point"; }
  });
  if (isSentinel20) {
    const maxBtn = appendText(body, "button", "Center of the Force: Choose max (" + dieSides + ")");
    maxBtn.type = "button";
    maxBtn.addEventListener("click", () => {
      dieField.input.value = String(dieSides);
      dieField.input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const bonus = dieField.getRaw();
    if (!Number.isFinite(bonus)) return;
    dialog.close();
    update("Force-Empowered Self: Deflection (+" + bonus + " AC)", next => {
      spendForcePoints(next, 1);
      next.effects = next.effects.filter(e => normalizeName(e.name) !== "force-empowered self: deflection");
      next.effects.push(conditionEntry("Force-Empowered Self: Deflection", bonus, false, {id: newID(), note: "+" + bonus + " AC", persistent: false, durationSpec: { anchor: "startOfOwnNextTurn" }, source: { kind: "classFeature", name: "Force-Empowered Self" }}));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openSlowTimeDialog(trigger) {
  const {profile, session} = app.character;
  const casting = castingStats(profile, session);
  const step = classLevelStep(profile);
  const kcLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Sentinel", "Kinetic Combat") : (profile.level || 1);
  const kcStep = kcLvl > 0 ? (classRecord("Sentinel")?.levelChanges?.[String(Math.min(20, kcLvl))] || step) : step;
  const dieText = kcStep["Kinetic Combat"] || step["Kinetic Combat"] || "1d4";
  const dieSides = parseNumericStat(dieText.replace(/^1?d/i, "")) || 4;
  if (casting.forceTotalRemaining < 1) return;
  const {dialog, form, body, note, confirm} = createModalFrame("Force-Empowered Self: Slow Time", trigger);
  confirm.textContent = "Spend 1 Force Point";
  note("No action required (when you move on your turn): spend 1 Force Point and roll your Kinetic Combat die (" + dieText + ") to increase your speed by 5 × the amount rolled until the end of your turn.");
  const isSentinel20 = classLevelOf(profile, "Sentinel") >= 20;
  if (isSentinel20) note("Center of the Force (once per turn): you can choose the maximum value (" + dieSides + ", +" + (dieSides * 5) + " ft) instead of rolling.");
  for (const up of actionUpgradeNotes(profile, session, ["Force-Empowered Self", "Force-Empowered Self: Slow Time"])) note("Upgrade: " + up);
  const curSpd = speedBreakdown(profile, session, conditionState(session, profile)).walk;
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides,
    multiplier: 5,
    unit: "ft",
    label: "Kinetic Combat die (" + dieText + ")",
    impactPreview: (raw, total) => total ? ("Speed " + curSpd + " → " + (curSpd + total) + " ft · FP " + casting.forceTotalRemaining + " → " + (casting.forceTotalRemaining - 1)) : ("Current speed " + curSpd + " ft · Costs 1 FP"),
    onChange: (raw, total) => { confirm.textContent = total ? ("Apply +" + total + " ft (1 FP)") : "Spend 1 Force Point"; }
  });
  if (isSentinel20) {
    const maxBtn = appendText(body, "button", "Center of the Force: Choose max (" + dieSides + ")");
    maxBtn.type = "button";
    maxBtn.addEventListener("click", () => {
      dieField.input.value = String(dieSides);
      dieField.input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const feet = dieField.getTotal();
    if (!Number.isFinite(feet)) return;
    dialog.close();
    update("Force-Empowered Self: Slow Time (+" + feet + " ft)", next => {
      spendForcePoints(next, 1);
      next.effects = next.effects.filter(e => normalizeName(e.name) !== "force-empowered self: slow time");
      next.effects.push(conditionEntry("Force-Empowered Self: Slow Time", feet, false, {id: newID(), note: "+" + feet + " ft speed", persistent: false, durationSpec: { anchor: "endOfOwnTurn" }, source: { kind: "classFeature", name: "Force-Empowered Self" }}));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openSecondWindDialog(trigger) {
  const {profile, session} = app.character;
  const swLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Fighter", "Second Wind") : (profile.level || 1);
  const {dialog, form, body, note, confirm} = createModalFrame("Second Wind", trigger);
  confirm.textContent = "Heal & spend use";
  note("Bonus action (once per short rest): roll 1d10 and add your fighter level (+" + swLvl + ") to regain hit points.");
  const maxHPNow = hitPointMaximum(profile, session);
  const curHPNow = session.hp;
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: 10,
    modifier: swLvl,
    modifierLabel: "Level",
    unit: "HP",
    label: "Second Wind die (1d10)",
    impactPreview: (raw, total) => total ? ("HP " + curHPNow + " → " + Math.min(maxHPNow, curHPNow + total) + " / " + maxHPNow) : ("Current HP " + curHPNow + " / " + maxHPNow),
    onChange: (raw, total) => { confirm.textContent = total ? ("Heal +" + total + " HP") : "Heal & spend use"; }
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const amount = dieField.getTotal();
    if (!Number.isFinite(amount)) return;
    dialog.close();
    update("Second Wind · +" + amount + " HP", (next, prof) => {
      next.spent.secondWind = (next.spent.secondWind || 0) + 1;
      recoverHP(next, amount, hitPointMaximum(prof, next));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openSpendHitDieDialog(title, timingLabel, trigger) {
  const {profile, session} = app.character;
  const hdLeft = session.hitDice || 0;
  if (hdLeft <= 0) return;
  const dieSize = profile.hitDie || 8;
  const conMod = modifier(effectiveScores(profile, session).Constitution);
  const minFloor = typeof resolveHpEffects === "function" ? (resolveHpEffects(profile, session).hitDieMin || 0) : 0;
  const durable = minFloor > 0;
  const {dialog, form, body, note, confirm} = createModalFrame(title, trigger);
  confirm.textContent = "Spend 1 Hit Die & Heal";
  note(timingLabel + " · Spend 1 Hit Die (" + hdLeft + "/" + profile.level + " d" + dieSize + " left) to roll 1d" + dieSize + " and add your Constitution modifier (" + signed(conMod) + ")" + (durable ? " (Durable minimum " + minFloor + ")." : "."));
  const maxHPNow = hitPointMaximum(profile, session);
  const curHPNow = session.hp;
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: dieSize,
    modifier: conMod,
    modifierLabel: "Constitution",
    minFloor,
    unit: "HP",
    label: "Hit Die roll (1d" + dieSize + ")",
    impactPreview: (raw, total) => total ? ("HP " + curHPNow + " → " + Math.min(maxHPNow, curHPNow + total) + " / " + maxHPNow + " · HD " + hdLeft + " → " + (hdLeft - 1)) : ("Current HP " + curHPNow + "/" + maxHPNow + " · " + hdLeft + " HD left"),
    onChange: (raw, total) => { confirm.textContent = total ? ("Heal +" + total + " HP (1 HD)") : "Spend 1 Hit Die & Heal"; }
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const amount = dieField.getTotal();
    if (!Number.isFinite(amount)) return;
    dialog.close();
    update(title + " · Spent 1 Hit Die (+" + amount + " HP)", (next, prof) => {
      if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile); else next.hitDice = Math.max(0, (next.hitDice || 0) - 1);
      recoverHP(next, amount, hitPointMaximum(prof, next));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openArchetypeRollDialog(title, timingLabel, dialogKind, formulaText, resourceKey, trigger) {
  const {dialog, form, body, note, confirm} = createModalFrame(title, trigger);
  confirm.textContent = dialogKind === "tempHP" ? "Apply temporary HP" : dialogKind === "heal" ? "Heal HP" : "Spend use";
  note(timingLabel + (formulaText ? " · Roll " + formulaText + " and enter the die result:" : " · Enter the die result:"));
  const m = String(formulaText || "").match(/(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?/i);
  const diceCount = m ? (Number(m[1]) || 1) : 1;
  const dieSides = m ? (Number(m[2]) || 6) : 6;
  const flatSign = m && m[3] === "-" ? -1 : 1;
  const flatAdd = m && m[4] ? flatSign * Number(m[4]) : 0;
  const unit = dialogKind === "tempHP" ? "temporary HP" : dialogKind === "heal" ? "HP" : "";
  const sNow = app.character.session;
  const maxHPArch = hitPointMaximum(app.character.profile, sNow);
  const dieField = createDieRollField(body, {
    diceCount,
    dieSides,
    modifier: flatAdd,
    unit,
    label: "Die roll (" + diceCount + "d" + dieSides + ")",
    impactPreview: (raw, total) => {
      if (!total) return dialogKind === "heal" ? ("Current HP " + sNow.hp + "/" + maxHPArch) : dialogKind === "tempHP" ? ("Current temporary HP: " + (sNow.temp || 0)) : "";
      if (dialogKind === "heal") return "HP " + sNow.hp + " → " + Math.min(maxHPArch, sNow.hp + total) + " / " + maxHPArch;
      if (dialogKind === "tempHP") return "Temp HP " + (sNow.temp || 0) + " → " + Math.max(sNow.temp || 0, total);
      return "";
    },
    onChange: (raw, total) => {
      if (!total) confirm.textContent = dialogKind === "tempHP" ? "Apply temporary HP" : dialogKind === "heal" ? "Heal HP" : "Spend use";
      else confirm.textContent = dialogKind === "tempHP" ? ("Apply +" + total + " temporary HP") : dialogKind === "heal" ? ("Heal +" + total + " HP") : ("Apply " + total);
    }
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const amt = dieField.getTotal();
    if (!Number.isFinite(amt)) return;
    dialog.close();
    update(title + " (" + (dialogKind === "tempHP" ? "+" + amt + " temporary HP" : dialogKind === "heal" ? "+" + amt + " HP" : amt) + ")", (next, prof) => {
      if (resourceKey) next.spent[resourceKey] = (next.spent[resourceKey] || 0) + 1;
      if (dialogKind === "tempHP") {
        if (amt > (next.temp || 0)) { next.temp = amt; next.tempSource = title; }
      } else if (dialogKind === "heal") {
        recoverHP(next, amt, hitPointMaximum(prof, next));
      }
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function applyDamage(session, profile, amount, type, weapon = false) {
  const c = conditionState(session, profile);
  if (!amount || c.dead || (c.petrified && type === "poison")) return;
  const defProf = defenseProfile(profile, session);
  const defImm = new Set((defProf.immunities || []).map(x => String(x).toLowerCase()));
  if (c.immunities.has("all damage") || defImm.has("all") || defImm.has("all damage") || (typeof type === "string" && type && (c.immunities.has(type) || defImm.has(type.toLowerCase())))) return;
  const effMods = activeEffectModifiers(profile, session);
  const resList = resistanceNames(profile, session);
  const hasAllRes = resList.includes("all") || (resList.includes("all (except psychic)") && type !== "psychic") || (resList.includes("all (except force)") && type !== "force");
  let resisted = type === true || hasAllRes || (c.petrified && type !== "true") || (typeof type === "string" && type && resList.includes(type));
  let total = amount + (weapon ? c.corroded : 0);

  // Defense Mastery & Absorptive armor/shield: reduce weapon damage (floor 1)
  if (weapon) {
    const tr = characterTraits(profile, session);
    const arm = armorStats(profile, session);
    let wepRed = 0;
    if (tr.medHeavyArmorDmgReduction && arm.armor && (arm.armor.armor === "Medium" || arm.armor.armor === "Heavy") && !arm.nonproficient) {
      wepRed += tr.medHeavyArmorDmgReduction;
    }
    if (wepRed > 0) total = Math.max(1, total - wepRed);
  }
  if (typeof resolveDefenseEffects === "function") {
    for (const dr of resolveDefenseEffects(profile, session).damageReductions || []) {
      const types = (dr.damageTypes || ["all"]).map(x => String(x).toLowerCase());
      const matches = types.includes("all") || (weapon && types.includes("weapon")) || (typeof type === "string" && types.includes(type.toLowerCase()));
      const amt = Number(dr.amount);
      if (matches && Number.isFinite(amt) && amt > 0) {
        total = Math.max(Number.isFinite(dr.minDamage) ? dr.minDamage : 0, total - amt);
      }
    }
  }
  const vulnList = defenseProfile(profile, session).vulnerabilities || [];
  const vulnerable = typeof type === "string" && type && vulnList.includes(type);
  // SW5e PHB Ch. 9: Resistance & vulnerability apply AFTER passive modifiers (Defense Mastery, Absorptive, Corroded) and BEFORE active modifiers (Soresu Form, Parry, Adrenaline Hit)
  let applied = resisted ? Math.floor(total / 2) : total;
  if (vulnerable) applied = applied * 2;
  // Soresu Form: first kinetic, energy, or ion weapon damage before end of next turn is reduced by half (stacks with resistance)
  if (weapon && ["kinetic", "energy", "ion"].includes(type)) {
    const soresuEntry = (session.effects || []).find(e => {
      const cn = (typeof lightsaberFormRule === "function" && lightsaberFormRule(e.name)?.name) || e.name;
      return normalizeName(cn) === "soresu form" && !e.soresuUsed;
    });
    if (soresuEntry) {
      applied = Math.floor(applied / 2);
      soresuEntry.soresuUsed = true;
    }
  }
  if (effMods.damageReduction > 0) {
    applied = Math.max(0, applied - effMods.damageReduction);
  }
  if (weapon) {
    const parryIdx = (session.effects || []).findIndex(e => normalizeName(e.name) === "parry");
    if (parryIdx >= 0) {
      const pVal = session.effects[parryIdx].value || 1;
      applied = Math.max(0, applied - pVal);
      session.effects.splice(parryIdx, 1);
    }
  }
  if (!applied) return;
  const absorbed = Math.min(applied, session.temp);
  session.temp -= absorbed;
  if (!session.temp) {
    session.tempSource = "";
    session.effects = (session.effects || []).filter(e => normalizeName(e.name) !== "enhancement injection");
  }
  const prevHp = Number(session.hp) || 0;
  delete session._lastZeroHpTrigger;
  delete session._lastZeroHpPrompt;
  if (prevHp === 0 && applied > absorbed) {
    session.death = {successes: session.death.successes === 3 ? 0 : session.death.successes, failures: Math.min(3, session.death.failures + 1)};
  }
  const hpLoss = applied - absorbed;
  session.hp = Math.max(0, prevHp - hpLoss);
  if (prevHp > 0 && session.hp === 0 && typeof resolveZeroHpStoppers === "function") {
    const excessDamage = Math.max(0, hpLoss - prevHp);
    const maxHp = typeof hitPointMaximum === "function" ? hitPointMaximum(profile, session) : 0;
    const killedOutright = maxHp > 0 && excessDamage >= maxHp;
    const stoppers = resolveZeroHpStoppers(profile, session);
    const autoEligible = stoppers.readyAuto.filter(s => !killedOutright || s.allowMassiveDamage);
    if (autoEligible.length > 0) {
      const s = autoEligible[0];
      session.hp = 1;
      if (s.resourceId) {
        session.spent = session.spent || {};
        session.spent[s.resourceId] = (session.spent[s.resourceId] || 0) + 1;
      }
      if (s.consumeEffect) {
        session.effects = (session.effects || []).filter(ef => normalizeName(ef.name) !== normalizeName(s.consumeEffect));
      }
      session._lastZeroHpTrigger = { name: s.name, source: s.source, note: s.note };
    } else {
      const promptEligible = stoppers.readyPrompt.filter(s => !killedOutright || s.allowMassiveDamage);
      if (promptEligible.length > 0) {
        session._lastZeroHpPrompt = {
          stoppers: promptEligible,
          preState: {
            rage: session.rage ? { ...session.rage } : null,
            concentration: session.concentration || ""
          }
        };
      }
    }
  }
  const hasControlPain = (session.effects || []).some(e => normalizeName(e.name) === "control pain");
  if (applied > 0) {
    const chMax = armorStats(profile, session).chargingMax || 0;
    if (chMax > 0) {
      session.spent = session.spent || {};
      const curSpent = session.spent.armor_charging !== undefined ? session.spent.armor_charging : chMax;
      if (curSpent > 0) session.spent.armor_charging = curSpent - 1;
    }
  }
  if (!session.hp && !hasControlPain) {
    endRage(session);
    if (typeof endConcentration === "function") endConcentration(session);
    else session.concentration = "";
  } else if (session.concentration && applied > 0) {
    const concDC = Math.max(10, Math.floor(applied / 2));
    let conBonusStr = "";
    if (typeof app !== "undefined" && app?.character?.profile && typeof savingThrowTotal === "function") {
      const conSt = savingThrowTotal(app.character.profile, session, "Constitution");
      conBonusStr = " " + signed(conSt.total);
    }
    session._lastConcentrationPrompt = "Concentration (" + session.concentration + "): Constitution save" + conBonusStr + " vs DC " + concDC;
  }
}

function recoverHP(session, amount, maximum, profile = null) {
  const c = conditionState(session, profile);
  if (c.dead || c.noHealing) return;
  session.hp = Math.min(maximum, session.hp + (c.weakened ? Math.floor(amount / 2) : amount));
  if (session.hp > 0) {
    session.death = {successes: 0, failures: 0};
  }
}

function actionUseLabel(name, options) {
  if (options.useLabel) return options.useLabel;
  if (options.pressed === true) return "End";
  if (/^Cast\b|^(Action|Bonus action|Reaction|Special \/ Triggered) power$/i.test(name)) return "Cast";
  if (/^Spend\b/i.test(name)) return "Spend";
  if (options.pressed === false) return "Activate";
  return "Use";
}

function weaponSaveMode(rollMode) {
  if (Boolean(rollMode.advantage) === Boolean(rollMode.disadvantage)) return "";
  return rollMode.advantage ? "disadvantage" : "advantage";
}

function weaponAttackSummary(option, stats, mode, extraPenalty = 0, damageChange = 0) {
  const diceMult = option.onFailure?.diceMultiplier || 1;
  const damage = damageNotation({ ...stats, dice: stats.dice * diceMult, bonus: stats.bonus + damageChange });
  const dc = option.saveAbility ? (option.saveDC == null ? "DC unspecified" : "DC " + (option.key === "conversion"
    ? Math.min(8 + stats.toHit - extraPenalty, option.dcCap) : option.saveDC - extraPenalty)) : "";
  const saveMode = weaponSaveMode(mode);
  const inverted = saveMode ? " (" + saveMode + ")" : "";
  if (option.area) {
    const range = stats.weaponProperties.rangeSpec?.text || stats.weaponProperties.range?.replace(/^range\s+/i, "");
    return option.area.size + "-ft cube within range" + (range ? " (" + range + " ft)" : "") +
      " · " + option.saveAbility + " save " + dc + " per creature · " + damage +
      " on failure. Declare up to " + option.declaredTarget.count + " target before firing for on-hit effects on failure" +
      (option.declaredTarget.invertRollMode && saveMode ? " and " + saveMode + " on its save" : "") + ".";
  }
  if (!option.saveAbility) {
    const extra = option.penetrateDistance
      ? ("Hit a second creature directly behind within " + option.penetrateDistance + " feet if the same roll hits, or reduce partial cover by " + (option.coverReductionSteps || 1) + " step")
      : option.note;
    return [signed(stats.toHit - extraPenalty) + " to hit", damage, extra].filter(Boolean).join(" · ");
  }
  const results = [damage];
  if (option.onFailure?.onHitEffects) results.push("on-hit effects");
  const effect = option.onFailure?.effect;
  if (effect === "firstAttackDisadvantage") results.push("disadvantage on the target’s first attack before the end of its next turn");
  if (effect === "governingAbilityDamage") results.push(stats.abilityMod + " " + stats.type + " damage at the start of the target’s next turn");
  if (effect === "preventHealing") results.push("the target cannot regain HP until the start of your next turn");
  return option.saveAbility + " save " + dc + (option.invertRollMode ? inverted : "") +
    " · On failure: " + results.join(" · ");
}

function weaponOutcomeSummary(effect, stats) {
  const rule = effect.params;
  if (rule.trigger === "onHit") {
    const dcText = Number.isFinite(rule.dc) ? "DC " + rule.dc : "DC unspecified";
    const failParts = [
      rule.extraDamage ? "takes an additional " + rule.extraDamage + " damage" : "",
      rule.condition ? "becomes " + rule.condition + (rule.conditionOfSource ? " of you" : "") + (rule.duration ? " " + rule.duration : "") : ""
    ].filter(Boolean).join(" and ");
    return "On hit, you can force a " + rule.saveAbility + " save (" + dcText + "). On failure: " + failParts + ".";
  }
  if (rule.trigger === "criticalHit") {
    const size = (stats.light ? rule.lightMaxSizeDifference : rule.maxSizeDifference) === 0
      ? "your size or smaller" : "at most one size larger than you";
    return "On a critical hit against a creature holding an object (" + size + "), you can force a " +
      rule.saveAbility + " save (DC " + (stats.toHit + rule.dcBonus) + "). On failure: " + rule.failure;
  }
  if (rule.trigger === "reducesToZero") {
    return "On reducing a creature to 0 HP, it makes a " + rule.saveAbility + " save (" +
      (Number.isFinite(rule.dc) ? "DC " + rule.dc : "DC unspecified") + "). On failure: " + rule.failure;
  }
  return rule.saveAbility + " save to maintain concentration: DC " + rule.dcFloor + " or the full damage taken, whichever is higher.";
}

function weaponActionButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "swWeaponToggle";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function openWeaponAttack(trigger, profile, session, item, stats, phase, trackFirstAttack) {
  const props = stats.weaponProperties;
  const options = weaponAttackOptions(stats);
  const { dialog, form, confirm, field, note } = createModalFrame(item.name + " attack", trigger, { size: "compact" });
  confirm.textContent = "Use";
  const modeField = options.length > 1 ? field("select", "Attack mode") : null;
  if (modeField) {
    for (const option of options) appendText(modeField, "option", option.label).value = option.key;
  }
  const defensiveMax = phase !== "reaction" && !session.weaponAttackStarted ? props.defensive?.tradeoff.maxPenalty : 0;
  const recklessMax = phase !== "reaction" && !session.weaponAttackStarted ? props.reckless?.tradeoff.maxPenalty : 0;
  const direMax = props.dire?.tradeoff.maxPenalty;
  const piercingMax = props.piercing?.tradeoff.maxBonus;
  const penaltyField = (label, max) => {
    if (!(max > 0)) return null;
    const input = field("input", label);
    input.type = "number";
    input.min = "0";
    input.max = String(max);
    input.step = "1";
    input.value = "0";
    input.required = true;
    return input;
  };
  const defensive = penaltyField("Defensive penalty (0–" + defensiveMax + ")", defensiveMax);
  const reckless = penaltyField("Reckless AC penalty (0–" + recklessMax + ")", recklessMax);
  const dire = penaltyField("Dire penalty (0–" + direMax + ")", direMax);
  const piercing = penaltyField("Piercing attack bonus (0–" + piercingMax + ")", piercingMax);
  const preview = note("");
  preview.setAttribute("aria-live", "polite");
  const ammo = note("");
  const loaded = weaponLoadedShots(item, props.reload, stats.modalModeName);
  const rollMode = attackMode(session, stats, phase, profile);
  const current = () => options.find(option => option.key === modeField?.value) || options[0];
  const sync = () => {
    const option = current();
    if (!option) {
      preview.textContent = "This weapon has no available firing mode.";
      confirm.disabled = true;
      return;
    }
    const rollsAttack = !option.saveAbility;
    for (const input of [defensive, reckless, dire, piercing].filter(Boolean)) input.disabled = !rollsAttack;
    const def = rollsAttack ? Number(defensive?.value || 0) : 0;
    const rec = rollsAttack ? Number(reckless?.value || 0) : 0;
    const dir = rollsAttack ? Number(dire?.value || 0) : 0;
    const pier = rollsAttack ? Number(piercing?.value || 0) : 0;
    preview.textContent = weaponAttackSummary(option, stats, rollMode, def + dir - rec - pier, dir - def + rec - pier) +
      (def ? " · +" + def + " AC until the start of your next turn" : "") +
      (rec ? " · −" + rec + " AC until the start of your next turn" : "");
    const cost = option.ammoCost;
    ammo.textContent = cost == null ? "Ammunition cost unspecified. Track this use manually."
      : cost > 0 ? cost + " ammunition" + (loaded == null ? "" : " · " + loaded + "/" + props.reload + " loaded") : "";
    ammo.hidden = !ammo.textContent;
    confirm.disabled = !form.checkValidity() || (loaded != null && cost > loaded);
  };
  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (confirm.disabled) return;
    const option = current();
    const rollsAttack = !option.saveAbility;
    const def = rollsAttack ? Number(defensive?.value || 0) : 0;
    const rec = rollsAttack ? Number(reckless?.value || 0) : 0;
    const dir = rollsAttack ? Number(dire?.value || 0) : 0;
    const pier = rollsAttack ? Number(piercing?.value || 0) : 0;
    dialog.close();
    if ((loaded != null && option.ammoCost > 0) || trackFirstAttack) {
      update(item.name + " · " + preview.textContent, next => {
        const weapon = next.equipped.find(gear => gear.id === item.id && gear.equipped);
        if (!weapon) return;
        if (loaded != null && option.ammoCost > 0) setWeaponLoadedShots(weapon, stats.modalModeName, loaded - option.ammoCost);
        if (trackFirstAttack) recordWeaponAttack(next, weapon, props.defensive, def, phase === "reaction" ? "reaction" : "ownTurn", props.reckless, rec);
      });
    } else {
      notice = item.name + " · " + preview.textContent;
      render();
    }
  });
  sync();
  dialog.showModal();
}

function actionEntry(parent, name, text, options = {}) {
  const entry = appendText(parent, "div", "");
  entry.className = "swAction" + (options.disabled && !options.use ? " is-disabled" : "");
  const hasExtras = Boolean(options.extras && options.extras.length);
  const { actions: right } = createRuleElementRow(entry, {
    name,
    summary: text || "",
    details: options.details || null,
    mode: options.mode || null,
    onSummaryClick: options.onTextClick || null,
    summaryTitle: "View attack & damage formula",
    rowClass: "swActionRow",
    actionsClass: "swActionRight",
    alwaysCreateActions: Boolean(options.use || hasExtras),
    extras: options.extras || null
  });
  if (options.use && right) {
    const label = actionUseLabel(name, options);
    const useBtn = appendText(right, "button", label);
    useBtn.type = "button";
    useBtn.className = "swActionUseBtn";
    useBtn.disabled = Boolean(options.disabled);
    useBtn.setAttribute("aria-label", label + " " + name);
    if (options.pressed !== undefined) useBtn.setAttribute("aria-pressed", String(options.pressed));
    useBtn.addEventListener("click", options.use);
  }
  return entry;
}

function verifiedOptionTiming(rule) {
  return rule?.mechanics?.timing || "";
}

function resolveActiveManeuvers(maneuverNames, sup, actionUpgrades = [], versatileManeuvers = []) {
  const ownedSet = new Set((maneuverNames || []).map(normalizeName));
  const versatileSet = new Set((versatileManeuvers || []).map(normalizeName));
  const out = [];
  const renderedBase = new Set();

  for (const mName of maneuverNames || []) {
    const rule = maneuverRule(mName);
    const mech = rule?.mechanics || {};
    const kind = verifiedOptionTiming(rule) || "free";
    // Skip passive upgrades when their parent base maneuver is also owned (they merge into the parent)
    if (kind === "passive-upgrade") {
      const parentName = mech.upgrades || "";
      if (parentName && ownedSet.has(normalizeName(parentName))) continue;
      // Fallback: if player added an upgrade without adding the base maneuver, still resolve it via its parent rule
      const parentRule = maneuverRule(parentName);
      if (!parentRule || renderedBase.has(normalizeName(parentRule.name))) continue;
    }

    const baseRule = (kind === "passive-upgrade" && mech.upgrades) ? (maneuverRule(mech.upgrades) || rule) : rule;
    const baseName = baseRule?.name || mName;
    const baseKey = normalizeName(baseName);
    if (renderedBase.has(baseKey)) continue;
    renderedBase.add(baseKey);

    const baseMech = baseRule?.mechanics || {};
    let slots = [verifiedOptionTiming(baseRule) || "free"];
    let effectiveType = baseRule?.type || "General";
    let displayName = baseName;
    let summary = baseMech.summary || "";
    let upgradeTag = "";
    const extraDescriptions = [];

    if (baseKey === "administer aid") {
      if (ownedSet.has("administer aid (greater)")) {
        slots = ["action", "bonus", "reaction"];
        displayName = "Administer Aid (Greater)";
        upgradeTag = "Greater";
        extraDescriptions.push(maneuverRule("Administer Aid (Greater)")?.description);
      } else if (ownedSet.has("administer aid (improved)")) {
        slots = ["action", "bonus"];
        displayName = "Administer Aid (Improved)";
        upgradeTag = "Improved";
        extraDescriptions.push(maneuverRule("Administer Aid (Improved)")?.description);
      }
    } else if (baseKey === "commander's strike") {
      if (ownedSet.has("commander's strike (greater)")) {
        slots = ["replace-attack", "bonus"];
        displayName = "Commander's Strike (Greater)";
        upgradeTag = "Greater";
        summary = "Ally uses reaction to attack (+{supDie} damage)";
        extraDescriptions.push(maneuverRule("Commander's Strike (Greater)")?.description);
      } else if (ownedSet.has("commander's strike (improved)")) {
        slots = ["bonus"];
        displayName = "Commander's Strike (Improved)";
        upgradeTag = "Improved";
        summary = "Ally uses reaction to attack (+{supDie} damage)";
        extraDescriptions.push(maneuverRule("Commander's Strike (Improved)")?.description);
      }
    } else if (baseKey === "call to arms" && ownedSet.has("call to arms (improved)")) {
      displayName = "Call to Arms (Improved)";
      upgradeTag = "Improved";
      summary = "When surprised: act normally & extend to up to {supDie} allies";
      extraDescriptions.push(maneuverRule("Call to Arms (Improved)")?.description);
    } else if (baseKey === "effective flanking") {
      if (ownedSet.has("effective flanking (greater)")) {
        displayName = "Effective Flanking (Greater)";
        upgradeTag = "Greater";
        summary = "30 ft: add {supDie}{mentalManeuverModTerm} to first attack & damage roll before next turn";
        extraDescriptions.push(maneuverRule("Effective Flanking (Improved)")?.description);
        extraDescriptions.push(maneuverRule("Effective Flanking (Greater)")?.description);
      } else if (ownedSet.has("effective flanking (improved)")) {
        displayName = "Effective Flanking (Improved)";
        upgradeTag = "Improved";
        summary = "30 ft: add {supDie} to first attack & damage roll before next turn";
        extraDescriptions.push(maneuverRule("Effective Flanking (Improved)")?.description);
      }
    } else if (baseKey === "parry" && ownedSet.has("parry (improved)")) {
      effectiveType = "General";
      displayName = "Parry (Improved)";
      upgradeTag = "General";
      summary = summary.replaceAll("{physicalManeuverModTerm}", "{generalManeuverModTerm}").replaceAll("{physicalManeuverMod}", "{generalManeuverMod}");
      extraDescriptions.push(maneuverRule("Parry (Improved)")?.description);
    } else if (baseKey === "sweeping attack" && ownedSet.has("sweeping attack (improved)")) {
      displayName = "Sweeping Attack (Improved)";
      upgradeTag = "Improved";
      summary = "On melee hit: adjacent target in reach takes {supDie}{physicalManeuverModTerm} damage";
      extraDescriptions.push(maneuverRule("Sweeping Attack (Improved)")?.description);
    }

    if (versatileSet.has(baseKey) && effectiveType !== "General") {
      effectiveType = "General";
      if (!upgradeTag) upgradeTag = "General";
      summary = summary
        .replaceAll("{physicalManeuverModSigned}", "{generalManeuverModSigned}")
        .replaceAll("{mentalManeuverModSigned}", "{generalManeuverModSigned}")
        .replaceAll("{physicalManeuverModTerm}", "{generalManeuverModTerm}")
        .replaceAll("{mentalManeuverModTerm}", "{generalManeuverModTerm}")
        .replaceAll("{physicalManeuverModMin0}", "{generalManeuverModMin0}")
        .replaceAll("{mentalManeuverModMin0}", "{generalManeuverModMin0}")
        .replaceAll("{physicalManeuverMod}", "{generalManeuverMod}")
        .replaceAll("{mentalManeuverMod}", "{generalManeuverMod}");
    }

    const fullDescription = [baseRule?.description || "", ...extraDescriptions.filter(Boolean)].join("\n\n");
    let finalSlots = slots;
    if (Array.isArray(actionUpgrades) && actionUpgrades.length) {
      const up = actionUpgrades.find(u => u.source?.kind !== "maneuver" && normalizeName(u.targetAction) === normalizeName(baseRule.name));
      if (up && up.newZone) {
        finalSlots = [up.newZone];
      }
    }
    out.push({
      rule: baseRule,
      displayName,
      slots: finalSlots,
      effectiveType,
      save: baseMech.save || "",
      saveDC: baseMech.save ? sup.dcFor(effectiveType) : 0,
      summary,
      upgradeTag,
      fullDescription
    });
  }
  return out;
}

// Conservative fallback ONLY for user-invented homebrew customFeatures not in any SW5e catalog.
function classifyHomebrewFeatureTiming(text) {
  const head = String(text || "").slice(0, 260).toLowerCase();
  if (/\buse your reaction\b|\bas a reaction\b/.test(head)) return "reaction";
  if (/\buse your bonus action\b|\bas a bonus action\b|\bwith your bonus action\b/.test(head)) return "bonus";
  if (/\buse your action\b|\bas an action\b/.test(head)) return "action";
  if (/\bno action required\b|\bwhen you hit\b|\bwhen you roll\b|\bonce on each of your turns\b/.test(head)) return "free";
  return "";
}

const SELF_STATE_MANEUVERS = {
  "body over bother": {kind: "toggleEffect", effectName: "Body Over Bother", note: "Strength, Dexterity, and Constitution saves use best physical modifier"},
  "mind over matter": {kind: "toggleEffect", effectName: "Mind Over Matter", note: "Intelligence, Wisdom, and Charisma saves use best mental modifier"},
  "one with shadows": {kind: "applyCondition", conditionName: "Invisible", note: "One With Shadows (until move or hostile action)"},
  "daring escape": {kind: "toggleEffect", effectName: "Daring Escape", note: "Disengaged · advantage against grapple, restrain, or slow"},
  "deliberate movement": {kind: "toggleEffect", effectName: "Deliberate Movement", note: "Dashed · ignore difficult terrain"},
  "dark transference": {kind: "regainHitDie"},
  "evasive footwork": {kind: "rolledEffect", effectName: "Evasive Footwork", label: "AC bonus", scale: 1},
  "primal endurance": {kind: "rolledEffect", effectName: "Primal Endurance", label: "Companion AC bonus", scale: 1, canTargetAlly: true, selfDefault: false},
  "steady the nerves": {kind: "rolledEffect", effectName: "Steady the Nerves", label: "Saving throw bonus", scale: 1, canTargetAlly: true, selfDefault: true},
  "precise movements": {kind: "rolledEffect", effectName: "Precise Movements", label: "Speed bonus (5 × die ft)", scale: 5, canTargetAlly: true, selfDefault: true},
  "charge": {kind: "rolledEffect", effectName: "Charge", label: "Speed bonus (5 × die ft)", scale: 5, canTargetAlly: true, selfDefault: true},
  "inner strength": {kind: "rolledTempHP", modType: "General", selfDefault: true},
  "vanity": {kind: "rolledHeal", modType: "General", selfDefault: true},
  "administer aid": {kind: "rolledHeal", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "adrenaline hit": {kind: "rolledHeal", modType: "Mental", healDieOnly: true, selfDefault: false, canTargetAlly: true, applyEffect: "Adrenaline Hit", persistentEffect: false},
  "water of life": {kind: "rolledHeal", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "remove toxins": {kind: "rolledHeal", modType: "None", selfDefault: false, canTargetAlly: true, cureToxin: true},
  "rally": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "enhancement injection": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true, applyEffect: "Enhancement Injection"},
  "encouraging pace": {kind: "rolledAnnounce", label: "Ally reaction movement (5 × die ft)", scale: 5},
  "go get 'em": {kind: "rolledAnnounce", label: "Companion speed bonus (5 × die ft)", scale: 5},
  "tenacity": {kind: "rolledAnnounce", label: "Stealth movement distance (5 × die ft)", scale: 5},
  "shadow puppetry": {kind: "rolledAnnounce", label: "0-HP creature movement (5 × die ft)", scale: 5},
  "encouraging speech": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "you call this archaeology?": {kind: "rolledTempHP", modType: "Force", selfDefault: true, canTargetAlly: true},
  "one step ahead": {kind: "rolledEffect", effectName: "One Step Ahead", label: "Initiative bonus", scale: 1},
  "feinting attack": {kind: "toggleEffect", effectName: "Feinting Attack", note: "Advantage on next attack against feinted target this turn"},
  "parry": {kind: "rolledEffectPlusMod", effectName: "Parry", label: "Melee damage reduction", modType: "Physical"},
  "self-preservation": {kind: "rolledEffect", effectName: "Self-Preservation", label: "Saving throw bonus", scale: 1},
  "firewall": {kind: "rolledEffect", effectName: "Firewall", label: "Tech saving throw bonus", scale: 1, canTargetAlly: true, selfDefault: true},
  "one with the force": {kind: "rolledEffect", effectName: "One with the Force", label: "Constitution concentration save bonus", scale: 1},
  "assist": {kind: "rolledEffect", effectName: "Assist", label: "Medicine check bonus", scale: 1},
  "conceal": {kind: "rolledEffect", effectName: "Conceal", label: "Stealth check bonus", scale: 1},
  "deceive": {kind: "rolledEffect", effectName: "Deceive", label: "Deception check bonus", scale: 1},
  "empathize": {kind: "rolledEffect", effectName: "Empathize", label: "Insight check bonus", scale: 1},
  "flex": {kind: "rolledEffect", effectName: "Flex", label: "Athletics check bonus", scale: 1},
  "flourish": {kind: "rolledEffect", effectName: "Flourish", label: "Sleight of Hand check bonus", scale: 1},
  "handle animal": {kind: "rolledEffect", effectName: "Handle Animal", label: "Animal Handling check bonus", scale: 1},
  "investigate": {kind: "rolledEffect", effectName: "Investigate", label: "Investigation check bonus", scale: 1},
  "naturalize": {kind: "rolledEffect", effectName: "Naturalize", label: "Nature check bonus", scale: 1},
  "perceive": {kind: "rolledEffect", effectName: "Perceive", label: "Perception check bonus", scale: 1},
  "perform": {kind: "rolledEffect", effectName: "Perform", label: "Performance check bonus", scale: 1},
  "persuade": {kind: "rolledEffect", effectName: "Persuade", label: "Persuasion check bonus", scale: 1},
  "pilot": {kind: "rolledEffect", effectName: "Pilot", label: "Piloting check bonus", scale: 1},
  "program": {kind: "rolledEffect", effectName: "Program", label: "Technology check bonus", scale: 1},
  "study": {kind: "rolledEffect", effectName: "Study", label: "Lore check bonus", scale: 1},
  "survive": {kind: "rolledEffect", effectName: "Survive", label: "Survival check bonus", scale: 1},
  "threaten": {kind: "rolledEffect", effectName: "Threaten", label: "Intimidation check bonus", scale: 1},
  "tumble": {kind: "rolledEffect", effectName: "Tumble", label: "Acrobatics check bonus", scale: 1},
  "assess the situation": {kind: "rolledEffect", effectName: "Assess the Situation", label: "Perception/Investigation bonus", scale: 1},
  "wild senses": {kind: "rolledEffect", effectName: "Wild Senses", label: "Perception/Survival bonus", scale: 1},
  "wrestle and drag": {kind: "toggleEffect", effectName: "Wrestle and Drag", note: "Drag grappled creature at full speed until end of turn"},
  "call to arms": {kind: "clearCondition", conditionName: "Surprised"}
};

function applyManeuverState(next, profile, maneuverName, rolledDie = 0, applyToSelf = true, useFreeD4 = false) {
  const key = normalizeName(maneuverName);
  const sup = superiorityStats(profile, next);
  if (useFreeD4 === "superiorityMastery") {
    next.spent = next.spent || {};
    next.spent.superiorityMasteryD4 = Math.min(sup.freeD4Max || 0, (next.spent.superiorityMasteryD4 || 0) + 1);
  } else if (useFreeD4 === "splashFighter") {
    next.spent = next.spent || {};
    next.spent.splash_fighter_superiority = Math.min(sup.splashFighterD4Max || 0, (next.spent.splash_fighter_superiority || 0) + 1);
  } else if (sup.qty > 0 && !useFreeD4) {
    next.superiorityUsed = Math.min(sup.qty, (next.superiorityUsed || 0) + 1);
  }
  const spec = SELF_STATE_MANEUVERS[key];
  if (!spec) return;
  const supMinFloor = sup.minRollThreshold > 0
    ? (useFreeD4 ? (typeof sw5eMinRollThreshold === "function" ? sw5eMinRollThreshold(4) : 2) : sup.minRollThreshold)
    : 0;
  const dieVal = Math.max(supMinFloor || 1, Math.floor(Number(rolledDie) || 1));
  const casting = castingStats(profile, next);
  const ownedManSet = new Set((Array.isArray(next?.maneuvers) ? next.maneuvers : []).map(normalizeName));
  const versatileList = typeof generalManeuverOverrides === "function" ? generalManeuverOverrides(profile, next) : [];
  const isGeneralOverride = (key === "parry" && ownedManSet.has("parry (improved)"))
    || versatileList.some(v => normalizeName(v) === key);
  const effModType = (isGeneralOverride && (spec.modType === "Physical" || spec.modType === "Mental")) ? "General" : spec.modType;
  const modVal = effModType === "Mental" ? sup.mentalMod
    : effModType === "Physical" ? sup.physicalMod
    : effModType === "General" ? sup.generalMod
    : effModType === "Force" ? (casting.hasForce && Number.isFinite(casting.forceMod) ? casting.forceMod : Math.max(modifier(effectiveScores(profile, next).Wisdom), modifier(effectiveScores(profile, next).Charisma)))
    : 0;

  const mRule = typeof maneuverRule === "function" ? maneuverRule(maneuverName) : null;
  const mMeta = {
    source: { kind: "maneuver", name: mRule?.name || maneuverName },
    ...(mRule?.durationSpec ? { durationSpec: mRule.durationSpec } : {}),
    ...(Array.isArray(mRule?.turnTriggers) && mRule.turnTriggers.length ? { turnTriggers: mRule.turnTriggers } : {})
  };
  if (spec.kind === "toggleEffect") {
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, 1, false, {id: newID(), note: spec.note || "", persistent: false, ...mMeta}));
  } else if (spec.kind === "applyCondition") {
    if (!next.effects.some(e => normalizeName(e.name) === normalizeName(spec.conditionName))) {
      next.effects.push(conditionEntry(spec.conditionName, 1, false, {id: newID(), note: spec.note || "", persistent: true, ...mMeta}));
    }
  } else if (spec.kind === "regainHitDie") {
    if (typeof recoverHitDice === "function") recoverHitDice(next, profile, 1); else next.hitDice = Math.min(profile.level, (next.hitDice || 0) + 1);
  } else if (spec.kind === "clearCondition") {
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.conditionName));
  } else if (spec.kind === "rolledEffect" && applyToSelf) {
    const val = dieVal * (spec.scale || 1);
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, val, false, {id: newID(), note: spec.scale === 5 ? "+" + val + " ft" : "+" + val, persistent: false, ...mMeta}));
  } else if (spec.kind === "rolledEffectPlusMod" && applyToSelf) {
    const val = Math.max(1, dieVal + modVal);
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, val, false, {id: newID(), note: "−" + val + " next melee hit", persistent: false, ...mMeta}));
  } else if (spec.kind === "rolledHeal" && applyToSelf) {
    const amount = Math.max(1, dieVal + (spec.healDieOnly ? 0 : modVal));
    recoverHP(next, amount, hitPointMaximum(profile, next));
    if (spec.cureToxin) {
      next.effects = next.effects.filter(e => e.name !== "Poisoned" && e.name !== "Diseased");
    }
    if (spec.applyEffect && modVal > 0) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.applyEffect));
      next.effects.push(conditionEntry(spec.applyEffect, modVal, false, {id: newID(), note: "−" + modVal + " damage", persistent: spec.persistentEffect !== false, ...mMeta}));
    }
  } else if (spec.kind === "rolledTempHP" && applyToSelf) {
    const amount = Math.max(1, dieVal + modVal);
    if (amount > (next.temp || 0)) {
      next.temp = amount;
      next.tempSource = maneuverName;
    }
    if (spec.applyEffect && modVal > 0) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.applyEffect));
      next.effects.push(conditionEntry(spec.applyEffect, modVal, false, {id: newID(), note: "+" + modVal + " Strength/Constitution", persistent: true, ...mMeta}));
    }
  }
}

function openManeuverRollDialog(displayName, baseName, trigger, forceFreeD4 = false, summaryOverride = "", freeD4Source = "") {
  const {profile, session} = app.character;
  const sup = superiorityStats(profile, session);
  const traits = characterTraits(profile, session);
  const hasKU = Boolean(classLevelOf(profile, "Scholar") >= 20);
  const masteryFreeLeft = Math.max(0, (sup.freeD4Max || 0) - (session.spent?.superiorityMasteryD4 || 0));
  const masteryPicks = Array.isArray(session.combatOptionChoices?.["Superiority Mastery"]) ? session.combatOptionChoices["Superiority Mastery"] : [];
  const hasMasteryFree = Boolean(masteryFreeLeft > 0 && masteryPicks.some(p => normalizeName(p) === normalizeName(baseName)));
  const splashFighterLeft = Math.max(0, (sup.splashFighterD4Max || 0) - (session.spent?.splash_fighter_superiority || 0));
  const hasSplashFighterD4 = Boolean(splashFighterLeft > 0);
  const resolvedSource = freeD4Source || (hasKU ? "knowledgeUnbound" : (hasMasteryFree ? "superiorityMastery" : (hasSplashFighterD4 ? "splashFighter" : "")));
  const freeOnly = Boolean(forceFreeD4 || (resolvedSource && sup.remaining <= 0));
  const freeLabel = resolvedSource === "superiorityMastery" ? "Superiority Mastery" : (resolvedSource === "splashFighter" ? "Splashclass Superiority" : "Knowledge Unbound");
  const spec = SELF_STATE_MANEUVERS[normalizeName(baseName)];
  const baseSides = parseNumericStat(String(sup.size || "d4").replace(/^d/i, "")) || 4;
  let useFreeD4 = freeOnly ? (resolvedSource || true) : false;
  const activeSides = () => useFreeD4 ? 4 : baseSides;
  const {dialog, form, body, field, note, confirm} = createModalFrame(displayName, trigger);
  confirm.textContent = freeOnly ? ("Use Free d4 (" + freeLabel + ")") : "Spend 1 Superiority Die";
  const rule = maneuverRule(baseName);
  const rawSummary = summaryOverride || rule?.mechanics?.summary || "Roll your superiority die (" + (sup.size || "d4") + ").";
  note(typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(rawSummary, profile, session) : rawSummary);
  let kuCheck = null;
  if (resolvedSource && !freeOnly) {
    const kuWrap = document.createElement("label");
    kuWrap.className = "row";
    kuCheck = document.createElement("input");
    kuCheck.type = "checkbox";
    kuCheck.checked = false;
    kuWrap.append(kuCheck, document.createTextNode(" Use " + freeLabel + " (roll d4 without spending a superiority die" + (resolvedSource === "superiorityMastery" ? " · " + masteryFreeLeft + "/" + sup.freeD4Max + " left" : "") + ")"));
    body.append(kuWrap);
  }
  const activeMinFloor = () => sup.minRollThreshold > 0
    ? (useFreeD4 ? (typeof sw5eMinRollThreshold === "function" ? sw5eMinRollThreshold(4) : 2) : sup.minRollThreshold)
    : 0;
  const initMinFloor = activeMinFloor();
  const initSides = freeOnly ? 4 : baseSides;
  const initDieStr = typeof formatDiceWithMin === "function" ? formatDiceWithMin(1, initSides, initMinFloor) : ("1d" + initSides);
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: initSides,
    minFloor: initMinFloor,
    label: freeOnly ? (freeLabel + " die (" + initDieStr + " · free)") : ("Superiority die (" + initDieStr + ")"),
    impactPreview: () => useFreeD4 === "splashFighter"
      ? ("Splashclass Superiority dice: " + splashFighterLeft + " → " + Math.max(0, splashFighterLeft - 1) + " d4")
      : (useFreeD4
        ? (freeLabel + " · 0 superiority dice spent (" + sup.remaining + "/" + sup.qty + " remain)")
        : ("Superiority dice: " + sup.remaining + " → " + Math.max(0, sup.remaining - 1))),
    onChange: (raw, total) => {
      const scaled = (spec?.scale && total) ? ("+" + (total * spec.scale) + (spec.scale === 5 ? " ft" : "")) : (total ? ("+" + total) : "");
      if (useFreeD4) confirm.textContent = scaled ? ("Use Free d4 (" + scaled + ")") : ("Use Free d4 (" + freeLabel + ")");
      else confirm.textContent = scaled ? ("Spend 1 Die (" + scaled + ")") : "Spend 1 Superiority Die";
    }
  });
  const input = dieField.input;
  if (kuCheck) {
    kuCheck.addEventListener("change", () => {
      useFreeD4 = kuCheck.checked ? resolvedSource : false;
      input.max = String(activeSides());
      if (Number(input.value) > activeSides()) input.value = String(activeSides());
      input.dispatchEvent(new Event("input"));
    });
  }

  let selfCheck = null;
  if (spec?.canTargetAlly) {
    const wrap = document.createElement("label");
    wrap.className = "row";
    selfCheck = document.createElement("input");
    selfCheck.type = "checkbox";
    selfCheck.checked = Boolean(spec.selfDefault);
    const selfLbl = spec.kind === "rolledHeal" || spec.kind === "rolledTempHP"
      ? " Apply healing / temporary HP to myself"
      : " Apply effect to myself";
    wrap.append(selfCheck, document.createTextNode(selfLbl));
    body.append(wrap);
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const rolled = clamp(Math.max(activeMinFloor() || 1, Math.floor(Number(input.value) || 1)), 1, activeSides());
    const toSelf = selfCheck ? selfCheck.checked : true;
    const isFree = useFreeD4;
    dialog.close();
    const announceSuffix = (spec?.kind === "rolledAnnounce") ? (" (+" + (rolled * (spec.scale || 1)) + (spec.scale === 5 ? " ft" : "") + ")") : "";
    const prefix = isFree === "superiorityMastery" ? "Used maneuver (Superiority Mastery d4) · "
      : isFree ? "Used maneuver (Knowledge Unbound d4) · " : "Used maneuver · ";
    update(prefix + displayName + announceSuffix, (next, prof) => {
      applyManeuverState(next, prof, baseName, rolled, toSelf, isFree);
    });
  });
  dialog.showModal();
  input.focus();
}

function renderActions(profile, session) {
  const action = getElementById("actions");
  const bonus = getElementById("bonus");
  const reaction = getElementById("reaction");
  const free = getElementById("freeTriggers");
  const freeWrap = getElementById("freeTriggersWrap");
  for (const node of [action, bonus, reaction, free].filter(Boolean)) node.replaceChildren();
  const blocked = isIncapacitated(session);
  const c = conditionState(session, profile);
  const armor = armorStats(profile, session);
  const raging = Boolean(session.rage);
  const traits = characterTraits(profile, session);
  const casting = castingStats(profile, session);
  const step = classLevelStep(profile);
  const equippedWeapons = session.equipped.filter(item => item.equipped && weaponStats(profile, item, raging, session));
  const weapons = equippedWeapons.filter(item => canUseWeapon(session, item, profile));
  const trackFirstAttack = Boolean(session.weaponAttackStarted || weapons.some(item => {
    const wp = weaponStats(profile, item, raging, session).weaponProperties;
    return wp.defensive || wp.reckless;
  }));
  const shield = equippedRule(session, "shield");
  const hasPhysicalShield = Boolean(shield && !/generator/i.test(shield.name));
  const hasEffect = name => (session.effects || []).some(e => normalizeName(e.name) === normalizeName(name));
  const freeTarget = free || action;

  getElementById("actionRestriction").textContent = c.dead ? "Dead" :
    blocked ? "Incapacitated. Actions and reactions are unavailable." :
    c.shocked ? (() => { const eg = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session).combatTraits.find(ct => ct.kind === "shockedReactionChoice") : null; return eg ? ("Shocked (" + (eg.source || "Reaction Choice") + ") · Start of turn: keep reaction OR take action + bonus action") : "Shocked · Action or bonus action · no reactions"; })() : "";

  const extraAtkTraitMax = typeof resolveDefenseEffects === "function"
    ? (resolveDefenseEffects(profile, session).combatTraits || [])
        .filter(ct => ct.kind === "extraAttack" && Number.isFinite(ct.value))
        .reduce((m, ct) => Math.max(m, ct.value), 1)
    : 1;
  const effAttacks = Math.max(profile.attacks || 1, extraAtkTraitMax);
  if (effAttacks > 1) {
    const atkFeatName = classLevelOf(profile, "Fighter") >= 20 ? "Master of Combat"
      : classLevelOf(profile, "Fighter") >= 11 ? "Greater Extra Attack"
      : "Extra Attack";
    actionEntry(action, "Attack", effAttacks + " attacks per Attack action", {
      details: () => showInfo(atkFeatName, [["Source", profile.className]], classRule(profile, atkFeatName) || classRule(profile, "Extra Attack"))
    });
  }

  for (const item of equippedWeapons) {
    const stats = weaponStats(profile, item, raging, session);
    stats.armorPenalty = armor.nonproficient;
    const extras = [];
    if (stats.canGripTwoHands) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.useTwoHands ? "2H" : "1H";
      btn.title = stats.versatile ? "Toggle versatile one-handed / two-handed grip" : "Toggle 2H grip (lowers Strength requirement by 1 step)";
      btn.addEventListener("click", () => update("Switched " + item.name + " grip", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.twoHanded = !(stats.useTwoHands);
      }));
      extras.push(btn);
    }
    if (stats.canChooseStrDex || stats.finesse) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.ability.slice(0, 3).toUpperCase();
      btn.setAttribute("aria-label", "Switch to " + (stats.ability === "Strength" ? "Dexterity" : "Strength"));
      btn.addEventListener("click", () => update("Switched " + item.name + " ability", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.useAbility = stats.ability === "Strength" ? "Dexterity" : "Strength";
      }));
      extras.push(btn);
    }
    if (stats.thrown) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.thrownMode ? "Thrown" : "Melee";
      btn.title = "Toggle melee / thrown attack";
      btn.addEventListener("click", () => update("Switched " + item.name + " mode", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.thrownMode = !target.thrownMode;
      }));
      extras.push(btn);
    }
    if (stats.switchSpec) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.switchActive ? "Alt: " + stats.switchActiveType : "Primary";
      btn.title = "Toggle Switch weapon damage mode";
      btn.addEventListener("click", () => update("Switched " + item.name + " damage mode", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (!target) return;
        const types = stats.switchSpec.types;
        if (!stats.switchActive) target.switchMode = types[0];
        else {
          const idx = types.indexOf(stats.switchActiveType);
          target.switchMode = idx >= 0 && idx + 1 < types.length ? types[idx + 1] : false;
        }
      }));
      extras.push(btn);
    }

    if (stats.modalModes?.length > 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.modalModeName;
      btn.title = "Switch Modal weapon mode";
      btn.addEventListener("click", () => update("Switched " + item.name + " mode", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.modalIndex = ((Number(target.modalIndex) || 0) + 1) % stats.modalModes.length;
      }));
      extras.push(btn);
    }
    if (stats.interlocking) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.detached ? "Detached" : "Combined";
      btn.title = "Detach / reattach interlocking weapon";
      btn.addEventListener("click", () => update((stats.detached ? "Reattached " : "Detached ") + item.name, next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.detached = !target.detached;
      }));
      extras.push(btn);
    }
    const shortTags = [];
    if (!stats.proficient) shortTags.push("Not proficient");
    if (stats.doubleProp) shortTags.push("Double");
    if (stats.critDice > 0) shortTags.push("+" + stats.critDice + (stats.critDice === 1 ? " crit die" : " crit dice"));
    if (c.prone && stats.ranged) {
      const hasCommandoProne = typeof resolveDefenseEffects === "function" && resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "noProneCloseRangedDisadv");
      shortTags.push(hasCommandoProne ? "Commando: no Prone disadvantage within 30 ft" : "Prone: disadvantage within 30 ft");
    }
    const props = stats.weaponProperties;
    const usable = weapons.includes(item);
    if (!usable && !props.fixed) continue;
    const options = weaponAttackOptions(stats);
    const loaded = weaponLoadedShots(item, props.reload, stats.modalModeName);
    const useAttack = trackFirstAttack || props.restriction || props.modes.length || props.conversion || props.dire || props.piercing || props.reckless || (stats.ranged && loaded != null);
    const fireOnly = Boolean(props.restriction);
    const summary = fireOnly
      ? (options.map(option => option.label + (option.saveDC != null ? " DC " + option.saveDC : "")).join(" / ") || "No compatible firing mode")
      : signed(stats.toHit) + " to hit · " + damageNotation(stats);
    if (loaded != null && useAttack && stats.ranged) shortTags.push(loaded + "/" + props.reload + " loaded");
    if (!usable) shortTags.push("Requires a free hand");
    actionEntry(action, item.name, [summary, ...shortTags].join(" · "), {
      mode: fireOnly || !usable ? null : attackMode(session, stats, "action"),
      details: () => showItem(item.name, item),
      onTextClick: event => showWeaponMathPopover(event.currentTarget, item.name, stats, profile, session, item),
      extras: usable ? extras : [],
      use: useAttack ? event => openWeaponAttack(event.currentTarget, profile, session, item, stats, "action", trackFirstAttack) : null,
      disabled: !usable || blocked || !options.length
    });
    if (usable && useAttack && stats.ranged && loaded != null && loaded < props.reload) {
      const noFreeHand = !weaponHasFreeHand(session, item);
      for (const [zone, timing] of [[action, "Action"], [bonus, "Bonus action"]]) {
        actionEntry(zone, "Reload " + item.name, noFreeHand ? "Requires a free hand" : timing + " · Load " + props.reload + " shots", {
          use: () => update("Reloaded " + item.name, next => {
            const weapon = next.equipped.find(gear => gear.id === item.id && gear.equipped);
            if (weapon) setWeaponLoadedShots(weapon, stats.modalModeName, props.reload);
          }),
          disabled: blocked || noFreeHand
        });
      }
    }
  }
  if (session.weaponAttackStarted) {
    actionEntry(freeTarget, "Start turn", "Reset first-attack tracking and end Defensive / Reckless", {
      useLabel: "Start turn",
      use: () => update("Started turn", startWeaponTurn)
    });
  }

  const unarmed = weaponStats(profile, "unarmed", raging, session);
  unarmed.armorPenalty = armor.nonproficient;
  actionEntry(action, "Unarmed strike", signed(unarmed.toHit) + " to hit · " + damageNotation(unarmed), {
    mode: attackMode(session, unarmed, "action"),
    details: () => showInfo("Unarmed strike", [["Attack", signed(unarmed.toHit)], ["Damage", damageNotation(unarmed)]], "Instead of using a weapon to make a melee weapon attack, you can use an unarmed strike. On a hit, an unarmed strike deals kinetic damage equal to 1 + your Strength modifier (or your Martial Arts or species natural weapon die if higher). You are proficient with your unarmed strikes."),
    onTextClick: ev => showWeaponMathPopover(ev.currentTarget, "Unarmed strike", unarmed, profile, session),
    use: trackFirstAttack ? () => update("Used unarmed strike", next => recordWeaponAttack(next)) : null,
    disabled: blocked
  });
  if (armor.shieldHasAnchor) {
    actionEntry(action, "Shield Anchor",
      armor.shieldAnchored ? ("Active · +" + armor.anchorCoverAC + " cover AC & Dexterity saves (no shield AC)") : "Action · Anchor for cover", {
        use: () => update(armor.shieldAnchored ? "Recovered anchored shield" : "Anchored shield", next => {
          const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
          if (sh) {
            sh.anchored = !sh.anchored;
            if (sh.anchored) sh.interlocked = false;
          }
        }),
        pressed: armor.shieldAnchored,
        disabled: blocked,
        details: () => showInfo("Shield Anchor", [["Property", "Anchor"]], (typeof propertyRule === "function" && propertyRule("Anchor", "Shield")?.description) || "As an action, you can anchor a shield with the Anchor property to gain cover AC while relinquishing its normal shield AC bonus.")
      });
  }
  if (armor.shieldHasInterlocking && !armor.shieldAnchored) {
    const reactBlocked = Boolean(!canReact(session) || armor.shieldImbalancedActive);
    actionEntry(reaction, "Interlock Shields",
      armor.shieldInterlocked
        ? ("Active · +" + armor.interlockingAC + " AC while within 5 ft of allied interlocking shield")
        : ("Reaction · +" + armor.shieldInterlockingVal + " AC while within 5 ft of an ally also wielding an interlocking shield"), {
        use: () => update(armor.shieldInterlocked ? "De-interlocked shields" : "Interlocked shields", next => {
          const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
          if (sh) sh.interlocked = !sh.interlocked;
        }),
        pressed: armor.shieldInterlocked,
        disabled: !armor.shieldInterlocked && reactBlocked,
        details: () => showInfo("Interlock Shields", [["Property", "Interlocking " + armor.shieldInterlockingVal]], (typeof propertyRule === "function" && propertyRule("Interlocking", "Shield")?.description) || "Reaction: interlock shields with an ally within 5 ft for bonus AC.")
      });
  }
  if (armor.shieldHasLambent) {
    actionEntry(bonus, "Lambent Shield Light",
      armor.shieldLambentActive
        ? "Active · Bright light 5 ft + dim light 5 ft (sight Stealth disadvantage)"
        : "Bonus action · Shed bright light 5 ft + dim light 5 ft", {
        use: () => update(armor.shieldLambentActive ? "Deactivated lambent shield light" : "Activated lambent shield light", next => {
          const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
          if (sh) sh.lambentActive = !sh.lambentActive;
        }),
        pressed: armor.shieldLambentActive,
        disabled: blocked,
        details: () => showInfo("Lambent Shield Light", [["Property", "Lambent"]], (typeof propertyRule === "function" && propertyRule("Lambent", "Shield")?.description) || "Bonus action: activate or deactivate bright light (5 ft) and dim light (+5 ft).")
      });
  }
  if (armor.shieldHasImbalanced) {
    actionEntry(freeTarget, "Imbalanced (Crit Hit)",
      armor.shieldImbalancedActive
        ? "Active until start of next turn · No reactions & 0 shield AC vs next attack"
        : "Trigger when critically hit · No reactions & 0 shield AC vs next attack until start of next turn", {
        use: () => update(armor.shieldImbalancedActive ? "Cleared Imbalanced shield penalty" : "Triggered Imbalanced shield penalty", next => {
          next.effects = next.effects || [];
          const idx = next.effects.findIndex(e => normalizeName(e.name) === "imbalanced shield");
          if (idx >= 0) next.effects.splice(idx, 1);
          else next.effects.push(conditionEntry("Imbalanced Shield", 1, false, { id: newID(), note: "No reactions · 0 shield AC vs next attack", persistent: false, durationSpec: { anchor: "startOfOwnNextTurn" }, source: { kind: "shieldProperty", name: "Imbalanced" } }));
        }),
        pressed: armor.shieldImbalancedActive,
        details: () => showInfo("Imbalanced Shield", [["Property", "Imbalanced"]], (typeof propertyRule === "function" && propertyRule("Imbalanced", "Shield")?.description) || "When critically hit, you cannot take reactions and gain no shield AC against the next attack until the start of your next turn.")
      });
  }
  if (armor.chargingMax > 0) {
    const chSpent = session.spent?.armor_charging !== undefined ? session.spent.armor_charging : armor.chargingMax;
    const chStored = clamp(armor.chargingMax - chSpent, 0, armor.chargingMax);
    if (chStored > 0) {
      actionEntry(freeTarget, "Expend Charging",
        "+" + chStored + " same-type damage on next melee weapon hit (" + chStored + "/" + armor.chargingMax + " stored)", {
          use: () => update("Expended " + chStored + " Charging charge(s)", next => {
            next.spent = next.spent || {};
            next.spent.armor_charging = armor.chargingMax;
          }),
          useLabel: "Expend",
          details: () => showInfo("Charging", [["Stored Charges", chStored + " / " + armor.chargingMax]], (typeof propertyRule === "function" && propertyRule("Charging", "Armor")?.description) || "Expend stored charges on your next melee weapon hit for additional same-type damage.")
        });
    }
  }
  if (armor.shieldVersProp && !armor.shieldAnchored) {
    const shItem = session.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
    const versVal = parseNumericStat(armor.shieldVersProp) || 1;
    actionEntry(freeTarget, "Versatile Shield Grip", shItem?.twoHanded ? ("2H · +" + armor.shieldVersBonus + " AC") : ("1H · Switch to 2H for +" + versVal + " AC"), {
      use: () => update(shItem?.twoHanded ? "Switched shield grip to 1H" : "Switched shield grip to 2H", next => {
        const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
        if (sh) sh.twoHanded = !sh.twoHanded;
      }),
      pressed: Boolean(shItem?.twoHanded),
      disabled: blocked,
      details: () => showInfo("Versatile Shield", [["Property", armor.shieldVersProp]], (typeof propertyRule === "function" && propertyRule("Versatile", "Shield")?.description) || "A shield with the Versatile property can be wielded with two hands for additional AC.")
    });
  }
  if (armor.spikedProp && !armor.shieldAnchored) {
    const spM = armor.spikedProp.match(/(\d+)d(\d+)/i);
    const spDice = spM ? spM[1] + "d" + spM[2] : "1d4";
    const strAtkMod = effectiveModifier(profile, session, "Strength", c);
    const strDmgMod = modifier(effectiveScores(profile, session).Strength);
    const cEff = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : { weaponRules: [] };
    const pEff = typeof resolveProficiencyEffects === "function" ? resolveProficiencyEffects(profile, session) : { weapons: [] };
    const hasImprovProf = Boolean(
      (cEff.weaponRules || []).some(wr => wr.kind === "improvisedShield" && wr.params?.proficient)
      || (pEff.weapons || []).some(w => normalizeName(w.target).includes("improvised"))
    );
    const baseImprovDie = (cEff.weaponRules || []).map(wr => wr.params?.improvisedDie).find(Boolean) || "1d4";
    const impStepMap = { "1d4": "1d6", "1d6": "1d8", "1d8": "2d4" };
    const impDice = impStepMap[baseImprovDie] || "1d6";
    const atkBonus = strAtkMod + (hasImprovProf ? profile.proficiency : 0);
    actionEntry(action, "Spiked Shield (Improvised)",
      signed(atkBonus) + " to hit · " + impDice + (strDmgMod ? signed(strDmgMod) : "") + " kinetic · Shove/trip: " + spDice + (strDmgMod ? signed(strDmgMod) : "") + " kinetic", {
        mode: attackMode(session, {melee: true, ability: "Strength", armorPenalty: armor.nonproficient}, "action"),
        details: () => showInfo("Spiked Shield", [["Property", armor.spikedProp], ["Improvised Die", impDice + " (stepped up)"], ["Shove / Trip Rider", spDice + (strDmgMod ? signed(strDmgMod) : "") + " kinetic"]], (typeof propertyRule === "function" && propertyRule(armor.spikedProp, "Shield")?.description) || "Shove or trip deals spiked damage + Strength modifier kinetic; improvised weapon damage increases by one step.")
      });
  }

  // Force & Tech Power Cast Chooser buttons
  if (typeof knownPowerRecords === "function") {
    const allPowers = knownPowerRecords(profile);
    const actionPowers = allPowers.filter(p => p.castingPeriod === "Action");
    const bonusPowers = allPowers.filter(p => p.castingPeriod === "BonusAction");
    const reactionPowers = allPowers.filter(p => p.castingPeriod === "Reaction");
    const specialPowers = allPowers.filter(p => p.castingPeriod === "None" || p.castingPeriod === "Special");
    const castSummary = [];
    if (casting.hasForce) castSummary.push("Force DC " + casting.forceDC + " · " + signed(casting.forceAttack));
    if (casting.hasTech) castSummary.push("Tech DC " + casting.techDC + " · " + signed(casting.techAttack));

    const showCastingTimingInfo = (title, timingLabel, powersList, timingRule, filterKey, isBlocked) => {
      const facts = [["Casting Time", timingLabel]];
      if (casting.hasForce) {
        facts.push(["Forcecasting", "DC " + casting.forceDC + " · " + signed(casting.forceAttack) + " attack · " + casting.forceRemaining + "/" + casting.forceMax + " Force Points (max L" + casting.maxForceLevel + ")"]);
      }
      if (casting.hasTech) {
        facts.push(["Techcasting", "DC " + casting.techDC + " · " + signed(casting.techAttack) + " attack · " + casting.techRemaining + "/" + casting.techMax + " Tech Points (max L" + casting.maxTechLevel + ")"]);
      }
      const sorted = [...powersList].sort((a, b) => (a.level || 0) - (b.level || 0) || a.name.localeCompare(b.name));
      const lines = [timingRule];
      if (sorted.length) {
        lines.push("### Known " + title + " (" + sorted.length + ")");
        for (const p of sorted) {
          const lvl = p.level ? "L" + p.level : "At-will";
          const conc = p.concentration ? " · Concentration" : "";
          const cost = p.level ? " · " + powerPointCost(p.level) + " points" : "";
          lines.push("- **" + p.name + "** (" + p.type + " · " + lvl + cost + conc + ")");
        }
      }
      showInfo(title, facts, lines.join("\n\n"));
      const body = getElementById("infoBody");
      if (body && !isBlocked) {
        const bar = appendText(body, "div", "");
        bar.className = "row wrap";
        bar.style.marginTop = "12px";
        const castNow = appendText(bar, "button", "Open Cast dialog");
        castNow.type = "button";
        castNow.className = "primary";
        castNow.addEventListener("click", () => {
          getElementById("infoModal")?.close();
          openCastChooser(filterKey, document.activeElement);
        });
      }
    };

    if (actionPowers.length || allPowers.length) {
      const list = actionPowers.length ? actionPowers : allPowers;
      actionEntry(action, "Action power", [
        list.length + " known",
        ...castSummary
      ].join(" · "), {
        use: event => openCastChooser(actionPowers.length ? "Action" : "all", event.currentTarget),
        disabled: blocked,
        details: () => showCastingTimingInfo(
          "Action Powers",
          "1 Action",
          list,
          "At-will powers cost 0 points. Leveled powers spend Force or Tech Points equal to **1 + power level** (6th–9th level powers can each be cast once per long rest).",
          actionPowers.length ? "Action" : "all",
          blocked
        )
      });
    }
    const effectiveBonusPowers = typeof filteredCastPowers === "function" ? filteredCastPowers(profile, "BonusAction", session) : bonusPowers;
    if (effectiveBonusPowers.length) {
      const quickOnly = !bonusPowers.length && effectiveBonusPowers.length > 0;
      const bonusSub = (quickOnly ? effectiveBonusPowers.length + " quickenable (+2 Force points) · " : bonusPowers.length + " known" + (effectiveBonusPowers.length > bonusPowers.length ? " (+" + (effectiveBonusPowers.length - bonusPowers.length) + " quickenable)" : "") + " · ") + castSummary.join(" · ");
      actionEntry(bonus, "Bonus action power", bonusSub, {
        use: event => openCastChooser("BonusAction", event.currentTarget),
        disabled: blocked,
        details: () => showCastingTimingInfo(
          "Bonus Action Powers",
          "1 Bonus Action",
          effectiveBonusPowers,
          "**SW5e Bonus Action Rule:** If you cast a Force or Tech power with a casting time of 1 bonus action, you can't cast another power during the same turn except an **at-will** power with a casting time of 1 action.",
          "BonusAction",
          blocked
        )
      });
    }
    if (reactionPowers.length) {
      actionEntry(reaction, "Reaction power", reactionPowers.length + " known · " + castSummary.join(" · "), {
        use: event => openCastChooser("Reaction", event.currentTarget),
        disabled: !canReact(session),
        details: () => showCastingTimingInfo(
          "Reaction Powers",
          "1 Reaction",
          reactionPowers,
          "Cast immediately in response to the power's stated trigger (on your turn or another creature's). You regain your reaction at the start of your next turn.",
          "Reaction",
          !canReact(session)
        )
      });
    }
    if (specialPowers.length) {
      actionEntry(freeTarget, "Special / Triggered power", specialPowers.map(p => p.name).join(", "), {
        use: event => openCastChooser("Special", event.currentTarget),
        disabled: blocked,
        details: () => showCastingTimingInfo(
          "Special / Triggered Powers",
          "Special / Longer",
          specialPowers,
          "Powers with longer casting times (1 minute, 10 minutes, 1 hour) or special triggers. Casting a power with a casting time longer than 1 action requires your action and concentration each turn until complete.",
          "Special",
          blocked
        )
      });
    }
  }

  // Berserker: Reckless Attack (Free trigger on first attack), Rage/Frenzy/Leap (Bonus Action; L20 free entry), Relentless Rage (L11+)
  const _bersLvl = classLevelOf(profile, "Berserker");
  const _sentLvl = classLevelOf(profile, "Sentinel");
  const _consLvl = classLevelOf(profile, "Consular");
  const _opLvl = classLevelOf(profile, "Operative");
  const _gdnLvl = classLevelOf(profile, "Guardian");
  const _figLvl = classLevelOf(profile, "Fighter");
  const _mnkLvl = classLevelOf(profile, "Monk");
  const _sctLvl = classLevelOf(profile, "Scout");
  const _engLvl = classLevelOf(profile, "Engineer");
  const _schLvl = classLevelOf(profile, "Scholar");
  if (traits.isBerserker && _bersLvl >= 2) {
    actionEntry(freeTarget, "Reckless Attack", session.reckless ? "Active · Advantage on Strength melee attacks · incoming advantage" : "Free on first attack of turn", {
      use: () => update(session.reckless ? "Cleared Reckless Attack" : "Enabled Reckless Attack", next => { next.reckless = !next.reckless; }),
      pressed: Boolean(session.reckless),
      disabled: blocked,
      details: () => showInfo("Reckless Attack", [["Timing", "No action (on first attack of turn)"]], classRule(profile, "Reckless Attack"))
    });
  }
  const effRageMax = typeof effectiveRageStats === "function" ? effectiveRageStats(profile, session).rageMax : (profile.rageMax || 0);
  if (traits.isBerserker && effRageMax) {
    const unlimitedRage = effRageMax >= 99;
    const freeRageEntry = _bersLvl >= 20;
    const rageZone = (!raging && freeRageEntry) ? freeTarget : bonus;
    const rageSub = raging
      ? ("Active · Resistance: " + (resistanceNames(profile, session).join(", ") || "kinetic, energy") + (_bersLvl >= 15 ? " · Persistent Rage" : ""))
      : (freeRageEntry ? "Unlimited · No action to enter (bonus action to end)" : (unlimitedRage ? "Unlimited" : (effRageMax - (session.spent.rage || 0)) + " uses left"));
    actionEntry(rageZone, "Rage", rageSub, {
      use: raging ? () => update("Ended Rage", endRage) : () => startRage(false),
      pressed: raging,
      disabled: blocked || (!raging && ((!unlimitedRage && (session.spent.rage || 0) >= effRageMax) || armor.heavy)),
      details: () => showInfo("Rage", [["Resistance", resistanceNames(profile, {...session, rage: {frenzy: false}}).join(", ")]], classRule(profile, "Rage"))
    });
    // Relentless Rage (L11+) is driven via zeroHpStopper (Defense pill + automatic 0-HP prompt).
    if (normalizeName(session.approach) === "frenzied approach") {
      const frenzy = session.rage?.frenzy;
      const text = frenzy ? "One melee weapon attack as a bonus action" :
        (raging ? "Choose when entering Rage" : (session.spent.frenzy || 0) ? "Adds 1 exhaustion when Rage ends" : "First use has no exhaustion");
      actionEntry(bonus, "Frenzy", text, {
        use: () => startRage(true),
        disabled: blocked || raging || armor.heavy || (!unlimitedRage && (session.spent.rage || 0) >= effRageMax),
        details: () => showInfo("Frenzy", [["Source", session.approach]], approachRule(profile, session, "Frenzy"))
      });
    }
    if (profile.leapMax && !(typeof hasClassOption === "function" && hasClassOption(profile, session, "Fyrnock's Instinct"))) {
      const lMax = profile.leapMax;
      const lRem = Math.max(0, lMax - (session.spent.leap || 0));
      const strDmg = Math.max(0, modifier(effectiveScores(profile, session).Strength));
      actionEntry(bonus, "Fyrnock’s Leap", lRem + "/" + lMax + " left · While raging · Leap 30 ft, " + strDmg + " kinetic damage within 5 ft", {
        use: () => useLeap(),
        disabled: blocked || !raging || lRem <= 0,
        details: () => showInfo("Fyrnock’s Leap", [["Source", "Fyrnock’s Instinct"]], classRule(profile, "Fyrnock's Instinct"))
      });
    }
  }

  // Sentinel: Force-Empowered Self (ALL THREE are no-action triggers -> Free / Triggered!)
  if (traits.isSentinel && _sentLvl >= 2) {
    const kcLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Sentinel", "Kinetic Combat") : (profile.level || 1);
    const kcStep = kcLvl > 0 ? (classRecord("Sentinel")?.levelChanges?.[String(Math.min(20, kcLvl))] || step) : step;
    const kcDie = kcStep["Kinetic Combat"] || step["Kinetic Combat"] || "1d4";
    const fesRules = classRule(profile, "Force-Empowered Self");
    const isLivingCurrent = normalizeName(characterClasses(profile, session).find(c => normalizeName(c.name) === "sentinel")?.archetype || session.approach) === "path of the living current" && _sentLvl >= 3;
    const lcScores = effectiveScores(profile, session);
    const lcMod = isLivingCurrent ? Math.max(1, modifier(lcScores.Wisdom), modifier(lcScores.Charisma)) : 0;
    const lcOvercharged = isLivingCurrent && _sentLvl >= 13;
    const defUp = isLivingCurrent ? [] : actionUpgradeNotes(profile, session, ["Force-Empowered Self", "Force-Empowered Self: Deflection"]);
    const dsUp = isLivingCurrent ? [] : actionUpgradeNotes(profile, session, ["Force-Empowered Self", "Force-Empowered Self: Double Strike"]);
    const stUp = isLivingCurrent ? [] : actionUpgradeNotes(profile, session, ["Force-Empowered Self", "Force-Empowered Self: Slow Time"]);
    const deflectOn = hasEffect("Force-Empowered Self: Deflection");
    const deflectText = (deflectOn
      ? ("Active · AC boosted" + (isLivingCurrent ? " · If hit, attacker takes " + lcMod + " lightning" : ""))
      : ("When targeted (no action) · 1 FP · +" + kcDie + " AC" + (isLivingCurrent ? " · If hit, " + lcMod + " lightning" + (lcOvercharged ? " · Force reroll (lower)" : "") : "")))
      + (defUp.length ? " · " + defUp.join(" · ") : "");
    actionEntry(freeTarget, "Deflection", deflectText, {
      use: event => deflectOn ? toggleNamedEffect("Force-Empowered Self: Deflection") : openDeflectionDialog(event.currentTarget),
      pressed: deflectOn,
      disabled: blocked || (!deflectOn && casting.forceTotalRemaining < 1),
      details: () => showInfo("Force-Empowered Self: Deflection", [["Timing", "No action required"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
    const kcMax = parseNumericStat(String(kcDie).replace(/^1?d/i, "")) || 4;
    const isSent20 = _sentLvl >= 20;
    const dsText = "On weapon hit (no action) · 1 Force Point · +" + kcDie + (isLivingCurrent ? " (or +" + kcDie + "+" + lcMod + " lightning" + (lcOvercharged ? "; advantage on next attack against target" : "") + ")" : " damage") + (isSent20 ? " · Center of the Force: choose max (" + kcMax + ") once/turn" : "") + (dsUp.length ? " · " + dsUp.join(" · ") : "");
    actionEntry(freeTarget, "Double Strike", dsText, {
      use: () => update("Force-Empowered Self: Double Strike (+" + kcDie + (isLivingCurrent ? "/+" + lcMod + " lightning" : "") + ")", next => {
        spendForcePoints(next, 1);
      }),
      disabled: blocked || casting.forceTotalRemaining < 1,
      details: () => showInfo("Force-Empowered Self: Double Strike", [["Timing", "No action (on hit)"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
    const slowTimeOn = hasEffect("Force-Empowered Self: Slow Time");
    const stText = (slowTimeOn
      ? ("Active · Speed boosted" + (isLivingCurrent ? " · Shocked immune · Slowed −5 ft" + (lcOvercharged ? " · Move 10 ft → advantage on next attack" : "") : ""))
      : ("When moving (no action) · 1 Force Point · +5 × " + kcDie + " ft" + (isLivingCurrent ? " · Shocked immune · Slowed −5 ft" + (lcOvercharged ? " · Move 10 ft → advantage" : "") : "")))
      + (stUp.length ? " · " + stUp.join(" · ") : "");
    actionEntry(freeTarget, "Slow Time", stText, {
      use: event => slowTimeOn ? toggleNamedEffect("Force-Empowered Self: Slow Time") : openSlowTimeDialog(event.currentTarget),
      pressed: slowTimeOn,
      disabled: blocked || (!slowTimeOn && casting.forceTotalRemaining < 1),
      details: () => showInfo("Force-Empowered Self: Slow Time", [["Timing", "No action (when moving)"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
    if (_sentLvl >= 15) {
      const eeMod = Math.max(1, modifier(lcScores.Wisdom), modifier(lcScores.Charisma));
      actionEntry(freeTarget, "Enlightened Evasion", "On saving throw (2 Force Points) · +" + eeMod + " to save; 0 damage on pass, half on fail", {
        use: () => update("Enlightened Evasion (2 Force Points, +" + eeMod + " save)", next => {
          spendForcePoints(next, 2);
        }),
        disabled: blocked || casting.forceTotalRemaining < 2,
        details: () => showInfo("Enlightened Evasion", [["Timing", "When forced to make a saving throw"], ["Cost", "2 Force Points"], ["Bonus", "+" + eeMod + " (Wisdom or Charisma)"]], classRule(profile, "Enlightened Evasion"))
      });
    }
  }

  // Consular: Contextual reactive metamagics (Refocused Power while concentrating, Seeking Power) & Force Shield
  // (Force Affinity config lives in Class Binder & triggers dynamically on cast; on-cast Force-Empowered Castings live inside Cast Dialog)
  if (traits.isConsular && _consLvl >= 2) {
    // Refocused Power & Seeking Power are rendered via unified actionGrant (with cost: { pool: "force", amount: 2 }).
    const shieldRes = characterResources(profile, session).find(r => r.id === "forceShield");
    const shieldOn = hasEffect("Force Shield");
    const scores = effectiveScores(profile, session);
    const shieldBonus = Math.max(1, modifier(scores.Wisdom), modifier(scores.Charisma));
    actionEntry(reaction, "Force Shield", shieldOn ? "Active · +" + shieldBonus + " AC" : (shieldRes?.value || 0) + "/" + (shieldRes?.max || 2) + " uses · +" + shieldBonus + " AC until next turn", {
      use: () => {
        if (shieldOn) {
          toggleNamedEffect("Force Shield");
        } else {
          update("Activated Force Shield (+" + shieldBonus + " AC)", next => {
            next.spent.forceShield = (next.spent.forceShield || 0) + 1;
            next.effects.push(conditionEntry("Force Shield", 1, false, {id: newID(), note: "+" + shieldBonus + " AC", persistent: false, durationSpec: { anchor: "startOfOwnNextTurn" }, source: { kind: "classFeature", name: "Force Shield" }}));
          });
        }
      },
      pressed: shieldOn,
      disabled: !canReact(session) || (!shieldOn && !(shieldRes?.value > 0)),
      details: () => showInfo("Force Shield", [["Timing", "Reaction"], ["AC bonus", "+" + shieldBonus]], classRule(profile, "Force Shield"))
    });
  }

  // Operative: Sneak Attack (Free once/turn on hit), Cunning Action (Bonus), Uncanny Dodge (Reaction)
  if (traits.sneakAttack) {
    actionEntry(freeTarget, "Sneak Attack", "Once per turn on hit (finesse or ranged weapon) · +" + traits.sneakAttack, {
      details: () => showInfo("Sneak Attack", [["Timing", "Free trigger (once per turn on hit)"], ["Damage", traits.sneakAttack]], classRule(profile, "Sneak Attack"))
    });
  }
  if (traits.isOperative && _opLvl >= 2) {
    const hiddenOn = hasEffect("Hidden");
    actionEntry(bonus, "Cunning Action · Hide", hiddenOn ? "Active · Hidden" : "Dash, Disengage, or Hide as a bonus action", {
      use: () => toggleNamedEffect("Hidden", "Cunning Action"),
      pressed: hiddenOn,
      disabled: blocked,
      details: () => showInfo("Cunning Action", [["Source", "Operative 2"]], classRule(profile, "Cunning Action"))
    });
  }
  if (traits.isOperative && _opLvl >= 5) {
    actionEntry(reaction, "Uncanny Dodge", "Halve incoming attack damage from an attacker you can see", {
      disabled: !canReact(session),
      details: () => showInfo("Uncanny Dodge", [["Source", "Operative 5"], ["Timing", "Reaction"]], classRule(profile, "Uncanny Dodge"))
    });
  }

  // Guardian: Channel the Force (Cause Harm Action / Lend Aid Bonus Action), Force-Empowered Strikes, Passive Auras
  if (traits.isGuardian) {
    const cfRes = characterResources(profile, session).find(r => r.id === "channelForce");
    const cfLeft = cfRes?.value || 0;
    const cfMax = cfRes?.max || 2;
    const gScores = effectiveScores(profile, session);
    const causeDmg = _gdnLvl + Math.max(1, modifier(gScores.Charisma));
    const aidHeal = _gdnLvl + Math.max(1, modifier(gScores.Wisdom));
    const cfChoice = normalizeName(session.channelForceChoice || "");
    const showCauseHarm = !cfChoice || cfChoice === "cause harm";
    const showLendAid = !cfChoice || cfChoice === "lend aid";
    if (showCauseHarm) {
      actionEntry(action, "Channel the Force · Cause Harm", cfLeft + "/" + cfMax + " (short rest) · 60 ft · Constitution save DC " + (casting.universalForceDC || casting.forceDC || 10) + " · " + causeDmg + " necrotic (half on pass)", {
        use: () => update("Channel the Force · Cause Harm (" + causeDmg + " necrotic)", next => { next.spent.channelForce = (next.spent.channelForce || 0) + 1; }),
        disabled: blocked || cfLeft <= 0,
        details: () => showInfo("Channel the Force · Cause Harm", [["Uses", cfLeft + "/" + cfMax + " (short rest)"], ["Save DC", "Constitution DC " + (casting.universalForceDC || casting.forceDC || 10)], ["Damage", causeDmg + " necrotic (half on pass)"]], classRule(profile, "Channel the Force"))
      });
    }
    if (showLendAid) {
      actionEntry(bonus, "Channel the Force · Lend Aid", cfLeft + "/" + cfMax + " (short rest) · Touch · Heal " + aidHeal + " HP or cure 1 poison/disease", {
        use: event => {
          const {dialog, form, body, note, confirm} = createModalFrame("Channel the Force · Lend Aid", event.currentTarget);
          confirm.textContent = "Use Lend Aid";
          note("Touch a beast or humanoid within 5 ft to restore " + aidHeal + " HP, or neutralize 1 poison or disease.");
          let targetMode = "self";
          const pills = appendText(form, "div", "");
          pills.className = "row wrap";
          for (const [val, lbl] of [["self", "Heal Self (+" + aidHeal + " HP)"], ["ally", "Heal Ally (+" + aidHeal + " HP)"], ["cure", "Neutralize Poison / Disease"]]) {
            const p = appendText(pills, "button", lbl);
            p.type = "button";
            p.className = "swPropChip";
            p.setAttribute("aria-pressed", String(val === targetMode));
            p.addEventListener("click", () => {
              targetMode = val;
              for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === p));
            });
          }
          form.insertBefore(pills, form.querySelector("footer"));
          form.addEventListener("submit", e => {
            e.preventDefault();
            dialog.close();
            if (targetMode === "self") {
              update("Lend Aid · +" + aidHeal + " HP", (next, prof) => {
                next.spent.channelForce = (next.spent.channelForce || 0) + 1;
                recoverHP(next, aidHeal, hitPointMaximum(prof, next));
              });
            } else {
              update(targetMode === "cure" ? "Lend Aid · Neutralized poison/disease" : "Lend Aid · Healed ally (+" + aidHeal + " HP)", next => {
                next.spent.channelForce = (next.spent.channelForce || 0) + 1;
              });
            }
          });
          dialog.showModal();
        },
        disabled: blocked || cfLeft <= 0,
        details: () => showInfo("Channel the Force · Lend Aid", [["Uses", cfLeft + "/" + cfMax + " (short rest)"], ["Healing", aidHeal + " HP (Guardian level + Wisdom modifier, minimum +1)"]], classRule(profile, "Channel the Force"))
      });
    }
    if (_gdnLvl >= 2) {
      const fsLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Guardian", "Focused Strikes") : _gdnLvl;
      const fsStep = fsLvl > 0 ? (classRecord("Guardian")?.levelChanges?.[String(Math.min(20, fsLvl))] || step) : step;
      const fesMaxStr = fsStep["Focused Strikes"] || step["Focused Strikes"] || "2d8";
      const fesMaxDice = Math.max(2, parseNumericStat(fesMaxStr) || 2);
      const fesSpendCap = Math.min(fesMaxDice, casting.forceTotalRemaining);
      actionEntry(freeTarget, "Force-Empowered Strikes", "On melee hit (no action) · 1–" + fesMaxDice + " Force points · +1d8 per point (maximum " + fesMaxStr + ")", {
        use: event => {
          if (fesSpendCap <= 1) {
            update("Force-Empowered Strike (+1d8 · 1 Force point)", next => { spendForcePoints(next, 1); });
            return;
          }
          const {dialog, form, body, note, confirm} = createModalFrame("Force-Empowered Strikes", event.currentTarget);
          let chosen = 1;
          confirm.textContent = "Spend 1 Force Point (+1d8)";
          note("Spend 1 to " + fesSpendCap + " Force points on a melee weapon hit (maximum " + fesMaxStr + "). Damage is the same type as the weapon.");
          const pills = appendText(body, "div", "");
          pills.className = "row wrap";
          for (let n = 1; n <= fesSpendCap; n++) {
            const p = appendText(pills, "button", n + " Force pt" + (n === 1 ? "" : "s") + " (+" + n + "d8)");
            p.type = "button";
            p.className = "swPropChip";
            p.setAttribute("aria-pressed", String(n === chosen));
            p.addEventListener("click", () => {
              chosen = n;
              for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === p));
              confirm.textContent = "Spend " + n + " Force Point" + (n === 1 ? "" : "s") + " (+" + n + "d8)";
            });
          }
          form.addEventListener("submit", e => {
            e.preventDefault();
            dialog.close();
            update("Force-Empowered Strikes (+" + chosen + "d8 · " + chosen + " Force point" + (chosen === 1 ? "" : "s") + ")", next => {
              spendForcePoints(next, chosen);
            });
          });
          dialog.showModal();
        },
        disabled: blocked || casting.forceTotalRemaining < 1,
        details: () => showInfo("Force-Empowered Strikes", [["Timing", "No action (on hit)"], ["Maximum bonus", fesMaxStr]], classRule(profile, "Force-Empowered Strikes"))
      });
    }
    if (_gdnLvl >= 14) {
      actionEntry(action, "Cleansing Touch", cfLeft + "/" + cfMax + " (short rest) · Touch · End one force power on yourself or a willing creature", {
        use: () => update("Cleansing Touch (1 Channel the Force)", next => { next.spent.channelForce = (next.spent.channelForce || 0) + 1; }),
        disabled: blocked || cfLeft <= 0,
        details: () => showInfo("Cleansing Touch", [["Uses", cfLeft + "/" + cfMax + " (short rest)"], ["Timing", "1 Action · Touch"]], classRule(profile, "Cleansing Touch"))
      });
    }
    if (_gdnLvl >= 3) {
      const myAuras = ownedClassOptions(profile, session).filter(o => o.poolName === "Guardian Auras");
      const conscious = !c.unconscious && !c.dead;
      const radius = step["Aura Radius"] || "5 ft.";
      // Aura of Vigor is rendered via unified actionGrant (applyTempHP, amountFormula: "wisChaMod", cadence: "oncePerTurn").
      if (myAuras.length) {
        const auraNames = myAuras.map(o => o.name).join(", ");
        actionEntry(freeTarget, "Guardian Auras (" + radius + ")", (conscious ? "Passive · Always active while conscious · " : "Suppressed (unconscious) · ") + auraNames, {
          details: () => showInfo("Guardian Auras", [["Radius", radius], ["Active Auras", auraNames]], myAuras.map(o => o.name + ": " + o.description).join("\n\n"))
        });
      }
    }
  }

  // Fighter: Second Wind (Bonus), Action Surge (Free!), Indomitable (Free on failed save!)
  if (traits.isFighter) {
    const swRes = characterResources(profile, session).find(r => r.id === "secondWind");
    const swLvl = typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Fighter", "Second Wind") : (profile.level || 1);
    actionEntry(bonus, "Second Wind", (swRes?.value || 0) + "/" + (swRes?.max || 1) + " (short rest) · Heal 1d10 + " + swLvl, {
      use: event => openSecondWindDialog(event.currentTarget),
      disabled: blocked || !(swRes?.value > 0),
      details: () => showInfo("Second Wind", [["Timing", "Bonus action"], ["Recharge", "Short or long rest"]], classRule(profile, "Second Wind"))
    });
    if (_figLvl >= 2) {
      const asRes = characterResources(profile, session).find(r => r.id === "actionSurge");
      const asMax = asRes?.max || 1;
      actionEntry(freeTarget, "Action Surge", "No action · " + (asRes?.value || 0) + "/" + asMax + " (short rest) · Take one additional action" + (asMax >= 2 ? " (max once per turn)" : ""), {
        use: () => update("Used Action Surge", next => { next.spent.actionSurge = (next.spent.actionSurge || 0) + 1; }),
        disabled: blocked || !(asRes?.value > 0),
        details: () => showInfo("Action Surge", [["Timing", "No action required"], ["Recharge", "Short or long rest"]], classRule(profile, "Action Surge"))
      });
    }
    if (_figLvl >= 9) {
      const indRes = characterResources(profile, session).find(r => r.id === "indomitable");
      actionEntry(freeTarget, "Indomitable", "On failed save (no action) · " + (indRes?.value || 0) + "/" + (indRes?.max || 1) + " (long rest) · Reroll save (must use new roll)", {
        use: () => update("Used Indomitable", next => { next.spent.indomitable = (next.spent.indomitable || 0) + 1; }),
        disabled: !(indRes?.value > 0),
        details: () => showInfo("Indomitable", [["Timing", "No action (on failed save)"], ["Recharge", "Long rest"]], classRule(profile, "Indomitable"))
      });
    }
  }

  // Monk: Bonus actions (Martial Arts strike, Dash/Disengage), Focus (Flurry, Patient Defense, Step of the Wind w/ L11 upgrades), Free (Stunning Strike, Diamond Soul, Perfect Self), Reaction (Deflect Missiles, Slow Fall)
  if (traits.isMonk) {
    const focusRes = characterResources(profile, session).find(r => r.id === "focus");
    const focusLeft = focusRes?.value || 0;
    const focusMax = focusRes?.max || 0;
    const maActive = typeof monkMartialArtsActive === "function" ? monkMartialArtsActive(profile, session, traits) : true;
    const mScores = effectiveScores(profile, session);
    const focusAb = typeof monkFocusAbility === "function" ? monkFocusAbility(profile, session, true) : "Wisdom";
    const focusDC = 8 + (profile.proficiency || 2) + modifier(mScores[focusAb]);
    const isL11 = _mnkLvl >= 11;
    actionEntry(bonus, "Martial Arts strike", maActive
      ? ("One unarmed strike after Attack action (" + damageNotation(unarmed) + ")")
      : "Suppressed while wearing armor or wielding a shield", {
      details: () => showInfo("Martial Arts", [["Die", step["Martial Arts"] || "d4"], ["Status", maActive ? "Active" : "Suppressed (armor/shield)"]], classRule(profile, "Martial Arts"))
    });
    actionEntry(bonus, "Martial Arts · Dash / Disengage", maActive
      ? "Take the Dash or Disengage action as a bonus action"
      : "Suppressed while wearing armor or wielding a shield", {
      details: () => showInfo("Martial Arts", [["Timing", "Bonus action"], ["Status", maActive ? "Active" : "Suppressed (armor/shield)"]], classRule(profile, "Martial Arts"))
    });
    if (_mnkLvl >= 2) {
      const openFocusUpgradeModal = (title, trigger, opts) => {
        const {dialog, form, body, note, confirm} = createModalFrame(title, trigger);
        let picked = opts[0];
        confirm.textContent = "Spend " + picked.cost + " Focus Point" + (picked.cost === 1 ? "" : "s");
        note("Choose standard (1 Focus Point) or 11th-level upgraded (2 Focus Points) effect.");
        const pills = appendText(body, "div", "");
        pills.className = "row wrap";
        for (const opt of opts) {
          const p = appendText(pills, "button", opt.label);
          p.type = "button";
          p.className = "swPropChip";
          p.disabled = focusLeft < opt.cost;
          p.setAttribute("aria-pressed", String(opt === picked));
          p.addEventListener("click", () => {
            picked = opt;
            for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b === p));
            confirm.textContent = "Spend " + opt.cost + " Focus Point" + (opt.cost === 1 ? "" : "s");
          });
        }
        form.addEventListener("submit", e => {
          e.preventDefault();
          dialog.close();
          picked.apply();
        });
        dialog.showModal();
      };
      actionEntry(freeTarget, "Flurry of Blows", isL11
        ? "On Martial Arts bonus attack (no action) · 1 Focus: +1 unarmed strike · 2 Focus: +2 unarmed strikes"
        : "On Martial Arts bonus attack (no action) · 1 Focus Point · +1 additional unarmed strike", {
        use: event => {
          if (isL11 && focusLeft >= 2) {
            openFocusUpgradeModal("Flurry of Blows", event.currentTarget, [
              { cost: 1, label: "1 Focus · +1 unarmed strike", apply: () => update("Flurry of Blows (1 Focus · +1 strike)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }) },
              { cost: 2, label: "2 Focus (L11) · +2 unarmed strikes", apply: () => update("Flurry of Blows (2 Focus · +2 strikes)", next => { next.spent.focus = (next.spent.focus || 0) + 2; }) }
            ]);
          } else {
            update("Flurry of Blows (1 Focus · +1 strike)", next => { next.spent.focus = (next.spent.focus || 0) + 1; });
          }
        },
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Flurry of Blows", [["Timing", "No action (on Martial Arts bonus attack)"], ["Cost", isL11 ? "1 or 2 Focus Points" : "1 Focus Point"]], classRule(profile, "Focus"))
      });
      actionEntry(freeTarget, "Patient Defense", isL11
        ? "On bonus Disengage (no action) · 1 Focus: also Dodge · 2 Focus: Dodge + 1 extra reaction"
        : "On bonus Disengage (no action) · 1 Focus Point · Also take Dodge (applies Dodging)", {
        use: event => {
          const applyPD = (cost, extraReaction) => update(
            extraReaction ? "Patient Defense (2 Focus · Dodging + 1 reaction)" : "Patient Defense (1 Focus · Dodging)",
            next => {
              next.spent.focus = (next.spent.focus || 0) + cost;
              if (!next.effects.some(e => normalizeName(e.name) === "dodging")) {
                next.effects.push(conditionEntry("Dodging", 1, false, {id: newID(), note: extraReaction ? "Patient Defense (+1 reaction)" : "Patient Defense", persistent: true, durationSpec: { anchor: "startOfOwnNextTurn" }, source: { kind: "classFeature", name: "Patient Defense" }}));
              }
            }
          );
          if (isL11 && focusLeft >= 2) {
            openFocusUpgradeModal("Patient Defense", event.currentTarget, [
              { cost: 1, label: "1 Focus · Also Dodge", apply: () => applyPD(1, false) },
              { cost: 2, label: "2 Focus (L11) · Dodge + 1 extra reaction", apply: () => applyPD(2, true) }
            ]);
          } else {
            applyPD(1, false);
          }
        },
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Patient Defense", [["Timing", "No action (on bonus Disengage)"], ["Cost", isL11 ? "1 or 2 Focus Points" : "1 Focus Point"]], classRule(profile, "Focus"))
      });
      actionEntry(freeTarget, "Step of the Wind", isL11
        ? "On bonus Dash (no action) · 1 Focus: double jump distance · 2 Focus: fly speed = walk speed until end of turn"
        : "On bonus Dash (no action) · 1 Focus Point · Double jump distance for the turn", {
        use: event => {
          if (isL11 && focusLeft >= 2) {
            openFocusUpgradeModal("Step of the Wind", event.currentTarget, [
              { cost: 1, label: "1 Focus · Double jump distance", apply: () => update("Step of the Wind (1 Focus · 2× jump)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }) },
              { cost: 2, label: "2 Focus (L11) · Fly speed until end of turn", apply: () => update("Step of the Wind (2 Focus · Fly speed)", next => { next.spent.focus = (next.spent.focus || 0) + 2; }) }
            ]);
          } else {
            update("Step of the Wind (1 Focus · 2× jump)", next => { next.spent.focus = (next.spent.focus || 0) + 1; });
          }
        },
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Step of the Wind", [["Timing", "No action (on bonus Dash)"], ["Cost", isL11 ? "1 or 2 Focus Points" : "1 Focus Point"]], classRule(profile, "Focus"))
      });
    }
    if (_mnkLvl >= 5) {
      actionEntry(freeTarget, "Stunning Strike", "On melee hit (no action) · 1 Focus Point · Constitution save (DC " + focusDC + ") or Stunned until end of next turn", {
        use: () => update("Stunning Strike (1 Focus · DC " + focusDC + ")", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Stunning Strike", [["Timing", "No action (on melee hit)"], ["Save DC", "Constitution DC " + focusDC]], classRule(profile, "Stunning Strike"))
      });
    }
    if (_mnkLvl >= 14) {
      actionEntry(freeTarget, "Diamond Soul", "On failed saving throw (no action) · 1 Focus Point · Reroll save (must use new roll)", {
        use: () => update("Diamond Soul (1 Focus · Reroll save)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        disabled: focusLeft < 1,
        details: () => showInfo("Diamond Soul", [["Timing", "No action (on failed save)"], ["Cost", "1 Focus Point"]], classRule(profile, "Diamond Soul"))
      });
    }
    if (_mnkLvl >= 20) {
      actionEntry(freeTarget, "Perfect Self", focusLeft < 6
        ? ("On initiative with fewer than 6 Focus (" + focusLeft + "/" + focusMax + ") · Regain to 6 Focus Points")
        : ("On initiative with fewer than 6 Focus (" + focusLeft + "/" + focusMax + " remaining)"), {
        use: () => update("Perfect Self · Regained Focus Points to 6", next => {
          next.spent.focus = Math.max(0, focusMax - 6);
        }),
        useLabel: "Regain to 6",
        disabled: focusLeft >= 6,
        details: () => showInfo("Perfect Self", [["Timing", "When rolling initiative with fewer than 6 Focus Points"]], classRule(profile, "Perfect Self"))
      });
    }
    if (_mnkLvl >= 3) {
      const _dmBonus = modifier(effectiveScores(profile, session).Dexterity) + _mnkLvl;
      actionEntry(reaction, "Deflect Missiles", "Reduce ranged weapon damage by 1d10 " + signed(_dmBonus) + " · At 0 damage (kinetic/energy/ion), spend 1 Focus to redirect (20/60)", {
        use: () => update("Deflect Missiles · Redirect (1 Focus)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        useLabel: "Redirect (1 Focus)",
        disabled: !canReact(session) || focusLeft < 1,
        details: () => showInfo("Deflect Missiles", [["Timing", "Reaction"], ["Reduction", "1d10 " + signed(_dmBonus)], ["Redirect", "1 Focus Point · 20/60 ft (monk weapon)"]], classRule(profile, "Deflect Missiles"))
      });
    }
    if (_mnkLvl >= 4) {
      actionEntry(reaction, "Slow Fall", "Reduce falling damage by " + (_mnkLvl * 5), {
        disabled: !canReact(session),
        details: () => showInfo("Slow Fall", [["Timing", "Reaction"], ["Reduction", (_mnkLvl * 5) + " falling damage"]], classRule(profile, "Slow Fall"))
      });
    }
  }

  // Scout, Engineer, Scholar
  if (traits.rangersQuarry) {
    const quarryOn = hasEffect("Ranger’s Quarry") || hasEffect("Ranger's Quarry");
    const rqLvl = traits.isScout && typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Scout", "Ranger's Quarry") : (profile.level || 1);
    const quarryDur = rqLvl >= 17 ? "24 hours" : rqLvl >= 9 ? "8 hours" : "1 hour";
    actionEntry(freeTarget, "Ranger’s Quarry", quarryOn ? "Active (" + quarryDur + ") · +1" + traits.rangersQuarry + " weapon damage (once per turn) & track advantage" : "No action (once per turn) · Mark target within 120 ft (" + quarryDur + ", +1" + traits.rangersQuarry + ")", {
      use: () => toggleNamedEffect("Ranger’s Quarry", "+1" + traits.rangersQuarry + " (once per turn)"),
      pressed: quarryOn,
      disabled: blocked,
      details: () => showInfo("Ranger’s Quarry", [["Die", "1" + traits.rangersQuarry], ["Range", "120 ft"], ["Duration", quarryDur]], classRule(profile, "Ranger's Quarry"))
    });
    if (traits.isScout && _sctLvl >= 5) {
      actionEntry(reaction, "Mark Ranger’s Quarry", quarryOn ? "Active · Switch mark when a creature enters line of sight" : "Reaction when a creature enters line of sight (120 ft)", {
        use: () => toggleNamedEffect("Ranger’s Quarry", "+1" + traits.rangersQuarry + " (once per turn)", { source: { kind: "classFeature", name: "Ranger's Quarry" } }),
        pressed: quarryOn,
        disabled: !canReact(session),
        details: () => showInfo("Ranger’s Quarry (Reaction)", [["Timing", "Reaction (Scout 5+)"], ["Range", "120 ft"], ["Duration", quarryDur]], classRule(profile, "Ranger's Quarry"))
      });
    }
  }
  // Adaptability Routine is driven via unified actionGrant (effect: "pickNonProfSave").
  if (traits.isScout && _sctLvl >= 10) {
    const hiddenOn = hasEffect("Hidden");
    actionEntry(bonus, "Commando · Hide / Dash", hiddenOn ? "Active · Hidden" : "Take Dash or Hide as a bonus action", {
      use: () => toggleNamedEffect("Hidden", "Commando"),
      pressed: hiddenOn,
      disabled: blocked,
      details: () => showInfo("Commando", [["Source", "Scout 10"]], classRule(profile, "Commando"))
    });
  }
  if (traits.isEngineer || step["Potent Aptitude"]) {
    const paRes = characterResources(profile, session).find(r => r.id === "potentAptitude");
    const paMax = paRes?.max || 2;
    const paLeft = paRes?.value || 0;
    const paLvl = traits.isEngineer && typeof multiclassScaledLevel === "function" ? multiclassScaledLevel(profile, session, "Engineer", "Potent Aptitude") : (profile.level || 1);
    const paStep = traits.isEngineer && paLvl > 0 ? (classRecord("Engineer")?.levelChanges?.[String(Math.min(20, paLvl))] || step) : step;
    const paDie = paStep["Potent Aptitude"] || step["Potent Aptitude"] || "d4";
    actionEntry(bonus, "Potent Aptitude", paLeft + "/" + paMax + " (short rest) · " + paDie + " to an ally within 60 ft", {
      use: () => update("Used Potent Aptitude", next => {
        next.spent.potentAptitude = Math.min(paMax, (next.spent.potentAptitude || 0) + 1);
      }),
      disabled: blocked || paLeft <= 0,
      details: () => showInfo("Potent Aptitude", [["Die", paDie], ["Uses", paLeft + "/" + paMax + " (short rest)"]], classRule(profile, "Potent Aptitude"))
    });
    if (traits.isEngineer && _engLvl >= 20) {
      actionEntry(freeTarget, "Tech Mastery", paLeft === 0
        ? "On initiative (0 Potent Aptitude left) · Regain 1 use"
        : "On initiative with 0 uses left · Regain 1 Potent Aptitude (" + paLeft + "/" + paMax + " remaining)", {
        useLabel: "Regain 1",
        use: () => update("Tech Mastery · Regained 1 Potent Aptitude", next => {
          next.spent.potentAptitude = Math.max(0, (next.spent.potentAptitude || 0) - 1);
        }),
        disabled: paLeft > 0,
        details: () => showInfo("Tech Mastery", [["Timing", "When rolling initiative with 0 Potent Aptitude uses left"]], classRule(profile, "Tech Mastery"))
      });
    }
  }
  if (traits.isScholar) {
    const caOn = hasEffect("Critical Analysis");
    const scScores = effectiveScores(profile, session);
    const caAbNow = typeof scholarCriticalAnalysisAbility === "function" ? scholarCriticalAnalysisAbility(profile, session) : "Intelligence";
    const caModNow = modifier(scScores[caAbNow]);
    const caAlliesNow = Math.max(1, caModNow);
    actionEntry(bonus, "Critical Analysis", caOn
      ? ("Active on target · " + signed(caModNow) + " " + caAbNow)
      : ("Analyze target within 60 ft · " + signed(caModNow) + " " + caAbNow + " (finesse/blaster vs hostile, or ally +1 roll)"), {
      use: () => toggleNamedEffect("Critical Analysis", "Target analyzed"),
      pressed: caOn,
      disabled: blocked,
      details: () => showInfo("Critical Analysis", [["Source", "Scholar"], ["Ability", caAbNow + " (" + signed(caModNow) + ")"]], classRule(profile, "Critical Analysis"))
    });
    if (_schLvl >= 2) {
      const saRes = characterResources(profile, session).find(r => r.id === "sageAdvice");
      const hasCleverApps = typeof resolveDefenseEffects === "function" && (resolveDefenseEffects(profile, session).combatTraits || []).some(ct => ct.kind === "sageAdviceImprovised");
      actionEntry(freeTarget, "Sage Advice", (saRes?.value || 0) + "/" + (saRes?.max || 1) + " (" + (saRes?.resetOn === "short" ? "short rest" : "long rest") + ") · Up to " + caAlliesNow + " " + (caAlliesNow === 1 ? "ally" : "allies") + " add proficiency bonus to 1 skill or tool check (1 hour)", {
        use: event => {
          const tr = effectiveTraining(profile, session);
          const profSkills = Object.keys(skills).filter(sk => (tr[sk] || 0) >= 1).sort();
          const toolSet = new Set();
          for (const t of (profile.toolProficiencies || [])) if (t) toolSet.add(String(t).trim());
          for (const choices of Object.values(session?.classOptionChoices || {})) {
            for (const picked of (Array.isArray(choices) ? choices : [])) {
              if (picked && !skills[picked] && /kit|set|tools?|implements?/i.test(picked)) toolSet.add(String(picked).trim());
            }
          }
          const profTools = [...toolSet].sort();
          const options = [...profSkills, ...profTools, ...(hasCleverApps ? ["Improvised Weapons"] : [])];
          const {dialog, form, body, note, confirm} = createModalFrame("Sage Advice", event.currentTarget);
          confirm.textContent = "Use Sage Advice";
          note("Spend 1 minute advising up to " + caAlliesNow + " friendly " + (caAlliesNow === 1 ? "creature" : "creatures") + " (" + caAbNow + " modifier) within 30 ft on a proficient skill or tool (1 hour).");
          let chosenOption = options[0] || "Lore";
          const pills = appendText(form, "div", "");
          pills.className = "row wrap";
          for (const opt of (options.length ? options : Object.keys(skills).sort())) {
            const p = appendText(pills, "button", opt);
            p.type = "button";
            p.className = "swPropChip";
            p.setAttribute("aria-pressed", String(opt === chosenOption));
            p.addEventListener("click", () => {
              chosenOption = opt;
              for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === opt));
            });
          }
          form.insertBefore(pills, form.querySelector("footer"));
          form.addEventListener("submit", e => {
            e.preventDefault();
            dialog.close();
            update("Sage Advice · " + chosenOption, next => { next.spent.sageAdvice = (next.spent.sageAdvice || 0) + 1; });
          });
          dialog.showModal();
        },
        disabled: blocked || !(saRes?.value > 0),
        details: () => showInfo("Sage Advice", [["Source", "Scholar"], ["Max Allies", String(caAlliesNow) + " (" + caAbNow + ")"], ["Recharge", saRes?.resetOn === "short" ? "Short or long rest" : "Long rest"]], classRule(profile, "Sage Advice"))
      });
    }
  }

  // L1-20 Base Class Live Actions (Class Improvements are driven via unified actionGrant)
  if (traits.isMonk && _mnkLvl >= 7) {
    const hasCF = (session.effects || []).some(e => e.name === "Charmed" || e.name === "Frightened");
    actionEntry(action, "Stillness of Mind", hasCF ? "End Charmed or Frightened on yourself" : "Action or bonus action: end Charmed or Frightened", {
      use: () => update("Stillness of Mind · Cleared Charmed/Frightened", next => {
        next.effects = next.effects.filter(e => e.name !== "Charmed" && e.name !== "Frightened");
      }),
      disabled: blocked,
      details: () => showInfo("Stillness of Mind", [["Source", "Monk 7"]], classRule(profile, "Stillness of Mind") || "Use your action or bonus action to end one effect on yourself that is causing you to be Charmed or Frightened.")
    });
  }
  // Vow of Fortitude is driven via unified actionGrant (effect: "clearConditions").
  if (traits.isMonk && _mnkLvl >= 18) {
    const focusRes = characterResources(profile, session).find(r => r.id === "focus");
    const ebOn = (session.effects || []).some(e => normalizeName(e.name) === "empty body");
    actionEntry(action, "Empty Body", ebOn ? "Active · Invisible + resist all except force (1 min)" : "4 Focus Points · Invisible + resist all damage except force (1 minute)", {
      use: () => update(ebOn ? "Ended Empty Body" : "Activated Empty Body (4 Focus Points)", next => {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== "empty body");
        if (!ebOn) {
          next.spent.focus = (next.spent.focus || 0) + 4;
          next.effects.push(conditionEntry("Empty Body", 1, false, {id: newID(), note: "1 minute · Invisible + resist all except force", persistent: false, durationSpec: { anchor: "timed", value: 1, unit: "minute" }, source: { kind: "classFeature", name: "Empty Body" }}));
        }
      }),
      pressed: ebOn,
      disabled: blocked || (!ebOn && (!focusRes || focusRes.value < 4)),
      details: () => showInfo("Empty Body", [["Source", "Monk 18"]], classRule(profile, "Empty Body") || "Spend 4 Focus Points as an action to become Invisible for 1 minute and gain resistance to all damage except force damage.")
    });
  }
  // Class Improvements are driven via unified actionGrant.

  // Combat consumables carried in inventory
  const _consCombatEff = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
  const _hasExplosivesStyle = (session.fightingStyles || []).some(s => normalizeName(s) === "explosives style");
  const _hasPoisonerStyle = (session.fightingStyles || []).some(s => normalizeName(s) === "poisoner style");
  const _hasExplosiveMax1 = Boolean(_consCombatEff?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "explosive" && Array.isArray(cm.maxDamageOnSaveRoll)));
  const _hasPoisonMax1 = Boolean(_consCombatEff?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "poison" && Array.isArray(cm.maxDamageOnSaveRoll)));
  const _hasCanisterMax1 = Boolean(_consCombatEff?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "canister" && Array.isArray(cm.maxDamageOnSaveRoll)));
  const _hasCanisterMastery = Boolean(_consCombatEff?.attackDamageMods?.some(am => String(am.scope || "").toLowerCase() === "canister" && am.tradeoff));
  const _hasExplosivesMastery = Boolean(_consCombatEff?.attackDamageMods?.some(am => String(am.scope || "").toLowerCase() === "explosive" && am.tradeoff));
  const _hasPoisonerMastery = Boolean(_consCombatEff?.attackDamageMods?.some(am => String(am.scope || "").toLowerCase() === "poison" && am.tradeoff));
  const _canisterDcInt = 8 + (profile.proficiency || 2) + modifier(effectiveScores(profile, session).Intelligence);
  const combatConsumables = session.equipped.filter(item => consumableSpec(itemRule(item.name, item))?.combat === "action");
  for (const item of combatConsumables) {
    const cRule = itemRule(item.name, item);
    const spec = consumableSpec(cRule);
    const isExplosive = cRule?.category === "Explosive";
    const isPoison = Boolean(/^poison\b/i.test(item.name || "") || (spec?.weaponTarget && /poison/i.test(spec.note || "")));
    const isCanister = /canister/i.test(item.name || "");
    const usesInfo = typeof consumableUsesRemaining === "function" ? consumableUsesRemaining(item, spec) : null;
    const targetZone = ((isExplosive && _hasExplosivesStyle) || (isPoison && _hasPoisonerStyle)) ? bonus : action;
    const subParts = [
      usesInfo ? (usesInfo.current + "/" + usesInfo.max + " " + usesInfo.label) : "",
      "×" + item.quantity + " carried",
      (isExplosive && _hasExplosivesStyle) ? "Bonus action (Explosives Style)" : "",
      (isPoison && _hasPoisonerStyle) ? "Bonus action (Poisoner Style)" : "",
      (isExplosive && _hasExplosiveMax1) ? "Natural 1 save = max damage" : "",
      (isPoison && _hasPoisonMax1) ? "Natural 1 save = max damage" : "",
      (isCanister && _hasCanisterMax1) ? "Natural 1 save = max damage" : "",
      (isCanister && _hasCanisterMastery) ? ("DC " + Math.max(14, _canisterDcInt) + " (Area Mastery)") : "",
      (isCanister && _hasCanisterMastery) ? "Cover −1 step" : "",
      (isCanister && _hasCanisterMastery) ? ("−" + (profile.proficiency || 2) + " DC for +" + (profile.proficiency || 2) + " dmg") : "",
      (isExplosive && _hasExplosivesMastery) ? ("DC " + _canisterDcInt + " if higher (Explosives Mastery)") : "",
      (isExplosive && _hasExplosivesMastery) ? ("−" + (profile.proficiency || 2) + " DC for +" + (profile.proficiency || 2) + " dmg") : "",
      (isPoison && _hasPoisonerMastery) ? ("DC " + Math.max(14, _canisterDcInt) + " (Poisoner Mastery)") : "",
      (isPoison && _hasPoisonerMastery) ? "+1 hit/ammo" : "",
      (isPoison && _hasPoisonerMastery) ? ("−" + (profile.proficiency || 2) + " DC for +" + (2 * (profile.proficiency || 2)) + " dmg") : ""
    ].filter(Boolean).join(" · ");
    actionEntry(targetZone, spec.verb + " " + item.name, subParts, {
      use: event => openConsumableDialog(item.id, event.currentTarget),
      disabled: blocked,
      details: () => showItem(item.name, item)
    });
  }

  // Maneuvers routed strictly from verbatim-verified catalog metadata (3-bucket upgrade resolution)
  const activeManeuvers = Array.isArray(session.maneuvers) ? session.maneuvers : (profile.maneuvers || []);
  if (activeManeuvers.length) {
    const sup = superiorityStats(profile, session);
    const _actUpg = typeof resolveResourceEffects === "function" ? (resolveResourceEffects(profile, session).actionUpgrades || []) : [];
    const _versatilePicks = typeof generalManeuverOverrides === "function" ? generalManeuverOverrides(profile, session) : [];
    const _fullAb = { STR: "Strength", DEX: "Dexterity", CON: "Constitution", INT: "Intelligence", WIS: "Wisdom", CHA: "Charisma" };
    for (const resolved of resolveActiveManeuvers(activeManeuvers, sup, _actUpg, _versatilePicks)) {
      const saveFull = _fullAb[resolved.save] || resolved.save || "";
      const evalSummary = typeof interpolateRuleTokens === "function"
        ? interpolateRuleTokens(resolved.summary, profile, session)
        : resolved.summary;
      for (const slot of resolved.slots) {
        const targetCol = slot === "reaction" ? reaction
          : slot === "bonus" ? bonus
          : (slot === "action" || slot === "replace-attack") ? action
          : freeTarget;
        const timingPrefix = slot === "replace-attack" ? "Replace 1 attack"
          : slot === "out-of-combat" ? "1 minute"
          : (resolved.slots.length > 1 && slot === "reaction") ? "Reaction (on your turn)"
          : "";
        const saveText = saveFull ? ("DC " + resolved.saveDC + " " + saveFull + " save") : "";
        const baseNameForFree = resolved.rule?.name || resolved.displayName;
        const hasKnowledgeUnbound = Boolean(_schLvl >= 20);
        const masteryFreeLeft = Math.max(0, (sup.freeD4Max || 0) - (session.spent?.superiorityMasteryD4 || 0));
        const masteryPicks = Array.isArray(session.combatOptionChoices?.["Superiority Mastery"]) ? session.combatOptionChoices["Superiority Mastery"] : [];
        const hasMasteryFreeD4 = Boolean(masteryFreeLeft > 0 && masteryPicks.some(p => normalizeName(p) === normalizeName(baseNameForFree)));
        const splashFighterLeft = Math.max(0, (sup.splashFighterD4Max || 0) - (session.spent?.splash_fighter_superiority || 0));
        const hasSplashFighterD4 = Boolean(splashFighterLeft > 0);
        const hasAnyFreeD4 = hasKnowledgeUnbound || hasMasteryFreeD4 || hasSplashFighterD4;
        const freeD4Source = hasKnowledgeUnbound ? "knowledgeUnbound" : (hasMasteryFreeD4 ? "superiorityMastery" : (hasSplashFighterD4 ? "splashFighter" : ""));
        const freeD4Fallback = Boolean(hasAnyFreeD4 && sup.remaining <= 0);
        const freeD4Label = freeD4Source === "superiorityMastery"
          ? ("Superiority Mastery (" + masteryFreeLeft + "/" + sup.freeD4Max + " free d4)")
          : (freeD4Source === "splashFighter"
            ? ("Splashclass (" + splashFighterLeft + "/" + sup.splashFighterD4Max + " d4)")
            : "Knowledge Unbound (free d4)");
        const dieText = freeD4Fallback
          ? freeD4Label
          : (sup.qty > 0
            ? (sup.remaining + "/" + sup.qty + " " + sup.size + (hasAnyFreeD4 ? (freeD4Source === "splashFighter" ? " or Splashclass d4" : " or free d4") : ""))
            : (sup.splashFighterD4Max > 0 ? ("Splashclass (0/" + sup.splashFighterD4Max + " d4)") : "Maneuver"));
        const manMeta = findActionGrantMeta(resolved.rule, slot === "reaction" ? "reaction" : slot);
        const manCadence = formatCadenceLabel(manMeta.cadence, manMeta.rechargeMin);
        const manReactKind = slot === "reaction" ? (manMeta.reactionKind || "standard") : manMeta.reactionKind;
        const manTitle = appendReactionKindToTitle(resolved.displayName, manReactKind, false);
        const rawSubText = [timingPrefix, resolved.upgradeTag, saveText, evalSummary, dieText].filter(Boolean).join(" · ");
        const subText = appendCadenceIfMissing(rawSubText, manCadence);
        const infoMeta = [
          ["Type", resolved.effectiveType],
          ["Timing", resolved.slots.map(s => s === "replace-attack" ? "Replace 1 attack" : s === "out-of-combat" ? "1 minute (out of combat)" : s === "action" ? "Action" : s === "bonus" ? "Bonus action" : s === "reaction" ? (formatReactionKindTiming(manReactKind) || "Reaction") : s === "special" || s === "free" ? "No action / special" : s).join(" / ")],
          ...(manCadence ? [["Cadence", manCadence]] : []),
          ...(saveFull ? [["Save DC", "DC " + resolved.saveDC + " " + saveFull]] : []),
          ...(resolved.rule?.prerequisite ? [["Prerequisite", resolved.rule.prerequisite]] : [])
        ];
        actionEntry(targetCol, manTitle, subText, {
          use: (sup.qty > 0 || sup.splashFighterD4Max > 0 || hasAnyFreeD4) ? event => {
            const baseName = resolved.rule?.name || resolved.displayName;
            const spec = SELF_STATE_MANEUVERS[normalizeName(baseName)];
            const needsRoll = (spec && (
              spec.kind === "rolledEffect"
              || spec.kind === "rolledEffectPlusMod"
              || spec.kind === "rolledHeal"
              || spec.kind === "rolledTempHP"
              || spec.kind === "rolledAnnounce"
            )) || (normalizeName(baseName) === "call to arms" && normalizeName(resolved.displayName).includes("improved"));
            if (needsRoll) {
              openManeuverRollDialog(resolved.displayName, baseName, event.currentTarget, freeD4Fallback, resolved.summary, freeD4Source);
            } else {
              const freeArg = freeD4Fallback ? freeD4Source : false;
              const prefix = freeArg === "superiorityMastery" ? "Used maneuver (Superiority Mastery d4) · "
                : freeArg === "splashFighter" ? "Used maneuver (Splashclass d4) · "
                : freeArg ? "Used maneuver (Knowledge Unbound d4) · " : "Used maneuver · ";
              update(prefix + resolved.displayName, (next, prof) => {
                applyManeuverState(next, prof, baseName, 1, true, freeArg);
              });
            }
          } : null,
          useLabel: freeD4Fallback ? (freeD4Source === "splashFighter" ? "Use d4" : "Free d4") : undefined,
          disabled: blocked || (targetCol === reaction && !canReact(session)) || (!hasAnyFreeD4 && (sup.qty > 0 ? sup.remaining <= 0 : sup.splashFighterD4Max > 0)),
          details: resolved.rule ? () => showInfo(resolved.displayName, infoMeta, resolved.fullDescription) : null
        });
      }
    }
  }

  const _aLvl = profile.level || 1;
  const _aScores = effectiveScores(profile, session);
  const _aWalk = speedBreakdown(profile, session, c).live || 30;
  const _aCast = castingStats(profile, session);
  const _aSup = typeof superiorityStats === "function" ? superiorityStats(profile, session) : null;
  const _profVal = profile.proficiency || 2;
  const _rawMods = {
    wisChaMod: Math.max(modifier(_aScores.Wisdom), modifier(_aScores.Charisma), _aCast?.hasForce && _aCast.forceAbility ? modifier(_aScores[_aCast.forceAbility]) : -Infinity),
    intMod: modifier(_aScores.Intelligence),
    wisMod: modifier(_aScores.Wisdom),
    chaMod: modifier(_aScores.Charisma),
    strMod: modifier(_aScores.Strength),
    dexMod: modifier(_aScores.Dexterity),
    conMod: modifier(_aScores.Constitution)
  };
  const _caAb = typeof scholarCriticalAnalysisAbility === "function" ? scholarCriticalAnalysisAbility(profile, session) : "Intelligence";
  const _caMod = Math.max(1, modifier(_aScores[_caAb]));
  const _focusMod = Math.max(_rawMods.wisMod, _rawMods.chaMod);
  const _maDie = traits.martialArtsDie ? ("1d" + traits.martialArtsDie) : "1d4";
  const _maneuverDC = _aSup ? (_aSup.generalDC || (8 + _profVal + _rawMods.intMod)) : (8 + _profVal + Math.max(_rawMods.strMod, _rawMods.dexMod, _rawMods.intMod));
  const interp = str => (typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(str, profile, session) : String(str || ""));

  // Lightsaber Forms (all 20 SW5e forms are adopted as a Bonus Action; active forms surface special reactions)
  const activeForms = Array.isArray(session.lightsaberForms) ? session.lightsaberForms : [];
  for (const fName of activeForms) {
    const rule = lightsaberFormRule(fName);
    const canonName = rule?.name || fName;
    const mech = rule?.mechanics || {};
    const isInstantForm = rule?.durationSpec?.anchor === "instant";
    const active = !isInstantForm && hasEffect(canonName);
    const evalSummary = interp(mech.summary || "");
    const summaryText = active
      ? ("Active · " + (evalSummary || "Lightsaber form"))
      : (evalSummary ? "Adopt · " + evalSummary : "Bonus action · Adopt form");
    actionEntry(bonus, canonName, summaryText, {
      use: isInstantForm
        ? () => update("Adopted " + canonName + (evalSummary ? " · " + evalSummary : ""), () => {})
        : () => update(active ? "Ended " + canonName : "Adopted " + canonName, next => {
            const targetKey = normalizeName(canonName);
            if (active) {
              next.effects = next.effects.filter(e => normalizeName(lightsaberFormRule(e.name)?.name || e.name) !== targetKey);
            } else {
              next.effects.push(conditionEntry(canonName, 1, false, {
                id: newID(),
                note: evalSummary || "Lightsaber form",
                persistent: false,
                source: { kind: "lightsaberForm", name: canonName },
                ...(rule?.durationSpec ? { durationSpec: rule.durationSpec } : {}),
                ...(Array.isArray(rule?.turnTriggers) && rule.turnTriggers.length ? { turnTriggers: rule.turnTriggers } : {})
              }));
            }
          }),
      ...(isInstantForm ? {} : { pressed: active }),
      disabled: blocked,
      details: () => {
        const lfMeta = findActionGrantMeta(rule, "bonus");
        const lfCadence = formatCadenceLabel(lfMeta.cadence, lfMeta.rechargeMin);
        showInfo(canonName, [
          ["Timing", "Bonus action (adopt form)"],
          ...(lfCadence ? [["Cadence", lfCadence]] : []),
          ...(mech.duration ? [["Duration", mech.duration]] : []),
          ...(rule?.prerequisite ? [["Prerequisite", rule.prerequisite]] : [])
        ], rule?.description || "");
      }
    });
    if (active && mech.activeReaction) {
      const lfReactMeta = findActionGrantMeta(rule, "reaction");
      const lfReactKind = lfReactMeta.reactionKind || (mech.specialReaction ? "special" : "standard");
      const lfReactCadence = formatCadenceLabel(lfReactMeta.cadence, lfReactMeta.rechargeMin);
      const lfReactTitle = appendReactionKindToTitle(rule?.name || fName, lfReactKind, true);
      const lfReactTiming = (formatReactionKindTiming(lfReactKind) || "Reaction") + " (while form active)";
      actionEntry(reaction, lfReactTitle, appendCadenceIfMissing(interp(mech.activeReaction), lfReactCadence), {
        disabled: !canReact(session),
        details: () => showInfo(rule?.name || fName, [
          ["Timing", lfReactTiming],
          ...(lfReactCadence ? [["Cadence", lfReactCadence]] : []),
          ...(mech.duration ? [["Duration", mech.duration]] : [])
        ], rule?.description || "")
      });
    }
  }

  // Fighting Styles & Fighting Masteries (with live active-effect toggles where applicable)
  const styleEffectToggles = {
    "blindfighting style": ["Blindfighting: Doubled", "Blindsight range doubled"],
    "equilibrium style": ["Equilibrium Mark", interp("+{halfDexMod} AC & Dexterity saves vs marked target")],
    "defense style": ["Defense Mark", interp("Reduce damage from marked target by {halfStrConMod} (min 1 reduction, floor 1 damage)")],
    "secured style": ["Secured: Light Shield", "+1 AC (fixed weapon as light shield; cannot attack with it)"],
    "dual wield mastery": ["Dual Wield AC", "+1 AC (forgo bonus Two-Weapon Fighting attack)"],
    "sentinel mastery": ["Defensive Stance", interp("{prof} special opportunity attack reactions")],
    "duelist mastery": ["Duelist Mastery (+prof AC)", interp("+{prof} AC vs 1 melee attack")],
    "secured mastery": ["Secured Mastery (+prof AC)", interp("+{prof} AC vs 1 attack (forgo fixed attack)")],
    "covert style": ["Hidden", "Hide as a bonus action (Covert Style)"]
  };
  const _renderCombatOptionRow = (rule, fallbackName, typeLabel) => {
    const kind = verifiedOptionTiming(rule);
    if (!kind || kind === "passive") return;
    const optName = rule?.name || fallbackName;
    const targetCol = kind === "reaction" ? reaction : kind === "bonus" ? bonus : kind === "action" ? action : freeTarget;
    const optNorm = normalizeName(optName);
    const toggle = styleEffectToggles[optNorm];
    const pressed = toggle ? hasEffect(toggle[0]) : undefined;
    const toggleEligible = (optNorm === "defense style" || optNorm === "defense mastery")
      ? Boolean(armor.armor && (armor.armor.armor === "Medium" || armor.armor.armor === "Heavy") && !armor.nonproficient)
      : optNorm === "equilibrium style"
        ? Boolean(!armor.shield && (!armor.armor || armor.armor.armor === "Light"))
        : optNorm === "secured style"
          ? Boolean(!armor.shield && hasEquippedFixedWeapon(session))
          : optNorm === "secured mastery"
            ? Boolean(hasEquippedFixedWeapon(session))
            : optNorm === "dual wield mastery"
              ? hasDualWieldMasteryEligible(profile, session)
              : (optNorm === "duelist style" || optNorm === "duelist mastery")
                ? hasDuelistMasteryEligible(profile, session)
                : optNorm === "versatile style"
                  ? hasVersatileStyleEligible(profile, session)
                  : optNorm === "shield style"
                    ? Boolean(armor.shield)
                    : optNorm === "shield mastery"
                      ? Boolean(armor.shield && !armor.nonproficient)
                      : true;
    const chosenCast = session.combatOptionChoices?.[optName]?.[0] || "";
    const choiceTag = chosenCast ? (chosenCast + " · ") : "";
    const optMeta = findActionGrantMeta(rule, kind);
    const optCadence = formatCadenceLabel(optMeta.cadence, optMeta.rechargeMin);
    const optReactKind = kind === "reaction" ? (optMeta.reactionKind || "standard") : "";
    const optTitle = appendReactionKindToTitle(optName, optReactKind, false);
    const evalSum = appendCadenceIfMissing(interp(rule?.mechanics?.summary || typeLabel), optCadence);
    const optEffectExtra = {
      source: { kind: typeLabel === "Fighting Mastery" ? "fightingMastery" : "fightingStyle", name: optName },
      ...(rule?.durationSpec ? { durationSpec: rule.durationSpec } : {}),
      ...(Array.isArray(rule?.turnTriggers) && rule.turnTriggers.length ? { turnTriggers: rule.turnTriggers } : {})
    };
    const optTimingLabel = kind === "action" ? "Action"
      : kind === "bonus" ? "Bonus action"
      : kind === "reaction" ? (formatReactionKindTiming(optReactKind) || "Reaction")
      : "No action / special";
    actionEntry(targetCol, optTitle, (pressed ? "Active · " : "") + choiceTag + evalSum, {
      use: toggle ? () => toggleNamedEffect(toggle[0], toggle[1], optEffectExtra) : null,
      pressed,
      disabled: toggle
        ? (kind === "reaction" ? ((!pressed && (!canReact(session) || !toggleEligible))) : (blocked || (!pressed && !toggleEligible)))
        : (kind === "reaction" ? (!canReact(session) || !toggleEligible) : (kind === "bonus" || kind === "action") ? (blocked || !toggleEligible) : false),
      details: () => showInfo(optName, [
        ["Type", typeLabel],
        ["Timing", optTimingLabel],
        ...(optCadence ? [["Cadence", optCadence]] : [])
      ], rule?.description || "")
    });
    const sec = rule?.mechanics?.secondaryAction;
    if (sec && sec.summary) {
      const secCol = sec.zone === "reaction" ? reaction : sec.zone === "bonus" ? bonus : sec.zone === "action" ? action : freeTarget;
      const secMeta = findActionGrantMeta(rule, sec.zone || "");
      const secCadence = formatCadenceLabel(sec.cadence || secMeta.cadence, sec.rechargeMin !== undefined ? sec.rechargeMin : secMeta.rechargeMin);
      const secReactKind = sec.zone === "reaction" ? (sec.reactionKind || secMeta.reactionKind || "standard") : "";
      const secTitle = appendReactionKindToTitle(sec.name || optName, secReactKind, false);
      const secTimingLabel = sec.zone === "reaction" ? (formatReactionKindTiming(secReactKind) || "Reaction") : (sec.zone === "bonus" ? "Bonus action" : "Special");
      actionEntry(secCol, secTitle, appendCadenceIfMissing(interp(sec.summary), secCadence), {
        disabled: secCol === reaction ? !canReact(session) : false,
        details: () => showInfo(sec.name || optName, [
          ["Type", typeLabel],
          ["Timing", secTimingLabel],
          ...(secCadence ? [["Cadence", secCadence]] : [])
        ], rule?.description || "")
      });
    }
  };
  const activeStyles = Array.isArray(session.fightingStyles) ? session.fightingStyles : [];
  for (const sName of activeStyles) _renderCombatOptionRow(fightingStyleRule(sName), sName, "Fighting Style");
  const activeMasteries = Array.isArray(session.fightingMasteries) ? session.fightingMasteries : [];
  for (const mName of activeMasteries) _renderCombatOptionRow(fightingMasteryRule(mName), mName, "Fighting Mastery");

  // Active Species Combat Traits (1/SR special attacks, Defensive Ball, Fury of the Small, Primitive Nerves, Echani Art)
  const spRec = speciesRecord(profile.species);
  const scoresNow = effectiveScores(profile, session);
  if (spRec?.specialAttack) {
    const sa = spRec.specialAttack;
    const left = Math.max(0, 1 - (session.spent.speciesSpecial || 0));
    const conMod = modifier(scoresNow.Constitution);
    const saveDC = 8 + profile.proficiency + conMod;
    const sub = sa.tempHPCon
      ? (left + "/1 (short rest) · On hit gain " + Math.max(1, conMod) + " temporary HP")
      : (left + "/1 (short rest) · DC " + saveDC + " Constitution save or " + sa.saveConCondition);
    actionEntry(bonus, sa.name, sub, {
      use: () => update("Used " + sa.name, next => {
        next.spent.speciesSpecial = 1;
        if (sa.tempHPCon) {
          const amt = Math.max(1, conMod);
          if (amt > (next.temp || 0)) { next.temp = amt; next.tempSource = sa.name; }
        }
      }),
      disabled: blocked || left <= 0,
      details: () => showInfo(sa.name, [["Source", profile.species || "Species"]], (spRec?.traits || []).find(t => normalizeName(t.name) === normalizeName(sa.name))?.description || sub)
    });
  }
  if (spRec?.defensiveBall) {
    const ballOn = hasEffect("Defensive Ball");
    const ballBonus = Math.max(1, Math.floor(profile.proficiency / 2));
    actionEntry(freeTarget, "Defensive Ball", ballOn ? "Active · +" + ballBonus + " AC" : "On Dash (no shield) · +" + ballBonus + " AC until next turn", {
      use: () => toggleNamedEffect("Defensive Ball", "+" + ballBonus + " AC"),
      pressed: ballOn,
      disabled: blocked || Boolean(armor.shield),
      details: () => showInfo("Defensive Ball", [["Source", profile.species || "Species"]], (spRec?.traits || []).find(t => /defensive ball/i.test(t.name))?.description || "When you take the Dash action and are not wielding a shield, you gain a bonus to AC until the start of your next turn.")
    });
  }
  if (spRec?.furyOfTheSmall) {
    const left = Math.max(0, 1 - (session.spent.furyOfTheSmall || 0));
    actionEntry(freeTarget, "Fury of the Small", left + "/1 (short rest) · +" + profile.level + " damage vs larger creature", {
      use: () => update("Used Fury of the Small (+" + profile.level + " damage)", next => { next.spent.furyOfTheSmall = 1; }),
      disabled: blocked || left <= 0,
      details: () => showInfo("Fury of the Small", [["Source", profile.species || "Species"]], (spRec?.traits || []).find(t => /fury of the small/i.test(t.name))?.description || "Once per short or long rest, when you damage a creature larger than you, deal extra damage equal to your level.")
    });
  }
  if (spRec?.primitiveNerves) {
    const left = Math.max(0, 1 - (session.spent.primitiveNerves || 0));
    const conMod = modifier(scoresNow.Constitution);
    actionEntry(reaction, "Primitive Nerves", left + "/1 (short rest) · Reduce damage by 1d12 " + signed(conMod), {
      use: () => update("Used Primitive Nerves", next => { next.spent.primitiveNerves = 1; }),
      disabled: !canReact(session) || left <= 0,
      details: () => showInfo("Primitive Nerves", [["Source", profile.species || "Species"]], (spRec?.traits || []).find(t => /primitive nerves/i.test(t.name))?.description || "Once per short or long rest, use your reaction to reduce incoming damage by 1d12 + your Constitution modifier.")
    });
  }
  if (spRec?.echaniArt) {
    const eaMax = Math.max(1, modifier(scoresNow.Wisdom));
    const left = Math.max(0, eaMax - (session.spent.echaniArt || 0));
    actionEntry(reaction, "Echani Art", left + "/" + eaMax + " (long rest) · Insight vs Deception to learn melee attacker stat", {
      use: () => update("Used Echani Art", next => { next.spent.echaniArt = Math.min(eaMax, (next.spent.echaniArt || 0) + 1); }),
      disabled: !canReact(session) || left <= 0,
      details: () => showInfo("Echani Art", [["Source", profile.species || "Species"]], (spRec?.traits || []).find(t => /echani art/i.test(t.name))?.description || "Use your reaction to contest Insight against a melee attacker's Deception to learn one combat statistic.")
    });
  }
  const archRec = archetypeRecord(session.approach, profile.className);
  const archMech = archRec?.mechanics || null;
  if (archMech?.actions?.length) {
    const aLvl = _aLvl;
    const _archChoiceSpecs = typeof archetypeFeatureChoiceSpecs === "function" ? archetypeFeatureChoiceSpecs(typeof archetypeRecord === "function" ? archetypeRecord(session.approach || profile.approach, profile.className) : null, aLvl) : [];
    const _archSpecByNorm = new Map(_archChoiceSpecs.map(s => [normalizeName(s.featureName), s]));
    const _gpFreeNormNames = new Set(
      typeof resolveGrantedPowers === "function"
        ? resolveGrantedPowers(profile, session).all.filter(g => g.freeCasts > 0).map(g => normalizeName(g.name))
        : []
    );
    for (const act of archMech.actions) {
      if (act.minLevel && aLvl < act.minLevel) continue;
      const _actNorm = normalizeName(act.name + " " + (act.summary || ""));
      if ([..._gpFreeNormNames].some(pn => pn && _actNorm.includes(pn))) continue;
      const _actSpec = _archSpecByNorm.get(normalizeName(act.name));
      if (_actSpec) {
        const _picked = session.archetypeFeatureChoices?.[_actSpec.featureName] || [];
        if (!_picked.length) continue;
        // If the parent summary merely lists multiple "A, B, or C" choice options, suppress the umbrella row once a specific choice is active
        if (/\bor\b/i.test(act.summary || "") && _picked.some(p => (act.summary || "").toLowerCase().includes(String(p).toLowerCase()))) continue;
      }
      const col = act.timing === "action" ? action : act.timing === "bonus" ? bonus : act.timing === "reaction" ? reaction : freeTarget;
      const key = "archAct:" + normalizeName(act.name);
      const usesMax = archetypeActionMaxUses(act, profile, session);
      const left = usesMax ? Math.max(0, usesMax - (session.spent[key] || 0)) : null;
      const usesPrefix = usesMax ? (left + "/" + usesMax + " (" + (act.resetOn === "short" ? "short rest" : "long rest") + ") · ") : "";
      let summaryText = act.summary || "";
      if (act.scales) {
        for (const [k, v] of Object.entries(act.scales)) {
          if (aLvl >= Number(k)) summaryText = v;
        }
      }
      summaryText = interp(summaryText);
      const chosenSub = session?.archetypeFeatureChoices?.[act.name];
      if (Array.isArray(chosenSub) && chosenSub.length) {
        const subMap = {
          "colossus slayer": "Colossus Slayer · +1d8 damage once/turn vs wounded target",
          "giant killer": "Giant Killer · Reaction attack when Large+ creature within 5 ft attacks you",
          "horde breaker": "Horde Breaker · Once/turn extra weapon attack vs different foe within 5 ft"
        };
        summaryText = chosenSub.map(c => subMap[normalizeName(c)] || c).join(" · ");
      }
      const fullRule = stripRedundantArchetypeHeader(approachRule(profile, session, act.ruleHeading || act.name) || archRec.rules || summaryText, archRec.name);
      const timingLbl = act.timing === "action" ? "Action" : act.timing === "bonus" ? "Bonus action" : act.timing === "reaction" ? "Reaction" : "No action / special";
      let useFn = null;
      let isPressed;
      let isDisabled = act.timing === "reaction" ? !canReact(session) : (act.timing === "free" ? false : blocked);
      if (act.dialog === "spendHitDie") {
        const hdLeft = session.hitDice || 0;
        useFn = event => openSpendHitDieDialog(act.name + " (" + archRec.name + ")", timingLbl, event.currentTarget);
        isDisabled = isDisabled || hdLeft <= 0;
      } else if (act.dialog) {
        const formula = interp(act.dialogFormula || "");
        useFn = event => openArchetypeRollDialog(act.name, timingLbl, act.dialog, formula, usesMax > 0 ? key : "", event.currentTarget);
        isDisabled = isDisabled || (usesMax > 0 && left <= 0);
      } else if (act.effect) {
        const effOn = hasEffect(act.effect);
        useFn = () => {
          if (effOn) {
            toggleNamedEffect(act.effect, archRec.name);
          } else {
            update("Activated " + act.name, next => {
              if (usesMax > 0) next.spent[key] = (next.spent[key] || 0) + 1;
              if (!next.effects.some(e => normalizeName(e.name) === normalizeName(act.effect))) {
                next.effects.push(conditionEntry(act.effect, 1, false, {id: newID(), note: archRec.name, persistent: false}));
              }
            });
          }
        };
        isPressed = effOn;
        isDisabled = !effOn && (isDisabled || (usesMax > 0 && left <= 0));
      } else if (usesMax > 0) {
        useFn = () => update("Used " + act.name, next => { next.spent[key] = (next.spent[key] || 0) + 1; });
        isDisabled = isDisabled || left <= 0;
      }
      actionEntry(col, act.name, usesPrefix + summaryText, {
        use: useFn,
        pressed: isPressed,
        disabled: isDisabled,
        details: () => showInfo(act.name, [["Archetype", archRec.name], ["Timing", timingLbl]], fullRule)
      });
    }
  }
  for (const ct of (spRec?.combatTraits || [])) {
    if (ct.minLevel && (profile.level || 1) < ct.minLevel) continue;
    const col = ct.timing === "action" ? action : ct.timing === "bonus" ? bonus : ct.timing === "reaction" ? reaction : freeTarget;
    const key = "spTrait:" + normalizeName(ct.name);
    const fullDesc = (spRec.traits || []).find(t => normalizeName(t.name) === normalizeName(ct.name))?.description || ct.summary;
    const usesMax = ct.uses || 0;
    const left = usesMax ? Math.max(0, usesMax - (session.spent[key] || 0)) : null;
    const usesPrefix = usesMax ? (left + "/" + usesMax + " (" + (ct.resetOn === "long" ? "long rest" : "short rest") + ") · ") : "";
    const label = ct.name + " (" + spRec.name + ")";
    let useFn = null;
    let isPressed;
    let isDisabled = ct.timing === "reaction" ? !canReact(session) : (ct.timing === "free" ? false : blocked);
    if (ct.effect === "Invisible") {
      const invOn = hasEffect("Invisible");
      useFn = () => update("Used " + ct.name + " (Invisible)", next => {
        if (usesMax) next.spent[key] = (next.spent[key] || 0) + 1;
        if (!next.effects.some(e => e.name === "Invisible")) {
          next.effects.push(conditionEntry("Invisible", 1, false, {id: newID(), note: ct.name, persistent: false}));
        }
      });
      isPressed = invOn;
      isDisabled = blocked || (usesMax > 0 && left <= 0);
    } else if (ct.effect === "Hidden") {
      const hidOn = hasEffect("Hidden");
      useFn = () => toggleNamedEffect("Hidden", ct.name);
      isPressed = hidOn;
      isDisabled = blocked;
    } else if (ct.effect === "dropTo1HP") {
      useFn = () => update("Used " + ct.name + " (Drop to 1 HP)", next => {
        if (usesMax) next.spent[key] = (next.spent[key] || 0) + 1;
        if ((next.hp || 0) <= 0) next.hp = 1;
      });
      isDisabled = usesMax > 0 && left <= 0;
    } else if (ct.effect === "spendHitDie") {
      const hdLeft = session.hitDice || 0;
      const timingLbl = ct.timing === "reaction" ? "Reaction" : "Bonus action";
      useFn = event => openSpendHitDieDialog(label, timingLbl, event.currentTarget);
      isDisabled = (ct.timing === "reaction" ? !canReact(session) : blocked) || hdLeft <= 0;
    } else if (usesMax > 0) {
      useFn = () => update("Used " + ct.name, next => { next.spent[key] = (next.spent[key] || 0) + 1; });
      isDisabled = (ct.timing === "reaction" ? !canReact(session) : (ct.timing === "free" ? false : blocked)) || left <= 0;
    }
    const _ctSum = interp(ct.summary).replace(/^(?:Action|Bonus action|Reaction)\s*·\s*/i, "");
    actionEntry(col, label, usesPrefix + _ctSum, {
      use: useFn,
      pressed: isPressed,
      disabled: isDisabled,
      details: () => showInfo(label, [["Species", spRec.name], ["Timing", ct.timing === "action" ? "Action" : ct.timing === "bonus" ? "Bonus action" : ct.timing === "reaction" ? "Reaction" : "No action / special"]], fullDesc)
    });
  }

  // Surface uncataloged homebrew customFeatures (excluding already-promoted official options)
  const skipCustom = /^(frenzy|dewback's instinct|fyrnock's instinct|force.?empowered casting|force\s*affinity\b.*|ashla|bendu|bogan)$/i;
  const promotedSet = new Set([
    ...activeManeuvers,
    ...activeForms,
    ...activeStyles,
    ...activeMasteries
  ].map(normalizeName));
  const knownManeuverSet = promotedSet;
  // Sentinel Ideals & Cunning Strategist actions are rendered via unified actionGrant.
  const activeArchRec = archetypeRecord(session.approach, profile.className);
  const archFeatureSet = new Set([
    ...(activeArchRec?.features || []),
    ...((activeArchRec?.mechanics?.actions || []).map(a => a.name)),
    ...((activeArchRec?.mechanics?.actions || []).map(a => a.feature || ""))
  ].map(normalizeName).filter(Boolean));
  for (const cf of profile.customFeatures || []) {
    const key = normalizeName(cf.name);
    if (skipCustom.test(key) || knownManeuverSet.has(key) || archFeatureSet.has(key) || (typeof classOptionRule === "function" && classOptionRule(cf.name))) continue;
    const text = cf.content || "";
    const isIdeal = /^ideal of /i.test(cf.name);
    const kind = isIdeal ? "bonus" : classifyHomebrewFeatureTiming(text);
    if (!kind) continue;
    const targetCol = kind === "reaction" ? reaction : kind === "bonus" ? bonus : kind === "action" ? action : freeTarget;
    const active = hasEffect(cf.name);
    const labelText = isIdeal
      ? (active ? "Manifested (1 minute)" : "Manifest as a bonus action")
      : (kind === "free" ? "Triggered / modifier" : kind === "reaction" ? "Reaction feature" : kind === "bonus" ? "Bonus action feature" : "Combat feature");
    actionEntry(targetCol, cf.name, labelText, {
      use: isIdeal ? () => toggleNamedEffect(cf.name, "1 minute") : null,
      pressed: isIdeal ? active : undefined,
      disabled: isIdeal ? blocked : false,
      details: () => showInfo(cf.name, [["Source", "Character feature"]], text)
    });
  }

  // Techie Repair Droid free cast is handled via Powers (gpFree:repair droid).
  // Ally Aura of Vigor (Guardian) clickable temp HP trigger
  const allyVigor = (session.effects || []).find(e => normalizeName(e.name) === "aura of vigor (guardian)");
  const hasOwnVigor = typeof resolveResourceEffects === "function" && (resolveResourceEffects(profile, session).actionGrants || []).some(g => normalizeName(g.name) === "aura of vigor");
  if (allyVigor && !hasOwnVigor) {
    const vMod = Math.max(1, allyVigor.value || 1);
    actionEntry(freeTarget, "Aura of Vigor (Ally)", "Start of turn in Guardian Aura · Gain +" + vMod + " temporary HP", {
      use: () => update("Aura of Vigor · +" + vMod + " temporary HP", next => {
        if (vMod > (next.temp || 0)) { next.temp = vMod; next.tempSource = "Aura of Vigor"; }
      }),
      disabled: c.dead,
      details: () => showInfo("Aura of Vigor", [["Source", "Guardian Aura"]], (typeof classOptionRule === "function" && classOptionRule("Aura of Vigor")?.description) || "When you start your turn within a friendly Guardian's Aura of Vigor, you gain temporary HP.")
    });
  }
  // Base class limited-use Combat buttons (Bad Feeling, Stroke of Luck, Calm and Collected)
  if (traits.isOperative && _opLvl >= 3) {
    const bf = characterResources(profile, session).find(r => r.id === "badFeeling");
    actionEntry(freeTarget, "Bad Feeling", (bf?.value || 0) + "/1 (long rest) · Move up to your speed when rolling Initiative", {
      use: () => update("Used Bad Feeling", next => { next.spent.badFeeling = 1; }),
      disabled: !(bf?.value > 0),
      details: () => showInfo("Bad Feeling", [["Timing", "When rolling Initiative"], ["Recharge", "Long rest"]], classRule(profile, "Bad Feeling"))
    });
  }
  if (traits.isOperative && _opLvl >= 20) {
    const sol = characterResources(profile, session).find(r => r.id === "strokeOfLuck");
    actionEntry(freeTarget, "Stroke of Luck", (sol?.value || 0) + "/1 (short rest) · Turn a missed attack into a hit or treat a failed check as a 20", {
      use: () => update("Used Stroke of Luck", next => { next.spent.strokeOfLuck = 1; }),
      disabled: !(sol?.value > 0),
      details: () => showInfo("Stroke of Luck", [["Timing", "No action"]], classRule(profile, "Stroke of Luck"))
    });
  }
  if (traits.isScholar && _schLvl >= 14) {
    const cc = characterResources(profile, session).find(r => r.id === "calmAndCollected");
    const ccAb = typeof scholarCriticalAnalysisAbility === "function" ? scholarCriticalAnalysisAbility(profile, session) : "Intelligence";
    const ccMod = modifier(effectiveScores(profile, session)[ccAb]);
    actionEntry(freeTarget, "Calm and Collected", (cc?.value || 0) + "/" + (cc?.max || 5) + " (long rest) · Add " + signed(ccMod) + " (" + ccAb + ") to a saving throw against a seen effect", {
      use: () => update("Used Calm and Collected (" + signed(ccMod) + " save)", next => { next.spent.calmAndCollected = (next.spent.calmAndCollected || 0) + 1; }),
      disabled: !(cc?.value > 0),
      details: () => showInfo("Calm and Collected", [["Timing", "No action (on saving throw)"], ["Bonus", signed(ccMod) + " (" + ccAb + ")"]], classRule(profile, "Calm and Collected"))
    });
  }
  // Generic active/limited-use feat actions from VERIFIED_FEAT_COMBAT_ACTIONS
  const seenFeatActions = new Set();
  for (const ft of (session.feats || [])) {
    const rec = featRule(ft.name);
    const ca = rec?.combatAction;
    if (!ca) continue;
    if ((rec?.effects || []).filter(e => e.type === "resourcePool").length >= 2) continue;
    const featKey = normalizeName(rec.name);
    if (seenFeatActions.has(featKey)) continue;
    seenFeatActions.add(featKey);
    const col = ca.timing === "action" ? action : ca.timing === "bonus" ? bonus : ca.timing === "reaction" ? reaction : freeTarget;
    const key = "featAct:" + normalizeName(rec.name);
    const usesMax = ca.uses || 0;
    const left = usesMax ? Math.max(0, usesMax - (session.spent[key] || 0)) : null;
    const prefix = usesMax ? (left + "/" + usesMax + " (" + (ca.resetOn === "long" ? "long rest" : "short rest") + ") · ") : "";
    let useFn = null;
    let isDisabled = ca.timing === "reaction" ? !canReact(session) : (ca.timing === "free" ? false : blocked);
    if (ca.effect === "spendHitDieClear") {
      const hdLeft = session.hitDice || 0;
      const conds = ca.clearConditions || [];
      useFn = () => update(rec.name + " · Spent 1 Hit Die (cleared " + conds.join("/") + ")", next => {
        if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile); else next.hitDice = Math.max(0, (next.hitDice || 0) - 1);
        next.effects = next.effects.filter(e => !conds.includes(e.name));
      });
      isDisabled = blocked || hdLeft <= 0;
    } else if (ca.effect === "dropTo1HP") {
      useFn = () => update("Used " + rec.name + " (Drop to 1 HP)", next => {
        if (usesMax) next.spent[key] = (next.spent[key] || 0) + 1;
        if ((next.hp || 0) <= 0) next.hp = 1;
      });
      isDisabled = usesMax > 0 && left <= 0;
    } else if (usesMax > 0) {
      const conds = ca.clearConditions || [];
      useFn = () => update("Used " + rec.name, next => {
        next.spent[key] = (next.spent[key] || 0) + 1;
        if (conds.length) next.effects = next.effects.filter(e => !conds.includes(e.name));
      });
      isDisabled = (ca.timing === "reaction" ? !canReact(session) : (ca.timing === "free" ? false : blocked)) || left <= 0;
    }
    const _caSum = interp(ca.summary).replace(/^(?:Action|Bonus action|Reaction)\s*·\s*/i, "");
    actionEntry(col, rec.name + " (Feat)", prefix + _caSum, {
      use: useFn,
      disabled: isDisabled,
      details: () => showFeat(rec.name, ft)
    });
  }
  // Bountiful Luck is rendered via unified actionGrant (linked to Lucky's luck resource pool).

  const blockingPhysicalShield = Boolean(armor.shield && !/generator/i.test(armor.shield.name));
  const twfCandidates = weapons.filter(w => {
    const st = weaponStats(profile, w, raging, session);
    return st && !st.doubleProp && (st.light || (traits.twfIgnoreLight && !st.twoHanded));
  });
  const totalTwfCount = twfCandidates.reduce((n, w) => n + Math.max(1, (w.detached ? 2 : (w.quantity || 1))), 0);
  const offhandWeapons = weapons.filter(w => {
    const st = weaponStats(profile, w, raging, session);
    if (!st) return false;
    const cEffDwf = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
    const effDwfIgnoreLight = Boolean(traits.dwfIgnoreLight || cEffDwf?.weaponRules?.some(wr => (wr.kind === "dwfIgnoreLight" || wr.params?.dwfIgnoreLight)));
    if (st.doubleProp) {
      // SW5e PHB Ch. 9 Double-Weapon Fighting: requires light + double (unless dwfIgnoreLight) and wielding in two hands
      return !blockingPhysicalShield && (st.useTwoHands || st.twoHanded) && (st.light || effDwfIgnoreLight);
    }
    // SW5e PHB Ch. 9 Two-Weapon Fighting: requires two qualifying weapons (no physical shield)
    return !blockingPhysicalShield && totalTwfCount >= 2 && (st.light || (traits.twfIgnoreLight && !st.twoHanded));
  });
  for (const item of offhandWeapons) {
    const stats = weaponStats(profile, item, raging, session);
    stats.armorPenalty = armor.nonproficient;
    const isDouble = Boolean(stats.doubleProp);
    const offStats = {...stats};
    if (isDouble) {
      if (stats.doubleProp.dice) {
        offStats.dice = stats.doubleProp.dice;
        offStats.die = stats.doubleProp.die;
        if (stats.doubleProp.type && !stats.weaponProperties.conversion) offStats.type = stats.doubleProp.type;
      }
      const cEffOff = typeof resolveCombatEffects === "function" ? resolveCombatEffects(profile, session) : null;
      const effDwfAddToHit = Boolean(traits.dwfAddAbilityModToHit || cEffOff?.attackDamageMods?.some(am => am.scope === "dwf" && am.addAbilityModToHit));
      // SW5e Double-Weapon Fighting: DO NOT add positive ability modifier to the ATTACK roll (unless Twin-Blade / Split Style); DO keep ability mod on damage!
      if (!effDwfAddToHit && (stats.abilityMod || 0) > 0) {
        offStats.toHit = stats.toHit - stats.abilityMod;
        offStats.attackBreakdown = [...stats.attackBreakdown, { label: "Double-Weapon Fighting", value: -stats.abilityMod }];
      }
    } else if (!traits.twfAddAbilityMod && (stats.abilityMod || 0) > 0) {
      // SW5e Two-Weapon Fighting: DO NOT add positive ability modifier to the DAMAGE roll (unless Dual Wield / Split Style)
      offStats.bonus = stats.bonus - stats.abilityMod;
      offStats.damageBreakdown = [...stats.damageBreakdown, { label: "Two-Weapon Fighting", value: -stats.abilityMod }];
    }
    const labelSuffix = isDouble ? " · double-weapon" : " · off-hand";
    const styleNote = isDouble
      ? (traits.dwfAddAbilityModToHit ? " · Twin-Blade/Split Style" : " · no ability modifier to hit")
      : (traits.twfAddAbilityMod ? " · Dual Wield/Split Style" : " · no ability modifier to damage");
    const geaNote = classLevelOf(profile, "Fighter") >= 11 ? " · 2 attacks (Greater Extra Attack)" : "";
    actionEntry(bonus, item.name + labelSuffix, signed(offStats.toHit) + " to hit · " + damageNotation(offStats) + styleNote + geaNote, {
      mode: attackMode(session, offStats, "offhand"),
      details: () => showItem(item.name, item),
      onTextClick: ev => showWeaponMathPopover(ev.currentTarget, item.name + labelSuffix, offStats, profile, session, item),
      use: trackFirstAttack || stats.weaponProperties.dire || stats.weaponProperties.piercing || stats.weaponProperties.reckless || stats.weaponProperties.conversion
        ? event => openWeaponAttack(event.currentTarget, profile, session, item, offStats, "offhand", trackFirstAttack) : null,
      disabled: blocked
    });
  }

  // Reactions
  const opportunity = () => showInfo("Opportunity Attack", [["Timing", "1 Reaction"], ["System", "SW5e Player's Handbook Chapter 9"]], "You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature. The attack occurs right before the creature leaves your reach.\n\nYou can avoid provoking an opportunity attack by taking the **Disengage** action. You also don’t provoke an opportunity attack when you teleport or when someone or something moves you without using your movement, action, or reaction.");
  const meleeWeapons = weapons.filter(w => weaponStats(profile, w, raging, session)?.melee);
  if (!canReact(session)) {
    actionEntry(reaction, "Opportunity attack", c.shocked ? "Unavailable while Shocked" : "Unavailable while Incapacitated", {details: opportunity});
  } else if (!meleeWeapons.length) {
    actionEntry(reaction, "Opportunity attack", "Unarmed strike · " + signed(unarmed.toHit) + " to hit · " + damageNotation(unarmed), {
      details: opportunity,
      mode: attackMode(session, unarmed, "reaction")
    });
  } else {
    for (const item of meleeWeapons) {
      const stats = weaponStats(profile, item, raging, session);
      stats.armorPenalty = armor.nonproficient;
      actionEntry(reaction, "Opportunity attack", item.name + " · " + signed(stats.toHit) + " to hit · " + damageNotation(stats), {
        details: opportunity,
        mode: attackMode(session, stats, "reaction"),
        use: stats.weaponProperties.dire || stats.weaponProperties.piercing || stats.weaponProperties.conversion
          ? event => openWeaponAttack(event.currentTarget, profile, session, item, stats, "reaction", false) : null
      });
    }
  }

  // Unified effect-engine contextualNotes (attacks + combat.*) and actionGrants (v7 interactive + concise)
  if (typeof resolveContextualNotes === "function") {
    const _baseActKey = s => normalizeName(String(s || "").replace(/\s*·.*$/g, "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s*\([^)]*\)/g, ""));
    const _cleanGrantTitle = (rawTitle, srcName) => {
      let t = String(rawTitle || srcName || "Action").trim();
      if (srcName) {
        const esc = srcName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        t = t.replace(new RegExp("\\s*\\(" + esc + "\\)\\s*$", "i"), "").trim();
      }
      return t || srcName || "Action";
    };
    const CURATED_ACTION_SUMMARIES = {
      "spend speed point": (eff) => {
        const lv = Math.max(1, Number(eff?.castLevel) || 1);
        return `+5 ft speed · climb = walk · fall resist · ignore difficult terrain · +10/+3 ft jump · +${lv}d4 melee charge (20 ft)`;
      },
      "force shield": () => "On hit: +Wisdom or Charisma modifier to AC (min +1) until start of next turn",
      "uncanny insight": () => "30 ft humanoid · Insight vs Deception → advantage on attacks & checks until end of next turn",
      "placed shots": () => "Forgo 2 Sneak Attack dice (Dexterity DC): Disarm, Penetrate (15 ft behind), or Suppress (Frightened)",
      "sharpshooter mark (>30 ft)": () => "Mark target >30 ft · Ranged opportunity attack if it moves ≥ 5 ft before your next turn",
      "rapid reconstruction": () => "Spend 1 Hit Die to regain HP",
      "hunter's prey": () => {
        const picked = session?.archetypeFeatureChoices?.["Hunter's Prey"] || [];
        if (picked.length) {
          const map = {
            "colossus slayer": "Colossus Slayer: +1d8 damage once/turn vs wounded target",
            "giant killer": "Giant Killer: reaction attack when Large+ creature within 5 ft attacks you",
            "horde breaker": "Horde Breaker: once/turn extra weapon attack vs different foe within 5 ft"
          };
          return picked.map(p => map[normalizeName(p)] || p).join(" · ");
        }
        return "Colossus Slayer (+1d8 vs wounded) · Giant Killer (reaction vs Large+) · Horde Breaker (extra attack)";
      },
      "preserve life": () => "30 ft · Distribute 5× level HP (up to half maximum HP; no droids/constructs)",
      "historical advice": () => "On Help check: DC 15 Lore to add +PB to ally's check",
      "search": () => "Take the Search action",
      "fervor strike": () => "On crit or 0 HP kill: 1 bonus weapon attack",
      "commander's strike": () => "Forgo 1 attack + 1 sup. die: ally uses reaction to attack (+die damage)",
      "multitasker": () => "Second reaction each round · Reaction to apply Critical Analysis to an ally's save",
      "motivating diplomat": () => "While target of Critical Analysis: you & allies within 10 ft gain +½ CA mod AC",
      "assume the position": () => "Sneak Attack >30 ft without advantage (no foes within 5 ft) · Stand from prone costs 5 ft",
      "sharpshooter style (regrip)": () => "Regrip 2H weapon with free hand (no object interaction)",
      "mark of the hunter": () => "First weapon or tech attack/turn vs Quarry adds Quarry die to hit",
      "cunning action": () => "Dash, Disengage, or Hide",
      "uncanny dodge": () => "Halve damage from an attack by a visible attacker",
      "bad feeling": () => "On Initiative: move up to speed before turn order is set",
      "sage advice": () => "1 minute · Up to {caMod} allies within 30 ft add proficiency bonus to 1 proficient skill or tool check (1 hour)",
      "transfer hex": () => "90 ft · Curse a new target after cursed foe drops to 0 HP",
      "animate weapon": (eff) => {
        const lv = Math.max(2, Number(eff?.castLevel) || 2);
        const dice = 1 + Math.floor((lv - 2) / 2);
        return `Move 20 ft · Melee force attack (${dice}d8 + casting mod)`;
      },
      "move kinetite": (eff) => {
        const lv = Math.max(2, Number(eff?.castLevel) || 2);
        return `Move 30 ft · Ram target: DEX save or ${lv}d6 kinetic (half on save)`;
      },
      "probe mind": (eff) => {
        const lv = Math.max(2, Number(eff?.castLevel) || 2);
        const dice = Math.max(1, lv - 1);
        return `30 ft · Read thoughts or probe deeper (WIS save or ${dice}d6 psychic)`;
      },
      "call lightning": (eff) => {
        const lv = Math.max(3, Number(eff?.castLevel) || 3);
        return `120 ft (5-ft rad) · DEX save or ${lv}d10 lightning (+1d10 in storm, half on save)`;
      },
      "knight speed extra action": () => "Extra action: 1 weapon attack, Dash, Disengage, Hide, or Use an Object",
      "master speed extra action": () => "Extra action: 1 weapon attack, Dash, Disengage, Hide, or Use an Object",
      "grasping vine lash": () => "30 ft from vine · DEX save or pulled 20 ft toward vine",
      "kinetite lightning bolt": (eff) => {
        const lv = Math.max(5, Number(eff?.castLevel) || 5);
        return `60 ft from sphere · Ranged force attack (${lv - 1}d6 lightning; advantage if inside)`;
      },
      "move greater kinetite": (eff) => {
        const lv = Math.max(5, Number(eff?.castLevel) || 5);
        return `Move 30 ft · Ram target: DEX save or ${lv}d8 kinetic (half on save)`;
      },
      "improved phasewalk": () => "Teleport up to 60 ft to an unoccupied space you can see",
      "greater translocate": () => "Teleport up to 60 ft to an unoccupied space you can see",
      "command animated objects": (eff) => {
        const lv = Math.max(5, Number(eff?.castLevel) || 5);
        const cnt = 10 + (lv - 5) * 2;
        return `100 ft · Direct up to ${cnt} animated objects (fly 30 ft)`;
      },
      "siphon life sustain": (eff) => {
        const lv = Math.max(5, Number(eff?.castLevel) || 5);
        return `60 ft · Auto-deal ${lv - 1}d8 necrotic & heal half damage dealt`;
      },
      "scourge gaze": () => "60 ft · CON save or Asleep (unconscious), Panicked, or Sickened",
      "move force project": () => "Move illusory copy up to 2× speed (bonus action to swap senses)",
      "move project hologram": () => "Move illusory copy up to 2× speed (bonus action to swap senses)",
      "hurl jet of flame": () => "30 ft (ends power) · Ranged tech attack: 1d8 fire (scales at L5/11/17)",
      "move mobile lights": () => "120 ft · Move up to 4 dim-light orbs up to 60 ft",
      "expeditious retreat": () => "Take the Dash action",
      "ionic bond sustain": () => "30 ft · Auto-deal 1d8 ion damage to tethered target",
      "capacity boost attack": (eff) => {
        const lv = Math.max(1, Number(eff?.castLevel) || 1);
        return (lv >= 5 ? "2 attacks" : "1 attack") + " with empowered blaster · Free reload once per turn";
      },
      "move kolto dispenser": (eff) => {
        const lv = Math.max(2, Number(eff?.castLevel) || 2);
        return `Move 30 ft · 5-ft station heals ${lv - 1}d6 HP per charge`;
      },
      "overheat pulse": (eff) => {
        const lv = Math.max(2, Number(eff?.castLevel) || 2);
        return `Deal ${lv}d8 fire to creature touching metal · CON save or drop / disadvantage`;
      },
      "hurl sabotage charges": (eff) => {
        const lv = Math.max(3, Number(eff?.castLevel) || 3);
        const dmg = lv >= 7 ? "4d6" : "2d6";
        const rad = lv >= 7 ? "10-ft" : "5-ft";
        return `120 ft · Hurl up to 2 charges (${rad} rad, DEX save or ${dmg} fire, half on save)`;
      },
      "slow-release medpac heal": () => "30-ft aura · Restore 2d6 HP to one living creature",
      "move sensor probe": () => "Move invisible 30-ft darkvision probe up to 30 ft",
      "disperse energy immunity": () => "On taking elemental damage: end resistances to gain immunity until end of next turn",
      "combat tech": () => "After casting a tech power as an action: 1 weapon attack",
      "battle readiness": () => "After Dodge, Disengage, or casting a force power as an action: 1 weapon attack",
      "cleansing touch": () => "Touch (1 Channel the Force) · End one force power on yourself or a willing creature"

    };
    const _cleanGrantSummary = (rawSummary, cleanTitle, linkedEff = null) => {
      const curated = CURATED_ACTION_SUMMARIES[normalizeName(cleanTitle)];
      if (curated) return curated(linkedEff);
      let s = String(rawSummary || "").trim();
      if (!s) return "";
      // Remove only redundant timing prefix already shown by the column header — NEVER chop off damage or mechanics
      s = s.replace(/^(?:as a |using a )?(?:bonus action|action|reaction|no action|free action|special)\s*[:\-—·]?\s*/i, "");
      s = s.replace(/\.$/, "").trim();
      return s ? s[0].toUpperCase() + s.slice(1) : "";
    };
    const _lookupRuleDetails = (srcName, srcKind, title, fullText, extraFacts = [], srcObj = null) => () => {
      const addMeta = Array.isArray(extraFacts) ? extraFacts.filter(f => Array.isArray(f) && f[0] && f[1]) : [];
      const cleanTitle = String(title || "").replace(/\s*\((?:Special Reaction|Reaction|Legendary Action|Lair Action)\)\s*$/i, "");
      if (typeof openRuleElement === "function" && typeof resolveRuleElement === "function") {
        // When an action grant (e.g., "Parry (Blade Supremacy)") is distinct from its parent Rule Element ("Blade Supremacy"),
        // display the action title with a full recursive "Granted by:" provenance chain (e.g., Blade Supremacy › Weapon Supremacist).
        const parentSrc = srcObj || (srcName ? { kind: srcKind || "", name: srcName } : null);
        const parentResolved = parentSrc ? resolveRuleElement(parentSrc, profile, session) : null;
        if (parentResolved && normalizeName(cleanTitle) !== normalizeName(parentResolved.name)) {
          const chain = [{ label: parentResolved.name, source: { ...parentSrc, kind: parentResolved.kind, name: parentResolved.name } }, ...(parentResolved.provenanceChain || [])];
          const facts = [
            ...addMeta,
            ["Granted by", renderSourceLinks(chain, { separator: " › ", className: "ruleLinkChain", push: true, profile, session })]
          ];
          const body = [fullText, parentResolved.rulesText].filter(Boolean).join("\n\n");
          return showInfo(title, facts, body, { navKey: "action:" + normalizeName(title) });
        }
        if (parentResolved) {
          return openRuleElement({ ...parentSrc, kind: parentResolved.kind, name: parentResolved.name }, { extraFacts: addMeta, profile, session });
        }
        const byTitle = resolveRuleElement({ kind: srcKind || "", name: cleanTitle }, profile, session);
        if (byTitle) {
          return openRuleElement({ kind: byTitle.kind, name: byTitle.name }, { extraFacts: addMeta, profile, session });
        }
      }
      return showInfo(title, [["Source", srcName || "Feature"], ...addMeta], fullText || "No additional rule text.");
    };

    const renderedNames = new Set();
    const renderedBaseNames = new Set();
    for (const zoneNode of [action, bonus, reaction, freeTarget].filter(Boolean)) {
      if (zoneNode.querySelectorAll) {
        for (const el of zoneNode.querySelectorAll(".rowTrigger > b, .rowStatic > b, .action-name, strong")) {
          if (el.textContent) {
            const clean = el.textContent.replace(/\s*\[[^\]]+\]\s*$/, "");
            renderedNames.add(normalizeName(clean));
            const bk = _baseActKey(clean);
            if (bk) renderedBaseNames.add(bk);
          }
        }
      }
    }
    const passiveAccountedFor = /^(martial arts|force.?empowered self|force.?empowered casting|sentinel ideals|scout routine|academic superiority|combat superiority|unarmored defense|unarmored movement|extra attack|savage attacks|fighting style|fighting mastery|lightsaber form|formfighting mastery|exotic weapon training|weapon expert|weapon focused|weapon supremacist|focus|superiority|forcecasting|techcasting|hunter's prey|defensive tactics|multiattack|superior hunter's defense|customized armor|elemental adept|elemental master|elemental paragon|chimeric adaptation|form basics|anchor \/ recover shield|interlock shields|toggle lambent shield light)$/i;
    const zoneMap = [
      ["attacks", freeTarget],
      ["combat.action", action],
      ["combat.bonus", bonus],
      ["combat.reaction", reaction],
      ["combat.special", freeTarget]
    ];
    const _interpWeaponGroupTokens = (rawText, srcKind, srcName) => {
      if (srcKind !== "weaponFocus" && srcKind !== "weaponSupremacy") return rawText;
      const wRec = srcKind === "weaponSupremacy"
        ? (typeof weaponSupremacyRule === "function" ? weaponSupremacyRule(srcName, { allowBare: true }) : null)
        : (typeof weaponFocusRule === "function" ? weaponFocusRule(srcName, { allowBare: true }) : null);
      if (!wRec?.group) return rawText;
      const grpWeapons = weapons.map(w => weaponStats(profile, w, raging, session)).filter(st => st && st.proficient && normalizeName(st.wepGroup) === normalizeName(wRec.group));
      const best = grpWeapons.length ? grpWeapons.reduce((a, b) => (b.toHit > a.toHit ? b : a), grpWeapons[0]) : null;
      const dcText = best ? ("DC " + (8 + (best.toHit || 0)) + " (" + best.name + ")") : "DC 8 + weapon attack bonus";
      const modText = best ? (Math.max(0, best.abilityMod || 0) + " (" + (best.ability || "Strength") + " modifier)") : "governing ability modifier";
      const reloadNum = best ? (Number(String(best.reload || "").match(/\d+/)?.[0]) || 0) : 0;
      const halfReloadText = reloadNum > 0
        ? (Math.max(2, Math.floor(reloadNum / 2)) + " ammo (half reload)")
        : "half reload ammo (minimum 2)";
      return String(rawText || "")
        .replaceAll("{weaponAttackDC}", dcText)
        .replaceAll("{weaponAbilityMod}", modText)
        .replaceAll("{weaponHalfReload}", halfReloadText);
    };
    const _allEffectsForRollFloor = typeof collectCharacterEffects === "function" ? collectCharacterEffects(profile, session) : [];
    for (const [surf, targetNode] of zoneMap) {
      if (!targetNode) continue;
      for (const cn of resolveContextualNotes(profile, session, surf)) {
        if (typeof isStandalonePassiveRollFloorNote === "function" && isStandalonePassiveRollFloorNote(cn, _allEffectsForRollFloor)) continue;
        const key = normalizeName(cn.title);
        const bkey = _baseActKey(cn.title);
        const hasDistinctSubtitle = Boolean(/\([^)]+\)\s*$/.test(cn.title || "") && bkey && key !== bkey && normalizeName(cn.source || "") === bkey);
        if (passiveAccountedFor.test(key) || (!hasDistinctSubtitle && bkey && passiveAccountedFor.test(bkey))) continue;
        if (renderedNames.has(key) || (!hasDistinctSubtitle && bkey && renderedBaseNames.has(bkey))) continue;
        renderedNames.add(key);
        if (bkey && !hasDistinctSubtitle) renderedBaseNames.add(bkey);
        const title = _cleanGrantTitle(cn.title, cn.source);
        const cnChoice = session.combatOptionChoices?.[cn.source]?.[0] || "chosen-type";
        const cnText = _interpWeaponGroupTokens(String(cn.rawText || cn.text || "").replaceAll("{choice}", cnChoice), cn.sourceKind, cn.source);
        const cnCadence = typeof formatCadenceLabel === "function" ? formatCadenceLabel(cn.cadence, cn.rechargeMin) : "";
        const cnDur = typeof formatDurationSpec === "function" ? formatDurationSpec(cn.durationSpec) : "";
        const sub = appendCadenceIfMissing(_cleanGrantSummary(interp(cnText), title, null), cnCadence);
        const cnMeta = [
          ...(targetNode === reaction ? [["Timing", "Reaction"]] : []),
          ...(cnCadence ? [["Cadence", cnCadence]] : []),
          ...(cnDur ? [["Duration", cnDur]] : [])
        ];
        const entry = actionEntry(targetNode, title, sub, {
          disabled: targetNode === reaction ? !canReact(session) : false,
          details: _lookupRuleDetails(cn.source, cn.sourceKind || "", title, cnText, cnMeta)
        });

      }
    }
    if (typeof resolveResourceEffects === "function") {
      const agZone = { action, bonus, reaction, special: freeTarget };
      const allResList = typeof characterResources === "function" ? characterResources(profile, session) : [];
      const archSubChoiceMap = {
        "colossus slayer": { zone: "special", summary: "Once per turn on weapon hit vs wounded target: +1d8 weapon damage" },
        "giant killer": { zone: "reaction", summary: "Reaction: melee/weapon attack vs Large+ creature within 5 ft that hits or misses you" },
        "horde breaker": { zone: "special", summary: "Once per turn on weapon attack: extra attack vs another creature within 5 ft of target" },
        "stand against the tide": { zone: "reaction", summary: "Reaction: when a foe misses you with melee attack, force it to repeat attack vs another creature" },
        "uncanny dodge": { zone: "reaction", summary: "Reaction: halve damage from an attack by a visible attacker" }
      };
      for (const [parentFeat, picks] of Object.entries(session.archetypeFeatureChoices || {})) {
        for (const pick of (Array.isArray(picks) ? picks : [])) {
          const info = archSubChoiceMap[normalizeName(pick)];
          if (!info) continue;
          const targetNode = agZone[info.zone] || freeTarget;
          const pk = normalizeName(pick);
          if (!targetNode || renderedNames.has(pk)) continue;
          renderedNames.add(pk);
          const archRules = typeof approachRule === "function" ? approachRule(profile, session, pick) : "";
          const entry = actionEntry(targetNode, pick, info.summary, {
            disabled: targetNode === reaction ? !canReact(session) : false,
            details: () => showInfo(pick, [["Source", (session.approach || "Archetype") + " · " + parentFeat], ...(targetNode === reaction ? [["Timing", "Reaction"]] : [])], archRules || info.summary)
          });

        }
      }
      const _resEffAll = resolveResourceEffects(profile, session);
      const _wsUpgradeMap = new Map();
      for (const au of (_resEffAll.actionUpgrades || [])) {
        if (au.source?.kind === "weaponSupremacy" && au.targetAction && au.newZone) {
          _wsUpgradeMap.set(normalizeName(au.targetAction), au);
        }
      }
      for (const ag of _resEffAll.actionGrants) {
        const srcName = ag.source?.name || "";
        const rawName = ag.name || srcName || "";
        const key = normalizeName(rawName);
        const bkey = _baseActKey(rawName);
        const wsUpgrade = (ag.source?.kind === "weaponFocus" && bkey) ? _wsUpgradeMap.get(bkey) : null;
        const effectiveZone = wsUpgrade ? wsUpgrade.newZone : ag.zone;
        const targetNode = agZone[effectiveZone] || freeTarget;
        const srcNorm = normalizeName(srcName);
        const hasOwnDistinctRes = Boolean(ag.resourceId && !renderedNames.has(key));
        const hasDistinctZone = Boolean(!renderedNames.has(key) && ag.effect === "spendHitDie");
        if (!targetNode || !key || ag.source?.kind === "fightingStyle" || ag.source?.kind === "fightingMastery" || ag.source?.kind === "lightsaberForm" || ag.source?.kind === "maneuver" || passiveAccountedFor.test(key) || (bkey && passiveAccountedFor.test(bkey)) || renderedNames.has(key) || (!hasOwnDistinctRes && !hasDistinctZone && bkey && renderedBaseNames.has(bkey)) || (!hasOwnDistinctRes && srcNorm && ag.source?.kind === "feat" && renderedNames.has(srcNorm))) continue;
        renderedNames.add(key);
        if (bkey) renderedBaseNames.add(bkey);

        // Link to explicit resourceId OR matching active-effect charge pool (e.g., Instinctive Movement Speed Points)
        let linkedRes = ag.resourceId ? allResList.find(r => r.id === ag.resourceId) : null;
        let linkedEff = null;
        if (!linkedRes && srcName) {
          linkedEff = (session.effects || []).find(e => normalizeName(e.name) === normalizeName(srcName) && Number(e.chargesMax) > 0);
          if (linkedEff) {
            linkedRes = allResList.find(r => r.id === "effCharge:" + linkedEff.id) || {
              id: "effCharge:" + linkedEff.id,
              value: Number(linkedEff.charges) || 0,
              max: Number(linkedEff.chargesMax) || 1
            };
          }
        }
        const agCadence = formatCadenceLabel(ag.cadence, ag.rechargeMin);
        const agReactKind = ag.reactionKind || (effectiveZone === "reaction" ? "standard" : "");
        const title = appendReactionKindToTitle(_cleanGrantTitle(rawName, srcName), ag.reactionKind, false);
        const agEffectMeta = {
          ...(ag.source ? { source: ag.source } : {}),
          fromActionGrant: true,
          ...(ag.durationSpec ? { durationSpec: ag.durationSpec } : {}),
          ...(ag.turnTriggers?.length ? { turnTriggers: ag.turnTriggers } : {})
        };
        let rawSub = String(ag.summary || "");
        let wsUpgradeFact = null;
        if (ag.source?.kind === "weaponFocus" || ag.source?.kind === "weaponSupremacy") {
          if (wsUpgrade) {
            rawSub = "Bonus action (" + (wsUpgrade.source?.name || "Weapon Supremacy") + "): " + (wsUpgrade.summary || rawSub);
            if (wsUpgrade.source && typeof buildProvenanceChain === "function" && typeof renderSourceLinks === "function") {
              const upRes = typeof resolveRuleElement === "function" ? resolveRuleElement(wsUpgrade.source, profile, session) : null;
              const upChain = upRes
                ? [{ label: upRes.name, source: { ...wsUpgrade.source, kind: upRes.kind, name: upRes.name } }, ...(upRes.provenanceChain || [])]
                : [{ label: wsUpgrade.source.name, source: wsUpgrade.source }];
              wsUpgradeFact = ["Upgraded by", renderSourceLinks(upChain, { separator: " › ", className: "ruleLinkChain", push: true, profile, session })];
            }
          }
          rawSub = _interpWeaponGroupTokens(rawSub, ag.source.kind, srcName);
        }
        rawSub = interp(rawSub);
        const sub = _cleanGrantSummary(rawSub, title, linkedEff);
        const agCostPool = ag.cost && typeof ag.cost === "object" ? String(ag.cost.pool || "").toLowerCase() : "";
        const agCostAmt = ag.cost && typeof ag.cost === "object" ? (Number(ag.cost.amount) || 0) : 0;
        const agCostMaxAmt = ag.cost && typeof ag.cost === "object" ? Math.max(agCostAmt, Number(ag.cost.maxAmount) || agCostAmt) : agCostAmt;
        const hasPointCost = (agCostPool === "force" || agCostPool === "tech" || agCostPool === "focus") && agCostAmt > 0;
        const hasVariablePointCost = hasPointCost && agCostMaxAmt > agCostAmt;
        const focusPoolRes = agCostPool === "focus" ? allResList.find(r => r.id === "focus") : null;
        const pointPoolRem = agCostPool === "force"
          ? (casting.forceTotalRemaining || 0)
          : (agCostPool === "tech"
            ? (casting.techTotalRemaining || 0)
            : (agCostPool === "focus" ? (focusPoolRes?.value || 0) : 0));
        const extras = [];
        if (linkedRes) {
          const pill = document.createElement("span");
          pill.className = "actionCostPill" + (linkedRes.value <= 0 ? " is-empty" : "");
          pill.textContent = linkedRes.value + "/" + linkedRes.max;
          extras.push(pill);
        }
        if (hasPointCost) {
          const pill = document.createElement("span");
          pill.className = "actionCostPill" + (pointPoolRem < agCostAmt ? " is-empty" : "");
          const amtLabel = hasVariablePointCost ? (agCostAmt + "–" + agCostMaxAmt) : String(agCostAmt);
          pill.textContent = amtLabel + (agCostPool === "force" ? " FP" : agCostPool === "tech" ? " TP" : " Focus");
          extras.push(pill);
        }
        const canSpend = Boolean(linkedRes && linkedRes.id);
        const isSpendHitDieClear = ag.effect === "spendHitDieClear";
        const isSpendHitDie = ag.effect === "spendHitDie";
        const isApplyTempHP = ag.effect === "applyTempHP";
        const isApplyTempHPCon = ag.effect === "applyTempHPCon";
        const isRegainForce = ag.effect === "regainForce";
        const isRollHeal = ag.effect === "rollHeal";
        const isRollTempExhaust = ag.effect === "rollTempHPAndReduceExhaustion";
        const secondaryRes = ag.secondaryResourceId ? allResList.find(r => r.id === ag.secondaryResourceId) : null;
        const isHiddenToggle = ag.effect === "Hidden";
        const isFreeClearConds = ag.effect === "clearConditions" && !canSpend && Array.isArray(ag.clearConditions) && ag.clearConditions.length > 0;
        const isPickNonProfSave = ag.effect === "pickNonProfSave";
        const activePickSaveEff = isPickNonProfSave ? (session.effects || []).find(e => normalizeName(e.name) === normalizeName(title)) : null;
        const isSurgeActive = Boolean(linkedEff?.perTurnCharges && linkedEff.surgeActive);
        const subWithState = appendCadenceIfMissing(
          activePickSaveEff?.choice
            ? ("Active · +" + Math.max(1, Math.floor((profile.proficiency || 2) / 2)) + " to " + activePickSaveEff.choice + " saves")
            : (isSurgeActive ? ("Active · " + sub) : sub),
          agCadence
        );
        const clearConds = Array.isArray(ag.clearConditions) ? ag.clearConditions : [];
        let useHandler = null;
        if (isSpendHitDie) {
          const timingLbl = ag.zone === "reaction" ? "Reaction" : (ag.zone === "action" ? "Action" : "Bonus action");
          useHandler = event => openSpendHitDieDialog(title, timingLbl, event?.currentTarget || null);
        } else if (isSpendHitDieClear) {
          useHandler = () => update(title + " · Spent 1 Hit Die" + (clearConds.length ? " (cleared " + clearConds.join("/") + ")" : ""), next => {
            if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile); else next.hitDice = Math.max(0, (next.hitDice || 0) - 1);
            if (clearConds.length) next.effects = next.effects.filter(e => !clearConds.includes(e.name));
          });
        } else if (isApplyTempHP) {
          const scTmp = effectiveScores(profile, session);
          const amt = ag.amountFormula === "levelPlusCha"
            ? Math.max(1, (profile.level || 1) + modifier(scTmp.Charisma))
            : ag.amountFormula === "halfLevelPlusWisChaMod"
              ? Math.max(1, Math.floor((profile.level || 1) / 2) + Math.max(1, modifier(scTmp.Wisdom), modifier(scTmp.Charisma)))
            : ag.amountFormula === "wisChaMod"
              ? Math.max(1, modifier(scTmp.Wisdom), modifier(scTmp.Charisma))
              : Math.max(1, Number(ag.amount) || 1);
          useHandler = () => update(title + " (+" + amt + " temporary HP)", next => {
            if (canSpend) next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
            if (amt > (next.temp || 0)) { next.temp = amt; next.tempSource = title; }
          });
        } else if (isRegainForce) {
          const scFp = effectiveScores(profile, session);
          const fpAmt = ag.amountFormula === "halfForceMod"
            ? Math.max(1, Math.floor(Math.max(modifier(scFp.Wisdom), modifier(scFp.Charisma)) / 2))
            : Math.max(1, Number(ag.amount) || 1);
          useHandler = () => update(title + " (+" + fpAmt + " Force points)", next => {
            if (canSpend) next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
            if (secondaryRes) next.spent[secondaryRes.id] = (next.spent[secondaryRes.id] || 0) + 1;
            next.forceUsed = Math.max(0, (next.forceUsed || 0) - fpAmt);
          });
        } else if (isRollHeal) {
          const qSc = effectiveScores(profile, session);
          const dieSides = ag.dieToken === "maDie" ? (traits.martialArtsDie || 4) : (Number(ag.dieSides) || 4);
          const qMod = ag.modAbility === "wisCha" ? Math.max(modifier(qSc.Wisdom), modifier(qSc.Charisma)) : 0;
          const qAbLabel = ag.modAbility === "wisCha" ? (modifier(qSc.Wisdom) >= modifier(qSc.Charisma) ? "Wisdom" : "Charisma") : "";
          const minHeal = Number.isFinite(ag.minHeal) ? ag.minHeal : 1;
          const costTag = hasPointCost ? (agCostAmt + " " + (agCostPool === "force" ? "Force" : agCostPool === "tech" ? "Tech" : "Focus")) : "";
          useHandler = event => {
            const {dialog, form, body, note, confirm} = createModalFrame(title, event?.currentTarget || null);
            confirm.textContent = costTag ? ("Heal & Spend " + costTag) : "Heal";
            note((costTag ? ("Spend " + costTag + " points to roll ") : "Roll ") + "1d" + dieSides + (qAbLabel ? (" and add your " + qAbLabel + " modifier (" + signed(qMod) + ", minimum " + minHeal + " HP total)") : "") + ".");
            const qMaxHP = hitPointMaximum(profile, session);
            const dieField = createDieRollField(body, {
              diceCount: 1,
              dieSides,
              modifier: qMod,
              modifierLabel: qAbLabel,
              unit: "HP",
              label: (ag.dieToken === "maDie" ? "Martial Arts die" : "Healing die") + " (1d" + dieSides + ")",
              impactPreview: (raw, total) => {
                if (!Number.isFinite(raw)) return "Current HP " + session.hp + "/" + qMaxHP + (costTag ? (" · Costs " + costTag) : "");
                const clamped = Math.max(minHeal, total);
                return "HP " + session.hp + " → " + Math.min(qMaxHP, session.hp + clamped) + " / " + qMaxHP + (costTag ? (" · Costs " + costTag) : "");
              },
              onChange: (raw, total) => {
                confirm.textContent = Number.isFinite(raw) ? ("Heal +" + Math.max(minHeal, total) + " HP" + (costTag ? (" (" + costTag + ")") : "")) : (costTag ? ("Heal & Spend " + costTag) : "Heal");
              }
            });
            form.addEventListener("submit", e => {
              e.preventDefault();
              const rawTotal = dieField.getTotal();
              if (!Number.isFinite(rawTotal)) return;
              const heal = Math.max(minHeal, rawTotal);
              dialog.close();
              update(title + " · +" + heal + " HP" + (costTag ? (" (" + costTag + ")") : ""), (next, prof) => {
                if (canSpend) next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                if (hasPointCost) {
                  if (agCostPool === "force") spendForcePoints(next, agCostAmt);
                  else if (agCostPool === "tech") spendTechPoints(next, agCostAmt);
                  else if (agCostPool === "focus") next.spent.focus = (next.spent.focus || 0) + agCostAmt;
                }
                recoverHP(next, heal, hitPointMaximum(prof, next));
              });
            });
            dialog.showModal();
            dieField.input.focus();
          };
        } else if (isRollTempExhaust) {
          const dieSides = Number(ag.dieSides) || 10;
          const clsMod = ag.modClassLevel ? ((typeof classLevelOf === "function" ? classLevelOf(profile, ag.modClassLevel) : 0) || profile.level || 1) : (profile.level || 1);
          const modLbl = ag.modClassLevel ? (ag.modClassLevel + " level") : "Level";
          useHandler = event => {
            const {dialog, form, body, note, confirm} = createModalFrame(title, event?.currentTarget || null);
            confirm.textContent = "Apply " + title;
            note("Reduce Exhaustion by 1, roll 1d" + dieSides + ", and add your " + modLbl.toLowerCase() + " (+" + clsMod + ") for temporary HP.");
            const dieField = createDieRollField(body, {
              diceCount: 1,
              dieSides,
              modifier: clsMod,
              modifierLabel: modLbl,
              unit: "temporary HP",
              label: title + " die (1d" + dieSides + ")",
              impactPreview: (raw, total) => total ? ("Temporary HP → " + Math.max(session.temp || 0, total) + " · Exhaustion −1") : ("Current temporary HP: " + (session.temp || 0)),
              onChange: (raw, total) => { confirm.textContent = total ? ("Apply +" + total + " temporary HP") : ("Apply " + title); }
            });
            form.addEventListener("submit", e => {
              e.preventDefault();
              const tempGain = dieField.getTotal();
              if (!Number.isFinite(tempGain)) return;
              dialog.close();
              update(title + " · −1 Exhaustion & +" + tempGain + " temporary HP", next => {
                if (canSpend) next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                next.exhaustion = Math.max(0, (next.exhaustion || 0) - 1);
                if (tempGain > (next.temp || 0)) { next.temp = tempGain; next.tempSource = title; }
              });
            });
            dialog.showModal();
            dieField.input.focus();
          };
        } else if (isPickNonProfSave) {
          useHandler = event => {
            const {dialog, form, note, confirm} = createModalFrame(title, event?.currentTarget || null);
            const auraRad = interp(ag.auraRadius || "{routineRadius}");
            confirm.textContent = "Set Routine";
            note(interp("Choose a non-proficient saving throw (+{halfProf}) and whether to apply it to yourself or allies within " + auraRad + " until the start of your next turn."));
            let chosenAb = activePickSaveEff?.choice || abilities.find(ab => !traits.savingThrows.has(ab)) || "Wisdom";
            let chosenTarget = activePickSaveEff?.targetScope || "self";
            const targetRow = appendText(form, "div", "");
            targetRow.className = "row wrap";
            const targetBtns = [
              ["self", "Self"],
              ["allies", "Allies (" + auraRad + ")"]
            ].map(([val, lbl]) => {
              const b = appendText(targetRow, "button", lbl);
              b.type = "button";
              b.className = "swPropChip";
              b.setAttribute("aria-pressed", String(val === chosenTarget));
              b.addEventListener("click", () => {
                chosenTarget = val;
                targetBtns.forEach(([v, el]) => el.setAttribute("aria-pressed", String(v === chosenTarget)));
              });
              return [val, b];
            });
            const pills = appendText(form, "div", "");
            pills.className = "row wrap";
            for (const ab of abilities) {
              const p = appendText(pills, "button", ab);
              p.type = "button";
              p.className = "swPropChip";
              p.setAttribute("aria-pressed", String(ab === chosenAb));
              p.addEventListener("click", () => {
                chosenAb = ab;
                for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === ab));
              });
            }
            const footer = form.querySelector("footer");
            form.insertBefore(targetRow, footer);
            form.insertBefore(pills, footer);
            if (activePickSaveEff) {
              const endBtn = appendText(footer, "button", "End Routine");
              endBtn.type = "button";
              endBtn.className = "danger";
              endBtn.addEventListener("click", () => {
                dialog.close();
                update("Ended " + title, next => {
                  next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(title));
                });
              });
            }
            form.addEventListener("submit", e => {
              e.preventDefault();
              dialog.close();
              const targetLabel = chosenTarget === "allies" ? ("Allies (" + auraRad + ")") : "Self";
              update(title + " · " + targetLabel + " · " + chosenAb + " saves", next => {
                next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(title));
                next.effects.push(conditionEntry(title, 1, false, {
                  id: newID(),
                  choice: chosenAb,
                  targetScope: chosenTarget,
                  auraRadius: auraRad,
                  note: interp("+{halfProf} to " + chosenAb + " saves"),
                  persistent: false,
                  ...agEffectMeta
                }));
              });
            });
            dialog.showModal();
          };
        } else if (hasPointCost && !canSpend && !ag.toggleEffect?.name) {
          const poolLabel = agCostPool === "force" ? "Force" : (agCostPool === "tech" ? "Tech" : "Focus");
          useHandler = () => update(title + " (" + agCostAmt + " " + poolLabel + (agCostAmt === 1 ? " point)" : " points)"), next => {
            if (agCostPool === "force") spendForcePoints(next, agCostAmt);
            else if (agCostPool === "tech") spendTechPoints(next, agCostAmt);
            else if (agCostPool === "focus") next.spent.focus = (next.spent.focus || 0) + agCostAmt;
          });
        } else if (isFreeClearConds) {
          useHandler = () => update(title + " (cleared " + clearConds.join("/") + ")", next => {
            next.effects = (next.effects || []).filter(e => !clearConds.some(c => normalizeName(c) === normalizeName(e.name)));
          });
        } else if (isHiddenToggle && !canSpend) {
          useHandler = () => toggleNamedEffect("Hidden", title);
        } else if (hasPointCost && canSpend && !ag.toggleEffect?.name && !ag.toggleMode) {
          const poolLabel = agCostPool === "force" ? "Force" : (agCostPool === "tech" ? "Tech" : "Focus");
          const spendPoolAndCap = (amt) => {
            const dicePart = ag.cost?.dicePerPoint ? (() => {
              const dm = String(ag.cost.dicePerPoint).match(/^(\d+)d(\d+)$/i);
              return dm ? (" (+" + (Number(dm[1]) * amt) + "d" + dm[2] + ")") : "";
            })() : "";
            update(title + " (" + amt + " " + poolLabel + (amt === 1 ? " point" : " points") + dicePart + ")", next => {
              if (agCostPool === "force") spendForcePoints(next, amt);
              else if (agCostPool === "tech") spendTechPoints(next, amt);
              else if (agCostPool === "focus") next.spent.focus = (next.spent.focus || 0) + amt;
              next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + amt;
            });
          };
          if (hasVariablePointCost) {
            useHandler = event => {
              const {dialog, form, body, note, confirm} = createModalFrame(title, event?.currentTarget || null);
              confirm.hidden = true;
              note("Choose how many " + poolLabel + " points to spend (" + pointPoolRem + " " + poolLabel + " points available · " + linkedRes.value + "/" + linkedRes.max + " cap remaining).");
              const optRow = appendText(body, "div", "");
              optRow.className = "row wrap";
              optRow.style.marginTop = "10px";
              for (let amt = agCostAmt; amt <= agCostMaxAmt; amt++) {
                const dicePart = ag.cost?.dicePerPoint ? (() => {
                  const dm = String(ag.cost.dicePerPoint).match(/^(\d+)d(\d+)$/i);
                  return dm ? (" (+" + (Number(dm[1]) * amt) + "d" + dm[2] + ")") : "";
                })() : "";
                const btn = appendText(optRow, "button", "Spend " + amt + " " + poolLabel + (amt === 1 ? " point" : " points") + dicePart);
                btn.type = "button";
                btn.className = amt === agCostAmt ? "primaryBtn" : "";
                const lacksPool = pointPoolRem < amt;
                const lacksCap = linkedRes.value < amt;
                btn.disabled = lacksPool || lacksCap;
                if (lacksPool) btn.title = "Needs " + amt + " " + poolLabel + " points (" + pointPoolRem + " left)";
                else if (lacksCap) btn.title = "Exceeds remaining cap (" + linkedRes.value + "/" + linkedRes.max + " left)";
                btn.addEventListener("click", () => {
                  dialog.close();
                  spendPoolAndCap(amt);
                });
              }
              dialog.showModal();
            };
          } else {
            useHandler = () => spendPoolAndCap(agCostAmt);
          }
        } else if (canSpend) {
          useHandler = isSurgeActive
            ? () => update("Ended " + title + " turn surge", next => {
                if (linkedEff.charges <= 0) {
                  next.effects = next.effects.filter(item => item.id !== linkedEff.id);
                  if (linkedEff.fromConcentration || normalizeName(next.concentration) === normalizeName(linkedEff.name)) next.concentration = "";
                } else {
                  const target = next.effects.find(item => item.id === linkedEff.id);
                  if (target) target.surgeActive = false;
                }
              })
            : (isApplyTempHPCon
              ? () => update("Used " + title, next => {
                  next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                  const amt = Math.max(1, modifier(effectiveScores(profile, session).Constitution));
                  if (amt > (next.temp || 0)) { next.temp = amt; next.tempSource = title; }
                })
            : (ag.effect === "Invisible"
              ? () => update("Used " + title + " (Invisible)", next => {
                  next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                  if (!next.effects.some(e => e.name === "Invisible")) {
                    next.effects.push(conditionEntry("Invisible", 1, false, { id: newID(), note: title, persistent: false, ...agEffectMeta }));
                  }
                })
            : (ag.effect === "dropTo1HP"
              ? () => update("Used " + title + " (Drop to 1 HP)", next => {
                  next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                  if ((next.hp || 0) <= 0) next.hp = 1;
                })
            : (clearConds.length
              ? () => update("Used " + title + " (cleared " + clearConds.join("/") + ")", next => {
                  next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                  next.effects = next.effects.filter(e => !clearConds.includes(e.name));
                })
            : (ag.toggleMode === "rage"
              ? () => update(session.rage ? ("Ended " + title) : ("Entered " + title), next => {
                  if (next.rage) { next.rage = null; }
                  else {
                    next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                    if (typeof endConcentration === "function") endConcentration(next);
                    else next.concentration = "";
                    next.rage = { frenzy: false, source: ag.source?.kind === "splashclassImprovement" ? "Splashclass" : (ag.source?.name || title) };
                  }
                })
            : (ag.toggleEffect?.name
              ? () => {
                  const tNames = [ag.toggleEffect.name, ...(ag.toggleEffect.aliases || [])].map(normalizeName);
                  const isOn = (session.effects || []).some(e => tNames.includes(normalizeName(e.name)));
                  update(isOn ? ("Ended " + ag.toggleEffect.name) : ("Activated " + ag.toggleEffect.name), next => {
                    if (next.effects.some(e => tNames.includes(normalizeName(e.name)))) {
                      next.effects = next.effects.filter(e => !tNames.includes(normalizeName(e.name)));
                    } else {
                      next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                      next.effects.push(conditionEntry(ag.toggleEffect.name, 1, false, { id: newID(), note: interp(ag.toggleEffect.note) || title, persistent: false, ...agEffectMeta }));
                    }
                  });
                }
              : (ag.activeEffect?.name
                ? () => update("Used " + title, next => {
                    next.spent[linkedRes.id] = (next.spent[linkedRes.id] || 0) + 1;
                    if (!next.effects.some(e => normalizeName(e.name) === normalizeName(ag.activeEffect.name))) {
                      next.effects.push(conditionEntry(ag.activeEffect.name, 1, false, {
                        id: newID(),
                        note: interp(ag.activeEffect.note) || title,
                        persistent: false,
                        ...agEffectMeta
                      }));
                    }
                  })
                : () => changePip(linkedRes.id, Math.max(0, linkedRes.value - 1)))))))));
        }
        const isToggleRage = ag.toggleMode === "rage";
        const toggleEffNames = ag.toggleEffect?.name ? [ag.toggleEffect.name, ...(ag.toggleEffect.aliases || [])].map(normalizeName) : [];
        const isToggleEffect = toggleEffNames.length > 0;
        const toggleActive = isToggleRage
          ? Boolean(session.rage)
          : (isToggleEffect ? (session.effects || []).some(e => toggleEffNames.includes(normalizeName(e.name))) : false);
        if (isToggleEffect && !useHandler) {
          useHandler = () => update(toggleActive ? ("Ended " + ag.toggleEffect.name) : ("Activated " + ag.toggleEffect.name), next => {
            if (next.effects.some(e => toggleEffNames.includes(normalizeName(e.name)))) {
              next.effects = next.effects.filter(e => !toggleEffNames.includes(normalizeName(e.name)));
            } else {
              if (hasPointCost && !canSpend) {
                if (agCostPool === "force") spendForcePoints(next, agCostAmt);
                else if (agCostPool === "tech") spendTechPoints(next, agCostAmt);
                else if (agCostPool === "focus") next.spent.focus = (next.spent.focus || 0) + agCostAmt;
              }
              next.effects.push(conditionEntry(ag.toggleEffect.name, 1, false, {
                id: newID(),
                note: interp(ag.toggleEffect.note) || title,
                ...(Number(ag.toggleEffect.maxValue) > 1 ? { maxValue: Number(ag.toggleEffect.maxValue) } : {}),
                persistent: false,
                ...agEffectMeta
              }));
            }
          });
        }
        const isResourceToggle = canSpend && (isToggleRage || isToggleEffect);
        const isFreeToggle = !canSpend && isToggleEffect;
        const heavyArmorBlocked = Boolean(ag.blockedByHeavyArmor && armor.heavy);
        const zoneBlocked = effectiveZone === "reaction" ? !canReact(session) : (effectiveZone === "special" ? false : blocked);
        const hasClearableCond = isFreeClearConds
          ? (session.effects || []).some(e => clearConds.some(c => normalizeName(c) === normalizeName(e.name)))
          : true;
        const isDisabled = (isSpendHitDie || isSpendHitDieClear)
          ? (zoneBlocked || (session.hitDice || 0) <= 0)
          : (isFreeClearConds ? (zoneBlocked || !hasClearableCond)
          : (isPickNonProfSave ? blocked
          : (isRollHeal ? (zoneBlocked || (canSpend && linkedRes.value <= 0) || (hasPointCost && pointPoolRem < agCostAmt))
          : (isRollTempExhaust ? (zoneBlocked || (canSpend && linkedRes.value <= 0))
          : ((isApplyTempHP || isRegainForce) ? (zoneBlocked || (canSpend && linkedRes.value <= 0) || (ag.secondaryResourceId && (!secondaryRes || secondaryRes.value <= 0)))
          : (isFreeToggle ? (toggleActive ? false : (zoneBlocked || (hasPointCost && pointPoolRem < agCostAmt)))
          : (isResourceToggle
            ? (toggleActive ? zoneBlocked : (zoneBlocked || heavyArmorBlocked || linkedRes.value <= 0))
          : (hasPointCost && canSpend && !isResourceToggle ? (zoneBlocked || linkedRes.value < agCostAmt || pointPoolRem < agCostAmt)
          : (hasPointCost && !canSpend ? (zoneBlocked || pointPoolRem < agCostAmt)
          : (isHiddenToggle && !canSpend ? zoneBlocked : (canSpend ? (isSurgeActive ? false : (zoneBlocked || linkedRes.value <= 0)) : (effectiveZone === "special" ? false : zoneBlocked))))))))))));
        const agTrigNote = Array.isArray(ag.turnTriggers) && ag.turnTriggers.length
          ? ag.turnTriggers.map(tr => interp(tr.note)).filter(Boolean).join(" · ")
          : "";
        const agCostWord = agCostPool === "force" ? "Force" : (agCostPool === "tech" ? "Tech" : "Focus");
        const agDur = typeof formatDurationSpec === "function" ? formatDurationSpec(ag.durationSpec) : "";
        const agInfoFacts = [
          ...(effectiveZone === "reaction" || ag.reactionKind ? [["Timing", formatReactionKindTiming(agReactKind) || "Reaction"]] : []),
          ...(agCadence ? [["Cadence", agCadence]] : []),
          ...(agDur ? [["Duration", agDur]] : []),
          ...(hasPointCost ? [["Cost", (hasVariablePointCost ? (agCostAmt + "–" + agCostMaxAmt + " " + agCostWord + " points") : (agCostAmt + " " + agCostWord + (agCostAmt === 1 ? " point" : " points")))]] : []),
          ...(agTrigNote ? [["Turn Trigger", agTrigNote]] : [])
        ];
        let finalExtras = extras;
        if (ag.targetScope === "selfOrAllies" && !isPickNonProfSave) {
          const activeScopeEff = (session.effects || []).find(e => normalizeName(e.name) === normalizeName(title));
          const curScope = activeScopeEff?.targetScope || "";
          const auraRad = interp(ag.auraRadius || "{routineRadius}");
          const makeScopeBtn = (scopeVal, btnLabel) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "swActionUseBtn";
            btn.textContent = btnLabel;
            btn.disabled = zoneBlocked;
            const isPressed = curScope === scopeVal;
            btn.setAttribute("aria-pressed", String(isPressed));
            btn.setAttribute("aria-label", (isPressed ? "End " : "Apply ") + title + " (" + btnLabel + ")");
            btn.addEventListener("click", () => {
              if (isPressed) {
                update("Ended " + title, next => {
                  next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(title));
                });
              } else {
                const noteStr = scopeVal === "allies"
                  ? interp(ag.allyNote || ("Allies within " + auraRad + ": " + title))
                  : interp(ag.selfNote || title);
                update(title + " (" + btnLabel + ")", next => {
                  next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(title));
                  next.effects.push(conditionEntry(title, 1, false, {
                    id: newID(),
                    targetScope: scopeVal,
                    auraRadius: auraRad,
                    note: noteStr,
                    persistent: false,
                    ...agEffectMeta
                  }));
                });
              }
            });
            return btn;
          };
          finalExtras = [...(Array.isArray(extras) ? extras : []), makeScopeBtn("self", "Self"), makeScopeBtn("allies", "Allies")];
          useHandler = null;
        }
        const entry = actionEntry(targetNode, title, heavyArmorBlocked && !toggleActive ? (subWithState + " · Blocked by heavy armor") : subWithState, {
          use: useHandler,
          disabled: isDisabled,
          pressed: (isFreeToggle || isResourceToggle) ? toggleActive : (isPickNonProfSave ? Boolean(activePickSaveEff) : (linkedEff?.perTurnCharges ? isSurgeActive : (isHiddenToggle && !canSpend ? hasEffect("Hidden") : undefined))),
          useLabel: (isFreeToggle || isResourceToggle) ? (toggleActive ? "End" : "Activate") : ((isSpendHitDie || isSpendHitDieClear) ? "Spend HD" : ((isApplyTempHP || isRollTempExhaust) ? "Apply" : ((isRegainForce || isRollHeal || (hasPointCost && canSpend && !isSurgeActive)) ? "Use" : (canSpend && !isSurgeActive ? "Spend" : undefined)))),
          extras: finalExtras,
          details: _lookupRuleDetails(srcName, ag.source?.kind, title, ag.summary, wsUpgradeFact ? [...agInfoFacts, wsUpgradeFact] : agInfoFacts, ag.source)
        });

      }
    }
  }

  if (freeWrap && free) {
    freeWrap.hidden = !free.childElementCount;
  }
}

function pips(resource, value, max, cls = "", labelOverride = "") {
  const humanLabel = labelOverride || resourceLabels[resource] || resource;
  if (max > 10) {
    const root = document.createElement("div");
    root.className = "resourcePoolControls";
    const label = humanLabel;
    for (const delta of [-5, -1, 1, 5]) {
      const target = clamp(value + delta, 0, max);
      const text = delta > 0 ? "+" + delta : "−" + Math.abs(delta);
      const btn = collectionButton(root, text, (delta > 0 ? "Add " : "Spend ") + Math.abs(delta) + " " + label, "resource", resource);
      btn.dataset.value = String(target);
      btn.disabled = target === value;
    }
    return root;
  }
  const root = document.createElement("div");
  root.className = "pips";
  for (let index = 1; index <= max; index++) {
    const next = index === value ? index - 1 : index;
    const title = "Set " + humanLabel + " to " + next + " of " + max;
    const button = collectionButton(root, "", title, "resource", resource);
    button.title = (index <= value ? "Filled · " : "Empty · ") + title;
    button.className = ["pip", index <= value ? "on" : "", cls].join(" ");
    button.dataset.value = next;
  }
  return root;
}

function manaResourceBlock(parent, res, tempRes) {
  const isForce = res.id === "forcePoints";
  const isFocus = res.id === "focus";
  const isSup = res.id === "superiority";
  const kindCls = isForce ? "is-force" : isFocus ? "is-focus" : isSup ? "is-superiority" : "is-tech";
  const unit = isForce ? "FP" : isFocus ? "Focus" : isSup ? "Dice" : "TP";
  const block = appendText(parent, "div", "");
  block.className = "resourceManaBlock " + kindCls;
  block.dataset.resourceBlock = res.id;

  const head = appendText(block, "div", "");
  head.className = "resourceManaHead";
  const nameEl = appendText(head, "span", res.label);
  nameEl.className = "resourceName";
  const rCode = isForce ? "LR" : "SR";
  const rTag = appendText(nameEl, "small", rCode);
  rTag.className = "resourceRecharge";
  rTag.title = isForce ? "Recharges on Long Rest" : "Recharges on Short or Long Rest";
  appendText(head, "b", res.value + " / " + res.max + " " + unit).className = "resourceCount";

  const bar = appendText(block, "div", "");
  bar.className = "manaBar " + kindCls;
  const fill = appendText(bar, "i", "");
  fill.style.width = (res.max > 0 ? Math.min(100, (res.value / res.max) * 100) : 0) + "%";

  if (tempRes && tempRes.value > 0) {
    const tempWrap = appendText(block, "div", "");
    tempWrap.className = "resourceTempWrap";
    const tempHead = appendText(tempWrap, "div", "");
    tempHead.className = "resourceTempHead";
    appendText(tempHead, "span", (isForce ? "Temporary Force: " : "Temporary Tech: ") + tempRes.value);
    const tCtrl = appendText(tempHead, "div", "");
    tCtrl.className = "resourceTempControls";
    const dec = collectionButton(tCtrl, "−1", "Spend 1 " + tempRes.label, "resource", tempRes.id);
    dec.dataset.value = String(Math.max(0, tempRes.value - 1));
    const clr = collectionButton(tCtrl, "Clear", "Clear " + tempRes.label, "resource", tempRes.id);
    clr.dataset.value = "0";
    const tBar = appendText(tempWrap, "div", "");
    tBar.className = "manaBar is-temp " + kindCls;
    const tFill = appendText(tBar, "i", "");
    tFill.style.width = Math.min(100, (tempRes.value / Math.max(1, res.max)) * 100) + "%";
  }

  const controls = appendText(block, "div", "");
  controls.className = "resourcePoolControls";
  for (const delta of [-5, -1, 1, 5]) {
    const target = clamp(res.value + delta, 0, res.max);
    const text = delta > 0 ? "+" + delta : "−" + Math.abs(delta);
    const btn = collectionButton(controls, text, (delta > 0 ? "Add " : "Spend ") + Math.abs(delta) + " " + res.label, "resource", res.id);
    btn.dataset.value = String(target);
    btn.disabled = target === res.value;
  }
}

function resourceRow(parent, id, label, value, max, cls = "", recharge = "") {
  const row = appendText(parent, "div", "");
  const isPool = max > 10;
  const isWrapped = !isPool && (max >= 5 || (max >= 3 && String(label || "").length > 18));
  row.className = isPool ? "resourceRow resourcePoolRow" : isWrapped ? "resourceRow resourceWrappedPips" : "resourceRow";
  const nameEl = appendText(row, "span", label);
  nameEl.className = "resourceName";
  const rCode = recharge === "short" ? "SR" : (recharge === "long" || recharge === "long-half") ? "LR" : recharge === "dawn" ? "Dawn" : (recharge === "trigger" || recharge === "effect" || recharge === "zeroMove" || recharge === "turn" || recharge === "special") ? "Trigger" : "";
  if (rCode) {
    const rTag = appendText(nameEl, "small", rCode);
    rTag.className = "resourceRecharge";
    rTag.title = rCode === "SR" ? "Recharges on Short or Long Rest" : rCode === "LR" ? "Recharges on Long Rest" : recharge === "zeroMove" ? "Recharges when you move 0 ft on a turn" : rCode === "Trigger" ? "Triggered or power-generated pool" : "Recharges at dawn";
  }

  if (isPool || isWrapped) {
    appendText(row, "b", value + "/" + max).className = "resourceCount";
    row.append(pips(id, value, max, cls, label));
  } else {
    row.append(pips(id, value, max, cls, label));
    appendText(row, "b", value + "/" + max).className = "resourceCount";
  }
}

function renderResources(profile, session) {
  const root = getElementById("resourceRows");
  root.replaceChildren();
  const allRes = characterResources(profile, session);
  const tempForceRes = allRes.find(r => r.id === "tempForce");
  const tempTechRes = allRes.find(r => r.id === "tempTech");
  const hasForcePool = allRes.some(r => r.id === "forcePoints");
  const hasTechPool = allRes.some(r => r.id === "techPoints");

  for (const res of allRes) {
    if (res.id === "hitDice") continue; // Kincaid parity: Hit Dice live in Short/Long Rest & Hit-Die dialogs
    if (res.id === "tempForce" && (hasForcePool || res.value <= 0)) continue;
    if (res.id === "tempTech" && (hasTechPool || res.value <= 0)) continue;
    if (res.id === "forcePoints") {
      manaResourceBlock(root, res, tempForceRes);
    } else if (res.id === "techPoints") {
      manaResourceBlock(root, res, tempTechRes);
    } else if (res.id === "focus" || (res.id === "superiority" && res.max > 10)) {
      manaResourceBlock(root, res, null);
    } else {
      resourceRow(root, res.id, res.label, res.value, res.max, '', res.resetOn || res.recharge || (String(res.id).startsWith('effCharge:') ? 'trigger' : ''));
    }
  }
  if (!root.children.length) {
    appendText(root, "p", "No finite rest resources — spend Hit Dice via Short rest.").className = "muted";
  }
  const death = getElementById("deathPips");
  death.replaceChildren();
  const hpEffDeath = typeof resolveHpEffects === "function" ? resolveHpEffects(profile, session) : null;
  if (hpEffDeath && hpEffDeath.deathSaveBonus) {
    const dMod = appendText(death, "p", "Death save bonus: " + signed(hpEffDeath.deathSaveBonus) + " (" + hpEffDeath.deathSaveSources.join(", ") + ")");
    dMod.className = "muted";
  }
  resourceRow(death, "successes", "Successes", session.death.successes, 3, "success");
  resourceRow(death, "failures", "Failures", session.death.failures, 3, "failure");
}

function changePip(id, value) {
  const undoLabel = id.startsWith("hitDice:") ? ("Hit Dice (" + id.slice("hitDice:".length) + ")") : (resourceLabels[id] || id);
  update("Updated " + undoLabel, (session, profile) => {
    const resources = characterResources(profile, session);
    const res = resources.find(r => r.id === id);
    if (id.startsWith("effCharge:")) {
      const effId = id.slice("effCharge:".length);
      const target = (session.effects || []).find(e => e.id === effId);
      if (target) {
        const prev = Number(target.charges) || 0;
        const maxC = Number(target.chargesMax) || 1;
        target.charges = clamp(value, 0, maxC);
        if (target.perTurnCharges) {
          if (target.charges < prev) target.surgeActive = true;
          else if (target.charges >= maxC) target.surgeActive = false;
        }
        if (!target.perTurnCharges && target.charges <= 0) {
          session.effects = session.effects.filter(e => e.id !== effId);
          if (target.fromConcentration || normalizeName(session.concentration) === normalizeName(target.name)) session.concentration = "";
        }
      }
    } else if (id.startsWith("hitDice:")) {
      const dieKey = id.slice("hitDice:".length);
      const st = typeof hitDiceState === "function" ? hitDiceState(profile, session) : null;
      const pool = st?.pools?.find(p => p.key === dieKey);
      if (pool) {
        if (!session.hitDiceByDie || typeof session.hitDiceByDie !== "object") session.hitDiceByDie = {};
        session.hitDiceByDie[dieKey] = clamp(value, 0, pool.max);
        syncHitDiceTotal(session, profile);
      }
    } else if (id === "hitDice") {
      session.hitDice = clamp(value, 0, profile.level);
      if (typeof hitDiceState === "function") {
        const st = hitDiceState(profile, session);
        if (st.pools.length === 1) {
          session.hitDiceByDie = { [st.pools[0].key]: clamp(value, 0, st.pools[0].max) };
        }
      }
    }
    else if (id === "successes" || id === "failures") session.death[id] = clamp(value, 0, 3);
    else if (id === "forcePoints" && res) session.forceUsed = clamp(res.max - value, 0, res.max);
    else if (id === "techPoints" && res) session.techUsed = clamp(res.max - value, 0, res.max);
    else if (id === "tempForce") session.tempForce = Math.max(0, value);
    else if (id === "tempTech") session.tempTech = Math.max(0, value);
    else if (id === "superiority" && res) session.superiorityUsed = clamp(res.max - value, 0, res.max);
    else if (id.startsWith("hlc:")) {
      const key = id.slice(4);
      if (!session.highLevelCasting) session.highLevelCasting = {level4: false, level5: false, level6: false, level7: false, level8: false, level9: false};
      session.highLevelCasting[key] = value === 0;
    } else if (res) {
      session.spent[id] = clamp(res.max - value, 0, res.max);
    }
  });
}

function renderPopoverRefList(container, items, hintText = "Select an option to read its SW5e rule.") {
  const wrap = appendText(container, "div", "");
  wrap.className = "popoverRefList";
  const chips = appendText(wrap, "div", "");
  chips.className = "popoverRefChips";
  const detail = appendText(wrap, "div", "");
  detail.className = "popoverRefDetail";
  const hint = appendText(detail, "p", hintText);
  hint.className = "popoverRefHint muted";

  let activeIdx = -1;
  const btns = [];
  const select = idx => {
    activeIdx = activeIdx === idx ? -1 : idx;
    btns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === activeIdx)));
    detail.replaceChildren();
    if (activeIdx < 0) {
      const h = appendText(detail, "p", hintText);
      h.className = "popoverRefHint muted";
    } else {
      const item = items[activeIdx];
      appendText(detail, "b", item.name).className = "popoverRefDetailTitle";
      const body = appendText(detail, "div", "");
      body.className = "popoverRefBody";
      appendInlineRules(body, item.text);
    }
  };
  items.forEach((item, idx) => {
    const btn = appendText(chips, "button", item.name);
    btn.type = "button";
    btn.className = "popoverRefChip";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => select(idx));
    btns.push(btn);
  });
}

function showStandardActionsDialog(trigger = getElementById("openStandardActions")) {
  const items = [
    { name: "Attack", text: "Make one melee or ranged weapon attack (or more with **Extra Attack**). You can replace any melee attack with a **Grapple** or **Shove**." },
    { name: "Cast a Power", text: "Cast a known Force or Tech power with a casting time of **1 action**. At-will powers cost 0 points; leveled powers cost **1 + power level** points." },
    { name: "Dash", text: "Gain extra movement equal to your current speed for this turn (after applying any speed modifiers)." + (app.character && typeof resolveDefenseEffects === "function" && resolveDefenseEffects(app.character.profile, app.character.session).combatTraits.some(ct => ct.kind === "mobileSkirmish") ? " (**Mobile:** difficult terrain does not cost extra movement on this turn.)" : "") },
    { name: "Disengage", text: "Your movement does not provoke opportunity attacks for the rest of this turn." },
    { name: "Dodge", text: "Until the start of your next turn, attack rolls against you have **disadvantage** if you can see the attacker, and you have **advantage** on Dexterity saving throws (ends if incapacitated or speed drops to 0)." },
    { name: "Guard", text: "Choose an ally within 5 feet. Until the start of your next turn, attack rolls against that ally have **disadvantage** if you can see the attacker. If an attack would hit them, you can instead take the hit yourself (no action) for maximum damage." },
    { name: "Help", text: "Give an ally **advantage** on their next ability check, or distract a creature within 5 feet so the next attack roll against it before your next turn has advantage." },
    { name: "Hide", text: "Make a Dexterity (Stealth) check to become hidden from creatures that cannot see you clearly." },
    { name: "Ready", text: "Prepare an action (or move up to your speed) to trigger as a **reaction** when a specified circumstance occurs before the start of your next turn." },
    { name: "Search", text: "Devote your attention to finding something with a Wisdom (Perception) or Intelligence (Investigation) check." },
    { name: "Use an Object", text: "Interact with a second object on your turn (your first simple object interaction is free) or use an item that requires an action." },
    { name: "Grapple & Shove", text: "Replace one melee attack with a **Grapple** (Athletics contested by target's Athletics or Acrobatics) or **Shove** (Athletics contested to knock prone or push 5 ft)." }
  ];
  showMathPopover(trigger, "Standard Actions", [], "", [], null, pop => renderPopoverRefList(pop, items, "Select an action to view its SW5e rule."));
}

function showBonusActionInfoDialog(trigger = getElementById("openBonusActionInfo")) {
  const items = [
    { name: "One Bonus Action", text: "You can take a bonus action only when a feature, power, weapon property, or customization says so—at most **one** per turn." },
    { name: "Two-Weapon Fighting", text: "After taking the Attack action with a **light** weapon in one hand, use a bonus action to attack with a different **light** weapon in your other hand (no ability modifier on the **damage roll** unless negative)." },
    { name: "Double-Weapon Fighting", text: "After taking the Attack action with a **light** and **double** weapon in two hands, use a bonus action to attack with the other end (no ability modifier on the **attack roll** unless negative)." },
    { name: "Bonus Action Powers", text: "If you cast a Force or Tech power with a casting time of 1 bonus action, you can't cast another power during the same turn except an **at-will** power with a casting time of 1 action." }
  ];
  showMathPopover(trigger, "Bonus Actions", [], "", [], null, pop => renderPopoverRefList(pop, items, "Select a topic to view its SW5e rule."));
}

function showQuickReferenceDialog() {
  const rulesText = [
    "### Cover (SW5e 4-Tier System)",
    "- **One-quarter cover**: +2 bonus to AC and Dexterity saving throws (at least 1/4 obstructed).\n- **Half cover**: **+3 bonus** to AC and Dexterity saving throws (at least 1/2 obstructed — note: higher than D&D 5e's +2).\n- **Three-quarters cover**: +5 bonus to AC and Dexterity saving throws (at least 3/4 obstructed).\n- **Full cover**: Can't be targeted directly by an attack or power.",
    "### Creature Size",
    "| Size | Space | Carry Multiplier | Heavy Weapons |\n| --- | --- | --- | --- |\n| Tiny | 2½ × 2½ ft | ×0.5 | Disadvantage |\n| Small | 5 × 5 ft | ×1 | Disadvantage |\n| Medium | 5 × 5 ft | ×1 | Normal |\n| Large | 10 × 10 ft | ×2 | Normal |\n| Huge | 15 × 15 ft | ×4 | Normal |\n| Gargantuan | 20 × 20 ft+ | ×8 | Normal |\nYou can grapple or shove targets up to **one size larger** than you, and squeeze through spaces one size smaller (2× movement cost, disadvantage on attacks & DEX saves, attacks against you have advantage).",
    "### Two-Weapon vs. Double-Weapon Fighting",
    "- **Two-Weapon Fighting**: Any two **light** weapons (melee or ranged blasters). Bonus action attack omits your ability modifier from the **damage roll** (unless negative).\n- **Double-Weapon Fighting**: A weapon with **light** and **double** wielded in two hands. Bonus action attack with the other end omits your ability modifier from the **attack roll** (unless negative).",
    "### Concentration",
    "You can concentrate on only **one** power at a time. When you take damage while concentrating, make a Constitution saving throw with **DC 10 or half the damage taken** (whichever is higher). Being Incapacitated or casting another concentration power ends it immediately.",
    "### Short Rest vs. Long Rest",
    "- **Short Rest** (at least 1 hour): Spend Hit Dice (+ Constitution modifier each) to regain HP; recover short-rest (SR) features, Tech Points, Superiority Dice, and Focus Points.\n- **Long Rest** (at least 8 hours): Regain all lost HP, up to half your maximum Hit Dice (minimum 1), Force Points, and all short/long-rest (LR) features.",
    "### Dropping to 0 HP & Death Saves",
    "At 0 HP you fall Unconscious (unless remaining damage ≥ Max HP, causing Instant Death). At the start of each turn at 0 HP, roll 1d20 (DC 10): 3 successes stabilize you; 3 failures kill you. Natural 20 restores 1 HP; natural 1 counts as 2 failures; taking damage at 0 HP adds 1 failure (2 on a crit)."
  ].join("\n\n");
  showInfo("SW5e Quick Reference", [["Source", "SW5e Player's Handbook Ch. 7–9"]], rulesText);
}

function showReactionInfoDialog(trigger = getElementById("openReactionInfo")) {
  const items = [
    { name: "One Reaction", text: "An instant response to a trigger on your turn or another creature's. Once used, you can't take another reaction until the **start of your next turn**." },
    { name: "Opportunity Attack", text: "When a hostile creature you can see moves out of your reach, use your reaction to make one melee attack against it right before it leaves your reach." },
    { name: "Ready & Powers", text: "Triggers set with the **Ready** action, plus powers and features with a **Reaction** timing (such as *Saber Reflect*, *Force Shield*, or *Uncanny Dodge*), consume your reaction." }
  ];
  showMathPopover(trigger, "Reactions", [], "", [], null, pop => renderPopoverRefList(pop, items, "Select a topic to view its SW5e rule."));
}


function showWeaponMathPopover(trigger, name, stats, profile, session, item = null) {
  const profPart = stats.proficient ? signed(profile.proficiency) + " proficiency" : "not proficient";
  const abPart = signed(stats.abilityMod || 0) + " " + (stats.ability || "Strength");
  const extraHit = stats.toHit - (stats.abilityMod || 0) - (stats.proficient ? profile.proficiency : 0);
  const hitParts = [abPart, stats.proficient ? signed(profile.proficiency) + " proficiency" : ""];
  if (extraHit) hitParts.push(signed(extraHit) + " bonus");

  const dmgBase = (stats.dice && stats.die) ? (stats.dice + "d" + stats.die) : "1";
  const extraDmg = (stats.bonus || 0) - (stats.abilityMod || 0);
  const dmgParts = [dmgBase, stats.abilityMod ? signed(stats.abilityMod) + " " + (stats.ability || "Strength") : ""];
  if (extraDmg) dmgParts.push(signed(extraDmg) + " bonus");

  // Deduplicate and clean raw engine formula notes
  const cleanNotes = [];
  const seen = new Set();
  for (const n of (stats.notes || [])) {
    const s = String(n || "").trim();
    if (!s || /max\(|floor\(/i.test(s)) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    cleanNotes.push(s);
  }

  const abShort = (stats.ability || "Strength").slice(0, 3).toUpperCase();
  const atkTerms = Array.isArray(stats.attackBreakdown) && stats.attackBreakdown.length
    ? stats.attackBreakdown.map(t => ({ label: t.label, value: signed(t.value), signed: true, ...(t.source ? { source: t.source } : {}) }))
    : [
        { label: abShort, value: signed(stats.abilityMod || 0), signed: true },
        ...(stats.proficient ? [{ label: "Prof", value: signed(profile.proficiency), signed: true }] : []),
        ...(extraHit ? [{ label: "Modifier", value: signed(extraHit), signed: true }] : [])
      ];
  const dmgTerms = [{ value: dmgBase, raw: true }];
  if (Array.isArray(stats.damageBreakdown) && stats.damageBreakdown.length) {
    for (const t of stats.damageBreakdown) {
      if (t.value) dmgTerms.push({ label: t.label, value: signed(t.value), signed: true, ...(t.source ? { source: t.source } : {}) });
    }
  } else {
    if (stats.abilityMod) dmgTerms.push({ label: abShort, value: signed(stats.abilityMod), signed: true });
    if (extraDmg) dmgTerms.push({ label: "Modifier", value: signed(extraDmg), signed: true });
  }
  const weaponFormulas = [
    ...(!stats.weaponProperties?.restriction ? [{
      label: "Attack",
      rule: "1d20 + Ability + Prof (if prof) + Bonuses",
      terms: atkTerms,
      total: signed(stats.toHit)
    }] : []),
    {
      label: "Damage",
      rule: "Weapon Dice + Ability + Bonuses",
      terms: dmgTerms,
      total: damageNotation(stats)
    }
  ];
  const wRule = item ? activeWeaponRule(item).rule : null;
  const wProps = (wRule?.properties || []).filter(p => p && p !== "—");
  const props = stats.weaponProperties;
  const propKeys = new Set(wProps.map(p => normalizeName(p)));
  const concentrationOutcome = props?.outcomes.find(effect => effect.params.trigger === "concentrationSave");
  const filteredNotes = cleanNotes.filter(n => !propKeys.has(normalizeName(n)) && !/^not proficient$/i.test(n));
  const extraContent = (wProps.length && typeof buildPropertyChips === "function") ? (pop => {
    const propWrap = appendText(pop, "div", "");
    propWrap.className = "weaponPopoverProps";
    if (props?.illumination) {
      const { bright, dim } = props.illumination;
      appendText(propWrap, "p", "While activated: " + (bright ? bright + " ft bright light plus " : "") + dim + " ft dim light");
    }
    if (props?.light?.suppress) appendText(propWrap, "p", "Luminous suppressed");
    for (const effect of props?.outcomes || []) {
      appendText(propWrap, "p", effect.property + " · " + weaponOutcomeSummary(effect, stats));
    }
    if (concentrationOutcome) {
      const label = appendText(propWrap, "label", "Damage taken ");
      const input = appendText(label, "input", "");
      input.type = "number";
      input.min = "1";
      input.step = "1";
      const output = appendText(propWrap, "p", "");
      output.setAttribute("aria-live", "polite");
      input.addEventListener("input", () => {
        const dc = weaponConcentrationDC(concentrationOutcome.params, input.valueAsNumber);
        output.textContent = dc == null ? "" : "Constitution save DC " + dc;
      });
    }
    const propDetail = document.createElement("div");
    propDetail.className = "swPropDetail";
    propDetail.hidden = true;
    const chips = buildPropertyChips(wProps, wRule?.category || "Weapon", propDetail, props?.light);
    if (chips) {
      propWrap.append(chips, propDetail);
    }
  }) : null;
  const popActions = wRule ? [{ label: "Full weapon rules", cls: "fullRulesBtn", onClick: () => showItem(item?.name || wRule.name || name, item) }] : [];
  let wepMinFact = "";
  if (stats.minRollPerDie > 0) {
    const condPrefix = stats.minRollCondition ? (stats.minRollCondition + ": ") : "";
    const minStr = condPrefix + (typeof formatDiceWithMin === "function" ? formatDiceWithMin(stats.dice, stats.die, stats.minRollPerDie) : ("min " + stats.minRollPerDie + "/die")) + (stats.minRollTotal ? (" (min " + stats.minRollTotal + " total)") : "");
    if (stats.minRollSource && typeof createRuleLink === "function") {
      const wrap = document.createElement("span");
      wrap.append(document.createTextNode(minStr + " · "), createRuleLink(stats.minRollSource, stats.minRollSource, { profile, session }));
      wepMinFact = wrap;
    } else {
      wepMinFact = minStr + (stats.minRollSource ? (" (" + stats.minRollSource + ")") : "");
    }
  }
  showMathPopover(trigger, name + " calculation", [
    ["Proficiency", stats.proficient ? "" : "Not proficient"],
    ["Minimum roll", wepMinFact],
    ["Crit range", stats.critMin && stats.critMin < 20 ? stats.critMin + "–20" : ""],
    ["Crit bonus", stats.critDice > 0 ? "+" + stats.critDice + " extra weapon " + (stats.critDice === 1 ? "die" : "dice") : ""]
  ], filteredNotes.join(" · "), popActions, weaponFormulas, extraContent);
}

function openZeroHpStopperDialog(promptData, trigger = null) {
  const stoppers = Array.isArray(promptData) ? promptData : promptData?.stoppers;
  const preState = Array.isArray(promptData) ? null : promptData?.preState;
  if (!Array.isArray(stoppers) || !stoppers.length) return;
  const {dialog, form, note, confirm} = createModalFrame("Reduced to 0 HP", trigger);
  note("You dropped to 0 HP. Activate a reduced-to-0 HP feature to drop to 1 HP instead, or stay at 0 HP.");
  let selectedIdx = 0;
  const list = appendText(form, "div", "");
  list.className = "stack";
  const radios = stoppers.map((s, idx) => {
    const btn = appendText(list, "button", "");
    btn.type = "button";
    btn.className = "swPropChip";
    btn.setAttribute("aria-pressed", String(idx === selectedIdx));
    let costTag = "";
    if (s.saveDCBase) costTag = " · DC " + s.currentSaveDC + " " + (s.saveAbility || "Constitution") + " save";
    else if (s.pointPool) costTag = " · " + (s.pointCost === "all" ? ("All " + s.availablePoints) : s.pointCost) + " " + s.pointPool.charAt(0).toUpperCase() + s.pointPool.slice(1) + " pt" + (s.pointCost === 1 ? "" : "s");
    else if (s.consumeEffect) costTag = " · Ends " + s.consumeEffect;
    btn.textContent = s.name + costTag;
    btn.addEventListener("click", () => {
      selectedIdx = idx;
      radios.forEach((b, i) => b.setAttribute("aria-pressed", String(i === selectedIdx)));
    });
    return btn;
  });
  const footer = form.querySelector("footer");
  form.insertBefore(list, footer);
  confirm.type = "submit";
  confirm.textContent = "Drop to 1 HP";
  form.addEventListener("submit", e => {
    e.preventDefault();
    const s = stoppers[selectedIdx];
    dialog.close();
    if (!s) return;
    update("Used " + s.name + " (dropped to 1 HP)", next => {
      next.hp = 1;
      if (preState?.rage && !next.rage) next.rage = { ...preState.rage };
      if (preState?.concentration && !next.concentration) next.concentration = preState.concentration;
      next.spent = next.spent || {};
      if (s.resourceId) next.spent[s.resourceId] = (next.spent[s.resourceId] || 0) + 1;
      if (s.saveCountKey) next.spent[s.saveCountKey] = (next.spent[s.saveCountKey] || 0) + 1;
      if (s.consumeEffect) next.effects = (next.effects || []).filter(ef => normalizeName(ef.name) !== normalizeName(s.consumeEffect));
      if (s.pointPool) {
        const spendAmt = s.pointCost === "all" ? (Number(s.availablePoints) || 0) : (Number(s.pointCost) || 1);
        if (s.pointPool === "force") next.spent.forcePoints = (next.spent.forcePoints || 0) + spendAmt;
        else if (s.pointPool === "tech") next.spent.techPoints = (next.spent.techPoints || 0) + spendAmt;
        else if (s.pointPool === "focus") next.spent.focus = (next.spent.focus || 0) + spendAmt;
      }
    });
  });
  dialog.showModal();
}
