import BankStatement from "../models/BankStatement.js";

export const createBankStatement = async (
  userId,
  filePath
) => {
  const bankStatement = await BankStatement.create({
    userId,
    filePath
  });

  return bankStatement;
};