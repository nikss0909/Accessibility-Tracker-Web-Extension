const originalStyles = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  /* SCAN ACCESSIBILITY */
  if (request.action === "scanAccessibility") {
    const issues = [];

    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) {
        issues.push("WCAG 1.1.1 – Image missing alt attribute");
      }
    });

    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.innerText.trim()) {
        issues.push("WCAG 4.1.2 – Button missing accessible label");
      }
    });

    sendResponse({ issues });
  }

  /* APPLY ENHANCEMENTS */
  if (request.action === "enhanceAccessibility") {
    document.querySelectorAll("p, span, a, li").forEach((el) => {
      if (!originalStyles.has(el)) {
        originalStyles.set(el, {
          color: el.style.color,
          backgroundColor: el.style.backgroundColor
        });
      }
      el.style.color = "#000";
      el.style.backgroundColor = "#fff";
    });

    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("alt")) {
        originalStyles.set(img, {
          outline: img.style.outline
        });
        img.style.outline = "3px solid red";
      }
    });

    console.log("Accessibility enhancements applied");
  }

  /* REVERT ENHANCEMENTS */
  if (request.action === "revertAccessibility") {
    originalStyles.forEach((styles, el) => {
      Object.keys(styles).forEach((prop) => {
        el.style[prop] = styles[prop];
      });
    });

    originalStyles.clear();
    console.log("Accessibility enhancements reverted");
  }
});
