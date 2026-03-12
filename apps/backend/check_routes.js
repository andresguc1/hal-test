import app from './app.js';
import request from 'supertest';

async function checkRoutes() {
    console.log('--- Checking Action Routes ---');
    try {
        const res = await request(app).get('/api/status');
        console.log('Status Response:', res.body);

        const routesRes = await request(app).get('/api/routes');
        if (routesRes.status === 200) {
            console.log('Registered Action Routes (Body Type):', typeof routesRes.body);
            const bodyStr = JSON.stringify(routesRes.body, null, 2);
            console.log('Body:', bodyStr);

            if (bodyStr.includes('smart_selector')) {
                console.log('✅ smart_selector FOUND in body');
            } else {
                console.error('❌ smart_selector NOT FOUND in body');
            }
        } else {
            console.error('Failed to get /api/routes', routesRes.status);
        }
    } catch (err) {
        console.error('Error checking routes:', err);
    }
    process.exit(0);
}

checkRoutes();
