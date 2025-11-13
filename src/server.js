// === Load .env before any other imports ===
import dotenv from "dotenv";

// Determine env file manually
const nodeEnv = process.env.NODE_ENV || "production";
dotenv.config({
    path: nodeEnv === "production" ? ".env.production" : ".env",
});

console.log(
    `✅ Environment variables loaded from ${
        nodeEnv === "production" ? ".env.production" : ".env"
    }`
);

import app from "./app.js";
import { redis, isRedisEnabled } from "./config/redis.js";
import config from "./config/index.js";

// === Define release and environment ===
const release = config.npm_package_version || "development-build";
const PORT = config.PORT || 8081;
const ENV = config.NODE_ENV || "development";

console.log(`🚀 FinanSaku backend starting (release: ${release}, env: ${ENV})`);

// === Redis Startup Probe ===
async function startupProbe() {
    if (!isRedisEnabled) {
        console.log("ℹ️ Redis disabled — skipping startup probe");
        return;
    }

    try {
        await redis.ping();
        console.log("✅ Redis reachable at startup");
    } catch (err) {
        console.warn(
            "⚠️ Redis not reachable at startup (continuing without cache)"
        );
        console.warn(err?.message || err);
    }
}

await startupProbe();

// === Register Cron Jobs ===
// registerAggregatorCron(); // <-- REMOVED

// === Start server ===
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
