// Generated from sw5e_source/feat.json (hand-verified mechanics only)
const SW5E_FEATS = [
  {
    "name": "Ace Pilot",
    "prerequisite": null,
    "rules": "You're quite experienced both on land and in the air, be it from time in a navy, as a mercenary, or perhaps even piracy. You gain the following benefits:\n- Increase your Intelligence score by 1, to a maximum of 20.\n- You gain proficiency in the Piloting skill. If you are already proficient in it, you instead gain expertise in it. \n- Whenever you make an Intelligence (Investigation) or Wisdom (Perception) check related to vehicles or ships, you are considered to have expertise in the Investigation or Perception skill.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Piloting",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Investigation",
          "Perception"
        ],
        "mode": "expertise",
        "condition": "related to vehicles or ships"
      }
    ]
  },
  {
    "name": "Acrobat",
    "prerequisite": null,
    "rules": "You become more nimble, gaining the following benefits: \n- Increase your Dexterity score by 1, to a maximum of 20. \n- You gain proficiency in the Acrobatics skill. If you are already proficient in it, you instead gain expertise in it. \n- As a bonus action, you can make a DC 15 Dexterity (Acrobatics) check. If you succeed, difficult terrain doesn't cost you extra movement until the end of the current turn.",
    "attributes": [
      "Dexterity"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Acrobatics",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Nimble Footwork (Acrobat)",
        "summary": "Bonus action: DC 15 Dexterity (Acrobatics) check; on success, difficult terrain costs no extra movement until the end of the current turn.",
        "toggleEffect": {
          "name": "Nimble Footwork",
          "note": "Difficult terrain costs no extra movement"
        },
        "durationSpec": {
          "anchor": "endOfOwnTurn"
        },
        "cadence": "unlimited"
      },
      {
        "type": "speed",
        "mode": "walk",
        "ignoreDifficultTerrain": true,
        "when": {
          "activeEffect": "Nimble Footwork"
        },
        "note": "Difficult terrain costs no extra movement until end of turn."
      }
    ]
  },
  {
    "name": "Actor",
    "prerequisite": null,
    "rules": "Skilled at mimicry and dramatics, you gain the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person.\n- You can mimic the speech of another person or the sounds made by other creatures. You must have heard the person speaking, or heard the creature make the sound, for at least 1 minute. A successful Wisdom (Insight) check contested by your Charisma (Deception) check allows a listener to determine that the effect is faked.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Deception",
          "Performance"
        ],
        "mode": "advantage",
        "condition": "trying to pass yourself off as a different person"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Deception"
        ],
        "title": "Actor (Mimicry)",
        "text": "Mimic speech or sounds heard for at least 1 minute; a listener may contest with Wisdom (Insight) against your Charisma (Deception)."
      }
    ]
  },
  {
    "name": "Adaptable Fading",
    "prerequisite": "4th level",
    "rules": "You can easily overthrow an enemy's fortitude. You gain the following benefits:\n- Increase your Strength or Constitution score by 1, to a maximum of 20.\n- When you make an attack roll using your Strength, you can choose to add half your Constitution modifier to the attack roll. Alternatively, when you would make an attack roll using Constitution, you can add half your Strength modifier to the attack roll. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.\n- When an effect you control would call for a Strength saving throw, you can instead have it call for a Constitution saving throw. Alternatively, when an effect you control would call for a Constitution saving throw, you can instead have it call for a Strength saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Strength",
      "Constitution"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Adaptable Fading (Attack Boost)",
        "summary": "Add +{halfConMod} to a Strength attack roll, or +{halfStrMod} to a Constitution attack roll.",
        "resourceId": "adaptable_fading_attack"
      },
      {
        "type": "resourcePool",
        "id": "adaptable_fading_attack",
        "name": "Adaptable Fading (Attack)",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Adaptable Fading (Save Swap)",
        "summary": "Swap an effect you control between calling for a Strength saving throw and a Constitution saving throw.",
        "resourceId": "adaptable_fading_save"
      },
      {
        "type": "resourcePool",
        "id": "adaptable_fading_save",
        "name": "Adaptable Fading (Save Swap)",
        "max": "proficiency",
        "recharge": "long"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Alert",
    "prerequisite": null,
    "rules": "Always on the lookout for danger, you gain the following benefits:\n- You are proficient in Initiative checks..\n- You can't be surprised while you are conscious.\n- Other creatures don't gain advantage on attack rolls against you as a result of being unseen by you.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "initiativeMod",
        "proficiency": true
      },
      {
        "type": "combatTrait",
        "kind": "noSurprise",
        "note": "Cannot be surprised while conscious"
      },
      {
        "type": "combatTrait",
        "kind": "noUnseenAdvantage",
        "note": "Unseen creatures do not gain advantage on attack rolls against you"
      }
    ]
  },
  {
    "name": "Animal Handler",
    "prerequisite": null,
    "rules": "You master the techniques needed to train and handle animals. You gain the following benefits:\n- Increase your Wisdom score by 1, to a maximum of 20. \n- You gain proficiency in the Animal Handling skill. If you are already proficient in it, you instead gain expertise in it. \n- You can use a bonus action on your turn to command one friendly beast within 60 feet of you that can hear you and that isn't currently following the command of someone else. You decide now what action the beast will take and where it will move during its next turn, or you issue a general command that lasts for 1 minute, such as to guard a particular area.",
    "attributes": [
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Animal Handling",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Command Beast (Animal Handler)",
        "summary": "Bonus action: command one friendly beast within 60 ft that can hear you (specific next-turn action/move or 1-minute general command).",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "cadence": "unlimited"
      }
    ]
  },
  {
    "name": "Armor Expert",
    "prerequisite": null,
    "rules": "You've learned how to fluidly move in armor, gaining the following benefits:\n- Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n- You gain proficiency with light armor. If you are already proficient with light armor, instead while you are wearing light armor, your speed increases by 5 feet. \n- If you are already proficient in light armor when you take this feat, you also gain proficiency in medium armor. If you are already proficient with medium armor, instead while you are wearing medium armor, you can add 3, rather than 2, to your AC if you have a Dexterity of 16 or higher, and you ignore the bulky property of medium armor. \n- If you are already proficient in medium armor when you take this feat, you also gain proficiency in heavy armor. If you are already proficient with heavy armor, instead while you are wearing heavy armor, critical hits made against you are treated as normal hits.\n\nYou can take this feat multiple times.",
    "attributes": [
      "Strength",
      "Dexterity",
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "armorExpertProgressive",
        "note": "Progressive armor proficiency and mastery (Light, Medium, Heavy)"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Armor Expert (Progressive Mastery)",
        "text": "Light armor proficiency (or +5 ft speed in light armor); if already proficient in light armor, Medium armor proficiency (or +3 max Dexterity modifier with Dexterity 16+ and ignore Bulky in medium armor); if already proficient in medium armor, Heavy armor proficiency (or critical hits against you become normal hits in heavy armor)."
      }
    ],
    "repeatable": true
  },
  {
    "name": "Athlete",
    "prerequisite": null,
    "rules": "You have undergone extensive physical training to gain the following benefits:\n- Increase your Strength or Dexterity score by 1, to a maximum of 20.\n- When you are prone, standing up uses only 5 feet of your movement.\n- Climbing doesn't cost you extra movement.\n- You can make a running long jump or a running high jump after moving only 5 feet on foot, rather than 10 feet.",
    "attributes": [
      "Strength",
      "Dexterity"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "standFromProneFeet": 5,
        "climbNoExtraCost": true,
        "runningJumpFeet": 5,
        "note": "Standing from prone costs 5 ft; climbing costs no extra movement; running long/high jump requires only 5 ft."
      }
    ]
  },
  {
    "name": "Auditory Dampening",
    "prerequisite": null,
    "rules": "You've developed resilience against debilitating noises, gaining the following benefits:\n- Increase your Constitution, Intelligence, or Wisdom score by 1, to a maximum of 20.\n- While you are deafened, you can make ability checks that rely on hearing with disadvantage, instead of automatically failing them.\n- You have advantage on saving throws made to avoid sonic damage.",
    "attributes": [
      "Constitution",
      "Intelligence",
      "Wisdom"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding sonic damage"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Auditory Dampening",
        "text": "While deafened, make hearing-based ability checks with disadvantage instead of automatically failing."
      }
    ]
  },
  {
    "name": "Augmented Cyborg",
    "prerequisite": "Type beast or humanoid",
    "rules": "You've experimented with cybernetic augmentations, granting the following benefits: \n- Increase an ability score of your choice by 1, to a maximum of 20.\n- Choose one cybernetic augmentation of standard rarity from Appendix A. That augmentation is installed and doesn't count against the maximum cybernetic augmentations you can support, but it does count towards your total cybernetics augmentations as shown in the Cybernetic Augmentations Side Effects table in Chapter 7.",
    "attributes": [
      "Any"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "attunementMod",
        "modSlotDelta": 1,
        "note": "Install 1 standard cybernetic augmentation that does not count against max supported augmentations (still counts toward side effects)."
      }
    ],
    "requiresTargetKind": "cybernetics"
  },
  {
    "name": "Battle Scarred",
    "prerequisite": null,
    "rules": "You've spent a lifetime fighting, with the scars to prove it. You gain the following benefits:\n- Increase your Constitution score by 1, to a maximum of 20.\n- When you roll a 19 or a 20 on the d20 for a death saving throw, you regain 1 hit point. \n- When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. Once you've used this ability, you must complete a long rest before you can use it again.",
    "attributes": [
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Battle Scarred",
        "text": "Rolling 19 or 20 on a death saving throw regains 1 HP."
      },
      {"type": "zeroHpStopper", "name": "Relentless Endurance (Battle Scarred)", "mode": "auto", "resourceId": "battle_scarred_drop1", "note": "When reduced to 0 HP (not killed outright), drop to 1 HP instead (1/long rest)."},
      {
        "type": "resourcePool",
        "id": "battle_scarred_drop1",
        "name": "Battle Scarred (Drop to 1 HP)",
        "max": 1,
        "recharge": "long"
      }
    ]
  },
  {
    "name": "Blinding Agility",
    "prerequisite": "12th level, Dexterity 20",
    "rules": "You have the reflexes one who can see things before they happen, granting the following benefits:\n- You gain proficiency in Dexterity saving throws. If you are already proficient in them, you instead gain expertise in them.\n- Weapons that lack the two-handed or special properties are considered to have the finesse property for you.\n- Opportunity attacks made against you have disadvantage.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Dexterity",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "weaponRule",
        "kind": "finesseGrant",
        "params": {
          "excludeProperties": [
            "Two-Handed",
            "Special"
          ]
        }
      },
      {
        "type": "combatTrait",
        "kind": "oaDisadvantage",
        "note": "Opportunity attacks made against you have disadvantage"
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Bountiful Luck",
    "prerequisite": "4th level, Lucky feat",
    "rules": "Your people have extraordinary luck, which you have learned to lend to your companions when you see them falter. You're not sure how you do it; you just wish it, and it happens. Surely a sign of fortune's favor!\n\nWhen an ally you can see within 30 feet of you rolls a 1 on the d20 for an attack roll, an ability check, or a saving throw, you can use your reaction and expend 1 luck point to let the ally reroll the die. The ally must use the new roll. When you use this ability, you can't use luck points before the end of your next turn.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "resourceId": "luck",
        "sharedResource": true,
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "activeEffect": {
          "name": "Bountiful Luck (No Luck)",
          "note": "Cannot use luck points until end of your next turn"
        },
        "name": "Bountiful Luck",
        "summary": "Reaction (spend 1 luck point): when an ally within 30 ft rolls a 1 on an attack, check, or save, let them reroll (cannot use luck points until end of your next turn)."
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Brawny",
    "prerequisite": null,
    "rules": "You become stronger, gaining the following benefits: \n- Increase your Strength score by 1, to a maximum of 20. \n- You gain proficiency in the Athletics skill. If you are already proficient in it, you instead gain expertise in it. \n- Your carrying capacity and the weight you can push, drag, or lift doubles. If it would already double, it instead triples.",
    "attributes": [
      "Strength"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Athletics",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "sizeMod",
        "carryMultiplier": 2,
        "note": "Doubles carrying capacity (triples if already doubled)."
      }
    ]
  },
  {
    "name": "Casting Specialist",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "Choose one from force- or tech-casting. You've mastered your chosen casting type, gaining the following benefits:\n- You gain a +1 bonus to your force or tech save DC and your force or tech attack modifier.\n- Once per turn, when you cast a power that requires an attack roll or saving throw, you can have advantage on one attack roll, or you can force one creature affected by the power to have advantage or disadvantage on the saving throw (your choice). Once you've used this feature on a power, you can't affect that power again until you complete a short or long rest. Once you've used this feature on a creature, you can't do so again until you complete a short or long rest.\n- Once per turn, when you cast a power that doesn't require an ability check, attack roll, or saving throw, but requires a die roll, you can choose the maximum or minimum on the die (your choice). If the power requires rolling multiple dice, you can only affect a number of them equal to half your proficiency bonus (rounded up) in this way. Once you've used this feature on a power, you can't affect that power again until you complete a short or long rest.\n\nYou can select this feat twice. Each time you do so, you must choose a different casting type.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "castingMod",
        "powerType": "$choice",
        "dcBonus": 1,
        "attackBonus": 1,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "castingModifier",
        "kind": "note",
        "cadence": "oncePerTurn",
        "label": "Casting Specialist ($choice)",
        "text": "Once per turn on $choice powers: gain advantage on one attack roll or give one target advantage or disadvantage on its saving throw (once per short or long rest per power and per creature); or choose the maximum or minimum on up to {halfProfUp} dice for non-attack, non-save powers (once per short or long rest per power).",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "$choice"
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "cadence": "oncePerTurn",
        "title": "Casting Specialist ($choice)",
        "text": "Once per turn on $choice powers: advantage on one attack roll or advantage/disadvantage on one saving throw (once per short or long rest per power and creature); or choose max/min on up to {halfProfUp} dice for non-attack, non-save powers.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "$choice",
          "hideInCastDialog": true
        }
      }
    ],
    "repeatable": true,
    "choiceSpec": {
      "label": "Casting type",
      "options": [
        "Force",
        "Tech"
      ]
    },
    "maxCount": 2,
    "distinctChoice": true,
    "minLevel": 4
  },
  {
    "name": "Charmer",
    "prerequisite": null,
    "rules": "You've master the art of charming those around you, gaining the following benefits: \n- Increase your Charisma score by 1, to a maximum of 20. \n- You gain proficiency in the Persuasion skill. If you are already proficient in it, you instead gain expertise in it. \n- If you spend 1 minute talking to someone who can understand what you say, you can make a Charisma (Persuasion) check contested by the creature's Wisdom (Insight) check. If you or your companions are fighting the creature, your check automatically fails. If your check succeeds, the target is charmed by you as long as it remains within 60 feet of you and for 1 minute thereafter.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Persuasion",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Persuasion"
        ],
        "title": "Charmer",
        "text": "Spend 1 minute talking to a creature that understands you: Charisma (Persuasion) contested by target's Wisdom (Insight) (auto-fails if fighting) to charm it while within 60 feet and for 1 minute thereafter."
      }
    ]
  },
  {
    "name": "Chemical Buffer",
    "prerequisite": null,
    "rules": "You're able to neutralize caustic chemicals, mitigating their worst effects. You gain the following benefits:\n- Increase your Dexterity, Constitution, or Intelligence score by 1, to a maximum of 20.\n- You cannot be disintegrated, and you ignore the first corroded level you receive.\n- You have advantage on saving throws made to avoid acid damage.",
    "attributes": [
      "Dexterity",
      "Constitution",
      "Intelligence"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding acid damage"
      },
      {
        "type": "combatTrait",
        "kind": "noDisintegrate",
        "note": "Cannot be disintegrated; ignore the first corroded level received"
      },
      {
        "type": "combatTrait",
        "kind": "corrodedIgnore",
        "value": 1
      }
    ]
  },
  {
    "name": "Class Improvement",
    "prerequisite": "4th level",
    "rules": "You adopt a particular new application to your class, gaining the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- Choose one of the class improvement options, detailed later in this chapter. \n\nYou can take this feat multiple times.",
    "attributes": [
      "Any"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Class Improvement",
        "text": "Active class improvement: $choice.",
        "when": {
          "hasChoice": true
        }
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "classImprovement",
      "count": 1,
      "label": "Class Improvement"
    }
  },
  {
    "name": "Climber",
    "prerequisite": null,
    "rules": "You excel at scaling cliffsides, hills, trees, and general climbing. You gain the following benefits:\n- Increase your Strength score by 1, to a maximum of 20. \n- You gain a climbing speed equal to your movement speed.\n- You have advantage on ability checks and saving throws to avoid falling off or down while climbing. \n- You can spend 5 minutes instructing, pointing out handholds, and guiding other creatures before making a climb. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you. Each creature can add a 1d6 to any ability check or saving throw they make for that climb.",
    "attributes": [
      "Strength"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "speed",
        "mode": "climb",
        "base": "walk"
      },
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "avoiding falling off or down while climbing"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding falling off or down while climbing"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Athletics"
        ],
        "title": "Climber (Guide)",
        "text": "Spend 5 min instructing up to 6 friendly creatures within 30 ft: each adds 1d6 to ability checks and saving throws for that climb."
      }
    ]
  },
  {
    "name": "Close Quarters Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've practiced utilizing powers in close quarters, learning techniques that grant you the following benefits:\n- When making a ranged force or tech attack while you are within 5 feet of a hostile creature, you do not have disadvantage on the attack roll.  \n- Your ranged force and tech attacks ignore half cover and three-quarters cover against targets within 30 feet of you. \n- You learn one at-will power that requires an attack roll. Your casting ability for this at-will power depends on the power list you chose from: Wisdom or Charisma (depending on power alignment) for force powers or Intelligence for tech powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noCloseRangePowerDisadv",
        "note": "No disadvantage on ranged force or tech attacks while within 5 ft of a hostile creature"
      },
      {
        "type": "combatTrait",
        "kind": "ignorePowerCover",
        "note": "Ranged force and tech attacks ignore half and three-quarters cover against targets within 30 ft"
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Close Quarters Caster (Bonus At-Will)",
        "text": "Learn one at-will force or tech power requiring an attack roll (does not count against class powers known).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "castingModifier",
        "kind": "note",
        "label": "Close Quarters Caster",
        "text": "No disadvantage on ranged force or tech attacks within 5 ft; ignore half and three-quarters cover within 30 ft.",
        "castingScope": {
          "delivery": [
            "ranged_attack"
          ]
        }
      }
    ],
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "anyAtWillAttackPower",
      "count": 1,
      "label": "At-will Force or Tech power (attack roll)"
    }
  },
  {
    "name": "Combat Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've practiced making your powers more difficult to avoid, learning techniques that grant you the following benefits:\n- When a creature rolls a 1 on the d20 roll of a saving throw against a power you cast that deals damage, they instead take the highest number possible for the damage die.\n- You learn one at-will power that requires a saving throw. Your casting ability for this at-will power depends on the power list you chose from: Wisdom or Charisma (depending on power alignment) for force powers or Intelligence for tech powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "critMod",
        "scope": "power",
        "maxDamageOnSaveRoll": [
          1
        ]
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Combat Caster (Bonus At-Will)",
        "text": "Learn one at-will force or tech power requiring a saving throw (does not count against class powers known).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "castingModifier",
        "kind": "maxDamageOnNat1Save",
        "label": "Combat Caster",
        "text": "When a creature rolls a 1 on its saving throw against a damaging power you cast, it takes the maximum possible damage on the damage dice.",
        "castingScope": {
          "delivery": [
            "save"
          ],
          "hasDamage": true
        }
      }
    ],
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "anyAtWillSavePower",
      "count": 1,
      "label": "At-will Force or Tech power (saving throw)"
    }
  },
  {
    "name": "Commando",
    "prerequisite": null,
    "rules": "You've practiced fighting while prone, gaining the following benefits:\n- Increase your Dexterity score by 1, to a maximum of 20.\n- You gain a crawling speed equal to your movement speed.\n- While prone, you no longer have disadvantage on ranged attack rolls against targets within 30 feet due to being prone.\n- When you attempt to hide on your turn while prone, you can opt to not move on that turn. If you avoid moving, you are considered lightly obscured. You lose this benefit if you move or stand up, either voluntarily or because of some external effect. You are still automatically detected if any effect or action causes you to no longer be hidden. If you are still hidden on your next turn, you can continue to remain motionless and gain this benefit until you are detected.",
    "attributes": [
      "Dexterity"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "speed",
        "mode": "crawl",
        "base": "walk"
      },
      {
        "type": "combatTrait",
        "kind": "noProneCloseRangedDisadv",
        "note": "While prone, no disadvantage on ranged attacks within 30 ft due to being prone"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Stealth"
        ],
        "title": "Commando (Prone Concealment)",
        "text": "While hiding prone with 0 movement on your turn, you are lightly obscured until you move, stand, or are detected."
      }
    ]
  },
  {
    "name": "Companion Keeper",
    "prerequisite": "4th level",
    "rules": "You gain the services of a companion. Choose one of the companion nature options, detailed later in this chapter.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "companionGrant",
        "kind": "$choice",
        "name": "$choice Companion",
        "scalingNote": "Companion nature ($choice); scales with your character level and proficiency bonus (+{prof})."
      }
    ],
    "minLevel": 4,
    "choiceSpec": {
      "kind": "companion",
      "count": 1,
      "label": "Companion nature"
    }
  },
  {
    "name": "Competitor",
    "prerequisite": null,
    "rules": "You have a strong aptitude for competing. Select one gaming set. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain proficiency in the chosen gaming set. If you are already proficient with it, you instead gain expertise with it.\n- As long as you spend at least 1 minute using your gaming set, you can't have disadvantage on Intelligence checks you make to use the gaming set, Charisma (Deception) checks you make to bluff with the gaming set, or Wisdom (Insight) checks you make to read an opponent with whom you are competing with the gaming set.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different gaming set.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "tool",
        "target": "$choice",
        "rank": 1,
        "upgradeToExpertise": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Deception",
          "Insight"
        ],
        "mode": "noDisadvantage",
        "condition": "bluffing or reading an opponent after spending 1 min with chosen gaming set"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Competitor (Gaming Set)",
        "text": "After spending 1 min with your chosen gaming set ($choice), you cannot have disadvantage on Intelligence checks to use it, Charisma (Deception) checks to bluff with it, or Wisdom (Insight) checks to read an opponent."
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "extraChoiceSpec": {
      "kind": "gamingSet",
      "count": 1,
      "label": "Gaming set",
      "allowOwnedUpgrade": true
    }
  },
  {
    "name": "Crafter",
    "prerequisite": null,
    "rules": "You have a knack for crafting; you work with greater efficiency and produce goods of higher quality. Select one type of artisan's implements. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain proficiency with the chosen tool. If you are already proficient with it, you instead gain expertise with it.\n- When you craft something with the chosen tool, the total market value you can craft increases 50 cr per day. If you have expertise with it, the market value instead increases by 100 cr per day.\n- If you use the tool you've selected to practice a profession during downtime, you can support a lifestyle one higher than you would normally be able to.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different set of artisan's implements.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "tool",
        "target": "$choice",
        "rank": 1,
        "upgradeToExpertise": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Crafter (Downtime)",
        "text": "With chosen artisan's implements ($choice): crafting market value +50 cr/day (+100 cr/day with expertise); profession downtime supports one higher lifestyle tier."
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "extraChoiceSpec": {
      "kind": "artisanImplements",
      "count": 1,
      "label": "Artisan's implements",
      "allowOwnedUpgrade": true
    }
  },
  {
    "name": "Cunning Forcecaster",
    "prerequisite": "The ability to cast force powers",
    "rules": "You've discovered a clever avenue to your study of the Force. Choose one from Wisdom or Charisma. You gain the following benefits:\n- Increase your Intelligence score by 1, to a maximum of 20.\n- You can use Intelligence instead of the chosen ability as your forcecasting ability.\n- You can add Intelligence instead of the chosen ability when determining your maximum force points.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "castingMod",
        "powerType": "force",
        "abilityOverride": "Intelligence",
        "replaces": "$choice",
        "note": "Use Intelligence instead of chosen Wisdom or Charisma as your forcecasting ability and for maximum force points.",
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Cunning Forcecaster ($choice → Intelligence)",
        "text": "Use Intelligence instead of $choice as your forcecasting ability and for maximum force points.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "Force",
          "replacedAbility": "$choice"
        }
      }
    ],
    "choiceSpec": {
      "label": "Replaced ability",
      "options": [
        "Wisdom",
        "Charisma"
      ]
    }
  },
  {
    "name": "Cunning Intellect",
    "prerequisite": "12th level, Intelligence 20",
    "rules": "You have the cunning of the most prolific scholars, granting the following benefits:\n- You gain proficiency in Intelligence saving throws. If you are already proficient in them, you instead gain expertise in them.\n\n- When you engage in the Training downtime activity, during resolution, you add your proficiency bonus to the check. If you would already add your proficiency bonus, you instead add twice your proficiency bonus. If you would already add twice your proficiency bonus, you instead have advantage on the check.\n- Whenever you make an ability check that uses your Intelligence, you can add half your proficiency bonus (rounded down) if it doesn't already include your proficiency bonus. Additionally, if you roll lower than half your level (rounded down) on an Intelligence check, you can instead use your level for the d20 roll.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Intelligence",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "all",
        "rank": 0.5,
        "when": {
          "ability": "Intelligence"
        }
      },
      {
        "type": "rollFloor",
        "scope": "skill",
        "minRoll": "level",
        "condition": "Intelligence checks when d20 roll < {halfLevel} (use {level} instead)",
        "ability": "Intelligence",
        "triggerBelow": "halfLevel"
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Cunning Intellect (Training)",
        "text": "On Training downtime resolution checks, add your proficiency bonus (or twice your proficiency bonus if already proficient, or advantage if already twice)."
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Customized Droid",
    "prerequisite": "Type droid",
    "rules": "You've been customized beyond other droids of the same model, granting the following benefits: \n- Increase an ability score of your choice by 1, to a maximum of 20.\n- Choose one droid customization of standard rarity from Appendix A. That customization is installed and doesn't count against the maximum droid customizations you can support, but it does count towards your maximum parts or protocols, as appropriate.",
    "attributes": [
      "Any"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "attunementMod",
        "modSlotDelta": 1,
        "note": "Install 1 standard droid customization free of max-support cap (still counts toward parts/protocols)."
      }
    ]
  },
  {
    "name": "Double-Weapon Casting",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've learned to blend your prowess with twinblades with your casting. You gain the following benefits:\n- Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n- When you use your action to Cast a Power that calls for a weapon attack and attack with a weapon with the light and double properties while wielding it in two hands, you can use your bonus action to engage in Double-Weapon Fighting. All the rules of Double-Weapon Fighting still apply to you.",
    "attributes": [
      "Intelligence",
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Double-Weapon Casting Follow-Up",
        "summary": "After using Cast a Power that calls for a weapon attack with a light, double weapon wielded in two hands, use your bonus action to engage in Double-Weapon Fighting."
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Dual Focused Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You have learned to bifurcate your attention while concentrating on powers, learning techniques that grant you the following benefits:\n- If you attempt to cast a power that requires concentration while already concentrating on an existing power, you can maintain concentration on both powers simultaneously. You must spend your action each subsequent round on maintaining this concentration, or lose concentration for both powers.                              \n- At the end of each of your turns where you have two powers you are concentrating on, you must make a Constitution saving throw (DC equals 10 + the number of complete rounds you've been concentrating on two powers). On a failure, you lose concentration for both powers. You can drop concentration on one of your powers during your turn as a free action to avoid this saving throw.\n- Any time you would be forced to make a Constitution saving throw to maintain concentration due to taking damage, the DC equals 10 + both powers' levels combined, or half the damage you take, whichever number is higher. On a failure, you lose concentration on both powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "concentrationMod",
        "maxConcurrent": 2,
        "note": "Maintain concentration on two powers simultaneously (spend your Action each subsequent round; end-of-turn Constitution saving throw DC 10 + complete rounds, or drop one as a free action; damage Constitution saving throw DC max(10 + combined power levels, half damage); failing ends both).",
        "turnTriggers": [
          {
            "timing": "endOfTurn",
            "actor": "self",
            "kind": "repeatSave",
            "save": {
              "ability": "Constitution",
              "dcFormula": "10 + rounds"
            },
            "note": "Dual concentration: make a Constitution saving throw (DC 10 + complete rounds) or lose concentration on both powers (drop one as a free action to avoid)."
          }
        ]
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Dungeon Delver",
    "prerequisite": null,
    "rules": "Alert to the hidden traps and secret doors found in many dungeons, you gain the following benefits:\n- Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n- You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks made to detect the presence of secret doors.\n- You have advantage on saving throws made to avoid or resist traps.\n- You have resistance to the damage dealt by traps. \n- Traveling at a fast pace no longer imposes a -5 penalty to your passive Wisdom (Perception) score.",
    "attributes": [
      "Intelligence",
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception",
          "Investigation"
        ],
        "mode": "advantage",
        "condition": "detecting the presence of secret doors"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding or resisting traps"
      },
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "trap",
        "condition": "damage dealt by traps"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Perception"
        ],
        "title": "Dungeon Delver",
        "text": "Fast travel pace does not impose a −5 penalty to passive Perception."
      }
    ]
  },
  {
    "name": "Durable",
    "prerequisite": null,
    "rules": "Hardy and resilient, you gain the following benefits:\n- Increase your Constitution score by 1, to a maximum of 20.\n- When you roll a Hit Die to regain hit points, the minimum number of hit points you can regain from the roll equals twice your Constitution modifier (minimum of 2).\n- Your hit point maximum increases by an amount equal to twice your level when you gain this feat. Whenever you gain a level thereafter, your hit point maximum increases by an additional 2 hit points.",
    "attributes": [
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "hpMod",
        "perLevel": 2,
        "hitDieMin": "max(2, 2*CON_mod)"
      }
    ]
  },
  {
    "name": "Dutifully Deployed",
    "prerequisite": null,
    "rules": "You've developed an aptitude for a particular deployment on a starship. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain 1 rank in a deployment of your choice. This rank does not count towards or affect your prestige.\n- The maximum number of ranks you can gain in deployments increases by 1. You can still only gain 5 ranks in a deployment.",
    "attributes": [
      "Any"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Dutifully Deployed ($choice)",
        "text": "Gain +1 rank in $choice deployment (does not count toward prestige) and +1 maximum total deployment ranks (maximum 5 ranks in any deployment).",
        "when": {
          "hasChoice": true
        }
      }
    ],
    "extraChoiceSpec": {
      "kind": "deployment",
      "count": 1,
      "label": "Starship deployment"
    }
  },
  {
    "name": "Electrical Grounding",
    "prerequisite": null,
    "rules": "You're able to avoid the brunt of electric shocks. You gain the following benefits:\n- Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n- At the start of each of your turns while shocked, you can choose to have a reaction, or you can choose to be able to take both an action and a bonus action on your turn.\n- You have advantage on saving throws made to avoid lightning damage.",
    "attributes": [
      "Intelligence",
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding lightning damage"
      },
      {
        "type": "combatTrait",
        "kind": "shockedReactionChoice",
        "note": "At the start of each turn while shocked, choose to keep your reaction or take both an action and a bonus action.",
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "note": "While shocked, choose to keep your reaction or take both an action and a bonus action."
          }
        ]
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Electrical Grounding",
        "text": "While shocked, at the start of your turn choose to keep your reaction or take both an action and a bonus action."
      }
    ]
  },
  {
    "name": "Empathic",
    "prerequisite": null,
    "rules": "You possess keen insight into how other people think and feel. You gain the following benefits: \n- Increase your Wisdom score by 1, to a maximum of 20. \n- You gain proficiency in the Insight skill. If you are already proficient in it, you instead gain expertise in it. \n- You can use your action to try to get uncanny insight about one humanoid you can see within 30 feet of you. Make a Wisdom (Insight) check contested by the target's Charisma (Deception) check. On a success, you have advantage on attack rolls and ability checks against the target until the end of your next turn.",
    "attributes": [
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Insight",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Uncanny Insight (Empathic)",
        "summary": "Action: Wisdom (Insight) contested by Charisma (Deception) of one humanoid within 30 feet; on success, advantage on attack rolls and ability checks against it until the end of your next turn.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "toggleEffect": {
          "name": "Uncanny Insight",
          "note": "Advantage on attack rolls and ability checks against the target humanoid"
        }
      }
    ]
  },
  {
    "name": "Entertainer",
    "prerequisite": null,
    "rules": "You have a natural gift for performing. Select one musical instrument. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain proficiency in the chosen musical instrument. If you are already proficient with it, you instead gain expertise with it.\n- While playing your chosen musical instrument, you can always readily read the emotions of those paying attention to you. During this time, and for up to one minute after completing, you have advantage on Wisdom (Insight) checks to read the emotions of those you performed for.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different musical instrument.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "tool",
        "target": "$choice",
        "rank": 1,
        "upgradeToExpertise": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Insight"
        ],
        "mode": "advantage",
        "condition": "reading the emotions of creatures you performed for with $choice (and for 1 minute after)"
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "extraChoiceSpec": {
      "kind": "musicalInstrument",
      "count": 1,
      "label": "Musical instrument",
      "allowOwnedUpgrade": true
    }
  },
  {
    "name": "Exalted Awareness",
    "prerequisite": "12th level, Wisdom 20",
    "rules": "You have the wisdom associated with the most renowned masters of the Force, granting the following benefits:\n- You gain proficiency in Wisdom saving throws. If you are already proficient in them, you instead gain expertise in them.\n- Creatures within 60 feet of you have disadvantage on Dexterity (Stealth) checks made to hide from you.\n- As an action, you can sense the presence of illusions and other effects designed to deceive the senses within 30 feet of you, provided that you aren't blinded or deafened. You sense that an effect is trying to trick you, but you gain no insight into what is hidden or its true nature. Once you've used this feature, you must complete a short or long rest before you can use it again.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Wisdom",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "combatTrait",
        "kind": "antiStealthAura",
        "note": "Creatures within 60 feet have disadvantage on Dexterity (Stealth) checks made to hide from you"
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Sense Illusions (Exalted Awareness)",
        "summary": "Action (if not blinded or deafened): sense the presence of illusions and sensory deception within 30 feet.",
        "resourceId": "exalted_awareness_sense",
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "notConditions": [
            "Blinded",
            "Deafened"
          ]
        }
      },
      {
        "type": "resourcePool",
        "id": "exalted_awareness_sense",
        "name": "Exalted Awareness (Sense Illusions)",
        "max": 1,
        "recharge": "short"
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Exotic Weapon Training",
    "prerequisite": null,
    "rules": "Mastery of simple and martial weapons has unlocked new potential for you. You gain the following benefits:\n- Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n- You gain proficiency in three exotic weapons. You must have proficiency in all simple and martial weapons in the exotic weapon's category to gain proficiency in it. If the exotic has modes that would fall in two different weapon categories, you require proficiency all simple and martial weapons in both categories in order to gain proficiency in that exotic.",
    "attributes": [
      "Strength",
      "Dexterity",
      "Constitution"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Exotic Weapon Training",
        "text": "Proficiency in 3 chosen exotic weapons (requires all simple and martial proficiencies in each exotic weapon's category and all modal weapon categories)."
      }
    ],
    "choiceSpec": {
      "kind": "exoticWeapons",
      "count": 3,
      "label": "Exotic weapons (choose 3)"
    }
  },
  {
    "name": "Fanatic",
    "prerequisite": "4th level",
    "rules": "Every blow that hits your enemies make you feel closer to victory, making you shake in excitement. You gain the following benefits:\n- When you score a critical hit with an attack roll or reduce a creature to 0 hit points, you can make one weapon attack as a bonus action.\n- Whenever a creature you can see within 30 feet is reduced to 0 hit points, you go into a fervor gaining temporary hit points equal to 1d4 + your Constitution modifier.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "cadence": "unlimited",
        "name": "Fervor Strike (Fanatic)",
        "summary": "Bonus action: make one weapon attack when you score a critical hit or reduce a creature to 0 HP."
      },
      {
        "type": "hpMod",
        "trigger": "creatureDropsTo0",
        "tempHPFormula": "1d4 + Constitution modifier",
        "condition": "whenever a creature you can see within 30 ft drops to 0 HP"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Feigned Confidence",
    "prerequisite": null,
    "rules": "You've spent years pretending you know what you're doing, gaining the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- When you would make an ability check with a skill or tool that doesn't add your proficiency bonus, you can first make a DC 15 Charisma (Deception) check. On a success, you can add your proficiency bonus to the initial ability check. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses when you finish a short or long rest.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Feigned Confidence",
        "summary": "Before making a non-proficient skill or tool check, make a DC 15 Charisma (Deception) check; on a success, add your proficiency bonus (+{prof}) to the initial check.",
        "resourceId": "feigned_confidence",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "feigned_confidence",
        "name": "Feigned Confidence",
        "max": "proficiency",
        "recharge": "short"
      }
    ]
  },
  {
    "name": "Fighting Master",
    "prerequisite": "4th level",
    "rules": "You've mastered a particular style of fighting. Choose one of the fighting mastery options, detailed later in this chapter. You can take this feat multiple times.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingMastery",
        "count": 1
      }
    ],
    "repeatable": true,
    "minLevel": 4,
    "distinctChoice": true,
    "choiceSpec": {
      "kind": "fightingMastery",
      "count": 1,
      "label": "Fighting Mastery"
    }
  },
  {
    "name": "Fighting Stylist",
    "prerequisite": "4th level",
    "rules": "You adopt a particular style of fighting as your specialty, gaining the following benefits:\n- Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n- Choose one of the fighting style options, detailed later in this chapter. \n\nYou can take this feat multiple times.",
    "attributes": [
      "Strength",
      "Dexterity",
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      }
    ],
    "repeatable": true,
    "minLevel": 4,
    "distinctChoice": true,
    "choiceSpec": {
      "kind": "fightingStyle",
      "count": 1,
      "label": "Fighting Style"
    }
  },
  {
    "name": "Flexible Rending",
    "prerequisite": "4th level",
    "rules": "You are adept at overwhelming an opponent's reflexes. You gain the following benefits:\n- Increase your Dexterity or Intelligence score by 1, to a maximum of 20.\n- When you make an attack roll using your Dexterity, you can choose to add half your Intelligence modifier to the attack roll. Alternatively, when you would make an attack roll using Intelligence, you can add half your Dexterity modifier to the attack roll. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.\n- When an effect you control would call for a Dexterity saving throw, you can instead have it call for a Intelligence saving throw. Alternatively, when an effect you control would call for a Intelligence saving throw, you can instead have it call for a Dexterity saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Dexterity",
      "Intelligence"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Flexible Rending (Attack Boost)",
        "summary": "Add +{halfIntMod} to a Dexterity attack roll, or +{halfDexMod} to an Intelligence attack roll.",
        "resourceId": "flexible_rending_attack"
      },
      {
        "type": "resourcePool",
        "id": "flexible_rending_attack",
        "name": "Flexible Rending (Attack)",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Flexible Rending (Save Swap)",
        "summary": "Swap an effect you control between calling for a Dexterity saving throw and an Intelligence saving throw.",
        "resourceId": "flexible_rending_save"
      },
      {
        "type": "resourcePool",
        "id": "flexible_rending_save",
        "name": "Flexible Rending (Save Swap)",
        "max": "proficiency",
        "recharge": "long"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Force Frustrater",
    "prerequisite": null,
    "rules": "You've practiced techniques to resist being manipulated by the Force. You gain the following benefits:\n- Increase your Strength, Wisdom, or Charisma score by 1, to a maximum of 20.\n- When a creature attempts to move you against your will using a force power, the maximum distance it can move you is halved.\n- You have advantage on saving throws made to avoid force damage.",
    "attributes": [
      "Strength",
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding force damage"
      },
      {
        "type": "combatTrait",
        "kind": "halfForceForcedMove",
        "note": "Forced movement distance inflicted on you by force powers is halved"
      }
    ]
  },
  {
    "name": "Force Guidance",
    "prerequisite": "The ability to cast force powers",
    "rules": "You've learned to utilize your gift with the Force in a specific, unique way. You gain the following benefits\n- Increase your Wisdom or Charisma score by 1, to a maximum of 20. \n- Choose a skill or tool in which you are proficient. When you make an ability check with the chosen skill or tool, you can add half your Wisdom or Charisma modifier (your choice, minimum of one) to the check if it doesn't already include that modifier. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses when you complete a long rest.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different skill or tool.",
    "attributes": [
      "Wisdom",
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Force Guidance",
        "summary": "Add +{halfForceMod} (half your Wisdom or Charisma modifier, minimum 1) to a chosen proficient skill or tool check that does not already include that modifier.",
        "resourceId": "force_guidance"
      },
      {
        "type": "resourcePool",
        "id": "force_guidance",
        "name": "Force Guidance",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "$choice"
        ],
        "mode": "bonus",
        "condition": "when not already using that modifier (spend 1 Force Guidance use)",
        "when": {
          "hasChoice": true
        },
        "valueFormula": "halfForceMod"
      }
    ],
    "repeatable": true,
    "choiceSpec": {
      "label": "Proficient skill or tool",
      "options": "proficientSkillsOrTools"
    },
    "distinctChoice": true
  },
  {
    "name": "Force of Personality",
    "prerequisite": null,
    "rules": "Rooms never go unalerted to your presence, and the strength of your personality make others lose focus on their own social game. Powers and other effects infrequently override your force of will. You gain the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- You can use your Charisma modifier instead of your Wisdom modifier when making Insight checks.\n- When you would make a Wisdom saving throw, you can instead make a Charisma saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "skillAbilityOverride",
        "skill": "Insight",
        "ability": "Charisma",
        "mode": "highest"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Force of Personality (Save Swap)",
        "summary": "When you would make a Wisdom saving throw, make a Charisma saving throw instead.",
        "resourceId": "force_of_personality_save",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "force_of_personality_save",
        "name": "Force of Personality (Charisma for Wisdom Save)",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "abilities": [
          "Wisdom"
        ],
        "title": "Force of Personality",
        "text": "You may make a Charisma saving throw instead of a Wisdom saving throw ({prof} uses per long rest)."
      }
    ]
  },
  {
    "name": "Force-Sensitive",
    "prerequisite": "Type humanoid",
    "rules": "You know two at-will force powers. When you reach 3rd level, you learn one 1st-level force power, which you can cast once per long rest. When you reach 5th level, you learn one 2nd-level force power, which you can once per long rest. Your forcecasting ability is Wisdom or Charisma (depending on power alignment). Additionally, you lose the Force-Insensitive special trait if you have it.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Force-Sensitive",
        "text": "Know two at-will force powers; at 3rd level learn one 1st-level force power (once per long rest); at 5th level learn one 2nd-level force power (once per long rest). Forcecasting ability is Wisdom or Charisma by alignment. Removes Force-Insensitive.",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_force_sensitive_l1",
        "name": "Force-Sensitive (1st-Level Cast)",
        "max": 1,
        "recharge": "long",
        "when": {
          "minLevel": 3
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_force_sensitive_l2",
        "name": "Force-Sensitive (2nd-Level Cast)",
        "max": 1,
        "recharge": "long",
        "when": {
          "minLevel": 5
        }
      },
      {
        "type": "combatTrait",
        "kind": "removeForceInsensitive",
        "note": "Lose the Force-Insensitive special trait"
      }
    ],
    "choiceSpec": {
      "kind": "forcePowers",
      "label": "Force powers",
      "atWillCount": 2,
      "leveledSlots": [
        {
          "level": 1,
          "minLevel": 3,
          "poolId": "feat_force_sensitive_l1"
        },
        {
          "level": 2,
          "minLevel": 5,
          "poolId": "feat_force_sensitive_l2"
        }
      ]
    }
  },
  {
    "name": "Forceful Vigor",
    "prerequisite": null,
    "rules": "Your strength and virility rarely go unnoticed, often to the point of distraction. You gain the following benefits:\n- Increase your Strength score by 1, to a maximum of 20.\n- You can use your Strength modifier instead of your Constitution modifier when making Constitution checks.\n- When you would make a Constitution saving throw, you can instead make a Strength saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Strength"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Forceful Vigor",
        "text": "You can use your Strength modifier instead of your Constitution modifier when making Constitution checks."
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Forceful Vigor (Save Swap)",
        "summary": "When making a Constitution saving throw, make a Strength saving throw instead.",
        "resourceId": "forceful_vigor_save",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "forceful_vigor_save",
        "name": "Forceful Vigor (Strength for Constitution Save)",
        "max": "proficiency",
        "recharge": "long"
      }
    ]
  },
  {
    "name": "Formfighting Dabbler",
    "prerequisite": "The ability to cast force powers",
    "rules": "You've dabbled in the basics of the known forms of lightsaber combat. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You learn one lightsaber form, detailed later in this chapter. If you already know at least one lightsaber form, you instead learn three lightsaber forms. If you already know at least three lightsaber forms, you instead learn seven lightsaber forms. If you already know at least ten lightsaber forms, you instead learn the remaining forms.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "lightsaberForm",
        "count": 1,
        "upgradeThresholds": [
          {
            "ownedAtLeast": 1,
            "count": 3
          },
          {
            "ownedAtLeast": 3,
            "count": 7
          },
          {
            "ownedAtLeast": 10,
            "count": "remaining"
          }
        ],
        "note": "Learn 1 lightsaber form (or 3 if already know at least 1, 7 if at least 3, or all remaining if at least 10)."
      }
    ]
  },
  {
    "name": "Galvanizing Presence",
    "prerequisite": null,
    "rules": "Your presence on the battlefield is a source of inspiration. You gain the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- As a bonus action, you let out a rallying war cry, ending the frightened or charmed condition on yourself and a number of allies that can hear you equal to your Charisma modifier (minimum of one). Once you've used this ability, you must complete a short or long rest before you can use it again.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Rallying War Cry (Galvanizing Presence)",
        "summary": "Bonus action: end the frightened or charmed condition on yourself and up to {chaModMin1} allies who can hear you.",
        "resourceId": "galvanizing_presence",
        "clearConditions": [
          "Charmed",
          "Frightened"
        ],
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "galvanizing_presence",
        "name": "Galvanizing Presence",
        "max": 1,
        "recharge": "short"
      }
    ]
  },
  {
    "name": "Greater Force-Sensitive",
    "prerequisite": "The ability to cast 3rd-level force powers",
    "rules": "You know one at-will force power. Additionally, you know one 4th-level force power, which you can cast once per long rest. Your forcecasting ability is Wisdom or Charisma (depending on power alignment).",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Greater Force-Sensitive",
        "text": "Know one at-will force power and one 4th-level force power (castable once per long rest; Wisdom or Charisma by alignment).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_gtr_force_sensitive_l4",
        "name": "Greater Force-Sensitive (4th-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "forcePowers",
      "label": "Force powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 4,
          "minLevel": 1,
          "poolId": "feat_gtr_force_sensitive_l4"
        }
      ]
    }
  },
  {
    "name": "Greater Tech Dabbler",
    "prerequisite": "The ability to cast 3rd-level tech powers",
    "rules": "You know one at-will tech power. Additionally, you know one 4th-level tech power, which you can cast once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for these powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Greater Tech Dabbler",
        "text": "Know one at-will tech power and one 4th-level tech power (castable once per long rest; Intelligence, requires a wristpad).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_gtr_tech_dabbler_l4",
        "name": "Greater Tech Dabbler (4th-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "techPowers",
      "label": "Tech powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 4,
          "minLevel": 1,
          "poolId": "feat_gtr_tech_dabbler_l4"
        }
      ]
    }
  },
  {
    "name": "Haggler",
    "prerequisite": null,
    "rules": "Your skills at bartering have granted you the following benefits:\n- Increase your Charisma score by 1 up to a maximum of 20. \n- You have advantage on Charisma (Persuasion) and Charisma (Deception) checks when attempting to barter or trade. \n- You are always aware of the current monetary value for any unenhanced or common enhanced item. Whenever you identify an item, you gain a rough estimate of its current monetary value.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Persuasion",
          "Deception"
        ],
        "mode": "advantage",
        "condition": "attempting to barter or trade"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Investigation"
        ],
        "title": "Haggler (Appraisal)",
        "text": "Always aware of the current monetary value of unenhanced or common enhanced items; gain a rough estimate whenever you identify an item."
      }
    ]
  },
  {
    "name": "Healer",
    "prerequisite": null,
    "rules": "You are an able medic, allowing you to mend wounds quickly and get your allies back in the fight. You gain the following benefits:\n- Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n- When you use a traumakit to stabilize a dying creature, that creature also regains 1 hit point.\n- As an action, you can spend one use of a traumakit to tend to a creature and restore 1d6 + 4 hit points to it, plus additional hit points equal to the creature's maximum number of Hit Dice. The creature can't regain hit points again in this way until it finishes a short or long rest.",
    "attributes": [
      "Intelligence",
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Battlefield Medicine (Healer)",
        "summary": "Action (1 traumakit use): restore 1d6 + 4 + target's max Hit Dice HP (1/short or long rest per target); stabilizing with a traumakit also restores 1 HP.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Heat Shielded",
    "prerequisite": null,
    "rules": "You can tolerate extremely hot temperatures. You gain the following benefits:\n- Increase your Dexterity, Consitution, or Intelligence score by 1, to a maximum of 20.\n- You have advantage on Constitution saving throws made to avoid exhaustion due to extreme heat, and you can use your bonus action to end the ignited condition on yourself, instead of your action.\n- You have advantage on saving throws made to avoid fire damage.",
    "attributes": [
      "Dexterity",
      "Constitution",
      "Intelligence"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Constitution"
        ],
        "mode": "advantage",
        "condition": "avoiding exhaustion due to extreme heat"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding fire damage"
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Extinguish Self (Heat Shielded)",
        "summary": "Bonus action: end the ignited condition on yourself (instead of an action).",
        "effect": "clearConditions",
        "clearConditions": [
          "Ignited"
        ],
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Improved Force-Sensitive",
    "prerequisite": "The ability to cast 2nd-level force powers",
    "rules": "You know one at-will force power. Additionally, you know one 3rd-level force power, which you can cast once per long rest. Your forcecasting ability is Wisdom or Charisma (depending on power alignment).",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Improved Force-Sensitive",
        "text": "Know one at-will force power and one 3rd-level force power (castable once per long rest; Wisdom or Charisma by alignment).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_imp_force_sensitive_l3",
        "name": "Improved Force-Sensitive (3rd-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "forcePowers",
      "label": "Force powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 3,
          "minLevel": 1,
          "poolId": "feat_imp_force_sensitive_l3"
        }
      ]
    }
  },
  {
    "name": "Improved Tech Dabbler",
    "prerequisite": "The ability to cast 2nd-level tech powers",
    "rules": "You know one at-will tech power. Additionally, you know one 3rd-level tech power, which you can cast once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for these powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Improved Tech Dabbler",
        "text": "Know one at-will tech power and one 3rd-level tech power (castable once per long rest; Intelligence, requires a wristpad).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_imp_tech_dabbler_l3",
        "name": "Improved Tech Dabbler (3rd-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "techPowers",
      "label": "Tech powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 3,
          "minLevel": 1,
          "poolId": "feat_imp_tech_dabbler_l3"
        }
      ]
    }
  },
  {
    "name": "Inspiring Leader",
    "prerequisite": "Charisma 13",
    "rules": "You can spend 10 minutes inspiring your companions, shoring up their resolve to fight. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you and who can understand you. Each creature can gain temporary hit points equal to your level + your Charisma modifier. A creature can't gain temporary hit points from this feat again until it has finished a short or long rest.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Inspiring Speech (Inspiring Leader)",
        "summary": "10-minute speech: up to 6 friendly creatures within 30 ft gain {levelPlusCha} temporary HP (1/short or long rest per creature).",
        "effect": "applyTempHP",
        "amountFormula": "levelPlusCha",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Investigative Attunement",
    "prerequisite": "4th level",
    "rules": "You've spent a significant amount of time appraising and testing enhanced items. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- Your maximum attunement increases by 1.\n- You have advantage on ability checks made to identify items.\n- Once per long rest, you can choose one object that you must touch for 10 minutes. If it is an enhanced or modified item, you learn its properties and how to use them, whether it requires attunement to use, and how many charges it has, if any. You learn whether any powers are affecting the item and what they are. If the item was created by a power, you learn which power created it.",
    "attributes": [
      "Any"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "attunementMod",
        "slotDelta": 1
      },
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "identifying items"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Identify Object (Investigative Attunement)",
        "summary": "10-min touch: learn all properties, attunement, charges, and active or creating powers on an enhanced or modified item.",
        "resourceId": "investigative_attunement",
        "cadence": "oncePerLongRest",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "investigative_attunement",
        "name": "Investigative Attunement (Identify)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Investigator",
    "prerequisite": null,
    "rules": "You have an eye for detail and can pick out the smallest clues. You gain the following benefits: \n- Increase your Intelligence score by 1, to a maximum of 20. \n- You gain proficiency in the Investigation skill. If you are already proficient in it, you instead gain expertise in it. \n- You can take the Search action as a bonus action.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Investigation",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Search (Investigator)",
        "summary": "Take the Search action as a bonus action.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Keen Mind",
    "prerequisite": null,
    "rules": "You have a mind that can track time, direction, and detail with uncanny precision. You gain the following benefits.\n- Increase your Intelligence score by 1, to a maximum of 20.\n- You always know which way is north.\n- You always know the number of hours left before the next sunrise or sunset.\n- You can accurately recall anything you have seen or heard within the past month.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Keen Mind",
        "text": "Always know north, hours until next sunrise or sunset, and accurately recall anything seen or heard within the past month."
      }
    ]
  },
  {
    "name": "Linguist",
    "prerequisite": null,
    "rules": "You have studied languages and codes, gaining the following benefits:\n- Increase your Intelligence score by 1, to a maximum of 20.\n- You learn three languages of your choice.\n- You can ably create written ciphers. Others can't decipher a code you create unless you teach them, they succeed on an Intelligence check (DC = your Intelligence score + your proficiency bonus), or they use a power to decipher it.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Linguist",
        "text": "Learn 3 languages of your choice; create written ciphers (DC {intScorePlusProf} Intelligence check, Intelligence score + proficiency bonus, to decipher)."
      }
    ],
    "extraChoiceSpec": {
      "kind": "languages",
      "count": 3,
      "label": "Languages (choose 3)"
    }
  },
  {
    "name": "Loremaster",
    "prerequisite": null,
    "rules": "Your study of history rewards you with the following benefits: \n- Increase your Intelligence score by 1, to a maximum of 20. \n- You gain proficiency in the Lore skill. If you are already proficient in it, you instead gain expertise in it. \n- When you take the Help action to aid another creature's ability check, you can make a DC 15 Intelligence (Lore) check. On a success, that creature's check gains a bonus equal to your proficiency bonus, as you share pertinent advice and historical examples. To receive this bonus, the creature must be able to understand what you're saying.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Lore",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Historical Advice (Loremaster)",
        "summary": "When taking the Help action for an ally's ability check, make a DC 15 Intelligence (Lore) check to add +{prof} to their check.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Lucky",
    "prerequisite": "4th level",
    "rules": "You have inexplicable luck that seems to kick in at just the right moment.\n\nYou have 3 luck points. Whenever you make an attack roll, an ability check, or a saving throw, you can spend one luck point to roll an additional d20. You can choose to spend one of your luck points after you roll the die, but before the outcome is determined. You choose which of the d20s is used for the attack roll, ability check, or saving throw.\n\nYou can also spend one luck point when an attack roll is made against you. Roll a d20, and then choose whether the attack uses the attacker's roll or yours. If more than one creature spends a luck point to influence the outcome of a roll, the points cancel each other out; no additional dice are rolled.\n\nYou regain your expended luck points when you finish a long rest.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "resourcePool",
        "id": "luck",
        "name": "Luck Points",
        "max": 3,
        "recharge": "long"
      },
      {
        "type": "rerollRule",
        "scope": "d20",
        "trigger": "spend 1 luck point",
        "condition": "roll extra d20 on your attack/check/save or against an attack targeting you"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Mariner",
    "prerequisite": null,
    "rules": "You've spent an exorbitant amount of time in water. You gain the following benefits:\n- Increase your Constitution score by 1, to a maximum of 20.\n- You gain a swimming speed equal to your movement speed.\n- You have advantage on a ability checks and saving throws related to swimming.\n- You can hold your breath for a number of minutes equal to 1 + twice your Constitution modifier.",
    "attributes": [
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "speed",
        "mode": "swim",
        "base": "walk"
      },
      {
        "type": "conditionalCheckMod",
        "skills": "all",
        "mode": "advantage",
        "condition": "related to swimming"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "related to swimming"
      },
      {
        "type": "biologyRule",
        "kind": "holdBreath",
        "note": "Hold breath for 1 + 2 × Constitution modifier minutes."
      }
    ]
  },
  {
    "name": "Master Force-Sensitive",
    "prerequisite": "The ability to cast 4th-level force powers",
    "rules": "You know one at-will force power. Additionally, you know one 5th-level force power, which you can cast once per long rest. Your forcecasting ability is Wisdom or Charisma (depending on power alignment).",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Master Force-Sensitive",
        "text": "Know one at-will force power and one 5th-level force power (castable once per long rest; Wisdom or Charisma by alignment).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_mst_force_sensitive_l5",
        "name": "Master Force-Sensitive (5th-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "forcePowers",
      "label": "Force powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 5,
          "minLevel": 1,
          "poolId": "feat_mst_force_sensitive_l5"
        }
      ]
    }
  },
  {
    "name": "Master Tech Dabbler",
    "prerequisite": "The ability to cast 4th-level tech powers",
    "rules": "You know one at-will tech power. Additionally, you know one 5th-level tech power, which you can cast once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for these powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Master Tech Dabbler",
        "text": "Know one at-will tech power and one 5th-level tech power (castable once per long rest; Intelligence, requires a wristpad).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_mst_tech_dabbler_l5",
        "name": "Master Tech Dabbler (5th-Level Cast)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "choiceSpec": {
      "kind": "techPowers",
      "label": "Tech powers",
      "atWillCount": 1,
      "leveledSlots": [
        {
          "level": 5,
          "minLevel": 1,
          "poolId": "feat_mst_tech_dabbler_l5"
        }
      ]
    }
  },
  {
    "name": "Medic",
    "prerequisite": null,
    "rules": "You master the physician's arts, gaining the following benefits: \n- Increase your Wisdom score by 1, to a maximum of 20. \n- You gain proficiency in the Medicine skill. If you are already proficient in it, you instead gain expertise in it. \n- During a short rest, you can clean and bind the wounds of up to six willing beasts and humanoids. Make a DC 15 Wisdom (Medicine) check for each creature. On a success, if a creature spends a Hit Die during this rest, that creature can forgo the roll and instead regain the maximum number of hit points the die can restore. A creature can do so only once per rest, regardless of how many Hit Dice it spends.",
    "attributes": [
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Medicine",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Medic (Short Rest Care)",
        "text": "During a short rest, DC 15 Wisdom (Medicine) check per creature (up to 6) lets each maximize 1 Hit Die roll.",
        "restKind": "short"
      }
    ]
  },
  {
    "name": "Metabolic Tolerance",
    "prerequisite": null,
    "rules": "You've developed resilience against many poisons, gaining the following benefits:\n- Increase your Constitution, Intelligence, or Charisma score by 1, to a maximum of 20.\n- As an action or bonus action, you can expend a Hit Die to end the poisoned condition on yourself.\n- You have advantage on saving throws made to avoid poison damage.",
    "attributes": [
      "Constitution",
      "Intelligence",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding poison damage"
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Purge Poison (Metabolic Tolerance)",
        "summary": "Action or bonus action: expend 1 Hit Die to end the poisoned condition on yourself.",
        "effect": "spendHitDieClear",
        "clearConditions": [
          "Poisoned"
        ],
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Mindful Meditator",
    "prerequisite": null,
    "rules": "You've learned meditation techniques to calm your mind. You gain the following benefits:\n- Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n- You only need 3 hours of sleep during a long rest to gain its benefits, instead of 6. Additionally, if your long rest would be interrupted, you only need to complete the long rest instead of restarting it to gain its benefits.\n- You have advantage on saving throws made to avoid psychic damage.",
    "attributes": [
      "Intelligence",
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding psychic damage"
      },
      {
        "type": "biologyRule",
        "kind": "restMod",
        "note": "Need only 3 hours of sleep for a long rest; interrupted long rests resume without restarting"
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "restKind": "long",
        "title": "Mindful Meditator",
        "text": "Need only 3 hours of sleep for a long rest; interrupted long rests resume without restarting."
      }
    ]
  },
  {
    "name": "Mobile",
    "prerequisite": "4th level",
    "rules": "You are exceptionally speedy and agile. You gain the following benefits:\n- Your speed increases by 10 feet.\n- When you use the Dash action, difficult terrain doesn't cost you extra movement on that turn.\n- When you make a melee attack against a creature, you don't provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "bonus": 10
      },
      {
        "type": "combatTrait",
        "kind": "mobileSkirmish",
        "note": "Dash ignores difficult terrain this turn; making a melee attack prevents opportunity attacks from that creature for the rest of the turn"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Mounted Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You are trained in the use of powers while mounted. While you are mounted and aren't incapacitated, you gain the following benefits:\n- When you cast a power targeting yourself, you can also affect your mount with the power.\n- You have advantage on melee force or tech attack rolls against any unmounted creature that is smaller than your mount.\n- If your mount is subjected to an effect that allows it to make a Dexterity saving throw to take only half damage, it instead takes no damage if it succeeds on the saving throw, and only half damage if it fails.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Mounted Caster",
        "text": "While mounted and not incapacitated: self-targeted powers can also affect your mount; advantage on melee force or tech attack rolls against unmounted creatures smaller than your mount; your mount takes no damage on successful Dexterity saving throws for half damage and half on failures.",
        "when": {
          "notConditions": [
            "Incapacitated"
          ]
        },
        "castingScope": {
          "powerType": "all"
        }
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Multiclass Improvement",
    "prerequisite": "4th level",
    "rules": "You've learned to blend the skills of your different classes. Choose two of the multiclass improvement options, detailed later in this chapter. You can take this feat multiple times.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Multiclass Improvement",
        "text": "Active multiclass improvements: $choice.",
        "when": {
          "hasChoice": true
        }
      }
    ],
    "repeatable": true,
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "multiclassImprovements",
      "count": 2,
      "label": "Multiclass Improvements (choose 2)"
    }
  },
  {
    "name": "Muscled Menace",
    "prerequisite": "Strength 13, size Medium",
    "rules": "Despite being of otherwise average size, your might extends beyond that of your peers. You gain the following benefits:\n- Increase your Strength score by 1, to a maximum of 20.\n- Your speed increases by 5 feet.\n- You can't add more than +3 when determining your bonus to AC from your Dexterity.\n- You can't add more than +3 when determing your bonus to Dexterity saving throws from Dexterity.\n- You gain the Oversized special trait: ***Oversized.*** Light- and vibro-weapons that lack the dexterity or light property are considered to have the heavy property for you. The strength number for blasters is reduced by one step (from 19 to 17, 17 to 15, 15 to 13, or 13 to 11). If the strength number is 11, you ignore it entirely.",
    "attributes": [
      "Strength"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "bonus": 5
      },
      {
        "type": "combatTrait",
        "kind": "dexCap3",
        "note": "Maximum +3 Dexterity bonus to AC and Dexterity saving throws"
      },
      {
        "type": "combatTrait",
        "kind": "oversized",
        "note": "Oversized: lightweapons and vibroweapons lacking dexterity or light count as Heavy; blaster Strength requirement reduced by 1 step (ignore 11)"
      }
    ]
  },
  {
    "name": "Naturalist",
    "prerequisite": null,
    "rules": "Your extensive study of nature rewards you with the following benefits: \n- Increase your Intelligence score by 1, to a maximum of 20. \n- You gain proficiency in the Nature skill. If you are already proficient in it, you instead gain expertise in it. \n- You learn the *toxin scan* tech power. You can cast it once, using supplies scavenged around you, without the use of a wristpad and without spending tech points, and you regain the ability to do so when you finish a long rest.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Nature",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "grantPower",
        "power": "Toxin Scan",
        "powerType": "tech",
        "countsAgainstKnown": false,
        "freeCasts": 1,
        "recharge": "long",
        "note": "Cast without a wristpad using scavenged supplies."
      }
    ]
  },
  {
    "name": "Observant",
    "prerequisite": null,
    "rules": "Quick to notice details of your environment, you gain the following benefits:\n- Increase your Intelligence or Wisdom score by 1, to a maximum of 20.\n- If you can see a creature's mouth while it is speaking a language you understand, you can interpret what it's saying by reading its lips.\n- You are considered to have advantage when determining your passive Wisdom (Perception) and passive Intelligence (Investigation) scores.",
    "attributes": [
      "Intelligence",
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "passiveMod",
        "skill": "Perception",
        "bonus": 5
      },
      {
        "type": "passiveMod",
        "skill": "Investigation",
        "bonus": 5
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Perception"
        ],
        "title": "Observant (Lip Reading)",
        "text": "Read lips of any creature speaking a language you understand if you can see its mouth."
      }
    ]
  },
  {
    "name": "Overwhelming Presence",
    "prerequisite": "12th level, Charisma 20",
    "rules": "You have the presence of the most affluent of leaders, granting the following benefits:\n- You gain proficiency in Charisma saving throws. If you are already proficient in them, you instead gain expertise in them.\n- While you are conscious, up to five friendly creatures within 30 feet of you who can see or hear you and who can understand you can gain a bonus to one Intelligence, Wisdom, or Charisma saving throw they make equal to your Charisma modifier. Once they've done so, they can't do so again until they finish a short or long rest.\n- As an action, you can attempt to distract up to five creatures you can see within 30 feet of you. Each creature must make a Wisdom saving throw (DC = 8 + your proficiency bonus + your Charisma modifier). Any creature immune to being charmed is unaffected. If you or your companions are fighting a creature, it has advantage on the saving throw. On a failed save, for the next minute, a creature has disadvantage on Wisdom (Perception) checks made to perceive any creature other than you until the effect ends or until the target can no longer see or hear you. This ends early if you are incapacitated or die.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Charisma",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "title": "Overwhelming Presence (Aura)",
        "text": "While conscious, up to 5 friendly creatures within 30 feet who can see or hear and understand you can add +{chaMod} (Charisma modifier) to one Intelligence, Wisdom, or Charisma saving throw (once per short or long rest per ally).",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Distract (Overwhelming Presence)",
        "summary": "Action: up to 5 creatures within 30 feet make a Wisdom saving throw (DC {dcCHA}; charm-immune unaffected; advantage if fighting you or allies) or have disadvantage on Wisdom (Perception) checks to perceive anyone other than you for 1 minute (ends early if incapacitated).",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Distract (Overwhelming Presence)",
          "note": "Up to 5 creatures within 30 feet (Wisdom save DC {dcCHA}) have disadvantage on Perception to perceive anyone other than you; ends early if incapacitated"
        },
        "when": {
          "notConditions": [
            "Incapacitated"
          ]
        }
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Perceptive",
    "prerequisite": null,
    "rules": "You hone your senses until they become razor sharp. You gain the following benefits: \n- Increase your Wisdom score by 1, to a maximum of 20. \n- You gain proficiency in the Perception skill. If you are already proficient in it, you instead gain expertise in it. \n- Being in a lightly obscured area doesn't impose disadvantage on your Wisdom (Perception) checks if you can both see and hear.",
    "attributes": [
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Perception",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception"
        ],
        "mode": "noDisadvantage",
        "condition": "in a lightly obscured area while able to see and hear"
      }
    ]
  },
  {
    "name": "Performer",
    "prerequisite": null,
    "rules": "You master performance so that you can command any stage. You gain the following benefits: \n- Increase your Charisma score by 1, to a maximum of 20. \n- You gain proficiency in the Performance skill. If you are already proficient in it, you instead gain expertise in it. \n- While performing, you can try to distract one humanoid you can see who can see and hear you. Make a Charisma (Performance) check contested by the humanoid's Wisdom (Insight) check. If your check succeeds, you grab the humanoid's attention enough that it makes Wisdom (Perception) and Intelligence (Investigation) checks with disadvantage until you stop performing.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Performance",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Performance"
        ],
        "title": "Performer (Distract)",
        "text": "While performing, contest Charisma (Performance) against a humanoid's Wisdom (Insight): on success, target has disadvantage on Wisdom (Perception) and Intelligence (Investigation) checks until you stop performing."
      }
    ]
  },
  {
    "name": "Power Adept",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "When you gain this feat, choose one of the following damage types: acid, cold, fire, force, lightning, or necrotic. Powers you cast ignore resistance to damage of the chosen type. In addition, when you roll damage for a power you cast that deals damage of that type, you can treat any 1 on a damage die as a 2.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different damage type.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Power Adept ($choice)",
        "text": "Your $choice powers ignore resistance and treat any 1 rolled on damage dice as a 2.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "damageTypes": [
            "$choice"
          ],
          "hasDamage": true,
          "hideInCastDialog": true
        }
      },
      {
        "type": "castingModifier",
        "kind": "dieFloor",
        "minDieValue": 2,
        "ignoreResistance": true,
        "label": "Power Adept ($choice)",
        "text": "Ignores $choice resistance; treat any 1 rolled on $choice damage dice as a 2.",
        "castingScope": {
          "damageTypes": [
            "$choice"
          ],
          "hasDamage": true
        },
        "when": {
          "hasChoice": true
        }
      }
    ],
    "repeatable": true,
    "choiceSpec": {
      "kind": "damageType",
      "label": "Damage type",
      "options": [
        "acid",
        "cold",
        "fire",
        "force",
        "lightning",
        "necrotic"
      ]
    },
    "maxCount": 6,
    "distinctChoice": true,
    "minLevel": 4
  },
  {
    "name": "Power Channeling",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "Choose one from force- or tech-casting. You've learned to cast powers of the chosen type with greater deliberation. Choose a number of powers you know of 1st level or higher equal to half your proficiency bonus. When you cast one of the chosen powers, you can choose to spend an additional minute casting the power for each level of the power. If you do so, the cost of the power is reduced by half the number of points. Casting a power in this way requires concentration (explained in chapter 10). If your concentration is broken, the power dissipates without taking effect. \n\nWhenever you gain a level in a class with casting of the chosen type, you can replace one of the chosen powers with another power of 1st level or higher you know.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "channelHalfCost",
        "powerType": "$choice",
        "minLevel": 1,
        "label": "Power Channeling ($choice)",
        "text": "Spend +1 minute per power level (requires concentration) to halve the point cost of a chosen channeled power.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "$choice",
          "minLevel": 1,
          "hideInCastDialog": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Power Channeling ($choice)",
        "text": "Channel up to {halfProf} known 1st-level or higher $choice powers: spend +1 minute per power level (requires concentration) to halve the point cost; swap one chosen power on level-up.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "$choice",
          "minLevel": 1
        }
      }
    ],
    "choiceSpec": {
      "label": "Casting type",
      "options": [
        "Force",
        "Tech"
      ]
    },
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "knownLeveledPowers",
      "countFormula": "halfProf",
      "minCount": 1,
      "label": "Channeled powers"
    }
  },
  {
    "name": "Practiced",
    "prerequisite": null,
    "rules": "You have acquired skills over your career, gaining the following benefits: \n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain proficiency in any combination of two skills or tools of your choice.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Practiced",
        "text": "Proficiency in any combination of two chosen skills or tools."
      }
    ],
    "extraChoiceSpec": {
      "kind": "skillsOrTools",
      "count": 2,
      "label": "Skills or tools (choose 2)"
    }
  },
  {
    "name": "Promising Commander",
    "prerequisite": null,
    "rules": "You've trained relentless to lead your allies on the field of battle, gaining the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- As an action, you can gain tactical insight. For one minute, once per turn you can utter a special command or warning whenever an ally you can see within 30 feet makes an attack roll or saving throw. This creature can add a d4 to the roll provided it can hear and understand you. A creature can only benefit from one such die at a time. Once you've used this feature, you must complete a short or long rest before you can use it again.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Tactical Insight (Promising Commander)",
        "summary": "Action: for 1 minute, once per turn grant an ally you can see within 30 feet +1d4 to an attack roll or saving throw (maximum 1 such die at a time).",
        "resourceId": "promising_commander",
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Tactical Insight",
          "note": "Once per turn, grant an ally within 30 feet +1d4 to an attack roll or saving throw (maximum 1 die at a time)"
        }
      },
      {
        "type": "resourcePool",
        "id": "promising_commander",
        "name": "Promising Commander",
        "max": 1,
        "die": "d4",
        "recharge": "short"
      }
    ]
  },
  {
    "name": "Quick Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've practiced casting powers in quick succession, learning techniques that grant you the following benefits:\n- When you cast a power with a casting time of a bonus action, you may use your action to cast a power with a power level no higher than half your proficiency bonus (rounded down).\n- When you cast a power with a casting time of a bonus action, you can cast it without expending force or tech points as long as it is no higher level than your proficiency bonus. Once you've used this feature, you must complete a long rest before you can use it again.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Quick Caster",
        "text": "When casting a bonus-action power, you may use your action to cast a power of level up to {halfProf}; once per long rest, cast a bonus-action power (level ≤ {prof}) without spending points.",
        "castingScope": {
          "castingPeriod": "BonusAction"
        }
      },
      {
        "type": "castingModifier",
        "kind": "freeBonusActionCast",
        "resourceId": "quick_caster_free_ba",
        "maxLevelFormula": "proficiency",
        "label": "Quick Caster (Free)",
        "text": "Once per long rest, cast a bonus-action power (level ≤ {prof}) without expending force or tech points.",
        "castingScope": {
          "castingPeriod": "BonusAction",
          "minLevel": 1,
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "quick_caster_free_ba",
        "name": "Quick Caster (Free Bonus-Action Power)",
        "max": 1,
        "recharge": "long"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Quick-Fingered",
    "prerequisite": null,
    "rules": "Your nimble fingers and agility let you perform sleight of hand. You gain the following benefits: \n- Increase your Dexterity score by 1, to a maximum of 20. \n- You gain proficiency in the Sleight of Hand skill. If you are already proficient in it, you instead gain expertise in it. \n- As a bonus action, you can make a Dexterity (Sleight of Hand) check to plant something on someone else, conceal an object on a creature, lift a purse, or take something from a pocket.",
    "attributes": [
      "Dexterity"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Sleight of Hand",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Quick-Fingered (Sleight of Hand)",
        "summary": "Bonus action: make a Dexterity (Sleight of Hand) check to plant, conceal, lift a purse, or pick a pocket.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ]
  },
  {
    "name": "Quick-Witted",
    "prerequisite": null,
    "rules": "Great ideas come to you naturally, often when your life depends on it. You always have a plan, or at least parts of it. You gain the following benefits:\n- Increase your Intelligence score by 1, to a maximum of 20.\n- You can use your Intelligence modifier instead of your Dexterity modifier when making Initiative checks.\n- When you would make a Dexterity saving throw, you can instead make an Intelligence saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "initiativeMod",
        "abilityOverride": "Intelligence",
        "mode": "highest"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Quick-Witted (Save Swap)",
        "summary": "When you would make a Dexterity saving throw, make an Intelligence saving throw instead.",
        "resourceId": "quick_witted_save",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "quick_witted_save",
        "name": "Quick-Witted (Intelligence for Dexterity Save)",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "abilities": [
          "Dexterity"
        ],
        "title": "Quick-Witted",
        "text": "You may make an Intelligence saving throw instead of a Dexterity saving throw ({prof} uses per long rest)."
      }
    ]
  },
  {
    "name": "Resilient",
    "prerequisite": "4th level",
    "rules": "Choose one ability score. You gain the following benefits:\n- Increase the chosen ability score by 1, to a maximum of 20.\n- You gain proficiency in saving throws using the chosen ability.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "abilityBonus",
        "ability": "$choice",
        "value": 1,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "proficiency",
        "kind": "save",
        "target": "$choice",
        "rank": 1,
        "when": {
          "hasChoice": true
        }
      }
    ],
    "choiceSpec": {
      "kind": "savingThrow",
      "label": "Saving throw ability",
      "options": [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma"
      ]
    },
    "minLevel": 4
  },
  {
    "name": "Savage Shorty",
    "prerequisite": "Strength 13, size Small",
    "rules": "Despite being short of stature, your size has no impact on your strength and virility. You gain the following benefits:\n- Increase your Strength score by 1, to a maximum of 20.\n- Your speed increases by 5 feet.\n- You lose the Undersized special trait.",
    "attributes": [
      "Strength"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "bonus": 5
      },
      {
        "type": "combatTrait",
        "kind": "removeUndersized",
        "note": "Lose the Undersized special trait"
      }
    ]
  },
  {
    "name": "Shard Modification",
    "prerequisite": "Type droid",
    "rules": "You are specially modified droid used to house a shard. Shards are sentient crystals native to the planet Orax, roughly a foot in length, that communicate with each other through pulses of light. While inhabiting a specialized droid host, shards are able to overcome the droid's inability to wield the Force, granting the following benefits:\n\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You lose the Force-Insensitive special trait.\n- You can cast the *sense force* force power once per day. Wisdom or Charisma (your choice) is your forcecasting ability for this power.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "removeForceInsensitive",
        "note": "Lose the Force-Insensitive special trait"
      },
      {
        "type": "grantPower",
        "power": "Sense Force",
        "powerType": "force",
        "countsAgainstKnown": false,
        "freeCasts": 1,
        "recharge": "long",
        "castingAbility": "Wisdom or Charisma"
      }
    ]
  },
  {
    "name": "Silver-Tongued",
    "prerequisite": null,
    "rules": "You develop your conversational skill to better deceive others. You gain the following benefits: \n- Increase your Charisma score by 1, to a maximum of 20. \n- You gain proficiency in the Deception skill. If you are already proficient in it, you instead gain expertise in it. \n- When you take the Attack action, you can replace one attack with an attempt to deceive one humanoid you can see within 30 feet of you that can see and hear you. Make a Charisma (Deception) check contested by the target's Wisdom (Insight) check. If your check succeeds, your movement doesn't provoke opportunity attacks from the target and your attack rolls against it have advantage; both benefits last until the end of your next turn or until you use this ability on a different target. If your check fails, the target can't be deceived by you in this way for 1 hour.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Deception",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Feint (Silver-Tongued)",
        "summary": "Replace one attack during the Attack action: Charisma (Deception) contested by Wisdom (Insight) of a humanoid within 30 feet; on success, no opportunity attacks from it and advantage on attack rolls against it until the end of your next turn (or until used on another target); failure blocks 1 hour.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "toggleEffect": {
          "name": "Silver-Tongued Feint",
          "note": "No opportunity attacks from target and advantage on attack rolls against it (ends if used on another target)"
        }
      }
    ]
  },
  {
    "name": "Snappy Interjection",
    "prerequisite": null,
    "rules": "You've mastered a quick tongue to aid your allies. You gain the following benefits:\n- Increase your Charisma score by 1, to a maximum of 20.\n- Once per short or long rest, when an ally makes an attack roll, an ability check or a saving throw, you can spend your reaction to give them advantage on the roll.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Snappy Interjection",
        "summary": "Reaction: when an ally makes an attack roll, ability check, or saving throw, give them advantage on the roll.",
        "resourceId": "snappy_interjection",
        "reactionKind": "standard",
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "resourcePool",
        "id": "snappy_interjection",
        "name": "Snappy Interjection",
        "max": 1,
        "recharge": "short"
      }
    ]
  },
  {
    "name": "Sniping Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've practiced casting powers more accurately from long range, learning techniques that give you the following benefits:\n- When you cast a power that requires you to make an attack roll, the power's range is doubled.\n- Your ranged force and tech attacks ignore one-quarter, half, and three-quarters cover.\n- You learn one at-will power that requires an attack roll. Your casting ability for this at-will power depends on the power list you chose from: Wisdom or Charisma (depending on power alignment) for force powers or Intelligence for tech powers.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "snipingCaster",
        "note": "Double range on attack-roll powers; ranged force and tech attacks ignore one-quarter, half, and three-quarters cover"
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Sniping Caster (Bonus At-Will)",
        "text": "Learn one at-will force or tech power requiring an attack roll (does not count against class powers known).",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "castingModifier",
        "kind": "note",
        "label": "Sniping Caster",
        "text": "Range is doubled on attack-roll powers; ranged force and tech attacks ignore one-quarter, half, and three-quarters cover.",
        "castingScope": {
          "delivery": [
            "attack"
          ]
        }
      }
    ],
    "minLevel": 4,
    "extraChoiceSpec": {
      "kind": "anyAtWillAttackPower",
      "count": 1,
      "label": "At-will Force or Tech power (attack roll)"
    }
  },
  {
    "name": "Specialist",
    "prerequisite": null,
    "rules": "You have focused training with a specific tool. Select one type of specialist's kit. You gain the following benefits:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- You gain proficiency with the chosen kit. If you are already proficient with it, you instead gain expertise with it. \n- You can attempt ability checks with the chosen kit without the kit present, but you have disadvantage on the check when you do so.\n- Whenever you make an ability check with the chosen kit and you don't have disadvantage on the check, you can treat a d20 roll of 9 or lower as a 10, as long as you spend at least 1 minute on the check.\n\nYou can take this feat multiple times. Each time you do so, you must choose a different specialist's kit.",
    "attributes": [
      "Any"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "tool",
        "target": "$choice",
        "rank": 1,
        "upgradeToExpertise": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "rollFloor",
        "scope": "tool",
        "minRoll": 10,
        "target": "$choice",
        "condition": "spending at least 1 minute with chosen specialist's kit without disadvantage"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Specialist",
        "text": "With chosen specialist's kit ($choice): attempt checks without kit at disadvantage; treat a d20 roll of 9 or lower as 10 when spending at least 1 minute without disadvantage."
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "extraChoiceSpec": {
      "kind": "specialistKit",
      "count": 1,
      "label": "Specialist's kit",
      "allowOwnedUpgrade": true
    }
  },
  {
    "name": "Spiritual Techcaster",
    "prerequisite": "The ability to cast tech powers",
    "rules": "You've developed a transcendent approach to your tech prowess. Choose one from Wisdom or Charisma. You gain the following benefits:\n- Increase the chosen ability score by 1, to a maximum of 20.\n- You can use the chosen ability instead of Intelligence as your techcasting ability.\n- You can add the chosen ability instead of Intelligence when determining your maximum tech points.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "abilityBonus",
        "ability": "$choice",
        "value": 1,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "castingMod",
        "powerType": "tech",
        "abilityOverride": "$choice",
        "note": "Use chosen Wisdom or Charisma instead of Intelligence as your techcasting ability and for maximum tech points.",
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Spiritual Techcaster ($choice)",
        "text": "Use $choice instead of Intelligence as your techcasting ability and for maximum tech points.",
        "when": {
          "hasChoice": true
        },
        "castingScope": {
          "powerType": "Tech"
        }
      }
    ],
    "choiceSpec": {
      "label": "Techcasting ability",
      "options": [
        "Wisdom",
        "Charisma"
      ]
    }
  },
  {
    "name": "Splashclass Improvement",
    "prerequisite": "4th level",
    "rules": "You've learned to blend the skills of your different classes. Choose one of the splashclass improvement options, detailed later in this chapter. You can take this feat multiple times.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Splashclass Improvement",
        "text": "Active splashclass improvement: $choice.",
        "when": {
          "hasChoice": true
        }
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "minLevel": 4,
    "choiceSpec": {
      "kind": "class",
      "count": 1,
      "label": "Splashclass Improvement"
    }
  },
  {
    "name": "Stealthy",
    "prerequisite": null,
    "rules": "You know how best to hide, gaining the following benefits: \n- Increase your Dexterity score by 1, to a maximum of 20. \n\n- You gain proficiency in the Stealth skill. If you are already proficient in it, you instead gain expertise in it. \n- If you are hidden, you can move up to 10 feet in the open without revealing yourself if you end the move in a position where you're not clearly visible.",
    "attributes": [
      "Dexterity"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Stealth",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Stealth"
        ],
        "title": "Stealthy",
        "text": "While hidden, move up to 10 feet in the open without revealing yourself if you end not clearly visible."
      }
    ]
  },
  {
    "name": "Supreme Accuracy",
    "prerequisite": "4th level; Dexterity, Intelligence, Wisdom, or Charisma 13",
    "rules": "You have uncanny aim with attacks that rely on precision. You gain the following benefits:\n- Increase your Dexterity, Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n- Whenever you have advantage on an attack roll using Dexterity, Intelligence, Wisdom, or Charisma you can reroll one of the dice once.",
    "attributes": [
      "Dexterity",
      "Intelligence",
      "Wisdom",
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "rerollRule",
        "scope": "attack",
        "trigger": "advantage",
        "condition": "attack rolls using Dexterity, Intelligence, Wisdom, or Charisma (reroll one d20 once)",
        "abilities": [
          "Dexterity",
          "Intelligence",
          "Wisdom",
          "Charisma"
        ]
      },
      {
        "type": "castingModifier",
        "kind": "note",
        "label": "Supreme Accuracy",
        "text": "When you have advantage on a power attack roll using Dexterity, Intelligence, Wisdom, or Charisma, reroll one d20 once.",
        "castingScope": {
          "delivery": [
            "attack"
          ]
        }
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Supreme Aptitude",
    "prerequisite": "4th level; Strength, Dexterity, Constitution, or Intelligence 13",
    "rules": "You have uncanny skill with a preternatural focus. You gain the following benefits:\n- Increase your Strength, Dexterity, Constitution, or Intelligence score by 1, to a maximum of 20.\n- Whenever you have advantage on an ability check using Strength, Dexterity, Constitution, or Intelligence you can reroll one of the dice once.",
    "attributes": [
      "Strength",
      "Dexterity",
      "Constitution",
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "rerollRule",
        "scope": "skill",
        "trigger": "advantage",
        "condition": "ability checks using Strength, Dexterity, Constitution, or Intelligence (reroll one d20 once)",
        "abilities": [
          "Strength",
          "Dexterity",
          "Constitution",
          "Intelligence"
        ]
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Supreme Durability",
    "prerequisite": "4th level; Strength, Constitution, Wisdom, or Charisma 13",
    "rules": "You have uncanny resilience of both body and mind. You gain the following benefits:\n- Increase your Strength, Constitution, Wisdom, or Charisma score by 1, to a maximum of 20.\n- Whenever you have advantage on a saving throw using Strength, Constitution, Wisdom, or Charisma you can reroll one of the dice once.",
    "attributes": [
      "Strength",
      "Constitution",
      "Wisdom",
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "rerollRule",
        "scope": "save",
        "trigger": "advantage",
        "condition": "saving throws using Strength, Constitution, Wisdom, or Charisma (reroll one d20 once)",
        "abilities": [
          "Strength",
          "Constitution",
          "Wisdom",
          "Charisma"
        ]
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Survivalist",
    "prerequisite": null,
    "rules": "You master wilderness lore, gaining the following benefits: \n- Increase your Wisdom score by 1, to a maximum of 20. \n- You gain proficiency in the Survival skill. If you are already proficient in it, you instead gain expertise in it. \n- You learn the *alarm* tech power. You can cast it once, using supplies scavenged around you, without the use of a wristpad and without spending tech points, and you regain the ability to do so when you finish a long rest.",
    "attributes": [
      "Wisdom"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Survival",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "grantPower",
        "power": "Alarm",
        "powerType": "tech",
        "countsAgainstKnown": false,
        "freeCasts": 1,
        "recharge": "long",
        "note": "Cast without a wristpad using scavenged supplies."
      }
    ]
  },
  {
    "name": "Tech Dabbler",
    "prerequisite": null,
    "rules": "You know two at-will tech powers. When you reach 3rd level, you learn and can cast one 1st-level tech power once per long rest. When you reach 5th level, you learn and can cast one 2nd-level tech power once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for these powers. Additionally, you lose the Tech-Impaired special trait if you have it.",
    "attributes": null,
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Tech Dabbler",
        "text": "Know two at-will tech powers; at 3rd level learn one 1st-level tech power (once per long rest); at 5th level learn one 2nd-level tech power (once per long rest). Techcasting ability is Intelligence and requires a wristpad. Removes Tech-Impaired.",
        "castingScope": {
          "hideInCastDialog": true
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_tech_dabbler_l1",
        "name": "Tech Dabbler (1st-Level Cast)",
        "max": 1,
        "recharge": "long",
        "when": {
          "minLevel": 3
        }
      },
      {
        "type": "resourcePool",
        "id": "feat_tech_dabbler_l2",
        "name": "Tech Dabbler (2nd-Level Cast)",
        "max": 1,
        "recharge": "long",
        "when": {
          "minLevel": 5
        }
      },
      {
        "type": "combatTrait",
        "kind": "removeTechImpaired",
        "note": "Lose the Tech-Impaired special trait"
      }
    ],
    "choiceSpec": {
      "kind": "techPowers",
      "label": "Tech powers",
      "atWillCount": 2,
      "leveledSlots": [
        {
          "level": 1,
          "minLevel": 3,
          "poolId": "feat_tech_dabbler_l1"
        },
        {
          "level": 2,
          "minLevel": 5,
          "poolId": "feat_tech_dabbler_l2"
        }
      ]
    }
  },
  {
    "name": "Techie",
    "prerequisite": null,
    "rules": "You master the theory and practice of technology, gaining the following benefits: \n- Increase your Intelligence score by 1, to a maximum of 20. \n- You gain proficiency in the Technology skill. If you are already proficient in it, you instead gain expertise in it. \n- You learn the *repair droid* tech power. You can cast it once, using supplies scavenged around you, without the use of a wristpad and without spending tech points, and you regain the ability to do so when you finish a long rest.",
    "attributes": [
      "Intelligence"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Technology",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "grantPower",
        "power": "Repair Droid",
        "powerType": "tech",
        "countsAgainstKnown": false,
        "freeCasts": 1,
        "recharge": "long",
        "note": "Cast without a wristpad using scavenged supplies."
      }
    ]
  },
  {
    "name": "Threatening",
    "prerequisite": null,
    "rules": "You become fearsome to others, gaining the following benefits: \n- Increase your Charisma score by 1, to a maximum of 20. \n- You gain proficiency in the Intimidation skill. If you are already proficient in it, you instead gain expertise in it. \n- When you take the Attack action, you can replace one attack with an attempt to demoralize one humanoid you can see within 30 feet of you that can see and hear you. Make a Charisma (Intimidation) check contested by the target's Wisdom (Insight) check. If your check succeeds, the target is frightened until the end of your next turn. If your check fails, the target can't be frightened by you in this way for 1 hour.",
    "attributes": [
      "Charisma"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "Intimidation",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Demoralize (Threatening)",
        "summary": "Replace one attack during the Attack action: Charisma (Intimidation) contested by Wisdom (Insight) of a humanoid within 30 feet; on success, target is frightened until the end of your next turn; failure blocks 1 hour.",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "toggleEffect": {
          "name": "Demoralize",
          "note": "Target humanoid is frightened until the end of your next turn"
        }
      }
    ]
  },
  {
    "name": "Tiny Terror",
    "prerequisite": "Strength 13, size Tiny",
    "rules": "Despite falling below knee height of other species, your size has less impact on your strength and virility. You gain the following benefits:\n- Increase your Strength score by 1, to a maximum of 20.\n- Your speed increases by 5 feet.\n- You lose the Pintsized special trait, and you are no longer limited to +3 when determining your bonus to attack and damage rolls for weapon attacks using Strength due to the Puny special trait.\n- You gain the Undersized special trait: ***Undersized.*** Your small stature makes it hard for you to wield bigger weapons. You can't use heavy shields or martial weapons with the two-handed property unless it has the light property, and if a martial weapon has the versatile property, you can only wield it in two-hands.",
    "attributes": [
      "Strength"
    ],
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "bonus": 5
      },
      {
        "type": "combatTrait",
        "kind": "tinyTerror",
        "note": "Lose Pintsized and Puny +3 Strength weapon cap; gain Undersized (no heavy shields or non-light two-handed martial weapons; versatile martial weapons require two hands)"
      }
    ]
  },
  {
    "name": "Titan's Power",
    "prerequisite": "12th level, Strength 20",
    "rules": "You have the strength that legends tell of, granting the following benefits:\n- You gain proficiency in Strength saving throws. If you are already proficient in them, you instead gain expertise in them.\n- You ignore the two-handed property of weapons with which you are proficient.\n- When you miss with a melee weapon attack, the creature takes damage equal to your Strength modifier. This damage is of the same type as the weapon's damage.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Strength",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "weaponRule",
        "kind": "ignoreTwoHanded",
        "params": {
          "requiresProficient": true
        }
      },
      {
        "type": "attackDamageMod",
        "scope": "meleeWeapon",
        "onMiss": "Strength",
        "sameDamageType": true
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Titan's Power",
        "text": "When you miss with a melee weapon attack, target takes same-type damage equal to your Strength modifier."
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Total Reconstruction",
    "prerequisite": "Type beast or humanoid",
    "rules": "You are more machine than man. While repaired in a similar configuration as your own species, you are subject to the following changes:\n- Increase an ability score of your choice by 1, to a maximum of 20.\n- Choose one class of droid (class I-V or tracker). You count as the chosen creature type in addition to your other type.\n- You are resistant to necrotic and poison damage, and are immune to poison and disease.\n- You do not need to eat or drink. Additionally, you no longer require a tech focus to cast tech powers.\n- You are vulnerable to ion damage. Additionally, you have disadvantage on saving throws against effects that would deal ion or lightning damage.\n- You can not sense the Force, use force powers, or take levels in forcecasting classes.\n- You are no longer a valid target for cybernetic augmentations or genetic mutations. However, you are now a valid target for droid customizations.",
    "attributes": [
      "Any"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "necrotic"
      },
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "poison"
      },
      {
        "type": "conditionImmunity",
        "condition": "Poisoned",
        "mode": "immune"
      },
      {
        "type": "conditionImmunity",
        "condition": "Diseased",
        "mode": "immune"
      },
      {
        "type": "defense",
        "kind": "vulnerability",
        "damageType": "ion"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "disadvantage",
        "condition": "against effects dealing ion or lightning damage"
      },
      {
        "type": "castingRestriction",
        "kind": "forceInsensitive",
        "permanent": true,
        "note": "Cannot sense the Force, use force powers, or take forcecasting classes"
      },
      {
        "type": "biologyRule",
        "kind": "droid",
        "note": "Counts as chosen droid class; no eat/drink; no tech focus required; valid for droid customizations instead of cybernetics/mutations"
      },
      {
        "type": "combatTrait",
        "kind": "noCybernetics",
        "note": "No longer a valid target for cybernetic augmentations or genetic mutations"
      }
    ],
    "choiceSpec": {
      "kind": "droidClass",
      "label": "Droid class",
      "options": [
        "Class I",
        "Class II",
        "Class III",
        "Class IV",
        "Class V",
        "Tracker"
      ]
    }
  },
  {
    "name": "Tough",
    "prerequisite": "4th level, Durable feat",
    "rules": "You have the blood of heroes flowing through your veins. You gain the following benefits:\n- Increase your Constitution score by 1, to a maximum of 20.\n- Whenever you take the Dodge action in combat, you can spend one Hit Die to heal yourself. Roll the die, add your Constitution modifier, and regain a number of hit points equal to the total (minimum of one).",
    "attributes": [
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Tough (Dodge Heal)",
        "summary": "When taking the Dodge action in combat, spend 1 Hit Die to regain the roll + your Constitution modifier HP (minimum 1).",
        "effect": "spendHitDie",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Two-Weapon Casting",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've learned to better combine your dual wielding with your powers. You gain the following benefits:\n- Increase your Intelligence, Wisdom, or Charisma score by 1, to a maximum of 20.\n- When you use your action to Cast a Power that calls for a weapon attack and attack with a light weapon that you're holding in one hand, you can use your bonus action to engage in Two-Weapon Fighting. All the rules of Two-Weapon Fighting still apply to you.",
    "attributes": [
      "Intelligence",
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Two-Weapon Casting Follow-Up",
        "summary": "After using Cast a Power that calls for a weapon attack with a light weapon held in one hand, use your bonus action to engage in Two-Weapon Fighting."
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Unnatural Resilience",
    "prerequisite": "12th level, Constitution 20",
    "rules": "You have the fortitude often attributed to gods, granting the following benefits:\n- You gain proficiency in Constitution saving throws. If you are already proficient in them, you instead gain expertise in them.\n- Enhanced effects, such as powers or medpacs, that would restore hit points to you can't restore an amount less than half your level + your Constitution modifier. If this amount would exceed that maximum amount of hit points that effect could restore, you instead take that effect's maximum.\n- You can add your Constitution modifier to death saving throws you make.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "proficiency",
        "kind": "save",
        "target": "Constitution",
        "rank": 1,
        "upgradeToExpertise": true
      },
      {
        "type": "hpMod",
        "healingMod": "minimum half your level + Constitution modifier (capped at effect maximum)",
        "deathSaveAbility": "Constitution"
      }
    ],
    "minLevel": 12
  },
  {
    "name": "Versatile Withering",
    "prerequisite": "4th level",
    "rules": "You have learned to easily overcome an adversary's will. You gain the following benefits:\n- Increase your Wisdom or Charisma score by 1, to a maximum of 20.\n- When you make an attack roll using your Wisdom, you can choose to add half your Charisma modifier to the attack roll. Alternatively, when you would make an attack roll using Charisma, you can add half your Wisdom modifier to the attack roll. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.\n- When an effect you control would call for a Wisdom saving throw, you can instead have it call for a Charisma saving throw. Alternatively, when an effect you control would call for a Charisma saving throw, you can instead have it call for a Wisdom saving throw. You can use this feature a number of times equal to your proficiency bonus. You regain all expended uses of this feature when you complete a long rest.",
    "attributes": [
      "Wisdom",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Versatile Withering (Attack Boost)",
        "summary": "Add +{halfChaMod} to a Wisdom attack roll, or +{halfWisMod} to a Charisma attack roll.",
        "resourceId": "versatile_withering_attack"
      },
      {
        "type": "resourcePool",
        "id": "versatile_withering_attack",
        "name": "Versatile Withering (Attack)",
        "max": "proficiency",
        "recharge": "long"
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "cadence": "unlimited",
        "name": "Versatile Withering (Save Swap)",
        "summary": "Swap an effect you control between calling for a Wisdom saving throw and a Charisma saving throw.",
        "resourceId": "versatile_withering_save"
      },
      {
        "type": "resourcePool",
        "id": "versatile_withering_save",
        "name": "Versatile Withering (Save Swap)",
        "max": "proficiency",
        "recharge": "long"
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Vigorous Virility",
    "prerequisite": null,
    "rules": "Thanks to the strength of your vitality, you gain the following benefits:\n- Increase your Constitution, Intelligence, or Charisma score by 1, to a maximum of 20.\n- As an action, you can expend a Hit Die to end the weakened condition on yourself.\n- Once per long rest, when you complete a short rest, you can expend a Hit Die to remove 1 level of exhaustion.\n- You have advantage on saving throws made to avoid necrotic damage.",
    "attributes": [
      "Constitution",
      "Intelligence",
      "Charisma"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding necrotic damage"
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Shake Weakness (Vigorous Virility)",
        "summary": "Action: expend 1 Hit Die to end the weakened condition on yourself.",
        "effect": "spendHitDieClear",
        "clearConditions": [
          "Weakened"
        ],
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        }
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "restKind": "short",
        "restEffect": "removeExhaustionHitDie",
        "resourceId": "feat_vigorous_virility_exhaustion",
        "title": "Vigorous Virility (Exhaustion)",
        "text": "Once per long rest, on a short rest expend 1 Hit Die to remove 1 level of exhaustion."
      },
      {
        "type": "resourcePool",
        "id": "feat_vigorous_virility_exhaustion",
        "name": "Vigorous Virility (Remove Exhaustion)",
        "max": 1,
        "recharge": "long"
      }
    ]
  },
  {
    "name": "War Caster",
    "prerequisite": "4th level, the ability to cast force or tech powers",
    "rules": "You've practiced casting powers in the midst of combat, learning techniques that grant you the following benefits:\n- You have advantage on Constitution saving throws that you make to maintain your concentration on a power when you take damage.\n- Once per round, when a hostile creature provokes an opportunity attack from you, you can use your reaction to cast a power at the creature, rather than making an opportunity attack. The power must have a casting time of 1 action and must target only that creature.",
    "attributes": null,
    "source": "Expanded Content",
    "effects": [
      {
        "type": "concentrationMod",
        "advantage": true
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Opportunity Cast",
        "reactionKind": "standard",
        "cadence": "oncePerRound",
        "summary": "When a hostile creature provokes an opportunity attack from you, cast a 1-action power targeting only that creature instead of making an opportunity attack."
      }
    ],
    "minLevel": 4
  },
  {
    "name": "Weapon Expert",
    "prerequisite": null,
    "rules": "You have practiced extensively with a variety of weapons, gaining the following benefits:\n- Increase your Strength, Dexterity, or Constitution score by 1, to a maximum of 20.\n- You gain proficiency with all blasters. If you are already proficient with all blasters, instead once per turn when you would roll weapon damage using a blaster, you can choose to have advantage.\n- You gain proficiency with all lightweapons. If you are already proficient with all lightweapons, instead once per turn when you would roll weapon damage using a lightweapon, you can choose to have advantage.\n- You gain proficiency with all vibroweapons. If you are already proficient with all vibroweapons, instead once per turn when you would roll weapon damage using a vibroweapon, you can choose to have advantage.\n\nYou can take this feat twice.",
    "attributes": [
      "Strength",
      "Dexterity",
      "Constitution"
    ],
    "source": "Player's Handbook",
    "effects": [
      {
        "type": "weaponRule",
        "kind": "weaponExpertCategory",
        "categories": [
          "Blaster",
          "Lightweapon",
          "Vibroweapon"
        ]
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Weapon Expert",
        "text": "Proficiency with all blasters, lightweapons, and vibroweapons (or once per turn advantage on a weapon damage roll for each category you already have full proficiency in). Selectable twice."
      }
    ],
    "repeatable": true,
    "maxCount": 2
  },
  {
    "name": "Weapon Focused",
    "prerequisite": "4th level",
    "rules": "You adopt a particular type of weapon as your focus. Choose one of the weapon focus options, detailed later in this chapter. You can take this feat multiple times.",
    "attributes": null,
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "weaponFocus",
        "count": 1
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Weapon Focused",
        "text": "Choose one weapon focus option (repeatable)."
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "maxCount": 8,
    "minLevel": 4,
    "choiceSpec": {
      "kind": "weaponFocus",
      "count": 1,
      "label": "Weapon Focus"
    }
  },
  {
    "name": "Weapon Supremacist",
    "prerequisite": "4th level",
    "rules": "You've mastered a particular type of weapon. Choose one of the weapon supremacist options, detailed later in this chapter. You can take this feat multiple times.",
    "attributes": null,
    "source": "Wretched Hives",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "weaponSupremacy",
        "count": 1
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Weapon Supremacist",
        "text": "Choose one weapon supremacy option (repeatable)."
      }
    ],
    "repeatable": true,
    "distinctChoice": true,
    "maxCount": 8,
    "minLevel": 4,
    "choiceSpec": {
      "kind": "weaponSupremacy",
      "count": 1,
      "label": "Weapon Supremacy"
    }
  },
  {
    "name": "Well-Insulated",
    "prerequisite": null,
    "rules": "You can tolerate extremely cold temperatures. You gain the following benefits:\n- Increase your Dexterity, Constitution, or Intelligence score by 1, to a maximum of 20.\n- You have advantage on Constitution saving throws made to avoid exhaustion due to extreme cold, and each slowed level only reduces your speed by 5 feet, unless it would reduce your speed to 0.\n- You have advantage on saving throws made to avoid cold damage.",
    "attributes": [
      "Dexterity",
      "Constitution",
      "Intelligence"
    ],
    "source": "Expanded Content",
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Constitution"
        ],
        "mode": "advantage",
        "condition": "avoiding exhaustion due to extreme cold"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "avoiding cold damage"
      },
      {
        "type": "speed",
        "mode": "walk",
        "note": "Each slowed level reduces speed by only 5 feet (unless reduced to 0)",
        "slowedStep": 5
      }
    ]
  }
];
