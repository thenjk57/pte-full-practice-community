const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function view() {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/evaluation_view.js'), 'utf8'), context);
    return context.window.evaluationView;
}
test('unscored recordings display pending review instead of zero out of 90', () => {
    const html = view().responseItem({ score: null, module: 'speaking', question_type: 'answer_short_question', metrics: { verified: false }, sub_scores: {} }, 0);
    assert.match(html, /Pending review/);
    assert.doesNotMatch(html, /0<span[^>]*> \/ 90/);
});
test('missing pace data does not display optimal speaking performance', () => {
    const html = view().renderSpeakingDiagnostics({}, { module: 'speaking' });
    assert.doesNotMatch(html, /Optimal|Speech AI Pronunciation/);
    assert.match(html, /Not measured/);
});
test('a fully pending report does not assign a CEFR level or skill floor', () => {
    const instance = view();
    assert.match(instance.headerCard({ id: 1, overall_score: null }, null, null), /Pending review/);
    assert.doesNotMatch(instance.headerCard({ id: 1, overall_score: null }, null, null), /B1 \(Developing\)/);
    assert.match(instance.skillCard('Listening', null), /Pending review/);
});
