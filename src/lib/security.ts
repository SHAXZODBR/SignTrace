import crypto from 'crypto';
import { readFile } from 'fs/promises';
import prisma from './prisma';

/**
 * Calculate SHA-256 hash of a file buffer
 */
export function calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA-256 hash of a file from path
 */
export async function calculateFileHash(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    return calculateHash(buffer);
}

/**
 * Verify file integrity by comparing hashes
 */
export function verifyIntegrity(buffer: Buffer, expectedHash: string): boolean {
    const actualHash = calculateHash(buffer);
    return actualHash === expectedHash;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
    action: string,
    entityType: string,
    entityId?: string,
    userId?: string,
    recordingId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
): Promise<void> {
    // Get the previous log entry for chain integrity
    const previousLog = await prisma.auditLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { entryHash: true },
    });

    // Create entry data
    const entryData = {
        action,
        entityType,
        entityId,
        userId,
        recordingId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
        previousHash: previousLog?.entryHash || null,
    };

    // Calculate hash of this entry for chain integrity
    const entryHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(entryData))
        .digest('hex');

    await prisma.auditLog.create({
        data: {
            ...entryData,
            entryHash,
        },
    });
}

/**
 * Audit action types
 */
export const AuditActions = {
    UPLOAD: 'upload',
    VIEW: 'view',
    ANALYZE: 'analyze',
    TRANSCRIBE: 'transcribe',
    REVIEW: 'review',
    EXPORT: 'export',
    DELETE: 'delete',
    LOGIN: 'login',
    LOGOUT: 'logout',
    CREATE: 'create',
    UPDATE: 'update',
} as const;

/**
 * Entity types for audit logging
 */
export const EntityTypes = {
    RECORDING: 'recording',
    TRANSCRIPT: 'transcript',
    REPORT: 'report',
    RULE: 'rule',
    CASE_TYPE: 'case_type',
    USER: 'user',
} as const;
