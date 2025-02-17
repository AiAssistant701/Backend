import { extractTextFromPDF } from "../utils/pdfExtractor.js";
import { summarizeText } from "../utils/summarization.js";
import { classifyTopic } from "../utils/topicClassifier.js";
import { extractNamedEntities } from "../utils/nerProcessor.js";

// Process Research Paper Analysis
export const processResearchPaper = async ({ pdfBuffer }) => {
  // Extract text from PDF
  const extractedText = await extractTextFromPDF(pdfBuffer);

  // Summarize the extracted text
  const summary = await summarizeText(extractedText);

  // lassify the research paper topic
  const topic = await classifyTopic(extractedText);

  // Extract Named Entities (Authors, Citations, Institutions)
  const namedEntities = await extractNamedEntities(extractedText);

  return {
    summary,
    topic,
    namedEntities,
  };
};
