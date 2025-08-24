import React, { useState, useRef, useEffect } from 'react';
import { Entity } from '../types';
import { ChevronsUpDownIcon } from './icons';

interface EntitySwitcherProps {
    entities: Entity[];
    activeEntityId: string;
    setActiveEntityId: (id: string) => void;
}

export const EntitySwitcher: React.FC<EntitySwitcherProps> = ({ entities, activeEntityId, setActiveEntityId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const activeEntity = entities.find(e => e.id === activeEntityId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (id: string) => {
        setActiveEntityId(id);
        setIsOpen(false);
    };

    const renderEntityOptions = (parentId?: string, depth = 0) => {
        return entities
            .filter(e => e.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name))
            .flatMap(entity => [
                <button
                    key={entity.id}
                    onClick={() => handleSelect(entity.id)}
                    className={`entity-dropdown-item ${entity.id === activeEntityId ? 'active' : ''}`}
                    style={{ paddingLeft: `${0.5 + depth * 1}rem` }}
                >
                    {entity.name}
                </button>,
                ...renderEntityOptions(entity.id, depth + 1)
            ]);
    };
    
    const parentEntity = entities.find(e => !e.parentId);

    return (
        <div className="entity-switcher-wrapper" ref={wrapperRef}>
            {isOpen && (
                 <div className="entity-switcher-dropdown">
                    {parentEntity && (
                        <>
                            <button
                                key={parentEntity.id}
                                onClick={() => handleSelect(parentEntity.id)}
                                className={`entity-dropdown-item ${parentEntity.id === activeEntityId ? 'active' : ''}`}
                            >
                                {parentEntity.name}
                            </button>
                            {renderEntityOptions(parentEntity.id, 1)}
                        </>
                    )}
                </div>
            )}
            <button className="entity-switcher-button" onClick={() => setIsOpen(p => !p)}>
                <div style={{flexGrow: 1, textAlign: 'left'}}>
                    <div style={{fontSize: '0.9rem', fontWeight: 600}}>{activeEntity?.name}</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--color-text-secondary)'}}>
                        {entities.find(e => e.id === activeEntity?.parentId)?.name || 'Parent Company'}
                    </div>
                </div>
                <ChevronsUpDownIcon style={{color: 'var(--color-text-secondary)', width: '16px', height: '16px'}}/>
            </button>
        </div>
    );
};
