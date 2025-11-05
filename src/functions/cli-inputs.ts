import readline from "readline";
import { parse, isValid, isAfter, format, addDays } from "date-fns";
import { CLIInputs } from "../types";

const DEFAULT_DOLLAR_PRICE = 6.5;
const DEFAULT_EMISSION_DATE = format(new Date(), "dd/MM/yy");
const DEFAULT_EXPIRATION_DATE = format(addDays(new Date(), 5), "dd/MM/yy");

export const cliInputs = async (): Promise<CLIInputs> => {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt: string, defaultValue: string) =>
      new Promise<string>((resolve) => {
        rl.question(`${prompt} (${defaultValue}): `, (answer) => {
          resolve(answer || defaultValue);
        });
      });

    // Obtain Dolar price
    const price = Number(
      await question(
        "Ingrese el precio de dolar en bolivares: ",
        DEFAULT_DOLLAR_PRICE.toString()
      )
    );
    if (isNaN(price)) {
      throw new Error("Precio inválido");
    }

    // Obtain Emission Date
    const emissionDate = await question(
      "Ingrese la fecha de emisión en formato dd/mm/aa: ",
      DEFAULT_EMISSION_DATE
    );

    const parsedEmissionDate = parse(emissionDate, "dd/MM/yy", new Date());
    if (!isValid(parsedEmissionDate)) {
      throw new Error("Fecha de emisión inválida");
    }
    const emissionDateISO = parsedEmissionDate.toISOString();

    // Obtain Expiration Date
    const expirationDate = await question(
      "Ingrese la fecha de expiración en formato dd/mm/aa: ",
      DEFAULT_EXPIRATION_DATE
    );

    const parsedExpirationDate = parse(expirationDate, "dd/MM/yy", new Date());
    if (!isValid(parsedExpirationDate)) {
      throw new Error("Fecha de expiración inválida");
    }
    const expirationDateISO = parsedExpirationDate.toISOString();

    rl.close();

    // Verify emision date is after than expiration date
    if (isAfter(parsedEmissionDate, parsedExpirationDate)) {
      throw new Error(
        "Fecha de emisión debe ser anterior a la fecha de expiración"
      );
    }

    console.log(`Precio: ${price} por dólar`);
    console.log(`Fecha de emisión: ${emissionDateISO}`);
    console.log(`Fecha de expiración: ${expirationDateISO}`);

    return {
      dollarPrice: price,
      emissionDate: emissionDateISO,
      expirationDate: expirationDateISO,
    };
  } catch (error) {
    console.error("Error al obtener los inputs", error);
    process.exit(1);
  }
};
