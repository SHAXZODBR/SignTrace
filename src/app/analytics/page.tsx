'use client';

import { useState } from 'react';
import Header from '@/components/Header';

// Sample data
const institutionData = [
    { name: 'Courts', cases: 456, compliance: 82, highRisk: 12, change: '+5%' },
    { name: 'Police', cases: 389, compliance: 67, highRisk: 28, change: '-3%' },
    { name: 'Tax Authority', cases: 234, compliance: 89, highRisk: 4, change: '+8%' },
    { name: 'Customs', cases: 156, compliance: 74, highRisk: 9, change: '+2%' },
    { name: 'Municipal', cases: 298, compliance: 71, highRisk: 15, change: '-1%' },
];

const violationTypes = [
    { type: 'Missing Required Steps', count: 234, percentage: 31 },
    { type: 'Procedural Order Violation', count: 178, percentage: 24 },
    { type: 'No Legal Justification', count: 145, percentage: 19 },
    { type: 'Informal Decision Making', count: 98, percentage: 13 },
    { type: 'Time Limit Exceeded', count: 67, percentage: 9 },
    { type: 'Other Violations', count: 30, percentage: 4 },
];

const recentFlags = [
    { id: 1, case: 'CASE-2024-0889', issue: 'Decision made before evidence review', severity: 'critical', official: 'Judge A. Yusupov' },
    { id: 2, case: 'CASE-2024-0876', issue: 'Rights not explained to defendant', severity: 'high', official: 'Officer K. Mirza' },
    { id: 3, case: 'CASE-2024-0865', issue: 'Missing mandatory hearing step', severity: 'high', official: 'Inspector R. Tashev' },
];

export default function AnalyticsPage() {
    return (
        <>
            <Header
                title="Analytics"
                subtitle="Performance metrics and pattern analysis"
            />

            {/* Key Metrics */}
            <div className="stats-grid mb-8">
                <div className="stat-card">
                    <div className="stat-label">Cases Analyzed</div>
                    <div className="stat-value">1,247</div>
                    <div className="stat-change positive">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        </svg>
                        +124 this week
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Avg. Compliance</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>79%</div>
                    <div className="stat-change positive">+3% vs last month</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">Total Violations</div>
                    <div className="stat-value" style={{ color: 'var(--warning)' }}>752</div>
                    <div className="stat-change" style={{ color: 'var(--text-muted)' }}>64% addressed</div>
                </div>

                <div className="stat-card">
                    <div className="stat-label">High Risk Cases</div>
                    <div className="stat-value" style={{ color: 'var(--danger)' }}>68</div>
                    <div className="stat-change negative">Requires review</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-6)' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* Institution Performance */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Institution Performance</h3>
                                <p className="card-subtitle">Compliance comparison by government body</p>
                            </div>
                        </div>

                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Institution</th>
                                    <th>Cases</th>
                                    <th>Compliance</th>
                                    <th>High Risk</th>
                                    <th>Change</th>
                                </tr>
                            </thead>
                            <tbody>
                                {institutionData.map((inst) => (
                                    <tr key={inst.name}>
                                        <td style={{ fontWeight: 500 }}>{inst.name}</td>
                                        <td>{inst.cases}</td>
                                        <td>
                                            <div className="risk-score">
                                                <div className="risk-score-bar">
                                                    <div
                                                        className={`risk-score-fill ${inst.compliance >= 80 ? 'success' : inst.compliance >= 60 ? 'warning' : 'danger'}`}
                                                        style={{ width: `${inst.compliance}%` }}
                                                    />
                                                </div>
                                                <span className="risk-score-value" style={{
                                                    color: inst.compliance >= 80 ? 'var(--success)' : inst.compliance >= 60 ? 'var(--warning)' : 'var(--danger)'
                                                }}>
                                                    {inst.compliance}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {inst.highRisk > 10 ? (
                                                <span className="badge badge-critical">{inst.highRisk}</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>{inst.highRisk}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                color: inst.change.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                                                fontWeight: 500,
                                                fontSize: '0.8125rem'
                                            }}>
                                                {inst.change}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Violation Types */}
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <h3 className="card-title">Violation Types</h3>
                                <p className="card-subtitle">Distribution of detected issues</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {violationTypes.map((violation) => (
                                <div key={violation.type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                        <span style={{ fontSize: '0.8125rem' }}>{violation.type}</span>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            {violation.count} ({violation.percentage}%)
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${violation.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {/* AI Insights */}
                    <div className="card">
                        <h3 className="card-title mb-4">AI Insights</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div className="alert alert-warning" style={{ margin: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                </svg>
                                <div style={{ fontSize: '0.8125rem' }}>
                                    <strong>Pattern Detected:</strong> Police department shows 15% lower compliance than average.
                                </div>
                            </div>

                            <div className="alert alert-info" style={{ margin: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <div style={{ fontSize: '0.8125rem' }}>
                                    <strong>Trend:</strong> Tax Authority improved by 8% this month.
                                </div>
                            </div>

                            <div className="alert alert-danger" style={{ margin: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <div style={{ fontSize: '0.8125rem' }}>
                                    <strong>Anomaly:</strong> 3 cases from same official flagged for bias review.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Flags */}
                    <div className="card">
                        <h3 className="card-title mb-4">Recent Flags</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {recentFlags.map((flag) => (
                                <div
                                    key={flag.id}
                                    style={{
                                        padding: 'var(--space-3)',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-lg)',
                                        borderLeft: `3px solid ${flag.severity === 'critical' ? 'var(--danger)' : '#f97316'}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 500 }}>
                                            {flag.case}
                                        </span>
                                        <span className={`badge badge-${flag.severity}`}>{flag.severity}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        {flag.issue}
                                    </p>
                                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                        Official: {flag.official}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Export */}
                    <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                        <h3 className="card-title mb-4">Export Report</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                            Generate a comprehensive analytics report for the selected period.
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download PDF Report
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
