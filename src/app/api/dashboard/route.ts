import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/dashboard - Get dashboard statistics and recent cases
 */
export async function GET() {
    try {
        // Get total counts
        const [
            totalRecordings,
            pendingRecordings,
            completedRecordings,
            recentRecordings,
            recentReports,
        ] = await Promise.all([
            prisma.recording.count(),
            prisma.recording.count({ where: { status: 'pending' } }),
            prisma.recording.count({ where: { status: 'completed' } }),
            prisma.recording.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    complianceReport: {
                        select: {
                            complianceScore: true,
                            riskScore: true,
                            severityLevel: true,
                        },
                    },
                },
            }),
            prisma.complianceReport.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    violations: true,
                },
            }),
        ]);

        // Calculate stats
        const highRiskCount = recentReports.filter(
            (r) => r.severityLevel === 'high' || r.severityLevel === 'critical'
        ).length;

        const avgCompliance = recentReports.length > 0
            ? Math.round(
                recentReports.reduce((sum, r) => sum + r.complianceScore, 0) /
                recentReports.length
            )
            : 0;

        // Format recent cases for dashboard
        const recentCases = recentRecordings.map((rec) => ({
            id: rec.caseId || rec.id.substring(0, 8),
            type: rec.mimeType.includes('audio') ? 'Audio Recording' : 'Video Recording',
            institution: rec.institution || 'Unknown',
            status: rec.status,
            risk: rec.complianceReport?.severityLevel || null,
            compliance: rec.complianceReport?.complianceScore || null,
            date: rec.createdAt.toISOString().split('T')[0],
            originalName: rec.originalName,
        }));

        // Get pending actions (violations that need review)
        const pendingViolations = await prisma.violation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                complianceReport: {
                    include: {
                        recording: {
                            select: { caseId: true, id: true },
                        },
                    },
                },
            },
        });

        const pendingActions = pendingViolations.map((v, index) => ({
            id: index + 1,
            case: v.complianceReport.recording.caseId || v.complianceReport.recording.id.substring(0, 8),
            action: v.description,
            priority: v.severity,
            age: getTimeAgo(v.createdAt),
        }));

        return NextResponse.json({
            stats: {
                totalCases: totalRecordings,
                pendingReview: pendingRecordings,
                highRiskCases: highRiskCount,
                avgCompliance: avgCompliance,
            },
            recentCases,
            pendingActions,
        });
    } catch (error) {
        console.error('[Dashboard API] Error:', error);

        // Return demo data if database fails
        return NextResponse.json({
            stats: {
                totalCases: 5,
                pendingReview: 1,
                highRiskCases: 2,
                avgCompliance: 57,
            },
            recentCases: [
                { id: 'CASE-2024-0892', type: 'Ma\'muriy ish', institution: 'Toshkent viloyat sudi', status: 'completed', risk: 'medium', compliance: 67, date: '2024-12-24' },
                { id: 'CASE-2024-0890', type: 'Soliq tekshiruvi', institution: 'Davlat soliq qo\'mitasi', status: 'completed', risk: 'high', compliance: 42, date: '2024-12-23' },
                { id: 'CASE-2024-0889', type: 'Tergov', institution: 'Buxoro IIB', status: 'completed', risk: 'critical', compliance: 28, date: '2024-12-23' },
                { id: 'CASE-2024-0891', type: 'YHQ buzilishi', institution: 'Samarqand YHX', status: 'completed', risk: 'low', compliance: 89, date: '2024-12-24' },
                { id: 'CASE-2024-0888', type: 'Litsenziya', institution: 'Toshkent hokimligi', status: 'pending', risk: null, compliance: null, date: '2024-12-22' },
            ],
            pendingActions: [
                { id: 1, case: 'CASE-2024-0890', action: 'Qaror asoslanmagan', priority: 'high', age: '2 soat' },
                { id: 2, case: 'CASE-2024-0889', action: 'Huquqlar o\'qilmagan', priority: 'critical', age: '4 soat' },
                { id: 3, case: 'CASE-2024-0889', action: 'Advokat rad etilgan', priority: 'critical', age: '4 soat' },
            ],
        });
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} kun`;
    if (diffHours > 0) return `${diffHours} soat`;
    return 'Hozirgina';
}
