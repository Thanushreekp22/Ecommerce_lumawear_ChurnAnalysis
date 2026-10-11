/**
 * seed-real-accounts.js
 *
 * Seeds LumaWear with real-world test accounts: backdated registration dates,
 * full order history, and behavioral activity timelines so the admin dashboard
 * shows realistic live churn analytics.
 *
 * Password for ALL accounts: 123456789
 * Idempotent: re-running replaces any previously seeded versions of these accounts.
 *
 * Usage:  node seed-real-accounts.js
 */
import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/lumawear";
const SHARED_PASSWORD = "123456789";
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (d) => new Date(Date.now() - d * DAY_MS);

// Same hashing scheme as src/server.js (scrypt + random salt)
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
  salt,
  passwordHash: crypto.scryptSync(password, salt, 64).toString("hex"),
});

/**
 * Each account: registered N days ago, with orders and activities at explicit
 * day-offsets so feature extraction (recency, spend, engagement) produces a
 * varied risk spread across the portfolio.
 */
const ACCOUNTS = [
  {
    email: "skillorbit.web.2025@gmail.com",
    name: "Skillorbit Web",
    createdAtDays: 400,
    lastLoginDays: 2,
    profile: "Active & loyal — frequent buyer, logged in 2 days ago (low churn risk)",
    orders: [
      { days: 300, status: "completed", items: [["lw-001", 1]] },
      { days: 210, status: "completed", items: [["lw-004", 1], ["lw-002", 1]] },
      { days: 150, status: "completed", items: [["lw-005", 2]] },
      { days: 90, status: "completed", items: [["lw-003", 1], ["lw-006", 1]] },
      { days: 45, status: "confirmed", items: [["lw-002", 1]] },
      { days: 12, status: "completed", items: [["lw-001", 1], ["lw-004", 1]] },
    ],
    activities: [
      { days: 400, type: "auth_register", route: "/api/auth/register" },
      { days: 300, type: "auth_login", route: "/api/auth/login" },
      { days: 150, type: "auth_login", route: "/api/auth/login" },
      { days: 60, type: "auth_login", route: "/api/auth/login" },
      { days: 46, type: "product_viewed", route: "/product/lw-002", productId: "lw-002" },
      { days: 45, type: "cart_add", route: "/api/cart", productId: "lw-002" },
      { days: 22, type: "product_viewed", route: "/product/lw-003", productId: "lw-003" },
      { days: 20, type: "page_view", route: "/shop" },
      { days: 13, type: "product_viewed", route: "/product/lw-001", productId: "lw-001" },
      { days: 12, type: "cart_add", route: "/api/cart", productId: "lw-004" },
      { days: 5, type: "page_view", route: "/" },
      { days: 2, type: "auth_login", route: "/api/auth/login" },
      { days: 2, type: "product_viewed", route: "/product/lw-004", productId: "lw-004" },
    ],
  },
  {
    email: "abcdef202527@gmail.com",
    name: "Abcdef User",
    createdAtDays: 320,
    lastLoginDays: 95,
    profile: "Dormant — no login in ~95 days, last order ~120 days ago (very high churn risk)",
    orders: [
      { days: 310, status: "completed", items: [["lw-001", 1]] },
      { days: 120, status: "completed", items: [["lw-004", 1]] },
    ],
    activities: [
      { days: 320, type: "auth_register", route: "/api/auth/register" },
      { days: 310, type: "auth_login", route: "/api/auth/login" },
      { days: 210, type: "product_viewed", route: "/product/lw-002", productId: "lw-002" },
      { days: 200, type: "auth_login", route: "/api/auth/login" },
      { days: 200, type: "page_view", route: "/shop" },
      { days: 121, type: "cart_add", route: "/api/cart", productId: "lw-004" },
      { days: 95, type: "auth_login", route: "/api/auth/login" },
    ],
  },
  {
    email: "sm6956191@gmail.com",
    name: "S M",
    createdAtDays: 260,
    lastLoginDays: 38,
    profile: "Occasional buyer — moderate engagement, last order ~45 days ago (medium risk)",
    orders: [
      { days: 240, status: "completed", items: [["lw-005", 1]] },
      { days: 150, status: "completed", items: [["lw-002", 1], ["lw-006", 1]] },
      { days: 45, status: "confirmed", items: [["lw-004", 1]] },
    ],
    activities: [
      { days: 260, type: "auth_register", route: "/api/auth/register" },
      { days: 240, type: "auth_login", route: "/api/auth/login" },
      { days: 120, type: "auth_login", route: "/api/auth/login" },
      { days: 50, type: "product_viewed", route: "/product/lw-006", productId: "lw-006" },
      { days: 46, type: "product_viewed", route: "/product/lw-004", productId: "lw-004" },
      { days: 45, type: "cart_add", route: "/api/cart", productId: "lw-004" },
      { days: 38, type: "auth_login", route: "/api/auth/login" },
      { days: 38, type: "page_view", route: "/account" },
    ],
  },
  {
    email: "mrshreyu7@gmail.com",
    name: "Shreyu",
    createdAtDays: 75,
    lastLoginDays: 3,
    profile: "New & active — registered 2 months ago, ordered 8 days ago (low churn risk)",
    orders: [
      { days: 60, status: "completed", items: [["lw-003", 1]] },
      { days: 8, status: "confirmed", items: [["lw-001", 1], ["lw-006", 1]] },
    ],
    activities: [
      { days: 75, type: "auth_register", route: "/api/auth/register" },
      { days: 75, type: "auth_login", route: "/api/auth/login" },
      { days: 30, type: "auth_login", route: "/api/auth/login" },
      { days: 20, type: "product_viewed", route: "/product/lw-005", productId: "lw-005" },
      { days: 10, type: "page_view", route: "/shop" },
      { days: 9, type: "product_viewed", route: "/product/lw-001", productId: "lw-001" },
      { days: 8, type: "cart_add", route: "/api/cart", productId: "lw-001" },
      { days: 4, type: "page_view", route: "/" },
      { days: 3, type: "auth_login", route: "/api/auth/login" },
    ],
  },
  {
    email: "shreyas.me16@gmail.com",
    name: "Shreyas",
    createdAtDays: 500,
    lastLoginDays: 62,
    profile: "High-value VIP at risk — big historical spend, silent for ~62 days (high churn risk)",
    orders: [
      { days: 420, status: "completed", items: [["lw-003", 2], ["lw-004", 1]] },
      { days: 300, status: "completed", items: [["lw-002", 1], ["lw-006", 1]] },
      { days: 190, status: "completed", items: [["lw-004", 1], ["lw-001", 1]] },
      { days: 70, status: "completed", items: [["lw-003", 1]] },
    ],
    activities: [
      { days: 500, type: "auth_register", route: "/api/auth/register" },
      { days: 420, type: "auth_login", route: "/api/auth/login" },
      { days: 250, type: "auth_login", route: "/api/auth/login" },
      { days: 120, type: "auth_login", route: "/api/auth/login" },
      { days: 80, type: "product_viewed", route: "/product/lw-003", productId: "lw-003" },
      { days: 71, type: "cart_add", route: "/api/cart", productId: "lw-003" },
      { days: 62, type: "auth_login", route: "/api/auth/login" },
      { days: 62, type: "page_view", route: "/account" },
    ],
  },
  {
    email: "logicvertex227@gmail.com",
    name: "Logic Vertex",
    createdAtDays: 200,
    lastLoginDays: 2,
    profile: "Frequent shopper — 4 orders, latest 5 days ago, logged in 2 days ago (low churn risk)",
    orders: [
      { days: 180, status: "completed", items: [["lw-002", 1]] },
      { days: 120, status: "completed", items: [["lw-005", 1], ["lw-001", 1]] },
      { days: 60, status: "completed", items: [["lw-006", 1]] },
      { days: 5, status: "confirmed", items: [["lw-003", 1], ["lw-004", 1]] },
    ],
    activities: [
      { days: 200, type: "auth_register", route: "/api/auth/register" },
      { days: 200, type: "auth_login", route: "/api/auth/login" },
      { days: 100, type: "auth_login", route: "/api/auth/login" },
      { days: 100, type: "product_viewed", route: "/product/lw-005", productId: "lw-005" },
      { days: 40, type: "auth_login", route: "/api/auth/login" },
      { days: 40, type: "product_viewed", route: "/product/lw-006", productId: "lw-006" },
      { days: 15, type: "page_view", route: "/shop" },
      { days: 6, type: "product_viewed", route: "/product/lw-003", productId: "lw-003" },
      { days: 5, type: "cart_add", route: "/api/cart", productId: "lw-003" },
      { days: 3, type: "page_view", route: "/" },
      { days: 2, type: "auth_login", route: "/api/auth/login" },
    ],
  },
];

// ─── SEED LOGIC ──────────────────────────────────────────────────────────────
await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;

const products = await db.collection("products").find({}).toArray();
const productById = new Map(products.map((p) => [p.productId, p]));

const credentialRows = [];
let totalOrders = 0;
let totalActivities = 0;

for (const [index, account] of ACCOUNTS.entries()) {
  const userId = new mongoose.Types.ObjectId();
  const registeredAt = daysAgo(account.createdAtDays);

  // Idempotent: remove any previous version of this account and its data
  const existing = await db.collection("users").findOne({ email: account.email });
  if (existing) {
    await db.collection("orders").deleteMany({ userId: existing._id });
    await db.collection("activities").deleteMany({ userId: existing._id });
    await db.collection("refreshtokens").deleteMany({ userId: existing._id });
    await db.collection("users").deleteOne({ _id: existing._id });
    console.log(`  [replace] removed existing account ${account.email}`);
  }

  const { salt, passwordHash } = hashPassword(SHARED_PASSWORD);
  await db.collection("users").insertOne({
    _id: userId,
    name: account.name,
    email: account.email,
    salt,
    passwordHash,
    role: "customer",
    lastLoginAt: daysAgo(account.lastLoginDays),
    marketingOptOut: false,
    createdAt: registeredAt,
    updatedAt: registeredAt,
    __v: 0,
  });

  // ── Orders (backdated) ──
  const orderDocs = [];
  for (const [i, order] of account.orders.entries()) {
    const items = [];
    for (const [productId, quantity] of order.items) {
      const product = productById.get(productId);
      if (!product) throw new Error(`Product ${productId} not found in DB`);
      items.push({
        productId: product.productId,
        productName: product.name,
        category: product.category,
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
      });
    }
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const at = daysAgo(order.days);
    orderDocs.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      orderNumber: `LW-SEED-${index + 1}-${i + 1}`,
      items,
      subtotal,
      shipping: 0,
      discount: 0,
      total: subtotal,
      status: order.status,
      createdAt: at,
      updatedAt: at,
      __v: 0,
    });
  }
  if (orderDocs.length) await db.collection("orders").insertMany(orderDocs);
  totalOrders += orderDocs.length;

  // ── Activities: profile timeline + order_placed events + registration ──
  const activityDocs = account.activities.map((a) => ({
    _id: new mongoose.Types.ObjectId(),
    userId,
    type: a.type,
    route: a.route,
    metadata: a.productId ? { productId: a.productId } : {},
    userAgent: "seed-script",
    ipAddress: "127.0.0.1",
    createdAt: daysAgo(a.days),
    updatedAt: daysAgo(a.days),
    __v: 0,
  }));
  for (const order of orderDocs) {
    activityDocs.push({
      _id: new mongoose.Types.ObjectId(),
      userId,
      type: "order_placed",
      route: "/api/orders",
      metadata: { orderNumber: order.orderNumber, total: order.total },
      userAgent: "seed-script",
      ipAddress: "127.0.0.1",
      createdAt: order.createdAt,
      updatedAt: order.createdAt,
      __v: 0,
    });
  }
  activityDocs.sort((a, b) => a.createdAt - b.createdAt);
  if (activityDocs.length) await db.collection("activities").insertMany(activityDocs);
  totalActivities += activityDocs.length;

  credentialRows.push(
    [
      account.email.padEnd(30),
      account.name.padEnd(16),
      registeredAt.toISOString().slice(0, 10).padEnd(12),
      String(account.orders.length).padEnd(7),
      account.profile,
    ].join("  ")
  );

  console.log(
    `  [seed] ${account.email} — registered ${account.createdAtDays}d ago, ` +
      `${account.orders.length} orders, ${activityDocs.length} activities`
  );
}

// ── The one file with all account credentials ──
const credentialsFile = path.resolve(__dirname, "..", "..", "real-accounts.txt");
const credentialsContent = [
  "LUMAWEAR — REAL TEST ACCOUNTS",
  "=".repeat(100),
  `Password for ALL accounts: ${SHARED_PASSWORD}`,
  `Generated: ${new Date().toISOString()}`,
  "Login page: http://localhost:5173/signin",
  "",
  ["Email".padEnd(30), "Name".padEnd(16), "Registered".padEnd(12), "Orders".padEnd(7), "Behavioral profile"].join("  "),
  "-".repeat(100),
  ...credentialRows,
  "",
].join("\n");
fs.writeFileSync(credentialsFile, credentialsContent, "utf8");

console.log("\n==================== SUMMARY ====================");
console.log(`Accounts seeded: ${ACCOUNTS.length}`);
console.log(`Orders created:  ${totalOrders}`);
console.log(`Activities:      ${totalActivities}`);
console.log(`Credentials file: ${credentialsFile}`);

await mongoose.disconnect();
