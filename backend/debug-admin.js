const adminController = require('./src/controllers/adminController');
const prisma = require('./src/config/database');

async function testDashboard() {
    console.log('\n--- TESTING GET DASHBOARD ---');
    const req = {};
    const res = {
        status: (code) => {
            console.log(`Status: ${code}`);
            return res;
        },
        json: (data) => {
            if (data.success) {
                console.log('SUCCESS: Dashboard data received');
                console.log('Keys:', Object.keys(data.data));
            } else {
                console.log('FAILURE:', data);
            }
            return res;
        }
    };

    try {
        await adminController.getDashboard(req, res);
    } catch (error) {
        console.error('CRITICAL DASHBOARD ERROR:', error);
    }
}

async function testCreateUser() {
    console.log('\n--- TESTING CREATE USER ---');
    const email = `test.admin.${Date.now()}@aastu.edu.et`;
    console.log(`Attempting to create user: ${email}`);

    const req = {
        body: {
            email: email,
            password: 'Password123!',
            full_name: 'Debug Admin',
            role: 'admin',
            phone: '+251911223344'
        }
    };

    const res = {
        status: (code) => {
            console.log(`Status: ${code}`);
            return res;
        },
        json: (data) => {
            console.log('Response:', JSON.stringify(data, null, 2));
            return res;
        }
    };

    try {
        await adminController.createUser(req, res);
    } catch (error) {
        console.log('Global Catch Error:', error);
    }
}

async function main() {
    console.log('Starting Diagnostic...');
    try {
        // Basic DB Check
        const userCount = await prisma.user.count();
        console.log(`DB Connection OK. User count: ${userCount}`);

        await testDashboard();
        await testCreateUser();

    } catch (err) {
        console.error('PRE-FLIGHT CHECK FAILED:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
