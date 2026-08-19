const express = require("express");
const path = require("path");
const cors = require("cors");
const authRoute = require("../routers/authRoute");
const promptRoute = require("../routers/promptRoute");
const userRoute = require("../routers/userRoute");
const libraryRoute = require("../routers/libraryRoute");
const categoryRoute = require("../routers/categoryRoute");
const subscriptionRoute = require("../routers/subscriptionRoute");

const mongoose = require("mongoose");

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message:
      "Database is unavailable. In MongoDB Atlas, add this computer's IP under Network Access, then restart the backend.",
  });
});
app.use("/api/auth", authRoute);
app.use("/api/prompts", promptRoute);
app.use("/api/users", userRoute);
app.use("/api/library", libraryRoute);
app.use("/api/categories", categoryRoute);
app.use("/api/subscriptions", subscriptionRoute);
app.use("/api/announcements", require("../routers/announcementRoute"));

app.get("/", (req, res) => {
  res.json({
    message: "Backend is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

module.exports = app;
