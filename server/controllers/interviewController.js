// imports for mongoose models and services below this code block
const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const { generateInterviewQuestions, evaluateInterviewAnswers } = require("../services/groqService");

// valid allowed configuration enum constants below this code block
const VALID_EXPERIENCE_LEVELS = ["Fresher", "Entry-level", "Experienced"];
const VALID_CATEGORIES = ["Technical", "HR", "Behavioral", "Role-based"];
const VALID_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const VALID_QUESTION_COUNTS = [5, 10, 15];

// create new interview session controller handler below this code block
const createInterview = async (req, res, next) => {
  try {
    const { targetRole, experienceLevel, category, difficulty } = req.body;

    // destructure questionCount from req.body defaulting to 5 if not provided below this code block
    const count = parseInt(req.body.questionCount) || 5;

    // validate target job role string constraints below this code block
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

    // ensure target role contains alphabetic characters below this code block
    if (!/[a-zA-Z]/.test(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: "Target job role must contain alphabetic characters.",
      });
    }

    // validate experience level enum below this code block
    if (!VALID_EXPERIENCE_LEVELS.includes(experienceLevel)) {
      return res.status(400).json({
        success: false,
        message: `Experience level must be one of: ${VALID_EXPERIENCE_LEVELS.join(", ")}.`,
      });
    }

    // validate interview category enum below this code block
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}.`,
      });
    }

    // validate difficulty tier enum below this code block
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(", ")}.`,
      });
    }

    // validate question count enum below this code block
    if (!VALID_QUESTION_COUNTS.includes(count)) {
      return res.status(400).json({
        success: false,
        message: "Question count must be 5, 10, or 15.",
      });
    }

    // call groq question generation service dynamically requesting count questions below this code block
    const generatedQuestions = await generateInterviewQuestions({
      targetRole: trimmedRole,
      experienceLevel,
      category,
      difficulty,
      questionCount: count,
      count,
    });

    // persist new interview session document in mongodb atlas below this code block
    const newInterview = await Interview.create({
      userId: req.user.id,
      targetRole: trimmedRole,
      experienceLevel,
      category,
      difficulty,
      questionCount: count,
      status: "in_progress",
      currentQuestionIndex: 0,
      questions: generatedQuestions,
    });

    // return http 201 response with created interview session below this code block
    return res.status(201).json({
      success: true,
      message: "Interview session created successfully with tailored questions.",
      interview: newInterview,
    });
  } catch (error) {
    next(error);
  }
};

// fetch list of interviews belonging strictly to authenticated user below this code block
const getInterviews = async (req, res, next) => {
  try {
    const { category, status, sort } = req.query;

    // scope query strictly to authenticated user below this code block
    const filter = { userId: req.user.id };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "score" || sort === "highest_score") {
      sortOption = { overallScore: -1, createdAt: -1 };
    }

    const rawInterviews = await Interview.find(filter).sort(sortOption);

    // format interviews into summary objects below this code block
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

    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
};

// fetch single interview session by id with ownership validation below this code block
const getInterviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

    const interview = await Interview.findById(id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    if (interview.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this interview session.",
      });
    }

    return res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// save candidate answer controller handler below this code block
const saveAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionNumber, userAnswer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

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
        message: "Answer must be at least 5 characters long with substantive content.",
      });
    }

    if (trimmedAnswer.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Answer cannot exceed 5000 characters.",
      });
    }

    const parsedQuestionNumber = Number(questionNumber);
    if (!parsedQuestionNumber || isNaN(parsedQuestionNumber)) {
      return res.status(400).json({
        success: false,
        message: "Valid question number is required.",
      });
    }

    const interview = await Interview.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found or you do not have permission to update it.",
      });
    }

    if (interview.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This interview session has already been completed and evaluated.",
      });
    }

    const questionIndex = interview.questions.findIndex(
      (q) => q.questionNumber === parsedQuestionNumber,
    );

    if (questionIndex === -1) {
      return res.status(400).json({
        success: false,
        message: `Question number ${parsedQuestionNumber} was not found in this interview session.`,
      });
    }

    // update answer text and timestamp for question subdocument below this code block
    interview.questions[questionIndex].userAnswer = trimmedAnswer;
    interview.questions[questionIndex].answeredAt = new Date();

    // calculate next active question index below this code block
    const nextUnansweredIndex = interview.questions.findIndex(
      (q) => !q.userAnswer || q.userAnswer.trim().length < 5,
    );

    if (nextUnansweredIndex !== -1) {
      interview.currentQuestionIndex = nextUnansweredIndex;
    } else {
      interview.currentQuestionIndex = interview.questions.length - 1;
    }

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
};

// evaluate interview answers controller handler below this code block
const evaluateInterview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview session identifier format.",
      });
    }

    // verify ownership strictly against authenticated user below this code block
    const interview = await Interview.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found or you do not have permission to evaluate it.",
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

    // verify all questions have substantive saved answers below this code block
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

    // execute answer evaluation with deterministic rubric fallback below this code block
    const evaluationResult = await evaluateInterviewAnswers(interview);

    // attach validated rubric evaluations to embedded question subdocuments below this code block
    for (const evaluatedItem of evaluationResult.evaluatedQuestions) {
      const qIndex = interview.questions.findIndex(
        (q) => q.questionNumber === evaluatedItem.questionNumber,
      );
      if (qIndex !== -1) {
        interview.questions[qIndex].evaluation = evaluatedItem.evaluation;
      }
    }

    // update session-level authoritative scores and qualitative summary feedback below this code block
    interview.overallScore = evaluationResult.overallScore;
    interview.criterionAverages = evaluationResult.criterionAverages;
    interview.summaryFeedback = evaluationResult.summaryFeedback;
    interview.status = "completed";
    interview.completedAt = new Date();

    // save evaluated interview document to database below this code block
    await interview.save();

    // respond with HTTP 200 indicating successful evaluation completion below this code block
    return res.status(200).json({
      success: true,
      message: "Interview answers evaluated successfully against the 100-point rubric.",
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// export controller handlers below this code block
module.exports = {
  createInterview,
  getInterviews,
  getInterviewById,
  saveAnswer,
  evaluateInterview,
};
