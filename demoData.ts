
import { 
    ReportData, PeriodData, createInitialPeriod,
    SaaSReportData,
    UaeProjectReportData,
    ProfessionalServicesReportData,
    APARReportData,
    InventoryReportData,
    HrReportData,
    CashFlowForecastReportData
} from './types';

const createDemoPeriod = (label: string, prevPeriod?: PeriodData, isFirstPeriod: boolean = false): PeriodData => {
    const period = createInitialPeriod();
    period.periodLabel = label;

    let values;

    if (label === 'Jan 2024' || isFirstPeriod) {
        values = {
            revenueSaleOfGoods: 5000000, revenueServices: 1500000, otherIncome: 50000,
            materialCost: 2209523, directLabor: 1104761, subcontractorCosts: 184127, directEquipmentCost: 110476, otherDirectCosts: 73651,
            staffSalariesAdmin: 896875, rentExpenseAdmin: 269062, utilities: 89687, marketingAdvertising: 269062, legalProfessionalFees: 89687, otherGAndA: 179375,
            depreciationAmortization: 250000, incomeTaxExpense: 255457,
            cashAndBankBalances: 1250000 + 2000000, accountsReceivable: 982500, inventory: 945634, prepayments: 50000, otherCurrentAssets: 25000,
            propertyPlantEquipmentNet: 1500000 + 200000, intangibleAssets: 500000, investmentProperties: 0, longTermInvestments: 250000,
            accountsPayable: 680858, accruedExpenses: 150000, shortTermLoans: 0, currentPortionOfLTDebt: 200000, longTermLoans: 1000000, leaseLiabilities: 0, deferredTaxLiability: 80000,
            shareCapital: 2000000, retainedEarnings: 2845000, otherReserves: 100000,
            netIncome: 994404, changesInWorkingCapital: -150000, capitalExpenditures: -400000, saleOfAssets: 50000, issuanceOfDebt: 0, repaymentOfDebt: -200000, issuanceOfEquity: 100000, dividendsPaid: -100000,
            naRevenue: 3900000, naProfit: 646363, euRevenue: 2600000, euProfit: 348041,
            co2Emissions: 43367, waterUsage: 65500, employeeTurnover: 12, genderDiversity: 42,
            budgetRevenue: 6370000, budgetCogs: 3756200, budgetOpex: 1811800
        };
    } else if (label === 'Feb 2024') {
         values = { // Derived from Jan with growth
            revenueSaleOfGoods: 5500000, revenueServices: 1745455, otherIncome: 51000,
            materialCost: 2430475, directLabor: 1215237, subcontractorCosts: 202540, directEquipmentCost: 121524, otherDirectCosts: 81016,
            staffSalariesAdmin: 986562, rentExpenseAdmin: 295969, utilities: 98656, marketingAdvertising: 295969, legalProfessionalFees: 98656, otherGAndA: 197312,
            depreciationAmortization: 250000, incomeTaxExpense: 260000,
            cashAndBankBalances: 4000000, accountsReceivable: 1094318, inventory: 1050000, prepayments: 50000, otherCurrentAssets: 25000,
            propertyPlantEquipmentNet: 1800000, intangibleAssets: 500000, investmentProperties: 0, longTermInvestments: 250000,
            accountsPayable: 750000, accruedExpenses: 150000, shortTermLoans: 0, currentPortionOfLTDebt: 200000, longTermLoans: 1000000, leaseLiabilities: 300000, deferredTaxLiability: 80000,
            shareCapital: 2000000, retainedEarnings: 3845000, otherReserves: 100000,
            netIncome: 1050000, changesInWorkingCapital: -150000, capitalExpenditures: -400000, saleOfAssets: 0, issuanceOfDebt: 7406006, repaymentOfDebt: 0, issuanceOfEquity: 0, dividendsPaid: 0,
            naRevenue: 4347273, naProfit: 682500, euRevenue: 2900000, euProfit: 367500,
            co2Emissions: 48000, waterUsage: 72000, employeeTurnover: 11, genderDiversity: 43,
            budgetRevenue: 7245909, budgetCogs: 4250000, budgetOpex: 1950000
        };
    } else { // Mar 2024
         values = {
            revenueSaleOfGoods: 6200000, revenueServices: 1936538, otherIncome: 52000,
            materialCost: 2724976, directLabor: 1362488, subcontractorCosts: 227081, directEquipmentCost: 136249, otherDirectCosts: 90832,
            staffSalariesAdmin: 1080960, rentExpenseAdmin: 324288, utilities: 108096, marketingAdvertising: 324288, legalProfessionalFees: 108096, otherGAndA: 216192,
            depreciationAmortization: 250000, incomeTaxExpense: 289760,
            cashAndBankBalances: 4500000, accountsReceivable: 1220481, inventory: 1136431, prepayments: 50000, otherCurrentAssets: 25000,
            propertyPlantEquipmentNet: 1950000, intangibleAssets: 500000, investmentProperties: 0, longTermInvestments: 250000,
            accountsPayable: 820000, accruedExpenses: 150000, shortTermLoans: 0, currentPortionOfLTDebt: 200000, longTermLoans: 1000000, leaseLiabilities: 300000, deferredTaxLiability: 80000,
            shareCapital: 2000000, retainedEarnings: 4987071, otherReserves: 100000,
            netIncome: 1142071, changesInWorkingCapital: -150000, capitalExpenditures: -400000, saleOfAssets: 0, issuanceOfDebt: 0, issuanceOfEquity: 1090051, dividendsPaid: 0,
            naRevenue: 4850711, naProfit: 708386, euRevenue: 3233807, euProfit: 381581,
            co2Emissions: 53397, waterUsage: 79845, employeeTurnover: 11, genderDiversity: 43,
            budgetRevenue: 7922820, budgetCogs: 4630000, budgetOpex: 2183538
        };
    }

    period.incomeStatement = {
        revenueSaleOfGoods: String(values.revenueSaleOfGoods), revenueServices: String(values.revenueServices), revenueRental: '0', otherIncome: String(values.otherIncome),
        materialCost: String(values.materialCost), directLabor: String(values.directLabor), subcontractorCosts: String(values.subcontractorCosts), directEquipmentCost: String(values.directEquipmentCost), otherDirectCosts: String(values.otherDirectCosts),
        staffSalariesAdmin: String(values.staffSalariesAdmin), rentExpenseAdmin: String(values.rentExpenseAdmin), utilities: String(values.utilities), marketingAdvertising: String(values.marketingAdvertising), legalProfessionalFees: String(values.legalProfessionalFees),
        depreciationAmortization: String(values.depreciationAmortization), otherGAndA: String(values.otherGAndA), incomeTaxExpense: String(values.incomeTaxExpense),
    };

    period.balanceSheet = {
        bankAccounts: [], cashAndBankBalances: String(values.cashAndBankBalances), accountsReceivable: String(values.accountsReceivable), inventory: String(values.inventory), prepayments: String(values.prepayments), otherCurrentAssets: String(values.otherCurrentAssets),
        ppeSchedule: [], propertyPlantEquipmentNet: String(values.propertyPlantEquipmentNet), intangibleAssets: String(values.intangibleAssets), investmentProperties: String(values.investmentProperties), longTermInvestments: String(values.longTermInvestments),
        accountsPayable: String(values.accountsPayable), accruedExpenses: String(values.accruedExpenses), shortTermLoans: String(values.shortTermLoans), currentPortionOfLTDebt: String(values.currentPortionOfLTDebt),
        longTermLoans: String(values.longTermLoans), leaseLiabilities: String(values.leaseLiabilities), deferredTaxLiability: String(values.deferredTaxLiability),
        shareCapital: String(values.shareCapital), retainedEarnings: String(values.retainedEarnings), otherReserves: String(values.otherReserves),
    };
    
    period.cashFlow = {
        netIncome: String(values.netIncome), depreciationAmortization: String(values.depreciationAmortization), changesInWorkingCapital: String(values.changesInWorkingCapital),
        capitalExpenditures: String(values.capitalExpenditures), saleOfAssets: String(values.saleOfAssets),
        issuanceOfDebt: String(values.issuanceOfDebt), repaymentOfDebt: String(values.repaymentOfDebt), issuanceOfEquity: String(values.issuanceOfEquity), dividendsPaid: String(values.dividendsPaid),
    };

    period.segments = [
        { id: '1', name: 'North America', revenue: String(values.naRevenue), profit: String(values.naProfit)},
        { id: '2', name: 'Europe', revenue: String(values.euRevenue), profit: String(values.euProfit)},
    ];

    period.esg = {
        co2Emissions: String(values.co2Emissions), waterUsage: String(values.waterUsage),
        employeeTurnover: String(values.employeeTurnover), genderDiversity: String(values.genderDiversity),
    };

    period.budget = {
        revenue: String(values.budgetRevenue), cogs: String(values.budgetCogs), opex: String(values.budgetOpex),
    };
    
    return period;
};

const p1 = createDemoPeriod('Jan 2024', undefined, true);
const p2 = createDemoPeriod('Feb 2024', p1);
const p3 = createDemoPeriod('Mar 2024', p2);

export const demoReportData: ReportData = {
    companyName: 'InnovateX Inc.',
    currency: 'USD',
    periodType: 'Monthly',
    periods: [p1, p2, p3],
    industries: ['Technology', 'SaaS']
};

// --- DEMO DATA FOR OTHER MODULES ---

// SaaS Demo Data
export const demoSaaSReportData: SaaSReportData = {
    companyName: 'CloudFlow Analytics',
    currency: 'USD',
    periodType: 'Quarterly',
    periods: [
        { periodLabel: 'Q4 2023', mrr: { new: '120000', expansion: '30000', contraction: '5000', churn: '10000' }, customers: { new: '50', total: '450' }, cac: { marketingSpend: '80000', salesSpend: '120000' } },
        { periodLabel: 'Q1 2024', mrr: { new: '150000', expansion: '40000', contraction: '7000', churn: '12000' }, customers: { new: '60', total: '500' }, cac: { marketingSpend: '100000', salesSpend: '150000' } },
        { periodLabel: 'Q2 2024', mrr: { new: '180000', expansion: '50000', contraction: '8000', churn: '15000' }, customers: { new: '70', total: '550' }, cac: { marketingSpend: '120000', salesSpend: '180000' } }
    ],
    industries: ['SaaS', 'B2B Software'],
    averageContractLengthMonths: '12',
    grossMarginPercentage: '80',
};

// UAE Construction Demo Data
export const demoUaeConstructionReportData: UaeProjectReportData = {
    companyName: 'Arabian Gulf Construction',
    currency: 'AED',
    projects: [
        { id: '1', name: 'Jumeirah Skyscraper', financials: [{ id: 'y1', year: '2023', revenue: '50000000', costOfSales: '40000000', grossProfit: '10000000' }, { id: 'y2', year: '2022', revenue: '25000000', costOfSales: '21000000', grossProfit: '4000000' }], completionPercentage: "60", totalContractValue: "100000000", keyMilestoneOrRisk: "Core structure completed. Cladding is next major milestone." },
        { id: '2', name: 'Marina Residences', financials: [{ id: 'y3', year: '2023', revenue: '30000000', costOfSales: '26000000', grossProfit: '4000000' }], completionPercentage: "20", totalContractValue: "150000000", keyMilestoneOrRisk: "Foundation work is underway. Potential delays due to soil conditions." },
    ],
    forecastAssumptions: { forecastEnabled: true, revenueGrowthRate: '15', expectedMargin: '18' },
};

// Professional Services Demo Data
export const demoProfessionalServicesReportData: ProfessionalServicesReportData = {
    companyName: 'MENA Advisory Partners',
    currency: 'AED',
    periods: [
        { periodLabel: '2022', financials: { serviceRevenue: '25000000', staffCosts: '15000000', otherOpex: '5000000' }, team: { feeEarningStaff: '100', totalBillableHours: '160000' }, serviceLines: [{ id: 'sl1', name: 'Audit', revenue: '10000000', directCost: '6000000' }, { id: 'sl2', name: 'Tax', revenue: '8000000', directCost: '4500000' }, { id: 'sl3', name: 'Advisory', revenue: '7000000', directCost: '4000000' }], clients: [{ id: 'c1', name: 'Client A', revenue: '5000000' }, { id: 'c2', name: 'Client B', revenue: '3000000' }] },
        { periodLabel: '2023', financials: { serviceRevenue: '30000000', staffCosts: '17000000', otherOpex: '6000000' }, team: { feeEarningStaff: '120', totalBillableHours: '190000' }, serviceLines: [{ id: 'sl1', name: 'Audit', revenue: '12000000', directCost: '7000000' }, { id: 'sl2', name: 'Tax', revenue: '9000000', directCost: '5000000' }, { id: 'sl3', name: 'Advisory', revenue: '9000000', directCost: '4500000' }], clients: [{ id: 'c1', name: 'Client A', revenue: '6000000' }, { id: 'c2', name: 'Client B', revenue: '4000000' }] }
    ]
};

// AP/AR Demo Data
export const demoAPARReportData: APARReportData = {
    companyName: 'General Trading LLC',
    currency: 'USD',
    periods: [{
        periodLabel: new Date().toISOString().split('T')[0],
        summary: { periodRevenue: '500000', periodCogs: '350000' },
        invoices: [{ id: '1', customerName: 'Customer A', invoiceNumber: 'INV-001', invoiceDate: '2024-05-15', dueDate: '2024-06-14', amount: '50000' }, { id: '2', customerName: 'Customer B', invoiceNumber: 'INV-002', invoiceDate: '2024-04-10', dueDate: '2024-05-10', amount: '30000' }],
        bills: [{ id: '3', vendorName: 'Vendor X', billNumber: 'BILL-101', billDate: '2024-05-20', dueDate: '2024-06-19', amount: '25000' }, { id: '4', vendorName: 'Vendor Y', billNumber: 'BILL-102', billDate: '2024-05-01', dueDate: '2024-05-31', amount: '15000' }],
    }]
};

// Inventory Demo Data
export const demoInventoryReportData: InventoryReportData = {
    companyName: 'E-Commerce Retail Co',
    currency: 'USD',
    periods: [{
        periodLabel: new Date().toISOString().split('T')[0],
        summary: { periodCogs: '2400000', totalInventoryValue: '400000' },
        inventoryItems: [
            { id: '1', sku: 'PROD-A', description: 'Premium Product A', quantity: '100', unitCost: '500', last30DaysSales: '50' },
            { id: '2', sku: 'PROD-B', description: 'Standard Product B', quantity: '1000', unitCost: '50', last30DaysSales: '800' },
            { id: '3', sku: 'PROD-C', description: 'Low-cost Product C', quantity: '5000', unitCost: '5', last30DaysSales: '3000' },
            { id: '4', sku: 'PROD-D', description: 'Obsolete Product D', quantity: '200', unitCost: '100', last30DaysSales: '5' }
        ]
    }]
};

// HR Demo Data
export const demoHrReportData: HrReportData = {
    companyName: 'Tech Innovators Inc.',
    currency: 'USD',
    periodType: 'Quarterly',
    periods: [
        { periodLabel: 'Q1 2024', totalRevenue: '5000000', headcount: { total: '105', newHires: '10', terminations: '5', byDepartment: [{ id: 'd1', department: 'Engineering', count: '60' }, { id: 'd2', department: 'Sales', count: '25' }, { id: 'd3', department: 'G&A', count: '20' }] }, payroll: { totalCost: '1500000' }, engagement: { eNPS: '45' } },
        { periodLabel: 'Q2 2024', totalRevenue: '5500000', headcount: { total: '110', newHires: '8', terminations: '3', byDepartment: [{ id: 'd1', department: 'Engineering', count: '65' }, { id: 'd2', department: 'Sales', count: '25' }, { id: 'd3', department: 'G&A', count: '20' }] }, payroll: { totalCost: '1600000' }, engagement: { eNPS: '50' } }
    ]
};

// Cash Flow Forecast Demo Data
export const demoCashFlowForecastReportData: CashFlowForecastReportData = {
    companyName: 'Startup Solutions',
    currency: 'USD',
    periods: [{
        periodLabel: new Date().toISOString().split('T')[0],
        startingBalance: '250000',
        recurringInflows: [{ id: '1', name: 'Subscription Revenue', amount: '80000', frequency: 'Monthly' }],
        recurringOutflows: [{ id: '2', name: 'Payroll', amount: '40000', frequency: 'Bi-Weekly' }, { id: '3', name: 'Rent', amount: '10000', frequency: 'Monthly' }],
        oneTimeEvents: [{ id: '4', name: 'Server Purchase', amount: '-15000', date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0] }]
    }]
};
