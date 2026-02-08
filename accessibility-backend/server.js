import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/report", (req, res) => {
  console.log("📥 Accessibility Report Received:");
  console.log(req.body);

  // Later you can:
  // - save to DB
  // - send email
  // - create GitHub issue

  res.status(200).json({ message: "Report received" });
});

app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});
