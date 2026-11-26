const storageKey = "sw5e-character-viewer:v1";
const historyLimit = 30;
let storageIssue = "";

function normalizeLoadedCharacter(character) {
  if (!character?.profile || !character?.session) return null;
  const {profile, session} = character;
  if (!profile.baseScores) profile.baseScores = {...profile.scores};
  if (!Array.isArray(profile.classes) || !profile.classes.length) {
    if (profile.className) {
      const baseRec = typeof classRecord === "function" ? classRecord(profile.className) : null;
      profile.classes = [{
        name: profile.className,
        levels: Number(profile.level) || 1,
        archetype: session.approach || profile.approach || "",
        hitDie: profile.hitDie || baseRec?.hitDie || 8,
        archetypeFlavor: profile.archetypeFlavor || baseRec?.archetypeFlavorName || "Archetype",
        isStarting: true
      }];
    } else {
      profile.classes = [];
    }
  }
  if (!session.approaches || typeof session.approaches !== "object") {
    session.approaches = {};
  }
  if (session.approach && profile.className && !session.approaches[profile.className]) {
    session.approaches[profile.className] = session.approach;
  }
  if (!session.hitDiceByDie || typeof session.hitDiceByDie !== "object") {
    const totals = {};
    for (const c of profile.classes) {
      const key = "d" + (c.hitDie || (typeof classRecord === "function" ? classRecord(c.name)?.hitDie : 8) || 8);
      totals[key] = (totals[key] || 0) + (Number(c.levels || c.level) || 0);
    }
    if (Object.keys(totals).length === 1 && typeof session.hitDice === "number") {
      const onlyKey = Object.keys(totals)[0];
      session.hitDiceByDie = { [onlyKey]: clamp(session.hitDice, 0, totals[onlyKey]) };
    } else if (Object.keys(totals).length) {
      session.hitDiceByDie = { ...totals };
    } else {
      session.hitDiceByDie = {};
    }
  }
  if (!profile.baseTraining) profile.baseTraining = {...profile.training};
  if (!profile.explicitTraining) profile.explicitTraining = {};
  if (!Array.isArray(session.consumableEffects)) session.consumableEffects = [];
  if (!Array.isArray(session.powers)) {
    session.powers = [...new Set([
      ...(profile.forcePowers || []),
      ...(profile.customForcePowers || []),
      ...(profile.techPowers || []),
      ...(profile.customTechPowers || [])
    ])];
  }
  if (!Array.isArray(session.maneuvers)) session.maneuvers = [...(profile.maneuvers || [])];
  if (!Array.isArray(session.fightingStyles)) session.fightingStyles = [];
  if (!Array.isArray(session.fightingMasteries)) session.fightingMasteries = [];
  if (!Array.isArray(session.lightsaberForms)) session.lightsaberForms = [];
  if (!session.spent || typeof session.spent !== "object") session.spent = {};
  if (typeof session.credits !== "number") session.credits = 0;
  if (typeof session.inspiration !== "boolean") session.inspiration = false;
  if (typeof session.forceUsed !== "number") session.forceUsed = 0;
  if (typeof session.techUsed !== "number") session.techUsed = 0;
  if (typeof session.tempForce !== "number") session.tempForce = 0;
  if (typeof session.tempTech !== "number") session.tempTech = 0;
  if (!Array.isArray(session.classOptions)) session.classOptions = [];
  if (!session.classOptionChoices || typeof session.classOptionChoices !== "object") session.classOptionChoices = {};
  if (!session.speciesTraitChoices || typeof session.speciesTraitChoices !== "object") session.speciesTraitChoices = {};
  if (!session.backgroundChoices || typeof session.backgroundChoices !== "object") session.backgroundChoices = {};
  if (!session.archetypeFeatureChoices || typeof session.archetypeFeatureChoices !== "object") session.archetypeFeatureChoices = {};
  if (!session.abilityAdjustments || typeof session.abilityAdjustments !== "object") session.abilityAdjustments = {};
  if (!session.skillOverrides || typeof session.skillOverrides !== "object") session.skillOverrides = {};
  if (!session.statModifiers || typeof session.statModifiers !== "object") session.statModifiers = {};
  if (typeof session.classImprovementEnabled !== "boolean") session.classImprovementEnabled = false;
  if (typeof session.superiorityUsed !== "number") session.superiorityUsed = 0;
  if (typeof session.concentration !== "string") session.concentration = "";
  if (typeof session.sizeOverride !== "string") session.sizeOverride = "";
  if (typeof session.classChoice !== "string") session.classChoice = "";
  if (typeof session.channelForceChoice !== "string") session.channelForceChoice = "";
  if (typeof session.signaturePower !== "string") session.signaturePower = "";
  if (typeof session.forceAffinity !== "string") {
    const cfNames = (profile.customFeatures || []).map(f => String(f.name || "").toLowerCase());
    session.forceAffinity = cfNames.some(n => /\bashla\b/.test(n)) ? "Ashla"
      : cfNames.some(n => /\bbendu\b/.test(n)) ? "Bendu"
      : cfNames.some(n => /\bbogan\b/.test(n)) ? "Bogan" : "";
  }
  if (!session.highLevelCasting || typeof session.highLevelCasting !== "object") {
    session.highLevelCasting = {level4: false, level5: false, level6: false, level7: false, level8: false, level9: false};
  }
  for (const item of session.equipped || []) {
    // Turn and attack scope cannot be recovered from the old persisted toggles.
    delete item.defensiveActive;
    delete item.direActive;
  }
  if (typeof reconcileCharacterChoices === "function") reconcileCharacterChoices(profile, session);
  return character;
}

const windowNamePrefix = "SW5E_STATE_V1:";

function parseStoredState(raw) {
  if (!raw) return null;
  const stored = JSON.parse(raw);
  if (stored?.schema === 1 && Array.isArray(stored.history) &&
      (!stored.character || (stored.character.profile && stored.character.session))) {
    stored.character = normalizeLoadedCharacter(stored.character);
    return stored;
  }
  return null;
}

function readSavedState() {
  for (const getter of [
    () => localStorage.getItem(storageKey),
    () => (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(storageKey) : null),
    () => (typeof window !== "undefined" && typeof window.name === "string" && window.name.startsWith(windowNamePrefix)
      ? window.name.slice(windowNamePrefix.length) : null)
  ]) {
    try {
      const parsed = parseStoredState(getter());
      if (parsed) return parsed;
    } catch {}
  }
  return {schema: 1, character: null, history: [], light: false};
}

let app = readSavedState();
let notice = storageIssue;

function save() {
  const payload = JSON.stringify(app);
  const slimPayload = keep => JSON.stringify({...app, history: keep > 0 ? (app.history || []).slice(-keep) : []});
  let lastErr = null;
  try {
    localStorage.setItem(storageKey, payload);
    return;
  } catch (err) {
    lastErr = err;
    const errName = String(err?.name || "");
    const isQuota = /quota/i.test(errName) || err?.code === 22 || err?.code === 1014;
    if (isQuota) {
      for (const keep of [5, 0]) {
        try {
          localStorage.setItem(storageKey, slimPayload(keep));
          return;
        } catch {}
      }
    }
  }
  // Fallback Tier 2: sessionStorage (survives reload in this tab)
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, slimPayload(5));
      notice = "Saved for this session — use Sheet ▾ → Export backup to save permanently.";
      return;
    }
  } catch {}
  // Fallback Tier 3: window.name (survives reload even on strict file:// where localStorage & sessionStorage are blocked)
  try {
    if (typeof window !== "undefined") {
      window.name = windowNamePrefix + slimPayload(0);
      notice = "Saved in tab memory  — survives reload; use Export Backup to keep permanently.";
      return;
    }
  } catch {}
  notice = "Browser storage unavailable (" + "browser storage restricted" + "). Use Export Backup to save.";
}

function transact(label, change) {
  const previous = structuredClone(app.character);
  app.character = change(structuredClone(app.character));
  app.history.push({label, character: previous});
  if (app.history.length > historyLimit) app.history.shift();
  const concNote = app.character?.session?._lastConcentrationPrompt;
  if (concNote) delete app.character.session._lastConcentrationPrompt;
  notice = concNote ? (label + " · " + concNote) : label;
  save();
  if (typeof render === "function") render();
}

function update(label, change) {
  transact(label, character => {
    change(character.session, character.profile);
    if (typeof pruneStaleEffects === "function") pruneStaleEffects(character.profile, character.session);
    character.session.hp = Math.min(character.session.hp, hitPointMaximum(character.profile, character.session));
    if (conditionState(character.session, character.profile).dead) {
      endRage(character.session);
      if (typeof endConcentration === "function") endConcentration(character.session); else character.session.concentration = "";
    }
    return character;
  });
}

function undo() {
  const previous = app.history.pop();
  if (!previous) return;
  app.character = previous.character;
  notice = "Undid " + previous.label.toLowerCase();
  save();
  if (typeof render === "function") render();
}

function exportStateJSON() {
  if (!app.character) return "";
  return JSON.stringify({
    format: "sw5e-character-viewer-backup",
    schema: 1,
    exportedAt: new Date().toISOString(),
    character: app.character
  }, null, 2);
}

let fallbackID = 0;
const newID = () => globalThis.crypto?.randomUUID?.() || Date.now() + "-" + (++fallbackID);
