function isDroidOrConstruct(profile) {
  const spName = String(profile?.species || "");
  if (/\bdroid\b|\bconstruct\b/i.test(spName)) return true;
  const sp = typeof speciesRecord === "function" ? speciesRecord(spName) : null;
  if (sp?.traits?.some(t => /^droid$/i.test(String(t.name || "")))) return true;
  return false;
}

function consumableSpec(rule) {
  if (!rule) return null;
  const name = String(rule.name || "").trim();
  const cat = rule.category;

  // Standard and enhanced Medpacs (1 to 6 Hit Dice + Constitution modifier, min 1 HP)
  const medpacMatch = name.match(/^medpac(?:\s*\((fine|improved|superior|exceptional|champion)\))?$/i);
  if (medpacMatch) {
    const tierDice = { fine: 2, improved: 3, superior: 4, exceptional: 5, champion: 6 };
    const hitDice = medpacMatch[1] ? (tierDice[medpacMatch[1].toLowerCase()] || 1) : 1;
    return {
      verb: "Use",
      combat: "action",
      healing: true,
      hitDieHealing: true,
      hitDice,
      creatureRestriction: "living",
      selfAllowed: true,
      maxUses: 1,
      note: "As an action, restore hit points to a beast or humanoid within 5 feet: roll " +
        (hitDice === 1 ? "1 Hit Die" : hitDice + " Hit Dice") +
        " + Constitution modifier (minimum 1 HP)."
    };
  }

  if (cat === "Medical") {
    if (/prosthesis/i.test(name)) return null;
    if (/^traumakit$/i.test(name)) {
      return {
        verb: "Use",
        combat: "action",
        selfAllowed: false,
        maxUses: 5,
        useLabel: "uses",
        note: "Expend 1 use (5 per kit) as an action to stabilize a creature at 0 HP without a Wisdom (Medicine) check."
      };
    }
    if (/^antitoxkit$/i.test(name)) {
      return {
        verb: "Use",
        combat: "action",
        selfAllowed: true,
        curesPoison: true,
        antitoxModes: true,
        creatureRestriction: "living",
        maxUses: 5,
        useLabel: "charges",
        duration: "1 hour",
        note: "Expend 1 charge (5 per kit) as an action to cure one poison affecting a target or grant advantage on saving throws against poison for 1 hour. No benefit to droids or constructs."
      };
    }
    if (/^poison$/i.test(name)) {
      return {
        verb: "Apply",
        combat: "action",
        selfAllowed: false,
        weaponTarget: true,
        maxUses: 1,
        duration: "1 minute",
        note: "As an action, coat one vibroweapon, slug cartridge, or wrist launcher dart for 1 minute (DC 14 Constitution save or 2d4 poison damage, half on success)."
      };
    }
    if (/^repair kit$/i.test(name)) {
      return {
        verb: "Use",
        combat: "action",
        healing: true,
        hitDieHealing: true,
        hitDice: 1,
        creatureRestriction: "droid",
        selfAllowed: true,
        maxUses: 3,
        useLabel: "uses",
        note: "Expend 1 use (3 per kit) as an action to restore hit points to a droid or construct within 5 feet: roll 1 Hit Die + Constitution modifier (minimum 1 HP)."
      };
    }
    if (/^emergency battery$/i.test(name)) {
      return {
        verb: "Use",
        combat: "action",
        selfAllowed: false,
        creatureRestriction: "droid",
        maxUses: 10,
        useLabel: "uses",
        note: "Expend 1 use (10 per battery) as an action to stabilize a droid at 0 HP without an Intelligence (Technology) check."
      };
    }
    return { verb: "Use", combat: "action", selfAllowed: true, maxUses: 1, note: "" };
  }
  if (cat === "Explosive") {
    const isThrow = /^grenade|^thermal detonator/i.test(name);
    return {
      verb: isThrow ? "Throw" : "Set",
      combat: "action",
      selfAllowed: false,
      maxUses: 1,
      note: isThrow
        ? "Resolve throw range, saving throw DC, and area effect at the table."
        : "Place or arm the device and resolve trigger and DC at the table."
    };
  }
  if (cat === "Spice") {
    return {
      verb: "Use",
      combat: "action",
      selfAllowed: true,
      maxUses: 1,
      duration: "1 hour",
      timedEffect: true,
      note: "Track active spice duration and withdrawal saving throw at the table."
    };
  }
  if (cat === "Ammunition" && /^projector canister\b/i.test(name)) {
    return {
      verb: "Fire",
      combat: "action",
      selfAllowed: false,
      maxUses: 3,
      useLabel: "line uses",
      note: "Wrist launcher projector canister (3 line attacks or 1 cone attack per canister)."
    };
  }
  if (cat === "AlcoholicBeverage") {
    return {
      verb: "Drink",
      combat: null,
      selfAllowed: true,
      maxUses: 1,
      duration: "1 hour",
      timedEffect: true,
      note: "Track beverage effects at the table."
    };
  }
  return null;
}

function consumableUsesRemaining(item, spec) {
  if (!spec || !(spec.maxUses > 1)) return null;
  const current = Number.isInteger(item?.uses) && item.uses > 0 ? Math.min(item.uses, spec.maxUses) : spec.maxUses;
  return { current, max: spec.maxUses, label: spec.useLabel || "uses" };
}

function useConsumableItem(itemId, options = {}) {
  const { profile, session } = app.character;
  const item = session.equipped.find(entry => entry.id === itemId);
  if (!item) return;
  const rule = itemRule(item.name, item);
  const spec = consumableSpec(rule);
  if (!spec) return;
  const target = options.target || (spec.selfAllowed ? "self" : "other");
  const targetLabel = options.targetLabel || (target === "self" ? profile.name : "Another creature");
  const healing = Math.max(0, Math.floor(Number(options.healing) || 0));
  const mode = options.mode || (spec.antitoxModes ? "cure" : "");
  const note = (options.note || "").trim();
  const label = spec.verb + " " + item.name;

  update(label, (next, prof) => {
    const found = next.equipped.find(entry => entry.id === itemId);
    if (!found) return;
    if (spec.maxUses > 1) {
      const curUses = Number.isInteger(found.uses) && found.uses > 0 ? found.uses : spec.maxUses;
      if (curUses > 1) {
        found.uses = curUses - 1;
      } else if (found.quantity > 1) {
        found.quantity--;
        found.uses = spec.maxUses;
      } else {
        next.equipped = next.equipped.filter(entry => entry.id !== itemId);
      }
    } else if (found.quantity > 1) {
      found.quantity--;
    } else {
      next.equipped = next.equipped.filter(entry => entry.id !== itemId);
    }

    if (target === "self") {
      if (spec.healing && healing > 0) {
        recoverHP(next, healing, hitPointMaximum(prof, next));
      }
      if (spec.curesPoison && (!spec.antitoxModes || mode === "cure")) {
        next.effects = next.effects.filter(e => e.name !== "Poisoned");
      }
      if (spec.timedEffect || (spec.curesPoison && (!spec.antitoxModes || mode === "advantage"))) {
        next.consumableEffects = next.consumableEffects || [];
        next.consumableEffects.push({
          id: newID(),
          name: item.name,
          duration: spec.duration || "Active",
          note: note || (spec.antitoxModes ? "Advantage on saving throws against poison (1 hour)" : (spec.note || (rule?.description || "").split("\n")[0])),
          rules: rule?.description || ""
        });
      }
    }
    const parts = [item.name + " (" + spec.verb.toLowerCase() + ")"];
    if (target === "self" && spec.healing && healing > 0) parts.push("+" + healing + " HP");
    else if (target !== "self") parts.push("Target: " + targetLabel + (healing > 0 ? " (+" + healing + " HP)" : ""));
    if (spec.antitoxModes) parts.push(mode === "advantage" ? "Advantage on poison saves (1 hour)" : "Cured Poisoned");
    if (note) parts.push(note);
    next.lastRoll = parts.join(" · ");
  });
}

function openConsumableDialog(itemId, trigger) {
  const { profile, session } = app.character;
  const item = session.equipped.find(entry => entry.id === itemId);
  const rule = item && itemRule(item.name, item);
  const spec = consumableSpec(rule);
  if (!item || !spec) return;

  const droidSelf = isDroidOrConstruct(profile);
  const scores = effectiveScores(profile, session);
  const conMod = modifier(scores.Constitution || 10);
  const hitDieSides = profile.hitDie || 8;
  const hitDiceCount = spec.hitDice || 1;
  const usesInfo = consumableUsesRemaining(item, spec);

  const { dialog, form, body, field, note, confirm } = createModalFrame(item.name, trigger);
  confirm.textContent = spec.verb + " " + item.name;

  if (usesInfo) {
    const usesMeta = appendText(body, "p", "Remaining: " + usesInfo.current + " / " + usesInfo.max + " " + usesInfo.label +
      (item.quantity > 1 ? " (" + item.quantity + " carried)" : ""));
    usesMeta.className = "muted";
  }

  // Live Explosives Mastery / Poisoner Mastery / Area Mastery combat modifiers
  if (typeof resolveCombatEffects === "function") {
    const cEff = resolveCombatEffects(profile, session);
    const prof = profile.proficiency || 2;
    const itemDcInt = 8 + prof + modifier(scores.Intelligence || 10);
    const isExplosive = rule?.category === "Explosive";
    const isPoison = Boolean(/^poison\b/i.test(item.name || "") || (spec?.weaponTarget && /poison/i.test(spec.note || "")));
    if (isExplosive && cEff?.attackDamageMods?.some(am => String(am.scope || "").toLowerCase() === "explosive" && am.tradeoff)) {
      const mNote = appendText(body, "p", "Explosives Mastery: Save DC " + itemDcInt + " (if higher than item DC) · Advantage on saves vs own explosives · −" + prof + " DC for +" + prof + " damage.");
      mNote.className = "muted";
    }
    const hasPoisonStyle = (session.fightingStyles || []).some(s => normalizeName(s) === "poisoner style");
    const hasPoisonMax1 = Boolean(cEff?.critMods?.some(cm => String(cm.scope || "").toLowerCase() === "poison" && Array.isArray(cm.maxDamageOnSaveRoll)));
    if (isPoison && (hasPoisonStyle || hasPoisonMax1)) {
      const psParts = [
        hasPoisonStyle ? "Bonus action to apply (or reaction on your turn if already a bonus action)" : "",
        hasPoisonMax1 ? "Natural 1 save = max damage" : ""
      ].filter(Boolean).join(" · ");
      const psNote = appendText(body, "p", "Poisoner Style: " + psParts + ".");
      psNote.className = "muted";
    }
    if (isPoison && cEff?.attackDamageMods?.some(am => String(am.scope || "").toLowerCase() === "poison" && am.tradeoff)) {
      const mNote = appendText(body, "p", "Poisoner Mastery: Save DC " + Math.max(14, itemDcInt) + " (if higher) · +1 extra hit/ammo · Poisoned targets have disadvantage on saves · −" + prof + " DC for +" + (2 * prof) + " damage.");
      mNote.className = "muted";
    }
  }

  // Direct target selection chips (no clunky <select>)
  const targetOptions = [];
  if (spec.selfAllowed) targetOptions.push({ value: "self", label: profile.name + " (self)" });
  if (spec.weaponTarget) {
    for (const eq of session.equipped) {
      if (itemRule(eq.name, eq)?.category === "Weapon") {
        targetOptions.push({ value: "weapon:" + eq.name, label: eq.name });
      }
    }
  }
  targetOptions.push({
    value: "other",
    label: spec.verb === "Throw" ? "Target / area" : spec.weaponTarget ? "Other weapon / ammo" : "Another creature"
  });

  // Default to "other" if self is incompatible by creature type (e.g., Droid using Medpac or humanoid using Repair kit)
  const selfMismatch = (spec.creatureRestriction === "living" && droidSelf) ||
    (spec.creatureRestriction === "droid" && !droidSelf);
  let targetVal = spec.selfAllowed && !selfMismatch ? "self" : (targetOptions.find(o => o.value !== "self")?.value || targetOptions[0].value);

  const targetSec = appendText(body, "div", "");
  appendText(targetSec, "strong", "Target");
  const targetChips = appendText(targetSec, "div", "");
  targetChips.className = "directChips";

  const warningBox = appendText(body, "p", "");
  warningBox.className = "importWarning";
  warningBox.hidden = true;

  // Antitoxkit mode selection (Cure vs Advantage)
  let antitoxMode = "cure";
  let antitoxSec = null;
  if (spec.antitoxModes) {
    antitoxSec = appendText(body, "div", "");
    appendText(antitoxSec, "strong", "Effect");
    const modeChips = appendText(antitoxSec, "div", "");
    modeChips.className = "directChips";
    for (const [val, label] of [["cure", "Cure one poison"], ["advantage", "Advantage on poison saves (1 hour)"]]) {
      const btn = appendText(modeChips, "button", label);
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(antitoxMode === val));
      btn.addEventListener("click", () => {
        antitoxMode = val;
        for (const b of modeChips.querySelectorAll("button")) {
          b.setAttribute("aria-pressed", String(b === btn));
        }
      });
    }
  }

  // Raw Hit Die roll input (blank by default, automatic CON mod + min 1 HP + live preview)
  let dieFieldWrap = null;
  let dieField = null;
  let allyHint = null;
  if (spec.hitDieHealing) {
    dieFieldWrap = appendText(body, "div", "");
    dieFieldWrap.className = "modalFormFields";
    const cMaxHP = hitPointMaximum(profile, session);
    dieField = createDieRollField(dieFieldWrap, {
      diceCount: hitDiceCount,
      dieSides: hitDieSides,
      modifier: conMod,
      modifierLabel: "Constitution",
      minFloor: 1,
      unit: "HP",
      label: "Hit Die roll (" + hitDiceCount + "d" + hitDieSides + ")",
      impactPreview: (raw, total) => targetVal === "self" ? (total ? ("HP " + session.hp + " → " + Math.min(cMaxHP, session.hp + total) + " / " + cMaxHP) : ("Current HP " + session.hp + "/" + cMaxHP)) : "Applied to selected target"
    });
    allyHint = appendText(body, "p", "The target rolls " + (hitDiceCount === 1 ? "1 of their Hit Dice" : hitDiceCount + " of their Hit Dice") +
      " + their Constitution modifier (minimum 1 HP).");
    allyHint.className = "muted";
    allyHint.hidden = true;
  }

  const recipientInput = field("input", "Recipient or note (optional)");
  recipientInput.maxLength = 120;
  recipientInput.placeholder = spec.verb === "Throw" ? "Area or target note" : "Optional note";

  const syncUI = () => {
    const isSelf = targetVal === "self";
    if (spec.creatureRestriction === "living" && droidSelf && isSelf) {
      warningBox.textContent = "SW5e rule: " + item.name + " only works on beasts or humanoids (not droids or constructs). Switch target to Another creature or use a Repair kit.";
      warningBox.hidden = false;
    } else if (spec.creatureRestriction === "droid" && !droidSelf && isSelf) {
      warningBox.textContent = "SW5e rule: " + item.name + " only works on droids or constructs. Switch target to Another creature or use a Medpac.";
      warningBox.hidden = false;
    } else {
      warningBox.hidden = true;
    }

    if (dieFieldWrap && dieField) {
      dieFieldWrap.hidden = !isSelf;
      dieField.input.required = isSelf;
      if (allyHint) allyHint.hidden = isSelf;
      if (isSelf) {
        const total = dieField.getTotal();
        confirm.disabled = !Number.isFinite(total);
        confirm.textContent = Number.isFinite(total)
          ? spec.verb + " " + item.name + " (+" + total + " HP)"
          : spec.verb + " " + item.name;
      } else {
        confirm.disabled = false;
        confirm.textContent = spec.verb + " " + item.name;
      }
    }
  };

  for (const opt of targetOptions) {
    const btn = appendText(targetChips, "button", opt.label);
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(targetVal === opt.value));
    btn.addEventListener("click", () => {
      targetVal = opt.value;
      for (const b of targetChips.querySelectorAll("button")) {
        b.setAttribute("aria-pressed", String(b === btn));
      }
      syncUI();
      if (targetVal === "self" && dieField) dieField.input.focus();
    });
  }

  if (dieField) {
    dieField.input.addEventListener("input", syncUI);
    dieField.rollBtn.addEventListener("click", syncUI);
  }

  // Verbatim rules excerpt (no contradictory hardcoded summary)
  const rawDesc = String(rule?.description || "").replace(/\r/g, "").trim();
  const displayRules = (rawDesc && !/equal\s*$/.test(rawDesc)) ? rawDesc : spec.note;
  if (displayRules) {
    renderRules(body, displayRules);
  }

  syncUI();

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (confirm.disabled) return;
    const isSelf = targetVal === "self";
    const healing = (isSelf && dieField) ? dieField.getTotal() : 0;
    if (isSelf && spec.hitDieHealing && !Number.isFinite(healing)) return;
    const selectedOpt = targetOptions.find(o => o.value === targetVal);
    const targetLabel = recipientInput.value.trim() || selectedOpt?.label || "Another creature";
    dialog.close();
    useConsumableItem(itemId, {
      target: isSelf ? "self" : "other",
      targetLabel,
      healing: Number.isFinite(healing) ? healing : 0,
      mode: antitoxMode,
      note: recipientInput.value.trim()
    });
  });

  dialog.showModal();
  if (targetVal === "self" && dieField) dieField.input.focus();
}
