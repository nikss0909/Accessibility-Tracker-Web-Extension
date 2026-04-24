import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    rule: String,
    ruleKey: String,
    name: String,
    message: String,
    severity: { type: String, enum: ["Critical", "High", "Medium", "Low"], required: true },
    selector: String,
    why: String,
    codeFix: String,
    bestPractice: String,
    simpleExplanation: String,
    disabilityImpact: String,
    correctedHtml: String,
    contrastColors: {
      text: String,
      background: String,
      ratio: String,
      note: String
    },
    semanticReplacement: String,
    autoFixable: Boolean,
    snippet: String
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    websiteId: { type: mongoose.Schema.Types.ObjectId },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    url: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    score: { type: Number, min: 0, max: 10, required: true },
    durationMs: Number,
    summary: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    issues: [issueSchema],
    source: { type: String, enum: ["extension", "dashboard", "api"], default: "api" }
  },
  { timestamps: true }
);

export const Scan = mongoose.model("Scan", scanSchema);
