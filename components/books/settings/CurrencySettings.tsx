import React, { useState } from 'react';
import { CurrencyExchangeRate } from '../../../types';
import { CoinsIcon, PlusCircleIcon, TrashIcon } from '../../icons';

interface CurrencySettingsProps {
    exchangeRates: CurrencyExchangeRate[];
}

export const CurrencySettings: React.FC<CurrencySettingsProps> = ({ exchangeRates }) => {
    
    const [rates, setRates] = useState(exchangeRates);

    // Form state for new rate
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('USD');
    const [rate, setRate] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleAddRate = (e: React.FormEvent) => {
        e.preventDefault();
        if (from && to && rate > 0 && date) {
            const newRate: CurrencyExchangeRate = { from, to, rate, date };
            setRates(prev => [newRate, ...prev].sort((a,b) => b.date.localeCompare(a.date)));
            // Reset form
            setFrom('');
            setRate(0);
        }
    };
    
    const handleDeleteRate = (rateToDelete: CurrencyExchangeRate) => {
        setRates(prev => prev.filter(r => r !== rateToDelete));
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <CoinsIcon style={{ width: '28px', height: '28px', color: 'var(--color-primary)' }} />
                <h2 style={{ margin: 0, border: 'none' }}>Currency Exchange Rates</h2>
            </div>
            <p style={{color: 'var(--color-text-secondary)', marginTop: 0}}>
                Manage exchange rates for foreign currency transactions. The latest rate for a given date will be used.
            </p>

            <div className="card" style={{backgroundColor: 'var(--color-background)', marginBottom: '1.5rem'}}>
                <h4 style={{marginTop: 0}}>Add New Exchange Rate</h4>
                <form onSubmit={handleAddRate} className="currency-settings-form">
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">From Currency</label>
                        <input type="text" value={from} onChange={e => setFrom(e.target.value.toUpperCase())} className="input" placeholder="e.g. AED" maxLength={3} required />
                     </div>
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">To Currency</label>
                        <input type="text" value={to} onChange={e => setTo(e.target.value.toUpperCase())} className="input" placeholder="e.g. USD" maxLength={3} required />
                     </div>
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">Rate</label>
                        <input type="number" step="0.0001" value={rate} onChange={e => setRate(Number(e.target.value))} className="input" required />
                     </div>
                     <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
                     </div>
                      <div className="form-group" style={{marginBottom: 0, alignSelf: 'flex-end'}}>
                        <button type="submit" className="button button-primary" style={{width: '100%'}}><PlusCircleIcon/> Add</button>
                      </div>
                </form>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '0.75rem' }}>Date</th>
                            <th style={{ padding: '0.75rem' }}>From</th>
                            <th style={{ padding: '0.75rem' }}>To</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Rate</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rates.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '0.75rem' }}>{r.date}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.from}</td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{r.to}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>{r.rate}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                    <button onClick={() => handleDeleteRate(r)} className="button button-tertiary" style={{padding: '0.5rem'}}>
                                        <TrashIcon style={{width: '16px', height: '16px', color: 'var(--color-error)'}}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};