'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

interface Recording {
    id: string;
    originalName: string;
    filename: string;
    fileSize: number;
    mimeType: string;
    status: string;
    caseId: string | null;
    institution: string | null;
    createdAt: string;
    transcript?: {
        id: string;
        language: string;
        confidence: number;
    } | null;
    complianceReport?: {
        id: string;
        complianceScore: number;
        riskScore: number;
        severityLevel: string;
    } | null;
}

export default function CasesPage() {
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function fetchRecordings() {
            try {
                const response = await fetch('/api/upload?limit=100');
                const data = await response.json();
                if (data.recordings) {
                    setRecordings(data.recordings);
                }
            } catch (error) {
                console.error('Error fetching recordings:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchRecordings();
    }, []);

    const filteredRecordings = recordings.filter(recording => {
        // Apply status filter
        if (filter !== 'all') {
            if (filter === 'high-risk') {
                if (!['high', 'critical'].includes(recording.complianceReport?.severityLevel || '')) {
                    return false;
                }
            } else if (recording.status !== filter) {
                return false;
            }
        }

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                recording.originalName.toLowerCase().includes(query) ||
                recording.caseId?.toLowerCase().includes(query) ||
                recording.institution?.toLowerCase().includes(query)
            );
        }

        return true;
    });

    const getSeverityBadgeClass = (severity?: string) => {
        switch (severity) {
            case 'critical': return 'badge-critical';
            case 'high': return 'badge-high';
            case 'medium': return 'badge-medium';
            case 'low': return 'badge-low';
            default: return 'badge-pending';
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed': return 'badge-completed';
            case 'analyzing':
            case 'transcribing': return 'badge-processing';
            case 'error': return 'badge-high';
            default: return 'badge-pending';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('audio/')) {
            return '🎵';
        }
        if (mimeType.startsWith('video/')) {
            return '🎬';
        }
        return '📄';
    };

    return (
        <>
            <Header
                title="Cases"
                subtitle="Manage and review all uploaded recordings and their analysis"
            />

            {/* Controls */}
            <div className="card mb-6 animate-fadeIn" style={{ padding: 'var(--space-4)' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search cases..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    paddingLeft: 'var(--space-10)',
                                    width: '280px',
                                    background: 'var(--bg-secondary)'
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                left: 'var(--space-3)',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)'
                            }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                        </div>

                        <select
                            className="form-input form-select"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{ width: '180px', background: 'var(--bg-secondary)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="transcribing">Transcribing</option>
                            <option value="analyzing">Analyzing</option>
                            <option value="completed">Completed</option>
                            <option value="high-risk">High Risk</option>
                        </select>
                    </div>

                    <Link href="/upload" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        New Recording
                    </Link>
                </div>
            </div>

            {/* Results Summary */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
                padding: '0 var(--space-2)'
            }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    Showing {filteredRecordings.length} of {recordings.length} cases
                </span>
            </div>

            {/* Cases Table */}
            <div className="card animate-fadeIn stagger-1">
                {loading ? (
                    <div style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
                        <p style={{ color: 'var(--text-muted)' }}>Loading cases...</p>
                    </div>
                ) : filteredRecordings.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Recording</th>
                                    <th>Case ID</th>
                                    <th>Institution</th>
                                    <th>Status</th>
                                    <th>Risk Level</th>
                                    <th>Compliance</th>
                                    <th>Size</th>
                                    <th>Date</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecordings.map((recording) => (
                                    <tr key={recording.id} className="data-table-row-clickable">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                                <span style={{ fontSize: 'var(--font-size-xl)' }}>
                                                    {getFileIcon(recording.mimeType)}
                                                </span>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {recording.originalName.length > 35
                                                            ? recording.originalName.substring(0, 35) + '...'
                                                            : recording.originalName}
                                                    </div>
                                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                                        {recording.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
                                                {recording.caseId || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ textTransform: 'capitalize' }}>
                                                {recording.institution || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(recording.status)}`}>
                                                {recording.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getSeverityBadgeClass(recording.complianceReport?.severityLevel)}`}>
                                                {recording.complianceReport?.severityLevel || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            {recording.complianceReport ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '6px',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-full)',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${recording.complianceReport.complianceScore}%`,
                                                            background: recording.complianceReport.complianceScore >= 70
                                                                ? 'var(--color-success-500)'
                                                                : recording.complianceReport.complianceScore >= 40
                                                                    ? 'var(--color-warning-500)'
                                                                    : 'var(--color-danger-500)',
                                                            borderRadius: 'var(--radius-full)',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        fontSize: 'var(--font-size-sm)',
                                                        color: recording.complianceReport.complianceScore >= 70
                                                            ? 'var(--color-success-400)'
                                                            : recording.complianceReport.complianceScore >= 40
                                                                ? 'var(--color-warning-400)'
                                                                : 'var(--color-danger-400)'
                                                    }}>
                                                        {recording.complianceReport.complianceScore}%
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            {formatFileSize(recording.fileSize)}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                            {new Date(recording.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/cases/${recording.id}`}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                View
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                    <polyline points="9 18 15 12 9 6" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: 'var(--space-16)',
                        color: 'var(--text-muted)'
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" style={{ margin: '0 auto var(--space-4)', opacity: 0.5 }}>
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                        <p style={{ marginBottom: 'var(--space-4)' }}>
                            {searchQuery || filter !== 'all'
                                ? 'No cases match your filters'
                                : 'No recordings uploaded yet'}
                        </p>
                        {(!searchQuery && filter === 'all') && (
                            <Link href="/upload" className="btn btn-primary">
                                Upload First Recording
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
