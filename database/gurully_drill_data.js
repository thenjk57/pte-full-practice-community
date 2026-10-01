/** Original practice drill for fluency, grammar and precision. */

const gurullyMistakeTest = {
    title: 'PTE Targeted Practice — Fluency, Grammar & Precision Drill',
    exam_type: 'PTE',
    description: 'Practice speaking fluency, writing grammar, paragraph ordering, multiple-choice accuracy, summaries and dictation.',
    total_time_minutes: 50,
    questions: [
        /* ====================================================================
         * PART 1 — SPEAKING & WRITING (Items 1 - 10)
         * ==================================================================== */
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'read_aloud',
            title: 'Read Aloud 1 — AI in Healthcare (Oral Fluency Drill)',
            max_score: 10,
            prep_seconds: 35,
            time_limit_seconds: 40,
            audio_play_policy: 'none',
            prompt: 'Look at the text below. You have 35 seconds to prepare. Read the text aloud in 40 seconds.\n\n⚠️ FLUENCY FOCUS: Maintain an unbroken, natural rhythm. If you mispronounce or skip a word, NEVER pause or self-correct—continue moving forward with confidence.',
            passage: 'Artificial intelligence is rapidly transforming modern clinical medicine by assisting radiologists in interpreting complex medical imaging. Deep learning algorithms can detect subtle anomalies that may escape human observation, thereby expediting diagnoses and facilitating earlier clinical interventions. Nevertheless, healthcare practitioners emphasize that automated systems must complement, rather than supersede, professional medical judgment.',
            media_url: null,
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Artificial intelligence is rapidly transforming modern clinical medicine by assisting radiologists in interpreting complex medical imaging. Deep learning algorithms can detect subtle anomalies that may escape human observation, thereby expediting diagnoses and facilitating earlier clinical interventions. Nevertheless, healthcare practitioners emphasize that automated systems must complement, rather than supersede, professional medical judgment.',
            answer_key: JSON.stringify({
                type: 'read_aloud',
                target_words: 45,
                model_answer: 'Artificial intelligence is rapidly transforming modern clinical medicine by assisting radiologists in interpreting complex medical imaging. Deep learning algorithms can detect subtle anomalies that may escape human observation, thereby expediting diagnoses and facilitating earlier clinical interventions. Nevertheless, healthcare practitioners emphasize that automated systems must complement, rather than supersede, professional medical judgment.',
                key_points: ['artificial', 'intelligence', 'transforming', 'clinical', 'medicine', 'radiologists', 'imaging', 'algorithms', 'anomalies', 'diagnoses', 'interventions', 'complement', 'supersede', 'judgment']
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'read_aloud',
            title: 'Read Aloud 2 — Grid Energy Storage (Rhythmic Chunking Drill)',
            max_score: 10,
            prep_seconds: 35,
            time_limit_seconds: 40,
            audio_play_policy: 'none',
            prompt: 'You have 35 seconds to prepare. Read the passage aloud in 40 seconds.\n\n⚠️ FLUENCY FOCUS: Group words into meaningful grammatical phrases (chunks). Only take slight, natural pauses at punctuation marks.',
            passage: 'Transitioning to renewable electricity requires robust energy storage infrastructure to manage the intermittent nature of solar and wind generation. Grid-scale lithium-ion battery installations and pumped-storage hydroelectric facilities are vital components of modern power grids. By capturing surplus power during peak generation periods, utility providers ensure reliable electricity distribution during periods of heightened consumer demand.',
            media_url: null,
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation']),
            model_answer: 'Transitioning to renewable electricity requires robust energy storage infrastructure to manage the intermittent nature of solar and wind generation. Grid-scale lithium-ion battery installations and pumped-storage hydroelectric facilities are vital components of modern power grids. By capturing surplus power during peak generation periods, utility providers ensure reliable electricity distribution during periods of heightened consumer demand.',
            answer_key: JSON.stringify({
                type: 'read_aloud',
                target_words: 47,
                model_answer: 'Transitioning to renewable electricity requires robust energy storage infrastructure to manage the intermittent nature of solar and wind generation. Grid-scale lithium-ion battery installations and pumped-storage hydroelectric facilities are vital components of modern power grids. By capturing surplus power during peak generation periods, utility providers ensure reliable electricity distribution during periods of heightened consumer demand.',
                key_points: ['transitioning', 'renewable', 'electricity', 'storage', 'infrastructure', 'intermittent', 'solar', 'wind', 'battery', 'hydroelectric', 'grids', 'surplus', 'distribution', 'demand']
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'repeat_sentence',
            title: 'Repeat Sentence 1 — Identification Cards (Immediate Flow)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 15,
            audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it immediately without hesitation.\n\n⚠️ FLUENCY FOCUS: Speak immediately after the tone. Even if you miss the ending, deliver what you heard smoothly with 100% continuous cadence.',
            passage: null,
            media_url: '/audio/exam/rs_science_block.mp3',
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            model_answer: 'Students must collect their identification cards from the science block before Tuesday.',
            answer_key: JSON.stringify({
                type: 'repeat_sentence',
                model_answer: 'Students must collect their identification cards from the science block before Tuesday.',
                key_points: ['students', 'collect', 'identification', 'cards', 'science', 'block', 'before', 'tuesday'],
                target_words: 13
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'repeat_sentence',
            title: 'Repeat Sentence 2 — Research Proposals (Steady Cadence)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 15,
            audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it exactly as you hear it.\n\n⚠️ FLUENCY FOCUS: Do not rush or pause between words. Speak clearly at a moderate conversational pace.',
            passage: null,
            media_url: '/audio/exam/rs_proposal_deadline.mp3',
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            model_answer: 'All research proposals must be submitted electronically before five o\u2019clock on Friday.',
            answer_key: JSON.stringify({
                type: 'repeat_sentence',
                model_answer: 'All research proposals must be submitted electronically before five o\u2019clock on Friday.',
                key_points: ['research', 'proposals', 'submitted', 'electronically', 'before', 'five', 'clock', 'friday'],
                target_words: 12
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'repeat_sentence',
            title: 'Repeat Sentence 3 — Seminar Registration (Zero Stuttering)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 15,
            audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Repeat it clearly without repeating words or hesitating.',
            passage: null,
            media_url: '/audio/exam/rs_seminar_registration.mp3',
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'grammar']),
            model_answer: 'Registration for the optional seminar closes at noon on the first day of term.',
            answer_key: JSON.stringify({
                type: 'repeat_sentence',
                model_answer: 'Registration for the optional seminar closes at noon on the first day of term.',
                key_points: ['registration', 'optional', 'seminar', 'closes', 'noon', 'first', 'day', 'term'],
                target_words: 13
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'describe_image',
            title: 'Describe Image — Renewable Energy (4-Step Template Drill)',
            max_score: 10,
            prep_seconds: 25,
            time_limit_seconds: 40,
            audio_play_policy: 'none',
            prompt: 'You have 25 seconds to prepare. Describe the image in 40 seconds.\n\n⚠️ TEMPLATE DRILL: Use 4 structured sentences without pausing:\n1. Overview: "The given bar chart illustrates..."\n2. Highest figure: "Solar represents the largest share at 45 percent..."\n3. Lowest figure: "In contrast, bioenergy is the lowest at 10 percent..."\n4. Conclusion: "Overall, solar and wind constitute the vast majority of renewable output."',
            passage: null,
            media_url: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            options: JSON.stringify({
                chart: {
                    type: 'bar',
                    title: 'Global Renewable Energy Consumption by Source',
                    subtitle: 'Share of total renewable output, 2015–2025',
                    xLabel: 'Energy source',
                    yLabel: 'Percentage (%)',
                    categories: ['Solar', 'Wind', 'Hydro', 'Bioenergy'],
                    series: [{ name: 'Share', values: [45, 30, 15, 10] }]
                }
            }),
            model_answer: 'The bar chart illustrates the share of global renewable energy consumption by source between 2015 and 2025. Solar accounts for the largest share at forty-five percent, followed by wind at thirty percent. Hydro represents fifteen percent, while bioenergy is the smallest at only ten percent. Overall, solar and wind together dominate global renewable output.',
            answer_key: JSON.stringify({
                type: 'describe_image',
                target_words: 55,
                model_answer: 'The bar chart illustrates the share of global renewable energy consumption by source between 2015 and 2025. Solar accounts for the largest share at forty-five percent, followed by wind at thirty percent. Hydro represents fifteen percent, while bioenergy is the smallest at only ten percent. Overall, solar and wind together dominate global renewable output.',
                key_points: ['bar', 'chart', 'renewable', 'energy', 'solar', 'forty-five', 'wind', 'thirty', 'hydro', 'fifteen', 'bioenergy', 'ten', 'largest', 'smallest', 'overall']
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'retell_lecture',
            title: 'Re-tell Lecture — Urban Transit Systems (Note-taking & Fluency)',
            max_score: 10,
            prep_seconds: 10,
            time_limit_seconds: 40,
            audio_play_policy: 'once',
            prompt: 'You will hear a lecture. After listening, in 10 seconds, speak into the microphone and retell what you heard.\n\n⚠️ FLUENCY FOCUS: Note 3 key phrases during audio. Deliver a smooth 35-second response using transition phrases ("The speaker discussed...", "Furthermore, it was noted that...", "In conclusion..."). Avoid long pauses.',
            passage: null,
            media_url: '/audio/exam/rl_urban_transit.mp3',
            options: null,
            scored_enabling: JSON.stringify(['fluency', 'pronunciation', 'content']),
            model_answer: 'The lecture discussed the capacity constraints of urban transport systems in expanding metropolises. The speaker explained that conventional bus and rail networks face severe overcrowding during peak hours, and simply adding more vehicles often increases street congestion. The proposed solution involves integrating intelligent transit routing with dedicated light-rail corridors to maintain sustainable commuter flow.',
            answer_key: JSON.stringify({
                type: 'retell_lecture',
                target_words: 50,
                model_answer: 'The lecture discussed the capacity constraints of urban transport systems in expanding metropolises. The speaker explained that conventional bus and rail networks face severe overcrowding during peak hours, and simply adding more vehicles often increases street congestion. The proposed solution involves integrating intelligent transit routing with dedicated light-rail corridors to maintain sustainable commuter flow.',
                key_points: ['urban', 'transport', 'systems', 'capacity', 'constraints', 'overcrowding', 'bus', 'rail', 'congestion', 'intelligent', 'transit', 'routing', 'light-rail', 'corridors']
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'speaking',
            question_type: 'answer_short_question',
            title: 'Answer Short Question — Medical Specialist',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 10,
            audio_play_policy: 'once',
            prompt: 'You will hear a question. Give a simple and short answer in one or a few words.',
            passage: null,
            media_url: '/audio/exam/asq_heart_doctor.mp3',
            options: null,
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'cardiologist',
            answer_key: JSON.stringify({
                type: 'answer_short_question',
                correct: ['cardiologist', 'cardiologists', 'heart specialist', 'a cardiologist'],
                model_answer: 'cardiologist'
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'writing',
            question_type: 'summarize_written_text',
            title: 'Summarize Written Text — Urban Green Spaces (Single-Sentence Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 600,
            audio_play_policy: 'none',
            prompt: 'Read the passage below and summarize it in ONE SINGLE SENTENCE between 35 and 45 words. You have 10 minutes.\n\n⚠️ CRITICAL CHECKS (Fixing SWT Content & Grammar):\n1. Must be exactly ONE sentence ending with a single period (.). Writing two sentences scores 0 for Form!\n2. Use a clean compound-complex pattern: "Although [Contrasting Point], [Main Idea 1] because [Supporting Detail 1]."\n3. Keep your vocabulary natural and directly grounded in the text.',
            passage: 'Urban green spaces, such as public parks, community gardens, and tree-lined avenues, provide indispensable ecological and psychological benefits to city dwellers. Ecologically, these vegetated areas mitigate the urban heat island effect by cooling ambient air through evapotranspiration and shading impervious surfaces. Furthermore, urban vegetation absorbs carbon dioxide, filters particulate pollutants, and mitigates stormwater runoff during intense precipitation events.\n\nFrom a public health perspective, regular exposure to nature within metropolitan environments has been shown to reduce psychological stress, encourage physical exercise, and foster community cohesion. Despite these documented advantages, rapid urban development frequently encroaches upon existing green spaces, leading urban planners to advocate for compulsory green infrastructure quotas in contemporary municipal zoning policies.\n\nEconomically, the presence of well-maintained green spaces often drives up local property values and attracts tourism, thereby boosting the municipal tax base. Cities that invest heavily in extensive park networks frequently observe a high return on investment due to the corresponding influx of highly skilled workers seeking an improved quality of life. Consequently, preserving urban vegetation is not only an environmental and health imperative, but also a cornerstone of robust economic urban planning.',
            media_url: null,
            options: null,
            scored_enabling: JSON.stringify(['grammar', 'vocabulary', 'form', 'content']),
            model_answer: 'Although rapid urban development constantly threatens metropolitan green spaces, preserving parks and vegetation remains essential because they deliver vital ecological cooling, reduce airborne pollutants, and significantly enhance public health.',
            answer_key: JSON.stringify({
                type: 'summarize_written_text',
                word_range: [5, 75],
                target_words: 40,
                required_sentences: 1,
                model_answer: 'Although rapid urban development constantly threatens metropolitan green spaces, preserving parks and vegetation remains essential because they deliver vital ecological cooling, reduce airborne pollutants, and significantly enhance public health.',
                key_points: ['green', 'spaces', 'parks', 'ecological', 'heat', 'cooling', 'pollutants', 'health', 'urban', 'development']
            })
        },
        {
            part: 1,
            part_title: 'Part 1: Speaking & Writing',
            module: 'writing',
            question_type: 'write_essay',
            title: 'Write Essay — Remote Working (Grammar & Form Reset: 220–250 Words)',
            max_score: 15,
            prep_seconds: 0,
            time_limit_seconds: 1200,
            audio_play_policy: 'none',
            prompt: 'You have 20 minutes to plan, write and revise an essay of 200–300 words. Read the topic in the passage box below.\n\n⚠️ CRITICAL INSTRUCTION (Practising Grammar & Form):\n1. Word count must be strictly between 220 and 260 words.\n2. Do NOT use overly complex, artificial template words if they disrupt syntax. Use clear sentences and check grammar.\n3. Structure: 4 paragraphs (Intro with thesis, Advantage + example, Disadvantage + example, Conclusion).\n4. Spend the final 3 minutes proofreading for subject-verb agreement and spelling typos.',
            passage: 'Topic: In recent years, remote working has become widespread across many sectors. Do the advantages of working from home outweigh the disadvantages?',
            media_url: null,
            options: null,
            scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'discourse']),
            model_answer: 'In recent years, remote working has emerged as a standard practice across various industries, offering considerable benefits alongside notable challenges.\n\nThe most significant advantage of working from home is the improvement in work-life balance and the elimination of daily commuting. Without spending hours travelling to offices, employees can allocate more time to their personal well-being and families, while also saving substantial transportation costs. In addition, many professionals report higher productivity in home environments where office distractions and impromptu interruptions are minimized.\n\nHowever, remote working presents certain drawbacks that cannot be ignored. The blurring of boundaries between professional responsibilities and personal life often leads to longer working hours and employee burnout. Furthermore, virtual communication can impede spontaneous collaboration and weaken team cohesion, which is essential for creative problem-solving.\n\nIn conclusion, although remote employment poses challenges related to isolation and boundaries, its benefits in flexibility and time savings outweigh these concerns when managed effectively.',
            answer_key: JSON.stringify({
                type: 'write_essay',
                word_range: [200, 300],
                target_words: 240,
                model_answer: 'In recent years, remote working has emerged as a standard practice across various industries, offering considerable benefits alongside notable challenges. The most significant advantage of working from home is the improvement in work-life balance and the elimination of daily commuting. Without spending hours travelling to offices, employees can allocate more time to their personal well-being and families, while also saving substantial transportation costs. In addition, many professionals report higher productivity in home environments where office distractions and impromptu interruptions are minimized. However, remote working presents certain drawbacks that cannot be ignored. The blurring of boundaries between professional responsibilities and personal life often leads to longer working hours and employee burnout. Furthermore, virtual communication can impede spontaneous collaboration and weaken team cohesion, which is essential for creative problem-solving. In conclusion, although remote employment poses challenges related to isolation and boundaries, its benefits in flexibility and time savings outweigh these concerns when managed effectively.',
                key_points: ['remote working', 'work-life balance', 'commuting', 'productivity', 'drawbacks', 'boundaries', 'isolation', 'collaboration', 'conclusion']
            })
        },

        /* ====================================================================
         * PART 2 — READING (Items 11 - 14)
         * ==================================================================== */
        {
            part: 2,
            part_title: 'Part 2: Reading',
            module: 'reading',
            question_type: 'reorder_paragraphs',
            title: 'Re-order Paragraphs 1 — Scientific Publishing (Topic & Pairing Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 150,
            audio_play_policy: 'none',
            prompt: 'The text boxes on the left are in random order. Drag them into the correct order on the right.\n\n⚠️ STRATEGY TIP (Practising RO):\n1. Identify the independent topic sentence (no "these", "this", or "however").\n2. Match pronoun & article links: "personal letters" -> "This informal method" -> "scientific journals" -> "These early periodicals".',
            passage: null,
            media_url: null,
            options: JSON.stringify({
                boxes: [
                    { id: 'A', text: 'These early periodicals allowed researchers across Europe to debate findings and scrutinize experimental methods collaboratively.' },
                    { id: 'B', text: 'Before the seventeenth century, scientific knowledge was primarily communicated through personal letters between individual scholars.' },
                    { id: 'C', text: 'Today, this system of peer-reviewed publication has evolved into a global digital network of thousands of specialized academic journals.' },
                    { id: 'D', text: 'This informal method of correspondence changed dramatically in 1665 with the founding of the first official scientific journals in London and Paris.' }
                ]
            }),
            scored_enabling: JSON.stringify(['discourse', 'vocabulary']),
            model_answer: 'B -> D -> A -> C',
            answer_key: JSON.stringify({
                type: 'reorder',
                sequence: ['B', 'D', 'A', 'C'],
                model_answer: 'B -> D -> A -> C',
                explanations: {
                    'B': 'Independent topic sentence establishing communication prior to the 17th century.',
                    'D': 'Direct link: "This informal method of correspondence" refers back to personal letters in B.',
                    'A': 'Direct link: "These early periodicals" refers to the scientific journals mentioned in D.',
                    'C': 'Conclusion: "Today, this system..." brings the historical evolution to modern times.'
                }
            })
        },
        {
            part: 2,
            part_title: 'Part 2: Reading',
            module: 'reading',
            question_type: 'reorder_paragraphs',
            title: 'Re-order Paragraphs 2 — Martian Exploration (Chronology & Pronoun Links)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 150,
            audio_play_policy: 'none',
            prompt: 'Drag the text boxes into the correct order. Look for the question being posed, the mission launched to answer it, and the resulting discovery.',
            passage: null,
            media_url: null,
            options: JSON.stringify({
                boxes: [
                    { id: 'A', text: 'Equipped with sophisticated drill systems and spectrometers, it was tasked with assessing the planet\'s past habitability.' },
                    { id: 'B', text: 'For decades, planetary scientists have sought definitive evidence of whether Mars ever harbored microbial life.' },
                    { id: 'C', text: 'Preliminary samples analyzed by the rover confirmed that ancient lakebeds once possessed the chemical ingredients necessary for living organisms.' },
                    { id: 'D', text: 'To address this question, NASA launched the Curiosity rover in 2011 to explore the geological layers of Gale Crater.' }
                ]
            }),
            scored_enabling: JSON.stringify(['discourse', 'vocabulary']),
            model_answer: 'B -> D -> A -> C',
            answer_key: JSON.stringify({
                type: 'reorder',
                sequence: ['B', 'D', 'A', 'C'],
                model_answer: 'B -> D -> A -> C',
                explanations: {
                    'B': 'Broad opening statement presenting the decades-long scientific question.',
                    'D': '"To address this question" directly links to the inquiry in B, introducing Curiosity.',
                    'A': '"it was tasked" refers to Curiosity in D and details its scientific equipment.',
                    'C': '"Preliminary samples analyzed by the rover" presents the outcome of the mission.'
                }
            })
        },
        {
            part: 2,
            part_title: 'Part 2: Reading',
            module: 'reading',
            question_type: 'mcma',
            title: 'MCMA (Reading) — Desalination (Negative Marking Discipline Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 120,
            audio_play_policy: 'none',
            prompt: 'Read the passage and answer the multiple-choice question by selecting all correct responses.\n\n⚠️ STRATEGY DRILL (Practising MCMA):\nNegative marking applies (-1 for each incorrect choice). Select ONLY the option(s) you are 100% confident in. If in doubt about a second choice, DO NOT GUESS—submitting one correct answer gives you points; an incorrect second answer negates your score to zero!',
            passage: 'Desalination plants provide vital freshwater supplies in arid coastal regions, but conventional thermal and reverse-osmosis facilities consume substantial amounts of fossil fuel electricity. In response to mounting carbon emissions and high operational costs, engineers are integrating solar photovoltaics and wave-energy converters directly into water treatment facilities. Although the capital cost of installing renewable-powered desalination remains high, the long-term operational expenditures are remarkably low because sunlight and marine currents are free, inexhaustible resources. Furthermore, localized renewable installations eliminate the need to construct costly electrical transmission lines to remote coastal installations.',
            media_url: null,
            options: JSON.stringify({
                question: 'Which of the following statements about renewable-powered desalination are supported by the passage?',
                choices: [
                    { label: 'A', text: 'Renewable desalination plants have lower initial construction costs than conventional facilities.' },
                    { label: 'B', text: 'Operating expenses decrease over time because sunlight and marine currents are free.' },
                    { label: 'C', text: 'Wave energy is the sole renewable power source currently integrated with desalination.' },
                    { label: 'D', text: 'Remote coastal facilities avoid the expense of building long-distance power lines.' },
                    { label: 'E', text: 'Thermal desalination plants have been completely banned across coastal regions.' }
                ]
            }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'B, D',
            answer_key: JSON.stringify({
                type: 'mcma',
                correct: ['B', 'D'],
                model_answer: 'B, D',
                explanations: {
                    'B': 'Directly supported: "long-term operational expenditures are remarkably low because sunlight and marine currents are free".',
                    'D': 'Directly supported: "eliminate the need to construct costly electrical transmission lines to remote coastal installations".',
                    'A': 'Contradicted: "capital cost of installing renewable-powered desalination remains high".',
                    'C': 'Contradicted: Both solar photovoltaics and wave-energy converters are mentioned.',
                    'E': 'Not mentioned in the passage.'
                }
            })
        },
        {
            part: 2,
            part_title: 'Part 2: Reading',
            module: 'reading',
            question_type: 'reading_fill_blanks',
            title: 'Reading FIB (Drag & Drop) — Ecosystem Stability (Collocation Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 120,
            audio_play_policy: 'none',
            prompt: 'In the text below some words are missing. Drag words from the box below to the appropriate place in the text.',
            passage: 'Ecosystem resilience refers to the capacity of a biological community to [blank1] disturbances and return to its original structure. Ecologists have demonstrated that areas with higher species richness typically exhibit greater stability during environmental crises. When diverse species perform overlapping ecological roles, the loss of any single organism is unlikely to cause a catastrophic [blank2] of the entire food web. Maintaining biological diversity is therefore not merely an aesthetic consideration, but a fundamental [blank3] for long-term ecological survival.',
            media_url: null,
            options: JSON.stringify({
                options: ['withstand', 'collapse', 'prerequisite', 'accelerate', 'ornament', 'disrupt']
            }),
            scored_enabling: JSON.stringify(['vocabulary', 'grammar']),
            model_answer: 'withstand / collapse / prerequisite',
            answer_key: JSON.stringify({
                type: 'reading_fill_blanks',
                answers: {
                    blank1: 'withstand',
                    blank2: 'collapse',
                    blank3: 'prerequisite'
                },
                model_answer: 'withstand / collapse / prerequisite'
            })
        },

        /* ====================================================================
         * PART 3 — LISTENING (Items 15 - 19)
         * ==================================================================== */
        {
            part: 3,
            part_title: 'Part 3: Listening',
            module: 'listening',
            question_type: 'summarize_spoken_text',
            title: 'Summarize Spoken Text — Biodiversity Loss (50–70 Words & Clean Syntax)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 600,
            audio_play_policy: 'once',
            prompt: 'You will hear a short lecture. Write a 50–70 word summary in 10 minutes.\n\n⚠️ CRITICAL CHECKS (Practising SST):\n1. Word count: Keep strictly between 50 and 70 words. Fewer than 50 or more than 70 loses Form marks!\n2. Write 2–3 clear compound sentences: "The lecture explained that [Topic]. The speaker highlighted [Point 1] and discussed [Point 2]. In conclusion, [Final point]."\n3. Check every spelling before clicking Next.',
            passage: null,
            media_url: '/audio/exam/sst_biodiversity_loss.mp3',
            options: null,
            scored_enabling: JSON.stringify(['grammar', 'spelling', 'vocabulary', 'content']),
            model_answer: 'The lecture discussed the accelerating rate of global biodiversity loss caused by human activity and habitat destruction. The speaker highlighted that diminishing ecosystems threaten essential ecosystem services, including pollination, clean water, and climate regulation. In conclusion, preserving biological diversity is critical for sustainable development and requires immediate international conservation policies.',
            answer_key: JSON.stringify({
                type: 'summarize_spoken_text',
                word_range: [50, 70],
                target_words: 60,
                model_answer: 'The lecture discussed the accelerating rate of global biodiversity loss caused by human activity and habitat destruction. The speaker highlighted that diminishing ecosystems threaten essential ecosystem services, including pollination, clean water, and climate regulation. In conclusion, preserving biological diversity is critical for sustainable development and requires immediate international conservation policies.',
                key_points: ['biodiversity', 'loss', 'habitat', 'destruction', 'ecosystems', 'services', 'pollination', 'water', 'climate', 'conservation']
            })
        },
        {
            part: 3,
            part_title: 'Part 3: Listening',
            module: 'listening',
            question_type: 'mcma',
            title: 'MCMA (Listening) — Gig Economy (Negative Marking Control Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 90,
            audio_play_policy: 'once',
            prompt: 'Listen to the recording and select all correct responses.\n\n⚠️ NEGATIVE MARKING RULE: -1 for every incorrect choice. Pick only the options you heard directly. If in doubt, select just ONE solid choice.',
            passage: null,
            media_url: '/audio/exam/l_mcma_gig_economy.mp3',
            options: JSON.stringify({
                question: 'Which of the following aspects of the gig economy are highlighted by the speaker?',
                choices: [
                    { label: 'A', text: 'Workers enjoy complete scheduling autonomy without any financial uncertainty.' },
                    { label: 'B', text: 'Platform flexibility comes at the cost of unpredictable income and lack of benefits.' },
                    { label: 'C', text: 'Traditional employment models have been completely replaced in all modern industries.' },
                    { label: 'D', text: 'Algorithmic management systems can create stress and continuous surveillance for gig workers.' }
                ]
            }),
            scored_enabling: JSON.stringify(['vocabulary']),
            model_answer: 'B, D',
            answer_key: JSON.stringify({
                type: 'mcma',
                correct: ['B', 'D'],
                model_answer: 'B, D',
                explanations: {
                    'B': 'Correct: The speaker contrasts flexibility with lack of job security and unpredictable income.',
                    'D': 'Correct: The speaker describes algorithmic monitoring and performance pressures.',
                    'A': 'Contradicted: Financial uncertainty is specifically cited.',
                    'C': 'Exaggerated: Traditional employment remains dominant in many sectors.'
                }
            })
        },
        {
            part: 3,
            part_title: 'Part 3: Listening',
            module: 'listening',
            question_type: 'listening_fill_blanks',
            title: 'Listening FIB — Renewable Energy Storage (Fast Spelling Drill)',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 75,
            audio_play_policy: 'once',
            prompt: 'You will hear a recording. Type the missing word in each gap. Pay close attention to spelling and plural endings.',
            passage: 'As renewable power expands, the primary challenge remains [blank1] the energy produced. Battery technologies have made substantial progress, but utility companies still require [blank2] systems that can release power over multiple days. Without such breakthroughs, transitioning completely away from fossil [blank3] will remain difficult.',
            media_url: '/audio/exam/l_fib_renewable_storage.mp3',
            options: null,
            scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'storing / scalable / fuels',
            answer_key: JSON.stringify({
                type: 'listening_fill_blanks',
                answers: {
                    blank1: 'storing',
                    blank2: 'scalable',
                    blank3: 'fuels'
                },
                model_answer: 'storing / scalable / fuels'
            })
        },
        {
            part: 3,
            part_title: 'Part 3: Listening',
            module: 'listening',
            question_type: 'write_from_dictation',
            title: 'Write from Dictation 1 — Examination Room Protocol',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 90,
            audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it. Check spelling and capitalization.',
            passage: null,
            media_url: '/audio/exam/wfd_exam_identity.mp3',
            options: null,
            scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'Participants were asked to verify their identity before entering the examination room.',
            answer_key: JSON.stringify({
                type: 'write_from_dictation',
                model_answer: 'Participants were asked to verify their identity before entering the examination room.',
                word_range: [11, 11],
                key_points: ['participants', 'asked', 'verify', 'identity', 'entering', 'examination', 'room']
            })
        },
        {
            part: 3,
            part_title: 'Part 3: Listening',
            module: 'listening',
            question_type: 'write_from_dictation',
            title: 'Write from Dictation 2 — Local Residents Consultation',
            max_score: 10,
            prep_seconds: 0,
            time_limit_seconds: 90,
            audio_play_policy: 'once',
            prompt: 'You will hear a sentence. It plays ONLY ONCE. Type the sentence exactly as you hear it. Check spelling and capitalization.',
            passage: null,
            media_url: '/audio/exam/wfd_consultation_essential.mp3',
            options: null,
            scored_enabling: JSON.stringify(['spelling', 'grammar']),
            model_answer: 'The committee agreed that further consultation with local residents was absolutely essential.',
            answer_key: JSON.stringify({
                type: 'write_from_dictation',
                model_answer: 'The committee agreed that further consultation with local residents was absolutely essential.',
                word_range: [11, 11],
                key_points: ['committee', 'agreed', 'further', 'consultation', 'local', 'residents', 'absolutely', 'essential']
            })
        }
    ]
};

module.exports = { gurullyMistakeTest };
