const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// Admin Password from .env

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

// Cache Control Middleware (NO-CACHE for App Entry Points & API)
app.use((req, res, next) => {
  const url = req.url.split("?")[0];
  const noCacheFiles = [
    "/",
    "/index.html",
    "/admin/index.html",
    "/js/cache-loader.js",
    "/data.json",
  ];

  if (noCacheFiles.includes(url) || url.endsWith(".html")) {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (url.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  } else {
    // Static assets (CSS/JS with version params) can be cached safely
    // Default express.static behavior will apply, but we can hint browsers
    // res.setHeader("Cache-Control", "public, max-age=86400");
  }
  next();
});

// Enable JSON parsing
app.use(express.json());

// Serve static files from the parent directory (root of the project)
app.use(express.static(path.join(__dirname, "../")));

// Login Endpoint
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
});

// Helper: Read/Write Data
const DATA_FILE = path.join(__dirname, "data.json");

const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading data file:", err);
    return null;
  }
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
};

/**
 * GET /api/data
 * Returns the full site configuration
 */
app.get("/api/data", async (req, res) => {
  const data = await readData();
  if (data) {
    res.json({ success: true, data });
  } else {
    res.status(500).json({ success: false, message: "Data could not be read" });
  }
});

/**
 * POST /api/data
 * Updates the full site configuration
 * Protected by Auth
 */
app.post("/api/data", authenticate, async (req, res) => {
  try {
    const newData = req.body;
    // Basic validation could go here
    await writeData(newData);
    res.json({ success: true, message: "Data updated successfully" });
  } catch (err) {
    console.error("Error writing data:", err);
    res.status(500).json({ success: false, message: "Data update failed" });
  }
});

// Configure Multer for Image Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../img"));
  },
  filename: function (req, file, cb) {
    // Sanitize filename and keep extension
    const name = file.originalname
      .replace(/[^a-z0-9\.\-_]/gi, "_")
      .toLowerCase();
    cb(null, Date.now() + "_" + name);
  },
});

const upload = multer({ storage: storage });

/**
 * POST /api/upload-image
 * Uploads an image to ../img/ folder
 */
app.post(
  "/api/upload-image",
  authenticate,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    // Return relative path
    res.json({ success: true, path: `img/${req.file.filename}` });
  }
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
