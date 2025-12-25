'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Metadata form state
    const [caseId, setCaseId] = useState('');
    const [institution, setInstitution] = useState('');
    const [location, setLocation] = useState('');
    const [recordedAt, setRecordedAt] = useState('');
    const [participants, setParticipants] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
            setUploadError(null);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            setUploadError(null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('caseId', caseId);
            formData.append('institution', institution);
            formData.append('location', location);
            formData.append('recordedAt', recordedAt);
            formData.append('participants', participants);

            // Simulate progress (actual progress tracking requires XMLHttpRequest)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await response.json();
            console.log('Upload successful:', result);

            setUploadSuccess(true);

            // Redirect to cases after 2 seconds
            setTimeout(() => {
                router.push('/cases');
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setUploading(false);
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
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ color: 'var(--color-primary-400)' }}>
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                </svg>
            );
        }
        if (mimeType.startsWith('video/')) {
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ color: 'var(--color-accent-400)' }}>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
            );
        }
        return (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48" style={{ color: 'var(--text-secondary)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </svg>
        );
    };

    return (
        <>
            <Header
                title="Upload Recording"
                subtitle="Upload audio or video recordings for process analysis"
            />

            <div style={{ maxWidth: '900px' }}>
                {uploadSuccess ? (
                    <div className="card animate-scaleIn" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-6)'
                        }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-success-400)" strokeWidth="2" width="40" height="40">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2 style={{ marginBottom: 'var(--space-2)' }}>Upload Successful!</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                            Your recording has been uploaded and is ready for analysis.
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Redirecting to cases...
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                        {/* Upload Zone */}
                        <div className="card animate-fadeIn">
                            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                                Select Recording
                            </h3>

                            <div
                                className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*,video/*,application/pdf,image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                {selectedFile ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
                                        {getFileIcon(selectedFile.type)}
                                        <div style={{ textAlign: 'center' }}>
                                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                                                {selectedFile.name}
                                            </p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                                {formatFileSize(selectedFile.size)} • {selectedFile.type}
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                            }}
                                        >
                                            Change File
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="upload-zone-icon" style={{ color: 'var(--text-muted)' }}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="64" height="64">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="17,8 12,3 7,8" />
                                                <line x1="12" y1="3" x2="12" y2="15" />
                                            </svg>
                                        </div>
                                        <p className="upload-zone-title">
                                            Drag and drop your recording here
                                        </p>
                                        <p className="upload-zone-subtitle">
                                            or click to browse • Audio, Video, PDF supported
                                        </p>
                                    </>
                                )}
                            </div>

                            {uploading && (
                                <div style={{ marginTop: 'var(--space-4)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                            Uploading...
                                        </span>
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {uploadError && (
                                <div className="alert alert-danger" style={{ marginTop: 'var(--space-4)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <span>{uploadError}</span>
                                </div>
                            )}
                        </div>

                        {/* Metadata Form */}
                        <div className="card animate-fadeIn stagger-1">
                            <h3 className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
                                Recording Metadata
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-6)' }}>
                                Optional: Add context information for better analysis
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Case ID</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., CASE-2024-001"
                                        value={caseId}
                                        onChange={(e) => setCaseId(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Institution</label>
                                    <select
                                        className="form-input form-select"
                                        value={institution}
                                        onChange={(e) => setInstitution(e.target.value)}
                                    >
                                        <option value="">Select institution...</option>
                                        <option value="court">Court</option>
                                        <option value="police">Police Department</option>
                                        <option value="ministry">Ministry</option>
                                        <option value="municipal">Municipal Office</option>
                                        <option value="customs">Customs</option>
                                        <option value="tax">Tax Authority</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Tashkent, Room 205"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Date & Time of Recording</label>
                                    <input
                                        type="datetime-local"
                                        className="form-input"
                                        value={recordedAt}
                                        onChange={(e) => setRecordedAt(e.target.value)}
                                    />
                                </div>

                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Participants</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        placeholder="List the participants, one per line. e.g.:&#10;Judge Akmal Yusupov&#10;Defendant Rustam Karimov&#10;Prosecutor..."
                                        value={participants}
                                        onChange={(e) => setParticipants(e.target.value)}
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="alert alert-info animate-fadeIn stagger-2">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24" style={{ flexShrink: 0 }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div>
                                <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Secure & Immutable Storage</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9 }}>
                                    All recordings are SHA-256 hashed for integrity verification.
                                    Each upload creates an audit log entry that cannot be modified.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => router.push('/cases')}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={handleUpload}
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? (
                                    <>
                                        <span className="spinner" style={{ width: '20px', height: '20px' }} />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17,8 12,3 7,8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Upload & Analyze
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
