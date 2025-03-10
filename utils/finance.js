//
export const calculateInsights = (transactions) => {
  const summary = {};

  transactions.forEach(({ category, amount }) => {
    summary[category] = (summary[category] || 0) + amount;
  });

  return summary;
};

//
export const detectAnomalies = (transactions) => {
  const avg =
    transactions.reduce((sum, transaction) => sum + transaction.amount, 0) /
    transactions.length;

  return transactions.filter((transaction) => transaction.amount > avg * 2); // Flag large expenses
};
