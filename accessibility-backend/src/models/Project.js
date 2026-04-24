import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active" },
    tags: [{ type: String, trim: true }],
    lastScore: { type: Number, min: 0, max: 10, default: 0 },
    lastScannedAt: Date
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "paused", "archived"], default: "active" },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    websites: [websiteSchema]
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
