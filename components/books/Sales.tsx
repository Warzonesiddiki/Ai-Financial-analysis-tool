import React, { useState } from 'react';
import { Invoice, Customer, Product, TaxCode } from '../../types';
import { InvoicesManager } from './InvoicesManager';
import { CustomersManager } from './CustomersManager';

interface SalesProps {
    invoices: Invoice[];
    customers: Customer[];
    products: Product[];
    taxCodes: TaxCode[];
    onDeleteCustomer: (id: string) => void;
    onDeleteInvoice: (id: string) => void;
    openModal: (type: 'invoice' | 'customer' | 'record_payment', data: any) => void;
}

export const Sales: React.FC<SalesProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
    
    return (
        <div>
            <div className="tabs" style={{marginBottom: 0}}>
                <button 
                    onClick={() => setActiveTab('invoices')} 
                    className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
                >
                    Invoices
                </button>
                <button 
                    onClick={() => setActiveTab('customers')} 
                    className={`tab-button ${activeTab === 'customers' ? 'active' : ''}`}
                >
                    Customers
                </button>
            </div>
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'invoices' && (
                    <InvoicesManager 
                        invoices={props.invoices}
                        customers={props.customers}
                        products={props.products}
                        onDelete={props.onDeleteInvoice}
                        onEdit={(invoice) => props.openModal('invoice', { invoice })}
                        onAddNew={() => props.openModal('invoice', { invoice: null })}
                        onRecordPayment={(invoice) => props.openModal('record_payment', { invoice_payment: { invoice }})}
                    />
                )}
                {activeTab === 'customers' && (
                    <CustomersManager 
                        customers={props.customers}
                        onDelete={props.onDeleteCustomer}
                        onEdit={(customer) => props.openModal('customer', { customer })}
                        onAddNew={() => props.openModal('customer', { customer: null })}
                    />
                )}
            </div>
        </div>
    );
};