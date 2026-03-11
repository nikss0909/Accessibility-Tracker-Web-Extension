// Pulse animation style
const style = document.createElement("style");

style.textContent = `
@keyframes accessPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,0,0,0.7); }
  70% { box-shadow: 0 0 0 12px rgba(255,0,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,0,0,0); }
}
`;

document.head.appendChild(style);
function scanAccessibility(sendResponse) {
  const issues = [];

  /* WCAG 1.1.1 – Image alt text */
  document.querySelectorAll("img").forEach((img) => {
    const alt = img.getAttribute("alt");
    if (!alt || alt.trim() === "") {
      issues.push({
        rule: "WCAG 1.1.1",
        message: "Image missing alternative text",
        severity: "High",
        selector: getUniqueSelector(img),
      });
    }
  });

  /* WCAG 4.1.2 – Button label */
  document.querySelectorAll("button").forEach((btn) => {
    if (
      !btn.innerText.trim() &&
      !btn.getAttribute("aria-label") &&
      !btn.getAttribute("aria-labelledby")
    ) {
      issues.push({
        rule: "WCAG 4.1.2",
        message: "Button missing accessible label",
        severity: "High",
        selector: getUniqueSelector(btn),
      });
    }
  });

  /* WCAG 3.3.2 – Input label */
  document.querySelectorAll("input, textarea, select").forEach((input) => {
    const id = input.getAttribute("id");

    const hasLabel =
      (id && document.querySelector(`label[for="${id}"]`)) ||
      input.getAttribute("aria-label") ||
      input.getAttribute("aria-labelledby");

    if (!hasLabel) {
      issues.push({
        rule: "WCAG 3.3.2",
        message: "Form input missing label",
        severity: "Medium",
        selector: getUniqueSelector(input),
      });
    }
  });

  /* WCAG 2.4.4 – Link text */
  const badLinks = ["click here", "read more", "more"];

  document.querySelectorAll("a").forEach((link) => {
    const text = link.innerText.trim().toLowerCase();

    if (badLinks.includes(text)) {
      issues.push({
        rule: "WCAG 2.4.4",
        message: "Link text is not descriptive",
        severity: "Medium",
        selector: getUniqueSelector(link),
      });
    }
  });

  /* WCAG 2.1.1 – Keyboard accessibility */
  document.querySelectorAll("[onclick]").forEach((el) => {
    if (
      el.tagName !== "BUTTON" &&
      el.tagName !== "A" &&
      !el.hasAttribute("tabindex")
    ) {
      issues.push({
        rule: "WCAG 2.1.1",
        message: "Clickable element not keyboard accessible",
        severity: "Medium",
        selector: getUniqueSelector(el),
      });
    }
  });

  /* WCAG 3.1.1 – Page language */
  if (!document.documentElement.hasAttribute("lang")) {
    issues.push({
      rule: "WCAG 3.1.1",
      message: "Page missing language attribute",
      severity: "Low",
      selector: "html",
    });
  }

  /* WCAG 2.4.7 – Focus visible */
  document.querySelectorAll("button, a, input").forEach((el) => {
    const style = window.getComputedStyle(el);

    if (style.outline === "none") {
      issues.push({
        rule: "WCAG 2.4.7",
        message: "Focus indicator may not be visible",
        severity: "Medium",
        selector: getUniqueSelector(el),
      });
    }
  });

  /* WCAG 2.4.2 – Page title */
  if (!document.title || document.title.trim().length < 3) {
    issues.push({
      rule: "WCAG 2.4.2",
      message: "Page title missing or not descriptive",
      severity: "Medium",
      selector: "title",
    });
  }

  /* WCAG 1.3.1 – Table headers */
  document.querySelectorAll("table").forEach((table) => {
    if (!table.querySelector("th")) {
      issues.push({
        rule: "WCAG 1.3.1",
        message: "Table may be missing header cells",
        severity: "Medium",
        selector: getUniqueSelector(table),
      });
    }
  });

  const summary = {
    high: issues.filter((i) => i.severity === "High").length,
    medium: issues.filter((i) => i.severity === "Medium").length,
    low: issues.filter((i) => i.severity === "Low").length,
  };

  sendResponse({ issues, summary });
}

//////////////////////////////////////////////////////
function highlightElement(selector, rule) {

  const el = document.querySelector(selector);
  if (!el) return;

  el.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  const old = document.getElementById("__accessibility_highlight__");
  if (old) old.remove();

  const rect = el.getBoundingClientRect();
  const highlight = document.createElement("div");
  highlight.id = "__accessibility_highlight__";

  let color = "orange";

  if (rule === "WCAG 1.1.1") color = "#ff3b30";
  else if (rule === "WCAG 4.1.2") color = "#ff9500";
  else if (rule === "WCAG 3.3.2") color = "#007aff";
  else if (rule === "WCAG 2.4.4") color = "#af52de";
  else if (rule === "WCAG 2.1.1") color = "#ffd60a";
  else if (rule === "WCAG 1.3.1") color = "#34c759";

  highlight.style.position = "fixed";
  highlight.style.top = rect.top - 6 + "px";
  highlight.style.left = rect.left - 6 + "px";
  highlight.style.width = rect.width + 12 + "px";
  highlight.style.height = rect.height + 12 + "px";

  highlight.style.border = `3px solid ${color}`;
  highlight.style.borderRadius = "10px";
  highlight.style.zIndex = "999999";
  highlight.style.pointerEvents = "none";

  highlight.style.animation = "accessPulse 1.2s infinite";

  document.body.appendChild(highlight);

  setTimeout(() => {
    highlight.remove();
  }, 4000);
}

//////////////////////////////////////////////////////

function getUniqueSelector(el) {
  if (el.id) return `#${el.id}`;

  let path = [];

  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();

    if (el.className) {
      selector += "." + [...el.classList].join(".");
    }

    path.unshift(selector);
    el = el.parentElement;
  }

  return path.join(" > ");
}

//////////////////////////////////////////////////////
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "scanAccessibility") {
    scanAccessibility(sendResponse);
    return true; 
  }

  if (request.action === "highlightIssue") {
    highlightElement(request.selector, request.rule);
  }

});