// Unified Recursive & Contextualized Rule Element Choice Engine & Character Load Audit
// Core concepts:
//   - Rule Element: any rule-bearing entity on a character (feat, customization, fightingStyle,
//     fightingMastery, species, background, archetype, class, power, maneuver, lightsaberForm).
//   - Customization: invocation-equivalent class pool option (Ideals, Instincts, Discoveries,
//     Exploits, Vows, Auras, Routines, Strategies, Modifications, Force-Empowered Casting).
// Every Rule Element declares its Choice Slots through one registry, `contextualizeChoiceOptions`
// scopes and filters options to what is actually valid for the current character (excluding
// already-owned proficiencies/options and enforcing prerequisites across ALL choice types),
// and `resolveRuleElementChoices` recursively resolves any child Rule Elements granted by a choice.

const SW5E_LANGUAGES = [
  "Aqualish", "Bith", "Bothese", "Catharese", "Cerean", "Cheunh", "Dosh", "Durese",
  "Ewokese", "Galactic Basic", "Gamorrese", "Gunganese", "Huttese", "Ithorian",
  "Jawa Trade Language", "Kel Dor", "Mando'a", "Mon Calamarian", "Nautila", "Quarrenese",
  "Rodese", "Ryl", "Shyriiwook", "Sith", "Sullustese", "Togruti", "Twi'leki", "Zabrak", "Binary"
];
const SW5E_GAMING_SETS = ["Chance cubes", "Dejarik set", "Pazaak deck", "Sabacc deck"];
const SW5E_ARTISAN_IMPLEMENTS = [
  "Armormech's implements", "Armstech's implements", "Artificer's implements",
  "Artisan's implements", "Artist's implements", "Astrotech's implements", "Audiotech's implements",
  "Biotech's implements", "Chef's kit", "Constructor's implements", "Cybertech's implements",
  "Gadgeteer's implements", "Geneticist's implements", "Jeweler's implements",
  "Surveyor's implements", "Synthweaver's implements", "Tinker's implements"
];
const SW5E_MUSICAL_INSTRUMENTS = [
  "Bandfill", "Chindinkalu flute", "Drum", "Fizzz", "Fanfar", "Gasan string drum",
  "Kloo horn", "Mandoviol", "Ommni box", "Shawm", "Slitherhorn", "Trammid", "Valahorn", "Xantha"
];
const SW5E_SPECIALIST_KITS = [
  "Archaeologist kit", "Bioanalysis kit", "Biochemist's kit", "Brewer's kit", "Demolitions kit",
  "Disguise kit", "Forgery kit", "Mechanic's kit", "Munitions kit", "Poisoner's kit",
  "Scavenging kit", "Security kit", "Slicer's kit", "Spicer's kit"
];
const SW5E_ALL_TOOLS = [...new Set([
  ...SW5E_SPECIALIST_KITS, ...SW5E_ARTISAN_IMPLEMENTS, ...SW5E_GAMING_SETS, ...SW5E_MUSICAL_INSTRUMENTS
])].sort();
const SW5E_DROID_CLASSES = ["Class I Droid", "Class II Droid", "Class III Droid", "Class IV Droid", "Class V Droid", "Tracker Droid"];
const SW5E_CUNNING_OPTIONS = ["Applying poison", "Dash", "Disengage", "Guard", "Help", "Hide", "Search", "Throwing grenades and setting mines", "Controlled beast melee attack (mounted)", "Vehicle action (mounted)"];
const SW5E_WEAPON_CATEGORIES = [
  "Simple Vibroweapons", "Martial Vibroweapons",
  "Simple Blasters", "Martial Blasters",
  "Simple Lightweapons", "Martial Lightweapons"
];

function _choiceNorm(s) {
  return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function _choiceCanonTool(raw) {
  const cleaned = String(raw || "").trim()
    .replace(/^(?:a|an|one|the)\s+/i, "")
    .replace(/\.$/, "")
    .replace(/\bkits\b/i, "kit")
    .replace(/\bartificer'?s tools\b/i, "Artificer's implements")
    .trim();
  const n = _choiceNorm(cleaned);
  const exact = SW5E_ALL_TOOLS.find(t => _choiceNorm(t) === n);
  if (exact) return exact;
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";
}

// ============================================================================
// 1. CHOICE SPEC REGISTRIES (Feats, Combat Options, Customizations, Species, Backgrounds)
// ============================================================================

function extraFeatChoiceSpec(rule, profile = null, session = null) {
  const n = normalizeName(rule?.name || "");
  if (!n) return null;
  if (rule?.extraChoiceSpec) {
    const es = rule.extraChoiceSpec;
    if (es.countFormula === "halfProf") {
      const prof = Number((profile || (typeof app !== "undefined" ? app?.character?.profile : null))?.proficiency || 2);
      const cnt = Math.max(Number(es.minCount || 1), Math.floor(prof / 2));
      return { ...es, count: cnt, label: (es.label || "Selections") + " (choose " + cnt + ")" };
    }
    return { ...es, count: Number(es.count || 1) };
  }
  if (rule?.choiceSpec && (rule.choiceSpec.count || 1) > 1) return rule.choiceSpec;
  const cgForm = (rule?.effects || []).find(e => e.type === "combatOptionGrant" && e.kind === "lightsaberForm" && Array.isArray(e.upgradeThresholds));
  if (cgForm) {
    const sess = session || (typeof app !== "undefined" ? app?.character?.session : null);
    const totalForms = typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS.length : 20;
    const selfPicks = new Set();
    for (const ft of (sess?.feats || [])) {
      if (normalizeName(ft?.name) !== n) continue;
      if (ft.choice) selfPicks.add(normalizeName(ft.choice));
      for (const mc of (Array.isArray(ft.multiChoice) ? ft.multiChoice : [])) if (mc) selfPicks.add(normalizeName(mc));
    }
    const baseOwned = Array.isArray(sess?.lightsaberForms)
      ? sess.lightsaberForms.filter(fm => !selfPicks.has(normalizeName(fm))).length
      : 0;
    let cnt = Number(cgForm.count) || 1;
    for (const th of cgForm.upgradeThresholds) {
      if (baseOwned >= Number(th.ownedAtLeast || 0)) {
        cnt = th.count === "remaining" ? Math.max(1, totalForms - baseOwned) : Number(th.count);
      }
    }
    return { kind: "lightsaberForms", count: cnt, label: cnt === 1 ? "Lightsaber Form" : ("Lightsaber Forms (choose " + cnt + ")") };
  }
  return null;
}

function combatOptionGrantSpec(name, profile = null, session = null) {
  const n = normalizeName(name || "");
  if (n === "formfighting style") return { kind: "lightsaberForms", count: 3, label: "Lightsaber Forms (choose 3)" };
  if (n === "formfighting mastery") {
    const hasGuardianForm = typeof classLevelOf === "function"
      ? classLevelOf(profile, "Guardian") >= 3
      : (normalizeName(profile?.className || "") === "guardian" && Number(profile?.level || 1) >= 3);
    const hasFormStyle = (session?.fightingStyles || []).some(s => normalizeName(s) === "formfighting style");
    const hasLightweaponStrat = typeof resolveDefenseEffects === "function" && (resolveDefenseEffects(profile, session).combatTraits || []).some(ct => ct.kind === "unlocksLightsaberForms");
    let otherFormGrants = (hasGuardianForm ? 1 : 0) + (hasFormStyle ? 3 : 0) + (hasLightweaponStrat ? 1 : 0);
    if (typeof resolveCombatEffects === "function" && profile && session) {
      for (const cg of (resolveCombatEffects(profile, session).combatOptionGrants || [])) {
        if (cg.kind !== "lightsaberForm") continue;
        const srcNorm = normalizeName(cg.source?.name || "");
        if (srcNorm === "formfighting style" || srcNorm === "formfighting mastery" || srcNorm === "lightweapon strategist" || Array.isArray(cg.upgradeThresholds)) continue;
        if (hasGuardianForm && cg.source?.kind === "archetype" && cg.option) continue;
        otherFormGrants += Number(cg.count) > 0 ? Number(cg.count) : 1;
      }
    }
    const upgradeFormGrants = (typeof resolveCombatEffects === "function" && profile && session)
      ? (resolveCombatEffects(profile, session).combatOptionGrants || []).filter(cg => cg.kind === "lightsaberForm" && Array.isArray(cg.upgradeThresholds))
      : [];
    for (const cg of upgradeFormGrants) {
      let add = Number(cg.count) || 1;
      for (const th of cg.upgradeThresholds) {
        if (otherFormGrants >= Number(th.ownedAtLeast || 0) && th.count !== "remaining") add = Number(th.count);
      }
      otherFormGrants += add;
    }
    const cnt = otherFormGrants >= 3 ? 7 : 3;
    return { kind: "lightsaberForms", count: cnt, label: "Lightsaber Forms (choose " + cnt + ")" };
  }
  if (n === "superiority style") return { kind: "maneuvers", count: 1, label: "Maneuver (choose 1)" };
  if (n === "superiority mastery") {
    const fighterLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Fighter") : (normalizeName(profile?.className || "") === "fighter" ? Number(profile?.level || 1) : 0);
    const scholarLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Scholar") : (normalizeName(profile?.className || "") === "scholar" ? Number(profile?.level || 1) : 0);
    const hasOtherStyle = (session?.fightingStyles || []).some(s => normalizeName(s) === "superiority style");
    const otherManGrants = typeof resolveCombatEffects === "function"
      ? (resolveCombatEffects(profile, session).combatOptionGrants || []).some(cg => cg.kind === "maneuver" && !Number.isFinite(cg.ifAlreadyHaveDice) && Number(cg.count || 0) > 0)
      : false;
    const archSup = typeof archetypeMechanics === "function" ? archetypeMechanics(profile, session)?.superiority : null;
    const archStep = typeof archetypeLevelStep === "function" ? archetypeLevelStep(profile, session) : null;
    const hasArchMan = Boolean(archSup?.bonusManeuvers || archSup?.replaceManeuvers || (archStep && Number(parseNumericStat(archStep["Maneuvers Known"])) > 0));
    const hasOtherMan = fighterLvl >= 2 || scholarLvl >= 1 || hasOtherStyle || otherManGrants || hasArchMan;
    const cnt = hasOtherMan ? 3 : 1;
    return {
      kind: "maneuvers",
      count: cnt,
      label: "Maneuver" + (cnt === 1 ? "" : "s") + " (choose " + cnt + ")",
      followUpChoice: {
        storageKey: "Superiority Mastery: Free d4 Maneuver",
        kind: "knownManeuvers",
        count: 1,
        label: "Free d4 maneuver (choose 1 known maneuver)"
      }
    };
  }
  if (n === "disruption style" || n === "disruption mastery") {
    return { kind: "castingType", storage: "combatOptionChoices", count: 1, label: "Casting Type (Force- or Tech-casting)" };
  }
  return null;
}

function classOptionGrantSpec(name, profile = null, session = null) {
  const rule = typeof classOptionRule === "function" ? classOptionRule(name) : null;
  const _ctxProf = profile || (typeof app !== "undefined" ? app?.character?.profile : null);
  const _ctxSess = session || (typeof app !== "undefined" ? app?.character?.session : null);
  const lvl = Number(_ctxProf?.level || 1);
  if (rule?.choiceSpec && typeof rule.choiceSpec === "object") {
    const spec = { ...rule.choiceSpec };
    if (Array.isArray(spec.countSchedule)) {
      const baseC = Number.isFinite(Number(spec.baseCount)) ? Number(spec.baseCount) : 0;
      const dynCount = baseC + spec.countSchedule.filter(req => lvl >= req).length;
      spec.count = dynCount;
      if (spec.label && !/\(choose \d+\)/i.test(spec.label)) {
        spec.label = spec.label + " (choose " + dynCount + ")";
      }
    }
    if (rule.repeatable && Array.isArray(_ctxSess?.classOptions)) {
      const copies = _ctxSess.classOptions.filter(x => normalizeName(x) === normalizeName(rule.name)).length;
      if (copies > 1) {
        spec.count = (Number(spec.count) || 1) * copies;
        if (Number.isFinite(spec.maxSkills)) spec.maxSkills = spec.maxSkills * copies;
        if (spec.label) {
          spec.label = spec.label.replace(/\(choose \d+\)/i, "").trim() + " (choose " + spec.count + ")";
        }
      }
    }
    return spec;
  }
  return null;
}

// Extract explicit list of SW5e skill names mentioned in a clause
function _extractSkillsFromText(text) {
  const low = String(text || "").toLowerCase();
  return Object.keys(skills)
    .filter(sk => new RegExp("\\b" + sk.toLowerCase().replace(/ /g, "\\s+") + "\\b").test(low))
    .sort();
}

// Parse explicit tool options from a clause like "your choice of armstech's implements, biotech's implements, or ..."
function _extractToolChoicesFromClause(clause) {
  const opts = [];
  const add = val => {
    const clean = _choiceCanonTool(val);
    if (clean && !opts.some(x => _choiceNorm(x) === _choiceNorm(clean))) opts.push(clean);
  };
  const parts = String(clause || "")
    .replace(/\([^)]*\)/g, "")
    .split(/,\s*or\s+|\s+or\s+|,\s*/i)
    .map(p => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const low = part.toLowerCase();
    if (/musical instrument|an instrument\b|one instrument\b/.test(low)) {
      SW5E_MUSICAL_INSTRUMENTS.forEach(add);
    } else if (/artisan['’]?s implements/.test(low)) {
      SW5E_ARTISAN_IMPLEMENTS.forEach(add);
    } else if (/gaming set/.test(low)) {
      SW5E_GAMING_SETS.forEach(add);
    } else if (/specialist['’]?s kit/.test(low)) {
      SW5E_SPECIALIST_KITS.forEach(add);
    } else if (/kit|implement|tool/i.test(low)) {
      add(part.replace(/^(?:your choice of|choose (?:one|two) from|either|a|an|one)\s+/i, ""));
    }
  }
  return opts;
}

// 4. Choice Specs for Species Traits (skills, tools, instruments, kits, weapons, languages)
function speciesTraitChoiceSpecs(sp, session = null) {
  if (!sp || !Array.isArray(sp.traits)) return [];
  const specs = [];
  if (Number.isFinite(sp.extraLanguages) && sp.extraLanguages > 0) {
    specs.push({
      traitName: "Languages",
      kind: "languages",
      count: sp.extraLanguages,
      label: "Languages — " + sp.extraLanguages + " extra language" + (sp.extraLanguages === 1 ? "" : "s")
    });
  }
  if (sp.languageChoice && Array.isArray(sp.languageChoice.options) && sp.languageChoice.options.length) {
    const cnt = Number(sp.languageChoice.count) || 1;
    specs.push({
      traitName: "Languages",
      kind: "languages",
      options: [...sp.languageChoice.options],
      count: cnt,
      label: "Languages — " + cnt + " of " + sp.languageChoice.options.join(" or ")
    });
  }
  for (const t of sp.traits) {
    const tName = String(t.name || "").trim();
    if (!tName || /^languages$/i.test(tName) || /^alignment$/i.test(tName) || /^ability score/i.test(tName)) continue;
    const desc = String(t.description || "").replace(/\r/g, " ");
    const low = desc.toLowerCase();

    if (/human versatility/i.test(tName)) {
      specs.push({ traitName: tName + " (Skill)", kind: "skills", count: 1, label: "Human Versatility — Skill proficiency" });
      specs.push({ traitName: tName + " (Tool)", kind: "allTools", count: 1, label: "Human Versatility — Tool proficiency" });
      specs.push({ traitName: tName + " (Weapon)", kind: "allWeapons", count: 1, label: "Human Versatility — Weapon proficiency" });
      continue;
    }

    // Check weapon + tool compound traits (Gormak Technological Affinity, Taung Weapon Training, Baragwin Weapon Developers)
    if (/one vibroweapon and one blaster of your choice/i.test(low)) {
      specs.push({ traitName: tName + " (Vibroweapon)", kind: "vibro", count: 1, label: tName + " — 1 Vibroweapon" });
      specs.push({ traitName: tName + " (Blaster)", kind: "blasters", count: 1, label: tName + " — 1 Blaster" });
      const toolClause = desc.match(/your choice of ([^.]+(?:implements|kit|kits)[^.]*)/i);
      if (toolClause) {
        const tOpts = _extractToolChoicesFromClause(toolClause[1]);
        if (tOpts.length) {
          specs.push({ traitName: tName + " (Tool)", kind: "explicitTools", options: tOpts, count: 1, label: tName + " — Tool" });
        }
      }
      continue;
    }

    if (/baragwin/i.test(sp.name || "") && /weapon developers/i.test(tName)) {
      if (session?.speciesChoice === "Two weapons of your choice") {
        specs.push({ traitName: tName + " (Weapons)", kind: "allWeapons", count: 2, label: tName + " — 2 weapons of your choice" });
      }
      continue;
    }

    // Skill choices
    if (/two intelligence, wisdom, or charisma skills/i.test(low)) {
      specs.push({ traitName: tName, kind: "mentalSkills", count: 2, label: tName + " — 2 Intelligence, Wisdom, or Charisma skills" });
      continue;
    }
    if (/one intelligence skill of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "intSkills", count: 1, label: tName + " — 1 Intelligence skill" });
      continue;
    }
    if (/proficiency in two skills of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "skills", count: 2, label: tName + " — 2 skills" });
      continue;
    }
    if (/proficiency in (?:one|a) skill of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "skills", count: 1, label: tName + " — 1 skill" });
      continue;
    }

    // Generic explicit skill choice parser:
    //   "two of the following skills of your choice: A, B, C, and D"
    //   "one of the following skills of your choice: A, B, or C"
    //   "proficiency (in|with) X or Y (your choice)" / "proficient in X or Y (your choice)"
    const multiListSkill = desc.match(/(one|two|three)\s+of the following skills(?: of your choice)?:\s*([^.]+)/i);
    if (multiListSkill) {
      const cnt = multiListSkill[1].toLowerCase() === "three" ? 3 : multiListSkill[1].toLowerCase() === "two" ? 2 : 1;
      const foundSkills = _extractSkillsFromText(multiListSkill[2]);
      if (foundSkills.length >= cnt) {
        specs.push({ traitName: tName, kind: "explicitSkills", options: foundSkills, count: cnt, label: tName + " — " + cnt + " skill" + (cnt === 1 ? "" : "s") });
        continue;
      }
    }
    const pairSkill = desc.match(/(?:proficiency (?:in|with)|proficient in)\s+([^.]+?)\s*\(your choice\)/i);
    if (pairSkill) {
      const foundSkills = _extractSkillsFromText(pairSkill[1]);
      if (foundSkills.length >= 2) {
        specs.push({ traitName: tName, kind: "explicitSkills", options: foundSkills, count: 1, label: tName + " — 1 skill" });
        continue;
      }
      const foundTools = _extractToolChoicesFromClause(pairSkill[1]);
      if (foundTools.length >= 2) {
        specs.push({ traitName: tName, kind: "explicitTools", options: foundTools, count: 1, label: tName + " — 1 tool" });
        continue;
      }
    }

    // Tool / Kit / Instrument / Gaming Set choices
    const explicitToolChoice = desc.match(/proficiency (?:in|with) your choice of ([^.]+)/i);
    if (explicitToolChoice) {
      const tOpts = _extractToolChoicesFromClause(explicitToolChoice[1]);
      if (tOpts.length >= 2) {
        specs.push({ traitName: tName, kind: "explicitTools", options: tOpts, count: 1, label: tName + " — Tool" });
        continue;
      }
    }
    if (/one specialist['’]s kit of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "specialistKit", count: 1, label: tName + " — Specialist's kit" });
      continue;
    }
    if (/one (?:set of )?artisan['’]s implements of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "artisanImplements", count: 1, label: tName + " — Artisan's implements" });
      continue;
    }
    if (/one tool of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "allTools", count: 1, label: tName + " — Tool proficiency" });
      continue;
    }
    if (/one musical instrument of your choice|an instrument of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "musicalInstrument", count: 1, label: tName + " — Musical instrument" });
      continue;
    }
    if (/one gaming set of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "gamingSet", count: 1, label: tName + " — Gaming set" });
      continue;
    }

    // Weapon choices (strictly scoped by weapon classification!)
    if (/two martial vibroweapons of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "martialVibro", count: 2, label: tName + " — 2 martial vibroweapons" });
      continue;
    }
    if (/two vibroweapons of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "vibro", count: 2, label: tName + " — 2 vibroweapons" });
      continue;
    }
    if (/two (?:simple or )?martial (?:blasters or )?vibroweapons of your choice|two vibroweapons or blasters of your choice/i.test(low)) {
      specs.push({ traitName: tName, kind: "blastersOrVibro", count: 2, label: tName + " — 2 blasters or vibroweapons" });
      continue;
    }
  }
  return specs;
}

// Identify FIXED (non-choice) skills granted by a species (e.g., Togruta -> Survival, Ewok -> Nature & Survival)
function speciesFixedSkills(sp) {
  if (!sp || !Array.isArray(sp.traits)) return [];
  const fixed = [];
  const choiceTraits = new Set(speciesTraitChoiceSpecs(sp).map(s => _choiceNorm(s.traitName.replace(/\s*\([^)]*\)$/, ""))));
  for (const t of sp.traits) {
    const tName = String(t.name || "").trim();
    if (!tName || choiceTraits.has(_choiceNorm(tName))) continue;
    const desc = String(t.description || "").replace(/\r/g, " ");
    // Only match unconditional proficiency grants, not conditional expertise like "considered to have expertise"
    const sentences = desc.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if (!/(?:have|gain|are)\s+proficienc|are\s+proficient\s+in/i.test(s)) continue;
      if (/your choice|choose |of your choice|either .* or /i.test(s)) continue;
      if (/considered to have expertise/i.test(s)) continue;
      for (const sk of _extractSkillsFromText(s)) {
        if (!fixed.includes(sk)) fixed.push(sk);
      }
    }
  }
  return fixed;
}

// Parse Background tool & language choice slots from SW5E_BACKGROUNDS
function backgroundChoiceSpecs(bg) {
  if (!bg) return [];
  const specs = [];
  const toolText = String(bg.toolProficiencies || "").trim();
  if (toolText && /choice|choose|one type of|one set of|one instrument|one musical|two types of| or /i.test(toolText)) {
    const low = toolText.toLowerCase();
    if (/^one of your choice\.?$/i.test(low)) {
      specs.push({ slotKey: "tool:0", category: "tool", kind: "allTools", count: 1, label: bg.name + " — Tool proficiency" });
    } else if (/^two types of gaming sets\.?$/i.test(low)) {
      specs.push({ slotKey: "tool:0", category: "tool", kind: "gamingSet", count: 2, label: bg.name + " — 2 Gaming sets" });
    } else if (/^two of your choice of artisan['’]?s implements, gaming sets, or musical instruments/i.test(low)) {
      specs.push({
        slotKey: "tool:0",
        category: "tool",
        kind: "explicitTools",
        options: [...new Set([...SW5E_ARTISAN_IMPLEMENTS, ...SW5E_GAMING_SETS, ...SW5E_MUSICAL_INSTRUMENTS])].sort(),
        count: 2,
        label: bg.name + " — 2 tools (artisan's implements, gaming sets, or musical instruments)"
      });
    } else if (/one type of gaming set\s*(?:and|,)\s*one set of artisan['’]?s implements/i.test(low)) {
      specs.push({ slotKey: "tool:gaming", category: "tool", kind: "gamingSet", count: 1, label: bg.name + " — Gaming set" });
      specs.push({ slotKey: "tool:artisan", category: "tool", kind: "artisanImplements", count: 1, label: bg.name + " — Artisan's implements" });
    } else if (/one type of gaming set\s*(?:and|,)\s*your choice of (.+)/i.test(low)) {
      const m = toolText.match(/your choice of (.+)/i);
      specs.push({ slotKey: "tool:gaming", category: "tool", kind: "gamingSet", count: 1, label: bg.name + " — Gaming set" });
      specs.push({ slotKey: "tool:kit", category: "tool", kind: "explicitTools", options: _extractToolChoicesFromClause(m[1]), count: 1, label: bg.name + " — Kit" });
    } else if (/one instrument and one type of artisan['’]?s implements or bioanalysis kit/i.test(low)) {
      specs.push({ slotKey: "tool:instrument", category: "tool", kind: "musicalInstrument", count: 1, label: bg.name + " — Musical instrument" });
      specs.push({
        slotKey: "tool:artisan",
        category: "tool",
        kind: "explicitTools",
        options: [...new Set([...SW5E_ARTISAN_IMPLEMENTS, "Bioanalysis kit"])].sort(),
        count: 1,
        label: bg.name + " — Artisan's implements or Bioanalysis kit"
      });
    } else if (/disguise kit,\s*one type of musical instrument/i.test(low)) {
      specs.push({ slotKey: "tool:instrument", category: "tool", kind: "musicalInstrument", count: 1, label: bg.name + " — Musical instrument" });
    } else if (/^choose two from (.+)/i.test(low)) {
      const m = toolText.match(/choose two from (.+)/i);
      specs.push({ slotKey: "tool:0", category: "tool", kind: "explicitTools", options: _extractToolChoicesFromClause(m[1]), count: 2, label: bg.name + " — 2 tools" });
    } else if (/^(?:one (?:type|set) of )?artisan['’]?s implements\.?$/i.test(low)) {
      specs.push({ slotKey: "tool:0", category: "tool", kind: "artisanImplements", count: 1, label: bg.name + " — Artisan's implements" });
    } else if (/^one type of gaming set\.?$/i.test(low)) {
      specs.push({ slotKey: "tool:0", category: "tool", kind: "gamingSet", count: 1, label: bg.name + " — Gaming set" });
    } else if (/^one type of musical instrument\.?$/i.test(low)) {
      specs.push({ slotKey: "tool:0", category: "tool", kind: "musicalInstrument", count: 1, label: bg.name + " — Musical instrument" });
    } else {
      const opts = _extractToolChoicesFromClause(toolText.replace(/^your choice(?: of)?\s+/i, "").replace(/^choose one from\s+/i, ""));
      if (opts.length >= 2) {
        specs.push({ slotKey: "tool:0", category: "tool", kind: "explicitTools", options: opts, count: 1, label: bg.name + " — Tool proficiency" });
      }
    }
  }

  const langText = String(bg.languages || "").trim().toLowerCase();
  if (/two of your choice/.test(langText)) {
    specs.push({ slotKey: "lang:0", category: "language", kind: "languages", count: 2, label: bg.name + " — 2 Languages" });
  } else if (/one of your choice/.test(langText)) {
    specs.push({ slotKey: "lang:0", category: "language", kind: "languages", count: 1, label: bg.name + " — Language" });
  }
  return specs;
}


// Parse bespoke sub-feature choices on an Archetype (e.g. Hunter's Prey, Defensive Tactics,
// Customized Armor, Juyo/Vaapad Channel/Fury/Vengeance, Kro Var Elemental Adept/Master/Paragon,
// Geneticist Chimeric Adaptation, Armored Approach Environmental Shielding).
function archetypeFeatureChoiceSpecs(arch, level = 20) {
  if (!arch) return [];
  const rules = String(arch.rules || "");
  const lvl = Number(level) || 1;
  const heads = [...rules.matchAll(/^(#{3,4})\s+([^\n]+)/gm)].map(m => ({
    depth: m[1].length,
    title: m[2].trim(),
    idx: m.index
  }));
  const specs = [];
  const seenFeatNorms = new Set();
  const coveredOptions = new Set();
  const _norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const pushSpec = spec => {
    const fn = _norm(spec.featureName);
    if (!fn || seenFeatNorms.has(fn) || !spec.options || !spec.options.length) return;
    seenFeatNorms.add(fn);
    for (const o of spec.options) coveredOptions.add(_norm(o));
    specs.push(spec);
  };

  // Track ### feature sections with unlock levels for catalog-effect matching
  const h3Sections = [];
  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    if (h.depth !== 3) continue;
    const nextH3 = heads.findIndex((x, j) => j > i && x.depth === 3);
    const endIdx = nextH3 !== -1 ? heads[nextH3].idx : rules.length;
    const secBody = rules.slice(h.idx, endIdx);
    const lvlLine = (secBody.match(/_?\*\*[^*]+\*\*:?\s*([^_\n]+)_?/i) || [])[1] || "";
    const unlockMatches = [...lvlLine.matchAll(/(\d+)(?:st|nd|rd|th)/gi)].map(m => Number(m[1]));
    const unlockLevel = unlockMatches.length ? Math.min(...unlockMatches) : 3;
    h3Sections.push({ title: h.title, unlockLevel, secBody, headIndex: i, endIdx });
  }

  // Pass 1: Genuine #### build-time choice sub-headings (excluding casting/superiority/in-combat menus)
  const skipHeadingRe = /(?:forcecasting|techcasting|superiority|discoveries|modifications|elemental attunement)$/i;
  const skipChildRe = /^(?:improved\s+)?(?:force|tech|maneuver|superiority)\s+(?:powers?\s+known|points?|max\s+power\s+level|ability|focus|dice|maneuvers?)|^max\s+power\s+level$/i;
  const buildChoiceIntroRe = /\b(?:choose\s+(?:one|two|three|four|a|an|\d+|from)|select\s+(?:one|two|three|a|an|\d+)|pick\s+(?:one|two|a|an)|gain\s+(?:one|two|three)\s+of\s+the\s+following|of\s+your\s+choice)\b/i;
  const combatMenuIntroRe = /\b(?:when\s+you\s+(?:deal\s+sneak\s+attack|hit|use\s+your\s+(?:projected\s+barrier|force-empowered|channel\s+the\s+force)|would\s+use\s+a\s+force-empowered)|forgo\s+two\s+of\s+your\s+sneak\s+attack|while\s+you\s+are\s+concentrating|choose\s+which\s+effect\s+to\s+create|when\s+you\s+use\s+this\s+feature,?\s+you\s+choose)\b/i;

  for (const sec of h3Sections) {
    if (lvl < sec.unlockLevel) continue;
    const hTitle = sec.title;
    const secBody = sec.secBody;

    // Collect #### child headings belonging to this ### feature
    const children = [];
    let firstChildRelIdx = secBody.length;
    for (let j = sec.headIndex + 1; j < heads.length && heads[j].depth === 4; j++) {
      if (children.length === 0) firstChildRelIdx = heads[j].idx - heads[sec.headIndex].idx;
      const cEnd = j + 1 < heads.length ? heads[j + 1].idx : rules.length;
      const cText = rules.slice(heads[j].idx, cEnd).replace(/^####\s+[^\n]+\n?/, "").trim();
      children.push({ name: heads[j].title, description: cText });
    }

    if (children.length >= 2 && !skipHeadingRe.test(hTitle) && !children.some(c => skipChildRe.test(c.name))) {
      const intro = secBody.slice(0, firstChildRelIdx);
      const isKroVar = /kro var order/i.test(arch.name || "") && /elemental (?:adept|master|paragon)/i.test(hTitle);
      if (isKroVar || (buildChoiceIntroRe.test(intro) && !combatMenuIntroRe.test(intro))) {
        let count = 1;
        if (/\btwo of the following\b/i.test(intro)) count = 2;
        if (/kro var order/i.test(arch.name || "") && /elemental adept/i.test(hTitle)) {
          count = lvl >= 17 ? 4 : (lvl >= 11 ? 3 : 2);
        } else if (/kro var order/i.test(arch.name || "") && /elemental master/i.test(hTitle)) {
          count = lvl >= 17 ? 2 : 1;
        }
        pushSpec({
          featureName: hTitle,
          unlockLevel: sec.unlockLevel,
          count,
          kind: "explicitArchetype",
          options: children.map(c => c.name),
          optionDescriptions: Object.fromEntries(children.map(c => [c.name, c.description])),
          label: hTitle + (count > 1 ? ` (choose ${count})` : " (choose 1)")
        });
        continue;
      }
    }

    // Special text-based archetype feature choices without #### headings
    if (/environmental shielding/i.test(hTitle)) {
      pushSpec({
        featureName: hTitle,
        unlockLevel: sec.unlockLevel,
        count: 1,
        kind: "explicitArchetype",
        options: ["Acid", "Cold", "Fire", "Lightning", "Sonic"],
        optionDescriptions: {},
        label: hTitle + " — Damage resistance"
      });
    } else if (/artful dancer/i.test(hTitle) && /musical instrument of your choice/i.test(secBody)) {
      pushSpec({
        featureName: hTitle,
        unlockLevel: sec.unlockLevel,
        count: 1,
        kind: "musicalInstruments",
        options: typeof SW5E_MUSICAL_INSTRUMENTS !== "undefined" ? [...SW5E_MUSICAL_INSTRUMENTS] : ["Bandfill", "Chindinkalu flute", "Drum", "Fanfar", "Fizzz", "Gasan string drum", "Kloo horn", "Mandoviol", "Ommni box", "Shawm", "Slitherhorn", "Trammid", "Valahorn", "Xantha"],
        optionDescriptions: {},
        label: hTitle + " — Musical instrument"
      });
    } else if (/assume the position/i.test(hTitle) && /two martial blasters of your choice/i.test(secBody)) {
      const mBlasters = typeof SW5E_EQUIPMENT !== "undefined"
        ? SW5E_EQUIPMENT.filter(i => /martial blaster/i.test(i.category || i.type || "")).map(i => i.name)
        : ["Blaster rifle", "Heavy blaster pistol", "Sniper rifle", "Scattergun", "Ion rifle", "Bowcaster"];
      pushSpec({
        featureName: hTitle,
        unlockLevel: sec.unlockLevel,
        count: 2,
        kind: "weapons",
        options: mBlasters,
        optionDescriptions: {},
        label: hTitle + " — 2 Martial blasters"
      });
    } else if (/bonus proficiencies/i.test(hTitle) && /three blasters of your choice/i.test(secBody)) {
      const allBlasters = typeof SW5E_EQUIPMENT !== "undefined"
        ? SW5E_EQUIPMENT.filter(i => /blaster/i.test(i.category || i.type || "")).map(i => i.name)
        : ["Blaster pistol", "Blaster carbine", "Blaster rifle", "Heavy blaster pistol", "Hold-out", "Ion pistol", "Scattergun"];
      pushSpec({
        featureName: hTitle,
        unlockLevel: sec.unlockLevel,
        count: 3,
        kind: "weapons",
        options: allBlasters,
        optionDescriptions: {},
        label: hTitle + " — 3 Blasters"
      });
    } else if (/form basics/i.test(hTitle)) {
      const m = secBody.match(/choice of the ([A-Za-z/ ]+?) or ([A-Za-z/ ]+?) lightsaber form/i);
      if (m) {
        pushSpec({
          featureName: hTitle,
          unlockLevel: sec.unlockLevel,
          count: 1,
          kind: "explicitArchetype",
          grantsRuleElementKind: "lightsaberForm",
          options: [m[1].trim(), m[2].trim()],
          optionDescriptions: {},
          label: hTitle + " — Lightsaber Form"
        });
      }
    }
  }

  // Pass 2: Declarative catalog effects with when.choice or when.hasChoice across ALL 139 archetypes
  const archEffects = Array.isArray(arch.effects) ? arch.effects : [];
  const explicitChoiceGroups = new Map(); // key: minLevel + "|" + prefix -> { unlockLevel, options: Set, labelHint }
  const hasChoiceProfs = [];

  for (const eff of archEffects) {
    const w = eff?.when;
    if (!w) continue;
    const minL = Number(w.minLevel) || 3;
    const maxL = Number(w.maxLevel) || 99;
    if (lvl < minL || lvl > maxL) continue;

    if (typeof w.choice === "string" && w.choice.trim()) {
      const ch = w.choice.trim();
      if (coveredOptions.has(_norm(ch))) continue;
      const colonIdx = ch.indexOf(":");
      const prefix = colonIdx > 0 ? ch.slice(0, colonIdx).trim() : "";
      const gKey = minL + "|" + (prefix || "default");
      if (!explicitChoiceGroups.has(gKey)) {
        explicitChoiceGroups.set(gKey, { unlockLevel: minL, prefix, options: [] });
      }
      const grp = explicitChoiceGroups.get(gKey);
      if (!grp.options.includes(ch)) grp.options.push(ch);
    } else if (w.hasChoice === true && eff.type === "proficiency") {
      hasChoiceProfs.push({ unlockLevel: minL, kind: eff.kind || "skill" });
    }
  }

  for (const grp of explicitChoiceGroups.values()) {
    if (grp.options.length < 2) continue;
    // Skip if every option is already covered by an existing spec
    if (grp.options.every(o => coveredOptions.has(_norm(o)))) continue;
    const matchingSec = h3Sections.find(s => s.unlockLevel === grp.unlockLevel && !seenFeatNorms.has(_norm(s.title)));
    const featName = grp.prefix && !/^L\d+$/i.test(grp.prefix)
      ? grp.prefix
      : (matchingSec ? matchingSec.title : (grp.unlockLevel >= 20 ? "Capstone Choice" : `${arch.name} Choice (L${grp.unlockLevel})`));
    pushSpec({
      featureName: featName,
      unlockLevel: grp.unlockLevel,
      count: 1,
      kind: "explicitArchetype",
      options: grp.options,
      optionDescriptions: {},
      label: featName + " (choose 1)"
    });
  }

  const allSkillNames = typeof SW5E_SKILL_RULES !== "undefined" ? Object.keys(SW5E_SKILL_RULES) : [
    "Acrobatics", "Animal Handling", "Athletics", "Deception", "Insight", "Intimidation",
    "Investigation", "Lore", "Medicine", "Nature", "Perception", "Performance",
    "Persuasion", "Piloting", "Sleight of Hand", "Stealth", "Survival", "Technology"
  ];
  const allTools = typeof SW5E_ALL_TOOLS !== "undefined" ? SW5E_ALL_TOOLS : [];
  const allLangs = typeof SW5E_LANGUAGES !== "undefined" ? SW5E_LANGUAGES : [];

  const seenProfKeys = new Set();
  for (const hp of hasChoiceProfs) {
    const pKey = hp.unlockLevel + "|" + hp.kind;
    if (seenProfKeys.has(pKey)) continue;
    seenProfKeys.add(pKey);
    const matchingSec = h3Sections.find(s => s.unlockLevel === hp.unlockLevel && /proficienc|tool|skill|language|savvy|methods|practitioner|aptitude|navigator|tongue|negotiations|erudition|understanding/i.test(s.title + " " + s.secBody.slice(0, 260)))
      || h3Sections.find(s => s.unlockLevel === hp.unlockLevel);
    const featName = matchingSec ? matchingSec.title : `${arch.name} (${hp.kind} proficiency)`;
    const secText = matchingSec ? matchingSec.secBody : "";
    let options = [];
    let count = 1;
    if (/\btwo\s+(?:of\s+the|skills?|tools?|languages?)/i.test(secText)) count = 2;
    if (hp.kind === "skill") {
      if (/charisma skill/i.test(secText)) {
        options = ["Deception", "Intimidation", "Performance", "Persuasion"];
      } else {
        const mentioned = allSkillNames.filter(sk => new RegExp("\\b" + sk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(secText));
        options = mentioned.length >= 2 ? mentioned : allSkillNames;
      }
    } else if (hp.kind === "tool") {
      options = allTools.slice();
    } else if (hp.kind === "language") {
      options = allLangs.slice();
    }
    if (options.length) {
      pushSpec({
        featureName: featName,
        unlockLevel: hp.unlockLevel,
        count,
        kind: "explicitArchetype",
        options,
        optionDescriptions: {},
        label: featName + " — " + (hp.kind === "tool" ? "Tool" : hp.kind === "language" ? "Language" : "Skill") + (count > 1 ? ` (choose ${count})` : "")
      });
    }
  }

  return specs;
}

// ============================================================================
// 2. UNIVERSAL CHARACTER-CONTEXT HELPERS (Owned Sets across ALL Rule Elements)
// ============================================================================

function _ownedSkillSet(profile, session) {
  const tr = typeof effectiveTraining === "function" && profile && session ? effectiveTraining(profile, session) : {};
  return {
    proficient: new Set(Object.keys(skills).filter(k => (tr[k] || 0) >= 1).map(normalizeName)),
    expert: new Set(Object.keys(skills).filter(k => (tr[k] || 0) >= 2).map(normalizeName)),
    training: tr
  };
}

function _ownedToolSet(profile, session) {
  const set = new Set();
  if (typeof characterProficiencies === "function" && profile && session) {
    for (const t of (characterProficiencies(profile, session).tools || [])) {
      const name = String(t.name || "");
      // Ignore raw unchosen prompt strings when checking already-owned tools
      if (/your choice|choose|one type of|one set of|one instrument|one of your choice|two types of/i.test(name)) continue;
      set.add(_choiceNorm(name));
    }
  }
  return set;
}

function _ownedLanguageSet(profile, session) {
  const set = new Set();
  const langStr = typeof characterLanguages === "function" && profile ? characterLanguages(profile, session) : "";
  for (const lang of SW5E_LANGUAGES) {
    const rx = new RegExp("\\b" + lang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (rx.test(langStr)) set.add(_choiceNorm(lang));
  }
  if (typeof characterProficiencies === "function" && profile && session) {
    for (const l of (characterProficiencies(profile, session).languages || [])) {
      const n = String(l.name || "");
      if (/of your choice|choose/i.test(n)) continue;
      set.add(_choiceNorm(n));
    }
  }
  return set;
}

function _weaponProficiencyChecker(profile, session) {
  const names = new Set();
  const cats = new Set();
  if (typeof characterProficiencies === "function" && profile && session) {
    for (const w of (characterProficiencies(profile, session).weapons || [])) {
      const raw = String(w.name || "").toLowerCase();
      names.add(normalizeName(w.name));
      if (/all weapons|all simple and martial/.test(raw)) {
        cats.add("simplevibroweapon"); cats.add("martialvibroweapon");
        cats.add("simpleblaster"); cats.add("martialblaster");
        cats.add("simplelightweapon"); cats.add("martiallightweapon");
      }
      if (/all vibroweapons/.test(raw)) { cats.add("simplevibroweapon"); cats.add("martialvibroweapon"); }
      if (/all blasters/.test(raw)) { cats.add("simpleblaster"); cats.add("martialblaster"); }
      if (/all lightweapons/.test(raw)) { cats.add("simplelightweapon"); cats.add("martiallightweapon"); }
      if (/simple vibroweapon/.test(raw)) cats.add("simplevibroweapon");
      if (/martial vibroweapon/.test(raw)) cats.add("martialvibroweapon");
      if (/simple blaster/.test(raw)) cats.add("simpleblaster");
      if (/martial blaster/.test(raw)) cats.add("martialblaster");
      if (/simple lightweapon/.test(raw)) cats.add("simplelightweapon");
      if (/martial lightweapon/.test(raw)) cats.add("martiallightweapon");
    }
  }
  return {
    hasWeapon(weaponName) {
      if (names.has(normalizeName(weaponName))) return true;
      const it = typeof itemRule === "function" ? itemRule(weaponName) : null;
      const cls = String(it?.classification || "").toLowerCase().replace(/\s+/g, "");
      return cls ? cats.has(cls) : false;
    },
    hasCategory(catName) {
      const cls = String(catName || "").toLowerCase().replace(/s\b/g, "").replace(/\s+/g, "");
      return cats.has(cls);
    }
  };
}

function _ownedSaveProficiencySet(profile, session) {
  const set = new Set();
  for (const ab of (profile?.saveProficiencies || [])) set.add(normalizeName(ab));
  const cls = typeof classRecord === "function" ? classRecord(profile?.className) : null;
  for (const ab of (cls?.savingThrows || [])) set.add(normalizeName(ab));
  for (const f of (session?.feats || [])) {
    const r = typeof featRule === "function" ? featRule(f.name) : null;
    if (r?.choiceSpec?.kind === "savingThrow" && f.choice) set.add(normalizeName(f.choice));
  }
  if (typeof collectCharacterEffects === "function" && profile && session) {
    for (const e of collectCharacterEffects(profile, session)) {
      if (e.type === "proficiency" && e.kind === "save" && e.target) set.add(normalizeName(e.target));
    }
  }
  return set;
}

// ============================================================================
// 3. UNIVERSAL CONTEXTUALIZED CHOICE ENGINE (Not Over-Fit to Skills!)
// ============================================================================

function contextualizeChoiceOptions(spec, profile = null, session = null, { currentSelection = [] } = {}) {
  const kind = spec?.kind || "";
  const count = Math.max(1, Number(spec?.count) || 1);
  const keepSet = new Set((Array.isArray(currentSelection) ? currentSelection : (currentSelection ? [currentSelection] : [])).map(_choiceNorm));
  const isKept = val => keepSet.has(_choiceNorm(val));

  const filterOut = (raw, isOwnedFn, { fallbackAll = null, scopedLabel = "", ownedReason = "already owned" } = {}) => {
    const filtered = raw.filter(opt => isKept(opt) || !isOwnedFn(opt));
    const excludedCount = raw.length - filtered.length;
    if (filtered.length >= count) {
      const note = scopedLabel
        ? (excludedCount > 0 ? `${scopedLabel} (excluding ${excludedCount} ${ownedReason})` : scopedLabel)
        : (excludedCount > 0 ? `Excluding ${excludedCount} ${ownedReason}` : "");
      return { options: filtered, contextNote: note, fallbackUsed: false };
    }
    if (fallbackAll) {
      const expanded = fallbackAll.filter(opt => isKept(opt) || !isOwnedFn(opt));
      if (expanded.length >= count) {
        return {
          options: expanded,
          contextNote: `${scopedLabel || "Source pool"} already owned — SW5e duplicate proficiency rule lets you pick any other option.`,
          fallbackUsed: true
        };
      }
    }
    return {
      options: filtered.length ? filtered : raw,
      contextNote: filtered.length ? scopedLabel : (scopedLabel ? `${scopedLabel} (showing all — already owned)` : ""),
      fallbackUsed: !filtered.length
    };
  };

  // --- SKILLS ---
  const allSkills = Object.keys(skills).sort();
  if (kind === "skills" || kind === "intSkills" || kind === "mentalSkills" || kind === "explicitSkills") {
    const { proficient } = _ownedSkillSet(profile, session);
    let base = allSkills;
    let lbl = "Eligible skills";
    if (kind === "intSkills") {
      base = Object.entries(skills).filter(([, ab]) => ab === "Intelligence").map(([k]) => k).sort();
      lbl = "Intelligence skills";
    } else if (kind === "mentalSkills") {
      base = Object.entries(skills).filter(([, ab]) => ["Intelligence", "Wisdom", "Charisma"].includes(ab)).map(([k]) => k).sort();
      lbl = "Intelligence, Wisdom, or Charisma skills";
    } else if (kind === "explicitSkills" && Array.isArray(spec.options)) {
      base = [...spec.options];
      lbl = spec.sourceLabel ? `${spec.sourceLabel} skills` : "Eligible skills";
    }
    return filterOut(base, sk => proficient.has(normalizeName(sk)), {
      fallbackAll: allSkills,
      scopedLabel: lbl,
      ownedReason: "already proficient"
    });
  }

  if (kind === "expertiseSkills") {
    const { training } = _ownedSkillSet(profile, session);
    const eligible = allSkills.filter(sk => isKept(sk) || training[sk] === 1);
    if (eligible.length) {
      return {
        options: eligible,
        contextNote: "Proficient skills eligible for Expertise (excluding skills already at Expertise)",
        fallbackUsed: false
      };
    }
    const anyProf = allSkills.filter(sk => (training[sk] || 0) >= 1);
    return {
      options: anyProf.length ? anyProf : allSkills,
      contextNote: anyProf.length ? "All proficient skills already have Expertise" : "No proficient skills yet — add skill proficiencies first",
      fallbackUsed: true
    };
  }

  if (kind === "proficientSkills") {
    const { training } = _ownedSkillSet(profile, session);
    const profs = allSkills.filter(sk => isKept(sk) || (training[sk] || 0) >= 1);
    return {
      options: profs.length ? profs : allSkills,
      contextNote: profs.length ? "Filtered to skills you are proficient in" : "No proficient skills detected — showing all skills",
      fallbackUsed: !profs.length
    };
  }

  if (kind === "proficientSkillsOrTools") {
    const { training } = _ownedSkillSet(profile, session);
    const profSkills = allSkills.filter(sk => isKept(sk) || (training[sk] || 0) >= 1);
    const profTools = typeof characterProficiencies === "function" && profile && session
      ? (characterProficiencies(profile, session).tools || [])
          .map(t => t.name)
          .filter(n => n && !/your choice|choose|one type of|one set of|one instrument|one of your choice/i.test(n))
      : [];
    const combined = [...new Set([...profSkills, ...profTools])];
    return {
      options: combined.length ? combined : [...allSkills, ...SW5E_ALL_TOOLS],
      contextNote: combined.length ? "Filtered to your proficient skills and tools" : "No proficient skills or tools detected",
      fallbackUsed: !combined.length
    };
  }

  // --- TOOLS & SKILLS+TOOLS ---
  if (kind === "skillsOrTools") {
    const { proficient } = _ownedSkillSet(profile, session);
    const ownedTools = _ownedToolSet(profile, session);
    const raw = [...allSkills, ...SW5E_ALL_TOOLS];
    return filterOut(raw, opt => skills[opt] ? proficient.has(normalizeName(opt)) : ownedTools.has(_choiceNorm(opt)), {
      scopedLabel: "Skills & tools",
      ownedReason: "already proficient"
    });
  }

  if (["allTools", "specialistKit", "artisanImplements", "musicalInstrument", "gamingSet", "explicitTools"].includes(kind)) {
    const ownedTools = _ownedToolSet(profile, session);
    const poolMap = {
      allTools: [SW5E_ALL_TOOLS, "Tools"],
      specialistKit: [SW5E_SPECIALIST_KITS, "Specialist's kits"],
      artisanImplements: [SW5E_ARTISAN_IMPLEMENTS, "Artisan's implements"],
      musicalInstrument: [SW5E_MUSICAL_INSTRUMENTS, "Musical instruments"],
      gamingSet: [SW5E_GAMING_SETS, "Gaming sets"],
      explicitTools: [Array.isArray(spec.options) ? [...spec.options] : SW5E_ALL_TOOLS, spec.sourceLabel ? `${spec.sourceLabel} tools` : "Eligible tools"]
    };
    const [base, lbl] = poolMap[kind];
    if (spec?.allowOwnedUpgrade) {
      return {
        options: [...base],
        contextNote: lbl + " (includes proficient tools eligible for Expertise upgrade)",
        fallbackUsed: false
      };
    }
    return filterOut(base, t => ownedTools.has(_choiceNorm(t)), {
      fallbackAll: SW5E_ALL_TOOLS,
      scopedLabel: lbl,
      ownedReason: "already proficient"
    });
  }

  // --- LANGUAGES ---
  if (kind === "languages") {
    const ownedLangs = _ownedLanguageSet(profile, session);
    const basePool = Array.isArray(spec.options) && spec.options.length ? [...spec.options] : [...SW5E_LANGUAGES];
    return filterOut(basePool, l => ownedLangs.has(_choiceNorm(l)), {
      scopedLabel: "Languages",
      ownedReason: "already known"
    });
  }

  // --- WEAPONS & WEAPON CATEGORIES ---
  if (["allWeapons", "weapon", "blastersOrVibro", "lightBlastersOrVibro", "martialVibro", "vibro", "blasters"].includes(kind)) {
    const allWep = (typeof SW5E_EQUIPMENT !== "undefined" ? SW5E_EQUIPMENT : []).filter(e => e.category === "Weapon");
    let pool = allWep;
    let lbl = "Weapons";
    if (kind === "blastersOrVibro") {
      pool = allWep.filter(e => /blaster|vibro/i.test(e.classification || ""));
      lbl = "Blasters & vibroweapons";
    } else if (kind === "lightBlastersOrVibro") {
      pool = allWep.filter(e => {
        if (!/blaster|vibro/i.test(e.classification || "")) return false;
        const wp = weaponPropertyProfile(e.properties);
        return !wp.heavy && !wp.strengthMin;
      });
      lbl = "Blasters & vibroweapons (no heavy/strength)";
    } else if (kind === "martialVibro") {
      pool = allWep.filter(e => /martial\s*vibro/i.test(e.classification || ""));
      lbl = "Martial vibroweapons";
    } else if (kind === "vibro") {
      pool = allWep.filter(e => /vibro/i.test(e.classification || ""));
      lbl = "Vibroweapons";
    } else if (kind === "blasters") {
      pool = allWep.filter(e => /blaster/i.test(e.classification || ""));
      lbl = "Blasters";
    }
    const checker = _weaponProficiencyChecker(profile, session);
    return filterOut(pool.map(e => e.name).sort(), w => checker.hasWeapon(w), {
      scopedLabel: lbl,
      ownedReason: "already proficient"
    });
  }

  if (kind === "weaponCategory") {
    const checker = _weaponProficiencyChecker(profile, session);
    return filterOut([...SW5E_WEAPON_CATEGORIES], c => checker.hasCategory(c), {
      scopedLabel: "Weapon categories",
      ownedReason: "already proficient"
    });
  }

  // --- SAVING THROWS (Resilient) ---
  if (kind === "savingThrow") {
    const ownedSaves = _ownedSaveProficiencySet(profile, session);
    return filterOut([...abilities], ab => ownedSaves.has(normalizeName(ab)), {
      scopedLabel: "Saving throws",
      ownedReason: "already proficient"
    });
  }

  // --- COMBAT OPTIONS ---
  const _coPrereqOk = (entry) => {
    if (typeof checkCombatOptionPrerequisite !== "function" || !entry) return true;
    return checkCombatOptionPrerequisite(profile, session, null, entry).met;
  };
  if (kind === "fightingStyles" || kind === "fightingStyle") {
    const owned = new Set((session?.fightingStyles || []).map(normalizeName));
    const raw = (typeof SW5E_FIGHTING_STYLES !== "undefined" ? SW5E_FIGHTING_STYLES : []).filter(_coPrereqOk).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Fighting Styles", ownedReason: "already known" });
  }
  if (kind === "fightingMasteries" || kind === "fightingMastery") {
    const owned = new Set((session?.fightingMasteries || []).map(normalizeName));
    const raw = (typeof SW5E_FIGHTING_MASTERIES !== "undefined" ? SW5E_FIGHTING_MASTERIES : []).filter(_coPrereqOk).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Fighting Masteries", ownedReason: "already known" });
  }
  if (kind === "lightsaberForms" || kind === "lightsaberForm") {
    const owned = new Set((session?.lightsaberForms || []).map(normalizeName));
    const raw = (typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS : []).filter(_coPrereqOk).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Lightsaber Forms", ownedReason: "already known" });
  }
  if (kind === "maneuvers") {
    const owned = new Set((session?.maneuvers || []).map(normalizeName));
    const raw = (typeof SW5E_MANEUVERS !== "undefined" ? SW5E_MANEUVERS : []).filter(_coPrereqOk).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Maneuvers", ownedReason: "already known" });
  }
  if (kind === "castingType") {
    return { options: ["Force-casting", "Tech-casting"], contextNote: "Choose whether this option targets Force-casters or Tech-casters." };
  }
  if (kind === "knownManeuvers") {
    const owned = Array.isArray(session?.maneuvers) ? [...session.maneuvers].sort() : [];
    const raw = (typeof SW5E_MANEUVERS !== "undefined" ? SW5E_MANEUVERS : []).map(x => x.name).sort();
    return {
      options: owned.length ? owned : raw,
      contextNote: owned.length ? "Filtered to maneuvers you know" : "No known maneuvers yet — showing all maneuvers",
      fallbackUsed: !owned.length
    };
  }
  if (kind === "weaponFocus") {
    const owned = new Set();
    const addWf = nm => {
      const rec = typeof weaponFocusRule === "function" ? weaponFocusRule(nm, { allowBare: true }) : null;
      if (rec?.name) owned.add(normalizeName(rec.name));
      else if (nm) owned.add(normalizeName(nm));
    };
    for (const f of (session?.feats || [])) {
      if (typeof featChoiceKind === "function" && featChoiceKind(featRule(f.name)) === "weaponFocus" && f.choice) addWf(f.choice);
    }
    for (const nm of (Array.isArray(profile?.weaponFocuses) ? profile.weaponFocuses : [])) addWf(nm);
    for (const nm of (Array.isArray(session?.weaponFocuses) ? session.weaponFocuses : [])) addWf(nm);
    const raw = (typeof SW5E_WEAPON_FOCUSES !== "undefined" ? SW5E_WEAPON_FOCUSES : []).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Weapon Focus options", ownedReason: "already owned" });
  }
  if (kind === "weaponSupremacy") {
    const owned = new Set();
    const addWs = nm => {
      const rec = typeof weaponSupremacyRule === "function" ? weaponSupremacyRule(nm, { allowBare: true }) : null;
      if (rec?.name) owned.add(normalizeName(rec.name));
      else if (nm) owned.add(normalizeName(nm));
    };
    for (const f of (session?.feats || [])) {
      if (typeof featChoiceKind === "function" && featChoiceKind(featRule(f.name)) === "weaponSupremacy" && f.choice) addWs(f.choice);
    }
    for (const nm of (Array.isArray(profile?.weaponSupremacies) ? profile.weaponSupremacies : [])) addWs(nm);
    for (const nm of (Array.isArray(session?.weaponSupremacies) ? session.weaponSupremacies : [])) addWs(nm);
    const raw = (typeof SW5E_WEAPON_SUPREMACIES !== "undefined" ? SW5E_WEAPON_SUPREMACIES : []).map(x => x.name).sort();
    return filterOut(raw, n => owned.has(normalizeName(n)), { scopedLabel: "Weapon Supremacy options", ownedReason: "already owned" });
  }

  // --- POWERS ---
  if (["anyAtWillPower", "anyAtWillAttackPower", "anyAtWillSavePower", "forcePowers", "techPowerLevel1", "forceAtWill", "forceLeveled", "techAtWill", "techLeveled"].includes(kind)) {
    const known = new Set((typeof activePowerNames === "function" && profile ? activePowerNames(profile, session) : (session?.powers || [])).map(normalizeName));
    const allP = typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : [];
    let pool = allP;
    let lbl = "Powers";
    if (kind === "anyAtWillPower") {
      pool = allP.filter(p => p.level === 0);
      lbl = "At-will Force & Tech powers";
    } else if (kind === "anyAtWillAttackPower") {
      pool = allP.filter(p => p.level === 0 && Boolean(p.combat?.hasAttack));
      lbl = "At-will Force & Tech powers (attack roll)";
    } else if (kind === "anyAtWillSavePower") {
      pool = allP.filter(p => p.level === 0 && Boolean(p.combat?.hasSave));
      lbl = "At-will Force & Tech powers (saving throw)";
    } else if (kind === "forcePowers") {
      pool = allP.filter(p => p.type === "Force" && p.level <= 1);
      lbl = "At-will & 1st-level Force powers";
    } else if (kind === "techPowerLevel1") {
      pool = allP.filter(p => p.type === "Tech" && p.level === 1);
      lbl = "1st-level Tech powers";
    } else if (kind === "forceAtWill") {
      pool = allP.filter(p => p.type === "Force" && p.level === 0);
      lbl = "At-will Force powers";
    } else if (kind === "forceLeveled") {
      const lvl = spec.powerLevel || 1;
      pool = allP.filter(p => p.type === "Force" && p.level === lvl);
      lbl = `Level ${lvl} Force powers`;
    } else if (kind === "techAtWill") {
      pool = allP.filter(p => p.type === "Tech" && p.level === 0);
      lbl = "At-will Tech powers";
    } else if (kind === "techLeveled") {
      const lvl = spec.powerLevel || 1;
      pool = allP.filter(p => p.type === "Tech" && p.level === lvl);
      lbl = `Level ${lvl} Tech powers`;
    }
    return filterOut(pool.map(p => p.name).sort(), n => known.has(normalizeName(n)), { scopedLabel: lbl, ownedReason: "already known" });
  }

  if (kind === "knownLeveledPowers") {
    const knownNames = typeof activePowerNames === "function" && profile ? activePowerNames(profile, session) : (session?.powers || []);
    const allP = typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : [];
    const knownLeveled = knownNames
      .map(n => allP.find(p => normalizeName(p.name) === normalizeName(n)))
      .filter(p => p && p.level >= 1)
      .map(p => p.name)
      .sort();
    const fallback = allP.filter(p => p.level >= 1).map(p => p.name).sort();
    return {
      options: knownLeveled.length >= count ? knownLeveled : fallback,
      contextNote: knownLeveled.length >= count ? "Filtered to your known 1st-level or higher powers" : "Showing all 1st-level or higher powers",
      fallbackUsed: knownLeveled.length < count
    };
  }

  // --- DAMAGE TYPES / RESISTANCES ---
  if (kind === "damageTypes") {
    const alreadyResisted = new Set();
    if (normalizeName(profile?.className) === "berserker") {
      alreadyResisted.add("kinetic");
      alreadyResisted.add("energy");
    }
    if (typeof defenseProfile === "function" && profile && session) {
      const tempProf = { ...profile, dewback: [] };
      const tempSess = { ...session, rage: null };
      for (const r of (defenseProfile(tempProf, tempSess).resistances || [])) {
        alreadyResisted.add(String(r).toLowerCase());
      }
    }
    const raw = damageTypes.filter(d => d !== "true").map(d => d.charAt(0).toUpperCase() + d.slice(1));
    return filterOut(raw, d => alreadyResisted.has(d.toLowerCase()), {
      scopedLabel: "Damage types",
      ownedReason: "already resisted"
    });
  }

  if (kind === "damageType") {
    const srcFeatNorm = normalizeName(opts?.sourceFeatName || "");
    const owned = new Set((session?.feats || []).filter(f => {
      const fr = typeof featRule === "function" ? featRule(f?.name) : null;
      const matchesFeat = srcFeatNorm ? normalizeName(f?.name) === srcFeatNorm : Boolean(fr?.distinctChoice && fr?.choiceSpec?.kind === "damageType");
      return matchesFeat && f.choice;
    }).map(f => normalizeName(f.choice)));
    const raw = Array.isArray(spec.options) ? [...spec.options] : ["acid", "cold", "fire", "force", "lightning", "necrotic"];
    return filterOut(raw, d => owned.has(normalizeName(d)), { scopedLabel: "Elemental damage types", ownedReason: "already chosen" });
  }

  // --- CLASSES & CLASS CUSTOMIZATIONS ---
  if (kind === "class" || kind === "otherClass") {
    const ownCls = normalizeName(profile?.className || "");
    const ownedSplash = new Set([
      ...((session?.feats || [])
        .filter(f => typeof featChoiceKind === "function" && featChoiceKind(typeof featRule === "function" ? featRule(f.name) : null) === "class" && f.choice)
        .map(f => normalizeName(f.choice))),
      ...((Array.isArray(session?.splashclassImprovements) ? session.splashclassImprovements : []).map(normalizeName)),
      ...((Array.isArray(profile?.splashclassImprovements) ? profile.splashclassImprovements : []).map(normalizeName))
    ]);
    const hasForce = profile && typeof castingStats === "function" ? Boolean(castingStats(profile, session).hasForce) : true;
    const raw = (typeof SW5E_CLASSES !== "undefined" ? SW5E_CLASSES : []).map(c => c.name).sort();
    return filterOut(raw, c => {
      const nc = normalizeName(c);
      if (ownedSplash.has(nc)) return true;
      if (typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined") {
        const sc = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className) === nc);
        if (sc) {
          if (profile && typeof checkImprovementPrerequisite === "function") {
            if (!checkImprovementPrerequisite(profile, session, sc).met) return true;
          } else {
            if (ownCls && nc === ownCls) return true;
            if (/ability to cast force powers/i.test(sc.prerequisite || "") && !hasForce) return true;
          }
          return false;
        }
      }
      if (ownCls && nc === ownCls) return true;
      return false;
    }, {
      scopedLabel: "Eligible Splashclass Improvements",
      ownedReason: "ineligible or already chosen"
    });
  }

  if (kind === "classImprovement") {
    const allCi = typeof SW5E_CLASS_IMPROVEMENTS !== "undefined" ? SW5E_CLASS_IMPROVEMENTS : [];
    const ownedCi = new Set([
      ...((session?.feats || []).filter(f => featRule(f?.name)?.extraChoiceSpec?.kind === "classImprovement")
        .flatMap(f => [...(Array.isArray(f.multiChoice) ? f.multiChoice : []), ...(f.choice ? [f.choice] : [])])),
      ...(Array.isArray(session?.classImprovements) ? session.classImprovements : []),
      ...(Array.isArray(profile?.classImprovements) ? profile.classImprovements : [])
    ].map(normalizeName).filter(Boolean));
    const eligible = allCi.filter(ci => {
      if (isKept(ci.label) || isKept(ci.className)) return true;
      if (ownedCi.has(normalizeName(ci.label)) || ownedCi.has(normalizeName(ci.className))) return false;
      return typeof checkImprovementPrerequisite !== "function" || checkImprovementPrerequisite(profile, session, ci).met;
    });
    if (eligible.length) {
      const clsNames = eligible.map(x => x.className).join(", ");
      return { options: eligible.map(x => x.label), contextNote: `Eligible Class Improvements (3+ levels in ${clsNames})`, fallbackUsed: false };
    }
    const primaryImp = typeof classImprovementRule === "function" ? classImprovementRule(profile?.className) : null;
    if (primaryImp) {
      const pr = typeof checkImprovementPrerequisite === "function" ? checkImprovementPrerequisite(profile, session, primaryImp) : { met: false, missing: ["Requires 3+ levels"] };
      return { options: [primaryImp.label], contextNote: `Scoped to ${profile.className} (${pr.missing.join("; ") || "already owned"})`, fallbackUsed: true };
    }
    return { options: allCi.map(x => x.label), contextNote: "All Class Improvements (requires 3+ levels in that class)", fallbackUsed: true };
  }

  if (kind === "multiclassImprovements") {
    const allMc = (typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined" ? SW5E_MULTICLASS_IMPROVEMENTS : []);
    const ownedMc = new Set([
      ...((session?.feats || []).filter(f => featRule(f?.name)?.extraChoiceSpec?.kind === "multiclassImprovements")
        .flatMap(f => [...(Array.isArray(f.multiChoice) ? f.multiChoice : []), ...(f.choice ? [f.choice] : [])])),
      ...(Array.isArray(session?.multiclassImprovements) ? session.multiclassImprovements : []),
      ...(Array.isArray(profile?.multiclassImprovements) ? profile.multiclassImprovements : [])
    ].map(normalizeName).filter(Boolean));
    const eligible = allMc.filter(mc => {
      const cn = mc.className || mc.name;
      if (isKept(cn)) return true;
      if (ownedMc.has(normalizeName(cn))) return false;
      return typeof checkImprovementPrerequisite !== "function" || checkImprovementPrerequisite(profile, session, mc).met;
    }).map(x => x.className || x.name).filter(Boolean).sort();
    if (eligible.length >= (spec?.count || 2)) {
      return { options: eligible, contextNote: "Eligible Multiclass Improvements (3+ levels in each class)", fallbackUsed: false };
    }
    const pool = allMc.map(x => x.className || x.name).filter(Boolean).sort();
    return { options: pool, contextNote: "All Multiclass Improvements (requires 3+ levels in each chosen class)", fallbackUsed: true };
  }

  if (kind === "exoticWeapons") {
    const allExotic = (typeof SW5E_EQUIPMENT !== "undefined" ? SW5E_EQUIPMENT : [])
      .filter(e => e.category === "Weapon" && /^Exotic/i.test(e.classification || ""))
      .sort((a, b) => a.name.localeCompare(b.name));
    const wpSet = (profile && typeof characterTraits === "function") ? characterTraits(profile, session).weaponProficiencies : null;
    const _hasCat = cat => {
      if (cat === "Blaster") return wpSet.has("SimpleBlaster") && wpSet.has("MartialBlaster");
      if (cat === "Vibroweapon") return wpSet.has("SimpleVibroweapon") && wpSet.has("MartialVibroweapon");
      if (cat === "Lightweapon") return wpSet.has("SimpleLightweapon") && wpSet.has("MartialLightweapon");
      return true;
    };
    const _catsOfWeapon = wep => {
      const cats = new Set();
      const cls = String(wep.classification || "");
      if (/Blaster/i.test(cls)) cats.add("Blaster");
      if (/Vibroweapon/i.test(cls)) cats.add("Vibroweapon");
      if (/Lightweapon/i.test(cls)) cats.add("Lightweapon");
      for (const modeName of (typeof parseModalModes === "function" ? parseModalModes(wep.properties) : [])) {
        {
          const mItem = typeof itemRule === "function" ? (itemRule(modeName) || itemRule(modeName.replace(/-/g, ""))) : null;
          const mCls = String(mItem?.classification || "");
          if (/Blaster/i.test(mCls)) cats.add("Blaster");
          else if (/Vibroweapon/i.test(mCls)) cats.add("Vibroweapon");
          else if (/Lightweapon/i.test(mCls)) cats.add("Lightweapon");
        }
      }
      return [...cats];
    };
    const eligible = wpSet ? allExotic.filter(e => {
      if (isKept(e.name)) return true;
      return _catsOfWeapon(e).every(_hasCat);
    }) : allExotic;
    const useList = eligible.length >= (spec?.count || 3) ? eligible : allExotic;
    return {
      options: useList.map(e => e.name),
      contextNote: eligible.length < allExotic.length && useList === eligible
        ? "Filtered to exotic weapon categories where you have simple & martial proficiency"
        : "Requires all simple & martial proficiencies in each exotic weapon's category",
      fallbackUsed: useList !== eligible
    };
  }

  if (kind === "classCustomizations") {
    const targetCls = spec?.className || profile?.className || "";
    const clsNorm = normalizeName(targetCls);
    const owned = new Set((session?.classOptions || []).map(normalizeName));
    const pool = (typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS : [])
      .filter(o => normalizeName(o.className) === clsNorm);
    const eligible = [];
    let lockedCount = 0;
    for (const opt of pool) {
      if (owned.has(normalizeName(opt.name)) && !isKept(opt.name)) continue;
      const prereq = typeof checkClassOptionPrerequisite === "function"
        ? checkClassOptionPrerequisite(profile, session, opt)
        : { met: true };
      if (prereq.met || isKept(opt.name)) eligible.push(opt.name);
      else lockedCount++;
    }
    const meta = typeof classPoolMeta === "function" ? classPoolMeta(targetCls) : null;
    const poolLbl = meta?.poolName || (profile?.className + " customizations");
    const note = `Eligible ${poolLbl}` +
      (owned.size ? ` (excluding ${owned.size} owned` : "") +
      (lockedCount ? (owned.size ? `, ${lockedCount} locked by prerequisites)` : ` (excluding ${lockedCount} locked by prerequisites)`) : (owned.size ? ")" : ""));
    return { options: eligible.sort(), contextNote: note, fallbackUsed: false };
  }

  // --- MISC / EXPLICIT ---
  if (kind === "droidClass") return { options: [...SW5E_DROID_CLASSES], contextNote: "Droid classes", fallbackUsed: false };
  if (kind === "cunningOptions") return { options: [...SW5E_CUNNING_OPTIONS], contextNote: "Cunning Action options", fallbackUsed: false };
  if (kind === "vowFocusedAbility") return { options: ["Strength", "Constitution", "Intelligence"], contextNote: "Substitutes for Wisdom or Charisma in base Monk class features", fallbackUsed: false };
  if (kind === "rancorDisciplineAbility") return { options: ["Wisdom", "Charisma"], contextNote: "Substitutes for Intelligence in base Scholar class features", fallbackUsed: false };
  if (kind === "powerType") return { options: ["Force", "Tech"], contextNote: "", fallbackUsed: false };
  if (kind === "companion") return { options: ["Beast", "Droid", "Turret", "Tracker Droid"], contextNote: "", fallbackUsed: false };
  if (kind === "deployment") return { options: ["Coordinator", "Gunner", "Mechanic", "Operator", "Pilot"], contextNote: "Starship deployments", fallbackUsed: false };
  if (kind === "explicitArchetype" && Array.isArray(spec.options)) {
    const ownedArchChoices = new Set(
      Object.values(session?.archetypeFeatureChoices || {}).flat().map(normalizeName)
    );
    const eligible = spec.options.filter(opt => {
      if (isKept(opt)) return true;
      const desc = spec.optionDescriptions?.[opt] || "";
      const prereqMatch = desc.match(/\*\*Prerequisite:\*\*\s*([^\n]+)/i);
      if (prereqMatch) {
        const reqs = prereqMatch[1].split(/\s+or\s+/i).map(r => r.replace(/[_*]/g, "").trim());
        if (reqs.length && !reqs.some(r => ownedArchChoices.has(normalizeName(r)))) return false;
      }
      return true;
    });
    return {
      options: eligible.length ? eligible : [...spec.options],
      contextNote: spec.sourceLabel ? (spec.sourceLabel + " options") : "",
      fallbackUsed: !eligible.length
    };
  }
  if (kind === "explicit" && Array.isArray(spec.options)) {
    return { options: [...spec.options], contextNote: spec.sourceLabel || "", fallbackUsed: false };
  }

  return { options: Array.isArray(spec?.options) ? [...spec.options] : [], contextNote: "", fallbackUsed: false };
}

function optionsForGrantKind(kind, profile, session, explicitOpts = null, opts = {}) {
  return contextualizeChoiceOptions({ kind, options: explicitOpts, count: opts.count || 1, sourceLabel: opts.sourceLabel || "" }, profile, session, opts).options;
}

function previewForGrantKind(kind, optName) {
  if (kind === "fightingStyles" || kind === "fightingStyle") return fightingStyleRule(optName)?.description || "";
  if (kind === "fightingMasteries" || kind === "fightingMastery") return fightingMasteryRule(optName)?.description || "";
  if (kind === "lightsaberForms" || kind === "lightsaberForm") return lightsaberFormRule(optName)?.description || "";
  if (kind === "maneuvers" || kind === "knownManeuvers") return maneuverRule(optName)?.description || "";
  if (kind === "weaponFocus") return typeof weaponFocusRule === "function" ? (weaponFocusRule(optName)?.description || "") : "";
  if (kind === "weaponSupremacy") return typeof weaponSupremacyRule === "function" ? (weaponSupremacyRule(optName)?.description || "") : "";
  if (kind === "classCustomizations") {
    const c = typeof classOptionRule === "function" ? classOptionRule(optName) : null;
    return c ? [c.prerequisite ? "Prerequisite: " + c.prerequisite : "", c.description].filter(Boolean).join("\n\n") : "";
  }
  if (["anyAtWillPower", "anyAtWillAttackPower", "anyAtWillSavePower", "forcePowers", "techPowerLevel1", "forceAtWill", "forceLeveled", "techAtWill", "techLeveled"].includes(kind)) {
    const p = powerRule(optName);
    return p ? [p.type + " · " + (p.level === 0 ? "At-will" : "Level " + p.level) + " · " + p.castingPeriodText, p.description].filter(Boolean).join("\n\n") : "";
  }
  if (kind === "classImprovement" && typeof SW5E_CLASS_IMPROVEMENTS !== "undefined") {
    const ci = SW5E_CLASS_IMPROVEMENTS.find(x => normalizeName(x.label) === normalizeName(optName) || normalizeName(x.className) === normalizeName(optName));
    if (ci) return [ci.prerequisite ? "Prerequisite: " + ci.prerequisite : "", ci.description || ""].filter(Boolean).join("\n\n");
  }
  if (kind === "multiclassImprovements" && typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined") {
    const mc = SW5E_MULTICLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === normalizeName(optName));
    if (mc) return [mc.prerequisite ? "Prerequisite: " + mc.prerequisite : "", mc.description || mc.text || ""].filter(Boolean).join("\n\n");
  }
  if (["allWeapons", "weapon", "exoticWeapons", "blastersOrVibro", "lightBlastersOrVibro", "martialVibro", "vibro", "blasters"].includes(kind)) {
    const it = itemRule(optName);
    return it ? [humanizeEnum(it.classification || ""), it.properties?.length ? "Properties: " + it.properties.join(", ") : "", it.description].filter(Boolean).join("\n\n") : "";
  }
  const eqHit = typeof itemRule === "function" ? itemRule(optName) : null;
  if (eqHit && (eqHit.description || eqHit.cost || eqHit.weight)) {
    const meta = [(typeof humanizeEnum === "function" ? humanizeEnum(eqHit.category || "") : (eqHit.category || "")), eqHit.cost ? (eqHit.cost + " cr") : "", Number(eqHit.weight) ? (eqHit.weight + " lb") : ""].filter(Boolean).join(" · ");
    return [meta, eqHit.description].filter(Boolean).join("\n\n");
  }
  if (typeof SW5E_LANGUAGE_RULES !== "undefined") {
    const lKey = Object.keys(SW5E_LANGUAGE_RULES).find(k => normalizeName(k) === normalizeName(optName));
    if (lKey) return SW5E_LANGUAGE_RULES[lKey];
  }
  if (typeof SW5E_SKILL_RULES !== "undefined") {
    const sKey = Object.keys(SW5E_SKILL_RULES).find(k => normalizeName(k) === normalizeName(optName));
    if (sKey) {
      const ab = typeof skills !== "undefined" && skills[sKey] ? ("**Ability:** " + skills[sKey]) : "";
      return [ab, SW5E_SKILL_RULES[sKey]].filter(Boolean).join("\n\n");
    }
  }
  if (typeof SW5E_ABILITY_RULES !== "undefined") {
    const aKey = Object.keys(SW5E_ABILITY_RULES).find(k => normalizeName(k) === normalizeName(optName));
    if (aKey) return SW5E_ABILITY_RULES[aKey];
  }
  if (typeof SW5E_DAMAGE_TYPE_RULES !== "undefined") {
    const dKey = Object.keys(SW5E_DAMAGE_TYPE_RULES).find(k => normalizeName(k) === normalizeName(optName));
    if (dKey) return SW5E_DAMAGE_TYPE_RULES[dKey];
  }
  if (typeof classRecord === "function") {
    const cRec = classRecord(optName);
    if (cRec) {
      const meta = [
        cRec.hitDie ? ("Hit Die: d" + cRec.hitDie) : "",
        cRec.savingThrows?.length ? ("Saves: " + cRec.savingThrows.join(", ")) : ""
      ].filter(Boolean).join(" · ");
      return [meta, cRec.summary || cRec.description || ""].filter(Boolean).join("\n\n");
    }
  }
  return "";
}

function categoryForGrantKind(kind, optName) {
  if (["anyAtWillPower", "anyAtWillAttackPower", "anyAtWillSavePower"].includes(kind)) return powerRule(optName)?.type || "";
  if (kind === "maneuvers" || kind === "knownManeuvers") return maneuverRule(optName)?.type || "";
  if (kind === "skillsOrTools" || kind === "proficientSkillsOrTools") return skills[optName] ? "Skill" : "Tool";
  if (["allWeapons", "weapon", "exoticWeapons", "blastersOrVibro", "lightBlastersOrVibro", "martialVibro", "vibro", "blasters"].includes(kind)) {
    return humanizeEnum(itemRule(optName)?.classification || "");
  }
  return "";
}

// ============================================================================
// 4. REUSABLE CONTEXTUAL MULTI-CHOICE MODAL
// ============================================================================

function openMultiChoiceDialog({ title, label, contextNote = "", count = 1, maxSkills = null, options = [], initial = [], getCategory = null, getPreview = null, trigger = null, onConfirm }) {
  const useChips = options.length <= 14;
  const { dialog, form, body, confirm } = createModalFrame(title, trigger, { size: useChips ? "" : "reading" });
  confirm.textContent = "Save selection";

  const rawInitial = Array.isArray(initial) ? initial.filter(Boolean) : (initial ? [initial] : []);
  let selected = [];
  for (const val of rawInitial) {
    const matched = options.find(o => normalizeName(o) === normalizeName(val)) || val;
    if (!selected.some(x => normalizeName(x) === normalizeName(matched))) selected.push(matched);
  }
  selected = selected.slice(0, count);

  const head = appendText(body, "div", "");
  head.className = "top wrap";
  appendText(head, "strong", label);
  const statusEl = appendText(head, "span", "");
  statusEl.className = "muted";

  if (contextNote) {
    appendText(body, "small", contextNote).className = "muted";
  }

  const selectedPills = appendText(body, "div", "");
  selectedPills.className = "directChips";

  const skillCountOf = list => list.filter(x => typeof skills !== "undefined" && Object.keys(skills).some(sk => normalizeName(sk) === normalizeName(x))).length;
  const syncState = () => {
    const tooManySkills = Number.isFinite(maxSkills) && skillCountOf(selected) > maxSkills;
    statusEl.textContent = tooManySkills
      ? ("Select at most " + maxSkills + " skill (" + selected.length + " / " + count + ")")
      : (selected.length + " / " + count + " selected");
    confirm.disabled = selected.length < count || tooManySkills;
    selectedPills.replaceChildren();
    selectedPills.hidden = useChips || !selected.length;
    if (!useChips) {
      for (const item of selected) {
        const pill = appendText(selectedPills, "button", item + " ×");
        pill.type = "button";
        pill.className = "pickerChip";
        pill.setAttribute("aria-pressed", "true");
        pill.setAttribute("aria-label", "Remove " + item);
        pill.addEventListener("click", () => {
          selected = selected.filter(x => normalizeName(x) !== normalizeName(item));
          syncUI();
        });
      }
    }
  };

  let chipBtns = [];
  let picker = null;
  const toggleOption = opt => {
    const exists = selected.some(x => normalizeName(x) === normalizeName(opt));
    if (exists) {
      selected = selected.filter(x => normalizeName(x) !== normalizeName(opt));
    } else if (count === 1) {
      selected = [opt];
    } else if (selected.length < count) {
      selected = [...selected, opt];
    }
    syncUI();
  };

  const syncUI = () => {
    syncState();
    const atCap = count > 1 && selected.length >= count;
    for (const btn of chipBtns) {
      const on = selected.some(x => normalizeName(x) === normalizeName(btn.dataset.opt));
      btn.setAttribute("aria-pressed", String(on));
      btn.disabled = atCap && !on;
    }
    if (picker) picker.setValue(selected[selected.length - 1] || "");
  };

  if (useChips) {
    const chips = appendText(body, "div", "");
    chips.className = "directChips";
    let chipPreviewBox = null;
    const showChipPreview = opt => {
      if (!chipPreviewBox || !getPreview) return;
      const txt = opt ? getPreview(opt) : "";
      chipPreviewBox.replaceChildren();
      if (!txt) { chipPreviewBox.hidden = true; return; }
      appendText(chipPreviewBox, "strong", opt);
      renderRules(chipPreviewBox, txt);
      chipPreviewBox.hidden = false;
    };
    for (const opt of options) {
      const btn = appendText(chips, "button", opt);
      btn.type = "button";
      btn.dataset.opt = opt;
      btn.addEventListener("click", () => { toggleOption(opt); showChipPreview(opt); });
      btn.addEventListener("focus", () => showChipPreview(opt));
      chipBtns.push(btn);
    }
    if (getPreview && options.some(o => getPreview(o))) {
      chipPreviewBox = appendText(body, "div", "");
      chipPreviewBox.className = "pickerPreview";
      chipPreviewBox.hidden = true;
      showChipPreview(selected[0] || options.find(o => getPreview(o)) || "");
    }
  } else {
    picker = createSearchablePicker({
      options,
      value: selected[0] || "",
      placeholder: "Search " + label.toLowerCase(),
      onSelect: opt => toggleOption(opt),
      getCategory,
      getPreview
    });
    body.append(picker.element);
  }

  syncUI();
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (confirm.disabled) return;
    dialog.close();
    if (onConfirm) onConfirm([...selected]);
  });
  dialog.showModal();
  if (picker) picker.search.focus();
}

// ============================================================================
// 5. RECURSIVE RULE ELEMENT CHOICE ENGINE
// Given ANY Rule Element { kind, name, ... }, checks if it has unresolved choices,
// prompts the user with contextualized options, applies them, and RECURSIVELY
// resolves any granted child Rule Elements!
// ============================================================================

function resolveRuleElementChoices(element, { trigger = null, onComplete = null, visited = new Set(), forceEdit = false } = {}) {
  if (!element || !app.character) {
    if (onComplete) onComplete();
    return;
  }
  const visitKey = element.kind + ":" + normalizeName(element.name || "") + (element.instanceIndex !== undefined ? "#" + element.instanceIndex : "");
  if (visited.has(visitKey)) {
    if (onComplete) onComplete();
    return;
  }
  visited.add(visitKey);

  const drainChildren = (children) => {
    if (!children || !children.length) {
      if (onComplete) onComplete();
      return;
    }
    const [head, ...rest] = children;
    resolveRuleElementChoices(head, {
      trigger,
      visited,
      onComplete: () => drainChildren(rest)
    });
  };

  const { profile, session } = app.character;

  if (element.kind === "fightingStyle" || element.kind === "fightingMastery") {
    if (element.storageKey && element.followUpSpec) {
      const fSpec = element.followUpSpec;
      const saved = Array.isArray(session.combatOptionChoices?.[element.storageKey]) ? session.combatOptionChoices[element.storageKey] : [];
      if (!forceEdit && saved.length >= fSpec.count) return drainChildren([]);
      const { options, contextNote } = contextualizeChoiceOptions(fSpec, profile, session, { currentSelection: saved });
      openMultiChoiceDialog({
        title: element.name + " — " + fSpec.label,
        label: fSpec.label,
        contextNote,
        count: fSpec.count,
        options,
        initial: saved,
        getCategory: opt => categoryForGrantKind(fSpec.kind, opt),
        getPreview: opt => previewForGrantKind(fSpec.kind, opt),
        trigger,
        onConfirm: picked => {
          update("Selected " + element.storageKey, next => {
            next.combatOptionChoices = { ...(next.combatOptionChoices || {}), [element.storageKey]: picked };
          });
          drainChildren([]);
        }
      });
      return;
    }
    const spec = combatOptionGrantSpec(element.name, profile, session);
    if (!spec) return drainChildren([]);
    if (spec.storage === "combatOptionChoices") {
      const saved = Array.isArray(session.combatOptionChoices?.[element.name]) ? session.combatOptionChoices[element.name] : [];
      if (!forceEdit && saved.length >= spec.count) return drainChildren([]);
      const { options, contextNote } = contextualizeChoiceOptions(spec, profile, session, { currentSelection: saved });
      openMultiChoiceDialog({
        title: element.name + " — " + spec.label,
        label: spec.label,
        contextNote,
        count: spec.count,
        options,
        initial: saved,
        getCategory: opt => categoryForGrantKind(spec.kind, opt),
        getPreview: opt => previewForGrantKind(spec.kind, opt),
        trigger,
        onConfirm: picked => {
          update("Selected " + element.name + " choice", next => {
            next.combatOptionChoices = { ...(next.combatOptionChoices || {}), [element.name]: picked };
          });
          drainChildren([]);
        }
      });
      return;
    }
    const existingList = Array.isArray(session[spec.kind]) ? session[spec.kind] : [];
    const followUp = spec.followUpChoice ? [{ kind: element.kind, name: element.name, storageKey: spec.followUpChoice.storageKey, followUpSpec: spec.followUpChoice }] : [];
    if (!forceEdit && existingList.length >= spec.count) return drainChildren(followUp);
    const initial = existingList.slice(0, spec.count);
    const { options, contextNote } = contextualizeChoiceOptions(spec, profile, session, { currentSelection: initial });
    openMultiChoiceDialog({
      title: element.name + " — Choose " + (spec.kind === "maneuvers" ? "Maneuvers" : "Lightsaber Forms"),
      label: spec.label,
      contextNote,
      count: spec.count,
      maxSkills: Number.isFinite(spec.maxSkills) ? spec.maxSkills : null,
      options,
      initial,
      getCategory: opt => categoryForGrantKind(spec.kind, opt),
      getPreview: opt => previewForGrantKind(spec.kind, opt),
      trigger,
      onConfirm: picked => {
        update("Selected " + element.name + " choices", next => {
          if (!Array.isArray(next[spec.kind])) next[spec.kind] = [];
          for (const val of picked) {
            if (!next[spec.kind].some(x => normalizeName(x) === normalizeName(val))) next[spec.kind].push(val);
          }
        });
        drainChildren(followUp);
      }
    });
    return;
  }

  if (element.kind === "customization") {
    const spec = classOptionGrantSpec(element.name);
    if (!spec) return drainChildren([]);
    const rawSaved = session.classOptionChoices?.[element.name];
    const saved = (Array.isArray(rawSaved) && rawSaved.length)
      ? rawSaved
      : (normalizeName(element.name) === "dewback's instinct" && Array.isArray(profile.dewback) ? profile.dewback : []);
    if (!forceEdit && saved.length >= spec.count) {
      const children = spec.grantsRuleElementKind
        ? saved.map(name => ({ kind: spec.grantsRuleElementKind, name }))
        : [];
      return drainChildren(children);
    }
    const { options, contextNote } = contextualizeChoiceOptions(spec, profile, session, { currentSelection: saved });
    openMultiChoiceDialog({
      title: element.name + " — Make selection",
      label: spec.label,
      contextNote,
      count: spec.count,
      options,
      initial: saved,
      getCategory: opt => categoryForGrantKind(spec.kind, opt),
      getPreview: opt => previewForGrantKind(spec.kind, opt),
      trigger,
      onConfirm: picked => {
        update("Selected " + element.name + " · " + picked.join(", "), (next, prof) => {
          next.classOptionChoices = next.classOptionChoices || {};
          next.classOptionChoices[element.name] = picked;
          if (spec.kind === "fightingStyles") {
            next.fightingStyles = next.fightingStyles || [];
            for (const v of picked) {
              if (!next.fightingStyles.some(x => normalizeName(x) === normalizeName(v))) next.fightingStyles.push(v);
            }
          } else if (spec.kind === "fightingMasteries") {
            next.fightingMasteries = next.fightingMasteries || [];
            for (const v of picked) {
              if (!next.fightingMasteries.some(x => normalizeName(x) === normalizeName(v))) next.fightingMasteries.push(v);
            }
          } else if (spec.kind === "maneuvers") {
            next.maneuvers = next.maneuvers || [];
            for (const v of picked) {
              if (!next.maneuvers.some(x => normalizeName(x) === normalizeName(v))) next.maneuvers.push(v);
            }
          } else if (spec.kind === "lightsaberForms") {
            next.lightsaberForms = next.lightsaberForms || [];
            for (const v of picked) {
              if (!next.lightsaberForms.some(x => normalizeName(x) === normalizeName(v))) next.lightsaberForms.push(v);
            }
          } else if (spec.kind === "forcePowers" || spec.kind === "techPowerLevel1") {
            if (!Array.isArray(next.powers)) next.powers = [...activePowerNames(prof, next)];
            for (const v of picked) {
              if (!next.powers.some(x => normalizeName(x) === normalizeName(v))) next.powers.push(v);
            }
          } else if (spec.kind === "damageTypes" && normalizeName(element.name) === "dewback's instinct") {
            prof.dewback = picked.map(x => String(x).toLowerCase());
          }
        });
        const children = spec.grantsRuleElementKind
          ? picked.map(name => ({ kind: spec.grantsRuleElementKind, name }))
          : [];
        drainChildren(children);
      }
    });
    return;
  }

  if (element.kind === "feat") {
    const rule = featRule(element.name);
    if (!rule) return drainChildren([]);
    const idx = element.instanceIndex;
    const existing = idx !== undefined ? session.feats[idx] : null;
    if (!forceEdit && existing && !isFeatChoiceIncomplete(existing, rule)) {
      const ck = featChoiceKind(rule);
      const children = (ck === "fightingStyle" || ck === "fightingMastery") && existing.choice
        ? [{ kind: ck, name: existing.choice }]
        : [];
      return drainChildren(children);
    }
    openFeatChoiceDialog(rule, trigger, picked => {
      const ck = featChoiceKind(rule);
      const children = (ck === "fightingStyle" || ck === "fightingMastery") && picked.choice
        ? [{ kind: ck, name: picked.choice }]
        : [];
      if (idx !== undefined && existing) {
        applyFeatChoiceUpdate(idx, rule, picked, () => drainChildren(children), trigger);
      } else {
        addFeatWithChoices(rule, picked, element.source || "Added in viewer", () => drainChildren(children), trigger);
      }
    }, existing);
    return;
  }

  if (element.kind === "archetypeFeature" && element.spec) {
    const spec = element.spec;
    const saved = session.archetypeFeatureChoices?.[spec.featureName] || [];
    if (!forceEdit && saved.length >= spec.count) return drainChildren([]);
    const { options, contextNote } = contextualizeChoiceOptions(
      { ...spec, sourceLabel: (element.archName || session.approach || "Archetype") + " · " + spec.featureName },
      profile, session, { currentSelection: saved }
    );
    openMultiChoiceDialog({
      title: (element.archName || session.approach || "Archetype") + " — " + spec.featureName,
      label: spec.label,
      contextNote,
      count: spec.count,
      options,
      initial: saved,
      getPreview: opt => {
        if (spec.grantsRuleElementKind === "lightsaberForm" && typeof lightsaberFormRule === "function") {
          return lightsaberFormRule(opt)?.description || "";
        }
        return spec.optionDescriptions?.[opt] || "";
      },
      trigger,
      onConfirm: picked => {
        update("Updated " + spec.featureName + " (" + picked.join(", ") + ")", next => {
          next.archetypeFeatureChoices = next.archetypeFeatureChoices || {};
          next.archetypeFeatureChoices[spec.featureName] = picked;
          if (spec.grantsRuleElementKind === "lightsaberForm") {
            next.lightsaberForms = next.lightsaberForms || [];
            for (const v of picked) {
              const canon = (typeof lightsaberFormRule === "function" && lightsaberFormRule(v)?.name) || v;
              if (!next.lightsaberForms.some(x => normalizeName(x) === normalizeName(canon))) next.lightsaberForms.push(canon);
            }
          }
        });
        drainChildren([]);
      }
    });
    return;
  }

  if (element.kind === "speciesTrait" && element.spec) {
    const spec = element.spec;
    const saved = session.speciesTraitChoices?.[spec.traitName] || [];
    if (!forceEdit && saved.length >= spec.count) return drainChildren([]);
    const { options, contextNote } = contextualizeChoiceOptions(
      { ...spec, sourceLabel: profile.species + " · " + spec.traitName },
      profile, session, { currentSelection: saved }
    );
    openMultiChoiceDialog({
      title: profile.species + " — " + spec.traitName,
      label: spec.label,
      contextNote,
      count: spec.count,
      options,
      initial: saved,
      getCategory: opt => categoryForGrantKind(spec.kind, opt),
      getPreview: opt => previewForGrantKind(spec.kind, opt),
      trigger,
      onConfirm: picked => {
        update("Updated " + profile.species + " (" + spec.traitName + ")", next => {
          next.speciesTraitChoices = next.speciesTraitChoices || {};
          next.speciesTraitChoices[spec.traitName] = picked;
        });
        drainChildren([]);
      }
    });
    return;
  }

  if (element.kind === "backgroundChoice" && element.spec) {
    const spec = element.spec;
    const saved = session.backgroundChoices?.[spec.slotKey] || [];
    if (!forceEdit && saved.length >= spec.count) return drainChildren([]);
    const { options, contextNote } = contextualizeChoiceOptions(
      { ...spec, sourceLabel: profile.background || "Background" },
      profile, session, { currentSelection: saved }
    );
    openMultiChoiceDialog({
      title: (profile.background || "Background") + " — Proficiency",
      label: spec.label,
      contextNote,
      count: spec.count,
      options,
      initial: saved,
      getCategory: opt => categoryForGrantKind(spec.kind, opt),
      getPreview: opt => previewForGrantKind(spec.kind, opt),
      trigger,
      onConfirm: picked => {
        update("Updated " + (profile.background || "Background") + " proficiency", next => {
          next.backgroundChoices = next.backgroundChoices || {};
          next.backgroundChoices[spec.slotKey] = picked;
        });
        drainChildren([]);
      }
    });
    return;
  }

  if (element.kind === "skillSource" && element.spec) {
    const spec = element.spec;
    const { options, contextNote } = contextualizeChoiceOptions(spec, profile, session);
    openMultiChoiceDialog({
      title: spec.title || (spec.sourceLabel + " — Skills"),
      label: spec.label,
      contextNote,
      count: spec.count,
      options,
      initial: [],
      trigger,
      onConfirm: picked => {
        update("Added " + spec.sourceLabel + " skill" + (picked.length === 1 ? "" : "s") + ": " + picked.join(", "), next => {
          if (spec.speciesTraitName) {
            next.speciesTraitChoices = next.speciesTraitChoices || {};
            const prev = Array.isArray(next.speciesTraitChoices[spec.speciesTraitName]) ? next.speciesTraitChoices[spec.speciesTraitName] : [];
            next.speciesTraitChoices[spec.speciesTraitName] = [...new Set([...prev, ...picked])];
          } else {
            next.skillOverrides = next.skillOverrides || {};
            for (const sk of picked) {
              next.skillOverrides[sk] = Math.max(next.skillOverrides[sk] || 0, 1);
            }
          }
        });
        drainChildren([]);
      }
    });
    return;
  }

  if (element.kind === "skillExpertise") {
    const count = Math.max(1, Number(element.count) || 1);
    const { options, contextNote } = contextualizeChoiceOptions({ kind: "expertiseSkills", count }, profile, session);
    openMultiChoiceDialog({
      title: (profile.className || "Class") + " — Skill Expertise",
      label: "Choose " + count + " proficient skill" + (count === 1 ? "" : "s") + " for Expertise",
      contextNote,
      count,
      options,
      initial: [],
      trigger,
      onConfirm: picked => {
        update("Set Expertise: " + picked.join(", "), next => {
          next.skillOverrides = next.skillOverrides || {};
          for (const sk of picked) next.skillOverrides[sk] = 2;
        });
        drainChildren([]);
      }
    });
    return;
  }

  if (element.kind === "classOptions") {
    const count = Math.max(1, Number(element.count) || 1);
    const targetCls = element.className || profile.className;
    const meta = typeof classPoolMeta === "function" ? classPoolMeta(targetCls) : null;
    const poolName = element.poolName || meta?.poolName || "Customizations";
    const { options, contextNote } = contextualizeChoiceOptions({ kind: "classCustomizations", count, className: targetCls }, profile, session);
    openMultiChoiceDialog({
      title: targetCls + " — Choose " + poolName,
      label: "Select " + count + " " + poolName.toLowerCase(),
      contextNote,
      count,
      options,
      initial: [],
      getPreview: opt => previewForGrantKind("classCustomizations", opt),
      trigger,
      onConfirm: picked => {
        update("Added " + poolName + ": " + picked.join(", "), next => {
          next.classOptions = next.classOptions || [];
          for (const v of picked) {
            if (!next.classOptions.some(x => normalizeName(x) === normalizeName(v))) next.classOptions.push(v);
          }
        });
        // Recursively resolve choices for every newly added customization!
        drainChildren(picked.map(name => ({ kind: "customization", name })));
      }
    });
    return;
  }

  if (element.kind === "combatOptionAdd" && element.optionKey) {
    const keyToKind = {
      fightingStyles: "fightingStyles",
      fightingMasteries: "fightingMasteries",
      lightsaberForms: "lightsaberForms",
      maneuvers: "maneuvers"
    };
    const grantKind = keyToKind[element.optionKey];
    if (!grantKind) return drainChildren([]);
    const count = Math.max(1, Number(element.count) || 1);
    const { options, contextNote } = contextualizeChoiceOptions({ kind: grantKind, count }, profile, session);
    const labelMap = {
      fightingStyles: "Fighting Style",
      fightingMasteries: "Fighting Mastery",
      lightsaberForms: "Lightsaber Form",
      maneuvers: "Maneuver"
    };
    const lbl = labelMap[element.optionKey] || "Option";
    openMultiChoiceDialog({
      title: "Choose " + lbl + (count > 1 ? "s" : ""),
      label: "Select " + count + " " + lbl.toLowerCase() + (count > 1 ? "s" : ""),
      contextNote,
      count,
      options,
      initial: [],
      getCategory: opt => categoryForGrantKind(grantKind, opt),
      getPreview: opt => previewForGrantKind(grantKind, opt),
      trigger,
      onConfirm: picked => {
        update("Added " + lbl + ": " + picked.join(", "), next => {
          next[element.optionKey] = next[element.optionKey] || [];
          for (const v of picked) {
            if (!next[element.optionKey].some(x => normalizeName(x) === normalizeName(v))) next[element.optionKey].push(v);
          }
        });
        const childKind = element.optionKey === "fightingStyles" ? "fightingStyle"
          : element.optionKey === "fightingMasteries" ? "fightingMastery" : "";
        drainChildren(childKind ? picked.map(name => ({ kind: childKind, name })) : []);
      }
    });
    return;
  }

  drainChildren([]);
}

function promptCombatOptionGrant(optionName, trigger = null, onDone = null) {
  const isMastery = typeof fightingMasteryRule === "function" && Boolean(fightingMasteryRule(optionName));
  resolveRuleElementChoices({ kind: isMastery ? "fightingMastery" : "fightingStyle", name: optionName }, { trigger, onComplete: onDone, forceEdit: true });
}

function promptClassOptionGrant(optionName, trigger = null, onDone = null) {
  resolveRuleElementChoices({ kind: "customization", name: optionName }, { trigger, onComplete: onDone, forceEdit: true });
}

function archetypeUnlockLevel(className) {
  const cls = typeof classRecord === "function" ? classRecord(className) : null;
  if (!cls) return 3;
  const flavor = String(cls.archetypeFlavorName || "").toLowerCase();
  for (const [lvlStr, step] of Object.entries(cls.levelChanges || {})) {
    const feats = String(step?.Features || "").toLowerCase();
    if (feats.includes("archetype") || (flavor && feats.includes(flavor.replace(/s$/, "")))) {
      return Number(lvlStr) || 3;
    }
  }
  return 3;
}

function expectedFeatPowerCount(rule, profile = null) {
  const cs = rule?.choiceSpec || {};
  const mech = rule?.mechanics || {};
  const aw = cs.atWillCount || mech.atWillCount || 1;
  const lvl = Number(profile?.level || (typeof app !== "undefined" ? app?.character?.profile?.level : 1) || 1);
  if (Array.isArray(cs.leveledSlots)) {
    return aw + cs.leveledSlots.filter(le => lvl >= (le.minLevel || 1)).length;
  }
  if (Array.isArray(mech.leveledLevels)) {
    return aw + mech.leveledLevels.filter(le => lvl >= (le.minLevel || 1)).length;
  }
  return aw + (mech.leveledLevel ? 1 : 0);
}

function isFeatChoiceIncomplete(feat, rule, profile = null, session = null) {
  if (!rule) return false;
  const abOpts = typeof featAbilityOptions === "function" ? featAbilityOptions(rule) : [];
  if (abOpts.length > 1 && !feat?.abilityChoice) return true;
  const ck = featChoiceKind(rule);
  const isPower = ck === "forcePowers" || ck === "techPowers";
  if (isPower) {
    const expected = expectedFeatPowerCount(rule, profile);
    return !Array.isArray(feat?.powersChoice) || feat.powersChoice.filter(Boolean).length < expected;
  }
  if (ck && !feat?.choice) return true;
  if (rule.choiceSpec && (rule.choiceSpec.count || 1) <= 1 && !feat?.choice) return true;
  const extra = extraFeatChoiceSpec(rule, profile, session);
  if (extra) {
    if (extra.count > 1) {
      return !Array.isArray(feat?.multiChoice) || feat.multiChoice.filter(Boolean).length < extra.count;
    }
    return !(feat?.choice || feat?.powersChoice?.length || feat?.multiChoice?.length);
  }
  return false;
}

function expectedClassSkillCount(className) {
  const cls = typeof classRecord === "function" ? classRecord(className) : null;
  const sc = String(cls?.skillChoices || "").toLowerCase();
  if (/four|4/.test(sc)) return 4;
  if (/three|3/.test(sc)) return 3;
  if (/two|2/.test(sc)) return 2;
  return 2;
}

function expectedClassExpertiseCount(className, level) {
  const n = normalizeName(className);
  const lvl = Number(level) || 1;
  if (n === "operative") return lvl >= 6 ? 4 : 2;
  if (n === "scholar") return lvl >= 10 ? 4 : (lvl >= 3 ? 2 : 0);
  if (n === "scout") return lvl >= 14 ? 4 : (lvl >= 6 ? 2 : 0);
  return 0;
}

// ============================================================================
// 6. SMART SOURCE-ATTRIBUTED SKILL DEDUCTION (Maximum Bipartite Matching)
// Determines WHICH specific source(s) (Species fixed, Species choice trait,
// Background, Class) are missing skill proficiencies so we show ONLY what that
// source can grant and work from there — never dumping all 18 skills!
// ============================================================================

function deduceMissingSkillSources(profile, session) {
  if (!profile || !session || typeof effectiveTraining !== "function") return [];
  const tr = effectiveTraining(profile, session);
  const allSkills = Object.keys(skills).sort();
  const ownedSkills = allSkills.filter(sk => (tr[sk] || 0) >= 1);

  const sources = [];
  const sp = typeof speciesRecord === "function" ? speciesRecord(profile.species) : null;
  const bg = typeof backgroundRecord === "function" ? backgroundRecord(profile.background) : null;
  const cls = typeof classRecord === "function" ? classRecord(profile.className) : null;

  // 1. Fixed species skills (e.g., Togruta -> Survival, Mirialan -> Lore)
  for (const fixedSk of speciesFixedSkills(sp)) {
    sources.push({
      id: "skillSrc-species-fixed-" + normalizeName(fixedSk),
      sourceType: "speciesFixed",
      sourceLabel: sp.name,
      title: sp.name + " · " + fixedSk,
      label: "Fixed species proficiency",
      kind: "explicitSkills",
      options: [fixedSk],
      count: 1,
      fixed: true
    });
  }

  // 2. Species choice traits that grant skills
  for (const tSpec of speciesTraitChoiceSpecs(sp, session)) {
    if (!["skills", "intSkills", "mentalSkills", "explicitSkills"].includes(tSpec.kind)) continue;
    const pool = tSpec.kind === "explicitSkills" ? [...tSpec.options]
      : tSpec.kind === "intSkills" ? Object.entries(skills).filter(([, ab]) => ab === "Intelligence").map(([k]) => k).sort()
      : tSpec.kind === "mentalSkills" ? Object.entries(skills).filter(([, ab]) => ["Intelligence", "Wisdom", "Charisma"].includes(ab)).map(([k]) => k).sort()
      : [...allSkills];
    const saved = (session.speciesTraitChoices?.[tSpec.traitName] || []).filter(s => skills[s]);
    sources.push({
      id: "skillSrc-species-trait-" + normalizeName(tSpec.traitName),
      sourceType: "speciesTrait",
      speciesTraitName: tSpec.traitName,
      sourceLabel: sp.name + " · " + tSpec.traitName,
      title: sp.name + " · " + tSpec.traitName,
      label: tSpec.label,
      kind: tSpec.kind,
      options: pool,
      count: tSpec.count,
      explicitSaved: saved
    });
  }

  // 3. Background skills (SW5e backgrounds grant 2 from their 4-skill list; Custom grants any 2)
  if (profile.background) {
    const bgSkills = Array.isArray(bg?.skills) && bg.skills.length ? [...bg.skills] : [...allSkills];
    const isCustomBg = !(Array.isArray(bg?.skills) && bg.skills.length);
    sources.push({
      id: "skillSrc-background",
      sourceType: "background",
      sourceLabel: profile.background + " (Background)",
      title: profile.background + " · Background skills",
      label: isCustomBg ? "Choose 2 background skills" : ("Choose from " + profile.background + " skills"),
      kind: isCustomBg ? "skills" : "explicitSkills",
      options: bgSkills,
      count: 2
    });
  }

  // 4. Class skills (cls.skillChoicesList or Any for Operative)
  if (cls) {
    const clsCount = expectedClassSkillCount(cls.name);
    const list = Array.isArray(cls.skillChoicesList) ? cls.skillChoicesList : [];
    const isAny = !list.length || list.some(s => normalizeName(s) === "any");
    sources.push({
      id: "skillSrc-class",
      sourceType: "class",
      sourceLabel: cls.name + " (Class)",
      title: cls.name + " · Class skills",
      label: isAny ? ("Choose " + clsCount + " " + cls.name + " skills") : ("Choose from " + cls.name + " class skills"),
      kind: isAny ? "skills" : "explicitSkills",
      options: isAny ? [...allSkills] : [...list],
      count: clsCount
    });
  }

  // Expand sources into individual slots, sorted narrowest-pool-first so constrained sources claim matching skills first
  const slots = [];
  for (const src of sources) {
    for (let i = 0; i < src.count; i++) {
      slots.push({ src, poolSize: src.options.length, allowed: new Set(src.options.map(normalizeName)) });
    }
  }
  slots.sort((a, b) => a.poolSize - b.poolSize);

  // Maximum bipartite matching: match each slot to a distinct owned skill in its allowed pool
  const skillToSlot = new Map(); // normalized skill -> slot index
  const slotMatched = new Array(slots.length).fill(false);

  const tryMatch = (slotIdx, visitedSkills) => {
    for (const sk of ownedSkills) {
      const skNorm = normalizeName(sk);
      if (!slots[slotIdx].allowed.has(skNorm) || visitedSkills.has(skNorm)) continue;
      visitedSkills.add(skNorm);
      if (!skillToSlot.has(skNorm) || tryMatch(skillToSlot.get(skNorm), visitedSkills)) {
        skillToSlot.set(skNorm, slotIdx);
        slotMatched[slotIdx] = true;
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < slots.length; i++) {
    tryMatch(i, new Set());
  }

  // Any leftover owned skills (e.g., from SW5e duplicate-proficiency rule or feats) can cover unmatched non-fixed slots (broadest first)
  let leftoverOwned = ownedSkills.length - skillToSlot.size;
  if (leftoverOwned > 0) {
    for (let i = slots.length - 1; i >= 0 && leftoverOwned > 0; i--) {
      if (!slotMatched[i] && !slots[i].src.fixed) {
        slotMatched[i] = true;
        leftoverOwned--;
      }
    }
  }

  // Tally unsatisfied slots per source
  const missingBySrc = new Map();
  for (let i = 0; i < slots.length; i++) {
    if (!slotMatched[i]) {
      const src = slots[i].src;
      missingBySrc.set(src.id, (missingBySrc.get(src.id) || 0) + 1);
    }
  }

  const missing = [];
  for (const src of sources) {
    const missCount = missingBySrc.get(src.id) || 0;
    if (missCount <= 0) continue;
    const satisfied = src.count - missCount;
    missing.push({
      ...src,
      missingCount: missCount,
      satisfiedCount: satisfied,
      totalCount: src.count
    });
  }
  return missing;
}

function openSkillProficiencyEditorModal(trigger = null, onDone = null) {
  if (!app.character) return;
  const { dialog, form, body, cancel, confirm } = createModalFrame("All skill proficiencies & expertise", trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";

  const renderGrid = () => {
    body.replaceChildren();
    const { profile, session } = app.character;
    const tr = effectiveTraining(profile, session);
    const profCount = Object.values(tr).filter(r => r >= 1).length;
    const expCount = Object.values(tr).filter(r => r >= 2).length;
    const expMinSkills = expectedClassSkillCount(profile.className) + (profile.background ? 2 : 0);
    const expMinExp = expectedClassExpertiseCount(profile.className, profile.level);

    appendText(body, "p",
      "Proficient: " + profCount + " (expected at least " + expMinSkills + ")" +
      (expMinExp ? " · Expertise: " + expCount + " (expected at least " + expMinExp + ")" : "") +
      ". Manual override — tap any skill to cycle None → Proficient → Expertise."
    ).className = "muted";

    const list = appendText(body, "div", "");
    list.className = "skillGrid";
    for (const sk of Object.keys(skills).sort()) {
      const rank = tr[sk] || 0;
      const btn = appendText(list, "button", "");
      btn.type = "button";
      btn.className = "skillCell";
      const left = appendText(btn, "span", sk);
      if (rank === 2) appendText(left, "span", "Expertise").className = "skillTraining";
      else if (rank === 1) appendText(left, "span", "Proficient").className = "skillTraining";
      appendText(btn, "b", rank === 2 ? "2×" : rank === 1 ? "1×" : "—");
      btn.addEventListener("click", () => {
        const nextRank = (rank + 1) % 3;
        update("Set " + sk + " to " + (nextRank === 2 ? "Expertise" : nextRank === 1 ? "Proficient" : "Not proficient"), next => {
          next.skillOverrides = next.skillOverrides || {};
          next.skillOverrides[sk] = nextRank;
        });
        renderGrid();
      });
    }
  };

  renderGrid();
  form.addEventListener("submit", e => {
    e.preventDefault();
    dialog.close();
    if (onDone) onDone();
  });
  dialog.showModal();
}

// ============================================================================
// 7. UNIFIED CHARACTER COMPLETENESS AUDIT ACROSS ALL RULE ELEMENTS
// ============================================================================


// ============================================================================
// 6b. RECONCILE ALREADY-OWNED RULE ELEMENTS WITH UNLINKED CHOICE SLOTS
// Ensures that if a character already owns a Fighting Mastery, Fighting Style,
// Lightsaber Form, extra Saving Throw, or prefixed Customization (e.g. from
// customFeatures or manual binder additions), the granting Feat/Customization
// slot is automatically linked instead of falsely flagging as "not chosen".
// ============================================================================

function reconcileCharacterChoices(profile, session) {
  if (!profile || !session) return;

  // A. Extract prefixed Customizations & inline parenthetical choices from customFeatures
  //    e.g. "Skill’s Exploit: Aim (Stealth)" -> classOptions += "Skill's Exploit", classOptionChoices["Skill's Exploit"] = ["Stealth"]
  if (Array.isArray(profile.customFeatures) && typeof SW5E_CLASS_OPTIONS !== "undefined") {
    const clsNorm = normalizeName(profile.className || "");
    const clsOpts = SW5E_CLASS_OPTIONS.filter(o => normalizeName(o.className) === clsNorm);
    session.classOptions = Array.isArray(session.classOptions) ? session.classOptions : [];
    session.classOptionChoices = session.classOptionChoices || {};

    for (const cf of profile.customFeatures) {
      const rawName = String(cf?.name || "").trim();
      if (!rawName) continue;
      // Split prefix before ":" or "(" or " - "
      const basePart = rawName.split(/[:(–\-]/)[0].trim();
      const escRx = s => String(s || "").replace(/[.*+?^${}()|[\]\\]/g, ch => "\\" + ch);
      const matchedOpt = clsOpts.find(o => _choiceNorm(o.name) === _choiceNorm(rawName))
        || (basePart ? clsOpts.find(o => _choiceNorm(o.name) === _choiceNorm(basePart)) : null);
      if (!matchedOpt) {
        // Generic pool-header detection (e.g., "Force Empowered Casting" listing options in cf.content)
        const poolMetaRec = typeof classPoolMeta === "function" ? classPoolMeta(profile.className) : null;
        const poolNorm = _choiceNorm(poolMetaRec?.poolName || "").replace(/[-–—]+/g, " ").replace(/\s+/g, " ").replace(/s$/, "");
        const rawNorm = _choiceNorm(rawName).replace(/[-–—]+/g, " ").replace(/\s+/g, " ").replace(/s$/, "");
        if (poolNorm && (rawNorm === poolNorm || rawNorm.includes(poolNorm)) && typeof cf?.content === "string" && cf.content.trim()) {
          for (const opt of clsOpts) {
            const rxOpt = new RegExp("\\b" + escRx(opt.name) + "\\b", "i");
            if (rxOpt.test(cf.content) && !session.classOptions.some(x => normalizeName(x) === normalizeName(opt.name))) {
              session.classOptions.push(opt.name);
            }
          }
        }
        continue;
      }
      const alreadyCount = session.classOptions.filter(x => normalizeName(x) === normalizeName(matchedOpt.name)).length;
      if (matchedOpt.repeatable || alreadyCount === 0) {
        session.classOptions.push(matchedOpt.name);
      }
      const spec = classOptionGrantSpec(matchedOpt.name, profile, session);
      const existingChoices = Array.isArray(session.classOptionChoices[matchedOpt.name]) ? session.classOptionChoices[matchedOpt.name] : [];
      if (spec && existingChoices.length < spec.count) {
        const parenMatches = [...rawName.matchAll(/\(([^)]+)\)/g)].map(m => m[1].trim());
        const afterColon = rawName.includes(":") ? rawName.split(":").slice(1).join(":").trim() : "";
        const candidates = [...parenMatches, afterColon].filter(Boolean);
        if (candidates.length) {
          const allValid = contextualizeChoiceOptions(spec, profile, session).options;
          const picks = [...existingChoices];
          for (const cand of candidates) {
            for (const opt of allValid) {
              const rx = new RegExp("\\b" + escRx(opt) + "\\b", "i");
              if (rx.test(cand) && !picks.some(x => normalizeName(x) === normalizeName(opt))) {
                picks.push(opt);
              }
            }
          }
          if (picks.length) {
            session.classOptionChoices[matchedOpt.name] = picks.slice(0, spec.count);
          }
        }
      }
    }
  }

  // B. Track already-attributed Fighting Masteries, Fighting Styles, Lightsaber Forms
  const usedMasteries = new Set();
  const usedStyles = new Set();
  const usedForms = new Set();

  for (const feat of (session.feats || [])) {
    const rule = typeof featRule === "function" ? featRule(feat.name) : null;
    const ck = featChoiceKind(rule);
    if (!feat.choice) continue;
    if (ck === "fightingMastery") usedMasteries.add(normalizeName(feat.choice));
    if (ck === "fightingStyle") usedStyles.add(normalizeName(feat.choice));
    if (ck === "lightsaberForm") usedForms.add(normalizeName(feat.choice));
  }
  for (const [optName, picks] of Object.entries(session.classOptionChoices || {})) {
    const spec = classOptionGrantSpec(optName);
    if (!spec || !Array.isArray(picks)) continue;
    for (const p of picks) {
      if (spec.kind === "fightingMasteries") usedMasteries.add(normalizeName(p));
      if (spec.kind === "fightingStyles") usedStyles.add(normalizeName(p));
      if (spec.kind === "lightsaberForms") usedForms.add(normalizeName(p));
    }
  }

  // Reserve native class Fighting Style / Lightsaber Form slots so we don't steal them for feats/customizations
  const clsNorm = normalizeName(profile.className || "");
  const lvl = Number(profile.level) || 1;
  const nativeStyleSlots = (clsNorm === "fighter" || (clsNorm === "guardian" && lvl >= 2) || (clsNorm === "scout" && lvl >= 2)) ? 1 : 0;
  const nativeFormSlots = (clsNorm === "guardian" && lvl >= 3) ? 1 : 0;

  const availMasteries = (session.fightingMasteries || []).filter(m => !usedMasteries.has(normalizeName(m)));
  const availStyles = (session.fightingStyles || []).filter(s => !usedStyles.has(normalizeName(s)));
  const availForms = (session.lightsaberForms || []).filter(f => !usedForms.has(normalizeName(f)));

  // C. Reconcile Feats (Fighting Master, Fighting Stylist, Formfighting Dabbler, Resilient)
  const clsRec = typeof classRecord === "function" ? classRecord(profile.className) : null;
  const nativeSaves = new Set((clsRec?.savingThrows || []).map(normalizeName));
  const usedResilientSaves = new Set((session.feats || []).filter(f => (typeof featRule === "function" ? featRule(f.name) : null)?.choiceSpec?.kind === "savingThrow" && f.choice).map(f => normalizeName(f.choice)));
  const extraSaves = (profile.saveProficiencies || []).filter(ab => !nativeSaves.has(normalizeName(ab)) && !usedResilientSaves.has(normalizeName(ab)));

  for (const feat of (session.feats || [])) {
    const rule = typeof featRule === "function" ? featRule(feat.name) : null;
    if (!rule || feat.choice) continue;
    const ck = featChoiceKind(rule);
    if (ck === "fightingMastery" && availMasteries.length) {
      feat.choice = availMasteries.shift();
      usedMasteries.add(normalizeName(feat.choice));
    } else if (ck === "fightingStyle" && availStyles.length > nativeStyleSlots) {
      feat.choice = availStyles.pop();
      usedStyles.add(normalizeName(feat.choice));
    } else if (ck === "lightsaberForm" && availForms.length > nativeFormSlots) {
      feat.choice = availForms.pop();
      usedForms.add(normalizeName(feat.choice));
    } else if (rule.choiceSpec?.kind === "savingThrow" && extraSaves.length) {
      feat.choice = extraSaves.shift();
      usedResilientSaves.add(normalizeName(feat.choice));
    }
  }

  // D. Reconcile Customizations that grant Styles / Masteries / Forms
  session.classOptionChoices = session.classOptionChoices || {};
  for (const optName of (session.classOptions || [])) {
    const spec = classOptionGrantSpec(optName, profile, session);
    if (!spec) continue;
    const existing = session.classOptionChoices[optName] || [];
    if (existing.length >= spec.count) continue;
    if (spec.kind === "fightingStyles" && availStyles.length > nativeStyleSlots) {
      const pick = availStyles.pop();
      session.classOptionChoices[optName] = [pick];
      usedStyles.add(normalizeName(pick));
    } else if (spec.kind === "fightingMasteries" && availMasteries.length) {
      const pick = availMasteries.shift();
      session.classOptionChoices[optName] = [pick];
      usedMasteries.add(normalizeName(pick));
    } else if (spec.kind === "lightsaberForms" && availForms.length > nativeFormSlots) {
      const pick = availForms.pop();
      session.classOptionChoices[optName] = [pick];
      usedForms.add(normalizeName(pick));
    } else if (spec.kind === "forcePowers" && Array.isArray(session.powers) && session.powers.length) {
      const matching = session.powers.filter(pn => {
        const pRule = typeof powerRule === "function" ? powerRule(pn) : null;
        if (!pRule || normalizeName(pRule.type) !== "force") return false;
        if (spec.alignmentFilter && normalizeName(pRule.alignment) !== normalizeName(spec.alignmentFilter)) return false;
        return true;
      });
      if (matching.length) {
        session.classOptionChoices[optName] = matching.slice(0, spec.count);
      }
    } else if (spec.kind === "techPowerLevel1" && Array.isArray(session.powers) && session.powers.length) {
      const matching = session.powers.filter(pn => {
        const pRule = typeof powerRule === "function" ? powerRule(pn) : null;
        return pRule && normalizeName(pRule.type) === "tech" && Number(pRule.level) === 1;
      });
      if (matching.length) {
        session.classOptionChoices[optName] = matching.slice(0, spec.count);
      }
    }
  }

  // E. Infer style-granting Customization when a non-style class owns an unattributed Fighting Style
  const styleGrantOpt = typeof SW5E_CLASS_OPTIONS !== "undefined"
    ? SW5E_CLASS_OPTIONS.find(o => normalizeName(o.className) === clsNorm && (o.choiceSpec?.kind === "fightingStyles" || (o.effects || []).some(e => e.type === "combatOptionGrant" && e.kind === "fightingStyle")))
    : null;
  const inferredOptName = styleGrantOpt?.name || "";
  if (inferredOptName && availStyles.length > nativeStyleSlots) {
    const poolMeta = typeof classPoolMeta === "function" ? classPoolMeta(profile.className) : null;
    const step = typeof classLevelStep === "function" ? classLevelStep(profile) : {};
    const expectedPool = poolMeta?.levelCol ? parseNumericStat(step[poolMeta.levelCol]) : 0;
    const alreadyHas = (session.classOptions || []).some(x => normalizeName(x) === normalizeName(inferredOptName));
    if (!alreadyHas && expectedPool > 0 && (session.classOptions?.length || 0) < expectedPool) {
      const pick = availStyles.pop();
      session.classOptions = session.classOptions || [];
      session.classOptions.push(inferredOptName);
      session.classOptionChoices[inferredOptName] = [pick];
      usedStyles.add(normalizeName(pick));
    }
  }

  // F. Reconcile Archetype bespoke sub-feature choices (e.g., HK-51's "Horde Breaker" -> Hunter's Prey)
  const archRec = typeof archetypeRecord === "function" ? archetypeRecord(session.approach || profile.approach, profile.className) : null;
  if (archRec) {
    session.archetypeFeatureChoices = session.archetypeFeatureChoices || {};
    const archSpecs = archetypeFeatureChoiceSpecs(archRec, profile.level || 1);
    const cfNames = new Set((profile.customFeatures || []).map(cf => _choiceNorm(cf?.name)));
    const ownedForms = new Set((session.lightsaberForms || []).map(_choiceNorm));
    for (const spec of archSpecs) {
      const cur = session.archetypeFeatureChoices[spec.featureName] || [];
      if (cur.length >= spec.count) continue;
      const matched = [];
      for (const opt of spec.options) {
        if (cfNames.has(_choiceNorm(opt)) || (spec.grantsRuleElementKind === "lightsaberForm" && ownedForms.has(_choiceNorm(opt)))) {
          if (!matched.some(x => _choiceNorm(x) === _choiceNorm(opt))) matched.push(opt);
        }
      }
      if (matched.length) {
        session.archetypeFeatureChoices[spec.featureName] = matched.slice(0, spec.count);
      }
    }
  }
}

function _singularArchetypeFlavor(flavor) {
  const s = String(flavor || "Archetype").trim();
  if (/specialties$/i.test(s)) return s.replace(/specialties$/i, "Specialty");
  if (/approaches$/i.test(s)) return s.replace(/approaches$/i, "Approach");
  if (/foci$/i.test(s)) return s.replace(/foci$/i, "Focus");
  return s.replace(/s$/i, "");
}

function auditCharacterCompleteness(profile, session, opts = {}) {
  reconcileCharacterChoices(profile, session);
  const items = [];
  if (!profile || !session) return items;

  const lvl = profile.level || 1;
  const clsName = profile.className || "";
  const clsNorm = normalizeName(clsName);

  const clsEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  const auditClasses = clsEntries.length ? clsEntries : (clsName ? [{ name: clsName, levels: lvl, archetype: session.approach || "", archetypeFlavor: profile.archetypeFlavor || "Archetype", isStarting: true, archetypeRecord: typeof archetypeRecord === "function" ? archetypeRecord(session.approach || profile.approach, clsName) : null }] : []);
  const isMultiClass = auditClasses.length > 1;

  // 1 & 1b. Missing Archetypes & Archetype Bespoke Sub-Feature Choices (per class)
  for (const cEntry of auditClasses) {
    const archUnlock = archetypeUnlockLevel(cEntry.name);
    const sugForCls = opts.suggestedApproaches?.[cEntry.name] || (cEntry.isStarting ? opts.suggestedApproach : "") || "";
    if (cEntry.levels >= archUnlock && !cEntry.archetype) {
      items.push({
        id: cEntry.isStarting ? "archetype" : ("archetype-" + normalizeName(cEntry.name)),
        kind: "archetype",
        className: cEntry.name,
        archetypeFlavor: cEntry.archetypeFlavor || "Archetype",
        severity: "missing",
        title: (isMultiClass ? (cEntry.name + " · ") : "") + (cEntry.archetypeFlavor || "Archetype") + " not selected",
        detail: (() => { const sf = _singularArchetypeFlavor(cEntry.archetypeFlavor || "Archetype"); return cEntry.name + " chooses " + (/^[aeiou]/i.test(sf) ? "an " : "a ") + sf + " at Level " + archUnlock + "."; })() +
          (sugForCls ? " Detected from export: " + sugForCls + "." : ""),
        suggested: sugForCls
      });
    }
    const _archRec = cEntry.archetypeRecord || (cEntry.archetype && typeof archetypeRecord === "function" ? archetypeRecord(cEntry.archetype, cEntry.name) : null);
    if (_archRec) {
      for (const aSpec of archetypeFeatureChoiceSpecs(_archRec, cEntry.levels)) {
        const saved = session.archetypeFeatureChoices?.[aSpec.featureName] || [];
        if (saved.length < aSpec.count) {
          items.push({
            id: "archFeat-" + normalizeName(aSpec.featureName),
            kind: "archetypeFeature",
            severity: "choice",
            archName: _archRec.name,
            spec: aSpec,
            title: _archRec.name + " · " + aSpec.featureName,
            detail: "Choose " + (aSpec.count - saved.length) + " option" + (aSpec.count - saved.length === 1 ? "" : "s") + (aSpec.options.length > 6 ? (" from " + aSpec.options.length + " available choices.") : (" (" + aSpec.options.join(", ") + ")."))
          });
        }
      }
    }
  }

  // 2. Consular Force Affinity (Consular L3+)
  const consularLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Consular") : (clsNorm === "consular" ? lvl : 0);
  if (consularLvl >= 3 && !session.forceAffinity) {
    items.push({
      id: "forceAffinity",
      kind: "forceAffinity",
      severity: "choice",
      title: "Force Affinity not chosen",
      detail: "Choose your 3rd-level Consular Force Affinity (Ashla, Bendu, or Bogan).",
      options: ["Ashla", "Bendu", "Bogan"]
    });
  }

  // 2a. Guardian L1 Channel the Force starting choice
  const guardianLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Guardian") : (clsNorm === "guardian" ? lvl : 0);
  if (guardianLvl >= 1 && !session.channelForceChoice) {
    items.push({
      id: "channelForceChoice",
      kind: "channelForceChoice",
      severity: "choice",
      title: "Channel the Force effect not chosen",
      detail: "Choose your starting 1st-level Guardian Channel the Force effect (Cause Harm or Lend Aid).",
      options: ["Cause Harm", "Lend Aid"]
    });
  }

  // 2b. L20 Class Capstone Choices (per-class level 20)
  const capEntry = auditClasses.find(c => c.levels >= 20);
  const capNorm = capEntry ? normalizeName(capEntry.name) : "";
  if (capNorm === "berserker" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "Primal Champion ability not chosen",
      detail: "Choose Strength or Dexterity to increase by 2 (maximum 22) alongside +2 Constitution.",
      options: ["Strength", "Dexterity"]
    });
  }
  if (capNorm === "consular" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "One with the Force ability not chosen",
      detail: "Choose Wisdom or Charisma to increase by 4 (maximum 24).",
      options: ["Wisdom", "Charisma"]
    });
  }
  if (capNorm === "consular" && !session.signaturePower) {
    items.push({
      id: "signaturePower",
      kind: "signaturePower",
      severity: "choice",
      title: "Signature 3rd-level Force power not chosen",
      detail: "Choose one known 3rd-level Force power to cast once per short or long rest without expending Force Points."
    });
  }
  if (capNorm === "fighter" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "Master of Combat ability not chosen",
      detail: "Choose Strength or Dexterity to increase by 2 (maximum 22) alongside +2 Constitution.",
      options: ["Strength", "Dexterity"]
    });
  }
  if (capNorm === "monk" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "Perfect Self ability not chosen",
      detail: "Choose Wisdom or Charisma to increase by 2 (maximum 22) alongside +2 Dexterity.",
      options: ["Wisdom", "Charisma"]
    });
  }
  if (capNorm === "scout" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "Foe Slayer ability not chosen",
      detail: "Choose Strength or Dexterity to increase by 2 (maximum 22) alongside +2 Intelligence.",
      options: ["Strength", "Dexterity"]
    });
  }
  if (capNorm === "sentinel" && !session.classChoice) {
    items.push({
      id: "classCapstoneChoice",
      kind: "classCapstoneChoice",
      severity: "choice",
      title: "Center of the Force ability not chosen",
      detail: "Choose Wisdom or Charisma to increase by 2 (maximum 22) alongside +2 Dexterity.",
      options: ["Wisdom", "Charisma"]
    });
  }

  // 3. Missing Background Feat & Feat Budget Parity (under-assigned and over-assigned)
  const bgRec = typeof backgroundRecord === "function" ? backgroundRecord(profile.background) : null;
  const ownedFeatNames = new Set((session.feats || []).map(f => normalizeName(f.name)));
  const hasBgFeat = (session.feats || []).some(f =>
    normalizeName(f.source) === normalizeName(profile.background) || /background/i.test(String(f.source || ""))
  );
  const featBudget = typeof featBudgetStats === "function" ? featBudgetStats(profile, session) : null;
  let flaggedBgFeat = false;
  if (bgRec?.feats?.length && !hasBgFeat && (!featBudget || featBudget.counted < featBudget.expected)) {
    const bgFeats = bgRec.feats
      .map(x => typeof x === "string" ? x : x.name)
      .filter(n => n && !ownedFeatNames.has(normalizeName(n)));
    if (bgFeats.length) {
      flaggedBgFeat = true;
      items.push({
        id: "backgroundFeat",
        kind: "backgroundFeat",
        severity: "missing",
        title: "Background feat not selected",
        detail: profile.background + " grants a starting feat from its background list.",
        options: bgFeats
      });
    }
  }
  if (featBudget && featBudget.hasBudget) {
    const remainingFeats = featBudget.expected - featBudget.counted - (flaggedBgFeat ? 1 : 0);
    if (remainingFeats > 0) {
      items.push({
        id: "featBudgetUnder",
        kind: "featBudgetUnder",
        severity: "missing",
        remaining: remainingFeats,
        title: "Feats remaining (" + featBudget.counted + " / " + featBudget.expected + ")",
        detail: "You can select " + remainingFeats + " more feat" + (remainingFeats === 1 ? "" : "s") + " from your character's feat budget."
      });
    } else if (featBudget.counted > featBudget.expected) {
      const overBy = featBudget.counted - featBudget.expected;
      items.push({
        id: "featBudgetOver",
        kind: "featBudgetOver",
        severity: "choice",
        overCap: true,
        overBy,
        title: "Too many feats selected (" + featBudget.counted + " / " + featBudget.expected + ")",
        detail: "You have " + overBy + " more feat" + (overBy === 1 ? "" : "s") + " than your expected budget (background + advancement slots)."
      });
    }
  }

  // 4. Unresolved Feat Rule Elements (half-feat abilities, skills, tools, languages, powers, styles, masteries, etc.)
  (session.feats || []).forEach((feat, idx) => {
    const rule = typeof featRule === "function" ? featRule(feat.name) : null;
    if (!rule) return;
    const abOpts = typeof featAbilityOptions === "function" ? featAbilityOptions(rule) : [];
    const needsAbility = abOpts.length > 1 && !feat.abilityChoice;
    const ck = featChoiceKind(rule);
    const isPower = ck === "forcePowers" || ck === "techPowers";
    const needsPower = isPower && (!Array.isArray(feat.powersChoice) || feat.powersChoice.filter(Boolean).length < expectedFeatPowerCount(rule, profile));
    const needsMain = Boolean((ck && !isPower) || (rule.choiceSpec && (rule.choiceSpec.count || 1) <= 1)) && !feat.choice;
    const extra = extraFeatChoiceSpec(rule, profile, session);
    const needsExtra = Boolean(extra) && (extra.count > 1
      ? (!Array.isArray(feat.multiChoice) || feat.multiChoice.filter(Boolean).length < extra.count)
      : !(feat.choice || feat.powersChoice?.length || feat.multiChoice?.length));

    if (needsAbility || needsMain || needsPower || needsExtra) {
      const reasons = [];
      if (needsAbility) reasons.push("choose +1 " + (abOpts.length === 6 ? "to any ability score" : abOpts.join(" or ")));
      if (needsMain) {
        const lbl = rule.choiceSpec?.label || (typeof choiceLabelForKind === "function" ? choiceLabelForKind(ck) : "selection");
        reasons.push("choose " + lbl.toLowerCase());
      }
      if (needsPower) reasons.push("choose granted " + (ck === "forcePowers" ? "Force" : "Tech") + " powers");
      if (needsExtra) reasons.push("choose " + extra.label.toLowerCase());
      items.push({
        id: "feat-" + idx + "-" + feat.name,
        kind: "featChoice",
        severity: "choice",
        featIndex: idx,
        featName: feat.name,
        needsAbility,
        abOpts,
        needsMain: needsMain || needsExtra,
        needsPower,
        title: feat.name + " needs a selection",
        detail: reasons.map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(" · ") + "."
      });
    }
  });

  // 4b. Over-assigned & Invalid Feats (non-repeatable duplicates, maxCount exceeded, distinctChoice duplicates, over-assigned multiChoice, unmet prerequisites)
  {
    const featCounts = new Map();
    const featDistinctSeen = new Map();
    // Seed Weapon Focused distinct set from directly imported/stored weaponFocuses & flag duplicates inside session.weaponFocuses
    const directWfList = [
      ...(Array.isArray(session?.weaponFocuses) ? session.weaponFocuses : []),
      ...(Array.isArray(profile?.weaponFocuses) ? profile.weaponFocuses.filter(nm => !(Array.isArray(session?.weaponFocuses) && session.weaponFocuses.some(s => normalizeName(s) === normalizeName(nm)))) : [])
    ];
    if (directWfList.length) {
      const wfKey = normalizeName("Weapon Focused");
      if (!featDistinctSeen.has(wfKey)) featDistinctSeen.set(wfKey, new Set());
      const wfSeen = featDistinctSeen.get(wfKey);
      directWfList.forEach((rawNm, wIdx) => {
        const canon = (typeof weaponFocusRule === "function" ? weaponFocusRule(rawNm, { allowBare: true })?.name : "") || rawNm;
        const cKey = normalizeName(canon);
        if (!cKey) return;
        if (wfSeen.has(cKey)) {
          items.push({
            id: "weaponFocusDup-" + wIdx + "-" + canon,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featName: "Weapon Focused",
            title: "Duplicate Weapon Focus (" + canon + ")",
            detail: "You can't take a Weapon Focus option more than once. Remove the duplicate selection."
          });
        } else {
          wfSeen.add(cKey);
        }
      });
    }
    // Seed Weapon Supremacist distinct set from directly imported/stored weaponSupremacies & flag duplicates inside session.weaponSupremacies
    const directWsList = [
      ...(Array.isArray(session?.weaponSupremacies) ? session.weaponSupremacies : []),
      ...(Array.isArray(profile?.weaponSupremacies) ? profile.weaponSupremacies.filter(nm => !(Array.isArray(session?.weaponSupremacies) && session.weaponSupremacies.some(s => normalizeName(s) === normalizeName(nm)))) : [])
    ];
    if (directWsList.length) {
      const wsKey = normalizeName("Weapon Supremacist");
      if (!featDistinctSeen.has(wsKey)) featDistinctSeen.set(wsKey, new Set());
      const wsSeen = featDistinctSeen.get(wsKey);
      directWsList.forEach((rawNm, wIdx) => {
        const canon = (typeof weaponSupremacyRule === "function" ? weaponSupremacyRule(rawNm, { allowBare: true })?.name : "") || rawNm;
        const cKey = normalizeName(canon);
        if (!cKey) return;
        if (wsSeen.has(cKey)) {
          items.push({
            id: "weaponSupremacyDup-" + wIdx + "-" + canon,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featName: "Weapon Supremacist",
            title: "Duplicate Weapon Supremacy (" + canon + ")",
            detail: "You can't take a Weapon Supremacy option more than once. Remove the duplicate selection."
          });
        } else {
          wsSeen.add(cKey);
        }
      });
    }
    (session.feats || []).forEach((feat, idx) => {
      const rule = typeof featRule === "function" ? featRule(feat.name) : null;
      if (!rule) return;
      const key = normalizeName(rule.name);
      const count = (featCounts.get(key) || 0) + 1;
      featCounts.set(key, count);
      const maxAllowed = rule.repeatable ? (Number.isFinite(rule.maxCount) ? rule.maxCount : Infinity) : 1;
      if (count > maxAllowed) {
        items.push({
          id: "featOver-" + idx + "-" + rule.name,
          kind: "featOver",
          overCap: true,
          severity: "missing",
          featIndex: idx,
          featName: rule.name,
          title: rule.repeatable
            ? (rule.name + " exceeds limit (" + count + "/" + maxAllowed + ")")
            : ("Duplicate feat: " + rule.name),
          detail: rule.repeatable
            ? (rule.name + " can be taken at most " + maxAllowed + " time" + (maxAllowed === 1 ? "" : "s") + ". Remove the extra copy.")
            : (rule.name + " is not repeatable and is listed more than once. Remove the duplicate copy.")
        });
      }
      const distinctPick = feat.choice || (Array.isArray(feat.multiChoice) && feat.multiChoice.filter(Boolean).length === 1 ? feat.multiChoice.filter(Boolean)[0] : "");
      if (rule.distinctChoice && distinctPick) {
        const cKey = normalizeName(distinctPick);
        if (!featDistinctSeen.has(key)) featDistinctSeen.set(key, new Set());
        const seenChoices = featDistinctSeen.get(key);
        if (seenChoices.has(cKey)) {
          items.push({
            id: "featDupChoice-" + idx + "-" + rule.name,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featIndex: idx,
            featName: rule.name,
            title: rule.name + " duplicate choice (" + distinctPick + ")",
            detail: rule.name + " requires a different choice each time it is taken. Change or remove the duplicate selection."
          });
        } else {
          seenChoices.add(cKey);
        }
      }
      const extraSpecOver = typeof extraFeatChoiceSpec === "function" ? extraFeatChoiceSpec(rule, profile, session) : null;
      if (extraSpecOver && extraSpecOver.count >= 1 && Array.isArray(feat.multiChoice) && feat.multiChoice.filter(Boolean).length > extraSpecOver.count) {
        const curCnt = feat.multiChoice.filter(Boolean).length;
        items.push({
          id: "featMultiOver-" + idx + "-" + rule.name,
          kind: "featOver",
          overCap: true,
          severity: "missing",
          featIndex: idx,
          featName: rule.name,
          title: rule.name + " has too many selections (" + curCnt + "/" + extraSpecOver.count + ")",
          detail: rule.name + " allows " + extraSpecOver.count + " " + String(extraSpecOver.label || "selections").replace(/\s*\(choose\s+\d+\)/i, "").toLowerCase() + ". Remove the extra selection."
        });
      }
      if (typeof checkFeatPrerequisite === "function") {
        const pr = checkFeatPrerequisite(profile, session, rule);
        if (!pr.met) {
          items.push({
            id: "featPrereq-" + idx + "-" + rule.name,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featIndex: idx,
            featName: rule.name,
            title: rule.name + " prerequisite not met",
            detail: (pr.reason || ("Requires " + (rule.prerequisite || "unmet prerequisite"))) + "."
          });
        }
      }
      // Class Improvement & Multiclass Improvement per-option prerequisite + duplicate audit
      if (extraSpecOver?.kind === "classImprovement" && typeof SW5E_CLASS_IMPROVEMENTS !== "undefined" && typeof checkImprovementPrerequisite === "function") {
        const ciPicks = [...(Array.isArray(feat.multiChoice) ? feat.multiChoice : []), ...(feat.choice ? [feat.choice] : [])].filter(Boolean);
        for (const pk of ciPicks) {
          const ciRec = SW5E_CLASS_IMPROVEMENTS.find(x => normalizeName(x.label) === normalizeName(pk) || normalizeName(x.className) === normalizeName(pk));
          if (ciRec) {
            const cpr = checkImprovementPrerequisite(profile, session, ciRec);
            if (!cpr.met) {
              items.push({
                id: "featCiPrereq-" + idx + "-" + normalizeName(ciRec.className),
                kind: "featOver",
                overCap: true,
                severity: "missing",
                featIndex: idx,
                featName: rule.name,
                title: rule.name + " (" + ciRec.label + ") prerequisite not met",
                detail: (cpr.missing.join("; ") || ciRec.prerequisite) + "."
              });
            }
          }
        }
      }
      if (extraSpecOver?.kind === "multiclassImprovements" && typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined") {
        const mcPicks = (Array.isArray(feat.multiChoice) && feat.multiChoice.length ? feat.multiChoice : (feat.choice ? [feat.choice] : [])).filter(Boolean);
        if (!featDistinctSeen.has("multiclassimprovements")) featDistinctSeen.set("multiclassimprovements", new Set());
        const seenMc = featDistinctSeen.get("multiclassimprovements");
        for (const pk of mcPicks) {
          const nk = normalizeName(pk);
          if (seenMc.has(nk)) {
            items.push({
              id: "featMcDup-" + idx + "-" + nk,
              kind: "featOver",
              overCap: true,
              severity: "missing",
              featIndex: idx,
              featName: rule.name,
              title: rule.name + " duplicate selection (" + pk + ")",
              detail: "Each Multiclass Improvement option can only be selected once. Change or remove the duplicate selection."
            });
          } else {
            seenMc.add(nk);
          }
          const mcRec = SW5E_MULTICLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === nk);
          if (mcRec && typeof checkImprovementPrerequisite === "function") {
            const mpr = checkImprovementPrerequisite(profile, session, mcRec);
            if (!mpr.met) {
              items.push({
                id: "featMcPrereq-" + idx + "-" + nk,
                kind: "featOver",
                overCap: true,
                severity: "missing",
                featIndex: idx,
                featName: rule.name,
                title: rule.name + " (" + mcRec.className + ") prerequisite not met",
                detail: (mpr.missing.join("; ") || mcRec.prerequisite) + "."
              });
            }
          }
        }
      }
      // Splashclass Improvement per-option prerequisite audit
      if (typeof featChoiceKind === "function" && featChoiceKind(rule) === "class" && feat.choice && typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined" && typeof checkImprovementPrerequisite === "function") {
        const nk = normalizeName(feat.choice);
        const scRec = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === nk);
        if (scRec) {
          const spr = checkImprovementPrerequisite(profile, session, scRec);
          if (!spr.met) {
            items.push({
              id: "featScPrereq-" + idx + "-" + nk,
              kind: "featOver",
              overCap: true,
              severity: "missing",
              featIndex: idx,
              featName: rule.name,
              title: rule.name + " (" + scRec.className + ") prerequisite not met",
              detail: (spr.missing.join("; ") || scRec.prerequisite) + "."
            });
          }
        }
      }
    });
    // Standalone session.classImprovementEnabled / session.classImprovements[] & feat Class Improvement duplicate/prerequisite parity
    {
      const seenCiClasses = new Set();
      for (const feat of (session.feats || [])) {
        const fRule = typeof featRule === "function" ? featRule(feat.name) : null;
        if (fRule?.extraChoiceSpec?.kind !== "classImprovement") continue;
        const ciPicks = [...(Array.isArray(feat.multiChoice) ? feat.multiChoice : []), ...(feat.choice ? [feat.choice] : [])].filter(Boolean);
        for (const pk of ciPicks) {
          const ciRec = typeof SW5E_CLASS_IMPROVEMENTS !== "undefined"
            ? SW5E_CLASS_IMPROVEMENTS.find(x => normalizeName(x.label) === normalizeName(pk) || normalizeName(x.className) === normalizeName(pk))
            : null;
          if (ciRec) seenCiClasses.add(normalizeName(ciRec.className));
        }
      }
      const standaloneCi = [];
      if (session?.classImprovementEnabled && profile?.className) standaloneCi.push(profile.className);
      if (Array.isArray(session?.classImprovements)) {
        for (const c of session.classImprovements) {
          if (c && !standaloneCi.some(x => normalizeName(x) === normalizeName(c))) standaloneCi.push(c);
        }
      }
      const seenStandaloneCi = new Set();
      for (const rawCls of standaloneCi) {
        const ciRec = typeof classImprovementRule === "function" ? classImprovementRule(rawCls) : null;
        if (!ciRec) continue;
        const ck = normalizeName(ciRec.className);
        if (seenStandaloneCi.has(ck) || (seenCiClasses.has(ck) && Array.isArray(session?.classImprovements) && session.classImprovements.some(x => normalizeName(x) === ck) && !(session.classImprovementEnabled && normalizeName(profile?.className) === ck))) {
          items.push({
            id: "classImpDup-" + ck,
            kind: "classOptions",
            overCap: true,
            severity: "missing",
            poolName: "Class Improvement",
            title: "Duplicate Class Improvement (" + ciRec.label + ")",
            detail: ciRec.label + " is enabled more than once. Disable the duplicate in the Class tab."
          });
          continue;
        }
        seenStandaloneCi.add(ck);
        if (typeof checkImprovementPrerequisite === "function") {
          const cpr = checkImprovementPrerequisite(profile, session, ciRec);
          if (!cpr.met) {
            items.push({
              id: "classImpPrereq-" + ck,
              kind: "classOptions",
              overCap: true,
              severity: "missing",
              poolName: "Class Improvement",
              title: "Class Improvement (" + ciRec.label + ") prerequisite not met",
              detail: (cpr.missing.join("; ") || ciRec.prerequisite) + ". Disable it in the Class tab."
            });
          }
        }
      }
    }
    if (Array.isArray(session?.multiclassImprovements) && session.multiclassImprovements.length && typeof SW5E_MULTICLASS_IMPROVEMENTS !== "undefined") {
      const seenSessionMc = new Set();
      for (const pk of session.multiclassImprovements) {
        const nk = normalizeName(pk);
        if (!nk) continue;
        if (seenSessionMc.has(nk)) {
          items.push({
            id: "sessionMcDup-" + nk,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featName: "Multiclass Improvement",
            title: "Duplicate Multiclass Improvement (" + pk + ")",
            detail: "Remove the duplicate Multiclass Improvement entry."
          });
          continue;
        }
        seenSessionMc.add(nk);
        const mcRec = SW5E_MULTICLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === nk);
        if (mcRec && typeof checkImprovementPrerequisite === "function") {
          const mpr = checkImprovementPrerequisite(profile, session, mcRec);
          if (!mpr.met) {
            items.push({
              id: "sessionMcPrereq-" + nk,
              kind: "featOver",
              overCap: true,
              severity: "missing",
              featName: "Multiclass Improvement",
              title: mcRec.className + " Multiclass Improvement prerequisite not met",
              detail: (mpr.missing.join("; ") || mcRec.prerequisite) + "."
            });
          }
        }
      }
    }
    if (Array.isArray(session?.splashclassImprovements) && session.splashclassImprovements.length && typeof SW5E_SPLASHCLASS_IMPROVEMENTS !== "undefined") {
      const seenSessionSc = new Set();
      for (const pk of session.splashclassImprovements) {
        const nk = normalizeName(pk);
        if (!nk) continue;
        if (seenSessionSc.has(nk)) {
          items.push({
            id: "sessionScDup-" + nk,
            kind: "featOver",
            overCap: true,
            severity: "missing",
            featName: "Splashclass Improvement",
            title: "Duplicate Splashclass Improvement (" + pk + ")",
            detail: "Remove the duplicate Splashclass Improvement entry."
          });
          continue;
        }
        seenSessionSc.add(nk);
        const scRec = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x => normalizeName(x.className || x.name) === nk);
        if (scRec && typeof checkImprovementPrerequisite === "function") {
          const spr = checkImprovementPrerequisite(profile, session, scRec);
          if (!spr.met) {
            items.push({
              id: "sessionScPrereq-" + nk,
              kind: "featOver",
              overCap: true,
              severity: "missing",
              featName: "Splashclass Improvement",
              title: scRec.className + " Splashclass Improvement prerequisite not met",
              detail: (spr.missing.join("; ") || scRec.prerequisite) + "."
            });
          }
        }
      }
    }
  }

  // 5. Species Rule Element Choices (choiceSpec + non-skill trait choices; skill traits are smartly deduplicated in section 12b!)
  const sp = typeof speciesRecord === "function" ? speciesRecord(profile.species) : null;
  if (sp?.choiceSpec && !session.speciesChoice) {
    items.push({
      id: "speciesChoice",
      kind: "speciesChoice",
      severity: "choice",
      title: sp.name + " trait choice needed",
      detail: "Select " + sp.choiceSpec.label + ".",
      choiceSpec: sp.choiceSpec
    });
  }
  for (const tSpec of speciesTraitChoiceSpecs(sp, session)) {
    // Skill-granting species traits are handled via smart bipartite attribution in Section 12b
    // so characters who already selected their species skill on export are not double-prompted!
    if (["skills", "intSkills", "mentalSkills", "explicitSkills"].includes(tSpec.kind)) continue;
    const saved = session.speciesTraitChoices?.[tSpec.traitName] || [];
    if (saved.length < tSpec.count) {
      items.push({
        id: "speciesTrait-" + tSpec.traitName,
        kind: "speciesTrait",
        severity: "choice",
        spec: tSpec,
        title: sp.name + " · " + tSpec.traitName,
        detail: "Choose " + tSpec.label.toLowerCase() + "."
      });
    }
  }

  // 5b. Background Tool & Language Choices (scoped strictly to what the background grants!)
  for (const bSpec of backgroundChoiceSpecs(bgRec)) {
    const saved = session.backgroundChoices?.[bSpec.slotKey] || [];
    if (saved.length >= bSpec.count) continue;
    // Don't nag if the character export already supplied custom proficiencies/languages for this category
    if (bSpec.category === "language" && (profile.customLanguages?.length || 0) >= bSpec.count) continue;
    if (bSpec.category === "tool" && (profile.customProficiencies?.length || 0) >= bSpec.count) continue;
    items.push({
      id: "bgChoice-" + bSpec.slotKey,
      kind: "backgroundChoice",
      severity: "choice",
      spec: bSpec,
      title: bSpec.label,
      detail: (profile.background || "Background") + " grants " + bSpec.count + " " + bSpec.category + (bSpec.count === 1 ? "" : "s") + " from its background options."
    });
  }

  // 6. Unresolved, Invalid, Duplicate, or Unmet-Prerequisite Customization Rule Elements
  const _seenClassOpts = new Set();
  for (const optName of session.classOptions || []) {
    const normO = normalizeName(optName);
    const optRule = typeof classOptionRule === "function" ? classOptionRule(optName) : null;
    if (_seenClassOpts.has(normO)) {
      if (!optRule?.repeatable) {
        items.push({
          id: "classOptDup-" + normO,
          kind: "classOptions",
          overCap: true,
          severity: "choice",
          poolName: optRule?.poolName || "Customizations",
          title: "Duplicate customization: " + (optRule?.name || optName),
          detail: "Remove the duplicate entry in the Class tab."
        });
      }
      continue;
    }
    _seenClassOpts.add(normO);
    if (optRule && typeof checkClassOptionPrerequisite === "function") {
      const prereq = checkClassOptionPrerequisite(profile, session, optRule);
      if (!prereq.met) {
        items.push({
          id: "classOptPrereq-" + normO,
          kind: "classOptions",
          overCap: true,
          severity: "choice",
          poolName: optRule.poolName || "Customizations",
          title: optRule.name + " — Prerequisite not met",
          detail: (prereq.reason || "Prerequisite not met") + ". Remove or replace in the Class tab."
        });
      }
    }
    const spec = classOptionGrantSpec(optName, profile, session);
    if (!spec) continue;
    const saved = Array.isArray(session.classOptionChoices?.[optRule?.name || optName])
      ? session.classOptionChoices[optRule?.name || optName].filter(Boolean)
      : (Array.isArray(session.classOptionChoices?.[optName]) ? session.classOptionChoices[optName].filter(Boolean) : []);
    const satisfied = saved.length >= spec.count ||
      (spec.kind === "damageTypes" && (profile.dewback?.length || 0) >= spec.count);
    if (!satisfied) {
      items.push({
        id: "classOptChoice-" + optName,
        kind: "classOptionGrant",
        severity: "choice",
        optionName: optName,
        title: optName + " needs a selection",
        detail: "Choose " + spec.label.toLowerCase() + "."
      });
    } else if (saved.length > spec.count) {
      items.push({
        id: "classOptChoiceOver-" + optName,
        kind: "classOptionGrant",
        overCap: true,
        severity: "choice",
        optionName: optName,
        title: optName + " — Too many selections (" + saved.length + " of " + spec.count + ")",
        detail: "Remove " + (saved.length - spec.count) + " selection" + ((saved.length - spec.count) === 1 ? "" : "s") + " for " + optName + "."
      });
    }
    if (Number.isFinite(spec.maxSkills)) {
      const pickedSkills = saved.filter(v => typeof skills !== "undefined" && Object.keys(skills).some(sk => normalizeName(sk) === normalizeName(v)));
      if (pickedSkills.length > spec.maxSkills) {
        items.push({
          id: "classOptInvalid-" + optName,
          kind: "classOptionGrant",
          severity: "choice",
          optionName: optName,
          title: optName + " — Invalid selection",
          detail: "Select at most " + spec.maxSkills + " skill" + (spec.maxSkills === 1 ? "" : "s") + " (" + spec.label.toLowerCase() + ")."
        });
      }
    }
    if (saved.length > 1) {
      const uniq = new Set(saved.map(normalizeName));
      if (uniq.size < saved.length) {
        items.push({
          id: "classOptChoiceDup-" + optName,
          kind: "classOptionGrant",
          overCap: true,
          severity: "choice",
          optionName: optName,
          title: optName + " — Duplicate selection",
          detail: "Choose distinct options for " + optName + "."
        });
      }
    }
    if (spec.kind === "proficientSkills" && saved.length && typeof effectiveTraining === "function") {
      const trMap = effectiveTraining(profile, session);
      const nonProf = saved.filter(sk => {
        const canonSk = Object.keys(skills || {}).find(k => normalizeName(k) === normalizeName(sk));
        return canonSk && (trMap[canonSk] || 0) < 1;
      });
      if (nonProf.length) {
        items.push({
          id: "classOptNonProf-" + optName,
          kind: "classOptionGrant",
          severity: "choice",
          optionName: optName,
          title: optName + " — Non-proficient skill selected",
          detail: "Requires proficiency in " + nonProf.join(", ") + ". Choose a proficient skill for " + optName + "."
        });
      }
    }
  }

  // 7. Unresolved Fighting Style / Fighting Mastery Rule Elements (Formfighting -> Forms, Superiority -> Maneuvers, Disruption -> Casting Type)
  for (const styleName of [...(session.fightingStyles || []), ...(session.fightingMasteries || [])]) {
    const spec = combatOptionGrantSpec(styleName, profile, session);
    if (!spec) continue;
    if (spec.storage === "combatOptionChoices") {
      const saved = Array.isArray(session.combatOptionChoices?.[styleName]) ? session.combatOptionChoices[styleName] : [];
      if (saved.length < spec.count) {
        items.push({
          id: "combatOptGrant-" + styleName,
          kind: "combatOptionGrant",
          severity: "choice",
          optionName: styleName,
          title: styleName + " — " + spec.label,
          detail: "Choose Force-casting or Tech-casting for " + styleName + "."
        });
      }
      continue;
    }
    if (spec.kind !== "maneuvers" && spec.kind !== "lightsaberForms") {
      const ownedCount = Array.isArray(session[spec.kind]) ? session[spec.kind].length : 0;
      if (ownedCount < spec.count) {
        items.push({
          id: "combatOptGrant-" + styleName,
          kind: "combatOptionGrant",
          severity: "choice",
          optionName: styleName,
          title: styleName + " grants " + spec.label.toLowerCase(),
          detail: "Currently " + ownedCount + " of " + spec.count + " selected."
        });
      }
    }
    if (spec.followUpChoice) {
      const fSaved = Array.isArray(session.combatOptionChoices?.[spec.followUpChoice.storageKey]) ? session.combatOptionChoices[spec.followUpChoice.storageKey] : [];
      if (fSaved.length < spec.followUpChoice.count) {
        items.push({
          id: "combatOptGrant-" + styleName + "-followup",
          kind: "combatOptionGrant",
          severity: "choice",
          optionName: styleName,
          title: styleName + " — " + spec.followUpChoice.label,
          detail: "Choose 1 known maneuver to use with a free d4 (" + (profile.proficiency || 2) + "/long rest)."
        });
      }
    }
  }

  // 8. Missing or Over-Assigned Customizations (per class: Ideals, Instincts, Discoveries, Exploits, Vows, etc.)
  const splashFecCount = typeof resolveCombatEffects === "function"
    ? (resolveCombatEffects(profile, session).combatOptionGrants || [])
        .filter(cg => cg.kind === "forceEmpoweredCasting" && Number(cg.count) > 0)
        .reduce((s, cg) => s + Number(cg.count), 0)
    : 0;
  if (splashFecCount > 0 && consularLvl === 0) {
    const ownedFec = (typeof ownedClassOptions === "function" ? ownedClassOptions(profile, session) : [])
      .filter(o => o.poolName === "Force-Empowered Castings").length;
    if (ownedFec < splashFecCount) {
      items.push({
        id: "splashForceEmpoweredCasting",
        kind: "classOptions",
        className: "Consular",
        severity: "missing",
        title: "Force-Empowered Castings (" + ownedFec + " of " + splashFecCount + ")",
        detail: "Choose " + (splashFecCount - ownedFec) + " Force-Empowered Casting option" + ((splashFecCount - ownedFec) === 1 ? "" : "s") + " from Consular Splashclass Improvement.",
        current: ownedFec,
        expected: splashFecCount,
        remaining: splashFecCount - ownedFec,
        poolName: "Force-Empowered Castings"
      });
    } else if (ownedFec > splashFecCount) {
      const excess = ownedFec - splashFecCount;
      items.push({
        id: "splashForceEmpoweredCastingOver",
        kind: "classOptions",
        className: "Consular",
        overCap: true,
        severity: "choice",
        title: "Force-Empowered Castings (" + ownedFec + " of " + splashFecCount + " · " + excess + " over cap)",
        detail: "Remove " + excess + " Force-Empowered Casting option" + (excess === 1 ? "" : "s") + " to match your allowed pool.",
        current: ownedFec,
        expected: splashFecCount,
        remaining: 0,
        poolName: "Force-Empowered Castings"
      });
    }
  }
  for (const cEntry of auditClasses) {
    const poolMeta = typeof classPoolMeta === "function" ? classPoolMeta(cEntry.name) : null;
    if (!poolMeta?.levelCol) continue;
    const cNorm = normalizeName(cEntry.name);
    const step = typeof classLevelStepFor === "function" ? classLevelStepFor(profile, cEntry.name) : (typeof classLevelStep === "function" ? classLevelStep(profile) : {});
    const expectedPool = parseNumericStat(step[poolMeta.levelCol]);
    const currentPool = (Array.isArray(session.classOptions) ? session.classOptions : []).filter(n => {
      const r = typeof classOptionRule === "function" ? classOptionRule(n) : null;
      if (!r) return cEntry.isStarting;
      return normalizeName(r.className) === cNorm;
    }).length;
    if (expectedPool > 0 && currentPool < expectedPool) {
      const remaining = expectedPool - currentPool;
      items.push({
        id: cEntry.isStarting ? "classOptions" : ("classOptions-" + cNorm),
        kind: "classOptions",
        className: cEntry.name,
        severity: "missing",
        title: poolMeta.poolName + " (" + currentPool + " of " + expectedPool + ")",
        detail: "Choose " + remaining + " more eligible " + poolMeta.poolName.toLowerCase() + " for Level " + cEntry.levels + " " + cEntry.name + ".",
        current: currentPool,
        expected: expectedPool,
        remaining,
        poolName: poolMeta.poolName
      });
    } else if (currentPool > expectedPool) {
      const excess = currentPool - expectedPool;
      items.push({
        id: cEntry.isStarting ? "classOptionsOver" : ("classOptionsOver-" + cNorm),
        kind: "classOptions",
        className: cEntry.name,
        overCap: true,
        severity: "choice",
        title: poolMeta.poolName + " (" + currentPool + " of " + expectedPool + " · " + excess + " over cap)",
        detail: "Remove " + excess + " " + poolMeta.poolName.toLowerCase() + " in the Class tab to match your Level " + cEntry.levels + " " + cEntry.name + " cap.",
        current: currentPool,
        expected: expectedPool,
        remaining: 0,
        poolName: poolMeta.poolName
      });
    }
  }

  // 9. Missing or Over-Assigned Fighting Styles (Fighter L1+, Guardian L2+, Scout L2+, Fighting Stylist, or classOption grants)
  {
    const ownedStylesCount = Array.isArray(session.fightingStyles) ? session.fightingStyles.length : 0;
    const baseStyleSlots = auditClasses.reduce((sum, cEntry) => {
      const cn = normalizeName(cEntry.name);
      if (cn === "fighter" && cEntry.levels >= 1) return sum + 1;
      if ((cn === "guardian" || cn === "scout") && cEntry.levels >= 2) return sum + 1;
      return sum;
    }, 0);
    const styleGrants = typeof resolveCombatEffects === "function"
      ? (resolveCombatEffects(profile, session).combatOptionGrants || []).filter(cg => cg.kind === "fightingStyle")
      : [];
    const expectedStyles = baseStyleSlots + styleGrants.reduce((sum, cg) => sum + (Number(cg.count) > 0 ? Number(cg.count) : 1), 0);
    const styleOptSet = new Set(
      typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS.filter(o => o.choiceSpec?.kind === "fightingStyles").map(o => normalizeName(o.name)) : []
    );
    const pendingStyleChoices = items.filter(it =>
      (it.kind === "featChoice" && featChoiceKind(featRule(it.featName)) === "fightingStyle" && it.needsMain) ||
      (it.kind === "classOptionChoice" && styleOptSet.has(normalizeName(it.optionName || "")))
    ).length;
    if (expectedStyles > 0 && ownedStylesCount + pendingStyleChoices < expectedStyles) {
      const need = expectedStyles - ownedStylesCount - pendingStyleChoices;
      items.push({
        id: "fightingStyles",
        kind: "combatOption",
        optionKey: "fightingStyles",
        count: need,
        severity: "missing",
        title: expectedStyles > 1 ? ("Fighting Styles (" + ownedStylesCount + " of " + expectedStyles + ")") : "Fighting Style not selected",
        detail: expectedStyles > 1
          ? ("Choose " + need + " more Fighting Style" + (need === 1 ? "" : "s") + " granted by your class, feats, or class options.")
          : (clsName + " gains a Fighting Style by Level " + lvl + ".")
      });
    } else if (ownedStylesCount > expectedStyles) {
      const excess = ownedStylesCount - expectedStyles;
      items.push({
        id: "fightingStylesOver",
        kind: "combatOption",
        optionKey: "fightingStyles",
        overCap: true,
        count: excess,
        severity: "choice",
        title: "Fighting Styles (" + ownedStylesCount + " of " + expectedStyles + " known · " + excess + " over cap)",
        detail: "Remove " + excess + " Fighting Style" + (excess === 1 ? "" : "s") + " to match your allowed styles."
      });
    }
  }

  // 9b. Missing or Over-Assigned Fighting Masteries (Fighting Master feat, Mastery Strategist, or combatOptionGrant)
  {
    const ownedMasteriesCount = Array.isArray(session.fightingMasteries) ? session.fightingMasteries.length : 0;
    const masteryGrants = typeof resolveCombatEffects === "function"
      ? (resolveCombatEffects(profile, session).combatOptionGrants || []).filter(cg => cg.kind === "fightingMastery")
      : [];
    const expectedMasteries = masteryGrants.reduce((sum, cg) => sum + (Number(cg.count) > 0 ? Number(cg.count) : 1), 0);
    const pendingMasteryChoices = items.filter(it =>
      (it.kind === "featChoice" && featChoiceKind(featRule(it.featName)) === "fightingMastery") ||
      (it.kind === "classOptionChoice" && normalizeName(it.optionName || "") === "mastery strategist")
    ).length;
    if (expectedMasteries > 0 && ownedMasteriesCount + pendingMasteryChoices < expectedMasteries) {
      const need = expectedMasteries - ownedMasteriesCount - pendingMasteryChoices;
      items.push({
        id: "fightingMasteries",
        kind: "combatOption",
        optionKey: "fightingMasteries",
        count: need,
        severity: "missing",
        title: expectedMasteries > 1 ? ("Fighting Masteries (" + ownedMasteriesCount + " of " + expectedMasteries + ")") : "Fighting Mastery not selected",
        detail: "Choose " + need + " Fighting Master" + (need === 1 ? "y" : "ies") + " granted by your feats or class options."
      });
    } else if (ownedMasteriesCount > expectedMasteries) {
      const excess = ownedMasteriesCount - expectedMasteries;
      items.push({
        id: "fightingMasteriesOver",
        kind: "combatOption",
        optionKey: "fightingMasteries",
        overCap: true,
        count: excess,
        severity: "choice",
        title: "Fighting Masteries (" + ownedMasteriesCount + " of " + expectedMasteries + " known · " + excess + " over cap)",
        detail: "Remove " + excess + " Fighting Master" + (excess === 1 ? "y" : "ies") + " to match your allowed masteries."
      });
    }
  }

  // 10. Missing or Over-Assigned Lightsaber Forms (Guardian L3+, archetype/class-option grants, Formfighting Style/Mastery/Dabbler)
  {
    const totalForms = typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS.length : 20;
    const ownedFormsCount = typeof ownedCombatOptions === "function"
      ? ownedCombatOptions(profile, session).forms.length
      : (session.lightsaberForms?.length || 0);
    const allFormGrants = typeof resolveCombatEffects === "function"
      ? (resolveCombatEffects(profile, session).combatOptionGrants || []).filter(cg => cg.kind === "lightsaberForm")
      : [];
    const hasGuardianForm = guardianLvl >= 3;
    const hasFormStyle = (session.fightingStyles || []).some(s => normalizeName(s) === "formfighting style");
    const hasFormMastery = (session.fightingMasteries || []).some(m => normalizeName(m) === "formfighting mastery");
    const hasLightweaponStrat = typeof resolveDefenseEffects === "function" && (resolveDefenseEffects(profile, session).combatTraits || []).some(ct => ct.kind === "unlocksLightsaberForms");
    let extraFormGrants = 0;
    let sawLightweaponStratGrant = false;
    const upgradeFormGrants = [];
    for (const cg of allFormGrants) {
      const srcNorm = normalizeName(cg.source?.name || "");
      if (srcNorm === "formfighting style" || srcNorm === "formfighting mastery") continue;
      if (Array.isArray(cg.upgradeThresholds)) { upgradeFormGrants.push(cg); continue; }
      if (srcNorm === "lightweapon strategist") sawLightweaponStratGrant = true;
      if (hasGuardianForm && cg.source?.kind === "archetype" && cg.option) continue;
      extraFormGrants += Number(cg.count) > 0 ? Number(cg.count) : 1;
    }
    let expectedForms = (hasGuardianForm ? 1 : 0) + extraFormGrants + (hasLightweaponStrat && !sawLightweaponStratGrant ? 1 : 0) + (hasFormStyle ? 3 : 0);
    if (hasFormMastery) expectedForms += (expectedForms >= 3 ? 7 : 3);
    for (const cg of upgradeFormGrants) {
      let add = Number(cg.count) || 1;
      let setRemaining = false;
      for (const th of cg.upgradeThresholds) {
        if (expectedForms >= Number(th.ownedAtLeast || 0)) {
          if (th.count === "remaining") setRemaining = true;
          else add = Number(th.count);
        }
      }
      expectedForms = setRemaining ? totalForms : (expectedForms + add);
    }
    expectedForms = Math.min(totalForms, expectedForms);
    if (expectedForms > 0 && ownedFormsCount < expectedForms) {
      const need = expectedForms - ownedFormsCount;
      items.push({
        id: "lightsaberForms",
        kind: "combatOption",
        optionKey: "lightsaberForms",
        count: need,
        severity: "missing",
        title: expectedForms > 1 ? ("Lightsaber Forms (" + ownedFormsCount + " of " + expectedForms + ")") : "Lightsaber Form not selected",
        detail: "Choose " + need + " Lightsaber Form" + (need === 1 ? "" : "s") + " granted by your class, archetype, or features."
      });
    } else if (ownedFormsCount > expectedForms) {
      const excess = ownedFormsCount - expectedForms;
      items.push({
        id: "lightsaberFormsOver",
        kind: "combatOption",
        optionKey: "lightsaberForms",
        overCap: true,
        count: excess,
        severity: "choice",
        title: "Lightsaber Forms (" + ownedFormsCount + " of " + expectedForms + " known · " + excess + " over cap)",
        detail: "Remove " + excess + " Lightsaber Form" + (excess === 1 ? "" : "s") + " to match your allowed forms."
      });
    }
  }

  // 11. Missing or Excess Maneuvers
  if (typeof superiorityStats === "function") {
    const sup = superiorityStats(profile, session);
    const ownedMan = Array.isArray(session.maneuvers) ? session.maneuvers.length : 0;
    if (sup.knownCap > 0 && ownedMan < sup.knownCap) {
      items.push({
        id: "maneuvers",
        kind: "combatOption",
        optionKey: "maneuvers",
        count: sup.knownCap - ownedMan,
        severity: "missing",
        title: "Maneuvers (" + ownedMan + " of " + sup.knownCap + " known)",
        detail: "Choose " + (sup.knownCap - ownedMan) + " more maneuver" + (sup.knownCap - ownedMan === 1 ? "" : "s") + "."
      });
    } else if (sup.knownCap > 0 && ownedMan > sup.knownCap) {
      const excess = ownedMan - sup.knownCap;
      items.push({
        id: "maneuversOver",
        kind: "combatOption",
        optionKey: "maneuvers",
        count: excess,
        overCap: true,
        severity: "choice",
        title: "Maneuvers (" + ownedMan + " of " + sup.knownCap + " known · " + excess + " over cap)",
        detail: "Remove " + excess + " maneuver" + (excess === 1 ? "" : "s") + " to match your Level " + lvl + " cap."
      });
    }
  }

  // 12. Missing or Excess Force / Tech Powers (excludes bonus powers that don't count against powers known)
  if (typeof castingStats === "function") {
    const cs = castingStats(profile, session);
    if (cs.forceKnownCap > 0) {
      const forceUsed = cs.forceKnownUsed || 0;
      const byClsNote = Array.isArray(cs.forceKnownByClass) && cs.forceKnownByClass.length > 1
        ? (" (" + cs.forceKnownByClass.map(c => c.className + " " + c.levels + ": " + c.knownCap).join(", ") + ")")
        : "";
      const bonusNote = cs.forceBonusKnown > 0 ? " (" + cs.forceBonusKnown + " bonus power" + (cs.forceBonusKnown === 1 ? "" : "s") + " not counted)" : "";
      if (forceUsed < cs.forceKnownCap) {
        const diff = cs.forceKnownCap - forceUsed;
        items.push({
          id: "forcePowers",
          kind: "powers",
          powerType: "Force",
          severity: "missing",
          title: "Force Powers (" + forceUsed + " of " + cs.forceKnownCap + " known)",
          detail: "Add " + diff + " more Force power" + (diff === 1 ? "" : "s") + " for Level " + lvl + byClsNote + bonusNote + "."
        });
      } else if (forceUsed > cs.forceKnownCap) {
        const excess = forceUsed - cs.forceKnownCap;
        items.push({
          id: "forcePowersOver",
          kind: "powers",
          powerType: "Force",
          overCap: true,
          severity: "choice",
          title: "Force Powers (" + forceUsed + " of " + cs.forceKnownCap + " known · " + excess + " over cap)",
          detail: "Remove " + excess + " Force power" + (excess === 1 ? "" : "s") + " to match your Level " + lvl + " cap" + byClsNote + bonusNote + "."
        });
      }
    }
    if (cs.techKnownCap > 0) {
      const techUsed = cs.techKnownUsed || 0;
      const byClsNote = Array.isArray(cs.techKnownByClass) && cs.techKnownByClass.length > 1
        ? (" (" + cs.techKnownByClass.map(c => c.className + " " + c.levels + ": " + c.knownCap).join(", ") + ")")
        : "";
      const bonusNote = cs.techBonusKnown > 0 ? " (" + cs.techBonusKnown + " bonus power" + (cs.techBonusKnown === 1 ? "" : "s") + " not counted)" : "";
      if (techUsed < cs.techKnownCap) {
        const diff = cs.techKnownCap - techUsed;
        items.push({
          id: "techPowers",
          kind: "powers",
          powerType: "Tech",
          severity: "missing",
          title: "Tech Powers (" + techUsed + " of " + cs.techKnownCap + " known)",
          detail: "Add " + diff + " more Tech power" + (diff === 1 ? "" : "s") + " for Level " + lvl + byClsNote + bonusNote + "."
        });
      } else if (techUsed > cs.techKnownCap) {
        const excess = techUsed - cs.techKnownCap;
        items.push({
          id: "techPowersOver",
          kind: "powers",
          powerType: "Tech",
          overCap: true,
          severity: "choice",
          title: "Tech Powers (" + techUsed + " of " + cs.techKnownCap + " known · " + excess + " over cap)",
          detail: "Remove " + excess + " Tech power" + (excess === 1 ? "" : "s") + " to match your Level " + lvl + " cap" + byClsNote + bonusNote + "."
        });
      }
    }
  }

  // 12b. Smart Source-Attributed Skill Proficiencies & Contextualized Expertise
  if (typeof effectiveTraining === "function") {
    const missingSources = deduceMissingSkillSources(profile, session);
    for (const src of missingSources) {
      if (src.fixed) {
        items.push({
          id: src.id,
          kind: "fixedSkill",
          severity: "missing",
          skillName: src.options[0],
          sourceLabel: src.sourceLabel,
          title: src.title + " proficiency missing",
          detail: src.sourceLabel + " automatically grants proficiency in " + src.options[0] + "."
        });
      } else {
        const previewOpts = contextualizeChoiceOptions(
          { kind: src.kind, options: src.options, count: src.missingCount, sourceLabel: src.sourceLabel },
          profile, session
        ).options;
        const previewText = previewOpts.length <= 7 ? (" Options: " + previewOpts.join(", ") + ".") : "";
        items.push({
          id: src.id,
          kind: "skillSource",
          severity: src.sourceType === "speciesTrait" ? "choice" : "missing",
          spec: {
            kind: src.kind,
            options: src.options,
            count: src.missingCount,
            sourceLabel: src.sourceLabel,
            speciesTraitName: src.speciesTraitName || "",
            title: src.title,
            label: "Choose " + src.missingCount + " skill" + (src.missingCount === 1 ? "" : "s") + " (" + src.sourceLabel + ")"
          },
          title: src.title + " (" + src.satisfiedCount + " of " + src.totalCount + ")",
          detail: "Choose " + src.missingCount + " more skill" + (src.missingCount === 1 ? "" : "s") + " from " + src.sourceLabel + "." + previewText
        });
      }
    }

    const tr = effectiveTraining(profile, session);
    const expCount = Object.values(tr).filter(r => r >= 2).length;
    const expSources = auditClasses
      .map(c => ({ name: c.name, count: expectedClassExpertiseCount(c.name, c.levels) }))
      .filter(x => x.count > 0);
    const minExp = expSources.reduce((s, x) => s + x.count, 0);
    if (minExp > 0 && expCount < minExp) {
      const remainingExp = minExp - expCount;
      const expLabel = expSources.map(x => x.name).join(" / ") || clsName;
      items.push({
        id: "missingExpertise",
        kind: "skillExpertise",
        severity: "missing",
        count: remainingExp,
        title: expLabel + " · Skill expertise (" + expCount + " of " + minExp + ")",
        detail: "Choose " + remainingExp + " of your proficient skill" + (remainingExp === 1 ? "" : "s") + " to upgrade to Expertise."
      });
    }
  }

  // 13. Unrecognized equipment from export
  for (const w of profile.warnings || []) {
    items.push({
      id: "warn-" + w,
      kind: "warning",
      severity: "info",
      title: "Unrecognized export item",
      detail: w
    });
  }

  return items;
}

function openArchetypePickerModal(trigger, onDone = null, targetClassName = null) {
  if (!app.character) return;
  const { profile, session } = app.character;
  const clsEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  const targetEntry = (targetClassName ? clsEntries.find(c => normalizeName(c.name) === normalizeName(targetClassName)) : clsEntries[0]) || null;
  const clsName = targetEntry?.name || targetClassName || profile.className;
  const isPrimary = !targetClassName || normalizeName(clsName) === normalizeName(profile.className);
  const flavor = targetEntry?.archetypeFlavor || (isPrimary ? profile.archetypeFlavor : "") || (typeof classRecord === "function" ? classRecord(clsName)?.archetypeFlavorName : "") || "Archetype";
  const allForClass = (typeof SW5E_ARCHETYPES !== "undefined" ? SW5E_ARCHETYPES : [])
    .filter(a => normalizeName(a.className) === normalizeName(clsName))
    .sort((a, b) => a.name.localeCompare(b.name));

  const { dialog, form, body, confirm } = createModalFrame("Choose " + _singularArchetypeFlavor(flavor), trigger, { size: "reading" });
  confirm.textContent = "Save archetype";
  let selected = targetEntry?.archetype || (isPrimary ? (session.approach || "") : (session.approaches?.[clsName] || ""));

  const picker = createSearchablePicker({
    options: allForClass.map(a => a.name),
    value: selected,
    placeholder: "Search " + clsName + " archetypes",
    onSelect: val => {
      selected = val;
      confirm.disabled = !selected;
    },
    getPreview: name => {
      const rec = allForClass.find(a => a.name === name);
      if (!rec) return "";
      return (rec.features || []).length
        ? "**Features:** " + rec.features.join(" · ")
        : "Official " + clsName + " archetype.";
    }
  });
  body.append(picker.element);

  if (selected) {
    const clearRow = appendText(body, "div", "");
    clearRow.className = "row";
    const clearBtn = appendText(clearRow, "button", "Clear selected archetype");
    clearBtn.type = "button";
    clearBtn.addEventListener("click", () => {
      dialog.close();
      update("Cleared " + clsName + " archetype", (next, prof) => {
        if (!next.approaches || typeof next.approaches !== "object") next.approaches = {};
        next.approaches[clsName] = "";
        if (isPrimary) next.approach = "";
        const pe = (prof.classes || []).find(c => normalizeName(c.name) === normalizeName(clsName));
        if (pe) pe.archetype = "";
      });
      if (onDone) onDone();
    });
  }

  confirm.disabled = !selected;
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!selected) return;
    dialog.close();
    update("Selected " + clsName + " archetype · " + selected, (next, prof) => {
      if (!next.approaches || typeof next.approaches !== "object") next.approaches = {};
      next.approaches[clsName] = selected;
      if (isPrimary) next.approach = selected;
      const pe = (prof.classes || []).find(c => normalizeName(c.name) === normalizeName(clsName));
      if (pe) pe.archetype = selected;
    });
    if (onDone) onDone();
  });

  dialog.showModal();
  picker.search.focus();
}

function openCharacterAuditModal(trigger = null) {
  if (!app.character) return;
  const { dialog, form, body, cancel, confirm } = createModalFrame("Character setup & missing features", trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";

  const renderAuditBody = () => {
    body.replaceChildren();
    if (!app.character) return;
    const { profile, session } = app.character;
    const items = auditCharacterCompleteness(profile, session);
    const actionable = items.filter(i => i.severity !== "info");

    const intro = appendText(body, "p", actionable.length
      ? profile.name + " has " + actionable.length + " item" + (actionable.length === 1 ? "" : "s") + " you can populate or specify now. Everything updates live on your sheet."
      : "All detected rule elements and choices for " + profile.name + " are complete.");
    intro.className = "muted";

    if (!items.length) {
      const doneCard = appendText(body, "div", "");
      doneCard.className = "auditCard is-complete";
      appendText(doneCard, "strong", "Character sheet is ready");
      appendText(doneCard, "p", "No missing features, archetypes, or unresolved choices were detected.").className = "muted";
      return;
    }

    const scores = typeof effectiveScores === "function" ? effectiveScores(profile, session) : {};

    for (const item of items) {
      const isActionable = item.severity === "choice" || item.severity === "missing";
      const card = appendText(body, "div", "");
      card.className = "auditCard " + (isActionable ? "is-actionable" : "is-info");

      const head = appendText(card, "div", "");
      head.className = "auditCardHead";
      appendText(head, "strong", item.title);
      const countMatch = String(item.detail || "").match(/\b(?:Choose|Add)\s+(\d+)\s+more\b/i);
      const badgeLabel = !isActionable
        ? "Note"
        : countMatch
          ? (countMatch[1] + " remaining")
          : "Needs choice";
      const badge = appendText(head, "span", badgeLabel);
      badge.className = "auditBadge " + (isActionable ? "is-actionable" : "is-info");

      appendText(card, "p", item.detail).className = "muted";

      if (item.kind === "featChoice") {
        if (item.needsAbility && !item.needsMain && !item.needsPower) {
          const chips = appendText(card, "div", "");
          chips.className = "directChips";
          for (const ab of item.abOpts) {
            const cur = scores[ab];
            const atCap = Number.isFinite(cur) && cur >= 20;
            const lbl = Number.isFinite(cur) ? `+1 ${ab} (${cur} → ${Math.min(20, cur + 1)})` : `+1 ${ab}`;
            const btn = appendText(chips, "button", lbl);
            btn.type = "button";
            if (atCap) btn.title = ab + " is already at 20";
            btn.addEventListener("click", () => {
              update("Set " + item.featName + " ability to +1 " + ab, next => {
                if (next.feats[item.featIndex]) next.feats[item.featIndex].abilityChoice = ab;
              });
              renderAuditBody();
            });
          }
        } else {
          const row = appendText(card, "div", "");
          row.className = "row wrap";
          const btn = appendText(row, "button", "Choose options for " + item.featName);
          btn.type = "button";
          btn.addEventListener("click", ev => {
            resolveRuleElementChoices(
              { kind: "feat", name: item.featName, instanceIndex: item.featIndex },
              { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
            );
          });
        }
      } else if (item.kind === "featOver") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const rmBtn = appendText(row, "button", "Remove " + item.featName);
        rmBtn.type = "button";
        rmBtn.className = "danger";
        rmBtn.addEventListener("click", () => {
          update("Removed " + item.featName, next => {
            if (Array.isArray(next.feats) && item.featIndex >= 0 && item.featIndex < next.feats.length) {
              next.feats.splice(item.featIndex, 1);
            }
          });
          renderAuditBody();
        });
      } else if (item.kind === "featBudgetUnder" || item.kind === "featBudgetOver") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", item.kind === "featBudgetUnder" ? "Open Feat library" : "Review Feats tab");
        btn.type = "button";
        btn.addEventListener("click", () => {
          const dlg = getElementById("auditDialog");
          if (dlg?.open) dlg.close();
          if (item.kind === "featBudgetUnder") {
            const openBtn = getElementById("openFeatCatalog");
            if (openBtn) openBtn.click();
          } else {
            const bd = getElementById("binderDetails");
            if (bd) bd.open = true;
            const tab = getElementById("featTab");
            if (tab) { tab.click(); tab.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
          }
        });
      } else if (item.kind === "backgroundFeat") {
        const chips = appendText(card, "div", "");
        chips.className = "directChips";
        for (const fName of item.options) {
          const btn = appendText(chips, "button", fName);
          btn.type = "button";
          btn.addEventListener("click", ev => {
            resolveRuleElementChoices(
              { kind: "feat", name: fName, source: profile.background || "Background" },
              { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
            );
          });
        }
      } else if (item.kind === "forceAffinity") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose Force Affinity");
        btn.type = "button";
        btn.addEventListener("click", ev => openForceAffinityPicker(ev.currentTarget, renderAuditBody));
      } else if (item.kind === "channelForceChoice") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose Channel the Force");
        btn.type = "button";
        btn.addEventListener("click", ev => openChannelForcePicker(ev.currentTarget, renderAuditBody));
      } else if (item.kind === "classCapstoneChoice") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose Ability");
        btn.type = "button";
        btn.addEventListener("click", ev => openClassCapstonePicker(ev.currentTarget, renderAuditBody));
      } else if (item.kind === "signaturePower") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose Signature Power");
        btn.type = "button";
        btn.addEventListener("click", ev => openSignaturePowerPicker(ev.currentTarget, renderAuditBody));
      } else if (item.kind === "speciesChoice") {
        const opts = typeof choiceSpecOptions === "function" ? choiceSpecOptions(item.choiceSpec, profile, session) : (Array.isArray(item.choiceSpec?.options) ? item.choiceSpec.options : []);
        const chips = appendText(card, "div", "");
        chips.className = "directChips";
        for (const opt of opts) {
          const btn = appendText(chips, "button", opt);
          btn.type = "button";
          btn.addEventListener("click", () => {
            update("Updated " + profile.species + " choice", next => { next.speciesChoice = opt; });
            renderAuditBody();
          });
        }
      } else if (item.kind === "archetypeFeature") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose " + item.spec.featureName);
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "archetypeFeature", name: item.spec.featureName, spec: item.spec, archName: item.archName },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "speciesTrait") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose " + item.spec.traitName);
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "speciesTrait", name: item.spec.traitName, spec: item.spec },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "backgroundChoice") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose " + item.spec.category);
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "backgroundChoice", name: item.spec.slotKey, spec: item.spec },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "classOptionGrant") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose for " + item.optionName);
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "customization", name: item.optionName },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "combatOptionGrant") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose for " + item.optionName);
        btn.type = "button";
        btn.addEventListener("click", ev => {
          const isMastery = typeof fightingMasteryRule === "function" && Boolean(fightingMasteryRule(item.optionName));
          resolveRuleElementChoices(
            { kind: isMastery ? "fightingMastery" : "fightingStyle", name: item.optionName },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "archetype") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose " + _singularArchetypeFlavor(item.archetypeFlavor || profile.archetypeFlavor || "Archetype"));
        btn.type = "button";
        btn.addEventListener("click", ev => openArchetypePickerModal(ev.currentTarget, renderAuditBody, item.className || null));
      } else if (item.kind === "classOptions") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        if (item.overCap) {
          const mgBtn = appendText(row, "button", "Manage " + item.poolName);
          mgBtn.type = "button";
          mgBtn.addEventListener("click", () => {
            dialog.close();
            const bd = getElementById("binderDetails");
            if (bd && !bd.open) { bd.open = true; bd.dispatchEvent(new Event("toggle")); }
            getElementById("classTab")?.click();
            bd?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        } else {
          const pickBtn = appendText(row, "button", "Choose " + item.poolName);
          pickBtn.type = "button";
          pickBtn.addEventListener("click", ev => {
            resolveRuleElementChoices(
              { kind: "classOptions", name: item.poolName, count: item.remaining || 1, poolName: item.poolName, className: item.className || profile.className },
              { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
            );
          });
        }
      } else if (item.kind === "combatOption") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const def = typeof combatOptionDefs !== "undefined" ? combatOptionDefs.find(d => d.key === item.optionKey) : null;
        if (item.overCap && def?.tabId) {
          const btn = appendText(row, "button", "Manage " + (def.label || "options"));
          btn.type = "button";
          btn.addEventListener("click", () => {
            dialog.close();
            const bd = getElementById("binderDetails");
            if (bd && !bd.open) { bd.open = true; bd.dispatchEvent(new Event("toggle")); }
            getElementById(def.tabId)?.click();
            bd?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        } else {
          const btn = appendText(row, "button", "Choose " + (def?.label || "options"));
          btn.type = "button";
          btn.addEventListener("click", ev => {
            resolveRuleElementChoices(
              { kind: "combatOptionAdd", name: item.optionKey, optionKey: item.optionKey, count: item.count || 1 },
              { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
            );
          });
        }
      } else if (item.kind === "fixedSkill") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Add " + item.skillName);
        btn.type = "button";
        btn.addEventListener("click", () => {
          update("Added " + item.sourceLabel + " skill: " + item.skillName, next => {
            next.skillOverrides = next.skillOverrides || {};
            next.skillOverrides[item.skillName] = Math.max(next.skillOverrides[item.skillName] || 0, 1);
          });
          renderAuditBody();
        });
      } else if (item.kind === "skillSource") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose " + item.spec.sourceLabel + " skill" + (item.spec.count === 1 ? "" : "s"));
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "skillSource", name: item.id, spec: item.spec },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "skillExpertise") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        const btn = appendText(row, "button", "Choose Expertise skill" + (item.count === 1 ? "" : "s"));
        btn.type = "button";
        btn.addEventListener("click", ev => {
          resolveRuleElementChoices(
            { kind: "skillExpertise", name: "expertise", count: item.count },
            { trigger: ev.currentTarget, onComplete: renderAuditBody, forceEdit: true }
          );
        });
      } else if (item.kind === "powers") {
        const row = appendText(card, "div", "");
        row.className = "row wrap";
        if (item.overCap) {
          const btn = appendText(row, "button", "Manage " + item.powerType + " powers");
          btn.type = "button";
          btn.addEventListener("click", () => {
            dialog.close();
            const bd = getElementById("binderDetails");
            if (bd && !bd.open) { bd.open = true; bd.dispatchEvent(new Event("toggle")); }
            const tabId = item.powerType === "Force" ? "forcePowerTab" : "techPowerTab";
            getElementById(tabId)?.click();
            bd?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        } else {
          const btn = appendText(row, "button", "Open " + item.powerType + " power library");
          btn.type = "button";
          btn.addEventListener("click", () => {
            dialog.close();
            const btnId = item.powerType === "Force" ? "openForcePowerCatalog" : "openTechPowerCatalog";
            getElementById(btnId)?.click();
          });
        }
      }
    }
  };

  renderAuditBody();
  form.addEventListener("submit", event => {
    event.preventDefault();
    dialog.close();
  });
  dialog.showModal();
}

function forceAffinitySummary(opt, profile, session) {
  const scores = typeof effectiveScores === "function" ? effectiveScores(profile, session) : { Wisdom: 10, Charisma: 10 };
  const wis = typeof modifier === "function" ? modifier(scores.Wisdom) : 0;
  const cha = typeof modifier === "function" ? modifier(scores.Charisma) : 0;
  if (opt === "Ashla") {
    return "When you cast a light side power, your or the target's hit point maximum and current HP increase by the power's level for 1 minute (1 active at a time).";
  }
  if (opt === "Bendu") {
    return `Add both your Wisdom (${signed(wis)}) and Charisma (${signed(cha)}) modifiers to your maximum Force Points, instead of just one.`;
  }
  if (opt === "Bogan") {
    return "Your dark side power damage rolls gain a Minimum Roll Threshold (Ch. 7): 2 for d4/d6, 3 for d8, 4 for d10, and 5 for d12.";
  }
  return "Choose your 3rd-level Consular Force Affinity (Ashla, Bendu, or Bogan).";
}

function openForceAffinityPicker(trigger, onComplete) {
  if (!app.character) return;
  const { profile, session } = app.character;
  const cur = session.forceAffinity || "";
  const { dialog, form, body, cancel, confirm } = createModalFrame("Force Affinity", trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";
  body.className = "auditModalList";
  appendText(body, "p", "Consular 3rd-level feature — choose one aspect of the Force.").className = "muted";
  for (const opt of ["Ashla", "Bendu", "Bogan"]) {
    const card = appendText(body, "div", "");
    card.className = "auditCard" + (cur === opt ? " is-actionable" : "");
    const head = appendText(card, "div", "");
    head.className = "auditCardHead";
    appendText(head, "strong", opt);
    if (cur === opt) {
      const b = appendText(head, "span", "Selected");
      b.className = "auditBadge is-actionable";
    }
    appendText(card, "p", forceAffinitySummary(opt, profile, session)).className = "muted";
    const row = appendText(card, "div", "");
    row.className = "row wrap";
    const btn = appendText(row, "button", cur === opt ? "Keep " + opt : "Choose " + opt);
    btn.type = "button";
    btn.addEventListener("click", () => {
      update("Force Affinity: " + opt, next => { next.forceAffinity = opt; });
      dialog.close();
      if (typeof onComplete === "function") onComplete();
    });
  }
  form.addEventListener("submit", ev => { ev.preventDefault(); dialog.close(); });
  dialog.showModal();
}

function openChannelForcePicker(trigger, onComplete) {
  if (!app.character) return;
  const { session } = app.character;
  const cur = session.channelForceChoice || "";
  const { dialog, form, body, cancel, confirm } = createModalFrame("Channel the Force", trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";
  body.className = "auditModalList";
  appendText(body, "p", "Guardian 1st-level feature — choose your starting Channel the Force effect (Cause Harm or Lend Aid).").className = "muted";
  const choices = [
    ["Cause Harm", "Action · 60 ft · Constitution save for Guardian level + Charisma modifier necrotic damage (half on pass)."],
    ["Lend Aid", "Bonus action · Touch · Heal Guardian level + Wisdom modifier HP, or neutralize one poison or disease."]
  ];
  for (const [opt, desc] of choices) {
    const card = appendText(body, "div", "");
    card.className = "auditCard" + (cur === opt ? " is-actionable" : "");
    const head = appendText(card, "div", "");
    head.className = "auditCardHead";
    appendText(head, "strong", opt);
    if (cur === opt) {
      const b = appendText(head, "span", "Selected");
      b.className = "auditBadge is-actionable";
    }
    appendText(card, "p", desc).className = "muted";
    const row = appendText(card, "div", "");
    row.className = "row wrap";
    const btn = appendText(row, "button", cur === opt ? "Keep " + opt : "Choose " + opt);
    btn.type = "button";
    btn.addEventListener("click", () => {
      update("Channel the Force: " + opt, next => { next.channelForceChoice = opt; });
      dialog.close();
      if (typeof onComplete === "function") onComplete();
    });
  }
  form.addEventListener("submit", ev => { ev.preventDefault(); dialog.close(); });
  dialog.showModal();
}

function openClassCapstonePicker(trigger, onComplete) {
  if (!app.character) return;
  const { profile, session } = app.character;
  const clsNorm = normalizeName(profile.className);
  const isBer = clsNorm === "berserker";
  const isFig = clsNorm === "fighter";
  const isMonk = clsNorm === "monk";
  const isScout = clsNorm === "scout";
  const isSent = clsNorm === "sentinel";
  const title = isBer ? "Primal Champion" : isFig ? "Master of Combat" : isMonk ? "Perfect Self" : isScout ? "Foe Slayer" : isSent ? "Center of the Force" : "One with the Force";
  const opts = (isBer || isFig || isScout) ? ["Strength", "Dexterity"] : ["Wisdom", "Charisma"];
  const delta = (isBer || isFig || isMonk || isScout || isSent) ? 2 : 4;
  const cur = session.classChoice || "";
  const { dialog, form, body, cancel, confirm } = createModalFrame(title, trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";
  body.className = "auditModalList";
  appendText(body, "p", isBer
    ? "Berserker 20th-level feature — choose Strength or Dexterity (+2 score and maximum, alongside +2 Constitution)."
    : isFig
      ? "Fighter 20th-level feature — choose Strength or Dexterity (+2 score and maximum, alongside +2 Constitution)."
      : isMonk
        ? "Monk 20th-level feature — choose Wisdom or Charisma (+2 score and maximum, alongside +2 Dexterity)."
        : isScout
          ? "Scout 20th-level feature — choose Strength or Dexterity (+2 score and maximum, alongside +2 Intelligence)."
          : isSent
            ? "Sentinel 20th-level feature — choose Wisdom or Charisma (+2 score and maximum, alongside +2 Dexterity)."
            : "Consular 20th-level feature — choose Wisdom or Charisma (+4 score and maximum).").className = "muted";
  for (const opt of opts) {
    const card = appendText(body, "div", "");
    card.className = "auditCard" + (cur === opt ? " is-actionable" : "");
    const head = appendText(card, "div", "");
    head.className = "auditCardHead";
    appendText(head, "strong", opt + " (+" + delta + ")");
    if (cur === opt) {
      const b = appendText(head, "span", "Selected");
      b.className = "auditBadge is-actionable";
    }
    const row = appendText(card, "div", "");
    row.className = "row wrap";
    const btn = appendText(row, "button", cur === opt ? "Keep " + opt : "Choose " + opt);
    btn.type = "button";
    btn.addEventListener("click", () => {
      update(title + ": " + opt, next => { next.classChoice = opt; });
      dialog.close();
      if (typeof onComplete === "function") onComplete();
    });
  }
  form.addEventListener("submit", ev => { ev.preventDefault(); dialog.close(); });
  dialog.showModal();
}

function openSignaturePowerPicker(trigger, onComplete) {
  if (!app.character) return;
  const { profile, session } = app.character;
  const cur = session.signaturePower || "";
  const known3rd = typeof knownPowerRecords === "function"
    ? knownPowerRecords(profile, "Force", session).filter(p => p.level === 3)
    : [];
  const { dialog, form, body, cancel, confirm } = createModalFrame("Signature 3rd-Level Force Power", trigger, { size: "reading" });
  cancel.hidden = true;
  confirm.textContent = "Done";
  body.className = "auditModalList";
  appendText(body, "p", "One with the Force (Consular 20th level) — choose one known 3rd-level Force power to cast once at 3rd level without expending Force Points (recharges on a short or long rest).").className = "muted";
  if (!known3rd.length) {
    appendText(body, "p", "No 3rd-level Force powers are currently in your known powers list. Add a 3rd-level Force power in the Powers tab first.").className = "muted";
  }
  for (const p of known3rd) {
    const card = appendText(body, "div", "");
    card.className = "auditCard" + (normalizeName(cur) === normalizeName(p.name) ? " is-actionable" : "");
    const head = appendText(card, "div", "");
    head.className = "auditCardHead";
    appendText(head, "strong", p.name);
    if (normalizeName(cur) === normalizeName(p.name)) {
      const b = appendText(head, "span", "Selected");
      b.className = "auditBadge is-actionable";
    }
    appendText(card, "p", (p.alignment || "Universal") + " · " + (p.castingPeriodText || "") + " · " + (p.range || "")).className = "muted";
    const row = appendText(card, "div", "");
    row.className = "row wrap";
    const btn = appendText(row, "button", normalizeName(cur) === normalizeName(p.name) ? "Keep " + p.name : "Choose " + p.name);
    btn.type = "button";
    btn.addEventListener("click", () => {
      update("Signature Power: " + p.name, next => { next.signaturePower = p.name; });
      dialog.close();
      if (typeof onComplete === "function") onComplete();
    });
  }
  form.addEventListener("submit", ev => { ev.preventDefault(); dialog.close(); });
  dialog.showModal();
}
