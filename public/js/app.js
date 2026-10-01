/**
 * Main Application Router & State Manager
 */

class AppRouter {
    constructor() {
        this.currentView = 'dashboard'; // 'dashboard', 'exam', 'scorecard'
        this.dashboardTab = 'mocks'; // 'mocks', 'drills'
        this.mockSearchQuery = '';
        this.mockCurrentPage = 1;
        this.mockPageSize = 2; // Strict focus mode: 2 tests per page
        this.testsCache = [];
        this.attemptsCache = [];
    }

    init() {
        this.bindGlobalNavigation();
        this.loadDashboard();
    }

    bindGlobalNavigation() {
        const navDashboard = document.getElementById('nav-dashboard');
        const navVault = document.getElementById('nav-vault');
        const btnEndExam = document.getElementById('btn-end-exam');

        if (navDashboard) {
            navDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentView === 'exam') {
                    if (!confirm("Are you sure you want to exit the exam? Unsaved progress will be lost.")) return;
                }
                this.loadDashboard();
            });
        }

        if (navVault) {
            navVault.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentView === 'exam') {
                    if (!confirm("Are you sure you want to exit the exam? Unsaved progress will be lost.")) return;
                }
                this.loadVault();
            });
        }

        if (btnEndExam) {
            btnEndExam.addEventListener('click', () => {
                if (confirm("End current exam session?")) {
                    this.loadDashboard();
                }
            });
        }
    }

    async loadDashboard() {
        this.currentView = 'dashboard';
        document.body.classList.remove('pearson-mode');
        this.toggleHeaderState(false);

        const mainContent = document.getElementById('main-container');
        mainContent.innerHTML = `<div class="p-8 text-center text-slate-500 font-medium">Loading PTE practice tests...</div>`;

        try {
            const [testsRes, attemptsRes] = await Promise.all([
                fetch('/api/tests'),
                fetch('/api/attempts')
            ]);
            const testsData = await testsRes.json();
            const attemptsData = await attemptsRes.json();

            this.testsCache = testsData.data || [];
            this.attemptsCache = attemptsData.data || [];

            this.renderDashboard();
        } catch (err) {
            console.error("Dashboard load error:", err);
            mainContent.innerHTML = `<div class="p-8 text-center text-rose-600 font-medium">Failed to load dashboard data. Check server logs.</div>`;
        }
    }

    escapeHtml(str) {
        return (str || '').replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    renderDashboard() {
        const tests = this.testsCache;
        const attempts = this.attemptsCache;
        const mainContent = document.getElementById('main-container');

        const getScoreBadge = (score) => {
            if (score == null) return `<span class="text-slate-400 font-mono text-xs">-</span>`;
            if (score >= 85) return `<span class="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1">${score} <span class="text-[10px] font-semibold text-emerald-600">Superior</span></span>`;
            if (score >= 65) return `<span class="bg-blue-50 text-[#005696] border border-blue-300 font-bold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1">${score} <span class="text-[10px] font-semibold text-blue-600">Proficient</span></span>`;
            if (score >= 50) return `<span class="bg-amber-50 text-amber-800 border border-amber-300 font-bold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1">${score} <span class="text-[10px] font-semibold text-amber-600">Competent</span></span>`;
            return `<span class="bg-rose-50 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded text-xs inline-flex items-center gap-1">${score} <span class="text-[10px] font-semibold text-rose-600">Developing</span></span>`;
        };

        const getMockNumber = (t) => {
            if (!t || !t.title) return 999;
            const match = t.title.match(/(?:Full Mock Test|Full-Length Mock Test)\s*(\d+)/i);
            if (match) return parseInt(match[1], 10);
            if (t.id === 18) return 1;
            return 999;
        };

        const fullMocks = tests
            .filter(t => t.title && (t.title.includes('Mock Test') || t.title.includes('Full-Length')))
            .sort((a, b) => getMockNumber(a) - getMockNumber(b));
        const drills = tests.filter(t => !fullMocks.includes(t));

        const completedTestIds = new Set((attempts || []).filter(a => a.overall_score != null).map(a => a.test_id));
        const completedMocks = fullMocks.filter(t => completedTestIds.has(t.id));
        const uncompletedMocks = fullMocks.filter(t => !completedTestIds.has(t.id));
        const nextTwoMocks = uncompletedMocks.slice(0, 2);
        const unlockedCount = completedMocks.length + nextTwoMocks.length;

        let html = `
            <div class="max-w-6xl mx-auto space-y-8 py-4">
                <!-- Pearson Candidate Portal Welcome Banner -->
                <div class="bg-[#002244] border-t-4 border-[#005696] rounded p-6 md:p-8 shadow-sm text-white">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div class="max-w-2xl">
                            <div class="inline-flex items-center gap-2 bg-[#003870] border border-[#005696] text-sky-200 text-xs px-2.5 py-1 rounded font-semibold tracking-wider uppercase mb-3">
                                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                                Independent PTE Academic Practice Portal
                            </div>
                            <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">PTE Academic Practice Simulator</h1>
                            <p class="text-sky-100/90 text-xs md:text-sm mt-2 leading-relaxed">
                                Independent exam-style practice with single-listen audio, timed sections, and estimated diagnostic scoring. Current mock banks may not yet have the full official item mix.
                            </p>
                        </div>
                        <div class="bg-[#00172e] border border-blue-900/60 p-4 rounded text-xs space-y-2 min-w-[260px] shrink-0">
                            <div class="text-sky-300 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-blue-900/80">Candidate Profile</div>
                            <div class="flex justify-between"><span class="text-slate-400">Candidate:</span> <span class="text-white font-medium">Practice Candidate</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">Status:</span> <span class="text-amber-400 font-mono font-semibold">Independent practice</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">Exam-style timing:</span> <span class="text-sky-200">Up to 2h 15m • 3 Parts</span></div>
                            <div class="flex justify-between"><span class="text-slate-400">Score Scale:</span> <span class="text-white">10 – 90 GSE</span></div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Tabs: Full Mock Tests vs Targeted Drills -->
                <div>
                    <div class="flex border-b border-slate-300 gap-2 mb-6">
                        <button id="tab-mocks" class="dashboard-tab ${this.dashboardTab === 'mocks' ? 'active' : ''}">
                            <svg class="w-4 h-4 text-[#0072ce]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Full-Length Mock Tests
                            <span class="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">${unlockedCount} / ${fullMocks.length} Unlocked</span>
                        </button>
                        <button id="tab-drills" class="dashboard-tab ${this.dashboardTab === 'drills' ? 'active' : ''}">
                            <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Targeted Practice Drills
                            <span class="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full ml-1">${drills.length}</span>
                        </button>
                    </div>

                    <!-- Tests Content Container -->
                    <div id="tests-view-container"></div>
                </div>

                <!-- Recent Test Attempts / Score Reports Vault -->
                <div id="section-score-reports" class="pt-2">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h2 class="text-xl md:text-2xl font-bold text-[#002244] flex items-center gap-2.5">
                                <svg class="w-6 h-6 text-[#005696]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Candidate Score Reports &amp; Attempt History
                            </h2>
                            <p class="text-xs text-slate-500 mt-0.5">Comprehensive diagnostic reports with enabling skill breakdowns and mistakes vault.</p>
                        </div>
                        <span class="text-xs font-semibold text-slate-600 bg-white border border-slate-300 px-3 py-1 rounded shadow-xs">
                            ${attempts.length} Attempt(s) Logged
                        </span>
                    </div>
                    <div class="glass-card overflow-hidden bg-white border border-[#cbd5e1]">
                        ${attempts.length === 0 ? `
                            <div class="p-8 text-center text-slate-500 text-sm">No completed test attempts yet. Click "Launch Full Test Simulator" above to begin your first mock test!</div>
                        ` : `
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm text-slate-800">
                                    <thead class="bg-[#f1f5f9] text-xs uppercase tracking-wider text-[#002244] font-bold border-b border-[#cbd5e1]">
                                        <tr>
                                            <th class="px-6 py-3.5">Attempt ID</th>
                                            <th class="px-6 py-3.5">Test Package</th>
                                            <th class="px-6 py-3.5">Candidate</th>
                                            <th class="px-6 py-3.5">Completed Date</th>
                                            <th class="px-6 py-3.5">Overall Score</th>
                                            <th class="px-6 py-3.5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-200">
                                        ${attempts.map(a => `
                                            <tr class="hover:bg-blue-50/40 transition-colors">
                                                <td class="px-6 py-4 font-mono font-semibold text-[#005696]">#${a.id}</td>
                                                <td class="px-6 py-4 font-semibold text-slate-900">${a.test_title}</td>
                                                <td class="px-6 py-4 text-xs text-slate-600">${a.student_name || 'Practice Candidate'}</td>
                                                <td class="px-6 py-4 text-xs text-slate-500">${new Date(a.completed_at || a.started_at).toLocaleString()}</td>
                                                <td class="px-6 py-4">${getScoreBadge(a.overall_score)}</td>
                                                <td class="px-6 py-4 text-right">
                                                    <button onclick="window.appRouter.showScorecard(${a.id})" class="btn-secondary text-xs px-3 py-1">View Scorecard</button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        mainContent.innerHTML = html;

        // Bind tab buttons
        const tabMocks = document.getElementById('tab-mocks');
        const tabDrills = document.getElementById('tab-drills');

        if (tabMocks) {
            tabMocks.addEventListener('click', () => {
                if (this.dashboardTab !== 'mocks') {
                    this.dashboardTab = 'mocks';
                    this.renderDashboard();
                }
            });
        }

        if (tabDrills) {
            tabDrills.addEventListener('click', () => {
                if (this.dashboardTab !== 'drills') {
                    this.dashboardTab = 'drills';
                    this.renderDashboard();
                }
            });
        }

        this.renderTestsView();
    }

    renderTestsView() {
        const container = document.getElementById('tests-view-container');
        if (!container) return;

        const tests = this.testsCache;
        const attempts = this.attemptsCache || [];

        const getMockNumber = (t) => {
            if (!t || !t.title) return 999;
            const match = t.title.match(/(?:Full Mock Test|Full-Length Mock Test)\s*(\d+)/i);
            if (match) return parseInt(match[1], 10);
            if (t.id === 18) return 1;
            return 999;
        };

        const fullMocks = tests
            .filter(t => t.title && (t.title.includes('Mock Test') || t.title.includes('Full-Length')))
            .sort((a, b) => getMockNumber(a) - getMockNumber(b));
        const drills = tests.filter(t => !fullMocks.includes(t));

        if (this.dashboardTab === 'drills') {
            container.innerHTML = `
                <div class="mb-4">
                    <h2 class="text-xl font-bold text-[#002244] flex items-center gap-2">
                        <span>🎯 Targeted Section &amp; Mistake Drills</span>
                    </h2>
                    <p class="text-xs text-slate-500 mt-0.5">Focused practice modules designed to eliminate error patterns and hone specific skill sub-scores.</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${drills.map(t => this.renderTestCard(t)).join('')}
                </div>
            `;
            this.bindTestLaunchButtons();
            return;
        }

        // --- OPTION 1: PROGRESSIVE UNLOCKING & FOCUS MODE ---
        // Map completed attempts by test_id
        const completedAttemptsMap = new Map();
        attempts.forEach(a => {
            if (a.overall_score != null) {
                const prev = completedAttemptsMap.get(a.test_id);
                if (!prev || (a.overall_score > prev.overall_score)) {
                    completedAttemptsMap.set(a.test_id, a);
                }
            }
        });

        // Determine completed mocks and next two uncompleted mocks
        const completedMocks = fullMocks.filter(t => completedAttemptsMap.has(t.id));
        const uncompletedMocks = fullMocks.filter(t => !completedAttemptsMap.has(t.id));
        const nextTwoMocks = uncompletedMocks.slice(0, 2);

        // Available mock tests: previously completed + next two in sequence
        const availableMocks = fullMocks.filter(t => completedAttemptsMap.has(t.id) || nextTwoMocks.includes(t));
        const lockedMocks = fullMocks.filter(t => !availableMocks.includes(t));
        const lockedCount = lockedMocks.length;

        // Search query filtering within available mocks
        const query = (this.mockSearchQuery || '').trim().toLowerCase();
        const filtered = availableMocks.filter(t => {
            if (!query) return true;
            return (t.title && t.title.toLowerCase().includes(query)) ||
                   (t.description && t.description.toLowerCase().includes(query));
        });

        // Check if query matched a locked test
        const searchedLocked = query ? lockedMocks.find(t => (t.title && t.title.toLowerCase().includes(query)) || (t.description && t.description.toLowerCase().includes(query))) : null;

        const totalPages = Math.max(1, Math.ceil(filtered.length / this.mockPageSize));
        if (this.mockCurrentPage > totalPages) this.mockCurrentPage = totalPages;
        if (this.mockCurrentPage < 1) this.mockCurrentPage = 1;

        const startIndex = (this.mockCurrentPage - 1) * this.mockPageSize;
        const pagedMocks = filtered.slice(startIndex, startIndex + this.mockPageSize);

        container.innerHTML = `
            <div class="space-y-4">
                <!-- Progressive Unlocking Milestone Progress Tracker -->
                <div class="bg-gradient-to-r from-[#002244] to-[#003870] border border-[#005696] rounded p-5 text-white shadow-sm">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs uppercase font-bold tracking-wider text-sky-300">PTE Sequential Unlocking Track</span>
                                <span class="bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Strict Focus Mode Active
                                </span>
                            </div>
                            <h3 class="text-lg font-bold text-white tracking-tight">${availableMocks.length} of ${fullMocks.length} Mock Tests Unlocked</h3>
                            <p class="text-xs text-sky-200/80 mt-0.5">Showing completed tests and the next 2 tests in sequential preparation order.</p>
                        </div>
                        <div class="flex items-center gap-3 text-xs bg-[#00172e] p-2.5 rounded border border-blue-900/60 shrink-0">
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> <strong>${completedMocks.length}</strong> Completed</span>
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span> <strong>${nextTwoMocks.length}</strong> Ready</span>
                            <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-400"></span> <strong>${lockedCount}</strong> Locked</span>
                        </div>
                    </div>
                    <!-- Two-tone progress bar -->
                    <div class="w-full bg-[#00172e] rounded-full h-3 overflow-hidden flex border border-blue-900/50">
                        <div style="width: ${(completedMocks.length / fullMocks.length) * 100}%" class="bg-emerald-500 h-full transition-all duration-500" title="${completedMocks.length} Completed"></div>
                        <div style="width: ${(nextTwoMocks.length / fullMocks.length) * 100}%" class="bg-sky-400 h-full transition-all duration-500" title="${nextTwoMocks.length} Ready"></div>
                    </div>
                </div>

                <!-- Search & Filter Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded border border-slate-200 shadow-xs">
                    <div>
                        <h2 class="text-base font-bold text-[#002244] flex items-center gap-2">
                            <span>Available Full-Length Mock Tests</span>
                            <span class="text-xs bg-blue-50 text-[#005696] font-semibold px-2 py-0.5 rounded border border-blue-200">${filtered.length} In Focus</span>
                        </h2>
                        <p class="text-xs text-slate-500 mt-0.5">Timed exam-style practice with estimated 10–90 diagnostics; not an official score.</p>
                    </div>
                    <div class="relative w-full sm:w-72">
                        <input id="mock-search-input" type="text" placeholder="Search available mocks (e.g. Test 2)..." value="${this.escapeHtml(this.mockSearchQuery)}"
                               class="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded focus:border-[#0072ce] focus:outline-none bg-white transition-colors" />
                        <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        ${this.mockSearchQuery ? `
                            <button id="btn-clear-search" class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
                        ` : ''}
                    </div>
                </div>

                ${filtered.length === 0 ? `
                    <div class="p-8 text-center bg-white border border-slate-200 rounded">
                        <div class="text-slate-400 text-3xl mb-2">🔍</div>
                        <h3 class="text-sm font-bold text-slate-700">No unlocked mock tests matching "${this.escapeHtml(this.mockSearchQuery)}"</h3>
                        ${searchedLocked ? `
                            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded max-w-md mx-auto text-xs text-amber-800">
                                <strong>🔒 ${this.escapeHtml(searchedLocked.title)} is currently locked.</strong><br/>
                                In accordance with strict sequential training, complete earlier tests in order to unlock this test.
                            </div>
                        ` : ''}
                        <p class="text-xs text-slate-500 mt-2">Try searching among your unlocked tests or clear the search filter.</p>
                        <button id="btn-reset-search" class="btn-secondary text-xs mt-3">Clear Filter</button>
                    </div>
                ` : `
                    <!-- 2 Cards Per Page Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${pagedMocks.map(t => {
                            const completedAttempt = completedAttemptsMap.get(t.id);
                            const isReady = nextTwoMocks.includes(t);
                            return this.renderTestCard(t, {
                                isCompleted: !!completedAttempt,
                                isReady,
                                attempt: completedAttempt
                            });
                        }).join('')}
                    </div>

                    <!-- Compact Pagination Bar -->
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                        <div class="text-xs text-slate-500">
                            Showing tests <span class="font-bold text-slate-800">${startIndex + 1}–${Math.min(startIndex + this.mockPageSize, filtered.length)}</span> of <span class="font-bold text-slate-800">${filtered.length} unlocked</span> (Page ${this.mockCurrentPage} of ${totalPages})
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button class="page-btn btn-prev-page" ${this.mockCurrentPage <= 1 ? 'disabled' : ''} data-page="${this.mockCurrentPage - 1}">
                                &laquo; Prev
                            </button>
                            ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                                <button class="page-btn btn-num-page ${p === this.mockCurrentPage ? 'active' : ''}" data-page="${p}">
                                    ${p}
                                </button>
                            `).join('')}
                            <button class="page-btn btn-next-page" ${this.mockCurrentPage >= totalPages ? 'disabled' : ''} data-page="${this.mockCurrentPage + 1}">
                                Next &raquo;
                            </button>
                        </div>
                    </div>

                    <!-- Locked Notice Banner -->
                    <div class="p-4 bg-slate-50 border border-slate-300 rounded text-center text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <div class="flex items-center gap-3 text-left">
                            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-base shrink-0">🔒</div>
                            <div>
                                <div class="font-bold text-slate-800">${lockedCount} Additional Full-Length Mock Tests Locked</div>
                                <div class="text-[11px] text-slate-500">
                                    ${nextTwoMocks.length > 0 ? `Complete <strong>${this.escapeHtml(nextTwoMocks[0].title.replace(/Official\s+/gi, ''))}</strong> to unlock future tests in the 30-exam sequence.` : 'All tests completed!'}
                                </div>
                            </div>
                        </div>
                        <div class="text-[11px] font-semibold text-slate-600 bg-white px-3 py-1.5 rounded border border-slate-200 shrink-0">
                            Strict Focus Mode (Only Next 2 Available)
                        </div>
                    </div>
                `}
            </div>
        `;

        // Search listeners
        const searchInput = document.getElementById('mock-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.mockSearchQuery = e.target.value;
                this.mockCurrentPage = 1;
                this.renderTestsView();
                const newSearch = document.getElementById('mock-search-input');
                if (newSearch) {
                    newSearch.focus();
                    newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
                }
            });
        }

        const btnClear = document.getElementById('btn-clear-search');
        const btnReset = document.getElementById('btn-reset-search');
        [btnClear, btnReset].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    this.mockSearchQuery = '';
                    this.mockCurrentPage = 1;
                    this.renderTestsView();
                });
            }
        });

        // Pagination buttons
        container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const p = parseInt(e.currentTarget.getAttribute('data-page'), 10);
                if (p && p !== this.mockCurrentPage && p >= 1 && p <= totalPages) {
                    this.mockCurrentPage = p;
                    this.renderTestsView();
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        this.bindTestLaunchButtons();
    }

    renderTestCard(test, progressiveMeta = null) {
        const isPTE = test.exam_type === 'PTE';
        const isFullMock = test.id === 18 || (test.title && (test.title.includes('Full-Length') || test.title.includes('Full Mock')));
        const isGurullyDrill = test.title && test.title.includes('Targeted Practice');

        let badgeNumber = '';
        const match = test.title && test.title.match(/(?:Full Mock Test|Full-Length Mock Test)\s*(\d+)/i);
        if (match) {
            badgeNumber = ` #${match[1].padStart(2, '0')}`;
        }

        const isCompleted = progressiveMeta && progressiveMeta.isCompleted;
        const isReady = progressiveMeta && progressiveMeta.isReady;
        const attempt = progressiveMeta && progressiveMeta.attempt;

        let scoreBadge = '';
        if (isCompleted && attempt) {
            const sc = attempt.overall_score;
            let label = sc >= 85 ? 'Superior' : sc >= 65 ? 'Proficient' : sc >= 50 ? 'Competent' : 'Developing';
            let color = sc >= 85 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        sc >= 65 ? 'bg-blue-50 text-[#005696] border-blue-300' :
                        sc >= 50 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-rose-50 text-rose-800 border-rose-300';
            scoreBadge = `<span class="${color} border font-bold px-2 py-0.5 rounded text-xs whitespace-nowrap">Practice estimate: ${sc}/90 (${label})</span>`;
        }

        return `
            <div class="glass-card p-6 flex flex-col justify-between hover:border-[#0072ce] hover:shadow-md transition-all group bg-white border ${isGurullyDrill ? 'border-amber-400 ring-1 ring-amber-300' : isCompleted ? 'border-emerald-300 ring-1 ring-emerald-200' : isReady ? 'border-sky-400 ring-1 ring-sky-300' : 'border-[#cbd5e1]'}">
                <div>
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            ${isGurullyDrill ? `
                                <span class="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase">🎯 TARGETED PRACTICE</span>
                            ` : isCompleted ? `
                                <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase inline-flex items-center gap-1">
                                    <svg class="w-3.5 h-3.5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                    COMPLETED
                                </span>
                            ` : isReady ? `
                                <span class="bg-sky-100 text-[#005696] border border-sky-300 font-bold px-2.5 py-0.5 rounded text-xs tracking-wider uppercase inline-flex items-center gap-1">
                                    <span class="w-2 h-2 rounded-full bg-[#005696]"></span>
                                    NEXT UP &bull; READY
                                </span>
                            ` : `
                                <span class="${isPTE ? 'badge-pte' : 'badge-ielts'}">${test.exam_type} PRACTICE DRILL</span>
                            `}
                            ${isFullMock ? `<span class="badge-pte">PTE MOCK${badgeNumber}</span>` : ''}
                        </div>
                        <span class="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1">
                            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ${isFullMock ? 135 : test.total_time_minutes} Mins
                        </span>
                    </div>

                    <div class="flex items-start justify-between gap-2 mb-2">
                        <h3 class="text-lg md:text-xl font-bold text-[#002244] group-hover:text-[#0072ce] transition-colors">${this.escapeHtml(test.title.replace(/Official\s+/gi, ''))}</h3>
                        ${scoreBadge}
                    </div>

                    <p class="text-slate-600 text-xs md:text-sm mb-4 leading-relaxed">${isFullMock && test.question_count < 65 ? 'Original exam-style practice questions. This legacy bank is shorter than the current PTE Academic test.' : this.escapeHtml(test.description)}</p>
                    ${isFullMock && test.question_count < 65 ? `<p class="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mb-4">Legacy ${test.question_count}-item mock. The current official form has 65–75 items and additional question types; use this for targeted practice, not a score prediction.</p>` : ''}

                    ${isGurullyDrill ? `
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-amber-50/60 border border-amber-200 rounded mb-4 text-xs">
                            <div class="text-center p-1.5 bg-white rounded border border-amber-100">
                                <div class="font-bold text-[#002244]">Speaking (8)</div>
                                <div class="text-[10px] text-amber-800 font-semibold">Fluency &amp; Rhythm</div>
                                <div class="text-[9px] text-slate-500">RA • RS • DI • RL • ASQ</div>
                            </div>
                            <div class="text-center p-1.5 bg-white rounded border border-amber-100">
                                <div class="font-bold text-[#002244]">Writing (2)</div>
                                <div class="text-[10px] text-amber-800 font-semibold">Grammar Practice</div>
                                <div class="text-[9px] text-slate-500">SWT • Essay (220-250w)</div>
                            </div>
                            <div class="text-center p-1.5 bg-white rounded border border-amber-100">
                                <div class="font-bold text-[#002244]">Reading (4)</div>
                                <div class="text-[10px] text-amber-800 font-semibold">RO Pairing &amp; MCMA</div>
                                <div class="text-[9px] text-slate-500">RO • MCMA • Drag&amp;Drop</div>
                            </div>
                            <div class="text-center p-1.5 bg-white rounded border border-amber-100">
                                <div class="font-bold text-[#002244]">Listening (5)</div>
                                <div class="text-[10px] text-amber-800 font-semibold">SST &amp; Dictation</div>
                                <div class="text-[9px] text-slate-500">SST • MCMA • LFIB • WFD</div>
                            </div>
                        </div>
                    ` : isFullMock ? `
                        <div class="grid grid-cols-3 gap-2 p-3 bg-[#f8fafc] border border-slate-200 rounded mb-4 text-xs">
                            <div class="text-center">
                                <div class="font-bold text-[#002244]">Part 1</div>
                                <div class="text-[11px] text-slate-600">Speaking &amp; Writing</div>
                                <div class="text-[10px] text-[#0072ce] font-semibold">${test.question_count < 65 ? '22 items' : '35+ items'} • 78m</div>
                            </div>
                            <div class="text-center border-x border-slate-200">
                                <div class="font-bold text-[#002244]">Part 2</div>
                                <div class="text-[11px] text-slate-600">Reading</div>
                                <div class="text-[10px] text-[#0072ce] font-semibold">${test.question_count < 65 ? '12 items' : '15+ items'} • 25m</div>
                            </div>
                            <div class="text-center">
                                <div class="font-bold text-[#002244]">Part 3</div>
                                <div class="text-[11px] text-slate-600">Listening</div>
                                <div class="text-[10px] text-[#0072ce] font-semibold">${test.question_count < 65 ? '11 items' : '15+ items'} • 32m</div>
                            </div>
                        </div>
                    ` : `
                        <div class="p-2.5 bg-[#f8fafc] border border-slate-200 rounded mb-4 text-xs text-slate-600 flex items-center justify-between">
                            <span class="font-medium">Targeted Practice Module</span>
                            <span class="text-[#0072ce] font-semibold">Daily Drill</span>
                        </div>
                    `}

                    <div class="flex flex-wrap gap-2 text-[11px] text-slate-600 mb-2">
                        <span class="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            ✓ Audio Plays Once
                        </span>
                        <span class="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            ✓ Mic Auto Cutoff
                        </span>
                        <span class="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            ✓ 10–90 Rubrics
                        </span>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <button data-test-id="${test.id}" class="btn-start-test ${isGurullyDrill ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded transition-colors shadow-sm' : isCompleted ? 'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded transition-colors shadow-sm' : 'btn-primary'} w-full flex justify-center items-center gap-2 text-sm shadow-xs">
                        <span>${isGurullyDrill ? 'Launch Targeted Practice Drill (19 Items)' : isCompleted ? 'Retake Full Test Simulator' : isFullMock ? 'Launch Full Test Simulator' : 'Start Practice Drill'}</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                    ${isCompleted && attempt ? `
                        <button type="button" onclick="window.appRouter.showScorecard(${attempt.id})" class="text-xs text-center text-[#005696] hover:underline font-semibold py-1">
                            Review Practice Report (Attempt #${attempt.id}) &rarr;
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    bindTestLaunchButtons() {
        document.querySelectorAll('.btn-start-test').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const testId = e.currentTarget.getAttribute('data-test-id');
                await this.launchExam(testId);
            });
        });
    }

    async launchExam(testId) {
        try {
            const res = await fetch(`/api/tests/${testId}`);
            const data = await res.json();
            if (!data.success) {
                alert("Failed to load test details.");
                return;
            }

            const test = data.data;
            this.currentView = 'exam';
            this.toggleHeaderState(true);

            const mainContent = document.getElementById('main-container');
            mainContent.innerHTML = `<div id="exam-content-area" class="w-full"></div>`;

            if (test.exam_type === 'PTE') {
                window.pteEngine.startTest(test);
            } else {
                window.ieltsEngine.startTest(test);
            }

        } catch (err) {
            console.error("Launch exam error:", err);
            alert("Network error starting exam session.");
        }
    }

    async launchRemediationDrill(attemptId) {
        try {
            const res = await fetch(`/api/attempts/${attemptId}/remediation-drill`);
            const data = await res.json();
            if (!data.success || !data.data || !data.data.questions || !data.data.questions.length) {
                alert("No missed items found to drill for this attempt! Outstanding execution.");
                return;
            }

            const drill = data.data;
            this.currentView = 'exam';
            this.toggleHeaderState(true);

            const mainContent = document.getElementById('main-container');
            mainContent.innerHTML = `<div id="exam-content-area" class="w-full"></div>`;

            window.pteEngine.startTest(drill);
        } catch (err) {
            console.error("Launch remediation drill error:", err);
            alert("Failed to synthesize targeted remediation drill.");
        }
    }

    async showScorecard(attemptId) {
        this.currentView = 'scorecard';
        document.body.classList.remove('pearson-mode');
        this.toggleHeaderState(false);

        const mainContent = document.getElementById('main-container');
        mainContent.innerHTML = `<div class="p-8 text-center text-slate-600 font-medium">Loading estimated practice report...</div>`;

        await window.evaluationView.renderAttemptReport(attemptId, mainContent);
    }

    async loadVault() {
        await this.loadDashboard();
        setTimeout(() => {
            const section = document.getElementById('section-score-reports');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    toggleHeaderState(isExamMode) {
        const timerContainer = document.getElementById('timer-container');
        const endBtn = document.getElementById('btn-end-exam');

        if (isExamMode) {
            if (timerContainer) timerContainer.classList.remove('hidden');
            if (endBtn) endBtn.classList.remove('hidden');
        } else {
            if (timerContainer) timerContainer.classList.add('hidden');
            if (endBtn) endBtn.classList.add('hidden');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appRouter = new AppRouter();
    window.appRouter.init();
});
