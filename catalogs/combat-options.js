// Generated from sw5e_source/maneuvers.json, fightingStyle.json, fightingMastery.json, lightsaberForm.json (100% verbatim-verified)
const SW5E_MANEUVERS = [
  {
    "name": "Administer Aid",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "As an action, you can expend a superiority die to tend to a creature you can touch. The creature regains a number of hit points equal to the number rolled + your maneuver ability modifier.",
    "mechanics": {
      "timing": "action",
      "summary": "Touch ally: heal {supDie}{mentalManeuverModTerm} HP"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Administer Aid",
        "summary": "Action (1 superiority die): touch a creature to restore superiority die + maneuver ability modifier HP.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Administer Aid (Greater)",
    "type": "Mental",
    "prerequisite": "Administer Aid (Improved) maneuver",
    "description": "You can use your Administer Aid maneuver as an action, bonus action, or reaction on your turn.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Administer Aid",
      "summary": "Use Administer Aid as action, bonus action, or reaction on your turn"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Administer Aid",
        "newZone": "reaction",
        "summary": "Use Administer Aid as an action, bonus action, or reaction on your turn.",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Administer Aid (Improved)",
    "type": "Mental",
    "prerequisite": "Administer Aid maneuver",
    "description": "You can use your Administer Aid maneuver as an action or bonus action.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Administer Aid",
      "summary": "Use Administer Aid as action or bonus action"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Administer Aid",
        "newZone": "bonus",
        "summary": "Use Administer Aid as an action or bonus action."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Adrenaline Hit",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "You can use an action and expend one superiority die to inject a creature with regenerative medication that temporarily enhances their agility. When you do so, a creature you can touch regains hit points equal to the superiority die roll. Additionally, until the start of your next turn, when that creature would take damage, the amount is reduced by an amount equal to your maneuver ability modifier.",
    "mechanics": {
      "timing": "action",
      "summary": "Touch ally: heal {supDie} HP; reduce incoming damage by {mentalManeuverModMin0} until next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Adrenaline Hit",
        "summary": "Action (1 superiority die): touch heals superiority die HP; until start of your next turn, target reduces incoming damage by your maneuver ability modifier.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Agonizing Lethargy",
    "type": "Mental",
    "prerequisite": "",
    "description": "You can use an action to expend a superiority die. When you do so, choose a creature you can see within 30 feet of you. The target must make a Constitution saving throw. On a failed save, the target takes 1d6 necrotic damage for each attack it makes until the start of your next turn.",
    "mechanics": {
      "timing": "action",
      "save": "CON",
      "summary": "30 ft: target takes 1d6 necrotic per attack it makes until next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Agonizing Lethargy",
        "summary": "Action (1 superiority die): target within 30 ft makes Constitution save or takes 1d6 necrotic damage for each attack it makes until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Assess the Situation",
    "type": "General",
    "prerequisite": "",
    "description": "You can expend one superiority die to make a Wisdom (Perception) or Intelligence (Investigation) check as a bonus action, adding the superiority die to the check.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Perception or Investigation check + {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Assess the Situation",
        "summary": "Bonus action (1 superiority die): make a Perception or Investigation check, adding the superiority die.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception",
          "Investigation"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "as a bonus action by expending 1 superiority die"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Assist",
    "type": "General",
    "prerequisite": "Proficiency in Medicine",
    "description": "When you make an Medicine check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Medicine check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Medicine"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Automatic Startup Sequence",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When a creature makes a saving throw against a tech power you cast, you may expend a superiority die, subtracting the number rolled from their total.",
    "mechanics": {
      "timing": "free",
      "summary": "On save against your tech power: subtract {supDie} from target's save"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Automatic Startup Sequence",
        "text": "When a creature makes a saving throw against your tech power, expend 1 superiority die to subtract the roll from its save total.",
        "castingScope": {
          "powerType": "Tech",
          "delivery": [
            "save"
          ]
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Befogging Ichor",
    "type": "Mental",
    "prerequisite": "",
    "description": "You can use a bonus action to expend a superiority die. When you do so, choose a creature you can see within 30 feet of you. The target must make a Wisdom saving throw. On a failed save, the target can't take reactions until the start of its next turn and on its turn must use its movement to move half its speed in a random direction. Roll a d8 and assign a direction to each face. If the direction rolled is blocked, the target doesn't move.",
    "mechanics": {
      "timing": "bonus",
      "save": "WIS",
      "summary": "30 ft: no reactions; moves half speed in random direction on its turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Befogging Ichor",
        "summary": "Bonus action (1 superiority die): target within 30 ft makes Wisdom save or loses reactions until start of its next turn and moves half speed in a random d8 direction.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfTargetNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "target",
        "kind": "prompt",
        "note": "Target must use its movement to move half its speed in a random d8 direction (if blocked, it doesn't move)."
      }
    ]
  },
  {
    "name": "Body Over Bother",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you are forced to make an Strength, Dexterity, or Constitution saving throw, you can expend a superiority die to change the saving throw ability to your maneuver ability modifier.",
    "mechanics": {
      "timing": "free",
      "summary": "On Strength/Dexterity/Constitution save: substitute maneuver ability modifier"
    },
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Strength",
          "Dexterity",
          "Constitution"
        ],
        "mode": "swap",
        "condition": "expend 1 superiority die to use maneuver ability modifier instead"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Call the Guards",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "When a creature makes an attack roll against you, you can use your reaction and expend a superiority die and command a willing ally within 5 feet of that creature to use their reaction to intercede. The creature is then forced to make an attack on the ally instead. If the attack misses, the ally can immediately make a weapon attack against that creature as a part of that same reaction. Roll the superiority die, and add the result to the ally's attack roll.",
    "mechanics": {
      "timing": "reaction",
      "summary": "When attacked: ally within 5 ft of attacker intercedes; counterattack +{supDie} if missed"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Call the Guards",
        "summary": "Reaction (1 superiority die) when attacked: willing ally within 5 ft of attacker uses reaction to take the attack; if it misses, ally makes a weapon attack adding the superiority die to hit.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Call to Arms",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "If you are surprised at the start of combat and aren't incapacitated, you can expend one superiority die to act normally.",
    "mechanics": {
      "timing": "free",
      "summary": "When surprised at start of combat: act normally"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Call to Arms",
        "summary": "When surprised at start of combat (and not incapacitated), expend 1 superiority die to act normally.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Call to Arms (Improved)",
    "type": "Mental",
    "prerequisite": "Call to Arms maneuver",
    "description": "When you use your Call to Arms maneuver, you can roll the superiority die and extend the benefits of the maneuver to a number of allies up to the result of the roll, provided those allies can see or hear you.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Call to Arms",
      "summary": "Extend Call to Arms to up to {supDie} allies"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Call to Arms (Improved)",
        "text": "Roll the superiority die when using Call to Arms to extend its anti-surprise benefit to up to that many allies who can see or hear you."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Calling Card",
    "type": "Physical",
    "prerequisite": "",
    "description": "As a bonus action, you can expend a superiority die to throw a sonic charge at a target you can see within 30 feet. When you do so, the target and each creature of your choice within 5 feet of it must make Dexterity saving throws, taking sonic damage on a failure. The sonic damage equals the number rolled on the superiority die.",
    "mechanics": {
      "timing": "bonus",
      "save": "DEX",
      "summary": "30 ft (5-ft burst): sonic damage equal to {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Calling Card",
        "summary": "Bonus action (1 superiority die): throw sonic charge within 30 ft; target and chosen creatures within 5 ft make Dexterity save or take superiority die sonic damage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Chains of Transfixing",
    "type": "Mental",
    "prerequisite": "",
    "description": "You can use a bonus action to expend a superiority die. When you do so, choose a creature you can see within 30 feet of you that is no more than one size larger than you. The target must succeed on a Strength saving throw or gain four slowed levels until the start of your next turn.",
    "mechanics": {
      "timing": "bonus",
      "save": "STR",
      "summary": "30 ft (up to 1 size larger): 4 slowed levels until start of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Chains of Transfixing",
        "summary": "Bonus action (1 superiority die): target within 30 ft (up to 1 size larger) makes Strength save or gains 4 slowed levels until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Charge",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "As a bonus action on your turn, you can expend one superiority die to spur your allies to move. Until the start of your next turn, creatures you choose within 10 feet of you who can see or hear you can move an additional distance equal to 5 times the superiority die rolled on their turn and ignore unenhanced difficult terrain.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Allies within 10 ft gain +5 × {supDie} ft movement & ignore difficult terrain"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Charge",
        "summary": "Bonus action (1 superiority die): chosen allies within 10 ft gain +5 × die ft movement and ignore unenhanced difficult terrain until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Charging Attack",
    "type": "Physical",
    "prerequisite": "",
    "description": "If you move at least 10 feet towards your target before successfully hitting them with a melee attack, you may expend a superiority die, causing the target to take additional damage equal to the result, and forcing it to make a Strength saving throw. On a failed save the creature is knocked prone.",
    "mechanics": {
      "timing": "free",
      "save": "STR",
      "summary": "On melee hit after 10+ ft move: +{supDie} damage & knock prone"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Charging Attack",
        "summary": "After moving at least 10 ft toward target and hitting with a melee attack, expend 1 superiority die for +die damage and Strength save or knocked prone.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Charming Presence",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "As an action, you can make a Charisma (Persuasion) check and expend one superiority die to attempt to charm a humanoid creature who can see or hear you within 60 feet. Add the superiority die to the roll. The target makes a contested Wisdom (Insight) check. If your check succeeds, the target is charmed by you until the end of your next turn.",
    "mechanics": {
      "timing": "action",
      "summary": "60 ft: Persuasion + {supDie} against Insight; charmed until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Charming Presence",
        "summary": "Action (1 superiority die): Persuasion + die against humanoid's Insight within 60 ft to charm until end of your next turn.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Persuasion"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "Charming Presence action to charm a humanoid within 60 ft"
      }
    ],
    "durationSpec": {
      "anchor": "endOfSourceNextTurn"
    }
  },
  {
    "name": "Commander's Strike",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you take the Attack action on your turn, you can forgo one of your attacks and use a bonus action to direct one of your companions to strike. When you do so, choose a friendly creature who can see or hear you and expend one superiority die. That creature can immediately use its reaction to make one weapon attack, adding the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "replace-attack",
      "summary": "Forgo 1 attack + bonus action: ally uses reaction to attack (+{supDie} damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Commander's Strike",
        "summary": "Forgo 1 attack + bonus action + 1 superiority die: ally who can see/hear you uses reaction to make 1 weapon attack adding the die to damage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Commander's Strike (Greater)",
    "type": "Physical",
    "prerequisite": "Commander's Strike (Improved) maneuver",
    "description": "When you use the Commander's Strike maneuver, you can choose to forgo an attack or use your bonus action, rather than both. All the other rules of Commander's Strike still apply to you.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Commander's Strike",
      "summary": "Choose to forgo 1 attack OR use bonus action"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Commander's Strike",
        "newZone": "bonus",
        "summary": "Forgo an attack OR use your bonus action (not both) for Commander's Strike."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Commander's Strike (Improved)",
    "type": "Physical",
    "prerequisite": "Commander's Strike maneuver",
    "description": "When you use the Commander's Strike maneuver, you no longer have to forgo an attack as a part of that maneuver. All the other rules of Commander's Strike still apply to you.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Commander's Strike",
      "summary": "Bonus action only (no longer forgo an attack)"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Commander's Strike",
        "newZone": "bonus",
        "summary": "Commander's Strike no longer requires forgoing an attack."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Conceal",
    "type": "General",
    "prerequisite": "Proficiency in Stealth",
    "description": "When you make an Stealth check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Stealth check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Stealth"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Crippling Blow",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to cripple the creature. You add the superiority die to the attack's damage roll and the creature's gains 1 slowed level until the end of their next turn.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon hit: +{supDie} damage & 1 slowed level until end of target's next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Crippling Blow",
        "summary": "On weapon hit (1 superiority die): +die damage and target gains 1 slowed level until end of its next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfTargetNextTurn"
    }
  },
  {
    "name": "Daring Escape",
    "type": "General",
    "prerequisite": "",
    "description": "You can expend one superiority die to take the Disengage action as a bonus action on your turn. Until the end of this turn, you have advantage on ability checks and saving throws to break effects that would grapple, restrain or slow you.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Disengage; advantage on checks and saves to break grapple, restrain, or slow"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Daring Escape",
        "summary": "Bonus action (1 superiority die): Disengage and gain advantage on checks/saves to break grapple, restrain, or slow until end of turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    }
  },
  {
    "name": "Dark Transference",
    "type": "Mental",
    "prerequisite": "",
    "description": "When you hit a creature with an attack, you can expend a superiority die and roll it to attempt to siphon life from it. The target must make a Constitution saving throw. On a failed save, add the result to the damage roll, and you regain one expended Hit Die.",
    "mechanics": {
      "timing": "free",
      "save": "CON",
      "summary": "On hit: +{supDie} damage & regain 1 expended Hit Die"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Dark Transference",
        "summary": "On hit (1 superiority die): target makes Constitution save or takes +die damage and you regain 1 expended Hit Die.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Deathseek",
    "type": "Mental",
    "prerequisite": "",
    "description": "When an attack made against a hostile creature that you can see would miss, you can use a reaction and expend a superiority die and roll it to force the creature to instead take the hit. The creature must make a Wisdom saving throw. On a failed save, the target takes the minimum damage the attack could have dealt plus additional damage equal to the result of the superiority die.",
    "mechanics": {
      "timing": "reaction",
      "save": "WIS",
      "summary": "When attack misses hostile: force hit for minimum damage + {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Deathseek",
        "summary": "Reaction (1 superiority die) when an attack against a visible foe misses: target makes Wisdom save or takes minimum attack damage + superiority die.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Deceive",
    "type": "General",
    "prerequisite": "Proficiency in Deception",
    "description": "When you make an Deception check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Deception check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Deception"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Deliberate Movement",
    "type": "General",
    "prerequisite": "",
    "description": "You can expend one superiority die to take the Dash action as a bonus action and ignore the effects of unenhanced difficult terrain until the end of your turn.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Dash and ignore unenhanced difficult terrain this turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Deliberate Movement",
        "summary": "Bonus action (1 superiority die): Dash and ignore unenhanced difficult terrain until end of turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    }
  },
  {
    "name": "Disarming Blow",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to disarm the target, forcing it to drop one item of your choice that it's holding. You add the superiority die to the attack's damage roll, and the target must make a Strength saving throw. On a failed save, it drops the object you choose. If you have a free hand and are within 5 feet of the creature, you can catch the item. Otherwise, the object lands at the creature's feet.",
    "mechanics": {
      "timing": "free",
      "save": "STR",
      "summary": "On weapon hit: +{supDie} damage & force target to drop held item"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Disarming Blow",
        "summary": "On weapon hit (1 superiority die): +die damage and Strength save or target drops a chosen held item (catch if free hand within 5 ft).",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Distracting Blow",
    "type": "Mental",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to distract the creature, giving your allies an opening. You add the superiority die to the attack's damage roll. The next attack roll against the target by an attacker other than you has advantage if the attack is made before the start of your next turn.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon hit: +{supDie} damage; next ally attack before next turn has advantage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Distracting Blow",
        "summary": "On weapon hit (1 superiority die): +die damage and next attack by an ally against target before start of your next turn has advantage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Effective Flanking",
    "type": "Mental",
    "prerequisite": "",
    "description": "As a bonus action, you choose a target within 30 feet that you can see to make a Wisdom saving throw. On a failed save, roll a superiority die; the result is added to the first attack roll against the creature before the start of your next turn.",
    "mechanics": {
      "timing": "bonus",
      "save": "WIS",
      "summary": "30 ft: add {supDie} to first attack roll against target before next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Effective Flanking",
        "summary": "Bonus action (1 superiority die): target within 30 ft makes Wisdom save or add die roll to the first attack roll against it before start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfSourceNextTurn"
    }
  },
  {
    "name": "Effective Flanking (Greater)",
    "type": "Mental",
    "prerequisite": "Effective Flanking (Improved) maneuver",
    "description": "When you use the Effective Flanking maneuver, you add your maneuver ability modifier to both the attack and damage roll for the first attack against the creature before the start of your next turn.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Effective Flanking",
      "summary": "Add maneuver modifier to attack & damage on Effective Flanking"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Effective Flanking",
        "newZone": "bonus",
        "summary": "Also add your maneuver ability modifier to both attack and damage of that first attack."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Effective Flanking (Improved)",
    "type": "Mental",
    "prerequisite": "Effective Flanking maneuver",
    "description": "When you use the Effective Flanking maneuver, you add the result of the superiority die to both the attack and damage roll for the first attack against the creature before the start of your next turn.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Effective Flanking",
      "summary": "Add die to both attack & damage on Effective Flanking"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Effective Flanking",
        "newZone": "bonus",
        "summary": "Add the superiority die to both attack and damage of that first attack."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Empathize",
    "type": "General",
    "prerequisite": "Proficiency in Insight",
    "description": "When you make an Insight check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Insight check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Insight"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Encouraging Pace",
    "type": "Mental",
    "prerequisite": "",
    "description": "You can use a bonus action to expend and roll a superiority die. When you do so, a number of friendly creatures equal to your maneuver ability modifier can immediately use their reaction to move a number of feet equal to 5 times the number rolled on the superiority die.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Up to {mentalManeuverModMin0} allies use reaction to move 5 × {supDie} ft"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Encouraging Pace",
        "summary": "Bonus action (1 superiority die): up to maneuver ability modifier allies may use their reaction to move 5 × die feet.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Encouraging Speech",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "You can expend a superiority die to give an encouraging speech, spending the next minute rallying your allies. You grant two allies temporary hit points equal to the amount rolled on the superiority die + your maneuver ability modifier.\n\nThis increases to three allies at 5th level, four allies at 9th level, five allies at 13th level, and six allies at 17th level.",
    "mechanics": {
      "timing": "out-of-combat",
      "summary": "Grant {encouragingSpeechAllies} allies temporary HP ({supDie}{mentalManeuverModTerm})"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Encouraging Speech",
        "summary": "1 minute (1 superiority die): grant {encouragingSpeechAllies} allies temporary HP equal to {supDie}{mentalManeuverModTerm}.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    }
  },
  {
    "name": "Enhancement Injection",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "As an action, you can expend one superiority die to inject a creature you can touch with enhancements, granting them temporary hit points equal to the superiority die roll + your maneuver ability modifier, which last for 1 minute. Additionally, when the target makes a Strength or Constitution check or saving throw while it has these temporary hit points, it gains a bonus equal to your maneuver ability modifier.",
    "mechanics": {
      "timing": "action",
      "summary": "Touch: temporary HP ({supDie}{mentalManeuverModTerm}) for 1 minute; {mentalManeuverModSigned} to Strength and Constitution checks and saves while active"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Enhancement Injection",
        "summary": "Action (1 superiority die): touch grants die + maneuver modifier temporary HP (1 minute); while temporary HP lasts, target adds maneuver modifier to Strength/Constitution checks & saves.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    }
  },
  {
    "name": "Evasive Footwork",
    "type": "General",
    "prerequisite": "",
    "description": "When you move, you can expend one superiority die, rolling the die and adding the number rolled to your AC until you stop moving.",
    "mechanics": {
      "timing": "free",
      "summary": "When you move: add {supDie} to AC until you stop moving"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Evasive Footwork",
        "summary": "When moving, expend 1 superiority die to add the roll to your AC until you stop moving.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "Exploit Weakness",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend a superiority die and deal additional true damage equal to the number rolled.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon hit: deal additional true damage equal to {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Exploit Weakness",
        "summary": "On weapon hit, expend 1 superiority die to deal additional true damage equal to the roll.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Fast Access Programs",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When you cast a tech power of 1st-level or higher that has a casting time of 1 action, you can expend a superiority die to change the casting time to 1 bonus action for this casting.",
    "mechanics": {
      "timing": "free",
      "summary": "On 1st-level or higher 1-action tech power cast: change casting time to 1 bonus action"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Fast Access Programs",
        "text": "When casting a 1st+ level 1-action tech power, expend 1 superiority die to change its casting time to 1 bonus action.",
        "castingScope": {
          "powerType": "Tech",
          "minLevel": 1,
          "castingPeriod": "Action"
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Feinting Attack",
    "type": "General",
    "prerequisite": "",
    "description": "You can expend one superiority die and use a bonus action on your turn to feint, choosing one creature within 5 feet of you as your target. You have advantage on your next attack roll against that creature this turn. If that attack hits, add the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "bonus",
      "summary": "5 ft: advantage on next attack this turn (+{supDie} damage on hit)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Feinting Attack",
        "summary": "Bonus action (1 superiority die): choose target within 5 ft; gain advantage on your next attack against it this turn and add superiority die to damage on hit.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    }
  },
  {
    "name": "Firewall",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When you or an ally you can see within 60 feet make a saving throw against a tech power, you can use your reaction to expend a superiority die, adding the number rolled to the result of that saving throw.",
    "mechanics": {
      "timing": "reaction",
      "summary": "60 ft: add {supDie} to your or ally's saving throw against a tech power"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Firewall",
        "summary": "Reaction (1 superiority die) when you or an ally within 60 ft makes a save against a tech power: add die to the save.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "die",
        "condition": "reaction + 1 superiority die against a tech power",
        "value": "{supDie}"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Flex",
    "type": "General",
    "prerequisite": "Proficiency in Athletics",
    "description": "When you make an Athletics check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Athletics check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Athletics"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Flourish",
    "type": "General",
    "prerequisite": "Proficiency in Sleight of Hand",
    "description": "When you make an Sleight of Hand check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Sleight of Hand check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Sleight of Hand"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Force Resonance",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "Immediately after you deal damage to a target with a force attack, you can expend a superiority die and target a second creature that you can see within 30 feet of the first creature. Roll the die, and the second creature takes force damage equal to the roll + your forcecasting modifier.",
    "mechanics": {
      "timing": "free",
      "summary": "After force attack damage: second target within 30 ft takes {supDie}{forceModTerm} force damage"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Force Resonance",
        "text": "Immediately after dealing damage with a force attack, expend 1 superiority die to deal {supDie}{forceModTerm} force damage to a second creature within 30 ft of the first.",
        "castingScope": {
          "powerType": "Force",
          "delivery": [
            "attack"
          ],
          "hasDamage": true
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Fortune and Glory",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "When you would make a weapon attack against a target within 30 feet, you can instead manipulate the Force to expend a superiority die and make a Sleight of Hand check using your universal forcecasting ability to plant something on the target, conceal an object on the target, lift the target's purse, or take something from its pocket. Roll the superiority die, and add the result to the check.",
    "mechanics": {
      "timing": "replace-attack",
      "summary": "30 ft: replace weapon attack with Force Sleight of Hand + {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Fortune and Glory",
        "summary": "Replace a weapon attack (30 ft) + 1 superiority die: make a Sleight of Hand check using universal forcecasting ability + die to plant, conceal, or pickpocket.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Sleight of Hand"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "using universal forcecasting ability in place of a weapon attack within 30 ft"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Go Get 'Em",
    "type": "General",
    "prerequisite": "Companion",
    "description": "While your companion is moving, you can expend a superiority die and add 5 times the number rolled to its movement speed.",
    "mechanics": {
      "timing": "free",
      "summary": "While companion moves: +5 × {supDie} ft to its speed"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Go Get 'Em",
        "summary": "While your companion moves, expend 1 superiority die to add 5 × die feet to its movement speed.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "Goading Attack",
    "type": "Mental",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to goad the target into attacking you. You add the superiority die to the attack's damage roll, and the target must make a Wisdom saving throw. On a failed save, the target has disadvantage on all attack rolls against targets other than you until the end of your next turn.",
    "mechanics": {
      "timing": "free",
      "save": "WIS",
      "summary": "On weapon hit: +{supDie} damage; target has disadvantage attacking others until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Goading Attack",
        "summary": "On weapon hit (1 superiority die): +die damage and Wisdom save or target has disadvantage on attacks against anyone other than you until end of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Hacked Communications",
    "type": "Mental",
    "prerequisite": "Proficiency in Technology",
    "description": "As an action, you may expend a superiority die, and choose any number of creatures that you can see within 60 feet of you that have commlinks, headcomms, or other such communications devices. Each creature must succeed on a Constitution saving throw or take sonic damage equal to the number rolled on the dice + your maneuver ability modifier (minimum of one). Additionally, on a failed save, their communication devices are disabled until rebooted.",
    "mechanics": {
      "timing": "action",
      "save": "CON",
      "summary": "60 ft: sonic damage ({supDie}{mentalManeuverModTerm}, minimum 1) & disable comms until rebooted"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Hacked Communications",
        "summary": "Action (1 superiority die): any number of creatures with comms within 60 ft make Constitution save or take die + maneuver modifier (minimum 1) sonic damage and comms disabled until rebooted.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Handle Animal",
    "type": "General",
    "prerequisite": "Proficiency in Animal Handling",
    "description": "When you make an Animal Handling check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Animal Handling check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Animal Handling"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Heads Up",
    "type": "Mental",
    "prerequisite": "",
    "description": "When a friendly creature who can see or hear you makes a saving throw, you can use your reaction and expend a superiority die, adding the number rolled to the result of the saving throw.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Add {supDie} to an ally's saving throw"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Heads Up",
        "summary": "Reaction (1 superiority die) when a friendly creature that can see/hear you makes a saving throw: add superiority die to its save.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Incite",
    "type": "Mental",
    "prerequisite": "Proficiency in Persuasion",
    "description": "On your turn, you can use an action and expend one superiority die to bolster the resolve of one of an ally within 30 feet who can see or hear you. The ally can add your maneuver ability modifier to every damage roll they make until the start of your next turn.",
    "mechanics": {
      "timing": "action",
      "summary": "30 ft ally adds {mentalManeuverModSigned} to all damage rolls until next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Incite",
        "summary": "Action (1 superiority die): 1 ally within 30 ft adds your maneuver ability modifier to every damage roll until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Inner Strength",
    "type": "General",
    "prerequisite": "",
    "description": "As an action, you can expend and roll one superiority die, gaining temporary hit points equal to the result of the roll + your maneuver ability modifier.",
    "mechanics": {
      "timing": "action",
      "summary": "Gain temporary HP equal to {supDie}{generalManeuverModTerm}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Inner Strength",
        "summary": "Action (1 superiority die): gain temporary HP equal to superiority die + your maneuver ability modifier.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Intimidating Presence",
    "type": "Mental",
    "prerequisite": "Proficiency in Intimidation",
    "description": "As an action, you can make a Charisma (Intimidation) check and expend one superiority die to attempt to frighten a humanoid creature who can see or hear you within 60 feet. Add the superiority die to the roll. The target makes a contested Wisdom (Insight) check. If your check succeeds, the target is frightened of you until the end of your next turn.",
    "mechanics": {
      "timing": "action",
      "summary": "60 ft: Intimidation + {supDie} against Insight; frightened until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Intimidating Presence",
        "summary": "Action (1 superiority die): Intimidation + die against humanoid's Insight within 60 ft to frighten until end of your next turn.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Intimidation"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "Intimidating Presence action to frighten a humanoid within 60 ft"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Investigate",
    "type": "General",
    "prerequisite": "Proficiency in Investigation",
    "description": "When you make an Investigation check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Investigation check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Investigation"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Loyal Bond",
    "type": "General",
    "prerequisite": "Companion",
    "description": "Whenever you are hit with an attack, you can expend one superiority die to command your companion to immediately use its reaction and move up to its speed directly towards you. If it ends this movement within 5 feet of you, roll the superiority die. Your companion takes the damage instead of you, subtracting the amount you rolled from the total.",
    "mechanics": {
      "timing": "free",
      "summary": "When hit: companion uses reaction to move in, take hit, and reduce damage by {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Loyal Bond",
        "summary": "When hit (1 superiority die): companion uses reaction to move up to its speed toward you; if within 5 ft, it takes the damage instead minus the superiority die roll.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Lunging Attack",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you make a melee weapon attack on your turn, you can expend one superiority die to increase your reach for that attack by 5 feet. If you hit, you add the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "free",
      "summary": "On melee weapon attack: +5 ft reach (+{supDie} damage on hit)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Lunging Attack",
        "summary": "On melee weapon attack (1 superiority die): +5 ft reach for that attack and +die damage on hit.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Maneuvering Attack",
    "type": "General",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to maneuver one of your comrades into a more advantageous position. You add the superiority die to the attack's damage roll, and you choose a friendly creature who can see or hear you. \n\nThat creature can use its reaction to move up to half its speed without provoking opportunity attacks from the target of your attack.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon hit: +{supDie} damage; ally uses reaction to move half speed without opportunity attack from target"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Maneuvering Attack",
        "summary": "On weapon hit (1 superiority die): +die damage and 1 ally uses reaction to move up to half speed without opportunity attacks from the target.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Menacing Attack",
    "type": "Mental",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to frighten the target. You add the superiority die to the attack's damage roll, and the target must make a Wisdom saving throw. On a failed save, it is frightened of you until the end of your next turn.",
    "mechanics": {
      "timing": "free",
      "save": "WIS",
      "summary": "On weapon hit: +{supDie} damage & frightened until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Menacing Attack",
        "summary": "On weapon hit (1 superiority die): +die damage and Wisdom save or target is frightened of you until end of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Mind Over Matter",
    "type": "Mental",
    "prerequisite": "",
    "description": "When you are forced to make an Intelligence, Wisdom, or Charisma saving throw, you can expend a superiority die to change the saving throw ability to your maneuver ability modifier.",
    "mechanics": {
      "timing": "free",
      "summary": "On Intelligence/Wisdom/Charisma save: substitute maneuver ability modifier"
    },
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Intelligence",
          "Wisdom",
          "Charisma"
        ],
        "mode": "swap",
        "condition": "expend 1 superiority die to use maneuver ability modifier instead"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Naturalize",
    "type": "General",
    "prerequisite": "Proficiency in Nature",
    "description": "When you make an Nature check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Nature check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Nature"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Neuroblock",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "When you make an attack roll, you can expend a superiority die and add it to the attack roll. On a hit, the creature's next attack has disadvantage and it cannot regain hit points until the start of your next turn.",
    "mechanics": {
      "timing": "free",
      "summary": "On attack roll: +{supDie} to hit; on hit target's next attack has disadvantage and cannot regain hit points"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Neuroblock",
        "summary": "On attack roll (1 superiority die): add die to attack roll; on hit, target's next attack has disadvantage and it cannot regain HP until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "No Escape",
    "type": "Physical",
    "prerequisite": "",
    "description": "Whenever you or an ally you can see makes an opportunity attack, you can expend a superiority die. If the attack hits, roll the superiority die and add the result to the damage roll. Additionally, the affected creature gains 4 slowed levels until the start of its next turn.",
    "mechanics": {
      "timing": "free",
      "summary": "On opportunity attack by you or ally: +{supDie} damage & 4 slowed levels until target's next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "No Escape",
        "summary": "On your or visible ally's opportunity attack (1 superiority die): on hit, +die damage and target gains 4 slowed levels until start of its next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfTargetNextTurn"
    }
  },
  {
    "name": "One Step Ahead",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you roll initiative and you are not surprised, you can expend a superiority die and add the number rolled to your Initiative check.",
    "mechanics": {
      "timing": "free",
      "summary": "On Initiative (not surprised): add {supDie}"
    },
    "effects": [
      {
        "type": "initiativeMod",
        "note": "When rolling initiative while not surprised, expend 1 superiority die to add {supDie} to your Initiative check"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "One With Shadows",
    "type": "General",
    "prerequisite": "Proficiency in Stealth",
    "description": "When you are in an area of dim light or darkness, you can use your action and expend one superiority die to become invisible until you move or take a hostile action.",
    "mechanics": {
      "timing": "action",
      "summary": "In dim light/darkness: become invisible until you move or act hostile"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "One With Shadows",
        "summary": "Action (1 superiority die) in dim light or darkness: become invisible until you move or take a hostile action.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "One with the Force",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "Once per turn, when you make a Constitution saving throw to maintain concentration on a force power, you can expend a superiority die and add the number rolled to the saving throw.",
    "mechanics": {
      "timing": "free",
      "summary": "Once per turn on Force concentration save: add {supDie}"
    },
    "effects": [
      {
        "type": "concentrationMod",
        "note": "Once per turn expend 1 superiority die to add {supDie} to a Constitution save to maintain concentration on a force power"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Overcapacity Powers",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When you cast a tech power of 1st-level or higher, you may expend a superiority die to cast the power at a higher level, provided it does not exceed your Maximum Power Level. Roll the superiority die, and add it to the level at which you are casting the power. You can choose to cast it at this new power level or lower.",
    "mechanics": {
      "timing": "free",
      "summary": "On tech power cast: upcast by up to {supDie} roll (capped at Maximum Power Level)"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Overcapacity Powers",
        "text": "When casting a 1st+ level tech power, expend 1 superiority die to upcast it by up to the {supDie} roll (capped at Max Power Level).",
        "castingScope": {
          "powerType": "Tech",
          "minLevel": 1
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Overwhelming Wit",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "Once per round, when a creature succeeds on a force power you cast or your class feature that requires a Wisdom or Charisma saving throw, you can expend a superiority die to make a universal forcecasting ability check with proficiency, substituting the result of the roll for the save DC for that power.",
    "mechanics": {
      "timing": "free",
      "summary": "Once per round when target passes Wisdom/Charisma save against Force: roll universal force check as new DC"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Overwhelming Wit",
        "text": "Once per round when a target succeeds on a Wisdom or Charisma save against your force power or class feature, expend 1 superiority die to roll a proficient universal forcecasting check as the new save DC.",
        "castingScope": {
          "powerType": "Force",
          "saveAbilities": [
            "Wisdom",
            "Charisma"
          ]
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Parry",
    "type": "Physical",
    "prerequisite": "",
    "description": "When another creature damages you with a melee attack, you can use your reaction and expend one superiority die to reduce the damage by the number you roll on your superiority die + your maneuver ability modifier.",
    "mechanics": {
      "timing": "reaction",
      "summary": "When hit by melee attack: reduce damage by {supDie}{physicalManeuverModTerm}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Parry",
        "summary": "Reaction (1 superiority die) when damaged by a melee attack: reduce damage by superiority die + your maneuver ability modifier.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Parry (Improved)",
    "type": "General",
    "prerequisite": "Parry maneuver",
    "description": "Parry becomes a general maneuver for you.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Parry",
      "summary": "Parry becomes a General maneuver (use any ability modifier)"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Parry",
        "newZone": "reaction",
        "summary": "Parry becomes a general maneuver for you.",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Penetrating Shot",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a ranged weapon attack, you can expend one superiority die to attempt to damage another creature with the same attack. Choose up to two creatures within 15 feet of and directly behind your initial target. If the original attack roll would hit the second creature(s), it takes damage equal to the number you roll on your superiority die.\n\nThe damage is of the same type dealt by the original attack.",
    "mechanics": {
      "timing": "free",
      "summary": "On ranged weapon hit: up to 2 creatures within 15 ft behind take {supDie} damage if original roll hits"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Penetrating Shot",
        "summary": "On ranged weapon hit (1 superiority die): up to 2 creatures within 15 ft directly behind target that the original attack roll would hit take superiority die same-type damage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Perceive",
    "type": "General",
    "prerequisite": "Proficiency in Perception",
    "description": "When you make an Perception check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Perception check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Perform",
    "type": "General",
    "prerequisite": "Proficiency in Performance",
    "description": "When you make an Performance check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Performance check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Performance"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Persuade",
    "type": "General",
    "prerequisite": "Proficiency in Persuasion",
    "description": "When you make an Persuasion check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Persuasion check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Persuasion"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Pilot",
    "type": "General",
    "prerequisite": "Proficiency in Piloting",
    "description": "When you make an Piloting check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Piloting check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Piloting"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Pin Down",
    "type": "General",
    "prerequisite": "Companion",
    "description": "When your companion attempts to grapple or knock a creature prone, you can expend a superiority die to give it direction as long as it can see or hear you. Roll a superiority die and add it to your companion's Strength (Athletics) check.",
    "mechanics": {
      "timing": "free",
      "summary": "Add {supDie} to companion's Athletics check to grapple or knock prone"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Pin Down",
        "summary": "When companion attempts to grapple or trip, expend 1 superiority die to add it to the companion's Athletics check.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Precise Movements",
    "type": "General",
    "prerequisite": "",
    "description": "When you or a friendly creature you can see that can see or hear you moves, you can expend a superiority die to give them verbal guidance and encouragement. \n\nRoll a superiority die. The creature's speed increases by 5 times the number rolled, and they can move through the space of hostile creatures as if it were difficult terrain.",
    "mechanics": {
      "timing": "free",
      "summary": "When you or ally moves: +5 × {supDie} ft speed & move through hostile spaces"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Precise Movements",
        "summary": "When you or an ally moves (1 superiority die): +5 × die ft speed and move through hostile spaces as difficult terrain.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "Precision Attack",
    "type": "General",
    "prerequisite": "",
    "description": "When you make a weapon attack roll against a creature, you can expend one superiority die to add it to the roll. You can use this maneuver before or after making the attack roll, but before any effects of the attack are applied.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon attack roll: add {supDie} to hit"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Precision Attack",
        "summary": "On weapon attack roll (1 superiority die): add superiority die to the attack roll (before or after rolling, before effects apply).",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Primal Endurance",
    "type": "General",
    "prerequisite": "Companion",
    "description": "As an action, you can expend a superiority die to improve your companion's defense. Roll the die and add it to your companion's AC until the beginning of your next turn.",
    "mechanics": {
      "timing": "action",
      "summary": "Add {supDie} to companion's AC until start of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Primal Endurance",
        "summary": "Action (1 superiority die): add die roll to your companion's AC until start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Program",
    "type": "General",
    "prerequisite": "Proficiency in Technology",
    "description": "When you make an Technology check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Technology check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Technology"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Pure Sabacc",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you score a critical hit with a weapon attack, you can expend a superiority die and roll it. On a roll of 4 or higher, you deal maximum damage on the weapon's damage roll, including the superiority die. On a roll of 3 or lower, you instead deal the minimum.",
    "mechanics": {
      "timing": "free",
      "summary": "On weapon crit: roll {supDie} (4+ = max weapon + {supDie} damage; 3 or lower = minimum damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Pure Sabacc",
        "summary": "On weapon crit (1 superiority die): roll 4+ for maximum damage (including die), or 3 or lower for minimum damage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Pushing Attack",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to drive the target back. You add the superiority die to the attack's damage roll, and if the target is Large or smaller, it must make a Strength saving throw. On a failed save, you push the target up to 15 feet away from you.",
    "mechanics": {
      "timing": "free",
      "save": "STR",
      "summary": "On weapon hit: +{supDie} damage & push Large or smaller target up to 15 ft"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Pushing Attack",
        "summary": "On weapon hit (1 superiority die): +die damage and Large-or-smaller target makes Strength save or is pushed up to 15 ft away.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Rally",
    "type": "Mental",
    "prerequisite": "",
    "description": "On your turn, you can use a bonus action and expend one superiority die to bolster the resolve of one of your companions. When you do so, choose a friendly creature who can see or hear you. That creature gains temporary hit points equal to the superiority die roll + your maneuver ability modifier.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Ally gains temporary HP equal to {supDie}{mentalManeuverModTerm}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Rally",
        "summary": "Bonus action (1 superiority die): grant 1 ally who can see/hear you temporary HP equal to die + maneuver ability modifier.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Rampage",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you reduce a creature to 0 hit points, you can use your bonus action to expend a superiority die and move up to half your speed. If you end this movement within 5 feet of a creature, you can make a single melee weapon attack against that creature, adding the result of the superiority die roll to the attack roll.",
    "mechanics": {
      "timing": "bonus",
      "summary": "On 0 HP: move half speed and melee attack (+{supDie} to hit)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Rampage",
        "summary": "Bonus action on reducing a creature to 0 HP (1 superiority die): move up to half speed and make 1 melee weapon attack adding the die to hit.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Rattle",
    "type": "Physical",
    "prerequisite": "Proficiency in Intimidation",
    "description": "On your turn, when you hit with a weapon attack, you can use a bonus action and expend and roll one superiority die to menace your target, dealing extra psychic damage equal to the amount rolled and forcing it to succeed on a Wisdom saving throw or be frightened of you until the end of your next turn.",
    "mechanics": {
      "timing": "bonus",
      "save": "WIS",
      "summary": "On weapon hit: +{supDie} psychic damage & frightened until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Rattle",
        "summary": "Bonus action after weapon hit (1 superiority die): deal +die psychic damage and Wisdom save or frightened until end of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Reassure",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "As an action, you can expend a superiority die and call out to a creature within 60 feet that can see or hear you that is charmed, frightened, or stunned. When you do so, that creature immediately makes another saving throw, adding the amount rolled to the save.",
    "mechanics": {
      "timing": "action",
      "summary": "60 ft charmed/frightened/stunned ally repeats save + {supDie}"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Reassure",
        "summary": "Action (1 superiority die): charmed, frightened, or stunned creature within 60 ft immediately repeats its save adding the die.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Remove Toxins",
    "type": "Mental",
    "prerequisite": "Proficiency in Medicine",
    "description": "As an action, you can expend a superiority die to purge the toxins from a creature you can touch. The target regains hit points equal to the number rolled and, if it is poisoned or diseased, you neutralize the poison or disease. If more than one poison or disease afflicts the target, you neutralize one poison or disease that you know is present, or you neutralize one at random.",
    "mechanics": {
      "timing": "action",
      "summary": "Touch: heal {supDie} and neutralize one poison or disease"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Remove Toxins",
        "summary": "Action (1 superiority die): touch heals die HP and neutralizes 1 poison or disease afflicting the target.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Return Fire",
    "type": "Physical",
    "prerequisite": "",
    "description": "When a creature misses you with a ranged attack, you can use your reaction and expend one superiority die to make a ranged weapon attack against the creature. If you hit, you add the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "reaction",
      "summary": "When missed by ranged attack: make ranged weapon attack (+{supDie} damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Return Fire",
        "summary": "Reaction (1 superiority die) when missed by a ranged attack: make a ranged weapon attack against the attacker adding the die to damage on hit.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Reverse Curse",
    "type": "Mental",
    "prerequisite": "",
    "description": "When another creature attempts to charm or frighten you or an ally you can see within 15 feet of you, you can use your reaction and expend a superiority die and roll it to attempt to turn the effect back on that creature. The creature must succeed on a Wisdom saving throw or be be charmed or frightened by you, dependent on the triggering ability, for a number of rounds equal to the die roll or until the creature takes any damage.",
    "mechanics": {
      "timing": "reaction",
      "save": "WIS",
      "summary": "15 ft: reflect charm/frighten attempt for {supDie} rounds"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Reverse Curse",
        "summary": "Reaction (1 superiority die) when a creature tries to charm/frighten you or an ally within 15 ft: Wisdom save or attacker is charmed/frightened by you for die rounds (or until damaged).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "Riposte",
    "type": "Physical",
    "prerequisite": "",
    "description": "When a creature misses you with a melee attack, you can use your reaction and expend one superiority die to make a melee weapon attack against the creature. If the attack hits, you add the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "reaction",
      "summary": "When missed by melee attack: make melee weapon attack (+{supDie} damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Riposte",
        "summary": "Reaction (1 superiority die) when missed by a melee attack: make a melee weapon attack against the attacker adding the die to damage on hit.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Riposte (Improved)",
    "type": "Physical",
    "prerequisite": "Riposte maneuver",
    "description": "When a creature misses an ally within 30 feet you can see with a melee attack, and that ally can see or hear you, you can expend one superiority die (no action required), and the chosen ally use their reaction to make a melee weapon attack against the creature. If the attack hits, the ally adds the superiority die to the attack's damage roll.",
    "mechanics": {
      "timing": "free",
      "summary": "No action: when melee misses ally within 30 ft, ally uses reaction to counterattack (+{supDie} damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Riposte (Improved)",
        "summary": "No action (1 superiority die) when an ally within 30 ft is missed by a melee attack: ally uses its reaction to make a melee weapon attack (+{supDie} damage on hit).",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Runtime Extension",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When a tech power you cast with a duration of 1 minute or longer reaches the end of its duration, you may expend a superiority die to extend the duration of the power by a number of rounds equal to the number rolled on your superiority die.",
    "mechanics": {
      "timing": "free",
      "summary": "When 1-minute+ tech power ends: extend duration by {supDie} rounds"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Runtime Extension",
        "text": "When your tech power (duration 1 minute or longer) reaches its end, expend 1 superiority die to extend its duration by {supDie} rounds.",
        "castingScope": {
          "powerType": "Tech",
          "canExtend": true
        }
      }
    ],
    "durationSpec": {
      "anchor": "onUse"
    }
  },
  {
    "name": "Self-Preservation",
    "type": "General",
    "prerequisite": "",
    "description": "As a reaction when you make a saving throw against an effect you can see, you can expend a superiority die and add it to the result. You can use this maneuver before or after making the saving throw, but before any effects of the saving throw are determined.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Add {supDie} to your saving throw against an effect you can see"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Self-Preservation",
        "summary": "Reaction (1 superiority die) on a saving throw against an effect you can see: add die to the save (before or after rolling, before outcome).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "die",
        "condition": "reaction + 1 superiority die against an effect you can see",
        "value": "{supDie}"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Shadow Puppetry",
    "type": "Mental",
    "prerequisite": "",
    "description": "When a creature you can see within 30 feet of you is reduced to 0 hit points, you can use your reaction and expend a superiority die to give that creature a final act of aggression. That creature can immediately move a number of feet equal to 5 times the result of the die and make a single weapon attack against a target of your choice within its attack range, adding the die to the attack roll.",
    "mechanics": {
      "timing": "reaction",
      "summary": "30 ft on 0 HP: creature moves 5 × {supDie} ft and makes 1 attack (+{supDie} to hit)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Shadow Puppetry",
        "summary": "Reaction (1 superiority die) when a visible creature within 30 ft drops to 0 HP: it moves 5 × die ft and makes 1 weapon attack (+die to hit).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Short Round",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "When you cast a force power of 1st-level or higher that has a casting time of 1 action, you can expend a superiority die to change the casting time to 1 bonus action for this casting.",
    "mechanics": {
      "timing": "free",
      "summary": "On 1st-level or higher 1-action force power cast: change casting time to 1 bonus action"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Short Round",
        "text": "When casting a 1st+ level 1-action force power, expend 1 superiority die to change its casting time to 1 bonus action.",
        "castingScope": {
          "powerType": "Force",
          "minLevel": 1,
          "castingPeriod": "Action"
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Sic 'Em",
    "type": "General",
    "prerequisite": "Companion",
    "description": "As an action, you can expend a superiority die and command your companion to savage a nearby enemy. Your companion can use its reaction to immediately move up to 10 feet and make one attack, adding the superiority dice to the damage roll on a hit.",
    "mechanics": {
      "timing": "action",
      "summary": "Companion uses reaction to move 10 ft and attack (+{supDie} damage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Sic 'Em",
        "summary": "Action (1 superiority die): companion uses reaction to move up to 10 ft and make 1 attack (+die damage on hit).",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Spine-Chilling Howls",
    "type": "General",
    "prerequisite": "Companion",
    "description": "As an action, you can expend one superiority die to command your companion to frighten another creature. The target must then succeed on a Wisdom saving throw against your Maneuver save DC or become frightened of both you and your companion for 1 minute. The frightened target can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.",
    "mechanics": {
      "timing": "action",
      "save": "WIS",
      "summary": "Companion frightens target for 1 minute (repeat save end of turn)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Spine-Chilling Howls",
        "summary": "Action (1 superiority die): companion forces target to make Wisdom save against Maneuver DC {maneuverDC} or be frightened of both of you for 1 minute (repeat save end of turn).",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "turnTriggers": [
      {
        "timing": "endOfTurn",
        "actor": "target",
        "kind": "repeatSave",
        "save": {
          "ability": "Wisdom",
          "dcFormula": "{generalManeuverDC}"
        },
        "endOnSuccess": true,
        "note": "Repeat Wisdom save against Maneuver DC {generalManeuverDC} to end frightened."
      }
    ]
  },
  {
    "name": "Steady the Nerves",
    "type": "General",
    "prerequisite": "Proficiency in Persuasion",
    "description": "As an action, you can expend one superiority die to strengthen your allies' defenses. Roll a superiority die. Until the end of your next turn, you and all allies within 5 feet of you when you use this action has a bonus to any saving throws they make equal to the amount rolled.",
    "mechanics": {
      "timing": "action",
      "summary": "You and allies within 5 ft add {supDie} to saves until end of next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Steady the Nerves",
        "summary": "Action (1 superiority die): until end of your next turn, you and allies within 5 ft add the die roll to all saving throws.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Strikeforce",
    "type": "Physical",
    "prerequisite": "The ability to cast force powers",
    "description": "When you make a melee weapon attack against a creature, you can expend one superiority die and add the number rolled to the attack roll. On a hit, the target takes additional force damage equal to the number rolled.",
    "mechanics": {
      "timing": "free",
      "summary": "On melee weapon attack: +{supDie} to hit and +{supDie} force damage on hit"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Strikeforce",
        "summary": "On melee weapon attack (1 superiority die): add die to attack roll and deal +die force damage on hit.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Study",
    "type": "General",
    "prerequisite": "Proficiency in Lore",
    "description": "When you make an Lore check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Lore check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Lore"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Subtle Execution",
    "type": "Mental",
    "prerequisite": "The ability to cast tech powers",
    "description": "When you cast a tech power, you may expend a superiority die to cast the power without any visual or auditory cues. Creatures have disadvantage on any Intelligence (Investigation) or Wisdom (Perception) checks made to determine if you were the caster.",
    "mechanics": {
      "timing": "free",
      "summary": "On tech power cast: cast without visual/auditory cues"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Subtle Execution",
        "text": "Expend 1 superiority die when casting a tech power to remove visual/auditory cues; creatures have disadvantage on Investigation/Perception to spot you as caster.",
        "castingScope": {
          "powerType": "Tech"
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Survive",
    "type": "General",
    "prerequisite": "Proficiency in Survival",
    "description": "When you make an Survival check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Survival check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Survival"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Sweeping Attack",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a melee weapon attack, you can expend one superiority die to attempt to damage another creature with the same attack. Choose another creature within 5 feet of the original target and within your reach. If the original attack roll would hit the second creature, it takes damage equal to the number you roll on your superiority die. The damage is of the same type dealt by the original attack.",
    "mechanics": {
      "timing": "free",
      "summary": "On melee hit: adjacent target in reach takes {supDie} damage if original roll hits"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Sweeping Attack",
        "summary": "On melee weapon hit (1 superiority die): second creature within 5 ft of target and in reach that the attack roll would hit takes superiority die same-type damage.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Sweeping Attack (Improved)",
    "type": "Physical",
    "prerequisite": "Sweeping Attack maneuver",
    "description": "When you use the Sweeping Attack maneuver, you add your maneuver ability modifier to the damage roll of the second creature.",
    "mechanics": {
      "timing": "passive-upgrade",
      "upgrades": "Sweeping Attack",
      "summary": "Add maneuver modifier to Sweeping Attack's second target"
    },
    "effects": [
      {
        "type": "actionUpgrade",
        "targetAction": "Sweeping Attack",
        "newZone": "special",
        "summary": "Add your maneuver ability modifier to the second creature's damage roll on Sweeping Attack."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Targeted Strike",
    "type": "Mental",
    "prerequisite": "",
    "description": "When an ally who can see or hear you makes an attack against a creature, you can use your reaction to expend a superiority die. You add the superiority die to the attack roll, and the damage roll if it hits. You can use this maneuver before or after the attack roll, but before the GM determines whether or not the attack hits.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Add {supDie} to ally's attack roll and damage roll"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Targeted Strike",
        "summary": "Reaction (1 superiority die) when an ally who can see/hear you attacks: add die to the attack roll and to damage on hit.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Tenacity",
    "type": "Physical",
    "prerequisite": "Proficiency in Stealth",
    "description": "As a bonus action, you can expend and roll a superiority die and move to an unoccupied space you can see up to a distance equal to 5 x the result of the roll. If you begin this movement hidden from a creature, and you end this movement in a space that could be hidden from the creature, this movement does not reveal your presence to that creature.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Move 5 × {supDie} ft without breaking Stealth if start & end hidden"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Tenacity",
        "summary": "Bonus action (1 superiority die): move up to 5 × die ft to a visible unoccupied space; remains hidden if starting and ending in concealable positions.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Threaten",
    "type": "General",
    "prerequisite": "Proficiency in Intimidation",
    "description": "When you make an Intimidation check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Intimidation check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Intimidation"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Trip Attack",
    "type": "Physical",
    "prerequisite": "",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die to attempt to knock the target down. You add the superiority die to the attack's damage roll, and if the target is Large or smaller, it must make a Strength saving throw. On a failed save, you knock the target prone.",
    "mechanics": {
      "timing": "free",
      "save": "STR",
      "summary": "On weapon hit: +{supDie} damage & knock Large or smaller target prone"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Trip Attack",
        "summary": "On weapon hit (1 superiority die): +die damage and Large-or-smaller target makes Strength save or is knocked prone.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Tumble",
    "type": "General",
    "prerequisite": "Proficiency in Acrobatics",
    "description": "When you make an Acrobatics check, you can expend a superiority die, rolling the die and adding it to the d20 roll. You can wait until after rolling the d20 before doing so, but you must decide before the GM says whether the roll succeeds or fails.",
    "mechanics": {
      "timing": "free",
      "summary": "On Acrobatics check: add {supDie}"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Acrobatics"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "expend 1 superiority die after rolling d20 before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Tyrannical Strike",
    "type": "Mental",
    "prerequisite": "Proficiency with Intimidation",
    "description": "When you hit a creature with a weapon attack, you can expend one superiority die and use your reaction to issue a one-word command to a creature who can see or hear you. You add the superiority die to the attack's damage roll, and the target must succeed on a Wisdom saving throw. On a failed save, the target must follow the command on its next turn. \n\nThe target automatically succeeds if it is immune to charm, it doesn't understand your language, or if your command is directly harmful to it.",
    "mechanics": {
      "timing": "reaction",
      "save": "WIS",
      "summary": "On weapon hit: +{supDie} damage & issue 1-word command for target's next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Tyrannical Strike",
        "summary": "Reaction on weapon hit (1 superiority die): +die damage and Wisdom save or target obeys a one-word command on its next turn (fails against charm immunity/language/direct harm).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "endOfTargetNextTurn"
    }
  },
  {
    "name": "Unrelenting Grasp",
    "type": "Physical",
    "prerequisite": "Proficiency in Athletics",
    "description": "When you hit a creature within 5 feet of you with an opportunity attack, you may expend a superiority die. The creature takes additional damage equal to your superiority die, and you may attempt to grapple the target as part of the same reaction.",
    "mechanics": {
      "timing": "free",
      "summary": "On melee opportunity attack hit within 5 ft: +{supDie} damage & grapple as part of same reaction"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Unrelenting Grasp",
        "summary": "On opportunity attack hit within 5 ft (1 superiority die): +die damage and attempt to grapple the target as part of the same reaction.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Vanity",
    "type": "General",
    "prerequisite": "",
    "description": "When you reduce a hostile creature to 0 hit points, you can expend and roll a superiority die (no action required), regaining a number of hit points equal to the result of the roll + your maneuver ability modifier.",
    "mechanics": {
      "timing": "free",
      "summary": "On hostile 0 HP (no action): regain {supDie}{generalManeuverModTerm} HP"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Vanity",
        "summary": "No action on reducing a hostile creature to 0 HP (1 superiority die): regain HP equal to die + maneuver ability modifier.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Water of Life",
    "type": "Mental",
    "prerequisite": "",
    "description": "When an allied creature within 30 feet that you can see takes damage, you can use a reaction to expend a superiority die and roll it. The ally regains a number of hit points equal to the roll + your maneuver modifier.",
    "mechanics": {
      "timing": "reaction",
      "summary": "30 ft when ally takes damage: ally regains {supDie}{mentalManeuverModTerm} HP"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Water of Life",
        "summary": "Reaction (1 superiority die) when an ally within 30 ft takes damage: ally regains die + maneuver ability modifier HP.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Weak Point Strike",
    "type": "Physical",
    "prerequisite": "Proficiency in Medicine",
    "description": "When you hit a creature with a weapon attack, you can expend a superiority die to temporarily daze the creature. Add the number rolled to the damage of the weapon attack and the creature must succeed on a Constitution saving throw or be stunned until the end of its next turn.",
    "mechanics": {
      "timing": "free",
      "save": "CON",
      "summary": "On weapon hit: +{supDie} damage & stunned until end of target's next turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Weak Point Strike",
        "summary": "On weapon hit (1 superiority die): +die damage and Constitution save or target is stunned until end of its next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfTargetNextTurn"
    }
  },
  {
    "name": "Wild Senses",
    "type": "General",
    "prerequisite": "Companion",
    "description": "Whenever you make a Wisdom (Perception) or a Wisdom (Survival) check, you can request the aid of your companion by expending a superiority die, adding the number rolled to the check. You can use this maneuver before or after making the ability check, but before the results of the ability check are determined.",
    "mechanics": {
      "timing": "free",
      "summary": "On Perception or Survival check: add {supDie} (companion aid)"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception",
          "Survival"
        ],
        "mode": "die",
        "value": "{supDie}",
        "condition": "with companion's aid by expending 1 superiority die before outcome"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "World on Fire",
    "type": "Physical",
    "prerequisite": "",
    "description": "On your turn, when you hit with a weapon attack, you can use a bonus action to expend and roll one superiority die to ignite phosphorescent powder on your target, dealing extra fire damage equal to the result of the roll. Additionally, the target sheds dim light in a 5-foot radius and can't become invisible until the end of your next turn, and becomes visible if it was already invisible.",
    "mechanics": {
      "timing": "bonus",
      "summary": "On weapon hit: +{supDie} fire damage; target sheds dim light & cannot turn invisible"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "World on Fire",
        "summary": "Bonus action after weapon hit (1 superiority die): +die fire damage; target sheds 5-ft dim light and cannot be invisible until end of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Wracking Torment",
    "type": "Mental",
    "prerequisite": "",
    "description": "When a hostile creature you can see within 30 feet would take damage from an effect you or a friendly creature controls, you can use your reaction and expend a superiority die to temporarily weaken their resilience against it. Until the end of the turn, the target loses resistance to the damage types of the triggering attack or power.",
    "mechanics": {
      "timing": "reaction",
      "summary": "30 ft: target loses resistance to triggering attack/power damage until end of turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Wracking Torment",
        "summary": "Reaction (1 superiority die) when a visible foe within 30 ft takes damage from your or ally's effect: target loses resistance to the triggering damage types until end of turn.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    }
  },
  {
    "name": "Wrestle and Drag",
    "type": "Physical",
    "prerequisite": "Proficiency in Athletics",
    "description": "When you make a Strength (Athletics) check to grapple or shove a creature, you can expend a superiority die. Until the end of your turn, you can drag the grappled creature with you without your speed being halved. Additionally, if the creature is moved at least 5 feet, you can roll the superiority die, dealing kinetic damage to the creature equal to the result of the roll.",
    "mechanics": {
      "timing": "free",
      "summary": "On grapple/shove Athletics: no half-speed drag; +{supDie} kinetic if moved 5+ ft"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Wrestle and Drag",
        "summary": "On Athletics check to grapple/shove (1 superiority die): drag grappled creature at full speed this turn and deal die kinetic damage if moved at least 5 ft.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    }
  },
  {
    "name": "You Call This Archaeology?",
    "type": "Mental",
    "prerequisite": "The ability to cast force powers",
    "description": "When you or a friendly creature that you can see reduces a hostile creature to 0 hit points, you can use your reaction and expend a superiority die to give yourself or that friendly creature temporary hit points equal to the number rolled + your universal forcecasting modifier.",
    "mechanics": {
      "timing": "reaction",
      "summary": "On hostile 0 HP: grant self or ally temporary HP ({supDie}{forceModTerm})"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "You Call This Archaeology?",
        "summary": "Reaction (1 superiority die) when you or a visible ally reduces a foe to 0 HP: grant self or that ally temporary HP = die + universal forcecasting modifier.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  }
];
const SW5E_FIGHTING_STYLES = [
  {
    "name": "Area Style",
    "description": "You are skilled with weapons that affect an area. You gain the following benefits:\n- When a creature successfully saves against your projector canister, you can use your bonus action to force them to repeat the save.\n- When a creature rolls a 1 on the saving throw against a projector canister you control, they treat the effect's damage as if it had rolled the maximum.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus action: force repeat save against projector canister; natural 1 save = maximum damage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Area Style (Repeat Save)",
        "summary": "When a creature succeeds on a save against your projector canister, force them to repeat the save.",
        "cadence": "unlimited"
      },
      {
        "type": "critMod",
        "scope": "canister",
        "maxDamageOnSaveRoll": [
          1
        ]
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Assisting Style",
    "description": "You are skilled at enabling your allies. You gain the following benefits:\n- You can take the Help action as a bonus action. If you could already take the Help action as a bonus action, you can instead take it as a reaction on your turn.\n- Creatures benefiting from your Help action can't have disadvantage on the affected ability check or attack roll.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Help as bonus action (or reaction on your turn); helped allies can't have disadvantage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Help (Assisting Style)",
        "summary": "Take the Help action as a bonus action (or reaction on your turn if already a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "combat.bonus",
        "title": "Assisting Style",
        "text": "Creatures benefiting from your Help action cannot have disadvantage on the affected ability check or attack roll."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Berserk Style",
    "description": "You are skilled at returning pain to those who deliver it. You gain the following benefits: \n- When you hit with a melee weapon attack using Strength, you deal additional damage equal to your Strength modifier if that creature dealt damage to you since the start of your last turn.\n- When you choose to let an attack that would miss you hit you instead, the creature rolls the damage as normal instead of choosing the maximum.",
    "mechanics": {
      "timing": "free",
      "summary": "+{strModFloor0} melee Strength damage vs target that damaged you since last turn; letting a missed attack hit rolls normal damage"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Berserk Style",
        "text": "Melee Strength weapon hits deal +{strModFloor0} extra damage against creatures that damaged you since the start of your last turn; letting a missed attack hit you rolls normal damage instead of maximum."
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Berserk Style",
        "text": "When you choose to let an attack that would miss you hit you instead, the creature rolls damage normally instead of choosing the maximum."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Blindfighting Style",
    "description": "You are skilled at fighting without sight. You gain the following benefits:\n- You gain blindsight out to 10 feet. If you already have blindsight, it instead increases by 10 feet.\n- You can use your bonus action to double the range of your blindsight until the start of your next turn.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Blindsight +10 ft; bonus action doubles blindsight range until next turn"
    },
    "effects": [
      {
        "type": "sense",
        "kind": "blindsight",
        "range": 10,
        "extend": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Focus Senses (Blindfighting Style)",
        "summary": "Bonus action: double your blindsight range until the start of your next turn.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Brawler Style",
    "description": "You are skilled at using your weight to your advantage. You gain the following benefits:\n- You are proficient with improvised weapons.\n- Your damage die for your unarmed strikes and natural weapons increases by one step (from 1 to d4, d4 to d6, or d6 to d8).\n- When you take the Attack action and attempt to grapple, shove, or trip a creature, or make an attack against a creature with an unarmed strike or a weapon wielded in one hand on your turn, you can use your bonus action to make an unarmed strike, grapple, shove, or trip against the same creature.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Improvised weapons proficiency; unarmed/natural die +1 step; bonus action unarmed/grapple/shove/trip after Attack"
    },
    "effects": [
      {
        "type": "proficiency",
        "kind": "weapon",
        "target": "Improvised Weapons",
        "rank": 1
      },
      {
        "type": "weaponRule",
        "kind": "unarmedDieStepUp",
        "params": {
          "steps": 1
        }
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Brawler Follow-Up",
        "summary": "After Attack action (grapple, shove, trip, unarmed strike, or one-handed weapon attack), bonus action to unarmed strike, grapple, shove, or trip the same creature.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Counterstrike Style",
    "description": "You are skilled at returning attacks at those who dare strike you. You gain the following benefits:\n- When you would provoke an opportunity attack on your turn, you can use your bonus action to force the creature to make the opportunity attack, if it can.\n- Creatures who make opportunity attacks against you provoke opportunity attacks from you.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus action: force creature to make opportunity attack it would provoke on your turn",
      "secondaryAction": {
        "zone": "reaction",
        "name": "Counterstrike Style (Reaction)",
        "summary": "Creatures that make opportunity attacks against you provoke opportunity attacks from you"
      }
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Bait Opportunity Attack (Counterstrike Style)",
        "summary": "When you would provoke an opportunity attack on your turn, force the creature to make it if able.",
        "cadence": "unlimited"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Counterstrike",
        "summary": "Creatures that make opportunity attacks against you provoke opportunity attacks from you.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Covert Style",
    "description": "You are skilled at fighting from unseen angles. You gain the following benefits:\n- You can take the Hide action as a bonus action. If you could already take the Hide action as a bonus action, you can instead take it as a reaction on your turn.\n- Creatures you've dealt damage to since the start of your last turn have disadvantage on Wisdom (Perception) checks made to find you.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Hide as bonus action (or reaction on turn); damaged foes have disadvantage spotting you"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Hide (Covert Style)",
        "summary": "Take the Hide action as a bonus action (or reaction on your turn if you could already Hide as a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Stealth"
        ],
        "title": "Covert Style",
        "text": "Creatures you damaged since start of your last turn have disadvantage on Perception checks to find you."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Defense Style",
    "description": "You are skilled at the art of defending yourself. You gain the following benefits:\n- While you are wearing medium or heavy armor with which you are proficient, you can use your bonus action to mark a target within 30 feet that you can see until the end of your next turn. When you do so, damage dealt to you by the target is reduced by an amount equal to half your Strength or Constitution modifier (your choice, minimum of one) while marked. If this would reduce the damage to 0, the damage is instead reduced to 1. You can only have one creature marked in this way at a time.\n- You have advantage on Strength checks and Strength saving throws to avoid being moved.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Proficient medium/heavy armor: mark target within 30 ft to reduce its damage by {halfStrConMod} (min 1 reduction, floor 1 damage); advantage on Strength checks & saves vs being moved"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Defensive Mark (Defense Style)",
        "summary": "Proficient medium/heavy armor: mark 1 visible target within 30 ft until end of next turn to reduce damage from it by {halfStrConMod} (min 1 reduction, floor 1 damage).",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "ability": "Strength",
        "mode": "advantage",
        "condition": "avoiding being moved"
      },
      {
        "type": "saveMod",
        "abilities": [
          "Strength"
        ],
        "mode": "advantage",
        "condition": "avoiding being moved"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Disruption Style",
    "description": "Choose one from force- or tech-casting. You are skilled at fighting and interfering with casters of the chosen type. You gain the following benefits:\n- When you force a creature to make a Constitution saving throw to maintain concentration on your turn, and they succeed on the save, you can use your bonus action to force them to reroll the save. They must use the new roll.\n- Once per round, when a hostile creature attempts to cast a power while within 5 feet of you, they must first make a Constitution saving throw as if to maintain concentration (DC = 10 + the power's level). On a failure, the power isn't cast and any points are wasted.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus action force concentration reroll; once/round 5-ft casting disruption (DC 10 + power level Constitution save)",
      "choice": {
        "kind": "castingType",
        "options": [
          "Force-casting",
          "Tech-casting"
        ],
        "label": "Disruption Target"
      }
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Disrupt Concentration (Disruption Style)",
        "summary": "When a creature succeeds on a concentration save you caused on your turn, force a reroll.",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Disruption Style (Adjacent Cast)",
        "text": "Once per round when a hostile creature casts a {choice} power within 5 ft, it must pass a Constitution save (DC 10 + power level) or the cast fails and points are wasted."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Dual Wield Style",
    "description": "You are skilled at fighting with two weapons. You gain the following benefits:\n- When you engage in Two-Weapon Fighting, you can add your ability modifier to the damage roll of your Two-Weapon Fighting attack as long as it doesn't already include that modifier.\n- You can draw or stow two weapons when you would normally be able to draw or stow only one.",
    "mechanics": {
      "timing": "passive",
      "summary": "Add ability modifier to Two-Weapon Fighting off-hand damage; draw/stow 2 weapons"
    },
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "twf",
        "addAbilityMod": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Dual Wield Style",
        "text": "Draw or stow two weapons when you would normally draw or stow one."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Duelist Style",
    "description": "You are skilled in the art of fighting with a single weapon. You gain the following benefits:\n- While you are wielding a weapon in one hand with which you are proficient and no other weapons, you can use your bonus action to feint. If you do so, you must make a Dexterity (Sleight of Hand) or Charisma (Deception) check (your choice) contested by the target's Wisdom (Insight) check. On a success, you have advantage on the first attack roll you make against them before the start of your next turn.\n- While you are wielding a weapon in one hand with which you are proficient and no other weapons, when you miss with a weapon attack on your turn, you can use your bonus action to repeat the attack against the same target. Any modifications to the original attack roll, such as advantage, disadvantage, or without your proficiency bonus, also affect this attack roll.\n- Once on each of your turns, drawing or stowing a one-handed weapon no longer requires your object interaction.",
    "mechanics": {
      "timing": "bonus",
      "summary": "One-handed weapon only: bonus action feint (Sleight of Hand/Deception vs Insight) or repeat missed attack; free draw/stow once per turn"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Duelist Feint / Riposte Repeat",
        "summary": "Wielding 1 proficient one-handed weapon (no other weapons): bonus action Sleight of Hand/Deception vs Insight for advantage on first attack before next turn; OR on miss, bonus action to repeat the attack.",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Duelist Style (Quick Draw)",
        "text": "Once per turn, drawing or stowing a one-handed weapon requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Equilibrium Style",
    "description": "You are skilled at fighting without the confines of armor. You gain the following benefits:\n- While you are wearing light or no armor and not wielding a shield, you can use your bonus action to mark a target within 30 feet that you can see until the end of your next turn. When you do so, you gain a bonus to AC and Dexterity saving throws against effects the target controls equal to half your Dexterity modifier (minimum of +1) while marked. You can only have one creature marked in this way at a time.\n- You have advantage on Dexterity checks and Dexterity saving throws to avoid being moved.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Light/no armor, no shield: mark target within 30 ft for +{halfDexMod} AC & Dexterity saves against its effects; advantage on Dexterity checks & saves vs being moved"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Equilibrium Mark",
        "summary": "Light/no armor, no shield: mark 1 visible target within 30 ft until end of next turn for +{halfDexMod} to AC and Dexterity saves against its effects.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "ability": "Dexterity",
        "mode": "advantage",
        "condition": "avoiding being moved"
      },
      {
        "type": "saveMod",
        "abilities": [
          "Dexterity"
        ],
        "mode": "advantage",
        "condition": "avoiding being moved"
      }
    ],
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    }
  },
  {
    "name": "Explosives Style",
    "description": "You are skilled at fighting with explosives. You gain the following benefits:\n- You can throw grenades and set mines with your bonus action, instead of your action. If you could already throw grenades and set mines as a bonus action, you can instead do so as a reaction on your turn.\n- When a creature rolls a 1 on the saving throw against a grenade, mine, or missile you control, they treat the effect's damage as if it had rolled the maximum.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Throw grenades & set mines as bonus action (or reaction on your turn if already a bonus action); natural 1 save vs grenade/mine/missile = maximum damage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Quick Explosives (Explosives Style)",
        "summary": "Throw grenades and set mines as a bonus action (or reaction on your turn if already a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "critMod",
        "scope": "explosive",
        "maxDamageOnSaveRoll": [
          1
        ]
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Formation Style",
    "description": "You are skilled at fighting with a partner. You gain the following benefits:\n- You can take the Guard action as a bonus action. If you could already take the Guard action as a bonus action, you can instead take it as a reaction on your turn.\n- When you move on your turn, you can use a bonus action to allow a willing ally within 5 feet of you to move with you (no action required by the ally). The ally must end this movement within 5 feet of you, and this movement can't exceed the ally's speed.\n- When you choose to let an attack that would hit a guarded ally hit you instead, the creature rolls the damage as normal instead of choosing the maximum.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Guard as bonus action (or reaction on your turn); bonus action move adjacent ally with you; taking a hit for a guarded ally rolls normal damage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Guard / Escort Move (Formation Style)",
        "summary": "Take Guard as a bonus action (or reaction on your turn if already a bonus action); or when moving, let a willing ally within 5 ft move with you (ending within 5 ft).",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Formation Style",
        "text": "When letting an attack targeting a guarded ally hit you instead, attacker rolls damage normally instead of max."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Formfighting Style",
    "description": "You are skilled at the basics of the known forms of lightsaber combat. You gain the following benefits:\n- You learn three lightsaber forms, detailed later in this chapter.\n- Once on each of your turns, you can draw or stow a lightweapon without using your object interaction.",
    "mechanics": {
      "timing": "passive",
      "summary": "Learn 3 lightsaber forms; free draw/stow lightweapon once per turn"
    },
    "prerequisite": "The ability to cast force powers",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "lightsaberForm",
        "count": 3
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Formfighting Style",
        "text": "Once per turn, draw or stow a lightweapon without using your object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Great Weapon Style",
    "description": "You are skilled at putting the weight of a weapon to your advantage. You gain the following benefits:\n- While you are wielding a two-handed light- or vibro-weapon with which you are proficient, your weapon damage rolls gain a minimum roll threshold, discussed in chapter 7.\n- Grasping a two-handed weapon you are wielding in only one hand with your other hand no longer requires your object interaction.",
    "mechanics": {
      "timing": "passive",
      "summary": "Two-handed light- or vibroweapons gain minimum damage roll threshold; free two-handed regrip"
    },
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "twoHandedMelee",
        "minDamageThreshold": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Great Weapon Style",
        "text": "Grasping a two-handed weapon held in one hand with your other hand requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Guerrilla Style",
    "description": "You are skilled at maneuvering across the battlefield. You gain the following benefits:\n- You can take the Disengage action as a bonus action. If you could already take the Disengage action as a bonus action, you can instead take it as a reaction on your turn.\n- When you take the Disengage action, you ignore unenhanced difficult terrain, and you have advantage on the first ability check or saving throw to avoid an effect that impairs your movement speed or forces you to move before the start of your next turn.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Disengage as bonus action (or reaction on your turn); ignore unenhanced difficult terrain and advantage on first check/save vs forced movement"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Disengage (Guerrilla Style)",
        "summary": "Take Disengage as a bonus action (or reaction on your turn if already a bonus action); ignores unenhanced difficult terrain and grants advantage on the first check or save against speed impairment or forced movement before start of next turn.",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "first check after Disengaging to avoid speed impairment or forced movement"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "first save after Disengaging to avoid speed impairment or forced movement before start of next turn"
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Gunning Style",
    "description": "You are skilled at using blasters in unique ways. You gain the following benefits:\n- When a creature rolls a 1 on the saving throw against your burst or rapid property, they treat the effect's damage as if it had rolled the maximum.\n- When you use the burst property of a weapon, you can instead spray a line 20 feet long and 5 feet wide within range with shots. \n- When you use the rapid property of a weapon, when you roll the weapon's damage dice twice, you can double one set of the weapon's damage dice and forgo the other instead of adding them together.",
    "mechanics": {
      "timing": "free",
      "summary": "Burst 20×5 ft line option; Rapid double-one-set option; natural 1 save = maximum damage"
    },
    "effects": [
      {
        "type": "critMod",
        "scope": "burstRapid",
        "maxDamageOnSaveRoll": [
          1
        ],
        "burstLineOption": true,
        "rapidDoubleOneSet": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Gunning Style",
        "text": "Burst may spray a 20×5 ft line instead of 10-ft cube; Rapid may double one damage die set instead of rolling twice."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Mounted Style",
    "description": "You are skilled at fighting while mounted. You gain the following benefits:\n- Mounting a vehicle or beast only uses 5 feet of your movement, provided you can reach it.\n- You can force an attack targeted at your mount to target you instead, provided you are a valid target for that attack.",
    "mechanics": {
      "timing": "free",
      "summary": "Mount costs 5 ft; redirect attack targeting mount to yourself"
    },
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "note": "Mounting a vehicle or beast costs only 5 feet of movement"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Mounted Style",
        "text": "Force an attack targeting your mount to target you instead if you are a valid target."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Onslaught Style",
    "description": "You are skilled at using your momentum to your advantage. You gain the following benefits:\n- You can take the Dash action as a bonus action. If you could already take the Dash action as a bonus action, you can instead take it as a reaction on your turn.\n- When you would make an ability check to attempt to shove or trip a creature, you can make a melee weapon attack against the target's AC instead of a contested check. If you are wielding your weapon in two hands, you make this attack roll with advantage.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Dash as bonus action (or reaction on your turn); melee weapon attack instead of contested check to shove/trip (advantage if two-handed)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Dash (Onslaught Style)",
        "summary": "Take Dash as a bonus action (or reaction on your turn if already a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Onslaught Style (Shove/Trip)",
        "text": "Replace shove/trip check with a melee weapon attack vs AC (with advantage if wielding weapon in two hands)."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Poisoner Style",
    "description": "You are skilled at with the subtlety of poisons. You gain the following benefits:\n- You can apply poisons with your bonus action, instead of your action. If you could already apply poisons as a bonus action, you can instead do so as a reaction on your turn.\n- When a creature rolls a 1 on the saving throw against a poison you control, they treat the effect's damage as if it had rolled the maximum.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Apply poisons as bonus action (or reaction on your turn); natural 1 save = maximum damage"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Apply Poison (Poisoner Style)",
        "summary": "Apply poisons as a bonus action (or reaction on your turn if already a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "critMod",
        "scope": "poison",
        "maxDamageOnSaveRoll": [
          1
        ]
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Secured Style",
    "description": "You are skilled at fighting with weapons in atypical places. You gain the following benefits:\n- At the start of each of your turns while wielding a fixed weapon, you can choose to treat the weapon as a light shield until the start of your next turn. If you do so, you can't make attacks with the weapon for the duration.\n- You can benefit from fixed weapons while the hand is full.",
    "mechanics": {
      "timing": "free",
      "summary": "Start of turn: treat fixed weapon as light shield; benefit from fixed weapons with full hand"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Secured Style",
        "text": "Start of turn: treat a fixed weapon as a light shield until start of next turn (cannot attack with it); benefit from fixed weapons even while hand is full."
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "note": "While wielding a fixed weapon, choose whether to treat it as a light shield (+1 AC; cannot attack with it) until the start of your next turn."
      }
    ]
  },
  {
    "name": "Sentinel Style",
    "description": "You are skilled at techniques that take advantage of every drop in any enemy's guard. You gain the following benefits:\n- Creatures provoke an opportunity attack when they move to within your reach or move 5 feet or greater while within your reach.\n- When you hit a creature that is no more than one size larger than you with an opportunity attack, the creature gains 4 slowed levels until the end of the current turn.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Creatures provoke opportunity attack entering or moving 5+ ft in reach; hit inflicts 4 slowed levels"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Sentinel Opportunity Attack",
        "summary": "Creatures provoke opportunity attacks when entering your reach or moving 5+ ft inside your reach; hitting a creature up to 1 size larger inflicts 4 slowed levels until end of turn.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ],
    "durationSpec": {
      "anchor": "endOfTargetTurn"
    }
  },
  {
    "name": "Sharpshooter Style",
    "description": "You are skilled with firing at distant targets. You gain the following benefits:\n- You can use your bonus action to mark a target greater than 30 feet from you that you can see. If you do so, and that target moves at least 5 feet before the start of your next turn, they provoke an opportunity attack from you, and you can make a ranged weapon attack with a blaster weapon for that opportunity attack.\n- Your ranged weapon attacks reduce partial cover by one step (from three-quarters to half or half to one-quarter) against targets greater than 30 feet from you. If the target has one-quarter cover, you ignore it entirely.\n- Grasping a two-handed weapon you are wielding in only one hand with your other hand no longer requires your object interaction.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus action mark >30 ft for blaster opportunity attack; reduce partial cover >30 ft; free two-handed regrip"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Sharpshooter Mark (>30 ft)",
        "summary": "Mark 1 visible target >30 ft away; if it moves 5+ ft before start of next turn, make a ranged blaster opportunity attack.",
        "cadence": "unlimited"
      },
      {
        "type": "combatTrait",
        "kind": "coverReduction",
        "value": 1,
        "note": "Ranged attacks >30 ft reduce partial cover by 1 step and ignore 1/4 cover",
        "range": ">30 ft"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Sharpshooter Style (Regrip)",
        "text": "Grasping a two-handed weapon with your other hand requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    }
  },
  {
    "name": "Shield Style",
    "description": "You are skilled at using your shield to defend your allies as well as yourself. You gain the following benefits:\n- You are no longer restricted to wielding light weapons while wielding a heavy shield.\n- You can use a bonus action to try to shove or trip a creature within 5 feet of you with your shield.\n- When you use a shield as an improvised weapon, you are considered proficient in it, light shields are considered to have the light and fixed weapon properties, and heavy shields are considered to have the heavy weapon property.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Heavy shield allows non-light weapons; bonus action shove/trip within 5 ft with shield; proficient with shields as improvised weapons"
    },
    "effects": [
      {
        "type": "combatTrait",
        "kind": "ignoreObtrusiveShield",
        "note": "No longer restricted to light weapons while wielding a heavy shield"
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Shield Shove / Trip",
        "summary": "Bonus action: shove or trip a creature within 5 ft with your shield.",
        "cadence": "unlimited"
      },
      {
        "type": "weaponRule",
        "kind": "improvisedShield",
        "params": {
          "proficient": true,
          "lightShieldProps": [
            "Light",
            "Fixed"
          ],
          "heavyShieldProps": [
            "Heavy"
          ]
        }
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Snapshot Style",
    "description": "You are skilled at getting up close and personal. You gain the following benefits:\n- You no longer have disadvantage on ranged weapon attacks due to being within 5 feet of a hostile creature.\n- Your ranged weapon attacks reduce partial cover by one step (from three-quarters to half or half to one-quarter) against targets within 30 feet of you. If the target has one-quarter cover, you ignore it entirely.\n- Your blaster weapon damage rolls against creatures within 30 feet of you gain a minimum roll threshold, discussed in chapter 7.\n- Grasping a two-handed weapon you are wielding in only one hand with your other hand no longer requires your object interaction.",
    "mechanics": {
      "timing": "passive",
      "summary": "No 5-ft ranged disadvantage; blaster cover reduced by 1 step and minimum roll threshold within 30 ft; free two-handed regrip"
    },
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noCloseRangedDisadv",
        "note": "No disadvantage on ranged weapon attacks within 5 ft of a hostile creature"
      },
      {
        "type": "combatTrait",
        "kind": "coverReduction",
        "value": 1,
        "note": "Ranged attacks within 30 ft reduce partial cover by 1 step and ignore 1/4 cover",
        "range": "<=30 ft"
      },
      {
        "type": "attackDamageMod",
        "scope": "closeBlaster",
        "minDamageThreshold": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Snapshot Style",
        "text": "Grasping a two-handed weapon held in one hand with your other hand requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Split Style",
    "description": "You are skilled at fighting with interlocking weapons. You gain the following benefits:\n- When you engage in Double-Weapon Fighting, you can add your ability modifier to the attack roll of your Double-Weapon Fighting attack as long as it doesn't already include that modifier.\n- When you engage in Two-Weapon Fighting, you can add your ability modifier to the damage roll of your Two-Weapon Fighting attack as long as it doesn't already include that modifier.",
    "mechanics": {
      "timing": "passive",
      "summary": "Add ability modifier to Double-Weapon Fighting attack & Two-Weapon Fighting damage"
    },
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "dwf",
        "addAbilityModToHit": true
      },
      {
        "type": "attackDamageMod",
        "scope": "twf",
        "addAbilityMod": true
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Spotting Style",
    "description": "You are skilled at keeping track of your surroundings. You gain the following benefits:\n- You can take the Search action as a bonus action. If you could already take the Search action as a bonus action, you can instead take it as a reaction on your turn.\n- You have advantage on ability checks and saving throws to determine the nature of illusions. If you would already have advantage, you can instead reroll one of the dice once.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Search as bonus action (or reaction on your turn); advantage on checks and saves against illusions (reroll 1 die if already have advantage)"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Search (Spotting Style)",
        "summary": "Take Search as a bonus action (or reaction on your turn if already a bonus action).",
        "cadence": "unlimited"
      },
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "determining the nature of illusions (reroll 1 die if already have advantage)"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "determining the nature of illusions (reroll 1 die if already have advantage)"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Superiority Style",
    "description": "You are skilled at utilizing maneuvers to enhance your skills on the battlefield. You gain the following benefits:\n- You learn one maneuver, detailed in Chapter 13. Your maneuver ability is Strength, Dexterity, or Constitution for physical maneuvers (your choice), Intelligence, Wisdom, or Charisma for mental maneuvers (your choice), and an ability of your choice for general maneuvers. \n- You gain one superiority die, which is a d4. This die changes as you gain levels: to d6 at 5th level, to d8 at 9th level, to d10 at 13th level, and to d12 at 17th level. A superiority die is expended when you use it. You regain all of your expended superiority dice when you finish a short or long rest.",
    "mechanics": {
      "timing": "passive",
      "summary": "Learn 1 maneuver & gain +1 Superiority Die (scales d4→d12 by level)"
    },
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "maneuver",
        "count": 1,
        "superiorityDice": 1,
        "dieScaling": "d4/d6@5/d8@9/d10@13/d12@17",
        "recharge": "short"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Throwing Style",
    "description": "You are skilled with the techniques of throwing weapons. You gain the following benefits:\n- Whenever you make a ranged attack with a thrown weapon, you can immediately draw another weapon.\n- Whenever you make a ranged attack with a thrown weapon, you can move up to 5 feet without provoking opportunity attacks.\n- When you miss with a ranged attack with a thrown weapon, you can use your bonus action to repeat the attack against a creature within 15 feet and behind your initial target. Any modifications to the original attack roll, such as advantage, disadvantage, or without your proficiency bonus, also affect this attack roll.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Free draw & 5 ft step on thrown attack; bonus action repeat miss at target 15 ft behind"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ricochet Throw (Throwing Style)",
        "summary": "On a missed ranged thrown attack, bonus action to repeat the attack against a creature within 15 ft behind initial target.",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Throwing Style",
        "text": "Immediately draw another weapon and move up to 5 ft without provoking opportunity attacks whenever you make a ranged thrown attack."
      },
      {
        "type": "combatTrait",
        "kind": "thrownFreeDrawAndStep",
        "note": "Free draw & 5 ft step without opportunity attacks on thrown attack"
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  },
  {
    "name": "Twin-Blade Style",
    "description": "You are skilled at fighting with double-bladed weapons. You gain the following benefits:\n- When you engage in Double-Weapon Fighting, you can add your ability modifier to the attack roll of your Double-Weapon Fighting attack as long as it doesn't already include that modifier.\n- Grasping a double weapon you are wielding in only one hand with your other hand no longer requires your object interaction.",
    "mechanics": {
      "timing": "passive",
      "summary": "Add ability modifier to Double-Weapon Fighting attack roll; free double-weapon regrip"
    },
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "dwf",
        "addAbilityModToHit": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Twin-Blade Style",
        "text": "Grasping a double weapon held in one hand with your other hand requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Versatile Style",
    "description": "You are skilled at using weapons in different ways. You gain the following benefits:\n- When you miss with a melee weapon attack on your turn while wielding a versatile weapon with which you are proficient in two hands, you can use your bonus action to repeat the attack roll against the same target using one hand. Any modifications to the original attack roll, such as advantage, disadvantage, or without your proficiency bonus, also affect this attack roll.\n- When you miss with a melee weapon attack on your turn while wielding a versatile weapon with which you are proficient in one hand, you can use your bonus action to attempt to shove or trip that creature. Any modifications to the original attack roll, such as advantage, disadvantage, or without your proficiency bonus, also affect this ability check.\n- Grasping a versatile weapon you are wielding in only one hand with your other hand no longer requires your object interaction.",
    "mechanics": {
      "timing": "bonus",
      "summary": "On missed two-handed versatile attack: bonus one-handed repeat; on missed one-handed: bonus shove/trip; free versatile regrip"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Versatile Follow-Up",
        "summary": "On melee miss with proficient versatile weapon: if two-handed, bonus action repeat attack one-handed; if one-handed, bonus action shove or trip target.",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Versatile Style (Regrip)",
        "text": "Grasping a versatile weapon held in one hand with your other hand requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "instant"
    }
  }
];
const SW5E_FIGHTING_MASTERIES = [
  {
    "name": "Area Mastery",
    "description": "You've mastered fighting with weapons that affect an area, easily overwhelming your foe's defenses. You gain the following benefits:\n- When determining the save DC of a projector canister you control, you can use 8 + your proficiency bonus + your Intelligence modifier, if it would be higher than the item's DC.\n- Your projector canisters reduce partial cover by one step (from three-quarters to half or half to one-quarter). If a creature has one-quarter cover, you ignore it entirely.\n- When using a projector canister that requires a saving throw and deals damage, you can take a penalty to the save DC equal to your proficiency bonus. If you do so, the item's damage increases by an amount equal to your proficiency bonus.",
    "mechanics": {
      "timing": "free",
      "summary": "Projector canister DC {dcINT} (if higher); cover −1 step; −{prof} DC for +{prof} damage"
    },
    "effects": [
      {
        "type": "castingMod",
        "powerType": "item",
        "dcFormula": "max(itemDC, 8 + PB + INT_mod)",
        "note": "Projector canister save DC"
      },
      {
        "type": "combatTrait",
        "kind": "coverReduction",
        "value": 1,
        "note": "Projector canisters reduce partial cover by 1 step and ignore 1/4 cover",
        "range": "canister"
      },
      {
        "type": "attackDamageMod",
        "scope": "canister",
        "tradeoff": {
          "kind": "areaMastery",
          "dcPenalty": "PB",
          "damageBonus": "PB"
        }
      }
    ]
  },
  {
    "name": "Assisting Mastery",
    "description": "You've mastered enabling your allies, boosting them to the dismay of your enemies. You gain the following benefits:\n- When you take the Help action and target an ally, you can choose to forgo up to half your speed. If you do so, when that ally makes its ability check to complete the task with advantage, it can reroll one of the dice once. You can not use this feature if you have moved more than half your speed this turn.\n\n- When you take the Help action and target an enemy, you can choose to forgo up to half your speed. If you do so, when an ally makes its attack roll against the creature with advantage, it can reroll one of the dice once. You can not use this feature if you have moved more than half your speed this turn.\n- When you take the Help action, it has a range in feet equal to 5 x your proficiency bonus.",
    "mechanics": {
      "timing": "action",
      "summary": "Help range {5xProf} ft; forgo half speed to grant ally 1 die reroll"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.action",
        "title": "Assisting Mastery",
        "text": "Help range is {5xProf} ft; forgo up to half your speed (if you haven't moved more than half) so the helped ally's advantaged check or attack can reroll one die once."
      }
    ]
  },
  {
    "name": "Berserk Mastery",
    "description": "You've mastered returning pain to those who deliver it, becoming a scourge on the battlefield. You gain the following benefits:\n- When a creature scores a critical hit against you, you have advantage on the first attack you make against that creature before the end of your next turn. If you would already have advantage, you can instead reroll one of the dice once.\n- You have advantage on saving throws that would force you to act against your will, be frightened, or prevent you from attacking a creature.\n- When a creature within 5 feet of you deals damage to you with a weapon or unarmed strike, you can use your reaction to make a melee weapon attack or unarmed strike against that creature. On a hit, you deal additional damage equal to your proficiency bonus.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Reaction melee weapon/unarmed attack (+{prof} damage) when damaged by weapon/unarmed within 5 ft; advantage vs frightened & mind control"
    },
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against effects that force you to act against your will, frighten you, or prevent you from attacking"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Berserk Retaliation",
        "summary": "When damaged by a weapon or unarmed strike from a creature within 5 ft, make a melee weapon attack or unarmed strike (+{prof} damage on hit).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Berserk Mastery (Crit Revenge)",
        "text": "When critically hit, gain advantage (or reroll 1 die if already advantage) on your first attack against that creature before end of next turn."
      }
    ]
  },
  {
    "name": "Blindfighting Mastery",
    "description": "You've mastered fighting without sight, finding a home in the darkness that your enemies fear. You gain the following benefits:\n- Once per round, when a creature would have disadvantage on an attack roll against you due to being blinded, they must reroll one of the dice once.\n- Once per round, when you would have advantage on an attack roll against a creature that is blinded, you can reroll one of the dice once.\n- You gain blindsight out to a number of feet equal to 5 x your proficiency bonus. If you already have blindsight, it instead increases by a number of feet equal to 5 x your proficiency bonus.",
    "mechanics": {
      "timing": "passive",
      "summary": "Blindsight +{5xProf} ft; once per round reroll 1 die on blinded attack advantage/disadvantage"
    },
    "effects": [
      {
        "type": "sense",
        "kind": "blindsight",
        "rangePerProf": 5,
        "extend": true,
        "note": "{5xProf} ft blindsight (or extends existing blindsight by {5xProf} ft)"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Blindfighting Mastery",
        "text": "Once per round force a blinded attacker with disadvantage against you to reroll 1 die; once per round reroll 1 die when attacking a blinded target with advantage."
      }
    ]
  },
  {
    "name": "Brawler Mastery",
    "description": "You've mastered using your weight to your advantage, easily wrangling targets around. You gain the following benefits:\n- Your improvised weapons use a d6 for damage and gain the versatile (2d4) property.\n- Your damage die for your unarmed strikes and natural weapons increases by one step (from 1 to d4, d4 to d6, or d6 to d8).\n- Your speed isn't halved by carrying a grappled creature who is the same size category as you or smaller. \n- Once on each of your turns, when you hit a creature with an unarmed strike or a weapon wielded in one hand on your turn, you can make an additional unarmed strike against the same target without the aid of your proficiency bonus (no action required).",
    "mechanics": {
      "timing": "free",
      "summary": "Unarmed die +1 step; improvised weapons 1d6 (versatile 2d4); once per turn free unarmed strike (−{prof}) after unarmed or one-handed hit"
    },
    "effects": [
      {
        "type": "weaponRule",
        "kind": "unarmedDieStepUp",
        "params": {
          "steps": 1,
          "improvisedDie": "1d6",
          "improvisedVersatile": "2d4"
        }
      },
      {
        "type": "speed",
        "mode": "walk",
        "note": "Speed is not halved while carrying a grappled creature of your size or smaller"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Brawler Extra Unarmed Strike",
        "summary": "Once per turn on hitting with an unarmed strike or one-handed weapon, make 1 additional unarmed strike against the same target without proficiency (−{prof}, no action).",
        "cadence": "oncePerTurn"
      }
    ]
  },
  {
    "name": "Counterstrike Mastery",
    "description": "You've mastered returning attacks at those who dare strike you, effortless turning aside their blades while striking them with your own. You gain the following benefits:\n- Creatures have disadvantage on damage rolls from opportunity attacks they make that hit you, and you have advantage on damage roll for opportunity attacks you make that hit.\n- When you roll a die to reduce the damage you take from a weapon, you have advantage on the die roll.\n- Once per round, when a creature provokes an opportunity attack from you, you can choose to gain a special reaction which you can only use to make that opportunity attack. If you do so, you make the opportunity attack without the aid of your proficiency bonus.\n- When you would be the target of a weapon attack, you can immediately use your reaction to make an opportunity attack against the target without your proficiency bonus. On a hit, the target suffers the attack's normal effects, and you impose disadvantage on the triggering roll.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Reaction opportunity attack (−{prof}) when targeted to impose disadvantage; once per round special opportunity attack (−{prof})"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Counterstrike Parry-Riposte",
        "summary": "Once per round special reaction for an opportunity attack without proficiency (−{prof}); or reaction when targeted by a weapon attack to make an opportunity attack (−{prof}) imposing disadvantage on the triggering attack on hit.",
        "cadence": "oncePerRound",
        "reactionKind": "special"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Counterstrike Mastery",
        "text": "Incoming opportunity attack damage has disadvantage; your opportunity attack damage has advantage; advantage on dice rolled to reduce weapon damage."
      }
    ]
  },
  {
    "name": "Covert Mastery",
    "description": "You've mastered fighting from unseen angles, gaining an advantage over your foes. You gain the following benefits:\n- You can try to hide when you are lightly obscured from the creature from which you are hiding.\n- Dim light doesn't impose disadvantage on your Wisdom (Perception) checks that rely on sight.\n- When you are hidden from a creature and miss it with an unarmed strike or weapon attack, making the attack doesn't automatically reveal your position.\n- Once per turn, when you deal damage to a creature with an unarmed strike or weapon attack while hidden from it, you deal additional damage equal to your proficiency bonus.",
    "mechanics": {
      "timing": "free",
      "summary": "Once per turn +{prof} damage while hidden; hide when lightly obscured; miss doesn't reveal"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception"
        ],
        "mode": "noDisadvantage",
        "condition": "relying on sight in dim light"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Stealth"
        ],
        "title": "Covert Mastery",
        "text": "Hide when lightly obscured; missing while hidden doesn't reveal you; once per turn +{prof} damage when dealing weapon or unarmed damage while hidden."
      }
    ]
  },
  {
    "name": "Defense Mastery",
    "description": "You've mastered the art of defending yourself, treating your armor as a second skin. You gain the following benefits:\n- While you are wearing medium or heavy armor with which you are proficient, when a creature makes a melee attack against you while within your reach, whether the attack hits or misses, you can use your reaction to attempt to shove that creature up to 10 feet directly away from you.\n- The time it takes for you to don and doff armor is reduced by half.\n- While you are wearing medium or heavy armor with which you are proficient, damage that you take from weapons is reduced by an amount equal to your proficiency bonus. If this would reduce the damage to 0, the damage is instead reduced to 1.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Medium/heavy armor: weapon damage −{prof} (min 1); reaction shove 10 ft when melee-attacked"
    },
    "effects": [
      {
        "type": "damageReduction",
        "amount": "PB",
        "damageTypes": [
          "weapon"
        ],
        "minDamage": 1,
        "condition": "wearing proficient medium or heavy armor",
        "armorTiers": [
          "Medium",
          "Heavy"
        ]
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Armor Shove (Defense Mastery)",
        "summary": "Reaction in proficient medium/heavy armor when targeted by a melee attack within reach: attempt to shove attacker up to 10 ft away.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Defense Mastery (Don/Doff)",
        "text": "Armor don and doff times are halved."
      }
    ]
  },
  {
    "name": "Disruption Mastery",
    "description": "Choose one from force- or tech-casting. You've mastered fighting and interfering with casters of the chosen type, confounding their concentration. You gain the following benefits:\n- When a creature within 30 feet of you that you can see casts a power, they provoke an opportunity attack from you.\n- You have advantage on saving throws against powers cast by creatures you can see if you've dealt damage to them since the start of your last turn.\n- Whenever you force a creature to make a saving throw to maintain concentration, the DC for the saving throw increases by an amount equal to your proficiency bonus.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Casting within 30 ft provokes opportunity attack; +{prof} to concentration DC; advantage vs damaged caster",
      "choice": {
        "kind": "castingType",
        "options": [
          "Force-casting",
          "Tech-casting"
        ],
        "label": "Disruption Target"
      }
    },
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against {choice} powers cast by creatures you can see that you damaged since start of your last turn"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Disrupting Opportunity Attack",
        "summary": "Creatures within 30 ft that you can see provoke an opportunity attack when casting a chosen-type power.",
        "cadence": "unlimited",
        "reactionKind": "standard"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Disruption Mastery (Concentration)",
        "text": "Concentration save DCs you force increase by +{prof}."
      }
    ]
  },
  {
    "name": "Dual Wield Mastery",
    "description": "You've mastered fighting with two weapons, becoming a flurry of motion. You gain the following benefits:\n- You can engage in Two-Weapon Fighting even when the weapons you are wielding lack the light property.\n- You can reload two weapons when you would normally only be able to reload one, and reloading no longer requires a free hand, provided you are wielding separate weapons in each hand.\n- Once per round, when you make an opportunity attack while wielding separate weapons in each hand, you can attack with both weapons. Make a separate attack roll with each weapon.\n- When you use your bonus action to engage in Two-Weapon Fighting, you can choose to forgo one or more attacks. For each attack you forgo, you gain a +1 bonus to AC until the start of your next turn.\n- When you use your bonus action to engage in Two-Weapon Fighting, you can choose to forgo your proficiency bonus. If you do so, you can make an additional attack with that weapon, also without your proficiency bonus. If you would normally make more than one attack with your bonus action, only one attack is made without your proficiency bonus.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Two-Weapon Fighting without light; dual reload (no free hand); bonus forgo attacks (+1 AC each) or −{prof} for extra attack; dual opportunity attack"
    },
    "effects": [
      {
        "type": "weaponRule",
        "kind": "twfIgnoreLight",
        "params": {
          "ignoreLight": true,
          "dualReloadNoFreeHand": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Dual Wield Mastery (Reload & OA)",
        "text": "Reload two weapons at once with no free hand while wielding separate weapons; once per round make an opportunity attack with both weapons."
      }
    ]
  },
  {
    "name": "Duelist Mastery",
    "description": "You've mastered the art of fighting with a single weapon, making one weapon feel like many. You gain the following benefits:\n- You have advantage on ability checks and saving throws to avoid being disarmed.\n- While you are wielding a weapon in one hand with which you are proficient and no other weapons, when you take the Attack action, you can choose to attack with haste at the expense of accuracy. Your weapon attack is made without the aid of your proficiency bonus, but you can use your reaction to make an additional weapon attack, also without your proficiency bonus. If you would make more than one attack when you take the Attack action, only one attack is made without your proficiency bonus.\n- While you are wielding a weapon in one hand with which you are proficient and no other weapons, when a creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing the attack to miss you.",
    "mechanics": {
      "timing": "reaction",
      "summary": "One-handed weapon: reaction +{prof} AC vs melee hit; forgo proficiency (−{prof}) on Attack for reaction attack (−{prof})"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "avoiding being disarmed"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding being disarmed"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Duelist Parry / Hasty Strike",
        "summary": "Wielding 1 proficient one-handed weapon: reaction on melee hit to add +{prof} AC for that attack; or forgo proficiency (−{prof}) on 1 Attack-action strike for a reaction attack (−{prof}).",
        "cadence": "unlimited",
        "reactionKind": "standard"
      }
    ]
  },
  {
    "name": "Equilibrium Mastery",
    "description": "You've mastered fighting without the confines of armor, treating combat as an elegant dance. You gain the following benefits:\n- If you are disarmed, you can use your reaction to immediately catch the weapon.\n- While you are wearing light or no armor and not wielding a shield, when a creature misses you with a weapon attack, you can use your reaction to make an unarmed strike or weapon attack against that creature without your proficiency bonus.\n- While you are wearing light or no armor and not wielding a shield, when a creature hits you with a weapon attack, you can use your reaction to impose a penalty to the attack roll equal to your proficiency bonus, potentially causing the attack to miss.",
    "durationSpec": {
      "anchor": "instant"
    },
    "mechanics": {
      "timing": "reaction",
      "summary": "Light/no armor, no shield: reaction attack (−{prof}) on miss or −{prof} to incoming hit; reaction catch disarmed weapon"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Equilibrium Counter / Deflect",
        "cadence": "unlimited",
        "reactionKind": "standard",
        "summary": "Reaction to catch weapon if disarmed; in light/no armor without shield, reaction on weapon miss for a counterattack (−{prof}) or on weapon hit to impose −{prof} to the attack roll."
      }
    ]
  },
  {
    "name": "Explosives Mastery",
    "description": "You've mastered fighting with explosives, causing untold destruction. You gain the following benefits:\n- When determining the save DC of a grenade, mine, or missile you control, you can use 8 + your proficiency bonus + your Intelligence modifier, if it would be higher than the item's DC.\n- You have advantage on saving throws against grenades, mines, and missiles you control.\n- When using a grenade, mine, or missile that requires a saving throw and deals damage, you can take a penalty to the save DC equal to your proficiency bonus. If you do so, the item's damage increases by an amount equal to your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "free",
      "summary": "Explosive DC {dcINT} (if higher); advantage vs own explosives; −{prof} DC for +{prof} damage"
    },
    "effects": [
      {
        "type": "castingMod",
        "powerType": "item",
        "dcFormula": "max(itemDC, 8 + PB + INT_mod)",
        "note": "Grenade, mine, and missile save DC"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against grenades, mines, and missiles you control"
      },
      {
        "type": "attackDamageMod",
        "scope": "explosive",
        "cadence": "unlimited",
        "tradeoff": {
          "kind": "explosivesMastery",
          "dcPenalty": "PB",
          "damageBonus": "PB"
        }
      }
    ]
  },
  {
    "name": "Formation Mastery",
    "description": "You've mastered fighting with a partner, learning to move and act as a single unit. You gain the following benefits:\n- When you take the Guard action, the guarded ally has advantage on Dexterity saving throws that would affect only them while guarded.\n- When a creature misses an ally within 5 feet of you with a weapon attack, you can use your reaction to make a weapon attack against that creature without your proficiency bonus.\n- When a creature hits an ally within 5 feet of you with a weapon attack, you can use your reaction to impose a penalty to the attack roll equal to your proficiency bonus, potentially causing the attack to miss.",
    "durationSpec": {
      "anchor": "instant"
    },
    "mechanics": {
      "timing": "reaction",
      "summary": "Ally within 5 ft: reaction attack (−{prof}) on miss or −{prof} to incoming hit; guarded ally has advantage on single-target Dexterity saves"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.action",
        "title": "Formation Mastery (Guard)",
        "cadence": "unlimited",
        "text": "When you take the Guard action, the guarded ally has advantage on Dexterity saving throws that affect only them while guarded."
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Formation Riposte / Deflect",
        "cadence": "unlimited",
        "reactionKind": "standard",
        "summary": "Reaction when a weapon misses an ally within 5 ft for a weapon attack (−{prof}), or when it hits to impose −{prof} to the attack roll."
      }
    ]
  },
  {
    "name": "Formfighting Mastery",
    "description": "You've mastered the basics of the known forms of lightsaber combat, wielding your weapon with unparalleled grace. You gain the following benefits:\n- You learn three lightsaber forms, detailed later in this chapter. If you already know at least three lightsaber forms, you instead learn seven lightsaber forms.\n- Once on each of your turns, before you make a melee weapon attack, you can choose to forgo your proficiency bonus. If you do so, you can engage in one of your lightsaber forms without using your bonus action. If that form lets you make an attack, that attack is also made without your proficiency bonus.\n- Once on each of your turns, before you make a melee weapon attack, you can choose to forgo your proficiency bonus. If you do so, and the attack hits, you can choose another creature within 5 feet of it. If the original attack roll would hit the second creature, it takes damage of the weapon's type equal to twice your proficiency bonus.",
    "prerequisite": "The ability to cast force powers",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "free",
      "summary": "Once per turn forgo proficiency (−{prof}) on melee to adopt form free or cleave 5 ft for {2xProf} damage"
    },
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "lightsaberForm",
        "count": 3,
        "note": "Learn 3 lightsaber forms (or 7 if you already know at least 3).",
        "ifAlreadyHaveThreshold": 3,
        "ifAlreadyHaveCount": 7
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Formfighting Mastery",
        "cadence": "oncePerTurn",
        "text": "Once per turn forgo proficiency (−{prof}) on a melee attack to adopt a lightsaber form without your bonus action; once per turn forgo proficiency (−{prof}) to cleave an adjacent foe within 5 ft for {2xProf} weapon-type damage."
      }
    ]
  },
  {
    "name": "Great Weapon Mastery",
    "description": "You've mastered putting the weight of a weapon to your advantage, letting its momentum empower your strikes. You gain the following benefits:\n- On your turn, when you score a critical hit or reduce a creature to 0 hit points with a melee weapon attack, you can make one melee weapon attack as a bonus action.\n- While you are wielding a two-handed light- or vibro-weapon with which you are proficient, when you miss with a melee weapon attack, you can use your bonus action to repeat the attack against the same target. Any modifications to the original attack roll, such as advantage, disadvantage, or without your proficiency bonus, also affect this attack roll. On a hit, this attack deals kinetic damage equal to your Strength modifier.\n- You have advantage on ability checks and saving throws to avoid being disarmed.\n- While you are wielding a two-handed light- or vibro-weapon with which you are proficient, before you make a melee weapon attack, you can choose to forgo your proficiency bonus. If the attack hits, you add twice your proficiency bonus to the attack's damage.",
    "durationSpec": {
      "anchor": "instant"
    },
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus melee attack on crit, 0 HP, or two-handed miss ({strModFloor0} kinetic); proficient two-handed light/vibro −{prof} hit for +{2xProf} damage"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "avoiding being disarmed"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding being disarmed"
      },
      {
        "type": "attackDamageMod",
        "scope": "twoHandedMelee",
        "cadence": "unlimited",
        "tradeoff": {
          "kind": "powerAttack",
          "attackPenalty": "PB",
          "damageBonus": "2*PB"
        }
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Great Weapon Cleave / Follow-Up",
        "cadence": "unlimited",
        "summary": "Bonus action melee attack on critical hit or 0-HP kill; or on miss with a proficient two-handed light- or vibroweapon, bonus action repeat attack dealing {strModFloor0} kinetic damage on hit."
      }
    ]
  },
  {
    "name": "Guerrilla Mastery",
    "description": "You've mastered maneuvering across the battlefield, sliding through openings that others might not see. You gain the following benefits:\n- You can move through a hostile creature's space regardless of that creature's size.\n- When you hit a creature with an opportunity attack, you can move up to half your speed (no action required) without provoking opportunity attacks from that creature.\n- When a hostile creature moves to within 5 feet of you, you can use your reaction to Disengage and move up to half your speed. \n- Once per turn, when you hit a creature with a weapon attack, another enemy of the creature is within 5 feet of it, and that enemy isn't incapacitated, you can deal additional damage equal to twice your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "reaction",
      "summary": "Reaction Disengage + half speed when foe enters 5 ft; once per turn +{2xProf} damage with adjacent ally"
    },
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "note": "Move through hostile creatures' spaces regardless of size"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Guerrilla Skirmish",
        "cadence": "unlimited",
        "reactionKind": "standard",
        "summary": "Reaction when a hostile creature moves within 5 ft: Disengage and move up to half speed."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Guerrilla Mastery (Skirmish)",
        "cadence": "oncePerTurn",
        "text": "On opportunity attack hit, move up to half speed without provoking from that target; once per turn on weapon hit, deal +{2xProf} damage if another non-incapacitated enemy of the target is within 5 ft."
      }
    ]
  },
  {
    "name": "Gunning Mastery",
    "description": "You've mastered using blasters in unique ways, controlling the battlefield. You gain the following benefits:\n- When a creature succeeds on the saving throw against the burst or rapid property of your weapon, they take damage equal to the weapon's governing ability modifier.\n- You treat the strength number of weapons as one step lower (19 to 17, 17 to 15, 15 to 13, or 13 to 11). If the strength number is 11, you ignore it entirely.\n- When you use the burst property of a weapon, you can choose to forgo your proficiency bonus to the save DC. If you do so, each creature that fails the save takes additional damage equal to your proficiency bonus.\n- When you use the rapid property of a weapon, you can choose to forgo your proficiency bonus to the save DC. If you do so, and the target fails the save, they take additional damage equal to twice your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "free",
      "summary": "Weapon Strength requirement −1 step (11 ignored); burst/rapid −{prof} DC for +{prof} / +{2xProf} damage; pass save takes ability mod damage"
    },
    "effects": [
      {
        "type": "weaponRule",
        "kind": "reduceStrengthReqStep",
        "params": {
          "steps": 1,
          "ignore11": true
        }
      },
      {
        "type": "attackDamageMod",
        "scope": "burstRapid",
        "cadence": "unlimited",
        "tradeoff": {
          "kind": "gunningMastery",
          "dcPenalty": "PB",
          "burstDamageBonus": "PB",
          "rapidDamageBonus": "2*PB"
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Gunning Mastery",
        "cadence": "unlimited",
        "text": "Creatures succeeding on your burst or rapid save still take damage equal to the weapon's governing ability modifier."
      }
    ]
  },
  {
    "name": "Mounted Mastery",
    "description": "You've mastered the art of fighting while mounted, moving seamlessly with your companion. You gain the following benefits:\n- If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, you can use your reaction to have it instead take no damage if it succeeds on the saving throw, and only half damage if it fails.\n- While mounted on a controlled beast, you can use your bonus action to have your mount make a single melee attack against a creature within its reach. If you could already use your bonus action to have your mount make an attack, you can instead do so as a reaction on your turn.\n- While mounted on a vehicle, you can take a vehicle action with your bonus action, instead of your action. If you could already take a vehicle action as a bonus action, you can instead do so as a reaction on your turn. You can't take the same action twice in one turn.\n- Once per turn, you can choose to have advantage on a melee weapon attack roll against an unmounted creature that is smaller than your mount. If the attack hits, you deal additional damage equal to your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus action (or reaction on your turn): mount melee attack or vehicle action; once per turn advantage & +{prof} melee damage vs smaller unmounted foe",
      "secondaryAction": {
        "zone": "reaction",
        "name": "Mounted Mastery (Evasion)",
        "summary": "Give your mount Evasion on a Dexterity saving throw (0 damage on pass, half on fail)"
      }
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Mounted Mastery (Evasion)",
        "cadence": "unlimited",
        "reactionKind": "standard",
        "summary": "Reaction: give your mount Evasion on a Dexterity saving throw (0 damage on pass, half on fail)."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Mounted Command / Vehicle Action",
        "cadence": "unlimited",
        "summary": "Bonus action (or reaction on your turn if already a bonus action): controlled beast makes 1 melee attack, or take a vehicle action (no duplicate action per turn)."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Mounted Mastery (Charge)",
        "cadence": "oncePerTurn",
        "text": "Once per turn, gain advantage on a melee weapon attack against an unmounted creature smaller than your mount and deal +{prof} damage on hit."
      }
    ]
  },
  {
    "name": "Onslaught Mastery",
    "description": "You've mastered using your momentum to your advantage, effectively pummeling creatures into submission and keeping them down once they fall. You gain the following benefits:\n- When a creature falls prone within 5 feet of you, they provoke an opportunity attack from you.\n- When you would have advantage on a melee weapon attack due to a creature being prone, you can reroll one of the dice once.\n- When a prone creature within 5 feet of you attempts to stand, they provoke an opportunity attack from you.\n- Once on each of your turns, if you move at least 10 feet in a straight line towards a creature immediately before hitting it with a melee weapon attack, you can deal additional damage equal to your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "reaction",
      "summary": "Falling prone or standing within 5 ft provokes opportunity attack; reroll 1 die on advantaged melee vs prone; once per turn +{prof} damage after moving 10 ft"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Onslaught Opportunity Attack",
        "cadence": "unlimited",
        "reactionKind": "standard",
        "summary": "Creatures falling prone or standing from prone within 5 ft provoke opportunity attacks."
      },
      {
        "type": "rerollRule",
        "scope": "melee",
        "trigger": "1 die",
        "condition": "advantaged melee attack vs prone"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Onslaught Mastery (Momentum)",
        "cadence": "oncePerTurn",
        "text": "Once per turn, after moving at least 10 ft straight toward a creature immediately before hitting it with a melee weapon attack, deal +{prof} damage."
      }
    ]
  },
  {
    "name": "Poisoner Mastery",
    "description": "You are skilled at with the subtlety of poisons, causing untold destruction. You gain the following benefits:\n- When determining the save DC of a poison you control, you can use 8 + your proficiency bonus + your Intelligence modifier, if it would be higher than the item's DC.\n- When you apply a poison to a weapon or ammunition, that poison can affect an additional hit or an additional piece of ammunition.\n- Creatures suffering from the poisoned condition have disadvantage on saving throws against poisons you control.\n- When using a poison that requires a saving throw and deals damage, you can take a penalty to the save DC equal to your proficiency bonus. If you do so, the item's damage increases by an amount equal to twice your proficiency bonus.",
    "durationSpec": {
      "anchor": "permanent"
    },
    "mechanics": {
      "timing": "free",
      "summary": "Poison DC {dcINT} (if higher); +1 hit/ammo; poisoned foes have disadvantage vs your poisons; −{prof} DC for +{2xProf} damage"
    },
    "effects": [
      {
        "type": "castingMod",
        "powerType": "item",
        "dcFormula": "max(itemDC, 8 + PB + INT_mod)",
        "note": "Poison save DC"
      },
      {
        "type": "attackDamageMod",
        "scope": "poison",
        "cadence": "unlimited",
        "tradeoff": {
          "kind": "poisonerMastery",
          "dcPenalty": "PB",
          "damageBonus": "2*PB"
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Poisoner Mastery",
        "cadence": "unlimited",
        "text": "Applied poison lasts +1 extra hit/ammo; poisoned creatures have disadvantage on saves vs your poisons."
      }
    ]
  },
  {
    "name": "Secured Mastery",
    "description": "You've mastered fighting with weapons in atypical places, seamlessly transitioning between your armaments. You gain the following benefits:\n- You can wield a number of items on each forearm equal to your full Strength modifier, instead of half.\n- You can now reload fixed weapons using your reaction or object interaction, instead of just your action or bonus action. If you could already reload the weapon using your reaction or object interaction, once on each of your turns, you can instead reload the weapon (no action required). You must have one free hand to reload.\n- Once on each of your turns, when you miss an attack with a weapon that lacks the fixed property, you can make an additional attack against the same target with a fixed weapon without the aid of your proficiency bonus (no action required).\n- Once on each of your turns, when you would make a weapon attack with a fixed weapon, you can forgo the attack. If you do so, you can add your proficiency bonus to your AC against one attack that would hit you before the start of your next turn (no action required).",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "mechanics": {
      "timing": "free",
      "summary": "Once per turn free fixed attack (−{prof}) on miss; forgo fixed attack for +{prof} AC vs 1 hit before next turn"
    },
    "effects": [
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Secured Mastery",
        "cadence": "oncePerTurn",
        "text": "Wield up to {strMod} item(s) per forearm; reload fixed weapons via reaction or object interaction (or free once per turn if already; requires 1 free hand); once per turn free fixed attack (−{prof}) on non-fixed miss; once per turn forgo fixed attack for +{prof} AC against 1 hit before start of next turn."
      }
    ]
  },
  {
    "name": "Sentinel Mastery",
    "description": "You've mastered techniques to take advantage of every drop in any enemy's guard; in tight spaces you are indomitable. You gain the following benefits:\n- Creatures within your reach provoke opportunity attacks from you even if they take the Disengage action.\n- When you take the Dodge action, once per round, you can take two reactions on the same turn, instead of only one. You can only take one reaction per trigger.\n- You can use a bonus action to enter a defensive stance that lasts until the start of your next turn. While in your defensive stance, you have a number of special reactions equal to your proficiency bonus that you can only use to make opportunity attacks.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Bonus defensive stance: {prof} special opportunity attack reactions; ignores Disengage; 2 reactions on Dodge"
    },
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Sentinel Defensive Stance",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "reactionKind": "special",
        "summary": "Until start of next turn, gain {prof} special reactions that can only be used to make opportunity attacks.",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "combat.reaction",
        "title": "Sentinel Mastery",
        "cadence": "oncePerRound",
        "text": "Creatures within your reach provoke opportunity attacks even if they take Disengage; when you take Dodge, once per round you can take 2 reactions on the same turn (1 per trigger)."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Sharpshooter Mastery",
    "description": "You've mastered blaster weapons and can easily make shots that others find impossible. You gain the following benefits:\n- Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls.\n- Your ranged weapon attacks reduce partial cover by one step (from three-quarters to half or half to one-quarter) against targets greater than 30 feet from you. If the target has one-quarter cover, you ignore it entirely.\n- Before you make an attack against a target greater than 30 feet from you with a blaster weapon with which you are proficient, you can choose to forgo your proficiency bonus. If the attack hits, you add twice your proficiency bonus to the attack's damage.",
    "mechanics": {
      "timing": "free",
      "summary": "No long-range disadvantage; >30 ft blaster −{prof} attack for +{2xProf} damage"
    },
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noLongRangeDisadv",
        "note": "No disadvantage for attacking at long range with ranged weapons"
      },
      {
        "type": "combatTrait",
        "kind": "coverReduction",
        "value": 1,
        "note": "Ranged attacks >30 ft reduce partial cover by 1 step and ignore 1/4 cover",
        "range": ">30 ft"
      },
      {
        "type": "attackDamageMod",
        "scope": "blasterOver30ft",
        "tradeoff": {
          "kind": "powerAttack",
          "attackPenalty": "PB",
          "damageBonus": "2*PB"
        }
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Shield Mastery",
    "description": "You've mastered using a shield to defend your allies as well as yourself, strategically imposing your shield to capitalize on its protection. You gain the following benefits:\n\n- If you aren't incapacitated, you can add your shield's AC bonus to any Dexterity saving throw you make against a power or other harmful effect.\n- While you are wielding a shield with which you are proficient, when you are subjected to an effect that allows you to make a Dexterity saving throw to take only half damage, and you succeed on the saving throw, you can use your reaction to take no damage.\n- When a creature you can see damages you while you are wielding a shield with which you are proficient, you can use your reaction to reduce the damage by an amount equal to your proficiency bonus.",
    "mechanics": {
      "timing": "reaction",
      "summary": "Add shield AC to Dexterity saves; reaction Evasion on Dexterity save; reaction reduce damage by {prof}"
    },
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Dexterity"
        ],
        "mode": "bonus",
        "shieldAcBonus": true,
        "condition": "add shield AC bonus to Dexterity saves vs powers and harmful effects (while not incapacitated)"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "name": "Shield Evasion / Block",
        "summary": "Proficient shield: take 0 damage on a successful half-damage Dexterity save, or reduce damage from a visible attacker by {prof}.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Snapshot Mastery",
    "description": "You've mastered getting up close and personal with blaster weapons, maintaining both rate of fire and accuracy. You gain the following benefits:\n- Your ranged weapon attacks reduce partial cover by one step (from three-quarters to half or half to one-quarter) against targets within 30 feet of you. If the target has one-quarter cover, you ignore it entirely.\n- Other creatures provoke an opportunity attack from you when they move to within 30 feet of you, and you can make ranged weapon attacks with blaster weapons when making opportunity attacks.\n- When you take the Attack action targeting a creature within 30 feet while you are wielding a blaster weapon with which you are proficient, you can choose to attack rapidly at the expense of accuracy. Your ranged weapon attack is made without the aid of your proficiency bonus, but you can use your bonus action to make an additional ranged weapon attack, also without your proficiency bonus. If you would make more than one attack when you take the Attack action, only one attack is made without your proficiency bonus.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Attack within 30 ft: forgo proficiency (−{prof}) on 1 blaster shot for a bonus ranged attack (−{prof})",
      "secondaryAction": {
        "zone": "reaction",
        "name": "Snapshot Mastery (Overwatch)",
        "summary": "Creatures moving within 30 ft provoke ranged blaster opportunity attacks"
      }
    },
    "effects": [
      {
        "type": "combatTrait",
        "kind": "coverReduction",
        "value": 1,
        "note": "Ranged attacks within 30 ft reduce partial cover by 1 step and ignore 1/4 cover",
        "range": "<=30 ft"
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Snapshot Rapid Fire",
        "summary": "On Attack action within 30 ft with a proficient blaster, forgo proficiency (−{prof}) on 1 attack for a bonus-action ranged attack (−{prof}).",
        "cadence": "unlimited"
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "name": "Snapshot Overwatch",
        "summary": "Creatures moving within 30 ft provoke ranged blaster opportunity attacks.",
        "cadence": "unlimited"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Split Mastery",
    "description": "You've mastered fighting with interlocking weapons, seamlessly transitioning between twin blades and dual wielding. You gain the following benefits:\n- Once on each of your turns, detaching or reattaching your interlocking weapon no longer requires your object interaction.\n- You can engage in Double- and Two-Weapon Fighting even when the weapons you are wielding lack the light property.\n- Before you make a melee weapon attack while you are wielding separate weapons in each hand with which you are proficient, you can choose to forgo your proficiency bonus. If the attack hits, you add your proficiency bonus to the attack's damage.\n- When you use your bonus action to engage in Double-Weapon Fighting, you can choose to forgo your proficiency bonus. If you do so, you can make an additional attack with that weapon, also without your proficiency bonus. If you would normally make more than one attack with your bonus action, only one attack is made without your proficiency bonus.",
    "mechanics": {
      "timing": "bonus",
      "summary": "Double- & Two-Weapon Fighting without light; dual melee −{prof} hit for +{prof} damage; bonus Double-Weapon −{prof} for extra attack"
    },
    "effects": [
      {
        "type": "weaponRule",
        "kind": "splitIgnoreLight",
        "params": {
          "dwfIgnoreLight": true,
          "twfIgnoreLight": true
        }
      },
      {
        "type": "attackDamageMod",
        "scope": "dualMelee",
        "tradeoff": {
          "kind": "splitPowerAttack",
          "attackPenalty": "PB",
          "damageBonus": "PB"
        }
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Split Mastery (Double-Weapon Extra Attack)",
        "summary": "When engaging in Double-Weapon Fighting as a bonus action, forgo proficiency (−{prof}) on 1 attack to make an additional attack without proficiency (−{prof}).",
        "cadence": "unlimited"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Split Mastery",
        "cadence": "oncePerTurn",
        "text": "Once per turn, detaching or reattaching your interlocking weapon requires no object interaction."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Spotting Mastery",
    "description": "You've mastered keeping track of your surroundings, noticing things in detail that others miss entirely. You gain the following benefits:\n- You no longer have disadvantage on Wisdom (Perception) checks due to an area being lightly obscured in a 120 foot range. \n- When a creature rolls a d20 to redirect an attack roll you make to an illusory duplicate, they have disadvantage on the roll.\n- When you take the Search action, you give off no indication that you are devoting your attention to finding something.\n- When you find a hidden creature using the Search action, it has disadvantage on any ability checks it makes to attempt Hide from you before the start of your next turn.\n- When you take the Search action, you have advantage on all ability checks, attack rolls, and saving throws made as a part of that search that occur within a radius in feet equal to 5 x your proficiency bonus.",
    "mechanics": {
      "timing": "passive",
      "summary": "No lightly-obscured Perception disadvantage (120 ft); stealthy Search with advantage within {5xProf} ft"
    },
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception"
        ],
        "mode": "noDisadvantage",
        "condition": "due to lightly obscured areas within 120 feet"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Perception",
          "Investigation"
        ],
        "title": "Spotting Mastery",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "text": "Search gives no tell; found hidden foes have disadvantage to Hide until start of next turn; advantage on checks, attacks, and saves made as part of Search within {5xProf} ft."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Spotting Mastery",
        "text": "Creatures rolling a d20 to redirect your attack roll to an illusory duplicate have disadvantage on the roll."
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Superiority Mastery",
    "description": "You've mastered utilizing maneuvers to enhance your skills on the battlefield, *expanded*. You gain the following benefits:\n- You learn one maneuver, detailed in Chapter 13. If you already know at least one maneuver, you instead learn three maneuvers. Your maneuver ability is Strength, Dexterity, or Constitution for physical maneuvers (your choice), your Intelligence, Wisdom, or Charisma for mental maneuvers (your choice), and an ability of your choice for general maneuvers. \n- You gain one superiority die. If you already have at least one superiority die, you instead gain two additional superiority dice. Your superiority die is a d4, and it changes as you gain levels: to d6 at 5th level, to d8 at 9th level, to d10 at 13th level, and to d12 at 17th level. A superiority die is expended when you use it. You regain all of your expended superiority dice when you finish a short or long rest.\n- When you use a maneuver on your turn that involves rolling a superiority die, you can use your bonus action to gain advantage on the superiority die roll.\n- Choose one maneuver you know. When you would use the chosen maneuver, you can use a d4 instead of expending a superiority die. You can do so a number of times equal to your proficiency bonus. You regain all expended uses when you complete a long rest.",
    "mechanics": {
      "timing": "bonus",
      "summary": "+1/+2 Superiority Dice; bonus action advantage on die; {prof}/long rest free d4 on chosen maneuver"
    },
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "maneuver",
        "count": 1,
        "superiorityDice": 1,
        "ifAlreadyHaveDice": 2,
        "ifAlreadyHaveCount": 3,
        "dieScaling": "d4/d6@5/d8@9/d10@13/d12@17",
        "note": "Learn 1 maneuver (or 3 if already know ≥ 1) and gain 1 superiority die (or 2 if already have ≥ 1), d4->d12 scaling."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Superiority Mastery (Advantage Die)",
        "summary": "Bonus action: roll a superiority die with advantage on your turn.",
        "cadence": "unlimited"
      },
      {
        "type": "resourcePool",
        "id": "superiority_mastery_d4",
        "name": "Superiority Mastery (Free d4 Maneuver)",
        "max": "proficiency",
        "die": "d4",
        "recharge": "long"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Throwing Mastery",
    "description": "You've mastered the techniques of throwing weapons, readily blending the weapons with your movements. You gain the following benefits:\n- Attacking at long range doesn't impose disadvantage on your ranged weapon attack rolls with thrown weapons.\n- When you hit a creature with a ranged attack with a thrown weapon, you have advantage on your next melee weapon attack against that creature before the end of your next turn.\n\n- Once per turn, you can draw a thrown weapon without using your object interaction.\n- Once on each of your turns, you can make a ranged weapon attack with a thrown weapon against a target within the weapon's normal range without the aid of your proficiency bonus (no action required).",
    "mechanics": {
      "timing": "free",
      "summary": "Once per turn free thrown attack (−{prof}); no long-range disadvantage; advantage on melee after thrown hit"
    },
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noThrownLongRangeDisadv",
        "note": "No long-range disadvantage on ranged thrown weapon attacks"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Quick Throw (Throwing Mastery)",
        "summary": "Once per turn free draw; once per turn free thrown attack (−{prof}) within normal range; thrown hit grants advantage on next melee attack against that target before end of next turn.",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        }
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Twin-Blade Mastery",
    "description": "You've mastered fighting with double-bladed weapons, using both ends to devastating effect. You gain the following benefits:\n- While you are wielding a double weapon with which you are proficient, whenever you roll the maximum on a weapon damage die against a creature, you gain a +1 bonus to the next attack roll you make against that creature before the end of your next turn.\n- You can engage in Double-Weapon Fighting even when the weapon you are wielding lacks the light property.\n- Before you make a melee weapon attack while wielding a double weapon in two hands, you can choose to forgo your proficiency bonus. If the attack hits, you add one and a half times your proficiency bonus to the attack's damage.\n- Before you make a melee weapon attack while wielding a double weapon in one hand, you can choose to forgo your proficiency bonus. If the attack hits, you add your proficiency bonus to the attack's damage.",
    "mechanics": {
      "timing": "free",
      "summary": "Double-Weapon Fighting without light; −{prof} hit for +{oneHalfProf} (two-handed) or +{prof} (one-handed) damage; max die = +1 next hit"
    },
    "effects": [
      {
        "type": "weaponRule",
        "kind": "dwfIgnoreLight",
        "params": {
          "dwfIgnoreLight": true
        }
      },
      {
        "type": "attackDamageMod",
        "scope": "doubleWeapon",
        "tradeoff": {
          "kind": "twinBladePowerAttack",
          "attackPenalty": "PB",
          "damageBonusTwoHanded": "1.5*PB",
          "damageBonusOneHanded": "PB"
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Twin-Blade Mastery",
        "text": "Rolling max on a proficient double weapon damage die grants +1 to your next attack roll against that creature before end of next turn.",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        }
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  },
  {
    "name": "Versatile Mastery",
    "description": "You've mastered using weapons in different ways, altering your attack patterns mid-swing. You gain the following benefits:\n- Once per turn, when you make a melee attack roll while wielding a weapon in two hands, you can attempt to follow up on the attack. If the attack hits, the creature must make a Strength saving throw (DC = 8 + your bonus to attacks with the weapon). On a failed save, the creature is pushed back 5 feet, and you can immediately move into the space it just vacated without provoking opportunity attacks.\n- Once per turn, when you make a melee attack roll while wielding a weapon in one hand, the target is wielding a shield, and your other hand is empty, you can use your other hand to pull down the shield (no action required). If you do so, the creature gains no benefit to armor class from its shield for that attack.\n- Before you make a melee weapon attack while wielding a versatile weapon in two hands, you can choose to forgo your proficiency bonus. If the attack hits, you add one and a half times your proficiency bonus to the attack's damage.\n- Before you make a melee weapon attack while wielding a versatile weapon in one hand, you can choose to forgo your proficiency bonus. If the attack hits, you add your proficiency bonus to the attack's damage.",
    "mechanics": {
      "timing": "free",
      "summary": "Two-handed hit push 5 ft (DC 8+hit); one-handed pull shield; −{prof} hit for +{oneHalfProf} (two-handed) or +{prof} (one-handed) damage"
    },
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "versatileWeapon",
        "tradeoff": {
          "kind": "versatilePowerAttack",
          "attackPenalty": "PB",
          "damageBonusTwoHanded": "1.5*PB",
          "damageBonusOneHanded": "PB"
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Versatile Mastery",
        "text": "Once per turn two-handed melee hit forces Strength save (DC 8 + weapon attack bonus) or push 5 ft and step in without provoking; once per turn one-handed melee attack with empty off-hand negates target's shield AC for that attack.",
        "cadence": "oncePerTurn"
      }
    ],
    "durationSpec": {
      "anchor": "permanent"
    }
  }
];

const SW5E_LIGHTSABER_FORMS = [{"name":"Aqinos Form","description":"As a part of the bonus action to adopt this form, if you cast a tech power of 1st level or higher as your action, but no higher than half your Max Power Level, you can make one melee weapon attack.","mechanics":{"timing":"bonus","summary":"Make 1 melee weapon attack after casting a 1st+ level tech power (≤ {halfMaxTechPowerLevel})","duration":"Instant (on adopt)"},"prerequisite":"The ability to cast tech powers","effects":[{"type":"actionGrant","zone":"bonus","name":"Aqinos Form","summary":"If you cast a 1st+ level tech power (≤ {halfMaxTechPowerLevel}) as your action, make one melee weapon attack.","durationSpec":{"anchor":"instant"},"cadence":"unlimited"}],"durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"name":"Ataru Form","description":"As a part of the bonus action to adopt this form, you can leap up to 15 feet to an unoccupied space you can see.","mechanics":{"timing":"bonus","summary":"Leap up to 15 ft to an unoccupied space you can see","duration":"Instant (on adopt)"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Ataru Form","summary":"Bonus action: leap up to 15 feet to an unoccupied space you can see.","durationSpec":{"anchor":"instant"},"cadence":"unlimited"}],"durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"name":"Bakuuni Hand Form","description":"As a part of the bonus action to adopt this form, if you took the Attack action and would be able to use your bonus action to make an unarmed strike, you can do so as a part of this bonus action.\n\nUntil the start of your next turn, when a creature enters your reach or moves while within your reach, you can use your reaction to attempt to shove the creature. On a success, you can choose shove the target an additional 5 feet.","mechanics":{"timing":"bonus","activeReaction":"Shove creature entering/moving in reach (+5 ft push)","summary":"Unarmed strike as part of bonus action; reaction shove (+5 ft) when foe enters/moves in reach","duration":"Until start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Bakuuni Hand Form","summary":"Bonus action: include a bonus-action unarmed strike (if eligible from Attack action); until start of next turn, reaction when creature enters/moves in reach to shove (+5 ft extra push on success).","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"actionGrant","zone":"reaction","name":"Bakuuni Hand Form (Reaction)","summary":"Until start of next turn, when a creature enters or moves within your reach, use your reaction to shove it (+5 ft extra push on success).","when":{"activeEffect":"Bakuuni Hand Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"},"reactionKind":"standard","cadence":"unlimited"}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Djem So Form","description":"Before the end of your next turn, you can add half your Wisdom or Charisma modifier (your choice, minimum of +1) to one ability check or attack roll you make using Strength.","mechanics":{"timing":"bonus","summary":"Add +{halfForceMod} to one Strength check or attack roll before end of next turn","duration":"Before end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Djem So Form","summary":"Before end of next turn, add +{halfForceMod} to one Strength ability check or attack roll.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"weaponRule","kind":"djemSoStrBonus","durationSpec":{"anchor":"endOfOwnNextTurn"},"when":{"activeEffect":"Djem So Form"}},{"type":"conditionalCheckMod","ability":"Strength","mode":"bonus","valueFormula":"halfForceMod","condition":"one Strength ability check before end of next turn","durationSpec":{"anchor":"endOfOwnNextTurn"},"when":{"activeEffect":"Djem So Form"}},{"type":"contextualNote","surface":"attacks","title":"Djem So Form","text":"Add +{halfForceMod} to one Strength attack roll before end of next turn.","durationSpec":{"anchor":"endOfOwnNextTurn"},"when":{"activeEffect":"Djem So Form"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Drallig Form","description":"Until the start of your next turn, you gain a special reaction. When a creature enters your reach or moves while within your reach, you can use this special reaction to leap to an unoccupied space you can see within 10 feet without provoking opportunity attacks from that creature.","mechanics":{"timing":"bonus","activeReaction":"Special reaction: leap 10 ft without opportunity attack when creature enters or moves in reach","summary":"Special reaction: leap 10 ft without opportunity attack when creature enters or moves in reach","duration":"Until start of next turn","specialReaction":true},"effects":[{"type":"actionGrant","zone":"bonus","name":"Drallig Form","summary":"Bonus action: until start of next turn, gain a special reaction to leap 10 ft without provoking opportunity attacks when a creature enters or moves in reach.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"actionGrant","zone":"reaction","name":"Drallig Form (Special Reaction)","summary":"Until start of next turn, special reaction when a creature enters or moves in reach: leap up to 10 ft without provoking opportunity attacks from it.","when":{"activeEffect":"Drallig Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"},"reactionKind":"special","cadence":"unlimited"}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Ishu Form","description":"If there is a friendly creature within 15 feet of you, you can move up to 10 feet without provoking opportunity attacks. You must end this movement within 5 feet of the friendly creature.","mechanics":{"timing":"bonus","summary":"Move 10 ft without opportunity attack, ending within 5 ft of an ally within 15 ft","duration":"Instant (on adopt)"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Ishu Form","summary":"If an ally is within 15 ft, move up to 10 ft without provoking opportunity attacks, ending within 5 ft of that ally.","durationSpec":{"anchor":"instant"},"cadence":"unlimited"}],"durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"name":"Jar'Kai Form","description":"As a part of the bonus action to adopt this form, if you took the Attack action, you can engage in Double- or Two-Weapon Fighting. \n\nEach time you hit with an attack on this turn, you can move up to 5 feet without provoking opportunity attacks from the creature you hit.","mechanics":{"timing":"bonus","summary":"Engage Double-Weapon / Two-Weapon Fighting on adopt; move 5 ft without opportunity attack each time you hit this turn","duration":"This turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Jar'Kai Form","summary":"Engage in Double- or Two-Weapon Fighting (if you took the Attack action); each hit this turn lets you move 5 ft without provoking opportunity attacks from the hit creature.","durationSpec":{"anchor":"endOfOwnTurn"},"cadence":"unlimited"},{"type":"contextualNote","surface":"attacks","title":"Jar'Kai Form","text":"Each time you hit with an attack this turn, move up to 5 ft without provoking opportunity attacks from the creature you hit.","when":{"activeEffect":"Jar'Kai Form"},"durationSpec":{"anchor":"endOfOwnTurn"}}],"durationSpec":{"anchor":"endOfOwnTurn"},"cadence":"unlimited"},{"name":"Juyo Form","description":"Until the start of your next turn, your critical hit range with weapons increases by 1.","mechanics":{"timing":"bonus","summary":"Weapon critical hit range increases by 1 until start of next turn","duration":"Until start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Juyo Form","summary":"Bonus action: until start of next turn, your critical hit range with weapons increases by 1.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"critMod","critRangeDelta":1,"when":{"activeEffect":"Juyo Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"}}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Makashi Form","description":"Until the start of your next turn, you gain a special reaction. When a creature makes a melee weapon attack against you and misses, you can use this special reaction to make an opportunity attack against that creature.","mechanics":{"timing":"bonus","activeReaction":"Special reaction: opportunity attack when a melee weapon attack misses you","summary":"Special reaction: opportunity attack when a melee weapon attack misses you","duration":"Until start of next turn","specialReaction":true},"effects":[{"type":"actionGrant","zone":"bonus","name":"Makashi Form","summary":"Bonus action: until start of next turn, gain a special reaction to make an opportunity attack when a melee weapon attack misses you.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"actionGrant","zone":"reaction","name":"Makashi Form (Special Reaction)","summary":"Until start of next turn, special reaction when a melee weapon attack misses you to make an opportunity attack against the attacker.","when":{"activeEffect":"Makashi Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"},"reactionKind":"special","cadence":"unlimited"}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Niman Form","description":"As a part of the bonus action to adopt this form, if you took the Attack action, you can engage in Double- or Two-Weapon Fighting. \n\nUntil the end of your next turn, you can use Wisdom or Charisma instead of Strength or Dexterity for the attack and damage rolls of your melee weapon attacks. You must use the same modifier for both rolls.","mechanics":{"timing":"bonus","summary":"Engage Double-Weapon / Two-Weapon Fighting on adopt; use Wisdom/Charisma for melee weapon attack & damage until end of next turn","duration":"Until end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Niman Form","summary":"Engage in Double- or Two-Weapon Fighting (if you took the Attack action); until end of next turn, use Wisdom or Charisma instead of Strength or Dexterity for melee weapon attack and damage rolls.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"weaponRule","kind":"nimanForceMelee","when":{"activeEffect":"Niman Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Shien Form","description":"Before the end of your next turn, you can add half your Wisdom or Charisma modifier (your choice, minimum of +1) to your AC against one attack.","mechanics":{"timing":"bonus","summary":"Add +{halfForceMod} to AC against one attack before end of next turn","duration":"Before end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Shien Form","summary":"Before end of next turn, add +{halfForceMod} to AC against one attack.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"acBonus","formula":"halfForceMod","when":{"activeEffect":"Shien Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Shii-Cho Form","description":"As a part of the bonus action to adopt this form, if you took the Attack action, you can engage in Double- or Two-Weapon Fighting.\n\nAdditionally, the first time you hit a Large or smaller creature within 5 feet of you with a weapon attack before the end of your next turn, you can force the target to make a Strength saving throw (DC = 8 + your bonus to attacks with the weapon). On a failed save, it is pushed back 5 feet, and you can immediately move into the space it just vacated without provoking opportunity attacks.","mechanics":{"timing":"bonus","summary":"Engage Double-Weapon / Two-Weapon Fighting on adopt; first hit forces Strength save (DC 8 + attack bonus) or push 5 ft + step in","duration":"Before end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Shii-Cho Form","summary":"Engage in Double- or Two-Weapon Fighting (if you took the Attack action); first hit on a Large or smaller foe within 5 ft forces a Strength save (DC 8 + weapon attack bonus) or push 5 ft and step in without provoking.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"weaponRule","kind":"shiiChoPush","when":{"activeEffect":"Shii-Cho Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}},{"type":"contextualNote","surface":"attacks","title":"Shii-Cho Form","text":"First hit on a Large or smaller creature within 5 ft before end of next turn forces a Strength save (DC 8 + weapon attack bonus) or push 5 ft and step into vacated space without provoking.","when":{"activeEffect":"Shii-Cho Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Sokan Form","description":"Until the start of your next turn, you ignore difficult terrain. Additionally, when a hostile creature makes a melee weapon attack against you, you can use your reaction to move to another space within 5 feet of that creature without provoking opportunity attacks, imposing disadvantage on the triggering roll.","mechanics":{"timing":"bonus","activeReaction":"Sidestep within 5 ft of melee attacker without opportunity attack, imposing disadvantage","summary":"Ignore difficult terrain; reaction sidestep within 5 ft of melee attacker to impose disadvantage","duration":"Until start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Sokan Form","summary":"Bonus action: until start of next turn, ignore difficult terrain and gain a reaction to sidestep within 5 ft of a melee attacker without provoking to impose disadvantage.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"speed","mode":"walk","ignoreDifficultTerrain":true,"when":{"activeEffect":"Sokan Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"}},{"type":"actionGrant","zone":"reaction","name":"Sokan Form (Reaction)","summary":"Reaction when targeted by a melee weapon attack: move to another space within 5 ft of the attacker without provoking opportunity attacks and impose disadvantage on that roll.","when":{"activeEffect":"Sokan Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"},"reactionKind":"standard","cadence":"unlimited"}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Soresu Form","description":"The first time you take kinetic, energy, or ion damage from a weapon before the end of your next turn, that damage is reduced by half.","mechanics":{"timing":"bonus","summary":"First kinetic, energy, or ion weapon damage taken before end of next turn is halved","duration":"Before end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Soresu Form","summary":"Bonus action: halve the first kinetic, energy, or ion weapon damage you take before the end of your next turn.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"contextualNote","surface":"defenses","title":"Soresu Form","text":"First kinetic, energy, or ion weapon damage taken before end of next turn is halved.","when":{"activeEffect":"Soresu Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Trakata Form","description":"As a part of the bonus action to adopt this form, you can flourish your weapon to attempt to distract an enemy you can see. Make a Dexterity (Sleight of Hand) or Charisma (Deception) check (your choice) contested by a Wisdom (Perception) check of one creature that you can see within 5 feet of you. On a success, that creature has disadvantage on the next attack roll it makes against you.","mechanics":{"timing":"bonus","summary":"Sleight of Hand/Deception against Perception (5 ft) → target's next attack against you has disadvantage","duration":"Instant (on adopt)"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Trakata Form","summary":"Bonus action: Sleight of Hand or Deception vs Perception of visible enemy within 5 ft; on success, target has disadvantage on its next attack roll against you.","durationSpec":{"anchor":"instant"},"cadence":"unlimited"}],"durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"name":"Trispzest Form","description":"Once before the start of your next turn, you have advantage on a melee weapon attack against a creature that is frightened of you.","mechanics":{"timing":"bonus","summary":"Once before next turn: advantage on a melee weapon attack against a creature frightened of you","duration":"Before start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Trispzest Form","summary":"Bonus action: once before start of next turn, gain advantage on a melee weapon attack against a creature frightened of you.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"contextualNote","surface":"attacks","title":"Trispzest Form","text":"Once before start of next turn, gain advantage on a melee weapon attack against a creature frightened of you.","when":{"activeEffect":"Trispzest Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"}}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Twilight Form","description":"As a part of the bonus action to adopt this form, you can mask yourself with the force to attempt to hide from an enemy you can see. Make a Dexterity (Stealth) check contested by a Wisdom (Perception) check of one creature that you can see within 5 feet of you. On a success, you become invisible to that creature until the start of your next turn, or until you attack, cast a power, or otherwise take a hostile action against it.","mechanics":{"timing":"bonus","summary":"Stealth against Perception (5 ft) → invisible to target until start of next turn or hostile action","duration":"Until start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Twilight Form","summary":"Bonus action: Stealth vs Perception of visible enemy within 5 ft; on success, invisible to it until start of next turn or until you attack/cast/act hostilely.","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"contextualNote","surface":"defenses","title":"Twilight Form","text":"Invisible to the target until the start of your next turn, or until you attack, cast a power, or otherwise take a hostile action against it.","when":{"activeEffect":"Twilight Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"}}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Vaapad Form","description":"Once before the start of your next turn, if you would have advantage on a melee weapon attack, you can choose to forgo the advantage. If you do so, you can make one melee weapon attack against the same target (no action required), also without advantage.","mechanics":{"timing":"bonus","summary":"Once before next turn: forgo advantage on a melee attack to make 1 free melee attack (no advantage)","duration":"Before start of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Vaapad Form","summary":"Bonus action: once before start of next turn, forgo advantage on a melee weapon attack to make one extra melee weapon attack against the same target (no action, without advantage).","durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"type":"contextualNote","surface":"attacks","title":"Vaapad Form","text":"Once before start of next turn, forgo advantage on a melee weapon attack to make one extra melee weapon attack against the same target without advantage (no action).","when":{"activeEffect":"Vaapad Form"},"durationSpec":{"anchor":"startOfOwnNextTurn"}}],"durationSpec":{"anchor":"startOfOwnNextTurn"},"cadence":"unlimited"},{"name":"Vonil Form","description":"If you took the Attack action before adopting this form, you can direct one of your allies to strike a creature you hit with an attack. Choose a friendly creature that can see or hear you and is within 5 feet of the creature you hit with an attack. That creature can immediately use its reaction to make one weapon attack against the same creature.","mechanics":{"timing":"bonus","summary":"After Attack action: ally within 5 ft of hit target uses reaction to make 1 weapon attack","duration":"Instant (after Attack action)"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Vonil Form","summary":"Bonus action (after Attack action): an ally within 5 ft of a creature you hit can use its reaction to make one weapon attack against that creature.","durationSpec":{"anchor":"instant"},"cadence":"unlimited"}],"durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"name":"Ysannanite Form","description":"As a part of the bonus action to adopt this form, if you took the Attack action, you can engage in Double- or Two-Weapon Fighting. \n\nAdditionally, until the end of your next turn, when making a ranged weapon attack while you are within 5 feet of a hostile creature, you do not have disadvantage on the attack roll.","mechanics":{"timing":"bonus","summary":"Engage Double-Weapon / Two-Weapon Fighting on adopt; no disadvantage on ranged weapon attacks within 5 ft","duration":"Until end of next turn"},"effects":[{"type":"actionGrant","zone":"bonus","name":"Ysannanite Form","summary":"Engage in Double- or Two-Weapon Fighting (if you took the Attack action); until end of next turn, no disadvantage on ranged weapon attacks within 5 ft of a hostile creature.","durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"},{"type":"combatTrait","kind":"noCloseRangedDisadv","note":"No disadvantage on ranged weapon attacks within 5 ft of a hostile creature","when":{"activeEffect":"Ysannanite Form"},"durationSpec":{"anchor":"endOfOwnNextTurn"}}],"durationSpec":{"anchor":"endOfOwnNextTurn"},"cadence":"unlimited"}];
