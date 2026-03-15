import { createClient } from "redis";
import { URL } from "url";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTls = redisUrl.startsWith("rediss://");

const urlObj = new URL(redisUrl);

const redisClient = createClient({
  url: redisUrl,
  socket: {
    family: 4,
    reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
    // Explicitly set TLS options for Upstash/SNI
    tls: isTls ? {
      servername: urlObj.hostname,
      rejectUnauthorized: false
    } : undefined,
    connectTimeout: 15000,
    keepAlive: 10000,
  },
});

let logSpamBlocked = false;
redisClient.on("error", (err) => {
  if (err.message && err.message.includes("ECONNREFUSED")) {
    if (!logSpamBlocked) {
      console.log("⚠️ Redis Connection Refused.");
      logSpamBlocked = true;
    }
    return;
  }
  if (!err.message) return;
  if (!logSpamBlocked) {
    console.log("❌ Redis Client Error:", err.message);
  }
});

redisClient.on("connect", () => {
  console.log("✅ Redis Connected (TCP)");
});

redisClient.on("ready", () => {
  logSpamBlocked = false;
  console.log("🚀 Redis Ready (Authenticated)");
});

const connectRedis = async () => {
  if (redisClient.isOpen) return;
  try {
    await redisClient.connect();
  } catch (err) {
    if (!logSpamBlocked) {
      console.error("⚠️ Redis Initial Connection Failed:", err.message);
      logSpamBlocked = true;
    }
  }
};

connectRedis();

// Exporting the raw client for now to rule out Proxy issues
export default redisClient;
