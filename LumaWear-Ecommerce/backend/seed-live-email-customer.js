/**
 * seed-live-email-customer.js
 *
 * test-live-email-dispatch.js asserts that a specific legacy customer
 * (shirishamp.05@gmail.com) exists before exercising the preview/SMTP pipeline.
 * That customer only existed in the original Atlas cluster, so this helper
 * inserts the same fixture into the local development database (idempotent).
 *
 * Usage: node seed-live-email-customer.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lumawear";

await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || "lumawear" });
const users = mongoose.connection.db.collection("users");

const result = await users.updateOne(
  { email: "shirishamp.05@gmail.com" },
  {
    $setOnInsert: {
      name: "Shirisha M P",
      salt: "seed",
      passwordHash: "seed",
      role: "customer",
      marketingOptOut: false,
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
    },
  },
  { upsert: true }
);

console.log(
  result.upsertedId
    ? "Seeded legacy customer shirishamp.05@gmail.com"
    : "Legacy customer already present"
);
console.log(`Total users: ${await users.countDocuments()}`);
await mongoose.disconnect();
