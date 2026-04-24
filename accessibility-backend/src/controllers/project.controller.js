import { Project } from "../models/Project.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listProjects = asyncHandler(async (req, res) => {
  const query = req.user.role === "admin" && req.query.teamId ? { teamId: req.query.teamId } : { teamId: req.user.teamId };
  const projects = await Project.find(query).sort({ updatedAt: -1 });
  res.json({ projects });
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await Project.create({
    teamId: req.body.teamId || req.user.teamId,
    name: req.body.name,
    description: req.body.description,
    members: [req.user._id]
  });

  res.status(201).json({ project });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await findProjectForUser(req);
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json({ project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await findProjectForUser(req);
  if (!project) return res.status(404).json({ message: "Project not found" });

  ["name", "description", "status"].forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();
  res.json({ project });
});

export const addWebsite = asyncHandler(async (req, res) => {
  const project = await findProjectForUser(req);
  if (!project) return res.status(404).json({ message: "Project not found" });

  project.websites.unshift({
    name: req.body.name,
    url: req.body.url,
    tags: req.body.tags || []
  });
  await project.save();

  res.status(201).json({ website: project.websites[0], project });
});

export const updateWebsite = asyncHandler(async (req, res) => {
  const project = await findProjectForUser(req);
  if (!project) return res.status(404).json({ message: "Project not found" });

  const website = project.websites.id(req.params.websiteId);
  if (!website) return res.status(404).json({ message: "Website not found" });

  ["name", "url", "status", "tags"].forEach((field) => {
    if (req.body[field] !== undefined) website[field] = req.body[field];
  });

  await project.save();
  res.json({ website, project });
});

export const removeWebsite = asyncHandler(async (req, res) => {
  const project = await findProjectForUser(req);
  if (!project) return res.status(404).json({ message: "Project not found" });

  const website = project.websites.id(req.params.websiteId);
  if (!website) return res.status(404).json({ message: "Website not found" });

  website.deleteOne();
  await project.save();
  res.status(204).send();
});

async function findProjectForUser(req) {
  const query = { _id: req.params.projectId };
  if (req.user.role !== "admin") query.teamId = req.user.teamId;
  return Project.findOne(query);
}
