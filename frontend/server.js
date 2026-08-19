const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "cope prompt3");
const port = Number(process.env.PORT || 3000);
const apiTarget = process.env.API_URL || "http://localhost:4000";

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
};

function proxyToApi(req, res) {
  const target = new URL(req.url, apiTarget);

  const proxyReq = http.request(
    target,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: target.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        message: "Cannot reach the API. Start the backend on port 4000.",
      })
    );
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  if (urlPath.startsWith("/api/") || urlPath.startsWith("/uploads/")) {
    proxyToApi(req, res);
    return;
  }

  const relativePath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(root, safePath);

  if (!requestedPath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(requestedPath, (error, content) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(requestedPath).toLowerCase()] || "application/octet-stream",
    });
    res.end(content);
  });
});

server.listen(port, () => {
  console.log(`Frontend running at http://localhost:${port}`);
});
