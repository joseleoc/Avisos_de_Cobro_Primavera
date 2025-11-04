import { OwnerFromCSV } from "../types";
import path from "path";
import csvtojson from "csvtojson";

const HEADER_RENAMES: (keyof OwnerFromCSV)[] = [
  "apartment",
  "aliquot",
  "ci",
  "name",
  "outstandingDebtUsd",
  "outstandingDebtBolivars",
  "specialPaymentUsd",
  "specialPaymentBolivars",
];

export async function readOwners(): Promise<OwnerFromCSV[]> {
  const ownersPath = path.join(process.cwd(), "src", "assets", "owners.csv");

  try {
    const owners = (await csvtojson({
      headers: HEADER_RENAMES,
      trim: true,
    }).fromFile(ownersPath)) as OwnerFromCSV[];

    return owners;
  } catch (error) {
    console.error(error);
    return [];
  }
}
