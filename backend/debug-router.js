const express = require('express');
const fixerRoutes = require('./src/routes/fixers');

const app = express();
app.use('/fixer', fixerRoutes);

// Mock the middleware and controller to avoid crashes
// (In reality we want to see if it even gets to the router)

console.log('Routes in fixer router:');
fixerRoutes.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(`- ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    }
});

const request = require('supertest');
request(app)
    .get('/fixer/history')
    .expect(404) // We expect 401/403 if it hits the route but lacks auth
    .end((err, res) => {
        console.log('\nTesting GET /fixer/history:');
        if (res.status === 404 && res.body.error_code === 'ENDPOINT_NOT_FOUND') {
            console.log('RESULT: 404 ENDPOINT_NOT_FOUND - Still fails');
        } else {
            console.log('RESULT: Status', res.status, res.body);
        }
        process.exit();
    });
