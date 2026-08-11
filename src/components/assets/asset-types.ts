export type AssetListItem = {
  id: string;
  type: "REAL_ESTATE" | "STOCK" | "CASH" | "BUSINESS" | "OTHER";
  name: string;
  institutionOrLocation: string | null;
  currency: string;
  fxRateToKrw: number;
  currentValue: number;
  debtValue: number;
  monthlyIncome: number;
  monthlyExpense: number;
  memo: string | null;
  updatedAt: string | Date;
  realEstate: {
    address: string | null;
    purchasePrice: number | null;
    loanBalance: number | null;
    interestRate: number | string | null;
    leaseType: string | null;
    nextReviewDate: string | null;
  } | null;
  stock: {
    ticker: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    sector: string | null;
  } | null;
  cash: {
    accountType: string;
    interestRate: number | string | null;
    maturityDate: string | null;
    isEmergencyFund: boolean;
  } | null;
  business: {
    ownershipRate: number | string | null;
    valuationBasis: string | null;
    liquidityGrade: string | null;
  } | null;
};
