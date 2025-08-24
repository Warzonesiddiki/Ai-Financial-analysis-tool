import React, { useState } from 'react';
import { Bill, Vendor, ChartOfAccount, Product, PurchaseOrder, TaxCode, PaymentRun } from '../../types';
import { BillsManager } from './BillsManager';
import { VendorsManager } from './VendorsManager';
import { PurchaseOrdersManager } from './PurchaseOrdersManager';
import { APPaymentsHub } from './payments/APPaymentsHub';

interface PurchasesProps {
    bills: Bill[];
    purchaseOrders: PurchaseOrder[];
    vendors: Vendor[];
    chartOfAccounts: ChartOfAccount[];
    products: Product[];
    taxCodes: TaxCode[];
    paymentRuns: PaymentRun[];
    onDeleteVendor: (id: string) => void;
    onDeleteBill: (id: string) => void;
    onBillApproval: (billId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
    onPOApproval: (poId: string, decision: 'Approved' | 'Rejected', notes?: string) => void;
    onUpdateBill: (bill: Bill) => void;
    onAddPaymentRun: (billIds: string[], paymentDate: string) => void;
    onProcessPaymentRun: (paymentRunId: string) => void;
    openModal: (type: 'bill' | 'vendor' | 'approve_reject' | 'purchase_order' | 'goods_receipt', data: any) => void;
}

export const Purchases: React.FC<PurchasesProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'purchase_orders' | 'bills' | 'vendors' | 'payments'>('purchase_orders');
    
    return (
        <div>
            <div className="tabs" style={{marginBottom: 0}}>
                <button 
                    onClick={() => setActiveTab('purchase_orders')} 
                    className={`tab-button ${activeTab === 'purchase_orders' ? 'active' : ''}`}
                >
                    Purchase Orders
                </button>
                <button 
                    onClick={() => setActiveTab('bills')} 
                    className={`tab-button ${activeTab === 'bills' ? 'active' : ''}`}
                >
                    Bills
                </button>
                 <button 
                    onClick={() => setActiveTab('payments')} 
                    className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
                >
                    Bill Payments
                </button>
                <button 
                    onClick={() => setActiveTab('vendors')} 
                    className={`tab-button ${activeTab === 'vendors' ? 'active' : ''}`}
                >
                    Vendors
                </button>
            </div>
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'purchase_orders' && (
                    <PurchaseOrdersManager
                        purchaseOrders={props.purchaseOrders}
                        vendors={props.vendors}
                        onApproveOrReject={(po) => props.openModal('approve_reject', { approvalItem: po })}
                        onEdit={(po) => props.openModal('purchase_order', { purchase_order: po })}
                        onAddNew={() => props.openModal('purchase_order', { purchase_order: null })}
                        onConvertToBill={(po) => {
                             const newBill: Omit<Bill, 'id'> = {
                                vendorId: po.vendorId,
                                billDate: new Date().toISOString().split('T')[0],
                                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
                                lineItems: po.lineItems.map(li => ({...li, purchaseOrderLineId: li.id})),
                                status: 'Draft',
                                purchaseOrderId: po.id,
                                entityId: po.entityId,
                                currency: po.currency,
                                exchangeRate: po.exchangeRate,
                                baseCurrencyAmount: po.baseCurrencyAmount,
                             };
                             props.openModal('bill', { bill: newBill });
                        }}
                        onReceiveItems={(po) => props.openModal('goods_receipt', { goods_receipt: { purchaseOrder: po }})}
                    />
                )}
                {activeTab === 'bills' && (
                    <BillsManager
                        bills={props.bills}
                        vendors={props.vendors}
                        chartOfAccounts={props.chartOfAccounts}
                        products={props.products}
                        onDelete={props.onDeleteBill}
                        onEdit={(bill) => props.openModal('bill', { bill })}
                        onAddNew={() => props.openModal('bill', { bill: null })}
                        onApproveOrReject={(bill) => props.openModal('approve_reject', { approvalItem: bill })}
                    />
                )}
                {activeTab === 'payments' && (
                    <APPaymentsHub 
                        bills={props.bills}
                        vendors={props.vendors}
                        paymentRuns={props.paymentRuns}
                        onAddPaymentRun={props.onAddPaymentRun}
                        onProcessPaymentRun={props.onProcessPaymentRun}
                    />
                )}
                {activeTab === 'vendors' && (
                    <VendorsManager
                        vendors={props.vendors}
                        onDelete={props.onDeleteVendor}
                        onEdit={(vendor) => props.openModal('vendor', { vendor })}
                        onAddNew={() => props.openModal('vendor', { vendor: null })}
                    />
                )}
            </div>
        </div>
    );
};