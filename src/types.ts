import { isValid, format } from "date-fns";
import { cliInputs } from "./functions/cli-inputs";

export enum ExpenseType {
  Gastos_Fijos = "Gastos Fijos",
  Gastos_Variables = "Gastos Variables",
  Gastos_Públicos = "Gastos Públicos",
}

export type CLIInputs = {
  dollarPrice: number;
  emissionDate: string;
  expirationDate: string;
  reservePercentage?: number;
};

export interface ExpenseRecordFromCSV {
  date: string;
  type: ExpenseType;
  description: string;
  usdAmount: string;
  exchangeRate: string;
  bolivarsAmount: string;
}

export interface OwnerFromCSV {
  apartment: string;
  aliquot: string;
  ci: string;
  name: string;
  outstandingDebtUsd: string;
  outstandingDebtBolivars: string;
  specialPaymentUsd: string;
  specialPaymentBolivars: string;
}

export class Amount {
  usd: number = 0;
  bolivars: number = 0;
}

export class ExpenseRecord {
  date: string = "";
  type: ExpenseType;
  description: string = "";
  amount: Amount = {
    usd: 0,
    bolivars: 0,
  };

  constructor(data: ExpenseRecordFromCSV) {
    this.date = data.date;
    this.type = data.type;
    this.description = data.description;

    try {
      const usdAmount = Number(
        data.usdAmount.replace("$", "").replace(",", "")
      );
      const bolivarsAmount = Number(
        data.bolivarsAmount.replace("Bs", "").replace(",", "")
      );
      this.amount = {
        usd: usdAmount,
        bolivars: bolivarsAmount,
      };
    } catch (error) {
      console.error("Error parsing expense amounts", error);
    }
  }
}

export class ExpenseRecordWithOwnerData extends ExpenseRecord {
  ownerAmount = new Amount();
  constructor(data: ExpenseRecordFromCSV, ownerAliquot: number) {
    super(data);
    this.ownerAmount = {
      usd: this.amount.usd * ownerAliquot,
      bolivars: this.amount.bolivars * ownerAliquot,
    };
  }
}

export interface ExpenseTypeGroup {
  type: ExpenseType;
  records: ExpenseRecordWithOwnerData[];
  groupTotalAmount: Amount;
  ownerGroupTotalAmount: Amount;
}

export interface ExpenseTypeRecord {
  [key: string]: ExpenseRecordWithOwnerData[];
}

export class Owner {
  apartment: string = "";
  name: string = "";
  aliquot: number = 0;
  specialPayment: Amount = new Amount();
  outstandingDebt: Amount = new Amount();

  constructor(data: OwnerFromCSV) {
    try {
      this.apartment = data.apartment;
      this.name = data.name;
      this.aliquot =
        Number(data.aliquot.replace("%", "").replace(",", "")) / 100;
      this.specialPayment = {
        usd: Number(data.specialPaymentUsd.replace("$", "").replace(",", "")),
        bolivars: Number(
          data.specialPaymentBolivars.replace("Bs", "").replace(",", "")
        ),
      };
      this.outstandingDebt = {
        usd: Number(data.outstandingDebtUsd.replace("$", "").replace(",", "")),
        bolivars: Number(
          data.outstandingDebtBolivars.replace("Bs", "").replace(",", "")
        ),
      };
    } catch (error) {
      console.error("Error parsing owner amounts", error);
    }
  }
}

export class OwnerExpenses extends Owner {
  baseAmountToPay: Amount;
  reserveAmount: Amount;
  monthPaymentAmount: Amount;
  totalAmountToPay: Amount;
  reservePercentage: number = 0.1;

  constructor(data: OwnerFromCSV, reservePercentage?: number) {
    super(data);
    this.baseAmountToPay = new Amount();
    this.reserveAmount = new Amount();
    this.monthPaymentAmount = new Amount();
    this.totalAmountToPay = new Amount();
    this.reservePercentage = reservePercentage ?? this.reservePercentage;
  }

  /** Add expense to the owner and multiply by it's aliquot, you should add the full amount of each expense here. */
  addExpense(amount: Amount) {
    this.baseAmountToPay.usd += amount.usd * this.aliquot;
    this.baseAmountToPay.bolivars += amount.bolivars * this.aliquot;
  }

  /** Calculate total amount to pay, reserve amount and total amount to pay */
  calculateTotalAmountToPay() {
    if (this.baseAmountToPay.usd === 0 || this.baseAmountToPay.bolivars === 0) {
      throw new Error(`Owner ${this.name} has no expenses`);
    }

    // Reserve
    this.reserveAmount.usd = this.baseAmountToPay.usd * this.reservePercentage;
    this.reserveAmount.bolivars =
      this.baseAmountToPay.bolivars * this.reservePercentage;

    // Total month payment (base amount + reserve )
    this.monthPaymentAmount.usd =
      this.baseAmountToPay.usd + this.reserveAmount.usd;
    this.monthPaymentAmount.bolivars =
      this.baseAmountToPay.bolivars + this.reserveAmount.bolivars;

    // Total amount to pay (base amount + special payment + reserve + outstanding debt)
    this.totalAmountToPay.usd =
      this.baseAmountToPay.usd +
      this.specialPayment.usd +
      this.reserveAmount.usd +
      this.outstandingDebt.usd;
    this.totalAmountToPay.bolivars =
      this.baseAmountToPay.bolivars +
      this.specialPayment.bolivars +
      this.reserveAmount.bolivars +
      this.outstandingDebt.bolivars;
  }
}

export class ExpensesTableData {
  owner: OwnerExpenses;
  reservePercentage: number;
  dollarPrice: number;

  // Dates
  currentMonth: string = "";
  emissionDate: string = "";
  expirationDate: string = "";

  // Amounts
  totalAmount: Amount = new Amount();
  reserveAmount: Amount = new Amount();

  // List of expenses ordered by type
  types: ExpenseTypeGroup[] = [];
  expensesRecords: ExpenseTypeRecord = {};

  constructor(ownerData: OwnerFromCSV, cliInputs: CLIInputs) {
    this.handleDates(cliInputs.emissionDate, cliInputs.expirationDate);
    this.reservePercentage = cliInputs.reservePercentage ?? 0.1;
    this.owner = new OwnerExpenses(ownerData, this.reservePercentage);
    this.dollarPrice = cliInputs.dollarPrice;

    // Calcular reserva
    this.reserveAmount.usd = this.totalAmount.usd * this.reservePercentage;
    this.reserveAmount.bolivars =
      this.totalAmount.bolivars * this.reservePercentage;
  }

  private handleDates(emissionDate: string, expirationDate: string) {
    this.currentMonth = new Date(emissionDate).toLocaleString("es-ES", {
      month: "long",
      year: "numeric",
    });
    this.emissionDate = format(emissionDate, "dd/MM/yyyy");
    this.expirationDate = format(expirationDate, "dd/MM/yyyy");
  }

  private convertTypesToSortedArray() {
    if (this.owner == null) {
      throw new Error("Owner is null");
    }
    Object.values(ExpenseType).forEach((type) => {
      this.types.push({
        type,
        records: this.expensesRecords[type],
        groupTotalAmount: {
          usd: this.expensesRecords[type].reduce(
            (total, expense) => total + expense.amount.usd,
            0
          ),
          bolivars: this.expensesRecords[type].reduce(
            (total, expense) => total + expense.amount.bolivars,
            0
          ),
        },
        ownerGroupTotalAmount: {
          usd: this.expensesRecords[type].reduce(
            (total, expense) => total + expense.ownerAmount.usd,
            0
          ),
          bolivars: this.expensesRecords[type].reduce(
            (total, expense) => total + expense.ownerAmount.bolivars,
            0
          ),
        },
      });
    });
  }

  addExpenses(expenses: ExpenseRecordFromCSV[]) {
    if (this.owner == null) {
      throw new Error("Owner is null");
    }

    expenses.forEach((expense) => {
      const expenseRecord = new ExpenseRecordWithOwnerData(
        expense,
        this.owner.aliquot
      );

      if (!this.expensesRecords[expense.type]) {
        this.expensesRecords[expense.type] = [];
      }

      this.owner.addExpense(expenseRecord.amount);
      this.expensesRecords[expense.type].push(expenseRecord);
    });
  }

  calculateTotalAmount() {
    this.convertTypesToSortedArray();

    if (this.owner == null) {
      throw new Error("Owner is null");
    }
    this.totalAmount.usd = this.types.reduce(
      (total, type) => total + type.groupTotalAmount.usd,
      0
    );
    this.totalAmount.bolivars = this.types.reduce(
      (total, type) => total + type.groupTotalAmount.bolivars,
      0
    );

    this.reserveAmount.usd = this.totalAmount.usd * this.reservePercentage;
    this.reserveAmount.bolivars =
      this.totalAmount.bolivars * this.reservePercentage;

    this.owner.calculateTotalAmountToPay();
  }
}
