// ===============================
// Accessibility Scanner (content.js)
// ===============================

function scanAccessibility(sendResponse) {
  const issues = [];

  /* =========================
     WCAG 1.1.1 – Image alt text
     ========================= */
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt") || img.getAttribute("alt").trim() === "") {
      issues.push({
        rule: "WCAG 1.1.1",
        message: "Image missing alt attribute",
        severity: "High",
        selector: getUniqueSelector(img),
      });
    }
  });

  /* =========================
     WCAG 4.1.2 – Button label
     ========================= */
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

  /* =========================
     WCAG 3.3.2 – Input label
     ========================= */
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

  /* =========================
     WCAG 2.4.4 – Link purpose
     ========================= */
  const badLinkText = ["click here", "read more", "more"];
  document.querySelectorAll("a").forEach((link) => {
    const text = link.innerText.trim().toLowerCase();
    if (badLinkText.includes(text)) {
      issues.push({
        rule: "WCAG 2.4.4",
        message: "Link text is not descriptive",
        severity: "Medium",
        selector: getUniqueSelector(link),
      });
    }
  });

  /* =========================
     WCAG 2.1.1 – Keyboard access
     ========================= */
  document.querySelectorAll("[onclick]").forEach((el) => {
    if (
      el.tagName !== "BUTTON" &&
      el.tagName !== "A" &&
      !el.hasAttribute("tabindex")
    ) {
      issues.push({
        rule: "WCAG 2.1.1",
        message: "Clickable element is not keyboard accessible",
        severity: "Medium",
        selector: getUniqueSelector(el),
      });
    }
  });

  sendResponse({ issues });
}

/*Highlight element on page */
function highlightElement(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Remove previous highlight
    const old = document.getElementById("__accessibility_highlight__");
    if (old) old.remove();

    const rect = el.getBoundingClientRect();
    const highlight = document.createElement("div");
    highlight.id = "__accessibility_highlight__";

    highlight.style.position = "fixed";
    highlight.style.top = rect.top - 6 + "px";
    highlight.style.left = rect.left - 6 + "px";
    highlight.style.width = rect.width + 12 + "px";
    highlight.style.height = rect.height + 12 + "px";
    highlight.style.border = "3px solid red";
    highlight.style.borderRadius = "8px";
    highlight.style.zIndex = "999999";
    highlight.style.pointerEvents = "none";
    highlight.style.boxShadow = "0 0 0 9999px rgba(0,0,0,0.25)";

    document.body.appendChild(highlight);
    setTimeout(() => highlight.remove(), 3000);
  } catch (err) {
    console.error("Highlight error:", err);
  }
}

/* =========================
   Helper: unique selector
   ========================= */
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

/* =========================
   Message Listener
   ========================= */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanAccessibility") {
    scanAccessibility(sendResponse);
    return true; // async response
  }

  if (request.action === "highlightIssue") {
    highlightElement(request.selector);
  }
});
