import React from 'react';
import { GoodsReceiptNote, PurchaseOrder, Location } from '../../../types';
import { PackageCheckIcon } from '../../icons';

interface GoodsReceiptManagerProps {
    goodsReceiptNotes: GoodsReceiptNote[];
    purchaseOrders: PurchaseOrder[];
    locations: Location[];
}

export const GoodsReceiptManager: React.FC<GoodsReceiptManagerProps> = ({ goodsReceiptNotes, purchaseOrders, locations }) => {

    const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || 'Unknown';
    const getVendorName = (poId: string) => {
        const po = purchaseOrders.find(p => p.id === poId);
        // This part needs vendor data, which is not passed. This is a simplification.
        return po ? `Vendor for PO ${po.id}` : 'Unknown';
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <PackageCheckIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Goods Receipt Notes</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                A record of all goods received from vendors against purchase orders.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>GRN #</th>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>Purchase Order</th>
                            <th style={{ padding: '0.75rem' }}>Received At</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                         {goodsReceiptNotes.length === 0 ? (
                             <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No goods have been received yet.</td></tr>
                        ) : goodsReceiptNotes.map(grn => (
                            <tr key={grn.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>{grn.id}</td>
                                <td style={{ padding: '0.75rem' }}>{grn.receiptDate}</td>
                                <td style={{ padding: '0.75rem' }}>{grn.purchaseOrderId}</td>
                                <td style={{ padding: '0.75rem' }}>{getLocationName(grn.locationId)}</td>
                                <td style={{ padding: '0.75rem' }}>{grn.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};