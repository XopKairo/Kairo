import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTls = redisUrl.startsWith("rediss://");

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      // Exponential backoff with a cap
      const delay = Math.min(retries * 500, 5000);
      if (retries > 10) {
        return new Error("Redis connection retries exhausted");
      }
      return delay;
    },
    tls: isTls,
    rejectUnauthorized: false, // Often needed for self-signed certificates on managed Redis
    connectTimeout: 10000,
    keepAlive: 5000,
  },
});

let logSpamBlocked = false;
redisClient.on("error", (err) => {
  if (
    err.code === "ECONNREFUSED" ||
    (err.message && err.message.includes("ECONNREFUSED"))
  ) {
    if (!logSpamBlocked) {
      console.log("⚠️ Redis Connection Refused. Running in DB-only mode.");
      logSpamBlocked = true;
    }
    return;
  }
  // Also suppress empty messages that cause "❌ Redis Client Error: " spam
  if (!err.message) return;

  if (!logSpamBlocked) {
    console.log("❌ Redis Client Error:", err.message);
  }
});

redisClient.on("connect", () => {
  logSpamBlocked = false;
  console.log("✅ Redis Connected");
});

// Improved connection with error handling to prevent startup crash
const connectRedis = async () => {
  if (redisClient.isOpen) return;
  
  try {
    await redisClient.connect();
  } catch (err) {
    if (!logSpamBlocked) {
      console.error("⚠️ Redis Initial Connection Failed:", err.message);
      console.error("ℹ️ App will continue in DB-only mode and retry in background.");
      logSpamBlocked = true;
    }
  }
};

// Initial connection attempt
connectRedis();

const safeClient = new Proxy(redisClient, {
  get(target, prop) {
    if (typeof target[prop] === "function") {
      if (
        [
          "connect",
          "on",
          "duplicate",
          "removeListener",
          "emit",
          "off",
          "subscribe",
          "unsubscribe",
          "publish",
        ].includes(prop)
      ) {
        return target[prop].bind(target);
      }
      return async (...args) => {
        if (!target.isOpen) return null;
        try {
          return await target[prop](...args);
        } catch {
          return null;
        }
      };
    }
    return target[prop];
  },
});

export default safeClient;
