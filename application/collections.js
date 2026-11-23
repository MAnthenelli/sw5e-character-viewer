const managerDefinitions = [
  {key: "item", source: SW5E_EQUIPMENT, owner: "equipped", ownedRoot: "carriedItemList", results: "itemCatalogList", feedback: "catalogFeedback", notice: "catalogNotice", undo: "catalogUndo"},
  {key: "feat", source: SW5E_FEATS, owner: "feats", ownedRoot: "ownedFeatList", results: "featCatalogList", feedback: "featCatalogFeedback", notice: "featCatalogNotice", undo: "featCatalogUndo"}
];
const managerPageSize = 20;
const categoryOf = (key, row) => key === "item" ? formatCategory(row.category) : row.source === "PHB" ? "Core" : "Expanded";
const currency = cost => Number.isFinite(cost) && cost > 0 ? cost.toLocaleString() + " credits" : "";
const itemSummary = rule => rule ? [formatCategory(rule.category), humanizeEnum(rule.classification), currency(rule.cost), rule.weight && rule.weight !== "0" && rule.weight + " lb"].filter(Boolean).join(" · ") : "Imported item";
const featSummary = rule => rule ? [categoryOf("feat", rule), rule.prerequisite].filter(Boolean).join(" · ") : "Custom feat";

function buildPropertyChips(properties, category, detailHost) {
  const list = (properties || []).filter(p => p && p !== "—");
  if (!list.length) return "";
  const wrap = document.createElement("div");
  wrap.className = "swPropChips";
  let activeProp = "";
  const buttons = [];

  for (const prop of list) {
    const pRule = typeof propertyRule === "function" ? propertyRule(prop, category) : null;
    if (!pRule) {
      const span = appendText(wrap, "span", prop);
      span.className = "swPropTag";
      continue;
    }
    const btn = appendText(wrap, "button", prop);
    btn.type = "button";
    btn.className = "swPropChip";
    btn.setAttribute("aria-pressed", "false");
    btn.title = "View " + pRule.name + " property rules";
    btn.addEventListener("click", () => {
      const same = activeProp === prop;
      activeProp = same ? "" : prop;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b === btn && !same));
      detailHost.replaceChildren();
      detailHost.hidden = same;
      if (!same) {
        appendText(detailHost, "b", pRule.name + (prop.toLowerCase() !== pRule.name.toLowerCase() ? " (" + prop + ")" : ""));
        appendRules(detailHost, pRule.description);
      }
    });
    buttons.push(btn);
  }
  return wrap;
}

function showItem(name, item) {
  const rule = itemRule(name, item);
  const character = app.character;
  const stats = item && weaponStats(character.profile, item, Boolean(character.session.rage), character.session);
  const propDetail = document.createElement("div");
  propDetail.className = "swPropDetail";
  propDetail.hidden = true;
  const propCategory = rule?.armor === "Shield" ? "Shield" : (rule?.category || "");
  const propValue = typeof document !== "undefined" && rule?.properties?.length
    ? buildPropertyChips(rule.properties, propCategory, propDetail)
    : rule?.properties?.join(", ");
  showInfo(name, [
    ["Category", formatCategory(rule?.category)],
    ["Classification", humanizeEnum(rule?.classification)],
    ["Attack", stats && signed(stats.toHit) + " to hit" + (stats.proficient ? "" : " (not proficient)")],
    ["Damage", stats ? damageNotation(stats) : (rule?.dice && rule.die ? rule.dice + "d" + rule.die + " " + (rule.damage || "").toLowerCase() : "")],
    ["Armor Class", rule?.ac],
    ["Properties", propValue],
    ["Cost", currency(rule?.cost)],
    ["Weight", rule?.weight && rule.weight + " lb"],
    ["Source", rule?.source]
  ], rule?.description || "");
  if (typeof document !== "undefined" && rule?.properties?.length) {
    const body = getElementById("infoBody");
    const factsEl = body?.querySelector(".infoFacts");
    if (factsEl) factsEl.after(propDetail);
    else body?.prepend(propDetail);
  }
}

function showFeat(name, selection) {
  const rule = featRule(name);
  const chosenRule = selection?.choice
    ? (fightingMasteryRule(selection.choice) || fightingStyleRule(selection.choice) || lightsaberFormRule(selection.choice) || weaponFocusRule(selection.choice) || weaponSupremacyRule(selection.choice))
    : null;
  const body = [
    selection?.rules || rule?.rules || "",
    chosenRule ? "\n\n### " + chosenRule.name + "\n" + chosenRule.description : ""
  ].filter(Boolean).join("");
  showInfo(name, [
    ["Selected via", selection?.source],
    ["Ability choice", selection?.abilityChoice],
    ["Selection", selection?.choice],
    ["Chosen powers", selection?.powersChoice?.length ? selection.powersChoice.join(", ") : ""],
    ["Prerequisite", rule?.prerequisite],
    ["Source", rule?.source]
  ], body);
}

function collectionRow(root, name, summary, details) {
  const row = appendText(root, "div", "");
  row.className = ["carriedItemList", "ownedFeatList", "knownForcePowerList", "knownTechPowerList", "ownedManeuversList", "ownedFightingStylesList", "ownedFightingMasteriesList", "ownedLightsaberFormsList"].includes(root.id)
    ? "item inventoryItem" : "item catalogItem";
  const label = appendText(row, "div", "");
  appendText(label, "b", name);
  appendText(label, "div", summary).className = "muted";
  const actions = appendText(row, "div", "");
  actions.className = "row inventoryControls";
  infoButton(actions, name, details);
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
  return Boolean(rule.mechanics?.choiceKind);
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

function syncFeatChoiceOption(next, rule, choice) {
  if (!choice || !rule?.mechanics?.choiceKind) return;
  const map = {fightingStyle: "fightingStyles", fightingMastery: "fightingMasteries", lightsaberForm: "lightsaberForms"};
  const targetKey = map[rule.mechanics.choiceKind];
  if (!targetKey) return;
  if (!Array.isArray(next[targetKey])) next[targetKey] = [];
  if (!next[targetKey].some(x => normalizeName(x) === normalizeName(choice))) next[targetKey].push(choice);
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
  if (kind === "power") {
    const p = powerRule(optName);
    return p ? [p.castingPeriodText + " · " + p.range + " · " + p.duration, p.description].filter(Boolean).join("\n\n") : "";
  }
  return "";
}

function openFeatChoiceDialog(rule, trigger, onConfirm, existing = null) {
  const abOpts = featAbilityOptions(rule);
  const mech = rule?.mechanics || {};
  const choiceKind = mech.choiceKind || "";
  const isPowerChoice = choiceKind === "forcePowers" || choiceKind === "techPowers";

  if (abOpts.length <= 1 && !choiceKind) {
    onConfirm({abilityChoice: abOpts[0] || "", choice: "", powersChoice: []});
    return;
  }

  const {dialog, form, body, note, confirm} = createModalFrame(rule.name, trigger);
  confirm.textContent = existing ? "Save choices" : "Add " + rule.name;

  let chosenAbility = existing?.abilityChoice || abOpts[0] || "";
  let chosenMain = existing?.choice || "";
  const chosenPowers = [];

  const syncConfirm = () => {
    const needMain = Boolean(choiceKind && !isPowerChoice);
    const needPowers = isPowerChoice;
    const okMain = !needMain || Boolean(chosenMain);
    const okPowers = !needPowers || chosenPowers.every(Boolean);
    confirm.disabled = !(okMain && okPowers);
  };

  if (abOpts.length > 1) {
    const sec = appendText(body, "div", "");
    appendText(sec, "strong", "Ability score increase (+1)");
    const chips = appendText(sec, "div", "");
    chips.className = "directChips";
    for (const ab of abOpts) {
      const btn = appendText(chips, "button", ab);
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(chosenAbility === ab));
      btn.addEventListener("click", () => {
        chosenAbility = ab;
        for (const b of chips.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.textContent === ab));
      });
    }
  }

  if (isPowerChoice) {
    const pType = choiceKind === "forcePowers" ? "Force" : "Tech";
    const atWills = (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : []).filter(p => p.type === pType && p.level === 0).map(p => p.name).sort();
    const leveled = (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : []).filter(p => p.type === pType && p.level === (mech.leveledLevel || 1)).map(p => p.name).sort();
    const atWillCount = mech.atWillCount || 1;
    for (let i = 0; i < atWillCount; i++) {
      const idx = i;
      chosenPowers.push(existing?.powersChoice?.[idx] || "");
      const sec = appendText(body, "div", "");
      appendText(sec, "strong", pType + " at-will " + (atWillCount > 1 ? idx + 1 : ""));
      const picker = createSearchablePicker({
        options: atWills,
        value: chosenPowers[idx],
        placeholder: "Search " + pType + " at-will powers",
        onSelect: val => { chosenPowers[idx] = val; syncConfirm(); },
        getPreview: opt => previewForChoiceKind("power", opt)
      });
      sec.append(picker.element);
    }
    const lvlIdx = atWillCount;
    chosenPowers.push(existing?.powersChoice?.[lvlIdx] || "");
    const sec = appendText(body, "div", "");
    appendText(sec, "strong", "Level " + (mech.leveledLevel || 1) + " " + pType + " power");
    const picker = createSearchablePicker({
      options: leveled,
      value: chosenPowers[lvlIdx],
      placeholder: "Search Level " + (mech.leveledLevel || 1) + " " + pType + " powers",
      onSelect: val => { chosenPowers[lvlIdx] = val; syncConfirm(); },
      getPreview: opt => previewForChoiceKind("power", opt)
    });
    sec.append(picker.element);
    note("Chosen " + pType + " powers are added directly to your " + pType + " Powers list.");
  } else if (choiceKind) {
    const opts = choiceOptionsForKind(choiceKind);
    const sec = appendText(body, "div", "");
    appendText(sec, "strong", choiceLabelForKind(choiceKind));
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
        placeholder: "Search " + choiceLabelForKind(choiceKind).toLowerCase(),
        onSelect: val => { chosenMain = val; syncConfirm(); },
        getCategory: choiceKind === "weapon" ? opt => humanizeEnum(itemRule(opt)?.classification || "") : null,
        getPreview: opt => previewForChoiceKind(choiceKind, opt)
      });
      sec.append(picker.element);
    }
  }

  syncConfirm();
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (confirm.disabled) return;
    dialog.close();
    onConfirm({
      abilityChoice: chosenAbility,
      choice: chosenMain,
      powersChoice: chosenPowers.filter(Boolean)
    });
  });
  dialog.showModal();
}

function renderCollections(profile, session) {
  const inventory = getElementById("carriedItemList");
  const feats = getElementById("ownedFeatList");
  const meta = getElementById("inventoryMeta");
  inventory.replaceChildren();
  feats.replaceChildren();
  if (meta) {
    meta.replaceChildren();
    const {carried, capacity, encumbered, overloaded} = carryingStats(profile, session);
    const loadTag = overloaded ? " (Overloaded · 0 ft)" : encumbered ? " (Encumbered · 5 ft)" : "";
    appendText(meta, "span", "Weight " + carried + " / " + capacity + " lb" + loadTag);
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

  for (const item of session.equipped) {
    const rule = itemRule(item.name, item);
    const spec = consumableSpec(rule);
    const summary = [itemSummary(rule), item.quantity > 1 && "×" + item.quantity, item.equipped && "Equipped"].filter(Boolean).join(" · ");
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

  session.feats.forEach((feat, idx) => {
    const rule = featRule(feat.name);
    const sub = [
      feat.source || featSummary(rule),
      feat.abilityChoice && "+1 " + feat.abilityChoice,
      feat.choice,
      feat.powersChoice?.length && feat.powersChoice.join(", ")
    ].filter(Boolean).join(" · ");
    const controls = collectionRow(feats, feat.name, sub, () => showFeat(feat.name, feat));
    if (featNeedsChoice(rule)) {
      const hasVal = Boolean(feat.choice || feat.powersChoice?.length || (featAbilityOptions(rule).length > 1 && feat.abilityChoice));
      ownedControl(controls, hasVal ? "Edit choice" : "Choose", feat.name, event => {
        openFeatChoiceDialog(rule, event.currentTarget, picked => {
          update("Updated " + feat.name + " choice", (next, prof) => {
            const target = next.feats[idx];
            if (!target) return;
            const prevChoice = target.choice || "";
            const prevPowers = Array.isArray(target.powersChoice) ? [...target.powersChoice] : [];
            target.abilityChoice = picked.abilityChoice;
            target.choice = picked.choice;
            target.powersChoice = picked.powersChoice;
            if (prevChoice && normalizeName(prevChoice) !== normalizeName(picked.choice)) {
              const kindMap = {fightingStyle: "fightingStyles", fightingMastery: "fightingMasteries", lightsaberForm: "lightsaberForms"};
              const listKey = kindMap[rule?.mechanics?.choiceKind];
              if (listKey && Array.isArray(next[listKey])) {
                const stillGranted = next.feats.some(f => normalizeName(f.choice) === normalizeName(prevChoice));
                if (!stillGranted) next[listKey] = next[listKey].filter(x => normalizeName(x) !== normalizeName(prevChoice));
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
            syncFeatChoiceOption(next, rule, picked.choice);
            if (picked.powersChoice?.length) {
              if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
              for (const pName of picked.powersChoice) {
                if (!next.powers.some(n => normalizeName(n) === normalizeName(pName))) next.powers.push(pName);
              }
            }
          });
        }, feat);
      });
    }
    ownedControl(controls, "Remove", feat.name, () => update("Removed " + feat.name, next => {
      const removed = next.feats.splice(idx, 1)[0];
      if (removed?.choice) {
        const kindMap = {fightingStyle: "fightingStyles", fightingMastery: "fightingMasteries", lightsaberForm: "lightsaberForms"};
        const listKey = kindMap[featRule(removed.name)?.mechanics?.choiceKind];
        if (listKey && Array.isArray(next[listKey])) {
          const stillGranted = next.feats.some(f => normalizeName(f.choice) === normalizeName(removed.choice));
          if (!stillGranted) next[listKey] = next[listKey].filter(x => normalizeName(x) !== normalizeName(removed.choice));
        }
      }
      if (removed?.powersChoice?.length && Array.isArray(next.powers)) {
        for (const oldP of removed.powersChoice) {
          const stillGranted = next.feats.some(f => (f.powersChoice || []).some(p => normalizeName(p) === normalizeName(oldP)));
          if (!stillGranted) next.powers = next.powers.filter(p => normalizeName(p) !== normalizeName(oldP));
        }
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

function renderCatalog(config) {
  const {key} = config;
  const search = getElementById(key + "Search").value.trim().toLowerCase();
  const category = key === "item" ? (config.category || "") : (getElementById(key + "Category")?.value || "");
  const sort = getElementById(key + "Sort").value;
  const owned = app.character.session[config.owner];
  const has = name => owned.some(record => record.name === name);
  const names = (a, b) => a.name.localeCompare(b.name);
  const comparators = {
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
  const baseResults = config.source.filter(row => (!category || categoryOf(key, row) === category) &&
    (row.name + " " + categoryOf(key, row) + " " + (row.classification || "") + " " + (row.properties || row.prerequisite || "")).toLowerCase().includes(search));
  const cmp = comparators[sort] || names;
  const results = key === "feat"
    ? baseResults.sort((a, b) => {
        if (sort === "name") {
          const aOk = has(a.name) || (typeof checkFeatPrerequisite === "function" ? checkFeatPrerequisite(profile, session, a).met : true);
          const bOk = has(b.name) || (typeof checkFeatPrerequisite === "function" ? checkFeatPrerequisite(profile, session, b).met : true);
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
    const prereq = key === "feat" && typeof checkFeatPrerequisite === "function"
      ? checkFeatPrerequisite(profile, session, row)
      : {met: true, reason: ""};
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
    const ownedBlocked = key === "feat" && present && !repeatable;
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
          update("Added " + row.name, (next, prof) => {
            next.feats.push({
              name: row.name,
              source: "Added in viewer",
              abilityChoice: picked.abilityChoice,
              choice: picked.choice,
              powersChoice: picked.powersChoice
            });
            syncFeatChoiceOption(next, row, picked.choice);
            if (picked.powersChoice?.length) {
              if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
              for (const pName of picked.powersChoice) {
                if (!next.powers.some(n => normalizeName(n) === normalizeName(pName))) next.powers.push(pName);
              }
            }
          });
        });
      }
    });
    button.disabled = disabled;
    if (prereqBlocked) button.title = prereq.reason;
  }
  getElementById(key + "PageStatus").textContent = results.length ?
    (start + 1) + "–" + Math.min(start + managerPageSize, results.length) + " of " + results.length : "No matches";
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
    getElementById("open" + cap + "Catalog").addEventListener("click", () => {
      search.value = "";
      config.category = "";
      config.page = 0;
      if (chipWrap) renderItemChips();
      dialog.showModal();
      renderCatalog(config);
      search.focus();
    });
    wireDialogDismissal(dialog, getElementById("close" + cap + "Catalog"));
    for (const control of [search, filter, sort].filter(Boolean)) {
      control.addEventListener("input", () => {
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
}
