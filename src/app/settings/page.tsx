'use client';

import { useState } from 'react';
import Header from '@/components/Header';

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [settings, setSettings] = useState({
        language: 'uz',
        autoTranscribe: true,
        autoAnalyze: true,
        emailAlerts: false,
        highRiskThreshold: 70,
    });

    const handleSave = () => {
        // In production, save to API
        alert('Settings saved successfully!');
    };

    return (
        <>
            <Header
                title="Settings"
                subtitle="Configure system preferences and integrations"
            />

            <div style={{ maxWidth: '800px' }}>
                {/* API Configuration */}
                <div className="card mb-6 animate-fadeIn">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        🔑 API Configuration
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
                        Configure your OpenAI API key for speech-to-text transcription
                    </p>

                    <div className="form-group">
                        <label className="form-label">OpenAI API Key</label>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                className="form-input"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowApiKey(!showApiKey)}
                            >
                                {showApiKey ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                            Required for Whisper transcription. Get your key at{' '}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                                platform.openai.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* Analysis Settings */}
                <div className="card mb-6 animate-fadeIn stagger-1">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        ⚙️ Analysis Settings
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Default Language</label>
                            <select
                                className="form-input form-select"
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                style={{ maxWidth: '300px' }}
                            >
                                <option value="uz">Uzbek (Latin)</option>
                                <option value="uz-cyrillic">Uzbek (Cyrillic)</option>
                                <option value="ru">Russian</option>
                                <option value="auto">Auto-detect</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <div>
                                <p style={{ fontWeight: 500 }}>Auto-transcribe uploads</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                    Automatically start transcription when files are uploaded
                                </p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.autoTranscribe}
                                    onChange={(e) => setSettings({ ...settings, autoTranscribe: e.target.checked })}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        accentColor: 'var(--color-primary-500)'
                                    }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                            <div>
                                <p style={{ fontWeight: 500 }}>Auto-analyze transcripts</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                    Automatically run compliance analysis after transcription
                                </p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.autoAnalyze}
                                    onChange={(e) => setSettings({ ...settings, autoAnalyze: e.target.checked })}
                                    style={{
                                        width: '44px',
                                        height: '24px',
                                        accentColor: 'var(--color-primary-500)'
                                    }}
                                />
                            </label>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">High-Risk Alert Threshold</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <input
                                    type="range"
                                    min="30"
                                    max="90"
                                    value={settings.highRiskThreshold}
                                    onChange={(e) => setSettings({ ...settings, highRiskThreshold: parseInt(e.target.value) })}
                                    style={{ flex: 1, accentColor: 'var(--color-primary-500)' }}
                                />
                                <span style={{
                                    fontWeight: 600,
                                    color: 'var(--color-danger-400)',
                                    minWidth: '50px',
                                    textAlign: 'right'
                                }}>
                                    {settings.highRiskThreshold}%
                                </span>
                            </div>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                                Cases with risk scores above this threshold will be flagged for immediate review
                            </p>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card mb-6 animate-fadeIn stagger-2">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        🔔 Notifications
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                        <div>
                            <p style={{ fontWeight: 500 }}>Email alerts for high-risk cases</p>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                Receive email notifications when critical violations are detected
                            </p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={settings.emailAlerts}
                                onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                                style={{
                                    width: '44px',
                                    height: '24px',
                                    accentColor: 'var(--color-primary-500)'
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* System Info */}
                <div className="card mb-6 animate-fadeIn stagger-3">
                    <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                        ℹ️ System Information
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Version</p>
                            <p style={{ fontWeight: 500 }}>SignTrace v1.0.0</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Database</p>
                            <p style={{ fontWeight: 500 }}>SQLite (Development)</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Transcription</p>
                            <p style={{ fontWeight: 500 }}>OpenAI Whisper API</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Environment</p>
                            <p style={{ fontWeight: 500 }}>Development</p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary btn-lg" onClick={handleSave}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Save Settings
                    </button>
                </div>
            </div>
        </>
    );
}
