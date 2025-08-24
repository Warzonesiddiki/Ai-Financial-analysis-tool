
import React from 'react';
import { KeyMetric } from '../types';
import { ArrowUpRightIcon, ArrowDownRightIcon } from './icons';

interface StatCardProps {
  metric: KeyMetric;
}

export const StatCard: React.FC<StatCardProps> = ({ metric }) => {
  const hasChange = metric.change !== undefined && isFinite(metric.change);

  const trendIcon =
    metric.trend === 'positive' ? (
      <ArrowUpRightIcon style={{ width: '14px', height: '14px' }} />
    ) : metric.trend === 'negative' ? (
      <ArrowDownRightIcon style={{ width: '14px', height: '14px' }} />
    ) : null;

  const trendBadgeClass = 
    metric.trend === 'positive' ? 'trend-positive' :
    metric.trend === 'negative' ? 'trend-negative' :
    'trend-neutral';


  return (
    <div className="stat-card">
      <div>
        <p className="stat-card-label">{metric.label}</p>
        <p className="stat-card-value">{metric.value}</p>
      </div>
      {hasChange && (
        <div className={`trend-badge ${trendBadgeClass}`} style={{ marginTop: '0.75rem', alignSelf: 'flex-start' }}>
          {trendIcon}
          <span>{metric.change?.toFixed(1)}% vs prior</span>
        </div>
      )}
    </div>
  );
};
