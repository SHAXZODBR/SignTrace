import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { calculateHash, createAuditLog, AuditActions, EntityTypes } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadsDir() {
    try {
        await mkdir(UPLOADS_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

export async function POST(request: NextRequest) {
    try {
        await ensureUploadsDir();

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            'audio/wav', 'audio/flac', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm',
            'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime',
            'application/pdf', 'image/png', 'image/jpeg', 'image/jpg'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}. Allowed: audio, video, PDF, images.` },
                { status: 400 }
            );
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Calculate SHA-256 hash for integrity
        const fileHash = calculateHash(buffer);

        // Generate unique filename
        const fileId = uuidv4();
        const extension = path.extname(file.name);
        const filename = `${fileId}${extension}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Save file to disk
        await writeFile(filePath, buffer);

        // Get metadata from form
        const caseId = formData.get('caseId') as string || `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
        const institution = formData.get('institution') as string || 'Demo Institution';
        const location = formData.get('location') as string || 'Toshkent';
        const recordedAtStr = formData.get('recordedAt') as string || null;
        const participants = formData.get('participants') as string || null;

        // Try to save to database, fallback to demo mode if fails
        let recording;
        let demoMode = false;

        try {
            // Create recording in database
            recording = await prisma.recording.create({
                data: {
                    id: fileId,
                    filename,
                    originalName: file.name,
                    filePath: `/uploads/${filename}`,
                    fileHash,
                    fileSize: buffer.length,
                    mimeType: file.type,
                    caseId,
                    institution,
                    location,
                    recordedAt: recordedAtStr ? new Date(recordedAtStr) : null,
                    participants,
                    status: 'pending',
                },
            });

            // Create audit log
            await createAuditLog(
                AuditActions.UPLOAD,
                EntityTypes.RECORDING,
                recording.id,
                undefined,
                recording.id,
                {
                    originalName: file.name,
                    fileSize: buffer.length,
                    mimeType: file.type,
                    hash: fileHash,
                }
            );
        } catch (dbError) {
            console.warn('[Upload] Database unavailable, using demo mode:', dbError);
            demoMode = true;

            // Create simulated recording for demo
            recording = {
                id: fileId,
                filename,
                originalName: file.name,
                filePath: `/uploads/${filename}`,
                fileHash,
                fileSize: buffer.length,
                mimeType: file.type,
                caseId,
                institution,
                status: 'pending',
                createdAt: new Date(),
            };
        }

        return NextResponse.json({
            success: true,
            demoMode,
            recording: {
                id: recording.id,
                filename: recording.filename,
                originalName: recording.originalName,
                fileHash: recording.fileHash,
                fileSize: recording.fileSize,
                mimeType: recording.mimeType,
                caseId: recording.caseId,
                institution: recording.institution,
                status: recording.status,
                createdAt: recording.createdAt,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const caseId = searchParams.get('caseId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (caseId) where.caseId = caseId;

        const [recordings, total] = await Promise.all([
            prisma.recording.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
                include: {
                    transcript: {
                        select: { id: true, language: true, confidence: true },
                    },
                    complianceReport: {
                        select: { id: true, complianceScore: true, riskScore: true, severityLevel: true },
                    },
                },
            }),
            prisma.recording.count({ where }),
        ]);

        return NextResponse.json({
            recordings,
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.warn('[Upload GET] Database unavailable, returning demo data:', error);

        // Return demo data when database fails
        const demoRecordings = [
            {
                id: 'demo-001',
                originalName: 'Toshkent viloyat sudi - Ma\'muriy ish.mp3',
                filename: 'court_hearing_001.mp3',
                fileSize: 15000000,
                mimeType: 'audio/mp3',
                status: 'completed',
                caseId: 'CASE-2024-0892',
                institution: 'Toshkent viloyat sudi',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                complianceReport: { id: 'r1', complianceScore: 67, riskScore: 33, severityLevel: 'medium' },
            },
            {
                id: 'demo-002',
                originalName: 'Soliq tekshiruvi - OOO Baraka.mp3',
                filename: 'tax_inspection.mp3',
                fileSize: 8500000,
                mimeType: 'audio/mp3',
                status: 'completed',
                caseId: 'CASE-2024-0890',
                institution: 'Davlat soliq qo\'mitasi',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                complianceReport: { id: 'r2', complianceScore: 42, riskScore: 58, severityLevel: 'high' },
            },
            {
                id: 'demo-003',
                originalName: 'Tergov - jinoyat ishi.mp3',
                filename: 'investigation.mp3',
                fileSize: 22000000,
                mimeType: 'audio/mp3',
                status: 'completed',
                caseId: 'CASE-2024-0889',
                institution: 'Buxoro viloyat IIB',
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                complianceReport: { id: 'r3', complianceScore: 28, riskScore: 72, severityLevel: 'critical' },
            },
            {
                id: 'demo-004',
                originalName: 'Yo\'l harakati buzilishi.mp3',
                filename: 'traffic.mp3',
                fileSize: 5000000,
                mimeType: 'audio/mp3',
                status: 'completed',
                caseId: 'CASE-2024-0891',
                institution: 'Samarqand YHX',
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                complianceReport: { id: 'r4', complianceScore: 89, riskScore: 11, severityLevel: 'low' },
            },
            {
                id: 'demo-005',
                originalName: 'Litsenziya ko\'rib chiqish.mp3',
                filename: 'permit.mp3',
                fileSize: 7200000,
                mimeType: 'audio/mp3',
                status: 'pending',
                caseId: 'CASE-2024-0888',
                institution: 'Toshkent hokimligi',
                createdAt: new Date().toISOString(),
                complianceReport: null,
            },
        ];

        return NextResponse.json({
            recordings: demoRecordings,
            total: demoRecordings.length,
            limit,
            offset,
            demoMode: true,
        });
    }
}
