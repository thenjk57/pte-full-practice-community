/**
 * ============================================================================
 *  Pearson PTE Academic Official Test Center Exam Simulator Engine
 * ----------------------------------------------------------------------------
 *  Authentic test center interface & behaviors:
 *   • Pearson Navy top bar with live digital exam clock & [Hide Time] toggle.
 *   • Pearson Sub-header instruction box with exact prompt styling.
 *   • Recorded Answer box with preparation countdown, 880Hz audio beep cue,
 *     animated recording progress bar, and live mic input meter.
 *   • Audio Status box with single-play audio enforcement and volume slider.
 *   • Writing Word Processor with [Cut], [Copy], [Paste] buttons and Total Word Count.
 *   • Two-column Re-order Paragraphs layout with Source, Target, and directional buttons.
 *   • Fixed Pearson bottom footer with Item X of Y and Next button.
 *   • Official warning modal: "Once you leave this page, you cannot return."
 * ============================================================================
 */

const ITEM_TYPE_LABELS = {
    read_aloud: 'Read Aloud',
    repeat_sentence: 'Repeat Sentence',
    describe_image: 'Describe Image',
    retell_lecture: 'Re-tell Lecture',
    answer_short_question: 'Answer Short Question',
    summarize_written_text: 'Summarize Written Text',
    write_essay: 'Write Essay',
    mcma: 'Multiple Choice, Choose Multiple Answers',
    mcsa: 'Multiple Choice, Choose Single Answer',
    reorder_paragraphs: 'Re-order Paragraphs',
    reading_fill_blanks: 'Reading: Fill in the Blanks',
    rw_fill_blanks: 'Reading & Writing: Fill in the Blanks',
    summarize_spoken_text: 'Summarize Spoken Text',
    listening_fill_blanks: 'Listening: Fill in the Blanks',
    highlight_correct_summary: 'Highlight Correct Summary',
    highlight_missing_words: 'Highlight Missing Words',
    write_from_dictation: 'Write from Dictation'
};

const OFFICIAL_PEARSON_PROMPTS = {
    read_aloud: 'Look at the text below. In 35 seconds, you must read this text aloud as naturally and clearly as possible. You have 40 seconds to read aloud.',
    repeat_sentence: 'You will hear a sentence. Please repeat the sentence exactly as you hear it. You will hear the sentence only once.',
    describe_image: 'Look at the graph below. In 25 seconds, please speak into the microphone and describe in detail what the graph is showing. You will have 40 seconds to give your response.',
    retell_lecture: 'You will hear a lecture. After listening to the lecture, in 10 seconds, please speak into the microphone and retell what you have just heard from the lecture in your own words. You will have 40 seconds to give your response.',
    answer_short_question: 'You will hear a question. Please give a simple and short answer. Often just one or a few words is enough.',
    summarize_written_text: 'Read the passage below and summarize it using one sentence. Type your response in the box at the bottom of the screen. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points in the passage.',
    write_essay: 'You will have 20 minutes to plan, write and revise an essay about the topic below. Your response will be judged on how well you develop a position, organize your ideas, present supporting details, and control the elements of standard written English. You should write 200-300 words.',
    mcma: 'Read the text and answer the question by selecting all the correct responses. More than one response is correct.',
    mcsa: 'Read the text and answer the multiple-choice question by selecting the correct response. Only one response is correct.',
    reorder_paragraphs: 'The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel or use the arrow buttons.',
    reading_fill_blanks: 'In the text below some words are missing. Drag words from the box below to the appropriate place in the text. To undo an answer choice, drag the word back to the box below the text.',
    rw_fill_blanks: 'Below is a text with blanks. Click on each blank, a list of choices will appear. Select the appropriate answer choice for each blank.',
    summarize_spoken_text: 'You will hear a short lecture. Write a summary for a fellow student who was not present at the lecture. You should write 50-70 words. You have 10 minutes to finish this task. Your response will be judged on the quality of your writing and on how well your response presents the key points presented in the lecture.',
    listening_fill_blanks: 'You will hear a recording. Type the missing words in each blank.',
    highlight_correct_summary: 'You will hear a recording. Click on the paragraph that best relates to the recording.',
    highlight_missing_words: 'You will hear a recording. At the end of the recording the last word or group of words has been replaced by a beep. Select the correct option to complete the recording.',
    write_from_dictation: 'You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.'
};

class PTEExamEngine {
    constructor() {
        this.test = null;
        this.questions = [];
        this.currentIndex = 0;
        this.currentPart = 1;
        this.responses = {};        // questionId -> response payload
        this.itemStartedAt = 0;     // ms timestamp for time-spent analytics
        this.totalSeconds = 0;
        this.totalTimer = null;
        this.itemTimer = null;
        this.prepTimer = null;
        this.speakingTimer = null;
        this.audioState = null;     // { kind, utterance, audioEl, finished }
        this.recording = false;
        this.recordingPending = false;
        this.timeHidden = false;
        this.meterAnimFrame = null;
        this.selectedSourceBox = null;
        this.selectedTargetBox = null;
        this.inEquipmentCheck = false;
        this.selectedBankWord = null;
    }

    /* ------------------------------------------------------------ lifecycle */

    startTest(testData) {
        document.body.classList.add('pearson-mode');
        this.test = testData;
        this.questions = (testData.questions || []).slice()
            .sort((a, b) => (a.part - b.part) || (a.item_order - b.item_order));
        this.currentIndex = 0;
        this.currentPart = this.questions.length ? (this.questions[0].part || 1) : 1;
        this.responses = {};
        // The current PTE Academic full form has separately timed parts.
        // 78 + 25 + 32 = 135 minutes, within Pearson's published ranges.
        this.partBudgets = (testData.total_time_minutes || 0) >= 120
            ? { 1: 78 * 60, 2: 25 * 60, 3: 32 * 60 }
            : { 1: (testData.total_time_minutes || 35) * 60,
                2: (testData.total_time_minutes || 35) * 60,
                3: (testData.total_time_minutes || 35) * 60 };
        this.isFullMock = (testData.total_time_minutes || 0) >= 120;
        this.totalSeconds = this.partBudgets[this.currentPart];
        this.activeTimerPart = null;
        this.timeHidden = false;

        // Start with official Pearson VUE equipment check (headset & microphone)
        this.inEquipmentCheck = true;
        this.renderEquipmentCheck();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        }
    }

    renderEquipmentCheck() {
        const container = document.getElementById('exam-content-area');
        container.innerHTML = `
            <div class="pearson-exam-wrapper">
                <header class="pearson-header-bar">
                    <div class="pearson-brand-area">
                        <span class="pearson-logo-mark">PTE Practice</span>
                        <span class="pearson-logo-sep">|</span>
                        <span class="pearson-exam-name">PTE Academic</span>
                        <span class="pearson-candidate-tag">Independent practice &bull; not affiliated with Pearson</span>
                    </div>
                    <div class="pearson-section-title">Equipment Verification</div>
                    <div class="pearson-header-controls">
                        <button id="btn-toggle-fullscreen" class="pearson-btn-kiosk" type="button">⛶ Fullscreen</button>
                    </div>
                </header>

                <div class="pearson-instruction-panel">
                    <div class="pearson-item-type-title">Headset and Microphone Check</div>
                    <div class="pearson-item-prompt-text">
                        Please ensure your headset is worn comfortably with the microphone positioned approximately two finger widths away from your mouth.
                    </div>
                </div>

                <div class="pearson-content-body max-w-3xl py-8">
                    <div class="pearson-check-card">
                        <div class="pearson-check-step-title">Step 1: Headset Volume Check</div>
                        <p class="text-xs text-slate-600 mb-3">Click the button below to test your headphones. Ensure you can hear the sound clearly.</p>
                        <div class="flex items-center gap-4">
                            <button id="btn-test-sound" class="pearson-btn-kiosk px-4 py-2 text-sm bg-sky-900 hover:bg-sky-800 text-white font-semibold">
                                ▶ Play Test Sound
                            </button>
                            <div class="flex items-center gap-2 text-xs text-slate-700">
                                <span>Volume:</span>
                                <input type="range" id="check-vol-slider" min="0" max="1" step="0.05" value="1" class="h-1.5 w-28">
                            </div>
                        </div>
                    </div>

                    <div class="pearson-check-card">
                        <div class="pearson-check-step-title">Step 2: Microphone Check</div>
                        <p class="text-xs text-slate-600 mb-3">Click Record, say <em>"Testing my microphone for PTE Academic"</em>, and then click Play Recording to verify your audio input.</p>
                        <div class="flex flex-wrap items-center gap-3">
                            <button id="btn-test-mic-record" class="pearson-btn-kiosk px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white font-semibold">
                                🎙 Record Test (3s)
                            </button>
                            <button id="btn-test-mic-play" class="pearson-btn-kiosk px-4 py-2 text-sm bg-emerald-800 hover:bg-emerald-700 text-white font-semibold hidden">
                                ▶ Play Recording
                            </button>
                            <span id="test-mic-status" class="text-xs font-semibold text-slate-600">Microphone ready.</span>
                        </div>
                        <div class="pearson-meter-bar mt-3 max-w-md">
                            <div id="check-mic-fill" class="pearson-meter-bar-fill"></div>
                        </div>
                    </div>

                    <div class="mt-6 p-4 bg-slate-50 border border-slate-300 rounded text-sm text-slate-700">
                        <label class="flex items-center gap-3 cursor-pointer select-none">
                            <input type="checkbox" id="check-equip-confirm" class="w-4 h-4 accent-sky-700" checked>
                            <span class="font-semibold">My headset and microphone are functioning properly and I am ready to begin.</span>
                        </label>
                    </div>

                    <div class="mt-6 flex justify-end">
                        <button id="btn-start-exam-now" class="pearson-next-btn px-8 py-2.5 text-base">
                            Begin Part 1: Speaking &amp; Writing
                        </button>
                    </div>
                </div>

                <footer class="pearson-footer-bar">
                    <div class="pearson-item-progress-text">Pre-Exam Check</div>
                    <button id="btn-start-exam-footer" class="pearson-next-btn">Next</button>
                </footer>
            </div>
        `;

        const fsBtn = document.getElementById('btn-toggle-fullscreen');
        if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

        const testSoundBtn = document.getElementById('btn-test-sound');
        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => {
                this.playPearsonBeep();
                setTimeout(() => this.playPearsonBeep(), 280);
            });
        }

        let recordedBlob = null;
        const recBtn = document.getElementById('btn-test-mic-record');
        const playRecBtn = document.getElementById('btn-test-mic-play');
        const micStatus = document.getElementById('test-mic-status');
        const micFill = document.getElementById('check-mic-fill');

        if (recBtn) {
            recBtn.addEventListener('click', async () => {
                recBtn.disabled = true;
                micStatus.textContent = "Recording for 3 seconds... speak into your microphone.";
                micStatus.style.color = "#b91c1c";
                const ok = await window.audioRecorder.startRecording(null);
                if (!ok) {
                    micStatus.textContent = "Microphone error. Please check permissions — Speaking tasks will score as unrecorded.";
                    micStatus.style.color = "#b91c1c";
                    recBtn.disabled = false;
                    return;
                }

                // Animate meter during check
                let animFrame = null;
                if (window.audioRecorder && window.audioRecorder.analyser) {
                    const dataArray = new Uint8Array(window.audioRecorder.analyser.frequencyBinCount);
                    const update = () => {
                        window.audioRecorder.analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                        const avg = sum / dataArray.length;
                        if (micFill) micFill.style.width = Math.min(100, Math.round((avg / 128) * 100)) + '%';
                        animFrame = requestAnimationFrame(update);
                    };
                    update();
                }

                setTimeout(async () => {
                    if (animFrame) cancelAnimationFrame(animFrame);
                    if (micFill) micFill.style.width = '0%';
                    recordedBlob = await window.audioRecorder.stopRecording();
                    recBtn.disabled = false;
                    micStatus.textContent = "Recording complete! Click 'Play Recording' to verify.";
                    micStatus.style.color = "#15803d";
                    if (playRecBtn) playRecBtn.classList.remove('hidden');
                }, 3000);
            });
        }

        if (playRecBtn) {
            playRecBtn.addEventListener('click', () => {
                if (!recordedBlob) return;
                const audio = new Audio(URL.createObjectURL(recordedBlob));
                audio.play().catch(() => {});
            });
        }

        const proceed = () => {
            this.inEquipmentCheck = false;
            this.startExamTimer();
            this.renderQuestion();
        };

        const b1 = document.getElementById('btn-start-exam-now');
        const b2 = document.getElementById('btn-start-exam-footer');
        if (b1) b1.addEventListener('click', proceed);
        if (b2) b2.addEventListener('click', proceed);
    }

    clearItemTimers() {
        if (this.itemTimer) { clearInterval(this.itemTimer); this.itemTimer = null; }
        if (this.prepTimer) { clearInterval(this.prepTimer); this.prepTimer = null; }
        if (this.speakingTimer) { clearInterval(this.speakingTimer); this.speakingTimer = null; }
        if (this.meterAnimFrame) { cancelAnimationFrame(this.meterAnimFrame); this.meterAnimFrame = null; }
        if (this.silenceCutoffHandler) {
            window.removeEventListener('pte:silence-cutoff', this.silenceCutoffHandler);
            this.silenceCutoffHandler = null;
        }
    }

    clearAllTimers() {
        if (this.totalTimer) { clearInterval(this.totalTimer); this.totalTimer = null; }
        this.clearItemTimers();
    }

    stopAudio() {
        // Invalidate every pending auto-start timer and audio event callback
        // captured by the item we are navigating away from.
        this._audioGen = (this._audioGen || 0) + 1;
        if (!this.audioState) return;
        try {
            if (this.audioState.kind === 'speech') {
                window.speechSynthesis && window.speechSynthesis.cancel();
            } else if (this.audioState.audioEl) {
                this.audioState.audioEl.pause();
                this.audioState.audioEl.currentTime = 0;
            }
        } catch (e) { /* ignore */ }
        this.audioState = null;
    }

    playPearsonBeep() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // Standard 880Hz Pearson test beep
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {
            console.warn('Audio cue failed:', e);
        }
    }

    startExamTimer() {
        if (this.totalTimer) clearInterval(this.totalTimer);
        if (this.activeTimerPart == null || (this.isFullMock && this.activeTimerPart !== this.currentPart)) {
            this.totalSeconds = this.partBudgets[this.currentPart] || 0;
            this.activeTimerPart = this.currentPart;
        }
        const tick = async () => {
            this.totalSeconds--;
            if (this.totalSeconds <= 0) {
                this.clearAllTimers();
                if (this.recording) await this.endRecording(this.questions[this.currentIndex]);
                const current = this.questions[this.currentIndex];
                if (current) this.saveCurrentResponse(current);
                const next = this.questions.findIndex((q, i) => i > this.currentIndex && (q.part || 1) > this.currentPart);
                if (next < 0) {
                    this.submitTest();
                } else {
                    this.currentIndex = next;
                    this.renderQuestion();
                }
                return;
            }
            this.updateExamTimerDisplay();
        };
        this.totalTimer = setInterval(tick, 1000);
        this.updateExamTimerDisplay();
    }

    updateExamTimerDisplay() {
        const timerEl = document.getElementById('pearson-exam-timer');
        if (timerEl) {
            if (this.isStandaloneTimed && this.standaloneTimeLeft != null) {
                timerEl.textContent = this.fmtExamTime(this.standaloneTimeLeft);
            } else {
                timerEl.textContent = this.fmtExamTime(this.totalSeconds);
            }
            timerEl.style.display = this.timeHidden ? 'none' : 'inline';
        }
    }

    toggleTimeVisibility() {
        this.timeHidden = !this.timeHidden;
        const btn = document.getElementById('btn-toggle-time');
        if (btn) btn.textContent = this.timeHidden ? 'Show Time' : 'Hide Time';
        this.updateExamTimerDisplay();
    }

    /* ------------------------------------------------------- item rendering */

    renderQuestion() {
        this._recordGen = (this._recordGen || 0) + 1;
        this.clearItemTimers();
        this.stopAudio();
        this.recording = false;
        this.selectedSourceBox = null;
        this.selectedTargetBox = null;

        const q = this.questions[this.currentIndex];
        if (!q) { this.submitTest(); return; }

        this.itemStartedAt = Date.now();
        const part = q.part || 1;

        // Section transition break
        if (part !== this.currentPart) {
            if (this.totalTimer) { clearInterval(this.totalTimer); this.totalTimer = null; }
            this.currentPart = part;
            if (this.isFullMock) {
                this.totalSeconds = this.partBudgets[part];
                this.activeTimerPart = null;
            }
            this.renderPartBreak(part);
            return;
        }

        if (!this.totalTimer) this.startExamTimer();
        this.renderItem(q);
    }

    renderPartBreak(part) {
        const container = document.getElementById('exam-content-area');
        const items = this.questions.filter(x => (x.part || 1) === part);
        const title = items[0] ? items[0].part_title : `Part ${part}`;
        const minutes = Math.round(this.partBudgets[part] / 60);

        container.innerHTML = `
            <div class="pearson-exam-wrapper">
                <header class="pearson-header-bar">
                    <div class="pearson-brand-area">
                        <span class="pearson-logo-mark">PTE Practice</span>
                        <span class="pearson-logo-sep">|</span>
                        <span class="pearson-exam-name">PTE Academic</span>
                        <span class="pearson-candidate-tag">Independent practice &bull; not affiliated with Pearson</span>
                    </div>
                    <div class="pearson-section-title">${title}</div>
                    <div class="pearson-header-controls">
                        <button id="btn-toggle-fullscreen" class="pearson-btn-kiosk" type="button">⛶ Fullscreen</button>
                        <div class="pearson-timer-box">
                            <span>Time Remaining:</span>
                            <span id="pearson-exam-timer" class="pearson-exam-timer-digits">${this.fmtExamTime(this.totalSeconds)}</span>
                            <button id="btn-toggle-time" class="pearson-btn-kiosk" type="button">${this.timeHidden ? 'Show Time' : 'Hide Time'}</button>
                        </div>
                    </div>
                </header>

                <div class="pearson-instruction-panel">
                    <div class="pearson-item-type-title">Section Introduction</div>
                    <div class="pearson-item-prompt-text">Please review the instructions for this section carefully before proceeding.</div>
                </div>

                <div class="pearson-content-body max-w-3xl text-center py-10">
                    <h2 class="text-2xl font-bold text-slate-800 mb-2">${title}</h2>
                    <p class="text-slate-600 text-sm mb-6">${items.length} items &bull; allocated time: approximately ${minutes} minutes</p>
                    <div class="bg-slate-50 border border-slate-300 p-6 rounded text-left text-sm text-slate-700 leading-relaxed space-y-3 mb-8">
                        ${part === 3 ? `
                            <p><strong>Part 3: Listening Instructions:</strong></p>
                            <p>&bull; Audio stimuli will play <strong>only once</strong>.</p>
                            <p>&bull; You cannot pause, replay, or rewind the recording once it starts.</p>
                            <p>&bull; Take notes on your erasable booklet as you listen.</p>
                            <p>&bull; Summarize Spoken Text has an independent 10-minute timer per task.</p>
                        ` : part === 2 ? `
                            <p><strong>Part 2: Reading Instructions:</strong></p>
                            <p>&bull; This section contains multiple item types including Fill in the Blanks and Re-order Paragraphs.</p>
                            <p>&bull; Once you click <strong>Next</strong> and confirm, you cannot return to a previous item.</p>
                            <p>&bull; Manage your time carefully across all reading items.</p>
                        ` : `
                            <p><strong>Part 1: Speaking &amp; Writing Instructions:</strong></p>
                            <p>&bull; Speak clearly into your headset microphone after the preparation countdown and audio tone.</p>
                            <p>&bull; If you remain silent for more than 3 seconds after the beep, the recording will stop automatically.</p>
                            <p>&bull; Writing items (Summarize Written Text: 10 mins, Write Essay: 20 mins) have strict individual timers.</p>
                        `}
                    </div>
                    <button id="btn-start-part" class="pearson-next-btn px-10 py-2.5 text-base">Begin ${title}</button>
                </div>

                <footer class="pearson-footer-bar">
                    <div class="pearson-item-progress-text">Section Transition</div>
                    <button id="btn-start-part-footer" class="pearson-next-btn">Next</button>
                </footer>
            </div>`;

        const fsBtn = document.getElementById('btn-toggle-fullscreen');
        if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

        const startPart = () => {
            this.startExamTimer();
            this.renderItem(this.questions[this.currentIndex]);
        };
        const b1 = document.getElementById('btn-start-part');
        const b2 = document.getElementById('btn-start-part-footer');
        if (b1) b1.addEventListener('click', startPart);
        if (b2) b2.addEventListener('click', startPart);

        const timeBtn = document.getElementById('btn-toggle-time');
        if (timeBtn) timeBtn.addEventListener('click', () => this.toggleTimeVisibility());

        this.updateExamTimerDisplay();
    }

    renderItem(q) {
        const container = document.getElementById('exam-content-area');
        const typeLabel = ITEM_TYPE_LABELS[q.question_type] || q.question_type;
        const isAudio = q.audio_play_policy === 'once' && !!q.media_url;
        const isSpeaking = q.module === 'speaking';
        const partTitle = q.part_title || (q.part === 1 ? 'Part 1: Speaking & Writing' : q.part === 2 ? 'Part 2: Reading' : 'Part 3: Listening');
        // A stored prompt may contain the actual essay topic or MCQ question.
        // Generic type instructions must never replace that item-specific text.
        const promptText = q.prompt || OFFICIAL_PEARSON_PROMPTS[q.question_type] || '';

        let html = `
            <div class="pearson-exam-wrapper">
                <!-- 1. Top Pearson Header Bar -->
                <header class="pearson-header-bar">
                    <div class="pearson-brand-area">
                        <span class="pearson-logo-mark">PTE Practice</span>
                        <span class="pearson-logo-sep">|</span>
                        <span class="pearson-exam-name">PTE Academic</span>
                        <span class="pearson-candidate-tag">Independent practice &bull; not affiliated with Pearson</span>
                    </div>
                    <div class="pearson-section-title">${partTitle}</div>
                    <div class="pearson-header-controls">
                        <button id="btn-toggle-fullscreen" class="pearson-btn-kiosk" type="button">⛶ Fullscreen</button>
                        <div class="pearson-timer-box">
                            <span id="pearson-time-label">Time Remaining:</span>
                            <span id="pearson-exam-timer" class="pearson-exam-timer-digits">${this.fmtExamTime(this.totalSeconds)}</span>
                            <button id="btn-toggle-time" class="pearson-btn-kiosk" type="button">${this.timeHidden ? 'Show Time' : 'Hide Time'}</button>
                        </div>
                    </div>
                </header>

                <!-- 2. Pearson Sub-Header / Item Instruction Panel -->
                <div class="pearson-instruction-panel">
                    <div class="pearson-item-type-title">${typeLabel}</div>
                    <div class="pearson-item-prompt-text">${this.esc(promptText)}</div>
                </div>

                <!-- 3. Pearson Test Canvas Body -->
                <main class="pearson-content-body">
        `;

        // Visible Stimulus Passage
        if (q.passage && q.question_type !== 'reorder_paragraphs') {
            html += `<div class="pearson-passage-box">${this.renderPassage(q)}</div>`;
        }

        // Describe Image Graphic
        if (q.question_type === 'describe_image') {
            html += `<div class="my-4 flex justify-center">${this.renderChart(safeParseLocal(q.options))}</div>`;
        }

        // Audio Status Widget (Listening stimulus / RS / RL)
        if (isAudio) {
            html += `
                <div class="pearson-box max-w-md mx-auto">
                    <div class="pearson-box-header">Audio Status</div>
                    <div class="pearson-box-content">
                        <div id="audio-status" class="pearson-status-text">Current status: <strong>Preparing audio...</strong></div>
                        <div class="pearson-progress-bar-container mb-3">
                            <div id="audio-progress-bar" class="pearson-progress-bar-fill"></div>
                        </div>
                        <div class="flex justify-between items-center text-xs text-slate-600">
                            <button id="btn-play-once" class="pearson-btn-kiosk hidden">▶ Play Audio</button>
                            <div class="flex items-center gap-2 ml-auto">
                                <span>Volume:</span>
                                <input type="range" id="pearson-vol-slider" min="0" max="1" step="0.05" value="1" class="h-1.5 w-24">
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        // Recorded Answer Widget (Speaking tasks)
        if (isSpeaking) {
            const initialStatus = isAudio
                ? 'Current status: <strong>Playing audio stimulus...</strong>'
                : `Current status: <strong>Beginning in <span id="prep-seconds">${q.prep_seconds || 0}</span> seconds.</strong>`;
            const recordLimit = (parseInt(q.time_limit_seconds, 10) > 0) ? parseInt(q.time_limit_seconds, 10) : 40;
            html += `
                <div class="pearson-box max-w-md mx-auto">
                    <div class="pearson-box-header flex justify-between items-center">
                        <span>Recorded Answer</span>
                        <span id="pearson-recording-header-timer" class="text-xs font-semibold text-red-600 hidden">Time Remaining: <span id="recording-header-seconds">${recordLimit}</span>s</span>
                    </div>
                    <div class="pearson-box-content">
                        <div id="pearson-recording-status" class="pearson-status-text">
                            ${initialStatus}
                        </div>
                        <div class="pearson-progress-bar-container mb-2">
                            <div id="pearson-speaking-progress" class="pearson-progress-bar-fill"></div>
                        </div>
                        <div class="pearson-mic-meter-container">
                            <span>Microphone Level:</span>
                            <div class="pearson-meter-bar">
                                <div id="pearson-mic-level-fill" class="pearson-meter-bar-fill"></div>
                            </div>
                            <canvas id="waveform-canvas" width="100" height="20" class="hidden"></canvas>
                        </div>
                        <div class="flex justify-end mt-3 gap-2">
                            <button id="btn-start-record" class="pearson-btn-kiosk hidden">Start Recording</button>
                            <button id="btn-stop-record" class="pearson-btn-kiosk hidden" style="background:#b91c1c;color:#ffffff;border-color:#991b1b;">Stop Recording</button>
                        </div>
                        <div class="text-[11px] text-slate-500 mt-2.5 text-center italic border-t border-slate-200 pt-2">
                            * Note: In the real PTE exam, only the blue progress bar is displayed (numerical countdown is not shown).
                        </div>
                    </div>
                </div>`;
        }

        // Response Area for Writing / Reorder / MCQs
        html += this.renderResponseArea(q);

        html += `
                </main>

                <!-- 4. Pearson Fixed Bottom Bar -->
                <footer class="pearson-footer-bar">
                    <div class="pearson-item-progress-text">
                        Item ${this.currentIndex + 1} of ${this.questions.length}
                    </div>
                    <button id="btn-next-item" class="pearson-next-btn">Next</button>
                </footer>
            </div>`;

        container.innerHTML = html;
        this.updateExamTimerDisplay();

        this.bindItemEvents(q);
        this.startItemTimer(q);

        if (isAudio) this.startSinglePlayAudio(q);
        else if (isSpeaking) this.startSpeakingPrep(q);
    }

    renderPassage(q) {
        const type = q.question_type;
        if (type === 'rw_fill_blanks' || type === 'highlight_missing_words') {
            return this.passageWithDropdowns(q);
        }
        if (type === 'reading_fill_blanks') {
            return this.passageWithDragAndDrop(q);
        }
        if (type === 'listening_fill_blanks') {
            return this.passageWithTextInputs(q);
        }
        return (q.passage || '').replace(/\n/g, '<br><br>');
    }

    passageWithDragAndDrop(q) {
        let html = q.passage || '';
        const opts = safeParseLocal(q.options) || {};
        const bank = opts.bank || [];
        const existing = this.responses[q.id] || {};
        const savedAnswers = existing.textResponse ? safeParseLocal(existing.textResponse) || {} : {};
        const usedWords = new Set(Object.values(savedAnswers).filter(Boolean));

        html = html.replace(/\[(blank\d+)\]/g, (m, key) => {
            const val = savedAnswers[key] || '';
            const filledClass = val ? 'filled' : '';
            return `<span class="pearson-fib-dropzone ${filledClass}" data-blank="${key}" data-value="${this.esc(val)}">${this.esc(val || '[ Click or drop word ]')}</span>`;
        });

        html += `
            <div class="pearson-word-bank-box">
                <div class="pearson-word-bank-header">Word Bank (drag word to blank or click word then blank)</div>
                <div class="pearson-word-bank-list" id="fib-word-bank">
                    ${bank.map(w => `<span class="pearson-bank-word ${usedWords.has(w) ? 'used' : ''}" draggable="true" data-word="${this.esc(w)}">${this.esc(w)}</span>`).join('')}
                </div>
            </div>
        `;
        return html;
    }

    passageWithDropdowns(q) {
        let html = q.passage || '';
        const opts = safeParseLocal(q.options) || {};
        const existing = this.responses[q.id] || {};
        const savedAnswers = existing.textResponse ? safeParseLocal(existing.textResponse) || {} : {};

        for (const [key, choices] of Object.entries(opts)) {
            if (!Array.isArray(choices)) continue;
            const currentVal = savedAnswers[key] || '';
            const sel = `<select data-blank="${key}" class="pearson-blank-select">
                    <option value="">— Select —</option>
                    ${choices.map(c => `<option value="${this.esc(c)}" ${c === currentVal ? 'selected' : ''}>${this.esc(c)}</option>`).join('')}
                </select>`;
            html = html.replace(`[${key}]`, sel);
        }
        return html;
    }

    passageWithTextInputs(q) {
        let html = q.passage || '';
        const existing = this.responses[q.id] || {};
        const savedAnswers = existing.textResponse ? safeParseLocal(existing.textResponse) || {} : {};

        html = html.replace(/\[(blank\d+)\]/g, (m, key) => {
            const val = savedAnswers[key] || '';
            return `<input data-blank="${key}" type="text" autocomplete="off" spellcheck="false"
                placeholder="type word" value="${this.esc(val)}"
                class="pearson-blank-input" />`;
        });
        return html;
    }

    renderResponseArea(q) {
        const type = q.question_type;
        const existing = this.responses[q.id] || {};
        const opts = safeParseLocal(q.options) || {};

        // Writing / Dictation / Summary — Pearson Word Processor
        if (type === 'write_essay' || type === 'summarize_written_text' ||
            type === 'summarize_spoken_text' || type === 'write_from_dictation') {
            const hint = type === 'write_essay' ? 'Required: 200–300 words'
                : type === 'summarize_written_text' ? 'Required: ONE single sentence, 5–75 words'
                : type === 'summarize_spoken_text' ? 'Required: 50–70 words'
                : 'Type the sentence exactly as you heard it';
            return `
                <div class="mt-4">
                    <div class="pearson-toolbar">
                        <button type="button" id="btn-editor-cut" class="pearson-toolbar-btn">Cut</button>
                        <button type="button" id="btn-editor-copy" class="pearson-toolbar-btn">Copy</button>
                        <button type="button" id="btn-editor-paste" class="pearson-toolbar-btn">Paste</button>
                    </div>
                    <textarea id="pte-text-input" rows="${type === 'write_essay' ? 14 : 7}"
                        placeholder="Type your response here..."
                        spellcheck="false" autocorrect="off" autocapitalize="off"
                        class="pearson-editor-textarea">${this.esc(existing.textResponse || '')}</textarea>
                    <div class="pearson-word-count-row">
                        <span>${hint}</span>
                        <div>Total Word Count: <span id="word-count-badge" class="font-bold text-slate-900">0</span></div>
                    </div>
                </div>`;
        }

        // Two-Column Re-order Paragraphs (Source / Target)
        if (type === 'reorder_paragraphs') {
            const rawBoxes = opts.boxes || ['A', 'B', 'C', 'D'];
            const boxes = rawBoxes.map(box => typeof box === 'object' ? box.id : box);
            const lines = {};
            rawBoxes.forEach(box => {
                if (box && typeof box === 'object' && box.id) lines[box.id] = box.text || '';
            });
            (q.passage || '').split('\n').forEach(line => {
                const m = line.match(/^\s*([A-D])\)\s*(.*)$/);
                if (m) lines[m[1]] = m[2];
            });

            // Restore previous or initialize source with boxes
            const savedTarget = existing.textResponse ? existing.textResponse.split(',').filter(Boolean) : [];
            const sourceBoxes = boxes.filter(b => !savedTarget.includes(b));

            return `
                <div class="mt-4">
                    <p class="text-xs text-slate-600 mb-2">The text boxes in the left panel have been placed in a random order. Restore the original order by dragging the text boxes from the left panel to the right panel or use the arrow buttons.</p>
                    <div class="pearson-reorder-grid">
                        <!-- Source Column -->
                        <div class="pearson-reorder-column">
                            <div class="pearson-reorder-header">Source</div>
                            <div id="reorder-source-list" class="pearson-reorder-list">
                                ${sourceBoxes.map(id => `
                                    <div class="pearson-reorder-item" draggable="true" data-box="${id}">
                                        <strong>[${id}]</strong> ${this.esc(lines[id] || '')}
                                    </div>`).join('')}
                            </div>
                        </div>

                        <!-- Directional Buttons -->
                        <div class="pearson-reorder-controls">
                            <button type="button" id="btn-move-target" class="pearson-ctrl-btn" title="Move to Target">&gt;</button>
                            <button type="button" id="btn-move-source" class="pearson-ctrl-btn" title="Move back to Source">&lt;</button>
                            <button type="button" id="btn-move-up" class="pearson-ctrl-btn" title="Move Up">&blacktriangle;</button>
                            <button type="button" id="btn-move-down" class="pearson-ctrl-btn" title="Move Down">&blacktriangledown;</button>
                        </div>

                        <!-- Target Column -->
                        <div class="pearson-reorder-column">
                            <div class="pearson-reorder-header">Target</div>
                            <div id="reorder-target-list" class="pearson-reorder-list">
                                ${savedTarget.map(id => `
                                    <div class="pearson-reorder-item" draggable="true" data-box="${id}">
                                        <strong>[${id}]</strong> ${this.esc(lines[id] || '')}
                                    </div>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>`;
        }

        // Multiple choice. Highlight Correct Summary uses the identical
        // { choices: [{label, text}] } shape and is single-answer, so it must
        // render radio controls too — otherwise the item plays its audio and
        // gives the candidate no way to respond.
        if (type === 'mcma' || type === 'mcsa' || type === 'highlight_correct_summary') {
            const multi = type === 'mcma';
            const selected = new Set(
                existing.textResponse ? JSON.parse(existing.textResponse) : []);
            return `
                <div class="mt-4">
                    <p class="text-xs font-semibold text-slate-600 mb-3">${multi ? 'Select all correct options. (More than one option is correct).' : 'Select the ONE correct option.'}</p>
                    ${(opts.choices || []).map(c => `
                        <label class="pearson-mcq-option">
                            <input type="${multi ? 'checkbox' : 'radio'}" name="mcq" value="${this.esc(c.label)}"
                                class="mcq-input" ${selected.has(c.label) ? 'checked' : ''}>
                            <span class="text-sm text-slate-800 leading-relaxed"><strong>${c.label}.</strong> ${this.esc(c.text)}</span>
                        </label>`).join('')}
                </div>`;
        }

        return '';
    }

    /* ------------------------------------------------------------- timers */

    startItemTimer(q) {
        // In Pearson PTE Academic:
        // Standalone per-item timers apply ONLY to individual writing tasks:
        // Summarize Written Text (10m), Write Essay (20m), and Summarize Spoken Text (10m).
        // Speaking items are strictly controlled by preparation countdown + speakingTimer (full recording duration).
        // Reading and remaining Listening items share the overall section exam timer.
        this.isStandaloneTimed = ['summarize_written_text', 'write_essay', 'summarize_spoken_text'].includes(q.question_type);

        if (!this.isStandaloneTimed || !q.time_limit_seconds) {
            this.standaloneTimeLeft = null;
            return;
        }

        if (this.itemTimer) clearInterval(this.itemTimer);
        this.standaloneTimeLeft = q.time_limit_seconds;
        this.updateExamTimerDisplay();

        this.itemTimer = setInterval(() => {
            this.standaloneTimeLeft--;
            this.updateExamTimerDisplay();

            if (this.standaloneTimeLeft <= 0) {
                clearInterval(this.itemTimer);
                this.itemTimer = null;
                this.stopAudio();
                // Advance or finish automatically on strict time expiration
                this.saveCurrentResponse(q);
                if (this.currentIndex === this.questions.length - 1) {
                    this.submitTest();
                } else {
                    this.currentIndex++;
                    this.renderQuestion();
                }
            }
        }, 1000);
    }

    /* ---------------------------------------------- single-play audio core */

    startSinglePlayAudio(q) {
        const statusEl = document.getElementById('audio-status');
        const bar = document.getElementById('audio-progress-bar');
        const playBtn = document.getElementById('btn-play-once');
        const volSlider = document.getElementById('pearson-vol-slider');
        const url = q.media_url || '';
        const speakingItem = q.module === 'speaking';

        // Owner token for this render. The 500ms auto-start timer and the
        // ended/error callbacks below capture `gen` and must no-op once the
        // user has advanced. Without this, an old item's pending timer reads
        // the NEW item's audioState (guard passes), plays the OLD item's url
        // against it and marks the new state played — so the new item's own
        // timer then returns early and its audio never plays at all.
        const gen = (this._audioGen = (this._audioGen || 0) + 1);
        const isCurrent = () => this._audioGen === gen;

        const finish = () => {
            if (!isCurrent()) return;
            this.audioState = { finished: true };
            // Re-query at write time: if the item re-rendered while the file was
            // playing, the refs captured above point at detached nodes and the
            // "Completed" status / 100% bar would silently never appear
            // (observed once on an ASQ item). Fall back to the captured refs.
            const st = document.getElementById('audio-status') || statusEl;
            const pb = document.getElementById('audio-progress-bar') || bar;
            const btn = document.getElementById('btn-play-once') || playBtn;
            if (pb) pb.style.width = '100%';
            if (st) {
                st.innerHTML = 'Current status: <strong>Completed</strong>';
            }
            if (btn) btn.classList.add('hidden');
            if (speakingItem) {
                // If the item has prep seconds (e.g. Retell Lecture = 10s), start prep countdown.
                // Otherwise (e.g. Repeat Sentence, Answer Short Question), give a short pause, play beep, and record.
                if (q.prep_seconds && q.prep_seconds > 0) {
                    this.startSpeakingPrep(q);
                } else {
                    setTimeout(() => {
                        if (!isCurrent()) return; // advanced to another item during the pause
                        if (q.question_type !== 'answer_short_question') this.playPearsonBeep();
                        this.beginRecording(q);
                    }, 500);
                }
            }
        };

        const fail = (msg) => {
            if (!isCurrent()) return;
            if (this.audioState) {
                this.audioState.played = false;
                if (this.audioState.audioEl) {
                    this.audioState.audioEl.pause();
                    this.audioState.audioEl = null;
                }
            }
            const st = document.getElementById('audio-status') || statusEl;
            const btn = document.getElementById('btn-play-once') || playBtn;
            if (st) st.innerHTML = `<span class="text-red-600">${msg}</span>`;
            if (btn) btn.classList.remove('hidden');
        };

        this.audioState = { kind: null, finished: false, played: false };

        const begin = () => {
            if (!isCurrent() || !this.audioState || this.audioState.played) return;
            this.audioState.played = true;
            if (playBtn) playBtn.classList.add('hidden');
            const stNow = document.getElementById('audio-status') || statusEl;
            if (stNow) stNow.innerHTML = 'Current status: <strong>Playing</strong>';

            if (url.startsWith('tts://')) {
                this.speakOnce(decodeURIComponent(url.slice(6)), finish, fail, bar);
            } else {
                this.playFileOnce(url, finish, fail, bar);
            }

            if (volSlider && this.audioState.audioEl) {
                volSlider.addEventListener('input', (e) => {
                    if (this.audioState.audioEl) this.audioState.audioEl.volume = parseFloat(e.target.value);
                });
            }
        };

        this.audioState.begin = begin;
        if (playBtn) playBtn.addEventListener('click', begin);

        setTimeout(() => {
            if (isCurrent() && this.audioState && !this.audioState.played) begin();
        }, 500);
    }

    speakOnce(text, onFinish, onFail, bar) {
        if (!('speechSynthesis' in window)) {
            onFail('Speech unavailable. Click “Play Audio”.');
            return;
        }
        try {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.95;
            u.lang = 'en-GB';

            const voices = window.speechSynthesis.getVoices() || [];
            const preferred = voices.find(v => /en-GB/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
            if (preferred) u.voice = preferred;

            let progressTimer = null;
            u.onstart = () => {
                const estMs = Math.max(1200, text.split(/\s+/).length * 380);
                const started = Date.now();
                progressTimer = setInterval(() => {
                    if (!bar) return;
                    const pct = Math.min(98, ((Date.now() - started) / estMs) * 100);
                    bar.style.width = pct + '%';
                }, 120);
            };
            u.onend = () => {
                if (progressTimer) clearInterval(progressTimer);
                onFinish();
            };
            u.onerror = () => {
                if (progressTimer) clearInterval(progressTimer);
                onFail('Speech playback failed. Click “Play Audio”.');
                this.audioState.played = false;
            };

            this.audioState.kind = 'speech';
            this.audioState.utterance = u;
            window.speechSynthesis.speak(u);
        } catch (e) {
            onFail('Speech playback unavailable.');
        }
    }

    playFileOnce(url, onFinish, onFail, bar) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audioState.kind = 'file';
        this.audioState.audioEl = audio;

        audio.addEventListener('timeupdate', () => {
            if (bar && audio.duration) {
                bar.style.width = Math.min(100, (audio.currentTime / audio.duration) * 100) + '%';
            }
        });
        audio.addEventListener('ended', onFinish);
        audio.addEventListener('error', () => onFail('Audio failed to load. Click “Play Audio” to retry.'));
        audio.play().catch(() => onFail('Autoplay was blocked. Click “Play Audio” to listen.'));
    }

    /* --------------------------------------------------- speaking controls */

    startSpeakingPrep(q) {
        let left = q.prep_seconds || 0;
        const prepEl = document.getElementById('prep-seconds');
        const statusEl = document.getElementById('pearson-recording-status');
        if (prepEl) prepEl.textContent = left;
        if (statusEl) statusEl.innerHTML = `Current status: <strong>Beginning in <span id="prep-seconds">${left}</span> seconds.</strong>`;

        if (left <= 0) {
            this.playPearsonBeep();
            this.beginRecording(q);
            return;
        }

        if (this.prepTimer) clearInterval(this.prepTimer);
        this.prepTimer = setInterval(() => {
            left--;
            const pEl = document.getElementById('prep-seconds');
            if (pEl) pEl.textContent = Math.max(0, left);
            if (left <= 0) {
                clearInterval(this.prepTimer);
                this.prepTimer = null;
                // Play authentic Pearson beep sound!
                this.playPearsonBeep();
                this.beginRecording(q);
            }
        }, 1000);
    }

    enableSpeakingRecord(q) {
        const startBtn = document.getElementById('btn-start-record');
        if (startBtn) startBtn.classList.remove('hidden');
    }

    autoStartRecording(q) {
        this.beginRecording(q);
    }

    async beginRecording(q) {
        if (this.recording || this.recordingPending) return;
        this.recordingPending = true;
        const recordGen = this._recordGen;
        const startBtn = document.getElementById('btn-start-record');
        const stopBtn = document.getElementById('btn-stop-record');
        const statusEl = document.getElementById('pearson-recording-status');
        const progressBar = document.getElementById('pearson-speaking-progress');
        const canvas = document.getElementById('waveform-canvas');
        const headerTimer = document.getElementById('pearson-recording-header-timer');
        const headerSecEl = document.getElementById('recording-header-seconds');

        if (this.prepTimer) { clearInterval(this.prepTimer); this.prepTimer = null; }
        if (startBtn) startBtn.classList.add('hidden');
        if (stopBtn) { stopBtn.classList.remove('hidden'); stopBtn.disabled = true; }

        // Dynamic time limit from question, not hardcoded
        const timeLimit = q.question_type === 'repeat_sentence' ? 15
            : q.question_type === 'answer_short_question' ? 10
            : (parseInt(q.time_limit_seconds, 10) > 0) ? parseInt(q.time_limit_seconds, 10) : 40;
        const totalDuration = timeLimit * 1000;

        if (headerTimer) {
            if (headerSecEl) headerSecEl.textContent = timeLimit;
            headerTimer.classList.remove('hidden');
        }
        if (statusEl) {
            statusEl.innerHTML = `Current status: <strong style="color:#b91c1c;">Recording (<span id="recording-seconds">${timeLimit}</span>s remaining)</strong>`;
        }

        const ok = await window.audioRecorder.startRecording(canvas);
        this.recordingPending = false;
        if (recordGen !== this._recordGen) {
            if (ok) await window.audioRecorder.stopRecording();
            return;
        }
        if (!ok) {
            // No capture ever started: the controls were already flipped to the
            // "Recording" state above, so put them back — otherwise the button
            // reads "Stop Recording" while nothing is recording.
            this.recording = false;
            if (headerTimer) headerTimer.classList.add('hidden');
            if (stopBtn) stopBtn.classList.add('hidden');
            if (startBtn) startBtn.classList.remove('hidden');
            if (statusEl) statusEl.innerHTML = 'Current status: <span class="text-red-600">Microphone unavailable</span>';
            return;
        }
        this.recording = true;
        this.recordStartedAt = Date.now();
        if (stopBtn) stopBtn.disabled = false;

        this.silenceCutoffHandler = () => {
            if (this.recording) this.endRecording(q);
        };
        window.addEventListener('pte:silence-cutoff', this.silenceCutoffHandler, { once: true });

        // Animate the solid Pearson blue progress bar and countdown timer during recording window
        const started = Date.now();
        if (this.speakingTimer) clearInterval(this.speakingTimer);
        this.speakingTimer = setInterval(() => {
            if (!this.recording) { clearInterval(this.speakingTimer); return; }
            const elapsed = Date.now() - started;
            const pct = Math.min(100, (elapsed / totalDuration) * 100);
            if (progressBar) progressBar.style.width = pct + '%';

            const remainingMs = Math.max(0, totalDuration - elapsed);
            const remainingSec = Math.ceil(remainingMs / 1000);

            const secEl = document.getElementById('recording-seconds');
            if (secEl && secEl.textContent !== String(remainingSec)) {
                secEl.textContent = remainingSec;
            }
            const hSecEl = document.getElementById('recording-header-seconds');
            if (hSecEl && hSecEl.textContent !== String(remainingSec)) {
                hSecEl.textContent = remainingSec;
            }

            if (elapsed >= totalDuration) {
                clearInterval(this.speakingTimer);
                this.endRecording(q);
            }
        }, 100);

        // Real-time mic volume level meter
        if (window.audioRecorder && window.audioRecorder.analyser) {
            const dataArray = new Uint8Array(window.audioRecorder.analyser.frequencyBinCount);
            const meterFill = document.getElementById('pearson-mic-level-fill');
            const updateMeter = () => {
                if (!this.recording) return;
                window.audioRecorder.analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                const pct = Math.min(100, Math.round((avg / 128) * 100));
                if (meterFill) meterFill.style.width = pct + '%';
                this.meterAnimFrame = requestAnimationFrame(updateMeter);
            };
            updateMeter();
        }
    }

    async endRecording(q) {
        if (!this.recording) return;
        this.recording = false;
        if (this.silenceCutoffHandler) {
            window.removeEventListener('pte:silence-cutoff', this.silenceCutoffHandler);
            this.silenceCutoffHandler = null;
        }
        const stopBtn = document.getElementById('btn-stop-record');
        const statusEl = document.getElementById('pearson-recording-status');
        const progressBar = document.getElementById('pearson-speaking-progress');
        const meterFill = document.getElementById('pearson-mic-level-fill');
        const headerTimer = document.getElementById('pearson-recording-header-timer');

        if (this.speakingTimer) { clearInterval(this.speakingTimer); this.speakingTimer = null; }
        if (this.meterAnimFrame) { cancelAnimationFrame(this.meterAnimFrame); this.meterAnimFrame = null; }
        if (headerTimer) headerTimer.classList.add('hidden');
        if (meterFill) meterFill.style.width = '0%';
        if (stopBtn) stopBtn.classList.add('hidden');
        if (progressBar) progressBar.style.width = '100%';
        if (statusEl) statusEl.innerHTML = 'Current status: <strong>Completed</strong>';

        const durationSeconds = (Date.now() - (this.recordStartedAt || Date.now())) / 1000;
        const blob = await window.audioRecorder.stopRecording();
        let filePath = null;
        if (blob) filePath = await window.audioRecorder.uploadAudio(blob);

        const acoustic = (window.audioRecorder && window.audioRecorder.getAcousticMetrics)
            ? window.audioRecorder.getAcousticMetrics()
            : { hesitationsCount: 0, maxPauseSeconds: 0, initialSilenceSeconds: 0 };

        const prev = this.responses[q.id] || {};
        this.responses[q.id] = {
            questionId: q.id,
            ...prev,
            audioFilePath: filePath || prev.audioFilePath || null,
            transcript: prev.transcript || null,
            durationSeconds: Math.round(durationSeconds * 10) / 10,
            hesitationsCount: acoustic.hesitationsCount,
            maxPauseSeconds: acoustic.maxPauseSeconds,
            initialSilenceSeconds: acoustic.initialSilenceSeconds
        };
    }

    /* ---------------------------------------------------------- event bind */

    bindItemEvents(q) {
        // Fullscreen toggle button in header
        const fsBtn = document.getElementById('btn-toggle-fullscreen');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Time toggle button in header
        const timeToggleBtn = document.getElementById('btn-toggle-time');
        if (timeToggleBtn) {
            timeToggleBtn.addEventListener('click', () => this.toggleTimeVisibility());
        }

        // Pearson Next button (Immediate progression matching official Pearson PTE exam)
        const nextBtn = document.getElementById('btn-next-item');
        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                nextBtn.disabled = true;
                if (this.recording) {
                    await this.endRecording(q);
                }
                this.stopAudio();
                this.saveCurrentResponse(q);
                if (this.currentIndex === this.questions.length - 1) {
                    this.submitTest();
                } else {
                    this.currentIndex++;
                    this.renderQuestion();
                }
            });
        }

        // Speaking buttons
        const startBtn = document.getElementById('btn-start-record');
        const stopBtn = document.getElementById('btn-stop-record');
        if (startBtn) startBtn.addEventListener('click', () => this.beginRecording(q));
        if (stopBtn) stopBtn.addEventListener('click', () => this.endRecording(q));

        // Word processor (Cut / Copy / Paste / Word count)
        const textarea = document.getElementById('pte-text-input');
        const badge = document.getElementById('word-count-badge');
        const cutBtn = document.getElementById('btn-editor-cut');
        const copyBtn = document.getElementById('btn-editor-copy');
        const pasteBtn = document.getElementById('btn-editor-paste');

        if (textarea && badge) {
            const updateCount = () => {
                const text = textarea.value || '';
                const words = text.trim().split(/\s+/).filter(w => w.length > 0);
                badge.textContent = words.length;
            };
            textarea.addEventListener('input', updateCount);
            updateCount();
        }

        if (cutBtn && textarea) {
            cutBtn.addEventListener('click', () => {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                if (start !== end) {
                    const text = textarea.value.substring(start, end);
                    navigator.clipboard.writeText(text).catch(() => {});
                    textarea.setRangeText('', start, end, 'end');
                    textarea.dispatchEvent(new Event('input'));
                }
            });
        }

        if (copyBtn && textarea) {
            copyBtn.addEventListener('click', () => {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                if (start !== end) {
                    const text = textarea.value.substring(start, end);
                    navigator.clipboard.writeText(text).catch(() => {});
                }
            });
        }

        if (pasteBtn && textarea) {
            pasteBtn.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    textarea.setRangeText(text, start, end, 'end');
                    textarea.dispatchEvent(new Event('input'));
                } catch (e) {
                    const fallback = prompt("Paste your text here:");
                    if (fallback !== null) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        textarea.setRangeText(fallback, start, end, 'end');
                        textarea.dispatchEvent(new Event('input'));
                    }
                }
            });
        }

        // Reading FIB Drag & Drop / Click-to-Place Word Bank
        if (document.querySelectorAll('.pearson-fib-dropzone').length > 0) {
            this.bindReadingFIBInteractions();
        }

        // Two-Column Re-order Paragraphs interactions
        this.bindReorderInteractions();
    }

    bindReadingFIBInteractions() {
        const words = document.querySelectorAll('.pearson-bank-word');
        const dropzones = document.querySelectorAll('.pearson-fib-dropzone');
        let selectedBankWordEl = null;

        // HTML5 Drag & Drop from Word Bank to Dropzones
        words.forEach(w => {
            w.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', w.getAttribute('data-word'));
                w.classList.add('dragging');
            });
            w.addEventListener('dragend', () => {
                w.classList.remove('dragging');
            });

            // Click-to-select word
            w.addEventListener('click', () => {
                if (w.classList.contains('used')) return;
                if (selectedBankWordEl === w) {
                    w.classList.remove('selected');
                    selectedBankWordEl = null;
                } else {
                    words.forEach(el => el.classList.remove('selected'));
                    w.classList.add('selected');
                    selectedBankWordEl = w;
                }
            });
        });

        dropzones.forEach(dz => {
            dz.addEventListener('dragover', (e) => {
                e.preventDefault();
                dz.classList.add('drag-over');
            });
            dz.addEventListener('dragleave', () => {
                dz.classList.remove('drag-over');
            });
            dz.addEventListener('drop', (e) => {
                e.preventDefault();
                dz.classList.remove('drag-over');
                const droppedWord = e.dataTransfer.getData('text/plain');
                if (!droppedWord) return;

                // Return previous word in this blank back to bank
                const prevWord = dz.getAttribute('data-value');
                if (prevWord) {
                    const prevEl = [...words].find(el => el.getAttribute('data-word') === prevWord);
                    if (prevEl) prevEl.classList.remove('used');
                }

                // Place dropped word
                dz.textContent = droppedWord;
                dz.setAttribute('data-value', droppedWord);
                dz.classList.add('filled');

                const newEl = [...words].find(el => el.getAttribute('data-word') === droppedWord);
                if (newEl) newEl.classList.add('used');
            });

            // Click interaction on dropzone
            dz.addEventListener('click', () => {
                // If bank word is selected, place it here
                if (selectedBankWordEl) {
                    const newWord = selectedBankWordEl.getAttribute('data-word');
                    const prevWord = dz.getAttribute('data-value');
                    if (prevWord) {
                        const prevEl = [...words].find(el => el.getAttribute('data-word') === prevWord);
                        if (prevEl) prevEl.classList.remove('used');
                    }

                    dz.textContent = newWord;
                    dz.setAttribute('data-value', newWord);
                    dz.classList.add('filled');
                    selectedBankWordEl.classList.add('used');
                    selectedBankWordEl.classList.remove('selected');
                    selectedBankWordEl = null;
                } else {
                    // Clicking an already filled blank returns the word to the bank!
                    const currentWord = dz.getAttribute('data-value');
                    if (currentWord) {
                        const wordEl = [...words].find(el => el.getAttribute('data-word') === currentWord);
                        if (wordEl) wordEl.classList.remove('used');
                        dz.textContent = '[ Click or drop word ]';
                        dz.setAttribute('data-value', '');
                        dz.classList.remove('filled');
                    }
                }
            });
        });
    }

    bindReorderInteractions() {
        const sourceList = document.getElementById('reorder-source-list');
        const targetList = document.getElementById('reorder-target-list');
        const btnMoveTarget = document.getElementById('btn-move-target');
        const btnMoveSource = document.getElementById('btn-move-source');
        const btnMoveUp = document.getElementById('btn-move-up');
        const btnMoveDown = document.getElementById('btn-move-down');

        if (!sourceList || !targetList) return;

        // Click to select
        const setupSelection = (list, isSource) => {
            list.addEventListener('click', (e) => {
                const item = e.target.closest('.pearson-reorder-item');
                if (!item) return;
                sourceList.querySelectorAll('.pearson-reorder-item').forEach(el => el.classList.remove('selected'));
                targetList.querySelectorAll('.pearson-reorder-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                if (isSource) {
                    this.selectedSourceBox = item;
                    this.selectedTargetBox = null;
                } else {
                    this.selectedTargetBox = item;
                    this.selectedSourceBox = null;
                }
            });
        };
        setupSelection(sourceList, true);
        setupSelection(targetList, false);

        // HTML5 Drag & Drop support between Source and Target
        const setupDragList = (list) => {
            list.addEventListener('dragover', (e) => {
                e.preventDefault();
                list.classList.add('drag-over');
            });
            list.addEventListener('dragleave', () => {
                list.classList.remove('drag-over');
            });
            list.addEventListener('drop', (e) => {
                e.preventDefault();
                list.classList.remove('drag-over');
                const boxId = e.dataTransfer.getData('text/plain');
                const draggingItem = document.querySelector(`.pearson-reorder-item[data-box="${boxId}"]`);
                if (draggingItem) {
                    list.appendChild(draggingItem);
                    draggingItem.classList.remove('selected');
                }
            });
        };
        setupDragList(sourceList);
        setupDragList(targetList);

        // Enable dragstart on all reorder items
        document.querySelectorAll('.pearson-reorder-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.getAttribute('data-box'));
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        // Move to Target (>)
        if (btnMoveTarget) {
            btnMoveTarget.addEventListener('click', () => {
                if (this.selectedSourceBox) {
                    this.selectedSourceBox.classList.remove('selected');
                    targetList.appendChild(this.selectedSourceBox);
                    this.selectedSourceBox = null;
                }
            });
        }

        // Move to Source (<)
        if (btnMoveSource) {
            btnMoveSource.addEventListener('click', () => {
                if (this.selectedTargetBox) {
                    this.selectedTargetBox.classList.remove('selected');
                    sourceList.appendChild(this.selectedTargetBox);
                    this.selectedTargetBox = null;
                }
            });
        }

        // Move Up (▲) in Target
        if (btnMoveUp) {
            btnMoveUp.addEventListener('click', () => {
                if (this.selectedTargetBox && this.selectedTargetBox.previousElementSibling) {
                    targetList.insertBefore(this.selectedTargetBox, this.selectedTargetBox.previousElementSibling);
                }
            });
        }

        // Move Down (▼) in Target
        if (btnMoveDown) {
            btnMoveDown.addEventListener('click', () => {
                if (this.selectedTargetBox && this.selectedTargetBox.nextElementSibling) {
                    targetList.insertBefore(this.selectedTargetBox.nextElementSibling, this.selectedTargetBox);
                }
            });
        }
    }

    /* ------------------------------------------------------ response save */

    saveCurrentResponse(q) {
        if (!q) return;
        const timeSpentSeconds = Math.round((Date.now() - this.itemStartedAt) / 1000);
        const prev = this.responses[q.id] || { questionId: q.id };
        const payload = { ...prev, questionId: q.id, timeSpentSeconds };

        if (q.module === 'speaking') {
            this.responses[q.id] = payload;
            return;
        }

        const textarea = document.getElementById('pte-text-input');
        if (textarea) {
            payload.textResponse = textarea.value;
            this.responses[q.id] = payload;
            return;
        }

        const targetList = document.getElementById('reorder-target-list');
        if (targetList) {
            const boxes = [...targetList.querySelectorAll('.pearson-reorder-item')]
                .map(el => el.getAttribute('data-box'));
            payload.textResponse = boxes.join(',');
            this.responses[q.id] = payload;
            return;
        }

        const mcq = [...document.querySelectorAll('.mcq-input:checked')].map(i => i.value);
        if (document.querySelector('.mcq-input')) {
            payload.textResponse = JSON.stringify(mcq);
            this.responses[q.id] = payload;
            return;
        }

        const dropzones = [...document.querySelectorAll('.pearson-fib-dropzone')];
        if (dropzones.length) {
            const answers = {};
            dropzones.forEach(dz => answers[dz.getAttribute('data-blank')] = dz.getAttribute('data-value') || '');
            payload.textResponse = JSON.stringify(answers);
            this.responses[q.id] = payload;
            return;
        }

        const selects = [...document.querySelectorAll('.pearson-blank-select')];
        const inputs = [...document.querySelectorAll('.pearson-blank-input')];
        if (selects.length || inputs.length) {
            const answers = {};
            selects.forEach(s => answers[s.getAttribute('data-blank')] = s.value);
            inputs.forEach(i => answers[i.getAttribute('data-blank')] = i.value);
            payload.textResponse = JSON.stringify(answers);
            this.responses[q.id] = payload;
            return;
        }

        this.responses[q.id] = payload;
    }

    /* ------------------------------------------------------------- submit */

    async submitTest() {
        this.clearAllTimers();
        this.stopAudio();
        document.body.classList.remove('pearson-mode');

        if (this.recording && this.questions[this.currentIndex]) {
            await this.endRecording(this.questions[this.currentIndex]);
        }

        // Save the currently active item
        if (this.questions && this.currentIndex != null && this.questions[this.currentIndex]) {
            this.saveCurrentResponse(this.questions[this.currentIndex]);
        }

        // Fill in defaults for any unvisited items so the submission is complete
        this.questions.forEach(q => {
            if (!this.responses[q.id]) {
                this.responses[q.id] = { questionId: q.id, textResponse: '', timeSpentSeconds: 0 };
            }
        });

        const payload = {
            testId: this.test.id,
            studentName: this.test.isRemediationDrill ? 'Practice Candidate (Remediation Drill)' : 'Candidate 101',
            responses: Object.values(this.responses).filter(r => r && r.questionId),
            isRemediationDrill: !!this.test.isRemediationDrill
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
                alert('Error submitting test: ' + data.error);
            }
        } catch (err) {
            console.error('Test submission network error:', err);
            alert('Failed to connect to the server to submit your test.');
        }
    }

    /* -------------------------------------------------------------- utils */

    fmtExamTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    fmt(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ------------------------------------------------------ SVG chart render */

    renderChart(opts) {
        const chart = opts && opts.chart;
        if (!chart) return '<div class="text-slate-500 text-sm">[No image available]</div>';
        const W = 620, H = 340;
        const title = this.esc(chart.title || '');
        const subtitle = this.esc(chart.subtitle || '');

        let body = '';
        if (chart.type === 'bar') body = this.svgBar(chart, W, H);
        else if (chart.type === 'line') body = this.svgLine(chart, W, H);
        else if (chart.type === 'pie') body = this.svgPie(chart, W, H);

        return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;border:1px solid #cbd5e1;background:#ffffff;border-radius:4px;" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
            <rect width="${W}" height="${H}" fill="#ffffff"/>
            <text x="${W/2}" y="28" text-anchor="middle" fill="#0f172a" font-size="16" font-weight="700" font-family="Arial, sans-serif">${title}</text>
            <text x="${W/2}" y="46" text-anchor="middle" fill="#64748b" font-size="12" font-family="Arial, sans-serif">${subtitle}</text>
            ${body}
        </svg>`;
    }

    svgBar(chart, W, H) {
        const cats = chart.categories || [];
        const vals = (chart.series && chart.series[0] ? chart.series[0].values : []) || [];
        const left = 60, right = 25, top = 70, bottom = 55;
        const pw = W - left - right, ph = H - top - bottom;
        const max = Math.max(...vals, 1) * 1.15;
        const bw = pw / cats.length;

        let out = '';
        for (let i = 0; i <= 4; i++) {
            const y = top + ph - (ph * i / 4);
            out += `<line x1="${left}" y1="${y}" x2="${W - right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
                    <text x="${left - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11" font-family="Arial, sans-serif">${Math.round(max * i / 4)}</text>`;
        }
        cats.forEach((c, i) => {
            const v = vals[i] || 0;
            const h = (v / max) * ph;
            const x = left + i * bw + bw * 0.2;
            const y = top + ph - h;
            out += `<rect x="${x}" y="${y}" width="${bw * 0.6}" height="${h}" fill="#0072ce" rx="2"/>
                    <text x="${x + bw * 0.3}" y="${y - 6}" text-anchor="middle" fill="#003366" font-size="12" font-weight="700" font-family="Arial, sans-serif">${v}</text>
                    <text x="${x + bw * 0.3}" y="${top + ph + 18}" text-anchor="middle" fill="#334155" font-size="12" font-family="Arial, sans-serif">${this.esc(c)}</text>`;
        });
        out += `<text x="${W / 2}" y="${H - 12}" text-anchor="middle" fill="#64748b" font-size="12" font-family="Arial, sans-serif">${this.esc(chart.xLabel || '')}</text>
                <text x="16" y="${H / 2}" text-anchor="middle" fill="#64748b" font-size="12" font-family="Arial, sans-serif" transform="rotate(-90 16 ${H / 2})">${this.esc(chart.yLabel || '')}</text>`;
        return out;
    }

    svgLine(chart, W, H) {
        const cats = chart.categories || [];
        const vals = (chart.series && chart.series[0] ? chart.series[0].values : []) || [];
        const left = 60, right = 25, top = 70, bottom = 55;
        const pw = W - left - right, ph = H - top - bottom;
        const min = Math.min(...vals, 0), max = Math.max(...vals, 1);
        const rangeV = (max - min) || 1;
        const step = pw / Math.max(cats.length - 1, 1);

        let out = '';
        for (let i = 0; i <= 4; i++) {
            const y = top + ph - (ph * i / 4);
            out += `<line x1="${left}" y1="${y}" x2="${W - right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
                    <text x="${left - 8}" y="${y + 4}" text-anchor="end" fill="#64748b" font-size="11" font-family="Arial, sans-serif">${(min + rangeV * i / 4).toFixed(2)}</text>`;
        }
        const pts = vals.map((v, i) => {
            const x = left + i * step;
            const y = top + ph - ((v - min) / rangeV) * ph;
            return { x, y, v };
        });
        out += `<polyline fill="none" stroke="#0072ce" stroke-width="3" points="${pts.map(p => `${p.x},${p.y}`).join(' ')}"/>`;
        pts.forEach((p, i) => {
            out += `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="#0072ce" stroke-width="2"/>
                    <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#003366" font-size="11" font-weight="700" font-family="Arial, sans-serif">${p.v}</text>
                    <text x="${p.x}" y="${top + ph + 18}" text-anchor="middle" fill="#334155" font-size="12" font-family="Arial, sans-serif">${this.esc(cats[i] || '')}</text>`;
        });
        return out;
    }

    svgPie(chart, W, H) {
        const cats = chart.categories || [];
        const vals = chart.values || [];
        const total = vals.reduce((a, b) => a + b, 0) || 1;
        const cx = 200, cy = 195, r = 105;
        const colors = ['#0072ce', '#002244', '#0284c7', '#0369a1', '#0ea5e9', '#38bdf8'];
        let angle = -Math.PI / 2;
        let out = '';

        vals.forEach((v, i) => {
            const slice = (v / total) * Math.PI * 2;
            const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
            const x2 = cx + r * Math.cos(angle + slice), y2 = cy + r * Math.sin(angle + slice);
            const large = slice > Math.PI ? 1 : 0;
            out += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}" stroke="#ffffff" stroke-width="2"/>`;
            angle += slice;
        });

        cats.forEach((c, i) => {
            const y = 95 + i * 32;
            out += `<rect x="370" y="${y - 12}" width="16" height="16" rx="2" fill="${colors[i % colors.length]}"/>
                    <text x="396" y="${y}" fill="#334155" font-size="13" font-family="Arial, sans-serif">${this.esc(c)} — ${vals[i]}%</text>`;
        });
        return out;
    }
}

function safeParseLocal(v) {
    if (v == null) return null;
    if (typeof v === 'object') return v;
    try { return JSON.parse(v); } catch (e) { return null; }
}

window.pteEngine = new PTEExamEngine();
