import {
  CLIInputs,
  ExpenseRecordFromCSV,
  ExpensesTableData,
  OwnerFromCSV,
} from "../types";

export async function buildExpenses(
  expenses: ExpenseRecordFromCSV[],
  owners: OwnerFromCSV[],
  cliInputs: CLIInputs
): Promise<ExpensesTableData[]> {
  const expensesTableData = owners.map((owner) => {
    const expenseData = new ExpensesTableData(owner, cliInputs);
    expenseData.addExpenses(expenses);
    expenseData.calculateTotalAmount();

    return expenseData;
  });

  return expensesTableData;
}
