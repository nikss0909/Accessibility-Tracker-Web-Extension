// Accessibility Scanner
function scanAccessibility(sendResponse) {
  const issues = [];
  /* WCAG 1.1.1 – Images missing alt */
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
  /* WCAG 4.1.2 – Buttons missing accessible label */
  document.querySelectorAll("button").forEach((btn) => {
    if (!btn.innerText.trim() && !btn.getAttribute("aria-label")) {
      issues.push({
        rule: "WCAG 4.1.2",
        message: "Button missing accessible label",
        severity: "High",
        selector: getUniqueSelector(btn),
      });
    }
  });
  sendResponse({ issues });
}
/* Highlight element on page*/
function highlightElement(selector) {
  try {
    const el = document.querySelector(selector);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Remove old highlight
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
/* Helper: generate unique selector*/
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
/*  Message Listener */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scanAccessibility") {
    scanAccessibility(sendResponse);
    return true;
  }
  if (request.action === "highlightIssue") {
    highlightElement(request.selector);
  }

}); 
