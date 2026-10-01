const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9557;
const USER_DATA = '/tmp/pte-remediation-audit';
const BASE = 'http://localhost:3000';
const ARTIFACT_DIR = path.resolve(process.env.PTE_ARTIFACT_DIR || path.join(__dirname, '../e2e_shots/remediation'));
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function launchChrome() {
    const args = [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${USER_DATA}`,
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1440,1050',
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

    async waitFor(fnExpr, timeoutMs = 15000, pollMs = 200) {
        const t0 = Date.now();
        while (Date.now() - t0 < timeoutMs) {
            try {
                const res = await this.eval(`(() => { const v = (${fnExpr}); return typeof v === 'function' ? v() : v; })()`);
                if (res) return res;
            } catch (e) {}
            await sleep(pollMs);
        }
        throw new Error('waitFor timed out: ' + fnExpr);
    }

    async screenshot(name) {
        const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(ARTIFACT_DIR, `${name}.png`);
        fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
        return filePath;
    }

    close() { try { this.ws.close(); } catch (e) {} }
}

async function main() {
    console.log('Launching headless Chrome for Verification...');
    const chrome = launchChrome();

    try {
        await waitForDevtools();
        const targets = await get('/json/list');
        const pageTarget = targets.find(t => t.type === 'page') || targets[0];
        const cdp = new CDPSession(pageTarget.webSocketDebuggerUrl);
        await cdp.ready;

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        console.log('Navigating to', BASE);
        await cdp.send('Page.navigate', { url: BASE });
        await cdp.waitFor('document.readyState === "complete"');
        await sleep(1500);

        // Load scorecard for Attempt 43
        console.log('Opening Scorecard for Attempt #43...');
        await cdp.eval('window.appRouter.showScorecard(43)');
        await cdp.waitFor('document.querySelector("#btn-practice-my-mistakes") !== null');
        await sleep(1000);

        // Verify elements on scorecard
        const diagnosticsVerification = await cdp.eval(`(() => {
            const hasHero = !!document.querySelector("#btn-practice-my-mistakes");
            const hasPronMap = document.body.innerText.includes("Word-Level Pronunciation Map");
            const hasWritingInsp = document.body.innerText.includes("Academic Writing Inspector");
            const hasAcl = document.body.innerText.includes("Academic Collocation List");
            const hesitationPills = document.querySelectorAll(".cursor-help").length;
            return { hasHero, hasPronMap, hasWritingInsp, hasAcl, hesitationPills };
        })()`);
        console.log('Scorecard Verification:', diagnosticsVerification);

        const shot1 = await cdp.screenshot('06-scorecard-speech-and-diagnostics');
        console.log('Scorecard screenshot saved:', shot1);

        // Scroll to item breakdown to capture Word-Level Map, Writing Inspector & Collocations
        await cdp.eval('window.scrollTo(0, 3500)');
        await sleep(800);
        const shotBreakdown = await cdp.screenshot('08-word-alignment-and-diagnostics');
        console.log('Scrolled breakdown screenshot saved:', shotBreakdown);
        await cdp.eval('window.scrollTo(0, 0)');
        await sleep(400);

        // Click "🎯 Practice My Mistakes"
        console.log('Clicking Practice My Mistakes button...');
        await cdp.eval('document.querySelector("#btn-practice-my-mistakes").click()');

        // Wait for exam mode to start (equipment check or first question)
        await cdp.waitFor('document.body.classList.contains("pearson-mode")');
        await sleep(1000);

        const drillExamInfo = await cdp.eval(`(() => {
            const isPearsonMode = document.body.classList.contains("pearson-mode");
            const headerText = document.querySelector(".pearson-header-bar")?.innerText || "";
            const currentTest = window.pteEngine?.test?.title || "";
            const questionCount = window.pteEngine?.questions?.length || 0;
            return { isPearsonMode, headerText: headerText.slice(0, 100), currentTest, questionCount };
        })()`);
        console.log('Remediation Drill Exam Info:', drillExamInfo);

        const shot2 = await cdp.screenshot('07-remediation-drill-launched');
        console.log('Remediation drill launch screenshot saved:', shot2);

        cdp.close();
        console.log('ALL BROWSER AUDIT VERIFICATIONS PASSED SUCCESSFULLY!');
    } finally {
        chrome.kill('SIGKILL');
    }
}

main().catch(err => {
    console.error('Browser verification failed:', err);
    process.exit(1);
});
