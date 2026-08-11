import { toNumber, toWon } from "@/lib/money";
import type { AssetListItem } from "@/components/assets/asset-types";

type RawAsset = {
  id: string;
  type: AssetListItem["type"];
  name: string;
  institutionOrLocation: string | null;
  currency: string;
  fxRateToKrw: number | string | { toString(): string };
  currentValue: number | string | { toString(): string };
  debtValue: number | string | { toString(): string };
  monthlyIncome: number | string | { toString(): string };
  monthlyExpense: number | string | { toString(): string };
  memo: string | null;
  updatedAt: Date | string;
  realEstate: {
    address: string | null;
    purchasePrice: number | string | { toString(): string } | null;
    loanBalance: number | string | { toString(): string } | null;
    interestRate: number | string | { toString(): string } | null;
    leaseType: string | null;
    nextReviewDate: string | null;
  } | null;
  stock: {
    ticker: string;
    quantity: number | string | { toString(): string };
    averagePrice: number | string | { toString(): string };
    currentPrice: number | string | { toString(): string };
    sector: string | null;
  } | null;
  cash: {
    accountType: string;
    interestRate: number | string | { toString(): string } | null;
    maturityDate: string | null;
    isEmergencyFund: boolean;
  } | null;
  business: {
    ownershipRate: number | string | { toString(): string } | null;
    valuationBasis: string | null;
    liquidityGrade: string | null;
  } | null;
};

export function serializeAsset(asset: RawAsset): AssetListItem {
  return {
    id: asset.id,
    type: asset.type,
    name: asset.name,
    institutionOrLocation: asset.institutionOrLocation,
    currency: asset.currency,
    fxRateToKrw: toWon(asset.fxRateToKrw),
    currentValue: toWon(asset.currentValue),
    debtValue: toWon(asset.debtValue),
    monthlyIncome: toWon(asset.monthlyIncome),
    monthlyExpense: toWon(asset.monthlyExpense),
    memo: asset.memo,
    updatedAt:
      typeof asset.updatedAt === "string"
        ? asset.updatedAt
        : asset.updatedAt.toISOString(),
    realEstate: asset.realEstate
      ? {
          address: asset.realEstate.address,
          purchasePrice:
            asset.realEstate.purchasePrice == null
              ? null
              : toWon(asset.realEstate.purchasePrice),
          loanBalance:
            asset.realEstate.loanBalance == null
              ? null
              : toWon(asset.realEstate.loanBalance),
          interestRate:
            asset.realEstate.interestRate == null
              ? null
              : toNumber(asset.realEstate.interestRate),
          leaseType: asset.realEstate.leaseType,
          nextReviewDate: asset.realEstate.nextReviewDate,
        }
      : null,
    stock: asset.stock
      ? {
          ticker: asset.stock.ticker,
          quantity: Math.trunc(toNumber(asset.stock.quantity)),
          averagePrice: toWon(asset.stock.averagePrice),
          currentPrice: toWon(asset.stock.currentPrice),
          sector: asset.stock.sector,
        }
      : null,
    cash: asset.cash
      ? {
          accountType: asset.cash.accountType,
          interestRate:
            asset.cash.interestRate == null ? null : toNumber(asset.cash.interestRate),
          maturityDate: asset.cash.maturityDate,
          isEmergencyFund: asset.cash.isEmergencyFund,
        }
      : null,
    business: asset.business
      ? {
          ownershipRate:
            asset.business.ownershipRate == null
              ? null
              : toNumber(asset.business.ownershipRate),
          valuationBasis: asset.business.valuationBasis,
          liquidityGrade: asset.business.liquidityGrade,
        }
      : null,
  };
}
