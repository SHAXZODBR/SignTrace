import prisma from './prisma';

export interface BiasIndicator {
    type: 'ethnic' | 'political' | 'economic' | 'regional' | 'personal';
    description: string;
    confidence: number;
    deviationScore: number;
    comparisonData: Record<string, unknown>;
}

export interface BiasAnalysisResult {
    recordingId: string;
    flags: BiasIndicator[];
    overallBiasRisk: number;
    isAnomaly: boolean;
    comparisonSummary: string;
}

/**
 * Analyze a case for bias patterns
 */
export async function analyzeBias(
    recordingId: string
): Promise<BiasAnalysisResult> {
    // Get the current case data
    const recording = await prisma.recording.findUnique({
        where: { id: recordingId },
        include: {
            complianceReport: true,
            processEvents: true,
        },
    });

    if (!recording || !recording.complianceReport) {
        throw new Error('Recording or compliance report not found');
    }

    // Get comparison data from similar cases
    const similarCases = await getSimilarCases(recording);

    const flags: BiasIndicator[] = [];

    // Analyze for statistical anomalies
    const anomalyResult = analyzeStatisticalAnomaly(recording.complianceReport, similarCases);
    if (anomalyResult) {
        flags.push(anomalyResult);
    }

    // Analyze for procedural inconsistency
    const inconsistencyResult = analyzeProceduralInconsistency(recording.processEvents, similarCases);
    if (inconsistencyResult) {
        flags.push(inconsistencyResult);
    }

    // Analyze official behavior patterns
    const behaviorResult = analyzeOfficialBehavior(recording, similarCases);
    if (behaviorResult) {
        flags.push(behaviorResult);
    }

    // Calculate overall bias risk
    const overallBiasRisk = calculateBiasRisk(flags);
    const isAnomaly = overallBiasRisk > 50;

    // Store bias flags
    for (const flag of flags) {
        await prisma.biasFlag.create({
            data: {
                complianceReportId: recording.complianceReport.id,
                type: flag.type,
                description: flag.description,
                confidence: flag.confidence,
                deviationScore: flag.deviationScore,
                comparisonData: JSON.stringify(flag.comparisonData),
            },
        });
    }

    // Generate comparison summary
    const comparisonSummary = generateComparisonSummary(flags, similarCases.length);

    return {
        recordingId,
        flags,
        overallBiasRisk,
        isAnomaly,
        comparisonSummary,
    };
}

/**
 * Get similar cases for comparison
 */
async function getSimilarCases(
    currentRecording: { institution?: string | null; caseId?: string | null }
) {
    // Find cases from the same institution
    const similarCases = await prisma.recording.findMany({
        where: {
            institution: currentRecording.institution,
            complianceReport: { isNot: null },
        },
        include: {
            complianceReport: {
                include: { violations: true },
            },
            processEvents: true,
        },
        take: 50,
        orderBy: { createdAt: 'desc' },
    });

    return similarCases;
}

/**
 * Analyze for statistical anomalies in compliance scores
 */
function analyzeStatisticalAnomaly(
    currentReport: { complianceScore: number; riskScore: number },
    similarCases: Array<{ complianceReport: { complianceScore: number; riskScore: number } | null }>
): BiasIndicator | null {
    if (similarCases.length < 5) return null;

    const scores = similarCases
        .filter(c => c.complianceReport)
        .map(c => c.complianceReport!.complianceScore);

    if (scores.length < 5) return null;

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(
        scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length
    );

    const deviation = Math.abs(currentReport.complianceScore - avgScore);
    const zScore = stdDev > 0 ? deviation / stdDev : 0;

    // Flag if more than 2 standard deviations from mean
    if (zScore > 2) {
        return {
            type: 'personal',
            description: `This case deviates significantly from similar cases (${Math.round(deviation)} points from average)`,
            confidence: Math.min(0.5 + (zScore - 2) * 0.15, 0.95),
            deviationScore: zScore,
            comparisonData: {
                currentScore: currentReport.complianceScore,
                averageScore: Math.round(avgScore),
                standardDeviation: Math.round(stdDev),
                sampleSize: scores.length,
            },
        };
    }

    return null;
}

/**
 * Analyze for procedural inconsistency compared to similar cases
 */
function analyzeProceduralInconsistency(
    currentEvents: Array<{ action: string }>,
    similarCases: Array<{ processEvents: Array<{ action: string }> }>
): BiasIndicator | null {
    if (similarCases.length < 3) return null;

    // Calculate average number of events in similar cases
    const eventCounts = similarCases.map(c => c.processEvents.length);
    const avgEvents = eventCounts.reduce((a, b) => a + b, 0) / eventCounts.length;

    // Check if this case has significantly fewer events (might indicate shortcuts)
    const eventDifference = avgEvents - currentEvents.length;
    const percentDiff = (eventDifference / avgEvents) * 100;

    if (percentDiff > 40 && currentEvents.length > 0) {
        return {
            type: 'personal',
            description: `This case had ${Math.round(percentDiff)}% fewer procedural steps than similar cases`,
            confidence: Math.min(0.5 + (percentDiff / 100) * 0.4, 0.85),
            deviationScore: percentDiff / 20,
            comparisonData: {
                currentEventCount: currentEvents.length,
                averageEventCount: Math.round(avgEvents),
                percentageDifference: Math.round(percentDiff),
            },
        };
    }

    return null;
}

/**
 * Analyze official behavior patterns across cases
 */
function analyzeOfficialBehavior(
    currentRecording: {
        complianceReport: { complianceScore: number } | null;
        processEvents: Array<{ speaker?: string | null }>
    },
    similarCases: Array<{
        complianceReport: { complianceScore: number } | null;
        processEvents: Array<{ speaker?: string | null }>
    }>
): BiasIndicator | null {
    // Extract unique officials from current case
    const currentOfficials = [...new Set(
        currentRecording.processEvents
            .map(e => e.speaker)
            .filter(Boolean)
    )];

    if (currentOfficials.length === 0) return null;

    // Find cases handled by the same officials
    const officialCases = similarCases.filter(c => {
        const officials = c.processEvents.map(e => e.speaker).filter(Boolean);
        return officials.some(o => currentOfficials.includes(o as string));
    });

    if (officialCases.length < 3) return null;

    // Calculate average score for this official's cases
    const officialScores = officialCases
        .filter(c => c.complianceReport)
        .map(c => c.complianceReport!.complianceScore);

    if (officialScores.length < 3) return null;

    const avgOfficialScore = officialScores.reduce((a, b) => a + b, 0) / officialScores.length;

    // Compare to overall average
    const allScores = similarCases
        .filter(c => c.complianceReport)
        .map(c => c.complianceReport!.complianceScore);
    const overallAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    const scoreDiff = avgOfficialScore - overallAvg;

    // Flag if official's cases consistently score lower
    if (scoreDiff < -15) {
        return {
            type: 'personal',
            description: `Cases handled by this official(s) average ${Math.round(Math.abs(scoreDiff))} points lower than overall average`,
            confidence: Math.min(0.5 + (Math.abs(scoreDiff) / 30) * 0.35, 0.8),
            deviationScore: Math.abs(scoreDiff) / 10,
            comparisonData: {
                officialAverage: Math.round(avgOfficialScore),
                overallAverage: Math.round(overallAvg),
                officialCaseCount: officialCases.length,
                officials: currentOfficials,
            },
        };
    }

    return null;
}

/**
 * Calculate overall bias risk score
 */
function calculateBiasRisk(flags: BiasIndicator[]): number {
    if (flags.length === 0) return 0;

    let risk = 0;
    for (const flag of flags) {
        risk += flag.confidence * flag.deviationScore * 20;
    }

    return Math.min(Math.round(risk), 100);
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(flags: BiasIndicator[], sampleSize: number): string {
    if (flags.length === 0) {
        return `Compared against ${sampleSize} similar cases. No significant anomalies detected.`;
    }

    const issues = flags.map(f => f.description).join('; ');
    return `Compared against ${sampleSize} similar cases. Detected ${flags.length} potential concern(s): ${issues}`;
}

/**
 * Get cross-case statistics for an institution
 */
export async function getInstitutionStats(institution: string) {
    const cases = await prisma.recording.findMany({
        where: {
            institution,
            complianceReport: { isNot: null },
        },
        include: {
            complianceReport: true,
        },
    });

    if (cases.length === 0) {
        return null;
    }

    const scores = cases
        .filter(c => c.complianceReport)
        .map(c => c.complianceReport!.complianceScore);

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const highRiskCount = cases.filter(c =>
        c.complianceReport?.severityLevel === 'high' ||
        c.complianceReport?.severityLevel === 'critical'
    ).length;

    return {
        institution,
        totalCases: cases.length,
        averageComplianceScore: Math.round(avgScore),
        minComplianceScore: minScore,
        maxComplianceScore: maxScore,
        highRiskCases: highRiskCount,
        highRiskPercentage: Math.round((highRiskCount / cases.length) * 100),
    };
}
