function _linkTextSources(rawText, profile, session) {
  const s = String(rawText || "").trim();
  if (!s || typeof document === "undefined" || typeof createRuleLink !== "function") return s;
  const parts = s.split(/\s*,\s*/).filter(Boolean);
  if (!parts.length) return s;
  const wrap = document.createElement("span");
  let linkedAny = false;
  parts.forEach((part, idx) => {
    if (idx > 0) wrap.append(document.createTextNode(", "));
    const m = part.match(/^([^(:]+?)(\s*[(:].*)$/);
    const cand = m ? m[1].trim() : part;
    const tail = m ? m[2] : "";
    const el = createRuleLink(cand, cand, { profile, session });
    if (el.nodeType === 1) linkedAny = true;
    wrap.append(el);
    if (tail) wrap.append(document.createTextNode(tail));
  });
  return linkedAny ? wrap : s;
}

function skillFactsList(name, ability, effAb, profile, session, rank, value, mode, extras) {
  const c = conditionState(session, profile);
  const trainingName = rank === 2 ? "Expertise" : rank === 1 ? "Proficient" : "";
  const sourceStr = skillProvenance(profile, session, name, rank);
  const srcItems = typeof skillProvenanceSources === "function" ? skillProvenanceSources(profile, session, name, rank) : [];
  let sourceVal = sourceStr;
  if (srcItems.length && typeof renderSourceLinks === "function" && typeof document !== "undefined") {
    sourceVal = renderSourceLinks(srcItems, { separator: rank === 2 ? " + " : " or ", profile, session });
  }
  let totalFloorVal = "";
  if (extras.totalFloor) {
    const tfSrc = extras.totalFloorSource || "Indomitable Might";
    if (typeof document !== "undefined" && typeof createRuleLink === "function") {
      const wrap = document.createElement("span");
      wrap.append(document.createTextNode(extras.totalFloor + " ("), createRuleLink(tfSrc, tfSrc, { profile, session }), document.createTextNode(")"));
      totalFloorVal = wrap;
    } else {
      totalFloorVal = `${extras.totalFloor} (${tfSrc})`;
    }
  }
  let rollFloorVal = "";
  if (extras.rollFloor) {
    const rfSrc = extras.rollFloorSource || "";
    if (rfSrc && typeof document !== "undefined" && typeof createRuleLink === "function") {
      const wrap = document.createElement("span");
      wrap.append(document.createTextNode(extras.rollFloor + " ("), createRuleLink(rfSrc, rfSrc, { profile, session }), document.createTextNode(")"));
      rollFloorVal = wrap;
    } else {
      rollFloorVal = rfSrc ? `${extras.rollFloor} (${rfSrc})` : `${extras.rollFloor} (Ch. 7 Minimum Roll Threshold)`;
    }
  }
  return [
    ["Ability override", effAb !== ability ? effAb + " (replaces " + ability + ")" : ""],
    ["Training", trainingName || (extras.ledByForceBonus ? "Half proficiency" : "Not proficient")],
    ["Source", sourceVal],
    ["Minimum d20 roll", rollFloorVal],
    ["Minimum check total", totalFloorVal],
    ["Advantage", _linkTextSources(mode.advantage, profile, session)],
    ["Disadvantage", _linkTextSources(mode.disadvantage, profile, session)],
    ["Condition", mode.automatic ? "Automatically fails" : _linkTextSources(mode.conditional, profile, session)]
  ];
}

function skillFormulaSpec(name, ability, effAb, profile, session, rank, value, extras) {
  const c = conditionState(session, profile);
  const abMod = effectiveModifier(profile, session, effAb, c);
  const manualMod = Number(session?.statModifiers?.["skill:" + name]) || 0;
  const terms = [{ label: effAb.slice(0, 3).toUpperCase(), value: signed(abMod), signed: true }];
  if (rank === 2) terms.push({ label: "Expertise (2×" + profile.proficiency + ")", value: signed(2 * profile.proficiency), signed: true });
  else if (rank === 1) terms.push({ label: "Prof", value: signed(profile.proficiency), signed: true });
  else if (extras.ledByForceBonus) terms.push({ label: "½ Prof", value: signed(extras.ledByForceBonus), signed: true });
  if (extras.effectBonus) terms.push({ label: "Effects", value: signed(extras.effectBonus), signed: true });
  if (manualMod) terms.push({ label: "Manual", value: signed(manualMod), signed: true });
  return {
    rule: "1d20 + Ability Mod + Training + Bonuses",
    terms,
    total: signed(value)
  };
}

function skillInfo(trigger, name, ability, effAb, profile, session, rank, value, mode, extras) {
  showMathPopover(
    trigger,
    name,
    skillFactsList(name, ability, effAb, profile, session, rank, value, mode, extras),
    "",
    [],
    skillFormulaSpec(name, ability, effAb, profile, session, rank, value, extras)
  );
}

function renderSituationalStrip(container, items, profile, session) {
  if (!container) return;
  container.replaceChildren();
  const list = Array.isArray(items) ? items : [];
  container.hidden = !list.length;
  if (!list.length) return;
  appendText(container, "span", "Situational").className = "situationalLabel";
  for (const item of list) {
    const btn = appendText(container, "button", item.label);
    btn.type = "button";
    btn.className = "situationalPill" + (item.tone === "adv" ? " is-adv" : item.tone === "disadv" ? " is-disadv" : "");
    btn.setAttribute("aria-haspopup", "dialog");
    btn.addEventListener("click", ev => {
      const srcVal = (item.sources && item.sources.length && typeof renderSourceLinks === "function")
        ? renderSourceLinks(item.sources, { separator: ", ", profile, session })
        : (item.sources || []).map(s => s.name).join(", ");
      showMathPopover(ev.currentTarget, item.label, [
        ["Applies to", item.appliesTo || ""],
        ["Rule", item.detail || ""],
        ["Source", srcVal]
      ]);
    });
  }
}

function renderSkills(profile, session) {
  const root = getElementById("skillList");
  root.replaceChildren();
  const skillStrip = getElementById("skillSituationalStrip");
  if (skillStrip && typeof resolveBroadSkillModifiers === "function") {
    renderSituationalStrip(skillStrip, resolveBroadSkillModifiers(profile, session), profile, session);
  }
  const c = conditionState(session, profile);
  const training = effectiveTraining(profile, session);
  const armor = armorStats(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const query = getElementById("skillSearch").value.toLowerCase();
  const groupByAbility = getElementById("skillSort").value === "ability";
  const names = Object.keys(skills).filter(name => (name + " " + skills[name]).toLowerCase().includes(query)).sort();
  const buckets = groupByAbility ? abilities.map(ability => [ability, names.filter(name => skills[name] === ability)]) : [["", names]];

  for (const [group, entries] of buckets.filter(([, list]) => list.length)) {
    if (group) appendText(root, "h3", group);
    const grid = appendText(root, "div", "");
    grid.className = "skillGrid";
    for (const name of entries) {
      const ability = skills[name];
      const rank = training[name] || 0;
      const skEff = typeof resolveSkillEffects === "function" ? resolveSkillEffects(profile, session, name, ability, c) : null;
      const effAb = (skEff && skEff.effectiveAbility !== ability) ? skEff.effectiveAbility : ability;
      const stealthBonus = name === "Stealth" ? (effMods.stealthBonus || 0) : 0;
      const maneuverSkillBonus = effMods.skillBonuses?.[name] || 0;
      const effectBonus = stealthBonus + maneuverSkillBonus + (skEff ? skEff.bonus : 0);
      const rollFloor = skEff?.rollFloor || 0;
      const rollFloorSource = skEff?.rollFloorSource || "";
      const totalFloor = skEff?.totalFloor || 0;
      const totalFloorSource = skEff?.totalFloorSource || "";
      const ledByForceBonus = (!rank && (characterTraits(profile, session).isSentinel || skEff?.halfProficiency)) ? Math.floor((profile.proficiency || 2) / 2) : 0;
      const manualMod = Number(session?.statModifiers?.["skill:" + name]) || 0;
      const value = effectiveModifier(profile, session, effAb, c) + rank * profile.proficiency + ledByForceBonus + effectBonus + manualMod;
      const mode = checkMode(profile, session, ability, name, armor);
      const {advantage, disadvantage, automatic, conditional} = mode;
      const row = appendText(grid, "div", "");
      row.className = "skillRowWrap";
      const button = appendText(row, "button", "");
      button.type = "button";
      button.dataset.skill = name;
      button.className = "skillCell" + (manualMod ? " is-adjusted" : "");
      button.setAttribute("aria-haspopup", "dialog");
      const label = appendText(button, "span", name);
      if (!group) appendText(label, "small", ability.slice(0, 3).toUpperCase()).className = "skillAbility";
      if (rank) {
        const mark = appendText(label, "small", rank === 2 ? "E" : "P");
        mark.className = "skillTraining" + (rank === 2 ? " is-exp" : "");
        mark.title = rank === 2 ? "Expertise" : "Proficient";
        mark.setAttribute("aria-hidden", "true");
      } else if (ledByForceBonus > 0) {
        const mark = appendText(label, "small", "½");
        mark.className = "skillTraining is-half";
        mark.title = "Half proficiency";
        mark.setAttribute("aria-hidden", "true");
      }
      const roll = appendText(button, "b", automatic ? "Fails" : signed(value));
      if (manualMod) {
        const mark = appendText(roll, "span", "*");
        mark.className = "adjustedMark";
        mark.setAttribute("aria-hidden", "true");
      }
      if (!automatic) displayRollBadge(roll, advantage, disadvantage, mode.badgeConditional !== undefined ? mode.badgeConditional : conditional);
      if (!automatic && rollFloor > 0) {
        const rf = appendText(roll, "small", "min " + rollFloor);
        rf.className = "skillFloorPill";
      }
      if (!automatic && totalFloor > 0) {
        const tf = appendText(roll, "small", "min total " + totalFloor);
        tf.className = "skillFloorPill";
      }
      button.setAttribute("aria-label", name + " " + (automatic ? "automatically fails" : signed(value)) +
        (rank ? rank === 2 ? " Expertise" : " Proficient" : "") +
        (rollFloor > 0 ? " minimum d20 " + rollFloor : "") +
        (totalFloor > 0 ? " minimum total " + totalFloor : ""));
      const getLiveFacts = () => {
        const p = app.character.profile, s = app.character.session;
        const mNow = Number(s?.statModifiers?.["skill:" + name]) || 0;
        const vNow = value - manualMod + mNow;
        return skillFactsList(name, ability, effAb, p, s, rank, vNow, mode, {ledByForceBonus, effectBonus, rollFloor, rollFloorSource, totalFloor, totalFloorSource});
      };
      const getLiveFormula = () => {
        const p = app.character.profile, s = app.character.session;
        const mNow = Number(s?.statModifiers?.["skill:" + name]) || 0;
        const vNow = value - manualMod + mNow;
        return skillFormulaSpec(name, ability, effAb, p, s, rank, vNow, {ledByForceBonus, effectBonus});
      };
      button.addEventListener("click", ev => {
        if (typeof openStatModifierModal === "function") {
          openStatModifierModal({ title: name, statKey: "skill:" + name, step: 1, getFacts: getLiveFacts, getFormula: getLiveFormula, trigger: ev.currentTarget });
        } else {
          skillInfo(ev.currentTarget, name, ability, effAb, profile, session, rank, value, mode, {ledByForceBonus, effectBonus});
        }
      });
    }
  }
  if (!names.length) appendText(root, "p", "No matching skills.").className = "muted";
  const notesWrap = getElementById("skillUtilityNotesWrap");
  const notesList = getElementById("skillUtilityNotes");
  if (notesWrap && notesList && typeof resolveGeneralSkillNotes === "function") {
    notesList.replaceChildren();
    const gNotes = resolveGeneralSkillNotes(profile, session)
      .filter(n => !query || (n.title + " " + n.text + " " + n.source).toLowerCase().includes(query));
    notesWrap.hidden = !gNotes.length;
    for (const gn of gNotes) {
      const item = appendText(notesList, "div", "");
      item.className = "skillUtilityItem";
      appendText(item, "b", gn.title);
      appendText(item, "span", " — " + gn.text);
    }
  }
}
