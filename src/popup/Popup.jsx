import { useEffect, useMemo, useState } from "react";
import "./popup.css";
import jsPDF from "jspdf";

const HISTORY_KEY = "accessibilityScanHistory";
const MAX_HISTORY = 20;

function Popup() {
  const [issues, setIssues] = useState([]);
  const [scanMeta, setScanMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [monitoring, setMonitoring] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);

    chrome.storage?.local?.get([HISTORY_KEY], (result) => {
      setHistory(result?.[HISTORY_KEY] || []);
    });
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const summary = useMemo(() => {
    return {
      critical: issues.filter((issue) => issue.severity === "Critical").length,
      high: issues.filter((issue) => issue.severity === "High").length,
      medium: issues.filter((issue) => issue.severity === "Medium").length,
      low: issues.filter((issue) => issue.severity === "Low").length
    };
  }, [issues]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const calculateScore = (issueList) => {
    const penalty = issueList.reduce((total, issue) => {
      if (issue.severity === "Critical") return total + 3;
      if (issue.severity === "High") return total + 2;
      if (issue.severity === "Medium") return total + 1;
      return total + 0.5;
    }, 0);

    return Math.max(10 - penalty, 0).toFixed(1);
  };

  const handleResponse = (response) => {
    setLoading(false);

    const finalIssues = response?.issues || [];
    const finalScore = response?.score || calculateScore(finalIssues);
    const meta = {
      scannedAt: response?.scannedAt || new Date().toISOString(),
      url: response?.url || "",
      title: response?.title || "",
      durationMs: response?.durationMs || 0
    };

    setIssues(finalIssues);
    setScore(finalScore);
    setScanMeta(meta);
    saveHistory(finalIssues, finalScore, meta);
  };

  const saveHistory = (issueList, finalScore, meta) => {
    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      scannedAt: meta.scannedAt,
      url: meta.url,
      title: meta.title,
      score: finalScore,
      total: issueList.length,
      critical: issueList.filter((issue) => issue.severity === "Critical").length,
      high: issueList.filter((issue) => issue.severity === "High").length,
      medium: issueList.filter((issue) => issue.severity === "Medium").length,
      low: issueList.filter((issue) => issue.severity === "Low").length
    };

    const nextHistory = [item, ...history].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    chrome.storage?.local?.set({ [HISTORY_KEY]: nextHistory });
  };

  const withActiveTab = (callback) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.[0]?.id) return;
      callback(tabs[0]);
    });
  };

  const sendToActiveTab = (message, callback) => {
    withActiveTab((tab) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ["content.js"]
            },
            () => {
              if (chrome.runtime.lastError) {
                callback?.(null);
                return;
              }

              chrome.tabs.sendMessage(tab.id, message, (retryResponse) => {
                if (chrome.runtime.lastError) {
                  callback?.(null);
                  return;
                }

                callback?.(retryResponse);
              });
            }
          );
          return;
        }

        callback?.(response);
      });
    });
  };

  const scanPage = () => {
    setLoading(true);
    setScanned(true);
    sendToActiveTab({ action: "scanAccessibility" }, handleResponse);
  };

  const highlightIssue = (issue) => {
    sendToActiveTab({
      action: "highlightIssue",
      selector: issue.selector,
      ruleKey: issue.ruleKey
    });
  };

  const autoFixIssue = (issue) => {
    sendToActiveTab(
      {
        action: "autoFixIssue",
        selector: issue.selector,
        ruleKey: issue.ruleKey
      },
      (response) => {
        if (response?.fixed) scanPage();
      }
    );
  };

  const toggleMonitoring = () => {
    const action = monitoring ? "stopRealtimeMonitoring" : "startRealtimeMonitoring";
    sendToActiveTab({ action }, (response) => {
      setMonitoring(Boolean(response?.monitoring));
    });
  };

  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  };

  const buildReport = () => ({
    generatedAt: new Date().toISOString(),
    score,
    summary,
    page: scanMeta,
    issues
  });

  const downloadBlob = (content, type, filename) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download({ url, filename, saveAs: true }, () => {
      URL.revokeObjectURL(url);
    });
  };

  const exportJson = () => {
    downloadBlob(
      JSON.stringify(buildReport(), null, 2),
      "application/json",
      "accessibility-report.json"
    );
  };

  const exportCsv = () => {
    const header = [
      "Severity",
      "Rule",
      "Issue",
      "Selector",
      "Simple explanation",
      "Disabled user impact",
      "Corrected HTML",
      "Contrast colors",
      "Semantic replacement",
      "Best practice"
    ];
    const rows = issues.map((issue) => [
      issue.severity,
      issue.rule,
      issue.name || issue.message,
      issue.selector,
      issue.simpleExplanation || issue.why,
      issue.disabilityImpact || issue.why,
      issue.correctedHtml || issue.codeFix,
      issue.contrastColors ? `${issue.contrastColors.text} on ${issue.contrastColors.background}` : "",
      issue.semanticReplacement || "",
      issue.bestPractice
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    downloadBlob(csv, "text/csv", "accessibility-report.csv");
  };

  const exportPdf = () => {
    if (!issues.length) return;

    const doc = new jsPDF();
    let y = 12;

    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text("Accessibility Audit Report", 10, y);
    doc.setTextColor(0, 0, 0);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Page: ${scanMeta?.title || scanMeta?.url || "Current page"}`, 10, y);
    y += 7;
    doc.text(`Score: ${score}/10`, 10, y);
    y += 7;
    doc.text(`Issues: ${issues.length} (Critical ${summary.critical}, High ${summary.high}, Medium ${summary.medium}, Low ${summary.low})`, 10, y);
    y += 10;

    issues.forEach((issue, index) => {
      if (y > 265) {
        doc.addPage();
        y = 12;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${issue.name || issue.message}`, 10, y);
      y += 6;

      doc.setFontSize(10);
      doc.text(`Severity: ${issue.severity} | Rule: ${issue.rule}`, 10, y);
      y += 5;
      doc.text(`Selector: ${issue.selector}`, 10, y, { maxWidth: 185 });
      y += 8;
      doc.text(`Why: ${issue.why || "Review against WCAG guidance."}`, 10, y, { maxWidth: 185 });
      y += 10;
      doc.text(`Impact: ${issue.disabilityImpact || issue.why || ""}`, 10, y, { maxWidth: 185 });
      y += 10;
      doc.text(`Fix: ${issue.correctedHtml || issue.codeFix || issue.suggestion || ""}`, 10, y, { maxWidth: 185 });
      y += 12;

      doc.setDrawColor(210);
      doc.line(10, y, 200, y);
      y += 6;
    });

    doc.save("accessibility-report.pdf");
  };

  const downloadReport = () => {
    if (!issues.length) return;
    if (exportFormat === "csv") exportCsv();
    else if (exportFormat === "json") exportJson();
    else exportPdf();
  };

  const sendReportToBackend = async () => {
    if (!issues.length) return;

    try {
      await fetch("http://localhost:5000/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildReport())
      });
    } catch (error) {
      console.warn("Accessibility Tracker backend is unavailable", error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Accessibility Tracker</h1>
          <p>WCAG quick audit for current page</p>
        </div>

        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </header>

      <button className="scan-btn" onClick={scanPage} disabled={loading}>
        {loading ? "Scanning..." : "Scan Page"}
      </button>

      <div className="report-row">
        <select
          className="format-select"
          value={exportFormat}
          onChange={(event) => setExportFormat(event.target.value)}
          aria-label="Report format"
        >
          <option value="pdf">PDF</option>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>

        <button className="report-btn" onClick={downloadReport} disabled={!issues.length}>
          Export Report
        </button>
      </div>

      <div className="utility-row">
        <label className="monitor-toggle">
          <input type="checkbox" checked={monitoring} onChange={toggleMonitoring} />
          Realtime monitoring
        </label>

        <div className="utility-actions">
          <button className="sync-btn" onClick={openDashboard}>
            Dashboard
          </button>
          <button className="sync-btn" onClick={sendReportToBackend} disabled={!issues.length}>
            Send
          </button>
        </div>
      </div>

      {scanned && (
        <section className="results">
          <h2>Issues Found</h2>

          {score !== null && (
            <div className="score">
              Accessibility Score: <strong>{score}/10</strong>
            </div>
          )}

          {!loading && issues.length > 0 && (
            <div className="summary-strip">
              <span>Critical {summary.critical}</span>
              <span>High {summary.high}</span>
              <span>Medium {summary.medium}</span>
              <span>Low {summary.low}</span>
            </div>
          )}

          {!loading && issues.length === 0 && (
            <div className="empty">No issues detected</div>
          )}

          <div className="issues-list">
            {issues.map((issue) => (
              <article key={issue.id || `${issue.rule}-${issue.selector}`} className="issue-card">
                <button
                  className="issue-main"
                  type="button"
                  onClick={() => highlightIssue(issue)}
                >
                  <span className={`badge ${issue.severity.toLowerCase()}`}>
                    {issue.severity}
                  </span>

                  <p>
                    <strong>{issue.rule}</strong> - {issue.name || issue.message}
                  </p>

                  <span className="selector">{issue.selector}</span>
                </button>

                <details className="issue-details">
                  <summary>AI suggestions</summary>
                  <p><strong>Simple:</strong> {issue.simpleExplanation || issue.message}</p>
                  <p><strong>Impact:</strong> {issue.disabilityImpact || issue.why}</p>
                  <p><strong>HTML:</strong> <code>{issue.correctedHtml || issue.codeFix || issue.suggestion}</code></p>
                  {issue.contrastColors && (
                    <p>
                      <strong>Colors:</strong>{" "}
                      <code>{issue.contrastColors.text}</code> text on{" "}
                      <code>{issue.contrastColors.background}</code> background
                    </p>
                  )}
                  <p><strong>Semantic:</strong> {issue.semanticReplacement || issue.bestPractice}</p>
                  <p><strong>Tip:</strong> {issue.bestPractice}</p>
                  {issue.autoFixable && (
                    <button className="autofix-btn" type="button" onClick={() => autoFixIssue(issue)}>
                      Auto-fix
                    </button>
                  )}
                </details>
              </article>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="history">
          <h2>Recent Scans</h2>
          {history.slice(0, 3).map((item) => (
            <div className="history-item" key={item.id}>
              <span>{new Date(item.scannedAt).toLocaleDateString()}</span>
              <strong>{item.score}/10</strong>
              <span>{item.total} issues</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default Popup;
