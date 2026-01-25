const reportService = require('./src/services/reportService');
const prisma = require('./src/config/database');

async function test() {
    try {
        const userId = 'some-admin-id'; // doesn't matter for admin role in the service as written
        const filters = { page: '1', limit: '10', search: '' };
        const userRole = 'admin';

        console.log('--- TEST RESULTS ---');
        const result = await reportService.getReports(filters, userId, userRole);
        console.log('Reports Array Length:', result.reports?.length);
        console.log('Pagination Total:', result.pagination?.total);
        if (result.reports && result.reports.length > 0) {
            console.log('First report ID:', result.reports[0].id);
            console.log('First report Ticket ID:', result.reports[0].ticket_id);
        }
        console.log('--- END TEST ---');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
