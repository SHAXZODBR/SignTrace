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
        const caseId = formData.get('caseId') as string || null;
        const institution = formData.get('institution') as string || null;
        const location = formData.get('location') as string || null;
        const recordedAtStr = formData.get('recordedAt') as string || null;
        const participants = formData.get('participants') as string || null;

        // Create recording in database
        const recording = await prisma.recording.create({
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
            undefined, // userId - would come from auth
            recording.id,
            {
                originalName: file.name,
                fileSize: buffer.length,
                mimeType: file.type,
                hash: fileHash,
            }
        );

        return NextResponse.json({
            success: true,
            recording: {
                id: recording.id,
                filename: recording.filename,
                originalName: recording.originalName,
                fileHash: recording.fileHash,
                fileSize: recording.fileSize,
                mimeType: recording.mimeType,
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
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const caseId = searchParams.get('caseId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

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
        console.error('Error fetching recordings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recordings' },
            { status: 500 }
        );
    }
}
