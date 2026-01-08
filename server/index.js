const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// =======================
// CONFIG
// =======================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ROOT_DIR = path.join(__dirname, "..");
const DATA_FILE = path.join(__dirname, "data.json");

// =======================
// MIDDLEWARES
// =======================
app.use(express.json());

// NO CACHE – API & HTML
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

// STATIC FILES (FRONTEND)
app.use(express.static(ROOT_DIR));

// =======================
// AUTH
// =======================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ success: false });
  }
  next();
};

// =======================
// DATA HELPERS
// =======================
const readData = async () => {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
};

const writeData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

// =======================
// API ROUTES
// =======================
app.post("/api/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_PASSWORD });
  }
  res.status(401).json({ success: false });
});

app.get("/api/data", async (req, res) => {
  try {
    const data = await readData();
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/api/data", authenticate, async (req, res) => {
  try {
    await writeData(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false });
  }
});

// =======================
// IMAGE UPLOAD
// =======================
const storage = multer.diskStorage({
  destination: path.join(ROOT_DIR, "img"),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
    cb(null, Date.now() + "_" + safe);
  },
});

const upload = multer({ storage });

app.post(
  "/api/upload-image",
  authenticate,
  upload.single("image"),
  (req, res) => {
    res.json({ success: true, path: `img/${req.file.filename}` });
  }
);

// =======================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
