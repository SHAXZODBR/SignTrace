import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processTranscription } from '@/lib/transcription';
import { reconstructProcess, analyzeComplianceWithAI } from '@/lib/processEngine';
import path from 'path';

/**
 * POST /api/analyze - Run full analysis pipeline on a recording
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recordingId } = body;

        if (!recordingId) {
            return NextResponse.json(
                { error: 'recordingId is required' },
                { status: 400 }
            );
        }

        // Get recording
        const recording = await prisma.recording.findUnique({
            where: { id: recordingId },
        });

        if (!recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        // Build file path
        const filePath = path.join(process.cwd(), 'public', recording.filePath);

        // Step 1: Transcription (uses Whisper API if key available)
        console.log('[Analyze] Starting transcription...');
        const transcription = await processTranscription(recordingId, filePath);

        // Step 2: Process Reconstruction (uses GPT-4 if key available)
        console.log('[Analyze] Reconstructing process...');
        const processAnalysis = await reconstructProcess(
            recordingId,
            transcription.fullText,
            recording.caseId || undefined
        );

        // Step 3: Get required steps from knowledge base
        let requiredSteps: string[] = [];
        if (recording.caseId) {
            const caseType = await prisma.caseType.findFirst({
                where: { name: { contains: recording.caseId } },
            });
            if (caseType) {
                requiredSteps = JSON.parse(caseType.requiredSteps || '[]');
            }
        }

        // Step 4: Compliance Analysis
        console.log('[Analyze] Analyzing compliance...');
        const compliance = await analyzeComplianceWithAI(
            processAnalysis.events,
            processAnalysis.detectedCaseType,
            requiredSteps
        );

        // Step 5: Create compliance report
        const complianceReport = await prisma.complianceReport.upsert({
            where: { recordingId },
            update: {
                complianceScore: compliance.complianceScore,
                riskScore: Math.max(0, 100 - compliance.complianceScore),
                severityLevel: compliance.complianceScore >= 70 ? 'low' :
                    compliance.complianceScore >= 50 ? 'medium' : 'high',
                summary: processAnalysis.summary,
                recommendation: compliance.recommendations?.join('. ') || '',
                updatedAt: new Date(),
            },
            create: {
                recordingId,
                complianceScore: compliance.complianceScore,
                riskScore: Math.max(0, 100 - compliance.complianceScore),
                severityLevel: compliance.complianceScore >= 70 ? 'low' :
                    compliance.complianceScore >= 50 ? 'medium' : 'high',
                summary: processAnalysis.summary,
                recommendation: compliance.recommendations?.join('. ') || '',
            },
        });

        // Step 6: Store violations
        for (const violation of compliance.violations || []) {
            await prisma.violation.create({
                data: {
                    complianceReportId: complianceReport.id,
                    type: violation.type,
                    description: violation.description,
                    severity: violation.severity,
                },
            });
        }

        // Update recording status
        await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'completed' },
        });

        console.log('[Analyze] Analysis complete');

        return NextResponse.json({
            success: true,
            recordingId,
            transcription: {
                language: transcription.language,
                confidence: transcription.confidence,
                segmentCount: transcription.segments.length,
            },
            processAnalysis: {
                eventCount: processAnalysis.events.length,
                detectedCaseType: processAnalysis.detectedCaseType,
                potentialIssues: processAnalysis.potentialIssues,
            },
            compliance: {
                score: compliance.complianceScore,
                violationCount: compliance.violations?.length || 0,
            },
        });

    } catch (error) {
        console.error('[Analyze] Pipeline error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Analysis failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analyze - Get analysis results for a recording
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const recordingId = searchParams.get('recordingId');

        if (!recordingId) {
            return NextResponse.json(
                { error: 'recordingId parameter is required' },
                { status: 400 }
            );
        }

        const recording = await prisma.recording.findUnique({
            where: { id: recordingId },
            include: {
                transcript: true,
                processEvents: {
                    orderBy: { stepNumber: 'asc' },
                },
                complianceReport: {
                    include: {
                        violations: true,
                        biasFlags: true,
                    },
                },
            },
        });

        if (!recording) {
            return NextResponse.json(
                { error: 'Recording not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            recording: {
                id: recording.id,
                filename: recording.filename,
                originalName: recording.originalName,
                status: recording.status,
                duration: recording.duration,
                caseId: recording.caseId,
                institution: recording.institution,
                createdAt: recording.createdAt,
            },
            transcript: recording.transcript ? {
                fullText: recording.transcript.fullText,
                language: recording.transcript.language,
                confidence: recording.transcript.confidence,
                segments: JSON.parse(recording.transcript.segments || '[]'),
            } : null,
            processEvents: recording.processEvents.map(e => ({
                ...e,
                entities: JSON.parse(e.entities || '[]'),
            })),
            complianceReport: recording.complianceReport ? {
                complianceScore: recording.complianceReport.complianceScore,
                riskScore: recording.complianceReport.riskScore,
                severityLevel: recording.complianceReport.severityLevel,
                summary: recording.complianceReport.summary,
                recommendation: recording.complianceReport.recommendation,
                violations: recording.complianceReport.violations,
                biasFlags: recording.complianceReport.biasFlags,
            } : null,
        });

    } catch (error) {
        console.error('[Analyze] Get error:', error);
        return NextResponse.json(
            { error: 'Failed to get analysis results' },
            { status: 500 }
        );
    }
}
