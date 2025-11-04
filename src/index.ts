import { readExpenses } from "./functions/read-expenses";

import "./handlebarsHelpers";
import { readOwners } from "./functions/read-owners";
import { cliInputs } from "./functions/cli-inputs";
import { buildExpenses } from "./functions/build-expenses";
import { generateExpensesImg } from "./functions/generate-expenses-img";

async function main() {
  const cliData = await cliInputs();
  const owners = await readOwners();
  const expenses = await readExpenses();
  const expensesTableData = await buildExpenses(expenses, owners, cliData);
  await generateExpensesImg(expensesTableData);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
