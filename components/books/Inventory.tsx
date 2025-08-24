import React, { useState } from 'react';
import { Product, InventoryItem, Location, StockTransfer, GoodsReceiptNote, PurchaseOrder } from '../../types';
import { ProductsManager } from './ProductsManager';
import { InventoryManager } from './InventoryManager';
import { LocationManagement } from './inventory/LocationManagement';
import { StockTransferManager } from './inventory/StockTransferManager';
import { GoodsReceiptManager } from './inventory/GoodsReceiptManager';

interface InventoryProps {
    products: Product[];
    inventory: InventoryItem[];
    locations: Location[];
    stockTransfers: StockTransfer[];
    goodsReceiptNotes: GoodsReceiptNote[];
    purchaseOrders: PurchaseOrder[];
    onAddProduct: (product: Omit<Product, 'id' | 'entityId'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (id: string) => void;
    onAdjustInventory: (productId: string, locationId: string, newQuantity: number, reason: string) => void;
    openModal: (type: any, data: any) => void;
}

type InventoryTab = 'products' | 'stock_levels' | 'receipts' | 'transfers' | 'locations';

export const Inventory: React.FC<InventoryProps> = (props) => {
    const [activeTab, setActiveTab] = useState<InventoryTab>('products');

    return (
        <div>
            <div className="tabs" style={{marginBottom: 0}}>
                <button 
                    onClick={() => setActiveTab('products')} 
                    className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                >
                    Products
                </button>
                <button 
                    onClick={() => setActiveTab('stock_levels')} 
                    className={`tab-button ${activeTab === 'stock_levels' ? 'active' : ''}`}
                >
                    Stock Levels
                </button>
                 <button 
                    onClick={() => setActiveTab('receipts')} 
                    className={`tab-button ${activeTab === 'receipts' ? 'active' : ''}`}
                >
                    Goods Receipts
                </button>
                <button 
                    onClick={() => setActiveTab('transfers')} 
                    className={`tab-button ${activeTab === 'transfers' ? 'active' : ''}`}
                >
                    Stock Transfers
                </button>
                <button 
                    onClick={() => setActiveTab('locations')} 
                    className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
                >
                    Locations
                </button>
            </div>
            <div className="tab-content" style={{paddingTop: 0}}>
                {activeTab === 'products' && (
                    <ProductsManager
                        products={props.products}
                        onDelete={props.onDeleteProduct}
                        onEdit={(product) => props.openModal('product', { product })}
                        onAddNew={() => props.openModal('product', { product: null })}
                    />
                )}
                {activeTab === 'stock_levels' && (
                    <InventoryManager
                        products={props.products}
                        inventory={props.inventory}
                        locations={props.locations}
                        onAdjust={(product, location, currentQuantity) => props.openModal('inventory_adjust', { inventory_adjust: { product, location, currentQuantity }})}
                    />
                )}
                {activeTab === 'receipts' && (
                    <GoodsReceiptManager 
                        goodsReceiptNotes={props.goodsReceiptNotes}
                        purchaseOrders={props.purchaseOrders}
                        locations={props.locations}
                    />
                )}
                {activeTab === 'transfers' && (
                    <StockTransferManager 
                        stockTransfers={props.stockTransfers}
                        locations={props.locations}
                        products={props.products}
                        onAddNew={() => props.openModal('stock_transfer', {})}
                    />
                )}
                {activeTab === 'locations' && (
                     <LocationManagement 
                        locations={props.locations}
                        onEdit={(location) => props.openModal('location', { location })}
                        onAddNew={() => props.openModal('location', {})}
                    />
                )}
            </div>
        </div>
    );
};