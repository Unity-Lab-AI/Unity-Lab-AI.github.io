// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

// Create an Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Path to JSON file where we’ll store user IDs
const dataFilePath = path.join(__dirname, "userData.json");

// Load existing user IDs into memory at startup
let userIds = new Set();
if (fs.existsSync(dataFilePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    if (Array.isArray(data.userIds)) {
      userIds = new Set(data.userIds);
    }
  } catch (err) {
    console.error("Error reading userData.json:", err);
  }
}

// Helper to save user IDs to file
function saveUserIdsToFile() {
  const data = { userIds: [...userIds] };
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

// =======================
//   REGISTER USER ID
// =======================
app.post("/api/registerUser", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }
  if (userIds.has(userId)) {
    return res.json({ status: "exists" });
  }
  userIds.add(userId);
  saveUserIdsToFile();
  return res.json({ status: "registered" });
});

// =======================
//    VISITOR COUNT
// =======================
app.get("/api/visitorCount", (req, res) => {
  return res.json({ count: userIds.size });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `\nServer is listening on port ${PORT}.\n` +
      `Unique user IDs loaded: ${userIds.size}\n` +
      `Now go forth and wreak havoc.\n`
  );
});
