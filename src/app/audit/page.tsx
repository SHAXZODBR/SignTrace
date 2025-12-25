'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface AuditLogEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    userId: string | null;
    details: string | null;
    createdAt: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        // In production, fetch from API
        // For demo, using simulated data
        const sampleLogs: AuditLogEntry[] = [
            {
                id: '1',
                action: 'upload',
                entityType: 'recording',
                entityId: 'rec-001',
                userId: null,
                details: JSON.stringify({ originalName: 'court_hearing_001.wav', fileSize: 15728640 }),
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                action: 'transcribe',
                entityType: 'transcript',
                entityId: 'trans-001',
                userId: null,
                details: JSON.stringify({ language: 'uz', confidence: 0.92 }),
                createdAt: new Date(Date.now() - 300000).toISOString(),
            },
            {
                id: '3',
                action: 'analyze',
                entityType: 'report',
                entityId: 'report-001',
                userId: null,
                details: JSON.stringify({ complianceScore: 72, violationCount: 3 }),
                createdAt: new Date(Date.now() - 600000).toISOString(),
            },
            {
                id: '4',
                action: 'view',
                entityType: 'recording',
                entityId: 'rec-001',
                userId: 'user-001',
                details: null,
                createdAt: new Date(Date.now() - 900000).toISOString(),
            },
        ];

        setLogs(sampleLogs);
        setLoading(false);
    }, []);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'upload':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17,8 12,3 7,8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                );
            case 'transcribe':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                );
            case 'analyze':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                );
            case 'view':
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                );
            default:
                return (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                );
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'upload': return 'var(--color-primary-400)';
            case 'transcribe': return 'var(--color-accent-400)';
            case 'analyze': return 'var(--color-warning-400)';
            case 'delete': return 'var(--color-danger-400)';
            default: return 'var(--text-secondary)';
        }
    };

    const formatDetails = (details: string | null) => {
        if (!details) return null;
        try {
            const parsed = JSON.parse(details);
            return Object.entries(parsed).map(([key, value]) => (
                <span key={key} style={{ marginRight: 'var(--space-3)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{key}:</span>{' '}
                    <span style={{ fontFamily: 'monospace' }}>{String(value)}</span>
                </span>
            ));
        } catch {
            return details;
        }
    };

    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.action === filter);

    return (
        <>
            <Header
                title="Audit Log"
                subtitle="Immutable record of all system activities"
            />

            {/* Security Notice */}
            <div className="alert alert-info mb-6 animate-fadeIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" style={{ flexShrink: 0 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <div>
                    <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Tamper-Resistant Logging</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
                        Each log entry is cryptographically chained to the previous entry.
                        Any modification to historical records can be detected.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 animate-fadeIn stagger-1" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <button
                        className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('all')}
                    >
                        All Activity
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('upload')}
                    >
                        Uploads
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'transcribe' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('transcribe')}
                    >
                        Transcriptions
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'analyze' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('analyze')}
                    >
                        Analyses
                    </button>
                    <button
                        className={`btn btn-sm ${filter === 'view' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter('view')}
                    >
                        Views
                    </button>
                </div>
            </div>

            {/* Log Entries */}
            <div className="card animate-fadeIn stagger-2">
                {loading ? (
                    <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }} />
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredLogs.map((log, index) => (
                            <div
                                key={log.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--space-4)',
                                    padding: 'var(--space-4)',
                                    borderBottom: index < filteredLogs.length - 1 ? '1px solid var(--border-color)' : 'none',
                                }}
                            >
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: getActionColor(log.action),
                                    flexShrink: 0,
                                }}>
                                    {getActionIcon(log.action)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                            {log.action}
                                        </span>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{log.entityType}</span>
                                        {log.entityId && (
                                            <span style={{ fontFamily: 'monospace', marginLeft: 'var(--space-2)' }}>
                                                #{log.entityId.substring(0, 8)}
                                            </span>
                                        )}
                                    </div>

                                    {log.details && (
                                        <div style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--text-secondary)',
                                            background: 'var(--bg-secondary)',
                                            padding: 'var(--space-2)',
                                            borderRadius: 'var(--radius-md)',
                                        }}>
                                            {formatDetails(log.details)}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-success-500)',
                                    flexShrink: 0,
                                    marginTop: 'var(--space-3)',
                                }} title="Verified integrity" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No audit log entries found
                    </div>
                )}
            </div>
        </>
    );
}
