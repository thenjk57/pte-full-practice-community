// Corpus hygiene, not a claim of official Pearson difficulty calibration.
const EXCLUDED_SECTION = /^(references|external links|see also|notes|bibliography|further reading|footnotes|sources|works cited|gallery|display|citations?|references and notes|selected bibliography|timeline|maps|tables|exhibits?|discussion|conclusions?|acknowledgements?)$/i;

function splitSourceSections(text) {
    const sections = [];
    let title = 'Introduction', lines = [];
    const flush = () => {
        const body = lines.join('\n').trim();
        if (body && !EXCLUDED_SECTION.test(title)) sections.push({ title, text: body });
        lines = [];
    };
    const sourceLines = String(text).split(/\r?\n/);
    for (let i = 0; i < sourceLines.length; i++) {
        const line = sourceLines[i];
        const marked = line.match(/^={2,}\s*(.+?)\s*={2,}\s*$/);
        const plainHeading = !EXCLUDED_SECTION.test(title) &&
            (i === 0 || !sourceLines[i - 1].trim()) &&
            /^[A-Z][A-Za-z &/-]*$/.test(line.trim()) &&
            line.trim().split(/\s+/).length <= 8 &&
            sourceLines.slice(i + 1, i + 3).some(l => l.trim());
        if (marked || EXCLUDED_SECTION.test(line.trim()) || plainHeading) {
            flush();
            title = marked ? marked[1].trim() : line.trim();
        } else lines.push(line);
    }
    flush();
    return sections;
}

function passageIssues(text, frequency) {
    const issues = [];
    if (/\b(?:doi\s*:|PMID\s*:?\s*\d|ISBN\s*:?\s*[\d-]|Bibcode\s*:)|https?:\/\/doi\.org\/|\bFurther reading\b/i.test(text)) issues.push('bibliography or citation fragment');
    if (/\b[A-Z]{2,}-[A-Z]+\d+\b|\bmtDNA\b/.test(text)) issues.push('specialist genetic notation');
    if ((text.match(/\b[A-Z]{3,}\b/g) || []).length >= 4) issues.push('dense protocol acronym list');
    if (/\b(?:diderm|monoderm|desulfurylation)\b/i.test(text)) issues.push('specialist terminology');
    // Conservative botanical/zoological genus suffixes; do not reject normal place names.
    if (/\b[A-Z][a-z]*(?:pteris|saurus|therium|myces|bacterium)\s+[a-z]{4,}\b/.test(text)) issues.push('formal species nomenclature');
    if (frequency) {
        const tokens = String(text).match(/[A-Za-z]+/g) || [];
        const rareLong = tokens.filter(w => w.length >= 10 && (frequency.get(w.toLowerCase()) || 0) < 10);
        if (rareLong.length >= 2 && rareLong.length / tokens.length > 0.04) issues.push('dense rare specialist vocabulary');
    }
    return issues;
}

function isSuitableBlank(word, frequency) {
    return /^[a-z]{5,16}$/.test(word) && (frequency.get(word) || 0) >= 10;
}

function documentFrequencies(articles) {
    const frequency = new Map();
    for (const article of articles) {
        const text = splitSourceSections(article.extract).map(s => s.text).join(' ');
        const unique = new Set((text.match(/\b[a-z]{5,16}\b/g) || []));
        for (const word of unique) frequency.set(word, (frequency.get(word) || 0) + 1);
    }
    return frequency;
}
module.exports = { splitSourceSections, passageIssues, isSuitableBlank, documentFrequencies };
