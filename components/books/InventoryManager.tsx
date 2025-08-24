import React from 'react';
import { Product, InventoryItem, Location } from '../../types';
import { EditIcon } from '../icons';

interface InventoryManagerProps {
    products: Product[];
    inventory: InventoryItem[];
    locations: Location[];
    onAdjust: (product: Product, location: Location, currentQuantity: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products, inventory, locations, onAdjust }) => {

    const handleOpenModal = (product: Product, location: Location) => {
        const currentItem = inventory.find(i => i.productId === product.id && i.locationId === location.id);
        onAdjust(product, location, currentItem?.quantity || 0);
    };

    const getStockForProduct = (productId: string, locationId: string) => {
        return inventory.find(item => item.productId === productId && item.locationId === locationId)?.quantity || 0;
    }

    return (
        <div className="card">
            <h2 style={{ margin: 0, border: 'none', marginBottom: '1.5rem' }}>Inventory Stock Levels by Location</h2>
            
             <div className="inventory-manager-grid">
                {locations.map(location => (
                    <div key={location.id} className="location-stock-card">
                        <div className="location-stock-card-header">
                            <span>{location.name}</span>
                        </div>
                        <div className="location-stock-card-body">
                            {products.length > 0 ? products.map(product => (
                                <div key={product.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <span style={{fontWeight: 500}}>{product.name}</span>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                        <span style={{fontFamily: 'monospace', fontWeight: 600}}>{getStockForProduct(product.id, location.id)}</span>
                                        <button onClick={() => handleOpenModal(product, location)} className="button button-tertiary" style={{padding: '0.2rem'}}>
                                            <EditIcon width={14} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p style={{color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center'}}>No products created yet.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
