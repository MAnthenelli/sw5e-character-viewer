let rest = null;

function hitDieHealing(profile, session, roll) {
  const scores = effectiveScores(profile, session);
  const hpEff = typeof resolveHpEffects === "function" ? resolveHpEffects(profile, session) : null;
  let con = modifier(scores.Constitution);
  for (const ab of (hpEff?.hitDieAbilityOverrides || [])) {
    const alt = modifier(scores[ab]);
    if (alt > con) con = alt;
  }
  const raw = Math.max(0, roll + con);
  const effMin = hpEff?.hitDieMin || 0;
  if (effMin > 0) return Math.max(raw, effMin);
  return raw;
}

function _applyRestTempForceGrants(profile, next) {
  if (typeof resolveResourceEffects !== "function") return;
  const mods = (resolveResourceEffects(profile, next).pointPoolMods || [])
    .filter(m => String(m.pool || "").toLowerCase() === "force" && m.trigger === "shortOrLongRest" && m.tempGrant);
  if (!mods.length) return;
  const sc = effectiveScores(profile, next);
  for (const m of mods) {
    let tf = 0;
    if (m.tempGrant === "halfForceMod") {
      tf = Math.max(1, Math.floor(Math.max(modifier(sc.Wisdom), modifier(sc.Charisma)) / 2));
    } else if (Number.isFinite(Number(m.tempGrant))) {
      tf = Number(m.tempGrant);
    }
    if (tf > (next.tempForce || 0)) next.tempForce = tf;
  }
}

function resetResourcePool(next, id) {
  if (id === "forcePoints") next.forceUsed = 0;
  else if (id === "techPoints") next.techUsed = 0;
  else if (id === "tempForce") next.tempForce = 0;
  else if (id === "tempTech") next.tempTech = 0;
  else if (id === "superiority") next.superiorityUsed = 0;
  else if (id.startsWith("hlc:")) {
    if (!next.highLevelCasting) next.highLevelCasting = {level4: false, level5: false, level6: false, level7: false, level8: false, level9: false};
    next.highLevelCasting[id.slice(4)] = false;
  } else {
    next.spent[id] = 0;
  }
}

function forceRecoveryAmount(profile, session) {
  if (typeof consularForceRecoveryAmount === "function") return consularForceRecoveryAmount(profile, session);
  const scores = effectiveScores(profile, session);
  const mod = Math.max(modifier(scores.Wisdom), modifier(scores.Charisma));
  return Math.max(1, Math.floor(profile.level / 2) + mod);
}

function _normalizeRestRoll(entry, fallbackDie) {
  if (entry && typeof entry === "object") {
    const die = Number(entry.die) || fallbackDie || 8;
    const key = entry.key || ("d" + die);
    const roll = Number(entry.roll) || 0;
    return { die, key, roll };
  }
  const die = fallbackDie || 8;
  return { die, key: "d" + die, roll: Number(entry) || 0 };
}

function longRestOutcome(session, profile, provisions) {
  const next = structuredClone(session);
  startWeaponTurn(next);
  endRage(next);
  if (typeof endConcentration === "function") endConcentration(next); else next.concentration = "";
  if (provisions && !conditionState(next).dead) {
    const frenzied = normalizeName(next.approach) === "frenzied approach" ||
      (typeof characterClasses === "function" && characterClasses(profile, next).some(c => normalizeName(c.archetype) === "frenzied approach"));
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
    if (res.id === "power_surge") {
      next.spent.power_surge = Math.max(0, res.max - 1);
    } else if (res.resetOn === "long" || res.resetOn === "short" || res.resetOn === "zeroMove") {
      resetResourcePool(next, res.id);
    }
  }
  if ("frenzy" in (next.spent || {})) next.spent.frenzy = 0;
  if (next.spent?.relentlessRage) next.spent.relentlessRage = 0;
  const hdGain = Math.max(1, Math.floor((profile.level || 1) / 2));
  if (typeof recoverHitDice === "function") {
    recoverHitDice(next, profile, hdGain);
  } else {
    next.hitDice = Math.min(profile.level, next.hitDice + hdGain);
  }
  next.reckless = false;
  _applyRestTempForceGrants(profile, next);
  return next;
}

function shortRestOutcome(session, profile, rolls, useForceRecovery = false, useTimelessVessel = false, useVigorousVirility = false) {
  const next = structuredClone(session);
  startWeaponTurn(next);
  endRage(next);
  if (next.spent?.relentlessRage) next.spent.relentlessRage = 0;
  const normRolls = (rolls || []).map(r => _normalizeRestRoll(r, profile.hitDie || 8));
  const healing = normRolls.reduce((total, r) => total + hitDieHealing(profile, session, r.roll), 0);
  if (typeof spendAnyHitDie === "function") {
    for (const r of normRolls) {
      spendAnyHitDie(next, profile, r.key);
    }
  } else {
    next.hitDice = Math.max(0, next.hitDice - normRolls.length);
  }
  recoverHP(next, healing, hitPointMaximum(profile, next));
  const monkLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Monk") : (characterTraits(profile, next).isMonk ? (profile.level || 1) : 0);
  const availAfterRolls = typeof hitDiceState === "function" ? hitDiceState(profile, next).totalCurrent : (next.hitDice || 0);
  if (useTimelessVessel && monkLvl >= 15 && availAfterRolls > 0) {
    const slowedEntry = (next.effects || []).find(e => normalizeName(e.name) === "slowed" && (e.level || e.value || 1) > 0);
    if ((next.exhaustion || 0) > 0) {
      if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile);
      else next.hitDice = Math.max(0, next.hitDice - 1);
      next.exhaustion = Math.max(0, (next.exhaustion || 0) - 1);
    } else if (slowedEntry) {
      if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile);
      else next.hitDice = Math.max(0, next.hitDice - 1);
      const curLvl = Number(slowedEntry.level || slowedEntry.value || 1);
      if (curLvl <= 1) next.effects = next.effects.filter(e => e !== slowedEntry);
      else { slowedEntry.level = curLvl - 1; slowedEntry.value = curLvl - 1; }
    }
  }
  const exhRestEff = typeof collectCharacterEffects === "function"
    ? collectCharacterEffects(profile, next).find(e => e.restEffect === "removeExhaustionHitDie")
    : null;
  const exhPoolId = exhRestEff?.resourceId || "feat_vigorous_virility_exhaustion";
  const availForVV = typeof hitDiceState === "function" ? hitDiceState(profile, next).totalCurrent : (next.hitDice || 0);
  if (useVigorousVirility && exhRestEff && !(next.spent?.[exhPoolId] > 0) && availForVV > 0 && (next.exhaustion || 0) > 0) {
    if (typeof spendAnyHitDie === "function") spendAnyHitDie(next, profile);
    else next.hitDice = Math.max(0, next.hitDice - 1);
    next.exhaustion = Math.max(0, (next.exhaustion || 0) - 1);
    next.spent[exhPoolId] = 1;
  }
  for (const res of characterResources(profile, next)) {
    if (res.id === "power_surge") {
      if (res.value <= 0) next.spent.power_surge = Math.max(0, res.max - 1);
    } else if (res.resetOn === "short" || res.resetOn === "zeroMove") {
      resetResourcePool(next, res.id);
    }
  }
  if (useForceRecovery && characterTraits(profile, next).isConsular && !(next.spent.forceRecovery > 0)) {
    const gain = forceRecoveryAmount(profile, next);
    next.forceUsed = Math.max(0, (next.forceUsed || 0) - gain);
    next.spent.forceRecovery = 1;
  }
  _applyRestTempForceGrants(profile, next);
  return next;
}

function _renderRestKeypad(dieSides, disabled) {
  const hdChips = getElementById("hitDieChips");
  if (!hdChips) return;
  if (Number(hdChips.dataset.dieSides) !== dieSides) {
    hdChips.replaceChildren();
    hdChips.dataset.dieSides = String(dieSides);
    for (let i = 1; i <= dieSides; i++) {
      const btn = appendText(hdChips, "button", String(i));
      btn.type = "button";
      btn.className = "dieKeyBtn";
      btn.setAttribute("aria-label", "Record roll of " + i);
      btn.addEventListener("click", () => addRestDie(i));
    }
  }
  for (const b of hdChips.querySelectorAll("button")) b.disabled = disabled;
}

function restSummary() {
  const {profile, session} = app.character;
  const long = rest.kind === "long";
  const list = getElementById("restSummary");
  list.replaceChildren();
  const summary = text => appendText(list, "li", text);
  const scores = effectiveScores(profile, session);
  const constitution = modifier(scores.Constitution);
  const normRolls = rest.rolls.map(r => _normalizeRestRoll(r, profile.hitDie || 8));
  const healing = normRolls.reduce((total, r) => total + hitDieHealing(profile, session, r.roll), 0);

  if (long) {
    const next = longRestOutcome(session, profile, getElementById("restProvisions").checked);
    summary("HP " + session.hp + " → " + next.hp);
    if (session.temp) summary("Clear " + session.temp + " temporary HP");
    for (const res of characterResources(profile, session)) {
      if (res.isHitDiePool) continue;
      if ((res.resetOn === "long" || res.resetOn === "short" || res.resetOn === "zeroMove") && res.value < res.max) {
        const diff = res.max - res.value;
        summary("Restore " + diff + " " + res.label);
      }
    }
    if (session.spent.frenzy) summary("Reset Frenzy uses");
    if (session.spent.relentlessRage) summary("Reset Relentless Rage DC to 10");
    const hdBefore = typeof hitDiceState === "function" ? hitDiceState(profile, session) : null;
    const hdAfter = typeof hitDiceState === "function" ? hitDiceState(profile, next) : null;
    if (hdBefore && hdAfter && hdBefore.isMultiDie) {
      const changed = hdBefore.pools
        .map(p => ({ key: p.key, before: p.current, after: hdAfter.pools.find(x => x.key === p.key)?.current ?? p.current }))
        .filter(x => x.before !== x.after);
      if (changed.length) {
        const totalRec = changed.reduce((s, x) => s + (x.after - x.before), 0);
        summary("Hit Dice · " + changed.map(x => x.key + " " + x.before + " → " + x.after).join(", ") + " (+" + totalRec + " recovered)");
      }
    } else if (session.hitDice !== next.hitDice) {
      summary("Hit Dice " + session.hitDice + " → " + next.hitDice);
    }
    if (session.rage) summary("End Rage" + (session.rage.frenzy ? " and Frenzy" : ""));
    if (session.concentration) summary("End Concentration (" + session.concentration + ")");
    if (session.exhaustion !== next.exhaustion) summary("Exhaustion " + session.exhaustion + " → " + next.exhaustion);
    if (session.effects.length !== next.effects.length) summary("Clear effects marked to end on a long rest");
    if ((session.consumableEffects || []).length) summary("Clear active consumable effects");
    if (conditionState(next).weakened && session.hp < hitPointMaximum(profile, next)) summary("Weakened halves HP recovered");
    getElementById("restNoRecovery").hidden = list.childElementCount > 1 || session.hp !== next.hp;
  } else {
    for (const res of characterResources(profile, session)) {
      if ((res.resetOn === "short" || res.resetOn === "zeroMove") && res.value < res.max) {
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
    const hdBase = typeof hitDiceState === "function"
      ? hitDiceState(profile, session)
      : { pools: [{ die: profile.hitDie || 8, key: "d" + (profile.hitDie || 8), current: session.hitDice || 0, max: profile.level || 1 }], totalCurrent: session.hitDice || 0, totalMax: profile.level || 1, isMultiDie: false };
    const tvBox = getElementById("restTimelessVessel");
    const useTV = Boolean(rest.canTimelessVessel && tvBox && tvBox.checked && (hdBase.totalCurrent - normRolls.length) > 0);
    rest.timelessVessel = useTV;
    if (useTV) {
      const tvTarget = (session.exhaustion || 0) > 0 ? "1 level of Exhaustion" : "1 level of Slowed";
      summary("Timeless Vessel · Spend 1 Hit Die to remove " + tvTarget);
    }
    if (session.rage) {
      summary("End Rage" + (session.rage.frenzy ? " and Frenzy" : "") +
        (session.rage.exhaustionDue ? " · Gain 1 exhaustion" : ""));
    }
    if (session.spent.relentlessRage) summary("Reset Relentless Rage DC to 10");
    const restHitDieMin = typeof resolveHpEffects === "function" ? (resolveHpEffects(profile, session).hitDieMin || 0) : 0;
    if (restHitDieMin > 0) {
      summary("Hit Die floor · Minimum " + restHitDieMin + " HP per Hit Die");
    }
    const vvBox = getElementById("restVigorousVirility");
    const useVV = Boolean(rest.canVigorousVirility && vvBox && vvBox.checked && (hdBase.totalCurrent - normRolls.length - (useTV ? 1 : 0)) > 0);
    rest.vigorousVirility = useVV;
    if (useVV) {
      summary((rest.exhRestSource || "Short Rest Recovery") + " · Spend 1 Hit Die to remove 1 level of Exhaustion (1/long rest)");
    }
    const preview = shortRestOutcome(session, profile, rest.rolls, useFR, useTV, useVV);
    const hdAfter = typeof hitDiceState === "function" ? hitDiceState(profile, preview) : hdBase;
    const leftover = hdAfter.totalCurrent;

    // Ensure selectedDieKey points to a valid pool with remaining dice (or first pool if all 0)
    if (!rest.selectedDieKey || !hdAfter.pools.some(p => p.key === rest.selectedDieKey)) {
      rest.selectedDieKey = (hdAfter.pools.find(p => p.current > 0) || hdAfter.pools[0])?.key || ("d" + (profile.hitDie || 8));
    }
    let activePool = hdAfter.pools.find(p => p.key === rest.selectedDieKey) || hdAfter.pools[0];
    if (activePool && activePool.current <= 0 && leftover > 0) {
      const fallbackPool = hdAfter.pools.find(p => p.current > 0);
      if (fallbackPool) {
        rest.selectedDieKey = fallbackPool.key;
        activePool = fallbackPool;
      }
    }
    const activeDie = activePool?.die || profile.hitDie || 8;
    const activeRem = activePool?.current || 0;

    const selWrap = getElementById("hitDiePoolSelector");
    if (selWrap) {
      selWrap.replaceChildren();
      selWrap.hidden = !hdAfter.isMultiDie;
      if (hdAfter.isMultiDie) {
        for (const p of hdAfter.pools) {
          const chip = appendText(selWrap, "button", p.key + " (" + p.current + "/" + p.max + ")");
          chip.type = "button";
          chip.setAttribute("aria-pressed", String(p.key === rest.selectedDieKey));
          chip.disabled = p.current <= 0;
          if (p.current <= 0) chip.title = "No " + p.key + " Hit Dice remaining";
          chip.addEventListener("click", () => {
            rest.selectedDieKey = p.key;
            restSummary();
          });
        }
      }
    }

    const maxHpNow = hitPointMaximum(profile, session);
    getElementById("restDiceRemaining").textContent = hdAfter.isMultiDie
      ? (hdAfter.pools.map(p => p.current + "/" + p.max + " " + p.key).join(" · ") + " available")
      : (leftover + "/" + hdAfter.totalMax + " available");
    const healedNow = Math.max(0, preview.hp - session.hp);
    const fEl = getElementById("restHitDieFormula");
    if (fEl) fEl.textContent = "1d" + activeDie + (constitution ? (constitution > 0 ? " + " + constitution : " − " + Math.abs(constitution)) + " (Constitution)" : "");
    getElementById("restHealingPreview").textContent = normRolls.length ? ("+" + healedNow + " HP") : "— HP";
    const impEl = getElementById("restHpImpact");
    if (impEl) impEl.textContent = "HP " + session.hp + " → " + preview.hp + " / " + maxHpNow;
    const prEl = getElementById("restHitDiePrompt");
    if (prEl) prEl.textContent = "Hit Die roll (1d" + activeDie + ") — type, roll, or tap a value";
    const hdIn = getElementById("restHitDieInput");
    if (hdIn) { hdIn.max = String(activeDie); hdIn.disabled = !activeRem; }
    const addBtn = getElementById("addRestHitDieBtn");
    if (addBtn) addBtn.disabled = !activeRem;
    const rollBtn = getElementById("rollHitDie");
    if (rollBtn) {
      rollBtn.textContent = "Roll 1d" + activeDie;
      rollBtn.disabled = !activeRem;
    }
    _renderRestKeypad(activeDie, !activeRem);
    const rolls = getElementById("restHitDieRolls");
    rolls.replaceChildren();
    for (const r of normRolls) {
      const gained = hitDieHealing(profile, session, r.roll);
      appendText(rolls, "li", r.key + " " + r.roll + " " + signed(constitution) + " CON → +" + gained + " HP");
    }
    rolls.hidden = !normRolls.length;
    getElementById("removeRestHitDie").hidden = !normRolls.length;
    getElementById("restNoRecovery").hidden = true;
  }
  if (typeof resolveContextualNotes === "function") {
    for (const cn of resolveContextualNotes(profile, session, "rests")) {
      if (cn.restKind === "long" && !long) continue;
      if (cn.restKind === "short" && long) continue;
      if (normalizeName(cn.title) === "force recovery" && (long || rest.canForceRecovery)) continue;
      const txt = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(cn.text, profile, session) : cn.text;
      summary(`${cn.title}: ${txt} (${cn.source})`);
    }
  }
  return healing;
}

function openRest(kind) {
  const {profile, session} = app.character;
  const hdNow = typeof hitDiceState === "function" ? hitDiceState(profile, session) : { pools: [{ die: profile.hitDie || 8, key: "d" + (profile.hitDie || 8), current: session.hitDice || 0, max: profile.level || 1 }], totalCurrent: session.hitDice || 0 };
  const canForceRecovery = kind === "short" && characterTraits(profile, session).isConsular &&
    !(session.spent.forceRecovery > 0) && (session.forceUsed || 0) > 0;
  const hasSlowed = (session.effects || []).some(e => normalizeName(e.name) === "slowed" && (e.level || e.value || 1) > 0);
  const monkLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Monk") : (characterTraits(profile, session).isMonk ? (profile.level || 1) : 0);
  const canTimelessVessel = kind === "short" && monkLvl >= 15 &&
    hdNow.totalCurrent > 0 && ((session.exhaustion || 0) > 0 || hasSlowed);
  const exhRestEffOpen = kind === "short" && typeof collectCharacterEffects === "function"
    ? collectCharacterEffects(profile, session).find(e => e.restEffect === "removeExhaustionHitDie")
    : null;
  const exhPoolIdOpen = exhRestEffOpen?.resourceId || "feat_vigorous_virility_exhaustion";
  const canVigorousVirility = Boolean(exhRestEffOpen && !(session.spent?.[exhPoolIdOpen] > 0) && hdNow.totalCurrent > 0 && (session.exhaustion || 0) > 0);
  const firstAvail = (hdNow.pools.find(p => p.current > 0) || hdNow.pools[0]);
  rest = {
    kind,
    rolls: [],
    selectedDieKey: firstAvail?.key || ("d" + (profile.hitDie || 8)),
    canForceRecovery,
    forceRecovery: canForceRecovery,
    canTimelessVessel,
    timelessVessel: false,
    canVigorousVirility,
    vigorousVirility: false,
    exhRestSource: exhRestEffOpen?.source?.name || ""
  };
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
  const tvField = getElementById("restTimelessVesselField");
  const tvInput = getElementById("restTimelessVessel");
  if (tvField && tvInput) {
    tvField.hidden = !canTimelessVessel;
    tvInput.checked = false;
    const tvLabel = getElementById("restTimelessVesselLabel");
    if (tvLabel) tvLabel.textContent = "Use Timeless Vessel (spend 1 Hit Die to remove 1 " + ((session.exhaustion || 0) > 0 ? "Exhaustion" : "Slowed") + ")";
  }
  const vvField = getElementById("restVigorousVirilityField");
  const vvInput = getElementById("restVigorousVirility");
  if (vvField && vvInput) {
    vvField.hidden = !canVigorousVirility;
    vvInput.checked = false;
  }
  const hdChips = getElementById("hitDieChips");
  if (hdChips) delete hdChips.dataset.dieSides;
  restSummary();
  getElementById("restDialog").showModal();
  getElementById("restTitle").focus();
}

function _activeRestDieSides() {
  if (!rest || !app.character) return app.character?.profile?.hitDie || 8;
  const { profile, session } = app.character;
  const st = typeof hitDiceState === "function" ? hitDiceState(profile, session) : null;
  const pool = st?.pools?.find(p => p.key === rest.selectedDieKey) || st?.pools?.[0];
  return pool?.die || profile.hitDie || 8;
}

function addRestDie(value) {
  if (!rest || !value || !app.character) return;
  const { profile, session } = app.character;
  const preview = shortRestOutcome(session, profile, rest.rolls, Boolean(rest.forceRecovery), Boolean(rest.timelessVessel), Boolean(rest.vigorousVirility));
  const st = typeof hitDiceState === "function" ? hitDiceState(profile, preview) : null;
  const pool = st ? (st.pools.find(p => p.key === rest.selectedDieKey && p.current > 0) || st.pools.find(p => p.current > 0)) : null;
  if (st && !pool) return;
  if (!st && rest.rolls.length >= (session.hitDice || 0)) return;
  const die = pool?.die || profile.hitDie || 8;
  const key = pool?.key || ("d" + die);
  rest.rolls.push({ die, key, roll: value });
  restSummary();
}

function wireRests() {
  getElementById("restProvisions").addEventListener("change", restSummary);
  getElementById("restForceRecovery")?.addEventListener("change", restSummary);
  getElementById("restTimelessVessel")?.addEventListener("change", restSummary);
  getElementById("restVigorousVirility")?.addEventListener("change", restSummary);
  getElementById("shortRest").addEventListener("click", () => openRest("short"));
  getElementById("longRest").addEventListener("click", () => openRest("long"));
  const dialog = getElementById("restDialog");
  wireDialogDismissal(dialog, getElementById("cancelRest"));
  getElementById("closeRest")?.addEventListener("click", () => dialog.close());
  const submitTypedDie = () => {
    const inp = getElementById("restHitDieInput");
    const v = Number(inp?.value);
    const maxD = _activeRestDieSides();
    if (Number.isFinite(v) && v >= 1 && v <= maxD) {
      addRestDie(Math.floor(v));
      inp.value = "";
    }
  };
  getElementById("addRestHitDieBtn")?.addEventListener("click", submitTypedDie);
  getElementById("restHitDieInput")?.addEventListener("keydown", ev => {
    if (ev.key === "Enter") { ev.preventDefault(); submitTypedDie(); }
  });
  getElementById("rollHitDie").addEventListener("click", () => addRestDie(rollDie(_activeRestDieSides())));
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
        character.session = shortRestOutcome(character.session, character.profile, rest.rolls, Boolean(rest.forceRecovery), Boolean(rest.timelessVessel), Boolean(rest.vigorousVirility));
        return character;
      });
    }
  });
}
