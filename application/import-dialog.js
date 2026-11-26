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
  const previewApproaches = {...(session.approaches || {}), ...(draft.suggestedApproaches || {})};
  const previewSessionForPowers = {...session, approach: draft.suggestedApproach || session.approach, approaches: previewApproaches};
  const csPreview = typeof castingStats === "function" ? castingStats(profile, previewSessionForPowers) : null;
  const fmtPowerCap = (used, cap, bonus, label) => {
    if (cap > 0) {
      const bonusTxt = bonus > 0 ? " (+" + bonus + " bonus)" : "";
      const diffTxt = used < cap ? " — add " + (cap - used) : (used > cap ? " — remove " + (used - cap) : "");
      return used + "/" + cap + " " + label + bonusTxt + diffTxt;
    }
    return used + bonus > 0 ? (used + bonus) + " " + label : "";
  };
  const powerFactParts = csPreview
    ? [
        fmtPowerCap(csPreview.forceKnownUsed || 0, csPreview.forceKnownCap || 0, csPreview.forceBonusKnown || 0, "Force"),
        fmtPowerCap(csPreview.techKnownUsed || 0, csPreview.techKnownCap || 0, csPreview.techBonusKnown || 0, "Tech")
      ].filter(Boolean)
    : [];
  const selections = session.feats.map(feat => feat.name);
  const hpText = session.hp + " / " + hitPointMaximum(profile, session) + " HP" +
    (session.temp ? " (+" + session.temp + " temp)" : "");
  const facts = [
    ["Character", profile.name],
    ["Class", Array.isArray(profile.classes) && profile.classes.length > 1
      ? profile.classes.map(c => c.name + " " + c.levels).join(" / ") + " (Level " + profile.level + ")"
      : ("Level " + profile.level + " " + profile.className)],
    ["Species", profile.species],
    ["Hit Points", hpText],
    ["Powers", powerFactParts.join(" · ") || "None"],
    ["Export", profile.filename + " (v" + profile.version + ")"],
    ["Feats", selections.length ? selections.join(" · ") : ""]
  ].filter(([, v]) => Boolean(v));
  const dl = appendText(root, "dl", "");
  dl.className = "infoFacts";
  for (const [k, v] of facts) {
    const pair = appendText(dl, "div", "");
    if (k === "Feats" || String(v).length > 34) pair.className = "is-wide";
    appendText(pair, "dt", k);
    appendText(pair, "dd", v);
  }
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
  const suggestedArchEntries = Object.entries(draft.suggestedApproaches || {}).filter(([, v]) => Boolean(v));
  if (suggestedArchEntries.length > 1) {
    const summary = suggestedArchEntries.map(([c, a]) => a + " (" + c + ")").join(", ");
    approach = importCheckbox(root, "approach", "Use " + summary + " (detected archetypes)");
  } else if (draft.suggestedApproach || suggestedArchEntries.length === 1) {
    const labelArch = draft.suggestedApproach || suggestedArchEntries[0][1];
    approach = importCheckbox(root, "approach", "Use " + labelArch + " (detected from custom features)");
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
  if (typeof auditCharacterCompleteness === "function") {
    const previewSession = {...session, approach: draft.suggestedApproach || session.approach, approaches: previewApproaches};
    const auditItems = auditCharacterCompleteness(profile, previewSession, {suggestedApproach: draft.suggestedApproach})
      .filter(it => it.severity !== "info");
    if (auditItems.length) {
      const box = appendText(root, "div", "");
      box.className = "importAuditPreview";
      appendText(box, "strong", "Missing features & choices (" + auditItems.length + ")");
      const ul = appendText(box, "ul", "");
      for (const it of auditItems.slice(0, 6)) {
        appendText(ul, "li", it.title);
      }
      if (auditItems.length > 6) {
        appendText(ul, "li", "…and " + (auditItems.length - 6) + " more");
      }
      appendText(box, "p", "You can populate these right after importing.").className = "muted";
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
    const imported = confirmWebsiteImport(importDraft, choices);
    transact((replacing ? "Replaced character with " : "Imported ") + imported.profile.name,
      () => imported);
    const pendingAudit = typeof auditCharacterCompleteness === "function"
      ? auditCharacterCompleteness(app.character.profile, app.character.session).filter(it => it.severity !== "info")
      : [];
    if (pendingAudit.length && typeof openCharacterAuditModal === "function") {
      openCharacterAuditModal(getElementById("setupAuditBtn") || getElementById("characterName"));
    } else {
      getElementById("characterName").focus();
    }
  });
}
