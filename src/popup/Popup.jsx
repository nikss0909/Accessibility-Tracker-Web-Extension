import { useEffect, useState } from "react";
import "./popup.css";
import jsPDF from "jspdf";

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

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const url = new URL(tabs[0].url).hostname;

    const doc = new jsPDF();
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text("Accessibility Audit Report", 10, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    // Website + Score
    doc.setFontSize(12);
    doc.text(`Website: ${url}`, 10, y);
    y += 8;

    doc.text(`Accessibility Score: ${score}/10`, 10, y);
    y += 10;

    // Loop issues
    issues.forEach((issue, index) => {

      // Page break
      if (y > 270) {
        doc.addPage();
        y = 10;
      }

      doc.setFontSize(12);
      doc.text(`Issue ${index + 1}`, 10, y);
      y += 6;

      doc.setFontSize(11);
      doc.text(`Rule: ${issue.rule}`, 10, y);
      y += 6;

      // Severity color
      if (issue.severity === "High") doc.setTextColor(255, 0, 0);
      else if (issue.severity === "Medium") doc.setTextColor(255, 165, 0);
      else doc.setTextColor(0, 128, 0);

      doc.text(`Severity: ${issue.severity}`, 10, y);
      doc.setTextColor(0, 0, 0);
      y += 6;

      doc.text(`Message: ${issue.message}`, 10, y);
      y += 6;

      // ✅ Suggestion (IMPORTANT)
      if (issue.suggestion) {
        doc.text(`Suggestion: ${issue.suggestion}`, 10, y);
        y += 6;
      }

      if (issue.count > 1) {
        doc.text(`Occurrences: ${issue.count}`, 10, y);
        y += 6;
      }

      // Divider
      doc.setDrawColor(200);
      doc.line(10, y, 200, y);
      y += 6;

    });

    // Save PDF
    doc.save("Accessibility_Report.pdf");

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