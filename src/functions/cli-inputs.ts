import readline from "readline";
import { parse, isValid, isAfter, format, addDays } from "date-fns";
import { CLIInputs } from "../types";

const DEFAULT_DOLLAR_PRICE = 6.5;
const DEFAULT_EMISSION_DATE = format(new Date(), "dd/MM/yy");
const DEFAULT_EXPIRATION_DATE = format(addDays(new Date(), 5), "dd/MM/yy");

export const cliInputs = async (): Promise<CLIInputs> => {
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

  while (true) {
    // Obtain Dolar price
    let price: number;
    while (true) {
      const priceAnswer = await question(
        "Ingrese el precio de dolar en bolivares: ",
        DEFAULT_DOLLAR_PRICE.toString()
      );
      price = Number(priceAnswer);
      if (!isNaN(price)) {
        break;
      }
      console.log("Precio inválido. Intente de nuevo.");
    }

    // Obtain Emission Date
    let parsedEmissionDate: Date;
    let emissionDateISO: string;
    while (true) {
      const emissionDate = await question(
        "Ingrese la fecha de emisión en formato dd/mm/aa: ",
        DEFAULT_EMISSION_DATE
      );

      parsedEmissionDate = parse(emissionDate, "dd/MM/yy", new Date());
      if (!isValid(parsedEmissionDate)) {
        console.log("Fecha de emisión inválida. Intente de nuevo.");
        continue;
      }
      emissionDateISO = parsedEmissionDate.toISOString();
      break;
    }

    // Obtain Expiration Date
    let parsedExpirationDate: Date;
    let expirationDateISO: string;
    while (true) {
      const expirationDate = await question(
        "Ingrese la fecha de expiración en formato dd/mm/aa: ",
        DEFAULT_EXPIRATION_DATE
      );

      parsedExpirationDate = parse(expirationDate, "dd/MM/yy", new Date());
      if (!isValid(parsedExpirationDate)) {
        console.log("Fecha de expiración inválida. Intente de nuevo.");
        continue;
      }
      expirationDateISO = parsedExpirationDate.toISOString();
      break;
    }

    // Verify emission date is before expiration date
    if (isAfter(parsedEmissionDate, parsedExpirationDate)) {
      console.log(
        "Fecha de emisión debe ser anterior a la fecha de expiración. Ingrese los datos nuevamente."
      );
      continue;
    }

    rl.close();

    console.log(`Precio: ${price} por dólar`);
    console.log(`Fecha de emisión: ${emissionDateISO}`);
    console.log(`Fecha de expiración: ${expirationDateISO}`);

    return {
      dollarPrice: price,
      emissionDate: emissionDateISO,
      expirationDate: expirationDateISO,
    };
  }
};
