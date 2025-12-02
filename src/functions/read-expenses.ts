import path from "path";
import csvtojson from "csvtojson";

import { ExpenseRecordFromCSV } from "../types";

const HEADER_RENAMES: (keyof ExpenseRecordFromCSV)[] = [
  "type",
  "description",
  "usdAmount",
  "exchangeRate",
  "bolivarsAmount",
];

export async function readExpenses(): Promise<ExpenseRecordFromCSV[]> {
  const expensesPath = path.join(
    process.cwd(),
    "src",
    "assets",
    "expenses.csv"
  );

  try {
    const expenses = (await csvtojson({
      headers: HEADER_RENAMES,
      trim: true,
    }).fromFile(expensesPath)) as ExpenseRecordFromCSV[];

    return expenses;
  } catch (error) {
    console.error(error);
    return [];
  }
}
