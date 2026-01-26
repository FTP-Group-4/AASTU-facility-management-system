const prisma = require('./src/config/database');

async function debug() {
    const startTime = Date.now();
    try {
        const safeCount = (model, query = {}) =>
            model.count(query).catch(err => {
                console.error(`Error counting ${model.name}:`, err.message);
                return 0;
            });

        console.log('1. Starting counts...');
        const [
            totalUsers,
            activeUsers,
            totalReports,
            reportsToday,
            completedReports,
            emergencyReports,
            highReports,
            mediumReports,
            lowReports
        ] = await Promise.all([
            safeCount(prisma.user),
            safeCount(prisma.user, { where: { is_active: true } }),
            safeCount(prisma.report),
            safeCount(prisma.report, {
                where: {
                    created_at: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            safeCount(prisma.report, {
                where: {
                    status: { in: ['completed', 'closed'] }
                }
            }),
            safeCount(prisma.report, { where: { priority: 'emergency' } }),
            safeCount(prisma.report, { where: { priority: 'high' } }),
            safeCount(prisma.report, { where: { priority: 'medium' } }),
            safeCount(prisma.report, { where: { priority: 'low' } })
        ]);
        console.log('Counts done:', { totalUsers, activeUsers, totalReports, reportsToday, completedReports });

        const completionRate = totalReports > 0
            ? ((completedReports / totalReports) * 100).toFixed(1)
            : 0;

        console.log('2. Aggegrating ratings...');
        let avgRating = 0;
        try {
            const ratingData = await prisma.report.aggregate({
                where: { rating: { not: null } },
                _avg: { rating: true }
            });
            avgRating = ratingData._avg.rating || 0;
        } catch (err) {
            console.error('Error Aggregating Rating:', err.message);
        }
        console.log('Avg Rating:', avgRating);

        console.log('3. Calculating SLA Compliance...');
        const slaHours = { 'emergency': 2, 'high': 24, 'medium': 72, 'low': 168 };
        const sla_compliance = { emergency: 100, high: 100, medium: 100, low: 100 };

        const completedDetailList = await prisma.report.findMany({
            where: {
                status: { in: ['completed', 'closed'] },
                priority: { in: ['emergency', 'high', 'medium', 'low'] }
            },
            select: {
                priority: true,
                created_at: true,
                updated_at: true
            }
        });

        const priorityStats = {
            emergency: { total: 0, onTime: 0 },
            high: { total: 0, onTime: 0 },
            medium: { total: 0, onTime: 0 },
            low: { total: 0, onTime: 0 }
        };

        completedDetailList.forEach(report => {
            if (!report.priority) return;
            const p = report.priority.toLowerCase();
            if (priorityStats[p]) {
                priorityStats[p].total++;
                const durationHrs = (new Date(report.updated_at).getTime() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
                if (durationHrs <= slaHours[p]) {
                    priorityStats[p].onTime++;
                }
            }
        });

        Object.keys(priorityStats).forEach(p => {
            if (priorityStats[p].total > 0) {
                sla_compliance[p] = parseFloat(((priorityStats[p].onTime / priorityStats[p].total) * 100).toFixed(1));
            }
        });
        console.log('SLA Compliance:', sla_compliance);

        console.log('4. Checking SLA Violations...');
        const now = new Date();
        const openReports = await prisma.report.findMany({
            where: {
                status: { in: ['submitted', 'under_review', 'approved', 'assigned', 'in_progress'] },
                priority: { not: null }
            },
            select: {
                id: true,
                ticket_id: true,
                priority: true,
                created_at: true,
                equipment_description: true
            }
        });

        const alerts = [];
        openReports.forEach(report => {
            if (!report.priority) return;
            const p = report.priority.toLowerCase();
            const limit = slaHours[p] || 168;
            const passedHrs = (now.getTime() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);

            if (passedHrs > limit) {
                alerts.push({
                    type: 'sla_violation',
                    message: `Ticket #${report.ticket_id} (${p}) is past resolution SLA`,
                    severity: p === 'emergency' || p === 'high' ? 'critical' : 'medium'
                });
            }
        });
        console.log('Alerts:', alerts.length);

        console.log('--- ALL DONE ---');
    } catch (err) {
        console.error('--- CRASH ---');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
