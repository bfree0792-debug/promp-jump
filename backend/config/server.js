const path = require("path");
const dns = require("dns");
const https = require("https");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");

dotenv.config({ path: path.join(__dirname, "config.env"), quiet: true });
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const port = Number(process.env.PORT || 5000);
const mongoUris = [process.env.MONGO_URI, process.env.MONGO_URI_SRV].filter(Boolean);

async function connectMongo(uri) {
  await mongoose.connect(uri, {
    dbName: "test",
    serverSelectionTimeoutMS: 12000,
    family: 4,
  });
}

function getPublicIp() {
  return new Promise((resolve) => {
    const req = https.get("https://api.ipify.org", (res) => {
      let body = "";

      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve(body.trim() || null);
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

async function startServer() {
  if (!mongoUris.length || mongoUris.some((uri) => uri.includes("<db_username>"))) {
    console.error("MONGO_URI is missing or still contains <db_username> placeholder.");
    console.error("Update backend/config/config.env with your real MongoDB credentials.");
    process.exit(1);
  }

  let lastError;

  for (const uri of mongoUris) {
    try {
      await connectMongo(uri);
      console.log("MongoDB connected");
      break;
    } catch (error) {
      lastError = error;
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  }

  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB connection failed:");
    console.error(lastError?.message || "Unknown connection error");
    console.error("");
    console.error("Your public IP must be allowed in Atlas Network Access.");
    const publicIp = await getPublicIp();
    if (publicIp) {
      console.error(`Add this IP in Atlas: ${publicIp}/32`);
    }
    console.error("1. Open https://cloud.mongodb.com/ -> Network Access");
    console.error("2. Add IP Address -> add the IP above (or 0.0.0.0/0 for local dev)");
    console.error("Starting Express server in fallback mode on port " + port + " (uploads and static files active)...");
  }

  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

startServer();
