let selectedEffectName = "";
let selectedEffectChoiceVal = "";
let selectedEffectChoicesMulti = new Set();
let selectedEffectGroup = "conditions";

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

  if (session.concentration) {
    const power = powerRule(session.concentration);
    const row = makeEntry(root, "concentration", "Concentrating", session.concentration);
    if (power?.duration) appendText(row, "p", power.duration);
    if (power) infoButton(row, power.name, () => showPowerInfo(power));
    appendText(row, "button", "Drop concentration").addEventListener("click", () =>
      update("Ended concentration on " + session.concentration, next => { endConcentration(next); }));
  }

  if (session.rage) {
    const row = makeEntry(root, "rage", session.rage.frenzy ? "Rage · Frenzied" : "Rage",
      "Resistance: " + resistanceNames(profile, session).join(", "));
    appendText(row, "p",
      "Advantage on Strength checks and saves. " + signed(profile.rageDamage) + " damage on Strength melee weapon attacks." +
      (normalizeName(session.approach) === "frenzied approach" ? " Maniacal Rage grants advantage on Intimidation." : "") +
      (session.rage.exhaustionDue ? " Gain 1 exhaustion when this Rage ends." : ""));
    appendText(row, "button", "Clear Rage").addEventListener("click", () => update("Ended Rage", endRage));
  }

  const conditions = conditionState(session, profile);
  if (session.reckless) {
    const row = makeEntry(root, "reckless", "Reckless Attack", "Advantage on STR melee attacks · incoming advantage");
    appendText(row, "p", classRule(profile, "Reckless Attack") || "");
    appendText(row, "button", "End Reckless Attack").addEventListener("click", () => update("Cleared Reckless Attack", next => { next.reckless = false; }));
  }

  for (const ce of session.consumableEffects || []) {
    const row = makeEntry(root, "consumable:" + ce.id, ce.name, ce.duration || "Active");
    if (ce.note) appendText(row, "p", ce.note);
    if (ce.rules) infoButton(row, ce.name, () => showInfo(ce.name, [["Duration", ce.duration]], ce.rules));
    appendText(row, "button", "End effect").addEventListener("click", () =>
      update("Ended " + ce.name, next => {
        next.consumableEffects = (next.consumableEffects || []).filter(entry => entry.id !== ce.id);
      }));
  }

  if (conditions.dead) {
    makeEntry(condRoot, "dead", "Dead", session.exhaustion >= 6 ? "Exhaustion 6" : "3 failed death saves");
  }

  if (session.exhaustion) {
    const row = makeEntry(condRoot, "exhaustion", "Exhaustion " + session.exhaustion, "");
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
    infoButton(row, "Exhaustion", () => showInfo("Exhaustion", [["Current level", session.exhaustion]], SW5E_CONDITIONS.Exhaustion));
    appendText(row, "button", "Remove exhaustion").addEventListener("click", () =>
      update("Cleared exhaustion", next => { next.exhaustion = 0; }));
  }

  if (!session.hp && !conditions.dead && !session.effects.some(effect => effect.name === "Unconscious")) {
    const row = makeEntry(condRoot, "hp-zero", "Unconscious", "0 HP");
    infoButton(row, "Unconscious", () => showInfo("Unconscious", [], SW5E_CONDITIONS.Unconscious));
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
    const suppressed = conditions.immunities.has(name);
    const formatDetail = entry => {
      if (entry.name === "Ignited") return (entry.value || 1) + " fire/turn";
      if (entry.name === "Force-Empowered Self: Slow Time") return "+" + (entry.value || 10) + " ft";
      if (entry.name === "Force-Empowered Self: Deflection") return "+" + (entry.value || 2) + " AC";
      if (entry.name === "Evasive Footwork" || entry.name === "Primal Endurance" || entry.name === "Dual Wield AC") return "+" + (entry.value || 1) + " AC";
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
      if (entry.name === "Assess the Situation") return "+" + (entry.value || 1) + " Perception / Investigation";
      if (entry.name === "Wild Senses") return "+" + (entry.value || 1) + " Perception / Survival";
      if (entry.name === "Aura of Presence") return "+" + (entry.value || 1) + " saves";
      if (entry.name === "Aura of Hatred") return "+" + (entry.value || 1) + " melee damage";
      if (entry.name === "Aura of Vigor (Guardian)") return "+" + (entry.value || 1) + " temporary HP per turn";
      if (entry.name === "Sharpshooter's Routine") return "+" + (entry.value || 1) + " first attack";
      if (entry.name === "Potent Aptitude") return "+" + (entry.value || 1) + " die";
      if (entry.name === "Soresu Form") return entry.soresuUsed ? "First hit halved (used)" : "First weapon hit halved";
      if (entry.chargesMax > 0) {
        if (entry.perTurnCharges) {
          return (entry.surgeActive ? "Surge active · " : "Standby · ") + entry.charges + "/" + entry.chargesMax + " " + (entry.chargeLabel || "charges");
        }
        return entry.charges + "/" + entry.chargesMax + " " + (entry.chargeLabel || "charges");
      }
      if (Array.isArray(entry.choices) && entry.choices.length) return entry.choices.join(", ");
      if (entry.choice) return entry.choice;
      return conditionFields[entry.name] ? "Level " + (entry.value || 1) : "";
    };

    const powerSummary = pRule?.effects ? summarizePowerEffects(pRule.effects, first.choice || (first.choices || []).join(", ")) : "";
    let summaryNote = "";
    if (suppressed) summaryNote = "Immune";
    else if (groupEntries.length > 1) summaryNote = groupEntries.length + " sources";
    else summaryNote = [formatDetail(first), powerSummary, first.note].filter(Boolean).join(" · ");

    const row = makeEntry(condRoot, key, name, summaryNote);
    if (pRule?.effects?.notes?.length) {
      appendText(row, "p", pRule.effects.notes.join(" · "));
    } else if (def?.preview) {
      appendText(row, "p", def.preview);
    }
    if (ruleText) infoButton(row, name, () => showInfo(name, [["Active instances", String(groupEntries.length)]], ruleText));

    groupEntries.forEach((entry, idx) => {
      const inst = appendText(row, "div", "");
      inst.className = "conditionInstance";
      const labelParts = [
        groupEntries.length > 1 ? (entry.note || "Source " + (idx + 1)) : entry.note,
        formatDetail(entry)
      ].filter(Boolean);
      if (labelParts.length) appendText(inst, "span", labelParts.join(" · "));

      const controls = appendText(inst, "div", "");
      controls.className = "row wrap";
      if (entry.chargesMax > 0) {
        if (entry.perTurnCharges) {
          if (entry.surgeActive) {
            const endTurnBtn = appendText(controls, "button", entry.charges > 0 ? "End turn surge" : "End turn (power ends)");
            endTurnBtn.type = "button";
            endTurnBtn.addEventListener("click", () => update("Ended " + name + " turn surge", next => {
              if (entry.charges <= 0) {
                next.effects = next.effects.filter(item => item.id !== entry.id);
              } else {
                const target = next.effects.find(item => item.id === entry.id);
                if (target) target.surgeActive = false;
              }
            }));
          } else if (entry.charges > 0) {
            const spendBtn = appendText(controls, "button", "Spend " + (entry.chargeLabel || "charge").replace(/s$/, "") + " (" + entry.charges + " left)");
            spendBtn.type = "button";
            spendBtn.addEventListener("click", () => update("Activated " + name + " surge", next => {
              const target = next.effects.find(item => item.id === entry.id);
              if (target && target.charges > 0) {
                target.charges--;
                target.surgeActive = true;
              }
            }));
          }
        } else if (entry.charges > 0) {
          const spendBtn = appendText(controls, "button", "Spend 1 " + (entry.chargeLabel || "charge").replace(/s$/, "") + " (" + entry.charges + " left)");
          spendBtn.type = "button";
          spendBtn.addEventListener("click", () => update("Spent 1 " + name + " charge", next => {
            const target = next.effects.find(item => item.id === entry.id);
            if (!target) return;
            target.charges = Math.max(0, (target.charges || 0) - 1);
            if (target.charges <= 0) {
              next.effects = next.effects.filter(item => item.id !== entry.id);
            }
          }));
        }
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
      const stand = appendText(row, "button", "Stand up");
      stand.type = "button";
      stand.title = "Costs movement equal to half your speed";
      const spd = speedBreakdown(profile, session, conditions);
      stand.disabled = !spd.live;
      stand.addEventListener("click", () => update("Stood up · Spend half your speed", next => {
        next.effects = next.effects.filter(effect => effect.name !== "Prone");
      }));
    }
    if (normalizeName(name) === "guardian aura" && typeof hasClassOption === "function" && hasClassOption(profile, session, "Aura of Vigor") && !suppressed) {
      const sc = effectiveScores(profile, session);
      const gvMod = Math.max(1, modifier(sc.Wisdom), modifier(sc.Charisma));
      const gvBtn = appendText(row, "button", "Aura of Vigor · Gain temporary HP (+" + gvMod + ")");
      gvBtn.type = "button";
      gvBtn.addEventListener("click", () => update("Aura of Vigor · +" + gvMod + " temporary HP", next => {
        if (gvMod > next.temp) { next.temp = gvMod; next.tempSource = "Aura of Vigor"; }
      }));
    }
    if (normalizeName(name) === "aura of vigor (guardian)" && !suppressed) {
      const avMod = Math.max(1, first.value || 1);
      const avBtn = appendText(row, "button", "Gain temporary HP (+" + avMod + ")");
      avBtn.type = "button";
      avBtn.addEventListener("click", () => update("Aura of Vigor · +" + avMod + " temporary HP", next => {
        if (avMod > next.temp) { next.temp = avMod; next.tempSource = "Aura of Vigor"; }
      }));
    }
    if (normalizeName(name) === "heroism" && !suppressed) {
      const fAb = castingStats(profile, session).forceAbility || "Wisdom";
      const mod = Math.max(1, modifier(effectiveScores(profile, session)[fAb]));
      const hBtn = appendText(row, "button", "Gain temporary HP (+" + mod + ")");
      hBtn.type = "button";
      hBtn.addEventListener("click", () => update("Heroism · +" + mod + " temporary HP", next => {
        if (mod > next.temp) { next.temp = mod; next.tempSource = "Heroism"; }
      }));
    }
    if (normalizeName(name) === "vitality shield" && !suppressed) {
      const vBtn = appendText(row, "button", "Vitality Shield (2d8 damage → 2× temporary HP)");
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
      const bBtn = appendText(row, "button", "Buffer temporary HP (1d4 + " + flat + ")");
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
      const feBtn = appendText(row, "button", "Gain 2d6 temporary HP");
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
      const burn = appendText(row, "button", "Apply " + fire + " fire damage");
      burn.type = "button";
      burn.disabled = conditions.dead;
      burn.addEventListener("click", () => update("Applied Ignited fire damage", (next, prof) => {
        applyDamage(next, prof, fire, "fire");
      }));
      const douse = appendText(row, "button", "Douse flames");
      douse.type = "button";
      douse.disabled = isIncapacitated(session);
      douse.addEventListener("click", () => update("Doused flames", next => {
        next.effects = next.effects.filter(effect => effect.name !== "Ignited");
      }));
    }
  }

  if (!count) appendText(root, "small", "No active effects").className = "muted";
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

  const matches = effectCatalog.filter(item =>
    query ? (item.name + " " + item.preview).toLowerCase().includes(query) : item.group === group
  ).sort((a, b) => a.name.localeCompare(b.name));

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
  searchInput.addEventListener("input", renderEffectPickerChoices);
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
      if (name === "Unconscious") {
        endRage(session);
        if (typeof endConcentration === "function") endConcentration(session);
        else session.concentration = "";
      }
    });
  });
  renderEffectPickerChoices();
}
