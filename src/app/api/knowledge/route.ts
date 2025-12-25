import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/knowledge/case-types - Get all case types
 */
export async function GET(request: NextRequest) {
    try {
        const caseTypes = await prisma.caseType.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { complianceReports: true, legalRules: true },
                },
            },
        });

        return NextResponse.json({
            caseTypes: caseTypes.map((ct: { requiredSteps: string; forbiddenActions: string | null; timeLimits: string | null }) => ({
                ...ct,
                requiredSteps: JSON.parse(ct.requiredSteps || '[]'),
                forbiddenActions: ct.forbiddenActions ? JSON.parse(ct.forbiddenActions) : [],
                timeLimits: ct.timeLimits ? JSON.parse(ct.timeLimits) : {},
            })),
        });
    } catch (error) {
        console.error('Error fetching case types:', error);
        return NextResponse.json(
            { error: 'Failed to fetch case types' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/knowledge/case-types - Create a new case type
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, nameUz, nameRu, description, requiredSteps, forbiddenActions, timeLimits } = body;

        if (!name || !requiredSteps || !Array.isArray(requiredSteps)) {
            return NextResponse.json(
                { error: 'Name and requiredSteps (array) are required' },
                { status: 400 }
            );
        }

        const caseType = await prisma.caseType.create({
            data: {
                name,
                nameUz,
                nameRu,
                description,
                requiredSteps: JSON.stringify(requiredSteps),
                forbiddenActions: forbiddenActions ? JSON.stringify(forbiddenActions) : null,
                timeLimits: timeLimits ? JSON.stringify(timeLimits) : null,
            },
        });

        return NextResponse.json({
            success: true,
            caseType: {
                ...caseType,
                requiredSteps,
                forbiddenActions: forbiddenActions || [],
                timeLimits: timeLimits || {},
            },
        });
    } catch (error) {
        console.error('Error creating case type:', error);
        return NextResponse.json(
            { error: 'Failed to create case type' },
            { status: 500 }
        );
    }
}
