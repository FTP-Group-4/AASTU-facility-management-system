const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const report = await prisma.report.findFirst({
            include: {
                submitter: true,
                assignee: true,
                block: true,
                photos: true
            }
        });

        if (report) {
            console.log('--- REPORT STRUCTURE ---');
            Object.keys(report).forEach(key => {
                let val = report[key];
                let type = typeof val;
                if (Array.isArray(val)) type = 'array';
                else if (val === null) type = 'null';
                console.log(`${key} (${type}): ${type === 'object' || type === 'array' ? '(complex)' : val}`);
            });
            console.log('-------------------------');
            console.log('Full JSON (flat):', JSON.stringify(report));
        } else {
            console.log('No reports found.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
