# Run PTE Full Practice with Docker

Install Docker Engine with the Compose plugin, or Docker Desktop. Run these commands from the repository root:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost:3000. The default image includes one 49-item mock and two practice drills. It uses the audio bundled in the repository and needs no speech-service connection during the build. The container runs as a non-root user.

Compose publishes the port on localhost by default. Attempts and speaking recordings live in a named volume mounted at `/data`; restarting or rebuilding the container preserves them. On first boot, the app copies a clean question-bank template into that volume. It never imports a database or recordings from your checkout.

## Build all 30 mocks

```bash
PTE_INCLUDE_FULL_BANK=true docker compose build
PTE_INCLUDE_FULL_BANK=true docker compose up -d
```

The builder creates the additional mock tests and uses `edge-tts` to generate their audio. This build needs internet access to the speech service and can take time; it fails if audio generation or integrity verification fails. Python and the speech tool remain in the builder stage, outside the runtime image.

A volume initialized with the smaller bank retains that bank after an image upgrade. To use the full bank without losing existing attempts, run the generator against the volume after building and starting the full image:

```bash
docker compose exec pte node database/generate_mock_bank.js
```

This adds missing mocks without reseeding. Do not run `database/seed.js` against an existing practice database. The full image includes the audio required by these new questions.

## Host on a server

Clone this repository on a Linux server and use the same Compose command. Keep the localhost binding and put an HTTPS reverse proxy in front of port 3000. HTTPS is required for browser microphone access away from localhost.

Copy `.env.example` to `.env`, then set `PTE_REQUIRE_AUTH=1` and choose a strong `PTE_SITE_PASSWORD`. The sign-in username is `practice`. Store the password on the host, outside Git. Restart with `docker compose up -d` after changing the settings.

The shared password gives everyone using it access to the same attempts and recordings. This app does not isolate learners into separate accounts; a public source repository does not require a publicly accessible practice database.

If your HTTPS proxy runs in Docker, connect it to the same Compose network and proxy to `pte:3000`. Keep the app's persistent volume mounted and run only one app container for each SQLite database.

## Stop, update and back up

```bash
docker compose logs --tail=100 pte
docker compose stop
docker compose up -d --build
```

`docker compose down` removes the container and network while retaining the named volume. `docker compose down -v` deletes your practice data.

For a consistent backup, stop the app before copying the database and recordings:

```bash
mkdir -p backups
docker compose stop pte
docker compose cp pte:/data backups/practice-data
docker compose start pte
```

Keep these backups private. Check that the backup contains `practice.db` and any `uploads/audio` recordings before using it for a restore. To restore, stop the app and copy the saved data into its `/data` volume; preserve ownership for the container's `node` user (UID 1000).

## Docker without Compose

```bash
docker build -t pte-full-practice-community .
docker run -d --name pte-practice --init \
  -p 127.0.0.1:3000:3000 \
  -v pte-practice-data:/data \
  --restart unless-stopped \
  pte-full-practice-community
```

Add `--build-arg INCLUDE_FULL_BANK=true` to the build command for the expanded bank. For private internet hosting, pass the authentication settings with an untracked `--env-file` and use an HTTPS proxy.
