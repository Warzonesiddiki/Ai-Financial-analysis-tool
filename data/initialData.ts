import { Transaction, ChartOfAccount, BankTransaction, Product, InventoryItem, Employee, AIAgent, AIPolicy, Notification, Vendor, Bill, ApprovalWorkflow, PurchaseOrder, Entity, TaxCode, CurrencyExchangeRate, Location, StockTransfer, GoodsReceiptNote, PaymentRun } from '../types';

// --- NEW MULTI-ENTITY & TAX DATA ---
export const initialLocations: Location[] = [
    { id: 'loc_us_wh_1', name: 'US Main Warehouse', address: '123 Warehouse Way, CA', entityId: 'ent_sub_us' },
    { id: 'loc_uae_store_1', name: 'Dubai Retail Store', address: '456 Retail Row, Dubai', entityId: 'ent_sub_uae' },
];

export const initialEntities: Entity[] = [
    { id: 'ent_parent', name: 'InnovateX Global Holdings', currency: 'USD', taxJurisdiction: 'US' },
    { id: 'ent_sub_us', name: 'InnovateX USA LLC', parentId: 'ent_parent', currency: 'USD', taxJurisdiction: 'US-CA', primaryLocationId: 'loc_us_wh_1' },
    { id: 'ent_sub_uae', name: 'InnovateX Middle East FZCO', parentId: 'ent_parent', currency: 'AED', taxJurisdiction: 'UAE', primaryLocationId: 'loc_uae_store_1' },
];

export const initialTaxCodes: TaxCode[] = [
    { id: 'tax_uae_vat_5', name: 'UAE VAT 5%', rate: 0.05, jurisdiction: 'UAE' },
    { id: 'tax_us_ca_sales_825', name: 'CA Sales Tax 8.25%', rate: 0.0825, jurisdiction: 'US-CA' },
    { id: 'tax_zero', name: 'Zero Rated', rate: 0, jurisdiction: 'GLOBAL' },
];

// --- NEW MULTI-CURRENCY DATA ---
export const initialExchangeRates: CurrencyExchangeRate[] = [
    { from: 'AED', to: 'USD', rate: 0.272, date: new Date().toISOString().split('T')[0] },
    { from: 'EUR', to: 'USD', rate: 1.08, date: new Date().toISOString().split('T')[0] },
];

const defaultEntityId = 'ent_sub_us'; // All initial data will belong to the US subsidiary
const uaeEntityId = 'ent_sub_uae';

// --- NEW GOODS RECEIPT DATA ---
export const initialGoodsReceiptNotes: GoodsReceiptNote[] = [];

// --- NEW PAYMENT PROCESSING DATA ---
export const initialPaymentRuns: PaymentRun[] = [];

// --- EXISTING DATA (NOW ENTITY-AWARE) ---
export const initialChartOfAccounts: ChartOfAccount[] = [
  { id: 'asset_bank', accountNumber: '1000', name: 'Bank Accounts', type: 'Asset', description: 'All bank and cash accounts.'},
  { id: 'asset_checking', accountNumber: '1010', parentId: 'asset_bank', name: 'Business Checking', type: 'Asset', description: 'Primary checking account.' },
  { id: 'asset_savings', accountNumber: '1020', parentId: 'asset_bank', name: 'Business Savings', type: 'Asset', description: 'Savings and reserve funds.' },
  { id: 'asset_ar', accountNumber: '1200', name: 'Accounts Receivable', type: 'Asset', description: 'Money owed to the company by customers.' },
  { id: 'asset_inventory', accountNumber: '1300', name: 'Inventory Asset', type: 'Asset', description: 'Value of products held for sale.' },
  { id: 'liab_ap', accountNumber: '2000', name: 'Accounts Payable', type: 'Liability', description: 'Money the company owes to its vendors.' },
  { id: 'liab_credit_card', accountNumber: '2100', name: 'Credit Cards', type: 'Liability', description: 'Balances on company credit cards.' },
  { id: 'eq_capital', accountNumber: '3000', name: 'Owner\'s Equity', type: 'Equity', description: 'The owner\'s stake in the company.' },
  { id: 'inc_sales', accountNumber: '4000', name: 'Sales Revenue', type: 'Income', description: 'Revenue from selling goods or services.' },
  { id: 'inc_product_sales', accountNumber: '4010', parentId: 'inc_sales', name: 'Product Sales', type: 'Income', description: 'Revenue from selling physical or digital products.' },
  { id: 'inc_consulting', accountNumber: '4100', name: 'Consulting Income', type: 'Income', description: 'Revenue from providing consulting services.' },
  { id: 'inc_interest', accountNumber: '4900', name: 'Interest Income', type: 'Income', description: 'Income earned from investments or bank accounts.' },
  { id: 'inc_other', accountNumber: '4999', name: 'Other Income', type: 'Income', description: 'Miscellaneous income sources.' },
  { id: 'exp_cogs', accountNumber: '5000', name: 'Cost of Goods Sold', type: 'Expense', description: 'Direct costs of producing goods.' },
  { id: 'exp_opex', accountNumber: '6000', name: 'Operating Expenses', type: 'Expense', description: 'Parent account for all operating expenses.' },
  { id: 'exp_advertising', accountNumber: '6010', parentId: 'exp_opex', name: 'Advertising & Marketing', type: 'Expense', description: 'Costs for promoting the business.' },
  { id: 'exp_contractors', accountNumber: '6100', parentId: 'exp_opex', name: 'Contractors & Freelancers', type: 'Expense', description: 'Payments to independent contractors.' },
  { id: 'exp_ga', accountNumber: '7000', parentId: 'exp_opex', name: 'General & Administrative', type: 'Expense', description: 'Parent for G&A expenses.'},
  { id: 'exp_bank_fees', accountNumber: '7010', parentId: 'exp_ga', name: 'Bank Fees', type: 'Expense', description: 'Charges from financial institutions.' },
  { id: 'exp_insurance', accountNumber: '7020', parentId: 'exp_ga', name: 'Insurance', type: 'Expense', description: 'Premiums for business insurance.' },
  { id: 'exp_legal', accountNumber: '7030', parentId: 'exp_ga', name: 'Legal & Professional Services', type: 'Expense', description: 'Fees for lawyers, accountants, etc.' },
  { id: 'exp_meals', accountNumber: '7040', parentId: 'exp_ga', name: 'Meals & Entertainment', type: 'Expense', description: 'Business-related dining and entertainment.' },
  { id: 'exp_office', accountNumber: '7050', parentId: 'exp_ga', name: 'Office Supplies & Expenses', type: 'Expense', description: 'General office costs and supplies.' },
  { id: 'exp_rent', accountNumber: '7060', parentId: 'exp_ga', name: 'Rent & Lease', type: 'Expense', description: 'Payments for office or equipment rental.' },
  { id: 'exp_repairs', accountNumber: '7070', parentId: 'exp_ga', name: 'Repairs & Maintenance', type: 'Expense', description: 'Costs for maintaining equipment and property.' },
  { id: 'exp_software', accountNumber: '7080', parentId: 'exp_ga', name: 'Software & Subscriptions', type: 'Expense', description: 'Costs for SaaS, software licenses, and subscriptions.' },
  { id: 'exp_travel', accountNumber: '7090', parentId: 'exp_ga', name: 'Travel Expenses', type: 'Expense', description: 'Costs for business-related travel.' },
  { id: 'exp_utilities', accountNumber: '7100', parentId: 'exp_ga', name: 'Utilities', type: 'Expense', description: 'Costs for electricity, water, internet, etc.' },
  { id: 'exp_salaries', accountNumber: '7200', parentId: 'exp_ga', name: 'Salaries & Wages', type: 'Expense', description: 'Employee salaries and wages.' },
  { id: 'exp_other', accountNumber: '7999', parentId: 'exp_opex', name: 'Other Business Expenses', type: 'Expense', description: 'Miscellaneous business expenses.' },
  { id: 'exp_fx', accountNumber: '8000', parentId: 'exp_opex', name: 'Foreign Exchange Gain/Loss', type: 'Expense', description: 'Gains or losses from foreign currency fluctuations.' },
];

export const initialTransactions: Transaction[] = [
    { id: '1', date: '2024-07-15', description: 'Monthly subscription for Adobe Creative Cloud', accountId: 'exp_software', amount: -59.99, reconciliationStatus: 'unreconciled', reviewedBy: 'user', entityId: defaultEntityId, currency: 'USD', exchangeRate: 1, baseCurrencyAmount: -59.99 },
    { id: '2', date: '2024-07-14', description: 'Client Payment - Project Phoenix', accountId: 'inc_consulting', amount: 5000.00, reconciliationStatus: 'unreconciled', reviewedBy: 'user', entityId: defaultEntityId, currency: 'USD', exchangeRate: 1, baseCurrencyAmount: 5000.00 },
    { id: '3', date: '2024-07-12', description: 'Lunch meeting with potential client', accountId: 'exp_meals', amount: -85.50, reconciliationStatus: 'unreconciled', reviewedBy: 'ai', confidenceScore: 0.98, entityId: defaultEntityId, currency: 'USD', exchangeRate: 1, baseCurrencyAmount: -85.50 },
];

export const initialBankTransactions: BankTransaction[] = [
    { id: 'btx_1', date: '2024-07-15', description: 'ADOBE SYSTEMS INC', amount: -59.99, bankAccountId: 'asset_checking' },
    { id: 'btx_2', date: '2024-07-15', description: 'STRIPE PAYOUT', amount: 4950.00, bankAccountId: 'asset_checking' },
    { id: 'btx_3', date: '2024-07-13', description: 'SQ *THE CORNER CAFE', amount: -85.50, bankAccountId: 'asset_checking' },
    { id: 'btx_4', date: '2024-07-11', description: 'INTEREST PAYMENT', amount: 10.25, bankAccountId: 'asset_savings' },
    { id: 'btx_5', date: '2024-07-10', description: 'AMAZON.COM*MK87UI', amount: -124.20, bankAccountId: 'asset_checking' },
];

export const initialProducts: Product[] = [
    { id: 'prod_1', sku: 'WDGT-001', name: 'Standard Widget', description: 'A high-quality standard widget.', purchasePrice: 10, salePrice: 25, entityId: defaultEntityId },
    { id: 'prod_2', sku: 'WDGT-002', name: 'Premium Widget', description: 'A premium, long-lasting widget.', purchasePrice: 20, salePrice: 50, entityId: defaultEntityId },
];

export const initialInventory: InventoryItem[] = [
    { productId: 'prod_1', locationId: 'loc_us_wh_1', quantity: 100 },
    { productId: 'prod_2', locationId: 'loc_us_wh_1', quantity: 50 },
    { productId: 'prod_1', locationId: 'loc_uae_store_1', quantity: 20 },
];

export const initialStockTransfers: StockTransfer[] = [];

export const initialEmployees: Employee[] = [
    { id: 'emp_1', name: 'Alice Johnson', email: 'alice@example.com', payType: 'salary', payRate: 80000, entityId: defaultEntityId },
    { id: 'emp_2', name: 'Bob Williams', email: 'bob@example.com', payType: 'hourly', payRate: 25, entityId: defaultEntityId },
];

export const initialAgents: AIAgent[] = [
    { id: 'agent_categorization', name: 'AI Transaction Categorization', description: 'Automatically suggests expense categories for new bank transactions based on descriptions and past behavior.', isActive: true },
    { id: 'agent_reconciliation', name: 'Continuous Reconciliation', description: 'Automatically matches bank transactions with book entries based on amount, date, and description.', isActive: true },
    { id: 'agent_ap', name: 'Accounts Payable Automation', description: 'Ingests bills from emails, scans receipts, and prepares them for your review, flagging potential duplicates.', isActive: false },
    { id: 'agent_ar_dunning', name: 'AR Dunning Agent', description: 'Automatically sends reminders for overdue invoices to customers based on predefined schedules.', isActive: false },
    { id: 'agent_budget', name: 'Budget Monitoring Agent', description: 'Monitors spending against your budgets and sends alerts when you approach or exceed limits.', isActive: true },
    { id: 'agent_fraud', name: 'Fraud Detection Agent', description: 'Analyzes transactions for unusual patterns, amounts, or vendors to flag potentially fraudulent activity.', isActive: false },
];

export const initialPolicies: AIPolicy[] = [
    { id: 'autoCategorizeConfidence', name: 'Auto-Categorization Confidence', description: 'The minimum AI confidence score required to automatically categorize a transaction. Anything lower will be flagged for manual review.', value: 95, type: 'percentage' },
    { id: 'autoReconcileLimit', name: 'Auto-Reconciliation Amount Limit', description: 'The maximum transaction amount the AI is allowed to automatically match and reconcile without human approval.', value: 1000, type: 'currency' },
];

export const initialNotifications: Notification[] = [
    { id: '1', timestamp: new Date().toISOString(), type: 'action_required', message: 'Invoice INV-001 is 15 days overdue. Consider sending a reminder.', link: 'bookkeeping/sales', isRead: false },
    { id: '2', timestamp: new Date().toISOString(), type: 'warning', message: 'You are at 92% of your "Software & Subscriptions" budget for the month.', link: 'bookkeeping/budgets', isRead: false },
    { id: '3', timestamp: new Date().toISOString(), type: 'success', message: 'AI Agent successfully categorized 12 new bank transactions.', link: 'bookkeeping/banking', isRead: true },
];

export const initialVendors: Vendor[] = [
    { id: 'vend_1', name: 'Staples', email: 'orders@staples.com', address: '123 Office Park, Framingham, MA', entityId: defaultEntityId },
    { id: 'vend_2', name: 'CloudNova Hosting', email: 'support@cloudnova.com', address: '456 Server Farm Rd, Ashburn, VA', entityId: defaultEntityId },
    { id: 'vend_3', name: 'Dubai Office Supplies', email: 'sales@dos.ae', address: '1 Sheikh Zayed Rd, Dubai, UAE', entityId: uaeEntityId },
];

export const initialBills: Bill[] = [
    {
        id: 'BILL-001',
        vendorId: 'vend_1',
        billDate: '2024-07-20',
        dueDate: '2024-08-19',
        lineItems: [{ id: '1', description: 'Office Chairs', quantity: 2, unitPrice: 350, accountId: 'exp_office' }],
        status: 'Awaiting Approval',
        approvalHistory: [{ approver: 'Manager', decision: 'Pending', timestamp: new Date().toISOString() }],
        entityId: defaultEntityId,
        currency: 'USD',
        exchangeRate: 1,
        baseCurrencyAmount: 700,
    },
    {
        id: 'BILL-002',
        vendorId: 'vend_2',
        billDate: '2024-07-22',
        dueDate: '2024-08-21',
        lineItems: [{ id: '1', description: 'Monthly Server Hosting', quantity: 1, unitPrice: 1500, accountId: 'exp_software' }],
        status: 'Awaiting Approval',
        approvalHistory: [
            { approver: 'Manager', decision: 'Pending', timestamp: new Date().toISOString() },
            { approver: 'Senior Manager', decision: 'Pending', timestamp: new Date().toISOString() },
        ],
        entityId: defaultEntityId,
        currency: 'USD',
        exchangeRate: 1,
        baseCurrencyAmount: 1500,
    },
    {
        id: 'BILL-003',
        vendorId: 'vend_3',
        billDate: '2024-07-25',
        dueDate: '2024-08-24',
        lineItems: [{ id: '1', description: 'Office Refreshments', quantity: 1, unitPrice: 2000, accountId: 'exp_office' }],
        status: 'Awaiting Payment',
        approvalHistory: [{ approver: 'Manager', decision: 'Approved', timestamp: new Date().toISOString() }],
        entityId: uaeEntityId,
        currency: 'AED',
        exchangeRate: 0.272,
        baseCurrencyAmount: 544,
    },
];


export const initialApprovalWorkflows: ApprovalWorkflow[] = [
    {
        id: 'wf_1',
        name: 'Standard Bill Approval',
        rules: [
            { id: 'rule_1', minAmount: 0, maxAmount: 999.99, requiredApprovers: ['Manager'] },
            { id: 'rule_2', minAmount: 1000, maxAmount: 4999.99, requiredApprovers: ['Manager', 'Senior Manager'] },
            { id: 'rule_3', minAmount: 5000, requiredApprovers: ['Manager', 'Senior Manager', 'VP Finance'] },
        ]
    }
];

export const initialPurchaseOrders: PurchaseOrder[] = [
    {
        id: 'PO-001',
        vendorId: 'vend_1',
        poDate: '2024-08-01',
        deliveryDate: '2024-08-15',
        lineItems: [
            { id: '1', productId: 'prod_1', description: 'Standard Widget', quantity: 50, unitPrice: 10, accountId: 'exp_cogs' },
            { id: '2', description: 'Shipping', quantity: 1, unitPrice: 100, accountId: 'exp_cogs' },
        ],
        status: 'Approved',
        approvalHistory: [{ approver: 'Manager', decision: 'Approved', timestamp: new Date().toISOString(), notes: 'Approved as per budget.' }],
        entityId: defaultEntityId,
        currency: 'USD', exchangeRate: 1, baseCurrencyAmount: 600,
    },
    {
        id: 'PO-002',
        vendorId: 'vend_2',
        poDate: '2024-08-05',
        deliveryDate: '2024-08-10',
        lineItems: [
            { id: '1', description: 'Premium Server Upgrade', quantity: 1, unitPrice: 2500, accountId: 'exp_software' }
        ],
        status: 'Awaiting Approval',
        approvalHistory: [{ approver: 'Senior Manager', decision: 'Pending', timestamp: new Date().toISOString() }],
        entityId: defaultEntityId,
        currency: 'USD', exchangeRate: 1, baseCurrencyAmount: 2500,
    },
     {
        id: 'PO-003',
        vendorId: 'vend_1',
        poDate: '2024-08-06',
        deliveryDate: '2024-08-20',
        lineItems: [
            { id: '1', productId: 'prod_2', description: 'Premium Widget', quantity: 20, unitPrice: 20, accountId: 'exp_cogs' },
        ],
        status: 'Draft',
        entityId: defaultEntityId,
        currency: 'USD', exchangeRate: 1, baseCurrencyAmount: 400,
    }
];