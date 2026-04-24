import { useMemo, useState } from "react";

const STORAGE_KEY = "accessibilityDashboardState";

const seedState = {
  user: {
    name: "Nikhil Patil",
    email: "nikhil@example.com",
    role: "Product Admin",
    company: "Accessibility Tracker"
  },
  members: [
    { id: "user-1", name: "Nikhil Patil", email: "nikhil@example.com", role: "Owner" },
    { id: "user-2", name: "Aarav Mehta", email: "aarav@example.com", role: "Developer" },
    { id: "user-3", name: "Priya Shah", email: "priya@example.com", role: "QA Lead" },
    { id: "user-4", name: "Maya Rao", email: "maya@example.com", role: "Designer" }
  ],
  sharedDashboards: [
    { id: "share-1", name: "Executive Accessibility Overview", access: "Leadership", updated: "2026-04-24" },
    { id: "share-2", name: "Checkout Remediation Board", access: "Frontend Team", updated: "2026-04-23" }
  ],
  websites: [
    { id: "site-1", name: "Marketing Site", url: "https://example.com", owner: "QA Team", status: "Active", lastScore: 8.4 },
    { id: "site-2", name: "Checkout App", url: "https://shop.example.com", owner: "Frontend", status: "Active", lastScore: 6.9 },
    { id: "site-3", name: "Docs Portal", url: "https://docs.example.com", owner: "Platform", status: "Paused", lastScore: 9.1 }
  ],
  scans: [
    { id: "scan-1", website: "Marketing Site", date: "2026-04-24", score: 8.4, issues: 14, critical: 1, high: 3, medium: 6, low: 4 },
    { id: "scan-2", website: "Checkout App", date: "2026-04-23", score: 6.9, issues: 32, critical: 4, high: 9, medium: 13, low: 6 },
    { id: "scan-3", website: "Docs Portal", date: "2026-04-22", score: 9.1, issues: 8, critical: 0, high: 1, medium: 3, low: 4 },
    { id: "scan-4", website: "Marketing Site", date: "2026-04-19", score: 7.7, issues: 21, critical: 2, high: 5, medium: 8, low: 6 },
    { id: "scan-5", website: "Checkout App", date: "2026-04-18", score: 6.2, issues: 39, critical: 5, high: 11, medium: 15, low: 8 },
    { id: "scan-6", website: "Docs Portal", date: "2026-04-16", score: 8.8, issues: 10, critical: 0, high: 2, medium: 4, low: 4 }
  ],
  recurringIssues: [
    { name: "Missing form labels", count: 28, severity: "High" },
    { name: "Low contrast text", count: 23, severity: "High" },
    { name: "Weak link text", count: 19, severity: "Medium" },
    { name: "Skipped heading levels", count: 13, severity: "Medium" },
    { name: "Missing landmarks", count: 9, severity: "Low" }
  ],
  projects: [
    { id: "project-1", name: "Agency Client Audits", members: 8, websites: 12, openIssues: 146, health: "At risk" },
    { id: "project-2", name: "SaaS App Compliance", members: 5, websites: 6, openIssues: 63, health: "Improving" },
    { id: "project-3", name: "Public Sector Review", members: 4, websites: 3, openIssues: 24, health: "Healthy" }
  ],
  reports: [
    { id: "report-1", title: "Checkout App Regression Audit", format: "PDF", date: "2026-04-24", status: "Ready" },
    { id: "report-2", title: "Weekly Executive Summary", format: "CSV", date: "2026-04-22", status: "Ready" },
    { id: "report-3", title: "Docs Portal WCAG Snapshot", format: "JSON", date: "2026-04-20", status: "Archived" }
  ],
  trackedIssues: [
    {
      id: "issue-1",
      title: "Checkout fields missing labels",
      severity: "High",
      project: "SaaS App Compliance",
      assignee: "Aarav Mehta",
      status: "In progress",
      comments: [
        { author: "Priya Shah", body: "Reproduced on checkout step two." },
        { author: "Aarav Mehta", body: "Adding visible labels in the form component." }
      ]
    },
    {
      id: "issue-2",
      title: "Primary CTA contrast below 4.5:1",
      severity: "High",
      project: "Agency Client Audits",
      assignee: "Maya Rao",
      status: "Open",
      comments: [{ author: "Nikhil Patil", body: "Needs approved brand-safe color pair." }]
    },
    {
      id: "issue-3",
      title: "Docs page skips from h1 to h3",
      severity: "Medium",
      project: "Public Sector Review",
      assignee: "Priya Shah",
      status: "Resolved",
      comments: [{ author: "Priya Shah", body: "Fixed and verified in latest scan." }]
    }
  ],
  weeklySummary: {
    generatedAt: "2026-04-24",
    scans: 6,
    issuesOpened: 31,
    issuesResolved: 12,
    averageScore: 7.9
  }
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedState;
  } catch {
    return seedState;
  }
}

function Dashboard() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [state, setState] = useState(loadState);
  const [newSite, setNewSite] = useState({ name: "", url: "" });
  const [invite, setInvite] = useState({ name: "", email: "", role: "Developer" });
  const [comments, setComments] = useState({});

  const metrics = useMemo(() => {
    const average = state.scans.reduce((sum, scan) => sum + scan.score, 0) / state.scans.length;
    const latest = state.scans[0];
    const previous = state.scans[state.scans.length - 1];
    const openIssues = state.projects.reduce((sum, project) => sum + project.openIssues, 0);
    const resolvedIssues = state.trackedIssues.filter((issue) => issue.status === "Resolved").length;

    return {
      average: average.toFixed(1),
      latest: latest.score.toFixed(1),
      delta: (latest.score - previous.score).toFixed(1),
      openIssues,
      websites: state.websites.length,
      resolvedIssues
    };
  }, [state]);

  const trend = [...state.scans].reverse();

  const persist = (nextState) => {
    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const handleAuth = (event) => {
    event.preventDefault();
    setIsAuthed(true);
  };

  const addWebsite = (event) => {
    event.preventDefault();
    if (!newSite.name.trim() || !newSite.url.trim()) return;

    persist({
      ...state,
      websites: [
        {
          id: `site-${Date.now()}`,
          name: newSite.name.trim(),
          url: newSite.url.trim(),
          owner: state.user.name,
          status: "Active",
          lastScore: 0
        },
        ...state.websites
      ]
    });
    setNewSite({ name: "", url: "" });
  };

  const removeWebsite = (id) => {
    persist({
      ...state,
      websites: state.websites.filter((site) => site.id !== id)
    });
  };

  const inviteMember = (event) => {
    event.preventDefault();
    if (!invite.name.trim() || !invite.email.trim()) return;

    persist({
      ...state,
      members: [
        {
          id: `user-${Date.now()}`,
          name: invite.name.trim(),
          email: invite.email.trim(),
          role: invite.role
        },
        ...state.members
      ]
    });
    setInvite({ name: "", email: "", role: "Developer" });
  };

  const updateIssue = (issueId, patch) => {
    persist({
      ...state,
      trackedIssues: state.trackedIssues.map((issue) => (
        issue.id === issueId ? { ...issue, ...patch } : issue
      ))
    });
  };

  const addIssueComment = (issueId) => {
    const body = comments[issueId]?.trim();
    if (!body) return;

    persist({
      ...state,
      trackedIssues: state.trackedIssues.map((issue) => (
        issue.id === issueId
          ? { ...issue, comments: [...issue.comments, { author: state.user.name, body }] }
          : issue
      ))
    });
    setComments({ ...comments, [issueId]: "" });
  };

  const generateWeeklySummary = () => {
    const resolved = state.trackedIssues.filter((issue) => issue.status === "Resolved").length;
    const summary = {
      generatedAt: new Date().toISOString().slice(0, 10),
      scans: state.scans.length,
      issuesOpened: state.trackedIssues.filter((issue) => issue.status !== "Resolved").length,
      issuesResolved: resolved,
      averageScore: Number(metrics.average)
    };

    persist({
      ...state,
      weeklySummary: summary,
      reports: [
        {
          id: `report-${Date.now()}`,
          title: `Weekly Accessibility Summary - ${summary.generatedAt}`,
          format: "JSON",
          date: summary.generatedAt,
          status: "Ready"
        },
        ...state.reports
      ]
    });
  };

  if (!isAuthed) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-copy">
            <span className="product-mark">Accessibility Tracker</span>
            <h1>Developer accessibility operations, from extension scans to team reports.</h1>
            <p>Track score trends, recurring WCAG issues, saved reports, projects, and websites from one professional workspace.</p>
          </div>

          <form className="auth-form" onSubmit={handleAuth}>
            <div className="auth-switch" role="tablist" aria-label="Authentication mode">
              <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Signup</button>
            </div>

            {authMode === "signup" && (
              <label>
                Name
                <input type="text" placeholder="Nikhil Patil" />
              </label>
            )}

            <label>
              Email
              <input type="email" placeholder="team@company.com" defaultValue="nikhil@example.com" />
            </label>

            <label>
              Password
              <input type="password" placeholder="••••••••" defaultValue="password" />
            </label>

            <button className="primary-action" type="submit">
              {authMode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">AT</span>
          <div>
            <strong>Accessibility Tracker</strong>
            <span>Team Dashboard</span>
          </div>
        </div>

        <nav>
          <a href="#overview">Overview</a>
          <a href="#history">Scan History</a>
          <a href="#analytics">Analytics</a>
          <a href="#projects">Projects</a>
          <a href="#team">Team</a>
          <a href="#issues">Issues</a>
          <a href="#reports">Reports</a>
          <a href="#websites">Websites</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Accessibility Operations</h1>
            <p>Scores, reports, recurring issues, and team project coverage.</p>
          </div>

          <div className="profile-card">
            <div className="avatar">{state.user.name.split(" ").map((part) => part[0]).join("")}</div>
            <div>
              <strong>{state.user.name}</strong>
              <span>{state.user.role}</span>
            </div>
          </div>
        </header>

        <section id="overview" className="metric-grid">
          <Metric label="Average score" value={`${metrics.average}/10`} note={`Latest ${metrics.latest}/10`} />
          <Metric label="Trend delta" value={`${metrics.delta >= 0 ? "+" : ""}${metrics.delta}`} note="Compared with oldest scan" />
          <Metric label="Open issues" value={metrics.openIssues} note="Across active projects" />
          <Metric label="Resolved issues" value={metrics.resolvedIssues} note="Marked fixed or resolved" />
        </section>

        <section id="analytics" className="content-grid">
          <Panel title="Accessibility Score Trend">
            <LineChart data={trend} />
          </Panel>

          <Panel title="Top Recurring Issues">
            <div className="issue-bars">
              {state.recurringIssues.map((issue) => (
                <div className="issue-row" key={issue.name}>
                  <div>
                    <strong>{issue.name}</strong>
                    <span>{issue.severity}</span>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${Math.min(issue.count * 3, 100)}%` }} />
                  </div>
                  <b>{issue.count}</b>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="content-grid">
          <Panel title="Trend Analytics">
            <div className="analytics-list">
              <Insight label="Best performing property" value="Docs Portal" detail="9.1 average score" />
              <Insight label="Highest risk area" value="Checkout App" detail="4 critical issues in latest scan" />
              <Insight label="Fastest improvement" value="Marketing Site" detail="+0.7 score since previous scan" />
            </div>
          </Panel>

          <Panel title="User Profile">
            <div className="profile-details">
              <span>Name</span><strong>{state.user.name}</strong>
              <span>Email</span><strong>{state.user.email}</strong>
              <span>Company</span><strong>{state.user.company}</strong>
              <span>Role</span><strong>{state.user.role}</strong>
            </div>
          </Panel>
        </section>

        <section id="history" className="panel">
          <div className="panel-heading">
            <h2>Scan History</h2>
          </div>
          <DataTable
            columns={["Website", "Date", "Score", "Critical", "High", "Medium", "Low"]}
            rows={state.scans.map((scan) => [scan.website, scan.date, `${scan.score}/10`, scan.critical, scan.high, scan.medium, scan.low])}
          />
        </section>

        <section id="projects" className="panel">
          <div className="panel-heading">
            <h2>Team Projects</h2>
          </div>
          <div className="project-grid">
            {state.projects.map((project) => (
              <article className="project-card" key={project.id}>
                <span className={`health ${project.health.toLowerCase().replace(" ", "-")}`}>{project.health}</span>
                <h3>{project.name}</h3>
                <p>{project.members} members - {project.websites} websites</p>
                <strong>{project.openIssues} open issues</strong>
              </article>
            ))}
          </div>
        </section>

        <section id="team" className="content-grid">
          <Panel title="Invite Team Members">
            <form className="invite-form" onSubmit={inviteMember}>
              <input value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Full name" />
              <input value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="developer@company.com" />
              <select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value })}>
                <option>Developer</option>
                <option>QA Lead</option>
                <option>Designer</option>
                <option>Viewer</option>
              </select>
              <button type="submit">Invite</button>
            </form>

            <div className="member-list">
              {state.members.map((member) => (
                <div className="member-item" key={member.id}>
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </div>
                  <span className="role-pill">{member.role}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Shared Dashboards">
            <div className="shared-list">
              {state.sharedDashboards.map((dashboard) => (
                <div className="shared-item" key={dashboard.id}>
                  <strong>{dashboard.name}</strong>
                  <span>{dashboard.access}</span>
                  <small>Updated {dashboard.updated}</small>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section id="issues" className="panel">
          <div className="panel-heading">
            <h2>Issue Collaboration</h2>
          </div>
          <div className="collab-issues">
            {state.trackedIssues.map((issue) => (
              <article className="collab-card" key={issue.id}>
                <div className="collab-title">
                  <span className={`severity-dot ${issue.severity.toLowerCase()}`}>{issue.severity}</span>
                  <div>
                    <h3>{issue.title}</h3>
                    <p>{issue.project}</p>
                  </div>
                </div>

                <div className="issue-controls">
                  <label>
                    Assignee
                    <select value={issue.assignee} onChange={(event) => updateIssue(issue.id, { assignee: event.target.value })}>
                      {state.members.map((member) => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select value={issue.status} onChange={(event) => updateIssue(issue.id, { status: event.target.value })}>
                      <option>Open</option>
                      <option>In progress</option>
                      <option>Fixed</option>
                      <option>Resolved</option>
                    </select>
                  </label>
                </div>

                <div className="comment-list">
                  {issue.comments.map((comment, index) => (
                    <p key={`${issue.id}-${index}`}><strong>{comment.author}:</strong> {comment.body}</p>
                  ))}
                </div>

                <div className="comment-form">
                  <input
                    value={comments[issue.id] || ""}
                    onChange={(event) => setComments({ ...comments, [issue.id]: event.target.value })}
                    placeholder="Add a comment"
                  />
                  <button type="button" onClick={() => addIssueComment(issue.id)}>Comment</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="reports" className="panel">
          <div className="panel-heading">
            <h2>Saved Reports</h2>
            <button className="secondary-action" type="button" onClick={generateWeeklySummary}>Generate weekly summary</button>
          </div>
          <div className="weekly-summary">
            <span>Week of {state.weeklySummary.generatedAt}</span>
            <strong>{state.weeklySummary.averageScore}/10 average score</strong>
            <span>{state.weeklySummary.scans} scans</span>
            <span>{state.weeklySummary.issuesOpened} open</span>
            <span>{state.weeklySummary.issuesResolved} resolved</span>
          </div>
          <DataTable
            columns={["Report", "Format", "Date", "Status"]}
            rows={state.reports.map((report) => [report.title, report.format, report.date, report.status])}
          />
        </section>

        <section id="websites" className="panel">
          <div className="panel-heading">
            <h2>Website List Management</h2>
          </div>

          <form className="site-form" onSubmit={addWebsite}>
            <input value={newSite.name} onChange={(event) => setNewSite({ ...newSite, name: event.target.value })} placeholder="Website name" />
            <input value={newSite.url} onChange={(event) => setNewSite({ ...newSite, url: event.target.value })} placeholder="https://example.com" />
            <button type="submit">Add website</button>
          </form>

          <div className="website-list">
            {state.websites.map((site) => (
              <div className="website-item" key={site.id}>
                <div>
                  <strong>{site.name}</strong>
                  <span>{site.url}</span>
                </div>
                <span>{site.owner}</span>
                <span className="score-pill">{site.lastScore ? `${site.lastScore}/10` : "New"}</span>
                <button type="button" onClick={() => removeWebsite(site.id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value, note }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Insight({ label, value, detail }) {
  return (
    <div className="insight">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function DataTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LineChart({ data }) {
  const width = 620;
  const height = 220;
  const points = data.map((item, index) => {
    const x = 36 + (index * (width - 72)) / Math.max(data.length - 1, 1);
    const y = height - 34 - (item.score / 10) * (height - 68);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Accessibility score trend">
      <line x1="36" y1="20" x2="36" y2="186" />
      <line x1="36" y1="186" x2="592" y2="186" />
      <path d={path} />
      {points.map((point) => (
        <g key={point.id}>
          <circle cx={point.x} cy={point.y} r="5" />
          <text x={point.x} y={point.y - 12}>{point.score}</text>
        </g>
      ))}
    </svg>
  );
}

export default Dashboard;
