// Conditional Character Manager tabs & Kincaid-parity libraries for Maneuvers, Fighting Styles, Fighting Masteries, and Lightsaber Forms.
const combatOptionDefs = [
  {
    key: "maneuvers",
    label: "Maneuvers",
    singular: "Maneuver",
    tabId: "maneuversTab",
    paneId: "maneuversManager",
    listId: "ownedManeuversList",
    metaId: "maneuversMeta",
    openBtnId: "openManeuversCatalog",
    searchId: "ownedManeuversSearch",
    catalog: () => typeof SW5E_MANEUVERS !== "undefined" ? SW5E_MANEUVERS : [],
    lookup: name => maneuverRule(name),
    hasSubFilter: true
  },
  {
    key: "fightingStyles",
    label: "Fighting Styles",
    singular: "Fighting Style",
    tabId: "fightingStylesTab",
    paneId: "fightingStylesManager",
    listId: "ownedFightingStylesList",
    metaId: "fightingStylesMeta",
    openBtnId: "openFightingStylesCatalog",
    searchId: "ownedFightingStylesSearch",
    catalog: () => typeof SW5E_FIGHTING_STYLES !== "undefined" ? SW5E_FIGHTING_STYLES : [],
    lookup: name => fightingStyleRule(name),
    hasSubFilter: false
  },
  {
    key: "fightingMasteries",
    label: "Fighting Masteries",
    singular: "Fighting Mastery",
    tabId: "fightingMasteriesTab",
    paneId: "fightingMasteriesManager",
    listId: "ownedFightingMasteriesList",
    metaId: "fightingMasteriesMeta",
    openBtnId: "openFightingMasteriesCatalog",
    searchId: "ownedFightingMasteriesSearch",
    catalog: () => typeof SW5E_FIGHTING_MASTERIES !== "undefined" ? SW5E_FIGHTING_MASTERIES : [],
    lookup: name => fightingMasteryRule(name),
    hasSubFilter: false
  },
  {
    key: "lightsaberForms",
    label: "Lightsaber Forms",
    singular: "Lightsaber Form",
    tabId: "lightsaberFormsTab",
    paneId: "lightsaberFormsManager",
    listId: "ownedLightsaberFormsList",
    metaId: "lightsaberFormsMeta",
    openBtnId: "openLightsaberFormsCatalog",
    searchId: "ownedLightsaberFormsSearch",
    catalog: () => typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS : [],
    lookup: name => lightsaberFormRule(name),
    hasSubFilter: false
  }
];

const optionLibraryPageSize = 20;
let activeOptionDef = null;
let optionLibraryPage = 0;

function conditionalOptionVisibility(profile, session) {
  const cls = normalizeName(profile?.className);
  const lvl = profile?.level || 1;
  const styles = session?.fightingStyles || [];
  const masteries = session?.fightingMasteries || [];
  const forms = session?.lightsaberForms || [];
  const maneuvers = session?.maneuvers || [];
  const hasStyle = name => styles.some(s => normalizeName(s) === normalizeName(name));
  const hasMastery = name => masteries.some(m => normalizeName(m) === normalizeName(name));

  const sup = typeof superiorityStats === "function" ? superiorityStats(profile, session) : null;
  const cGrants = typeof resolveCombatEffects === "function" ? (resolveCombatEffects(profile, session).combatOptionGrants || []) : [];
  const hasGrant = k => cGrants.some(cg => cg.kind === k);
  const defTraits = typeof resolveDefenseEffects === "function" ? (resolveDefenseEffects(profile, session).combatTraits || []) : [];
  const unlocksForms = defTraits.some(ct => ct.kind === "unlocksLightsaberForms");
  return {
    maneuvers: (cls === "fighter" && lvl >= 2) || cls === "scholar" || hasStyle("Superiority Style") || hasMastery("Superiority Mastery") || hasGrant("maneuver") || Boolean(sup && (sup.knownCap > 0 || sup.qty > 0)) || maneuvers.length > 0,
    fightingStyles: cls === "fighter" || (cls === "guardian" && lvl >= 2) || (cls === "scout" && lvl >= 2) || hasGrant("fightingStyle") || styles.length > 0,
    fightingMasteries: hasGrant("fightingMastery") || masteries.length > 0,
    lightsaberForms: (cls === "guardian" && lvl >= 3) || hasGrant("lightsaberForm") || hasStyle("Formfighting Style") || hasMastery("Formfighting Mastery") || unlocksForms || forms.length > 0
  };
}

function addCombatOption(key, name, trigger = null) {
  const def = combatOptionDefs.find(d => d.key === key);
  if (!def) return;
  update("Added " + def.singular.toLowerCase() + " · " + name, next => {
    if (!Array.isArray(next[key])) next[key] = [];
    if (!next[key].some(x => normalizeName(x) === normalizeName(name))) {
      next[key].push(name);
    }
  });
  if ((key === "fightingStyles" || key === "fightingMasteries") && typeof promptCombatOptionGrant === "function") {
    promptCombatOptionGrant(name, trigger);
  }
}

function removeCombatOption(key, name) {
  const def = combatOptionDefs.find(d => d.key === key);
  if (!def) return;
  update("Removed " + def.singular.toLowerCase() + " · " + name, next => {
    if (!Array.isArray(next[key])) return;
    next[key] = next[key].filter(x => normalizeName(x) !== normalizeName(name));
    if (key === "lightsaberForms" && Array.isArray(next.effects)) {
      const targetCanon = normalizeName(lightsaberFormRule(name)?.name || name);
      next.effects = next.effects.filter(e => normalizeName(lightsaberFormRule(e.name)?.name || e.name) !== targetCanon);
    }
    if (key === "maneuvers" && Array.isArray(next.effects)) {
      const SELF_ONLY_MANEUVER_EFFECTS = new Set([
        "body over bother", "mind over matter", "daring escape", "deliberate movement",
        "assess the situation", "assist", "conceal", "deceive", "empathize", "flex",
        "flourish", "handle animal", "investigate", "naturalize", "perceive", "perform",
        "persuade", "pilot", "program", "study", "survive", "threaten", "tumble",
        "evasive footwork", "feinting attack", "one step ahead", "one with the force",
        "parry", "self-preservation", "wrestle and drag"
      ]);
      const targetCanon = normalizeName(maneuverRule(name)?.name || name);
      if (SELF_ONLY_MANEUVER_EFFECTS.has(targetCanon)) {
        next.effects = next.effects.filter(e => normalizeName(e.name) !== targetCanon);
      }
    }
    if ((key === "fightingStyles" || key === "fightingMasteries") && next.combatOptionChoices && typeof next.combatOptionChoices === "object") {
      for (const ck of Object.keys(next.combatOptionChoices)) {
        if (normalizeName(ck) === normalizeName(name)) delete next.combatOptionChoices[ck];
      }
    }
  });
}

function formatTimingLabel(timing) {
  const k = String(timing || "").trim().toLowerCase();
  if (!k) return "";
  const map = {
    action: "Action",
    bonus: "Bonus action",
    reaction: "Reaction",
    free: "No action",
    special: "Special",
    passive: "Passive",
    "passive-upgrade": "Passive upgrade",
    "replace-attack": "Replace 1 attack",
    "out-of-combat": "1 minute (out of combat)"
  };
  if (map[k]) return map[k];
  const h = humanizeEnum(timing);
  return h ? h.charAt(0).toUpperCase() + h.slice(1) : "";
}

function showCombatOptionInfo(def, name) {
  const rule = def.lookup(name);
  const meta = [["Kind", def.singular]];
  if (rule?.type) meta.push(["Category", rule.type]);
  if (rule?.mechanics?.timing) meta.push(["Timing", formatTimingLabel(rule.mechanics.timing)]);
  if (def.key === "maneuvers" && rule?.mechanics?.save && typeof superiorityStats === "function" && app?.character) {
    const { profile, session } = app.character;
    const sup = superiorityStats(profile, session);
    const fullAb = { STR: "Strength", DEX: "Dexterity", CON: "Constitution", INT: "Intelligence", WIS: "Wisdom", CHA: "Charisma" };
    const versatileList = typeof generalManeuverOverrides === "function" ? generalManeuverOverrides(profile, session) : [];
    const effType = versatileList.some(v => normalizeName(v) === normalizeName(rule.name)) ? "General" : (rule.type || "General");
    const abFull = fullAb[rule.mechanics.save] || rule.mechanics.save;
    meta.push(["Save DC", "DC " + sup.dcFor(effType) + " " + abFull]);
  }
  if (rule?.prerequisite) meta.push(["Prerequisite", rule.prerequisite]);
  const kindMap = { maneuvers: "maneuver", fightingStyles: "fightingStyle", fightingMasteries: "fightingMastery", lightsaberForms: "lightsaberForm" };
  const coKind = kindMap[def.key] || "";
  if (coKind && typeof buildProvenanceChain === "function" && typeof renderSourceLinks === "function" && typeof document !== "undefined") {
    const profile = typeof app !== "undefined" ? app?.character?.profile : null;
    const session = typeof app !== "undefined" ? app?.character?.session : null;
    const chain = buildProvenanceChain({ kind: coKind, name: rule?.name || name }, profile, session);
    if (chain.length) {
      meta.push(["Granted by", renderSourceLinks(chain, { separator: " › ", className: "ruleLinkChain", push: true, profile, session })]);
    }
  }
  showInfo(rule?.name || name, meta, rule?.description || "Custom " + def.singular.toLowerCase() + " from character export.", { navKey: (coKind || "option") + ":" + normalizeName(rule?.name || name) });
}

function renderCombatOptionsManager(profile, session) {
  const vis = conditionalOptionVisibility(profile, session);
  const step = classLevelStep(profile);

  for (const def of combatOptionDefs) {
    const tab = getElementById(def.tabId);
    if (tab) tab.hidden = !vis[def.key];

    const root = getElementById(def.listId);
    const meta = getElementById(def.metaId);
    if (!root) continue;
    root.replaceChildren();

    const owned = Array.isArray(session[def.key]) ? session[def.key] : [];
    const query = (getElementById(def.searchId)?.value || "").trim().toLowerCase();
    const filtered = owned.filter(name => {
      if (!query) return true;
      const rule = def.lookup(name);
      return (name + " " + (rule?.type || "") + " " + (rule?.description || "")).toLowerCase().includes(query);
    });

    if (meta) {
      if (def.key === "maneuvers") {
        const sup = superiorityStats(profile, session);
        meta.textContent = [
          sup.knownCap ? owned.length + "/" + sup.knownCap + " known" : owned.length + " known",
          sup.qty ? sup.remaining + "/" + sup.qty + " " + sup.size + " Superiority Dice" : "",
          "DC " + sup.physicalDC + " Physical / " + sup.mentalDC + " Mental / " + sup.generalDC + " General"
        ].filter(Boolean).join(" · ");
      } else {
        meta.textContent = owned.length + " selected";
      }
    }

    if (!filtered.length) {
      appendText(root, "p", owned.length ? "No matching " + def.label.toLowerCase() + "." : "No " + def.label.toLowerCase() + " selected yet.").className = "muted";
      continue;
    }

    for (const name of filtered) {
      const rule = def.lookup(name);
      const evalSummary = rule?.mechanics?.summary && typeof interpolateRuleTokens === "function"
        ? interpolateRuleTokens(rule.mechanics.summary, profile, session)
        : rule?.mechanics?.summary;
      const grantSpec = (def.key === "fightingStyles" || def.key === "fightingMasteries") && typeof combatOptionGrantSpec === "function"
        ? combatOptionGrantSpec(name, profile, session) : null;
      const savedChoice = (def.key === "fightingStyles" || def.key === "fightingMasteries") ? session.combatOptionChoices?.[name] : null;
      const summary = [
        savedChoice?.length ? "Selected: " + savedChoice.join(", ") : "",
        rule?.type,
        rule?.mechanics?.timing ? formatTimingLabel(rule.mechanics.timing) : "",
        evalSummary,
        rule?.prerequisite
      ].filter(Boolean).join(" · ") || def.singular;
      const controls = collectionRow(root, rule?.name || name, summary, () => showCombatOptionInfo(def, name));
      if (grantSpec && grantSpec.storage === "combatOptionChoices" && typeof promptCombatOptionGrant === "function") {
        const complete = (savedChoice?.length || 0) >= (grantSpec.count || 1);
        ownedControl(controls, complete ? "Edit choice" : "Choose", name, ev => promptCombatOptionGrant(name, ev?.currentTarget || null), undefined, complete ? "" : "needsChoiceBtn");
      }
      ownedControl(controls, "Remove", name, () => removeCombatOption(def.key, name));
    }
  }

  for (const def of combatOptionDefs) {
    const badge = getElementById(def.tabId + "Count");
    if (badge) badge.textContent = String((session[def.key] || []).length);
  }

  renderClassOptionsManager(profile, session);
  if (getElementById("optionCatalog")?.open && activeOptionDef) {
    renderOptionLibrary();
  }
}

function _optionSearchText(entry) {
  if (entry._searchText === undefined) {
    entry._searchText = (entry.name + " " + (entry.type || "") + " " + (entry.prerequisite || "") + " " + (entry.description || "")).toLowerCase();
  }
  return entry._searchText;
}

function renderOptionLibrary() {
  const run = () => _renderOptionLibraryInner();
  if (typeof withEffectCache === "function") return withEffectCache(run);
  return run();
}

function _renderOptionLibraryInner() {
  const def = activeOptionDef;
  const list = getElementById("optionCatalogList");
  if (!def || !list) return;
  const {profile, session} = app.character;
  const ownedSet = new Set((session[def.key] || []).map(normalizeName));
  const title = getElementById("optionCatalogTitle");
  if (title) title.textContent = def.label + " library";
  const typeWrap = getElementById("optionTypeFilter");
  if (typeWrap) typeWrap.hidden = !def.hasSubFilter;

  const query = (getElementById("optionSearch")?.value || "").trim().toLowerCase();
  const typeVal = def.hasSubFilter ? (typeWrap?.value || "") : "";
  const timingVal = getElementById("optionTimingFilter")?.value || "";
  const sortMode = getElementById("optionSort")?.value || "available";
  const availOnly = getElementById("optionAvailableOnly")?.getAttribute("aria-pressed") === "true";

  const catalog = def.catalog();
  const matches = catalog.filter(entry => {
    if (typeVal && entry.type !== typeVal) return false;
    if (timingVal) {
      const tm = String(entry.mechanics?.timing || "free").toLowerCase();
      if (timingVal === "free") {
        if (["action", "bonus", "reaction"].includes(tm)) return false;
      } else if (tm !== timingVal) return false;
    }
    if (!query) return true;
    return _optionSearchText(entry).includes(query);
  }).map(entry => {
    const owned = ownedSet.has(normalizeName(entry.name));
    const prereq = typeof checkCombatOptionPrerequisite === "function"
      ? checkCombatOptionPrerequisite(profile, session, def, entry)
      : {met: true, reason: ""};
    return {entry, owned, prereq};
  }).filter(item => !availOnly || item.owned || item.prereq.met);

  const byName = (a, b) => a.entry.name.localeCompare(b.entry.name);
  const byAvail = (a, b) => Number(b.owned || b.prereq.met) - Number(a.owned || a.prereq.met);
  matches.sort((a, b) => {
    if (sortMode === "name") return byName(a, b);
    if (sortMode === "name-desc") return byName(b, a);
    if (sortMode === "timing") return String(a.entry.mechanics?.timing || "z").localeCompare(String(b.entry.mechanics?.timing || "z")) || byName(a, b);
    if (sortMode === "type") return String(a.entry.type || "z").localeCompare(String(b.entry.type || "z")) || byName(a, b);
    if (sortMode === "owned") return Number(b.owned) - Number(a.owned) || byName(a, b);
    return byAvail(a, b) || byName(a, b);
  });

  const totalPages = Math.max(1, Math.ceil(matches.length / optionLibraryPageSize));
  optionLibraryPage = clamp(optionLibraryPage, 0, totalPages - 1);
  const start = optionLibraryPage * optionLibraryPageSize;
  const slice = matches.slice(start, start + optionLibraryPageSize);

  list.replaceChildren();
  if (!slice.length) appendText(list, "p", "No matching entries found.").className = "muted";

  let showedLockedHeader = false;
  for (const {entry, owned, prereq} of slice) {
    if (sortMode === "available" && !owned && !prereq.met && !showedLockedHeader) {
      showedLockedHeader = true;
      appendText(list, "h3", "Prerequisites Not Met");
    }
    const evalSummary = entry.mechanics?.summary && typeof interpolateRuleTokens === "function"
      ? interpolateRuleTokens(entry.mechanics.summary, profile, session)
      : entry.mechanics?.summary;
    const summary = [
      entry.type,
      entry.mechanics?.timing ? formatTimingLabel(entry.mechanics.timing) : "",
      evalSummary,
      !owned && !prereq.met ? prereq.reason : ""
    ].filter(Boolean).join(" · ") || def.singular;
    const actions = collectionRow(list, entry.name, summary, () => showCombatOptionInfo(def, entry.name));
    const btn = ownedControl(actions, owned ? "Remove" : (!prereq.met ? "Locked" : "Add"), entry.name, event => {
      if (owned) removeCombatOption(def.key, entry.name);
      else if (prereq.met) addCombatOption(def.key, entry.name, event?.currentTarget || null);
    });
    if (!owned && !prereq.met) {
      btn.disabled = true;
      btn.title = prereq.reason;
    }
  }

  const status = getElementById("optionPageStatus");
  if (status) {
    status.textContent = matches.length
      ? "Showing " + (start + 1) + "–" + Math.min(matches.length, start + slice.length) + " of " + matches.length + " (page " + (optionLibraryPage + 1) + "/" + totalPages + ")"
      : "0 matches";
  }
  const nav = getElementById("optionPages");
  if (nav) {
    nav.hidden = totalPages <= 1;
    getElementById("previousOptionPage").disabled = optionLibraryPage <= 0;
    getElementById("nextOptionPage").disabled = optionLibraryPage >= totalPages - 1;
  }
}

function openOptionLibrary(def) {
  activeOptionDef = def;
  optionLibraryPage = 0;
  const search = getElementById("optionSearch");
  for (const id of ["optionSearch", "optionTypeFilter", "optionTimingFilter"]) {
    const el = getElementById(id);
    if (el) el.value = "";
  }
  const sortEl = getElementById("optionSort");
  if (sortEl) sortEl.value = "available";
  const avEl = getElementById("optionAvailableOnly");
  if (avEl) avEl.setAttribute("aria-pressed", "false");
  renderOptionLibrary();
  getElementById("optionCatalog")?.showModal();
  search?.focus();
}

function wireCombatOptions() {
  const dialog = getElementById("optionCatalog");
  if (dialog) {
    wireDialogDismissal(dialog, getElementById("closeOptionCatalog"));
    getElementById("optionAvailableOnly")?.addEventListener("click", ev => { const b = ev.currentTarget; b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")); optionLibraryPage = 0; renderOptionLibrary(); });
    const onOptionSearch = typeof _debounceFn === "function"
      ? _debounceFn(() => { optionLibraryPage = 0; renderOptionLibrary(); }, 120)
      : () => { optionLibraryPage = 0; renderOptionLibrary(); };
    getElementById("optionSearch")?.addEventListener("input", onOptionSearch);
    for (const id of ["optionTypeFilter", "optionTimingFilter", "optionSort"]) {
      getElementById(id)?.addEventListener("change", () => { optionLibraryPage = 0; renderOptionLibrary(); });
    }
    getElementById("previousOptionPage")?.addEventListener("click", () => { optionLibraryPage--; renderOptionLibrary(); });
    getElementById("nextOptionPage")?.addEventListener("click", () => { optionLibraryPage++; renderOptionLibrary(); });
  }
  const onOwnedOptSearch = typeof _debounceFn === "function"
    ? _debounceFn(() => { if (app.character) withEffectCache(() => renderCombatOptionsManager(app.character.profile, app.character.session)); }, 120)
    : () => { if (app.character) renderCombatOptionsManager(app.character.profile, app.character.session); };
  const onClassOptSearch = typeof _debounceFn === "function"
    ? _debounceFn(() => { if (app.character) withEffectCache(() => renderClassOptionsManager(app.character.profile, app.character.session)); }, 120)
    : () => { if (app.character) renderClassOptionsManager(app.character.profile, app.character.session); };
  for (const def of combatOptionDefs) {
    getElementById(def.openBtnId)?.addEventListener("click", () => openOptionLibrary(def));
    getElementById(def.searchId)?.addEventListener("input", onOwnedOptSearch);
  }
  getElementById("classOptionsSearch")?.addEventListener("input", onClassOptSearch);
}


function addClassOption(name, trigger = null) {
  const rule = typeof classOptionRule === "function" ? classOptionRule(name) : null;
  const isRepeatable = Boolean(rule?.repeatable);
  update("Added customization · " + name, next => {
    if (!Array.isArray(next.classOptions)) next.classOptions = [];
    if (isRepeatable || !next.classOptions.some(x => normalizeName(x) === normalizeName(name))) {
      next.classOptions.push(rule?.name || name);
    }
  });
  if (typeof promptClassOptionGrant === "function" && typeof classOptionGrantSpec === "function" && classOptionGrantSpec(name)) {
    promptClassOptionGrant(name, trigger);
  }
}

function removeClassOption(name) {
  const rule = typeof classOptionRule === "function" ? classOptionRule(name) : null;
  const isRepeatable = Boolean(rule?.repeatable);
  update("Removed customization · " + name, next => {
    if (!Array.isArray(next.classOptions)) next.classOptions = [];
    if (isRepeatable) {
      const idx = next.classOptions.findIndex(x => normalizeName(x) === normalizeName(name));
      if (idx >= 0) next.classOptions.splice(idx, 1);
    } else {
      next.classOptions = next.classOptions.filter(x => normalizeName(x) !== normalizeName(name));
    }
    const stillOwned = next.classOptions.some(x => normalizeName(x) === normalizeName(name));
    if (!stillOwned && next.classOptionChoices && typeof next.classOptionChoices === "object") {
      for (const k of Object.keys(next.classOptionChoices)) {
        if (normalizeName(k) === normalizeName(name)) delete next.classOptionChoices[k];
      }
    }
  });
}

function toggleClassImprovement(classNameOrEnabled, maybeEnabled) {
  const isLegacyBool = typeof classNameOrEnabled === "boolean";
  const targetClass = isLegacyBool ? (app.character?.profile?.className || "") : String(classNameOrEnabled || "");
  const enabled = isLegacyBool ? classNameOrEnabled : Boolean(maybeEnabled);
  const label = (enabled ? "Enabled " : "Disabled ") + (targetClass ? (targetClass + " ") : "") + "Class Improvement";
  update(label, (next, prof) => {
    const isPrimary = !targetClass || normalizeName(targetClass) === normalizeName(prof?.className);
    if (!Array.isArray(next.classImprovements)) next.classImprovements = [];
    if (isPrimary) {
      next.classImprovementEnabled = enabled;
    }
    if (targetClass) {
      if (enabled) {
        if (!next.classImprovements.some(x => normalizeName(x) === normalizeName(targetClass))) {
          next.classImprovements.push(targetClass);
        }
      } else {
        next.classImprovements = next.classImprovements.filter(x => normalizeName(x) !== normalizeName(targetClass));
      }
    }
  });
}

function renderClassOptionsManager(profile, session) {
  const classTab = getElementById("classTab");
  const optWrap = getElementById("classOptionsWrap");
  const impBox = getElementById("classImprovementBox");
  const ownedRoot = getElementById("ownedClassOptionsList");
  const availRoot = getElementById("availableClassOptionsList");
  const metaEl = getElementById("classOptionsMeta");
  if (!ownedRoot || !availRoot) return;

  const clsEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  const isMulti = clsEntries.length > 1;
  const activeClasses = clsEntries.length ? clsEntries : (profile?.className ? [{ name: profile.className, levels: profile.level || 1 }] : []);
  const allClassOpts = typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS : [];
  const poolEntries = activeClasses.map(c => ({
    className: c.name,
    levels: c.levels,
    meta: typeof classPoolMeta === "function" ? classPoolMeta(c.name) : null,
    opts: allClassOpts.filter(o => normalizeName(o.className) === normalizeName(c.name))
  })).filter(p => p.opts.length > 0 && p.meta);

  if (classTab) {
    const labelSpan = classTab.querySelector("span");
    if (labelSpan) {
      if (isMulti) {
        labelSpan.textContent = poolEntries.length ? "Classes & Customizations" : "Classes";
      } else {
        const meta = poolEntries[0]?.meta || (typeof classPoolMeta === "function" ? classPoolMeta(profile?.className) : null);
        const shortPool = meta?.tabLabel ? meta.tabLabel.replace(/^.*\s+/, "") : "";
        labelSpan.textContent = shortPool ? "Class & " + shortPool : "Class";
      }
    }
  }

  if (impBox) {
    impBox.replaceChildren();
    const impList = activeClasses
      .map(c => ({ className: c.name, levels: c.levels, imp: typeof classImprovementRule === "function" ? classImprovementRule(c.name) : null }))
      .filter(x => x.imp);
    impBox.hidden = !impList.length;
    const sessionCiSet = new Set((Array.isArray(session.classImprovements) ? session.classImprovements : []).map(normalizeName));
    for (const { className, imp } of impList) {
      const isPrimary = normalizeName(className) === normalizeName(profile?.className);
      const on = Boolean((isPrimary && session.classImprovementEnabled) || sessionCiSet.has(normalizeName(className)));
      const prereq = typeof checkImprovementPrerequisite === "function"
        ? checkImprovementPrerequisite(profile, session, imp)
        : { met: (typeof classLevelOf === "function" ? classLevelOf(profile, className) : (profile?.level || 1)) >= 3, missing: ["Requires 3+ levels in " + imp.className] };
      const rawSummary = imp.summary || (imp.description || "").split(/\n+/)[0];
      const summary = typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(rawSummary, profile, session) : rawSummary;
      const impPrimaryEff = (imp.effects || []).find(e => e.type === "actionGrant" || e.type === "contextualNote") || null;
      const impCad = typeof formatCadenceLabel === "function" ? formatCadenceLabel(impPrimaryEff?.cadence, impPrimaryEff?.rechargeMin) : "";
      const impDur = typeof formatDurationSpec === "function" ? formatDurationSpec(impPrimaryEff?.durationSpec) : "";
      const impFacts = [
        ["Kind", "Class Improvement"],
        ["Class", imp.className],
        ["Source", typeof formatSourceBook === "function" ? formatSourceBook(imp.source || "Expanded Content") : (imp.source || "Expanded Content")],
        ["Prerequisite", imp.prerequisite || "At least 3 levels"],
        ...(impPrimaryEff?.reactionKind ? [["Timing", typeof formatReactionKindTiming === "function" ? formatReactionKindTiming(impPrimaryEff.reactionKind) : "Reaction"]] : []),
        ...(impCad ? [["Cadence", impCad]] : []),
        ...(impDur ? [["Duration", impDur]] : [])
      ];
      const controls = collectionRow(impBox, "Class Improvement: " + imp.label, summary, () =>
        showInfo(imp.label, impFacts, imp.description));
      const btn = ownedControl(controls, on ? "Disable" : "Enable", imp.label, () => toggleClassImprovement(className, !on));
      if (!on && !prereq.met && btn) {
        btn.disabled = true;
        btn.title = prereq.missing.join("; ");
      }
    }
  }

  ownedRoot.replaceChildren();
  availRoot.replaceChildren();
  if (optWrap) optWrap.hidden = !poolEntries.length;
  const ownedNames = Array.isArray(session.classOptions) ? session.classOptions : [];
  const ownedSet = new Set(ownedNames.map(normalizeName));

  if (metaEl) {
    if (!poolEntries.length) {
      metaEl.textContent = "No separate customization pool for " + (typeof formatClassSummary === "function" ? formatClassSummary(profile, session) : profile.className) + ".";
    } else if (poolEntries.length === 1 && !isMulti) {
      const p = poolEntries[0];
      const step = typeof classLevelStepFor === "function" ? classLevelStepFor(profile, p.className) : classLevelStep(profile);
      const allowed = p.meta.levelCol ? (step[p.meta.levelCol] || "") : "";
      metaEl.textContent = p.meta.poolName + ": " + ownedNames.length + (allowed ? " / " + allowed + " at L" + p.levels : " selected");
    } else {
      metaEl.textContent = poolEntries.map(p => {
        const step = typeof classLevelStepFor === "function" ? classLevelStepFor(profile, p.className) : {};
        const allowed = p.meta.levelCol ? (step[p.meta.levelCol] || "") : "";
        const countForClass = ownedNames.filter(n => normalizeName(classOptionRule(n)?.className) === normalizeName(p.className)).length;
        return p.meta.poolName + ": " + countForClass + (allowed ? " / " + allowed + " (L" + p.levels + ")" : "");
      }).join(" · ");
    }
  }

  const query = (getElementById("classOptionsSearch")?.value || "").trim().toLowerCase();
  const _interpOpt = s => (typeof interpolateRuleTokens === "function" ? interpolateRuleTokens(s || "", profile, session) : String(s || ""));
  const _optInfoFacts = (rule, savedChoice, fallbackPool) => {
    const facts = [
      ["Kind", "Customization"],
      ["Pool", rule?.poolName || fallbackPool || ""],
      ...(rule?.source ? [["Source", rule.source]] : []),
      ...(savedChoice?.length ? [["Selection", savedChoice.join(", ")]] : []),
      ...(rule?.prerequisite ? [["Prerequisite", rule.prerequisite]] : [])
    ];
    const ag = (rule?.effects || []).find(e => e && e.type === "actionGrant");
    if (ag) {
      const timing = ag.zone === "reaction" ? (ag.reactionKind === "special" ? "Special Reaction" : "Reaction")
        : ag.zone === "bonus" ? "Bonus Action"
        : ag.zone === "action" ? "Action"
        : "Special";
      facts.push(["Timing", timing]);
      if (ag.cadence && ag.cadence !== "unlimited") {
        facts.push(["Cadence", ag.cadence === "oncePerTurn" ? "Once per turn" : ag.cadence === "oncePerRound" ? "Once per round" : ag.cadence]);
      }
    }
    const trigs = Array.isArray(rule?.turnTriggers) && rule.turnTriggers.length
      ? rule.turnTriggers
      : ((rule?.effects || []).flatMap(e => Array.isArray(e?.turnTriggers) ? e.turnTriggers : []));
    if (trigs.length) {
      const seenT = new Set();
      const tNotes = trigs.map(t => _interpOpt(t.note)).filter(n => n && !seenT.has(n) && seenT.add(n));
      if (tNotes.length) facts.push(["Turn Trigger", tNotes.join(" · ")]);
    }
    return facts;
  };

  if (ownedNames.length) {
    appendText(ownedRoot, "h3", poolEntries.length === 1 ? ("Selected " + poolEntries[0].meta.poolName) : "Selected Customizations");
    const ownedCounts = new Map();
    const distinctOwned = [];
    for (const name of ownedNames) {
      const k = normalizeName(name);
      ownedCounts.set(k, (ownedCounts.get(k) || 0) + 1);
      if (ownedCounts.get(k) === 1) distinctOwned.push(name);
    }
    for (const name of distinctOwned) {
      const rule = classOptionRule(name);
      const copies = ownedCounts.get(normalizeName(name)) || 1;
      const grantSpec = typeof classOptionGrantSpec === "function" ? classOptionGrantSpec(name, profile, session) : null;
      const savedChoice = session.classOptionChoices?.[rule?.name || name] || session.classOptionChoices?.[name];
      const titleLabel = (rule?.name || name) + (copies > 1 ? " ×" + copies : "");
      const summary = [
        poolEntries.length > 1 && rule?.poolName ? rule.poolName : "",
        savedChoice?.length ? "Selected: " + savedChoice.join(", ") : "",
        _interpOpt(rule?.summary || (rule?.description || "").split(/\n+/)[0])
      ].filter(Boolean).join(" · ");
      const controls = collectionRow(ownedRoot, titleLabel, summary, () =>
        showInfo(rule?.name || name, _optInfoFacts(rule, savedChoice, poolEntries[0]?.meta?.poolName), rule?.description || ""));
      if (grantSpec && typeof promptClassOptionGrant === "function") {
        const complete = (savedChoice?.length || 0) >= grantSpec.count;
        ownedControl(controls, complete ? "Edit choice" : "Choose", name, ev => promptClassOptionGrant(name, ev.currentTarget), undefined, complete ? "" : "needsChoiceBtn");
      }
      ownedControl(controls, "Remove", name, () => removeClassOption(name));
    }
  }

  for (const p of poolEntries) {
    const matches = p.opts.filter(o => !query || (o.name + " " + o.prerequisite + " " + o.description).toLowerCase().includes(query));
    const unowned = matches.filter(o => o.repeatable || !ownedSet.has(normalizeName(o.name)));
    const eligible = [];
    const locked = [];
    for (const opt of unowned) {
      const prereq = typeof checkClassOptionPrerequisite === "function"
        ? checkClassOptionPrerequisite(profile, session, opt)
        : {met: true, reason: ""};
      if (prereq.met) eligible.push({opt, prereq});
      else locked.push({opt, prereq});
    }
    const ownedForPool = ownedNames.filter(n => normalizeName(classOptionRule(n)?.className) === normalizeName(p.className)).length;

    if (eligible.length) {
      const availDetails = document.createElement("details");
      availDetails.className = "featureAccordion";
      availDetails.style.gridColumn = "1 / -1";
      if (query || !ownedForPool) availDetails.open = true;
      const sum = appendText(availDetails, "summary", "");
      appendText(sum, "span", "Available " + p.meta.poolName);
      appendText(sum, "span", String(eligible.length)).className = "featureLevel";
      const availList = appendText(availDetails, "div", "");
      availList.className = "library";
      for (const {opt} of eligible) {
        const summary = _interpOpt(opt.summary || (opt.description || "").split(/\n+/)[0]);
        const controls = collectionRow(availList, opt.name, summary, () =>
          showInfo(opt.name, _optInfoFacts(opt, null, p.meta.poolName), opt.description));
        ownedControl(controls, "Add", opt.name, ev => addClassOption(opt.name, ev.currentTarget));
      }
      availRoot.append(availDetails);
    }

    if (locked.length) {
      const lockedDetails = document.createElement("details");
      lockedDetails.className = "featureAccordion";
      lockedDetails.style.gridColumn = "1 / -1";
      const sum = appendText(lockedDetails, "summary", "");
      appendText(sum, "span", poolEntries.length > 1 ? ("Locked " + p.meta.poolName + " — Prerequisites Not Met") : "Locked — Prerequisites Not Met");
      appendText(sum, "span", String(locked.length)).className = "featureLevel";
      const lockedList = appendText(lockedDetails, "div", "");
      lockedList.className = "library";
      for (const {opt, prereq} of locked) {
        const summary = [prereq.reason, opt.summary || (opt.description || "").split(/\n+/)[0]].filter(Boolean).join(" · ");
        const controls = collectionRow(lockedList, opt.name, summary, () =>
          showInfo(opt.name, [["Kind", "Customization"], ["Pool", p.meta.poolName || ""], ["Prerequisite", opt.prerequisite || ""]], opt.description));
        const addBtn = ownedControl(controls, "Locked", opt.name, () => {});
        addBtn.disabled = true;
        addBtn.title = prereq.reason;
      }
      availRoot.append(lockedDetails);
    }
  }
}
