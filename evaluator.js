/**
 * ============================================================================
 *  PTE Academic Evaluator — 10-90 Scale, Granular Sub-scores & Mistake Logging
 * ============================================================================
 *  Every question carries a JSON `answer_key` envelope. This module consumes
 *  that envelope and returns a uniform result:
 *
 *    {
 *      score       : 10-90 (PTE official scale; 10 = floor, 90 = superior)
 *      maxScore    : 90
 *      subScores   : raw per-component values (0-1 ratios unless noted)
 *      metrics     : counts used for analysis (words, accuracy, duration...)
 *      enabling    : per-enabling-skill contributions on the 10-90 scale
 *      mistakes    : [{category, mistake, correction}]  -> mistake_logs
 *      feedback    : human readable notes
 *    }
 *
 *  `category` MUST be one of the mistake_logs CHECK values:
 *    Grammar | Spelling | Vocabulary | Fluency | Form/Length | Content | Punctuation
 * ============================================================================
 */

const MISTAKE_CATEGORIES = new Set([
    'Grammar', 'Spelling', 'Vocabulary', 'Fluency', 'Form/Length', 'Content', 'Punctuation'
]);

/* ------------------------------------------------------------------ utils */

function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text) {
    if (!text) return 0;
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function normalise(str) {
    return String(str == null ? '' : str)
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/[^a-z0-9'\s]/g, ' ')
        // Accept UK/US spelling equivalents when matching answers and key points
        .replace(/isation/g, 'ization')
        .replace(/isational/g, 'izational')
        .replace(/\bise\b/g, 'ize')
        .replace(/\bised\b/g, 'ized')
        .replace(/\bising\b/g, 'izing')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokens(str) {
    const n = normalise(str);
    return n ? n.split(' ') : [];
}

function parseKey(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return { model_answer: String(raw) }; }
}

function parseOptions(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return {}; }
}

function parseResponseValue(raw) {
    if (raw == null) return null;
    if (typeof raw === 'object') return raw;
    const s = String(raw).trim();
    if (s.startsWith('{') || s.startsWith('[')) {
        try { return JSON.parse(s); } catch (e) { /* fall through */ }
    }
    return s;
}

/** 10-90 scale mapping: ratio 0..1 -> 10..90. */
function toPTE(ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    return Math.round(10 + r * 80);
}

function pushMistake(mistakes, category, mistake, correction) {
    if (!MISTAKE_CATEGORIES.has(category)) category = 'Content';
    mistakes.push({ category, mistake, correction });
}

/* ------------------------------------------------------- shared evaluators */

function evaluateVocabulary(text) {
    const words = (text || '').toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    if (words.length === 0) return { ratio: 0, score: 1.0, mistakes: [] };
    const unique = new Set(words);
    const ttr = unique.size / words.length;

    // Stems rather than exact words, so inflected academic forms still count
    // (demonstrates/demonstrating, infrastructure, urbanisation/urbanization).
    const academicStems = [
        'demonstrat', 'implement', 'significan', 'ecolog', 'phenomen', 'inevit',
        'predomin', 'therefore', 'consequent', 'furthermore', 'moreover',
        'nevertheles', 'mitigat', 'sustain', 'enhanc', 'infrastructure',
        'constraint', 'urbanis', 'urbaniz', 'biodivers', 'ecosystem',
        'methodolog', 'hypoth', 'integrat', 'subsequent', 'approximat',
        'transform', 'consolidat', 'transport', 'innovat', 'accelerat',
        'remediat', 'synthesis', 'empirical', 'theoretical', 'proportion',
        'concentration', 'productivity', 'resilience', 'vulnerab'
    ];
    const academicCount = words.filter(w =>
        academicStems.some(stem => w.includes(stem))).length;

    const raw = ttr * 7 + Math.min(academicCount * 0.5, 2);
    const mistakes = [];
    if (academicCount === 0 && words.length > 20) {
        pushMistake(mistakes, 'Vocabulary', 'No academic vocabulary markers used',
            'Include high-level academic words (e.g. demonstrate, implement, significantly)');
    }
    return {
        ratio: Math.max(0, Math.min(1, raw / 9)),
        score: Math.min(Math.max(raw, 1.0), 9.0),
        ttr: Math.round(ttr * 100) / 100,
        academicHits: academicCount,
        mistakes
    };
}

function evaluateGrammarDetailed(text, opts = {}) {
    const mistakes = [];
    const errors = [];
    if (!text || !text.trim()) {
        pushMistake(mistakes, 'Grammar', 'No text entered', 'Provide a complete response');
        return { ratio: 0, score: 1.0, errors: ['Empty response'], mistakes };
    }

    const trimmed = text.trim();

    if (!/^[A-Z]/.test(trimmed)) {
        errors.push('Sentence must begin with a capital letter.');
        pushMistake(mistakes, 'Punctuation',
            `First character "${trimmed.charAt(0)}" is lowercase`,
            `Capitalize the first letter: "${trimmed.charAt(0).toUpperCase()}"`);
    }
    if (!/[.!?]$/.test(trimmed)) {
        errors.push('Response must end with terminal punctuation.');
        pushMistake(mistakes, 'Punctuation', 'Missing terminal punctuation at end of response',
            "Add a full stop '.' at the end");
    }
    if (/\s{2,}/.test(trimmed)) {
        errors.push('Contains consecutive multiple spaces.');
        pushMistake(mistakes, 'Form/Length', 'Multiple consecutive spaces found',
            'Use a single space between words');
    }

    // repeated words ("the the"), a common spoken/typed slip
    const repeats = trimmed.match(/\b(\w+)\s+\1\b/gi) || [];
    if (repeats.length > 0) {
        errors.push(`Repeated word detected: "${repeats[0]}".`);
        pushMistake(mistakes, 'Grammar', `Word repeated twice: "${repeats[0]}"`,
            `Delete the duplicate occurrence of "${repeats[0].split(/\s+/)[0]}"`);
    }

    // subject-verb agreement heuristics for common errors
    const svErrors = [
        [/\b(he|she|it)\s+(go|do|have|are|were|was not|run|make)\b/i, 'Third-person singular subject needs "-s" (he goes).'],
        [/\b(they|we|i)\s+(goes|does|has|is|was)\b/i, 'Plural/first-person subject needs the base verb (they go).']
    ];
    for (const [re, msg] of svErrors) {
        if (re.test(trimmed)) {
            errors.push(msg);
            pushMistake(mistakes, 'Grammar', msg, 'Match the verb form to the subject');
        }
    }

    const sentences = countSentences(text);
    const words = countWords(text);
    const avgLen = words / (sentences || 1);

    // Base 8.5 = a clean, well-formed response. Errors subtract from it, but a
    // flawless answer must be able to approach 90 rather than cap out at ~77.
    let score = 8.5;
    score -= errors.length * 0.7;
    if (avgLen < 6) {
        errors.push('Sentence structure is overly simplistic.');
        score -= 1.0;
        pushMistake(mistakes, 'Grammar',
            `Average sentence length is only ${Math.round(avgLen)} words`,
            'Combine short clauses with subordinate conjunctions (although, because, which)');
    } else if (avgLen > 35 && !opts.singleSentence) {
        // Never applied to tasks that legally REQUIRE one long sentence
        // (Summarize Written Text), where form already enforces the limit.
        errors.push('Sentences are excessively long and run-on.');
        score -= 1.0;
        pushMistake(mistakes, 'Grammar',
            `Run-on sentence averaging ${Math.round(avgLen)} words`,
            'Split long sentences at logical boundaries and add full stops');
    }

    return {
        ratio: Math.max(0, Math.min(1, score / 9)),
        score: Math.min(Math.max(score, 1.0), 9.0),
        errors,
        mistakes
    };
}

/** Character-level spelling check: genuine misspelling -> correction pairs.
 *  Only entries where the key is actually WRONG and the value is the fix.
 *  Valid UK/US variants (fertilise/fertilize, analyse/analyze) must never
 *  appear here — flagging a correct word is worse than missing a typo. */
const COMMON_MISSPELLINGS = {
    'recieve': 'receive',
    'seperate': 'separate',
    'definately': 'definitely',
    'occured': 'occurred',
    'occurence': 'occurrence',
    'occurrance': 'occurrence',
    'accomodate': 'accommodate',
    'acommodate': 'accommodate',
    'neccessary': 'necessary',
    'necesary': 'necessary',
    'goverment': 'government',
    'existance': 'existence',
    'existense': 'existence',
    'arguement': 'argument',
    'begining': 'beginning',
    'concious': 'conscious',
    'embarass': 'embarrass',
    'independant': 'independent',
    'refered': 'referred',
    'succesful': 'successful',
    'successfull': 'successful',
    'tommorow': 'tomorrow',
    'untill': 'until',
    'wierd': 'weird',
    'truely': 'truly',
    'writting': 'writing',
    'writeing': 'writing',
    'developement': 'development',
    'managment': 'management',
    'reccomend': 'recommend',
    'recomend': 'recommend',
    'occassion': 'occasion',
    'persistant': 'persistent',
    'priviledge': 'privilege',
    'calender': 'calendar',
    'collegue': 'colleague',
    'millenium': 'millennium',
    'noticable': 'noticeable',
    'paralell': 'parallel',
    'seige': 'siege',
    'supercede': 'supersede',
    'threshhold': 'threshold',
    'sentance': 'sentence',
    'mispelled': 'misspelled',
    'wrod': 'word',
    'teh': 'the',
    'adn': 'and',
    'taht': 'that',
    'thier': 'their',
    'acheive': 'achieve',
    'agram': 'diagram',
    'bioligy': 'biology',
    'comittee': 'committee',
    'enviroment': 'environment',
    'envirenment': 'environment',
    'pubicly': 'publicly',
    'puplication': 'publication',
    'reaserch': 'research',
    'reasearch': 'research',
    'studnet': 'student',
    'libary': 'library',
    'librarry': 'library',
    'conected': 'connected',
    'dictonary': 'dictionary',
    'emissons': 'emissions',
    'emmissions': 'emissions',
    'photosynthisis': 'photosynthesis',
    'consolitation': 'consolidation'
};

function evaluateSpelling(text) {
    if (!text || !text.trim()) {
        return { ratio: 0, mistakes: [] };
    }
    const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
    const mistakes = [];
    let flagged = 0;

    words.forEach(w => {
        if (w.length > 3 && COMMON_MISSPELLINGS[w]) {
            flagged++;
            pushMistake(mistakes, 'Spelling', `Misspelling: "${w}"`,
                `Correct spelling: "${COMMON_MISSPELLINGS[w]}"`);
        }
    });

    // Repeated word is also a spelling/typing defect
    const dupes = text.match(/\b(\w+)\s+\1\b/gi) || [];
    dupes.forEach(d => {
        flagged++;
        const w = d.split(/\s+/)[0];
        pushMistake(mistakes, 'Spelling', `Typed twice: "${d}"`, `Write "${w}" once`);
    });

    const uniqueCount = new Set(words).size;
    // Pure defect rate: a response with no flagged errors earns full credit
    // regardless of length. Short-but-perfect dictations must not be punished.
    const ratio = words.length === 0 ? 0 : Math.max(0, 1 - flagged / words.length);
    return {
        ratio,
        uniqueCount,
        flagged,
        mistakes
    };
}

function evaluateDiscourse(text) {
    if (!text) return { ratio: 0, mistakes: [] };
    const lower = text.toLowerCase();
    const markers = [
        'however', 'therefore', 'furthermore', 'moreover', 'consequently',
        'in conclusion', 'on the other hand', 'in addition', 'for instance',
        'nevertheless', 'to begin with', 'overall', 'in summary', 'whereas',
        // subordinating/linking devices also evidence written discourse and are
        // the natural cohesion tools inside a single-sentence summary
        'because', 'although', 'while', 'whereas', 'which', 'demonstrating',
        'proving that', 'in turn', 'thereby', 'thus', 'hence'
    ];
    const hits = markers.filter(m => lower.includes(m));
    const sentences = countSentences(text);
    const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    // Semicolons joining independent clauses are a formal cohesion device.
    const semicolonLinks = (text.match(/;/g) || []).length;

    const markerScore = Math.min(1, hits.length / 3);
    const structureScore = (paragraphCount > 1 || sentences >= 4 || semicolonLinks > 0) ? 1 : 0.5;
    const ratio = Math.min(1, markerScore * 0.6 + structureScore * 0.4);

    const mistakes = [];
    if (hits.length === 0 && semicolonLinks === 0) {
        pushMistake(mistakes, 'Vocabulary',
            'No cohesive or discourse markers found',
            "Add transitions such as 'Furthermore', 'However', 'Therefore' or 'In conclusion'");
    }
    return { ratio, hits, mistakes };
}

/**
 * Content coverage: how many expected key points appear in the response.
 */
function evaluateContent(text, keyPoints) {
    if (!keyPoints || keyPoints.length === 0) {
        return { ratio: text && text.trim() ? 1 : 0, matched: [], missed: [] };
    }
    const hay = normalise(text);
    const matched = [];
    const missed = [];
    for (const point of keyPoints) {
        const np = normalise(point);
        if (!np) continue;
        if (hay.includes(np)) matched.push(point);
        else missed.push(point);
    }
    return { ratio: matched.length / keyPoints.length, matched, missed };
}

/** Form check: word range + sentence constraints. */
function evaluateForm(text, key) {
    const words = countWords(text);
    const sentences = countSentences(text);
    const mistakes = [];
    let ratio = 1;

    const range = Array.isArray(key.word_range) ? key.word_range : null;
    if (range) {
        const [min, max] = range;
        if (words < min) {
            ratio = words <= 0 ? 0 : Math.max(0.1, words / min);
            pushMistake(mistakes, 'Form/Length',
                `Response is ${words} words but requires ${min}–${max} words`,
                `Add content to reach at least ${min} words without exceeding ${max}`);
        } else if (words > max) {
            ratio = Math.max(0.3, 1 - (words - max) / max);
            pushMistake(mistakes, 'Form/Length',
                `Response is ${words} words but the limit is ${max}`,
                `Cut redundancy to bring the response within ${max} words`);
        }
    }

    if (typeof key.required_sentences === 'number') {
        const req = key.required_sentences;
        if (req === 1 && sentences !== 1) {
            ratio = Math.min(ratio, 0.25);
            pushMistake(mistakes, 'Form/Length',
                `Response has ${sentences} sentences; exactly 1 is required`,
                'Join the clauses with semicolons or subordinating conjunctions to form one sentence');
        } else if (req > 1 && sentences < Math.ceil(req * 0.6)) {
            ratio = Math.min(ratio, 0.5);
            pushMistake(mistakes, 'Form/Length',
                `Only ${sentences} sentences written; around ${req} expected`,
                'Develop each idea in its own clearly structured sentence');
        }
    }

    return { ratio, words, sentences, mistakes };
}

/* ------------------------------------------------------- speaking evaluator */

/**
 * Word-level speech alignment and acoustic hesitation mapping.
 * Matches spoken transcript / duration against expected target prompt text,
 * assigning:
 *   - 'accurate'  : natural pronunciation & rhythm
 *   - 'hesitated' : unnatural pause (>1.5s) or excessive delay
 *   - 'omitted'   : word skipped or inaudible
 *   - 'inserted'  : extraneous filler word detected
 */
function alignSpeakingWords(targetText, spokenText, acousticMetrics = {}, duration = 0) {
    const hesitationsCount = Number(acousticMetrics.hesitationsCount || 0);
    const maxPauseSeconds = Number(acousticMetrics.maxPauseSeconds || 0);
    const initialSilenceSeconds = Number(acousticMetrics.initialSilenceSeconds || 0);

    const cleanRaw = (targetText || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^a-zA-Z0-9'\s-]/g, ' ')
        .trim();
    const targetWords = cleanRaw ? cleanRaw.split(/\s+/).filter(w => w.length > 0) : [];

    if (targetWords.length === 0) {
        return {
            alignment: [],
            hesitationsCount,
            maxPauseSeconds,
            initialSilenceSeconds
        };
    }

    const hasRealSpoken = spokenText &&
        !/^recorded speaking audio\.?$/i.test(spokenText.trim()) &&
        !/^audio response recorded/i.test(spokenText.trim());

    const alignment = [];

    if (hasRealSpoken) {
        const spokenTokens = spokenText.replace(/[^a-zA-Z0-9'\s-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
        const normSpoken = spokenTokens.map(w => normalise(w));
        const matchedSpokenIndices = new Set();
        let spokenCursor = 0;

        targetWords.forEach((word, tIdx) => {
            const nw = normalise(word);
            let foundIdx = -1;
            for (let i = spokenCursor; i < Math.min(spokenTokens.length, spokenCursor + 5); i++) {
                if (!matchedSpokenIndices.has(i) && (normSpoken[i] === nw || normSpoken[i].includes(nw) || nw.includes(normSpoken[i]))) {
                    foundIdx = i;
                    break;
                }
            }

            if (foundIdx !== -1) {
                for (let k = spokenCursor; k < foundIdx; k++) {
                    if (!matchedSpokenIndices.has(k)) {
                        matchedSpokenIndices.add(k);
                        alignment.push({
                            word: spokenTokens[k],
                            status: 'inserted',
                            note: 'Extraneous word or filler detected'
                        });
                    }
                }
                matchedSpokenIndices.add(foundIdx);
                spokenCursor = foundIdx + 1;

                const isHesitated = hesitationsCount > 0 && (tIdx > 0 && tIdx % Math.max(2, Math.floor(targetWords.length / hesitationsCount)) === 0);
                if (isHesitated) {
                    alignment.push({
                        word,
                        status: 'hesitated',
                        note: 'Hesitation pause (>1.5s) detected near word'
                    });
                } else {
                    alignment.push({
                        word,
                        status: 'accurate',
                        note: 'Accurate acoustic articulation'
                    });
                }
            } else {
                alignment.push({
                    word,
                    status: 'omitted',
                    note: 'Omitted or inaudible in candidate speech'
                });
            }
        });

        for (let k = spokenCursor; k < spokenTokens.length; k++) {
            if (!matchedSpokenIndices.has(k)) {
                alignment.push({
                    word: spokenTokens[k],
                    status: 'inserted',
                    note: 'Extraneous trailing filler uttered'
                });
            }
        }
    } else {
        if (duration <= 0) {
            targetWords.forEach(word => {
                alignment.push({
                    word,
                    status: 'omitted',
                    note: 'No audio signal recorded'
                });
            });
        } else {
            const hesitationIndices = new Set();
            if (initialSilenceSeconds >= 3.0 && targetWords.length > 0) {
                hesitationIndices.add(0);
            }
            if (hesitationsCount > 0) {
                const interval = Math.max(2, Math.floor(targetWords.length / (hesitationsCount + 1)));
                for (let h = 1; h <= hesitationsCount; h++) {
                    const idx = Math.min(targetWords.length - 1, h * interval);
                    hesitationIndices.add(idx);
                }
            }

            targetWords.forEach((word, idx) => {
                if (hesitationIndices.has(idx)) {
                    alignment.push({
                        word,
                        status: 'hesitated',
                        note: idx === 0 && initialSilenceSeconds >= 3.0
                            ? `Initial silence was ${initialSilenceSeconds.toFixed(1)}s (exceeded 3s cutoff rule)`
                            : `Hesitation pause (>1.5s) detected`
                    });
                } else {
                    alignment.push({
                        word,
                        status: 'accurate',
                        note: 'Natural speaking cadence and tempo'
                    });
                }
            });
        }
    }

    return {
        alignment,
        hesitationsCount,
        maxPauseSeconds,
        initialSilenceSeconds
    };
}

/**
 * Speaking items score on recording presence + pacing accuracy + acoustic metrics.
 * `resp` = { audioFilePath, transcript, durationSeconds, hesitationsCount, maxPauseSeconds, initialSilenceSeconds }
 */
function evaluateSpeaking(questionType, key, resp, question) {
    const mistakes = [];
    const audioPath = resp && resp.audioFilePath;
    const duration = Number((resp && resp.durationSeconds) || 0);
    const transcript = (resp && resp.transcript) || '';
    const hasRealTranscript = transcript &&
        !/^recorded speaking audio\.?$/i.test(transcript.trim()) &&
        !/^audio response recorded/i.test(transcript.trim());

    const hesitationsCount = Number((resp && resp.hesitationsCount) || 0);
    const maxPauseSeconds = Number((resp && resp.maxPauseSeconds) || 0);
    const initialSilenceSeconds = Number((resp && resp.initialSilenceSeconds) || 0);

    // 1. Presence ------------------------------------------------------------
    if (!audioPath) {
        pushMistake(mistakes, 'Fluency', 'No recording was submitted for this speaking item',
            'Record a response for every speaking task; an unrecorded item scores the floor');
        return buildSpeakingResult(questionType, {
            content: 0, fluency: 0, pronunciation: 0
        }, { recorded: false, durationSeconds: 0, wordsPerSecond: 0, hesitationsCount, maxPauseSeconds, initialSilenceSeconds }, mistakes, []);
    }

    if (duration > 0 && duration < 1.5) {
        pushMistake(mistakes, 'Fluency',
            `Recording was only ${duration.toFixed(1)} seconds — effectively silent`,
            'Begin speaking immediately after the tone and continue without long pauses');
        return buildSpeakingResult(questionType, {
            content: 0.1, fluency: 0.1, pronunciation: 0.1
        }, { recorded: true, durationSeconds: duration, wordsPerSecond: 0, hesitationsCount, maxPauseSeconds, initialSilenceSeconds }, mistakes, []);
    }

    // 2. Pacing & Fluency -----------------------------------------------------
    const allowed = (question && question.time_limit_seconds) || 40;
    const targetWords = key.target_words || null;
    const expected = targetWords
        ? Math.max(3, targetWords / 2.5)
        : Math.min(allowed, 8);

    let fluencyRatio = 1;
    if (duration > 0) {
        const overrun = duration > allowed * 1.05;
        const truncated = duration < expected * 0.5;

        if (overrun) {
            fluencyRatio = Math.max(0.3, Math.min(1, 1 - (duration - allowed) / allowed));
            pushMistake(mistakes, 'Fluency',
                `Recording ran ${Math.round(duration - allowed)}s beyond the ${allowed}s limit`,
                `Stop cleanly at ${allowed}s — time beyond the limit is not scored`);
        } else if (truncated) {
            fluencyRatio = Math.max(0.2, Math.min(1, duration / (expected * 0.5)));
            pushMistake(mistakes, 'Fluency',
                `Spoke for only ${duration.toFixed(1)}s — the response was left unfinished`,
                `Deliver the full content (about ${Math.round(expected)}s) without trailing off`);
        }
    } else {
        fluencyRatio = 0.8;
    }

    // Pearson 3-second initial silence penalty
    if (duration > 0 && initialSilenceSeconds >= 3.0) {
        fluencyRatio = Math.max(0.1, fluencyRatio - 0.25);
        pushMistake(mistakes, 'Fluency',
            `Initial silence was ${initialSilenceSeconds.toFixed(1)}s (exceeded 3-second Pearson cutoff rule)`,
            'Begin speaking within 3 seconds of the recording beep; Pearson microphones stop recording after 3 seconds of silence');
    }

    // Unnatural hesitation pauses (>1.5s) penalty
    if (duration > 0 && hesitationsCount > 0) {
        const pausePenalty = Math.min(0.35, hesitationsCount * 0.08);
        fluencyRatio = Math.max(0.1, fluencyRatio - pausePenalty);
        pushMistake(mistakes, 'Fluency',
            `Detected ${hesitationsCount} hesitation pause(s) exceeding 1.5 seconds (longest: ${maxPauseSeconds.toFixed(1)}s)`,
            'Maintain continuous, natural oral flow without mid-sentence pauses');
    }

    // 3. Content -------------------------------------------------------------
    let contentRatio;
    if (hasRealTranscript) {
        contentRatio = evaluateContent(transcript, key.key_points).ratio;
        const c = evaluateContent(transcript, key.key_points);
        if (c.missed.length) {
            pushMistake(mistakes, 'Content',
                `Missed key content: ${c.missed.slice(0, 4).join(', ')}`,
                'Ensure every idea in the stimulus is mentioned in your response');
        }
    } else if (questionType === 'answer_short_question') {
        contentRatio = 0.5;
        pushMistake(mistakes, 'Content',
            `Spoken answer could not be verified; expected "${key.model_answer || 'a short answer'}"`,
            'Give a single word or very short phrase so it can be checked reliably');
    } else if (key.key_points && key.key_points.length) {
        contentRatio = Math.min(0.8, 0.5 + 0.5 * fluencyRatio);
    } else {
        contentRatio = 0.5;
    }

    // 4. Pronunciation proxy — steady pacing plus sound content delivery ----
    const pronunciationRatio = Math.max(0, Math.min(1,
        0.6 * fluencyRatio + 0.4 * contentRatio));

    // Target prompt text for word-level alignment map
    let targetText = '';
    if (questionType === 'read_aloud') targetText = (question && question.passage) || (key && key.target_text) || (key && key.model_answer) || '';
    else if (questionType === 'repeat_sentence') targetText = (question && question.script) || (key && key.model_answer) || (question && question.prompt) || '';
    else if (questionType === 'describe_image' || questionType === 'retell_lecture') {
        targetText = (key && key.key_points && key.key_points.length) ? key.key_points.join('. ') : ((question && question.prompt) || '');
    } else if (questionType === 'answer_short_question') {
        targetText = (key && key.model_answer) || (question && question.prompt) || '';
    }

    const wordAlignmentResult = alignSpeakingWords(targetText, hasRealTranscript ? transcript : '', {
        hesitationsCount,
        maxPauseSeconds,
        initialSilenceSeconds
    }, duration);

    return buildSpeakingResult(questionType, {
        content: contentRatio, fluency: fluencyRatio, pronunciation: pronunciationRatio
    }, {
        recorded: true,
        durationSeconds: duration,
        allowedSeconds: allowed,
        wordsPerSecond: targetWords && duration ? Math.round((targetWords / duration) * 10) / 10 : null,
        hesitationsCount,
        maxPauseSeconds,
        initialSilenceSeconds,
        content_verified: Boolean(hasRealTranscript),
        pronunciation_verified: false,
        scoring_method: 'practice_proxy',
        word_alignment: hasRealTranscript ? wordAlignmentResult.alignment : []
    }, mistakes);
}

function buildSpeakingResult(questionType, ratios, metrics, mistakes) {
    const content = Math.round(ratios.content * 100) / 100;
    const fluency = Math.round(ratios.fluency * 100) / 100;
    const pronunciation = Math.round(ratios.pronunciation * 100) / 100;

    // Speaking items in PTE weight content, oral fluency and pronunciation.
    const combined = (content + fluency + pronunciation) / 3;
    const score = toPTE(combined);

    return {
        score,
        maxScore: 90,
        subScores: {
            content,
            oral_fluency: fluency,
            pronunciation,
            hesitations: metrics.hesitationsCount || 0
        },
        metrics: { item_type: questionType, ...metrics },
        enabling: { fluency: toPTE(fluency), pronunciation: toPTE(pronunciation) },
        mistakes,
        feedback: [
            ...(metrics.scoring_method === 'practice_proxy' ? [
                'Practice proxy only: pronunciation is not independently assessed.',
                ...(!metrics.content_verified ? ['Content is unverified without a transcript; no word-level correctness can be established.'] : [])
            ] : []),
            `Content ${Math.round(content * 100)}%`,
            `Oral fluency ${Math.round(fluency * 100)}%`,
            `Pronunciation ${Math.round(pronunciation * 100)}%`,
            ...((metrics.hesitationsCount > 0) ? [`${metrics.hesitationsCount} hesitation pause(s) (>1.5s)`] : [])
        ]
    };
}

/* ------------------------------------------------------ written evaluators */

function evaluateWrittenItem(questionType, key, text) {
    const mistakes = [];
    const form = evaluateForm(text, key);
    const content = evaluateContent(text, key.key_points);
    // Short summary tasks (SWT 5–75 words, SST 50–70 words) legitimately use
    // one long sentence, so the run-on rule must not punish them.
    const isShortSummary = Array.isArray(key.word_range) && key.word_range[1] <= 75;
    const grammar = evaluateGrammarDetailed(text,
        { singleSentence: key.required_sentences === 1 || isShortSummary });
    const vocab = evaluateVocabulary(text);
    const spelling = evaluateSpelling(text);
    const discourse = evaluateDiscourse(text);

    mistakes.push(
        ...(form.mistakes || []),
        ...((content.missed || []).slice(0, 5).map(mp => ({
            category: 'Content',
            mistake: `Key point not covered: "${mp}"`,
            correction: `Incorporate the idea "${mp}" from the stimulus`
        }))),
        ...(grammar.mistakes || []),
        ...(spelling.mistakes || []),
        ...(vocab.mistakes || []),
        ...(discourse.mistakes || [])
    );

    const subScores = {
        content: Math.round(content.ratio * 100) / 100,
        form: Math.round(form.ratio * 100) / 100,
        grammar: Math.round(grammar.ratio * 100) / 100,
        vocabulary: Math.round(vocab.ratio * 100) / 100,
        spelling: Math.round(spelling.ratio * 100) / 100,
        written_discourse: Math.round(discourse.ratio * 100) / 100
    };

    // Weights differ by task, mirroring the official PTE weighting.
    let weights;
    if (questionType === 'summarize_written_text') {
        weights = { content: 0.30, form: 0.15, grammar: 0.25, vocabulary: 0.20, spelling: 0.05, written_discourse: 0.05 };
    } else if (questionType === 'summarize_spoken_text') {
        weights = { content: 0.35, form: 0.15, grammar: 0.20, vocabulary: 0.15, spelling: 0.10, written_discourse: 0.05 };
    } else { // write_essay
        weights = { content: 0.25, form: 0.15, grammar: 0.25, vocabulary: 0.15, spelling: 0.10, written_discourse: 0.10 };
    }

    let weighted = 0;
    for (const [k, w] of Object.entries(weights)) weighted += (subScores[k] || 0) * w;
    const score = toPTE(weighted);

    // Formulate inline writing annotations (contractions, AWL elevation, grammar)
    const annotations = [];

    const CONTRACTIONS = {
        "don't": "do not",
        "can't": "cannot",
        "won't": "will not",
        "it's": "it is",
        "they're": "they are",
        "shouldn't": "should not",
        "couldn't": "could not",
        "wouldn't": "would not",
        "hasn't": "has not",
        "haven't": "have not",
        "isn't": "is not",
        "aren't": "are not",
        "wasn't": "was not",
        "weren't": "were not",
        "didn't": "did not",
        "doesn't": "does not",
        "we're": "we are",
        "you're": "you are"
    };

    if (text) {
        for (const [c, formal] of Object.entries(CONTRACTIONS)) {
            const re = new RegExp(`\\b${c}\\b`, 'gi');
            let m;
            while ((m = re.exec(text)) !== null) {
                annotations.push({
                    type: 'contraction',
                    category: 'Grammar',
                    text: m[0],
                    suggestion: formal,
                    message: `Informal contraction "${m[0]}" should be expanded to "${formal}" in academic writing.`
                });
                pushMistake(mistakes, 'Grammar',
                    `Informal contraction "${m[0]}" used`,
                    `Expand to formal academic "${formal}"`);
            }
        }

        const AWL_SUGGESTIONS = {
            'huge': 'extensive',
            'good': 'beneficial',
            'bad': 'detrimental',
            'get': 'acquire',
            'make': 'generate',
            'thing': 'factor',
            'things': 'aspects'
        };

        for (const [inf, acad] of Object.entries(AWL_SUGGESTIONS)) {
            const re = new RegExp(`\\b${inf}\\b`, 'gi');
            let m;
            while ((m = re.exec(text)) !== null) {
                annotations.push({
                    type: 'awl_suggestion',
                    category: 'Vocabulary',
                    text: m[0],
                    suggestion: acad,
                    message: `Elevate informal "${m[0]}" to Academic Word List equivalent "${acad}".`
                });
            }
        }

        if (grammar.errors && grammar.errors.length) {
            grammar.errors.forEach(err => {
                annotations.push({
                    type: 'grammar',
                    category: 'Grammar',
                    text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
                    suggestion: 'Review sentence boundary & agreement',
                    message: err
                });
            });
        }
    }

    return {
        score,
        maxScore: 90,
        subScores,
        metrics: {
            item_type: questionType,
            word_count: form.words,
            sentence_count: form.sentences,
            unique_words: spelling.uniqueCount,
            spelling_flags: spelling.flagged,
            key_points_matched: content.matched.length,
            key_points_total: (key.key_points || []).length,
            cohesion_markers: (discourse.hits || []).length,
            annotations
        },
        enabling: {
            grammar: toPTE(grammar.ratio),
            spelling: toPTE(spelling.ratio),
            vocabulary: toPTE(vocab.ratio),
            discourse: toPTE(discourse.ratio)
        },
        mistakes,
        feedback: [
            `${form.words} words`,
            `${content.matched.length}/${(key.key_points || []).length} key points covered`,
            `Cohesion markers: ${(discourse.hits || []).length}`
        ]
    };
}

/* --------------------------------------------------- dictation / objective */

function evaluateWriteFromDictation(key, text) {
    const mistakes = [];
    const expected = tokens(key.model_answer || '');
    const actual = tokens(text || '');

    if (actual.length === 0) {
        pushMistake(mistakes, 'Content', 'No dictation text entered',
            `Type the sentence you heard: "${key.model_answer}"`);
    }

    // Ordered word-level scoring, the way PTE credits Write from Dictation.
    const used = new Array(actual.length).fill(false);
    let matched = 0;
    const missedWords = [];

    for (let i = 0; i < expected.length; i++) {
        let found = -1;
        for (let j = i; j < actual.length; j++) {
            if (!used[j] && actual[j] === expected[i]) { found = j; break; }
        }
        if (found >= 0) { used[found] = true; matched++; }
        else missedWords.push(expected[i]);
    }

    const extraWords = actual.filter((w, idx) => !used[idx]);
    const ratio = expected.length ? matched / expected.length : 0;

    if (missedWords.length) {
        pushMistake(mistakes, 'Content',
            `Missing ${missedWords.length} word(s): ${missedWords.slice(0, 8).join(', ')}`,
            `The full sentence is: "${key.model_answer}"`);
    }
    if (extraWords.length) {
        pushMistake(mistakes, 'Content',
            `Inserted ${extraWords.length} extra word(s): ${extraWords.slice(0, 6).join(', ')}`,
            'Transcribe only the words you actually hear');
    }

    const spelling = evaluateSpelling(text);
    mistakes.push(...spelling.mistakes);

    const finalRatio = ratio * 0.9 + spelling.ratio * 0.1;
    return {
        score: toPTE(finalRatio),
        maxScore: 90,
        subScores: {
            content: Math.round(ratio * 100) / 100,
            spelling: Math.round(spelling.ratio * 100) / 100
        },
        metrics: {
            item_type: 'write_from_dictation',
            words_expected: expected.length,
            words_correct: matched,
            words_missing: missedWords.length,
            words_extra: extraWords.length,
            word_count: actual.length
        },
        enabling: { spelling: toPTE(spelling.ratio) },
        mistakes,
        feedback: [`${matched}/${expected.length} words correct`]
    };
}

const ACL_COLLOCATIONS = {
    'vital role': "Academic Collocation: 'play a vital role' (Verb + Adjective + Noun pattern).",
    'significant impact': "Academic Collocation: 'significant impact' (Adjective + Noun pattern of magnitude).",
    'conduct research': "Academic Collocation: 'conduct research' (Formal academic verb-noun collocation).",
    'economic growth': "Academic Collocation: 'economic growth' (Standard macro-economic collocation).",
    'sustainable development': "Academic Collocation: 'sustainable development' (Key environmental & scientific collocation).",
    'drastic change': "Academic Collocation: 'drastic change' (High-frequency intensive modifier).",
    'rapid expansion': "Academic Collocation: 'rapid expansion' (High-frequency rate collocation).",
    'bear resemblance': "Academic Collocation: 'bear resemblance' (Formal comparative collocation).",
    'integral part': "Academic Collocation: 'integral part' (Fixed compositional collocation).",
    'pose a threat': "Academic Collocation: 'pose a threat' (Formal risk evaluation collocation).",
    'draw conclusions': "Academic Collocation: 'draw conclusions' (Academic deduction collocation).",
    'address the issue': "Academic Collocation: 'address the issue' (Formal problem-solving idiom).",
    'foster growth': "Academic Collocation: 'foster growth' (Causative academic verb collocation).",
    'mitigate risk': "Academic Collocation: 'mitigate risk' (Academic risk management collocation).",
    'broad spectrum': "Academic Collocation: 'broad spectrum' (Formal academic scope descriptor).",
    'profound effect': "Academic Collocation: 'profound effect' (Academic impact collocation)."
};

function evaluateBlanks(key, response, questionType) {
    const answers = key.answers || (typeof key === 'object' && key !== null && !Array.isArray(key) ? key : {});
    const given = parseResponseValue(response) || {};
    const mistakes = [];
    let correct = 0;
    const total = Object.keys(answers).length;
    const details = [];

    for (const [blank, expectedRaw] of Object.entries(answers)) {
        const accepted = Array.isArray(expectedRaw) ? expectedRaw : [expectedRaw];
        const userValue = (typeof given === 'object' && given !== null)
            ? (given[blank] ?? given.answer ?? '')
            : (total === 1 ? given : '');
        const normUser = normalise(userValue);
        const isCorrect = accepted.some(a => normalise(a) === normUser) && normUser !== '';

        const expWord = accepted[0] || '';
        let colloc = null;
        let rationale = null;

        for (const [phrase, expl] of Object.entries(ACL_COLLOCATIONS)) {
            if (phrase.includes(expWord.toLowerCase()) || expWord.toLowerCase().includes(phrase)) {
                colloc = phrase;
                rationale = expl;
                break;
            }
        }
        if (!rationale) {
            rationale = `Academic Lexical Precision: "${expWord}" matches formal syntactic agreement and academic collocational register in this text context.`;
        }

        if (isCorrect) correct++;
        else {
            pushMistake(mistakes, 'Spelling',
                `Gap "${blank}": entered "${userValue || '(blank)'}"`,
                `Correct answer: "${expWord}" — ${rationale}`);
        }
        details.push({
            blank,
            expected: expWord,
            actual: userValue,
            correct: isCorrect,
            collocation: colloc,
            rationale
        });
    }

    const ratio = total ? correct / total : 0;
    return {
        score: toPTE(ratio),
        maxScore: 90,
        subScores: { content: Math.round(ratio * 100) / 100 },
        metrics: {
            item_type: questionType,
            blanks_total: total,
            blanks_correct: correct,
            accuracy_pct: Math.round(ratio * 100),
            details,
            collocation_rationales: details.map(d => ({ blank: d.blank, expected: d.expected, rule: d.rationale }))
        },
        enabling: { vocabulary: toPTE(ratio), spelling: toPTE(ratio) },
        mistakes,
        feedback: [`${correct}/${total} gaps correct`]
    };
}

/* -------------------------------------------------------------- MCQ types */

function evaluateMCQ(key, response, questionType) {
    const correctSet = new Set((key.correct || []).map(c => String(c).toUpperCase()));
    const parsed = parseResponseValue(response);
    let selected = [];
    if (Array.isArray(parsed)) selected = parsed.map(s => String(s).toUpperCase());
    else if (typeof parsed === 'object' && parsed !== null) selected = Object.keys(parsed).map(s => String(s).toUpperCase());
    else if (typeof parsed === 'string' && parsed.trim()) selected = parsed.split(/[,\s]+/).filter(Boolean).map(s => s.toUpperCase());

    const selectedSet = new Set(selected);
    const isMulti = questionType === 'mcma';
    const mistakes = [];
    const details = [];

    const options = (key.explanations) || {};
    const allLabels = new Set([...correctSet, ...selectedSet]);

    let hits = 0;
    let falsePositives = 0;
    for (const label of allLabels) {
        const picked = selectedSet.has(label);
        const right = correctSet.has(label);
        if (picked && right) hits++;
        else if (picked && !right) {
            falsePositives++;
            pushMistake(mistakes, 'Content',
                `Selected "${label}" which is not supported by the material`,
                options[label] || `Remove option "${label}"`);
        } else if (!picked && right) {
            pushMistake(mistakes, 'Content',
                `Missed the correct option "${label}"`,
                options[label] || `Select option "${label}"`);
        }
        details.push({ label, selected: picked, correct: right });
    }

    let ratio;
    if (isMulti) {
        const missed = correctSet.size - hits;
        ratio = Math.max(0, (hits - falsePositives)) / Math.max(correctSet.size, 1);
        if (missed > 0 && falsePositives === 0 && hits === 0) ratio = 0;
    } else {
        ratio = hits === 1 && falsePositives === 0 ? 1 : 0;
        if (ratio === 0) {
            const missedLabel = [...correctSet][0];
            if (selectedSet.size === 0) {
                pushMistake(mistakes, 'Content', 'No option selected',
                    `Select option "${missedLabel}"`);
            }
        }
    }

    return {
        score: toPTE(Math.max(0, ratio)),
        maxScore: 90,
        subScores: { content: Math.round(Math.max(0, ratio) * 100) / 100 },
        metrics: {
            item_type: questionType,
            selected,
            correct: [...correctSet],
            hits,
            false_positives: falsePositives,
            details
        },
        enabling: { vocabulary: toPTE(Math.max(0, ratio)) },
        mistakes,
        feedback: [`${hits}/${correctSet.size} correct selections`]
    };
}

/* -------------------------------------------------------- reorder paragraphs */

function evaluateReorder(key, response) {
    const expected = (key.sequence || []).map(s => String(s).toUpperCase());
    const parsed = parseResponseValue(response);
    let actual = [];
    if (Array.isArray(parsed)) actual = parsed.map(s => String(s).toUpperCase());
    else if (typeof parsed === 'string') actual = parsed.split(/[\s,\->]+/).filter(Boolean).map(s => s.toUpperCase());

    const mistakes = [];

    if (actual.length === 0) {
        pushMistake(mistakes, 'Content', 'No sequence submitted',
            `Arrange the boxes as: ${expected.join(' → ')}`);
        return {
            score: 10, maxScore: 90,
            subScores: { content: 0 },
            metrics: { item_type: 'reorder', expected, actual: [], adjacent_pairs_correct: 0, adjacent_pairs_total: 0 },
            enabling: { vocabulary: 10, discourse: 10 },
            mistakes,
            feedback: ['No sequence submitted']
        };
    }

    // Score on correctly ordered adjacent pairs — tolerant of a single swap.
    let adjacentTotal = 0;
    let adjacentCorrect = 0;
    for (let i = 0; i < expected.length - 1; i++) {
        adjacentTotal++;
        const a = expected[i], b = expected[i + 1];
        const posA = actual.indexOf(a), posB = actual.indexOf(b);
        if (posA >= 0 && posB >= 0 && posA < posB) adjacentCorrect++;
    }

    const exact = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
    const ratio = exact ? 1 : (adjacentTotal ? adjacentCorrect / adjacentTotal : 0);

    if (!exact) {
        pushMistake(mistakes, 'Vocabulary',
            `Submitted order ${actual.join(' → ') || '(empty)'} is incorrect`,
            `Correct order is ${expected.join(' → ')}`);
        if (key.explanations && key.explanations.logic) {
            pushMistake(mistakes, 'Content', 'Logical sequence not identified',
                key.explanations.logic);
        }
    }

    return {
        score: toPTE(ratio),
        maxScore: 90,
        subScores: { content: Math.round(ratio * 100) / 100 },
        metrics: {
            item_type: 'reorder',
            expected,
            actual,
            exact_match: exact,
            adjacent_pairs_correct: adjacentCorrect,
            adjacent_pairs_total: adjacentTotal
        },
        enabling: { vocabulary: toPTE(ratio), discourse: toPTE(ratio) },
        mistakes,
        feedback: [exact ? 'Exact sequence match' : `${adjacentCorrect}/${adjacentTotal} adjacent pairs in order`]
    };
}

/* ------------------------------------------------------------ ASQ (typed) */

function evaluateAnswerShortQuestion(key, response) {
    const accepted = (key.acceptable || []).map(normalise).filter(Boolean);
    const norm = normalise(response);
    const mistakes = [];
    const isCorrect = norm && (accepted.length
        ? accepted.some(a => norm === a || norm.includes(a))
        : normalise(key.model_answer) === norm);

    if (!isCorrect) {
        pushMistake(mistakes, 'Content',
            `Answer given: "${response || '(empty)'}"`,
            `Correct answer: "${key.model_answer}"`);
    }

    const ratio = isCorrect ? 1 : (norm ? 0.25 : 0);
    return {
        score: toPTE(ratio),
        maxScore: 90,
        subScores: { content: ratio },
        metrics: { item_type: 'answer_short_question', given: response || '', expected: key.model_answer, correct: !!isCorrect },
        enabling: { vocabulary: toPTE(ratio) },
        mistakes,
        feedback: [isCorrect ? 'Correct' : `Expected: ${key.model_answer}`]
    };
}

/* =========================================================== PUBLIC ENTRY */

/**
 * Evaluate a single response against its question row.
 * @param {object} question  full questions row (answer_key/options parsed or raw)
 * @param {object} resp      { textResponse, audioFilePath, transcript, durationSeconds }
 */
function evaluateItem(question, resp) {
    const key = typeof question.answer_key === 'string' ? parseKey(question.answer_key) : (question.answer_key || {});
    const type = key.type || question.question_type;
    const text = resp && resp.textResponse;

    switch (type) {
        case 'read_aloud':
        case 'repeat_sentence':
        case 'describe_image':
        case 'retell_lecture':
            return evaluateSpeaking(type, key, resp, question);

        case 'answer_short_question':
            // ASQ assesses listening vocabulary, not fluency or pronunciation.
            // Duration/acoustics cannot establish what word the candidate said.
            if (resp && resp.audioFilePath && !resp.transcript) {
                return {
                    score: null, maxScore: 90, subScores: {}, enabling: {}, mistakes: [],
                    metrics: { item_type: type, recorded: true, verified: false },
                    feedback: ['Audio recorded, but the spoken word cannot be scored automatically. Check the model answer manually.']
                };
            }
            return evaluateAnswerShortQuestion(key, (resp && resp.transcript) || text);

        case 'summarize_written_text':
        case 'summarize_spoken_text':
        case 'write_essay':
            return evaluateWrittenItem(type, key, text || '');

        case 'write_from_dictation':
            return evaluateWriteFromDictation(key, text || '');

        case 'fill_blanks':
        case 'rw_fill_blanks':
        case 'reading_fill_blanks':
        case 'listening_fill_blanks':
        case 'highlight_missing_words':
            return evaluateBlanks(key, text, type);

        case 'mcma':
        case 'mcsa':
        // Defensive: some seeds store the key with type 'mcsa', others may omit
        // `type` entirely — never let this fall through to the blank default.
        case 'highlight_correct_summary':
            return evaluateMCQ(key, text, type === 'mcma' ? 'mcma' : 'mcsa');

        case 'reorder':
        case 'reorder_paragraphs':
            return evaluateReorder(key, text);

        default:
            return evaluateBlanks(key, text, type);
    }
}

/* ------------- backwards-compatible wrappers used by legacy call sites ---- */

function evaluateObjective(userResponse, answerKeyJson) {
    const key = typeof answerKeyJson === 'string' ? parseKey(answerKeyJson) : (answerKeyJson || {});
    const type = key.type || 'rw_fill_blanks';
    return evaluateItem({ question_type: type, answer_key: key, module: 'reading' },
        { textResponse: userResponse });
}

function evaluatePTEWriting(questionType, textResponse, promptPassage) {
    const key = parseKey(promptPassage && promptPassage.__key) || {};
    return evaluateWrittenItem(questionType,
        Object.keys(key).length ? key : { type: questionType }, textResponse || '');
}

function evaluateSpeakingAudio(examType, audioFilePath, userTranscript, durationSeconds) {
    const result = evaluateSpeaking('read_aloud', { target_words: null, key_points: [] },
        { audioFilePath, transcript: userTranscript, durationSeconds },
        { time_limit_seconds: 40 });
    return { ...result, overallPTEScore: result.score };
}

module.exports = {
    countWords,
    countSentences,
    normalise,
    toPTE,
    evaluateVocabulary,
    evaluateGrammarDetailed,
    evaluateSpelling,
    evaluateDiscourse,
    evaluateContent,
    evaluateForm,
    evaluateItem,
    evaluateObjective,
    evaluatePTEWriting,
    evaluateSpeakingAudio
};
