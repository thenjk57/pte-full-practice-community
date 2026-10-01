#!/usr/bin/env python3
"""
Generate studio-grade multi-accent neural audio for PTE exam items using edge-tts.
Voices assigned to reflect Pearson's official mix:
  - Australian English (en-AU-NatashaNeural, en-AU-WilliamMultilingualNeural)
  - British English (en-GB-RyanNeural, en-GB-SoniaNeural)
  - American English (en-US-ChristopherNeural, en-US-JennyNeural)
"""

import asyncio
import os
import sys

# Ensure edge-tts is importable; if not, suggest running with uvx / uv run
try:
    import edge_tts
except ImportError:
    print("edge_tts not installed in current Python env. Please run via:")
    print("  uv run --with edge-tts python scripts/generate_exam_audio.py")
    sys.exit(1)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "audio", "exam")

ITEMS = [
    # -------------------------------------------------------------
    # Repeat Sentence (Part 1 Speaking)
    # -------------------------------------------------------------
    {
        "filename": "rs_library_hours.mp3",
        "voice": "en-AU-WilliamMultilingualNeural",
        "text": "The university library will remain open until midnight during final examination week.",
        "rate": "+0%",
    },
    {
        "filename": "rs_proposal_deadline.mp3",
        "voice": "en-GB-RyanNeural",
        "text": "All research proposals must be submitted electronically before five o'clock on Friday.",
        "rate": "+0%",
    },
    {
        "filename": "rs_science_block.mp3",
        "voice": "en-US-JennyNeural",
        "text": "Students must collect their identification cards from the science block before Tuesday.",
        "rate": "+0%",
    },
    {
        "filename": "rs_seminar_registration.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": "Registration for the optional seminar closes at noon on the first day of term.",
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Re-tell Lecture (Part 1 Speaking)
    # -------------------------------------------------------------
    {
        "filename": "rl_urban_transit.mp3",
        "voice": "en-GB-RyanNeural",
        "text": (
            "Urban transport systems in large cities often reach their capacity limits, leading to severe bottlenecks during peak commute hours. "
            "For decades, city planners relied on expanding roadways to alleviate congestion, but this approach often induces more demand, ultimately worsening the problem. "
            "One highly effective modern response is the implementation of digital congestion pricing, which charges drivers a premium to enter specific zones during high-traffic periods. "
            "This economic lever not only encourages commuters to utilize public transport or adopt carpooling, but it also significantly reduces emissions in dense metropolitan centers. "
            "Furthermore, the substantial revenue generated from these tolls can be strategically reinvested into municipal infrastructure. "
            "Cities that have adopted this model have successfully funded extensive expansions of their light rail services, improved pedestrian walkways, and established dedicated cycle networks. "
            "Consequently, shifting the financial burden onto private vehicle usage creates a sustainable cycle that promotes cleaner, more efficient, and more equitable urban mobility."
        ),
        "rate": "+0%",
    },
    {
        "filename": "rl_sleep_memory.mp3",
        "voice": "en-AU-NatashaNeural",
        "text": (
            "Researchers have found that sleep plays a critical role in consolidating memory. "
            "During deep sleep the brain replays the events of the day and transfers information from short-term "
            "to long-term storage. Students who studied and then slept performed significantly better in recall "
            "tests than those who stayed awake for the same period."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Answer Short Question (Part 1 Speaking)
    # -------------------------------------------------------------
    {
        "filename": "asq_capital_australia.mp3",
        "voice": "en-AU-WilliamMultilingualNeural",
        "text": "What is the capital city of Australia?",
        "rate": "+0%",
    },
    {
        "filename": "asq_gas_photosynthesis.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": "Which gas do plants absorb from the atmosphere during photosynthesis?",
        "rate": "+0%",
    },
    {
        "filename": "asq_heart_doctor.mp3",
        "voice": "en-US-ChristopherNeural",
        "text": "What do you call a doctor who specialises in treating the heart?",
        "rate": "+0%",
    },
    {
        "filename": "asq_continents_count.mp3",
        "voice": "en-GB-RyanNeural",
        "text": "How many continents are there on Earth?",
        "rate": "+0%",
    },
    {
        "filename": "asq_century.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": "What do we call a period of one hundred years?",
        "rate": "+0%",
    },
    {
        "filename": "asq_thermometer.mp3",
        "voice": "en-US-JennyNeural",
        "text": "Which scientific instrument is used to measure ambient atmospheric temperature?",
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Summarize Spoken Text (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "sst_biodiversity_loss.mp3",
        "voice": "en-US-ChristopherNeural",
        "text": (
            "Biodiversity loss is currently accelerating across every major global ecosystem at unprecedented rates. "
            "Historically, mass extinctions were driven by massive geological or astronomical events, but the current crisis is distinctly anthropogenic. "
            "The primary drivers include widespread deforestation, which obliterates entire habitats overnight; habitat fragmentation, which isolates fragile animal populations and severely reduces their genetic diversity; and the looming shadow of climate disruption, which drastically alters the seasonal and temperature cues that countless species rely on for crucial breeding and migration cycles. "
            "When we talk about this loss, it is vital to understand the cascading effects. Scientists warn that losing individual species does not simply remove an organism from a checklist; it fundamentally weakens the intricate, interconnected ecological networks that our societies depend upon. "
            "These networks perform indispensable services that we often take for granted, such as naturally purifying our fresh water sources, pollinating agricultural crops, and even regulating the emergence of infectious diseases. "
            "If the foundation of these ecosystems collapses, the economic and health repercussions for human civilization will be profound. "
            "Therefore, implementing aggressive conservation policies, coupled with initiatives focused on preserving and actively reconnecting fragmented natural habitats, is absolutely essential. "
            "Ultimately, protecting biological diversity is not merely a philanthropic endeavor for wildlife conservation; it is an urgent prerequisite for ensuring the long-term stability and resilience of human food systems and global public health."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Listening Multiple Choice - Multiple Answers (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "l_mcma_gig_economy.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": (
            "The gig economy is often celebrated as a symbol of freedom, but the picture is more nuanced. "
            "Many workers value setting their own hours, and for parents or students that flexibility is genuinely valuable. "
            "However, the same irregularity that provides freedom also produces income volatility, since there is no guarantee "
            "of work from one week to the next. Crucially, gig workers are usually classified as independent contractors, which "
            "removes access to paid leave, sick pay and employer pension contributions. My own view is that flexibility has real worth, "
            "but not when it is used as a pretext to shift the entire burden of social protection onto the individual."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Listening Fill in the Blanks (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "l_fib_academic_integrity.mp3",
        "voice": "en-AU-NatashaNeural",
        "text": (
            "Academic integrity depends on the principle that the work of others must be distinguished from one's own work. "
            "Paraphrasing is often misunderstood as merely replacing a few words, but genuine paraphrase requires restating "
            "the idea entirely in your own sentence structure. When sources are not acknowledged, even unintentional omissions "
            "can amount to misconduct."
        ),
        "rate": "+0%",
    },
    {
        "filename": "l_fib_coral_spawning.mp3",
        "voice": "en-AU-WilliamMultilingualNeural",
        "text": (
            "Coral spawning is one of nature's most spectacular events, occurring only a few nights each year. "
            "Timing is governed by water temperature and by the lunar cycle, and the entire reef must release its "
            "eggs simultaneously to maximise the chance of fertilisation."
        ),
        "rate": "+0%",
    },
    {
        "filename": "l_fib_renewable_storage.mp3",
        "voice": "en-US-ChristopherNeural",
        "text": (
            "The main obstacle to a fully renewable grid is not generation but storage. Solar panels produce power only "
            "in daylight, so utilities must store excess energy for evening demand. Battery costs have fallen sharply, "
            "yet large-scale storage remains expensive in most regions."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Highlight Correct Summary (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "l_hcs_urban_greening.mp3",
        "voice": "en-GB-RyanNeural",
        "text": (
            "Cities across Europe have begun inserting green corridors — strips of parkland, tree-lined avenues and "
            "restored riverbanks — between dense neighbourhoods. Early evaluations show that these corridors lower "
            "street-level temperatures by up to four degrees, reduce stormwater runoff that would otherwise overwhelm drains, "
            "and give pollinating insects a continuous route through the built environment. The most important finding, however, "
            "was social: residents living within three hundred metres of a green corridor reported markedly higher life satisfaction "
            "and were more likely to know their neighbours."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Listening Multiple Choice - Single Answer (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "l_mcsa_deep_sea_mining.mp3",
        "voice": "en-AU-NatashaNeural",
        "text": (
            "Deep sea mining is promoted as the answer to our shortage of cobalt and nickel, both of which are essential for "
            "electric vehicle batteries. The seabed does indeed contain enormous polymetallic nodules rich in these metals. "
            "The difficulty is that we know very little about abyssal ecosystems, and harvesting them may cause damage that lasts "
            "centuries. Some geologists argue that land-based recycling of existing batteries could supply a large share of demand "
            "instead, which would avoid disturbing the ocean floor altogether."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Highlight Missing Words (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "l_hmw_remote_collaboration.mp3",
        "voice": "en-US-JennyNeural",
        "text": (
            "Distributed teams often assume that collaboration improves with more tools, yet the opposite is frequently true. "
            "Every additional meeting fragments the working day, and focused work requires sustained blocks of uninterrupted time. "
            "The most productive organisations therefore treat attention as a finite resource and protect it deliberately."
        ),
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Write from Dictation (Part 3 Listening)
    # -------------------------------------------------------------
    {
        "filename": "wfd_student_repository.mp3",
        "voice": "en-GB-RyanNeural",
        "text": "Comprehensive research reports are available in the online student repository.",
        "rate": "+0%",
    },
    {
        "filename": "wfd_energy_conservation.mp3",
        "voice": "en-AU-NatashaNeural",
        "text": "Financial incentives are effective tools for encouraging industrial energy conservation.",
        "rate": "+0%",
    },
    {
        "filename": "wfd_consultation_essential.mp3",
        "voice": "en-US-ChristopherNeural",
        "text": "The committee agreed that further consultation with local residents was absolutely essential.",
        "rate": "+0%",
    },
    {
        "filename": "wfd_philosophy_reschedule.mp3",
        "voice": "en-AU-WilliamMultilingualNeural",
        "text": "The introductory philosophy lecture has been rescheduled to Thursday afternoon.",
        "rate": "+0%",
    },
    {
        "filename": "wfd_exam_identity.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": "Participants were asked to verify their identity before entering the examination room.",
        "rate": "+0%",
    },

    # -------------------------------------------------------------
    # Practice Drill Items
    # -------------------------------------------------------------
    {
        "filename": "wfd_seminar_room.mp3",
        "voice": "en-AU-WilliamMultilingualNeural",
        "text": "The seminar room on the third floor has been reserved for the entire afternoon.",
        "rate": "+0%",
    },
    {
        "filename": "wfd_peer_review.mp3",
        "voice": "en-GB-SoniaNeural",
        "text": "All submitted drafts will undergo anonymous peer review before publication.",
        "rate": "+0%",
    },
]


async def generate_item(item: dict, out_dir: str):
    out_path = os.path.join(out_dir, item["filename"])
    voice = item["voice"]
    text = item["text"]
    rate = item.get("rate", "+0%")

    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(out_path)
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  [OK] {item['filename']} ({voice}) -> {size_kb:.1f} KB")


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Starting neural TTS audio generation ({len(ITEMS)} items)...")
    print(f"Destination: {os.path.abspath(OUTPUT_DIR)}\n")

    for item in ITEMS:
        await generate_item(item, OUTPUT_DIR)

    print("\nAll audio files generated successfully!")


if __name__ == "__main__":
    asyncio.run(main())
