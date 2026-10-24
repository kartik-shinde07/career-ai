// imports for mongoose schema and model definition below this code block
const mongoose = require('mongoose');

// embedded question item subdocument schema definition below this code block (Section 28.3)
const questionItemSchema = new mongoose.Schema(
  {
    // unique question identifier below this code block
    questionId: {
      type: String,
      trim: true,
      default: null
    },

    // 1-based question sequence number within the interview below this code block
    questionNumber: {
      type: Number,
      required: [true, 'Question number is required']
    },

    // ai-generated interview question prompt text below this code block
    questionText: {
      type: String,
      required: [true, 'Question prompt text is required'],
      trim: true
    },

    // category classification of the question below this code block
    questionType: {
      type: String,
      trim: true,
      default: 'conceptual'
    },

    // target skill or competency being assessed below this code block
    targetCompetency: {
      type: String,
      trim: true,
      default: 'General'
    },

    // calibrated difficulty tier for the question below this code block
    difficultyLevel: {
      type: String,
      trim: true,
      default: 'Intermediate'
    },

    // conceptual domain tag for analytics and topic tracking below this code block
    topicTag: {
      type: String,
      trim: true,
      default: 'General'
    },

    // candidate submitted text answer below this code block
    userAnswer: {
      type: String,
      default: '',
      maxlength: [5000, 'Answer cannot exceed 5000 characters']
    },

    // timestamp of answer submission below this code block
    answeredAt: {
      type: Date,
      default: null
    },

    // validated 100-point rubric evaluation subdocument below this code block
    evaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    // disable automatic _id generation for embedded question subdocuments below this code block
    _id: false
  }
);

// interview session main schema definition below this code block (Section 28.2)
const interviewSchema = new mongoose.Schema(
  {
    // owner user reference with database index below this code block
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Interview session must belong to an authenticated user'],
      index: true
    },

    // configured target career role below this code block
    targetRole: {
      type: String,
      required: [true, 'Target job role is required'],
      trim: true,
      minlength: [2, 'Target role must be at least 2 characters'],
      maxlength: [80, 'Target role cannot exceed 80 characters']
    },

    // candidate experience tier below this code block
    experienceLevel: {
      type: String,
      required: [true, 'Experience level is required'],
      enum: {
        values: ['Fresher', 'Entry-level', 'Experienced'],
        message: 'Invalid experience level tier'
      }
    },

    // interview category track below this code block
    category: {
      type: String,
      required: [true, 'Interview category is required'],
      enum: {
        values: ['Technical', 'HR', 'Behavioral', 'Role-based'],
        message: 'Invalid interview category track'
      }
    },

    // question difficulty tier below this code block
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['Beginner', 'Intermediate', 'Advanced'],
        message: 'Invalid difficulty tier'
      }
    },

    // configured number of questions below this code block
    questionCount: {
      type: Number,
      required: [true, 'Question count is required'],
      enum: {
        values: [5, 10, 15],
        message: 'Question count must be 5, 10, or 15'
      }
    },

    // lifecycle status of interview session below this code block
    status: {
      type: String,
      required: true,
      enum: {
        values: ['in_progress', 'evaluation_failed', 'completed'],
        message: 'Invalid interview status'
      },
      default: 'in_progress'
    },

    // zero-based index of current active question below this code block
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0
    },

    // embedded list of interview questions and responses below this code block
    questions: {
      type: [questionItemSchema],
      required: [true, 'Interview must include questions array']
    },

    // authoritative backend overall score across all questions (0-100) below this code block
    overallScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100
    },

    // aggregated session criterion score averages below this code block
    criterionAverages: {
      technicalAccuracy: { type: Number, default: null },
      relevance: { type: Number, default: null },
      clarity: { type: Number, default: null },
      completeness: { type: Number, default: null }
    },

    // session-level qualitative summary feedback below this code block
    summaryFeedback: {
      overallSummary: { type: String, default: null },
      keyStrengths: { type: [String], default: [] },
      keyWeaknesses: { type: [String], default: [] },
      topicsToPractice: { type: [String], default: [] }
    },

    // timestamp when interview evaluation completed successfully below this code block
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    // automatic createdAt and updatedAt timestamps below this code block
    timestamps: true
  }
);

// export compiled mongoose interview model below this code block
const Interview = mongoose.model('Interview', interviewSchema);
module.exports = Interview;
