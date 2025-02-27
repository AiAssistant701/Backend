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
];

// Load the zero-shot classification model (first time will be slow)
const classifier = await pipeline(
  "zero-shot-classification",
  "Xenova/bart-large-mnli"
);

/**
 * Classifies email content using Hugging Face transformers.js
 */
export const classifyText = async (text) => {
  const result = await classifier(text, EMAIL_CATEGORIES);
  return result.labels[0]; // Return highest-scoring category
};

const result = await classifyText("Stop that");
console.log(result)
