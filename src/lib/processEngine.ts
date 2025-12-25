import OpenAI from 'openai';
import prisma from './prisma';

// Lazy initialize OpenAI client
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
    if (!process.env.OPENAI_API_KEY) return null;
    if (!openai) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openai;
}

export interface ProcessEvent {
    stepNumber: number;
    actionType: string;
    description: string;
    speaker?: string;
    timestamp?: number;
    legalReference?: string;
    entities: string[];
    confidence: number;
    flags: string[];
}

export interface ProcessAnalysis {
    events: ProcessEvent[];
    detectedCaseType: string;
    summary: string;
    keyFindings: string[];
    potentialIssues: string[];
}

/**
 * GPT-4 powered legal event extraction
 * Analyzes transcript to identify procedural steps, legal references, and potential violations
 */
export async function extractLegalEvents(
    transcript: string,
    caseType?: string
): Promise<ProcessAnalysis> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[ProcessEngine] No API key, using rule-based extraction');
        return ruleBasedExtraction(transcript, caseType);
    }

    try {
        const systemPrompt = `You are an expert legal analyst specializing in Uzbekistan administrative and criminal procedures.
Analyze the transcript and extract ALL procedural events, legal references, and potential issues.

Your expertise includes:
- Uzbekistan Criminal Procedure Code (Jinoyat-protsessual kodeksi)
- Administrative Responsibility Code (Ma'muriy javobgarlik to'g'risidagi kodeks)
- Constitutional rights and procedural requirements
- Common procedural violations and their indicators

For each event, identify:
1. **Action Type**: hearing_start, rights_reading, evidence_presentation, testimony, objection, ruling, verdict, etc.
2. **Legal References**: Any cited articles, laws, or legal basis
3. **Entities**: Names, dates, locations, case numbers mentioned
4. **Flags**: Potential procedural issues:
   - MISSING_RIGHTS_WARNING: Suspect not informed of rights
   - NO_LEGAL_BASIS: Decision made without legal citation
   - EVIDENCE_BEFORE_HEARING: Evidence discussed before formal hearing
   - NO_LAWYER_PRESENT: Defendant lacks legal representation
   - RUSHED_DECISION: Decision made too quickly
   - INFORMAL_PROCEDURE: Skipped formal requirements

Return JSON:
{
  "detectedCaseType": "administrative" | "criminal" | "civil" | "unknown",
  "events": [
    {
      "stepNumber": 1,
      "actionType": "hearing_start",
      "description": "Court session opened",
      "speaker": "Judge",
      "legalReference": "Article 234 CPC",
      "entities": ["Court name", "Date"],
      "confidence": 0.95,
      "flags": []
    }
  ],
  "summary": "Brief summary of the proceeding",
  "keyFindings": ["Finding 1", "Finding 2"],
  "potentialIssues": ["Issue 1 with explanation"]
}`;

        const response = await getOpenAI()!.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `${caseType ? `Case Type: ${caseType}\n\n` : ''}Transcript:\n${transcript}`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2, // Low temperature for consistent extraction
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');

        return {
            events: result.events || [],
            detectedCaseType: result.detectedCaseType || 'unknown',
            summary: result.summary || '',
            keyFindings: result.keyFindings || [],
            potentialIssues: result.potentialIssues || [],
        };

    } catch (error) {
        console.error('[ProcessEngine] GPT-4 extraction error:', error);
        return ruleBasedExtraction(transcript, caseType);
    }
}

/**
 * Analyze compliance using GPT-4
 * Compares extracted events against required procedures
 */
export async function analyzeComplianceWithAI(
    events: ProcessEvent[],
    caseType: string,
    requiredSteps: string[]
): Promise<{
    complianceScore: number;
    violations: Array<{ type: string; description: string; severity: string }>;
    recommendations: string[];
}> {
    if (!process.env.OPENAI_API_KEY) {
        return {
            complianceScore: 75,
            violations: [],
            recommendations: ['Configure OpenAI API key for detailed analysis'],
        };
    }

    try {
        const prompt = `Analyze procedural compliance for a ${caseType} case.

Required Steps:
${requiredSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Detected Events:
${events.map(e => `- ${e.actionType}: ${e.description}${e.flags.length > 0 ? ` [FLAGS: ${e.flags.join(', ')}]` : ''}`).join('\n')}

Evaluate:
1. Which required steps were completed?
2. Which required steps are missing?
3. Were steps performed in correct order?
4. Are there any procedural violations?
5. Overall compliance score (0-100)

Return JSON:
{
  "complianceScore": 75,
  "completedSteps": [1, 2, 4],
  "missingSteps": [3, 5],
  "violations": [
    { "type": "missing_step", "description": "Rights not read", "severity": "high" }
  ],
  "recommendations": ["Ensure rights are read at start of proceedings"]
}`;

        const response = await getOpenAI()!.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        });

        return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
        console.error('[ProcessEngine] Compliance analysis error:', error);
        return { complianceScore: 0, violations: [], recommendations: [] };
    }
}

/**
 * Store analysis results in database
 */
export async function saveProcessAnalysis(
    recordingId: string,
    analysis: ProcessAnalysis
): Promise<void> {
    // Store each event
    for (const event of analysis.events) {
        await prisma.processEvent.create({
            data: {
                recordingId,
                stepNumber: event.stepNumber,
                action: event.actionType,
                speaker: event.speaker,
                timestamp: event.timestamp?.toString(),
                legalReference: event.legalReference,
                entities: JSON.stringify(event.entities),
                confidence: event.confidence,
            },
        });
    }

    // Update recording with detected case type
    await prisma.recording.update({
        where: { id: recordingId },
        data: { status: 'analyzed' },
    });
}

/**
 * Rule-based extraction fallback when no API key
 */
function ruleBasedExtraction(transcript: string, caseType?: string): ProcessAnalysis {
    const events: ProcessEvent[] = [];
    const lines = transcript.split('\n').filter(l => l.trim());

    const actionPatterns = [
        { pattern: /суд.*бошла|hearing.*open|session.*start/i, type: 'hearing_start', description: 'Court session opened' },
        { pattern: /ҳуқуқ.*тушунтир|rights.*explain|inform.*rights/i, type: 'rights_reading', description: 'Rights explained' },
        { pattern: /далил|evidence|proof/i, type: 'evidence_presentation', description: 'Evidence presented' },
        { pattern: /гувоҳ|witness|testimony/i, type: 'testimony', description: 'Witness testimony' },
        { pattern: /эътироз|objection|protest/i, type: 'objection', description: 'Objection raised' },
        { pattern: /қарор|decision|ruling|verdict/i, type: 'verdict', description: 'Decision announced' },
    ];

    const legalPatterns = [
        /модда\s*(\d+)/gi,
        /article\s*(\d+)/gi,
        /статья\s*(\d+)/gi,
    ];

    lines.forEach((line, index) => {
        for (const { pattern, type, description } of actionPatterns) {
            if (pattern.test(line)) {
                const legalRefs: string[] = [];
                for (const legalPattern of legalPatterns) {
                    const matches = line.matchAll(legalPattern);
                    for (const match of matches) {
                        legalRefs.push(`Article ${match[1]}`);
                    }
                }

                const speakerMatch = line.match(/^([^:]+):/);

                events.push({
                    stepNumber: events.length + 1,
                    actionType: type,
                    description: description,
                    speaker: speakerMatch ? speakerMatch[1].trim() : undefined,
                    confidence: 0.7,
                    entities: [],
                    legalReference: legalRefs.join(', ') || undefined,
                    flags: [],
                });
                break;
            }
        }
    });

    return {
        events,
        detectedCaseType: caseType || 'unknown',
        summary: `Extracted ${events.length} procedural events using rule-based analysis.`,
        keyFindings: events.map(e => e.description),
        potentialIssues: ['Rule-based analysis may miss nuanced violations. Configure GPT-4 for better accuracy.'],
    };
}

/**
 * Full process reconstruction pipeline
 */
export async function reconstructProcess(
    recordingId: string,
    transcript: string,
    caseType?: string
): Promise<ProcessAnalysis> {
    // Update status
    await prisma.recording.update({
        where: { id: recordingId },
        data: { status: 'analyzing' },
    });

    try {
        // Extract events
        const analysis = await extractLegalEvents(transcript, caseType);

        // Save to database
        await saveProcessAnalysis(recordingId, analysis);

        return analysis;

    } catch (error) {
        await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'error' },
        });
        throw error;
    }
}
