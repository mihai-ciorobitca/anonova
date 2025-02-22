export interface Plan {
  name: string;
  price: number | null;
  annualPrice?: number;
  pricePerCredit: number;
  minimumCredits: number;
  includedCredits?: number;
  features: string[];
  popular?: boolean;
}
