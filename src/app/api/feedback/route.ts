import { NextRequest, NextResponse } from 'next/server';
import { storeCorrection, getTrainingStats, exportTrainingData, validateCorrection } from '@/lib/trainingData';

/**
 * POST /api/feedback - Submit expert correction
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            recordingId,
            correctionType,
            originalOutput,
            correctedOutput,
            expertId,
            notes,
        } = body;

        // Validate required fields
        if (!recordingId || !correctionType || !correctedOutput) {
            return NextResponse.json(
                { error: 'Missing required fields: recordingId, correctionType, correctedOutput' },
                { status: 400 }
            );
        }

        // Validate correction type
        const validTypes = ['transcription', 'event_extraction', 'compliance', 'bias'];
        if (!validTypes.includes(correctionType)) {
            return NextResponse.json(
                { error: `Invalid correctionType. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate correction structure
        const validation = validateCorrection(correctionType, correctedOutput);
        if (!validation.valid) {
            return NextResponse.json(
                { error: 'Invalid correction structure', details: validation.errors },
                { status: 400 }
            );
        }

        // Store the correction
        await storeCorrection(
            recordingId,
            correctionType,
            originalOutput || {},
            correctedOutput,
            expertId || 'anonymous',
            notes
        );

        // Get updated stats
        const stats = await getTrainingStats();

        return NextResponse.json({
            success: true,
            message: 'Correction stored for training',
            trainingStats: stats,
        });

    } catch (error) {
        console.error('Feedback API error:', error);
        return NextResponse.json(
            { error: 'Failed to store correction' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/feedback - Get training data statistics
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'export') {
            const type = searchParams.get('type') as any;
            if (!type) {
                return NextResponse.json(
                    { error: 'Export requires type parameter' },
                    { status: 400 }
                );
            }

            const result = await exportTrainingData(type);
            return NextResponse.json({
                success: true,
                exported: result.count,
                path: result.path,
            });
        }

        const stats = await getTrainingStats();

        return NextResponse.json({
            stats,
            readyForFineTuning: stats.total >= 100,
            recommendation: stats.total < 100
                ? `Collect ${100 - stats.total} more corrections before fine-tuning`
                : 'Ready for model fine-tuning',
        });

    } catch (error) {
        console.error('Feedback stats error:', error);
        return NextResponse.json(
            { error: 'Failed to get training stats' },
            { status: 500 }
        );
    }
}
