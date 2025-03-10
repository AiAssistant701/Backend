import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

//
export const embedText = async (text) => {
  const model = "sentence-transformers/all-MiniLM-L6-v2";
  const inputs = text;

  const result = await hf.featureExtraction({
    model,
    inputs,
  });

  return result;
};

//
export const analyzeBankStatement = async (filePath) => {
  const fileData = fs.readFileSync(filePath, { encoding: "base64" });

  const text = await hf.documentQuestionAnswering({
    model: "impira/layoutlm-document-qa",
    inputs: {
      image: fileData,
      question: "Extract transactions from this bank statement",
    },
  });

  return text.answers;
};

//
export const categorizeTransactions = async (transactions) => {
  return await hf.textClassification({
    model: "facebook/bart-large-mnli",
    inputs: transactions.map((t) => `Classify this transaction: ${t}`),
  });
};
