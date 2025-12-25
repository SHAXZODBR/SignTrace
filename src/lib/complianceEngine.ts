import prisma from './prisma';
import { ProcessEvent } from './processEngine';
import { createAuditLog, AuditActions, EntityTypes } from './security';

export interface Violation {
    type: 'missing_step' | 'wrong_order' | 'informal_decision' | 'no_justification' | 'retroactive';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidenceText?: string;
    evidenceTime?: string;
    violatedRule?: string;
}

export interface ComplianceResult {
    recordingId: string;
    caseTypeId?: string;
    complianceScore: number;
    riskScore: number;
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
    violations: Violation[];
    summary: string;
    recommendation?: string;
}

/**
 * Main compliance analysis function
 */
export async function analyzeCompliance(
    recordingId: string,
    caseTypeId?: string
): Promise<ComplianceResult> {
    // Get process events
    const processEvents = await prisma.processEvent.findMany({
        where: { recordingId },
        orderBy: { stepNumber: 'asc' },
    });

    // Get case type for required steps
    let caseType = null;
    if (caseTypeId) {
        caseType = await prisma.caseType.findUnique({
            where: { id: caseTypeId },
        });
    }

    // If no case type specified, try to detect from events
    if (!caseType) {
        const allCaseTypes = await prisma.caseType.findMany();
        caseType = detectBestMatchingCaseType(processEvents, allCaseTypes);
    }

    const violations: Violation[] = [];

    if (caseType) {
        const requiredSteps = JSON.parse(caseType.requiredSteps || '[]');
        const forbiddenActions = JSON.parse(caseType.forbiddenActions || '[]');
        const timeLimits = JSON.parse(caseType.timeLimits || '{}');

        // Check for missing required steps
        const missingSteps = checkMissingSteps(processEvents, requiredSteps);
        violations.push(...missingSteps);

        // Check for wrong order
        const orderViolations = checkStepOrder(processEvents, requiredSteps);
        violations.push(...orderViolations);

        // Check for forbidden actions
        const forbiddenViolations = checkForbiddenActions(processEvents, forbiddenActions);
        violations.push(...forbiddenViolations);

        // Check for informal decisions before evidence
        const informalDecisions = checkInformalDecisions(processEvents);
        violations.push(...informalDecisions);
    }

    // Check for missing legal justification
    const noJustificationViolations = checkLegalJustification(processEvents);
    violations.push(...noJustificationViolations);

    // Calculate scores
    const { complianceScore, riskScore, severityLevel } = calculateScores(violations, processEvents.length);

    // Generate summary and recommendation
    const summary = generateSummary(violations, processEvents.length);
    const recommendation = generateRecommendation(violations);

    // Store compliance report
    const report = await prisma.complianceReport.create({
        data: {
            recordingId,
            caseTypeId: caseType?.id,
            complianceScore,
            riskScore,
            severityLevel,
            summary,
            recommendation,
        },
    });

    // Store individual violations
    for (const violation of violations) {
        await prisma.violation.create({
            data: {
                complianceReportId: report.id,
                type: violation.type,
                description: violation.description,
                severity: violation.severity,
                evidenceText: violation.evidenceText,
                evidenceTime: violation.evidenceTime,
                violatedRule: violation.violatedRule,
            },
        });
    }

    // Update recording status
    await prisma.recording.update({
        where: { id: recordingId },
        data: { status: 'completed' },
    });

    // Create audit log
    await createAuditLog(
        AuditActions.ANALYZE,
        EntityTypes.REPORT,
        report.id,
        undefined,
        recordingId,
        {
            complianceScore,
            riskScore,
            violationCount: violations.length,
        }
    );

    return {
        recordingId,
        caseTypeId: caseType?.id,
        complianceScore,
        riskScore,
        severityLevel,
        violations,
        summary,
        recommendation,
    };
}

/**
 * Detect best matching case type based on events
 */
function detectBestMatchingCaseType(
    events: Array<{ action: string }>,
    caseTypes: Array<{ id: string; name: string; requiredSteps: string }>
): { id: string; name: string; requiredSteps: string; forbiddenActions?: string; timeLimits?: string } | null {
    if (caseTypes.length === 0) return null;

    let bestMatch = caseTypes[0];
    let highestScore = 0;

    for (const caseType of caseTypes) {
        const requiredSteps = JSON.parse(caseType.requiredSteps || '[]');
        let matchScore = 0;

        for (const event of events) {
            for (const step of requiredSteps) {
                if (event.action.toLowerCase().includes(step.toLowerCase().substring(0, 10))) {
                    matchScore++;
                }
            }
        }

        if (matchScore > highestScore) {
            highestScore = matchScore;
            bestMatch = caseType;
        }
    }

    return highestScore > 0 ? bestMatch : null;
}

/**
 * Check for missing required steps
 */
function checkMissingSteps(
    events: Array<{ action: string }>,
    requiredSteps: string[]
): Violation[] {
    const violations: Violation[] = [];
    const eventActions = events.map(e => e.action.toLowerCase());

    for (const step of requiredSteps) {
        const stepLower = step.toLowerCase();
        const found = eventActions.some(action =>
            action.includes(stepLower.substring(0, 15)) ||
            stepLower.includes(action.substring(0, 15))
        );

        if (!found) {
            violations.push({
                type: 'missing_step',
                description: `Required step missing: "${step}"`,
                severity: determineSeverity(step),
                violatedRule: `Required procedure step: ${step}`,
            });
        }
    }

    return violations;
}

/**
 * Check if steps were performed in correct order
 */
function checkStepOrder(
    events: Array<{ action: string; stepNumber: number }>,
    requiredSteps: string[]
): Violation[] {
    const violations: Violation[] = [];

    // Create a mapping of found steps to their order in the recording
    const foundStepOrder: { step: string; eventOrder: number }[] = [];

    for (const event of events) {
        for (let i = 0; i < requiredSteps.length; i++) {
            const step = requiredSteps[i];
            if (event.action.toLowerCase().includes(step.toLowerCase().substring(0, 15))) {
                foundStepOrder.push({ step, eventOrder: event.stepNumber });
                break;
            }
        }
    }

    // Check if the order matches
    for (let i = 1; i < foundStepOrder.length; i++) {
        const expectedBefore = requiredSteps.indexOf(foundStepOrder[i - 1].step);
        const expectedCurrent = requiredSteps.indexOf(foundStepOrder[i].step);

        if (expectedBefore > expectedCurrent) {
            violations.push({
                type: 'wrong_order',
                description: `Steps performed out of order: "${foundStepOrder[i].step}" should come after "${foundStepOrder[i - 1].step}"`,
                severity: 'medium',
            });
        }
    }

    return violations;
}

/**
 * Check for forbidden actions
 */
function checkForbiddenActions(
    events: Array<{ action: string; timestamp?: string | null }>,
    forbiddenActions: string[]
): Violation[] {
    const violations: Violation[] = [];

    for (const event of events) {
        for (const forbidden of forbiddenActions) {
            if (event.action.toLowerCase().includes(forbidden.toLowerCase().substring(0, 15))) {
                violations.push({
                    type: 'informal_decision',
                    description: `Forbidden action detected: "${forbidden}"`,
                    severity: 'high',
                    evidenceText: event.action,
                    evidenceTime: event.timestamp || undefined,
                });
            }
        }
    }

    return violations;
}

/**
 * Check for informal decisions before evidence review
 */
function checkInformalDecisions(
    events: Array<{ action: string; stepNumber: number }>
): Violation[] {
    const violations: Violation[] = [];

    let decisionEvent: { action: string; stepNumber: number } | null = null;
    let evidenceEvent: { action: string; stepNumber: number } | null = null;

    for (const event of events) {
        const actionLower = event.action.toLowerCase();
        if (actionLower.includes('decision') || actionLower.includes('ruling')) {
            if (!decisionEvent || event.stepNumber < decisionEvent.stepNumber) {
                decisionEvent = event;
            }
        }
        if (actionLower.includes('evidence') || actionLower.includes('review')) {
            if (!evidenceEvent || event.stepNumber < evidenceEvent.stepNumber) {
                evidenceEvent = event;
            }
        }
    }

    if (decisionEvent && evidenceEvent && decisionEvent.stepNumber < evidenceEvent.stepNumber) {
        violations.push({
            type: 'informal_decision',
            description: 'Decision appears to have been made before evidence was formally reviewed',
            severity: 'critical',
            evidenceText: `Decision at step ${decisionEvent.stepNumber}, evidence review at step ${evidenceEvent.stepNumber}`,
        });
    }

    return violations;
}

/**
 * Check for missing legal justification in decisions
 */
function checkLegalJustification(
    events: Array<{ action: string; legalReference?: string | null }>
): Violation[] {
    const violations: Violation[] = [];

    const decisionEvents = events.filter(e =>
        e.action.toLowerCase().includes('decision') ||
        e.action.toLowerCase().includes('ruling')
    );

    for (const event of decisionEvents) {
        if (!event.legalReference) {
            violations.push({
                type: 'no_justification',
                description: 'Decision made without citing legal basis',
                severity: 'medium',
                evidenceText: event.action,
            });
        }
    }

    return violations;
}

/**
 * Determine severity based on step importance
 */
function determineSeverity(step: string): 'low' | 'medium' | 'high' | 'critical' {
    const stepLower = step.toLowerCase();

    if (stepLower.includes('rights') || stepLower.includes('notify')) {
        return 'critical';
    }
    if (stepLower.includes('hearing') || stepLower.includes('evidence')) {
        return 'high';
    }
    if (stepLower.includes('document') || stepLower.includes('record')) {
        return 'medium';
    }
    return 'low';
}

/**
 * Calculate compliance and risk scores
 */
function calculateScores(
    violations: Violation[],
    totalEvents: number
): { complianceScore: number; riskScore: number; severityLevel: 'low' | 'medium' | 'high' | 'critical' } {
    // Base score starts at 100
    let complianceScore = 100;
    let riskScore = 0;

    // Deduct points based on violations
    for (const violation of violations) {
        switch (violation.severity) {
            case 'critical':
                complianceScore -= 25;
                riskScore += 30;
                break;
            case 'high':
                complianceScore -= 15;
                riskScore += 20;
                break;
            case 'medium':
                complianceScore -= 8;
                riskScore += 10;
                break;
            case 'low':
                complianceScore -= 3;
                riskScore += 5;
                break;
        }
    }

    // Ensure scores are within bounds
    complianceScore = Math.max(0, Math.min(100, complianceScore));
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine overall severity
    let severityLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 70 || violations.some(v => v.severity === 'critical')) {
        severityLevel = 'critical';
    } else if (riskScore >= 50 || violations.some(v => v.severity === 'high')) {
        severityLevel = 'high';
    } else if (riskScore >= 25) {
        severityLevel = 'medium';
    } else {
        severityLevel = 'low';
    }

    return { complianceScore, riskScore, severityLevel };
}

/**
 * Generate summary text
 */
function generateSummary(violations: Violation[], eventCount: number): string {
    if (violations.length === 0) {
        return `Analysis complete. ${eventCount} events processed. No procedural violations detected.`;
    }

    const critical = violations.filter(v => v.severity === 'critical').length;
    const high = violations.filter(v => v.severity === 'high').length;

    let summary = `Analysis complete. ${eventCount} events processed. Found ${violations.length} violation(s).`;

    if (critical > 0) {
        summary += ` ⚠️ ${critical} critical issue(s) require immediate attention.`;
    }
    if (high > 0) {
        summary += ` ${high} high-severity issue(s) detected.`;
    }

    return summary;
}

/**
 * Generate recommendation based on violations
 */
function generateRecommendation(violations: Violation[]): string {
    if (violations.length === 0) {
        return 'No action required. Process appears to comply with procedures.';
    }

    const recommendations: string[] = [];

    if (violations.some(v => v.type === 'missing_step')) {
        recommendations.push('Review case file to confirm all required steps were documented');
    }
    if (violations.some(v => v.type === 'informal_decision')) {
        recommendations.push('Escalate for supervisor review due to procedural irregularities');
    }
    if (violations.some(v => v.type === 'no_justification')) {
        recommendations.push('Request legal justification for decisions made');
    }
    if (violations.some(v => v.severity === 'critical')) {
        recommendations.push('URGENT: This case requires immediate human review');
    }

    return recommendations.join('. ') + '.';
}
