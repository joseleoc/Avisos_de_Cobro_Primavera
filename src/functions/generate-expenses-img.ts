import path from "path";
import nodeHtmlToImage from "node-html-to-image";
import fs from "fs";
import { ExpensesTableData } from "../types";

const templatePath = path.join(
  process.cwd(),
  "src",
  "templates",
  "expenses.html"
);

const template = fs.readFileSync(templatePath, "utf-8");
const logo = fs.readFileSync(
  path.join(process.cwd(), "src", "assets", "logo.png")
);
const logoB64 = Buffer.from(logo).toString("base64");
const logoDataURI = `data:image/png;base64,${logoB64}`;

export async function generateExpensesImg(
  expenses: ExpensesTableData[]
): Promise<string> {
  const generateImagesPromises = expenses.map(async (expense) => {
    console.log("Generating Image for: ", expense.owner.apartment);
    const outputPath = path.join(
      process.cwd(),
      "temp",
      expense.currentMonth,
      `${expense.owner.apartment}-${expense.currentMonth}.png`
    );
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    return nodeHtmlToImage({
      output: outputPath,
      html: template,
      content: { ...expense, imageSource: logoDataURI },
      quality: 100,
    });
  });

  try {
    await Promise.allSettled(generateImagesPromises);
    return "Images generated successfully";
  } catch (error) {
    console.error("Error al generar la imagen", error);
    throw error;
  }
}
