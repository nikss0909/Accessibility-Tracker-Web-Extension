(() => {
  if (window.__inclusiveWebAssistantLoaded) return;
  window.__inclusiveWebAssistantLoaded = true;

  const SETTINGS_KEY = "inclusiveWebAssistantSettings";
  const STYLE_ID = "inclusive-web-assistant-style";
  const TOOLBAR_ID = "inclusive-web-assistant-toolbar";
  const STATE_KEY = "__inclusiveWebAssistantState";

  const defaultSettings = {
    preferredLanguage: "en",
    preferredVoice: "",
    defaultTextSize: 100,
    toolbarAutoStart: true
  };

  const state = {
    reading: false,
    paused: false,
    textSize: 100,
    contrast: "off",
    dyslexia: false,
    keyboard: false,
    focus: false,
    toolbarVisible: true,
    collapsed: false,
    x: null,
    y: null
  };

  let settings = { ...defaultSettings };
  let utterance = null;

  injectBaseStyle();
  loadSettings();

  function loadSettings() {
    chrome.storage?.local?.get([SETTINGS_KEY, STATE_KEY], (result) => {
      settings = { ...defaultSettings, ...(result?.[SETTINGS_KEY] || {}) };
      Object.assign(state, result?.[STATE_KEY] || {});
      state.textSize = Number(state.textSize || settings.defaultTextSize || 100);
      state.toolbarVisible = settings.toolbarAutoStart !== false && state.toolbarVisible !== false;
      applyAll();
      renderToolbar();
    });
  }

  function saveState() {
    chrome.storage?.local?.set({ [STATE_KEY]: pickState() });
  }

  function pickState() {
    return {
      textSize: state.textSize,
      contrast: state.contrast,
      dyslexia: state.dyslexia,
      keyboard: state.keyboard,
      focus: state.focus,
      toolbarVisible: state.toolbarVisible,
      collapsed: state.collapsed,
      x: state.x,
      y: state.y
    };
  }

  function response(message) {
    return { state: { ...state }, message };
  }

  function injectBaseStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.iwa-dyslexia, html.iwa-dyslexia body, html.iwa-dyslexia body *:not(#${TOOLBAR_ID}):not(#${TOOLBAR_ID} *) {
        font-family: Verdana, Arial, Helvetica, sans-serif !important;
        letter-spacing: 0.04em !important;
        word-spacing: 0.12em !important;
        line-height: 1.75 !important;
      }

      html.iwa-keyboard :focus,
      html.iwa-keyboard :focus-visible {
        outline: 4px solid #ffbf00 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 7px rgba(0, 0, 0, 0.34) !important;
      }

      html.iwa-contrast-dark body,
      html.iwa-contrast-dark body *:not(#${TOOLBAR_ID}):not(#${TOOLBAR_ID} *) {
        color: #ffffff !important;
        background-color: #050505 !important;
        border-color: #ffffff !important;
        text-shadow: none !important;
      }

      html.iwa-contrast-dark a:not(#${TOOLBAR_ID} a) {
        color: #ffe16a !important;
      }

      html.iwa-contrast-light body,
      html.iwa-contrast-light body *:not(#${TOOLBAR_ID}):not(#${TOOLBAR_ID} *) {
        color: #111111 !important;
        background-color: #ffffff !important;
        border-color: #111111 !important;
        text-shadow: none !important;
      }

      html.iwa-contrast-light a:not(#${TOOLBAR_ID} a) {
        color: #0047b3 !important;
      }

      html.iwa-focus-mode body > *:not(main):not(article):not([role="main"]):not(#${TOOLBAR_ID}) {
        opacity: 0.28 !important;
      }

      html.iwa-focus-mode main,
      html.iwa-focus-mode article,
      html.iwa-focus-mode [role="main"] {
        position: relative !important;
        z-index: 2147483000 !important;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42) !important;
      }

      #${TOOLBAR_ID} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        width: 292px;
        max-width: calc(100vw - 24px);
        color: #f8fbff;
        background: #101b2b;
        border: 1px solid #49617d;
        border-radius: 8px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
        font-family: Inter, Arial, sans-serif;
      }

      #${TOOLBAR_ID}[hidden] {
        display: none !important;
      }

      #${TOOLBAR_ID} .iwa-bar-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px;
        border-bottom: 1px solid #30445f;
        cursor: move;
      }

      #${TOOLBAR_ID} strong {
        font-size: 13px;
      }

      #${TOOLBAR_ID} .iwa-head-actions {
        display: flex;
        gap: 6px;
      }

      #${TOOLBAR_ID} button {
        min-height: 34px;
        border: 1px solid #49617d;
        border-radius: 8px;
        color: #f8fbff;
        background: #17253a;
        font: 800 12px/1 Inter, Arial, sans-serif;
        cursor: pointer;
      }

      #${TOOLBAR_ID} button:focus-visible {
        outline: 3px solid #ffbf00;
        outline-offset: 2px;
      }

      #${TOOLBAR_ID} button[aria-pressed="true"] {
        color: #05201d;
        background: #79d7c5;
      }

      #${TOOLBAR_ID} .iwa-tools {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 7px;
        padding: 9px;
      }

      #${TOOLBAR_ID}.iwa-collapsed .iwa-tools {
        display: none;
      }

      #${TOOLBAR_ID} .iwa-close {
        width: 34px;
      }
    `;
    document.documentElement.appendChild(style);
  }

  function applyAll() {
    document.documentElement.style.setProperty("--iwa-text-scale", `${state.textSize / 100}`);
    document.body.style.zoom = `${state.textSize}%`;
    document.documentElement.classList.toggle("iwa-dyslexia", state.dyslexia);
    document.documentElement.classList.toggle("iwa-keyboard", state.keyboard);
    document.documentElement.classList.toggle("iwa-focus-mode", state.focus);
    document.documentElement.classList.toggle("iwa-contrast-dark", state.contrast === "dark");
    document.documentElement.classList.toggle("iwa-contrast-light", state.contrast === "light");
    renderToolbar();
    saveState();
  }

  function startRead() {
    stopRead(false);
    const text = collectReadableText();
    if (!text) return response("No readable text found");

    utterance = new SpeechSynthesisUtterance(text);
    const voice = findVoice(settings.preferredVoice);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || document.documentElement.lang || "en-US";
    utterance.rate = 0.95;
    utterance.onend = () => {
      state.reading = false;
      state.paused = false;
      utterance = null;
      renderToolbar();
    };

    speechSynthesis.speak(utterance);
    state.reading = true;
    state.paused = false;
    renderToolbar();
    return response("Reading page aloud");
  }

  function pauseRead() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      state.paused = true;
    }
    renderToolbar();
    return response("Reading paused");
  }

  function resumeRead() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      state.paused = false;
      state.reading = true;
    }
    renderToolbar();
    return response("Reading resumed");
  }

  function stopRead(updateToolbar = true) {
    speechSynthesis.cancel();
    state.reading = false;
    state.paused = false;
    utterance = null;
    if (updateToolbar) renderToolbar();
    return response("Reading stopped");
  }

  function findVoice(name) {
    if (!name) return null;
    return speechSynthesis.getVoices().find((voice) => voice.name === name) || null;
  }

  function collectReadableText() {
    const root = document.querySelector("main, article, [role='main']") || document.body;
    return Array.from(root.querySelectorAll("h1, h2, h3, p, li, blockquote, figcaption, label, button, a"))
      .filter((element) => isVisible(element) && !element.closest(`#${TOOLBAR_ID}`))
      .map((element) => element.innerText || element.textContent || "")
      .map((text) => text.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(". ")
      .slice(0, 28000);
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function translateUrl(language) {
    const url = new URL("https://translate.google.com/translate");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", language || settings.preferredLanguage || "en");
    url.searchParams.set("u", location.href);
    return url.toString();
  }

  function renderToolbar() {
    let toolbar = document.getElementById(TOOLBAR_ID);
    if (!state.toolbarVisible) {
      if (toolbar) toolbar.hidden = true;
      return;
    }

    if (!toolbar) {
      toolbar = document.createElement("section");
      toolbar.id = TOOLBAR_ID;
      toolbar.setAttribute("aria-label", "Inclusive Web Assistant toolbar");
      document.body.appendChild(toolbar);
    }

    toolbar.hidden = false;
    toolbar.classList.toggle("iwa-collapsed", state.collapsed);
    if (state.x !== null && state.y !== null) {
      toolbar.style.left = `${state.x}px`;
      toolbar.style.top = `${state.y}px`;
      toolbar.style.right = "auto";
      toolbar.style.bottom = "auto";
    }

    toolbar.innerHTML = `
      <div class="iwa-bar-head">
        <strong>Inclusive Assistant</strong>
        <div class="iwa-head-actions">
          <button type="button" data-iwa-action="collapse" aria-label="${state.collapsed ? "Expand toolbar" : "Collapse toolbar"}">${state.collapsed ? "Open" : "Min"}</button>
          <button class="iwa-close" type="button" data-iwa-action="close" aria-label="Close toolbar">X</button>
        </div>
      </div>
      <div class="iwa-tools">
        <button type="button" data-iwa-action="read">${state.reading && !state.paused ? "Pause" : "Read"}</button>
        <button type="button" data-iwa-action="larger">A+</button>
        <button type="button" data-iwa-action="smaller">A-</button>
        <button type="button" data-iwa-action="contrast" aria-pressed="${state.contrast !== "off"}">Contrast</button>
        <button type="button" data-iwa-action="dyslexia" aria-pressed="${state.dyslexia}">Dyslexia</button>
        <button type="button" data-iwa-action="keyboard" aria-pressed="${state.keyboard}">Keyboard</button>
        <button type="button" data-iwa-action="translate">Translate</button>
        <button type="button" data-iwa-action="focus" aria-pressed="${state.focus}">Focus</button>
      </div>
    `;

    toolbar.querySelector(".iwa-bar-head")?.addEventListener("pointerdown", startDrag);
    toolbar.querySelectorAll("[data-iwa-action]").forEach((button) => {
      button.addEventListener("click", handleToolbarAction);
    });
  }

  function handleToolbarAction(event) {
    const action = event.currentTarget.dataset.iwaAction;
    if (action === "read") {
      if (state.reading && !state.paused) pauseRead();
      else if (state.paused) resumeRead();
      else startRead();
    } else if (action === "larger") {
      state.textSize = Math.min(160, state.textSize + 10);
      applyAll();
    } else if (action === "smaller") {
      state.textSize = Math.max(80, state.textSize - 10);
      applyAll();
    } else if (action === "contrast") {
      state.contrast = state.contrast === "dark" ? "light" : state.contrast === "light" ? "off" : "dark";
      applyAll();
    } else if (action === "dyslexia") {
      state.dyslexia = !state.dyslexia;
      applyAll();
    } else if (action === "keyboard") {
      state.keyboard = !state.keyboard;
      applyAll();
    } else if (action === "focus") {
      state.focus = !state.focus;
      applyAll();
    } else if (action === "translate") {
      window.open(translateUrl(settings.preferredLanguage), "_blank", "noopener,noreferrer");
    } else if (action === "collapse") {
      state.collapsed = !state.collapsed;
      applyAll();
    } else if (action === "close") {
      state.toolbarVisible = false;
      applyAll();
    }
  }

  function startDrag(event) {
    if (event.target.closest("button")) return;
    const toolbar = document.getElementById(TOOLBAR_ID);
    const rect = toolbar.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    toolbar.setPointerCapture?.(event.pointerId);

    const move = (moveEvent) => {
      state.x = Math.max(8, Math.min(window.innerWidth - rect.width - 8, moveEvent.clientX - offsetX));
      state.y = Math.max(8, Math.min(window.innerHeight - rect.height - 8, moveEvent.clientY - offsetY));
      toolbar.style.left = `${state.x}px`;
      toolbar.style.top = `${state.y}px`;
      toolbar.style.right = "auto";
      toolbar.style.bottom = "auto";
    };

    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      saveState();
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop, { once: true });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getAssistantState") {
      sendResponse(response("Ready"));
      return true;
    }

    if (request.action === "applySettings") {
      settings = { ...settings, ...(request.settings || {}) };
      if (!state.textSize) state.textSize = settings.defaultTextSize;
      applyAll();
      sendResponse(response("Preferences applied"));
      return true;
    }

    if (request.action === "startRead") sendResponse(startRead());
    if (request.action === "pauseRead") sendResponse(pauseRead());
    if (request.action === "resumeRead") sendResponse(resumeRead());
    if (request.action === "stopRead") sendResponse(stopRead());

    if (request.action === "changeTextSize") {
      state.textSize = Math.max(80, Math.min(160, state.textSize + Number(request.delta || 0)));
      applyAll();
      sendResponse(response(`Text size ${state.textSize}%`));
    }

    if (request.action === "resetTextSize") {
      state.textSize = Number(settings.defaultTextSize || 100);
      applyAll();
      sendResponse(response("Text size reset"));
    }

    if (request.action === "setContrast") {
      state.contrast = ["dark", "light", "off"].includes(request.mode) ? request.mode : "off";
      applyAll();
      sendResponse(response(state.contrast === "off" ? "Contrast off" : `${state.contrast} contrast on`));
    }

    if (request.action === "toggleDyslexia") {
      state.dyslexia = !state.dyslexia;
      applyAll();
      sendResponse(response(state.dyslexia ? "Dyslexia mode on" : "Dyslexia mode off"));
    }

    if (request.action === "toggleKeyboard") {
      state.keyboard = !state.keyboard;
      applyAll();
      sendResponse(response(state.keyboard ? "Keyboard mode on" : "Keyboard mode off"));
    }

    if (request.action === "toggleFocus") {
      state.focus = !state.focus;
      applyAll();
      sendResponse(response(state.focus ? "Focus mode on" : "Focus mode off"));
    }

    if (request.action === "toggleToolbar") {
      state.toolbarVisible = !state.toolbarVisible;
      applyAll();
      sendResponse(response(state.toolbarVisible ? "Toolbar visible" : "Toolbar hidden"));
    }

    if (request.action === "translatePage") {
      sendResponse({ ...response("Opening translation"), translateUrl: translateUrl(request.language) });
    }

    return true;
  });
})();
