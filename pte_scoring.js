// Pearson Academic Test Taker Score Guide (March 2026), pp. 15–44.
// These are the reported communicative skills for each task, not the response medium.
const SKILLS_BY_TYPE = Object.freeze({
    personal_introduction: [],
    read_aloud: ['speaking'],
    repeat_sentence: ['listening', 'speaking'],
    describe_image: ['speaking'],
    retell_lecture: ['listening', 'speaking'],
    answer_short_question: ['listening'],
    summarize_group_discussion: ['listening', 'speaking'],
    respond_to_situation: ['speaking'],
    summarize_written_text: ['reading', 'writing'],
    write_essay: ['writing'],
    rw_fill_blanks: ['reading'],
    mcma_reading: ['reading'],
    reorder_paragraphs: ['reading'],
    reading_fill_blanks: ['reading'],
    mcsa_reading: ['reading'],
    summarize_spoken_text: ['listening', 'writing'],
    mcma_listening: ['listening'],
    listening_fill_blanks: ['listening'],
    highlight_correct_summary: ['listening', 'reading'],
    mcsa_listening: ['listening'],
    select_missing_word: ['listening'],
    highlight_incorrect_words: ['listening', 'reading'],
    write_from_dictation: ['listening', 'writing'],
    highlight_missing_words: ['listening'] // legacy practice task
});

const SKILLS = ['speaking', 'writing', 'reading', 'listening'];

function skillContributions(type, part) {
    const qualified = (type === 'mcma' || type === 'mcsa')
        ? `${type}_${part === 3 ? 'listening' : 'reading'}` : type;
    return SKILLS_BY_TYPE[qualified] || [];
}

function aggregatePracticeScores(rows) {
    const sums = Object.fromEntries(SKILLS.map(skill => [skill, { earned: 0, possible: 0 }]));
    let overallEarned = 0;
    let overallPossible = 0;
    let pendingReview = 0;
    const pendingSkills = Object.fromEntries(SKILLS.map(skill => [skill, 0]));
    for (const { question, evaluation } of rows) {
        const skills = skillContributions(question.question_type, question.part);
        if (!skills.length) continue;
        if (evaluation.score == null && evaluation.metrics?.verified === false) {
            pendingReview++;
            for (const skill of skills) pendingSkills[skill]++;
            continue;
        }
        const possible = Math.max(1, Number(question.max_score) || 1);
        const score = Math.max(10, Math.min(90, Number(evaluation.score) || 10));
        const earned = ((score - 10) / 80) * possible;
        overallEarned += earned;
        overallPossible += possible;
        for (const skill of skills) {
            sums[skill].earned += earned;
            sums[skill].possible += possible;
        }
    }
    const convert = ({ earned, possible }) => possible
        ? Math.round(10 + 80 * earned / possible) : 10;
    return {
        overall: !overallPossible && pendingReview ? null : convert({ earned: overallEarned, possible: overallPossible }),
        skills: Object.fromEntries(SKILLS.map(skill => [skill,
            !sums[skill].possible && pendingSkills[skill] ? null : convert(sums[skill])])),
        pendingReview,
        pendingSkills
    };
}

module.exports = { skillContributions, aggregatePracticeScores };
