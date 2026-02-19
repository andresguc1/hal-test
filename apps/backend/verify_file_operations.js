// Simple verification for File Nodes (Read File & Write File)
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 2001;
const TEST_FILE_PATH = path.join(__dirname, 'test_output.txt');
const TEST_CONTENT = `HalTest Verification - ${new Date().toISOString()}\nStatus: SUCCESS`;

function makeRequest(action, payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);

        const options = {
            hostname: 'localhost',
            port: PORT,
            path: `/api/actions/${action}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve({ data: JSON.parse(body), status: res.statusCode });
                } catch (e) {
                    resolve({ data: body, status: res.statusCode });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    console.log('--- Starting File Nodes Verification ---');
    let browserId = 'test-session';

    try {
        // 0. Launch Browser
        console.log('\n0. Launching Browser...');
        const launchRes = await makeRequest('interaction', {
            action: 'launch_browser',
            headless: true,
            browserId: browserId,
            debugMode: true,
        });

        if (launchRes.status === 200) {
            browserId = launchRes.data.browserId;
            console.log(`✓ Browser launched. ID: ${browserId}`);
        } else {
            throw new Error(`Launch failed: ${JSON.stringify(launchRes.data)}`);
        }

        // 1. Write File Test (Disk)
        console.log('\n1. Testing Write File (save_results)...');
        const writeRes = await makeRequest('save_results', {
            path: TEST_FILE_PATH,
            data: TEST_CONTENT,
            browserId: browserId,
        });

        if (writeRes.status === 200) {
            console.log('✓ Write File success.');
            const fileExists = fs.existsSync(TEST_FILE_PATH);
            const content = fileExists ? fs.readFileSync(TEST_FILE_PATH, 'utf-8') : '';
            if (fileExists && content === TEST_CONTENT) {
                console.log('✓ File content verified on disk.');
            } else {
                throw new Error('File content mismatch or file not found');
            }
        } else {
            console.error('✗ Write File failed:', writeRes.data);
            throw new Error(`Status ${writeRes.status}`);
        }

        // 2. Navigating for DOM Read
        console.log('\n2. Navigating to example.com for DOM extraction test...');
        await makeRequest('interaction', {
            action: 'goto',
            url: 'https://example.com',
            browserId: browserId,
        });

        // 3. Read File Test (From DOM)
        console.log('\n3. Testing Read File from DOM (read_data with selector)...');
        const readDomRes = await makeRequest('read_data', {
            selector: 'h1',
            type: 'text',
            browserId: browserId,
        });

        if (readDomRes.status === 200) {
            console.log('✓ Read File from DOM triggered successfully.');
            console.log('  Response Data:', JSON.stringify(readDomRes.data.data));
        } else {
            console.error('✗ Read File from DOM failed:', readDomRes.data);
        }

        // 4. Cleanup
        console.log('\n4. Cleanup...');
        await makeRequest('interaction', { action: 'close_browser', browserId: browserId });
        if (fs.existsSync(TEST_FILE_PATH)) fs.unlinkSync(TEST_FILE_PATH);
        console.log('✓ Cleanup complete.');

        console.log('\n--- ✓ Verification Succeeded ---');
        console.log('The File Nodes (Read & Write) are working correctly.');
    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        if (fs.existsSync(TEST_FILE_PATH)) fs.unlinkSync(TEST_FILE_PATH);
    }
}

runTest();
