import readline from "readline";
import { readExpenses } from "./functions/read-expenses";

import "./handlebarsHelpers";
import { readOwners } from "./functions/read-owners";
import { cliInputs } from "./functions/cli-inputs";
import { buildExpenses } from "./functions/build-expenses";
import { generateExpensesImg } from "./functions/generate-expenses-img";

async function runOnce() {
  const cliData = await cliInputs();
  const owners = await readOwners();
  const expenses = await readExpenses();
  const expensesTableData = await buildExpenses(expenses, owners, cliData);
  await generateExpensesImg(expensesTableData);
}

const askRestart = async (): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer: string = await new Promise((resolve) => {
    rl.question(
      "Escriba 'r' para reiniciar o cualquier otra tecla para salir: ",
      (input) => {
        resolve(input);
      }
    );
  });

  rl.close();

  return answer.trim().toLowerCase() === "r";
};

async function main() {
  // Loop until the user decides to exit
  while (true) {
    try {
      await runOnce();
    } catch (error) {
      console.error("Error durante la ejecución:", error);
    }

    const shouldRestart = await askRestart();
    if (!shouldRestart) {
      break;
    }
  }
}

main().catch((error) => {
  console.error(error);
});
