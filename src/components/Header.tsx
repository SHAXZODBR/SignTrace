'use client';

import { useState } from 'react';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
    const [showNotifications, setShowNotifications] = useState(false);

    const notifications = [
        { id: 1, type: 'alert', message: 'Critical case flagged: CASE-2024-0889', time: '5 min ago' },
        { id: 2, type: 'success', message: 'Analysis completed for 3 recordings', time: '12 min ago' },
        { id: 3, type: 'info', message: 'New legal rule added to knowledge base', time: '1 hour ago' },
    ];

    return (
        <header className="header">
            <div>
                <h1 className="header-title">{title}</h1>
                {subtitle && <p className="header-subtitle">{subtitle}</p>}
            </div>

            <div className="header-actions">
                {/* Search */}
                <div className="search-bar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input type="text" placeholder="Search cases..." />
                </div>

                {/* Notifications */}
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn btn-icon btn-secondary"
                        onClick={() => setShowNotifications(!showNotifications)}
                        style={{ position: 'relative' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 16,
                            height: 16,
                            background: 'var(--danger)',
                            borderRadius: '50%',
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--bg-secondary)',
                        }}>
                            3
                        </span>
                    </button>

                    {showNotifications && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: 'var(--space-2)',
                            width: 320,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 100,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: 'var(--space-4)',
                                borderBottom: '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notifications</h4>
                                <button className="btn btn-sm btn-ghost">Mark all read</button>
                            </div>
                            <div>
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        style={{
                                            padding: 'var(--space-4)',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                                            <span style={{
                                                width: 6,
                                                height: 6,
                                                marginTop: 6,
                                                borderRadius: '50%',
                                                background: notif.type === 'alert' ? 'var(--danger)' : notif.type === 'success' ? 'var(--success)' : 'var(--info)',
                                                flexShrink: 0,
                                            }} />
                                            <div>
                                                <p style={{ fontSize: '0.8125rem', marginBottom: 2 }}>{notif.message}</p>
                                                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{notif.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button className="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Case
                </button>
            </div>
        </header>
    );
}
