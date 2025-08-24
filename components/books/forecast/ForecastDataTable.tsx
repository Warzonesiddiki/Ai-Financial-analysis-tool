import React from 'react';
import { CashFlowForecast } from '../../../types';

interface ForecastDataTableProps {
    forecast: CashFlowForecast;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

export const ForecastDataTable: React.FC<ForecastDataTableProps> = ({ forecast }) => {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="forecast-data-table">
                <thead>
                    <tr>
                        <th>Week</th>
                        <th>Inflows</th>
                        <th>Outflows</th>
                        <th>Net Change</th>
                        <th>Ending Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Starting Balance</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td className="monospace"><strong>{formatCurrency(forecast.startingBalance)}</strong></td>
                    </tr>
                    {forecast.forecast.map((period, index) => (
                        <tr key={index}>
                            <td>{period.week}</td>
                            <td className="monospace positive">{formatCurrency(period.inflows)}</td>
                            <td className="monospace negative">{formatCurrency(period.outflows)}</td>
                            <td className={`monospace ${period.netChange >= 0 ? 'positive' : 'negative'}`}>
                                {formatCurrency(period.netChange)}
                            </td>
                            <td className={`monospace ${period.endingBalance >= 0 ? '' : 'negative'}`}>
                                <strong>{formatCurrency(period.endingBalance)}</strong>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
