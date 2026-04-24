import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const issueSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    rule: String,
    severity: { type: String, enum: ["Critical", "High", "Medium", "Low"], required: true },
    selector: String,
    url: String,
    status: { type: String, enum: ["open", "in_progress", "fixed", "resolved", "wont_fix"], default: "open", index: true },
    dueDate: Date,
    resolvedAt: Date,
    resolutionNote: String,
    comments: [commentSchema],
    sourceIssue: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Issue = mongoose.model("Issue", issueSchema);
