import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Starting database seed...');

    // Create Case Types
    console.log('Creating case types...');

    const adminOffense = await prisma.caseType.upsert({
        where: { id: 'ct-admin-offense' },
        update: {},
        create: {
            id: 'ct-admin-offense',
            name: 'Administrative Offense',
            nameUz: 'Ma\'muriy huquqbuzarlik',
            nameRu: 'Административное правонарушение',
            description: 'Standard procedure for administrative offense processing in Uzbekistan',
            requiredSteps: JSON.stringify([
                'Register complaint or incident',
                'Notify subject of proceedings',
                'Collect and document evidence',
                'Allow subject to review evidence',
                'Conduct formal hearing',
                'Issue written decision with legal basis',
                'Notify of appeal rights'
            ]),
            forbiddenActions: JSON.stringify([
                'Making decisions before reviewing evidence',
                'Denying access to evidence',
                'Conducting hearing without proper notification',
                'Issuing decision without legal citation'
            ]),
            timeLimits: JSON.stringify({
                'Notify subject of proceedings': '3 days',
                'Conduct formal hearing': '15 days',
                'Issue written decision': '10 days'
            }),
        },
    });

    const criminalInvestigation = await prisma.caseType.upsert({
        where: { id: 'ct-criminal-investigation' },
        update: {},
        create: {
            id: 'ct-criminal-investigation',
            name: 'Criminal Investigation',
            nameUz: 'Jinoyat tergovi',
            nameRu: 'Уголовное расследование',
            description: 'Procedure for criminal investigation and prosecution under Uzbekistan Criminal Procedure Code',
            requiredSteps: JSON.stringify([
                'Record complaint or report',
                'Open investigation file',
                'Inform suspect of rights',
                'Conduct interrogation with lawyer present',
                'Collect and preserve evidence',
                'Document chain of custody',
                'Present findings to prosecutor',
                'Allow defense access to materials'
            ]),
            forbiddenActions: JSON.stringify([
                'Interrogation without informing rights',
                'Denying access to legal counsel',
                'Evidence tampering',
                'Pressure or coercion during interrogation'
            ]),
            timeLimits: JSON.stringify({
                'Inform suspect of rights': 'Immediately upon detention',
                'Provide access to lawyer': '24 hours',
                'Initial investigation period': '10 days'
            }),
        },
    });

    const courtHearing = await prisma.caseType.upsert({
        where: { id: 'ct-court-hearing' },
        update: {},
        create: {
            id: 'ct-court-hearing',
            name: 'Court Hearing',
            nameUz: 'Sud majlisi',
            nameRu: 'Судебное заседание',
            description: 'Standard court hearing procedure',
            requiredSteps: JSON.stringify([
                'Open session and verify attendance',
                'Read charges or claims',
                'Allow defendant/respondent to respond',
                'Present prosecution/plaintiff evidence',
                'Present defense evidence',
                'Allow closing arguments',
                'Deliberation',
                'Announce decision with legal basis'
            ]),
            forbiddenActions: JSON.stringify([
                'Interrupting defense presentation',
                'Excluding evidence without justification',
                'Private communication with one party',
                'Announcing decision before deliberation'
            ]),
            timeLimits: JSON.stringify({
                'Written decision': '5 days after announcement',
                'Appeal notification': 'Immediately with decision'
            }),
        },
    });

    console.log('✅ Created case types:', adminOffense.name, criminalInvestigation.name, courtHearing.name);

    // Create Legal Rules
    console.log('Creating legal rules...');

    await prisma.legalRule.upsert({
        where: { id: 'lr-cpc-46' },
        update: {},
        create: {
            id: 'lr-cpc-46',
            code: 'CPC-46',
            title: 'Right to Defense',
            titleUz: 'Himoya huquqi',
            titleRu: 'Право на защиту',
            fullText: 'The suspect and the accused have the right to defense. This right must be explained at the moment of detention or upon notification of charges.',
            source: 'Criminal Procedure Code of Uzbekistan',
            category: 'Rights',
            caseTypeId: criminalInvestigation.id,
            isActive: true,
        },
    });

    await prisma.legalRule.upsert({
        where: { id: 'lr-cpc-52' },
        update: {},
        create: {
            id: 'lr-cpc-52',
            code: 'CPC-52',
            title: 'Presumption of Innocence',
            titleUz: 'Aybsizlik prezumptsiyasi',
            titleRu: 'Презумпция невиновности',
            fullText: 'The accused shall be presumed innocent until their guilt is proven in the manner prescribed by this Code and established by a court sentence that has entered into legal force.',
            source: 'Criminal Procedure Code of Uzbekistan',
            category: 'Rights',
            caseTypeId: criminalInvestigation.id,
            isActive: true,
        },
    });

    await prisma.legalRule.upsert({
        where: { id: 'lr-admin-28' },
        update: {},
        create: {
            id: 'lr-admin-28',
            code: 'AdminCode-28',
            title: 'Right to Be Heard',
            titleUz: 'Eshitilish huquqi',
            titleRu: 'Право быть выслушанным',
            fullText: 'Before imposing an administrative penalty, the authorized body must hear the explanation of the person against whom the case is being considered.',
            source: 'Administrative Responsibility Code of Uzbekistan',
            category: 'Procedure',
            caseTypeId: adminOffense.id,
            isActive: true,
        },
    });

    console.log('✅ Created legal rules');

    // Create a demo user
    console.log('Creating demo user...');

    await prisma.user.upsert({
        where: { id: 'user-demo' },
        update: {},
        create: {
            id: 'user-demo',
            email: 'reviewer@signtrace.uz',
            name: 'Demo Reviewer',
            role: 'reviewer',
            isActive: true,
        },
    });

    console.log('✅ Created demo user');

    console.log('🎉 Database seed completed successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
