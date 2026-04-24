import { Report } from "../models/Report.js";
import { Issue } from "../models/Issue.js";
import { Scan } from "../models/Scan.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listReports = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.teamId ? { teamId: req.query.teamId } : { teamId: req.user.teamId };
  if (req.query.projectId) query.projectId = req.query.projectId;

  const reports = await Report.find(query).sort({ createdAt: -1 }).limit(Number(req.query.limit || 50));
  res.json({ reports });
});

export const createReport = asyncHandler(async (req, res) => {
  const report = await Report.create({
    teamId: req.body.teamId || req.user.teamId,
    projectId: req.body.projectId,
    scanId: req.body.scanId,
    createdBy: req.user._id,
    title: req.body.title || "Accessibility Audit Report",
    format: req.body.format || "json",
    storage: req.body.storage || { provider: "database" },
    payload: req.body.payload || req.body
  });

  res.status(201).json({ report });
});

export const createReportFromExtension = asyncHandler(async (req, res) => {
  const issues = Array.isArray(req.body.issues) ? req.body.issues : [];
  const teamId = req.body.teamId || req.user.teamId;

  const scan = await Scan.create({
    teamId,
    projectId: req.body.projectId,
    websiteId: req.body.websiteId,
    createdBy: req.user._id,
    url: req.body.page?.url || req.body.url || "unknown",
    title: req.body.page?.title || req.body.title,
    score: Number(req.body.score || 0),
    durationMs: req.body.page?.durationMs,
    summary: req.body.summary || {
      critical: issues.filter((issue) => issue.severity === "Critical").length,
      high: issues.filter((issue) => issue.severity === "High").length,
      medium: issues.filter((issue) => issue.severity === "Medium").length,
      low: issues.filter((issue) => issue.severity === "Low").length,
      total: issues.length
    },
    issues,
    source: "extension"
  });

  const report = await Report.create({
    teamId,
    projectId: req.body.projectId,
    scanId: scan._id,
    createdBy: req.user._id,
    title: req.body.title || "Extension Accessibility Report",
    format: req.body.format || "json",
    payload: req.body
  });

  await createTrackableIssues(scan, req.user._id);

  res.status(201).json({
    message: "Report received",
    reportId: report._id,
    scanId: scan._id,
    score: scan.score,
    issues: scan.summary.total
  });
});

async function createTrackableIssues(scan, userId) {
  if (!scan.issues.length) return;

  await Issue.insertMany(
    scan.issues.map((issue) => ({
      teamId: scan.teamId,
      projectId: scan.projectId,
      scanId: scan._id,
      createdBy: userId,
      title: issue.name || issue.message || issue.rule || "Accessibility issue",
      rule: issue.rule,
      severity: issue.severity,
      selector: issue.selector,
      url: scan.url,
      sourceIssue: issue
    })),
    { ordered: false }
  );
}

export const getReport = asyncHandler(async (req, res) => {
  const report = await findReportForUser(req);
  if (!report) return res.status(404).json({ message: "Report not found" });
  res.json({ report });
});

export const archiveReport = asyncHandler(async (req, res) => {
  const report = await findReportForUser(req);
  if (!report) return res.status(404).json({ message: "Report not found" });

  report.status = "archived";
  await report.save();
  res.json({ report });
});

export const createWeeklySummary = asyncHandler(async (req, res) => {
  const teamId = req.body.teamId || req.user.teamId;
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const scans = await Scan.find({ teamId, createdAt: { $gte: since } }).sort({ createdAt: -1 });
  const issues = await Issue.find({ teamId, createdAt: { $gte: since } });
  const resolved = issues.filter((issue) => ["fixed", "resolved"].includes(issue.status));
  const averageScore = scans.length
    ? scans.reduce((total, scan) => total + scan.score, 0) / scans.length
    : 0;

  const report = await Report.create({
    teamId,
    createdBy: req.user._id,
    title: req.body.title || "Weekly Accessibility Summary",
    format: "json",
    payload: {
      periodStart: since,
      periodEnd: new Date(),
      scans: scans.length,
      averageScore: Number(averageScore.toFixed(1)),
      issuesCreated: issues.length,
      issuesResolved: resolved.length,
      openCritical: issues.filter((issue) => issue.status === "open" && issue.severity === "Critical").length,
      recommendations: [
        "Prioritize unresolved Critical and High issues.",
        "Assign recurring issues to component owners.",
        "Review fixed issues in the next regression scan."
      ]
    }
  });

  res.status(201).json({ report });
});

async function findReportForUser(req) {
  const query = { _id: req.params.reportId };
  if (req.user.role !== "admin") query.teamId = req.user.teamId;
  return Report.findOne(query);
}
