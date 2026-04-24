const HIGHLIGHT_ID = "__accessibility_highlight__";
const MONITOR_KEY = "__accessibility_tracker_monitor__";
const MAX_ISSUES_PER_RULE = 120;

const highlightStyle = document.createElement("style");
highlightStyle.textContent = `
@keyframes accessPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.7); }
  70% { box-shadow: 0 0 0 12px rgba(255,0,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,0,0,0); }
}
`;
document.head.appendChild(highlightStyle);

const RULES = {
  missingAlt: {
    rule: "WCAG 1.1.1",
    name: "Image missing alternative text",
    severity: "High",
    why: "Screen reader users need text alternatives to understand meaningful images.",
    fix: '<img src="chart.png" alt="Revenue increased 18 percent in Q4" />',
    tip: "Use empty alt only for decorative images."
  },
  headingHierarchy: {
    rule: "WCAG 1.3.1",
    name: "Heading hierarchy is skipped",
    severity: "Medium",
    why: "A predictable heading outline helps keyboard and assistive technology users navigate quickly.",
    fix: "<h2>Section title</h2>",
    tip: "Do not jump from h1 to h3 unless the document outline truly supports it."
  },
  missingLabel: {
    rule: "WCAG 3.3.2",
    name: "Form control missing label",
    severity: "High",
    why: "Labels tell users what information a form field expects.",
    fix: '<label for="email">Email</label><input id="email" type="email" />',
    tip: "Prefer visible labels; use aria-label only when a visual label is not possible."
  },
  emptyButton: {
    rule: "WCAG 4.1.2",
    name: "Button missing accessible name",
    severity: "High",
    why: "Buttons without names are announced as unlabeled controls.",
    fix: '<button aria-label="Close dialog"><svg aria-hidden="true">...</svg></button>',
    tip: "Icon-only buttons need an aria-label or aria-labelledby."
  },
  weakLinkText: {
    rule: "WCAG 2.4.4",
    name: "Link text is not descriptive",
    severity: "Medium",
    why: "Links should make sense when read out of context.",
    fix: '<a href="/pricing">View pricing plans</a>',
    tip: "Avoid vague labels such as click here, more, and read more."
  },
  duplicateId: {
    rule: "WCAG 4.1.1",
    name: "Duplicate id attribute",
    severity: "Critical",
    why: "Duplicate IDs can break labels, ARIA references, and scripted interactions.",
    fix: '<input id="billing-email" />',
    tip: "Every id value must be unique on the page."
  },
  ariaMisuse: {
    rule: "WCAG 4.1.2",
    name: "ARIA attribute is misused",
    severity: "High",
    why: "Incorrect ARIA can make the accessibility tree inaccurate or unusable.",
    fix: '<div role="button" tabindex="0" aria-pressed="false">Mute</div>',
    tip: "Use native HTML controls first, then add ARIA only when needed."
  },
  focusIssue: {
    rule: "WCAG 2.4.7",
    name: "Focus indicator may be missing",
    severity: "Medium",
    why: "Keyboard users need a visible indication of their current position.",
    fix: "button:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }",
    tip: "Avoid removing outlines unless you replace them with an equally visible style."
  },
  keyboardIssue: {
    rule: "WCAG 2.1.1",
    name: "Interactive element is not keyboard accessible",
    severity: "High",
    why: "All interactive controls must be reachable and operable without a mouse.",
    fix: '<button type="button">Open menu</button>',
    tip: "Prefer button and anchor elements over clickable divs or spans."
  },
  contrastProblem: {
    rule: "WCAG 1.4.3",
    name: "Text contrast may be too low",
    severity: "High",
    why: "Low contrast text is difficult to read for users with low vision or in bright environments.",
    fix: "color: #111827; background-color: #ffffff;",
    tip: "Normal text needs at least 4.5:1 contrast; large text needs 3:1."
  },
  missingLandmark: {
    rule: "WCAG 1.3.1",
    name: "Page is missing key landmarks",
    severity: "Low",
    why: "Landmarks give assistive technology users fast navigation points.",
    fix: "<header>...</header><main>...</main><footer>...</footer>",
    tip: "Most pages should include a main landmark."
  },
  semanticIssue: {
    rule: "WCAG 1.3.1",
    name: "Semantic HTML can be improved",
    severity: "Medium",
    why: "Semantic elements communicate purpose without extra scripting or ARIA.",
    fix: '<nav aria-label="Primary">...</nav>',
    tip: "Use native headings, lists, buttons, links, tables, and landmarks where possible."
  },
  pageMeta: {
    rule: "WCAG 2.4.2",
    name: "Page title or language is missing",
    severity: "Low",
    why: "Title and language metadata help users orient themselves and enable correct pronunciation.",
    fix: '<html lang="en"><title>Checkout - Example</title>',
    tip: "Use a specific page title and a valid language code."
  }
};

const AI_SUGGESTIONS = {
  missingAlt: {
    simpleExplanation: "This image does not have text that describes what it shows.",
    disabilityImpact: "Blind and low-vision users using screen readers may miss important information from the image.",
    semanticReplacement: "If the image is meaningful, keep <img> and add alt text. If it is decorative, use alt=\"\".",
    autoFixable: true
  },
  headingHierarchy: {
    simpleExplanation: "A heading level is skipped, so the page outline may feel out of order.",
    disabilityImpact: "Screen reader and keyboard users often jump by headings; skipped levels make the structure harder to understand.",
    semanticReplacement: "Use heading tags in order, such as h1, then h2, then h3.",
    autoFixable: false
  },
  missingLabel: {
    simpleExplanation: "A form field does not have a clear label.",
    disabilityImpact: "Screen reader users may not know what to type or choose in this field.",
    semanticReplacement: "Use a visible <label> connected to the field with for and id.",
    autoFixable: true
  },
  emptyButton: {
    simpleExplanation: "This button has no readable name.",
    disabilityImpact: "Screen reader users may only hear 'button' with no clue what it does.",
    semanticReplacement: "Use a native <button> with visible text or an aria-label for icon-only buttons.",
    autoFixable: true
  },
  weakLinkText: {
    simpleExplanation: "The link text is too vague.",
    disabilityImpact: "Screen reader users often browse links out of context, so labels like 'click here' are confusing.",
    semanticReplacement: "Use an <a> element with text that describes the destination or action.",
    autoFixable: true
  },
  duplicateId: {
    simpleExplanation: "More than one element uses the same id.",
    disabilityImpact: "Labels and ARIA references can point to the wrong element, which creates confusing announcements.",
    semanticReplacement: "Keep ids unique across the whole document.",
    autoFixable: true
  },
  ariaMisuse: {
    simpleExplanation: "An ARIA attribute points to missing content or hides content that can still receive focus.",
    disabilityImpact: "Assistive technology may announce incorrect information or let users move to invisible controls.",
    semanticReplacement: "Prefer native HTML and only use ARIA when the referenced element exists and matches the behavior.",
    autoFixable: false
  },
  focusIssue: {
    simpleExplanation: "Keyboard focus may not be visible.",
    disabilityImpact: "Keyboard-only users may lose track of where they are on the page.",
    semanticReplacement: "Use :focus-visible styles with a strong outline or visible state.",
    autoFixable: true
  },
  keyboardIssue: {
    simpleExplanation: "A clickable element may not work with the keyboard.",
    disabilityImpact: "People who cannot use a mouse may not be able to reach or activate this control.",
    semanticReplacement: "Replace clickable divs or spans with <button> or <a> when possible.",
    autoFixable: true
  },
  contrastProblem: {
    simpleExplanation: "The text color and background color are too similar.",
    disabilityImpact: "Low-vision users, color-blind users, and users in bright environments may struggle to read the text.",
    semanticReplacement: "Keep the same semantic element, but use colors that meet WCAG contrast ratios.",
    autoFixable: true
  },
  missingLandmark: {
    simpleExplanation: "The page is missing a main landmark.",
    disabilityImpact: "Screen reader users may not have a quick way to jump to the main content.",
    semanticReplacement: "Wrap the primary content in <main> or add role=\"main\".",
    autoFixable: false
  },
  semanticIssue: {
    simpleExplanation: "This element is being used for a job that a semantic HTML element can do better.",
    disabilityImpact: "Assistive technology may not understand the element's purpose or expected interaction.",
    semanticReplacement: "Use native elements such as <button>, <a>, <nav>, <ul>, <li>, and <table>.",
    autoFixable: false
  },
  pageMeta: {
    simpleExplanation: "The page is missing basic metadata such as language or a useful title.",
    disabilityImpact: "Screen readers may pronounce content incorrectly or users may not know which page they are on.",
    semanticReplacement: "Set lang on <html> and use a descriptive <title>.",
    autoFixable: true
  }
};

function scanAccessibility(sendResponse) {
  const startedAt = performance.now();
  const issues = [];
  const counts = {};
  const selectorCache = new WeakMap();

  const addIssue = (ruleKey, element, overrides = {}) => {
    counts[ruleKey] = counts[ruleKey] || 0;
    if (counts[ruleKey] >= MAX_ISSUES_PER_RULE) return;
    counts[ruleKey] += 1;

    const config = RULES[ruleKey];
    const selector = overrides.selector || getUniqueSelector(element, selectorCache);
    const suggestion = buildAiSuggestion(ruleKey, element, {
      ...overrides,
      selector,
      issueName: overrides.name || config.name
    });

    issues.push({
      id: `${ruleKey}-${counts[ruleKey]}`,
      rule: config.rule,
      name: overrides.name || config.name,
      message: overrides.message || config.name,
      severity: overrides.severity || config.severity,
      selector,
      why: overrides.why || config.why,
      codeFix: overrides.codeFix || config.fix,
      bestPractice: overrides.bestPractice || config.tip,
      simpleExplanation: suggestion.simpleExplanation,
      disabilityImpact: suggestion.disabilityImpact,
      correctedHtml: suggestion.correctedHtml,
      contrastColors: suggestion.contrastColors,
      semanticReplacement: suggestion.semanticReplacement,
      autoFixable: suggestion.autoFixable,
      snippet: element && element.outerHTML ? compactSnippet(element.outerHTML) : "",
      impact: overrides.impact || "",
      ruleKey
    });
  };

  document.querySelectorAll("img").forEach((img) => {
    const alt = img.getAttribute("alt");
    const role = img.getAttribute("role");
    if (role !== "presentation" && role !== "none" && (!alt || !alt.trim())) {
      addIssue("missingAlt", img);
    }
  });

  let previousHeading = 0;
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const level = Number(heading.tagName.slice(1));
    if (previousHeading && level > previousHeading + 1) {
      addIssue("headingHierarchy", heading, {
        message: `Heading jumps from h${previousHeading} to h${level}`
      });
    }
    previousHeading = level;
  });

  document.querySelectorAll("input, textarea, select").forEach((input) => {
    if (input.type === "hidden") return;
    if (!hasAccessibleName(input)) addIssue("missingLabel", input);
  });

  document.querySelectorAll("button, [role='button']").forEach((button) => {
    if (!hasAccessibleName(button)) addIssue("emptyButton", button);
  });

  const weakLinks = new Set(["click here", "here", "read more", "more", "learn more", "details"]);
  document.querySelectorAll("a[href]").forEach((link) => {
    const text = getText(link).toLowerCase();
    if (!text || weakLinks.has(text)) addIssue("weakLinkText", link);
  });

  const seenIds = new Map();
  document.querySelectorAll("[id]").forEach((el) => {
    const id = el.id.trim();
    if (!id) return;
    if (seenIds.has(id)) {
      addIssue("duplicateId", el, {
        message: `Duplicate id "${id}"`
      });
    } else {
      seenIds.set(id, el);
    }
  });

  document.querySelectorAll("[aria-labelledby], [aria-describedby], [aria-controls], [aria-owns]").forEach((el) => {
    ["aria-labelledby", "aria-describedby", "aria-controls", "aria-owns"].forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value) return;
      const missing = value.split(/\s+/).filter((id) => id && !document.getElementById(id));
      if (missing.length) {
        addIssue("ariaMisuse", el, {
          message: `${attr} references missing id "${missing[0]}"`
        });
      }
    });
  });

  document.querySelectorAll("[aria-hidden='true']").forEach((el) => {
    if (el.querySelector(focusableSelector()) || isFocusable(el)) {
      addIssue("ariaMisuse", el, {
        message: "aria-hidden element contains focusable content"
      });
    }
  });

  document.querySelectorAll("[role]").forEach((el) => {
    const role = el.getAttribute("role");
    if ((role === "button" || role === "link" || role === "checkbox" || role === "tab") && !isFocusable(el)) {
      addIssue("keyboardIssue", el, {
        message: `Element with role="${role}" is not keyboard focusable`
      });
    }
  });

  document.querySelectorAll("[onclick]").forEach((el) => {
    if (!isNativeInteractive(el) && !isFocusable(el)) addIssue("keyboardIssue", el);
  });

  document.querySelectorAll("[tabindex]").forEach((el) => {
    const value = Number(el.getAttribute("tabindex"));
    if (value > 0) {
      addIssue("focusIssue", el, {
        message: "Positive tabindex can create an unpredictable focus order",
        severity: "Medium"
      });
    }
  });

  document.querySelectorAll(focusableSelector()).forEach((el) => {
    if (!isVisible(el)) return;
    const style = window.getComputedStyle(el);
    if (style.outlineStyle === "none" && style.boxShadow === "none" && style.textDecorationLine === "none") {
      addIssue("focusIssue", el);
    }
  });

  sampleTextElements().forEach((el) => {
    if (!isVisible(el) || !getText(el)) return;
    const style = window.getComputedStyle(el);
    const ratio = contrastRatio(parseColor(style.color), effectiveBackground(el));
    const fontSize = parseFloat(style.fontSize || "16");
    const isLarge = fontSize >= 24 || (fontSize >= 18.66 && Number(style.fontWeight) >= 700);
    const minRatio = isLarge ? 3 : 4.5;
    if (ratio && ratio < minRatio) {
      addIssue("contrastProblem", el, {
        message: `Text contrast is ${ratio.toFixed(2)}:1`,
        contrastColors: suggestContrastColors(style, ratio)
      });
    }
  });

  if (!document.querySelector("main, [role='main']")) {
    addIssue("missingLandmark", document.body, {
      message: "Page is missing a main landmark",
      selector: "body"
    });
  }

  document.querySelectorAll("div[onclick], span[onclick]").forEach((el) => {
    addIssue("semanticIssue", el, {
      message: "Clickable non-semantic element should use a native control"
    });
  });

  document.querySelectorAll("ul > div, ol > div").forEach((el) => {
    addIssue("semanticIssue", el, {
      message: "List contains non-list-item children"
    });
  });

  if (!document.documentElement.getAttribute("lang")) {
    addIssue("pageMeta", document.documentElement, {
      message: "Page is missing a lang attribute",
      selector: "html"
    });
  }

  if (!document.title || document.title.trim().length < 3) {
    addIssue("pageMeta", document.head, {
      message: "Page title is missing or too short",
      selector: "title"
    });
  }

  const summary = summarize(issues);
  sendResponse({
    issues,
    summary,
    score: calculateScore(summary),
    scannedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
    url: location.href,
    title: document.title
  });
}

function summarize(issues) {
  return {
    critical: issues.filter((issue) => issue.severity === "Critical").length,
    high: issues.filter((issue) => issue.severity === "High").length,
    medium: issues.filter((issue) => issue.severity === "Medium").length,
    low: issues.filter((issue) => issue.severity === "Low").length,
    total: issues.length
  };
}

function calculateScore(summary) {
  const penalty = summary.critical * 3 + summary.high * 2 + summary.medium + summary.low * 0.5;
  return Math.max(10 - penalty, 0).toFixed(1);
}

function buildAiSuggestion(ruleKey, element, overrides = {}) {
  const base = AI_SUGGESTIONS[ruleKey] || {};
  const correctedHtml = overrides.correctedHtml || generateCorrectedHtml(ruleKey, element, overrides);
  const contrastColors = overrides.contrastColors || (ruleKey === "contrastProblem" ? defaultContrastColors() : null);

  return {
    simpleExplanation: overrides.simpleExplanation || base.simpleExplanation || "This accessibility issue may make the page harder to use.",
    disabilityImpact: overrides.disabilityImpact || base.disabilityImpact || "Disabled users may have a harder time perceiving, understanding, or operating this content.",
    correctedHtml,
    contrastColors,
    semanticReplacement: overrides.semanticReplacement || base.semanticReplacement || "Use semantic HTML that matches the element's purpose.",
    autoFixable: overrides.autoFixable ?? Boolean(base.autoFixable)
  };
}

function generateCorrectedHtml(ruleKey, element, overrides = {}) {
  if (!element || !element.outerHTML) return overrides.codeFix || RULES[ruleKey]?.fix || "";

  const clone = element.cloneNode(true);
  const label = inferLabel(element, overrides.issueName);

  if (ruleKey === "missingAlt") {
    clone.setAttribute("alt", label || "Describe the image");
  } else if (ruleKey === "missingLabel" || ruleKey === "emptyButton") {
    clone.setAttribute("aria-label", label || "Describe this control");
  } else if (ruleKey === "weakLinkText") {
    clone.textContent = "View details about this topic";
  } else if (ruleKey === "duplicateId") {
    clone.setAttribute("id", `${element.id || "element"}-unique`);
  } else if (ruleKey === "keyboardIssue") {
    clone.setAttribute("role", clone.getAttribute("role") || "button");
    clone.setAttribute("tabindex", "0");
  } else if (ruleKey === "focusIssue") {
    clone.setAttribute("style", mergeInlineStyle(clone.getAttribute("style"), "outline: 3px solid #2563eb; outline-offset: 2px;"));
  } else if (ruleKey === "contrastProblem") {
    clone.setAttribute("style", mergeInlineStyle(clone.getAttribute("style"), "color: #111827; background-color: #ffffff;"));
  } else if (ruleKey === "pageMeta") {
    return '<html lang="en"><head><title>Descriptive page title</title></head>...</html>';
  } else if (ruleKey === "missingLandmark") {
    return "<main>Primary page content</main>";
  } else if (ruleKey === "semanticIssue") {
    return element.tagName === "DIV" || element.tagName === "SPAN"
      ? `<button type="button">${getText(element) || "Action"}</button>`
      : RULES[ruleKey]?.fix || "";
  }

  return compactSnippet(clone.outerHTML);
}

function applyAutoFix(selector, ruleKey, sendResponse) {
  const el = safeQuery(selector);
  if (!el) {
    sendResponse({ fixed: false, message: "Element not found" });
    return;
  }

  const label = inferLabel(el, "Accessibility fix");

  if (ruleKey === "missingAlt") {
    el.setAttribute("alt", label || "Image description needed");
  } else if (ruleKey === "missingLabel" || ruleKey === "emptyButton") {
    el.setAttribute("aria-label", label || "Accessible control");
  } else if (ruleKey === "weakLinkText") {
    el.setAttribute("aria-label", `Open ${document.title || "linked page"}`);
  } else if (ruleKey === "duplicateId") {
    el.id = `${el.id || "element"}-${Date.now()}`;
  } else if (ruleKey === "keyboardIssue") {
    el.setAttribute("tabindex", "0");
    if (!el.getAttribute("role")) el.setAttribute("role", "button");
  } else if (ruleKey === "focusIssue") {
    el.style.outline = "3px solid #2563eb";
    el.style.outlineOffset = "2px";
  } else if (ruleKey === "contrastProblem") {
    el.style.color = "#111827";
    el.style.backgroundColor = "#ffffff";
  } else if (ruleKey === "pageMeta") {
    if (!document.documentElement.getAttribute("lang")) document.documentElement.setAttribute("lang", "en");
    if (!document.title || document.title.trim().length < 3) document.title = "Descriptive page title";
  } else {
    sendResponse({ fixed: false, message: "This issue needs a developer review" });
    return;
  }

  sendResponse({ fixed: true, message: "Auto-fix applied on this page" });
}

function highlightElement(selector, ruleKey) {
  const el = safeQuery(selector);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  const old = document.getElementById(HIGHLIGHT_ID);
  if (old) old.remove();

  const rect = el.getBoundingClientRect();
  const highlight = document.createElement("div");
  highlight.id = HIGHLIGHT_ID;

  const color = {
    missingAlt: "#ff3b30",
    emptyButton: "#ff9500",
    missingLabel: "#007aff",
    weakLinkText: "#af52de",
    keyboardIssue: "#ffd60a",
    semanticIssue: "#34c759",
    contrastProblem: "#dc2626",
    duplicateId: "#b91c1c"
  }[ruleKey] || "#ff9500";

  Object.assign(highlight.style, {
    position: "fixed",
    top: `${rect.top - 6}px`,
    left: `${rect.left - 6}px`,
    width: `${rect.width + 12}px`,
    height: `${rect.height + 12}px`,
    border: `3px solid ${color}`,
    borderRadius: "10px",
    zIndex: "999999",
    pointerEvents: "none",
    animation: "accessPulse 1.2s infinite"
  });

  document.body.appendChild(highlight);
  setTimeout(() => highlight.remove(), 4000);
}

function startMonitoring(sendResponse) {
  if (window[MONITOR_KEY]) {
    sendResponse({ monitoring: true });
    return;
  }

  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      scanAccessibility((result) => {
        chrome.storage?.local?.set({ accessibilityRealtimeScan: result });
      });
    }, 700);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["alt", "aria-label", "aria-labelledby", "role", "id", "class", "style", "tabindex"]
  });

  window[MONITOR_KEY] = observer;
  sendResponse({ monitoring: true });
}

function stopMonitoring(sendResponse) {
  if (window[MONITOR_KEY]) {
    window[MONITOR_KEY].disconnect();
    window[MONITOR_KEY] = null;
  }
  sendResponse({ monitoring: false });
}

function inferLabel(el, fallback) {
  const text = getText(el);
  const title = el?.getAttribute?.("title");
  const placeholder = el?.getAttribute?.("placeholder");
  const src = el?.getAttribute?.("src");

  if (text) return text.slice(0, 80);
  if (title) return title.slice(0, 80);
  if (placeholder) return placeholder.slice(0, 80);
  if (src) {
    const filename = src.split("/").pop()?.split("?")[0]?.replace(/[-_]/g, " ").replace(/\.[a-z0-9]+$/i, "");
    if (filename) return filename.slice(0, 80);
  }

  return fallback || "";
}

function mergeInlineStyle(currentStyle, addition) {
  const current = currentStyle ? `${currentStyle.trim().replace(/;$/, "")}; ` : "";
  return `${current}${addition}`;
}

function defaultContrastColors() {
  return {
    text: "#111827",
    background: "#ffffff",
    ratio: "17.74:1",
    note: "Use dark neutral text on white for body copy, or test your brand colors against a 4.5:1 minimum."
  };
}

function suggestContrastColors(style, currentRatio) {
  const background = parseColor(style.backgroundColor);
  const bgLuminance = luminance(background);
  const useLightText = bgLuminance !== null && bgLuminance < 0.35;

  return {
    text: useLightText ? "#ffffff" : "#111827",
    background: useLightText ? "#111827" : "#ffffff",
    ratio: useLightText ? "17.74:1" : "17.74:1",
    note: `Current contrast is about ${currentRatio.toFixed(2)}:1. Aim for at least 4.5:1 for normal text.`
  };
}

function hasAccessibleName(el) {
  const ariaLabel = el.getAttribute("aria-label");
  const labelledBy = el.getAttribute("aria-labelledby");
  const title = el.getAttribute("title");
  const id = el.getAttribute("id");
  const label = id ? document.querySelector(`label[for="${cssEscape(id)}"]`) : null;
  return Boolean(
    getText(el) ||
    (ariaLabel && ariaLabel.trim()) ||
    (labelledBy && labelledBy.split(/\s+/).some((ref) => getText(document.getElementById(ref)))) ||
    (title && title.trim()) ||
    label
  );
}

function getText(el) {
  return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
}

function focusableSelector() {
  return "a[href], button, input, textarea, select, details, [tabindex]:not([tabindex='-1']), [contenteditable='true']";
}

function isNativeInteractive(el) {
  return ["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT", "SUMMARY"].includes(el.tagName);
}

function isFocusable(el) {
  if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return false;
  if (el.hasAttribute("tabindex")) return Number(el.getAttribute("tabindex")) >= 0;
  return isNativeInteractive(el) || el.getAttribute("contenteditable") === "true";
}

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function sampleTextElements() {
  return Array.from(document.querySelectorAll("p, li, a, button, label, span, small, strong, em, h1, h2, h3, h4, h5, h6"))
    .filter((el) => getText(el).length >= 2)
    .slice(0, 300);
}

function parseColor(value) {
  const match = value && value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] === undefined ? 1 : Number(match[4])
  };
}

function effectiveBackground(el) {
  let node = el;
  while (node && node !== document.documentElement) {
    const color = parseColor(window.getComputedStyle(node).backgroundColor);
    if (color && color.a > 0) return color;
    node = node.parentElement;
  }
  return { r: 255, g: 255, b: 255, a: 1 };
}

function luminance(color) {
  if (!color) return null;
  const channel = [color.r, color.g, color.b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channel[0] * 0.2126 + channel[1] * 0.7152 + channel[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const l1 = luminance(foreground);
  const l2 = luminance(background);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getUniqueSelector(el, cache) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE) return "document";
  if (cache?.has(el)) return cache.get(el);

  if (el.id) {
    const selector = `#${cssEscape(el.id)}`;
    cache?.set(el, selector);
    return selector;
  }

  const path = [];
  let node = el;
  while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.documentElement) {
    let selector = node.nodeName.toLowerCase();
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((child) => child.nodeName === node.nodeName);
      if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(node) + 1})`;
    }
    path.unshift(selector);
    node = parent;
    if (path.length >= 5) break;
  }

  const selector = path.join(" > ");
  cache?.set(el, selector);
  return selector;
}

function safeQuery(selector) {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function compactSnippet(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanAccessibility") {
    scanAccessibility(sendResponse);
    return true;
  }

  if (request.action === "highlightIssue") {
    highlightElement(request.selector, request.ruleKey || request.rule);
  }

  if (request.action === "startRealtimeMonitoring") {
    startMonitoring(sendResponse);
    return true;
  }

  if (request.action === "stopRealtimeMonitoring") {
    stopMonitoring(sendResponse);
    return true;
  }

  if (request.action === "autoFixIssue") {
    applyAutoFix(request.selector, request.ruleKey, sendResponse);
    return true;
  }
});
