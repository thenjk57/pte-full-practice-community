#!/usr/bin/env node
/**
 * ============================================================================
 *  generate_mock_bank.js — build 29 additional full-length PTE mock tests
 * ============================================================================
 *
 *  Sources:
 *    content/sources/wiki/*.json        downloaded open-licensed corpus
 *                                       (Wikipedia, CC BY-SA 4.0 — attribution
 *                                       recorded per item via answer_key.source)
 *    content/sources/gutenberg/*.txt    Project Gutenberg public-domain books
 *    database/banks/essays.js           original essay topics (authored)
 *    database/banks/spoken.js           original ASQ + Repeat Sentence bank
 *    database/banks/charts.js           original chart specifications
 *
 *  ALL QUESTIONS ARE ORIGINAL COMPOSITIONS in the PTE format. No Pearson test
 *  content is used. Every corpus-derived item records its source article in
 *  answer_key.source = { title, url, license } (the exam API never exposes
 *  answer_key, so provenance travels with the data without leaking answers).
 *
 *  Structure per test (identical to the official three-part format):
 *    Part 1  Speaking & Writing  22 items
 *    Part 2  Reading             12 items
 *    Part 3  Listening           11 items
 *
 *  Invariants enforced before insert:
 *    - every sentence is used at most ONCE across all 30 tests
 *    - answer_key shapes validated against the evaluator/renderer contract
 *    - essay 200–300w, SWT 5–75w (1 sentence), SST 50–70w
 *    - every 'once' audio item has an mp3 path AND a script for generation
 *
 *  Usage:
 *    node database/generate_mock_bank.js               # add tests 2..30
 *    --force is disabled: existing questions/attempts are never deleted
 *    node database/generate_mock_bank.js --dry         # build + validate only
 *    node database/generate_mock_bank.js --verify-media # after audio run
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const { initDB, runQuery, queryAll, queryOne } = require('./db');
const { splitSourceSections, passageIssues, isSuitableBlank, documentFrequencies } = require('./question_quality');
let vocabularyFrequency = new Map();
const { bindAudio, alignmentIssues, verifyAudioFile } = require('./audio_contract');

const ROOT = path.join(__dirname, '..');
const WIKI_DIR = path.join(ROOT, 'content', 'sources', 'wiki');
const GUT_DIR = path.join(ROOT, 'content', 'sources', 'gutenberg');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio', 'exam', 'gen');
const MEDIA_BASE = '/audio/exam/gen/v2/';

/* ============================================================ CLI options */
const args = process.argv.slice(2);
const OPT = {
    force: args.includes('--force'),
    dry: args.includes('--dry'),
    verifyMedia: args.includes('--verify-media'),
    firstTest: 2,
    lastTest: 30,
};
const argVal = (name) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : null;
};
if (argVal('--from')) OPT.firstTest = argVal('--from');
if (argVal('--to')) OPT.lastTest = argVal('--to');

/* ==================================================================== RNG */
function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rnd = mulberry32(20260922);
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const choice = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

/* =========================================================== text helpers */
const STOP = new Set(`the of and to in a is that for on as with by it this be are was or from an at which we can has have not but its their there they said also more one two into than then when such may been will would could should other some any each both all most much many very just also about after before over under between during through` .split(/\s+/));

function words(s) { return (s || '').trim().split(/\s+/).filter(Boolean); }
function wc(s) { return words(s).length; }

const ABBREV = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'e.g.', 'i.e.', 'etc.', 'et al.',
    'Ph.D.', 'vs.', 'approx.', 'No.', 'U.S.', 'U.K.', 'a.m.', 'p.m.', 'St.', 'Fig.'];

function splitSentences(text) {
    let t = String(text).replace(/\[\d+(?:[,\s]+\d+)*\]/g, ' ').replace(/\[[^\]]{0,50}\]/g, ' ');
    const map = {};
    ABBREV.forEach((a, i) => {
        const ph = `\u0001${i}\u0001`;
        if (t.includes(a)) { t = t.split(a).join(ph); map[ph] = a; }
    });
    t = t.replace(/\s+/g, ' ').trim();
    const parts = t.split(/(?<=[.!?])\s+(?=["“(]?[A-Z])/);
    return parts
        .map((s) => { for (const ph in map) s = s.split(ph).join(map[ph]); return s.trim(); })
        .filter((s) => s.length > 10);
}

function stripTrailingPunct(s) { return s.replace(/[.!?]+$/, ''); }
function lcFirst(s) { return s ? s[0].toLowerCase() + s.slice(1) : s; }

/* -------- proper-noun detection from the corpus (sentence-case safe) ----- */
const lowerSeen = new Set();   // word seen fully lowercase anywhere
const upperMidSeen = new Set(); // word seen capitalised NOT at sentence start
function learnCase(sentences) {
    for (const s of sentences) {
        const toks = s.split(/\s+/);
        toks.forEach((tok, i) => {
            const bare = tok.replace(/[^A-Za-z'-]/g, '');
            if (!bare || bare.length < 3) return;
            if (/^[a-z]/.test(bare)) lowerSeen.add(bare.toLowerCase());
            else if (i > 0 && /^[A-Z][a-z']+$/.test(bare)) upperMidSeen.add(bare);
        });
    }
}
function isProper(word) { return upperMidSeen.has(word) && !lowerSeen.has(word.toLowerCase()); }
/** Lower-case the first word of a sentence unless it behaves like a proper noun. */
function demote(s) {
    const m = String(s).match(/^([A-Za-z']+)/);
    if (!m) return s;
    const w = m[1];
    if (isProper(w)) return s;
    return lcFirst(s);
}

/* content words for key points / overlap checks */
function contentWords(s) {
    return (s || '').toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 5 && !STOP.has(w) && !/^\d+$/.test(w));
}
function overlapRatio(a, b) {
    const A = new Set(contentWords(a)), B = new Set(contentWords(b));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    for (const w of A) if (B.has(w)) inter++;
    return inter / Math.min(A.size, B.size);
}
function keyPointsFrom(text, n = 11) {
    const seen = new Set();
    const out = [];
    for (const w of contentWords(text)) {
        if (seen.has(w)) continue;
        seen.add(w);
        out.push(w);
        if (out.length >= n) break;
    }
    return out;
}

/* ============================================================== corpus I/O */
function splitSections(text) {
    return splitSourceSections(text);
}

function cleanParagraph(p) {
    let t = String(p);
    t = t.replace(/\{\{[^}]*\}\}/g, ' ');
    t = t.split('\n').filter((l) => !/^\s*[*#|=|>]/.test(l)).join(' ');
    t = t.replace(/\(\s*listen\s*\)/ig, ' ').replace(/\(\s*\w+\s*audio\s*\)/ig, ' ');
    t = t.replace(/\s+/g, ' ').trim();
    return t;
}

function splitParagraphs(sectionText) {
    return sectionText.split(/\n\s*\n/)
        .map(cleanParagraph)
        .filter((p) => wc(p) >= 12);
}

/* ------------------------------------------------------------- pool build */
const usedSentences = new Set(); // global: every sentence consumed at most once
function sHash(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }

const pools = {
    ra: [],           // 2-3 sentence windows, 36-56 words  (Read Aloud)
    long: [],         // 230-320 word passages               (SWT, reading MCQ)
    seq: [],          // 4 sentence windows, 40-90 words     (reorder)
    fib: [],          // 90-150 word paragraphs              (R/FIB, RW/FIB)
    script: [],       // 5-8 sentence windows, 85-165 words  (RL, SST, L-MCQ, HCS)
    scriptSmall: [],  // 3-4 sentence windows, 45-90 words   (L-FIB, HMW)
    wfd: [],          // single sentences, 11-16 words       (dictation)
    single: [],       // single sentences, 8-20 words        (MCQ options/distractors)
};

function pushWindow(pool, sentences, src, extra = {}) {
    const text = sentences.join(' ');
    const w = wc(text);
    if (w < 5 || passageIssues(text, vocabularyFrequency).length) return;
    pool.push({ sentences: sentences.slice(), text, words: w, src, ...extra });
}

function buildPoolsFromArticle(art) {
    const sections = splitSections(art.extract);
    for (const sec of sections) {
        const paras = splitParagraphs(sec.text);
        /* ---- long passages: accumulate paragraphs to the 230-320 budget ---- */
        let buf = [], bufW = 0;
        for (const p of paras) {
            buf.push(p); bufW += wc(p);
            if (bufW >= 230) {
                if (bufW <= 320) {
                    const text = buf.join(' ');
                    const sents = splitSentences(text);
                    const shortish = sents.filter((s) => { const n = wc(s); return n >= 8 && n <= 20; }).length;
                    if (sents.length >= 4 && shortish >= 3) {
                        pushWindow(pools.long, sents, art);
                    }
                }
                buf = []; bufW = 0;
            }
        }
        /* ---- paragraph-level pools ---- */
        for (const p of paras) {
            const sents = splitSentences(p);
            if (!sents.length) continue;

            /* Read Aloud windows: 36-56 words */
            for (let len = 2; len <= 3; len++) {
                for (let i = 0; i + len <= sents.length; i++) {
                    const win = sents.slice(i, i + len);
                    const w = wc(win.join(' '));
                    if (w >= 36 && w <= 56) pushWindow(pools.ra, win, art);
                }
            }
            /* Reorder: 4 sentences each 7-20 words, total 40-90 */
            for (let i = 0; i + 4 <= sents.length; i++) {
                const win = sents.slice(i, i + 4);
                const w = wc(win.join(' '));
                if (w >= 40 && w <= 90 && win.every((s) => { const n = wc(s); return n >= 7 && n <= 20; })) {
                    pushWindow(pools.seq, win, art);
                }
            }
            /* Reading fill-in passages: 90-150 words with enough blankable tokens */
            const w = wc(p);
            if (w >= 90 && w <= 150 && blankableTokens(p).length >= 6) {
                pushWindow(pools.fib, sents, art);
            } else if (w > 150) {
                /* long paragraph: take a 90-150 word sentence window from it */
                for (let i = 0; i < sents.length; i++) {
                    let acc = [], n = 0;
                    for (let j = i; j < sents.length; j++) {
                        acc.push(sents[j]); n += wc(sents[j]);
                        if (n >= 90) {
                            if (n <= 150 && blankableTokens(acc.join(' ')).length >= 6) {
                                pushWindow(pools.fib, acc, art);
                            }
                            break;
                        }
                    }
                }
            }
            /* Listening scripts (spoken pools): wiki only */
            if (art.kind === 'wiki') {
                for (let len = 5; len <= 8; len++) {
                    for (let i = 0; i + len <= sents.length; i++) {
                        const win = sents.slice(i, i + len);
                        const ww = wc(win.join(' '));
                        if (ww >= 85 && ww <= 165) pushWindow(pools.script, win, art);
                    }
                }
                for (let len = 3; len <= 4; len++) {
                    for (let i = 0; i + len <= sents.length; i++) {
                        const win = sents.slice(i, i + len);
                        const ww = wc(win.join(' '));
                        if (ww >= 45 && ww <= 90) pushWindow(pools.scriptSmall, win, art);
                    }
                }
            }
            /* sentence-level candidates */
            for (const s of sents) {
                const n = wc(s);
                if (n >= 8 && n <= 20) {
                    pushWindow(pools.single, [s], art);
                }
                if (art.kind === 'wiki' && goodWFD(s)) {
                    pushWindow(pools.wfd, [s], art);
                }
            }
        }
    }
}

/* ---------------------------------------------------------- taking items */
function windowFree(win) {
    return win.every((s) => !usedSentences.has(sHash(s)));
}
function markUsed(win) { win.forEach((s) => usedSentences.add(sHash(s))); }

function take(poolName, label) {
    const pool = pools[poolName];
    for (let attempt = 0; attempt < pool.length; attempt++) {
        const cand = pool[attempt];
        if (windowFree(cand.sentences)) {
            markUsed(cand.sentences);
            pool.splice(attempt, 1);
            return cand;
        }
    }
    throw new Error(`Pool exhausted: ${poolName} (needed for ${label}). Fetch more sources.`);
}

/** Take the first pool item that is sentence-fresh AND passes `pred`.
 *  Rejected candidates stay in the pool for later use. */
function takeWhere(poolName, label, pred, tries = 150) {
    const pool = pools[poolName];
    const limit = Math.min(tries, pool.length);
    let fresh = 0, rejected = 0;
    for (let attempt = 0; attempt < limit; attempt++) {
        const cand = pool[attempt];
        if (!windowFree(cand.sentences)) continue;
        fresh++;
        if (pred(cand)) {
            markUsed(cand.sentences);
            pool.splice(attempt, 1);
            return cand;
        }
        rejected++;
    }
    throw new Error(`No matching pool item: ${poolName} (needed for ${label}). `
        + `Scanned ${limit}/${pool.length}, fresh=${fresh}, pred-rejected=${rejected}. Fetch more sources.`);
}

function takeSingle(pred, label) {
    for (let attempt = 0; attempt < pools.single.length; attempt++) {
        const cand = pools.single[attempt];
        if (windowFree(cand.sentences) && (!pred || pred(cand.text))) {
            markUsed(cand.sentences);
            pools.single.splice(attempt, 1);
            return cand;
        }
    }
    throw new Error(`Single-sentence pool exhausted (needed for ${label}).`);
}

/* ------------------------------------------------------------ WFD filter */
function goodWFD(s) {
    const n = wc(s);
    if (n < 11 || n > 16) return false;
    if (!/\.$/.test(s)) return false;
    if (/[;:—–/\\()"“”\[\]]/.test(s)) return false;
    if (/\d/.test(s)) return false;
    if (/^(Figure|Table|See|Note|However|Thus)\b/.test(s)) return false;
    const caps = (s.match(/\b[A-Z][a-z]+/g) || []).length;
    if (caps > 2) return false;                   // at most one proper noun
    if (/^[a-z]/.test(s)) return false;
    return true;
}

/* ---------------------------------------------------- blankable tokens --- */
function blankableTokens(text) {
    return text.split(/\s+/).map((t) => t.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ''))
        .filter((w) => isSuitableBlank(w, vocabularyFrequency) && !STOP.has(w));
}

/* ------------------------------------------- clause machinery for summaries */
function clauseCandidates(sentences, lo = 7, hi = 22) {
    return sentences.filter((s) => {
        const n = wc(s);
        if (n < lo || n > hi) return false;
        if (!/\.$/.test(s)) return false;
        if (/\?/.test(s)) return false;
        if (/^[0-9"'“(]/.test(s)) return false;
        if (!/^[A-Z][a-z']+$/.test(s.split(/\s+/)[0] || '')) return false;   // simple sentence-initial word
        if (s.includes(':') || s.includes(';') || s.includes('—')) return false;
        if (stripTrailingPunct(s).includes('.')) return false;  // abbreviations/decimals break sentence counting
        return true;
    }).map(demote).map(stripTrailingPunct);
}

/** One-sentence model summary for SWT: 5–75 words, exactly one sentence. */
function swtModel(sentences) {
    const cl = clauseCandidates(sentences);
    if (cl.length < 2) return null;
    let model = `The passage explains that ${cl[0]}, and further shows that ${cl[1]}, demonstrating why this topic matters in academic study.`;
    if (wc(model) > 70 && cl[1]) {
        model = `The passage explains that ${cl[0]}, and shows that ${cl[1]}.`;
    }
    if (wc(model) < 12) return null;
    return model;
}

/** SST model: one flowing sentence, 50–70 words. */
function sstModel(sentences) {
    const cl = clauseCandidates(sentences, 7, 18);
    if (cl.length < 3) return null;
    const connectors = ['and that', 'while also noting that', 'and finally that'];
    let model = `In the lecture, the speaker explained that ${cl[0]}`;
    let i = 1;
    let conn = 0;
    while (i < cl.length && wc(model) + wc(cl[i]) + 4 < 66) {
        model += `, ${connectors[Math.min(conn, connectors.length - 1)]} ${cl[i]}`;
        conn++; i++;
    }
    model += ', showing how these points connect to the wider debate.';
    const w = wc(model);
    if (w < 50 || w > 70) {
        if (w > 70) {
            // rebuild with fewer clauses
            let m2 = `In the lecture, the speaker explained that ${cl[0]}, and that ${cl[1]}, showing how these points connect to the wider debate.`;
            if (wc(m2) >= 50 && wc(m2) <= 70) return m2;
            return null;
        }
        if (cl.length >= 4 && w < 50) {
            const m3 = `In the lecture, the speaker explained that ${cl[0]}, and that ${cl[1]}, while also noting that ${cl[2]}, and finally that ${cl[3]}, showing how these points connect to the wider debate.`;
            if (wc(m3) <= 70) return m3;
        }
    }
    return wc(model) >= 50 && wc(model) <= 70 ? model : null;
}

/** Re-tell Lecture model answer (two sentences, ~45–70 words). */
function rlModel(sentences) {
    const cl = clauseCandidates(sentences, 7, 20);
    if (cl.length < 3) return null;
    let m = `The lecture explained that ${cl[0]} and that ${cl[1]}. It also highlighted that ${cl[2]}, which the speaker presented as the central conclusion.`;
    if (wc(m) > 78 && cl[3]) m = `The lecture explained that ${cl[0]} and that ${cl[1]}. The speaker concluded that ${cl[2]}.`;
    return m;
}

/** Highlight-correct-summary option text (~25–45 words). */
function summaryStatement(sentences) {
    const cl = clauseCandidates(sentences, 6, 18);
    if (cl.length < 2) return null;
    let s = `This recording explains that ${cl[0]} and that ${cl[1]}`;
    if (cl[2] && wc(s) + wc(cl[2]) < 42) s += `, and adds that ${cl[2]}`;
    s += '.';
    return s;
}

/** Main-idea option for reading MCSA / distractor statements. */
function argStatement(sentences) {
    const cl = clauseCandidates(sentences, 8, 22);
    if (!cl.length) return null;
    return `The passage argues that ${cl[0]}.`;
}

/* ==================================================== banks (may be async) */
let BANKS = null;
function loadBanks() {
    const essays = require('./banks/essays');
    const spoken = require('./banks/spoken');
    const charts = require('./banks/charts');
    const problems = [];
    if (essays.length < 58) problems.push(`essays.js has ${essays.length}, need >= 58`);
    if (!spoken || !Array.isArray(spoken.asq) || spoken.asq.length < 116) problems.push(`spoken.asq needs >= 116`);
    if (!spoken || !Array.isArray(spoken.rs) || spoken.rs.length < 116) problems.push(`spoken.rs needs >= 116`);
    if (!Array.isArray(charts) || charts.length < 40) problems.push(`charts.js needs >= 40`);
    if (problems.length) throw new Error('Bank validation failed:\n  ' + problems.join('\n  '));
    BANKS = { essays, spoken, charts };
    return BANKS;
}

/* ================================================== item builders ====== */
const PROMPTS = {
    read_aloud: 'Look at the text below. You have 35 seconds to prepare. Read the text aloud in 40 seconds as naturally and clearly as you can.',
    repeat_sentence: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.',
    describe_image: 'You have 25 seconds to prepare. Describe the image in 40 seconds. Mention the main feature, the highest and lowest values, and a concluding statement.',
    retell_lecture: 'You will hear a short lecture. It plays ONLY ONCE. You have 10 seconds to prepare, then 40 seconds to re-tell it in your own words.',
    answer_short_question: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
    summarize_written_text: 'Summarise the passage below in ONE single sentence of between 5 and 75 words. You have 10 minutes. Content, form, grammar, vocabulary and written discourse are all scored.',
    essay: 'You have 20 minutes to plan, write and revise an essay of 200–300 words.',
    mcma_read: 'Read the passage and choose THREE correct options. Wrong answers incur a negative penalty, so select only what the text supports.',
    reorder: 'The text boxes below are in random order. Restore the original sequence by arranging them in logical order.',
    r_fib: 'Drag or type the most appropriate word into each gap. One word only per gap.',
    rw_fib: 'Select the appropriate word from each dropdown list to complete the passage correctly.',
    sst: 'You will hear a short recording. It plays ONLY ONCE. Write a summary of 50–70 words for a student who missed the lecture. You have 10 minutes.',
    l_mcma: 'You will hear a recording. It plays ONLY ONCE. Choose the THREE statements that were made by the speaker.',
    l_fib: 'You will hear a recording. It plays ONLY ONCE. Type the missing words into the gaps as you hear them.',
    hcs: 'You will hear a recording. It plays ONLY ONCE. Choose the summary that best represents what you heard.',
    l_mcsa: 'You will hear a recording. It plays ONLY ONCE. Choose the ONE statement that was made by the speaker.',
    hmw: 'You will hear a recording. It plays ONLY ONCE. As you listen, select the word that fills each gap in the displayed text.',
    wfd: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it, paying close attention to spelling and punctuation.',
};

const ENABLING = {
    read_aloud: ['fluency', 'pronunciation'],
    repeat_sentence: ['fluency', 'pronunciation', 'grammar'],
    describe_image: ['fluency', 'pronunciation', 'content'],
    retell_lecture: ['fluency', 'pronunciation', 'content'],
    answer_short_question: ['fluency', 'pronunciation', 'content'],
    summarize_written_text: ['grammar', 'spelling', 'vocabulary', 'discourse'],
    write_essay: ['grammar', 'spelling', 'vocabulary', 'discourse'],
    mcma: ['vocabulary'],
    mcsa: ['vocabulary'],
    reorder_paragraphs: ['vocabulary', 'discourse'],
    reading_fill_blanks: ['vocabulary', 'spelling'],
    rw_fill_blanks: ['vocabulary'],
    summarize_spoken_text: ['grammar', 'spelling', 'vocabulary', 'discourse'],
    listening_fill_blanks: ['spelling', 'vocabulary'],
    highlight_correct_summary: ['vocabulary'],
    highlight_missing_words: ['vocabulary'],
    write_from_dictation: ['spelling', 'grammar'],
};

const AUDIO_CODE = {
    repeat_sentence: 'rs', retell_lecture: 'rl', answer_short_question: 'asq',
    summarize_spoken_text: 'sst', listening_fill_blanks: 'lfib',
    highlight_correct_summary: 'hcs', highlight_missing_words: 'hmw',
    write_from_dictation: 'wfd',
};

function srcTag(item) {
    return { title: item.src.title, url: item.src.url, license: item.src.license };
}
function shortTitle(t, max = 46) {
    return t.length > max ? t.slice(0, max - 1).trim() + '…' : t;
}
function mediaPath(testNo, type, order) {
    const code = AUDIO_CODE[type] || type.slice(0, 4);
    return `${MEDIA_BASE}t${String(testNo).padStart(2, '0')}_${code}_${String(order).padStart(2, '0')}.mp3`;
}

/* --------------------------------------------------------------- charts -- */
function jitter(v) { return Math.max(1, Math.round(v * (0.92 + rnd() * 0.16))); }
function formatVal(v, unit) {
    if (unit === '%') return `${v}%`;
    return `${v} ${unit}`;
}
function diModel(chart) {
    const { type, title, categories, values, unit } = chart;
    const t = demote(title.replace(/\.$/, ''));
    const maxI = values.indexOf(Math.max(...values));
    const minI = values.indexOf(Math.min(...values));
    const hi = formatVal(values[maxI], unit), lo = formatVal(values[minI], unit);
    if (type === 'line') {
        const trend = values[values.length - 1] > values[0] ? 'upward' : values[values.length - 1] < values[0] ? 'downward' : 'generally flat';
        return `The line graph shows ${t}. The overall trend is ${trend}, moving from ${formatVal(values[0], unit)} in ${categories[0]} to ${formatVal(values[values.length - 1], unit)} in ${categories[categories.length - 1]}. The highest value is ${hi} in ${categories[maxI]}, while the lowest is ${lo} in ${categories[minI]}. Overall, the data show a clear change across the period shown.`;
    }
    if (type === 'pie') {
        return `The pie chart shows ${t} divided across ${categories.length} categories. ${categories[maxI]} accounts for the largest share at ${hi}, whereas ${categories[minI]} is the smallest at ${lo}. Together, the remaining categories make up the balance of the total.`;
    }
    return `The bar chart shows ${t}. ${categories[maxI]} records the highest figure at ${hi}, while ${categories[minI]} is the lowest at ${lo}. The other categories fall between these two extremes, and overall the chart reveals a substantial gap between the largest and smallest groups.`;
}
function diKeyPoints(chart) {
    const values = chart.values;
    const maxI = values.indexOf(Math.max(...values));
    const minI = values.indexOf(Math.min(...values));
    const titleWords = keyPointsFrom(chart.title, 3);
    const base = chart.type === 'line' ? ['graph', 'trend'] : chart.type === 'pie' ? ['pie', 'chart', 'share'] : ['bar', 'chart'];
    return [...new Set([...base, chart.categories[maxI], chart.categories[minI], 'highest', 'lowest', ...titleWords])]
        .filter((k) => k && k.length >= 4);
}

/* ------------------------------------------------------------ blank maker */
function makeBlanks(text, count, opts = {}) {
    const tokens = text.split(/(\s+)/);            // keep whitespace tokens
    const idxs = [];
    tokens.forEach((tok, i) => {
        if (/^\s+$/.test(tok)) return;
        const bare = tok.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
        if (isSuitableBlank(bare, vocabularyFrequency) && !STOP.has(bare)) idxs.push(i);
    });
    // spread picks across the token stream
    const pick = [];
    const step = Math.max(1, Math.floor(idxs.length / (count + 1)));
    for (let i = step; i < idxs.length && pick.length < count; i += step) {
        if (!pick.includes(idxs[i])) pick.push(idxs[i]);
    }
    for (let i = 0; i < idxs.length && pick.length < count; i++) {
        if (!pick.includes(idxs[i]) && idxs[i] > 2 && idxs[i] < tokens.length - 3) pick.push(idxs[i]);
    }
    pick.sort((a, b) => a - b);
    if (pick.length < count) return null;

    const answers = {};
    const parts = tokens.slice();
    pick.forEach((i, n) => {
        const tok = tokens[i];
        const bare = tok.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, '');
        const prefix = tok.match(/^[^A-Za-z']*/)[0];
        const suffix = (tok.match(/[^A-Za-z']+$/) || [''])[0];
        answers[`blank${n + 1}`] = opts.upper ? bare : bare;
        parts[i] = `${prefix}[blank${n + 1}]${suffix}`;
    });
    return { passage: parts.join(''), answers };
}

function distractorWords(count, avoidText) {
    const avoid = new Set(contentWords(avoidText));
    const out = [];
    let guard = 0;
    while (out.length < count && guard++ < 400) {
        const cand = choice(pools.single).text;
        const cw = contentWords(cand).filter(w => isSuitableBlank(w, vocabularyFrequency));
        if (!cw.length) continue;
        const w = choice(cw);
        if (w && !avoid.has(w) && !out.includes(w)) out.push(w);
    }
    if (out.length < count) throw new Error('Insufficient suitable vocabulary for distractors');
    return out;
}

/* ==================================================== test assembly ===== */
const TYPE_SPEC = {
    read_aloud: 6, repeat_sentence: 4, describe_image: 3, retell_lecture: 2,
    answer_short_question: 4, summarize_written_text: 1, write_essay: 2,
    mcma: 1, reorder_paragraphs: 2, mcsa: 1, reading_fill_blanks: 4,
    rw_fill_blanks: 4, summarize_spoken_text: 1, listening_fill_blanks: 3,
    highlight_correct_summary: 1, highlight_missing_words: 1,
    write_from_dictation: 3,
    // listening-only instances are distinguished during validation
};
const LISTENING_TYPES = new Set(['summarize_spoken_text', 'listening_fill_blanks', 'highlight_correct_summary', 'highlight_missing_words', 'write_from_dictation']);
void LISTENING_TYPES;

function buildTest(testNo) {
    const qs = [];
    let order = 0;
    const tIdx = testNo - 1;                       // 0-based bank rotation
    const base = (part, title) => ({
        part,
        part_title: part === 1 ? 'Part 1: Speaking & Writing' : part === 2 ? 'Part 2: Reading' : 'Part 3: Listening',
        test_no: testNo,
        title,
    });

    /* ---------------- PART 1: Speaking & Writing (22) ------------------- */
    for (let i = 0; i < 6; i++) {                  // Read Aloud ×6
        const item = take('ra', 'read_aloud');
        const passage = item.text;
        const kp = keyPointsFrom(passage, 12);
        qs.push({
            ...base(1, `Read Aloud ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'speaking', question_type: 'read_aloud', item_order: ++order,
            max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: PROMPTS.read_aloud, passage, media_url: null, options: null,
            scored_enabling: ENABLING.read_aloud,
            model_answer: passage,
            answer_key: { type: 'read_aloud', target_words: wc(passage), model_answer: passage, key_points: kp, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 4; i++) {                  // Repeat Sentence ×4
        const sentence = BANKS.spoken.rs[(tIdx * 4 + i) % BANKS.spoken.rs.length];
        qs.push({
            ...base(1, `Repeat Sentence ${i + 1}`),
            module: 'speaking', question_type: 'repeat_sentence', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 15, audio_play_policy: 'once',
            prompt: PROMPTS.repeat_sentence, passage: null,
            media_url: mediaPath(testNo, 'repeat_sentence', order), options: null,
            scored_enabling: ENABLING.repeat_sentence,
            model_answer: sentence,
            answer_key: {
                type: 'repeat_sentence', model_answer: sentence, script: sentence,
                key_points: keyPointsFrom(sentence, 8), target_words: wc(sentence),
                source: { title: 'Original content bank', url: null, license: 'Original work' },
            },
        });
    }
    for (let i = 0; i < 3; i++) {                  // Describe Image ×3
        const spec = BANKS.charts[(tIdx * 3 + i) % BANKS.charts.length];
        const chart = {
            type: spec.type, title: spec.title, subtitle: spec.subtitle,
            xLabel: spec.xLabel, yLabel: spec.yLabel,
            categories: spec.categories.slice(),
            values: spec.values.map((v) => (spec.type === 'pie' ? v : jitter(v))),
            unit: spec.unit,
        };
        const model = diModel(chart);
        qs.push({
            ...base(1, `Describe Image ${i + 1} — ${shortTitle(spec.title, 40)}`),
            module: 'speaking', question_type: 'describe_image', item_order: ++order,
            max_score: 10, prep_seconds: 25, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: PROMPTS.describe_image, passage: null, media_url: null,
            options: JSON.stringify({
                chart: spec.type === 'pie'
                    ? {
                        type: chart.type, title: chart.title, subtitle: chart.subtitle,
                        categories: chart.categories, values: chart.values,
                    }
                    : {
                        type: chart.type, title: chart.title, subtitle: chart.subtitle,
                        xLabel: chart.xLabel, yLabel: chart.yLabel,
                        categories: chart.categories,
                        series: [{ name: 'Value', values: chart.values }],
                    },
            }),
            scored_enabling: ENABLING.describe_image,
            model_answer: model,
            answer_key: {
                type: 'describe_image', target_words: 55, model_answer: model,
                key_points: diKeyPoints(chart),
                source: { title: 'Original content bank', url: null, license: 'Original work' },
            },
        });
    }
    for (let i = 0; i < 2; i++) {                  // Re-tell Lecture ×2
        const item = takeWhere('script', 'retell_lecture', (c) => !!rlModel(c.sentences));
        const model = rlModel(item.sentences) || `The lecture explained that ${demote(item.sentences[0])} and discussed the wider implications of this issue.`;
        qs.push({
            ...base(1, `Re-tell Lecture ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'speaking', question_type: 'retell_lecture', item_order: ++order,
            max_score: 10, prep_seconds: 10, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: PROMPTS.retell_lecture, passage: null,
            media_url: mediaPath(testNo, 'retell_lecture', order), options: null,
            scored_enabling: ENABLING.retell_lecture,
            model_answer: model,
            answer_key: {
                type: 'retell_lecture', target_words: 55, model_answer: model,
                script: item.text, key_points: keyPointsFrom(item.text, 11), source: srcTag(item),
            },
        });
    }
    for (let i = 0; i < 4; i++) {                  // Answer Short Question ×4
        const a = BANKS.spoken.asq[(tIdx * 4 + i) % BANKS.spoken.asq.length];
        qs.push({
            ...base(1, `Answer Short Question ${i + 1}`),
            module: 'speaking', question_type: 'answer_short_question', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 10, audio_play_policy: 'once',
            prompt: PROMPTS.answer_short_question, passage: null,
            media_url: mediaPath(testNo, 'answer_short_question', order), options: null,
            scored_enabling: ENABLING.answer_short_question,
            model_answer: a.a,
            answer_key: {
                type: 'answer_short_question', model_answer: a.a, script: a.q,
                acceptable: a.accept, key_points: [a.a.toLowerCase()],
                source: { title: 'Original content bank', url: null, license: 'Original work' },
            },
        });
    }
    {                                              // Summarize Written Text ×1
        const item = takeWhere('long', 'summarize_written_text', (c) => !!swtModel(c.sentences));
        const model = swtModel(item.sentences);
        qs.push({
            ...base(1, `Summarize Written Text — ${shortTitle(item.src.title)}`),
            module: 'writing', question_type: 'summarize_written_text', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 600, audio_play_policy: 'none',
            prompt: PROMPTS.summarize_written_text, passage: item.text, media_url: null, options: null,
            scored_enabling: ENABLING.summarize_written_text,
            model_answer: model,
            answer_key: {
                type: 'summarize_written_text', required_sentences: 1, word_range: [5, 75],
                target_words: 55, model_answer: model,
                key_points: (() => {
                    const kp = keyPointsFrom(model, 11);
                    return kp.length >= 6 ? kp : keyPointsFrom(item.text, 11);
                })(),
                source: srcTag(item),
            },
        });
    }
    for (let i = 0; i < 2; i++) {                  // Write Essay ×2
        const essay = BANKS.essays[(tIdx * 2 + i) % BANKS.essays.length];
        const paras = [essay.intro.join(' '), essay.bodyFor.join(' '), essay.bodyAgainst.join(' '), essay.conclusion.join(' ')];
        const model = paras.join('\n\n');
        const flat = paras.join(' ');
        const w = wc(flat);
        if (w < 200 || w > 300) throw new Error(`Essay "${essay.slug}" is ${w} words (need 200–300) — fix banks/essays.js`);
        const lightNorm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const flatNorm = lightNorm(flat);
        const keywords = essay.keywords.filter((k) => flatNorm.includes(lightNorm(k)));
        if (keywords.length < 6) {
            throw new Error(`Essay "${essay.slug}" only covers ${keywords.length}/8+ of its own keywords in the model answer — fix banks/essays.js`);
        }
        qs.push({
            ...base(1, `Write Essay ${i + 1} — ${shortTitle(essay.title, 40)}`),
            module: 'writing', question_type: 'write_essay', item_order: ++order,
            max_score: 15, prep_seconds: 0, time_limit_seconds: 1200, audio_play_policy: 'none',
            prompt: `${PROMPTS.essay}\n\nTopic: ${essay.prompt}`,
            passage: null, media_url: null, options: null,
            scored_enabling: ENABLING.write_essay,
            model_answer: model,
            answer_key: {
                type: 'write_essay', word_range: [200, 300], target_words: w,
                model_answer: flat,
                key_points: keywords.slice(0, 12),
                source: { title: 'Original content bank', url: null, license: 'Original work' },
            },
        });
    }

    /* ---------------- PART 2: Reading (12) ------------------------------ */
    {                                              // MCMA ×1 (3 correct of 5)
        const item = take('long', 'reading mcma');
        const supported = [];
        for (const s of item.sentences) {
            const n = wc(s);
            if (n >= 8 && n <= 20 && !supported.some((x) => x === s)) supported.push(s);
            if (supported.length === 3) break;
        }
        if (supported.length < 3) throw new Error(`Not enough option-sized sentences in ${item.src.title}`);
        const distractors = [];
        let guard = 0;
        while (distractors.length < 2 && guard++ < 60) {
            const cand = takeSingle((s) => overlapRatio(s, item.text) < 0.3, 'reading mcma distractor').text;
            if (!supported.includes(cand)) distractors.push(cand);
        }
        if (distractors.length < 2) throw new Error('Could not build mcma distractors');
        const pairs = shuffle([
            ...supported.map((text) => ({ text, ok: true })),
            ...distractors.map((text) => ({ text, ok: false })),
        ]);
        const labels = ['A', 'B', 'C', 'D', 'E'];
        const choices = pairs.map((p, i) => ({ label: labels[i], text: p.text }));
        const correct = pairs.map((p, i) => (p.ok ? labels[i] : null)).filter(Boolean);
        const explanations = {};
        pairs.forEach((p, i) => {
            explanations[labels[i]] = p.ok
                ? `Supported directly by the passage: "${p.text.slice(0, 70)}${p.text.length > 70 ? '…' : ''}"`
                : 'The passage does not support this statement.';
        });
        qs.push({
            ...base(2, `Multiple Choice, Choose Multiple Answers — ${shortTitle(item.src.title)}`),
            module: 'reading', question_type: 'mcma', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 200, audio_play_policy: 'none',
            prompt: PROMPTS.mcma_read, passage: item.text, media_url: null,
            options: JSON.stringify({ choices }),
            scored_enabling: ENABLING.mcma,
            model_answer: correct.join(', '),
            answer_key: { type: 'mcma', correct, model_answer: correct.join(', '), explanations, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 2; i++) {                  // Re-order Paragraphs ×2
        const item = take('seq', 'reorder');
        const original = item.sentences;            // true order
        const displayIdx = shuffle([0, 1, 2, 3]);   // display order of originals
        const letters = ['A', 'B', 'C', 'D'];
        const passage = displayIdx.map((origIdx, pos) => `${letters[pos]}) ${original[origIdx]}`).join('\n');
        const sequence = displayIdx.map((origIdx, pos) => ({ origIdx, pos }))
            .sort((a, b) => a.origIdx - b.origIdx)
            .map((x) => letters[x.pos]);
        qs.push({
            ...base(2, `Re-order Paragraphs ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'reading', question_type: 'reorder_paragraphs', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: PROMPTS.reorder, passage, media_url: null,
            options: JSON.stringify({ boxes: letters }),
            scored_enabling: ENABLING.reorder_paragraphs,
            model_answer: sequence.join(' → '),
            answer_key: {
                type: 'reorder', sequence, model_answer: sequence.join(' → '),
                explanations: { logic: `In the source text the ideas develop from "${original[0].slice(0, 60)}…" to "${original[3].slice(0, 60)}…", so the correct order is ${sequence.join(' → ')}.` },
                source: srcTag(item),
            },
        });
    }
    {                                              // MCSA ×1 (main idea)
        const item = take('long', 'reading mcsa');
        const correctStatement = argStatement(item.sentences);
        if (!correctStatement) throw new Error(`No main-idea statement for ${item.src.title}`);
        const distractors = [];
        let guard = 0;
        while (distractors.length < 3 && guard++ < 40) {
            const cand = takeSingle((s) => {
                const st = argStatement([s]);
                return !!st && overlapRatio(st, item.text) < 0.3 && st !== correctStatement;
            }, 'mcsa distractor');
            distractors.push(argStatement([cand.text]));
        }
        if (distractors.length < 3) throw new Error('Could not build mcsa distractors');
        const pairs = shuffle([
            { text: correctStatement, ok: true },
            ...distractors.map((text) => ({ text, ok: false })),
        ]);
        const labels = ['A', 'B', 'C', 'D'];
        const choices = pairs.map((p, i) => ({ label: labels[i], text: p.text }));
        const correct = [labels[pairs.findIndex((p) => p.ok)]];
        const explanations = {};
        pairs.forEach((p, i) => {
            explanations[labels[i]] = p.ok
                ? 'This captures the central argument the writer develops throughout the passage.'
                : 'This is not the main point of the passage.';
        });
        const stems = [
            'What is the writer\u2019s main argument?',
            'Which of the following best expresses the main idea of the passage?',
            'What primary point does the writer make in the passage?',
        ];
        qs.push({
            ...base(2, `Multiple Choice, Choose Single Answer — ${shortTitle(item.src.title)}`),
            module: 'reading', question_type: 'mcsa', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 150, audio_play_policy: 'none',
            prompt: `Read the passage and choose the ONE option that best answers the question: ${stems[testNo % stems.length]}`,
            passage: item.text, media_url: null, options: JSON.stringify({ choices }),
            scored_enabling: ENABLING.mcsa,
            model_answer: correct[0],
            answer_key: { type: 'mcsa', correct, model_answer: correct[0], explanations, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 4; i++) {                  // Reading Fill in the Blanks ×4
        const item = takeWhere('fib', 'reading_fill_blanks', (c) => !!makeBlanks(c.text, 4), 600);
        const mk = makeBlanks(item.text, 4);
        if (!mk) throw new Error(`Could not blank ${item.src.title}`);
        const answers = {};
        for (const k of Object.keys(mk.answers)) answers[k] = [mk.answers[k]];
        const bank = shuffle([...Object.values(mk.answers).flat(), ...distractorWords(3, item.text)]);
        const model = Object.values(mk.answers).flat().join(' / ');
        qs.push({
            ...base(2, `Reading Fill in the Blanks ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'reading', question_type: 'reading_fill_blanks', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: PROMPTS.r_fib, passage: mk.passage, media_url: null,
            options: JSON.stringify({ bank }),
            scored_enabling: ENABLING.reading_fill_blanks,
            model_answer: model,
            answer_key: { type: 'reading_fill_blanks', answers, model_answer: model, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 4; i++) {                  // Reading & Writing FIB ×4
        const item = takeWhere('fib', 'rw_fill_blanks', (c) => !!makeBlanks(c.text, 4), 600);
        const mk = makeBlanks(item.text, 4);
        if (!mk) throw new Error(`Could not blank ${item.src.title}`);
        const answers = {};
        const options = {};
        for (const [k, correct] of Object.entries(mk.answers)) {
            answers[k] = correct;
            options[k] = shuffle([correct, ...distractorWords(3, item.text + ' ' + Object.values(answers).join(' '))]);
        }
        const model = Object.values(answers).join(' / ');
        qs.push({
            ...base(2, `Reading & Writing Fill in the Blanks ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'reading', question_type: 'rw_fill_blanks', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: PROMPTS.rw_fib, passage: mk.passage, media_url: null,
            options: JSON.stringify(options),
            scored_enabling: ENABLING.rw_fill_blanks,
            model_answer: model,
            answer_key: { type: 'rw_fill_blanks', answers, model_answer: model, source: srcTag(item) },
        });
    }

    /* ---------------- PART 3: Listening (11) ---------------------------- */
    {                                              // SST ×1
        const item = takeWhere('script', 'summarize_spoken_text', (c) => !!sstModel(c.sentences));
        const model = sstModel(item.sentences);
        qs.push({
            ...base(3, `Summarize Spoken Text — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'summarize_spoken_text', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 600, audio_play_policy: 'once',
            prompt: PROMPTS.sst, passage: null,
            media_url: mediaPath(testNo, 'summarize_spoken_text', order), options: null,
            scored_enabling: ENABLING.summarize_spoken_text,
            model_answer: model,
            answer_key: {
                type: 'summarize_spoken_text', word_range: [50, 70], target_words: 60,
                model_answer: model, script: item.text,
                key_points: (() => {
                    const kp = keyPointsFrom(model, 11);
                    return kp.length >= 6 ? kp : keyPointsFrom(item.text, 11);
                })(),
                source: srcTag(item),
            },
        });
    }
    {                                              // Listening MCMA ×1 (3 of 5)
        const item = takeWhere('script', 'listening mcma',
            (c) => c.sentences.filter((s) => wc(s) >= 8 && wc(s) <= 20).length >= 3);
        const supported = item.sentences.filter((s) => wc(s) >= 8 && wc(s) <= 20).slice(0, 3);
        const distractors = [];
        let guard = 0;
        while (distractors.length < 2 && guard++ < 60) {
            const cand = takeSingle((s) => overlapRatio(s, item.text) < 0.3, 'lmcma distractor').text;
            if (!supported.includes(cand)) distractors.push(cand);
        }
        const pairs = shuffle([
            ...supported.map((text) => ({ text, ok: true })),
            ...distractors.map((text) => ({ text, ok: false })),
        ]);
        const labels = ['A', 'B', 'C', 'D', 'E'];
        const choices = pairs.map((p, i) => ({ label: labels[i], text: p.text }));
        const correct = pairs.map((p, i) => (p.ok ? labels[i] : null)).filter(Boolean);
        const explanations = {};
        pairs.forEach((p, i) => {
            explanations[labels[i]] = p.ok
                ? `The speaker says this directly: "${p.text.slice(0, 70)}${p.text.length > 70 ? '…' : ''}"`
                : 'This statement was not made in the recording.';
        });
        qs.push({
            ...base(3, `Listening MCQ, Multiple Answers — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'mcma', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: PROMPTS.l_mcma, passage: null,
            media_url: mediaPath(testNo, 'mcma', order), options: JSON.stringify({ choices }),
            scored_enabling: ENABLING.mcma,
            model_answer: correct.join(', '),
            answer_key: { type: 'mcma', correct, model_answer: correct.join(', '), explanations, script: item.text, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 3; i++) {                  // Listening Fill in the Blanks ×3
        const item = takeWhere('scriptSmall', 'listening_fill_blanks', (c) => !!makeBlanks(c.text, 3), 600);
        const mk = makeBlanks(item.text, 3);
        if (!mk) throw new Error(`Could not blank script ${item.src.title}`);
        const answers = {};
        for (const k of Object.keys(mk.answers)) answers[k] = [mk.answers[k]];
        const model = Object.values(mk.answers).flat().join(' / ');
        qs.push({
            ...base(3, `Listening Fill in the Blanks ${i + 1} — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'listening_fill_blanks', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 120, audio_play_policy: 'once',
            prompt: PROMPTS.l_fib, passage: mk.passage,
            media_url: mediaPath(testNo, 'listening_fill_blanks', order),
            options: null,   // text-input renderer; exposing the answer bank would leak
            scored_enabling: ENABLING.listening_fill_blanks,
            model_answer: model,
            answer_key: { type: 'listening_fill_blanks', answers, model_answer: model, script: item.text, source: srcTag(item) },
        });
    }
    {                                              // Highlight Correct Summary ×1
        const item = takeWhere('script', 'highlight_correct_summary', (c) => !!summaryStatement(c.sentences));
        const correctStatement = summaryStatement(item.sentences);
        const distractors = [];
        while (distractors.length < 3) {
            const other = takeWhere('script', 'hcs distractor', (c) => {
                if (c.src.title === item.src.title) return false;
                const st = summaryStatement(c.sentences);
                return !!st && st !== correctStatement && overlapRatio(st, item.text) < 0.4;
            });
            distractors.push(summaryStatement(other.sentences));
        }
        const pairs = shuffle([
            { text: correctStatement, ok: true },
            ...distractors.map((text) => ({ text, ok: false })),
        ]);
        const labels = ['A', 'B', 'C', 'D'];
        const choices = pairs.map((p, i) => ({ label: labels[i], text: p.text }));
        const correct = [labels[pairs.findIndex((p) => p.ok)]];
        const explanations = {};
        pairs.forEach((p, i) => {
            explanations[labels[i]] = p.ok
                ? 'This summary accurately reflects the main points of the recording.'
                : 'This summary does not match the content of the recording.';
        });
        qs.push({
            ...base(3, `Highlight Correct Summary — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'highlight_correct_summary', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: PROMPTS.hcs, passage: null,
            media_url: mediaPath(testNo, 'highlight_correct_summary', order),
            options: JSON.stringify({ choices }),
            scored_enabling: ENABLING.highlight_correct_summary,
            model_answer: correct[0],
            answer_key: { type: 'mcsa', correct, model_answer: correct[0], explanations, script: item.text, source: srcTag(item) },
        });
    }
    {                                              // Listening MCSA ×1
        const item = takeWhere('script', 'listening mcsa',
            (c) => c.sentences.some((s) => wc(s) >= 8 && wc(s) <= 20));
        const correctText = item.sentences.find((s) => wc(s) >= 8 && wc(s) <= 20);
        const distractors = [];
        let guard = 0;
        while (distractors.length < 3 && guard++ < 60) {
            const cand = takeSingle((s) => overlapRatio(s, item.text) < 0.3, 'lmcsa distractor').text;
            if (cand !== correctText) distractors.push(cand);
        }
        const pairs = shuffle([
            { text: correctText, ok: true },
            ...distractors.map((text) => ({ text, ok: false })),
        ]);
        const labels = ['A', 'B', 'C', 'D'];
        const choices = pairs.map((p, i) => ({ label: labels[i], text: p.text }));
        const correct = [labels[pairs.findIndex((p) => p.ok)]];
        const explanations = {};
        pairs.forEach((p, i) => {
            explanations[labels[i]] = p.ok
                ? `The speaker says this in the recording: "${p.text.slice(0, 70)}${p.text.length > 70 ? '…' : ''}"`
                : 'This statement was not made in the recording.';
        });
        qs.push({
            ...base(3, `Listening MCQ, Single Answer — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'mcsa', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: PROMPTS.l_mcsa, passage: null,
            media_url: mediaPath(testNo, 'mcsa', order), options: JSON.stringify({ choices }),
            scored_enabling: ENABLING.mcsa,
            model_answer: correct[0],
            answer_key: { type: 'mcsa', correct, model_answer: correct[0], explanations, script: item.text, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 1; i++) {                  // Highlight Missing Words ×1
        const item = takeWhere('scriptSmall', 'highlight_missing_words', (c) => !!makeBlanks(c.text, 3), 600);
        const mk = makeBlanks(item.text, 3);
        if (!mk) throw new Error(`Could not blank HMW script ${item.src.title}`);
        const answers = {};
        const options = {};
        for (const [k, correct] of Object.entries(mk.answers)) {
            answers[k] = correct;
            options[k] = shuffle([correct, ...distractorWords(2, item.text)]);
        }
        const model = Object.values(answers).join(' / ');
        qs.push({
            ...base(3, `Highlight Missing Words — ${shortTitle(item.src.title)}`),
            module: 'listening', question_type: 'highlight_missing_words', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: PROMPTS.hmw, passage: mk.passage,
            media_url: mediaPath(testNo, 'highlight_missing_words', order),
            options: JSON.stringify(options),
            scored_enabling: ENABLING.highlight_missing_words,
            model_answer: model,
            answer_key: { type: 'highlight_missing_words', answers, model_answer: model, script: item.text, source: srcTag(item) },
        });
    }
    for (let i = 0; i < 3; i++) {                  // Write from Dictation ×3
        const item = take('wfd', 'write_from_dictation');
        const sentence = item.text;
        qs.push({
            ...base(3, `Write from Dictation ${i + 1}`),
            module: 'listening', question_type: 'write_from_dictation', item_order: ++order,
            max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: PROMPTS.wfd, passage: null,
            media_url: mediaPath(testNo, 'write_from_dictation', order), options: null,
            scored_enabling: ENABLING.write_from_dictation,
            model_answer: sentence,
            answer_key: {
                type: 'write_from_dictation', model_answer: sentence, script: sentence,
                word_range: [wc(sentence), wc(sentence)],
                key_points: keyPointsFrom(sentence, 7), source: srcTag(item),
            },
        });
    }

    return bindAudio(qs);
}

/* ======================================================== validation ==== */
function validateTest(questions, testNo) {
    const errs = [];
    const specCount = { ...TYPE_SPEC };
    // listening instances of shared types
    specCount.mcma = 2; specCount.mcsa = 2;         // 1 reading + 1 listening each
    if (questions.length !== 45) errs.push(`expected 45 items, got ${questions.length}`);
    const byType = {};
    questions.forEach((q) => { byType[q.question_type] = (byType[q.question_type] || 0) + 1; });
    for (const [type, want] of Object.entries(specCount)) {
        if ((byType[type] || 0) !== want) errs.push(`type ${type}: want ${want}, got ${byType[type] || 0}`);
    }
    const byPart = { 1: 0, 2: 0, 3: 0 };
    questions.forEach((q) => { byPart[q.part]++; });
    if (byPart[1] !== 22 || byPart[2] !== 12 || byPart[3] !== 11) {
        errs.push(`parts 22/12/11 expected, got ${byPart[1]}/${byPart[2]}/${byPart[3]}`);
    }
    // item_order integrity
    questions.forEach((q, i) => { if (q.item_order !== i + 1) errs.push(`item_order gap at index ${i}`); });

    for (const q of questions) {
        const k = q.answer_key;
        const tag = `T${testNo}#${q.item_order} ${q.question_type}`;
        if (!k || !k.type) { errs.push(`${tag}: missing answer_key.type`); continue; }
        for (const issue of alignmentIssues(q)) errs.push(`${tag}: ${issue}`);
        // A final gate protects consumers even if a future pool bypasses filtering.
        const originalPassage = (q.passage || '').replace(/\[(blank\d+)\]/g, (_, b) => {
            const answer = k.answers && k.answers[b];
            return Array.isArray(answer) ? answer[0] : (answer || '');
        });
        for (const text of [originalPassage, k.script || '']) {
            for (const issue of passageIssues(text, vocabularyFrequency)) errs.push(`${tag}: ${issue}`);
        }
        for (const answer of Object.values(k.answers || {})) {
            const word = Array.isArray(answer) ? answer[0] : answer;
            if (!isSuitableBlank(word, vocabularyFrequency)) errs.push(`${tag}: unsuitable blank answer ${word}`);
        }
        if (!k.model_answer && k.type !== 'mcma' && k.type !== 'mcsa' && k.type !== 'reorder') {
            errs.push(`${tag}: missing model_answer`);
        }
        if (['mcma', 'mcsa'].includes(k.type)) {
            const choices = (JSON.parse(q.options || '{}').choices || []).map((c) => c.label);
            if (!k.correct || !k.correct.length) errs.push(`${tag}: no correct labels`);
            for (const c of k.correct || []) if (!choices.includes(c)) errs.push(`${tag}: correct label ${c} not in choices`);
            if (choices.length !== new Set(choices).size) errs.push(`${tag}: duplicate labels`);
        }
        if (k.type === 'reorder') {
            const letters = (k.sequence || []);
            if (letters.length !== 4) errs.push(`${tag}: sequence must have 4 letters`);
        }
        if (['reading_fill_blanks', 'rw_fill_blanks', 'listening_fill_blanks', 'highlight_missing_words'].includes(k.type)) {
            const inPassage = new Set((q.passage.match(/\[(blank\d+)\]/g) || []).map((s) => s.replace(/[\[\]]/g, '')));
            const inKey = new Set(Object.keys(k.answers || {}));
            if (inPassage.size !== inKey.size || [...inPassage].some((b) => !inKey.has(b))) {
                errs.push(`${tag}: passage blanks ${[...inPassage]} != key answers ${[...inKey]}`);
            }
            if (['rw_fill_blanks', 'highlight_missing_words'].includes(k.type)) {
                const opts = JSON.parse(q.options || '{}');
                for (const b of inKey) {
                    if (!Array.isArray(opts[b]) || opts[b].length < 3) errs.push(`${tag}: options for ${b} missing/short`);
                }
            }
            if (k.type === 'reading_fill_blanks') {
                const bank = (JSON.parse(q.options || '{}').bank || []);
                for (const b of inKey) if (!bank.includes(k.answers[b][0])) errs.push(`${tag}: bank missing correct word`);
            }
        }
        if (q.question_type === 'summarize_written_text') {
            const w = wc(k.model_answer);
            if (w < 5 || w > 75) errs.push(`${tag}: model is ${w} words`);
            const sentences = k.model_answer.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
            if (sentences !== 1) errs.push(`${tag}: model must be 1 sentence, is ${sentences}`);
        }
        if (q.question_type === 'summarize_spoken_text') {
            const w = wc(k.model_answer);
            if (w < 50 || w > 70) errs.push(`${tag}: model is ${w} words (50–70)`);
        }
        if (q.question_type === 'write_essay') {
            const w = wc(k.model_answer);
            if (w < 200 || w > 300) errs.push(`${tag}: essay model is ${w} words`);
            if (!k.key_points || k.key_points.length < 6) errs.push(`${tag}: essay needs >= 6 key_points`);
        }
        if (q.audio_play_policy === 'once') {
            if (!q.media_url || !q.media_url.endsWith('.mp3')) errs.push(`${tag}: once item without mp3 media_url`);
            if (!k.script || wc(k.script) < 4) errs.push(`${tag}: once item without script`);
        } else if (q.media_url) {
            errs.push(`${tag}: non-aural item has media_url`);
        }
        if (!q.scored_enabling) errs.push(`${tag}: missing scored_enabling`);
        if (!q.prompt) errs.push(`${tag}: missing prompt`);
        if (q.question_type !== 'read_aloud' && !q.passage && !q.media_url &&
            !['write_essay', 'summarize_written_text', 'describe_image', 'repeat_sentence',
                'retell_lecture', 'answer_short_question', 'summarize_spoken_text',
                'write_from_dictation', 'highlight_correct_summary', 'mcsa', 'mcma'].includes(q.question_type)) {
            errs.push(`${tag}: no passage and no media`);
        }
    }
    return errs;
}

/* ========================================================== DB insert ==== */
const INSERT_TEST = `INSERT INTO tests (title, exam_type, description, total_time_minutes)
                     VALUES (?, ?, ?, ?)`;
const INSERT_QUESTION = `INSERT INTO questions
    (test_id, module, question_type, title, prompt, passage, media_url, options, answer_key,
     max_score, item_order, part, part_title, audio_play_policy, prep_seconds, time_limit_seconds,
     model_answer, rubric, scored_enabling)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

async function insertTest(title, description, questions) {
    const res = await runQuery(INSERT_TEST, [title, 'PTE', description, 120]);
    const testId = res.lastID;
    for (const q of questions) {
        await runQuery(INSERT_QUESTION, [
            testId, q.module, q.question_type, q.title, q.prompt, q.passage, q.media_url,
            q.options, JSON.stringify(q.answer_key), q.max_score, q.item_order,
            q.part, q.part_title, q.audio_play_policy, q.prep_seconds, q.time_limit_seconds,
            q.model_answer || null, null, JSON.stringify(q.scored_enabling),
        ]);
    }
    return testId;
}

/* ====================================================== media verify ===== */
async function verifyMedia() {
    const rows = await queryAll(
        `SELECT q.id, q.title, q.media_url, q.answer_key, t.title AS test_title
         FROM questions q JOIN tests t ON t.id = q.test_id
         WHERE q.audio_play_policy = 'once' AND q.media_url LIKE ?`, [`${MEDIA_BASE}%`]);
    let missing = 0;
    for (const r of rows) {
        const file = path.join(ROOT, 'public', r.media_url);
        if (!verifyAudioFile(file, JSON.parse(r.answer_key))) {
            missing++;
            console.log(`  MISSING OR STALE  ${r.media_url}  (${r.test_title} — ${r.title})`);
        }
    }
    console.log(`Media check: ${rows.length - missing}/${rows.length} generated audio files present.`);
    return missing === 0;
}

/* ============================================================= main ====== */
async function main() {
    if (OPT.force) throw new Error('--force is disabled to protect existing attempts. Create a versioned test bank instead.');
    if (OPT.verifyMedia) {
        await initDB();
        const ok = await verifyMedia();
        process.exit(ok ? 0 : 1);
    }

    console.log('Loading content banks...');
    loadBanks();

    console.log('Loading source corpus...');
    if (!fs.existsSync(WIKI_DIR)) throw new Error(`Missing ${WIKI_DIR} — run: python3 scripts/fetch_sources.py`);
    const articles = [];
    for (const f of fs.readdirSync(WIKI_DIR).filter((f) => f.endsWith('.json'))) {
        try {
            const art = JSON.parse(fs.readFileSync(path.join(WIKI_DIR, f), 'utf8'));
            articles.push({
                kind: 'wiki', title: art.title, url: art.url, license: art.license,
                domain: art.domain, extract: art.extract,
            });
        } catch (e) { /* skip malformed */ }
    }
    if (fs.existsSync(GUT_DIR)) {
        for (const f of fs.readdirSync(GUT_DIR).filter((f) => f.endsWith('.txt'))) {
            const raw = fs.readFileSync(path.join(GUT_DIR, f), 'utf8');
            const start = raw.indexOf('*** START');
            const end = raw.indexOf('*** END');
            const body = start >= 0 && end > start ? raw.slice(raw.indexOf('\n', start) + 1, end) : raw;
            articles.push({
                kind: 'gutenberg', title: `Project Gutenberg text (${f})`,
                url: `https://www.gutenberg.org/ebooks/${f.replace('.txt', '')}`,
                license: 'Public domain', domain: 'literature', extract: body.slice(0, 400000),
            });
        }
    }
    if (articles.filter((a) => a.kind === 'wiki').length < 300) {
        throw new Error(`Only ${articles.filter((a) => a.kind === 'wiki').length} wiki articles found — run fetch_sources.py first (need >= 300).`);
    }
    console.log(`  ${articles.length} source texts (${articles.filter((a) => a.kind === 'wiki').length} wiki, ${articles.filter((a) => a.kind === 'gutenberg').length} gutenberg)`);

    console.log('Building sentence pools (case learning + candidates)...');
    vocabularyFrequency = documentFrequencies(articles);
    const allSentences = [];
    for (const art of articles) {
        for (const sec of splitSections(art.extract)) {
            for (const p of splitParagraphs(sec.text)) allSentences.push(...splitSentences(p));
        }
    }
    learnCase(allSentences);
    for (const art of articles) buildPoolsFromArticle(art);
    for (const name of Object.keys(pools)) pools[name] = shuffle(pools[name]);
    console.log(`  pools: ${Object.entries(pools).map(([k, v]) => `${k}=${v.length}`).join(' ')}`);

    /* ------------------------------------------------ build every test --- */
    const built = [];
    const allErrors = [];
    for (let n = OPT.firstTest; n <= OPT.lastTest; n++) {
        const questions = buildTest(n);
        const errs = validateTest(questions, n);
        if (errs.length) allErrors.push(...errs);
        built.push({ n, questions });
        const counts = {};
        questions.forEach((q) => { counts[q.question_type] = (counts[q.question_type] || 0) + 1; });
        console.log(`  Test ${n}: 45 items OK — ${Object.keys(counts).length} types`);
    }
    if (allErrors.length) {
        console.error('\nVALIDATION FAILED:');
        for (const e of allErrors.slice(0, 60)) console.error('  - ' + e);
        process.exit(1);
    }

    if (OPT.dry) {
        console.log(`\nDry run OK: ${built.length} tests built and validated, nothing inserted.`);
        console.log(`Sentences consumed globally: ${usedSentences.size}`);
        process.exit(0);
    }

    /* ------------------------------------------------------- insert ------ */
    await initDB();
    let created = 0, skipped = 0;
    const description = 'Complete 2-hour PTE Academic simulation with original practice content generated from openly licensed sources (Wikipedia CC BY-SA with per-item provenance; Project Gutenberg public domain) and original authored banks. Part 1 Speaking & Writing (22 items), Part 2 Reading (12 items), Part 3 Listening (11 items). Every audio stimulus plays EXACTLY ONCE with no replay.';

    for (const { n, questions } of built) {
        const title = `PTE Academic Full Mock Test ${n} — Revised v2`;
        const existing = await queryOne('SELECT id FROM tests WHERE title = ?', [title]);
        if (existing) {
            const cnt = await queryOne('SELECT COUNT(*) AS c FROM questions WHERE test_id = ?', [existing.id]);
            if (cnt.c === 45) {
                skipped++;
                continue;
            }
            throw new Error(`Existing test "${title}" has ${cnt.c} questions; refusing to replace it because attempts may refer to its questions.`);
        }
        const id = await insertTest(title, description, questions);
        created++;
        console.log(`  created "${title}" (id ${id}) — 45 items`);
    }

    const totals = await queryOne(
        `SELECT (SELECT COUNT(*) FROM tests) AS tests,
                (SELECT COUNT(*) FROM questions) AS questions,
                (SELECT COUNT(*) FROM tests WHERE title LIKE 'PTE Academic%Mock Test%' OR title LIKE 'PTE Academic Official Full-Length%') AS full_tests`);
    console.log(`\nDone. created=${created} skipped=${skipped}`);
    console.log(`DB now: ${totals.full_tests} full mock tests, ${totals.questions} questions total.`);
    console.log(`Sentences consumed uniquely across bank: ${usedSentences.size}`);
    console.log('\nNext: generate audio → uv run --with edge-tts python scripts/generate_audio_bulk.py');
}

main().catch((err) => {
    console.error('generate_mock_bank failed:', err);
    process.exit(1);
});
