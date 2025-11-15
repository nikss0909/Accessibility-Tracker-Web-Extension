import React, { useState } from "react";
import { motion } from "framer-motion";
import "./popup.css";

export default function Popup() {
  const [dark, setDark] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [results, setResults] = useState(null);

  const total = 3;

  const scanPage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "scanPage" }, (res) => {
        if (chrome.runtime.lastError) {
          alert("⚠ Could not connect to page. Try reloading it.");
          return;
        }
        setResults(res);
        setScanned(true);
      });
    });
  };

  const enhancePage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "enhancePage" });
    });
  };

  const passed =
    results ? (results.nonText ? 1 : 0) + (results.contrast ? 1 : 0) + (results.keyboard ? 1 : 0) : 0;

  return (
    <motion.div
      className={`popup ${dark ? "dark" : "light"}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="header">
        <h2>Accessibility Tracker</h2>
        <button className="theme-btn" onClick={() => setDark(!dark)}>
          {dark ? "☀️" : "🌙"}
        </button>
      </header>

      <div className="controls">
        <button className="btn primary" onClick={scanPage}>Scan Page</button>
        <button className="btn secondary" onClick={enhancePage}>Enhance Page</button>
      </div>

      <div className="results">
        {scanned ? (
          <>
            <p>Scan Results: {passed}/{total} Passed</p>
            <div className="progress">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(passed / total) * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </>
        ) : (
          <p className="muted">Awaiting Scan...</p>
        )}
      </div>

      <div className="guidelines">
        <h4>WCAG Guidelines Applied:</h4>
        <ul>
          <li className={results && !results.nonText ? "warn" : "ok"}>
            {results ? (results.nonText ? "✔" : "⚠") : "•"} WCAG 1.1.1 – Non-text Content
          </li>
          <li className={results && !results.contrast ? "warn" : "ok"}>
            {results ? (results.contrast ? "✔" : "⚠") : "•"} WCAG 1.4.3 – Color Contrast
          </li>
          <li className={results && !results.keyboard ? "warn" : "ok"}>
            {results ? (results.keyboard ? "✔" : "⚠") : "•"} WCAG 2.1.1 – Keyboard Accessibility
          </li>
        </ul>
      </div>
    </motion.div>
  );
}
