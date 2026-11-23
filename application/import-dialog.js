let importDraft;
let importRequest = 0;

function importCheckbox(parent, key, text) {
  const label = appendText(parent, "label", "");
  const input = appendText(label, "input", "");
  input.type = "checkbox";
  input.name = key;
  input.checked = true;
  appendText(label, "span", text);
  return input;
}

function renderImport(draft) {
  const importDialog = getElementById("importDialog");
  const {profile, session} = draft.character;
  const root = getElementById("importReview");
  root.replaceChildren();
  getElementById("importTitle").textContent = app.character ? "Replace character?" : "Review character import";
  const current = app.character?.profile;
  if (current) {
    appendText(root, "p", "Loaded: " + current.name + " · Level " + current.level);
    if (profile.level < current.level && (current.id === profile.id || current.name === profile.name)) {
      appendText(root, "p", "This export is from an earlier level. Replacing it loads the export’s HP, resources, equipment, and choices.").className = "importWarning";
    } else {
      appendText(root, "p", "Replacing the current sheet loads the state from this export.");
    }
  }
  appendText(root, "h3", profile.name + " · Level " + profile.level + " " + profile.species + " " + profile.className);
  appendText(root, "p", profile.filename + " · SW5e builder " + profile.version).className = "muted";
  appendText(root, "p", session.hp + "/" + hitPointMaximum(profile, session) + " HP" +
    (session.temp ? " + " + session.temp + " temporary HP" + (session.tempSource ? " · " + session.tempSource : "") : ""));
  const spHp = speciesHpBonus(profile, session);
  if (spHp) {
    appendText(root, "p", signed(spHp) + " maximum HP from " + profile.species + " trait").className = "muted";
  }
  if (profile.extraHpBonus) {
    appendText(root, "p", signed(profile.extraHpBonus) + " extra maximum HP adjustment from export").className = "muted";
  }
  const selections = session.feats.map(feat => feat.name);
  if (selections.length) appendText(root, "p", "Feats: " + selections.join(" · ")).className = "muted";
  const forceCount = (profile.forcePowers?.length || 0) + (profile.customForcePowers?.length || 0);
  const techCount = (profile.techPowers?.length || 0) + (profile.customTechPowers?.length || 0);
  if (forceCount) appendText(root, "p", forceCount + " Force power" + (forceCount === 1 ? "" : "s") + " imported").className = "muted";
  if (techCount) appendText(root, "p", techCount + " Tech power" + (techCount === 1 ? "" : "s") + " imported").className = "muted";
  if (profile.maneuvers?.length) appendText(root, "p", profile.maneuvers.length + " maneuver" + (profile.maneuvers.length === 1 ? "" : "s") + " imported").className = "muted";
  if (profile.dewback?.length) appendText(root, "p", "Dewback’s Instinct: " + profile.dewback.join(", ")).className = "muted";
  if (session.temp > 0) {
    const srcWrap = appendText(root, "label", "Temporary HP source ");
    const srcInput = document.createElement("input");
    srcInput.type = "text";
    srcInput.name = "tempSource";
    srcInput.maxLength = 60;
    srcInput.value = draft.suggestedTempSource || "";
    srcInput.placeholder = "Optional (e.g. Fanatic)";
    srcWrap.append(srcInput);
  }
  let approach;
  if (draft.suggestedApproach) {
    approach = importCheckbox(root, "approach", "Use " + draft.suggestedApproach + " (detected from custom features)");
  }
  if (Object.keys(draft.suggestions || {}).length) {
    const group = appendText(root, "fieldset", "");
    appendText(group, "legend", "Carry over uses recorded in the notes");
    const labels = {rage: "Rage", frenzy: "Frenzy", leap: "Fyrnock’s leap"};
    for (const [key, value] of Object.entries(draft.suggestions)) {
      const carry = importCheckbox(group, key, (labels[key] || key) + " · " + value + " use" + (value === 1 ? "" : "s") + " spent");
      if (key === "frenzy" && approach) approach.addEventListener("change", () => { carry.disabled = !approach.checked; });
    }
  }
  for (const warning of profile.warnings || []) appendText(root, "p", warning).className = "importWarning";
  getElementById("confirmImport").textContent = app.character ? "Replace character" : "Import character";
  importDialog.showModal();
  getElementById("cancelImport").focus();
}

async function onImportFile(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  const request = ++importRequest;
  const error = getElementById("loadError");
  error.hidden = true;
  try {
    if (file.size > 5_000_000) throw new Error("Choose a character JSON file under 5 MB.");
    const value = await file.text();
    if (request !== importRequest) return;
    const parsedJson = JSON.parse(value.replace(/^\uFEFF/, ""));
    if (parsedJson?.format === "sw5e-character-viewer-backup" && parsedJson.character?.profile && parsedJson.character?.session) {
      const restored = normalizeLoadedCharacter(parsedJson.character);
      if (!restored) throw new Error("This backup file could not be restored.");
      transact("Restored backup: " + (restored.profile.name || file.name), () => restored);
      getElementById("characterName").focus();
      return;
    }
    importDraft = readWebsiteExport(parsedJson, file.name);
    renderImport(importDraft);
  } catch (failure) {
    if (request !== importRequest) return;
    error.textContent = failure instanceof SyntaxError ? "This file could not be read as JSON." : failure.message;
    error.hidden = false;
  }
}

function wireImportDialog() {
  const importDialog = getElementById("importDialog");
  wireDialogDismissal(importDialog, getElementById("cancelImport"));
  getElementById("importButton").addEventListener("click", () => getElementById("characterFile").click());
  getElementById("characterFile").addEventListener("change", onImportFile);
  getElementById("importForm").addEventListener("submit", event => {
    event.preventDefault();
    const choices = Object.fromEntries(new FormData(event.target));
    const replacing = Boolean(app.character);
    importDialog.close();
    transact((replacing ? "Replaced character with " : "Imported ") + importDraft.character.profile.name,
      () => confirmWebsiteImport(importDraft, choices));
    getElementById("characterName").focus();
  });
}
