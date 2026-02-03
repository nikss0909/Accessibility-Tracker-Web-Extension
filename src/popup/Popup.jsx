import { useEffect, useState } from "react";
import "./popup.css";

function Popup() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [enhanced, setEnhanced] = useState(false);

  /* Load saved theme */
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);
  }, []);

  /* Apply theme */
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const scanPage = () => {
    setLoading(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "scanAccessibility" },
        (response) => {
          setLoading(false);
          if (chrome.runtime.lastError) {
            alert("Reload the page and try again");
            return;
          }
          setIssues(response?.issues || []);
        }
      );
    });
  };

  const toggleEnhancement = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: enhanced ? "revertAccessibility" : "enhanceAccessibility"
      });
      setEnhanced(!enhanced);
    });
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Accessibility Tracker</h1>
          <p>WCAG quick audit for current page</p>
        </div>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <button className="scan-btn" onClick={scanPage}>
        {loading ? "Scanning..." : "Scan Page"}
      </button>

      <section className="results">
        <h2>Issues Found</h2>

        {issues.length === 0 && !loading && (
          <div className="empty">🎉 No issues detected</div>
        )}

        <div className="issues-list">
          {issues.map((issue, index) => (
            <div key={index} className="issue-card">
              <span className="badge high">High</span>
              <p>{issue}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ENHANCE PAGE */}
      <section className="enhance">
        <h2>✨ Enhance Page</h2>
        <ul>
          <li>Improve color contrast for better readability</li>
          <li>Highlight images missing alt text</li>
          <li>Improve keyboard focus visibility</li>
        </ul>

        <button className="enhance-btn" onClick={toggleEnhancement}>
          {enhanced ? "Revert Enhancements" : "Apply Accessibility Enhancements"}
        </button>
      </section>
    </div>
  );
}

export default Popup;
