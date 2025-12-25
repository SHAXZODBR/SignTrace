'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

interface CaseDetails {
    recording: {
        id: string;
        filename: string;
        originalName: string;
        status: string;
        duration: number;
        caseId: string;
        institution: string;
        createdAt: string;
    };
    transcript: {
        fullText: string;
        language: string;
        confidence: number;
        segments: any[];
    } | null;
    processEvents: any[];
    complianceReport: {
        complianceScore: number;
        riskScore: number;
        severityLevel: string;
        summary: string;
        recommendation: string;
        violations: any[];
        biasFlags: any[];
    } | null;
}

export default function CaseDetailPage() {
    const params = useParams();
    const caseId = params.id as string;

    const [details, setDetails] = useState<CaseDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'transcript' | 'events' | 'compliance' | 'feedback'>('transcript');
    const [editMode, setEditMode] = useState(false);
    const [editedTranscript, setEditedTranscript] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCaseDetails();
    }, [caseId]);

    const fetchCaseDetails = async () => {
        try {
            const res = await fetch(`/api/analyze?recordingId=${caseId}`);
            if (res.ok) {
                const data = await res.json();
                setDetails(data);
                if (data.transcript?.fullText) {
                    setEditedTranscript(data.transcript.fullText);
                }
            }
        } catch (error) {
            console.error('Error fetching case:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitCorrection = async (type: string, correctedOutput: any) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordingId: caseId,
                    correctionType: type,
                    originalOutput: type === 'transcription' ? details?.transcript : details?.processEvents,
                    correctedOutput,
                    expertId: 'current-user', // Would come from auth
                }),
            });

            if (res.ok) {
                alert('Correction saved for AI training!');
                setEditMode(false);
            }
        } catch (error) {
            console.error('Error submitting correction:', error);
            alert('Failed to submit correction');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Header title="Loading..." />
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            </>
        );
    }

    if (!details) {
        return (
            <>
                <Header title="Case Not Found" />
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Recording not found or not yet analyzed.</p>
                    <Link href="/cases" className="btn btn-primary mt-4">Back to Cases</Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title={details.recording.caseId || details.recording.originalName}
                subtitle={`${details.recording.institution} • ${new Date(details.recording.createdAt).toLocaleDateString()}`}
            />

            {/* Status Bar */}
            <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        <span className={`badge badge-${details.recording.status === 'completed' ? 'completed' : 'processing'}`}>
                            {details.recording.status}
                        </span>
                        {details.complianceReport && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Compliance:</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: details.complianceReport.complianceScore >= 70 ? 'var(--success)' :
                                            details.complianceReport.complianceScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                                    }}>
                                        {details.complianceReport.complianceScore}%
                                    </span>
                                </div>
                                <span className={`badge badge-${details.complianceReport.severityLevel}`}>
                                    {details.complianceReport.severityLevel} risk
                                </span>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-secondary btn-sm">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Export PDF
                        </button>
                        <button className="btn btn-primary btn-sm">Mark as Reviewed</button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                {(['transcript', 'events', 'compliance', 'feedback'] as const).map((tab) => (
                    <button
                        key={tab}
                        className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'transcript' && (
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Transcript</h3>
                            <p className="card-subtitle">
                                Language: {details.transcript?.language || 'Unknown'} •
                                Confidence: {((details.transcript?.confidence || 0) * 100).toFixed(0)}%
                            </p>
                        </div>
                        <button
                            className={`btn btn-sm ${editMode ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? 'Cancel Edit' : 'Correct Transcript'}
                        </button>
                    </div>

                    {editMode ? (
                        <div>
                            <textarea
                                className="form-input"
                                style={{ minHeight: 400, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
                                value={editedTranscript}
                                onChange={(e) => setEditedTranscript(e.target.value)}
                            />
                            <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                                <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => submitCorrection('transcription', { fullText: editedTranscript })}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Submit Correction for Training'}
                                </button>
                            </div>
                            <p style={{ marginTop: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Your correction will be used to improve AI accuracy.
                            </p>
                        </div>
                    ) : (
                        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.8 }}>
                            {details.transcript?.fullText || 'No transcript available. Run analysis first.'}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'events' && (
                <div className="card">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Detected Events</h3>
                            <p className="card-subtitle">{details.processEvents.length} procedural events identified</p>
                        </div>
                    </div>

                    {details.processEvents.length > 0 ? (
                        <div className="timeline">
                            {details.processEvents.map((event, i) => (
                                <div key={i} className="timeline-item">
                                    <div className="timeline-dot" />
                                    <div className="timeline-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 600 }}>Step {event.stepNumber}: {event.actionType}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Confidence: {(event.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>{event.description}</p>
                                        {event.speaker && (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                                                Speaker: {event.speaker}
                                            </p>
                                        )}
                                        {event.legalReference && (
                                            <span className="badge badge-processing" style={{ marginTop: 'var(--space-2)' }}>
                                                {event.legalReference}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
                            No events extracted. Run analysis first.
                        </p>
                    )}
                </div>
            )}

            {activeTab === 'compliance' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                    <div className="card">
                        <h3 className="card-title mb-4">Compliance Summary</h3>
                        {details.complianceReport ? (
                            <>
                                <div style={{
                                    fontSize: '3rem',
                                    fontWeight: 700,
                                    marginBottom: 'var(--space-4)',
                                    color: details.complianceReport.complianceScore >= 70 ? 'var(--success)' :
                                        details.complianceReport.complianceScore >= 50 ? 'var(--warning)' : 'var(--danger)'
                                }}>
                                    {details.complianceReport.complianceScore}%
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                                    {details.complianceReport.summary}
                                </p>
                                <div className="alert alert-info">
                                    <strong>Recommendation:</strong> {details.complianceReport.recommendation}
                                </div>
                            </>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>Compliance analysis not yet run.</p>
                        )}
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">Violations ({details.complianceReport?.violations.length || 0})</h3>
                        {details.complianceReport?.violations.map((v, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: 'var(--space-3)',
                                    background: 'var(--bg-elevated)',
                                    borderRadius: 'var(--radius-lg)',
                                    marginBottom: 'var(--space-3)',
                                    borderLeft: `3px solid ${v.severity === 'critical' ? 'var(--danger)' : 'var(--warning)'}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 500 }}>{v.type}</span>
                                    <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                                </div>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                                    {v.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'feedback' && (
                <div className="card">
                    <h3 className="card-title mb-4">Expert Feedback & Corrections</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                        Your corrections help improve AI accuracy. All feedback is used for training.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                        <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Transcription Accuracy
                            </h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                Was the automatic transcription accurate?
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('transcript')}>
                                    Review & Correct
                                </button>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Event Detection
                            </h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                Were all procedural events correctly identified?
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button className="btn btn-sm btn-secondary">Add Missing Event</button>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Compliance Assessment
                            </h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                Is the compliance score accurate?
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button className="btn btn-sm btn-secondary">Adjust Score</button>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                                Bias Flags
                            </h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                                Were potential bias indicators correctly flagged?
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button className="btn btn-sm btn-secondary">Review Flags</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
