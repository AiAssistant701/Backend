import { insertTransactions } from "../usecases/transactions.js";
import { createBankStatement } from "../usecases/bankStatements.js";
import { analyzeStatement, categorizeTransactions } from "../utils/huggingfaceInference.js";

export const analyzeFinance = async (filePath, userId) => {
  try {
    await createBankStatement(userId, filePath);
    let transactions = await analyzeStatement(filePath, userId);
    transactions = await categorizeTransactions(transactions);

    await insertTransactions(transactions);

    return transactions;
  } catch (error) {
    throw error;
  }
};
