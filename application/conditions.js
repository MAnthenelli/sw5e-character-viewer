const knownConditions = Object.keys(SW5E_CONDITIONS);
const conditionFields = {
  Exhaustion: ["Level", 6],
  Slowed: ["Levels", 4],
  Corroded: ["Levels", 3],
  Ignited: ["Fire damage per turn", 999],
  "Force-Empowered Self: Deflection": ["AC bonus (rolled Kinetic Combat die)", 12],
  "Force-Empowered Self: Slow Time": ["Speed bonus (5 × Kinetic Combat die)", 60],
  "Force Affinity: Ashla": ["Light side power level (+Maximum & current HP for 1 minute)", 9],
  "Evasive Footwork": ["AC bonus (rolled superiority die)", 12],
  "Steady the Nerves": ["Saving throw bonus (rolled superiority die)", 12],
  "Precise Movements": ["Speed bonus in feet (5 × superiority die)", 60],
  "Charge": ["Speed bonus in feet (5 × superiority die)", 60],
  "Incite": ["Bonus weapon/attack damage (ally's maneuver modifier)", 10],
  "Adrenaline Hit": ["Incoming damage reduction (ally's maneuver modifier)", 10],
  "Enhancement Injection": ["Strength / Constitution check & save bonus (maneuver modifier)", 10],
  "Primal Endurance": ["AC bonus (rolled superiority die)", 12],
  "Dual Wield AC": ["AC bonus (+1 per forgone TWF attack)", 3],
  "One Step Ahead": ["Initiative bonus (rolled superiority die)", 12],
  "Parry": ["Melee damage reduction (superiority die + maneuver modifier)", 22],
  "Self-Preservation": ["Saving throw bonus (rolled superiority die)", 12],
  "Firewall": ["Tech save bonus (rolled superiority die)", 12],
  "One with the Force": ["Concentration CON save bonus (rolled superiority die)", 12],
  "Heads Up": ["Saving throw bonus (ally superiority die)", 12],
  "Targeted Strike": ["Attack & damage bonus (ally superiority die)", 12],
  "Conceal": ["Stealth check bonus (rolled superiority die)", 12],
  "Flex": ["Athletics check bonus (rolled superiority die)", 12],
  "Perceive": ["Perception check bonus (rolled superiority die)", 12],
  "Tumble": ["Acrobatics check bonus (rolled superiority die)", 12],
  "Assess the Situation": ["Perception/Investigation bonus (rolled superiority die)", 12],
  "Wild Senses": ["Perception/Survival bonus (rolled superiority die)", 12],
  "Aura of Presence": ["Guardian Wisdom modifier (+N to all saves)", 10],
  "Aura of Hatred": ["Guardian Charisma modifier (+N first melee hit/round)", 10],
  "Aura of Vigor (Guardian)": ["Guardian Wisdom/Charisma modifier (temporary HP per turn)", 10],
  "Sharpshooter's Routine": ["Scout Intelligence modifier (+N first attack/turn)", 10],
  "Potent Aptitude": ["Rolled Potent Aptitude die (+N)", 12],
  "Critical Analysis (Ally)": ["Scholar Intelligence modifier (+N to 1 roll)", 10]
};
const contextualConditions = {
  Frightened: "Source is within line of sight",
  Blinded: "A power or special sense compensates for blindness",
  Invisible: "The relevant creature can detect you with a power or special sense"
};

const classCombatStates = [
  {
    id: "state:one-quarter-cover",
    name: "One-quarter cover",
    group: "classStates",
    kind: "state",
    preview: "+2 bonus to AC and Dexterity saving throws (SW5e one-quarter cover).",
    rules: "A target with one-quarter cover has a +2 bonus to AC and Dexterity saving throws."
  },
  {
    id: "state:half-cover",
    name: "Half cover",
    group: "classStates",
    kind: "state",
    preview: "+3 bonus to AC and Dexterity saving throws (SW5e half cover).",
    rules: "A target with half cover has a +3 bonus to AC and Dexterity saving throws."
  },
  {
    id: "state:guarded",
    name: "Guarded",
    group: "classStates",
    kind: "state",
    preview: "Ally within 5 ft took the Guard action: incoming attacks have disadvantage.",
    rules: "Until the start of the guarding ally's next turn, any attack roll made against you has disadvantage while within 5 feet, and the ally can intercept a hit."
  },
  {
    id: "state:steady-aim",
    name: "Steady Aim",
    group: "classStates",
    kind: "state",
    preview: "Operative Class Improvement: advantage on next attack roll this turn; speed becomes 0 until end of turn.",
    rules: "As a bonus action (Cunning Action), you give yourself advantage on your next attack roll on the current turn. You can use this only if you haven't moved during this turn, and your speed becomes 0 until the end of the current turn."
  },
  {
    id: "state:empty-body",
    name: "Empty Body",
    group: "classStates",
    kind: "state",
    preview: "Monk L18 (4 Focus): Invisible and resistance to all damage except force damage for 1 minute.",
    rules: "You become invisible for 1 minute. During that time, you also have resistance to all damage except force damage."
  },
  {
    id: "state:aura-of-presence",
    name: "Aura of Presence",
    group: "classStates",
    kind: "state",
    preview: "Guardian Aura: add Wisdom modifier to all saving throws while within the aura.",
    rules: "Whenever you or a friendly creature within the Guardian Aura makes a saving throw, the creature adds the Guardian's Wisdom modifier to the roll."
  },
  {
    id: "state:aura-of-conviction",
    name: "Aura of Conviction",
    group: "classStates",
    kind: "state",
    preview: "Guardian Aura: advantage on saving throws against being charmed or frightened.",
    rules: "You and friendly creatures within the Guardian Aura have advantage on saving throws against effects that would cause you to be charmed or frightened."
  },
  {
    id: "state:aura-of-hatred",
    name: "Aura of Hatred",
    group: "classStates",
    kind: "state",
    preview: "Guardian Aura: add Charisma modifier (minimum +1) to first melee weapon damage roll each round.",
    rules: "You and friendly creatures within the Guardian Aura gain a bonus to the first melee weapon damage roll each round equal to the Guardian's Charisma modifier (minimum +1)."
  },
  {
    id: "state:aura-of-vigor-guard",
    name: "Aura of Vigor (Guardian)",
    group: "classStates",
    kind: "state",
    preview: "Guardian Aura: gain temporary HP equal to Wisdom or Charisma modifier at start of turn.",
    rules: "Whenever a friendly creature starts its turn within the Guardian Aura, it gains temporary hit points equal to the Guardian's Wisdom or Charisma modifier (minimum 1)."
  },
  {
    id: "state:aura-of-warding",
    name: "Aura of Warding",
    group: "classStates",
    kind: "state",
    preview: "Guardian Aura: resistance to damage from force powers.",
    rules: "You and friendly creatures within the Guardian Aura have resistance to damage from force powers."
  },
  {
    id: "state:sage-advice",
    name: "Sage Advice",
    group: "classStates",
    kind: "state",
    choiceKind: "anySkill",
    preview: "Scholar Sage Advice: gain proficiency in the chosen skill for 1 hour.",
    rules: "A Scholar advised you on a chosen skill: you gain proficiency in that skill for 1 hour (or add half/full proficiency bonus on first check with Expert's/Master's Advice)."
  },
  {
    id: "state:adaptability-routine",
    name: "Adaptability Routine",
    group: "classStates",
    kind: "state",
    choiceKind: "anyAbility",
    preview: "Scout Routine: add half proficiency bonus to a non-proficient saving throw until start of Scout's next turn.",
    rules: "While within the Scout's routine radius, you add half your proficiency bonus to saving throws with the chosen ability if you are not already proficient."
  },
  {
    id: "state:mavens-routine",
    name: "Maven's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: resistance to damage from tech powers.",
    rules: "While within the Scout's routine radius, you have resistance to damage from tech powers."
  },
  {
    id: "state:mesmers-routine",
    name: "Mesmer's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: advantage on saving throws against being incapacitated or put to sleep.",
    rules: "While within the Scout's routine radius, you have advantage on saving throws against effects that would incapacitate you or put you to sleep."
  },
  {
    id: "state:nomads-routine",
    name: "Nomad's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: advantage on CON saves against unenhanced exhaustion and extreme environments.",
    rules: "While within the Scout's routine radius, you have advantage on Constitution saving throws to avoid exhaustion from unenhanced sources."
  },
  {
    id: "state:responders-routine",
    name: "Responder's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: add proficiency bonus to Initiative checks.",
    rules: "While within the Scout's routine radius, you can add your proficiency bonus to your Initiative check."
  },
  {
    id: "state:sharpshooters-routine",
    name: "Sharpshooter's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: +N (Scout Intelligence modifier) to your first weapon attack roll each turn.",
    rules: "While within the Scout's routine radius, add the Scout's Intelligence modifier (minimum +1) to your first weapon attack roll before the start of your next turn."
  },
  {
    id: "state:striders-routine",
    name: "Strider's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: each slowed level only reduces speed by 5 feet.",
    rules: "While within the Scout's routine radius, each slowed level only reduces your speed by 5 feet (unless reduced to 0)."
  },
  {
    id: "state:wardens-routine",
    name: "Warden's Routine",
    group: "classStates",
    kind: "state",
    preview: "Scout Routine: gain climbing and swimming speed equal to your walking speed.",
    rules: "While within the Scout's routine radius, you gain a climbing, swimming, and crawling speed equal to your walking speed."
  },
  {
    id: "state:three-quarters-cover",
    name: "Three-quarters cover",
    group: "classStates",
    kind: "state",
    preview: "+5 bonus to AC and Dexterity saving throws (applied automatically).",
    rules: "A target with three-quarters cover has a +5 bonus to AC and Dexterity saving throws."
  },
  {
    id: "state:dodging",
    name: "Dodging",
    group: "classStates",
    kind: "state",
    preview: "Incoming attacks have disadvantage; advantage on DEX saving throws.",
    rules: "Until the start of your next turn, any attack roll made against you has disadvantage if you can see the attacker, and you make Dexterity saving throws with advantage."
  },
  {
    id: "state:hidden",
    name: "Hidden",
    group: "classStates",
    kind: "state",
    preview: "Unseen and unheard; incoming attacks have disadvantage.",
    rules: "When a creature can't see you, you have advantage on attack rolls against it, and attack rolls against you have disadvantage."
  },
  {
    id: "state:force-shield",
    name: "Force Shield",
    group: "classStates",
    kind: "state",
    preview: "Consular Reaction: adds Wisdom or Charisma modifier (minimum +1) to AC until start of your next turn.",
    rules: "When you are hit by an attack, you can use your reaction to shroud yourself in Force energy. Until the start of your next turn, you have a bonus to AC equal to your Wisdom or Charisma modifier (minimum +1)."
  },
  {
    id: "state:fes-deflection",
    name: "Force-Empowered Self: Deflection",
    group: "classStates",
    kind: "state",
    preview: "Sentinel (no action, 1 Force Point): adds rolled Kinetic Combat die to AC.",
    rules: "When you are the target of an attack, roll a Kinetic Combat die and add it to your AC (no action required)."
  },
  {
    id: "state:force-affinity-ashla",
    name: "Force Affinity: Ashla",
    group: "classStates",
    kind: "state",
    preview: "Consular Level 3 Ashla (self or ally, 1 minute): hit point maximum and current HP increase by the light side power's level (maximum 1 instance).",
    rules: "Consular 3rd-level Force Affinity (Ashla): When you successfully cast a light side power, either your or the target's (your choice) hit point maximum and current hit points increase by an amount equal to the power's level. This effect lasts for 1 minute. You can only have one instance of this effect active at a time."
  },
  {
    id: "state:fes-slow-time",
    name: "Force-Empowered Self: Slow Time",
    group: "classStates",
    kind: "state",
    preview: "Sentinel (no action when moving, 1 Force Point): increases speed by 5 × Kinetic Combat die until end of turn.",
    rules: "When you move on your turn, roll a Kinetic Combat die to increase your speed by 5 × the amount rolled until the end of your turn."
  },
  {
    id: "state:rangers-quarry",
    name: "Ranger’s Quarry",
    group: "classStates",
    kind: "state",
    preview: "Marked target; add Quarry die on weapon/tech attacks and track with advantage.",
    rules: "Scout Ranger's Quarry: You have advantage on Wisdom (Perception) or Wisdom (Survival) checks to find the target, and once per turn you can apply your Ranger's Quarry bonus."
  },
  {
    id: "state:critical-analysis",
    name: "Critical Analysis",
    group: "classStates",
    kind: "state",
    preview: "Scholar (Hostile target): use Intelligence (or Rancor's Discipline) for finesse weapon and blaster attack/damage rolls.",
    rules: "Scholar Critical Analysis (Hostile): Attack and damage rolls made with finesse weapons or blasters against the analyzed target may use Intelligence (or WIS/CHA with Rancor's Discipline) instead of STR/DEX."
  },
  {
    id: "state:critical-analysis-ally",
    name: "Critical Analysis (Ally)",
    group: "classStates",
    kind: "state",
    preview: "Scholar analyzed you (friendly): end this effect (no action) to add the Scholar's Intelligence modifier to one attack, check, or save.",
    rules: "When a Scholar analyzes a friendly creature, you can end Critical Analysis on yourself (no action required) to add the Scholar's Intelligence modifier to one attack roll, ability check, or saving throw."
  },
  {
    id: "state:potent-aptitude",
    name: "Potent Aptitude",
    group: "classStates",
    kind: "state",
    preview: "Hold an Engineer Potent Aptitude die to add to an ability check, attack roll, or saving throw.",
    rules: "Once within the next 10 minutes, you can roll your Potent Aptitude die and add the number rolled to one ability check, attack roll, or saving throw."
  }
];

const ongoingPowerEffects = (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS : [])
  .filter(p => p.ongoing)
  .map(p => {
    const firstSentence = (p.description || "").split(/\n+/)[0].replace(/\s+/g, " ").trim();
    const preview = [
      p.type + (p.level ? " Level " + p.level : " At-will"),
      p.duration,
      p.concentration ? "Concentration" : "",
      firstSentence
    ].filter(Boolean).join(" · ");
    return {
      id: "power:" + normalizeName(p.name),
      name: p.name,
      group: "powers",
      kind: "power",
      concentration: p.concentration,
      duration: p.duration,
      preview,
      rules: p.description + (p.higherLevel ? "\n\nAt Higher Levels: " + p.higherLevel : "")
    };
  });

const ongoingManeuverEffects = [
  {id: "man:body-over-bother", name: "Body Over Bother", group: "maneuvers", kind: "maneuver", preview: "STR, DEX, or CON saving throws use your highest physical ability modifier (STR/DEX/CON).", rules: "When you are forced to make a Strength, Dexterity, or Constitution saving throw, you can expend a superiority die to change the saving throw ability to your maneuver ability modifier."},
  {id: "man:mind-over-matter", name: "Mind Over Matter", group: "maneuvers", kind: "maneuver", preview: "INT, WIS, or CHA saving throws use your highest mental ability modifier (INT/WIS/CHA).", rules: "When you are forced to make an Intelligence, Wisdom, or Charisma saving throw, you can expend a superiority die to change the saving throw ability to your maneuver ability modifier."},
  {id: "man:evasive-footwork", name: "Evasive Footwork", group: "maneuvers", kind: "maneuver", preview: "+N AC (rolled superiority die) until you stop moving.", rules: "When you move, you can expend one superiority die, rolling the die and adding the number rolled to your AC until you stop moving."},
  {id: "man:steady-the-nerves", name: "Steady the Nerves", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to all saving throws until end of next turn.", rules: "Until the end of the maneuver user's next turn, you have a bonus to any saving throws you make equal to the superiority die rolled."},
  {id: "man:precise-movements", name: "Precise Movements", group: "maneuvers", kind: "maneuver", preview: "+5 × die ft speed and move through hostile spaces as difficult terrain.", rules: "Your speed increases by 5 times the superiority die rolled, and you can move through the space of hostile creatures as if it were difficult terrain."},
  {id: "man:charge", name: "Charge", group: "maneuvers", kind: "maneuver", preview: "+5 × die ft speed and ignore unenhanced difficult terrain until next turn.", rules: "Until the start of the ally's next turn, you can move an additional distance equal to 5 times the superiority die rolled and ignore unenhanced difficult terrain."},
  {id: "man:incite", name: "Incite", group: "maneuvers", kind: "maneuver", preview: "Add ally's maneuver modifier (+N) to every damage roll until start of their next turn.", rules: "You can add the ally's maneuver ability modifier to every damage roll you make until the start of their next turn."},
  {id: "man:adrenaline-hit", name: "Adrenaline Hit", group: "maneuvers", kind: "maneuver", preview: "Reduce incoming damage by N (ally's maneuver modifier) until start of their next turn.", rules: "Until the start of the ally's next turn, when you would take damage, the amount is reduced by an amount equal to their maneuver ability modifier."},
  {id: "man:enhancement-injection", name: "Enhancement Injection", group: "maneuvers", kind: "maneuver", preview: "+N to Strength and Constitution checks and saving throws while temporary HP lasts (1 minute).", rules: "While you have the temporary hit points from Enhancement Injection, you gain a bonus equal to the user's maneuver ability modifier to Strength and Constitution checks and saving throws."},
  {id: "man:primal-endurance", name: "Primal Endurance", group: "maneuvers", kind: "maneuver", preview: "+N AC (rolled superiority die) until start of ally's next turn.", rules: "Add the superiority die rolled to AC until the beginning of the user's next turn."},
  {id: "man:daring-escape", name: "Daring Escape", group: "maneuvers", kind: "maneuver", preview: "Disengaged; advantage on checks and saves to break grapple, restrain, or slow this turn.", rules: "You take the Disengage action and have advantage on ability checks and saving throws to break effects that would grapple, restrain, or slow you until the end of your turn."},
  {id: "man:deliberate-movement", name: "Deliberate Movement", group: "maneuvers", kind: "maneuver", preview: "Dashed; ignore unenhanced difficult terrain until end of turn.", rules: "You take the Dash action and ignore the effects of unenhanced difficult terrain until the end of your turn."},
  {id: "man:agonizing-lethargy", name: "Agonizing Lethargy", group: "maneuvers", kind: "maneuver", preview: "Debuff: take 1d6 necrotic damage for each attack you make until start of attacker's next turn.", rules: "On a failed Constitution save, you take 1d6 necrotic damage for each attack you make until the start of the attacker's next turn."},
  {id: "man:befogging-ichor", name: "Befogging Ichor", group: "maneuvers", kind: "maneuver", preview: "Debuff: cannot take reactions; must move half speed in random direction on your turn.", rules: "You can't take reactions until the start of your next turn and on your turn must use your movement to move half your speed in a random direction (d8)."},
  {id: "man:distracting-blow", name: "Distracting Blow", group: "maneuvers", kind: "maneuver", preview: "Debuff: next attack roll against you by another attacker has advantage.", rules: "The next attack roll against you by an attacker other than the maneuver user has advantage if made before the start of their next turn."},
  {id: "man:effective-flanking", name: "Effective Flanking", group: "maneuvers", kind: "maneuver", preview: "Debuff: next attack roll against you adds the attacker's superiority die (and damage if Improved/Greater).", rules: "The attacker's superiority die (and maneuver modifier if Greater) is added to the first attack roll against you before the start of their next turn."},
  {id: "man:goading-attack", name: "Goading Attack", group: "maneuvers", kind: "maneuver", preview: "Debuff: disadvantage on attack rolls against targets other than the goading attacker.", rules: "You have disadvantage on all attack rolls against targets other than the attacker until the end of their next turn."},
  {id: "man:neuroblock", name: "Neuroblock", group: "maneuvers", kind: "maneuver", preview: "Debuff: next attack has disadvantage and you cannot regain hit points until attacker's next turn.", rules: "Your next attack has disadvantage and you cannot regain hit points until the start of the attacker's next turn."},
  {id: "man:world-on-fire", name: "World on Fire", group: "maneuvers", kind: "maneuver", preview: "Debuff: shed 5-ft dim light and cannot become invisible until end of attacker's next turn.", rules: "You shed dim light in a 5-foot radius, cannot become invisible until the end of the attacker's next turn, and become visible if already invisible."},
  {id: "man:wracking-torment", name: "Wracking Torment", group: "maneuvers", kind: "maneuver", preview: "Debuff: lose resistance to triggering attack/power damage types until end of turn.", rules: "Until the end of the turn, you lose resistance to the damage types of the triggering attack or power."},
  {id: "man:hacked-communications", name: "Hacked Communications", group: "maneuvers", kind: "maneuver", preview: "Debuff: commlinks and communication devices disabled until rebooted.", rules: "Your communication devices are disabled until rebooted."},
  {id: "man:one-step-ahead", name: "One Step Ahead", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Initiative.", rules: "When you roll initiative and you are not surprised, expend a superiority die and add the number rolled to your Initiative check."},
  {id: "man:feinting-attack", name: "Feinting Attack", group: "maneuvers", kind: "maneuver", preview: "Advantage on your next attack roll against the feinted target this turn.", rules: "Bonus action: you have advantage on your next attack roll against the chosen target within 5 ft this turn, adding superiority die to damage on hit."},
  {id: "man:parry", name: "Parry", group: "maneuvers", kind: "maneuver", preview: "Reduce next incoming melee attack damage by N (superiority die + maneuver modifier).", rules: "Reaction when damaged by a melee attack: reduce the damage by the superiority die roll + your maneuver ability modifier."},
  {id: "man:self-preservation", name: "Self-Preservation", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to your saving throw against an effect you can see.", rules: "Reaction when making a saving throw against an effect you can see: add the rolled superiority die to the result."},
  {id: "man:firewall", name: "Firewall", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to a saving throw against a tech power.", rules: "Reaction when you or an ally within 60 ft make a saving throw against a tech power: add the rolled superiority die to the save."},
  {id: "man:one-with-the-force", name: "One with the Force", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to a Constitution saving throw to maintain Force concentration.", rules: "Once per turn on a Constitution saving throw to maintain concentration on a force power: add the rolled superiority die."},
  {id: "man:heads-up", name: "Heads Up", group: "maneuvers", kind: "maneuver", preview: "+N (ally superiority die) to your saving throw.", rules: "An ally used Heads Up to add their rolled superiority die to your saving throw."},
  {id: "man:targeted-strike", name: "Targeted Strike", group: "maneuvers", kind: "maneuver", preview: "+N (ally superiority die) to your next attack roll and damage roll.", rules: "An ally used Targeted Strike to add their rolled superiority die to your attack roll and damage roll."},
  {id: "man:conceal", name: "Conceal", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Dexterity (Stealth) checks.", rules: "When you make a Stealth check, expend a superiority die and add it to the roll."},
  {id: "man:flex", name: "Flex", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Strength (Athletics) checks.", rules: "When you make an Athletics check, expend a superiority die and add it to the roll."},
  {id: "man:perceive", name: "Perceive", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Wisdom (Perception) checks.", rules: "When you make a Perception check, expend a superiority die and add it to the roll."},
  {id: "man:tumble", name: "Tumble", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Dexterity (Acrobatics) checks.", rules: "When you make an Acrobatics check, expend a superiority die and add it to the roll."},
  {id: "man:assess-the-situation", name: "Assess the Situation", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Perception or Investigation checks.", rules: "Bonus action: make a Wisdom (Perception) or Intelligence (Investigation) check adding the rolled superiority die."},
  {id: "man:wild-senses", name: "Wild Senses", group: "maneuvers", kind: "maneuver", preview: "+N (rolled superiority die) to Perception or Survival checks.", rules: "Add the rolled superiority die to a Wisdom (Perception) or Wisdom (Survival) check with your companion."},
  {id: "man:wrestle-and-drag", name: "Wrestle and Drag", group: "maneuvers", kind: "maneuver", preview: "Drag a grappled creature at full speed (not halved) until end of turn.", rules: "Until the end of your turn, you can drag a grappled creature with you without your speed being halved."}
];

const combatOptionEffects = [
  {id: "opt:blindfighting-doubled", name: "Blindfighting: Doubled", group: "classStates", kind: "state", preview: "Blindfighting Style: Blindsight range doubled until start of your next turn.", rules: "You used your bonus action to double the range of your blindsight until the start of your next turn."},
  {id: "opt:equilibrium-mark", name: "Equilibrium Mark", group: "classStates", kind: "state", preview: "Equilibrium Style: +½ Dexterity modifier (minimum +1) to AC and Dexterity saves against marked target.", rules: "While wearing light or no armor and not wielding a shield, you gain a bonus to AC and Dexterity saving throws against effects the marked target controls equal to half your Dexterity modifier (minimum +1)."},
  {id: "opt:defense-mark", name: "Defense Mark", group: "classStates", kind: "state", preview: "Defense Style: reduce damage from marked target by ½ Strength/Constitution modifier (minimum 1).", rules: "While wearing medium or heavy armor with which you are proficient, damage dealt to you by the marked target is reduced by half your Strength or Constitution modifier (minimum 1, floor 1 damage)."},
  {id: "opt:secured-shield", name: "Secured: Light Shield", group: "classStates", kind: "state", preview: "Secured Style: treating fixed weapon as a light shield (+1 AC; cannot attack with it).", rules: "Until the start of your next turn, you treat your fixed weapon as a light shield (+1 AC) and cannot make attacks with it."},
  {id: "opt:dual-wield-ac", name: "Dual Wield AC", group: "classStates", kind: "state", preview: "Dual Wield Mastery: +1 AC per forgone Two-Weapon Fighting attack until next turn.", rules: "For each Two-Weapon Fighting attack you forgo, gain +1 AC until the start of your next turn."},
  {id: "opt:defensive-stance", name: "Defensive Stance", group: "classStates", kind: "state", preview: "Sentinel Mastery: special OA reactions equal to proficiency bonus until next turn.", rules: "While in your defensive stance, you have a number of special reactions equal to your proficiency bonus that you can only use to make opportunity attacks."},
  {id: "opt:defensive-ball", name: "Defensive Ball", group: "classStates", kind: "state", preview: "Colicoid: +½ proficiency bonus to AC until start of next turn (on Dash, no shield).", rules: "When you take the Dash action while not wielding a shield, gain a bonus to AC equal to half your proficiency bonus until the start of your next turn."},
  {id: "opt:trakata-distracted", name: "Trakata Form (Distracted)", group: "maneuvers", kind: "state", preview: "Debuff: disadvantage on your next attack roll against the Trakata user.", rules: "A creature flourished its lightsaber with Trakata Form; you have disadvantage on the next attack roll you make against it."},
  {id: "opt:duelist-mastery-ac", name: "Duelist Mastery (+prof AC)", group: "classStates", kind: "state", preview: "Duelist Mastery: +proficiency bonus to AC against one melee attack.", rules: "Reaction while wielding a one-handed weapon: add your proficiency bonus to your AC against one melee attack."},
  {id: "opt:secured-mastery-ac", name: "Secured Mastery (+prof AC)", group: "classStates", kind: "state", preview: "Secured Mastery: +proficiency bonus to AC against one attack (forgo fixed weapon attack).", rules: "Forgo an attack with a fixed weapon to add your proficiency bonus to your AC against one attack."}
];

const effectCatalog = [
  ...knownConditions.map(name => ({
    id: "cond:" + name.toLowerCase(),
    name,
    group: "conditions",
    kind: "condition",
    preview: (SW5E_CONDITIONS[name] || "").split("\n")[0].replace(/^- /, ""),
    rules: SW5E_CONDITIONS[name] || ""
  })),
  ...classCombatStates,
  ...combatOptionEffects,
  ...ongoingManeuverEffects,
  ...ongoingPowerEffects,
  ...damageTypes.filter(t => t !== "true").map(type => ({
    id: "res:" + type,
    name: type[0].toUpperCase() + type.slice(1) + " resistance",
    group: "resistances",
    kind: "resistance",
    damageType: type,
    preview: "Half damage from " + type + " damage sources.",
    rules: "You have resistance to " + type + " damage from this active effect."
  })),
  ...["Charmed", "Diseased", "Frightened", "Paralyzed", "Poisoned", "Shocked", "Stunned"].map(cond => ({
    id: "imm:" + cond.toLowerCase(),
    name: "Immune to " + cond,
    group: "immunities",
    kind: "immunity",
    immuneTo: cond,
    preview: "Suppresses the " + cond + " condition while active.",
    rules: "While this effect is active, you are immune to the " + cond + " condition."
  }))
];

const effectCatalogByName = new Map(effectCatalog.map(item => [item.name.toLowerCase(), item]));
const effectGroupLabels = {
  conditions: "Conditions",
  classStates: "Class, style & species states",
  maneuvers: "Maneuver buffs & debuffs",
  powers: "Ongoing powers",
  resistances: "Damage resistances",
  immunities: "Condition immunities"
};

const recognizedCondition = text => knownConditions.find(name => name.toLowerCase() === String(text).toLowerCase());

function conditionEntry(name, value, context, extra = {}) {
  return {name, value, context, ...extra};
}

function conditionState(session, profile = null) {
  const entries = session.effects || [];
  const immunities = new Set();
  const resistances = new Set();
  const removedResistances = new Set();
  const prof = profile || (typeof app !== "undefined" ? app?.character?.profile : null);
  if (prof && typeof passiveFeatureProfile === "function") {
    const passive = passiveFeatureProfile(prof, session);
    for (const im of passive.immunities) immunities.add(im);
  }
  for (const entry of entries) {
    const def = effectCatalogByName.get(String(entry.name).toLowerCase());
    if (def?.kind === "immunity") immunities.add(def.immuneTo);
    if (def?.kind === "resistance") resistances.add(def.damageType);
    const p = powerRule(entry.name);
    if (p?.effects && !(p.effects.charges?.perTurn && entry.surgeActive === false)) {
      for (const im of p.effects.immunities || []) immunities.add(im);
      for (const r of p.effects.resistances || []) resistances.add(r);
      if ((p.effects.choiceKind === "energyDamageType" || p.effects.choiceKind === "disperseDamageType") && entry.choice) {
        const dt = String(entry.choice).toLowerCase();
        if (normalizeName(p.name) === "elemental accelerant") removedResistances.add(dt);
        else if (normalizeName(p.name) !== "enhance weapon") resistances.add(dt);
      }
    }
  }
  for (const dt of removedResistances) resistances.delete(dt);

  const activeEntries = entries.filter(entry => !immunities.has(entry.name));
  const powerConditions = new Set();
  let powerSlowed = 0;
  let powerSpeedZero = false;
  let powerNoReactions = false;
  let powerNoHealing = false;
  let powerIncomingAdv = false;
  let powerIncomingDisadv = false;
  let ignoreExhaustion = false;

  for (const entry of activeEntries) {
    const p = powerRule(entry.name);
    const eff = p?.effects;
    if (!eff || (eff.charges?.perTurn && entry.surgeActive === false)) continue;
    for (const cond of eff.appliesConditions || []) {
      if (!immunities.has(cond)) powerConditions.add(cond);
    }
    if (eff.choiceKind === "blindOrDeafen" && entry.choice && !immunities.has(entry.choice)) {
      powerConditions.add(entry.choice);
    }
    if (eff.slowedLevels) powerSlowed += eff.slowedLevels;
    if (eff.speedZero) powerSpeedZero = true;
    if (eff.noReactions) powerNoReactions = true;
    if (eff.noHealing) powerNoHealing = true;
    if (eff.incomingAdvantage) powerIncomingAdv = true;
    if (eff.incomingDisadvantage) powerIncomingDisadv = true;
    if (eff.ignoreExhaustion) ignoreExhaustion = true;
  }

  const has = name => activeEntries.some(entry => normalizeName(entry.name) === normalizeName(name)) || powerConditions.has(name);
  const sum = (name, max) => Math.min(max, activeEntries.filter(entry => entry.name === name).reduce((n, entry) => n + (entry.value || 1), 0));
  const context = name => activeEntries.some(entry => entry.name === name && entry.context);
  const controlPain = has("Control Pain");
  const irradiateLevel = has("Irradiate") ? 1 : 0;
  const rawExhaustion = session.exhaustion || 0;
  const exhaustion = ignoreExhaustion ? 0 : Math.min(5, rawExhaustion + irradiateLevel);
  const dead = rawExhaustion >= 6 || (!controlPain && (session.death?.failures || 0) >= 3);
  const unconscious = (!controlPain && session.hp === 0) || has("Unconscious");
  const stunned = has("Stunned");
  const petrified = has("Petrified");
  const paralyzed = has("Paralyzed");
  const blinded = has("Blinded") && (powerConditions.has("Blinded") || activeEntries.some(entry => entry.name === "Blinded" && !entry.context));
  const invisibleSuppressed = has("Gleaming Outline") || has("World on Fire");
  const invisible = !invisibleSuppressed && ((has("Invisible") && (powerConditions.has("Invisible") || activeEntries.some(entry => entry.name === "Invisible" && !entry.context))) || has("Empty Body"));
  const incapacitated = dead || unconscious || stunned || petrified || paralyzed || has("Incapacitated");
  const prone = unconscious || has("Prone");
  const dodging = has("Dodging") && !incapacitated;
  if (petrified) {
    immunities.add("Poisoned");
    immunities.add("Diseased");
  }
  return {
    dead, unconscious, incapacitated, prone, petrified, dodging,
    poisoned: has("Poisoned") && !petrified,
    blinded, sightBlocked: has("Blinded"), deafened: has("Deafened"),
    invisible, frightened: context("Frightened") || powerConditions.has("Frightened"),
    restrained: has("Restrained"), shocked: has("Shocked"), weakened: has("Weakened"),
    noReactions: has("Shocked") || powerNoReactions || activeEntries.some(e => normalizeName(e.name) === "befogging ichor"),
    noHealing: powerNoHealing || activeEntries.some(e => normalizeName(e.name) === "neuroblock"),
    ignoreExhaustion,
    immunities,
    resistances: [...resistances],
    automaticSaveFailure: unconscious || stunned || petrified || paralyzed,
    speedZero: unconscious || stunned || petrified || paralyzed || powerSpeedZero || has("Grappled") || has("Steady Aim"),
    slowed: has("Restrained") || exhaustion >= 5 ? 4 : Math.min(4, sum("Slowed", 4) + powerSlowed + Number(exhaustion >= 2)),
    corroded: Math.max(0, sum("Corroded", 3) - (prof && typeof characterTraits === "function" ? (characterTraits(prof, session).corrodedIgnore || 0) : 0)),
    exhaustion,
    incomingAdvantage: (!incapacitated && prof && normalizeName(prof.className) === "operative" && (prof.level || 1) >= 18) ? false : (blinded || unconscious || stunned || petrified || paralyzed || has("Restrained") || powerIncomingAdv || activeEntries.some(e => normalizeName(e.name) === "distracting blow")),
    incomingDisadvantage: invisible || dodging || has("Hidden") || has("Guarded") || powerIncomingDisadv,
    nearbyCritical: unconscious || paralyzed
  };
}
function effectiveModifier(profile, session, ability, conditions) {
  const scores = effectiveScores(profile, session);
  const mod = modifier(scores[ability]);
  return conditions.weakened && mod > 0 ? Math.floor(mod / 2) : mod;
}

function hitPointMaximum(profile, session) {
  const base = baseMaxHP(profile, session);
  const c = conditionState(session, profile);
  return c.exhaustion >= 4 ? Math.max(1, Math.floor(base / 2)) : base;
}

function movementSpeed(base, conditions, slowedStep = null) {
  if (conditions.speedZero || conditions.slowed === 4) return 0;
  if (slowedStep && conditions.slowed > 0) {
    return Math.max(0, base - conditions.slowed * slowedStep);
  }
  return Math.max(0, base - [0, 15, 25, 30][conditions.slowed]);
}

function checkMode(profile, session, ability, skill, armor) {
  const c = conditionState(session, profile);
  const traits = characterTraits(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const advSources = [];
  if (session.rage && ability === "Strength") advSources.push("Rage");
  if (session.rage && ability === "Dexterity" && typeof hasClassOption === "function" && hasClassOption(profile, session, "Varactyl's Instinct")) advSources.push("Varactyl's Instinct");
  if (skill === "Intimidation" && traits.maniacalRage) advSources.push("Maniacal Rage");
  if (effMods.allCheckAdv) advSources.push("Active power");
  if (effMods.abilityCheckAdv?.has(ability)) advSources.push("Active power");
  if (skill === "Stealth" && effMods.stealthAdv) advSources.push("Synchronicity");
  const disSources = [
    c.exhaustion > 0 && "Exhaustion",
    c.poisoned && "Poisoned",
    c.frightened && "Frightened",
    effMods.abilityCheckDisadv?.has(ability) && "Active power",
    effMods.mindTrickDisadv && (skill === "Perception" || skill === "Investigation") && "Mind Trick",
    armor?.nonproficient && ["Strength", "Dexterity"].includes(ability) && "Armor proficiency"
  ].filter(Boolean);
  return {
    advantage: advSources.join(", "),
    disadvantage: disSources.join(", "),
    automatic: c.incapacitated && ["Strength", "Dexterity", "Constitution"].includes(ability),
    conditional: [
      c.sightBlocked && "Checks requiring sight automatically fail",
      c.deafened && "Checks requiring hearing automatically fail",
      skill === "Stealth" && armor?.silent && "Advantage on sound-based Stealth checks (Silent armor)",
      skill === "Stealth" && armor?.concealing && "Advantage on sight-based Stealth checks (Concealing shield)",
      skill === "Stealth" && armor?.obtrusiveShield && "Disadvantage on sight-based Stealth checks (Obtrusive shield)",
      ability === "Strength" && armor?.steadfast && "Advantage to avoid being moved (Steadfast)",
      skill === "Athletics" && speciesRecord(profile?.species)?.climbAdv && "Advantage on climbing checks",
      skill === "Investigation" && speciesRecord(profile?.species)?.investigationAdv && ("Advantage: " + speciesRecord(profile?.species).investigationAdv),
      skill === "Insight" && speciesRecord(profile?.species)?.insightAdv && ("Advantage: " + speciesRecord(profile?.species).insightAdv),
      ability === "Strength" && ownedCombatOptions(profile, session).styles.some(s => s.name === "Defense Style") && "Advantage to avoid being moved (Defense Style)",
      ability === "Dexterity" && ownedCombatOptions(profile, session).styles.some(s => s.name === "Equilibrium Style") && "Advantage to avoid being moved (Equilibrium Style)",
      (session?.effects || []).some(e => normalizeName(e.name) === "daring escape") && "Advantage to break grapple, restrain, or slow (Daring Escape)",
      effMods.flexibleAdv && "Advantage on checks to escape grapple or restraint (Mutate/Augment: Flexible)",
      ownedCombatOptions(profile, session).styles.some(s => s.name === "Guerrilla Style") && "Advantage to avoid forced movement (Guerrilla Style)",
      ownedCombatOptions(profile, session).styles.some(s => s.name === "Spotting Style") && "Advantage on checks to see through illusions (Spotting Style)",
      traits.isBerserker && (profile.level || 1) >= 18 && ability === "Strength" && "Indomitable Might: minimum total equals Strength score",
      traits.isOperative && (profile.level || 1) >= 11 && "Reliable Talent: minimum roll threshold on proficient checks",
      typeof hasClassOption === "function" && hasClassOption(profile, session, "Hardened Mind") && ability === "Intelligence" && "Advantage on Intelligence checks to discern illusions (Hardened Mind)",
      (skill === "Perception" || skill === "Survival") && (session?.effects || []).some(e => normalizeName(e.name) === "ranger's quarry" || normalizeName(e.name) === "ranger’s quarry") && "Advantage to find your Ranger’s Quarry (same planet)",
      skill === "Lore" && normalizeName(profile?.species) === "mirialan" && "Expertise on Lore checks regarding the Force or spiritual matters (Spiritual)"
    ].filter(Boolean).join(". ")
  };
}

function saveMode(profile, session, ability, armor) {
  const c = conditionState(session, profile);
  const traits = characterTraits(profile, session);
  const effMods = activeEffectModifiers(profile, session);
  const advSources = [];
  const sp = speciesRecord(profile?.species);
  if (ability === "Constitution" && (sp?.conSaveAdv || traits.gamorreanToughness)) advSources.push(sp?.name || "Species");
  if (ability === "Dexterity" && sp?.dexSaveAdv) advSources.push("Small and Nimble");
  if (ability === "Strength" && session.rage) advSources.push("Rage");
  if (ability === "Constitution" && session.rage && typeof hasClassOption === "function" && hasClassOption(profile, session, "Acklay's Instinct")) advSources.push("Acklay's Instinct");
  if (ability === "Dexterity" && c.dodging) advSources.push("Dodging");
  if (ability === "Dexterity" && effMods.dexSaveAdv) advSources.push("Active power");
  if (effMods.allSaveAdv) advSources.push("Active power");
  if (ability === "Wisdom" && effMods.wisSaveAdv) advSources.push("Beacon of Hope");
  if (effMods.strDexConSaveAdv && ["Strength", "Dexterity", "Constitution"].includes(ability)) advSources.push("Vitality Shield");
  const disSources = [
    ability === "Dexterity" && sp?.dexSaveDisadv && "Slow and Lethargic",
    ability === "Dexterity" && effMods.dexSaveDisadv && "Master Malacia",
    effMods.abilitySaveDisadv?.has(ability) && "Active power",
    c.exhaustion >= 3 && "Exhaustion",
    c.restrained && ability === "Dexterity" && "Restrained",
    armor?.nonproficient && ["Strength", "Dexterity"].includes(ability) && "Armor proficiency"
  ].filter(Boolean);
  const condParts = [];
  if (ability === "Dexterity" && traits.dangerSense && !c.sightBlocked && !c.deafened && !c.incapacitated) {
    condParts.push("Danger Sense grants advantage against effects you can see.");
  }
  if (ability === "Constitution" && session.concentration && (hasFeat(session, "Combat Caster") || hasFeat(session, "War Caster"))) {
    condParts.push("Advantage on Constitution saves to maintain Concentration.");
  }
  if (ability === "Dexterity" && traits.shieldBonusToDexSaves && armor?.shield && !armor?.nonproficient) {
    condParts.push("Shield Mastery: add +" + (Number(armor.shield.ac) || 0) + " shield bonus vs powers & harmful effects.");
  }
  if (ability === "Constitution" && sp?.poisonSaveAdv) condParts.push("Advantage on saves against poison (Natural Resistance).");
  if (sp?.ionLightningSaveDisadv) condParts.push("Disadvantage on saving throws against effects dealing ion or lightning damage (Droid Vulnerabilities).");
  if (sp?.closedMind && (ability === "Wisdom" || ability === "Charisma")) condParts.push("Advantage on " + ability + " saves against force powers (Closed Mind).");
  if (ability === "Constitution" && effMods.poisonSaveAdv) condParts.push("Advantage on saves against poison (Active power).");
  if (ability === "Constitution" && sp?.coldSaveAdv) condParts.push("Advantage on saves vs extreme cold.");
  if (ability === "Constitution" && sp?.heatSaveAdv) condParts.push("Advantage on saves vs extreme heat.");
  if (ability === "Strength" && sp?.climbAdv) condParts.push("Advantage on Strength saves involving climbing.");
  if (ability === "Strength" && armor?.steadfast) condParts.push("Advantage on Strength saves to avoid being moved (Steadfast).");
  if (ability === "Strength" && ownedCombatOptions(profile, session).styles.some(s => s.name === "Defense Style")) {
    condParts.push("Advantage on Strength saves to avoid being moved (Defense Style).");
  }
  if (ability === "Dexterity" && ownedCombatOptions(profile, session).styles.some(s => s.name === "Equilibrium Style")) {
    condParts.push("Advantage on Dexterity saves to avoid being moved (Equilibrium Style).");
  }
  if (armor?.insulated > 0) {
    condParts.push("Insulated " + armor.insulated + ": treat d20 rolls below " + armor.insulated + " as " + armor.insulated + " vs ion/lightning damage.");
  }
  if ((session?.effects || []).some(e => normalizeName(e.name) === "daring escape")) {
    condParts.push("Advantage on saves to break grapple, restrain, or slow (Daring Escape).");
  }
  if (ownedCombatOptions(profile, session).styles.some(s => s.name === "Guerrilla Style")) {
    condParts.push("Advantage on saves to avoid forced movement (Guerrilla Style).");
  }
  if (ownedCombatOptions(profile, session).styles.some(s => s.name === "Spotting Style")) {
    condParts.push("Advantage on saves against illusions (Spotting Style).");
  }
  if ((ability === "Wisdom" || ability === "Charisma") && ownedCombatOptions(profile, session).masteries.some(m => m.name === "Berserk Mastery")) {
    condParts.push("Advantage on saves against being frightened or mind-controlled (Berserk Mastery).");
  }
  if (ability === "Constitution" && hasFeat(session, "Heat Shielded")) {
    condParts.push("Advantage on saves against extreme heat (Heat Shielded).");
  }
  if (ability === "Dexterity" && ((traits.isMonk || traits.isOperative) && (profile.level || 1) >= 7)) {
    condParts.push("Evasion: take 0 damage on pass, half damage on fail.");
  }
  const isConscious = !c.unconscious && !c.dead;
  if ((session?.effects || []).some(e => normalizeName(e.name) === "aura of conviction") || (traits.isGuardian && (profile.level || 1) >= 3 && isConscious && typeof hasClassOption === "function" && hasClassOption(profile, session, "Aura of Conviction"))) {
    condParts.push("Advantage on saves against Charmed or Frightened (Aura of Conviction).");
  }
  if ((session?.effects || []).some(e => normalizeName(e.name) === "mesmer's routine") || (traits.isScout && (profile.level || 1) >= 3 && isConscious && typeof hasClassOption === "function" && hasClassOption(profile, session, "Mesmer's Routine"))) {
    condParts.push("Advantage on saves against being Incapacitated or put to sleep (Mesmer's Routine).");
  }
  if (ability === "Constitution" && ((session?.effects || []).some(e => normalizeName(e.name) === "nomad's routine") || (traits.isScout && (profile.level || 1) >= 3 && isConscious && typeof hasClassOption === "function" && hasClassOption(profile, session, "Nomad's Routine")))) {
    condParts.push("Advantage on CON saves against unenhanced exhaustion and extreme environments (Nomad's Routine).");
  }
  if (typeof hasClassOption === "function" && hasClassOption(profile, session, "Hardened Mind")) {
    condParts.push("Advantage on saves against illusions (Hardened Mind).");
  }
  if (typeof hasClassOption === "function" && hasClassOption(profile, session, "Resolute")) {
    const intM = effectiveModifier(profile, session, "Intelligence", c);
    condParts.push("Resolute: add " + signed(intM) + " (Intelligence) to saves against Charmed or Frightened.");
  }
  const conditional = condParts.join(" ");
  return {
    advantage: advSources.join(", "),
    disadvantage: disSources.join(", "),
    conditional,
    automatic: c.automaticSaveFailure && ["Strength", "Dexterity"].includes(ability)
  };
}

function rollD20(advantage, disadvantage) {
  const dice = [rollDie(20)];
  if (Boolean(advantage) !== Boolean(disadvantage)) dice.push(rollDie(20));
  return {dice, value: advantage && !disadvantage ? Math.max(...dice) : disadvantage && !advantage ? Math.min(...dice) : dice[0]};
}
