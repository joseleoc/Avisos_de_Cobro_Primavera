import path from "path";
import nodeHtmlToImage from "node-html-to-image";
import puppeteer from "puppeteer";
import fs from "fs";
import { ExpensesTableData } from "../types";
import { ApartmentsToShowOnlyDollars } from "../constants";

const templatePath = path.join(
  process.cwd(),
  "src",
  "templates",
  "expenses.html"
);

const templateOnlyDollarsPath = path.join(
  process.cwd(),
  "src",
  "templates",
  "expenses-only-dollars.html"
);

const template = fs.readFileSync(templatePath, "utf-8");
const templateOnlyDollars = fs.readFileSync(templateOnlyDollarsPath, "utf-8");
const logo = fs.readFileSync(
  path.join(process.cwd(), "src", "assets", "logo.png")
);
const logoB64 = Buffer.from(logo).toString("base64");
const logoDataURI = `data:image/png;base64,${logoB64}`;

export async function generateExpensesImg(
  expenses: ExpensesTableData[]
): Promise<string> {
  const generationTasks = expenses.map(async (expense) => {
    console.log("Generating Image for: ", expense.owner.apartment);
    const outputPath = path.join(
      process.cwd(),
      "temp",
      expense.currentMonth,
      `${expense.owner.apartment}-${expense.currentMonth}.png`,
    );
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    const showOnlyDollars = ApartmentsToShowOnlyDollars[expense.owner.apartment] ?? false;

    await nodeHtmlToImage({
      output: outputPath,
      html: showOnlyDollars ? templateOnlyDollars : template,
      content: { ...expense, imageSource: logoDataURI },
      quality: 100,
      puppeteer,
    });

    return expense.owner.apartment;
  });

  const settledResults = await Promise.allSettled(generationTasks);
  const rejectedResults = settledResults.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (rejectedResults.length > 0) {
    const formattedErrors = rejectedResults
      .map((result, index) => {
        const reason =
          result.reason instanceof Error ? result.reason.message : String(result.reason);

        return `#${index + 1}: ${reason}`;
      })
      .join("\n");

    throw new Error(
      `No se pudieron generar ${rejectedResults.length} de ${expenses.length} imágenes.\n${formattedErrors}`,
    );
  }

  return "Images generated successfully";
}
