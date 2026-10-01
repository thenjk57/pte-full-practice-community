/**
 * Pearson PTE Academic Test Taker Score Report & Mistakes Vault
 * Renders: official Pearson candidate details, overall score & CEFR proficiency,
 * communicative skills, six enabling skills, prioritized recommendations,
 * mistake vault, and per-item diagnostic breakdown.
 */

const ENABLING_LABELS = {
    grammar: 'Grammar',
    spelling: 'Spelling',
    fluency: 'Oral Fluency',
    pronunciation: 'Pronunciation',
    vocabulary: 'Vocabulary',
    discourse: 'Written Discourse'
};

class EvaluationView {

    async renderAttemptReport(attemptId, containerEl) {
        containerEl.innerHTML = `<div class="p-8 text-center text-slate-500 font-medium">Loading estimated practice report...</div>`;

        try {
            const [reportRes, analysisRes] = await Promise.all([
                fetch(`/api/attempts/${attemptId}`),
                fetch(`/api/attempts/${attemptId}/analysis`)
            ]);
            const reportJson = await reportRes.json();
            if (!reportJson.success) throw new Error('report load failed');

            const attempt = reportJson.data;
            const analysis = analysisRes.ok ? (await analysisRes.json()).data : null;

            const mistakes = attempt.mistakes || [];
            const overallScore = attempt.overall_score;
            const gapTo90 = overallScore == null ? null : Math.max(0, 90 - overallScore);

            const enabling = [
                ['grammar', attempt.enabling_grammar],
                ['spelling', attempt.enabling_spelling],
                ['fluency', attempt.enabling_fluency],
                ['pronunciation', attempt.enabling_pronunciation],
                ['vocabulary', attempt.enabling_vocabulary],
                ['discourse', attempt.enabling_discourse]
            ].filter(([, v]) => v != null);

            const html = `
                <div class="max-w-6xl mx-auto space-y-6 py-2">
                    <!-- Top Navigation Bar -->
                    <div class="flex items-center justify-between">
                        <button onclick="window.appRouter.loadDashboard()" class="btn-secondary text-xs px-3.5 py-1.5 inline-flex items-center gap-2 shadow-xs">
                            <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            <span>Return to Candidate Portal</span>
                        </button>
                        <div class="text-xs text-slate-500 hidden sm:block">
                            Report Generated: <span class="font-semibold text-slate-700">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    ${this.headerCard(attempt, overallScore, gapTo90)}

                    ${this.remediationHeroCard(attempt, mistakes)}

                    <!-- Communicative Skills Grid -->
                    <div>
                        <div class="text-xs font-bold uppercase tracking-wider text-[#002244] mb-3 flex items-center gap-2">
                            <span class="w-1.5 h-3 bg-[#0072ce] rounded-full inline-block"></span>
                            Communicative Skills
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            ${this.skillCard('Speaking', attempt.speaking_score)}
                            ${this.skillCard('Writing', attempt.writing_score)}
                            ${this.skillCard('Reading', attempt.reading_score)}
                            ${this.skillCard('Listening', attempt.listening_score)}
                        </div>
                    </div>

                    <!-- Enabling Skills Breakdown -->
                    <div class="glass-card p-6 bg-white border border-[#cbd5e1]">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
                            <div>
                                <h3 class="text-base font-bold text-[#002244]">Practice diagnostics</h3>
                                <p class="text-xs text-slate-500 mt-0.5">These are local feedback indicators, not official reported skills or Pearson score components.</p>
                            </div>
                            <span class="text-xs font-semibold text-[#005696] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 self-start sm:self-auto">
                                6 Tracked Skills
                            </span>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
                            ${enabling.length
                                ? enabling.map(([k, v]) => this.enablingCell(ENABLING_LABELS[k], v)).join('')
                                : '<div class="col-span-6 text-xs text-slate-500">No enabling-skill data recorded for this attempt.</div>'}
                        </div>
                    </div>

                    ${analysis && analysis.recommendations ? this.recommendationsCard(analysis) : ''}

                    ${this.mistakeVault(mistakes)}

                    ${analysis ? this.analysisStrip(analysis) : ''}

                    ${this.itemBreakdown(attempt)}

                    <!-- Bottom Return Action -->
                    <div class="pt-4 pb-8 text-center">
                        <button onclick="window.appRouter.loadDashboard()" class="btn-secondary text-sm px-6 py-2.5 inline-flex items-center gap-2 shadow-xs">
                            <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            <span>Return to Candidate Portal</span>
                        </button>
                    </div>
                </div>`;

            containerEl.innerHTML = html;
            this.bindCopyPrompt(attempt, overallScore);

        } catch (err) {
            console.error('Error rendering attempt report:', err);
            containerEl.innerHTML = `<div class="p-6 text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded">Failed to render practice report. Check server logs.</div>`;
        }
    }

    headerCard(attempt, overallScore, gapTo90) {
        if (overallScore == null) return `<div class="glass-card p-6">Pending review — no overall score or CEFR level is available.<p>${this.escAttr(attempt.summary_feedback || '')}</p></div>`;
        let cefrLevel = 'B1 (Developing)';
        let levelColor = 'text-rose-700 bg-rose-50 border-rose-200';
        if (overallScore >= 85) {
            cefrLevel = 'C2 (Superior English)';
            levelColor = 'text-emerald-800 bg-emerald-50 border-emerald-300';
        } else if (overallScore >= 76) {
            cefrLevel = 'C1 (Proficient English)';
            levelColor = 'text-[#005696] bg-blue-50 border-blue-300';
        } else if (overallScore >= 59) {
            cefrLevel = 'B2 (Competent English)';
            levelColor = 'text-amber-800 bg-amber-50 border-amber-300';
        }

        return `
            <div class="glass-card overflow-hidden bg-white border border-[#cbd5e1] shadow-sm">
                <!-- Navy Pearson Header Bar -->
                <div class="bg-[#002244] px-6 py-4 border-b-4 border-[#005696] text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div class="flex items-center gap-3">
                        <span class="pearson-logo-mark text-white">PTE Practice</span>
                        <span class="text-sky-300 font-light text-lg">|</span>
                        <div>
                            <div class="text-sm font-bold tracking-wide text-white uppercase">Estimated PTE Academic Practice Report</div>
                            <div class="text-[11px] text-sky-200">Independent practice. Not affiliated with Pearson. Speech and open-response scores require human review.</div>
                        </div>
                    </div>
                    <div class="inline-flex items-center gap-2 bg-[#003870] border border-[#005696] text-sky-200 text-xs px-3 py-1 rounded font-mono font-medium">
                        <span>Practice attempt:</span>
                        <span class="text-amber-400 font-bold">#${attempt.id}</span>
                    </div>
                </div>

                <!-- Candidate & Score Information Row -->
                <div class="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div class="space-y-2 max-w-xl">
                        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Taker Details</div>
                        <h1 class="text-xl md:text-2xl font-bold text-[#002244]">${String(attempt.test_title || '').replace(/Official\s+/gi, '')}</h1>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
                            <div><strong class="text-slate-800">Candidate Name:</strong> ${attempt.student_name || 'Practice Candidate'}</div>
                            <div><strong class="text-slate-800">Attempt ID:</strong> #${attempt.id}</div>
                            <div><strong class="text-slate-800">Date Completed:</strong> ${attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}</div>
                            <div><strong class="text-slate-800">Test setting:</strong> Independent online practice</div>
                        </div>
                        ${attempt.summary_feedback ? `
                            <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed mt-2">
                                <strong class="text-[#002244]">Examiner Feedback:</strong> ${attempt.summary_feedback}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Overall Score & Gap Displays -->
                    <div class="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-end">
                        <div class="text-center bg-[#f8fafc] px-6 py-4 rounded border border-slate-300 min-w-[130px]">
                            <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Estimated Overall</span>
                            <span class="text-4xl font-extrabold text-[#002244] block my-0.5">${overallScore}</span>
                            <span class="text-[11px] text-slate-500 block">Scale: 10–90</span>
                            <div class="mt-2 text-[10px] font-bold px-2 py-0.5 rounded border ${levelColor} inline-block">
                                ${cefrLevel}
                            </div>
                        </div>
                        <div class="text-center bg-[#f8fafc] px-6 py-4 rounded border border-slate-300 min-w-[130px]">
                            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">Gap to 90</span>
                            <span class="text-3xl font-extrabold text-amber-600 block my-1">${gapTo90 === 0 ? 'GOAL ✓' : '−' + gapTo90}</span>
                            <span class="text-[11px] text-slate-500 block">${gapTo90 === 0 ? 'Target achieved' : 'points remaining'}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    remediationHeroCard(attempt, mistakes = []) {
        return `
            <div class="glass-card p-5 bg-gradient-to-r from-[#002244] via-[#003870] to-[#005696] border-2 border-amber-400 rounded-md shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div class="space-y-1">
                    <div class="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        <span>⚡ 1-Click Targeted Practice</span>
                    </div>
                    <h3 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Practice My Mistakes Drill</span>
                        <span class="text-xs bg-amber-400 text-slate-900 font-bold px-2 py-0.5 rounded-full">${mistakes.length} Focus Items</span>
                    </h3>
                    <p class="text-xs text-sky-100 max-w-2xl leading-relaxed">
                        Instantly synthesize a custom remediation practice drill from every question you missed or struggled with in Attempt #${attempt.id}. Practice until you achieve flawless 90 GSE mastery.
                    </p>
                </div>
                <button id="btn-practice-my-mistakes" onclick="window.appRouter.launchRemediationDrill(${attempt.id})" class="shrink-0 bg-amber-400 hover:bg-amber-300 text-[#002244] font-extrabold px-5 py-2.5 rounded shadow inline-flex items-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer">
                    <svg class="w-4 h-4 text-[#002244]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>🎯 Practice My Mistakes</span>
                </button>
            </div>`;
    }

    skillCard(title, score) {
        if (score == null) return `<div class="glass-card p-4 text-center"><span>${this.escAttr(title)}</span><p>Pending review</p></div>`;
        const v = score != null ? score : 10;
        const pct = Math.max(0, Math.min(100, ((v - 10) / 80) * 100));
        return `
            <div class="glass-card p-4 text-center bg-white border border-[#cbd5e1] shadow-xs">
                <span class="text-xs font-bold text-slate-600 uppercase tracking-wider block">${title}</span>
                <span class="text-3xl font-bold text-[#002244] mt-1 block">${v}</span>
                <div class="h-2 bg-slate-100 rounded mt-2.5 overflow-hidden border border-slate-200">
                    <div class="h-full bg-[#0072ce]" style="width:${pct}%"></div>
                </div>
                <span class="text-xs text-slate-500 font-semibold block mt-1.5">/ 90</span>
            </div>`;
    }

    enablingCell(label, score) {
        const good = score >= 85;
        const warn = score >= 70 && score < 85;
        const color = good ? 'text-emerald-700' : warn ? 'text-amber-700' : 'text-rose-700';
        const bar = good ? 'bg-emerald-600' : warn ? 'bg-amber-600' : 'bg-rose-600';
        const pct = Math.max(0, Math.min(100, ((score - 10) / 80) * 100));
        return `
            <div class="bg-[#f8fafc] rounded p-3 text-center border border-slate-200">
                <div class="text-[11px] text-slate-600 font-bold uppercase tracking-wider leading-tight">${label}</div>
                <div class="text-2xl font-extrabold ${color} mt-1">${score}</div>
                <div class="h-1.5 bg-slate-200 rounded mt-2 overflow-hidden">
                    <div class="h-full ${bar}" style="width:${pct}%"></div>
                </div>
                <div class="text-[10px] text-slate-500 mt-1 font-medium">gap ${Math.max(0, 90 - score)}</div>
            </div>`;
    }

    recommendationsCard(analysis) {
        const recs = (analysis.recommendations || []).slice(0, 5);
        if (!recs.length) return '';
        const priStyle = {
            high: 'border-l-4 border-l-rose-500 bg-rose-50/70 border border-rose-200 text-rose-950',
            medium: 'border-l-4 border-l-amber-500 bg-amber-50/70 border border-amber-200 text-amber-950',
            info: 'border-l-4 border-l-sky-500 bg-sky-50/70 border border-sky-200 text-sky-950'
        };
        const badgeStyle = {
            high: 'bg-rose-100 text-rose-800 border-rose-300',
            medium: 'bg-amber-100 text-amber-800 border-amber-300',
            info: 'bg-sky-100 text-sky-800 border-sky-300'
        };
        return `
            <div class="glass-card p-6 bg-white border border-[#cbd5e1] border-l-4 border-l-emerald-600 shadow-xs">
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <div>
                        <h3 class="text-base font-bold text-[#002244]">Prioritised Strategy &amp; Actions to Reach 90</h3>
                        <p class="text-xs text-slate-500 mt-0.5">High-impact diagnostic interventions targeting your weakest enabling skills.</p>
                    </div>
                    <span class="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1 rounded">
                        Target: 90
                    </span>
                </div>
                <div class="space-y-3 mt-3">
                    ${recs.map(r => `
                        <div class="rounded p-3.5 ${priStyle[r.priority] || priStyle.info}">
                            <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeStyle[r.priority] || badgeStyle.info}">${r.priority} priority • ${r.area}</span>
                            <p class="text-sm text-slate-800 mt-2 leading-relaxed font-medium">${r.action}</p>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    analysisStrip(analysis) {
        const byType = (analysis.item_types_ranked || []).slice(0, 6);
        if (!byType.length) return '';
        return `
            <div class="glass-card p-6 bg-white border border-[#cbd5e1] shadow-xs">
                <div class="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                    <div>
                        <h3 class="text-base font-bold text-[#002244]">Item-Type Performance Diagnostic</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Aggregated performance across key question archetypes.</p>
                    </div>
                    <span class="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-medium">${analysis.totals.items} items • ${analysis.totals.mistakes} logged errors</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${byType.map(t => {
                        const pct = Math.max(0, Math.min(100, ((t.average - 10) / 80) * 100));
                        const color = t.average >= 85 ? 'bg-emerald-600' : t.average >= 70 ? 'bg-amber-600' : 'bg-rose-600';
                        return `
                            <div class="bg-[#f8fafc] rounded p-3 border border-slate-200 flex items-center gap-3">
                                <div class="flex-1">
                                    <div class="text-xs text-slate-800 font-bold capitalize">${(t.type || '').replace(/_/g, ' ')}</div>
                                    <div class="text-[11px] text-slate-500">${t.module} • ${t.count} item(s) • gap ${t.gap_to_90}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold ${t.average >= 85 ? 'text-emerald-700' : t.average >= 70 ? 'text-amber-700' : 'text-rose-700'}">${t.average}</div>
                                </div>
                                <div class="w-20 h-1.5 bg-slate-200 rounded overflow-hidden">
                                    <div class="h-full ${color}" style="width:${pct}%"></div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;
    }

    mistakeVault(mistakes) {
        return `
            <div class="glass-card p-6 bg-white border border-[#cbd5e1] border-l-4 border-l-rose-500 shadow-xs">
                <div class="flex justify-between items-center mb-4 border-b border-slate-200 pb-3">
                    <div>
                        <h3 class="text-base font-bold text-[#002244]">Mistakes &amp; Model Corrections Vault</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Every flagged error with the exact correction required for a 90 GSE score.</p>
                    </div>
                    <span class="text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1 rounded-full">${mistakes.length} flagged</span>
                </div>
                ${mistakes.length === 0
                    ? `<div class="p-6 text-center text-emerald-800 bg-emerald-50 border border-emerald-200 rounded text-sm font-semibold">No errors flagged — outstanding execution across all items.</div>`
                    : `<div class="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
                        ${mistakes.map(m => `
                            <div class="bg-[#f8fafc] p-4 rounded border border-slate-200">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">${m.category}</span>
                                    <span class="text-xs text-slate-600 font-semibold">${m.question_title || ''}</span>
                                </div>
                                <p class="text-sm text-slate-800">❌ <strong class="text-rose-700 font-bold">Mistake:</strong> ${this.escAttr(m.exact_mistake)}</p>
                                <p class="text-sm text-slate-800 mt-1">✅ <strong class="text-emerald-700 font-bold">Correction:</strong> ${this.escAttr(m.model_correction)}</p>
                            </div>`).join('')}
                    </div>`}
            </div>`;
    }

    itemBreakdown(attempt) {
        const responses = attempt.responses || [];
        if (!responses.length) return '';

        const grouped = {};
        responses.forEach(r => {
            const p = r.part || 1;
            (grouped[p] = grouped[p] || { title: r.part_title || `Part ${p}`, items: [] }).items.push(r);
        });

        const parts = Object.keys(grouped).sort((a, b) => a - b).map(p => grouped[p]);

        return `
            <div class="glass-card p-6 bg-white border border-[#cbd5e1] shadow-xs">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-6 gap-3">
                    <div>
                        <h3 class="text-lg font-bold text-[#002244]">Item-by-Item Diagnostic Breakdown</h3>
                        <p class="text-xs text-slate-500 mt-0.5">Detailed examinee responses, recordings, and automated rubric sub-scores.</p>
                    </div>
                    <button id="btn-copy-ai-prompt" data-attempt="${attempt.id}" class="btn-secondary text-xs px-3 py-1.5 self-start sm:self-auto inline-flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        <span>Copy AI Review Prompt</span>
                    </button>
                </div>
                ${parts.map(group => `
                    <div class="mb-8 last:mb-0">
                        <div class="text-xs font-bold uppercase tracking-wider text-[#005696] mb-3 pb-1 border-b border-blue-100 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-[#0072ce]"></span>
                            ${group.title}
                        </div>
                        <div class="space-y-4">
                            ${group.items.map((r, i) => this.responseItem(r, i)).join('')}
                        </div>
                    </div>`).join('')}
            </div>`;
    }

    responseItem(r, idx) {
        const fb = r.feedback || {};
        const subs = r.sub_scores || fb.subScores || {};
        const metrics = r.metrics || fb.metrics || {};
        const score = r.score != null ? r.score : 0;
        const pending = r.score == null || metrics.verified === false;
        const pct = Math.max(0, Math.min(100, ((score - 10) / 80) * 100));

        let content = '';
        if (r.text_response) {
            content += `<div class="bg-white border border-slate-300 p-4 rounded text-slate-800 text-sm font-mono leading-relaxed whitespace-pre-wrap mt-3 shadow-inner">${this.escAttr(r.text_response)}</div>`;
        }
        if (r.audio_file_path) {
            content += `
                <div class="mt-3 bg-white p-3 rounded border border-slate-300 flex items-center gap-3">
                    <span class="text-xs font-bold text-[#005696] shrink-0">Your recording${metrics.durationSeconds ? ` (${metrics.durationSeconds}s)` : ''}:</span>
                    <audio controls src="/${r.audio_file_path}" class="w-full h-8"></audio>
                </div>`;
        }

        const subRows = Object.entries(subs).map(([k, v]) => {
            const val = typeof v === 'number' ? Math.round(v * 100) : v;
            const label = (k || '').replace(/_/g, ' ');
            const isRatio = typeof v === 'number' && v <= 1;
            return `<div class="bg-slate-100 border border-slate-200 rounded px-2 py-1 text-center">
                <div class="text-[10px] text-slate-600 font-semibold capitalize">${label}</div>
                <div class="text-sm font-bold ${isRatio ? (v >= 0.85 ? 'text-emerald-700' : v >= 0.6 ? 'text-amber-700' : 'text-rose-700') : 'text-[#005696]'}">${val}${isRatio ? '%' : ''}</div>
            </div>`;
        }).join('');

        const detailBits = [];
        if (metrics.word_count != null) detailBits.push(`${metrics.word_count} words`);
        if (metrics.accuracy_pct != null) detailBits.push(`${metrics.accuracy_pct}% accuracy`);
        if (metrics.words_correct != null) detailBits.push(`${metrics.words_correct}/${metrics.words_expected} words`);
        if (metrics.key_points_total) detailBits.push(`${metrics.key_points_matched}/${metrics.key_points_total} key points`);
        if (r.time_spent_seconds) detailBits.push(`${r.time_spent_seconds}s spent`);

        return `
            <div class="bg-[#f8fafc] p-5 rounded border border-slate-200 shadow-xs">
                <div class="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <span class="text-sm font-bold text-[#002244]">${(r.question_type || '').replace(/_/g, ' ')} — ${this.escAttr(r.question_title)}</span>
                        <div class="text-[11px] text-slate-500 mt-0.5 font-medium">${detailBits.join(' • ')}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-extrabold ${score >= 85 ? 'text-emerald-700' : score >= 70 ? 'text-amber-700' : 'text-rose-700'}">${pending ? 'Pending review' : `${score}<span class="text-xs text-slate-500 font-normal"> / 90</span>`}</div>
                        ${pending ? '' : `<div class="w-28 h-1.5 bg-slate-200 rounded overflow-hidden mt-1">
                            <div class="h-full ${score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-amber-600' : 'bg-rose-600'}" style="width:${pct}%"></div>
                        </div>`}
                    </div>
                </div>

                ${subRows ? `<div class="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">${subRows}</div>` : ''}
                ${content}

                ${this.renderSpeakingDiagnostics(metrics, r)}
                ${this.renderWritingDiagnostics(metrics, r)}
                ${this.renderCollocationDiagnostics(metrics, r)}

                ${r.model_answer ? `
                    <details class="mt-3 bg-white border border-emerald-300 rounded p-3">
                        <summary class="text-xs font-bold text-emerald-800 cursor-pointer">Model answer / correct response</summary>
                        <p class="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">${this.escAttr(r.model_answer)}</p>
                    </details>` : ''}

                ${fb.feedback && fb.feedback.length ? `
                    <div class="mt-2.5 text-xs text-slate-600 bg-white border border-slate-200 rounded p-2.5 space-y-1">
                        ${fb.feedback.map(f => `<div class="flex items-start gap-1.5"><span class="text-slate-400">•</span><span>${this.escAttr(f)}</span></div>`).join('')}
                    </div>` : ''}
            </div>`;
    }

    renderSpeakingDiagnostics(metrics, r) {
        if (!r.audio_file_path && r.module !== 'speaking' && (!metrics.word_alignment || !metrics.word_alignment.length)) {
            return '';
        }
        const hesitations = metrics.hesitationsCount || 0;
        const maxPause = Number(metrics.maxPauseSeconds || 0);
        const initSilence = Number(metrics.initialSilenceSeconds || 0);
        const words = metrics.word_alignment || [];

        return `
            <div class="mt-3 p-3.5 bg-white rounded border border-slate-200 shadow-2xs">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div class="text-xs font-bold text-[#002244] flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-[#0072ce]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
                        <span>Recording Timing &amp; Transcript Diagnostics</span>
                    </div>
                    <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Practice estimates, not verified pronunciation</span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                    <div class="bg-slate-50 p-2 rounded border border-slate-200">
                        <span class="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Hesitations (&gt;1.5s)</span>
                        <span class="text-sm font-extrabold ${hesitations > 0 ? 'text-amber-600' : 'text-emerald-700'}">${hesitations} pause(s)</span>
                    </div>
                    <div class="bg-slate-50 p-2 rounded border border-slate-200">
                        <span class="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Max Pause</span>
                        <span class="text-sm font-extrabold ${maxPause > 1.5 ? 'text-amber-600' : 'text-slate-700'}">${maxPause.toFixed(1)}s</span>
                    </div>
                    <div class="bg-slate-50 p-2 rounded border border-slate-200">
                        <span class="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Initial Silence</span>
                        <span class="text-sm font-extrabold ${initSilence >= 3.0 ? 'text-rose-600' : 'text-emerald-700'}">${initSilence.toFixed(1)}s ${initSilence >= 3.0 ? '⚠️' : ''}</span>
                    </div>
                    <div class="bg-slate-50 p-2 rounded border border-slate-200">
                        <span class="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Speaking Pace</span>
                        <span class="text-sm font-extrabold text-[#005696]">${metrics.wordsPerSecond ? `${metrics.wordsPerSecond} w/s` : 'Not measured'}</span>
                    </div>
                </div>

                ${words.length ? `
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                            <span>Transcript Word Comparison:</span>
                            <div class="flex items-center gap-2.5 text-[10px]">
                                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Accurate</span>
                                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Hesitated</span>
                                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Omitted</span>
                                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Inserted</span>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded border border-slate-200">
                            ${words.map(w => {
                                let badge = 'bg-emerald-50 text-emerald-800 border-emerald-300';
                                let icon = '✓';
                                if (w.status === 'hesitated') {
                                    badge = 'bg-amber-50 text-amber-900 border-amber-400 font-semibold';
                                    icon = '⏸';
                                } else if (w.status === 'omitted') {
                                    badge = 'bg-rose-50 text-rose-800 border-rose-300 line-through opacity-75';
                                    icon = '✗';
                                } else if (w.status === 'inserted') {
                                    badge = 'bg-purple-50 text-purple-900 border-purple-300 border-dashed';
                                    icon = '+';
                                }
                                return `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${badge} cursor-help" title="${this.escAttr(w.note || w.status)}">
                                    <span>${this.escAttr(w.word)}</span>
                                    <span class="text-[9px] opacity-75">${icon}</span>
                                </span>`;
                            }).join('')}
                        </div>
                    </div>` : ''}
            </div>`;
    }

    renderWritingDiagnostics(metrics, r) {
        const annotations = metrics.annotations || [];
        if (!annotations.length && r.module !== 'writing') return '';
        if (!annotations.length) return '';

        return `
            <div class="mt-3 p-3.5 bg-white rounded border border-slate-200 shadow-2xs">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div class="text-xs font-bold text-[#002244] flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        <span>Academic Writing Inspector &amp; AWL Diagnostics</span>
                    </div>
                    <span class="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        ${annotations.length} Diagnostic Note(s)
                    </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    ${annotations.map(a => `
                        <div class="p-2.5 rounded border text-xs ${a.type === 'contraction' ? 'bg-amber-50/70 border-amber-300 text-amber-950' : a.type === 'awl_suggestion' ? 'bg-blue-50/70 border-blue-300 text-blue-950' : 'bg-rose-50/70 border-rose-300 text-rose-950'}">
                            <div class="flex items-center justify-between font-bold mb-1">
                                <span class="uppercase tracking-wider text-[10px] ${a.type === 'contraction' ? 'text-amber-800' : a.type === 'awl_suggestion' ? 'text-blue-800' : 'text-rose-800'}">${a.category || a.type}</span>
                                <span class="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-slate-700">${this.escAttr(a.text)}</span>
                            </div>
                            <p class="text-slate-800 leading-snug">${this.escAttr(a.message)}</p>
                            ${a.suggestion ? `<div class="mt-1 font-semibold text-[11px] text-emerald-800">💡 Suggestion: "${this.escAttr(a.suggestion)}"</div>` : ''}
                        </div>`).join('')}
                </div>
            </div>`;
    }

    renderCollocationDiagnostics(metrics, r) {
        const details = metrics.details || [];
        if (!details.length || metrics.blanks_total == null) return '';

        return `
            <div class="mt-3 p-3.5 bg-white rounded border border-slate-200 shadow-2xs">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div class="text-xs font-bold text-[#002244] flex items-center gap-1.5">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span>Academic Collocation List (ACL) &amp; Gap Explanations</span>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        ${metrics.blanks_correct || 0} / ${metrics.blanks_total || 0} Gaps Correct
                    </span>
                </div>
                <div class="space-y-2">
                    ${details.map(d => `
                        <div class="p-2.5 rounded border text-xs ${d.correct ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'}">
                            <div class="flex items-center justify-between font-bold mb-1">
                                <span class="text-slate-800 font-mono">Blank: ${this.escAttr(d.blank)}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${d.correct ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                                    ${d.correct ? '✓ Correct' : '✗ Missed'}
                                </span>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 mb-1">
                                <div><strong>Your Answer:</strong> <span class="${d.correct ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}">${this.escAttr(d.actual || '(blank)')}</span></div>
                                <div><strong>Expected:</strong> <span class="text-emerald-800 font-bold">${this.escAttr(d.expected)}</span></div>
                            </div>
                            ${d.rationale ? `<div class="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-200 mt-1"><strong>Collocation Rationale:</strong> ${this.escAttr(d.rationale)}</div>` : ''}
                        </div>`).join('')}
                </div>
            </div>`;
    }

    bindCopyPrompt(attempt, overallScore) {
        const btn = document.getElementById('btn-copy-ai-prompt');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const promptText =
                `I have completed a new PTE test attempt (Attempt #${attempt.id}: ${attempt.test_title}). ` +
                `Current score is ${overallScore}/90. ` +
                `Please run \`npm run evaluate ${attempt.id}\`, inspect the user_responses, mistake_logs and ` +
                `recorded audio in this database, and give a line-by-line examiner review covering ` +
                `content, oral fluency, pronunciation, grammar, spelling, vocabulary and written discourse, ` +
                `with concrete corrections to close the remaining gap to 90.`;
            navigator.clipboard.writeText(promptText).then(
                () => alert('Review prompt copied to clipboard — paste it into the chat.'),
                () => alert('Could not access the clipboard.')
            );
        });
    }

    escAttr(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

window.evaluationView = new EvaluationView();
