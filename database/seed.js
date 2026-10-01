const { initDB, runQuery } = require('./db');

/**
 * ============================================================================
 *  PTE Academic — Full-Length Authentic Content Bank
 * ============================================================================
 *  Test 1 is a COMPLETE 2-hour PTE Academic mock covering all three parts
 *  with real item counts, authentic per-item timers, and a strict
 *  "audio plays exactly once" policy for every aural item.
 *
 *  PART 1  Speaking & Writing  (24 items)
 *  PART 2  Reading             (13 items)
 *  PART 3  Listening           (12 items)
 *  ----------------------------------------------------------------------------
 *  answer_key is always a JSON envelope, never a bare string. Shape:
 *    {
 *      type, model_answer, key_points[], answers{}, correct[],
 *      sequence[], word_range[], required_sentences, acceptable[], target_words
 *    }
 *  See PTE_FULL_MOCK_TEST.md for the full contract.
 * ============================================================================
 */

/** Encode a script for one-time browser playback via the Web Speech API. */
const tts = (text) => 'tts://' + encodeURIComponent(text);

const pteFullTest = {
    title: 'PTE Academic Official Full-Length Mock Test 1',
    exam_type: 'PTE',
    description:
        'Complete 2-hour PTE Academic simulation. Part 1 Speaking & Writing (24 items), Part 2 Reading (13 items), Part 3 Listening (12 items). Authentic per-item timers. Every audio stimulus plays EXACTLY ONCE with no replay.',
    total_time_minutes: 120,
    questions: [
        /* ====================================================================
         * PART 1 — SPEAKING & WRITING
         * ==================================================================== */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 1 — Sustainable Agriculture', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'Look at the text below. You have 35 seconds to prepare. Read the text aloud in 40 seconds as naturally and clearly as you can.',
            passage: 'Sustainable agricultural practices are increasingly vital to combating global climate change. By implementing crop rotation, reducing tillage, and utilizing organic fertilizers, farmers can enrich soil health while minimizing greenhouse gas emissions. Agricultural innovation remains a cornerstone of modern ecological preservation.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Sustainable agricultural practices are increasingly vital to combating global climate change. By implementing crop rotation, reducing tillage, and utilizing organic fertilizers, farmers can enrich soil health while minimizing greenhouse gas emissions. Agricultural innovation remains a cornerstone of modern ecological preservation.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 40, model_answer: 'Sustainable agricultural practices are increasingly vital to combating global climate change. By implementing crop rotation, reducing tillage, and utilizing organic fertilizers, farmers can enrich soil health while minimizing greenhouse gas emissions. Agricultural innovation remains a cornerstone of modern ecological preservation.', key_points: ['sustainable', 'agricultural', 'practices', 'combating', 'climate', 'crop', 'rotation', 'tillage', 'organic', 'fertilizers', 'soil', 'greenhouse', 'emissions', 'innovation', 'cornerstone', 'ecological', 'preservation'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 2 — Cognitive Neuroscience', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.',
            passage: 'Neuroscientists have discovered that neuroplasticity allows the human brain to reorganize itself by forming new neural connections throughout life. This adaptability enables individuals to recover from brain injuries and continuously acquire new cognitive skills regardless of age.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Neuroscientists have discovered that neuroplasticity allows the human brain to reorganize itself by forming new neural connections throughout life. This adaptability enables individuals to recover from brain injuries and continuously acquire new cognitive skills regardless of age.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 39, model_answer: 'Neuroscientists have discovered that neuroplasticity allows the human brain to reorganize itself by forming new neural connections throughout life. This adaptability enables individuals to recover from brain injuries and continuously acquire new cognitive skills regardless of age.', key_points: ['neuroscientists', 'neuroplasticity', 'brain', 'reorganize', 'neural', 'connections', 'adaptability', 'recover', 'injuries', 'cognitive', 'skills', 'regardless'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 3 — Coral Reef Degradation', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.',
            passage: 'Coral reefs, often described as the rainforests of the sea, are deteriorating at an alarming rate. Rising ocean temperatures trigger widespread bleaching events, while acidic water weakens the calcium carbonate structures upon which these delicate ecosystems depend. Without urgent intervention, much of this biodiversity could vanish within decades.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Coral reefs, often described as the rainforests of the sea, are deteriorating at an alarming rate. Rising ocean temperatures trigger widespread bleaching events, while acidic water weakens the calcium carbonate structures upon which these delicate ecosystems depend. Without urgent intervention, much of this biodiversity could vanish within decades.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 51, model_answer: 'Coral reefs, often described as the rainforests of the sea, are deteriorating at an alarming rate. Rising ocean temperatures trigger widespread bleaching events, while acidic water weakens the calcium carbonate structures upon which these delicate ecosystems depend. Without urgent intervention, much of this biodiversity could vanish within decades.', key_points: ['coral', 'reefs', 'deteriorating', 'ocean', 'temperatures', 'bleaching', 'acidic', 'calcium', 'carbonate', 'ecosystems', 'intervention', 'biodiversity'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 4 — The Industrial Revolution', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.',
            passage: 'The Industrial Revolution, which began in Britain during the late eighteenth century, fundamentally transformed manufacturing processes. The introduction of steam-powered machinery replaced manual labour, leading to unprecedented levels of production. However, this rapid urbanisation also brought overcrowded cities, poor sanitation, and difficult working conditions for the emerging industrial workforce.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'The Industrial Revolution, which began in Britain during the late eighteenth century, fundamentally transformed manufacturing processes. The introduction of steam-powered machinery replaced manual labour, leading to unprecedented levels of production. However, this rapid urbanisation also brought overcrowded cities, poor sanitation, and difficult working conditions for the emerging industrial workforce.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 52, model_answer: 'The Industrial Revolution, which began in Britain during the late eighteenth century, fundamentally transformed manufacturing processes. The introduction of steam-powered machinery replaced manual labour, leading to unprecedented levels of production. However, this rapid urbanisation also brought overcrowded cities, poor sanitation, and difficult working conditions for the emerging industrial workforce.', key_points: ['industrial', 'revolution', 'britain', 'eighteenth', 'manufacturing', 'steam', 'machinery', 'production', 'urbanisation', 'sanitation', 'workforce'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 5 — Urban Heat Islands', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.',
            passage: 'Urban heat islands occur because concrete, asphalt, and other building materials absorb and retain far more heat than natural landscapes. Consequently, city centres can be several degrees warmer than surrounding rural areas. Municipal governments are responding by planting street trees, installing reflective roofing, and preserving wetlands within metropolitan boundaries.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Urban heat islands occur because concrete, asphalt, and other building materials absorb and retain far more heat than natural landscapes. Consequently, city centres can be several degrees warmer than surrounding rural areas. Municipal governments are responding by planting street trees, installing reflective roofing, and preserving wetlands within metropolitan boundaries.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 47, model_answer: 'Urban heat islands occur because concrete, asphalt, and other building materials absorb and retain far more heat than natural landscapes. Consequently, city centres can be several degrees warmer than surrounding rural areas. Municipal governments are responding by planting street trees, installing reflective roofing, and preserving wetlands within metropolitan boundaries.', key_points: ['urban', 'heat', 'islands', 'concrete', 'asphalt', 'absorb', 'landscapes', 'city', 'centres', 'municipal', 'planting', 'reflective', 'wetlands'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'read_aloud', title: 'Read Aloud 6 — Antimicrobial Resistance', max_score: 10, prep_seconds: 35, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.',
            passage: 'Antimicrobial resistance represents one of the most serious threats to global public health. When antibiotics are overprescribed or taken incorrectly, bacteria evolve mechanisms that neutralise the medication. Experts warn that unless prescribing practices change and new drugs are developed, routine infections may once again become fatal within the coming generation.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Antimicrobial resistance represents one of the most serious threats to global public health. When antibiotics are overprescribed or taken incorrectly, bacteria evolve mechanisms that neutralise the medication. Experts warn that unless prescribing practices change and new drugs are developed, routine infections may once again become fatal within the coming generation.',
            answer_key: JSON.stringify({ type: 'read_aloud', target_words: 48, model_answer: 'Antimicrobial resistance represents one of the most serious threats to global public health. When antibiotics are overprescribed or taken incorrectly, bacteria evolve mechanisms that neutralise the medication. Experts warn that unless prescribing practices change and new drugs are developed, routine infections may once again become fatal within the coming generation.', key_points: ['antimicrobial', 'resistance', 'threats', 'antibiotics', 'overprescribed', 'bacteria', 'mechanisms', 'neutralise', 'medication', 'prescribing', 'infections', 'fatal'] }) },

        /* --- Repeat Sentence (audio plays ONCE, text never shown) --------- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'repeat_sentence', title: 'Repeat Sentence 1 — Library Hours', max_score: 10, prep_seconds: 0, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.',
            passage: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            media_url: '/audio/exam/rs_library_hours.mp3',
            model_answer: 'The university library will remain open until midnight during final examination week.',
            answer_key: JSON.stringify({ type: 'repeat_sentence', model_answer: 'The university library will remain open until midnight during final examination week.', key_points: ['university', 'library', 'remain', 'open', 'midnight', 'final', 'examination', 'week'], target_words: 12 }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'repeat_sentence', title: 'Repeat Sentence 2 — Proposal Deadline', max_score: 10, prep_seconds: 0, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.',
            passage: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            media_url: '/audio/exam/rs_proposal_deadline.mp3',
            model_answer: 'All research proposals must be submitted electronically before five o\u2019clock on Friday.',
            answer_key: JSON.stringify({ type: 'repeat_sentence', model_answer: 'All research proposals must be submitted electronically before five o\u2019clock on Friday.', key_points: ['research', 'proposals', 'submitted', 'electronically', 'before', 'five', 'clock', 'friday'], target_words: 12 }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'repeat_sentence', title: 'Repeat Sentence 3 — Science Block Access', max_score: 10, prep_seconds: 0, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.',
            passage: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            media_url: '/audio/exam/rs_science_block.mp3',
            model_answer: 'Students must collect their identification cards from the science block before Tuesday.',
            answer_key: JSON.stringify({ type: 'repeat_sentence', model_answer: 'Students must collect their identification cards from the science block before Tuesday.', key_points: ['students', 'collect', 'identification', 'cards', 'science', 'block', 'before', 'tuesday'], target_words: 13 }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'repeat_sentence', title: 'Repeat Sentence 4 — Seminar Registration', max_score: 10, prep_seconds: 0, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.',
            passage: null, options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            media_url: '/audio/exam/rs_seminar_registration.mp3',
            model_answer: 'Registration for the optional seminar closes at noon on the first day of term.',
            answer_key: JSON.stringify({ type: 'repeat_sentence', model_answer: 'Registration for the optional seminar closes at noon on the first day of term.', key_points: ['registration', 'optional', 'seminar', 'closes', 'noon', 'first', 'day', 'term'], target_words: 13 }) },

        /* --- Describe Image (SVG chart rendered in-browser) --------------- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'describe_image', title: 'Describe Image 1 — Global Renewable Energy Consumption', max_score: 10, prep_seconds: 25, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 25 seconds to prepare. Describe the image in 40 seconds. Mention the main feature, the highest and lowest values, and a concluding statement.',
            passage: null, media_url: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            options: JSON.stringify({ chart: { type: 'bar', title: 'Global Renewable Energy Consumption by Source', subtitle: 'Share of total renewable output, 2015–2025', xLabel: 'Energy source', yLabel: 'Percentage (%)', categories: ['Solar', 'Wind', 'Hydro', 'Bioenergy'], series: [{ name: 'Share', values: [45, 30, 15, 10] }] } }),
            model_answer: 'The bar chart illustrates the share of global renewable energy consumption by source between 2015 and 2025. Solar accounts for the largest share at forty-five percent, followed by wind at thirty percent. Hydro represents fifteen percent, while bioenergy is the smallest at only ten percent. Overall, solar and wind together dominate global renewable output.',
            answer_key: JSON.stringify({ type: 'describe_image', target_words: 55, model_answer: 'The bar chart illustrates the share of global renewable energy consumption by source between 2015 and 2025. Solar accounts for the largest share at forty-five percent, followed by wind at thirty percent. Hydro represents fifteen percent, while bioenergy is the smallest at only ten percent. Overall, solar and wind together dominate global renewable output.', key_points: ['bar', 'chart', 'renewable', 'energy', 'solar', 'forty-five', 'wind', 'thirty', 'hydro', 'fifteen', 'bioenergy', 'ten', 'largest', 'smallest', 'overall'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'describe_image', title: 'Describe Image 2 — Global Mean Temperature Anomaly', max_score: 10, prep_seconds: 25, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 25 seconds to prepare. Describe the image in 40 seconds. Identify the overall trend and the extreme values.',
            passage: null, media_url: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            options: JSON.stringify({ chart: { type: 'line', title: 'Global Mean Temperature Anomaly', subtitle: 'Degrees Celsius above the 1951–1980 baseline', xLabel: 'Year', yLabel: 'Anomaly (°C)', categories: ['1980', '1990', '2000', '2010', '2020', '2024'], series: [{ name: 'Anomaly', values: [0.26, 0.45, 0.61, 0.72, 1.02, 1.28] }] } }),
            model_answer: 'The line graph shows the global mean temperature anomaly from 1980 to 2024 relative to the mid-twentieth-century baseline. The trend is consistently upward, rising from roughly zero point two six degrees in 1980 to one point two eight degrees in 2024. The increase accelerates after 2000, with the highest recorded anomaly occurring in the final year shown.',
            answer_key: JSON.stringify({ type: 'describe_image', target_words: 55, model_answer: 'The line graph shows the global mean temperature anomaly from 1980 to 2024 relative to the mid-twentieth-century baseline. The trend is consistently upward, rising from roughly zero point two six degrees in 1980 to one point two eight degrees in 2024. The increase accelerates after 2000, with the highest recorded anomaly occurring in the final year shown.', key_points: ['line', 'graph', 'temperature', 'anomaly', 'upward', '1980', '2024', 'rising', 'one point two eight', 'accelerates', 'highest', 'trend'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'describe_image', title: 'Describe Image 3 — Household Water Usage', max_score: 10, prep_seconds: 25, time_limit_seconds: 40, audio_play_policy: 'none',
            prompt: 'You have 25 seconds to prepare. Describe the image in 40 seconds. Name the largest and smallest categories and give a summary.',
            passage: null, media_url: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            options: JSON.stringify({ chart: { type: 'pie', title: 'Household Water Usage by Activity', subtitle: 'Average daily consumption per person', categories: ['Toilets', 'Showers', 'Laundry', 'Kitchen', 'Drinking'], values: [30, 25, 20, 15, 10] } }),
            model_answer: 'The pie chart breaks down average household water consumption per person by activity. Toilets account for the largest proportion at thirty percent, while showers follow at twenty-five percent. Laundry and kitchen use represent twenty and fifteen percent respectively, and drinking constitutes the smallest share at ten percent. Overall, sanitation and washing dominate daily water demand.',
            answer_key: JSON.stringify({ type: 'describe_image', target_words: 52, model_answer: 'The pie chart breaks down average household water consumption per person by activity. Toilets account for the largest proportion at thirty percent, while showers follow at twenty-five percent. Laundry and kitchen use represent twenty and fifteen percent respectively, and drinking constitutes the smallest share at ten percent. Overall, sanitation and washing dominate daily water demand.', key_points: ['pie', 'chart', 'water', 'toilets', 'thirty', 'showers', 'twenty-five', 'laundry', 'kitchen', 'drinking', 'ten', 'largest', 'smallest', 'overall'] }) },

        /* --- Re-tell Lecture (audio plays ONCE) -------------------------- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'retell_lecture', title: 'Re-tell Lecture 1 — Urban Transportation Economics', max_score: 10, prep_seconds: 10, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a short lecture. It plays ONLY ONCE. You have 10 seconds to prepare, then 40 seconds to re-tell it in your own words.',
            passage: null, media_url: '/audio/exam/rl_urban_transit.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'The lecture discussed the problem of congestion in large cities and proposed digital congestion pricing as a solution. By charging drivers more during peak hours, people are encouraged to use public transport, which reduces delays. The speaker also noted that the revenue generated can be reinvested in roads, rail services, and cycle networks, creating a self-funding improvement cycle.',
            answer_key: JSON.stringify({ type: 'retell_lecture', target_words: 55, model_answer: 'The lecture discussed the problem of congestion in large cities and proposed digital congestion pricing as a solution. By charging drivers more during peak hours, people are encouraged to use public transport, which reduces delays. The speaker also noted that the revenue generated can be reinvested in roads, rail services, and cycle networks, creating a self-funding improvement cycle.', key_points: ['urban', 'transport', 'capacity', 'congestion', 'pricing', 'peak', 'hours', 'public', 'transport', 'delays', 'revenue', 'invested', 'roads', 'rail', 'cycle'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'retell_lecture', title: 'Re-tell Lecture 2 — Sleep and Memory', max_score: 10, prep_seconds: 10, time_limit_seconds: 40, audio_play_policy: 'once',
            prompt: 'You will hear a short lecture. It plays ONLY ONCE. You have 10 seconds to prepare, then 40 seconds to re-tell it in your own words.',
            passage: null, media_url: '/audio/exam/rl_sleep_memory.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'The lecture explained how sleep consolidates memory. During deep sleep the brain replays the day\u2019s events and moves information from short-term into long-term storage. The researcher presented a study showing that students who slept after studying recalled significantly more than students who stayed awake for the same amount of time, underlining the importance of rest for learning.',
            answer_key: JSON.stringify({ type: 'retell_lecture', target_words: 55, model_answer: 'The lecture explained how sleep consolidates memory. During deep sleep the brain replays the day\u2019s events and moves information from short-term into long-term storage. The researcher presented a study showing that students who slept after studying recalled significantly more than students who stayed awake for the same amount of time, underlining the importance of rest for learning.', key_points: ['sleep', 'memory', 'consolidating', 'deep', 'sleep', 'brain', 'replays', 'short-term', 'long-term', 'students', 'studied', 'recall', 'awake', 'tests'] }) },

        /* --- Answer Short Question (audio plays ONCE, 10s response) ------ */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 1', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_capital_australia.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Canberra',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Canberra', acceptable: ['canberra', 'the capital is canberra'], key_points: ['canberra'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 2', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_gas_photosynthesis.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Carbon dioxide',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Carbon dioxide', acceptable: ['carbon dioxide', 'co2', 'carbon-dioxide'], key_points: ['carbon', 'dioxide'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 3', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_heart_doctor.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Cardiologist',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Cardiologist', acceptable: ['cardiologist', 'a cardiologist', 'heart specialist'], key_points: ['cardiologist'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 4', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_continents_count.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Seven',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Seven', acceptable: ['seven', '7', 'there are seven'], key_points: ['seven'] }) },

        /* --- 2 further ASQs folded in from the retired seed_pte_full.js bank --- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 5', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_century.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Century',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Century', acceptable: ['century', 'a century', 'one century'], key_points: ['century'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'speaking', question_type: 'answer_short_question', title: 'Answer Short Question 6', max_score: 10, prep_seconds: 0, time_limit_seconds: 12, audio_play_policy: 'once',
            prompt: 'You will hear a question. It plays ONLY ONCE. Answer it in a word or a short phrase within 10 seconds.',
            passage: null, media_url: '/audio/exam/asq_thermometer.mp3',
            options: null, scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'Thermometer',
            answer_key: JSON.stringify({ type: 'answer_short_question', model_answer: 'Thermometer', acceptable: ['thermometer', 'a thermometer', 'thermometers'], key_points: ['thermometer'] }) },

        /* --- Summarize Written Text (1 sentence, 5–75 words, 10 min) ----- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'writing', question_type: 'summarize_written_text', title: 'Summarize Written Text 1 — Smart Urban Transit', max_score: 10, prep_seconds: 0, time_limit_seconds: 600, audio_play_policy: 'none',
            prompt: 'Summarise the passage below in ONE single sentence of between 5 and 75 words. You have 10 minutes. Content, form, grammar, vocabulary and written discourse are all scored.',
            passage: 'Rapid urbanization across developing nations has strained existing transit networks, leading to severe traffic congestion and elevated carbon emissions. City planners are increasingly turning to smart transportation systems that leverage real-time data and automated traffic signal adjustment. Early pilot programs in metropolitan areas demonstrate a 25% reduction in transit delays and a noticeable decrease in localized air pollution, proving that digital infrastructure can mitigate physical capacity constraints.',
            media_url: null, options: null, scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'Because rapid urbanisation has overwhelmed transit networks with congestion and emissions, city planners are adopting data-driven smart transport systems whose pilot programmes have cut delays by twenty-five percent and reduced local air pollution, demonstrating that digital infrastructure can relieve physical capacity constraints.',
            answer_key: JSON.stringify({ type: 'summarize_written_text', required_sentences: 1, word_range: [5, 75], target_words: 55, model_answer: 'Because rapid urbanisation has overwhelmed transit networks with congestion and emissions, city planners are adopting data-driven smart transport systems whose pilot programmes have cut delays by twenty-five percent and reduced local air pollution, demonstrating that digital infrastructure can relieve physical capacity constraints.', key_points: ['urbanization', 'transit', 'networks', 'congestion', 'emissions', 'smart', 'data', 'delays', 'pollution', 'digital', 'infrastructure'] }) },

        /* --- Write Essay (200–300 words, 20 min each) -------------------- */
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'writing', question_type: 'write_essay', title: 'Write Essay 1 — Artificial Intelligence in Healthcare', max_score: 15, prep_seconds: 0, time_limit_seconds: 1200, audio_play_policy: 'none',
            prompt: 'You have 20 minutes to plan, write and revise an essay of 200–300 words.\n\nTopic: Some people believe that Artificial Intelligence will replace human doctors in medical diagnosis and treatment in the near future. To what extent do you agree or disagree? Support your position with relevant examples.',
            passage: null, media_url: null, options: null, scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'Artificial intelligence has already demonstrated remarkable accuracy in detecting conditions such as skin cancer and diabetic retinopathy, which has led some commentators to predict that human doctors will soon be redundant. While AI will undoubtedly assume a growing share of diagnostic work, I disagree that it will replace clinicians entirely, because medicine depends on judgement under uncertainty, empathetic communication and ethical accountability that machines cannot presently replicate.\n\nTo begin with, algorithmic diagnosis excels where datasets are large and patterns are stable. Radiological screening and pathology slide analysis are cases in which software consistently matches or exceeds average human performance, and hospitals that adopt such tools report faster turnaround times and fewer oversight errors. It is therefore sensible to delegate narrow, repetitive interpretation tasks to machines.\n\nHowever, treatment decisions rarely reduce to pattern recognition. A patient presenting with chest pain may have an atypical history, financial constraints or anxiety that colours the clinical picture; weighing these factors requires conversation and trust. Moreover, when an algorithm errs, responsibility must rest with a identifiable professional, whereas an opaque model cannot be held accountable in any meaningful sense.\n\nIn conclusion, artificial intelligence will transform medicine rather than replace physicians, taking over high-volume diagnostic tasks while leaving holistic judgement, empathy and accountability in human hands. Medical schools should therefore teach students to collaborate with these systems rather than compete against them.',
            answer_key: JSON.stringify({ type: 'write_essay', word_range: [200, 300], target_words: 260, model_answer: 'Artificial intelligence has already demonstrated remarkable accuracy in detecting conditions such as skin cancer and diabetic retinopathy, which has led some commentators to predict that human doctors will soon be redundant. While AI will undoubtedly assume a growing share of diagnostic work, I disagree that it will replace clinicians entirely, because medicine depends on judgement under uncertainty, empathetic communication and ethical accountability that machines cannot presently replicate. To begin with, algorithmic diagnosis excels where datasets are large and patterns are stable. Radiological screening and pathology slide analysis are cases in which software consistently matches or exceeds average human performance, and hospitals that adopt such tools report faster turnaround times and fewer oversight errors. It is therefore sensible to delegate narrow, repetitive interpretation tasks to machines. However, treatment decisions rarely reduce to pattern recognition. A patient presenting with chest pain may have an atypical history, financial constraints or anxiety that colours the clinical picture; weighing these factors requires conversation and trust. Moreover, when an algorithm errs, responsibility must rest with an identifiable professional, whereas an opaque model cannot be held accountable in any meaningful sense. In conclusion, artificial intelligence will transform medicine rather than replace physicians, taking over high-volume diagnostic tasks while leaving holistic judgement, empathy and accountability in human hands. Medical schools should therefore teach students to collaborate with these systems rather than compete against them.', key_points: ['artificial intelligence', 'diagnosis', 'replace', 'disagree', 'judgement', 'empathetic', 'accountability', 'radiological', 'pattern recognition', 'conclusion'] }) },

        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'writing', question_type: 'write_essay', title: 'Write Essay 2 — Remote Working and the Urban Economy', max_score: 15, prep_seconds: 0, time_limit_seconds: 1200, audio_play_policy: 'none',
            prompt: 'You have 20 minutes to plan, write and revise an essay of 200–300 words.\n\nTopic: Remote working arrangements have permanently altered corporate structure and commercial real estate. Discuss the advantages and disadvantages of this trend for both employers and employees.',
            passage: null, media_url: null, options: null, scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'The rapid shift to remote working that began during the pandemic has become a permanent feature of the labour market, and its consequences extend well beyond the individual desk. This essay discusses the principal advantages and disadvantages of the trend for both employers and employees.\n\nOn the positive side, companies no longer need to fund extensive office space, and they can recruit talent regardless of geography. Employees, for their part, reclaim the hours previously spent commuting and often report a better work-life balance. These gains help organisations retain experienced staff in what remains a fiercely competitive labour market.\n\nNevertheless, the disadvantages are significant and should not be minimised. Junior workers lose the informal mentoring that a shared office provides almost accidentally, and collaboration on complex projects becomes harder when every conversation must be scheduled in advance. Employers also face genuine difficulties in monitoring productivity and in preserving a coherent company culture across geographically scattered teams.\n\nCommercial property illustrates the wider economic effect: city centres that once depended on office workers now contend with vacant towers, sharply reduced footfall for nearby cafes and shops, and a narrowing municipal tax base that ultimately constrains public services.\n\nIn conclusion, while remote working delivers substantial flexibility and measurable savings for employers and staff alike, it weakens informal training, erodes company culture and hollows out urban economies, so a deliberate hybrid model that balances both sides remains the most sustainable long-term outcome for every stakeholder involved.',
            answer_key: JSON.stringify({ type: 'write_essay', word_range: [200, 300], target_words: 280, model_answer: 'The rapid shift to remote working that began during the pandemic has become a permanent feature of the labour market, and its consequences extend well beyond the individual desk. This essay discusses the principal advantages and disadvantages of the trend for both employers and employees. On the positive side, companies no longer need to fund extensive office space, and they can recruit talent regardless of geography. Employees, for their part, reclaim the hours previously spent commuting and often report a better work-life balance. These gains help organisations retain experienced staff in what remains a fiercely competitive labour market. Nevertheless, the disadvantages are significant and should not be minimised. Junior workers lose the informal mentoring that a shared office provides almost accidentally, and collaboration on complex projects becomes harder when every conversation must be scheduled in advance. Employers also face genuine difficulties in monitoring productivity and in preserving a coherent company culture across geographically scattered teams. Commercial property illustrates the wider economic effect: city centres that once depended on office workers now contend with vacant towers, sharply reduced footfall for nearby cafes and shops, and a narrowing municipal tax base that ultimately constrains public services. In conclusion, while remote working delivers substantial flexibility and measurable savings for employers and staff alike, it weakens informal training, erodes company culture and hollows out urban economies, so a deliberate hybrid model that balances both sides remains the most sustainable long-term outcome for every stakeholder involved.', key_points: ['remote working', 'advantages', 'disadvantages', 'employers', 'employees', 'office space', 'commuting', 'work-life balance', 'mentoring', 'culture', 'commercial property', 'conclusion'] }) },

        /* ====================================================================
         * PART 2 — READING (13 items)
         * ==================================================================== */
        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'mcma', title: 'Multiple Choice, Choose Multiple Answers — The Sharing Economy', max_score: 10, prep_seconds: 0, time_limit_seconds: 200, audio_play_policy: 'none',
            prompt: 'Read the passage and choose THREE correct options. Wrong answers incur a negative penalty, so select only what the text supports.',
            passage: 'The sharing economy is frequently presented as a frictionless exchange between individuals, yet the reality is more complicated. Platforms such as ride-hailing and short-lease marketplaces derive their profitability from taking a commission on every transaction, which means their interests are aligned with maximising volume rather than with the welfare of providers. Regulators have responded unevenly: some cities license operators strictly, while others have allowed them to expand before establishing any framework. Critics argue that because providers bear the costs of insurance, maintenance and downtime, the arrangement effectively transfers commercial risk from a well-funded corporation to an individual worker. Supporters counter that the model lowers barriers to entry and gives people a flexible source of income that traditional employment cannot offer.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ choices: [
                { label: 'A', text: 'Platforms earn commission on transactions, so they benefit from higher volume.' },
                { label: 'B', text: 'Providers in the sharing economy carry costs such as insurance and maintenance.' },
                { label: 'C', text: 'All cities regulate ride-hailing operators under an identical legal framework.' },
                { label: 'D', text: 'Supporters argue the model offers flexible income and lower barriers to entry.' },
                { label: 'E', text: 'The passage states that ride-hailing has eliminated conventional taxi services entirely.' }
            ] }),
            model_answer: 'A, B, D',
            answer_key: JSON.stringify({ type: 'mcma', correct: ['A', 'B', 'D'], model_answer: 'A, B, D', explanations: { A: 'Supported directly: "derive their profitability from taking a commission on every transaction".', B: 'Supported: "providers bear the costs of insurance, maintenance and downtime".', C: 'Contradicted: "Regulators have responded unevenly".', D: 'Supported: "lowers barriers to entry and gives people a flexible source of income".', E: 'Not stated anywhere in the passage.' } }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reorder_paragraphs', title: 'Re-order Paragraphs 1 — Discovery of Penicillin', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'The text boxes below are in random order. Restore the original sequence by arranging them in logical order.',
            passage: 'A) In 1928, Alexander Fleming discovered penicillin by accident when a mould contaminated a culture plate.\nB) He noticed that the mould prevented the normal growth of staphylococci bacteria around it.\nC) Subsequent isolation of the active chemical ingredient revolutionised modern clinical medicine.\nD) Mass production during the Second World War saved millions of wounded soldiers from bacterial infection.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'discourse']),
            options: JSON.stringify({ boxes: ['A', 'B', 'C', 'D'] }),
            model_answer: 'A → B → C → D',
            answer_key: JSON.stringify({ type: 'reorder', sequence: ['A', 'B', 'C', 'D'], model_answer: 'A → B → C → D', explanations: { logic: 'Discovery (A) prompts the observation (B), which leads to isolation of the compound (C), and only then to wartime mass production (D).' } }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reorder_paragraphs', title: 'Re-order Paragraphs 2 — Photosynthesis and Light', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'The text boxes below are in random order. Restore the original sequence by arranging them in logical order.',
            passage: 'A) Chlorophyll in the leaf absorbs this energy and converts it into chemical energy.\nB) Without sufficient light the reaction slows, which is why plants grown in darkness etiolate.\nC) Photosynthesis begins when sunlight strikes the surface of a leaf.\nD) The chemical energy is then used to convert carbon dioxide and water into glucose and oxygen.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'discourse']),
            options: JSON.stringify({ boxes: ['A', 'B', 'C', 'D'] }),
            model_answer: 'C → A → D → B',
            answer_key: JSON.stringify({ type: 'reorder', sequence: ['C', 'A', 'D', 'B'], model_answer: 'C → A → D → B', explanations: { logic: 'The process opens with sunlight striking the leaf (C), then absorption by chlorophyll (A), then conversion into glucose (D), and closes with the consequence of insufficient light (B).' } }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'mcsa', title: 'Multiple Choice, Choose Single Answer — Urban Farming', max_score: 10, prep_seconds: 0, time_limit_seconds: 150, audio_play_policy: 'none',
            prompt: 'Read the passage and choose the ONE option that best answers the question: What is the writer\u2019s main argument?',
            passage: 'Vertical farming — the practice of growing crops in stacked indoor layers — is often lauded for using ninety-five percent less water than conventional agriculture. Yet the enthusiasm overlooks a decisive constraint: the energy required to replace sunlight with artificial lighting. In regions where electricity is generated largely from coal, the carbon footprint of a vertically farmed lettuce can exceed that of one trucked from a distant field. Proponents respond that falling photovoltaic costs and LED efficiency are steadily narrowing this gap, and that the true value of indoor farming lies not in calories but in resilience, since crops grow unaffected by drought and flood.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ choices: [
                { label: 'A', text: 'Vertical farming should be abandoned because it consumes too much electricity.' },
                { label: 'B', text: 'The water savings of vertical farming are exaggerated by its supporters.' },
                { label: 'C', text: 'Vertical farming\u2019s worth should be judged by food security rather than by calorie cost alone.' },
                { label: 'D', text: 'Trucked vegetables will always have a smaller carbon footprint than indoor crops.' }
            ] }),
            model_answer: 'C',
            answer_key: JSON.stringify({ type: 'mcsa', correct: ['C'], model_answer: 'C', explanations: { C: 'The writer concedes the energy problem but concludes the "true value ... lies not in calories but in resilience".', A: 'Too extreme; the writer says the gap is narrowing.', B: 'Opposite of the text — the ninety-five percent figure is presented as fact.', D: 'Contradicted by "can exceed", which allows indoor crops to win in clean-energy regions.' } }) },

        /* --- Reading: Fill in the Blanks (typed answers) ----------------- */
        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reading_fill_blanks', title: 'Reading Fill in the Blanks 1 — Renewable Energy Costs', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Drag or type the most appropriate word into each gap. One word only per gap.',
            passage: 'Over the past decade the levelised cost of solar photovoltaics has fallen dramatically, making renewables the cheapest source of new electricity in most of the world. Advances in manufacturing and economies of scale have driven panel prices down, while improved [blank1] has increased the amount of energy each panel produces. Governments continue to offer tax [blank2] to encourage households to install capacity, and ageing coal plants are being [blank3] earlier than originally scheduled because they can no longer compete on price.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'spelling']),
            options: JSON.stringify({ bank: ['efficiency', 'incentives', 'decommissioned', 'inflation', 'tariffs', 'obsolete'] }),
            model_answer: 'efficiency / incentives / decommissioned',
            answer_key: JSON.stringify({ type: 'reading_fill_blanks', answers: { blank1: ['efficiency', 'efficient'], blank2: ['incentives', 'incentive'], blank3: ['decommissioned', 'retired', 'closed', 'shut'] }, model_answer: 'efficiency / incentives / decommissioned' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reading_fill_blanks', title: 'Reading Fill in the Blanks 2 — The Water Cycle', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Drag or type the most appropriate word into each gap. One word only per gap.',
            passage: 'Water moves continuously between the ocean, the atmosphere and the land. When the sun heats the sea, water evaporates and rises as vapour; as it cools at altitude it condenses into clouds. Precipitation then returns moisture to the surface, where it either [blank1] into rivers or soaks into the ground to become groundwater. A portion of this water is [blank2] by plants and released again through their leaves, a process that links the terrestrial cycle directly to the [blank3] one.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'spelling']),
            options: JSON.stringify({ bank: ['flows', 'transpired', 'atmospheric', 'refrigerated', 'condenses', 'mineral'] }),
            model_answer: 'flows / transpired / atmospheric',
            answer_key: JSON.stringify({ type: 'reading_fill_blanks', answers: { blank1: ['flows', 'flows.', 'runs'], blank2: ['transpired', 'absorbed', 'taken'], blank3: ['atmospheric', 'atmosphere'] }, model_answer: 'flows / transpired / atmospheric' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reading_fill_blanks', title: 'Reading Fill in the Blanks 3 — Antibiotic Development', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Drag or type the most appropriate word into each gap. One word only per gap.',
            passage: 'Pharmaceutical companies have largely abandoned antibiotic research because the financial returns are unattractive. A newly developed drug may be held in [blank1] as a last resort, meaning it is rarely prescribed and therefore generates little revenue. Meanwhile resistance continues to spread, [blank2] the effectiveness of existing treatments. Some economists propose that governments should offer [blank3] payments or market-entry rewards to make the development of new antimicrobials commercially viable once again.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'spelling']),
            options: JSON.stringify({ bank: ['reserve', 'eroding', 'guaranteed', 'storage', 'improving', 'penalties'] }),
            model_answer: 'reserve / eroding / guaranteed',
            answer_key: JSON.stringify({ type: 'reading_fill_blanks', answers: { blank1: ['reserve', 'reserves'], blank2: ['eroding', 'reducing', 'undermining', 'weakening'], blank3: ['guaranteed', 'fixed', 'direct'] }, model_answer: 'reserve / eroding / guaranteed' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reading_fill_blanks', title: 'Reading Fill in the Blanks 4 — Language Acquisition', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Drag or type the most appropriate word into each gap. One word only per gap.',
            passage: 'Children acquire language with remarkable speed, and by the age of five most speakers command several thousand words. They do this not by memorising definitions but by [blank1] patterns from the speech they hear around them. Exposure to varied vocabulary is essential: studies show that children who hear a wider range of words develop a larger [blank2] earlier, which in turn predicts later reading ability. This is why early [blank3] programmes have such a lasting effect on educational outcomes.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'spelling']),
            options: JSON.stringify({ bank: ['inferring', 'lexicon', 'intervention', 'forgetting', 'grammar', 'punishment'] }),
            model_answer: 'inferring / lexicon / intervention',
            answer_key: JSON.stringify({ type: 'reading_fill_blanks', answers: { blank1: ['inferring', 'inferring.', 'noticing', 'detecting'], blank2: ['lexicon', 'vocabulary', 'repertoire'], blank3: ['intervention', 'literacy', 'language', 'education'] }, model_answer: 'inferring / lexicon / intervention' }) },

        /* --- 1 further Reading FIB folded in from the retired seed_pte_full.js bank --- */
        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'reading_fill_blanks', title: 'Reading Fill in the Blanks 5 — Deep Ocean Exploration', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Drag or type the most appropriate word into each gap. One word only per gap.',
            passage: 'Hydrothermal vents on the ocean floor support unique ecosystems that thrive in the absence of sunlight. Instead of photosynthesis, organisms in these extreme habitats rely on [blank1], converting chemical compounds dissolved in thermal water into organic energy. Studying these extremophiles offers valuable insights into the potential for life on other [blank2] in the solar system.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary', 'spelling']),
            options: JSON.stringify({ bank: ['chemosynthesis', 'planets', 'evaporation', 'respiration', 'comets', 'atmospheres'] }),
            model_answer: 'chemosynthesis / planets',
            answer_key: JSON.stringify({ type: 'reading_fill_blanks', answers: { blank1: ['chemosynthesis'], blank2: ['planets'] }, model_answer: 'chemosynthesis / planets' }) },

        /* --- Reading & Writing Fill in the Blanks (dropdowns) ------------ */
        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'rw_fill_blanks', title: 'Reading & Writing Fill in the Blanks 1 — Solar Power', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Select the appropriate word from each dropdown list to complete the passage correctly.',
            passage: 'Advances in renewable energy technology have significantly [blank1] the cost of solar power generation. Over the past decade, solar panels have become far more [blank2], allowing household consumers and industrial facilities to transition towards sustainable power grids. Governments worldwide continue to provide tax [blank3] to accelerate adoption.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ blank1: ['reduced', 'increased', 'stagnated', 'negated'], blank2: ['efficient', 'costly', 'obsolete', 'volatile'], blank3: ['incentives', 'penalties', 'tariffs', 'barriers'] }),
            model_answer: 'reduced / efficient / incentives',
            answer_key: JSON.stringify({ type: 'rw_fill_blanks', answers: { blank1: 'reduced', blank2: 'efficient', blank3: 'incentives' }, model_answer: 'reduced / efficient / incentives' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'rw_fill_blanks', title: 'Reading & Writing Fill in the Blanks 2 — Memory Consolidation', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Select the appropriate word from each dropdown list to complete the passage correctly.',
            passage: 'Sleep does far more than restore physical energy; it is also the period during which the brain [blank1] the day\u2019s learning into lasting memory. Researchers believe that during deep sleep the hippocampus [blank2] information to the neocortex for permanent storage. Students who sacrifice sleep to study longer therefore [blank3] their chances of recall, not improve them.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ blank1: ['consolidates', 'discards', 'inventories', 'postpones'], blank2: ['transfers', 'deletes', 'camouflages', 'magnifies'], blank3: ['reduce', 'double', 'guarantee', 'enhance'] }),
            model_answer: 'consolidates / transfers / reduce',
            answer_key: JSON.stringify({ type: 'rw_fill_blanks', answers: { blank1: 'consolidates', blank2: 'transfers', blank3: 'reduce' }, model_answer: 'consolidates / transfers / reduce' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'rw_fill_blanks', title: 'Reading & Writing Fill in the Blanks 3 — Corporate Reporting', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Select the appropriate word from each dropdown list to complete the passage correctly.',
            passage: 'Annual reports were originally designed to [blank1] shareholders on the financial health of a company. In practice, modern disclosures are so lengthy that few investors read them, and the most important figures are often [blank2] within hundreds of pages of boilerplate text. Regulators have therefore begun to [blank3] the information that firms must present prominently.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ blank1: ['inform', 'deceive', 'entertain', 'exclude'], blank2: ['buried', 'celebrated', 'translated', 'recycled'], blank3: ['simplify', 'complicate', 'abolish', 'postpone'] }),
            model_answer: 'inform / buried / simplify',
            answer_key: JSON.stringify({ type: 'rw_fill_blanks', answers: { blank1: 'inform', blank2: 'buried', blank3: 'simplify' }, model_answer: 'inform / buried / simplify' }) },

        { part: 2, part_title: 'Part 2: Reading', module: 'reading', question_type: 'rw_fill_blanks', title: 'Reading & Writing Fill in the Blanks 4 — Coral Spawning', max_score: 10, prep_seconds: 0, time_limit_seconds: 180, audio_play_policy: 'none',
            prompt: 'Select the appropriate word from each dropdown list to complete the passage correctly.',
            passage: 'Once a year, corals mass-spawn in a spectacular display that [blank1] a once-a-year opportunity for fertilisation. Because the larvae must settle before being swept away, [blank2] timing is critical; a shift of only a few days can leave newly settled coral in unsuitable conditions. Warming seas have begun to [blank3] this delicate synchrony, threatening recovery efforts.',
            media_url: null, scored_enabling: JSON.stringify(['vocabulary']),
            options: JSON.stringify({ blank1: ['represents', 'destroys', 'conceals', 'postpones'], blank2: ['precise', 'random', 'lengthy', 'identical'], blank3: ['disrupt', 'reinforce', 'document', 'preserve'] }),
            model_answer: 'represents / precise / disrupt',
            answer_key: JSON.stringify({ type: 'rw_fill_blanks', answers: { blank1: 'represents', blank2: 'precise', blank3: 'disrupt' }, model_answer: 'represents / precise / disrupt' }) },

        /* ====================================================================
         * PART 3 — LISTENING (12 items, every audio plays EXACTLY ONCE)
         * ==================================================================== */
        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'summarize_spoken_text', title: 'Summarize Spoken Text 1 — Biodiversity Loss', max_score: 10, prep_seconds: 0, time_limit_seconds: 600, audio_play_policy: 'once',
            prompt: 'You will hear a short recording. It plays ONLY ONCE. Write a summary of 50–70 words for a student who missed the lecture. You have 10 minutes.',
            passage: null, media_url: '/audio/exam/sst_biodiversity_loss.mp3',
            options: null, scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'Biodiversity loss is accelerating because of deforestation, habitat fragmentation and climate disruption, which destroy habitat, isolate populations and shift seasonal breeding cues; scientists stress that extinctions weaken the ecological networks that purify water, pollinate crops and regulate disease, so preserving and reconnecting habitats is vital for wildlife and human food security alike.',
            answer_key: JSON.stringify({ type: 'summarize_spoken_text', word_range: [50, 70], target_words: 60, model_answer: 'Biodiversity loss is accelerating because of deforestation, habitat fragmentation and climate disruption, which destroy habitat, isolate populations and shift seasonal breeding cues; scientists stress that extinctions weaken the ecological networks that purify water, pollinate crops and regulate disease, so preserving and reconnecting habitats is vital for wildlife and human food security alike.', key_points: ['biodiversity', 'loss', 'deforestation', 'fragmentation', 'climate', 'habitat', 'populations', 'wildlife', 'water', 'pollinate', 'preserving'] }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'mcma', title: 'Listening MCQ, Multiple Answers — The Gig Economy', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Choose the TWO statements that reflect the speaker\u2019s view.',
            passage: null, media_url: '/audio/exam/l_mcma_gig_economy.mp3',
            options: JSON.stringify({ choices: [
                { label: 'A', text: 'The speaker believes flexibility is genuinely valuable for some workers.' },
                { label: 'B', text: 'The speaker thinks irregular hours are an acceptable trade for freedom.' },
                { label: 'C', text: 'The speaker notes that contractor status removes access to social protections.' },
                { label: 'D', text: 'The speaker argues the gig economy should be abolished immediately.' },
                { label: 'E', text: 'The speaker claims income volatility is rare among gig workers.' }
            ] }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'A, C',
            answer_key: JSON.stringify({ type: 'mcma', correct: ['A', 'C'], model_answer: 'A, C', explanations: { A: '"for parents or students that flexibility is genuinely valuable".', B: 'Rejected — the speaker calls income volatility a cost, not an acceptable trade.', C: '"classified as independent contractors, which removes access to paid leave, sick pay and pension".', D: 'Never stated; the speaker seeks reform, not abolition.', E: 'Contradicted: "no guarantee of work from one week to the next".' } }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'listening_fill_blanks', title: 'Listening Fill in the Blanks 1 — Academic Integrity', max_score: 10, prep_seconds: 0, time_limit_seconds: 120, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Type the missing words into the gaps as you hear them.',
            passage: 'Academic integrity depends on the principle that [blank1] must be distinguished from one\u2019s own work. Paraphrasing is often misunderstood as merely [blank2] a few words, but genuine paraphrase requires restating the idea entirely in your own sentence structure. When sources are not [blank3], even unintentional omissions can amount to misconduct.',
            media_url: '/audio/exam/l_fib_academic_integrity.mp3',
            options: JSON.stringify({ bank: ['others\u2019', 'replacing', 'acknowledged'] }),
            scored_enabling: JSON.stringify(['spelling', 'vocabulary']),
            model_answer: 'others\u2019 / replacing / acknowledged',
            answer_key: JSON.stringify({ type: 'listening_fill_blanks', answers: { blank1: ["others'", 'others\u2019', 'others'], blank2: ['replacing', 'changing', 'substituting'], blank3: ['acknowledged', 'cited', 'referenced', 'credited'] }, model_answer: 'others\u2019 / replacing / acknowledged' }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'listening_fill_blanks', title: 'Listening Fill in the Blanks 2 — Coral Spawning', max_score: 10, prep_seconds: 0, time_limit_seconds: 120, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Type the missing words into the gaps as you hear them.',
            passage: 'Coral spawning is one of nature\u2019s most [blank1] events, occurring only a few nights each year. Timing is governed by water temperature and by the lunar [blank2], and the entire reef must release its eggs simultaneously to maximise the chance of [blank3].',
            media_url: '/audio/exam/l_fib_coral_spawning.mp3',
            options: JSON.stringify({ bank: ['spectacular', 'cycle', 'fertilisation'] }),
            scored_enabling: JSON.stringify(['spelling', 'vocabulary']),
            model_answer: 'spectacular / cycle / fertilisation',
            answer_key: JSON.stringify({ type: 'listening_fill_blanks', answers: { blank1: ['spectacular', 'amazing', 'remarkable'], blank2: ['cycle', 'calendar', 'phase'], blank3: ['fertilisation', 'fertilization', 'fertilise', 'success'] }, model_answer: 'spectacular / cycle / fertilisation' }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'listening_fill_blanks', title: 'Listening Fill in the Blanks 3 — Renewable Storage', max_score: 10, prep_seconds: 0, time_limit_seconds: 120, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Type the missing words into the gaps as you hear them.',
            passage: 'The main obstacle to a fully renewable grid is not generation but [blank1]. Solar panels produce power only in daylight, so utilities must store excess energy for evening [blank2]. Battery costs have fallen sharply, yet large-scale storage remains [blank3] in most regions.',
            media_url: '/audio/exam/l_fib_renewable_storage.mp3',
            options: JSON.stringify({ bank: ['storage', 'demand', 'expensive'] }),
            scored_enabling: JSON.stringify(['spelling', 'vocabulary']),
            model_answer: 'storage / demand / expensive',
            answer_key: JSON.stringify({ type: 'listening_fill_blanks', answers: { blank1: ['storage', 'storing'], blank2: ['demand', 'use', 'hours'], blank3: ['expensive', 'costly', 'scarce'] }, model_answer: 'storage / demand / expensive' }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'highlight_correct_summary', title: 'Highlight Correct Summary — Urban Greening', max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Choose the summary that best represents what you heard.',
            passage: null, media_url: '/audio/exam/l_hcs_urban_greening.mp3',
            options: JSON.stringify({ choices: [
                { label: 'A', text: 'European cities plant green corridors mainly to reduce stormwater costs, and the social benefits were found to be minimal.' },
                { label: 'B', text: 'Green corridors lower temperatures, ease drainage and help pollinators, but the standout finding was improved resident wellbeing and social connection.' },
                { label: 'C', text: 'Green corridors are too expensive to justify, since tree-lined avenues cool streets by only a degree or two.' },
                { label: 'D', text: 'Pollinating insects are the only measurable beneficiaries of the green corridors evaluated across Europe.' }
            ] }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'B',
            answer_key: JSON.stringify({ type: 'mcsa', correct: ['B'], model_answer: 'B', explanations: { B: 'Captures all four points and the emphasised social finding.', A: 'Reverses the emphasis — social benefits were "the most important finding".', C: 'Contradicted by "up to four degrees" and no cost criticism is made.', D: 'Contradicted — temperature, drainage and wellbeing were all measured.' } }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'mcsa', title: 'Listening MCQ, Single Answer — Deep Sea Mining', max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. Choose the ONE statement that best reflects the speaker\u2019s position.',
            passage: null, media_url: '/audio/exam/l_mcsa_deep_sea_mining.mp3',
            options: JSON.stringify({ choices: [
                { label: 'A', text: 'The speaker fully supports deep sea mining because nodules contain abundant metals.' },
                { label: 'B', text: 'The speaker is cautious, arguing that poorly understood ecosystems and viable recycling alternatives argue against proceeding.' },
                { label: 'C', text: 'The speaker believes electric vehicles do not actually require cobalt or nickel.' },
                { label: 'D', text: 'The speaker thinks abyssal ecosystems would recover within a few years of mining.' }
            ] }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'B',
            answer_key: JSON.stringify({ type: 'mcsa', correct: ['B'], model_answer: 'B', explanations: { B: 'Balances the acknowledged resource need against "damage that lasts centuries" and the recycling alternative.', A: 'Contradicted by "The difficulty is...".', C: 'Never questioned — metals are called essential.', D: 'Contradicted: damage "may last centuries".' } }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'highlight_missing_words', title: 'Highlight Missing Words — Remote Collaboration', max_score: 10, prep_seconds: 0, time_limit_seconds: 75, audio_play_policy: 'once',
            prompt: 'You will hear a recording. It plays ONLY ONCE. As you listen, select the word that fills each gap in the displayed text.',
            passage: 'Distributed teams often assume that collaboration improves with more [blank1], yet the opposite is frequently true. Every additional meeting fragments the working day, and focused work requires [blank2] blocks of uninterrupted time. The most productive organisations therefore treat attention as a [blank3] resource and protect it deliberately.',
            media_url: '/audio/exam/l_hmw_remote_collaboration.mp3',
            media_note: null,
            options: JSON.stringify({ blank1: ['tools', 'people', 'budget'], blank2: ['sustained', 'brief', 'random'], blank3: ['finite', 'unlimited', 'ornamental'] }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'tools / sustained / finite',
            answer_key: JSON.stringify({ type: 'highlight_missing_words', answers: { blank1: 'tools', blank2: 'sustained', blank3: 'finite' }, model_answer: 'tools / sustained / finite' }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation 1', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it, paying close attention to spelling and punctuation.',
            passage: null, media_url: '/audio/exam/wfd_student_repository.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'Comprehensive research reports are available in the online student repository.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'Comprehensive research reports are available in the online student repository.', word_range: [10, 10], key_points: ['comprehensive', 'research', 'reports', 'available', 'online', 'student', 'repository'] }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation 2', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it, paying close attention to spelling and punctuation.',
            passage: null, media_url: '/audio/exam/wfd_energy_conservation.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'Financial incentives are effective tools for encouraging industrial energy conservation.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'Financial incentives are effective tools for encouraging industrial energy conservation.', word_range: [12, 12], key_points: ['financial', 'incentives', 'effective', 'tools', 'encouraging', 'industrial', 'energy', 'conservation'] }) },

        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation 3', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it, paying close attention to spelling and punctuation.',
            passage: null, media_url: '/audio/exam/wfd_consultation_essential.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'The committee agreed that further consultation with local residents was absolutely essential.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'The committee agreed that further consultation with local residents was absolutely essential.', word_range: [14, 14], key_points: ['committee', 'agreed', 'further', 'consultation', 'local', 'residents', 'absolutely', 'essential'] }) },

        /* --- 1 further WFD folded in from the retired seed_pte_full.js bank.
               (Its sibling "Write from Dictation 5" was held back on purpose:
                the real exam has 3-4 WFDs, so 4 keeps the type in spec.) --- */
        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation 4', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it, paying close attention to spelling and punctuation.',
            passage: null, media_url: '/audio/exam/wfd_philosophy_reschedule.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'The introductory philosophy lecture has been rescheduled to Thursday afternoon.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'The introductory philosophy lecture has been rescheduled to Thursday afternoon.', word_range: [10, 10], key_points: ['introductory', 'philosophy', 'lecture', 'rescheduled', 'thursday', 'afternoon'] }) }
    ]
};

/** Shorter section-practice set retained for targeted drilling. */
const ptePracticeTest = {
    title: 'PTE Section Practice — Essay & Dictation Drill',
    exam_type: 'PTE',
    description: 'Short targeted practice set: one Write Essay and two Write from Dictation items. Audio plays ONCE only. Use this for quick daily drills rather than full-test simulation.',
    total_time_minutes: 35,
    questions: [
        { part: 1, part_title: 'Part 1: Speaking & Writing', module: 'writing', question_type: 'write_essay', title: 'Write Essay — Public Transport Investment', max_score: 15, prep_seconds: 0, time_limit_seconds: 1200, audio_play_policy: 'none',
            prompt: 'You have 20 minutes to write an essay of 200–300 words.\n\nTopic: Some people think governments should spend money on public transport rather than on new roads. To what extent do you agree or disagree?',
            passage: null, media_url: null, options: null, scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'Governments face a persistent choice between widening roads and improving public transport, and I largely favour the latter because rail and bus networks move more people through the same space while producing far lower emissions per passenger.\n\nBuilding additional road capacity frequently fails to ease congestion, a phenomenon known as induced demand: whenever a route becomes faster, more drivers choose it until the advantage disappears. Public transport avoids this trap, since a single metro line can carry tens of thousands of travellers each hour without expanding the footprint of the city.\n\nThere are, admittedly, cases where road works are justified, particularly on rural routes where no viable alternative exists. Even so, the balance of spending should favour reliable, frequent and affordable public services.\n\nIn conclusion, while some road investment remains necessary, prioritising public transport delivers cleaner air, shorter commutes and more equitable access to employment.',
            answer_key: JSON.stringify({ type: 'write_essay', word_range: [200, 300], target_words: 240, model_answer: 'Governments face a persistent choice between widening roads and improving public transport, and I largely favour the latter because rail and bus networks move more people through the same space while producing far lower emissions per passenger. Building additional road capacity frequently fails to ease congestion, a phenomenon known as induced demand: whenever a route becomes faster, more drivers choose it until the advantage disappears. Public transport avoids this trap, since a single metro line can carry tens of thousands of travellers each hour without expanding the footprint of the city. There are, admittedly, cases where road works are justified, particularly on rural routes where no viable alternative exists. Even so, the balance of spending should favour reliable, frequent and affordable public services. In conclusion, while some road investment remains necessary, prioritising public transport delivers cleaner air, shorter commutes and more equitable access to employment.', key_points: ['public transport', 'roads', 'induced demand', 'emissions', 'metro', 'conclusion'] }) },
        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation — Seminar Room', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it.',
            passage: null, media_url: '/audio/exam/wfd_seminar_room.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'The seminar room on the third floor has been reserved for the entire afternoon.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'The seminar room on the third floor has been reserved for the entire afternoon.', word_range: [14, 14], key_points: ['seminar', 'room', 'third', 'floor', 'reserved', 'entire', 'afternoon'] }) },
        { part: 3, part_title: 'Part 3: Listening', module: 'listening', question_type: 'write_from_dictation', title: 'Write from Dictation — Peer Review', max_score: 10, prep_seconds: 0, time_limit_seconds: 90, audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it.',
            passage: null, media_url: '/audio/exam/wfd_peer_review.mp3',
            options: null, scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'All submitted drafts will undergo anonymous peer review before publication.',
            answer_key: JSON.stringify({ type: 'write_from_dictation', model_answer: 'All submitted drafts will undergo anonymous peer review before publication.', word_range: [11, 11], key_points: ['submitted', 'drafts', 'undergo', 'anonymous', 'peer', 'review', 'publication'] }) }
    ]
};

const { gurullyMistakeTest } = require('./gurully_drill_data');

const allTests = [pteFullTest, ptePracticeTest, gurullyMistakeTest];

const INSERT_TEST = `INSERT INTO tests (title, exam_type, description, total_time_minutes)
                     VALUES (?, ?, ?, ?)`;

const INSERT_QUESTION = `INSERT INTO questions
    (test_id, module, question_type, title, prompt, passage, media_url, options, answer_key,
     max_score, item_order, part, part_title, audio_play_policy, prep_seconds, time_limit_seconds,
     model_answer, rubric, scored_enabling)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

async function seed() {
    await initDB();
    console.log('Seeding PTE Academic content bank...');

    await runQuery('DELETE FROM mistake_logs');
    await runQuery('DELETE FROM user_responses');
    await runQuery('DELETE FROM test_attempts');
    await runQuery('DELETE FROM questions');
    await runQuery('DELETE FROM tests');

    for (const testData of allTests) {
        const res = await runQuery(INSERT_TEST, [
            testData.title, testData.exam_type, testData.description, testData.total_time_minutes
        ]);
        const testId = res.lastID;
        console.log(`Created "${testData.title}" (id ${testId}) — ${testData.questions.length} items, ${testData.total_time_minutes} min`);

        for (const [index, q] of testData.questions.entries()) {
            await runQuery(INSERT_QUESTION, [
                testId, q.module, q.question_type, q.title, q.prompt, q.passage, q.media_url,
                q.options, q.answer_key, q.max_score, index + 1,
                q.part || 1, q.part_title || null, q.audio_play_policy || 'none',
                q.prep_seconds || 0, q.time_limit_seconds || 0,
                q.model_answer || null, null, q.scored_enabling || null
            ]);
        }
    }

    console.log('Seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
