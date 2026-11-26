const managerDefinitions = [
  {key: "item", source: SW5E_EQUIPMENT, owner: "equipped", ownedRoot: "carriedItemList", results: "itemCatalogList", feedback: "catalogFeedback", notice: "catalogNotice", undo: "catalogUndo"},
  {key: "feat", source: SW5E_FEATS, owner: "feats", ownedRoot: "ownedFeatList", results: "featCatalogList", feedback: "featCatalogFeedback", notice: "featCatalogNotice", undo: "featCatalogUndo"}
];
const managerPageSize = 20;
const categoryOf = (key, row) => key === "item" ? formatCategory(row.category) : (row.source === "PHB" || row.source === "Player's Handbook") ? "Core" : "Expanded";
const currency = cost => Number.isFinite(cost) && cost > 0 ? cost.toLocaleString() + " credits" : "";
const cleanClassification = cls => { const h = humanizeEnum(cls); return h && !/^(unknown|none)$/i.test(h) ? h : ""; };
const itemSummary = rule => rule ? [formatCategory(rule.category), cleanClassification(rule.classification), currency(rule.cost), rule.weight && rule.weight !== "0" && rule.weight + " lb"].filter(Boolean).join(" · ") : "Imported item";
const featSummary = rule => rule ? [categoryOf("feat", rule), rule.prerequisite].filter(Boolean).join(" · ") : "Custom feat";

function buildPropertyChips(properties, category, detailHost, illuminationOverride = null) {
  const list = (properties || []).filter(p => p && p !== "—");
  if (!list.length) return "";
  const wrap = document.createElement("div");
  wrap.className = "swPropChips";
  let activeProp = "";
  const buttons = [];

  for (const prop of list) {
    const displayProp = prop.charAt(0).toUpperCase() + prop.slice(1);
    const pRule = typeof propertyRule === "function" ? propertyRule(prop, category) : null;
    const luminousOverride = illuminationOverride && (pRule?.effects || []).some(e => e.type === "weaponRule" && e.kind === "illumination");
    if (luminousOverride && illuminationOverride.suppress) continue;
    if (!pRule) {
      const span = appendText(wrap, "span", displayProp);
      span.className = "swPropTag";
      continue;
    }
    const btn = appendText(wrap, "button", displayProp);
    btn.type = "button";
    btn.className = "swPropChip";
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const same = activeProp === prop;
      activeProp = same ? "" : prop;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b === btn && !same));
      detailHost.replaceChildren();
      detailHost.hidden = same;
      if (!same) {
        const heading = displayProp.toLowerCase().startsWith(pRule.name.toLowerCase())
          ? displayProp
          : pRule.name + " (" + displayProp + ")";
        appendText(detailHost, "b", heading);
        const luminousText = luminousOverride
          ? "While activated, sheds bright light in a " + illuminationOverride.bright + "-foot radius and dim light for an additional " +
            illuminationOverride.dim + " feet. Dexterity (Stealth) checks made while the weapon is activated have disadvantage."
          : "";
        appendRules(detailHost, luminousText || pRule.description);
      }
    });
    buttons.push(btn);
  }
  return wrap;
}

function showItem(name, item, opts = {}) {
  const rule = item ? activeWeaponRule(item).rule : itemRule(name);
  const character = app.character;
  const stats = item && character && weaponStats(character.profile, item, Boolean(character.session.rage), character.session);
  const propDetail = typeof document !== "undefined" ? document.createElement("div") : null;
  if (propDetail) {
    propDetail.className = "swPropDetail";
    propDetail.hidden = true;
  }
  const propCategory = rule?.armor === "Shield" ? "Shield" : (rule?.category || "");
  const propValue = typeof document !== "undefined" && rule?.properties?.length
    ? buildPropertyChips(rule.properties, propCategory, propDetail, stats?.weaponProperties.light)
    : rule?.properties?.join(", ");
  showInfo(name, [
    ["Kind", "Equipment"],
    ["Category", formatCategory(rule?.category)],
    ["Classification", cleanClassification(rule?.classification)],
    ["Attack", stats && (stats.weaponProperties.restriction
      ? weaponAttackOptions(stats).map(option => option.label).join(" / ") || "No compatible firing mode"
      : signed(stats.toHit) + " to hit") + (stats.proficient ? "" : " (not proficient)")],
    ["Damage", stats ? damageNotation(stats) : (rule?.dice && rule.die ? rule.dice + "d" + rule.die + " " + (rule.damage || "").toLowerCase() : "")],
    ["Armor Class", rule?.ac],
    ["Properties", propValue],
    ["Cost", currency(rule?.cost)],
    ["Weight", rule?.weight && rule.weight + " lb"],
    ["Source", typeof formatSourceBook === "function" ? formatSourceBook(rule?.source) : rule?.source]
  ], rule?.description || "", {
    push: opts?.push,
    navKey: "equipment:" + normalizeName(name),
    afterRender: (propDetail && rule?.properties?.length) ? (body => {
      const factsEl = body?.querySelector(".infoFacts");
      if (factsEl) factsEl.after(propDetail);
      else body?.prepend(propDetail);
    }) : null
  });
}

function showFeat(name, selection, opts = {}) {
  const rule = featRule(name);
  const chosenRule = selection?.choice
    ? (fightingMasteryRule(selection.choice) || fightingStyleRule(selection.choice) || lightsaberFormRule(selection.choice) || weaponFocusRule(selection.choice) || weaponSupremacyRule(selection.choice))
    : null;
  const body = [
    selection?.rules || rule?.rules || "",
    chosenRule ? "\n\n### " + chosenRule.name + "\n" + chosenRule.description : ""
  ].filter(Boolean).join("");
  const profile = typeof app !== "undefined" ? app?.character?.profile : null;
  const session = typeof app !== "undefined" ? app?.character?.session : null;
  const selList = selection?.choice ? [selection.choice] : (Array.isArray(selection?.multiChoice) ? selection.multiChoice.filter(Boolean) : []);
  const selVal = (selList.length && typeof renderSourceLinks === "function" && typeof document !== "undefined")
    ? renderSourceLinks(selList.map(s => ({ label: s, source: s })), { push: true, profile, session })
    : selList.join(", ");
  const pwrVal = (selection?.powersChoice?.length && typeof renderSourceLinks === "function" && typeof document !== "undefined")
    ? renderSourceLinks(selection.powersChoice.map(p => ({ label: p, source: { kind: "power", name: p } })), { push: true, profile, session })
    : (selection?.powersChoice?.length ? selection.powersChoice.join(", ") : "");
  showInfo(name, [
    ["Kind", "Feat"],
    ["Category", rule ? categoryOf("feat", rule) : ""],
    ["Selected via", selection?.source],
    ["Ability choice", selection?.abilityChoice],
    ["Selection", selVal],
    ["Chosen powers", pwrVal],
    ["Prerequisite", rule?.prerequisite],
    ["Source", typeof formatSourceBook === "function" ? formatSourceBook(rule?.source) : rule?.source]
  ], body, { push: opts?.push, navKey: "feat:" + normalizeName(name) });
}

function collectionRow(root, name, summary, details) {
  const isOwnedList = ["carriedItemList", "ownedFeatList", "knownForcePowerList", "knownTechPowerList", "ownedManeuversList", "ownedFightingStylesList", "ownedFightingMasteriesList", "ownedLightsaberFormsList"].includes(root.id);
  const { actions } = createRuleElementRow(root, {
    name,
    summary: summary || "",
    details: details || null,
    rowClass: isOwnedList ? "item inventoryItem" : "item catalogItem",
    actionsClass: "row inventoryControls",
    alwaysCreateActions: true
  });
  return actions;
}

function ownedControl(root, text, name, handle, pressed, cls = "") {
  const button = appendText(root, "button", text);
  button.type = "button";
  if (cls) button.className = cls;
  button.setAttribute("aria-label", text + " " + name);
  if (pressed !== undefined) button.setAttribute("aria-pressed", String(pressed));
  button.addEventListener("click", handle);
  return button;
}

function featAbilityOptions(rule) {
  const attrs = rule?.attributes || [];
  if (!attrs.length) return [];
  if (attrs.some(a => normalizeName(a) === "any")) return [...abilities];
  return attrs.filter(a => abilities.includes(a));
}

function featNeedsChoice(rule) {
  if (!rule) return false;
  if (featAbilityOptions(rule).length > 1) return true;
  if (typeof extraFeatChoiceSpec === "function" && extraFeatChoiceSpec(rule)) return true;
  return Boolean(rule.mechanics?.choiceKind || rule.choiceSpec);
}

function choiceOptionsForKind(kind) {
  if (kind === "fightingMastery") return (typeof SW5E_FIGHTING_MASTERIES !== "undefined" ? SW5E_FIGHTING_MASTERIES : []).map(x => x.name);
  if (kind === "fightingStyle") return (typeof SW5E_FIGHTING_STYLES !== "undefined" ? SW5E_FIGHTING_STYLES : []).map(x => x.name);
  if (kind === "lightsaberForm") return (typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS : []).map(x => x.name);
  if (kind === "damageType") return ["acid", "cold", "fire", "force", "lightning", "necrotic"];
  if (kind === "powerType") return ["Force", "Tech"];
  if (kind === "weaponFocus") return (typeof SW5E_WEAPON_FOCUSES !== "undefined" ? SW5E_WEAPON_FOCUSES : []).map(x => x.name);
  if (kind === "weaponSupremacy") return (typeof SW5E_WEAPON_SUPREMACIES !== "undefined" ? SW5E_WEAPON_SUPREMACIES : []).map(x => x.name);
  if (kind === "weaponCategory") return ["Simple Vibroweapons", "Martial Vibroweapons", "Simple Blasters", "Martial Blasters", "Simple Lightweapons", "Martial Lightweapons"];
  if (kind === "weapon") return (typeof SW5E_EQUIPMENT !== "undefined" ? SW5E_EQUIPMENT : []).filter(e => e.category === "Weapon").map(e => e.name).sort();
  if (kind === "companion") return ["Beast", "Droid", "Turret", "Tracker Droid"];
  if (kind === "class") return (typeof SW5E_CLASSES !== "undefined" ? SW5E_CLASSES : []).map(c => c.name);
  return [];
}

function choiceLabelForKind(kind) {
  return {
    fightingMastery: "Fighting Mastery",
    fightingStyle: "Fighting Style",
    lightsaberForm: "Lightsaber Form",
    damageType: "Damage type",
    powerType: "Casting type",
    weaponFocus: "Weapon Focus",
    weaponSupremacy: "Weapon Supremacy",
    weaponCategory: "Weapon category",
    weapon: "Weapon",
    companion: "Companion nature",
    class: "Class"
  }[kind] || "Selection";
}

function _featCombatOptionListKey(rule) {
  const map = { fightingStyle: "fightingStyles", fightingMastery: "fightingMasteries", lightsaberForm: "lightsaberForms" };
  const ck = typeof featChoiceKind === "function" ? featChoiceKind(rule) : (rule?.mechanics?.choiceKind || "");
  if (map[ck]) return map[ck];
  const cg = (rule?.effects || []).find(e => e.type === "combatOptionGrant" && map[e.kind]);
  return cg ? map[cg.kind] : "";
}

function syncFeatChoiceOption(next, rule, choice, multiChoice = []) {
  const targetKey = _featCombatOptionListKey(rule);
  if (!targetKey) return;
  const picks = (Array.isArray(multiChoice) && multiChoice.length ? multiChoice : (choice ? [choice] : [])).filter(Boolean);
  if (!picks.length) return;
  if (!Array.isArray(next[targetKey])) next[targetKey] = [];
  for (const pk of picks) {
    if (!next[targetKey].some(x => normalizeName(x) === normalizeName(pk))) next[targetKey].push(pk);
  }
}

function previewForChoiceKind(kind, optName) {
  if (kind === "fightingMastery") return fightingMasteryRule(optName)?.description || "";
  if (kind === "fightingStyle") return fightingStyleRule(optName)?.description || "";
  if (kind === "lightsaberForm") return lightsaberFormRule(optName)?.description || "";
  if (kind === "weaponFocus") return weaponFocusRule(optName)?.description || "";
  if (kind === "weaponSupremacy") return weaponSupremacyRule(optName)?.description || "";
  if (kind === "weapon") {
    const it = itemRule(optName);
    return it ? [itemSummary(it), it.properties?.length ? "Properties: " + it.properties.join(", ") : "", it.description].filter(Boolean).join("\n\n") : "";
  }
  if (kind === "class" && typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined") {
    const sc = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className) === normalizeName(optName));
    return sc ? [sc.prerequisite ? "Prerequisite: " + sc.prerequisite : "", sc.description || sc.text || ""].filter(Boolean).join("\n\n") : "";
  }
  if (kind === "power") {
    const p = powerRule(optName);
    return p ? [p.castingPeriodText + " · " + p.range + " · " + p.duration, p.description].filter(Boolean).join("\n\n") : "";
  }
  return "";
}

function choiceSpecOptions(spec, profile = null, session = null, currentSelection = []) {
  if (!spec) return [];
  const prof = profile || (typeof app !== "undefined" ? app?.character?.profile : null);
  const sess = session || (typeof app !== "undefined" ? app?.character?.session : null);
  if (typeof contextualizeChoiceOptions === "function") {
    if (spec.options === "proficientSkillsOrTools") {
      return contextualizeChoiceOptions({ kind: "proficientSkillsOrTools", count: 1 }, prof, sess, { currentSelection }).options;
    }
    if (spec.options === "skills") {
      const kind = /proficient/i.test(spec.label || "") ? "proficientSkills" : "skills";
      return contextualizeChoiceOptions({ kind, count: 1 }, prof, sess, { currentSelection }).options;
    }
    if (/saving throw/i.test(spec.label || "")) {
      return contextualizeChoiceOptions({ kind: "savingThrow", count: 1 }, prof, sess, { currentSelection }).options;
    }
  }
  if (spec.options === "skills") return Object.keys(skills).sort();
  if (spec.options === "abilities") return [...abilities];
  if (Array.isArray(spec.options)) return [...spec.options];
  return [];
}

function openFeatChoiceDialog(rule, trigger, onConfirm, existing = null) {
  const abOpts = featAbilityOptions(rule);
  const choiceKind = typeof featChoiceKind === "function" ? featChoiceKind(rule) : (rule?.mechanics?.choiceKind || "");
  const choiceSpec = (rule?.choiceSpec && (rule.choiceSpec.count || 1) <= 1) ? rule.choiceSpec : null;
  const _initProf = typeof app !== "undefined" ? app?.character?.profile : null;
  const _initSess = typeof app !== "undefined" ? app?.character?.session : null;
  const extraSpec = typeof extraFeatChoiceSpec === "function" ? extraFeatChoiceSpec(rule, _initProf, _initSess) : null;
  const isPowerChoice = choiceKind === "forcePowers" || choiceKind === "techPowers";
  const hasMainChoice = Boolean((choiceKind && !isPowerChoice) || choiceSpec);

  if (abOpts.length <= 1 && !choiceKind && !choiceSpec && !extraSpec) {
    onConfirm({abilityChoice: abOpts[0] || "", choice: "", powersChoice: [], multiChoice: []});
    return;
  }

  const {dialog, form, body, note, confirm} = createModalFrame(rule.name, trigger, { size: extraSpec || isPowerChoice ? "reading" : "" });
  confirm.textContent = existing ? "Save choices" : "Add " + rule.name;

  let chosenAbility = existing?.abilityChoice || (abOpts.length === 1 ? abOpts[0] : "");
  let chosenMain = existing?.choice || "";
  const chosenPowers = [];
  const isExtraPowerInit = ["anyAtWillPower", "anyAtWillAttackPower", "anyAtWillSavePower"].includes(extraSpec?.kind);
  let chosenMulti = (isExtraPowerInit && Array.isArray(existing?.powersChoice) && existing.powersChoice.length)
    ? existing.powersChoice.filter(Boolean)
    : (Array.isArray(existing?.multiChoice) && existing.multiChoice.length ? existing.multiChoice.filter(Boolean)
      : (extraSpec && extraSpec.count === 1 && existing?.choice ? [existing.choice] : []));

  const syncConfirm = () => {
    const needAbility = abOpts.length > 1;
    const okAbility = !needAbility || Boolean(chosenAbility);
    const okMain = !hasMainChoice || Boolean(chosenMain);
    const okPowers = !isPowerChoice || chosenPowers.every(Boolean);
    const okExtra = !extraSpec || chosenMulti.length >= extraSpec.count;
    confirm.disabled = !(okAbility && okMain && okPowers && okExtra);
  };

  const _prof = typeof app !== "undefined" ? app?.character?.profile : null;
  const _sess = typeof app !== "undefined" ? app?.character?.session : null;
  const _scores = (_prof && _sess && typeof effectiveScores === "function") ? effectiveScores(_prof, _sess) : {};

  if (abOpts.length > 1) {
    const sec = appendText(body, "div", "");
    appendText(sec, "strong", "Ability score increase (+1)");
    const chips = appendText(sec, "div", "");
    chips.className = "directChips";
    for (const ab of abOpts) {
      const cur = _scores[ab];
      const lbl = Number.isFinite(cur) ? `${ab} (${cur} → ${Math.min(20, cur + 1)})` : ab;
      const btn = appendText(chips, "button", lbl);
      btn.type = "button";
      btn.dataset.ab = ab;
      if (Number.isFinite(cur) && cur >= 20) btn.title = ab + " is already at 20";
      btn.setAttribute("aria-pressed", String(chosenAbility === ab));
      btn.addEventListener("click", () => {
        chosenAbility = ab;
        for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.ab === ab));
        syncConfirm();
      });
    }
  }

  if (isPowerChoice) {
    const pType = choiceKind === "forcePowers" ? "Force" : "Tech";
    const atWillKind = pType === "Force" ? "forceAtWill" : "techAtWill";
    const leveledKind = pType === "Force" ? "forceLeveled" : "techLeveled";
    const csPow = rule?.choiceSpec || {};
    const atWillCount = csPow.atWillCount || mech.atWillCount || 1;
    for (let i = 0; i < atWillCount; i++) {
      const idx = i;
      chosenPowers.push(existing?.powersChoice?.[idx] || "");
      const res = typeof contextualizeChoiceOptions === "function"
        ? contextualizeChoiceOptions({ kind: atWillKind, count: 1 }, _prof, _sess, { currentSelection: chosenPowers[idx] })
        : { options: (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : []).filter(p => p.type === pType && p.level === 0).map(p => p.name).sort(), contextNote: "" };
      const sec = appendText(body, "div", "");
      appendText(sec, "strong", pType + " at-will " + (atWillCount > 1 ? idx + 1 : ""));
      if (res.contextNote) appendText(sec, "small", res.contextNote).className = "muted";
      const picker = createSearchablePicker({
        options: res.options,
        value: chosenPowers[idx],
        placeholder: "Search " + pType + " at-will powers",
        onSelect: val => { chosenPowers[idx] = val; syncConfirm(); },
        getPreview: opt => previewForChoiceKind("power", opt)
      });
      sec.append(picker.element);
    }
    const charLvl = Number(_prof?.level || 1);
    const lvlSlots = Array.isArray(csPow.leveledSlots)
      ? csPow.leveledSlots.filter(le => charLvl >= (le.minLevel || 1))
      : (Array.isArray(mech.leveledLevels)
        ? mech.leveledLevels.filter(le => charLvl >= (le.minLevel || 1))
        : (mech.leveledLevel ? [{ level: mech.leveledLevel }] : []));
    lvlSlots.forEach((le, li) => {
      const lvlIdx = atWillCount + li;
      chosenPowers.push(existing?.powersChoice?.[lvlIdx] || "");
      const lvlRes = typeof contextualizeChoiceOptions === "function"
        ? contextualizeChoiceOptions({ kind: leveledKind, powerLevel: le.level, count: 1 }, _prof, _sess, { currentSelection: chosenPowers[lvlIdx] })
        : { options: (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : []).filter(p => p.type === pType && p.level === le.level).map(p => p.name).sort(), contextNote: "" };
      const sec = appendText(body, "div", "");
      appendText(sec, "strong", "Level " + le.level + " " + pType + " power");
      if (lvlRes.contextNote) appendText(sec, "small", lvlRes.contextNote).className = "muted";
      const picker = createSearchablePicker({
        options: lvlRes.options,
        value: chosenPowers[lvlIdx],
        placeholder: "Search Level " + le.level + " " + pType + " powers",
        onSelect: val => { chosenPowers[lvlIdx] = val; syncConfirm(); },
        getPreview: opt => previewForChoiceKind("power", opt)
      });
      sec.append(picker.element);
    });
    note("Chosen " + pType + " powers are added directly to your " + pType + " Powers list.");
  } else if (hasMainChoice) {
    let mainRes = { options: [], contextNote: "" };
    if (typeof contextualizeChoiceOptions === "function") {
      if (mech.saveChoice || /saving throw/i.test(choiceSpec?.label || "")) {
        mainRes = contextualizeChoiceOptions({ kind: "savingThrow", count: 1 }, _prof, _sess, { currentSelection: chosenMain });
      } else if (choiceSpec?.options === "proficientSkillsOrTools") {
        mainRes = contextualizeChoiceOptions({ kind: "proficientSkillsOrTools", count: 1 }, _prof, _sess, { currentSelection: chosenMain });
      } else if (choiceSpec?.options === "skills") {
        const skKind = /proficient/i.test(choiceSpec.label || "") ? "proficientSkills" : "skills";
        mainRes = contextualizeChoiceOptions({ kind: skKind, count: 1 }, _prof, _sess, { currentSelection: chosenMain });
      } else if (choiceKind) {
        mainRes = contextualizeChoiceOptions({ kind: choiceKind, options: choiceSpec?.options, count: 1 }, _prof, _sess, { currentSelection: chosenMain, sourceFeatName: rule.name });
      } else {
        mainRes = { options: choiceSpecOptions(choiceSpec, _prof, _sess, chosenMain), contextNote: "" };
      }
    } else {
      mainRes = { options: choiceKind ? choiceOptionsForKind(choiceKind) : choiceSpecOptions(choiceSpec), contextNote: "" };
    }
    let opts = mainRes.options;
    if (rule?.distinctChoice && _sess) {
      const takenChoices = new Set((_sess.feats || [])
        .filter(f => f !== existing && normalizeName(f.name) === normalizeName(rule.name) && f.choice)
        .map(f => normalizeName(f.choice)));
      if (takenChoices.size) opts = opts.filter(o => !takenChoices.has(normalizeName(o)));
    }
    const mainLabel = choiceKind ? choiceLabelForKind(choiceKind) : (choiceSpec?.label || "Selection");
    const sec = appendText(body, "div", "");
    appendText(sec, "strong", mainLabel);
    if (mainRes.contextNote) appendText(sec, "small", mainRes.contextNote).className = "muted";
    if (opts.length <= 6) {
      const chips = appendText(sec, "div", "");
      chips.className = "directChips";
      for (const opt of opts) {
        const btn = appendText(chips, "button", opt);
        btn.type = "button";
        btn.setAttribute("aria-pressed", String(chosenMain === opt));
        btn.addEventListener("click", () => {
          chosenMain = opt;
          for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === opt));
          syncConfirm();
        });
      }
    } else {
      const picker = createSearchablePicker({
        options: opts,
        value: chosenMain,
        placeholder: "Search " + mainLabel.toLowerCase(),
        onSelect: val => { chosenMain = val; syncConfirm(); },
        getCategory: choiceKind === "weapon" ? opt => humanizeEnum(itemRule(opt)?.classification || "") : null,
        getPreview: opt => previewForChoiceKind(choiceKind, opt)
      });
      sec.append(picker.element);
    }
  }

  if (extraSpec && typeof optionsForGrantKind === "function") {
    const extraRes = typeof contextualizeChoiceOptions === "function"
      ? contextualizeChoiceOptions(extraSpec, _prof, _sess, { currentSelection: chosenMulti })
      : { options: optionsForGrantKind(extraSpec.kind, _prof, _sess), contextNote: "" };
    let opts = extraRes.options;
    if (rule?.distinctChoice && _sess) {
      const takenExtra = new Set((_sess.feats || [])
        .filter(f => f !== existing && normalizeName(f.name) === normalizeName(rule.name))
        .flatMap(f => [...(Array.isArray(f.multiChoice) ? f.multiChoice : []), ...(f.choice ? [f.choice] : [])])
        .filter(Boolean)
        .map(normalizeName));
      if (takenExtra.size) opts = opts.filter(o => !takenExtra.has(normalizeName(o)));
    }
    const sec = appendText(body, "div", "");
    const head = appendText(sec, "div", "");
    head.className = "top wrap";
    appendText(head, "strong", extraSpec.label);
    const countEl = appendText(head, "span", "");
    countEl.className = "muted";
    if (extraRes.contextNote) appendText(sec, "small", extraRes.contextNote).className = "muted";
    const pills = appendText(sec, "div", "");
    pills.className = "directChips";

    let extraChipBtns = [];
    let extraPicker = null;

    const syncExtra = () => {
      countEl.textContent = extraSpec.count > 1 ? (chosenMulti.length + " / " + extraSpec.count + " selected") : (chosenMulti[0] || "Choose 1");
      pills.replaceChildren();
      pills.hidden = extraSpec.count <= 1 || !chosenMulti.length;
      for (const val of chosenMulti) {
        const pBtn = appendText(pills, "button", val + " ×");
        pBtn.type = "button";
        pBtn.className = "pickerChip";
        pBtn.setAttribute("aria-pressed", "true");
        pBtn.addEventListener("click", () => {
          chosenMulti = chosenMulti.filter(x => normalizeName(x) !== normalizeName(val));
          syncExtra();
        });
      }
      for (const b of extraChipBtns) {
        b.setAttribute("aria-pressed", String(chosenMulti.some(x => normalizeName(x) === normalizeName(b.dataset.opt))));
      }
      if (extraPicker) extraPicker.setValue(chosenMulti[chosenMulti.length - 1] || "");
      syncConfirm();
    };

    const toggleExtra = val => {
      const exists = chosenMulti.some(x => normalizeName(x) === normalizeName(val));
      if (exists) chosenMulti = chosenMulti.filter(x => normalizeName(x) !== normalizeName(val));
      else if (extraSpec.count === 1) chosenMulti = [val];
      else if (chosenMulti.length < extraSpec.count) chosenMulti = [...chosenMulti, val];
      else chosenMulti = [...chosenMulti.slice(1), val];
      syncExtra();
    };

    if (opts.length <= 8) {
      const chips = appendText(sec, "div", "");
      chips.className = "directChips";
      let extraChipPreview = null;
      const showExtraPreview = opt => {
        if (!extraChipPreview || typeof previewForGrantKind !== "function") return;
        const txt = opt ? previewForGrantKind(extraSpec.kind, opt) : "";
        extraChipPreview.replaceChildren();
        if (!txt) { extraChipPreview.hidden = true; return; }
        appendText(extraChipPreview, "strong", opt);
        renderRules(extraChipPreview, txt);
        extraChipPreview.hidden = false;
      };
      for (const opt of opts) {
        const btn = appendText(chips, "button", opt);
        btn.type = "button";
        btn.dataset.opt = opt;
        btn.addEventListener("click", () => { toggleExtra(opt); showExtraPreview(opt); });
        btn.addEventListener("focus", () => showExtraPreview(opt));
        extraChipBtns.push(btn);
      }
      if (typeof previewForGrantKind === "function" && opts.some(o => previewForGrantKind(extraSpec.kind, o))) {
        extraChipPreview = appendText(sec, "div", "");
        extraChipPreview.className = "pickerPreview";
        extraChipPreview.hidden = true;
        showExtraPreview(chosenMulti[0] || opts.find(o => previewForGrantKind(extraSpec.kind, o)) || "");
      }
    } else {
      extraPicker = createSearchablePicker({
        options: opts,
        value: chosenMulti[0] || "",
        placeholder: "Search " + extraSpec.label.toLowerCase(),
        onSelect: val => toggleExtra(val),
        getCategory: opt => categoryForGrantKind(extraSpec.kind, opt),
        getPreview: opt => previewForGrantKind(extraSpec.kind, opt)
      });
      sec.append(extraPicker.element);
    }
    syncExtra();
  }

  syncConfirm();
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (confirm.disabled) return;
    dialog.close();
    const isExtraPower = ["anyAtWillPower", "anyAtWillAttackPower", "anyAtWillSavePower"].includes(extraSpec?.kind);
    const extraPowers = isExtraPower ? chosenMulti : [];
    const finalChoice = chosenMain || (extraSpec && extraSpec.count === 1 && !isExtraPower ? (chosenMulti[0] || "") : "");
    onConfirm({
      abilityChoice: chosenAbility,
      choice: finalChoice,
      powersChoice: [...chosenPowers.filter(Boolean), ...extraPowers],
      multiChoice: extraSpec && !isExtraPower ? [...chosenMulti] : []
    });
  });
  dialog.showModal();
}

function addFeatWithChoices(rule, picked, source = "Added in viewer", onDone = null, trigger = null) {
  update("Added " + rule.name, (next, prof) => {
    next.feats.push({
      name: rule.name,
      source,
      abilityChoice: picked.abilityChoice,
      choice: picked.choice,
      powersChoice: picked.powersChoice || [],
      multiChoice: picked.multiChoice || []
    });
    syncFeatChoiceOption(next, rule, picked.choice, picked.multiChoice);
    if (rule?.extraChoiceSpec?.kind === "classImprovement") next.classImprovementEnabled = true;
    if (picked.powersChoice?.length) {
      if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
      for (const pName of picked.powersChoice) {
        if (!next.powers.some(n => normalizeName(n) === normalizeName(pName))) next.powers.push(pName);
      }
    }
  });
  const ck = typeof featChoiceKind === "function" ? featChoiceKind(rule) : (rule?.mechanics?.choiceKind || "");
  if ((ck === "fightingStyle" || ck === "fightingMastery") && picked.choice && typeof promptCombatOptionGrant === "function" && combatOptionGrantSpec(picked.choice)) {
    promptCombatOptionGrant(picked.choice, trigger, onDone);
  } else if (onDone) {
    onDone();
  }
}

function applyFeatChoiceUpdate(idx, rule, picked, onDone = null, trigger = null) {
  update("Updated " + rule.name + " choice", (next, prof) => {
    const target = next.feats[idx];
    if (!target) return;
    const prevChoice = target.choice || "";
    const prevMulti = Array.isArray(target.multiChoice) ? [...target.multiChoice] : [];
    const prevPowers = Array.isArray(target.powersChoice) ? [...target.powersChoice] : [];
    target.abilityChoice = picked.abilityChoice;
    target.choice = picked.choice;
    target.powersChoice = picked.powersChoice || [];
    target.multiChoice = picked.multiChoice || [];
    if (rule?.extraChoiceSpec?.kind === "classImprovement") next.classImprovementEnabled = true;
    const optListKey = _featCombatOptionListKey(rule);
    if (optListKey && Array.isArray(next[optListKey])) {
      const prevAll = [...prevMulti, ...(prevChoice ? [prevChoice] : [])].filter(Boolean);
      const nextSet = new Set([...(picked.multiChoice || []), ...(picked.choice ? [picked.choice] : [])].filter(Boolean).map(normalizeName));
      for (const oldOpt of prevAll) {
        if (!nextSet.has(normalizeName(oldOpt))) {
          const stillGranted = next.feats.some(f => (f.multiChoice || []).some(m => normalizeName(m) === normalizeName(oldOpt)) || normalizeName(f.choice) === normalizeName(oldOpt));
          if (!stillGranted) next[optListKey] = next[optListKey].filter(x => normalizeName(x) !== normalizeName(oldOpt));
        }
      }
    }
    if (prevPowers.length && Array.isArray(next.powers)) {
      const nextPowerSet = new Set((picked.powersChoice || []).map(normalizeName));
      for (const oldP of prevPowers) {
        if (!nextPowerSet.has(normalizeName(oldP))) {
          const stillGranted = next.feats.some(f => (f.powersChoice || []).some(p => normalizeName(p) === normalizeName(oldP)));
          if (!stillGranted) next.powers = next.powers.filter(p => normalizeName(p) !== normalizeName(oldP));
        }
      }
    }
    syncFeatChoiceOption(next, rule, picked.choice, picked.multiChoice);
    if (picked.powersChoice?.length) {
      if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
      for (const pName of picked.powersChoice) {
        if (!next.powers.some(n => normalizeName(n) === normalizeName(pName))) next.powers.push(pName);
      }
    }
  });
  const ck = typeof featChoiceKind === "function" ? featChoiceKind(rule) : (rule?.mechanics?.choiceKind || "");
  if ((ck === "fightingStyle" || ck === "fightingMastery") && picked.choice && typeof promptCombatOptionGrant === "function" && combatOptionGrantSpec(picked.choice)) {
    promptCombatOptionGrant(picked.choice, trigger, onDone);
  } else if (onDone) {
    onDone();
  }
}

function renderCollections(profile, session) {
  const inventory = getElementById("carriedItemList");
  const feats = getElementById("ownedFeatList");
  const meta = getElementById("inventoryMeta");
  inventory.replaceChildren();
  feats.replaceChildren();
  if (meta) {
    meta.replaceChildren();
    const cs = carryingStats(profile, session);
    const loadTag = cs.overloaded ? " · Overloaded (0 ft)"
      : cs.overCapacity ? " · Over capacity (5 ft)"
      : cs.heavilyEncumbered ? " · Heavily encumbered (−20 ft)"
      : cs.encumbered ? " · Encumbered (−10 ft)" : "";
    const capText = cs.mode === "variant"
      ? (cs.carried + " lb (Encumbered " + cs.encumberedAt + " / Heavy " + cs.heavilyEncumberedAt + " / Max " + cs.capacity + " lb)")
      : (cs.carried + " / " + cs.capacity + " lb");
    appendText(meta, "span", "Weight: " + capText + loadTag);
    const encBtn = appendText(meta, "button", cs.mode === "variant" ? "Encumbrance: Variant" : "Encumbrance: Standard");
    encBtn.type = "button";
    encBtn.className = "swWeaponToggle";
    encBtn.addEventListener("click", () => update("Switched encumbrance mode", next => {
      next.encumbranceMode = next.encumbranceMode === "standard" ? "variant" : "standard";
    }));
    if (typeof attunementStats === "function") {
      const att = attunementStats(profile, session);
      const attunedCount = (session.equipped || []).filter(it => it.attuned).length;
      const attLabel = "Attuned: " + attunedCount + " / " + (att.maxSlots ?? att.max ?? 3) + (att.modSlotDelta ? " (+" + att.modSlotDelta + " mod)" : "");
      const attBtn = appendText(meta, "button", attLabel);
      attBtn.type = "button";
      attBtn.className = "swWeaponToggle";
      attBtn.addEventListener("click", ev => {
        const list = (session.equipped || []).filter(it => it.attuned).map(it => it.name);
        showMathPopover(ev.currentTarget, "Attunement Slots", [
          ["Attuned items", list.length ? list.join(", ") : "None"],
          ["Slots used", attunedCount + " / " + (att.maxSlots ?? att.max ?? 3)],
          ["Base slots", String(att.base)],
          ["Bonus slots", att.slotDelta ? signed(att.slotDelta) : ""],
          ["Bonus mod slots", att.modSlotDelta ? signed(att.modSlotDelta) + " (does not count against max supported)" : ""],
          ["Sources", att.sources?.length ? att.sources.join(", ") : ""]
        ], "SW5e Wretched Hives: A creature can be attuned to up to " + (att.maxSlots ?? att.max ?? 3) + " enhanced items at a time.");
      });
    }
    const credWrap = appendText(meta, "label", "Credits");
    const credInput = document.createElement("input");
    credInput.type = "number";
    credInput.min = "0";
    credInput.className = "creditsInput";
    credInput.value = String(session.credits || 0);
    credInput.setAttribute("aria-label", "Credits");
    credInput.addEventListener("change", () => {
      const val = Math.max(0, Math.floor(Number(credInput.value) || 0));
      update("Updated credits", next => { next.credits = val; });
    });
    credWrap.append(credInput);
  }

  const invQuery = (getElementById("inventorySearch")?.value || "").trim().toLowerCase();
  const invEquippedOnly = getElementById("inventoryEquippedOnly")?.getAttribute("aria-pressed") === "true";
  const filteredEquipped = session.equipped.filter(item => {
    if (invEquippedOnly && !item.equipped) return false;
    if (!invQuery) return true;
    const rule = itemRule(item.name, item);
    return (item.name + " " + (rule?.category || "") + " " + (rule?.classification || "") + " " + (rule?.properties || []).join(" ")).toLowerCase().includes(invQuery);
  });
  for (const item of filteredEquipped) {
    const rule = itemRule(item.name, item);
    const spec = consumableSpec(rule);
    const usesInfo = typeof consumableUsesRemaining === "function" ? consumableUsesRemaining(item, spec) : null;
    const summary = [
      itemSummary(rule),
      item.quantity > 1 && "×" + item.quantity,
      usesInfo && (usesInfo.current + "/" + usesInfo.max + " " + usesInfo.label),
      item.attuned && "Attuned",
      item.stored ? "Stored" : (item.equipped && "Equipped")
    ].filter(Boolean).join(" · ");
    const controls = collectionRow(inventory, item.name, summary, () => showItem(item.name, item));
    if (spec) {
      ownedControl(controls, spec.verb, item.name, event => openConsumableDialog(item.id, event.currentTarget));
    }
    if (item.equipped || rule?.category === "Weapon" || rule?.category === "Armor" || rule?.armor === "Shield") {
      const label = item.equipped ? "Unequip" : "Equip";
      ownedControl(controls, label, item.name, () => update(label === "Equip" ? "Equipped " + item.name : "Unequipped " + item.name, next => {
        const group = equipmentGroup(rule);
        if (!item.equipped && (group === "armor" || group === "shield")) {
          for (const entry of next.equipped) {
            if (equipmentGroup(itemRule(entry.name, entry)) === group) entry.equipped = false;
          }
        }
        next.equipped.find(entry => entry.id === item.id).equipped = !item.equipped;
        if (!item.equipped && rule?.armor === "Heavy") endRage(next);
      }));
    }
    if (item.attuned || rule?.requiresAttunement || item.enhanced || /enhanced|prototype|advanced|artifact|legendary/i.test((rule?.rarity || "") + " " + (item.name || ""))) {
      ownedControl(controls, item.attuned ? "Unattune" : "Attune", item.name, () => update((item.attuned ? "Unattuned " : "Attuned ") + item.name, next => {
        const found = next.equipped.find(entry => entry.id === item.id);
        if (found) found.attuned = !found.attuned;
      }));
    }
    ownedControl(controls, item.stored ? "Carry" : "Store", item.name, () => update((item.stored ? "Carried " : "Stored ") + item.name, next => {
      const found = next.equipped.find(entry => entry.id === item.id);
      if (found) {
        found.stored = !found.stored;
        if (found.stored) found.equipped = false;
      }
    }));
    ownedControl(controls, "+", "one more " + item.name, () => update("Added 1 " + item.name, next => {
      const found = next.equipped.find(entry => entry.id === item.id);
      if (found) found.quantity++;
    }), undefined, "qtyBtn");
    ownedControl(controls, "−", "one fewer " + item.name, () => update("Removed 1 " + item.name, next => {
      const found = next.equipped.find(entry => entry.id === item.id);
      if (!found) return;
      if (found.quantity > 1) found.quantity--;
      else next.equipped = next.equipped.filter(entry => entry.id !== item.id);
    }), undefined, "qtyBtn");
    ownedControl(controls, "Remove", item.name, () => update("Removed " + item.name, next => {
      next.equipped = next.equipped.filter(entry => entry.id !== item.id);
    }));
  }

  const spRec = typeof speciesRecord === "function" ? speciesRecord(profile?.species) : null;
  if (spRec?.choiceSpec) {
    const spSub = session.speciesChoice ? `${spRec.choiceSpec.label}: ${session.speciesChoice}` : `Select ${spRec.choiceSpec.label}`;
    const spControls = collectionRow(feats, `${spRec.name} Trait Choice`, spSub, () => showInfo(spRec.name, [spRec.choiceSpec.label], spSub));
    ownedControl(spControls, session.speciesChoice ? "Edit choice" : "Choose", spRec.name, event => {
      const fakeRule = { name: spRec.name, choiceSpec: spRec.choiceSpec, attributes: [] };
      openFeatChoiceDialog(fakeRule, event.currentTarget, picked => {
        update("Updated " + spRec.name + " choice", next => {
          next.speciesChoice = picked.choice || "";
        });
      }, { choice: session.speciesChoice || "" });
    });
  }

  const featMeta = getElementById("featMeta");
  if (featMeta) {
    const fb = typeof featBudgetStats === "function" ? featBudgetStats(profile, session) : null;
    if (fb && fb.hasBudget) {
      const bonusStr = fb.bonusCount > 0 ? (" (+" + fb.bonusCount + " bonus)") : "";
      const parts = [];
      if (fb.backgroundExpected) parts.push(fb.backgroundExpected + " background");
      if (fb.advancementExpected) {
        const clsBreak = Array.isArray(fb.asiSlotsByClass) && fb.asiSlotsByClass.length > 1
          ? (" (" + fb.asiSlotsByClass.map(c => c.className + " " + c.slots).join(", ") + ")")
          : "";
        parts.push(fb.advancementExpected + " advancement" + clsBreak);
      }
      const breakdown = parts.length ? (" · " + parts.join(" + ")) : "";
      featMeta.textContent = fb.counted + " / " + fb.expected + " feats" + bonusStr + breakdown;
    } else {
      featMeta.textContent = session.feats.length + (session.feats.length === 1 ? " feat" : " feats");
    }
  }
  const ownedFeatQuery = (getElementById("ownedFeatSearch")?.value || "").trim().toLowerCase();
  session.feats.forEach((feat, idx) => {
    if (ownedFeatQuery) {
      const fr = featRule(feat.name);
      const hay = (feat.name + " " + (feat.choice || "") + " " + (feat.abilityChoice || "") + " " + (fr?.rules || "")).toLowerCase();
      if (!hay.includes(ownedFeatQuery)) return;
    }
    const rule = featRule(feat.name);
    const sub = [
      feat.source || featSummary(rule),
      feat.abilityChoice && "+1 " + feat.abilityChoice,
      feat.choice,
      feat.multiChoice?.length && feat.multiChoice.join(", "),
      feat.powersChoice?.length && feat.powersChoice.join(", ")
    ].filter(Boolean).join(" · ");
    const controls = collectionRow(feats, feat.name, sub, () => showFeat(feat.name, feat));
    if (featNeedsChoice(rule)) {
      const incomplete = typeof isFeatChoiceIncomplete === "function"
        ? isFeatChoiceIncomplete(feat, rule, profile, session)
        : !Boolean(feat.choice || feat.powersChoice?.length || (featAbilityOptions(rule).length > 1 && feat.abilityChoice));
      const hasVal = !incomplete;
      const choiceBtn = ownedControl(controls, hasVal ? "Edit choice" : "Choose", feat.name, event => {
        if (typeof resolveRuleElementChoices === "function") {
          resolveRuleElementChoices({ kind: "feat", name: feat.name, instanceIndex: idx }, { trigger: event.currentTarget, forceEdit: true });
        } else {
          openFeatChoiceDialog(rule, event.currentTarget, picked => {
            applyFeatChoiceUpdate(idx, rule, picked, null, event.currentTarget);
          }, feat);
        }
      }, undefined, hasVal ? "" : "needsChoiceBtn");
      if (!hasVal) choiceBtn.setAttribute("aria-label", "Choose for " + feat.name + " (selection required)");
    }
    ownedControl(controls, "Remove", feat.name, () => update("Removed " + feat.name, next => {
      const removed = next.feats.splice(idx, 1)[0];
      const remListKey = _featCombatOptionListKey(featRule(removed?.name));
      if (remListKey && Array.isArray(next[remListKey])) {
        const oldOpts = [...(removed.multiChoice || []), ...(removed.choice ? [removed.choice] : [])].filter(Boolean);
        for (const oldOpt of oldOpts) {
          const stillGranted = next.feats.some(f => (f.multiChoice || []).some(m => normalizeName(m) === normalizeName(oldOpt)) || normalizeName(f.choice) === normalizeName(oldOpt));
          if (!stillGranted) next[remListKey] = next[remListKey].filter(x => normalizeName(x) !== normalizeName(oldOpt));
        }
      }
      if (removed?.powersChoice?.length && Array.isArray(next.powers)) {
        for (const oldP of removed.powersChoice) {
          const stillGranted = next.feats.some(f => (f.powersChoice || []).some(p => normalizeName(p) === normalizeName(oldP)));
          if (!stillGranted) next.powers = next.powers.filter(p => normalizeName(p) !== normalizeName(oldP));
        }
      }
      if (featRule(removed?.name)?.extraChoiceSpec?.kind === "classImprovement" && !next.feats.some(f => featRule(f.name)?.extraChoiceSpec?.kind === "classImprovement")) {
        next.classImprovementEnabled = false;
      }
    }));
  });

  const invCount = getElementById("inventoryTabCount");
  if (invCount) invCount.textContent = String(session.equipped.length);
  const featCount = getElementById("featTabCount");
  if (featCount) featCount.textContent = String(session.feats.length);
  if (!session.equipped.length) appendText(inventory, "p", "No items carried.").className = "muted";
  if (!session.feats.length) appendText(feats, "p", "No feats selected.").className = "muted";
  for (const config of managerDefinitions) {
    if (getElementById(config.key + "Catalog").open) renderCatalog(config);
  }
}

function _catalogSearchText(key, row) {
  if (row._searchText === undefined) {
    row._searchText = (row.name + " " + categoryOf(key, row) + " " + (row.classification || "") + " " + (row.properties || row.prerequisite || "")).toLowerCase();
  }
  return row._searchText;
}

function renderCatalog(config) {
  const run = () => _renderCatalogInner(config);
  if (typeof withEffectCache === "function") return withEffectCache(run);
  return run();
}

function _renderCatalogInner(config) {
  const {key} = config;
  const search = getElementById(key + "Search").value.trim().toLowerCase();
  const category = config.category || (getElementById(key + "Category")?.value || "");
  const sort = getElementById(key + "Sort").value;
  const owned = app.character.session[config.owner];
  const ownedSet = new Set(owned.map(record => record.name));
  const has = name => ownedSet.has(name);
  const names = (a, b) => a.name.localeCompare(b.name);
  const comparators = {
    "name-alpha": (a, b) => names(a, b),
    "name-desc": (a, b) => names(b, a),
    category: (a, b) => categoryOf(key, a).localeCompare(categoryOf(key, b)) || names(a, b),
    "price-asc": (a, b) => (a.cost || Infinity) - (b.cost || Infinity) || names(a, b),
    "price-desc": (a, b) => (b.cost || 0) - (a.cost || 0) || names(a, b),
    weight: (a, b) => (Number(a.weight) || Infinity) - (Number(b.weight) || Infinity) || names(a, b),
    level: (a, b) => (Number(a.prerequisite?.match(/\d+(?=\w* level)/i)?.[0]) || 0) -
      (Number(b.prerequisite?.match(/\d+(?=\w* level)/i)?.[0]) || 0) || names(a, b),
    owned: (a, b) => Number(has(b.name)) - Number(has(a.name)) || names(a, b)
  };
  const {profile, session} = app.character;
  const availOnly = key === "feat" && getElementById("featAvailableOnly")?.getAttribute("aria-pressed") === "true";
  const asiOnly = key === "feat" && getElementById("featAsiOnly")?.getAttribute("aria-pressed") === "true";

  // Precompute feat prerequisites ONCE per item in O(N) instead of O(N log N) inside sort()
  const prereqMap = key === "feat" && typeof checkFeatPrerequisite === "function" ? new Map() : null;
  const getFeatPrereq = row => {
    if (!prereqMap) return {met: true, reason: ""};
    let res = prereqMap.get(row.name);
    if (!res) {
      res = checkFeatPrerequisite(profile, session, row);
      prereqMap.set(row.name, res);
    }
    return res;
  };

  const baseResults = config.source.filter(row => {
    if (category && categoryOf(key, row) !== category) return false;
    if (asiOnly && !(row.attributes && row.attributes.length)) return false;
    if (search && !_catalogSearchText(key, row).includes(search)) return false;
    if (availOnly && !has(row.name) && !getFeatPrereq(row).met) return false;
    return true;
  });
  const cmp = comparators[sort] || names;
  const results = key === "feat"
    ? baseResults.sort((a, b) => {
        if (sort === "name") {
          const aOk = has(a.name) || getFeatPrereq(a).met;
          const bOk = has(b.name) || getFeatPrereq(b).met;
          if (aOk !== bOk) return Number(bOk) - Number(aOk);
        }
        return cmp(a, b);
      })
    : baseResults.sort(cmp);
  const pages = Math.max(1, Math.ceil(results.length / managerPageSize));
  config.page = clamp(config.page || 0, 0, pages - 1);
  const start = config.page * managerPageSize;
  const root = getElementById(config.results);
  root.replaceChildren();
  let showedLockedHeader = false;
  for (const row of results.slice(start, start + managerPageSize)) {
    const present = has(row.name);
    const prereq = getFeatPrereq(row);
    if (key === "feat" && !present && !prereq.met && sort === "name" && !showedLockedHeader) {
      showedLockedHeader = true;
      appendText(root, "h3", "Prerequisites Not Met");
    }
    const summaryText = key === "item"
      ? itemSummary(row)
      : [!present && !prereq.met ? prereq.reason : "", categoryOf("feat", row)].filter(Boolean).join(" · ");
    const controls = collectionRow(root, row.name, summaryText,
      () => key === "item" ? showItem(row.name) : showFeat(row.name));
    const repeatable = key === "feat" && isRepeatableFeat(row);
    const ownedCount = key === "feat" ? (session.feats || []).filter(f => normalizeName(f.name) === normalizeName(row.name)).length : 0;
    const atMaxRepeats = Boolean(row.maxCount && ownedCount >= row.maxCount);
    const ownedBlocked = key === "feat" && ((present && !repeatable) || atMaxRepeats);
    const prereqBlocked = key === "feat" && !present && !prereq.met;
    const disabled = ownedBlocked || prereqBlocked;
    const label = ownedBlocked ? "Owned" : prereqBlocked ? "Locked" : (present && key === "item" ? "Add another" : "Add");
    const button = ownedControl(controls, label, row.name, event => {
      if (key === "item") {
        update("Added " + row.name, next => {
          const current = next.equipped.find(entry => entry.name === row.name);
          if (current) current.quantity++;
          else next.equipped.push({id: newID(), name: row.name, quantity: 1, equipped: false, damageBonus: 0, attackBonus: 0});
        });
      } else {
        openFeatChoiceDialog(row, event.currentTarget, picked => {
          addFeatWithChoices(row, picked, "Added in viewer", null, event.currentTarget);
        });
      }
    });
    button.disabled = disabled;
    if (prereqBlocked) button.title = prereq.reason;
  }
  getElementById(key + "PageStatus").textContent = results.length ?
    "Showing " + (start + 1) + "–" + Math.min(start + managerPageSize, results.length) + " of " + results.length + " (page " + (config.page + 1) + "/" + pages + ")" : "0 matches";
  const titleCase = key === "item" ? "Item" : "Feat";
  getElementById(key + "Pages").hidden = pages < 2;
  getElementById("previous" + titleCase + "Page").disabled = config.page === 0;
  getElementById("next" + titleCase + "Page").disabled = config.page === pages - 1;
  getElementById(config.feedback).hidden = !notice;
  getElementById(config.notice).textContent = notice;
  getElementById(config.undo).disabled = !app.history.length;
}

function wireCollections() {
  for (const config of managerDefinitions) {
    const {key} = config;
    const cap = key === "item" ? "Item" : "Feat";
    const dialog = getElementById(key + "Catalog");
    const filter = getElementById(key + "Category");
    const chipWrap = getElementById(key + "CategoryChips");
    const search = getElementById(key + "Search");
    const sort = getElementById(key + "Sort");
    const categories = [...new Set(config.source.map(entry => categoryOf(key, entry)))].filter(Boolean).sort();
    config.category = "";
    const renderItemChips = () => {
      if (!chipWrap) return;
      chipWrap.replaceChildren();
      for (const cat of ["", ...categories]) {
        const btn = appendText(chipWrap, "button", cat || "All");
        btn.type = "button";
        btn.className = "pickerChip";
        btn.setAttribute("aria-pressed", String(config.category === cat));
        btn.addEventListener("click", () => {
          config.category = cat;
          config.page = 0;
          renderItemChips();
          renderCatalog(config);
        });
      }
    };
    if (filter) {
      for (const category of categories) filter.add(new Option(category, category));
    }
    if (chipWrap) renderItemChips();
    if (key === "feat") {
      for (const toggleId of ["featAvailableOnly", "featAsiOnly"]) {
        getElementById(toggleId)?.addEventListener("click", ev => {
          const b = ev.currentTarget;
          b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
          config.page = 0;
          renderCatalog(config);
        });
      }
    }
    getElementById("open" + cap + "Catalog").addEventListener("click", () => {
      search.value = "";
      config.category = "";
      config.page = 0;
      if (chipWrap) renderItemChips();
      if (key === "feat") {
        for (const toggleId of ["featAvailableOnly", "featAsiOnly"]) {
          getElementById(toggleId)?.setAttribute("aria-pressed", "false");
        }
      }
      dialog.showModal();
      renderCatalog(config);
      search.focus();
    });
    wireDialogDismissal(dialog, getElementById("close" + cap + "Catalog"));
    const onSearchInput = typeof _debounceFn === "function"
      ? _debounceFn(() => { config.page = 0; renderCatalog(config); }, 120)
      : () => { config.page = 0; renderCatalog(config); };
    search?.addEventListener("input", onSearchInput);
    for (const control of [filter, sort].filter(Boolean)) {
      control.addEventListener("change", () => {
        config.page = 0;
        renderCatalog(config);
      });
    }
    for (const [direction, delta] of [["previous", -1], ["next", 1]]) {
      getElementById(direction + cap + "Page").addEventListener("click", () => {
        config.page += delta;
        renderCatalog(config);
        getElementById(key + "CatalogResults").scrollTop = 0;
      });
    }
    getElementById(config.undo).addEventListener("click", undo);
  }

  const onColSearch = typeof _debounceFn === "function"
    ? _debounceFn(() => { if (app.character) withEffectCache(() => renderCollections(app.character.profile, app.character.session)); }, 120)
    : () => { if (app.character) renderCollections(app.character.profile, app.character.session); };
  getElementById("inventorySearch")?.addEventListener("input", onColSearch);
  getElementById("inventoryEquippedOnly")?.addEventListener("click", ev => {
    const b = ev.currentTarget;
    b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    if (app.character) withEffectCache(() => renderCollections(app.character.profile, app.character.session));
  });
  getElementById("ownedFeatSearch")?.addEventListener("input", onColSearch);
}
