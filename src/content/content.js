chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "scanPage") {
    const results = {
      nonText: true,
      contrast: true,
      keyboard: true,
    };

    // Check 1: Non-text content (missing alt attributes)
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === "") {
        results.nonText = false;
      }
    });

    // Check 2: Color contrast (basic — same text/bg color)
    const elements = document.querySelectorAll("*");
    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const color = style.color;
      if (bg && color && bg === color) {
        results.contrast = false;
      }
    });

    // Check 3: Keyboard accessibility (tabIndex and disabled)
    const buttons = document.querySelectorAll("button, a, input");
    buttons.forEach((el) => {
      if (el.tabIndex === -1 || el.disabled) {
        results.keyboard = false;
      }
    });

    sendResponse(results);
    return true;
  }

  if (message.action === "enhancePage") {
    console.log("🛠 Enhancing accessibility...");

    // Add default alt text to images without alt
    document.querySelectorAll("img").forEach((img) => {
      if (!img.alt || img.alt.trim() === "") {
        img.alt = "Decorative image";
      }
    });

    // Improve color contrast for elements with same color text & background
    document.querySelectorAll("*").forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.color === style.backgroundColor) {
        el.style.color = "#000";
        el.style.backgroundColor = "#fff";
      }
    });

    // Ensure all interactive elements are keyboard accessible
    document.querySelectorAll("button, a, input").forEach((el) => {
      if (el.tabIndex === -1) el.tabIndex = 0;
      el.style.outline = "2px solid #1976d2"; // Highlight focusable elements
    });

    sendResponse({ success: true });
    return true;
  }
});
