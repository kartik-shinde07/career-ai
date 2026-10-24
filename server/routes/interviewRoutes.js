// imports for express router auth middleware and interview controllers below this code block
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimitMiddleware");
const {
  createInterview,
  getInterviews,
  getInterviewById,
  saveAnswer,
  evaluateInterview,
} = require("../controllers/interviewController");

// express router initialization below this code block
const router = express.Router();

// create new interview session endpoint with groq question generation and rate limiting below this code block (INT-001 to INT-003, AI-001, SEC-003)
router.post("/", authMiddleware, aiLimiter, createInterview);

// fetch list of interviews belonging strictly to authenticated user below this code block (HIST-001 to HIST-003, AUTH-006)
router.get("/", authMiddleware, getInterviews);

// fetch single interview session or report by id with strict user ownership enforcement below this code block (REPORT-001, REPORT-002, AUTH-006)
router.get("/:id", authMiddleware, getInterviewById);

// answers saving controller endpoint below this code block (ACT-001, ACT-002, ACT-003)
router.patch("/:id/answer", authMiddleware, saveAnswer);

// interview evaluation route with 100-point rubric, rate limiting, and failure recovery below this code block (EVAL-001 to EVAL-005, ERR-003, SEC-003)
router.post("/:id/evaluate", authMiddleware, aiLimiter, evaluateInterview);

// export interview router below this code block
module.exports = router;
