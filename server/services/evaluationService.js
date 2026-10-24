// re-export evaluation handlers from groqService below this code block
const {
  evaluateInterviewAnswers,
  calculateAuthoritativeScores,
  calculateFallbackScoring,
} = require("./groqService");

// export evaluation service methods below this code block
module.exports = {
  evaluateInterviewAnswers,
  calculateAuthoritativeScores,
  calculateFallbackScoring,
};
