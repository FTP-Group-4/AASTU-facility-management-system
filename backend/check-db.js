const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.report.count();
        console.log('Total reports count:', count);

        if (count > 0) {
            const sample = await prisma.report.findFirst({
                include: {
                    submitter: true,
                    block: true
                }
            });
            console.log('Sample report:', JSON.stringify(sample, null, 2));
        }
    } catch (err) {
        console.error('Error checking DB:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
