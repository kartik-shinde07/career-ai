// imports for express router mongoose models middleware groq services and rate limiters below this code block
const express = require("express");
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const authMiddleware = require("../middleware/authMiddleware");
const { aiLimiter } = require("../middleware/rateLimitMiddleware");
const { generateInterviewQuestions } = require("../services/groqService");
const { evaluateInterviewAnswers } = require("../services/evaluationService");

// express router initialization below this code block
const router = express.Router();

// valid allowed configuration enum constants below this code block
const VALID_EXPERIENCE_LEVELS = ["Fresher", "Entry-level", "Experienced"];
const VALID_CATEGORIES = ["Technical", "HR", "Behavioral", "Role-based"];
const VALID_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const VALID_QUESTION_COUNTS = [5, 10, 15];

// create new interview session endpoint with groq question generation and rate limiting below this code block (INT-001 to INT-003, AI-001, SEC-003)
router.post("/", authMiddleware, aiLimiter, async (req, res, next) => {
  try {
    const { targetRole, experienceLevel, category, difficulty, questionCount } =
      req.body;

    // 1. validate target job role string constraints below this code block (INT-001)
    if (!targetRole || typeof targetRole !== "string") {
      return res.status(400).json({
        success: false,
        message: "Target job role is required and must be text.",
      });
    }

    const trimmedRole = targetRole.trim();
    if (trimmedRole.length < 2 || trimmedRole.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Target job role must be between 2 and 80 characters long.",
      });
    }

    // ensure target role contains alphabetic characters and is not purely symbols below this code block
    if (!/[a-zA-Z]/.test(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: "Target job role must contain alphabetic characters.",
      });
    }

    // 2. validate experience level enum below this code block
    if (!VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({
        success: false,
        message: `Experience level must be one of: ${VALID_EXPERIENCE_LEVELS.join(", ")}.`,
      });
    }

    // 3. validate interview category enum below this code block
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
      });
    }

    // 4. validate difficulty tier enum below this code block
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}.`,
      });
    }

    // 5. validate question count enum below this code block
    const parsedCount = Number(questionCount);
    if (!VALID_QUESTION_COUNTS.includes(parsedCount)) {
      return res.status(400).json({
        success: false,
        message: `Question count must be 5, 10, or 15.`,
      });
    }

    // call groq ai service to generate tailored interview questions below this code block (AI-001)
    let generatedQuestions;
    try {
      generatedQuestions = await generateInterviewQuestions({
        targetRole: trimmedRole,
        experienceLevel,
        category,
        difficulty,
        questionCount: parsedCount,
      });
    } catch (aiError) {
      console.error(
        "[Interview Route] Groq AI generation failure:",
        aiError.message,
      );
      return res.status(502).json({
        success: false,
        message:
          "Could not generate interview questions right now. Please try again or adjust your configuration.",
        error: aiError.message,
      });
    }

    // persist new interview session document in mongodb atlas below this code block (Section 28.2)
    const newInterview = await Interview.create({
      userId: req.user.id,
      targetRole: trimmedRole,
      experienceLevel,
      category,
      difficulty,
      questionCount: parsedCount,
      status: "in_progress",
      currentQuestionIndex: 0,
      questions: generatedQuestions,
    });

    // return http 201 response with created interview session below this code block
    return res.status(201).json({
      success: true,
      message:
        "Interview session created successfully with tailored questions.",
      interview: newInterview,
    });
  } catch (error) {
    // pass unhandled errors to global error middleware below this code block
    next(error);
  }
});

// fetch list of interviews belonging strictly to authenticated user below this code block (HIST-001 to HIST-003, AUTH-006)
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { category, status, sort } = req.query;

    // scope query strictly to authenticated user to prevent data leaks below this code block (AUTH-006)
    const filter = { userId: req.user.id };

    // category filtering condition below this code block
    if (category && category !== "All") {
      filter.category = category;
    }

    // session lifecycle status filtering condition below this code block
    if (status && status !== "All") {
      filter.status = status;
    }

    // configure sorting order based on sort parameter below this code block
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "score" || sort === "highest_score") {
      sortOption = { overallScore: -1, createdAt: -1 };
    } else {
      // default: newest first
      sortOption = { createdAt: -1 };
    }

    // execute database query retrieving user interview documents below this code block
    const rawInterviews = await Interview.find(filter).sort(sortOption);

    // format interviews into summary objects including answered question counts below this code block
    const interviews = rawInterviews.map((item) => {
      const answeredCount = Array.isArray(item.questions)
        ? item.questions.filter(
            (q) => q.userAnswer && q.userAnswer.trim().length >= 5,
          ).length
        : 0;

      return {
        _id: item._id,
        targetRole: item.targetRole,
        experienceLevel: item.experienceLevel,
        category: item.category,
        difficulty: item.difficulty,
        questionCount: item.questionCount,
        currentQuestionIndex: item.currentQuestionIndex,
        status: item.status,
        overallScore: item.overallScore,
        criterionAverages: item.criterionAverages,
        answeredQuestionCount: answeredCount,
        createdAt: item.createdAt,
        completedAt: item.completedAt,
        updatedAt: item.updatedAt,
      };
    });

    // return formatted response with total count and summary list below this code block
    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
});

// fetch single interview session or report by id with strict user ownership enforcement below this code block (REPORT-001, REPORT-002, AUTH-006)
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // validate valid mongodb object id format below this code block
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

    // query interview document from database by primary key below this code block
    const interview = await Interview.findById(id);

    // return 404 if interview does not exist in database below this code block
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    // verify ownership strictly against authenticated user below this code block (AUTH-006)
    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this interview session.",
      });
    }

    // return full interview document with questions, criteria, and qualitative summaries below this code block
    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
});

// answers saving controller endpoint below this code block (ACT-001, ACT-002, ACT-003)
router.patch("/:id/answer", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionNumber, userAnswer } = req.body;

    // validate valid mongodb object id format below this code block
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

    // validate user answer content constraints (min 5 chars, non-empty, reject whitespace-only) below this code block (ACT-002)
    if (!userAnswer || typeof userAnswer !== "string") {
      return res.status(400).json({
        success: false,
        message: "Answer text is required and cannot be empty.",
      });
    }

    const trimmedAnswer = userAnswer.trim();
    if (trimmedAnswer.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          "Answer must be at least 5 characters long with substantive content.",
      });
    }

    if (trimmedAnswer.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Answer cannot exceed 5000 characters.",
      });
    }

    // validate question number parameter below this code block
    const parsedQuestionNumber = Number(questionNumber);
    if (!parsedQuestionNumber || isNaN(parsedQuestionNumber)) {
      return res.status(400).json({
        success: false,
        message: "Valid question number is required.",
      });
    }

    // find interview document ensuring strict ownership check below this code block (AUTH-006)
    const interview = await Interview.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          "Interview session not found or you do not have permission to update it.",
      });
    }

    // verify interview is currently active and not already completed below this code block
    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message:
          "This interview session has already been completed and evaluated.",
      });
    }

    // locate matching question in embedded questions array below this code block
    const questionIndex = interview.questions.findIndex(
      (q) => q.questionNumber === parsedQuestionNumber,
    );

    if (questionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Question number ${parsedQuestionNumber} was not found in this interview session.`,
      });
    }

    // update answer text and timestamp for the specific question subdocument below this code block (ACT-002, Section 30.1)
    interview.questions[questionIndex].userAnswer = trimmedAnswer;
    interview.questions[questionIndex].answeredAt = new Date();

    // calculate next active question index or first remaining unanswered question below this code block (ACT-003)
    const nextUnansweredIndex = interview.questions.findIndex(
      (q) => !q.userAnswer || q.userAnswer.trim().length < 5,
    );

    if (nextUnansweredIndex !== -1) {
      interview.currentQuestionIndex = nextUnansweredIndex;
    } else {
      // all questions have been answered; stay on last question index
      interview.currentQuestionIndex = interview.questions.length - 1;
    }

    // atomic save of updated interview document in mongodb atlas below this code block (Section 30.1)
    await interview.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully.",
      interview,
      nextQuestionIndex: interview.currentQuestionIndex,
    });
  } catch (error) {
    next(error);
  }
});

// interview evaluation route with 100-point rubric, rate limiting, and failure recovery below this code block (EVAL-001 to EVAL-005, ERR-003, SEC-003)
router.post("/:id/evaluate", authMiddleware, aiLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;

    // validate valid mongodb object id format below this code block
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

    // find interview document ensuring strict ownership check below this code block (AUTH-006)
    const interview = await Interview.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message:
          "Interview session not found or you do not have permission to evaluate it.",
      });
    }

    // return existing completed interview if already evaluated below this code block
    if (interview.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Interview has already been evaluated.",
        interview,
      });
    }

    // verify all N questions have substantive saved answers below this code block (EVAL-001, ACT-004)
    const missingAnswers = interview.questions.filter(
      (q) => !q.userAnswer || q.userAnswer.trim().length < 5,
    );

    if (missingAnswers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot evaluate interview. ${missingAnswers.length} question(s) remain unanswered or contain under 5 characters.`,
        unansweredQuestionNumbers: missingAnswers.map((q) => q.questionNumber),
      });
    }

    // execute groq ai answer evaluation against the 100-point weighted rubric below this code block (EVAL-001 to EVAL-004)
    let evaluationResult;
    try {
      evaluationResult = await evaluateInterviewAnswers(interview);
    } catch (evalError) {
      console.error(
        "[Interview Evaluation Route] Groq evaluation failure:",
        evalError.message,
      );

      // transition interview status to evaluation_failed while preserving all saved answers below this code block (ERR-003, ACT-003, EVAL-005)
      interview.status = "evaluation_failed";
      await interview.save();

      return res.status(502).json({
        success: false,
        message:
          "AI evaluation service encountered a temporary error. Your answers have been safely preserved. Please retry evaluation.",
        error: evalError.message,
        code: "EVALUATION_FAILED",
      });
    }

    // attach validated rubric evaluations to embedded question subdocuments below this code block (EVAL-002, Section 30.2)
    for (const evaluatedItem of evaluationResult.evaluatedQuestions) {
      const qIndex = interview.questions.findIndex(
        (q) => q.questionNumber === evaluatedItem.questionNumber,
      );
      if (qIndex !== -1) {
        interview.questions[qIndex].evaluation = evaluatedItem.evaluation;
      }
    }

    // update session-level authoritative scores and qualitative summary feedback below this code block (EVAL-002, EVAL-003)
    interview.overallScore = evaluationResult.overallScore;
    interview.criterionAverages = evaluationResult.criterionAverages;
    interview.summaryFeedback = evaluationResult.summaryFeedback;
    interview.status = "completed";
    interview.completedAt = new Date();

    // atomic commit of completed evaluation to mongodb atlas below this code block (Section 30.2)
    await interview.save();

    return res.status(200).json({
      success: true,
      message:
        "Interview answers evaluated successfully against the 100-point rubric.",
      interview,
    });
  } catch (error) {
    next(error);
  }
});

// export interview router below this code block
module.exports = router;

