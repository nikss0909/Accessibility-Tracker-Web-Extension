import { useEffect, useMemo, useState } from "react";

const SETTINGS_KEY = "inclusiveWebAssistantSettings";
const STATE_KEY = "__inclusiveWebAssistantState";
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
  { code: "ja", label: "Japanese" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" }
];

function Options() {
  const [settings, setSettings] = useState(defaultSettings);
  const [voices, setVoices] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (extensionApi?.storage?.local) {
      extensionApi.storage.local.get([SETTINGS_KEY], (result) => {
        setSettings({ ...defaultSettings, ...(result?.[SETTINGS_KEY] || {}) });
      });
      return;
    }

    try {
      setSettings({ ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") });
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return undefined;
    const loadVoices = () => setVoices(speechSynthesis.getVoices());
    loadVoices();
    speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  const groupedVoices = useMemo(() => (
    voices
      .filter((voice) => voice.lang)
      .sort((a, b) => `${a.lang} ${a.name}`.localeCompare(`${b.lang} ${b.name}`))
  ), [voices]);

  const update = (patch) => {
    const nextSettings = { ...settings, ...patch };
    setSettings(nextSettings);
    setSaved(false);
  };

  const save = (event) => {
    event.preventDefault();
    const afterSave = () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    };

    if (extensionApi?.storage?.local) {
      extensionApi.storage.local.set({ [SETTINGS_KEY]: settings }, afterSave);
      return;
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    afterSave();
  };

  const reset = () => {
    const afterReset = () => {
      setSettings(defaultSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    };

    const resetState = {
      textSize: defaultSettings.defaultTextSize,
      contrast: "off",
      dyslexia: false,
      keyboard: false,
      focus: false,
      toolbarVisible: defaultSettings.toolbarAutoStart
    };

    if (extensionApi?.storage?.local) {
      extensionApi.storage.local.set(
        {
          [SETTINGS_KEY]: defaultSettings,
          [STATE_KEY]: resetState
        },
        afterReset
      );
      return;
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    localStorage.setItem(STATE_KEY, JSON.stringify(resetState));
    afterReset();
  };

  return (
    <main className="settings-shell">
      <header className="settings-hero">
        <span className="product-mark">IWA</span>
        <div>
          <h1>Inclusive Web Assistant Settings</h1>
          <p>Choose comfortable defaults for reading, translation, page display, and the floating toolbar.</p>
        </div>
      </header>

      <form className="settings-layout" onSubmit={save}>
        <section className="settings-panel" aria-labelledby="preferences-title">
          <div className="panel-heading">
            <h2 id="preferences-title">Preferences</h2>
            {saved && <span role="status">Saved</span>}
          </div>

          <label className="field">
            Preferred language
            <select value={settings.preferredLanguage} onChange={(event) => update({ preferredLanguage: event.target.value })}>
              {languages.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </label>

          <label className="field">
            Preferred voice
            <select value={settings.preferredVoice} onChange={(event) => update({ preferredVoice: event.target.value })}>
              <option value="">Browser default voice</option>
              {groupedVoices.map((voice) => (
                <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Theme
            <select value={settings.theme} onChange={(event) => update({ theme: event.target.value })}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>

          <label className="field">
            Default text size
            <div className="range-row">
              <input
                type="range"
                min="80"
                max="160"
                step="10"
                value={settings.defaultTextSize}
                onChange={(event) => update({ defaultTextSize: Number(event.target.value) })}
              />
              <strong>{settings.defaultTextSize}%</strong>
            </div>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.toolbarAutoStart}
              onChange={(event) => update({ toolbarAutoStart: event.target.checked })}
            />
            Show floating toolbar automatically
          </label>

          <div className="form-actions">
            <button type="submit">Save preferences</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
        </section>

        <section className="settings-panel help-panel" aria-labelledby="help-title">
          <h2 id="help-title">Help Guide</h2>
          <GuideItem title="Read aloud" text="Use Start, Pause, Resume, and Stop to listen to the main text of the current page." />
          <GuideItem title="Text size" text="A+ and A- increase or reduce page scale. Reset returns to your saved default." />
          <GuideItem title="Contrast" text="Dark and light contrast modes force stronger foreground and background colors." />
          <GuideItem title="Dyslexia mode" text="Readable fonts, wider spacing, and taller lines make dense pages easier to follow." />
          <GuideItem title="Keyboard mode" text="Focus outlines become larger and easier to see while tabbing through controls." />
          <GuideItem title="Focus mode" text="Page side content is dimmed so the main article or page content stands out." />
          <GuideItem title="Translate" text="The extension opens a translated copy of the page in your preferred language." />
        </section>
      </form>
    </main>
  );
}

function GuideItem({ title, text }) {
  return (
    <article className="guide-item">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export default Options;
