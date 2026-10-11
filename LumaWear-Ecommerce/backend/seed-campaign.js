/**
 * seed-campaign.js
 *
 * Seeds a single legitimate campaign in the local development database.
 *
 * Some verification scripts (e.g. test-email-preview-endpoint.js) assert that at
 * least one campaign exists in MongoDB. A fresh database has none, so this helper
 * creates one through the official POST /api/churn/campaigns endpoint, using the
 * admin account created by src/server.js on startup.
 *
 * Usage: node seed-campaign.js   (requires Express backend running on :4000)
 */
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:4000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lumawear";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "change-this-development-secret";

await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || "lumawear" });
const db = mongoose.connection.db;

const existing = await db.collection("campaigns").findOne({});
if (existing) {
  console.log(`Campaign already exists: ${existing.campaignId} (${existing.name})`);
  await mongoose.disconnect();
  process.exit(0);
}

const admin = await db.collection("users").findOne({ role: "admin" });
if (!admin) {
  console.error("No admin user found. Start the Express backend once so it can seed the admin.");
  await mongoose.disconnect();
  process.exit(1);
}

const customer = await db.collection("users").findOne({ role: "customer" });
if (!customer) {
  console.error("No customer user found to target.");
  await mongoose.disconnect();
  process.exit(1);
}

const token = jwt.sign(
  { sub: admin._id.toString(), role: "admin", type: "access" },
  JWT_ACCESS_SECRET,
  { expiresIn: "1h" }
);

const res = await fetch(`${BACKEND_URL}/api/churn/campaigns`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    name: "Seed Win-Back Campaign",
    campaignType: "inactivity_reengagement",
    priority: "Medium",
    targetCustomerIds: [customer._id.toString()],
    customerProbabilities: { [customer._id.toString()]: 0.82 },
    customerRiskLevels: { [customer._id.toString()]: "High" },
    customerTopDrivers: { [customer._id.toString()]: "30-Day Activity Events" },
    suggestedMessage: "We miss you — here is a personal offer.",
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Campaign creation failed: ${res.status}`, JSON.stringify(data));
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`Seeded campaign ${data.campaign?.campaignId || data.campaignId || "(created)"}`);
await mongoose.disconnect();
