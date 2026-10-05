import path from "path";
import nodeHtmlToImage from "node-html-to-image";
import puppeteer, { Browser } from "puppeteer";
import Handlebars from "handlebars";
import fs from "fs";
import { ExpensesTableData, OutputFormat } from "../types";
import { ApartmentsToShowOnlyDollars } from "../constants";
import { handlebarsHelpers } from "../handlebarsHelpers";

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

const compiledTemplate = Handlebars.compile(template);
const compiledTemplateOnlyDollars = Handlebars.compile(templateOnlyDollars);

async function renderPdf(
  browser: Browser,
  html: string,
  outputPath: string
): Promise<void> {
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1400, height: 1200 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const bodyHandle = await page.$("body");
    const boundingBox = await bodyHandle?.boundingBox();
    await bodyHandle?.dispose();

    await page.pdf({
      path: outputPath,
      width: `${Math.ceil(boundingBox?.width ?? 1400)}px`,
      height: `${Math.ceil(boundingBox?.height ?? 1200)}px`,
      printBackground: true,
    });
  } finally {
    await page.close();
  }
}

export async function generateExpensesOutput(
  expenses: ExpensesTableData[],
  outputFormat: OutputFormat = "pdf"
): Promise<string> {
  const browser =
    outputFormat === "pdf"
      ? await puppeteer.launch({ headless: "shell" })
      : undefined;

  try {
    const generationTasks = expenses.map(async (expense) => {
      console.log(
        `Generando ${outputFormat === "pdf" ? "PDF" : "imagen"} para: `,
        expense.owner.apartment
      );

      const extension = outputFormat === "pdf" ? "pdf" : "png";
      const outputPath = path.join(
        process.cwd(),
        "temp",
        expense.currentMonth,
        `${expense.owner.apartment}-${expense.currentMonth}.${extension}`
      );
      await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

      const showOnlyDollars =
        ApartmentsToShowOnlyDollars[expense.owner.apartment] ?? false;
      const content = { ...expense, imageSource: logoDataURI };

      if (outputFormat === "pdf") {
        const html = (
          showOnlyDollars ? compiledTemplateOnlyDollars : compiledTemplate
        )(content);
        await renderPdf(browser!, html, outputPath);
      } else {
        await nodeHtmlToImage({
          output: outputPath,
          html: showOnlyDollars ? templateOnlyDollars : template,
          content,
          quality: 100,
          puppeteer,
          handlebarsHelpers,
        } as any);
      }

      return expense.owner.apartment;
    });

    const settledResults = await Promise.allSettled(generationTasks);
    const rejectedResults = settledResults.filter(
      (result): result is PromiseRejectedResult =>
        result.status === "rejected"
    );

    if (rejectedResults.length > 0) {
      const formattedErrors = rejectedResults
        .map((result, index) => {
          const reason =
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason);

          return `#${index + 1}: ${reason}`;
        })
        .join("\n");

      const noun = outputFormat === "pdf" ? "PDFs" : "imágenes";
      throw new Error(
        `No se pudieron generar ${rejectedResults.length} de ${expenses.length} ${noun}.\n${formattedErrors}`
      );
    }

    return outputFormat === "pdf"
      ? "PDFs generados exitosamente"
      : "Imágenes generadas exitosamente";
  } finally {
    await browser?.close();
  }
}
