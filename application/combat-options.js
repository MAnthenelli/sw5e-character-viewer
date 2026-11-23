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

  const ownedCo = typeof ownedClassOptions === "function" ? ownedClassOptions(profile, session) : [];
  const hasCoMech = k => ownedCo.some(o => o.mechanics?.[k]);
  return {
    maneuvers: (cls === "fighter" && lvl >= 2) || cls === "scholar" || hasStyle("Superiority Style") || hasMastery("Superiority Mastery") || maneuvers.length > 0,
    fightingStyles: cls === "fighter" || (cls === "guardian" && lvl >= 2) || (cls === "scout" && lvl >= 2) || hasFeat(session, "Fighting Stylist") || hasCoMech("grantsFightingStyle") || styles.length > 0,
    fightingMasteries: hasFeat(session, "Fighting Master") || hasCoMech("grantsFightingMastery") || masteries.length > 0,
    lightsaberForms: (cls === "guardian" && lvl >= 3) || hasFeat(session, "Formfighting Dabbler") || hasStyle("Formfighting Style") || hasMastery("Formfighting Mastery") || hasCoMech("unlocksLightsaberForms") || forms.length > 0
  };
}

function addCombatOption(key, name) {
  const def = combatOptionDefs.find(d => d.key === key);
  if (!def) return;
  update("Added " + def.singular.toLowerCase() + " · " + name, next => {
    if (!Array.isArray(next[key])) next[key] = [];
    if (!next[key].some(x => normalizeName(x) === normalizeName(name))) {
      next[key].push(name);
    }
  });
}

function removeCombatOption(key, name) {
  const def = combatOptionDefs.find(d => d.key === key);
  if (!def) return;
  update("Removed " + def.singular.toLowerCase() + " · " + name, next => {
    if (!Array.isArray(next[key])) return;
    next[key] = next[key].filter(x => normalizeName(x) !== normalizeName(name));
  });
}

function showCombatOptionInfo(def, name) {
  const rule = def.lookup(name);
  const meta = [];
  if (rule?.type) meta.push(["Type", rule.type]);
  if (rule?.prerequisite) meta.push(["Prerequisite", rule.prerequisite]);
  showInfo(rule?.name || name, meta, rule?.description || "Custom " + def.singular.toLowerCase() + " from character export.");
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
      const summary = [
        rule?.type,
        rule?.mechanics?.timing,
        rule?.mechanics?.summary,
        rule?.prerequisite
      ].filter(Boolean).join(" · ") || def.singular;
      const controls = collectionRow(root, rule?.name || name, summary, () => showCombatOptionInfo(def, name));
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

function renderOptionLibrary() {
  const def = activeOptionDef;
  const list = getElementById("optionCatalogList");
  if (!def || !list) return;
  const {session} = app.character;
  const ownedSet = new Set((session[def.key] || []).map(normalizeName));
  const title = getElementById("optionCatalogTitle");
  if (title) title.textContent = def.label + " library";
  const typeWrap = getElementById("optionTypeFilter");
  if (typeWrap) typeWrap.hidden = !def.hasSubFilter;

  const query = (getElementById("optionSearch")?.value || "").trim().toLowerCase();
  const typeVal = def.hasSubFilter ? (typeWrap?.value || "") : "";
  const catalog = def.catalog();
  const {profile} = app.character;
  const matches = catalog.filter(entry => {
    if (typeVal && entry.type !== typeVal) return false;
    if (!query) return true;
    return (entry.name + " " + (entry.type || "") + " " + (entry.prerequisite || "") + " " + (entry.description || "")).toLowerCase().includes(query);
  }).map(entry => {
    const owned = ownedSet.has(normalizeName(entry.name));
    const prereq = typeof checkCombatOptionPrerequisite === "function"
      ? checkCombatOptionPrerequisite(profile, session, def, entry)
      : {met: true, reason: ""};
    return {entry, owned, prereq};
  }).sort((a, b) => Number(b.owned || b.prereq.met) - Number(a.owned || a.prereq.met) || a.entry.name.localeCompare(b.entry.name));

  const totalPages = Math.max(1, Math.ceil(matches.length / optionLibraryPageSize));
  optionLibraryPage = clamp(optionLibraryPage, 0, totalPages - 1);
  const start = optionLibraryPage * optionLibraryPageSize;
  const slice = matches.slice(start, start + optionLibraryPageSize);

  list.replaceChildren();
  if (!slice.length) appendText(list, "p", "No matching entries found.").className = "muted";

  let showedLockedHeader = false;
  for (const {entry, owned, prereq} of slice) {
    if (!owned && !prereq.met && !showedLockedHeader) {
      showedLockedHeader = true;
      appendText(list, "h3", "Prerequisites Not Met");
    }
    const summary = [
      entry.type,
      entry.mechanics?.timing,
      entry.mechanics?.summary,
      !owned && !prereq.met ? prereq.reason : ""
    ].filter(Boolean).join(" · ") || def.singular;
    const actions = collectionRow(list, entry.name, summary, () => showCombatOptionInfo(def, entry.name));
    const btn = ownedControl(actions, owned ? "Remove" : (!prereq.met ? "Locked" : "Add"), entry.name, () => {
      if (owned) removeCombatOption(def.key, entry.name);
      else if (prereq.met) addCombatOption(def.key, entry.name);
      renderOptionLibrary();
    });
    if (!owned && !prereq.met) {
      btn.disabled = true;
      btn.title = prereq.reason;
    }
  }

  const status = getElementById("optionPageStatus");
  if (status) {
    status.textContent = matches.length
      ? "Showing " + (start + 1) + "–" + Math.min(matches.length, start + slice.length) + " of " + matches.length + " " + def.label.toLowerCase()
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
  const typeFilter = getElementById("optionTypeFilter");
  if (search) search.value = "";
  if (typeFilter) typeFilter.value = "";
  renderOptionLibrary();
  getElementById("optionCatalog")?.showModal();
  search?.focus();
}

function wireCombatOptions() {
  const dialog = getElementById("optionCatalog");
  if (dialog) {
    wireDialogDismissal(dialog, getElementById("closeOptionCatalog"));
    for (const id of ["optionSearch", "optionTypeFilter"]) {
      getElementById(id)?.addEventListener("input", () => { optionLibraryPage = 0; renderOptionLibrary(); });
      getElementById(id)?.addEventListener("change", () => { optionLibraryPage = 0; renderOptionLibrary(); });
    }
    getElementById("previousOptionPage")?.addEventListener("click", () => { optionLibraryPage--; renderOptionLibrary(); });
    getElementById("nextOptionPage")?.addEventListener("click", () => { optionLibraryPage++; renderOptionLibrary(); });
  }
  for (const def of combatOptionDefs) {
    getElementById(def.openBtnId)?.addEventListener("click", () => openOptionLibrary(def));
    getElementById(def.searchId)?.addEventListener("input", () => renderCombatOptionsManager(app.character.profile, app.character.session));
  }
  getElementById("classOptionsSearch")?.addEventListener("input", () => { if (app.character) renderClassOptionsManager(app.character.profile, app.character.session); });
}


function addClassOption(name) {
  update("Added class option · " + name, next => {
    if (!Array.isArray(next.classOptions)) next.classOptions = [];
    if (!next.classOptions.some(x => normalizeName(x) === normalizeName(name))) {
      next.classOptions.push(name);
    }
  });
}

function removeClassOption(name) {
  update("Removed class option · " + name, next => {
    if (!Array.isArray(next.classOptions)) next.classOptions = [];
    next.classOptions = next.classOptions.filter(x => normalizeName(x) !== normalizeName(name));
  });
}

function toggleClassImprovement(enabled) {
  update(enabled ? "Enabled Class Improvement" : "Disabled Class Improvement", next => {
    next.classImprovementEnabled = Boolean(enabled);
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

  const meta = typeof classPoolMeta === "function" ? classPoolMeta(profile?.className) : null;
  const imp = typeof classImprovementRule === "function" ? classImprovementRule(profile?.className) : null;
  if (classTab) {
    const labelSpan = classTab.querySelector("span");
    const shortPool = meta?.tabLabel ? meta.tabLabel.replace(/^.*\s+/, "") : "";
    if (labelSpan) labelSpan.textContent = shortPool ? "Class & " + shortPool : "Class";
  }

  if (impBox) {
    impBox.replaceChildren();
    impBox.hidden = !imp;
    if (imp) {
      const on = Boolean(session.classImprovementEnabled);
      const summary = imp.mechanics?.summary || (imp.description || "").split(/\n+/)[0];
      const controls = collectionRow(impBox, "Class Improvement: " + imp.label, summary, () =>
        showInfo(imp.label + " (" + imp.className + " Improvement)", [["Source", "Class Improvement"]], imp.description));
      ownedControl(controls, on ? "Disable" : "Enable", imp.label, () => toggleClassImprovement(!on));
    }
  }

  ownedRoot.replaceChildren();
  availRoot.replaceChildren();
  const poolOpts = (typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS : [])
    .filter(o => normalizeName(o.className) === normalizeName(profile?.className));
  if (optWrap) optWrap.hidden = !poolOpts.length;
  const ownedNames = Array.isArray(session.classOptions) ? session.classOptions : [];
  const ownedSet = new Set(ownedNames.map(normalizeName));
  const step = classLevelStep(profile);
  const allowed = meta?.levelCol ? (step[meta.levelCol] || "") : "";
  if (metaEl) {
    metaEl.textContent = poolOpts.length
      ? (meta.poolName + ": " + ownedNames.length + (allowed ? " / " + allowed + " at L" + profile.level : " selected"))
      : "No separate customization pool for " + profile.className + ".";
  }

  const query = (getElementById("classOptionsSearch")?.value || "").trim().toLowerCase();
  const matches = poolOpts.filter(o => !query || (o.name + " " + o.prerequisite + " " + o.description).toLowerCase().includes(query));

  if (ownedNames.length) {
    appendText(ownedRoot, "h3", "Selected " + (meta?.poolName || "Options"));
    for (const name of ownedNames) {
      const rule = classOptionRule(name);
      const summary = rule?.summary || (rule?.description || "").split(/\n+/)[0];
      const controls = collectionRow(ownedRoot, rule?.name || name, summary, () =>
        showInfo(rule?.name || name, [["Pool", meta?.poolName || ""], ["Prerequisite", rule?.prerequisite || ""]], rule?.description || ""));
      ownedControl(controls, "Remove", name, () => removeClassOption(name));
    }
  }

  const unowned = matches.filter(o => !ownedSet.has(normalizeName(o.name)));
  const eligible = [];
  const locked = [];
  for (const opt of unowned) {
    const prereq = typeof checkClassOptionPrerequisite === "function"
      ? checkClassOptionPrerequisite(profile, session, opt)
      : {met: true, reason: ""};
    if (prereq.met) eligible.push({opt, prereq});
    else locked.push({opt, prereq});
  }

  if (eligible.length) {
    appendText(availRoot, "h3", "Available " + (meta?.poolName || "Options"));
    for (const {opt} of eligible) {
      const summary = opt.summary || (opt.description || "").split(/\n+/)[0];
      const controls = collectionRow(availRoot, opt.name, summary, () =>
        showInfo(opt.name, [["Pool", meta?.poolName || ""], ["Prerequisite", opt.prerequisite || ""]], opt.description));
      ownedControl(controls, "Add", opt.name, () => addClassOption(opt.name));
    }
  }

  if (locked.length) {
    const lockedDetails = document.createElement("details");
    lockedDetails.className = "featureAccordion";
    lockedDetails.style.gridColumn = "1 / -1";
    const sum = appendText(lockedDetails, "summary", "");
    appendText(sum, "span", "Locked — Prerequisites Not Met");
    appendText(sum, "span", String(locked.length)).className = "featureLevel";
    const lockedList = appendText(lockedDetails, "div", "");
    lockedList.className = "library";
    for (const {opt, prereq} of locked) {
      const summary = [prereq.reason, opt.summary || (opt.description || "").split(/\n+/)[0]].filter(Boolean).join(" · ");
      const controls = collectionRow(lockedList, opt.name, summary, () =>
        showInfo(opt.name, [["Pool", meta?.poolName || ""], ["Prerequisite", opt.prerequisite || ""]], opt.description));
      const addBtn = ownedControl(controls, "Locked", opt.name, () => {});
      addBtn.disabled = true;
      addBtn.title = prereq.reason;
    }
    availRoot.append(lockedDetails);
  }
}
