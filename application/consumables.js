function consumableSpec(rule) {
  if (!rule) return null;
  const name = rule.name;
  const cat = rule.category;
  if (cat === "Medical") {
    if (/prosthesis/i.test(name)) return null;
    if (/^medpac$/i.test(name)) {
      return {verb: "Use", combat: "action", healing: true, selfAllowed: true, note: "As an action, restore HP (typically 1d8 + proficiency or rolled amount per table rules)."};
    }
    if (/^traumakit$/i.test(name)) {
      return {verb: "Use", combat: "action", selfAllowed: false, note: "Stabilize a creature at 0 HP without a Medicine check."};
    }
    if (/^antitoxkit$/i.test(name)) {
      return {verb: "Use", combat: "action", selfAllowed: true, curesPoison: true, duration: "1 hour", note: "Clears Poisoned and grants advantage on saves against poison for 1 hour."};
    }
    if (/^poison$/i.test(name)) {
      return {verb: "Apply", combat: "action", selfAllowed: false, weaponTarget: true, duration: "1 minute", note: "Coat one vibroweapon or piece of ammunition for 1 minute."};
    }
    if (/repair kit|emergency battery/i.test(name)) {
      return {verb: "Use", combat: "action", selfAllowed: true, healing: true, note: "Droid/construct repair or recharge."};
    }
    return {verb: "Use", combat: "action", selfAllowed: true, note: ""};
  }
  if (cat === "Explosive") {
    const isThrow = /^grenade|^thermal detonator/i.test(name);
    return {
      verb: isThrow ? "Throw" : "Set",
      combat: "action",
      selfAllowed: false,
      note: isThrow ? "Resolve throw range, saving throw DC, and area effect at the table." : "Place or arm the device and resolve trigger/DC at the table."
    };
  }
  if (cat === "Spice") {
    return {verb: "Use", combat: "action", selfAllowed: true, duration: "1 hour", timedEffect: true, note: "Track active spice duration and withdrawal save at the table."};
  }
  if (cat === "AlcoholicBeverage") {
    return {verb: "Drink", combat: null, selfAllowed: true, duration: "1 hour", timedEffect: true, note: "Track beverage effects at the table."};
  }
  return null;
}

function useConsumableItem(itemId, options = {}) {
  const {profile, session} = app.character;
  const item = session.equipped.find(entry => entry.id === itemId);
  if (!item) return;
  const rule = itemRule(item.name);
  const spec = consumableSpec(rule);
  if (!spec) return;
  const target = options.target || (spec.selfAllowed ? "self" : "other");
  const targetLabel = options.targetLabel || (target === "self" ? profile.name : "Target");
  const healing = Math.max(0, Math.floor(Number(options.healing) || 0));
  const note = (options.note || "").trim();
  const label = spec.verb + " " + item.name;

  update(label, (next, prof) => {
    const found = next.equipped.find(entry => entry.id === itemId);
    if (!found) return;
    if (found.quantity > 1) found.quantity--;
    else next.equipped = next.equipped.filter(entry => entry.id !== itemId);

    if (target === "self") {
      if (spec.healing && healing > 0) {
        recoverHP(next, healing, hitPointMaximum(prof, next));
      }
      if (spec.curesPoison) {
        next.effects = next.effects.filter(e => e.name !== "Poisoned");
      }
      if (spec.timedEffect || spec.curesPoison) {
        next.consumableEffects = next.consumableEffects || [];
        next.consumableEffects.push({
          id: newID(),
          name: item.name,
          duration: spec.duration || "Active",
          note: note || spec.note || (rule?.description || "").split("\n")[0],
          rules: rule?.description || ""
        });
      }
    }
    const parts = [item.name + " (" + spec.verb.toLowerCase() + ")"];
    if (target === "self" && spec.healing && healing > 0) parts.push("+" + healing + " HP");
    else if (target !== "self") parts.push("Target: " + targetLabel + (healing > 0 ? " (+" + healing + " HP)" : ""));
    if (note) parts.push(note);
    next.lastRoll = parts.join(" · ");
  });
}

function openConsumableDialog(itemId, trigger) {
  const {profile, session} = app.character;
  const item = session.equipped.find(entry => entry.id === itemId);
  const rule = item && itemRule(item.name);
  const spec = consumableSpec(rule);
  if (!item || !spec) return;

  const {dialog, form, body, field, note, confirm} = createModalFrame(item.name, trigger);
  confirm.textContent = spec.verb + " " + item.name;

  const targetSelect = field("select", "Target");
  if (spec.selfAllowed) targetSelect.add(new Option(profile.name + " (self)", "self"));
  if (spec.weaponTarget) {
    for (const eq of session.equipped) {
      if (itemRule(eq.name)?.category === "Weapon") targetSelect.add(new Option(eq.name, "weapon:" + eq.name));
    }
  }
  targetSelect.add(new Option(spec.verb === "Throw" ? "Throw at target / area" : "Another creature or target", "other"));

  let healingInput = null;
  if (spec.healing) {
    healingInput = field("input", "Healing rolled");
    Object.assign(healingInput, {type: "number", min: 0, max: 999, value: "", placeholder: "—"});
  }
  const recipientInput = field("input", "Recipient or note (optional)");
  recipientInput.maxLength = 120;

  if (spec.note) note(spec.note);
  if (rule?.description) {
    const excerpt = rule.description.replace(/\r/g, "").trim().split(/\n\s*\n/)[0];
    if (excerpt) note(excerpt);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const targetVal = targetSelect.value;
    const isSelf = targetVal === "self";
    const targetLabel = recipientInput.value.trim() || targetSelect.selectedOptions[0]?.textContent || "Target";
    dialog.close();
    useConsumableItem(itemId, {
      target: isSelf ? "self" : "other",
      targetLabel,
      healing: healingInput ? Number(healingInput.value) : 0,
      note: recipientInput.value.trim()
    });
  });
  dialog.showModal();
}
