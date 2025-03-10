import Transaction from "../models/Transaction.js";

export const insertTransactions = async (transactions) => {
  await Transaction.insertMany(transactions);
};

export const getTransactionsByUserId = async(userId) => {
  const transactions = await Transaction.find({ userId });
  
    return transactions ? transactions : null;
}
