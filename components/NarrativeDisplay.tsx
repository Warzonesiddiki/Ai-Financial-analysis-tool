
import React from 'react';
import { SectionAnalysis } from '../types';
import { CheckCircleIcon, SparklesIcon, GlobeIcon } from './icons';

interface NarrativeDisplayProps {
  analysis: SectionAnalysis;
  confidence?: 'High' | 'Medium' | 'Low';
  provenance?: string;
}

const ConfidenceBadge: React.FC<{ level: 'High' | 'Medium' | 'Low' }> = ({ level }) => {
  const styles = {
    High: { color: 'var(--color-success)', backgroundColor: 'rgba(22, 163, 74, 0.1)' },
    Medium: { color: '#d97706', backgroundColor: 'rgba(251, 191, 36, 0.15)' },
    Low: { color: 'var(--color-error)', backgroundColor: 'rgba(220, 38, 38, 0.1)' },
  };
  return (
    <span style={{
      padding: '4px 10px',
      fontSize: '0.8rem',
      fontWeight: 600,
      borderRadius: '9999px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      ...styles[level]
    }}>
      <SparklesIcon style={{width: '14px', height: '14px'}}/>
      {level} Confidence
    </span>
  );
};

export const NarrativeDisplay: React.FC<NarrativeDisplayProps> = ({ analysis, confidence, provenance }) => {
  
  const renderNarrative = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split('\n').filter(p => p.trim());
    return paragraphs.map((paragraph, index) => {
        const match = paragraph.match(/^\*\*(.*?)\*\*$/);
        if (match) {
            return <h4 key={index} style={{ marginTop: '1rem', marginBottom: '0', color: 'var(--color-text)' }}>{match[1]}</h4>;
        }
        return <p key={index} style={{ margin: 0 }}>{paragraph}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {confidence && (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
            }}>
                <span style={{fontWeight: 600, color: 'var(--color-text)'}}>AI Generated Analysis</span>
                <ConfidenceBadge level={confidence} />
            </div>
        )}

      <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--color-border)'}}>
        <h4 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text)' }}>Key Takeaways</h4>
        <ul className="takeaways-list">
          {analysis.takeaways && analysis.takeaways.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text)' }}>Detailed Narrative</h4>
        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {renderNarrative(analysis.narrative)}
        </div>
      </div>
      
      {analysis.sources && analysis.sources.length > 0 && (
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GlobeIcon style={{width: '18px', height: '18px', color: 'var(--color-text-secondary)'}}/>
                Sources from the Web
            </h4>
            <ul className="sources-list">
                {analysis.sources.map((source, index) => (
                   <li key={index}>
                      <a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title || new URL(source.uri).hostname}</a>
                   </li>
                ))}
            </ul>
          </div>
      )}

      {provenance && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon style={{ width: '16px', height: '16px', color: 'var(--color-success)', flexShrink: 0 }}/>
            <span>{provenance}</span>
        </div>
      )}
    </div>
  );
};
