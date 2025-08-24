import React, { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PrinterIcon } from '../../icons';

type PeriodPreset = 'this_month' | 'this_quarter' | 'this_year' | 'last_month' | 'last_quarter' | 'last_year';

interface ReportToolbarProps {
    onDateChange: (start: Date, end: Date) => void;
    onExport: () => void;
    title: string;
}

const ReportToolbar: React.FC<ReportToolbarProps> = ({ onDateChange, onExport, title }) => {
    const [preset, setPreset] = useState<PeriodPreset>('this_month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handlePresetChange = useCallback((newPreset: PeriodPreset) => {
        setPreset(newPreset);
        const now = new Date();
        let start = new Date(), end = new Date();
        
        switch (newPreset) {
            case 'this_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'this_year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            case 'last_month':
                 start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                 end = new Date(now.getFullYear(), now.getMonth(), 0);
                 break;
            case 'last_quarter':
                const lastQuarter = Math.floor(now.getMonth() / 3) -1;
                if (lastQuarter < 0) {
                     start = new Date(now.getFullYear() - 1, 9, 1);
                     end = new Date(now.getFullYear() - 1, 11, 31);
                } else {
                     start = new Date(now.getFullYear(), lastQuarter * 3, 1);
                     end = new Date(now.getFullYear(), lastQuarter * 3 + 3, 0);
                }
                break;
             case 'last_year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                break;
        }

        const formatDate = (d: Date) => d.toISOString().split('T')[0];
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        onDateChange(start, end);
    }, [onDateChange]);

    // Initialize with default preset
    useState(() => {
        handlePresetChange('this_month');
    });

    return (
        <div className="card report-toolbar" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <div className="form-group" style={{marginBottom: 0}}>
                        <label className="form-label">Date Range</label>
                        <select value={preset} onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)} className="input">
                            <option value="this_month">This Month</option>
                            <option value="this_quarter">This Quarter</option>
                            <option value="this_year">This Year</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_quarter">Last Quarter</option>
                             <option value="last_year">Last Year</option>
                        </select>
                    </div>
                </div>
                 <button onClick={onExport} className="button button-secondary">
                    <PrinterIcon /> Export as PDF
                </button>
            </div>
        </div>
    );
};

export default ReportToolbar;
