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
  enhanceDroid: {label: "Choose Enhance Droid aspect", options: ["Servomotor (STR · 2× carry)", "Motivator (DEX · no 20ft fall)", "Power Core (Constitution · 2d6 temporary HP)", "Databanks (INT)", "Sensors (WIS)", "Relations (CHA)"]},
  alterSelf: {label: "Choose Alter Self form", options: ["Aquatic Adaptation (Swim)", "Natural Weapons (+1 & die step)", "Change Appearance"]},
  mutateAugment: {label: "Choose augmentations (select 1 or more)", multi: true, options: ["Hardened Flesh (Minimum AC 16)", "Tremorsense (30 ft)", "Burrow Speed", "Climb Speed", "Reach (+5 ft)", "Flexible (Advantage vs. Grapple/Restrain)"]},
  bestowCurse: {label: "Choose curse effect", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma", "Attack disadvantage vs caster", "WIS save or lose action", "+1d8 necrotic from caster"]},
  abilityCheckDisadv: {label: "Choose penalized ability", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]},
  blindOrDeafen: {label: "Choose condition", options: ["Blinded", "Deafened"]},
  skillExpertise: {label: "Choose proficient skill for Expertise", dynamicSkills: true},
  anySkill: {label: "Choose skill", allSkills: true},
  anyAbility: {label: "Choose saving throw ability", options: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]}
};

function powerChoiceConfig(choiceKind, profile = null, session = null) {
  const cfg = POWER_CHOICE_CONFIGS[choiceKind];
  if (!cfg) return null;
  if (cfg.allSkills) return {label: cfg.label, multi: false, options: Object.keys(skills).sort()};
  if (cfg.dynamicSkills) {
    const tr = (profile && typeof effectiveTraining === "function") ? effectiveTraining(profile, session) : {};
    const profSkills = Object.keys(skills).filter(sk => (tr[sk] || 0) >= 1).sort();
    return {label: cfg.label, multi: false, options: profSkills.length ? profSkills : Object.keys(skills).sort()};
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
  if (Array.isArray(sess?.powers)) return sess.powers;
  return [...new Set([
    ...(profile?.forcePowers || []),
    ...(profile?.customForcePowers || []),
    ...(profile?.techPowers || []),
    ...(profile?.customTechPowers || [])
  ])];
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

function powerCastOptions(profile, session, power) {
  const casting = castingStats(profile, session);
  const isTech = power.type === "Tech";
  const remaining = isTech ? casting.techTotalRemaining : casting.forceTotalRemaining;
  const maxLevel = isTech ? casting.maxTechLevel : casting.maxForceLevel;
  if (power.level === 0) {
    return [{level: 0, cost: 0, disabled: false, reason: ""}];
  }
  const top = Math.max(power.level, maxLevel || power.level);
  const options = [];
  for (let lvl = power.level; lvl <= top; lvl++) {
    const cost = powerPointCost(lvl);
    const hlcKey = lvl >= 6 ? "level" + lvl : "";
    const hlcUsed = Boolean(hlcKey && session.highLevelCasting?.[hlcKey]);
    const overMax = maxLevel > 0 && lvl > maxLevel;
    const lackPoints = (isTech ? casting.techMax : casting.forceMax) > 0 && cost > remaining;
    const reason = overMax ? "Above maximum power level" :
      hlcUsed ? "6th–9th level slot already used (long rest)" :
      lackPoints ? "Needs " + cost + " " + power.type + " points (" + remaining + " left)" : "";
    options.push({level: lvl, cost, hlcKey, disabled: Boolean(reason), reason});
  }
  return options;
}

function showPowerInfo(power) {
  if (!power) return;
  const meta = [
    ["Type", power.type + (power.alignment ? " · " + power.alignment : "")],
    ["Level", power.level ? "Level " + power.level + " (" + powerPointCost(power.level) + " points)" : "At-will"],
    ["Casting time", power.castingPeriodText],
    ["Range", power.range],
    ["Duration", (power.concentration ? "Concentration, " : "") + power.duration],
    ["Prerequisite", power.prerequisite],
    ["Sheet effects", summarizePowerEffects(power.effects)]
  ];
  const body = power.description + (power.higherLevel ? "\n\nAt Higher Levels: " + power.higherLevel : "");
  showInfo(power.name, meta, body);
}

function spendForcePoints(next, amount) {
  const cost = Math.max(0, Number(amount) || 0);
  const fromTemp = Math.min(cost, next.tempForce || 0);
  next.tempForce = Math.max(0, (next.tempForce || 0) - fromTemp);
  next.forceUsed = (next.forceUsed || 0) + (cost - fromTemp);
}

function endConcentration(session) {
  const old = session.concentration;
  session.concentration = "";
  if (!old) return;
  const oldKey = normalizeName(old);
  session.effects = (session.effects || []).filter(e => !(e.fromConcentration && normalizeName(e.name) === oldKey));
}

function buildPowerEffectEntry(power, castLevel, choice = "", choices = null, fromConcentration = false) {
  const noteParts = [power.duration, power.concentration ? "Concentration" : ""].filter(Boolean);
  const extra = {id: newID(), note: noteParts.join(" · "), persistent: true, castLevel, fromConcentration: Boolean(fromConcentration && power.concentration)};
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
  }
  return conditionEntry(power.name, 1, false, extra);
}

const FEC_SPECS = {
  "careful power": {
    cost: () => 1,
    applies: p => /saving throw/i.test(p.description || ""),
    note: "Protect allies on save"
  },
  "distant power": {
    cost: () => 1,
    applies: p => p.range && !/^self\b/i.test(p.range),
    note: "Double range (Touch → 30 ft)"
  },
  "extended power": {
    cost: () => 1,
    applies: p => /minute|hour|day/i.test(p.duration || ""),
    note: "Double duration (up to 24 hr)"
  },
  "heightened power": {
    cost: () => 3,
    applies: p => /saving throw/i.test(p.description || ""),
    note: "Disadvantage on target's first save"
  },
  "improved power": {
    cost: () => 1,
    stackable: true,
    applies: p => /damage/i.test(p.description || "") || (p.roles || []).includes("Damage"),
    note: "Reroll damage dice"
  },
  "lingering power": {
    cost: () => 3,
    applies: p => Boolean(p.concentration),
    note: "Persists 1 turn after concentration ends"
  },
  "pinpoint power": {
    cost: () => 1,
    applies: p => /saving throw/i.test(p.description || "") && /\b(cone|cube|cylinder|line|sphere|radius|each creature)\b/i.test(p.description || ""),
    note: "Convert area save to ranged attack"
  },
  "quickened power": {
    cost: () => 2,
    applies: p => p.castingPeriod === "Action",
    note: "Cast as Bonus Action"
  },
  "twinned power": {
    cost: lvl => Math.max(1, lvl || 0),
    applies: p => p.range && !/^self\b/i.test(p.range) && !/\b(cone|cube|cylinder|line|sphere|radius|each creature)\b/i.test(p.description || ""),
    note: "Target a second creature"
  }
};

function applicableForceEmpoweredOptions(profile, session, power) {
  if (!power || power.type !== "Force") return [];
  if (typeof ownedClassOptions !== "function") return [];
  const owned = ownedClassOptions(profile, session).filter(o => o.poolName === "Force-Empowered Castings");
  const out = [];
  for (const opt of owned) {
    const spec = FEC_SPECS[normalizeName(opt.name)];
    if (spec && spec.applies(power)) {
      out.push({name: opt.name, spec, summary: opt.summary || spec.note});
    }
  }
  return out;
}

function castPower(powerName, castLevel, trackEffect = false, choice = "", choices = null, extra = {}) {
  const {profile, session} = app.character;
  const power = knownPowerRecords(profile, "", session).find(p => normalizeName(p.name) === normalizeName(powerName)) || powerRule(powerName);
  if (!power) return;
  const fecCost = Math.max(0, Number(extra?.fecCost) || 0);
  const fecNames = Array.isArray(extra?.fecNames) ? extra.fecNames : [];
  const cost = powerPointCost(castLevel) + fecCost;
  const isTech = power.type === "Tech";
  const choiceTag = Array.isArray(choices) && choices.length ? " · " + choices.join(", ") : (choice ? " · " + choice : "");
  const fecTag = fecNames.length ? " · " + fecNames.join(" + ") : "";
  const label = "Cast " + power.name + (castLevel ? " (Level " + castLevel + " · " + cost + " " + power.type + " points)" : (cost ? " (At-will · " + cost + " " + power.type + " points)" : " (At-will)")) + fecTag + choiceTag;
  update(label, next => {
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
    if (castLevel >= 6 && castLevel <= 9) {
      if (!next.highLevelCasting) next.highLevelCasting = {level6: false, level7: false, level8: false, level9: false};
      next.highLevelCasting["level" + castLevel] = true;
    }
    if (power.concentration) {
      endConcentration(next);
      next.concentration = power.name;
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
      if (power.effects?.charges || power.effects?.maxHPBase || power.effects?.choiceKind) {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== normalizeName(power.name));
      }
      next.effects.push(buildPowerEffectEntry(power, castLevel, choice, choices, Boolean(power.concentration)));
      if (power.effects?.maxHPBase) {
        const gain = power.effects.maxHPBase + Math.max(0, castLevel - (power.effects.baseLevel || 1)) * (power.effects.maxHPPerUpcast || 0);
        next.hp += gain;
      }
    }
    if (extra?.applyAshlaSelf && castLevel >= 1 && !isTech && power.alignment === "Light") {
      const prev = (next.effects || []).find(e => normalizeName(e.name) === "force affinity: ashla")?.value || 0;
      next.effects = (next.effects || []).filter(e => normalizeName(e.name) !== "force affinity: ashla");
      next.effects.push(conditionEntry("Force Affinity: Ashla", castLevel, false, {
        id: newID(),
        note: "+" + castLevel + " maximum & current HP (1 minute)",
        persistent: false
      }));
      const delta = castLevel - prev;
      if (delta > 0) next.hp = Math.min(hitPointMaximum(profile, next), (next.hp || 0) + delta);
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
  if (kind === "BonusAction" && typeof hasClassOption === "function" && hasClassOption(profile, session, "Quickened Power")) {
    return all.filter(p => p.castingPeriod === "BonusAction" || (p.type === "Force" && p.castingPeriod === "Action"));
  }
  return all.filter(p => p.castingPeriod === kind);
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
    const effSummary = summarizePowerEffects(power.effects);
    if (effSummary) appendText(body, "p", "Sheet effects: " + effSummary).className = "muted";
    const desc = appendText(body, "div", "");
    desc.className = "infoRules";
    appendRules(desc, power.description + (power.higherLevel ? "\n\nAt Higher Levels: " + power.higherLevel : ""));

    if (power.concentration && session.concentration && normalizeName(session.concentration) !== normalizeName(power.name)) {
      appendText(body, "p", "Casting this ends Concentration on " + session.concentration + ".").className = "importWarning";
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
    if (kind === "BonusAction" && power.castingPeriod === "Action" && fecOptions.some(o => normalizeName(o.name) === "quickened power")) {
      selectedFec.add("Quickened Power");
    }
    const extraFecCostForLevel = lvl => {
      let total = 0;
      for (const opt of fecOptions) {
        if (selectedFec.has(opt.name)) total += opt.spec.cost(lvl);
      }
      return total;
    };

    if (fecOptions.length) {
      const fecWrap = appendText(body, "div", "");
      fecWrap.style.marginTop = "10px";
      appendText(fecWrap, "small", "Force-Empowered Casting (optional)").className = "muted";
      const fecPills = appendText(fecWrap, "div", "");
      fecPills.className = "row wrap";
      fecPills.style.marginTop = "6px";
      const renderFecPills = () => {
        fecPills.replaceChildren();
        for (const opt of fecOptions) {
          const baseC = opt.spec.cost(power.level || 1);
          const costLbl = normalizeName(opt.name) === "twinned power" ? "+" + (power.level ? "level" : "1") + " FP" : "+" + baseC + " " + (baseC === 1 ? "point" : "points");
          const pill = appendText(fecPills, "button", opt.name + " (" + costLbl + ")");
          pill.type = "button";
          pill.className = "swPropChip";
          pill.title = opt.summary;
          pill.setAttribute("aria-pressed", String(selectedFec.has(opt.name)));
          pill.addEventListener("click", () => {
            if (selectedFec.has(opt.name)) {
              selectedFec.delete(opt.name);
            } else {
              // SW5e rule: only 1 Force-Empowered Casting per cast, except Improved Power which stacks with 1 other
              if (!opt.spec.stackable) {
                for (const existingName of [...selectedFec]) {
                  const exSpec = FEC_SPECS[normalizeName(existingName)];
                  if (!exSpec?.stackable) selectedFec.delete(existingName);
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

    // Dynamic Force Affinity (Ashla on Light Side leveled powers; Bogan note on Dark Side) & Disciple of Life
    const traits = characterTraits(profile, session);
    const hasAshla = traits.isConsular && (profile.level || 1) >= 3 && session.forceAffinity === "Ashla" && power.type === "Force" && power.alignment === "Light" && power.level >= 1;
    let ashlaTarget = "self";
    if (hasAshla) {
      const ashlaWrap = appendText(body, "div", "");
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
    } else if (traits.isConsular && (profile.level || 1) >= 3 && session.forceAffinity === "Bogan" && power.type === "Force" && power.alignment === "Dark") {
      appendText(body, "small", "Force Affinity: Bogan — Dark side power damage rolls gain a minimum roll threshold.").className = "muted";
    }
    const hasDisciple = normalizeName(session.approach) === "way of sage" || (profile.customFeatures || []).some(f => normalizeName(f.name) === "disciple of life");
    if (hasDisciple && power.type === "Force" && power.level >= 1 && (power.roles || []).includes("Healing")) {
      appendText(body, "small", "Disciple of Life — Restores +(2 + power level) extra hit points (Wisdom or Charisma).").className = "muted";
    }

    const syncCastDisabled = () => {
      const needsChoice = Boolean(choiceCfg && trackCheckbox?.checked);
      const hasChoice = choiceCfg?.multi ? selectedChoices.size > 0 : Boolean(selectedChoice);
      const reasons = [];
      if (needsChoice && !hasChoice) reasons.push(choiceCfg.label + " to enable casting.");
      const remPoints = power.type === "Tech" ? casting.techTotalRemaining : casting.forceTotalRemaining;
      for (const {btn, opt} of castButtons) {
        const extraC = extraFecCostForLevel(opt.level);
        const totalCost = opt.cost + extraC;
        btn.textContent = opt.level === 0
          ? (totalCost > 0 ? "Cast at-will (" + totalCost + " " + (totalCost === 1 ? "point" : "points") + ")" : "Cast at-will")
          : "Cast Level " + opt.level + " (" + totalCost + " " + (totalCost === 1 ? "point" : "points") + ")";
        const lackTotal = totalCost > 0 && (power.type === "Tech" ? casting.techMax : casting.forceMax) > 0 && totalCost > remPoints;
        const reason = opt.reason || (lackTotal ? "Needs " + totalCost + " " + power.type + " points (" + remPoints + " left)" : "");
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
    const row = appendText(body, "div", "");
    row.className = "row wrap";
    row.style.marginTop = "12px";
    for (const opt of opts) {
      const label = opt.level === 0 ? "Cast at-will" : "Cast L" + opt.level + " (" + opt.cost + " points)";
      const btn = appendText(row, "button", label);
      btn.type = "button";
      btn.disabled = opt.disabled;
      if (opt.reason) btn.title = opt.reason;
      castButtons.push({btn, opt});
      btn.addEventListener("click", () => {
        const track = Boolean(trackCheckbox?.checked);
        const extraC = extraFecCostForLevel(opt.level);
        getElementById("castDialog").close();
        castPower(power.name, opt.level, track, selectedChoice, choiceCfg?.multi ? [...selectedChoices] : null, {
          fecNames: [...selectedFec],
          fecCost: extraC,
          applyAshlaSelf: hasAshla && ashlaTarget === "self"
        });
      });
    }
    syncCastDisabled();
    const pNums = powerCastingNumbers(casting, power);
    const pool = power.type === "Tech"
      ? "Tech Points: " + casting.techRemaining + "/" + casting.techMax + (casting.tempTech ? " (+" + casting.tempTech + " temporary)" : "") + " · DC " + pNums.dc + " · " + signed(pNums.attack) + " to hit (" + pNums.ability + ")"
      : "Force Points: " + casting.forceRemaining + "/" + casting.forceMax + (casting.tempForce ? " (+" + casting.tempForce + " temporary)" : "") + " · " + (power.alignment || "Universal") + " DC " + pNums.dc + " · " + signed(pNums.attack) + " to hit (" + pNums.ability + ")";
    appendText(body, "small", pool).className = "muted";
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
      const dcLabel = casting.lightDC !== casting.darkDC
        ? "Light DC " + casting.lightDC + " (" + signed(casting.lightAttack) + " " + casting.lightAbility + ") · Dark DC " + casting.darkDC + " (" + signed(casting.darkAttack) + " " + casting.darkAbility + ")"
        : "DC " + casting.forceDC + " (" + signed(casting.forceAttack) + " · " + casting.forceAbility + ")";
      meta.textContent = records.length + " known · " + dcLabel +
        (casting.forceMax ? " · " + casting.forceRemaining + "/" + casting.forceMax + (casting.tempForce ? " (+" + casting.tempForce + " temporary)" : "") + " points" : "");
    } else {
      meta.textContent = records.length + " known · DC " + casting.techDC + " (" + signed(casting.techAttack) + " · " + casting.techAbility + ")" +
        (casting.techMax ? " · " + casting.techRemaining + "/" + casting.techMax + " points" : "");
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
    const summary = [
      p.castingPeriodText,
      p.range,
      (p.concentration ? "Concentration, " : "") + p.duration,
      summarizePowerEffects(p.effects)
    ].filter(Boolean).join(" · ");
    const controls = collectionRow(root, p.name, summary, () => showPowerInfo(p));
    const castBtn = ownedControl(controls, "Cast", p.name, event => openCastChooser("all", event.currentTarget, p.name));
    castBtn.disabled = blocked;
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

function renderPowerLibrary() {
  const list = getElementById("powerCatalogList");
  if (!list || typeof SW5E_POWERS === "undefined") return;
  const {profile, session} = app.character;
  const knownSet = new Set(activePowerNames(profile, session).map(normalizeName));
  const title = getElementById("powerCatalogTitle");
  if (title) title.textContent = powerLibraryType + " power library";
  const query = (getElementById("powerSearch")?.value || "").trim().toLowerCase();
  const levelFilter = powerLevelFilterVal;

  const matches = SW5E_POWERS.filter(p => {
    if (p.type !== powerLibraryType) return false;
    if (levelFilter !== "" && String(p.level) !== levelFilter) return false;
    if (!query) return true;
    return (p.name + " " + p.alignment + " " + p.castingPeriodText + " " + (p.description || "")).toLowerCase().includes(query);
  }).map(p => {
    const owned = knownSet.has(normalizeName(p.name));
    const prereq = typeof checkPowerPrerequisite === "function"
      ? checkPowerPrerequisite(profile, session, p)
      : {met: true, reason: ""};
    return {p, owned, prereq};
  }).sort((a, b) => Number(b.owned || b.prereq.met) - Number(a.owned || a.prereq.met) || a.p.level - b.p.level || a.p.name.localeCompare(b.p.name));

  const totalPages = Math.max(1, Math.ceil(matches.length / powerLibraryPageSize));
  powerLibraryPage = clamp(powerLibraryPage, 0, totalPages - 1);
  const start = powerLibraryPage * powerLibraryPageSize;
  const slice = matches.slice(start, start + powerLibraryPageSize);

  list.replaceChildren();
  if (!slice.length) appendText(list, "p", "No matching powers found.").className = "muted";

  let showedLockedHeader = false;
  for (const {p, owned, prereq} of slice) {
    if (!owned && !prereq.met && !showedLockedHeader) {
      showedLockedHeader = true;
      appendText(list, "h3", "Prerequisites Not Met");
    }
    const summary = [
      !owned && !prereq.met ? prereq.reason : "",
      p.alignment,
      p.level ? "Level " + p.level + " (" + powerPointCost(p.level) + " points)" : "At-will",
      p.castingPeriodText,
      (p.concentration ? "Concentration, " : "") + p.duration,
      summarizePowerEffects(p.effects)
    ].filter(Boolean).join(" · ");
    const actions = collectionRow(list, p.name, summary, () => showPowerInfo(p));
    const btn = ownedControl(actions, owned ? "Remove" : (!prereq.met ? "Locked" : "Add"), p.name, () => {
      if (owned) removeKnownPower(p.name);
      else if (prereq.met) addKnownPower(p.name);
      renderPowerLibrary();
    });
    if (!owned && !prereq.met) {
      btn.disabled = true;
      btn.title = prereq.reason;
    }
  }

  const status = getElementById("powerPageStatus");
  if (status) {
    status.textContent = matches.length
      ? "Showing " + (start + 1) + "–" + Math.min(matches.length, start + slice.length) + " of " + matches.length + " " + powerLibraryType.toLowerCase() + " powers"
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
    for (const id of ["powerSearch"]) {
      getElementById(id)?.addEventListener("input", () => { powerLibraryPage = 0; renderPowerLibrary(); });
      getElementById(id)?.addEventListener("change", () => { powerLibraryPage = 0; renderPowerLibrary(); });
    }
    getElementById("previousPowerPage")?.addEventListener("click", () => { powerLibraryPage--; renderPowerLibrary(); });
    getElementById("nextPowerPage")?.addEventListener("click", () => { powerLibraryPage++; renderPowerLibrary(); });
  }

  for (const id of ["knownForceSearch", "knownTechSearch"]) {
    getElementById(id)?.addEventListener("input", () => renderPowerManager(app.character.profile, app.character.session));
  }
}
