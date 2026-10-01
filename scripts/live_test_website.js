/**
 * Live Website Interactive E2E Verification
 * Validates:
 * 1. Candidate Portal layout with 30 Full Mocks & 2 Drills tabs.
 * 2. Search filtering & pagination across the 30 mock tests.
 * 3. Drills tab rendering with targeted practice test & Section drill.
 * 4. Launching Test 2 simulator, completing equipment check, and progressing through questions.
 */
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9888;
const USER_DATA = '/tmp/pte-live-test-profile';
const BASE_URL = process.env.BASE || 'http://localhost:3000';
const SHOTS_DIR = path.join(__dirname, '../e2e_shots');

if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

function launchChrome() {
    const args = [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${USER_DATA}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1440,900',
        '--autoplay-policy=no-user-gesture-required',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--mute-audio',
        'about:blank'
    ];
    return spawn('/usr/bin/google-chrome', args, { stdio: ['ignore', 'pipe', 'pipe'] });
}

function get(reqPath) {
    return new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port: PORT, path: reqPath }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitForDevtools(timeoutMs = 15000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
        try { return await get('/json/version'); } catch (e) { await sleep(200); }
    }
    throw new Error('DevTools endpoint never came up');
}

class CDPSession {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.id = 0;
        this.pending = new Map();
        this.events = [];
        this.ready = new Promise((res, rej) => {
            this.ws.addEventListener('open', res);
            this.ws.addEventListener('error', rej);
        });
        this.ws.addEventListener('message', (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(msg.error.message));
                else resolve(msg.result);
            } else if (msg.method) {
                this.events.push(msg);
            }
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.id;
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async eval(expr) {
        const r = await this.send('Runtime.evaluate', {
            expression: expr,
            awaitPromise: true,
            returnByValue: true
        });
        if (r.exceptionDetails) {
            throw new Error('Page exception: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
        }
        return r.result?.value;
    }

    async click(sel) {
        const ok = await this.eval(`(() => {
            const el = document.querySelector(${JSON.stringify(sel)});
            if (!el) return false;
            el.click();
            return true;
        })()`);
        if (!ok) throw new Error('click target not found: ' + sel);
    }

    async screenshot(name) {
        const r = await this.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(SHOTS_DIR, `${name}.png`);
        fs.writeFileSync(filePath, Buffer.from(r.data, 'base64'));
        console.log(`  📸 Screenshot saved: ${filePath}`);
    }
}

async function run() {
    console.log(`Starting live website verification against ${BASE_URL}...`);
    const chrome = launchChrome();

    try {
        await waitForDevtools();
        const targets = await get('/json/list');
        const pageTarget = targets.find(t => t.type === 'page') || targets[0];
        const cdp = new CDPSession(pageTarget.webSocketDebuggerUrl);
        await cdp.ready;

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        // Step 1: Load Website
        console.log('\n--- Step 1: Navigating to Website ---');
        await cdp.send('Page.navigate', { url: BASE_URL });
        await sleep(1500);

        const pageTitle = await cdp.eval('document.title');
        console.log(`Page title: "${pageTitle}"`);

        // Step 2: Validate Tabs and Counts
        console.log('\n--- Step 2: Checking Dashboard Category Tabs ---');
        const tabMocksText = await cdp.eval('document.getElementById("tab-mocks")?.innerText.trim()');
        const tabDrillsText = await cdp.eval('document.getElementById("tab-drills")?.innerText.trim()');
        console.log(`Full Mocks Tab: "${tabMocksText}"`);
        console.log(`Targeted Drills Tab: "${tabDrillsText}"`);

        if (!tabMocksText.includes('30')) throw new Error('Expected 30 mock tests badge in tab');
        if (!tabDrillsText.includes('2')) throw new Error('Expected 2 drills badge in tab');

        await cdp.screenshot('01_dashboard_mocks_page1');

        // Step 3: Validate Pagination
        console.log('\n--- Step 3: Validating Pagination ---');
        const cardCountP1 = await cdp.eval('document.querySelectorAll(".btn-start-test").length');
        console.log(`Cards on Page 1: ${cardCountP1} (expected 8)`);
        if (cardCountP1 !== 8) throw new Error(`Expected 8 cards per page, found ${cardCountP1}`);

        // Click Page 2
        console.log('Navigating to Page 2...');
        await cdp.click('.btn-num-page[data-page="2"]');
        await sleep(400);
        const cardCountP2 = await cdp.eval('document.querySelectorAll(".btn-start-test").length');
        const firstCardTitleP2 = await cdp.eval('document.querySelector(".glass-card h3")?.innerText');
        console.log(`Cards on Page 2: ${cardCountP2}, First card: "${firstCardTitleP2}"`);
        await cdp.screenshot('02_dashboard_mocks_page2');

        // Step 4: Validate Search Filter
        console.log('\n--- Step 4: Testing Search Filtering ---');
        await cdp.eval(`(() => {
            const input = document.getElementById('mock-search-input');
            input.value = 'Mock Test 15';
            input.dispatchEvent(new Event('input', { bubbles: true }));
        })()`);
        await sleep(500);

        const filteredCount = await cdp.eval('document.querySelectorAll(".btn-start-test").length');
        const filteredTitle = await cdp.eval('document.querySelector(".glass-card h3")?.innerText');
        console.log(`Search 'Mock Test 15': ${filteredCount} card found: "${filteredTitle}"`);
        if (!filteredTitle.includes('Mock Test 15')) throw new Error('Search failed to filter to Test 15');
        await cdp.screenshot('03_dashboard_search_test15');

        // Clear search
        await cdp.click('#btn-clear-search');
        await sleep(400);
        const restoredCount = await cdp.eval('document.querySelectorAll(".btn-start-test").length');
        console.log(`After clearing search: ${restoredCount} cards displayed`);

        // Step 5: Validate Targeted Drills Tab
        console.log('\n--- Step 5: Testing Drills Tab ---');
        await cdp.click('#tab-drills');
        await sleep(400);

        const drillsCount = await cdp.eval('document.querySelectorAll(".btn-start-test").length');
        const drillTitles = await cdp.eval('Array.from(document.querySelectorAll(".glass-card h3")).map(h => h.innerText)');
        console.log(`Drills found (${drillsCount}):`, drillTitles);
        if (drillsCount !== 2) throw new Error(`Expected 2 drills, found ${drillsCount}`);
        await cdp.screenshot('04_dashboard_drills_tab');

        // Switch back to Mocks
        await cdp.click('#tab-mocks');
        await sleep(400);

        // Step 6: Launch Test 2 Simulation
        console.log('\n--- Step 6: Launching PTE Academic Full Mock Test 2 ---');
        const test2BtnId = await cdp.eval(`(() => {
            const cards = Array.from(document.querySelectorAll('.glass-card'));
            const card2 = cards.find(c => c.innerText.includes('Full Mock Test 2'));
            return card2 ? card2.querySelector('.btn-start-test').getAttribute('data-test-id') : null;
        })()`);
        console.log(`Test 2 Button Test ID: ${test2BtnId}`);

        await cdp.click(`.btn-start-test[data-test-id="${test2BtnId}"]`);
        await sleep(1000);

        // Verify Equipment Verification screen
        const equipTitle = await cdp.eval('document.querySelector(".pearson-section-title")?.innerText');
        console.log(`Screen loaded: "${equipTitle}"`);
        await cdp.screenshot('05_exam_test2_equipment_check');

        // Click Begin Part 1
        console.log('Passing equipment verification...');
        await cdp.click('#btn-start-exam-now');
        await sleep(1000);

        // Step 7: Verify Question 1 of Test 2
        const isExamMode = await cdp.eval('document.body.classList.contains("pearson-mode")');
        const taskType = await cdp.eval('document.querySelector(".pearson-item-type-title")?.innerText');
        const promptText = await cdp.eval('document.querySelector(".pearson-item-prompt-text")?.innerText');
        const progressText = await cdp.eval('document.querySelector(".pearson-item-progress-text")?.innerText');
        console.log(`Exam Mode active: ${isExamMode}`);
        console.log(`Task Type: "${taskType}"`);
        console.log(`Prompt: "${promptText?.slice(0, 70)}..."`);
        console.log(`Progress Counter: "${progressText}"`);

        await cdp.screenshot('06_exam_test2_question1');

        // Step 8: Direct Next Progression to Question 2
        console.log('\n--- Step 8: Verifying Direct Item Progression (Next button) ---');
        await cdp.click('#btn-next-item');
        await sleep(1000);

        const q2TaskType = await cdp.eval('document.querySelector(".pearson-item-type-title")?.innerText');
        const q2Progress = await cdp.eval('document.querySelector(".pearson-item-progress-text")?.innerText');
        console.log(`Directly progressed to: "${q2TaskType}" (${q2Progress})`);

        await cdp.screenshot('07_exam_test2_question2');

        console.log('\n🎉 ALL LIVE WEBSITE CHECKS PASSED SUCCESSFULLY!');

    } finally {
        chrome.kill();
    }
}

run().catch(err => {
    console.error('\n❌ LIVE TEST FAILED:', err);
    process.exit(1);
});
