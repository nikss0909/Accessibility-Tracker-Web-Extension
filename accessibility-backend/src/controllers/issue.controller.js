import { Issue } from "../models/Issue.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listIssues = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.teamId ? { teamId: req.query.teamId } : { teamId: req.user.teamId };
  if (req.query.projectId) query.projectId = req.query.projectId;
  if (req.query.status) query.status = req.query.status;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

  const issues = await Issue.find(query)
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email")
    .populate("comments.authorId", "name email")
    .sort({ updatedAt: -1 })
    .limit(Number(req.query.limit || 100));

  res.json({ issues });
});

export const createIssue = asyncHandler(async (req, res) => {
  const issue = await Issue.create({
    teamId: req.body.teamId || req.user.teamId,
    projectId: req.body.projectId,
    scanId: req.body.scanId,
    assignedTo: req.body.assignedTo,
    createdBy: req.user._id,
    title: req.body.title,
    rule: req.body.rule,
    severity: req.body.severity || "Medium",
    selector: req.body.selector,
    url: req.body.url,
    dueDate: req.body.dueDate,
    sourceIssue: req.body.sourceIssue
  });

  res.status(201).json({ issue });
});

export const updateIssue = asyncHandler(async (req, res) => {
  const issue = await findIssueForUser(req);
  if (!issue) return res.status(404).json({ message: "Issue not found" });

  ["title", "assignedTo", "status", "dueDate", "resolutionNote"].forEach((field) => {
    if (req.body[field] !== undefined) issue[field] = req.body[field];
  });

  if (["fixed", "resolved", "wont_fix"].includes(req.body.status)) {
    issue.resolvedAt = new Date();
  } else if (req.body.status && req.body.status !== "resolved") {
    issue.resolvedAt = undefined;
  }

  await issue.save();
  res.json({ issue });
});

export const addComment = asyncHandler(async (req, res) => {
  const issue = await findIssueForUser(req);
  if (!issue) return res.status(404).json({ message: "Issue not found" });
  if (!req.body.body?.trim()) return res.status(400).json({ message: "Comment body is required" });

  issue.comments.push({
    authorId: req.user._id,
    body: req.body.body.trim()
  });

  await issue.save();
  await issue.populate("comments.authorId", "name email");
  res.status(201).json({ issue });
});

export const getIssueSummary = asyncHandler(async (req, res) => {
  const teamId = req.user.role === "admin" && req.query.teamId ? req.query.teamId : req.user.teamId;
  const issues = await Issue.find({ teamId });

  res.json({
    summary: {
      total: issues.length,
      open: issues.filter((issue) => issue.status === "open").length,
      inProgress: issues.filter((issue) => issue.status === "in_progress").length,
      fixed: issues.filter((issue) => issue.status === "fixed").length,
      resolved: issues.filter((issue) => issue.status === "resolved").length,
      assigned: issues.filter((issue) => issue.assignedTo).length
    }
  });
});

async function findIssueForUser(req) {
  const query = { _id: req.params.issueId };
  if (req.user.role !== "admin") query.teamId = req.user.teamId;
  return Issue.findOne(query);
}
