import React, { useState } from 'react';
import { useGoogleAuth } from './GoogleAuthProvider';
import { ChevronDownIcon } from './icons';

export const UserProfile: React.FC = () => {
  const { user, signOut } = useGoogleAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="button button-secondary"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 0.75rem'
        }}
      >
        <img 
          src={user.picture} 
          alt={user.name}
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
        <span style={{ fontSize: '0.9rem' }}>{user.name}</span>
        <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
      </button>

      {isDropdownOpen && (
        <>
          <div 
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 10 
            }}
            onClick={() => setIsDropdownOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              minWidth: '200px',
              zIndex: 20
            }}
          >
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.name}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{user.email}</div>
            </div>
            <div style={{ padding: '0.5rem' }}>
              <button
                onClick={() => {
                  signOut();
                  setIsDropdownOpen(false);
                }}
                className="button button-tertiary"
                style={{ 
                  width: '100%', 
                  justifyContent: 'flex-start',
                  color: 'var(--color-error)'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};