// Generated from sw5e_source/class.json & classImprovement.json (100% verbatim-verified)
const SW5E_CLASS_POOL_META = {"Berserker":{"poolName":"Berserker Instincts","tabLabel":"Instincts","marker":"### Berserker Instincts","levelCol":"Berserker Instincts"},"Consular":{"poolName":"Force-Empowered Castings","tabLabel":"Force-Empowered","marker":"### Force-Empowered Castings","levelCol":"Force-Empowered Casting Options"},"Engineer":{"poolName":"Engineer Improvements","tabLabel":"Class Improvement","marker":"","levelCol":""},"Fighter":{"poolName":"Fighter Strategies","tabLabel":"Strategies","marker":"### Fighter Strategies","levelCol":"Strategies Known"},"Guardian":{"poolName":"Guardian Auras","tabLabel":"Auras","marker":"### Guardian Auras","levelCol":"Auras Known"},"Monk":{"poolName":"Monastic Vows","tabLabel":"Vows","marker":"### Monastic Vows","levelCol":"Monastic Vows"},"Operative":{"poolName":"Operative Exploits","tabLabel":"Exploits","marker":"### Operative Exploits","levelCol":"Operative Exploits"},"Scholar":{"poolName":"Discoveries","tabLabel":"Discoveries","marker":"### Discoveries","levelCol":"Discoveries"},"Scout":{"poolName":"Scout Routines","tabLabel":"Routines","marker":"### Scout Routines","levelCol":"Routines Known"},"Sentinel":{"poolName":"Sentinel Ideals","tabLabel":"Ideals","marker":"### Sentinel Ideals","levelCol":"Ideals Known"}};
const SW5E_CLASS_OPTIONS = [
  {
    "name": "Acklay's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "While raging, you have advantage on Constitution saving throws.",
    "summary": "While raging, advantage on Constitution saving throws.",
    "effects": [
      {
        "type": "saveMod",
        "abilities": [
          "Constitution"
        ],
        "mode": "advantage",
        "when": {
          "state": "raging"
        }
      }
    ]
  },
  {
    "name": "Bantha's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "description": "Your carrying capacity and the weight you can push, drag, or lift doubles. If it would already double, it instead triples. Additionally, you have advantage on Strength checks made to push, pull, lift, or break objects.",
    "summary": "Double carrying, push, drag, and lift capacity (triple if already doubled); advantage on Strength checks to push, pull, lift, or break objects.",
    "effects": [
      {
        "type": "sizeMod",
        "carryMultiplier": 2
      },
      {
        "type": "conditionalCheckMod",
        "ability": "Strength",
        "mode": "advantage",
        "condition": "pushing, pulling, lifting, or breaking objects"
      }
    ]
  },
  {
    "name": "Blurrg's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "Whether mounted or on foot, your travel pace is doubled, as is the travel pace of up to ten companions while they're within 60 feet of you and you're not incapacitated.",
    "summary": "Double travel pace for you and up to 10 companions within 60 ft while you aren't incapacitated.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Blurrg's Instinct",
        "text": "Travel pace is doubled for you and up to 10 companions within 60 ft while you aren't incapacitated.",
        "when": {
          "notConditions": [
            "Incapacitated"
          ]
        }
      }
    ]
  },
  {
    "name": "Boggdo's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "turnTriggers": [
      {
        "timing": "endOfTurn",
        "actor": "self",
        "kind": "prompt",
        "note": "Fall if you end your turn in the air and nothing else is holding you aloft."
      }
    ],
    "description": "While raging you have a flying speed equal to your current walking speed, though you fall if you end your turn in the air and nothing else is holding you aloft.",
    "summary": "While raging, flying speed equal to walking speed (fall if you end your turn unsupported in the air).",
    "effects": [
      {
        "type": "speed",
        "mode": "fly",
        "base": "walk",
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Boggdo's Instinct",
        "text": "While raging, flying speed equals walking speed (fall if you end your turn unsupported in the air).",
        "when": {
          "state": "raging"
        },
        "turnTriggers": [
          {
            "timing": "endOfTurn",
            "actor": "self",
            "kind": "prompt",
            "note": "Fall if you end your turn in the air and nothing else is holding you aloft."
          }
        ]
      }
    ]
  },
  {
    "name": "Chirodactyl's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "description": "While raging, you have blindsight to a range of 30 feet, and you have advantage on Wisdom (Perception) checks that rely on sound, as long as you aren't deafened.",
    "summary": "While raging, 30 ft blindsight and advantage on Wisdom (Perception) checks relying on sound while not deafened.",
    "effects": [
      {
        "type": "sense",
        "kind": "blindsight",
        "range": 30,
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Perception"
        ],
        "mode": "advantage",
        "condition": "relying on sound while raging",
        "when": {
          "state": "raging",
          "notConditions": [
            "Deafened"
          ]
        }
      }
    ]
  },
  {
    "name": "Dewback's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "damageTypes",
      "count": 3,
      "exclude": [
        "True"
      ],
      "label": "Damage resistances while raging (choose 3)"
    },
    "description": "Choose three damage types other than true damage. While raging, you have resistance to the chosen damage types.",
    "summary": "Choose three damage types (excluding true); gain resistance to them while raging.",
    "effects": [
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "$choice",
        "forEachChoice": true,
        "when": {
          "state": "raging",
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Dewback's Instinct",
        "text": "While raging, resistance to your 3 chosen damage types (excluding true).",
        "when": {
          "state": "raging"
        }
      }
    ]
  },
  {
    "name": "Fighter's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingStyles",
      "count": 1,
      "label": "Fighting Style",
      "grantsRuleElementKind": "fightingStyle"
    },
    "description": "You adopt a particular style of fighting as your specialty. Choose one of the Fighting Style options, detailed in Chapter 6.",
    "summary": "Learn one Fighting Style option.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      }
    ]
  },
  {
    "name": "Fyrnock's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "While raging, you can use your bonus action to leap up to 30 feet to an empty space you can see. When you land you deal kinetic damage equal to your Strength modifier to each creature within 5 feet of where you land. You can use this feature twice. You gain an additional use at 5th, 9th, 13th, and 17th level. You regain all expended uses when you complete a long rest.",
    "summary": "While raging, bonus action leap up to 30 ft, dealing {strModFloor0} kinetic damage to creatures within 5 ft on landing.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Fyrnock's Leap",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "While raging: leap up to 30 ft to an empty space you can see; deal {strModFloor0} kinetic damage to each creature within 5 ft on landing.",
        "resourceId": "fyrnock_leap",
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "resourcePool",
        "id": "fyrnock_leap",
        "name": "Fyrnock's Leap",
        "max": "proficiency",
        "recharge": "long"
      }
    ]
  },
  {
    "name": "Hawk's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "description": "You can see up to 1 mile away with no difficulty. You are able to discern even fine details as though looking at something no more than 100 feet away from you. Additionally, dim light doesn't impose disadvantage on your Wisdom (Perception) checks.",
    "summary": "See clearly up to 1 mile away (fine details as at 100 ft); dim light does not impose disadvantage on Wisdom (Perception) checks.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noDimLightDisadv",
        "note": "Dim light does not impose disadvantage on Wisdom (Perception) checks; see clearly up to 1 mile (fine details as at 100 ft)"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Perception"
        ],
        "title": "Hawk's Instinct",
        "text": "See up to 1 mile away clearly (fine details as at 100 ft); dim light does not impose disadvantage on Wisdom (Perception) checks."
      }
    ]
  },
  {
    "name": "Katarn's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You gain a climbing speed equal to your movement speed.",
    "summary": "Climbing speed equal to your movement speed.",
    "effects": [
      {
        "type": "speed",
        "mode": "climb",
        "base": "walk"
      }
    ]
  },
  {
    "name": "Loth-cat's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "While you're raging, other creatures have disadvantage on opportunity attack rolls against you, and you can take the Dash action as a bonus action on your turn.",
    "summary": "While raging, opportunity attacks against you have disadvantage and you can take Dash as a bonus action.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Loth-cat's Dash",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "While raging: take the Dash action as a bonus action.",
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "combatTrait",
        "kind": "oaDisadvantage",
        "note": "Opportunity attacks against you have disadvantage while raging",
        "when": {
          "state": "raging"
        }
      }
    ]
  },
  {
    "name": "Predator's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "Your speed increases by 10 feet.",
    "summary": "Walking speed increases by 10 feet.",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "bonus": 10
      }
    ]
  },
  {
    "name": "Rancor's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "description": "While you're raging any creature within 5 feet of you that's hostile to you has disadvantage on attack rolls against targets other than you or another character with this feature. An enemy is immune to this effect if it can't see or hear you or if it can't be frightened.",
    "summary": "While raging, hostile creatures within 5 ft have disadvantage on attacks against targets other than you.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Rancor's Instinct",
        "text": "While raging, hostile creatures within 5 ft have disadvantage on attacks against targets other than you (immune if unable to see/hear you or immune to Frightened).",
        "when": {
          "state": "raging"
        }
      }
    ]
  },
  {
    "name": "Tactician's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you use your Reckless Attack feature, you can choose to not have advantage on your attack rolls this turn. If you do so, friendly creatures within 5 feet of a hostile creature that is within 5 feet of you have advantage on attack rolls against that creature.",
    "summary": "Forgo Reckless Attack advantage this turn so allies within 5 ft of a hostile creature within 5 ft of you gain advantage against it.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Tactician's Instinct",
        "text": "When using Reckless Attack, forgo your own advantage this turn so allies within 5 ft of a hostile creature within 5 ft of you gain advantage against it."
      }
    ]
  },
  {
    "name": "Tracker's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "description": "You can track other creatures while traveling at a fast pace, and you can move stealthily while traveling at a normal pace.",
    "summary": "Track creatures at a fast travel pace and move stealthily at a normal travel pace.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Stealth",
          "Survival"
        ],
        "title": "Tracker's Instinct",
        "text": "Track other creatures while traveling at a fast pace, and move stealthily while traveling at a normal pace."
      }
    ]
  },
  {
    "name": "Terentatek's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you are forced to make a saving throw against a force power, you can immediately use your reaction to move up to half your speed towards the source power's caster. If you end this movement within 5 feet of the target, you can immediately make one melee weapon attack against the target as a part of that reaction.",
    "summary": "Reaction when forced to save against a force power: move up to {halfWalk} ft toward the caster and make 1 melee weapon attack if within 5 ft.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Terentatek's Instinct",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "When forced to save against a force power: move up to {halfWalk} ft toward the caster and make 1 melee weapon attack if within 5 ft."
      }
    ]
  },
  {
    "name": "Varactyl's Instinct",
    "className": "Berserker",
    "poolName": "Berserker Instincts",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "description": "While raging, you have advantage on Dexterity checks, your attack rolls can't suffer from disadvantage, and each slowed level only reduces your speed by 5 feet, unless it would reduce your speed to 0.",
    "summary": "While raging, advantage on Dexterity checks, attacks cannot have disadvantage, and each slowed level reduces speed by only 5 ft.",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "ability": "Dexterity",
        "mode": "advantage",
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "speed",
        "mode": "walk",
        "slowedStep": 5,
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "combatTrait",
        "kind": "noAttackDisadvantage",
        "note": "While raging, your attack rolls cannot suffer from disadvantage",
        "when": {
          "state": "raging"
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Varactyl's Instinct",
        "text": "While raging, your attack rolls cannot suffer from disadvantage.",
        "when": {
          "state": "raging"
        }
      }
    ]
  },
  {
    "name": "Careful Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that forces other creatures to make a saving throw, you can protect some of those creatures from the power's full force. To do so, you spend 1 additional force point and choose a number of those creatures up to your Wisdom or Charisma modifier (your choice, minimum of one). A chosen creature automatically succeeds on its saving throw against the power.",
    "summary": "Spend +1 Force point so up to {wisChaMod} creatures automatically succeed on the power's saving throw.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 1,
        "appliesTo": "hasSave",
        "stackable": false,
        "label": "Careful Power",
        "text": "Spend +1 Force point so up to {wisChaMod} creatures automatically succeed on the power's saving throw."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Careful Power",
        "text": "Spend +1 Force point so up to {wisChaMod} creatures automatically succeed on the power's saving throw."
      }
    ]
  },
  {
    "name": "Distant Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that has a range of 5 feet or greater, you can spend 1 additional force point to double the range of the power.\n\nAlternatively, when you cast a power that has a range of touch, you can spend 1 additional force point to make the range of the power 30 feet.",
    "summary": "Spend +1 Force point to double a power's range (or increase Touch range to 30 ft).",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 1,
        "appliesTo": "nonSelfRange",
        "stackable": false,
        "label": "Distant Power",
        "text": "Spend +1 Force point to double a power's range (or increase Touch range to 30 ft)."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Distant Power",
        "text": "Spend +1 Force point to double a power's range (or increase Touch range to 30 ft)."
      }
    ]
  },
  {
    "name": "Extended Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that has a duration of 1 minute or longer, you can spend 1 additional force point to double its duration, to a maximum duration of 24 hours.",
    "summary": "Spend +1 Force point to double a power's duration (up to 24 hours) if 1 minute or longer.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 1,
        "appliesTo": "canExtend",
        "stackable": false,
        "label": "Extended Power",
        "text": "Spend +1 Force point to double a power's duration (up to 24 hours) if 1 minute or longer."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Extended Power",
        "text": "Spend +1 Force point to double a power's duration (up to 24 hours) if 1 minute or longer."
      }
    ]
  },
  {
    "name": "Heightened Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that forces a creature to make a saving throw to resist its effects, you can spend 3 additional force points to give one target of the power disadvantage on its first saving throw made against the power.",
    "summary": "Spend +3 Force points to give one target disadvantage on its first saving throw against the power.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 3,
        "appliesTo": "hasSave",
        "stackable": false,
        "label": "Heightened Power",
        "text": "Spend +3 Force points to give one target disadvantage on its first saving throw against the power."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Heightened Power",
        "text": "Spend +3 Force points to give one target disadvantage on its first saving throw against the power."
      }
    ]
  },
  {
    "name": "Improved Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you roll damage for a power, you can spend 1 additional force point to reroll a number of the damage dice up to your Wisdom or Charisma modifier (your choice, minimum of one). You must use the new rolls.\n\nYou can use Improved Power even if you have already used a different Force-Empowered Casting option during the casting of the power.",
    "summary": "Spend +1 Force point to reroll up to {wisChaMod} damage dice (stacks with another Force-Empowered Casting).",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 1,
        "appliesTo": "hasDamage",
        "stackable": true,
        "label": "Improved Power",
        "text": "Spend +1 Force point to reroll up to {wisChaMod} damage dice (stacks with another Force-Empowered Casting)."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Improved Power",
        "text": "Spend +1 Force point to reroll up to {wisChaMod} damage dice (stacks with another Force-Empowered Casting)."
      }
    ]
  },
  {
    "name": "Lingering Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "endOfOwnNextTurn"
    },
    "description": "When you cast a power that requires concentration to maintain you can choose to spend 3 additional force points. If you do, when you lose concentration on the power, the power will not end until the end of your next turn.",
    "summary": "Spend +3 Force points so a concentration power persists until the end of your next turn if you lose concentration.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 3,
        "appliesTo": "concentration",
        "stackable": false,
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "label": "Lingering Power",
        "text": "Spend +3 Force points so a concentration power persists until the end of your next turn if you lose concentration."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Lingering Power",
        "text": "Spend +3 Force points so a concentration power persists until the end of your next turn if you lose concentration."
      }
    ]
  },
  {
    "name": "Pinpoint Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that allows you to force creatures in an area to make a saving throw you can instead spend 1 force point and make a ranged force attack against a single target that would be in the range. On a hit the target suffers the effects as though they failed their saving throw.",
    "summary": "Spend +1 Force point to turn an area saving-throw power into a ranged force attack against one target.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 1,
        "appliesTo": "areaSave",
        "stackable": false,
        "label": "Pinpoint Power",
        "text": "Spend +1 Force point to turn an area saving-throw power into a ranged force attack against one target."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Pinpoint Power",
        "text": "Spend +1 Force point to turn an area saving-throw power into a ranged force attack against one target."
      }
    ]
  },
  {
    "name": "Quickened Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that has a casting time of 1 action, you can spend 2 additional force points to change the casting time to 1 bonus action for this casting.",
    "summary": "Spend +2 Force points to cast a 1-action force power as a bonus action.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCost": 2,
        "appliesTo": "actionCast",
        "stackable": false,
        "enablesBonusActionCast": true,
        "label": "Quickened Power",
        "text": "Spend +2 Force points to change a 1-action force power to a 1-bonus-action casting time."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Quickened Power",
        "text": "Spend +2 Force points to change a 1-action force power to a 1-bonus-action casting time."
      }
    ]
  },
  {
    "name": "Refocused Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you are forced to make a Constitution saving throw to maintain concentration on a power you can use your reaction and spend 2 force points to automatically succeed on the saving throw.\n\nYou can use Refocused Power even if you have already used a different Force-Empowered Casting option during the casting of the power.",
    "summary": "Reaction + 2 Force points to automatically succeed on a Constitution concentration save.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Refocused Power",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "cost": {
          "pool": "force",
          "amount": 2
        },
        "when": {
          "state": "concentrating"
        },
        "summary": "Spend 2 Force points on a Constitution concentration save to automatically succeed (stacks with other Force-Empowered Castings)."
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "abilities": [
          "Constitution"
        ],
        "title": "Refocused Power",
        "text": "Reaction + 2 Force points to automatically succeed on a Constitution concentration save."
      }
    ]
  },
  {
    "name": "Seeking Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "If you miss with a force power that calls for an attack roll, you can spend 2 force points to reroll the attack. You must use the new roll.\n\nYou can use Seeking Power even if you have already used a different Force-Empowered Casting option during the casting of the power.",
    "summary": "Spend 2 Force points to reroll a missed force power attack roll.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Seeking Power",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "cost": {
          "pool": "force",
          "amount": 2
        },
        "summary": "On a missed force power attack roll: spend 2 Force points to reroll the attack (stacks with other Force-Empowered Castings)."
      }
    ]
  },
  {
    "name": "Twinned Power",
    "className": "Consular",
    "poolName": "Force-Empowered Castings",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you cast a power that can only have one target and doesn't have a range of self, you can spend a number of additional force points equal to the power's level to choose a second target in range with the same power (1 force point if the power is at-will).",
    "summary": "Spend Force points equal to power level (1 for at-will) to target a second creature with a single-target non-self power.",
    "effects": [
      {
        "type": "castingModifier",
        "kind": "forceEmpoweredCasting",
        "fpCostFormula": "powerLevelMin1",
        "appliesTo": "singleTarget",
        "stackable": false,
        "label": "Twinned Power",
        "text": "Spend Force points equal to power level (1 for at-will) to target a second creature with a single-target non-self power."
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Twinned Power",
        "text": "Spend Force points equal to power level (1 for at-will) to target a second creature with a single-target non-self power."
      }
    ]
  },
  {
    "name": "Cover Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You treat partial cover as one step higher (from one-quarter to half or half to three-quarters). While in cover, your attacks reduce partial cover by one step (from three-quarters to half or half to one-quarter).",
    "summary": "Treat partial cover as one step higher; while in cover, your attacks reduce targets' partial cover by one step.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "coverStepUp",
        "note": "Treat partial cover as one step higher (one-quarter → half, half → three-quarters)"
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Cover Strategist",
        "text": "While in cover, your attacks reduce targets' partial cover by one step (three-quarters → half, half → one-quarter)."
      }
    ]
  },
  {
    "name": "Cunning Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "cunningOptions",
      "count": 2,
      "label": "Bonus-action options (choose 2)"
    },
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "Choose two from the following. You can perform each of the chosen options with your bonus action, instead of your action: \n- Applying poison\n- Dash\n- Disengage\n- Guard\n- Help\n- Hide\n- Search\n- Throwing grenades and setting mines\n- While mounted on a controlled beast, having your beast make a single melee attack against a creature within its reach\n- While mounted on a vehicle, taking a vehicle action (you can't take the same action twice in one turn)",
    "summary": "Choose two utility actions to perform as a bonus action instead of an action.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "$choice",
        "forEachChoice": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "Perform $choice as a bonus action (Cunning Strategist).",
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Enduring Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You only need 3 hours of sleep during a long rest to gain its benefits, instead of 6. Additionally, if your long rest would be interrupted, you only need to complete the long rest instead of restarting it to gain its benefits. Lastly, you have advantage on saving throws against exhaustion.",
    "summary": "Only 3 hours of sleep needed for a long rest, interruptions do not restart the rest, and advantage on saves against exhaustion.",
    "effects": [
      {
        "type": "biologyRule",
        "kind": "restMod",
        "note": "Only 3 hours of sleep needed for a long rest; interruptions do not restart the rest"
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Enduring Strategist",
        "text": "Only 3 hours of sleep needed for a long rest; interruptions do not restart the rest."
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against exhaustion"
      }
    ]
  },
  {
    "name": "Mastery Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingMasteries",
      "count": 1,
      "label": "Fighting Mastery",
      "grantsRuleElementKind": "fightingMastery"
    },
    "description": "You've mastered a particular style of fighting. Choose one of the Fighting Mastery options, detailed in Chapter 6.",
    "summary": "Learn one Fighting Mastery option.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingMastery",
        "count": 1
      }
    ]
  },
  {
    "name": "Lightweapon Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "lightsaberForms",
      "count": 1,
      "label": "Lightsaber Form"
    },
    "description": "You gain proficiency in all lightweapons. Additionally, you no longer need the ability to cast force powers to learn features that grant lightsaber forms, and you learn one lightsaber form of your choice.",
    "summary": "Proficiency in all lightweapons; learn one Lightsaber Form without needing forcecasting.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "weapon",
        "target": "SimpleLightweapon"
      },
      {
        "type": "proficiency",
        "kind": "weapon",
        "target": "MartialLightweapon"
      },
      {
        "type": "combatTrait",
        "kind": "unlocksLightsaberForms",
        "note": "No forcecasting required for features that grant lightsaber forms"
      },
      {
        "type": "combatOptionGrant",
        "kind": "lightsaberForm",
        "count": 1
      }
    ]
  },
  {
    "name": "Maneuver Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "maneuvers",
      "count": 2,
      "label": "Maneuvers (choose 2)"
    },
    "description": "You learn two additional maneuvers. When you complete a short rest, you can replace one of these maneuvers with another one. When you complete a long rest, you can replace both of these maneuvers with other ones.",
    "summary": "Learn two additional maneuvers; replace one on a short rest or both on a long rest.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "maneuver",
        "count": 2
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Maneuver Strategist",
        "text": "Replace 1 of these maneuvers on a short rest, or both on a long rest."
      }
    ]
  },
  {
    "name": "Skilled Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "skillsOrTools",
      "count": 2,
      "maxSkills": 1,
      "label": "1 skill & 1 tool, or 2 tools (choose 2)"
    },
    "description": "You gain proficiency in a skill and a tool, or two tools.",
    "summary": "Gain proficiency in one skill and one tool, or two tools.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skillOrTool",
        "target": "$choice",
        "rank": 1,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Style Strategist",
    "className": "Fighter",
    "poolName": "Fighter Strategies",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingStyles",
      "count": 1,
      "label": "Fighting Style",
      "grantsRuleElementKind": "fightingStyle"
    },
    "description": "You adopt a second fighting style. Choose one of the fighting style options, detailed in Chapter 6. When you complete a long rest, you can change this style out for another one.",
    "summary": "Learn a second Fighting Style; swap it out after a long rest.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Style Strategist",
        "text": "On a long rest, replace this fighting style with another available fighting style."
      }
    ]
  },
  {
    "name": "Aura of Conquest",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "target",
        "kind": "damage",
        "inArea": true,
        "formula": "{halfLevel}",
        "note": "Frightened creature starting its turn within {auraRadius} gains 4 slowed levels and takes {halfLevel} psychic damage."
      }
    ],
    "description": "Whenever a creature who is frightened of you starts its turn within 5 feet of you, its gains 4 slowed levels and takes psychic damage equal to half your guardian level.",
    "summary": "Frightened creatures starting their turn within {auraRadius} gain 4 slowed levels and take {halfLevel} psychic damage.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Aura of Conquest",
        "text": "Frightened creatures starting their turn within {auraRadius} gain 4 slowed levels and take {halfLevel} psychic damage.",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "target",
            "kind": "damage",
            "inArea": true,
            "formula": "{halfLevel}",
            "note": "Frightened creature starting its turn within {auraRadius} gains 4 slowed levels and takes {halfLevel} psychic damage."
          }
        ]
      }
    ]
  },
  {
    "name": "Aura of Conviction",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You and friendly creatures within 5 feet of you have advantage on saving throws against effects that would cause you to be charmed or frightened.",
    "summary": "You and allies within {auraRadius} have advantage on saves against being charmed or frightened.",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against being Charmed or Frightened ({auraRadius} aura)",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Aura of Hatred",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You and friendly creatures within 5 feet of you gain a bonus to the first melee weapon damage rolls you make each round equal to your Charisma modifier (minimum of +1).",
    "summary": "You and allies within {auraRadius} add +{chaModMin1} (Charisma modifier, minimum +1) to the first melee weapon damage roll each round.",
    "effects": [
      {
        "type": "attackDamageMod",
        "scope": "melee",
        "damageBonus": "{chaModMin1}",
        "oncePerRound": true,
        "note": "+{chaModMin1} (Aura of Hatred, 1st hit/rd, {auraRadius})",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Aura of Hatred",
        "text": "You and allies within {auraRadius} add +{chaModMin1} to the first melee weapon damage roll each round.",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Aura of Presence",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "Whenever you or a friendly creature within 5 feet of you must make a saving throw, the creature can add your Wisdom modifier to the saving throw.",
    "summary": "You and allies within {auraRadius} can add +{wisModFloor0} (Wisdom modifier) to saving throws.",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "abilityAdd",
        "ability": "Wisdom",
        "minValue": 0,
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "title": "Aura of Presence",
        "text": "You and allies within {auraRadius} can add +{wisModFloor0} (Wisdom modifier) to saving throws.",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Aura of Protection",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "Whenever a creature within 5 feet of you takes damage, you can use your reaction to take that damage instead of that creature taking it. This feature doesn't transfer any other effects that might accompany the damage, and this damage can't be reduced in any way.",
    "summary": "Reaction when a creature within {auraRadius} takes damage to take that unreduced damage instead.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Aura of Protection",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "When a creature within {auraRadius} takes damage, take that unreduced damage instead (other effects don't transfer)."
      }
    ]
  },
  {
    "name": "Aura of Vigor",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "tempHP",
        "inArea": true,
        "formula": "{wisChaMod}",
        "note": "Friendly creature starting its turn within {auraRadius} gains +{wisChaMod} temporary HP."
      }
    ],
    "description": "Whenever a friendly creature starts its turn within 5 feet of you, that creature gains temporary hit points equal to your Wisdom or Charisma modifier (your choice, minimum of one).",
    "summary": "Allies starting their turn within {auraRadius} gain +{wisChaMod} temporary HP.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Aura of Vigor",
        "effect": "applyTempHP",
        "amountFormula": "wisChaMod",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn within {auraRadius}: friendly creature gains +{wisChaMod} temporary HP.",
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "tempHP",
            "inArea": true,
            "formula": "{wisChaMod}",
            "note": "Friendly creature starting its turn within {auraRadius} gains +{wisChaMod} temporary HP."
          }
        ]
      }
    ]
  },
  {
    "name": "Aura of Warding",
    "className": "Guardian",
    "poolName": "Guardian Auras",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You and friendly creatures within 5 feet of you have resistance to damage from force powers.",
    "summary": "You and allies within {auraRadius} have resistance to damage from force powers.",
    "effects": [
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "force power damage",
        "condition": "while conscious (self & allies within {auraRadius})",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Vow of Deflection",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "You can use your reaction to divert a strike when you are dealt damage by a melee weapon attack. When you do so, the damage taken by the attack is reduced by 1d10 + your Dexterity modifier + your monk level.",
    "summary": "Reaction on melee weapon hit: reduce damage by 1d10 {dexPlusLevelSigned}.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Vow of Deflection",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "When dealt damage by a melee weapon attack, reduce damage taken by 1d10 {dexPlusLevelSigned}."
      }
    ]
  },
  {
    "name": "Vow of the Devoted",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "forcePowers",
      "alignmentFilter": "Universal",
      "countSchedule": [
        3,
        5,
        7,
        9,
        11,
        13,
        15,
        17
      ],
      "baseCount": 2,
      "label": "Universal Force Powers"
    },
    "description": "You gain a limited ability to manipulate the Force. See chapter 10 for the general rules of forcecasting and chapter 11 for the force powers list.\n\n***Force Powers Known.*** You learn 2 force powers of your choice. You learn an additional power at 3rd, 5th, 7th, 9th, 11th, 13th, 15th, and 17th level. You may not learn a force power of a level higher than your Max Power Level, and you may learn a force power at the same time you learn its prerequisite. You may only learn universal powers in this way.\n\n***Force Points.*** Rather than force points, powers you learn through this vow are cast using your focus points, at 1 focus point per power level. You may only cast universal powers in this way.\n\n***Max Power Level.*** Many force powers can be overpowered, consuming more focus points to create a greater effect. You can overpower these abilities to a maximum level, which increases at higher levels. Your Max Power Level is 1st. It increases to 2nd at 7th level, 3rd at 13th level, and 4th at 17th level. You may only cast force powers at 4th-level once. You regain the ability to do so after a long rest.\n\n***Forcecasting Ability.*** You use your focus ability whenever a power refers to your forcecasting ability. If a power you cast with focus points calls for a saving throw, you use your focus save DC. If a power you cast with focus points calls for an attack roll, you use your focus attack modifier.",
    "summary": "Learn universal Force powers cast with Focus points (1 point per power level; Focus save DC {focusDC}).",
    "effects": [
      {
        "type": "castingMod",
        "powerType": "force",
        "unlocksCasting": true,
        "universalOnly": true,
        "usesFocusPoints": true,
        "knownSchedule": [
          3,
          5,
          7,
          9,
          11,
          13,
          15,
          17
        ],
        "baseKnown": 2,
        "maxLevelSchedule": {
          "1": 1,
          "7": 2,
          "13": 3,
          "17": 4
        },
        "abilitySource": "focus"
      },
      {
        "type": "resourcePool",
        "id": "vow_devoted_4th",
        "name": "Vow of the Devoted (4th-Level Cast)",
        "max": 1,
        "recharge": "long",
        "when": {
          "minLevel": 17
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Vow of the Devoted",
        "text": "Cast universal Force powers using Focus points (1 Focus per power level; Max Power Level 1st/2nd@7/3rd@13/4th@17; 4th-level 1/long rest; Focus save DC {focusDC})."
      }
    ]
  },
  {
    "name": "Vow of Fate",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "durationSpec": {
      "anchor": "untilShortOrLongRest"
    },
    "description": "When you finish a short or long rest, roll a d20 and record the number rolled. Once before your next short or long rest, you can replace any attack roll, saving throw, or ability check made by you or a creature within 5 feet of you with this roll. You must choose to do so before the roll.",
    "summary": "After a short or long rest, roll a d20 and save it to replace one attack, save, or check within 5 ft.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Vow of Fate",
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "untilShortOrLongRest"
        },
        "summary": "Before the roll, replace one attack roll, saving throw, or ability check within 5 ft with your saved d20.",
        "resourceId": "vow_of_fate_d20"
      },
      {
        "type": "resourcePool",
        "id": "vow_of_fate_d20",
        "name": "Vow of Fate (Saved d20)",
        "max": 1,
        "recharge": "short"
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Vow of Fate",
        "text": "After finishing a short or long rest, roll a d20 and record the result for Vow of Fate."
      }
    ]
  },
  {
    "name": "Vow of the Fighter",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingStyles",
      "count": 1,
      "label": "Fighting Style",
      "grantsRuleElementKind": "fightingStyle"
    },
    "description": "You adopt a particular style of fighting as your specialty. Choose one of the fighting Style options, detailed in Chapter 6.",
    "summary": "Learn one Fighting Style option.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      }
    ]
  },
  {
    "name": "Vow of the Focused",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "vowFocusedAbility",
      "count": 1,
      "label": "Substitute ability (Strength, Constitution, or Intelligence)"
    },
    "description": "You can substitute Strength, Constitution, or Intelligence (chosen when you take this vow) for Wisdom or Charisma for your monk class features, except for other vows and Monastic Tradition features.",
    "summary": "Substitute Strength, Constitution, or Intelligence for Wisdom or Charisma in base Monk class features.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "focusAbilityOverride",
        "ability": "$choice",
        "baseClassOnly": true,
        "when": {
          "hasChoice": true
        },
        "note": "Substitute $choice for Wisdom or Charisma in base Monk class features (except other vows and Monastic Tradition features)."
      },
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Vow of the Focused",
        "text": "Base Monk class features (excluding other vows and Monastic Tradition features) can use $choice instead of Wisdom or Charisma.",
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Vow of Fortitude",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "You can use your action or bonus action to end one effect on yourself that is causing you to be blinded or deafened.",
    "summary": "Action or bonus action to end one blinded or deafened effect on yourself.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Vow of Fortitude",
        "effect": "clearConditions",
        "clearConditions": [
          "Blinded",
          "Deafened"
        ],
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "End one effect causing you to be Blinded or Deafened (action or bonus action)."
      }
    ]
  },
  {
    "name": "Vow of Freedom",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "You ignore unenhanced difficult terrain, and when you would use your action to break free of an effect that is grappling or restraining you, you can instead use your bonus action.",
    "summary": "Ignore unenhanced difficult terrain; escape grapples or restraints as a bonus action.",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "ignoreDifficultTerrain": true
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Escape Grapple / Restraint",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "Bonus action: attempt to break free of a grapple or restraining effect instead of using your action."
      }
    ]
  },
  {
    "name": "Vow of Intuition",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You can no longer have disadvantage on attack rolls against creatures within 10 feet of you due to not being able to see them.",
    "summary": "No disadvantage on attacks against unseen creatures within 10 feet.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noUnseenAttackDisadv",
        "range": 10,
        "note": "No disadvantage on attack rolls against unseen creatures within 10 ft."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Vow of Intuition",
        "text": "No disadvantage on attack rolls against unseen creatures within 10 ft."
      }
    ]
  },
  {
    "name": "Vow of the Limber",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "7th level",
    "minLevel": 7,
    "durationSpec": {
      "anchor": "endOfOwnTurn"
    },
    "description": "When you make your first unarmed strike on your turn, you can choose to spend 1 focus point. If you do so, your reach with your unarmed strikes increases by 5 feet until the end of your turn.",
    "summary": "Spend 1 Focus point on your first unarmed strike to extend unarmed reach by 5 ft until end of turn.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Vow of the Limber",
        "cost": {
          "pool": "focus",
          "amount": 1
        },
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "endOfOwnTurn"
        },
        "toggleEffect": {
          "name": "Vow of the Limber",
          "note": "+5 ft unarmed strike reach until end of turn"
        },
        "summary": "On your first unarmed strike this turn: spend 1 Focus point to increase unarmed strike reach by 5 ft until end of turn."
      }
    ]
  },
  {
    "name": "Vow of the Nemesis",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "As a bonus action, you can choose one creature within 30 feet that you can see. The creature must make a Wisdom saving throw against your focus save DC. On a successful save, the creature becomes immune to this feature for 24 hours. On a failed save, for the next minute, the creature has disadvantage on attack rolls against creatures other than you, and it must make an additional Wisdom saving throw each time it attempts to move to a space that is more than 30 feet away from you; if it succeeds on this saving throw, this feature doesn't restrict its movement for that turn. \n\nThis feature ends early if you attack another creature, if you target another hostile creature with a power or class feature, if a friendly creature damages the target, if a friendly creature targets it with a power or class feature, or if you target another creature with this feature.",
    "summary": "Bonus action (30 ft, Wisdom save DC {focusDC}): for 1 minute, target has disadvantage attacking others and must save to move over 30 ft away.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Vow of the Nemesis",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Vow of the Nemesis",
          "note": "Target has disadvantage attacking others; Wisdom save DC {focusDC} to move >30 ft away"
        },
        "summary": "30 ft, Wisdom save DC {focusDC}: for 1 minute, target has disadvantage attacking others and must save to move >30 ft away."
      }
    ]
  },
  {
    "name": "Vow of the Open Mind",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "skills",
      "count": 1,
      "label": "Skill proficiency"
    },
    "description": "You gain proficiency in a skill of your choice. Additionally, you can spend 1 focus point and 10 minutes meditating on a skill in which you are proficient. If you do so, when you make an ability check with the chosen skill, you can add your Wisdom or Charisma modifier to the check. You can only have one instance of this feature active at a time.",
    "summary": "Gain one skill proficiency; spend 1 Focus point and 10 minutes to add +{wisChaMod} (Wisdom or Charisma modifier) to checks with one proficient skill.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skill",
        "target": "$choice",
        "rank": 1,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Vow of the Open Mind",
        "cost": {
          "pool": "focus",
          "amount": 1
        },
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "permanent"
        },
        "toggleEffect": {
          "name": "Vow of the Open Mind",
          "note": "+{wisChaMod} (Wisdom or Charisma modifier) to checks with 1 meditated proficient skill (1 active at a time)"
        },
        "summary": "10 minutes, 1 Focus point: meditate on 1 proficient skill to add +{wisChaMod} (Wisdom or Charisma modifier) to checks with it (1 active)."
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Vow of the Open Mind",
        "text": "Spend 1 Focus point and 10 minutes meditating on a proficient skill to add +{wisChaMod} to checks with that skill (1 active at a time)."
      }
    ]
  },
  {
    "name": "Vow of Precision",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "description": "Your critical hit range with unarmed strikes increases by 1.",
    "summary": "Unarmed strike critical hit range increases by 1.",
    "effects": [
      {
        "type": "critMod",
        "scope": "unarmed",
        "rangeBonus": 1
      }
    ]
  },
  {
    "name": "Vow of Requital",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "13th level",
    "minLevel": 13,
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you take the Dodge action and an attack made by a creature within 5 feet of you misses you before the start of your next turn, you can use your reaction to make one melee weapon attack with a monk weapon or unarmed strike against that creature.",
    "summary": "Reaction when an attacker within 5 ft misses you after you Dodge: make one unarmed strike or monk weapon attack.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Vow of Requital",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "After taking Dodge, when a creature within 5 ft misses you before your next turn: make 1 unarmed strike or monk weapon attack."
      }
    ]
  },
  {
    "name": "Vow of Restoration",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you would make an unarmed strike, you can spend 1 focus point to instead touch a willing creature within your reach. Roll your Martial Arts die. The target gains hit points equal to the amount rolled + your Wisdom or Charisma modifier (your choice, minimum of +1).",
    "summary": "Spend 1 Focus point in place of an unarmed strike to heal a willing creature within reach for {maDie} + {wisChaMod} HP.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Vow of Restoration",
        "cost": {
          "pool": "focus",
          "amount": 1
        },
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "In place of an unarmed strike, spend 1 Focus point to heal a willing creature within reach for {maDie} + {wisChaMod} HP."
      }
    ]
  },
  {
    "name": "Vow of the Sentry",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You gain proficiency in light and medium armor. Additionally, you can now gain the benefits of your Martial Arts and Unarmored Movement features while wearing light or medium armor as long as you are not wielding a shield.",
    "summary": "Proficiency in light and medium armor; use Martial Arts and Unarmored Movement while wearing them without a shield.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "armor",
        "target": "Light"
      },
      {
        "type": "proficiency",
        "kind": "armor",
        "target": "Medium"
      },
      {
        "type": "combatTrait",
        "kind": "monkArmorAllowed",
        "armorTiers": [
          "Light",
          "Medium"
        ],
        "note": "Gain Martial Arts and Unarmored Movement benefits while wearing light or medium armor without a shield."
      }
    ]
  },
  {
    "name": "Vow of Serenity",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "Your maximum focus increases by an amount equal to half your Wisdom or Charisma modifier (your choice, minimum of +1).",
    "summary": "Maximum Focus points increase by +{halfForceMod} (half your Wisdom or Charisma modifier, minimum +1).",
    "effects": [
      {
        "type": "pointPoolMod",
        "pool": "focus",
        "maxBonus": "halfForceModMin1",
        "note": "Maximum Focus points increase by +{halfForceMod} (half Wisdom or Charisma modifier, minimum +1)."
      }
    ]
  },
  {
    "name": "Vow of Spirit",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You can use your choice of Wisdom or Charisma instead of Strength or Dexterity for the attack and damage rolls of your unarmed strikes and monk weapons. You must use the same modifier for both rolls.",
    "summary": "Use Wisdom or Charisma instead of Strength or Dexterity for unarmed strikes and monk weapons.",
    "effects": [
      {
        "type": "weaponRule",
        "kind": "monkUsesForceMod",
        "params": {
          "abilities": [
            "Wisdom",
            "Charisma"
          ]
        },
        "note": "Use Wisdom or Charisma instead of Strength or Dexterity for unarmed strike and monk weapon attack and damage rolls."
      }
    ]
  },
  {
    "name": "Vow of the Versatile",
    "className": "Monk",
    "poolName": "Monastic Vows",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you would make an unarmed strike as part of your Martial Arts bonus action attack or your Flurry of Blows, you can instead make a weapon attack with a monk weapon you are wielding, using your Martial Arts die in place of the weapon's damage.",
    "summary": "Use a monk weapon with your Martial Arts die ({maDie}) in place of unarmed strikes for bonus action attacks and Flurry of Blows.",
    "effects": [
      {
        "type": "weaponRule",
        "kind": "monkWeaponBonusAttack",
        "params": {
          "die": "{maDie}"
        },
        "note": "May use a wielded monk weapon (with your Martial Arts die {maDie}) in place of unarmed strikes for Martial Arts bonus attacks and Flurry of Blows."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Vow of the Versatile",
        "text": "May use a monk weapon (with your Martial Arts die {maDie}) in place of unarmed strikes for Martial Arts bonus attacks and Flurry of Blows."
      }
    ]
  },
  {
    "name": "Commander's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You gain proficiency in medium armor.",
    "summary": "Gain proficiency in medium armor.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "armor",
        "target": "Medium"
      }
    ]
  },
  {
    "name": "Explorer's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You can hold your breath twice as long as you are normally able to, and take half as much damage from fall damage.",
    "summary": "Hold breath twice as long and take half damage from falling.",
    "effects": [
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "falling"
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Explorer's Exploit",
        "text": "You can hold your breath twice as long as normal."
      }
    ]
  },
  {
    "name": "Fate's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "minLevel": 7,
    "prerequisite": "7th level",
    "description": "When you finish a short or long rest, roll a d20 and record the number rolled. Once before your next short or long rest, you can replace any attack roll, saving throw, or ability check made by you or a creature within 5 feet of you with this roll. You must choose to do so before the roll.",
    "summary": "After a short or long rest, roll a d20 and save it to replace one attack, save, or check within 5 ft.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Fate's Exploit",
        "summary": "Before the roll, replace one attack roll, saving throw, or ability check made by you or a creature within 5 ft. with your saved d20.",
        "resourceId": "fates_exploit_d20",
        "cadence": "oncePerShortRest",
        "durationSpec": {
          "anchor": "untilShortOrLongRest"
        }
      },
      {
        "type": "resourcePool",
        "id": "fates_exploit_d20",
        "name": "Fate's Exploit (Saved d20)",
        "max": 1,
        "die": "d20",
        "recharge": "short"
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Fate's Exploit",
        "text": "When you finish a short or long rest, roll a d20 and record it to replace one attack roll, saving throw, or ability check within 5 ft. before your next rest."
      }
    ]
  },
  {
    "name": "Fighter's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingStyles",
      "count": 1,
      "label": "Fighting Style",
      "grantsRuleElementKind": "fightingStyle"
    },
    "description": "You adopt a particular style of fighting as your specialty. Choose one of the fighting Style options, detailed in Chapter 6.",
    "summary": "Learn one Fighting Style option.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      }
    ]
  },
  {
    "name": "Freedom's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You ignore unenhanced difficult terrain, and when you would use your action to break free of an effect that is grappling or restraining you, you can instead use your bonus action.",
    "summary": "Ignore unenhanced difficult terrain; escape grapples or restraints as a bonus action.",
    "effects": [
      {
        "type": "speed",
        "mode": "walk",
        "ignoreDifficultTerrain": true,
        "note": "Ignore unenhanced difficult terrain."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Escape Grapple / Restraint",
        "summary": "Break free of a grappling or restraining effect as a bonus action instead of your action."
      }
    ]
  },
  {
    "name": "Guerrilla's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You only need 3 hours of sleep during a long rest to gain its benefits, instead of 6. Additionally, if your long rest would be interrupted, you only need to complete the long rest instead of restarting it to gain its benefits. Lastly, you have advantage on saving throws against exhaustion.",
    "summary": "Only 3 hours of sleep needed for a long rest, interruptions do not reset rest, and advantage on saves against exhaustion.",
    "effects": [
      {
        "type": "biologyRule",
        "kind": "restMod",
        "note": "Only need 3 hours of sleep during a long rest (instead of 6); interruptions do not require restarting."
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Guerrilla's Exploit",
        "text": "Only need 3 hours of sleep during a long rest (instead of 6); interruptions do not require restarting."
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against exhaustion"
      }
    ]
  },
  {
    "name": "Learner's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "skillsOrTools",
      "count": 2,
      "maxSkills": 1,
      "distinctChoice": true,
      "label": "1 skill & 1 tool, or 2 tools (choose 2)"
    },
    "description": "You gain proficiency in a skill and a tool, or two tools.\n\nYou can select this exploit multiple times, each time choosing a new skill and a tool, or two new tools.",
    "summary": "Gain proficiency in one skill and one tool, or two tools (repeatable).",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skillOrTool",
        "target": "$choice",
        "rank": 1,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Mentor's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "minLevel": 13,
    "prerequisite": "13th level",
    "description": "Once per turn, whenever both you and a friendly creature within 60 feet that can see and hear you both have to make a saving throw to resist the same effect, you can choose to have disadvantage on the save. If you do so, the friendly creature gains advantage on the save. You can use this feature before or after you both make the saving throw, but you must do so before the GM says whether the save succeeds or fails.",
    "summary": "Once per turn when both you and an ally within 60 ft. save against the same effect, take disadvantage to grant the ally advantage.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Mentor's Exploit",
        "summary": "When you and an ally within 60 ft. (who can see and hear you) save against the same effect, take disadvantage to grant them advantage (before outcome is announced).",
        "cadence": "oncePerTurn"
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "title": "Mentor's Exploit",
        "text": "Once per turn, when you and an ally within 60 ft. who can see and hear you save against the same effect, take disadvantage to grant them advantage (before outcome is announced)."
      }
    ]
  },
  {
    "name": "Skill's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "proficientSkills",
      "count": 1,
      "distinctChoice": true,
      "label": "Proficient skill for Skill's Exploit"
    },
    "description": "You learn an exploit that enhances your ability to apply your knowledge to combat situations. You can take this exploit multiple times.\n\nWhen you take the Attack action, you can use one of your skill exploits granted by this feature. You can use these features a combined two times. You gain an additional use at 5th, 9th, 13th, and 17th level. You regain any expended uses when you finish a long rest.\n\nChoose from the following. You must be proficient in the skill in order to take that skill's exploit. \n\n***Aim (Stealth).*** You attempt to line up a strike against a creature you can see that you are hidden from. Make a Dexterity (Stealth) check contested by the target's Wisdom (Perception) check. If your check succeeds, you gain a +10 bonus to the first attack roll you make against the target before the end of your next turn. If your check fails, you are no longer hidden from the target.\n\n***Angle (Perception).*** You attempt to predict the behavior of a humanoid you can see within 30 feet. Make a Wisdom (Perception) check contested by the target's Dexterity (Sleight of Hand) check. If your check succeeds, the first attack roll the target makes before the start of your next turn has disadvantage, and the first saving throw the creature makes before the start of your next turn has disadvantage. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Battle Cry (Intimidation).*** You attempt to demoralize one humanoid you can see within 30 feet of you that can see and hear you. Make a Charisma (Intimidation) check contested by the target's Wisdom (Insight) check. If your check succeeds, the target is frightened until the end of your next turn. If the target was already frightened of you, it must immediately drop whatever it is holding. On its next turn, if it is still frightened of you, it must take the Dash action and move away from you by the safest available route on its turn, unless there is nowhere to move. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Charm (Persuasion).*** You attempt to convince one humanoid you can see within 30 feet that can hear and understand you. Make a Charisma (Persuasion) check contested by the target's Wisdom (Insight) check. If you have dealt damage to the creature in the last hour, it has advantage on the check. If your check succeeds, the target is charmed by you until the start of your next turn, and it has disadvantage on the first attack roll it makes against a creature before the end of its next turn. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Confuse Beast (Animal Handling).*** You attempt to confuse one beast on the battlefield. Make a Wisdom (Animal Handling) check contested by the target's Wisdom (Insight) check. If your check succeeds, the beast cannot take actions or reactions until the end of your next turn. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Distract (Performance).*** You attempt to distract one beast or humanoid you can see within 30 feet of you that can see and hear you. Make a Charisma (Performance) check contested by the target's Wisdom (Insight) check. If your check succeeds, the next attack roll made against the target before the start of its next turn has advantage. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Emulate Predator (Nature).*** You attempt to emulate the sounds of a natural predator of a beast or plant you can see within 30 feet. Make an Intelligence (Nature) check contested by the target's Wisdom (Insight) check. If your check succeeds, the target must take the Dash action and move away from you by the safest available route on its turn, unless there is nowhere to move. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Feint (Deception).*** You attempt to divert the attention of a target you can see within 30 feet. Make a Charisma (Deception) check contested by the target's Wisdom (Insight) check. If your check succeeds, the first attack roll made against the target before the start of \n\nyour next turn by someone other than you has advantage, and the target has disadvantage on the first saving throw they make against an effect caused by a creature other than you before the start of your next turn. If your check fails, the target can't be deceived by you in this way for 1 hour.\n\n***Hacktivate (Technology).*** You attempt to determine the weaknesses in a droid you can see within 30 feet. Make an Intelligence (Technology) check contested by the target's Intelligence (Technology) check. If your check succeeds, you have advantage on the next attack roll you make against the target before the end of your turn, and if you hit, you deal additional damage equal to your Intelligence modifier. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Instruct (Investigation).*** You attempt to find a weakness in your target. Make an Intelligence (Investigation) check contested by the target's Charisma (Deception) check. If your check succeeds, if a friendly creature makes an attack roll against the target and they can see and hear you, you can use your reaction to grant them advantage on the roll. If you do so, and they hit, they deal additional damage equal to your bonus to Investigation checks. This damage is the same type as the attack's damage. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Intuit (Insight).*** You attempt to determine the motivations of one humanoid you can see within 30 feet. Make a Wisdom (Insight) check contested by the target's Charisma (Deception) check. If your check succeeds, the target can't have advantage on ability checks, attack rolls, or saving throws against you until the end of your next turn. If your check fails, the target instead can't have disadvantage on ability checks, attack rolls, or saving throws against you until the end of your next turn.\n\n***Pocket Sand (Sleight of Hand).*** You attempt to blind one beast or humanoid you can see within 15 feet of you. Make a Dexterity (Sleight of Hand) check contested by the target's Wisdom (Perception) check. If your check succeeds, the target is blinded until the end of your turn. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Precision Strike (Medicine).*** You attempt to strike a pressure point in one humanoid within your reach. Make a Wisdom (Medicine) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If your check succeeds, they are incapacitated until the end of their next turn. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Snare (Survival).*** You attempt to cause a creature within 30 feet of you to stumble. Make a Wisdom (Survival) check contested by the target's Wisdom (Perception) check. If your check succeeds, and the target moves towards you before the start of your next turn, it gains 1 slowed level, and you can use your reaction to cause it to fall prone. If your check fails, you can't use this feature on this target again for 1 hour.\n\n***Spin (Piloting).*** You attempt to confound a piloted construct you can see within 30 feet. Make an \n\nIntelligence (Piloting) check contested by the target's Intelligence (Piloting) check. If your check succeeds, the target has disadvantage on attack rolls against you, and you have advantage on Dexterity saving throws against the target, until the start of your next turn. If your check fails, the target instead has advantage on attack rolls against you, and you have disadvantage on Dexterity saving throws against the target, until the start of your next turn.\n\n***Study (Lore).*** You attempt to anticipate your target's action. Make an Intelligence (Lore) check contested by the target's Charisma (Deception) check. If your check succeeds, you have advantage on the first ability check, attack roll or saving throw you make against that creature before the end of your next turn. Alternatively, before the end of your next turn, you can use your reaction to grant disadvantage on the first ability check, attack roll, or saving throw the target makes against you. If your check fails, you instead have disadvantage on the first ability check, attack roll or saving throw you make against that creature before the end of your next turn.\n\n***Tumble (Acrobatics).*** You attempt to make a quick tumble, immediately moving 10 feet. If you begin or end this movement within a creature's reach, make a Dexterity (Acrobatics) check contested by it's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If your check succeeds, this movement does not provoke opportunity attacks from it, and you have advantage on the first attack roll you make against it before the end of your turn. If your check fails, you immediately fall prone.\n\n***Wrestle (Athletics).*** You attempt to grab and pin a creature within 5 feet of you with at least one free hand. The target must be no more than one size larger than you. Make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If your check succeeds, the target is both grappled and restrained by you. If the target stops being grappled, it also stops being restrained. If your check fails, you can't use this feature on this target again for 1 hour.",
    "summary": "Learn a combat skill exploit usable with the Attack action ({prof} combined uses/long rest; repeatable).",
    "effects": [
      {
        "type": "resourcePool",
        "id": "skills_exploit",
        "name": "Skill's Exploit",
        "max": "proficiency",
        "recharge": "long",
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Aim (Stealth)",
        "summary": "Attack action: Dexterity (Stealth) vs target's Wisdom (Perception) while hidden for +10 to first attack roll against target before end of your next turn; fail ends Hidden.",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "when": {
          "choice": "Stealth"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Angle (Perception)",
        "summary": "Attack action (30 ft., humanoid): Wisdom (Perception) vs target's Dexterity (Sleight of Hand); target has disadvantage on its first attack roll and first saving throw before start of your next turn (fail: 1-hour cooldown on target).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "when": {
          "choice": "Perception"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Battle Cry (Intimidation)",
        "summary": "Attack action (30 ft., humanoid): Charisma (Intimidation) vs target's Wisdom (Insight); target is frightened until end of your next turn (if already frightened, drops held items and must Dash away on its next turn; fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "when": {
          "choice": "Intimidation"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Charm (Persuasion)",
        "summary": "Attack action (30 ft., humanoid; target has advantage if damaged by you in last hour): Charisma (Persuasion) vs Wisdom (Insight); target charmed until start of your next turn and disadvantage on first attack before end of its next turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "when": {
          "choice": "Persuasion"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Confuse Beast (Animal Handling)",
        "summary": "Attack action (beast): Wisdom (Animal Handling) vs target's Wisdom (Insight); target can't take actions or reactions until end of your next turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "when": {
          "choice": "Animal Handling"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Distract (Performance)",
        "summary": "Attack action (30 ft., beast or humanoid): Charisma (Performance) vs target's Wisdom (Insight); next attack roll against target before start of its next turn has advantage (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfTargetNextTurn"
        },
        "when": {
          "choice": "Performance"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Emulate Predator (Nature)",
        "summary": "Attack action (30 ft., beast or plant): Intelligence (Nature) vs target's Wisdom (Insight); target must take the Dash action and move away from you by the safest route on its turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfTargetTurn"
        },
        "when": {
          "choice": "Nature"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Feint (Deception)",
        "summary": "Attack action (30 ft.): Charisma (Deception) vs target's Wisdom (Insight); first attack by another creature has advantage and target has disadvantage on first save vs another creature's effect before start of your next turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "when": {
          "choice": "Deception"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Hacktivate (Technology)",
        "summary": "Attack action (30 ft., droid): Intelligence (Technology) vs target's Intelligence (Technology); advantage on next attack against target before end of your turn and +{intMod} bonus damage on hit (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnTurn"
        },
        "when": {
          "choice": "Technology"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Instruct (Investigation)",
        "summary": "Attack action: Intelligence (Investigation) vs target's Charisma (Deception); enables reaction when an ally attacks target to grant advantage and {investigationBonus} bonus damage on hit (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "onUse"
        },
        "when": {
          "choice": "Investigation"
        }
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "name": "Instruct — Grant Advantage",
        "summary": "When a friendly creature who can see and hear you attacks your Instruct target, grant advantage and {investigationBonus} bonus damage (same type) on hit.",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "choice": "Investigation"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Intuit (Insight)",
        "summary": "Attack action (30 ft., humanoid): Wisdom (Insight) vs target's Charisma (Deception); target can't have advantage against you until end of your next turn (fail: can't have disadvantage against you until end of your next turn).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "when": {
          "choice": "Insight"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Pocket Sand (Sleight of Hand)",
        "summary": "Attack action (15 ft., beast or humanoid): Dexterity (Sleight of Hand) vs target's Wisdom (Perception); target is blinded until end of your turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnTurn"
        },
        "when": {
          "choice": "Sleight of Hand"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Precision Strike (Medicine)",
        "summary": "Attack action (reach, humanoid): Wisdom (Medicine) vs target's Strength (Athletics) or Dexterity (Acrobatics); target is incapacitated until end of its next turn (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfTargetNextTurn"
        },
        "when": {
          "choice": "Medicine"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Snare (Survival)",
        "summary": "Attack action (30 ft.): Wisdom (Survival) vs target's Wisdom (Perception); if target moves toward you before start of your next turn, it gains 1 slowed level and you can use your reaction to knock it prone (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "when": {
          "choice": "Survival"
        }
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "name": "Snare — Trip Prone",
        "summary": "When your Snare target moves toward you before the start of your next turn (gaining 1 slowed level), cause it to fall prone.",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "choice": "Survival"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Spin (Piloting)",
        "summary": "Attack action (30 ft., piloted construct): Intelligence (Piloting) vs target's Intelligence (Piloting); target has disadvantage on attacks against you and you have advantage on Dexterity saves against it until start of your next turn (fail: reversed).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "when": {
          "choice": "Piloting"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Study (Lore)",
        "summary": "Attack action: Intelligence (Lore) vs target's Charisma (Deception); advantage on your first check, attack, or save vs target before end of your next turn, or use your reaction to impose disadvantage on its first check, attack, or save vs you (fail: you have disadvantage).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnNextTurn"
        },
        "when": {
          "choice": "Lore"
        }
      },
      {
        "type": "actionGrant",
        "zone": "reaction",
        "reactionKind": "standard",
        "name": "Study — Impose Disadvantage",
        "summary": "Grant disadvantage on the first ability check, attack roll, or saving throw your Study target makes against you before the end of your next turn.",
        "durationSpec": {
          "anchor": "instant"
        },
        "when": {
          "choice": "Lore"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Tumble (Acrobatics)",
        "summary": "Attack action: Immediately move 10 ft.; if starting or ending in a creature's reach, Dexterity (Acrobatics) vs its Strength (Athletics) or Dexterity (Acrobatics) to avoid opportunity attacks and gain advantage on your first attack against it before end of turn (fail: fall prone).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "endOfOwnTurn"
        },
        "when": {
          "choice": "Acrobatics"
        }
      },
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Wrestle (Athletics)",
        "summary": "Attack action (5 ft., free hand, at most one size larger): Strength (Athletics) vs target's Strength (Athletics) or Dexterity (Acrobatics); target is grappled and restrained while grappled (fail: 1-hour cooldown).",
        "resourceId": "skills_exploit",
        "durationSpec": {
          "anchor": "onUse"
        },
        "when": {
          "choice": "Athletics"
        }
      }
    ]
  },
  {
    "name": "Technologist's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "techPowerLevel1",
      "count": 1,
      "distinctChoice": true,
      "label": "1st-level Tech Power"
    },
    "description": "You learn and can cast one 1st-level tech power once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for this power.\n\nYou can select this exploit multiple times. Each time you do so, you must choose a different power.",
    "summary": "Learn and cast one 1st-level tech power once per long rest using Intelligence (requires wristpad; repeatable).",
    "effects": [
      {
        "type": "grantPower",
        "power": "$choice",
        "powerType": "Tech",
        "castingAbility": "Intelligence",
        "freeCasts": 1,
        "recharge": "long",
        "countsAgainstKnown": false,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Technologist's Exploit",
        "text": "Cast each chosen 1st-level tech power 1/long rest using Intelligence (requires a wristpad)."
      }
    ]
  },
  {
    "name": "Weaponmaster's Exploit",
    "className": "Operative",
    "poolName": "Operative Exploits",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "lightBlastersOrVibro",
      "count": 3,
      "distinctChoice": true,
      "label": "Blasters or vibroweapons without heavy/strength (choose 3)"
    },
    "description": "You gain proficiency in three blasters or vibroweapons that lack the heavy and strength properties.\n\nYou can select this exploit multiple times. Each time you do so, you must choose different weapons.",
    "summary": "Gain proficiency in three blasters or vibroweapons lacking the heavy and strength properties (repeatable).",
    "effects": [
      {
        "type": "proficiency",
        "kind": "weapon",
        "target": "$choice",
        "rank": 1,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Academic Memory",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You can recall anything you have read in the past month that you understand. This includes but is not limited to books, maps, signs, and lists.",
    "summary": "Recall anything you have read and understood in the past month.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Academic Memory",
        "text": "Recall anything you have read and understood in the past month (books, maps, signs, lists)."
      }
    ]
  },
  {
    "name": "Adaptive",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "15th level",
    "minLevel": 15,
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When the target of your Critical Analysis feature is reduced to 0 hit points, you can use your reaction to change the target of your analysis to another creature within range.",
    "summary": "Reaction when your Critical Analysis target drops to 0 HP: switch Critical Analysis to another creature in range.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Adaptive",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "When your Critical Analysis target drops to 0 HP: switch Critical Analysis to another creature in range."
      }
    ]
  },
  {
    "name": "Ambassador",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "languages",
      "count": 3,
      "distinctChoice": true,
      "label": "Languages (choose 3)"
    },
    "description": "You learn three additional languages of your choice.\n\nYou may choose this discovery multiple times.",
    "summary": "Learn three additional languages (repeatable).",
    "effects": [
      {
        "type": "proficiency",
        "kind": "language",
        "target": "$choice",
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Clever Applications",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You gain proficiency with improvised weapons, and they gain the finesse property for you. Additionally, when you make an attack with an improvised weapon, it deals 1d6 damage.\n\nYou can use your Sage Advice feature to give friendly creatures improvised weapon proficiency if they don't already have it, following the same rules of that feature as if it were a skill or tool. The friendly creatures retain this proficiency for the entire duration instead.",
    "summary": "Proficiency with improvised weapons (1d6 finesse); share improvised weapon proficiency via Sage Advice for the full 1-hour duration.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "weapon",
        "target": "Improvised Weapons"
      },
      {
        "type": "weaponRule",
        "kind": "improvisedWeapon",
        "params": {
          "die": "1d6",
          "finesse": true
        },
        "note": "Improvised weapons deal 1d6 damage and gain the finesse property."
      },
      {
        "type": "combatTrait",
        "kind": "sageAdviceImprovised",
        "note": "Can share improvised weapon proficiency via Sage Advice for the full 1-hour duration."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Clever Applications",
        "text": "Proficient with improvised weapons (1d6 damage, finesse); can share improvised weapon proficiency via Sage Advice for the full 1-hour duration."
      }
    ]
  },
  {
    "name": "Expert's Advice",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you use your Sage Advice feature, the first time each targeted creature makes the chosen skill check, they gain an additional bonus to the roll equal to half your Critical Analysis ability modifier.",
    "summary": "Sage Advice targets add +{halfCaMod} (half your Critical Analysis modifier) to their first check with the chosen skill.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Expert's Advice",
        "text": "Sage Advice targets add +{halfCaMod} (half Critical Analysis modifier) to their first check with the chosen skill."
      }
    ]
  },
  {
    "name": "Hardened Mind",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "9th level",
    "minLevel": 9,
    "description": "You have advantage on saving throws against illusions and on Intelligence checks to discern them from reality.\n\nYou also gain resistance to psychic damage.",
    "summary": "Advantage on saving throws and Intelligence checks against illusions; resistance to psychic damage.",
    "effects": [
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "psychic"
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against illusions"
      },
      {
        "type": "conditionalCheckMod",
        "ability": "Intelligence",
        "mode": "advantage",
        "condition": "discerning illusions from reality"
      }
    ]
  },
  {
    "name": "Lifelong Learning",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "skillsOrTools",
      "count": 2,
      "maxSkills": 1,
      "distinctChoice": true,
      "label": "1 skill & 1 tool, or 2 tools (choose 2)"
    },
    "description": "You gain proficiency in a skill and a tool, or two tools.\n\nYou can select this discovery multiple times, each time choosing a new skill and a tool, or two new tools.",
    "summary": "Gain proficiency in one skill and one tool, or two tools (repeatable).",
    "effects": [
      {
        "type": "proficiency",
        "kind": "skillOrTool",
        "target": "$choice",
        "rank": 1,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      }
    ]
  },
  {
    "name": "Lingering Advice",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "5th level",
    "minLevel": 5,
    "description": "When you use your Sage Advice feature, the targeted creatures retain the benefit from your instruction for the full duration.",
    "summary": "Sage Advice targets retain your instruction benefit for the full 1-hour duration.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Lingering Advice",
        "text": "Sage Advice targets retain your instruction benefit for the full 1-hour duration."
      }
    ]
  },
  {
    "name": "Malleable Maneuvering",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "maneuvers",
      "count": 2,
      "distinctChoice": true,
      "label": "Maneuvers (choose 2)"
    },
    "description": "You learn two additional maneuvers. When you complete a short rest, you can replace one of these maneuvers with another one. When you complete a long rest, you can replace both of these maneuvers with other ones.",
    "summary": "Learn two additional maneuvers; swap one on a short rest or both on a long rest.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "maneuver",
        "count": 2
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Malleable Maneuvering",
        "text": "Replace 1 of these maneuvers on a short rest, or both on a long rest."
      }
    ]
  },
  {
    "name": "Master's Advice",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "11th level, Expert's Advice",
    "minLevel": 11,
    "description": "When you use your Sage Advice feature, the first time each targeted creature makes the chosen skill check, they gain an additional bonus to the roll equal to your Critical Analysis ability modifier.",
    "summary": "Sage Advice targets add +{caMod} (full Critical Analysis modifier) to their first check with the chosen skill.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Master's Advice",
        "text": "Sage Advice targets add +{caMod} (Critical Analysis modifier) to their first check with the chosen skill."
      }
    ]
  },
  {
    "name": "Mental Prowess",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you make a Strength (Athletics) or Dexterity (Acrobatics) check to grapple a creature or break out of a grapple, net, and other restraining equipment, you can use your Critical Analysis ability modifier instead of Strength or Dexterity.",
    "summary": "Use your Critical Analysis modifier ({caAbility}, +{caMod}) instead of Strength or Dexterity to grapple or escape grapples and restraints.",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Athletics",
          "Acrobatics"
        ],
        "mode": "note",
        "condition": "Use {caAbility} (+{caMod}) instead of Strength or Dexterity to grapple or escape grapples/restraints"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "skills": [
          "Athletics",
          "Acrobatics"
        ],
        "title": "Mental Prowess",
        "text": "Use {caAbility} (+{caMod}) instead of Strength or Dexterity to grapple or escape grapples/restraints."
      }
    ]
  },
  {
    "name": "Moderately Armored",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "5th level",
    "minLevel": 5,
    "description": "You gain proficiency in medium armor.",
    "summary": "Gain proficiency in medium armor.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "armor",
        "target": "Medium"
      }
    ]
  },
  {
    "name": "Perfect Maneuver",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "Your superiority die rolls gain a minimum roll threshold, discussed in chapter 7.",
    "summary": "Your superiority die rolls gain a Chapter 7 minimum roll threshold ({supMinRoll} on {supDie}).",
    "effects": [
      {
        "type": "rollFloor",
        "scope": "superiorityDie",
        "minRoll": "chapter7",
        "note": "Superiority dice gain a Chapter 7 minimum roll threshold ({supMinRoll} on {supDie})."
      },
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Perfect Maneuver",
        "text": "Superiority dice gain a Chapter 7 minimum roll threshold ({supMinRoll} on {supDie})."
      }
    ]
  },
  {
    "name": "Quick Analysis",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "9th level",
    "minLevel": 9,
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you roll initiative and aren't surprised, you can use your reaction to use your Critical Analysis feature.",
    "summary": "Reaction when rolling initiative (if not surprised) to activate Critical Analysis.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "reaction",
        "name": "Quick Analysis",
        "reactionKind": "standard",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "When rolling initiative (if not surprised): activate Critical Analysis as a reaction."
      }
    ]
  },
  {
    "name": "Rancor's Discipline",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "rancorDisciplineAbility",
      "count": 1,
      "label": "Substitute ability (Wisdom or Charisma)"
    },
    "description": "You can substitute Wisdom or Charisma (chosen when you study this discipline) for Intelligence for your scholar class features, except for other discoveries and Academic Pursuit features.",
    "summary": "Substitute Wisdom or Charisma for Intelligence in base Scholar class features (except other discoveries and Academic Pursuit).",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "scholarAbilityOverride",
        "ability": "$choice",
        "baseClassOnly": true,
        "note": "Substitute $choice for Intelligence in base Scholar class features (except other discoveries and Academic Pursuit features)."
      }
    ]
  },
  {
    "name": "Reliable Sources",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "9th level",
    "minLevel": 9,
    "description": "Intelligence (Lore) or Intelligence (Nature) skill check that lets you add your proficiency bonus gain a minimum roll threshold, discussed in chapter 7.",
    "summary": "Proficient Intelligence (Lore) and Intelligence (Nature) checks gain a Chapter 7 minimum roll threshold (8).",
    "effects": [
      {
        "type": "rollFloor",
        "scope": "skill",
        "filter": "Lore",
        "minRoll": 8,
        "requiresProficiency": true
      },
      {
        "type": "rollFloor",
        "scope": "skill",
        "filter": "Nature",
        "minRoll": 8,
        "requiresProficiency": true
      }
    ]
  },
  {
    "name": "Resolute",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you make a saving throw to resist charm and fear effects, you may add your Intelligence modifier to the roll.",
    "summary": "Add +{intModFloor0} (Intelligence modifier) to saving throws against charm and fear effects.",
    "effects": [
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "abilityAdd",
        "ability": "Intelligence",
        "minValue": 0,
        "condition": "against charm and fear effects"
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "title": "Resolute",
        "text": "Add +{intModFloor0} (Intelligence modifier) to saving throws against charm and fear effects."
      }
    ]
  },
  {
    "name": "Running on Fumes",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You only need 3 hours of sleep during a long rest to gain its benefits, instead of 6. Additionally, if your long rest would be interrupted, you only need to complete the long rest instead of restarting it to gain its benefits. Lastly, you have advantage on saving throws against exhaustion.",
    "summary": "Only 3 hours of sleep needed for a long rest, interruptions do not reset the rest, and advantage on saving throws against exhaustion.",
    "effects": [
      {
        "type": "biologyRule",
        "kind": "restMod",
        "note": "Only 3 hours of sleep needed for a long rest (instead of 6); interrupted long rests resume without restarting."
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Running on Fumes",
        "text": "Only 3 hours of sleep needed for a long rest; interruptions do not reset the rest."
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against exhaustion"
      }
    ]
  },
  {
    "name": "Survival Expert",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "When you make a Survival skill check, you may use your Critical Analysis ability modifier instead of your Wisdom modifier.\n\nAdditionally, you have advantage on saving throws against poison.",
    "summary": "Use your Critical Analysis modifier ({caAbility}) for Survival checks; advantage on saving throws against poison.",
    "effects": [
      {
        "type": "skillAbilityOverride",
        "skill": "Survival",
        "ability": "$caAbility",
        "mode": "highest",
        "note": "Use your Critical Analysis modifier ({caAbility}) instead of Wisdom for Survival checks."
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against poison"
      }
    ]
  },
  {
    "name": "Targeted Analysis",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "5th level",
    "minLevel": 5,
    "description": "Your attack rolls against the target of your Critical Analysis feature cannot suffer from disadvantage.",
    "summary": "Your attack rolls against your Critical Analysis target cannot suffer from disadvantage.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "noDisadvVsAnalyzedTarget",
        "note": "Attack rolls against your Critical Analysis target cannot suffer from disadvantage."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Targeted Analysis",
        "text": "Your attack rolls against your Critical Analysis target cannot suffer from disadvantage."
      }
    ]
  },
  {
    "name": "Tech Amateur",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "repeatable": true,
    "choiceSpec": {
      "kind": "techPowerLevel1",
      "count": 1,
      "distinctChoice": true,
      "label": "1st-level Tech Power"
    },
    "description": "You learn and can cast one 1st-level tech power once per long rest. Your techcasting ability is Intelligence. You require use of a wristpad for this power.\n\nYou can select this discovery multiple times. Each time you do so, you must choose a different power.",
    "summary": "Learn and cast one 1st-level tech power once per long rest using Intelligence (requires wristpad; repeatable).",
    "effects": [
      {
        "type": "grantPower",
        "power": "$choice",
        "powerType": "Tech",
        "castingAbility": "Intelligence",
        "freeCasts": 1,
        "recharge": "long",
        "countsAgainstKnown": false,
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        }
      },
      {
        "type": "contextualNote",
        "surface": "casting",
        "title": "Tech Amateur",
        "text": "Cast each chosen 1st-level tech power 1/long rest using Intelligence (requires a wristpad)."
      }
    ]
  },
  {
    "name": "Universal Language",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "description": "You can communicate simple ideas with any creature with an Intelligence score of 6 or higher through basic expressions and gestures.",
    "summary": "Communicate simple ideas with any creature of Intelligence 6+ via expressions and gestures.",
    "effects": [
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Universal Language",
        "text": "Communicate simple ideas with any creature of Intelligence 6+ via expressions and gestures."
      }
    ]
  },
  {
    "name": "Versatile Maneuvers",
    "className": "Scholar",
    "poolName": "Discoveries",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "knownManeuvers",
      "baseCount": 2,
      "countSchedule": [
        5,
        9,
        13,
        17
      ],
      "distinctChoice": true,
      "label": "Known maneuvers to treat as general"
    },
    "description": "Choose two maneuvers you know. The chosen maneuvers count as general maneuvers for you. You can choose another maneuver at 5th, 9th, 13th, and 17th level. Whenever you gain a level in this class, you can replace one of these maneuvers with another maneuver you know.",
    "summary": "Treat {versatileCount} known maneuvers as general maneuvers; swap one on level up.",
    "effects": [
      {
        "type": "combatTrait",
        "kind": "generalManeuverOverride",
        "target": "$choice",
        "forEachChoice": true,
        "when": {
          "hasChoice": true
        },
        "note": "$choice counts as a general maneuver."
      },
      {
        "type": "contextualNote",
        "surface": "combat.special",
        "title": "Versatile Maneuvers",
        "text": "Up to {versatileCount} chosen maneuvers count as general maneuvers (swap 1 on level up)."
      }
    ]
  },
  {
    "name": "Adaptability Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Choose a non-proficient saving throw (+{halfProf}) for yourself or allies within {routineRadius} until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose an ability score with a saving throw in which you are not proficient. Until the start of your next turn, you add half your proficiency bonus to saving throws you make with the chosen ability. Alternatively, \n\nyou can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: add +{halfProf} to one non-proficient saving throw (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Adaptability Routine",
        "effect": "pickNonProfSave",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Choose a non-proficient saving throw (+{halfProf}) for yourself or allies within {routineRadius} until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: pick a non-proficient saving throw (+{halfProf}) for yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "contextualNote",
        "surface": "saves",
        "title": "Adaptability Routine",
        "text": "Start of turn: add +{halfProf} to one non-proficient saving throw (self or allies within {routineRadius}).",
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Maven's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Grant resistance to damage from tech powers (self or allies within {routineRadius}) until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose to gain resistance to damage from tech powers until the start of your next turn. Alternatively, you can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: gain resistance to damage from tech powers (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Maven's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "Resistance to damage from tech powers",
        "allyNote": "Resistance to damage from tech powers",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant resistance to damage from tech powers (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: grant resistance to damage from tech powers to yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "defense",
        "kind": "resistance",
        "damageType": "tech power damage",
        "condition": "while conscious (self or allies within {routineRadius})",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant resistance to damage from tech powers (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "activeEffect": "Maven's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Mesmer's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Grant advantage on saves against effects that incapacitate or put you to sleep (self or allies within {routineRadius}) until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose to have advantage on saving throws against effects that would incapacitate you or put you to sleep until the start of your next turn. Alternatively, you can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: advantage on saves against incapacitation and sleep (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Mesmer's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "Advantage on saves against Incapacitated or sleep",
        "allyNote": "Advantage on saves against Incapacitated or sleep",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant advantage on saves against effects that incapacitate or put you to sleep (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: grant advantage on saves against effects that incapacitate or put to sleep to yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "saveMod",
        "abilities": "all",
        "mode": "advantage",
        "condition": "against Incapacitated or sleep (self or allies within {routineRadius})",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant advantage on saves against effects that incapacitate or put you to sleep (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "activeEffect": "Mesmer's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Nomad's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Grant advantage on Constitution saves against unenhanced exhaustion and hot/cold climate adaptation (self or allies within {routineRadius}) until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose to gain advantage on Constitution saving throws to avoid exhaustion from unenhanced sources, as well as being naturally adapted to both hot and cold climates. Alternatively, you can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: advantage on Constitution saves against unenhanced exhaustion and adapted to hot and cold climates (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Nomad's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "Advantage on Constitution saves vs unenhanced exhaustion; adapted to hot/cold climates",
        "allyNote": "Advantage on Constitution saves vs unenhanced exhaustion and hot/cold climate adaptation",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant advantage on Constitution saves against unenhanced exhaustion and hot/cold climate adaptation (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: grant advantage on Constitution saves against unenhanced exhaustion and hot/cold climate adaptation to yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "saveMod",
        "abilities": [
          "Constitution"
        ],
        "mode": "advantage",
        "condition": "against unenhanced exhaustion (self or allies within {routineRadius})",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant advantage on Constitution saves against unenhanced exhaustion and hot/cold climate adaptation (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "activeEffect": "Nomad's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "contextualNote",
        "surface": "defenses",
        "title": "Nomad's Routine",
        "text": "Naturally adapted to hot and cold climates (self or allies within {routineRadius}).",
        "when": {
          "activeEffect": "Nomad's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Responder's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "onUse"
    },
    "description": "When you roll initiative, you can choose to add your proficiency bonus to the initiative check and have advantage on attack rolls against creatures that have not yet acted. Alternatively, you can choose to allow each friendly creature within 5 feet of you to add half your proficiency bonus to the initiative check and have advantage on the first attack roll they make against a creature that has not yet acted.",
    "summary": "On Initiative: add +{prof} to Initiative and advantage on attacks against creatures that have not yet acted (allies within {routineRadius}: +{halfProf} Initiative and advantage on first attack).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Responder's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "+{prof} Initiative and advantage on attacks vs creatures that haven't acted yet",
        "allyNote": "+{halfProf} Initiative and advantage on first attack vs creatures that haven't acted yet",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "onUse"
        },
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "On Initiative: +{prof} Initiative & advantage on attacks vs unacted creatures (self), or +{halfProf} Initiative & advantage on first attack (allies within {routineRadius})."
      },
      {
        "type": "initiativeMod",
        "proficiency": true,
        "when": {
          "activeEffect": "Responder's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Responder's Routine",
        "text": "On Initiative: add +{prof} to Initiative and advantage on attacks against creatures that haven't acted yet (or allies within {routineRadius}: +{halfProf} Initiative and advantage on first attack).",
        "when": {
          "activeEffect": "Responder's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Sharpshooter's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Grant +{intModFloor0} to your first weapon attack before your next turn (or +{halfIntModFloor0} for allies within {routineRadius})."
      }
    ],
    "description": "At the start of each of your turns, you can choose to gain a bonus to the first weapon attack roll you make before the start of your next turn equal to your Intelligence modifier. Alternatively, you can choose to allow each friendly creature within 5 feet of you to add half your Intelligence modifier to the first weapon attack roll they make before the start of your next turn.",
    "summary": "Start of turn: add +{intModFloor0} (Intelligence modifier; +{halfIntModFloor0} for allies within {routineRadius}) to the first weapon attack roll before your next turn.",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Sharpshooter's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "+{intModFloor0} to first weapon attack roll before your next turn",
        "allyNote": "+{halfIntModFloor0} to first weapon attack roll before your next turn",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant +{intModFloor0} to your first weapon attack before your next turn (or +{halfIntModFloor0} for allies within {routineRadius})."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: +{intModFloor0} to your first weapon attack before your next turn (self), or +{halfIntModFloor0} for allies within {routineRadius}."
      },
      {
        "type": "attackDamageMod",
        "scope": "weapon",
        "attackBonus": "{intModFloor0}",
        "oncePerTurn": true,
        "note": "+{intModFloor0} hit (Sharpshooter's Routine, 1st weapon attack/turn, {routineRadius})",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant +{intModFloor0} to your first weapon attack before your next turn (or +{halfIntModFloor0} for allies within {routineRadius})."
          }
        ],
        "when": {
          "activeEffect": "Sharpshooter's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Sharpshooter's Routine",
        "text": "Start of turn: +{intModFloor0} to your first weapon attack before your next turn (or +{halfIntModFloor0} for allies within {routineRadius}).",
        "when": {
          "activeEffect": "Sharpshooter's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Strider's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Each slowed level reduces speed by only 5 ft unless reduced to 0 (self or allies within {routineRadius}) until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose to have each slowed level only reduce your speed by 5 feet, unless it would reduce your speed to 0 until the start of your next turn. Alternatively, you can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: slowed levels reduce speed by only 5 ft instead of 10 ft (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Strider's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "Each slowed level reduces speed by only 5 ft (unless reduced to 0)",
        "allyNote": "Each slowed level reduces speed by only 5 ft (unless reduced to 0)",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Each slowed level reduces speed by only 5 ft unless reduced to 0 (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: each slowed level reduces speed by only 5 ft (unless reduced to 0) for yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "speed",
        "mode": "walk",
        "slowedStep": 5,
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Each slowed level reduces speed by only 5 ft unless reduced to 0 (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "activeEffect": "Strider's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Warden's Routine",
    "className": "Scout",
    "poolName": "Scout Routines",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "startOfOwnNextTurn"
    },
    "turnTriggers": [
      {
        "timing": "startOfTurn",
        "actor": "self",
        "kind": "choice",
        "inArea": true,
        "note": "Grant crawling, climbing, and swimming speeds equal to walking speed (self or allies within {routineRadius}) until the start of your next turn."
      }
    ],
    "description": "At the start of each of your turns, you can choose to gain a crawling, climbing, and swimming speed equal to your walking speed until the start of your next turn. Alternatively, you can choose to extend this benefit to allies within 5 feet of you.",
    "summary": "Start of turn: gain crawling, climbing, and swimming speeds equal to walking speed (self or allies within {routineRadius}).",
    "effects": [
      {
        "type": "actionGrant",
        "zone": "special",
        "name": "Warden's Routine",
        "targetScope": "selfOrAllies",
        "auraRadius": "{routineRadius}",
        "selfNote": "Crawling, climbing, and swimming speeds equal to walking speed",
        "allyNote": "Crawling, climbing, and swimming speeds equal to walking speed",
        "cadence": "oncePerTurn",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant crawling, climbing, and swimming speeds equal to walking speed (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        },
        "summary": "Start of turn: grant crawling, climbing, and swimming speeds equal to walking speed to yourself or allies within {routineRadius} until the start of your next turn."
      },
      {
        "type": "speed",
        "mode": "climb",
        "base": "walk",
        "durationSpec": {
          "anchor": "startOfOwnNextTurn"
        },
        "turnTriggers": [
          {
            "timing": "startOfTurn",
            "actor": "self",
            "kind": "choice",
            "inArea": true,
            "note": "Grant crawling, climbing, and swimming speeds equal to walking speed (self or allies within {routineRadius}) until the start of your next turn."
          }
        ],
        "when": {
          "activeEffect": "Warden's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "speed",
        "mode": "swim",
        "base": "walk",
        "when": {
          "activeEffect": "Warden's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      },
      {
        "type": "speed",
        "mode": "crawl",
        "base": "walk",
        "when": {
          "activeEffect": "Warden's Routine",
          "activeEffectTarget": "self",
          "notConditions": [
            "Unconscious",
            "Dead"
          ]
        }
      }
    ]
  },
  {
    "name": "Ideal of the Agile",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "You gain a swimming speed and a climbing speed equal to your walking speed. When you make a long jump, you can cover a number of feet up to twice your Wisdom or Charisma score (your choice). When you make a high jump, you can leap a number of feet up into the air equal to 3 + twice your Wisdom or Charisma modifier (your choice).\n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, opportunity attacks against you are made with disadvantage.",
    "summary": "Climb & swim speed = walk; long jump {2xWisChaScore} ft, high jump {highJumpWisCha} ft; manifest (bonus action, 1 minute): opportunity attacks vs you have disadvantage.",
    "effects": [
      {
        "type": "speed",
        "mode": "climb",
        "base": "walk"
      },
      {
        "type": "speed",
        "mode": "swim",
        "base": "walk"
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Ideal of the Agile",
        "text": "Long jump up to {2xWisChaScore} ft (2× Wisdom/Charisma score); high jump {highJumpWisCha} ft (3 + 2× Wisdom/Charisma modifier)."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Agile",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Agile",
          "note": "Opportunity attacks against you are made with disadvantage."
        },
        "summary": "Manifest (1 minute): opportunity attacks against you are made with disadvantage."
      },
      {
        "type": "combatTrait",
        "kind": "oaDisadvantage",
        "when": {
          "activeEffect": "Ideal of the Agile"
        },
        "note": "Opportunity attacks against you are made with disadvantage (Ideal of the Agile)."
      }
    ]
  },
  {
    "name": "Ideal of the Artisan",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "proficientSkillsOrTools",
      "count": 1,
      "label": "Proficient skill or tool for Ideal of the Artisan"
    },
    "durationSpec": {
      "anchor": "timed",
      "value": 10,
      "unit": "minute"
    },
    "description": "Choose one of your skill or tool proficiencies. When you make an ability check with the chosen skill or tool, you can add half your Wisdom or Charisma modifier (your choice, minimum of one).\n\nAdditionally, as an action, you can manifest this ideal in a brief surge of energy. For the next 10 minutes, the bonus increases to your Wisdom or Charisma modifier, and you can choose a second skill or tool to extend this feature to.",
    "summary": "Add +{halfForceMod} to chosen proficient skill/tool; manifest (action, 10 minutes): +{wisChaMod} on two skills or tools.",
    "effects": [
      {
        "type": "conditionalCheckMod",
        "skills": [
          "$choice"
        ],
        "mode": "bonus",
        "bonusFormula": "halfForceMod",
        "when": {
          "hasChoice": true,
          "notActiveEffect": "Ideal of the Artisan"
        }
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "$choice"
        ],
        "mode": "bonus",
        "bonusFormula": "wisChaMod",
        "when": {
          "hasChoice": true,
          "activeEffect": "Ideal of the Artisan"
        }
      },
      {
        "type": "contextualNote",
        "surface": "skills",
        "title": "Ideal of the Artisan",
        "text": "Add +{halfForceMod} to your chosen proficient skill or tool (+{wisChaMod} on two skills/tools for 10 minutes when manifested)."
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Ideal of the Artisan",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 10,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Artisan",
          "note": "Add +{wisChaMod} (full Wisdom/Charisma modifier) to two proficient skills or tools."
        },
        "summary": "Manifest (10 minutes): increase bonus to +{wisChaMod} and extend to a second proficient skill or tool."
      }
    ]
  },
  {
    "name": "Ideal of the Contender",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "Your unarmed strike damage increases by one step (from 1 to d4, d4 to d6, or d6 to d8), and your unarmed strikes gain the finesse property.\n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, your unarmed strikes count as enhanced for the purpose of overcoming resistance and immunity to unenhanced attacks and damage, and you can use your Wisdom or Charisma modifier (your choice) instead of Strength for checks made to grapple a target or escape a grapple.",
    "summary": "Unarmed strike die steps up one size and gains finesse; manifest (bonus action, 1 minute): enhanced unarmed strikes & Wisdom/Charisma grapples.",
    "effects": [
      {
        "type": "weaponRule",
        "kind": "unarmedDieStepUp",
        "params": {
          "steps": 1
        }
      },
      {
        "type": "weaponRule",
        "kind": "unarmedFinesse"
      },
      {
        "type": "weaponRule",
        "kind": "enhancedStrikes",
        "when": {
          "activeEffect": "Ideal of the Contender"
        },
        "note": "Unarmed strikes count as enhanced for overcoming resistance and immunity."
      },
      {
        "type": "conditionalCheckMod",
        "skills": [
          "Athletics",
          "Acrobatics"
        ],
        "mode": "note",
        "condition": "Use Wisdom or Charisma modifier (+{wisChaMod}) instead of Strength to grapple or escape a grapple",
        "when": {
          "activeEffect": "Ideal of the Contender"
        }
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Contender",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Contender",
          "note": "Unarmed strikes count as enhanced; use Wisdom or Charisma modifier to grapple or escape a grapple."
        },
        "summary": "Manifest (1 minute): unarmed strikes count as enhanced; use Wisdom or Charisma modifier for grapples."
      }
    ]
  },
  {
    "name": "Ideal of the Fighter",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "choiceSpec": {
      "kind": "fightingStyles",
      "count": 1,
      "label": "Fighting Style",
      "grantsRuleElementKind": "fightingStyle"
    },
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "You adopt a particular style of fighting as your specialty. Choose one of the fighting style options, detailed in Chapter 6. \n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, you know the fighting mastery that corresponds with the fighting style you chose with this feature. If you already know that fighting mastery, you instead learn another of your choice for the duration.",
    "summary": "Learn one Fighting Style; manifest (bonus action, 1 minute): gain its corresponding Fighting Mastery.",
    "effects": [
      {
        "type": "combatOptionGrant",
        "kind": "fightingStyle",
        "count": 1
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Fighter",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Fighter",
          "note": "Know the Fighting Mastery corresponding to your chosen Fighting Style (or another of your choice if already known)."
        },
        "summary": "Manifest (1 minute): gain the Fighting Mastery corresponding to your chosen Fighting Style."
      }
    ]
  },
  {
    "name": "Ideal of the Hunter",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "You gain darkvision out to a range of 60 feet. If you already have darkvision, this ideal increases its range by 30 feet.\n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, you can see normally in enhanced darkness, and you gain blindsight to 10 feet.",
    "summary": "Darkvision 60 ft (or +30 ft); manifest (bonus action, 1 minute): see in enhanced darkness and gain blindsight 10 ft.",
    "effects": [
      {
        "type": "sense",
        "kind": "darkvision",
        "range": 60,
        "extendRange": 30,
        "extend": true
      },
      {
        "type": "sense",
        "kind": "blindsight",
        "range": 10,
        "when": {
          "activeEffect": "Ideal of the Hunter"
        }
      },
      {
        "type": "sense",
        "kind": "enhancedDarkvision",
        "range": 60,
        "note": "See normally in enhanced darkness",
        "when": {
          "activeEffect": "Ideal of the Hunter"
        }
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Hunter",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Hunter",
          "note": "See normally in enhanced darkness and gain blindsight 10 ft."
        },
        "summary": "Manifest (1 minute): see normally in enhanced darkness and gain blindsight 10 ft."
      }
    ]
  },
  {
    "name": "Ideal of the Steadfast",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "When you would make a melee weapon attack roll, you can instead force the target to make a Dexterity saving throw (DC = 8 + your bonus to attacks with the weapon). If you would have advantage on your attack roll, the creature instead has disadvantage on their saving throw, and if you would have disadvantage on your attack roll, the creature instead has advantage on their saving throw. On a failed save, the target takes normal weapon damage and is subjected to any additional effects that would occur on a hit.\n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, when a creature succeeds on the saving throw, they take half the normal weapon damage, and when a creature rolls a 1 on the saving throw, they treat the damage as if you had rolled the maximum.",
    "summary": "Replace melee weapon attack roll with a Dexterity save (DC 8 + weapon attack bonus); manifest (bonus action, 1 minute): half damage on save, max damage on natural 1.",
    "effects": [
      {
        "type": "weaponRule",
        "kind": "saveConversion",
        "params": {
          "scope": "melee",
          "ability": "Dexterity"
        },
        "note": "May replace melee weapon attack roll with a Dexterity save (DC = 8 + weapon attack bonus; advantage/disadvantage flips target save)."
      },
      {
        "type": "contextualNote",
        "surface": "attacks",
        "title": "Ideal of the Steadfast",
        "text": "May replace a melee weapon attack roll with a Dexterity save (DC = 8 + weapon attack bonus; advantage/disadvantage flips target save)."
      },
      {
        "type": "critMod",
        "maxDamageOnSaveRoll": 1,
        "when": {
          "activeEffect": "Ideal of the Steadfast"
        },
        "note": "Target takes half weapon damage on a successful save and maximum damage on a natural 1."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Steadfast",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Steadfast",
          "note": "Target takes half weapon damage on a successful Dexterity save and maximum weapon damage on a natural 1."
        },
        "summary": "Manifest (1 minute): target takes half damage on successful Dexterity save and maximum damage on a natural 1."
      }
    ]
  },
  {
    "name": "Ideal of the Titan",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "timed",
      "value": 1,
      "unit": "minute"
    },
    "description": "You gain proficiency in medium armor.\n\nAdditionally, as a bonus action, you can manifest this ideal in a brief surge of energy. For the next minute, you have advantage on ability checks and attack rolls that would forcefully move another creature, and the distance they would be moved increases by 5 feet.",
    "summary": "Proficiency in medium armor; manifest (bonus action, 1 minute): advantage and +5 ft distance on forced movement.",
    "effects": [
      {
        "type": "proficiency",
        "kind": "armor",
        "target": "Medium"
      },
      {
        "type": "combatTrait",
        "kind": "forcedMoveAdvantage",
        "value": 5,
        "when": {
          "activeEffect": "Ideal of the Titan"
        },
        "note": "Advantage on ability checks and attack rolls to forcefully move a creature; +5 ft distance."
      },
      {
        "type": "actionGrant",
        "zone": "bonus",
        "name": "Ideal of the Titan",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "timed",
          "value": 1,
          "unit": "minute"
        },
        "toggleEffect": {
          "name": "Ideal of the Titan",
          "note": "Advantage on ability checks and attack rolls to forcefully move a creature, and +5 ft distance."
        },
        "summary": "Manifest (1 minute): advantage on checks & attacks to forcefully move a creature and +5 ft distance."
      }
    ]
  },
  {
    "name": "Ideal of the Tranquil",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you finish a short or long rest, you gain a number of temporary force points equal to half your Wisdom or Charisma modifier (your choice, minimum of one). When you would spend a force point while you have temporary force points, the temporary force points are spent first. All temporary force points are lost at the end of your next short or long rest.\n\nAdditionally, as an action, you can manifest this ideal in a brief surge of energy. You regain a number of force points equal to half your Wisdom or Charisma modifier (your choice, minimum of one).",
    "summary": "Gain +{halfForceMod} temporary Force points on short/long rest; manifest (action): regain +{halfForceMod} Force points.",
    "effects": [
      {
        "type": "pointPoolMod",
        "pool": "force",
        "tempGrant": "halfForceMod",
        "trigger": "shortOrLongRest",
        "note": "Gain +{halfForceMod} temporary Force points after a short or long rest (spent first; lost at end of next rest)."
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Ideal of the Tranquil",
        "text": "Gain +{halfForceMod} temporary Force points after a short or long rest (spent first)."
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Ideal of the Tranquil",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "effect": "regainForce",
        "amountFormula": "halfForceMod",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "Manifest: regain +{halfForceMod} Force points."
      }
    ]
  },
  {
    "name": "Ideal of the Vigorous",
    "className": "Sentinel",
    "poolName": "Sentinel Ideals",
    "source": "Player's Handbook",
    "prerequisite": "",
    "durationSpec": {
      "anchor": "instant"
    },
    "description": "When you roll a Hit Die to regain hit points, you may use your Wisdom or Charisma modifier in place of your Constitution modifier when determining the number of hit points you regain.\n\nAdditionally, as an action, you can manifest this ideal in a brief surge of energy. You gain a number of temporary hit points equal to half your sentinel level + your Wisdom or Charisma modifier (your choice, minimum of one).",
    "summary": "Use Wisdom or Charisma modifier instead of Constitution for Hit Die healing; manifest (action): gain +{halfLevelPlusWisChaMod} temporary HP.",
    "effects": [
      {
        "type": "hpMod",
        "hitDieAbilityOverride": [
          "Wisdom",
          "Charisma"
        ],
        "note": "May use Wisdom or Charisma modifier instead of Constitution when rolling Hit Dice to heal."
      },
      {
        "type": "contextualNote",
        "surface": "rests",
        "title": "Ideal of the Vigorous",
        "text": "May use Wisdom or Charisma modifier instead of Constitution when rolling Hit Dice to heal."
      },
      {
        "type": "actionGrant",
        "zone": "action",
        "name": "Ideal of the Vigorous",
        "resourceId": "idealManifests",
        "sharedResource": true,
        "effect": "applyTempHP",
        "amountFormula": "halfLevelPlusWisChaMod",
        "cadence": "unlimited",
        "durationSpec": {
          "anchor": "instant"
        },
        "summary": "Manifest: gain +{halfLevelPlusWisChaMod} temporary HP."
      }
    ]
  }
];
const SW5E_CLASS_IMPROVEMENTS = [{"className":"Berserker","label":"Instinctive Pounce / Pursuit","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in berserker","description":"When a creature ends its turn within 15 feet of you, you can use your reaction to move up to half your speed to a space closer to the creature. This movement doesn't provoke opportunity attacks.","summary":"Reaction when a creature ends its turn within 15 ft: move up to {halfWalk} ft closer without provoking opportunity attacks.","effects":[{"type":"actionGrant","zone":"reaction","name":"Instinctive Pounce / Pursuit","summary":"When a creature ends its turn within 15 ft, use your reaction to move up to {halfWalk} ft closer without provoking opportunity attacks.","cadence":"unlimited","reactionKind":"standard","durationSpec":{"anchor":"instant"}}]},{"className":"Consular","label":"Force Versatility","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in consular","description":"When you complete a long rest, you can choose one of the force powers you know and replace it with another force power, as long as that power is not of a higher level than your Max Power Level.","summary":"On completing a long rest, replace one known force power with another force power up to your Max Power Level.","effects":[{"type":"contextualNote","surface":"rests","title":"Force Versatility","cadence":"oncePerLongRest","text":"On a long rest, replace one known force power with another force power up to your Max Power Level."}]},{"className":"Engineer","label":"Potent Power Aptitude","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in engineer","description":"When a creature has a Potent Aptitude die from you and casts a power, they can roll the die and add the number rolled to one damage or healing roll of the power. If the power would damage or heal multiple targets, this bonus only applies to one of them. The Potent Aptitude die is then lost.","summary":"A creature with your Potent Aptitude die ({potentAptitudeDie}) casting a power may roll and add it to one damage or healing roll (single target); die is then lost.","effects":[{"type":"contextualNote","surface":"combat.special","title":"Potent Power Aptitude","text":"A creature with your Potent Aptitude die ({potentAptitudeDie}) casting a power may roll and add it to one damage or healing roll (single target only); die is then lost."}]},{"className":"Fighter","label":"Martial Versatility","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in fighter","description":"Whenever you complete a long rest, you can replace a fighting style you know with another style available. You can't take a Fighting Style option more than once, even if you later get to choose again.","summary":"On completing a long rest, replace one known fighting style with another available style (cannot take the same style twice).","effects":[{"type":"contextualNote","surface":"rests","title":"Martial Versatility","cadence":"oncePerLongRest","text":"On a long rest, replace one known fighting style with another available style (cannot take the same style twice)."}]},{"className":"Guardian","label":"Harness the Force","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in guardian","description":"As a bonus action, you can expend a use of your Channel the Force to regain 2 force points. You can use this feature a number of times equal to your proficiency bonus, as shown in the guardian table. You regain all expended uses when you complete a long rest.","summary":"Bonus action: expend a use of Channel the Force to regain 2 Force points (proficiency bonus uses per long rest).","effects":[{"type":"actionGrant","zone":"bonus","name":"Harness the Force","summary":"Expend a use of Channel the Force to regain 2 Force points.","effect":"regainForce","amount":2,"resourceId":"harnessForce","secondaryResourceId":"channelForce","cadence":"unlimited","durationSpec":{"anchor":"instant"}},{"type":"resourcePool","id":"harnessForce","name":"Harness the Force","max":"proficiency","recharge":"long"}]},{"className":"Monk","label":"Quickened Healing","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in monk","description":"As an action, you can spend 2 focus points and a roll a Martial Arts die. You regain a number of hit points equal to the amount rolled + your Wisdom or Charisma modifier (your choice, a minimum of one).","summary":"Action: spend 2 Focus points and roll a Martial Arts die ({maDie}) to regain HP equal to the roll + {wisChaMod} (Wisdom or Charisma modifier, minimum 1).","effects":[{"type":"actionGrant","zone":"action","name":"Quickened Healing","summary":"Spend 2 Focus points and roll 1d{maDie} + {wisChaMod} HP (minimum 1).","effect":"rollHeal","dieToken":"maDie","modAbility":"wisCha","minHeal":1,"cost":{"pool":"focus","amount":2},"cadence":"unlimited","durationSpec":{"anchor":"instant"}}]},{"className":"Operative","label":"Steady Aim","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in operative","description":"You can use the bonus action granted by your Cunning Action to carefully aim your next attack. You gain advantage on your next attack roll before the end of your current turn. You can't use this feature if you have moved during this turn, and using this feature reduces your speed to 0 until the end of your current turn.","summary":"Cunning Action bonus action: gain advantage on your next attack roll this turn (requires 0 movement this turn; reduces speed to 0 until end of turn).","effects":[{"type":"actionGrant","zone":"bonus","name":"Steady Aim","summary":"Cunning Action bonus action: gain advantage on your next attack roll this turn (requires 0 movement and reduces speed to 0 until end of turn).","cadence":"unlimited","durationSpec":{"anchor":"endOfOwnTurn"},"toggleEffect":{"name":"Steady Aim","note":"Speed 0 · Advantage on next attack this turn"}},{"type":"speed","mode":"walk","multiplier":0,"note":"Speed reduced to 0 until the end of your current turn","when":{"activeEffect":"Steady Aim"}},{"type":"combatTrait","kind":"nextAttackAdvantage","note":"Advantage on your next attack roll before the end of your current turn","when":{"activeEffect":"Steady Aim"}}]},{"className":"Scholar","label":"Maneuver Versatility","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in scholar","description":"When you complete a long rest, you can choose one of the maneuvers you know and replace it with another one.","summary":"On completing a long rest, replace one known maneuver with another maneuver.","effects":[{"type":"contextualNote","surface":"rests","title":"Maneuver Versatility","cadence":"oncePerLongRest","text":"On a long rest, replace one known maneuver with another maneuver."}]},{"className":"Scout","label":"Tireless","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in scout","description":"As an action, you can reduce your exhaustion level by 1 and give yourself a number of temporary hit points equal to 1d10 + your scout level. \n\nOnce you've used this feature, you must complete a short or long rest before you can use it again.","summary":"Action (1/short or long rest): reduce exhaustion by 1 and gain 1d10 + {scoutLevel} temporary HP.","effects":[{"type":"actionGrant","zone":"action","name":"Tireless","summary":"Reduce exhaustion by 1 and gain 1d10 + {scoutLevel} temporary HP.","effect":"rollTempHPAndReduceExhaustion","dieSides":10,"modClassLevel":"Scout","resourceId":"scout_improvement_tireless","cadence":"oncePerShortRest","durationSpec":{"anchor":"instant"}},{"type":"resourcePool","id":"scout_improvement_tireless","name":"Tireless (Scout Improvement)","max":1,"recharge":"short"}]},{"className":"Sentinel","label":"Empowered Kinetic Combat","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in sentinel","description":"Once per turn, when you roll a Kinetic Combat die, you can roll the die with advantage.","summary":"Once per turn, when you roll a Kinetic Combat die ({kineticCombatDie}), you can roll the die with advantage.","effects":[{"type":"contextualNote","surface":"combat.special","title":"Empowered Kinetic Combat","cadence":"oncePerTurn","text":"Once per turn, when you roll a Kinetic Combat die ({kineticCombatDie}), you can roll the die with advantage."}]}];
const SW5E_MULTICLASS_IMPROVEMENTS = [{"className":"Berserker","label":"Berserker Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in berserker","description":"You can add half your other chosen class's levels (rounded down) to your berserker levels when determining the number of times you can enter a rage and the bonus to weapon damage rolls while raging.","summary":"Add half your other chosen class's levels (rounded down) to Berserker levels for Rages count and Rage Damage.","effects":[{"type":"multiclassScale","targetClass":"Berserker","targetFeature":"Rages","ratio":0.5},{"type":"multiclassScale","targetClass":"Berserker","targetFeature":"Rage Damage","ratio":0.5}]},{"className":"Consular","label":"Consular Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in consular","description":"You can add half your other chosen class's levels (rounded down) to half your consular levels (rounded down) when determining the force points you regain through your Force Recovery feature, and you gain 1 force point for each of your other chosen class's levels.","summary":"Add half your other chosen class's levels (rounded down) to half your Consular levels for Force Recovery, and gain +1 Force point per other chosen class level.","effects":[{"type":"multiclassScale","targetClass":"Consular","targetFeature":"Force Recovery","ratio":0.5,"extraForcePointsPerLevel":1}]},{"className":"Engineer","label":"Engineer Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in engineer","description":"You can add your other chosen class's levels to your engineer levels when determining the size of your Potent Aptitude die and the number of uses of your Potent Aptitude feature, and you gain 1 tech point for every two of your other chosen class's levels.","summary":"Add your other chosen class's levels to Engineer levels for Potent Aptitude die size and uses, and gain +1 Tech point per 2 other chosen class levels.","effects":[{"type":"multiclassScale","targetClass":"Engineer","targetFeature":"Potent Aptitude","ratio":1,"extraTechPointsPerTwoLevels":1}]},{"className":"Fighter","label":"Fighter Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in fighter","description":"You can add half your other chosen class's levels (rounded down) to your fighter levels when determining the number of hit points you regain from your Second Wind feature, the size of your superiority dice, and the number of superiority dice you have.","summary":"Add half your other chosen class's levels (rounded down) to Fighter levels for Second Wind HP, Superiority Dice size, and Superiority Dice count.","effects":[{"type":"multiclassScale","targetClass":"Fighter","targetFeature":"Second Wind","ratio":0.5},{"type":"multiclassScale","targetClass":"Fighter","targetFeature":"Superiority Dice","ratio":0.5}]},{"className":"Guardian","label":"Guardian Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in guardian","description":"You can add half your other chosen class's levels (rounded down) to your guardian levels when determining your amount of Focused Strikes dice and your number of uses of Channel the Force.","summary":"Add half your other chosen class's levels (rounded down) to Guardian levels for Focused Strikes dice and Channel the Force uses.","effects":[{"type":"multiclassScale","targetClass":"Guardian","targetFeature":"Focused Strikes","ratio":0.5},{"type":"multiclassScale","targetClass":"Guardian","targetFeature":"Channel the Force","ratio":0.5}]},{"className":"Monk","label":"Monk Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in monk","description":"You can add your other chosen class's levels to your monk levels when determining the size of your Martial Arts die.","summary":"Add your other chosen class's levels to Monk levels for Martial Arts die size.","effects":[{"type":"multiclassScale","targetClass":"Monk","targetFeature":"Martial Arts","ratio":1}]},{"className":"Operative","label":"Operative Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in operative","description":"You can add half your other chosen class's levels (rounded down) to your operative levels when determining your amount of Sneak Attack dice.","summary":"Add half your other chosen class's levels (rounded down) to Operative levels for Sneak Attack dice.","effects":[{"type":"multiclassScale","targetClass":"Operative","targetFeature":"Sneak Attack","ratio":0.5}]},{"className":"Scholar","label":"Scholar Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in scholar","description":"You can add your other chosen class's levels to your scholar levels when determining your number of maneuvers known, the size of your superiority dice, and the number of superiority dice you have.","summary":"Add your other chosen class's levels to Scholar levels for maneuvers known, Superiority Dice size, and Superiority Dice count.","effects":[{"type":"multiclassScale","targetClass":"Scholar","targetFeature":"Maneuvers & Superiority Dice","ratio":1}]},{"className":"Scout","label":"Scout Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in scout","description":"You can add your other chosen class's levels to your scout levels when determining the size of your Ranger's Quarry die and the duration of your Ranger's Quarry feature.","summary":"Add your other chosen class's levels to Scout levels for Ranger's Quarry die size and duration.","effects":[{"type":"multiclassScale","targetClass":"Scout","targetFeature":"Ranger's Quarry","ratio":1}]},{"className":"Sentinel","label":"Sentinel Multiclass Improvement","source":"Expanded Content","minLevel":3,"prerequisite":"At least 3 levels in sentinel","description":"You can add your other chosen class's levels to your sentinel levels when determining the size of your Kinetic Combat die.","summary":"Add your other chosen class's levels to Sentinel levels for Kinetic Combat die size.","effects":[{"type":"multiclassScale","targetClass":"Sentinel","targetFeature":"Kinetic Combat","ratio":1}]}];
const SW5E_SPLASHCLASS_IMPROVEMENTS = [{"className":"Berserker","label":"Berserker Splashclass Improvement","prerequisite":"No levels in berserker","description":"On your turn, you can enter a rage as a bonus action if you aren't wearing heavy armor.\n\nWhile raging, you gain the following benefits:\n- You have advantage on Strength checks and Strength saving throws.\n- When you make a melee weapon attack using Strength, you gain a +2 bonus to the damage roll.\n- You have resistance to kinetic and energy damage.\n\nIf you are able to cast powers, you can't cast them or concentrate on them while raging.\n\nYour rage lasts for 1 minute. It ends early if you are knocked unconscious, you don heavy armor, or if your turn ends and you haven't taken a hostile action or taken damage since your last turn. You can also end your rage on your turn as a bonus action.\n\nYou can use this feature once. You gain an additional use at 11th level. You regain all expended uses when you complete a long rest.","effects":[{"type":"actionGrant","zone":"bonus","name":"Splashclass: Rage","summary":"Bonus action (not in heavy armor): Rage 1 minute (+2 melee Strength damage, advantage on Strength checks and saves, resistance to kinetic and energy, no casting or concentration).","resourceId":"splash_berserker_rage","durationSpec":{"anchor":"timed","value":1,"unit":"minute"},"cadence":"unlimited","turnTriggers":[{"timing":"endOfTurn","actor":"self","kind":"prompt","note":"Ends early if you haven't taken a hostile action or taken damage since your last turn."}],"toggleMode":"rage","blockedByHeavyArmor":true},{"type":"resourcePool","id":"splash_berserker_rage","name":"Splashclass Rage","max":"level>=11?2:1","recharge":"long"},{"type":"conditionalCheckMod","ability":"Strength","mode":"advantage","when":{"state":"raging"}},{"type":"saveMod","abilities":["Strength"],"mode":"advantage","when":{"state":"raging"}},{"type":"defense","kind":"resistance","damageType":"kinetic","when":{"state":"raging"}},{"type":"defense","kind":"resistance","damageType":"energy","when":{"state":"raging"}},{"type":"attackDamageMod","scope":"melee","damageBonus":2,"when":{"state":"raging"},"ability":"Strength"},{"type":"castingRestriction","kind":"noCasting","note":"Cannot cast or concentrate on powers while raging","when":{"state":"raging"}}]},{"className":"Consular","label":"Consular Splashclass Improvement","prerequisite":"No levels in consular, the ability to cast force powers","description":"You gain the ability to twist your powers to suit your needs. When you cast a force power, you can expend additional force points to modify the power. You gain one of the Force-Empowered Casting options of your choice from those available to the consular class. You gain an additional option at 11th level.\n\nYou can only spend a number of force points in this way equal to your proficiency bonus. You regain the ability to do so when you complete a long rest.","effects":[{"type":"combatOptionGrant","kind":"forceEmpoweredCasting","count":1},{"type":"combatOptionGrant","kind":"forceEmpoweredCasting","count":1,"when":{"minLevel":11}},{"type":"resourcePool","id":"splash_consular_fec","name":"Splashclass Force-Empowered Casting Point Cap","max":"proficiency","recharge":"long"},{"type":"contextualNote","surface":"casting","title":"Splashclass: Force-Empowered Casting","text":"Modify Force powers using your chosen Force-Empowered Casting option(s); spend up to {prof} Force points total per long rest.","castingScope":{"powerType":"Force"}}]},{"className":"Engineer","label":"Engineer Splashclass Improvement","prerequisite":"No levels in engineer","description":"Your technological experience lends you an uncommon insight that you can use to bolster your allies. To do so, you use a bonus action on your turn to choose one creature other than yourself within 60 feet of you who can hear you. That creature gains one Potent Aptitude die, a d4. \n\nOnce within the next 10 minutes, the creature can roll the die and add the number rolled to one ability check, attack roll, or saving throw it makes. The creature can wait until after it rolls the d20 before deciding to use the Potent Aptitude die, but must decide before the GM says whether the roll succeeds or fails. Once the Potent Aptitude die is rolled, it is lost.\n\nA creature can have only one Potent Aptitude die at a time.\n\nYou can use this feature a number of times equal to your proficiency bonus. You regain any expended uses when you finish a long rest.","effects":[{"type":"actionGrant","zone":"bonus","name":"Splashclass: Potent Aptitude","summary":"Bonus action (another creature within 60 ft who can hear you): grant 1d4 Potent Aptitude die (10 min; add to 1 check, attack, or save after rolling d20 before outcome; max 1 die at a time).","resourceId":"splash_engineer_potent_aptitude","durationSpec":{"anchor":"timed","value":10,"unit":"minute"},"cadence":"unlimited"},{"type":"resourcePool","id":"splash_engineer_potent_aptitude","name":"Splashclass Potent Aptitude","max":"proficiency","die":"d4","recharge":"long"}]},{"className":"Fighter","label":"Fighter Splashclass Improvement","prerequisite":"No levels in fighter","description":"You learn maneuvers that are fueled by special dice called superiority dice.\n\n***Maneuvers.*** You learn one maneuver of your choice from those available to the fighter class. You learn an additional maneuver at 11th level. Many maneuvers enhance an attack in some way. You can use only one maneuver per attack, and you may only use each maneuver once per turn.\n\n***Superiority Dice.*** You have a number of superiority dice equal to your proficiency bonus, which are d4s. A superiority die is expended when you use it. You regain all of your expended superiority dice when you finish a long rest.\n\n***Saving Throws.*** Some of your maneuvers require your target to make a saving throw to resist the maneuver's effects. The saving throw DC is calculated as follows:\n\n___\n\n**Maneuver save DC** = 8 + your proficiency bonus + your Strength or Dexterity modifier (your choice)\n\n___","effects":[{"type":"combatOptionGrant","kind":"maneuver","count":1,"superiorityDice":"proficiency","die":"d4","recharge":"long"},{"type":"combatOptionGrant","kind":"maneuver","count":1,"when":{"minLevel":11}},{"type":"resourcePool","id":"splash_fighter_superiority","name":"Splashclass Superiority Dice","max":"proficiency","die":"d4","recharge":"long"}]},{"className":"Guardian","label":"Guardian Splashclass Improvement","prerequisite":"No levels in guardian, the ability to cast force powers","description":"When you hit a creature with a melee weapon attack, you can expend force points to deal additional damage to the target, which is the same type as the weapon's damage. The additional damage is 1d8 for each point spent in this way. You can't deal more than 2d8 additional damage per hit in this way.\n\nYou can only spend a number of force points in this way equal to your proficiency bonus. You regain the ability to do so when you complete a long rest.","effects":[{"type":"actionGrant","zone":"special","name":"Splashclass: Focused Strikes","summary":"On melee weapon hit, spend 1–2 Force points to deal +1d8 per Force point (maximum 2d8) of the weapon's damage type.","resourceId":"splash_guardian_focused_strikes","durationSpec":{"anchor":"instant"},"cadence":"unlimited","cost":{"pool":"force","amount":1,"maxAmount":2,"dicePerPoint":"1d8"}},{"type":"resourcePool","id":"splash_guardian_focused_strikes","name":"Splashclass Focused Strikes Point Cap","max":"proficiency","die":"d8","recharge":"long"}]},{"className":"Monk","label":"Monk Splashclass Improvement","prerequisite":"No levels in monk","description":"Your practice of martial arts grants you the following benefits:\n- You can make an unarmed strike as a bonus action. If you would already make an unarmed strike as a bonus action, you can instead make this strike in addition to that unarmed strike.\n- You can take the Disengage action as a bonus action. If you would already Disengage as a bonus action, you can instead also Dodge.\n- You can take the Dash action as a bonus action. If you would already Dash as a bonus action, you can instead double your jump distance for the turn.\n\nYou can use these features a combined number of times equal to your proficiency bonus. You regain all expended uses when you complete a long rest.","effects":[{"type":"actionGrant","zone":"bonus","name":"Splashclass: Martial Arts","summary":"Bonus action: Unarmed Strike (stacks with existing bonus-action unarmed), Disengage (also Dodge if already bonus-action Disengage), or Dash (double jump if already bonus-action Dash).","resourceId":"splash_monk_martial_arts","durationSpec":{"anchor":"instant"},"cadence":"unlimited"},{"type":"resourcePool","id":"splash_monk_martial_arts","name":"Splashclass Martial Arts","max":"proficiency","recharge":"long"}]},{"className":"Operative","label":"Operative Splashclass Improvement","prerequisite":"No levels in operative","description":"You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal an extra 1d6 damage to one creature you hit with a weapon attack if you have advantage on the attack roll. This damage is the same as the weapon's damage, and the attack must use a finesse or a ranged weapon.\n\nYou don't need advantage on the attack roll if another enemy of the target is within 5 feet of it, that enemy isn't incapacitated, and you don't have disadvantage on the attack roll.\n\nYou can deal this additional damage a number of times equal to your proficiency bonus. You regain all expended uses when you complete a long rest.","effects":[{"type":"actionGrant","zone":"special","name":"Splashclass: Sneak Attack","summary":"Once per turn on finesse or ranged weapon hit (advantage, or non-incapacitated enemy within 5 ft without disadvantage): deal +1d6 same-type damage.","resourceId":"splash_operative_sneak_attack","durationSpec":{"anchor":"instant"},"cadence":"oncePerTurn"},{"type":"resourcePool","id":"splash_operative_sneak_attack","name":"Splashclass Sneak Attack","max":"proficiency","die":"d6","recharge":"long"}]},{"className":"Scholar","label":"Scholar Splashclass Improvement","prerequisite":"No levels in scholar","description":"You are able to analyze a target, develop a plan on how to best overcome any potential obstacle, and execute that plan with ruthless efficiency. As a bonus action on your turn, you can analyze a target you can see within 60 feet of you. For the next minute, or until you analyze another target, you gain the following benefits:\n- When you analyze a hostile creature, your attack and damage rolls made with weapons with the finesse property or blaster weapons against that target may use your Intelligence modifier instead of Strength or Dexterity.\n- When you analyze a friendly creature, the target can end your Critical Analysis on them (no action required) to add your Intelligence modifier to one attack roll, ability check, or saving throw. Once a friendly creature has benefited from this ability, they can not do so again until they complete a short or long rest.\n\nYou can use this feature a number of times equal to half your proficiency bonus, rounded up. You regain all expended uses when you complete a long rest.","effects":[{"type":"actionGrant","zone":"bonus","name":"Splashclass: Critical Analysis","summary":"Bonus action (60 ft, 1 minute or until new target): hostile target lets you use Intelligence for finesse/blaster attack and damage; friendly target may end it (no action) to add +{intMod} to one check, attack, or save (1/short or long rest per ally).","resourceId":"splash_scholar_critical_analysis","durationSpec":{"anchor":"timed","value":1,"unit":"minute"},"cadence":"unlimited","toggleEffect":{"name":"Critical Analysis","note":"Splashclass · 60 ft · Hostile: Intelligence for finesse/blaster; Friendly: end for +{intMod}"}},{"type":"resourcePool","id":"splash_scholar_critical_analysis","name":"Splashclass Critical Analysis","max":"ceil(proficiency/2)","recharge":"long"}]},{"className":"Scout","label":"Scout Splashclass Improvement","prerequisite":"No levels in scout","description":"You learn how to effectively read and track your prey. Once on each of your turns, you can choose a creature you can see within 120 feet and mark it as your quarry (no action required). For the next hour, you gain the following benefits:\n- Once per turn, when you hit the target with a weapon attack, you can deal 1d4 additional damage to it of the same type as the weapon's damage. \n- You have advantage on any Wisdom (Perception) or Wisdom (Survival) check you make to find it while it's on the same planet as you.\n\nYou can only have one creature marked in this way at a time. You can mark creatures in this way a number of times equal to half your proficiency bonus, rounded up. You regain all expended uses when you complete a long rest.","effects":[{"type":"actionGrant","zone":"special","name":"Splashclass: Ranger's Quarry","summary":"No action (once per turn, 120 ft, 1 hour, max 1 target): mark a creature for +1d4 weapon damage once per turn and advantage on Perception/Survival to find it on the same planet.","resourceId":"splash_scout_rangers_quarry","durationSpec":{"anchor":"timed","value":1,"unit":"hour"},"cadence":"oncePerTurn","toggleEffect":{"name":"Ranger’s Quarry","aliases":["Ranger's Quarry"],"note":"Splashclass · 120 ft · +1d4 weapon damage (once per turn) & track advantage"}},{"type":"conditionalCheckMod","skills":["Perception","Survival"],"mode":"advantage","condition":"finding your Ranger's Quarry on the same planet"},{"type":"resourcePool","id":"splash_scout_rangers_quarry","name":"Splashclass Ranger's Quarry","max":"ceil(proficiency/2)","die":"d4","recharge":"long"}]},{"className":"Sentinel","label":"Sentinel Splashclass Improvement","prerequisite":"No levels in sentinel, the ability to cast force powers","description":"When you hit a creature with a melee weapon attack, you can spend 1 force point to use a Force-Empowered Self effect. You have three such effects: Deflection, Double Strike, and Slow Time. You can only use each effect once per turn, and you can only use one effect per hit.\n\n***Deflection.*** You can roll a d4 and add it to your AC against one attack before the start of your next turn.\n\n***Double Strike.*** You can roll a d4 and deal additional damage of the same type equal to the amount rolled.\n\n***Slow Time.*** You can roll a d4 to increase your speed by 5 x the amount rolled until the end of your turn.\n\nYou can only spend a number of force points in this way equal to your proficiency bonus. You regain the ability to do so when you complete a long rest.","effects":[{"type":"actionGrant","zone":"special","name":"Splashclass: Force-Empowered Self","summary":"On melee weapon hit, spend 1 Force point (1/hit, each once per turn): Deflection (+1d4 AC vs 1 attack before start of next turn), Double Strike (+1d4 same-type damage), or Slow Time (+5×d4 ft speed until end of turn).","resourceId":"splash_sentinel_fes","durationSpec":{"anchor":"instant"},"cadence":"oncePerTurn","cost":{"pool":"force","amount":1}},{"type":"resourcePool","id":"splash_sentinel_fes","name":"Splashclass Force-Empowered Self Point Cap","max":"proficiency","die":"d4","recharge":"long"}]}];
