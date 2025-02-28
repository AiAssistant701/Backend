import { pipeline } from "@xenova/transformers";

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

let classifierInstance = null;

// =======================
// Gets or initializes the classifier
// =======================
const getClassifier = async () => {
  if (!classifierInstance) {
    console.log("Initializing zero-shot classification model...");
    classifierInstance = await pipeline(
      "zero-shot-classification",
      "Xenova/bart-large-mnli"
    );
  }
  return classifierInstance;
};

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
  const classifier = await getClassifier();

  const cleanedText = text.trim().slice(0, 1000);

  if (!cleanedText || cleanedText.length < 5) {
    return {
      category: "general inquiry",
      confidence: 0,
      fallback: true,
    };
  }

  try {
    const result = await classifier(cleanedText, EMAIL_CATEGORIES, {
      multi_label: false,
    });

    const topCategory = result.labels[0];
    const confidence = result.scores[0];

    const secondCategory = result.labels[1];
    const secondConfidence = result.scores[1];

    const urgentInquiryIndex = result.labels.indexOf("urgent inquiry");
    const urgentConfidence =
      urgentInquiryIndex >= 0 ? result.scores[urgentInquiryIndex] : 0;

    // Check for urgency in the text
    const urgencyAnalysis = analyzeUrgency(cleanedText);

    let adjustedCategory = topCategory;
    let adjustedConfidence = confidence;

    if (
      urgencyAnalysis.isUrgent &&
      urgentInquiryIndex >= 0 &&
      urgentConfidence > 0.8 * confidence
    ) {
      // If text has strong urgency indicators and "urgent inquiry" is close behind
      adjustedCategory = "urgent inquiry";
      adjustedConfidence = Math.max(urgentConfidence, confidence * 0.9);
    }

    return {
      category: adjustedCategory,
      originalCategory: topCategory,
      confidence: adjustedConfidence,
      secondCategory: secondCategory,
      secondConfidence: secondConfidence,
      urgencyAnalysis: urgencyAnalysis,
      fallback: adjustedConfidence < confidenceThreshold,
    };
  } catch (error) {
    console.error("Classification error:", error);
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
  const classifier = await getClassifier();
  const result = await classifier(text, EMAIL_PRIORITIES);
  return result.labels[0];
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

//   console.log(`Category: ${result.category}`);
//   console.log(`Should auto-reply: ${result.shouldReply}`);
//   console.log(`Reason: ${result.reason}`);
//   console.log(`Priority: ${result.priority}`);
//   console.log(`Confidence: ${result.confidence.toFixed(2)}`);
//   if (result.urgencyAnalysis) {
//     console.log(
//       `Urgency score: ${result.urgencyAnalysis.urgencyScore.toFixed(2)}`
//     );
//     console.log(
//       `Business impact: ${result.urgencyAnalysis.containsBusinessImpact}`
//     );
//   }

//   return result;
// };

// const result = await analyzeEmail({
//   subject: "System down",
//   body: "Our entire system is currently down and we can't process customer orders. This is affecting our business operations. We need immediate assistance to restore service.",
// });
// console.log(result);
