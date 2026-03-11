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

  /* Accessibility score */
  const calculateScore = (issues) => {
    return Math.max(10 - issues.length, 0);
  };

  /* Handle scan results */
  const handleResponse = (response) => {

    setLoading(false);

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

  };

  /* Scan page */
  const scanPage = () => {

    setLoading(true);
    setScanned(true);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

      const tabId = tabs[0].id;

      chrome.tabs.sendMessage(
        tabId,
        { action: "scanAccessibility" },
        (response) => {

          if (chrome.runtime.lastError) {

            /* Inject content script if missing */
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["content.js"]
            }, () => {

              /* Retry scan */
              chrome.tabs.sendMessage(
                tabId,
                { action: "scanAccessibility" },
                handleResponse
              );

            });

            return;
          }

          handleResponse(response);

        }
      );

    });

  };

  /* Highlight element */
  const highlightIssue = (selector, rule) => {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

      chrome.tabs.sendMessage(tabs[0].id, {
        action: "highlightIssue",
        selector: selector,
        rule: rule
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
                onClick={() => highlightIssue(issue.selector, issue.rule)}
              >

                <span className={`badge ${issue.severity.toLowerCase()}`}>
                  {issue.severity}
                </span>

                <p>
                  <strong>{issue.rule}</strong> — {issue.message}

                  {issue.count > 1 && (
                    <span className="count">
                      {" "}({issue.count} occurrences)
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