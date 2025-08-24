import React from 'react';
import { StockTransfer, Location, Product } from '../../../types';
import { PlusCircleIcon, ArrowRightLeftIcon } from '../../icons';

interface StockTransferManagerProps {
    stockTransfers: StockTransfer[];
    locations: Location[];
    products: Product[];
    onAddNew: () => void;
}

export const StockTransferManager: React.FC<StockTransferManagerProps> = ({ stockTransfers, locations, products, onAddNew }) => {

    const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || 'Unknown Location';

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ArrowRightLeftIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                    <h2 style={{ margin: 0, border: 'none' }}>Stock Transfers</h2>
                </div>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Transfer
                </button>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Record and track the movement of inventory between your different locations.
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>From</th>
                            <th style={{ padding: '0.75rem' }}>To</th>
                            <th style={{ padding: '0.75rem' }}>Items</th>
                            <th style={{ padding: '0.75rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                         {stockTransfers.length === 0 ? (
                             <tr><td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No stock transfers have been recorded.</td></tr>
                        ) : stockTransfers.map(transfer => (
                            <tr key={transfer.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem' }}>{transfer.date}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{getLocationName(transfer.fromLocationId)}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{getLocationName(transfer.toLocationId)}</td>
                                <td style={{ padding: '0.75rem' }}>
                                    {transfer.items.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        return <div key={item.productId}>{item.quantity} x {product?.name || 'Unknown'}</div>
                                    })}
                                </td>
                                <td style={{ padding: '0.75rem' }}>{transfer.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
