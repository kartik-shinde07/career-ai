// configure resilient dns servers for resolving mongodb atlas srv records below this code block
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// imports for express cors dotenv mongoose and route handlers below this code block
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// route imports below this code block
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// environment variable configuration below this code block
dotenv.config();

// express application initialization below this code block
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI;

// cors configuration allowing frontend vite origin below this code block
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

// basic security response headers middleware below this code block (SEC-003)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// body parser middleware with 100kb payload limit for security below this code block (SEC-002)
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// mongodb atlas resilient connection logic below this code block (Section 41)
const connectToDatabase = async () => {
  if (!MONGODB_URI) {
    console.warn(
      "[Career AI Database] MONGODB_URI is not set in environment variables. Database features will return 503.",
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5-second timeout to prevent hanging
    });
    console.log(
      "[Career AI Database] Successfully connected to MongoDB Atlas.",
    );
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("[Career AI Database] Connection failure details:", {
      name: err.name,
      message: err.message,
      code: err.code,
    });
    console.error(err);
    console.warn(
      "[Career AI Database] Server running in resilient mode. Database-dependent endpoints will return HTTP 503.",
    );
  }
};

// mongoose connection lifecycle event listeners below this code block
mongoose.connection.on("disconnected", () => {
  console.warn("[Career AI Database] MongoDB connection disconnected.");
});
mongoose.connection.on("reconnected", () => {
  console.log("[Career AI Database] MongoDB connection re-established.");
});
mongoose.connection.on("error", (err) => {
  console.error("[Career AI Database] MongoDB runtime error:", err.message);
});

// initialize database connection asynchronously below this code block
connectToDatabase();

// database availability verification middleware below this code block (Section 41)
const checkDbConnection = (req, res, next) => {
  // readyState 1 indicates active connection below this code block
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        "Database connection unavailable. Please verify MONGODB_URI configuration in server/.env.",
      code: "DB_UNAVAILABLE",
    });
  }
  next();
};

// api health check endpoint with database status reporting below this code block
app.get(["/api/health", "/health"], (req, res) => {
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const currentDbState = mongoose.connection.readyState;

  res.status(200).json({
    status: "ok",
    service: "Career AI Backend API",
    version: "1.0.0",
    database: dbStatusMap[currentDbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// mount authentication routes supporting both /api/auth and /auth below this code block
app.use(["/api/auth", "/auth"], checkDbConnection, authRoutes);

// mount user profile routes supporting both /api/users and /users below this code block
app.use(["/api/users", "/users"], checkDbConnection, userRoutes);

// mount interview management routes supporting both /api/interviews and /interviews below this code block
app.use(["/api/interviews", "/interviews"], checkDbConnection, interviewRoutes);

// mount analytics and telemetry routes supporting both /api/analytics and /analytics below this code block
app.use(["/api/analytics", "/analytics"], checkDbConnection, analyticsRoutes);

// 404 route not found handler below this code block
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
    code: "ROUTE_NOT_FOUND",
  });
});

// standardized error handling middleware returning clean json without leaking stack traces below this code block (ERR-001)
app.use((err, req, res, next) => {
  // safe console logging without exposing sensitive data below this code block (SEC-005)
  console.error("[Career AI Server Error]:", err.message || "Unknown error");

  const statusCode = err.status || err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || "An unexpected internal server error occurred.",
    code: err.code || "INTERNAL_SERVER_ERROR",
  };

  // attach validation details if present without stack traces below this code block
  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(statusCode).json(response);
});

// start express server on configured port below this code block
app.listen(PORT, () => {
  console.log(`[Career AI Backend] Server running on http://localhost:${PORT}`);
  console.log(
    `[Career AI Backend] Health check available at http://localhost:${PORT}/api/health`,
  );
});
