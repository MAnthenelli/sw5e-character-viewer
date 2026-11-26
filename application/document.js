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

/* Canonical Rule Element Row primitive shared by actionEntry() and collectionRow() */
function createRuleElementRow(parent, {
  name,
  summary = "",
  details = null,
  mode = null,
  onSummaryClick = null,
  summaryTitle = "View calculation",
  rowClass = "swActionRow",
  actionsClass = "swActionRight",
  alwaysCreateActions = false,
  extras = null
} = {}) {
  const fmtSummary = summary ? String(summary)
    .replace(/(^|[\s(\/])-(?=\d)/g, "$1−")
    .replace(/\bBA\b/g, "bonus action")
    .replace(/\b1st\+\s*lvl\b/gi, "1st-level+")
    .replace(/(\d+(?:st|nd|rd|th))-lvl\b/gi, "$1-level")
    .replace(/(\d+×)lvl\b/gi, "$1 level")
    .replace(/\/lvl\b/gi, " per level")
    .replace(/\bpts\b/gi, "points") : "";
  summary = fmtSummary;
  const row = appendText(parent, "div", "");
  row.className = rowClass;

  const isSplitSummary = Boolean(summary && onSummaryClick);
  const leftHost = isSplitSummary ? appendText(row, "div", "") : row;
  if (isSplitSummary) leftHost.className = "swActionLeft";

  if (details) {
    const trigger = appendText(leftHost, "button", "");
    trigger.type = "button";
    trigger.className = "rowTrigger";
    trigger.setAttribute("aria-label", name + (summary ? ", " + summary : "") + ". View rules.");
    appendText(trigger, "b", name);
    if (summary && !isSplitSummary) {
      const sub = appendText(trigger, "small", summary);
      sub.className = "muted";
      if (mode && typeof displayRollBadge === "function") displayRollBadge(sub, mode.advantage, mode.disadvantage);
    }
    trigger.addEventListener("click", details);
  } else {
    const stat = appendText(leftHost, "div", "");
    stat.className = "rowStatic";
    appendText(stat, "b", name);
    if (summary && !isSplitSummary) {
      const sub = appendText(stat, "small", summary);
      sub.className = "muted";
      if (mode && typeof displayRollBadge === "function") displayRollBadge(sub, mode.advantage, mode.disadvantage);
    }
  }

  if (isSplitSummary) {
    const line = appendText(leftHost, "button", summary);
    line.type = "button";
    line.className = "actionCalcBtn";
    line.setAttribute("aria-label", summary + ". " + summaryTitle);
    line.addEventListener("click", onSummaryClick);
    if (mode && typeof displayRollBadge === "function") displayRollBadge(line, mode.advantage, mode.disadvantage);
  }

  let actions = null;
  const hasExtras = Boolean(extras && extras.length);
  if (alwaysCreateActions || hasExtras) {
    actions = appendText(row, "div", "");
    actions.className = actionsClass;
    if (hasExtras) {
      for (const extra of extras) actions.append(extra);
    }
  }
  return { row, actions };
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

const _WIDE_FACT_LABELS = new Set(["properties", "sheet effects", "chosen powers", "prerequisite", "hp breakdown", "squeezing", "progression", "sources", "attuned items", "granted by", "feat bonuses", "active effects"]);
const _TOTAL_FACT_LABELS = new Set(["armor class", "total", "initiative bonus", "check bonus", "bonus", "current hp", "current size", "current bonus"]);

function renderFactGrid(parent, facts, { compact = false } = {}) {
  const entries = (facts || []).filter(([, value]) => value !== null && value !== undefined && value !== false && value !== "");
  if (!entries.length) return null;
  const list = appendText(parent, "dl", "");
  list.className = compact ? "infoFacts infoFactsCompact" : "infoFacts";
  entries.forEach(([label, value], idx) => {
    const pair = appendText(list, "div", "");
    const isNode = typeof Node !== "undefined" && value instanceof Node;
    const strVal = isNode ? String(value.textContent || "") : String(value);
    const low = String(label || "").toLowerCase();
    const isTotal = _TOTAL_FACT_LABELS.has(low) && (idx === entries.length - 1 || idx === 0);
    const isChipWrap = isNode && Boolean(value.classList?.contains("swPropChips") || value.querySelector?.(".swPropChips"));
    const isWide = isTotal || isChipWrap || strVal.length > 28 || _WIDE_FACT_LABELS.has(low);
    if (isWide) pair.classList.add("is-wide");
    if (isTotal) pair.classList.add("is-total");
    appendText(pair, "dt", label);
    if (isNode) {
      const dd = document.createElement("dd");
      dd.append(value);
      pair.append(dd);
    } else {
      appendText(pair, "dd", strVal);
    }
  });
  return list;
}

let _infoNavStack = [];

function clearInfoNavStack() {
  _infoNavStack = [];
  const backBtn = typeof getElementById === "function" ? getElementById("infoBack") : null;
  const crumbsEl = typeof getElementById === "function" ? getElementById("infoBreadcrumbs") : null;
  if (backBtn) backBtn.hidden = true;
  if (crumbsEl) {
    crumbsEl.replaceChildren();
    crumbsEl.hidden = true;
  }
}

function _renderInfoEntry(entry) {
  if (!entry) return;
  const titleEl = getElementById("infoTitle");
  if (titleEl) titleEl.textContent = entry.name;
  const backBtn = getElementById("infoBack");
  if (backBtn) backBtn.hidden = _infoNavStack.length <= 1;
  const crumbsEl = getElementById("infoBreadcrumbs");
  if (crumbsEl) {
    crumbsEl.replaceChildren();
    if (_infoNavStack.length > 1) {
      crumbsEl.hidden = false;
      _infoNavStack.forEach((item, idx) => {
        if (idx > 0) {
          const sep = appendText(crumbsEl, "span", "›");
          sep.className = "infoCrumbSep";
          sep.setAttribute("aria-hidden", "true");
        }
        if (idx < _infoNavStack.length - 1) {
          const btn = appendText(crumbsEl, "button", item.name);
          btn.type = "button";
          btn.className = "infoCrumbBtn";
          btn.addEventListener("click", () => jumpInfoModal(idx));
        } else {
          const cur = appendText(crumbsEl, "span", item.name);
          cur.className = "infoCrumbCurrent";
          cur.setAttribute("aria-current", "page");
        }
      });
    } else {
      crumbsEl.hidden = true;
    }
  }
  const body = getElementById("infoBody");
  if (!body) return;
  body.replaceChildren();
  const facts = typeof entry.facts === "function" ? entry.facts() : entry.facts;
  renderFactGrid(body, facts);
  if (entry.rulesText) renderRules(body, entry.rulesText);
  if (typeof entry.afterRender === "function") entry.afterRender(body);
  body.scrollTop = 0;
}

function popInfoModal() {
  if (_infoNavStack.length <= 1) return false;
  _infoNavStack.pop();
  _renderInfoEntry(_infoNavStack[_infoNavStack.length - 1]);
  return true;
}

function jumpInfoModal(index) {
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= _infoNavStack.length - 1) return false;
  _infoNavStack = _infoNavStack.slice(0, idx + 1);
  _renderInfoEntry(_infoNavStack[_infoNavStack.length - 1]);
  return true;
}

function showInfo(name, facts, rulesText, opts = {}) {
  const infoDialog = getElementById("infoModal");
  if (infoDialog && !infoDialog._focusRestoreWired) {
    infoDialog._focusRestoreWired = true;
    infoDialog.addEventListener("close", () => {
      if (infoDialog.open) return;
      clearInfoNavStack();
      const trig = infoDialog._trigger;
      infoDialog._trigger = null;
      if (trig && trig.isConnected && typeof trig.focus === "function") trig.focus({preventScroll: true});
    });
  }
  const wasOpen = Boolean(infoDialog && infoDialog.open);
  if (infoDialog && !wasOpen) infoDialog._trigger = document.activeElement;
  const entry = {
    name: String(name || ""),
    facts: facts || [],
    rulesText: rulesText || "",
    afterRender: opts?.afterRender || null,
    navKey: opts?.navKey || String(name || "").trim().toLowerCase()
  };
  if (opts?.push && wasOpen && _infoNavStack.length) {
    const top = _infoNavStack[_infoNavStack.length - 1];
    if (top.navKey !== entry.navKey) _infoNavStack.push(entry);
    else _infoNavStack[_infoNavStack.length - 1] = entry;
  } else {
    _infoNavStack = [entry];
  }
  _renderInfoEntry(entry);
  if (infoDialog && !wasOpen) infoDialog.showModal();
}

/* Lightweight non-blocking Popover for read-only math breakdowns */
let activeMathPopover = null;
function closeMathPopover(restoreFocus = true) {
  if (!activeMathPopover) return;
  const pop = activeMathPopover;
  activeMathPopover = null;
  const trig = pop._trigger;
  if (pop.isConnected) {
    try { if (typeof pop.hidePopover === "function" && pop.matches(":popover-open")) pop.hidePopover(); } catch {}
    pop.remove();
  }
  if (restoreFocus && trig && trig.isConnected && typeof trig.focus === "function") {
    trig.focus({preventScroll: true});
  }
}

function renderFormulaBanner(parent, formulaSpec) {
  if (!parent || !formulaSpec) return null;
  const specs = (Array.isArray(formulaSpec) ? formulaSpec : [formulaSpec]).filter(Boolean);
  if (!specs.length) return null;
  const wrap = appendText(parent, "div", "");
  wrap.className = "formulaBanner";
  for (const spec of specs) {
    const row = appendText(wrap, "div", "");
    row.className = "formulaLine";
    if (spec.rule) {
      const ruleEl = appendText(row, "div", (spec.label ? spec.label + " · " : "") + "Formula: " + spec.rule);
      ruleEl.className = "formulaRule";
    }
    const eqEl = appendText(row, "div", "");
    eqEl.className = "formulaEq";
    if (spec.equation) {
      appendText(eqEl, "span", spec.equation);
    } else if (Array.isArray(spec.terms) && spec.terms.length) {
      const activeTerms = spec.terms.filter(t => t && t.value !== null && t.value !== undefined && t.value !== "");
      activeTerms.forEach((t, idx) => {
        const raw = String(t.value).trim();
        const isNeg = raw.startsWith("-") || raw.startsWith("−");
        const cleanVal = raw.replace(/^[+−-]/, "");
        if (idx > 0) {
          const op = t.op || (isNeg ? "−" : "+");
          appendText(eqEl, "span", " " + op + " ").className = "formulaOp";
        } else if (isNeg && !t.raw) {
          appendText(eqEl, "span", "−").className = "formulaOp";
        }
        const termSpan = appendText(eqEl, "span", "");
        termSpan.className = "formulaTerm";
        if (t.raw) {
          termSpan.textContent = raw;
        } else if (t.label || (Array.isArray(t.sources) && t.sources.length)) {
          const displayVal = idx === 0 ? (isNeg ? "−" + cleanVal : cleanVal) : cleanVal;
          const valSuffix = " (" + (t.signed ? (isNeg ? "−" + cleanVal : "+" + cleanVal) : displayVal) + ")";
          if (Array.isArray(t.sources) && t.sources.length && typeof renderSourceLinks === "function") {
            termSpan.append(renderSourceLinks(t.sources, { separator: ", " }), document.createTextNode(valSuffix));
          } else if (t.source && typeof createRuleLink === "function") {
            termSpan.append(createRuleLink(t.label, t.source), document.createTextNode(valSuffix));
          } else {
            termSpan.textContent = t.label + valSuffix;
          }
        } else {
          termSpan.textContent = idx === 0 ? raw : cleanVal;
        }
      });
    }
    if (spec.total !== undefined && spec.total !== null && spec.total !== "") {
      appendText(eqEl, "span", " = ").className = "formulaOp";
      appendText(eqEl, "strong", String(spec.total)).className = "formulaTotal";
    }
    if (spec.arrowTo) {
      appendText(eqEl, "span", " → ").className = "formulaOp";
      appendText(eqEl, "strong", String(spec.arrowTo)).className = "formulaTotal";
    }
  }
  return wrap;
}

function showMathPopover(trigger, title, facts, noteText = "", actions = [], formula = null, extraContent = null) {
  const sameTrigger = activeMathPopover && activeMathPopover._trigger === trigger;
  closeMathPopover(sameTrigger);
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

  if (formula) {
    renderFormulaBanner(pop, formula);
  }
  if (entries.length) {
    renderFactGrid(pop, entries, { compact: true });
  }
  if (noteText) {
    const appendPopoverNoteText = (el, txt) => {
      const m = String(txt || "").match(/^([^:]{2,48}):\s+(.*)$/);
      if (m && typeof createRuleLink === "function") {
        const linkEl = createRuleLink(m[1].trim(), m[1].trim());
        if (linkEl && linkEl.nodeType === 1) {
          el.append(linkEl, document.createTextNode(": "));
          appendInlineRules(el, m[2]);
          return;
        }
      }
      appendInlineRules(el, txt);
    };
    const parts = String(noteText).split(/\s*·\s*|\n+/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      const ul = appendText(pop, "ul", "");
      ul.className = "popoverNotesList";
      for (const part of parts) {
        const li = appendText(ul, "li", "");
        appendPopoverNoteText(li, part);
      }
    } else {
      const note = appendText(pop, "div", "");
      note.className = "mathPopoverNote";
      appendPopoverNoteText(note, noteText);
    }
  }

  if (typeof extraContent === "function") {
    extraContent(pop);
  } else if (extraContent) {
    pop.append(extraContent);
  }

  if (Array.isArray(actions) && actions.length) {
    const actRow = appendText(pop, "div", "");
    actRow.className = "row wrap mathPopoverActions";
    for (const act of actions) {
      if (!act || !act.label) continue;
      const b = appendText(actRow, "button", act.label);
      b.type = "button";
      if (act.cls) b.className = act.cls;
      b.addEventListener("click", ev => {
        if (act.close !== false) closeMathPopover();
        act.onClick?.(ev);
      });
    }
  }

  document.body.append(pop);
  activeMathPopover = pop;

  if (supportsPopover) {
    pop.addEventListener("toggle", ev => {
      if (ev.newState === "closed") {
        const wasActive = activeMathPopover === pop;
        if (wasActive) activeMathPopover = null;
        pop.remove();
        if (wasActive && pop._trigger && pop._trigger.isConnected && typeof pop._trigger.focus === "function") {
          pop._trigger.focus({preventScroll: true});
        }
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
    top = rect.top - popRect.height - 6;
  }
  top = Math.max(12, Math.min(top, Math.max(12, vh - popRect.height - 12)));
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
  dialog.className = "sheetDialog" + (opts.size === "reading" ? " modalReading" : opts.size === "catalog" ? " modalCatalog" : opts.size === "compact" ? " modalCompact" : "");
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
      if (getPreview && getPreview(opt)) {
        const info = appendText(row, "button", "ⓘ");
        info.type = "button";
        info.className = "infoBtn";
        info.title = "Preview rules";
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
  formatPreview = null,
  impactPreview = null,
  onChange = null
}) {
  const diceNotation = diceCount + "d" + dieSides;
  const minVal = diceCount;
  const maxVal = diceCount * dieSides;

  const box = appendText(body, "div", "");
  box.className = "dieRollBox";

  // Live nested outcome banner at top of die-roll control
  const banner = appendText(box, "div", "");
  banner.className = "dieLiveBanner";
  const bannerLeft = appendText(banner, "div", "");
  const formulaEl = appendText(bannerLeft, "div", "");
  formulaEl.className = "dieLiveFormula";
  const totalEl = appendText(bannerLeft, "div", "");
  totalEl.className = "dieLiveTotal";
  const impactEl = appendText(banner, "div", "");
  impactEl.className = "dieLiveImpact";

  const padLabel = appendText(box, "small", (label || ("Die roll (" + diceNotation + ")")) + (diceCount === 1 && dieSides <= 12 ? " — type, roll, or tap a value" : ""));
  padLabel.className = "muted";

  const row = appendText(box, "div", "");
  row.className = "dieInputRow";
  const input = document.createElement("input");
  Object.assign(input, {
    type: "number",
    min: minVal,
    max: maxVal,
    value: "",
    placeholder: "—",
    required: true
  });
  input.setAttribute("aria-label", label || ("Raw die roll (" + diceNotation + ")"));
  row.append(input);

  const rollBtn = document.createElement("button");
  rollBtn.type = "button";
  rollBtn.className = "dieRollBtn";
  rollBtn.textContent = "Roll " + diceNotation;
  row.append(rollBtn);

  const keyBtns = [];
  if (diceCount === 1 && dieSides <= 12) {
    const keypad = appendText(box, "div", "");
    keypad.className = "dieKeypad";
    for (let v = 1; v <= dieSides; v++) {
      const kb = appendText(keypad, "button", String(v));
      kb.type = "button";
      kb.className = "dieKeyBtn";
      kb.dataset.dieValue = String(v);
      kb.setAttribute("aria-pressed", "false");
      kb.setAttribute("aria-label", "Record roll of " + v);
      kb.addEventListener("click", () => {
        input.value = String(v);
        syncPreview();
      });
      keyBtns.push(kb);
    }
  }

  const computeTotal = raw => {
    const base = raw * multiplier + modifier;
    return Math.max(minFloor, Math.max(0, base));
  };

  const syncKeypad = rawVal => {
    for (const kb of keyBtns) {
      kb.setAttribute("aria-pressed", String(rawVal !== null && Number(kb.dataset.dieValue) === rawVal));
    }
  };

  const syncPreview = () => {
    const rawStr = input.value.trim();
    if (!rawStr) {
      syncKeypad(null);
      if (formatPreview) {
        formulaEl.textContent = formatPreview(null, null);
        totalEl.textContent = "—";
      } else if (modifier !== 0) {
        const modText = (modifier > 0 ? "+ " + modifier : "− " + Math.abs(modifier)) + (modifierLabel ? " (" + modifierLabel + ")" : "");
        formulaEl.textContent = diceNotation + " " + modText;
        totalEl.textContent = "— " + (unit || "");
      } else if (multiplier !== 1) {
        formulaEl.textContent = diceNotation + " × " + multiplier;
        totalEl.textContent = "— " + (unit || "");
      } else {
        formulaEl.textContent = "Enter " + minVal + "–" + maxVal;
        totalEl.textContent = "— " + (unit || "");
      }
      impactEl.textContent = impactPreview ? (impactPreview(null, null) || "") : "";
      if (onChange) onChange(null, null);
      return;
    }
    const raw = clamp(Math.floor(Number(rawStr) || minVal), minVal, maxVal);
    const total = computeTotal(raw);
    syncKeypad(raw);
    if (formatPreview) {
      formulaEl.textContent = formatPreview(raw, total);
      totalEl.textContent = total + (unit ? " " + unit : "");
    } else if (modifier !== 0) {
      const modText = (modifier > 0 ? "+ " + modifier : "− " + Math.abs(modifier)) + (modifierLabel ? " (" + modifierLabel + ")" : "");
      const floorNote = minFloor > 0 && total === minFloor && raw * multiplier + modifier < minFloor ? " (min " + minFloor + ")" : "";
      formulaEl.textContent = "Roll " + raw + " " + modText + floorNote;
      totalEl.textContent = "+" + total + (unit ? " " + unit : "");
    } else if (multiplier !== 1) {
      formulaEl.textContent = "Roll " + raw + " × " + multiplier;
      totalEl.textContent = "+" + total + (unit ? " " + unit : "");
    } else {
      formulaEl.textContent = "Raw roll (" + diceNotation + ")";
      totalEl.textContent = "+" + total + (unit ? " " + unit : "");
    }
    impactEl.textContent = impactPreview ? (impactPreview(raw, total) || "") : "";
    if (onChange) onChange(raw, total);
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
    getRaw: () => {
      const rawStr = input.value.trim();
      if (!rawStr) return NaN;
      return clamp(Math.floor(Number(rawStr)), minVal, maxVal);
    },
    getTotal: () => {
      const rawStr = input.value.trim();
      if (!rawStr) return NaN;
      return computeTotal(clamp(Math.floor(Number(rawStr)), minVal, maxVal));
    },
    syncPreview
  };
}


/* ============================================================================
   Pass 14: Universal Rule-Element Resolver, Parent Provenance & .ruleLink UI
   ============================================================================ */

const SUPPORTED_RULE_ELEMENT_KINDS = Object.freeze([
  "feat", "class", "classFeature", "archetype", "archetypeFeature",
  "classOption", "classImprovement", "multiclassImprovement", "splashclassImprovement",
  "fightingStyle", "fightingMastery", "lightsaberForm", "maneuver",
  "weaponFocus", "weaponSupremacy", "weaponProperty", "armorProperty",
  "power", "species", "background", "condition", "equipment"
]);

function _normRuleKey(s) {
  if (typeof normalizeName === "function") return normalizeName(s);
  return String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function _fmtSrcBook(s) {
  if (!s) return "";
  return typeof formatSourceBook === "function" ? formatSourceBook(s) : String(s);
}

function _canonicalRuleKind(rawKind, sourceObj = null) {
  const k = String(rawKind || "").trim();
  if (!k) return "";
  const low = k.toLowerCase();
  if (low === "activepower" || low === "innatepower" || low === "power") return "power";
  if (low === "shieldproperty" || low === "armorproperty") return "armorProperty";
  if (low === "weaponproperty") return "weaponProperty";
  if (low === "property") {
    if (sourceObj?.propertyKind === "armorProperty") return "armorProperty";
    if (sourceObj?.propertyKind === "weaponProperty") return "weaponProperty";
    return "property";
  }
  const exact = SUPPORTED_RULE_ELEMENT_KINDS.find(x => x.toLowerCase() === low);
  return exact || k;
}

function _inferRuleParent(kind, name, record, sourceObj, profile, session) {
  if (sourceObj?.parent && (sourceObj.parent.name || sourceObj.parent.kind)) {
    return sourceObj.parent;
  }
  const nk = _normRuleKey(name);
  const featList = Array.isArray(session?.feats) ? session.feats : (Array.isArray(profile?.selectedFeats) ? profile.selectedFeats : []);
  const findGrantingFeat = (matchKinds) => {
    for (const f of featList) {
      const fName = typeof f === "string" ? f : f?.name;
      const fRule = typeof featRule === "function" ? featRule(fName) : null;
      if (!fRule) continue;
      const fck = typeof featChoiceKind === "function" ? featChoiceKind(fRule) : "";
      const fExtra = fRule?.extraChoiceSpec?.kind || "";
      if (!matchKinds.includes(fck) && !matchKinds.includes(fExtra)) continue;
      const picks = [
        ...(typeof f === "object" && f?.choice ? [f.choice] : []),
        ...(typeof f === "object" && Array.isArray(f?.multiChoice) ? f.multiChoice : [])
      ].filter(Boolean);
      const recGroup = record?.group ? _normRuleKey(record.group) : "";
      const recCls = record?.className ? _normRuleKey(record.className) : "";
      if (picks.some(p => {
        const np = _normRuleKey(p);
        return np === nk || (recGroup && np === recGroup) || (recCls && np === recCls);
      })) {
        return { kind: "feat", name: fRule.name };
      }
    }
    return null;
  };

  if (kind === "weaponFocus") return findGrantingFeat(["weaponFocus"]);
  if (kind === "weaponSupremacy") return findGrantingFeat(["weaponSupremacy"]);
  if (kind === "classImprovement") {
    const f = findGrantingFeat(["classImprovement"]);
    if (f) return f;
    if (record?.className) return { kind: "class", name: record.className };
    return null;
  }
  if (kind === "multiclassImprovement") {
    const f = findGrantingFeat(["multiclassImprovements"]);
    if (f) return f;
    return null;
  }
  if (kind === "splashclassImprovement") {
    const f = findGrantingFeat(["class"]);
    if (f) return f;
    return null;
  }
  if (kind === "fightingStyle" || kind === "fightingMastery" || kind === "lightsaberForm" || kind === "maneuver") {
    const f = findGrantingFeat([kind]);
    if (f) return f;
    if (session?.approach && profile?.className && kind === "lightsaberForm") {
      return { kind: "archetype", name: session.approach, className: profile.className };
    }
    if (profile?.className) return { kind: "class", name: profile.className };
    return null;
  }
  if (kind === "classFeature") {
    const clsName = sourceObj?.className || profile?.className || "";
    return clsName ? { kind: "class", name: clsName } : null;
  }
  if (kind === "classOption") {
    const clsName = record?.className || sourceObj?.className || profile?.className || "";
    return clsName ? { kind: "class", name: clsName } : null;
  }
  if (kind === "archetype") {
    const clsName = record?.className || sourceObj?.className || profile?.className || "";
    return clsName ? { kind: "class", name: clsName } : null;
  }
  if (kind === "archetypeFeature") {
    const archName = sourceObj?.archetypeName || session?.approach || profile?.approach || "";
    const clsName = sourceObj?.className || profile?.className || "";
    return archName ? { kind: "archetype", name: archName, className: clsName } : null;
  }
  if (kind === "weaponProperty" || kind === "armorProperty") {
    if (sourceObj?.itemName) return { kind: "equipment", name: sourceObj.itemName, itemId: sourceObj.itemId || "" };
    return null;
  }
  if (kind === "power") {
    if (profile && typeof resolveGrantedPowers === "function") {
      const gpRes = resolveGrantedPowers(profile, session);
      const gpList = Array.isArray(gpRes) ? gpRes : (Array.isArray(gpRes?.list) ? gpRes.list : (Array.isArray(gpRes?.powers) ? gpRes.powers : []));
      const gp = gpList.find(g => _normRuleKey(g.power || g.name) === nk);
      if (gp?.source && (gp.source.name || gp.source.kind)) return gp.source;
    }
    if (profile && typeof resolveInnateActiveEffects === "function") {
      const ie = resolveInnateActiveEffects(profile, session).find(g => _normRuleKey(g.power) === nk);
      if (ie?.source && (ie.source.name || ie.source.kind)) return ie.source;
    }
    return null;
  }
  return null;
}

function buildProvenanceChain(source, profile = null, session = null) {
  const chain = [];
  if (!source) return chain;
  const seen = new Set();
  const rootKey = _canonicalRuleKind(source.kind, source) + ":" + _normRuleKey(source.name);
  seen.add(rootKey);

  let cur = source;
  for (let depth = 0; depth < 6; depth++) {
    const res = resolveRuleElement(cur, profile, session, { skipChain: true });
    const nextParent = cur?.parent || res?.parent || null;
    if (!nextParent || !nextParent.name) break;
    const nextKind = _canonicalRuleKind(nextParent.kind, nextParent);
    const nextKey = nextKind + ":" + _normRuleKey(nextParent.name);
    if (seen.has(nextKey)) break;
    seen.add(nextKey);
    const parentResolved = resolveRuleElement(nextParent, profile, session, { skipChain: true });
    if (!parentResolved) break;
    chain.push({
      label: parentResolved.name,
      source: { ...nextParent, kind: parentResolved.kind, name: parentResolved.name }
    });
    cur = { ...nextParent, kind: parentResolved.kind, name: parentResolved.name };
  }
  return chain;
}

function resolveRuleElement(source, profile = null, session = null, opts = {}) {
  if (!source) return null;
  const srcObj = typeof source === "string" ? { name: source } : source;
  const rawName = String(srcObj.name || "").trim();
  if (!rawName) return null;
  const nk = _normRuleKey(rawName);
  const rawKind = _canonicalRuleKind(srcObj.kind, srcObj);

  const finalize = (kind, name, facts, rulesText, record, extra = {}) => {
    const parent = _inferRuleParent(kind, name, record, srcObj, profile, session);
    const out = {
      kind,
      name,
      facts: (facts || []).filter(f => Array.isArray(f) && f[0] && f[1] !== null && f[1] !== undefined && f[1] !== false && f[1] !== ""),
      rulesText: String(rulesText || ""),
      record: record || null,
      parent,
      navKey: kind + ":" + _normRuleKey(name),
      ...extra
    };
    if (!opts.skipChain) {
      out.provenanceChain = buildProvenanceChain({ ...srcObj, kind, name, ...(parent ? { parent } : {}) }, profile, session);
    }
    return out;
  };

  const tryKind = (k) => {
    switch (k) {
      case "feat": {
        const rec = typeof featRule === "function" ? featRule(rawName) : (typeof SW5E_FEATS !== "undefined" ? SW5E_FEATS.find(f => _normRuleKey(f.name) === nk) : null);
        if (!rec) return null;
        const sel = (session?.feats || []).find(f => _normRuleKey(typeof f === "string" ? f : f?.name) === _normRuleKey(rec.name)) || null;
        const facts = [
          ["Kind", "Feat"],
          ["Category", typeof categoryOf === "function" ? categoryOf("feat", rec) : (rec.category || "")],
          ["Selected via", sel?.source || ""],
          ["Ability choice", sel?.abilityChoice || ""],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ];
        const selectionList = [
          ...(sel?.choice ? [sel.choice] : []),
          ...(Array.isArray(sel?.multiChoice) ? sel.multiChoice : [])
        ].filter(Boolean);
        const powersChoice = Array.isArray(sel?.powersChoice) ? sel.powersChoice.filter(Boolean) : [];
        return finalize("feat", rec.name, facts, sel?.rules || rec.rules || rec.text || rec.description || "", rec, { selectionList, powersChoice });
      }
      case "class": {
        const rec = typeof classRecord === "function" ? classRecord(rawName) : (typeof SW5E_CLASSES !== "undefined" ? SW5E_CLASSES.find(c => _normRuleKey(c.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", "Class"],
          ["Hit Die", rec.hitDie ? "d" + rec.hitDie : (rec.hitDiceDieType ? "d" + rec.hitDiceDieType : "")],
          ["Saving Throws", Array.isArray(rec.savingThrows) ? rec.savingThrows.join(", ") : ""],
          ["Armor Proficiencies", Array.isArray(rec.armorProficiencies) ? rec.armorProficiencies.join(", ") : ""],
          ["Weapon Proficiencies", Array.isArray(rec.weaponProficiencies) ? rec.weaponProficiencies.join(", ") : ""],
          ["Source", _fmtSrcBook(rec.source || "Player's Handbook")]
        ];
        const lvl = profile && _normRuleKey(profile.className) === _normRuleKey(rec.name) ? (profile.level || 1) : 20;
        const featEntries = (typeof classFeaturesWithLevels === "function" && profile && _normRuleKey(profile.className) === _normRuleKey(rec.name))
          ? classFeaturesWithLevels(profile)
          : Object.entries(rec.rules || rec.features || {}).map(([fn, ft]) => ({ name: fn, level: null, text: ft }));
        const body = featEntries.slice(0, 12).map(fe => "### " + fe.name + (fe.level ? " (Level " + fe.level + ")" : "") + "\n" + (fe.text || "")).join("\n\n") || (rec.summary || "");
        return finalize("class", rec.name, facts, body, rec);
      }
      case "classFeature": {
        const clsName = srcObj.className || profile?.className || "";
        const txt = (typeof classRule === "function" && clsName) ? classRule(clsName, rawName) : "";
        let foundCls = clsName;
        let foundTxt = txt;
        let foundName = rawName;
        if (!foundTxt && typeof SW5E_CLASSES !== "undefined") {
          for (const cls of SW5E_CLASSES) {
            const clsMap = cls.rules || cls.features || {};
            const matchKey = Object.keys(clsMap).find(fk => _normRuleKey(fk) === nk);
            if (matchKey) {
              foundCls = cls.name;
              foundName = matchKey;
              foundTxt = clsMap[matchKey];
              break;
            }
          }
        }
        if (!foundTxt) return null;
        let featLvl = "";
        if (profile && typeof classFeaturesWithLevels === "function" && _normRuleKey(profile.className) === _normRuleKey(foundCls)) {
          const hit = classFeaturesWithLevels(profile).find(fe => _normRuleKey(fe.name) === _normRuleKey(foundName));
          if (hit?.level) featLvl = "Level " + hit.level;
        }
        const facts = [
          ["Kind", "Class Feature"],
          ["Level", featLvl]
        ];
        return finalize("classFeature", foundName, facts, foundTxt, { name: foundName, className: foundCls });
      }
      case "archetype": {
        const rec = typeof archetypeRecord === "function"
          ? archetypeRecord(rawName, srcObj.className || profile?.className || "")
          : (typeof SW5E_ARCHETYPES !== "undefined" ? SW5E_ARCHETYPES.find(a => _normRuleKey(a.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", "Archetype"],
          ["Source", _fmtSrcBook(rec.source)]
        ];
        const body = typeof rec.rules === "string" ? rec.rules : Object.entries(rec.rules || {}).map(([fn, ft]) => "### " + fn + "\n" + ft).join("\n\n") || "";
        return finalize("archetype", rec.name, facts, body, rec);
      }
      case "archetypeFeature": {
        const archName = srcObj.archetypeName || session?.approach || profile?.approach || "";
        const clsName = srcObj.className || profile?.className || "";
        let foundTxt = (typeof approachRule === "function" && profile) ? approachRule(profile, session || { approach: archName }, rawName) : "";
        let foundName = rawName;
        let foundArch = archName;
        let foundCls = clsName;
        if (!foundTxt && typeof SW5E_ARCHETYPES !== "undefined") {
          const pool = archName ? SW5E_ARCHETYPES.filter(a => _normRuleKey(a.name) === _normRuleKey(archName)) : SW5E_ARCHETYPES;
          for (const a of pool) {
            const aMap = (a.rules && typeof a.rules === "object") ? a.rules : {};
            const matchKey = Object.keys(aMap).find(fk => _normRuleKey(fk) === nk);
            if (matchKey) {
              foundArch = a.name;
              foundCls = a.className || foundCls;
              foundName = matchKey;
              foundTxt = aMap[matchKey];
              break;
            }
          }
        }
        if (!foundTxt) return null;
        return finalize("archetypeFeature", foundName, [["Kind", "Archetype Feature"]], foundTxt, { name: foundName, archetypeName: foundArch, className: foundCls });
      }
      case "classOption": {
        const rec = typeof classOptionRule === "function"
          ? classOptionRule(rawName)
          : (typeof SW5E_CLASS_OPTIONS !== "undefined" ? SW5E_CLASS_OPTIONS.find(o => _normRuleKey(o.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", rec.poolName || rec.category || "Customization"],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ];
        return finalize("classOption", rec.name, facts, rec.description || "", rec);
      }
      case "classImprovement": {
        if (typeof SW5E_CLASS_IMPROVEMENTS === "undefined") return null;
        const rec = SW5E_CLASS_IMPROVEMENTS.find(x =>
          _normRuleKey(x.label) === nk ||
          _normRuleKey(x.className) === nk ||
          _normRuleKey((x.className || "") + " improvement") === nk
        );
        if (!rec) return null;
        const facts = [
          ["Kind", "Class Improvement"],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source || "Expanded Content")]
        ];
        return finalize("classImprovement", rec.label || (rec.className + " Improvement"), facts, rec.description || "", rec);
      }
      case "multiclassImprovement": {
        if (typeof SW5E_MULTICLASS_IMPROVEMENTS === "undefined") return null;
        const bare = nk.replace(/\s*multiclass improvement\s*$/i, "").trim();
        const rec = SW5E_MULTICLASS_IMPROVEMENTS.find(x =>
          _normRuleKey(x.name) === nk ||
          _normRuleKey(x.className) === nk ||
          _normRuleKey(x.className) === bare ||
          _normRuleKey((x.className || "") + " multiclass improvement") === nk
        );
        if (!rec) return null;
        const facts = [
          ["Kind", "Multiclass Improvement"],
          ["Class", rec.className || ""],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source || "Expanded Content")]
        ];
        return finalize("multiclassImprovement", (rec.className || rec.name) + " Multiclass Improvement", facts, rec.description || "", rec);
      }
      case "splashclassImprovement": {
        if (typeof SW5E_SPLASHCLASS_IMPROVEMENTS === "undefined") return null;
        const bare = nk.replace(/\s*splashclass improvement\s*$/i, "").trim();
        const rec = SW5E_SPLASHCLASS_IMPROVEMENTS.find(x =>
          _normRuleKey(x.name) === nk ||
          _normRuleKey(x.className) === nk ||
          _normRuleKey(x.className) === bare ||
          _normRuleKey((x.className || "") + " splashclass improvement") === nk
        );
        if (!rec) return null;
        const facts = [
          ["Kind", "Splashclass Improvement"],
          ["Class", rec.className || ""],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source || "Expanded Content")]
        ];
        return finalize("splashclassImprovement", (rec.className || rec.name) + " Splashclass Improvement", facts, rec.description || "", rec);
      }
      case "fightingStyle": {
        const rec = typeof fightingStyleRule === "function" ? fightingStyleRule(rawName) : (typeof SW5E_FIGHTING_STYLES !== "undefined" ? SW5E_FIGHTING_STYLES.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        return finalize("fightingStyle", rec.name, [
          ["Kind", "Fighting Style"],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ], rec.description || "", rec);
      }
      case "fightingMastery": {
        const rec = typeof fightingMasteryRule === "function" ? fightingMasteryRule(rawName) : (typeof SW5E_FIGHTING_MASTERIES !== "undefined" ? SW5E_FIGHTING_MASTERIES.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        return finalize("fightingMastery", rec.name, [
          ["Kind", "Fighting Mastery"],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ], rec.description || "", rec);
      }
      case "lightsaberForm": {
        const rec = typeof lightsaberFormRule === "function" ? lightsaberFormRule(rawName) : (typeof SW5E_LIGHTSABER_FORMS !== "undefined" ? SW5E_LIGHTSABER_FORMS.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        return finalize("lightsaberForm", rec.name, [
          ["Kind", "Lightsaber Form"],
          ["Prerequisite", rec.prerequisite || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ], rec.description || "", rec);
      }
      case "maneuver": {
        const rec = typeof maneuverRule === "function" ? maneuverRule(rawName) : (typeof SW5E_MANEUVERS !== "undefined" ? SW5E_MANEUVERS.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", "Maneuver"],
          ["Category", rec.type || ""],
          ["Timing", rec.mechanics?.timing && typeof formatTimingLabel === "function" ? formatTimingLabel(rec.mechanics.timing) : (rec.mechanics?.timing || "")]
        ];
        if (rec.mechanics?.save && profile && typeof superiorityStats === "function") {
          const sup = superiorityStats(profile, session || {});
          const fullAb = { STR: "Strength", DEX: "Dexterity", CON: "Constitution", INT: "Intelligence", WIS: "Wisdom", CHA: "Charisma" };
          const versatileList = typeof generalManeuverOverrides === "function" ? generalManeuverOverrides(profile, session || {}) : [];
          const effType = versatileList.some(v => _normRuleKey(v) === _normRuleKey(rec.name)) ? "General" : (rec.type || "General");
          facts.push(["Save DC", "DC " + sup.dcFor(effType) + " " + (fullAb[rec.mechanics.save] || rec.mechanics.save)]);
        }
        if (rec.prerequisite) facts.push(["Prerequisite", rec.prerequisite]);
        if (rec.source) facts.push(["Source", _fmtSrcBook(rec.source)]);
        return finalize("maneuver", rec.name, facts, rec.description || "", rec);
      }
      case "weaponFocus": {
        const rec = typeof weaponFocusRule === "function" ? weaponFocusRule(rawName, { allowBare: true }) : (typeof SW5E_WEAPON_FOCUSES !== "undefined" ? SW5E_WEAPON_FOCUSES.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        return finalize("weaponFocus", rec.name, [
          ["Kind", "Weapon Focus"],
          ["Weapon Group", rec.group || "—"],
          ["Source", _fmtSrcBook(rec.source)]
        ], rec.description || "", rec);
      }
      case "weaponSupremacy": {
        const rec = typeof weaponSupremacyRule === "function" ? weaponSupremacyRule(rawName, { allowBare: true }) : (typeof SW5E_WEAPON_SUPREMACIES !== "undefined" ? SW5E_WEAPON_SUPREMACIES.find(x => _normRuleKey(x.name) === nk) : null);
        if (!rec) return null;
        return finalize("weaponSupremacy", rec.name, [
          ["Kind", "Weapon Supremacy"],
          ["Weapon Group", rec.group || "—"],
          ["Source", _fmtSrcBook(rec.source)]
        ], rec.description || "", rec);
      }
      case "weaponProperty": {
        const pName = typeof parsePropertySpec === "function" ? parsePropertySpec(rawName).name : rawName;
        const pnk = _normRuleKey(pName);
        const rec = typeof SW5E_WEAPON_PROPERTIES !== "undefined" ? SW5E_WEAPON_PROPERTIES.find(x => _normRuleKey(x.name) === pnk) : null;
        if (!rec) return null;
        return finalize("weaponProperty", rec.name, [
          ["Kind", "Weapon Property"],
          ["Property", srcObj.rawProperty && _normRuleKey(srcObj.rawProperty) !== pnk ? srcObj.rawProperty : ""]
        ], rec.description || "", rec);
      }
      case "armorProperty": {
        const pName = typeof parsePropertySpec === "function" ? parsePropertySpec(rawName).name : rawName;
        const pnk = _normRuleKey(pName);
        const rec = typeof SW5E_ARMOR_PROPERTIES !== "undefined" ? SW5E_ARMOR_PROPERTIES.find(x => _normRuleKey(x.name) === pnk) : null;
        if (!rec) return null;
        return finalize("armorProperty", rec.name, [
          ["Kind", rec.appliesTo === "shield" ? "Shield Property" : "Armor Property"],
          ["Property", srcObj.rawProperty && _normRuleKey(srcObj.rawProperty) !== pnk ? srcObj.rawProperty : ""]
        ], rec.description || "", rec);
      }
      case "property": {
        return tryKind("weaponProperty") || tryKind("armorProperty");
      }
      case "power": {
        const rec = typeof powerRule === "function" ? powerRule(rawName) : (typeof SW5E_POWERS !== "undefined" ? SW5E_POWERS.find(p => _normRuleKey(p.name) === nk) : null);
        if (!rec) return null;
        const costTxt = rec.level
          ? ("Level " + rec.level + (typeof powerPointCost === "function" ? " (" + powerPointCost(rec.level) + " points)" : ""))
          : "At-will";
        const facts = [
          ["Kind", (rec.type || "") + " Power"],
          ["Alignment", rec.alignment || ""],
          ["Level", costTxt],
          ["Casting time", rec.castingPeriodText || ""],
          ["Range", rec.range || ""],
          ["Duration", (rec.concentration ? "Concentration, " : "") + (rec.duration || "")],
          ["Prerequisite", rec.prerequisite || ""],
          ["Sheet effects", typeof summarizePowerEffects === "function" ? summarizePowerEffects(rec.effects) : ""]
        ];
        const body = (rec.description || "") + (rec.higherLevel ? "\n\nAt Higher Levels: " + rec.higherLevel : "");
        return finalize("power", rec.name, facts, body, rec);
      }
      case "species": {
        const rec = typeof speciesRecord === "function" ? speciesRecord(rawName) : (typeof SW5E_SPECIES !== "undefined" ? SW5E_SPECIES.find(s => _normRuleKey(s.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", "Species"],
          ["Size", rec.size || ""],
          ["Speed", rec.speed ? rec.speed + " ft" : ""],
          ["Languages", Array.isArray(rec.languages) ? rec.languages.join(", ") : (rec.language || "")],
          ["Source", _fmtSrcBook(rec.source)]
        ];
        const body = (rec.traits || []).map(t => "### " + t.name + "\n" + (t.description || "")).join("\n\n");
        return finalize("species", rec.name, facts, body, rec);
      }
      case "background": {
        const rec = typeof backgroundRecord === "function" ? backgroundRecord(rawName) : (typeof SW5E_BACKGROUNDS !== "undefined" ? SW5E_BACKGROUNDS.find(b => _normRuleKey(b.name) === nk) : null);
        if (!rec) return null;
        const facts = [
          ["Kind", "Background"],
          ["Skills", Array.isArray(rec.skills) ? rec.skills.join(", ") : ""],
          ["Tools", Array.isArray(rec.tools) ? rec.tools.join(", ") : (rec.toolProficiencies || "")],
          ["Feature", rec.featureName || ""],
          ["Source", _fmtSrcBook(rec.source)]
        ];
        const body = [rec.featureText || "", rec.description || ""].filter(Boolean).join("\n\n");
        return finalize("background", rec.name, facts, body, rec);
      }
      case "condition": {
        if (typeof SW5E_CONDITIONS === "undefined") return null;
        const matchKey = Object.keys(SW5E_CONDITIONS).find(ck => _normRuleKey(ck) === nk);
        if (!matchKey) return null;
        return finalize("condition", matchKey, [["Kind", "Condition"]], SW5E_CONDITIONS[matchKey], { name: matchKey });
      }
      case "equipment": {
        const equippedItem = (session?.equipped || []).find(eq =>
          (srcObj.itemId && eq.id === srcObj.itemId) || _normRuleKey(eq.name) === nk
        ) || null;
        const rec = equippedItem && typeof activeWeaponRule === "function"
          ? activeWeaponRule(equippedItem).rule
          : (typeof itemRule === "function" ? itemRule(rawName) : null);
        if (!rec && !equippedItem) return null;
        const itemName = equippedItem?.name || rec?.name || rawName;
        const facts = [
          ["Kind", "Equipment"],
          ["Category", rec?.category && typeof formatCategory === "function" ? formatCategory(rec.category) : (rec?.category || "")],
          ["Armor Class", rec?.ac || ""],
          ["Weight", rec?.weight ? rec.weight + " lb" : ""],
          ["Source", _fmtSrcBook(rec?.source)]
        ];
        return finalize("equipment", itemName, facts, rec?.description || "", rec, { equippedItem });
      }
      default:
        return null;
    }
  };

  if (rawKind && rawKind !== "action" && rawKind !== "custom") {
    const direct = tryKind(rawKind);
    if (direct) return direct;
  }

  // Deterministic fallback search when kind is omitted or generic (e.g., string source or action)
  const fallbackOrder = [
    "feat", "power", "weaponSupremacy", "weaponFocus",
    "classOption", "classImprovement", "multiclassImprovement", "splashclassImprovement",
    "fightingMastery", "fightingStyle", "lightsaberForm", "maneuver",
    "archetypeFeature", "classFeature", "archetype", "class",
    "species", "background", "condition", "equipment", "weaponProperty", "armorProperty"
  ];
  for (const k of fallbackOrder) {
    const hit = tryKind(k);
    if (hit) return hit;
  }
  return null;
}

function createRuleLink(label, source, opts = {}) {
  const display = String(label || (typeof source === "string" ? source : source?.name) || "").trim();
  if (!display) return document.createTextNode("");
  const profile = opts.profile ?? (typeof app !== "undefined" ? app?.character?.profile : null);
  const session = opts.session ?? (typeof app !== "undefined" ? app?.character?.session : null);
  const resolved = resolveRuleElement(source || display, profile, session, { skipChain: true });
  if (!resolved) return document.createTextNode(display);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = opts.className ? ("ruleLink " + opts.className) : "ruleLink";
  btn.textContent = display;
  btn.dataset.ruleKind = resolved.kind;
  btn.dataset.ruleName = resolved.name;
  btn.addEventListener("click", ev => {
    ev.stopPropagation();
    const srcPayload = typeof source === "object" && source ? { ...source, kind: resolved.kind, name: resolved.name } : { kind: resolved.kind, name: resolved.name };
    openRuleElement(srcPayload, {
      push: opts.push ?? Boolean(getElementById("infoModal")?.open),
      profile,
      session
    });
  });
  return btn;
}

function renderSourceLinks(items, opts = {}) {
  const list = (Array.isArray(items) ? items : [items]).filter(Boolean);
  const wrap = document.createElement("span");
  if (opts.className) wrap.className = opts.className;
  const sep = opts.separator ?? ", ";
  list.forEach((item, idx) => {
    if (idx > 0) {
      if (sep.trim() === "›") {
        const sp = appendText(wrap, "span", "›");
        sp.className = "ruleLinkSep";
        sp.setAttribute("aria-hidden", "true");
      } else {
        wrap.append(document.createTextNode(sep));
      }
    }
    const label = typeof item === "string" ? item : (item.label || item.name || item.source?.name || "");
    const src = typeof item === "string" ? item : (item.source || item);
    wrap.append(createRuleLink(label, src, opts));
    if (typeof item === "object" && item.suffix) {
      wrap.append(document.createTextNode(item.suffix));
    }
  });
  return wrap;
}

function openRuleElement(source, opts = {}) {
  const profile = opts.profile ?? (typeof app !== "undefined" ? app?.character?.profile : null);
  const session = opts.session ?? (typeof app !== "undefined" ? app?.character?.session : null);
  const resolved = resolveRuleElement(source, profile, session);
  if (!resolved) return false;

  const infoDialog = typeof getElementById === "function" ? getElementById("infoModal") : null;
  const shouldPush = opts.push ?? Boolean(infoDialog && infoDialog.open);
  if (typeof closeMathPopover === "function" && activeMathPopover) {
    closeMathPopover(false);
  }

  // Equipment uses showItem for full weapon stats + interactive property chips
  if (resolved.kind === "equipment" && typeof showItem === "function") {
    showItem(resolved.name, resolved.equippedItem || null, { push: shouldPush });
    return true;
  }

  const facts = [...resolved.facts];
  if (Array.isArray(opts.extraFacts) && opts.extraFacts.length) {
    for (const ef of opts.extraFacts) {
      if (Array.isArray(ef) && ef[0] && ef[1]) facts.push(ef);
    }
  }
  if (resolved.kind === "feat") {
    if (resolved.selectionList?.length) {
      facts.splice(Math.min(4, facts.length), 0, ["Selection", renderSourceLinks(resolved.selectionList.map(s => ({ label: s, source: s })), { push: true, profile, session })]);
    }
    if (resolved.powersChoice?.length) {
      facts.splice(Math.min(5, facts.length), 0, ["Chosen powers", renderSourceLinks(resolved.powersChoice.map(p => ({ label: p, source: { kind: "power", name: p } })), { push: true, profile, session })]);
    }
  }
  if (resolved.provenanceChain?.length) {
    facts.push([
      "Granted by",
      renderSourceLinks(resolved.provenanceChain, { separator: " › ", className: "ruleLinkChain", push: true, profile, session })
    ]);
  }
  showInfo(resolved.name, facts, resolved.rulesText, { push: shouldPush, navKey: resolved.navKey });
  return true;
}
