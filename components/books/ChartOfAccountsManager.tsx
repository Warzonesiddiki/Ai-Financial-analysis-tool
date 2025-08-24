import React, { useState, useMemo } from 'react';
import { ChartOfAccount, AccountType } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon, BookOpenIcon } from '../icons';
import { AddAccountModal } from './AddAccountModal';

interface ChartOfAccountsManagerProps {
    accounts: ChartOfAccount[];
    onAddAccount: (account: Omit<ChartOfAccount, 'id'>) => void;
    onUpdateAccount: (account: ChartOfAccount) => void;
    onToggleArchive: (id: string) => void;
}

interface AccountNode extends ChartOfAccount {
    children: AccountNode[];
    depth: number;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({ accounts, onAddAccount, onUpdateAccount, onToggleArchive }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState<{ existingAccount?: ChartOfAccount, parentId?: string } | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const accountTree = useMemo(() => {
        const tree: AccountNode[] = [];
        const map: { [key: string]: AccountNode } = {};
        const filteredAccounts = accounts.filter(acc => showArchived || !acc.isArchived);

        filteredAccounts.forEach(acc => {
            map[acc.id] = { ...acc, children: [], depth: 0 };
        });

        filteredAccounts.forEach(acc => {
            if (acc.parentId && map[acc.parentId]) {
                map[acc.parentId].children.push(map[acc.id]);
            } else {
                tree.push(map[acc.id]);
            }
        });

        const setDepth = (nodes: AccountNode[], depth: number) => {
            nodes.forEach(node => {
                node.depth = depth;
                setDepth(node.children, depth + 1);
            });
        };
        setDepth(tree, 0);

        return tree;
    }, [accounts, showArchived]);

    const handleOpenModal = (existingAccount?: ChartOfAccount, parentId?: string) => {
        setModalData({ existingAccount, parentId });
        setIsModalOpen(true);
    };

    const handleSaveAccount = (accountData: Omit<ChartOfAccount, 'id'>, idToUpdate?: string) => {
        if (idToUpdate) {
            const fullAccountData = { ...accounts.find(a => a.id === idToUpdate)!, ...accountData };
            onUpdateAccount(fullAccountData);
        } else {
            onAddAccount(accountData);
        }
        setIsModalOpen(false);
    };

    const renderAccountRows = (nodes: AccountNode[]) => {
        const rows: React.ReactNode[] = [];
        const traverse = (node: AccountNode) => {
            rows.push(
                <tr key={node.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: node.isArchived ? '#f9fafb' : 'transparent' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 500, paddingLeft: `${node.depth * 1.5 + 0.75}rem` }}>
                        <span style={{ color: node.isArchived ? 'var(--color-text-secondary)' : 'inherit' }}>{node.name}</span>
                        {node.isArchived && <span style={{fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '4px'}}>Archived</span>}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{node.accountNumber}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{node.type}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.description}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                            <button onClick={() => handleOpenModal(node)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label="Edit account"><EditIcon style={{ width: '16px', height: '16px' }} /></button>
                            <button onClick={() => onToggleArchive(node.id)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label={node.isArchived ? "Unarchive account" : "Archive account"}><TrashIcon style={{ width: '16px', height: '16px', color: node.isArchived ? 'var(--color-success)' : 'var(--color-error)' }} /></button>
                            <button onClick={() => handleOpenModal(undefined, node.id)} className="button button-tertiary" style={{ padding: '0.5rem' }} aria-label="Add sub-account"><PlusCircleIcon style={{ width: '16px', height: '16px' }} /></button>
                        </div>
                    </td>
                </tr>
            );
            node.children.forEach(traverse);
        };
        nodes.forEach(traverse);
        return rows;
    };
    
    const renderGroupedAccounts = (type: AccountType) => {
        const roots = accountTree.filter(acc => acc.type === type);
        if (roots.length === 0) return null;
        
        return (
            <tbody key={type}>
                <tr>
                    <td colSpan={5} style={{padding: '1rem 0.75rem', backgroundColor: 'var(--color-background)', fontWeight: 600}}>
                        {type}
                    </td>
                </tr>
                {renderAccountRows(roots)}
            </tbody>
        );
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0, border: 'none' }}>Chart of Accounts</h2>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                        <input type="checkbox" id="showArchived" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} style={{width: '16px', height: '16px'}} />
                        <label htmlFor="showArchived" style={{fontSize: '0.9rem', color: 'var(--color-text-secondary)', userSelect: 'none'}}>Show Archived</label>
                    </div>
                    <button onClick={() => handleOpenModal()} className="button button-primary">
                        <PlusCircleIcon /> Add Account
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Name</th>
                            <th style={{ padding: '0.75rem' }}>Number</th>
                            <th style={{ padding: '0.75rem' }}>Type</th>
                            <th style={{ padding: '0.75rem' }}>Description</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    {renderGroupedAccounts('Income')}
                    {renderGroupedAccounts('Expense')}
                    {renderGroupedAccounts('Asset')}
                    {renderGroupedAccounts('Liability')}
                    {renderGroupedAccounts('Equity')}
                </table>
            </div>

            {isModalOpen && (
                <AddAccountModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAccount}
                    existingAccount={modalData?.existingAccount}
                    prefilledParentId={modalData?.parentId}
                    allAccounts={accounts}
                />
            )}
        </div>
    );
};