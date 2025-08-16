import React, { ReactNode } from 'react';
import { ChevronDownIcon } from './icons';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  return (
    <details open={defaultOpen} style={{ transition: 'all 0.3s ease' }}>
      <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <ChevronDownIcon className="chevron" style={{ transition: 'transform 0.3s' }} />
      </summary>
      <div className="details-content">
        {children}
      </div>
      <style>{`
        details[open] > summary .chevron {
          transform: rotate(180deg);
        }
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </details>
  );
};

export default CollapsibleSection;
