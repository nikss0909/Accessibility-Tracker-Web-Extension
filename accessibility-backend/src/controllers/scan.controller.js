import { Project } from "../models/Project.js";
import { Issue } from "../models/Issue.js";
import { Scan } from "../models/Scan.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listScans = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.teamId ? { teamId: req.query.teamId } : { teamId: req.user.teamId };
  if (req.query.projectId) query.projectId = req.query.projectId;
  if (req.query.websiteId) query.websiteId = req.query.websiteId;

  const scans = await Scan.find(query).sort({ createdAt: -1 }).limit(Number(req.query.limit || 50));
  res.json({ scans });
});

export const createScan = asyncHandler(async (req, res) => {
  const issues = Array.isArray(req.body.issues) ? req.body.issues : [];
  const summary = req.body.summary || summarize(issues);

  const scan = await Scan.create({
    teamId: req.body.teamId || req.user.teamId,
    projectId: req.body.projectId,
    websiteId: req.body.websiteId,
    createdBy: req.user._id,
    url: req.body.url || req.body.page?.url,
    title: req.body.title || req.body.page?.title,
    score: Number(req.body.score || 0),
    durationMs: req.body.durationMs || req.body.page?.durationMs,
    summary,
    issues,
    source: req.body.source || "extension"
  });

  await updateWebsiteScore(scan);
  await createTrackableIssues(scan, req.user._id);
  res.status(201).json({ scan });
});

export const getScan = asyncHandler(async (req, res) => {
  const scan = await findScanForUser(req);
  if (!scan) return res.status(404).json({ message: "Scan not found" });
  res.json({ scan });
});

export const deleteScan = asyncHandler(async (req, res) => {
  const scan = await findScanForUser(req);
  if (!scan) return res.status(404).json({ message: "Scan not found" });

  await scan.deleteOne();
  res.status(204).send();
});

export const getScanAnalytics = asyncHandler(async (req, res) => {
  const teamId = req.user.role === "admin" && req.query.teamId ? req.query.teamId : req.user.teamId;
  const scans = await Scan.find({ teamId }).sort({ createdAt: 1 }).limit(200);

  const recurring = new Map();
  scans.forEach((scan) => {
    scan.issues.forEach((issue) => {
      const key = issue.name || issue.message || issue.rule;
      const current = recurring.get(key) || { name: key, count: 0, severity: issue.severity };
      current.count += 1;
      recurring.set(key, current);
    });
  });

  res.json({
    trend: scans.map((scan) => ({
      id: scan._id,
      date: scan.createdAt,
      score: scan.score,
      totalIssues: scan.summary.total
    })),
    recurringIssues: [...recurring.values()].sort((a, b) => b.count - a.count).slice(0, 10)
  });
});

function summarize(issues) {
  return {
    critical: issues.filter((issue) => issue.severity === "Critical").length,
    high: issues.filter((issue) => issue.severity === "High").length,
    medium: issues.filter((issue) => issue.severity === "Medium").length,
    low: issues.filter((issue) => issue.severity === "Low").length,
    total: issues.length
  };
}

async function findScanForUser(req) {
  const query = { _id: req.params.scanId };
  if (req.user.role !== "admin") query.teamId = req.user.teamId;
  return Scan.findOne(query);
}

async function updateWebsiteScore(scan) {
  if (!scan.projectId || !scan.websiteId) return;

  await Project.updateOne(
    { _id: scan.projectId, "websites._id": scan.websiteId },
    {
      $set: {
        "websites.$.lastScore": scan.score,
        "websites.$.lastScannedAt": scan.createdAt
      }
    }
  );
}

async function createTrackableIssues(scan, userId) {
  if (!scan.issues.length) return;

  const issues = scan.issues.map((issue) => ({
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
  }));

  await Issue.insertMany(issues, { ordered: false });
}
