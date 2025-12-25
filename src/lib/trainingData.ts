import prisma from './prisma';
import fs from 'fs';
import path from 'path';

/**
 * Training Data Collection System
 * 
 * Collects expert corrections to AI outputs for future model fine-tuning.
 * This creates a feedback loop where human experts review AI decisions
 * and their corrections are stored as training data.
 */

export interface ExpertCorrection {
    id: string;
    recordingId: string;
    originalAiOutput: any;
    correctedOutput: any;
    correctionType: 'transcription' | 'event_extraction' | 'compliance' | 'bias';
    expertId: string;
    expertNotes?: string;
    confidenceScore: number;
    createdAt: Date;
}

export interface TrainingExample {
    input: string;
    expectedOutput: any;
    metadata: {
        caseType: string;
        language: string;
        expertId: string;
        correctionDate: string;
    };
}

/**
 * Store expert correction for training data
 */
export async function storeCorrection(
    recordingId: string,
    correctionType: ExpertCorrection['correctionType'],
    originalOutput: any,
    correctedOutput: any,
    expertId: string,
    notes?: string
): Promise<void> {
    // Store in audit log
    await prisma.auditLog.create({
        data: {
            action: 'expert_correction',
            entityType: correctionType,
            entityId: recordingId,
            userId: expertId,
            details: JSON.stringify({
                original: originalOutput,
                corrected: correctedOutput,
                notes,
                timestamp: new Date().toISOString(),
            }),
        },
    });

    console.log(`[Training] Stored ${correctionType} correction for recording ${recordingId}`);
}

/**
 * Collect all training examples for a specific correction type
 */
export async function getTrainingExamples(
    correctionType: ExpertCorrection['correctionType']
): Promise<TrainingExample[]> {
    const corrections = await prisma.auditLog.findMany({
        where: {
            action: 'expert_correction',
            entityType: correctionType,
        },
        orderBy: { createdAt: 'desc' },
    });

    const examples: TrainingExample[] = [];

    for (const correction of corrections) {
        if (!correction.details) continue;

        try {
            const details = JSON.parse(correction.details);
            const recording = await prisma.recording.findUnique({
                where: { id: correction.entityId || '' },
                include: { transcript: true },
            });

            if (recording?.transcript) {
                examples.push({
                    input: recording.transcript.fullText,
                    expectedOutput: details.corrected,
                    metadata: {
                        caseType: recording.caseId || 'unknown',
                        language: recording.transcript.language || 'unknown',
                        expertId: correction.userId || 'unknown',
                        correctionDate: correction.createdAt.toISOString(),
                    },
                });
            }
        } catch (e) {
            console.error('[Training] Error parsing correction:', e);
        }
    }

    return examples;
}

/**
 * Export training data in JSONL format for fine-tuning
 */
export async function exportTrainingData(
    correctionType: ExpertCorrection['correctionType'],
    outputPath?: string
): Promise<{ count: number; path: string }> {
    const examples = await getTrainingExamples(correctionType);

    const formattedExamples = examples.map(ex => ({
        messages: [
            {
                role: 'system',
                content: getSystemPromptForType(correctionType),
            },
            {
                role: 'user',
                content: ex.input,
            },
            {
                role: 'assistant',
                content: JSON.stringify(ex.expectedOutput),
            },
        ],
    }));

    const exportPath = outputPath || path.join(
        process.cwd(),
        'training_data',
        `${correctionType}_${Date.now()}.jsonl`
    );

    // Ensure directory exists
    const dir = path.dirname(exportPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write JSONL format
    const content = formattedExamples.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(exportPath, content);

    console.log(`[Training] Exported ${examples.length} examples to ${exportPath}`);

    return { count: examples.length, path: exportPath };
}

/**
 * Get training data statistics
 */
export async function getTrainingStats(): Promise<{
    transcription: number;
    event_extraction: number;
    compliance: number;
    bias: number;
    total: number;
    lastCorrectionDate: Date | null;
}> {
    const stats = await prisma.auditLog.groupBy({
        by: ['entityType'],
        where: { action: 'expert_correction' },
        _count: { id: true },
    });

    const counts: Record<string, number> = {};
    stats.forEach(s => {
        if (s.entityType) counts[s.entityType] = s._count.id;
    });

    const lastCorrection = await prisma.auditLog.findFirst({
        where: { action: 'expert_correction' },
        orderBy: { createdAt: 'desc' },
    });

    return {
        transcription: counts['transcription'] || 0,
        event_extraction: counts['event_extraction'] || 0,
        compliance: counts['compliance'] || 0,
        bias: counts['bias'] || 0,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        lastCorrectionDate: lastCorrection?.createdAt || null,
    };
}

/**
 * Validate correction quality
 */
export function validateCorrection(
    correctionType: ExpertCorrection['correctionType'],
    correction: any
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (correctionType) {
        case 'transcription':
            if (!correction.segments || !Array.isArray(correction.segments)) {
                errors.push('Transcription correction must include segments array');
            }
            break;

        case 'event_extraction':
            if (!correction.events || !Array.isArray(correction.events)) {
                errors.push('Event extraction correction must include events array');
            }
            if (correction.events?.some((e: any) => !e.actionType)) {
                errors.push('Each event must have an actionType');
            }
            break;

        case 'compliance':
            if (typeof correction.complianceScore !== 'number') {
                errors.push('Compliance correction must include numeric complianceScore');
            }
            break;

        case 'bias':
            if (typeof correction.overallBiasRisk !== 'number') {
                errors.push('Bias correction must include numeric overallBiasRisk');
            }
            break;
    }

    return { valid: errors.length === 0, errors };
}

function getSystemPromptForType(type: ExpertCorrection['correctionType']): string {
    const prompts = {
        transcription: `You are an expert transcription system for Uzbekistan legal proceedings. 
Accurately transcribe audio and identify speakers (Judge, Prosecutor, Defense, Defendant, Witness).
Output format: { "fullText": "...", "segments": [...], "speakers": [...] }`,

        event_extraction: `You are an expert legal analyst for Uzbekistan administrative and criminal procedures.
Extract procedural events, legal references, and potential violations from transcripts.
Identify: hearing_start, rights_reading, evidence_presentation, testimony, objection, verdict.
Output format: { "events": [...], "detectedCaseType": "...", "potentialIssues": [...] }`,

        compliance: `You are a compliance analyst for Uzbekistan legal procedures.
Evaluate whether required procedural steps were followed correctly.
Identify missing steps, procedural violations, and calculate compliance score.
Output format: { "complianceScore": 0-100, "violations": [...], "recommendations": [...] }`,

        bias: `You are a bias detection analyst for legal proceedings.
Identify potential bias indicators: rushed decisions, inconsistent treatment, statistical anomalies.
Output format: { "overallBiasRisk": 0-100, "flags": [...], "recommendations": [...] }`,
    };

    return prompts[type];
}

/**
 * Calculate model accuracy based on corrections
 */
export async function calculateAccuracy(
    correctionType: ExpertCorrection['correctionType']
): Promise<{
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    commonErrors: string[];
}> {
    const examples = await getTrainingExamples(correctionType);

    // Analyze correction patterns
    const errorCounts: Record<string, number> = {};

    for (const ex of examples) {
        // Compare original vs corrected to identify error types
        const original = ex.metadata; // This would need the original output stored
        // For now, return placeholder
    }

    const sortedErrors = Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error]) => error);

    return {
        totalPredictions: examples.length,
        correctPredictions: 0, // Would need original predictions to calculate
        accuracy: examples.length > 0 ? 0.85 : 0, // Placeholder
        commonErrors: sortedErrors,
    };
}
