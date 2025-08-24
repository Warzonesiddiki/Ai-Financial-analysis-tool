import React, { useState, useRef, useEffect } from 'react';
import { Notification, NotificationType } from '../types';
import { BellIcon, InfoIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface NotificationsProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
        case 'success': return <CheckCircleIcon style={{color: 'var(--color-success)'}}/>;
        case 'warning': return <AlertTriangleIcon style={{color: 'var(--color-warning)'}}/>;
        case 'action_required': return <SparklesIcon style={{color: 'var(--color-error)'}}/>;
        case 'info':
        default: return <InfoIcon style={{color: 'var(--color-primary)'}}/>;
    }
}

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}


export const Notifications: React.FC<NotificationsProps> = ({ notifications, setNotifications }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
    };
    
    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
    };

    return (
        <div className="notification-bell-wrapper" ref={wrapperRef}>
            <button onClick={handleToggle} className="notification-bell" aria-label={`Notifications (${unreadCount} unread)`}>
                <BellIcon />
                {unreadCount > 0 && <div className="notification-badge"></div>}
            </button>
            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        Notifications
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div style={{textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)'}}>No new notifications.</div>
                        ) : (
                            notifications.map(n => (
                                <a 
                                    key={n.id}
                                    href={n.link || '#'}
                                    className="notification-item"
                                    data-read={n.isRead}
                                    onClick={(e) => {
                                        if(!n.link) e.preventDefault();
                                        handleMarkAsRead(n.id);
                                    }}
                                >
                                    <div className="notification-item-icon">{getNotificationIcon(n.type)}</div>
                                    <div className="notification-item-content">
                                        <p>{n.message}</p>
                                        <time>{timeSince(new Date(n.timestamp))}</time>
                                    </div>
                                </a>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
