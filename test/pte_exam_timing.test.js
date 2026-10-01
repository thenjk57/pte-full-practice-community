const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('part timer uses separate 78/25/32 minute budgets and advances on expiry', async () => {
    let ticker;
    const context = {
        window: {}, document: { body: { classList: { add() {} } }, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
        setInterval: fn => { ticker = fn; return 1; }, clearInterval() {},
        setTimeout() {}, clearTimeout() {}, alert() {}, console, Date
    };
    vm.runInNewContext(fs.readFileSync('public/js/pte_exam.js', 'utf8'), context);
    const engine = context.window.pteEngine;
    engine.renderEquipmentCheck = () => {};
    engine.renderQuestion = () => {};
    engine.startTest({ total_time_minutes: 135, questions: [
        { id: 1, part: 1, item_order: 1 }, { id: 2, part: 2, item_order: 2 }, { id: 3, part: 3, item_order: 3 }
    ] });
    engine.startExamTimer();
    assert.equal(engine.totalSeconds, 78 * 60);
    engine.totalSeconds = 1;
    await ticker();
    assert.equal(engine.currentIndex, 1);
    assert.equal(engine.totalTimer, null);
    engine.currentPart = 2;
    engine.startExamTimer();
    assert.equal(engine.totalSeconds, 25 * 60);
});

test('short practice drill keeps its configured duration', () => {
    const context = {
        window: {}, document: { body: { classList: { add() {} } }, getElementById: () => null },
        setInterval: () => 1, clearInterval() {}, console
    };
    vm.runInNewContext(fs.readFileSync('public/js/pte_exam.js', 'utf8'), context);
    const engine = context.window.pteEngine;
    engine.renderEquipmentCheck = () => {};
    engine.startTest({ total_time_minutes: 35, questions: [{ id: 1, part: 1, item_order: 1 }] });
    engine.startExamTimer();
    assert.equal(engine.totalSeconds, 35 * 60);
});
