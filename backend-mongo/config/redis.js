import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('❌ Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

// Improved connection with error handling to prevent startup crash
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error('⚠️ Redis Connection Failed. Falling back to DB only.', err.message);
  }
};

// Initial connection attempt
connectRedis();

export default redisClient;
