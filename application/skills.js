function skillInfo(trigger, name, ability, effAb, profile, session, rank, value, mode, extras) {
  const c = conditionState(session, profile);
  const trainingName = rank === 2 ? "Expertise" : rank === 1 ? "Proficient" : "";
  const source = skillProvenance(profile, session, name, rank);
  const abLabel = effAb !== ability ? effAb + " (replaces " + ability + ")" : ability;
  const facts = [
    [abLabel, signed(effectiveModifier(profile, session, effAb, c))],
    ["Training", trainingName ? trainingName + " " + signed(rank * profile.proficiency) : ""],
    ["Source", source],
    ["Led by the Force", extras.ledByForceBonus ? signed(extras.ledByForceBonus) : ""],
    ["Active effects", extras.effectBonus ? signed(extras.effectBonus) : ""],
    ["Check bonus", signed(value)],
    ["Advantage", mode.advantage],
    ["Disadvantage", mode.disadvantage],
    ["Condition", mode.automatic ? "Automatically fails" : mode.conditional]
  ];
  showMathPopover(trigger, name, facts, "");
}

function renderSkills(profile, session) {
  const root = getElementById("skillList");
  root.replaceChildren();
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
      const useStrIntim = name === "Intimidation" && hasFeat(session, "Forceful Vigor") &&
        effectiveModifier(profile, session, "Strength", c) > effectiveModifier(profile, session, "Charisma", c);
      const useIntSurv = name === "Survival" && typeof hasClassOption === "function" && hasClassOption(profile, session, "Survival Expert") &&
        effectiveModifier(profile, session, "Intelligence", c) > effectiveModifier(profile, session, "Wisdom", c);
      const effAb = useStrIntim ? "Strength" : useIntSurv ? "Intelligence" : ability;
      const stealthBonus = name === "Stealth" ? (effMods.stealthBonus || 0) : 0;
      const maneuverSkillBonus = effMods.skillBonuses?.[name] || 0;
      const effectBonus = stealthBonus + maneuverSkillBonus;
      const ledByForceBonus = (!rank && characterTraits(profile, session).isSentinel) ? Math.floor((profile.proficiency || 2) / 2) : 0;
      const value = effectiveModifier(profile, session, effAb, c) + rank * profile.proficiency + ledByForceBonus + effectBonus;
      const mode = checkMode(profile, session, ability, name, armor);
      if (name === "Stealth" && armor.stealth) {
        mode.conditional = [mode.conditional, "Bulky armor imposes disadvantage on sound-based Stealth checks."].filter(Boolean).join(" ");
      }
      const {advantage, disadvantage, automatic, conditional} = mode;
      const button = appendText(grid, "button", "");
      button.type = "button";
      button.dataset.skill = name;
      button.className = "skillCell";
      button.setAttribute("aria-haspopup", "dialog");
      const label = appendText(button, "span", name);
      if (!group) appendText(label, "small", ability.slice(0, 3).toUpperCase()).className = "skillAbility";
      if (rank) {
        const mark = appendText(label, "small", rank === 2 ? "E" : "P");
        mark.className = "skillTraining";
        mark.title = rank === 2 ? "Expertise" : "Proficient";
        mark.setAttribute("aria-hidden", "true");
      }
      const roll = appendText(button, "b", automatic ? "Fails" : signed(value));
      if (!automatic) displayRollBadge(roll, advantage, disadvantage, conditional);
      button.setAttribute("aria-label", name + " " + (automatic ? "automatically fails" : signed(value)) +
        (rank ? rank === 2 ? " Expertise" : " Proficient" : "") +
        (!automatic && advantage && !disadvantage ? " with advantage" : !automatic && disadvantage && !advantage ? " with disadvantage" : ""));
      button.addEventListener("click", ev => skillInfo(ev.currentTarget, name, ability, effAb, profile, session, rank, value, mode, {ledByForceBonus, effectBonus}));
    }
  }
  if (!names.length) appendText(root, "p", "No matching skills.").className = "muted";
}
