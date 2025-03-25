import axios from "axios";
import dotenv from "dotenv";
import logger from "../logger.js";

dotenv.config();

const HUGGINGFACE_API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const API_HEADERS = {
  Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
  "Content-Type": "application/json",
};

const EMAIL_CATEGORIES = [
  "out of office",
  "support request",
  "urgent inquiry",
  "follow-up",
  "meeting request",
  "thank you email",
  "spam",
  "general inquiry",
  "complaint",
  "sales inquiry",
  "job application",
  "feedback",
  "introduction",
  "newsletter",
  "invitation",
  "information request",
];

const EMAIL_PRIORITIES = ["urgent", "important", "standard", "low priority"];

// =======================
// Analyzes text for urgency indicators
// =======================
const analyzeUrgency = (text) => {
  const lowerText = text.toLowerCase();

  // Single urgency keywords
  const urgentKeywords = [
    "asap",
    "immediately",
    "urgent",
    "emergency",
    "critical",
    "priority",
    "crucial",
    "vital",
    "crisis",
  ];

  // Phrases that indicate urgency
  const urgentPhrases = [
    "as soon as possible",
    "right away",
    "without delay",
    "time sensitive",
    "need assistance",
    "need help",
    "can't wait",
    "cannot wait",
    "system down",
    "system is down",
    "not working",
    "broken",
    "can't access",
    "cannot access",
    "unable to access",
    "affecting business",
    "affecting our business",
    "impacting business",
    "business impact",
    "revenue impact",
    "financial impact",
    "losing money",
    "lost revenue",
    "deadline",
    "by tomorrow",
    "by today",
    "right now",
    "at once",
  ];

  // Business impact phrases that indicate urgency
  const businessImpactPhrases = [
    "can't process",
    "cannot process",
    "unable to process",
    "blocking",
    "blocked",
    "preventing us from",
    "preventing me from",
    "customers affected",
    "customers impacted",
    "customers waiting",
    "production issue",
    "production environment",
    "live environment",
    "service outage",
    "service disruption",
    "downtime",
  ];

  const containsUrgentKeyword = urgentKeywords.some((keyword) =>
    lowerText.includes(keyword)
  );

  const containsUrgentPhrase = urgentPhrases.some((phrase) =>
    lowerText.includes(phrase)
  );

  const containsBusinessImpact = businessImpactPhrases.some((phrase) =>
    lowerText.includes(phrase)
  );

  // Overall urgency score
  const urgencyScore =
    (containsUrgentKeyword ? 0.5 : 0) +
    (containsUrgentPhrase ? 0.3 : 0) +
    (containsBusinessImpact ? 0.4 : 0);

  return {
    isUrgent:
      urgencyScore >= 0.3 || containsUrgentKeyword || containsBusinessImpact,
    urgencyScore,
    containsUrgentKeyword,
    containsUrgentPhrase,
    containsBusinessImpact,
  };
};

// =======================
// Classifies the text
// =======================
export const classifyText = async (text, confidenceThreshold = 0.3) => {
  const cleanedText = text.trim().slice(0, 1000);
  if (!cleanedText || cleanedText.length < 5) {
    return {
      category: "general inquiry",
      confidence: 0,
      fallback: true,
    };
  }

  const chunkSize = 10;
  const labelChunks = [];

  // Split labels into chunks
  for (let i = 0; i < EMAIL_CATEGORIES.length; i += chunkSize) {
    labelChunks.push(EMAIL_CATEGORIES.slice(i, i + chunkSize));
  }

  let bestLabel = null;
  let bestScore = -1;

  try {
    for (const chunk of labelChunks) {
      try {
        const response = await axios.post(
          HUGGINGFACE_API_URL,
          {
            inputs: cleanedText,
            parameters: {
              candidate_labels: chunk,
            },
          },
          { headers: API_HEADERS }
        );

        if (response.data.labels && response.data.scores) {
          const topLabel = response.data.labels[0];
          const topScore = response.data.scores[0];

          if (topScore > bestScore) {
            bestLabel = topLabel;
            bestScore = topScore;
          }
        }
      } catch (error) {
        logger.error("Error calling Hugging Face API:", error);
      }
    }

    // Use bestLabel and bestScore
    return {
      category:
        bestScore >= confidenceThreshold ? bestLabel : "general inquiry",
      confidence: bestScore,
      fallback: bestScore < confidenceThreshold,
    };
  } catch (error) {
    logger.error("Classification error:", error);
    return {
      category: "general inquiry",
      confidence: 0,
      error: error.message,
      fallback: true,
    };
  }
};

// =======================
// Determines the priority level of an email
// =======================
export const classifyPriority = async (text) => {
  try {
    const response = await axios.post(
      HUGGINGFACE_API_URL,
      { inputs: text, parameters: { candidate_labels: EMAIL_PRIORITIES } },
      { headers: API_HEADERS }
    );

    return response.data.labels[0];
  } catch (error) {
    logger.error("Priority classification error:", error);
    return "standard";
  }
};

// =======================
// Enhanced auto-reply detection with contextual analysis
// =======================
export const shouldAutoReply = async (email) => {
  // Extract more context from the email
  const subject = email.subject || "";
  const body = email.snippet || "";
  const fullText = [subject, body].join(" ");

  const urgencyAnalysis = analyzeUrgency(fullText);

  const classificationText = [subject, body, body].join(" ");

  const classification = await classifyText(classificationText);
  logger.info("classification", classification);
  const priority = await classifyPriority(fullText);

  // Minimum confidence threshold for auto-replies
  const AUTO_REPLY_CONFIDENCE_THRESHOLD = 0.3;

  // Lower threshold for urgent messages
  const URGENT_CONFIDENCE_THRESHOLD = 0.25;

  const autoReplyCategories = [
    "support request",
    "urgent inquiry",
    "information request",
  ];

  const noAutoReplyCategories = [
    "spam",
    "thank you email",
    "feedback",
    "newsletter",
  ];

  const humanReviewKeywords = [
    "disappointed",
    "unhappy",
    "frustrated",
    "angry",
    "legal",
    "lawyer",
    "attorney",
    "refund",
    "cancel",
    "terminate",
    "complaint",
  ];

  const wordCount = fullText.split(/\s+/).length;
  const isVeryShort = wordCount < 10;

  // Check for keywords that suggest human review is needed
  const needsHumanReview = humanReviewKeywords.some((keyword) =>
    fullText.toLowerCase().includes(keyword.toLowerCase())
  );

  if (needsHumanReview) {
    return {
      shouldReply: false,
      reason: "Contains sensitive keywords requiring human review",
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
      urgencyAnalysis,
    };
  }

  if (noAutoReplyCategories.includes(classification.category)) {
    return {
      shouldReply: false,
      reason: `Category '${classification.category}' doesn't require auto-reply`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
      urgencyAnalysis,
    };
  }

  // Special handling for confirmed urgent messages with business impact
  if (
    urgencyAnalysis.containsBusinessImpact ||
    urgencyAnalysis.urgencyScore > 0.4 ||
    classification.category === "urgent inquiry"
  ) {
    // Even with lower confidence, urgent business-impacting issues should get auto-reply
    const confidenceThreshold = urgencyAnalysis.containsBusinessImpact
      ? URGENT_CONFIDENCE_THRESHOLD
      : AUTO_REPLY_CONFIDENCE_THRESHOLD;

    if (
      classification.confidence >= confidenceThreshold ||
      urgencyAnalysis.urgencyScore > 0.7
    ) {
      return {
        shouldReply: true,
        reason: `Urgent message detected (${urgencyAnalysis.urgencyScore.toFixed(
          2
        )} score)`,
        category: classification.category,
        priority: "urgent",
        confidence: classification.confidence,
        urgencyAnalysis,
      };
    }
  }

  // Check if confidence is too low for auto-reply
  if (
    classification.confidence < AUTO_REPLY_CONFIDENCE_THRESHOLD &&
    !urgencyAnalysis.isUrgent
  ) {
    return {
      shouldReply: false,
      reason: `Confidence too low (${classification.confidence.toFixed(
        2
      )}) for auto-reply`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
      urgencyAnalysis,
    };
  }

  // Short messages without urgent indicators should be handled by humans
  if (isVeryShort && !urgencyAnalysis.isUrgent) {
    return {
      shouldReply: false,
      reason: "Message too short for confident classification",
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
      urgencyAnalysis,
    };
  }

  if (autoReplyCategories.includes(classification.category)) {
    return {
      shouldReply: true,
      reason: `Matches auto-reply category: ${classification.category}`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
      urgencyAnalysis,
    };
  }

  return {
    shouldReply: false,
    reason: "Does not match auto-reply criteria",
    category: classification.category,
    priority: priority,
    confidence: classification.confidence,
    urgencyAnalysis,
  };
};

// test
// export const analyzeEmail = async (emailData) => {
//   const result = await shouldAutoReply(emailData);

//   logger.info(`Category: ${result.category}`);
//   logger.info(`Should auto-reply: ${result.shouldReply}`);
//   logger.info(`Reason: ${result.reason}`);
//   logger.info(`Priority: ${result.priority}`);
//   logger.info(`Confidence: ${result.confidence.toFixed(2)}`);
//   if (result.urgencyAnalysis) {
//     logger.info(
//       `Urgency score: ${result.urgencyAnalysis.urgencyScore.toFixed(2)}`
//     );
//     logger.info(
//       `Business impact: ${result.urgencyAnalysis.containsBusinessImpact}`
//     );
//   }

//   return result;
// };

// const result = await analyzeEmail({
//   subject: "System down",
//   body: "Our entire system is currently down and we can't process customer orders. This is affecting our business operations. We need immediate assistance to restore service.",
// });
// logger.info(result);
