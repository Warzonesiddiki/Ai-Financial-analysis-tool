import React, { ReactNode, useState, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    setIsOpen(e.currentTarget.open);
  };

  return (
    <details open={isOpen} onToggle={handleToggle} style={{ transition: 'all 0.3s ease' }}>
      <summary 
        aria-expanded={isOpen}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        {title}
        <ChevronDownIcon className="chevron" style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </summary>
      <div className="details-content">
        {children}
      </div>
      <style>{`
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </details>
  );
};

export default CollapsibleSection;