#!/usr/bin/env node
/**
 * Validate database/banks/essays.js against the exact checks performed by
 * database/generate_mock_bank.js (Write Essay builder, lines ~762-774):
 *   - module.exports is an array, >= 58 entries, unique slugs
 *   - assembled model (intro + bodyFor + bodyAgainst + conclusion) is 200-300 words
 *   - at least 6 of the entry's own keywords appear in the model
 *     (light-normalised substring match, same as the generator)
 *
 * Exit 0 = pass. Usage: node scripts/validate_essays.js
 */
const list = require('../database/banks/essays.js');

if (!Array.isArray(list)) {
    console.error('FATAL: banks/essays.js must module.exports an array');
    process.exit(1);
}
if (list.length < 58) console.error(`FAIL: ${list.length} entries, need >= 58`);

const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const lightNorm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const errs = [];
const slugs = new Set();
let minW = Infinity, maxW = -Infinity, minCov = Infinity;

list.forEach((e, i) => {
    const tag = `idx ${i} ${e.slug || '(no slug)'}`;
    if (!e.slug || !e.title || !e.prompt) errs.push(`${tag}: missing slug/title/prompt`);
    if (slugs.has(e.slug)) errs.push(`${tag}: duplicate slug`);
    slugs.add(e.slug);
    for (const p of ['intro', 'bodyFor', 'bodyAgainst', 'conclusion', 'keywords']) {
        if (!Array.isArray(e[p])) errs.push(`${tag}: ${p} is not an array`);
    }
    if (!Array.isArray(e.intro) || !Array.isArray(e.bodyFor) ||
        !Array.isArray(e.bodyAgainst) || !Array.isArray(e.conclusion) ||
        !Array.isArray(e.keywords)) return; // structural failure already recorded

    const paras = [e.intro.join(' '), e.bodyFor.join(' '), e.bodyAgainst.join(' '), e.conclusion.join(' ')];
    const flat = paras.join(' ');
    const w = wc(flat);
    minW = Math.min(minW, w); maxW = Math.max(maxW, w);
    if (w < 200 || w > 300) errs.push(`${tag}: assembled model is ${w} words (need 200-300)`);

    if (e.keywords.length < 6) errs.push(`${tag}: only ${e.keywords.length} keywords (need >= 6)`);
    const flatNorm = lightNorm(flat);
    const covered = e.keywords.filter((k) => flatNorm.includes(lightNorm(k)));
    minCov = Math.min(minCov, covered.length);
    if (covered.length < 6) {
        errs.push(`${tag}: model covers only ${covered.length}/${e.keywords.length} keywords (need >= 6) — uncovered: ` +
            e.keywords.filter((k) => !flatNorm.includes(lightNorm(k))).join(', '));
    }
});

console.log(`entries: ${list.length} | word range: ${minW}-${maxW} | min keyword coverage: ${minCov}`);
if (errs.length) {
    console.error(`FAIL: ${errs.length} problem(s)`);
    errs.forEach((e) => console.error('  - ' + e));
    process.exit(1);
}
console.log('ESSAYS BANK OK');
