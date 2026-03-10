import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTls = redisUrl.startsWith("rediss://");

const redisClient = createClient({
  url: redisUrl,
  socket: {
    family: 4, // Force IPv4 to avoid Render/Upstash connection drops
    reconnectStrategy: (retries) => {
      return Math.min(retries * 500, 5000);
    },
    tls: isTls ? {} : undefined, // Let the library handle TLS from URL but ensure it's enabled
    connectTimeout: 10000,
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
  console.log("✅ Redis Connected (TCP)");
});

redisClient.on("ready", () => {
  logSpamBlocked = false;
  console.log("🚀 Redis Ready (Authenticated)");
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
      // Methods that should not be wrapped in error suppression
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
      // Wrap other methods (get, set, etc.) with error suppression
      return async (...args) => {
        try {
          return await target[prop](...args);
        } catch (err) {
          // Only log if it's a real error and not just a missing connection
          if (err && err.message && !logSpamBlocked) {
             // Optional: log or ignore
          }
          return null;
        }
      };
    }
    return target[prop];
  },
});

export default safeClient;
