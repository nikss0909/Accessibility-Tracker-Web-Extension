import { useEffect, useMemo, useState } from "react";
import "./popup.css";

const SETTINGS_KEY = "inclusiveWebAssistantSettings";
const extensionApi = typeof chrome !== "undefined" ? chrome : null;

const defaultSettings = {
  theme: "dark",
  preferredLanguage: "en",
  preferredVoice: "",
  defaultTextSize: 100,
  toolbarAutoStart: true
};

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "hi", label: "Hindi" },
  { code: "zh-CN", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" }
];

function Popup() {
  const [settings, setSettings] = useState(defaultSettings);
  const [pageState, setPageState] = useState({
    reading: false,
    paused: false,
    textSize: 100,
    contrast: "off",
    dyslexia: false,
    keyboard: false,
    focus: false,
    toolbarVisible: true
  });
  const [status, setStatus] = useState("Ready");

  useEffect(() => {
    extensionApi?.storage?.local?.get([SETTINGS_KEY], (result) => {
      const nextSettings = { ...defaultSettings, ...(result?.[SETTINGS_KEY] || {}) };
      setSettings(nextSettings);
      document.body.setAttribute("data-theme", nextSettings.theme);
      sendToActiveTab({ action: "applySettings", settings: nextSettings }, syncState);
    });
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.code === settings.preferredLanguage)?.label || "English",
    [settings.preferredLanguage]
  );

  const updateSettings = (patch) => {
    const nextSettings = { ...settings, ...patch };
    setSettings(nextSettings);
    extensionApi?.storage?.local?.set({ [SETTINGS_KEY]: nextSettings });
    sendToActiveTab({ action: "applySettings", settings: nextSettings }, syncState);
  };

  const withActiveTab = (callback) => {
    if (!extensionApi?.tabs) {
      setStatus("Load as an extension to control a webpage");
      return;
    }
    extensionApi.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.[0]?.id) {
        setStatus("Open a webpage first");
        return;
      }
      callback(tabs[0]);
    });
  };

  const sendToActiveTab = (message, callback) => {
    withActiveTab((tab) => {
      extensionApi.tabs.sendMessage(tab.id, message, (response) => {
        if (extensionApi.runtime.lastError) {
          extensionApi.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }, () => {
            if (extensionApi.runtime.lastError) {
              setStatus("This page cannot be changed");
              callback?.(null);
              return;
            }

            extensionApi.tabs.sendMessage(tab.id, message, (retryResponse) => {
              callback?.(extensionApi.runtime.lastError ? null : retryResponse);
            });
          });
          return;
        }

        callback?.(response);
      });
    });
  };

  const syncState = (response) => {
    if (!response) return;
    if (response.state) setPageState(response.state);
    if (response.message) setStatus(response.message);
  };

  const command = (action, extra = {}) => {
    sendToActiveTab({ action, ...extra }, syncState);
  };

  const openSettings = () => {
    extensionApi?.runtime?.openOptionsPage?.();
  };

  const translatePage = () => {
    sendToActiveTab({ action: "translatePage", language: settings.preferredLanguage }, (response) => {
      syncState(response);
      if (response?.translateUrl) extensionApi?.tabs?.create({ url: response.translateUrl });
    });
  };

  const themeLabel = settings.theme === "dark" ? "Light" : "Dark";

  return (
    <main className="app" aria-label="Inclusive Web Assistant">
      <header className="top">
        <div>
          <span className="mark" aria-hidden="true">IWA</span>
          <h1>Inclusive Web Assistant</h1>
          <p>Comfort tools for the page you are browsing.</p>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={() => updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
          aria-label={`Switch to ${themeLabel.toLowerCase()} theme`}
          title={`Switch to ${themeLabel} theme`}
        >
          {themeLabel}
        </button>
      </header>

      <section className="reader-card" aria-label="Read page aloud">
        <div>
          <span className="eyebrow">Read aloud</span>
          <strong>{pageState.reading ? (pageState.paused ? "Paused" : "Reading") : "Ready"}</strong>
        </div>
        <div className="reader-actions">
          <button type="button" onClick={() => command("startRead")} aria-label="Start reading page">Start</button>
          <button type="button" onClick={() => command(pageState.paused ? "resumeRead" : "pauseRead")} disabled={!pageState.reading}>
            {pageState.paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={() => command("stopRead")} disabled={!pageState.reading}>Stop</button>
        </div>
      </section>

      <section className="tool-grid" aria-label="Page comfort tools">
        <button type="button" onClick={() => command("changeTextSize", { delta: 10 })}>
          <span>A+</span>
          Larger text
        </button>
        <button type="button" onClick={() => command("changeTextSize", { delta: -10 })}>
          <span>A-</span>
          Smaller text
        </button>
        <button type="button" onClick={() => command("resetTextSize")}>
          <span>{pageState.textSize}%</span>
          Reset size
        </button>
        <button className={pageState.contrast === "dark" ? "active" : ""} type="button" onClick={() => command("setContrast", { mode: pageState.contrast === "dark" ? "off" : "dark" })}>
          <span>Dark</span>
          Contrast
        </button>
        <button className={pageState.contrast === "light" ? "active" : ""} type="button" onClick={() => command("setContrast", { mode: pageState.contrast === "light" ? "off" : "light" })}>
          <span>Light</span>
          Contrast
        </button>
        <button className={pageState.dyslexia ? "active" : ""} type="button" onClick={() => command("toggleDyslexia")}>
          <span>Readable</span>
          Dyslexia
        </button>
        <button className={pageState.keyboard ? "active" : ""} type="button" onClick={() => command("toggleKeyboard")}>
          <span>Tab</span>
          Keyboard
        </button>
        <button className={pageState.focus ? "active" : ""} type="button" onClick={() => command("toggleFocus")}>
          <span>Focus</span>
          Less clutter
        </button>
      </section>

      <section className="translate-card" aria-label="Translate page">
        <label>
          Translate to
          <select value={settings.preferredLanguage} onChange={(event) => updateSettings({ preferredLanguage: event.target.value })}>
            {languages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
          </select>
        </label>
        <button type="button" onClick={translatePage}>Translate</button>
      </section>

      <footer className="footer-actions">
        <button type="button" onClick={() => command("toggleToolbar")}>
          {pageState.toolbarVisible ? "Hide toolbar" : "Show toolbar"}
        </button>
        <button type="button" onClick={openSettings}>Settings</button>
        <span aria-live="polite">{status} · {selectedLanguage}</span>
      </footer>
    </main>
  );
}

export default Popup;
