import OpenAI from 'openai';
import fs from 'fs';
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

export interface TranscriptSegment {
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence: number;
}

export interface TranscriptionResult {
    language: string;
    confidence: number;
    duration: number;
    fullText: string;
    segments: TranscriptSegment[];
}

/**
 * Transcribe audio file using OpenAI Whisper API
 */
export async function transcribeAudio(filePath: string): Promise<TranscriptionResult> {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[Transcription] OpenAI API key not configured, using simulation mode');
        return simulateTranscription(filePath);
    }

    try {
        console.log(`[Transcription] Starting Whisper transcription for: ${filePath}`);

        // Read the audio file
        const audioFile = fs.createReadStream(filePath);

        // Call Whisper API with verbose output for timestamps
        const response = await getOpenAI()!.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
        });

        // Parse the response
        const segments: TranscriptSegment[] = (response.segments || []).map((seg: any) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text.trim(),
            confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9,
        }));

        // Calculate overall confidence
        const avgConfidence = segments.length > 0
            ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
            : 0.9;

        const result: TranscriptionResult = {
            language: response.language || 'unknown',
            confidence: avgConfidence,
            duration: response.duration || 0,
            fullText: response.text,
            segments,
        };

        console.log(`[Transcription] Completed: ${segments.length} segments, language: ${result.language}`);
        return result;

    } catch (error) {
        console.error('[Transcription] Whisper API error:', error);
        throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Perform speaker diarization using GPT-4
 * Analyzes transcript to identify different speakers
 */
export async function diarizeSpeakers(
    transcript: string,
    context?: { caseType?: string; participants?: string[] }
): Promise<{ segments: TranscriptSegment[]; speakers: string[] }> {
    if (!process.env.OPENAI_API_KEY) {
        return { segments: [], speakers: ['Speaker 1', 'Speaker 2'] };
    }

    try {
        const systemPrompt = `You are an expert legal transcript analyst specializing in Uzbekistan court and administrative proceedings.
Your task is to identify different speakers in a transcript and label each segment.

Common speakers in legal proceedings include:
- Judge / Sudya
- Prosecutor / Prokuror  
- Defense Attorney / Advokat
- Defendant / Ayblanuvchi
- Witness / Guvoh
- Court Clerk / Sud kotibi
- Police Officer / Militsiya xodimi
- Tax Inspector / Soliq inspektori

${context?.participants ? `Known participants: ${context.participants.join(', ')}` : ''}
${context?.caseType ? `Case type: ${context.caseType}` : ''}

Analyze the text and identify speaker changes based on:
1. Direct speech patterns ("I hereby...", "Your Honor...")
2. Role-specific language
3. Dialogue flow and responses
4. Formal vs informal speech

Return JSON with this structure:
{
  "speakers": ["Speaker Name 1", "Speaker Name 2"],
  "segments": [
    { "text": "segment text", "speaker": "Speaker Name", "confidence": 0.9 }
  ]
}`;

        const response = await getOpenAI()!.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
            speakers: result.speakers || [],
            segments: result.segments || [],
        };

    } catch (error) {
        console.error('[Diarization] Error:', error);
        return { segments: [], speakers: [] };
    }
}

/**
 * Store transcription in database
 */
export async function saveTranscription(
    recordingId: string,
    transcription: TranscriptionResult
): Promise<void> {
    await prisma.transcript.upsert({
        where: { recordingId },
        update: {
            fullText: transcription.fullText,
            language: transcription.language,
            confidence: transcription.confidence,
            segments: JSON.stringify(transcription.segments),
            updatedAt: new Date(),
        },
        create: {
            recordingId,
            fullText: transcription.fullText,
            language: transcription.language,
            confidence: transcription.confidence,
            segments: JSON.stringify(transcription.segments),
        },
    });

    // Update recording status
    await prisma.recording.update({
        where: { id: recordingId },
        data: {
            status: 'transcribed',
            duration: transcription.duration,
        },
    });
}

/**
 * Full transcription pipeline
 */
export async function processTranscription(
    recordingId: string,
    filePath: string
): Promise<TranscriptionResult> {
    // Update status to transcribing
    await prisma.recording.update({
        where: { id: recordingId },
        data: { status: 'transcribing' },
    });

    try {
        // Step 1: Transcribe audio
        const transcription = await transcribeAudio(filePath);

        // Step 2: Speaker diarization (if transcript is long enough)
        if (transcription.fullText.length > 200) {
            const diarization = await diarizeSpeakers(transcription.fullText);
            if (diarization.segments.length > 0) {
                transcription.segments = diarization.segments.map((seg, i) => ({
                    ...transcription.segments[i],
                    ...seg,
                }));
            }
        }

        // Step 3: Save to database
        await saveTranscription(recordingId, transcription);

        return transcription;

    } catch (error) {
        await prisma.recording.update({
            where: { id: recordingId },
            data: { status: 'error' },
        });
        throw error;
    }
}

/**
 * Simulation mode for testing without API key
 */
function simulateTranscription(filePath: string): TranscriptionResult {
    console.log('[Transcription] Running in simulation mode');

    const simulatedText = `Судья: Суд муҳокамасини бошлаймиз. Иш бўйича прокурор, жавобгарни ўқинг.
Прокурор: Ҳурматли суд, бу иш маъмурий тартиб бузарлик ҳақида.
Судья: Жавобгар, сизга нима деб айтмоқчисиз?
Жавобгар: Мен бу айбловларни рад этаман.
Судья: Далилларни кўриб чиқамиз. Гувоҳ, гувоҳлик беринг.
Гувоҳ: Мен 2024-йил 15-декабрда воқеани кўрдим.
Судья: Суд муҳокамасини тугатаман. Қарор: Жавобгар айбдор деб топилди.`;

    return {
        language: 'uz',
        confidence: 0.85,
        duration: 180,
        fullText: simulatedText,
        segments: [
            { start: 0, end: 15, text: 'Судья: Суд муҳокамасини бошлаймиз.', speaker: 'Judge', confidence: 0.9 },
            { start: 15, end: 30, text: 'Прокурор: Ҳурматли суд, бу иш маъмурий тартиб бузарлик ҳақида.', speaker: 'Prosecutor', confidence: 0.88 },
            { start: 30, end: 45, text: 'Судья: Жавобгар, сизга нима деб айтмоқчисиз?', speaker: 'Judge', confidence: 0.92 },
            { start: 45, end: 55, text: 'Жавобгар: Мен бу айбловларни рад этаман.', speaker: 'Defendant', confidence: 0.85 },
            { start: 55, end: 70, text: 'Судья: Далилларни кўриб чиқамиз.', speaker: 'Judge', confidence: 0.91 },
            { start: 70, end: 90, text: 'Гувоҳ: Мен 2024-йил 15-декабрда воқеани кўрдим.', speaker: 'Witness', confidence: 0.87 },
            { start: 90, end: 120, text: 'Судья: Суд муҳокамасини тугатаман. Қарор: Жавобгар айбдор деб топилди.', speaker: 'Judge', confidence: 0.89 },
        ],
    };
}
