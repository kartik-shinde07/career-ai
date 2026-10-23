// imports for groq-sdk library below this code block
const Groq = require('groq-sdk');

// helper function to get initialized groq client instance below this code block
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_placeholder_replace_with_real_key') {
    throw new Error('GROQ_API_KEY is not configured in server environment variables.');
  }
  return new Groq({ apiKey });
};

// helper function to sanitize json text by removing markdown code fences below this code block
const sanitizeJsonResponse = (text) => {
  if (!text) return '';
  let cleaned = text.trim();
  // remove markdown json code blocks if present below this code block
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
};

// helper function to validate and deduplicate questions array below this code block (AI-002, INT-003)
const validateAndFormatQuestions = (questions, expectedCount) => {
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'AI output "questions" must be an array.' };
  }

  const cleanedQuestions = [];
  const seenTexts = new Set();

  for (let i = 0; i < questions.length; i++) {
    const item = questions[i];
    if (!item || typeof item.questionText !== 'string') {
      continue;
    }

    const questionText = item.questionText.trim();

    // ensure question text is meaningful and meets minimum length constraint (min 15 chars) below this code block
    if (questionText.length < 15) {
      continue;
    }

    // case-insensitive duplicate check below this code block
    const normalizedText = questionText.toLowerCase();
    if (seenTexts.has(normalizedText)) {
      continue;
    }
    seenTexts.add(normalizedText);

    cleanedQuestions.push({
      questionNumber: cleanedQuestions.length + 1,
      questionText,
      topicTag: item.topicTag && typeof item.topicTag === 'string' ? item.topicTag.trim() : 'General',
      userAnswer: '',
      answeredAt: null,
      evaluation: null
    });

    if (cleanedQuestions.length === expectedCount) {
      break;
    }
  }

  // verify exact required question count was met below this code block (INT-003)
  if (cleanedQuestions.length !== expectedCount) {
    return {
      valid: false,
      error: `Expected ${expectedCount} unique questions, but received ${cleanedQuestions.length}.`
    };
  }

  return { valid: true, questions: cleanedQuestions };
};

// interview question generation service invoking groq api below this code block (AI-001 to AI-004)
const generateInterviewQuestions = async ({
  targetRole,
  experienceLevel,
  category,
  difficulty,
  questionCount
}) => {
  const groq = getGroqClient();
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  // detailed system instructions for groq interviewer below this code block
  const systemPrompt = `You are a Principal Software Architect and Executive Interviewer.
Your task is to generate realistic, professional, and role-appropriate interview questions for a mock interview session.

CONFIGURATION PARAMETERS:
- Target Job Role: ${targetRole}
- Candidate Experience Level: ${experienceLevel}
- Interview Category Track: ${category}
- Difficulty Tier: ${difficulty}
- Total Questions Required: ${questionCount}

CATEGORY GUIDELINES:
- "Technical": Core concepts, algorithms, APIs, systems, frameworks, debugging, and real-world implementation details relevant to ${targetRole}.
- "Behavioral": STAR-method scenarios covering workplace conflict, leadership, deadline pressure, teamwork, and accountability.
- "HR": Career motivations, cultural adaptability, long-term goals, salary expectations, ethics, and company fit.
- "Role-based": Day-to-day practical scenarios, situational architecture decisions, and task execution for a ${targetRole}.

DIFFICULTY & LEVEL CALIBRATION:
- "Fresher" + "Beginner": Focus on fundamentals, mental models, and project applications.
- "Experienced" + "Advanced": Focus on scale, trade-offs, edge cases, distributed failure recovery, and architectural decisions.

OUTPUT FORMAT INSTRUCTIONS:
You MUST respond with a valid JSON object matching this exact schema:
{
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "Detailed question string...",
      "topicTag": "Specific Concept Tag"
    }
  ]
}
Each question MUST be distinct, non-repetitive, and at least 20 characters long.
Do not wrap your output in conversational markdown. Return only the JSON object.`;

  const userPrompt = `Generate exactly ${questionCount} unique ${category} interview questions tailored for a ${experienceLevel} applying as a "${targetRole}" at ${difficulty} difficulty.`;

  // execution loop supporting 1 automatic retry on transient failure below this code block (AI-004)
  let lastError = null;
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // invoke groq chat completions api with structured json mode below this code block
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      const rawContent = completion.choices[0]?.message?.content;
      if (!rawContent) {
        throw new Error('Groq API returned an empty completion content.');
      }

      // sanitize and parse json output inside try block below this code block
      const sanitized = sanitizeJsonResponse(rawContent);
      const parsed = JSON.parse(sanitized);

      // validate questions array and deduplicate below this code block
      const validation = validateAndFormatQuestions(parsed.questions, questionCount);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // return validated formatted questions list below this code block
      return validation.questions;
    } catch (err) {
      lastError = err;
      console.warn(`[Groq AI Service] Question generation attempt ${attempt} failed:`, err.message);

      // if on attempt 1, loop continues to perform single automatic retry below this code block (AI-004)
      if (attempt < maxAttempts) {
        // short 500ms delay before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // throw formatted error if all retry attempts were exhausted below this code block
  throw new Error(`AI question generation failed after retry: ${lastError?.message || 'Unknown Groq error'}`);
};

// export groq service methods below this code block
module.exports = {
  generateInterviewQuestions
};
