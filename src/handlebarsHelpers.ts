import Handlebars from "handlebars";

const formatAmount = (amount: number = 0, decimals: number = 2) => {
  const fixedAmount = amount.toFixed(decimals);
  const [integerPart, decimalPart] = fixedAmount.split(".");
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    "."
  );
  return `${formattedIntegerPart}${decimals > 0 ? "," + decimalPart : ""}`;
};

export const handlebarsHelpers = {
  multiply(v1: number = 0, v2: number = 0, decimals: number = 2) {
    const num = Number(v1) * Number(v2);
    return formatAmount(num, decimals);
  },
  divide(v1: number = 0, v2: number = 1) {
    return formatAmount(v1 / v2);
  },
  formatAmount(amount: number = 0) {
    return formatAmount(amount);
  },
  sum(val1: number = 0, val2: number = 0, decimals: number = 2) {
    return formatAmount(val1 + val2, decimals);
  },
};

Handlebars.registerHelper(handlebarsHelpers);
