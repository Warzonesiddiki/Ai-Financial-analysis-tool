
// types.ts
import React from 'react';

// --- SHARED & BASE TYPES ---

export interface KeyMetric {
    label: string;
    value: string;
    change?: number; // percentage change from prior period
    trend?: 'positive' | 'negative' | 'neutral';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  series?: string;
}
export interface Chart {
  type: 'bar' | 'pie' | 'line' | 'waterfall';
  title: string;
  data: ChartDataPoint[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface SectionAnalysis {
  headline: string;
  takeaways: string[];
  narrative: string;
  keyMetrics?: KeyMetric[];
  charts?: Chart[];
  sources?: GroundingSource[];
  confidence?: 'High' | 'Medium' | 'Low';
}

export interface ChatMessage {
    role: 'user' | 'model' | 'loading';
    content: string;
}

// --- COMPREHENSIVE FINANCIAL ANALYSIS TYPES ---

export interface SegmentData {
    id: string;
    name: string;
    revenue: string;
    profit: string;
}

export interface EsgData {
    co2Emissions: string; // in tonnes
    waterUsage: string; // in cubic meters
    employeeTurnover: string; // percentage
    genderDiversity: string; // percentage female/non-binary
}

export interface BudgetData {
    revenue: string;
    cogs: string;
    opex: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: string;
}

export interface PpeItem {
  id:string;
  description: string;
  cost: string;
  accumulatedDepreciation: string;
}

export interface IncomeStatementData {
  revenueSaleOfGoods: string;
  revenueServices: string;
  revenueRental: string;
  otherIncome: string;
  materialCost: string;
  directLabor: string;
  subcontractorCosts: string;
  directEquipmentCost: string;
  otherDirectCosts: string;
  staffSalariesAdmin: string;
  rentExpenseAdmin: string;
  utilities: string;
  marketingAdvertising: string;
  legalProfessionalFees: string;
  depreciationAmortization: string;
  incomeTaxExpense: string;
  otherGAndA: string;
}

export interface BalanceSheetData {
  bankAccounts: BankAccount[];
  cashAndBankBalances: string;
  accountsReceivable: string;
  inventory: string;
  prepayments: string;
  otherCurrentAssets: string;
  ppeSchedule: PpeItem[];
  propertyPlantEquipmentNet: string;
  intangibleAssets: string;
  investmentProperties: string;
  longTermInvestments: string;
  accountsPayable: string;
  accruedExpenses: string;
  shortTermLoans: string;
  currentPortionOfLTDebt: string;
  longTermLoans: string;
  leaseLiabilities: string;
  deferredTaxLiability: string;
  shareCapital: string;
  retainedEarnings: string;
  otherReserves: string;
}

export interface CashFlowData {
  netIncome: string;
  depreciationAmortization: string;
  changesInWorkingCapital: string;
  capitalExpenditures: string;
  saleOfAssets: string;
  issuanceOfDebt: string;
  repaymentOfDebt: string;
  issuanceOfEquity: string;
  dividendsPaid: string;
}

export interface PeriodData {
  periodLabel: string;
  incomeStatement: IncomeStatementData;
  balanceSheet: BalanceSheetData;
  cashFlow: CashFlowData;
  segments: SegmentData[];
  esg: EsgData;
  budget: BudgetData;
}

export interface ReportData {
  companyName: string;
  currency: string;
  periodType: 'Monthly' | 'Yearly';
  periods: PeriodData[];
  industries: string[];
  companyLogo?: string;
}

export interface ReportSection {
    id: string;
    name: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    analysis: SectionAnalysis;
}

export interface AINarrativeResponse {
  sections: ReportSection[];
  confidence: 'High' | 'Medium' | 'Low';
  dataProvenance: string;
}

// --- SaaS & SUBSCRIPTION ANALYSIS TYPES ---

export interface MrrData {
  new: string;
  expansion: string;
  contraction: string;
  churn: string;
}

export interface CustomersData {
  new: string;
  total: string;
}

export interface CacData {
  marketingSpend: string;
  salesSpend: string;
}

export interface SaaSPeriodData {
  periodLabel: string;
  mrr: MrrData;
  customers: CustomersData;
  cac: CacData;
}

export interface SaaSReportData {
  companyName: string;
  currency: string;
  periodType: 'Monthly' | 'Quarterly';
  periods: SaaSPeriodData[];
  industries: string[];
  averageContractLengthMonths: string;
  grossMarginPercentage: string;
  companyLogo?: string;
}

export interface SaaSReportSection extends ReportSection {}

export interface SaaSNarrativeResponse extends AINarrativeResponse {
  sections: SaaSReportSection[];
}

export const createInitialSaaSPeriod = (): SaaSPeriodData => ({
  periodLabel: `Q1 ${new Date().getFullYear()}`,
  mrr: { new: '', expansion: '', contraction: '', churn: '' },
  customers: { new: '', total: '' },
  cac: { marketingSpend: '', salesSpend: '' },
});

// --- UAE CONSTRUCTION ANALYSIS TYPES ---

export interface ProjectYearData {
  id: string;
  year: string;
  revenue: string;
  costOfSales: string;
  grossProfit: string;
}

export interface ProjectData {
  id: string;
  name: string;
  financials: ProjectYearData[];
  completionPercentage: string;
  totalContractValue: string;
  keyMilestoneOrRisk: string;
}

export interface UaeProjectReportData {
  companyName: string;
  currency: string;
  projects: ProjectData[];
  qualitativeContext?: string;
  forecastAssumptions: {
    forecastEnabled: boolean;
    revenueGrowthRate: string;
    expectedMargin: string;
  };
  companyLogo?: string;
}

export interface ForecastYear {
  year: number;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
}

export interface Subcontractor {
    id: string;
    name: string;
    contractValue: string;
}

export interface UaeConstructionSectionAnalysis extends SectionAnalysis {
    forecast?: ForecastYear[];
    subcontractors?: Subcontractor[];
}

export interface UaeConstructionReportSection extends ReportSection {
    analysis: UaeConstructionSectionAnalysis;
}

export interface UaeConstructionNarrativeResponse extends AINarrativeResponse {
  sections: UaeConstructionReportSection[];
}

export const createInitialProjectYear = (year: string): ProjectYearData => ({
  id: Date.now().toString(),
  year,
  revenue: '',
  costOfSales: '',
  grossProfit: '',
});

export const createInitialProject = (): ProjectData => ({
  id: Date.now().toString(),
  name: 'New Project',
  financials: [createInitialProjectYear(new Date().getFullYear().toString())],
  completionPercentage: '',
  totalContractValue: '',
  keyMilestoneOrRisk: '',
});

// --- PROFESSIONAL SERVICES ANALYSIS TYPES ---

export interface ServiceLineData {
    id: string;
    name: string;
    revenue: string;
    directCost: string;
}
export interface ClientData {
    id: string;
    name: string;
    revenue: string;
}
export interface ProfessionalServicesPeriodData {
    periodLabel: string;
    financials: {
        serviceRevenue: string;
        staffCosts: string;
        otherOpex: string;
    };
    team: {
        feeEarningStaff: string;
        totalBillableHours: string;
    };
    serviceLines: ServiceLineData[];
    clients: ClientData[];
}
export interface ProfessionalServicesReportData {
    companyName: string;
    currency: string;
    periods: ProfessionalServicesPeriodData[];
    companyLogo?: string;
}
export const createInitialProfessionalServicesPeriod = (): ProfessionalServicesPeriodData => ({
    periodLabel: new Date().getFullYear().toString(),
    financials: { serviceRevenue: '', staffCosts: '', otherOpex: '' },
    team: { feeEarningStaff: '', totalBillableHours: '' },
    serviceLines: [],
    clients: [],
});
export interface ProfessionalServicesReportSection extends ReportSection {}
export interface ProfessionalServicesNarrativeResponse extends AINarrativeResponse {
    sections: ProfessionalServicesReportSection[];
}

// --- AP/AR ANALYSIS TYPES ---

export interface InvoiceData {
    id: string;
    customerName: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: string;
}
export interface BillData {
    id: string;
    vendorName: string;
    billNumber: string;
    billDate: string;
    dueDate: string;
    amount: string;
}
export interface APARPeriodData {
    periodLabel: string; // As of date
    summary: {
        periodRevenue: string; // e.g., last 30 days
        periodCogs: string; // e.g., last 30 days
    };
    invoices: InvoiceData[];
    bills: BillData[];
}
export interface APARReportData {
    companyName: string;
    currency: string;
    periods: APARPeriodData[];
    companyLogo?: string;
}
export interface AgingBucket {
    bucket: string; // e.g., "0-30 Days"
    amount: number;
    percentage: number;
}
export interface APARSectionAnalysis extends SectionAnalysis {
    arAging?: AgingBucket[];
    apAging?: AgingBucket[];
}
export interface APARReportSection extends ReportSection {
    analysis: APARSectionAnalysis;
}
export interface APARNarrativeResponse extends AINarrativeResponse {
    sections: APARReportSection[];
}
export const createInitialAPARPeriod = (): APARPeriodData => ({
    periodLabel: new Date().toISOString().split('T')[0],
    summary: { periodRevenue: '', periodCogs: '' },
    invoices: [],
    bills: [],
});

// --- INVENTORY ANALYSIS TYPES ---

export interface InventoryItemData {
    id: string;
    sku: string;
    description: string;
    quantity: string;
    unitCost: string;
    last30DaysSales: string; // in units
}
export interface InventoryPeriodData {
    periodLabel: string; // As of date
    summary: {
        periodCogs: string; // e.g., last 12 months
        totalInventoryValue: string;
    };
    inventoryItems: InventoryItemData[];
}
export interface InventoryReportData {
    companyName: string;
    currency: string;
    periods: InventoryPeriodData[];
    companyLogo?: string;
}
export interface ABCAnalysisResult {
    sku: string;
    description: string;
    category: 'A' | 'B' | 'C';
    value: number;
    percentageOfTotalValue: number;
}
export interface InventoryRecommendation {
    sku: string;
    recommendation: string; // e.g., "Reorder", "Monitor", "Liquidate"
    reason: string;
}
export interface InventorySectionAnalysis extends SectionAnalysis {
    abcAnalysisResults?: ABCAnalysisResult[];
    inventoryRecommendations?: InventoryRecommendation[];
}
export interface InventoryReportSection extends ReportSection {
    analysis: InventorySectionAnalysis;
}
export interface InventoryNarrativeResponse extends AINarrativeResponse {
    sections: InventoryReportSection[];
}
export const createInitialInventoryPeriod = (): InventoryPeriodData => ({
    periodLabel: new Date().toISOString().split('T')[0],
    summary: { periodCogs: '', totalInventoryValue: '' },
    inventoryItems: [],
});

// --- HR & PAYROLL ANALYSIS TYPES ---

export interface HeadcountData {
    id: string;
    department: string;
    count: string;
}
export interface HrPeriodData {
    periodLabel: string;
    totalRevenue: string;
    headcount: {
        total: string;
        newHires: string;
        terminations: string;
        byDepartment: HeadcountData[];
    };
    payroll: {
        totalCost: string;
    };
    engagement: {
        eNPS: string;
    };
}
export interface HrReportData {
    companyName: string;
    currency: string;
    periodType: 'Monthly' | 'Quarterly';
    periods: HrPeriodData[];
    companyLogo?: string;
}
export interface HrReportSection extends ReportSection {}
export interface HrNarrativeResponse extends AINarrativeResponse {
    sections: HrReportSection[];
}
export const createInitialHrPeriod = (): HrPeriodData => ({
    periodLabel: `Q1 ${new Date().getFullYear()}`,
    totalRevenue: '',
    headcount: { total: '0', newHires: '', terminations: '', byDepartment: [] },
    payroll: { totalCost: '' },
    engagement: { eNPS: '' },
});

// --- CASH FLOW FORECAST TYPES ---
export interface CashInflowItem {
    id: string;
    name: string;
    amount: string;
    frequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
}
export interface CashOutflowItem extends CashInflowItem {}
export interface OneTimeCashEvent {
    id: string;
    name: string;
    amount: string; // can be negative
    date: string;
}
export interface CashFlowForecastPeriodData {
    periodLabel: string; // Start date
    startingBalance: string;
    recurringInflows: CashInflowItem[];
    recurringOutflows: CashOutflowItem[];
    oneTimeEvents: OneTimeCashEvent[];
}
export interface CashFlowForecastReportData {
    companyName: string;
    currency: string;
    periods: CashFlowForecastPeriodData[];
    companyLogo?: string;
}
export interface ForecastWeek {
    week: number;
    startDate: string;
    endDate: string;
    openingBalance: number;
    inflows: number;
    outflows: number;
    netCashFlow: number;
    closingBalance: number;
}
export interface CashFlowForecastSectionAnalysis extends SectionAnalysis {
    weeklyForecast?: ForecastWeek[];
}
export interface CashFlowForecastReportSection extends ReportSection {
    analysis: CashFlowForecastSectionAnalysis;
}
export interface CashFlowForecastNarrativeResponse extends AINarrativeResponse {
    sections: CashFlowForecastReportSection[];
}
export const createInitialCashFlowForecastPeriod = (): CashFlowForecastPeriodData => ({
    periodLabel: new Date().toISOString().split('T')[0],
    startingBalance: '',
    recurringInflows: [],
    recurringOutflows: [],
    oneTimeEvents: [],
});


// --- INITIAL STATE FACTORIES ---

export const createInitialPeriod = (): PeriodData => ({
  periodLabel: new Date().getFullYear().toString(),
  incomeStatement: {
    revenueSaleOfGoods: '', revenueServices: '', revenueRental: '', otherIncome: '',
    materialCost: '', directLabor: '', subcontractorCosts: '', directEquipmentCost: '', otherDirectCosts: '',
    staffSalariesAdmin: '', rentExpenseAdmin: '', utilities: '', marketingAdvertising: '', legalProfessionalFees: '', depreciationAmortization: '', incomeTaxExpense: '', otherGAndA: '',
  },
  balanceSheet: {
    bankAccounts: [], cashAndBankBalances: '', accountsReceivable: '', inventory: '', prepayments: '', otherCurrentAssets: '',
    ppeSchedule: [], propertyPlantEquipmentNet: '', intangibleAssets: '', investmentProperties: '', longTermInvestments: '',
    accountsPayable: '', accruedExpenses: '', shortTermLoans: '', currentPortionOfLTDebt: '', longTermLoans: '', leaseLiabilities: '', deferredTaxLiability: '',
    shareCapital: '', retainedEarnings: '', otherReserves: '',
  },
  cashFlow: {
    netIncome: '', depreciationAmortization: '', changesInWorkingCapital: '',
    capitalExpenditures: '', saleOfAssets: '',
    issuanceOfDebt: '', repaymentOfDebt: '', issuanceOfEquity: '', dividendsPaid: '',
  },
  segments: [],
  esg: { co2Emissions: '', waterUsage: '', employeeTurnover: '', genderDiversity: '' },
  budget: { revenue: '', cogs: '', opex: '' }
});

export const initialReportData: ReportData = {
    companyName: 'Phoenix G',
    currency: 'USD',
    periodType: 'Yearly',
    periods: [createInitialPeriod()],
    industries: [],
    companyLogo: '',
};
