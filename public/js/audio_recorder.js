/**
 * Audio Recorder & Web Audio API Handler
 */
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.analyser = null;
        this.stream = null;
        this.isRecording = false;
        this.animationFrameId = null;
        this.recordedBlob = null;
        this.micReady = false;
        this.micDenied = false;

        // Acoustic Speech VAD & Hesitation Tracking (Pearson 3s Silence & Fluency Analyzer)
        this.recordStartTime = 0;
        this.speechDetected = false;
        this.initialSilenceSeconds = 0;
        this.hesitationsCount = 0;
        this.maxPauseSeconds = 0;
        this.silenceStart = null;
        this.totalSpeechMs = 0;
        this.totalDurationMs = 0;
        this.vadInterval = null;
        this.initialSilenceWarning = false;
        this.startPending = false;
        this.stopPending = false;
    }

    // Request microphone access and prepare Web Audio analyzer
    async initMicrophone() {
        if (this.micReady) return true;
        // A hard denial must not re-prompt. getUserMedia is requested again on
        // every speaking item, and each failed attempt used to raise a blocking
        // alert — which queued behind the running 1-second prep/timer intervals
        // and produced an endless stream of dialogs that stalled the exam.
        if (this.micDenied) return false;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();

            const source = this.audioContext.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
            this.analyser.fftSize = 256;

            this.micReady = true;
            return true;
        } catch (err) {
            console.error("Microphone access error:", err);
            this.micDenied = true;
            // Non-blocking notice only. Every caller already reports the failure
            // inline (equipment check: "Microphone error. Please check
            // permissions."; beginRecording: "Microphone unavailable"), so a
            // modal alert here adds nothing but blocks the thread.
            try {
                window.dispatchEvent(new CustomEvent('pte:mic-error', {
                    detail: { message: 'Microphone access is required for Speaking tasks. Please enable microphone permissions in your browser.' }
                }));
            } catch (e) { /* CustomEvent unsupported - console.error above is enough */ }
            return false;
        }
    }

    // Start recording audio and drawing waveform to canvas
    async startRecording(canvasElement) {
        if (this.startPending || this.isRecording || this.stopPending) return false;
        this.startPending = true;
        try {
            if (!this.stream) {
                const ok = await this.initMicrophone();
                if (!ok) return false;
            }

        this.audioChunks = [];
        this.recordedBlob = null;
        this.recordStartTime = Date.now();
        this.speechDetected = false;
        this.initialSilenceSeconds = 0;
        this.hesitationsCount = 0;
        this.maxPauseSeconds = 0;
        this.silenceStart = null;
        this.totalSpeechMs = 0;
        this.totalDurationMs = 0;
        this.initialSilenceWarning = false;

        let mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        }

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.start(100); // 100ms slice
        this.isRecording = true;

        if (this.analyser) {
            this.startVAD();
        }

        if (canvasElement && this.analyser) {
            this.drawWaveform(canvasElement);
        }

            return true;
        } finally {
            this.startPending = false;
        }
    }

    startVAD() {
        if (this.vadInterval) clearInterval(this.vadInterval);
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const SPEECH_THRESHOLD = 14;

        this.vadInterval = setInterval(() => {
            if (!this.isRecording || !this.analyser) {
                if (this.vadInterval) { clearInterval(this.vadInterval); this.vadInterval = null; }
                return;
            }

            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;

            if (avg >= SPEECH_THRESHOLD) {
                // Speech is active
                if (!this.speechDetected) {
                    this.speechDetected = true;
                    this.initialSilenceSeconds = (Date.now() - this.recordStartTime) / 1000;
                }
                if (this.silenceStart) {
                    const pauseDuration = (Date.now() - this.silenceStart) / 1000;
                    if (pauseDuration >= 1.5) {
                        this.hesitationsCount++;
                        this.maxPauseSeconds = Math.max(this.maxPauseSeconds, pauseDuration);
                    }
                    this.silenceStart = null;
                }
                this.totalSpeechMs += 100;
            } else {
                // Silence / ambient background
                if (this.speechDetected && !this.silenceStart) {
                    this.silenceStart = Date.now();
                } else if (!this.speechDetected) {
                    const elapsed = (Date.now() - this.recordStartTime) / 1000;
                    if (elapsed >= 3.0 && !this.initialSilenceWarning) {
                        this.initialSilenceWarning = true;
                        try {
                            window.dispatchEvent(new CustomEvent('pte:silence-cutoff', { detail: { seconds: elapsed } }));
                        } catch (e) {}
                    }
                }
                if (this.speechDetected && this.silenceStart && (Date.now() - this.silenceStart) >= 3000 && !this.initialSilenceWarning) {
                    this.initialSilenceWarning = true;
                    try { window.dispatchEvent(new CustomEvent('pte:silence-cutoff', { detail: { seconds: 3 } })); } catch (e) {}
                }
            }
        }, 100);
    }

    // Stop recording and return Audio Blob
    stopRecording() {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || !this.isRecording || this.stopPending) {
                resolve(null);
                return;
            }
            this.stopPending = true;
            this.isRecording = false;

            if (this.vadInterval) {
                clearInterval(this.vadInterval);
                this.vadInterval = null;
            }

            this.totalDurationMs = Date.now() - (this.recordStartTime || Date.now());
            if (this.silenceStart) {
                const finalPause = (Date.now() - this.silenceStart) / 1000;
                if (finalPause >= 1.5) {
                    this.hesitationsCount++;
                    this.maxPauseSeconds = Math.max(this.maxPauseSeconds, finalPause);
                }
            }
            if (!this.speechDetected) {
                this.initialSilenceSeconds = this.totalDurationMs / 1000;
            }

            this.mediaRecorder.onstop = () => {
                this.stopPending = false;
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                }
                
                this.recordedBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
                resolve(this.recordedBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    getAcousticMetrics() {
        return {
            hesitationsCount: this.hesitationsCount || 0,
            maxPauseSeconds: Math.round((this.maxPauseSeconds || 0) * 10) / 10,
            initialSilenceSeconds: Math.round((this.initialSilenceSeconds || 0) * 10) / 10,
            speechRatio: this.totalDurationMs > 0 ? Math.round((this.totalSpeechMs / this.totalDurationMs) * 100) / 100 : 0.85
        };
    }

    // Render live real-time audio spectrum/waveform on canvas
    drawWaveform(canvas) {
        const ctx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!this.isRecording) return;
            this.animationFrameId = requestAnimationFrame(draw);

            this.analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;

                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#38bdf8');
                gradient.addColorStop(1, '#6366f1');

                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        draw();
    }

    // Upload audio blob to server API
    async uploadAudio(blob) {
        if (!blob) return null;

        const formData = new FormData();
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        formData.append('audio', blob, `recording-${Date.now()}.${ext}`);

        try {
            const res = await fetch('/api/upload-audio', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                return data.filePath;
            } else {
                console.error("Audio upload failed:", data.error);
                return null;
            }
        } catch (err) {
            console.error("Audio upload network error:", err);
            return null;
        }
    }
}

// Global singleton instance
window.audioRecorder = new AudioRecorder();
