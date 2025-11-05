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

// function groupExpenses(
//   expenses: RecordFromCSV[],
//   owner: Owner
// ): RecordFromCSV[] {
//   const groupedExpenses = new Expenses({ owner });

//   const typesMap = new Map<string, ExpenseTypeGroup>();

//   expenses.forEach((expense) => {
//     const usdAmount = Number(expense.usdAmount.replace("$", ""));
//     const bolivarsAmount = Number(
//       expense.bolivarsAmount.replace("Bs", "").replace(",", "")
//     );
//     groupedExpenses.totalAmount.usd += usdAmount;
//     groupedExpenses.totalAmount.bolivars += bolivarsAmount;

//     if (!typesMap.has(expense.type)) {
//       typesMap.set(expense.type, {
//         type: expense.type,
//         records: [],
//         amount: {
//           usd: 0,
//           bolivars: 0,
//         },
//         ownerAmount: {
//           usd: 0,
//           bolivars: 0,
//         },
//       });
//     }

//     const type = typesMap.get(expense.type);
//     if (type) {
//       type.records.push(new ExpenseRecord(expense, owner.aliquot));
//       type.amount.usd += usdAmount;
//       type.amount.bolivars += bolivarsAmount;
//       type.ownerAmount.usd += usdAmount * owner.aliquot;
//       type.ownerAmount.bolivars += bolivarsAmount * owner.aliquot;
//     }
//   });

//   const typesArr = Array.from(typesMap.values());
//   // Ordenar los tipos de gasto (fijos, variables, publicos);
//   groupedExpenses.types = [typesArr[1], typesArr[0], typesArr[2]];

//   return new Expenses(groupedExpenses);
// }
