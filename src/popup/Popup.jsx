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

            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ["content.js"]
            }, () => {

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

  /* Download accessibility report */
  const downloadReport = () => {

    if (!issues.length) return;

    let report = "Accessibility Audit Report\n\n";

    report += `Accessibility Score: ${score}/10\n\n`;

    issues.forEach((issue, index) => {

      report += `Issue ${index + 1}\n`;
      report += `Rule: ${issue.rule}\n`;
      report += `Severity: ${issue.severity}\n`;
      report += `Message: ${issue.message}\n`;

      if (issue.suggestion) {
        report += `Suggestion: ${issue.suggestion}\n`;
      }

      if (issue.count > 1) {
        report += `Occurrences: ${issue.count}\n`;
      }

      report += "\n----------------------\n\n";

    });

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "accessibility-report.txt";
    a.click();

    URL.revokeObjectURL(url);

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

      <button className="scan-btn" onClick={scanPage} disabled={loading}>
        {loading ? "Scanning..." : "Scan Page"}
      </button>

      <button className="report-btn" onClick={downloadReport} disabled={!issues.length}>
        Download Report
      </button>

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

                {issue.suggestion && (
                  <p className="suggestion">
                    💡 Fix: {issue.suggestion}
                  </p>
                )}

              </div>

            ))}

          </div>

        </section>

      )}

    </div>
  );
}

export default Popup;