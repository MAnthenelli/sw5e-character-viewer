let selectedEffectName = "";
let selectedEffectChoiceVal = "";
let selectedEffectChoicesMulti = new Set();
let selectedEffectGroup = "conditions";

function formatDurationSpec(spec) {
  if (!spec || typeof spec !== "object") return "";
  const a = spec.anchor;
  if (!a || a === "instant" || a === "onUse" || a === "permanent") return "";
  if (a === "concentration") return "Concentration";
  if (a === "endOfOwnTurn") return "Until end of your turn";
  if (a === "startOfOwnNextTurn") return "Until start of your next turn";
  if (a === "endOfOwnNextTurn") return "Until end of your next turn";
  if (a === "endOfTargetTurn") return "Until end of target's turn";
  if (a === "startOfTargetNextTurn") return "Until start of target's next turn";
  if (a === "endOfTargetNextTurn") return "Until end of target's next turn";
  if (a === "startOfSourceNextTurn") return "Until start of source's next turn";
  if (a === "endOfSourceNextTurn") return "Until end of source's next turn";
  if (a === "untilShortRest") return "Until short rest";
  if (a === "untilShortOrLongRest") return "Until short or long rest";
  if (a === "untilLongRest") return "Until long rest";
  if (a === "timed" && Number(spec.value) > 0 && spec.unit) {
    const v = Number(spec.value);
    const u = String(spec.unit).toLowerCase();
    return v + " " + u + (v === 1 ? "" : "s");
  }
  return "";
}

function _normDurText(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\bmins?\b/g, "minute")
    .replace(/\bminutes\b/g, "minute")
    .replace(/\bhrs?\b/g, "hour")
    .replace(/\bhours\b/g, "hour")
    .replace(/\brounds\b/g, "round")
    .replace(/\bdays\b/g, "day")
    .replace(/\byour next turn\b/g, "next turn")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isDurationDuplicated(durText, existingTexts) {
  const nd = _normDurText(durText);
  if (!nd) return true;
  const combined = _normDurText((existingTexts || []).filter(Boolean).join(" "));
  if (!combined) return false;
  if (combined.includes(nd)) return true;
  const stripped = nd.replace(/^until /, "");
  return Boolean(stripped && combined.includes(stripped));
}

function formatTurnTriggerCue(trig, profile, session) {
  if (!trig || typeof trig !== "object") return null;
  const baseTiming = trig.timing === "startOfTurn" ? "Start of turn"
    : trig.timing === "endOfTurn" ? "End of turn"
    : trig.timing === "enterArea" ? "On entering area"
    : "";
  if (!baseTiming) return null;
  const actorPrefix = trig.actor === "target" ? "Target · " : (trig.actor === "source" ? "Source · " : "");
  const areaSuffix = trig.inArea && trig.timing !== "enterArea" ? " (in area)" : "";
  const label = actorPrefix + baseTiming + areaSuffix;
  const rawNote = String(trig.note || "").trim();
  const note = typeof interpolateRuleTokens === "function"
    ? interpolateRuleTokens(rawNote, profile, session)
    : rawNote;
  return { label, note };
}

function renderEffects(profile, session) {
  const root = getElementById("effects");
  const condRoot = getElementById("conditionList");
  const previouslyOpen = new Set([
    ...[...root.querySelectorAll("details[open]")].map(entry => entry.dataset.entry),
    ...[...condRoot.querySelectorAll("details[open]")].map(entry => entry.dataset.entry)
  ]);
  root.replaceChildren();
  condRoot.replaceChildren();
  let count = 0;

  const makeEntry = (container, id, name, noteText) => {
    const row = appendText(container, "details", "");
    row.dataset.entry = id;
    row.open = previouslyOpen.has(id);
    const title = appendText(row, "summary", "");
    appendText(title, "b", name);
    if (noteText) appendText(title, "span", noteText).className = "entryNote";
    count++;
    return row;
  };

  const effectActionBar = row => {
    let bar = row.querySelector(":scope > .effectActions");
    if (!bar) {
      bar = appendText(row, "div", "");
      bar.className = "row wrap effectActions";
    }
    return bar;
  };
  const addFullRulesBtn = (parent, labelName, cb) => {
    const b = appendText(parent, "button", "Full rules");
    b.type = "button";
    b.className = "fullRulesBtn";
    b.setAttribute("aria-label", "Full rules for " + labelName);
    b.addEventListener("click", cb);
    return b;
  };

  const concNames = typeof activeConcentrations === "function" ? activeConcentrations(session) : [session.concentration, session.concentration2].filter(Boolean);
  const concNormSet = new Set(concNames.map(normalizeName));
  const dualConcTrigs = concNames.length >= 2 && typeof resolveCastingEffects === "function"
    ? (resolveCastingEffects(profile, session).dualConcentrationTriggers || [])
    : [];
  for (const cName of concNames) {
    const cNorm = normalizeName(cName);
    const hasRow = Boolean(cNorm && (session.effects || []).some(e => normalizeName(e.name) === cNorm));
    if (hasRow) continue;
    const power = powerRule(cName);
    const row = makeEntry(root, "concentration", concNames.length >= 2 ? "Concentrating (Dual)" : "Concentrating", cName);
    if (power?.duration) appendText(row, "p", power.duration);
    for (const trig of dualConcTrigs) {
      const cue = formatTurnTriggerCue(trig, profile, session);
      if (!cue || !cue.note) continue;
      const tp = appendText(row, "p", "");
      tp.className = "effectTrigger";
      appendText(tp, "strong", cue.label + ": ");
      tp.appendChild(document.createTextNode(cue.note));
    }
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    if (power) addFullRulesBtn(actRow, power.name, () => showPowerInfo(power));
    const dropBtn = appendText(actRow, "button", "Drop concentration");
    dropBtn.type = "button";
    dropBtn.addEventListener("click", () =>
      update("Ended concentration on " + cName, next => { endConcentration(next, cName); }));
  }

  if (session.rage) {
    const isSplashRage = session.rage.source === "Splashclass";
    const isPersistentRage = !isSplashRage && (profile.level || 1) >= 15 && normalizeName(profile.className) === "berserker";
    const rageDmgDisp = isSplashRage ? 2 : (typeof effectiveRageStats === "function" ? effectiveRageStats(profile, session).rageDamage : profile.rageDamage);
    const rageGrant = isSplashRage && typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined"
      ? (SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className) === "berserker")?.effects || []).find(e => e.type === "actionGrant")
      : null;
    const rageDur = formatDurationSpec(rageGrant?.durationSpec || { anchor: "timed", value: 1, unit: "minute" });
    const rageSummaryParts = ["Resistance: " + resistanceNames(profile, session).join(", ")];
    if (rageDur) rageSummaryParts.push(rageDur);
    const row = makeEntry(root, "rage", isSplashRage ? "Rage · Splashclass" : (session.rage.frenzy ? "Rage · Frenzied" : "Rage"),
      rageSummaryParts.join(" · "));
    appendText(row, "p",
      "Advantage on Strength checks and saves. " + signed(rageDmgDisp) + " damage on Strength melee weapon attacks." +
      (normalizeName(session.approach) === "frenzied approach" ? " Maniacal Rage grants advantage on Intimidation." : "") +
      (isPersistentRage ? " Persistent Rage: ends early only if unconscious or ended." : "") +
      (session.rage.exhaustionDue ? " Gain 1 exhaustion when this Rage ends." : ""));
    const rageTriggers = isSplashRage
      ? (Array.isArray(rageGrant?.turnTriggers) ? rageGrant.turnTriggers : [])
      : (isPersistentRage ? [] : [{ timing: "endOfTurn", actor: "self", kind: "prompt", note: "Ends early if you haven't taken a hostile action or taken damage since your last turn." }]);
    for (const trig of rageTriggers) {
      const cue = formatTurnTriggerCue(trig, profile, session);
      if (cue && cue.note) {
        const tp = appendText(row, "p", "");
        tp.className = "effectTrigger";
        appendText(tp, "strong", cue.label + ": ");
        tp.appendChild(document.createTextNode(cue.note));
      }
    }
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    const rageRuleText = isSplashRage
      ? (typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined" ? (SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className) === "berserker")?.description || "") : "")
      : classRule(profile, "Rage");
    addFullRulesBtn(actRow, "Rage", () => showInfo(isSplashRage ? "Splashclass: Rage" : "Rage", [["Resistance", resistanceNames(profile, session).join(", ")]], rageRuleText));
    const endRageBtn = appendText(actRow, "button", "End Rage");
    endRageBtn.type = "button";
    endRageBtn.addEventListener("click", () => update("Ended Rage", endRage));
  }

  const conditions = conditionState(session, profile);
  if (session.reckless) {
    const row = makeEntry(root, "reckless", "Reckless Attack", "Advantage on Strength melee attacks · incoming advantage");
    appendText(row, "p", "Advantage on melee weapon attack rolls using Strength during this turn; attack rolls against you have advantage until your next turn.");
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    addFullRulesBtn(actRow, "Reckless Attack", () => showInfo("Reckless Attack", [["Source", "Berserker 2"]], classRule(profile, "Reckless Attack")));
    const endReckBtn = appendText(actRow, "button", "End Reckless Attack");
    endReckBtn.type = "button";
    endReckBtn.addEventListener("click", () => update("Cleared Reckless Attack", next => { next.reckless = false; }));
  }

  for (const ce of session.consumableEffects || []) {
    const row = makeEntry(root, "consumable:" + ce.id, ce.name, ce.duration || "Active");
    if (ce.note) appendText(row, "p", ce.note);
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    if (ce.rules) addFullRulesBtn(actRow, ce.name, () => showInfo(ce.name, [["Duration", ce.duration]], ce.rules));
    const endBtn = appendText(actRow, "button", "End effect");
    endBtn.type = "button";
    endBtn.addEventListener("click", () =>
      update("Ended " + ce.name, next => {
        next.consumableEffects = (next.consumableEffects || []).filter(entry => entry.id !== ce.id);
      }));
  }

  if (conditions.dead) {
    makeEntry(condRoot, "dead", "Dead", session.exhaustion >= 6 ? "Exhaustion 6" : "3 failed death saves");
  }

  if (session.exhaustion) {
    const row = makeEntry(condRoot, "exhaustion", "Exhaustion " + session.exhaustion, conditions.ignoreExhaustion ? "Immune" : "");
    const ctrl = appendText(row, "div", "");
    ctrl.className = "exhaustionControl";
    appendText(ctrl, "span", "Level").className = "muted";
    const chips = appendText(ctrl, "div", "");
    chips.className = "directChips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Exhaustion level");
    for (let n = 1; n <= 6; n++) {
      const b = appendText(chips, "button", n === 6 ? "6 · Death" : String(n));
      b.type = "button";
      b.setAttribute("aria-pressed", String(session.exhaustion === n));
      b.addEventListener("click", () => update("Set Exhaustion to " + n, next => { next.exhaustion = n; }));
    }
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    addFullRulesBtn(actRow, "Exhaustion", () => showInfo("Exhaustion", [["Current level", session.exhaustion]], SW5E_CONDITIONS.Exhaustion));
    const remExhBtn = appendText(actRow, "button", "Remove exhaustion");
    remExhBtn.type = "button";
    remExhBtn.addEventListener("click", () =>
      update("Cleared exhaustion", next => { next.exhaustion = 0; }));
  }

  if (conditions.unconscious && !session.hp && !conditions.dead && !session.effects.some(effect => effect.name === "Unconscious")) {
    const row = makeEntry(condRoot, "hp-zero", "Unconscious", "0 HP");
    const actRow = appendText(row, "div", "");
    actRow.className = "row wrap effectActions";
    addFullRulesBtn(actRow, "Unconscious", () => showInfo("Unconscious", [], SW5E_CONDITIONS.Unconscious));
  }

  const groups = new Map();
  for (const entry of session.effects || []) {
    const key = "eff:" + entry.name.toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }

  for (const [key, groupEntries] of groups) {
    const first = groupEntries[0];
    const name = first.name;
    const def = effectCatalogByName.get(name.toLowerCase());
    const pRule = powerRule(name);
    const fRule = typeof lightsaberFormRule === "function" ? lightsaberFormRule(name) : null;
    const ruleText = SW5E_CONDITIONS[name] || def?.rules || pRule?.description || fRule?.description || "";
    const suppressed = conditions.immunities.has(name) || [...conditions.immunities].some(im => String(im || "").toLowerCase() === name.toLowerCase());
    const suspendedByPetrified = Boolean(conditions.petrified && (normalizeName(name) === "poisoned" || normalizeName(name) === "diseased"));
    const formatDetail = entry => {
      if (entry.name === "Ignited") return (entry.value || 1) + " fire/turn";
      if (entry.name === "Force-Empowered Self: Slow Time") return "+" + (entry.value || 10) + " ft";
      if (entry.name === "Force-Empowered Self: Deflection") return "+" + (entry.value || 2) + " AC";
      if (entry.name === "Evasive Footwork" || entry.name === "Primal Endurance" || entry.name === "Dual Wield AC" || entry.name === "Blade Focus: Parry") return "+" + (entry.value || 1) + " AC";
      if (entry.name === "Polearm Focus: Choke Up") return "+5 ft reach";
      if (entry.name === "Steady the Nerves") return "+" + (entry.value || 1) + " saves";
      if (entry.name === "Precise Movements" || entry.name === "Charge") return "+" + (entry.value || 5) + " ft";
      if (entry.name === "Incite") return "+" + (entry.value || 1) + " damage";
      if (entry.name === "Adrenaline Hit") return "−" + (entry.value || 1) + " incoming damage";
      if (entry.name === "Enhancement Injection") return "+" + (entry.value || 1) + " Strength / Constitution";
      if (entry.name === "One Step Ahead") return "+" + (entry.value || 1) + " Initiative";
      if (entry.name === "Parry") return "−" + (entry.value || 1) + " melee damage";
      if (entry.name === "Self-Preservation" || entry.name === "Firewall" || entry.name === "Heads Up") return "+" + (entry.value || 1) + " save";
      if (entry.name === "One with the Force") return "+" + (entry.value || 1) + " Constitution save";
      if (entry.name === "Targeted Strike") return "+" + (entry.value || 1) + " attack & damage";
      if (entry.name === "Conceal") return "+" + (entry.value || 1) + " Stealth";
      if (entry.name === "Flex") return "+" + (entry.value || 1) + " Athletics";
      if (entry.name === "Perceive") return "+" + (entry.value || 1) + " Perception";
      if (entry.name === "Tumble") return "+" + (entry.value || 1) + " Acrobatics";
      if (entry.name === "Program") return "+" + (entry.value || 1) + " Technology";
      if (entry.name === "Study") return "+" + (entry.value || 1) + " Lore";
      if (entry.name === "Survive") return "+" + (entry.value || 1) + " Survival";
      if (entry.name === "Threaten") return "+" + (entry.value || 1) + " Intimidation";
      if (entry.name === "Assess the Situation") return "+" + (entry.value || 1) + " Perception / Investigation";
      if (entry.name === "Wild Senses") return "+" + (entry.value || 1) + " Perception / Survival";
      if (entry.name === "Aura of Presence") return "+" + (entry.value || 1) + " saves";
      if (entry.name === "Aura of Hatred") return "+" + (entry.value || 1) + " melee damage";
      if (entry.name === "Aura of Vigor (Guardian)") return "+" + (entry.value || 1) + " temporary HP per turn";
      if (entry.targetScope === "allies") {
        const rad = entry.auraRadius ? " within " + entry.auraRadius : "";
        return "Allies" + rad + (entry.choice ? " · " + entry.choice : "");
      }
      if (entry.targetScope === "self") {
        return "Self" + (entry.choice ? " · " + entry.choice : "");
      }
      if (entry.name === "Sharpshooter's Routine") return "+" + (entry.value || 1) + " first attack";
      if (entry.name === "Potent Aptitude") return "+" + (entry.value || 1) + " die";
      const lfCanon = typeof lightsaberFormRule === "function" ? lightsaberFormRule(entry.name)?.name : "";
      if (lfCanon === "Soresu Form") return entry.soresuUsed ? "First hit halved (used)" : "First weapon hit halved";
      if (lfCanon === "Shien Form") return "AC vs 1 attack";
      if (entry.chargesMax > 0) {
        return entry.perTurnCharges ? (entry.surgeActive ? "Surge active" : "Standby") : "";
      }
      if (Array.isArray(entry.choices) && entry.choices.length) return entry.choices.join(", ");
      if (entry.choice) return entry.choice;
      return conditionFields[entry.name] ? "Level " + (entry.value || 1) : "";
    };

    const isStandbyPower = Boolean((first.perTurnCharges || pRule?.effects?.charges?.perTurn) && first.surgeActive === false);
    const powerSummary = (pRule?.effects && !isStandbyPower) ? summarizePowerEffects(pRule.effects, first.choice || (first.choices || []).join(", ")) : "";
    const firstDur = formatDurationSpec(first.durationSpec);
    let summaryNote = "";
    if (suspendedByPetrified) summaryNote = "Suspended (Petrified)";
    else if (suppressed) summaryNote = "Immune";
    else if (groupEntries.length > 1) {
      const uniqDurs = [...new Set(groupEntries.map(e => formatDurationSpec(e.durationSpec)).filter(Boolean))];
      summaryNote = uniqDurs.length === 1 ? (groupEntries.length + " sources · " + uniqDurs[0]) : (groupEntries.length + " sources");
    } else {
      const firstDetail = formatDetail(first);
      const firstNoteLow = String(first.note || "").trim().toLowerCase();
      const firstDetailLow = String(firstDetail || "").trim().toLowerCase();
      const skipFirstNote = Boolean(firstDetail && firstNoteLow && (firstNoteLow.startsWith(firstDetailLow) || /^\+1 ac per forgone attack/i.test(firstNoteLow)));
      const baseParts = [firstDetail, powerSummary, skipFirstNote ? "" : first.note].filter(Boolean);
      if (firstDur && !isDurationDuplicated(firstDur, baseParts)) baseParts.push(firstDur);
      summaryNote = baseParts.join(" · ");
    }

    const row = makeEntry(condRoot, key, name, summaryNote);
    const existingBodyTexts = [];
    if (pRule?.effects?.notes?.length) {
      const pTxt = pRule.effects.notes.join(" · ");
      appendText(row, "p", pTxt);
      existingBodyTexts.push(pTxt);
    } else if (def?.preview) {
      appendText(row, "p", def.preview);
      existingBodyTexts.push(def.preview);
    }
    const seenTrigs = new Set();
    for (const ge of groupEntries) {
      for (const trig of (Array.isArray(ge.turnTriggers) ? ge.turnTriggers : [])) {
        const cue = formatTurnTriggerCue(trig, profile, session);
        if (!cue || !cue.note) continue;
        const trigKey = (cue.label + "|" + cue.note).toLowerCase();
        if (seenTrigs.has(trigKey)) continue;
        seenTrigs.add(trigKey);
        const normNote = _normDurText(cue.note);
        if (existingBodyTexts.some(t => _normDurText(t).includes(normNote))) continue;
        const tp = appendText(row, "p", "");
        tp.className = "effectTrigger";
        appendText(tp, "strong", cue.label + ": ");
        tp.appendChild(document.createTextNode(cue.note));
      }
    }
    const isConcRow = concNormSet.has(normalizeName(name));
    if (ruleText || isConcRow) {
      const ruleRow = appendText(row, "div", "");
      ruleRow.className = "row wrap effectActions";
      if (ruleText) {
        addFullRulesBtn(ruleRow, name, () => pRule ? showPowerInfo(pRule) : showInfo(name, [["Kind", SW5E_CONDITIONS[name] ? "Condition" : "Active Effect"], ["Active instances", String(groupEntries.length)]], ruleText));
      }
      if (isConcRow) {
        const dropBtn = appendText(ruleRow, "button", "Drop concentration");
        dropBtn.type = "button";
        dropBtn.addEventListener("click", () =>
          update("Ended concentration on " + session.concentration, next => { endConcentration(next); }));
      }
    }

    groupEntries.forEach((entry, idx) => {
      const inst = appendText(row, "div", "");
      inst.className = "conditionInstance";
      const instDur = formatDurationSpec(entry.durationSpec);
      const detailStr = formatDetail(entry);
      const rawNote = groupEntries.length > 1 ? (entry.note || "Source " + (idx + 1)) : entry.note;
      const cDef = typeof SW5E_CONDITION_DEFS_BY_NAME !== "undefined" ? SW5E_CONDITION_DEFS_BY_NAME.get(name.toLowerCase()) : null;
      const effMaxVal = Number(entry.maxValue) || (cDef?.leveled ? Number(cDef.maxLevel) || 0 : 0);
      const rawNoteLow = String(rawNote || "").trim().toLowerCase();
      const detailLow = String(detailStr || "").trim().toLowerCase();
      const hideRedundantNote = Boolean(detailStr && rawNoteLow && (rawNoteLow.startsWith(detailLow) || /^\+1 ac per forgone attack/i.test(rawNoteLow)));
      const labelParts = [
        hideRedundantNote ? "" : rawNote,
        detailStr
      ].filter(Boolean);
      if (instDur && !isDurationDuplicated(instDur, labelParts)) labelParts.push(instDur);
      if (labelParts.length) appendText(inst, "span", labelParts.join(" · "));

      const controls = appendText(inst, "div", "");
      controls.className = "row wrap";
      if (entry.chargesMax > 0 && entry.perTurnCharges && entry.surgeActive) {
        const endTurnBtn = appendText(controls, "button", entry.charges > 0 ? "End turn surge" : "End turn (power ends)");
        endTurnBtn.type = "button";
        endTurnBtn.addEventListener("click", () => update("Ended " + name + " turn surge", next => {
          if (entry.charges <= 0) {
            next.effects = next.effects.filter(item => item.id !== entry.id);
            if (entry.fromConcentration || normalizeName(next.concentration) === normalizeName(entry.name)) next.concentration = "";
          } else {
            const target = next.effects.find(item => item.id === entry.id);
            if (target) target.surgeActive = false;
          }
        }));
      }
      if (contextualConditions[name]) {
        const toggle = appendText(controls, "button", contextualConditions[name]);
        toggle.type = "button";
        toggle.setAttribute("aria-pressed", String(Boolean(entry.context)));
        toggle.addEventListener("click", () => update("Updated " + name + " context", next => {
          const target = next.effects.find(item => item.id === entry.id);
          if (target) target.context = !target.context;
        }));
      }
      if (effMaxVal > 1 && Number(entry.value) >= 1) {
        const curVal = Math.max(1, Math.min(effMaxVal, Number(entry.value) || 1));
        const decBtn = appendText(controls, "button", "−1");
        decBtn.type = "button";
        decBtn.disabled = curVal <= 1;
        decBtn.setAttribute("aria-label", "Decrease " + name);
        decBtn.addEventListener("click", () => update(name + " (" + (curVal - 1) + ")", next => {
          const target = next.effects.find(item => item.id === entry.id);
          if (target) target.value = Math.max(1, (Number(target.value) || 1) - 1);
        }));
        const incBtn = appendText(controls, "button", "+1");
        incBtn.type = "button";
        incBtn.disabled = curVal >= effMaxVal;
        incBtn.setAttribute("aria-label", "Increase " + name);
        incBtn.addEventListener("click", () => update(name + " (" + (curVal + 1) + ")", next => {
          const target = next.effects.find(item => item.id === entry.id);
          if (target) target.value = Math.min(effMaxVal, (Number(target.value) || 1) + 1);
        }));
      }
      const removeBtn = appendText(controls, "button", "Remove");
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", "Remove " + name + (entry.note ? " (" + entry.note + ")" : ""));
      removeBtn.addEventListener("click", () => update("Removed " + name, next => {
        next.effects = next.effects.filter(item => item.id !== entry.id);
        if (entry.fromConcentration && normalizeName(next.concentration) === normalizeName(entry.name)) {
          next.concentration = "";
        }
      }));
    });

    if (name === "Prone" && !suppressed) {
      const stand = appendText(effectActionBar(row), "button", "Stand up");
      stand.type = "button";
      const spd = speedBreakdown(profile, session, conditions);
      stand.disabled = !spd.live;
      const standMsg = spd.standFromProneFeet === 5 ? "Stood up · Spend 5 ft" : "Stood up · Spend half your speed";
      stand.addEventListener("click", () => update(standMsg, next => {
        next.effects = next.effects.filter(effect => effect.name !== "Prone");
      }));
    }
    if (normalizeName(name) === "guardian aura" && typeof hasClassOption === "function" && hasClassOption(profile, session, "Aura of Vigor") && !suppressed) {
      const sc = effectiveScores(profile, session);
      const gvMod = Math.max(1, modifier(sc.Wisdom), modifier(sc.Charisma));
      const gvBtn = appendText(effectActionBar(row), "button", "Aura of Vigor · Gain temporary HP (+" + gvMod + ")");
      gvBtn.type = "button";
      gvBtn.addEventListener("click", () => update("Aura of Vigor · +" + gvMod + " temporary HP", next => {
        if (gvMod > next.temp) { next.temp = gvMod; next.tempSource = "Aura of Vigor"; }
      }));
    }
    if (normalizeName(name) === "aura of vigor (guardian)" && !suppressed) {
      const avMod = Math.max(1, first.value || 1);
      const avBtn = appendText(effectActionBar(row), "button", "Gain temporary HP (+" + avMod + ")");
      avBtn.type = "button";
      avBtn.addEventListener("click", () => update("Aura of Vigor · +" + avMod + " temporary HP", next => {
        if (avMod > next.temp) { next.temp = avMod; next.tempSource = "Aura of Vigor"; }
      }));
    }
    if (normalizeName(name) === "heroism" && !suppressed) {
      const fAb = castingStats(profile, session).forceAbility || "Wisdom";
      const mod = Math.max(1, modifier(effectiveScores(profile, session)[fAb]));
      const hBtn = appendText(effectActionBar(row), "button", "Gain temporary HP (+" + mod + ")");
      hBtn.type = "button";
      hBtn.addEventListener("click", () => update("Heroism · +" + mod + " temporary HP", next => {
        if (mod > next.temp) { next.temp = mod; next.tempSource = "Heroism"; }
      }));
    }
    if (normalizeName(name) === "vitality shield" && !suppressed) {
      const vBtn = appendText(effectActionBar(row), "button", "Vitality Shield (2d8 damage → 2× temporary HP)");
      vBtn.type = "button";
      vBtn.addEventListener("click", event => {
        const {dialog, form, body, note, confirm} = createModalFrame("Vitality Shield", event.currentTarget);
        confirm.textContent = "Apply Damage & Temporary HP";
        note("Roll 2d8: take that much damage and gain twice as many temporary HP.");
        const dieField = createDieRollField(body, {
          diceCount: 2,
          dieSides: 8,
          label: "Die roll (2d8)",
          formatPreview: raw => raw === null ? "Take — damage, gain — temporary HP" : "Take " + raw + " damage, gain " + (raw * 2) + " temporary HP"
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const dmg = dieField.getRaw();
          if (!Number.isFinite(dmg)) return;
          const tempGain = dmg * 2;
          dialog.close();
          update("Vitality Shield · −" + dmg + " HP / +" + tempGain + " temporary HP", next => {
            next.hp = Math.max(0, next.hp - dmg);
            if (tempGain > next.temp) { next.temp = tempGain; next.tempSource = "Vitality Shield"; }
          });
        });
        dialog.showModal();
        dieField.input.focus();
      });
    }
    if (normalizeName(name) === "buffer" && !suppressed) {
      const castLvl = first.castLevel || 1;
      const flat = 4 + Math.max(0, castLvl - 1) * 5;
      const bBtn = appendText(effectActionBar(row), "button", "Buffer temporary HP (1d4 + " + flat + ")");
      bBtn.type = "button";
      bBtn.addEventListener("click", event => {
        const {dialog, form, body, note, confirm} = createModalFrame("Buffer", event.currentTarget);
        confirm.textContent = "Apply Temporary HP";
        note("Roll 1d4 and add " + flat + " for temporary HP.");
        const dieField = createDieRollField(body, {
          diceCount: 1,
          dieSides: 4,
          modifier: flat,
          unit: "temporary HP",
          label: "Die roll (1d4)"
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const gained = dieField.getTotal();
          if (!Number.isFinite(gained)) return;
          dialog.close();
          update("Buffer · +" + gained + " temporary HP", next => {
            if (gained > next.temp) { next.temp = gained; next.tempSource = "Buffer"; }
          });
        });
        dialog.showModal();
        dieField.input.focus();
      });
    }
    if ((normalizeName(name) === "force enlightenment" || normalizeName(name) === "enhance droid") && /constitution|power core/i.test(first.choice || "") && !suppressed) {
      const feBtn = appendText(effectActionBar(row), "button", "Gain 2d6 temporary HP");
      feBtn.type = "button";
      feBtn.addEventListener("click", event => {
        const {dialog, form, body, note, confirm} = createModalFrame(name, event.currentTarget);
        confirm.textContent = "Apply Temporary HP";
        note("Roll 2d6 temporary HP.");
        const dieField = createDieRollField(body, {
          diceCount: 2,
          dieSides: 6,
          unit: "temporary HP",
          label: "Die roll (2d6)"
        });
        form.addEventListener("submit", e => {
          e.preventDefault();
          const gained = dieField.getTotal();
          if (!Number.isFinite(gained)) return;
          dialog.close();
          update(name + " · +" + gained + " temporary HP", next => {
            if (gained > next.temp) { next.temp = gained; next.tempSource = name; }
          });
        });
        dialog.showModal();
        dieField.input.focus();
      });
    }
    if (name === "Ignited" && !suppressed) {
      const fire = Math.max(0, ...groupEntries.map(entry => entry.value || 1));
      const burn = appendText(effectActionBar(row), "button", "Apply " + fire + " fire damage");
      burn.type = "button";
      burn.disabled = conditions.dead;
      burn.addEventListener("click", () => update("Applied Ignited fire damage", (next, prof) => {
        applyDamage(next, prof, fire, "fire");
      }));
      const douse = appendText(effectActionBar(row), "button", isIncapacitated(session) ? "Douse flames (ally / effect)" : "Douse flames");
      douse.type = "button";
      douse.addEventListener("click", () => update("Doused flames", next => {
        next.effects = next.effects.filter(effect => effect.name !== "Ignited");
      }));
    }
  }

  const cntEl = getElementById("effectsCount");
  if (cntEl) cntEl.textContent = count ? "(" + count + ")" : "";
  const emptyEl = getElementById("effectsEmpty");
  if (emptyEl) emptyEl.hidden = count > 0;
  return count;
}

function selectEffectChoice(name) {
  selectedEffectName = name;
  const choices = getElementById("conditionChoices");
  for (const btn of choices.querySelectorAll("button")) {
    btn.setAttribute("aria-pressed", String(btn.value === name));
  }
  const custom = name === "Custom";
  const def = effectCatalogByName.get(name.toLowerCase());
  const fieldDef = conditionFields[name];
  const ctxLabel = contextualConditions[name];
  const valueInput = getElementById("conditionValue");
  const ctxInput = getElementById("conditionContext");

  getElementById("customNameField").hidden = !custom;
  getElementById("customName").required = custom;
  getElementById("conditionValueField").hidden = !fieldDef;
  getElementById("conditionValueLabel").textContent = fieldDef?.[0] || "";
  valueInput.disabled = !fieldDef;
  valueInput.max = fieldDef?.[1] || 1;
  valueInput.value = name === "Exhaustion" ? Math.max(1, app.character?.session?.exhaustion || 1) : 1;

  getElementById("conditionContextField").hidden = !ctxLabel;
  getElementById("conditionContextLabel").textContent = ctxLabel || "";
  ctxInput.checked = name === "Frightened";

  getElementById("conditionPreview").textContent = custom
    ? "Track a custom reminder or table ruling."
    : (def?.preview || "");

  selectedEffectChoiceVal = "";
  selectedEffectChoicesMulti = new Set();
  const choiceField = getElementById("conditionChoiceField");
  const choicePills = getElementById("conditionChoicePills");
  const pRule = !custom ? powerRule(name) : null;
  const effChoiceKind = pRule?.effects?.choiceKind || (!custom ? def?.choiceKind : null);
  const choiceCfg = (effChoiceKind && typeof powerChoiceConfig === "function")
    ? powerChoiceConfig(effChoiceKind, app.character?.profile, app.character?.session) : null;
  if (choiceField && choicePills) {
    choicePills.replaceChildren();
    choiceField.hidden = !choiceCfg;
    if (choiceCfg) {
      getElementById("conditionChoiceLabel").textContent = choiceCfg.label;
      for (const optVal of choiceCfg.options) {
        const pill = appendText(choicePills, "button", optVal);
        pill.type = "button";
        pill.className = "swPropChip";
        pill.setAttribute("aria-pressed", "false");
        pill.addEventListener("click", () => {
          if (choiceCfg.multi) {
            if (selectedEffectChoicesMulti.has(optVal)) selectedEffectChoicesMulti.delete(optVal);
            else selectedEffectChoicesMulti.add(optVal);
            pill.setAttribute("aria-pressed", String(selectedEffectChoicesMulti.has(optVal)));
            getElementById("applyCondition").disabled = selectedEffectChoicesMulti.size === 0;
          } else {
            selectedEffectChoiceVal = optVal;
            for (const b of choicePills.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === optVal));
            getElementById("applyCondition").disabled = false;
          }
        });
      }
    }
  }

  getElementById("applyCondition").disabled = !name || (custom && !getElementById("customName").value.trim()) || Boolean(choiceCfg);
}

function renderEffectPickerChoices() {
  const choices = getElementById("conditionChoices");
  const query = getElementById("effectSearch").value.trim().toLowerCase();
  const group = selectedEffectGroup;
  choices.replaceChildren();

  const matches = effectCatalog.filter(item => {
    if (!query) return item.group === group;
    if (item._searchText === undefined) item._searchText = (item.name + " " + (item.preview || "")).toLowerCase();
    return item._searchText.includes(query);
  }).sort((a, b) => a.name.localeCompare(b.name));

  const limited = matches.slice(0, 60);
  if (!limited.length) appendText(choices, "small", "No matching effects.").className = "muted";

  for (const item of limited) {
    const button = appendText(choices, "button", item.name);
    button.type = "button";
    button.value = item.name;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectEffectChoice(item.name));
  }
  if (matches.length > limited.length) {
    appendText(choices, "small", "Showing first " + limited.length + " of " + matches.length + " — type to filter.").className = "muted";
  }
  const customBtn = appendText(choices, "button", "Custom effect");
  customBtn.type = "button";
  customBtn.value = "Custom";
  customBtn.setAttribute("aria-pressed", "false");
  customBtn.addEventListener("click", () => {
    selectEffectChoice("Custom");
    getElementById("customName").focus();
  });
  selectEffectChoice("");
}

function wireEffects() {
  const dialog = getElementById("conditionEditor");
  const groupChips = getElementById("effectGroupChips");
  const searchInput = getElementById("effectSearch");
  const customInput = getElementById("customName");

  const renderGroupChips = () => {
    if (!groupChips) return;
    groupChips.replaceChildren();
    for (const [key, label] of Object.entries(effectGroupLabels)) {
      const btn = appendText(groupChips, "button", label);
      btn.type = "button";
      btn.className = "pickerChip";
      btn.setAttribute("aria-pressed", String(selectedEffectGroup === key));
      btn.addEventListener("click", () => {
        selectedEffectGroup = key;
        searchInput.value = "";
        renderGroupChips();
        renderEffectPickerChoices();
      });
    }
  };
  selectedEffectGroup = Object.keys(effectGroupLabels)[0] || "conditions";
  renderGroupChips();
  const onEffectSearch = typeof _debounceFn === "function" ? _debounceFn(renderEffectPickerChoices, 100) : renderEffectPickerChoices;
  searchInput.addEventListener("input", onEffectSearch);
  customInput.addEventListener("input", () => {
    if (selectedEffectName === "Custom") {
      getElementById("applyCondition").disabled = !customInput.value.trim();
    }
  });

  getElementById("openEffects").addEventListener("click", () => {
    getElementById("conditionForm").reset();
    renderEffectPickerChoices();
    dialog.showModal();
    searchInput.focus();
  });
  wireDialogDismissal(dialog, getElementById("closeEffects"));
  getElementById("cancelEffects")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => getElementById("openEffects").focus({preventScroll: true}));

  getElementById("conditionForm").addEventListener("submit", event => {
    event.preventDefault();
    if (!selectedEffectName) return;
    const custom = selectedEffectName === "Custom";
    const name = custom ? customInput.value.trim() : selectedEffectName;
    if (!name) return;
    const note = getElementById("conditionNote").value.trim();
    const persistent = true;
    const valueInput = getElementById("conditionValue");
    const level = clamp(Number(valueInput.value) || 1, 1, Number(valueInput.max) || 999);
    const appliesContext = getElementById("conditionContext").checked;
    dialog.close();
    update("Applied " + name, session => {
      if (name === "Exhaustion") session.exhaustion = level;
      else {
        const p = powerRule(name);
        const multiChoices = selectedEffectChoicesMulti.size ? [...selectedEffectChoicesMulti] : null;
        if (p?.effects?.charges || p?.effects?.choiceKind || p?.effects?.maxHPBase) {
          session.effects = session.effects.filter(e => normalizeName(e.name) !== normalizeName(name));
          const entry = buildPowerEffectEntry(p, p.level || 1, selectedEffectChoiceVal, multiChoices, false);
          if (note) entry.note = [entry.note, note].filter(Boolean).join(" · ");
          session.effects.push(entry);
        } else {
          const extraObj = {id: newID(), note, persistent};
          if (selectedEffectChoiceVal) extraObj.choice = selectedEffectChoiceVal;
          session.effects.push(conditionEntry(name, level, appliesContext, extraObj));
        }
        if (p?.effects?.maxHPBase) session.hp += p.effects.maxHPBase;
        if (p?.effects?.tempHPPerLevel && p.level > 0) {
          const g = p.effects.tempHPPerLevel * p.level;
          if (g > session.temp) { session.temp = g; session.tempSource = p.name; }
        } else if (p?.effects?.tempHPBase) {
          const g = p.effects.tempHPBase;
          if (g > session.temp) { session.temp = g; session.tempSource = p.name; }
        }
      }
      const appliedDef = typeof SW5E_CONDITION_DEFS_BY_NAME !== "undefined" ? SW5E_CONDITION_DEFS_BY_NAME.get(name.toLowerCase()) : null;
      const postCond = typeof conditionState === "function" ? conditionState(session, app.character?.profile || null) : null;
      const isIncapApplied = name === "Incapacitated" || Boolean(appliedDef?.implies?.includes("Incapacitated"));
      const isImmuneApplied = Boolean(postCond && [...(postCond.immunities || [])].some(im => String(im || "").toLowerCase() === name.toLowerCase()));
      if (isIncapApplied && !isImmuneApplied) {
        if (typeof endConcentration === "function") endConcentration(session);
        else session.concentration = "";
      }
      if (name === "Unconscious" && !isImmuneApplied) {
        endRage(session);
      }
    });
  });
  renderEffectPickerChoices();
}
