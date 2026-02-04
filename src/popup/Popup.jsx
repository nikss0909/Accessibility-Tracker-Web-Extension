import { useEffect, useState } from "react";
import "./popup.css";

function Popup() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [score, setScore] = useState(null);

  /* WCAG descriptions + fix suggestions */
  const wcagHelp = {
    "WCAG 1.1.1": {
      desc: "Images must have meaningful alternative text for screen readers.",
      fix: "Add an alt attribute that describes the purpose of the image.",
    },
    "WCAG 4.1.2": {
      desc:
        "Interactive elements must have accessible names for assistive technologies.",
      fix:
        "Add visible text or use aria-label to describe the button action.",
    },
  };

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

  /* Score: 10 - grouped issues */
  const calculateScore = (issues) => {
    const score = 10 - issues.length;
    return Math.max(score, 0);
  };

  const scanPage = () => {
    setLoading(true);
    setScanned(true);

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

          const grouped = {};
          (response?.issues || []).forEach((issue) => {
            const key = `${issue.rule}-${issue.message}`;
            if (!grouped[key]) {
              grouped[key] = { ...issue, count: 1 };
            } else {
              grouped[key].count += 1;
            }
          });

          const finalIssues = Object.values(grouped);
          setIssues(finalIssues);
          setScore(calculateScore(finalIssues));
        }
      );
    });
  };

  const highlightIssue = (selector) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "highlightIssue",
        selector,
      });
    });
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div>
          <h1>Accessibility Tracker</h1>
          <p>WCAG quick audit for current page</p>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      {/* SCAN BUTTON */}
      <button className="scan-btn" onClick={scanPage} disabled={loading}>
        {loading ? "Scanning..." : "Scan Page"}
      </button>

      {/* RESULTS */}
      <section className="results">
        <h2>Issues Found</h2>

        {score !== null && (
          <div className="score">
            Accessibility Score: <strong>{score}/10</strong>
          </div>
        )}

        {scanned && !loading && issues.length === 0 && (
          <div className="empty">🎉 No issues detected</div>
        )}

        <div className="issues-list">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="issue-card clickable"
              onClick={() => highlightIssue(issue.selector)}
              title={wcagHelp[issue.rule]?.desc}
            >
              <span className={`badge ${issue.severity.toLowerCase()}`}>
                {issue.severity}
              </span>

              <p>
                <strong>{issue.rule}</strong> — {issue.message}
                {issue.count > 1 && (
                  <span className="count">
                    {" "}
                    ({issue.count} occurrences)
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FIX SUGGESTIONS */}
      {issues.length > 0 && (
        <section className="fix-suggestions">
          <h2>🛠️ Fixing Issue Suggestions</h2>
          <ul>
            {issues.map((issue, index) => (
              <li key={index}>
                <strong>{issue.rule}:</strong>{" "}
                {wcagHelp[issue.rule]?.fix ||
                  "Follow WCAG guidelines to resolve this issue."}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default Popup;
