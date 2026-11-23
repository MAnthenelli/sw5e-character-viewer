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
  techieRepairDroid: "Repair Droid (Techie)",
  luck: "Luck Points",
  hitDice: "Hit Dice",
  successes: "Death save successes",
  failures: "Death save failures"
};

const isIncapacitated = session => conditionState(session).incapacitated;
const hasFanatic = session => hasFeat(session, "Fanatic");
const canAct = session => !isIncapacitated(session);
const canReact = session => !isIncapacitated(session) && !conditionState(session).noReactions;

function attackMode(session, stats, phase) {
  const prof = typeof app !== "undefined" ? app?.character?.profile : null;
  const c = conditionState(session, prof);
  const effMods = prof ? activeEffectModifiers(prof, session) : {};
  const advSources = [];
  if (c.invisible) advSources.push("Invisible");
  if (phase !== "reaction" && session.reckless && stats.melee && stats.ability === "Strength") advSources.push("Reckless Attack");
  if (effMods.allAttackAdv) advSources.push("Active power");
  if (stats.melee && effMods.meleeWeaponAdv) advSources.push("Rage (Force)");
  if (effMods.feintingAttackAdv) advSources.push("Feinting Attack");
  if ((session.effects || []).some(e => normalizeName(e.name) === "steady aim")) advSources.push("Steady Aim");
  const disSources = [
    stats.disadvantage && "Weapon requirement",
    c.exhaustion >= 3 && "Exhaustion",
    c.blinded && "Blinded",
    c.poisoned && "Poisoned",
    c.frightened && "Frightened",
    c.prone && stats.melee && "Prone",
    c.restrained && "Restrained",
    effMods.allAttackDisadv && "Active power",
    stats.armorPenalty && "Armor proficiency"
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
  if (session.rage || (session.spent.rage || 0) >= profile.rageMax || !canAct(session) || armorStats(profile, session).heavy) return;
  update(frenzied ? "Entered Frenzy" : "Entered Rage", next => {
    next.spent.rage = (next.spent.rage || 0) + 1;
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

function toggleNamedEffect(effectName, noteText = "") {
  const active = (app.character.session.effects || []).some(e => normalizeName(e.name) === normalizeName(effectName));
  update((active ? "Ended " : "Activated ") + effectName, next => {
    if (active) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(effectName));
    } else {
      next.effects.push(conditionEntry(effectName, 1, false, {id: newID(), note: noteText, persistent: false}));
    }
  });
}

function openDeflectionDialog(trigger) {
  const {profile, session} = app.character;
  const casting = castingStats(profile, session);
  const step = classLevelStep(profile);
  const dieText = step["Kinetic Combat"] || "1d4";
  const dieSides = parseNumericStat(dieText.replace(/^1d/i, "")) || 4;
  if (casting.forceTotalRemaining < 1) return;
  const {dialog, form, body, note, confirm} = createModalFrame("Force-Empowered Self: Deflection", trigger);
  confirm.textContent = "Spend 1 Force Point";
  note("No action required (when targeted by an attack): spend 1 Force Point and roll your Kinetic Combat die (" + dieText + ") to add to your AC.");
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides,
    unit: "AC",
    label: "Kinetic Combat die roll (" + dieText + ")"
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const bonus = dieField.getRaw();
    if (!Number.isFinite(bonus)) return;
    dialog.close();
    update("Force-Empowered Self: Deflection (+" + bonus + " AC)", next => {
      spendForcePoints(next, 1);
      next.effects = next.effects.filter(e => normalizeName(e.name) !== "force-empowered self: deflection");
      next.effects.push(conditionEntry("Force-Empowered Self: Deflection", bonus, false, {id: newID(), note: "+" + bonus + " AC", persistent: false}));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openSlowTimeDialog(trigger) {
  const {profile, session} = app.character;
  const casting = castingStats(profile, session);
  const step = classLevelStep(profile);
  const dieText = step["Kinetic Combat"] || "1d4";
  const dieSides = parseNumericStat(dieText.replace(/^1d/i, "")) || 4;
  if (casting.forceTotalRemaining < 1) return;
  const {dialog, form, body, note, confirm} = createModalFrame("Force-Empowered Self: Slow Time", trigger);
  confirm.textContent = "Spend 1 Force Point";
  note("No action required (when you move on your turn): spend 1 Force Point and roll your Kinetic Combat die (" + dieText + ") to increase your speed by 5 × the amount rolled until the end of your turn.");
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides,
    multiplier: 5,
    unit: "ft speed",
    label: "Kinetic Combat die roll (" + dieText + ")"
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const feet = dieField.getTotal();
    if (!Number.isFinite(feet)) return;
    dialog.close();
    update("Force-Empowered Self: Slow Time (+" + feet + " ft)", next => {
      spendForcePoints(next, 1);
      next.effects = next.effects.filter(e => normalizeName(e.name) !== "force-empowered self: slow time");
      next.effects.push(conditionEntry("Force-Empowered Self: Slow Time", feet, false, {id: newID(), note: "+" + feet + " ft speed", persistent: false}));
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function openSecondWindDialog(trigger) {
  const {profile} = app.character;
  const {dialog, form, body, note, confirm} = createModalFrame("Second Wind", trigger);
  confirm.textContent = "Heal & spend use";
  note("Bonus action (once per short rest): roll 1d10 and add your fighter level (+" + profile.level + ") to regain hit points.");
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: 10,
    modifier: profile.level,
    modifierLabel: "Level",
    unit: "HP",
    label: "Die roll (1d10)"
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
  const durable = hasFeat(session, "Durable");
  const minFloor = durable ? Math.max(2, 2 * conMod) : 0;
  const {dialog, form, body, note, confirm} = createModalFrame(title, trigger);
  confirm.textContent = "Spend 1 Hit Die & Heal";
  note(timingLabel + " · Spend 1 Hit Die (" + hdLeft + "/" + profile.level + " d" + dieSize + " left) to roll 1d" + dieSize + " and add your Constitution modifier (" + signed(conMod) + ")" + (durable ? " (Durable minimum " + minFloor + ")." : "."));
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: dieSize,
    modifier: conMod,
    modifierLabel: "Constitution",
    minFloor,
    unit: "HP",
    label: "Hit Die roll (1d" + dieSize + ")"
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const amount = dieField.getTotal();
    if (!Number.isFinite(amount)) return;
    dialog.close();
    update(title + " · Spent 1 Hit Die (+" + amount + " HP)", (next, prof) => {
      next.hitDice = Math.max(0, (next.hitDice || 0) - 1);
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
  const dieField = createDieRollField(body, {
    diceCount,
    dieSides,
    modifier: flatAdd,
    unit,
    label: "Die roll (" + diceCount + "d" + dieSides + ")"
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
  if (c.immunities.has("all damage") || (typeof type === "string" && type && c.immunities.has(type))) return;
  const effMods = activeEffectModifiers(profile, session);
  const resList = resistanceNames(profile, session);
  const hasAllRes = resList.includes("all") || (resList.includes("all (except psychic)") && type !== "psychic") || (resList.includes("all (except force)") && type !== "force");
  let resisted = type === true || hasAllRes || (typeof type === "string" && type && (c.petrified || resList.includes(type)));
  let total = amount + (weapon ? c.corroded : 0);

  // Defense Mastery & Absorptive armor/shield: reduce weapon damage (floor 1)
  if (weapon) {
    const tr = characterTraits(profile, session);
    const arm = armorStats(profile, session);
    let wepRed = 0;
    if (tr.medHeavyArmorDmgReduction && arm.armor && (arm.armor.armor === "Medium" || arm.armor.armor === "Heavy") && !arm.nonproficient) {
      wepRed += tr.medHeavyArmorDmgReduction;
    }
    if (arm.absorptive > 0) wepRed += arm.absorptive;
    if (wepRed > 0) total = Math.max(1, total - wepRed);
  }
  // Soresu Form: first kinetic, energy, or ion weapon hit before end of next turn is halved
  if (weapon && !resisted && ["kinetic", "energy", "ion"].includes(type)) {
    const soresuEntry = (session.effects || []).find(e => normalizeName(e.name) === "soresu form" && !e.soresuUsed);
    if (soresuEntry) {
      resisted = true;
      soresuEntry.soresuUsed = true;
    }
  }
  const vulnList = defenseProfile(profile, session).vulnerabilities || [];
  const vulnerable = typeof type === "string" && type && vulnList.includes(type);
  // SW5e PHB Ch. 9: Resistance & vulnerability apply AFTER passive modifiers (Defense Mastery, Absorptive, Corroded) and BEFORE active modifiers (Parry, Adrenaline Hit)
  let applied = resisted ? Math.floor(total / 2) : total;
  if (vulnerable) applied = applied * 2;
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
  if (!session.temp) session.tempSource = "";
  if (session.hp === 0 && applied > absorbed) {
    session.death = {successes: session.death.successes === 3 ? 0 : session.death.successes, failures: Math.min(3, session.death.failures + 1)};
  }
  session.hp = Math.max(0, session.hp - (applied - absorbed));
  if (!session.hp && (session.effects || []).some(e => normalizeName(e.name) === "kolto reserve")) {
    session.hp = 1;
    session.effects = session.effects.filter(e => normalizeName(e.name) !== "kolto reserve");
  }
  const hasControlPain = (session.effects || []).some(e => normalizeName(e.name) === "control pain");
  if (!session.hp && !hasControlPain) {
    endRage(session);
    if (typeof endConcentration === "function") endConcentration(session);
    else session.concentration = "";
  }
}

function recoverHP(session, amount, maximum) {
  const c = conditionState(session);
  if (c.dead || c.noHealing) return;
  session.hp = Math.min(maximum, session.hp + (conditionState(session).weakened ? Math.floor(amount / 2) : amount));
  if (session.hp > 0) {
    session.death = {successes: 0, failures: 0};
  }
}

function actionEntry(parent, name, text, options = {}) {
  const entry = appendText(parent, "div", "");
  entry.className = "swAction";
  const controls = appendText(entry, "div", "");
  controls.className = "row wrap swActionControls";
  if (options.use) {
    const button = appendText(controls, "button", name);
    button.type = "button";
    button.disabled = Boolean(options.disabled);
    if (options.pressed !== undefined) button.setAttribute("aria-pressed", String(options.pressed));
    button.addEventListener("click", options.use);
  } else appendText(controls, "b", name);
  if (options.extras) {
    for (const extra of options.extras) controls.append(extra);
  }
  if (options.details) infoButton(controls, name, options.details);
  if (text) {
    const line = appendText(entry, "small", text);
    line.className = "muted";
    if (options.mode) displayRollBadge(line, options.mode.advantage, options.mode.disadvantage);
  }
  return entry;
}

function verifiedOptionTiming(rule) {
  return rule?.mechanics?.timing || "";
}

function resolveActiveManeuvers(maneuverNames, sup) {
  const ownedSet = new Set((maneuverNames || []).map(normalizeName));
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
        summary = "Ally uses reaction to attack (+die damage)";
        extraDescriptions.push(maneuverRule("Commander's Strike (Greater)")?.description);
      } else if (ownedSet.has("commander's strike (improved)")) {
        slots = ["bonus"];
        displayName = "Commander's Strike (Improved)";
        upgradeTag = "Improved";
        summary = "Ally uses reaction to attack (+die damage)";
        extraDescriptions.push(maneuverRule("Commander's Strike (Improved)")?.description);
      }
    } else if (baseKey === "call to arms" && ownedSet.has("call to arms (improved)")) {
      displayName = "Call to Arms (Improved)";
      upgradeTag = "Improved";
      summary = "When surprised: act normally & extend to up to die-roll allies";
      extraDescriptions.push(maneuverRule("Call to Arms (Improved)")?.description);
    } else if (baseKey === "effective flanking") {
      if (ownedSet.has("effective flanking (greater)")) {
        displayName = "Effective Flanking (Greater)";
        upgradeTag = "Greater";
        summary = "30 ft: add die + maneuver modifier to first attack & damage roll before next turn";
        extraDescriptions.push(maneuverRule("Effective Flanking (Improved)")?.description);
        extraDescriptions.push(maneuverRule("Effective Flanking (Greater)")?.description);
      } else if (ownedSet.has("effective flanking (improved)")) {
        displayName = "Effective Flanking (Improved)";
        upgradeTag = "Improved";
        summary = "30 ft: add die to first attack & damage roll before next turn";
        extraDescriptions.push(maneuverRule("Effective Flanking (Improved)")?.description);
      }
    } else if (baseKey === "parry" && ownedSet.has("parry (improved)")) {
      effectiveType = "General";
      displayName = "Parry (Improved)";
      upgradeTag = "General";
      extraDescriptions.push(maneuverRule("Parry (Improved)")?.description);
    } else if (baseKey === "sweeping attack" && ownedSet.has("sweeping attack (improved)")) {
      displayName = "Sweeping Attack (Improved)";
      upgradeTag = "Improved";
      summary = "On melee hit: adjacent target in reach takes die + maneuver modifier damage";
      extraDescriptions.push(maneuverRule("Sweeping Attack (Improved)")?.description);
    }

    const fullDescription = [baseRule?.description || "", ...extraDescriptions.filter(Boolean)].join("\n\n");
    out.push({
      rule: baseRule,
      displayName,
      slots,
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
  "primal endurance": {kind: "rolledEffect", effectName: "Primal Endurance", label: "AC bonus", scale: 1},
  "steady the nerves": {kind: "rolledEffect", effectName: "Steady the Nerves", label: "Saving throw bonus", scale: 1},
  "precise movements": {kind: "rolledEffect", effectName: "Precise Movements", label: "Speed bonus (5 × die ft)", scale: 5},
  "charge": {kind: "rolledEffect", effectName: "Charge", label: "Speed bonus (5 × die ft)", scale: 5},
  "inner strength": {kind: "rolledTempHP", modType: "General", selfDefault: true},
  "vanity": {kind: "rolledHeal", modType: "General", selfDefault: true},
  "administer aid": {kind: "rolledHeal", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "adrenaline hit": {kind: "rolledHeal", modType: "Mental", selfDefault: false, canTargetAlly: true, applyEffect: "Adrenaline Hit"},
  "remove toxins": {kind: "rolledHeal", modType: "None", selfDefault: false, canTargetAlly: true, cureToxin: true},
  "rally": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "enhancement injection": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true, applyEffect: "Enhancement Injection"},
  "encouraging speech": {kind: "rolledTempHP", modType: "Mental", selfDefault: false, canTargetAlly: true},
  "you call this archaeology?": {kind: "rolledTempHP", modType: "Force", selfDefault: true, canTargetAlly: true},
  "one step ahead": {kind: "rolledEffect", effectName: "One Step Ahead", label: "Initiative bonus", scale: 1},
  "feinting attack": {kind: "toggleEffect", effectName: "Feinting Attack", note: "Advantage on next attack vs feinted target this turn"},
  "parry": {kind: "rolledEffectPlusMod", effectName: "Parry", label: "Melee damage reduction", modType: "General"},
  "self-preservation": {kind: "rolledEffect", effectName: "Self-Preservation", label: "Saving throw bonus", scale: 1},
  "firewall": {kind: "rolledEffect", effectName: "Firewall", label: "Tech saving throw bonus", scale: 1, canTargetAlly: true, selfDefault: true},
  "one with the force": {kind: "rolledEffect", effectName: "One with the Force", label: "CON concentration save bonus", scale: 1},
  "conceal": {kind: "rolledEffect", effectName: "Conceal", label: "Stealth check bonus", scale: 1},
  "flex": {kind: "rolledEffect", effectName: "Flex", label: "Athletics check bonus", scale: 1},
  "perceive": {kind: "rolledEffect", effectName: "Perceive", label: "Perception check bonus", scale: 1},
  "tumble": {kind: "rolledEffect", effectName: "Tumble", label: "Acrobatics check bonus", scale: 1},
  "assess the situation": {kind: "rolledEffect", effectName: "Assess the Situation", label: "Perception/Investigation bonus", scale: 1},
  "wild senses": {kind: "rolledEffect", effectName: "Wild Senses", label: "Perception/Survival bonus", scale: 1},
  "wrestle and drag": {kind: "toggleEffect", effectName: "Wrestle and Drag", note: "Drag grappled creature at full speed until end of turn"},
  "call to arms": {kind: "clearCondition", conditionName: "Surprised"}
};

function applyManeuverState(next, profile, maneuverName, rolledDie = 0, applyToSelf = true) {
  const key = normalizeName(maneuverName);
  const sup = superiorityStats(profile, next);
  if (sup.qty > 0) {
    next.superiorityUsed = Math.min(sup.qty, (next.superiorityUsed || 0) + 1);
  }
  const spec = SELF_STATE_MANEUVERS[key];
  if (!spec) return;
  const dieVal = Math.max(1, Math.floor(Number(rolledDie) || 1));
  const casting = castingStats(profile, next);
  const modVal = spec.modType === "Mental" ? sup.mentalMod
    : spec.modType === "General" ? sup.generalMod
    : spec.modType === "Force" ? Math.max(modifier(effectiveScores(profile, next).Wisdom), modifier(effectiveScores(profile, next).Charisma))
    : 0;

  if (spec.kind === "toggleEffect") {
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, 1, false, {id: newID(), note: spec.note || "", persistent: false}));
  } else if (spec.kind === "applyCondition") {
    if (!next.effects.some(e => normalizeName(e.name) === normalizeName(spec.conditionName))) {
      next.effects.push(conditionEntry(spec.conditionName, 1, false, {id: newID(), note: spec.note || "", persistent: true}));
    }
  } else if (spec.kind === "regainHitDie") {
    next.hitDice = Math.min(profile.level, (next.hitDice || 0) + 1);
  } else if (spec.kind === "clearCondition") {
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.conditionName));
  } else if (spec.kind === "rolledEffect" && applyToSelf) {
    const val = dieVal * (spec.scale || 1);
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, val, false, {id: newID(), note: spec.scale === 5 ? "+" + val + " ft" : "+" + val, persistent: false}));
  } else if (spec.kind === "rolledEffectPlusMod" && applyToSelf) {
    const val = Math.max(1, dieVal + modVal);
    next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.effectName));
    next.effects.push(conditionEntry(spec.effectName, val, false, {id: newID(), note: "−" + val + " next melee hit", persistent: false}));
  } else if (spec.kind === "rolledHeal" && applyToSelf) {
    const amount = Math.max(1, dieVal + modVal);
    recoverHP(next, amount, hitPointMaximum(profile, next));
    if (spec.cureToxin) {
      next.effects = next.effects.filter(e => e.name !== "Poisoned" && e.name !== "Diseased");
    }
    if (spec.applyEffect && modVal > 0) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.applyEffect));
      next.effects.push(conditionEntry(spec.applyEffect, modVal, false, {id: newID(), note: "−" + modVal + " damage", persistent: true}));
    }
  } else if (spec.kind === "rolledTempHP" && applyToSelf) {
    const amount = Math.max(1, dieVal + modVal);
    if (amount > (next.temp || 0)) {
      next.temp = amount;
      next.tempSource = maneuverName;
    }
    if (spec.applyEffect && modVal > 0) {
      next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(spec.applyEffect));
      next.effects.push(conditionEntry(spec.applyEffect, modVal, false, {id: newID(), note: "+" + modVal + " STR/CON", persistent: true}));
    }
  }
}

function openManeuverRollDialog(displayName, baseName, trigger) {
  const {profile, session} = app.character;
  const sup = superiorityStats(profile, session);
  const spec = SELF_STATE_MANEUVERS[normalizeName(baseName)];
  const dieSides = parseNumericStat(String(sup.size || "d4").replace(/^d/i, "")) || 4;
  const {dialog, form, body, field, note, confirm} = createModalFrame(displayName, trigger);
  confirm.textContent = "Spend 1 Superiority Die";
  const rule = maneuverRule(baseName);
  note(rule?.mechanics?.summary || "Roll your superiority die (" + (sup.size || "d4") + ").");
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides,
    label: "Superiority die roll (" + (sup.size || "d4") + ")"
  });
  const input = dieField.input;

  let selfCheck = null;
  if (spec?.canTargetAlly) {
    const wrap = document.createElement("label");
    wrap.className = "row";
    selfCheck = document.createElement("input");
    selfCheck.type = "checkbox";
    selfCheck.checked = Boolean(spec.selfDefault);
    wrap.append(selfCheck, document.createTextNode(" Apply healing / temporary HP to myself"));
    body.append(wrap);
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const rolled = clamp(Math.floor(Number(input.value) || 1), 1, dieSides);
    const toSelf = selfCheck ? selfCheck.checked : true;
    dialog.close();
    update("Used maneuver · " + displayName, (next, prof) => {
      applyManeuverState(next, prof, baseName, rolled, toSelf);
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
  const weapons = session.equipped.filter(item => item.equipped && canUseWeapon(session, item, profile) && weaponStats(profile, item, raging, session));
  const shield = equippedRule(session, "shield");
  const hasPhysicalShield = Boolean(shield && !/generator/i.test(shield.name));
  const hasEffect = name => (session.effects || []).some(e => normalizeName(e.name) === normalizeName(name));
  const freeTarget = free || action;

  getElementById("actionRestriction").textContent = c.dead ? "Dead" :
    blocked ? "Incapacitated. Actions and reactions are unavailable." :
    c.shocked ? "Shocked · Action or bonus action · no reactions" : "";

  if (profile.attacks > 1) {
    actionEntry(action, "Attack", profile.attacks + " attacks per Attack action", {
      details: () => showInfo("Extra Attack", [["Source", profile.className]], classRule(profile, "Extra Attack"))
    });
  }

  for (const item of weapons) {
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
        if (target) target.twoHanded = !target.twoHanded;
      }));
      extras.push(btn);
    }
    if (stats.canChooseStrDex || stats.finesse) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.textContent = stats.ability.slice(0, 3).toUpperCase();
      btn.title = "Toggle finesse ability (STR / DEX)";
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
      btn.textContent = stats.switchActive ? "Alt: " + stats.switchSpec.type : "Primary";
      btn.title = "Toggle Switch weapon damage mode";
      btn.addEventListener("click", () => update("Switched " + item.name + " damage mode", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.switchMode = !target.switchMode;
      }));
      extras.push(btn);
    }
    if (stats.defensiveNum) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.setAttribute("aria-pressed", String(Boolean(stats.defensiveActive)));
      btn.textContent = "Def +" + stats.defensiveNum + " AC";
      btn.title = "Toggle Defensive property (-" + stats.defensiveNum + " attack & damage for +" + stats.defensiveNum + " AC)";
      btn.addEventListener("click", () => update((stats.defensiveActive ? "Ended " : "Activated ") + item.name + " Defensive", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.defensiveActive = !target.defensiveActive;
      }));
      extras.push(btn);
    }
    if (stats.recklessNum) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.setAttribute("aria-pressed", String(Boolean(stats.recklessActive)));
      btn.textContent = "Reckless +" + stats.recklessNum;
      btn.title = "Toggle Reckless property (-" + stats.recklessNum + " AC for +" + stats.recklessNum + " attack & damage)";
      btn.addEventListener("click", () => update((stats.recklessActive ? "Ended " : "Activated ") + item.name + " Reckless", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.recklessActive = !target.recklessActive;
      }));
      extras.push(btn);
    }
    if (stats.direNum) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.setAttribute("aria-pressed", String(Boolean(stats.direActive)));
      btn.textContent = "Dire −" + stats.direNum + "/+" + stats.direNum;
      btn.title = "Toggle Dire property (-" + stats.direNum + " to hit for +" + stats.direNum + " damage)";
      btn.addEventListener("click", () => update((stats.direActive ? "Cleared " : "Enabled ") + item.name + " Dire", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.direActive = !target.direActive;
      }));
      extras.push(btn);
    }
    if (stats.piercingNum) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swWeaponToggle";
      btn.setAttribute("aria-pressed", String(Boolean(stats.piercingActive)));
      btn.textContent = "Piercing +" + stats.piercingNum + "/−" + stats.piercingNum;
      btn.title = "Toggle Piercing property (+" + stats.piercingNum + " to hit for -" + stats.piercingNum + " damage)";
      btn.addEventListener("click", () => update((stats.piercingActive ? "Cleared " : "Enabled ") + item.name + " Piercing", next => {
        const target = next.equipped.find(e => e.id === item.id);
        if (target) target.piercingActive = !target.piercingActive;
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
    const sub = [
      signed(stats.toHit) + " to hit",
      damageNotation(stats),
      traits.savageAttacks && stats.melee ? "+1 die on crit" : "",
      c.prone && stats.ranged ? "Prone: disadvantage within 30 ft" : "",
      ...stats.notes
    ].filter(Boolean).join(" · ");
    actionEntry(action, item.name, sub, {
      mode: attackMode(session, stats, "action"),
      details: () => showItem(item.name, item),
      extras
    });
  }

  const unarmed = weaponStats(profile, "unarmed", raging, session);
  unarmed.armorPenalty = armor.nonproficient;
  actionEntry(action, "Unarmed strike", signed(unarmed.toHit) + " to hit · " + damageNotation(unarmed), {
    mode: attackMode(session, unarmed, "action")
  });
  if (armor.shieldHasAnchor) {
    actionEntry(action, armor.shieldAnchored ? "Recover anchored shield" : "Anchor shield",
      armor.shieldAnchored ? ("Anchored · +" + armor.anchorCoverAC + " cover AC (no shield AC)") : "Action · Anchor for cover", {
        use: () => update(armor.shieldAnchored ? "Recovered anchored shield" : "Anchored shield", next => {
          const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
          if (sh) sh.anchored = !sh.anchored;
        }),
        pressed: armor.shieldAnchored,
        disabled: blocked
      });
  }
  if (armor.shieldVersProp && !armor.shieldAnchored) {
    const shItem = session.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
    actionEntry(freeTarget, "Versatile shield grip", shItem?.twoHanded ? ("2H · +" + armor.shieldVersBonus + " extra AC") : "1H · Switch to 2H for extra AC", {
      use: () => update("Switched shield grip", next => {
        const sh = next.equipped.find(i => i.equipped && equipmentGroup(itemRule(i.name, i)) === "shield");
        if (sh) sh.twoHanded = !sh.twoHanded;
      }),
      pressed: Boolean(shItem?.twoHanded),
      disabled: blocked
    });
  }
  if (armor.spikedProp) {
    const spM = armor.spikedProp.match(/(\d+)d(\d+)/i);
    const spDice = spM ? spM[1] + "d" + spM[2] : "1d4";
    const strMod = effectiveModifier(profile, session, "Strength", c);
    actionEntry(action, "Spiked shield bash", signed(strMod + profile.proficiency) + " to hit · " + spDice + (strMod ? signed(strMod) : "") + " kinetic (" + armor.spikedProp + ")", {
      mode: attackMode(session, {melee: true, ability: "Strength", armorPenalty: armor.nonproficient}, "action")
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

    if (actionPowers.length || allPowers.length) {
      actionEntry(action, "Cast a power", [
        (actionPowers.length || allPowers.length) + " known",
        ...castSummary
      ].join(" · "), {
        use: event => openCastChooser(actionPowers.length ? "Action" : "all", event.currentTarget),
        disabled: blocked
      });
    }
    const effectiveBonusPowers = typeof filteredCastPowers === "function" ? filteredCastPowers(profile, "BonusAction", session) : bonusPowers;
    if (effectiveBonusPowers.length) {
      const quickOnly = !bonusPowers.length && effectiveBonusPowers.length > 0;
      const bonusSub = (quickOnly ? effectiveBonusPowers.length + " quickenable (+2 Force points) · " : bonusPowers.length + " known" + (effectiveBonusPowers.length > bonusPowers.length ? " (+" + (effectiveBonusPowers.length - bonusPowers.length) + " quickenable)" : "") + " · ") + castSummary.join(" · ");
      actionEntry(bonus, "Bonus action power", bonusSub, {
        use: event => openCastChooser("BonusAction", event.currentTarget),
        disabled: blocked
      });
    }
    if (reactionPowers.length) {
      actionEntry(reaction, "Reaction power", reactionPowers.length + " known · " + castSummary.join(" · "), {
        use: event => openCastChooser("Reaction", event.currentTarget),
        disabled: !canReact(session)
      });
    }
    if (specialPowers.length) {
      actionEntry(freeTarget, "Special / Triggered power", specialPowers.map(p => p.name).join(", "), {
        use: event => openCastChooser("Special", event.currentTarget),
        disabled: blocked
      });
    }
  }

  // Berserker: Reckless Attack (Free trigger on first attack), Rage/Frenzy/Leap (Bonus Action)
  if (traits.isBerserker && profile.level >= 2) {
    actionEntry(freeTarget, "Reckless Attack", session.reckless ? "Active · Advantage on STR melee attacks · incoming advantage" : "Free on first attack of turn", {
      use: () => update(session.reckless ? "Cleared Reckless Attack" : "Enabled Reckless Attack", next => { next.reckless = !next.reckless; }),
      pressed: Boolean(session.reckless),
      disabled: blocked,
      details: () => showInfo("Reckless Attack", [["Timing", "No action (on first attack of turn)"]], classRule(profile, "Reckless Attack"))
    });
  }
  if (traits.isBerserker && profile.rageMax) {
    actionEntry(bonus, raging ? "End Rage" : "Rage", raging ? "Active" : (profile.rageMax - (session.spent.rage || 0)) + " uses left", {
      use: raging ? () => update("Ended Rage", endRage) : () => startRage(false),
      disabled: blocked || (!raging && ((session.spent.rage || 0) >= profile.rageMax || armor.heavy)),
      details: () => showInfo("Rage", [["Resistance", resistanceNames(profile, {...session, rage: {frenzy: false}}).join(", ")]], classRule(profile, "Rage"))
    });
    if (normalizeName(session.approach) === "frenzied approach") {
      const frenzy = session.rage?.frenzy;
      const text = frenzy ? "One melee weapon attack as a bonus action" :
        (raging ? "Choose when entering Rage" : (session.spent.frenzy || 0) ? "Adds 1 exhaustion when Rage ends" : "First use has no exhaustion");
      actionEntry(bonus, "Frenzy", text, {
        use: () => startRage(true),
        disabled: blocked || raging || armor.heavy || (session.spent.rage || 0) >= profile.rageMax,
        details: () => showInfo("Frenzy", [["Source", session.approach]], approachRule(profile, session, "Frenzy"))
      });
    }
    if (profile.leapMax) {
      actionEntry(bonus, "Fyrnock’s leap", (profile.leapMax - (session.spent.leap || 0)) + " uses left · While raging", {
        use: useLeap,
        disabled: blocked || !raging || (session.spent.leap || 0) >= profile.leapMax,
        details: () => showInfo("Fyrnock’s leap", [["Source", "Fyrnock’s Instinct"]], classRule(profile, "Fyrnock's Instinct"))
      });
    }
  }

  // Sentinel: Force-Empowered Self (ALL THREE are no-action triggers -> Free / Triggered!)
  if (traits.isSentinel && profile.level >= 2) {
    const kcDie = step["Kinetic Combat"] || "1d4";
    const fesRules = classRule(profile, "Force-Empowered Self");
    const isLivingCurrent = normalizeName(session.approach) === "path of the living current" && (profile.level || 1) >= 3;
    const lcScores = effectiveScores(profile, session);
    const lcMod = isLivingCurrent ? Math.max(1, modifier(lcScores.Wisdom), modifier(lcScores.Charisma)) : 0;
    const lcOvercharged = isLivingCurrent && (profile.level || 1) >= 13;
    const deflectOn = hasEffect("Force-Empowered Self: Deflection");
    const deflectText = deflectOn
      ? ("Active · AC boosted" + (isLivingCurrent ? " · If hit, attacker takes " + lcMod + " lightning" : ""))
      : ("When targeted (no action) · 1 FP · +" + kcDie + " AC" + (isLivingCurrent ? " · If hit, " + lcMod + " lightning" + (lcOvercharged ? " · Force reroll (lower)" : "") : ""));
    actionEntry(freeTarget, "Deflection", deflectText, {
      use: event => deflectOn ? toggleNamedEffect("Force-Empowered Self: Deflection") : openDeflectionDialog(event.currentTarget),
      pressed: deflectOn,
      disabled: blocked || (!deflectOn && casting.forceTotalRemaining < 1),
      details: () => showInfo("Force-Empowered Self: Deflection", [["Timing", "No action required"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
    const dsText = "On weapon hit (no action) · 1 FP · +" + kcDie + (isLivingCurrent ? " (or +" + kcDie + "+" + lcMod + " lightning" + (lcOvercharged ? "; advantage on next attack against target" : "") + ")" : " damage");
    actionEntry(freeTarget, "Double Strike", dsText, {
      use: () => update("Force-Empowered Self: Double Strike (+" + kcDie + (isLivingCurrent ? "/+" + lcMod + " lightning" : "") + ")", next => {
        spendForcePoints(next, 1);
      }),
      disabled: blocked || casting.forceTotalRemaining < 1,
      details: () => showInfo("Force-Empowered Self: Double Strike", [["Timing", "No action (on hit)"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
    const slowTimeOn = hasEffect("Force-Empowered Self: Slow Time");
    const stText = slowTimeOn
      ? ("Active · Speed boosted" + (isLivingCurrent ? " · Shocked immune · Slowed −5 ft" + (lcOvercharged ? " · Move 10 ft → advantage on next attack" : "") : ""))
      : ("When moving (no action) · 1 FP · +5 × " + kcDie + " ft" + (isLivingCurrent ? " · Shocked immune · Slowed −5 ft" + (lcOvercharged ? " · Move 10 ft → advantage" : "") : ""));
    actionEntry(freeTarget, "Slow Time", stText, {
      use: event => slowTimeOn ? toggleNamedEffect("Force-Empowered Self: Slow Time") : openSlowTimeDialog(event.currentTarget),
      pressed: slowTimeOn,
      disabled: blocked || (!slowTimeOn && casting.forceTotalRemaining < 1),
      details: () => showInfo("Force-Empowered Self: Slow Time", [["Timing", "No action (when moving)"], ["Cost", "1 Force Point"], ["Die", kcDie]], fesRules + (isLivingCurrent ? "\n\n" + approachRule(profile, session, "Voltaic Combat") : ""))
    });
  }

  // Consular: Contextual reactive metamagics (Refocused Power while concentrating, Seeking Power) & Force Shield
  // (Force Affinity config lives in Class Binder & triggers dynamically on cast; on-cast Force-Empowered Castings live inside Cast Dialog)
  if (traits.isConsular && profile.level >= 2) {
    const ownedFec = ownedClassOptions(profile, session).filter(o => o.poolName === "Force-Empowered Castings");
    const hasFec = name => ownedFec.some(o => normalizeName(o.name) === normalizeName(name));
    if (hasFec("Refocused Power") && session.concentration) {
      actionEntry(reaction, "Refocused Power (2 Force points)", "Auto-succeed on Constitution save to maintain concentration on " + session.concentration, {
        use: () => update("Refocused Power · Kept concentration on " + session.concentration, next => { spendForcePoints(next, 2); }),
        disabled: !canReact(session) || casting.forceTotalRemaining < 2,
        details: () => showInfo("Refocused Power", [["Cost", "2 Force points"], ["Timing", "Reaction"]], classOptionRule("Refocused Power")?.description || "")
      });
    }
    if (hasFec("Seeking Power")) {
      actionEntry(freeTarget, "Seeking Power (2 Force points)", "On missed force power attack: reroll the attack roll", {
        use: () => update("Seeking Power · Reroll missed force attack", next => { spendForcePoints(next, 2); }),
        disabled: blocked || casting.forceTotalRemaining < 2,
        details: () => showInfo("Seeking Power", [["Cost", "2 Force points"], ["Timing", "No action (on miss)"]], classOptionRule("Seeking Power")?.description || "")
      });
    }
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
            next.effects.push(conditionEntry("Force Shield", 1, false, {id: newID(), note: "+" + shieldBonus + " AC", persistent: true}));
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
    actionEntry(freeTarget, "Sneak Attack", "Once per turn on hit (finesse or blaster) · +" + traits.sneakAttack, {
      details: () => showInfo("Sneak Attack", [["Timing", "Free trigger (once per turn on hit)"], ["Damage", traits.sneakAttack]], classRule(profile, "Sneak Attack"))
    });
  }
  if (traits.isOperative && profile.level >= 2) {
    const hiddenOn = hasEffect("Hidden");
    actionEntry(bonus, hiddenOn ? "End Hidden (Cunning Action)" : "Cunning Action · Hide", "Dash, Disengage, or Hide as a bonus action", {
      use: () => toggleNamedEffect("Hidden", "Cunning Action"),
      pressed: hiddenOn,
      disabled: blocked,
      details: () => showInfo("Cunning Action", [["Source", "Operative 2"]], classRule(profile, "Cunning Action"))
    });
  }
  if (traits.isOperative && profile.level >= 5) {
    actionEntry(reaction, "Uncanny Dodge", "Halve incoming attack damage from an attacker you can see", {
      details: () => showInfo("Uncanny Dodge", [["Source", "Operative 5"]], classRule(profile, "Uncanny Dodge"))
    });
  }

  // Guardian: Channel the Force (Cause Harm Action + Lend Aid Bonus Action), Force-Empowered Strikes, Passive Auras
  if (traits.isGuardian) {
    const cfRes = characterResources(profile, session).find(r => r.id === "channelForce");
    const cfLeft = cfRes?.value || 0;
    const cfMax = cfRes?.max || 2;
    const gScores = effectiveScores(profile, session);
    const causeDmg = (profile.level || 1) + Math.max(1, modifier(gScores.Charisma));
    const aidHeal = (profile.level || 1) + Math.max(1, modifier(gScores.Wisdom));
    actionEntry(action, "Channel the Force · Cause Harm", cfLeft + "/" + cfMax + " · 60 ft · CON save DC " + (casting.universalForceDC || casting.forceDC || 10) + " · " + causeDmg + " necrotic (half on pass)", {
      use: () => update("Channel the Force · Cause Harm (" + causeDmg + " necrotic)", next => { next.spent.channelForce = (next.spent.channelForce || 0) + 1; }),
      disabled: blocked || cfLeft <= 0,
      details: () => showInfo("Channel the Force · Cause Harm", [["Uses", cfLeft + "/" + cfMax + " (short rest)"], ["Save DC", "CON DC " + (casting.universalForceDC || casting.forceDC || 10)], ["Damage", causeDmg + " necrotic (half on pass)"]], classRule(profile, "Channel the Force"))
    });
    actionEntry(bonus, "Channel the Force · Lend Aid", cfLeft + "/" + cfMax + " · Touch · Heal " + aidHeal + " HP or cure 1 poison/disease", {
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
    if (profile.level >= 2) {
      actionEntry(freeTarget, "Force-Empowered Strikes", "On melee hit (no action) · 1 Force point · +1d8 damage (maximum " + (step["Focused Strikes"] || "2d8") + ")", {
        use: () => update("Force-Empowered Strike (+1d8)", next => { spendForcePoints(next, 1); }),
        disabled: blocked || casting.forceTotalRemaining < 1,
        details: () => showInfo("Force-Empowered Strikes", [["Timing", "No action (on hit)"], ["Maximum bonus", step["Focused Strikes"] || ""]], classRule(profile, "Force-Empowered Strikes"))
      });
    }
    if (profile.level >= 3) {
      const myAuras = ownedClassOptions(profile, session).filter(o => o.poolName === "Guardian Auras");
      const conscious = !c.unconscious && !c.dead;
      const radius = step["Aura Radius"] || "5 ft.";
      if (myAuras.some(o => normalizeName(o.name) === "aura of vigor")) {
        const vMod = Math.max(1, modifier(gScores.Wisdom), modifier(gScores.Charisma));
        actionEntry(freeTarget, "Aura of Vigor (Start of Turn)", conscious ? "Active (" + radius + ") · Gain +" + vMod + " temporary HP" : "Suppressed while unconscious", {
          use: () => update("Aura of Vigor · +" + vMod + " temporary HP", next => {
            if (vMod > (next.temp || 0)) { next.temp = vMod; next.tempSource = "Aura of Vigor"; }
          }),
          disabled: !conscious,
          details: () => showInfo("Aura of Vigor", [["Radius", radius], ["Temporary HP", "+" + vMod + " (Wisdom or Charisma modifier, minimum 1)"]], myAuras.find(o => normalizeName(o.name) === "aura of vigor")?.description || classRule(profile, "Guardian Aura"))
        });
      }
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
    actionEntry(bonus, "Second Wind", (swRes?.value || 0) + "/" + (swRes?.max || 1) + " · Heal 1d10 + " + profile.level, {
      use: event => openSecondWindDialog(event.currentTarget),
      disabled: blocked || !(swRes?.value > 0),
      details: () => showInfo("Second Wind", [["Timing", "Bonus action"]], classRule(profile, "Second Wind"))
    });
    if (profile.level >= 2) {
      const asRes = characterResources(profile, session).find(r => r.id === "actionSurge");
      actionEntry(freeTarget, "Action Surge", "No action · " + (asRes?.value || 0) + "/" + (asRes?.max || 1) + " · Take one additional action", {
        use: () => update("Used Action Surge", next => { next.spent.actionSurge = (next.spent.actionSurge || 0) + 1; }),
        disabled: blocked || !(asRes?.value > 0),
        details: () => showInfo("Action Surge", [["Timing", "No action required"]], classRule(profile, "Action Surge"))
      });
    }
    if (profile.level >= 9) {
      const indRes = characterResources(profile, session).find(r => r.id === "indomitable");
      actionEntry(freeTarget, "Indomitable", "On failed save (no action) · " + (indRes?.value || 0) + "/" + (indRes?.max || 1) + " · Reroll save", {
        use: () => update("Used Indomitable", next => { next.spent.indomitable = (next.spent.indomitable || 0) + 1; }),
        disabled: !(indRes?.value > 0),
        details: () => showInfo("Indomitable", [["Timing", "No action (on failed save)"]], classRule(profile, "Indomitable"))
      });
    }
  }

  // Monk: Bonus actions (Martial Arts, Flurry, Patient Defense, Step of the Wind), Free (Stunning Strike), Reaction (Deflect Missiles, Slow Fall)
  if (traits.isMonk) {
    const focusRes = characterResources(profile, session).find(r => r.id === "focus");
    const focusLeft = focusRes?.value || 0;
    actionEntry(bonus, "Martial Arts strike", "One unarmed strike after Attack action (" + damageNotation(unarmed) + ")", {
      details: () => showInfo("Martial Arts", [["Die", step["Martial Arts"] || "1d4"]], classRule(profile, "Martial Arts"))
    });
    if (profile.level >= 2) {
      actionEntry(bonus, "Flurry of Blows", "1 Focus Point · Two unarmed strikes after Attack action", {
        use: () => update("Flurry of Blows (1 Focus)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Focus", [], classRule(profile, "Focus"))
      });
      actionEntry(bonus, "Patient Defense", "1 Focus Point · Take Dodge action (applies Dodging)", {
        use: () => update("Patient Defense (1 Focus · Dodging)", next => {
          next.spent.focus = (next.spent.focus || 0) + 1;
          if (!next.effects.some(e => normalizeName(e.name) === "dodging")) {
            next.effects.push(conditionEntry("Dodging", 1, false, {id: newID(), note: "Patient Defense", persistent: true}));
          }
        }),
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Focus", [], classRule(profile, "Focus"))
      });
      actionEntry(bonus, "Step of the Wind", "1 Focus Point · Disengage or Dash & double jump distance", {
        use: () => update("Step of the Wind (1 Focus)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Focus", [], classRule(profile, "Focus"))
      });
    }
    if (profile.level >= 5) {
      actionEntry(freeTarget, "Stunning Strike", "On melee hit (no action) · 1 Focus Point · CON save or Stunned", {
        use: () => update("Stunning Strike (1 Focus)", next => { next.spent.focus = (next.spent.focus || 0) + 1; }),
        disabled: blocked || focusLeft < 1,
        details: () => showInfo("Stunning Strike", [["Timing", "No action (on melee hit)"]], classRule(profile, "Stunning Strike"))
      });
    }
    if (profile.level >= 3) {
      actionEntry(reaction, "Deflect Missiles", "Reduce ranged weapon damage by 1d10 + DEX + " + profile.level, {
        details: () => showInfo("Deflect Missiles", [], classRule(profile, "Deflect Missiles"))
      });
    }
    if (profile.level >= 4) {
      actionEntry(reaction, "Slow Fall", "Reduce falling damage by " + (profile.level * 5), {
        details: () => showInfo("Slow Fall", [], classRule(profile, "Slow Fall"))
      });
    }
  }

  // Scout, Engineer, Scholar
  if (traits.rangersQuarry) {
    const quarryOn = hasEffect("Ranger’s Quarry") || hasEffect("Ranger's Quarry");
    actionEntry(freeTarget, "Ranger’s Quarry", quarryOn ? "Active · +1" + traits.rangersQuarry + " damage (once per turn) & track advantage" : "No action (once per turn) · Mark target within 120 ft (+1" + traits.rangersQuarry + ")", {
      use: () => toggleNamedEffect("Ranger’s Quarry", "+1" + traits.rangersQuarry + " (once per turn)"),
      pressed: quarryOn,
      disabled: blocked,
      details: () => showInfo("Ranger’s Quarry", [["Die", "1" + traits.rangersQuarry], ["Range", "120 ft"]], classRule(profile, "Ranger's Quarry"))
    });
    if (traits.isScout && (profile.level || 1) >= 5) {
      actionEntry(reaction, "Mark Ranger’s Quarry", quarryOn ? "Active · Switch mark when a creature enters line of sight" : "Reaction when a creature enters line of sight (120 ft)", {
        use: () => toggleNamedEffect("Ranger’s Quarry", "+1" + traits.rangersQuarry + " (once per turn)"),
        pressed: quarryOn,
        disabled: blocked,
        details: () => showInfo("Ranger’s Quarry (Reaction)", [["Timing", "Reaction (Scout 5+)"], ["Range", "120 ft"]], classRule(profile, "Ranger's Quarry"))
      });
    }
  }
  if (traits.isScout && (profile.level || 1) >= 3 && hasClassOption(profile, session, "Adaptability Routine")) {
    const adaptEff = (session.effects || []).find(e => normalizeName(e.name) === "adaptability routine");
    actionEntry(freeTarget, "Adaptability Routine", adaptEff ? "Active · +½ prof to " + adaptEff.choice + " saves" : "Start of turn · Pick a non-proficient save (+½ prof)", {
      use: event => {
        const {dialog, form, body, note, confirm} = createModalFrame("Adaptability Routine", event.currentTarget);
        confirm.textContent = "Set Save Bonus";
        note("Choose an ability score saving throw in which you are not proficient to add half your proficiency bonus until the start of your next turn.");
        let chosenAb = adaptEff?.choice || abilities.find(ab => !traits.savingThrows.has(ab)) || "Wisdom";
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
        form.insertBefore(pills, form.querySelector("footer"));
        form.addEventListener("submit", e => {
          e.preventDefault();
          dialog.close();
          update("Adaptability Routine · " + chosenAb + " saves", next => {
            next.effects = next.effects.filter(e => normalizeName(e.name) !== "adaptability routine");
            next.effects.push(conditionEntry("Adaptability Routine", 1, false, {id: newID(), choice: chosenAb, note: "+½ prof to " + chosenAb + " saves", persistent: true}));
          });
        });
        dialog.showModal();
      },
      pressed: Boolean(adaptEff),
      disabled: blocked,
      details: () => showInfo("Adaptability Routine", [["Radius", step["Routine Radius"] || "5 ft."]], classOptionRule("Adaptability Routine")?.description || classRule(profile, "Scout Routine"))
    });
  }
  if (traits.isScout && profile.level >= 10) {
    const hiddenOn = hasEffect("Hidden");
    actionEntry(bonus, hiddenOn ? "End Hidden (Commando)" : "Commando · Hide / Dash", "Take Dash or Hide as a bonus action", {
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
    actionEntry(bonus, "Potent Aptitude", paLeft + "/" + paMax + " (short rest) · " + (step["Potent Aptitude"] || "d4") + " to an ally within 60 ft", {
      use: () => update("Used Potent Aptitude", next => {
        next.spent.potentAptitude = Math.min(paMax, (next.spent.potentAptitude || 0) + 1);
      }),
      disabled: blocked || paLeft <= 0,
      details: () => showInfo("Potent Aptitude", [["Die", step["Potent Aptitude"] || "d4"], ["Uses", paLeft + "/" + paMax + " (short rest)"]], classRule(profile, "Potent Aptitude"))
    });
  }
  if (traits.isScholar) {
    const caOn = hasEffect("Critical Analysis");
    actionEntry(bonus, "Critical Analysis", caOn ? "Active on target" : "Analyze a target within 60 ft", {
      use: () => toggleNamedEffect("Critical Analysis", "Target analyzed"),
      pressed: caOn,
      disabled: blocked,
      details: () => showInfo("Critical Analysis", [["Source", "Scholar"]], classRule(profile, "Critical Analysis"))
    });
    if (profile.level >= 2) {
      const saRes = characterResources(profile, session).find(r => r.id === "sageAdvice");
      actionEntry(freeTarget, "Sage Advice", (saRes?.value || 0) + "/" + (saRes?.max || 1) + " uses · Grant proficient skill to allies (1 hr)", {
        use: event => {
          const tr = effectiveTraining(profile, session);
          const profSkills = Object.keys(skills).filter(sk => (tr[sk] || 0) >= 1).sort();
          const {dialog, form, body, note, confirm} = createModalFrame("Sage Advice", event.currentTarget);
          confirm.textContent = "Use Sage Advice";
          note("Spend 1 minute advising up to your Intelligence modifier allies on a skill you are proficient in (1 hour).");
          let chosenSkill = profSkills[0] || "Lore";
          const pills = appendText(form, "div", "");
          pills.className = "row wrap";
          for (const sk of (profSkills.length ? profSkills : Object.keys(skills).sort())) {
            const p = appendText(pills, "button", sk);
            p.type = "button";
            p.className = "swPropChip";
            p.setAttribute("aria-pressed", String(sk === chosenSkill));
            p.addEventListener("click", () => {
              chosenSkill = sk;
              for (const b of pills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === sk));
            });
          }
          form.insertBefore(pills, form.querySelector("footer"));
          form.addEventListener("submit", e => {
            e.preventDefault();
            dialog.close();
            update("Sage Advice · " + chosenSkill, next => { next.spent.sageAdvice = (next.spent.sageAdvice || 0) + 1; });
          });
          dialog.showModal();
        },
        disabled: blocked || !(saRes?.value > 0),
        details: () => showInfo("Sage Advice", [], classRule(profile, "Sage Advice"))
      });
    }
  }

  // L1-20 Base Class & Class Improvement Live Actions (Standard actions moved to Base Actions reference popup)
  if (traits.isOperative && (profile.level || 1) >= 2 && session.classImprovementEnabled) {
    const saOn = (session.effects || []).some(e => normalizeName(e.name) === "steady aim");
    actionEntry(bonus, saOn ? "End Steady Aim" : "Steady Aim (Class Improvement)", "Advantage on next attack this turn; speed becomes 0", {
      use: () => update(saOn ? "Ended Steady Aim" : "Activated Steady Aim", next => {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== "steady aim");
        if (!saOn) next.effects.push(conditionEntry("Steady Aim", 1, false, {id: newID(), note: "Speed 0 · Advantage on next attack", persistent: false}));
      }),
      pressed: saOn,
      disabled: blocked
    });
  }
  if (traits.isMonk && (profile.level || 1) >= 7) {
    const hasCF = (session.effects || []).some(e => e.name === "Charmed" || e.name === "Frightened");
    actionEntry(action, "Stillness of Mind", hasCF ? "End Charmed or Frightened on yourself" : "Action or bonus action: end Charmed or Frightened", {
      use: () => update("Stillness of Mind · Cleared Charmed/Frightened", next => {
        next.effects = next.effects.filter(e => e.name !== "Charmed" && e.name !== "Frightened");
      }),
      disabled: blocked
    });
  }
  if (traits.isMonk && typeof hasClassOption === "function" && hasClassOption(profile, session, "Vow of Fortitude")) {
    actionEntry(action, "Vow of Fortitude", "Action or bonus action: end Blinded or Deafened on yourself", {
      use: () => update("Vow of Fortitude · Cleared Blinded/Deafened", next => {
        next.effects = next.effects.filter(e => e.name !== "Blinded" && e.name !== "Deafened");
      }),
      disabled: blocked
    });
  }
  if (traits.isMonk && (profile.level || 1) >= 18) {
    const focusRes = characterResources(profile, session).find(r => r.id === "focus");
    const ebOn = (session.effects || []).some(e => normalizeName(e.name) === "empty body");
    actionEntry(action, ebOn ? "End Empty Body" : "Empty Body (4 Focus)", "Invisible + resist all damage except force (1 minute)", {
      use: () => update(ebOn ? "Ended Empty Body" : "Activated Empty Body (4 Focus)", next => {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== "empty body");
        if (!ebOn) {
          next.spent.focus = (next.spent.focus || 0) + 4;
          next.effects.push(conditionEntry("Empty Body", 1, false, {id: newID(), note: "1 minute · Invisible + resist all except force", persistent: false}));
        }
      }),
      pressed: ebOn,
      disabled: blocked || (!ebOn && (!focusRes || focusRes.value < 4))
    });
  }
  if (traits.isMonk && session.classImprovementEnabled) {
    const focusRes = characterResources(profile, session).find(r => r.id === "focus");
    const maDie = traits.martialArtsDie || 4;
    const profB = profile.proficiency || 2;
    actionEntry(action, "Quickened Healing (2 Focus)", "Regain 1d" + maDie + " + " + profB + " HP", {
      use: event => {
        const {dialog, form, body, note, confirm} = createModalFrame("Quickened Healing", event.currentTarget);
        confirm.textContent = "Heal & Spend 2 Focus";
        note("Spend 2 Focus Points to roll 1d" + maDie + " and add your proficiency bonus (+" + profB + ") for HP.");
        const dieField = createDieRollField(body, {
          diceCount: 1,
          dieSides: maDie,
          modifier: profB,
          modifierLabel: "Proficiency",
          unit: "HP",
          label: "Martial Arts die roll (1d" + maDie + ")"
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const heal = dieField.getTotal();
          if (!Number.isFinite(heal)) return;
          dialog.close();
          update("Quickened Healing · +" + heal + " HP (2 Focus)", (next, prof) => {
            next.spent.focus = (next.spent.focus || 0) + 2;
            recoverHP(next, heal, hitPointMaximum(prof, next));
          });
        });
        dialog.showModal();
        dieField.input.focus();
      },
      disabled: blocked || !focusRes || focusRes.value < 2
    });
  }
  if (traits.isGuardian && session.classImprovementEnabled) {
    const chRes = characterResources(profile, session).find(r => r.id === "channelForce");
    const hfRes = characterResources(profile, session).find(r => r.id === "harnessForce");
    actionEntry(bonus, "Harness the Force", "Spend 1 Channel the Force to regain 2 Force Points (" + (hfRes?.value || 0) + "/" + (hfRes?.max || 2) + " left)", {
      use: () => update("Harness the Force · +2 Force Points", next => {
        next.spent.channelForce = (next.spent.channelForce || 0) + 1;
        next.spent.harnessForce = (next.spent.harnessForce || 0) + 1;
        next.forceUsed = Math.max(0, (next.forceUsed || 0) - 2);
      }),
      disabled: blocked || !chRes || chRes.value < 1 || !hfRes || hfRes.value < 1
    });
  }
  if (traits.isScout && session.classImprovementEnabled) {
    actionEntry(action, "Tireless (Class Improvement)", "Reduce Exhaustion by 1 and gain 1d10 + Intelligence modifier temporary HP", {
      use: event => {
        const sc = effectiveScores(profile, session);
        const mod = Math.max(0, modifier(sc.Intelligence));
        const {dialog, form, body, note, confirm} = createModalFrame("Tireless", event.currentTarget);
        confirm.textContent = "Apply Tireless";
        note("Reduce Exhaustion by 1, roll 1d10, and add your Intelligence modifier (+" + mod + ") for temporary HP.");
        const dieField = createDieRollField(body, {
          diceCount: 1,
          dieSides: 10,
          modifier: mod,
          modifierLabel: "Intelligence",
          unit: "temporary HP",
          label: "Die roll (1d10)"
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const tempGain = dieField.getTotal();
          if (!Number.isFinite(tempGain)) return;
          dialog.close();
          update("Tireless · −1 Exhaustion & +" + tempGain + " temporary HP", next => {
            next.exhaustion = Math.max(0, (next.exhaustion || 0) - 1);
            if (tempGain > (next.temp || 0)) { next.temp = tempGain; next.tempSource = "Tireless"; }
          });
        });
        dialog.showModal();
        dieField.input.focus();
      },
      disabled: blocked
    });
  }

  // Combat consumables carried in inventory
  const combatConsumables = session.equipped.filter(item => consumableSpec(itemRule(item.name, item))?.combat === "action");
  for (const item of combatConsumables) {
    const spec = consumableSpec(itemRule(item.name, item));
    actionEntry(action, spec.verb + " " + item.name, "×" + item.quantity + " carried", {
      use: event => openConsumableDialog(item.id, event.currentTarget),
      disabled: blocked,
      details: () => showItem(item.name, item)
    });
  }

  // Maneuvers routed strictly from verbatim-verified catalog metadata (3-bucket upgrade resolution)
  const activeManeuvers = Array.isArray(session.maneuvers) ? session.maneuvers : (profile.maneuvers || []);
  if (activeManeuvers.length) {
    const sup = superiorityStats(profile, session);
    for (const resolved of resolveActiveManeuvers(activeManeuvers, sup)) {
      for (const slot of resolved.slots) {
        const targetCol = slot === "reaction" ? reaction
          : slot === "bonus" ? bonus
          : (slot === "action" || slot === "replace-attack") ? action
          : freeTarget;
        const timingPrefix = slot === "replace-attack" ? "Replace 1 attack"
          : slot === "out-of-combat" ? "1 minute"
          : (resolved.slots.length > 1 && slot === "reaction") ? "Reaction (on your turn)"
          : "";
        const saveText = resolved.save ? ("DC " + resolved.saveDC + " " + resolved.save + " save") : "";
        const dieText = sup.qty > 0 ? (sup.remaining + "/" + sup.qty + " " + sup.size) : "Maneuver";
        const subText = [timingPrefix, resolved.upgradeTag, saveText, resolved.summary, dieText].filter(Boolean).join(" · ");
        const infoMeta = [
          ["Type", resolved.effectiveType],
          ["Timing", resolved.slots.map(s => s === "replace-attack" ? "Replace 1 attack" : s).join(" / ")],
          ...(resolved.save ? [["Save DC", "DC " + resolved.saveDC + " " + resolved.save]] : []),
          ...(resolved.rule?.prerequisite ? [["Prerequisite", resolved.rule.prerequisite]] : [])
        ];
        actionEntry(targetCol, resolved.displayName, subText, {
          use: sup.qty > 0 ? event => {
            const baseName = resolved.rule?.name || resolved.displayName;
            const spec = SELF_STATE_MANEUVERS[normalizeName(baseName)];
            if (spec && (spec.kind === "rolledEffect" || spec.kind === "rolledHeal" || spec.kind === "rolledTempHP")) {
              openManeuverRollDialog(resolved.displayName, baseName, event.currentTarget);
            } else {
              update("Used maneuver · " + resolved.displayName, (next, prof) => {
                applyManeuverState(next, prof, baseName, 1, true);
              });
            }
          } : null,
          disabled: blocked || (targetCol === reaction && !canReact(session)) || (sup.qty > 0 && sup.remaining <= 0),
          details: resolved.rule ? () => showInfo(resolved.displayName, infoMeta, resolved.fullDescription) : null
        });
      }
    }
  }

  // Lightsaber Forms (all 20 SW5e forms are adopted as a Bonus Action; active forms surface special reactions)
  const activeForms = Array.isArray(session.lightsaberForms) ? session.lightsaberForms : [];
  for (const fName of activeForms) {
    const rule = lightsaberFormRule(fName);
    const mech = rule?.mechanics || {};
    const active = hasEffect(fName);
    const summaryText = active
      ? ("Active · " + (mech.summary || "Lightsaber form"))
      : (mech.summary ? "Adopt · " + mech.summary : "Bonus action · Adopt form");
    actionEntry(bonus, rule?.name || fName, summaryText, {
      use: () => update(active ? "Ended " + fName : "Adopted " + fName, next => {
        const targetKey = normalizeName(rule?.name || fName);
        if (active) {
          next.effects = next.effects.filter(e => normalizeName(e.name) !== targetKey);
        } else {
          next.effects.push(conditionEntry(rule?.name || fName, 1, false, {id: newID(), note: mech.summary || "Lightsaber form", persistent: false}));
        }
      }),
      pressed: active,
      disabled: blocked,
      details: () => showInfo(rule?.name || fName, [["Timing", "Bonus action (adopt form)"]], rule?.description || "")
    });
    if (active && mech.activeReaction) {
      actionEntry(reaction, (rule?.name || fName) + " reaction", mech.activeReaction, {
        disabled: !canReact(session),
        details: () => showInfo(rule?.name || fName, [["Timing", "Reaction (while form active)"]], rule?.description || "")
      });
    }
  }

  // Fighting Styles & Fighting Masteries (with live active-effect toggles where applicable)
  const styleEffectToggles = {
    "blindfighting style": ["Blindfighting: Doubled", "Blindsight range doubled"],
    "equilibrium style": ["Equilibrium Mark", "+½ DEX AC & DEX saves vs marked target"],
    "defense style": ["Defense Mark", "Damage from marked target reduced"],
    "secured style": ["Secured: Light Shield", "+1 AC (fixed weapon as light shield)"],
    "dual wield mastery": ["Dual Wield AC", "+1 AC (forgo bonus TWF attack)"],
    "sentinel mastery": ["Defensive Stance", "Special OA reactions = proficiency bonus"],
    "duelist mastery": ["Duelist Mastery (+prof AC)", "+proficiency bonus to AC vs 1 melee attack"],
    "secured mastery": ["Secured Mastery (+prof AC)", "+proficiency bonus to AC vs 1 attack (forgo fixed attack)"],
    "covert style": ["Hidden", "Hide as a bonus action (Covert Style)"]
  };
  const activeStyles = Array.isArray(session.fightingStyles) ? session.fightingStyles : [];
  for (const sName of activeStyles) {
    const rule = fightingStyleRule(sName);
    const kind = verifiedOptionTiming(rule);
    if (!kind || kind === "passive") continue;
    const targetCol = kind === "reaction" ? reaction : kind === "bonus" ? bonus : kind === "action" ? action : freeTarget;
    const toggle = styleEffectToggles[normalizeName(rule?.name || sName)];
    const pressed = toggle ? hasEffect(toggle[0]) : undefined;
    actionEntry(targetCol, rule?.name || sName, (pressed ? "Active · " : "") + (rule?.mechanics?.summary || "Fighting Style"), {
      use: toggle ? () => toggleNamedEffect(toggle[0], toggle[1]) : null,
      pressed,
      disabled: toggle ? blocked : false,
      details: () => showInfo(rule?.name || sName, [["Type", "Fighting Style"], ["Timing", kind]], rule?.description || "")
    });
  }
  const activeMasteries = Array.isArray(session.fightingMasteries) ? session.fightingMasteries : [];
  for (const mName of activeMasteries) {
    const rule = fightingMasteryRule(mName);
    const kind = verifiedOptionTiming(rule);
    if (!kind || kind === "passive") continue;
    const targetCol = kind === "reaction" ? reaction : kind === "bonus" ? bonus : kind === "action" ? action : freeTarget;
    const toggle = styleEffectToggles[normalizeName(rule?.name || mName)];
    const pressed = toggle ? hasEffect(toggle[0]) : undefined;
    actionEntry(targetCol, rule?.name || mName, (pressed ? "Active · " : "") + (rule?.mechanics?.summary || "Fighting Mastery"), {
      use: toggle ? () => toggleNamedEffect(toggle[0], toggle[1]) : null,
      pressed,
      disabled: toggle ? blocked : false,
      details: () => showInfo(rule?.name || mName, [["Type", "Fighting Mastery"], ["Timing", kind]], rule?.description || "")
    });
  }

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
      : (left + "/1 (short rest) · DC " + saveDC + " CON save or " + sa.saveConCondition);
    actionEntry(bonus, sa.name, sub, {
      use: () => update("Used " + sa.name, next => {
        next.spent.speciesSpecial = 1;
        if (sa.tempHPCon) {
          const amt = Math.max(1, conMod);
          if (amt > (next.temp || 0)) { next.temp = amt; next.tempSource = sa.name; }
        }
      }),
      disabled: blocked || left <= 0
    });
  }
  if (spRec?.defensiveBall) {
    const ballOn = hasEffect("Defensive Ball");
    const ballBonus = Math.max(1, Math.floor(profile.proficiency / 2));
    actionEntry(freeTarget, "Defensive Ball", ballOn ? "Active · +" + ballBonus + " AC" : "On Dash (no shield) · +" + ballBonus + " AC until next turn", {
      use: () => toggleNamedEffect("Defensive Ball", "+" + ballBonus + " AC"),
      pressed: ballOn,
      disabled: blocked || Boolean(armor.shield)
    });
  }
  if (spRec?.furyOfTheSmall) {
    const left = Math.max(0, 1 - (session.spent.furyOfTheSmall || 0));
    actionEntry(freeTarget, "Fury of the Small", left + "/1 (short rest) · +" + profile.level + " damage vs larger creature", {
      use: () => update("Used Fury of the Small (+" + profile.level + " damage)", next => { next.spent.furyOfTheSmall = 1; }),
      disabled: blocked || left <= 0
    });
  }
  if (spRec?.primitiveNerves) {
    const left = Math.max(0, 1 - (session.spent.primitiveNerves || 0));
    const conMod = modifier(scoresNow.Constitution);
    actionEntry(reaction, "Primitive Nerves", left + "/1 (short rest) · Reduce damage by 1d12 " + signed(conMod), {
      use: () => update("Used Primitive Nerves", next => { next.spent.primitiveNerves = 1; }),
      disabled: !canReact(session) || left <= 0
    });
  }
  if (spRec?.echaniArt) {
    const eaMax = Math.max(1, modifier(scoresNow.Wisdom));
    const left = Math.max(0, eaMax - (session.spent.echaniArt || 0));
    actionEntry(reaction, "Echani Art", left + "/" + eaMax + " (long rest) · Insight vs Deception to learn melee attacker stat", {
      use: () => update("Used Echani Art", next => { next.spent.echaniArt = Math.min(eaMax, (next.spent.echaniArt || 0) + 1); }),
      disabled: !canReact(session) || left <= 0
    });
  }
  const archRec = archetypeRecord(session.approach, profile.className);
  const archMech = archRec?.mechanics || null;
  if (archMech?.actions?.length) {
    const aLvl = profile.level || 1;
    const aScores = effectiveScores(profile, session);
    const aWalk = speedBreakdown(profile, session, c).live || 30;
    const rawMods = {
      wisChaMod: Math.max(modifier(aScores.Wisdom), modifier(aScores.Charisma)),
      intMod: modifier(aScores.Intelligence),
      wisMod: modifier(aScores.Wisdom),
      chaMod: modifier(aScores.Charisma),
      strMod: modifier(aScores.Strength),
      dexMod: modifier(aScores.Dexterity),
      conMod: modifier(aScores.Constitution)
    };
    const profVal = profile.proficiency || 2;
    const interp = str => String(str || "")
      // First evaluate DC formulas like 8+{prof}+{strMod} with true signed modifiers
      .replace(/8\s*\+\s*\{prof\}\s*\+\s*\{(wisChaMod|intMod|wisMod|chaMod|strMod|dexMod|conMod)\}/g, (_, k) => String(8 + profVal + rawMods[k]))
      .replaceAll("{wisChaMod}", String(Math.max(1, rawMods.wisChaMod)))
      .replaceAll("{intMod}", String(Math.max(1, rawMods.intMod)))
      .replaceAll("{wisMod}", String(Math.max(1, rawMods.wisMod)))
      .replaceAll("{chaMod}", String(Math.max(1, rawMods.chaMod)))
      .replaceAll("{strMod}", String(Math.max(1, rawMods.strMod)))
      .replaceAll("{dexMod}", String(Math.max(1, rawMods.dexMod)))
      .replaceAll("{conMod}", String(Math.max(1, rawMods.conMod)))
      .replaceAll("{prof}", String(profVal))
      .replaceAll("{level}", String(aLvl))
      .replaceAll("{halfWalk}", String(Math.floor(aWalk / 10) * 5))
      .replace(/(\d+)\s*×\s*(\d+)/g, (_, a, b) => String(Number(a) * Number(b)));
    for (const act of archMech.actions) {
      if (act.minLevel && aLvl < act.minLevel) continue;
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
    actionEntry(col, label, usesPrefix + ct.summary, {
      use: useFn,
      pressed: isPressed,
      disabled: isDisabled,
      details: () => showInfo(label, [["Species", spRec.name], ["Timing", ct.timing === "free" ? "No action / special" : ct.timing]], fullDesc)
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
  const imRes = characterResources(profile, session).find(r => r.id === "idealManifests");
  for (const co of ownedClassOptions(profile, session)) {
    if (co.poolName === "Sentinel Ideals") {
      const norm = normalizeName(co.name);
      const active = hasEffect(co.name);
      const isActionIdeal = /ideal of the (artisan|tranquil|vigorous)/.test(norm);
      const targetCol = isActionIdeal ? action : bonus;
      const sScores = effectiveScores(profile, session);
      const fMod = Math.max(1, modifier(sScores.Wisdom), modifier(sScores.Charisma));
      const usesTag = imRes ? (" · " + imRes.value + "/" + imRes.max + " manifests") : "";
      if (norm === "ideal of the vigorous") {
        const tempGain = Math.floor((profile.level || 2) / 2) + fMod;
        actionEntry(action, co.name, "Manifest (action)" + usesTag + " · Gain +" + tempGain + " temporary HP", {
          use: () => update("Manifested Ideal of the Vigorous (+" + tempGain + " temporary HP)", next => {
            next.spent.idealManifests = (next.spent.idealManifests || 0) + 1;
            if (tempGain > (next.temp || 0)) { next.temp = tempGain; next.tempSource = "Ideal of the Vigorous"; }
          }),
          disabled: blocked || (imRes && imRes.value <= 0),
          details: () => showInfo(co.name, [["Pool", "Sentinel Ideals"]], co.description)
        });
      } else if (norm === "ideal of the tranquil") {
        const fpGain = Math.max(1, Math.floor(fMod / 2));
        actionEntry(action, co.name, "Manifest (action)" + usesTag + " · Regain +" + fpGain + " Force Points", {
          use: () => update("Manifested Ideal of the Tranquil (+" + fpGain + " FP)", next => {
            next.spent.idealManifests = (next.spent.idealManifests || 0) + 1;
            next.forceUsed = Math.max(0, (next.forceUsed || 0) - fpGain);
          }),
          disabled: blocked || (imRes && imRes.value <= 0),
          details: () => showInfo(co.name, [["Pool", "Sentinel Ideals"]], co.description)
        });
      } else {
        const idealManifestNotes = {
          "ideal of the agile": "Opportunity attacks against you have disadvantage (1 minute)",
          "ideal of the artisan": "Full Wisdom/Charisma modifier on two skills or tools (10 minutes)",
          "ideal of the contender": "Enhanced unarmed strikes & Wisdom/Charisma grapples (1 minute)",
          "ideal of the fighter": "Gain corresponding Fighting Mastery (1 minute)",
          "ideal of the hunter": "See in enhanced darkness & 10 ft blindsight (1 minute)",
          "ideal of the steadfast": "Half damage on save; maximum damage on natural 1 (1 minute)",
          "ideal of the titan": "Advantage & +5 ft distance on forced movement (1 minute)"
        };
        const mNote = idealManifestNotes[norm] || "1 minute";
        actionEntry(targetCol, co.name, active ? "Manifested · " + mNote : "Manifest" + usesTag + " · " + mNote, {
          use: () => {
            if (active) {
              toggleNamedEffect(co.name, mNote);
            } else {
              update("Manifested " + co.name, next => {
                next.spent.idealManifests = (next.spent.idealManifests || 0) + 1;
                next.effects.push(conditionEntry(co.name, 1, false, {id: newID(), note: mNote, persistent: true}));
              });
            }
          },
          pressed: active,
          disabled: blocked || (!active && imRes && imRes.value <= 0),
          details: () => showInfo(co.name, [["Pool", "Sentinel Ideals"]], co.description)
        });
      }
    }
  }
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

  if (hasFeat(session, "Empathic")) {
    actionEntry(action, "Empathic (Insight vs Deception)", "30 ft humanoid · Contested Insight vs. Deception for advantage on attacks & checks until end of next turn", {
      disabled: blocked,
      details: () => showFeat("Empathic", session.feats.find(f => normalizeName(f.name) === "empathic"))
    });
  }
  if (hasFeat(session, "Techie")) {
    const trd = characterResources(profile, session).find(r => r.id === "techieRepairDroid");
    actionEntry(action, "Repair Droid (Techie)", (trd?.value || 0) + "/1 (long rest) · Cast Repair Droid without wristpad or Tech Points", {
      use: () => update("Used Repair Droid (Techie)", next => { next.spent.techieRepairDroid = 1; }),
      disabled: blocked || !(trd?.value > 0),
      details: () => showFeat("Techie", session.feats.find(f => normalizeName(f.name) === "techie"))
    });
  }
  // Ally Aura of Vigor (Guardian) clickable temp HP trigger
  const allyVigor = (session.effects || []).find(e => normalizeName(e.name) === "aura of vigor (guardian)");
  if (allyVigor) {
    const vMod = Math.max(1, allyVigor.value || 1);
    actionEntry(freeTarget, "Aura of Vigor (Ally)", "Start of turn in Guardian Aura · Gain +" + vMod + " temporary HP", {
      use: () => update("Aura of Vigor · +" + vMod + " temporary HP", next => {
        if (vMod > (next.temp || 0)) { next.temp = vMod; next.tempSource = "Aura of Vigor"; }
      }),
      disabled: c.dead
    });
  }
  // Base class limited-use Combat buttons (Bad Feeling, Stroke of Luck, Calm and Collected)
  if (traits.isOperative && (profile.level || 1) >= 3) {
    const bf = characterResources(profile, session).find(r => r.id === "badFeeling");
    actionEntry(freeTarget, "Bad Feeling", (bf?.value || 0) + "/1 (short rest) · Move up to speed or draw weapon when rolling Initiative", {
      use: () => update("Used Bad Feeling", next => { next.spent.badFeeling = 1; }),
      disabled: !(bf?.value > 0),
      details: () => showInfo("Bad Feeling", [["Timing", "When rolling Initiative"]], classRule(profile, "Bad Feeling"))
    });
  }
  if (traits.isOperative && (profile.level || 1) >= 20) {
    const sol = characterResources(profile, session).find(r => r.id === "strokeOfLuck");
    actionEntry(freeTarget, "Stroke of Luck", (sol?.value || 0) + "/1 (short rest) · Turn a missed attack into a hit or treat a failed check as a 20", {
      use: () => update("Used Stroke of Luck", next => { next.spent.strokeOfLuck = 1; }),
      disabled: !(sol?.value > 0),
      details: () => showInfo("Stroke of Luck", [["Timing", "No action"]], classRule(profile, "Stroke of Luck"))
    });
  }
  if (traits.isScholar && (profile.level || 1) >= 14) {
    const cc = characterResources(profile, session).find(r => r.id === "calmAndCollected");
    const intM = modifier(effectiveScores(profile, session).Intelligence);
    actionEntry(freeTarget, "Calm and Collected", (cc?.value || 0) + "/" + (cc?.max || 5) + " (long rest) · Add " + signed(intM) + " (INT) to a saving throw vs seen effect", {
      use: () => update("Used Calm and Collected (" + signed(intM) + " save)", next => { next.spent.calmAndCollected = (next.spent.calmAndCollected || 0) + 1; }),
      disabled: !(cc?.value > 0),
      details: () => showInfo("Calm and Collected", [["Timing", "No action (on saving throw)"]], classRule(profile, "Calm and Collected"))
    });
  }
  if (hasFeat(session, "Snappy Interjection")) {
    const si = characterResources(profile, session).find(r => r.id === "snappyInterjection");
    actionEntry(reaction, "Snappy Interjection", (si?.value || 0) + "/1 (short rest) · Subtract 1d6 from a creature's attack roll within 60 ft", {
      use: () => update("Used Snappy Interjection", next => { next.spent.snappyInterjection = 1; }),
      disabled: !canReact(session) || !(si?.value > 0),
      details: () => showFeat("Snappy Interjection", session.feats.find(f => normalizeName(f.name) === "snappy interjection"))
    });
  }
  // Generic active/limited-use feat actions from VERIFIED_FEAT_COMBAT_ACTIONS
  for (const ft of (session.feats || [])) {
    const rec = featRule(ft.name);
    const ca = rec?.combatAction;
    if (!ca) continue;
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
        next.hitDice = Math.max(0, (next.hitDice || 0) - 1);
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
    actionEntry(col, rec.name + " (Feat)", prefix + ca.summary, {
      use: useFn,
      disabled: isDisabled,
      details: () => showFeat(rec.name, ft)
    });
  }
  if (hasFeat(session, "Bountiful Luck")) {
    actionEntry(reaction, "Bountiful Luck", "Ally within 30 ft rerolls a natural 1 on an attack, check, or save", {
      details: () => showFeat("Bountiful Luck", session.feats.find(f => normalizeName(f.name) === "bountiful luck"))
    });
  }
  if (hasFeat(session, "Inspiring Leader")) {
    const chaMod = modifier(effectiveScores(profile, session).Charisma);
    const amount = Math.max(1, profile.level + chaMod);
    actionEntry(freeTarget, "Inspiring Leader", "10-minute speech · Up to 6 allies gain " + amount + " temporary HP (once per short rest each)", {
      use: () => update("Inspiring Leader (+" + amount + " temporary HP)", next => {
        if (amount > next.temp) { next.temp = amount; next.tempSource = "Inspiring Leader"; }
      }),
      details: () => showFeat("Inspiring Leader", session.feats.find(f => normalizeName(f.name) === "inspiring leader"))
    });
  }
  if (hasFanatic(session)) {
    actionEntry(bonus, "Fanatic attack", "One weapon attack on critical hit or reducing a creature to 0 HP", {
      details: () => showFeat("Fanatic", session.feats.find(feat => normalizeName(feat.name) === "fanatic"))
    });
  }

  const blockingPhysicalShield = Boolean(armor.shield && !/generator/i.test(armor.shield.name));
  const twfCandidates = weapons.filter(w => {
    const st = weaponStats(profile, w, raging, session);
    return st && !st.doubleProp && (st.light || (traits.twfIgnoreLight && !st.twoHanded));
  });
  const totalTwfCount = twfCandidates.reduce((n, w) => n + Math.max(1, (w.detached ? 2 : (w.quantity || 1))), 0);
  const offhandWeapons = weapons.filter(w => {
    const st = weaponStats(profile, w, raging, session);
    if (!st) return false;
    if (st.doubleProp) {
      // SW5e PHB Ch. 9 Double-Weapon Fighting: requires light + double (unless dwfIgnoreLight) and two hands (no physical shield)
      return !blockingPhysicalShield && (st.light || traits.dwfIgnoreLight);
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
      // Double (XdY type): use the Double property dice & damage type
      const dm = stats.doubleProp.match(/(\d+)d(\d+)\s+([^)]+)/i);
      if (dm) {
        offStats.dice = Number(dm[1]);
        offStats.die = Number(dm[2]);
        offStats.type = dm[3].trim().toLowerCase();
      }
      // SW5e Double-Weapon Fighting: DO NOT add positive ability modifier to the ATTACK roll (unless Twin-Blade / Split Style); DO keep ability mod on damage!
      if (!traits.dwfAddAbilityModToHit && (stats.abilityMod || 0) > 0) {
        offStats.toHit = stats.toHit - stats.abilityMod;
      }
    } else if (!traits.twfAddAbilityMod && (stats.abilityMod || 0) > 0) {
      // SW5e Two-Weapon Fighting: DO NOT add positive ability modifier to the DAMAGE roll (unless Dual Wield / Split Style)
      offStats.bonus = stats.bonus - stats.abilityMod;
    }
    const labelSuffix = isDouble ? " · double-weapon" : " · off-hand";
    const styleNote = isDouble
      ? (traits.dwfAddAbilityModToHit ? " · Twin-Blade/Split Style" : " · no ability modifier to hit")
      : (traits.twfAddAbilityMod ? " · Dual Wield/Split Style" : " · no ability modifier to damage");
    actionEntry(bonus, item.name + labelSuffix, signed(offStats.toHit) + " to hit · " + damageNotation(offStats) + styleNote, {
      mode: attackMode(session, offStats, "offhand")
    });
  }

  // Reactions
  const opportunity = () => showInfo("Opportunity attack", [], "Use your reaction to make one melee attack just before a creature you can see leaves your reach.");
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
        mode: attackMode(session, stats, "reaction")
      });
    }
  }

  if (freeWrap && free) {
    freeWrap.hidden = !free.childElementCount;
  }
}

function pips(resource, value, max, cls = "") {
  if (max > 10) {
    const root = document.createElement("div");
    root.className = "resourcePoolControls";
    const label = resourceLabels[resource] || resource;
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
    const title = "Set " + (resourceLabels[resource] || resource) + " to " + next + " of " + max;
    const button = collectionButton(root, "", title, "resource", resource);
    button.title = (index <= value ? "Filled. " : "Empty. ") + title;
    button.className = ["pip", index <= value ? "on" : "", cls].join(" ");
    button.dataset.value = next;
  }
  return root;
}

function manaResourceBlock(parent, res, tempRes) {
  const isForce = res.id === "forcePoints";
  const kindCls = isForce ? "is-force" : "is-tech";
  const unit = isForce ? "FP" : "TP";
  const block = appendText(parent, "div", "");
  block.className = "resourceManaBlock " + kindCls;
  block.dataset.resourceBlock = res.id;

  const head = appendText(block, "div", "");
  head.className = "resourceManaHead";
  appendText(head, "span", res.label).className = "resourceName";
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

function resourceRow(parent, id, label, value, max, cls = "") {
  const row = appendText(parent, "div", "");
  const isPool = max > 10;
  const isWrapped = !isPool && max > 6;
  row.className = isPool ? "resourceRow resourcePoolRow" : isWrapped ? "resourceRow resourceWrappedPips" : "resourceRow";
  appendText(row, "span", label).className = "resourceName";
  if (isPool || isWrapped) {
    appendText(row, "b", value + "/" + max).className = "resourceCount";
    row.append(pips(id, value, max, cls));
  } else {
    row.append(pips(id, value, max, cls));
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
    } else {
      resourceRow(root, res.id, res.label, res.value, res.max);
    }
  }
  const death = getElementById("deathPips");
  death.replaceChildren();
  resourceRow(death, "successes", "Successes", session.death.successes, 3, "success");
  resourceRow(death, "failures", "Failures", session.death.failures, 3, "failure");
}

function changePip(id, value) {
  update("Updated " + (resourceLabels[id] || id), (session, profile) => {
    const resources = characterResources(profile, session);
    const res = resources.find(r => r.id === id);
    if (id === "hitDice") session.hitDice = clamp(value, 0, profile.level);
    else if (id === "successes" || id === "failures") session.death[id] = clamp(value, 0, 3);
    else if (id === "forcePoints" && res) session.forceUsed = clamp(res.max - value, 0, res.max);
    else if (id === "techPoints" && res) session.techUsed = clamp(res.max - value, 0, res.max);
    else if (id === "tempForce") session.tempForce = Math.max(0, value);
    else if (id === "tempTech") session.tempTech = Math.max(0, value);
    else if (id === "superiority" && res) session.superiorityUsed = clamp(res.max - value, 0, res.max);
    else if (id.startsWith("hlc:")) {
      const key = id.slice(4);
      if (!session.highLevelCasting) session.highLevelCasting = {level6: false, level7: false, level8: false, level9: false};
      session.highLevelCasting[key] = value === 0;
    } else if (res) {
      session.spent[id] = clamp(res.max - value, 0, res.max);
    }
  });
}

function showStandardActionsDialog() {
  const rulesText = [
    "### Dash",
    "Gain extra movement equal to your current speed for this turn.",
    "### Disengage",
    "Your movement does not provoke opportunity attacks for the rest of this turn.",
    "### Dodge",
    "Until the start of your next turn, attack rolls against you have disadvantage if you can see the attacker, and you have advantage on Dexterity saving throws (ends if incapacitated or speed drops to 0).",
    "### Guard",
    "Choose an ally within 5 feet. Until the start of your next turn, attack rolls against that ally have disadvantage if you can see the attacker. If an attack would hit the guarded ally, you can instead have it hit you (no action required) for maximum damage.",
    "### Help",
    "Give an ally advantage on their next ability check, or distract a creature within 5 feet so the next attack roll against it before your next turn has advantage.",
    "### Hide",
    "Make a Dexterity (Stealth) check to become hidden from creatures that cannot see you clearly.",
    "### Ready",
    "Prepare an action (or move up to your speed) to trigger as a reaction when a specified circumstance occurs before the start of your next turn.",
    "### Search",
    "Devote your attention to finding something with a Wisdom (Perception) or Intelligence (Investigation) check.",
    "### Use an Object",
    "Interact with a second object on your turn or use an item that requires an action.",
    "### Grapple & Shove (Special Melee Attacks)",
    "Replace one melee attack with a **Grapple** (Athletics contested by target's Athletics or Acrobatics) or **Shove** (Athletics contested to knock prone or push 5 ft)."
  ].join("\n\n");
  showInfo("Standard Combat Actions", [["System", "SW5e PHB Chapter 9"]], rulesText);
}
