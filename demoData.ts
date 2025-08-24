import { 
    ReportData, PeriodData, createInitialPeriod
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
            budgetRevenue: 6370000, budgetCogs: 3756200, budgetOpex: 1811800,
            sharesOutstanding: 1000000,
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
            budgetRevenue: 7245909, budgetCogs: 4250000, budgetOpex: 1950000,
            sharesOutstanding: 1000000,
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
            budgetRevenue: 7922820, budgetCogs: 4630000, budgetOpex: 2183538,
            sharesOutstanding: 1100000,
        };
    }

    period.sharesOutstanding = String(values.sharesOutstanding);
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
    industries: ['Technology', 'SaaS'],
    scenario: {
        revenueGrowth: '10',
        cogsPercentage: '45',
        opexGrowth: '5',
        qualitativeAssumptions: 'Planning a major product launch in Q2. Entering the European market for the first time. Signed a significant new partnership that is expected to boost sales.',
    },
    marketValuation: '50000000',
    competitors: ['ServiceNow', 'Salesforce', 'Workday'],
};