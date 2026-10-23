// imports for groq-sdk library below this code block
const Groq = require("groq-sdk");

// helper function to get initialized groq client instance below this code block
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "gsk_placeholder_replace_with_real_key") {
    throw new Error(
      "GROQ_API_KEY is not configured in server environment variables.",
    );
  }
  return new Groq({ apiKey });
};

// helper function to sanitize json text by removing markdown code fences below this code block
const sanitizeJsonResponse = (text) => {
  if (!text) return "";
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
};

// helper function to clamp numeric value between min and max bounds below this code block
const clampScore = (value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) return min;
  return Math.min(max, Math.max(min, Math.round(num * 10) / 10));
};

// authoritative backend score calculation and rubric bounds validation below this code block (EVAL-002)
const calculateAuthoritativeScores = (rawEvaluations, questions) => {
  const evaluatedQuestions = [];
  let sumTech = 0;
  let sumRel = 0;
  let sumCla = 0;
  let sumComp = 0;
  let sumTotal = 0;

  for (let i = 0; i < questions.length; i++) {
    const originalQ = questions[i];
    const qNum = originalQ.questionNumber || i + 1;

    // locate matching evaluation item from groq ai response below this code block
    const matchedEval =
      rawEvaluations.find((e) => Number(e.questionNumber) === qNum) ||
      rawEvaluations[i] ||
      {};

    // enforce strict rubric bounds: technical (0-40), relevance (0-25), clarity (0-20), completeness (0-15) below this code block
    const technicalAccuracy = clampScore(matchedEval.technicalAccuracy, 0, 40);
    const relevance = clampScore(matchedEval.relevance, 0, 25);
    const clarity = clampScore(matchedEval.clarity, 0, 20);
    const completeness = clampScore(matchedEval.completeness, 0, 15);

    // authoritative backend question score sum calculation below this code block (EVAL-002)
    const questionScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(technicalAccuracy + relevance + clarity + completeness),
      ),
    );

    // accumulate totals for session-level averages below this code block
    sumTech += technicalAccuracy;
    sumRel += relevance;
    sumCla += clarity;
    sumComp += completeness;
    sumTotal += questionScore;

    // sanitize qualitative feedback strings and arrays below this code block (EVAL-003)
    const feedback =
      typeof matchedEval.feedback === "string" &&
      matchedEval.feedback.trim().length > 0
        ? matchedEval.feedback.trim()
        : "Answer demonstrates functional understanding with opportunities for deeper conceptual clarity.";

    const strengths =
      Array.isArray(matchedEval.strengths) && matchedEval.strengths.length > 0
        ? matchedEval.strengths.map((s) => String(s).trim()).filter(Boolean)
        : ["Clear articulation of key core ideas."];

    const improvements =
      Array.isArray(matchedEval.improvements) &&
      matchedEval.improvements.length > 0
        ? matchedEval.improvements.map((s) => String(s).trim()).filter(Boolean)
        : [
            "Consider incorporating concrete metrics, edge cases, and architectural trade-offs.",
          ];

    const suggestedAnswer =
      typeof matchedEval.suggestedAnswer === "string" &&
      matchedEval.suggestedAnswer.trim().length > 0
        ? matchedEval.suggestedAnswer.trim()
        : `A strong answer directly addresses ${originalQ.topicTag || "the concept"} by defining core principles, outlining practical implementation steps, and discussing production trade-offs.`;

    const topicsToPractice =
      Array.isArray(matchedEval.topicsToPractice) &&
      matchedEval.topicsToPractice.length > 0
        ? matchedEval.topicsToPractice
            .map((s) => String(s).trim())
            .filter(Boolean)
        : [originalQ.topicTag || "System Design"];

    evaluatedQuestions.push({
      questionNumber: qNum,
      evaluation: {
        technicalAccuracy,
        relevance,
        clarity,
        completeness,
        questionScore,
        feedback,
        strengths,
        improvements,
        suggestedAnswer,
        topicsToPractice,
      },
    });
  }

  const N = questions.length || 1;

  // calculate authoritative session criterion averages and overall score rounded to 1 decimal place below this code block
  const criterionAverages = {
    technicalAccuracy: Math.round((sumTech / N) * 10) / 10,
    relevance: Math.round((sumRel / N) * 10) / 10,
    clarity: Math.round((sumCla / N) * 10) / 10,
    completeness: Math.round((sumComp / N) * 10) / 10,
  };

  const overallScore = Math.round((sumTotal / N) * 10) / 10;

  return {
    evaluatedQuestions,
    criterionAverages,
    overallScore,
  };
};

// groq evaluation service rubric prompt and evaluation executor below this code block (EVAL-001 to EVAL-005)
const evaluateInterviewAnswers = async (interview) => {
  const groq = getGroqClient();
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const { targetRole, experienceLevel, category, difficulty, questions } =
    interview;

  // build category-aware rubric guidance below this code block (EVAL-004)
  const isHRorBehavioral = category === "HR" || category === "Behavioral";
  const technicalAccuracyGuidance = isHRorBehavioral
    ? `For "${category}" category interviews, "technicalAccuracy" MUST evaluate Situational & Professional Soundness (Max 40 points).
Grade whether the response demonstrates sound professional judgment, realistic workplace behavior, ethical awareness, interpersonal maturity, and role-appropriate competency (e.g., STAR method logic). Do NOT penalize for lack of software coding syntax.`
    : `For "${category}" category interviews, "technicalAccuracy" MUST evaluate factual correctness, conceptual depth, accurate terminology, APIs, debugging methodology, and architectural soundness for ${targetRole} (Max 40 points).`;

  // construct groq rubric system prompt below this code block
  const systemPrompt = `You are a Principal Engineering Director and Senior Hiring Panel Lead.
Your responsibility is to rigorously and transparently evaluate candidate interview answers according to the mandatory 100-point weighted rubric.

MANDATORY 100-POINT WEIGHTED RUBRIC CRITERIA:
1. technicalAccuracy (Max 40 points):
   ${technicalAccuracyGuidance}
   - Score Range: 0 to 40.
2. relevance (Max 25 points):
   - Directly addresses the specific prompt asked without rambling, evasiveness, or irrelevant tangents.
   - Score Range: 0 to 25.
3. clarity (Max 20 points):
   - Logical organization, readability, professional vocabulary, structured delivery (e.g., Situation, Task, Action, Result).
   - Score Range: 0 to 20.
4. completeness (Max 15 points):
   - Sufficient depth, concrete examples, edge cases, outcomes, and business impact covered.
   - Score Range: 0 to 15.

INTERVIEW CONTEXT:
- Target Job Role: ${targetRole}
- Candidate Experience Level: ${experienceLevel}
- Category Track: ${category}
- Difficulty Tier: ${difficulty}
- Total Questions Evaluated: ${questions.length}

OUTPUT FORMAT SPECIFICATION:
You MUST respond with a single valid JSON object strictly matching this schema:
{
  "evaluations": [
    {
      "questionNumber": 1,
      "technicalAccuracy": 35,
      "relevance": 22,
      "clarity": 18,
      "completeness": 13,
      "feedback": "2-3 sentences of balanced, constructive, actionable critique.",
      "strengths": ["Specific strength 1", "Specific strength 2"],
      "improvements": ["Specific improvement area 1", "Specific improvement area 2"],
      "suggestedAnswer": "Complete, exemplary model response written in first-person professional phrasing that would earn a 100/100 score.",
      "topicsToPractice": ["Topic A", "Topic B"]
    }
  ],
  "summaryFeedback": {
    "overallSummary": "High-level 2-3 sentence executive summary of overall candidate performance across the session.",
    "keyStrengths": ["Major strength across all answers", "Another prominent asset"],
    "keyWeaknesses": ["Key recurring gap observed", "Secondary area needing focus"],
    "topicsToPractice": ["Recommended study topic 1", "Recommended study topic 2", "Recommended study topic 3"]
  }
}
Do NOT include markdown formatting or extra commentary outside the JSON object.`;

  // prepare user prompt with all questions and submitted answers below this code block
  const userPayload = questions.map((q) => ({
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    topicTag: q.topicTag,
    userAnswer: q.userAnswer,
  }));

  const userPrompt = `Evaluate the following ${questions.length} interview responses against the 100-point rubric for candidate targeting "${targetRole}" (${experienceLevel} level, ${difficulty} difficulty):\n\n${JSON.stringify(userPayload, null, 2)}`;

  // execution loop supporting 1 automatic retry on transient failure below this code block (AI-004, EVAL-005)
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // invoke groq chat completions api with structured json output mode below this code block
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Groq API returned an empty evaluation response.");
      }

      // sanitize and parse json response below this code block
      const sanitized = sanitizeJsonResponse(rawContent);
      const parsed = JSON.parse(sanitized);

      if (!parsed || !Array.isArray(parsed.evaluations)) {
        throw new Error(
          'Groq evaluation response missing "evaluations" array.',
        );
      }

      // authoritative backend validation and score calculation below this code block (EVAL-002)
      const scoringResult = calculateAuthoritativeScores(
        parsed.evaluations,
        questions,
      );

      // clean session-level summary feedback below this code block
      const rawSummary = parsed.summaryFeedback || {};
      const summaryFeedback = {
        overallSummary:
          typeof rawSummary.overallSummary === "string" &&
          rawSummary.overallSummary.trim().length > 0
            ? rawSummary.overallSummary.trim()
            : `Completed ${category} practice session for ${targetRole} with an overall score of ${scoringResult.overallScore}/100.`,
        keyStrengths:
          Array.isArray(rawSummary.keyStrengths) &&
          rawSummary.keyStrengths.length > 0
            ? rawSummary.keyStrengths
                .map((s) => String(s).trim())
                .filter(Boolean)
            : ["Consistent effort in articulating structured responses."],
        keyWeaknesses:
          Array.isArray(rawSummary.keyWeaknesses) &&
          rawSummary.keyWeaknesses.length > 0
            ? rawSummary.keyWeaknesses
                .map((s) => String(s).trim())
                .filter(Boolean)
            : ["Add more real-world quantifiable examples to strengthen impact."],
        topicsToPractice:
          Array.isArray(rawSummary.topicsToPractice) &&
          rawSummary.topicsToPractice.length > 0
            ? rawSummary.topicsToPractice
                .map((s) => String(s).trim())
                .filter(Boolean)
            : [category, targetRole],
      };

      return {
        evaluatedQuestions: scoringResult.evaluatedQuestions,
        criterionAverages: scoringResult.criterionAverages,
        overallScore: scoringResult.overallScore,
        summaryFeedback,
      };
    } catch (err) {
      lastError = err;
      console.warn(
        `[Groq Evaluation Service] Evaluation attempt ${attempt} failed:`,
        err.message,
      );

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  // throw formatted error if all retry attempts were exhausted below this code block
  throw new Error(
    `AI rubric evaluation failed after retry: ${lastError?.message || "Unknown Groq error"}`,
  );
};

// export evaluation service methods below this code block
module.exports = {
  evaluateInterviewAnswers,
  calculateAuthoritativeScores,
};
