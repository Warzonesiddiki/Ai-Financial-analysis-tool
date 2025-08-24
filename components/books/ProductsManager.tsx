
import React from 'react';
import { Product } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon } from '../icons';

interface ProductsManagerProps {
    products: Product[];
    onDelete: (id: string) => void;
    onEdit: (product: Product) => void;
    onAddNew: () => void;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ products, onDelete, onEdit, onAddNew }) => {

    const handleDeleteProduct = (id: string) => {
        if (window.confirm("Are you sure you want to delete this product? This cannot be undone.")) {
            onDelete(id);
        }
    };
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Products & Services</h2>
                <button onClick={onAddNew} className="button button-primary">
                    <PlusCircleIcon /> New Product
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>SKU</th>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Purchase Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Sale Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {products.length === 0 ? (
                             <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No products yet.</td></tr>
                        ) : products.map(product => (
                            <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{product.sku}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{product.name}</td>
                                <td style={{ padding: '0.75rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.description}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(product.purchasePrice)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(product.salePrice)}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => onEdit(product)} className="button button-tertiary" style={{ padding: '0.5rem' }}><EditIcon width="16" /></button>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="button button-tertiary" style={{ padding: '0.5rem' }}><TrashIcon width="16" style={{color: 'var(--color-error)'}}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
