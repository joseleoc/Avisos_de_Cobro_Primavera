# Avisos de Cobro Primavera

Avisos de Cobro Primavera is a TypeScript/Node.js CLI that turns monthly condominium expenses into ready-to-send billing notices. The tool ingests owner and expense data from CSV files, calculates individual balances, and renders polished PNG images using an HTML template.

## What the project does
- Collects CLI inputs (dollar price, emission date, expiration date) for the billing cycle.
- Reads owners and expenses from CSV spreadsheets and converts them into typed objects.
- Calculates subtotals, reserve funds, arrears, and totals per owner.
- Generates a high-quality billing notice image for each owner based on a Handlebars HTML template.

## How it works
1. **CLI input capture** – `cli-inputs.ts` prompts for rate and dates, validates them with `date-fns`, and returns normalized ISO strings for downstream processing (@src/functions/cli-inputs.ts#1-76).
2. **Data ingestion** – `read-owners.ts` and `read-expenses.ts` parse their respective CSV files with `csvtojson`, mapping headers to strongly typed records (@src/functions/read-owners.ts#1-31, @src/functions/read-expenses.ts#1-34).
3. **Computation** – `build-expenses.ts` wraps each owner in an `ExpensesTableData` instance, adds every expense, and derives totals, reserves, and outstanding balances (@src/functions/build-expenses.ts#1-23, @src/types.ts#182-299).
4. **Rendering** – `generate-expenses-img.ts` merges the pre-computed data with the Handlebars template and converts the HTML into PNG images through `node-html-to-image` (@src/functions/generate-expenses-img.ts#1-48).

The entry point in `src/index.ts` orchestrates the flow: read CLI input, load CSVs, build expense tables, and render the final notices (@src/index.ts#1-15).

## Project structure
```
src/
  assets/            # Sample CSV inputs and logo
  functions/         # CLI, CSV, processing, and rendering helpers
  templates/         # Handlebars-compatible HTML template
  handlebarsHelpers.ts # Formatting helpers for Handlebars
  index.ts           # CLI entry point
  types.ts           # Domain models and calculations
temp/                # Generated PNG notices (grouped by month)
```

## Prerequisites
- Node.js 18 or newer (needed for Puppeteer/node-html-to-image).
- npm (bundled with Node.js).

## Setup
```bash
npm install
```

## Running the generator
```bash
npm run start
```

1. Provide the prompted dollar price, emission date, and expiration date (defaults are pre-filled).
2. Confirm that `src/assets/owners.csv` and `src/assets/expenses.csv` contain the data you want to process.
3. The generator writes PNG files to `temp/<mes>/<apartamento>-<mes>.png` and logs progress to the console.

## Input data examples
The generator expects the following column order and formatting in the CSV files.

### Owners (`src/assets/owners.csv`)
| Apto | Alicuota | Cédula | Nombre | Deuda pendiente $ | Deuda pendiente Bs | Cuota especial $ | Cuota especial Bs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #APTO | 7.64% |  | Nombre de propietario | $2,133.24 | Bs477,167.82 | $907.40 | Bs202,969.23 |
| #APTO | 1% |  | Nombre de propietario  2 | $0 | Bs0 | $0 | Bs0 Bs0 |
| #APTO | 5% |  | Nombre de propietario  3 | $10 | Bs100 | $10 | Bs200 |

### Expenses (`src/assets/expenses.csv`)
| Fecha | Tipo | Descripción | Monto en Dólares | Tasa de dolar usada | Monto en Bolívares |
| --- | --- | --- | --- | --- | --- |
| 29/10/2025 | Gastos Variables | Texto de ejemplo | $1.00 | Bs300.00 | Bs300.00 |
| 29/10/2025 | Gastos Fijos | Prueba gastos fijo 1 | $1.50 | Bs300.00 | Bs450.00 |
| 29/10/2025 | Gastos Públicos | Prueba gastos público 1 | $2.00 | Bs300.00 | Bs600.00 |
| 29/10/2025 | Gastos Variables | Gastos variable 2 | $2.50 | Bs300.00 | Bs750.00 |
| 29/10/2025 | Gastos Fijos | Prueba gastos fijo 2 | $3.00 | Bs300.00 | Bs900.00 |
| 29/10/2025 | Gastos Públicos | Prueba gastos público 2 | $4.50 | Bs300.00 | Bs1,350.00 |
| 29/10/2025 | Gastos Variables | Gastos variable 3 | $6.00 | Bs300.00 | Bs1,800.00 |
| 29/10/2025 | Gastos Fijos | Prueba gastos fijo 3 | $5.00 | Bs300.00 | Bs1,500.00 |
| 29/10/2025 | Gastos Públicos | Prueba gastos público 3 | $7.00 | Bs300.00 | Bs2,100.00 |

## Output example
Each run saves PNG notices in the `temp` directory. The sample below was generated from the bundled CSV files.

![Ejemplo de aviso generado](temp/enero%20de%202022/NumAPTO-enero%20de%202022.png)