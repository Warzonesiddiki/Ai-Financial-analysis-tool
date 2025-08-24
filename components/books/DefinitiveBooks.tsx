import React, { useMemo } from 'react';
import { Transaction, ChartOfAccount, CategorizationRule, ActivityLogEntry, Budgets, RecurringTransaction, Customer, Invoice, Vendor, Bill, BankTransaction, Product, InventoryItem, Employee, PayRun, AIAgent, AIPolicy, ApprovalWorkflow, PurchaseOrder, Entity, TaxCode, CurrencyExchangeRate, Location, StockTransfer, GoodsReceiptNote, PaymentRun } from '../../types';
import { TransactionLedger } from './TransactionLedger';
import { BooksDashboard } from './BooksDashboard';
import { ChartOfAccountsManager } from './ChartOfAccountsManager';
import { AIRulesManager } from './AIRulesManager';
import { AuditTrail } from './AuditTrail';
import { Reports } from './Reports';
import { BudgetsManager } from './BudgetsManager';
import { RecurringManager } from './RecurringManager';
import { Sales } from './Sales';
import { Purchases } from './Purchases';
import { Banking } from './Banking';
import { Inventory } from './Inventory';
import { Payroll } from './Payroll';
import { CashFlowForecast } from './CashFlowForecast';
import { AutomationCenter } from './automation/AutomationCenter';
import { EntityManagement } from './settings/EntityManagement';
import { TaxManagement } from './settings/TaxManagement';
import { CurrencySettings } from './settings/CurrencySettings';
import { AnalysisHub } from '../AnalysisHub';
import { transformBookkeepingToReportData } from '../../services/dataTransformer';

interface DefinitiveBooksProps {
    subView: string;
    navigateTo: (view: string) => void;
    openModal: (type: any, data?: any) => void;
    activeEntityId: string;
    entities: Entity[];
    taxCodes: TaxCode[];
    exchangeRates: CurrencyExchangeRate[];
    locations: Location[];
    stockTransfers: StockTransfer[];
    goodsReceiptNotes: GoodsReceiptNote[];
    paymentRuns: PaymentRun[];
    // All state and handlers are passed as props
    transactions: Transaction[];
    chartOfAccounts: ChartOfAccount[];
    rules: CategorizationRule[];
    activityLog: ActivityLogEntry[];
    budgets: Budgets;
    recurringTransactions: RecurringTransaction[];
    customers: Customer[];
    invoices: Invoice[];
    vendors: Vendor[];
    bills: Bill[];
    purchaseOrders: PurchaseOrder[];
    bankTransactions: BankTransaction[];
    products: Product[];
    inventory: InventoryItem[];
    employees: Employee[];
    payRuns: PayRun[];
    agents: AIAgent[];
    policies: AIPolicy[];
    approvalWorkflows: ApprovalWorkflow[];
    onUpdateAgent: (agentId: string, isActive: boolean) => void;
    onUpdatePolicy: (policyId: AIPolicy['id'], value: number) => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id' | 'entityId'>) => void;
    onUpdateTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
    onAddAccount: (account: Omit<ChartOfAccount, 'id'>) => void;
    onUpdateAccount: (account: ChartOfAccount) => void;
    onToggleArchive: (id: string) => void;
    onAddRule: (rule: Omit<CategorizationRule, 'id'>) => void;
    onDeleteRule: (id: string) => void;
    onSetBudgets: (newBudgets: Budgets) => void;
    onAddRecurring: (data: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'entityId'>) => void;
    onUpdateRecurring: (updated: RecurringTransaction) => void;
    onDeleteRecurring: (id: string) => void;
    onAddCustomer: (customer: Omit<Customer, 'id'| 'entityId'>) => void;
    onUpdateCustomer: (customer: Customer) => void;
    onDeleteCustomer: (id: string) => void;
    onAddInvoice: (invoice: Omit<Invoice, 'id' | 'entityId'>) => void;
    onUpdateInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
    onRecordInvoicePayment: (invoiceId: string, paymentAmount: number, paymentDate: string) => void;
    onAddVendor: (vendor: Omit<Vendor, 'id'| 'entityId'>) => void;
    onUpdateVendor: (vendor: Vendor) => void;
    onDeleteVendor: (id: string) => void;
    onAddBill: (bill: Omit<Bill, 'id' | 'entityId'>) => void;
    onUpdateBill: (bill: Bill) => void;
    onDeleteBill: (id: string) => void;
    onBillApproval: (billId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
    onAddPaymentRun: (billIds: string[], paymentDate: string) => void;
    onProcessPaymentRun: (paymentRunId: string) => void;
    onAddPurchaseOrder: (po: Omit<PurchaseOrder, 'id'| 'entityId'>) => void;
    onUpdatePurchaseOrder: (po: PurchaseOrder) => void;
    onPOApproval: (poId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
    onAddProduct: (product: Omit<Product, 'id'| 'entityId'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onAdjustInventory: (productId: string, locationId: string, newQuantity: number, reason: string) => void;
    onAddEmployee: (employee: Omit<Employee, 'id'| 'entityId'>) => void;
    onUpdateEmployee: (employee: Employee) => void;
    onDeleteEmployee: (id: string) => void;
    onApprovePayRun: (payRun: PayRun) => void;
    onMatchTransactions: (bankTxId: string, bookTxId: string) => void;
    onCreateAndMatchTransaction: (bankTx: BankTransaction, newBookTxData: Omit<Transaction, 'id' | 'reconciliationStatus' | 'matchedBankTxId'| 'entityId' | 'currency' | 'exchangeRate' | 'baseCurrencyAmount'>) => void;
    onAddGoodsReceiptNote: (grn: Omit<GoodsReceiptNote, 'id' | 'entityId'>) => void;
    
    // For Analysis Hub
    onGenerateFromBooks: (data: any) => void;
    isAnalysisLoading: boolean;
}

export const DefinitiveBooks: React.FC<DefinitiveBooksProps> = (props) => {
    const { subView, navigateTo, openModal, activeEntityId, ...rest } = props;
    
    const visibleEntityIds = useMemo(() => {
        const getDescendantEntityIds = (entityId: string): string[] => {
            const descendants = [entityId];
            const children = rest.entities.filter(e => e.parentId === entityId);
            children.forEach(child => {
                descendants.push(...getDescendantEntityIds(child.id));
            });
            return descendants;
        };
        return getDescendantEntityIds(activeEntityId);
    }, [activeEntityId, rest.entities]);
    
    const filteredProps = useMemo(() => {
        const filterByEntity = <T extends { entityId: string }>(items: T[]): T[] => {
            return items.filter(item => visibleEntityIds.includes(item.entityId));
        };
        return {
            transactions: filterByEntity(rest.transactions),
            customers: filterByEntity(rest.customers),
            invoices: filterByEntity(rest.invoices),
            vendors: filterByEntity(rest.vendors),
            bills: filterByEntity(rest.bills),
            purchaseOrders: filterByEntity(rest.purchaseOrders),
            products: filterByEntity(rest.products),
            employees: filterByEntity(rest.employees),
            payRuns: filterByEntity(rest.payRuns),
            recurringTransactions: filterByEntity(rest.recurringTransactions),
            locations: filterByEntity(rest.locations),
            stockTransfers: filterByEntity(rest.stockTransfers),
            goodsReceiptNotes: filterByEntity(rest.goodsReceiptNotes),
            paymentRuns: filterByEntity(rest.paymentRuns),
        };
    }, [visibleEntityIds, rest]);

    const handleGenerateAnalysis = () => {
        const activeEntity = rest.entities.find(e => e.id === activeEntityId);
        const reportData = transformBookkeepingToReportData(
            filteredProps.transactions,
            rest.chartOfAccounts,
            activeEntity?.name || 'Company',
            activeEntity?.currency || 'USD'
        );
        rest.onGenerateFromBooks(reportData);
    };

    const renderContent = () => {
        switch (subView) {
            // Bookkeeping
            case 'dashboard': return <BooksDashboard {...filteredProps} {...rest} navigateTo={navigateTo} openModal={openModal} />;
            case 'analysis_hub': return <AnalysisHub onGenerate={handleGenerateAnalysis} isLoading={rest.isAnalysisLoading} companyName={rest.entities.find(e => e.id === activeEntityId)?.name || ''} />;
            case 'automation': return <AutomationCenter agents={rest.agents} policies={rest.policies} approvalWorkflows={rest.approvalWorkflows} onUpdateAgent={rest.onUpdateAgent} onUpdatePolicy={rest.onUpdatePolicy} />;
            case 'banking': return <Banking 
                bankTransactions={rest.bankTransactions} 
                allBookTransactions={rest.transactions} // Reconciliation needs all book txs
                chartOfAccounts={rest.chartOfAccounts} 
                onMatchTransactions={rest.onMatchTransactions}
                onCreateAndMatchTransaction={rest.onCreateAndMatchTransaction}
            />;
            case 'sales': return <Sales 
                invoices={filteredProps.invoices} 
                customers={filteredProps.customers} 
                products={filteredProps.products} 
                taxCodes={rest.taxCodes}
                onDeleteCustomer={rest.onDeleteCustomer} 
                onDeleteInvoice={rest.onDeleteInvoice}
                openModal={openModal}
            />;
            case 'purchases': return <Purchases 
                bills={filteredProps.bills} 
                purchaseOrders={filteredProps.purchaseOrders}
                vendors={filteredProps.vendors} 
                chartOfAccounts={rest.chartOfAccounts} 
                products={filteredProps.products} 
                taxCodes={rest.taxCodes}
                paymentRuns={filteredProps.paymentRuns}
                onDeleteVendor={rest.onDeleteVendor} 
                onDeleteBill={rest.onDeleteBill}
                onUpdateBill={rest.onUpdateBill}
                onBillApproval={rest.onBillApproval}
                onPOApproval={rest.onPOApproval}
                onAddPaymentRun={rest.onAddPaymentRun}
                onProcessPaymentRun={rest.onProcessPaymentRun}
                openModal={openModal}
            />;
            case 'payroll': return <Payroll employees={filteredProps.employees} payRuns={filteredProps.payRuns} onAddEmployee={rest.onAddEmployee} onUpdateEmployee={rest.onUpdateEmployee} onDeleteEmployee={rest.onDeleteEmployee} onApprovePayRun={rest.onApprovePayRun} openModal={openModal} activeEntityId={activeEntityId} />;
            case 'inventory': return <Inventory 
                products={filteredProps.products} 
                inventory={rest.inventory} // Full inventory list for context
                locations={filteredProps.locations}
                stockTransfers={filteredProps.stockTransfers}
                goodsReceiptNotes={filteredProps.goodsReceiptNotes}
                purchaseOrders={filteredProps.purchaseOrders}
                onAddProduct={rest.onAddProduct} 
                onUpdateProduct={rest.onUpdateProduct} 
                onDeleteProduct={rest.onDeleteProduct} 
                onAdjustInventory={rest.onAdjustInventory} 
                openModal={openModal} 
            />;
            case 'forecast': return <CashFlowForecast 
                transactions={filteredProps.transactions}
                chartOfAccounts={rest.chartOfAccounts}
                invoices={filteredProps.invoices}
                bills={filteredProps.bills}
                recurringTransactions={filteredProps.recurringTransactions}
            />;
            case 'transactions': return <TransactionLedger transactions={filteredProps.transactions} chartOfAccounts={rest.chartOfAccounts} rules={rest.rules} onAddTransaction={rest.onAddTransaction} onUpdateTransaction={rest.onUpdateTransaction} onDeleteTransaction={rest.onDeleteTransaction} onAddRule={rest.onAddRule} />;
            case 'accounts': return <ChartOfAccountsManager accounts={rest.chartOfAccounts} onAddAccount={rest.onAddAccount} onUpdateAccount={rest.onUpdateAccount} onToggleArchive={rest.onToggleArchive} />;
            case 'reports': return <Reports {...filteredProps} {...rest} />;
            case 'rules': return <AIRulesManager rules={rest.rules} chartOfAccounts={rest.chartOfAccounts} onDeleteRule={rest.onDeleteRule} />;
            case 'budgets': return <BudgetsManager accounts={rest.chartOfAccounts.filter(a => a.type === 'Expense')} budgets={rest.budgets} onSetBudgets={rest.onSetBudgets} />;
            case 'recurring': return <RecurringManager recurringTransactions={filteredProps.recurringTransactions} chartOfAccounts={rest.chartOfAccounts} onDelete={rest.onDeleteRecurring} openModal={openModal} />;
            case 'audit': return <AuditTrail activityLog={rest.activityLog} />;
            
            // Settings
            case 'entities': return <EntityManagement entities={rest.entities} />;
            case 'tax': return <TaxManagement taxCodes={rest.taxCodes} />;
            case 'currencies': return <CurrencySettings exchangeRates={rest.exchangeRates} />;

            default: return <div>Select a view</div>;
        }
    };

    return (
        <div className="tab-content" style={{paddingTop: 0}}>
            {renderContent()}
        </div>
    );
};