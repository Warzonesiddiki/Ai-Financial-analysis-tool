

import React from 'react';
import { SegmentData } from '../types';
import { XIcon } from './icons';
import CollapsibleSection from './CollapsibleSection';

interface SegmentInputsProps {
  data: SegmentData[];
  onChange: (segments: SegmentData[]) => void;
}

const SegmentInputs: React.FC<SegmentInputsProps> = ({ data, onChange }) => {

  const handleSegmentChange = (id: string, field: keyof Omit<SegmentData, 'id'>, value: string) => {
    const newSegments = data.map(seg => seg.id === id ? { ...seg, [field]: value } : seg);
    onChange(newSegments);
  };

  const addSegment = () => {
    const newSegment: SegmentData = { id: Date.now().toString(), name: '', revenue: '', profit: '' };
    onChange([...data, newSegment]);
  };

  const removeSegment = (id: string) => {
    onChange(data.filter(seg => seg.id !== id));
  };

  return (
    <CollapsibleSection title="Segment Reporting (IFRS 8)" defaultOpen={false}>
      <div style={{backgroundColor: 'var(--color-background)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)'}}>
        <h4 style={{marginTop: 0, color: 'var(--color-text-secondary)'}}>Business or Geographic Segments</h4>
        <div className="grid" style={{ gridTemplateColumns: '4fr 2fr 2fr auto', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', padding: '0 0.5rem', fontWeight: 500 }}>
            <div>Segment Name</div>
            <div style={{textAlign: 'right'}}>Revenue</div>
            <div style={{textAlign: 'right'}}>Profit</div>
        </div>
        {data.map(seg => (
          <div key={seg.id} className="grid" style={{ gridTemplateColumns: '4fr 2fr 2fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center'}}>
            <input type="text" placeholder="e.g., North America" value={seg.name} onChange={e => handleSegmentChange(seg.id, 'name', e.target.value)} className="input" />
            <input type="number" placeholder="Revenue" value={seg.revenue} onChange={e => handleSegmentChange(seg.id, 'revenue', e.target.value)} className="input" style={{textAlign: 'right'}} />
            <input type="number" placeholder="Profit" value={seg.profit} onChange={e => handleSegmentChange(seg.id, 'profit', e.target.value)} className="input" style={{textAlign: 'right'}} />
            <button onClick={() => removeSegment(seg.id)} className="button button-tertiary" style={{padding: '0.5rem'}}><XIcon style={{width:'16px', height: '16px', color: 'var(--color-error)'}}/></button>
          </div>
        ))}
        <button onClick={addSegment} className="button button-tertiary">+ Add Segment</button>
      </div>
    </CollapsibleSection>
  );
};

export default React.memo(SegmentInputs);