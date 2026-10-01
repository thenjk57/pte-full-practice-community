const crypto = require('node:crypto');
const fs = require('node:fs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const scriptOf = key => String(key.script || '').trim();
const normalize = text => String(text).replace(/\s+/g, ' ').trim();

function bindAudio(questions) {
    return questions.map(q => {
        if (q.audio_play_policy !== 'once') return q;
        const script = scriptOf(q.answer_key);
        if (!script) throw new Error('Audio question has no script');
        return { ...q, media_url: `/audio/exam/gen/v2/${hash(script)}.mp3` };
    });
}

function alignmentIssues(q) {
    if (q.audio_play_policy !== 'once') return [];
    const key = typeof q.answer_key === 'string' ? JSON.parse(q.answer_key) : q.answer_key;
    const script = normalize(scriptOf(key));
    const issues = [];
    if (!script) issues.push('Missing spoken script');
    if (['mcsa', 'mcma'].includes(q.question_type)) {
        const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        for (const label of key.correct || []) {
            const choice = (options?.choices || []).find(c => c.label === label);
            if (!choice || !choice.text || !script.includes(normalize(choice.text))) issues.push(`Correct choice ${label} is absent from the spoken script`);
        }
    }
    if (q.question_type === 'highlight_correct_summary') {
        const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        for (const label of key.correct || []) {
            const choice = (options?.choices || []).find(c => c.label === label);
            const summary = normalize(choice?.text || '');
            const clauses = summary.replace(/^This recording explains that /, '').replace(/\.$/, '')
                .split(/ and that |, and adds that /);
            if (!summary.startsWith('This recording explains that ') || clauses.length < 2 ||
                clauses.some(clause => !script.toLowerCase().includes(clause.toLowerCase()))) {
                issues.push(`Correct summary ${label} is not supported by its recording`);
            }
        }
    }
    if (['listening_fill_blanks', 'highlight_missing_words'].includes(q.question_type)) {
        const restored = String(q.passage || '').replace(/\[(blank\d+)\]/g, (_, b) => {
            const answer = key.answers?.[b];
            return Array.isArray(answer) ? answer[0] : (answer || '');
        });
        if (normalize(restored) !== script) issues.push('Displayed transcript and blank answers do not reconstruct the spoken script');
    }
    return issues;
}

function verifyAudioFile(file, key) {
    try {
        const receipt = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8'));
        return fs.statSync(file).size >= 1000 && receipt.script_sha256 === hash(scriptOf(key)) &&
            receipt.audio_sha256 === hash(fs.readFileSync(file));
    } catch { return false; }
}
module.exports = { bindAudio, alignmentIssues, verifyAudioFile };
