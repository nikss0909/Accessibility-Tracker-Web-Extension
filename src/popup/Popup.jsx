import "./popup.css";

function Popup() {
  return (
    <div className="container">
      <header className="header">
        <h1>Accessibility Tracker</h1>
        <button className="theme-btn">🌙</button>
      </header>

      <button className="scan-btn">
        Scan Current Page
      </button>

      <section className="results">
        <h2>Detected Issues</h2>
        <ul>
          <li>WCAG 1.1.1 – Non-text Content</li>
          <li>WCAG 1.4.3 – Color Contrast</li>
          <li>WCAG 2.1.1 – Keyboard Accessibility</li>
        </ul>
      </section>
    </div>
  );
}

export default Popup;
