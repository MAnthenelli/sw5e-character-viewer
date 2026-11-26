let _lastAuditSig = "";
let _lastAuditPending = [];
function _structuralAuditSignature(profile, session) {
  return JSON.stringify([
    profile?.name, profile?.level, profile?.className, profile?.species, profile?.background,
    session?.approach, session?.approaches, session?.speciesChoice, session?.forceAffinity, session?.classChoice, session?.signaturePower,
    session?.classImprovementEnabled, session?.classImprovements, session?.multiclassImprovements, session?.splashclassImprovements,
    (session?.feats || []).length, (session?.feats || []).map(f => [f.name, f.choice, f.abilityChoice, f.multiChoice, f.powersChoice]),
    (session?.classOptions || []).length, session?.classOptionChoices,
    session?.speciesTraitChoices, session?.backgroundChoices, session?.archetypeFeatureChoices,
    session?.skillOverrides,
    (session?.powers || []).length, (session?.maneuvers || []).length,
    (session?.fightingStyles || []).length, (session?.fightingMasteries || []).length, (session?.lightsaberForms || []).length
  ]);
}

function render() {
  const run = () => _renderInner();
  if (typeof withEffectCache === "function") return withEffectCache(run);
  return run();
}

function _renderInner() {
  getElementById("loadError").hidden = true;
  document.body.classList.toggle("light", app.light);
  getElementById("theme").setAttribute("aria-checked", String(!app.light));
  getElementById("themeState").textContent = app.light ? "Off" : "On";
  const character = app.character;
  getElementById("playSheet").hidden = !character;
  getElementById("emptySheet").hidden = Boolean(character);
  getElementById("stickyState").hidden = !character;
  document.querySelector(".mobileNav").hidden = !character;
  getElementById("characterName").textContent = character?.profile.name || "SW5e Character Viewer";
  const _mcList = character && typeof characterClasses === "function" ? characterClasses(character.profile, character.session) : [];
  const _clsDisp = character && typeof formatClassSummary === "function" ? formatClassSummary(character.profile, character.session) : (character?.profile.className || "");
  getElementById("characterSubtitle").textContent = character
    ? (_mcList.length > 1
      ? ("Level " + character.profile.level + " " + character.profile.species + " · " + _clsDisp)
      : ("Level " + character.profile.level + " " + character.profile.species + " " + character.profile.className))
    : "";
  getElementById("notice").textContent = notice;
  getElementById("feedback").hidden = !notice;
  const expBtn = getElementById("exportBackup");
  if (expBtn) expBtn.disabled = !app.character;
  const auditMenuBtn = getElementById("openAuditMenuBtn");
  if (auditMenuBtn) auditMenuBtn.disabled = !app.character;
  const setupBtn = getElementById("setupAuditBtn");
  if (setupBtn) {
    let pending = [];
    if (character && typeof auditCharacterCompleteness === "function") {
      const sig = _structuralAuditSignature(character.profile, character.session);
      if (sig !== _lastAuditSig) {
        _lastAuditSig = sig;
        _lastAuditPending = auditCharacterCompleteness(character.profile, character.session).filter(it => it.severity !== "info");
      }
      pending = _lastAuditPending;
    } else {
      _lastAuditSig = "";
      _lastAuditPending = [];
    }
    setupBtn.hidden = !pending.length;
    if (pending.length) {
      setupBtn.textContent = "Setup · " + pending.length;
      setupBtn.title = pending.length + " missing feature" + (pending.length === 1 ? "" : "s") + " or unresolved choice" + (pending.length === 1 ? "" : "s");
    }
  }
  for (const id of ["undo", "feedbackUndo"]) {
    const button = getElementById(id);
    button.disabled = !app.history.length;
    button.title = app.history.length ? "Undo · " + app.history.at(-1).label : "Undo";
  }
  if (!character) return;
  const active = document.activeElement;
  const identity = active?.dataset.skill ? ["data-skill", active.dataset.skill] :
    active?.ariaLabel ? ["aria-label", active.ariaLabel] : null;
  const {profile, session} = character;
  const effects = renderEffects(profile, session);
  renderHealth(profile, session, effects);
  renderActions(profile, session);
  renderResources(profile, session);
  renderSkills(profile, session);
  const binderOpen = Boolean(getElementById("binderDetails")?.open);
  const anyCatalogOpen = Boolean(
    getElementById("itemCatalog")?.open || getElementById("featCatalog")?.open ||
    getElementById("powerCatalog")?.open || getElementById("optionCatalog")?.open
  );
  _binderDirty = true;
  if (binderOpen || anyCatalogOpen) {
    _renderBinderNow(profile, session);
  } else {
    _syncBinderTabBadges(profile, session);
  }
  const powersGroup = getElementById("binderPowersGroup");
  if (powersGroup) {
    const anyPowerTab = [...powersGroup.querySelectorAll("button[role='tab']")].some(t => !t.hidden);
    powersGroup.hidden = !anyPowerTab;
  }
  if (binderTabs) binderTabs.sync();
  if (identity && !active.isConnected) {
    const [key, value] = identity;
    [...document.querySelectorAll("button[" + key + "]")].find(button =>
      button.getAttribute(key) === value && !button.disabled && button.getClientRects().length)?.focus({preventScroll: true});
  }
}

let binderTabs = null;
let _binderDirty = true;

function _syncBinderTabBadges(profile, session) {
  const invCount = getElementById("inventoryTabCount");
  if (invCount) invCount.textContent = String((session.equipped || []).length);
  const featCount = getElementById("featTabCount");
  if (featCount) featCount.textContent = String((session.feats || []).length);
  if (typeof castingStats === "function" && typeof knownPowerRecords === "function") {
    const casting = castingStats(profile, session);
    const ft = getElementById("forcePowerTab");
    const tt = getElementById("techPowerTab");
    if (ft) ft.hidden = !casting.hasForce;
    if (tt) tt.hidden = !casting.hasTech;
    const fc = getElementById("forcePowerTabCount");
    if (fc) fc.textContent = String(knownPowerRecords(profile, "Force", session).length);
    const tc = getElementById("techPowerTabCount");
    if (tc) tc.textContent = String(knownPowerRecords(profile, "Tech", session).length);
  }
  if (typeof conditionalOptionVisibility === "function" && typeof combatOptionDefs !== "undefined") {
    const vis = conditionalOptionVisibility(profile, session);
    for (const def of combatOptionDefs) {
      const tab = getElementById(def.tabId);
      if (tab) tab.hidden = !vis[def.key];
      const badge = getElementById(def.tabId + "Count");
      if (badge) badge.textContent = String((session[def.key] || []).length);
    }
  }
}

function _renderBinderNow(profile, session) {
  const run = () => {
    renderCollections(profile, session);
    if (typeof renderPowerManager === "function") renderPowerManager(profile, session);
    if (typeof renderCombatOptionsManager === "function") renderCombatOptionsManager(profile, session);
    if (typeof renderBinderCharacterPages === "function") renderBinderCharacterPages(profile, session);
    _binderDirty = false;
  };
  if (typeof withEffectCache === "function") withEffectCache(run);
  else run();
}

function createTabController(ids) {
  const tabs = ids.map(getElementById).filter(Boolean);
  const visibleTabs = () => tabs.filter(t => !t.hidden);
  const select = selected => {
    if (!selected || selected.hidden) return;
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const pane = getElementById(tab.getAttribute("aria-controls"));
      if (pane) pane.hidden = !active;
    }
  };
  const sync = () => {
    const active = tabs.find(t => t.getAttribute("aria-selected") === "true" && !t.hidden);
    if (active) {
      select(active);
    } else {
      const first = visibleTabs()[0];
      if (first) select(first);
    }
  };
  tabs.forEach(tab => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      const vis = visibleTabs();
      const idx = vis.indexOf(tab);
      if (idx < 0 || !vis.length) return;
      const map = {
        ArrowLeft: (idx + vis.length - 1) % vis.length,
        ArrowUp: (idx + vis.length - 1) % vis.length,
        ArrowRight: (idx + 1) % vis.length,
        ArrowDown: (idx + 1) % vis.length,
        Home: 0,
        End: vis.length - 1
      };
      const target = map[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(vis[target]);
      vis[target].focus();
    });
  });
  sync();
  return {select, sync, tabs, visibleTabs};
}


function wireSheetMenu() {
  const btn = getElementById("sheetMenuBtn");
  const panel = getElementById("sheetMenuPanel");
  if (!btn || !panel) return;
  const setOpen = open => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", event => {
    event.stopPropagation();
    setOpen(panel.hidden);
  });
  panel.addEventListener("click", event => {
    const item = event.target.closest("button");
    if (item && item.id !== "theme") setOpen(false);
  });
  document.addEventListener("click", event => {
    if (!panel.hidden && !panel.contains(event.target) && event.target !== btn) setOpen(false);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) {
      setOpen(false);
      btn.focus();
    }
  });
  getElementById("emptyImportBtn")?.addEventListener("click", () => getElementById("importButton")?.click());
}

function wireMobileNav() {
  const links = [...document.querySelectorAll(".mobileNav a[href^='#']")];
  if (!links.length) return;
  const setCurrent = hash => {
    for (const a of links) {
      if (a.getAttribute("href") === hash) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  };
  setCurrent(links[0].getAttribute("href"));
  for (const a of links) {
    a.addEventListener("click", () => setCurrent(a.getAttribute("href")));
  }
  if (typeof IntersectionObserver === "function") {
    const sections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]?.target?.id) setCurrent("#" + visible[0].target.id);
    }, {rootMargin: "-84px 0px -60% 0px", threshold: 0.01});
    for (const s of sections) observer.observe(s);
  }
}

function wireViewer() {
  wireDialogDismissal(getElementById("infoModal"), getElementById("closeInfo"));
  getElementById("closeInfoDone")?.addEventListener("click", () => getElementById("infoModal")?.close());
  getElementById("infoBack")?.addEventListener("click", () => { if (typeof popInfoModal === "function") popInfoModal(); });
  wireSheetMenu();
  wireMobileNav();
  wireImportDialog();
  getElementById("formTitle")?.addEventListener("click", showCharacterInfo);
  getElementById("setupAuditBtn")?.addEventListener("click", ev => { if (typeof openCharacterAuditModal === "function") openCharacterAuditModal(ev.currentTarget); });
  getElementById("openAuditMenuBtn")?.addEventListener("click", ev => { if (typeof openCharacterAuditModal === "function") openCharacterAuditModal(ev.currentTarget); });
  getElementById("openQuickRefBtn")?.addEventListener("click", () => { if (typeof showQuickReferenceDialog === "function") showQuickReferenceDialog(); });
  getElementById("openSavesInfo")?.addEventListener("click", ev => {
    showMathPopover(ev.currentTarget, "Saving Throws", [
      ["Formula", "1d20 + Ability modifier + Proficiency (if P) or 2× Proficiency (if E)"],
      ["P / E tags", "P = Proficient · E = Expertise"],
      ["Cover (Dexterity saves)", "One-quarter: +2 · Half: +3 · Three-quarters: +5"],
      ["Click any save", "Tap any saving throw to inspect its live formula and adjust its temporary modifier"]
    ], "SW5e Player's Handbook Ch. 7 & 9 · Natural 1/20 only auto-fail/succeed on attack rolls and death saves, not standard saving throws.");
  });
  getElementById("openResourcesInfo")?.addEventListener("click", ev => {
    showMathPopover(ev.currentTarget, "Resources & Rests", [
      ["SR tag", "Recharges on a Short Rest (1 hr) or Long Rest (8 hr) — includes Tech Points, Focus Points, and Superiority Dice"],
      ["LR tag", "Recharges on a Long Rest (8 hr) — includes Force Points and daily features"],
      ["Force & Tech casting", "Power cost = power level + 1 points (At-will = 0; Level 1 = 2 points; Level 2 = 3 points)"],
      ["Hit Dice", "Spent inside the Short Rest dialog to heal (1 Hit Die + Constitution modifier per die)"]
    ], "Tap any pip or +/− control to track spending; use Short Rest or Long Rest below to preview and recover pools.");
  });
  getElementById("binderDetails")?.addEventListener("toggle", ev => {
    if (ev.currentTarget.open && _binderDirty && app.character) {
      _renderBinderNow(app.character.profile, app.character.session);
    }
  });
  getElementById("openStandardActions")?.addEventListener("click", ev => showStandardActionsDialog(ev.currentTarget));
  getElementById("openBonusActionInfo")?.addEventListener("click", ev => showBonusActionInfoDialog(ev.currentTarget));
  getElementById("openReactionInfo")?.addEventListener("click", ev => showReactionInfoDialog(ev.currentTarget));
  getElementById("hpMathTrigger")?.addEventListener("click", ev => {
    if (!app.character) return;
    const {profile, session} = app.character;
    const scores = effectiveScores(profile, session);
    const spHp = speciesHpBonus(profile, session);
    const ftHp = featHpBonus(profile, session);
    const maxHp = hitPointMaximum(profile, session);
    const conMod = modifier(scores.Constitution);
    const conTotal = profile.level * conMod;
    const hpTerms = [];
    if (profile.hpOverride) {
      hpTerms.push({ label: "Override", value: String(profile.hpOverride) });
    } else {
      if (profile.hpDice) hpTerms.push({ label: "Hit Dice", value: String(profile.hpDice) });
      hpTerms.push({ label: profile.level + "×CON", value: signed(conTotal), signed: true });
      if (spHp) hpTerms.push({ label: profile.species || "Species", value: signed(spHp), signed: true, source: profile.species ? { kind: "species", name: profile.species } : null });
      const hpEffPop = typeof resolveHpEffects === "function" ? resolveHpEffects(profile, session) : null;
      const featHpSrcs = (hpEffPop?.sources || []).filter(s => s.kind === "feat").map(s => ({ label: s.name, source: s.sourceObj || { kind: "feat", name: s.name } }));
      if (ftHp) hpTerms.push({ label: "Feats", value: signed(ftHp), signed: true, ...(featHpSrcs.length ? { sources: featHpSrcs } : {}) });
      if (profile.extraHpBonus) hpTerms.push({ label: "Extra", value: signed(profile.extraHpBonus), signed: true });
      const effHp = maxHp - ((profile.hpDice || 0) + conTotal + spHp + ftHp + (profile.extraHpBonus || 0));
      const effHpSrcs = (hpEffPop?.sources || []).filter(s => s.kind !== "feat" && s.kind !== "species").map(s => ({ label: s.name, source: s.sourceObj || { kind: s.kind, name: s.name } }));
      if (effHp) hpTerms.push({ label: "Effects", value: signed(effHp), signed: true, ...(effHpSrcs.length ? { sources: effHpSrcs } : {}) });
    }
    const hpEffPop = typeof resolveHpEffects === "function" ? resolveHpEffects(profile, session) : null;
    let minHealVal = "";
    if (hpEffPop && hpEffPop.enhancedHealingMin > 0) {
      const wrap = document.createElement("span");
      wrap.append(
        document.createTextNode(hpEffPop.enhancedHealingMin + " HP minimum (capped at effect max · "),
        renderSourceLinks(hpEffPop.healingMods.map(h => ({ label: h.source, source: h.sourceObj || h.source }))),
        document.createTextNode(")")
      );
      minHealVal = wrap;
    }
    showMathPopover(ev.currentTarget, "Hit Points", [
      ["Current HP", session.hp + " / " + maxHp],
      ["Temporary HP", session.temp ? session.temp + (session.tempSource ? " (" + session.tempSource + ")" : "") : ""],
      ["Enhanced healing", minHealVal],
      ["Instant death", "Remaining damage ≥ " + maxHp + " at 0 HP"]
    ], "Temporary HP absorbs damage first and does not stack (keep the higher total).", [], {
      rule: "Hit Dice + (Level × Constitution modifier) + Bonuses",
      terms: hpTerms,
      total: maxHp + " Max HP"
    });
  });
  getElementById("openDeathSaveInfo")?.addEventListener("click", ev => {
    const hpEffD = app.character && typeof resolveHpEffects === "function" ? resolveHpEffects(app.character.profile, app.character.session) : null;
    let rollTxt = "1d20 (no ability modifier) · DC 10";
    if (hpEffD && hpEffD.deathSaveBonus) {
      const wrap = document.createElement("span");
      const dsItems = (hpEffD.deathSaveSourceObjs?.length ? hpEffD.deathSaveSourceObjs : hpEffD.deathSaveSources.map(s => ({ name: s })))
        .map(o => ({ label: o.name, source: o }));
      wrap.append(
        document.createTextNode("1d20 " + signed(hpEffD.deathSaveBonus) + " ("),
        renderSourceLinks(dsItems),
        document.createTextNode(") · DC 10")
      );
      rollTxt = wrap;
    }
    showMathPopover(ev.currentTarget, "Death Saving Throws", [
      ["When", "Start of your turn while at 0 HP"],
      ["Roll", rollTxt],
      ["3 Successes", "Stabilize at 0 HP (Unconscious)"],
      ["3 Failures", "Character dies"],
      ["Natural 20", "Immediately regain 1 HP"],
      ["Natural 1", "Counts as 2 failures"],
      ["Damage at 0 HP", "1 failure (2 failures on a critical hit)"]
    ], "SW5e Player's Handbook Ch. 9 · Any healing immediately resets death saves and wakes you up.");
  });
  getElementById("theme").addEventListener("click", () => { app.light = !app.light; save(); render(); });
  getElementById("exportBackup")?.addEventListener("click", () => {
    const json = exportStateJSON();
    if (!json) return;
    const slug = (app.character?.profile?.name || "character").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "character";
    const blob = new Blob([json], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = slug + "-sw5e-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice = "Exported backup JSON for " + (app.character?.profile?.name || "character") + ".";
    render();
  });
  getElementById("undo").addEventListener("click", undo);
  getElementById("feedbackUndo").addEventListener("click", undo);
  getElementById("dismissFeedback").addEventListener("click", () => { notice = ""; render(); });

  const damageResisted = getElementById("damageResisted");
  const damageCorroded = getElementById("damageCorroded");
  for (const toggle of [damageResisted, damageCorroded]) {
    toggle.addEventListener("click", () => {
      const pressed = toggle.getAttribute("aria-pressed") === "true";
      toggle.setAttribute("aria-pressed", String(!pressed));
    });
  }
  getElementById("fanaticTempBtn").addEventListener("click", event => openFanaticTempDialog(event.currentTarget));

  for (const [id, label, operation] of [
    ["damage", "Applied damage", (session, profile, amount) => {
      const resisted = damageResisted.getAttribute("aria-pressed") === "true";
      const corrodedWeapon = damageCorroded.getAttribute("aria-pressed") === "true";
      delete session._lastConcentrationPrompt;
      applyDamage(session, profile, amount, resisted, corrodedWeapon);
    }],
    ["heal", "Healed HP", (session, profile, amount) => recoverHP(session, amount, hitPointMaximum(profile, session))],
    ["addTemp", "Gained temporary HP", (session, profile, amount) => {
      if (amount > session.temp) { session.temp = amount; session.tempSource = ""; }
    }],
    ["setTemp", "Set temporary HP", (session, profile, amount) => { session.temp = amount; session.tempSource = ""; }],
    ["clearTemp", "Cleared temporary HP", session => { session.temp = 0; session.tempSource = ""; }]
  ]) {
    getElementById(id).addEventListener("click", event => {
      const amount = Math.max(0, Math.floor(Number(getElementById("amount").value) || 0));
      let zeroTrig = null;
      let zeroPrompt = null;
      update(label, (session, profile) => {
        operation(session, profile, amount);
        if (session._lastZeroHpTrigger) {
          zeroTrig = session._lastZeroHpTrigger;
          delete session._lastZeroHpTrigger;
        }
        if (session._lastZeroHpPrompt && (Array.isArray(session._lastZeroHpPrompt) ? session._lastZeroHpPrompt.length : session._lastZeroHpPrompt.stoppers?.length)) {
          zeroPrompt = session._lastZeroHpPrompt;
          delete session._lastZeroHpPrompt;
        }
      });
      if (zeroTrig) {
        notice = zeroTrig.name + " triggered — dropped to 1 HP instead";
        render();
      } else if (zeroPrompt && typeof openZeroHpStopperDialog === "function") {
        openZeroHpStopperDialog(zeroPrompt, event.currentTarget);
      }
    });
  }

  document.addEventListener("click", event => {
    const pip = event.target.closest("button[data-resource]");
    if (pip) changePip(pip.dataset.resource, Number(pip.dataset.value));
  });

  createTabController(["actionsTab", "skillsTab", "abilitiesTab"]);
  binderTabs = createTabController([
    "classTab", "archetypeTab", "backgroundTab",
    "forcePowerTab", "techPowerTab", "maneuversTab",
    "fightingStylesTab", "fightingMasteriesTab", "lightsaberFormsTab",
    "inventoryTab", "featTab"
  ]);
  const onSkillSearch = typeof _debounceFn === "function"
    ? _debounceFn(() => { if (app.character) withEffectCache(() => renderSkills(app.character.profile, app.character.session)); }, 100)
    : () => { if (app.character) renderSkills(app.character.profile, app.character.session); };
  getElementById("skillSearch").addEventListener("input", onSkillSearch);
  getElementById("skillSort").addEventListener("change", () => { if (app.character) withEffectCache(() => renderSkills(app.character.profile, app.character.session)); });
  wireEffects();
  wireCasting();
  if (typeof wireCombatOptions === "function") wireCombatOptions();
  wireCollections();
  wireRests();
  render();
}

wireViewer();
