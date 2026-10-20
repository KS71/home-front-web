const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8090;
const ROOT = __dirname;
const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8"
};

http.createServer((req, res) => {
    const cleanUrl = decodeURIComponent(req.url.split("?")[0]);
    const rel = cleanUrl === "/" ? "/index.html" : cleanUrl;
    const filePath = path.join(ROOT, rel);
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not found");
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
    });
}).listen(PORT, () => {
    console.log(`Home Front Command Center kører på http://localhost:${PORT}`);
});
