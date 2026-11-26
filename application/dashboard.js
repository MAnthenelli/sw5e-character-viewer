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

  const hpParts = [
    profile.hpDice ? profile.hpDice + " hit dice" : "",
    signed(profile.level * modifier(scores.Constitution)) + " CON",
    speciesHp ? signed(speciesHp) + " species" : "",
    featHp ? signed(featHp) + " feat" : "",
    profile.extraHpBonus ? signed(profile.extraHpBonus) + " bonus" : "",
    profile.hpOverride ? "override " + profile.hpOverride : ""
  ].filter(Boolean).join(" · ");
  const _mkNode = (parts) => {
    if (typeof document === "undefined") return parts.map(p => typeof p === "string" ? p : p.textContent).join("");
    const span = document.createElement("span");
    for (const p of parts) if (p) span.append(typeof p === "string" ? document.createTextNode(p) : p);
    return span;
  };
  const clsEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  const isMulti = clsEntries.length > 1;
  let clsLabel = "Class";
  let clsVal = "";
  let archLabel = profile.archetypeFlavor || "Archetype";
  let archVal = "";
  let hitDiceRow = "";
  if (isMulti) {
    clsLabel = "Classes";
    const clsParts = ["Level " + profile.level + " · "];
    clsEntries.forEach((cEntry, i) => {
      if (i > 0) clsParts.push(" / ");
      if (typeof createRuleLink === "function") {
        clsParts.push(createRuleLink(cEntry.name, { kind: "class", name: cEntry.name }, { push: true, profile, session }), " " + cEntry.levels);
      } else {
        clsParts.push(cEntry.name + " " + cEntry.levels);
      }
    });
    clsVal = _mkNode(clsParts);

    archLabel = "Archetypes";
    const archParts = [];
    clsEntries.forEach((cEntry, i) => {
      if (i > 0) archParts.push(" · ");
      archParts.push(cEntry.name + ": ");
      if (cEntry.archetype && typeof createRuleLink === "function") {
        archParts.push(createRuleLink(cEntry.archetype, { kind: "archetype", name: cEntry.archetype, className: cEntry.name }, { push: true, profile, session }));
      } else {
        archParts.push(cEntry.archetype || "Not selected");
      }
    });
    archVal = _mkNode(archParts);

    const hdInfo = typeof hitDiceState === "function" ? hitDiceState(profile, session) : null;
    if (hdInfo?.pools?.length) {
      hitDiceRow = hdInfo.pools.map(p => p.current + "/" + p.max + " " + p.key).join(" · ");
    }
  } else {
    clsVal = (profile.className && typeof createRuleLink === "function")
      ? _mkNode(["Level " + profile.level + " ", createRuleLink(profile.className, { kind: "class", name: profile.className }, { push: true, profile, session })])
      : ("Level " + profile.level + " " + profile.className);
    archVal = (session.approach && typeof createRuleLink === "function")
      ? createRuleLink(session.approach, { kind: "archetype", name: session.approach, className: profile.className }, { push: true, profile, session })
      : session.approach;
  }
  const spVal = (profile.species && typeof createRuleLink === "function")
    ? _mkNode([createRuleLink(profile.species, { kind: "species", name: profile.species }, { push: true, profile, session }), sp?.size ? " (" + sp.size + ")" : ""])
    : (profile.species + (sp?.size ? " (" + sp.size + ")" : ""));
  const bgVal = (profile.background && typeof createRuleLink === "function")
    ? createRuleLink(profile.background, { kind: "background", name: profile.background }, { push: true, profile, session })
    : profile.background;
  showInfo(profile.name, [
    [clsLabel, clsVal],
    [archLabel, archVal],
    ...(hitDiceRow ? [["Hit Dice", hitDiceRow]] : []),
    ["Species", spVal],
    ["Background", bgVal],
    ["Experience", profile.experiencePoints ? profile.experiencePoints.toLocaleString() + " XP" : ""],
    ["Maximum HP", String(maxHp)],
    ["HP breakdown", hpParts],
    ["Imported from", profile.filename]
  ], speciesTraitsMd, { navKey: "character:" + normalizeName(profile.name) });
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
  // 1. Class overview & level-by-level features (single-class and multiclass)
  const clsOverview = getElementById("classOverviewCard");
  const clsFeatures = getElementById("classFeaturesCard");
  const clsEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  const isMulti = clsEntries.length > 1;
  const cls = classRecord(profile.className);
  if (clsOverview) {
    clsOverview.replaceChildren();
    const head = appendText(clsOverview, "div", "");
    head.className = "top wrap";
    if (isMulti) {
      const clsSummary = typeof formatClassSummary === "function" ? formatClassSummary(profile, session) : profile.className;
      appendText(head, "h3", clsSummary + " · Total Level " + profile.level);
      const list = appendText(clsOverview, "div", "");
      list.className = "profList";
      for (const cEntry of clsEntries) {
        const row = appendText(list, "div", "");
        row.className = "profRow";
        appendText(row, "span", cEntry.name + " · Level " + cEntry.levels + (cEntry.isStarting ? " (Starting)" : ""));
        const detail = [
          "Hit Die: d" + (cEntry.hitDie || 8),
          cEntry.isStarting && cEntry.record?.savingThrows?.length ? "Saves: " + cEntry.record.savingThrows.join(", ") : (!cEntry.isStarting ? "Multiclass" : ""),
          cEntry.archetype ? cEntry.archetype : ""
        ].filter(Boolean).join(" · ");
        appendText(row, "span", detail).className = "profSource";
      }
    } else {
      appendText(head, "h3", profile.className + " · Level " + profile.level);
      const meta = [
        "Hit Die: d" + (profile.hitDie || cls?.hitDie || 8),
        cls?.savingThrows?.length ? "Saves: " + cls.savingThrows.join(", ") : "",
        session.approach ? (profile.archetypeFlavor || "Archetype") + ": " + session.approach : ""
      ].filter(Boolean).join(" · ");
      appendText(clsOverview, "p", meta).className = "muted";
    }
    const consularLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Consular") : (normalizeName(profile.className) === "consular" ? (profile.level || 1) : 0);
    if (consularLvl >= 3) {
      const curAff = session.forceAffinity || "";
      const affRow = appendText(clsOverview, "div", "");
      affRow.className = "choiceRowCard";
      const affInfo = appendText(affRow, "div", "");
      appendText(affInfo, "strong", curAff ? ("Force Affinity: " + curAff) : "Force Affinity");
      const affDesc = typeof forceAffinitySummary === "function"
        ? forceAffinitySummary(curAff, profile, session)
        : "Choose your 3rd-level Consular Force Affinity.";
      appendText(affInfo, "p", affDesc).className = "muted";
      const affBtn = appendText(affRow, "button", curAff ? "Change" : "Choose");
      affBtn.type = "button";
      affBtn.addEventListener("click", ev => {
        if (typeof openForceAffinityPicker === "function") openForceAffinityPicker(ev.currentTarget);
      });
    }
    const guardianLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Guardian") : (normalizeName(profile.className) === "guardian" ? (profile.level || 1) : 0);
    if (guardianLvl >= 1) {
      const curCf = session.channelForceChoice || "";
      const cfRow = appendText(clsOverview, "div", "");
      cfRow.className = "choiceRowCard";
      const cfInfo = appendText(cfRow, "div", "");
      appendText(cfInfo, "strong", curCf ? ("Channel the Force: " + curCf) : "Channel the Force");
      appendText(cfInfo, "p", curCf === "Cause Harm"
        ? "Action · 60 ft Constitution save for Guardian level + Charisma modifier necrotic damage (half on pass)."
        : curCf === "Lend Aid"
          ? "Bonus action · Touch · Heal Guardian level + Wisdom modifier HP, or neutralize one poison or disease."
          : "Choose your starting 1st-level Guardian Channel the Force effect (Cause Harm or Lend Aid).").className = "muted";
      const cfBtn = appendText(cfRow, "button", curCf ? "Change" : "Choose");
      cfBtn.type = "button";
      cfBtn.addEventListener("click", ev => {
        if (typeof openChannelForcePicker === "function") openChannelForcePicker(ev.currentTarget);
      });
    }
    const capEntry = clsEntries.find(c => c.levels >= 20 && ["berserker", "consular", "fighter", "monk", "scout", "sentinel"].includes(normalizeName(c.name)));
    if (capEntry) {
      const clsKeyOv = normalizeName(capEntry.name);
      const capName = clsKeyOv === "berserker" ? "Primal Champion" : clsKeyOv === "fighter" ? "Master of Combat" : clsKeyOv === "monk" ? "Perfect Self" : clsKeyOv === "scout" ? "Foe Slayer" : clsKeyOv === "sentinel" ? "Center of the Force" : "One with the Force";
      const curCap = session.classChoice || "";
      const capRow = appendText(clsOverview, "div", "");
      capRow.className = "choiceRowCard";
      const capInfo = appendText(capRow, "div", "");
      appendText(capInfo, "strong", curCap ? (capName + ": " + curCap) : capName);
      const capDesc = clsKeyOv === "berserker"
        ? (curCap ? ("+2 " + curCap + " and +2 Constitution (maximum 22); unlimited Rages with no bonus action to enter.") : "Choose Strength or Dexterity (+2 score and maximum, alongside +2 Constitution).")
        : clsKeyOv === "fighter"
          ? (curCap ? ("+2 " + curCap + " and +2 Constitution (maximum 22); 4 attacks per Attack action.") : "Choose Strength or Dexterity (+2 score and maximum, alongside +2 Constitution).")
          : clsKeyOv === "monk"
            ? (curCap ? ("+2 " + curCap + " and +2 Dexterity (maximum 22); regain up to 6 Focus Points on initiative.") : "Choose Wisdom or Charisma (+2 score and maximum, alongside +2 Dexterity).")
            : clsKeyOv === "scout"
              ? (curCap ? ("+2 " + curCap + " and +2 Intelligence (maximum 22); once per turn add Intelligence modifier to an attack or damage roll.") : "Choose Strength or Dexterity (+2 score and maximum, alongside +2 Intelligence).")
              : clsKeyOv === "sentinel"
                ? (curCap ? ("+2 " + curCap + " and +2 Dexterity (maximum 22); once per turn choose the maximum Kinetic Combat die value.") : "Choose Wisdom or Charisma (+2 score and maximum, alongside +2 Dexterity).")
                : (curCap ? ("+4 " + curCap + " (maximum 24).") : "Choose Wisdom or Charisma (+4 score and maximum).");
      appendText(capInfo, "p", capDesc).className = "muted";
      const capBtn = appendText(capRow, "button", curCap ? "Change" : "Choose");
      capBtn.type = "button";
      capBtn.addEventListener("click", ev => {
        if (typeof openClassCapstonePicker === "function") openClassCapstonePicker(ev.currentTarget);
      });
      if (clsKeyOv === "consular") {
        const curSig = session.signaturePower || "";
        const sigRow = appendText(clsOverview, "div", "");
        sigRow.className = "choiceRowCard";
        const sigInfo = appendText(sigRow, "div", "");
        appendText(sigInfo, "strong", curSig ? ("Signature Power: " + curSig) : "Signature Power (3rd-Level)");
        appendText(sigInfo, "p", curSig ? ("Cast " + curSig + " once at 3rd level for 0 Force Points per short or long rest.") : "Choose one known 3rd-level Force power to cast once per short or long rest without expending Force Points.").className = "muted";
        const sigBtn = appendText(sigRow, "button", curSig ? "Change" : "Choose");
        sigBtn.type = "button";
        sigBtn.addEventListener("click", ev => {
          if (typeof openSignaturePowerPicker === "function") openSignaturePowerPicker(ev.currentTarget);
        });
      }
    }
  }
  if (clsFeatures) {
    clsFeatures.replaceChildren();
    if (isMulti) {
      for (const cEntry of clsEntries) {
        appendText(clsFeatures, "h3", cEntry.name + " Features (L1–L" + cEntry.levels + ")");
        const feats = typeof classFeaturesForClass === "function" ? classFeaturesForClass(cEntry.name, cEntry.levels) : [];
        if (!feats.length) {
          appendText(clsFeatures, "p", "No class features found for " + cEntry.name + ".").className = "muted";
        } else {
          for (const f of feats) {
            appendFeatureAccordion(clsFeatures, f.name, "Level " + f.level, stripRedundantArchetypeHeader(f.text || "See class rules.", cEntry.name));
          }
        }
      }
    } else {
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
  }

  // 2. Archetype page (per-class level-gated: Unlocked vs Upcoming, and deduplicated custom features)
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
    const archHeadings = new Set();
    const renderClassList = clsEntries.length ? clsEntries : [{
      name: profile.className,
      levels: profile.level || 1,
      archetype: session.approach || "",
      archetypeFlavor: profile.archetypeFlavor || "Archetype",
      archetypeRecord: archetypeRecord(session.approach, profile.className)
    }];
    for (const cEntry of renderClassList) {
      const archName = cEntry.archetype || "";
      const arch = cEntry.archetypeRecord || (archName ? archetypeRecord(archName, cEntry.name) : null);
      if (arch) {
        for (const h of (arch.features || [])) archHeadings.add(normalizeName(h));
      }
      const card = appendText(archRoot, "div", "");
      card.className = "binderCard";
      const archHead = appendText(card, "div", "");
      archHead.className = "top wrap";
      const headingText = archName || ((isMulti ? (cEntry.name + " · ") : "") + (cEntry.archetypeFlavor || "Archetype") + " (Not selected)");
      appendText(archHead, "h3", headingText);
      const unlockReq = typeof archetypeUnlockLevel === "function" ? archetypeUnlockLevel(cEntry.name) : 3;
      if (typeof openArchetypePickerModal === "function") {
        const archBtn = appendText(archHead, "button", archName ? "Change archetype" : "Choose archetype");
        archBtn.type = "button";
        archBtn.dataset.className = cEntry.name;
        if (!archName && cEntry.levels >= unlockReq) archBtn.className = "needsChoiceBtn";
        archBtn.addEventListener("click", ev => openArchetypePickerModal(ev.currentTarget, null, cEntry.name));
      }
      if (arch) {
        appendText(card, "p", (cEntry.archetypeFlavor || "Archetype") + " for " + cEntry.name + " · Level " + cEntry.levels).className = "muted";
        const unlocked = [];
        const upcoming = [];
        for (const heading of (arch.features || [])) {
          const text = typeof archetypeFeatureRule === "function"
            ? archetypeFeatureRule(arch.name, cEntry.name, heading)
            : approachRule(profile, session, heading);
          if (!text) continue;
          const meta = parseArchFeatureMeta(text, arch.name);
          if (meta.unlockLevel > cEntry.levels) upcoming.push({heading, ...meta});
          else unlocked.push({heading, ...meta});
        }
        const choiceSpecs = typeof archetypeFeatureChoiceSpecs === "function" ? archetypeFeatureChoiceSpecs(arch, cEntry.levels) : [];
        const specByName = new Map(choiceSpecs.map(s => [normalizeName(s.featureName), s]));
        const allChoiceChildren = new Set();
        const chosenChildren = new Set();
        for (const s of choiceSpecs) {
          for (const o of s.options) allChoiceChildren.add(normalizeName(o));
          const picked = session.archetypeFeatureChoices?.[s.featureName] || [];
          for (const p of picked) chosenChildren.add(normalizeName(p));
        }

        if (!unlocked.length) {
          appendText(card, "p", "No archetype features unlocked yet at " + cEntry.name + " Level " + cEntry.levels + ".").className = "muted";
        } else {
          for (const f of unlocked) {
            const fNorm = normalizeName(f.heading);
            if (allChoiceChildren.has(fNorm) && !chosenChildren.has(fNorm)) continue;
            const spec = specByName.get(fNorm);
            if (spec) {
              const saved = session.archetypeFeatureChoices?.[spec.featureName] || [];
              const badgeText = saved.length ? (f.badge + " · " + saved.join(", ")) : (f.badge + " · Choose " + spec.count);
              const det = appendFeatureAccordion(card, f.heading, badgeText, f.body);
              if (typeof resolveRuleElementChoices === "function") {
                const row = appendText(det, "div", "");
                row.className = "row wrap";
                row.style.marginTop = "0.5rem";
                const btn = appendText(row, "button", saved.length ? "Edit choice" : "Choose");
                btn.type = "button";
                if (!saved.length) btn.className = "needsChoiceBtn";
                btn.addEventListener("click", ev => {
                  resolveRuleElementChoices(
                    { kind: "archetypeFeature", name: spec.featureName, spec, archName: arch.name },
                    { trigger: ev.currentTarget, forceEdit: true }
                  );
                });
              }
            } else {
              appendFeatureAccordion(card, f.heading, f.badge, f.body);
            }
          }
        }
        if (upcoming.length) {
          const upDet = document.createElement("details");
          upDet.className = "featureAccordion";
          const upSum = appendText(upDet, "summary", "");
          appendText(upSum, "span", isMulti ? ("Upcoming " + cEntry.name + " Archetype Features") : "Upcoming Archetype Features (Higher Levels)");
          appendText(upSum, "span", String(upcoming.length)).className = "featureLevel";
          for (const f of upcoming) {
            appendFeatureAccordion(upDet, f.heading, f.badge, f.body);
          }
          if (isMulti) {
            card.append(upDet);
          } else {
            const upCard = appendText(archRoot, "div", "");
            upCard.className = "binderCard";
            upCard.append(upDet);
          }
        }
      } else if (archName) {
        appendText(card, "p", "Custom or unrecognized archetype: " + archName).className = "muted";
      } else if (cEntry.levels < unlockReq) {
        appendText(card, "p", (cEntry.archetypeFlavor || "Archetype") + " unlocks at " + cEntry.name + " Level " + unlockReq + " (currently Level " + cEntry.levels + ").").className = "muted";
      } else {
        appendText(card, "p", "No archetype selected for " + cEntry.name + " (Level " + cEntry.levels + ").").className = "muted";
      }
    }

    // Deduplicate Additional & Custom Features against ALL structured Binder tabs (Archetypes, Class Options, Force Affinity, Styles, Masteries, Forms, Maneuvers)
    const isManagedElsewhere = name => {
      const k = normalizeName(name);
      if (archHeadings.has(k)) return true;
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

  // 3. Species, Background & Proficiencies page
  const bgRoot = getElementById("backgroundContent");
  if (bgRoot) {
    bgRoot.replaceChildren();
    const spRec = typeof speciesRecord === "function" ? speciesRecord(profile.species) : null;
    if (spRec) {
      const spCard = appendText(bgRoot, "div", "");
      spCard.className = "binderCard";
      appendText(spCard, "h3", spRec.name + (spRec.size ? " · " + spRec.size : ""));
      const spTraits = (spRec.traits || []).filter(t => normalizeName(t.name) !== "languages");
      if (spTraits.length) {
        for (const t of spTraits) {
          appendFeatureAccordion(spCard, t.name, "Species Trait", t.description || "", false);
        }
      } else {
        appendText(spCard, "p", "No species traits recorded.").className = "muted";
      }
    }
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
  if (!characterTraits(profile, session).fanatic || conditionState(session, profile).dead) return;
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
    label: "Fanatic die (1d4)",
    impactPreview: (raw, total) => total ? ("Temporary HP " + (session.temp || 0) + " → " + Math.max(session.temp || 0, total)) : ("Current temporary HP: " + (session.temp || 0)),
    onChange: (raw, total) => { confirm.textContent = total ? ("Apply +" + total + " temporary HP") : "Apply temporary HP"; }
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
  if (c.prone && !c.speedZero) tags.push(spd.standFromProneFeet === 5 ? "Stand 5 ft" : "Crawl");
  if (spd.modes.climb) tags.push("Climb " + spd.modes.climb);
  if (spd.modes.swim) tags.push("Swim " + spd.modes.swim);
  if (spd.modes.fly) tags.push("Fly " + spd.modes.fly);
  if (spd.modes.burrow) tags.push("Burrow " + spd.modes.burrow);
  if (spd.modes.crawl) tags.push("Crawl " + spd.modes.crawl);
  return tags.join(" · ");
}

const SW5E_SIZE_RULES = {
  Tiny: { space: "2½ × 2½ ft", carry: "×0.5 carrying capacity", heavy: "Disadvantage on attacks with Heavy weapons." },
  Small: { space: "5 × 5 ft", carry: "×1 carrying capacity", heavy: "Disadvantage on attacks with Heavy weapons." },
  Medium: { space: "5 × 5 ft", carry: "×1 carrying capacity", heavy: "No penalty with Heavy weapons." },
  Large: { space: "10 × 10 ft", carry: "×2 carrying capacity", heavy: "No penalty with Heavy weapons." },
  Huge: { space: "15 × 15 ft", carry: "×4 carrying capacity", heavy: "No penalty with Heavy weapons." },
  Gargantuan: { space: "20 × 20 ft+", carry: "×8 carrying capacity", heavy: "No penalty with Heavy weapons." }
};

function _senseExplanation(senseStr) {
  const s = String(senseStr || "").toLowerCase();
  if (s.includes("truesight")) return "See in normal & enhanced darkness, see invisible creatures/objects, auto-detect visual illusions, and see true forms.";
  if (s.includes("blindsight")) return "Perceive surroundings within range without relying on sight (ignores darkness, invisibility, and Blinded).";
  if (s.includes("tremorsense")) return "Detect and pinpoint vibrations through the same surface within range (cannot detect flying or incorporeal creatures).";
  if (s.includes("darkvision")) return "See in dim light as bright light and in darkness as dim light (shades of gray only).";
  if (s.includes("force-sight") || s.includes("force sight")) return "Perceive living creatures and Force auras through the Force within range.";
  return "Special sensory range granted by your species, features, or active effects.";
}

function sizeFormulaSpec(sz) {
  const info = (typeof SW5E_SIZE_RULES !== "undefined" && SW5E_SIZE_RULES[sz]) || { space: "5 × 5 ft", carry: "×1 normal" };
  const order = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
  const idx = order.indexOf(sz);
  const grappleMax = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : "Gargantuan";
  const carryShort = String(info.carry || "×1").split(" ")[0];
  return {
    rule: "Size → Space · Carry Mult · Grapple Limit",
    equation: sz + " → " + info.space + " · " + carryShort + " carry · Grapple ≤ " + grappleMax
  };
}

function openSizeOverrideModal(trigger) {
  const {profile, session} = app.character;
  const sp = speciesRecord(profile.species);
  const baseSize = sp?.size || "Medium";
  const current = session.sizeOverride || baseSize;
  const {dialog, form, body, note, confirm} = createModalFrame("Creature Size", trigger, { size: "compact" });
  confirm.textContent = "Apply size";
  const infoWrap = appendText(body, "div", "");
  note("Base species size: " + baseSize + ". Set a temporary override for powers or effects like Enlarge/Reduce.");
  let picked = current;
  const chips = appendText(body, "div", "");
  chips.className = "directChips";
  const sizes = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
  const renderChips = () => {
    infoWrap.replaceChildren();
    const info = SW5E_SIZE_RULES[picked] || SW5E_SIZE_RULES.Medium;
    renderFormulaBanner(infoWrap, sizeFormulaSpec(picked));
    renderFactGrid(infoWrap, [
      ["Selected size", picked + (picked !== baseSize ? " (base " + baseSize + ")" : " (species base)")],
      ["Combat space", info.space],
      ["Carrying weight", info.carry],
      ["Heavy weapons", info.heavy],
      ["Grapple / Shove", "Targets up to 1 size larger than you"],
      ["Squeezing", "Can fit through space 1 size smaller (2× movement cost, disadvantage on attacks and Dexterity saves, attacks against you have advantage)"]
    ], { compact: true });
    chips.replaceChildren();
    for (const sz of sizes) {
      const b = appendText(chips, "button", sz + (sz === baseSize ? " (Base)" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", String(picked === sz));
      b.addEventListener("click", () => { picked = sz; renderChips(); });
    }
  };
  renderChips();
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    dialog.close();
    const nextVal = picked === baseSize ? "" : picked;
    update(nextVal ? ("Size override: " + nextVal) : "Reset size to " + baseSize, next => {
      next.sizeOverride = nextVal;
    });
  });
  dialog.showModal();
}

function renderHealth(profile, session, effectCount) {
  const scores = effectiveScores(profile, session);
  const c = conditionState(session, profile);
  const armor = armorStats(profile, session);
  const traits = characterTraits(profile, session);
  const training = effectiveTraining(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const def = defenseProfile(profile, session);
  const sp = speciesRecord(profile.species);
  const ac = armor.value;
  const maximum = hitPointMaximum(profile, session);

  const _mcEntries = typeof characterClasses === "function" ? characterClasses(profile, session) : [];
  getElementById("formTitle").textContent = _mcEntries.length > 1
    ? (typeof formatClassSummary === "function" ? formatClassSummary(profile, session) : profile.className)
    : (session.approach || profile.className);
  const roleRoot = getElementById("formRole");
  roleRoot.replaceChildren();
  roleRoot.className = "dashMetaStrip muted";
  if (profile.background) appendText(roleRoot, "span", profile.background);
  const profBtn = appendText(roleRoot, "button", "Prof +" + (profile.proficiency || 2));
  profBtn.type = "button";
  profBtn.className = "dashMetaBtn";
  profBtn.setAttribute("aria-label", "Proficiency bonus +" + (profile.proficiency || 2));
  profBtn.addEventListener("click", ev => {
    const lvl = profile.level || 1;
    const prof = profile.proficiency || 2;
    showMathPopover(ev.currentTarget, "Proficiency Bonus", [
      ["Progression", "L1–4: +2 · L5–8: +3 · L9–12: +4 · L13–16: +5 · L17–20: +6"]
    ], "Added to proficient weapon attacks, proficient skills & saving throws, and your power/maneuver save DCs.", [], {
      rule: "floor((Level − 1) / 4) + 2",
      equation: "floor((" + lvl + " − 1) / 4) + 2",
      total: signed(prof)
    });
  });
  const castNow = typeof castingStats === "function" ? castingStats(profile, session) : null;
  if (castNow?.hasForce) {
    const fLabel = castNow.lightDC !== castNow.darkDC
      ? ("Force DC " + castNow.lightDC + "/" + castNow.darkDC)
      : ("Force DC " + castNow.forceDC);
    const fBtn = appendText(roleRoot, "button", fLabel);
    fBtn.type = "button";
    fBtn.className = "dashMetaBtn";
    fBtn.addEventListener("click", ev => {
      const prof = profile.proficiency || 2;
      const wisM = modifier(scores.Wisdom || 10);
      const chaM = modifier(scores.Charisma || 10);
      const splitForce = castNow.lightDC !== castNow.darkDC;
      const forceFormulas = splitForce ? [
        {
          label: "Light Side DC",
          rule: "8 + Proficiency + WIS",
          terms: [{ value: "8", raw: true }, { label: "Prof", value: signed(prof), signed: true }, { label: "WIS", value: signed(wisM), signed: true }],
          total: "DC " + castNow.lightDC
        },
        {
          label: "Dark Side DC",
          rule: "8 + Proficiency + CHA",
          terms: [{ value: "8", raw: true }, { label: "Prof", value: signed(prof), signed: true }, { label: "CHA", value: signed(chaM), signed: true }],
          total: "DC " + castNow.darkDC
        },
        {
          label: "Power Attack",
          rule: "Proficiency + Casting Mod",
          equation: "Light " + signed(prof) + " + WIS (" + signed(wisM) + ") = " + signed(castNow.lightAttack) + " · Dark " + signed(prof) + " + CHA (" + signed(chaM) + ") = " + signed(castNow.darkAttack)
        }
      ] : [
        {
          label: "Save DC",
          rule: "8 + Proficiency + " + (castNow.forceAbility || "Casting Mod").slice(0, 3).toUpperCase(),
          terms: [
            { value: "8", raw: true },
            { label: "Prof", value: signed(prof), signed: true },
            { label: (castNow.forceAbility || "WIS").slice(0, 3).toUpperCase(), value: signed(castNow.forceDC - 8 - prof), signed: true }
          ],
          total: "DC " + castNow.forceDC
        },
        {
          label: "Power Attack",
          rule: "Proficiency + " + (castNow.forceAbility || "Casting Mod").slice(0, 3).toUpperCase(),
          terms: [
            { label: "Prof", value: signed(prof), signed: true },
            { label: (castNow.forceAbility || "WIS").slice(0, 3).toUpperCase(), value: signed(castNow.forceAttack - prof), signed: true }
          ],
          total: signed(castNow.forceAttack)
        }
      ];
      showMathPopover(ev.currentTarget, "Forcecasting", [
        ["Universal DC", splitForce ? ("DC " + (castNow.universalForceDC || Math.max(castNow.lightDC || 0, castNow.darkDC || 0) || castNow.forceDC)) : ""],
        ["Ability", castNow.forceAbility || "Wisdom / Charisma"],
        ["Max power level", castNow.maxForceLevel ? "Level " + castNow.maxForceLevel : "At-will"]
      ], "Universal Force powers use whichever Forcecasting ability modifier is higher.", [], forceFormulas);
    });
  }
  if (castNow?.hasTech) {
    const tBtn = appendText(roleRoot, "button", "Tech DC " + castNow.techDC);
    tBtn.type = "button";
    tBtn.className = "dashMetaBtn";
    tBtn.addEventListener("click", ev => {
      const prof = profile.proficiency || 2;
      const abName = (castNow.techAbility || "Intelligence").slice(0, 3).toUpperCase();
      const castMod = castNow.techDC - 8 - prof;
      showMathPopover(ev.currentTarget, "Techcasting", [
        ["Ability", castNow.techAbility || "Intelligence"],
        ["Max power level", castNow.maxTechLevel ? "Level " + castNow.maxTechLevel : "At-will"]
      ], "Tech powers use a wristpad (or class-granted tools for Engineers) as a focus and spend Tech Points (short rest).", [], [
        {
          label: "Save DC",
          rule: "8 + Proficiency + " + abName,
          terms: [{ value: "8", raw: true }, { label: "Prof", value: signed(prof), signed: true }, { label: abName, value: signed(castMod), signed: true }],
          total: "DC " + castNow.techDC
        },
        {
          label: "Power Attack",
          rule: "Proficiency + " + abName,
          terms: [{ label: "Prof", value: signed(prof), signed: true }, { label: abName, value: signed(castNow.techAttack - prof), signed: true }],
          total: signed(castNow.techAttack)
        }
      ]);
    });
  }
  const _monkLvl = typeof classLevelOf === "function" ? classLevelOf(profile, "Monk") : (traits.isMonk ? (profile.level || 1) : 0);
  if (traits.isMonk && _monkLvl >= 2) {
    const prof = profile.proficiency || 2;
    const focusAb = typeof monkFocusAbility === "function" ? monkFocusAbility(profile, session, true) : "Wisdom";
    const focusMod = modifier(scores[focusAb] || 10);
    const focusDC = 8 + prof + focusMod;
    const focusAtk = prof + focusMod;
    const focusBtn = appendText(roleRoot, "button", "Focus DC " + focusDC);
    focusBtn.type = "button";
    focusBtn.className = "dashMetaBtn";
    focusBtn.addEventListener("click", ev => {
      const abShort = focusAb.slice(0, 3).toUpperCase();
      showMathPopover(ev.currentTarget, "Monk Focus", [
        ["Focus ability", focusAb],
        ["Recharge", "Short or long rest (30 minutes of meditation)"]
      ], "Used for Monk focus features such as Stunning Strike and focus attacks.", [], [
        {
          label: "Focus Save DC",
          rule: "8 + Proficiency + " + abShort,
          terms: [{ value: "8", raw: true }, { label: "Prof", value: signed(prof), signed: true }, { label: abShort, value: signed(focusMod), signed: true }],
          total: "DC " + focusDC
        },
        {
          label: "Focus Attack",
          rule: "Proficiency + " + abShort,
          terms: [{ label: "Prof", value: signed(prof), signed: true }, { label: abShort, value: signed(focusMod), signed: true }],
          total: signed(focusAtk)
        }
      ]);
    });
  }
  const inspBtn = appendText(roleRoot, "button", session.inspiration ? "Inspiration: On" : "Inspiration");
  inspBtn.type = "button";
  inspBtn.className = "dashMetaBtn inspirationBtn";
  inspBtn.setAttribute("aria-pressed", String(Boolean(session.inspiration)));
  inspBtn.addEventListener("click", () => update(session.inspiration ? "Spent Inspiration" : "Gained Inspiration", next => {
    next.inspiration = !next.inspiration;
  }));

  getElementById("hp").textContent = session.hp;
  getElementById("maximumHP").textContent = maximum;
  getElementById("temp").textContent = session.temp;
  getElementById("tempSource").textContent = session.tempSource;
  const hpRatio = maximum > 0 ? (session.hp / maximum) : 0;
  const hpBarEl = getElementById("hpbar");
  hpBarEl.style.width = (hpRatio * 100) + "%";
  hpBarEl.classList.toggle("is-mid", hpRatio > 0.25 && hpRatio <= 0.5);
  hpBarEl.classList.toggle("is-low", hpRatio <= 0.25);
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
  const addDefPill = (text, cls, onClick, ariaLabel) => {
    const el = appendText(defense, "button", text);
    el.type = "button";
    el.className = "defenseFact " + cls;
    if (ariaLabel) el.setAttribute("aria-label", ariaLabel);
    el.addEventListener("click", onClick);
    return el;
  };
  const concList = typeof activeConcentrations === "function" ? activeConcentrations(session) : [session.concentration, session.concentration2].filter(Boolean);
  const isDualConc = concList.length >= 2;
  const dualCombinedLevels = isDualConc ? concList.reduce((sum, name) => {
    const eff = (session.effects || []).find(e => e.fromConcentration && normalizeName(e.name) === normalizeName(name));
    const p = typeof powerRule === "function" ? powerRule(name) : null;
    return sum + Number(eff?.castLevel ?? p?.level ?? 0);
  }, 0) : 0;
  for (const concName of concList) {
    addDefPill((isDualConc ? "Dual Conc: " : "Concentrating: ") + concName, "is-concentration", ev => {
      const pwr = typeof powerRule === "function" ? powerRule(concName) : null;
      const conSave = savingThrowTotal(profile, session, "Constitution", c, effMods);
      const facts = [
        ["Power", typeof createRuleLink === "function" ? createRuleLink(concName, { kind: "power", name: concName }, { profile, session }) : concName],
        ["Duration", pwr?.duration || "Concentration"],
        ...(isDualConc ? [
          ["Other active power", concList.find(n => n !== concName) || ""],
          ["End-of-turn save", "Constitution save DC 10 + complete rounds (Action each round to maintain)"]
        ] : [])
      ];
      const actions = [];
      if (pwr && typeof showPowerInfo === "function") {
        actions.push({ label: "Full power rules", onClick: () => showPowerInfo(pwr) });
      }
      actions.push({
        label: isDualConc ? ("Drop " + concName) : "Drop concentration",
        cls: "hpDamage",
        onClick: () => update("Ended concentration on " + concName, next => {
          if (typeof endConcentration === "function") endConcentration(next, concName);
          else next.concentration = "";
        })
      });
      if (isDualConc) {
        actions.push({
          label: "Drop both",
          cls: "hpDamage",
          onClick: () => update("Ended dual concentration", next => {
            if (typeof endConcentration === "function") endConcentration(next);
            else { next.concentration = ""; next.concentration2 = ""; }
          })
        });
      }
      const dmgBaseDC = isDualConc ? (10 + dualCombinedLevels) : 10;
      const dualEffInfo = isDualConc && typeof resolveCastingEffects === "function" ? resolveCastingEffects(profile, session) : null;
      const dualPopoverText = dualEffInfo?.dualConcentrationNote
        ? ((dualEffInfo.dualConcentrationSource ? dualEffInfo.dualConcentrationSource + ": " : "") + dualEffInfo.dualConcentrationNote)
        : "Spend your Action each round to maintain both powers; end-of-turn Constitution saving throw (DC 10 + complete rounds) or drop one as a free action. Failing a concentration saving throw ends both powers.";
      showMathPopover(ev.currentTarget, isDualConc ? "Dual Concentration" : "Concentration", facts, isDualConc
        ? dualPopoverText
        : "Casting another concentration power, becoming Incapacitated, or failing a Constitution saving throw after taking damage ends concentration.", actions, {
        rule: "max(" + dmgBaseDC + ", floor(Damage / 2))",
        equation: "Constitution save " + signed(conSave.total) + " vs DC max(" + dmgBaseDC + ", floor(Damage / 2))"
      });
    }, "Inspect or drop concentration on " + concName);
  }
  const carryNow = typeof carryingStats === "function" ? carryingStats(profile, session) : null;
  const openCarryPopover = trigger => {
    if (!carryNow) return;
    const nextMode = carryNow.mode === "variant" ? "Standard" : "Variant";
    const strScore = scores.Strength || 10;
    const baseCap = strScore * 15;
    const totalMult = baseCap > 0 ? +(carryNow.capacity / baseCap).toFixed(2) : 1;
    const carryFormula = {
      rule: carryNow.mode === "variant"
        ? "STR × 15 × Size/Feature Mult (Variant: ×5 Encumbered · ×10 Heavy · ×30 Max Load)"
        : "STR × 15 × Size Mult × Feature Mult (Max Load ×30)",
      equation: "STR " + strScore + " × 15" + (totalMult !== 1 ? (" × " + totalMult) : ""),
      total: carryNow.capacity + " lb"
    };
    showMathPopover(trigger, "Carrying & Encumbrance", [
      ["Carried weight", carryNow.carried + " lb"],
      ["Mode", carryNow.mode === "variant" ? "Variant (5× / 10× / 15× STR)" : "Standard (15× STR)"],
      ["Encumbered at", carryNow.mode === "variant" ? carryNow.encumberedAt + " lb (−10 ft)" : "—"],
      ["Heavily encumbered", carryNow.mode === "variant" ? carryNow.heavilyEncumberedAt + " lb (−20 ft, Disadv. STR/DEX/CON)" : "—"],
      ["Carrying capacity", carryNow.capacity + " lb (over: 5 ft max)"],
      ["Push / Drag / Lift", carryNow.maxLoad + " lb (over: 0 ft)"]
    ], "Store items in Inventory to exclude them from carried weight.", [
      {
        label: "Switch to " + nextMode,
        onClick: () => update("Switched encumbrance mode", next => {
          next.encumbranceMode = next.encumbranceMode === "standard" ? "variant" : "standard";
        })
      }
    ], carryFormula);
  };
  if (carryNow?.overloaded) {
    addDefPill("Overloaded (" + carryNow.carried + "/" + carryNow.maxLoad + " lb · 0 ft)", "is-vulnerability", ev => openCarryPopover(ev.currentTarget), "View carrying capacity breakdown");
  } else if (carryNow?.overCapacity) {
    addDefPill("Over capacity (" + carryNow.carried + "/" + carryNow.capacity + " lb · 5 ft)", "is-vulnerability", ev => openCarryPopover(ev.currentTarget), "View carrying capacity breakdown");
  } else if (carryNow?.heavilyEncumbered) {
    addDefPill("Heavily encumbered (−20 ft · Disadvantage on Strength, Dexterity, and Constitution)", "is-vulnerability", ev => openCarryPopover(ev.currentTarget), "View carrying capacity breakdown");
  } else if (carryNow?.encumbered) {
    addDefPill("Encumbered (−10 ft)", "is-bonus", ev => openCarryPopover(ev.currentTarget), "View carrying capacity breakdown");
  }
  if (def.vulnerabilities?.length) {
    addDefPill("Vulnerable: " + def.vulnerabilities.join(", "), "is-vulnerability", ev => {
      const defEff = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
      const facts = def.vulnerabilities.map(v => {
        const srcs = [];
        const seenS = new Set();
        const addSrc = (lbl, srcObj) => {
          const k = normalizeName(lbl);
          if (!k || seenS.has(k)) return;
          seenS.add(k);
          srcs.push({ label: lbl, source: srcObj || lbl });
        };
        if ((sp?.vulnerabilities || []).some(x => x.toLowerCase() === v.toLowerCase())) addSrc(profile.species, { kind: "species", name: profile.species });
        for (const r of (defEff?.vulnerabilities || [])) if (r.damageType?.toLowerCase() === v.toLowerCase()) addSrc(r.source, r.sourceObj || r.source);
        return [v.charAt(0).toUpperCase() + v.slice(1), srcs.length ? (typeof renderSourceLinks === "function" ? renderSourceLinks(srcs, { profile, session }) : srcs.map(s => s.label).join(", ")) : "Species / Active effect"];
      });
      showMathPopover(ev.currentTarget, "Damage Vulnerabilities", facts, "SW5e Player's Handbook Ch. 9: Vulnerability doubles damage taken after flat reductions (such as Absorptive armor) and before active reactions like Parry.");
    }, "View vulnerability sources and rules");
  }
  if (hasResistance) {
    addDefPill("Resists: " + (c.petrified ? "all damage" : def.resistances.join(", ")), "is-resistance", ev => {
      const defEff = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
      const list = c.petrified ? ["all damage"] : def.resistances;
      const facts = list.map(rName => {
        const srcs = [];
        const seenS = new Set();
        const addSrc = (lbl, srcObj) => {
          const k = normalizeName(lbl);
          if (!k || seenS.has(k)) return;
          seenS.add(k);
          srcs.push({ label: lbl, source: srcObj || lbl });
        };
        if (c.petrified) addSrc("Petrified", { kind: "condition", name: "Petrified" });
        if (session.rage && (rName === "kinetic" || rName === "energy" || (profile.dewback || []).includes(rName))) addSrc("Rage", { kind: "classFeature", name: "Rage", className: "Berserker" });
        if ((sp?.resistances || []).some(x => x.toLowerCase() === rName.toLowerCase())) addSrc(profile.species, { kind: "species", name: profile.species });
        for (const r of (defEff?.resistances || [])) if (r.damageType?.toLowerCase() === rName.toLowerCase()) addSrc(r.source, r.sourceObj || r.source);
        return [rName.charAt(0).toUpperCase() + rName.slice(1), srcs.length ? (typeof renderSourceLinks === "function" ? renderSourceLinks(srcs, { profile, session }) : srcs.map(s => s.label).join(", ")) : "Feature / Active effect"];
      });
      showMathPopover(ev.currentTarget, "Damage Resistances", facts, "SW5e Player's Handbook Ch. 9: Resistance halves damage (rounded down) after flat modifiers like Absorptive or Defense Mastery. Multiple resistances to the same type do not stack.");
    }, "View resistance sources and rules");
  }
  if (def.immunities.length) {
    addDefPill("Immune: " + def.immunities.join(", "), "is-immunity", ev => {
      const defEff = typeof resolveDefenseEffects === "function" ? resolveDefenseEffects(profile, session) : null;
      const facts = def.immunities.map(imName => {
        const srcs = [];
        const seenS = new Set();
        const addSrc = (lbl, srcObj) => {
          const k = normalizeName(lbl);
          if (!k || seenS.has(k)) return;
          seenS.add(k);
          srcs.push({ label: lbl, source: srcObj || lbl });
        };
        if ((sp?.immunities || []).some(x => x.toLowerCase() === imName.toLowerCase())) addSrc(profile.species, { kind: "species", name: profile.species });
        for (const r of (defEff?.immunities || [])) if (r.damageType?.toLowerCase() === imName.toLowerCase()) addSrc(r.source, r.sourceObj || r.source);
        return [imName.charAt(0).toUpperCase() + imName.slice(1), srcs.length ? (typeof renderSourceLinks === "function" ? renderSourceLinks(srcs, { profile, session }) : srcs.map(s => s.label).join(", ")) : "Species / Feature / Active effect"];
      });
      showMathPopover(ev.currentTarget, "Immunities", facts, "You take 0 damage from listed damage types and cannot suffer listed conditions.");
    }, "View immunity sources");
  }
  if (def.senses.length) {
    addDefPill("Senses: " + def.senses.join(", "), "is-senses", ev => {
      const facts = def.senses.map(sn => [sn, _senseExplanation(sn)]);
      showMathPopover(ev.currentTarget, "Special Senses", facts, "Passive Perception (" + passivePerc + ") and Passive Investigation (" + passiveInv + ") apply within your visible/sensory range.");
    }, "View special senses definitions");
  }
  if (def.rollModifiers.length) {
    addDefPill("Active bonuses: " + def.rollModifiers.join("; "), "is-bonus", ev => {
      const facts = def.rollModifiers.map((m, i) => ["Modifier " + (i + 1), m]);
      showMathPopover(ev.currentTarget, "Active Roll Modifiers", facts, "Granted by your currently active effects, powers, maneuvers, or features.");
    }, "View active roll modifiers");
  }
  const zeroHp = typeof resolveZeroHpStoppers === "function" ? resolveZeroHpStoppers(profile, session) : null;
  if (zeroHp?.ready?.length) {
    const zLabel = zeroHp.ready.length === 1
      ? ("0 HP: " + zeroHp.ready[0].name)
      : ("0 HP stoppers (" + zeroHp.ready.length + " ready)");
    addDefPill(zLabel, "is-bonus", ev => {
      const facts = zeroHp.ready.map(s => {
        let status = s.mode === "auto" ? "Auto-triggers at 0 HP" : "Prompts at 0 HP";
        if (s.maxUses != null) status += " (" + s.remaining + "/" + s.maxUses + " left)";
        else if (s.saveDCBase) status += " (DC " + s.currentSaveDC + " " + (s.saveAbility || "Constitution") + " save)";
        else if (s.pointPool) status += " (" + (s.pointCost === "all" ? ("all " + s.availablePoints) : s.pointCost) + " " + s.pointPool + " pts)";
        else if (s.consumeEffect) status += " (ends " + s.consumeEffect + ")";
        const zText = status + (s.note ? " — " + s.note : "");
        if (typeof createRuleLink === "function" && s.source) {
          const wrap = document.createElement("span");
          wrap.append(createRuleLink(s.source.name || s.name, s.source, { profile, session }), document.createTextNode(" · " + zText));
          return [s.name, wrap];
        }
        return [s.name, zText];
      });
      showMathPopover(ev.currentTarget, "Reduced-to-0 HP Stoppers", facts, "Automatic stoppers trigger when damage reduces you to 0 HP (not killed outright) and disappear here once spent until restored.");
    }, "View ready reduced-to-0 HP stoppers");
  }
  const traitOaDisadv = Boolean(typeof resolveDefenseEffects === "function" && resolveDefenseEffects(profile, session).combatTraits.some(ct => ct.kind === "oaDisadvantage"));
  const anyOaDisadv = Boolean(effMods.oaDisadvantage || traitOaDisadv);
  const heavyCritImmune = Boolean(traits.armorExpertHeavyCritImmune && armor.heavy);
  const incomingAdvantage = c.incomingAdvantage || session.reckless;
  if (incomingAdvantage || c.incomingDisadvantage || anyOaDisadv || c.prone || c.nearbyCritical || heavyCritImmune) {
    const line = appendText(defense, "button", "Incoming attacks");
    line.type = "button";
    line.className = "defenseFact " + (incomingAdvantage || c.nearbyCritical ? "is-vulnerability" : "is-resistance");
    displayRollBadge(line, incomingAdvantage, c.incomingDisadvantage, c.prone || anyOaDisadv || heavyCritImmune);
    const advList = [
      ...(session.reckless ? ["Reckless Attack"] : []),
      ...(c.incomingAdvantageSources || [])
    ];
    const disadvList = [...(c.incomingDisadvantageSources || [])];
    const lkInc = txt => (typeof _linkTextSources === "function" ? _linkTextSources(txt, profile, session) : txt);
    line.addEventListener("click", ev => showMathPopover(ev.currentTarget, "Incoming attacks", [
      ["Advantage", incomingAdvantage ? lkInc(advList.join(", ") || "Active conditions") : ""],
      ["Disadvantage", c.incomingDisadvantage ? lkInc(disadvList.join(", ") || "Active defense / visibility effect") : ""],
      ["Opportunity attacks", anyOaDisadv ? "Disadvantage against you" : ""],
      ["Prone", c.prone ? "Advantage within 5 ft. Disadvantage farther away." : ""],
      ["Critical hits", heavyCritImmune ? ("Critical hits against you are treated as normal hits (" + (traits.armorExpertSource || "Heavy Armor Mastery") + ").") : (c.nearbyCritical ? "A hit from within 5 ft is critical." : "")]
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
  const initEff = typeof resolveInitiativeEffects === "function" ? resolveInitiativeEffects(profile, session) : { bonus: 0, advantage: false, proficiency: false, abilityAdds: [], abilityOverrides: [], dice: [], notes: [], sources: [] };
  let initAbility = "Dexterity";
  let initOverrideSource = "";
  let effInitMod = dexMod;
  if (effMods.initiativeForceMod && forceInitMod >= effInitMod) {
    initAbility = forceInitAbility;
    initOverrideSource = "Force Intuition";
    effInitMod = forceInitMod;
  }
  for (const ov of initEff.abilityOverrides || []) {
    const ab = String(ov.ability || "");
    const isForceAb = ab.toLowerCase() === "forcecasting";
    const resolvedAb = isForceAb ? (castingStats(profile, session).forceAbility || "Wisdom") : ab;
    const cand = isForceAb ? Math.max(effectiveModifier(profile, session, "Wisdom", c), effectiveModifier(profile, session, "Charisma", c)) : effectiveModifier(profile, session, resolvedAb, c);
    if (ov.mode === "replace" || cand > effInitMod) {
      effInitMod = cand;
      initAbility = resolvedAb;
      initOverrideSource = ov.source || "Feature";
    }
  }
  const ledByForceInit = (traits.isSentinel && !traits.alert) ? Math.floor((profile.proficiency || 2) / 2) : 0;
  const effInitProf = (traits.alert || initEff.proficiency) ? profile.proficiency : ledByForceInit;
  const effInitAbilityAdd = initEff.abilityAdds.reduce((sum, a) => sum + modifier(scores[a.ability] || 10), 0);
  const manualInitMod = Number(session.statModifiers?.initiative) || 0;
  const initBase = (profile.initiativeOverride ??
    (effInitMod + effInitProf + (profile.initiativeBonus || 0))) + (effMods.initiativeFlatBonus || 0) + (initEff.bonus || 0) + effInitAbilityAdd + manualInitMod;
  const initMode = checkMode(profile, session, initAbility, null, armor);
  if (effMods.initiativeAdv) {
    initMode.advantage = dedupeSources([initMode.advantage, "Active power"].filter(Boolean)).join(", ");
  }
  if (initEff.advantage) {
    const srcList = (initEff.advantageSources && initEff.advantageSources.length) ? initEff.advantageSources : ["Feature"];
    initMode.advantage = dedupeSources([initMode.advantage, ...srcList].filter(Boolean)).join(", ");
  }
  const percSkEff = typeof resolveSkillEffects === "function" ? resolveSkillEffects(profile, session, "Perception", "Wisdom", c) : null;
  const invSkEff = typeof resolveSkillEffects === "function" ? resolveSkillEffects(profile, session, "Investigation", "Intelligence", c) : null;
  const percPassiveBonus = percSkEff ? (percSkEff.passiveBonus || 0) : (traits.passiveBonus || 0);
  const invPassiveBonus = invSkEff ? (invSkEff.passiveBonus || 0) : (traits.passiveBonus || 0);
  const manualPercMod = Number(session.statModifiers?.passivePerception) || 0;
  const manualInvMod = Number(session.statModifiers?.passiveInvestigation) || 0;
  const ledByForcePerc = (!training.Perception && (traits.isSentinel || percSkEff?.halfProficiency)) ? Math.floor((profile.proficiency || 2) / 2) : 0;
  const ledByForceInv = (!training.Investigation && (traits.isSentinel || invSkEff?.halfProficiency)) ? Math.floor((profile.proficiency || 2) / 2) : 0;
  const passivePerc = 10 + effectiveModifier(profile, session, "Wisdom", c) + (training.Perception || 0) * profile.proficiency + ledByForcePerc + percPassiveBonus + manualPercMod;
  const passiveInv = 10 + effectiveModifier(profile, session, "Intelligence", c) + (training.Investigation || 0) * profile.proficiency + ledByForceInv + invPassiveBonus + manualInvMod;

  const speedNotes = [
    c.prone ? "Standing up from Prone costs half your speed." : "",
    ...(spd.notes || [])
  ].filter(Boolean).join("\n");

  const acFacts = () => {
    const p = app.character.profile, s = app.character.session;
    const a = armorStats(p, s);
    const armVal = a.armor?.name
      ? (typeof createRuleLink === "function" ? createRuleLink(a.armor.name, { kind: "equipment", name: a.armor.name }, { profile: p, session: s }) : a.armor.name)
      : (a.unarmoredLabel && typeof createRuleLink === "function" ? createRuleLink(a.unarmoredLabel, a.unarmoredLabel, { profile: p, session: s }) : a.unarmoredLabel);
    const shVal = a.shield?.name
      ? (typeof createRuleLink === "function" ? createRuleLink(a.shield.name, { kind: "equipment", name: a.shield.name }, { profile: p, session: s }) : a.shield.name)
      : "";
    const effVal = a.effectSources.length
      ? (typeof _linkTextSources === "function" ? _linkTextSources(a.effectSources.join(", "), p, s) : a.effectSources.join(", "))
      : "";
    return [
      ["Armor", armVal],
      ["Shield", shVal],
      ["Active effects", effVal],
      ["Export adjustment", p.acBonus ? signed(p.acBonus) : ""],
      ["Export override", p.acOverride]
    ];
  };
  const speedFacts = () => {
    const p = app.character.profile, s = app.character.session;
    const cond = conditionState(s, p);
    const sp2 = speedBreakdown(p, s, cond);
    return [
      ["Walking speed", sp2.live + " ft (base " + sp2.speciesBase + " ft · " + p.species + ")"],
      ["Climbing speed", sp2.modes.climb ? sp2.modes.climb + " ft" : ""],
      ["Swimming speed", sp2.modes.swim ? sp2.modes.swim + " ft" : ""],
      ["Flying speed", sp2.modes.fly ? sp2.modes.fly + " ft" : ""],
      ["Burrowing speed", sp2.modes.burrow ? sp2.modes.burrow + " ft" : ""],
      ["Crawling speed", sp2.modes.crawl ? sp2.modes.crawl + " ft" : ""],
      ["Unarmored Movement", sp2.unarmoredBonus ? ("+" + sp2.unarmoredBonus + " ft" + (((typeof classLevelOf === "function" ? classLevelOf(p, "Monk") : (normalizeName(p.className) === "monk" ? (p.level || 1) : 0)) >= 9) ? " (vertical surfaces & liquids)" : "")) : ""],
      ["Feats", sp2.featSources.length ? (typeof _linkTextSources === "function" ? _linkTextSources(sp2.featSources.join(", "), p, s) : sp2.featSources.join(", ")) : ""],
      ["Active effects", sp2.effectSources.length ? (typeof _linkTextSources === "function" ? _linkTextSources(sp2.effectSources.join(", "), p, s) : sp2.effectSources.join(", ")) : ""],
      ["Armor strength penalty", sp2.armorPenalty ? "−" + sp2.armorPenalty + " ft" : ""],
      ["Carrying weight", sp2.overloaded ? "Overloaded (0 ft)" : sp2.overCapacity ? "Over capacity (maximum 5 ft)" : sp2.heavilyEncumbered ? "Heavily encumbered (−20 ft, Disadvantage)" : sp2.encumbered ? "Encumbered (−10 ft)" : ""],
      ["Slowed levels", cond.slowed ? (cond.slowed === 4 ? "4 (0 ft, no speed bonuses)" : cond.slowed + " (−" + (sp2.slowedStep ? (cond.slowed * sp2.slowedStep) : [0, 15, 25, 30][cond.slowed]) + " ft)") : ""],
      ["Movement blocked", cond.speedZero && cond.speedZeroSources?.length ? (typeof _linkTextSources === "function" ? _linkTextSources(cond.speedZeroSources.join(", "), p, s) : cond.speedZeroSources.join(", ")) : ""]
    ];
  };
  const initFacts = () => {
    const p = app.character.profile, s = app.character.session;
    const lk = txt => (typeof _linkTextSources === "function" ? _linkTextSources(txt, p, s) : txt);
    return [
      ["Ability override", initOverrideSource ? lk(initOverrideSource + " (" + initAbility + ")") : ""],
      ["Active effects", effMods.initiativeFlatSources?.length ? lk(effMods.initiativeFlatSources.join(", ")) : ""],
      ["Power dice", effMods.initiativeDice?.length ? effMods.initiativeDice.join(", ") : ""],
      ["Features", initEff.notes?.length ? initEff.notes.join("; ") : ""],
      ["Alert", traits.alert ? (typeof createRuleLink === "function" ? createRuleLink("Alert (Proficient)", { kind: "feat", name: "Alert" }, { profile: p, session: s }) : "Proficient") : ""],
      ["Led by the Force", ledByForceInit && !traits.alert && !initEff.proficiency ? "½ proficiency on ability checks" : ""],
      ["Advantage", lk(initMode.advantage)],
      ["Disadvantage", lk(initMode.disadvantage)]
    ];
  };
  const percFacts = () => [
    ["Training", training.Perception ? (training.Perception === 2 ? "Expertise" : "Proficient") : (ledByForcePerc ? (traits.isSentinel ? "Half proficiency (Led by the Force)" : "Half proficiency") : "Not proficient")],
    ["Passive bonus", percPassiveBonus ? signed(percPassiveBonus) : ""]
  ];
  const invFacts = () => [
    ["Training", training.Investigation ? (training.Investigation === 2 ? "Expertise" : "Proficient") : (ledByForceInv ? (traits.isSentinel ? "Half proficiency (Led by the Force)" : "Half proficiency") : "Not proficient")],
    ["Passive bonus", invPassiveBonus ? signed(invPassiveBonus) : ""]
  ];

  const acFormula = () => {
    const p = app.character.profile, s = app.character.session;
    const a = armorStats(p, s);
    const fp = a.formulaParts || {};
    const terms = [];
    let rule = "10 + DEX";
    if (fp.acOverride !== null && fp.acOverride !== undefined) {
      rule = "Override + Effects + Manual";
      terms.push({ label: "Override", value: String(fp.acOverride) });
    } else if (a.armor) {
      const hasDex = /Dex modifier/i.test(a.armor.ac || "");
      rule = hasDex
        ? (Number.isFinite(fp.dexLimit) ? ("Armor Base + DEX (max +" + fp.dexLimit + ")" + (a.shield ? " + Shield" : "")) : ("Armor Base + DEX" + (a.shield ? " + Shield" : "")))
        : ("Armor Base" + (a.shield ? " + Shield" : ""));
      terms.push({ label: a.armor.name, value: String(fp.base) });
      if (hasDex) {
        const capNote = Number.isFinite(fp.dexLimit) && fp.dex > fp.dexLimit ? " capped" : "";
        terms.push({ label: "DEX" + capNote, value: signed(fp.armorDex), signed: true });
      }
    } else if (fp.allowUnarmored && fp.unarmoredAbility) {
      const abShort = fp.unarmoredAbility.slice(0, 3).toUpperCase();
      rule = "10 + DEX + " + abShort + (a.shield ? " + Shield" : "");
      terms.push({ label: "Unarmored", value: "10" });
      terms.push({ label: "DEX", value: signed(fp.dex), signed: true });
      terms.push({ label: abShort, value: signed(fp.unarmoredExtra), signed: true });
    } else {
      rule = (a.unarmoredLabel || "10 + DEX") + (a.shield ? " + Shield" : "");
      if (fp.base === 10 + (fp.dex || 0)) {
        terms.push({ label: "Unarmored", value: "10" });
        terms.push({ label: "DEX", value: signed(fp.dex || 0), signed: true });
      } else {
        terms.push({ label: "Base", value: String(fp.base) });
      }
    }
    if (fp.shieldBonus) terms.push({ label: "Shield", value: signed(fp.shieldBonus), signed: true });
    if (fp.speciesACBonus) terms.push({ label: p.species || "Species", value: signed(fp.speciesACBonus), signed: true });
    if (fp.exportBonus) terms.push({ label: "Export", value: signed(fp.exportBonus), signed: true });
    if (fp.allEffectBonus) terms.push({ label: (a.effectSources?.length ? a.effectSources.join(", ") : "Active Effects"), value: signed(fp.allEffectBonus), signed: true });
    if (fp.manualACMod) terms.push({ label: "Manual", value: signed(fp.manualACMod), signed: true });
    return { rule, terms, total: String(a.value) };
  };

  const speedFormula = () => {
    const p = app.character.profile, s = app.character.session;
    const cond = conditionState(s, p);
    const sp2 = speedBreakdown(p, s, cond);
    const manualSpd = Number(s.statModifiers?.speed) || 0;
    const terms = [{ label: "Base", value: sp2.speciesBase + " ft" }];
    if (sp2.unarmoredBonus) terms.push({ label: "Unarmored", value: "+" + sp2.unarmoredBonus + " ft" });
    if (sp2.featBonus) terms.push({ label: (sp2.featSources?.length ? sp2.featSources.join(", ") : "Feats"), value: signed(sp2.featBonus) + " ft" });
    if (sp2.effectBonus) terms.push({ label: (sp2.effectSources?.length ? sp2.effectSources.join(", ") : "Active Effects"), value: signed(sp2.effectBonus) + " ft" });
    if (sp2.armorPenalty) terms.push({ label: "Armor Strength", value: "−" + sp2.armorPenalty + " ft" });
    if (sp2.heavilyEncumbered) terms.push({ label: "Heavily encumbered", value: "−20 ft" });
    else if (sp2.encumbered) terms.push({ label: "Encumbered", value: "−10 ft" });
    if (cond.speedZero) {
      terms.push({ label: (cond.speedZeroSources?.length ? cond.speedZeroSources.join(", ") : "Immobilized"), value: "0 ft" });
    } else if (cond.slowed === 4) {
      terms.push({ label: (cond.restrained ? "Restrained (Slowed 4)" : "Slowed 4"), value: "0 ft" });
    } else if (cond.slowed > 0) {
      const slowPen = sp2.slowedStep ? (cond.slowed * sp2.slowedStep) : [0, 15, 25, 30][cond.slowed];
      terms.push({ label: "Slowed " + cond.slowed, value: "−" + slowPen + " ft" });
    }
    if (manualSpd) terms.push({ label: "Manual", value: signed(manualSpd) + " ft" });
    return {
      rule: "Species Base + Bonuses − Penalties",
      terms,
      total: sp2.live + " ft"
    };
  };

  const initFormula = () => {
    const s = app.character.session;
    const curManual = Number(s.statModifiers?.initiative) || 0;
    const liveTotal = initBase - manualInitMod + curManual;
    const terms = [];
    if (profile.initiativeOverride !== null && profile.initiativeOverride !== undefined) {
      terms.push({ label: "Override", value: signed(profile.initiativeOverride), signed: true });
    } else {
      terms.push({ label: initAbility.slice(0, 3).toUpperCase(), value: signed(effInitMod), signed: true });
      if (effInitProf) terms.push({ label: (traits.alert || initEff.proficiency) ? "Prof" : "½ Prof", value: signed(effInitProf), signed: true });
      if (profile.initiativeBonus) terms.push({ label: "Export", value: signed(profile.initiativeBonus), signed: true });
    }
    const effFlat = (effMods.initiativeFlatBonus || 0) + (initEff.bonus || 0) + effInitAbilityAdd;
    if (effFlat) terms.push({ label: (effMods.initiativeFlatSources?.length ? effMods.initiativeFlatSources.join(", ") : "Active Effects"), value: signed(effFlat), signed: true });
    if (curManual) terms.push({ label: "Manual", value: signed(curManual), signed: true });
    const diceTag = (effMods.initiativeDice?.length || initEff.dice?.length) ? (" " + ((effMods.initiativeDice?.[0] || initEff.dice?.[0]).split(" ")[0])) : "";
    return {
      rule: "Ability Mod + Proficiency (if any) + Bonuses",
      terms,
      total: signed(liveTotal) + diceTag
    };
  };

  const passiveFormula = (skillName, abilityName, basePassive, origManual, pBonus, statKey) => () => {
    const p = app.character.profile, s = app.character.session;
    const cond = conditionState(s, p);
    const abMod = effectiveModifier(p, s, abilityName, cond);
    const rank = training[skillName] || 0;
    const curManual = Number(s.statModifiers?.[statKey]) || 0;
    const liveTotal = basePassive - origManual + curManual;
    const terms = [
      { value: "10", raw: true },
      { label: abilityName.slice(0, 3).toUpperCase(), value: signed(abMod), signed: true }
    ];
    if (rank === 2) terms.push({ label: "Expertise", value: signed(2 * p.proficiency), signed: true });
    else if (rank === 1) terms.push({ label: "Prof", value: signed(p.proficiency), signed: true });
    if (pBonus) terms.push({ label: "Passive Feature", value: signed(pBonus), signed: true });
    if (curManual) terms.push({ label: "Manual", value: signed(curManual), signed: true });
    return {
      rule: "10 + " + abilityName.slice(0, 3).toUpperCase() + " + Training + Bonuses",
      terms,
      total: String(liveTotal)
    };
  };

  const statItems = [
    { label: "AC", value: ac, statKey: "ac", title: "Armor Class", getFacts: acFacts, getFormula: acFormula, note: "" },
    { label: "Speed", value: spd.live + " ft", statKey: "speed", step: 5, unit: " ft", title: "Speed & movement", getFacts: speedFacts, getFormula: speedFormula, note: speedNotes },
    { label: "Initiative", value: signed(initBase) + ((effMods.initiativeDice?.length || initEff.dice?.length) ? " " + ((effMods.initiativeDice?.[0] || initEff.dice?.[0]).split(" ")[0]) : ""), statKey: "initiative", title: "Initiative", getFacts: initFacts, getFormula: initFormula, note: traits.alert ? "Alert: You cannot be surprised while conscious." : "", badgeMode: initMode },
    {
      label: "Size",
      value: (session.sizeOverride || sp?.size || "Medium") + (session.sizeOverride ? " *" : ""),
      isSize: true,
      title: "Creature Size"
    },
    { label: "Passive Perception", value: passivePerc, statKey: "passivePerception", title: "Passive Perception", getFacts: percFacts, getFormula: passiveFormula("Perception", "Wisdom", passivePerc, manualPercMod, percPassiveBonus, "passivePerception"), note: "" },
    { label: "Passive Investigation", value: passiveInv, statKey: "passiveInvestigation", title: "Passive Investigation", getFacts: invFacts, getFormula: passiveFormula("Investigation", "Intelligence", passiveInv, manualInvMod, invPassiveBonus, "passiveInvestigation"), note: "" }
  ];

  const speedSub = speedTileSubtext(spd, c);
  for (const item of statItems) {
    const isAdjusted = item.isSize ? Boolean(session.sizeOverride) : Boolean(item.statKey && Number(session?.statModifiers?.[item.statKey]));
    const pair = appendText(list, "div", "");
    if (isAdjusted) pair.className = "is-adjusted";
    appendText(pair, "dt", item.label);
    const description = appendText(pair, "dd", "");
    if (item.statKey || item.isSize) {
      const wrap = appendText(description, "span", "");
      wrap.className = "statRowInline";
      const valBtn = appendText(wrap, "button", String(item.value));
      valBtn.type = "button";
      valBtn.className = "detailName" + (isAdjusted ? " is-adjusted" : "");
      valBtn.setAttribute("aria-label", item.label + " " + item.value + (isAdjusted ? " (adjusted)" : "") + ". Inspect formula or adjust " + item.label + ".");
      if (isAdjusted) {
        const mark = appendText(valBtn, "span", "*");
        mark.className = "adjustedMark";
        mark.setAttribute("aria-hidden", "true");
      }
      if (item.badgeMode) displayRollBadge(valBtn, item.badgeMode.advantage, item.badgeMode.disadvantage);
      valBtn.addEventListener("click", ev => {
        if (item.isSize) return openSizeOverrideModal(ev.currentTarget);
        openStatModifierModal({
          title: item.title,
          statKey: item.statKey,
          step: item.step || 1,
          unit: item.unit || "",
          getFacts: item.getFacts,
          getFormula: item.getFormula,
          noteText: item.note,
          trigger: ev.currentTarget
        });
      });
    } else {
      description.textContent = String(item.value);
    }
    if (item.label === "Speed" && speedSub) {
      appendText(description, "small", speedSub).className = "statSub";
    }
  }

  const abRoot = getElementById("abilityScores");
  if (abRoot) {
    abRoot.replaceChildren();
    for (const ability of abilities) {
      const val = scores[ability];
      const m = modifier(val);
      const manualAdj = (Number(session.statModifiers?.["ability:" + ability]) || 0) + (Number(session.abilityAdjustments?.[ability]) || 0);
      const abFacts = () => {
        const p = app.character.profile, s = app.character.session;
        const baseVal = (p.baseScores || p.scores || {})[ability] || 10;
        const live = effectiveScores(p, s)[ability];
        const featSrc = (s.feats || [])
          .filter(f => {
            const rule = featRule(f.name);
            const chosen = f.abilityChoice || (rule?.attributes?.length === 1 ? rule.attributes[0] : "");
            return chosen === ability || (rule?.choiceSpec?.kind === "savingThrow" && f.choice === ability);
          })
          .map(f => f.name + " (+1)");
        const adj = (Number(s.statModifiers?.["ability:" + ability]) || 0) + (Number(s.abilityAdjustments?.[ability]) || 0);
        const featVal = featSrc.length && typeof renderSourceLinks === "function"
          ? renderSourceLinks(featSrc.map(fs => { const nm = fs.replace(/\s*\(\+1\)$/, ""); return { label: nm, source: { kind: "feat", name: nm }, suffix: " (+1)" }; }), { profile: p, session: s })
          : featSrc.join(", ");
        return [
          ["Feat bonuses", featVal]
        ];
      };
      const abFormula = () => {
        const p = app.character.profile, s = app.character.session;
        const baseVal = (p.baseScores || p.scores || {})[ability] || 10;
        const live = effectiveScores(p, s)[ability];
        const adj = (Number(s.statModifiers?.["ability:" + ability]) || 0) + (Number(s.abilityAdjustments?.[ability]) || 0);
        const featDelta = live - baseVal - adj;
        const terms = [{ label: "Base", value: String(baseVal) }];
        if (featDelta) terms.push({ label: "Feats", value: signed(featDelta), signed: true });
        if (adj) terms.push({ label: "Manual", value: signed(adj), signed: true });
        return [
          {
            label: "Score",
            rule: "Base + Feats + Manual",
            terms,
            total: String(live)
          },
          {
            label: "Modifier",
            rule: "floor((Score − 10) / 2)",
            equation: "floor((" + live + " − 10) / 2)",
            total: signed(modifier(live))
          }
        ];
      };
      const tile = appendText(abRoot, "button", "");
      tile.type = "button";
      tile.className = "abilityTile" + (manualAdj ? " is-adjusted" : "");
      tile.setAttribute("aria-label", ability + " " + signed(m) + ", score " + val + (manualAdj ? " (adjusted)" : "") + ". Inspect formula or adjust.");
      appendText(tile, "span", ability).className = "abilityTileName";
      const modEl = appendText(tile, "strong", signed(m));
      modEl.className = "abilityTileMod";
      if (manualAdj) {
        const mark = appendText(modEl, "span", "*");
        mark.className = "adjustedMark";
        mark.setAttribute("aria-hidden", "true");
      }
      const scoreMeta = appendText(tile, "span", "Score " + val + (manualAdj ? " (" + signed(manualAdj) + ")" : ""));
      scoreMeta.className = "abilityTileScore";
      tile.addEventListener("click", ev => openStatModifierModal({
        title: ability + " score",
        statKey: "ability:" + ability,
        step: 1,
        getFacts: abFacts,
        getFormula: abFormula,
        trigger: ev.currentTarget
      }));
    }
  }

  const saves = getElementById("saves");
  saves.replaceChildren();
  for (const ability of abilities) {
    const st = savingThrowTotal(profile, session, ability, c, effMods);
    const bonus = st.total;
    const mode = saveMode(profile, session, ability, armor);
    const saveFacts = () => {
      const p = app.character.profile, s = app.character.session;
      const cond2 = conditionState(s, p);
      const em2 = activeEffectModifiers(p, s);
      const st2 = savingThrowTotal(p, s, ability, cond2, em2);
      const m2 = saveMode(p, s, ability, armorStats(p, s));
      let saveFloorVal = "";
      if (m2.rollFloor > 0) {
        if (m2.rollFloorSource && typeof createRuleLink === "function") {
          const wrap = document.createElement("span");
          wrap.append(document.createTextNode(m2.rollFloor + " ("), createRuleLink(m2.rollFloorSource, m2.rollFloorSource, { profile: p, session: s }), document.createTextNode(")"));
          saveFloorVal = wrap;
        } else {
          saveFloorVal = m2.rollFloorSource ? (m2.rollFloor + " (" + m2.rollFloorSource + ")") : String(m2.rollFloor);
        }
      }
      return [
        ["Ability override", st2.substitutedFrom ? "Uses " + st2.substitutedFrom : ""],
        ["Training", st2.saveRank === 2 ? "Expertise" : st2.saveRank === 1 ? "Proficient" : "Not proficient"],
        ["Minimum d20 roll", saveFloorVal],
        ["Advantage", typeof _linkTextSources === "function" ? _linkTextSources(m2.advantage, p, s) : m2.advantage],
        ["Disadvantage", typeof _linkTextSources === "function" ? _linkTextSources(m2.disadvantage, p, s) : m2.disadvantage],
        ["Condition", m2.automatic ? "Automatically fails as a natural 1." : (typeof _linkTextSources === "function" ? _linkTextSources(m2.conditional, p, s) : m2.conditional)]
      ];
    };
    const cell = appendText(saves, "div", "");
    cell.className = "stat statRowInline" + (st.saveRank === 2 ? " is-expertise" : st.saveRank === 1 ? " is-proficient" : "") + (st.manualMod ? " is-adjusted" : "");
    const label = appendText(cell, "button", "");
    const mainSpan = appendText(label, "span", ability.slice(0, 3).toUpperCase() + " " + (mode.automatic ? "Fails" : signed(bonus)));
    mainSpan.className = "saveLabelMain";
    if (st.manualMod) {
      const mark = appendText(mainSpan, "span", "*");
      mark.className = "adjustedMark";
      mark.setAttribute("aria-hidden", "true");
    }
    if (st.saveRank) {
      const tag = appendText(mainSpan, "small", st.saveRank === 2 ? "E" : "P");
      tag.className = "saveProfTag" + (st.saveRank === 2 ? " is-exp" : "");
      tag.title = st.saveRank === 2 ? "Expertise" : "Proficient";
    }
    const saveFormula = () => {
      const p = app.character.profile, s = app.character.session;
      const cond2 = conditionState(s, p);
      const em2 = activeEffectModifiers(p, s);
      const st2 = savingThrowTotal(p, s, ability, cond2, em2);
      const abLabel = (st2.substitutedFrom || ability).slice(0, 3).toUpperCase();
      const terms = [{ label: abLabel, value: signed(st2.baseMod), signed: true }];
      if (st2.saveRank === 2) terms.push({ label: "Expertise", value: signed(2 * p.proficiency), signed: true });
      else if (st2.saveRank === 1) terms.push({ label: "Prof", value: signed(p.proficiency), signed: true });
      if (st2.effectBonus) terms.push({ label: "Effects", value: signed(st2.effectBonus), signed: true });
      if (st2.manualMod) terms.push({ label: "Manual", value: signed(st2.manualMod), signed: true });
      return {
        rule: "1d20 + Ability Mod + Training + Bonuses",
        terms,
        total: signed(st2.total)
      };
    };
    label.type = "button";
    label.className = "detailName" + (st.manualMod ? " is-adjusted" : "");
    label.setAttribute("aria-label", ability + " save " + (mode.automatic ? "automatically fails" : signed(bonus)) + (st.manualMod ? " (adjusted)" : "") + ". Inspect formula or adjust.");
    if (!mode.automatic) displayRollBadge(label, mode.advantage, mode.disadvantage, mode.badgeConditional !== undefined ? mode.badgeConditional : mode.conditional);
    if (!mode.automatic && mode.rollFloor > 0) {
      const sf = appendText(mainSpan, "small", "min " + mode.rollFloor);
      sf.className = "saveFloorPill";
    }
    label.addEventListener("click", ev => openStatModifierModal({
      title: ability + " saving throw",
      statKey: "save:" + ability,
      step: 1,
      getFacts: saveFacts,
      getFormula: saveFormula,
      trigger: ev.currentTarget
    }));
  }
  const saveStrip = getElementById("saveSituationalStrip");
  if (saveStrip && typeof resolveBroadSaveModifiers === "function" && typeof renderSituationalStrip === "function") {
    renderSituationalStrip(saveStrip, resolveBroadSaveModifiers(profile, session), profile, session);
  }

  const sticky = getElementById("stickyState");
  sticky.replaceChildren();
  appendText(sticky, "span", profile.name).className = "stickyForm";
  const hpLink = appendText(sticky, "a", "HP " + session.hp + "/" + maximum + (session.temp ? " (+" + session.temp + ")" : ""));
  hpLink.href = "#dashboard";
  hpLink.className = "stickyMetric";
  const acLink = appendText(sticky, "a", "AC " + ac);
  acLink.href = "#dashboard";
  appendText(sticky, "a", "Actions").href = "#action-economy";
  appendText(sticky, "a", "Effects " + effectCount).href = "#activeStatus";
}

function openAbilityEditorModal(ability, trigger) {
  if (!app.character) return;
  const { profile, session } = app.character;
  const baseVal = (profile.baseScores || profile.scores || {})[ability] || 10;
  const currentScore = effectiveScores(profile, session)[ability];
  const curAdj = Number(session.abilityAdjustments?.[ability]) || 0;
  const featSources = (session.feats || [])
    .filter(f => {
      const rule = featRule(f.name);
      const chosen = f.abilityChoice || (rule?.attributes?.length === 1 ? rule.attributes[0] : "");
      return chosen === ability || (rule?.choiceSpec?.kind === "savingThrow" && f.choice === ability);
    })
    .map(f => f.name + " (+1)");

  const { dialog, form, body, cancel, confirm } = createModalFrame(ability + " score", trigger);
  cancel.hidden = true;
  confirm.textContent = "Done";

  const dl = appendText(body, "dl", "");
  dl.className = "mathPopoverList";
  const addRow = (k, v) => { appendText(dl, "dt", k); appendText(dl, "dd", String(v)); };
  addRow("Base (export + species + ASIs)", baseVal);
  if (featSources.length) addRow("Feats", featSources.join(", "));
  const adjDd = document.createElement("dd");
  appendText(dl, "dt", "Manual adjustment");
  dl.append(adjDd);
  const totDd = document.createElement("dd");
  appendText(dl, "dt", "Current total");
  dl.append(totDd);

  const ctrl = appendText(body, "div", "");
  ctrl.className = "row wrap";
  const decBtn = appendText(ctrl, "button", "−1");
  decBtn.type = "button";
  const incBtn = appendText(ctrl, "button", "+1");
  incBtn.type = "button";
  const resetBtn = appendText(ctrl, "button", "Reset adjustment");
  resetBtn.type = "button";

  const sync = () => {
    const s = app.character.session;
    const p = app.character.profile;
    const adj = Number(s.abilityAdjustments?.[ability]) || 0;
    const live = effectiveScores(p, s)[ability];
    adjDd.textContent = adj ? signed(adj) : "0";
    totDd.textContent = live + " (" + signed(modifier(live)) + ")";
    resetBtn.disabled = adj === 0;
  };
  const applyDelta = delta => {
    update("Adjusted " + ability + " (" + signed(delta) + ")", next => {
      next.abilityAdjustments = next.abilityAdjustments || {};
      next.abilityAdjustments[ability] = (Number(next.abilityAdjustments[ability]) || 0) + delta;
      if (next.abilityAdjustments[ability] === 0) delete next.abilityAdjustments[ability];
    });
    sync();
  };
  decBtn.addEventListener("click", () => applyDelta(-1));
  incBtn.addEventListener("click", () => applyDelta(1));
  resetBtn.addEventListener("click", () => {
    update("Reset " + ability + " adjustment", next => {
      if (next.abilityAdjustments) delete next.abilityAdjustments[ability];
    });
    sync();
  });
  sync();
  form.addEventListener("submit", e => { e.preventDefault(); dialog.close(); });
  dialog.showModal();
}

function openStatModifierModal({ title, statKey, step = 1, unit = "", getFacts = null, getFormula = null, noteText = "", trigger = null }) {
  if (!app.character) return;
  const { dialog, form, body, cancel, confirm } = createModalFrame(title, trigger, { size: "compact" });
  cancel.hidden = true;
  confirm.textContent = "Done";

  const factsWrap = appendText(body, "div", "");
  const modHeader = appendText(body, "div", "");
  modHeader.className = "statModHeader";
  const modLabel = appendText(modHeader, "span", "Temporary modifier");
  modLabel.className = "muted";
  const modValue = appendText(modHeader, "b", "+0");

  const ctrl = appendText(body, "div", "");
  ctrl.className = "statModControls";
  const bigStep = step * 5;
  const deltas = [-bigStep, -step, step, bigStep];
  deltas.forEach(delta => {
    const b = appendText(ctrl, "button", (delta > 0 ? "+" + delta : "−" + Math.abs(delta)) + unit);
    b.type = "button";
    b.addEventListener("click", () => {
      update("Adjusted " + title + " (" + signed(delta) + unit + ")", next => {
        next.statModifiers = next.statModifiers || {};
        next.statModifiers[statKey] = (Number(next.statModifiers[statKey]) || 0) + delta;
        if (next.statModifiers[statKey] === 0) delete next.statModifiers[statKey];
      });
      sync();
    });
  });
  const resetBtn = appendText(ctrl, "button", "Reset");
  resetBtn.type = "button";
  resetBtn.addEventListener("click", () => {
    update("Reset " + title + " modifier", next => {
      if (next.statModifiers) delete next.statModifiers[statKey];
      if (statKey.startsWith("ability:") && next.abilityAdjustments) {
        delete next.abilityAdjustments[statKey.slice("ability:".length)];
      }
    });
    sync();
  });

  if (noteText) {
    appendText(body, "p", noteText).className = "muted";
  }

  const sync = () => {
    factsWrap.replaceChildren();
    const s = app.character.session;
    const curMod = Number(s.statModifiers?.[statKey]) || 0;
    const legacyAb = statKey.startsWith("ability:") ? (Number(s.abilityAdjustments?.[statKey.slice("ability:".length)]) || 0) : 0;
    const totalMod = curMod + legacyAb;
    modValue.textContent = (totalMod === 0 ? "0" : signed(totalMod)) + unit;
    resetBtn.disabled = totalMod === 0;
    if (getFormula && typeof renderFormulaBanner === "function") {
      renderFormulaBanner(factsWrap, getFormula());
    }
    if (getFacts) {
      renderFactGrid(factsWrap, getFacts(), { compact: true });
    }
  };
  sync();
  form.addEventListener("submit", e => { e.preventDefault(); dialog.close(); });
  dialog.showModal();
}
