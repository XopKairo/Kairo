import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      // Limit retries to prevent log spam
      if (retries > 3) {
        return new Error("Redis connection retries exhausted");
      }
      return Math.min(retries * 100, 1000);
    },
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
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    if (!logSpamBlocked) {
      console.error("⚠️ Redis Connection Failed. Falling back to DB only.");
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
        } catch (error) {
          return null;
        }
      };
    }
    return target[prop];
  },
});

export default safeClient;
