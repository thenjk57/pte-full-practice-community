#!/usr/bin/env node
// Read-only audit of every question in the current practice database.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { queryAll } = require('../database/db');
const { evaluateItem } = require('../evaluator');

const root = path.join(__dirname, '..');
const container = { innerHTML: '' };
const context = {
    window: {},
    document: { getElementById: id => id === 'exam-content-area' ? container : null },
    console, Date
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'public/js/pte_exam.js'), 'utf8'), context);
const engine = context.window.pteEngine;
engine.bindItemEvents = () => {};
engine.startItemTimer = () => {};
engine.startSpeakingPrep = () => {};
engine.startSinglePlayAudio = () => {};
engine.updateExamTimerDisplay = () => {};

function parse(value) {
    if (!value) return null;
    try { return JSON.parse(value); } catch { return null; }
}

function idealResponse(q, key) {
    const base = { textResponse: '', audioFilePath: null, transcript: null, durationSeconds: 0 };
    if (['read_aloud', 'repeat_sentence', 'describe_image', 'retell_lecture'].includes(q.question_type)) {
        return { ...base, audioFilePath: 'audit-recording.webm', transcript: key.model_answer || '', durationSeconds: 10 };
    }
    if (q.question_type === 'answer_short_question') {
        return { ...base, transcript: key.model_answer || '' };
    }
    if (['write_essay', 'summarize_written_text', 'summarize_spoken_text', 'write_from_dictation'].includes(q.question_type)) {
        return { ...base, textResponse: q.model_answer || key.model_answer || '' };
    }
    if (['rw_fill_blanks', 'reading_fill_blanks', 'listening_fill_blanks', 'highlight_missing_words'].includes(q.question_type)) {
        return { ...base, textResponse: JSON.stringify(Object.fromEntries(
            Object.entries(key.answers || {}).map(([blank, answers]) => [blank, Array.isArray(answers) ? answers[0] : answers])
        )) };
    }
    if (['mcma', 'mcsa', 'highlight_correct_summary'].includes(q.question_type)) {
        return { ...base, textResponse: JSON.stringify(key.correct || []) };
    }
    if (q.question_type === 'reorder_paragraphs') {
        return { ...base, textResponse: (key.sequence || []).join(',') };
    }
    return base;
}

function mediaPath(q) {
    if (!q.media_url || q.media_url.startsWith('tts://')) return null;
    if (!q.media_url.startsWith('/audio/')) return null;
    return path.join(root, 'public', q.media_url);
}

function auditOne(q) {
    const issues = [];
    const key = parse(q.answer_key) || {};
    const opts = parse(q.options) || {};
    engine.questions = [q];
    engine.currentIndex = 0;
    engine.totalSeconds = 3600;
    engine.responses = {};
    try { engine.renderItem(q); } catch (e) {
        return [`render threw: ${e.message}`];
    }
    const html = container.innerHTML;
    const add = (condition, message) => { if (!condition) issues.push(message); };
    add(!!q.prompt && html.includes(engine.esc(q.prompt).slice(0, 20)), 'prompt not visible');

    if (q.question_type === 'write_essay') add(/Topic:|\b(D[oie]scuss|Do you agree|To what extent)\b/i.test(html), 'essay topic not visible');
    if (['read_aloud', 'summarize_written_text', 'rw_fill_blanks', 'reading_fill_blanks', 'listening_fill_blanks', 'highlight_missing_words'].includes(q.question_type)) {
        add(!!q.passage && html.includes('pearson-passage-box'), 'passage not visible');
    }
    if (q.question_type === 'describe_image') {
        add(!!opts.chart && html.includes('<svg') && !html.includes('[No image available]'), 'image not visible');
        add(!!opts.chart?.title, 'image title missing');
    }
    if (q.question_type === 'reorder_paragraphs') {
        const boxes = opts.boxes || [];
        add(boxes.length >= 4, 'fewer than four reorder boxes');
        add(!html.includes('data-box="[object Object]"'), 'reorder box IDs malformed');
        const visibleCount = [...html.matchAll(/class="pearson-reorder-item"[^>]*>[\s\S]*?<strong>\[[A-Z]\]<\/strong>\s*([^<\s][^<]*)/g)].length;
        add(visibleCount === boxes.length, `only ${visibleCount}/${boxes.length} reorder texts visible`);
    }
    if (['mcma', 'mcsa', 'highlight_correct_summary'].includes(q.question_type)) {
        const choices = opts.choices || [];
        add(choices.length >= 2, 'multiple-choice options missing');
        add((html.match(/class="mcq-input"/g) || []).length === choices.length, 'multiple-choice controls missing');
        add(choices.every(c => !!c.label && !!c.text), 'multiple-choice option text missing');
        if (opts.question) add(html.includes(engine.esc(opts.question)), 'item-specific multiple-choice question not visible');
    }
    if (['rw_fill_blanks', 'reading_fill_blanks', 'listening_fill_blanks', 'highlight_missing_words'].includes(q.question_type)) {
        const total = Object.keys(key.answers || {}).length;
        const selector = q.question_type === 'reading_fill_blanks' ? 'pearson-fib-dropzone'
            : q.question_type === 'listening_fill_blanks' ? 'pearson-blank-input' : 'pearson-blank-select';
        add(total > 0, 'answer blanks missing');
        add((html.match(new RegExp(`class="[^"]*${selector}`, 'g')) || []).length === total, 'blank controls missing');
        if (q.question_type === 'reading_fill_blanks') {
            add(Array.isArray(opts.bank) && opts.bank.length >= total, 'draggable answer bank missing');
        }
    }
    if (['write_essay', 'summarize_written_text', 'summarize_spoken_text', 'write_from_dictation'].includes(q.question_type)) {
        add(html.includes('id="pte-text-input"'), 'writing input missing');
    }
    if (q.module === 'speaking') add(html.includes('pearson-recording-status'), 'recording control missing');
    if (q.audio_play_policy === 'once') {
        add(html.includes('Audio Status'), 'audio widget missing');
        const file = mediaPath(q);
        add(!!file && fs.existsSync(file) && fs.statSync(file).size > 800, 'audio file missing or too small');
    }
    add(!!key.type, 'answer key type missing');
    try {
        const result = evaluateItem(q, idealResponse(q, key));
        add(Number.isFinite(result.score) && result.score >= 10 && result.score <= 90, 'evaluator returned invalid score');
        if (['mcma', 'mcsa', 'highlight_correct_summary', 'reorder_paragraphs',
            'rw_fill_blanks', 'reading_fill_blanks', 'listening_fill_blanks', 'highlight_missing_words',
            'write_from_dictation', 'answer_short_question'].includes(q.question_type)) {
            add(result.score === 90, `exact answer scored ${result.score}, not 90`);
        }
    } catch (e) { issues.push(`evaluator threw: ${e.message}`); }
    return issues;
}

async function main() {
    const rows = await queryAll('SELECT * FROM questions ORDER BY test_id, item_order');
    const tests = await queryAll('SELECT id,title FROM tests ORDER BY id');
    const byType = {};
    const issues = [];
    for (const q of rows) {
        byType[q.question_type] = (byType[q.question_type] || 0) + 1;
        for (const message of auditOne(q)) issues.push({ id: q.id, testId: q.test_id, type: q.question_type, message });
    }
    for (const t of tests) {
        const items = rows.filter(q => q.test_id === t.id);
        const orders = items.map(q => q.item_order);
        if (orders.length !== new Set(orders).size) issues.push({ testId: t.id, message: 'duplicate item_order' });
        if (items.some((q, i) => i > 0 && q.part < items[i - 1].part)) issues.push({ testId: t.id, message: 'part order moves backwards' });
    }
    console.log(JSON.stringify({ questions: rows.length, tests: tests.length, byType, issueCount: issues.length, issues }, null, 2));
    process.exitCode = issues.length ? 1 : 0;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
