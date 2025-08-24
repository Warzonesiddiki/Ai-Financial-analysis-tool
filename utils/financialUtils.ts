import { PeriodData, EsgData, ScenarioData, ChartOfAccount, Transaction, ReportAccountNode, AccountType, StatementOfCashFlowsData } from '../types';

export const safeParse = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

export const formatCurrency = (amount: number, parensForNegative = false) => {
    if (parensForNegative && amount < 0) {
        return `(${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(amount)).replace('$', '')})`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const buildAccountTree = (
    accounts: ChartOfAccount[],
    transactions: Transaction[],
    types: AccountType[],
    startDate?: Date,
    endDate?: Date,
): ReportAccountNode[] => {
    const relevantTransactions = transactions.filter(tx => {
        if (!startDate || !endDate) return true;
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });

    const amountByAccount: Record<string, number> = {};
    accounts.forEach(acc => amountByAccount[acc.id] = 0);
    relevantTransactions.forEach(tx => {
        amountByAccount[tx.accountId] = (amountByAccount[tx.accountId] || 0) + tx.amount;
    });

    const nodes: Record<string, ReportAccountNode> = {};
    const roots: ReportAccountNode[] = [];

    accounts
        .filter(acc => types.includes(acc.type) && !acc.isArchived)
        .forEach(acc => {
            nodes[acc.id] = { ...acc, children: [], total: 0, depth: 0 };
        });

    Object.values(nodes).forEach(node => {
        if (node.parentId && nodes[node.parentId]) {
            nodes[node.parentId].children.push(node);
        } else {
            roots.push(node);
        }
    });

    const calculateTotals = (node: ReportAccountNode): number => {
        const directAmount = amountByAccount[node.id] || 0;
        const childrenAmount = node.children.reduce((sum, child) => sum + calculateTotals(child), 0);
        node.total = directAmount + childrenAmount;
        // Invert for reporting presentation
        if (['Liability', 'Equity', 'Income'].includes(node.type)) {
            node.total = -node.total;
        }
        if (node.type === 'Expense') {
             // Expenses are negative in transactions, but we want to show them as positive in P&L
             node.total = -node.total;
        }

        return node.total;
    };
    roots.forEach(calculateTotals);

    const setDepth = (nodes: ReportAccountNode[], depth: number) => {
        nodes.forEach(node => {
            node.depth = depth;
            node.children.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));
            setDepth(node.children, depth + 1);
        });
    };
    roots.sort((a,b) => (a.accountNumber || '').localeCompare(b.accountNumber || ''));
    setDepth(roots, 0);

    return roots;
};


// --- Financial Analysis Suite utils ---

export const hasIncomeStatementData = (period: PeriodData): boolean => {
    const { incomeStatement } = period;
    const totalRevenue = safeParse(incomeStatement.revenueSaleOfGoods) + safeParse(incomeStatement.revenueServices) + safeParse(incomeStatement.revenueRental) + safeParse(incomeStatement.otherIncome);
    const totalExpenses = safeParse(incomeStatement.materialCost) + safeParse(incomeStatement.staffSalariesAdmin) + safeParse(incomeStatement.depreciationAmortization);
    return totalRevenue > 0 && totalExpenses > 0;
};

export const hasBalanceSheetData = (period: PeriodData): boolean => {
    const { balanceSheet } = period;
    const totalAssets = safeParse(balanceSheet.cashAndBankBalances) + safeParse(balanceSheet.accountsReceivable) + safeParse(balanceSheet.propertyPlantEquipmentNet);
    const totalLiabilitiesEquity = safeParse(balanceSheet.accountsPayable) + safeParse(balanceSheet.shareCapital) + safeParse(balanceSheet.retainedEarnings);
    return totalAssets > 0 && totalLiabilitiesEquity > 0;
};

export const hasCashFlowData = (period: PeriodData): boolean => {
    const { cashFlow } = period;
    return Object.values(cashFlow).some(val => safeParse(val) !== 0);
};

export const hasBudgetData = (period: PeriodData): boolean => {
    return safeParse(period.budget.revenue) > 0;
};

export const hasEsgData = (esg: EsgData): boolean => {
    return Object.values(esg).some(val => safeParse(val) > 0);
};

export const hasScenarioData = (scenario: ScenarioData): boolean => {
    return Object.values(scenario).some(val => safeParse(val) !== 0);
};

export const getSectionDependencies = (sectionId: string): ('pnl' | 'bs' | 'cf' | 'budget' | 'esg' | 'scenario' | 'market' | 'competitors')[] => {
    switch (sectionId) {
        case 'executive_summary': return ['pnl', 'bs', 'cf'];
        case 'profit_or_loss': return ['pnl'];
        case 'financial_position': return ['bs'];
        case 'cash_flows': return ['cf'];
        case 'common_size_analysis': return ['pnl', 'bs'];
        case 'dupont_analysis': return ['pnl', 'bs'];
        case 'key_ratios': return ['pnl', 'bs'];
        case 'scenario_analysis': return ['pnl', 'scenario'];
        case 'valuation_multiples': return ['pnl', 'bs', 'market'];
        case 'budget_vs_actuals': return ['pnl', 'budget'];
        case 'revenue_deep_dive': return ['pnl'];
        case 'cost_and_margin_analysis': return ['pnl'];
        case 'working_capital': return ['bs'];
        case 'debt_and_leverage': return ['pnl', 'bs'];
        case 'financial_risks': return ['pnl', 'bs', 'cf'];
        case 'esg_and_sustainability': return ['esg'];
        case 'competitor_benchmarking': return ['pnl', 'bs', 'competitors'];
        case 'report_methodology': return [];
        default: return [];
    }
};

// --- Bookkeeping Report Utils ---

const getAccountBalanceAsOf = (accountIds: string[], transactions: Transaction[], date: Date): number => {
    const relevantTxs = transactions.filter(tx => 
        accountIds.includes(tx.accountId) && new Date(tx.date) <= date
    );
    return relevantTxs.reduce((sum, tx) => sum + tx.amount, 0);
};

export const calculateStatementOfCashFlows = (
    transactions: Transaction[],
    chartOfAccounts: ChartOfAccount[],
    startDate: Date,
    endDate: Date
): StatementOfCashFlowsData => {
    const startOfPreviousDay = new Date(startDate);
    startOfPreviousDay.setDate(startOfPreviousDay.getDate() - 1);
    
    const getAccountIds = (types: AccountType[], nameIncludes?: string[], nameExcludes?: string[]) => {
        return chartOfAccounts
            .filter(acc => types.includes(acc.type))
            .filter(acc => nameIncludes ? nameIncludes.some(ni => acc.name.toLowerCase().includes(ni)) : true)
            .filter(acc => nameExcludes ? !nameExcludes.some(ne => acc.name.toLowerCase().includes(ne)) : true)
            .map(acc => acc.id);
    };

    const txsInPeriod = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= endDate;
    });

    // --- OPERATING ACTIVITIES ---
    const incomeAccounts = getAccountIds(['Income']);
    const expenseAccounts = getAccountIds(['Expense']);
    const totalIncome = txsInPeriod.filter(t => incomeAccounts.includes(t.accountId)).reduce((s, t) => s + t.amount, 0);
    const totalExpense = txsInPeriod.filter(t => expenseAccounts.includes(t.accountId)).reduce((s, t) => s + t.amount, 0);
    const netIncome = totalIncome + totalExpense;

    const deprAmmortIds = getAccountIds(['Expense'], ['depreciation', 'amortization']);
    const depreciationAndAmortization = -txsInPeriod.filter(t => deprAmmortIds.includes(t.accountId)).reduce((s, t) => s + t.amount, 0);

    const arIds = getAccountIds(['Asset'], ['receivable']);
    const invIds = getAccountIds(['Asset'], ['inventory']);
    const apIds = getAccountIds(['Liability'], ['payable']);
    
    const arStart = getAccountBalanceAsOf(arIds, transactions, startOfPreviousDay);
    const arEnd = getAccountBalanceAsOf(arIds, transactions, endDate);
    const changeInAccountsReceivable = -(arEnd - arStart);

    const invStart = getAccountBalanceAsOf(invIds, transactions, startOfPreviousDay);
    const invEnd = getAccountBalanceAsOf(invIds, transactions, endDate);
    const changeInInventory = -(invEnd - invStart);

    const apStart = getAccountBalanceAsOf(apIds, transactions, startOfPreviousDay);
    const apEnd = getAccountBalanceAsOf(apIds, transactions, endDate);
    const changeInAccountsPayable = (apEnd - apStart);

    const cashFromOperations = netIncome + depreciationAndAmortization + changeInAccountsReceivable + changeInInventory + changeInAccountsPayable;

    // --- INVESTING & FINANCING ACTIVITIES ---
    const cashAccountIds = getAccountIds(['Asset'], ['bank', 'cash']);
    const currentAssetIds = getAccountIds(['Asset'], ['receivable', 'inventory', 'prepayment']);
    const nonCashAssetIds = getAccountIds(['Asset']).filter(id => !cashAccountIds.includes(id));
    const investingAssetIds = nonCashAssetIds.filter(id => !currentAssetIds.includes(id));

    const cashFromInvesting = -txsInPeriod.filter(t => investingAssetIds.includes(t.accountId)).reduce((s, t) => s + t.amount, 0);
    
    const equityIds = getAccountIds(['Equity']);
    const liabilityIds = getAccountIds(['Liability']);
    const financingIds = [...equityIds, ...liabilityIds.filter(id => !apIds.includes(id))];
    const cashFromFinancing = txsInPeriod.filter(t => financingIds.includes(t.accountId)).reduce((s, t) => s + t.amount, 0);

    // --- SUMMARY ---
    const netChangeInCash = cashFromOperations + cashFromInvesting + cashFromFinancing;
    const startCash = getAccountBalanceAsOf(cashAccountIds, transactions, startOfPreviousDay);
    const endCash = getAccountBalanceAsOf(cashAccountIds, transactions, endDate);

    return {
        netIncome, depreciationAndAmortization, changeInAccountsReceivable,
        changeInInventory, changeInAccountsPayable, cashFromOperations,
        cashFromInvesting, cashFromFinancing, netChangeInCash, startCash, endCash
    };
};