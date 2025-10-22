const IORedis = require("ioredis");
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
require("dotenv").config();

const redisClient = new IORedis({
  host: proces.env.REDIS_HOST || "localhost",
  port: proces.env.REDIS_PORT || 6379,
});

const baseOptions = {
    windowMs: 60 * 1000, // 1 phút
    max: 30, // 30 req / phút
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
}
const getLimiter =(customOptions) => {
    return rateLimit({
        ...baseOptions,
        ...customOptions
      });
}

module.exports = {
    redisClient,
    getLimiter
};
