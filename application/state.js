const storageKey = "sw5e-character-viewer:v1";
const historyLimit = 30;
let storageIssue = "";

function normalizeLoadedCharacter(character) {
  if (!character?.profile || !character?.session) return null;
  const {profile, session} = character;
  if (!profile.baseScores) profile.baseScores = {...profile.scores};
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
  if (typeof session.classImprovementEnabled !== "boolean") session.classImprovementEnabled = false;
  if (typeof session.superiorityUsed !== "number") session.superiorityUsed = 0;
  if (typeof session.concentration !== "string") session.concentration = "";
  if (typeof session.forceAffinity !== "string") {
    const cfNames = (profile.customFeatures || []).map(f => String(f.name || "").toLowerCase());
    session.forceAffinity = cfNames.some(n => /\bashla\b/.test(n)) ? "Ashla"
      : cfNames.some(n => /\bbendu\b/.test(n)) ? "Bendu"
      : cfNames.some(n => /\bbogan\b/.test(n)) ? "Bogan" : "";
  }
  if (!session.highLevelCasting || typeof session.highLevelCasting !== "object") {
    session.highLevelCasting = {level6: false, level7: false, level8: false, level9: false};
  }
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
      notice = "Saved in tab session (" + (lastErr?.name || "localStorage blocked") + ") — survives reload; use Export Backup to keep permanently.";
      return;
    }
  } catch {}
  // Fallback Tier 3: window.name (survives reload even on strict file:// where localStorage & sessionStorage are blocked)
  try {
    if (typeof window !== "undefined") {
      window.name = windowNamePrefix + slimPayload(0);
      notice = "Saved in tab memory (" + (lastErr?.name || "storage blocked") + ") — survives reload; use Export Backup to keep permanently.";
      return;
    }
  } catch {}
  notice = "Browser storage unavailable (" + (lastErr?.name || "error") + "). Use Export Backup to save.";
}

function transact(label, change) {
  const previous = structuredClone(app.character);
  app.character = change(structuredClone(app.character));
  app.history.push({label, character: previous});
  if (app.history.length > historyLimit) app.history.shift();
  notice = label;
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
