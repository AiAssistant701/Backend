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

    return {
      category: topCategory,
      confidence: confidence,
      fallback: confidence < confidenceThreshold,
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
  const fullText = [email.subject, email.body].filter(Boolean).join(" ");
  const classification = await classifyText(fullText);
  const priority = await classifyPriority(fullText);

  const AUTO_REPLY_CONFIDENCE_THRESHOLD = 0.35;

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

  const urgentKeywords = [
    "asap",
    "immediately",
    "urgent",
    "emergency",
    "critical",
  ];

  const isVeryShort = fullText.split(/\s+/).length < 10;

  const needsHumanReview = humanReviewKeywords.some((keyword) =>
    fullText.toLowerCase().includes(keyword.toLowerCase())
  );

  const containsUrgentKeywords = urgentKeywords.some((keyword) =>
    fullText.toLowerCase().includes(keyword.toLowerCase())
  );

  // Decision logic with reason
  if (needsHumanReview) {
    return {
      shouldReply: false,
      reason: "Contains sensitive keywords requiring human review",
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
    };
  }

  if (noAutoReplyCategories.includes(classification.category)) {
    return {
      shouldReply: false,
      reason: `Category '${classification.category}' doesn't require auto-reply`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
    };
  }

  // Check if confidence is too low for auto-reply
  if (
    classification.confidence < AUTO_REPLY_CONFIDENCE_THRESHOLD &&
    !containsUrgentKeywords
  ) {
    return {
      shouldReply: false,
      reason: `Confidence too low (${classification.confidence.toFixed(
        2
      )}) for auto-reply`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
    };
  }

  // Short messages without urgent keywords should be handled by humans
  if (isVeryShort && !containsUrgentKeywords) {
    return {
      shouldReply: false,
      reason: "Message too short for confident classification",
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
    };
  }

  if (
    autoReplyCategories.includes(classification.category) ||
    (classification.category === "general inquiry" && containsUrgentKeywords)
  ) {
    return {
      shouldReply: true,
      reason: containsUrgentKeywords
        ? "Contains urgent keywords"
        : `Matches auto-reply category: ${classification.category}`,
      category: classification.category,
      priority: priority,
      confidence: classification.confidence,
    };
  }

  return {
    shouldReply: false,
    reason: "Does not match auto-reply criteria",
    category: classification.category,
    priority: priority,
    confidence: classification.confidence,
  };
};

// test
export const analyzeEmail = async (emailData) => {
  const result = await shouldAutoReply(emailData);

  console.log(`Category: ${result.category}`);
  console.log(`Should auto-reply: ${result.shouldReply}`);
  console.log(`Reason: ${result.reason}`);
  console.log(`Priority: ${result.priority}`);
  console.log(`Confidence: ${result.confidence.toFixed(2)}`);

  return result;
};

const result = await analyzeEmail({
  subject: "System down",
  body: "Our entire system is currently down and we can't process customer orders. This is affecting our business operations. We need immediate assistance to restore service.",
});
console.log(result);
