import { z } from "zod";
import {
  ACTION_SOURCES,
  ACTION_STATUSES,
  ASSET_TYPES,
  CALENDAR_TYPES,
  INVESTMENT_HORIZONS,
  PREFERRED_ACTIVITIES,
  RISK_LEVELS,
} from "@/domain/enums";

/** 원(또는 통화 단위) 정수 */
const wonInt = z.coerce.number().int().min(0);
const wonIntSigned = z.coerce.number().int();

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일은 YYYY-MM-DD 형식이어야 합니다.")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d.getFullYear() >= 1900 && d <= new Date();
  }, "유효한 생년월일을 입력하세요.");

const birthTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "출생 시각은 HH:MM 형식이어야 합니다.")
  .optional()
  .nullable();

export const profileSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  calendarType: z.enum(CALENDAR_TYPES),
  birthDate: birthDateSchema,
  birthTime: birthTimeSchema,
  timezone: z.string().min(1).default("Asia/Seoul"),
  riskLevel: z.enum(RISK_LEVELS),
  goal: z.string().min(1, "재물 목표를 입력하세요."),
  monthlyExpense: wonInt.min(1, "월 생활비를 입력하세요."),
  preferredActivity: z.enum(PREFERRED_ACTIVITIES).default("LEARNING"),
  investmentHorizon: z.enum(INVESTMENT_HORIZONS).default("Y3_TO_7"),
  maskDefault: z.boolean().optional(),
});

export const onboardingCompleteSchema = profileSchema.extend({
  birthTimeUnknown: z.boolean().default(false),
}).superRefine((val, ctx) => {
  if (!val.birthTimeUnknown && !val.birthTime) {
    ctx.addIssue({
      code: "custom",
      path: ["birthTime"],
      message: "출생 시각을 입력하거나 ‘모름’을 선택하세요.",
    });
  }
});

export const assetBaseSchema = z.object({
  type: z.enum(ASSET_TYPES),
  name: z.string().min(1),
  institutionOrLocation: z.string().optional().nullable(),
  currency: z.string().default("KRW"),
  fxRateToKrw: z.coerce.number().int().positive().default(1),
  currentValue: wonInt,
  debtValue: wonInt.default(0),
  monthlyIncome: wonIntSigned.default(0),
  monthlyExpense: wonInt.default(0),
  memo: z.string().optional().nullable(),
});

export const realEstateSchema = z.object({
  address: z.string().optional().nullable(),
  purchasePrice: wonInt.optional().nullable(),
  loanBalance: wonInt.optional().nullable(),
  interestRate: z.coerce.number().optional().nullable(),
  leaseType: z.string().optional().nullable(),
  nextReviewDate: z.string().optional().nullable(),
});

export const stockSchema = z.object({
  ticker: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  averagePrice: wonInt,
  currentPrice: wonInt,
  sector: z.string().optional().nullable(),
});

export const cashSchema = z.object({
  accountType: z.string().min(1),
  interestRate: z.coerce.number().optional().nullable(),
  maturityDate: z.string().optional().nullable(),
  isEmergencyFund: z.boolean().default(false),
});

export const businessSchema = z.object({
  ownershipRate: z.coerce.number().optional().nullable(),
  valuationBasis: z.string().optional().nullable(),
  liquidityGrade: z.string().optional().nullable(),
});

export const createAssetSchema = assetBaseSchema.extend({
  realEstate: realEstateSchema.optional(),
  stock: stockSchema.optional(),
  cash: cashSchema.optional(),
  business: businessSchema.optional(),
});

export const updateAssetSchema = createAssetSchema.partial().extend({
  type: z.enum(ASSET_TYPES).optional(),
});

export const actionStatusSchema = z.object({
  status: z.enum(ACTION_STATUSES).optional(),
  memo: z.string().max(2000).optional().nullable(),
});

export const actionCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  reason: z.string().min(1),
  completionCriteria: z.string().optional().default(""),
  dueDate: z.string().optional().nullable(),
  status: z.enum(ACTION_STATUSES).default("TODO"),
  source: z.enum(ACTION_SOURCES).default("FINANCE"),
  dedupeKey: z.string().min(1),
  memo: z.string().max(2000).optional().nullable(),
});

export const fortuneGenerateSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
