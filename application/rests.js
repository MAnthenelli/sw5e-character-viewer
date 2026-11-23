let rest = null;

function hitDieHealing(profile, session, roll) {
  const scores = effectiveScores(profile, session);
  let con = modifier(scores.Constitution);
  if (typeof hasClassOption === "function" && hasClassOption(profile, session, "Ideal of the Vigorous")) {
    con = Math.max(con, modifier(scores.Wisdom), modifier(scores.Charisma));
  }
  const raw = Math.max(0, roll + con);
  if (characterTraits(profile, session).durable) {
    return Math.max(raw, Math.max(2, con * 2));
  }
  return raw;
}

function resetResourcePool(next, id) {
  if (id === "forcePoints") next.forceUsed = 0;
  else if (id === "techPoints") next.techUsed = 0;
  else if (id === "tempForce") next.tempForce = 0;
  else if (id === "tempTech") next.tempTech = 0;
  else if (id === "superiority") next.superiorityUsed = 0;
  else if (id.startsWith("hlc:")) {
    if (!next.highLevelCasting) next.highLevelCasting = {level6: false, level7: false, level8: false, level9: false};
    next.highLevelCasting[id.slice(4)] = false;
  } else {
    next.spent[id] = 0;
  }
}

function forceRecoveryAmount(profile, session) {
  const scores = effectiveScores(profile, session);
  const mod = Math.max(modifier(scores.Wisdom), modifier(scores.Charisma));
  return Math.max(1, Math.floor(profile.level / 2) + mod);
}

function longRestOutcome(session, profile, provisions) {
  const next = structuredClone(session);
  endRage(next);
  if (typeof endConcentration === "function") endConcentration(next); else next.concentration = "";
  if (provisions && !conditionState(next).dead) {
    const frenzied = normalizeName(next.approach) === "frenzied approach";
    next.exhaustion = Math.max(0, next.exhaustion - (frenzied ? 2 : 1));
  }
  next.effects = next.effects.filter(effect => effect.persistent);
  next.consumableEffects = [];
  recoverHP(next, hitPointMaximum(profile, next) - next.hp, hitPointMaximum(profile, next));
  next.temp = 0;
  next.tempSource = "";
  next.tempForce = 0;
  next.tempTech = 0;
  for (const res of characterResources(profile, next)) {
    if (res.resetOn === "long" || res.resetOn === "short") {
      resetResourcePool(next, res.id);
    }
  }
  next.spent.frenzy = 0;
  next.hitDice = Math.min(profile.level, next.hitDice + Math.max(1, Math.floor(profile.level / 2)));
  next.reckless = false;
  if (typeof hasClassOption === "function" && hasClassOption(profile, next, "Ideal of the Tranquil")) {
    const sc = effectiveScores(profile, next);
    const tf = Math.max(1, Math.floor(Math.max(modifier(sc.Wisdom), modifier(sc.Charisma)) / 2));
    if (tf > (next.tempForce || 0)) next.tempForce = tf;
  }
  return next;
}

function shortRestOutcome(session, profile, rolls, useForceRecovery = false) {
  const next = structuredClone(session);
  endRage(next);
  const healing = rolls.reduce((total, roll) => total + hitDieHealing(profile, session, roll), 0);
  next.hitDice = Math.max(0, next.hitDice - rolls.length);
  recoverHP(next, healing, hitPointMaximum(profile, next));
  for (const res of characterResources(profile, next)) {
    if (res.resetOn === "short") {
      resetResourcePool(next, res.id);
    }
  }
  if (useForceRecovery && characterTraits(profile, next).isConsular && !(next.spent.forceRecovery > 0)) {
    const gain = forceRecoveryAmount(profile, next);
    next.forceUsed = Math.max(0, (next.forceUsed || 0) - gain);
    next.spent.forceRecovery = 1;
  }
  if (typeof hasClassOption === "function" && hasClassOption(profile, next, "Ideal of the Tranquil")) {
    const sc = effectiveScores(profile, next);
    const tf = Math.max(1, Math.floor(Math.max(modifier(sc.Wisdom), modifier(sc.Charisma)) / 2));
    if (tf > (next.tempForce || 0)) next.tempForce = tf;
  }
  return next;
}

function restSummary() {
  const {profile, session} = app.character;
  const long = rest.kind === "long";
  const list = getElementById("restSummary");
  list.replaceChildren();
  const summary = text => appendText(list, "li", text);
  const scores = effectiveScores(profile, session);
  const constitution = modifier(scores.Constitution);
  const healing = rest.rolls.reduce((total, roll) => total + hitDieHealing(profile, session, roll), 0);

  if (long) {
    const next = longRestOutcome(session, profile, getElementById("restProvisions").checked);
    summary("HP " + session.hp + " → " + next.hp);
    if (session.temp) summary("Clear " + session.temp + " temporary HP");
    for (const res of characterResources(profile, session)) {
      if ((res.resetOn === "long" || res.resetOn === "short") && res.value < res.max) {
        const diff = res.max - res.value;
        summary("Restore " + diff + " " + res.label);
      }
    }
    if (session.spent.frenzy) summary("Reset Frenzy uses");
    if (session.hitDice !== next.hitDice) summary("Hit Dice " + session.hitDice + " → " + next.hitDice);
    if (session.rage) summary("End Rage" + (session.rage.frenzy ? " and Frenzy" : ""));
    if (session.concentration) summary("End Concentration (" + session.concentration + ")");
    if (session.exhaustion !== next.exhaustion) summary("Exhaustion " + session.exhaustion + " → " + next.exhaustion);
    if (session.effects.length !== next.effects.length) summary("Clear effects marked to end on a long rest");
    if ((session.consumableEffects || []).length) summary("Clear active consumable effects");
    if (conditionState(next).weakened && session.hp < hitPointMaximum(profile, next)) summary("Weakened halves HP recovered");
    getElementById("restNoRecovery").hidden = list.childElementCount > 1 || session.hp !== next.hp;
  } else {
    for (const res of characterResources(profile, session)) {
      if (res.resetOn === "short" && res.value < res.max) {
        const diff = res.max - res.value;
        summary("Restore " + diff + " " + res.label);
      }
    }
    const frBox = getElementById("restForceRecovery");
    const useFR = Boolean(rest.canForceRecovery && (!frBox || frBox.checked));
    rest.forceRecovery = useFR;
    if (useFR) {
      const gain = Math.min(session.forceUsed || 0, forceRecoveryAmount(profile, session));
      summary("Force Recovery · Restore " + gain + " Force Points (1/long rest)");
    }
    if (session.rage) {
      summary("End Rage" + (session.rage.frenzy ? " and Frenzy" : "") +
        (session.rage.exhaustionDue ? " · Gain 1 exhaustion" : ""));
    }
    if (characterTraits(profile, session).durable) {
      summary("Durable · Minimum " + Math.max(2, constitution * 2) + " HP per Hit Die");
    }
    const leftover = session.hitDice - rest.rolls.length;
    getElementById("restDiceRemaining").textContent = leftover + "/" + profile.level + " available";
    const preview = shortRestOutcome(session, profile, rest.rolls, useFR);
    getElementById("restHealingPreview").textContent = "Healing " + Math.max(0, preview.hp - session.hp) +
      " · HP " + session.hp + " → " + preview.hp;
    const rolls = getElementById("restHitDieRolls");
    rolls.replaceChildren();
    for (const roll of rest.rolls) {
      const gained = hitDieHealing(profile, session, roll);
      appendText(rolls, "li", "d" + profile.hitDie + " " + roll + " " + signed(constitution) + " CON → +" + gained + " HP");
    }
    rolls.hidden = !rest.rolls.length;
    getElementById("removeRestHitDie").hidden = !rest.rolls.length;
    getElementById("rollHitDie").disabled = !leftover;
    const hdChips = getElementById("hitDieChips");
    if (hdChips) {
      for (const b of hdChips.querySelectorAll("button")) b.disabled = !leftover;
    }
    getElementById("restNoRecovery").hidden = true;
  }
  return healing;
}

function openRest(kind) {
  const {profile, session} = app.character;
  const canForceRecovery = kind === "short" && characterTraits(profile, session).isConsular &&
    !(session.spent.forceRecovery > 0) && (session.forceUsed || 0) > 0;
  rest = {kind, rolls: [], canForceRecovery, forceRecovery: canForceRecovery};
  const title = kind === "long" ? "Long rest" : "Short rest";
  getElementById("restTitle").textContent = title;
  getElementById("takeRest").textContent = "Take " + title.toLowerCase();
  getElementById("shortRestHealing").hidden = kind === "long";
  getElementById("restProvisionsField").hidden = kind !== "long" ||
    !(session.exhaustion || session.rage?.exhaustionDue);
  getElementById("restProvisions").checked = true;
  const frField = getElementById("restForceRecoveryField");
  const frInput = getElementById("restForceRecovery");
  if (frField && frInput) {
    frField.hidden = !canForceRecovery;
    frInput.checked = canForceRecovery;
    const gain = canForceRecovery ? Math.min(session.forceUsed || 0, forceRecoveryAmount(profile, session)) : 0;
    const frLabel = getElementById("restForceRecoveryLabel");
    if (frLabel) frLabel.textContent = "Use Force Recovery (+" + gain + " Force Points · 1/long rest)";
  }
  const die = profile.hitDie;
  const hdChips = getElementById("hitDieChips");
  if (hdChips) {
    hdChips.replaceChildren();
    for (let i = 1; i <= die; i++) {
      const btn = appendText(hdChips, "button", String(i));
      btn.type = "button";
      btn.setAttribute("aria-label", "Record physical roll of " + i);
      btn.addEventListener("click", () => addRestDie(i));
    }
  }
  getElementById("rollHitDie").textContent = "Roll d" + die;
  restSummary();
  getElementById("restDialog").showModal();
  getElementById("restTitle").focus();
}

function addRestDie(value) {
  if (!rest || rest.rolls.length >= app.character.session.hitDice || !value) return;
  rest.rolls.push(value);
  restSummary();
}

function wireRests() {
  getElementById("restProvisions").addEventListener("change", restSummary);
  getElementById("restForceRecovery")?.addEventListener("change", restSummary);
  getElementById("shortRest").addEventListener("click", () => openRest("short"));
  getElementById("longRest").addEventListener("click", () => openRest("long"));
  const dialog = getElementById("restDialog");
  wireDialogDismissal(dialog, getElementById("cancelRest"));
  getElementById("closeRest")?.addEventListener("click", () => dialog.close());
  getElementById("rollHitDie").addEventListener("click", () => addRestDie(rollDie(app.character.profile.hitDie)));
  getElementById("removeRestHitDie").addEventListener("click", () => { rest.rolls.pop(); restSummary(); });
  getElementById("takeRest").addEventListener("click", () => {
    restSummary();
    dialog.close();
    if (rest.kind === "long") {
      transact("Took a long rest", character => {
        character.session = longRestOutcome(character.session, character.profile, getElementById("restProvisions").checked);
        return character;
      });
    } else {
      transact("Took a short rest", character => {
        character.session = shortRestOutcome(character.session, character.profile, rest.rolls, Boolean(rest.forceRecovery));
        return character;
      });
    }
  });
}
