'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface CaseType {
    id: string;
    name: string;
    nameUz?: string;
    nameRu?: string;
    description?: string;
    requiredSteps: string;
    forbiddenActions?: string;
    timeLimits?: string;
    createdAt: string;
}

interface LegalRule {
    id: string;
    code: string;
    title: string;
    fullText: string;
    source: string;
    category?: string;
    isActive: boolean;
}

const defaultCaseTypes: CaseType[] = [
    {
        id: '1',
        name: 'Administrative Offense',
        nameUz: 'Ma\'muriy huquqbuzarlik',
        nameRu: 'Административное правонарушение',
        description: 'Standard procedure for administrative offense processing',
        requiredSteps: JSON.stringify([
            'Register complaint/incident',
            'Notify subject of proceedings',
            'Collect and document evidence',
            'Allow subject to review evidence',
            'Conduct formal hearing',
            'Issue written decision with legal basis',
            'Notify of appeal rights'
        ]),
        forbiddenActions: JSON.stringify([
            'Making decisions before reviewing evidence',
            'Denying access to evidence',
            'Conducting hearing without proper notification'
        ]),
        timeLimits: JSON.stringify({
            'Notify subject': '3 days',
            'Conduct hearing': '15 days',
            'Issue decision': '10 days'
        }),
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        name: 'Criminal Investigation',
        nameUz: 'Jinoyat tergovi',
        nameRu: 'Уголовное расследование',
        description: 'Procedure for criminal investigation and prosecution',
        requiredSteps: JSON.stringify([
            'Record complaint/report',
            'Open investigation file',
            'Inform suspect of rights',
            'Conduct interrogation with lawyer present',
            'Collect and preserve evidence',
            'Document chain of custody',
            'Present findings to prosecutor',
            'Allow defense access to materials'
        ]),
        forbiddenActions: JSON.stringify([
            'Interrogation without informing rights',
            'Denying access to legal counsel',
            'Evidence tampering'
        ]),
        timeLimits: JSON.stringify({
            'Inform of rights': 'Immediately',
            'Provide lawyer': '24 hours',
            'Initial investigation': '10 days'
        }),
        createdAt: new Date().toISOString()
    }
];

export default function KnowledgePage() {
    const [activeTab, setActiveTab] = useState<'cases' | 'rules'>('cases');
    const [caseTypes, setCaseTypes] = useState<CaseType[]>(defaultCaseTypes);
    const [legalRules, setLegalRules] = useState<LegalRule[]>([]);
    const [selectedCaseType, setSelectedCaseType] = useState<CaseType | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Fetch from API when implemented
        // For now using defaults
    }, []);

    const parsedSteps = (stepsJson: string) => {
        try {
            return JSON.parse(stepsJson);
        } catch {
            return [];
        }
    };

    const parsedObject = (json?: string) => {
        try {
            return json ? JSON.parse(json) : {};
        } catch {
            return {};
        }
    };

    return (
        <>
            <Header
                title="Knowledge Base"
                subtitle="Manage legal rules, procedures, and case type definitions"
            />

            {/* Tabs */}
            <div className="card mb-6 animate-fadeIn" style={{ padding: 0, display: 'flex' }}>
                <button
                    onClick={() => setActiveTab('cases')}
                    style={{
                        flex: 1,
                        padding: 'var(--space-4)',
                        background: activeTab === 'cases' ? 'var(--bg-tertiary)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'cases' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                        color: activeTab === 'cases' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle' }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Case Types ({caseTypes.length})
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    style={{
                        flex: 1,
                        padding: 'var(--space-4)',
                        background: activeTab === 'rules' ? 'var(--bg-tertiary)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'rules' ? '2px solid var(--color-primary-500)' : '2px solid transparent',
                        color: activeTab === 'rules' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: 'var(--space-2)', verticalAlign: 'middle' }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    Legal Rules ({legalRules.length})
                </button>
            </div>

            {/* Case Types Tab */}
            {activeTab === 'cases' && (
                <div className="animate-fadeIn">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Define required procedures and steps for each case type
                        </p>
                        <button className="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Case Type
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                        {caseTypes.map((caseType, index) => (
                            <div
                                key={caseType.id}
                                className="card animate-fadeIn"
                                style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                                onClick={() => {
                                    setSelectedCaseType(caseType);
                                    setShowModal(true);
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" style={{ color: 'var(--color-primary-400)' }}>
                                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                            </svg>
                                            {caseType.name}
                                        </h3>
                                        {caseType.nameUz && (
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                                                🇺🇿 {caseType.nameUz}
                                            </p>
                                        )}
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                                            {caseType.description}
                                        </p>
                                    </div>
                                    <span className="badge badge-completed">
                                        {parsedSteps(caseType.requiredSteps).length} steps
                                    </span>
                                </div>

                                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                                        REQUIRED STEPS
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                                        {parsedSteps(caseType.requiredSteps).slice(0, 4).map((step: string, i: number) => (
                                            <span
                                                key={i}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--space-1)',
                                                    fontSize: 'var(--font-size-xs)',
                                                    padding: 'var(--space-1) var(--space-2)',
                                                    background: 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                <span style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: 'var(--radius-full)',
                                                    background: 'var(--color-primary-500)',
                                                    color: 'white',
                                                    fontSize: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </span>
                                        ))}
                                        {parsedSteps(caseType.requiredSteps).length > 4 && (
                                            <span style={{
                                                fontSize: 'var(--font-size-xs)',
                                                color: 'var(--color-primary-400)'
                                            }}>
                                                +{parsedSteps(caseType.requiredSteps).length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legal Rules Tab */}
            {activeTab === 'rules' && (
                <div className="animate-fadeIn">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-4)'
                    }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            Laws, regulations, and legal references for compliance checking
                        </p>
                        <button className="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Add Legal Rule
                        </button>
                    </div>

                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64" style={{ margin: '0 auto var(--space-4)', opacity: 0.3, color: 'var(--text-muted)' }}>
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
                            No legal rules defined yet
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', maxWidth: '400px', margin: '0 auto' }}>
                            Add laws and regulations from the Uzbekistan legal code to enable automated compliance checking.
                        </p>
                    </div>
                </div>
            )}

            {/* Case Type Detail Modal */}
            {showModal && selectedCaseType && (
                <div
                    className={`modal-backdrop ${showModal ? 'active' : ''}`}
                    onClick={() => setShowModal(false)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">{selectedCaseType.name}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Translations */}
                            {(selectedCaseType.nameUz || selectedCaseType.nameRu) && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    {selectedCaseType.nameUz && (
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            🇺🇿 {selectedCaseType.nameUz}
                                        </p>
                                    )}
                                    {selectedCaseType.nameRu && (
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            🇷🇺 {selectedCaseType.nameRu}
                                        </p>
                                    )}
                                </div>
                            )}

                            {selectedCaseType.description && (
                                <p style={{ marginBottom: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                                    {selectedCaseType.description}
                                </p>
                            )}

                            {/* Required Steps */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success-400)" strokeWidth="2" width="18" height="18">
                                        <polyline points="9,11 12,14 22,4" />
                                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                    </svg>
                                    Required Steps
                                </h4>
                                <div className="timeline" style={{ paddingLeft: 'var(--space-6)' }}>
                                    {parsedSteps(selectedCaseType.requiredSteps).map((step: string, i: number) => (
                                        <div key={i} className="timeline-item">
                                            <div className="timeline-dot" />
                                            <div className="timeline-content">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 500 }}>Step {i + 1}</span>
                                                    {Object.keys(parsedObject(selectedCaseType.timeLimits)).includes(step) && (
                                                        <span className="badge badge-processing">
                                                            {parsedObject(selectedCaseType.timeLimits)[step]}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                                    {step}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Forbidden Actions */}
                            {selectedCaseType.forbiddenActions && (
                                <div>
                                    <h4 style={{ marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-danger-400)' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                        </svg>
                                        Forbidden Actions
                                    </h4>
                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                        {parsedObject(selectedCaseType.forbiddenActions).map((action: string, i: number) => (
                                            <li
                                                key={i}
                                                style={{
                                                    padding: 'var(--space-3)',
                                                    background: 'rgba(248, 60, 60, 0.1)',
                                                    borderRadius: 'var(--radius-md)',
                                                    marginBottom: 'var(--space-2)',
                                                    fontSize: 'var(--font-size-sm)',
                                                    color: 'var(--color-danger-300)'
                                                }}
                                            >
                                                ⚠️ {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Close
                            </button>
                            <button className="btn btn-primary">
                                Edit Case Type
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
