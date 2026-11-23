function render() {
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
  getElementById("characterSubtitle").textContent = character ? "Level " + character.profile.level + " " +
    character.profile.species + " " + character.profile.className : "";
  getElementById("notice").textContent = notice;
  getElementById("feedback").hidden = !notice;
  const expBtn = getElementById("exportBackup");
  if (expBtn) expBtn.disabled = !app.character;
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
  renderCollections(profile, session);
  if (typeof renderPowerManager === "function") renderPowerManager(profile, session);
  if (typeof renderCombatOptionsManager === "function") renderCombatOptionsManager(profile, session);
  if (typeof renderBinderCharacterPages === "function") renderBinderCharacterPages(profile, session);
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
  wireSheetMenu();
  wireMobileNav();
  wireImportDialog();
  getElementById("currentFormInfo").addEventListener("click", showCharacterInfo);
  getElementById("openStandardActions")?.addEventListener("click", () => showStandardActionsDialog());
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
      applyDamage(session, profile, amount, resisted, corrodedWeapon);
    }],
    ["heal", "Healed HP", (session, profile, amount) => recoverHP(session, amount, hitPointMaximum(profile, session))],
    ["addTemp", "Gained temporary HP", (session, profile, amount) => {
      if (amount > session.temp) { session.temp = amount; session.tempSource = ""; }
    }],
    ["setTemp", "Set temporary HP", (session, profile, amount) => { session.temp = amount; session.tempSource = ""; }],
    ["clearTemp", "Cleared temporary HP", session => { session.temp = 0; session.tempSource = ""; }]
  ]) {
    getElementById(id).addEventListener("click", () => {
      const amount = Math.max(0, Math.floor(Number(getElementById("amount").value) || 0));
      update(label, (session, profile) => operation(session, profile, amount));
    });
  }

  document.addEventListener("click", event => {
    const pip = event.target.closest("button[data-resource]");
    if (pip) changePip(pip.dataset.resource, Number(pip.dataset.value));
  });

  createTabController(["actionsTab", "skillsTab"]);
  binderTabs = createTabController([
    "classTab", "archetypeTab", "backgroundTab",
    "forcePowerTab", "techPowerTab", "maneuversTab",
    "fightingStylesTab", "fightingMasteriesTab", "lightsaberFormsTab",
    "inventoryTab", "featTab"
  ]);
  for (const id of ["skillSearch", "skillSort"]) {
    getElementById(id).addEventListener("input", () => renderSkills(app.character.profile, app.character.session));
  }
  wireEffects();
  wireCasting();
  if (typeof wireCombatOptions === "function") wireCombatOptions();
  wireCollections();
  wireRests();
  render();
}

wireViewer();
