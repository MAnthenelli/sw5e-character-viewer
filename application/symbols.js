// Shared visual conventions from Kincaid's sheet.
function rollBadge(label) {
  const letter = {Advantage: "A", Disadvantage: "D", Conditional: "?", "Roll normal": "="}[label];
  if (!letter) return "";
  return `<span class="rollBadge" data-mode="${letter}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 1.5 21.5 7v10L12 22.5 2.5 17V7Z M2.5 7 6 8.5 12 3 18 8.5 21.5 7 M2.5 17 6 15.5 12 21 18 15.5 21.5 17"/></svg><span aria-hidden="true">${letter}</span><span class="srOnly">${label}</span></span>`;
}
function rollMode(advantage, disadvantage, conditional = false) {
  if (advantage && disadvantage) return "Roll normal";
  if (conditional) return "Conditional";
  if (advantage) return "Advantage";
  if (disadvantage) return "Disadvantage";
  return "";
}
function displayRollBadge(node, advantage, disadvantage, conditional) {
  node.insertAdjacentHTML("beforeend", rollBadge(rollMode(advantage, disadvantage, conditional)));
}
