# PTE Full Practice

Free, open-source PTE practice that you can run on your own computer.

## Why I am opening this up

I started this project because every PTE practice website I tried wanted me to pay. I am having a hard time maintaining it on my own, so I am open sourcing it so we can work on it together and make PTE practice free and accessible.

If you can help fix bugs, improve the practice questions, check scoring, or make the app easier to use, I would welcome your contribution.

## What you can practise

- PTE mock tests and targeted drills for speaking, writing, reading and listening.
- Timed questions, audio prompts and microphone recordings.
- Estimated practice scores, feedback and attempt history stored locally.

This is an independent community project. Pearson does not endorse it. Practice scores are estimates; they do not predict or replace an official PTE result. Some question types and exam details still need work. Speaking responses without verified transcripts remain unverified.

## Run with Docker

```bash
docker compose up -d --build
```

Open <http://localhost:3000>. Docker stores attempts and recordings in a persistent volume. The default image includes the first mock and two drills; see [Docker hosting](docs/DOCKER.md) to build all 30 mocks, configure HTTPS and password protection, or back up your data.

## Run it locally

Install Node.js 22 or later and npm. Then run:

```bash
npm ci
npm run seed
npm run generate:audio
npm start
```

Open <http://localhost:3000> and allow microphone access when prompted. Audio generation uses [uv](https://docs.astral.sh/uv/getting-started/installation/) to run `edge-tts`, which needs an internet connection. On Linux, installing the SQLite dependency may require Python, make and a C++ compiler.

`npm run seed` clears the local database, including attempts. Use it on a fresh checkout. Back up existing practice data before reseeding.

### Add more mock tests

The repository includes openly licensed source extracts and attribution. To generate the expanded question bank and its audio:

```bash
npm run seed:bank
npm run generate:audio:bank
npm run verify:media
```

Generating audio for the full bank can take time. Generated files stay out of Git.

### Use another device

See [local-network setup](docs/LAN_SETUP.md) for HTTPS and microphone access on devices on the same trusted network. See [private deployment](docs/FLY_PRIVATE_DEPLOYMENT.md) for persistent storage and password protection on Fly.io.

The app shares attempts and recordings between everyone who can access the same server. Keep local access on a trusted network. For an internet deployment, configure `PTE_REQUIRE_AUTH=1` and set `PTE_SITE_PASSWORD` through your host's secret manager. The shared password does not provide separate user accounts.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md), open an issue, or send a pull request. Useful areas include:

- Checking question timing, content and answer keys against published exam guidance.
- Improving score estimates and verified speaking assessment.
- Fixing recording, playback, accessibility and mobile usability.
- Improving setup instructions and adding original, licensed practice content.

Run the automated tests with:

```bash
npm test
```

## Project notes

- [Exam reference and known differences](pte-exam.md)
- [Platform architecture](PTE_MASTERY_PLATFORM.md)
- [Mock content and scoring reference](PTE_FULL_MOCK_TEST.md)
- [Source attribution](content/sources/README.md)

The app uses Node.js, Express, SQLite and vanilla JavaScript. Practice attempts live in `database/practice.db` by default, and speaking recordings live in `uploads/audio/`. Keep both out of commits and issue attachments.

## License

Project code is available under the [ISC license](LICENSE), matching the existing package license. Wikipedia extracts and adaptations retain their [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) terms and attribution; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Third-party material keeps its own license.
