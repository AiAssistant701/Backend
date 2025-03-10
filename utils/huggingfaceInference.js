import { HfInference } from "@huggingface/inference";
import { insertTransactions } from "../usecases/transactions.js";

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
export const analyzeBankStatement = async (filePath, userId) => {
  const fileData = fs.readFileSync(filePath, { encoding: "base64" });

  const response = await hf.documentQuestionAnswering({
    model: "impira/layoutlm-document-qa",
    inputs: {
      image: fileData,
      question: "Extract transactions from this bank statement",
    },
  });

  const transactions = response.answers.map((transaction) => ({
    userId,
    date: new Date(transaction.date),
    description: transaction.text,
    category: "Uncategorized",
    amount: parseFloat(transaction.amount),
  }));

  await insertTransactions(transactions)

  return transactions;
};

//
export const categorizeTransactions = async (transactions) => {
  const categories = await hf.textClassification({
    model: "facebook/bart-large-mnli",
    inputs: transactions.map((t) => `Classify this transaction: ${t}`),
  });

  const categorizedTransactions = transactions.map((transaction, index) => ({
    ...transaction,
    category: categories[index].label || "Uncategorized",
  }));

  return categorizedTransactions
};
