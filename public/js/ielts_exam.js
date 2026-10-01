/**
 * IELTS Academic Exam Simulator Module
 */

class IELTSExamEngine {
    constructor() {
        this.test = null;
        this.questions = [];
        this.currentIndex = 0;
        this.responses = {}; // questionId -> { textResponse, audioFilePath }
        this.timerInterval = null;
        this.remainingSeconds = 0;
    }

    startTest(testData) {
        this.test = testData;
        this.questions = testData.questions || [];
        this.currentIndex = 0;
        this.responses = {};
        this.remainingSeconds = (testData.total_time_minutes || 120) * 60;

        this.startTimer();
        this.renderQuestion();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        const timerEl = document.getElementById('exam-timer');
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            if (this.remainingSeconds <= 0) {
                clearInterval(this.timerInterval);
                alert("Time is up! Submitting your IELTS Academic exam attempt.");
                this.submitTest();
                return;
            }

            const mins = Math.floor(this.remainingSeconds / 60);
            const secs = this.remainingSeconds % 60;
            if (timerEl) {
                timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
        }, 1000);
    }

    renderQuestion() {
        const q = this.questions[this.currentIndex];
        if (!q) return;

        const container = document.getElementById('exam-content-area');
        const progressEl = document.getElementById('question-progress');
        if (progressEl) {
            progressEl.textContent = `Section ${this.currentIndex + 1} of ${this.questions.length}`;
        }

        let html = '';

        // Reading split-screen view
        if (q.module === 'reading') {
            html = this.renderSplitReading(q);
        }
        // Writing dual pane view
        else if (q.module === 'writing') {
            html = this.renderWritingView(q);
        }
        // Listening view
        else if (q.module === 'listening') {
            html = this.renderListeningView(q);
        }
        // Speaking cue card view
        else if (q.module === 'speaking') {
            html = this.renderSpeakingView(q);
        }

        container.innerHTML = html;
        this.bindEvents(q);
    }

    renderSplitReading(q) {
        const optionsList = q.options || [];
        
        let questionsRightHtml = optionsList.map((item, idx) => `
            <div class="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80 mb-4">
                <p class="font-semibold text-slate-200 mb-3">${idx + 1}. ${item.text}</p>
                <div class="flex gap-4">
                    ${(item.choices || []).map(c => `
                        <label class="flex items-center gap-2 cursor-pointer text-sm text-slate-300 bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700 hover:border-indigo-400">
                            <input type="radio" name="ielts_r_${item.id}" value="${c}" class="ielts-radio text-indigo-500 focus:ring-indigo-400" />
                            <span>${c}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        return `
            <div class="split-container">
                <!-- Left Pane: Passage -->
                <div class="glass-card scrollable-pane">
                    <div class="flex items-center justify-between mb-4">
                        <span class="badge-ielts">IELTS READING PASSAGE</span>
                    </div>
                    <h2 class="text-xl font-bold text-white mb-4">${q.title}</h2>
                    <div class="text-slate-300 leading-relaxed space-y-4 font-serif text-lg select-text">
                        ${q.passage ? q.passage.replace(/\n\n/g, '</p><p class="mt-4">') : ''}
                    </div>
                </div>

                <!-- Right Pane: Questions -->
                <div class="glass-card scrollable-pane flex flex-col justify-between">
                    <div>
                        <h3 class="text-lg font-bold text-white mb-2">Questions</h3>
                        <p class="text-xs text-slate-400 mb-4">${q.prompt}</p>
                        ${questionsRightHtml}
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-slate-700/60 mt-4">
                        <button id="btn-prev-item" class="btn-secondary ${this.currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}">Previous Section</button>
                        <button id="btn-next-item" class="btn-primary">${this.currentIndex === this.questions.length - 1 ? 'Finish & Submit Exam' : 'Next Section'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWritingView(q) {
        const isTask1 = q.question_type === 'ielts_writing_task1';
        const targetWords = isTask1 ? 150 : 250;
        const existingText = (this.responses[q.id] && this.responses[q.id].textResponse) || '';

        return `
            <div class="split-container">
                <!-- Left Pane: Prompt & Graphic -->
                <div class="glass-card scrollable-pane">
                    <span class="badge-ielts mb-2 inline-block">${isTask1 ? 'WRITING TASK 1 (Min 150 words)' : 'WRITING TASK 2 (Min 250 words)'}</span>
                    <h2 class="text-xl font-bold text-white mb-4">${q.title}</h2>
                    <p class="text-slate-300 text-sm mb-4 leading-relaxed">${q.prompt}</p>
                    ${q.media_url ? `
                        <div class="my-4 flex justify-center">
                            <img src="${q.media_url}" alt="Task Graphic" class="rounded-xl border border-slate-700 max-h-72 object-contain shadow-lg" />
                        </div>
                    ` : ''}
                    ${q.passage ? `<div class="bg-slate-900/60 p-4 rounded-xl text-slate-300 text-sm">${q.passage}</div>` : ''}
                </div>

                <!-- Right Pane: Essay Editor -->
                <div class="glass-card scrollable-pane flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-sm font-semibold text-slate-300">Your Response Editor</span>
                            <div class="text-xs text-slate-400">Word Count: <span id="ielts-word-count" class="font-bold text-indigo-400">0</span> / ${targetWords} min</div>
                        </div>
                        <textarea id="ielts-writing-editor" rows="16" placeholder="Write your response here..." class="w-full bg-slate-900/90 text-slate-100 p-4 rounded-xl border border-slate-700 focus:border-indigo-400 focus:outline-none text-base leading-relaxed">${existingText}</textarea>
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-slate-700/60 mt-4">
                        <button id="btn-prev-item" class="btn-secondary ${this.currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}">Previous Section</button>
                        <button id="btn-next-item" class="btn-primary">${this.currentIndex === this.questions.length - 1 ? 'Finish & Submit Exam' : 'Next Section'}</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderListeningView(q) {
        const optionsList = q.options || [];

        return `
            <div class="glass-card p-6 max-w-4xl mx-auto">
                <span class="badge-ielts mb-2 inline-block">IELTS LISTENING MODULE</span>
                <h2 class="text-2xl font-bold text-white mb-2">${q.title}</h2>
                <p class="text-slate-300 text-sm mb-6">${q.prompt}</p>

                <div class="bg-slate-900/90 p-5 rounded-xl border border-slate-700 mb-6 flex items-center gap-4">
                    <span class="text-sm font-semibold text-indigo-400">Audio Track:</span>
                    <audio controls src="${q.media_url}" class="w-full h-10"></audio>
                </div>

                <div class="space-y-4 mb-6">
                    ${optionsList.map((item, idx) => `
                        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                            <label class="block text-sm font-medium text-slate-200 mb-2">${item.q}</label>
                            <input type="text" data-q="q${idx + 1}" class="ielts-listening-input w-full bg-slate-800 text-slate-100 p-2.5 rounded-lg border border-slate-700 focus:border-indigo-400 focus:outline-none" placeholder="Type answer here..." />
                        </div>
                    `).join('')}
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-slate-700/60">
                    <button id="btn-prev-item" class="btn-secondary ${this.currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}">Previous Section</button>
                    <button id="btn-next-item" class="btn-primary">${this.currentIndex === this.questions.length - 1 ? 'Finish & Submit Exam' : 'Next Section'}</button>
                </div>
            </div>
        `;
    }

    renderSpeakingView(q) {
        return `
            <div class="glass-card p-6 max-w-3xl mx-auto">
                <span class="badge-ielts mb-2 inline-block">IELTS SPEAKING PART 2 - CUE CARD</span>
                <h2 class="text-2xl font-bold text-white mb-4">${q.title}</h2>
                <div class="bg-slate-900/90 p-6 rounded-xl border border-indigo-500/30 mb-6 text-slate-200 text-base leading-relaxed whitespace-pre-line">
                    ${q.prompt}
                </div>

                <div class="bg-slate-900/90 p-6 rounded-xl border border-slate-700 text-center mb-6">
                    <div class="visualizer-container mb-4">
                        <canvas id="waveform-canvas" width="600" height="80" class="waveform-canvas"></canvas>
                    </div>

                    <div class="flex justify-center gap-4">
                        <button id="btn-start-record" class="btn-primary flex items-center gap-2">Start 2-Min Speaking Recording</button>
                        <button id="btn-stop-record" class="btn-danger flex items-center gap-2 hidden">Stop Recording</button>
                    </div>
                    <p id="recording-status" class="text-xs text-slate-400 mt-3">Status: Ready</p>
                </div>

                <div class="flex justify-between items-center pt-4 border-t border-slate-700/60">
                    <button id="btn-prev-item" class="btn-secondary ${this.currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : ''}">Previous Section</button>
                    <button id="btn-next-item" class="btn-primary">${this.currentIndex === this.questions.length - 1 ? 'Finish & Submit Exam' : 'Next Section'}</button>
                </div>
            </div>
        `;
    }

    bindEvents(q) {
        const prevBtn = document.getElementById('btn-prev-item');
        const nextBtn = document.getElementById('btn-next-item');

        if (prevBtn && this.currentIndex > 0) {
            prevBtn.addEventListener('click', () => {
                this.saveCurrentResponse(q);
                this.currentIndex--;
                this.renderQuestion();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.saveCurrentResponse(q);
                if (this.currentIndex === this.questions.length - 1) {
                    if (confirm("Are you sure you want to submit your IELTS Mock Test?")) {
                        this.submitTest();
                    }
                } else {
                    this.currentIndex++;
                    this.renderQuestion();
                }
            });
        }

        // Writing Editor Counter
        const editor = document.getElementById('ielts-writing-editor');
        const countBadge = document.getElementById('ielts-word-count');
        if (editor && countBadge) {
            const updateWordCount = () => {
                const count = editor.value.trim().split(/\s+/).filter(w => w.length > 0).length;
                countBadge.textContent = count;
            };
            editor.addEventListener('input', updateWordCount);
            updateWordCount();
        }

        // Speaking Recorder
        if (q.module === 'speaking') {
            const startBtn = document.getElementById('btn-start-record');
            const stopBtn = document.getElementById('btn-stop-record');
            const statusEl = document.getElementById('recording-status');
            const canvas = document.getElementById('waveform-canvas');

            if (startBtn) {
                startBtn.addEventListener('click', async () => {
                    startBtn.classList.add('hidden');
                    if (stopBtn) stopBtn.classList.remove('hidden');
                    if (statusEl) statusEl.textContent = "Status: Recording... Speak clearly into microphone.";

                    await window.audioRecorder.startRecording(canvas);
                });
            }

            if (stopBtn) {
                stopBtn.addEventListener('click', async () => {
                    stopBtn.classList.add('hidden');
                    if (statusEl) statusEl.textContent = "Status: Uploading audio response...";

                    const blob = await window.audioRecorder.stopRecording();
                    if (blob) {
                        const filePath = await window.audioRecorder.uploadAudio(blob);
                        if (filePath) {
                            this.responses[q.id] = {
                                questionId: q.id,
                                audioFilePath: filePath,
                                transcript: "IELTS Speaking response recorded."
                            };
                            if (statusEl) statusEl.textContent = "Status: Recording saved successfully ✓";
                        }
                    }
                });
            }
        }
    }

    saveCurrentResponse(q) {
        if (q.module === 'writing') {
            const editor = document.getElementById('ielts-writing-editor');
            if (editor) {
                this.responses[q.id] = {
                    questionId: q.id,
                    textResponse: editor.value
                };
            }
        } else if (q.module === 'reading') {
            const optionsList = q.options || [];
            const ansObj = {};
            optionsList.forEach(item => {
                const checked = document.querySelector(`input[name="ielts_r_${item.id}"]:checked`);
                if (checked) {
                    ansObj[item.id] = checked.value;
                }
            });
            this.responses[q.id] = {
                questionId: q.id,
                textResponse: JSON.stringify(ansObj)
            };
        } else if (q.module === 'listening') {
            const inputs = document.querySelectorAll('.ielts-listening-input');
            const ansObj = {};
            inputs.forEach(inp => {
                const key = inp.getAttribute('data-q');
                ansObj[key] = inp.value;
            });
            this.responses[q.id] = {
                questionId: q.id,
                textResponse: JSON.stringify(ansObj)
            };
        }
    }

    async submitTest() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const q = this.questions[this.currentIndex];
        if (q) this.saveCurrentResponse(q);

        const payload = {
            testId: this.test.id,
            studentName: "Candidate 101",
            responses: Object.values(this.responses)
        };

        try {
            const res = await fetch('/api/submit-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                window.appRouter.showScorecard(data.attemptId);
            } else {
                alert("Error submitting IELTS test: " + data.error);
            }
        } catch (err) {
            console.error("IELTS submission error:", err);
            alert("Failed to submit test attempt.");
        }
    }
}

window.ieltsEngine = new IELTSExamEngine();
