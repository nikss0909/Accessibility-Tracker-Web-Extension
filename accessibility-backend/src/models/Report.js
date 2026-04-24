import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    scanId: { type: mongoose.Schema.Types.ObjectId, ref: "Scan" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true, trim: true },
    format: { type: String, enum: ["pdf", "csv", "json"], default: "json" },
    status: { type: String, enum: ["ready", "archived"], default: "ready" },
    storage: {
      provider: { type: String, enum: ["database", "s3", "gcs", "local"], default: "database" },
      url: String,
      key: String,
      contentType: String,
      size: Number
    },
    payload: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
