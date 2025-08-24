import { 
    ReportData, PeriodData, Transaction, ChartOfAccount,
    createInitialPeriod, ReportAccountNode 
} from '../types';
import { calculateStatementOfCashFlows, buildAccountTree } from '../utils/financialUtils';

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const transformBookkeepingToReportData = (
    transactions: Transaction[],
    chartOfAccounts: ChartOfAccount[],
    companyName: string,
    currency: string
): ReportData => {
    
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedTxs.length === 0) {
        const emptyReport: ReportData = {
            companyName, currency, periodType: 'Monthly', periods: [createInitialPeriod()],
            industries: [], scenario: { revenueGrowth: '', cogsPercentage: '', opexGrowth: '' },
            marketValuation: '', competitors: [],
        };
        emptyReport.periods[0].periodLabel = "No Data";
        return emptyReport;
    }

    const txsByMonth: { [key: string]: Transaction[] } = {};
    sortedTxs.forEach(tx => {
        const monthKey = getMonthKey(new Date(tx.date));
        if (!txsByMonth[monthKey]) {
            txsByMonth[monthKey] = [];
        }
        txsByMonth[monthKey].push(tx);
    });

    const monthKeys = Object.keys(txsByMonth).sort();

    const periods: PeriodData[] = [];
    let cumulativeTransactions: Transaction[] = [];
    let lastRetainedEarnings = 0;

    for (const monthKey of monthKeys) {
        const [year, month] = monthKey.split('-').map(Number);
        const periodLabel = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
        
        const periodTxs = txsByMonth[monthKey];
        
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const period = createInitialPeriod();
        period.periodLabel = periodLabel;

        // --- Income Statement (for the period) ---
        const incomeTree = buildAccountTree(chartOfAccounts, periodTxs, ['Income']);
        const expenseTree = buildAccountTree(chartOfAccounts, periodTxs, ['Expense']);
        
        const getSumForAccount = (name: string, tree: ReportAccountNode[]): number => {
            let total = 0;
            const findAndSum = (nodes: ReportAccountNode[]) => {
                for (const node of nodes) {
                    if (node.name.toLowerCase().includes(name.toLowerCase())) {
                        total += node.total;
                    }
                    if(node.children) findAndSum(node.children);
                }
            }
            findAndSum(tree);
            return total;
        };
        
        const totalIncome = incomeTree.reduce((sum, node) => sum + node.total, 0);
        const totalExpense = expenseTree.reduce((sum, node) => sum + node.total, 0);
        const netIncomeForPeriod = totalIncome - totalExpense;

        period.incomeStatement.revenueServices = String(getSumForAccount('consulting', incomeTree));
        period.incomeStatement.revenueSaleOfGoods = String(getSumForAccount('sales', incomeTree));
        period.incomeStatement.otherGAndA = String(totalExpense); // Simplified
        
        // --- Balance Sheet (cumulative) ---
        cumulativeTransactions = [...cumulativeTransactions, ...periodTxs];
        const assetTree = buildAccountTree(chartOfAccounts, cumulativeTransactions, ['Asset']);
        const liabilityTree = buildAccountTree(chartOfAccounts, cumulativeTransactions, ['Liability']);
        const equityTree = buildAccountTree(chartOfAccounts, cumulativeTransactions, ['Equity']);

        period.balanceSheet.cashAndBankBalances = String(getSumForAccount('bank', assetTree));
        period.balanceSheet.accountsReceivable = String(getSumForAccount('receivable', assetTree));
        period.balanceSheet.inventory = String(getSumForAccount('inventory', assetTree));
        period.balanceSheet.accountsPayable = String(getSumForAccount('payable', liabilityTree));
        
        // Simplified Retained Earnings calculation
        lastRetainedEarnings += netIncomeForPeriod;
        period.balanceSheet.retainedEarnings = String(lastRetainedEarnings);
        const totalEquity = equityTree.reduce((sum, node) => sum + node.total, 0);
        period.balanceSheet.shareCapital = String(totalEquity - lastRetainedEarnings);


        // --- Cash Flow Statement (for the period) ---
        const scf = calculateStatementOfCashFlows(transactions, chartOfAccounts, startDate, endDate);
        period.cashFlow.netIncome = String(scf.netIncome);
        period.cashFlow.depreciationAmortization = String(scf.depreciationAndAmortization);
        period.cashFlow.changesInWorkingCapital = String(scf.changeInAccountsReceivable + scf.changeInInventory + scf.changeInAccountsPayable);
        period.cashFlow.capitalExpenditures = String(scf.cashFromInvesting);
        period.cashFlow.issuanceOfDebt = String(scf.cashFromFinancing);
        
        periods.push(period);
    }
    
    return {
        companyName,
        currency,
        periodType: 'Monthly',
        periods,
        industries: ["Technology"], 
        scenario: { revenueGrowth: '10', cogsPercentage: '45', opexGrowth: '5' },
        marketValuation: '0',
        competitors: [],
    };
};
