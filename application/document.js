const getElementById = id => document.getElementById(id);

function appendText(parent, tag, value) {
  const element = document.createElement(tag);
  element.textContent = value;
  parent.append(element);
  return element;
}

function wireDialogDismissal(dialog, closeButton) {
  if (closeButton) closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
}

function collectionButton(root, text, label, key, value) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  if (label) button.setAttribute("aria-label", label);
  button.dataset[key] = value;
  root.append(button);
  return button;
}

function infoButton(parent, name, callback) {
  const button = appendText(parent, "button", "ⓘ");
  button.type = "button";
  button.className = "infoBtn";
  button.setAttribute("aria-label", name + " details");
  button.title = name + " details";
  button.setAttribute("aria-haspopup", "dialog");
  button.addEventListener("click", callback);
  return button;
}

function humanizeEnum(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Pure DOM inline markdown tokenizer (zero innerHTML, preserves <strong> & <em>) */
function appendInlineRules(parent, rawText, depth = 0) {
  const text = String(rawText || "").replace(/\uFFFD/g, "—");
  if (depth > 4) {
    parent.append(document.createTextNode(text));
    return;
  }
  const tokenRe = /(\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|__[^_\n]+__|(?<![\w_])_[^_\n]+_(?![\w_])|(?<![\w*])\*[^*\n]+\*(?![\w*]))/g;
  let lastIndex = 0;
  let match;
  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
    }
    const tok = match[0];
    if (tok.startsWith("***") && tok.endsWith("***")) {
      const strong = document.createElement("strong");
      const em = document.createElement("em");
      appendInlineRules(em, tok.slice(3, -3), depth + 1);
      strong.append(em);
      parent.append(strong);
    } else if ((tok.startsWith("**") && tok.endsWith("**")) || (tok.startsWith("__") && tok.endsWith("__"))) {
      const strong = document.createElement("strong");
      appendInlineRules(strong, tok.slice(2, -2), depth + 1);
      parent.append(strong);
    } else {
      const em = document.createElement("em");
      appendInlineRules(em, tok.slice(1, -1), depth + 1);
      parent.append(em);
    }
    lastIndex = tokenRe.lastIndex;
  }
  if (lastIndex < text.length) {
    parent.append(document.createTextNode(text.slice(lastIndex)));
  }
}

function stripRedundantArchetypeHeader(text, archName) {
  const lines = String(text || "").replaceAll("\r", "").trim().split("\n");
  if (lines.length > 1 && archName) {
    const firstClean = lines[0].replace(/[*_]/g, "").trim().toLowerCase();
    if (firstClean.startsWith(archName.toLowerCase() + ":")) {
      return lines.slice(1).join("\n").trim();
    }
  }
  return String(text || "").trim();
}

function isNowrapTableColumn(headerText, sampleCell) {
  const h = String(headerText || "").trim().toLowerCase();
  const s = String(sampleCell || "").trim();
  if (/^(level|lvl|die|dice|d\d+|roll|cost|points?|pts|range|cr|weight|bonus|mod|ac|hp|str|dex|con|int|wis|cha)$/i.test(h)) return true;
  if (/^(\d+d\d+|d\d+|\d+\s*[–-]\s*\d+|[+-]?\d+)$/i.test(s)) return true;
  return false;
}

function renderRulesLines(container, lines) {
  let ul = null;
  let ol = null;
  let table = null;
  let tableColNowrap = [];

  const resetContainers = () => {
    ul = null;
    ol = null;
    table = null;
    tableColNowrap = [];
  };

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      resetContainers();
      i++;
      continue;
    }

    // Blockquote / Droid statblock (consecutive '>' lines)
    if (trimmed.startsWith(">")) {
      resetContainers();
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const bq = document.createElement("blockquote");
      bq.className = "statblock";
      renderRulesLines(bq, quoteLines);
      container.append(bq);
      continue;
    }

    // Horizontal rule (___, ---, ***)
    if (/^([_\-*])\1{2,}$/.test(trimmed)) {
      resetContainers();
      container.append(document.createElement("hr"));
      i++;
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      resetContainers();
      const level = hMatch[1].length >= 4 ? "h4" : "h3";
      const h = document.createElement(level);
      appendInlineRules(h, hMatch[2].trim());
      container.append(h);
      i++;
      continue;
    }

    // Markdown table
    if (trimmed.startsWith("|") && trimmed.includes("|", 1)) {
      ul = null;
      ol = null;
      if (/^\|[\s:|\-]+\|?$/.test(trimmed)) {
        i++;
        continue;
      }
      const rawCols = trimmed.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => c.trim());
      if (!table) {
        const scrollWrap = document.createElement("div");
        scrollWrap.className = "tableScroll";
        table = document.createElement("table");
        scrollWrap.append(table);
        container.append(scrollWrap);
        const headRow = table.createTHead().insertRow();
        tableColNowrap = rawCols.map(c => isNowrapTableColumn(c, ""));
        rawCols.forEach((col, idx) => {
          const th = document.createElement("th");
          th.scope = "col";
          if (tableColNowrap[idx]) th.className = "nowrapCol";
          appendInlineRules(th, col);
          headRow.append(th);
        });
      } else {
        const tbody = table.tBodies[0] || table.createTBody();
        const row = tbody.insertRow();
        rawCols.forEach((col, idx) => {
          const td = document.createElement("td");
          if (tableColNowrap[idx] || isNowrapTableColumn("", col)) td.className = "nowrapCol";
          appendInlineRules(td, col);
          row.append(td);
        });
      }
      i++;
      continue;
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      ol = null;
      table = null;
      if (!ul) ul = appendText(container, "ul", "");
      const li = document.createElement("li");
      appendInlineRules(li, ulMatch[1]);
      ul.append(li);
      i++;
      continue;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (olMatch) {
      ul = null;
      table = null;
      if (!ol) ol = appendText(container, "ol", "");
      const li = document.createElement("li");
      appendInlineRules(li, olMatch[1]);
      ol.append(li);
      i++;
      continue;
    }

    // Paragraph
    resetContainers();
    const p = document.createElement("p");
    appendInlineRules(p, trimmed);
    container.append(p);
    i++;
  }
}

function renderRules(body, content) {
  const text = String(content || "").replaceAll("\r", "").trim();
  if (!text) return null;
  const rulesBox = appendText(body, "div", "");
  rulesBox.className = "ruleText";
  renderRulesLines(rulesBox, text.split("\n"));
  return rulesBox;
}

// Alias for backward compatibility across all modules
const appendRules = renderRules;

function showInfo(name, facts, rulesText) {
  const infoDialog = getElementById("infoModal");
  getElementById("infoTitle").textContent = name;
  const body = getElementById("infoBody");
  body.replaceChildren();
  const entries = facts.filter(([, value]) => value !== null && value !== undefined && value !== false && value !== "");
  if (entries.length) {
    const list = appendText(body, "dl", "");
    list.className = "infoFacts";
    for (const [label, value] of entries) {
      const pair = appendText(list, "div", "");
      appendText(pair, "dt", label);
      if (typeof Node !== "undefined" && value instanceof Node) {
        const dd = document.createElement("dd");
        dd.append(value);
        pair.append(dd);
      } else {
        appendText(pair, "dd", String(value));
      }
    }
  }
  if (rulesText) renderRules(body, rulesText);
  if (infoDialog && !infoDialog.open) infoDialog.showModal();
}

/* Lightweight non-blocking Popover for read-only math breakdowns */
let activeMathPopover = null;
function closeMathPopover() {
  if (!activeMathPopover) return;
  const pop = activeMathPopover;
  activeMathPopover = null;
  if (pop.isConnected) {
    try { if (typeof pop.hidePopover === "function" && pop.matches(":popover-open")) pop.hidePopover(); } catch {}
    pop.remove();
  }
}

function showMathPopover(trigger, title, facts, noteText = "") {
  const sameTrigger = activeMathPopover && activeMathPopover._trigger === trigger;
  closeMathPopover();
  if (sameTrigger) return;

  const entries = (facts || []).filter(([, v]) => v !== null && v !== undefined && v !== false && v !== "");
  const pop = document.createElement("div");
  pop.className = "mathPopover";
  pop.setAttribute("role", "dialog");
  pop.setAttribute("aria-label", title);
  pop._trigger = trigger;

  const supportsPopover = typeof pop.showPopover === "function";
  if (supportsPopover) {
    pop.setAttribute("popover", "auto");
  } else {
    pop.style.position = "fixed";
    pop.style.zIndex = "40";
  }

  const head = appendText(pop, "div", "");
  head.className = "mathPopoverHead";
  appendText(head, "h3", title);
  const closeBtn = appendText(head, "button", "×");
  closeBtn.type = "button";
  closeBtn.className = "mathPopoverClose";
  closeBtn.setAttribute("aria-label", "Close " + title);
  closeBtn.addEventListener("click", closeMathPopover);

  if (entries.length) {
    const dl = appendText(pop, "dl", "");
    dl.className = "mathPopoverList";
    for (const [label, value] of entries) {
      appendText(dl, "dt", label);
      appendText(dl, "dd", String(value));
    }
  }
  if (noteText) {
    const note = appendText(pop, "div", "");
    note.className = "mathPopoverNote";
    appendInlineRules(note, noteText);
  }

  document.body.append(pop);
  activeMathPopover = pop;

  if (supportsPopover) {
    pop.addEventListener("toggle", ev => {
      if (ev.newState === "closed") {
        if (activeMathPopover === pop) activeMathPopover = null;
        pop.remove();
      }
    });
    pop.showPopover();
  }

  // Position near trigger, clamped within viewport
  const rect = trigger?.getBoundingClientRect ? trigger.getBoundingClientRect() : {left: 24, bottom: 24, top: 24};
  const popRect = pop.getBoundingClientRect();
  const vw = window.innerWidth || 1024;
  const vh = window.innerHeight || 768;
  let left = Math.min(Math.max(12, rect.left), Math.max(12, vw - popRect.width - 12));
  let top = rect.bottom + 6;
  if (top + popRect.height > vh - 12) {
    top = Math.max(12, rect.top - popRect.height - 6);
  }
  pop.style.position = "fixed";
  pop.style.left = Math.round(left) + "px";
  pop.style.top = Math.round(top) + "px";
}

if (typeof document !== "undefined") {
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && activeMathPopover) closeMathPopover();
  });
  document.addEventListener("click", event => {
    if (!activeMathPopover) return;
    if (activeMathPopover.contains(event.target)) return;
    if (activeMathPopover._trigger && activeMathPopover._trigger.contains(event.target)) return;
    closeMathPopover();
  });
}

/* Unified ModalFrame primitive (replaces legacy collectionDialog) */
function createModalFrame(title, trigger, opts = {}) {
  const dialog = document.createElement("dialog");
  dialog.className = "sheetDialog" + (opts.size === "reading" ? " modalReading" : opts.size === "catalog" ? " modalCatalog" : "");
  const form = appendText(dialog, "form", "");
  form.method = "dialog";

  const header = appendText(form, "header", "");
  header.className = "top dialogHeader";
  const heading = appendText(header, "h2", title);
  heading.id = "modalFrameTitle_" + Math.random().toString(36).slice(2, 8);
  dialog.setAttribute("aria-labelledby", heading.id);
  const closeBtn = appendText(header, "button", "×");
  closeBtn.type = "button";
  closeBtn.className = "dialogClose";
  closeBtn.setAttribute("aria-label", "Close " + title);

  const body = appendText(form, "div", "");
  body.className = "dialogBody modalFormFields";

  const actions = appendText(form, "footer", "");
  actions.className = "dialogFooter";
  const cancel = appendText(actions, "button", "Cancel");
  cancel.type = "button";
  const confirm = appendText(actions, "button", "Confirm");
  confirm.className = "restPrimary";

  dialog.addEventListener("close", () => {
    dialog.remove();
    if (trigger && trigger.isConnected) trigger.focus({preventScroll: true});
  });
  wireDialogDismissal(dialog, closeBtn);
  cancel.addEventListener("click", () => dialog.close());
  document.body.append(dialog);

  return {
    dialog, form, header, body, actions, cancel, confirm,
    field(tag, label) {
      const wrapper = appendText(body, "label", label);
      return appendText(wrapper, tag, "");
    },
    note(value) {
      const p = appendText(body, "p", value);
      p.className = "muted";
      return p;
    }
  };
}

// Alias so all existing callers immediately upgrade to ModalFrame
const collectionDialog = createModalFrame;

/* SearchablePicker primitive (replaces every <select> with >8 options) */
function createSearchablePicker({options, value = "", placeholder = "Search options", onSelect, getCategory = null, getPreview = null}) {
  const wrap = document.createElement("div");
  wrap.className = "searchablePicker";
  let selected = value || "";
  let activeCategory = "";
  let previewName = "";

  const search = document.createElement("input");
  search.type = "search";
  search.className = "pickerSearch";
  search.placeholder = placeholder;
  search.setAttribute("aria-label", placeholder);
  search.autocomplete = "off";
  wrap.append(search);

  let chipsWrap = null;
  const categories = getCategory ? [...new Set(options.map(o => getCategory(o)).filter(Boolean))].sort() : [];
  if (categories.length > 1) {
    chipsWrap = appendText(wrap, "div", "");
    chipsWrap.className = "pickerChips";
  }

  const list = appendText(wrap, "div", "");
  list.className = "pickerList";

  const previewBox = appendText(wrap, "div", "");
  previewBox.className = "pickerPreview";
  previewBox.hidden = true;

  const renderPreview = name => {
    previewBox.replaceChildren();
    if (!name || !getPreview) {
      previewBox.hidden = true;
      return;
    }
    const text = getPreview(name);
    if (!text) {
      previewBox.hidden = true;
      return;
    }
    appendText(previewBox, "strong", name);
    renderRules(previewBox, text);
    previewBox.hidden = false;
  };

  const renderChips = () => {
    if (!chipsWrap) return;
    chipsWrap.replaceChildren();
    for (const cat of ["", ...categories]) {
      const btn = appendText(chipsWrap, "button", cat || "All");
      btn.type = "button";
      btn.className = "pickerChip";
      btn.setAttribute("aria-pressed", String(activeCategory === cat));
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderChips();
        renderList();
      });
    }
  };

  const renderList = () => {
    list.replaceChildren();
    const q = search.value.trim().toLowerCase();
    const filtered = options.filter(opt => {
      if (activeCategory && getCategory && getCategory(opt) !== activeCategory) return false;
      if (!q) return true;
      return String(opt).toLowerCase().includes(q);
    });
    if (!filtered.length) {
      const empty = appendText(list, "p", "No matching options.");
      empty.className = "muted";
      empty.style.padding = "8px 10px";
      return;
    }
    for (const opt of filtered.slice(0, 80)) {
      const row = appendText(list, "div", "");
      row.className = "pickerRow";
      const btn = appendText(row, "button", opt);
      btn.type = "button";
      btn.className = "pickerOptionBtn";
      btn.setAttribute("aria-pressed", String(selected === opt));
      btn.addEventListener("click", () => {
        selected = opt;
        if (onSelect) onSelect(opt);
        renderList();
      });
      if (getPreview) {
        const info = appendText(row, "button", "ⓘ");
        info.type = "button";
        info.className = "infoBtn";
        info.setAttribute("aria-label", "Preview " + opt);
        info.addEventListener("click", () => {
          previewName = previewName === opt ? "" : opt;
          renderPreview(previewName);
        });
      }
    }
    if (filtered.length > 80) {
      const more = appendText(list, "p", "Showing first 80 of " + filtered.length + " — type to narrow.");
      more.className = "muted";
      more.style.padding = "6px 10px";
    }
  };

  search.addEventListener("input", renderList);
  renderChips();
  renderList();

  return {
    element: wrap,
    search,
    getValue: () => selected,
    setValue: v => { selected = v; renderList(); }
  };
}

/* Standardized raw die-roll input field:
   - Starts blank (placeholder "—"), never pre-filled
   - Accepts ONLY the raw die roll (diceCount .. diceCount * dieSides)
   - Roll button populates ONLY the raw die roll
   - Automatically adds modifier/multiplier and shows a live total preview */
function createDieRollField(body, {
  diceCount = 1,
  dieSides = 6,
  modifier = 0,
  modifierLabel = "",
  multiplier = 1,
  minFloor = 0,
  unit = "",
  label = "",
  formatPreview = null
}) {
  const diceNotation = diceCount + "d" + dieSides;
  const minVal = diceCount;
  const maxVal = diceCount * dieSides;
  const wrapper = appendText(body, "label", label || ("Die roll (" + diceNotation + ")"));
  const input = document.createElement("input");
  Object.assign(input, {
    type: "number",
    min: minVal,
    max: maxVal,
    value: "",
    placeholder: "—",
    required: true
  });
  wrapper.append(input);

  const row = appendText(body, "div", "");
  row.className = "row wrap";
  const rollBtn = appendText(row, "button", "Roll " + diceNotation);
  rollBtn.type = "button";
  const preview = appendText(row, "span", "");
  preview.className = "muted";

  const computeTotal = raw => {
    const base = raw * multiplier + modifier;
    return Math.max(minFloor, Math.max(0, base));
  };

  const syncPreview = () => {
    const rawStr = input.value.trim();
    if (!rawStr) {
      if (formatPreview) {
        preview.textContent = formatPreview(null, null);
      } else if (modifier !== 0) {
        const modText = (modifier > 0 ? "+ " + modifier : "− " + Math.abs(modifier)) + (modifierLabel ? " (" + modifierLabel + ")" : "");
        preview.textContent = "Total: — " + modText + (unit ? " " + unit : "");
      } else if (multiplier !== 1) {
        preview.textContent = "Total: — × " + multiplier + (unit ? " " + unit : "");
      } else {
        preview.textContent = "Enter " + minVal + "–" + maxVal;
      }
      return;
    }
    const raw = clamp(Math.floor(Number(rawStr) || minVal), minVal, maxVal);
    const total = computeTotal(raw);
    if (formatPreview) {
      preview.textContent = formatPreview(raw, total);
    } else if (modifier !== 0) {
      const modText = (modifier > 0 ? "+ " + modifier : "− " + Math.abs(modifier)) + (modifierLabel ? " " + modifierLabel : "");
      const floorNote = minFloor > 0 && total === minFloor && raw * multiplier + modifier < minFloor ? " (minimum " + minFloor + ")" : "";
      preview.textContent = "Total: " + total + (unit ? " " + unit : "") + " (" + raw + " " + modText + ")" + floorNote;
    } else if (multiplier !== 1) {
      preview.textContent = "Total: " + total + (unit ? " " + unit : "") + " (" + raw + " × " + multiplier + ")";
    } else {
      preview.textContent = "Total: " + total + (unit ? " " + unit : "");
    }
  };

  rollBtn.addEventListener("click", () => {
    let rolled = 0;
    for (let i = 0; i < diceCount; i++) rolled += rollDie(dieSides);
    input.value = String(rolled);
    syncPreview();
  });
  input.addEventListener("input", syncPreview);
  syncPreview();

  return {
    input,
    rollBtn,
    preview,
    getRaw: () => {
      const n = Math.floor(Number(input.value));
      return Number.isFinite(n) && input.value.trim() !== "" ? clamp(n, minVal, maxVal) : NaN;
    },
    getTotal: () => {
      const n = Math.floor(Number(input.value));
      if (!Number.isFinite(n) || input.value.trim() === "") return NaN;
      return computeTotal(clamp(n, minVal, maxVal));
    }
  };
}
