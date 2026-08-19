const mongoose = require("mongoose");

const dbConnection = async () => {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;

  if (!mongoUrl) {
    throw new Error("MONGO_URL or MONGO_URI is missing in backend/config/config.env");
  }

  await mongoose.connect(mongoUrl, {
    dbName: "test",
    serverSelectionTimeoutMS: 12000,
    family: 4,
  });

  console.log("Connected to database successfully");
};

module.exports = dbConnection;
