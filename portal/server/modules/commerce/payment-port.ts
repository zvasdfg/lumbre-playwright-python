export type PaymentScenario = "success" | "rejection";
export type PaymentOutcome = "approved" | "rejected";

export interface PaymentPort {
  charge(amount: number, scenario: PaymentScenario): Promise<PaymentOutcome>;
}

export const localFakePayment: PaymentPort = {
  async charge(_amount, scenario) {
    return scenario === "success" ? "approved" : "rejected";
  },
};
