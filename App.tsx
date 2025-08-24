



import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    ReportData, AINarrativeResponse, 
    Transaction, ChartOfAccount, Customer, Invoice, Bill, Vendor, Employee, CategorizationRule, ActivityLogEntry, Budgets, RecurringTransaction, InvoiceStatus, BillStatus, BankTransaction, Product, InventoryItem, PayRun, PurchaseOrder,
    AIAgent, AIPolicy, Notification, ApprovalWorkflow, Entity, TaxCode, KPIDeepDiveResponse, Chart, CurrencyExchangeRate, Location, StockTransfer, GoodsReceiptNote, initialReportData, ActivityAction, PaymentRun, InvoicePayment
} from './types';
import { 
    generateBatchedSectionAnalysis, generateDashboardSummary, generateKPIDeepDive, generateCashFlowForecast, generateBusinessInsights
} from './services/geminiService';
import { REPORT_SECTIONS, REPORT_SECTION_BATCHES } from './constants';

import ReportDashboard from './components/ReportDashboard';
import FinancialDataInput from './components/FinancialDataInput';

import { SparklesIcon, BookOpenIcon, BarChartIcon, ChevronDownIcon, PlusCircleIcon, PackageIcon, FileDigitIcon, BuildingIcon, LandmarkIcon, UsersIcon, HistoryIcon, ListIcon, TargetIcon, RepeatIcon, PieChartIcon, LineChartIcon, BotIcon, BellIcon, ClipboardListIcon, CameraIcon, Building2Icon, PercentCircleIcon, CoinsIcon, PackageCheckIcon, CreditCardIcon } from './components/icons';
import { DefinitiveBooks } from './components/books/DefinitiveBooks';
import { AddTransactionModal } from './components/books/AddTransactionModal';
import { AddEditInvoice } from './components/books/AddEditInvoice';
import { AddEditBill } from './components/books/AddEditBill';
import { AddEditCustomerModal } from './components/books/AddEditCustomerModal';
import { AddEditVendorModal } from './components/books/AddEditVendorModal';
import { AddEditEmployeeModal } from './components/books/AddEditEmployeeModal';
import { AddAccountModal } from './components/books/AddAccountModal';
import { AddRecurringModal } from './components/books/AddRecurringModal';
import { AddEditProductModal } from './components/books/AddEditProductModal';
import { AdjustInventoryModal } from './components/books/AdjustInventoryModal';
import { ApproveRejectModal } from './components/books/ApproveRejectModal';
import { AddEditPurchaseOrderModal } from './components/books/AddEditPurchaseOrderModal';
import { ScanReceiptModal } from './components/books/ScanReceiptModal';
import { initialChartOfAccounts, initialTransactions, initialBankTransactions, initialProducts, initialInventory, initialEmployees, initialAgents, initialPolicies, initialNotifications, initialVendors, initialBills, initialApprovalWorkflows, initialPurchaseOrders, initialEntities, initialTaxCodes, initialExchangeRates, initialLocations, initialStockTransfers, initialGoodsReceiptNotes, initialPaymentRuns } from './data/initialData';
import { getSectionDependencies, hasIncomeStatementData, hasBalanceSheetData, hasCashFlowData, hasBudgetData, hasEsgData, hasScenarioData, formatCurrency } from './utils/financialUtils';
import { Notifications } from './components/Notifications';
import { EntitySwitcher } from './components/EntitySwitcher';
import { KPIDeepDiveModal } from './components/books/KPIDeepDiveModal';
import { AddGoodsReceiptModal } from './components/books/inventory/AddGoodsReceiptModal';
import { RecordPaymentModal } from './components/books/payments/RecordPaymentModal';


export type GenerationStatus = {
    status: 'pending' | 'loading' | 'success' | 'error' | 'skipped';
    message: string;
};
export type GenerationState = { [key: string]: GenerationStatus };

type ModalType = 'transaction' | 'invoice' | 'bill' | 'customer' | 'vendor' | 'employee' | 'account' | 'recurring' | 'product' | 'inventory_adjust' | 'approve_reject' | 'purchase_order' | 'scan_receipt' | 'kpi_deep_dive' | 'goods_receipt' | 'record_payment' | null;
type ModalData = {
    transaction?: Partial<Transaction>;
    invoice?: Invoice | Omit<Invoice, 'id'> | null;
    bill?: Bill | Omit<Bill, 'id'> | null;
    purchase_order?: PurchaseOrder | null;
    customer?: Customer | null;
    vendor?: Vendor | null;
    employee?: Employee | null;
    account?: { existingAccount?: ChartOfAccount, parentId?: string };
    recurring?: RecurringTransaction | null;
    product?: Product | null;
    inventory_adjust?: { product: Product, location: Location, currentQuantity: number };
    approvalItem?: Bill | PurchaseOrder;
    kpi_deep_dive?: { title: string; data: Transaction[] };
    goods_receipt?: { purchaseOrder: PurchaseOrder };
    invoice_payment?: { invoice: Invoice };
}

interface NavItem {
    id: string;
    label: string;
    icon: React.FC<any>;
    children?: NavItem[];
}

const App: React.FC = () => {
    const [activeView, setActiveView] = useState('analysis');
    const [expandedSections, setExpandedSections] = useState<string[]>(['bookkeeping', 'settings']);
    const [openModal, setOpenModal] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<ModalData>({});
    const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
    const createDropdownRef = useRef<HTMLDivElement>(null);
    
    // --- State for Financial Analysis Suite ---
    const [inputReportData, setInputReportData] = useState<ReportData>(initialReportData);
    const [generatedReportData, setGeneratedReportData] = useState<ReportData | null>(null);
    const [narrative, setNarrative] = useState<AINarrativeResponse | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>({});
    const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [activeReportSectionId, setActiveReportSectionId] = useState('definitive_view');

    // --- State for DefinitiveBooks ---
    const [entities, setEntities] = useState<Entity[]>(initialEntities);
    const [activeEntityId, setActiveEntityId] = useState<string>(initialEntities.find(e => e.parentId)?.id || initialEntities[0].id);
    const [taxCodes, setTaxCodes] = useState<TaxCode[]>(initialTaxCodes);
    const [exchangeRates, setExchangeRates] = useState<CurrencyExchangeRate[]>(initialExchangeRates);
    const [locations, setLocations] = useState<Location[]>(initialLocations);
    const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(initialStockTransfers);
    const [goodsReceiptNotes, setGoodsReceiptNotes] = useState<GoodsReceiptNote[]>(initialGoodsReceiptNotes);
    const [paymentRuns, setPaymentRuns] = useState<PaymentRun[]>(initialPaymentRuns);
    
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(initialChartOfAccounts);
    const [rules, setRules] = useState<CategorizationRule[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [budgets, setBudgets] = useState<Budgets>({ 'exp_software': 150, 'exp_advertising': 500 });
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
    const [bills, setBills] = useState<Bill[]>(initialBills);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(initialBankTransactions);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [payRuns, setPayRuns] = useState<PayRun[]>([]);

    // --- State for Autonomous Agent Mesh ---
    const [agents, setAgents] = useState<AIAgent[]>(initialAgents);
    const [policies, setPolicies] = useState<AIPolicy[]>(initialPolicies);
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>(initialApprovalWorkflows);

    const logActivity = useCallback((action: ActivityAction, description: string) => {
        const newLogEntry: ActivityLogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action,
            description,
        };
        setActivityLog(prev => [newLogEntry, ...prev]);
    }, []);

    const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'entityId'>) => {
        const newTransaction: Transaction = { id: `tx_${Date.now()}`, entityId: activeEntityId, reconciliationStatus: 'unreconciled', reviewedBy: 'user', ...transaction };
        setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        logActivity('create', `Created transaction: "${newTransaction.description}" for ${formatCurrency(newTransaction.amount)}.`);
    }, [logActivity, activeEntityId]);

    const addPaymentRun = useCallback((billIds: string[], paymentDate: string) => {
        const newPaymentRun: PaymentRun = {
            id: `PR-${Date.now()}`,
            creationDate: new Date().toISOString().split('T')[0],
            paymentDate,
            status: 'Pending',
            billIds,
            entityId: activeEntityId
        };
        setPaymentRuns(prev => [newPaymentRun, ...prev]);
        setBills(prev => prev.map(bill => billIds.includes(bill.id) ? { ...bill, status: 'Processing Payment' } : bill));
        logActivity('create', `Created Payment Run ${newPaymentRun.id} for ${billIds.length} bills.`);
    }, [logActivity, activeEntityId]);

    const processPaymentRun = useCallback((paymentRunId: string) => {
        const run = paymentRuns.find(pr => pr.id === paymentRunId);
        if (!run) return;

        const billsToPay = bills.filter(b => run.billIds.includes(b.id));
        const apAccount = chartOfAccounts.find(a => a.id === 'liab_ap');
        const cashAccount = chartOfAccounts.find(a => a.id === 'asset_checking');
        if (!apAccount || !cashAccount) {
            alert("Accounts Payable or Cash account not found.");
            return;
        }

        billsToPay.forEach(bill => {
            const total = bill.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
             // Create debit to AP
            addTransaction({
                date: run.paymentDate,
                description: `Payment for Bill ${bill.id}`,
                accountId: apAccount.id,
                amount: total, // Debit is positive to a liability, decreasing it
                currency: bill.currency,
                exchangeRate: bill.exchangeRate,
                baseCurrencyAmount: bill.baseCurrencyAmount
            });
        });

        const totalPaid = billsToPay.reduce((sum, bill) => sum + bill.baseCurrencyAmount, 0);
        // Create one credit to cash
        addTransaction({
            date: run.paymentDate,
            description: `Payment Run ${run.id}`,
            accountId: cashAccount.id,
            amount: -totalPaid,
            currency: 'USD',
            exchangeRate: 1,
            baseCurrencyAmount: -totalPaid
        });

        setBills(prev => prev.map(bill => run.billIds.includes(bill.id) ? { ...bill, status: 'Paid' } : bill));
        setPaymentRuns(prev => prev.map(pr => pr.id === paymentRunId ? { ...pr, status: 'Completed' } : pr));
        logActivity('update', `Processed Payment Run ${run.id}.`);
    }, [paymentRuns, bills, addTransaction, logActivity, chartOfAccounts]);

    const recordInvoicePayment = useCallback((invoiceId: string, paymentAmount: number, paymentDate: string) => {
        const arAccount = chartOfAccounts.find(a => a.id === 'asset_ar');
        const cashAccount = chartOfAccounts.find(a => a.id === 'asset_checking');
        if (!arAccount || !cashAccount) {
            alert("Accounts Receivable or Cash account not found.");
            return;
        }
        
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if(!invoice) return;

        // Create cash receipt journal entry
        addTransaction({
            date: paymentDate,
            description: `Payment for Invoice ${invoice.id}`,
            accountId: cashAccount.id,
            amount: paymentAmount,
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate,
            baseCurrencyAmount: paymentAmount * invoice.exchangeRate
        });
         addTransaction({
            date: paymentDate,
            description: `Payment for Invoice ${invoice.id}`,
            accountId: arAccount.id,
            amount: -paymentAmount,
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate,
            baseCurrencyAmount: -paymentAmount * invoice.exchangeRate
        });
        
        const newPayment: InvoicePayment = {
            id: `pay_${Date.now()}`,
            date: paymentDate,
            amount: paymentAmount
        };

        setInvoices(prev => prev.map(inv => {
            if (inv.id === invoiceId) {
                const existingPayments = inv.payments || [];
                const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0) + newPayment.amount;
                const totalInvoiceAmount = inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
                const newStatus = totalPaid >= totalInvoiceAmount ? 'Paid' : 'Partially Paid';

                return { ...inv, payments: [...existingPayments, newPayment], status: newStatus };
            }
            return inv;
        }));
        
        logActivity('update', `Recorded payment of ${formatCurrency(paymentAmount)} for Invoice ${invoice.id}.`);
        setOpenModal(null);

    }, [invoices, chartOfAccounts, addTransaction, logActivity]);
    
    const addGoodsReceiptNote = useCallback((grn: Omit<GoodsReceiptNote, 'id' | 'entityId'>) => {
        const newGrn: GoodsReceiptNote = { ...grn, id: `GRN-${Date.now()}`, entityId: activeEntityId };
        setGoodsReceiptNotes(prev => [...prev, newGrn]);

        // Update inventory levels
        setInventory(prev => {
            const newInventory = [...prev];
            newGrn.lineItems.forEach(item => {
                const invItemIndex = newInventory.findIndex(i => i.productId === item.productId && i.locationId === newGrn.locationId);
                if (invItemIndex > -1) {
                    newInventory[invItemIndex].quantity += item.quantityReceived;
                } else {
                    newInventory.push({ productId: item.productId, locationId: newGrn.locationId, quantity: item.quantityReceived });
                }
            });
            return newInventory;
        });

        // Update PO status
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === newGrn.purchaseOrderId) {
                const relatedGrns = [...goodsReceiptNotes, newGrn].filter(g => g.purchaseOrderId === po.id);
                const totalReceivedByItem: { [key: string]: number } = {};
                
                relatedGrns.forEach(g => {
                    g.lineItems.forEach(line => {
                        totalReceivedByItem[line.productId] = (totalReceivedByItem[line.productId] || 0) + line.quantityReceived;
                    });
                });

                const isFullyReceived = po.lineItems.every(poLine => {
                    const totalReceived = totalReceivedByItem[poLine.productId!] || 0;
                    return totalReceived >= poLine.quantity;
                });

                return {
                    ...po,
                    status: isFullyReceived ? 'Fully Received' : 'Partially Received'
                };
            }
            return po;
        }));

        logActivity('create', `Created Goods Receipt Note ${newGrn.id} for PO ${newGrn.purchaseOrderId}.`);
        setOpenModal(null);
    }, [logActivity, activeEntityId, goodsReceiptNotes]);


    
    const updateTransaction = useCallback((updatedTransaction: Transaction) => {
        let originalTx: Transaction | undefined;
        setTransactions(prev => {
            originalTx = prev.find(tx => tx.id === updatedTransaction.id);
            return prev.map(tx => tx.id === updatedTransaction.id ? updatedTransaction : tx).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        });
        if (originalTx) {
            logActivity('update', `Updated transaction "${originalTx.description}".`);
        }
    }, [logActivity]);

    const deleteTransaction = useCallback((idToDelete: string) => {
        const txToDelete = transactions.find(tx => tx.id === idToDelete);
        if (txToDelete) {
            setTransactions(prev => prev.filter(tx => tx.id !== idToDelete));
            logActivity('delete', `Deleted transaction: "${txToDelete.description}" for ${formatCurrency(txToDelete.amount)}.`);
        }
    }, [transactions, logActivity]);
    
    const addAccount = useCallback((account: Omit<ChartOfAccount, 'id'>) => {
        const newAccount: ChartOfAccount = { id: `custom_${Date.now()}`, ...account };
        setChartOfAccounts(prev => [...prev, newAccount].sort((a, b) => (a.accountNumber || '').localeCompare(b.accountNumber || '')));
        logActivity('create', `Created account: "${newAccount.name}" (${newAccount.type}).`);
    }, [logActivity]);

    const updateAccount = useCallback((updatedAccount: ChartOfAccount) => {
        const originalAccount = chartOfAccounts.find(acc => acc.id === updatedAccount.id);
        if (originalAccount) {
            setChartOfAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc)
                .sort((a, b) => (a.accountNumber || '').localeCompare(b.accountNumber || '')));
            logActivity('update', `Updated account: "${originalAccount.name}".`);
        }
    }, [chartOfAccounts, logActivity]);
    
    const toggleArchiveAccount = useCallback((idToToggle: string) => {
        const account = chartOfAccounts.find(acc => acc.id === idToToggle);
        if (account) {
            const isArchiving = !account.isArchived;
            setChartOfAccounts(prev => prev.map(acc => acc.id === idToToggle ? { ...acc, isArchived: isArchiving } : acc));
            logActivity(isArchiving ? 'delete' : 'update', `${isArchiving ? 'Archived' : 'Restored'} account: "${account.name}".`);
        }
    }, [chartOfAccounts, logActivity]);
    
    const addRule = useCallback((rule: Omit<CategorizationRule, 'id'>) => {
        const newRule = { ...rule, id: `rule_${Date.now()}` };
        setRules(prev => [...prev, newRule]);
        logActivity('create', `Created AI rule for keyword "${rule.keyword}".`);
    }, [logActivity]);

    const deleteRule = useCallback((id: string) => {
        const toDelete = rules.find(r => r.id === id);
        if(toDelete) {
            setRules(prev => prev.filter(r => r.id !== id));
            logActivity('delete', `Deleted AI rule for keyword "${toDelete.keyword}".`);
        }
    }, [rules, logActivity]);
    
    const addRecurringTransaction = useCallback((data: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'entityId'>) => {
        const newRecurring: RecurringTransaction = { ...data, id: `rec_${Date.now()}`, nextDueDate: data.startDate, entityId: activeEntityId };
        setRecurringTransactions(prev => [...prev, newRecurring]);
        logActivity('create', `Created recurring transaction: "${data.description}".`);
    }, [logActivity, activeEntityId]);

    const updateRecurringTransaction = useCallback((updated: RecurringTransaction) => {
        setRecurringTransactions(prev => prev.map(rt => rt.id === updated.id ? updated : rt));
        logActivity('update', `Updated recurring transaction: "${updated.description}".`);
    }, [logActivity]);

    const deleteRecurringTransaction = useCallback((id: string) => {
        const toDelete = recurringTransactions.find(rt => rt.id === id);
        if (toDelete) {
            setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
            logActivity('delete', `Deleted recurring transaction: "${toDelete.description}".`);
        }
    }, [recurringTransactions, logActivity]);
    
    const addCustomer = useCallback((customer: Omit<Customer, 'id'|'entityId'>) => {
        const newCustomer: Customer = { ...customer, id: `cust_${Date.now()}`, entityId: activeEntityId };
        setCustomers(prev => [...prev, newCustomer]);
        logActivity('create', `Created customer: "${customer.name}".`);
        setOpenModal(null);
    }, [logActivity, activeEntityId]);

    const updateCustomer = useCallback((updated: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        logActivity('update', `Updated customer: "${updated.name}".`);
        setOpenModal(null);
    }, [logActivity]);

    const deleteCustomer = useCallback((id: string) => {
        const toDelete = customers.find(c => c.id === id);
        if (toDelete) {
            setCustomers(prev => prev.filter(c => c.id !== id));
            logActivity('delete', `Deleted customer: "${toDelete.name}".`);
        }
    }, [customers, logActivity]);
    
    const addInvoice = useCallback((invoice: Omit<Invoice, 'id'|'entityId'>) => {
        const newInvoice: Invoice = { ...invoice, id: `INV-${String(invoices.length + 1).padStart(3, '0')}`, entityId: activeEntityId };
        setInvoices(prev => [...prev, newInvoice]);
        logActivity('create', `Created invoice ${newInvoice.id}.`);
        setOpenModal(null);
    }, [invoices.length, logActivity, activeEntityId]);

    const updateInvoice = useCallback((updated: Invoice) => {
        const originalInvoice = invoices.find(inv => inv.id === updated.id);
        setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
        logActivity('update', `Updated invoice ${updated.id}.`);
        setOpenModal(null);

        if (originalInvoice?.status !== 'Paid' && updated.status === 'Paid') {
            const arAccount = chartOfAccounts.find(a => a.id === 'asset_ar');
            const salesAccount = chartOfAccounts.find(a => a.name.toLowerCase().includes('sales')) || chartOfAccounts.find(a => a.type === 'Income');
            
            if (arAccount && salesAccount) {
                 const total = updated.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
                 // Create Sales Journal
                 addTransaction({
                    date: updated.invoiceDate,
                    description: `Sales from Invoice ${updated.id}`,
                    accountId: arAccount.id, // Debit AR
                    amount: total,
                    currency: updated.currency, exchangeRate: updated.exchangeRate, baseCurrencyAmount: updated.baseCurrencyAmount
                 });
                 addTransaction({
                    date: updated.invoiceDate,
                    description: `Sales from Invoice ${updated.id}`,
                    accountId: salesAccount.id, // Credit Sales
                    amount: -total,
                    currency: updated.currency, exchangeRate: updated.exchangeRate, baseCurrencyAmount: -updated.baseCurrencyAmount
                 });
                logActivity('create', `Automatically created journal entry for invoice ${updated.id}.`);
            }

            updated.lineItems.forEach(item => {
                if (item.productId) {
                    const activeEntity = entities.find(e => e.id === activeEntityId);
                    const primaryLocationId = activeEntity?.primaryLocationId;
                    if (primaryLocationId) {
                        setInventory(prev => {
                            const newInv = [...prev];
                            const invItemIndex = newInv.findIndex(i => i.productId === item.productId && i.locationId === primaryLocationId);
                            if (invItemIndex > -1) {
                                newInv[invItemIndex].quantity -= item.quantity;
                            }
                            return newInv;
                        });
                        logActivity('update', `Decremented stock for product ID ${item.productId} by ${item.quantity} due to invoice ${updated.id}.`);
                    }
                }
            });
        }
    }, [invoices, addTransaction, chartOfAccounts, logActivity, entities, activeEntityId]);
    
    const deleteInvoice = useCallback((id: string) => {
        const toDelete = invoices.find(inv => inv.id === id);
        if (toDelete) {
            setInvoices(prev => prev.filter(inv => inv.id !== id));
            logActivity('delete', `Deleted invoice ${toDelete.id}.`);
        }
    }, [invoices, logActivity]);

    const addVendor = useCallback((vendor: Omit<Vendor, 'id'|'entityId'>) => {
        const newVendor: Vendor = { ...vendor, id: `vend_${Date.now()}`, entityId: activeEntityId };
        setVendors(prev => [...prev, newVendor]);
        logActivity('create', `Created vendor: "${vendor.name}".`);
        setOpenModal(null);
    }, [logActivity, activeEntityId]);

    const updateVendor = useCallback((updated: Vendor) => {
        setVendors(prev => prev.map(v => v.id === updated.id ? updated : v));
        logActivity('update', `Updated vendor: "${updated.name}".`);
        setOpenModal(null);
    }, [logActivity]);

    const deleteVendor = useCallback((id: string) => {
        const toDelete = vendors.find(v => v.id === id);
        if (toDelete) {
            setVendors(prev => prev.filter(v => v.id !== id));
            logActivity('delete', `Deleted vendor: "${toDelete.name}".`);
        }
    }, [vendors, logActivity]);

    const addBill = useCallback((bill: Omit<Bill, 'id'|'entityId'>) => {
        const newBill: Bill = { ...bill, id: `BILL-${String(bills.length + 1).padStart(3, '0')}`, entityId: activeEntityId };
        setBills(prev => [...prev, newBill]);
        logActivity('create', `Created bill ${newBill.id}.`);
        setOpenModal(null);
    }, [bills.length, logActivity, activeEntityId]);

    const updateBill = useCallback((updated: Bill) => {
        const originalBill = bills.find(b => b.id === updated.id);
        setBills(prev => prev.map(b => b.id === updated.id ? updated : b));
        logActivity('update', `Updated bill ${updated.id}.`);
        setOpenModal(null);

        if (originalBill?.status !== 'Paid' && updated.status === 'Paid') {
            const apAccount = chartOfAccounts.find(a => a.id === 'liab_ap');
            if(!apAccount) return;

            const today = new Date().toISOString().split('T')[0];
            const paymentDateRate = exchangeRates.find(r => r.from === updated.currency && r.to === 'USD' && r.date <= today)?.rate || updated.exchangeRate;
            
            // --- FX Gain/Loss Logic ---
            const paymentAmountInBase = (updated.baseCurrencyAmount / updated.exchangeRate) * paymentDateRate;
            const fxGainLoss = updated.baseCurrencyAmount - paymentAmountInBase;
            if (Math.abs(fxGainLoss) > 0.01) {
                const fxAccount = chartOfAccounts.find(a => a.name.toLowerCase().includes('foreign exchange'));
                if (fxAccount) {
                    addTransaction({
                        date: today, description: `FX Gain/Loss on Bill ${updated.id}`, accountId: fxAccount.id, amount: fxGainLoss,
                        currency: 'USD', exchangeRate: 1, baseCurrencyAmount: fxGainLoss,
                    });
                     logActivity('create', `Automatically created FX Gain/Loss transaction for paid bill ${updated.id}.`);
                }
            }
             // --- End FX Logic ---

            updated.lineItems.forEach(item => {
                const total = item.quantity * item.unitPrice;
                 // Debit Expense account, Credit AP
                addTransaction({
                    date: updated.billDate, description: `${updated.id}: ${item.description}`, accountId: item.accountId, amount: total,
                    currency: updated.currency, exchangeRate: updated.exchangeRate, baseCurrencyAmount: updated.baseCurrencyAmount
                });
                addTransaction({
                    date: updated.billDate, description: `${updated.id}: ${item.description}`, accountId: apAccount.id, amount: -total,
                    currency: updated.currency, exchangeRate: updated.exchangeRate, baseCurrencyAmount: -updated.baseCurrencyAmount
                });

                if (item.productId) {
                    const activeEntity = entities.find(e => e.id === activeEntityId);
                    const primaryLocationId = activeEntity?.primaryLocationId;
                    if (primaryLocationId) {
                        setInventory(prev => {
                            const newInv = [...prev];
                            const invItemIndex = newInv.findIndex(i => i.productId === item.productId && i.locationId === primaryLocationId);
                            if (invItemIndex > -1) {
                                newInv[invItemIndex].quantity += item.quantity;
                            } else {
                                newInv.push({ productId: item.productId, locationId: primaryLocationId, quantity: item.quantity });
                            }
                            return newInv;
                        });
                        logActivity('update', `Incremented stock for product ID ${item.productId} by ${item.quantity} due to bill ${updated.id}.`);
                    }
                }
            });
            logActivity('create', `Automatically created journal entries for bill ${updated.id}.`);
        }
    }, [bills, addTransaction, logActivity, exchangeRates, chartOfAccounts, entities, activeEntityId]);

    const handleBillApproval = useCallback((billId: string, decision: 'Approved' | 'Rejected', notes?: string) => {
        setBills(prev => prev.map(b => {
            if (b.id === billId) {
                const newStatus = decision === 'Approved' ? 'Awaiting Payment' : 'Draft';
                const newHistory = [
                    ...(b.approvalHistory || []),
                    { approver: 'Admin User', decision, timestamp: new Date().toISOString(), notes }
                ];
                logActivity('update', `${decision} bill ${billId}.`);
                return { ...b, status: newStatus, approvalHistory: newHistory };
            }
            return b;
        }));
        setOpenModal(null);
    }, [logActivity]);

    const deleteBill = useCallback((id: string) => {
        const toDelete = bills.find(b => b.id === id);
        if (toDelete) {
            setBills(prev => prev.filter(b => b.id !== id));
            logActivity('delete', `Deleted bill ${toDelete.id}.`);
        }
    }, [bills, logActivity]);

    const addPurchaseOrder = useCallback((po: Omit<PurchaseOrder, 'id'|'entityId'>) => {
        const newPO: PurchaseOrder = { ...po, id: `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`, entityId: activeEntityId };
        setPurchaseOrders(prev => [...prev, newPO]);
        logActivity('create', `Created Purchase Order ${newPO.id}.`);
        setOpenModal(null);
    }, [purchaseOrders.length, logActivity, activeEntityId]);

    const updatePurchaseOrder = useCallback((updated: PurchaseOrder) => {
        setPurchaseOrders(prev => prev.map(po => po.id === updated.id ? updated : po));
        logActivity('update', `Updated Purchase Order ${updated.id}.`);
        setOpenModal(null);
    }, [logActivity]);

    const handlePOApproval = useCallback((poId: string, decision: 'Approved' | 'Rejected', notes?: string) => {
        setPurchaseOrders(prev => prev.map(po => {
            if (po.id === poId) {
                const newStatus = decision === 'Approved' ? 'Approved' : 'Rejected';
                const newHistory = [
                    ...(po.approvalHistory || []),
                    { approver: 'Admin User', decision, timestamp: new Date().toISOString(), notes }
                ];
                logActivity('update', `${decision} Purchase Order ${poId}.`);
                return { ...po, status: newStatus, approvalHistory: newHistory };
            }
            return po;
        }));
        setOpenModal(null);
    }, [logActivity]);

    const addProduct = useCallback((product: Omit<Product, 'id'|'entityId'>) => {
        const newProduct: Product = { ...product, id: `prod_${Date.now()}`, entityId: activeEntityId };
        setProducts(prev => [...prev, newProduct]);
        const activeEntity = entities.find(e => e.id === activeEntityId);
        const primaryLocationId = activeEntity?.primaryLocationId;
        if (primaryLocationId) {
            setInventory(prev => [...prev, { productId: newProduct.id, locationId: primaryLocationId, quantity: 0 }]);
        }
        logActivity('create', `Created product: "${product.name}".`);
        setOpenModal(null);
    }, [logActivity, activeEntityId, entities]);

    const updateProduct = useCallback((updated: Product) => {
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        logActivity('update', `Updated product: "${updated.name}".`);
        setOpenModal(null);
    }, [logActivity]);

    const deleteProduct = useCallback((id: string) => {
        const toDelete = products.find(p => p.id === id);
        if (toDelete) {
            setProducts(prev => prev.filter(p => p.id !== id));
            setInventory(prev => prev.filter(i => i.productId !== id));
            logActivity('delete', `Deleted product: "${toDelete.name}".`);
        }
    }, [products, logActivity]);

    const adjustInventory = useCallback((productId: string, locationId: string, newQuantity: number, reason: string) => {
        const product = products.find(p => p.id === productId);
        setInventory(prev => prev.map(item => (item.productId === productId && item.locationId === locationId) ? { ...item, quantity: newQuantity } : item));
        logActivity('update', `Adjusted inventory for "${product?.name}" at location ${locationId}: new quantity ${newQuantity}. Reason: ${reason}.`);
        setOpenModal(null);
    }, [products, logActivity]);

    const addEmployee = useCallback((employee: Omit<Employee, 'id'|'entityId'>) => {
        const newEmployee = { ...employee, id: `emp_${Date.now()}`, entityId: activeEntityId};
        setEmployees(prev => [...prev, newEmployee]);
        logActivity('create', `Added new employee: ${employee.name}.`);
        setOpenModal(null);
    }, [logActivity, activeEntityId]);

    const updateEmployee = useCallback((updated: Employee) => {
        setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
        logActivity('update', `Updated employee details for ${updated.name}.`);
        setOpenModal(null);
    }, [logActivity]);

    const deleteEmployee = useCallback((id: string) => {
        const toDelete = employees.find(e => e.id === id);
        if (toDelete) {
            setEmployees(prev => prev.filter(e => e.id !== id));
            logActivity('delete', `Removed employee: ${toDelete.name}.`);
        }
    }, [employees, logActivity]);
    
    const approvePayRun = useCallback((payRun: PayRun) => {
        const wagesAccountId = chartOfAccounts.find(a => a.name.includes("Salaries"))?.id || 'exp_salaries';
        
        payRun.payments.forEach(p => {
            const employee = employees.find(e => e.id === p.employeeId);
            addTransaction({
                date: payRun.paymentDate,
                description: `Payroll for ${employee?.name || 'Unknown'} - Period ${payRun.payPeriodStart} to ${payRun.payPeriodEnd}`,
                accountId: wagesAccountId,
                amount: -p.grossPay,
                currency: 'USD',
                exchangeRate: 1,
                baseCurrencyAmount: -p.grossPay
            });
        });
        
        const totalPayroll = payRun.payments.reduce((sum, p) => sum + p.grossPay, 0);
        setPayRuns(prev => prev.map(pr => pr.id === payRun.id ? { ...pr, status: 'approved' } : pr));
        logActivity('create', `Processed and approved payroll for period ${payRun.payPeriodStart} to ${payRun.payPeriodEnd} totaling ${formatCurrency(totalPayroll)}.`);
    }, [addTransaction, employees, logActivity, chartOfAccounts]);
    
    const handleMatchTransactions = useCallback((bankTxId: string, bookTxId: string) => {
        setBankTransactions(prev => prev.map(btx => btx.id === bankTxId ? { ...btx, status: 'reconciled' } : btx));
        updateTransaction({
            ...transactions.find(tx => tx.id === bookTxId)!,
            reconciliationStatus: 'reconciled',
            matchedBankTxId: bankTxId
        });
        logActivity('update', `Reconciled bank transaction with book transaction.`);
    }, [logActivity, updateTransaction, transactions]);

    const handleCreateAndMatchTransaction = useCallback((bankTx: BankTransaction, newBookTxData: Omit<Transaction, 'id' | 'reconciliationStatus' | 'matchedBankTxId' | 'entityId' | 'currency' | 'exchangeRate' | 'baseCurrencyAmount'>) => {
        const newTransaction: Transaction = {
            id: `tx_${Date.now()}`,
            ...newBookTxData,
            reconciliationStatus: 'reconciled',
            matchedBankTxId: bankTx.id,
            reviewedBy: 'user',
            entityId: activeEntityId,
            currency: 'USD',
            exchangeRate: 1,
            baseCurrencyAmount: newBookTxData.amount,
        };
        setTransactions(prev => [newTransaction, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setBankTransactions(prev => prev.map(btx => btx.id === bankTx.id ? { ...btx, status: 'reconciled' } : btx));
        logActivity('create', `Created and reconciled transaction: "${newTransaction.description}" for ${formatCurrency(newTransaction.amount)}.`);
    }, [logActivity, activeEntityId]);

    const handleUpdateAgent = useCallback((agentId: string, isActive: boolean) => {
        setAgents(prev => prev.map(agent => agent.id === agentId ? { ...agent, isActive } : agent));
        logActivity('update', `Set agent "${agents.find(a=>a.id === agentId)?.name}" to ${isActive ? 'active' : 'inactive'}.`);
    }, [agents, logActivity]);

    const handleUpdatePolicy = useCallback((policyId: AIPolicy['id'], value: number) => {
        setPolicies(prev => prev.map(policy => policy.id === policyId ? { ...policy, value } : policy));
        logActivity('update', `Updated policy "${policies.find(p=>p.id === policyId)?.name}" to ${value}.`);
    }, [policies, logActivity]);
    
    const handleReceiptScanned = useCallback((scannedData: { date: string; description: string; amount: number; accountId: string; attachmentUrl: string; attachmentFilename: string; }) => {
        setOpenModal('transaction');
        setModalData({
            transaction: {
                ...scannedData,
                amount: -Math.abs(scannedData.amount), // Assume expense
                currency: 'USD',
                exchangeRate: 1,
                baseCurrencyAmount: -Math.abs(scannedData.amount),
            }
        });
    }, []);

    const handleRetrySectionAnalysis = useCallback(async (sectionId: string) => {
        if (!generatedReportData) return;

        const batch = REPORT_SECTION_BATCHES.find(b => b.sections.includes(sectionId));
        if (!batch) {
            console.error("Could not find batch for section:", sectionId);
            return;
        }

        setGenerationState(prev => {
            const next = { ...prev };
            batch.sections.forEach(id => {
                if (prev[id]?.status === 'error') {
                    next[id] = { status: 'loading', message: `Retrying: ${REPORT_SECTIONS.find(s => s.id === id)?.name}` };
                }
            });
            return next;
        });

        try {
            const analysisBatch = await generateBatchedSectionAnalysis(generatedReportData, batch.sections);
            setNarrative(prev => {
                if (!prev) return null;
                const newSections = prev.sections.map(sec => {
                    if (analysisBatch[sec.id]) {
                        return { ...sec, analysis: analysisBatch[sec.id] };
                    }
                    return sec;
                });
                return { ...prev, sections: newSections };
            });
            setGenerationState(prev => {
                const next = { ...prev };
                batch.sections.forEach(id => {
                    next[id] = { status: 'success', message: 'Complete' };
                });
                return next;
            });

        } catch (error) {
             setGenerationState(prev => {
                const next = { ...prev };
                batch.sections.forEach(id => {
                     next[id] = { status: 'error', message: 'Retry Failed' };
                });
                return next;
            });
        }
    }, [generatedReportData]);


    const handleGenerateReport = useCallback(async (dataForAnalysis: ReportData) => {
        if (isAnalysisLoading) return;
        setIsAnalysisLoading(true);
        setAnalysisError(null);
        setActiveReportSectionId('definitive_view');
        setGeneratedReportData(dataForAnalysis);

        const latestPeriod = dataForAnalysis.periods[dataForAnalysis.periods.length - 1];
        if (!latestPeriod) {
            setAnalysisError("No financial periods found. Please add at least one period.");
            setIsAnalysisLoading(false);
            return;
        }

        const dataAvailability = {
            pnl: hasIncomeStatementData(latestPeriod),
            bs: hasBalanceSheetData(latestPeriod),
            cf: hasCashFlowData(latestPeriod),
            budget: hasBudgetData(latestPeriod),
            esg: hasEsgData(latestPeriod.esg),
            scenario: hasScenarioData(dataForAnalysis.scenario),
            market: parseFloat(dataForAnalysis.marketValuation) > 0,
            competitors: dataForAnalysis.competitors.length > 0 && dataForAnalysis.competitors.some(c => c.trim() !== '')
        };

        const availableSectionIds = new Set(REPORT_SECTIONS
            .map(s => s.id)
            .filter(sectionId => {
                const deps = getSectionDependencies(sectionId);
                return deps.every(dep => dataAvailability[dep]);
            }));

        const availableBatches = REPORT_SECTION_BATCHES.map(batch => ({
            ...batch,
            sections: batch.sections.filter(id => availableSectionIds.has(id))
        })).filter(batch => batch.sections.length > 0);

        const hasGeneratableContent = availableBatches.length > 0 || Array.from(availableSectionIds).some(id => getSectionDependencies(id).length === 0);
        if (!hasGeneratableContent) {
            setAnalysisError("Not enough data provided to generate any report sections. Please fill out at least the core financial statements.");
            setIsAnalysisLoading(false);
            return;
        }

        const initialGenerationState: GenerationState = {};
        const allSectionsForReport: any[] = [];
        
        REPORT_SECTIONS.forEach(section => {
            if (availableSectionIds.has(section.id)) {
                initialGenerationState[section.id] = { status: 'pending', message: 'Queued...' };
            } else {
                const deps = getSectionDependencies(section.id).map(d => d.toUpperCase());
                const message = `Missing: ${deps.join(', ')} data`;
                initialGenerationState[section.id] = { status: 'skipped', message };
                allSectionsForReport.push({
                    ...section,
                    analysis: {
                        headline: 'Analysis Skipped',
                        takeaways: [`Data for ${deps.join(', ')} is required.`],
                        narrative: `Please go back to the data input step and provide the necessary financial data to generate this analysis. This section requires: ${deps.join(', ')}.`,
                        quantitativeData: { keyMetrics: [], charts: [] }
                    }
                });
            }
        });
        
        initialGenerationState['definitive_view'] = availableSectionIds.has('executive_summary') ? { status: 'pending', message: 'Queued...' } : { status: 'skipped', message: 'Core financials missing' };

        setGenerationState(initialGenerationState);
        setNarrative({ sections: [], dashboardAnalysis: undefined });
        
        try {
            const generatedSections: any[] = [];
            let anyError = false;

            for (const batch of availableBatches) {
                setGenerationState(prev => {
                    const next = { ...prev };
                    batch.sections.forEach(id => {
                        next[id] = { status: 'loading', message: `Generating: ${REPORT_SECTIONS.find(s=>s.id === id)?.name}`};
                    });
                    return next;
                });

                try {
                    const analysisBatch = await generateBatchedSectionAnalysis(dataForAnalysis, batch.sections);
                    
                    batch.sections.forEach(id => {
                        const sectionData = REPORT_SECTIONS.find(s => s.id === id);
                        if (sectionData) {
                            generatedSections.push({ ...sectionData, analysis: analysisBatch[id] });
                        }
                    });

                    setGenerationState(prev => {
                        const next = { ...prev };
                        batch.sections.forEach(id => {
                            next[id] = { status: 'success', message: 'Complete' };
                        });
                        return next;
                    });
                    
                } catch (batchError) {
                    anyError = true;
                     setGenerationState(prev => {
                        const next = { ...prev };
                        batch.sections.forEach(id => {
                            const sectionData = REPORT_SECTIONS.find(s => s.id === id);
                            if (sectionData) {
                                generatedSections.push({ ...sectionData, analysis: { headline: `Error generating ${sectionData.name}`, takeaways: [], narrative: batchError instanceof Error ? batchError.message : 'Unknown error.', quantitativeData: { keyMetrics: [], charts: [] } } });
                            }
                            next[id] = { status: 'error', message: 'Failed' };
                        });
                        return next;
                    });
                }
            }
            
            allSectionsForReport.push(...generatedSections);
            allSectionsForReport.sort((a, b) => REPORT_SECTIONS.findIndex(s => s.id === a.id) - REPORT_SECTIONS.findIndex(s => s.id === b.id));

            const fullReportResult: AINarrativeResponse = { sections: allSectionsForReport };
            
            if (initialGenerationState['definitive_view'].status !== 'skipped') {
                setGenerationState(prev => ({ ...prev, 'definitive_view': { status: 'loading', message: 'Generating Definitive View...' }}));
                if (!anyError && generatedSections.length > 0) {
                    try {
                        const summaryInput: AINarrativeResponse = { sections: generatedSections };
                        const dashboardSummary = await generateDashboardSummary(summaryInput);
                        fullReportResult.dashboardAnalysis = dashboardSummary;
                        setGenerationState(prev => ({ ...prev, 'definitive_view': { status: 'success', message: 'Complete' }}));
                    } catch(summaryError) {
                        anyError = true;
                        fullReportResult.dashboardAnalysis = { cfoBriefing: 'Failed to generate summary.', strategicRecommendations: [] };
                        setGenerationState(prev => ({ ...prev, 'definitive_view': { status: 'error', message: 'Failed' }}));
                    }
                } else {
                    fullReportResult.dashboardAnalysis = { cfoBriefing: 'Report generation had errors or was incomplete. Summary cannot be generated.', strategicRecommendations: [] };
                    setGenerationState(prev => ({ ...prev, 'definitive_view': { status: 'error', message: 'Skipped' }}));
                }
            } else {
                 fullReportResult.dashboardAnalysis = { cfoBriefing: 'Core financial data (P&L, Balance Sheet, Cash Flow) is required to generate the Definitive View summary.', strategicRecommendations: [] };
            }

            setNarrative(fullReportResult);

        } catch (error) {
            setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsAnalysisLoading(false);
        }
    }, [isAnalysisLoading]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        
        const updatedInvoices = invoices.map(inv => (inv.status === 'Sent' && inv.dueDate < today) ? { ...inv, status: 'Overdue' as InvoiceStatus } : inv);
        setInvoices(updatedInvoices);

        const updatedBills = bills.map(bill => (bill.status === 'Awaiting Payment' && bill.dueDate < today) ? { ...bill, status: 'Overdue' as BillStatus } : bill);
        setBills(updatedBills);
    }, []);

    const handleToggleSection = (sectionId: string) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId) 
                : [...prev, sectionId]
        );
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
                setIsCreateDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openCreateModal = (type: ModalType, data: ModalData = {}) => {
        setModalData(data);
        setOpenModal(type);
        setIsCreateDropdownOpen(false);
    };
    
    const navItems: NavItem[] = [
        { id: 'analysis', label: 'Analysis Suite', icon: BarChartIcon },
        { 
            id: 'bookkeeping', 
            label: 'AI Bookkeeping', 
            icon: BookOpenIcon,
            children: [
                { id: 'bookkeeping/dashboard', label: 'Dashboard', icon: PieChartIcon },
                { id: 'bookkeeping/automation', label: 'AI & Automation', icon: BotIcon },
                { id: 'bookkeeping/banking', label: 'Banking', icon: LandmarkIcon },
                { id: 'bookkeeping/sales', label: 'Sales', icon: FileDigitIcon },
                { id: 'bookkeeping/purchases', label: 'Purchases', icon: BuildingIcon },
                { id: 'bookkeeping/payroll', label: 'Payroll', icon: UsersIcon },
                { id: 'bookkeeping/inventory', label: 'Inventory', icon: PackageIcon },
                { id: 'bookkeeping/forecast', label: 'Cash Flow Forecast', icon: LineChartIcon },
                { id: 'bookkeeping/transactions', label: 'Transactions', icon: ListIcon },
                { id: 'bookkeeping/accounts', label: 'Chart of Accounts', icon: BookOpenIcon },
                { id: 'bookkeeping/reports', label: 'Reports', icon: BarChartIcon },
                { id: 'bookkeeping/recurring', label: 'Recurring', icon: RepeatIcon },
                { id: 'bookkeeping/rules', label: 'AI Rules', icon: SparklesIcon },
                { id: 'bookkeeping/budgets', label: 'Budgets', icon: TargetIcon },
                { id: 'bookkeeping/audit', label: 'Audit Trail', icon: HistoryIcon },
            ]
        },
        { 
            id: 'settings', 
            label: 'Settings', 
            icon: SparklesIcon,
            children: [
                 { id: 'settings/entities', label: 'Entities', icon: Building2Icon },
                 { id: 'settings/tax', label: 'Tax Codes', icon: PercentCircleIcon },
                 { id: 'settings/currencies', label: 'Currencies', icon: CoinsIcon },
            ]
        }
    ];
    
    const renderNav = () => (
        <nav className="sidebar-nav">
            {navItems.map(item => (
                <div key={item.id}>
                    <button 
                        className={`nav-item ${activeView.startsWith(item.id) ? 'active' : ''}`}
                        onClick={() => {
                            if (item.children) {
                                handleToggleSection(item.id);
                                if (!activeView.startsWith(item.id)) {
                                    setActiveView(item.children[0].id);
                                }
                            } else {
                                setActiveView(item.id);
                            }
                        }}
                        data-expanded={expandedSections.includes(item.id)}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                        {item.children && <ChevronDownIcon className="chevron"/>}
                    </button>
                    {item.children && expandedSections.includes(item.id) && (
                        <div className="sub-nav-container">
                            {item.children.map(child => (
                                <button 
                                    key={child.id}
                                    className={`sub-nav-item ${activeView === child.id ? 'active' : ''}`}
                                    onClick={() => setActiveView(child.id)}
                                >
                                    <child.icon style={{width: '16px', height: '16px'}}/>
                                    {child.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );

    const renderContent = () => {
        if (activeView === 'analysis') {
            if (narrative && generatedReportData) {
                 return <ReportDashboard 
                    narrative={narrative}
                    reportData={generatedReportData}
                    isLoading={isAnalysisLoading}
                    generationState={generationState}
                    onBackToInput={() => {
                        setNarrative(null);
                        setGeneratedReportData(null);
                    }}
                    onRetrySection={handleRetrySectionAnalysis}
                    activeSectionId={activeReportSectionId}
                    setActiveSectionId={setActiveReportSectionId}
                />
            }
            return <FinancialDataInput 
                reportData={inputReportData} 
                setReportData={setInputReportData}
                onGenerate={() => handleGenerateReport(inputReportData)} 
                isLoading={isAnalysisLoading} 
                error={analysisError}
            />;
        }
        if (activeView.startsWith('bookkeeping') || activeView.startsWith('settings')) {
            const bookkeepingProps = {
                navigateTo: (view: string) => setActiveView(view),
                entities, taxCodes, activeEntityId,
                transactions, chartOfAccounts, rules, activityLog, budgets, recurringTransactions, customers, invoices, vendors, bills, purchaseOrders, bankTransactions, products, inventory, employees, payRuns, paymentRuns,
                agents, policies, approvalWorkflows, exchangeRates, locations, stockTransfers, goodsReceiptNotes,
                onUpdateAgent: handleUpdateAgent, onUpdatePolicy: handleUpdatePolicy,
                onAddTransaction: addTransaction, onUpdateTransaction: updateTransaction, onDeleteTransaction: deleteTransaction,
                onAddAccount: addAccount, onUpdateAccount: updateAccount, onToggleArchive: toggleArchiveAccount,
                onAddRule: addRule, onDeleteRule: deleteRule, onSetBudgets: setBudgets,
                onAddRecurring: addRecurringTransaction, onUpdateRecurring: updateRecurringTransaction, onDeleteRecurring: deleteRecurringTransaction,
                onAddCustomer: addCustomer, onUpdateCustomer: updateCustomer, onDeleteCustomer: deleteCustomer,
                onAddInvoice: addInvoice, onUpdateInvoice: updateInvoice, onDeleteInvoice: deleteInvoice, onRecordInvoicePayment: recordInvoicePayment,
                onAddVendor: addVendor, onUpdateVendor: updateVendor, onDeleteVendor: deleteVendor,
                onAddBill: addBill, onUpdateBill: updateBill, onDeleteBill: deleteBill, onBillApproval: handleBillApproval,
                onAddPaymentRun: addPaymentRun, onProcessPaymentRun: processPaymentRun,
                onAddPurchaseOrder: addPurchaseOrder, onUpdatePurchaseOrder: updatePurchaseOrder, onPOApproval: handlePOApproval,
                onAddProduct: addProduct, onUpdateProduct: updateProduct, onDeleteProduct: deleteProduct, onAdjustInventory: adjustInventory,
                onAddEmployee: addEmployee, onUpdateEmployee: updateEmployee, onDeleteEmployee: deleteEmployee,
                onApprovePayRun: approvePayRun,
                onMatchTransactions: handleMatchTransactions,
                onCreateAndMatchTransaction: handleCreateAndMatchTransaction,
                onAddGoodsReceiptNote: addGoodsReceiptNote,
                openModal: openCreateModal,
                onGenerateFromBooks: handleGenerateReport,
                isAnalysisLoading: isAnalysisLoading,
            };
            return <DefinitiveBooks subView={activeView.split('/')[1] || 'dashboard'} {...bookkeepingProps} />;
        }
        return <div>Select a module</div>;
    };
    
    const activeViewDetails = navItems.flatMap(i => i.children || i).find(i => i.id === activeView);
    const activeViewTitle = activeViewDetails?.label || "Dashboard";

    return (
        <>
            <aside className="app-sidebar">
                <div className="sidebar-header">
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem', width: '100%'}}>
                         <div style={{backgroundColor: 'var(--color-primary)', padding: '10px', borderRadius: '8px', display: 'flex'}}>
                            <SparklesIcon style={{ color: 'white', width: '24px', height: '24px' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>Definitive AI</h1>
                        </div>
                    </div>
                </div>
                {renderNav()}
                <div style={{marginTop: 'auto'}}>
                    <EntitySwitcher entities={entities} activeEntityId={activeEntityId} setActiveEntityId={setActiveEntityId} />
                </div>
            </aside>
            <main className="app-main">
                <header className="app-header">
                    <div className="header-title">
                        <h1>{activeViewTitle}</h1>
                        <p>{activeView.startsWith('bookkeeping') ? 'AI Bookkeeping Suite' : activeView.startsWith('settings') ? 'Global Settings' : 'Financial Analysis Suite'}</p>
                    </div>
                    <div className="app-header-actions">
                         <Notifications notifications={notifications} setNotifications={setNotifications} />
                        <div className="create-button-wrapper" ref={createDropdownRef}>
                            <button className="button button-primary" onClick={() => setIsCreateDropdownOpen(p => !p)}>
                                <PlusCircleIcon /> Create New
                            </button>
                            {isCreateDropdownOpen && (
                                <div className="create-dropdown">
                                    <button onClick={() => openCreateModal('scan_receipt')} className="button button-tertiary dropdown-item"><CameraIcon /> Scan Receipt</button>
                                    <hr style={{margin: '0.25rem -0.5rem', border: 'none', borderTop: '1px solid var(--color-border)'}} />
                                    <button onClick={() => openCreateModal('invoice')} className="button button-tertiary dropdown-item">Invoice</button>
                                    <button onClick={() => openCreateModal('bill')} className="button button-tertiary dropdown-item">Bill</button>
                                    <button onClick={() => openCreateModal('purchase_order')} className="button button-tertiary dropdown-item">Purchase Order</button>
                                    <button onClick={() => openCreateModal('transaction')} className="button button-tertiary dropdown-item">Transaction</button>
                                    <hr style={{margin: '0.25rem -0.5rem', border: 'none', borderTop: '1px solid var(--color-border)'}} />
                                    <button onClick={() => openCreateModal('customer')} className="button button-tertiary dropdown-item">Customer</button>
                                    <button onClick={() => openCreateModal('vendor')} className="button button-tertiary dropdown-item">Vendor</button>
                                    <button onClick={() => openCreateModal('employee')} className="button button-tertiary dropdown-item">Employee</button>
                                    <hr style={{margin: '0.25rem -0.5rem', border: 'none', borderTop: '1px solid var(--color-border)'}} />
                                     <button onClick={() => openCreateModal('account')} className="button button-tertiary dropdown-item">Account</button>
                                    <button onClick={() => openCreateModal('product')} className="button button-tertiary dropdown-item">Product</button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="main-content">
                    {renderContent()}
                </div>

                {openModal === 'transaction' && <AddTransactionModal isOpen={true} onClose={() => setOpenModal(null)} onSave={ (data, id) => { id ? updateTransaction({id, entityId: activeEntityId, reviewedBy: 'user', reconciliationStatus: 'unreconciled', ...data}) : addTransaction(data); setOpenModal(null); } } initialData={modalData.transaction} chartOfAccounts={chartOfAccounts} rules={rules} />}
                {openModal === 'invoice' && <AddEditInvoice isOpen={true} onClose={() => setOpenModal(null)} onSave={(data) => { 'id' in data ? updateInvoice(data) : addInvoice(data as Omit<Invoice, 'id' | 'entityId'>) }} existingInvoice={modalData.invoice as Invoice | null} customers={customers} products={products} activeEntityId={activeEntityId} taxCodes={taxCodes} />}
                {openModal === 'bill' && <AddEditBill isOpen={true} onClose={() => setOpenModal(null)} onSave={(data) => { 'id' in data ? updateBill(data) : addBill(data as Omit<Bill, 'id' | 'entityId'>) }} existingBill={modalData.bill as Bill | null} vendors={vendors} chartOfAccounts={chartOfAccounts} products={products} activeEntityId={activeEntityId} exchangeRates={exchangeRates} entities={entities} taxCodes={taxCodes}/>}
                {openModal === 'purchase_order' && <AddEditPurchaseOrderModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data) => { 'id' in data ? updatePurchaseOrder(data) : addPurchaseOrder(data as Omit<PurchaseOrder, 'id' | 'entityId'>) }} existingPurchaseOrder={modalData.purchase_order || null} vendors={vendors} chartOfAccounts={chartOfAccounts} products={products} activeEntityId={activeEntityId} />}
                {openModal === 'customer' && <AddEditCustomerModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data, id) => { id ? updateCustomer({id, entityId: activeEntityId, ...data}) : addCustomer(data) }} existingCustomer={modalData.customer || null} />}
                {openModal === 'vendor' && <AddEditVendorModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data, id) => { id ? updateVendor({id, entityId: activeEntityId, ...data}) : addVendor(data) }} existingVendor={modalData.vendor || null} />}
                {openModal === 'employee' && <AddEditEmployeeModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data, id) => {id ? updateEmployee({id, entityId: activeEntityId, ...data}) : addEmployee(data)}} existingEmployee={modalData.employee || null} />}
                {openModal === 'account' && <AddAccountModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data, id) => { id ? updateAccount({id, isArchived: false, ...data}) : addAccount(data); setOpenModal(null); }} existingAccount={modalData.account?.existingAccount} prefilledParentId={modalData.account?.parentId} allAccounts={chartOfAccounts} />}
                {openModal === 'recurring' && <AddRecurringModal isOpen={true} onClose={() => setOpenModal(null)} onSave={addRecurringTransaction} onUpdate={updateRecurringTransaction} existingData={modalData.recurring} chartOfAccounts={chartOfAccounts} />}
                {openModal === 'product' && <AddEditProductModal isOpen={true} onClose={() => setOpenModal(null)} onSave={(data, id) => { id ? updateProduct({id, entityId: activeEntityId, ...data}) : addProduct(data) }} existingProduct={modalData.product || null} />}
                {openModal === 'inventory_adjust' && modalData.inventory_adjust && <AdjustInventoryModal isOpen={true} onClose={() => setOpenModal(null)} onSave={adjustInventory} product={modalData.inventory_adjust.product} location={modalData.inventory_adjust.location} currentQuantity={modalData.inventory_adjust.currentQuantity} />}
                {openModal === 'approve_reject' && modalData.approvalItem && <ApproveRejectModal isOpen={true} onClose={() => setOpenModal(null)} onSave={'poDate' in modalData.approvalItem ? handlePOApproval : handleBillApproval} item={modalData.approvalItem} />}
                {openModal === 'scan_receipt' && <ScanReceiptModal isOpen={true} onClose={() => setOpenModal(null)} onConfirm={handleReceiptScanned} />}
                {openModal === 'kpi_deep_dive' && modalData.kpi_deep_dive && <KPIDeepDiveModal isOpen={true} onClose={() => setOpenModal(null)} title={modalData.kpi_deep_dive.title} data={modalData.kpi_deep_dive.data} />}
                {openModal === 'goods_receipt' && modalData.goods_receipt && <AddGoodsReceiptModal isOpen={true} onClose={() => setOpenModal(null)} onSave={addGoodsReceiptNote} purchaseOrder={modalData.goods_receipt.purchaseOrder} locations={locations.filter(l => l.entityId === activeEntityId)} inventory={inventory} />}
                {openModal === 'record_payment' && modalData.invoice_payment && <RecordPaymentModal isOpen={true} onClose={() => setOpenModal(null)} onSave={recordInvoicePayment} invoice={modalData.invoice_payment.invoice} />}
            </main>
        </>
    );
};

export default App;