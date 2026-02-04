import { useEffect, useState } from "react";
import "./popup.css";

function Popup() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [score, setScore] = useState(null);

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

  /* Score = 10 - number of grouped issues */
  const calculateScore = (issues) => {
    return Math.max(10 - issues.length, 0);
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

          // Group issues by WCAG rule + message
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

      {/* RESULTS — show only after scan */}
      {scanned && (
        <section className="results">
          <h2>Issues Found</h2>

          {score !== null && (
            <div className="score">
              Accessibility Score: <strong>{score}/10</strong>
            </div>
          )}

          {!loading && issues.length === 0 && (
            <div className="empty">🎉 No issues detected</div>
          )}

          <div className="issues-list">
            {issues.map((issue, index) => (
              <div
                key={index}
                className="issue-card clickable"
                onClick={() => highlightIssue(issue.selector)}
                title="Click to highlight element on page"
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
      )}
    </div>
  );
}

export default Popup;
