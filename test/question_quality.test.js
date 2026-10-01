const test = require('node:test');
const assert = require('node:assert/strict');
const { splitSourceSections, passageIssues, isSuitableBlank, documentFrequencies } = require('../database/question_quality');

test('plain Wikipedia reference headings exclude bibliography text from question sources', () => {
    const sections = splitSourceSections('Urban trees reduce summer temperatures.\n\nBenefits\n\nShade helps pedestrians.\n\nFurther reading\n\nAllen (2001). doi:10.1234/example\n\nExternal links\n\nhttps://example.org');
    assert.match(sections.map(s => s.text).join(' '), /Shade helps pedestrians/);
    assert.doesNotMatch(sections.map(s => s.text).join(' '), /doi:|example.org/);
});

test('markup section headings also exclude references without losing later prose', () => {
    const sections = splitSourceSections('Introduction prose.\n== References ==\nPMID 12345\n== Benefits ==\nUrban parks improve access to exercise.');
    assert.doesNotMatch(sections.map(s => s.text).join(' '), /PMID/);
    assert.match(sections.map(s => s.text).join(' '), /Urban parks/);
});

test('citation fragments and specialist gene or species notation cannot become passages', () => {
    for (const text of [
        'Further reading Allen (2001). PMID 12511035. doi:10.1001/example.',
        'The MT-ATP8 and MT-ATP6 genes are also missing from the mtDNA.',
        'Sphaeropteris intermedia is endemic to New Caledonia.',
        'The organism Tmesipteris oblanceolata has a very large genome.'
    ]) assert.ok(passageIssues(text).length, text);
});

test('ordinary academic science and useful numerical information remain eligible', () => {
    assert.deepEqual(passageIssues('Renewable energy can reduce CO2 emissions. Researchers estimate that investment increased by 25% in 2024, although storage remains a significant challenge.'), []);
});

test('blanks target recurring English vocabulary rather than rare names or scientific codes', () => {
    const frequency = new Map([['acidic', 12], ['grows', 30], ['planet', 80], ['oblanceolata', 1], ['difference-frequency', 10]]);
    for (const word of ['acidic', 'grows', 'planet']) assert.equal(isSuitableBlank(word, frequency), true, word);
    for (const word of ['oblanceolata', 'MT-ATP8', 'Sphaeropteris', 'difference-frequency', 'unknownterm']) assert.equal(isSuitableBlank(word, frequency), false, word);
});

test('repetition within one article cannot make an obscure word suitable', () => {
    const frequency = documentFrequencies([{ extract: 'oblanceolata '.repeat(100) }]);
    assert.equal(frequency.get('oblanceolata'), 1);
    assert.equal(isSuitableBlank('oblanceolata', frequency), false);
});

test('only distinct prose documents count toward blank eligibility', () => {
    const articles = Array.from({ length: 10 }, () => ({ extract: 'A planet grows.\n\nReferences\noblanceolata '.repeat(2) }));
    const frequency = documentFrequencies(articles);
    assert.equal(isSuitableBlank('planet', frequency), true);
    assert.equal(frequency.has('oblanceolata'), false);
});

test('dense rare vocabulary is filtered but an isolated advanced word is retained', () => {
    const frequency = new Map([['researchers', 80], ['investigations', 30]]);
    assert.ok(passageIssues('The ethnobiological and ethnomedicinal investigations examine local knowledge.', frequency).length);
    assert.deepEqual(passageIssues('An interdisciplinary approach can help researchers examine local knowledge.', frequency), []);
});

test('plain short headings are separated from prose rather than read aloud', () => {
    const sections = splitSourceSections('Introduction prose.\n\nBioactivity and toxicity testing\nWhen testing extracts, researchers use standard protocols.');
    assert.match(sections.map(s => s.text).join(' '), /When testing extracts/);
    assert.doesNotMatch(sections.map(s => s.text).join(' '), /Bioactivity and toxicity testing/);
});

test('protocol acronym lists and dense specialised terminology are excluded', () => {
    assert.ok(passageIssues('The protocols include CLSI, ISO, NIH, EURL ECVAM and OECD.').length);
    assert.ok(passageIssues('The terms diderm and monoderm describe the bacterial membrane.').length);
    const frequency = new Map([['macromolecular', 9]]);
    assert.ok(passageIssues('Macromolecular crowding is an important effect in biochemistry. Macromolecular interactions influence cells.', frequency).length);
});

test('a word seen in only eight source articles is not a blank target', () => {
    assert.equal(isSuitableBlank('gymnosperms', new Map([['gymnosperms', 8]])), false);
});
