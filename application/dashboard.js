function showCharacterInfo() {
  const {profile, session} = app.character;
  const scores = effectiveScores(profile, session);
  const speciesHp = speciesHpBonus(profile, session);
  const featHp = featHpBonus(profile, session);
  const sp = speciesRecord(profile.species);
  const maxHp = hitPointMaximum(profile, session);

  const speciesTraitsMd = (sp?.traits || [])
    .filter(t => normalizeName(t.name) !== "languages")
    .map(t => "### " + t.name + "\n" + t.description)
    .join("\n\n");

  showInfo(profile.name, [
    ["Class", "Level " + profile.level + " " + profile.className],
    [profile.archetypeFlavor || "Archetype", session.approach],
    ["Species", profile.species + (sp?.size ? " (" + sp.size + ")" : "")],
    ["Background", profile.background],
    ["Experience", profile.experiencePoints ? profile.experiencePoints.toLocaleString() + " XP" : ""],
    ...abilities.map(name => [name, scores[name] + " (" + signed(modifier(scores[name])) + ")"]),
    ["Maximum HP", String(maxHp)],
    ["HP from hit dice", profile.hpDice],
    ["Constitution HP", signed(profile.level * modifier(scores.Constitution))],
    ["Species HP", speciesHp ? signed(speciesHp) : ""],
    ["Feat HP (Durable)", featHp ? signed(featHp) : ""],
    ["Extra maximum HP", profile.extraHpBonus ? signed(profile.extraHpBonus) : ""],
    ["Maximum HP override", profile.hpOverride],
    ["Imported from", profile.filename]
  ], speciesTraitsMd);
}

function appendFeatureAccordion(parent, title, badgeText, rulesText, defaultOpen = false) {
  const details = document.createElement("details");
  details.className = "featureAccordion";
  if (defaultOpen) details.open = true;
  const sum = appendText(details, "summary", "");
  appendText(sum, "span", title);
  if (badgeText) appendText(sum, "span", badgeText).className = "featureLevel";
  if (rulesText) appendRules(details, rulesText);
  parent.append(details);
  return details;
}

function appendProficiencyCard(parent, title, entries, emptyText) {
  const card = appendText(parent, "div", "");
  card.className = "binderCard";
  appendText(card, "h3", title);
  if (!entries.length) {
    appendText(card, "p", emptyText).className = "muted";
    return card;
  }
  const list = appendText(card, "div", "");
  list.className = "profList";
  for (const item of entries) {
    const row = appendText(list, "div", "");
    row.className = "profRow";
    const prettyName = item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : "";
    appendText(row, "span", prettyName);
    if (item.source) appendText(row, "span", item.source).className = "profSource";
  }
  return card;
}

function renderBinderCharacterPages(profile, session) {
  // 1. Class overview & level-by-level features
  const clsOverview = getElementById("classOverviewCard");
  const clsFeatures = getElementById("classFeaturesCard");
  const cls = classRecord(profile.className);
  if (clsOverview) {
    clsOverview.replaceChildren();
    const head = appendText(clsOverview, "div", "");
    head.className = "top wrap";
    appendText(head, "h3", profile.className + " · Level " + profile.level);
    const meta = [
      "Hit Die: d" + (profile.hitDie || cls?.hitDie || 8),
      cls?.savingThrows?.length ? "Saves: " + cls.savingThrows.join(", ") : "",
      session.approach ? (profile.archetypeFlavor || "Archetype") + ": " + session.approach : ""
    ].filter(Boolean).join(" · ");
    appendText(clsOverview, "p", meta).className = "muted";
    if (normalizeName(profile.className) === "consular" && (profile.level || 1) >= 3) {
      const affWrap = appendText(clsOverview, "div", "");
      affWrap.style.marginTop = "6px";
      const affLabel = appendText(affWrap, "div", "");
      affLabel.className = "row wrap";
      appendText(affLabel, "strong", "Force Affinity");
      const curAff = session.forceAffinity || "";
      const affDesc = curAff === "Ashla"
        ? "Light side casts grant +power level maximum & current HP (1 minute)."
        : curAff === "Bendu"
          ? "Both Wisdom and Charisma modifiers added to maximum Force Points."
          : curAff === "Bogan"
            ? "Dark side power damage rolls gain a minimum roll threshold."
            : "Choose your 3rd-level Consular Force Affinity.";
      appendText(affLabel, "span", affDesc).className = "muted";
      const chips = appendText(affWrap, "div", "");
      chips.className = "directChips";
      for (const opt of ["Ashla", "Bendu", "Bogan"]) {
        const b = appendText(chips, "button", opt);
        b.type = "button";
        b.setAttribute("aria-pressed", String(curAff === opt));
        b.addEventListener("click", () => update("Force Affinity: " + opt, next => {
          next.forceAffinity = next.forceAffinity === opt ? "" : opt;
        }));
      }
    }
  }
  if (clsFeatures) {
    clsFeatures.replaceChildren();
    appendText(clsFeatures, "h3", "Class Features (L1–L" + profile.level + ")");
    const feats = classFeaturesWithLevels(profile);
    if (!feats.length) {
      appendText(clsFeatures, "p", "No class features found.").className = "muted";
    } else {
      for (const f of feats) {
        appendFeatureAccordion(clsFeatures, f.name, "Level " + f.level, stripRedundantArchetypeHeader(f.text || "See class rules.", profile.className));
      }
    }
  }

  // 2. Archetype page (level-gated: Unlocked vs Upcoming, and deduplicated custom features)
  const parseArchFeatureMeta = (rawText, archName) => {
    const firstLine = String(rawText || "").replaceAll("\r", "").trim().split("\n")[0] || "";
    const cleanFirst = firstLine.replace(/[*_]/g, "").trim();
    const nums = [];
    if (archName && cleanFirst.toLowerCase().startsWith(archName.toLowerCase() + ":")) {
      const rest = cleanFirst.slice(archName.length + 1);
      for (const m of rest.matchAll(/(\d+)(?:st|nd|rd|th)/gi)) nums.push(Number(m[1]));
    }
    const unlockLevel = nums.length ? nums[0] : 0;
    const badge = nums.length > 1 ? ("Levels " + nums.join(", ")) : nums.length === 1 ? ("Level " + nums[0]) : "";
    return {unlockLevel, badge, body: stripRedundantArchetypeHeader(rawText, archName)};
  };

  const archRoot = getElementById("archetypeContent");
  if (archRoot) {
    archRoot.replaceChildren();
    const arch = archetypeRecord(session.approach, profile.className);
    const card = appendText(archRoot, "div", "");
    card.className = "binderCard";
    appendText(card, "h3", session.approach || (profile.archetypeFlavor || "Archetype") + " (Not selected)");
    if (arch) {
      appendText(card, "p", (profile.archetypeFlavor || "Archetype") + " for " + profile.className + " · Level " + profile.level).className = "muted";
      const unlocked = [];
      const upcoming = [];
      for (const heading of (arch.features || [])) {
        const text = approachRule(profile, session, heading);
        if (!text) continue;
        const meta = parseArchFeatureMeta(text, arch.name);
        if (meta.unlockLevel > (profile.level || 1)) upcoming.push({heading, ...meta});
        else unlocked.push({heading, ...meta});
      }
      if (!unlocked.length) {
        appendText(card, "p", "No archetype features unlocked yet at Level " + profile.level + ".").className = "muted";
      } else {
        for (const f of unlocked) {
          appendFeatureAccordion(card, f.heading, f.badge, f.body);
        }
      }
      if (upcoming.length) {
        const upCard = appendText(archRoot, "div", "");
        upCard.className = "binderCard";
        const upDet = document.createElement("details");
        upDet.className = "featureAccordion";
        const upSum = appendText(upDet, "summary", "");
        appendText(upSum, "span", "Upcoming Archetype Features (Higher Levels)");
        appendText(upSum, "span", String(upcoming.length)).className = "featureLevel";
        for (const f of upcoming) {
          appendFeatureAccordion(upDet, f.heading, f.badge, f.body);
        }
        upCard.append(upDet);
      }
    } else if (session.approach) {
      appendText(card, "p", "Custom or unrecognized archetype: " + session.approach).className = "muted";
    } else {
      appendText(card, "p", "No archetype selected at Level " + profile.level + ".").className = "muted";
    }

    // Deduplicate Additional & Custom Features against ALL structured Binder tabs (Archetype, Class Options, Force Affinity, Styles, Masteries, Forms, Maneuvers)
    const archHeadings = new Set((arch?.features || []).map(normalizeName));
    const isManagedElsewhere = name => {
      const k = normalizeName(name);
      if (arch && archHeadings.has(k)) return true;
      if (/^(force\s*affinity\b.*|ashla|bendu|bogan|force.?empowered casting)$/i.test(k)) return true;
      if (typeof classOptionRule === "function" && classOptionRule(name)) return true;
      if (typeof fightingStyleRule === "function" && fightingStyleRule(name)) return true;
      if (typeof fightingMasteryRule === "function" && fightingMasteryRule(name)) return true;
      if (typeof lightsaberFormRule === "function" && lightsaberFormRule(name)) return true;
      if (typeof maneuverRule === "function" && maneuverRule(name)) return true;
      return false;
    };
    const extras = (profile.customFeatures || []).filter(entry => !isManagedElsewhere(entry.name));
    if (extras.length) {
      const extraCard = appendText(archRoot, "div", "");
      extraCard.className = "binderCard";
      appendText(extraCard, "h3", "Additional & Custom Features");
      for (const entry of extras) {
        appendFeatureAccordion(extraCard, entry.name, "Custom", entry.content);
      }
    }
  }

  // 3. Background & Proficiencies page
  const bgRoot = getElementById("backgroundContent");
  if (bgRoot) {
    bgRoot.replaceChildren();
    const bgCard = appendText(bgRoot, "div", "");
    bgCard.className = "binderCard";
    appendText(bgCard, "h3", profile.background || "Background");
    if (profile.backgroundFeature?.name) {
      appendFeatureAccordion(bgCard, profile.backgroundFeature.name, "Background Feature", profile.backgroundFeature.text || "", true);
    } else {
      const bgRec = typeof backgroundRecord === "function" ? backgroundRecord(profile.background) : null;
      if (bgRec?.featureName) {
        appendFeatureAccordion(bgCard, bgRec.featureName, "Background Feature", bgRec.featureText || "", true);
      } else {
        appendText(bgCard, "p", "No background feature recorded.").className = "muted";
      }
    }

    const profs = characterProficiencies(profile, session);
    appendProficiencyCard(bgRoot, "Languages", profs.languages, "No languages recorded.");
    appendProficiencyCard(bgRoot, "Tool Proficiencies", profs.tools, "No tool proficiencies recorded.");
    appendProficiencyCard(bgRoot, "Weapon & Armor Proficiencies", [...profs.armor, ...profs.weapons], "No weapon or armor proficiencies recorded.");

    const charEntries = Object.entries(profile.characteristics || {}).filter(([, v]) => v);
    if (charEntries.length || profile.notes) {
      const charCard = appendText(bgRoot, "div", "");
      charCard.className = "binderCard";
      appendText(charCard, "h3", "Characteristics & Notes");
      if (charEntries.length) {
        const dl = appendText(charCard, "dl", "");
        dl.className = "infoFacts";
        for (const [k, v] of charEntries) {
          const pair = appendText(dl, "div", "");
          const prettyKey = humanizeEnum(k).replace(/^\w/, ch => ch.toUpperCase());
          appendText(pair, "dt", prettyKey);
          appendText(pair, "dd", String(v));
        }
      }
      if (profile.notes) {
        const notesWrap = appendText(charCard, "div", "");
        notesWrap.className = "userExportNotes";
        appendRules(notesWrap, "### Export Notes\n" + profile.notes);
      }
    }
  }
}

function openFanaticTempDialog(trigger) {
  const {profile, session} = app.character;
  if (!hasFeat(session, "Fanatic") || conditionState(session, profile).dead) return;
  const conMod = modifier(effectiveScores(profile, session).Constitution);
  const {dialog, form, body, note, confirm} = createModalFrame("Fanatic temporary HP", trigger);
  confirm.textContent = "Apply temporary HP";
  note("Passive trigger (no action): when a creature you can see within 30 ft drops to 0 HP, roll 1d4 and add your Constitution modifier (" + signed(conMod) + ") for temporary HP (keeps the higher total).");
  const dieField = createDieRollField(body, {
    diceCount: 1,
    dieSides: 4,
    modifier: conMod,
    modifierLabel: "Constitution",
    unit: "temporary HP",
    label: "Die roll (1d4)"
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const amount = dieField.getTotal();
    if (!Number.isFinite(amount)) return;
    dialog.close();
    update("Fanatic · " + amount + " temporary HP", next => {
      if (amount > next.temp) {
        next.temp = amount;
        next.tempSource = "Fanatic";
      }
    });
  });
  dialog.showModal();
  dieField.input.focus();
}

function speedTileSubtext(spd, c) {
  const tags = [];
  if (spd.overloaded) tags.push("Overloaded");
  else if (spd.encumbered) tags.push("Encumbered");
  if (c.prone && !c.speedZero) tags.push(hasFeat(app.character?.session, "Athlete") ? "Stand 5 ft" : "Crawl");
  if (spd.modes.climb) tags.push("Climb " + spd.modes.climb);
  if (spd.modes.swim) tags.push("Swim " + spd.modes.swim);
  if (spd.modes.fly) tags.push("Fly " + spd.modes.fly);
  if (spd.modes.burrow) tags.push("Burrow " + spd.modes.burrow);
  return tags.join(" · ");
}

function renderHealth(profile, session, effectCount) {
  const c = conditionState(session, profile);
  const armor = armorStats(profile, session);
  const traits = characterTraits(profile, session);
  const training = effectiveTraining(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const def = defenseProfile(profile, session);
  const sp = speciesRecord(profile.species);
  const ac = armor.value;
  const maximum = hitPointMaximum(profile, session);

  getElementById("formTitle").textContent = profile.species;
  getElementById("formRole").textContent = [session.approach, profile.background].filter(Boolean).join(" · ");

  getElementById("hp").textContent = session.hp;
  getElementById("maximumHP").textContent = maximum;
  getElementById("maximumHP").title = "Maximum HP (" + baseMaxHP(profile, session) + " base)";
  getElementById("temp").textContent = session.temp;
  getElementById("tempSource").textContent = session.tempSource;
  getElementById("hpbar").style.width = (session.hp / maximum * 100) + "%";
  getElementById("tempbar").style.width = Math.min(100, session.temp / maximum * 100) + "%";
  document.querySelector(".tempLine").hidden = !session.temp;
  getElementById("death").classList.toggle("hidden", session.hp > 0);

  const hasResistance = c.petrified || def.resistances.length > 0;
  const resBtn = getElementById("damageResisted");
  if (resBtn) {
    resBtn.hidden = !hasResistance;
    if (!hasResistance) resBtn.setAttribute("aria-pressed", "false");
  }
  const corrBtn = getElementById("damageCorroded");
  if (corrBtn) {
    corrBtn.hidden = !c.corroded;
    if (!c.corroded) corrBtn.setAttribute("aria-pressed", "false");
    else corrBtn.textContent = "Weapon (+" + c.corroded + ")";
  }
  const fanaticBtn = getElementById("fanaticTempBtn");
  if (fanaticBtn) {
    fanaticBtn.hidden = !traits.fanatic;
    fanaticBtn.disabled = c.dead;
  }

  const defense = getElementById("defense");
  defense.replaceChildren();
  const addDefPill = (text, cls) => {
    const el = appendText(defense, "span", text);
    el.className = "defenseFact " + cls;
    return el;
  };
  if (session.concentration) {
    addDefPill("Concentrating: " + session.concentration, "is-concentration");
  }
  if (def.vulnerabilities?.length) {
    addDefPill("Vulnerable: " + def.vulnerabilities.join(", "), "is-vulnerability");
  }
  if (hasResistance) {
    addDefPill("Resists: " + (c.petrified ? "all damage" : def.resistances.join(", ")), "is-resistance");
  }
  if (def.immunities.length) {
    addDefPill("Immune: " + def.immunities.join(", "), "is-immunity");
  }
  if (def.senses.length) {
    addDefPill("Senses: " + def.senses.join(", "), "is-senses");
  }
  if (def.rollModifiers.length) {
    addDefPill("Active bonuses: " + def.rollModifiers.join("; "), "is-bonus");
  }
  const incomingAdvantage = c.incomingAdvantage || session.reckless;
  if (incomingAdvantage || c.incomingDisadvantage || effMods.oaDisadvantage || c.prone || c.nearbyCritical) {
    const line = appendText(defense, "button", "Incoming attacks");
    line.type = "button";
    line.className = "defenseFact " + (incomingAdvantage || c.nearbyCritical ? "is-vulnerability" : "is-resistance") + " detailName";
    displayRollBadge(line, incomingAdvantage, c.incomingDisadvantage, c.prone || effMods.oaDisadvantage);
    line.addEventListener("click", ev => showMathPopover(ev.currentTarget, "Incoming attacks", [
      ["Advantage", incomingAdvantage ? (session.reckless && c.incomingAdvantage ? "Reckless Attack and conditions" : session.reckless ? "Reckless Attack" : "Active conditions") : ""],
      ["Disadvantage", c.incomingDisadvantage ? "Active defense / visibility effect" : ""],
      ["Opportunity attacks", effMods.oaDisadvantage ? "Disadvantage against you" : ""],
      ["Prone", c.prone ? "Advantage within 5 ft. Disadvantage farther away." : ""],
      ["Critical hits", c.nearbyCritical ? "A hit from within 5 ft is critical." : ""]
    ], ""));
  }
  defense.hidden = !defense.childElementCount;

  getElementById("shortRest").disabled = c.dead;
  getElementById("longRest").disabled = c.dead;

  const form = getElementById("formData");
  form.replaceChildren();
  const list = appendText(form, "dl", "");
  list.className = "formStats";

  const spd = speedBreakdown(profile, session, c);
  const dexMod = effectiveModifier(profile, session, "Dexterity", c);
  const intMod = effectiveModifier(profile, session, "Intelligence", c);
  const forceInitAbility = effMods.initiativeForceMod ? (castingStats(profile, session).forceAbility || "Wisdom") : "";
  const forceInitMod = forceInitAbility ? effectiveModifier(profile, session, forceInitAbility, c) : -99;
  const useForceInit = Boolean(effMods.initiativeForceMod && forceInitMod >= Math.max(dexMod, traits.quickWitted ? intMod : -99));
  const useIntInit = !useForceInit && traits.quickWitted && intMod > dexMod;
  const initAbility = useForceInit ? forceInitAbility : (useIntInit ? "Intelligence" : "Dexterity");
  const initMod = useForceInit ? forceInitMod : (useIntInit ? intMod : dexMod);
  const ledByForceInit = (traits.isSentinel && !traits.alert) ? Math.floor((profile.proficiency || 2) / 2) : 0;
  const initBase = (profile.initiativeOverride ??
    (initMod + (traits.alert ? profile.proficiency : ledByForceInit) + (profile.initiativeBonus || 0))) + (effMods.initiativeFlatBonus || 0);
  const initMode = checkMode(profile, session, initAbility, null, armor);
  if (effMods.initiativeAdv) {
    initMode.advantage = [initMode.advantage, "Active power"].filter(Boolean).join(", ");
  }
  if (traits.isBerserker && (profile.level || 1) >= 7) {
    initMode.advantage = [initMode.advantage, "Feral Impulse"].filter(Boolean).join(", ");
  }
  const observantBonus = traits.passiveBonus || (traits.observant ? 5 : 0);
  const passivePerc = 10 + effectiveModifier(profile, session, "Wisdom", c) + (training.Perception || 0) * profile.proficiency + observantBonus;
  const passiveInv = 10 + effectiveModifier(profile, session, "Intelligence", c) + (training.Investigation || 0) * profile.proficiency + observantBonus;

  const speedNotes = [
    c.prone ? "Standing up from Prone costs half your speed." : "",
    ...(spd.notes || [])
  ].filter(Boolean).join("\n");

  const statItems = [
    ["AC", ac, ev => showMathPopover(ev.currentTarget, "Armor Class", [
      ["Armor", armor.armor?.name || armor.unarmoredLabel],
      ["Shield", armor.shield?.name],
      ["Active effects", armor.effectSources.length ? armor.effectSources.join(", ") : ""],
      ["Export adjustment", profile.acBonus ? signed(profile.acBonus) : ""],
      ["Export override", profile.acOverride],
      ["Armor Class", ac]
    ], "")],
    ["Speed", spd.live + " ft", ev => showMathPopover(ev.currentTarget, "Speed & movement", [
      ["Walking speed", spd.live + " ft (base " + spd.speciesBase + " ft · " + profile.species + ")"],
      ["Climbing speed", spd.modes.climb ? spd.modes.climb + " ft" : ""],
      ["Swimming speed", spd.modes.swim ? spd.modes.swim + " ft" : ""],
      ["Flying speed", spd.modes.fly ? spd.modes.fly + " ft" : ""],
      ["Burrowing speed", spd.modes.burrow ? spd.modes.burrow + " ft" : ""],
      ["Unarmored Movement", spd.unarmoredBonus ? "+" + spd.unarmoredBonus + " ft" : ""],
      ["Feats", spd.featSources.length ? spd.featSources.join(", ") : ""],
      ["Active effects", spd.effectSources.length ? spd.effectSources.join(", ") : ""],
      ["Armor strength penalty", spd.armorPenalty ? "-" + spd.armorPenalty + " ft" : ""],
      ["Carrying weight", spd.overloaded ? "Overloaded (0 ft)" : spd.encumbered ? "Encumbered (maximum 5 ft)" : ""],
      ["Slowed levels", c.slowed ? c.slowed + (spd.slowedStep ? " (-" + (c.slowed * spd.slowedStep) + " ft)" : "") : ""]
    ], speedNotes)],
    ["Initiative", signed(initBase) + (effMods.initiativeDice?.length ? " " + effMods.initiativeDice[0].split(" ")[0] : ""), ev => showMathPopover(ev.currentTarget, "Initiative", [
      [initAbility + " modifier", signed(initMod) + (useForceInit ? " (Force Intuition)" : useIntInit ? " (Quick-Witted)" : "")],
      ["Active effects", effMods.initiativeFlatSources?.length ? effMods.initiativeFlatSources.join(", ") : ""],
      ["Power dice", effMods.initiativeDice?.length ? effMods.initiativeDice.join(", ") : ""],
      ["Alert proficiency", traits.alert ? signed(profile.proficiency) : ""],
      ["Export adjustment", profile.initiativeBonus ? signed(profile.initiativeBonus) : ""],
      ["Export override", profile.initiativeOverride !== null && profile.initiativeOverride !== undefined ? signed(profile.initiativeOverride) : ""],
      ["Advantage", initMode.advantage],
      ["Disadvantage", initMode.disadvantage],
      ["Initiative bonus", signed(initBase)]
    ], traits.alert ? "Alert: You cannot be surprised while conscious." : ""), initMode],
    ["Size", sp?.size || "Medium", null],
    ["Passive Perception", passivePerc, ev => showMathPopover(ev.currentTarget, "Passive Perception", [
      ["Base", "10"],
      ["Wisdom modifier", signed(effectiveModifier(profile, session, "Wisdom", c))],
      ["Training", training.Perception ? (training.Perception === 2 ? "Expertise " : "Proficient ") + signed(training.Perception * profile.proficiency) : ""],
      ["Observant", observantBonus ? "+5" : ""],
      ["Total", passivePerc]
    ], "")],
    ["Passive Investigation", passiveInv, ev => showMathPopover(ev.currentTarget, "Passive Investigation", [
      ["Base", "10"],
      ["Intelligence modifier", signed(effectiveModifier(profile, session, "Intelligence", c))],
      ["Training", training.Investigation ? (training.Investigation === 2 ? "Expertise " : "Proficient ") + signed(training.Investigation * profile.proficiency) : ""],
      ["Observant", observantBonus ? "+5" : ""],
      ["Total", passiveInv]
    ], "")]
  ];

  const speedSub = speedTileSubtext(spd, c);
  for (const [label, value, onClick, badgeMode] of statItems) {
    const pair = appendText(list, "div", "");
    appendText(pair, "dt", label);
    const description = appendText(pair, "dd", "");
    if (onClick) {
      const button = appendText(description, "button", String(value));
      button.type = "button";
      button.className = "detailName";
      button.setAttribute("aria-label", label + " " + value + " details");
      if (badgeMode) displayRollBadge(button, badgeMode.advantage, badgeMode.disadvantage);
      button.addEventListener("click", onClick);
    } else {
      description.textContent = String(value);
    }
    if (label === "Speed" && speedSub) {
      appendText(description, "small", speedSub).className = "statSub";
    }
  }

  const saves = getElementById("saves");
  saves.replaceChildren();
  for (const ability of abilities) {
    const st = savingThrowTotal(profile, session, ability, c, effMods);
    const bonus = st.total;
    const mode = saveMode(profile, session, ability, armor);
    const cell = appendText(saves, "div", "");
    cell.className = "stat";
    const label = appendText(cell, "button", ability.slice(0, 3).toUpperCase() + " " + (mode.automatic ? "Fails" : signed(bonus)));
    label.type = "button";
    label.className = "detailName";
    label.setAttribute("aria-label", ability + " save " + (mode.automatic ? "automatically fails" : signed(bonus)));
    if (!mode.automatic) displayRollBadge(label, mode.advantage, mode.disadvantage, mode.conditional);
    label.addEventListener("click", ev => showMathPopover(ev.currentTarget, ability + " saving throw", [
      ["Bonus", signed(bonus)],
      ["Ability", st.substitutedFrom ? signed(st.baseMod) + " via " + st.substitutedFrom : signed(st.baseMod)],
      ["Training", st.saveRank === 2 ? "Expertise (+" + (2 * profile.proficiency) + ")" : st.saveRank === 1 ? "Proficient (+" + profile.proficiency + ")" : ""],
      ["Active effects", st.effectBonus ? signed(st.effectBonus) : ""],
      ["Advantage", mode.advantage],
      ["Disadvantage", mode.disadvantage],
      ["Condition", mode.automatic ? "Automatically fails as a natural 1." : mode.conditional]
    ], ""));
  }

  const sticky = getElementById("stickyState");
  sticky.replaceChildren();
  appendText(sticky, "span", profile.name).className = "stickyForm";
  appendText(sticky, "b", "HP " + session.hp + "/" + maximum);
  if (session.temp) appendText(sticky, "span", "+" + session.temp + " temporary HP");
  appendText(sticky, "span", "AC " + ac);
  appendText(sticky, "a", "Effects " + effectCount).href = "#activeStatus";
}
